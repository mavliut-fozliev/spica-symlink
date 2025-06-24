import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { loadSettings, saveSettings, loadGitExclude, saveGitExclude, rootDir, getDivider, isGitExist, sanitize } from "./utils.js";

function getAvailableName(baseName) {
  let name = baseName;
  let counter = 1;

  while (fs.existsSync(path.join(rootDir, name))) {
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

function createSymlinks(module) {
  const modulePath = path.join(rootDir, module);
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
      const finalTitle = getAvailableName(safeTitle);
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

function updateSettings() {
  if (settingsDirsToExclude.size < 1) return;

  const vscodeDir = path.join(rootDir, ".vscode");

  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir);
  }

  let settings = loadSettings();

  settings["files.exclude"] = settings["files.exclude"] || {};

  for (const dir of settingsDirsToExclude) {
    settings["files.exclude"][`**/${dir}`] = true;
  }

  saveSettings(settings);
}

function updateGitExclude() {
  if (gitIgnoreDirsToAdd.size < 1 || !isGitExist()) return;

  const allFolders = Array.from(gitIgnoreDirsToAdd).join("\n");

  const prevContent = loadGitExclude();
  const content = prevContent + "\n" + allFolders + "\n.vscode/";

  saveGitExclude(content);
}

export function create() {
  createSymlinks("bucket");
  createSymlinks("function");
  updateSettings();
  updateGitExclude();
}
