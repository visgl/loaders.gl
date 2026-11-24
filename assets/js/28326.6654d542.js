"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["28326"],{59452(i,t,o){o.d(t,{A:()=>s});var e=o(66260),r=o(43411),l=o(38055),n=o(12897);class a extends e.A{get isComposite(){return!0}get isDrawable(){return!1}get isLoaded(){return super.isLoaded&&this.getSubLayers().every(i=>i.isLoaded)}getSubLayers(){return this.internalState&&this.internalState.subLayers||[]}initializeState(i){}setState(i){super.setState(i),this.setNeedsUpdate()}getPickingInfo({info:i}){let{object:t}=i;return t&&t.__source&&t.__source.parent&&t.__source.parent.id===this.id&&(i.object=t.__source.object,i.index=t.__source.index),i}filterSubLayer(i){return!0}shouldRenderSubLayer(i,t){return t&&t.length}getSubLayerClass(i,t){let{_subLayerProps:o}=this.props;return o&&o[i]&&o[i].type||t}getSubLayerRow(i,t,o){return i.__source={parent:this,object:t,index:o},i}getSubLayerAccessor(i){if("function"==typeof i){let t={index:-1,data:this.props.data,target:[]};return(o,e)=>o&&o.__source?(t.index=o.__source.index,i(o.__source.object,t)):i(o,e)}return i}getSubLayerProps(i={}){let{opacity:t,pickable:o,visible:e,parameters:r,getPolygonOffset:l,highlightedObjectIndex:a,autoHighlight:s,highlightColor:g,coordinateSystem:p,coordinateOrigin:c,wrapLongitude:u,positionFormat:h,modelMatrix:_,extensions:f,fetch:d,operation:C,_subLayerProps:m}=this.props,v={id:"",updateTriggers:{},opacity:t,pickable:o,visible:e,parameters:r,getPolygonOffset:l,highlightedObjectIndex:a,autoHighlight:s,highlightColor:g,coordinateSystem:p,coordinateOrigin:c,wrapLongitude:u,positionFormat:h,modelMatrix:_,extensions:f,fetch:d,operation:C},L=m&&i.id&&m[i.id],w=L&&L.updateTriggers,b=i.id||"sublayer";if(L){let t=this.props[n.fW],o=i.type?i.type._propTypes:{};for(let i in L){let e=o[i]||t[i];e&&"accessor"===e.type&&(L[i]=this.getSubLayerAccessor(L[i]))}}for(let t of(Object.assign(v,i,L),v.id=`${this.props.id}-${b}`,v.updateTriggers={all:this.props.updateTriggers?.all,...i.updateTriggers,...w},f)){let i=t.getSubLayerProps.call(this,t);i&&Object.assign(v,i,{updateTriggers:Object.assign(v.updateTriggers,i.updateTriggers)})}return v}_updateAutoHighlight(i){for(let t of this.getSubLayers())t.updateAutoHighlight(i)}_getAttributeManager(){return null}_postUpdate(i,t){let o=this.internalState.subLayers,e=!o||this.needsUpdate();if(e){let i=this.renderLayers();o=(0,l.B)(i,Boolean),this.internalState.subLayers=o}for(let i of((0,r.A)("compositeLayer.renderLayers",this,e,o),o))i.parent=this}}a.layerName="CompositeLayer";let s=a},89907(i,t,o){o.d(t,{$n:()=>n});Uint32Array.BYTES_PER_ELEMENT,r("colors");let e=r("floatColors");function r(i){return`\
layout(std140) uniform ${i}Uniforms {
  float useByteColors;
} ${i};

vec3 ${i}_normalize(vec3 inputColor) {
  return ${i}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${i}_normalize(vec4 inputColor) {
  return ${i}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${i}_premultiplyAlpha(vec4 inputColor) {
  return vec4(inputColor.rgb * inputColor.a, inputColor.a);
}

vec4 ${i}_unpremultiplyAlpha(vec4 inputColor) {
  return inputColor.a > 0.0 ? vec4(inputColor.rgb / inputColor.a, inputColor.a) : vec4(0.0);
}

vec4 ${i}_premultiply_alpha(vec4 inputColor) {
  return ${i}_premultiplyAlpha(inputColor);
}

vec4 ${i}_unpremultiply_alpha(vec4 inputColor) {
  return ${i}_unpremultiplyAlpha(inputColor);
}
`}function l(i){return`\
struct ${i}Uniforms {
  useByteColors: f32
};

@group(0) @binding(auto) var<uniform> ${i} : ${i}Uniforms;

fn ${i}_normalize(inputColor: vec3<f32>) -> vec3<f32> {
  return select(inputColor, inputColor / 255.0, ${i}.useByteColors > 0.5);
}

fn ${i}_normalize4(inputColor: vec4<f32>) -> vec4<f32> {
  return select(inputColor, inputColor / 255.0, ${i}.useByteColors > 0.5);
}

fn ${i}_premultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(inputColor.rgb * inputColor.a, inputColor.a);
}

fn ${i}_unpremultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return select(
    vec4<f32>(0.0),
    vec4<f32>(inputColor.rgb / inputColor.a, inputColor.a),
    inputColor.a > 0.0
  );
}

fn ${i}_premultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${i}_premultiplyAlpha(inputColor);
}

fn ${i}_unpremultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${i}_unpremultiplyAlpha(inputColor);
}
`}l("colors");let n={name:"floatColors",props:{},uniforms:{},vs:e,fs:e,source:l("floatColors"),uniformTypes:{useByteColors:"f32"},defaultUniforms:{useByteColors:!0}}},87238(i,t,o){o.d(t,{J:()=>a});var e=o(89907),r=o(25261),l=o(63484),n=o(96489);let a={props:{},name:"gouraudMaterial",bindingLayout:[{name:"gouraudMaterial",group:3}],vs:l.l.replace("phongMaterial","gouraudMaterial"),fs:l.X.replace("phongMaterial","gouraudMaterial"),source:n.X.replaceAll("phongMaterial","gouraudMaterial"),defines:{LIGHTING_VERTEX:!0},dependencies:[r.x,e.$n],uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:i=>({...a.defaultUniforms,...i})}},63484(i,t,o){o.d(t,{X:()=>e,l:()=>r});let e=`\
layout(std140) uniform phongMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
  uniform float shininess;
  uniform vec3  specularColor;
} material;
`,r=`\
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
`},96489(i,t,o){o.d(t,{X:()=>e});let e=`\
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