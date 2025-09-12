#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('\n🚀 HWPX to Canvas Editor 통합 테스트')
console.log('=' .repeat(60))

// 실제 HWPX JSON 파일 로드
const jsonPath = path.join(__dirname, 'temp/인천정각중학교 교육실습 운영 계획 (1) (1).json')
let hwpxData

try {
  const content = fs.readFileSync(jsonPath, 'utf-8')
  hwpxData = JSON.parse(content)
  console.log('✅ HWPX JSON 파일 로드 성공')
} catch (error) {
  console.error('❌ HWPX JSON 파일 로드 실패:', error.message)
  process.exit(1)
}

// 통계 수집
const stats = {
  totalNodes: 0,
  nodeTypes: {},
  textContent: [],
  tables: 0,
  images: 0,
  paragraphs: 0
}

// 재귀적으로 노드 분석
function analyzeNode(node, depth = 0) {
  if (!node) return
  
  stats.totalNodes++
  
  // 노드 타입 카운트
  const tag = node.tag || 'unknown'
  stats.nodeTypes[tag] = (stats.nodeTypes[tag] || 0) + 1
  
  // 특별한 노드 처리
  switch (tag) {
    case 'p':
      stats.paragraphs++
      break
    case 'tbl':
      stats.tables++
      break
    case 'pic':
    case 'image':
      stats.images++
      break
    case 't':
      if (node.text) {
        stats.textContent.push(node.text)
      }
      break
  }
  
  // 자식 노드 처리
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      analyzeNode(child, depth + 1)
    }
  }
}

// 분석 실행
console.log('\n📊 문서 구조 분석 중...')
// 실제 구조는 content.sections[0].data.parsed_structure에 있음
if (hwpxData.content && hwpxData.content.sections && hwpxData.content.sections[0]) {
  const parsedStructure = hwpxData.content.sections[0].data.parsed_structure
  analyzeNode(parsedStructure)
} else {
  console.error('❌ 예상된 JSON 구조를 찾을 수 없습니다.')
}

// 결과 출력
console.log('\n📈 분석 결과')
console.log('-'.repeat(60))
console.log(`총 노드 수: ${stats.totalNodes}`)
console.log(`문단 수: ${stats.paragraphs}`)
console.log(`테이블 수: ${stats.tables}`)
console.log(`이미지 수: ${stats.images}`)
console.log(`텍스트 노드 수: ${stats.textContent.length}`)

console.log('\n노드 타입별 개수:')
const sortedTypes = Object.entries(stats.nodeTypes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)

for (const [type, count] of sortedTypes) {
  console.log(`  ${type}: ${count}`)
}

// 텍스트 샘플 출력
if (stats.textContent.length > 0) {
  console.log('\n📝 텍스트 샘플 (처음 5개):')
  for (let i = 0; i < Math.min(5, stats.textContent.length); i++) {
    const text = stats.textContent[i]
    const preview = text.length > 50 ? text.substring(0, 50) + '...' : text
    console.log(`  [${i + 1}] ${preview}`)
  }
}

// 간단한 변환 테스트
console.log('\n🔄 간단한 변환 테스트')
console.log('-'.repeat(60))

// Canvas Editor 요소 생성 예시
const canvasElements = []

// 텍스트 요소 변환
for (const text of stats.textContent.slice(0, 10)) {
  if (text && text.trim()) {
    // 각 문자를 개별 요소로
    for (const char of text) {
      canvasElements.push({
        type: 'TEXT',
        value: char
      })
    }
    // 문단 끝에 줄바꿈
    canvasElements.push({
      type: 'TEXT',
      value: '\n'
    })
  }
}

console.log(`생성된 Canvas Editor 요소 수: ${canvasElements.length}`)

// 결과 파일 저장
const outputPath = path.join(__dirname, 'temp/simple-conversion-output.json')
const output = {
  stats,
  sampleElements: canvasElements.slice(0, 20),
  timestamp: new Date().toISOString()
}

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
console.log(`\n💾 결과 저장: ${outputPath}`)

console.log('\n' + '='.repeat(60))
console.log('✅ 테스트 완료!')