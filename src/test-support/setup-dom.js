// jsdom has no matchMedia; svelte/motion's prefersReducedMotion reads it on import.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });
}

// jsdom has no Web Animations API; components that animate reordered items (the bar chart)
// call element.animate and element.getAnimations.
if (typeof Element !== 'undefined') {
  const proto = /** @type {any} */ (Element.prototype);
  proto.getAnimations ??= () => [];
  proto.animate ??= () => ({ cancel() {}, finished: Promise.resolve(), onfinish: null });
}
