import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const sourcePath = path.join(__dirname, '..', 'manifestUtils.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.CommonJS,
  },
});

// eslint-disable-next-line no-new-func
const moduleFactory = new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText);
const moduleRef = { exports: {} };
moduleFactory(moduleRef.exports, require, moduleRef, __filename, __dirname);
const { canonicalManifestString } = moduleRef.exports;

test('canonicalManifestString normalises ordering and defaults', () => {
  const manifest = {
    sessionId: 'SL-ABC123',
    eventName: 'Test',
    createdAt: '2024-01-01T00:00:00.000Z',
    entries: [
      {
        id: 'b',
        fileName: 'b.jpg',
        fileUri: 'file:///b.jpg',
        captureTimestamp: '2024-01-02T00:00:00.000Z',
        checksum: 'x',
        status: 'local',
      },
      {
        id: 'a',
        fileName: 'a.jpg',
        fileUri: 'file:///a.jpg',
        captureTimestamp: '2024-01-01T00:00:00.000Z',
        checksum: 'y',
        status: 'synced',
        comment: 'Hello',
      },
    ],
  };

  const result = JSON.parse(canonicalManifestString(manifest));
  assert.deepStrictEqual(result.entries.map((entry) => entry.id), ['a', 'b']);
  assert.equal(result.entries[1].comment, '');
  assert.deepStrictEqual(result.entries[1].tags, []);
});
