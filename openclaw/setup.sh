#!/usr/bin/env bash
# openclaw/setup.sh
# Symlinks OpenClaw config files into ~/.openclaw/ and installs OpenClaw globally.
# Run once from the project root:  bash openclaw/setup.sh

set -e

OPENCLAW_HOME="$HOME/.openclaw"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Installing OpenClaw globally..."
npm install -g openclaw@latest

echo "==> Creating ~/.openclaw directory structure..."
mkdir -p "$OPENCLAW_HOME/workspace/skills/fitcoach"

# ── Config file ──────────────────────────────────────────────────────────────
# Substitute env vars into openclaw.json (TELEGRAM_BOT_TOKEN must be exported)
echo "==> Writing ~/.openclaw/openclaw.json..."
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "    WARNING: TELEGRAM_BOT_TOKEN is not set. Edit ~/.openclaw/openclaw.json manually."
fi
sed "s|\${TELEGRAM_BOT_TOKEN}|${TELEGRAM_BOT_TOKEN:-YOUR_BOT_TOKEN_HERE}|g" \
  "$SCRIPT_DIR/openclaw.json" > "$OPENCLAW_HOME/openclaw.json"

# ── Workspace files (copied — OpenClaw sandboxes symlinks outside its root) ──
echo "==> Copying workspace files..."
# Skills must live as real files inside ~/.openclaw/ — symlinks outside
# that root are rejected by OpenClaw's sandbox.
# Re-run this script after editing skill files in the repo.

cp "$SCRIPT_DIR/workspace/AGENTS.md" \
   "$OPENCLAW_HOME/workspace/AGENTS.md"

# Skills loaded from workspace/skills/ (source: openclaw-workspace)
cp "$SCRIPT_DIR/workspace/skills/fitcoach/SKILL.md" \
   "$OPENCLAW_HOME/workspace/skills/fitcoach/SKILL.md"

cp "$SCRIPT_DIR/workspace/skills/fitcoach/index.js" \
   "$OPENCLAW_HOME/workspace/skills/fitcoach/index.js"

echo "    Skill copied to ~/.openclaw/workspace/skills/fitcoach/"

# ── Environment variables ────────────────────────────────────────────────────
echo ""
echo "==> Set these environment variables before running OpenClaw:"
echo ""
echo "    export FITCOACH_API_URL=http://localhost:4000"
echo "    export FITCOACH_INTERNAL_KEY=<value of INTERNAL_API_KEY in backend/.env>"
echo "    export TELEGRAM_BOT_TOKEN=<your bot token>"
echo ""
echo "==> Then start the gateway:"
echo ""
echo "    openclaw gateway"
echo ""
echo "Done. The old telegram/ Telegraf bot is no longer needed."
echo "Stop it if it is running — both bots cannot share the same Telegram token."
