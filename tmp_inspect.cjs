const fs = require('fs');
const path = require('path');

// Check UcoYrSmstrCombo default labels
const UDC_SRC = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-src/udc/univ/UcoYrSmstrCombo.js';
const src = fs.readFileSync(UDC_SRC, 'utf8');

// Find default yrLabel and smstrLabel values
const defaultYr = /setAppProperty\s*\(\s*["']yrLabel["']\s*,\s*["']([^"']+)["']/.exec(src);
const defaultSmstr = /setAppProperty\s*\(\s*["']smstrLabel["']\s*,\s*["']([^"']+)["']/.exec(src);
console.log('Default yrLabel:', defaultYr?.[1]);
console.log('Default smstrLabel:', defaultSmstr?.[1]);

// Check host file for init*Label calls on UcoYrSmstrCombo
const HOST = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/univ/screg/usc03/usc_3010301_u.clx.js';
const host = fs.readFileSync(HOST, 'utf8');

// Find UDC control ID
const udcM = /new udc\.\w+\.UcoYrSmstrCombo\("([^"]+)"\)/.exec(host);
const udcId = udcM?.[1];
console.log('\nUcoYrSmstrCombo id:', udcId);

if (udcId) {
  // Find all calls to this control
  const callRe = new RegExp(`app\\.lookup\\("${udcId}"\\)\\.init\\w*Label[^;]+;`, 'g');
  let m;
  console.log('\nLabel init calls:');
  while ((m = callRe.exec(host)) !== null) {
    console.log(' ', m[0]);
  }
}

// Also check for all UDC types in host and their label init calls
const udcTypes = [];
const typeRe = /new udc\.([\w.]+)\("([^"]+)"\)/g;
let m;
while ((m = typeRe.exec(host)) !== null) {
  udcTypes.push({ type: m[1], id: m[2] });
}
console.log('\n\nAll UDC instances in host:');
for (const { type, id } of udcTypes) {
  console.log(`  ${type}("${id}")`);
  // check for label calls
  const labelRe = new RegExp(`app\\.lookup\\("${id}"\\)\\.((?:init|set)\\w*(?:[Ll]abel|[Tt]ext)\\w*)\\(([^)]+)\\)`, 'g');
  while ((m = labelRe.exec(host)) !== null) {
    console.log(`    -> ${m[1]}(${m[2]})`);
  }
}






