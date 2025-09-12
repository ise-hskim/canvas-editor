#!/usr/bin/env node

/**
 * HWPX to Canvas Editor Converter 실제 변환 테스트
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM 모듈 경로 설정
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Converter 및 관련 모듈 import
import { HWPXToCanvasConverter } from '../HWPXToCanvasConverter.js'

// JSON 파일 로드
const jsonPath = path.join(__dirname, '../../../../temp/인천정각중학교 교육실습 운영 계획 (1) (1).json')

console.log('🚀 HWPX to Canvas Editor Converter 실제 변환 테스트\n')
console.log('============================================\n')

async function runTest() {
  try {
    // 1. JSON 파일 로드
    console.log('1️⃣ JSON 파일 로드 중...')
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
    const hwpxJson = JSON.parse(jsonContent)
    console.log('   ✅ JSON 파일 로드 완료')
    console.log(`   - 섹션 수: ${hwpxJson.content?.sections?.length || 0}`)
    console.log()
    
    // 2. Converter 초기화
    console.log('2️⃣ Converter 초기화 중...')
    const options = {
      preserveStyles: true,
      preserveLayout: true,
      embedImages: true,
      onWarning: (message, node) => {
        console.warn(`   ⚠️ 경고: ${message}`)
      },
      onError: (error, node) => {
        console.error(`   ❌ 에러: ${error.message}`)
      }
    }
    
    const converter = new HWPXToCanvasConverter(options)
    console.log('   ✅ Converter 초기화 완료')
    console.log()
    
    // 3. 변환 실행
    console.log('3️⃣ 변환 실행 중...')
    const startTime = Date.now()
    const result = await converter.convert(hwpxJson)
    const endTime = Date.now()
    console.log(`   ✅ 변환 완료 (${endTime - startTime}ms)`)
    console.log()
    
    // 4. 결과 분석
    console.log('4️⃣ 변환 결과 분석')
    console.log('==================')
    
    if (result.success) {
      console.log('✅ 변환 성공!')
      console.log()
      
      // 통계 출력
      if (result.stats) {
        console.log('📊 변환 통계:')
        console.log(`  - 총 문단: ${result.stats.totalParagraphs}`)
        console.log(`  - 총 표: ${result.stats.totalTables}`)
        console.log(`  - 총 이미지: ${result.stats.totalImages}`)
        console.log(`  - 총 하이퍼링크: ${result.stats.totalHyperlinks}`)
        console.log(`  - 변환된 요소: ${result.stats.convertedElements}`)
        console.log(`  - 건너뛴 요소: ${result.stats.skippedElements}`)
        console.log(`  - 에러: ${result.stats.errors}`)
        console.log(`  - 경고: ${result.stats.warnings}`)
        console.log()
      }
      
      // 데이터 구조 확인
      if (result.data) {
        console.log('📄 결과 데이터:')
        console.log(`  - 버전: ${result.data.version}`)
        
        if (result.data.data?.main) {
          console.log(`  - 메인 요소 수: ${result.data.data.main.length}`)
          
          // 요소 타입별 카운트
          const typeCounts = new Map()
          for (const element of result.data.data.main) {
            const type = element.type || 'unknown'
            typeCounts.set(type, (typeCounts.get(type) || 0) + 1)
          }
          
          console.log('\n  요소 타입별 분포:')
          for (const [type, count] of typeCounts) {
            console.log(`    - ${type}: ${count}`)
          }
          
          // 샘플 텍스트 출력
          console.log('\n📝 샘플 텍스트 (처음 200자):')
          let text = ''
          for (const element of result.data.data.main) {
            if (element.value) {
              text += element.value
              if (text.length >= 200) break
            }
          }
          console.log('  ', text.substring(0, 200) + '...')
        }
      }
      
      // 결과 저장
      const outputPath = path.join(__dirname, '../../../../temp/conversion_result.json')
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
      console.log(`\n💾 변환 결과 저장: ${outputPath}`)
      
    } else {
      console.log('❌ 변환 실패!')
      if (result.errors) {
        console.log('\n에러 목록:')
        for (const error of result.errors) {
          console.log(`  - ${error.message}`)
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
  
  console.log('\n✨ 테스트 완료!')
}

// 테스트 실행
runTest().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})