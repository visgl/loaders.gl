/* TODO - from luma.gl
export function getImageFromContext(gl) {
  const image = createImage(gl.drawingBufferWidth, gl.drawingBufferHeight);
  return new Promise(resolve => {
    image.onload = () => {
      resolve(image);
    };
    image.src = gl.canvas.toDataURL();
  });
}

function createImage(width, height) {
  const image = document.createElement('img');
  image.width = width;
  image.height = height;
  image.style.position = 'absolute';
  image.style.top = 0;
  image.style.left = 0;
  return image;
}s
*/
