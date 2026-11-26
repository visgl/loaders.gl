"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["28326"],{59452(t,i,o){o.d(i,{A:()=>g});var e=o(66260),n=o(43411),r=o(38055),l=o(12897);class a extends e.A{get isComposite(){return!0}get isDrawable(){return!1}get isLoaded(){return super.isLoaded&&this.getSubLayers().every(t=>t.isLoaded)}getSubLayers(){return this.internalState&&this.internalState.subLayers||[]}initializeState(t){}setState(t){super.setState(t),this.setNeedsUpdate()}getPickingInfo({info:t}){let{object:i}=t;return i&&i.__source&&i.__source.parent&&i.__source.parent.id===this.id&&(t.object=i.__source.object,t.index=i.__source.index),t}filterSubLayer(t){return!0}shouldRenderSubLayer(t,i){return i&&i.length}getSubLayerClass(t,i){let{_subLayerProps:o}=this.props;return o&&o[t]&&o[t].type||i}getSubLayerRow(t,i,o){return t.__source={parent:this,object:i,index:o},t}getSubLayerAccessor(t){if("function"==typeof t){let i={index:-1,data:this.props.data,target:[]};return(o,e)=>o&&o.__source?(i.index=o.__source.index,t(o.__source.object,i)):t(o,e)}return t}getSubLayerProps(t={}){let{opacity:i,pickable:o,visible:e,parameters:n,getPolygonOffset:r,highlightedObjectIndex:a,autoHighlight:g,highlightColor:s,coordinateSystem:c,coordinateOrigin:h,wrapLongitude:p,positionFormat:u,modelMatrix:f,extensions:d,fetch:L,operation:_,_subLayerProps:v}=this.props,C={id:"",updateTriggers:{},opacity:i,pickable:o,visible:e,parameters:n,getPolygonOffset:r,highlightedObjectIndex:a,autoHighlight:g,highlightColor:s,coordinateSystem:c,coordinateOrigin:h,wrapLongitude:p,positionFormat:u,modelMatrix:f,extensions:d,fetch:L,operation:_},m=v&&t.id&&v[t.id],b=m&&m.updateTriggers,w=t.id||"sublayer";if(m){let i=this.props[l.fW],o=t.type?t.type._propTypes:{};for(let t in m){let e=o[t]||i[t];e&&"accessor"===e.type&&(m[t]=this.getSubLayerAccessor(m[t]))}}for(let i of(Object.assign(C,t,m),C.id=`${this.props.id}-${w}`,C.updateTriggers={all:this.props.updateTriggers?.all,...t.updateTriggers,...b},d)){let t=i.getSubLayerProps.call(this,i);t&&Object.assign(C,t,{updateTriggers:Object.assign(C.updateTriggers,t.updateTriggers)})}return C}_updateAutoHighlight(t){for(let i of this.getSubLayers())i.updateAutoHighlight(t)}_getAttributeManager(){return null}_postUpdate(t,i){let o=this.internalState.subLayers,e=!o||this.needsUpdate();if(e){let t=this.renderLayers();o=(0,r.B)(t,Boolean),this.internalState.subLayers=o}for(let t of((0,n.A)("compositeLayer.renderLayers",this,e,o),o))t.parent=this}}a.layerName="CompositeLayer";let g=a},89907(t,i,o){o.d(i,{$n:()=>l});Uint32Array.BYTES_PER_ELEMENT,n("colors");let e=n("floatColors");function n(t){return`\
layout(std140) uniform ${t}Uniforms {
  float useByteColors;
} ${t};

