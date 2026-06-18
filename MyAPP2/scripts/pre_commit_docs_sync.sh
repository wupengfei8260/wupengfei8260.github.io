#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

bash scripts/docs_sync_apply.sh --staged

echo "pre-commit 文档同步检查完成。"
