#!/bin/bash
# FUGUE Dashboard Production Startup Script
# Manages: Next.js (next start) + Cloudflare Tunnel (cloudflared)
# Both processes terminate together on signal or crash.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="/tmp/fugue-dashboard"
NEXT_LOG="$LOG_DIR/next.log"
TUNNEL_LOG="$LOG_DIR/tunnel.log"
PID_FILE="$LOG_DIR/pids"

# Node.js path (nvm)
export PATH="/Users/masayuki/.nvm/versions/node/v22.19.0/bin:$PATH"

mkdir -p "$LOG_DIR"

# --- Cleanup function: kill all child processes ---
cleanup() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Shutting down FUGUE Dashboard..." | tee -a "$NEXT_LOG"

  # Kill caffeinate if running
  if [[ -n "${CAFFEINATE_PID:-}" ]] && kill -0 "$CAFFEINATE_PID" 2>/dev/null; then
    kill "$CAFFEINATE_PID" 2>/dev/null || true
  fi

  # Kill Next.js
  if [[ -n "${NEXT_PID:-}" ]] && kill -0 "$NEXT_PID" 2>/dev/null; then
    kill "$NEXT_PID" 2>/dev/null || true
    wait "$NEXT_PID" 2>/dev/null || true
  fi

  # Kill cloudflared
  if [[ -n "${TUNNEL_PID:-}" ]] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    kill "$TUNNEL_PID" 2>/dev/null || true
    wait "$TUNNEL_PID" 2>/dev/null || true
  fi

  rm -f "$PID_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] FUGUE Dashboard stopped." | tee -a "$NEXT_LOG"
  exit 0
}

trap cleanup SIGTERM SIGINT SIGHUP EXIT

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting FUGUE Dashboard..." | tee "$NEXT_LOG"

# --- Step 1: Build Next.js (production) ---
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Building Next.js..." | tee -a "$NEXT_LOG"
cd "$PROJECT_DIR"
npm run build >> "$NEXT_LOG" 2>&1

# --- Step 2: Prevent Mac sleep (display allowed to sleep, system stays awake) ---
caffeinate -s &
CAFFEINATE_PID=$!
echo "[$(date '+%Y-%m-%d %H:%M:%S')] caffeinate started (PID: $CAFFEINATE_PID)" | tee -a "$NEXT_LOG"

# --- Step 3: Start Next.js production server ---
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Next.js (port 3000)..." | tee -a "$NEXT_LOG"
npm run start >> "$NEXT_LOG" 2>&1 &
NEXT_PID=$!
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Next.js started (PID: $NEXT_PID)" | tee -a "$NEXT_LOG"

# Wait for Next.js to be ready
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|307"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Next.js is ready." | tee -a "$NEXT_LOG"
    break
  fi
  if ! kill -0 "$NEXT_PID" 2>/dev/null; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Next.js failed to start." | tee -a "$NEXT_LOG"
    exit 1
  fi
  sleep 1
done

# --- Step 4: Start Cloudflare Tunnel ---
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Cloudflare Tunnel..." | tee -a "$TUNNEL_LOG"
cloudflared tunnel --config /Users/masayuki/.cloudflared/config.yml run fugue-cockpit-agent >> "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!
echo "[$(date '+%Y-%m-%d %H:%M:%S')] cloudflared started (PID: $TUNNEL_PID)" | tee -a "$TUNNEL_LOG"

# Save PIDs for external monitoring
echo "NEXT_PID=$NEXT_PID" > "$PID_FILE"
echo "TUNNEL_PID=$TUNNEL_PID" >> "$PID_FILE"
echo "CAFFEINATE_PID=$CAFFEINATE_PID" >> "$PID_FILE"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] FUGUE Dashboard running." | tee -a "$NEXT_LOG"
echo "  Next.js:    http://localhost:3000 (PID: $NEXT_PID)" | tee -a "$NEXT_LOG"
echo "  Tunnel:     https://fugue.cursorvers.com (PID: $TUNNEL_PID)" | tee -a "$NEXT_LOG"
echo "  Logs:       $LOG_DIR/" | tee -a "$NEXT_LOG"

# --- Monitor: if either process dies, kill the other ---
while true; do
  if ! kill -0 "$NEXT_PID" 2>/dev/null; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Next.js crashed. Shutting down..." | tee -a "$NEXT_LOG"
    cleanup
  fi
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] cloudflared crashed. Shutting down..." | tee -a "$TUNNEL_LOG"
    cleanup
  fi
  sleep 5
done
