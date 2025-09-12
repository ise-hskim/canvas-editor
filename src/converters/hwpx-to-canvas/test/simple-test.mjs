#!/usr/bin/env node

/**
 * 간단한 HWPX to Canvas Editor Converter 테스트
 * ES 모듈로 실행
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// JSON 파일 로드
const jsonPath = path.join(__dirname, '../../../../temp/인천정각중학교 교육실습 운영 계획 (1) (1).json')
console.log('🚀 HWPX to Canvas Editor Converter 테스트\n')
console.log('📄 JSON 파일 경로:', jsonPath)

try {
  // JSON 파일 읽기
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
  const hwpxJson = JSON.parse(jsonContent)
  
  console.log('\n✅ JSON 파일 로드 성공!')
  console.log('  - 메타데이터:', hwpxJson.hwpx_metadata ? '있음' : '없음')
  console.log('  - 컨텐츠:', hwpxJson.content ? '있음' : '없음')
  
  if (hwpxJson.content) {
    console.log('\n📊 문서 구조:')
    console.log('  - 버전:', hwpxJson.content.version ? '있음' : '없음')
    console.log('  - 설정:', hwpxJson.content.settings ? '있음' : '없음')
    console.log('  - 헤더:', hwpxJson.content.header ? '있음' : '없음')
    console.log('  - 섹션 수:', hwpxJson.content.sections ? hwpxJson.content.sections.length : 0)
    
    if (hwpxJson.content.sections && hwpxJson.content.sections.length > 0) {
      const firstSection = hwpxJson.content.sections[0]
      console.log('\n📝 첫 번째 섹션 분석:')
      console.log('  - 파일명:', firstSection.filename)
      
      if (firstSection.data?.parsed_structure) {
        const structure = firstSection.data.parsed_structure
        console.log('  - 태그:', structure.tag)
        console.log('  - 자식 노드 수:', structure.children ? structure.children.length : 0)
        
        // 문단 카운트
        let paragraphCount = 0
        let tableCount = 0
        let imageCount = 0
        
        function countNodes(node) {
          if (!node) return
          
          if (node.tag === 'p' || node.tag === 'hp:p') paragraphCount++
          if (node.tag === 'tbl' || node.tag === 'hp:tbl') tableCount++
          if (node.tag === 'pic' || node.tag === 'hp:pic') imageCount++
          
          if (node.children) {
            for (const child of node.children) {
              countNodes(child)
            }
          }
        }
        
        countNodes(structure)
        
        console.log('\n📈 요소 통계:')
        console.log('  - 문단 수:', paragraphCount)
        console.log('  - 표 수:', tableCount)
        console.log('  - 이미지 수:', imageCount)
        
        // 첫 번째 텍스트 추출
        console.log('\n📄 샘플 텍스트 (첫 100자):')
        let sampleText = ''
        
        function extractText(node, maxLength = 100) {
          if (sampleText.length >= maxLength) return
          
          if (node.text) {
            sampleText += node.text
          }
          
          if (node.children) {
            for (const child of node.children) {
              if (sampleText.length >= maxLength) break
              extractText(child, maxLength)
            }
          }
        }
        
        extractText(structure)
        console.log('  ', sampleText.substring(0, 100) + '...')
      }
    }
  }
  
  console.log('\n✨ 분석 완료!')
  
} catch (error) {
  console.error('\n❌ 에러 발생:', error.message)
  process.exit(1)
}