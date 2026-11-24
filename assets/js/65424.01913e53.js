"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["65424"],{44771(t,e,i){i.d(e,{A:()=>N});var n=i(66260),o=i(84175),r=i(46487),s=i(19754),a=i(9350),l=i(88599),c=i(87238),u=i(25337),d=i(3770),f=i(62459),h=i(60608);let g={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},normals:{attribute:"instanceNormals",accessor:"getNormal",semantic:"vector",size:3},colors:{attribute:"instanceColors",accessor:"getColor",semantic:"color",size:4}};function p(t){return Object.keys(g).some(e=>!!t[e])}class m extends h.h{constructor(t){super(t,g,"PointCloud")}}let y=`\
layout(std140) uniform pointCloudUniforms {
  float radiusPixels;
  highp int sizeUnits;
  highp uint rowIndexOffset;
} pointCloud;
`,v={name:"pointCloud",source:"",vs:y,fs:y,uniformTypes:{radiusPixels:"f32",sizeUnits:"i32",rowIndexOffset:"u32"}},C=`\
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
`,A=`\
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
`,b=t=>t.position,I=[0,0,0,255],x=[0,0,1];function _(t){let{header:e,attributes:i}=t;if(e&&i&&(t.length=e.vertexCount,i.POSITION&&(i.instancePositions=i.POSITION),i.NORMAL&&(i.instanceNormals=i.NORMAL),i.COLOR_0)){let{size:t,value:e}=i.COLOR_0;i.instanceColors={size:t,type:"unorm8",value:e}}}class w extends n.A{_getAttributeManager(){return p(this.props)?null:super._getAttributeManager()}getBounds(){return this.state?.columns?this.state.columns.getBounds():super.getBounds()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}get isLoaded(){return!this.state?.columns?.loading&&super.isLoaded}finalizeState(t){this.state.columns?.destroy(),super.finalizeState(t),this.state.geometry?.destroy()}getShaders(){let{antialiasing:t}=this.props;return super.getShaders({vs:C,fs:P,source:A,defines:t?{ANTIALIASING:1}:{},modules:[o.A,r.A,c.J,s.Ay,v]})}initializeState(){p(this.props)||this.initializeAccessorAttributes()}initializeAccessorAttributes(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getPosition"},instanceNormals:{size:3,transition:!0,accessor:"getNormal",defaultValue:x},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:I}})}updateState(t){if(p(this.props))return void this.updateColumnState(t);this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.internalState.attributeManager=super._getAttributeManager(),this.initializeAccessorAttributes(),this.state.model?.destroy(),this.state.model=this._getModel());let{changeFlags:e,props:i,oldProps:n}=t;super.updateState(t),(e.extensionsChanged||i.antialiasing!==n.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()),e.dataChanged&&_(i.data)}updateColumnState(t){if(this.props.extensions.length)throw Error("PointCloud Arrow columns do not support extensions");t.changeFlags.dataChanged&&_(this.props.data);let e=!this.state.columns;e&&(this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new m(this.context.device)),(e||t.changeFlags.extensionsChanged||t.props.antialiasing!==t.oldProps.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel());let i=this.props.data?.attributes;this.state.columns.updateIfNeeded(t,{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:t=>this.raiseError(t,"converting Arrow columns"),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!this.props.positions&&this.props.getPosition===b&&!i?.getPosition&&!i?.instancePositions}})}draw({uniforms:t}){let{pointSize:e,sizeUnits:i}=this.props,n=this.state.model,o={sizeUnits:a.p5[i],radiusPixels:e,rowIndexOffset:0};n.shaderInputs.setProps({pointCloud:o}),this.state.columns?this.state.columns.draw(n,this.context.renderPass,t=>{n.setInstanceCount(Math.min(n.instanceCount,Math.max(0,this.getNumInstances()-t))),n.shaderInputs.setProps({pointCloud:{rowIndexOffset:t}})}):n.draw(this.context.renderPass)}_getModel(){let t=[];for(let e=0;e<3;e++){let i=e/3*Math.PI*2;t.push(2*Math.cos(i),2*Math.sin(i),0)}let e=new u.V2({topology:"triangle-list",attributes:{positions:new Float32Array(t)}}),i={...this.getShaders(),id:this.props.id,bufferLayout:this.state.columns?.getBufferLayouts()??this.getAttributeManager().getBufferLayouts(),isInstanced:!0};return(this.state.geometry?.destroy(),this.state.geometry=void 0,this.state.columns)?(this.state.geometry=(0,d.M)(this.context.device,e),new f.X(this.context.device,{...i,geometry:this.state.geometry,inferDrawCount:"instance"})):new l.A(this.context.device,{...i,geometry:e})}}w.layerName="PointCloudLayer",w.defaultProps={sizeUnits:"pixels",pointSize:{type:"number",min:0,value:10},antialiasing:!1,getPosition:{type:"accessor",value:b},getNormal:{type:"accessor",value:x},getColor:{type:"accessor",value:I},positions:{type:"object",value:null,optional:!0},normals:{type:"object",value:null,optional:!0},colors:{type:"object",value:null,optional:!0},material:!0,radiusPixels:{deprecatedFor:"pointSize"}};let N=w},70327(t,e,i){function n(t){return!!(t&&Number.isInteger(t.numRows)&&Array.isArray(t.batches)&&Array.isArray(t.schema?.fields)&&"function"==typeof t.get&&"function"==typeof t.getChild)}function o(t){return!!(t&&Number.isInteger(t.numRows)&&Array.isArray(t.schema?.fields)&&Array.isArray(t.data?.children)&&"function"==typeof t.get&&"function"==typeof t.getChild)}function r(t){return 16===t.typeId}i.d(e,{$x:()=>o,_h:()=>n,rt:()=>r})},67701(t,e,i){i.d(e,{C:()=>r,o:()=>o});var n=i(14957);function o(t){return t.variadicBuffers??[]}function r(t,e,i,o,r,s,a,l){return Reflect.construct(n.B_,[t,e,i,o,r,s,a,l])}},58965(t,e,i){i.d(e,{F:()=>o,H:()=>r});var n=i(80382);function o(t){return t.metadata}function r(t,e,i){if("metadata"in n.g.prototype)return Object.assign(new n.g(t,e,i),{data:e});let o=Object.assign(new n.g(t,e),{data:e});return void 0===i?o:Object.assign(o,{metadata:i})}},98841(t,e,i){i.d(e,{Cs:()=>m,NP:()=>g,U2:()=>f,dn:()=>h,lq:()=>p});var n=i(98180),o=i(96179),r=i(9624),s=i(37589),a=i(64570),l=i(46252),c=i(58965),u=i(67701),d=i(74191);function f(t,e){let i=(0,d.V)(t,e);return{transport:"arrow-js",version:1,schema:n.s(new o.XI(i.schema,[])),metadataVersion:i.schema.metadataVersion,batches:i.batches.map(t=>{let e=(0,c.F)(t);return{...function t(e){return{offset:e.offset,length:e.length,nullCount:e.nullCount,buffers:{[a.NZ.OFFSET]:e.buffers[a.NZ.OFFSET],[a.NZ.DATA]:e.buffers[a.NZ.DATA],[a.NZ.VALIDITY]:e.buffers[a.NZ.VALIDITY],[a.NZ.TYPE]:e.buffers[a.NZ.TYPE]},children:e.children.map(e=>t(e)),variadicBuffers:(0,u.o)(e),dictionary:e.dictionary?.data.map(e=>t(e))}}(t.data),...void 0!==e?{metadata:[...e]}:{}}})}}function h(t){if("arrow-js"!==t.transport||1!==t.version)throw Error("Unsupported Arrow column-buffer transport protocol.");let e=n.D(t.schema).schema,i=new r.S(e.fields,e.metadata,e.dictionaries,t.metadataVersion),a=new s._k(i.fields),d=t.batches.map(t=>{let e=function t(e,i){let n=e.children.map((e,n)=>t(e,i.children[n].type)),o=e.dictionary&&s.pe.isDictionary(i)?new l.M(e.dictionary.map(e=>t(e,i.dictionary))):void 0;return(0,u.C)(i,e.offset,e.length,e.nullCount,e.buffers,n,o,e.variadicBuffers)}(t,a);return(0,c.H)(i,e,t.metadata&&new Map(t.metadata))});return new o.XI(i,d)}function g(t){return n.D("transport"in t?t.data:t)}function p(t,e){return f(new o.XI(t.schema,[t]),e)}function m(t){if(1!==t.batches.length)throw Error("Arrow record batch transport requires exactly one batch.");return h(t).batches[0]}},74191(t,e,i){i.d(e,{V:()=>c});var n=i(96179),o=i(64570),r=i(46252),s=i(58965),a=i(67701),l=i(70327);function c(t,e={}){var i,o;let r,s=new Set,g=new Set;for(let t of e.retain??[])for(let e of(0,l._h)(t)?t.batches.map(t=>t.data):u(t)?t.data:[(0,l.$x)(t)?t.data:t])!function t(e,i,n){if(!n.has(e)){for(let t of(n.add(e),[...Object.values(e.buffers),...(0,a.o)(e)]))p(t)&&i.add(t.buffer);for(let o of e.children)t(o,i,n);for(let o of e.dictionary?.data??[])t(o,i,n)}}(e,s,g);let m={...e,copies:new WeakMap,retainedBuffers:s};return(0,l._h)(t)?(i=t,o=m,r=i.batches.map(t=>d(t,o)),new n.XI(i.schema,r)):(0,l.$x)(t)?d(t,m):u(t)?h(t,m):f(t,m)}function u(t){return"data"in t&&Array.isArray(t.data)}function d(t,e){let i=f(t.data,e);return(0,s.H)(t.schema,i,(0,s.F)(t))}function f(t,e){let i=t.children.map(t=>f(t,e)),n=t.dictionary?h(t.dictionary,e):void 0,r={[o.NZ.OFFSET]:g(t.buffers[o.NZ.OFFSET],e),[o.NZ.DATA]:g(t.buffers[o.NZ.DATA],e),[o.NZ.VALIDITY]:g(t.buffers[o.NZ.VALIDITY],e),[o.NZ.TYPE]:g(t.buffers[o.NZ.TYPE],e)};return(0,a.C)(t.type,t.offset,t.length,t._nullCount,r,i,n,(0,a.o)(t).map(t=>g(t,e)))}function h(t,e){return new r.M(t.data.map(t=>f(t,e)))}function g(t,e){if(!p(t))return t;let i=0!==t.byteOffset||t.byteLength!==t.buffer.byteLength;if(!e.retainedBuffers.has(t.buffer)&&"all"!==e.copy&&("none"===e.copy||!i))return t;let n=e.copies.get(t);return n||(n=t instanceof Uint8Array?new Uint8Array(t):t.slice(),e.copies.set(t,n)),n}function p(t){return ArrayBuffer.isView(t)&&!(t instanceof DataView)}},72734(t,e,i){i.d(e,{JM:()=>r,PI:()=>o,Sy:()=>n});let n=Math.PI/2,o=Math.PI,r=2*Math.PI},80765(t,e,i){i.d(e,{$d:()=>a,C_:()=>r,LW:()=>o,pX:()=>s});var n=i(7704);function o(t){return"Float16Array"===(0,n.P)(t)}let r=globalThis.Float16Array;function s(){return r??Uint16Array}function a(t){return!!(r&&t===r)}},7704(t,e,i){i.d(e,{P:()=>o});let n=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),Symbol.toStringTag).get;function o(t){return ArrayBuffer.isView(t)?n.call(t):void 0}},65925(t,e,i){i.d(e,{i:()=>a});var n=i(87597),o=i(90218);let r=new n.P,s=new n.P;class a{constructor(t=[0,0,0],e=0){this.radius=-0,this.center=new n.P,this.fromCenterRadius(t,e)}fromCenterRadius(t,e){return this.center.from(t),this.radius=e,this}fromCornerPoints(t,e){return e=r.from(e),this.center=new n.P().from(t).add(e).scale(.5),this.radius=this.center.distance(e),this}equals(t){return this===t||!!t&&this.center.equals(t.center)&&this.radius===t.radius}clone(){return new a(this.center,this.radius)}union(t){let e=this.center,i=this.radius,n=t.center,o=t.radius,a=r.copy(n).subtract(e),l=a.magnitude();if(i>=l+o)return this.clone();if(o>=l+i)return t.clone();let c=(i+l+o)*.5;return s.copy(a).scale((-i+c)/l).add(e),this.center.copy(s),this.radius=c,this}expand(t){let e=r.from(t).subtract(this.center).magnitude();return e>this.radius&&(this.radius=e),this}transform(t){this.center.transform(t);let e=(0,o.IL)(r,t);return this.radius=Math.max(e[0],Math.max(e[1],e[2]))*this.radius,this}distanceSquaredTo(t){let e=this.distanceTo(t);return e*e}distanceTo(t){return Math.max(0,r.from(t).subtract(this.center).len()-this.radius)}intersectPlane(t){let e=this.center,i=this.radius,n=t.normal.dot(e)+t.distance;return n<-i?"outside":n<i?"intersecting":"inside"}}},35966(t,e,i){i.d(e,{R:()=>c});var n=i(87597),o=i(4990),r=i(12858);let s=[new n.P([1,0,0]),new n.P([0,1,0]),new n.P([0,0,1])],a=new n.P,l=new n.P;class c{constructor(t=[]){this.planes=t}fromBoundingSphere(t){this.planes.length=2*s.length;let e=t.center,i=t.radius,n=0;for(let t of s){let o=this.planes[n],s=this.planes[n+1];o||(o=this.planes[n]=new r.Z),s||(s=this.planes[n+1]=new r.Z);let c=a.copy(t).scale(-i).add(e);o.fromPointNormal(c,t);let u=a.copy(t).scale(i).add(e),d=l.copy(t).negate();s.fromPointNormal(u,d),n+=2}return this}fromViewProjection(t,e={}){let i=function(t,e={}){if(16!==t.length||Array.from(t).some(t=>!Number.isFinite(t)))throw RangeError("Expected a finite view-projection matrix");let[i,n]=function(t={}){let e=t.depthRange??"negative-one-to-one";if("negative-one-to-one"!==e&&"zero-to-one"!==e)throw RangeError("Unknown depth range");let i="zero-to-one"===e?0:-1;return t.reversedDepth?[1,i]:[i,1]}(e),o=Math.min(i,n),s=Math.max(i,n),a=e=>[t[e],t[e+4],t[e+8],t[e+12]],l=a(0),c=a(1),u=a(2),d=a(3),f=(t,e,i)=>t.map((t,n)=>t+i*e[n]),h=f(u,d,-o),g=d.map((t,e)=>s*t-u[e]),p=[f(d,l,1),f(d,l,-1),f(d,c,1),f(d,c,-1),...e.reversedDepth?[g,h]:[h,g]],m=[];for(let[t,e,i,n]of p){let o=Math.hypot(t,e,i);if(0===o){if(n<0)throw RangeError("Empty clipping volume")}else m.push(new r.Z([t/o,e/o,i/o],n/o))}if(m.length<4)throw RangeError("Degenerate clipping volume");return m}(t,e);return this.planes.splice(0,this.planes.length,...i),this}computeVisibility(t){let e="inside";for(let i of this.planes)switch(t.intersectPlane(i)){case"outside":return"outside";case"intersecting":e="intersecting"}return e}computeVisibilityWithPlaneMask(t,e){if((0,o.v)(Number.isFinite(e),"parentPlaneMask is required."),e===c.MASK_OUTSIDE||e===c.MASK_INSIDE)return e;let i=c.MASK_INSIDE,n=this.planes;for(let o=0;o<this.planes.length;++o){let r=o<31?1<<o:0;if(o<31&&(e&r)==0)continue;let s=n[o],a=t.intersectPlane(s);if("outside"===a)return c.MASK_OUTSIDE;"intersecting"===a&&(i|=r)}return i}}c.MASK_OUTSIDE=0xffffffff,c.MASK_INSIDE=0,c.MASK_INDETERMINATE=0x7fffffff},12858(t,e,i){i.d(e,{Z:()=>l});var n=i(87597),o=i(4990),r=i(54901);let s=new n.P,a=new n.P;class l{constructor(t=[0,0,1],e=0){this.normal=new n.P,this.distance=-0,this.fromNormalDistance(t,e)}fromNormalDistance(t,e){return(0,o.v)(Number.isFinite(e)),this.normal.from(t).normalize(),this.distance=e,this}fromPointNormal(t,e){t=s.from(t),this.normal.from(e).normalize();let i=-this.normal.dot(t);return this.distance=i,this}fromCoefficients(t,e,i,n){return this.normal.set(t,e,i),(0,o.v)((0,r.aI)(this.normal.len(),1)),this.distance=n,this}clone(){return new l(this.normal,this.distance)}equals(t){return(0,r.aI)(this.distance,t.distance)&&(0,r.aI)(this.normal,t.normal)}getPointDistance(t){return this.normal.dot(t)+this.distance}transform(t){let e=a.copy(this.normal).transformAsVector(t).normalize(),i=this.normal.scale(-this.distance).transform(t);return this.fromPointNormal(i,e)}projectPointOntoPlane(t,e=[0,0,0]){let i=s.from(t),n=this.getPointDistance(i),o=a.copy(this.normal).scale(n);return i.subtract(o).to(e)}intersectWithRay(t,e=new n.P){let i=t.origin,o=t.direction,r=this.normal,s=r.dot(o);if(1e-15>Math.abs(s))return;let a=(-this.distance-r.dot(i))/s;if(!(a<0))return e.copy(o).multiplyByScalar(a).add(i)}}}}]);