#!/usr/bin/env node

/**
 * 새로 구현한 Processor들 테스트
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// JSON 파일 로드
const jsonPath = path.join(__dirname, '../../../../temp/인천정각중학교 교육실습 운영 계획 (1) (1).json')

console.log('🧪 새로 구현한 Processor 테스트\n')
console.log('============================================\n')

// 테스트용 샘플 노드들
const testNodes = {
  // 목록 테스트
  list: {
    orderedList: {
      tag: 'hp:ol',
      attributes: { type: 'decimal' },
      children: [
        { tag: 'hp:li', text: '첫 번째 항목' },
        { tag: 'hp:li', text: '두 번째 항목' },
        { tag: 'hp:li', text: '세 번째 항목' }
      ]
    },
    unorderedList: {
      tag: 'hp:ul',
      attributes: { style: 'circle' },
      children: [
        { tag: 'hp:li', text: '항목 A' },
        { tag: 'hp:li', text: '항목 B' }
      ]
    }
  },
  
  // 제목 테스트
  title: {
    h1: {
      tag: 'hp:h1',
      text: '대제목입니다'
    },
    h2: {
      tag: 'hp:h2',
      text: '중제목입니다'
    },
    headingWithLevel: {
      tag: 'hp:heading',
      attributes: { level: '3' },
      text: '레벨 3 제목'
    }
  },
  
  // 하이퍼링크 테스트
  hyperlink: {
    withUrl: {
      tag: 'hp:hyperlink',
      attributes: { href: 'https://www.example.com' },
      text: '예제 링크'
    },
    emailLink: {
      tag: 'hp:link',
      attributes: { url: 'test@example.com' },
      text: '이메일 보내기'
    },
    phoneLink: {
      tag: 'hp:a',
      attributes: { href: '010-1234-5678' },
      text: '전화하기'
    }
  }
}

// 실제 JSON에서 노드 찾기
function findNodesInJson(json) {
  console.log('📋 실제 HWPX JSON에서 노드 찾기\n')
  
  const results = {
    lists: [],
    titles: [],
    hyperlinks: [],
    paragraphs: [],
    tables: []
  }
  
  function traverse(node, depth = 0) {
    if (!node) return
    
    // 태그별 분류
    const tag = node.tag || ''
    
    // 목록
    if (tag.includes('list') || tag === 'hp:ul' || tag === 'hp:ol' || tag === 'hp:li') {
      results.lists.push({ tag, depth, hasText: !!node.text })
    }
    
    // 제목
    if (tag.match(/h[1-6]$/) || tag.includes('heading') || tag.includes('title')) {
      results.titles.push({ 
        tag, 
        depth, 
        text: extractText(node).substring(0, 50),
        level: node.attributes?.level || node.attrs?.level
      })
    }
    
    // 하이퍼링크
    if (tag.includes('hyperlink') || tag.includes('link') || tag === 'hp:a') {
      results.hyperlinks.push({ 
        tag, 
        depth,
        url: node.attributes?.href || node.attrs?.href || node.attributes?.url || node.attrs?.url,
        text: extractText(node).substring(0, 30)
      })
    }
    
    // 문단
    if (tag === 'p' || tag === 'hp:p' || tag === 'para') {
      results.paragraphs.push({ tag, depth })
    }
    
    // 테이블
    if (tag === 'tbl' || tag === 'hp:tbl' || tag === 'table') {
      results.tables.push({ tag, depth })
    }
    
    // 자식 노드 탐색
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child, depth + 1)
      }
    }
  }
  
  function extractText(node) {
    if (node.text) return node.text
    if (node.children) {
      return node.children.map(child => extractText(child)).join('')
    }
    return ''
  }
  
  // 섹션 탐색
  if (json.content?.sections) {
    for (const section of json.content.sections) {
      if (section.data?.parsed_structure) {
        traverse(section.data.parsed_structure)
      }
    }
  }
  
  return results
}

// 통계 출력
function printStatistics(results) {
  console.log('📊 노드 통계:\n')
  
  console.log(`  📝 문단: ${results.paragraphs.length}개`)
  console.log(`  📋 목록: ${results.lists.length}개`)
  console.log(`  📌 제목: ${results.titles.length}개`)
  console.log(`  🔗 하이퍼링크: ${results.hyperlinks.length}개`)
  console.log(`  📊 테이블: ${results.tables.length}개`)
  
  // 제목 샘플
  if (results.titles.length > 0) {
    console.log('\n🔍 제목 샘플 (최대 5개):')
    results.titles.slice(0, 5).forEach(title => {
      console.log(`  - [${title.tag}${title.level ? ` level=${title.level}` : ''}] ${title.text}`)
    })
  }
  
  // 하이퍼링크 샘플
  if (results.hyperlinks.length > 0) {
    console.log('\n🔍 하이퍼링크 샘플 (최대 5개):')
    results.hyperlinks.slice(0, 5).forEach(link => {
      console.log(`  - [${link.tag}] ${link.text} → ${link.url || '(URL 없음)'}`)
    })
  }
  
  // 목록 태그 분포
  if (results.lists.length > 0) {
    console.log('\n🔍 목록 태그 분포:')
    const listTags = {}
    results.lists.forEach(list => {
      listTags[list.tag] = (listTags[list.tag] || 0) + 1
    })
    Object.entries(listTags).forEach(([tag, count]) => {
      console.log(`  - ${tag}: ${count}개`)
    })
  }
}

// 메인 테스트 실행
async function runTest() {
  try {
    // JSON 파일 로드
    console.log('1️⃣ JSON 파일 로드 중...')
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
    const hwpxJson = JSON.parse(jsonContent)
    console.log('   ✅ JSON 파일 로드 완료\n')
    
    // 노드 찾기
    console.log('2️⃣ 노드 탐색 중...')
    const results = findNodesInJson(hwpxJson)
    console.log('   ✅ 노드 탐색 완료\n')
    
    // 통계 출력
    printStatistics(results)
    
    // 실제 변환 테스트를 위한 샘플 생성
    console.log('\n3️⃣ 변환 테스트용 샘플 노드 정보:')
    console.log('\n// 실제 문서에서 찾은 노드 구조')
    
    // 첫 번째 제목 노드 출력
    if (results.titles.length > 0) {
      console.log('\n// 제목 노드 예시:')
      console.log('const titleNode = {')
      console.log(`  tag: '${results.titles[0].tag}',`)
      if (results.titles[0].level) {
        console.log(`  level: '${results.titles[0].level}',`)
      }
      console.log(`  text: '${results.titles[0].text}'`)
      console.log('}')
    }
    
    console.log('\n✨ 테스트 완료!')
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message)
    console.error('Stack:', error.stack)
  }
}

// 테스트 실행
runTest()