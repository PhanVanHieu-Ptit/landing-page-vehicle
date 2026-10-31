import assert from 'node:assert/strict';
import test from 'node:test';
import { clampProgress, mapGaugeValue, parseSpecification } from './PerformanceChapter.gauge.ts';

test('gauge maps endpoints, midpoint, and an offset domain', () => {
  assert.equal(mapGaugeValue(0), -120);
  assert.equal(mapGaugeValue(.5), 0);
  assert.equal(mapGaugeValue(1), 120);
  assert.equal(mapGaugeValue(150, 100, 200), 0);
});
test('gauge clamps seeks and handles invalid input deterministically', () => {
  for (const value of [-1, NaN, Infinity, -Infinity]) assert.equal(mapGaugeValue(value), -120);
  assert.equal(mapGaugeValue(2), 120);
  assert.deepEqual([1, .5, 0].map(value => mapGaugeValue(value)), [120, 0, -120]);
  for (const bounds of [[0, 0], [2, 1], [0, Infinity], [NaN, 1]]) {
    assert.throws(() => mapGaugeValue(0, ...bounds), RangeError);
  }
  assert.equal(clampProgress(NaN), 0);
});
test('numeric specs preserve configured precision and units without interpreting ranges', () => {
  assert.deepEqual(parseSpecification('3.20 s'), { value: 3.2, decimals: 2, unit: 's' });
  for (const value of ['—', 'Pending', '0–100 km/h', '1,200 hp', 'up to 300']) {
    assert.equal(parseSpecification(value), null);
  }
});
