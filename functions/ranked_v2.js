'use strict';

// Ranked V2 target geometry. Keep numerical constants in sync with Dart's
// lib/src/ranked_v2.dart. The server validates each client-submitted hit
// against the target BEFORE processing that hit, then shrinks/repositions.
const SPEED_WINDOW_MS = 1200;
const MOVE_EVERY = 100;

function targetPath(seed) {
  let state = (seed >>> 0) || 1;
  let position = {x: .5, y: .5};
  function nextUnit() {
    let x = state;
    x = (x ^ (x << 13)) >>> 0;
    x = (x ^ (x >>> 17)) >>> 0;
    x = (x ^ (x << 5)) >>> 0;
    state = x;
    return x / 4294967296;
  }
  return {
    get position() { return position; },
    advance() {
      for (let i = 0; i < 24; i++) {
        const candidate = {x: .07 + .86 * nextUnit(), y: .07 + .86 * nextUnit()};
        const distance = Math.hypot(candidate.x - position.x, candidate.y - position.y);
        if (distance >= .26 || i === 23) {
          position = candidate;
          break;
        }
      }
      return position;
    },
  };
}

function diameterRatio(hitCountInWindow) {
  const tapsPerSecond = hitCountInWindow * 1000 / SPEED_WINDOW_MS;
  const progress = Math.max(0, Math.min(1, (tapsPerSecond - 2) / 9));
  return .44 * (1 - .75 * progress);
}

function validateRankedV2(taps, seed, fieldWidth, fieldHeight) {
  if (!Number.isInteger(seed) || seed < 1 || seed > 0x7fffffff ||
      !Number.isFinite(fieldWidth) || !Number.isFinite(fieldHeight) ||
      fieldWidth < 180 || fieldWidth > 2200 || fieldHeight < 140 ||
      fieldHeight > 3200 || fieldHeight / fieldWidth < .30 ||
      fieldHeight / fieldWidth > 5) {
    return false;
  }
  const path = targetPath(seed);
  let recentHits = [];
  for (let i = 0; i < taps.length; i++) {
    const tap = taps[i];
    recentHits = recentHits.filter((ms) => tap.ms - ms < SPEED_WINDOW_MS);
    const diameter = Math.min(fieldWidth * diameterRatio(recentHits.length), fieldHeight * .90);
    const position = path.position;
    const centerX = (fieldWidth - diameter) * position.x + diameter / 2;
    const centerY = (fieldHeight - diameter) * position.y + diameter / 2;
    const dx = tap.x * fieldWidth - centerX;
    const dy = tap.y * fieldHeight - centerY;
    // Allow ~2 px device pixel rounding, never an entire off-target tap.
    if (Math.hypot(dx, dy) > diameter / 2 + 2) return false;
    recentHits.push(tap.ms);
    if ((i + 1) % MOVE_EVERY === 0) {
      path.advance();
      recentHits = []; // new positions start with a full-size target
    }
  }
  return true;
}

module.exports = {targetPath, diameterRatio, validateRankedV2};
