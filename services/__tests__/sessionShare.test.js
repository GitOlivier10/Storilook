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

const sourcePath = path.join(__dirname, '..', 'sessionShare.ts');
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
const { buildSessionSharePayload, serializeSessionSharePayload } = moduleRef.exports;

test('buildSessionSharePayload keeps deterministic ordering and optional checksum', () => {
  const manifest = {
    sessionId: 'SL-TEST',
    eventName: 'Soirée',
    createdAt: '2024-05-01T10:00:00.000Z',
  };

  const payload = buildSessionSharePayload(manifest, 'abc123');
  assert.deepStrictEqual(payload, {
    version: 1,
    sessionId: 'SL-TEST',
    eventName: 'Soirée',
    createdAt: '2024-05-01T10:00:00.000Z',
    manifestChecksum: 'abc123',
  });
});

test('serializeSessionSharePayload stringifies payload with stable field order', () => {
  const manifest = {
    sessionId: 'SL-XYZ',
    eventName: 'Concert',
    createdAt: '2024-06-01T12:00:00.000Z',
  };

  const serialized = serializeSessionSharePayload(manifest);
  assert.equal(
    serialized,
    '{"version":1,"sessionId":"SL-XYZ","eventName":"Concert","createdAt":"2024-06-01T12:00:00.000Z"}',
  );
});
