// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** WGSL projection shader source reserved for the WebGPU splat engine. */
export const SPLAT_PROJECT_WGSL = /* wgsl */ `
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  _ = global_id;
}
`;

/** WGSL radix-sort shader source reserved for the WebGPU splat engine. */
export const SPLAT_RADIX_SORT_WGSL = /* wgsl */ `
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  _ = global_id;
}
`;
