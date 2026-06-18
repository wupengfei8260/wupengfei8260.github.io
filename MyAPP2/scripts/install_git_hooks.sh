#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d .git ]; then
  echo "错误：当前目录不是 git 仓库，无法安装 hooks。"
  exit 1
fi

HOOK_DIR=".git/hooks"
HOOK_FILE="$HOOK_DIR/pre-commit"

mkdir -p "$HOOK_DIR"

if [ -f "$HOOK_FILE" ]; then
  cp "$HOOK_FILE" "$HOOK_FILE.bak.$(date +%s)"
  echo "已备份现有 pre-commit hook。"
fi

printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  '' \
  'ROOT_DIR="$(git rev-parse --show-toplevel)"' \
  'cd "$ROOT_DIR"' \
  '' \
  'bash scripts/pre_commit_docs_sync.sh' > "$HOOK_FILE"

chmod +x "$HOOK_FILE"

echo "已安装 pre-commit hook：提交前自动同步需求文档自动维护区块。"
