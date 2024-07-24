const { UploadImagesStrategy, UploadInvoicesStrategy } = require('./strategies');
const { COMMUNICATION_FOLDER_ID, FINANCE_FOLDER_ID } = require('../utils/config');

class UploadStrategyFactory {
    static getStrategy(destinationFolderId) {
        if (destinationFolderId == COMMUNICATION_FOLDER_ID) {
            return new UploadImagesStrategy();
        } else if (destinationFolderId == FINANCE_FOLDER_ID) {
            return new UploadInvoicesStrategy();
        } else {
            throw new Error("Unknown destination folder ID");
        }
    }
}

module.exports = UploadStrategyFactory;
