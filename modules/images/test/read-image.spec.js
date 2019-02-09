import test from 'tape-catch';
import {loadImage} from '@loaders.gl/images';

// eslint-disable-next-line quotes
const PNG_BITS = `\
iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P8z\
/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII=`;

const DATA_URL = `data:image/png;base64,${PNG_BITS}`;

test('images#loadImage', t => {
  loadImage(DATA_URL).then(image => {
    t.equals(image.width, 2, 'width');
    t.equals(image.height, 2, 'height');
    t.end();
  });
});
