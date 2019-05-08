"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var fetchFile;module.link('@loaders.gl/core',{fetchFile(v){fetchFile=v}},1);var getImageSize;module.link('@loaders.gl/images',{getImageSize(v){getImageSize=v}},2);// This code is based on binary-gltf-utils
// Copyright (c) 2016-17 Karl Cheng, MIT license

/* eslint-disable max-len, max-statements */




const readFile = url => fetchFile(url).then(response => response.arrayBuffer());

let TEST_FILES = null;

async function getTestFiles() {
  TEST_FILES = TEST_FILES || [
    ['png', await readFile('@loaders.gl/images/test/data/img1-preview.png')],
    ['jpeg', await readFile('@loaders.gl/images/test/data/img1-preview.jpeg')],
    ['gif', await readFile('@loaders.gl/images/test/data/img1-preview.gif')],
    ['bmp', await readFile('@loaders.gl/images/test/data/img1-preview.bmp')],
    ['tiff', await readFile('@loaders.gl/images/test/data/img1-preview.png')]
  ];

  return TEST_FILES;
}

async function testImage(t, typeToTest, acceptableTypes, canThrow) {
  const files = await getTestFiles();

  acceptableTypes = new Set(acceptableTypes);
  for (const [type, image] of files) {
    const shouldPass = acceptableTypes.has(type);
    const buffer = image;

    const mimeType = typeToTest !== 'all' ? `image/${typeToTest}` : undefined;
    if (shouldPass) {
      const dimensions = getImageSize(buffer, mimeType);
      t.equals(dimensions.width, 480, `width, should work with ${type.toUpperCase()} files`);
      t.equals(dimensions.height, 320, `height, should work with ${type.toUpperCase()} files`);
    } else if (canThrow) {
      t.throws(
        () => getImageSize(buffer, mimeType),
        `should not work with ${type.toUpperCase()} files`
      );
    }
  }
}

test('getImageSize#png', async t => {
  await testImage(t, 'png', ['png']);
  t.end();
});

test('getImageSize#jpeg', async t => {
  await testImage(t, 'jpeg', ['jpeg']);
  t.end();
});

test('getImageSize#gif', async t => {
  await testImage(t, 'gif', ['gif']);
  t.end();
});

test('getImageSize#bmp', async t => {
  await testImage(t, 'bmp', ['bmp']);
  t.end();
});

test('getImageSize#all', async t => {
  await testImage(t, 'all', ['png', 'jpeg', 'gif', 'bmp']);
  t.end();
});
