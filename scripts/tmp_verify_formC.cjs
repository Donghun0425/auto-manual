const fs = require('fs');
const c = fs.readFileSync('D:/exbuilder/clx-build/univ/screg/usc05/usc_3010501_t11.clx.js', 'utf8');

// Simulate new tbVarRe with barId capture
const tbVarRe = /var\s+(\w+)\s*=\s*(?:\w+\.\w+\s*=\s*)?new\s+udc\.common\.PatisTitleBar\s*\(\s*(?:"([^"]+)")?/g;
let m;
while ((m = tbVarRe.exec(c)) !== null) {
  const varName = m[1], barId = m[2] || null;
  const titleM = new RegExp(varName + '\\.title\\s*=\\s*"([^"]+)"').exec(c);
  const title = titleM ? titleM[1] : '(no title)';

  // Form C: app.lookup("barId").initAddButton(firstArg, "btnId", "label", ...)
  const formCBtns = [];
  if (barId) {
    const escaped = barId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const reC = new RegExp('app\\.lookup\\s*\\("' + escaped + '"\\)\\.initAddButton\\s*\\([^,]+,\\s*"(\\d+)"\\s*,\\s*"([^"]+)"', 'g');
    let bm;
    while ((bm = reC.exec(c)) !== null) formCBtns.push({ idx: parseInt(bm[1]), name: bm[2] });
  }
  console.log('varName:', varName, '| barId:', barId, '| title:', title, '| formC:', formCBtns.length, formCBtns.map(b => b.name).join(', '));
}
