"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["31866"],{28424(e,t,o){o.d(t,{A:()=>Z});var i=o(25337),s=o(59452),r=o(3459),n=o(9350),a=o(69198),l=o(80073),c=o(20998),p=o(30638),d=o(41881),g=o(84175),u=o(46487),m=o(98881),h=o(66925),f=o(79439),v=o(38846);let y={name:"phongMaterial",firstBindingSlot:0,bindingLayout:[{name:"phongMaterial",group:3}],dependencies:[h.x,m.$n],source:f.X,vs:v.X,fs:v.l,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:e=>({...y.defaultUniforms,...e})};var C=o(95335),_=o(80698),x=o(21671);let b=`\
layout(std140) uniform simpleMeshUniforms {
  float sizeScale;
  bool composeModelMatrix;
  bool hasTexture;
  bool flatShading;
} simpleMesh;
`,M={name:"simpleMesh",source:`\
struct SimpleMeshUniforms {
  sizeScale: f32,
  composeModelMatrix: f32,
  hasTexture: f32,
  flatShading: f32,
};

@group(0) @binding(auto) var<uniform> simpleMesh: SimpleMeshUniforms;
@group(0) @binding(auto) var simpleMeshTexture: texture_2d<f32>;
@group(0) @binding(auto) var simpleMeshTextureSampler: sampler;
`,vs:b,fs:b,uniformTypes:{sizeScale:"f32",composeModelMatrix:"f32",hasTexture:"f32",flatShading:"f32"}},P=`#version 300 es
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
geometry.pickingColor = picking_getPickingColorFromInstanceID();
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
`,S=`#version 300 es
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
`,I=`\
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
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex);

  let instanceModelMatrix = mat3x3<f32>(
    attributes.instanceModelMatrixCol0,
    attributes.instanceModelMatrixCol1,
    attributes.instanceModelMatrixCol2
  );
  let meshPosition =
    (instanceModelMatrix * attributes.positions) * simpleMesh.sizeScale +
    attributes.instanceTranslation;

  if (simpleMesh.composeModelMatrix > 0.5) {
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
    let projected = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      project_size_vec3(meshPosition)
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
  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = varyings.texCoords;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
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

  return deckgl_premultiplied_alpha(color);
}
`;function A(e){let t=e.positions||e.POSITION;r.A.assert(t,'no "postions" or "POSITION" attribute in mesh');let o=t.value.length/t.size,i=e.COLOR_0||e.colors;i||(i={size:3,value:new Float32Array(3*o).fill(1)});let s=e.NORMAL||e.normals;s||(s={size:3,value:new Float32Array(3*o).fill(0)});let n=e.TEXCOORD_0||e.texCoords;return n||(n={size:2,value:new Float32Array(2*o).fill(0)}),{positions:t,colors:i,normals:s,texCoords:n}}function T(e){return e instanceof i.V?(e.attributes=A(e.attributes),e):new i.V(e.attributes?{...e,topology:"triangle-list",attributes:A(e.attributes)}:{topology:"triangle-list",attributes:A(e)})}class L extends d.A{getShaders(){return super.getShaders({vs:P,fs:S,source:I,modules:[g.A,u.A,y,C.Ay,M]})}getBounds(){if(this.props._instanced)return super.getBounds();let e=this.state.positionBounds;if(e)return e;let{mesh:t}=this.props;if(!t)return null;if(!(e=t.header?.boundingBox)){let{attributes:o}=T(t);o.POSITION=o.POSITION||o.positions,e=function(e){let t=1/0,o=1/0,i=1/0,s=-1/0,r=-1/0,n=-1/0,a=e.POSITION?e.POSITION.value:[],l=a&&a.length;for(let e=0;e<l;e+=3){let l=a[e],c=a[e+1],p=a[e+2];t=l<t?l:t,o=c<o?c:o,i=p<i?p:i,s=l>s?l:s,r=c>r?c:r,n=p>n?p:n}return[[t,o,i],[s,r,n]]}(o)}return this.state.positionBounds=e,e}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{transition:!0,type:"float64",fp64:this.use64bitPositions(),size:3,accessor:"getPosition"},instanceColors:{type:"unorm8",transition:!0,size:this.props.colorFormat.length,accessor:"getColor",defaultValue:[0,0,0,255]},instanceModelMatrix:x.U}),this.setState({emptyTexture:this.context.device.createTexture({data:new Uint8Array(4),width:1,height:1})})}updateState(e){super.updateState(e);let{props:t,oldProps:o,changeFlags:i}=e;if(t.mesh!==o.mesh||i.extensionsChanged){if(this.state.positionBounds=null,this.state.model?.destroy(),t.mesh){this.state.model=this.getModel(t.mesh);let e=t.mesh.attributes||t.mesh;this.setState({hasNormals:!!(e.NORMAL||e.normals)})}this.getAttributeManager().invalidateAll()}t.texture!==o.texture&&t.texture instanceof _.g&&this.setTexture(t.texture),this.state.model&&this.state.model.setTopology(this.props.wireframe?"line-strip":"triangle-list")}finalizeState(e){super.finalizeState(e),this.state.emptyTexture.delete()}draw({uniforms:e}){let{model:t}=this.state;if(!t)return;let{viewport:o,renderPass:i}=this.context,{sizeScale:s,coordinateSystem:r,_instanced:n}=this.props,a={sizeScale:s,composeModelMatrix:!n||(0,x.w)(o,r),flatShading:!this.state.hasNormals};t.shaderInputs.setProps({simpleMesh:a}),t.draw(i)}get isLoaded(){return!!(this.state?.model&&super.isLoaded)}getModel(e){let t=new p.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:T(e),isInstanced:!0});return t.shaderInputs.setProps({simpleMesh:this.getTextureProps(this.props.texture)}),t}setTexture(e){let{model:t}=this.state;t&&t.shaderInputs.setProps({simpleMesh:this.getTextureProps(e)})}getTextureProps(e){let t=e||this.state.emptyTexture;return{..."webgpu"===this.context.device.type?{simpleMeshTexture:t}:{sampler:t},hasTexture:!!e}}}L.defaultProps={mesh:{type:"object",value:null,async:!0},texture:{type:"image",value:null,async:!0},sizeScale:{type:"number",value:1,min:0},_instanced:!0,wireframe:!1,material:!0,getPosition:{type:"accessor",value:e=>e.position},getColor:{type:"accessor",value:[0,0,0,255]},getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},textureParameters:{type:"object",ignore:!0,value:null}},L.layerName="SimpleMeshLayer";let O=L,R=`\
layout(std140) uniform meshUniforms {
  bool pickFeatureIds;
} mesh;
`,k={name:"mesh",vs:R,fs:R,source:`\
struct MeshUniforms {
  pickFeatureIds: f32,
};

