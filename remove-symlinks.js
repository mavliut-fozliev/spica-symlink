import fs from "fs";
import path from "path";
import { loadSettings, saveSettings, loadGitExclude, saveGitExclude, getRootDir, isSettingsExist, isGitExcludeExist, isRootDirExist } from "./utils.js";

function removeSymlinks(module, directoryPath) {
  const moduleLinkPath = path.join(getRootDir(directoryPath), `${module}_link`);
  if (!fs.existsSync(moduleLinkPath)) return;

  fs.rmSync(moduleLinkPath, { recursive: true, force: true });
}

function updateSettings(directoryPath) {
  if (!isSettingsExist(directoryPath)) return;

  const settings = loadSettings(directoryPath);
  const excludes = settings["files.exclude"] || {};

  if ("bucket" in excludes) {
    delete excludes["bucket"];
  }
  if ("function" in excludes) {
    delete excludes["function"];
  }

  settings["files.exclude"] = excludes;
  saveSettings(settings, directoryPath);
}

function updateGitExclude(directoryPath) {
  if (!isGitExcludeExist(directoryPath)) return;

  const content = loadGitExclude(directoryPath);

  const lines = content.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    const linesToDelete = ["bucket_link", "function_link", ".vscode"];
    return !linesToDelete.includes(trimmed);
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
