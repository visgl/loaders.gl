// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {z} from 'zod';
import type {
  MeshGeometry,
  MeshMaterial,
  NodeInPage,
  NodePage,
  Obb,
  SceneLayer3D,
  SpatialReference
} from './types';

/** Zod schema for an I3S oriented bounding box. */
export const I3SObbSchema = z
  .object({
    center: z.array(z.number().finite()).length(3),
    halfSize: z.array(z.number().finite().nonnegative()).length(3),
    quaternion: z.array(z.number().finite()).length(4)
  })
  .passthrough() satisfies z.ZodType<Obb>;

/** Zod schema for an I3S mesh material reference in a node page. */
export const I3SMeshMaterialSchema = z
  .object({
    definition: z.number().int().nonnegative(),
    resource: z.number().int().nonnegative().optional(),
    texelCountHint: z.number().nonnegative().optional()
  })
  .passthrough() satisfies z.ZodType<MeshMaterial>;

/** Zod schema for an I3S mesh geometry reference in a node page. */
export const I3SMeshGeometrySchema = z
  .object({
    definition: z.number().int().nonnegative(),
    resource: z.number().int().nonnegative(),
    vertexCount: z.number().int().nonnegative().optional(),
    featureCount: z.number().int().nonnegative().optional()
  })
  .passthrough() satisfies z.ZodType<MeshGeometry>;

/** Zod schema for one I3S node-page node. */
export const I3SNodeInPageSchema = z
  .object({
    index: z.number().int().nonnegative(),
    parentIndex: z.number().int().nonnegative().optional(),
    lodThreshold: z.number().finite().nonnegative().optional(),
    obb: I3SObbSchema,
    children: z.array(z.number().int().nonnegative()).optional(),
    mesh: z
      .object({
        material: I3SMeshMaterialSchema.optional(),
        geometry: I3SMeshGeometrySchema,
        attribute: z.object({resource: z.number().int().nonnegative()}).passthrough()
      })
      .passthrough()
      .optional()
  })
  .passthrough() satisfies z.ZodType<NodeInPage>;

/** Zod schema for an I3S node-page document. */
export const I3SNodePageSchema = z
  .object({nodes: z.array(I3SNodeInPageSchema)})
  .passthrough() satisfies z.ZodType<NodePage>;

/** Zod schema for an I3S Point Cloud node. */
export const I3SPointCloudNodeSchema = z
  .object({
    resourceId: z.union([z.number().int().nonnegative(), z.string().min(1)]),
    obb: I3SObbSchema,
    vertexCount: z.number().int().nonnegative(),
    lodThreshold: z.number().finite().nonnegative().optional(),
    firstChild: z.number().int().nonnegative().optional(),
    childCount: z.number().int().nonnegative().optional(),
    geometryResource: z.number().int().nonnegative().optional()
  })
  .passthrough();

/** Zod schema for an I3S Point Cloud node-page document. */
export const I3SPointCloudNodePageSchema = z
  .object({nodes: z.array(I3SPointCloudNodeSchema)})
  .passthrough();

/** Zod schema for the spatial-reference metadata used by an I3S scene layer. */
export const I3SSpatialReferenceSchema = z
  .object({
    latestVcsWkid: z.number().int().optional(),
    latestWkid: z.number().int().optional(),
    vcsWkid: z.number().int().optional(),
    wkid: z.number().int().optional(),
    wkt: z.string().min(1).optional()
  })
  .passthrough()
  .refine(
    spatialReference => spatialReference.wkid !== undefined || Boolean(spatialReference.wkt),
    {
      message: 'I3S spatialReference must include wkid or wkt'
    }
  ) satisfies z.ZodType<SpatialReference>;

/** Zod schema for the Point Cloud store/index envelope. */
export const I3SPointCloudStoreSchema = z
  .object({
    profile: z.enum(['pointcloud', 'PointCloud']),
    version: z.union([z.number(), z.string().min(1)]),
    defaultGeometrySchema: z
      .object({
        geometryType: z.string().min(1).optional(),
        topology: z.string().min(1).optional(),
        encoding: z.string().min(1).optional()
      })
      .passthrough(),
    index: z
      .object({nodePerIndexBlock: z.number().int().positive().max(4096)})
      .passthrough()
      .optional()
  })
  .passthrough();

