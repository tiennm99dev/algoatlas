/** @typedef {import('$lib/algo-engine/rsa-cryptography.js').RsaFrame} RsaFrame */
/** @typedef {import('$lib/algo-engine/rsa-cryptography.js').AttackFrame} AttackFrame */

/** @param {number} n */
const big = (n) => n.toLocaleString('en-US');

export const en = {
  slug: 'rsa-cryptography',
  topic: 'number-theory',
  level: 'Intermediate',
  title: 'Public-key cryptography and RSA',
  intro:
    'In public-key cryptography, anyone can lock a message with a key you publish, but only your private key opens it. RSA builds that lock from two facts: fast powers mod n are easy, and pulling n = p·q apart is hard. This lesson runs the whole scheme on small primes, then lets an attacker break the key to show what real key sizes protect against.',
  summary:
    'Generate a toy RSA key from two small primes, encrypt and decrypt a number with modular powers, then factor n as an attacker to see why real keys are huge.',
  instruction:
    'Choose primes p and q, an exponent e and a message M, then step through the key, the encryption and the decryption. M must come back unchanged. Then switch to the attacker: using only the public values, try divisors until n splits, and compare the trial divisions with the table of real key sizes.',
  modeLegend: 'View',
  modes: { owner: 'Owner and sender', attacker: 'Attacker' },
  presetLabel: 'Example',
  presets: {
    classic: 'p = 61, q = 53',
    tiny: 'p = 3, q = 11',
    multiple: 'M is a multiple of p',
    largest: 'Largest toy key',
  },
  fields: { p: 'Prime p', q: 'Prime q', e: 'Exponent e', M: 'Message M' },
  /** @param {number} min @param {number} max */
  primeError: (min, max) => `p and q must be different primes from ${min} to ${max}.`,
  /** @param {number} phi */
  exponentError: (phi) =>
    `e must be more than 1, less than φ = ${big(phi)}, and share no factor with φ.`,
  /** @param {number} n */
  messageError: (n) => `M must be a whole number from 0 to n − 1 = ${big(n - 1)}.`,
  /** @param {number} e */
  exponentChanged: (e) => `These primes do not fit that e, so e changed to ${e}.`,
  /** @param {number} M */
  messageChanged: (M) => `M did not fit below the new n, so it was reduced to ${M}.`,

  publicTitle: 'Public: anyone can see',
  privateTitle: 'Private: only the owner',
  messageTitle: 'The message',
  labels: {
    n: 'n',
    e: 'e',
    p: 'p',
    q: 'q',
    phi: 'φ',
    d: 'd',
    M: 'M',
    c: 'c',
    recovered: 'M′',
  },
  unknown: '?',
  justFound: '← new',
  euclidTitle: 'Extended Euclid: every row keeps r ≡ t·e (mod φ)',
  euclidHead: { q: 'Quotient', r: 'r', t: 't' },
  powerTitle: {
    encrypt: 'Encrypting: the bits of e, read from the right',
    decrypt: 'Decrypting: the bits of d, read from the right',
  },
  /** @param {number} exponent */
  bitsAria: (exponent) => `The exponent ${exponent} in binary.`,
  /** @param {number} weight @param {number} bit @param {string} state */
  bitLabel: (weight, bit, state) =>
    `Bit with weight 2 to the ${weight}: ${bit}${state ? `, ${state}` : ''}`,
  bitStates: { current: 'being read', used: 'multiplied in', skipped: 'skipped', waiting: '' },
  bitMarkers: { current: '▲', used: '✓', skipped: '·', waiting: '' },
  bitPointer: 'read',
  legend: {
    current: '▲ Being read',
    used: '✓ Is 1: multiplied in',
    skipped: '· Is 0: skipped',
  },
  stats: {
    multiplications: 'Modular multiplications',
    check: 'e·d mod φ',
    match: 'M′ = M?',
    size: 'Digits of n',
  },
  matchYes: '✓ yes',
  matchNo: '✗ no',
  matchWaiting: '—',
  checkWaiting: '—',
  /** @param {RsaFrame} f */
  describe(f) {
    const { p, q, e, M, n, phi, d, c, recovered, power } = f;
    switch (f.kind) {
      case 'start':
        return `The owner picks two secret primes, p = ${p} and q = ${q}.`;
      case 'modulus':
        return `n = ${p}·${q} = ${big(/** @type {number} */ (n))}. One multiplication, and n can be made public.`;
      case 'phi':
        return `φ = (${p} − 1)·(${q} − 1) = ${big(/** @type {number} */ (phi))}. It counts the numbers below n that share no factor with n, and it needs p and q.`;
      case 'public':
        return `Choose e = ${e}: it shares no factor with φ, so it has an inverse mod φ.`;
      case 'euclid': {
        const row = f.euclid[f.euclid.length - 1];
        return f.euclid.length === 2
          ? `Run extended Euclid on φ and e. The first rows are r = φ with t = 0, and r = e with t = 1.`
          : `Quotient ${row.q} gives r = ${row.r} and t = ${row.t}.${row.r === 1 ? ' The remainder is 1, so t is the inverse of e.' : ''}`;
      }
      case 'private':
        return `d = ${big(/** @type {number} */ (d))}, the last t reduced mod φ. Check: e·d ≡ 1 (mod φ).`;
      case 'keys':
        return `Publish (n, e) = (${big(/** @type {number} */ (n))}, ${e}). Keep d, and destroy or hide p, q and φ. Key generation is done.`;
      case 'encrypt':
      case 'decrypt': {
        const step = /** @type {NonNullable<RsaFrame['power']>} */ (power);
        const name = f.kind === 'encrypt' ? 'e' : 'd';
        return step.multiplied
          ? `Bit ${step.k} of ${name} is 1: result = ${big(step.before)}·${big(step.x)} mod n = ${big(step.result)}. Then square x.`
          : `Bit ${step.k} of ${name} is 0: keep result = ${big(step.result)}, and square x = ${big(step.x)}.`;
      }
      case 'cipher':
        return `The sender used only the public key: c = ${big(M)}^${e} mod n = ${big(/** @type {number} */ (c))}. This is what travels over the wire.`;
      case 'recovered':
        return `The owner computes c^d mod n = ${big(/** @type {number} */ (recovered))}.`;
      case 'done':
        return `M′ = ${big(/** @type {number} */ (recovered))} equals M = ${big(M)}. Since e·d ≡ 1 (mod φ), raising to e and then to d returns the message.`;
    }
  },

  attackIntro: 'The attacker sees only n, e and c, and has to split n.',
  attackTitle: 'Trial division on n',
  /** @param {AttackFrame} f */
  attackLine: (f) =>
    f.candidate === 0 ? `n = ${big(f.n)}` : `${big(f.n)} mod ${f.candidate} = ${f.remainder}`,
  recovered: { p: 'p', q: 'q', phi: 'φ', d: 'd', M: 'M' },
  attackStats: {
    trials: 'Trial divisions',
    owner: 'Multiplications to make n',
  },
  /** @param {AttackFrame} f */
  describeAttack(f) {
    switch (f.kind) {
      case 'start':
        return `Public: n = ${big(f.n)}, e = ${f.e}, c = ${big(f.c)}. Nothing else. Find a factor of n by trying divisors in order.`;
      case 'try':
        return f.remainder === 0
          ? `${big(f.n)} mod ${f.candidate} = 0. A factor at last!`
          : `${big(f.n)} mod ${f.candidate} = ${f.remainder}, so ${f.candidate} is not a factor.`;
      case 'found':
        return `p = ${f.p} and q = ${big(f.n)}/${f.p} = ${f.q}. This took ${f.trials} trial divisions, against the owner’s single multiplication.`;
      case 'private':
        return `With p and q known, φ = ${big(/** @type {number} */ (f.phi))}, and extended Euclid gives d = ${big(/** @type {number} */ (f.d))}: the private key.`;
      case 'done':
        return `c^d mod n = ${big(/** @type {number} */ (f.M))}. The message is read and the key is broken. This only works because n is tiny.`;
    }
  },
  scaleTitle: 'How trial division scales, at a billion divisions a second',
  scaleHead: { digits: 'Digits of n', trials: 'Trials', time: 'Time' },
  /** @param {number} digits */
  scaleName: (digits) => {
    if (digits === 309) return '309 (RSA-1024)';
    if (digits === 617) return '617 (RSA-2048)';
    return String(digits);
  },
  /** @param {number} digits */
  scaleTrials: (digits) => `≈ 10^${Math.round(digits / 2 - Math.log10(2))}`,
  /** @param {number} digits @param {number} exponent */
  scaleTime: (digits, exponent) => {
    if (exponent >= 0) return `≈ 10^${Math.round(exponent)} years`;
    const seconds = 10 ** (digits / 2 - Math.log10(2) - 9);
    return seconds < 1 ? 'under a second' : `≈ ${Math.round(seconds)} seconds`;
  },
  scaleNote:
    'Attackers have much better methods than trial division. The general number field sieve factored the 250-digit RSA-250 in 2020, using about 2,700 core-years. RSA-2048 remains far out of reach for it, though a large enough quantum computer running Shor’s algorithm would break RSA.',

  takeaways: [
    'Key generation: pick primes p and q, set n = p·q and φ = (p − 1)(q − 1), choose e coprime to φ, and compute d = e⁻¹ mod φ with extended Euclid. Publish (n, e) and keep d.',
    'Encrypt with c = M^e mod n and decrypt with M = c^d mod n. Fast exponentiation does each in O(log e) or O(log d) multiplications, even for huge numbers.',
    'It works because e·d = 1 + t·φ, and Euler’s theorem gives M^φ ≡ 1 (mod n) when M shares no factor with n. The Chinese remainder theorem covers the other messages too.',
    'Security rests on the gap: multiplying p and q is one step, but all known classical ways of finding them from a big n are far too slow. Whoever factors n can compute φ and d. Real RSA also adds random padding (OAEP), because without it equal messages give equal ciphertexts.',
    'Try the “Largest toy key”, then switch to the attacker: count the trial divisions, and read how the table grows by a factor of ten for every two digits of n.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    ['Build n and φ', 'O(1) multiplications', 'One product each, whatever the size of the primes.'],
    [
      'Compute d',
      'O(log φ)',
      'Extended Euclid shrinks the remainder at least by half every two divisions.',
    ],
    [
      'Encrypt or decrypt',
      'O(log e) or O(log d) multiplications',
      'Repeated squaring takes one or two multiplications per exponent bit, and every number stays below n.',
    ],
    [
      'Factor n by trial division',
      'O(√n), about 10^(D/2) for D digits',
      'Polynomial in n but exponential in its length, which is what the key size measures.',
    ],
    [
      'Memory',
      'O(log n)',
      'Only a few numbers the size of n. This page keeps the rows to show them.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Load “p = 3, q = 11”, where e = 3. What is the private exponent d?',
      answer: 7,
      hints: ['φ = 2·10 = 20. Find d below 20 with 3·d ≡ 1 (mod 20).'],
      solution: '3·7 = 21 = 1·20 + 1, so d = 7.',
    },
    {
      type: 'number',
      prompt:
        'Use the same key, with n = 33 and e = 3, on the message M = 4. What is the ciphertext c?',
      answer: 31,
      hints: ['Compute 4³ and reduce mod 33. You can type M = 4 to check.'],
      solution: '4³ = 64 = 1·33 + 31, so c = 31. Decrypting 31⁷ mod 33 gives 4 again.',
    },
    {
      type: 'number',
      prompt: 'Load “p = 61, q = 53” with M = 65 and step to the ciphertext. What is c?',
      answer: 2790,
      hints: ['Step until the Public card shows c.'],
      solution: '65¹⁷ mod 3233 = 2790, and 2790²⁷⁵³ mod 3233 returns 65.',
    },
    {
      type: 'multi',
      prompt: 'Which of these must the owner keep secret?',
      options: ['n', 'e', 'd', 'p', 'φ', 'c'],
      answers: [2, 3, 4],
      hints: ['Anything that lets you compute d must stay secret.'],
      solution:
        'd opens messages, and either p or φ leads straight to d. n and e are the public key, and c travels in the open.',
    },
    {
      type: 'number',
      prompt:
        'In the attacker view for “p = 61, q = 53”, counting 2 and then the odd numbers, how many trial divisions does it take to split n?',
      answer: 27,
      unit: 'trial divisions',
      hints: ['The attacker stops at the smaller prime, 53. Step to the end and read the card.'],
      solution: 'It tries 2, then 3, 5, …, 53, which is 26 odd numbers: 27 trials in all.',
    },
    {
      type: 'choice',
      prompt: 'Why can you not use e = 4 when φ = 20?',
      options: [
        'gcd(4, 20) ≠ 1, so 4 has no inverse mod 20 and no d exists',
        'e must always be prime',
        'e must be larger than n',
        'An even e makes the encryption too slow',
      ],
      answer: 0,
      hints: ['What does extended Euclid need in order to find d?'],
      solution:
        'd exists only when gcd(e, φ) = 1. e need not be prime in general (e = 9 works when φ = 20), but it must be coprime to φ.',
    },
    {
      type: 'order',
      prompt: 'Put the steps of building a key in order.',
      items: [
        'Compute d = e⁻¹ mod φ',
        'Pick primes p and q',
        'Compute φ',
        'Choose e',
        'Publish (n, e)',
      ],
      answer: [1, 2, 3, 0, 4],
      hints: ['Each step uses the result of the one before it.'],
      solution:
        'p and q give φ. φ limits the choice of e. e and φ give d. Only then is (n, e) published.',
    },
  ],
  nextTeaser:
    'Next up: Practice: number theory problems, a sandbox for modular counting and divisor sums where you check each step yourself.',
};
