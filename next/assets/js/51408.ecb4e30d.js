"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["51408"],{71987(e,t,o){o.d(t,{A:()=>ee});var i=o(25337),s=o(59452),n=o(68996),r=o(44771),a=o(31492),l=o(33577),c=o(88599),p=o(66260),u=o(84175),d=o(46487),g=o(78168),m=o(19754),h=o(60608),f=o(7914),v=o(55861),y=o(82192),C=o(3770),x=o(62459),_=o(21671);let b=`\
layout(std140) uniform simpleMeshUniforms {
  float sizeScale;
  bool composeModelMatrix;
  bool hasTexture;
  bool flatShading;
  highp uint rowIndexOffset;
} simpleMesh;
`,M={name:"simpleMesh",source:`\
struct SimpleMeshUniforms {
  sizeScale: f32,
  composeModelMatrix: f32,
  hasTexture: f32,
  flatShading: f32,
  rowIndexOffset: u32,
};

@group(0) @binding(auto) var<uniform> simpleMesh: SimpleMeshUniforms;
@group(0) @binding(auto) var simpleMeshTexture: texture_2d<f32>;
@group(0) @binding(auto) var simpleMeshTextureSampler: sampler;
`,vs:b,fs:b,uniformTypes:{sizeScale:"f32",composeModelMatrix:"f32",hasTexture:"f32",flatShading:"f32",rowIndexOffset:"u32"}},P=`#version 300 es
#define SHADER_NAME simple-mesh-layer-vs
in vec3 positions;
in vec3 normals;
in vec3 colors;
in vec2 texCoords;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
in vec3 instanceModelMatrixCol0;
in vec3 instanceModelMatrixCol1;
in vec3 instanceModelMatrixCol2;
in vec3 instanceTranslation;
out vec2 vTexCoord;
out vec3 cameraPosition;
out vec3 normals_commonspace;
out vec4 position_commonspace;
out vec4 vColor;
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = texCoords;
geometry.pickingColor = picking_getPickingColorFromIndex(uint(gl_InstanceID) + simpleMesh.rowIndexOffset);
vTexCoord = texCoords;
cameraPosition = project.cameraPosition;
vColor = vec4(colors * instanceColors.rgb, instanceColors.a);
mat3 instanceModelMatrix = mat3(instanceModelMatrixCol0, instanceModelMatrixCol1, instanceModelMatrixCol2);
vec3 pos = (instanceModelMatrix * positions) * simpleMesh.sizeScale + instanceTranslation;
if (simpleMesh.composeModelMatrix) {
DECKGL_FILTER_SIZE(pos, geometry);
normals_commonspace = project_normal(instanceModelMatrix * normals);
geometry.worldPosition += pos;
gl_Position = project_position_to_clipspace(pos + instancePositions, instancePositions64Low, vec3(0.0), position_commonspace);
geometry.position = position_commonspace;
}
else {
pos = project_size(pos);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, pos, position_commonspace);
geometry.position = position_commonspace;
normals_commonspace = project_normal(instanceModelMatrix * normals);
}
geometry.normal = normals_commonspace;
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,I=`#version 300 es
#define SHADER_NAME simple-mesh-layer-fs
precision highp float;
uniform sampler2D sampler;
in vec2 vTexCoord;
in vec3 cameraPosition;
in vec3 normals_commonspace;
in vec4 position_commonspace;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
geometry.uv = vTexCoord;
vec3 normal;
if (simpleMesh.flatShading) {
normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
} else {
normal = normals_commonspace;
}
vec4 color = simpleMesh.hasTexture ? texture(sampler, vTexCoord) : vColor;
DECKGL_FILTER_COLOR(color, geometry);
vec3 lightColor = lighting_getLightColor(color.rgb, cameraPosition, position_commonspace.xyz, normal);
fragColor = vec4(lightColor, color.a * layer.opacity);
}
`,A=`\
struct Attributes {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
  @location(2) colors: vec3<f32>,
  @location(3) texCoords: vec2<f32>,
  @location(4) instancePositions: vec3<f32>,
  @location(5) instancePositions64Low: vec3<f32>,
  @location(6) instanceColors: vec4<f32>,
  @location(7) instanceModelMatrixCol0: vec3<f32>,
  @location(8) instanceModelMatrixCol1: vec3<f32>,
  @location(9) instanceModelMatrixCol2: vec3<f32>,
  @location(10) instanceTranslation: vec3<f32>,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) texCoords: vec2<f32>,
  @location(2) normal: vec3<f32>,
  @location(3) positionCommon: vec3<f32>,
  @location(4) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  geometry.worldPosition = attributes.instancePositions;
  geometry.uv = attributes.texCoords;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex + simpleMesh.rowIndexOffset);

  let instanceModelMatrix = mat3x3<f32>(
    attributes.instanceModelMatrixCol0,
    attributes.instanceModelMatrixCol1,
    attributes.instanceModelMatrixCol2
  );
  var meshPosition =
    (instanceModelMatrix * attributes.positions) * simpleMesh.sizeScale +
    attributes.instanceTranslation;

  if (simpleMesh.composeModelMatrix > 0.5) {
    DECKGL_FILTER_SIZE(&meshPosition, geometry);
    geometry.normal = project_normal(instanceModelMatrix * attributes.normals);
    geometry.worldPosition += meshPosition;
    let projected = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions + meshPosition,
      attributes.instancePositions64Low,
      vec3<f32>(0.0)
    );
    geometry.position = projected.commonPosition;
    varyings.position = projected.clipPosition;
  } else {
    meshPosition = project_size_vec3(meshPosition);
    DECKGL_FILTER_SIZE(&meshPosition, geometry);
    let projected = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      meshPosition
    );
    geometry.position = projected.commonPosition;
    geometry.normal = project_normal(instanceModelMatrix * attributes.normals);
    varyings.position = projected.clipPosition;
  }

  varyings.color = vec4<f32>(
    attributes.colors * attributes.instanceColors.rgb,
    attributes.instanceColors.a
  );
  varyings.texCoords = attributes.texCoords;
  varyings.normal = geometry.normal;
  varyings.positionCommon = geometry.position.xyz;
  varyings.pickingColor = geometry.pickingColor;
  DECKGL_FILTER_GL_POSITION(&varyings.position, geometry);
  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = varyings.texCoords;
  fragmentGeometry.uv = geometry.uv;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    var extensionColor = vec4<f32>(varyings.pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  var color = varyings.color;
  if (simpleMesh.hasTexture > 0.5) {
    color = textureSample(simpleMeshTexture, simpleMeshTextureSampler, varyings.texCoords);
  }

  var normal = varyings.normal;
  if (simpleMesh.flatShading > 0.5) {
    // WebGPU's screen-space Y axis reverses the derivative orientation used by GLSL flat shading.
    normal = normalize(cross(dpdy(varyings.positionCommon), dpdx(varyings.positionCommon)));
  }

  color = vec4<f32>(
    lighting_getLightColor2(color.rgb, project.cameraPosition, varyings.positionCommon, normal),
    color.a * layer.opacity
  );

  if (picking.isHighlightActive > 0.5) {
    let highlightedColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(varyings.pickingColor - highlightedColor))) {
      let blendedAlpha = picking.highlightColor.a + color.a * (1.0 - picking.highlightColor.a);
      if (blendedAlpha > 0.0) {
        color = vec4<f32>(
          mix(color.rgb, picking.highlightColor.rgb, picking.highlightColor.a / blendedAlpha),
          blendedAlpha
        );
      }
    }
  }

  DECKGL_FILTER_COLOR(&color, fragmentGeometry);
  return deckgl_premultiplied_alpha(color);
}
`;var S=o(29581),L=o(34980);function T(e){let t=e.positions||e.POSITION;n.A.assert(t,'no "postions" or "POSITION" attribute in mesh');let o=t.value.length/t.size,i=e.COLOR_0||e.colors;i||(i={size:3,value:new Float32Array(3*o).fill(1)});let s=e.NORMAL||e.normals;s||(s={size:3,value:new Float32Array(3*o).fill(0)});let r=e.TEXCOORD_0||e.texCoords;return r||(r={size:2,value:new Float32Array(2*o).fill(0)}),{positions:t,colors:i,normals:s,texCoords:r}}function w(e){if(e instanceof i.V2)return e.attributes=T(e.attributes),e;if(!e.attributes)return new i.V2({topology:"triangle-list",attributes:T(e)});{let{indices:t}=e,o=t?.value,s=o instanceof Int32Array?{...t,value:new Uint32Array(o.buffer,o.byteOffset,o.length)}:t;return new i.V2({...e,indices:s,topology:"triangle-list",attributes:T(e.attributes)})}}let O=e=>e.position;function R(e){if(e instanceof y.u)return!!(e.attributes.normals||e.bufferLayout?.some(e=>e.attributes?.some(e=>"normals"===e.attribute)));let t=e.attributes||e;return!!(t.NORMAL||t.normals)}class k extends p.A{getShaders(){return super.getShaders({vs:P,fs:I,source:A,modules:[u.A,d.A,g.w,m.Ay,M]})}getBounds(){if(this.props._instanced)return this.state.columns?this.state.columns.getBounds():super.getBounds();let e=this.state.positionBounds;if(e)return e;let{mesh:t}=this.props;if(!t||t instanceof y.u)return null;if(!(e=t.header?.boundingBox)){let{attributes:o}=w(t);o.POSITION=o.POSITION||o.positions,e=(0,L.l)(o)}return this.state.positionBounds=e,e}initializeState(){this.initializeAccessorAttributes(),this.setState({emptyTexture:this.context.device.createTexture({data:new Uint8Array(4),width:1,height:1})})}initializeAccessorAttributes(){this.getAttributeManager().addInstanced({instancePositions:{transition:!0,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),size:3,accessor:"getPosition"},instanceColors:{type:"unorm8",transition:!0,size:this.props.colorFormat.length,accessor:"getColor",defaultValue:[0,0,0,255]},instanceModelMatrix:_.UB})}updateState(e){let{mesh:t}=e.props;if(t instanceof y.u&&t!==e.oldProps.mesh&&function(e){if(e.indices&&e.indices.data.length>1||Object.values(e.attributes).some(e=>e&&"data"in e&&e.data.length>1))throw Error("SimpleMeshLayer GPU mesh attributes and indices must be single-chunk")}(t),e.props.positions||e.props.colors)return void this.updateColumnState(e);let o=this.restoreAccessorState();super.updateState(e);let{props:i,oldProps:s,changeFlags:n}=e;(o||i.mesh!==s.mesh||n.extensionsChanged)&&(this.state.positionBounds=null,this.state.model?.destroy(),this.state.model=void 0,i.mesh&&(this.state.model=this.getModel(i.mesh),this.setState({hasNormals:R(i.mesh)})),this.getAttributeManager().invalidateAll()),i.texture!==s.texture&&i.texture instanceof v.g&&this.setTexture(i.texture),this.state.model&&this.state.model.setTopology(this.getMeshTopology())}updateColumnState(e){let{props:t,oldProps:o,changeFlags:i}=e;if(t.extensions.length||Object.keys(t.transitions||{}).length)throw Error("SimpleMesh Arrow columns do not support extensions or transitions");let s=!this.state.columns;s&&(this.state.model?.destroy(),this.state.model=void 0,this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new h.h(this.context.device,S.cc,"SimpleMesh")),(s||t.mesh!==o.mesh)&&this.updateColumnModel(t.mesh);let n=this.state.arrowModel;n&&(n.setTopology(this.getMeshTopology()),n.shaderInputs.setProps({simpleMesh:this.getTextureProps(t.texture)})),this.updateInstanceColumns(e)}getMeshTopology(){let{mesh:e,wireframe:t}=this.props;return t?"line-strip":e instanceof y.u?e.topology:"triangle-list"}updateColumnModel(e){if(this.state.arrowModel?.destroy(),this.state.ownedArrowGeometry?.destroy(),this.state.arrowModel=void 0,this.state.ownedArrowGeometry=void 0,this.state.positionBounds=null,!e)return;let t=e instanceof y.u?e:(0,C.M)(this.context.device,w(e));t!==e&&(this.state.ownedArrowGeometry=t),this.state.hasNormals=R(e),this.state.arrowModel=new x.X(this.context.device,{...this.getShaders(),id:this.props.id,geometry:t,bufferLayout:this.state.columns.getBufferLayouts(),isInstanced:!0,inferDrawCount:"instance"})}updateInstanceColumns({props:e,oldProps:t,changeFlags:o}){let i=S.EN.some(o=>{let i=e[o],s=t[o];return("function"!=typeof i||"function"!=typeof s)&&!(0,f.b)(i,s,1)});this.state.columns.updateIfNeeded({props:e,oldProps:t,changeFlags:{...o,dataChanged:o.dataChanged||!!i&&"mesh transforms changed"}},{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:e=>this.raiseError(e,"converting Arrow columns"),prepareFallbacks:(t,o,i)=>(0,S._3)(this.context.device,e,t,o,i),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!e.positions&&e.getPosition===O&&!e.data?.attributes?.getPosition}})}restoreAccessorState(){return!!this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.updateColumnModel(null),this.internalState.attributeManager=super._getAttributeManager(),this.initializeAccessorAttributes(),!0)}getModels(){return this.state?.arrowModel?[this.state.arrowModel]:super.getModels()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}finalizeState(e){super.finalizeState(e),this.state.columns?.destroy(),this.state.ownedArrowGeometry?.destroy(),this.state.emptyTexture.delete()}draw({uniforms:e}){let{columns:t}=this.state,o=this.state.arrowModel??this.state.model;if(!o)return;let{viewport:i,renderPass:s}=this.context,{sizeScale:n,coordinateSystem:r,_instanced:a}=this.props,l={sizeScale:n,rowIndexOffset:0,composeModelMatrix:!a||(0,_.wi)(i,this.state.sourceCrs?.signature||r,!!this.state.preproject),flatShading:!this.state.hasNormals};o.shaderInputs.setProps({simpleMesh:l}),t?t.draw(o,s,e=>{o.setInstanceCount(Math.min(o.instanceCount,Math.max(0,this.getNumInstances()-e))),o.shaderInputs.setProps({simpleMesh:{rowIndexOffset:e}})}):o.draw(s)}get isLoaded(){return!!((this.state?.model||this.state?.arrowModel)&&!this.state.columns?.loading&&super.isLoaded)}getModel(e){let t=new c.A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:e instanceof y.u?e:w(e),isInstanced:!0});return t.shaderInputs.setProps({simpleMesh:this.getTextureProps(this.props.texture)}),t}setTexture(e){let{model:t}=this.state;t&&t.shaderInputs.setProps({simpleMesh:this.getTextureProps(e)})}getTextureProps(e){let t=e||this.state.emptyTexture;return{..."webgpu"===this.context.device.type?{simpleMeshTexture:t}:{sampler:t},hasTexture:!!e}}}k.defaultProps={mesh:{type:"object",value:null,async:!0},texture:{type:"image",value:null,async:!0},positions:{type:"object",value:null,optional:!0},colors:{type:"object",value:null,optional:!0},sizeScale:{type:"number",value:1,min:0},_instanced:!0,wireframe:!1,material:!0,getPosition:{type:"accessor",value:O},getColor:{type:"accessor",value:[0,0,0,255]},getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},textureParameters:{type:"object",ignore:!0,value:null}},k.layerName="SimpleMeshLayer";let E=k,N=`\
layout(std140) uniform meshUniforms {
  bool pickFeatureIds;
} mesh;
`,z={name:"mesh",vs:N,fs:N,source:`\
struct MeshUniforms {
  pickFeatureIds: f32,
};

@group(0) @binding(auto) var<uniform> mesh: MeshUniforms;
`,uniformTypes:{pickFeatureIds:"f32"}};var U=o(9515);let F=U.s.source.replace(/fn pbr_setPositionNormalTangentUV\([\s\S]*?\n}\n/,`fn pbr_setPositionNormalTangentUV(position: vec4f, normal: vec4f, tangent: vec4f, uv: vec2f)
{
  fragmentInputs.pbr_vPosition = position.xyz;
  fragmentInputs.pbr_vNormal = normal.xyz;
  fragmentInputs.pbr_vTBN = mat3x3f(
    vec3f(1.0, 0.0, 0.0),
    vec3f(0.0, 1.0, 0.0),
    vec3f(0.0, 0.0, 1.0)
  );
  fragmentInputs.pbr_vUV0 = uv;
  fragmentInputs.pbr_vUV1 = uv;
}
`).replace(/pbrProjection\.camera/g,"project.cameraPosition"),j={...U.s,source:F},G=`#version 300 es
#define SHADER_NAME simple-mesh-layer-vs
in vec3 positions;
in vec3 normals;
in vec3 colors;
in vec2 texCoords;
in vec4 uvRegions;
in float rowIndexes;
in vec4 instanceColors;
in vec3 instanceModelMatrixCol0;
in vec3 instanceModelMatrixCol1;
in vec3 instanceModelMatrixCol2;
out vec2 vTexCoord;
out vec3 cameraPosition;
out vec3 normals_commonspace;
out vec4 position_commonspace;
out vec4 vColor;
vec2 applyUVRegion(vec2 uv) {
#ifdef HAS_UV_REGIONS
return fract(uv) * (uvRegions.zw - uvRegions.xy) + uvRegions.xy;
#else
return uv;
#endif
}
void main(void) {
vec2 uv = applyUVRegion(texCoords);
geometry.uv = uv;
if (mesh.pickFeatureIds) {
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
} else {
geometry.pickingColor = picking_getPickingColorFromInstanceID();
}
mat3 instanceModelMatrix = mat3(instanceModelMatrixCol0, instanceModelMatrixCol1, instanceModelMatrixCol2);
vTexCoord = uv;
cameraPosition = project.cameraPosition;
vColor = vec4(colors * instanceColors.rgb, instanceColors.a);
vec3 pos = (instanceModelMatrix * positions) * simpleMesh.sizeScale;
vec3 projectedPosition = project_position(positions);
position_commonspace = vec4(projectedPosition, 1.0);
gl_Position = project_common_position_to_clipspace(position_commonspace);
geometry.position = position_commonspace;
normals_commonspace = project_normal(instanceModelMatrix * normals);
geometry.normal = normals_commonspace;
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
#ifdef MODULE_PBRMATERIAL
pbr_vPosition = geometry.position.xyz;
#ifdef HAS_NORMALS
pbr_vNormal = geometry.normal;
#endif
#ifdef HAS_UV
pbr_vUV0 = uv;
#else
pbr_vUV0 = vec2(0., 0.);
#endif
pbr_vUV1 = vec2(0., 0.);
geometry.uv = pbr_vUV0;
#endif
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,D=`#version 300 es
#define SHADER_NAME simple-mesh-layer-fs
precision highp float;
uniform sampler2D sampler;
in vec2 vTexCoord;
in vec3 cameraPosition;
in vec3 normals_commonspace;
in vec4 position_commonspace;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
#ifdef MODULE_PBRMATERIAL
fragColor = vColor * pbr_filterColor(vec4(0));
geometry.uv = pbr_vUV0;
fragColor.a *= layer.opacity;
#else
geometry.uv = vTexCoord;
vec3 normal;
if (simpleMesh.flatShading) {
normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
} else {
normal = normals_commonspace;
}
vec4 color = simpleMesh.hasTexture ? texture(sampler, vTexCoord) : vColor;
vec3 lightColor = lighting_getLightColor(color.rgb, cameraPosition, position_commonspace.xyz, normal);
fragColor = vec4(lightColor, color.a * layer.opacity);
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,V=`\
struct VertexInputs {
  @location(0) positions: vec3<f32>,
#ifdef HAS_NORMALS
  @location(1) normals: vec3<f32>,
#endif
  @location(2) colors: vec4<f32>,
#ifdef HAS_UV
  @location(3) texCoords: vec2<f32>,
#endif
#ifdef HAS_UV_REGIONS
  @location(4) uvRegions: vec4<f32>,
#endif
#ifdef HAS_FEATURE_IDS
  @location(5) rowIndexes: u32,
#endif
  @location(6) instanceColors: vec4<f32>,
  @location(7) instanceModelMatrixCol0: vec3<f32>,
  @location(8) instanceModelMatrixCol1: vec3<f32>,
  @location(9) instanceModelMatrixCol2: vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) texCoord: vec2<f32>,
  @location(2) pbrPosition: vec3<f32>,
  @location(3) pbrNormal: vec3<f32>,
  @location(4) pickingColor: vec3<f32>,
};

fn applyUVRegion(uv: vec2<f32>, uvRegion: vec4<f32>) -> vec2<f32> {
#ifdef HAS_UV_REGIONS
  // https://github.com/Esri/i3s-spec/blob/master/docs/1.7/geometryUVRegion.cmn.md
  return fract(uv) * (uvRegion.zw - uvRegion.xy) + uvRegion.xy;
#else
  return uv;
#endif
}

@vertex
fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> FragmentInputs {
  var outputs: FragmentInputs;
  var texCoord = vec2<f32>(0.0);
  var normal = vec3<f32>(0.0, 0.0, 1.0);
  var uvRegion = vec4<f32>(0.0);

#ifdef HAS_UV
  texCoord = inputs.texCoords;
#endif
#ifdef HAS_NORMALS
  normal = inputs.normals;
#endif
#ifdef HAS_UV_REGIONS
  uvRegion = inputs.uvRegions;
#endif

  texCoord = applyUVRegion(texCoord, uvRegion);
  geometry.uv = texCoord;
#ifdef HAS_FEATURE_IDS
  geometry.pickingColor = picking_getPickingColorFromIndex(inputs.rowIndexes);
#else
  geometry.pickingColor = picking_getPickingColorFromIndex(instanceIndex);
#endif

  let instanceModelMatrix = mat3x3<f32>(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2
  );
  let commonPosition = vec4<f32>(project_position_vec3_f32(inputs.positions), 1.0);

  geometry.position = commonPosition;
  geometry.normal = project_normal(instanceModelMatrix * normal);

  outputs.position = project_common_position_to_clipspace(commonPosition);
  outputs.color = vec4<f32>(
    inputs.colors.rgb * inputs.instanceColors.rgb,
    inputs.instanceColors.a
  );
  outputs.texCoord = texCoord;
  outputs.pbrPosition = commonPosition.xyz;
  outputs.pbrNormal = geometry.normal;
  outputs.pickingColor = geometry.pickingColor;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  fragmentGeometry.uv = inputs.texCoord;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inputs.pickingColor)) {
      discard;
    }
    return vec4<f32>(inputs.pickingColor, 1.0);
  }

  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  fragmentInputs.pbr_vUV0 = inputs.texCoord;
  fragmentInputs.pbr_vUV1 = vec2<f32>(0.0);
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;

  var color = inputs.color * pbr_filterColor(vec4<f32>(0.0));
  color.a *= layer.opacity;

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inputs.pickingColor - highlightedObjectColor))) {
      let highlightAlpha = picking.highlightColor.a;
      let blendedAlpha = highlightAlpha + color.a * (1.0 - highlightAlpha);
      if (blendedAlpha > 0.0) {
        color = vec4<f32>(
          mix(color.rgb, picking.highlightColor.rgb, highlightAlpha / blendedAlpha),
          blendedAlpha
        );
      }
    }
  }

  return deckgl_premultiplied_alpha(color);
}
`;class H extends E{getShaders(){let e=super.getShaders();return{...e,vs:G,fs:D,source:V,modules:[...e.modules,j,z]}}initializeState(){let{featureIds:e}=this.props;super.initializeState();let t=this.getAttributeManager();e&&t.add({rowIndexes:{type:"uint32",size:1,noAlloc:!0,update:this.calculateFeatureIdsPickingIndexes}})}updateState(e){super.updateState(e);let{props:t,oldProps:o}=e;t.pbrMaterial!==o.pbrMaterial&&this.updatePbrMaterialUniforms(t.pbrMaterial)}draw(e){let{featureIds:t}=this.props,{model:o}=this.state;if(!o)return;let i={camera:this.context.viewport.cameraPosition};o.shaderInputs.setProps({pbrProjection:i,mesh:{pickFeatureIds:!!t}}),super.draw(e)}getModel(e){var t;let o,i,{id:s}=this.props,n=this.parseMaterial(this.props.pbrMaterial,e);this.setState({parsedPBRMaterial:n});let r=this.getShaders();return i=(o=(t=e.attributes).positions||t.POSITION).value.length/o.size,t.COLOR_0||t.colors||(t.colors={size:4,value:new Uint8Array(4*i).fill(255),normalized:!0}),new c.A(this.context.device,{...this.getShaders(),id:s,geometry:e,bufferLayout:this.getAttributeManager().getBufferLayouts(),defines:{...r.defines,...n?.defines,HAS_UV_REGIONS:+!!e.attributes.uvRegions,HAS_FEATURE_IDS:+!!this.props.featureIds},parameters:n?.parameters,isInstanced:!0})}updatePbrMaterialUniforms(e){let{model:t}=this.state;if(t){let{mesh:o}=this.props,i=this.parseMaterial(e,o);this.setState({parsedPBRMaterial:i});let{pbr_baseColorSampler:s}=i.bindings,{emptyTexture:n}=this.state,r=s||n,a={..."webgpu"===this.context.device.type?{simpleMeshTexture:r}:{sampler:r},hasTexture:!!s},{camera:l,...c}={...i.bindings,...i.uniforms};t.shaderInputs.setProps({simpleMesh:a,pbrMaterial:c})}}parseMaterial(e,t){let o=!!(e.pbrMetallicRoughness&&e.pbrMetallicRoughness.baseColorTexture);return(0,l.lO)(this.context.device,{unlit:o,...e},{NORMAL:t.attributes.normals,TEXCOORD_0:t.attributes.texCoords},{pbrDebug:!1,lights:!0,useTangents:!1})}calculateFeatureIdsPickingIndexes(e){e.value=new Uint32Array(this.props.featureIds)}finalizeState(e){super.finalizeState(e),this.state.parsedPBRMaterial?.generatedTextures.forEach(e=>e.destroy()),this.setState({parsedPBRMaterial:null})}}H.layerName="MeshLayer",H.defaultProps={pbrMaterial:{type:"object",value:null},featureIds:{type:"array",value:null,optional:!0}};var B=o(37244),K=o(2433),Z=o(47589),$=o(42542),X=o(23974),q=o(30371);let W=[0],Q={[-1]:"default",0:"cartesian",1:"lnglat",2:"meter-offsets",3:"lnglat-offsets"},J={getPointColor:{type:"accessor",value:[0,0,0,255]},pointSize:1,data:"",loader:q.i,onTilesetLoad:{type:"function",value:e=>{}},onTileLoad:{type:"function",value:e=>{}},onTileUnload:{type:"function",value:e=>{}},onTileError:{type:"function",value:(e,t,o)=>{}},_getMeshColor:{type:"function",value:e=>[255,255,255]}};class Y extends s.A{initializeState(){"onTileLoadFail"in this.props&&n.A.removed("onTileLoadFail","onTileError")(),this.state={layerMap:{},tileset3d:null,activeViewports:{},lastUpdatedViewports:null}}get isLoaded(){return!!(this.state?.tileset3d?.isLoaded()&&super.isLoaded)}shouldUpdateState({changeFlags:e}){return e.somethingChanged}updateState({props:e,oldProps:t,changeFlags:o}){if(e.data&&e.data!==t.data&&this._loadTileset(e.data),o.viewportChanged){let{activeViewports:e}=this.state;Object.keys(e).length&&(this._updateTileset(e),this.state.lastUpdatedViewports=e,this.state.activeViewports={})}if(o.propsChanged){let{layerMap:e}=this.state;for(let t in e)e[t].needsUpdate=!0}}finalizeState(e){this.state.tileset3d?.destroy(),this.state.tileset3d=null,this.state.layerMap={},this.state.activeViewports={},this.state.lastUpdatedViewports=null,super.finalizeState(e)}activateViewport(e){let{activeViewports:t,lastUpdatedViewports:o}=this.state;this.internalState.viewport=e,t[e.id]=e;let i=o?.[e.id];i&&e.equals(i)||(this.setChangeFlags({viewportChanged:!0}),this.setNeedsUpdate())}getPickingInfo({info:e,sourceLayer:t}){let o=t&&t.props.tile;return e.picked&&(e.object=o),e.sourceTile=o,e}filterSubLayer({layer:e,viewport:t,cullRect:o,isPicking:i}){let{tile:s}=e.props,{id:n}=t;if(!s.selected||!s.viewportIds.includes(n))return!1;if(i&&o&&s.content?.cartographicOrigin){let[e,i]=t.project(s.content.cartographicOrigin),n=o.x+o.width/2,r=o.y+o.height/2,a=Math.max(t.width,t.height)/4,l=e-n,c=i-r;if(l*l+c*c>a*a)return!1}return!0}_updateAutoHighlight(e){let t=e.sourceTile,o=this.state.layerMap[t?.id];o&&o.layer&&o.layer.updateAutoHighlight(e)}async _loadTileset(e){let t=this.props.loadOptions||{},o=this.props.loaders?.length?this.props.loaders:this.props.loader,i=Array.isArray(o)?o[0]:o,{tileset:s,...n}=t,r={loadOptions:{...n},...s},a={url:e,loader:i,coreApi:B.k},l="i3s"===i.id?new K.T(a,r.loadOptions):new Z.Q(a,r.loadOptions),c=new $.Q(l,{onTileLoad:this._onTileLoad.bind(this),onTileUnload:this._onTileUnload.bind(this),onTileError:this.props.onTileError,onUpdate:()=>this.setNeedsUpdate(),...r});await c.tilesetInitializationPromise,this.setState({tileset3d:c,layerMap:{}}),this._updateTileset(this.state.activeViewports),this.props.onTilesetLoad(c)}_onTileLoad(e){let{lastUpdatedViewports:t}=this.state;e.tileDrawn=!1,this.props.onTileLoad(e),this._updateTileset(t),this.setNeedsUpdate()}_onTileUnload(e){delete this.state.layerMap[e.id],this.props.onTileUnload(e)}_updateTileset(e){if(!e)return;let{tileset3d:t}=this.state,{timeline:o}=this.context,i=Object.keys(e).length;o&&i&&t&&t.selectTiles(Object.values(e)).then(e=>{this.state.frameNumber!==e&&this.setState({frameNumber:e})})}_getSubLayer(e,t){if(!e.content)return null;switch(e.type){case X.WH.POINTCLOUD:return this._makePointCloudLayer(e,t);case X.WH.SCENEGRAPH:return this._make3DModelLayer(e);case X.WH.MESH:return this._makeSimpleMeshLayer(e,t);default:throw Error(`Tile3DLayer: Failed to render layer of type ${e.content.type}`)}}_makePointCloudLayer(e,t){let{attributes:o,pointCount:i,constantRGBA:s,cartographicOrigin:n,modelMatrix:a}=e.content,{positions:l,normals:c,colors:p}=o;if(!l)return null;let u=t&&t.props.data||{header:{vertexCount:i},attributes:{POSITION:l,NORMAL:c,COLOR_0:p}},{pointSize:d,getPointColor:g}=this.props;return new(this.getSubLayerClass("pointcloud",r.A))({pointSize:d},this.getSubLayerProps({id:"pointcloud"}),{id:`${this.id}-pointcloud-${e.id}`,tile:e,data:u,coordinateSystem:"meter-offsets",coordinateOrigin:n,modelMatrix:a,getColor:s||g,_offset:0})}_make3DModelLayer(e){let{gltf:t,instances:o,cartographicOrigin:i,modelMatrix:s}=e.content;return new(this.getSubLayerClass("scenegraph",a.A))({_lighting:"pbr"},this.getSubLayerProps({id:"scenegraph"}),{id:`${this.id}-scenegraph-${e.id}`,tile:e,data:o||W,scenegraph:t,coordinateSystem:"meter-offsets",coordinateOrigin:i,modelMatrix:s,getTransformMatrix:e=>e.modelMatrix,getPosition:[0,0,0],_offset:0,onFirstDraw:()=>{e.tileDrawn=!0}})}_makeSimpleMeshLayer(e,t){var o;let s,{attributes:n,indices:r,modelMatrix:a,cartographicOrigin:l,coordinateSystem:c="meter-offsets",material:p,featureIds:u}=e.content,{_getMeshColor:d}=this.props,g=t&&t.props.mesh||new i.V2({topology:"triangle-list",attributes:((s={}).positions={...(o=n).positions,value:new Float32Array(o.positions.value)},o.normals&&(s.normals=o.normals),o.texCoords&&(s.texCoords=o.texCoords),o.colors&&(s.colors=o.colors),o.uvRegions&&(s.uvRegions=o.uvRegions),s),indices:r});return new(this.getSubLayerClass("mesh",H))(this.getSubLayerProps({id:"mesh"}),{id:`${this.id}-mesh-${e.id}`,tile:e,mesh:g,data:W,getColor:d(e),pbrMaterial:p,modelMatrix:a,coordinateOrigin:l,coordinateSystem:"number"==typeof c?Q[c]??c:c,featureIds:u,_offset:0})}renderLayers(){let{tileset3d:e,layerMap:t}=this.state;return e?e.tiles.map(e=>{let o=t[e.id]=t[e.id]||{tile:e},{layer:i}=o;return e.selected&&(i?o.needsUpdate&&(i=this._getSubLayer(e,i),o.needsUpdate=!1):i=this._getSubLayer(e)),o.layer=i,i}).filter(Boolean):null}}Y.defaultProps=J,Y.layerName="Tile3DLayer";let ee=Y},44771(e,t,o){o.d(t,{A:()=>S});var i=o(66260),s=o(84175),n=o(46487),r=o(19754),a=o(9350),l=o(88599),c=o(87238),p=o(25337),u=o(3770),d=o(62459),g=o(60608);let m={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},normals:{attribute:"instanceNormals",accessor:"getNormal",semantic:"vector",size:3},colors:{attribute:"instanceColors",accessor:"getColor",semantic:"color",size:4}};function h(e){return Object.keys(m).some(t=>!!e[t])}class f extends g.h{constructor(e){super(e,m,"PointCloud")}}let v=`\
layout(std140) uniform pointCloudUniforms {
  float radiusPixels;
  highp int sizeUnits;
  highp uint rowIndexOffset;
} pointCloud;
`,y={name:"pointCloud",source:"",vs:v,fs:v,uniformTypes:{radiusPixels:"f32",sizeUnits:"i32",rowIndexOffset:"u32"}},C=`\
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
`,x=`\
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
`,b=e=>e.position,M=[0,0,0,255],P=[0,0,1];function I(e){let{header:t,attributes:o}=e;if(t&&o&&(e.length=t.vertexCount,o.POSITION&&(o.instancePositions=o.POSITION),o.NORMAL&&(o.instanceNormals=o.NORMAL),o.COLOR_0)){let{size:e,value:t}=o.COLOR_0;o.instanceColors={size:e,type:"unorm8",value:t}}}class A extends i.A{_getAttributeManager(){return h(this.props)?null:super._getAttributeManager()}getBounds(){return this.state?.columns?this.state.columns.getBounds():super.getBounds()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}get isLoaded(){return!this.state?.columns?.loading&&super.isLoaded}finalizeState(e){this.state.columns?.destroy(),super.finalizeState(e),this.state.geometry?.destroy()}getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:C,fs:x,source:_,defines:e?{ANTIALIASING:1}:{},modules:[s.A,n.A,c.J,r.Ay,y]})}initializeState(){h(this.props)||this.initializeAccessorAttributes()}initializeAccessorAttributes(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getPosition"},instanceNormals:{size:3,transition:!0,accessor:"getNormal",defaultValue:P},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:M}})}updateState(e){if(h(this.props))return void this.updateColumnState(e);this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.internalState.attributeManager=super._getAttributeManager(),this.initializeAccessorAttributes(),this.state.model?.destroy(),this.state.model=this._getModel());let{changeFlags:t,props:o,oldProps:i}=e;super.updateState(e),(t.extensionsChanged||o.antialiasing!==i.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()),t.dataChanged&&I(o.data)}updateColumnState(e){if(this.props.extensions.length)throw Error("PointCloud Arrow columns do not support extensions");e.changeFlags.dataChanged&&I(this.props.data);let t=!this.state.columns;t&&(this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new f(this.context.device)),(t||e.changeFlags.extensionsChanged||e.props.antialiasing!==e.oldProps.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel());let o=this.props.data?.attributes;this.state.columns.updateIfNeeded(e,{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:e=>this.raiseError(e,"converting Arrow columns"),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!this.props.positions&&this.props.getPosition===b&&!o?.getPosition&&!o?.instancePositions}})}draw({uniforms:e}){let{pointSize:t,sizeUnits:o}=this.props,i=this.state.model,s={sizeUnits:a.p5[o],radiusPixels:t,rowIndexOffset:0};i.shaderInputs.setProps({pointCloud:s}),this.state.columns?this.state.columns.draw(i,this.context.renderPass,e=>{i.setInstanceCount(Math.min(i.instanceCount,Math.max(0,this.getNumInstances()-e))),i.shaderInputs.setProps({pointCloud:{rowIndexOffset:e}})}):i.draw(this.context.renderPass)}_getModel(){let e=[];for(let t=0;t<3;t++){let o=t/3*Math.PI*2;e.push(2*Math.cos(o),2*Math.sin(o),0)}let t=new p.V2({topology:"triangle-list",attributes:{positions:new Float32Array(e)}}),o={...this.getShaders(),id:this.props.id,bufferLayout:this.state.columns?.getBufferLayouts()??this.getAttributeManager().getBufferLayouts(),isInstanced:!0};return(this.state.geometry?.destroy(),this.state.geometry=void 0,this.state.columns)?(this.state.geometry=(0,u.M)(this.context.device,t),new d.X(this.context.device,{...o,geometry:this.state.geometry,inferDrawCount:"instance"})):new l.A(this.context.device,{...o,geometry:t})}}A.layerName="PointCloudLayer",A.defaultProps={sizeUnits:"pixels",pointSize:{type:"number",min:0,value:10},antialiasing:!1,getPosition:{type:"accessor",value:b},getNormal:{type:"accessor",value:P},getColor:{type:"accessor",value:M},positions:{type:"object",value:null,optional:!0},normals:{type:"object",value:null,optional:!0},colors:{type:"object",value:null,optional:!0},material:!0,radiusPixels:{deprecatedFor:"pointSize"}};let S=A},78168(e,t,o){o.d(t,{w:()=>a});var i=o(89907),s=o(25261),n=o(96489),r=o(63484);let a={name:"phongMaterial",firstBindingSlot:0,bindingLayout:[{name:"phongMaterial",group:3}],dependencies:[s.x,i.$n],source:n.X,vs:r.X,fs:r.l,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:e=>({...a.defaultUniforms,...e})}}}]);