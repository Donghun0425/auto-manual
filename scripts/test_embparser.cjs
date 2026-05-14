const fs = require('fs');
const c = fs.readFileSync('D:/exbuilder/clx-build/univ/screg/usc05/usc_3010503_v.clx.js', 'utf8');
const seen = new Set();
const results = [];
const p = /new\s+cpr\.controls\.EmbeddedApp\s*\(\s*"([^"]+)"\s*\)/g;
let m;
while ((m = p.exec(c)) !== null) {
  const embId = m[1];
  if (seen.has(embId)) continue;
  const before = c.slice(Math.max(0, m.index - 800), m.index);
  const textRe = /(?:tabItem_\d+|tabItem)\.text\s*=\s*"([^"]+)"/g;
  let lastText = undefined;
  let tm;
  while ((tm = textRe.exec(before)) !== null) lastText = tm[1];
  if (lastText) {
    seen.add(embId);
    results.push(embId + ' -> ' + lastText);
  }
}
console.log('총', results.length, '개');
results.forEach(r => console.log(' ', r));
