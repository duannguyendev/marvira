#!/bin/bash
# Runs automatically from the Xcode "Apply Google Maps API Key" build phase.
# Codemagic: uses GOOGLE_MAPS_API_KEY from environment.
# Local: falls back to marvira_mobile/.env.local
set -euo pipefail

KEY="${GOOGLE_MAPS_API_KEY:-}"

if [ -z "$KEY" ]; then
  ENV_FILE="${SRCROOT}/../.env.local"
  if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE="${SRCROOT}/../.env"
  fi
  if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC2162
    while IFS= read -r line || [ -n "$line" ]; do
      case "$line" in
        ''|\#*) continue ;;
        GOOGLE_MAPS_API_KEY=*)
          KEY="${line#GOOGLE_MAPS_API_KEY=}"
          KEY="${KEY%\"}"
          KEY="${KEY#\"}"
          KEY="${KEY%\'}"
          KEY="${KEY#\'}"
          ;;
      esac
    done < "$ENV_FILE"
  fi
fi

if [ -z "$KEY" ] || [ "$KEY" = "YOUR_GOOGLE_MAPS_API_KEY" ]; then
  echo "error: GOOGLE_MAPS_API_KEY is missing or invalid." >&2
  echo "  Codemagic: set Secure ENV GOOGLE_MAPS_API_KEY" >&2
  echo "  Local: create marvira_mobile/.env.local (see .env.example)" >&2
  exit 1
fi

PLIST="${TARGET_BUILD_DIR}/${INFOPLIST_PATH}"
if [ ! -f "$PLIST" ]; then
  echo "error: Info.plist not found at $PLIST" >&2
  exit 1
fi

if /usr/libexec/PlistBuddy -c "Print :GMSApiKey" "$PLIST" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c "Set :GMSApiKey ${KEY}" "$PLIST"
else
  /usr/libexec/PlistBuddy -c "Add :GMSApiKey string ${KEY}" "$PLIST"
fi

echo "GMSApiKey applied to $(basename "$PLIST")"
