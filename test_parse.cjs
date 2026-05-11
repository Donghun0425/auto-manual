const fs = require("fs");
const c = fs.readFileSync("D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/univ/screg/usc06/usc_3010601_u.clx.js","utf8");
const pos1 = c.indexOf('new cpr.controls.Grid("DG_GRID01")');
const pos2 = c.indexOf('new cpr.controls.Grid("DG_GRID02")');
console.log("GRID01:", pos1, "GRID02:", pos2);
const g1 = c.slice(pos1, pos2);
const headerStart = g1.indexOf('"header"');
const detailStart = g1.indexOf('"detail"');
const headerSection = g1.slice(headerStart, detailStart);
const detailSection = g1.slice(detailStart);

// ─────────── 새 헤더 파싱 방식 ─────────────
function cleanText(t) { return t.replace(/\\r\\n|\\r|\\n/g,' ').trim(); }
const textRe = /cell\.text\s*=\s*"((?:[^"\\]|\\.)*)"/g;
const heads2 = new Map();
let tm;
while ((tm = textRe.exec(headerSection)) !== null) {
  const lb = headerSection.slice(Math.max(0, tm.index - 400), tm.index);
  const cms = [...lb.matchAll(/"colIndex":\s*(\d+)/g)];
  if (cms.length > 0) {
    const ci = parseInt(cms[cms.length-1][1]);
    heads2.set(ci, cleanText(tm[1]));
  }
}
console.log("header cells (new):", heads2.size, [...heads2.entries()]);

// ─────────── 새 detail 파싱 방식 ─────────────
const constraintRe = /"constraint"\s*:\s*\{([^}]+)\}\s*,\s*"configurator"\s*:\s*function\s*\(cell\)\s*\{/g;
const detailCells = [];
let cm;
while ((cm = constraintRe.exec(detailSection)) !== null) {
  const cs = cm[1];
  const bs = cm.index + cm[0].length;
  const riM = /"rowIndex":\s*(\d+)/.exec(cs);
  const ri = riM ? parseInt(riM[1]) : 0;
  if (ri !== 0) continue;
  const ciM = /"colIndex":\s*(\d+)/.exec(cs);
  if (!ciM) continue;
  const ci = parseInt(ciM[1]);
  // ── 핵심 수정: 다음 "constraint" 키 직전까지만 body로 사용 ──
  const nextConstraint = detailSection.indexOf('"constraint"', bs);
  const bodyEnd = (nextConstraint > bs) ? nextConstraint : bs + 2000;
  const body = detailSection.slice(bs, Math.min(bodyEnd, bs + 2000));
  const colNmM = /cell\.columnName\s*=\s*"([^"]+)"/.exec(body);
  const ctM = /new cpr\.controls\.(\w+)\(/.exec(body);
  const hasControl = /cell\.control\s*=/.test(body.slice(0, 500));
  if (!colNmM && !hasControl) continue;
  detailCells.push({colIndex: ci, columnName: colNmM ? colNmM[1] : '', controlType: ctM ? ctM[1] : '', headerText: heads2.get(ci) || ''});
}
console.log("detail cells (new):", detailCells.length, detailCells);

// columnName 패턴
const colRe = /cell\.columnName\s*=\s*"([^"]+)"/g;
const cols = [];
let m;
while ((m = colRe.exec(g1)) !== null) cols.push(m[1]);
console.log("columns count:", cols.length, "first5:", cols.slice(0,5));

// 헤더 패턴 테스트
const hRe = /"colIndex":\s*(\d+)[^}]*\},\s*"configurator":\s*function\s*\(cell\)\s*\{\s*cell\.text\s*=\s*"([^"]+)"/g;
const heads = [];
let hm;
while ((hm = hRe.exec(g1)) !== null) heads.push({col: parseInt(hm[1]), text: hm[2]});
console.log("headers count:", heads.length, "first5:", heads.slice(0,5));

// 원본 헤더 섹션 일부 출력 (1000자)
const headerIdx = g1.indexOf('"header"');
if (headerIdx >= 0) console.log("\n=== HEADER SECTION ===\n", g1.slice(headerIdx, headerIdx+800));

// detail 섹션 일부
const detailIdx = g1.indexOf('"detail"');
if (detailIdx >= 0) console.log("\n=== DETAIL SECTION ===\n", g1.slice(detailIdx, detailIdx+600));
