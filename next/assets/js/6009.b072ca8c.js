"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["6009"],{60608(t,e,i){i.d(e,{h:()=>g});var o=i(53439),n=i(7914),r=i(8994),s=i(57285),a=i(7036),l=i(35098),h=i(51002),c=i(61439),f=i(15465);class g{get length(){return this.prepared?.length??0}getBounds(){return this.prepared?.bounds??null}get hasRowIndexes(){return!!this.prepared?.columns.rowIndexes}constructor(t,e,i,o=!1,n=!1){this.device=t,this.definitions=e,this.name=i,this.useRowIndexes=o,this.useTable=n,this.version=0,this.loading=!1}getBufferLayouts(t=!1){let e={};for(let t of Object.values(this.definitions))e[t.attribute]="color"===t.semantic?"unorm8x4":1===t.size?"float32":`float32x${t.size}`,"position"===t.semantic&&(e[`${t.attribute}64Low`]="float32x3");t&&(e.rowIndexes="uint32");let i=0,o=Object.entries(e).map(([t,e])=>{let o={attribute:t,format:e,byteOffset:i};return i+=(0,l.Ft)(e).byteLength,o});return[{name:`${this.name}-initial`,stepMode:"instance",byteStride:0,attributes:o}]}needsUpdate(t,e){return!this.request||t.data!==this.request.source||!(0,n.b)(t.modelMatrix,e.modelMatrix,1)||t.colorFormat!==e.colorFormat||!(0,n.b)(t.coordinateOrigin,e.coordinateOrigin,1)||t.coordinateSystem!==e.coordinateSystem||Object.entries(this.definitions).some(([i,o])=>t[i]!==e[i]||t[o.accessor]!==e[o.accessor])}updateIfNeeded({props:t,oldProps:e,changeFlags:i},{dataLoading:o,changed:n,failed:r,positionOptions:s,prepareFallbacks:a}){if(!o&&(i.dataChanged||i.updateTriggersChanged||i.projectionChanged||this.needsUpdate(t,e)))return this.update(t,n,r,s,a)}async update(t,e,o,n={},r){var s;let a=++this.version;this.loading=!0;let l=this.request,g={source:t.data};this.request=g;let u=[];try{let o,d,p,m=this.getRows(t.data,l);if(g.rows=m,a!==this.version)return;if(n.requireRows&&!m.length){this.prepared?.destroy(),this.prepared={columns:{},length:0,source:t.data,rows:m,destroy(){}},this.loading=!1,e();return}let{ArrowConverter:L}=await Promise.all([i.e("40445"),i.e("94070"),i.e("42990")]).then(i.bind(i,71933)),v=new L(this.device),b={},y=!0;n={...n,onPosition:t=>{if(!t){y=!1;return}o??(o=[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]]);for(let e=0;e<3;e++){let i=t[e]??0;o[0][e]=Math.min(o[0][e],i),o[1][e]=Math.max(o[1][e],i)}}};let w=(0,f.S)(t,this.definitions,this.useTable);for(let[t,e]of Object.entries(this.definitions)){let i=w[t];if(!i)continue;if(i instanceof h.M){let t="color"===e.semantic?"unorm8x4":1===e.size?"float32":"float32x"+e.size;if(i.format!==t)throw Error("GPU column format must match the shader input");if("position"===e.semantic){if(n.transform)throw Error("GPU positions cannot be CPU-preprojected");y=!1}}let o=i instanceof h.M?{vector:i,residualVector:void 0,destroy(){}}:await v.convert(i,{name:t,semantic:"vector"===e.semantic?"numeric":e.semantic,..."position"===e.semantic?{format:"float32x3",transform:t=>(n.onPosition(t),n.transform?n.transform(t):t),fp64:n.fp64}:{}});if(u.push(o),a!==this.version){for(let t of u)t.destroy();return}let r=o.vector.data.map(t=>t.length);if(p&&(r.length!==p.length||r.some((t,e)=>t!==p[e])))throw Error("Arrow column chunk structures must match");if(p??(p=r),d??(d=o.vector.length),o.vector.length!==d)throw Error("Arrow column lengths must match");b[e.attribute]=o.vector,"position"===e.semantic&&o.residualVector&&(b[`${e.attribute}64Low`]=o.residualVector)}if(d??(d=m.length),p??(p=[d]),m.length&&m.length!==d)throw Error("data rows must match Arrow column lengths");let x=r?.(m,d,t=>u.push(t));for(let[e,i]of Object.entries(this.definitions))w[e]||(b[i.attribute]=await this.makeAccessorColumn(t,i.accessor,i.size,"color"===i.semantic,d,u,b,n,m,"position"===i.semantic?`${i.attribute}64Low`:void 0,i.defaultValue,x?.[i.accessor],i.attribute));for(let e of(this.useRowIndexes&&t.data?.attributes?.rowIndexes&&(b.rowIndexes=await this.makeAccessorColumn(t,"rowIndexes",1,!1,d,u,b,n,m)),Object.values(this.definitions)))"position"===e.semantic&&(b[s=`${e.attribute}64Low`]??(b[s]=new c.z({format:"float32x3",value:new Float32Array(3)})));if("webgpu"===this.device.type){let t=Object.values(b),e=t.filter(t=>t instanceof h.M).length+Number(t.some(t=>t instanceof c.z));if(e>this.device.limits.maxVertexBuffers)throw Error(`${this.name} Arrow columns require ${e} vertex buffers; this device supports ${this.device.limits.maxVertexBuffers}`)}if(a!==this.version){for(let t of u)t.destroy();return}this.prepared?.destroy(),this.prepared={columns:b,length:d,chunkLengths:p,bounds:d&&y?o:void 0,source:t.data,rows:m,destroy:()=>{for(let t of u)t.destroy()}},this.loading=!1,e()}catch(t){for(let t of u)t.destroy();a===this.version&&(this.loading=!1,o(t),e())}}draw(t,e,i){let o=this.prepared;if(!o?.length)return;let n={},r={},s=[];for(let[t,e]of Object.entries(o.columns)){if(e instanceof c.z){r[t]=e;continue}let i=0,l=(o.chunkLengths??[]).filter(t=>t>0).map(t=>{let o=0,n=e.data.find(t=>i<o+t.length||(o+=t.length,!1)),r=n.byteOffset+(i-o)*n.byteStride;return i+=t,{buffer:n.buffer instanceof a.kL?n.buffer.buffer:n.buffer,byteOffset:r,length:t,format:e.format,byteStride:n.byteStride,rowByteLength:n.rowByteLength}});n[t]={name:t,format:e.format,length:e.length,byteStride:e.byteStride,rowByteLength:e.rowByteLength,data:l},s.push({name:t,stepMode:"instance",byteStride:e.byteStride,attributes:[{attribute:t,format:e.format,byteOffset:0}]})}t.setAttributeVectors({...n,...r},s),t.drawBatches(e,{vectors:n,onBatch:t=>i?.(t.rowIndexOffset,t.rowCount)})}destroy(){this.version++,this.prepared?.destroy(),this.prepared=void 0,this.request=void 0}getRows(t,e){if(t&&Number.isFinite(t.length))return{length:t.length,at:e=>t[e]};if(t&&Number.isFinite(t.numRows)&&"function"==typeof t.get)return{length:t.numRows,at:e=>t.get(e)};let i=t?.[Symbol.iterator]?.();if(!i)return{length:0,at:()=>null};if(i===t){if(e&&e.source===t){if(e.rows)return e.rows;throw Error("Replace a failed row iterator before retrying")}if(this.prepared&&this.prepared.source===t)return this.prepared.rows}let o=Array.from({[Symbol.iterator]:()=>i});return{length:o.length,at:t=>o[t]}}async makeAccessorColumn(t,e,i,n,a,f,g,u,d,p,m=0,L,v){let b=!1,y=L??t.data?.attributes?.[e]??(v&&t.data?.attributes?.[v]);if(y){let o=ArrayBuffer.isView(y)?{value:y}:y instanceof r.h?{buffer:y}:y,c=o.value,g=o.size??(n?t.colorFormat?.length:void 0)??i,d=o.type??(c instanceof Float64Array?"float64":c?s.r.getDataType(c):"rowIndexes"===e?"uint32":n?"unorm8":"float32");!o.type&&(o.normalized??n)&&"float64"!==d&&(d=d.replace("int","norm"));let m="float64"===d?null:s.r.getDataTypeInfo(d);if(!o.constant&&g===i&&"float64"!==d&&(!m.integer||"rowIndexes"===e)&&!(p&&(u.transform||c))){let t=1===i?d:`${d}x${i}`,n=(0,l.Ft)(t).byteLength,s=o.buffer??this.device.createBuffer({data:c,usage:r.h.VERTEX|r.h.COPY_SRC|r.h.COPY_DST});if(o.buffer||f.push(s),a&&(o.offset??0)+(a-1)*(o.stride??n)+n>s.byteLength)throw Error("Binary attribute is shorter than the Arrow columns");return p&&u.onPosition?.(null),new h.M({type:"buffer",name:e,buffer:s,ownsBuffer:!1,format:t,length:a,byteOffset:o.offset??0,rowByteLength:n,byteStride:o.stride??n})}let L="float64"===d?Float64Array:s.r.getTypedArrayConstructor(d),v=c??await o.buffer.readAsync(),w=c??new L(v.buffer,v.byteOffset,v.byteLength/L.BYTES_PER_ELEMENT),x=(o.stride??g*w.BYTES_PER_ELEMENT)/w.BYTES_PER_ELEMENT,A=(o.offset??0)/w.BYTES_PER_ELEMENT,C=o.constant?1:a;if(C&&A+(C-1)*x+g>w.length)throw Error("Binary attribute is shorter than the Arrow columns");b=n;let E=t=>{if(!m?.normalized)return t;let e=8*m.byteLength;return m.signed?Math.max(-1,t/(2**(e-1)-1)):t/(2**e-1)},S=t=>1===g?E(w[A+t*x]):Array.from(w.subarray(A+t*x,A+t*x+g),E);t={...t,[e]:o.constant?S(0):(t,{index:e})=>S(e)}}let w=t[e],x="rowIndexes"===e?"uint32":n&&!b?"unorm8x4":1===i?"float32":`float32x${i}`,A=p&&u.fp64?new Float32Array(Math.max(1,a)*i):void 0,C=(e,o,r)=>{if(p&&u.onPosition?.(e),p&&u.transform&&(e=u.transform(e)),1===i){let t=Number.isFinite(e)?e:e?.[0];o[r]=Number.isFinite(t)?t:m;return}for(let s=0;s<i;s++)o[r+s]=n&&!b&&3===s&&"RGB"===t.colorFormat?255:e?.[s]??(n&&3===s?b?1:255:0),A&&(A[r+s]=(e?.[s]??0)-o[r+s])};if("function"!=typeof w){let t="rowIndexes"===e?new Uint32Array(i):n&&!b?new Uint8ClampedArray(i):new Float32Array(i);return C(w,t,0),A&&(g[p]=new c.z({format:"float32x3",value:A.slice(0,i)})),new c.z({format:x,value:t instanceof Uint8ClampedArray?new Uint8Array(t.buffer):t})}let E="rowIndexes"===e?new Uint32Array(a*i):n&&!b?new Uint8ClampedArray(a*i):new Float32Array(a*i),{objectInfo:S}=(0,o.X)(null);S.data=t.data;for(let t=0;t<a;t++)S.index=t,C(w(d.at(t)??null,S),E,t*i);let P=t=>{let i=this.device.createBuffer({data:t,usage:r.h.VERTEX|r.h.COPY_DST|r.h.COPY_SRC});return f.push(i),new h.M({type:"buffer",name:e,buffer:i,ownsBuffer:!1,format:x,length:a})};return A&&(g[p]=P(A)),P(E)}}},48416(t,e,i){i.d(e,{HF:()=>s,i0:()=>a,qO:()=>r,zv:()=>n});var o=i(34353);let n=4;function r(){return{color:[0,0,0],position:[0,0,0],halfAxisX:[0,0,0],halfAxisY:[0,0,0],normal:[0,0,-1],disk:0}}let s={color:"vec3<f32>",position:"vec3<f32>",halfAxisX:"vec3<f32>",halfAxisY:"vec3<f32>",normal:"vec3<f32>",disk:"i32"};function a(t,e=!1){return Array.from({length:n},(i,n)=>{let s=t[n];if(!s)return r();let a=(0,o.sC)(s.color||(e?[255,255,255]:[1,1,1]),e);return{position:s.position,halfAxisX:s.halfAxisX,halfAxisY:s.halfAxisY,normal:s.normal,disk:+("disk"===s.type),color:a.map(t=>t*(s.intensity??1e3))}})}},25261(t,e,i){i.d(e,{x:()=>a});var o=i(48416);let n=`\
precision highp int;

// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
struct AmbientLight {
  vec3 color;
};

struct PointLight {
  vec3 color;
  vec3 position;
  vec3 attenuation; // 2nd order x:Constant-y:Linear-z:Exponential
};

struct SpotLight {
  vec3 color;
  vec3 position;
  vec3 direction;
  vec3 attenuation;
  vec2 coneCos;
};

struct DirectionalLight {
  vec3 color;
  vec3 direction;
};

struct UniformLight {
  vec3 color;
  vec3 position;
  vec3 direction;
  vec3 attenuation;
  vec2 coneCos;
};

struct AreaLightUniform {
  vec3 color; vec3 position; vec3 halfAxisX; vec3 halfAxisY; vec3 normal; int disk;
};

layout(std140) uniform lightingUniforms {
  int enabled;
  int directionalLightCount;
  int pointLightCount;
  int spotLightCount;
  vec3 ambientColor;
  UniformLight lights[5];
  int areaLightCount;
  AreaLightUniform areaLights[4];
} lighting;

PointLight lighting_getPointLight(int index) {
  UniformLight light = lighting.lights[index];
  return PointLight(light.color, light.position, light.attenuation);
}

SpotLight lighting_getSpotLight(int index) {
  UniformLight light = lighting.lights[lighting.pointLightCount + index];
  return SpotLight(light.color, light.position, light.direction, light.attenuation, light.coneCos);
}

