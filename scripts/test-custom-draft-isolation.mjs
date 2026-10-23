import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), ts = require('typescript');

// Exercise the real draft module with an asynchronous IndexedDB transaction adapter.
const records = new Map();
globalThis.indexedDB = { open() {
  const request = {};
  queueMicrotask(() => {
    request.result = { close() {}, transaction() {
      const transaction = { objectStore: () => store };
      let pending = 0;
      function operation(fn) {
        pending++;
        const op = {};
        queueMicrotask(() => {
          op.result = fn(); op.onsuccess?.(); pending--;
          queueMicrotask(() => { if (!pending) transaction.oncomplete?.(); });
        });
        return op;
      }
      const store = {
        get: key => operation(() => records.get(key)),
        put: (value, key) => operation(() => { records.set(key, value); return key; }),
        delete: key => operation(() => records.delete(key)),
      };
      return transaction;
    } };
    request.onsuccess();
  });
  return request;
} };
const module = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('lib/custom-draft.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInThisContext(`(function(module,exports){${code}\n})`)(module, module.exports);
const { saveCustomDraft, loadCustomDraft, clearCustomDraft } = module.exports;
const make = (ownerId, count = 1, savedAt = Date.now()) => ({
  ownerId, plan: count === 1 ? 'basic' : 'plus', savedAt,
  files: Array.from({ length: count }, (_, i) => new File(['fixture'], `${ownerId}-${i}.png`, { type: 'image/png' })),
});

await saveCustomDraft(make('plus-user', 5));
assert.equal(await loadCustomDraft('basic-user'), null, 'Basic cannot see Plus photos');
await saveCustomDraft(make('basic-user'));
assert.equal((await loadCustomDraft('plus-user'))?.files.length, 5,
  'Switching Plus -> Basic, selecting one photo, then returning must restore all five Plus photos');
assert.equal((await loadCustomDraft('basic-user'))?.files.length, 1);
await clearCustomDraft('basic-user');
assert.equal(await loadCustomDraft('basic-user'), null);
assert.equal((await loadCustomDraft('plus-user'))?.files.length, 5, 'Clearing Basic cannot delete Plus');
assert.equal(await loadCustomDraft(), null, 'Signed-out visitor cannot see account drafts');

records.clear();
records.set('custom-photo', make('plus-user', 5));
assert.equal(await loadCustomDraft('basic-user'), null, 'Mismatched legacy draft remains private');
await clearCustomDraft('basic-user');
assert.equal((await loadCustomDraft('plus-user'))?.files.length, 5, 'Legacy draft survives another account clearing');
await saveCustomDraft(make('basic-user'));
assert.equal((await loadCustomDraft('plus-user'))?.files.length, 5, 'Migrated draft survives later saves');

records.clear();
await saveCustomDraft(make(null, 2));
assert.equal((await loadCustomDraft('plus-user'))?.ownerId, 'plus-user', 'Login adopts the guest draft');
assert.equal(await loadCustomDraft('basic-user'), null, 'A claimed guest draft cannot be adopted twice');
assert.equal(await loadCustomDraft(), null);

records.clear();
records.set('custom-photo', make(null, 2));
assert.equal((await loadCustomDraft('plus-user'))?.files.length, 2, 'Legacy guest login remains supported');
assert.equal(await loadCustomDraft('basic-user'), null);
await saveCustomDraft(make('basic-user', 1, Date.now() - 25 * 60 * 60 * 1000));
assert.equal(await loadCustomDraft('basic-user'), null, 'Expired drafts are discarded');
assert.equal((await loadCustomDraft('plus-user'))?.files.length, 2, 'Expiry only affects its owner');
console.log(JSON.stringify({ accountSwitchPreservesBothDrafts: true, scopedDelete: true,
  legacyMigration: true, guestClaimOnce: true, scopedExpiry: true, uploads: 0, modelCalls: 0 }));
