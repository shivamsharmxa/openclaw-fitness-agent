FROM node:20-slim

# Install openclaw globally
RUN npm install -g openclaw@latest

# Set up ~/.openclaw directory structure
RUN mkdir -p /root/.openclaw/workspace/skills/fitcoach

# Copy workspace files
COPY workspace/AGENTS.md /root/.openclaw/workspace/AGENTS.md
COPY workspace/skills/fitcoach/SKILL.md /root/.openclaw/workspace/skills/fitcoach/SKILL.md
COPY workspace/skills/fitcoach/index.js /root/.openclaw/workspace/skills/fitcoach/index.js

# Copy config and substitute env vars at container startup
COPY openclaw.json /tmp/openclaw.json.tpl
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
