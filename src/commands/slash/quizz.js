const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { getData, saveData } = require("../../../util/module/getAndSaveData");
const proxyCommande = require("../../../util/proxy/proxyCommande");

module.exports = {
  serveur: ["521060626211012630"],
  config: { permission: "moderateur_plus" },
  data: new SlashCommandBuilder()
    .setContexts(0)
    .setName("quizz")
    .setDescription("Gère ou envoie le quizz de la semaine")
    .addSubcommand((subcommand) =>
      subcommand.setName("gerer").setDescription("Gère le quizz de la semaine"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("envoyer")
        .setDescription("Envoie le quizz de la semaine"),
    ),

  async execute(client, interaction, config) {
    await proxyCommande(client, interaction, config);
  },

  async proxy(client, interaction, config) {
    const { serveur } = interaction.parametre;
    const subcommand = interaction.subcommand;

    const data = getData(`data/${serveur}/quizz.json`);
    if (!data) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((text) =>
          text.setContent(`## ❌ Données Manquantes`),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((text) =>
          text.setContent(
            "Les données de quizz ne sont pas disponible sur votre serveur NationsGlory.",
          ),
        );

      if (interaction.isMessageComponent()) {
        const sentMessage = await interaction.update({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
          withResponse: true,
        });

        setTimeout(async () => {
          try {
            if (sentMessage.resource) {
              await sentMessage.resource.message.delete();
            } else {
              await sentMessage.delete();
            }
          } catch (error) {}
        }, 5_000);
      } else {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    let dernierQuizz = data[data.length - 1];

    const maintenant = new Date();

    const semaineActuelle = getWeekNumber(maintenant);

    const semaineDernierQuizz =
      dernierQuizz && dernierQuizz.envoyer
        ? getWeekNumber(new Date(dernierQuizz.envoyer))
        : null;

    const memeSemaine = semaineActuelle === semaineDernierQuizz;

    if (!dernierQuizz || (dernierQuizz.envoyer !== 0 && !memeSemaine)) {
      const nouveauId =
        data.length > 0
          ? Math.max(...data.map((q) => q.semaineId || 0)) + 1
          : 1;

      dernierQuizz = {
        semaineId: nouveauId,
        envoyer: 0,

        question1: {
          question: "",
          reponse: [],
        },

        question2: {
          question: "",
          reponse: [],
        },

        question3: {
          question: "",
          reponse: [],
        },
      };

      data.push(dernierQuizz);

      saveData(`data/${serveur}/quizz.json`, data);
    }

    const questions = [
      dernierQuizz.question1,
      dernierQuizz.question2,
      dernierQuizz.question3,
    ];

    const questionsValides = questions.filter(
      (q) => q && q.question && q.question.trim().length > 0,
    );

    if (subcommand === "envoyer") {
      if (questionsValides.length < 3 || dernierQuizz.envoyer !== 0) {
        const erreurContainer = new ContainerBuilder()
          .setAccentColor(config.colors.error)
          .addTextDisplayComponents((text) =>
            text.setContent(`## ❌ Données Manquantes`),
          )
          .addSeparatorComponents((separator) => separator)
          .addTextDisplayComponents((text) =>
            text.setContent("Les 3 questions ne sont pas définies."),
          );

        if (interaction.isMessageComponent()) {
          const sentMessage = interaction.update({
            components: [erreurContainer],
            flags: MessageFlags.IsComponentsV2,
          });

          setTimeout(async () => {
            try {
              if (sentMessage.resource) {
                await sentMessage.resource.message.delete();
              } else {
                await sentMessage.delete();
              }
            } catch (error) {}
            return;
          }, 5_000);
          return;
        } else {
          return interaction.reply({
            components: [erreurContainer],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          });
        }
      }

      const ancienneSemaine = data.find(
        (q) => q.semaineId === dernierQuizz.semaineId - 1 && q.envoyer !== 0,
      );

      if (ancienneSemaine) {
        const recapChannel = client.channels.cache.get("1504415278120046622");

        if (recapChannel) {
          const recapContainer = new ContainerBuilder()
            .setAccentColor(config.serveur[serveur].couleur)
            .addTextDisplayComponents((text) =>
              text.setContent("## 📊 Récapitulatif du Quizz"),
            );

          [1, 2, 3].forEach((questionId) => {
            const questionData = ancienneSemaine[`question${questionId}`];

            const reponses = questionData.reponse || [];

            const bonnesReponses = reponses.filter(
              (r) => r.bonne_reponse === true,
            ).length;

            const mauvaisesReponses = reponses.filter(
              (r) => r.bonne_reponse === false,
            ).length;

            const total = bonnesReponses + mauvaisesReponses;

            const tauxBonne =
              total > 0 ? ((bonnesReponses / total) * 100).toFixed(1) : 0;

            const tauxMauvaise =
              total > 0 ? ((mauvaisesReponses / total) * 100).toFixed(1) : 0;

            recapContainer
              .addSeparatorComponents((separator) => separator)

              .addTextDisplayComponents((text) =>
                text.setContent(
                  `### ❓ Question ${questionId}\n${questionData.question}`,
                ),
              )

              .addSeparatorComponents((separator) => separator)

              .addTextDisplayComponents((text) =>
                text.setContent(
                  [
                    `✅ **Bonnes réponses :** ${bonnesReponses} (${tauxBonne}%)`,
                    `❌ **Mauvaises réponses :** ${mauvaisesReponses} (${tauxMauvaise}%)`,
                    `📨 **Total des réponses :** ${total}`,
                  ].join("\n"),
                ),
              );
          });

          await recapChannel.send({
            components: [recapContainer],
            flags: MessageFlags.IsComponentsV2,
          });
        }
      }

      dernierQuizz.envoyer = Date.now();

      saveData(`data/${serveur}/quizz.json`, data);

      const container = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
        .addTextDisplayComponents((text) =>
          text.setContent(
            `## 🧠 Quizz de la semaine\nRépondez aux 3 questions ci-dessous.`,
          ),
        );

      questions.forEach((question, index) => {
        container
          .addSeparatorComponents((separator) => separator)
          .addTextDisplayComponents((text) =>
            text.setContent(
              `### Question ${index + 1} :\n${question.question}`,
            ),
          );
      });

      container
        .addSeparatorComponents((separator) => separator)
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`quizz_repondre-${dernierQuizz.semaineId}`)
              .setLabel("💬 Répondre aux Questions")
              .setStyle(ButtonStyle.Success),
          ),
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } else if (subcommand === "gerer") {
      const container = new ContainerBuilder()
        .setAccentColor(config.serveur[serveur].couleur)
        .addTextDisplayComponents((text) =>
          text.setContent("## 🧠 Gestion du Quizz"),
        );

      questions.forEach((question, index) => {
        container
          .addSeparatorComponents((separator) => separator)
          .addSectionComponents((section) =>
            section
              .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent(
                  `### Question ${index + 1} :\n${
                    question?.question?.trim()?.length > 0
                      ? question.question
                      : "*Aucune question définie*"
                  }`,
                ),
              )
              .setButtonAccessory((button) =>
                button
                  .setCustomId(
                    `quizz_modifier-${dernierQuizz.semaineId}-${index + 1}`,
                  )
                  .setLabel(`✏️ Modifier la Question ${index + 1}`)
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(dernierQuizz.envoyer !== 0),
              ),
          );
      });

      if (interaction.isMessageComponent()) {
        const sentMessage = await interaction.update({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          withResponse: true,
        });

        setTimeout(async () => {
          try {
            if (sentMessage.resource) {
              await sentMessage.resource.message.delete();
            } else {
              await sentMessage.delete();
            }
          } catch (error) {}
        }, 5_000);
      } else {
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }
  },
};

function getWeekNumber(date) {
  const currentDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );

  const dayNum = currentDate.getUTCDay() || 7;

  currentDate.setUTCDate(currentDate.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));

  return Math.ceil(((currentDate - yearStart) / 86400000 + 1) / 7);
}
