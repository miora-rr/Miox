const { Client, GatewayIntentBits, Partials} = require('discord.js');
const DiscordService = require('../services/DiscordService');

class DiscordController {
    constructor() {
        const token = process.env.DISCORD_BOT_TOKEN;
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
            ],
            partials: [Partials.Channel]
        });
        this.discordService = new DiscordService();
        this.registerEventHandlers();
        this.client.login(token);
    }

    registerEventHandlers() {
        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user.tag}!`);
        });

        this.client.on('channelCreate', async channel => {
            const TEXT_CHANNEL_DISCORD = 0;
            
            if (channel.type === TEXT_CHANNEL_DISCORD && channel.parentId === process.env.EVENT_CATEGORY_DISCORD_ID) {
                await this.discordService.createDefaultThreads(channel);
                await this.discordService.askEventDetails(channel);
                this.createGoogleDriveFolder(channel.name, process.env.EVENT_FOLDER_ID)
                    .then(newFolderId => {
                        this.discordService.printNewFolderCreated(newFolderId, process.env.EVENT_CATEGORY_DISCORD_ID);
                        console.log('Folder created with ID:', newFolderId);
                    })
                    .catch(error => {
                        console.error('Failed to create folder:', error);
                    });
            }
        });

        this.client.on('threadCreate', async thread => {
            await thread.join();
            console.log(`Joined new thread: ${thread.name}`);
        });

        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;

            const { commandName } = interaction;

            if (commandName === 'exporter_photos') await this.discordService.exportImages(interaction, process.env.COMMUNICATION_FOLDER_ID);
            if (commandName === 'exporter_factures') await this.discordService.exportImages(interaction, process.env.FINANCE_FOLDER_ID);
            if (commandName === 'ajouter_details_evenement') await this.discordService.askEventDetails(interaction);
        });
    }
}

module.exports = DiscordController;