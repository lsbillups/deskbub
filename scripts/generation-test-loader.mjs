import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), ts = require('typescript');
export function loader(overrides = {}) {
  const cache = new Map();
  function load(file) {
    const resolved = path.resolve(file);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    if (resolved.endsWith('.json')) return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    const module = { exports: {} }; cache.set(resolved, module);
    const localRequire = id => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id.startsWith('@/')) return load(id.slice(2) + '.ts');
      if (id.startsWith('.')) { let p = path.resolve(path.dirname(resolved), id); if (!path.extname(p)) p += '.ts'; return load(p); }
      return require(id);
    };
    const js = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, resolveJsonModule: true,
    } }).outputText;
    vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename: resolved })(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}
