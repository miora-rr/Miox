const fs = require("fs");
const { roomOptions } = require("../utils/config");

class DiscordService {
  constructor(fileService, googleDriveService, discordMessageService) {
    this.fileService = fileService;
    this.googleDriveService = googleDriveService;
    this.discordMessageService = discordMessageService;
  }

  async planEvent(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { channel, user } = interaction;
      const responses = {
        title: interaction.options.getString("title"),
        date: interaction.options.getString("date"),
        publicTime: interaction.options.getString("public_time"),
        reservationTime: interaction.options.getString("room_time"),
        salle: roomOptions[interaction.options.getString("salle")],
        alcohol: interaction.options.getBoolean("alcohol"),
        parkingTicketsNeeded: interaction.options.getBoolean("parking"),
      };

      const embed = this.discordMessageService.printEventDetails(
        responses,
        user.username
      );
      await channel.send({ embeds: [embed] });
      await interaction.editReply({
        content: "Les détails ont été ajoutés avec succès!",
        ephemeral: true,
      });
    } catch (error) {
      console.error(
        "Error while creating the event",
        error
      );
      await interaction.editReply({
        content:
          "Une erreur s'est produite. Veuillez réessayer!",
        ephemeral: true,
      });
    }
  }

  async createDefaultThreads(channel) {
    const threadsFile = JSON.parse(
      fs.readFileSync("utils/threads.json", "utf8")
    );
    let threadLinks = "";

    try {
      for (const threadData of threadsFile.threads) {
        const threadName = threadData.name;
        const thread = await channel.threads.create({
          name: threadName,
          autoArchiveDuration: 10080,
          reason: "Needed a separate thread for " + threadName,
        });
        await thread.send(threadData.message);
        threadLinks += `[${threadName}](${thread.url})\n`;

        console.log(`Thread created with name: ${thread.name}`);
      }
      this.discordMessageService.printThreadSuccess(threadLinks, channel);
    } catch (error) {
      console.error(`Failed to create thread: ${error}`);
    }
  }
}

module.exports = DiscordService;
