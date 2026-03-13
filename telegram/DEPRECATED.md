# Deprecated — Replaced by OpenClaw

This Telegraf bot has been superseded by the OpenClaw gateway integration.

See `../openclaw/` for the current Telegram channel implementation.

**Do not run this bot alongside OpenClaw** — both processes would share the
same `TELEGRAM_BOT_TOKEN` and Telegram only allows one active polling/webhook
connection per token, causing message delivery conflicts.

## Migration

```bash
# Stop this bot if running
# Then set up OpenClaw:
bash ../openclaw/setup.sh
```
