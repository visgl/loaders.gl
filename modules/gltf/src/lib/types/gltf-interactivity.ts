// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTF} from './gltf-json-schema';

/** KHR_interactivity graph structures are preserved verbatim by GLTFLoader. */
export type GLTFInteractivityValue = {type?: number; value?: unknown; [key: string]: unknown};
export type GLTFInteractivitySocket = {node?: number; socket?: string; [key: string]: unknown};
export type GLTFInteractivityNode = {
  declaration: number;
  values?: Record<string, GLTFInteractivityValue>;
  flows?: Record<string, GLTFInteractivitySocket>;
  configuration?: Record<string, GLTFInteractivityValue>;
  [key: string]: unknown;
};
export type GLTFInteractivityDeclaration = {
  op: string;
  extension?: string;
  inputValueSockets?: Record<string, {type: number}>;
  outputValueSockets?: Record<string, {type: number}>;
  [key: string]: unknown;
};
export type GLTFInteractivityGraph = {
  nodes: GLTFInteractivityNode[];
  variables?: Array<{type: number; value?: unknown; [key: string]: unknown}>;
  events?: Array<{id: string; [key: string]: unknown}>;
  [key: string]: unknown;
};
export type GLTF_KHR_interactivity = {
  declarations: GLTFInteractivityDeclaration[];
  types: Array<{signature: string; [key: string]: unknown}>;
  graphs: GLTFInteractivityGraph[];
  [key: string]: unknown;
};

/** Read the raw extension without modifying graph indices or property pointers. */
export function getGLTFInteractivity(
  gltf: GLTF | {json: GLTF}
): GLTF_KHR_interactivity | null {
  const json = 'json' in gltf ? gltf.json : gltf;
  const extension = json.extensions?.KHR_interactivity as GLTF_KHR_interactivity | undefined;
  return extension ?? null;
}
