"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["38930"],{22761(t,e,i){i.r(e),i.d(e,{IconLayer:()=>L.A,_MultiIconLayer:()=>tb.A,ColumnLayer:()=>Q,TextLayer:()=>tS.A,GridCellLayer:()=>tg,ArcLayer:()=>b,PointCloudLayer:()=>A.A,PolygonLayer:()=>t_,LineLayer:()=>w.A,ScatterplotLayer:()=>R.A,PathLayer:()=>td.A,_TextBackgroundLayer:()=>tI.A,BitmapLayer:()=>I.A,GeoJsonLayer:()=>tC.A,SolidPolygonLayer:()=>th.A});var o=i(66260),s=i(84175),n=i(46487),r=i(19754),a=i(9350),l=i(88599),c=i(62459),u=i(60608);let g={sourcePositions:{attribute:"instanceSourcePositions",accessor:"getSourcePosition",semantic:"position",size:3},targetPositions:{attribute:"instanceTargetPositions",accessor:"getTargetPosition",semantic:"position",size:3},sourceColors:{attribute:"instanceSourceColors",accessor:"getSourceColor",semantic:"color",size:4},targetColors:{attribute:"instanceTargetColors",accessor:"getTargetColor",semantic:"color",size:4},widths:{attribute:"instanceWidths",accessor:"getWidth",semantic:"scalar",size:1,defaultValue:1},heights:{attribute:"instanceHeights",accessor:"getHeight",semantic:"scalar",size:1,defaultValue:1},tilts:{attribute:"instanceTilts",accessor:"getTilt",semantic:"scalar",size:1}};function d(t){return Object.keys(g).some(e=>!!t[e])}class f extends u.h{constructor(t){super(t,g,"Arc")}}let p=`\
layout(std140) uniform arcUniforms {
  highp uint rowIndexOffset;
  bool greatCircle;
  bool useShortestPath;
  float numSegments;
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  highp int widthUnits;
} arc;
`,h={name:"arc",source:`\
struct ArcUniforms {
  rowIndexOffset: u32,
  greatCircle: f32,
  useShortestPath: f32,
  numSegments: f32,
  widthScale: f32,
  widthMinPixels: f32,
  widthMaxPixels: f32,
  widthUnits: i32,
};

@group(0) @binding(auto) var<uniform> arc: ArcUniforms;
`,vs:p,fs:p,uniformTypes:{rowIndexOffset:"u32",greatCircle:"f32",useShortestPath:"f32",numSegments:"f32",widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",widthUnits:"i32"}},m=`\
const ZERO_OFFSET: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);

struct Attributes {
  @location(0) instanceSourcePositions: vec3<f32>,
  @location(1) instanceSourcePositions64Low: vec3<f32>,
  @location(2) instanceTargetPositions: vec3<f32>,
  @location(3) instanceTargetPositions64Low: vec3<f32>,
  @location(4) instanceSourceColors: vec4<f32>,
  @location(5) instanceTargetColors: vec4<f32>,
  @location(6) instanceWidths: f32,
  @location(7) instanceHeights: f32,
  @location(8) instanceTilts: f32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) pickingColor: vec3<f32>,
  @location(3) isValid: f32,
};

fn paraboloid(
  distance: f32,
  sourceZ: f32,
  targetZ: f32,
  ratio: f32,
  height: f32
) -> f32 {
  let deltaZ = targetZ - sourceZ;
  let dh = distance * height;
  if (dh == 0.0) {
    return sourceZ + deltaZ * ratio;
  }
  let unitZ = deltaZ / dh;
  let p2 = unitZ * unitZ + 1.0;
  let dir = select(0.0, 1.0, deltaZ <= 0.0);
  let z0 = mix(sourceZ, targetZ, dir);
  let r = mix(ratio, 1.0 - ratio, dir);
  return sqrt(max(r * (p2 - r), 0.0)) * dh + z0;
}

fn getExtrusionOffset(lineClipspace: vec2<f32>, side: f32, width: f32) -> vec2<f32> {
  var direction = normalize(lineClipspace * project.viewportSize);
  // Rotate by 90\xb0 clockwise so the strip (-1 side first) winds counter-clockwise
  direction = vec2<f32>(direction.y, -direction.x);
  return direction * side * width / 2.0;
}

fn getSegmentRatio(index: f32) -> f32 {
  return smoothstep(0.0, 1.0, index / max(arc.numSegments - 1.0, 1.0));
}

fn interpolateFlat(
  source: vec3<f32>,
  targetPosition: vec3<f32>,
  ratio: f32,
  height: f32,
  tiltDegrees: f32
) -> vec3<f32> {
  let distance = length(source.xy - targetPosition.xy);
  let z = paraboloid(distance, source.z, targetPosition.z, ratio, height);
  let tiltAngle = radians(tiltDegrees);
  let tiltDirection = normalize(targetPosition.xy - source.xy);
  let tilt = vec2<f32>(-tiltDirection.y, tiltDirection.x) * z * sin(tiltAngle);
  return vec3<f32>(mix(source.xy, targetPosition.xy, ratio) + tilt, z * cos(tiltAngle));
}

// Great circle interpolation
// http://www.movable-type.co.uk/scripts/latlong.html
fn getAngularDistance(source: vec2<f32>, targetPosition: vec2<f32>) -> f32 {
  let sourceRadians = radians(source);
  let targetRadians = radians(targetPosition);
  let sinHalfDelta = sin((sourceRadians - targetRadians) / 2.0);
  let sinHalfDeltaSquared = sinHalfDelta * sinHalfDelta;
  let a = sinHalfDeltaSquared.y +
    cos(sourceRadians.y) * cos(targetRadians.y) * sinHalfDeltaSquared.x;
  return 2.0 * asin(sqrt(a));
}

fn interpolateGreatCircle(
  source: vec3<f32>,
  targetPosition: vec3<f32>,
  source3D: vec3<f32>,
  target3D: vec3<f32>,
  angularDistance: f32,
  ratio: f32,
  height: f32
) -> vec3<f32> {
  var longitudeLatitude: vec2<f32>;

  // If the angular distance is PI, use linear interpolation. Otherwise use spherical interpolation.
  if (abs(angularDistance - PI) < 0.001) {
    longitudeLatitude = (1.0 - ratio) * source.xy + ratio * targetPosition.xy;
  } else {
    let a = sin((1.0 - ratio) * angularDistance);
    let b = sin(ratio * angularDistance);
    let p = source3D.yxz * a + target3D.yxz * b;
    longitudeLatitude = degrees(vec2<f32>(
      atan2(p.y, -p.x),
      atan2(p.z, length(p.xy))
    ));
  }

  let z = paraboloid(
    angularDistance * EARTH_RADIUS,
    source.z,
    targetPosition.z,
    ratio,
    height
  );
  return vec3<f32>(longitudeLatitude, z);
}

