# HWPX to Canvas Editor Converter TODO List

## 프로젝트 개요
HWPX JSON 구조를 Canvas Editor JSON 구조로 변환하는 converter 개발

## 완료된 작업 ✅
- [x] 기본 디렉토리 구조 생성
- [x] 타입 정의 파일 작성 (`types.ts`)
- [x] 스타일 매핑 테이블 작성 (`mappings.ts`)
- [x] HWPX JSON 구조 문서화
- [x] Canvas Editor JSON 구조 문서화
- [x] HWPXToCanvasConverter 기본 클래스 구현
- [x] ProcessorManager 시스템 구현
- [x] BaseProcessor 인터페이스 및 기본 클래스 구현

## 1단계: 기본 구조 구현 🏗️

### 1.1 핵심 Converter 클래스
- [x] `HWPXToCanvasConverter.ts` 생성
  - [x] 기본 클래스 구조
  - [x] 초기화 메서드
  - [x] 옵션 처리

### 1.2 노드 프로세서 시스템
- [x] `processors/BaseProcessor.ts` - 기본 프로세서 클래스
- [x] `processors/ProcessorManager.ts` - 프로세서 등록/관리
- [x] `processors/index.ts` - 프로세서 export

### 1.3 유틸리티 함수
- [x] `utils/nodeUtils.ts` - 노드 탐색/조작 유틸
- [x] `utils/styleUtils.ts` - 스타일 변환 유틸
- [x] `utils/idGenerator.ts` - ID 생성 유틸
- [x] `utils/index.ts` - 유틸리티 export

## 2단계: 텍스트 처리 구현 📝

### 2.1 문단 프로세서
- [x] `processors/ParagraphProcessor.ts`
  - [x] 문단(p) 태그 처리
  - [x] 문단 스타일 적용
  - [x] 정렬 처리

### 2.2 텍스트 런 프로세서
- [x] `processors/TextProcessor.ts` (Run 처리 포함)
  - [x] run 태그 처리
  - [x] 문자 스타일 적용
  - [x] 텍스트 추출

### 2.3 텍스트 프로세서
- [x] `processors/TextProcessor.ts`
  - [x] t 태그 처리
  - [x] 특수 문자 처리
  - [x] 공백 정규화

## 3단계: 표 처리 구현 📊

### 3.1 표 프로세서
- [x] `processors/TableProcessor.ts`
  - [x] tbl 태그 처리
  - [x] colgroup 생성
  - [x] 테두리 스타일

### 3.2 행/셀 프로세서
- [x] `processors/TableProcessor.ts` (행/셀 처리 포함)
  - [x] tr 태그 처리
  - [x] 행 높이 계산
  - [x] tc 태그 처리
  - [x] 셀 병합 처리
  - [x] 셀 스타일 적용

### 3.3 서브리스트 프로세서
- [ ] `processors/SubListProcessor.ts`
  - [ ] 셀 내 문단 처리
  - [ ] 중첩 구조 처리

## 4단계: 특수 요소 처리 🎨

### 4.1 이미지 프로세서
- [x] `processors/ImageProcessor.ts`
  - [x] pic 태그 처리
  - [x] base64 변환
  - [x] 크기 조정

### 4.2 하이퍼링크 프로세서
- [x] `processors/HyperlinkProcessor.ts`
  - [x] hyperlink 태그 처리
  - [x] URL 추출
  - [x] 링크 텍스트 처리

### 4.3 제목 프로세서
- [x] `processors/TitleProcessor.ts`
  - [x] 제목 레벨 판별
  - [x] 제목 스타일 적용

### 4.4 목록 프로세서
- [x] `processors/ListProcessor.ts`
  - [x] 목록 타입 판별
  - [x] 목록 스타일 적용
  - [x] 중첩 목록 처리

## 5단계: 스타일 처리 시스템 🎨

### 5.1 스타일 파서
- [ ] `styles/StyleParser.ts`
  - [ ] paraPr 파싱
  - [ ] charPr 파싱
  - [ ] cellPr 파싱

### 5.2 스타일 병합
- [ ] `styles/StyleMerger.ts`
  - [ ] 스타일 상속
  - [ ] 스타일 우선순위
  - [ ] 기본값 적용

