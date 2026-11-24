"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["17728"],{33865(e,t,o){o.d(t,{A:()=>I});var i=o(66260),r=o(46487),s=o(84175),n=o(19754),a=o(7914),l=o(88599),c=o(67681);function u(e,t,o){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)?e.map((e,i)=>u(e,t[i],o)):o*t+(1-o)*e}globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}},globalThis.mathgl.config;let p=[.25,.5,.75],d=[[1/3,1/3,1/3],[.5,.25,.25],[.25,.5,.25],[.25,.25,.5]];function g(e,t){return Math.hypot(...e.source.map((e,o)=>e-t.source[o]))}function f(e,t){return e<=t?`${e}:${t}`:`${t}:${e}`}function h(e){return Number.isSafeInteger(e)&&e>0&&e<=0xffffffff}function v(e,t){return e[0].map((o,i)=>e.reduce((e,o,r)=>e+o[i]*t[r],0))}let m=new Uint32Array([0,2,1,0,3,2]),_=new Float32Array([0,1,0,0,1,0,1,1]);function b(e,t,o){return u(u(e[0],e[1],o),u(e[3],e[2],o),t)}var x=o(6053);let y=`\
layout(std140) uniform bitmapUniforms {
  vec4 bounds;
  float coordinateConversion;
  float desaturate;
  vec3 tintColor;
  vec4 transparentColor;
} bitmap;
`,w={name:"bitmap",source:`
struct BitmapUniforms {
  bounds: vec4<f32>,
  coordinateConversion: f32,
  desaturate: f32,
  tintColor: vec3<f32>,
  transparentColor: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> bitmap: BitmapUniforms;
@group(0) @binding(auto) var bitmapTexture: texture_2d<f32>;
@group(0) @binding(auto) var bitmapTextureSampler: sampler;
`,vs:y,fs:y,uniformTypes:{bounds:"vec4<f32>",coordinateConversion:"f32",desaturate:"f32",tintColor:"vec3<f32>",transparentColor:"vec4<f32>"}},C=`\
struct Attributes {
  @location(0) positions: vec3<f32>,
  @location(1) positions64Low: vec3<f32>,
  @location(2) texCoords: vec2<f32>,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vTexCoord: vec2<f32>,
  @location(1) vTexPos: vec2<f32>,
  @location(2) pickingColor: vec3<f32>,
  @location(3) pickingDepth: f32,
};

// from degrees to Web Mercator
fn lnglat_to_mercator(lnglat: vec2<f32>) -> vec2<f32> {
  let x = lnglat.x;
  let y = clamp(lnglat.y, -89.9, 89.9);
  return vec2<f32>(
    radians(x) + PI,
    PI + log(tan(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// from Web Mercator to degrees
fn mercator_to_lnglat(xy: vec2<f32>) -> vec2<f32> {
  let position = xy / WORLD_SCALE;
  return degrees(vec2<f32>(
    position.x - PI,
    atan(exp(position.y - PI)) * 2.0 - PI * 0.5
  ));
}

fn color_desaturate(colorValue: vec3<f32>) -> vec3<f32> {
  let luminance = (colorValue.r + colorValue.g + colorValue.b) * 0.333333333;
  return mix(colorValue, vec3<f32>(luminance), bitmap.desaturate);
}

fn color_tint(colorValue: vec3<f32>) -> vec3<f32> {
  return colorValue * bitmap.tintColor;
}

fn apply_opacity(colorValue: vec3<f32>, alpha: f32) -> vec4<f32> {
  if (bitmap.transparentColor.a == 0.0) {
    return vec4<f32>(colorValue, alpha);
  }
  let blendedAlpha = alpha + bitmap.transparentColor.a * (1.0 - alpha);
  let highLightRatio = alpha / blendedAlpha;
  let blendedRGB = mix(bitmap.transparentColor.rgb, colorValue, highLightRatio);
  return vec4<f32>(blendedRGB, blendedAlpha);
}

fn getUV(position: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(
    (position.x - bitmap.bounds[0]) / (bitmap.bounds[2] - bitmap.bounds[0]),
    (position.y - bitmap.bounds[3]) / (bitmap.bounds[1] - bitmap.bounds[3])
  );
}

// Pack the top 12 bits of two normalized floats into three 8-bit values.
fn packUVsIntoRGB(uv: vec2<f32>) -> vec3<f32> {
  let uv8bit = floor(uv * 256.0);
  let uvFraction = fract(uv * 256.0);
  let uvFraction4bit = floor(uvFraction * 16.0);
  let fractions = uvFraction4bit.x + uvFraction4bit.y * 16.0;
  return vec3<f32>(uv8bit, fractions) / 255.0;
}

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var output: Varyings;
  geometry.worldPosition = attributes.positions;
  geometry.uv = attributes.texCoords;
  geometry.pickingColor = picking_getPickingColorFromIndex(0u);

  let projectedPosition = project_position_to_clipspace_and_commonspace(
    attributes.positions,
    attributes.positions64Low,
    vec3<f32>(0.0)
  );
  geometry.position = projectedPosition.commonPosition;
  output.position = projectedPosition.clipPosition;
  output.vTexCoord = attributes.texCoords;
  output.vTexPos = vec2<f32>(0.0);
  output.pickingColor = geometry.pickingColor;

  if (bitmap.coordinateConversion < -0.5) {
    output.vTexPos = geometry.position.xy + project.commonOrigin.xy;
  } else if (bitmap.coordinateConversion > 0.5) {
    output.vTexPos = geometry.worldPosition.xy;
  }

  DECKGL_FILTER_GL_POSITION(&output.position, geometry);
  output.pickingDepth = output.position.z / output.position.w;

  return output;
}

@fragment
fn fragmentMain(input: Varyings) -> @location(0) vec4<f32> {
  var uv = input.vTexCoord;
  if (bitmap.coordinateConversion < -0.5) {
    uv = getUV(mercator_to_lnglat(input.vTexPos));
  } else if (bitmap.coordinateConversion > 0.5) {
    uv = getUV(lnglat_to_mercator(input.vTexPos));
  }

  let bitmapColor = textureSample(bitmapTexture, bitmapTextureSampler, uv);
  var fragColor = apply_opacity(
    color_tint(color_desaturate(bitmapColor.rgb)),
    bitmapColor.a * layer.opacity
  );

  geometry.uv = uv;

  fragmentGeometry.uv = geometry.uv;

  if (picking.isActive > 0.5) {
    if (picking.isAttribute > 0.5) {
      var extensionColor = vec4<f32>(input.pickingDepth, 0.0, 0.0, 1.0);
      DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
      // Color filters may discard, but must not alter the picking payload.
      return vec4<f32>(input.pickingDepth, 0.0, 0.0, 1.0);
    }
    var extensionColor = vec4<f32>(packUVsIntoRGB(uv), 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(packUVsIntoRGB(uv), 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(input.pickingColor - highlightedObjectColor))) {
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

  DECKGL_FILTER_COLOR(&fragColor, fragmentGeometry);
  return deckgl_premultiplied_alpha(fragColor);
}
`,P=`\
#version 300 es
#define SHADER_NAME bitmap-layer-vertex-shader

in vec2 texCoords;
in vec3 positions;
in vec3 positions64Low;

out vec2 vTexCoord;
out vec2 vTexPos;

const vec3 pickingColor = vec3(1.0, 0.0, 0.0);

void main(void) {
  geometry.worldPosition = positions;
  geometry.uv = texCoords;
  geometry.pickingColor = pickingColor;

  gl_Position = project_position_to_clipspace(positions, positions64Low, vec3(0.0), geometry.position);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  vTexCoord = texCoords;

  if (bitmap.coordinateConversion < -0.5) {
    vTexPos = geometry.position.xy + project.commonOrigin.xy;
  } else if (bitmap.coordinateConversion > 0.5) {
    vTexPos = geometry.worldPosition.xy;
  }

  vec4 color = vec4(0.0);
  DECKGL_FILTER_COLOR(color, geometry);
}
`,S=`
vec3 packUVsIntoRGB(vec2 uv) {
  // Extract the top 8 bits. We want values to be truncated down so we can add a fraction
  vec2 uv8bit = floor(uv * 256.);

  // Calculate the normalized remainders of u and v parts that do not fit into 8 bits
  // Scale and clamp to 0-1 range
  vec2 uvFraction = fract(uv * 256.);
  vec2 uvFraction4bit = floor(uvFraction * 16.);

  // Remainder can be encoded in blue channel, encode as 4 bits for pixel coordinates
  float fractions = uvFraction4bit.x + uvFraction4bit.y * 16.;

  return vec3(uv8bit, fractions) / 255.;
}
`,A=`\
#version 300 es
#define SHADER_NAME bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture;

in vec2 vTexCoord;
in vec2 vTexPos;

out vec4 fragColor;

/* projection utils */
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / PI / 2.0;

// from degrees to Web Mercator
vec2 lnglat_to_mercator(vec2 lnglat) {
  float x = lnglat.x;
  float y = clamp(lnglat.y, -89.9, 89.9);
  return vec2(
    radians(x) + PI,
    PI + log(tan(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// from Web Mercator to degrees
vec2 mercator_to_lnglat(vec2 xy) {
  xy /= WORLD_SCALE;
  return degrees(vec2(
    xy.x - PI,
    atan(exp(xy.y - PI)) * 2.0 - PI * 0.5
  ));
}
/* End projection utils */

// apply desaturation
vec3 color_desaturate(vec3 color) {
  float luminance = (color.r + color.g + color.b) * 0.333333333;
  return mix(color, vec3(luminance), bitmap.desaturate);
}

// apply tint
vec3 color_tint(vec3 color) {
  return color * bitmap.tintColor;
}

// blend with background color
vec4 apply_opacity(vec3 color, float alpha) {
  if (bitmap.transparentColor.a == 0.0) {
    return vec4(color, alpha);
  }
  float blendedAlpha = alpha + bitmap.transparentColor.a * (1.0 - alpha);
  float highLightRatio = alpha / blendedAlpha;
  vec3 blendedRGB = mix(bitmap.transparentColor.rgb, color, highLightRatio);
  return vec4(blendedRGB, blendedAlpha);
}

vec2 getUV(vec2 pos) {
  return vec2(
    (pos.x - bitmap.bounds[0]) / (bitmap.bounds[2] - bitmap.bounds[0]),
    (pos.y - bitmap.bounds[3]) / (bitmap.bounds[1] - bitmap.bounds[3])
  );
}

${S}

void main(void) {
  vec2 uv = vTexCoord;
  if (bitmap.coordinateConversion < -0.5) {
    vec2 lnglat = mercator_to_lnglat(vTexPos);
    uv = getUV(lnglat);
  } else if (bitmap.coordinateConversion > 0.5) {
    vec2 commonPos = lnglat_to_mercator(vTexPos);
    uv = getUV(commonPos);
  }
  vec4 bitmapColor = texture(bitmapTexture, uv);

  fragColor = apply_opacity(color_tint(color_desaturate(bitmapColor.rgb)), bitmapColor.a * layer.opacity);

  geometry.uv = uv;
  DECKGL_FILTER_COLOR(fragColor, geometry);

  if (bool(picking.isActive) && !bool(picking.isAttribute)) {
    // Since instance information is not used, we can use picking color for pixel index
    fragColor.rgb = packUVsIntoRGB(uv);
  }
}
`;class L extends i.A{getShaders(){return super.getShaders({vs:P,fs:A,source:C,modules:[r.A,s.A,n.Ay,w]})}initializeState(){this.getAttributeManager().add({indices:{size:1,isIndexed:!0,update:e=>e.value=this.state.mesh.indices,noAlloc:!0},positions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),update:function(e){let{positions:t,projectedPositions:o}=this.state.mesh;if(o){e.value=o;return}let{transform:i}=e.settings;if(!i){e.value=t;return}let r=new Float64Array(t.length);for(let e=0;e<t.length;e+=3)r.set(i.call(this,t.subarray(e,e+3)),e);e.value=r},noAlloc:!0},texCoords:{size:2,update:e=>e.value=this.state.mesh.texCoords,noAlloc:!0}})}updateState({props:e,oldProps:t,changeFlags:o}){let i=this.getAttributeManager();o.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),i.invalidateAll());let r=this.getSubdivisionStep();if(e.bounds!==t.bounds||o.projectionChanged||this.state.subdivisionStep!==r||e._projectionTolerance!==t._projectionTolerance||this.state.preproject&&(!(0,a.b)(e.modelMatrix,t.modelMatrix,1)||!(0,a.b)(e.coordinateOrigin,t.coordinateOrigin,1))){let e=this.state.mesh,t=this._createMesh();for(let o in this.state.model.setVertexCount(t.vertexCount),t)e&&e[o]!==t[o]&&i.invalidate(o);this.setState({mesh:t,subdivisionStep:r,...this._getCoordinateUniforms()})}else e._imageCoordinateSystem!==t._imageCoordinateSystem&&this.setState(this._getCoordinateUniforms())}getPickingInfo(e){let{image:t}=this.props,o=e.info;if(!o.color||!t)return o.bitmap=null,o;let{width:i,height:r}=t;o.index=0;let s=function(e){let[t,o,i]=e;return[(t+(15&i)/16)/256,(o+(240&i)/256)/256]}(o.color);return o.bitmap={size:{width:i,height:r},uv:s,pixel:[Math.floor(s[0]*i),Math.floor(s[1]*r)]},o}disablePickingIndex(){this.setState({disablePicking:!0})}restorePickingColors(){this.setState({disablePicking:!1})}_updateAutoHighlight(e){super._updateAutoHighlight({...e,color:this.encodePickingColor(0)})}_createMesh(){let{bounds:e}=this.props,t=e;T(e)&&(t=[[e[0],e[1]],[e[0],e[3]],[e[2],e[3]],[e[2],e[1]]]);let o=this.props._projectionTolerance,i=this.usePositionTransforms().transform?.bind(this);if(o&&!i)throw Error("_projectionTolerance requires a preprojecting viewport");let r=o?(0,x.A)(this.state.packedCrs):null;if(o&&!r)throw Error("_projectionTolerance requires projected coordinates with linear units");return function e(t,o,i){if(i)return function(t,o,{transform:i,tolerance:r,scale:s}){let n=e(t,o),a=Float64Array.from(n.texCoords);for(let e=1;e<a.length;e+=2)a[e]=1-a[e];let l=function(e,t){let{transform:o,tolerance:i,errorMetric:r,refinement:s="transform-error",size:n=2,targetSize:a=n,maxEdgeLength:l=1/0,maxDepth:c=10,maxVertices:u=65536,maxTriangles:m=131072}=t;if("function"!=typeof o||void 0!==r&&"function"!=typeof r||"transform-error"!==s&&"source-edge"!==s||"transform-error"===s&&(void 0===i||!Number.isFinite(i)||i<=0)||"source-edge"===s&&(void 0!==i||void 0!==r||!Number.isFinite(l))||2!==n&&3!==n||2!==a&&3!==a||!(l>0)||!Number.isFinite(l)&&l!==1/0||!Number.isInteger(c)||c<0||c>30||!h(u)||!h(m)||!Number.isSafeInteger(e.positions.length)||e.positions.length<0||e.positions.length%n!=0||!Number.isSafeInteger(e.indices.length)||e.indices.length<0||e.indices.length%3!=0)throw RangeError("Invalid triangle mesh subdivision options or input lengths");if(e.positions.length/n>u||e.indices.length/3>m)throw RangeError("Input mesh exceeds subdivision limits");let _=[],b=[];for(let t=0;t<e.positions.length;t+=n){let o=Array.from({length:n},(o,i)=>e.positions[t+i]);if(!o.every(Number.isFinite))throw RangeError("Source positions must be finite");_.push({source:o,target:x(o),weights:new Map([[t/n,1]])})}for(let t=0;t<e.indices.length;t+=3){let o=Array.from({length:3},(o,i)=>e.indices[t+i]);if(!o.every(e=>Number.isInteger(e)&&e>=0&&e<_.length))throw RangeError("Triangle indices must reference input vertices");b.push({vertices:o,sourceTriangle:t/3})}for(let e=0;;e++){let t=new Set;for(let e of b)if("source-edge"===s)for(let o=0;o<3;o++){let i=e.vertices[o],r=e.vertices[(o+1)%3];g(_[i],_[r])>l&&t.add(f(i,r))}else if(function(e){let t=e.vertices.map(e=>_[e]),o=!1;for(let e=0;e<3;e++){let r=t[e],s=t[(e+1)%3];for(let e of(g(r,s)>l&&(o=!0),p))y([r,s],[1-e,e])>(i??1/0)&&(o=!0)}for(let e of d)y(t,e)>(i??1/0)&&(o=!0);return o}(e)){let[o,i,r]=e.vertices;t.add(f(o,i)),t.add(f(i,r)),t.add(f(r,o))}if(!t.size)return function(){let e=new Uint32Array(3*_.length),t=new Float64Array(3*_.length);for(let o=0;o<_.length;o++){let i=0;for(let[r,s]of _[o].weights)e[3*o+i]=r,t[3*o+i++]=s}return{sourcePositions:new Float64Array(_.flatMap(e=>e.source)),positions:new Float64Array(_.flatMap(e=>e.target)),indices:new Uint32Array(b.flatMap(e=>e.vertices)),sourceVertexIndices:e,sourceVertexWeights:t,sourceTriangleIndices:new Uint32Array(b.map(e=>e.sourceTriangle))}}();if(e>=c)throw RangeError("Triangle mesh subdivision exceeded maxDepth");let o=new Map,r=[];for(let e of b)!function(e,t,o,i){let[r,s,n]=e.vertices,a=o.has(f(r,s))?w(r,s,i):-1,l=o.has(f(s,n))?w(s,n,i):-1,c=o.has(f(n,r))?w(n,r,i):-1,u=Number(a>=0)+Number(l>=0)+Number(c>=0);if(0===u)p(r,s,n);else if(3===u)p(r,a,c),p(a,s,l),p(c,l,n),p(a,l,c);else{let e=[r,s,n],t=[a,l,c],o=1===u?t.findIndex(e=>e>=0):t.findIndex(e=>e<0),i=1===u?o:(o+1)%3,d=e[i],g=e[(i+1)%3],f=e[(i+2)%3],h=t[i];if(1===u)p(d,h,f),p(h,g,f);else{let e=t[(i+1)%3];p(g,e,h),p(d,h,f),p(h,e,f)}}function p(o,i,r){if(t.length>=m)throw RangeError("Triangle mesh subdivision exceeded maxTriangles");t.push({vertices:[o,i,r],sourceTriangle:e.sourceTriangle})}}(e,r,t,o);b=r}function x(e){let t=o(e.slice());if(!t||t.length!==a)throw RangeError("Transform must return targetSize components");let i=Array.from(t);if(!i.every(Number.isFinite))throw RangeError("Transform returned nonfinite coordinates");return i}function y(e,t){let o=v(e.map(e=>e.source),t),i=v(e.map(e=>e.target),t),s=x(o);if(!r)return Math.hypot(...s.map((e,t)=>e-i[t]));let n=r({source:o,exact:s,interpolated:i});if(!Number.isFinite(n)||n<0)throw RangeError("errorMetric must return a finite nonnegative value");return n}function w(e,t,o){let i=f(e,t),r=o.get(i);if(void 0!==r)return r;if(_.length>=u)throw RangeError("Triangle mesh subdivision exceeded maxVertices");let s=v([_[e].source,_[t].source],[.5,.5]),n=new Map;for(let o of[_[e],_[t]])for(let[e,t]of o.weights)n.set(e,(n.get(e)||0)+.5*t);if(n.size>3)throw Error("Inconsistent mesh provenance");let a=_.length;return _.push({source:s,target:x(s),weights:n}),o.set(i,a),a}}({positions:a,indices:n.indices},{size:2,targetSize:3,tolerance:r,transform:e=>{let o=b(t,e[0],e[1]);return i([o[0],o[1],o[2]??0]).map((e,t)=>e*s[t])}}),c=l.sourcePositions.length/2,u=new Float64Array(3*c),m=new Float32Array(2*c);for(let e=0;e<c;e++){let o=l.sourcePositions[2*e],i=l.sourcePositions[2*e+1],r=b(t,o,i);u.set([r[0],r[1],r[2]??0],3*e),m.set([o,1-i],2*e)}return{vertexCount:l.indices.length,positions:u,projectedPositions:l.positions.map((e,t)=>e/s[t%3]),indices:l.indices,texCoords:m}}(t,o,i);if(!o){var r=t;let e=new Float64Array(12);for(let t=0;t<r.length;t++)e[3*t+0]=r[t][0],e[3*t+1]=r[t][1],e[3*t+2]=r[t][2]||0;return{vertexCount:6,positions:e,indices:m,texCoords:_}}let s=Math.max(Math.abs(t[0][0]-t[3][0]),Math.abs(t[1][0]-t[2][0])),n=Math.max(Math.abs(t[1][1]-t[0][1]),Math.abs(t[2][1]-t[3][1])),a=Math.ceil(s/o)+1,l=Math.ceil(n/o)+1,c=(a-1)*(l-1)*6,u=new Uint32Array(c),x=new Float32Array(a*l*2),y=new Float64Array(a*l*3),w=0,C=0;for(let e=0;e<a;e++){let o=e/(a-1);for(let i=0;i<l;i++){let r=i/(l-1),s=b(t,o,r);y[3*w+0]=s[0],y[3*w+1]=s[1],y[3*w+2]=s[2]||0,x[2*w+0]=o,x[2*w+1]=1-r,e>0&&i>0&&(u[C++]=w-l,u[C++]=w-l-1,u[C++]=w-1,u[C++]=w-l,u[C++]=w-1,u[C++]=w),w++}}return{vertexCount:c,positions:y,indices:u,texCoords:x}}(t,this.getSubdivisionStep(),o?{transform:i,tolerance:o,scale:r}:void 0)}_getModel(){let e="webgpu"===this.context.device.type?this.getAttributeManager().getBufferLayouts({isInstanced:!1}).filter(e=>"indices"!==e.name):this.getAttributeManager().getBufferLayouts();return new l.A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:e,topology:"triangle-list",isInstanced:!1})}draw(e){let{shaderModuleProps:t}=e,{model:o,coordinateConversion:i,bounds:r,disablePicking:s}=this.state,{image:n,desaturate:a,transparentColor:l,tintColor:c}=this.props;if((!t.picking.isActive||!s)&&n&&o){let e={bitmapTexture:n,bounds:r,coordinateConversion:i,desaturate:a,tintColor:c.slice(0,3).map(e=>e/255),transparentColor:l.map(e=>e/255)};o.shaderInputs.setProps({bitmap:e}),o.draw(this.context.renderPass)}}_getCoordinateUniforms(){let{_imageCoordinateSystem:e}=this.props;if(!this.state.preproject&&"default"!==e){let{bounds:t}=this.props;if(!T(t))throw Error("_imageCoordinateSystem only supports rectangular bounds");let o=this.context.viewport.isGeospatial&&this.context.viewport.crs?.signature!=="OSMTile512"?"lnglat":"cartesian";if("lnglat"==(e="lnglat"===e?"lnglat":"cartesian")&&"cartesian"===o)return{coordinateConversion:-1,bounds:t};if("cartesian"===e&&"lnglat"===o){let e=(0,c.Gw)([t[0],t[1]]),o=(0,c.Gw)([t[2],t[3]]);return{coordinateConversion:1,bounds:[e[0],e[1],o[0],o[1]]}}}return{coordinateConversion:0,bounds:[0,0,0,0]}}}L.layerName="BitmapLayer",L.defaultProps={image:{type:"image",value:null,async:!0},bounds:{type:"array",value:[1,0,0,1],compare:!0},_imageCoordinateSystem:"default",_projectionTolerance:{type:"number",value:0,min:0},desaturate:{type:"number",min:0,max:1,value:0},transparentColor:{type:"color",value:[0,0,0,0]},tintColor:{type:"color",value:[255,255,255]},textureParameters:{type:"object",ignore:!0,value:null}};let I=L;function T(e){return Number.isFinite(e[0])}},87115(e,t,o){o.d(t,{A:()=>S});var i=o(66260),r=o(84175),s=o(46487),n=o(19754),a=o(9350),l=o(88599),c=o(25337),u=o(3770),p=o(62459),d=o(60608);let g={sourcePositions:{attribute:"instanceSourcePositions",accessor:"getSourcePosition",semantic:"position",size:3},targetPositions:{attribute:"instanceTargetPositions",accessor:"getTargetPosition",semantic:"position",size:3},colors:{attribute:"instanceColors",accessor:"getColor",semantic:"color",size:4},widths:{attribute:"instanceWidths",accessor:"getWidth",semantic:"scalar",size:1,defaultValue:1}};function f(e){return Object.keys(g).some(t=>!!e[t])}class h extends d.h{constructor(e){super(e,g,"Line")}}let v=`\
layout(std140) uniform lineUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float useShortestPath;
  highp int widthUnits;
  highp uint rowIndexOffset;
} line;
`,m={name:"line",source:"",vs:v,fs:v,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",useShortestPath:"f32",widthUnits:"i32",rowIndexOffset:"u32"}},_=`\
// ---------- Helper Structures & Functions ----------

// Placeholder filter functions.
fn deckgl_filter_size(offset: vec3<f32>, geometry: Geometry) -> vec3<f32> {
  return offset;
}
fn deckgl_filter_gl_position(p: vec4<f32>, geometry: Geometry) -> vec4<f32> {
  if (picking.isAttribute > 0.5) {
    // For depth picking, write normalized depth into the picking payload.
    // This mirrors the legacy DECKGL_FILTER_GL_POSITION injection target on WebGL.
  }
  return p;
}

// Compute an extrusion offset given a line direction (in clipspace),
// an offset direction (-1 or 1), and a width in pixels.
// Assumes a uniform "project" with a viewportSize field is available.
fn getExtrusionOffset(line_clipspace: vec2<f32>, offset_direction: f32, width: f32) -> vec2<f32> {
  // project.viewportSize should be provided as a uniform (not shown here)
  let dir_screenspace = normalize(line_clipspace * project.viewportSize);
  // Rotate by 90\xb0 clockwise so the strip (-1 side first) winds counter-clockwise
  let rotated = vec2<f32>(dir_screenspace.y, -dir_screenspace.x);
  return rotated * offset_direction * width / 2.0;
}

// Splits the line between two points at a given x coordinate.
// Interpolates the y and z components.
fn splitLine(a: vec3<f32>, b: vec3<f32>, x: f32) -> vec3<f32> {
  let t: f32 = (x - a.x) / (b.x - a.x);
  return vec3<f32>(x, a.yz + t * (b.yz - a.yz));
}

// ---------- Uniforms & Global Structures ----------

struct LineUniforms {
  widthScale: f32,
  widthMinPixels: f32,
  widthMaxPixels: f32,
  useShortestPath: f32,
  widthUnits: i32,
  rowIndexOffset: u32,
};

@group(0) @binding(0)
var<uniform> line: LineUniforms;


// ---------- Vertex Output Structure ----------

struct Varyings {
  @builtin(position) gl_Position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) pickingColor: vec3<f32>,
};

// ---------- Vertex Shader Entry Point ----------

@vertex
fn vertexMain(
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec3<f32>,
  @location(1) instanceSourcePositions: vec3<f32>,
  @location(2) instanceTargetPositions: vec3<f32>,
  @location(3) instanceSourcePositions64Low: vec3<f32>,
  @location(4) instanceTargetPositions64Low: vec3<f32>,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instanceWidths: f32
) -> Varyings {
  geometry.worldPosition = instanceSourcePositions;
  geometry.worldPositionAlt = instanceTargetPositions;

  var source_world: vec3<f32> = instanceSourcePositions;
  var target_world: vec3<f32> = instanceTargetPositions;
  var source_world_64low: vec3<f32> = instanceSourcePositions64Low;
  var target_world_64low: vec3<f32> = instanceTargetPositions64Low;

  // Apply shortest-path adjustments if needed.
  if (line.useShortestPath > 0.5 || line.useShortestPath < -0.5) {
    source_world.x = (source_world.x + 180.0 % 360.0) - 180.0;
    target_world.x = (target_world.x + 180.0 % 360.0) - 180.0;
    let deltaLng: f32 = target_world.x - source_world.x;

    if (deltaLng * line.useShortestPath > 180.0) {
      source_world.x = source_world.x + 360.0 * line.useShortestPath;
      source_world = splitLine(source_world, target_world, 180.0 * line.useShortestPath);
      source_world_64low = vec3<f32>(0.0, 0.0, 0.0);
    } else if (deltaLng * line.useShortestPath < -180.0) {
      target_world.x = target_world.x + 360.0 * line.useShortestPath;
      target_world = splitLine(source_world, target_world, 180.0 * line.useShortestPath);
      target_world_64low = vec3<f32>(0.0, 0.0, 0.0);
    } else if (line.useShortestPath < 0.0) {
      var abortOut: Varyings;
      abortOut.gl_Position = vec4<f32>(0.0);
      abortOut.vColor = vec4<f32>(0.0);
      abortOut.uv = vec2<f32>(0.0);
      DECKGL_FILTER_GL_POSITION(&abortOut.gl_Position, geometry);
      return abortOut;
    }
  }

  // Project Pos and target positions to clip space.
  let sourceResult = project_position_to_clipspace_and_commonspace(source_world, source_world_64low, vec3<f32>(0.0));
  let targetResult = project_position_to_clipspace_and_commonspace(target_world, target_world_64low, vec3<f32>(0.0));
  let sourcePos: vec4<f32> = sourceResult.clipPosition;
  let targetPos: vec4<f32> = targetResult.clipPosition;
  let source_commonspace: vec4<f32> = sourceResult.commonPosition;
  let target_commonspace: vec4<f32> = targetResult.commonPosition;

  // Interpolate along the line segment.
  let segmentIndex: f32 = positions.x;
  let p: vec4<f32> = sourcePos + segmentIndex * (targetPos - sourcePos);
  geometry.position = source_commonspace + segmentIndex * (target_commonspace - source_commonspace);
#ifdef ANTIALIASING
  var uv: vec2<f32> = positions.xy;
#else
  let uv: vec2<f32> = positions.xy;
#endif
  geometry.uv = uv;
  geometry.pickingColor = picking_getPickingColorFromIndex(instanceIndex + line.rowIndexOffset);

  // Determine width in pixels.
  let widthPixels: f32 = clamp(
    project_unit_size_to_pixel(instanceWidths * line.widthScale, line.widthUnits),
    line.widthMinPixels, line.widthMaxPixels
  );

  // Compute extrusion offset.
  let extrusion: vec2<f32> = getExtrusionOffset(targetPos.xy - sourcePos.xy, positions.y, widthPixels);
  let offset: vec3<f32> = vec3<f32>(extrusion, 0.0);

  // Apply deck.gl filter functions.
  var filteredOffset = deckgl_filter_size(offset, geometry);
  DECKGL_FILTER_SIZE(&filteredOffset, geometry);
#ifdef ANTIALIASING
  let halfWidthPixels = length(filteredOffset.xy);
  if (halfWidthPixels > 0.0) {
    // Keep the declared edge at abs(uv.y) == 1 while rasterizing the outer half of the centered
    // one-device-pixel coverage ramp.
    let coverageScale = 1.0 + 0.5 / project.devicePixelRatio / halfWidthPixels;
    filteredOffset *= coverageScale;
    uv.y *= coverageScale;
  }
  geometry.uv = uv;
#endif
  let filteredP = deckgl_filter_gl_position(p, geometry);

  let clipOffset: vec2<f32> = project_pixel_size_to_clipspace(filteredOffset.xy);
  let finalPosition: vec4<f32> = filteredP + vec4<f32>(clipOffset, 0.0, 0.0);

  // Compute color.
  var vColor: vec4<f32> = vec4<f32>(instanceColors.rgb, instanceColors.a * layer.opacity);
  // vColor = deckgl_filter_color(vColor, geometry);

  var output: Varyings;
  output.gl_Position = finalPosition;
  output.vColor = vColor;
  output.uv = uv;
  output.pickingColor = geometry.pickingColor;
  DECKGL_FILTER_GL_POSITION(&output.gl_Position, geometry);
  return output;
}

@fragment
fn fragmentMain(
  inputs: Varyings
) -> @location(0) vec4<f32> {
  let vColor = inputs.vColor;
  let uv = inputs.uv;
  let pickingColor = inputs.pickingColor;
  // Create and initialize geometry with the provided uv.
  var geometry: Geometry;
  geometry.uv = uv;
  fragmentGeometry.uv = geometry.uv;

  // Start with the input color.
  var fragColor: vec4<f32> = vColor;

#ifdef ANTIALIASING
  // Distance to the edge in device pixels, from the derivative of uv.y. Taken in uniform control
  // flow, ahead of the picking discard below
  let edgeCoord = abs(uv.y);
  let edgePixels = (1.0 - edgeCoord) / max(fwidth(edgeCoord), 1e-6);

  // Fragments outside the coverage ramp must not write depth or picking colors.
  if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
    discard;
  }

  // Feather one device pixel across the width, before premultiplication below. The ends are left
  // hard - they abut neighbors
  fragColor.a *= smoothedge(0.0, edgePixels);
#endif

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(pickingColor)) {
      discard;
    }
    var extensionColor = vec4<f32>(pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(pickingColor, 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(pickingColor - highlightedObjectColor))) {
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
`,b=`\
#version 300 es
#define SHADER_NAME line-layer-vertex-shader
in vec3 positions;
in vec3 instanceSourcePositions;
in vec3 instanceTargetPositions;
in vec3 instanceSourcePositions64Low;
in vec3 instanceTargetPositions64Low;
in vec4 instanceColors;
in float instanceWidths;
out vec4 vColor;
out vec2 uv;
vec2 getExtrusionOffset(vec2 line_clipspace, float offset_direction, float width) {
vec2 dir_screenspace = normalize(line_clipspace * project.viewportSize);
dir_screenspace = vec2(dir_screenspace.y, -dir_screenspace.x);
return dir_screenspace * offset_direction * width / 2.0;
}
vec3 splitLine(vec3 a, vec3 b, float x) {
float t = (x - a.x) / (b.x - a.x);
return vec3(x, mix(a.yz, b.yz, t));
}
void main(void) {
geometry.worldPosition = instanceSourcePositions;
geometry.worldPositionAlt = instanceTargetPositions;
vec3 source_world = instanceSourcePositions;
vec3 target_world = instanceTargetPositions;
vec3 source_world_64low = instanceSourcePositions64Low;
vec3 target_world_64low = instanceTargetPositions64Low;
if (line.useShortestPath > 0.5 || line.useShortestPath < -0.5) {
source_world.x = mod(source_world.x + 180., 360.0) - 180.;
target_world.x = mod(target_world.x + 180., 360.0) - 180.;
float deltaLng = target_world.x - source_world.x;
if (deltaLng * line.useShortestPath > 180.) {
source_world.x += 360. * line.useShortestPath;
source_world = splitLine(source_world, target_world, 180. * line.useShortestPath);
source_world_64low = vec3(0.0);
} else if (deltaLng * line.useShortestPath < -180.) {
target_world.x += 360. * line.useShortestPath;
target_world = splitLine(source_world, target_world, 180. * line.useShortestPath);
target_world_64low = vec3(0.0);
} else if (line.useShortestPath < 0.) {
gl_Position = vec4(0.);
return;
}
}
vec4 source_commonspace;
vec4 target_commonspace;
vec4 source = project_position_to_clipspace(source_world, source_world_64low, vec3(0.), source_commonspace);
vec4 target = project_position_to_clipspace(target_world, target_world_64low, vec3(0.), target_commonspace);
float segmentIndex = positions.x;
vec4 p = mix(source, target, segmentIndex);
geometry.position = mix(source_commonspace, target_commonspace, segmentIndex);
uv = positions.xy;
geometry.uv = uv;
geometry.pickingColor = picking_getPickingColorFromIndex(uint(gl_InstanceID) + line.rowIndexOffset);
float widthPixels = clamp(
project_size_to_pixel(instanceWidths * line.widthScale, line.widthUnits),
line.widthMinPixels, line.widthMaxPixels
);
vec3 offset = vec3(
getExtrusionOffset(target.xy - source.xy, positions.y, widthPixels),
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
DECKGL_FILTER_GL_POSITION(p, geometry);
gl_Position = p + vec4(project_pixel_size_to_clipspace(offset.xy), 0.0, 0.0);
vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,x=`\
#version 300 es
#define SHADER_NAME line-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
fragColor = vColor;
#ifdef ANTIALIASING
float edgeCoord = abs(uv.y);
float edgePixels = (1.0 - edgeCoord) / max(fwidth(edgeCoord), 1e-6);
if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
discard;
}
fragColor.a *= smoothedge(0.0, edgePixels);
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,y=e=>e.sourcePosition,w=e=>e.targetPosition,C={getSourcePosition:{type:"accessor",value:y},getTargetPosition:{type:"accessor",value:w},getColor:{type:"accessor",value:[0,0,0,255]},getWidth:{type:"accessor",value:1},sourcePositions:{type:"object",value:null,optional:!0},targetPositions:{type:"object",value:null,optional:!0},colors:{type:"object",value:null,optional:!0},widths:{type:"object",value:null,optional:!0},widthUnits:"pixels",widthScale:{type:"number",value:1,min:0},widthMinPixels:{type:"number",value:0,min:0},widthMaxPixels:{type:"number",value:Number.MAX_SAFE_INTEGER,min:0},antialiasing:!1};class P extends i.A{getBounds(){return this.state?.columns?this.state.columns.getBounds():this.getAttributeManager()?.getBounds(["instanceSourcePositions","instanceTargetPositions"])}getModels(){return this.state?.wrappedModel&&this.state.model?[this.state.model,this.state.wrappedModel]:super.getModels()}_getAttributeManager(){return f(this.props)?null:super._getAttributeManager()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}get isLoaded(){return!this.state?.columns?.loading&&super.isLoaded}finalizeState(e){this.state.columns?.destroy(),super.finalizeState(e),this.state.geometry?.destroy()}getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:b,fs:x,source:_,defines:e?{ANTIALIASING:1}:{},modules:[r.A,s.A,n.Ay,m]})}get wrapLongitude(){return!1}initializeState(){f(this.props)||this.initializeAccessorAttributes()}initializeAccessorAttributes(){this.getAttributeManager().addInstanced({instanceSourcePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getSourcePosition"},instanceTargetPositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getTargetPosition"},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:[0,0,0,255]},instanceWidths:{size:1,transition:!0,accessor:"getWidth",defaultValue:1}})}updateState(e){if(f(this.props))return void this.updateColumnState(e);this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.internalState.attributeManager=super._getAttributeManager(),this.initializeAccessorAttributes(),this.state.model?.destroy(),this.state.wrappedModel?.destroy(),this.state.wrappedModel=void 0,this.state.model=this._getModel()),super.updateState(e);let{props:t,oldProps:o,changeFlags:i}=e;(i.extensionsChanged||t.antialiasing!==o.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}updateColumnState(e){if(this.props.extensions.length)throw Error("Line Arrow columns do not support extensions");let t=!this.state.columns;t&&(this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new h(this.context.device)),(t||e.changeFlags.extensionsChanged||e.props.antialiasing!==e.oldProps.antialiasing)&&(this.state.model?.destroy(),this.state.wrappedModel?.destroy(),this.state.wrappedModel=void 0,this.state.model=this._getModel(),this.state.wrappedModel=this._getModel(!0));let o=this.props.data?.attributes;this.state.columns.updateIfNeeded(e,{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:e=>this.raiseError(e,"converting Arrow columns"),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!this.props.sourcePositions&&this.props.getSourcePosition===y&&!o?.getSourcePosition&&!o?.instanceSourcePositions||!this.props.targetPositions&&this.props.getTargetPosition===w&&!o?.getTargetPosition&&!o?.instanceTargetPositions}})}draw({uniforms:e}){let{widthUnits:t,widthScale:o,widthMinPixels:i,widthMaxPixels:r}=this.props,s=this.props.wrapLongitude&&!this.state.preproject&&this.state.sourceCrs?.signature==="WGS84",n=this.state.model,l={widthUnits:a.p5[t],widthScale:o,widthMinPixels:i,widthMaxPixels:r,rowIndexOffset:0,useShortestPath:+!!s};if(n.shaderInputs.setProps({line:l}),this.state.columns?this.drawColumns(n):n.draw(this.context.renderPass),s){let e=this.state.columns?this.state.wrappedModel:n;e.shaderInputs.setProps({line:{...l,useShortestPath:-1}}),this.state.columns?this.drawColumns(e):e.draw(this.context.renderPass)}}drawColumns(e){this.state.columns.draw(e,this.context.renderPass,t=>{e.setInstanceCount(Math.min(e.instanceCount,Math.max(0,this.getNumInstances()-t))),e.shaderInputs.setProps({line:{rowIndexOffset:t}})})}_getModel(e=!1){let t=new c.V2({topology:"triangle-strip",attributes:{positions:{size:3,value:new Float32Array([0,-1,0,0,1,0,1,-1,0,1,1,0])}}}),o={...this.getShaders(),id:this.props.id,bufferLayout:this.state.columns?.getBufferLayouts()??this.getAttributeManager().getBufferLayouts(),isInstanced:!0};return this.state.columns?(e||(this.state.geometry?.destroy(),this.state.geometry=(0,u.M)(this.context.device,t)),new p.X(this.context.device,{...o,geometry:this.state.geometry,inferDrawCount:"instance"})):(this.state.geometry?.destroy(),this.state.geometry=void 0,new l.A(this.context.device,{...o,geometry:t}))}}P.layerName="LineLayer",P.defaultProps=C;let S=P}}]);