@vertex
fn vertexMain(
  attributes: Attributes,
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> Varyings {
  geometry.worldPosition = attributes.instanceSourcePositions;
  geometry.worldPositionAlt = attributes.instanceTargetPositions;

  let segmentIndex = f32(vertexIndex / 2u);
  let segmentSide = select(-1.0, 1.0, vertexIndex % 2u == 1u);
  var segmentRatio = getSegmentRatio(segmentIndex);
  let previousRatio = getSegmentRatio(max(0.0, segmentIndex - 1.0));
  var nextRatio = getSegmentRatio(min(arc.numSegments - 1.0, segmentIndex + 1.0));
  // If this is the first point, use next - current as direction.
  var indexDirection = select(-1.0, 1.0, segmentIndex <= 0.0);
  var isValid = 1.0;

  var currentClip: vec4<f32>;
  var nextClip: vec4<f32>;

  if (
    (arc.greatCircle != 0.0 || project.projectionMode == PROJECTION_MODE_GLOBE) &&
    project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC && project.projectionMode != PROJECTION_MODE_GEODETIC_OFFSETS
  ) {
    let source = project_globe_(vec3<f32>(attributes.instanceSourcePositions.xy, 0.0));
    let targetPosition = project_globe_(vec3<f32>(attributes.instanceTargetPositions.xy, 0.0));
    let angularDistance = getAngularDistance(
      attributes.instanceSourcePositions.xy,
      attributes.instanceTargetPositions.xy
    );

    let previousPosition = interpolateGreatCircle(
      attributes.instanceSourcePositions,
      attributes.instanceTargetPositions,
      source,
      targetPosition,
      angularDistance,
      previousRatio,
      attributes.instanceHeights
    );
    var currentPosition = interpolateGreatCircle(
      attributes.instanceSourcePositions,
      attributes.instanceTargetPositions,
      source,
      targetPosition,
      angularDistance,
      segmentRatio,
      attributes.instanceHeights
    );
    var nextPosition = interpolateGreatCircle(
      attributes.instanceSourcePositions,
      attributes.instanceTargetPositions,
      source,
      targetPosition,
      angularDistance,
      nextRatio,
      attributes.instanceHeights
    );

    if (abs(currentPosition.x - previousPosition.x) > 180.0) {
      indexDirection = -1.0;
      isValid = 0.0;
    } else if (abs(currentPosition.x - nextPosition.x) > 180.0) {
      indexDirection = 1.0;
      isValid = 0.0;
    }
    nextPosition = select(nextPosition, previousPosition, indexDirection < 0.0);
    nextRatio = select(nextRatio, previousRatio, indexDirection < 0.0);

    if (isValid == 0.0) {
      // Split at the antimeridian.
      nextPosition.x += select(360.0, -360.0, nextPosition.x > 0.0);
      let ratio = (
        select(-180.0, 180.0, currentPosition.x > 0.0) - currentPosition.x
      ) / (nextPosition.x - currentPosition.x);
      currentPosition = mix(currentPosition, nextPosition, ratio);
      segmentRatio = mix(segmentRatio, nextRatio, ratio);
    }

    let currentPosition64Low = mix(
      attributes.instanceSourcePositions64Low,
      attributes.instanceTargetPositions64Low,
      segmentRatio
    );
    let nextPosition64Low = mix(
      attributes.instanceSourcePositions64Low,
      attributes.instanceTargetPositions64Low,
      nextRatio
    );
    let currentProjection = project_position_to_clipspace_and_commonspace(
      currentPosition,
      currentPosition64Low,
      ZERO_OFFSET
    );
    currentClip = currentProjection.clipPosition;
    nextClip = project_position_to_clipspace(nextPosition, nextPosition64Low, ZERO_OFFSET);
    geometry.position = currentProjection.commonPosition;
  } else {
    var sourceWorld = attributes.instanceSourcePositions;
    var targetWorld = attributes.instanceTargetPositions;
    if (arc.useShortestPath != 0.0) {
      sourceWorld.x = ((sourceWorld.x + 180.0) % 360.0) - 180.0;
      targetWorld.x = ((targetWorld.x + 180.0) % 360.0) - 180.0;
      let deltaLongitude = targetWorld.x - sourceWorld.x;
      if (deltaLongitude > 180.0) {
        targetWorld.x -= 360.0;
      }
      if (deltaLongitude < -180.0) {
        sourceWorld.x -= 360.0;
      }
    }

    let source = project_position_vec3_f64(
      sourceWorld,
      attributes.instanceSourcePositions64Low
    );
    let targetPosition = project_position_vec3_f64(
      targetWorld,
      attributes.instanceTargetPositions64Low
    );

    // Common x at longitude=-180.
    var antimeridianX = 0.0;
    if (arc.useShortestPath != 0.0) {
      if ((project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET || project.projectionMode == PROJECTION_MODE_GEODETIC_OFFSETS)) {
        antimeridianX = -(project.coordinateOrigin.x + 180.0) / 360.0 * TILE_SIZE;
      }
      let thresholdRatio = (antimeridianX - source.x) / (targetPosition.x - source.x);
      if (previousRatio <= thresholdRatio && nextRatio > thresholdRatio) {
        isValid = 0.0;
        indexDirection = sign(segmentRatio - thresholdRatio);
        segmentRatio = thresholdRatio;
      }
    }

    nextRatio = select(nextRatio, previousRatio, indexDirection < 0.0);
    var currentPosition = interpolateFlat(
      source,
      targetPosition,
      segmentRatio,
      attributes.instanceHeights,
      attributes.instanceTilts
    );
    var nextPosition = interpolateFlat(
      source,
      targetPosition,
      nextRatio,
      attributes.instanceHeights,
      attributes.instanceTilts
    );

    if (arc.useShortestPath != 0.0 && nextPosition.x < antimeridianX) {
      currentPosition.x += TILE_SIZE;
      nextPosition.x += TILE_SIZE;
    }

    currentClip = project_common_position_to_clipspace(vec4<f32>(currentPosition, 1.0));
    nextClip = project_common_position_to_clipspace(vec4<f32>(nextPosition, 1.0));
    geometry.position = vec4<f32>(currentPosition, 1.0);
  }

  geometry.uv = vec2<f32>(segmentRatio, segmentSide);
  geometry.pickingColor = picking_getPickingColorFromIndex(instanceIndex + arc.rowIndexOffset);

  let widthPixels = clamp(
    project_unit_size_to_pixel(attributes.instanceWidths * arc.widthScale, arc.widthUnits),
    arc.widthMinPixels,
    arc.widthMaxPixels
  );
  var offset = getExtrusionOffset(
    (nextClip.xy - currentClip.xy) * indexDirection,
    segmentSide,
    widthPixels
  );
  var size = vec3<f32>(offset, 0.0);
  DECKGL_FILTER_SIZE(&size, geometry);
  offset = size.xy;
#ifdef ANTIALIASING
  let halfWidthPixels = length(offset);
  if (halfWidthPixels > 0.0) {
    // Keep the declared edge at abs(uv.y) == 1 while rasterizing the outer half of the centered
    // one-device-pixel coverage ramp.
    let coverageScale = 1.0 + 0.5 / project.devicePixelRatio / halfWidthPixels;
    offset *= coverageScale;
    geometry.uv.y *= coverageScale;
  }
#endif

  var output: Varyings;
  output.position = currentClip + vec4<f32>(project_pixel_size_to_clipspace(offset), 0.0, 0.0);
  let color = mix(attributes.instanceSourceColors, attributes.instanceTargetColors, segmentRatio);
  output.color = vec4<f32>(color.rgb, color.a * layer.opacity);
  output.uv = geometry.uv;
  output.pickingColor = geometry.pickingColor;
  output.isValid = isValid;
  DECKGL_FILTER_GL_POSITION(&output.position, geometry);
  return output;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
#ifdef ANTIALIASING
  let edgeCoord = abs(varyings.uv.y);
  let edgePixels = (1.0 - edgeCoord) / max(fwidth(edgeCoord), 1e-6);
#endif

  if (varyings.isValid == 0.0) {
    discard;
  }

#ifdef ANTIALIASING
  // Fragments outside the coverage ramp must not write depth or picking colors.
  if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
    discard;
  }
#endif
  fragmentGeometry.uv = varyings.uv;
  var color = varyings.color;
#ifdef ANTIALIASING
  // Feather one device pixel across the width. Arc segments meet lengthwise, so only soften the
  // two outer edges of the strip.
  color.a *= smoothedge(0.0, edgePixels);
#endif

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    var extensionColor = vec4<f32>(varyings.pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(varyings.pickingColor, 1.0);
  }
  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(varyings.pickingColor - highlightedObjectColor))) {
      let highlightAlpha = picking.highlightColor.a;
      let blendedAlpha = highlightAlpha + color.a * (1.0 - highlightAlpha);
      if (blendedAlpha > 0.0) {
        let highlightRatio = highlightAlpha / blendedAlpha;
        color = vec4<f32>(
          mix(color.rgb, picking.highlightColor.rgb, highlightRatio),
          blendedAlpha
        );
      }
    }
  }
  DECKGL_FILTER_COLOR(&color, fragmentGeometry);
  return deckgl_premultiplied_alpha(color);
}
`,v=`\
#version 300 es
#define SHADER_NAME arc-layer-vertex-shader
in vec4 instanceSourceColors;
in vec4 instanceTargetColors;
in vec3 instanceSourcePositions;
in vec3 instanceSourcePositions64Low;
in vec3 instanceTargetPositions;
in vec3 instanceTargetPositions64Low;
in float instanceWidths;
in float instanceHeights;
in float instanceTilts;
out vec4 vColor;
out vec2 uv;
out float isValid;
float paraboloid(float distance, float sourceZ, float targetZ, float ratio) {
float deltaZ = targetZ - sourceZ;
float dh = distance * instanceHeights;
if (dh == 0.0) {
return sourceZ + deltaZ * ratio;
}
float unitZ = deltaZ / dh;
float p2 = unitZ * unitZ + 1.0;
float dir = step(deltaZ, 0.0);
float z0 = mix(sourceZ, targetZ, dir);
float r = mix(ratio, 1.0 - ratio, dir);
return sqrt(r * (p2 - r)) * dh + z0;
}
vec2 getExtrusionOffset(vec2 line_clipspace, float offset_direction, float width) {
vec2 dir_screenspace = normalize(line_clipspace * project.viewportSize);
dir_screenspace = vec2(dir_screenspace.y, -dir_screenspace.x);
return dir_screenspace * offset_direction * width / 2.0;
}
float getSegmentRatio(float index) {
return smoothstep(0.0, 1.0, index / (arc.numSegments - 1.0));
}
vec3 interpolateFlat(vec3 source, vec3 target, float segmentRatio) {
float distance = length(source.xy - target.xy);
float z = paraboloid(distance, source.z, target.z, segmentRatio);
float tiltAngle = radians(instanceTilts);
vec2 tiltDirection = normalize(target.xy - source.xy);
vec2 tilt = vec2(-tiltDirection.y, tiltDirection.x) * z * sin(tiltAngle);
return vec3(
mix(source.xy, target.xy, segmentRatio) + tilt,
z * cos(tiltAngle)
);
}
float getAngularDist (vec2 source, vec2 target) {
vec2 sourceRadians = radians(source);
vec2 targetRadians = radians(target);
vec2 sin_half_delta = sin((sourceRadians - targetRadians) / 2.0);
vec2 shd_sq = sin_half_delta * sin_half_delta;
float a = shd_sq.y + cos(sourceRadians.y) * cos(targetRadians.y) * shd_sq.x;
return 2.0 * asin(sqrt(a));
}
vec3 interpolateGreatCircle(vec3 source, vec3 target, vec3 source3D, vec3 target3D, float angularDist, float t) {
vec2 lngLat;
if(abs(angularDist - PI) < 0.001) {
lngLat = (1.0 - t) * source.xy + t * target.xy;
} else {
float a = sin((1.0 - t) * angularDist);
float b = sin(t * angularDist);
vec3 p = source3D.yxz * a + target3D.yxz * b;
lngLat = degrees(vec2(atan(p.y, -p.x), atan(p.z, length(p.xy))));
}
float z = paraboloid(angularDist * EARTH_RADIUS, source.z, target.z, t);
return vec3(lngLat, z);
}
void main(void) {
geometry.worldPosition = instanceSourcePositions;
geometry.worldPositionAlt = instanceTargetPositions;
float segmentIndex = float(gl_VertexID / 2);
float segmentSide = mod(float(gl_VertexID), 2.) == 0. ? -1. : 1.;
float segmentRatio = getSegmentRatio(segmentIndex);
float prevSegmentRatio = getSegmentRatio(max(0.0, segmentIndex - 1.0));
float nextSegmentRatio = getSegmentRatio(min(arc.numSegments - 1.0, segmentIndex + 1.0));
float indexDir = mix(-1.0, 1.0, step(segmentIndex, 0.0));
isValid = 1.0;
uv = vec2(segmentRatio, segmentSide);
geometry.uv = uv;
geometry.pickingColor = picking_getPickingColorFromIndex(uint(gl_InstanceID) + arc.rowIndexOffset);
vec4 curr;
vec4 next;
vec3 source;
vec3 target;
if ((arc.greatCircle || project.projectionMode == PROJECTION_MODE_GLOBE) && project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC && project.projectionMode != PROJECTION_MODE_GEODETIC_OFFSETS) {
source = project_globe_(vec3(instanceSourcePositions.xy, 0.0));
target = project_globe_(vec3(instanceTargetPositions.xy, 0.0));
float angularDist = getAngularDist(instanceSourcePositions.xy, instanceTargetPositions.xy);
vec3 prevPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, prevSegmentRatio);
vec3 currPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, segmentRatio);
vec3 nextPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, nextSegmentRatio);
if (abs(currPos.x - prevPos.x) > 180.0) {
indexDir = -1.0;
isValid = 0.0;
} else if (abs(currPos.x - nextPos.x) > 180.0) {
indexDir = 1.0;
isValid = 0.0;
}
nextPos = indexDir < 0.0 ? prevPos : nextPos;
nextSegmentRatio = indexDir < 0.0 ? prevSegmentRatio : nextSegmentRatio;
if (isValid == 0.0) {
nextPos.x += nextPos.x > 0.0 ? -360.0 : 360.0;
float t = ((currPos.x > 0.0 ? 180.0 : -180.0) - currPos.x) / (nextPos.x - currPos.x);
currPos = mix(currPos, nextPos, t);
segmentRatio = mix(segmentRatio, nextSegmentRatio, t);
}
vec3 currPos64Low = mix(instanceSourcePositions64Low, instanceTargetPositions64Low, segmentRatio);
vec3 nextPos64Low = mix(instanceSourcePositions64Low, instanceTargetPositions64Low, nextSegmentRatio);
curr = project_position_to_clipspace(currPos, currPos64Low, vec3(0.0), geometry.position);
next = project_position_to_clipspace(nextPos, nextPos64Low, vec3(0.0));
} else {
vec3 source_world = instanceSourcePositions;
vec3 target_world = instanceTargetPositions;
if (arc.useShortestPath) {
source_world.x = mod(source_world.x + 180., 360.0) - 180.;
target_world.x = mod(target_world.x + 180., 360.0) - 180.;
float deltaLng = target_world.x - source_world.x;
if (deltaLng > 180.) target_world.x -= 360.;
if (deltaLng < -180.) source_world.x -= 360.;
}
source = project_position(source_world, instanceSourcePositions64Low);
target = project_position(target_world, instanceTargetPositions64Low);
float antiMeridianX = 0.0;
if (arc.useShortestPath) {
if ((project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET || project.projectionMode == PROJECTION_MODE_GEODETIC_OFFSETS)) {
antiMeridianX = -(project.coordinateOrigin.x + 180.) / 360. * TILE_SIZE;
}
float thresholdRatio = (antiMeridianX - source.x) / (target.x - source.x);
if (prevSegmentRatio <= thresholdRatio && nextSegmentRatio > thresholdRatio) {
isValid = 0.0;
indexDir = sign(segmentRatio - thresholdRatio);
segmentRatio = thresholdRatio;
}
}
nextSegmentRatio = indexDir < 0.0 ? prevSegmentRatio : nextSegmentRatio;
vec3 currPos = interpolateFlat(source, target, segmentRatio);
vec3 nextPos = interpolateFlat(source, target, nextSegmentRatio);
if (arc.useShortestPath) {
if (nextPos.x < antiMeridianX) {
currPos.x += TILE_SIZE;
nextPos.x += TILE_SIZE;
}
}
curr = project_common_position_to_clipspace(vec4(currPos, 1.0));
next = project_common_position_to_clipspace(vec4(nextPos, 1.0));
geometry.position = vec4(currPos, 1.0);
}
float widthPixels = clamp(
project_size_to_pixel(instanceWidths * arc.widthScale, arc.widthUnits),
arc.widthMinPixels, arc.widthMaxPixels
);
vec3 offset = vec3(
getExtrusionOffset((next.xy - curr.xy) * indexDir, segmentSide, widthPixels),
0.0);
DECKGL_FILTER_SIZE(offset, geometry);
#ifdef ANTIALIASING
float halfWidthPixels = length(offset.xy);
if (halfWidthPixels > 0.0) {
float coverageScale = 1.0 + 0.5 / project.devicePixelRatio / halfWidthPixels;
offset.xy *= coverageScale;
uv.y *= coverageScale;
}
geometry.uv = uv;
#endif
DECKGL_FILTER_GL_POSITION(curr, geometry);
gl_Position = curr + vec4(project_pixel_size_to_clipspace(offset.xy), 0.0, 0.0);
vec4 color = mix(instanceSourceColors, instanceTargetColors, segmentRatio);
vColor = vec4(color.rgb, color.a * layer.opacity);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,x=`\
#version 300 es
#define SHADER_NAME arc-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 uv;
in float isValid;
out vec4 fragColor;
void main(void) {
#ifdef ANTIALIASING
float edgeCoord = abs(uv.y);
float edgePixels = (1.0 - edgeCoord) / max(fwidth(edgeCoord), 1e-6);
#endif
if (isValid == 0.0) {
discard;
}
#ifdef ANTIALIASING
if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
discard;
}
#endif
fragColor = vColor;
geometry.uv = uv;
#ifdef ANTIALIASING
fragColor.a *= smoothedge(0.0, edgePixels);
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,y=t=>t.sourcePosition,P=t=>t.targetPosition,_=[0,0,0,255],C={sourcePositions:{type:"object",value:null,optional:!0},targetPositions:{type:"object",value:null,optional:!0},sourceColors:{type:"object",value:null,optional:!0},targetColors:{type:"object",value:null,optional:!0},widths:{type:"object",value:null,optional:!0},heights:{type:"object",value:null,optional:!0},tilts:{type:"object",value:null,optional:!0},getSourcePosition:{type:"accessor",value:y},getTargetPosition:{type:"accessor",value:P},getSourceColor:{type:"accessor",value:_},getTargetColor:{type:"accessor",value:_},getWidth:{type:"accessor",value:1},getHeight:{type:"accessor",value:1},getTilt:{type:"accessor",value:0},greatCircle:!1,numSegments:{type:"number",value:50,min:1},widthUnits:"pixels",widthScale:{type:"number",value:1,min:0},widthMinPixels:{type:"number",value:0,min:0},widthMaxPixels:{type:"number",value:Number.MAX_SAFE_INTEGER,min:0},antialiasing:!1};class S extends o.A{_getAttributeManager(){return d(this.props)?null:super._getAttributeManager()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}get isLoaded(){return!this.state?.columns?.loading&&super.isLoaded}finalizeState(t){this.state.columns?.destroy(),super.finalizeState(t)}getBounds(){return this.state?.columns?this.state.columns.getBounds():this.getAttributeManager()?.getBounds(["instanceSourcePositions","instanceTargetPositions"])}getShaders(){let{antialiasing:t}=this.props;return super.getShaders({vs:v,fs:x,source:m,defines:t?{ANTIALIASING:1}:{},modules:[s.A,n.A,r.Ay,h]})}get wrapLongitude(){return!1}initializeState(){if(d(this.props)){if(this.props.extensions.length)throw Error("Arc Arrow columns do not support extensions");return}this.initializeAccessorAttributes()}initializeAccessorAttributes(){this.getAttributeManager().addInstanced({instanceSourcePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getSourcePosition"},instanceTargetPositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getTargetPosition"},instanceSourceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getSourceColor",defaultValue:_},instanceTargetColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getTargetColor",defaultValue:_},instanceWidths:{size:1,transition:!0,accessor:"getWidth",defaultValue:1},instanceHeights:{size:1,transition:!0,accessor:"getHeight",defaultValue:1},instanceTilts:{size:1,transition:!0,accessor:"getTilt",defaultValue:0}})}updateState(t){if(d(this.props))return void this.updateColumnState(t);this.restoreAccessorState(),super.updateState(t);let{props:e,oldProps:i,changeFlags:o}=t;(o.extensionsChanged||e.antialiasing!==i.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}restoreAccessorState(){this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.internalState.attributeManager=super._getAttributeManager(),this.initializeAccessorAttributes(),this.state.model?.destroy(),this.state.model=this._getModel())}updateColumnState(t){if(this.props.extensions.length)throw Error("Arc Arrow columns do not support extensions");let e=!this.state.columns;e&&(this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new f(this.context.device)),(e||t.changeFlags.extensionsChanged||t.props.antialiasing!==t.oldProps.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel()),this.state.columns.updateIfNeeded(t,{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:t=>this.raiseError(t,"converting Arrow columns"),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!this.props.sourcePositions&&this.props.getSourcePosition===y||!this.props.targetPositions&&this.props.getTargetPosition===P}})}draw({uniforms:t}){let{widthUnits:e,widthScale:i,widthMinPixels:o,widthMaxPixels:s,greatCircle:n,wrapLongitude:r,numSegments:l}=this.props,c={numSegments:l,rowIndexOffset:0,widthUnits:a.p5[e],widthScale:i,widthMinPixels:o,widthMaxPixels:s,greatCircle:n,useShortestPath:r&&!this.state.preproject&&this.state.sourceCrs?.signature==="WGS84"},u=this.state.model;u.shaderInputs.setProps({arc:c}),u.setVertexCount(2*l),this.state.columns?this.state.columns.draw(u,this.context.renderPass,t=>{u.setInstanceCount(Math.min(u.instanceCount,Math.max(0,this.getNumInstances()-t))),u.shaderInputs.setProps({arc:{rowIndexOffset:t}})}):u.draw(this.context.renderPass)}_getModel(){return new(this.state.columns?c.X:l.A)(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.state.columns?.getBufferLayouts()??this.getAttributeManager().getBufferLayouts(),topology:"triangle-strip",enforceMatchingVectorLengths:!!this.state.columns,inferDrawCount:this.state.columns?"instance":"no",isInstanced:!0})}}S.layerName="ArcLayer",S.defaultProps=C;let b=S;var I=i(33865),L=i(86982),w=i(87115),A=i(44771),R=i(82759),O=i(78168),T=i(87238),E=i(25337),M=i(11205),z=i(3770);let D={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},elevations:{attribute:"instanceElevations",accessor:"getElevation",semantic:"scalar",size:1,defaultValue:1e3},fillColors:{attribute:"instanceFillColors",accessor:"getFillColor",semantic:"color",size:4},lineColors:{attribute:"instanceLineColors",accessor:"getLineColor",semantic:"color",size:4},lineWidths:{attribute:"instanceStrokeWidths",accessor:"getLineWidth",semantic:"scalar",size:1,defaultValue:1}};function N(t){return Object.keys(D).some(e=>!!t[e])}class k extends u.h{constructor(t){super(t,D,"Column")}}var j=i(68996),F=i(78009);class G extends E.V2{constructor(t){let{indices:e,attributes:i}=function(t){let{radius:e,height:i=1,nradial:o=10}=t,{vertices:s}=t;s&&(j.A.assert(s.length>=o),s=s.flatMap(t=>[t[0],t[1]]),(0,F.UD)(s,"counter-clockwise"));let n=i>0,r=o+1,a=n?3*r+1:o,l=2*Math.PI/o,c=new Uint16Array(n?3*o*2:0),u=new Float32Array(3*a),g=new Float32Array(3*a),d=0;if(n){for(let t=0;t<r;t++){let n=t*l,r=t%o,a=Math.sin(n),c=Math.cos(n);for(let t=0;t<2;t++)u[d+0]=s?s[2*r]:c*e,u[d+1]=s?s[2*r+1]:a*e,u[d+2]=(.5-t)*i,g[d+0]=s?s[2*r]:c,g[d+1]=s?s[2*r+1]:a,d+=3}u[d+0]=u[d-3],u[d+1]=u[d-2],u[d+2]=u[d-1],d+=3}for(let t=+!n;t<r;t++){let n=Math.floor(t/2)*Math.sign(.5-t%2),r=n*l,a=(n+o)%o,c=Math.sin(r),f=Math.cos(r);u[d+0]=s?s[2*a]:f*e,u[d+1]=s?s[2*a+1]:c*e,u[d+2]=i/2,g[d+2]=1,d+=3}if(n){let t=0;for(let e=0;e<o;e++)c[t++]=2*e+0,c[t++]=2*e+2,c[t++]=2*e+0,c[t++]=2*e+1,c[t++]=2*e+1,c[t++]=2*e+3}return{indices:c,attributes:{POSITION:{size:3,value:u},NORMAL:{size:3,value:g}}}}(t);super({...t,topology:"line-list",indices:e,attributes:i})}}let U=`\
layout(std140) uniform columnUniforms {
  float radius;
  float angle;
  vec2 offset;
  bool extruded;
  bool stroked;
  bool isStroke;
  float coverage;
  float elevationScale;
  float edgeDistance;
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  highp int radiusUnits;
  highp int widthUnits;
  highp uint rowIndexOffset;
} column;
`,V={name:"column",source:`\
struct ColumnUniforms {
  radius: f32,
  angle: f32,
  offset: vec2<f32>,
  extruded: f32,
  stroked: f32,
  isStroke: f32,
  coverage: f32,
  elevationScale: f32,
  edgeDistance: f32,
  widthScale: f32,
  widthMinPixels: f32,
  widthMaxPixels: f32,
  radiusUnits: i32,
  widthUnits: i32,
  rowIndexOffset: u32,
};

