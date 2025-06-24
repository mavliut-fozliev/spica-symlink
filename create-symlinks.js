import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { loadSettings, saveSettings, loadGitExclude, saveGitExclude, getRootDir, getDivider, isGitExist, sanitize, isRootDirExist } from "./utils.js";

function getAvailableName(baseName, directoryPath) {
  let name = baseName;
  let counter = 1;

  while (fs.existsSync(path.join(getRootDir(directoryPath), name))) {
    name = `${baseName}_${counter}`;
    counter++;
  }
  return name;
}

function isValidObjectId(name) {
  return /^[a-f\d]{24}$/i.test(name);
}

const settingsDirsToExclude = new Set();
const gitIgnoreDirsToAdd = new Set();

function createSymlinks(module, directoryPath) {
  const modulePath = path.join(getRootDir(directoryPath), module);
  if (!fs.existsSync(modulePath)) return;

  const folders = fs.readdirSync(modulePath);

  for (const folder of folders) {
    const folderPath = path.join(modulePath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const schemaPath = path.join(folderPath, "schema.yaml");
    if (!fs.existsSync(schemaPath)) continue;

    try {
      const schema = yaml.load(fs.readFileSync(schemaPath, "utf8"));
      if (!schema) continue;

      const titleField = module == "function" ? "name" : "title";
      if (!schema[titleField]) continue;

      const safeTitle = sanitize(schema[titleField]);
      const finalTitle = getAvailableName(safeTitle, directoryPath);
      const linkPath = path.join(modulePath, finalTitle);

      gitIgnoreDirsToAdd.add(module + getDivider() + finalTitle);

      fs.symlinkSync(folder, linkPath, process.platform === "win32" ? "junction" : "dir");
      console.log(`Created symlink: ${finalTitle} → ${folder}`);

      if (isValidObjectId(folder)) {
        settingsDirsToExclude.add(folder);
      }
    } catch (err) {
      console.warn(`Failed to parse ${schemaPath}:`, err.message);
    }
  }
}

function updateSettings(directoryPath) {
  if (settingsDirsToExclude.size < 1) return;

  const vscodeDir = path.join(getRootDir(directoryPath), ".vscode");

  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir);
  }

  let settings = loadSettings(directoryPath);

  settings["files.exclude"] = settings["files.exclude"] || {};

  for (const dir of settingsDirsToExclude) {
    settings["files.exclude"][`**/${dir}`] = true;
  }

  saveSettings(settings, directoryPath);
}

function updateGitExclude(directoryPath) {
  if (gitIgnoreDirsToAdd.size < 1 || !isGitExist(directoryPath)) return;

  const allFolders = Array.from(gitIgnoreDirsToAdd).join("\n");

  const prevContent = loadGitExclude(directoryPath);
  const content = prevContent + "\n" + allFolders + "\n.vscode/";

  saveGitExclude(content, directoryPath);
}

export function create(directoryPath) {
  if (!isRootDirExist(directoryPath)) {
    throw new Error("The provided path does not exist");
  }

  createSymlinks("bucket", directoryPath);
  createSymlinks("function", directoryPath);
  updateSettings(directoryPath);
  updateGitExclude(directoryPath);
}
