'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {targetPath, diameterRatio, validateRankedV2} = require('./ranked_v2');

test('server-side target stream has stable cross-language fixture', () => {
  const path = targetPath(123456);
  const a = path.advance(), b = path.advance();
  assert.ok(Math.abs(a.x - .67960112368688) < 1e-12);
  assert.ok(Math.abs(a.y - .1445808028941974) < 1e-12);
  assert.ok(Math.abs(b.x - .18235831955913456) < 1e-12);
  assert.ok(Math.abs(b.y - .6610491619398817) < 1e-12);
});

test('rate-driven diameter reaches a quarter of 44%', () => {
  assert.equal(diameterRatio(0), .44);
  assert.ok(Math.abs(diameterRatio(20) - .11) < 1e-9);
  assert.ok(diameterRatio(6) < diameterRatio(3));
});

test('verifier accepts true hits at new position on hit 101 and 201', () => {
  const seed = 123456, width = 400, height = 640;
  const path = targetPath(seed);
  let recent = [];
  const taps = [];
  for (let i = 0; i < 220; i++) {
    const ms = i * 115;
    recent = recent.filter((t) => ms - t < 1200);
    const diameter = Math.min(width * diameterRatio(recent.length), height * .9);
    const position = path.position;
    const centerX = (width - diameter) * position.x + diameter / 2;
    const centerY = (height - diameter) * position.y + diameter / 2;
    taps.push({ms, x: centerX / width, y: centerY / height});
    recent.push(ms);
    if ((i + 1) % 100 === 0) {
      path.advance();
      recent = [];
    }
  }
  assert.equal(validateRankedV2(taps, seed, width, height), true);
  const forged = taps.map(t => ({...t}));
  forged[100] = {...forged[100], x: .5, y: .5};
  assert.equal(validateRankedV2(forged, seed, width, height), false);
  assert.equal(validateRankedV2(taps, seed + 1, width, height), false);
  assert.equal(validateRankedV2(taps, seed, 0, 0), false);
});