### 5.3 스타일 캐시
- [ ] `styles/StyleCache.ts`
  - [ ] 스타일 ID 매핑
  - [ ] 스타일 재사용

## 6단계: 메타데이터 처리 📋

### 6.1 헤더 파서
- [ ] `parsers/HeaderParser.ts`
  - [ ] fontfaces 파싱
  - [ ] charProperties 파싱
  - [ ] paraProperties 파싱

### 6.2 설정 파서
- [ ] `parsers/SettingsParser.ts`
  - [ ] 문서 설정 추출
  - [ ] 페이지 설정

## 7단계: 에러 처리 & 검증 ⚠️

### 7.1 에러 핸들러
- [ ] `errors/ErrorHandler.ts`
  - [ ] 에러 타입 정의
  - [ ] 에러 로깅
  - [ ] 복구 전략

### 7.2 검증기
- [ ] `validators/InputValidator.ts`
  - [ ] HWPX JSON 검증
- [ ] `validators/OutputValidator.ts`
  - [ ] Canvas Editor JSON 검증

## 8단계: 테스트 구현 🧪

### 8.1 단위 테스트
- [ ] `__tests__/processors/*.test.ts`
  - [ ] 각 프로세서 테스트
- [ ] `__tests__/utils/*.test.ts`
  - [ ] 유틸 함수 테스트
- [ ] `__tests__/mappings.test.ts`
  - [ ] 매핑 테이블 테스트

### 8.2 통합 테스트
- [ ] `__tests__/integration/text.test.ts`
- [ ] `__tests__/integration/table.test.ts`
- [ ] `__tests__/integration/complex.test.ts`

### 8.3 E2E 테스트
- [ ] `__tests__/e2e/converter.test.ts`
  - [ ] 실제 HWPX 파일 변환 테스트
  - [ ] 성능 테스트

## 9단계: 최적화 & 성능 개선 ⚡

- [ ] 대용량 문서 처리 최적화
- [ ] 메모리 사용량 최적화
- [ ] 변환 속도 개선
- [ ] 스트리밍 처리 구현

## 10단계: 문서화 & 예제 📚

- [ ] API 문서 작성
- [ ] 사용 가이드 작성
- [ ] 예제 코드 작성
- [ ] 변환 제한사항 문서화

## 완료된 주요 기능 ✅

1. **기본 텍스트 변환** - TextProcessor 구현 완료
2. **표 변환** - TableProcessor 구현 완료
3. **문단 처리** - ParagraphProcessor 구현 완료
4. **이미지 처리** - ImageProcessor 구현 완료
5. **목록 처리** - ListProcessor 구현 완료
6. **제목 처리** - TitleProcessor 구현 완료
7. **하이퍼링크 처리** - HyperlinkProcessor 구현 완료
8. **유틸리티 함수** - nodeUtils, styleUtils, idGenerator 구현 완료

## 다음 우선순위 작업 🔥

1. **에러 처리 시스템** - 안정성 확보
2. **스타일 파서/병합** - 문서 품질 향상
3. **실제 HWPX 파일 테스트** - 실전 검증
4. **성능 최적화** - 대용량 문서 처리
5. **추가 Processor** - Control, Separator, Block 등

## 기술 스택
- TypeScript
- Node.js (for file processing)
- Browser compatible

## 참고 문서
- [HWPX JSON Structure](../../docs/HWPX_JSON_STRUCTURE.md)
- [Canvas Editor JSON Structure](../../docs/CANVAS_EDITOR_JSON_STRUCTURE.md)
- [HWPX File Structure](../../docs/HWPX_FILE_STRUCTURE.md)

## 주의사항
- HWPX의 모든 기능이 Canvas Editor에서 지원되지 않을 수 있음
- 스타일 매핑이 완벽하지 않을 수 있음
- 복잡한 레이아웃은 단순화될 수 있음

## 다음 단계
1. `HWPXToCanvasConverter.ts` 기본 클래스 구현
2. `BaseProcessor.ts` 구현
3. `TextProcessor.ts` 구현 (가장 간단한 것부터)
4. 기본 텍스트 변환 테스트