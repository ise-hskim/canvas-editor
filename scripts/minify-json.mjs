#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * JSON 파일 최소화 및 압축 스크립트
 */

// 명령줄 인자 처리
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node minify-json.mjs <input-file> [options]');
  console.log('Options:');
  console.log('  --output, -o <file>  출력 파일 경로');
  console.log('  --gzip               gzip 압축 (.gz)');
  console.log('  --pretty             들여쓰기 유지 (최소화 안함)');
  console.log('  --stats              통계 정보 출력');
  process.exit(1);
}

const inputFile = args[0];
let outputFile = null;
let useGzip = false;
let pretty = false;
let showStats = false;

// 옵션 파싱
for (let i = 1; i < args.length; i++) {
  switch (args[i]) {
    case '--output':
    case '-o':
      outputFile = args[++i];
      break;
    case '--gzip':
      useGzip = true;
      break;
    case '--pretty':
      pretty = true;
      break;
    case '--stats':
      showStats = true;
      break;
  }
}

// 기본 출력 파일명 설정
if (!outputFile) {
  const ext = path.extname(inputFile);
  const base = path.basename(inputFile, ext);
  const dir = path.dirname(inputFile);
  
  if (useGzip) {
    outputFile = path.join(dir, `${base}.min.json.gz`);
  } else {
    outputFile = path.join(dir, `${base}.min.json`);
  }
}

// JSON 파일 읽기 및 처리
console.log(`📖 입력 파일 읽는 중: ${inputFile}`);

try {
  const startTime = Date.now();
  const originalContent = fs.readFileSync(inputFile, 'utf8');
  const originalSize = Buffer.byteLength(originalContent, 'utf8');
  
  // JSON 파싱
  console.log('🔄 JSON 파싱 중...');
  const jsonData = JSON.parse(originalContent);
  
  // JSON 최소화 또는 정리
  let processedContent;
  if (pretty) {
    processedContent = JSON.stringify(jsonData, null, 2);
  } else {
    processedContent = JSON.stringify(jsonData);
  }
  
  const processedSize = Buffer.byteLength(processedContent, 'utf8');
  
  // 파일 저장
  if (useGzip) {
    console.log('🗜️  Gzip 압축 중...');
    const compressed = zlib.gzipSync(processedContent, { level: 9 });
    fs.writeFileSync(outputFile, compressed);
    
    if (showStats) {
      const compressedSize = compressed.length;
      console.log('\n📊 압축 통계:');
      console.log(`  원본 크기: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  최소화 크기: ${(processedSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  압축 크기: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  압축률: ${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`);
    }
  } else {
    fs.writeFileSync(outputFile, processedContent, 'utf8');
    
    if (showStats) {
      console.log('\n📊 최소화 통계:');
      console.log(`  원본 크기: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  최소화 크기: ${(processedSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  감소율: ${((1 - processedSize / originalSize) * 100).toFixed(1)}%`);
    }
  }
  
  const endTime = Date.now();
  console.log(`✅ 완료! 출력 파일: ${outputFile}`);
  console.log(`⏱️  처리 시간: ${(endTime - startTime) / 1000}초`);
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}