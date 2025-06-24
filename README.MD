# spica-symlink

A CLI tool to create symbolic links for folders in the Spica project, allowing display of human-readable titles instead of raw MongoDB ObjectIDs.

---

## Installation

```bash
npm install -g spica-symlink
```

---

## Usage

```bash
spica-symlink create <path>
# Example:
spica-symlink create ./resources

# → Creates symbolic links inside ./resources/function and ./resources/bucket
#    using titles from each folder's schema.yaml
```

```bash
spica-symlink remove <path>
# Example:
spica-symlink remove ./resources

# → Removes previously created symbolic links in the given path
```

---

## Arguments

- `<path>` — Relative path to the root of the Spica resources directory

---

## Requirements

- Node.js v14 or newer
- Operating system that supports symbolic links (Linux/macOS or Windows with admin rights)

---
