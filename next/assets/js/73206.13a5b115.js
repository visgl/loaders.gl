"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["73206"],{44771(t,e,i){i.d(e,{A:()=>L});var s=i(66260),o=i(84175),n=i(46487),r=i(19754),a=i(9350),l=i(88599),c=i(87238),u=i(25337),d=i(3770),h=i(62459),g=i(60608);let p={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},normals:{attribute:"instanceNormals",accessor:"getNormal",semantic:"vector",size:3},colors:{attribute:"instanceColors",accessor:"getColor",semantic:"color",size:4}};function f(t){return Object.keys(p).some(e=>!!t[e])}class m extends g.h{constructor(t){super(t,p,"PointCloud")}}let v=`\
layout(std140) uniform pointCloudUniforms {
  float radiusPixels;
  highp int sizeUnits;
  highp uint rowIndexOffset;
} pointCloud;
`,y={name:"pointCloud",source:"",vs:v,fs:v,uniformTypes:{radiusPixels:"f32",sizeUnits:"i32",rowIndexOffset:"u32"}},P=`\
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
`,C=`\
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
`,x=`\
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
`,I=t=>t.position,_=[0,0,0,255],A=[0,0,1];function b(t){let{header:e,attributes:i}=t;if(e&&i&&(t.length=e.vertexCount,i.POSITION&&(i.instancePositions=i.POSITION),i.NORMAL&&(i.instanceNormals=i.NORMAL),i.COLOR_0)){let{size:t,value:e}=i.COLOR_0;i.instanceColors={size:t,type:"unorm8",value:e}}}class S extends s.A{_getAttributeManager(){return f(this.props)?null:super._getAttributeManager()}getBounds(){return this.state?.columns?this.state.columns.getBounds():super.getBounds()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}get isLoaded(){return!this.state?.columns?.loading&&super.isLoaded}finalizeState(t){this.state.columns?.destroy(),super.finalizeState(t),this.state.geometry?.destroy()}getShaders(){let{antialiasing:t}=this.props;return super.getShaders({vs:P,fs:C,source:x,defines:t?{ANTIALIASING:1}:{},modules:[o.A,n.A,c.J,r.Ay,y]})}initializeState(){f(this.props)||this.initializeAccessorAttributes()}initializeAccessorAttributes(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getPosition"},instanceNormals:{size:3,transition:!0,accessor:"getNormal",defaultValue:A},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:_}})}updateState(t){if(f(this.props))return void this.updateColumnState(t);this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.internalState.attributeManager=super._getAttributeManager(),this.initializeAccessorAttributes(),this.state.model?.destroy(),this.state.model=this._getModel());let{changeFlags:e,props:i,oldProps:s}=t;super.updateState(t),(e.extensionsChanged||i.antialiasing!==s.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()),e.dataChanged&&b(i.data)}updateColumnState(t){if(this.props.extensions.length)throw Error("PointCloud Arrow columns do not support extensions");t.changeFlags.dataChanged&&b(this.props.data);let e=!this.state.columns;e&&(this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new m(this.context.device)),(e||t.changeFlags.extensionsChanged||t.props.antialiasing!==t.oldProps.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel());let i=this.props.data?.attributes;this.state.columns.updateIfNeeded(t,{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:t=>this.raiseError(t,"converting Arrow columns"),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!this.props.positions&&this.props.getPosition===I&&!i?.getPosition&&!i?.instancePositions}})}draw({uniforms:t}){let{pointSize:e,sizeUnits:i}=this.props,s=this.state.model,o={sizeUnits:a.p5[i],radiusPixels:e,rowIndexOffset:0};s.shaderInputs.setProps({pointCloud:o}),this.state.columns?this.state.columns.draw(s,this.context.renderPass,t=>{s.setInstanceCount(Math.min(s.instanceCount,Math.max(0,this.getNumInstances()-t))),s.shaderInputs.setProps({pointCloud:{rowIndexOffset:t}})}):s.draw(this.context.renderPass)}_getModel(){let t=[];for(let e=0;e<3;e++){let i=e/3*Math.PI*2;t.push(2*Math.cos(i),2*Math.sin(i),0)}let e=new u.V2({topology:"triangle-list",attributes:{positions:new Float32Array(t)}}),i={...this.getShaders(),id:this.props.id,bufferLayout:this.state.columns?.getBufferLayouts()??this.getAttributeManager().getBufferLayouts(),isInstanced:!0};return(this.state.geometry?.destroy(),this.state.geometry=void 0,this.state.columns)?(this.state.geometry=(0,d.M)(this.context.device,e),new h.X(this.context.device,{...i,geometry:this.state.geometry,inferDrawCount:"instance"})):new l.A(this.context.device,{...i,geometry:e})}}S.layerName="PointCloudLayer",S.defaultProps={sizeUnits:"pixels",pointSize:{type:"number",min:0,value:10},antialiasing:!1,getPosition:{type:"accessor",value:I},getNormal:{type:"accessor",value:A},getColor:{type:"accessor",value:_},positions:{type:"object",value:null,optional:!0},normals:{type:"object",value:null,optional:!0},colors:{type:"object",value:null,optional:!0},material:!0,radiusPixels:{deprecatedFor:"pointSize"}};let L=S},72734(t,e,i){i.d(e,{JM:()=>n,PI:()=>o,Sy:()=>s});let s=Math.PI/2,o=Math.PI,n=2*Math.PI},65925(t,e,i){i.d(e,{i:()=>a});var s=i(87597),o=i(90218);let n=new s.P,r=new s.P;class a{constructor(t=[0,0,0],e=0){this.radius=-0,this.center=new s.P,this.fromCenterRadius(t,e)}fromCenterRadius(t,e){return this.center.from(t),this.radius=e,this}fromCornerPoints(t,e){return e=n.from(e),this.center=new s.P().from(t).add(e).scale(.5),this.radius=this.center.distance(e),this}equals(t){return this===t||!!t&&this.center.equals(t.center)&&this.radius===t.radius}clone(){return new a(this.center,this.radius)}union(t){let e=this.center,i=this.radius,s=t.center,o=t.radius,a=n.copy(s).subtract(e),l=a.magnitude();if(i>=l+o)return this.clone();if(o>=l+i)return t.clone();let c=(i+l+o)*.5;return r.copy(a).scale((-i+c)/l).add(e),this.center.copy(r),this.radius=c,this}expand(t){let e=n.from(t).subtract(this.center).magnitude();return e>this.radius&&(this.radius=e),this}transform(t){this.center.transform(t);let e=(0,o.IL)(n,t);return this.radius=Math.max(e[0],Math.max(e[1],e[2]))*this.radius,this}distanceSquaredTo(t){let e=this.distanceTo(t);return e*e}distanceTo(t){return Math.max(0,n.from(t).subtract(this.center).len()-this.radius)}intersectPlane(t){let e=this.center,i=this.radius,s=t.normal.dot(e)+t.distance;return s<-i?"outside":s<i?"intersecting":"inside"}}},35966(t,e,i){i.d(e,{R:()=>c});var s=i(87597),o=i(4990),n=i(12858);let r=[new s.P([1,0,0]),new s.P([0,1,0]),new s.P([0,0,1])],a=new s.P,l=new s.P;class c{constructor(t=[]){this.planes=t}fromBoundingSphere(t){this.planes.length=2*r.length;let e=t.center,i=t.radius,s=0;for(let t of r){let o=this.planes[s],r=this.planes[s+1];o||(o=this.planes[s]=new n.Z),r||(r=this.planes[s+1]=new n.Z);let c=a.copy(t).scale(-i).add(e);o.fromPointNormal(c,t);let u=a.copy(t).scale(i).add(e),d=l.copy(t).negate();r.fromPointNormal(u,d),s+=2}return this}fromViewProjection(t,e={}){let i=function(t,e={}){if(16!==t.length||Array.from(t).some(t=>!Number.isFinite(t)))throw RangeError("Expected a finite view-projection matrix");let[i,s]=function(t={}){let e=t.depthRange??"negative-one-to-one";if("negative-one-to-one"!==e&&"zero-to-one"!==e)throw RangeError("Unknown depth range");let i="zero-to-one"===e?0:-1;return t.reversedDepth?[1,i]:[i,1]}(e),o=Math.min(i,s),r=Math.max(i,s),a=e=>[t[e],t[e+4],t[e+8],t[e+12]],l=a(0),c=a(1),u=a(2),d=a(3),h=(t,e,i)=>t.map((t,s)=>t+i*e[s]),g=h(u,d,-o),p=d.map((t,e)=>r*t-u[e]),f=[h(d,l,1),h(d,l,-1),h(d,c,1),h(d,c,-1),...e.reversedDepth?[p,g]:[g,p]],m=[];for(let[t,e,i,s]of f){let o=Math.hypot(t,e,i);if(0===o){if(s<0)throw RangeError("Empty clipping volume")}else m.push(new n.Z([t/o,e/o,i/o],s/o))}if(m.length<4)throw RangeError("Degenerate clipping volume");return m}(t,e);return this.planes.splice(0,this.planes.length,...i),this}computeVisibility(t){let e="inside";for(let i of this.planes)switch(t.intersectPlane(i)){case"outside":return"outside";case"intersecting":e="intersecting"}return e}computeVisibilityWithPlaneMask(t,e){if((0,o.v)(Number.isFinite(e),"parentPlaneMask is required."),e===c.MASK_OUTSIDE||e===c.MASK_INSIDE)return e;let i=c.MASK_INSIDE,s=this.planes;for(let o=0;o<this.planes.length;++o){let n=o<31?1<<o:0;if(o<31&&(e&n)==0)continue;let r=s[o],a=t.intersectPlane(r);if("outside"===a)return c.MASK_OUTSIDE;"intersecting"===a&&(i|=n)}return i}}c.MASK_OUTSIDE=0xffffffff,c.MASK_INSIDE=0,c.MASK_INDETERMINATE=0x7fffffff},12858(t,e,i){i.d(e,{Z:()=>l});var s=i(87597),o=i(4990),n=i(54901);let r=new s.P,a=new s.P;class l{constructor(t=[0,0,1],e=0){this.normal=new s.P,this.distance=-0,this.fromNormalDistance(t,e)}fromNormalDistance(t,e){return(0,o.v)(Number.isFinite(e)),this.normal.from(t).normalize(),this.distance=e,this}fromPointNormal(t,e){t=r.from(t),this.normal.from(e).normalize();let i=-this.normal.dot(t);return this.distance=i,this}fromCoefficients(t,e,i,s){return this.normal.set(t,e,i),(0,o.v)((0,n.aI)(this.normal.len(),1)),this.distance=s,this}clone(){return new l(this.normal,this.distance)}equals(t){return(0,n.aI)(this.distance,t.distance)&&(0,n.aI)(this.normal,t.normal)}getPointDistance(t){return this.normal.dot(t)+this.distance}transform(t){let e=a.copy(this.normal).transformAsVector(t).normalize(),i=this.normal.scale(-this.distance).transform(t);return this.fromPointNormal(i,e)}projectPointOntoPlane(t,e=[0,0,0]){let i=r.from(t),s=this.getPointDistance(i),o=a.copy(this.normal).scale(s);return i.subtract(o).to(e)}intersectWithRay(t,e=new s.P){let i=t.origin,o=t.direction,n=this.normal,r=n.dot(o);if(1e-15>Math.abs(r))return;let a=(-this.distance-n.dot(i))/r;if(!(a<0))return e.copy(o).multiplyByScalar(a).add(i)}}}}]);