import fs from "fs";
import path from "path";

const rootPath = "../../GitHub/spica-fintech";

export const rootDir = path.join(process.cwd(), rootPath);

const vscodeSettingsPath = path.join(rootDir, ".vscode", "settings.json");

const gitPath = path.join(rootDir, ".git");
const gitExcludePath = path.join(gitPath, "info", "exclude");

export function sanitize(str) {
  return str.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
}

export function getDivider() {
  return process.platform === "win32" ? "/" : "\\";
}

export function loadSettings() {
  if (!fs.existsSync(vscodeSettingsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(vscodeSettingsPath, "utf8"));
  } catch (err) {
    console.warn("Warning: Failed to parse .vscode/settings.json");
    return {};
  }
}

export function saveSettings(settings) {
  fs.writeFileSync(vscodeSettingsPath, JSON.stringify(settings, null, 2));
}

export function isGitExist() {
  return fs.existsSync(gitPath);
}

export function loadGitExclude() {
  if (!fs.existsSync(gitExcludePath)) return "";
  try {
    return fs.readFileSync(gitExcludePath, "utf8");
  } catch {
    return "";
  }
}

export function saveGitExclude(content) {
  fs.writeFileSync(gitExcludePath, content);
}
