import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url), ts = require('typescript');
const source = fs.readFileSync('components/share/ShareBasic.tsx', 'utf8');
const js = ts.transpileModule(source + '\nexport { SharePanel };', {compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
}}).outputText;
const pending = {claim: {status: 'pending'}, eligible: true, enabled: true, staging: true, admin: false};
const slots = []; let cursor = 0, request, calls = 0;
const hooks = {
  useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = index === 0 ? pending : initial;
    return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
  useRef(value) { const index = cursor++; return slots[index] ??= {current: value}; },
  useCallback: fn => fn, useEffect() {}, useSyncExternalStore: () => '',
};
const module = {exports: {}};
const context = vm.createContext({module, exports: module.exports, console, AbortSignal,
  require(id) {
    if (id === 'react') return {...require('react'), ...hooks};
    if (id === '@clerk/nextjs') return {};
    if (id === 'next/link') return {__esModule: true, default: 'a'};
    if (id === '@/components/share/SharePostComposer') return {__esModule: true, default: 'composer'};
    if (id.endsWith('.module.css')) return {__esModule: true, default: new Proxy({}, {get: (_, key) => key})};
    return require(id);
  },
  fetch(url, options) {
    calls++; assert.equal(url, '/api/share-claims'); assert.equal(options.cache, 'no-store');
    return new Promise((resolve, reject) => { request = {resolve, reject, options}; });
  },
});
vm.runInContext(js, context);
const render = () => { cursor = 0; return module.exports.SharePanel({enabled: true, staging: true, userId: 'fixture', authLoaded: true}); };
function nodes(node) { return Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : []; }
function text(node) { return Array.isArray(node) ? node.map(text).join(' ') : node?.props ? text(node.props.children) : typeof node === 'string' ? node : ''; }
const button = tree => nodes(tree).find(node => node.type === 'button' && /Check status|Checking/.test(text(node)));
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const response = data => ({ok: true, json: async () => data});
let tree = render(), action = button(tree);
assert.ok(action, 'Pending application must offer status refresh');
action.props.onClick();
tree = render();
assert.match(text(button(tree)), /Checking/, 'Click must immediately show loading feedback');
assert.equal(button(tree).props.disabled, true, 'Loading refresh must be disabled');
action.props.onClick();
assert.equal(calls, 1, 'Rapid repeated clicks must not issue parallel requests');
assert.ok(request.options.signal, 'Status request must have a timeout signal');
request.resolve(response(pending)); await flush(); tree = render();
assert.equal(button(tree).props.disabled, false);
assert.ok(nodes(tree).some(node => node.props.role === 'status' && /still waiting for review/i.test(text(node))), 'Unchanged pending status must acknowledge the check');
button(tree).props.onClick();
request.reject(new Error('Connection unavailable')); await flush(); tree = render();
assert.ok(nodes(tree).some(node => node.props.role === 'alert' && /Connection unavailable/.test(text(node))), 'Failed refresh must show an error');
assert.equal(button(tree).props.disabled, false, 'Failed refresh must remain retryable');
button(tree).props.onClick();
assert.equal(nodes(render()).some(node => node.props.role === 'alert'), false, 'Retry clears stale error');
request.reject(Object.assign(new Error('Slow request'), {name: 'TimeoutError'})); await flush(); tree = render();
assert.ok(nodes(tree).some(node => node.props.role === 'alert' && /timed out/.test(text(node))), 'Slow status check must show a clear timeout');
assert.equal(button(tree).props.disabled, false, 'Timeout must release the refresh button');
button(tree).props.onClick();
request.resolve(response({...pending, claim: {status: 'approved'}, eligible: false})); await flush(); tree = render();
assert.match(text(tree), /Your reward was approved/);
assert.match(text(tree), /One Basic generation was added/);
assert.equal(button(tree), undefined, 'Approved claim replaces pending controls');
console.log(JSON.stringify({passed: true, actualComponentHandlers: true, loadingFeedback: true, pendingAcknowledgement: true, duplicateReadSuppression: true, retryAfterError: true, approvedTransition: true, externalPosts: 0, paidCalls: 0}));
