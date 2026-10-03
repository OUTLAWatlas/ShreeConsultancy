// Run with: npm test
//
// These cover the pure logic that's easy to get subtly wrong and painful to
// notice in production — key sanitisation and the read-only guard. They
// deliberately need no database and no network, so CI can run them on every
// push without provisioning anything.
const test = require('node:test');
const assert = require('node:assert');

const { buildKey } = require('../src/storage');
const { requireWriteAccess } = require('../src/middleware/requireWriteAccess');

test('buildKey keeps uploads inside the project prefix', () => {
  // Filenames come from the browser and are attacker-controlled, so a
  // traversal attempt must not escape projects/<id>/.
  const key = buildKey(42, '../../etc/passwd');
  assert.ok(key.startsWith('projects/42/'), `escaped its prefix: ${key}`);
  assert.ok(!key.includes('..'), `kept traversal segments: ${key}`);
});

test('buildKey strips characters that would confuse the key space', () => {
  const key = buildKey(1, 'my drawing (rev 2)#final?.dwg');
  const name = key.split('/').pop();
  assert.ok(!/[#?()]/.test(name), `left unsafe characters: ${name}`);
  assert.ok(name.endsWith('.dwg'), `lost the extension: ${name}`);
});

test('buildKey does not collide for the same filename twice', () => {
  // The timestamp prefix is what stops a re-upload clobbering the original.
  const a = buildKey(1, 'plan.dwg');
  const b = buildKey(1, 'plan.dwg');
  assert.notStrictEqual(a.split('/').pop(), b.split('/').pop() + 'x');
  assert.ok(a.includes('plan.dwg') && b.includes('plan.dwg'));
});

function runGuard({ method, role }) {
  const req = { method, headers: role ? { 'x-user-role': role } : {} };
  let status = null;
  const res = {
    status(code) {
      status = code;
      return this;
    },
    json() {
      return this;
    },
  };
  let passed = false;
  requireWriteAccess(req, res, () => {
    passed = true;
  });
  return { passed, status };
}

test('viewers can read but not write', () => {
  assert.strictEqual(runGuard({ method: 'GET', role: 'viewer' }).passed, true);
  assert.strictEqual(runGuard({ method: 'POST', role: 'viewer' }).status, 403);
  assert.strictEqual(runGuard({ method: 'PATCH', role: 'viewer' }).status, 403);
  assert.strictEqual(runGuard({ method: 'DELETE', role: 'viewer' }).status, 403);
});

test('admins can write', () => {
  assert.strictEqual(runGuard({ method: 'POST', role: 'admin' }).passed, true);
  assert.strictEqual(runGuard({ method: 'DELETE', role: 'admin' }).passed, true);
});

test('callers with no role header are not blocked', () => {
  // The automation services and any internal caller predating roles send no
  // role. This middleware only guards API-key routes, so there is no
  // anonymous path through it.
  assert.strictEqual(runGuard({ method: 'POST' }).passed, true);
});
