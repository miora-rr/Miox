const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { roomOptions } = require('./utils/config')
require('dotenv').config();

const clientId = process.env.BOT_ID;
const token = process.env.DISCORD_BOT_TOKEN;

const commands = [
    new SlashCommandBuilder()
        .setName('planifier_event')
        .setDescription("Entry point pour un événement et crée un dossier dans la section Événement")
        .addStringOption(option => 
            option.setName('title')
                .setDescription("Quel est le titre de l'événement?")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('date')
                .setDescription("Quelle est la date envisagée? (ex: 06-02-2025)")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('public_time')
                .setDescription("Heure de début et heure de fin pour les communications")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('room_time')
                .setDescription("Heure de début et heure de fin reservation salle")
                .setRequired(true)
        )
        .addStringOption(option => {
            option.setName('salle')
                .setDescription('Le lieu de l\'événement')
                .setRequired(true);
                
            for (const [value, name] of Object.entries(roomOptions)) {
                option.addChoices({ name, value });
            }

            return option;
        }
        )
        .addBooleanOption(option => 
            option.setName('alcohol')
                .setDescription("Est-ce qu'il y aura de l'alcool?")
                .setRequired(true))
        .addBooleanOption(option => 
            option.setName('parking')
                .setDescription("Doit-on réserver des billets de stationnements? Si oui, prévenir les VP-Internes")
                .setRequired(true)),
        new SlashCommandBuilder()
        .setName('exporter_photos')
        .setDescription('Exporte les images vers le dossier Communications dans Google Drive (max 100 images)')
        .toJSON(),
        new SlashCommandBuilder()
            .setName('exporter_factures')
            .setDescription("Exporte les images vers le dossier Mandat de l'année en cours dans Google Drive (max 100 images)")
            .toJSON(),
        new SlashCommandBuilder()
            .setName('ajouter_threads_defaut')
            .setDescription("Ajoute les threads par défaut (ex:bénévoles, budget, communications, etc.)")
            .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
