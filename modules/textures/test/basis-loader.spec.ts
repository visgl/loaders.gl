// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { expect, test } from "vitest";
import { BasisLoader } from '@loaders.gl/textures';
import { load, setLoaderOptions, isBrowser } from '@loaders.gl/core';
import { GL_COMPRESSED_RGB_ETC1_WEBGL, GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG, GL_COMPRESSED_RGB_S3TC_DXT1_EXT, GL_COMPRESSED_RGBA8_ETC2_EAC, GL_COMPRESSED_RGBA_ASTC_4x4_KHR, GL_COMPRESSED_RGBA_BPTC_UNORM_EXT, GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG, GL_COMPRESSED_RGBA_S3TC_DXT5_EXT, GL_RGBA8 } from '../src/lib/gl-extensions';
import { withBasisTranscodingLock } from '../src/lib/parsers/parse-basis';
const BASIS_TEST_URL = '@loaders.gl/textures/test/data/alpha3.basis';
const KTX2_BASIS_TEST_URL = '@loaders.gl/textures/test/data/kodim23.ktx2';
setLoaderOptions({
    _workerType: 'test',
    CDN: null
});
test('BasisLoader#imports', () => {
    expect(BasisLoader, 'BasisLoader defined').toBeTruthy();
});
test('BasisLoader#load(URL, worker: false)', async () => {
    const images = await load(BASIS_TEST_URL, BasisLoader, {
        core: { worker: false }
    });
    const image = images[0][0];
    expect(image, 'image loaded successfully from URL').toBeTruthy();
    expect(image.shape, 'image shape is correct').toBe('texture-level');
    expect(image.width, 'image width is correct').toBe(768);
    expect(image.height, 'image height is correct').toBe(512);
    if (isBrowser) {
        expect(image.compressed, 'image is compressed').toBe(true);
        expect(image.data.byteLength, 'image `data.byteLength` is correct').toBe(393216);
    }
    else {
        expect(image.compressed, 'image is compressed').toBe(false);
        expect(image.data.byteLength, 'image `data.byteLength` is correct').toBe(1572864);
        expect(image.textureFormat, 'image `textureFormat` is correct').toBe('rgba8unorm');
    }
    expect(ArrayBuffer.isView(image.data), 'image data is `ArrayBuffer`').toBeTruthy();
});
test('BasisLoader#load(URL, worker: true)', async () => {
    const images = await load(BASIS_TEST_URL, BasisLoader, { worker: true, _nodeWorkers: true });
    const image = images[0][0];
    expect(image, 'image loaded successfully from URL').toBeTruthy();
    expect(image.width, 'image width is correct').toBe(768);
    expect(image.height, 'image height is correct').toBe(512);
    expect(image.compressed, 'image height is correct').toBe(false);
    expect(image.textureFormat, 'image `textureFormat` is correct').toBe('rgba8unorm');
    expect(ArrayBuffer.isView(image.data), 'image data is `ArrayBuffer`').toBeTruthy();
    expect(image.data.byteLength, 'image `data.byteLength` is correct').toBe(1572864);
});
test('BasisLoader#auto-select a target format', async () => {
    // Can't auto-select format in worker because gl context isn't not available on a worker thread
    const images = await load(BASIS_TEST_URL, BasisLoader, {
        core: { worker: false },
        basis: { format: 'auto' }
    });
    const image = images[0][0];
    if (isBrowser) {
        expect(typeof image.format === 'number' &&
            [
                GL_COMPRESSED_RGBA_ASTC_4x4_KHR,
                GL_COMPRESSED_RGBA_BPTC_UNORM_EXT,
                GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
                GL_COMPRESSED_RGBA_S3TC_DXT5_EXT,
                GL_COMPRESSED_RGBA8_ETC2_EAC,
                GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
                GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
                GL_COMPRESSED_RGB_ETC1_WEBGL
            ].includes(image.format), 'Browser supports one of GPU textures formats').toBeTruthy();
        expect(image.compressed, 'Basis transcodes to compressed texture').toBeTruthy();
    }
    else {
        expect(image.format, 'Basis transcodes alpha textures to RGBA8 in NodeJS').toBe(GL_RGBA8);
        expect(image.compressed, "Basis can't transcode to compressed texture in NodeJS").toBeFalsy();
    }
});
test('BasisLoader#transcode to explicit format', async () => {
    const images = await load(BASIS_TEST_URL, BasisLoader, {
        worker: true,
        _nodeWorkers: true,
        basis: {
            format: {
                alpha: 'BC3',
                noAlpha: 'BC1'
            }
        }
    });
    const image = images[0][0];
    expect(image.format, 'The texture was transcoded to DXT fromat').toBe(GL_COMPRESSED_RGBA_S3TC_DXT5_EXT);
    expect(image.textureFormat, 'The texture exposes the WebGPU format').toBe('bc3-rgba-unorm');
    expect(image.compressed, 'Basis transcodes to compressed texture').toBeTruthy();
});
test('BasisLoader#auto-selects format from supportedTextureFormats', async () => {
    const images = await load(BASIS_TEST_URL, BasisLoader, {
        core: { worker: false },
        basis: {
            format: 'auto',
            supportedTextureFormats: ['bc3-rgba-unorm']
        }
    });
    const image = images[0][0];
    expect(image.format, 'BasisLoader selects the matching WebGL format').toBe(GL_COMPRESSED_RGBA_S3TC_DXT5_EXT);
    expect(image.textureFormat, 'BasisLoader sets the selected texture format').toBe('bc3-rgba-unorm');
});
test('BasisLoader#auto-select a decoder format', async () => {
    const images = await load(BASIS_TEST_URL, BasisLoader, {
        worker: true,
        basis: {
            format: 'astc-4x4',
            containerFormat: 'auto'
        }
    });
    const image = images[0][0];
    expect(image, 'Transcode .basis').toBeTruthy();
    const ktx2Images = await load(KTX2_BASIS_TEST_URL, BasisLoader, {
        worker: true,
        _nodeWorkers: true,
        basis: {
            format: 'astc-4x4',
            containerFormat: 'auto'
        }
    });
    const ktx2Image = ktx2Images[0];
    expect(ktx2Image, 'Transcode .ktx2').toBeTruthy();
    expect(ktx2Image.length, 'Transcode .ktx2 mips').toBe(10);
});
test('BasisLoader#uses injected transcoder modules', async () => {
    class FakeBasisFile {
        constructor(data: Uint8Array) {
            expect(data.byteLength, 'forwards the provided payload to the injected BasisFile').toBe(4);
        }
        startTranscoding() {
            return true;
        }
        getNumImages() {
            return 1;
        }
        getNumLevels() {
            return 1;
        }
        getImageWidth() {
            return 2;
        }
        getImageHeight() {
            return 2;
        }
        getHasAlpha() {
            return false;
        }
        getBasisTexFormat() {
            return 0;
        }
        isHDR() {
            return false;
        }
        getBlockWidth() {
            return 4;
        }
        getBlockHeight() {
            return 4;
        }
        getImageTranscodedSizeInBytes() {
            return 8;
        }
        transcodeImage(decodedData: Uint8Array) {
            decodedData.set([1, 2, 3, 4, 5, 6, 7, 8]);
            return true;
        }
        close() { }
        delete() { }
    }
    const images = await load(new Uint8Array([1, 2, 3, 4]).buffer, BasisLoader, {
        core: { worker: false },
        basis: {
            format: 'rgb565',
            containerFormat: 'basis'
        },
        modules: {
            basis: { BasisFile: FakeBasisFile }
        }
    });
    const image = images[0][0];
    expect(image.width, 'uses the injected BasisFile implementation').toBe(2);
    expect(image.height, 'returns the injected texture height').toBe(2);
    expect(image.data.byteLength, 'returns the injected transcoded payload size').toBe(8);
});
test('BasisLoader#serializes Basis transcoding work', async () => {
    const events: string[] = [];
    let activeTranscodes = 0;
    const runTranscode = async (label: string, delayMs: number) => await withBasisTranscodingLock(async () => {
        events.push(`${label}:start`);
        activeTranscodes++;
        expect(activeTranscodes, `${label} runs with exclusive access`).toBe(1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        activeTranscodes--;
        events.push(`${label}:end`);
        return label;
    });
    const [first, second] = await Promise.all([runTranscode('first', 20), runTranscode('second', 0)]);
    expect(first, 'first transcode resolves').toBe('first');
    expect(second, 'second transcode resolves').toBe('second');
    expect(events, 'concurrent requests are serialized').toEqual(['first:start', 'first:end', 'second:start', 'second:end']);
});
