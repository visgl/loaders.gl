import {GLTFTextureInfoMetadata} from './gltf-json-schema';
/* eslint-disable camelcase */

/**
 * EXT_mesh_features extension types
 * This is a primitive-level extension.
 * An object describing feature IDs for a mesh primitive.
 * @see https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features
 * or https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_mesh_features/schema/mesh.primitive.EXT_mesh_features.schema.json
 */
export type GLTF_EXT_mesh_features = {
  /** An array of feature ID sets. */
  featureIds: GLTF_EXT_mesh_features_featureId[];
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * Feature IDs stored in an attribute or texture.
 * @see https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_mesh_features/schema/featureId.schema.json
 */
export type GLTF_EXT_mesh_features_featureId = {
  /** The number of unique features in the attribute or texture. */
  featureCount: number;
  /** A value that indicates that no feature is associated with this vertex or texel. */
  nullFeatureId?: number;
  /** A label assigned to this feature ID set. Labels must be alphanumeric identifiers matching the regular expression `^[a-zA-Z_][a-zA-Z0-9_]*$`. */
  label?: string;
  /**
   * An attribute containing feature IDs.
   * When `attribute` and `texture` are omitted the feature IDs are assigned to vertices by their index.
   * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features/schema/featureIdAttribute.schema.json
   * An integer value used to construct a string in the format `_FEATURE_ID_<set index>` which is a reference to a key in `mesh.primitives.attributes`
   * (e.g. a value of `0` corresponds to `_FEATURE_ID_0`).
   */
  attribute?: number;
  /** A texture containing feature IDs.
   * @see https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_mesh_features/schema/featureIdTexture.schema.json
   */
  texture?: GLTFTextureInfoMetadata;
  /** The index of the property table containing per-feature property values. Only applicable when using the `EXT_structural_metadata` extension. */
  propertyTable?: number;
  extensions?: Record<string, unknown>;
  extras?: unknown;

  /** This is not part of the spec. GLTFLoader loads feature tables data into this property */
  data?: unknown;
};
