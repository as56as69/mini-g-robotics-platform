#!/usr/bin/env bash
# Mini G — one-shot dev launcher (school server :3300 + vite :3000)
# Usage: bash ~/mini-g-robotics-platform/mgdev.sh
set -u
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"

# Kill leftovers on the two ports (safe if already dead)
fuser -k 3300/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
sleep 1

cd "$PROJECT_DIR" || exit 1

setsid nohup node server/index.mjs > /tmp/mg-school-server.log 2>&1 < /dev/null &
setsid nohup npm run dev > /tmp/mg-vite.log 2>&1 &

sleep 5
echo "--- school server ---"
curl -s -m 5 http://localhost:3300/api/health; echo
echo "--- vite ---"
curl -s -m 5 http://localhost:3000 -o /dev/null -w "vite:%{http_code}\n"
echo "logs: /tmp/mg-school-server.log + /tmp/mg-vite.log (see /tmp/mg-school-server.log above)"
