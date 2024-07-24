const { REST } = require('@discordjs/rest');
const { SlashCommandBuilder } = require('@discordjs/builders'); // Updated import
const { Routes } = require('discord-api-types/v10');
require('dotenv').config();

const clientId = process.env.BOT_ID;
const token = process.env.DISCORD_BOT_TOKEN;


const commands = [
    new SlashCommandBuilder()
        .setName('exporter_photos')
        .setDescription('Exporte les images vers le dossier Communications dans Google Drive (max 100 images)')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('ajouter_details_evenement')
        .setDescription("Affiche un message avec le titre, la date, le lieu, la description et s'il y aura de l'alcool")
        .toJSON(),
    new SlashCommandBuilder()
        .setName('exporter_factures')
        .setDescription("Exporte les images vers le dossier Mandat de l'année en cours dans Google Drive (max 100 images)")
        .toJSON(),
    new SlashCommandBuilder()
        .setName('ajouter_threads_defaut')
        .setDescription("Ajoute les threads par défaut (ex:bénévoles, budget, communications, etc.)")
        .toJSON(),
    new SlashCommandBuilder()
        .setName('planifier_event')
        .setDescription("Crée un dossier dans Événement et y ajoute une déclaration d'event, commande de bière et un planning")
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
        .addStringOption(option => 
            option.setName('salle')
                .setDescription('Le lieu de l\'événement')
                .setRequired(true)
                .addChoices(
                    { name: 'Galerie Rolland', value: 'galerie' },
                    { name: 'Kiosque 1er Lassonde', value: 'kiosque_1_lassonde' },
                    { name: 'Amphithéâtre Bernard-Lamarre', value: 'amphi' },
                    { name: 'Galerie Rolland', value: 'galerie' },
                    { name: 'Vitrine étudiante (C-200)', value: 'vitrine' },
                    { name: 'Cafétéria', value: 'cafeteria' },
                    { name: 'Rotonde palier supérieur', value: 'rotonde_top' },
                    { name: 'Rotonde palier central', value: 'rotonde_middle' },
                    { name: 'Rotonde palier inférieur', value: 'rontonde_bottom' },
                    { name: '6e Lassonde (mur bleu)', value: 'lassonde_six' },
                    { name: 'Hall Lassonde', value: 'hall_lassonde' },
                    { name: 'Atrium', value: 'atrium' },
                    { name: 'Salle de classe', value: 'classroom' },
                    { name: 'Exterieur de Poly', value: 'outside_poly' },
                ))
        .addBooleanOption(option => 
            option.setName('alcohol')
                .setDescription("Est-ce qu'il y aura de l'alcool?")
                .setRequired(true))
        .addBooleanOption(option => 
            option.setName('parking')
                .setDescription("Doit-on réserver des billets de stationnements? Si oui, prévenir les VP-Internes")
                .setRequired(true))
        .toJSON(),
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
