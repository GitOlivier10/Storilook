import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { test } from 'node:test';

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

const buildModule = (fileSystemMock) => {
  const compiled = transpileModule(manifestSource, sourcePath);
  // eslint-disable-next-line no-new-func
  const moduleFactory = new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText);
  const moduleRef = { exports: {} };
  moduleFactory(
    moduleRef.exports,
    (specifier) => {
      if (specifier === 'expo-file-system') {
        return fileSystemMock;
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
  return moduleRef.exports;
};

test('ensureStoragePermission resolves when permission API is absent', async () => {
  const mockFs = {
    documentDirectory: '/tmp/',
    cacheDirectory: '/tmp/',
  };
  const { ensureStoragePermission } = buildModule(mockFs);

  await assert.doesNotReject(() => ensureStoragePermission());
});

test('ensureStoragePermission throws when explicit denial persists', async () => {
  const mockFs = {
    documentDirectory: '/tmp/',
    cacheDirectory: '/tmp/',
    getPermissionsAsync: async () => ({ granted: false, status: 'denied' }),
    requestPermissionsAsync: async () => ({ granted: false, status: 'denied' }),
    PermissionStatus: { GRANTED: 'granted' },
  };
  const { ensureStoragePermission } = buildModule(mockFs);

  await assert.rejects(() => ensureStoragePermission(), /Permission de stockage refusée/);
});

test('ensureStoragePermission ignores unsupported permission implementations', async () => {
  const mockFs = {
    documentDirectory: '/tmp/',
    cacheDirectory: '/tmp/',
    getPermissionsAsync: async () => {
      throw new TypeError('not available');
    },
    requestPermissionsAsync: async () => {
      throw new TypeError('not available');
    },
  };

  const { ensureStoragePermission } = buildModule(mockFs);

  await assert.doesNotReject(() => ensureStoragePermission());
});
