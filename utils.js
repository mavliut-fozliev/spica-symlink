import fs from "fs";
import path from "path";

export const getRootDir = (directoryPath) => path.join(process.cwd(), directoryPath);

export function isRootDirExist(directoryPath) {
  return fs.existsSync(getRootDir(directoryPath));
}

const getVScodeSettingsPath = (directoryPath) => path.join(getRootDir(directoryPath), ".vscode", "settings.json");

const getGitPath = (directoryPath) => path.join(getRootDir(directoryPath), ".git");
const getGitExcludePath = (directoryPath) => path.join(getGitPath(directoryPath), "info", "exclude");

export function sanitize(str) {
  return str.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
}

export function getDivider() {
  return process.platform === "win32" ? "/" : "\\";
}

export function isSettingsExist(directoryPath) {
  return fs.existsSync(getVScodeSettingsPath(directoryPath));
}

export function loadSettings(directoryPath) {
  if (!fs.existsSync(getVScodeSettingsPath(directoryPath))) return {};
  try {
    return JSON.parse(fs.readFileSync(getVScodeSettingsPath(directoryPath), "utf8"));
  } catch (err) {
    console.warn("Warning: Failed to parse .vscode/settings.json");
    return {};
  }
}

export function saveSettings(settings, directoryPath) {
  fs.writeFileSync(getVScodeSettingsPath(directoryPath), JSON.stringify(settings, null, 2));
}

export function isGitExist(directoryPath) {
  return fs.existsSync(getGitPath(directoryPath));
}

export function isGitExcludeExist(directoryPath) {
  return fs.existsSync(getGitExcludePath(directoryPath));
}

export function loadGitExclude(directoryPath) {
  if (!fs.existsSync(getGitExcludePath(directoryPath))) return "";
  try {
    return fs.readFileSync(getGitExcludePath(directoryPath), "utf8");
  } catch {
    return "";
  }
}

export function saveGitExclude(content, directoryPath) {
  fs.writeFileSync(getGitExcludePath(directoryPath), content);
}
