const fs = require('fs');
const path = require('path');

const UDC_FILE = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/cpr-lib/udc.js';
const OUTPUT_FILE = path.join(__dirname, 'src/parser/udcRegistry.ts');

const c = fs.readFileSync(UDC_FILE, 'utf8');

// Build map of UDC blocks: qualifiedName → block text
const blocks = new Map();
const startRe = /\/\/\/\s*start\s*-\s*([\w.]+)/g;
let m;
while ((m = startRe.exec(c)) !== null) {
  const name = m[1];
  const start = m.index;
  const endTag = `/// end - ${name}`;
  const end = c.indexOf(endTag, start);
  blocks.set(name, c.slice(start, end > 0 ? end + endTag.length : start + 60000));
}

console.log('Total UDC blocks:', blocks.size);

const registry = {};

for (const [qualName, block] of blocks) {
  const shortName = qualName.split('.').pop();

  // Description
  const descMatch = /\[설명\]\s*(.+)/.exec(block);
  const description = descMatch ? descMatch[1].trim() : '';

  // Label-related exports (init*Label, set*Label, initLabel, setLabel)
  const labelFns = [];
  const exportRe = /exports\.((?:init|set)[A-Za-z]*(?:[Ll]abel|[Tt]ext)[A-Za-z]*)\s*=/g;
  let em;
  while ((em = exportRe.exec(block)) !== null) {
    const fn = em[1];
    // Skip tooltip, button-related, alignment, filter etc.
    if (/tooltip|button|title(?:bar)?|columns?|align|filter|popup/i.test(fn)) continue;
    labelFns.push(fn);
  }

  if (labelFns.length === 0) continue; // UDC has no label functions

  // Default label values:
  // Method 1: Output controls inside UDC body (T_* outputs with .value)
  const defaultLabels = {};

  // Find Output controls with their default .value inside UDC
  const outputRe = /new cpr\.controls\.Output\("(T_[^"]+)"\)[\s\S]{0,200}?\.value\s*=\s*"([^"]+)"/g;
  while ((em = outputRe.exec(block)) !== null) {
    defaultLabels[em[1]] = em[2]; // e.g. T_S_YR → "년도"
  }

  // Method 2: setAppProperty for label keys
  const propRe = /setAppProperty\s*\(\s*"(\w*[Ll]abel\w*)"\s*,\s*"([^"]+)"\s*\)/g;
  while ((em = propRe.exec(block)) !== null) {
    if (!defaultLabels[em[1]]) defaultLabels[em[1]] = em[2];
  }

  // Method 3: For init*Label functions - look for default arg pattern
  // e.g.: function initYrLabel(yrLabel) { if(!yrLabel) yrLabel = "년도"; ...
  for (const fn of labelFns) {
    if (!fn.startsWith('init')) continue;
    const fnIdx = block.indexOf(`function ${fn}(`);
    if (fnIdx < 0) continue;
    const fnBody = block.slice(fnIdx, fnIdx + 400);
    // Pattern: if(!yrLabel) yrLabel = "value"; or default = "value"
    const dflt = /if\s*\(!\s*\w+\s*\)\s*\w+\s*=\s*"([^"]+)"/.exec(fnBody)
      || /=\s*"([^"]+)"\s*;/.exec(fnBody.slice(fnBody.indexOf(')') + 1, fnBody.indexOf(')') + 100));
    if (dflt) defaultLabels[fn] = dflt[1];
  }

  registry[shortName] = {
    qualifiedName: qualName,
    description,
    labelFns,
    defaultLabels,
  };
}

console.log('UDCs with label fns:', Object.keys(registry).length);

// Show UcoYrSmstrCombo details as sanity check
if (registry['UcoYrSmstrCombo']) {
  console.log('\nUcoYrSmstrCombo:');
  console.log(JSON.stringify(registry['UcoYrSmstrCombo'], null, 2));
}

// Generate TypeScript source
const lines = [
  '// AUTO-GENERATED — do not edit manually.',
  '// Generated from: cpr-lib/udc.js',
  '// Run: node scripts/buildUdcRegistry.cjs',
  '',
  '/** UDC 라벨 함수 및 기본값 정보 */\nexport interface UdcInfo {',
  '  /** UDC 전체 식별자 (udc.univ.UcoYrSmstrCombo 등) */',
  '  qualifiedName: string;',
  '  /** UDC 설명 */',
  '  description: string;',
  '  /** 라벨을 설정하는 함수명 목록 (init*Label, set*Label 등) */',
  '  labelFns: string[];',
  '  /** Output 컨트롤 ID 또는 appProperty 키 → 기본 라벨 텍스트 */',
  '  defaultLabels: Record<string, string>;',
  '}',
  '',
  '/** UDC 단축명 → UdcInfo 맵 */',
  'export const UDC_REGISTRY: Record<string, UdcInfo> = {',
];

for (const [shortName, info] of Object.entries(registry)) {
  lines.push(`  '${shortName}': ${JSON.stringify(info)},`);
}

lines.push('};');
lines.push('');

fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');
console.log('\nGenerated:', OUTPUT_FILE);

