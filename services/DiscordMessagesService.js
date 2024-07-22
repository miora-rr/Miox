const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class DiscordMessagesService {
    constructor(){

    }

    printNewFolderCreated(newFolderId, destinationFolderId) {
        const newFolderUrl = `https://drive.google.com/drive/folders/${newFolderId}`;
        
        const folderMessages = {
            [process.env.EVENT_FOLDER_ID]: "📅 Un dossier dans la section Événement a été créé.",
            [process.env.FINANCE_FOLDER_ID]: "💰 Un dossier dans la section Trésorerie a été créé.",
            [process.env.COMMUNICATION_FOLDER_ID]: "📷 Un dossier dans la section Communication a été créé."
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
}

module.exports = DiscordMessagesService;
