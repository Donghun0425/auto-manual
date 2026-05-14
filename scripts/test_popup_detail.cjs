'use strict';
const fs = require('fs');
const base = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/';

['csm_1020101_p02.clx.js','csm_1020101_p03.clx.js'].forEach(f => {
  const c = fs.readFileSync(base + f, 'utf8');
  console.log(`\n===== ${f} =====`);
  
  // 헤더 파서 흉내: 첫 30줄의 주석 블록
  const lines = c.split('\n').slice(0, 60);
  lines.forEach(l => { if (l.includes('*') || l.includes('//')) console.log(l); });
  
  // TitleForm 관련 함수들
  const tfMatches = [...c.matchAll(/function\s+(TitleForm_\w+)\s*\(/g)];
  console.log('\nTitleForm 함수:', tfMatches.map(m => m[1]));
  
  // TitleBar title 탐색
  const titleM = [...c.matchAll(/\.title\s*=\s*"([^"]+)"/g)];
  console.log('title들:', titleM.map(m => m[1]));
  
  // 서비스 호출 탐색
  const servMatches = [...c.matchAll(/app\.serv\s*\(|serviceRequest|serviceId\s*=\s*"([^"]+)"/g)];
  console.log('서비스:', servMatches.slice(0,5).map(m => m[0].slice(0,60)));
  
  // 닫기/확인 버튼
  const closeMatch = c.includes('close') || c.includes('닫기');
  const confirmMatch = c.includes('confirm') || c.includes('확인');
  console.log('close관련:', closeMatch, 'confirm관련:', confirmMatch);
});