vec3 ${t}_normalize(vec3 inputColor) {
  return ${t}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${t}_normalize(vec4 inputColor) {
  return ${t}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${t}_premultiplyAlpha(vec4 inputColor) {
  return vec4(inputColor.rgb * inputColor.a, inputColor.a);
}

vec4 ${t}_unpremultiplyAlpha(vec4 inputColor) {
  return inputColor.a > 0.0 ? vec4(inputColor.rgb / inputColor.a, inputColor.a) : vec4(0.0);
}

vec4 ${t}_premultiply_alpha(vec4 inputColor) {
  return ${t}_premultiplyAlpha(inputColor);
}

vec4 ${t}_unpremultiply_alpha(vec4 inputColor) {
  return ${t}_unpremultiplyAlpha(inputColor);
}
`}function r(t){return`\
struct ${t}Uniforms {
  useByteColors: f32
};

@group(0) @binding(auto) var<uniform> ${t} : ${t}Uniforms;

fn ${t}_normalize(inputColor: vec3<f32>) -> vec3<f32> {
  return select(inputColor, inputColor / 255.0, ${t}.useByteColors > 0.5);
}

fn ${t}_normalize4(inputColor: vec4<f32>) -> vec4<f32> {
  return select(inputColor, inputColor / 255.0, ${t}.useByteColors > 0.5);
}

fn ${t}_premultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(inputColor.rgb * inputColor.a, inputColor.a);
}

fn ${t}_unpremultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return select(
    vec4<f32>(0.0),
    vec4<f32>(inputColor.rgb / inputColor.a, inputColor.a),
    inputColor.a > 0.0
  );
}

fn ${t}_premultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${t}_premultiplyAlpha(inputColor);
}

