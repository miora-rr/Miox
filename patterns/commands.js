const { findThreadChannelName } = require('../utils');
const axios = require('axios');
const { UploadInvoicesStrategy } = require('./strategies');

class ExportImagesCommand {
    constructor(interaction, fileService, googleDriveService, discordMessagesService, uploadStrategy) {
        this.interaction = interaction;
        this.fileService = fileService;
        this.googleDriveService = googleDriveService;
        this.discordMessagesService = discordMessagesService;
        this.uploadStrategy = uploadStrategy;
    }

    async execute(destinationFolderId) {
        await this.interaction.deferReply();
        this.fileService.createLocalDownloadFolder();
        let { channel } = this.interaction;

        if (channel.isThread()) {
            const parentChannelName = await findThreadChannelName(channel);
            const messages = await channel.messages.fetch({ limit: 100 });
            const newFolderId = await this.googleDriveService.createFolder(parentChannelName, destinationFolderId);

            for (let message of messages.values()) {
                for (let attachment of message.attachments.values()) {
                    if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                        const response = await axios.get(attachment.url, { responseType: 'stream' });
                        await this.uploadStrategy.upload(attachment, response, this.googleDriveService, this.fileService, newFolderId);
                    }
                }
            }

            if (this.uploadStrategy instanceof UploadInvoicesStrategy) {
                await this.uploadStrategy.finalizeUpload(this.fileService, this.googleDriveService, parentChannelName, newFolderId);
            }

            this.fileService.cleanUpDownloadsFolder();
            const newFolderMsg = this.discordMessagesService.printNewFolderCreated(newFolderId, destinationFolderId);
            await this.interaction.editReply(newFolderMsg);
        } else {
            await this.interaction.editReply({ content: '🛑 Cette commande doit être appelée dans un thread.', ephemeral: true });
        }
    }
}

module.exports = ExportImagesCommand;
