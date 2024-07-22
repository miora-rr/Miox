const fs = require('fs');
const axios = require('axios');
const GoogleDriveService = require('./GoogleDriveService');
const DiscordMessagesService = require('./DiscordMessagesService');
const FileService = require('./FileService');

class DiscordService {
    constructor() {
        this.googleDriveService = new GoogleDriveService();
        this.messageService = new DiscordMessagesService();
        this.fileService = new FileService();
    }
    
    async addEventDetails(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const {channel, user} = interaction;
        const filter = response => response.author.id === user.id;
    
        async function askQuestionToUserInDM(question) {
            const dmChannel = await user.createDM();
            try {
                await dmChannel.send(question);
                const response = await dmChannel.awaitMessages({filter, max: 1, time: 60000, errors: ['time'] });
                return response.first().content;
            } catch (error) {
                console.error('Timeout or error in user response', error);
            }
        }
        const questions = JSON.parse(fs.readFileSync('eventQuestions.json', 'utf8'));
    
        try {
            const responses = {};
            for (const question of questions) {
                responses[question.fieldName] = await askQuestionToUserInDM(question.question);
            }
    
            const embed = this.messageService.printEventDetails(responses, user.username);
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
        
        this.fileService.createLocalDownloadFolder();
        
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
                        const filePath = await this.fileService.downloadImageLocaly(attachment, response);

                        if (destinationFolderId == COMMUNICATION_FOLDER_ID) await this.googleDriveService.uploadImageToDrive(attachment, filePath, newFolderId, fs);
                        else if (destinationFolderId == FINANCE_FOLDER_ID) imagePaths.push(filePath);
                    }
                }
            }

            if (destinationFolderId == FINANCE_FOLDER_ID) {
                const pdfPath = await this.fileService.createPDFLocaly(imagePaths);
                await this.googleDriveService.uploadPDFToDrive(pdfPath, parentChannelName, newFolderId, fs);
            }
            this.fileService.cleanUpDownloadsFolder();
            
            const folderMessage = this.printNewFolderCreated(newFolderId, destinationFolderId);
            await interaction.editReply(folderMessage);
        } else {
            await interaction.editReply({ content: '🛑 Cette commande doit être appelée dans un thread.', ephemeral: true });
        }
    }

    async findThreadChannelName(thread) {
        try {    
            const parentChannel = thread.parent;
            if (parentChannel) return parentChannel.name
        } catch (error) {
          console.error('Error fetching thread or channel:', error);
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
}

module.exports = DiscordService;

