class UploadStrategy {
    async upload(attachment, response, googleDriveService, fileService, newFolderId) {
        throw new Error("This method should be overridden");
    }
}

class UploadImagesStrategy extends UploadStrategy {
    async upload(attachment, response, googleDriveService, fileService, newFolderId) {
        const fileStream = await fileService.downloadImageLocally(attachment, response);
        await googleDriveService.uploadImageToDrive(attachment, fileStream, newFolderId);
    }
}

class UploadInvoicesStrategy extends UploadStrategy {
    constructor() {
        super();
        this.imagePaths = [];
    }

    async upload(attachment, response, googleDriveService, fileService, newFolderId) {
        const filePath = await fileService.downloadImageLocally(attachment, response);
        this.imagePaths.push(filePath);
    }

    async finalizeUpload(fileService, googleDriveService, parentChannelName, newFolderId) {
        const pdfStream = await fileService.createPDFLocaly(this.imagePaths);
        await googleDriveService.uploadPDFToDrive(pdfStream, parentChannelName, newFolderId);
    }
}

module.exports = { UploadStrategy, UploadImagesStrategy, UploadInvoicesStrategy };
