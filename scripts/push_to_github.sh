#!/usr/bin/env bash
# Run only after connecting your own git credentials with write permission.
set -euo pipefail
REPO_URL="https://github.com/raiirajet/Battle-tap.git"
TARGET_DIR="${1:-./Apk-test}"
if [[ -e "$TARGET_DIR" ]]; then
  echo "Target already exists: $TARGET_DIR" >&2
  exit 1
fi
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
git clone "$REPO_URL" "$TARGET_DIR"
cp -R "$SRC_DIR/lib" "$SRC_DIR/test" "$SRC_DIR/functions" "$SRC_DIR/docs" "$SRC_DIR/scripts" "$SRC_DIR/.github" "$TARGET_DIR/"
cp "$SRC_DIR/pubspec.yaml" "$SRC_DIR/analysis_options.yaml" "$SRC_DIR/firebase.json" \
  "$SRC_DIR/firestore.rules" "$SRC_DIR/firestore.indexes.json" "$SRC_DIR/.gitignore" \
  "$SRC_DIR/README.md" "$TARGET_DIR/"
cd "$TARGET_DIR"
git checkout -b feature/battle-tap-v1
 git add .
git commit -m "feat: initialize Battle Tap game and Firebase integration"
git push -u origin feature/battle-tap-v1
echo 'Branch pushed. Create a pull request from feature/battle-tap-v1 into main.'
