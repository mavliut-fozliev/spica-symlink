import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import {
  loadSettings,
  saveSettings,
  loadGitExclude,
  saveGitExclude,
  getRootDir,
  sanitize,
  getDivider,
  isSettingsExist,
  isGitExcludeExist,
  isRootDirExist,
} from "./utils.js";

const settingsDirsToUnexclude = new Set();
const gitIgnoreDirsToRemove = new Set();

function removeSymlinks(module, directoryPath) {
  const modulePath = path.join(getRootDir(directoryPath), module);
  if (!fs.existsSync(modulePath)) return;

  const items = fs.readdirSync(modulePath);

  for (const item of items) {
    const itemPath = path.join(modulePath, item);

    try {
      const stat = fs.lstatSync(itemPath);
      if (!stat.isSymbolicLink()) continue;

      const targetPath = fs.readlinkSync(itemPath);
      const absoluteTarget = path.resolve(modulePath, targetPath);
      const schemaPath = path.join(absoluteTarget, "schema.yaml");

      if (!fs.existsSync(schemaPath)) continue;

      const schema = yaml.load(fs.readFileSync(schemaPath, "utf8"));
      if (!schema) continue;

      const titleField = module === "function" ? "name" : "title";
      if (!schema[titleField]) continue;

      const baseTitle = sanitize(schema[titleField]);
      if (item !== baseTitle && !item.startsWith(`${baseTitle}_`)) continue;

      fs.unlinkSync(itemPath);
      console.log(`Removed symlink: ${item}`);

      const folderName = path.basename(absoluteTarget);
      settingsDirsToUnexclude.add(folderName);

      gitIgnoreDirsToRemove.add(module + getDivider() + baseTitle);
    } catch (err) {
      console.warn(`Failed to process ${item}:`, err.message);
    }
  }
}

function updateSettings(directoryPath) {
  if (settingsDirsToUnexclude.size < 1 || !isSettingsExist(directoryPath)) return;

  const settings = loadSettings(directoryPath);
  const excludes = settings["files.exclude"] || {};

  for (const dir of settingsDirsToUnexclude) {
    const key = `**/${dir}`;
    if (key in excludes) {
      delete excludes[key];
      console.log(`Unexcluded folder: ${dir}`);
    }
  }

  settings["files.exclude"] = excludes;
  saveSettings(settings, directoryPath);
}

function updateGitExclude(directoryPath) {
  if (gitIgnoreDirsToRemove.size < 1 || !isGitExcludeExist(directoryPath)) return;

  const content = loadGitExclude(directoryPath);

  const lines = content.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    if (gitIgnoreDirsToRemove.has(trimmed) || trimmed === ".vscode/") {
      console.log(`Removed from git exclude: ${trimmed}`);
      return false;
    }
    return true;
  });

  saveGitExclude(lines.join("\n"), directoryPath);
}

export function remove(directoryPath) {
  if (!isRootDirExist(directoryPath)) {
    throw new Error("The provided path does not exist");
  }

  removeSymlinks("bucket", directoryPath);
  removeSymlinks("function", directoryPath);
  updateSettings(directoryPath);
  updateGitExclude(directoryPath);
}
