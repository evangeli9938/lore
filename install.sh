#!/usr/bin/env bash
set -euo pipefail

# Lore installer
# Usage:
#   bash install.sh                    # Clone to ~/.codex/plugins/lore-source + register marketplace
#   bash install.sh --codex-plugin     # Same as above (explicit)
#   bash install.sh --local            # Use current directory as plugin source (for contributors)

PLUGIN_NAME="lore"
REPO_URL="https://github.com/yimwoo/lore"
SOURCE_DIR="$HOME/.codex/plugins/lore-source"
MARKETPLACE_FILE="$HOME/.agents/plugins/marketplace.json"
CODEX_PLUGIN_CACHE_ROOT="$HOME/.codex/plugins/cache/codex-plugins/lore"

refresh_codex_plugin_cache() {
  local source_dir="$1"
  local cache_root="${CODEX_PLUGIN_CACHE_ROOT}"
  local refreshed=0

  if [ ! -d "${source_dir}" ]; then
    return 0
  fi

  if [ -d "${cache_root}" ]; then
    for cache_dir in "${cache_root}"/*/; do
      [ -d "${cache_dir}" ] || continue
      echo "Refreshing Codex plugin cache at ${cache_dir}..."
      mkdir -p "${cache_dir}"
      rsync -a --delete --exclude '.git' "${source_dir}/" "${cache_dir}"
      refreshed=1
    done
  fi

  if [ "${refreshed}" -eq 0 ]; then
    local seed_dir="${cache_root}/local"
    echo "Seeding Codex plugin cache at ${seed_dir}..."
    mkdir -p "${seed_dir}"
    rsync -a --delete --exclude '.git' "${source_dir}/" "${seed_dir}/"
    refreshed=1
  fi

  if [ "${refreshed}" -eq 1 ]; then
    echo "  Codex plugin cache refreshed."
  fi
}

LOCAL_MODE=false
for arg in "$@"; do
  case "$arg" in
    --local) LOCAL_MODE=true ;;
    --codex-plugin) ;; # default behavior
    --help|-h)
      echo "Lore Installer"
      echo ""
      echo "Usage:"
      echo "  bash install.sh                  Install as Codex plugin (clone to ~/.codex/plugins/lore-source)"
      echo "  bash install.sh --local          Use current directory as plugin source (contributors)"
      echo ""
      exit 0
      ;;
  esac
done

# Determine plugin path
if [ "$LOCAL_MODE" = true ]; then
  PLUGIN_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  MARKETPLACE_FILE="${PLUGIN_PATH}/.agents/plugins/marketplace.json"
  MARKETPLACE_PLUGIN_PATH="${PLUGIN_PATH}"
  echo "Local mode: using $PLUGIN_PATH as plugin source"
else
  PLUGIN_PATH="$SOURCE_DIR"
  MARKETPLACE_PLUGIN_PATH="./.codex/plugins/lore-source"

  if [ -d "$SOURCE_DIR/.git" ]; then
    echo "Updating existing source checkout at $SOURCE_DIR..."
    cd "$SOURCE_DIR"
    git fetch origin
    git reset --hard origin/main
    cd - > /dev/null
  else
    echo "Cloning Lore to $SOURCE_DIR..."
    mkdir -p "$(dirname "$SOURCE_DIR")"
    git clone "$REPO_URL" "$SOURCE_DIR"
  fi
fi

# Install dependencies
echo "Installing dependencies..."
cd "$PLUGIN_PATH"
npm install --silent
cd - > /dev/null

# Register in marketplace
MARKETPLACE_DIR="$(dirname "$MARKETPLACE_FILE")"
mkdir -p "$MARKETPLACE_DIR"

PLUGIN_MANIFEST="${PLUGIN_PATH}/.codex-plugin/plugin.json"
if [ ! -f "$PLUGIN_MANIFEST" ]; then
  echo "Error: ${PLUGIN_MANIFEST} not found." >&2
  exit 1
fi

node -e '
const fs = require("node:fs");
const manifestPath = process.argv[1];
const destPath = process.argv[2];
const pluginSourcePath = process.argv[3];
const ownerName = process.env.USER ?? "unknown";

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const loreEntry = {
  name: manifest.name,
  description: manifest.description,
  version: manifest.version,
  author: manifest.author ?? { name: ownerName },
  source: {
    source: "local",
    path: pluginSourcePath,
  },
  policy: {
    installation: "AVAILABLE",
    authentication: "ON_INSTALL",
  },
  category: "Productivity",
};

if (manifest.interface) {
  loreEntry.interface = manifest.interface;
}

const dest = fs.existsSync(destPath)
  ? JSON.parse(fs.readFileSync(destPath, "utf8"))
  : {
      name: "codex-plugins",
      description: "Codex plugin marketplace",
      owner: { name: ownerName },
      interface: { displayName: "Local Plugins" },
      plugins: [],
    };

dest.name ??= "codex-plugins";
dest.description ??= "Codex plugin marketplace";
dest.owner ??= { name: ownerName };
dest.interface ??= { displayName: "Local Plugins" };
dest.plugins ??= [];

const existingIndex = dest.plugins.findIndex((plugin) => plugin?.name === "lore");
if (existingIndex >= 0) {
  dest.plugins[existingIndex] = loreEntry;
} else {
  dest.plugins.push(loreEntry);
}

fs.writeFileSync(destPath, `${JSON.stringify(dest, null, 2)}\n`, "utf8");

const action = existingIndex >= 0 ? "Updated" : "Added";
console.log(`${action} Lore plugin entry (version ${loreEntry.version})`);
' "$PLUGIN_MANIFEST" "$MARKETPLACE_FILE" "$MARKETPLACE_PLUGIN_PATH"

refresh_codex_plugin_cache "$PLUGIN_PATH"

echo ""
echo "Lore installed successfully."
echo ""
echo "Next steps:"
echo "  1. Restart Codex"
echo "  2. Open the plugin directory, switch to Local Plugins, and install Lore"
echo "  3. MCP recall tools are bundled with the plugin install"
echo "  4. Start promoting knowledge:"
echo ""
echo "     cd $PLUGIN_PATH"
echo "     npm run cli -- promote \\"
echo "       --kind domain_rule \\"
echo "       --title \"Use snake_case\" \\"
echo "       --content \"All DB columns must use snake_case.\""
echo ""
echo "Plugin source: $PLUGIN_PATH"
echo "Marketplace:   $MARKETPLACE_FILE"
