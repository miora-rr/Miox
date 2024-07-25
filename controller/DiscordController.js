require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const DiscordService = require("../services/DiscordService");
const FileService = require("../services/FileService");
const GoogleDriveService = require("../services/GoogleDriveService");
const DiscordMessageService = require("../services/DiscordMessageService");
const UploadStrategyFactory = require("../uploadFiles/factories");
const ExportImagesCommand = require("../uploadFiles/commands");
const {
  COMMUNICATION_FOLDER_ID,
  FINANCE_FOLDER_ID,
  EVENT_FOLDER_ID,
  roomPlanFileId,
  ALCOHOL_COMMAND_ID,
  roomOptions
} = require("../utils/config");

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
      partials: [Partials.Channel],
    });

    // Initialize services and inject dependencies
    const discordMessageService = new DiscordMessageService();
    this.fileService = new FileService();
    this.googleDriveService = new GoogleDriveService(discordMessageService);
    this.discordService = new DiscordService(
      this.fileService,
      this.googleDriveService,
      discordMessageService
    );

    this.registerEventHandlers();
    this.client.login(token);
  }

  registerEventHandlers() {
    this.client.on("ready", () => {
      console.log(`Logged in as ${this.client.user.tag}!`);
    });

    this.client.on("threadCreate", async (thread) => {
      await thread.join();
      console.log(`Joined new thread: ${thread.name}`);
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;

      const { commandName } = interaction;

      if (
        commandName === "exporter_photos" ||
        commandName === "exporter_factures"
      ) {
        const destinationFolderId =
          commandName === "exporter_photos"
            ? COMMUNICATION_FOLDER_ID
            : FINANCE_FOLDER_ID;
        const uploadStrategy =
          UploadStrategyFactory.getStrategy(destinationFolderId);
        const command = new ExportImagesCommand(
          interaction,
          this.discordService.fileService,
          this.discordService.googleDriveService,
          this.discordService.discordMessageService,
          uploadStrategy
        );
        await command.execute(destinationFolderId);
      }

      if (commandName === "ajouter_threads_defaut")
        await this.discordService.createDefaultThreads(interaction.channel);

      if (commandName === "planifier_event") {
        try {
          this.discordService.planEvent(interaction);
          const { channel } = interaction;
          await this.googleDriveService
            .createGoogleDriveFolder(channel.name, EVENT_FOLDER_ID, channel)
            .then((folderId) => {
              const roomKey = interaction.options.getString("salle");
              const alcoholKey = interaction.options.getBoolean("alcohol");
              const dateKey = interaction.options.getString("date");

               // Copy only institutionnal rooms
              if ( roomKey !== roomOptions.classroom && roomKey !== roomOptions.outside_poly) {
                const file = {
                  id: roomPlanFileId[roomKey],
                  name: `Plan-${interaction.channel.name}`,
                };
                this.googleDriveService.copyFile(file, folderId);
              }

               // Copy template alcohol command
              if (alcoholKey) {
                const file = {
                  id: ALCOHOL_COMMAND_ID,
                  name: `Commande-Poly-Out-${dateKey}`,
                };
                this.googleDriveService.copyFile(file, folderId);
              }
             
              // Copy declaration event et planning
              this.googleDriveService.copyFiles(
                process.env.TEMPLATE_FOLDER_ID,
                folderId
              );
              
            });
        } catch (error) {
          console.error(`Error while creating files: ${error}`);
        }
      }
    });
  }
}

if (require.main === module) {
  new DiscordController();
}

module.exports = DiscordController;
