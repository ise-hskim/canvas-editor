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

### 5.1 스타일 로더 & 파서
- [x] `styles/StyleLoader.ts`
  - [x] header에서 스타일 정의 로드
  - [x] charProperties 파싱
  - [x] paraProperties 파싱
  - [x] fontfaces 파싱
- [x] `styles/StyleParser.ts`
  - [x] StyleLoader 통합
  - [x] charPr ID 매핑
  - [x] paraPr ID 매핑
  - [x] 동적 스타일 적용

### 5.2 스타일 병합
- [ ] `styles/StyleMerger.ts`
  - [ ] 스타일 상속
  - [ ] 스타일 우선순위
  - [ ] 기본값 적용

### 5.3 스타일 캐시
- [ ] `styles/StyleCache.ts`
  - [ ] 스타일 ID 매핑
  - [ ] 스타일 재사용

## 6단계: 메타데이터 처리 - Milestone 1 (기본) ✅

### 6.1 메타데이터 태그 필터링 (완료)
- [x] `processors/TextProcessor.ts` 수정
  - [x] secPr, ctrl, container 등 26개 메타데이터 태그 무시
  - [x] `{}` 렌더링 문제 해결
  - [x] 실제 텍스트만 추출
  - [x] 메타데이터 태그의 자식 노드는 재귀적으로 처리

### 6.2 헤더 파서 (완료)
- [x] StyleLoader가 이미 처리
  - [x] fontfaces 파싱
  - [x] charProperties 파싱
  - [x] paraProperties 파싱

## Milestone 2: 고급 메타데이터 바인딩 🚀

> **Note**: 메타데이터를 Canvas Editor에 바인딩하려면 Editor의 추가 기능 구현이 필요합니다.
> 이 작업들은 Editor 기능이 확장된 후 진행할 예정입니다.

### M2.1 메타데이터 프로세서
- [ ] `processors/MetadataProcessor.ts`
  - [ ] 페이지 설정 처리 (secPr, pagePr)
  - [ ] 섹션 속성 (페이지 크기, 여백, 방향)
  - [ ] 문서 전체 설정 적용
  - [ ] Canvas Editor의 페이지 설정 API와 연동

### M2.2 컨테이너/도형 처리
- [ ] `processors/ContainerProcessor.ts`
  - [ ] container 태그 처리 (도형, 이미지 컨테이너)
  - [ ] rect 처리 (사각형 도형)
  - [ ] offset, sz, pos 처리 (위치와 크기)
  - [ ] flip, rotation 처리 (변환)
  - [ ] Canvas Editor의 도형 렌더링 API와 연동

### M2.3 라인 세그먼트 처리
- [ ] `processors/LineSegmentProcessor.ts`
  - [ ] linesegarray 처리 (779회 사용)
  - [ ] lineseg 처리 (823회 사용)
  - [ ] 텍스트 레이아웃 정보 보존
  - [ ] Canvas Editor의 텍스트 레이아웃 API와 연동

### M2.4 컨트롤 요소 처리
- [ ] `processors/ControlProcessor.ts`
  - [ ] ctrl 태그 처리 (문서 컨트롤)
  - [ ] colPr 처리 (컬럼 속성)
  - [ ] markStart/markEnd 처리 (북마크)
  - [ ] Canvas Editor의 컨트롤 요소 API와 연동

### M2.5 그리기 객체 처리
- [ ] `processors/DrawingProcessor.ts`
  - [ ] drawText 처리 (그려진 텍스트)
  - [ ] linkinfo 처리 (링크 정보)
  - [ ] pageNum 처리 (페이지 번호)
  - [ ] Canvas Editor의 그리기 객체 API와 연동

### M2.6 설정 파서
- [ ] `parsers/SettingsParser.ts`
  - [ ] 문서 설정 추출
  - [ ] 페이지 설정
  - [ ] Canvas Editor의 문서 설정 API와 연동

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
2. **표 변환** - TableProcessor 구현 완료 (병합 처리 포함)
3. **문단 처리** - ParagraphProcessor 구현 완료
4. **이미지 처리** - ImageProcessor 구현 완료
5. **목록 처리** - ListProcessor 구현 완료
6. **제목 처리** - TitleProcessor 구현 완료
7. **하이퍼링크 처리** - HyperlinkProcessor 구현 완료
8. **유틸리티 함수** - nodeUtils, styleUtils, idGenerator 구현 완료
9. **스타일 시스템** - StyleLoader, StyleParser 구현 완료
   - JSON header에서 스타일 정의 자동 로드
   - charPrIDRef/paraPrIDRef 동적 매핑
   - 19pt bold center 등 실제 스타일 적용
10. **메타데이터 필터링** - 26개 메타데이터 태그 필터링 완료
    - `{}` 렌더링 문제 해결
    - 메타데이터 태그의 자식 노드는 재귀적으로 처리

## 다음 우선순위 작업 🔥

### Milestone 1 (현재 진행 중)
1. ~~**메타데이터 태그 필터링**~~ ✅ - `{}` 렌더링 문제 해결 완료
2. **에러 처리 시스템** - 안정성 확보
3. **실제 HWPX 파일 테스트** - 실전 검증
4. **성능 최적화** - 대용량 문서 처리

### Milestone 2 (Editor 기능 확장 후)
1. **메타데이터 프로세서 구현** - 페이지 설정, 컨테이너 등
2. **고급 레이아웃 처리** - lineseg (823회), linesegarray (779회)
3. **도형 및 그리기 객체** - container, rect, drawText
4. **문서 설정 바인딩** - 페이지 크기, 여백, 방향

## 메타데이터 태그 분류 📊

### 무시해야 할 태그 (26개)
```
secPr, ctrl, container, linesegarray, markStart, markEnd,
colPr, pagePr, grid, startNum, visibility, lineNumberShape,
offset, orgSz, curSz, flip, rotationInfo, renderingInfo,
sz, pos, outMargin, rect, pageNum, drawText, linkinfo, lineseg
```

### 사용 빈도
- lineseg: 823회
- linesegarray: 779회
- sz, pos, outMargin: 각 10회
- offset: 8회
- ctrl, orgSz, curSz, flip, rotationInfo, renderingInfo: 각 5회

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