const log = require("../../../util/module/log");

module.exports = async (client, error) => {
  log(
    `An error event was sent by Discord.js:
  Error message: ${error.message}
  Error: ${error}
  Error JSON: ${error.stack}`,
    "error",
    "red",
  );
};
