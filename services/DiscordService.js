const fs = require('fs');

class DiscordService {
    constructor(fileService, googleDriveService, discordMessageService) {
        this.fileService = fileService;
        this.googleDriveService = googleDriveService;
        this.discordMessageService = discordMessageService;
    }
    
    async addEventDetails(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const { channel, user } = interaction;
        const filter = response => response.author.id === user.id;
    
        async function askQuestionToUserInDM(question) {
            const dmChannel = await user.createDM();
            try {
                await dmChannel.send(question);
                const response = await dmChannel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
                return response.first().content;
            } catch (error) {
                console.error('Timeout or error in user response', error);
            }
        }
        const questions = JSON.parse(fs.readFileSync('utils/eventQuestions.json', 'utf8'));
    
        try {
            const responses = {};
            for (const question of questions) {
                responses[question.fieldName] = await askQuestionToUserInDM(question.question);
            }
    
            const embed = this.discordMessageService.printEventDetails(responses, user.username);
            await channel.send({ embeds: [embed] });
            await interaction.editReply({ content: 'Les détails ont été ajoutés avec succès!', ephemeral: true });
        } catch (error) {
            console.error('Error collecting user input or sending message in DM while adding details to an event', error);
            await interaction.editReply({ content: "Certains détails de l'événement sont manquants. Veuillez réessayer!", ephemeral: true });
        }
    }

    async createDefaultThreads(channel) {
        const threadsFile = JSON.parse(fs.readFileSync('utils/threads.json', 'utf8'));
        let threadLinks = '';
    
        try {
            for (const threadData of threadsFile.threads) {
                const threadName = threadData.name; 
                const thread = await channel.threads.create({
                    "name": threadName,
                    "autoArchiveDuration": 10080, 
                    "reason": 'Needed a separate thread for ' + threadName
                });
                await thread.send(threadData.message);
                threadLinks += `[${threadName}](${thread.url})\n`;
                
                console.log(`Thread created with name: ${thread.name}`);                       
            }
            this.discordMessageService.printThreadSuccess(threadLinks, channel);
        } catch (error) {
            console.error(`Failed to create thread: ${error}`);
        }
    }
}

module.exports = DiscordService;
