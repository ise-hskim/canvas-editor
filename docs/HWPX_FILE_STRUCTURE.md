# HWPX 파일 구조 (OCF 기반)

## 개요
HWPX는 한글 문서의 개방형 표준 포맷으로, OCF(Open Container Format) 스펙을 따르는 ZIP 압축 파일입니다. `.hwpx` 확장자를 `.zip`으로 변경하거나 unzip 명령으로 압축을 해제하면 내부 구조를 확인할 수 있습니다.

## HWPX 파일 압축 해제 방법

### 방법 1: 확장자 변경
```bash
# HWPX를 ZIP으로 복사
cp document.hwpx document.zip

# 압축 해제
unzip document.zip -d extracted_folder
```

### 방법 2: 직접 압축 해제
```bash
# unzip으로 직접 압축 해제
unzip document.hwpx -d extracted_folder

# 또는 7zip 사용
7z x document.hwpx -o extracted_folder
```

## 디렉토리 구조

```
hwpx_extracted/
├── mimetype                    # MIME 타입 선언 (압축 없음)
├── version.xml                  # 버전 정보
├── settings.xml                 # 문서 설정
├── Contents/                    # 문서 내용
│   ├── content.hpf             # 패키지 정의 (주 진입점)
│   ├── header.xml              # 헤더 정보 (스타일, 폰트 등)
│   └── section0.xml            # 섹션 내용 (실제 문서)
├── META-INF/                    # OCF 메타 정보
│   ├── container.xml           # OCF 컨테이너 정의
│   ├── container.rdf           # RDF 메타데이터
│   └── manifest.xml            # 파일 목록
└── Preview/                     # 미리보기
    ├── PrvImage.png            # 미리보기 이미지
    └── PrvText.txt             # 미리보기 텍스트
```

## 주요 파일 설명

### 1. mimetype
- **위치**: 루트 디렉토리
- **압축**: 압축하지 않음 (OCF 스펙 요구사항)
- **내용**: `application/hwp+zip`
- **목적**: 파일 형식 식별

### 2. META-INF/container.xml
OCF 컨테이너의 핵심 파일로, 문서의 진입점을 정의합니다.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<ocf:container xmlns:ocf="urn:oasis:names:tc:opendocument:xmlns:container" 
               xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf">
  <ocf:rootfiles>
    <ocf:rootfile full-path="Contents/content.hpf" 
                  media-type="application/hwpml-package+xml"/>
    <ocf:rootfile full-path="Preview/PrvText.txt" 
                  media-type="text/plain"/>
    <ocf:rootfile full-path="META-INF/container.rdf" 
                  media-type="application/rdf+xml"/>
  </ocf:rootfiles>
</ocf:container>
```

### 3. Contents/content.hpf
문서 패키지 정의 파일로, 문서를 구성하는 파일들을 나열합니다.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<hpf:hwpml xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" 
           version="1.0">
  <hpf:item itemid="root" href="header.xml" 
            media-type="application/hwpml-header+xml"/>
  <hpf:item itemid="section0" href="section0.xml" 
            media-type="application/hwpml-section+xml"/>
  <hpf:spine>
    <hpf:itemref idref="section0"/>
  </hpf:spine>
</hpf:hwpml>
```

### 4. version.xml
한글 프로그램 버전 정보를 포함합니다.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<ha:version xmlns:ha="http://www.hancom.co.kr/hwpml/2011/version" 
            tagetApplication="HWP" 
            major="5" minor="2" micro="0" buildNumber="3700" 
            os="win32" xmlVersion="2.8" 
            application="Hancom Office Hwp 2018" 
            appVersion="10,0,0,3700"/>
```

### 5. Contents/header.xml
문서의 메타데이터와 스타일 정보를 포함합니다.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<hh:hh xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" 
       version="7.0.0.0" secCnt="1">
  <hh:refList page="1" footnote="0" endnote="0" pic="0" tbl="1" equation="0"/>
  <hh:fontfaces itemCnt="9">
    <hh:fontface id="0" name="바탕" type="ttf">
      <hh:font name="바탕" type="ttf"/>
      <hh:font name="Batang" type="hft"/>
    </hh:fontface>
    <!-- 추가 폰트 정의 -->
  </hh:fontfaces>
  <hh:charProperties itemCnt="23">
    <!-- 문자 스타일 정의 -->
  </hh:charProperties>
  <hh:paraProperties itemCnt="23">
    <!-- 문단 스타일 정의 -->
  </hh:paraProperties>
  <!-- 추가 스타일 정의 -->
</hh:hh>
```

