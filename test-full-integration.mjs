#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 빌드된 파일 사용 (TypeScript를 직접 import할 수 없음)
// 대신 직접 테스트 구현

// 실제 HWPX JSON 파일 로드
const jsonPath = path.join(__dirname, 'temp/hwpx-json/test.json')
let hwpxData

try {
  const content = fs.readFileSync(jsonPath, 'utf-8')
  hwpxData = JSON.parse(content)
} catch (error) {
  console.error('Error loading HWPX JSON:', error.message)
  process.exit(1)
}

console.log('\n🚀 전체 통합 테스트 시작')
console.log('=' .repeat(60))

// 에러 핸들러 생성
const errorHandler = new ErrorHandler({
  logErrors: true,
  logWarnings: true,
  maxErrors: 50,
  maxWarnings: 50
})

// ProcessorManager 생성
const processorManager = new ProcessorManager()

// 통계 수집
const stats = {
  totalNodes: 0,
  processedNodes: 0,
  elementsByType: {},
  processorUsage: {},
  errors: 0,
  warnings: 0
}

// 노드 카운트 함수
function countNodes(node) {
  let count = 1
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child)
    }
  }
  return count
}

// 요소 타입 카운트
function countElementTypes(elements) {
  for (const element of elements) {
    const type = element.type || 'unknown'
    stats.elementsByType[type] = (stats.elementsByType[type] || 0) + 1
    
    // 중첩된 요소 처리
    if (element.valueList) {
      countElementTypes(element.valueList)
    }
    if (element.trList) {
      for (const tr of element.trList) {
        if (tr.tdList) {
          for (const td of tr.tdList) {
            if (td.value) {
              countElementTypes(td.value)
            }
          }
        }
      }
    }
  }
}

// Processor 사용 추적
function trackProcessorUsage(node) {
  const processor = processorManager.getProcessor(node.tag)
  if (processor) {
    const processorName = processor.constructor.name
    stats.processorUsage[processorName] = (stats.processorUsage[processorName] || 0) + 1
  }
  
  if (node.children) {
    for (const child of node.children) {
      trackProcessorUsage(child)
    }
  }
}

console.log('\n📊 문서 구조 분석')
console.log('-'.repeat(60))
stats.totalNodes = countNodes(hwpxData)
console.log(`총 노드 수: ${stats.totalNodes}`)

// Processor 사용 추적
trackProcessorUsage(hwpxData)

console.log('\n🔧 변환 시작')
console.log('-'.repeat(60))

const startTime = Date.now()

try {
  // 전체 문서 변환
  const elements = processorManager.processDocument(hwpxData)
  
  const endTime = Date.now()
  const duration = endTime - startTime
  
  console.log(`✅ 변환 완료 (${duration}ms)`)
  console.log(`생성된 요소 수: ${elements.length}`)
  
  // 요소 타입 통계
  countElementTypes(elements)
  
  console.log('\n📈 변환 통계')
  console.log('-'.repeat(60))
  console.log('요소 타입별 개수:')
  for (const [type, count] of Object.entries(stats.elementsByType)) {
    console.log(`  ${type}: ${count}`)
  }
  
  console.log('\nProcessor 사용 통계:')
  for (const [processor, count] of Object.entries(stats.processorUsage)) {
    console.log(`  ${processor}: ${count}회`)
  }
  
  // 샘플 출력
  console.log('\n🔍 변환 결과 샘플 (처음 5개 요소)')
  console.log('-'.repeat(60))
  
  for (let i = 0; i < Math.min(5, elements.length); i++) {
    const element = elements[i]
    console.log(`\n요소 ${i + 1}:`)
    console.log('  타입:', element.type)
    
    if (element.value) {
      const preview = typeof element.value === 'string' 
        ? element.value.substring(0, 50) 
        : JSON.stringify(element.value).substring(0, 50)
      console.log('  값:', preview + (preview.length >= 50 ? '...' : ''))
    }
    
    if (element.size) console.log('  크기:', element.size)
    if (element.bold) console.log('  굵게: true')
    if (element.italic) console.log('  기울임: true')
    if (element.underline) console.log('  밑줄: true')
    if (element.color) console.log('  색상:', element.color)
    if (element.highlight) console.log('  배경색:', element.highlight)
  }
  
  // 테이블 샘플 찾기
  const tableElements = elements.filter(el => el.type === 'TABLE')
  if (tableElements.length > 0) {
    console.log('\n📊 테이블 변환 결과 샘플')
    console.log('-'.repeat(60))
    const table = tableElements[0]
    console.log('첫 번째 테이블:')
    console.log('  열 수:', table.colgroup?.length || 0)
    console.log('  행 수:', table.trList?.length || 0)
    if (table.trList && table.trList[0]) {
      console.log('  첫 행 셀 수:', table.trList[0].tdList?.length || 0)
    }
  }
  
  // 이미지 샘플 찾기
  const imageElements = elements.filter(el => el.type === 'IMAGE')
  if (imageElements.length > 0) {
    console.log('\n🖼️ 이미지 변환 결과 샘플')
    console.log('-'.repeat(60))
    console.log(`총 ${imageElements.length}개 이미지 발견`)
    const img = imageElements[0]
    console.log('첫 번째 이미지:')
    console.log('  ID:', img.id)
    console.log('  크기:', img.width, 'x', img.height)
  }
  
  // 결과 파일 저장
  const outputPath = path.join(__dirname, 'temp/conversion-output.json')
  fs.writeFileSync(outputPath, JSON.stringify(elements, null, 2))
  console.log(`\n💾 변환 결과 저장: ${outputPath}`)
  
} catch (error) {
  console.error('\n❌ 변환 중 오류 발생:', error.message)
  console.error(error.stack)
  
  // 에러 통계
  if (errorHandler.hasErrors()) {
    const errors = errorHandler.getErrors()
    console.log('\n🔴 수집된 에러:')
    for (const err of errors.slice(0, 5)) {
      console.log(`  - ${err.type}: ${err.message}`)
    }
    if (errors.length > 5) {
      console.log(`  ... 외 ${errors.length - 5}개`)
    }
  }
  
  if (errorHandler.hasWarnings()) {
    const warnings = errorHandler.getWarnings()
    console.log('\n🟡 수집된 경고:')
    for (const warning of warnings.slice(0, 5)) {
      console.log(`  - ${warning}`)
    }
    if (warnings.length > 5) {
      console.log(`  ... 외 ${warnings.length - 5}개`)
    }
  }
}

// 에러 통계 출력
const errorStats = errorHandler.getStatistics()
if (errorStats.totalErrors > 0 || errorStats.totalWarnings > 0) {
  console.log('\n⚠️ 에러/경고 통계')
  console.log('-'.repeat(60))
  console.log(`총 에러: ${errorStats.totalErrors}`)
  console.log(`총 경고: ${errorStats.totalWarnings}`)
  if (errorStats.totalErrors > 0) {
    console.log('에러 타입별:')
    for (const [type, count] of Object.entries(errorStats.errorsByType)) {
      console.log(`  ${type}: ${count}`)
    }
  }
}

console.log('\n' + '='.repeat(60))
console.log('🎉 전체 통합 테스트 완료')