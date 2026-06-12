#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${BASE_URL:-https://pm.imfly.site}"
TMP_DIR="${TMP_DIR:-/tmp/shengyunjie-production-verify}"

mkdir -p "$TMP_DIR"

fail() {
  echo "VERIFY_FAIL: $*" >&2
  exit 1
}

fetch() {
  local path="$1"
  local name="$2"
  curl -fsS -D "${TMP_DIR}/${name}.headers" -o "${TMP_DIR}/${name}.html" "${BASE_URL}${path}"
}

assert_header_no_long_smaxage() {
  local name="$1"
  if grep -Eqi 'cache-control:.*s-maxage=31536000' "${TMP_DIR}/${name}.headers"; then
    fail "${name} still has long s-maxage cache"
  fi
}

assert_contains() {
  local name="$1"
  local pattern="$2"
  if ! grep -q "$pattern" "${TMP_DIR}/${name}.html"; then
    fail "${name} missing pattern: ${pattern}"
  fi
}

assert_not_contains() {
  local name="$1"
  local pattern="$2"
  if grep -q "$pattern" "${TMP_DIR}/${name}.html"; then
    fail "${name} contains forbidden pattern: ${pattern}"
  fi
}

echo "Verifying ${BASE_URL}"

fetch "/training" "training"
fetch "/training/session" "session"

for name in training session; do
  assert_header_no_long_smaxage "$name"
done

assert_contains "training" 'href="/training/session"'
assert_not_contains "training" 'href="/training/session-ui-preview"'
assert_contains "session" '先读题，再完成你的判断'
assert_contains "session" '本题要你做一个真实取舍'
assert_not_contains "session" '训练题页面 UI 方案预览'

printf 'VERIFY_OK %s\n' "$BASE_URL"
