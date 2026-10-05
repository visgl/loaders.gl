import {vi} from 'vitest';
import {act} from 'react';
import {Matrix4} from '@math.gl/core';
import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';

/** Generates a sub-kilobyte self-contained triangle, optionally with a second scene placement. */
export function createTriangle(twoPrimitives = false): ArrayBuffer {
  const scene = new GLTFScenegraph({json: {asset: {version: '2.0'}}});
  const mesh = scene.addMesh({
    attributes: {POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3}},
    indices: new Uint16Array([0, 1, 2])
  });
  const nodes = [scene.addNode({meshIndex: mesh})];
  if (twoPrimitives) nodes.push(scene.addNode({meshIndex: mesh}));
  scene.setDefaultScene(scene.addScene({nodeIndices: nodes}));
  scene.createBinaryChunk();
  return GLTFWriter.encodeSync!(scene.gltf);
}

/** Supplies two content slots and a sibling under composed ECEF translations, without real network. */
export function createInput(
  twoPrimitives = false,
  metadata = false,
  axis: 'Y' | 'Z' = 'Y',
  selectedSibling = false
) {
  const document = {
    asset: {version: '1.1', gltfUpAxis: axis},
    geometricError: 4,
    root: {
      boundingVolume: {region: [-0.001, -0.001, 0.001, 0.001, 0, 200]},
      geometricError: 4,
      transform: Array.from(new Matrix4().translate([6378237, 0, 0])),
      ...(metadata ? {metadata: {class: 'unsupported'}} : {}),
      children: [
        {
          boundingVolume: {sphere: [0, 0, 0, 1]},
          geometricError: 2,
          transform: Array.from(new Matrix4().translate([0, 5, 7])),
          contents: [{uri: 'excluded.glb'}, {uri: 'selected.glb'}]
        },
        {boundingVolume: {sphere: [0, 0, 0, 1]}, geometricError: 0, content: {uri: 'sibling.glb'}}
      ]
    }
  };
  const fetcher = vi.fn<typeof fetch>(async input => {
    const url = String(input);
    if (url.includes('tileset.json')) return new Response(JSON.stringify(document));
    if (selectedSibling && url.includes('sibling.glb')) return new Response(createTriangle());
    if (url.includes('selected.glb')) return new Response(createTriangle(twoPrimitives));
    throw new Error(`Unselected resource fetched: ${url}`);
  });
  const controller = new AbortController();
  return {fetcher, controller};
}

/** Changes a controlled browser input through its native setter and bubbling input event. */
export async function setInputValue(element: HTMLInputElement, value: string): Promise<void> {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, value);
  await act(async () => {
    element.dispatchEvent(new Event('input', {bubbles: true}));
  });
}

/** Flushes browser I/O and React updates before polling the rendered controls. */
export async function readSettledControl<ValueT>(read: () => ValueT): Promise<ValueT> {
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 10));
  });
  return read();
}
