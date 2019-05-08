"use strict";var encodeImage;module.link('./lib/encode-image',{encodeImage(v){encodeImage=v}},0);

module.exportDefault({
  name: 'Images',
  extensions: ['jpeg'],
  encode: encodeImage,
  DEFAULT_OPTIONS: {
    type: 'png'
  }
});