@group(0) @binding(auto) var<uniform> column: ColumnUniforms;
`,vs:U,fs:U,uniformTypes:{radius:"f32",angle:"f32",offset:"vec2<f32>",extruded:"f32",stroked:"f32",isStroke:"f32",coverage:"f32",elevationScale:"f32",edgeDistance:"f32",widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",radiusUnits:"i32",widthUnits:"i32",rowIndexOffset:"u32"}},W=`\
struct Attributes {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
  @location(2) instancePositions: vec3<f32>,
  @location(3) instancePositions64Low: vec3<f32>,
  @location(4) instanceElevations: f32,
  @location(5) instanceFillColors: vec4<f32>,
  @location(6) instanceLineColors: vec4<f32>,
  @location(7) instanceStrokeWidths: f32,
};

fn getRotationMatrix(angle: f32) -> mat2x2<f32> {
  let s = sin(angle);
  let c = cos(angle);
  return mat2x2<f32>(
    vec2<f32>(c, s),
    vec2<f32>(-s, c)
  );
}

fn getOffset(
  positions: vec3<f32>,
  strokeOffsetRatio: f32,
  dotRadius: f32,
  rotationMatrix: mat2x2<f32>
) -> vec3<f32> {
  var offset = (rotationMatrix * positions.xy * strokeOffsetRatio + column.offset) * dotRadius;
  if (column.radiusUnits == UNIT_METERS) {
    offset = project_size_vec2(offset);
  } else if (column.radiusUnits == UNIT_PIXELS) {
    offset = project_pixel_size_vec2(offset);
  }
  return vec3<f32>(offset, 0.0);
}
`,Z=`\
${W}

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  geometry.worldPosition = attributes.instancePositions;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex + column.rowIndexOffset);

  let isStroke = column.isStroke > 0.5;
  let baseColor = select(attributes.instanceFillColors, attributes.instanceLineColors, isStroke);
  let rotationMatrix = getRotationMatrix(column.angle);

  var elevation = 0.0;
  var strokeOffsetRatio = 1.0;

  if (column.extruded > 0.5) {
    elevation =
      attributes.instanceElevations * (attributes.positions.z + 1.0) / 2.0 * column.elevationScale;
  } else if (column.stroked > 0.5) {
    let widthPixels = clamp(
      project_unit_size_to_pixel(attributes.instanceStrokeWidths * column.widthScale, column.widthUnits),
      column.widthMinPixels,
      column.widthMaxPixels
    ) / 2.0;
    let halfOffset =
      project_pixel_size_float(widthPixels) /
      project_size_float(column.edgeDistance * column.coverage * column.radius);
    if (isStroke) {
      strokeOffsetRatio -= sign(attributes.positions.z) * halfOffset;
    } else {
      strokeOffsetRatio -= halfOffset;
    }
  }

  let shouldRender = select(0.0, 1.0, baseColor.a > 0.0 && attributes.instanceElevations >= 0.0);
  let dotRadius = column.radius * column.coverage * shouldRender;
  let centroidPosition =
    vec3<f32>(
      attributes.instancePositions.xy,
      attributes.instancePositions.z + elevation
    );
  var offset = getOffset(attributes.positions, strokeOffsetRatio, dotRadius, rotationMatrix);
  DECKGL_FILTER_SIZE(&offset, geometry);
  let projected = project_position_to_clipspace_and_commonspace(
    centroidPosition,
    attributes.instancePositions64Low,
    offset
  );

  geometry.position = projected.commonPosition;
  geometry.normal = project_normal(vec3<f32>(rotationMatrix * attributes.normals.xy, attributes.normals.z));

  let lightColor = lighting_getLightColor2(
    baseColor.rgb,
    project.cameraPosition,
    geometry.position.xyz,
    geometry.normal
  );

  varyings.position = projected.clipPosition;
  varyings.color = vec4<f32>(
    select(baseColor.rgb, lightColor, column.extruded > 0.5 && !isStroke),
    baseColor.a * layer.opacity
  );

  DECKGL_FILTER_GL_POSITION(&varyings.position, geometry);

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = vec2<f32>(0.0);
  fragmentGeometry.uv = geometry.uv;
  var extensionColor = varyings.color;
  DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
  return deckgl_premultiplied_alpha(extensionColor);
}
`,H=`\
${W}

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) cameraPosition: vec3<f32>,
  @location(2) positionCommonspace: vec4<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  geometry.worldPosition = attributes.instancePositions;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex + column.rowIndexOffset);

  let isStroke = column.isStroke > 0.5;
  let baseColor = select(attributes.instanceFillColors, attributes.instanceLineColors, isStroke);
  let rotationMatrix = getRotationMatrix(column.angle);

  var elevation = 0.0;
  var strokeOffsetRatio = 1.0;

  if (column.extruded > 0.5) {
    elevation =
      attributes.instanceElevations * (attributes.positions.z + 1.0) / 2.0 * column.elevationScale;
  } else if (column.stroked > 0.5) {
    let widthPixels = clamp(
      project_unit_size_to_pixel(attributes.instanceStrokeWidths * column.widthScale, column.widthUnits),
      column.widthMinPixels,
      column.widthMaxPixels
    ) / 2.0;
    let halfOffset =
      project_pixel_size_float(widthPixels) /
      project_size_float(column.edgeDistance * column.coverage * column.radius);
    if (isStroke) {
      strokeOffsetRatio -= sign(attributes.positions.z) * halfOffset;
    } else {
      strokeOffsetRatio -= halfOffset;
    }
  }

  let shouldRender = select(0.0, 1.0, baseColor.a > 0.0 && attributes.instanceElevations >= 0.0);
  let dotRadius = column.radius * column.coverage * shouldRender;
  let centroidPosition =
    vec3<f32>(
      attributes.instancePositions.xy,
      attributes.instancePositions.z + elevation
    );
  var offset = getOffset(attributes.positions, strokeOffsetRatio, dotRadius, rotationMatrix);
  DECKGL_FILTER_SIZE(&offset, geometry);
  let projected = project_position_to_clipspace_and_commonspace(
    centroidPosition,
    attributes.instancePositions64Low,
    offset
  );

  geometry.position = projected.commonPosition;
  geometry.normal = project_normal(vec3<f32>(rotationMatrix * attributes.normals.xy, attributes.normals.z));

  varyings.position = projected.clipPosition;
  varyings.color = vec4<f32>(baseColor.rgb, baseColor.a * layer.opacity);
  varyings.cameraPosition = project.cameraPosition;
  varyings.positionCommonspace = projected.commonPosition;

  DECKGL_FILTER_GL_POSITION(&varyings.position, geometry);

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = vec2<f32>(0.0);
  fragmentGeometry.uv = geometry.uv;

  var fragColor = varyings.color;
  if (column.extruded > 0.5 && column.isStroke < 0.5) {
    // WebGPU's screen-space Y axis reverses the derivative orientation used by GLSL flat shading.
    let normal = normalize(cross(dpdy(varyings.positionCommonspace.xyz), dpdx(varyings.positionCommonspace.xyz)));
    fragColor = vec4<f32>(
      lighting_getLightColor2(
        varyings.color.rgb,
        varyings.cameraPosition,
        varyings.positionCommonspace.xyz,
        normal
      ),
      varyings.color.a
    );
  }

  DECKGL_FILTER_COLOR(&fragColor, fragmentGeometry);
  return deckgl_premultiplied_alpha(fragColor);
}
`,K=`#version 300 es
#define SHADER_NAME column-layer-vertex-shader
in vec3 positions;
in vec3 normals;
in vec3 instancePositions;
in float instanceElevations;
in vec3 instancePositions64Low;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in float instanceStrokeWidths;
out vec4 vColor;
#ifdef FLAT_SHADING
out vec3 cameraPosition;
out vec4 position_commonspace;
#endif
void main(void) {
geometry.worldPosition = instancePositions;
vec4 color = column.isStroke ? instanceLineColors : instanceFillColors;
mat2 rotationMatrix = mat2(cos(column.angle), sin(column.angle), -sin(column.angle), cos(column.angle));
float elevation = 0.0;
float strokeOffsetRatio = 1.0;
if (column.extruded) {
elevation = instanceElevations * (positions.z + 1.0) / 2.0 * column.elevationScale;
} else if (column.stroked) {
float widthPixels = clamp(
project_size_to_pixel(instanceStrokeWidths * column.widthScale, column.widthUnits),
column.widthMinPixels, column.widthMaxPixels) / 2.0;
float halfOffset = project_pixel_size(widthPixels) / project_size(column.edgeDistance * column.coverage * column.radius);
if (column.isStroke) {
strokeOffsetRatio -= sign(positions.z) * halfOffset;
} else {
strokeOffsetRatio -= halfOffset;
}
}
float shouldRender = float(color.a > 0.0 && instanceElevations >= 0.0);
float dotRadius = column.radius * column.coverage * shouldRender;
geometry.pickingColor = picking_getPickingColorFromIndex(uint(gl_InstanceID) + column.rowIndexOffset);
vec3 centroidPosition = vec3(instancePositions.xy, instancePositions.z + elevation);
vec3 centroidPosition64Low = instancePositions64Low;
vec2 offset = (rotationMatrix * positions.xy * strokeOffsetRatio + column.offset) * dotRadius;
if (column.radiusUnits == UNIT_METERS) {
offset = project_size(offset);
} else if (column.radiusUnits == UNIT_PIXELS) {
offset = project_pixel_size(offset);
}
vec3 pos = vec3(offset, 0.);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(centroidPosition, centroidPosition64Low, pos, geometry.position);
geometry.normal = project_normal(vec3(rotationMatrix * normals.xy, normals.z));
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
if (column.extruded && !column.isStroke) {
#ifdef FLAT_SHADING
cameraPosition = project.cameraPosition;
position_commonspace = geometry.position;
vColor = vec4(color.rgb, color.a * layer.opacity);
#else
vec3 lightColor = lighting_getLightColor(color.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, color.a * layer.opacity);
#endif
} else {
vColor = vec4(color.rgb, color.a * layer.opacity);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,B=`#version 300 es
#define SHADER_NAME column-layer-fragment-shader
precision highp float;
out vec4 fragColor;
in vec4 vColor;
#ifdef FLAT_SHADING
in vec3 cameraPosition;
in vec4 position_commonspace;
#endif
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
#ifdef FLAT_SHADING
if (column.extruded && !column.isStroke && !bool(picking.isActive)) {
vec3 normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
fragColor.rgb = lighting_getLightColor(vColor.rgb, cameraPosition, position_commonspace.xyz, normal);
}
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,X=t=>t.position,q=[0,0,0,255],J={name:"geometry",stepMode:"vertex",byteStride:24,attributes:[{attribute:"positions",format:"float32x3",byteOffset:0},{attribute:"normals",format:"float32x3",byteOffset:12}]},$={positions:{type:"object",value:null,optional:!0},elevations:{type:"object",value:null,optional:!0},fillColors:{type:"object",value:null,optional:!0},lineColors:{type:"object",value:null,optional:!0},lineWidths:{type:"object",value:null,optional:!0},diskResolution:{type:"number",min:4,value:20},vertices:null,radius:{type:"number",min:0,value:1e3},angle:{type:"number",value:0},offset:{type:"array",value:[0,0]},coverage:{type:"number",min:0,max:1,value:1},elevationScale:{type:"number",min:0,value:1},radiusUnits:"meters",lineWidthUnits:"meters",lineWidthScale:1,lineWidthMinPixels:0,lineWidthMaxPixels:Number.MAX_SAFE_INTEGER,extruded:!0,wireframe:!1,filled:!0,stroked:!1,flatShading:!1,getPosition:{type:"accessor",value:X},getFillColor:{type:"accessor",value:q},getLineColor:{type:"accessor",value:q},getLineWidth:{type:"accessor",value:1},getElevation:{type:"accessor",value:1e3},material:!0,getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class Y extends o.A{getBounds(){return this.state?.columns?this.state.columns.getBounds():super.getBounds()}_getAttributeManager(){return N(this.props)?null:super._getAttributeManager()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}get isLoaded(){return!this.state?.columns?.loading&&super.isLoaded}finalizeState(t){super.finalizeState(t),this.state.columns?.destroy(),this.state.geometries?.forEach(t=>t.destroy())}getShaders(){let t={},{flatShading:e}=this.props;return e&&(t.FLAT_SHADING=1),super.getShaders({vs:K,fs:B,source:e?H:Z,defines:t,modules:[s.A,n.A,e?O.w:T.J,r.Ay,V]})}initializeState(){if(N(this.props)){if(this.props.extensions.length)throw Error("Column Arrow columns do not support extensions");return}this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getPosition"},instanceElevations:{size:1,transition:!0,accessor:"getElevation"},instanceFillColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getFillColor",defaultValue:q},instanceLineColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getLineColor",defaultValue:q},instanceStrokeWidths:{size:1,accessor:"getLineWidth",transition:!0}})}updateState(t){let e=N(this.props),i=!!this.state.columns!==e;e?this.updateColumnState(t):(this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.internalState.attributeManager=super._getAttributeManager(),this.initializeState()),super.updateState(t));let{props:o,oldProps:s,changeFlags:n}=t,r=i||n.extensionsChanged||o.flatShading!==s.flatShading;r&&(this.state.models?.forEach(t=>t.destroy()),this.state.geometries?.forEach(t=>t.destroy()),this.state.geometries=new Map,this.setState(this._getModels()),this.getAttributeManager()?.invalidateAll());let a=this.getNumInstances();this.state.fillModel.setInstanceCount(a),this.state.strokeModel.setInstanceCount(a),this.state.wireframeModel.setInstanceCount(a),(r||o.diskResolution!==s.diskResolution||o.vertices!==s.vertices||o.extruded!==s.extruded||o.stroked!==s.stroked)&&this._updateGeometry(o)}updateColumnState(t){if(this.props.extensions.length)throw Error("Column Arrow columns do not support extensions");this.state.columns||(this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new k(this.context.device)),this.state.columns.updateIfNeeded(t,{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:t=>this.raiseError(t,"converting Arrow columns"),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!this.props.positions&&this.props.getPosition===X}})}getGeometry(t,e,i){let o=new G({radius:1,height:2*!!i,vertices:e,nradial:t}),s=0;if(e)for(let i=0;i<t;i++){let o=e[i];s+=Math.sqrt(o[0]*o[0]+o[1]*o[1])/t}else s=1;return this.setState({edgeDistance:Math.cos(Math.PI/t)*s}),o}_getModels(){let t=this.getShaders(),e=[...this.state.columns?.getBufferLayouts()??this.getAttributeManager().getBufferLayouts(),J],i=this.state.columns?c.X:l.A,o=new i(this.context.device,{...t,id:`${this.props.id}-fill`,bufferLayout:e,isInstanced:!0,inferDrawCount:this.state.columns?"instance":"no"}),s=new i(this.context.device,{...t,id:`${this.props.id}-stroke`,bufferLayout:e,isInstanced:!0,inferDrawCount:this.state.columns?"instance":"no"}),n=new i(this.context.device,{...t,id:`${this.props.id}-wireframe`,bufferLayout:e,isInstanced:!0,inferDrawCount:this.state.columns?"instance":"no"});return{fillModel:o,strokeModel:s,wireframeModel:n,models:[n,o,s]}}_updateGeometry({diskResolution:t,vertices:e,extruded:i,stroked:o}){let s=this.getGeometry(t,e,i||o),n=s.attributes.POSITION,r=s.attributes.NORMAL;if(this._setFillGeometry(new E.V2({topology:"triangle-strip",attributes:{POSITION:n,NORMAL:r}})),!i&&o){let e=n.value.length/3;this._setStrokeGeometry(new E.V2({topology:"triangle-strip",vertexCount:e-t-1,attributes:{POSITION:n,NORMAL:r}}))}i&&this._setWireframeGeometry(s)}_setFillGeometry(t){let e=(0,M.C)(t,{attributes:["POSITION","NORMAL"]}),i=this.state.fillModel;this.setModelGeometry(i,e)}_setStrokeGeometry(t){let e=(0,M.C)(t,{attributes:["POSITION","NORMAL"]}),i=this.state.strokeModel;this.setModelGeometry(i,e)}_setWireframeGeometry(t){let e=(0,M.C)(t,{attributes:["POSITION","NORMAL"]}),i=this.state.wireframeModel;this.setModelGeometry(i,e),i.setTopology("line-list")}setModelGeometry(t,e){if(!this.state.columns)return void t.setGeometry(e);let i=(0,z.M)(this.context.device,e);t.setGeometry(i),this.state.geometries.get(t)?.destroy(),this.state.geometries.set(t,i)}drawModel(t){this.state.columns?this.state.columns.draw(t,this.context.renderPass,e=>{t.setInstanceCount(Math.max(0,Math.min(t.instanceCount,this.getNumInstances()-e))),t.shaderInputs.setProps({column:{rowIndexOffset:e}})}):t.draw(this.context.renderPass)}draw({uniforms:t}){let{lineWidthUnits:e,lineWidthScale:i,lineWidthMinPixels:o,lineWidthMaxPixels:s,radiusUnits:n,elevationScale:r,extruded:l,filled:c,stroked:u,wireframe:g,offset:d,coverage:f,radius:p,angle:h}=this.props,m=this.state.fillModel,v=this.state.strokeModel,x=this.state.wireframeModel,{edgeDistance:y}=this.state,P={radius:p,angle:h/180*Math.PI,offset:d,extruded:l,stroked:u,coverage:f,elevationScale:r,edgeDistance:y,radiusUnits:a.p5[n],widthUnits:a.p5[e],widthScale:i,widthMinPixels:o,widthMaxPixels:s,rowIndexOffset:0};l&&g&&(x.shaderInputs.setProps({column:{...P,isStroke:!0}}),this.drawModel(x)),c&&(m.shaderInputs.setProps({column:{...P,isStroke:!1}}),this.drawModel(m)),!l&&u&&(v.shaderInputs.setProps({column:{...P,isStroke:!0}}),this.drawModel(v))}}Y.layerName="ColumnLayer",Y.defaultProps=$;let Q=Y;var tt=i(12888);function te(t,e){if(!Number.isFinite(t)||t<=0)throw Error(`${e} must be greater than zero`)}function ti(t,e,i=1){if(!Number.isInteger(t)||t<i)throw Error(`${e} must be an integer >= ${i}`)}function to(t,e){return t>65535?new Uint32Array(e):new Uint16Array(e)}class ts extends tt.V{constructor(t={}){let e=t.size||[1,1,1];te(e[0],"size[0]"),te(e[1],"size[1]"),te(e[2],"size[2]");let i=[e[0]/2,e[1]/2,e[2]/2],o=[],s=[],n=[],r=[];for(let t of[{n:[1,0,0],u:[0,0,-1],v:[0,1,0],h1:i[2],h2:i[1]},{n:[-1,0,0],u:[0,0,1],v:[0,1,0],h1:i[2],h2:i[1]},{n:[0,1,0],u:[1,0,0],v:[0,0,-1],h1:i[0],h2:i[2]},{n:[0,-1,0],u:[1,0,0],v:[0,0,1],h1:i[0],h2:i[2]},{n:[0,0,1],u:[1,0,0],v:[0,1,0],h1:i[0],h2:i[1]},{n:[0,0,-1],u:[-1,0,0],v:[0,1,0],h1:i[0],h2:i[1]}]){let e=o.length/3;for(let[e,r,a,l]of[[-1,-1,0,0],[1,-1,1,0],[1,1,1,1],[-1,1,0,1]])o.push(t.n[0]*i[0]+t.u[0]*t.h1*e+t.v[0]*t.h2*r,t.n[1]*i[1]+t.u[1]*t.h1*e+t.v[1]*t.h2*r,t.n[2]*i[2]+t.u[2]*t.h1*e+t.v[2]*t.h2*r),s.push(...t.n),n.push(a,l);r.push(e,e+1,e+2,e,e+2,e+3)}super({id:t.id,topology:"triangle-list",indices:to(24,r),attributes:{POSITION:{size:3,value:new Float32Array(o)},NORMAL:{size:3,value:new Float32Array(s)},TEXCOORD_0:{size:2,value:new Float32Array(n)},...t.attributes}})}}class tn extends ts{constructor(t={}){let e=t.size??1;super({...t,size:[e,e,e]})}}tt.V,tt.V,tt.V,tt.V;class tr extends tt.V{constructor(t){let{sample:e,normal:i,uSegments:o=32,vSegments:s=32,periodicU:n=!1,periodicV:r=!1}=t;ti(o,"uSegments"),ti(s,"vSegments");let a=(o+1)*(s+1),l=o*s*6;if(!Number.isSafeInteger(l)||l>0xffffffff)throw RangeError("Surface exceeds 32-bit index-buffer length");if(!Number.isSafeInteger(a)||a>0xffffffff)throw RangeError("Surface exceeds 32-bit indexing");let c=new Float32Array(3*a),u=new Float32Array(3*a),g=new Float32Array(2*a),d=(t,e)=>e?(t%1+1)%1:Math.max(0,Math.min(1,t)),f=(t,i)=>ta(e(d(t,n),d(i,r))),p=0;for(let t=0;t<=s;t++)for(let e=0;e<=o;e++,p++){let a,l=e/o,h=t/s,m=d(l,n),v=d(h,r);if(c.set(f(m,v),3*p),i)a=ta(i(m,v));else{let t=f(m-1e-5,v),e=f(m+1e-5,v),i=f(m,v-1e-5),o=f(m,v+1e-5),s=tl(e.map((e,i)=>e-t[i])),n=tl(o.map((t,e)=>t-i[e]));a=[s[1]*n[2]-s[2]*n[1],s[2]*n[0]-s[0]*n[2],s[0]*n[1]-s[1]*n[0]]}u.set(tl(a),3*p),g.set([l,h],2*p)}for(let t of c)if(!Number.isFinite(t))throw RangeError("Positions must be representable as Float32");let h=a>65535?new Uint32Array(l):new Uint16Array(l),m=o+1,v=0;for(let t=0;t<s;t++)for(let e=0;e<o;e++){let i=t*m+e,o=i+1,s=i+m,n=s+1;h[v++]=i,h[v++]=o,h[v++]=n,h[v++]=i,h[v++]=n,h[v++]=s}super({id:t.id,topology:"triangle-list",indices:h,attributes:{POSITION:{size:3,value:c},NORMAL:{size:3,value:u},TEXCOORD_0:{size:2,value:g},...t.attributes}})}}function ta(t){if(!t||3!==t.length||!Array.from(t).every(Number.isFinite))throw RangeError("Surface samples and normals must be finite triples");return Array.from(t)}function tl(t){let e=Math.max(...t.map(Math.abs));if(!e)return[0,0,0];let i=t.map(t=>t/e),o=Math.hypot(...i);return i.map(t=>0===t?0:t/o)}E.V2;class tc extends E.V2{constructor(t={}){let e=new tn({size:2}),i=new Uint32Array(24),o=[4,5,2,3,0,1];for(let t=0;t<i.length;t++)i[t]=o[Math.floor(t/4)];e.attributes.faceIndex={size:1,value:i},!1===t.indices&&(e.attributes.COLOR_0={size:3,value:new Float32Array(Array.from(e.attributes.POSITION.value,t=>(t+1)/2))});let s=!1===t.indices?function(t){if(!t.indices)return t;let e=t.indices.value,i={};for(let[o,s]of Object.entries(t.attributes)){if(!s)continue;if(s.constant||!s.size){i[o]=s;continue}let t=new s.value.constructor(e.length*s.size);for(let i=0;i<e.length;i++)for(let o=0;o<s.size;o++)t[i*s.size+o]=s.value[Number(e[i])*s.size+o];i[o]={...s,value:t}}return{attributes:i}}(e):e;super({id:t.id,topology:e.topology,indices:!1===t.indices?void 0:e.indices,attributes:function(t,e={}){let i={};for(let[e,o]of Object.entries(t))o&&(i[e]=o);return{...i,...e}}(s.attributes,t.attributes)})}}E.V2,E.V2,E.V2,E.V2;class tu extends Q{_updateGeometry(){let t=new tc;this._setFillGeometry(t)}draw({uniforms:t}){let{elevationScale:e,extruded:i,offset:o,coverage:s,cellSize:n,angle:r,radiusUnits:l}=this.props,c=this.state.fillModel,u={radius:n/2,radiusUnits:a.p5[l],angle:r,offset:o,extruded:i,stroked:!1,coverage:s,elevationScale:e,edgeDistance:1,isStroke:!1,widthUnits:0,widthScale:0,widthMinPixels:0,widthMaxPixels:0,rowIndexOffset:0};c.shaderInputs.setProps({column:u}),this.drawModel(c)}}tu.layerName="GridCellLayer",tu.defaultProps={cellSize:{type:"number",min:0,value:1e3},offset:{type:"array",value:[1,1]}};let tg=tu;var td=i(48314),tf=i(59452),tp=i(53439),th=i(63744),tm=i(41661),tv=i(6053);let tx=[0,0,0,255],ty={stroked:!0,filled:!0,extruded:!1,elevationScale:1,wireframe:!1,_normalize:!0,_projectionTolerance:{type:"number",value:0,min:0},_windingOrder:"CW",lineWidthUnits:"meters",lineWidthScale:1,lineWidthMinPixels:0,lineWidthMaxPixels:Number.MAX_SAFE_INTEGER,lineJointRounded:!1,lineMiterLimit:4,lineAntialiasing:!1,getPolygon:{type:"accessor",value:t=>t.polygon},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:tx},getLineWidth:{type:"accessor",value:1},getElevation:{type:"accessor",value:1e3},material:!0};class tP extends tf.A{initializeState(){this.state={paths:[],pathsDiff:null},this.props.getLineDashArray&&j.A.removed("getLineDashArray","PathStyleExtension")()}updateState({changeFlags:t}){let e=t.dataChanged||t.updateTriggersChanged&&(t.updateTriggersChanged.all||t.updateTriggersChanged.getPolygon);if(e&&Array.isArray(t.dataChanged)){let e=this.state.paths.slice(),i=t.dataChanged.map(t=>(0,tv.J)({data:e,getIndex:t=>t.__source.index,dataRange:t,replace:this._getPaths(t)}));this.setState({paths:e,pathsDiff:i})}else e&&this.setState({paths:this._getPaths(),pathsDiff:null})}_getPaths(t={}){let{data:e,getPolygon:i,positionFormat:o,_normalize:s}=this.props,n=[],r="XY"===o?2:3,{startRow:a,endRow:l}=t,{iterable:c,objectInfo:u}=(0,tp.X)(e,a,l);for(let t of c){u.index++;let e=i(t,u);s&&(e=tm.S8(e,r));let{holeIndices:o}=e,a=e.positions||e;if(o)for(let e=0;e<=o.length;e++){let i=a.slice(o[e-1]||0,o[e]||a.length);n.push(this.getSubLayerRow({path:i},t,u.index))}else n.push(this.getSubLayerRow({path:a},t,u.index))}return n}renderLayers(){let{data:t,_dataDiff:e,stroked:i,filled:o,extruded:s,wireframe:n,_normalize:r,_windingOrder:a,elevationScale:l,transitions:c,positionFormat:u}=this.props,{lineWidthUnits:g,lineWidthScale:d,lineWidthMinPixels:f,lineWidthMaxPixels:p,lineJointRounded:h,lineMiterLimit:m,lineAntialiasing:v,lineDashJustified:x}=this.props,{getFillColor:y,getLineColor:P,getLineWidth:_,getLineDashArray:C,getElevation:S,getPolygon:b,updateTriggers:I,material:L}=this.props,{paths:w,pathsDiff:A}=this.state,R=this.getSubLayerClass("fill",th.A),O=this.getSubLayerClass("stroke",td.A),T=this.shouldRenderSubLayer("fill",w)&&new R({_dataDiff:e,dataComparator:this.props.dataComparator,extruded:s,elevationScale:l,filled:o,wireframe:n,_normalize:r,_projectionTolerance:this.props._projectionTolerance,_windingOrder:a,getElevation:S,getFillColor:y,getLineColor:s&&n?P:tx,material:L,transitions:c},this.getSubLayerProps({id:"fill",updateTriggers:I&&{getPolygon:I.getPolygon,getElevation:I.getElevation,getFillColor:I.getFillColor,lineColors:s&&n,getLineColor:I.getLineColor}}),{data:t,positionFormat:u,getPolygon:b}),E=!s&&i&&this.shouldRenderSubLayer("stroke",w)&&new O({_dataDiff:A&&(()=>A),widthUnits:g,widthScale:d,widthMinPixels:f,widthMaxPixels:p,jointRounded:h,miterLimit:m,antialiasing:v,dashJustified:x,_pathType:this.props._projectionTolerance?null:"loop",_projectionTolerance:this.props._projectionTolerance,_projectionNoCut:!!this.props._projectionTolerance,transitions:c&&{getWidth:c.getLineWidth,getColor:c.getLineColor,getPath:c.getPolygon},getColor:this.getSubLayerAccessor(P),getWidth:this.getSubLayerAccessor(_),getDashArray:this.getSubLayerAccessor(C)},this.getSubLayerProps({id:"stroke",updateTriggers:I&&{getWidth:I.getLineWidth,getColor:I.getLineColor,getDashArray:I.getLineDashArray}}),{data:w,positionFormat:u,getPath:t=>t.path});return[!s&&T,E,s&&T]}}tP.layerName="PolygonLayer",tP.defaultProps=ty;let t_=tP;var tC=i(51236),tS=i(32013),tb=i(75027),tI=i(1592)},44771(t,e,i){i.d(e,{A:()=>w});var o=i(66260),s=i(84175),n=i(46487),r=i(19754),a=i(9350),l=i(88599),c=i(87238),u=i(25337),g=i(3770),d=i(62459),f=i(60608);let p={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},normals:{attribute:"instanceNormals",accessor:"getNormal",semantic:"vector",size:3},colors:{attribute:"instanceColors",accessor:"getColor",semantic:"color",size:4}};function h(t){return Object.keys(p).some(e=>!!t[e])}class m extends f.h{constructor(t){super(t,p,"PointCloud")}}let v=`\
layout(std140) uniform pointCloudUniforms {
  float radiusPixels;
  highp int sizeUnits;
  highp uint rowIndexOffset;
} pointCloud;
`,x={name:"pointCloud",source:"",vs:v,fs:v,uniformTypes:{radiusPixels:"f32",sizeUnits:"i32",rowIndexOffset:"u32"}},y=`\
#version 300 es
#define SHADER_NAME point-cloud-layer-vertex-shader
in vec3 positions;
in vec3 instanceNormals;
in vec4 instanceColors;
in vec3 instancePositions;
in vec3 instancePositions64Low;
out vec4 vColor;
out vec2 unitPosition;
void main(void) {
geometry.worldPosition = instancePositions;
geometry.normal = project_normal(instanceNormals);
unitPosition = positions.xy;
geometry.uv = unitPosition;
geometry.pickingColor = picking_getPickingColorFromIndex(uint(gl_InstanceID) + pointCloud.rowIndexOffset);
vec3 offset = vec3(positions.xy * project_size_to_pixel(pointCloud.radiusPixels, pointCloud.sizeUnits), 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
#ifdef ANTIALIASING
float triangleRadiusPixels = length(offset.xy);
if (triangleRadiusPixels > 0.0) {
float coverageScale = 1.0 + 1.0 / project.devicePixelRatio / triangleRadiusPixels;
offset.xy *= coverageScale;
unitPosition *= coverageScale;
geometry.uv = unitPosition;
}
#endif
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
vec3 lightColor = lighting_getLightColor(instanceColors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, instanceColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,P=`\
#version 300 es
#define SHADER_NAME point-cloud-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 unitPosition;
out vec4 fragColor;
void main(void) {
geometry.uv = unitPosition.xy;
float distToCenter = length(unitPosition);
#ifdef ANTIALIASING
float edgePixels = (1.0 - distToCenter) / max(fwidth(distToCenter), 1e-6);
if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
#else
if (distToCenter > 1.0) {
#endif
discard;
}
fragColor = vColor;
#ifdef ANTIALIASING
fragColor.a *= smoothedge(0.0, edgePixels);
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,_=`\
struct PointCloudUniforms {
  radiusPixels: f32,
  sizeUnits: i32,
  rowIndexOffset: u32,
};

@group(0) @binding(0)
var<uniform> pointCloudUniforms: PointCloudUniforms;

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions: vec3<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceNormals: vec3<f32>,
  @location(4) instanceColors: vec4<f32>,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) unitPosition: vec2<f32>,
  @location(2) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  geometry.worldPosition = attributes.instancePositions;

  let centerResult = project_position_to_clipspace_and_commonspace(
    attributes.instancePositions,
    attributes.instancePositions64Low,
    vec3<f32>(0.0)
  );
  geometry.position = centerResult.commonPosition;
  geometry.normal = project_normal(attributes.instanceNormals);

  // Position on the enclosing triangle. Its edges are tangent to the unit circle.
  varyings.unitPosition = attributes.positions.xy;
  geometry.uv = varyings.unitPosition;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex + pointCloudUniforms.rowIndexOffset);

  // Find the center of the point and add the current vertex
#ifdef ANTIALIASING
  var offset = vec3<f32>(
#else
  var offset = vec3<f32>(
#endif
    attributes.positions.xy *
      project_unit_size_to_pixel(pointCloudUniforms.radiusPixels, pointCloudUniforms.sizeUnits),
    0.0
  );
  DECKGL_FILTER_SIZE(&offset, geometry);
#ifdef ANTIALIASING
  let triangleRadiusPixels = length(offset.xy);
  if (triangleRadiusPixels > 0.0) {
    // The triangle's inradius is half its vertex radius. Scaling its vertex radius by one device
    // pixel therefore adds half a device pixel around all three tangent points.
    let coverageScale = 1.0 + 1.0 / project.devicePixelRatio / triangleRadiusPixels;
    offset *= coverageScale;
    varyings.unitPosition *= coverageScale;
    geometry.uv = varyings.unitPosition;
  }
#endif

  varyings.position = centerResult.clipPosition;
  // DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  let clipPixels = project_pixel_size_to_clipspace(offset.xy);
  varyings.position.x += clipPixels.x;
  varyings.position.y += clipPixels.y;

  // Apply lighting
  let lightColor = lighting_getLightColor2(attributes.instanceColors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);

  // Apply opacity to instance color, or return instance picking color
  varyings.vColor = vec4(lightColor, attributes.instanceColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(vColor, geometry);
  varyings.pickingColor = geometry.pickingColor;

  DECKGL_FILTER_GL_POSITION(&varyings.position, geometry);

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  fragmentGeometry.uv = varyings.unitPosition;

  let distToCenter = length(varyings.unitPosition);
#ifdef ANTIALIASING
  let edgePixels = (1.0 - distToCenter) / max(fwidth(distToCenter), 1e-6);
  if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
#else
  if (distToCenter > 1.0) {
#endif
    discard;
  }

  var fragColor: vec4<f32>;

  fragColor = varyings.vColor;

#ifdef ANTIALIASING
  fragColor.a *= smoothedge(0.0, edgePixels);
#endif

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    var extensionColor = vec4<f32>(varyings.pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(varyings.pickingColor - highlightedObjectColor))) {
      let highLightAlpha = picking.highlightColor.a;
      let blendedAlpha = highLightAlpha + fragColor.a * (1.0 - highLightAlpha);
      if (blendedAlpha > 0.0) {
        let highLightRatio = highLightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highLightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  // Apply premultiplied alpha as required by transparent canvas
  DECKGL_FILTER_COLOR(&fragColor, fragmentGeometry);
  fragColor = deckgl_premultiplied_alpha(fragColor);
  return fragColor;
}
`,C=t=>t.position,S=[0,0,0,255],b=[0,0,1];function I(t){let{header:e,attributes:i}=t;if(e&&i&&(t.length=e.vertexCount,i.POSITION&&(i.instancePositions=i.POSITION),i.NORMAL&&(i.instanceNormals=i.NORMAL),i.COLOR_0)){let{size:t,value:e}=i.COLOR_0;i.instanceColors={size:t,type:"unorm8",value:e}}}class L extends o.A{_getAttributeManager(){return h(this.props)?null:super._getAttributeManager()}getBounds(){return this.state?.columns?this.state.columns.getBounds():super.getBounds()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}get isLoaded(){return!this.state?.columns?.loading&&super.isLoaded}finalizeState(t){this.state.columns?.destroy(),super.finalizeState(t),this.state.geometry?.destroy()}getShaders(){let{antialiasing:t}=this.props;return super.getShaders({vs:y,fs:P,source:_,defines:t?{ANTIALIASING:1}:{},modules:[s.A,n.A,c.J,r.Ay,x]})}initializeState(){h(this.props)||this.initializeAccessorAttributes()}initializeAccessorAttributes(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getPosition"},instanceNormals:{size:3,transition:!0,accessor:"getNormal",defaultValue:b},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:S}})}updateState(t){if(h(this.props))return void this.updateColumnState(t);this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.internalState.attributeManager=super._getAttributeManager(),this.initializeAccessorAttributes(),this.state.model?.destroy(),this.state.model=this._getModel());let{changeFlags:e,props:i,oldProps:o}=t;super.updateState(t),(e.extensionsChanged||i.antialiasing!==o.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()),e.dataChanged&&I(i.data)}updateColumnState(t){if(this.props.extensions.length)throw Error("PointCloud Arrow columns do not support extensions");t.changeFlags.dataChanged&&I(this.props.data);let e=!this.state.columns;e&&(this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new m(this.context.device)),(e||t.changeFlags.extensionsChanged||t.props.antialiasing!==t.oldProps.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel());let i=this.props.data?.attributes;this.state.columns.updateIfNeeded(t,{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:t=>this.raiseError(t,"converting Arrow columns"),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!this.props.positions&&this.props.getPosition===C&&!i?.getPosition&&!i?.instancePositions}})}draw({uniforms:t}){let{pointSize:e,sizeUnits:i}=this.props,o=this.state.model,s={sizeUnits:a.p5[i],radiusPixels:e,rowIndexOffset:0};o.shaderInputs.setProps({pointCloud:s}),this.state.columns?this.state.columns.draw(o,this.context.renderPass,t=>{o.setInstanceCount(Math.min(o.instanceCount,Math.max(0,this.getNumInstances()-t))),o.shaderInputs.setProps({pointCloud:{rowIndexOffset:t}})}):o.draw(this.context.renderPass)}_getModel(){let t=[];for(let e=0;e<3;e++){let i=e/3*Math.PI*2;t.push(2*Math.cos(i),2*Math.sin(i),0)}let e=new u.V2({topology:"triangle-list",attributes:{positions:new Float32Array(t)}}),i={...this.getShaders(),id:this.props.id,bufferLayout:this.state.columns?.getBufferLayouts()??this.getAttributeManager().getBufferLayouts(),isInstanced:!0};return(this.state.geometry?.destroy(),this.state.geometry=void 0,this.state.columns)?(this.state.geometry=(0,g.M)(this.context.device,e),new d.X(this.context.device,{...i,geometry:this.state.geometry,inferDrawCount:"instance"})):new l.A(this.context.device,{...i,geometry:e})}}L.layerName="PointCloudLayer",L.defaultProps={sizeUnits:"pixels",pointSize:{type:"number",min:0,value:10},antialiasing:!1,getPosition:{type:"accessor",value:C},getNormal:{type:"accessor",value:b},getColor:{type:"accessor",value:S},positions:{type:"object",value:null,optional:!0},normals:{type:"object",value:null,optional:!0},colors:{type:"object",value:null,optional:!0},material:!0,radiusPixels:{deprecatedFor:"pointSize"}};let w=L},78168(t,e,i){i.d(e,{w:()=>a});var o=i(89907),s=i(25261),n=i(96489),r=i(63484);let a={name:"phongMaterial",firstBindingSlot:0,bindingLayout:[{name:"phongMaterial",group:3}],dependencies:[s.x,o.$n],source:n.X,vs:r.X,fs:r.l,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:t=>({...a.defaultUniforms,...t})}}}]);