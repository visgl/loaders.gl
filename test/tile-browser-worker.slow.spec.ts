import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {DataViewReadableFile} from '@loaders.gl/zip';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import {
  convertSelectedContentsInWorker,
  saveSelectedContentsInWorker
} from '../examples/website/i3s-slpk/src/conversion-worker-client';
import {inspectConversionInput} from '../examples/website/i3s-slpk/src/convert-tileset';
import {createInput, createTriangle} from './utils/tile-browser-conversion';
import {createCompressedMesh} from './utils/tile-converter-draco';

/** Supplies a real worker with a tiny Draco mesh or triangle strip and explicit placements. */
async function createWorkerInput(collection: boolean, compressed = false) {
  const {fetcher, controller} = createInput(false, false, 'Y', collection);
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  const data = compressed ? await createCompressedMesh() : createTriangle(collection, 5);
  const contentUrl = URL.createObjectURL(new Blob([data]));
  const resources = inspection.resources.map((resource, index) =>
    index === 1 || (collection && index === 2) ? {...resource, uri: contentUrl} : resource
  );
  const document = structuredClone(inspection.tileset);
  document.root!.children![0].contents![1].uri = contentUrl;
  if (collection) document.root!.children![1].content!.uri = contentUrl;
  return {
    inspection: {...inspection, tileset: document, resources},
    resourceIds: collection
      ? [resources[1].resourceId, resources[2].resourceId]
      : [resources[1].resourceId],
    controller,
    contentUrl
  };
}

/** Raw collection input contains two placements in each selected content. */
function countWorkerPrimitivePlacements(profile: string, compressed: boolean): number {
  return profile === 'collection' ? (compressed ? 2 : 4) : 1;
}

// Real module-worker startup and native storage belong in the hermetic slow lane.
test.each([
  ['slpk', false, false],
  ['3tz', false, true],
  ['collection', false, false],
  ['slpk', true, false],
  ['collection', true, false]
] as const)(
  'real conversion worker produces a readable %s archive with direct save=%s and Draco input=%s',
  async (profile, directSave, compressed) => {
    const {inspection, resourceIds, controller, contentUrl} = await createWorkerInput(
      profile === 'collection',
      compressed
    );
    const format = profile === 'collection' ? '3tz' : profile;
    const phases: string[] = [];
    const directory = directSave ? await navigator.storage.getDirectory() : undefined;
    const filename = `tile-conversion-${profile}.${format}`;
    try {
      let outputFile: File;
      if (directory) {
        const handle = await directory.getFileHandle(filename, {create: true});
        const previous = await handle.createWritable();
        await previous.write(new Uint8Array(8192));
        await previous.close();
        const output = await saveSelectedContentsInWorker(
          inspection,
          resourceIds,
          format,
          controller.signal,
          phase => phases.push(phase),
          await handle.createWritable()
        );
        outputFile = await handle.getFile();
        expect(outputFile.size).toBe(output.size);
        expect(output.report.inputResources).toBe(
          countWorkerPrimitivePlacements(profile, compressed)
        );
        expect(phases.at(-1)).toBe('Saving archive');
      } else {
        const output = await convertSelectedContentsInWorker(
          inspection,
          resourceIds,
          format,
          controller.signal,
          phase => phases.push(phase)
        );
        outputFile = output.file;
        expect(outputFile.name).toBe(
          profile === 'collection' ? 'selected-meshes.3tz' : `selected-mesh.${format}`
        );
        expect(output.report.inputResources).toBe(
          countWorkerPrimitivePlacements(profile, compressed)
        );
      }
      expect(outputFile.size).toBeGreaterThan(0);
      expect(phases).toContain('Packaging archive');
      const file = new DataViewReadableFile(new DataView(await outputFile.arrayBuffer()));
      const archive = format === 'slpk' ? await parseSLPKArchive(file) : new Tiles3DArchive(file);
      try {
        const root = await archive.getFile(format === 'slpk' ? '' : 'tileset.json', 'http');
        const metadata = JSON.parse(new TextDecoder().decode(root));
        expect(metadata).toBeDefined();
        if (format === 'slpk') {
          expect(
            metadata.geometryDefinitions[0].geometryBuffers[0].compressedAttributes.encoding
          ).toBe('draco');
          const geometry = await archive.getFile('nodes/1/geometries/0', 'http');
          expect(new TextDecoder().decode(geometry.slice(0, 5))).toBe('DRACO');
          expect(new Uint8Array(geometry)[8]).toBe(1);
        } else {
          expect(metadata.root.children).toHaveLength(
            countWorkerPrimitivePlacements(profile, compressed)
          );
          const content = metadata.root.children[0].content;
          const glb = await parse(await archive.getFile(content.uri), GLBLoader);
          expect(glb.json.extensionsRequired).toContain('KHR_draco_mesh_compression');
        }
      } finally {
        await file.close();
      }
    } finally {
      URL.revokeObjectURL(contentUrl);
      await directory?.removeEntry(filename);
    }
  },
  30000
);

