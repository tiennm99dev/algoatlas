/**
 * Playback over a precomputed frame trace: step, rewind, scrub, autoplay.
 * Every visualizer shares this so controls behave identically across lessons.
 */

export const SPEEDS = [0.5, 1, 2, 4, 8, 16];

/**
 * @template T
 * @param {T[]} initial Must contain at least one frame.
 */
export function createPlayer(initial) {
  let frames = $state.raw(initial);
  let index = $state(0);
  let playing = $state(false);
  let speed = $state(2);
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  function clear() {
    clearTimeout(timer);
    timer = undefined;
  }

  function tick() {
    if (index >= frames.length - 1) {
      playing = false;
      return;
    }
    index++;
    timer = setTimeout(tick, 1000 / speed);
  }

  function pause() {
    playing = false;
    clear();
  }

  function play() {
    if (playing) return;
    if (index >= frames.length - 1) index = 0;
    playing = true;
    timer = setTimeout(tick, 1000 / speed);
  }

  return {
    get frames() {
      return frames;
    },
    get index() {
      return index;
    },
    get frame() {
      return frames[index];
    },
    get playing() {
      return playing;
    },
    get atStart() {
      return index === 0;
    },
    get atEnd() {
      return index === frames.length - 1;
    },
    get speed() {
      return speed;
    },
    /** @param {number} v */
    set speed(v) {
      speed = v;
      // Reschedule so a faster speed takes effect now, not after the old delay.
      if (playing) {
        clear();
        timer = setTimeout(tick, 1000 / speed);
      }
    },
    /** Replace the trace, e.g. after the learner edits the input. @param {T[]} next */
    load(next) {
      pause();
      frames = next;
      index = 0;
    },
    step() {
      pause();
      if (index < frames.length - 1) index++;
    },
    back() {
      pause();
      if (index > 0) index--;
    },
    /** @param {number} i */
    seek(i) {
      pause();
      index = Math.max(0, Math.min(frames.length - 1, i));
    },
    play,
    pause,
    toggle() {
      if (playing) pause();
      else play();
    },
  };
}

/** @typedef {ReturnType<typeof createPlayer<any>>} Player */
