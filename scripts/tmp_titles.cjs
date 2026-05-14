'use strict';
const fs = require('fs');
const c = fs.readFileSync('D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/csm_1020101_p02.clx.js', 'utf8');
const re = /\.title\s*=\s*"([^"]+)"/g;
let m;
while ((m = re.exec(c)) !== null) {
  console.log(m[1]);
}
