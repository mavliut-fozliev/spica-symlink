import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { loadSettings, saveSettings, loadGitExclude, saveGitExclude, getRootDir, isGitExist, sanitize, isRootDirExist } from "./utils.js";

function getAvailableName(baseName, directoryPath) {
  let name = baseName;
  let counter = 1;

  while (fs.existsSync(path.join(getRootDir(directoryPath), name))) {
    name = `${baseName}_${counter}`;
    counter++;
  }
  return name;
}

function createSymlinks(module, directoryPath) {
  const modulePath = path.join(getRootDir(directoryPath), module);
  if (!fs.existsSync(modulePath)) return;

  const moduleLinkPath = path.join(getRootDir(directoryPath), `${module}_link`);
  fs.mkdirSync(moduleLinkPath);

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
      const linkPath = path.join(moduleLinkPath, finalTitle);

      const relativeTarget = path.relative(moduleLinkPath, path.join(modulePath, folder));

      fs.symlinkSync(relativeTarget, linkPath, process.platform === "win32" ? "junction" : "dir");
      console.log(`Created symlink: ${finalTitle} → ${folder}`);
    } catch (err) {
      console.warn(`Failed to parse ${schemaPath}:`, err.message);
    }
  }
}

function updateSettings(directoryPath) {
  const vscodeDir = path.join(getRootDir(directoryPath), ".vscode");

  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir);
  }

  let settings = loadSettings(directoryPath);

  settings["files.exclude"] = settings["files.exclude"] || {};

  settings["files.exclude"]["bucket"] = true;
  settings["files.exclude"]["function"] = true;

  saveSettings(settings, directoryPath);
}

function updateGitExclude(directoryPath) {
  if (!isGitExist(directoryPath)) return;

  const prevContent = loadGitExclude(directoryPath);
  const content = prevContent + "\nbucket_link\nfunction_link\n.vscode";

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
