require("dotenv").config({ quiet: true });
const { connectMongo } = require("./util/database/index");

(async () => {
  await connectMongo();
  require("./web");
  require("./main");
})();
