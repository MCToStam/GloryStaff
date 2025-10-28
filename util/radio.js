const {
  joinVoiceChannel,
  createAudioResource,
  createAudioPlayer,
} = require("@discordjs/voice");
const { getData } = require("../util/module/getAndSaveData");
const config = require("../../config");

async function radio(client) {
  try {
    const streamUrl = "https://radio.nationsglory.fr/listen/ngradio/NGRadio";

    const createNewResource = () => {
      return createAudioResource(streamUrl, {
        inputType: "url",
        inlineVolume: true,
      });
    };

    for (const server of config.liste_serveur) {
      const fileContent = getData(`data/${server}/config-radio.json`);
      const config = JSON.parse(fileContent);

      if (config.radio?.active === true && config.radio?.Salon) {
        const voiceChannel = await client.channels
          .fetch(config.radio.Salon)
          .catch(() => null);
        if (!voiceChannel) {
          console.warn(
            `Impossible de récupérer le salon pour le serveur : ${server}`,
          );
          continue;
        }

        const guild = voiceChannel.guild;
        if (!guild) {
          console.warn(
            `Impossible de récupérer la guilde pour le salon ${config.radio.Salon}`,
          );
          continue;
        }

        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });

        if (voiceChannel.type === "GUILD_STAGE_VOICE") {
          setTimeout(async () => {
            try {
              const botVoice = guild.members.me.voice;
              if (botVoice?.suppress) {
                await botVoice.setSuppressed(false);
              }
            } catch (err) {
              console.warn(
                `Impossible de prendre la parole dans ${voiceChannel.name} : ${err.message}`,
              );
            }
          }, 1000);
        }
        const player = createAudioPlayer();
        let resource = createNewResource();

        player.play(resource);
        connection.subscribe(player);

        player.on("error", (error) => {
          console.error(`Erreur audio sur ${server} :`, error.message);
          setTimeout(() => {
            try {
              const newResource = createNewResource();
              player.play(newResource);
            } catch (err) {
              console.error(
                `Échec de relance du flux sur ${server} :`,
                err.message,
              );
            }
          }, 3000);
        });

        player.on("idle", () => {
          console.warn(
            `Flux devenu idle sur ${server}. Tentative de reprise...`,
          );
          setTimeout(() => {
            try {
              const newResource = createNewResource();
              player.play(newResource);
            } catch (err) {
              console.error(
                `Erreur lors de la relance après idle sur ${server} :`,
                err.message,
              );
            }
          }, 3000);
        });
      }
    }
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de l’exécution du bot :",
      error,
    );
  }
}

module.exports = { radio };
