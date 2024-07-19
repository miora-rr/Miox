const fs = require('fs');
const path = require('path');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const GoogleDriveService = require('./GoogleDriveService');
const DiscordMessagesService = require('./DiscordMessagesService');
const { threadId } = require('worker_threads');

class DiscordService {
    constructor() {
        this.googleDriveService = new GoogleDriveService();
        this.messageService = new DiscordMessagesService();
    }
    
    async askEventDetails(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        let channel = interaction.channel;
        const user = interaction.user;
        const filter = response => response.author.id === user.id;
    
        async function askQuestionDM(question) {
            const dmChannel = await user.createDM();
            try {
                await dmChannel.send(question);
                const response = await dmChannel.awaitMessages({filter, max: 1, time: 60000, errors: ['time'] });
                return response.first().content;
            } catch (error) {
                throw new Error('Timeout or error in user response');
            }
        }
    
        try {
            const title = await askQuestionDM("Quel est le titre de l'événement?");
            const date = await askQuestionDM('Quelle est la date envisagée? (ex: 06-02-2025)');
            const publicTime = await askQuestionDM('Heure de début et heure de fin pour les communications');
            const salle = await askQuestionDM('Dans une salle de classe ou dans une salle institutionnelle?');
            const reservationTime = await askQuestionDM('Heure de début et heure de fin pour la réservation de la salle');
            const alcohol = await askQuestionDM("Est-ce qu'il y aura de l'alcool?");
    
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(title)
                .addFields(
                    { name: 'Date', value: date },
                    { name: 'Heure pour les communications', value: publicTime },
                    { name: 'Salle', value: salle },
                    { name: 'Heure pour la réservation de la salle', value: reservationTime },
                    { name: 'Présence alcool', value: alcohol }
                )
                .setTimestamp()
                .setFooter({ text: user.username });
    
            await channel.send({ embeds: [embed] });
            await interaction.editReply({ content: 'Les détails ont été ajoutés avec succès!', ephemeral: true });
        } catch (error) {
            console.error('Error collecting user input or sending message in DM while adding details to an event', error);
            await interaction.editReply({ content: "Certains détails de l'événement sont manquants. Veuillez réessayer!", ephemeral: true});
        }
    }
    
    async createGoogleDriveFolder(folderName, destinationFolderId, channel) {
        try {
            const newFolderId = await this.googleDriveService.createFolder(folderName, destinationFolderId);

            if (destinationFolderId === process.env.EVENT_FOLDER_ID) await this.googleDriveService.copyFiles(process.env.TEMPLATE_FOLDER_ID, newFolderId);
            
            const message = this.messageService.printNewFolderCreated(newFolderId, destinationFolderId);

            if (channel) channel.send(message);
            
            console.log("New folder created successfully!");
            return Promise.resolve()
        } catch (error) {
            console.error('Error creating folder in Google Drive:', error);
            return Promise.reject()
        }
    }

