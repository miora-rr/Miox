require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const DiscordService = require("../services/DiscordService");
const FileService = require("../services/FileService");
const GoogleDriveService = require("../services/GoogleDriveService");
const DiscordMessageService = require("../services/DiscordMessageService");
const UploadStrategyFactory = require("../patterns/factories");
const ExportImagesCommand = require("../patterns/commands");
const {
  COMMUNICATION_FOLDER_ID,
  FINANCE_FOLDER_ID,
  EVENT_FOLDER_ID,
  findThreadChannelName,
} = require("../utils");

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
            ? process.env.COMMUNICATION_FOLDER_ID
            : process.env.FINANCE_FOLDER_ID;
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

      if (commandName === "ajouter_details_evenement")
        await this.discordService.addEventDetails(interaction);

      if (commandName === "ajouter_threads_defaut")
        await this.discordService.createDefaultThreads(interaction.channel);

      if (commandName === "creer_dossiers") {
        await interaction.deferReply();
        const { channel } = interaction;
        Promise.all([
          this.googleDriveService.createGoogleDriveFolder(
            channel.name,
            EVENT_FOLDER_ID,
            channel
          )
        ])
          .then(() => {
            interaction.editReply({
              content: "La création des dossiers a été un succès",
              ephemeral: true,
            });
          })
          .catch(() => {
            interaction.editReply({
              content: "Erreur pendant la création des dossiers",
              ephemeral: true,
            });
          });
      }
    });
  }
}

if (require.main === module) {
  new DiscordController();
}

module.exports = DiscordController;
