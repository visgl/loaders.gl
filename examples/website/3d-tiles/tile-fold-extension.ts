// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LayerExtension, project, type Layer, type Viewport} from '@deck.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';

/** Names of the fold shapes offered by the example. */
export type TileFoldShape = 'fold' | 'box' | 'bowl' | 'tube';

/** Properties added to a deck.gl layer by {@link TileFoldExtension}. */
export type TileFoldExtensionProps = {
  /** Position on the ground that the fold moves with, as longitude, latitude, and altitude. */
  tileFoldCenter?: readonly [number, number, number];
  /** Fold animation amount, where zero is flat and one is fully folded. */
  tileFoldAmount?: number;
  /** Distance from the center to the first hinge, in meters. */
  tileFoldHinge?: number;
  /** Arc length used to spend a half turn, in meters. */
  tileFoldLength?: number;
  /** Fold bearing clockwise from north, in degrees. */
  tileFoldBearing?: number;
  /** Named geometry produced by the cylindrical deformation. */
  tileFoldShape?: TileFoldShape;
};

type TileFoldModuleProps = Required<TileFoldExtensionProps> & {
  viewport: Viewport;
};

type TileFoldUniforms = {
  amount?: number;
  bearing?: number;
  centerCommon?: readonly [number, number, number];
  curl?: number;
  hinge?: number;
  length?: number;
  mode?: number;
};

const PI = Math.PI;

const SHAPE_SETTINGS: Record<TileFoldShape, {curl: number; mode: number}> = {
  fold: {curl: PI, mode: 0},
  box: {curl: PI, mode: 1},
  bowl: {curl: PI, mode: 2},
  tube: {curl: PI / 2, mode: 2}
};

const defaultProps: Required<TileFoldExtensionProps> = {
  tileFoldCenter: [0, 0, 0],
  tileFoldAmount: 0,
  tileFoldHinge: 120,
  tileFoldLength: 1400,
  tileFoldBearing: 0,
  tileFoldShape: 'fold'
};