fn ${t}_unpremultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${t}_unpremultiplyAlpha(inputColor);
}
`}r("colors");let l={name:"floatColors",props:{},uniforms:{},vs:e,fs:e,source:r("floatColors"),uniformTypes:{useByteColors:"f32"},defaultUniforms:{useByteColors:!0}}},48416(t,i,o){o.d(i,{HF:()=>l,i0:()=>a,qO:()=>r,zv:()=>n});var e=o(34353);let n=4;function r(){return{color:[0,0,0],position:[0,0,0],halfAxisX:[0,0,0],halfAxisY:[0,0,0],normal:[0,0,-1],disk:0}}let l={color:"vec3<f32>",position:"vec3<f32>",halfAxisX:"vec3<f32>",halfAxisY:"vec3<f32>",normal:"vec3<f32>",disk:"i32"};function a(t,i=!1){return Array.from({length:n},(o,n)=>{let l=t[n];if(!l)return r();let a=(0,e.sC)(l.color||(i?[255,255,255]:[1,1,1]),i);return{position:l.position,halfAxisX:l.halfAxisX,halfAxisY:l.halfAxisY,normal:l.normal,disk:+("disk"===l.type),color:a.map(t=>t*(l.intensity??1e3))}})}},87238(t,i,o){o.d(i,{J:()=>a});var e=o(89907),n=o(25261),r=o(63484),l=o(96489);let a={props:{},name:"gouraudMaterial",bindingLayout:[{name:"gouraudMaterial",group:3}],vs:r.l.replace("phongMaterial","gouraudMaterial"),fs:r.X.replace("phongMaterial","gouraudMaterial"),source:l.X.replaceAll("phongMaterial","gouraudMaterial"),defines:{LIGHTING_VERTEX:!0},dependencies:[n.x,e.$n],uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:t=>({...a.defaultUniforms,...t})}},25261(t,i,o){o.d(i,{x:()=>a});var e=o(48416);let n=`\
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
`;var l=o(34353);let a={props:{},uniforms:{},name:"lighting",defines:{},uniformTypes:{enabled:"i32",directionalLightCount:"i32",pointLightCount:"i32",spotLightCount:"i32",ambientColor:"vec3<f32>",lights:[{color:"vec3<f32>",position:"vec3<f32>",direction:"vec3<f32>",attenuation:"vec3<f32>",coneCos:"vec2<f32>"},5],areaLightCount:"i32",areaLights:[e.HF,e.zv]},defaultUniforms:s(),bindingLayout:[{name:"lighting",group:2}],firstBindingSlot:0,source:r,vs:n,fs:n,getUniforms:function(t,i={}){t=t?{...t}:t;let o=(t?.lights||[]).filter(t=>"rect"===t.type||"disk"===t.type);if(!t)return s();t.lights&&(t={...t,...function(t){let i={pointLights:[],spotLights:[],directionalLights:[]};for(let o of t||[])switch(o.type){case"ambient":i.ambientLight=o;break;case"directional":i.directionalLights?.push(o);break;case"point":i.pointLights?.push(o);break;case"spot":i.spotLights?.push(o)}return i}(t.lights),lights:void 0});let{useByteColors:n,ambientLight:r,pointLights:a,spotLights:h,directionalLights:p}=t||{};if(!(r||a&&a.length>0||h&&h.length>0||p&&p.length>0)&&0===o.length)return{...s(),enabled:0};let u={...s(),...function({useByteColors:t,ambientLight:i,pointLights:o=[],spotLights:e=[],directionalLights:n=[]}){let r=c(),l=0,a=0,s=0,h=0;for(let i of o){if(l>=5)break;r[l]={...r[l],color:g(i,t),position:i.position,attenuation:i.attenuation||[1,0,0]},l++,a++}for(let i of e){var p;if(l>=5)break;r[l]={...r[l],color:g(i,t),position:i.position,direction:i.direction,attenuation:i.attenuation||[1,0,0],coneCos:[Math.cos((p=i).innerConeAngle??0),Math.cos(p.outerConeAngle??Math.PI/4)]},l++,s++}for(let i of n){if(l>=5)break;r[l]={...r[l],color:g(i,t),direction:i.direction},l++,h++}return o.length+e.length+n.length>5&&console.warn("MAX_LIGHTS exceeded, truncating to 5"),{ambientColor:g(i,t),directionalLightCount:h,pointLightCount:a,spotLightCount:s,lights:r}}({useByteColors:n,ambientLight:r,pointLights:a,spotLights:h,directionalLights:p})};return u.areaLightCount=Math.min(o.length,e.zv),u.areaLights=(0,e.i0)(o,(0,l.eS)(t.useByteColors,!0)),void 0!==t.enabled&&(u.enabled=+!!t.enabled),u}};function g(t={},i){let{color:o=[0,0,0],intensity:e=1}=t;return(0,l.sC)(o,(0,l.eS)(i,!0)).map(t=>t*e)}function s(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:c(),areaLightCount:0,areaLights:(0,e.i0)([])}}function c(){return Array.from({length:5},()=>({color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}))}},63484(t,i,o){o.d(i,{X:()=>e,l:()=>n});let e=`\
layout(std140) uniform phongMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
  uniform float shininess;
  uniform vec3  specularColor;
} material;
`,n=`\
layout(std140) uniform phongMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
  uniform float shininess;
  uniform vec3  specularColor;
} material;

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 light_direction, vec3 view_direction, vec3 normal_worldspace, vec3 color) {
  vec3 halfway_direction = normalize(light_direction + view_direction);
  float lambertian = dot(light_direction, normal_worldspace);
  float specular = 0.0;
  if (lambertian > 0.0) {
    float specular_angle = max(dot(normal_worldspace, halfway_direction), 0.0);
    specular = pow(specular_angle, material.shininess);
  }
  lambertian = max(lambertian, 0.0);
  return (lambertian * material.diffuse * surfaceColor + specular * floatColors_normalize(material.specularColor)) * color;
}

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 cameraPosition, vec3 position_worldspace, vec3 normal_worldspace) {
  vec3 lightColor = surfaceColor;

  if (material.unlit) {
    return surfaceColor;
  }

  if (lighting.enabled == 0) {
    return lightColor;
  }

  vec3 view_direction = normalize(cameraPosition - position_worldspace);
  lightColor = material.ambient * surfaceColor * lighting.ambientColor;

  for (int i = 0; i < lighting.pointLightCount; i++) {
    PointLight pointLight = lighting_getPointLight(i);
    vec3 light_position_worldspace = pointLight.position;
    vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
    float light_attenuation = getPointLightAttenuation(pointLight, distance(light_position_worldspace, position_worldspace));
    lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, pointLight.color / light_attenuation);
  }

  for (int i = 0; i < lighting.spotLightCount; i++) {
    SpotLight spotLight = lighting_getSpotLight(i);
    vec3 light_position_worldspace = spotLight.position;
    vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
    float light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, spotLight.color / light_attenuation);
  }

  for (int i = 0; i < lighting.directionalLightCount; i++) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(i);
    lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
  }
  
  return lightColor;
}
`},96489(t,i,o){o.d(i,{X:()=>e});let e=`\
struct phongMaterialUniforms {
  unlit: u32,
  ambient: f32,
  diffuse: f32,
  shininess: f32,
  specularColor: vec3<f32>,
};

