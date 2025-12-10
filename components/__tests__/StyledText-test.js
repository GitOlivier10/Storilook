const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const vm = require('vm');

const React = require('react');
const ts = require('typescript');

const reactNativeStub = {
  Text: ({ children, style }) => React.createElement('Text', { style }, children),
};

function createMockedRequire(filename) {
  return (moduleName) => {
    if (moduleName === 'react-native') {
      return reactNativeStub;
    }

    return require(moduleName);
  };
}

function loadTsModule(relativePath) {
  const filename = path.join(__dirname, relativePath);
  const source = require('fs').readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
    fileName: filename,
  });

  const module = { exports: {} };
  const mockedRequire = createMockedRequire(filename);
  const context = {
    module,
    exports: module.exports,
    require: mockedRequire,
    React,
    __dirname: path.dirname(filename),
    __filename: filename,
  };

  vm.runInNewContext(transpiled.outputText, context);
  return context.module.exports;
}

const { MonoText } = loadTsModule('../StyledText.tsx');

test('renders with monospace font and provided content', () => {
  const element = MonoText({ style: { color: 'red' }, children: 'Snapshot test!' });

  assert.ok(element, 'component should return an element');
  assert.strictEqual(element.type, reactNativeStub.Text);
  assert.deepStrictEqual(element.props.children, 'Snapshot test!');
  const normalizedStyle = JSON.parse(JSON.stringify(element.props.style));
  assert.deepStrictEqual(normalizedStyle, [{ color: 'red' }, { fontFamily: 'SpaceMono' }]);
});
