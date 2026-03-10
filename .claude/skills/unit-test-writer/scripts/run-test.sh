#!/bin/bash
# テスト実行ラッパー
# 使用方法: bash scripts/run-test.sh [オプション]
#   オプションなし: 全テストを一度だけ実行
#   --coverage:    カバレッジレポートも生成
#   --watch:       ウォッチモードで実行

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"

cd "$PROJECT_ROOT"

case "${1:-}" in
  --coverage)
    echo "▶ テスト実行（カバレッジあり）..."
    npm run test:coverage
    ;;
  --watch)
    echo "▶ テスト実行（ウォッチモード）..."
    npm run test:watch
    ;;
  *)
    echo "▶ テスト実行..."
    npm test
    ;;
esac
