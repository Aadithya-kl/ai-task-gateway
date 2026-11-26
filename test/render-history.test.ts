import test from 'node:test';
import assert from 'node:assert/strict';
import { nextRenderName, ownsPath, buildRenderMeta } from '../src/render-history.ts';

test('first render is v1', () => {
  assert.equal(nextRenderName('0123456789abcdef01234567-lobby.png', []), 'lobby render v1');
});
test('numbering continues and never reuses', () => {
  assert.equal(nextRenderName('lobby.png', ['lobby render v1', 'lobby render v3', 'other render v9']), 'lobby render v4');
});
test('special characters in file name are safe', () => {
  assert.equal(nextRenderName('a.b(1).png', ['a.b(1) render v2']), 'a.b(1) render v3');
});
test('ownsPath allows own folder only', () => {
  assert.equal(ownsPath('quick/u1/x.png', 'u1', 'quick'), true);
  assert.equal(ownsPath('quick/u2/x.png', 'u1', 'quick'), false);
  assert.equal(ownsPath('quick/u1/../u2/x.png', 'u1', 'quick'), false);
  assert.equal(ownsPath('renders/u1/1.png', 'u1', 'quick'), false);
});
test('meta marks price pending and design concept', () => {
  const m = buildRenderMeta({ prompt: 'x', settings: {}, jobId: 'j', pricePending: true, references: [] });
  assert.equal(m.cost_label, 'price pending');
  assert.equal(m.design_concept, true);
});
