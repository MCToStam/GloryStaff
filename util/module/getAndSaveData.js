const fs = require("fs");
const path = require("path");

function getAbsolutePath(fileRelativePath) {
  return path.join(process.cwd(), fileRelativePath);
}

function getSubdirectories(folderRelativePath) {
  const folderPath = getAbsolutePath(folderRelativePath);
  if (!fs.existsSync(folderPath)) return [];

  return fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

function getFiles(folderRelativePath) {
  const folderPath = getAbsolutePath(folderRelativePath);
  if (!fs.existsSync(folderPath)) return [];

  return fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);
}

function copyFile(srcRelativePath, destRelativePath) {
  const src = getAbsolutePath(srcRelativePath);
  const dest = getAbsolutePath(destRelativePath);
  const destDir = path.dirname(dest);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(src, dest);
}

function deleteFile(fileRelativePath) {
  const filePath = getAbsolutePath(fileRelativePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function getData(fileRelativePath) {
  const filePath = getAbsolutePath(fileRelativePath);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

function getImage(fileRelativePath) {
  const filePath = getAbsolutePath(fileRelativePath);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath);
}

function saveData(fileRelativePath, data) {
  const filePath = getAbsolutePath(fileRelativePath);
  const dirPath = path.dirname(filePath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function saveImage(fileRelativePath, buffer) {
  const filePath = getAbsolutePath(fileRelativePath);
  const dirPath = path.dirname(filePath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(filePath, buffer);
}

module.exports = {
  getAbsolutePath,
  getSubdirectories,
  getFiles,
  copyFile,
  deleteFile,
  getData,
  getImage,
  saveData,
  saveImage,
};
