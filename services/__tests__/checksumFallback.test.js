import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const sourcePath = path.join(__dirname, '..', 'manifest.ts');
const manifestSource = fs.readFileSync(sourcePath, 'utf8');

const transpileModule = (source, fileName) =>
  ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2019,
      module: ts.ModuleKind.CommonJS,
    },
    fileName,
  });

const compiled = transpileModule(manifestSource, sourcePath);

// eslint-disable-next-line no-new-func
const moduleFactory = new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText);
const moduleRef = { exports: {} };

moduleFactory(
  moduleRef.exports,
  (specifier) => {
    if (specifier === 'expo-file-system') {
      // Minimal mock to satisfy the import without touching the real FS
      return {
        cacheDirectory: '/tmp/',
        documentDirectory: '/tmp/',
      };
    }
    if (specifier === './manifestUtils') {
      const utilsPath = path.join(__dirname, '..', 'manifestUtils.ts');
      const utilsSource = fs.readFileSync(utilsPath, 'utf8');
      const utilsCompiled = transpileModule(utilsSource, utilsPath);
      // eslint-disable-next-line no-new-func
      const utilsFactory = new Function('exports', 'require', 'module', '__filename', '__dirname', utilsCompiled.outputText);
      const utilsRef = { exports: {} };
      utilsFactory(utilsRef.exports, require, utilsRef, utilsPath, path.dirname(utilsPath));
      return utilsRef.exports;
    }
    return require(specifier);
  },
  moduleRef,
  __filename,
  __dirname,
);

const { fallbackChecksum } = moduleRef.exports;

test('fallbackChecksum is deterministic for identical payloads', () => {
  const a = fallbackChecksum('payload:alpha');
  const b = fallbackChecksum('payload:alpha');
  assert.equal(a, b);
});

test('fallbackChecksum differentiates distinct payloads', () => {
  const a = fallbackChecksum('payload:alpha');
  const b = fallbackChecksum('payload:beta');
  assert.notEqual(a, b);
});
