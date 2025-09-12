#!/usr/bin/env node

import fs from 'fs';
import { HWPXToCanvasConverter } from './src/converters/hwpx-to-canvas/HWPXToCanvasConverter.js';

// HWPX JSON 로드
const hwpxJson = JSON.parse(fs.readFileSync('temp/인천정각중학교 교육실습 운영 계획 (1) (1).json', 'utf8'));

// Converter 실행
const converter = new HWPXToCanvasConverter({
    preserveStyles: true,
    preserveLayout: true
});

console.log('변환 시작...');
const result = converter.convertSync(hwpxJson);

if (result.success && result.data) {
    const elements = result.data.data.main;
    
    // 첫 번째 실제 텍스트 찾기
    let firstText = '';
    let metadataFound = false;
    
    for (let i = 0; i < Math.min(100, elements.length); i++) {
        if (elements[i].value) {
            // {} 문자 확인
            if (elements[i].value === '{' || elements[i].value === '}') {
                metadataFound = true;
                firstText += elements[i].value;
            } else if (elements[i].value !== '\n' && elements[i].value !== ' ') {
                firstText += elements[i].value;
                // 첫 50자만 수집
                if (firstText.length > 50) break;
            }
        }
    }
    
    // 결과 출력
    console.log('\n========== 메타데이터 필터링 테스트 결과 ==========');
    if (metadataFound) {
        console.log('❌ 실패: 메타데이터 {} 가 여전히 렌더링됨');
        console.log('첫 텍스트:', firstText);
    } else if (firstText.startsWith('2024학년도')) {
        console.log('✅ 성공: 메타데이터 필터링 완료! {} 가 제거됨');
        console.log('첫 텍스트:', firstText);
    } else {
        console.log('⚠️  예상치 못한 첫 텍스트');
        console.log('첫 텍스트:', firstText);
    }
    
    // 처음 20개 요소 출력
    console.log('\n처음 20개 요소:');
    for (let i = 0; i < 20 && i < elements.length; i++) {
        const el = elements[i];
        if (el.value) {
            console.log(`  [${i}] type: ${el.type}, value: "${el.value}"`);
        }
    }
    
} else {
    console.log('❌ 변환 실패:', result.errors?.[0]?.message || 'Unknown error');
}