DirectionalLight lighting_getDirectionalLight(int index) {
  UniformLight light =
    lighting.lights[lighting.pointLightCount + lighting.spotLightCount + index];
  return DirectionalLight(light.color, light.direction);
}

float getPointLightAttenuation(PointLight pointLight, float distance) {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

float getSpotLightAttenuation(SpotLight spotLight, vec3 positionWorldspace) {
  vec3 light_direction = normalize(positionWorldspace - spotLight.position);
  float coneFactor = smoothstep(
    spotLight.coneCos.y,
    spotLight.coneCos.x,
    dot(normalize(spotLight.direction), light_direction)
  );
  float distanceAttenuation = getPointLightAttenuation(
    PointLight(spotLight.color, spotLight.position, spotLight.attenuation),
    distance(spotLight.position, positionWorldspace)
  );
  return distanceAttenuation / max(coneFactor, 0.0001);
}

// #endif
`,r=`\
// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
const MAX_LIGHTS: i32 = 5;

struct AmbientLight {
  color: vec3<f32>,
};

struct PointLight {
  color: vec3<f32>,
  position: vec3<f32>,
  attenuation: vec3<f32>, // 2nd order x:Constant-y:Linear-z:Exponential
};

struct SpotLight {
  color: vec3<f32>,
  position: vec3<f32>,
  direction: vec3<f32>,
  attenuation: vec3<f32>,
  coneCos: vec2<f32>,
};

struct DirectionalLight {
  color: vec3<f32>,
  direction: vec3<f32>,
};

struct UniformLight {
  color: vec3<f32>,
  position: vec3<f32>,
  direction: vec3<f32>,
  attenuation: vec3<f32>,
  coneCos: vec2<f32>,
};

struct AreaLightUniform {
  color: vec3f, position: vec3f, halfAxisX: vec3f, halfAxisY: vec3f, normal: vec3f, disk: i32,
};

struct lightingUniforms {
  enabled: i32,
  directionalLightCount: i32,
  pointLightCount: i32,
  spotLightCount: i32,
  ambientColor: vec3<f32>,
  lights: array<UniformLight, 5>,
  areaLightCount: i32,
  areaLights: array<AreaLightUniform, 4>,
};

@group(2) @binding(auto) var<uniform> lighting : lightingUniforms;

fn lighting_getPointLight(index: i32) -> PointLight {
  let light = lighting.lights[index];
  return PointLight(light.color, light.position, light.attenuation);
}

fn lighting_getSpotLight(index: i32) -> SpotLight {
  let light = lighting.lights[lighting.pointLightCount + index];
  return SpotLight(light.color, light.position, light.direction, light.attenuation, light.coneCos);
}

fn lighting_getDirectionalLight(index: i32) -> DirectionalLight {
  let light = lighting.lights[lighting.pointLightCount + lighting.spotLightCount + index];
  return DirectionalLight(light.color, light.direction);
}

fn getPointLightAttenuation(pointLight: PointLight, distance: f32) -> f32 {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

fn getSpotLightAttenuation(spotLight: SpotLight, positionWorldspace: vec3<f32>) -> f32 {
  let lightDirection = normalize(positionWorldspace - spotLight.position);
  let coneFactor = smoothstep(
    spotLight.coneCos.y,
    spotLight.coneCos.x,
    dot(normalize(spotLight.direction), lightDirection)
  );
  let distanceAttenuation = getPointLightAttenuation(
    PointLight(spotLight.color, spotLight.position, spotLight.attenuation),
    distance(spotLight.position, positionWorldspace)
  );
  return distanceAttenuation / max(coneFactor, 0.0001);
}
`;var s=i(34353);let a={props:{},uniforms:{},name:"lighting",defines:{},uniformTypes:{enabled:"i32",directionalLightCount:"i32",pointLightCount:"i32",spotLightCount:"i32",ambientColor:"vec3<f32>",lights:[{color:"vec3<f32>",position:"vec3<f32>",direction:"vec3<f32>",attenuation:"vec3<f32>",coneCos:"vec2<f32>"},5],areaLightCount:"i32",areaLights:[o.HF,o.zv]},defaultUniforms:h(),bindingLayout:[{name:"lighting",group:2}],firstBindingSlot:0,source:r,vs:n,fs:n,getUniforms:function(t,e={}){t=t?{...t}:t;let i=(t?.lights||[]).filter(t=>"rect"===t.type||"disk"===t.type);if(!t)return h();t.lights&&(t={...t,...function(t){let e={pointLights:[],spotLights:[],directionalLights:[]};for(let i of t||[])switch(i.type){case"ambient":e.ambientLight=i;break;case"directional":e.directionalLights?.push(i);break;case"point":e.pointLights?.push(i);break;case"spot":e.spotLights?.push(i)}return e}(t.lights),lights:void 0});let{useByteColors:n,ambientLight:r,pointLights:a,spotLights:f,directionalLights:g}=t||{};if(!(r||a&&a.length>0||f&&f.length>0||g&&g.length>0)&&0===i.length)return{...h(),enabled:0};let u={...h(),...function({useByteColors:t,ambientLight:e,pointLights:i=[],spotLights:o=[],directionalLights:n=[]}){let r=c(),s=0,a=0,h=0,f=0;for(let e of i){if(s>=5)break;r[s]={...r[s],color:l(e,t),position:e.position,attenuation:e.attenuation||[1,0,0]},s++,a++}for(let e of o){var g;if(s>=5)break;r[s]={...r[s],color:l(e,t),position:e.position,direction:e.direction,attenuation:e.attenuation||[1,0,0],coneCos:[Math.cos((g=e).innerConeAngle??0),Math.cos(g.outerConeAngle??Math.PI/4)]},s++,h++}for(let e of n){if(s>=5)break;r[s]={...r[s],color:l(e,t),direction:e.direction},s++,f++}return i.length+o.length+n.length>5&&console.warn("MAX_LIGHTS exceeded, truncating to 5"),{ambientColor:l(e,t),directionalLightCount:f,pointLightCount:a,spotLightCount:h,lights:r}}({useByteColors:n,ambientLight:r,pointLights:a,spotLights:f,directionalLights:g})};return u.areaLightCount=Math.min(i.length,o.zv),u.areaLights=(0,o.i0)(i,(0,s.eS)(t.useByteColors,!0)),void 0!==t.enabled&&(u.enabled=+!!t.enabled),u}};function l(t={},e){let{color:i=[0,0,0],intensity:o=1}=t;return(0,s.sC)(i,(0,s.eS)(e,!0)).map(t=>t*o)}function h(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:c(),areaLightCount:0,areaLights:(0,o.i0)([])}}function c(){return Array.from({length:5},()=>({color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}))}}}]);