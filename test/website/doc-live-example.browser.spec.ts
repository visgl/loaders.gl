// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {act, createElement} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {DocLiveExample} from '../../website/src/components/docs/doc-live-example';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

test.each([
  'missing',
  'rejected'
])('inline examples expand when fullscreen is %s', async failure => {
  const fullscreen = vi.spyOn(HTMLElement.prototype, 'requestFullscreen');
  if (failure === 'missing') {
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: undefined
    });
  } else {
    fullscreen.mockRejectedValue(new Error('Fullscreen denied'));
  }
  const previousOverflow = document.body.style.overflow;
  const previousRootOverflow = document.documentElement.style.overflow;
  await act(async () =>
    root.render(
      createElement(DocLiveExample, {
        label: 'Test map',
        children: createElement('input', {
          'aria-label': 'Example state',
          defaultValue: 'Keep this value'
        })
      })
    )
  );
  const button = container.querySelector('button')!;
  button.focus();
  await act(async () => button.click());
  const frame = container.querySelector('[data-expanded]')!;
  expect(frame.getAttribute('role')).toBe('dialog');
  expect(frame.getAttribute('aria-modal')).toBe('true');
  expect(document.body.style.overflow).toBe('hidden');
  expect(document.documentElement.style.overflow).toBe('hidden');
  expect(document.activeElement).toBe(button);
  await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'})));
  expect(container.querySelector('[data-expanded]')).toBeNull();
  expect(document.body.style.overflow).toBe(previousOverflow);
  expect(document.documentElement.style.overflow).toBe(previousRootOverflow);
  expect(container.querySelector('input')!.value).toBe('Keep this value');
  expect(document.activeElement).toBe(button);
});

test('the exit control closes expanded examples and unmount restores scrolling', async () => {
  vi.spyOn(HTMLElement.prototype, 'requestFullscreen').mockRejectedValue(new Error('Denied'));
  await act(async () =>
    root.render(
      createElement(DocLiveExample, {label: 'Test panel', variant: 'panel', children: 'Content'})
    )
  );
  const button = container.querySelector('button')!;
  await act(async () => button.click());
  await act(async () => button.click());
  expect(container.querySelector('[data-expanded]')).toBeNull();
  await act(async () => button.click());
  await act(async () => root.render(null));
  expect(document.body.style.overflow).not.toBe('hidden');
});

test('expanded examples restore focus to the interaction gate that opened them', async () => {
  vi.spyOn(HTMLElement.prototype, 'requestFullscreen').mockRejectedValue(new Error('Denied'));
  await act(async () =>
    root.render(createElement(DocLiveExample, {label: 'Test map', children: 'Map'}))
  );
  const gate = container.querySelectorAll('button')[1];
  gate.focus();
  await act(async () => gate.click());
  await act(async () => container.querySelector('button')!.click());
  expect(document.activeElement).toBe(gate);
});

test('expanded examples trap focus around visible controls and skip hidden or inert sidebars', async () => {
  vi.spyOn(HTMLElement.prototype, 'requestFullscreen').mockRejectedValue(new Error('Denied'));
  await act(async () =>
    root.render(
      createElement(DocLiveExample, {
        label: 'Test map',
        children: createElement(
          'div',
          null,
          createElement('button', {id: 'visible-control'}, 'Visible control'),
          createElement('button', {style: {visibility: 'hidden'}}, 'Hidden control'),
          createElement('div', {inert: true}, createElement('button', null, 'Inert control'))
        )
      })
    )
  );
  const fullscreenButton = container.querySelector('button')!;
  await act(async () => fullscreenButton.click());
  document.dispatchEvent(
    new KeyboardEvent('keydown', {key: 'Tab', shiftKey: true, cancelable: true})
  );
  expect(document.activeElement).toBe(container.querySelector('#visible-control'));
  document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Tab', cancelable: true}));
  expect(document.activeElement).toBe(fullscreenButton);
});
