#!/usr/bin/env bash
set -e

# Substitute environment variables into openclaw.json
sed "s|\${TELEGRAM_BOT_TOKEN}|${TELEGRAM_BOT_TOKEN}|g" \
  /tmp/openclaw.json.tpl > /root/.openclaw/openclaw.json

echo "==> openclaw.json written"
echo "==> Starting OpenClaw gateway..."

exec openclaw gateway
