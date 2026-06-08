#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "检查仓库状态..."
if [ ! -d .git ]; then
  echo "警告：当前目录不是 git 仓库。脚本将输出需要你在有权限的机器上运行的命令。"
  echo
  echo "若需要强制修正大小写，请在仓库根目录运行以下三行（先备份并确认远端分支）："
  echo
  echo "git mv modules/home/mustSign modules/home/mustSign_tmp"
  echo "git mv modules/home/mustSign_tmp modules/home/mustSign"
  echo "git add -A && git commit -m \"fix: normalize mustSign folder name (case)\" && git push"
  echo
  exit 0
fi

# 确认 mustSign 目录存在
if [ ! -d "modules/home/mustSign" ]; then
  echo "错误：找不到 modules/home/mustSign 目录。当前目录下文件列表："
  ls -la modules/home || true
  exit 1
fi

# 使用临时名强制大小写变更
TMP_NAME="modules/home/mustSign_tmp_$(date +%s)"

echo "将 'modules/home/mustSign' 重命名为临时名以强制大小写修改："
git mv "modules/home/mustSign" "$TMP_NAME"

echo "再将临时名重命名回 'modules/home/mustSign'："
git mv "$TMP_NAME" "modules/home/mustSign"

git add -A
git commit -m "fix: normalize mustSign folder name (case)"

echo "提交已创建。现在请执行 'git push' 将改动推送到远端（可能需要凭据）："
echo "  git push"

echo "如果你想脚本自动 push，请在有权限的环境里重新运行脚本并设置环境变量 AUTO_PUSH=1。"
if [ "${AUTO_PUSH:-}" = "1" ]; then
  git push
  echo "已执行 git push。请稍等并在 GitHub Pages 上刷新页面以验证修复。"
fi

# 给出远端检测建议（在允许网络访问时）
echo
echo "建议：在浏览器里打开 https://<your-username>.github.io/<repo>/modules/home/mustSign/index.js 来验证远端是否可访问。"

exit 0
