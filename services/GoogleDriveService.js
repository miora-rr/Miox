const { google } = require("googleapis");
const SHARED_DRIVE_ID = "0AOvSCGvNw5epUk9PVA";

class GoogleDriveService {
  constructor(discordMessageService) {
    this.discordMessageService = discordMessageService;

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/drive"]
    );

    this.drive = google.drive({
      version: "v3",
      auth,
    });
  }

  async uploadImageToDrive(attachment, fileStream, folderId) {
    const fileMetadata = {
      name: attachment.name,
      parents: [folderId],
      driveId: SHARED_DRIVE_ID,
    };
    const media = {
      mimeType: attachment.contentType,
      body: fileStream,
    };

    try {
      await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id",
        supportsAllDrives: true,
      });
    } catch (error) {
      console.error("Failed to upload to Google Drive:", error.message);
    }
  }

  async uploadPDFToDrive(stream, pdfName, folderId) {
    const fileMetadata = {
      name: pdfName,
      parents: [folderId],
      driveId: SHARED_DRIVE_ID,
    };

    const media = {
      mimeType: "application/pdf",
      body: stream,
    };

    try {
      await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id",
        supportsAllDrives: true,
      });
      console.log("PDF uploaded successfully");
    } catch (error) {
      console.error("Failed to upload PDF to Google Drive:", error.message);
    }
  }

  async createFolder(name, parentId) {
    const fileMetadata = {
      name: name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
      driveId: SHARED_DRIVE_ID,
    };

    try {
      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: "id",
        supportsAllDrives: true,
      });
      return response.data.id;
    } catch (error) {
      console.error("The API returned an error: " + error);
    }
  }


  async createGoogleDriveFolder(folderName, destinationFolderId, channel) {
    try {
      const newFolderId = await this.createFolder(
        folderName,
        destinationFolderId
      );

      const message = this.discordMessageService.printNewFolderCreated(
        newFolderId,
        destinationFolderId
      );

      if (channel) channel.send(message);

      console.log("New folder created successfully!");
      return Promise.resolve(newFolderId);
    } catch (error) {
      console.error("Error creating folder in Google Drive:", error);
      return Promise.reject();
    }
  }

  async copyFile(file, destinationFolderId) {
    try {
      await this.drive.files.copy({
        fileId: file.id,
        requestBody: {
          parents: [destinationFolderId],
          name: file.name,
        },
        supportsAllDrives: true, // Necessary for Shared Drives
      });
    } catch (error) {
      console.error("Error copying files:", error.message);
    }
  }

  async copyFiles(sourceFolderId, destinationFolderId) {
    try {
      // List files in the source folder
      const res = await this.drive.files.list({
        q: `'${sourceFolderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name)",
        supportsAllDrives: true, // Necessary for Shared Drives
        includeItemsFromAllDrives: true, // Required to include files from Shared Drives
      });

      const files = res.data.files;
      if (files.length) {
        files.forEach(async (file) => {
          this.copyFile(file, destinationFolderId);
        });
      } else {
        console.log("No files found.");
      }
    } catch (error) {
      console.error("Error copying files:", error.message);
      throw error;
    }
  }
}

module.exports = GoogleDriveService;
