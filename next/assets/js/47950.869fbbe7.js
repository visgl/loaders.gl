"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["47950"],{69198(e,t,i){i.d(t,{A:()=>C});var o=i(41881),n=i(84175),s=i(46487),r=i(95335),a=i(9350),l=i(37072),g=i(30638),c=i(25337);let d=`\
layout(std140) uniform pointCloudUniforms {
  float radiusPixels;
  highp int sizeUnits;
} pointCloud;
`,u={name:"pointCloud",source:"",vs:d,fs:d,uniformTypes:{radiusPixels:"f32",sizeUnits:"i32"}},p=`\
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
geometry.pickingColor = picking_getPickingColorFromInstanceID();
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
`,f=`\
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
`,h=`\
struct PointCloudUniforms {
  radiusPixels: f32,
  sizeUnits: i32,
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
  @location(4) instanceColors: vec4<f32>
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
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex);

  // Find the center of the point and add the current vertex
#ifdef ANTIALIASING
  var offset = vec3<f32>(
#else
  let offset = vec3<f32>(
#endif
    attributes.positions.xy *
      project_unit_size_to_pixel(pointCloudUniforms.radiusPixels, pointCloudUniforms.sizeUnits),
    0.0
  );
  // DECKGL_FILTER_SIZE(offset, geometry);
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

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  // var geometry: Geometry;
  // geometry.uv = unitPosition.xy;

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
  fragColor = deckgl_premultiplied_alpha(fragColor);

  return fragColor;
}
`,y=[0,0,0,255],m=[0,0,1];class v extends o.A{getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:p,fs:f,source:h,defines:e?{ANTIALIASING:1}:{},modules:[n.A,s.A,l.J,r.Ay,u]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceNormals:{size:3,transition:!0,accessor:"getNormal",defaultValue:m},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:y}})}updateState(e){let{changeFlags:t,props:i,oldProps:o}=e;super.updateState(e),(t.extensionsChanged||i.antialiasing!==o.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()),t.dataChanged&&function(e){let{header:t,attributes:i}=e;if(t&&i&&(e.length=t.vertexCount,i.POSITION&&(i.instancePositions=i.POSITION),i.NORMAL&&(i.instanceNormals=i.NORMAL),i.COLOR_0)){let{size:e,value:t}=i.COLOR_0;i.instanceColors={size:e,type:"unorm8",value:t}}}(i.data)}draw({uniforms:e}){let{pointSize:t,sizeUnits:i}=this.props,o=this.state.model,n={sizeUnits:a.p5[i],radiusPixels:t};o.shaderInputs.setProps({pointCloud:n}),o.draw(this.context.renderPass)}_getModel(){let e=[];for(let t=0;t<3;t++){let i=t/3*Math.PI*2;e.push(2*Math.cos(i),2*Math.sin(i),0)}return new g.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new c.V({topology:"triangle-list",attributes:{positions:new Float32Array(e)}}),isInstanced:!0})}}v.layerName="PointCloudLayer",v.defaultProps={sizeUnits:"pixels",pointSize:{type:"number",min:0,value:10},antialiasing:!1,getPosition:{type:"accessor",value:e=>e.position},getNormal:{type:"accessor",value:m},getColor:{type:"accessor",value:y},material:!0,radiusPixels:{deprecatedFor:"pointSize"}};let C=v},72734(e,t,i){i.d(t,{JM:()=>s,PI:()=>n,Sy:()=>o});let o=Math.PI/2,n=Math.PI,s=2*Math.PI},25529(e,t,i){i.d(t,{ie:()=>n.i,R2:()=>r.R,Zc:()=>a.Z,dO:()=>o.d,ZZ:()=>I,CB:()=>s.C}),i(77578);var o=i(56933),n=i(35116),s=i(14673),r=i(8018),a=i(74697);i(81307),i(18373),i(22170),i(58716),i(32573),i(53732),i(68442),i(64917);var l=i(87597),g=i(82557);let c=new g.d,d=new g.d,u=new g.d,p=new g.d,f=new g.d,h=[1,0,0],y=[2,2,1],m=new l.P,v=new l.P,C=new l.P,x=new l.P,P=new l.P,_=new g.d,A={diagonal:new g.d,unitary:new g.d};function I(e,t=new s.C){if(!e||0===e.length)return t.halfAxes=new g.d([0,0,0,0,0,0,0,0,0]),t.center=new l.P,t;let i=e.length,o=new l.P(0,0,0);for(let t of e)o.add(t);let n=1/i;o.multiplyByScalar(n);let r=0,a=0,L=0,b=0,E=0,S=0;for(let t of e){let e=m.copy(t).subtract(o);r+=e.x*e.x,a+=e.x*e.y,L+=e.x*e.z,b+=e.y*e.y,E+=e.y*e.z,S+=e.z*e.z}r*=n,a*=n,L*=n,b*=n,E*=n,S*=n,_[0]=r,_[1]=a,_[2]=L,_[3]=a,_[4]=b,_[5]=E,_[6]=L,_[7]=E,_[8]=S;let{unitary:N}=function(e,t={}){let i=0,o=0;d.identity(),u.copy(e);let n=1e-20*function(e){let t=0;for(let i=0;i<9;++i){let o=e[i];t+=o*o}return Math.sqrt(t)}(u);for(;o<10&&function(e){let t=0;for(let i=0;i<3;++i){let o=e[c.getElementIndex(y[i],h[i])];t+=2*o*o}return Math.sqrt(t)}(u)>n;)(function(e,t){let i=0,o=1;for(let t=0;t<3;++t){let n=Math.abs(e[c.getElementIndex(y[t],h[t])]);n>i&&(o=t,i=n)}let n=h[o],s=y[o],r=1,a=0;if(Math.abs(e[c.getElementIndex(s,n)])>1e-15){let t,i=(e[c.getElementIndex(s,s)]-e[c.getElementIndex(n,n)])/2/e[c.getElementIndex(s,n)];r=1/Math.sqrt(1+(t=i<0?-1/(-i+Math.sqrt(1+i*i)):1/(i+Math.sqrt(1+i*i)))*t),a=t*r}g.d.IDENTITY.to(t),t[c.getElementIndex(n,n)]=t[c.getElementIndex(s,s)]=r,t[c.getElementIndex(s,n)]=a,t[c.getElementIndex(n,s)]=-a})(u,p),f.copy(p).transpose(),u.multiplyRight(p),u.multiplyLeft(f),d.multiplyRight(p),++i>2&&(++o,i=0);return t.unitary=d.toTarget(t.unitary),t.diagonal=u.toTarget(t.diagonal),t}(_,A),M=t.halfAxes.copy(N),R=M.getColumn(0,C),w=M.getColumn(1,x),T=M.getColumn(2,P),O=-Number.MAX_VALUE,k=-Number.MAX_VALUE,z=-Number.MAX_VALUE,U=Number.MAX_VALUE,G=Number.MAX_VALUE,j=Number.MAX_VALUE;for(let t of e)m.copy(t),O=Math.max(m.dot(R),O),k=Math.max(m.dot(w),k),z=Math.max(m.dot(T),z),U=Math.min(m.dot(R),U),G=Math.min(m.dot(w),G),j=Math.min(m.dot(T),j);R=R.multiplyByScalar(.5*(U+O)),w=w.multiplyByScalar(.5*(G+k)),T=T.multiplyByScalar(.5*(j+z)),t.center.copy(R).add(w).add(T);let D=v.set(O-U,k-G,z-j).multiplyByScalar(.5),V=new g.d([D[0],0,0,0,D[1],0,0,0,D[2]]);return t.halfAxes.multiplyRight(V),t}}}]);