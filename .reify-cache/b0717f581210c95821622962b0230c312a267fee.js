"use strict";module.export({ImageBitmapLoader:()=>ImageBitmapLoader,HTMLImageLoader:()=>HTMLImageLoader},true);var canParseImage,parseImage,loadImage,parseToImageBitmap,loadToHTMLImage;module.link('./lib/parse-image',{canParseImage(v){canParseImage=v},parseImage(v){parseImage=v},loadImage(v){loadImage=v},parseToImageBitmap(v){parseToImageBitmap=v},loadToHTMLImage(v){loadToHTMLImage=v}},0);







// Loads a platform-specific image type that can be used as input data to WebGL textures
module.exportDefault({
  name: 'Images',
  extension: [],
  parse: canParseImage && parseImage,
  loadAndParse: !canParseImage && loadImage
});

// EXPERIMENTAL

// Specifically loads an ImageBitmap (works on newer browsers, on both main and worker threads)
const ImageBitmapLoader = {
  parse: parseToImageBitmap
};

// Specifically loads an HTMLImage (works on all browsers' main thread but not on worker threads)
const HTMLImageLoader = {
  loadAndParse: loadToHTMLImage
};
