/* =========================================================================
   v09/tests/morning-qc/build-support/dom-test-harness.cjs

   Stage 12B TEST-ONLY jsdom harness. PROVENANCE: V09_TEST.

   Provides genuine interactive DOM testing (real click dispatch, real
   React 19 reconciliation via react-dom/client + act()) without a
   browser binary — Playwright's Chromium download is blocked by network
   sandboxing in this environment (cdn.playwright.dev is not in the
   egress allowlist; verified directly during Stage 12B). jsdom is a
   pure-JS DOM implementation with no native browser dependency, and is
   the same underlying technology used by countless real-world React
   test suites (Jest + Testing Library). This is a genuine substitute for
   interactive behavior verification, though it does NOT verify real
   browser layout/paint (no visual screenshots, no actual CSS box-model
   overflow detection) — see V09_STAGE12B_REPORT.md for the exact scope
   of what this harness can and cannot verify.
   ========================================================================= */
'use strict';
const { JSDOM } = require('jsdom');

function installGlobalDom(html) {
  const dom = new JSDOM(html || '<!doctype html><html><body><div id="root"></div></body></html>', {
    pretendToBeVisual: true,
  });
  global.window = dom.window;
  global.document = dom.window.document;
  Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  global.MouseEvent = dom.window.MouseEvent;
  global.KeyboardEvent = dom.window.KeyboardEvent;
  global.requestAnimationFrame = dom.window.requestAnimationFrame || (cb => setTimeout(cb, 0));
  global.IS_REACT_ACT_ENVIRONMENT = true;
  return dom;
}

function click(el) {
  el.dispatchEvent(new global.window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

function keydown(el, key, opts) {
  el.dispatchEvent(new global.window.KeyboardEvent('keydown', Object.assign({ key, bubbles: true, cancelable: true }, opts || {})));
}

function byText(root, text) {
  return Array.from(root.querySelectorAll('button, [role="button"]')).find(el => el.textContent.trim() === text);
}

function byTextIncludes(root, text) {
  return Array.from(root.querySelectorAll('button, [role="button"]')).find(el => el.textContent.includes(text));
}

module.exports = { installGlobalDom, click, keydown, byText, byTextIncludes };
