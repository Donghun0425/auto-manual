'use strict';
const fs = require('fs');
const base = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/';

['csm_1020101_p02.clx.js','csm_1020101_p03.clx.js'].forEach(f => {
  const c = fs.readFileSync(base + f, 'utf8');
  const len = c.length;
  console.log(`\n===== ${f} (${len}자) =====`);
  // CRUD 함수 체크
  console.log('Form_inq:', /function\s+Form_inq(Action|Click)\s*\(/.test(c));
  console.log('Form_new:', /function\s+Form_new(Action|Click)\s*\(/.test(c));
  console.log('Form_save:', /function\s+Form_save(Action|Click)\s*\(/.test(c));
  console.log('Form_del:', /function\s+Form_del(Action|Click)\s*\(/.test(c));
  // TitleForm 체크
  console.log('TitleForm_save:', /function\s+TitleForm_save(Action|Click)\s*\(/.test(c));
  // ext 버튼 체크
  const exts = [...c.matchAll(/function\s+Form_ext(\d+)Click\s*\(/g)];
  console.log('extButtons:', exts.map(m => `ext${m[1]}`));
  // 프로그램명 추출 시도
  const progMatch = /programName\s*[=:]\s*["']([^"']+)["']/.exec(c) 
    || /programNm\s*=\s*"([^"]+)"/.exec(c)
    || /g_programName\s*=\s*"([^"]+)"/.exec(c);
  console.log('programName 패턴:', progMatch?.[1] ?? '없음');
  // 헤더 주석 (첫 400자)
  console.log('첫300자:', c.slice(0, 300));
});
