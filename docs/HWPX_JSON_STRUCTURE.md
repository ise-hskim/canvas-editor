# HWPX JSON Structure Documentation

## 개요
이 문서는 HWPX 파일을 JSON으로 파싱한 결과의 구조를 설명합니다. HWPX는 한글(HWP) 문서의 개방형 표준 포맷으로, ZIP 압축된 XML 파일들로 구성되어 있습니다.

## 최상위 구조

```json
{
  "hwpx_metadata": { ... },  // HWPX 파일의 메타데이터
  "content": { ... }          // 실제 문서 내용
}
```

## 1. hwpx_metadata

HWPX 파일의 ZIP 구조와 변환 정보를 포함합니다.

### 1.1 zip_structure
```json
{
  "zip_structure": {
    "file_order": [        // ZIP 내 파일 순서
      "mimetype",
      "version.xml",
      "Contents/header.xml",
      "Contents/content.hpf",
      "settings.xml",
      "Contents/section0.xml",
      "META-INF/container.rdf",
      "META-INF/container.xml",
      "META-INF/manifest.xml",
      "Preview/PrvImage.png",
      "Preview/PrvText.txt"
    ],
    "file_info": {         // 각 파일의 상세 정보
      "[filename]": {
        "compress_type": 0,     // 압축 타입 (0: 압축 안함, 8: deflate)
        "file_size": 19,        // 원본 크기 (bytes)
        "compress_size": 19,    // 압축 크기 (bytes)
        "crc": 1195503746,      // CRC 체크섬
        "date_time": [1980, 1, 1, 0, 0, 0],  // 파일 날짜/시간
        "create_system": 3,      // 생성 시스템
        "extract_version": 20    // 압축 해제 버전
      }
    },
    "zip_metadata": {
      "file_count": 11,         // 총 파일 수
      "compression": 0          // 압축 방식
    }
  }
}
```

### 1.2 conversion_info
JSON 변환 관련 정보를 포함합니다.

## 2. content

실제 문서 내용을 포함하는 핵심 부분입니다.

### 2.1 version
```json
{
  "version": {
    "parsed_structure": {
      "tag": "version",
      "namespace": "http://www.hancom.co.kr/hwpml/2011/version",
      "attributes": {
        "targetApplication": "HWP",
        "major": "5",
        "minor": "2",
        "micro": "0",
        "buildNumber": "3700",
        "os": "win32",
        "xmlVersion": "2.8",
        "application": "Hancom Office Hwp 2018",
        "appVersion": "10,0,0,3700"
      },
      "text": null,
      "children": []
    },
    "original_xml": "..."  // 원본 XML 문자열
  }
}
```

### 2.2 settings
문서 설정 정보를 포함합니다.
```json
{
  "settings": {
    "parsed_structure": {
      "tag": "settings",
      "namespace": "http://www.hancom.co.kr/hwpml/2011/settings",
      "attributes": {},
      "text": null,
      "children": [
        {
          "tag": "config-item-set",
          "attributes": { ... },
          "children": [ ... ]
        }
      ]
    },
    "original_xml": "..."
  }
}
```

### 2.3 header
문서 헤더 정보를 포함합니다.
```json
{
  "header": {
    "parsed_structure": {
      "tag": "hh",
      "namespace": "http://www.hancom.co.kr/hwpml/2011/head",
      "attributes": {
        "version": "7.0.0.0",
        "secCnt": "1"
      },
      "children": [
        {
          "tag": "refList",
          "attributes": {
            "page": "1",
            "footnote": "0",
            "endnote": "0",
            "pic": "0",
            "tbl": "1",
            "equation": "0"
          },
          "children": []
        },
        // ... 추가 헤더 요소들 (fontfaces, charProperties, paraProperties 등)
      ]
    },
    "original_xml": "..."
  }
}
```

### 2.4 sections
문서의 실제 내용을 포함하는 섹션 배열입니다.
```json
{
  "sections": [
    {
      "filename": "Contents/section0.xml",
      "data": {
        "parsed_structure": {
          "tag": "sec",
          "namespace": "http://www.hancom.co.kr/hwpml/2011/section",
          "attributes": { ... },
          "text": null,
          "children": [  // 문단(paragraph) 배열
            {
              "tag": "p",
              "namespace": "http://www.hancom.co.kr/hwpml/2011/paragraph",
              "attributes": {
                "id": "...",
                "paraPrIDRef": "...",
                "styleIDRef": "..."
              },
              "children": [  // 문단 내 요소들
                {
                  "tag": "run",  // 텍스트 런
                  "children": [
                    {
                      "tag": "t",  // 실제 텍스트
                      "text": "문서 내용..."
                    }
                  ]
                },
                {
                  "tag": "tbl",  // 표
                  "children": [
                    {
                      "tag": "tr",  // 표 행
                      "children": [
                        {
                          "tag": "tc",  // 표 셀
                          "children": [
                            {
                              "tag": "subList",  // 셀 내 문단들
                              "children": [ ... ]
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
        },
        "original_xml": "..."
      }
    }
  ]
}
```