### 6. Contents/section0.xml
실제 문서 내용을 포함하는 핵심 파일입니다.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<hs:sec xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" 
        id="0" name="본문">
  <hs:p id="1" paraPrIDRef="0" styleIDRef="0">
    <hs:run charPrIDRef="1">
      <hs:t>실제 문서 텍스트</hs:t>
    </hs:run>
  </hs:p>
  <!-- 추가 문단들 -->
  <hs:p id="2">
    <hs:tbl id="1">
      <hs:tr>
        <hs:tc>
          <hs:subList>
            <hs:p>
              <hs:run>
                <hs:t>표 내용</hs:t>
              </hs:run>
            </hs:p>
          </hs:subList>
        </hs:tc>
      </hs:tr>
    </hs:tbl>
  </hs:p>
</hs:sec>
```

### 7. settings.xml
문서 설정 정보를 포함합니다.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<ha:settings xmlns:ha="http://www.hancom.co.kr/hwpml/2011/settings">
  <ha:config-item-set name="hw.view.properties">
    <ha:config-item name="CaretPos" type="array">
      <ha:config-value listIDRef="0" paraIDRef="1" pos="0"/>
    </ha:config-item>
  </ha:config-item-set>
</ha:settings>
```

## OCF (Open Container Format) 스펙

HWPX는 OASIS OCF 스펙을 따르며, 다음 요구사항을 충족합니다:

1. **mimetype 파일**
   - ZIP 아카이브의 첫 번째 파일
   - 압축하지 않음
   - MIME 타입 명시

2. **META-INF/container.xml**
   - 문서의 진입점 정의
   - rootfile 요소로 주 문서 지정

3. **패키지 구조**
   - 계층적 디렉토리 구조
   - XML 기반 메타데이터

## XML 네임스페이스

HWPX에서 사용하는 주요 네임스페이스:

| 접두사 | 네임스페이스 URI | 용도 |
|--------|-----------------|------|
| hh | http://www.hancom.co.kr/hwpml/2011/head | 헤더 정보 |
| hs | http://www.hancom.co.kr/hwpml/2011/section | 섹션 내용 |
| hp | http://www.hancom.co.kr/hwpml/2011/paragraph | 문단 |
| hpf | http://www.hancom.co.kr/schema/2011/hpf | 패키지 정의 |
| ha | http://www.hancom.co.kr/hwpml/2011/settings | 설정 |
| ocf | urn:oasis:names:tc:opendocument:xmlns:container | OCF 컨테이너 |

## 프로그래밍 방식으로 HWPX 처리

### Node.js에서 HWPX 파일 읽기
```javascript
import JSZip from 'jszip';
import fs from 'fs';
import { parseStringPromise } from 'xml2js';

async function readHWPX(filePath) {
  // HWPX 파일 읽기
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  
  // mimetype 확인
  const mimetype = await zip.file('mimetype').async('string');
  console.log('MIME Type:', mimetype);
  
  // container.xml 파싱
  const containerXml = await zip.file('META-INF/container.xml').async('string');
  const container = await parseStringPromise(containerXml);
  
  // content.hpf 파싱
  const contentHpf = await zip.file('Contents/content.hpf').async('string');
  const content = await parseStringPromise(contentHpf);
  
  // section0.xml 파싱 (실제 문서 내용)
  const sectionXml = await zip.file('Contents/section0.xml').async('string');
  const section = await parseStringPromise(sectionXml);
  
  return {
    mimetype,
    container,
    content,
    section
  };
}
```

### Python에서 HWPX 파일 읽기
```python
import zipfile
import xml.etree.ElementTree as ET

def read_hwpx(file_path):
    with zipfile.ZipFile(file_path, 'r') as zip_file:
        # 파일 목록 확인
        file_list = zip_file.namelist()
        print("Files in HWPX:", file_list)
        
        # mimetype 읽기
        mimetype = zip_file.read('mimetype').decode('utf-8')
        print("MIME Type:", mimetype)
        
        # XML 파일 파싱
        with zip_file.open('Contents/section0.xml') as section_file:
            tree = ET.parse(section_file)
            root = tree.getroot()
            
            # 네임스페이스 정의
            ns = {
                'hs': 'http://www.hancom.co.kr/hwpml/2011/section',
                'hp': 'http://www.hancom.co.kr/hwpml/2011/paragraph'
            }
            
            # 모든 문단 찾기
            paragraphs = root.findall('.//hs:p', ns)
            for p in paragraphs:
                text_elements = p.findall('.//hs:t', ns)
                for t in text_elements:
                    if t.text:
                        print("Text:", t.text)
```

## 참고사항

1. **압축 순서**: mimetype 파일은 반드시 ZIP 아카이브의 첫 번째 파일이어야 함
2. **인코딩**: 모든 XML 파일은 UTF-8 인코딩 사용
3. **스타일 참조**: ID를 통한 스타일 참조 방식 사용
4. **섹션**: 문서는 여러 섹션으로 구성될 수 있음 (section0.xml, section1.xml, ...)
5. **바이너리 데이터**: 이미지 등은 별도 디렉토리에 저장

## 관련 표준

- **OCF**: OASIS Open Container Format
- **ODF**: Open Document Format (유사한 구조)
- **OOXML**: Office Open XML (MS Office 형식, 유사한 ZIP 기반 구조)