    async exportImages(interaction, destinationFolderId) {
        await interaction.deferReply();
        
        this.createLocalDownloadFolder();
        
        let { channel } = interaction;
        
        if (channel.isThread()) {
            const parentChannelName = await this.findThreadChannelName(channel);
            const messages = await channel.messages.fetch({ limit: 100 });
            const imagePaths = [];

            const newFolderId = await this.createGoogleDriveFolder(parentChannelName, destinationFolderId, channel, false);
        
            for (let message of messages.values()) {
                for (let attachment of message.attachments.values()) {
                    if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                        const response = await axios.get(attachment.url, { responseType: 'stream' });
                        
                        // Parse the URL and extract the pathname without query parameters
                        const filePath = await this.downloadImageLocaly(attachment, response);

                        if (destinationFolderId == COMMUNICATION_FOLDER_ID) await this.googleDriveService.uploadImageToDrive(attachment, filePath, newFolderId, fs);
                        else if (destinationFolderId == FINANCE_FOLDER_ID) imagePaths.push(filePath);
                    }
                }
            }

            if (destinationFolderId == FINANCE_FOLDER_ID) {
                const pdfPath = await this.createPDFLocaly(imagePaths);
                await this.googleDriveService.uploadPDFToDrive(pdfPath, parentChannelName, newFolderId, fs);
            }
            this.cleanUpDownloadsFolder();
            
            const folderMessage = this.printNewFolderCreated(newFolderId, destinationFolderId);
            await interaction.editReply(folderMessage);
        } else {
            await interaction.editReply({ content: '🛑 Cette commande doit être appelée dans un thread.', ephemeral: true });
        }
    }

    async downloadImageLocaly(attachment, response) {
        const parsedUrl = new URL(attachment.url);
        const filename = path.basename(parsedUrl.pathname);

        const filePath = path.join(__dirname, 'downloads', filename);
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', (error) => {
                console.error('Failed to write file:', error);
                reject(error);
            });
        });
        
        return filePath;
    }

    cleanUpDownloadsFolder() {
        const downloadDir = path.join(__dirname, 'downloads');
        fs.rmSync(downloadDir, { recursive: true, force: true });
    }
    
    async createPDFLocaly(imagePaths) {
        const doc = new PDFDocument();
        const pdfPath = path.join(__dirname, 'downloads', 'tmp_receipts.pdf');
        const pdfStream = fs.createWriteStream(pdfPath);
    
        return new Promise((resolve, reject) => {
            doc.pipe(pdfStream);
    
            imagePaths.forEach((imagePath, index) => {
                if (index !== 0) doc.addPage();
                doc.image(imagePath, {
                    fit: [500, 700],
                    align: 'center',
                    valign: 'center',
                });
            });
    
            doc.end();
    
            pdfStream.on('finish', () => {
                console.log(`PDF created at ${pdfPath}`);
                resolve(pdfPath);
            });
    
            pdfStream.on('error', (err) => {
                console.error('Error creating PDF:', err);
                reject(err);
            });
        });
    }

    async findThreadChannelName(thread) {
        try {    
            const parentChannel = thread.parent;
            if (parentChannel) return parentChannel.name
        } catch (error) {
          console.error('Error fetching thread or channel:', error);
        }
    }
      



    async deletePreviousMessages(channel) {
        try {
            let fetchedMessages;
            do {
              fetchedMessages = await channel.messages.fetch({ limit: 100 });
              await channel.bulkDeleteMessages(fetchedMessages);
            } while (fetchedMessages.size !== 0);
            console.log("All messages in the channel were deleted!");
        } catch (error) {
            console.error(`Error while deleting all messages`);
        }
    }

    async createDefaultThreads(channel) {
        const jsonData = JSON.parse(fs.readFileSync('threads.json', 'utf8'));
        let threadLinks = '';
    
        for (const threadData of jsonData.threads) {
            try {
                const threadName = threadData.name; 
                const thread = await channel.threads.create({
                    "name": threadName,
                    "autoArchiveDuration": 10080, 
                    "reason": 'Needed a separate thread for ' + threadName
                });
                await thread.send(threadData.message);
                threadLinks += `[${threadName}](${thread.url})\n`;
                
                console.log(`Thread created with name: ${thread.name}`);
            } catch (error) {
                console.error(`Failed to create thread: ${error}`);
            }
        }
        
        const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle("Voici les threads (automatique):")
                .setDescription(threadLinks)
                .setTimestamp()
          
        await channel.send({ embeds: [embed] });
    }
    
    async createLocalDownloadFolder() {
        const dirPath = path.join(__dirname, 'downloads');
    
        if (!fs.existsSync(dirPath)) {
            fs.mkdir(dirPath, { recursive: true }, (error) => {
                if (error) console.error('Failed to create directory:', error);
                else console.log('A directory called downloads was created successfully');
            });
        }
    }

}

module.exports = DiscordService;
