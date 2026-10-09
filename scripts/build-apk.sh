#!/usr/bin/env bash
# ==============================================================================
# OB Hotspot — Automated Android APK Build & Packaging Script
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== [1/6] Navigating to Project Root ==="
cd "${ROOT_DIR}"
echo "Working directory: ${ROOT_DIR}"

echo "=== [2/6] Building Web Application Bundle (Vite) ==="
npm run build

echo "=== [3/6] Syncing Web Assets to Native Android Platform (Capacitor) ==="
npx cap sync android

echo "=== [4/6] Checking Java and Android SDK Environment ==="
JAVA_BIN="$(command -v java || true)"
GRADLEW_BIN="${ROOT_DIR}/android/gradlew"

if [[ -z "${JAVA_BIN}" ]]; then
  echo "[-] ERROR: Java (JDK 17 or JDK 21) is not found in PATH."
  echo "    Please install OpenJDK 17/21 or set JAVA_HOME before running this script."
  echo "    Ubuntu/Debian: sudo apt-get install -y openjdk-21-jdk"
  echo "    macOS: brew install openjdk@21"
  echo "    Windows: Install OpenJDK 21 via winget or Adoptium installer."
  exit 1
fi

echo "[+] Java found: $("${JAVA_BIN}" -version 2>&1 | head -n 1)"

if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  # Check standard installation paths
  if [[ -d "${HOME}/Android/Sdk" ]]; then
    export ANDROID_HOME="${HOME}/Android/Sdk"
  elif [[ -d "${HOME}/Library/Android/sdk" ]]; then
    export ANDROID_HOME="${HOME}/Library/Android/sdk"
  elif [[ -d "/opt/android-sdk" ]]; then
    export ANDROID_HOME="/opt/android-sdk"
  else
    echo "[-] WARNING: ANDROID_HOME / ANDROID_SDK_ROOT is not set."
    echo "    Gradle will attempt to locate SDK via android/local.properties."
  fi
fi

if [[ -n "${ANDROID_HOME:-}" ]]; then
  echo "[+] Android SDK Home: ${ANDROID_HOME}"
  export ANDROID_SDK_ROOT="${ANDROID_HOME}"
fi

echo "=== [5/6] Executing Gradle Assemble Build ==="
cd "${ROOT_DIR}/android"
chmod +x ./gradlew

# Build debug APK (self-signed, immediately installable via sideload)
./gradlew assembleDebug

OUTPUT_APK="${ROOT_DIR}/android/app/build/outputs/apk/debug/app-debug.apk"

if [[ ! -f "${OUTPUT_APK}" ]]; then
  echo "[-] Build failed: Expected APK not found at ${OUTPUT_APK}"
  exit 1
fi

echo "=== [6/6] Packaging Artifact to android-release/ ==="
mkdir -p "${ROOT_DIR}/android-release"
TARGET_APK="${ROOT_DIR}/android-release/OB-Hotspot.apk"

cp -f "${OUTPUT_APK}" "${TARGET_APK}"
echo "[+] Successfully packaged APK: ${TARGET_APK}"

APK_SIZE="$(du -h "${TARGET_APK}" | cut -f1)"
echo "[+] Size: ${APK_SIZE}"

if command -v sha256sum >/dev/null 2>&1; then
  APK_SHA="$(sha256sum "${TARGET_APK}" | awk '{print $1}')"
  echo "[+] SHA-256: ${APK_SHA}"
  echo "${APK_SHA}  OB-Hotspot.apk" > "${ROOT_DIR}/android-release/OB-Hotspot.apk.sha256"
fi

echo "=============================================================================="
echo " BUILD COMPLETE: android-release/OB-Hotspot.apk is ready for deployment"
echo "=============================================================================="
