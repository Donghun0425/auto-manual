const fs = require('fs');
const c = fs.readFileSync('D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/univ/screg/usc05/usc_3010504_v.clx.js','utf8');
const idx = c.indexOf('new cpr.controls.Container("S_GRDN_AVG_GROUP")');
if(idx>=0) console.log(c.slice(idx, idx+800));
const idx2 = c.indexOf('new cpr.controls.Container("S_FLCTN_YMD_GROUP")');
if(idx2>=0) console.log('\n---FLCTN---\n'+c.slice(idx2, idx2+400));
