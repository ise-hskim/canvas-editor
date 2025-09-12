#!/usr/bin/env node

/**
 * 테이블 렌더링 테스트 스크립트
 * HWPX JSON의 테이블이 올바르게 변환되는지 확인
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

// 테이블 찾기
function findTables(node, path = '', results = []) {
  if (node.tag === 'tbl' || node.tag === 'hp:tbl') {
    results.push({
      path,
      tag: node.tag,
      rowCnt: node.attributes?.rowCnt,
      colCnt: node.attributes?.colCnt,
      hasRows: node.children?.some(c => c.tag === 'tr'),
      rowCount: node.children?.filter(c => c.tag === 'tr').length || 0
    })
  }
  
  if (node.children) {
    node.children.forEach((child, i) => {
      findTables(child, `${path}/${child.tag}[${i}]`, results)
    })
  }
  
  return results
}

// 문서 내 테이블 분석
console.log('\n📊 Analyzing tables in document...\n')

const section = hwpxJson.content.sections[0].data.parsed_structure
const tables = findTables(section)

console.log(`Found ${tables.length} tables:\n`)
tables.forEach((table, i) => {
  console.log(`Table ${i + 1}:`)
  console.log(`  Path: ${table.path}`)
  console.log(`  Size: ${table.rowCnt} rows × ${table.colCnt} columns`)
  console.log(`  Actual rows found: ${table.rowCount}`)
  console.log()
})

// 첫 번째 테이블 상세 분석
if (tables.length > 0) {
  console.log('🔍 Analyzing first table in detail...\n')
  
  // 첫 번째 테이블 노드 찾기
  function findFirstTable(node) {
    if (node.tag === 'tbl') return node
    if (node.children) {
      for (const child of node.children) {
        const result = findFirstTable(child)
        if (result) return result
      }
    }
    return null
  }
  
  const firstTable = findFirstTable(section)
  if (firstTable) {
    console.log('Table structure:')
    console.log(`  Tag: ${firstTable.tag}`)
    console.log(`  Attributes:`, firstTable.attributes)
    console.log(`  Children tags:`, firstTable.children?.map(c => c.tag).join(', '))
    
    // 첫 번째 행 분석
    const firstRow = firstTable.children?.find(c => c.tag === 'tr')
    if (firstRow) {
      console.log('\nFirst row:')
      console.log(`  Cell count: ${firstRow.children?.filter(c => c.tag === 'tc').length || 0}`)
      
      const firstCell = firstRow.children?.find(c => c.tag === 'tc')
      if (firstCell) {
        console.log('\nFirst cell:')
        console.log(`  Attributes:`, firstCell.attributes)
        console.log(`  Has subList: ${firstCell.children?.some(c => c.tag === 'subList')}`)
        
        const subList = firstCell.children?.find(c => c.tag === 'subList')
        if (subList) {
          console.log(`  SubList children: ${subList.children?.map(c => c.tag).join(', ')}`)
        }
      }
    }
  }
}

console.log('\n✅ Table structure analysis complete!')
console.log('\n💡 To test the actual rendering:')
console.log('1. Open http://localhost:3001/canvas-editor/ in your browser')
console.log('2. Click "HWPX JSON 가져오기" button')
console.log('3. Select the test JSON file')
console.log('4. Check if tables are rendered correctly')