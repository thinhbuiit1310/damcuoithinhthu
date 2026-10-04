#!/bin/bash
# Generate js/api-config.js from environment variables at deploy time
if [ -n "$JSONBIN_MASTER_KEY" ] && [ -n "$JSONBIN_BIN_ID" ] && [ -n "$ADMIN_PASSWORD_HASH" ]; then
  cat > js/api-config.js << EOF
// Auto-generated from environment variables at build time
const jsonbinConfig = {
    masterKey: '$JSONBIN_MASTER_KEY',
    binId: '$JSONBIN_BIN_ID',
    adminPasswordHash: '$ADMIN_PASSWORD_HASH'
};

export default jsonbinConfig;
EOF
  echo "Generated js/api-config.js from environment variables"
else
  echo "ERROR: Missing required environment variables (JSONBIN_MASTER_KEY, JSONBIN_BIN_ID, ADMIN_PASSWORD_HASH)"
  exit 1
fi
