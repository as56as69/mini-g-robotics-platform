#!/usr/bin/env bash
# mgbuild.sh — يبني ملف .bin جاهز للفلاشر لكل روبوت
# الاستخدام:
#   bash ~/mini-g-robotics-platform/mgbuild.sh gf     → ESP32-C3 (Mini G-F)
#   bash ~/mini-g-robotics-platform/mgbuild.sh gm     → ESP32 (Mini G-M)
#   bash ~/mini-g-robotics-platform/mgbuild.sh g      → ESP32-S3 (Mini G)
# الملف الناتج: ~/mini-g-robotics-platform/build/<model>/<model>.ino.bin
set -e
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

MODEL_ARG="${1:-gf}"
case "$MODEL_ARG" in
  gf) SKETCH=mini_gf_esp32; FQBN=esp32:esp32:esp32c3; EXTRA="-DUSE_TOUCH_SENSOR=0" ;;
  gm) SKETCH=mini_gm_esp32; FQBN=esp32:esp32:esp32 ;;
  g)  SKETCH=mini_g_esp32;  FQBN=esp32:esp32:esp32s3 ;;
  *)  echo "الاستخدام: bash mgbuild.sh [gf|gm|g]"; exit 1 ;;
esac

SKETCH_DIR="/tmp/opencode/mgbuild_$SKETCH"
rm -rf "$SKETCH_DIR"; mkdir -p "$SKETCH_DIR/$SKETCH"
cp "src/firmware/$SKETCH.ino" "$SKETCH_DIR/$SKETCH/"

arduino-cli compile \
  --fqbn "$FQBN" \
  --output-dir "$SKETCH_DIR/build" \
  --build-property "compiler.cpp.extra_flags=$EXTRA" \
  "$SKETCH_DIR/$SKETCH"

mkdir -p "$PROJECT_DIR/build/$SKETCH"
cp "$SKETCH_DIR/build/$SKETCH.ino.bin" "$PROJECT_DIR/build/$SKETCH/"

echo ""
echo "✅ ملف .bin جاهز في: $PROJECT_DIR/build/$SKETCH/$SKETCH.ino.bin"
echo "   الآن: لوحة الطفل → تبويب «⚡ الفلاشر» → اختر هذا الملف → رفع"
