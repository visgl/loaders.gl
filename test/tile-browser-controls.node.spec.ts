import {expect, test} from 'vitest';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {ConversionPanel} from '../examples/website/i3s-slpk/src/components/conversion-panel';

// Website static generation has no window, picker, worker, or mounted browser effects.
test('conversion controls render on the server without browser globals', () => {
  expect(typeof window).toBe('undefined');
  const markup = renderToString(React.createElement(ConversionPanel, {onPreview: () => {}}));
  expect(markup).toContain('Convert selected 3D Tiles meshes');
  expect(markup).toContain('conversion-url');
  expect(markup).not.toContain('Convert and save to file');
});
