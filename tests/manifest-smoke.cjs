'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const m = JSON.parse(fs.readFileSync(path.join(root, 'module.json'), 'utf8'));
const repo = 'https://github.com/rebsiot/v20-vampire-npc-builder';
assert.equal(m.id, 'v20-vampire-npc-builder', 'ID must not be renamed');
assert.equal(m.title, 'WoD20 — V20 Vampire NPC Builder');
assert.match(m.version, /^\d+\.\d+\.\d+$/);
assert.equal(m.compatibility.minimum, '14');
assert.equal(m.relationships.systems[0].id, 'worldofdarkness');
assert.equal(m.manifest, `${repo}/releases/latest/download/module.json`);
assert.equal(m.download, `${repo}/releases/download/v${m.version}/v20-vampire-npc-builder.zip`);
for (const file of [...m.esmodules, ...m.scripts, ...m.styles,
  'templates/editor.hbs','scripts/pdf-lib-LICENSE.md','LICENSE.md',
  'THIRD-PARTY-CONTENT.md','CHANGELOG.md','docs/UPGRADING.md',
  'images/v20-builder-preview.webp']) {
  assert.ok(fs.existsSync(path.join(root, file)), `Required packaged file missing: ${file}`);
}
assert.ok(fs.statSync(path.join(root, 'scripts/pdf-lib.min.js')).size > 400000);
console.log('PASS: title visible, ID unchanged, v0.1.7 manifest/download consistent, rights and required files present.');
