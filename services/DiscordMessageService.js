const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COMMUNICATION_FOLDER_ID, FINANCE_FOLDER_ID , EVENT_FOLDER_ID} = require('../utils');

class DiscordMessageService {
    constructor(){

    }

    printNewFolderCreated(newFolderId, destinationFolderId) {
        const newFolderUrl = `https://drive.google.com/drive/folders/${newFolderId}`;
        
        const folderMessages = {
            [EVENT_FOLDER_ID]: "📅 Un dossier dans la section Événement a été créé.",
            [FINANCE_FOLDER_ID]: "💰 Un dossier dans la section Trésorerie a été créé.",
            [COMMUNICATION_FOLDER_ID]: "📷 Un dossier dans la section Communication a été céé."
        };
        
        const messageTitle = folderMessages[destinationFolderId] || "Un dossier a été créé.";

        const embed = new EmbedBuilder()
            .setTitle(messageTitle)
            .setColor("#FFB6C1");

        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setLabel('Accéder au dossier')
                .setStyle(ButtonStyle.Link)
                .setURL(newFolderUrl)
            );
        
        return { embeds: [embed], components: [row] };;
    }

    printEventDetails(responses, userName) {
        return new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(responses.title)
            .addFields(
                { name: 'Date', value: responses.date },
                { name: 'Heure pour les communications', value: responses.publicTime },
                { name: 'Salle', value: responses.salle },
                { name: 'Heure pour la réservation de la salle', value: responses.reservationTime },
                { name: 'Présence alcool', value: responses.alcohol },
                { name: 'Ticket de stationnement', value: responses.parkingTicketsNeeded },
            )
            .setTimestamp()
            .setFooter({ text: userName });
    }
    
    async printThreadSuccess(threadLinks, channel) {
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("Voici les threads (automatique):")
            .setDescription(threadLinks)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }
}


module.exports = DiscordMessageService;
