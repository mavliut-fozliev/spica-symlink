import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { loadSettings, saveSettings, loadGitExclude, saveGitExclude, rootDir, sanitize, getDivider } from "./utils.js";

const vscodeSettingsPath = path.join(rootDir, ".vscode", "settings.json");
const gitExcludePath = path.join(rootDir, ".git", "info", "exclude");

const settingsDirsToUnexclude = new Set();
const gitIgnoreDirsToRemove = new Set();

function removeSymlinks(module) {
  const modulePath = path.join(rootDir, module);
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

function updateSettings() {
  if (settingsDirsToUnexclude.size < 1 || !fs.existsSync(vscodeSettingsPath)) return;

  const settings = loadSettings();
  const excludes = settings["files.exclude"] || {};

  for (const dir of settingsDirsToUnexclude) {
    const key = `**/${dir}`;
    if (key in excludes) {
      delete excludes[key];
      console.log(`Unexcluded folder: ${dir}`);
    }
  }

  settings["files.exclude"] = excludes;
  saveSettings(settings);
}

function updateGitExclude() {
  if (gitIgnoreDirsToRemove.size < 1 || !fs.existsSync(gitExcludePath)) return;

  const content = loadGitExclude();

  const lines = content.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    if (gitIgnoreDirsToRemove.has(trimmed) || trimmed === ".vscode/") {
      console.log(`Removed from git exclude: ${trimmed}`);
      return false;
    }
    return true;
  });

  saveGitExclude(lines.join("\n"));
}

export function remove() {
  removeSymlinks("bucket");
  removeSymlinks("function");
  updateSettings();
  updateGitExclude();
}
