import {expect, test} from 'vitest';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {DataViewReadableFile} from '@loaders.gl/zip';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import {convertSelectedContentsInWorker} from '../examples/website/i3s-slpk/src/conversion-worker-client';
import {inspectConversionInput} from '../examples/website/i3s-slpk/src/convert-tileset';
import {createInput, createTriangle} from './utils/tile-browser-conversion';

// Real module-worker startup and bundling belong in the hermetic slow lane, not the fast UI suite.
test.each([
  'slpk',
  '3tz'
] as const)('real conversion worker transfers a readable %s archive', async format => {
  const {fetcher, controller} = createInput();
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  const contentUrl = URL.createObjectURL(new Blob([createTriangle()]));
  const resources = inspection.resources.map((resource, index) =>
    index === 1 ? {...resource, uri: contentUrl} : resource
  );
  const document = structuredClone(inspection.tileset);
  document.root!.children![0].contents![1].uri = contentUrl;
  const phases: string[] = [];
  try {
    const output = await convertSelectedContentsInWorker(
      {...inspection, tileset: document, resources},
      [resources[1].resourceId],
      format,
      controller.signal,
      phase => phases.push(phase)
    );
    expect(output.file.name).toBe(`selected-mesh.${format}`);
    expect(output.file.size).toBeGreaterThan(0);
    expect(phases).toContain('Packaging archive');
    const file = new DataViewReadableFile(new DataView(await output.file.arrayBuffer()));
    const archive = format === 'slpk' ? await parseSLPKArchive(file) : new Tiles3DArchive(file);
    try {
      const root = await archive.getFile(format === 'slpk' ? '' : 'tileset.json', 'http');
      expect(JSON.parse(new TextDecoder().decode(root))).toBeDefined();
    } finally {
      await file.close();
    }
  } finally {
    URL.revokeObjectURL(contentUrl);
  }
}, 30000);
