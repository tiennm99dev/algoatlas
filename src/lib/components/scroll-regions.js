/**
 * Keyboard access to the scrolling boxes inside a lesson. A box whose content is bigger than it
 * can only be scrolled by keyboard once it can take focus, and Safari does not focus such a box
 * by itself.
 *
 * `use:scrollRegions` on the lesson gives every `.overflow-x-auto` and `.overflow-auto` box a tab
 * stop while its content overflows and it holds nothing focusable, and takes the stop away once
 * everything fits, so widget boxes need nothing of their own. A box that holds a control already
 * has a focus stop and is left alone, and so is a tabindex an author set or a `ScrollFrame`
 * (marked `data-scroll-frame`), which manages its own. A box this action owns is marked
 * `data-scroll-region`, which `app.css` gives a focus ring and the player's arrow keys skip.
 */

/** Marks a box whose tabindex this action set. */
const OWNED = 'data-scroll-region';
/** Marks a ScrollFrame, which manages its own tabindex. */
const FRAME = 'data-scroll-frame';

const SCROLLERS = '.overflow-x-auto, .overflow-auto';
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Focused scroll boxes that own their arrow keys, so the arrows scroll instead of stepping. */
export const SCROLL_BOXES = `[${OWNED}], [${FRAME}]`;

/**
 * Gives one scrolling box a tab stop while it overflows and holds nothing focusable, and takes
 * away only a tab stop this action set.
 * @param {Element} box
 */
export function updateRegion(box) {
  const el = /** @type {HTMLElement} */ (box);
  if (el.hasAttribute(FRAME)) return;
  const owned = el.hasAttribute(OWNED);
  if (!owned && el.hasAttribute('tabindex')) return;
  const overflows = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
  if (overflows && !el.querySelector(FOCUSABLE)) {
    el.tabIndex = 0;
    el.setAttribute(OWNED, '');
  } else if (owned) {
    el.removeAttribute('tabindex');
    el.removeAttribute(OWNED);
  }
}

/**
 * @param {HTMLElement} root
 */
export function scrollRegions(root) {
  let queued = false;
  const update = () => {
    queued = false;
    root.querySelectorAll(SCROLLERS).forEach(updateRegion);
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    (typeof requestAnimationFrame === 'undefined' ? setTimeout : requestAnimationFrame)(update);
  };
  update();
  // Web fonts can widen text after the first layout.
  document.fonts?.ready.then(schedule, () => {});
  const mutations = typeof MutationObserver === 'undefined' ? null : new MutationObserver(schedule);
  mutations?.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  });
  window.addEventListener('resize', schedule);
  return {
    destroy() {
      mutations?.disconnect();
      window.removeEventListener('resize', schedule);
    },
  };
}
