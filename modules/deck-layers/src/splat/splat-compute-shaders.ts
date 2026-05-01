// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Workgroup size used by the splat projection kernels. */
export const SPLAT_COMPUTE_WORKGROUP_SIZE = 256;

/** Number of f32 values in the splat compute parameter buffer. */
export const SPLAT_COMPUTE_F32_PARAM_COUNT = 48;

/** Number of u32 values in the splat compute parameter buffer. */
export const SPLAT_COMPUTE_U32_PARAM_COUNT = 8;

/** Byte length of the uniform parameter buffer consumed by compute kernels. */
export const SPLAT_COMPUTE_PARAM_BYTE_LENGTH = 224;

/** WGSL source for WebGPU projection, tile binning, and tile-local sorting. */
export const SPLAT_COMPUTE_SHADER = /* wgsl */ `\
const WORKGROUP_SIZE: u32 = 256u;
const TILE_SORT_MAX_SPLATS: u32 = 1024u;
const INVALID_KEY: u32 = 4294967295u;

@group(0) @binding(0) var<storage, read> positions: array<f32>;
@group(0) @binding(1) var<storage, read> scales: array<f32>;
@group(0) @binding(2) var<storage, read> rotations: array<f32>;
@group(0) @binding(3) var<storage, read> opacities: array<f32>;
@group(0) @binding(4) var<storage, read_write> keys: array<u32>;
@group(0) @binding(5) var<storage, read_write> indices: array<u32>;
@group(0) @binding(6) var<storage, read_write> projected: array<vec4<f32>>;
@group(0) @binding(7) var<storage, read_write> tileCounts: array<atomic<u32>>;
@group(0) @binding(8) var<storage, read_write> tileOffsets: array<u32>;
@group(0) @binding(9) var<storage, read_write> tileCursors: array<atomic<u32>>;
@group(0) @binding(10) var<storage, read_write> tileIndices: array<u32>;
@group(0) @binding(11) var<storage, read_write> tileKeys: array<u32>;
@group(0) @binding(12) var<storage, read_write> tempTileIndices: array<u32>;
@group(0) @binding(13) var<storage, read_write> tempTileKeys: array<u32>;
@group(0) @binding(14) var<storage, read_write> counts: array<atomic<u32>>;

struct Params {
  viewProjection: mat4x4<f32>,
  viewportAlpha: vec4<f32>,
  radius: vec4<f32>,
  plane0: vec4<f32>,
  plane1: vec4<f32>,
  plane2: vec4<f32>,
  plane3: vec4<f32>,
  plane4: vec4<f32>,
  plane5: vec4<f32>,
  counts0: vec4<u32>,
  counts1: vec4<u32>,
};

@group(0) @binding(15) var<uniform> params: Params;

var<workgroup> localKeys: array<u32, 1024>;
var<workgroup> localIndices: array<u32, 1024>;

fn getMatrixColumn(column: u32) -> vec4<f32> {
  return params.viewProjection[column];
}

fn transformPosition(position: vec3<f32>) -> vec4<f32> {
  return getMatrixColumn(0u) * position.x +
    getMatrixColumn(1u) * position.y +
    getMatrixColumn(2u) * position.z +
    getMatrixColumn(3u);
}

fn projectToScreen(position: vec3<f32>) -> vec2<f32> {
  let clip = transformPosition(position);
  let inverseW = select(0.0, 1.0 / clip.w, abs(clip.w) > 0.000001);
  let normalized = clip.xy * inverseW;
  return vec2<f32>(
    (normalized.x * 0.5 + 0.5) * params.viewportAlpha.x,
    (0.5 - normalized.y * 0.5) * params.viewportAlpha.y
  );
}

fn normalizeQuaternion(quaternion: vec4<f32>) -> vec4<f32> {
  let lengthValue = length(quaternion);
  return select(vec4<f32>(1.0, 0.0, 0.0, 0.0), quaternion / lengthValue, lengthValue > 0.000001);
}

fn getScaledAxis(rotation: vec4<f32>, scale: vec3<f32>, axis: u32) -> vec3<f32> {
  let q = normalizeQuaternion(rotation);
  let w = q.x;
  let x = q.y;
  let y = q.z;
  let z = q.w;
  if (axis == 0u) {
    return vec3<f32>(
      1.0 - 2.0 * (y * y + z * z),
      2.0 * (x * y + w * z),
      2.0 * (x * z - w * y)
    ) * scale.x;
  }
  if (axis == 1u) {
    return vec3<f32>(
      2.0 * (x * y - w * z),
      1.0 - 2.0 * (x * x + z * z),
      2.0 * (y * z + w * x)
    ) * scale.y;
  }
  return vec3<f32>(
    2.0 * (x * z + w * y),
    2.0 * (y * z - w * x),
    1.0 - 2.0 * (x * x + y * y)
  ) * scale.z;
}

fn getCovarianceAxes(covariance00: f32, covariance01: f32, covariance11: f32) -> vec4<f32> {
  let trace = covariance00 + covariance11;
  let difference = covariance00 - covariance11;
  let discriminant = sqrt(max(difference * difference * 0.25 + covariance01 * covariance01, 0.0));
  let lambda0 = max(trace * 0.5 + discriminant, 0.0);
  let lambda1 = max(trace * 0.5 - discriminant, 0.0);
  var eigen = vec2<f32>(covariance01, lambda0 - covariance00);
  if (length(eigen) <= 0.000001) {
    eigen = vec2<f32>(lambda0 - covariance11, covariance01);
  }
  if (length(eigen) <= 0.000001) {
    eigen = vec2<f32>(1.0, 0.0);
  } else {
    eigen = normalize(eigen);
  }
  let axis0 = eigen * max(sqrt(lambda0), 0.001);
  let axis1 = vec2<f32>(-eigen.y, eigen.x) * max(sqrt(lambda1), 0.001);
  return vec4<f32>(axis0, axis1);
}

fn getMaxAxisPixels(axes: vec4<f32>) -> f32 {
  return max(length(axes.xy), length(axes.zw));
}

fn clampAxes(axes: vec4<f32>, maxAxisPixels: f32) -> vec4<f32> {
  let currentMaxAxisPixels = getMaxAxisPixels(axes);
  if (currentMaxAxisPixels <= maxAxisPixels) {
    return axes;
  }
  return axes * (maxAxisPixels / max(currentMaxAxisPixels, 0.000001));
}

fn getTileId(screenPosition: vec2<f32>) -> u32 {
  let tileSize = max(params.counts0.w, 1u);
  let safeX = clamp(screenPosition.x, 0.0, max(params.viewportAlpha.x - 1.0, 0.0));
  let safeY = clamp(screenPosition.y, 0.0, max(params.viewportAlpha.y - 1.0, 0.0));
  let column = min(u32(safeX) / tileSize, params.counts0.y - 1u);
  let row = min(u32(safeY) / tileSize, params.counts0.z - 1u);
  return row * params.counts0.y + column;
}

fn getDepthKey(clip: vec4<f32>, index: u32) -> u32 {
  let inverseW = select(0.0, 1.0 / clip.w, abs(clip.w) > 0.000001);
  let normalizedDepth = clamp(clip.z * inverseW * 0.5 + 0.5, 0.0, 1.0);
  let quantizedDepth = u32(normalizedDepth * 16777215.0);
  let reversedDepth = 16777215u - quantizedDepth;
  return (reversedDepth << 8u) | (index & 255u);
}

fn isInsideFrustum(position: vec3<f32>, radius: f32) -> bool {
  for (var planeIndex = 0u; planeIndex < 6u; planeIndex = planeIndex + 1u) {
    var plane = params.plane0;
    if (planeIndex == 1u) {
      plane = params.plane1;
    } else if (planeIndex == 2u) {
      plane = params.plane2;
    } else if (planeIndex == 3u) {
      plane = params.plane3;
    } else if (planeIndex == 4u) {
      plane = params.plane4;
    } else if (planeIndex == 5u) {
      plane = params.plane5;
    }
    if (dot(plane.xyz, position) + plane.w < -radius) {
      return false;
    }
  }
  return true;
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn clear(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index == 0u) {
    atomicStore(&counts[0u], 0u);
    atomicStore(&counts[1u], 0u);
  }
  if (index <= params.counts1.x) {
    tileOffsets[index] = 0u;
  }
  if (index < params.counts1.x) {
    atomicStore(&tileCounts[index], 0u);
    atomicStore(&tileCursors[index], 0u);
  }
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn project(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index >= params.counts0.x) {
    return;
  }

  let positionIndex = index * 3u;
  let rotationIndex = index * 4u;
  let position = vec3<f32>(
    positions[positionIndex + 0u],
    positions[positionIndex + 1u],
    positions[positionIndex + 2u]
  );
  let scale = vec3<f32>(
    scales[positionIndex + 0u],
    scales[positionIndex + 1u],
    scales[positionIndex + 2u]
  );
  let rotation = vec4<f32>(
    rotations[rotationIndex + 0u],
    rotations[rotationIndex + 1u],
    rotations[rotationIndex + 2u],
    rotations[rotationIndex + 3u]
  );
  let center = projectToScreen(position);
  var covariance00 = 0.0;
  var covariance01 = 0.0;
  var covariance11 = 0.0;
  for (var axis = 0u; axis < 3u; axis = axis + 1u) {
    let endpoint = projectToScreen(position + getScaledAxis(rotation, scale, axis));
    let delta = endpoint - center;
    covariance00 = covariance00 + delta.x * delta.x;
    covariance01 = covariance01 + delta.x * delta.y;
    covariance11 = covariance11 + delta.y * delta.y;
  }

  let kernelVariance = params.radius.z * params.radius.z;
  let rawAxes = getCovarianceAxes(covariance00 + kernelVariance, covariance01, covariance11 + kernelVariance);
  let axes = clampAxes(rawAxes, params.radius.w);
  let maxAxisPixels = getMaxAxisPixels(axes);
  let opacity = opacities[index];
  let renderedMaxAxisPixels = maxAxisPixels * params.viewportAlpha.w * params.radius.x;
  let boundingRadius = max(max(scale.x, scale.y), scale.z) * params.radius.x;
  let visible = opacity >= params.viewportAlpha.z &&
    renderedMaxAxisPixels >= params.radius.y &&
    isInsideFrustum(position, boundingRadius);
  let projectedBase = index * 2u;
  projected[projectedBase] = axes;
  projected[projectedBase + 1u] = vec4<f32>(opacity, select(0.0, 1.0, visible), maxAxisPixels, 0.0);

  let clip = transformPosition(position);
  let key = getDepthKey(clip, index);
  keys[index] = key;
  if (visible) {
    let tileId = getTileId(center);
    atomicAdd(&tileCounts[tileId], 1u);
  }
}

@compute @workgroup_size(1)
fn scanTiles() {
  var offset = 0u;
  for (var tile = 0u; tile < params.counts1.x; tile = tile + 1u) {
    let count = atomicLoad(&tileCounts[tile]);
    tileOffsets[tile] = offset;
    atomicStore(&tileCursors[tile], offset);
    offset = offset + count;
  }
  tileOffsets[params.counts1.x] = offset;
  atomicStore(&counts[0u], offset);
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn scatterTiles(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index >= params.counts0.x) {
    return;
  }
  if (projected[index * 2u + 1u].y == 0.0) {
    return;
  }
  let positionIndex = index * 3u;
  let center = projectToScreen(vec3<f32>(
    positions[positionIndex + 0u],
    positions[positionIndex + 1u],
    positions[positionIndex + 2u]
  ));
  let tileId = getTileId(center);
  let dst = atomicAdd(&tileCursors[tileId], 1u);
  tileIndices[dst] = index;
  tileKeys[dst] = keys[index];
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn tileSort(@builtin(workgroup_id) workgroupId: vec3<u32>, @builtin(local_invocation_id) localId: vec3<u32>) {
  let tile = workgroupId.x;
  if (tile >= params.counts1.x) {
    return;
  }
  let start = tileOffsets[tile];
  let end = tileOffsets[tile + 1u];
  let count = end - start;
  let sortedCount = min(count, TILE_SORT_MAX_SPLATS);

  for (var localIndex = localId.x; localIndex < TILE_SORT_MAX_SPLATS; localIndex = localIndex + WORKGROUP_SIZE) {
    if (localIndex < sortedCount) {
      localKeys[localIndex] = tileKeys[start + localIndex];
      localIndices[localIndex] = tileIndices[start + localIndex];
    } else {
      localKeys[localIndex] = INVALID_KEY;
      localIndices[localIndex] = 0u;
    }
  }
  workgroupBarrier();

  var k = 2u;
  while (k <= TILE_SORT_MAX_SPLATS) {
    var j = k / 2u;
    while (j > 0u) {
      for (var i = localId.x; i < TILE_SORT_MAX_SPLATS; i = i + WORKGROUP_SIZE) {
        let ixj = i ^ j;
        if (ixj > i) {
          let ascending = (i & k) == 0u;
          let keyI = localKeys[i];
          let keyJ = localKeys[ixj];
          if ((ascending && keyI > keyJ) || (!ascending && keyI < keyJ)) {
            localKeys[i] = keyJ;
            localKeys[ixj] = keyI;
            let indexI = localIndices[i];
            localIndices[i] = localIndices[ixj];
            localIndices[ixj] = indexI;
          }
        }
      }
      workgroupBarrier();
      j = j / 2u;
    }
    k = k * 2u;
  }

  for (var localIndex = localId.x; localIndex < sortedCount; localIndex = localIndex + WORKGROUP_SIZE) {
    tileKeys[start + localIndex] = localKeys[localIndex];
    tileIndices[start + localIndex] = localIndices[localIndex];
  }
  if (localId.x == 0u && count > TILE_SORT_MAX_SPLATS) {
    atomicAdd(&counts[1u], count - TILE_SORT_MAX_SPLATS);
  }
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn copySorted(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  let count = atomicLoad(&counts[0u]);
  if (index >= count) {
    return;
  }
  if (params.counts1.y == 2u) {
    indices[index] = tileIndices[index];
  } else {
    indices[index] = tileIndices[index];
  }
}
`;
