#!/usr/bin/env bash
set -euo pipefail

# 自动修复并推送 mustSign 到远端仓库的脚本
# 用法: bash scripts/auto_fix_push.sh [REMOTE_URL]
# 示例: bash scripts/auto_fix_push.sh https://github.com/wupengfei8260/MyAPP2.git

REMOTE=${1:-https://github.com/wupengfei8260/MyAPP2.git}
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_MUSTSIGN="$SRC_DIR/modules/home/mustSign"

if [ ! -d "$SRC_MUSTSIGN" ]; then
  echo "错误：未找到源 mustSign 目录：$SRC_MUSTSIGN"
  exit 1
fi

CLONE_DIR=$(mktemp -d /tmp/MyAPP2_clone_XXXX)
echo "克隆远程仓库 $REMOTE 到临时目录: $CLONE_DIR"

git clone "$REMOTE" "$CLONE_DIR"
cd "$CLONE_DIR"

BRANCH=fix/mustSign-case-$(date +%s)

echo "创建并切换到临时分支 $BRANCH"
git checkout -b "$BRANCH"

# 确保目标父目录存在
mkdir -p modules/home

# 先删除目标目录以避免旧残留
if [ -d "modules/home/mustSign" ]; then
  echo "移除远端仓库中现有 modules/home/mustSign（仅在 clone 的副本中）"
  rm -rf modules/home/mustSign
fi

echo "复制本地 mustSign 到克隆仓库： $SRC_MUSTSIGN -> $CLONE_DIR/modules/home/"
cp -R "$SRC_MUSTSIGN" modules/home/

# 强制 git 记录大小写变更：两步重命名
if git ls-files --error-unmatch modules/home/mustSign >/dev/null 2>&1; then
  echo "执行大小写规范化（两步重命名）"
  git mv modules/home/mustSign modules/home/mustSign_tmp || true
  git mv modules/home/mustSign_tmp modules/home/mustSign || true
fi

# 添加并提交
git add modules/home/mustSign -f || true

if git diff --cached --quiet; then
  echo "没有需要提交的变更（可能远端已存在相同内容）。"
else
  git commit -m "fix: add/normalize mustSign module"
  echo "提交已创建："
  git --no-pager log -1 --pretty=oneline
  echo "正在推送到远端 $REMOTE 分支 $BRANCH"
  git push -u origin "$BRANCH"
  echo "推送完成。请在 GitHub 创建 PR 或将该分支合并到目标分支。"
fi

echo
echo "临时克隆目录保留为： $CLONE_DIR"
echo "若你希望脚本自动把改动合并到主分支，请在确认无误后手动在本仓库或 GitHub 上合并分支。"

echo "完成。"
