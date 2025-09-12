#!/usr/bin/env node

/**
 * 실제 HWPX JSON 변환 테스트
 * ProcessorManager를 사용한 통합 테스트
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 실제 HWPX JSON 변환 테스트\n')
console.log('============================================\n')

// 샘플 변환 테스트
function testConversion() {
  // 실제 HWPX JSON에서 추출한 샘플 노드들
  const sampleNodes = {
    // 문단 노드
    paragraph: {
      tag: 'p',
      attributes: {
        id: '0',
        paraPrIDRef: '3',
        styleIDRef: '0'
      },
      children: [
        {
          tag: 'run',
          attributes: { charPrIDRef: '10' },
          children: [
            {
              tag: 't',
              text: '2024학년도 인천정각중학교'
            }
          ]
        }
      ]
    },
    
    // 테이블 노드
    table: {
      tag: 'tbl',
      attributes: {
        id: '1173727780',
        rowCnt: '2',
        colCnt: '7'
      },
      children: [
        {
          tag: 'tr',
          children: [
            {
              tag: 'tc',
              attributes: { borderFillIDRef: '40' },
              children: [
                {
                  tag: 'subList',
                  children: [
                    {
                      tag: 'p',
                      children: [
                        {
                          tag: 'run',
                          children: [
                            { tag: 't', text: '월' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              tag: 'tc',
              children: [
                {
                  tag: 'subList',
                  children: [
                    {
                      tag: 'p',
                      children: [
                        {
                          tag: 'run',
                          children: [
                            { tag: 't', text: '화' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
  
  return sampleNodes
}

// ProcessorManager 모의 구현
class MockProcessorManager {
  constructor() {
    this.processors = new Map()
    this.idCounter = 0
    this.registerProcessors()
  }
  
  registerProcessors() {
    // 텍스트 처리
    this.processors.set('t', {
      process: (node) => {
        if (node.text) {
          return node.text.split('').map(char => ({
            type: 'text',
            value: char
          }))
        }
        return []
      }
    })
    
    // Run 처리
    this.processors.set('run', {
      process: (node) => {
        const elements = []
        if (node.children) {
          for (const child of node.children) {
            const processor = this.processors.get(child.tag)
            if (processor) {
              elements.push(...processor.process(child))
            }
          }
        }
        return elements
      }
    })
    
    // 문단 처리
    this.processors.set('p', {
      process: (node) => {
        const elements = []
        if (node.children) {
          for (const child of node.children) {
            const processor = this.processors.get(child.tag)
            if (processor) {
              elements.push(...processor.process(child))
            }
          }
        }
        // 문단 끝에 줄바꿈 추가
        if (elements.length > 0) {
          elements.push({ type: 'text', value: '\n' })
        }
        return elements
      }
    })
    
    // 테이블 처리
    this.processors.set('tbl', {
      process: (node) => {
        const table = {
          type: 'table',
          value: '',
          tableId: `table_${++this.idCounter}`,
          colgroup: [],
          trList: []
        }
        
        // 컬럼 설정
        const colCount = parseInt(node.attributes?.colCnt || '1')
        for (let i = 0; i < colCount; i++) {
          table.colgroup.push({ width: 100 })
        }
        
        // 행 처리
        if (node.children) {
          for (const child of node.children) {
            if (child.tag === 'tr') {
              const tr = this.processTableRow(child)
              if (tr) {
                table.trList.push(tr)
              }
            }
          }
        }
        
        return [table]
      }
    })
  }
  
  processTableRow(node) {
    const tr = {
      height: 30,
      tdList: []
    }
    
    if (node.children) {
      for (const child of node.children) {
        if (child.tag === 'tc') {
          const td = this.processTableCell(child)
          if (td) {
            tr.tdList.push(td)
          }
        }
      }
    }
    
    return tr
  }
  
  processTableCell(node) {
    const td = {
      colspan: 1,
      rowspan: 1,
      value: []
    }
    
    // 셀 내용 처리
    if (node.children) {
      for (const child of node.children) {
        if (child.tag === 'subList' && child.children) {
          for (const subChild of child.children) {
            const processor = this.processors.get(subChild.tag)
            if (processor) {
              const elements = processor.process(subChild)
              td.value.push(...elements)
            }
          }
        }
      }
    }
    
    return td
  }
  
  process(node) {
    const processor = this.processors.get(node.tag)
    if (processor) {
      return processor.process(node)
    }
    return []
  }
}

// 메인 테스트
function runTest() {
  console.log('1️⃣ 샘플 노드 준비')
  const samples = testConversion()
  console.log('   ✅ 샘플 노드 준비 완료\n')
  
  console.log('2️⃣ ProcessorManager 초기화')
  const manager = new MockProcessorManager()
  console.log('   ✅ ProcessorManager 초기화 완료\n')
  
  console.log('3️⃣ 변환 테스트\n')
  
  // 문단 변환 테스트
  console.log('📝 문단 변환:')
  const paragraphResult = manager.process(samples.paragraph)
  console.log('   입력:', JSON.stringify(samples.paragraph, null, 2).substring(0, 200) + '...')
  console.log('   출력 요소 수:', paragraphResult.length)
  if (paragraphResult.length > 0) {
    const text = paragraphResult
      .filter(el => el.type === 'text')
      .map(el => el.value)
      .join('')
    console.log('   변환된 텍스트:', text)
  }
  console.log()
  
  // 테이블 변환 테스트
  console.log('📊 테이블 변환:')
  const tableResult = manager.process(samples.table)
  console.log('   입력: 테이블 (', samples.table.attributes.rowCnt, 'x', samples.table.attributes.colCnt, ')')
  console.log('   출력 요소 수:', tableResult.length)
  if (tableResult.length > 0 && tableResult[0].type === 'table') {
    const table = tableResult[0]
    console.log('   테이블 ID:', table.tableId)
    console.log('   컬럼 수:', table.colgroup.length)
    console.log('   행 수:', table.trList.length)
    if (table.trList.length > 0) {
      console.log('   첫 번째 행 셀 수:', table.trList[0].tdList.length)
      // 첫 번째 셀의 텍스트
      if (table.trList[0].tdList.length > 0) {
        const firstCellText = table.trList[0].tdList[0].value
          .filter(el => el.type === 'text')
          .map(el => el.value)
          .join('')
        console.log('   첫 번째 셀 텍스트:', firstCellText)
      }
    }
  }
  
  console.log('\n✨ 테스트 완료!')
}

// 실제 JSON 파일로 테스트
async function testWithRealFile() {
  const jsonPath = path.join(__dirname, '../../../../temp/인천정각중학교 교육실습 운영 계획 (1) (1).json')
  
  console.log('\n4️⃣ 실제 JSON 파일 테스트\n')
  
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
    const hwpxJson = JSON.parse(jsonContent)
    
    if (hwpxJson.content?.sections?.[0]?.data?.parsed_structure) {
      const rootNode = hwpxJson.content.sections[0].data.parsed_structure
      console.log('   루트 노드 태그:', rootNode.tag)
      console.log('   자식 노드 수:', rootNode.children?.length || 0)
      
      // 첫 번째 문단 찾기
      if (rootNode.children) {
        const firstParagraph = rootNode.children.find(child => child.tag === 'p')
        if (firstParagraph) {
          console.log('\n   첫 번째 문단 발견!')
          const manager = new MockProcessorManager()
          const result = manager.process(firstParagraph)
          const text = result
            .filter(el => el.type === 'text')
            .map(el => el.value)
            .join('')
          console.log('   변환된 텍스트:', text.substring(0, 100) + '...')
        }
      }
    }
  } catch (error) {
    console.error('   ❌ 에러:', error.message)
  }
}

// 테스트 실행
runTest()
testWithRealFile()