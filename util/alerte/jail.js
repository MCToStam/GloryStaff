const config = require("../../config");
const getServerPlayer = require("../../util/module/getServerPlayer");
const { getData, saveData } = require("../../util/module/getAndSaveData");
const {
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");

async function jail(client) {
  for (const server of config.liste_serveur) {
    const configGlobale = getData(`data/${server}/config.json`);

    const jailConfig = configGlobale.find((c) => c.nom === "Jail");
    if (!jailConfig) continue;

    const jailSystem = jailConfig.systeme?.Jail;
    if (!jailSystem) continue;

    if (!Object.values(jailSystem.active || {}).some((v) => v === true))
      continue;

    const jailData = getData(`data/${server}/jail.json`);

    const hasJailedPlayers = Object.values(jailData).some((groupEntries) =>
      groupEntries.some((entry) => entry),
    );

    if (!hasJailedPlayers) continue;

    try {
      const data = await getServerPlayer(server);
      const connectedPlayers = data.liste;

      for (const group in jailData) {
        if (!Object.prototype.hasOwnProperty.call(jailData, group)) continue;

        const groupEntries = jailData[group];

        for (let jailEntry of groupEntries) {
          if (
            !jailEntry.jailed &&
            !jailEntry.connecte &&
            connectedPlayers.includes(group)
          ) {
            jailEntry.connecte = true;

            const jailContainer = new ContainerBuilder()
              .setAccentColor(config.colors.success)
              .addSectionComponents((section) =>
                section
                  .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent("## Joueur Connecté"),
                  )
                  .setThumbnailAccessory((thumbnail) =>
                    thumbnail.setURL(
                      `https://skins.nationsglory.fr/face/${group}/3d/16`,
                    ),
                  )
                  .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                      `Le joueur **${group}** vient de se connecter sur le serveur <:NG${server}:${
                        config.emoji[server.toLowerCase()]
                      }> **${
                        server.charAt(0).toUpperCase() + server.slice(1)
                      }**.`,
                    ),
                  ),
              );

            const channel = await client.channels
              .fetch(jailEntry.threadId)
              .catch(() => null);

            if (channel?.isThread()) {
              const jailRoles =
                jailSystem.Role?.valeur?.[jailEntry.guildId || server] || [];

              if (jailRoles.length) {
                const roleMentions = jailRoles
                  .map((roleId) => `<@&${roleId}>`)
                  .join(", ");

                const roleTextDisplay = new TextDisplayBuilder().setContent(
                  roleMentions,
                );

                await channel.send({
                  components: [roleTextDisplay, jailContainer],
                  flags: MessageFlags.IsComponentsV2,
                });
              } else {
                await channel.send({
                  components: [jailContainer],
                  flags: MessageFlags.IsComponentsV2,
                });
              }
            }
          } else if (jailEntry.connecte && !connectedPlayers.includes(group)) {
            jailEntry.connecte = false;

            const jailContainer = new ContainerBuilder()
              .setAccentColor(config.colors.error)
              .addSectionComponents((section) =>
                section
                  .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent("## Joueur Déconnecté"),
                  )
                  .setThumbnailAccessory((thumbnail) =>
                    thumbnail.setURL(
                      `https://skins.nationsglory.fr/face/${group}/3d/16`,
                    ),
                  )
                  .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                      `Le joueur **${group}** vient de se déconnecter sur le serveur <:NG${server}:${
                        config.emoji[server.toLowerCase()]
                      }> **${
                        server.charAt(0).toUpperCase() + server.slice(1)
                      }**.`,
                    ),
                  ),
              );

            try {
              const channel = await client.channels
                .fetch(jailEntry.threadId)
                .catch(() => null);

              if (channel?.isThread()) {
                await channel.send({
                  components: [jailContainer],
                  flags: MessageFlags.IsComponentsV2,
                });
              }
            } catch (error) {}
          }
        }
      }

      saveData(`data/${server}/jail.json`, jailData);
    } catch (apiError) {}
  }
}

module.exports = { jail };