/** Zod schema for an I3S 2.x Point Cloud scene-layer document. */
const I3SPointCloudSceneLayerBaseSchema = z
  .object({
    id: z.number().int().nonnegative(),
    href: z.string().optional(),
    layerType: z.literal('PointCloud'),
    spatialReference: I3SSpatialReferenceSchema.optional(),
    version: z.string().min(1),
    capabilities: z.array(z.string()),
    disablePopup: z.boolean(),
    store: I3SPointCloudStoreSchema,
    nodePages: z
      .object({
        nodesPerPage: z.number().int().positive().max(4096).optional(),
        rootIndex: z.number().int().nonnegative().optional(),
        lodSelectionMetricType: z.enum(['maxScreenThresholdSQ', 'density-threshold']).optional()
      })
      .passthrough()
      .optional(),
    attributeStorageInfo: z.array(z.record(z.string(), z.unknown())).optional(),
    attributeInfo: z.array(z.record(z.string(), z.unknown())).optional()
  })
  .passthrough();

const I3SPointCloudNodePagesRequirementSchema = z.union([
  z
    .object({
      nodePages: z.object({nodesPerPage: z.number().int().positive().max(4096)}).passthrough()
    })
    .passthrough(),
  z
    .object({
      store: z
        .object({
          index: z.object({nodePerIndexBlock: z.number().int().positive().max(4096)}).passthrough()
        })
        .passthrough()
    })
    .passthrough()
]);

/** Zod schema for an I3S 2.x Point Cloud scene-layer document. */
export const I3SPointCloudSceneLayerSchema = I3SPointCloudSceneLayerBaseSchema.and(
  I3SPointCloudNodePagesRequirementSchema
);

const I3SGeometryBufferItemSchema = z
  .object({
    type: z.string(),
    component: z.number().int().positive(),
    encoding: z.string().optional(),
    binding: z.string().optional()
  })
  .passthrough();

const I3SGeometryBufferSchema = z
  .object({
    offset: z.number().int().nonnegative().optional(),
    position: I3SGeometryBufferItemSchema.optional(),
    normal: I3SGeometryBufferItemSchema.optional(),
    uv0: I3SGeometryBufferItemSchema.optional(),
    uv1: I3SGeometryBufferItemSchema.optional(),
    color: I3SGeometryBufferItemSchema.optional(),
    uvRegion: I3SGeometryBufferItemSchema.optional(),
    featureId: I3SGeometryBufferItemSchema.optional(),
    faceRange: I3SGeometryBufferItemSchema.optional(),
    compressedAttributes: z
      .object({encoding: z.string(), attributes: z.array(z.string())})
      .passthrough()
      .optional()
  })
  .passthrough();

const I3SGeometryDefinitionSchema = z
  .object({
    topology: z.enum(['triangle', 'point']).optional(),
    geometryBuffers: z.array(I3SGeometryBufferSchema)
  })
  .passthrough();

/** Zod schema for raw I3S 3D Object and Integrated Mesh scene-layer metadata. */
export const I3SSceneLayerSchema = z
  .object({
    id: z.number().int().nonnegative(),
    href: z.string().optional(),
    layerType: z.enum(['3DObject', 'IntegratedMesh', 'Point', 'PointCloud']),
    spatialReference: I3SSpatialReferenceSchema.optional(),
    version: z.string().min(1),
    name: z.string().optional(),
    capabilities: z.array(z.string()),
    disablePopup: z.boolean(),
    store: z
      .object({
        profile: z.string().min(1),
        version: z.union([z.number(), z.string().min(1)]),
        defaultGeometrySchema: z.any().optional()
      })
      .passthrough(),
    nodePages: z
      .object({
        nodesPerPage: z.number().int().positive().max(4096),
        rootIndex: z.number().int().nonnegative().optional(),
        lodSelectionMetricType: z.union([
          z.literal('maxScreenThresholdSQ'),
          z.literal('density-threshold')
        ])
      })
      .passthrough()
      .optional(),
    pointNodePages: z
      .object({
        nodesPerPage: z.number().int().positive().max(4096),
        rootIndex: z.number().int().nonnegative().optional(),
        lodSelectionMetricType: z.union([
          z.literal('maxScreenThreshold'),
          z.literal('maxScreenThresholdSQ'),
          z.literal('screenSpaceRelative'),
          z.literal('distanceRangeFromDefaultCamera')
        ])
      })
      .passthrough()
      .optional(),
    geometryDefinitions: z.array(I3SGeometryDefinitionSchema).optional()
  })
  .passthrough() satisfies z.ZodType<SceneLayer3D>;

/** Zod schema for an I3S Point scene-layer document. */
export const I3SPointSceneLayerSchema = I3SSceneLayerSchema.refine(
  layer =>
    layer.layerType === 'Point' &&
    layer.store.profile.toLowerCase() === 'points' &&
    Boolean(layer.pointNodePages) &&
    Boolean(layer.geometryDefinitions?.length),
  {
    message:
      'I3S Point layers require store.profile "points", pointNodePages, and geometryDefinitions'
  }
);
