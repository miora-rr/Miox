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

        this.client.on('threadCreate', async thread => {
            await thread.join();
            console.log(`Joined new thread: ${thread.name}`);
        });

        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;

            const { commandName } = interaction;

            if (commandName === 'exporter_photos') await this.discordService.exportImages(interaction, process.env.COMMUNICATION_FOLDER_ID);
            
            if (commandName === 'exporter_factures') await this.discordService.exportImages(interaction, process.env.FINANCE_FOLDER_ID);
            
            if (commandName === 'ajouter_details_evenement') await this.discordService.addEventDetails(interaction);
            
            if (commandName === 'ajouter_threads_defaut') await this.discordService.createDefaultThreads(interaction.channel);
            
            if (commandName === 'creer_dossiers') {
                await interaction.deferReply();
                const {channel} = interaction;
                Promise.all(
                    [
                    this.discordService.createGoogleDriveFolder(channel.name, process.env.EVENT_FOLDER_ID, channel),
                    this.discordService.createGoogleDriveFolder(channel.name, process.env.FINANCE_FOLDER_ID, channel)
                    ])
                .then(() => {
                    interaction.editReply({content: "La création des dossiers a été un succès", ephemeral: true });
                })
                .catch(() => {interaction.editReply({content: "Erreur pendant la création des dossiers", ephemeral: true })})
            }
        });
    }
}

module.exports = DiscordController;