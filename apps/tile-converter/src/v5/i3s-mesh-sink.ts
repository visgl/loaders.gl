// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Ellipsoid} from '@math.gl/geospatial';
import {GZipDecompressor, GZipCompressor} from '@loaders.gl/compression';
import {
  TileConversionError,
  createBoundedMemoryTileConversionSink
} from '@loaders.gl/tile-converter/v5/core';
import type {
  BrowserTileConversionFile,
  TileConversionSink
} from '@loaders.gl/tile-converter/v5/core';
import type {I3SMeshConversionResource} from './i3s-mesh-conversion.js';

/** Bounded flat collection of mesh nodes sharing one I3S feature/geometry schema. */
export interface I3SMeshSinkOptions {
  /** Maximum compressed bytes retained, including final layer/index metadata. */
  readonly maxTotalBytes: number;
  /** Maximum primitive placements, from one through 64. */
  readonly maxMeshes: number;
  /** Maximum decompressed or generated metadata/attribute resource bytes. */
  readonly maxResourceBytes: number;
}

/** Atomic multi-mesh I3S output, ready for portable SLPK packaging. */
export interface I3SMeshSink extends TileConversionSink<I3SMeshConversionResource> {
  /** Finalized files only; failed or unfinished conversion exposes no output. */
  getFiles(): readonly BrowserTileConversionFile[];
}

/** Geographic center and conservative axis-aligned ECEF half extents. */
interface MeshBounds {
  /** Longitude, latitude and ellipsoidal height. */ readonly center: number[];
  /** Half extents in meters along ECEF axes. */ readonly halfSize: number[];
  /** Identity orientation from the qualified mesh writer. */ readonly quaternion: number[];
}
/** Generated paged mesh node, retaining geometry/material/attribute references. */
interface MeshNode {
  /** Index in the flat collection. */ index: number;
  /** Contentless root index. */ parentIndex: number;
  /** Writer bounds. */ obb: MeshBounds;
  /** Leaf resources and their shared definitions. */ mesh: {
    /** Material and optional texture resource. */ material: {
      /** Index into the layer's material definitions. */
      definition: number;
      /** Node holding the base-color texture, when present. */
      resource?: number;
    };
    /** Geometry definition/resource and counts. */ geometry: {
      /** Index into the layer's geometry definitions. */
      definition: number;
      /** Node holding the encoded geometry. */
      resource: number;
      /** Number of encoded vertices. */
      vertexCount: number;
      /** Number of feature rows. */
      featureCount: number;
    };
    /** Feature attribute resource. */ attribute: {
      /** Node holding feature attribute buffers. */
      resource: number;
    };
  };
}
/** Layer descriptors shared by all leaves, produced by the qualified single-mesh writer. */
interface MeshLayer {
  /** Source class description, retained consistently across nodes. */ readonly description?: string;
  /** Storage profile and geographic extent. */ store: {
    /** Geographic rectangle enclosing all nodes. */
    extent: number[];
    /** Legacy binary geometry layout shared by all nodes. */
    defaultGeometrySchema: object;
    /** Resource kinds needed by the layer. */
    resourcePattern: string[];
  };
  /** Public feature schema. */ fields: object[];
  /** Binary feature storage schema. */ attributeStorageInfo: object[];
  /** Per-node materials. */ materialDefinitions: {
    /** PBR material controls copied from the mesh writer. */
    pbrMetallicRoughness?: {
      /** Optional base-color texture profile. */
      baseColorTexture?: {
        /** Index into the layer's texture definitions. */
        textureSetDefinitionId: number;
      };
    };
  }[];
  /** Encoded geometry schemas. */ geometryDefinitions: object[];
  /** Optional texture profiles. */ textureSetDefinitions?: object[];
}

/**
 * Combines independently authored mesh resources into one flat I3S layer.
 * Leaves retain geographic placements, compressed geometry and attributes. A shared schema is
 * required; generated object IDs must be disjoint (the conversion codec allocates them).
 * Finalization rebuilds legacy indices, paged indices and enclosing ECEF bounds, including a
 * second page for the 64th leaf. No source LOD hierarchy is implied. Byte gates bound retained
 * resources and metadata, not peak decoder/compressor memory.
 */
