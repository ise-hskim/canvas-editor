#!/usr/bin/env node

/**
 * 스타일 파싱 테스트 스크립트
 * HWPX JSON에서 스타일이 올바르게 추출되고 적용되는지 확인
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 테스트용 HWPX JSON 파일 경로
const testFilePath = path.join(__dirname, '../../../../temp/인천정각중학교 교육실습 운영 계획 (1) (1).json')

// HWPX JSON 읽기
console.log('📖 Reading HWPX JSON file...')
const hwpxJson = JSON.parse(fs.readFileSync(testFilePath, 'utf8'))

// 스타일이 적용된 텍스트 찾기
function findStyledTexts(node, results = []) {
  // run 노드에서 스타일 정보 추출
  if (node.tag === 'run' && node.attributes?.charPrIDRef) {
    const text = extractTextFromRun(node)
    if (text) {
      results.push({
        text: text.substring(0, 50), // 처음 50자만
        charPrIDRef: node.attributes.charPrIDRef,
        hasCharPr: node.children?.some(c => c.tag === 'charPr'),
        parentTag: node.parent?.tag || 'unknown'
      })
    }
  }
  
  // p 노드에서 문단 스타일 정보 추출
  if (node.tag === 'p' && node.attributes?.paraPrIDRef) {
    const text = extractTextFromNode(node)
    if (text) {
      results.push({
        text: text.substring(0, 50),
        paraPrIDRef: node.attributes.paraPrIDRef,
        type: 'paragraph'
      })
    }
  }
  
  // 재귀적으로 자식 노드 탐색
  if (node.children) {
    for (const child of node.children) {
      findStyledTexts(child, results)
    }
  }
  
  return results
}

// run 노드에서 텍스트 추출
function extractTextFromRun(node) {
  if (!node.children) return ''
  
  for (const child of node.children) {
    if (child.tag === 't' && child.text) {
      return child.text
    }
  }
  return ''
}

// 노드에서 텍스트 추출
function extractTextFromNode(node) {
  let text = ''
  
  if (node.text) {
    text += node.text
  }
  
  if (node.children) {
    for (const child of node.children) {
      if (child.tag === 't' && child.text) {
        text += child.text
      } else if (child.tag === 'run') {
        text += extractTextFromRun(child)
      }
    }
  }
  
  return text
}

// 스타일 분석
console.log('\n🎨 Analyzing styles in HWPX document...\n')

const section = hwpxJson.content.sections[0].data.parsed_structure
const styledTexts = findStyledTexts(section)

// 고유한 charPrIDRef 값들
const uniqueCharStyles = [...new Set(styledTexts.filter(t => t.charPrIDRef).map(t => t.charPrIDRef))]
console.log(`📊 Found ${uniqueCharStyles.length} unique character style IDs:`)
console.log(uniqueCharStyles.sort((a, b) => parseInt(a) - parseInt(b)).join(', '))

// 고유한 paraPrIDRef 값들
const uniqueParaStyles = [...new Set(styledTexts.filter(t => t.paraPrIDRef).map(t => t.paraPrIDRef))]
console.log(`\n📊 Found ${uniqueParaStyles.length} unique paragraph style IDs:`)
console.log(uniqueParaStyles.sort((a, b) => parseInt(a) - parseInt(b)).join(', '))

// 샘플 출력
console.log('\n📝 Sample styled texts:\n')
const samples = styledTexts.slice(0, 10)
for (const sample of samples) {
  if (sample.charPrIDRef) {
    console.log(`[charPr=${sample.charPrIDRef}] "${sample.text}"`)
  } else if (sample.paraPrIDRef) {
    console.log(`[paraPr=${sample.paraPrIDRef}] "${sample.text}"`)
  }
}

// Converter 테스트
console.log('\n🔄 Testing converter with styles...\n')

// Dynamic import to handle ES modules
async function testConverter() {
  try {
    // Converter 모듈 동적 임포트
    const converterModule = await import('../HWPXToCanvasConverter.js')
    const { HWPXToCanvasConverter } = converterModule
    
    // Converter 인스턴스 생성
    const converter = new HWPXToCanvasConverter({
      preserveStyles: true,
      preserveLayout: true
    })
    
    // 변환 수행
    const result = converter.convertSync(hwpxJson)
    
    if (result.success && result.data) {
      console.log('✅ Conversion successful!')
      console.log(`📊 Stats:`, result.stats)
      
      // 스타일이 적용된 요소 찾기
      const styledElements = result.data.data.main.filter(el => 
        el.bold || el.italic || el.underline || el.size || el.color || el.font
      )
      
      console.log(`\n🎨 Found ${styledElements.length} styled elements`)
      
      // 샘플 출력
      if (styledElements.length > 0) {
        console.log('\nSample styled elements:')
        styledElements.slice(0, 5).forEach(el => {
          const styles = []
          if (el.bold) styles.push('bold')
          if (el.italic) styles.push('italic')
          if (el.underline) styles.push('underline')
          if (el.size) styles.push(`size=${el.size}`)
          if (el.color) styles.push(`color=${el.color}`)
          if (el.font) styles.push(`font=${el.font}`)
          
          console.log(`"${el.value}" [${styles.join(', ')}]`)
        })
      }
      
      // 결과 저장
      const outputPath = path.join(__dirname, '../../../../temp/style-test-output.json')
      fs.writeFileSync(outputPath, JSON.stringify(result.data, null, 2))
      console.log(`\n💾 Output saved to: ${outputPath}`)
      
    } else {
      console.error('❌ Conversion failed:', result.errors)
    }
  } catch (error) {
    console.error('❌ Error testing converter:', error.message)
    console.log('\n💡 Note: Make sure to build the project first with npm run build')
  }
}

// Converter 테스트 실행
testConverter()