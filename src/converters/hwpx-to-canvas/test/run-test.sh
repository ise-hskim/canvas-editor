#!/bin/bash

# HWPX to Canvas Editor Converter 테스트 실행 스크립트

echo "🚀 HWPX to Canvas Editor Converter 테스트 시작"
echo "============================================"

# 프로젝트 루트로 이동
cd "$(dirname "$0")/../../../../"

# TypeScript 컴파일
echo ""
echo "📦 TypeScript 컴파일 중..."
npx tsc src/converters/hwpx-to-canvas/test/converter.test.ts \
  --target ES2020 \
  --module commonjs \
  --lib ES2020 \
  --esModuleInterop true \
  --skipLibCheck true \
  --outDir dist/test \
  --resolveJsonModule true

if [ $? -ne 0 ]; then
  echo "❌ TypeScript 컴파일 실패"
  exit 1
fi

echo "✅ 컴파일 완료"

# 테스트 실행
echo ""
echo "🧪 테스트 실행 중..."
node dist/test/src/converters/hwpx-to-canvas/test/converter.test.js

echo ""
echo "✨ 테스트 스크립트 완료"