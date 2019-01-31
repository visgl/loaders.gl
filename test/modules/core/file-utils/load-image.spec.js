import {loadImage} from '@loaders.gl/core';

import test from 'tape-catch';

const DATA_URL = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAA
Bytg0kAAAAFElEQVQIW2P8z/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII=`;

test('loadImage#imports', t => {
  t.ok(loadImage, 'loadImage defined');
  t.end();
});

test('loadImage#dataUrl', t => {
  if (typeof window === 'undefined') {
    t.comment('loadImage only works under browser');
    t.end();
    return;
  }

  loadImage(DATA_URL).then(image => {
    t.ok(image, 'loadImage loaded data url');
    t.end();
  }).catch(_ => t.end());
});