@group(3) @binding(auto) var<uniform> phongMaterial : phongMaterialUniforms;

fn lighting_getLightColor(surfaceColor: vec3<f32>, light_direction: vec3<f32>, view_direction: vec3<f32>, normal_worldspace: vec3<f32>, color: vec3<f32>) -> vec3<f32> {
  let halfway_direction: vec3<f32> = normalize(light_direction + view_direction);
  var lambertian: f32 = dot(light_direction, normal_worldspace);
  var specular: f32 = 0.0;
  if (lambertian > 0.0) {
    let specular_angle = max(dot(normal_worldspace, halfway_direction), 0.0);
    specular = pow(specular_angle, phongMaterial.shininess);
  }
  lambertian = max(lambertian, 0.0);
  return (
    lambertian * phongMaterial.diffuse * surfaceColor +
    specular * floatColors_normalize(phongMaterial.specularColor)
  ) * color;
}

fn lighting_getLightColor2(surfaceColor: vec3<f32>, cameraPosition: vec3<f32>, position_worldspace: vec3<f32>, normal_worldspace: vec3<f32>) -> vec3<f32> {
  var lightColor: vec3<f32> = surfaceColor;

  if (phongMaterial.unlit != 0u) {
    return surfaceColor;
  }

  if (lighting.enabled == 0) {
    return lightColor;
  }

  let view_direction: vec3<f32> = normalize(cameraPosition - position_worldspace);
  lightColor = phongMaterial.ambient * surfaceColor * lighting.ambientColor;

  for (var i: i32 = 0; i < lighting.pointLightCount; i++) {
    let pointLight: PointLight = lighting_getPointLight(i);
    let light_position_worldspace: vec3<f32> = pointLight.position;
    let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
    let light_attenuation = getPointLightAttenuation(
      pointLight,
      distance(light_position_worldspace, position_worldspace)
    );
    lightColor += lighting_getLightColor(
      surfaceColor,
      light_direction,
      view_direction,
      normal_worldspace,
      pointLight.color / light_attenuation
    );
  }

  for (var i: i32 = 0; i < lighting.spotLightCount; i++) {
    let spotLight: SpotLight = lighting_getSpotLight(i);
    let light_position_worldspace: vec3<f32> = spotLight.position;
    let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
    let light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    lightColor += lighting_getLightColor(
      surfaceColor,
      light_direction,
      view_direction,
      normal_worldspace,
      spotLight.color / light_attenuation
    );
  }

  for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
    let directionalLight: DirectionalLight = lighting_getDirectionalLight(i);
    lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
  }  
  
  return lightColor;
}

fn lighting_getSpecularLightColor(cameraPosition: vec3<f32>, position_worldspace: vec3<f32>, normal_worldspace: vec3<f32>) -> vec3<f32>{
  var lightColor = vec3<f32>(0, 0, 0);
  let surfaceColor = vec3<f32>(0, 0, 0);

  if (lighting.enabled != 0) {
    let view_direction = normalize(cameraPosition - position_worldspace);

    for (var i: i32 = 0; i < lighting.pointLightCount; i++) {
      let pointLight: PointLight = lighting_getPointLight(i);
      let light_position_worldspace: vec3<f32> = pointLight.position;
      let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
      let light_attenuation = getPointLightAttenuation(
        pointLight,
        distance(light_position_worldspace, position_worldspace)
      );
      lightColor += lighting_getLightColor(
        surfaceColor,
        light_direction,
        view_direction,
        normal_worldspace,
        pointLight.color / light_attenuation
      );
    }

    for (var i: i32 = 0; i < lighting.spotLightCount; i++) {
      let spotLight: SpotLight = lighting_getSpotLight(i);
      let light_position_worldspace: vec3<f32> = spotLight.position;
      let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
      let light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
      lightColor += lighting_getLightColor(
        surfaceColor,
        light_direction,
        view_direction,
        normal_worldspace,
        spotLight.color / light_attenuation
      );
    }

    for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
        let directionalLight: DirectionalLight = lighting_getDirectionalLight(i);
        lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
    }
  }
  return lightColor;
}
`}}]);