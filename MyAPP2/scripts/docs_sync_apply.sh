#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

HOME_BASELINE_DOC="docs/home/复盘日报_今日明细／昨日汇总.md"

# mustSign 子功能级基线文档映射（可按需调整为独立或共享文档）
MUSTSIGN_BASELINE_DOC_DEFAULT="docs/mustSign/电话勿扰上报原因-PRD.md"
MUSTSIGN_DOC_ABNORMAL="${MUSTSIGN_DOC_ABNORMAL:-docs/mustSign/电话勿扰上报原因-PRD.md}"
MUSTSIGN_DOC_DISPATCH="${MUSTSIGN_DOC_DISPATCH:-docs/mustSign/晚间时段电联提醒-PRD.md}"
MUSTSIGN_DOC_SIGNED="${MUSTSIGN_DOC_SIGNED:-docs/mustSign/电话勿扰上报原因_1-PRD.md}"
MUSTSIGN_DOC_THIRD="${MUSTSIGN_DOC_THIRD:-docs/mustSign/晚间时段电联提醒-PRD.md}"
MUSTSIGN_DOC_ZCW="${MUSTSIGN_DOC_ZCW:-docs/mustSign/晚间时段电联提醒-PRD.md}"

MODE="${1:---staged}"
if [ ! -d .git ]; then
  echo "错误：当前目录不是 git 仓库。"
  exit 1
fi

declare -a CHANGED_FILES=()
if [ "$MODE" = "--staged" ]; then
  while IFS= read -r file; do
    [ -n "$file" ] && CHANGED_FILES+=("$file")
  done < <(git diff --cached --name-only --diff-filter=ACMR)
else
  while IFS= read -r file; do
    [ -n "$file" ] && CHANGED_FILES+=("$file")
  done < <(git diff --name-only --diff-filter=ACMR)
fi