const shaderModule: ShaderModule<TileFoldModuleProps, TileFoldUniforms> = {
  name: 'tileFold',
  dependencies: [project],
  vs: /* glsl */ `
layout(std140) uniform tileFoldUniforms {
  float amount;
  float bearing;
  vec3 centerCommon;
  float curl;
  float hinge;
  float length;
  float mode;
} tileFold;

vec3 tileFold_bendPosition(vec3 commonPosition, out vec2 foldAxis, out float foldAngle) {
  vec3 absoluteCommon = commonPosition + project.commonOrigin;
  vec3 relativeMeters = (absoluteCommon - tileFold.centerCommon) / project.commonUnitsPerMeter;
  vec2 flatPosition = relativeMeters.xy;

  vec2 authoredAxis = vec2(sin(tileFold.bearing), cos(tileFold.bearing));
  float authoredDistance = dot(flatPosition, authoredAxis);
  vec2 mirroredAxis = authoredAxis * (step(0.0, authoredDistance) * 2.0 - 1.0);
  vec2 radialAxis = normalize(flatPosition + vec2(0.00001));
  vec2 directionalAxis = mix(authoredAxis, mirroredAxis, min(tileFold.mode, 1.0));
  foldAxis = mix(directionalAxis, radialAxis, max(tileFold.mode - 1.0, 0.0));

  float along = dot(flatPosition, foldAxis);
  vec2 perpendicular = flatPosition - foldAxis * along;
  float arcDistance = max(along - tileFold.hinge, 0.0);
  float curvature = tileFold.amount * 3.1415926536 / max(tileFold.length, 1.0);
  float theta = max(arcDistance * curvature, 0.000001);
  float cappedTheta = min(theta, tileFold.curl);
  float ratio = cappedTheta / theta;
  float arc = arcDistance * ratio;
  float straight = arcDistance - arc;
  float sinTheta = sin(cappedTheta);
  float cosTheta = cos(cappedTheta);
  float halfSin = sin(cappedTheta * 0.5);

  float arcAlong = arc * sinTheta / cappedTheta;
  float arcUp = arc * halfSin * halfSin * 2.0 / cappedTheta;
  float bentAlong = along + (arcAlong - arcDistance) + straight * cosTheta - relativeMeters.z * sinTheta;
  float bentUp = arcUp + relativeMeters.z * cosTheta + straight * sinTheta;
  vec2 bentFlat = perpendicular + foldAxis * bentAlong;

  foldAngle = cappedTheta;
  vec3 bentMeters = vec3(bentFlat, bentUp);
  return (tileFold.centerCommon + bentMeters * project.commonUnitsPerMeter) - project.commonOrigin;
}

vec3 tileFold_bendNormal(vec3 normal, vec2 foldAxis, float foldAngle) {
  float normalAlong = dot(normal.xy, foldAxis);
  vec2 normalPerpendicular = normal.xy - foldAxis * normalAlong;
  float sinTheta = sin(foldAngle);
  float cosTheta = cos(foldAngle);
  float bentAlong = normalAlong * cosTheta - normal.z * sinTheta;
  float bentUp = normalAlong * sinTheta + normal.z * cosTheta;
  return normalize(vec3(normalPerpendicular + foldAxis * bentAlong, bentUp));
}
`,
  inject: {
    'vs:DECKGL_FILTER_GL_POSITION': /* glsl */ `
  vec2 tileFoldAxis;
  float tileFoldAngle;
  geometry.position.xyz = tileFold_bendPosition(geometry.position.xyz, tileFoldAxis, tileFoldAngle);
  geometry.normal = tileFold_bendNormal(geometry.normal, tileFoldAxis, tileFoldAngle);
  position = project_common_position_to_clipspace(geometry.position);
`
  },
  getUniforms: (props = {}): TileFoldUniforms => {
    const typedProps = props as Partial<TileFoldModuleProps>;
    if (!typedProps.viewport) {
      return {};
    }

    const {
      viewport,
      tileFoldAmount = defaultProps.tileFoldAmount,
      tileFoldBearing = defaultProps.tileFoldBearing,
      tileFoldCenter = defaultProps.tileFoldCenter,
      tileFoldHinge = defaultProps.tileFoldHinge,
      tileFoldLength = defaultProps.tileFoldLength,
      tileFoldShape = defaultProps.tileFoldShape
    } = typedProps;
    const shape = SHAPE_SETTINGS[tileFoldShape];

    return {
      amount: tileFoldAmount,
      bearing: (tileFoldBearing * PI) / 180,
      centerCommon: viewport.projectPosition([...tileFoldCenter]) as [number, number, number],
      curl: shape.curl,
      hinge: tileFoldHinge,
      length: tileFoldLength,
      mode: shape.mode
    };
  },
  uniformTypes: {
    amount: 'f32',
    bearing: 'f32',
    centerCommon: 'vec3<f32>',
    curl: 'f32',
    hinge: 'f32',
    length: 'f32',
    mode: 'f32'
  }
};

/**
 * Bends decoded tiled meshes in the vertex shader without changing their source data.
 *
 * The cylindrical deformation is adapted from David Ronai's MIT-licensed Dreamfold experiment:
 * https://github.com/Makio64/dreamfold
 */
export class TileFoldExtension extends LayerExtension {
  static defaultProps = defaultProps;
  static extensionName = 'TileFoldExtension';

  /** Adds the shared deformation shader to every primitive tile sublayer. */
  getShaders(): {modules: ShaderModule[]} {
    return {modules: [shaderModule]};
  }

  /** Updates fold uniforms for the active tile sublayer and viewport. */
  draw(this: Layer<TileFoldExtensionProps>, parameters: {context: {viewport: Viewport}}): void {
    this.setShaderModuleProps({
      tileFold: {
        viewport: parameters.context.viewport,
        tileFoldCenter: this.props.tileFoldCenter || defaultProps.tileFoldCenter,
        tileFoldAmount: this.props.tileFoldAmount ?? defaultProps.tileFoldAmount,
        tileFoldHinge: this.props.tileFoldHinge ?? defaultProps.tileFoldHinge,
        tileFoldLength: this.props.tileFoldLength ?? defaultProps.tileFoldLength,
        tileFoldBearing: this.props.tileFoldBearing ?? defaultProps.tileFoldBearing,
        tileFoldShape: this.props.tileFoldShape || defaultProps.tileFoldShape
      }
    });
  }
}
