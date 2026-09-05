#!/usr/bin/env bash
set -euo pipefail

target_url="${1:-https://caption-confidence.sociobot.in}"
node scripts/verify-url.mjs "$target_url"
