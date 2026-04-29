#!/bin/bash
set -e

if adb devices 2>/dev/null | grep -q "emulator"; then
  echo "Emulator already running — skipping start."
else
  AVD=$(emulator -list-avds 2>/dev/null | head -1)

  if [ -z "$AVD" ]; then
    echo ""
    echo "No AVD found. Create one in Android Studio:"
    echo "  More Actions → Virtual Device Manager → Create Device"
    echo ""
    exit 1
  fi

  echo "Starting emulator: $AVD"
  nohup emulator -avd "$AVD" -no-audio -no-boot-anim > /dev/null 2>&1 &

  echo "Waiting for emulator to finish booting..."
  adb wait-for-device shell \
    'while [[ -z $(getprop sys.boot_completed 2>/dev/null) ]]; do sleep 2; done'
  sleep 2
  echo "Emulator ready."
fi

npx expo start --android --go
