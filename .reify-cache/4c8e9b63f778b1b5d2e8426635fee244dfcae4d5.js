"use strict";var ImageLoader,ImageBitmapLoader,HTMLImageLoader;module.link('@loaders.gl/images',{ImageLoader(v){ImageLoader=v},ImageBitmapLoader(v){ImageBitmapLoader=v},HTMLImageLoader(v){HTMLImageLoader=v}},0);var test;module.link('tape-promise/tape',{default(v){test=v}},1);



test('image loaders#imports', t => {
  t.ok(ImageLoader, 'ImageLoader defined');
  t.ok(ImageBitmapLoader, 'ImageBitmapLoader defined');
  t.ok(HTMLImageLoader, 'HTMLImageLoader defined');
  t.end();
});
