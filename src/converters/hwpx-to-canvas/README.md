# HWPX to Canvas Editor Converter

HWPX JSON 형식을 Canvas Editor JSON 형식으로 변환하는 converter입니다.

## 📁 프로젝트 구조

```
hwpx-to-canvas/
├── HWPXToCanvasConverter.ts  # 메인 converter 클래스
├── types.ts                   # TypeScript 타입 정의
├── mappings.ts                # 스타일/속성 매핑 테이블
├── index.ts                   # 진입점
├── TODO.md                    # 개발 TODO 리스트
├── README.md                  # 이 파일
│
├── processors/                # 노드 프로세서들 (TODO)
│   ├── BaseProcessor.ts
│   ├── ParagraphProcessor.ts
│   ├── TableProcessor.ts
│   └── ...
│
├── utils/                     # 유틸리티 함수들 (TODO)
│   ├── nodeUtils.ts
│   ├── styleUtils.ts
│   └── ...
│
└── __tests__/                # 테스트 파일들 (TODO)
    ├── converter.test.ts
    └── ...
```

## 🚀 사용법

```typescript
import { HWPXToCanvasConverter } from './converters/hwpx-to-canvas'

// Converter 인스턴스 생성
const converter = new HWPXToCanvasConverter({
  preserveStyles: true,
  defaultFont: '바탕',
  defaultSize: 16
})

// HWPX JSON을 Canvas Editor JSON으로 변환
const result = await converter.convert(hwpxJson)

if (result.success) {
  const canvasEditorData = result.data
  console.log('변환 성공:', canvasEditorData)
  console.log('통계:', result.stats)
} else {
  console.error('변환 실패:', result.errors)
}
```

## 🔧 옵션

```typescript
interface IConverterOptions {
  preserveStyles?: boolean      // 스타일 보존 (기본: true)
  preserveIds?: boolean         // ID 보존 (기본: false)
  preserveLayout?: boolean      // 레이아웃 보존 (기본: true)
  defaultFont?: string          // 기본 폰트 (기본: '바탕')
  defaultSize?: number          // 기본 크기 (기본: 16)
  defaultColor?: string         // 기본 색상 (기본: '#000000')
  embedImages?: boolean         // 이미지 임베드 (기본: true)
  skipEmptyParagraphs?: boolean // 빈 문단 건너뛰기 (기본: false)
  normalizeWhitespace?: boolean // 공백 정규화 (기본: true)
  onError?: (error: Error, context: any) => void
  onWarning?: (message: string, context: any) => void
}
```

## 📊 변환 매핑

### 지원되는 HWPX 요소들

| HWPX 태그 | Canvas Editor Type | 구현 상태 |
|-----------|-------------------|-----------|
| p         | TEXT              | 🚧 기본만 |
| run       | TEXT              | 🚧 기본만 |
| t         | TEXT              | 🚧 기본만 |
| tbl       | TABLE             | ❌ TODO   |
| tr        | (표 행)           | ❌ TODO   |
| tc        | (표 셀)           | ❌ TODO   |
| pic       | IMAGE             | ❌ TODO   |
| hyperlink | HYPERLINK         | ❌ TODO   |
| equation  | LATEX             | ❌ TODO   |

### 폰트 매핑

HWPX 폰트는 `mappings.ts`의 `fontMap`에 정의된 대로 변환됩니다:
- 함초롬바탕 → 바탕
- 함초롬돋움 → 돋움
- 맑은 고딕 → 맑은 고딕
- 기타...

## 🏗️ 현재 상태

- ✅ 기본 구조 완성
- ✅ 타입 정의 완료
- ✅ 매핑 테이블 작성
- 🚧 기본 텍스트 변환 (임시 구현)
- ❌ 표 변환 (TODO)
- ❌ 이미지 변환 (TODO)
- ❌ 스타일 적용 (TODO)
- ❌ 테스트 작성 (TODO)

## 📝 개발 가이드

상세한 개발 계획은 [TODO.md](./TODO.md)를 참조하세요.

### 다음 단계

1. **TextProcessor 구현**: 가장 기본적인 텍스트 변환부터 시작
2. **ParagraphProcessor 구현**: 문단 구조와 스타일 처리
3. **TableProcessor 구현**: 표 구조 변환
4. **테스트 작성**: 각 프로세서별 단위 테스트

### 프로세서 추가 방법

1. `processors/` 디렉토리에 새 프로세서 생성
2. `BaseProcessor`를 상속받아 구현
3. `canProcess()` 메서드로 처리 가능한 노드 판별
4. `process()` 메서드로 실제 변환 수행

## ⚠️ 제한사항

- HWPX의 모든 기능이 Canvas Editor에서 지원되지 않을 수 있습니다
- 복잡한 레이아웃은 단순화될 수 있습니다
- 일부 스타일은 유사한 스타일로 대체될 수 있습니다

## 📚 참고 문서

- [HWPX JSON Structure](../../docs/HWPX_JSON_STRUCTURE.md)
- [Canvas Editor JSON Structure](../../docs/CANVAS_EDITOR_JSON_STRUCTURE.md)
- [HWPX File Structure](../../docs/HWPX_FILE_STRUCTURE.md)

## 🤝 기여 방법

1. TODO.md의 작업 중 하나를 선택
2. 해당 기능 구현
3. 테스트 작성
4. PR 제출