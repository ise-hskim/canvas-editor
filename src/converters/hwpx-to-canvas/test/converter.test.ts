/**
 * HWPX to Canvas Editor Converter 테스트
 * temp 폴더의 실제 HWPX JSON 파일을 사용한 통합 테스트
 */

import { HWPXToCanvasConverter } from '../HWPXToCanvasConverter'
import { IHWPXJson, IConverterOptions } from '../types'
import * as fs from 'fs'
import * as path from 'path'

// 테스트용 JSON 파일 경로
const TEST_JSON_PATH = path.join(__dirname, '../../../../temp/인천정각중학교 교육실습 운영 계획 (1) (1).json')

/**
 * JSON 파일 로드
 */
function loadTestJson(): IHWPXJson {
  try {
    const jsonContent = fs.readFileSync(TEST_JSON_PATH, 'utf-8')
    return JSON.parse(jsonContent)
  } catch (error) {
    console.error('Failed to load test JSON:', error)
    throw error
  }
}

/**
 * 변환 결과 검증
 */
function validateConversionResult(result: any): void {
  console.log('=== 변환 결과 검증 ===')
  
  // 기본 구조 검증
  if (!result.success) {
    console.error('변환 실패:', result.errors)
    return
  }
  
  console.log('✅ 변환 성공')
  
  // 통계 출력
  if (result.stats) {
    console.log('\n📊 변환 통계:')
    console.log(`  - 총 문단: ${result.stats.totalParagraphs}`)
    console.log(`  - 총 표: ${result.stats.totalTables}`)
    console.log(`  - 총 이미지: ${result.stats.totalImages}`)
    console.log(`  - 총 하이퍼링크: ${result.stats.totalHyperlinks}`)
    console.log(`  - 변환된 요소: ${result.stats.convertedElements}`)
    console.log(`  - 건너뛴 요소: ${result.stats.skippedElements}`)
    console.log(`  - 에러: ${result.stats.errors}`)
    console.log(`  - 경고: ${result.stats.warnings}`)
    console.log(`  - 소요 시간: ${result.stats.endTime - result.stats.startTime}ms`)
  }
  
  // 데이터 구조 검증
  if (result.data) {
    console.log('\n📄 결과 데이터:')
    console.log(`  - 버전: ${result.data.version}`)
    
    if (result.data.data?.main) {
      console.log(`  - 메인 요소 수: ${result.data.data.main.length}`)
      
      // 요소 타입별 카운트
      const typeCounts = new Map<string, number>()
      for (const element of result.data.data.main) {
        const type = element.type || 'unknown'
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1)
      }
      
      console.log('\n  요소 타입별 분포:')
      for (const [type, count] of typeCounts) {
        console.log(`    - ${type}: ${count}`)
      }
    }
  }
}

/**
 * 샘플 텍스트 출력
 */
function printSampleText(result: any, maxChars = 200): void {
  if (!result.success || !result.data?.data?.main) {
    return
  }
  
  console.log('\n📝 샘플 텍스트 (처음 ' + maxChars + '자):')
  
  let text = ''
  for (const element of result.data.data.main) {
    if (element.value) {
      text += element.value
      if (text.length >= maxChars) {
        break
      }
    }
  }
  
  console.log(text.substring(0, maxChars) + '...')
}

/**
 * 메인 테스트 함수
 */
async function runTest(): Promise<void> {
  console.log('🚀 HWPX to Canvas Editor Converter 테스트 시작\n')
  
  try {
    // 1. JSON 파일 로드
    console.log('1️⃣ JSON 파일 로드 중...')
    const hwpxJson = loadTestJson()
    console.log('   ✅ JSON 파일 로드 완료\n')
    
    // 2. Converter 초기화
    console.log('2️⃣ Converter 초기화 중...')
    const options: IConverterOptions = {
      preserveStyles: true,
      preserveLayout: true,
      embedImages: true,
      onWarning: (message, _node) => {
        console.warn(`   ⚠️ 경고: ${message}`)
      },
      onError: (error, _node) => {
        console.error(`   ❌ 에러: ${error.message}`)
      }
    }
    
    const converter = new HWPXToCanvasConverter(options)
    console.log('   ✅ Converter 초기화 완료\n')
    
    // 3. 변환 실행
    console.log('3️⃣ 변환 실행 중...')
    const result = await converter.convert(hwpxJson)
    console.log('   ✅ 변환 완료\n')
    
    // 4. 결과 검증
    validateConversionResult(result)
    
    // 5. 샘플 텍스트 출력
    printSampleText(result)
    
    // 6. 결과 저장 (선택사항)
    const outputPath = path.join(__dirname, '../../../../temp/conversion_result.json')
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
    console.log(`\n💾 변환 결과 저장: ${outputPath}`)
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error)
    process.exit(1)
  }
  
  console.log('\n✨ 테스트 완료!')
}

/**
 * 개별 Processor 테스트
 */
function testProcessors(): void {
  console.log('\n🧪 개별 Processor 테스트\n')
  
  // TODO: 각 Processor별 단위 테스트 추가
  console.log('   - TextProcessor 테스트... (TODO)')
  console.log('   - TableProcessor 테스트... (TODO)')
  console.log('   - ParagraphProcessor 테스트... (TODO)')
  console.log('   - ImageProcessor 테스트... (TODO)')
}

// 테스트 실행
if (require.main === module) {
  runTest()
    .then(() => {
      testProcessors()
    })
    .catch(error => {
      console.error('테스트 실행 실패:', error)
      process.exit(1)
    })
}

export { runTest, loadTestJson, validateConversionResult }