const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
require('dotenv').config();
const clientId = process.env.BOT_ID;
const token = process.env.DISCORD_BOT_TOKEN;

const commands = [
    {
        name: 'exporter_photos',
        description: 'Exporte les images vers le dossier Communications dans Google Drive (max 100 images)'
    },
    {
        name: 'ajouter_details_evenement',
        description: "Affiche un message avec le titre, la date, le lieu, la description et s'il y aura de l'alcool"
    },
    {
        name: 'exporter_factures',
        description: "Exporte les images vers le dossier Mandat de l'année en cours dans Google Drive (max 100 images)"
    },
    {
        name: 'creer_dossiers',
        description: "Crée les dossiers de l'événement dans les sections Evénement et Trésorerie du le Drive"
    }
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands globally.');

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
