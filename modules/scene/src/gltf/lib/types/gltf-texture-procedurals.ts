// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/** Serialized value types in the experimental procedural graph proposal. */
export type GLTFProceduralValueType =
  | 'boolean'
  | 'float'
  | 'integer'
  | 'color3'
  | 'color4'
  | 'vector2'
  | 'vector3'
  | 'vector4'
  | 'integer2'
  | 'integer3'
  | 'integer4'
  | 'matrix3x3'
  | 'matrix4x4'
  | 'string'
  | 'filename';

/** Named graph port, retaining serialized connections without evaluating them. */
export interface GLTFProceduralPort {
  /** Port category. */
  nodetype: 'input' | 'output';
  /** Declared value type. */
  type: GLTFProceduralValueType;
  /** Authored constant; scalar numeric arrays are retained as authored. */
  value?: boolean | string | number | number[];
  /** Upstream processing node index. */
  node?: number;
  /** Name of a graph interface input. */
  input?: string;
  /** Name of the selected upstream output. */
  output?: string;
}

/** Processing node in a procedural graph. */
export interface GLTFProceduralNode {
  /** Optional display name. */
  name?: string;
  /** MaterialX or custom node category; unknown categories are retained. */
  nodetype: string;
  /** Single output type, or multiple named outputs. */
  type: GLTFProceduralValueType | 'multioutput';
  /** Named input ports. */
  inputs?: Record<string, GLTFProceduralPort>;
  /** Named output ports. */
  outputs: Record<string, GLTFProceduralPort>;
}

/** Flat procedural graph using the draft's named-port representation. */
export interface GLTFProceduralGraph extends GLTFProceduralNode {
  /** Graph category. */
  nodetype: 'nodegraph';
  /** Processing nodes addressed by index. */
  nodes: GLTFProceduralNode[];
}

/** Procedural output attached to a material texture-info object. */
export interface GLTFProceduralBinding {
  /** Index into the root extension's procedurals array. */
  index: number;
  /** Selected output name; required for graphs with multiple outputs. */
  output?: string;
}
