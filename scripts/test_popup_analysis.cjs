'use strict';
const fs = require('fs');
const BASE = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/';

['csm_1020101_p02.clx.js','csm_1020101_p03.clx.js'].forEach(f => {
  const c = fs.readFileSync(BASE + f, 'utf8');
  console.log(`\n===== ${f} =====`);

  // parseHeader 재현
  const sys = /\/\/\s*\[시스템명\]\s*(.+)/.exec(c)?.[1]?.trim() ?? '';
  const sub = /\/\/\s*\[부시스템\]\s*(.+)/.exec(c)?.[1]?.trim() ?? '';
  const prg = /\/\/\s*\[프로그램\]\s*(.+)/.exec(c)?.[1]?.trim() ?? '';
  const desc = /\/\/\s*\[설명\]\s*(.+)/.exec(c)?.[1]?.trim() ?? '';
  console.log('systemName:', sys);
  console.log('subSystem:', sub);
  console.log('programName:', prg);
  console.log('description:', desc);

  // parseTitleBarCrud 대략: PatisTitleBar var 선언 + title
  const titleRe = /var\s+(\w+)\s*=\s*(?:\w+\.\w+\s*=\s*)?new\s+udc\.common\.PatisTitleBar\s*\(/g;
  let m;
  const bars = [];
  while ((m = titleRe.exec(c)) !== null) {
    const vn = m[1];
    const after = c.slice(m.index, m.index + 800);
    const titleM = new RegExp(`${vn}\\.title\\s*=\\s*"([^"]+)"`).exec(after);
    const hasInq = new RegExp(`function\\s+TitleForm_inq`).test(c);
    const hasNew = new RegExp(`function\\s+TitleForm_new`).test(c);
    const hasSave = new RegExp(`function\\s+TitleForm_save`).test(c);
    const hasDel = new RegExp(`function\\s+TitleForm_del`).test(c);
    if (titleM) bars.push({ title: titleM[1], hasInq, hasNew, hasSave, hasDel });
  }
  console.log('titleBars:', JSON.stringify(bars, null, 2));
  
  // menuTitleBar CRUD
  console.log('menu.hasInquiry:', /function\s+Form_inq(Action|Click)\s*\(/.test(c));
  console.log('menu.hasNew:', /function\s+Form_new(Action|Click)\s*\(/.test(c));
  console.log('menu.hasSave:', /function\s+Form_save(Action|Click)\s*\(/.test(c));
  console.log('menu.hasDelete:', /function\s+Form_del(Action|Click)\s*\(/.test(c));
  
  // conditionGroups 유무 (SEARCHGROUP/CONDITIONGROUP)
  const hasSearchGrp = /new\s+cpr\.controls\.Container\("(?:SEARCHGROUP|CONDITIONGROUP)\d+"/.test(c);
  const hasInfoGrp = /new\s+cpr\.controls\.Container\("INFOGROUP\d+"/.test(c);
  console.log('hasSearchGroup:', hasSearchGrp, 'hasInfoGroup:', hasInfoGrp);
  
  // 입력 컨트롤 유무
  const hasInputBox = /new\s+cpr\.controls\.InputBox/.test(c);
  console.log('hasInputBox:', hasInputBox);
});
