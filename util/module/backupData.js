require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");
const archiver = require("archiver");

const DATA_FOLDER = path.join(__dirname, "..", "..", "data");
const BACKUP_FOLDER = path.join(__dirname, "..", "backups");
const TOKEN_PATH = path.join(__dirname, "..", "..", "token.json");

function getTodayDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
}

async function zipDataFolder(zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(DATA_FOLDER, false);
    archive.finalize();
  });
}

function getOAuth2Client() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "urn:ietf:wg:oauth:2.0:oob",
  );
  return oAuth2Client;
}

async function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
  });
  console.log("Authorize this app by visiting this url:", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject(err);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        oAuth2Client.setCredentials(token);
        resolve(oAuth2Client);
      });
    });
  });
}

async function authorize() {
  const oAuth2Client = getOAuth2Client();

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } else {
    return getAccessToken(oAuth2Client);
  }
}

async function uploadToDrive(zipPath, zipName, auth) {
  const drive = google.drive({ version: "v3", auth });

  await drive.files.create({
    requestBody: {
      name: zipName,
      mimeType: "application/zip",
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // ← ici
    },
    media: {
      mimeType: "application/zip",
      body: fs.createReadStream(zipPath),
    },
  });
}

async function zipAndUpload() {
  if (!fs.existsSync(BACKUP_FOLDER)) fs.mkdirSync(BACKUP_FOLDER);

  const date = getTodayDate();
  const zipName = `${date}.zip`;
  const zipPath = path.join(BACKUP_FOLDER, zipName);

  await zipDataFolder(zipPath);
  const auth = await authorize();
  await uploadToDrive(zipPath, zipName, auth);

  fs.unlinkSync(zipPath);
  console.log(`✅ Backup ${zipName} envoyé sur Google Drive`);
}

module.exports = { zipAndUpload };
