#!/usr/bin/env node

/**
 * HWPX JSON의 실제 태그 구조 분석
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const jsonPath = path.join(__dirname, '../../../../temp/인천정각중학교 교육실습 운영 계획 (1) (1).json')

console.log('🔍 HWPX JSON 태그 구조 분석\n')
console.log('============================================\n')

// 모든 태그 수집
function collectAllTags(json) {
  const tagCounts = {}
  const tagExamples = {}
  const tagWithAttrs = {}
  
  function traverse(node, depth = 0, path = '') {
    if (!node) return
    
    const tag = node.tag || '(no-tag)'
    
    // 태그 카운트
    tagCounts[tag] = (tagCounts[tag] || 0) + 1
    
    // 태그 예시 저장 (처음 3개만)
    if (!tagExamples[tag]) {
      tagExamples[tag] = []
    }
    if (tagExamples[tag].length < 3) {
      const example = {
        path: path + '/' + tag,
        depth,
        hasText: !!node.text,
        textSample: node.text ? node.text.substring(0, 50) : null,
        attrs: node.attributes || node.attrs || {},
        childrenCount: node.children?.length || 0
      }
      tagExamples[tag].push(example)
    }
    
    // 속성 수집
    if (node.attributes || node.attrs) {
      const attrs = node.attributes || node.attrs
      if (!tagWithAttrs[tag]) {
        tagWithAttrs[tag] = new Set()
      }
      Object.keys(attrs).forEach(attr => {
        tagWithAttrs[tag].add(attr)
      })
    }
    
    // 자식 노드 탐색
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child, index) => {
        traverse(child, depth + 1, path + '/' + tag + `[${index}]`)
      })
    }
  }
  
  // 전체 문서 탐색
  if (json.content?.sections) {
    json.content.sections.forEach((section, idx) => {
      if (section.data?.parsed_structure) {
        traverse(section.data.parsed_structure, 0, `section[${idx}]`)
      }
    })
  }
  
  return { tagCounts, tagExamples, tagWithAttrs }
}

// 결과 출력
function printResults(results) {
  const { tagCounts, tagExamples, tagWithAttrs } = results
  
  // 태그 빈도순 정렬
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
  
  console.log('📊 태그 빈도 (상위 20개):\n')
  sortedTags.slice(0, 20).forEach(([tag, count]) => {
    console.log(`  ${tag.padEnd(20)} : ${count}개`)
  })
  
  console.log('\n📝 주요 태그 상세 정보:\n')
  
  // 주요 태그들 상세 정보
  const importantTags = ['p', 'run', 't', 'tbl', 'tr', 'tc', 'subList', 'paraPr', 'charPr']
  
  importantTags.forEach(tag => {
    if (tagExamples[tag]) {
      console.log(`\n[${tag}] (총 ${tagCounts[tag]}개)`)
      
      // 속성 정보
      if (tagWithAttrs[tag] && tagWithAttrs[tag].size > 0) {
        console.log(`  속성: ${Array.from(tagWithAttrs[tag]).join(', ')}`)
      }
      
      // 예시
      const example = tagExamples[tag][0]
      console.log(`  예시:`)
      console.log(`    - 경로: ${example.path}`)
      console.log(`    - 깊이: ${example.depth}`)
      console.log(`    - 자식 수: ${example.childrenCount}`)
      if (example.textSample) {
        console.log(`    - 텍스트: "${example.textSample}"`)
      }
      if (Object.keys(example.attrs).length > 0) {
        console.log(`    - 속성값: ${JSON.stringify(example.attrs)}`)
      }
    }
  })
  
  // 특수 패턴 찾기
  console.log('\n🎯 특수 패턴 분석:\n')
  
  // 리스트 관련 태그 찾기
  const listRelatedTags = Object.keys(tagCounts).filter(tag => 
    tag.toLowerCase().includes('list') || 
    tag.toLowerCase().includes('numbering') ||
    tag.toLowerCase().includes('bullet')
  )
  if (listRelatedTags.length > 0) {
    console.log('  목록 관련 태그:', listRelatedTags.join(', '))
  }
  
  // 제목 관련 태그 찾기
  const titleRelatedTags = Object.keys(tagCounts).filter(tag => 
    tag.toLowerCase().includes('heading') || 
    tag.toLowerCase().includes('title') ||
    tag.toLowerCase().includes('outline')
  )
  if (titleRelatedTags.length > 0) {
    console.log('  제목 관련 태그:', titleRelatedTags.join(', '))
  }
  
  // 링크 관련 태그 찾기
  const linkRelatedTags = Object.keys(tagCounts).filter(tag => 
    tag.toLowerCase().includes('link') || 
    tag.toLowerCase().includes('href') ||
    tag.toLowerCase().includes('url')
  )
  if (linkRelatedTags.length > 0) {
    console.log('  링크 관련 태그:', linkRelatedTags.join(', '))
  }
  
  // 스타일 관련 태그
  const styleRelatedTags = Object.keys(tagCounts).filter(tag => 
    tag.includes('Pr') || tag.includes('style') || tag.includes('Style')
  )
  console.log('\n  스타일 관련 태그:', styleRelatedTags.slice(0, 10).join(', '))
}

// 메인 실행
async function main() {
  try {
    console.log('JSON 파일 로드 중...')
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
    const hwpxJson = JSON.parse(jsonContent)
    console.log('✅ 로드 완료\n')
    
    console.log('태그 분석 중...')
    const results = collectAllTags(hwpxJson)
    console.log('✅ 분석 완료\n')
    
    printResults(results)
    
    console.log('\n✨ 분석 완료!')
    
  } catch (error) {
    console.error('❌ 에러:', error.message)
  }
}

main()