test('canceling after a native file write preserves the previous file', async () => {
  const {inspection, resourceIds, controller, contentUrl} = await createWorkerInput(false);
  const directory = await navigator.storage.getDirectory();
  const filename = 'tile-conversion-canceled.3tz';
  const handle = await directory.getFileHandle(filename, {create: true});
  const original = new Uint8Array([9, 8, 7]);
  const previous = await handle.createWritable();
  await previous.write(original);
  await previous.close();
  const nativeWriter = (await handle.createWritable()).getWriter();
  const destination = new WritableStream<Uint8Array<ArrayBuffer>>({
    /** Cancels only after the native stream accepts a real archive chunk. */
    async write(chunk) {
      await nativeWriter.write(chunk);
      controller.abort(new Error('Canceled native save'));
    },
    /** Commits only if conversion succeeds. */
    close: () => nativeWriter.close(),
    /** Discards the working file on cancellation. */
    abort: reason => nativeWriter.abort(reason)
  });
  try {
    await expect(
      saveSelectedContentsInWorker(
        inspection,
        resourceIds,
        '3tz',
        controller.signal,
        () => {},
        destination
      )
    ).rejects.toThrow('Canceled native save');
    expect(new Uint8Array(await (await handle.getFile()).arrayBuffer())).toEqual(original);
    expect(destination.locked).toBe(false);
  } finally {
    nativeWriter.releaseLock();
    URL.revokeObjectURL(contentUrl);
    await directory.removeEntry(filename);
  }
}, 30000);

test.each([
  'slpk',
  '3tz'
] as const)('real worker reads cloneable local I3S declarations/File and emits %s', async format => {
  const {createI3SConversionFixture} = await import('./utils/tile-browser-i3s-conversion');
  const {inspectI3SConversionInput} = await import(
    '../examples/website/i3s-slpk/src/i3s-conversion-input'
  );
  const fixture = await createI3SConversionFixture();
  const controller = new AbortController();
  const inspection = await inspectI3SConversionInput(fixture.file, controller.signal);
  const output = await convertSelectedContentsInWorker(
    inspection,
    ['1'],
    format,
    controller.signal,
    () => {},
    fixture.features,
    2
  );
  expect(output.file.name).toBe(`selected-mesh.${format}`);
  expect(output.report.inputResources).toBe(1);
  const file = new DataViewReadableFile(new DataView(await output.file.arrayBuffer()));
  try {
    const archive = format === 'slpk' ? await parseSLPKArchive(file) : new Tiles3DArchive(file);
    const document = JSON.parse(
      new TextDecoder().decode(
        await archive.getFile(format === 'slpk' ? '' : 'tileset.json', 'http')
      )
    );
    expect(format === 'slpk' ? document.layerType : document.root.children.length).toBe(
      format === 'slpk' ? '3DObject' : 1
    );
  } finally {
    await file.close();
  }
}, 30000);
