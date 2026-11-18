import { describe, expect, it } from 'vitest';

// Every algo-engine module; its exports whose name holds "Pseudocode" are the pseudocode panels.
const engines = /** @type {Record<string, Record<string, unknown>>} */ (
  import.meta.glob(['/src/lib/algo-engine/*.js', '!/src/lib/algo-engine/*.test.js'], {
    eager: true,
  })
);

/**
 * Every string inside a pseudocode export.
 * @param {unknown} value @param {string} path @param {[string, string][]} out
 */
function lines(value, path, out = []) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => lines(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) lines(v, `${path}.${k}`, out);
  }
  return out;
}

/** @type {[string, string][]} */
const pseudocode = Object.entries(engines).flatMap(([file, mod]) =>
  Object.entries(mod)
    .filter(([name]) => /pseudocode/i.test(name))
    .flatMap(([name, value]) => lines(value, `${file.split('/').pop()}:${name}`)),
);

const word = (/** @type {string[]} */ forms) =>
  new RegExp(`(?<![\\p{L}\\p{M}\\d_])(${forms.join('|')})(?![\\p{L}\\p{M}\\d_])`, 'iu');
// Statement words that are English keywords: if/else, return, while, for.
const BANNED_WORD_RE = word(['nếu', 'ngược lại', 'trả về', 'trong khi', 'với mỗi']);
// A statement that starts with "lặp" or "dừng" (repeat … times, loop, break).
const BANNED_START_RE = /(^\s*|[:;,]\s+)(lặp|dừng)(?![\p{L}\p{M}])/u;

/** @param {string} line */
function keywordProblem(line) {
  const code = line.replace(/\/\/.*$/, '');
  return (
    BANNED_WORD_RE.exec(code)?.[0] ??
    BANNED_START_RE.exec(code)?.[2] ??
    (/lần:\s*$/u.test(code) ? 'lần:' : undefined)
  );
}

describe('the pseudocode keyword check', () => {
  it('flags Vietnamese statement words but not comments or fragments', () => {
    expect(keywordProblem('nếu a < b: đổi chỗ')).toBe('nếu');
    expect(keywordProblem('lặp lại V lần:')).toBe('lặp');
    expect(keywordProblem('  if key[u] = ∞: dừng')).toBe('dừng');
    expect(keywordProblem('repeat V times:')).toBeUndefined();
    expect(keywordProblem('if not changed: break    // dừng sớm')).toBeUndefined();
    expect(keywordProblem('if w là từ lặp lại: thêm w')).toBeUndefined();
  });

  it('finds pseudocode to check', () => {
    expect(pseudocode.length).toBeGreaterThan(500);
  });
});

describe('pseudocode', () => {
  it('writes loop, branch and exit words in English', () => {
    const hits = pseudocode
      .map(([path, line]) => [path, line, keywordProblem(line)])
      .filter(([, , hit]) => hit)
      .map(([path, line, hit]) => `${path} [${hit}]: ${line}`);
    expect(hits).toEqual([]);
  });
});
