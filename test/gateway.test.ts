import test from 'node:test';
import assert from 'node:assert/strict';
import { Gateway, MemoryJobStore, DailyLimitError, imageEditProvider } from '../src/index.ts';

const ok = (name: string, cost = 0.04) => ({ name, model: 'm', run: async () => ({ output: { ok: name }, costUsd: cost }) });
const bad = { name: 'bad', model: 'm', run: async () => { throw new Error('boom'); } };

test('runs primary and logs the job', async () => {
  const store = new MemoryJobStore();
  const g = new Gateway({ store });
  g.register('draft', ok('a'));
  const r = await g.run('draft', { prompt: 'x' }, { userId: 'u1' });
  assert.equal(r.provider, 'a');
  assert.equal(store.jobs[0].status, 'done');
});

test('falls back when primary fails', async () => {
  const store = new MemoryJobStore();
  const g = new Gateway({ store });
  g.register('draft', bad, ok('b'));
  const r = await g.run('draft', {}, { userId: 'u1' });
  assert.equal(r.provider, 'b');
  assert.deepEqual(store.jobs.map((j) => j.status), ['failed', 'done']);
});

test('stops at the daily limit', async () => {
  const g = new Gateway({ dailyLimitUsd: 0.05 });
  g.register('draft', ok('a', 0.05));
  await g.run('draft', {}, { userId: 'u1' });
  await assert.rejects(g.run('draft', {}, { userId: 'u1' }), DailyLimitError);
});

test('unknown task is an error', async () => {
  await assert.rejects(new Gateway().run('nope', {}, { userId: 'u' }), /No model configured/);
});

test('image edit provider with fake API and storage', async () => {
  const saved: Record<string, Uint8Array> = {};
  const storage = { read: async () => new Blob([new Uint8Array([1])]), write: async (p: string, b: Uint8Array) => { saved[p] = b; } };
  const fakeFetch = (async () => new Response(JSON.stringify({ data: [{ b64_json: btoa('png') }] }))) as typeof fetch;
  const p = imageEditProvider({ apiKey: 'test', storage, fetchImpl: fakeFetch, outPath: () => 'out/1.png' });
  const r = await p.run({ sourcePath: 'src/a.png', prompt: 'make it warm' });
  assert.equal(r.output.path, 'out/1.png');
  assert.equal(r.output.pricePending, true);
  assert.equal(new TextDecoder().decode(saved['out/1.png']), 'png');
});
