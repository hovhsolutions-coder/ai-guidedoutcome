const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..', '..');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const mappedRequest = path.join(projectRoot, request.slice(2));
    return originalResolveFilename.call(this, mappedRequest, parent, isMain, options);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

function registerTypeScriptExtension(extension) {
  require.extensions[extension] = function compileTypeScript(module, filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filename,
    });

    module._compile(transpiled.outputText, filename);
  };
}

registerTypeScriptExtension('.ts');
registerTypeScriptExtension('.tsx');
