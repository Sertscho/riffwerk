const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('manifest.webmanifest ist gültiges JSON mit Name Riffwerk', () => {
  const file = path.join(__dirname, '..', 'manifest.webmanifest');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(manifest.name, 'Riffwerk');
});