@group(0) @binding(auto) var<uniform> mesh: MeshUniforms;
`,uniformTypes:{pickFeatureIds:"f32"}};var w=o(83980);let E=w.s.source.replace(/fn pbr_setPositionNormalTangentUV\([\s\S]*?\n}\n/,`fn pbr_setPositionNormalTangentUV(position: vec4f, normal: vec4f, tangent: vec4f, uv: vec2f)
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
`).replace(/pbrProjection\.camera/g,"project.cameraPosition"),N={...w.s,source:E},U=`#version 300 es
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
`,z=`#version 300 es
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
`,j=`\
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
`;class F extends O{getShaders(){let e=super.getShaders();return{...e,vs:U,fs:z,source:j,modules:[...e.modules,N,k]}}initializeState(){let{featureIds:e}=this.props;super.initializeState();let t=this.getAttributeManager();e&&t.add({rowIndexes:{type:"uint32",size:1,noAlloc:!0,update:this.calculateFeatureIdsPickingIndexes}})}updateState(e){super.updateState(e);let{props:t,oldProps:o}=e;t.pbrMaterial!==o.pbrMaterial&&this.updatePbrMaterialUniforms(t.pbrMaterial)}draw(e){let{featureIds:t}=this.props,{model:o}=this.state;if(!o)return;let i={camera:this.context.viewport.cameraPosition};o.shaderInputs.setProps({pbrProjection:i,mesh:{pickFeatureIds:!!t}}),super.draw(e)}getModel(e){var t;let o,i,{id:s}=this.props,r=this.parseMaterial(this.props.pbrMaterial,e);this.setState({parsedPBRMaterial:r});let n=this.getShaders();return i=(o=(t=e.attributes).positions||t.POSITION).value.length/o.size,t.COLOR_0||t.colors||(t.colors={size:4,value:new Uint8Array(4*i).fill(255),normalized:!0}),new p.K(this.context.device,{...this.getShaders(),id:s,geometry:e,bufferLayout:this.getAttributeManager().getBufferLayouts(),defines:{...n.defines,...r?.defines,HAS_UV_REGIONS:+!!e.attributes.uvRegions,HAS_FEATURE_IDS:+!!this.props.featureIds},parameters:r?.parameters,isInstanced:!0})}updatePbrMaterialUniforms(e){let{model:t}=this.state;if(t){let{mesh:o}=this.props,i=this.parseMaterial(e,o);this.setState({parsedPBRMaterial:i});let{pbr_baseColorSampler:s}=i.bindings,{emptyTexture:r}=this.state,n=s||r,a={..."webgpu"===this.context.device.type?{simpleMeshTexture:n}:{sampler:n},hasTexture:!!s},{camera:l,...c}={...i.bindings,...i.uniforms};t.shaderInputs.setProps({simpleMesh:a,pbrMaterial:c})}}parseMaterial(e,t){let o=!!(e.pbrMetallicRoughness&&e.pbrMetallicRoughness.baseColorTexture);return(0,c.lO)(this.context.device,{unlit:o,...e},{NORMAL:t.attributes.normals,TEXCOORD_0:t.attributes.texCoords},{pbrDebug:!1,lights:!0,useTangents:!1})}calculateFeatureIdsPickingIndexes(e){e.value=new Uint32Array(this.props.featureIds)}finalizeState(e){super.finalizeState(e),this.state.parsedPBRMaterial?.generatedTextures.forEach(e=>e.destroy()),this.setState({parsedPBRMaterial:null})}}F.layerName="MeshLayer",F.defaultProps={pbrMaterial:{type:"object",value:null},featureIds:{type:"array",value:null,optional:!0}};var V=o(58682),D=o(42542),G=o(23974),H=o(30371);let K=[0],B={getPointColor:{type:"accessor",value:[0,0,0,255]},pointSize:1,data:"",loader:H.i,onTilesetLoad:{type:"function",value:e=>{}},onTileLoad:{type:"function",value:e=>{}},onTileUnload:{type:"function",value:e=>{}},onTileError:{type:"function",value:(e,t,o)=>{}},_getMeshColor:{type:"function",value:e=>[255,255,255]}};class $ extends s.A{initializeState(){"onTileLoadFail"in this.props&&r.A.removed("onTileLoadFail","onTileError")(),this.state={layerMap:{},tileset3d:null,activeViewports:{},lastUpdatedViewports:null}}get isLoaded(){return!!(this.state?.tileset3d?.isLoaded()&&super.isLoaded)}shouldUpdateState({changeFlags:e}){return e.somethingChanged}updateState({props:e,oldProps:t,changeFlags:o}){if(e.data&&e.data!==t.data&&this._loadTileset(e.data),o.viewportChanged){let{activeViewports:e}=this.state;Object.keys(e).length&&(this._updateTileset(e),this.state.lastUpdatedViewports=e,this.state.activeViewports={})}if(o.propsChanged){let{layerMap:e}=this.state;for(let t in e)e[t].needsUpdate=!0}}finalizeState(e){this.state.tileset3d?.destroy(),this.state.tileset3d=null,this.state.layerMap={},this.state.activeViewports={},this.state.lastUpdatedViewports=null,super.finalizeState(e)}activateViewport(e){let{activeViewports:t,lastUpdatedViewports:o}=this.state;this.internalState.viewport=e,t[e.id]=e;let i=o?.[e.id];i&&e.equals(i)||(this.setChangeFlags({viewportChanged:!0}),this.setNeedsUpdate())}getPickingInfo({info:e,sourceLayer:t}){let o=t&&t.props.tile;return e.picked&&(e.object=o),e.sourceTile=o,e}filterSubLayer({layer:e,viewport:t,cullRect:o,isPicking:i}){let{tile:s}=e.props,{id:r}=t;if(!s.selected||!s.viewportIds.includes(r))return!1;if(i&&o&&s.content?.cartographicOrigin){let[e,i]=t.project(s.content.cartographicOrigin),r=o.x+o.width/2,n=o.y+o.height/2,a=Math.max(t.width,t.height)/4,l=e-r,c=i-n;if(l*l+c*c>a*a)return!1}return!0}_updateAutoHighlight(e){let t=e.sourceTile,o=this.state.layerMap[t?.id];o&&o.layer&&o.layer.updateAutoHighlight(e)}async _loadTileset(e){let t=this.props.loadOptions||{},o=this.props.loaders?.length?this.props.loaders:this.props.loader,i=Array.isArray(o)?o[0]:o,{tileset:s,...r}=t,n={loadOptions:{...r},...s},a=e;if("preload"in i&&"function"==typeof i.preload){let o=await i.preload(e,t);o.url&&(a=o.url),o.headers&&(n.loadOptions.core={...n.loadOptions.core,fetch:{...n.loadOptions.core?.fetch,headers:o.headers}}),Object.assign(n,o)}let l=await (0,V.H)(a,i,n.loadOptions),c=new D.Q(l,{onTileLoad:this._onTileLoad.bind(this),onTileUnload:this._onTileUnload.bind(this),onTileError:this.props.onTileError,onUpdate:()=>this.setNeedsUpdate(),...n});this.setState({tileset3d:c,layerMap:{}}),this._updateTileset(this.state.activeViewports),this.props.onTilesetLoad(c)}_onTileLoad(e){let{lastUpdatedViewports:t}=this.state;e.tileDrawn=!1,this.props.onTileLoad(e),this._updateTileset(t),this.setNeedsUpdate()}_onTileUnload(e){delete this.state.layerMap[e.id],this.props.onTileUnload(e)}_updateTileset(e){if(!e)return;let{tileset3d:t}=this.state,{timeline:o}=this.context,i=Object.keys(e).length;o&&i&&t&&t.selectTiles(Object.values(e)).then(e=>{this.state.frameNumber!==e&&this.setState({frameNumber:e})})}_getSubLayer(e,t){if(!e.content)return null;switch(e.type){case G.WH.POINTCLOUD:return this._makePointCloudLayer(e,t);case G.WH.SCENEGRAPH:return this._make3DModelLayer(e);case G.WH.MESH:return this._makeSimpleMeshLayer(e,t);default:throw Error(`Tile3DLayer: Failed to render layer of type ${e.content.type}`)}}_makePointCloudLayer(e,t){let{attributes:o,pointCount:i,constantRGBA:s,cartographicOrigin:r,modelMatrix:l}=e.content,{positions:c,normals:p,colors:d}=o;if(!c)return null;let g=t&&t.props.data||{header:{vertexCount:i},attributes:{POSITION:c,NORMAL:p,COLOR_0:d}},{pointSize:u,getPointColor:m}=this.props;return new(this.getSubLayerClass("pointcloud",a.A))({pointSize:u},this.getSubLayerProps({id:"pointcloud"}),{id:`${this.id}-pointcloud-${e.id}`,tile:e,data:g,coordinateSystem:n.rf.METER_OFFSETS,coordinateOrigin:r,modelMatrix:l,getColor:s||m,_offset:0})}_make3DModelLayer(e){let{gltf:t,instances:o,cartographicOrigin:i,modelMatrix:s}=e.content;return new(this.getSubLayerClass("scenegraph",l.A))({_lighting:"pbr"},this.getSubLayerProps({id:"scenegraph"}),{id:`${this.id}-scenegraph-${e.id}`,tile:e,data:o||K,scenegraph:t,coordinateSystem:n.rf.METER_OFFSETS,coordinateOrigin:i,modelMatrix:s,getTransformMatrix:e=>e.modelMatrix,getPosition:[0,0,0],_offset:0,onFirstDraw:()=>{e.tileDrawn=!0}})}_makeSimpleMeshLayer(e,t){var o;let s,{attributes:r,indices:a,modelMatrix:l,cartographicOrigin:c,coordinateSystem:p=n.rf.METER_OFFSETS,material:d,featureIds:g}=e.content,{_getMeshColor:u}=this.props,m=t&&t.props.mesh||new i.V({topology:"triangle-list",attributes:((s={}).positions={...(o=r).positions,value:new Float32Array(o.positions.value)},o.normals&&(s.normals=o.normals),o.texCoords&&(s.texCoords=o.texCoords),o.colors&&(s.colors=o.colors),o.uvRegions&&(s.uvRegions=o.uvRegions),s),indices:a});return new(this.getSubLayerClass("mesh",F))(this.getSubLayerProps({id:"mesh"}),{id:`${this.id}-mesh-${e.id}`,tile:e,mesh:m,data:K,getColor:u(e),pbrMaterial:d,modelMatrix:l,coordinateOrigin:c,coordinateSystem:p,featureIds:g,_offset:0})}renderLayers(){let{tileset3d:e,layerMap:t}=this.state;return e?e.tiles.map(e=>{let o=t[e.id]=t[e.id]||{tile:e},{layer:i}=o;return e.selected&&(i?o.needsUpdate&&(i=this._getSubLayer(e,i),o.needsUpdate=!1):i=this._getSubLayer(e)),o.layer=i,i}).filter(Boolean):null}}$.defaultProps=B,$.layerName="Tile3DLayer";let Z=$},69198(e,t,o){o.d(t,{A:()=>C});var i=o(41881),s=o(84175),r=o(46487),n=o(95335),a=o(9350),l=o(37072),c=o(30638),p=o(25337);let d=`\
layout(std140) uniform pointCloudUniforms {
  float radiusPixels;
  highp int sizeUnits;
} pointCloud;
`,g={name:"pointCloud",source:"",vs:d,fs:d,uniformTypes:{radiusPixels:"f32",sizeUnits:"i32"}},u=`\
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
`,m=`\
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
`,f=[0,0,0,255],v=[0,0,1];class y extends i.A{getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:u,fs:m,source:h,defines:e?{ANTIALIASING:1}:{},modules:[s.A,r.A,l.J,n.Ay,g]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceNormals:{size:3,transition:!0,accessor:"getNormal",defaultValue:v},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:f}})}updateState(e){let{changeFlags:t,props:o,oldProps:i}=e;super.updateState(e),(t.extensionsChanged||o.antialiasing!==i.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()),t.dataChanged&&function(e){let{header:t,attributes:o}=e;if(t&&o&&(e.length=t.vertexCount,o.POSITION&&(o.instancePositions=o.POSITION),o.NORMAL&&(o.instanceNormals=o.NORMAL),o.COLOR_0)){let{size:e,value:t}=o.COLOR_0;o.instanceColors={size:e,type:"unorm8",value:t}}}(o.data)}draw({uniforms:e}){let{pointSize:t,sizeUnits:o}=this.props,i=this.state.model,s={sizeUnits:a.p5[o],radiusPixels:t};i.shaderInputs.setProps({pointCloud:s}),i.draw(this.context.renderPass)}_getModel(){let e=[];for(let t=0;t<3;t++){let o=t/3*Math.PI*2;e.push(2*Math.cos(o),2*Math.sin(o),0)}return new c.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new p.V({topology:"triangle-list",attributes:{positions:new Float32Array(e)}}),isInstanced:!0})}}y.layerName="PointCloudLayer",y.defaultProps={sizeUnits:"pixels",pointSize:{type:"number",min:0,value:10},antialiasing:!1,getPosition:{type:"accessor",value:e=>e.position},getNormal:{type:"accessor",value:v},getColor:{type:"accessor",value:f},material:!0,radiusPixels:{deprecatedFor:"pointSize"}};let C=y},44077(e,t,o){let i;o.d(t,{L:()=>Z,_:()=>q});var s=o(25354),r=o(92220),n=o(99062),a=o(40237),l=o(2742),c=o(14531),p=o(87727),d=o(16160),g=o(11616),u=o(37121),m=o(82381),h=o(37191),f=o(70783),v=o(86758),y=o(91440),C=o(18083),_=o(7968),x=o(72789),b=o(50943),M=o(95768),P=o(88593),S=o(40119),I=o(32847),A=o(33727),T=o(39793),L=o(24969),O=o(19084),R=o(15058),k=o(8805),w=o(53977),E=o(86332),N=o(1435),U=o(8555),z=o(27413),j=o(99276),F=o(64979),V=o(20735),D=o(96258),G=o(73712),H=o(29754),K=o(31705),B=o(92026);let $=[l.S,c.n].map(function(e){return{...e,parse(t,o){let i=e.parse(t,o),s=i.parameters.datum,r=e=>e.toLowerCase().replace(/[\s_-]/g,"");if(s&&!Object.keys((0,a.c)(o)).some(e=>r(e)===r(s))){let e={...i.parameters};return delete e.datum,{...i,parameters:e}}return i}}});class Z extends s.Xg{constructor(e={}){super({...e,projections:e.projections??function(){if(i)return i;let e=[p.o,d.S,g.r,u.L,m.g,h.q,f.R,v.S,y.d,C.pB,C.ab,_.w,x.S,b.n,M.A,P._,S.o,I.x,A.D,T.e,L.z,O.$,R.d,k.m,w.h,E.g,N.N,U.j,z.L,j._,F.d,V.Y,D.s,G.f,H.U],t=e=>e.toLowerCase().replace(/[\s_-]/g,""),o=(0,K.H)("longlat"),s={name:o.name,aliases:o.aliases,parameters:[...new Set([...o.parameters,...e.flatMap(e=>e.parameters)])],flags:[...new Set(e.flatMap(e=>e.flags||[]))],create(o){let i=o.parameters.o_proj;if(!i)throw Error("Oblique transformation requires +o_proj");let s=["longlat","latlong","latlon","lonlat","identity"].includes(t(i))?"longlat":e.find(e=>[e.name,...e.aliases||[]].some(e=>t(e)===t(i)));if(!s)throw Error("Unknown oblique transformation projection: "+i);let r=(0,K.H)(s),n=new Set([...B.fQ,...r.parameters]);for(let e of Object.keys(o.parameters))if(!n.has(e))throw Error("Unsupported PROJ parameter: +"+e);return r.create(o)}};return i=[...e,s]}(),parsers:e.parsers??$,datumCatalogs:e.datumCatalogs??[n.h]}),this.useDefinitionSignature=!(0,r.I)(e)}}let q=new Z},27466(e,t,o){o.d(t,{Uz:()=>i.A,ro:()=>s.A});var i=o(24581),s=o(84238);o(84647)}}]);