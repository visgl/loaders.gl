import test from 'tape-catch';
import {loadImage} from '@loaders.gl/images';

// eslint-disable-next-line quotes
const PNG_BITS = `\
iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P8z\
/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII=`;

const DATA_URL = `data:image/png;base64,${PNG_BITS}`;

test('images#loadImage', t => {
  loadImage(DATA_URL).then(image => {
    t.comment(JSON.stringify(image));
    t.deepEquals(image.shape, [2, 2, 4], 'ndarray.shape is correct');
    t.ok(ArrayBuffer.isView(image.data), 'ndarray.data is ArrayBuffer');
    t.equals(image.data.byteLength, 16, 'ndarray.data.byteLength is correct');
    t.end();
  });
});