### 2.5 binary_files
Base64로 인코딩된 바이너리 파일들입니다.
```json
{
  "binary_files": {
    "mimetype": "application/hwp+zip",
    "Contents/content.hpf": "base64_encoded_string...",
    "META-INF/container.rdf": "base64_encoded_string...",
    "META-INF/container.xml": "base64_encoded_string...",
    "META-INF/manifest.xml": "base64_encoded_string...",
    "Preview/PrvImage.png": "base64_encoded_string...",
    "Preview/PrvText.txt": "base64_encoded_string..."
  }
}
```

## 재귀적 구조: children 패턴

HWPX JSON의 핵심은 **재귀적 children 구조**입니다. 각 요소는 다음과 같은 기본 구조를 가집니다:

```json
{
  "tag": "element_name",        // XML 태그 이름
  "namespace": "...",            // XML 네임스페이스
  "attributes": { ... },         // 속성들
  "text": "...",                 // 텍스트 내용 (있는 경우)
  "children": [                  // 자식 요소들 (재귀적)
    {
      "tag": "child_element",
      "attributes": { ... },
      "text": "...",
      "children": [ ... ]       // 또 다른 자식들 (계속 재귀)
    }
  ]
}
```

### 주요 태그 계층 구조

```
sec (섹션)
└── p (문단)
    ├── run (텍스트 런)
    │   └── t (텍스트)
    ├── tbl (표)
    │   └── tr (행)
    │       └── tc (셀)
    │           └── subList
    │               └── p (셀 내 문단)
    │                   └── run
    │                       └── t
    └── ctrl (컨트롤 - 이미지, 도형 등)
        └── ...
```

## 주요 태그 설명

### 문단 관련
- **`p`**: 문단 (paragraph)
- **`run`**: 텍스트 런 (동일한 스타일을 가진 텍스트 블록)
- **`t`**: 실제 텍스트 내용

### 표 관련
- **`tbl`**: 표 (table)
- **`tr`**: 표 행 (table row)
- **`tc`**: 표 셀 (table cell)
- **`subList`**: 셀 내 문단 목록

### 스타일 관련
- **`charPr`**: 문자 속성
- **`paraPr`**: 문단 속성
- **`cellPr`**: 셀 속성

### 기타
- **`ctrl`**: 컨트롤 객체 (이미지, 도형 등)
- **`pic`**: 그림
- **`equation`**: 수식

## 활용 예시

### 1. 모든 텍스트 추출
```javascript
function extractText(node) {
  let text = '';
  
  if (node.tag === 't' && node.text) {
    text += node.text;
  }
  
  if (node.children) {
    for (const child of node.children) {
      text += extractText(child);
    }
  }
  
  return text;
}
```

### 2. 표 구조 파싱
```javascript
function parseTables(node) {
  const tables = [];
  
  if (node.tag === 'tbl') {
    const table = {
      rows: []
    };
    
    for (const child of node.children) {
      if (child.tag === 'tr') {
        const row = [];
        for (const cell of child.children) {
          if (cell.tag === 'tc') {
            row.push(extractText(cell));
          }
        }
        table.rows.push(row);
      }
    }
    
    tables.push(table);
  }
  
  if (node.children) {
    for (const child of node.children) {
      tables.push(...parseTables(child));
    }
  }
  
  return tables;
}
```

### 3. Canvas Editor JSON으로 변환
```javascript
function convertToCanvasEditor(hwpxJson) {
  const canvasElements = [];
  const sections = hwpxJson.content.sections;
  
  for (const section of sections) {
    const paragraphs = section.data.parsed_structure.children;
    
    for (const p of paragraphs) {
      if (p.tag === 'p') {
        // 문단 처리
        for (const child of p.children) {
          if (child.tag === 'run') {
            // 텍스트 런 처리
            const textNode = child.children.find(c => c.tag === 't');
            if (textNode && textNode.text) {
              canvasElements.push({
                type: 'text',
                value: textNode.text
              });
            }
          } else if (child.tag === 'tbl') {
            // 표 처리
            canvasElements.push({
              type: 'table',
              trList: convertTable(child)
            });
          }
        }
        
        // 문단 끝 처리
        canvasElements.push({
          type: 'text',
          value: '\\n'
        });
      }
    }
  }
  
  return canvasElements;
}
```

## 파일 크기 최적화

원본 JSON 파일이 큰 경우 (예: 6MB, 108,365줄), 다음 방법으로 최적화할 수 있습니다:

1. **최소화**: 불필요한 공백 제거 → 약 60% 크기 감소
2. **Gzip 압축**: → 약 98% 크기 감소

```bash
# 최소화
node scripts/minify-json.mjs hwpx_file.json --stats

# Gzip 압축
node scripts/minify-json.mjs hwpx_file.json --gzip --stats
```

## 참고사항

1. **네임스페이스**: 모든 태그는 한컴 HWPML 네임스페이스를 사용합니다.
2. **ID 참조**: 많은 요소들이 ID를 통해 스타일이나 다른 요소를 참조합니다.
3. **original_xml**: 각 주요 섹션은 원본 XML을 보존하고 있어 필요시 참조 가능합니다.
4. **바이너리 데이터**: 이미지 등의 바이너리 데이터는 Base64로 인코딩되어 저장됩니다.

## 추가 개발 과제

1. **HWPX → Canvas Editor 변환기 구현**
2. **Canvas Editor → HWPX 역변환기 구현**
3. **스타일 매핑 테이블 정의**
4. **이미지 및 미디어 처리**
5. **복잡한 표 구조 처리**