export function createI3SMeshSink(options: I3SMeshSinkOptions): I3SMeshSink {
  const {maxMeshes, maxResourceBytes} = options;
  if (
    !Number.isInteger(maxMeshes) ||
    maxMeshes < 1 ||
    maxMeshes > 64 ||
    !Number.isSafeInteger(maxResourceBytes) ||
    maxResourceBytes < 1
  )
    throw new TileConversionError(
      'I3S_COLLECTION_OPTIONS_INVALID',
      'I3S collections require 1–64 meshes and a positive resource byte limit'
    );
  const memory = createBoundedMemoryTileConversionSink(options);
  const compressor = new GZipCompressor({useNative: false, gzip: {mtime: 0}});
  const decompressor = new GZipDecompressor({useNative: false});
  const leaves: {node: MeshNode; legacy: Record<string, unknown>}[] = [];
  const identifiers = new Set<string>();
  const objectIdRanges: [number, number][] = [];
  let layer: MeshLayer | undefined;
  let schemaKey: string | undefined;
  let state: 'open' | 'writing' | 'closed' = 'open';
  let completed = false;
  /** Decodes writer metadata and rejects documents exceeding the decompressed resource limit. */
  async function readBytes(bytes: ArrayBuffer): Promise<ArrayBuffer> {
    const output = await decompressor.decompress(bytes);
    if (output.byteLength > maxResourceBytes)
      throw new TileConversionError(
        'I3S_COLLECTION_RESOURCE_TOO_LARGE',
        'I3S metadata exceeds maxResourceBytes'
      );
    return output;
  }
  /** Reads one generated compressed JSON document. */
  async function readJson<Value>(
    resource: I3SMeshConversionResource,
    name: string
  ): Promise<Value> {
    return JSON.parse(new TextDecoder().decode(await readBytes(resource.files[name]))) as Value;
  }
  /** Encodes final indices under the same resource and retained-output budgets. */
  async function writeJson(resourceId: string, value: unknown): Promise<void> {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    if (bytes.byteLength > maxResourceBytes)
      throw new TileConversionError(
        'I3S_COLLECTION_RESOURCE_TOO_LARGE',
        'I3S index exceeds maxResourceBytes'
      );
    await memory.write({
      resourceId,
      parts: [await compressor.compress(bytes.buffer)],
      contentType: 'application/gzip'
    });
  }
  return {
    /** Exposes the whole collection atomically. */
    getFiles: () => (completed ? memory.getFiles() : []),
    /** Retains one leaf's binary resources and validates its shared schema and IDs. */
    async write(resource, signal) {
      signal?.throwIfAborted();
      if (state !== 'open' || identifiers.has(resource.id) || leaves.length >= maxMeshes)
        throw new TileConversionError(
          'I3S_COLLECTION_UNAVAILABLE',
          'I3S collection is busy, closed, full, or repeats a placement'
        );
      state = 'writing';
      const authored = await readJson<MeshLayer>(resource, '3dSceneLayer.json.gz');
      const key = JSON.stringify([
        authored.fields,
        authored.attributeStorageInfo,
        authored.description,
        authored.store.defaultGeometrySchema
      ]);
      if (schemaKey !== undefined && key !== schemaKey)
        throw new TileConversionError(
          'I3S_COLLECTION_SCHEMA_MISMATCH',
          'Mesh nodes must share feature fields and the legacy geometry layout'
        );
      const objectIds = new DataView(
        await readBytes(resource.files['nodes/1/attributes/f_0/0.bin.gz'])
      );
      const count = objectIds.getUint32(0, true);
      const first = objectIds.getUint32(4, true);
      if (
        objectIds.byteLength !== 4 + count * 4 ||
        !count ||
        objectIdRanges.some(([start, end]) => first < end && first + count > start) ||
        Array.from({length: count}, (_, index) => objectIds.getUint32(4 + index * 4, true)).some(
          (value, index) => value !== first + index
        )
      )
        throw new TileConversionError(
          'I3S_COLLECTION_IDS_INVALID',
          'Generated object IDs must be contiguous and disjoint across nodes'
        );
      const index = leaves.length + 1;
      const node = (await readJson<{nodes: MeshNode[]}>(resource, 'nodepages/0.json.gz')).nodes[1];
      const legacy = await readJson<Record<string, unknown>>(
        resource,
        'nodes/1/3dNodeIndexDocument.json.gz'
      );
      if (
        node.obb.quaternion.join(',') !== '0,0,0,1' ||
        [...node.obb.center, ...node.obb.halfSize].some(value => !Number.isFinite(value)) ||
        node.obb.halfSize.some(value => value < 0)
      )
        throw new TileConversionError(
          'I3S_COLLECTION_BOUNDS_INVALID',
          'Expected finite axis-aligned bounds from the I3S mesh writer'
        );
      if (!layer) {
        layer = structuredClone(authored);
        layer.materialDefinitions = [];
        layer.geometryDefinitions = [];
        layer.textureSetDefinitions = [];
        schemaKey = key;
      }
      const material = structuredClone(authored.materialDefinitions[0]);
      const texture = material.pbrMetallicRoughness?.baseColorTexture;
      if (texture) {
        texture.textureSetDefinitionId = layer.textureSetDefinitions!.length;
        layer.textureSetDefinitions!.push(authored.textureSetDefinitions![0]);
        node.mesh.material.resource = index;
      }
      node.index = index;
      node.parentIndex = 0;
      node.mesh.material.definition = layer.materialDefinitions.length;
      node.mesh.geometry.definition = layer.geometryDefinitions.length;
      node.mesh.geometry.resource = index;
      node.mesh.attribute.resource = index;
      layer.materialDefinitions.push(material);
      layer.geometryDefinitions.push(authored.geometryDefinitions[0]);
      layer.store.resourcePattern = [
        ...new Set([...layer.store.resourcePattern, ...authored.store.resourcePattern])
      ];
      layer.store.extent = layer.store.extent.map((value, axis) =>
        axis < 2
          ? Math.min(value, authored.store.extent[axis])
          : Math.max(value, authored.store.extent[axis])
      );
      for (const [name, bytes] of Object.entries(resource.files)) {
        if (name.startsWith('nodes/1/') && !name.endsWith('3dNodeIndexDocument.json.gz'))
          await memory.write(
            {
              resourceId: name.replace('nodes/1/', `nodes/${index}/`),
              parts: [bytes],
              contentType: name.endsWith('.gz')
                ? 'application/gzip'
                : name.endsWith('.png')
                  ? 'image/png'
                  : 'image/jpeg'
            },
            signal
          );
      }
      leaves.push({node, legacy: {...legacy, id: String(index)}});
      identifiers.add(resource.id);
      objectIdRanges.push([first, first + count]);
      state = 'open';
    },
    /** Rebuilds both indices and layer bounds only after every leaf has completed. */
    async finalize(report) {
      if (state !== 'open' || !layer || !leaves.length)
        throw new TileConversionError(
          'I3S_COLLECTION_INCOMPLETE',
          'Finalization requires successfully written mesh nodes'
        );
      state = 'writing';
      const minimum = [Infinity, Infinity, Infinity];
      const maximum = [-Infinity, -Infinity, -Infinity];
      for (const {node} of leaves) {
        const center = Ellipsoid.WGS84.cartographicToCartesian(node.obb.center);
        for (let axis = 0; axis < 3; axis++) {
          minimum[axis] = Math.min(minimum[axis], center[axis] - node.obb.halfSize[axis]);
          maximum[axis] = Math.max(maximum[axis], center[axis] + node.obb.halfSize[axis]);
        }
      }
      const center = minimum.map((value, axis) => value / 2 + maximum[axis] / 2);
      const geographicCenter = Array.from(Ellipsoid.WGS84.cartesianToCartographic(center));
      const reconstructedCenter = Ellipsoid.WGS84.cartographicToCartesian(geographicCenter);
      const obb = {
        center: geographicCenter,
        halfSize: minimum.map(
          (value, axis) =>
            maximum[axis] / 2 -
            value / 2 +
            Math.abs(center[axis] - reconstructedCenter[axis]) +
            1e-7
        ),
        quaternion: [0, 0, 0, 1]
      };
      if ([...obb.center, ...obb.halfSize].some(value => !Number.isFinite(value)))
        throw new TileConversionError(
          'I3S_COLLECTION_BOUNDS_INVALID',
          'Collection bounds cannot be represented'
        );
      const mbs = [...obb.center, Math.hypot(...obb.halfSize)];
      const children = leaves.map(({node}) => ({
        id: String(node.index),
        href: `../${node.index}`,
        obb: node.obb,
        mbs: [...node.obb.center, Math.hypot(...node.obb.halfSize)]
      }));
      await writeJson('nodes/root/3dNodeIndexDocument.json.gz', {
        id: 'root',
        level: 0,
        version: '1',
        obb,
        mbs,
        lodSelection: [{metricType: 'maxScreenThresholdSQ', maxError: 0}],
        children
      });
      for (const {node, legacy} of leaves)
        await writeJson(`nodes/${node.index}/3dNodeIndexDocument.json.gz`, {
          ...legacy,
          parentNode: {id: 'root', href: '../root', obb, mbs}
        });
      const nodes = [
        {index: 0, obb, lodThreshold: 0, children: leaves.map(({node}) => node.index)},
        ...leaves.map(({node}) => node)
      ];
      for (let page = 0; page * 64 < nodes.length; page++)
        await writeJson(`nodepages/${page}.json.gz`, {
          nodes: nodes.slice(page * 64, (page + 1) * 64)
        });
      if (!layer.textureSetDefinitions?.length) delete layer.textureSetDefinitions;
      await writeJson('3dSceneLayer.json.gz', layer);
      await writeJson('metadata.json.gz', {
        folderPattern: 'BASIC',
        archiveCompressionType: 'STORE',
        resourceCompressionType: 'GZIP',
        I3SVersion: '1.7',
        nodeCount: nodes.length
      });
      await memory.finalize(report);
      state = 'closed';
      completed = true;
    },
    /** Discards binary resources and index metadata after any failure. */
    async abort(error) {
      completed = false;
      state = 'closed';
      leaves.length = 0;
      identifiers.clear();
      objectIdRanges.length = 0;
      layer = undefined;
      await memory.abort(error);
    }
  };
}
