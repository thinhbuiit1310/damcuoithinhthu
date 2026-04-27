#!/bin/bash
# Deploy script: copies files to temp dir (no .git) to avoid Vercel GitHub connection issues
set -e
DEPLOY_DIR=$(mktemp -d)
trap "rm -rf $DEPLOY_DIR" EXIT

# Copy all files except .git
find . -not -path './.git/*' -not -path './.git' -not -name '.env.local' | while read f; do
  if [ -d "$f" ]; then
    mkdir -p "$DEPLOY_DIR/$f"
  else
    cp "$f" "$DEPLOY_DIR/$f" 2>/dev/null || true
  fi
done

# Copy .vercel config
cp -r .vercel "$DEPLOY_DIR/"

cd "$DEPLOY_DIR"
vercel deploy --token "$VERCEL_TOKEN" --yes --prod