if [ ${#CHANGED_FILES[@]} -eq 0 ]; then
  echo "没有检测到变更文件，跳过文档同步。"
  exit 0
fi

declare -a HOME_FILES=()
declare -a DAILY_REVIEW_FILES=()
declare -a MUSTSIGN_FILES=()
declare -a CONSULT_FILES=()
declare -a PROFILE_FILES=()
declare -a DATA_FILES=()

for file in "${CHANGED_FILES[@]}"; do
  case "$file" in
    modules/home/mustSign/*|modules/mustSign/*|docs/mustSign/*.md)
      MUSTSIGN_FILES+=("$file")
      ;;
    modules/home/dailyReview/*|docs/home/复盘日报_今日明细／昨日汇总.md)
      DAILY_REVIEW_FILES+=("$file")
      ;;
    modules/home/*|docs/home/*.md)
      HOME_FILES+=("$file")
      ;;
    modules/consult/*|docs/consult/*.md)
      CONSULT_FILES+=("$file")
      ;;
    modules/profile/*|docs/profile/*.md)
      PROFILE_FILES+=("$file")
      ;;
    modules/data/*|docs/data/*)
      DATA_FILES+=("$file")
      ;;
  esac
done

TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S %z')"

list_to_markdown() {
  local arr=("$@")
  if [ ${#arr[@]} -eq 0 ]; then
    echo "- 无"
    return
  fi

  printf '%s\n' "${arr[@]}" | awk 'NF' | sort -u | while IFS= read -r line; do
    echo "- $line"
  done
}

update_file_block() {
  local target_file="$1"
  local section_title="$2"
  local changed_md="$3"

  mkdir -p "$(dirname "$target_file")"

  if [ ! -f "$target_file" ]; then
    {
      echo "# 自动维护-变更追踪"
      echo
    } > "$target_file"
  fi

  local tmp_file
  tmp_file="$(mktemp)"

  awk '
    BEGIN { in_block = 0 }
    /<!-- AUTO_SYNC_START -->/ { in_block = 1; next }
    /<!-- AUTO_SYNC_END -->/ { in_block = 0; next }
    in_block == 0 { print }
  ' "$target_file" > "$tmp_file"

  {
    printf '\n'
    printf '%s\n' '<!-- AUTO_SYNC_START -->'
    printf '%s\n' '## 自动维护区块'
    printf '%s\n' "- 最近同步时间：$TIMESTAMP"
    printf '%s\n' "- 触发范围：$section_title"
    printf '%s\n' '- 本次触发文件：'
    printf '%s\n' "$changed_md"
    printf '%s\n' '- 规则：仅自动维护该区块，人工撰写内容不覆盖。'
    printf '%s\n' '<!-- AUTO_SYNC_END -->'
  } >> "$tmp_file"

  mv "$tmp_file" "$target_file"
}

sync_daily_review_docs() {
  local changed_md="$1"
  local targets=()

  # 基线策略：仅 dailyReview 相关改动回写到既有需求文档，再同步三件套。
  if [ -f "$HOME_BASELINE_DOC" ]; then
    targets+=("$HOME_BASELINE_DOC")
  fi

  targets+=(
    "docs/home/代码对齐版-前端需求文档.md"
    "docs/home/评审版-前端需求文档.md"
    "docs/home/接口化改造版-前端需求文档.md"
  )

  local updated=0
  for f in "${targets[@]}"; do
    if [ -f "$f" ]; then
      update_file_block "$f" "dailyReview" "$changed_md"
      updated=1
    fi
  done

  if [ "$updated" -eq 0 ]; then
    update_file_block "docs/home/自动维护-变更追踪.md" "dailyReview" "$changed_md"
  fi
}

sync_home_docs() {
  local changed_md="$1"
  local targets=(
    "docs/home/代码对齐版-前端需求文档.md"
    "docs/home/评审版-前端需求文档.md"
    "docs/home/接口化改造版-前端需求文档.md"
  )

  local updated=0
  for f in "${targets[@]}"; do
    if [ -f "$f" ]; then
      update_file_block "$f" "home" "$changed_md"
      updated=1
    fi
  done

  if [ "$updated" -eq 0 ]; then
    update_file_block "docs/home/自动维护-变更追踪.md" "home" "$changed_md"
  fi
}

sync_generic_doc() {
  local doc_file="$1"
  local scope="$2"
  local changed_md="$3"
  update_file_block "$doc_file" "$scope" "$changed_md"
}

resolve_mustsign_baseline_doc() {
  local file="$1"
  case "$file" in
    modules/home/mustSign/tabs/abnormal/*)
      echo "$MUSTSIGN_DOC_ABNORMAL"
      ;;
    modules/home/mustSign/tabs/dispatch/*)
      echo "$MUSTSIGN_DOC_DISPATCH"
      ;;
    modules/home/mustSign/tabs/signed/*)
      echo "$MUSTSIGN_DOC_SIGNED"
      ;;
    modules/home/mustSign/tabs/third/*)
      echo "$MUSTSIGN_DOC_THIRD"
      ;;
    modules/home/mustSign/tabs/zcw/*)
      echo "$MUSTSIGN_DOC_ZCW"
      ;;
    modules/home/mustSign/*|modules/mustSign/*|docs/mustSign/*.md)
      echo "$MUSTSIGN_BASELINE_DOC_DEFAULT"
      ;;
    *)
      echo "$MUSTSIGN_BASELINE_DOC_DEFAULT"
      ;;
  esac
}

sync_mustsign_docs() {
  local changed_md="$1"
  local targets=("docs/mustSign/自动维护-变更追踪.md")

  # 复用策略：mustSign 按子功能映射更新基线文档，再更新追踪文档。
  local f
  for f in "${MUSTSIGN_FILES[@]}"; do
    local doc
    doc="$(resolve_mustsign_baseline_doc "$f")"
    if [ -n "$doc" ]; then
      targets+=("$doc")
    fi
  done

  local updated=0
  local deduped_targets
  deduped_targets="$(printf '%s\n' "${targets[@]}" | awk 'NF' | sort -u)"

  while IFS= read -r f; do
    if [ -z "$f" ]; then
      continue
    fi

    if [ -f "$f" ] || [ "$f" = "docs/mustSign/自动维护-变更追踪.md" ]; then
      update_file_block "$f" "mustSign" "$changed_md"
      updated=1
    fi
  done < <(printf '%s\n' "$deduped_targets")

  if [ "$updated" -eq 0 ]; then
    update_file_block "docs/mustSign/自动维护-变更追踪.md" "mustSign" "$changed_md"
  fi
}

if [ ${#DAILY_REVIEW_FILES[@]} -gt 0 ]; then
  DAILY_REVIEW_MD="$(list_to_markdown "${DAILY_REVIEW_FILES[@]}")"
  sync_daily_review_docs "$DAILY_REVIEW_MD"
fi

if [ ${#HOME_FILES[@]} -gt 0 ]; then
  HOME_MD="$(list_to_markdown "${HOME_FILES[@]}")"
  sync_home_docs "$HOME_MD"
fi

if [ ${#MUSTSIGN_FILES[@]} -gt 0 ]; then
  MUSTSIGN_MD="$(list_to_markdown "${MUSTSIGN_FILES[@]}")"
  sync_mustsign_docs "$MUSTSIGN_MD"
fi

if [ ${#CONSULT_FILES[@]} -gt 0 ]; then
  CONSULT_MD="$(list_to_markdown "${CONSULT_FILES[@]}")"
  sync_generic_doc "docs/consult/自动维护-变更追踪.md" "consult" "$CONSULT_MD"
fi

if [ ${#PROFILE_FILES[@]} -gt 0 ]; then
  PROFILE_MD="$(list_to_markdown "${PROFILE_FILES[@]}")"
  sync_generic_doc "docs/profile/自动维护-变更追踪.md" "profile" "$PROFILE_MD"
fi

if [ ${#DATA_FILES[@]} -gt 0 ]; then
  DATA_MD="$(list_to_markdown "${DATA_FILES[@]}")"
  sync_generic_doc "docs/data/自动维护-变更追踪.md" "data" "$DATA_MD"
fi

git add docs/**/*.md 2>/dev/null || true

echo "文档自动同步完成（自动维护区块已更新）。"
