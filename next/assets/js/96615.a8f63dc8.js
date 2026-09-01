"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["96615"],{64954(e,t,r){r.d(t,{A:()=>tn});var o,a,i=r(25337),n=r(59452),s=r(3459),l=r(9350),c=r(69198),p=r(25799),u=r(84175),f=r(95335),m=r(66925);let d=`\
#ifdef USE_IBL
@group(2) @binding(auto) var pbr_diffuseEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_diffuseEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_specularEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_specularEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_brdfLUT: texture_2d<f32>;
@group(2) @binding(auto) var pbr_brdfLUTSampler: sampler;
#endif
`,g=`\
#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif
`,h=`\
out vec3 pbr_vPosition;
out vec2 pbr_vUV0;
out vec2 pbr_vUV1;

#ifdef HAS_NORMALS
# ifdef HAS_TANGENTS
out mat3 pbr_vTBN;
# else
out vec3 pbr_vNormal;
# endif
#endif

void pbr_setPositionNormalTangentUV(
  vec4 position,
  vec4 normal,
  vec4 tangent,
  vec2 uv0,
  vec2 uv1
)
{
  vec4 pos = pbrProjection.modelMatrix * position;
  pbr_vPosition = vec3(pos.xyz) / pos.w;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
  vec3 normalW = normalize(vec3(pbrProjection.normalMatrix * vec4(normal.xyz, 0.0)));
  vec3 tangentW = normalize(vec3(pbrProjection.modelMatrix * vec4(tangent.xyz, 0.0)));
  vec3 bitangentW = cross(normalW, tangentW) * tangent.w;
  pbr_vTBN = mat3(tangentW, bitangentW, normalW);
#else // HAS_TANGENTS != 1
  pbr_vNormal = normalize(vec3(pbrProjection.modelMatrix * vec4(normal.xyz, 0.0)));
#endif
#endif

#ifdef HAS_UV
  pbr_vUV0 = uv0;
#else
  pbr_vUV0 = vec2(0.,0.);
#endif

  pbr_vUV1 = uv1;
}
`,b=`\
precision highp float;

layout(std140) uniform pbrMaterialUniforms {
  // Material is unlit
  bool unlit;

  // Base color map
  bool baseColorMapEnabled;
  vec4 baseColorFactor;

  bool normalMapEnabled;  
  float normalScale; // #ifdef HAS_NORMALMAP

  bool emissiveMapEnabled;
  vec3 emissiveFactor; // #ifdef HAS_EMISSIVEMAP

  vec2 metallicRoughnessValues;
  bool metallicRoughnessMapEnabled;

  bool occlusionMapEnabled;
  float occlusionStrength; // #ifdef HAS_OCCLUSIONMAP
  
  bool alphaCutoffEnabled;
  float alphaCutoff; // #ifdef ALPHA_CUTOFF

  vec3 specularColorFactor;
  float specularIntensityFactor;
  bool specularColorMapEnabled;
  bool specularIntensityMapEnabled;

  float ior;

  float transmissionFactor;
  bool transmissionMapEnabled;

  float thicknessFactor;
  float attenuationDistance;
  vec3 attenuationColor;

  float clearcoatFactor;
  float clearcoatRoughnessFactor;
  bool clearcoatMapEnabled;
  bool clearcoatRoughnessMapEnabled;

  vec3 sheenColorFactor;
  float sheenRoughnessFactor;
  bool sheenColorMapEnabled;
  bool sheenRoughnessMapEnabled;

  float iridescenceFactor;
  float iridescenceIor;
  vec2 iridescenceThicknessRange;
  bool iridescenceMapEnabled;

  float anisotropyStrength;
  float anisotropyRotation;
  vec2 anisotropyDirection;
  bool anisotropyMapEnabled;

  float emissiveStrength;
  
  // IBL
  bool IBLenabled;
  vec2 scaleIBLAmbient; // #ifdef USE_IBL
  
  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  vec4 scaleDiffBaseMR;
  vec4 scaleFGDSpec;
  // #endif

  int baseColorUVSet;
  mat3 baseColorUVTransform;
  int metallicRoughnessUVSet;
  mat3 metallicRoughnessUVTransform;
  int normalUVSet;
  mat3 normalUVTransform;
  int occlusionUVSet;
  mat3 occlusionUVTransform;
  int emissiveUVSet;
  mat3 emissiveUVTransform;
  int specularColorUVSet;
  mat3 specularColorUVTransform;
  int specularIntensityUVSet;
  mat3 specularIntensityUVTransform;
  int transmissionUVSet;
  mat3 transmissionUVTransform;
  int thicknessUVSet;
  mat3 thicknessUVTransform;
  int clearcoatUVSet;
  mat3 clearcoatUVTransform;
  int clearcoatRoughnessUVSet;
  mat3 clearcoatRoughnessUVTransform;
  int clearcoatNormalUVSet;
  mat3 clearcoatNormalUVTransform;
  int sheenColorUVSet;
  mat3 sheenColorUVTransform;
  int sheenRoughnessUVSet;
  mat3 sheenRoughnessUVTransform;
  int iridescenceUVSet;
  mat3 iridescenceUVTransform;
  int iridescenceThicknessUVSet;
  mat3 iridescenceThicknessUVTransform;
  int anisotropyUVSet;
  mat3 anisotropyUVTransform;
} pbrMaterial;

// Samplers
#ifdef HAS_BASECOLORMAP
uniform sampler2D pbr_baseColorSampler;
#endif
#ifdef HAS_NORMALMAP
uniform sampler2D pbr_normalSampler;
#endif
#ifdef HAS_EMISSIVEMAP
uniform sampler2D pbr_emissiveSampler;
#endif
#ifdef HAS_METALROUGHNESSMAP
uniform sampler2D pbr_metallicRoughnessSampler;
#endif
#ifdef HAS_OCCLUSIONMAP
uniform sampler2D pbr_occlusionSampler;
#endif
#ifdef HAS_SPECULARCOLORMAP
uniform sampler2D pbr_specularColorSampler;
#endif
#ifdef HAS_SPECULARINTENSITYMAP
uniform sampler2D pbr_specularIntensitySampler;
#endif
#ifdef HAS_TRANSMISSIONMAP
uniform sampler2D pbr_transmissionSampler;
#endif
#ifdef HAS_THICKNESSMAP
uniform sampler2D pbr_thicknessSampler;
#endif
#ifdef HAS_CLEARCOATMAP
uniform sampler2D pbr_clearcoatSampler;
#endif
#ifdef HAS_CLEARCOATROUGHNESSMAP
uniform sampler2D pbr_clearcoatRoughnessSampler;
#endif
#ifdef HAS_CLEARCOATNORMALMAP
uniform sampler2D pbr_clearcoatNormalSampler;
#endif
#ifdef HAS_SHEENCOLORMAP
uniform sampler2D pbr_sheenColorSampler;
#endif
#ifdef HAS_SHEENROUGHNESSMAP
uniform sampler2D pbr_sheenRoughnessSampler;
#endif
#ifdef HAS_IRIDESCENCEMAP
uniform sampler2D pbr_iridescenceSampler;
#endif
#ifdef HAS_IRIDESCENCETHICKNESSMAP
uniform sampler2D pbr_iridescenceThicknessSampler;
#endif
#ifdef HAS_ANISOTROPYMAP
uniform sampler2D pbr_anisotropySampler;
#endif
// Inputs from vertex shader

in vec3 pbr_vPosition;
in vec2 pbr_vUV0;
in vec2 pbr_vUV1;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
in mat3 pbr_vTBN;
#else
in vec3 pbr_vNormal;
#endif
#endif

// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.
struct PBRInfo {
  float NdotL;                  // cos angle between normal and light direction
  float NdotV;                  // cos angle between normal and view direction
  float NdotH;                  // cos angle between normal and half vector
  float LdotH;                  // cos angle between light direction and half vector
  float VdotH;                  // cos angle between view direction and half vector
  float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
  float metalness;              // metallic value at the surface
  vec3 reflectance0;            // full reflectance color (normal incidence angle)
  vec3 reflectance90;           // reflectance color at grazing angle
  float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
  vec3 diffuseColor;            // color contribution from diffuse lighting
  vec3 specularColor;           // color contribution from specular lighting
  vec3 n;                       // normal at surface point
  vec3 v;                       // vector from surface point to camera
};

const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

vec3 calculateFinalColor(PBRInfo pbrInfo, vec3 lightColor);

vec4 SRGBtoLINEAR(vec4 srgbIn)
{
#ifdef MANUAL_SRGB
#ifdef SRGB_FAST_APPROXIMATION
  vec3 linOut = pow(srgbIn.xyz,vec3(2.2));
#else // SRGB_FAST_APPROXIMATION
  vec3 bLess = step(vec3(0.04045),srgbIn.xyz);
  vec3 linOut = mix( srgbIn.xyz/vec3(12.92), pow((srgbIn.xyz+vec3(0.055))/vec3(1.055),vec3(2.4)), bLess );
#endif //SRGB_FAST_APPROXIMATION
  return vec4(linOut,srgbIn.w);;
#else //MANUAL_SRGB
  return srgbIn;
#endif //MANUAL_SRGB
}

vec2 getMaterialUV(int uvSet, mat3 uvTransform)
{
  vec2 baseUV = uvSet == 1 ? pbr_vUV1 : pbr_vUV0;
  return (uvTransform * vec3(baseUV, 1.0)).xy;
}

// Build the tangent basis from interpolated attributes or screen-space derivatives.
mat3 getTBN(vec2 uv)
{
#ifndef HAS_TANGENTS
  vec3 pos_dx = dFdx(pbr_vPosition);
  vec3 pos_dy = dFdy(pbr_vPosition);
  vec3 tex_dx = dFdx(vec3(uv, 0.0));
  vec3 tex_dy = dFdy(vec3(uv, 0.0));
  vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

#ifdef HAS_NORMALS
  vec3 ng = normalize(pbr_vNormal);
#else
  vec3 ng = cross(pos_dx, pos_dy);
#endif

  t = normalize(t - ng * dot(ng, t));
  vec3 b = normalize(cross(ng, t));
  mat3 tbn = mat3(t, b, ng);
#else // HAS_TANGENTS
  mat3 tbn = pbr_vTBN;
#endif

  return tbn;
}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
vec3 getMappedNormal(sampler2D normalSampler, mat3 tbn, float normalScale, vec2 uv)
{
  vec3 n = texture(normalSampler, uv).rgb;
  return normalize(tbn * ((2.0 * n - 1.0) * vec3(normalScale, normalScale, 1.0)));
}

vec3 getNormal(mat3 tbn, vec2 uv)
{
#ifdef HAS_NORMALMAP
  vec3 n = getMappedNormal(pbr_normalSampler, tbn, pbrMaterial.normalScale, uv);
#else
  // The tbn matrix is linearly interpolated, so we need to re-normalize
  vec3 n = normalize(tbn[2].xyz);
#endif

  return n;
}

vec3 getClearcoatNormal(mat3 tbn, vec3 baseNormal, vec2 uv)
{
#ifdef HAS_CLEARCOATNORMALMAP
  return getMappedNormal(pbr_clearcoatNormalSampler, tbn, 1.0, uv);
#else
  return baseNormal;
#endif
}

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
#ifdef USE_IBL
vec3 getIBLContribution(PBRInfo pbrInfo, vec3 n, vec3 reflection)
{
  float mipCount = 9.0; // resolution of 512x512
  float lod = (pbrInfo.perceptualRoughness * mipCount);
  // retrieve a scale and bias to F0. See [1], Figure 3
  vec3 brdf = SRGBtoLINEAR(texture(pbr_brdfLUT,
    vec2(pbrInfo.NdotV, 1.0 - pbrInfo.perceptualRoughness))).rgb;
  vec3 diffuseLight = SRGBtoLINEAR(texture(pbr_diffuseEnvSampler, n)).rgb;

#ifdef USE_TEX_LOD
  vec3 specularLight = SRGBtoLINEAR(texture(pbr_specularEnvSampler, reflection, lod)).rgb;
#else
  vec3 specularLight = SRGBtoLINEAR(texture(pbr_specularEnvSampler, reflection)).rgb;
#endif

  vec3 diffuse = diffuseLight * pbrInfo.diffuseColor;
  vec3 specular = specularLight * (pbrInfo.specularColor * brdf.x + brdf.y);

  // For presentation, this allows us to disable IBL terms
  diffuse *= pbrMaterial.scaleIBLAmbient.x;
  specular *= pbrMaterial.scaleIBLAmbient.y;

  return diffuse + specular;
}
#endif

// Basic Lambertian diffuse
// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
// See also [1], Equation 1
vec3 diffuse(PBRInfo pbrInfo)
{
  return pbrInfo.diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 specularReflection(PBRInfo pbrInfo)
{
  return pbrInfo.reflectance0 +
    (pbrInfo.reflectance90 - pbrInfo.reflectance0) *
    pow(clamp(1.0 - pbrInfo.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
float geometricOcclusion(PBRInfo pbrInfo)
{
  float NdotL = pbrInfo.NdotL;
  float NdotV = pbrInfo.NdotV;
  float r = pbrInfo.alphaRoughness;

  float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
  float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
  return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across
// the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface
// for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes
// from EPIC Games [1], Equation 3.
float microfacetDistribution(PBRInfo pbrInfo)
{
  float roughnessSq = pbrInfo.alphaRoughness * pbrInfo.alphaRoughness;
  float f = (pbrInfo.NdotH * roughnessSq - pbrInfo.NdotH) * pbrInfo.NdotH + 1.0;
  return roughnessSq / (M_PI * f * f);
}

float maxComponent(vec3 value)
{
  return max(max(value.r, value.g), value.b);
}

float getDielectricF0(float ior)
{
  float clampedIor = max(ior, 1.0);
  float ratio = (clampedIor - 1.0) / (clampedIor + 1.0);
  return ratio * ratio;
}

vec2 normalizeDirection(vec2 direction)
{
  float directionLength = length(direction);
  return directionLength > 0.0001 ? direction / directionLength : vec2(1.0, 0.0);
}

vec2 rotateDirection(vec2 direction, float rotation)
{
  float s = sin(rotation);
  float c = cos(rotation);
  return vec2(direction.x * c - direction.y * s, direction.x * s + direction.y * c);
}

vec3 getIridescenceTint(float iridescence, float thickness, float NdotV)
{
  if (iridescence <= 0.0) {
    return vec3(1.0);
  }

  float phase = 0.015 * thickness * pbrMaterial.iridescenceIor + (1.0 - NdotV) * 6.0;
  vec3 thinFilmTint =
    0.5 + 0.5 * cos(vec3(phase, phase + 2.0943951, phase + 4.1887902));
  return mix(vec3(1.0), thinFilmTint, iridescence);
}

vec3 getVolumeAttenuation(float thickness)
{
  if (thickness <= 0.0) {
    return vec3(1.0);
  }

  vec3 attenuationCoefficient =
    -log(max(pbrMaterial.attenuationColor, vec3(0.0001))) /
    max(pbrMaterial.attenuationDistance, 0.0001);
  return exp(-attenuationCoefficient * thickness);
}

PBRInfo createClearcoatPBRInfo(PBRInfo basePBRInfo, vec3 clearcoatNormal, float clearcoatRoughness)
{
  float perceptualRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
  float alphaRoughness = perceptualRoughness * perceptualRoughness;
  float NdotV = clamp(abs(dot(clearcoatNormal, basePBRInfo.v)), 0.001, 1.0);

  return PBRInfo(
    basePBRInfo.NdotL,
    NdotV,
    basePBRInfo.NdotH,
    basePBRInfo.LdotH,
    basePBRInfo.VdotH,
    perceptualRoughness,
    0.0,
    vec3(0.04),
    vec3(1.0),
    alphaRoughness,
    vec3(0.0),
    vec3(0.04),
    clearcoatNormal,
    basePBRInfo.v
  );
}

vec3 calculateClearcoatContribution(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 clearcoatNormal,
  float clearcoatFactor,
  float clearcoatRoughness
) {
  if (clearcoatFactor <= 0.0) {
    return vec3(0.0);
  }

  PBRInfo clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return calculateFinalColor(clearcoatPBRInfo, lightColor) * clearcoatFactor;
}

#ifdef USE_IBL
vec3 calculateClearcoatIBLContribution(
  PBRInfo pbrInfo,
  vec3 clearcoatNormal,
  vec3 reflection,
  float clearcoatFactor,
  float clearcoatRoughness
) {
  if (clearcoatFactor <= 0.0) {
    return vec3(0.0);
  }

  PBRInfo clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return getIBLContribution(clearcoatPBRInfo, clearcoatNormal, reflection) * clearcoatFactor;
}
#endif

vec3 calculateSheenContribution(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 sheenColor,
  float sheenRoughness
) {
  if (maxComponent(sheenColor) <= 0.0) {
    return vec3(0.0);
  }

  float sheenFresnel = pow(clamp(1.0 - pbrInfo.VdotH, 0.0, 1.0), 5.0);
  float sheenVisibility = mix(1.0, pbrInfo.NdotL * pbrInfo.NdotV, sheenRoughness);
  return pbrInfo.NdotL *
    lightColor *
    sheenColor *
    (0.25 + 0.75 * sheenFresnel) *
    sheenVisibility *
    (1.0 - pbrInfo.metalness);
}

float calculateAnisotropyBoost(
  PBRInfo pbrInfo,
  vec3 anisotropyTangent,
  float anisotropyStrength
) {
  if (anisotropyStrength <= 0.0) {
    return 1.0;
  }

  vec3 anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  float bitangentViewAlignment = abs(dot(pbrInfo.v, anisotropyBitangent));
  return mix(1.0, 0.65 + 0.7 * bitangentViewAlignment, anisotropyStrength);
}

vec3 calculateMaterialLightColor(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 clearcoatNormal,
  float clearcoatFactor,
  float clearcoatRoughness,
  vec3 sheenColor,
  float sheenRoughness,
  vec3 anisotropyTangent,
  float anisotropyStrength
) {
  float anisotropyBoost = calculateAnisotropyBoost(pbrInfo, anisotropyTangent, anisotropyStrength);
  vec3 color = calculateFinalColor(pbrInfo, lightColor) * anisotropyBoost;
  color += calculateClearcoatContribution(
    pbrInfo,
    lightColor,
    clearcoatNormal,
    clearcoatFactor,
    clearcoatRoughness
  );
  color += calculateSheenContribution(pbrInfo, lightColor, sheenColor, sheenRoughness);
  return color;
}

void PBRInfo_setAmbientLight(inout PBRInfo pbrInfo) {
  pbrInfo.NdotL = 1.0;
  pbrInfo.NdotH = 0.0;
  pbrInfo.LdotH = 0.0;
  pbrInfo.VdotH = 1.0;
}

void PBRInfo_setDirectionalLight(inout PBRInfo pbrInfo, vec3 lightDirection) {
  vec3 n = pbrInfo.n;
  vec3 v = pbrInfo.v;
  vec3 l = normalize(lightDirection);             // Vector from surface point to light
  vec3 h = normalize(l+v);                        // Half vector between both l and v

  pbrInfo.NdotL = clamp(dot(n, l), 0.001, 1.0);
  pbrInfo.NdotH = clamp(dot(n, h), 0.0, 1.0);
  pbrInfo.LdotH = clamp(dot(l, h), 0.0, 1.0);
  pbrInfo.VdotH = clamp(dot(v, h), 0.0, 1.0);
}

void PBRInfo_setPointLight(inout PBRInfo pbrInfo, PointLight pointLight) {
  vec3 light_direction = normalize(pointLight.position - pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

void PBRInfo_setSpotLight(inout PBRInfo pbrInfo, SpotLight spotLight) {
  vec3 light_direction = normalize(spotLight.position - pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

vec3 calculateFinalColor(PBRInfo pbrInfo, vec3 lightColor) {
  // Calculate the shading terms for the microfacet specular shading model
  vec3 F = specularReflection(pbrInfo);
  float G = geometricOcclusion(pbrInfo);
  float D = microfacetDistribution(pbrInfo);

  // Calculation of analytical lighting contribution
  vec3 diffuseContrib = (1.0 - F) * diffuse(pbrInfo);
  vec3 specContrib = F * G * D / (4.0 * pbrInfo.NdotL * pbrInfo.NdotV);
  // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
  return pbrInfo.NdotL * lightColor * (diffuseContrib + specContrib);
}

vec4 pbr_filterColor(vec4 colorUnused)
{
  vec2 baseColorUV = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  vec2 metallicRoughnessUV = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  vec2 normalUV = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  vec2 occlusionUV = getMaterialUV(pbrMaterial.occlusionUVSet, pbrMaterial.occlusionUVTransform);
  vec2 emissiveUV = getMaterialUV(pbrMaterial.emissiveUVSet, pbrMaterial.emissiveUVTransform);
  vec2 specularColorUV = getMaterialUV(
    pbrMaterial.specularColorUVSet,
    pbrMaterial.specularColorUVTransform
  );
  vec2 specularIntensityUV = getMaterialUV(
    pbrMaterial.specularIntensityUVSet,
    pbrMaterial.specularIntensityUVTransform
  );
  vec2 transmissionUV = getMaterialUV(
    pbrMaterial.transmissionUVSet,
    pbrMaterial.transmissionUVTransform
  );
  vec2 thicknessUV = getMaterialUV(pbrMaterial.thicknessUVSet, pbrMaterial.thicknessUVTransform);
  vec2 clearcoatUV = getMaterialUV(pbrMaterial.clearcoatUVSet, pbrMaterial.clearcoatUVTransform);
  vec2 clearcoatRoughnessUV = getMaterialUV(
    pbrMaterial.clearcoatRoughnessUVSet,
    pbrMaterial.clearcoatRoughnessUVTransform
  );
  vec2 clearcoatNormalUV = getMaterialUV(
    pbrMaterial.clearcoatNormalUVSet,
    pbrMaterial.clearcoatNormalUVTransform
  );
  vec2 sheenColorUV = getMaterialUV(
    pbrMaterial.sheenColorUVSet,
    pbrMaterial.sheenColorUVTransform
  );
  vec2 sheenRoughnessUV = getMaterialUV(
    pbrMaterial.sheenRoughnessUVSet,
    pbrMaterial.sheenRoughnessUVTransform
  );
  vec2 iridescenceUV = getMaterialUV(
    pbrMaterial.iridescenceUVSet,
    pbrMaterial.iridescenceUVTransform
  );
  vec2 iridescenceThicknessUV = getMaterialUV(
    pbrMaterial.iridescenceThicknessUVSet,
    pbrMaterial.iridescenceThicknessUVTransform
  );
  vec2 anisotropyUV = getMaterialUV(
    pbrMaterial.anisotropyUVSet,
    pbrMaterial.anisotropyUVTransform
  );

  // The albedo may be defined from a base texture or a flat color
#ifdef HAS_BASECOLORMAP
  vec4 baseColor =
    SRGBtoLINEAR(texture(pbr_baseColorSampler, baseColorUV)) * pbrMaterial.baseColorFactor;
#else
  vec4 baseColor = pbrMaterial.baseColorFactor;
#endif

#ifdef ALPHA_CUTOFF
  if (baseColor.a < pbrMaterial.alphaCutoff) {
    discard;
  }
#endif

  vec3 color = vec3(0, 0, 0);

  float transmission = 0.0;

  if(pbrMaterial.unlit){
    color.rgb = baseColor.rgb;
  }
  else{
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    float perceptualRoughness = pbrMaterial.metallicRoughnessValues.y;
    float metallic = pbrMaterial.metallicRoughnessValues.x;
#ifdef HAS_METALROUGHNESSMAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    vec4 mrSample = texture(pbr_metallicRoughnessSampler, metallicRoughnessUV);
    perceptualRoughness = mrSample.g * perceptualRoughness;
    metallic = mrSample.b * metallic;
#endif
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    mat3 tbn = getTBN(normalUV);
    vec3 n = getNormal(tbn, normalUV);                          // normal at surface point
    vec3 v = normalize(pbrProjection.camera - pbr_vPosition);  // Vector from surface point to camera
    float NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
#ifdef USE_MATERIAL_EXTENSIONS
    bool useExtendedPBR =
      pbrMaterial.specularColorMapEnabled ||
      pbrMaterial.specularIntensityMapEnabled ||
      abs(pbrMaterial.specularIntensityFactor - 1.0) > 0.0001 ||
      maxComponent(abs(pbrMaterial.specularColorFactor - vec3(1.0))) > 0.0001 ||
      abs(pbrMaterial.ior - 1.5) > 0.0001 ||
      pbrMaterial.transmissionMapEnabled ||
      pbrMaterial.transmissionFactor > 0.0001 ||
      pbrMaterial.clearcoatMapEnabled ||
      pbrMaterial.clearcoatRoughnessMapEnabled ||
      pbrMaterial.clearcoatFactor > 0.0001 ||
      pbrMaterial.clearcoatRoughnessFactor > 0.0001 ||
      pbrMaterial.sheenColorMapEnabled ||
      pbrMaterial.sheenRoughnessMapEnabled ||
      maxComponent(pbrMaterial.sheenColorFactor) > 0.0001 ||
      pbrMaterial.sheenRoughnessFactor > 0.0001 ||
      pbrMaterial.iridescenceMapEnabled ||
      pbrMaterial.iridescenceFactor > 0.0001 ||
      abs(pbrMaterial.iridescenceIor - 1.3) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.x - 100.0) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.y - 400.0) > 0.0001 ||
      pbrMaterial.anisotropyMapEnabled ||
      pbrMaterial.anisotropyStrength > 0.0001 ||
      abs(pbrMaterial.anisotropyRotation) > 0.0001 ||
      length(pbrMaterial.anisotropyDirection - vec2(1.0, 0.0)) > 0.0001;
#else
    bool useExtendedPBR = false;
#endif

    if (!useExtendedPBR) {
      // Keep the baseline metallic-roughness implementation byte-for-byte equivalent in behavior.
      float alphaRoughness = perceptualRoughness * perceptualRoughness;

      vec3 f0 = vec3(0.04);
      vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
      diffuseColor *= 1.0 - metallic;
      vec3 specularColor = mix(f0, baseColor.rgb, metallic);

      float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
      float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
      vec3 specularEnvironmentR0 = specularColor.rgb;
      vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;
      vec3 reflection = -normalize(reflect(v, n));

      PBRInfo pbrInfo = PBRInfo(
        0.0, // NdotL
        NdotV,
        0.0, // NdotH
        0.0, // LdotH
        0.0, // VdotH
        perceptualRoughness,
        metallic,
        specularEnvironmentR0,
        specularEnvironmentR90,
        alphaRoughness,
        diffuseColor,
        specularColor,
        n,
        v
      );

#ifdef USE_LIGHTS
      PBRInfo_setAmbientLight(pbrInfo);
      color += calculateFinalColor(pbrInfo, lighting.ambientColor);

      for(int i = 0; i < lighting.directionalLightCount; i++) {
        if (i < lighting.directionalLightCount) {
          PBRInfo_setDirectionalLight(pbrInfo, lighting_getDirectionalLight(i).direction);
          color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color);
        }
      }

      for(int i = 0; i < lighting.pointLightCount; i++) {
        if (i < lighting.pointLightCount) {
          PBRInfo_setPointLight(pbrInfo, lighting_getPointLight(i));
          float attenuation = getPointLightAttenuation(lighting_getPointLight(i), distance(lighting_getPointLight(i).position, pbr_vPosition));
          color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color / attenuation);
        }
      }

      for(int i = 0; i < lighting.spotLightCount; i++) {
        if (i < lighting.spotLightCount) {
          PBRInfo_setSpotLight(pbrInfo, lighting_getSpotLight(i));
          float attenuation = getSpotLightAttenuation(lighting_getSpotLight(i), pbr_vPosition);
          color += calculateFinalColor(pbrInfo, lighting_getSpotLight(i).color / attenuation);
        }
      }
#endif

#ifdef USE_IBL
      if (pbrMaterial.IBLenabled) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
#endif

#ifdef HAS_OCCLUSIONMAP
      if (pbrMaterial.occlusionMapEnabled) {
        float ao = texture(pbr_occlusionSampler, occlusionUV).r;
        color = mix(color, color * ao, pbrMaterial.occlusionStrength);
      }
#endif

      vec3 emissive = pbrMaterial.emissiveFactor;
#ifdef HAS_EMISSIVEMAP
      if (pbrMaterial.emissiveMapEnabled) {
        emissive *= SRGBtoLINEAR(texture(pbr_emissiveSampler, emissiveUV)).rgb;
      }
#endif
      color += emissive * pbrMaterial.emissiveStrength;

#ifdef PBR_DEBUG
      color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
      color = mix(color, vec3(metallic), pbrMaterial.scaleDiffBaseMR.z);
      color = mix(color, vec3(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
#endif

      return vec4(pow(color, vec3(1.0 / 2.2)), baseColor.a);
    }

    float specularIntensity = pbrMaterial.specularIntensityFactor;
#ifdef HAS_SPECULARINTENSITYMAP
    if (pbrMaterial.specularIntensityMapEnabled) {
      specularIntensity *= texture(pbr_specularIntensitySampler, specularIntensityUV).a;
    }
#endif

    vec3 specularFactor = pbrMaterial.specularColorFactor;
#ifdef HAS_SPECULARCOLORMAP
    if (pbrMaterial.specularColorMapEnabled) {
      specularFactor *= SRGBtoLINEAR(texture(pbr_specularColorSampler, specularColorUV)).rgb;
    }
#endif

    transmission = pbrMaterial.transmissionFactor;
#ifdef HAS_TRANSMISSIONMAP
    if (pbrMaterial.transmissionMapEnabled) {
      transmission *= texture(pbr_transmissionSampler, transmissionUV).r;
    }
#endif
    transmission = clamp(transmission * (1.0 - metallic), 0.0, 1.0);
    float thickness = max(pbrMaterial.thicknessFactor, 0.0);
#ifdef HAS_THICKNESSMAP
    thickness *= texture(pbr_thicknessSampler, thicknessUV).g;
#endif

    float clearcoatFactor = pbrMaterial.clearcoatFactor;
    float clearcoatRoughness = pbrMaterial.clearcoatRoughnessFactor;
#ifdef HAS_CLEARCOATMAP
    if (pbrMaterial.clearcoatMapEnabled) {
      clearcoatFactor *= texture(pbr_clearcoatSampler, clearcoatUV).r;
    }
#endif
#ifdef HAS_CLEARCOATROUGHNESSMAP
    if (pbrMaterial.clearcoatRoughnessMapEnabled) {
      clearcoatRoughness *= texture(pbr_clearcoatRoughnessSampler, clearcoatRoughnessUV).g;
    }
#endif
    clearcoatFactor = clamp(clearcoatFactor, 0.0, 1.0);
    clearcoatRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
    vec3 clearcoatNormal = getClearcoatNormal(getTBN(clearcoatNormalUV), n, clearcoatNormalUV);

    vec3 sheenColor = pbrMaterial.sheenColorFactor;
    float sheenRoughness = pbrMaterial.sheenRoughnessFactor;
#ifdef HAS_SHEENCOLORMAP
    if (pbrMaterial.sheenColorMapEnabled) {
      sheenColor *= SRGBtoLINEAR(texture(pbr_sheenColorSampler, sheenColorUV)).rgb;
    }
#endif
#ifdef HAS_SHEENROUGHNESSMAP
    if (pbrMaterial.sheenRoughnessMapEnabled) {
      sheenRoughness *= texture(pbr_sheenRoughnessSampler, sheenRoughnessUV).a;
    }
#endif
    sheenRoughness = clamp(sheenRoughness, c_MinRoughness, 1.0);

    float iridescence = pbrMaterial.iridescenceFactor;
#ifdef HAS_IRIDESCENCEMAP
    if (pbrMaterial.iridescenceMapEnabled) {
      iridescence *= texture(pbr_iridescenceSampler, iridescenceUV).r;
    }
#endif
    iridescence = clamp(iridescence, 0.0, 1.0);
    float iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      0.5
    );
#ifdef HAS_IRIDESCENCETHICKNESSMAP
    iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      texture(pbr_iridescenceThicknessSampler, iridescenceThicknessUV).g
    );
#endif

    float anisotropyStrength = clamp(pbrMaterial.anisotropyStrength, 0.0, 1.0);
    vec2 anisotropyDirection = normalizeDirection(pbrMaterial.anisotropyDirection);
#ifdef HAS_ANISOTROPYMAP
    if (pbrMaterial.anisotropyMapEnabled) {
      vec3 anisotropySample = texture(pbr_anisotropySampler, anisotropyUV).rgb;
      anisotropyStrength *= anisotropySample.b;
      vec2 mappedDirection = anisotropySample.rg * 2.0 - 1.0;
      if (length(mappedDirection) > 0.0001) {
        anisotropyDirection = normalize(mappedDirection);
      }
    }
#endif
    anisotropyDirection = rotateDirection(anisotropyDirection, pbrMaterial.anisotropyRotation);
    vec3 anisotropyTangent = normalize(tbn[0] * anisotropyDirection.x + tbn[1] * anisotropyDirection.y);
    if (length(anisotropyTangent) < 0.0001) {
      anisotropyTangent = normalize(tbn[0]);
    }
    float anisotropyViewAlignment = abs(dot(v, anisotropyTangent));
    perceptualRoughness = mix(
      perceptualRoughness,
      clamp(perceptualRoughness * (1.0 - 0.6 * anisotropyViewAlignment), c_MinRoughness, 1.0),
      anisotropyStrength
    );

    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    float dielectricF0 = getDielectricF0(pbrMaterial.ior);
    vec3 dielectricSpecularF0 = min(
      vec3(dielectricF0) * specularFactor * specularIntensity,
      vec3(1.0)
    );
    vec3 iridescenceTint = getIridescenceTint(iridescence, iridescenceThickness, NdotV);
    dielectricSpecularF0 = mix(
      dielectricSpecularF0,
      dielectricSpecularF0 * iridescenceTint,
      iridescence
    );
    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - dielectricSpecularF0);
    diffuseColor *= (1.0 - metallic) * (1.0 - transmission);
    vec3 specularColor = mix(dielectricSpecularF0, baseColor.rgb, metallic);

    float baseLayerEnergy = 1.0 - clearcoatFactor * 0.25;
    diffuseColor *= baseLayerEnergy;
    specularColor *= baseLayerEnergy;

    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing
    // reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%),
    // incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;
    vec3 reflection = -normalize(reflect(v, n));

    PBRInfo pbrInfo = PBRInfo(
      0.0, // NdotL
      NdotV,
      0.0, // NdotH
      0.0, // LdotH
      0.0, // VdotH
      perceptualRoughness,
      metallic,
      specularEnvironmentR0,
      specularEnvironmentR90,
      alphaRoughness,
      diffuseColor,
      specularColor,
      n,
      v
    );


#ifdef USE_LIGHTS
    // Apply ambient light
    PBRInfo_setAmbientLight(pbrInfo);
    color += calculateMaterialLightColor(
      pbrInfo,
      lighting.ambientColor,
      clearcoatNormal,
      clearcoatFactor,
      clearcoatRoughness,
      sheenColor,
      sheenRoughness,
      anisotropyTangent,
      anisotropyStrength
    );

    // Apply directional light
    for(int i = 0; i < lighting.directionalLightCount; i++) {
      if (i < lighting.directionalLightCount) {
        PBRInfo_setDirectionalLight(pbrInfo, lighting_getDirectionalLight(i).direction);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getDirectionalLight(i).color,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
      }
    }

    // Apply point light
    for(int i = 0; i < lighting.pointLightCount; i++) {
      if (i < lighting.pointLightCount) {
        PBRInfo_setPointLight(pbrInfo, lighting_getPointLight(i));
        float attenuation = getPointLightAttenuation(lighting_getPointLight(i), distance(lighting_getPointLight(i).position, pbr_vPosition));
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getPointLight(i).color / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
      }
    }

    for(int i = 0; i < lighting.spotLightCount; i++) {
      if (i < lighting.spotLightCount) {
        PBRInfo_setSpotLight(pbrInfo, lighting_getSpotLight(i));
        float attenuation = getSpotLightAttenuation(lighting_getSpotLight(i), pbr_vPosition);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getSpotLight(i).color / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
      }
    }
#endif

    // Calculate lighting contribution from image based lighting source (IBL)
#ifdef USE_IBL
    if (pbrMaterial.IBLenabled) {
      color += getIBLContribution(pbrInfo, n, reflection) *
        calculateAnisotropyBoost(pbrInfo, anisotropyTangent, anisotropyStrength);
      color += calculateClearcoatIBLContribution(
        pbrInfo,
        clearcoatNormal,
        -normalize(reflect(v, clearcoatNormal)),
        clearcoatFactor,
        clearcoatRoughness
      );
      color += sheenColor * pbrMaterial.scaleIBLAmbient.x * (1.0 - sheenRoughness) * 0.25;
    }
#endif

 // Apply optional PBR terms for additional (optional) shading
#ifdef HAS_OCCLUSIONMAP
    if (pbrMaterial.occlusionMapEnabled) {
      float ao = texture(pbr_occlusionSampler, occlusionUV).r;
      color = mix(color, color * ao, pbrMaterial.occlusionStrength);
    }
#endif

    vec3 emissive = pbrMaterial.emissiveFactor;
#ifdef HAS_EMISSIVEMAP
    if (pbrMaterial.emissiveMapEnabled) {
      emissive *= SRGBtoLINEAR(texture(pbr_emissiveSampler, emissiveUV)).rgb;
    }
#endif
    color += emissive * pbrMaterial.emissiveStrength;

    if (transmission > 0.0) {
      color = mix(color, color * getVolumeAttenuation(thickness), transmission);
    }

    // This section uses mix to override final color for reference app visualization
    // of various parameters in the lighting equation.
#ifdef PBR_DEBUG
    // TODO: Figure out how to debug multiple lights

    // color = mix(color, F, pbr_scaleFGDSpec.x);
    // color = mix(color, vec3(G), pbr_scaleFGDSpec.y);
    // color = mix(color, vec3(D), pbr_scaleFGDSpec.z);
    // color = mix(color, specContrib, pbr_scaleFGDSpec.w);

    // color = mix(color, diffuseContrib, pbr_scaleDiffBaseMR.x);
    color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
    color = mix(color, vec3(metallic), pbrMaterial.scaleDiffBaseMR.z);
    color = mix(color, vec3(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
#endif

  }

  float alpha = clamp(baseColor.a * (1.0 - transmission), 0.0, 1.0);
  return vec4(pow(color,vec3(1.0/2.2)), alpha);
}
`,v=`\
struct PBRFragmentInputs {
  pbr_vPosition: vec3f,
  pbr_vUV0: vec2f,
  pbr_vUV1: vec2f,
  pbr_vTBN: mat3x3f,
  pbr_vNormal: vec3f
};

var<private> fragmentInputs: PBRFragmentInputs;

fn pbr_setPositionNormalTangentUV(
  position: vec4f,
  normal: vec4f,
  tangent: vec4f,
  uv0: vec2f,
  uv1: vec2f
)
{
  var pos: vec4f = pbrProjection.modelMatrix * position;
  fragmentInputs.pbr_vPosition = pos.xyz / pos.w;
  fragmentInputs.pbr_vNormal = vec3f(0.0, 0.0, 1.0);
  fragmentInputs.pbr_vTBN = mat3x3f(
    vec3f(1.0, 0.0, 0.0),
    vec3f(0.0, 1.0, 0.0),
    vec3f(0.0, 0.0, 1.0)
  );
  fragmentInputs.pbr_vUV0 = vec2f(0.0, 0.0);
  fragmentInputs.pbr_vUV1 = uv1;

#ifdef HAS_NORMALS
  let normalW: vec3f = normalize((pbrProjection.normalMatrix * vec4f(normal.xyz, 0.0)).xyz);
  fragmentInputs.pbr_vNormal = normalW;
#ifdef HAS_TANGENTS
  let tangentW: vec3f = normalize((pbrProjection.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz);
  let bitangentW: vec3f = cross(normalW, tangentW) * tangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangentW, bitangentW, normalW);
#endif
#endif

#ifdef HAS_UV
  fragmentInputs.pbr_vUV0 = uv0;
#endif
}

struct pbrMaterialUniforms {
  // Material is unlit
  unlit: u32,

  // Base color map
  baseColorMapEnabled: u32,
  baseColorFactor: vec4f,

  normalMapEnabled : u32,
  normalScale: f32,  // #ifdef HAS_NORMALMAP

  emissiveMapEnabled: u32,
  emissiveFactor: vec3f, // #ifdef HAS_EMISSIVEMAP

  metallicRoughnessValues: vec2f,
  metallicRoughnessMapEnabled: u32,

  occlusionMapEnabled: i32,
  occlusionStrength: f32, // #ifdef HAS_OCCLUSIONMAP
  
  alphaCutoffEnabled: i32,
  alphaCutoff: f32, // #ifdef ALPHA_CUTOFF

  specularColorFactor: vec3f,
  specularIntensityFactor: f32,
  specularColorMapEnabled: i32,
  specularIntensityMapEnabled: i32,

  ior: f32,

  transmissionFactor: f32,
  transmissionMapEnabled: i32,

  thicknessFactor: f32,
  attenuationDistance: f32,
  attenuationColor: vec3f,

  clearcoatFactor: f32,
  clearcoatRoughnessFactor: f32,
  clearcoatMapEnabled: i32,
  clearcoatRoughnessMapEnabled: i32,

  sheenColorFactor: vec3f,
  sheenRoughnessFactor: f32,
  sheenColorMapEnabled: i32,
  sheenRoughnessMapEnabled: i32,

  iridescenceFactor: f32,
  iridescenceIor: f32,
  iridescenceThicknessRange: vec2f,
  iridescenceMapEnabled: i32,

  anisotropyStrength: f32,
  anisotropyRotation: f32,
  anisotropyDirection: vec2f,
  anisotropyMapEnabled: i32,

  emissiveStrength: f32,
  
  // IBL
  IBLenabled: i32,
  scaleIBLAmbient: vec2f, // #ifdef USE_IBL
  
  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  scaleDiffBaseMR: vec4f,
  scaleFGDSpec: vec4f,
  // #endif

  baseColorUVSet: i32,
  baseColorUVTransform: mat3x3f,
  metallicRoughnessUVSet: i32,
  metallicRoughnessUVTransform: mat3x3f,
  normalUVSet: i32,
  normalUVTransform: mat3x3f,
  occlusionUVSet: i32,
  occlusionUVTransform: mat3x3f,
  emissiveUVSet: i32,
  emissiveUVTransform: mat3x3f,
  specularColorUVSet: i32,
  specularColorUVTransform: mat3x3f,
  specularIntensityUVSet: i32,
  specularIntensityUVTransform: mat3x3f,
  transmissionUVSet: i32,
  transmissionUVTransform: mat3x3f,
  thicknessUVSet: i32,
  thicknessUVTransform: mat3x3f,
  clearcoatUVSet: i32,
  clearcoatUVTransform: mat3x3f,
  clearcoatRoughnessUVSet: i32,
  clearcoatRoughnessUVTransform: mat3x3f,
  clearcoatNormalUVSet: i32,
  clearcoatNormalUVTransform: mat3x3f,
  sheenColorUVSet: i32,
  sheenColorUVTransform: mat3x3f,
  sheenRoughnessUVSet: i32,
  sheenRoughnessUVTransform: mat3x3f,
  iridescenceUVSet: i32,
  iridescenceUVTransform: mat3x3f,
  iridescenceThicknessUVSet: i32,
  iridescenceThicknessUVTransform: mat3x3f,
  anisotropyUVSet: i32,
  anisotropyUVTransform: mat3x3f,
}

@group(3) @binding(auto) var<uniform> pbrMaterial : pbrMaterialUniforms;

// Samplers
#ifdef HAS_BASECOLORMAP
@group(3) @binding(auto) var pbr_baseColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_baseColorSamplerSampler: sampler;
#endif
#ifdef HAS_NORMALMAP
@group(3) @binding(auto) var pbr_normalSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_normalSamplerSampler: sampler;
#endif
#ifdef HAS_EMISSIVEMAP
@group(3) @binding(auto) var pbr_emissiveSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_emissiveSamplerSampler: sampler;
#endif
#ifdef HAS_METALROUGHNESSMAP
@group(3) @binding(auto) var pbr_metallicRoughnessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_metallicRoughnessSamplerSampler: sampler;
#endif
#ifdef HAS_OCCLUSIONMAP
@group(3) @binding(auto) var pbr_occlusionSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_occlusionSamplerSampler: sampler;
#endif
#ifdef HAS_SPECULARCOLORMAP
@group(3) @binding(auto) var pbr_specularColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_specularColorSamplerSampler: sampler;
#endif
#ifdef HAS_SPECULARINTENSITYMAP
@group(3) @binding(auto) var pbr_specularIntensitySampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_specularIntensitySamplerSampler: sampler;
#endif
#ifdef HAS_TRANSMISSIONMAP
@group(3) @binding(auto) var pbr_transmissionSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_transmissionSamplerSampler: sampler;
#endif
#ifdef HAS_THICKNESSMAP
@group(3) @binding(auto) var pbr_thicknessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_thicknessSamplerSampler: sampler;
#endif
#ifdef HAS_CLEARCOATMAP
@group(3) @binding(auto) var pbr_clearcoatSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_clearcoatSamplerSampler: sampler;
#endif
#ifdef HAS_CLEARCOATROUGHNESSMAP
@group(3) @binding(auto) var pbr_clearcoatRoughnessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_clearcoatRoughnessSamplerSampler: sampler;
#endif
#ifdef HAS_CLEARCOATNORMALMAP
@group(3) @binding(auto) var pbr_clearcoatNormalSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_clearcoatNormalSamplerSampler: sampler;
#endif
#ifdef HAS_SHEENCOLORMAP
@group(3) @binding(auto) var pbr_sheenColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_sheenColorSamplerSampler: sampler;
#endif
#ifdef HAS_SHEENROUGHNESSMAP
@group(3) @binding(auto) var pbr_sheenRoughnessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_sheenRoughnessSamplerSampler: sampler;
#endif
#ifdef HAS_IRIDESCENCEMAP
@group(3) @binding(auto) var pbr_iridescenceSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_iridescenceSamplerSampler: sampler;
#endif
#ifdef HAS_IRIDESCENCETHICKNESSMAP
@group(3) @binding(auto) var pbr_iridescenceThicknessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_iridescenceThicknessSamplerSampler: sampler;
#endif
#ifdef HAS_ANISOTROPYMAP
@group(3) @binding(auto) var pbr_anisotropySampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_anisotropySamplerSampler: sampler;
#endif
// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.
struct PBRInfo {
  NdotL: f32,                  // cos angle between normal and light direction
  NdotV: f32,                  // cos angle between normal and view direction
  NdotH: f32,                  // cos angle between normal and half vector
  LdotH: f32,                  // cos angle between light direction and half vector
  VdotH: f32,                  // cos angle between view direction and half vector
  perceptualRoughness: f32,    // roughness value, as authored by the model creator (input to shader)
  metalness: f32,              // metallic value at the surface
  reflectance0: vec3f,            // full reflectance color (normal incidence angle)
  reflectance90: vec3f,           // reflectance color at grazing angle
  alphaRoughness: f32,         // roughness mapped to a more linear change in the roughness (proposed by [2])
  diffuseColor: vec3f,            // color contribution from diffuse lighting
  specularColor: vec3f,           // color contribution from specular lighting
  n: vec3f,                       // normal at surface point
  v: vec3f,                       // vector from surface point to camera
};

const M_PI = 3.141592653589793;
const c_MinRoughness = 0.04;

fn SRGBtoLINEAR(srgbIn: vec4f ) -> vec4f
{
  var linOut: vec3f = srgbIn.xyz;
#ifdef MANUAL_SRGB
  let bLess: vec3f = step(vec3f(0.04045), srgbIn.xyz);
  linOut = mix(
    srgbIn.xyz / vec3f(12.92),
    pow((srgbIn.xyz + vec3f(0.055)) / vec3f(1.055), vec3f(2.4)),
    bLess
  );
#ifdef SRGB_FAST_APPROXIMATION
  linOut = pow(srgbIn.xyz, vec3f(2.2));
#endif
#endif
  return vec4f(linOut, srgbIn.w);
}

fn getMaterialUV(uvSet: i32, uvTransform: mat3x3f) -> vec2f
{
  var baseUV = fragmentInputs.pbr_vUV0;
  if (uvSet == 1) {
    baseUV = fragmentInputs.pbr_vUV1;
  }
  return (uvTransform * vec3f(baseUV, 1.0)).xy;
}

// Build the tangent basis from interpolated attributes or screen-space derivatives.
fn getTBN(uv: vec2f) -> mat3x3f
{
  let pos_dx: vec3f = dpdx(fragmentInputs.pbr_vPosition);
  let pos_dy: vec3f = dpdy(fragmentInputs.pbr_vPosition);
  let tex_dx: vec3f = dpdx(vec3f(uv, 0.0));
  let tex_dy: vec3f = dpdy(vec3f(uv, 0.0));
  var t: vec3f = (tex_dy.y * pos_dx - tex_dx.y * pos_dy) / (tex_dx.x * tex_dy.y - tex_dy.x * tex_dx.y);

  var ng: vec3f = cross(pos_dx, pos_dy);
#ifdef HAS_NORMALS
  ng = normalize(fragmentInputs.pbr_vNormal);
#endif
  t = normalize(t - ng * dot(ng, t));
  var b: vec3f = normalize(cross(ng, t));
  var tbn: mat3x3f = mat3x3f(t, b, ng);
#ifdef HAS_TANGENTS
  tbn = fragmentInputs.pbr_vTBN;
#endif

  return tbn;
}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
fn getMappedNormal(
  normalSampler: texture_2d<f32>,
  normalSamplerBinding: sampler,
  tbn: mat3x3f,
  normalScale: f32,
  uv: vec2f
) -> vec3f
{
  let n = textureSample(normalSampler, normalSamplerBinding, uv).rgb;
  return normalize(tbn * ((2.0 * n - 1.0) * vec3f(normalScale, normalScale, 1.0)));
}

fn getNormal(tbn: mat3x3f, uv: vec2f) -> vec3f
{
  // The tbn matrix is linearly interpolated, so we need to re-normalize
  var n: vec3f = normalize(tbn[2].xyz);
#ifdef HAS_NORMALMAP
  n = getMappedNormal(
    pbr_normalSampler,
    pbr_normalSamplerSampler,
    tbn,
    pbrMaterial.normalScale,
    uv
  );
#endif

  return n;
}

fn getClearcoatNormal(tbn: mat3x3f, baseNormal: vec3f, uv: vec2f) -> vec3f
{
#ifdef HAS_CLEARCOATNORMALMAP
  return getMappedNormal(
    pbr_clearcoatNormalSampler,
    pbr_clearcoatNormalSamplerSampler,
    tbn,
    1.0,
    uv
  );
#else
  return baseNormal;
#endif
}

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
#ifdef USE_IBL
fn getIBLContribution(pbrInfo: PBRInfo, n: vec3f, reflection: vec3f) -> vec3f
{
  let mipCount: f32 = 9.0; // resolution of 512x512
  let lod: f32 = pbrInfo.perceptualRoughness * mipCount;
  // retrieve a scale and bias to F0. See [1], Figure 3
  let brdf = SRGBtoLINEAR(
    textureSampleLevel(
      pbr_brdfLUT,
      pbr_brdfLUTSampler,
      vec2f(pbrInfo.NdotV, 1.0 - pbrInfo.perceptualRoughness),
      0.0
    )
  ).rgb;
  let diffuseLight =
    SRGBtoLINEAR(
      textureSampleLevel(pbr_diffuseEnvSampler, pbr_diffuseEnvSamplerSampler, n, 0.0)
    ).rgb;
  var specularLight = SRGBtoLINEAR(
    textureSampleLevel(
      pbr_specularEnvSampler,
      pbr_specularEnvSamplerSampler,
      reflection,
      0.0
    )
  ).rgb;
#ifdef USE_TEX_LOD
  specularLight = SRGBtoLINEAR(
    textureSampleLevel(
      pbr_specularEnvSampler,
      pbr_specularEnvSamplerSampler,
      reflection,
      lod
    )
  ).rgb;
#endif

  let diffuse = diffuseLight * pbrInfo.diffuseColor * pbrMaterial.scaleIBLAmbient.x;
  let specular =
    specularLight * (pbrInfo.specularColor * brdf.x + brdf.y) * pbrMaterial.scaleIBLAmbient.y;

  return diffuse + specular;
}
#endif

// Basic Lambertian diffuse
// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
// See also [1], Equation 1
fn diffuse(pbrInfo: PBRInfo) -> vec3<f32> {
  return pbrInfo.diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
fn specularReflection(pbrInfo: PBRInfo) -> vec3<f32> {
  return pbrInfo.reflectance0 +
    (pbrInfo.reflectance90 - pbrInfo.reflectance0) *
    pow(clamp(1.0 - pbrInfo.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
fn geometricOcclusion(pbrInfo: PBRInfo) -> f32 {
  let NdotL: f32 = pbrInfo.NdotL;
  let NdotV: f32 = pbrInfo.NdotV;
  let r: f32 = pbrInfo.alphaRoughness;

  let attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
  let attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
  return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across
// the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface
// for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes
// from EPIC Games [1], Equation 3.
fn microfacetDistribution(pbrInfo: PBRInfo) -> f32 {
  let roughnessSq = pbrInfo.alphaRoughness * pbrInfo.alphaRoughness;
  let f = (pbrInfo.NdotH * roughnessSq - pbrInfo.NdotH) * pbrInfo.NdotH + 1.0;
  return roughnessSq / (M_PI * f * f);
}

fn maxComponent(value: vec3f) -> f32 {
  return max(max(value.r, value.g), value.b);
}

fn getDielectricF0(ior: f32) -> f32 {
  let clampedIor = max(ior, 1.0);
  let ratio = (clampedIor - 1.0) / (clampedIor + 1.0);
  return ratio * ratio;
}

fn normalizeDirection(direction: vec2f) -> vec2f {
  let directionLength = length(direction);
  if (directionLength > 0.0001) {
    return direction / directionLength;
  }

  return vec2f(1.0, 0.0);
}

fn rotateDirection(direction: vec2f, rotation: f32) -> vec2f {
  let s = sin(rotation);
  let c = cos(rotation);
  return vec2f(direction.x * c - direction.y * s, direction.x * s + direction.y * c);
}

fn getIridescenceTint(iridescence: f32, thickness: f32, NdotV: f32) -> vec3f {
  if (iridescence <= 0.0) {
    return vec3f(1.0);
  }

  let phase = 0.015 * thickness * pbrMaterial.iridescenceIor + (1.0 - NdotV) * 6.0;
  let thinFilmTint =
    0.5 +
    0.5 *
    cos(vec3f(phase, phase + 2.0943951, phase + 4.1887902));
  return mix(vec3f(1.0), thinFilmTint, iridescence);
}

fn getVolumeAttenuation(thickness: f32) -> vec3f {
  if (thickness <= 0.0) {
    return vec3f(1.0);
  }

  let attenuationCoefficient =
    -log(max(pbrMaterial.attenuationColor, vec3f(0.0001))) /
    max(pbrMaterial.attenuationDistance, 0.0001);
  return exp(-attenuationCoefficient * thickness);
}

fn createClearcoatPBRInfo(
  basePBRInfo: PBRInfo,
  clearcoatNormal: vec3f,
  clearcoatRoughness: f32
) -> PBRInfo {
  let perceptualRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
  let alphaRoughness = perceptualRoughness * perceptualRoughness;
  let NdotV = clamp(abs(dot(clearcoatNormal, basePBRInfo.v)), 0.001, 1.0);

  return PBRInfo(
    basePBRInfo.NdotL,
    NdotV,
    basePBRInfo.NdotH,
    basePBRInfo.LdotH,
    basePBRInfo.VdotH,
    perceptualRoughness,
    0.0,
    vec3f(0.04),
    vec3f(1.0),
    alphaRoughness,
    vec3f(0.0),
    vec3f(0.04),
    clearcoatNormal,
    basePBRInfo.v
  );
}

fn calculateClearcoatContribution(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  clearcoatNormal: vec3f,
  clearcoatFactor: f32,
  clearcoatRoughness: f32
) -> vec3f {
  if (clearcoatFactor <= 0.0) {
    return vec3f(0.0);
  }

  let clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return calculateFinalColor(clearcoatPBRInfo, lightColor) * clearcoatFactor;
}

#ifdef USE_IBL
fn calculateClearcoatIBLContribution(
  pbrInfo: PBRInfo,
  clearcoatNormal: vec3f,
  reflection: vec3f,
  clearcoatFactor: f32,
  clearcoatRoughness: f32
) -> vec3f {
  if (clearcoatFactor <= 0.0) {
    return vec3f(0.0);
  }

  let clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return getIBLContribution(clearcoatPBRInfo, clearcoatNormal, reflection) * clearcoatFactor;
}
#endif

fn calculateSheenContribution(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  sheenColor: vec3f,
  sheenRoughness: f32
) -> vec3f {
  if (maxComponent(sheenColor) <= 0.0) {
    return vec3f(0.0);
  }

  let sheenFresnel = pow(clamp(1.0 - pbrInfo.VdotH, 0.0, 1.0), 5.0);
  let sheenVisibility = mix(1.0, pbrInfo.NdotL * pbrInfo.NdotV, sheenRoughness);
  return pbrInfo.NdotL *
    lightColor *
    sheenColor *
    (0.25 + 0.75 * sheenFresnel) *
    sheenVisibility *
    (1.0 - pbrInfo.metalness);
}

fn calculateAnisotropyBoost(
  pbrInfo: PBRInfo,
  anisotropyTangent: vec3f,
  anisotropyStrength: f32
) -> f32 {
  if (anisotropyStrength <= 0.0) {
    return 1.0;
  }

  let anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  let bitangentViewAlignment = abs(dot(pbrInfo.v, anisotropyBitangent));
  return mix(1.0, 0.65 + 0.7 * bitangentViewAlignment, anisotropyStrength);
}

fn calculateMaterialLightColor(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  clearcoatNormal: vec3f,
  clearcoatFactor: f32,
  clearcoatRoughness: f32,
  sheenColor: vec3f,
  sheenRoughness: f32,
  anisotropyTangent: vec3f,
  anisotropyStrength: f32
) -> vec3f {
  let anisotropyBoost = calculateAnisotropyBoost(pbrInfo, anisotropyTangent, anisotropyStrength);
  var color = calculateFinalColor(pbrInfo, lightColor) * anisotropyBoost;
  color += calculateClearcoatContribution(
    pbrInfo,
    lightColor,
    clearcoatNormal,
    clearcoatFactor,
    clearcoatRoughness
  );
  color += calculateSheenContribution(pbrInfo, lightColor, sheenColor, sheenRoughness);
  return color;
}

fn PBRInfo_setAmbientLight(pbrInfo: ptr<function, PBRInfo>) {
  (*pbrInfo).NdotL = 1.0;
  (*pbrInfo).NdotH = 0.0;
  (*pbrInfo).LdotH = 0.0;
  (*pbrInfo).VdotH = 1.0;
}

fn PBRInfo_setDirectionalLight(pbrInfo: ptr<function, PBRInfo>, lightDirection: vec3<f32>) {
  let n = (*pbrInfo).n;
  let v = (*pbrInfo).v;
  let l = normalize(lightDirection);             // Vector from surface point to light
  let h = normalize(l + v);                      // Half vector between both l and v

  (*pbrInfo).NdotL = clamp(dot(n, l), 0.001, 1.0);
  (*pbrInfo).NdotH = clamp(dot(n, h), 0.0, 1.0);
  (*pbrInfo).LdotH = clamp(dot(l, h), 0.0, 1.0);
  (*pbrInfo).VdotH = clamp(dot(v, h), 0.0, 1.0);
}

fn PBRInfo_setPointLight(pbrInfo: ptr<function, PBRInfo>, pointLight: PointLight) {
  let light_direction = normalize(pointLight.position - fragmentInputs.pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

fn PBRInfo_setSpotLight(pbrInfo: ptr<function, PBRInfo>, spotLight: SpotLight) {
  let light_direction = normalize(spotLight.position - fragmentInputs.pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

fn calculateFinalColor(pbrInfo: PBRInfo, lightColor: vec3<f32>) -> vec3<f32> {
  // Calculate the shading terms for the microfacet specular shading model
  let F = specularReflection(pbrInfo);
  let G = geometricOcclusion(pbrInfo);
  let D = microfacetDistribution(pbrInfo);

  // Calculation of analytical lighting contribution
  let diffuseContrib = (1.0 - F) * diffuse(pbrInfo);
  let specContrib = F * G * D / (4.0 * pbrInfo.NdotL * pbrInfo.NdotV);
  // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
  return pbrInfo.NdotL * lightColor * (diffuseContrib + specContrib);
}

fn pbr_filterColor(colorUnused: vec4<f32>) -> vec4<f32> {
  let baseColorUV = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  let metallicRoughnessUV = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  let normalUV = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  let occlusionUV = getMaterialUV(pbrMaterial.occlusionUVSet, pbrMaterial.occlusionUVTransform);
  let emissiveUV = getMaterialUV(pbrMaterial.emissiveUVSet, pbrMaterial.emissiveUVTransform);
  let specularColorUV = getMaterialUV(
    pbrMaterial.specularColorUVSet,
    pbrMaterial.specularColorUVTransform
  );
  let specularIntensityUV = getMaterialUV(
    pbrMaterial.specularIntensityUVSet,
    pbrMaterial.specularIntensityUVTransform
  );
  let transmissionUV = getMaterialUV(
    pbrMaterial.transmissionUVSet,
    pbrMaterial.transmissionUVTransform
  );
  let thicknessUV = getMaterialUV(pbrMaterial.thicknessUVSet, pbrMaterial.thicknessUVTransform);
  let clearcoatUV = getMaterialUV(pbrMaterial.clearcoatUVSet, pbrMaterial.clearcoatUVTransform);
  let clearcoatRoughnessUV = getMaterialUV(
    pbrMaterial.clearcoatRoughnessUVSet,
    pbrMaterial.clearcoatRoughnessUVTransform
  );
  let clearcoatNormalUV = getMaterialUV(
    pbrMaterial.clearcoatNormalUVSet,
    pbrMaterial.clearcoatNormalUVTransform
  );
  let sheenColorUV = getMaterialUV(
    pbrMaterial.sheenColorUVSet,
    pbrMaterial.sheenColorUVTransform
  );
  let sheenRoughnessUV = getMaterialUV(
    pbrMaterial.sheenRoughnessUVSet,
    pbrMaterial.sheenRoughnessUVTransform
  );
  let iridescenceUV = getMaterialUV(
    pbrMaterial.iridescenceUVSet,
    pbrMaterial.iridescenceUVTransform
  );
  let iridescenceThicknessUV = getMaterialUV(
    pbrMaterial.iridescenceThicknessUVSet,
    pbrMaterial.iridescenceThicknessUVTransform
  );
  let anisotropyUV = getMaterialUV(
    pbrMaterial.anisotropyUVSet,
    pbrMaterial.anisotropyUVTransform
  );

  // The albedo may be defined from a base texture or a flat color
  var baseColor: vec4<f32> = pbrMaterial.baseColorFactor;
  #ifdef HAS_BASECOLORMAP
  baseColor = SRGBtoLINEAR(
    textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, baseColorUV)
  ) * pbrMaterial.baseColorFactor;
  #endif

  #ifdef ALPHA_CUTOFF
  if (baseColor.a < pbrMaterial.alphaCutoff) {
    discard;
  }
  #endif

  var color = vec3<f32>(0.0, 0.0, 0.0);
  var transmission = 0.0;

  if (pbrMaterial.unlit != 0u) {
    color = baseColor.rgb;
  } else {
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    var perceptualRoughness = pbrMaterial.metallicRoughnessValues.y;
    var metallic = pbrMaterial.metallicRoughnessValues.x;
    #ifdef HAS_METALROUGHNESSMAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    let mrSample = textureSample(
      pbr_metallicRoughnessSampler,
      pbr_metallicRoughnessSamplerSampler,
      metallicRoughnessUV
    );
    perceptualRoughness = mrSample.g * perceptualRoughness;
    metallic = mrSample.b * metallic;
    #endif
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    let tbn = getTBN(normalUV);
    let n = getNormal(tbn, normalUV);                          // normal at surface point
    let v = normalize(pbrProjection.camera - fragmentInputs.pbr_vPosition);  // Vector from surface point to camera
    let NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
    var useExtendedPBR = false;
    #ifdef USE_MATERIAL_EXTENSIONS
    useExtendedPBR =
      pbrMaterial.specularColorMapEnabled != 0 ||
      pbrMaterial.specularIntensityMapEnabled != 0 ||
      abs(pbrMaterial.specularIntensityFactor - 1.0) > 0.0001 ||
      maxComponent(abs(pbrMaterial.specularColorFactor - vec3f(1.0))) > 0.0001 ||
      abs(pbrMaterial.ior - 1.5) > 0.0001 ||
      pbrMaterial.transmissionMapEnabled != 0 ||
      pbrMaterial.transmissionFactor > 0.0001 ||
      pbrMaterial.clearcoatMapEnabled != 0 ||
      pbrMaterial.clearcoatRoughnessMapEnabled != 0 ||
      pbrMaterial.clearcoatFactor > 0.0001 ||
      pbrMaterial.clearcoatRoughnessFactor > 0.0001 ||
      pbrMaterial.sheenColorMapEnabled != 0 ||
      pbrMaterial.sheenRoughnessMapEnabled != 0 ||
      maxComponent(pbrMaterial.sheenColorFactor) > 0.0001 ||
      pbrMaterial.sheenRoughnessFactor > 0.0001 ||
      pbrMaterial.iridescenceMapEnabled != 0 ||
      pbrMaterial.iridescenceFactor > 0.0001 ||
      abs(pbrMaterial.iridescenceIor - 1.3) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.x - 100.0) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.y - 400.0) > 0.0001 ||
      pbrMaterial.anisotropyMapEnabled != 0 ||
      pbrMaterial.anisotropyStrength > 0.0001 ||
      abs(pbrMaterial.anisotropyRotation) > 0.0001 ||
      length(pbrMaterial.anisotropyDirection - vec2f(1.0, 0.0)) > 0.0001;
    #endif

    if (!useExtendedPBR) {
      let alphaRoughness = perceptualRoughness * perceptualRoughness;

      let f0 = vec3<f32>(0.04);
      var diffuseColor = baseColor.rgb * (vec3<f32>(1.0) - f0);
      diffuseColor *= 1.0 - metallic;
      let specularColor = mix(f0, baseColor.rgb, metallic);

      let reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
      let reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
      let specularEnvironmentR0 = specularColor;
      let specularEnvironmentR90 = vec3<f32>(1.0, 1.0, 1.0) * reflectance90;
      let reflection = -normalize(reflect(v, n));

      var pbrInfo = PBRInfo(
        0.0, // NdotL
        NdotV,
        0.0, // NdotH
        0.0, // LdotH
        0.0, // VdotH
        perceptualRoughness,
        metallic,
        specularEnvironmentR0,
        specularEnvironmentR90,
        alphaRoughness,
        diffuseColor,
        specularColor,
        n,
        v
      );

      #ifdef USE_LIGHTS
      PBRInfo_setAmbientLight(&pbrInfo);
      color += calculateFinalColor(pbrInfo, lighting.ambientColor);

      for (var i = 0; i < lighting.directionalLightCount; i++) {
        if (i < lighting.directionalLightCount) {
          PBRInfo_setDirectionalLight(&pbrInfo, lighting_getDirectionalLight(i).direction);
          color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color);
        }
      }

      for (var i = 0; i < lighting.pointLightCount; i++) {
        if (i < lighting.pointLightCount) {
          PBRInfo_setPointLight(&pbrInfo, lighting_getPointLight(i));
          let attenuation = getPointLightAttenuation(
            lighting_getPointLight(i),
            distance(lighting_getPointLight(i).position, fragmentInputs.pbr_vPosition)
          );
          color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color / attenuation);
        }
      }

      for (var i = 0; i < lighting.spotLightCount; i++) {
        if (i < lighting.spotLightCount) {
          PBRInfo_setSpotLight(&pbrInfo, lighting_getSpotLight(i));
          let attenuation = getSpotLightAttenuation(
            lighting_getSpotLight(i),
            fragmentInputs.pbr_vPosition
          );
          color += calculateFinalColor(pbrInfo, lighting_getSpotLight(i).color / attenuation);
        }
      }
      #endif

      #ifdef USE_IBL
      if (pbrMaterial.IBLenabled != 0) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
      #endif

      #ifdef HAS_OCCLUSIONMAP
      if (pbrMaterial.occlusionMapEnabled != 0) {
        let ao = textureSample(pbr_occlusionSampler, pbr_occlusionSamplerSampler, occlusionUV).r;
        color = mix(color, color * ao, pbrMaterial.occlusionStrength);
      }
      #endif

      var emissive = pbrMaterial.emissiveFactor;
      #ifdef HAS_EMISSIVEMAP
      if (pbrMaterial.emissiveMapEnabled != 0u) {
        emissive *= SRGBtoLINEAR(
          textureSample(pbr_emissiveSampler, pbr_emissiveSamplerSampler, emissiveUV)
        ).rgb;
      }
      #endif
      color += emissive * pbrMaterial.emissiveStrength;

      #ifdef PBR_DEBUG
      color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
      color = mix(color, vec3<f32>(metallic), pbrMaterial.scaleDiffBaseMR.z);
      color = mix(color, vec3<f32>(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
      #endif

      return vec4<f32>(pow(color, vec3<f32>(1.0 / 2.2)), baseColor.a);
    }

    var specularIntensity = pbrMaterial.specularIntensityFactor;
    #ifdef HAS_SPECULARINTENSITYMAP
    if (pbrMaterial.specularIntensityMapEnabled != 0) {
      specularIntensity *= textureSample(
        pbr_specularIntensitySampler,
        pbr_specularIntensitySamplerSampler,
        specularIntensityUV
      ).a;
    }
    #endif

    var specularFactor = pbrMaterial.specularColorFactor;
    #ifdef HAS_SPECULARCOLORMAP
    if (pbrMaterial.specularColorMapEnabled != 0) {
      specularFactor *= SRGBtoLINEAR(
        textureSample(
          pbr_specularColorSampler,
          pbr_specularColorSamplerSampler,
          specularColorUV
        )
      ).rgb;
    }
    #endif

    transmission = pbrMaterial.transmissionFactor;
    #ifdef HAS_TRANSMISSIONMAP
    if (pbrMaterial.transmissionMapEnabled != 0) {
      transmission *= textureSample(
        pbr_transmissionSampler,
        pbr_transmissionSamplerSampler,
        transmissionUV
      ).r;
    }
    #endif
    transmission = clamp(transmission * (1.0 - metallic), 0.0, 1.0);
    var thickness = max(pbrMaterial.thicknessFactor, 0.0);
    #ifdef HAS_THICKNESSMAP
    thickness *= textureSample(
      pbr_thicknessSampler,
      pbr_thicknessSamplerSampler,
      thicknessUV
    ).g;
    #endif

    var clearcoatFactor = pbrMaterial.clearcoatFactor;
    var clearcoatRoughness = pbrMaterial.clearcoatRoughnessFactor;
    #ifdef HAS_CLEARCOATMAP
    if (pbrMaterial.clearcoatMapEnabled != 0) {
      clearcoatFactor *= textureSample(
        pbr_clearcoatSampler,
        pbr_clearcoatSamplerSampler,
        clearcoatUV
      ).r;
    }
    #endif
    #ifdef HAS_CLEARCOATROUGHNESSMAP
    if (pbrMaterial.clearcoatRoughnessMapEnabled != 0) {
      clearcoatRoughness *= textureSample(
        pbr_clearcoatRoughnessSampler,
        pbr_clearcoatRoughnessSamplerSampler,
        clearcoatRoughnessUV
      ).g;
    }
    #endif
    clearcoatFactor = clamp(clearcoatFactor, 0.0, 1.0);
    clearcoatRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
    let clearcoatNormal = getClearcoatNormal(getTBN(clearcoatNormalUV), n, clearcoatNormalUV);

    var sheenColor = pbrMaterial.sheenColorFactor;
    var sheenRoughness = pbrMaterial.sheenRoughnessFactor;
    #ifdef HAS_SHEENCOLORMAP
    if (pbrMaterial.sheenColorMapEnabled != 0) {
      sheenColor *= SRGBtoLINEAR(
        textureSample(
          pbr_sheenColorSampler,
          pbr_sheenColorSamplerSampler,
          sheenColorUV
        )
      ).rgb;
    }
    #endif
    #ifdef HAS_SHEENROUGHNESSMAP
    if (pbrMaterial.sheenRoughnessMapEnabled != 0) {
      sheenRoughness *= textureSample(
        pbr_sheenRoughnessSampler,
        pbr_sheenRoughnessSamplerSampler,
        sheenRoughnessUV
      ).a;
    }
    #endif
    sheenRoughness = clamp(sheenRoughness, c_MinRoughness, 1.0);

    var iridescence = pbrMaterial.iridescenceFactor;
    #ifdef HAS_IRIDESCENCEMAP
    if (pbrMaterial.iridescenceMapEnabled != 0) {
      iridescence *= textureSample(
        pbr_iridescenceSampler,
        pbr_iridescenceSamplerSampler,
        iridescenceUV
      ).r;
    }
    #endif
    iridescence = clamp(iridescence, 0.0, 1.0);
    var iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      0.5
    );
    #ifdef HAS_IRIDESCENCETHICKNESSMAP
    iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      textureSample(
        pbr_iridescenceThicknessSampler,
        pbr_iridescenceThicknessSamplerSampler,
        iridescenceThicknessUV
      ).g
    );
    #endif

    var anisotropyStrength = clamp(pbrMaterial.anisotropyStrength, 0.0, 1.0);
    var anisotropyDirection = normalizeDirection(pbrMaterial.anisotropyDirection);
    #ifdef HAS_ANISOTROPYMAP
    if (pbrMaterial.anisotropyMapEnabled != 0) {
      let anisotropySample = textureSample(
        pbr_anisotropySampler,
        pbr_anisotropySamplerSampler,
        anisotropyUV
      ).rgb;
      anisotropyStrength *= anisotropySample.b;
      let mappedDirection = anisotropySample.rg * 2.0 - 1.0;
      if (length(mappedDirection) > 0.0001) {
        anisotropyDirection = normalize(mappedDirection);
      }
    }
    #endif
    anisotropyDirection = rotateDirection(anisotropyDirection, pbrMaterial.anisotropyRotation);
    var anisotropyTangent =
      normalize(tbn[0] * anisotropyDirection.x + tbn[1] * anisotropyDirection.y);
    if (length(anisotropyTangent) < 0.0001) {
      anisotropyTangent = normalize(tbn[0]);
    }
    let anisotropyViewAlignment = abs(dot(v, anisotropyTangent));
    perceptualRoughness = mix(
      perceptualRoughness,
      clamp(perceptualRoughness * (1.0 - 0.6 * anisotropyViewAlignment), c_MinRoughness, 1.0),
      anisotropyStrength
    );

    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    let alphaRoughness = perceptualRoughness * perceptualRoughness;

    let dielectricF0 = getDielectricF0(pbrMaterial.ior);
    var dielectricSpecularF0 = min(
      vec3f(dielectricF0) * specularFactor * specularIntensity,
      vec3f(1.0)
    );
    let iridescenceTint = getIridescenceTint(iridescence, iridescenceThickness, NdotV);
    dielectricSpecularF0 = mix(
      dielectricSpecularF0,
      dielectricSpecularF0 * iridescenceTint,
      iridescence
    );
    var diffuseColor = baseColor.rgb * (vec3f(1.0) - dielectricSpecularF0);
    diffuseColor *= (1.0 - metallic) * (1.0 - transmission);
    var specularColor = mix(dielectricSpecularF0, baseColor.rgb, metallic);

    let baseLayerEnergy = 1.0 - clearcoatFactor * 0.25;
    diffuseColor *= baseLayerEnergy;
    specularColor *= baseLayerEnergy;

    // Compute reflectance.
    let reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing
    // reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%),
    // incrementally reduce grazing reflectance to 0%.
    let reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    let specularEnvironmentR0 = specularColor;
    let specularEnvironmentR90 = vec3<f32>(1.0, 1.0, 1.0) * reflectance90;
    let reflection = -normalize(reflect(v, n));

    var pbrInfo = PBRInfo(
      0.0, // NdotL
      NdotV,
      0.0, // NdotH
      0.0, // LdotH
      0.0, // VdotH
      perceptualRoughness,
      metallic,
      specularEnvironmentR0,
      specularEnvironmentR90,
      alphaRoughness,
      diffuseColor,
      specularColor,
      n,
      v
    );

    #ifdef USE_LIGHTS
    // Apply ambient light
    PBRInfo_setAmbientLight(&pbrInfo);
    color += calculateMaterialLightColor(
      pbrInfo,
      lighting.ambientColor,
      clearcoatNormal,
      clearcoatFactor,
      clearcoatRoughness,
      sheenColor,
      sheenRoughness,
      anisotropyTangent,
      anisotropyStrength
    );

    // Apply directional light
    for (var i = 0; i < lighting.directionalLightCount; i++) {
      if (i < lighting.directionalLightCount) {
        PBRInfo_setDirectionalLight(&pbrInfo, lighting_getDirectionalLight(i).direction);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getDirectionalLight(i).color,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
      }
    }

    // Apply point light
    for (var i = 0; i < lighting.pointLightCount; i++) {
      if (i < lighting.pointLightCount) {
        PBRInfo_setPointLight(&pbrInfo, lighting_getPointLight(i));
        let attenuation = getPointLightAttenuation(
          lighting_getPointLight(i),
          distance(lighting_getPointLight(i).position, fragmentInputs.pbr_vPosition)
        );
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getPointLight(i).color / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
      }
    }

    for (var i = 0; i < lighting.spotLightCount; i++) {
      if (i < lighting.spotLightCount) {
        PBRInfo_setSpotLight(&pbrInfo, lighting_getSpotLight(i));
        let attenuation = getSpotLightAttenuation(lighting_getSpotLight(i), fragmentInputs.pbr_vPosition);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getSpotLight(i).color / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
      }
    }
    #endif

    // Calculate lighting contribution from image based lighting source (IBL)
    #ifdef USE_IBL
    if (pbrMaterial.IBLenabled != 0) {
      color += getIBLContribution(pbrInfo, n, reflection) *
        calculateAnisotropyBoost(pbrInfo, anisotropyTangent, anisotropyStrength);
      color += calculateClearcoatIBLContribution(
        pbrInfo,
        clearcoatNormal,
        -normalize(reflect(v, clearcoatNormal)),
        clearcoatFactor,
        clearcoatRoughness
      );
      color += sheenColor * pbrMaterial.scaleIBLAmbient.x * (1.0 - sheenRoughness) * 0.25;
    }
    #endif

    // Apply optional PBR terms for additional (optional) shading
    #ifdef HAS_OCCLUSIONMAP
    if (pbrMaterial.occlusionMapEnabled != 0) {
      let ao = textureSample(pbr_occlusionSampler, pbr_occlusionSamplerSampler, occlusionUV).r;
      color = mix(color, color * ao, pbrMaterial.occlusionStrength);
    }
    #endif

    var emissive = pbrMaterial.emissiveFactor;
    #ifdef HAS_EMISSIVEMAP
    if (pbrMaterial.emissiveMapEnabled != 0u) {
      emissive *= SRGBtoLINEAR(
        textureSample(pbr_emissiveSampler, pbr_emissiveSamplerSampler, emissiveUV)
      ).rgb;
    }
    #endif
    color += emissive * pbrMaterial.emissiveStrength;

    if (transmission > 0.0) {
      color = mix(color, color * getVolumeAttenuation(thickness), transmission);
    }

    // This section uses mix to override final color for reference app visualization
    // of various parameters in the lighting equation.
    #ifdef PBR_DEBUG
    // TODO: Figure out how to debug multiple lights

    // color = mix(color, F, pbr_scaleFGDSpec.x);
    // color = mix(color, vec3(G), pbr_scaleFGDSpec.y);
    // color = mix(color, vec3(D), pbr_scaleFGDSpec.z);
    // color = mix(color, specContrib, pbr_scaleFGDSpec.w);

    // color = mix(color, diffuseContrib, pbr_scaleDiffBaseMR.x);
    color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
    color = mix(color, vec3<f32>(metallic), pbrMaterial.scaleDiffBaseMR.z);
    color = mix(color, vec3<f32>(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
    #endif
  }

  let alpha = clamp(baseColor.a * (1.0 - transmission), 0.0, 1.0);
  return vec4<f32>(pow(color, vec3<f32>(1.0 / 2.2)), alpha);
}
`,_=`\
layout(std140) uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,S=`\
struct pbrProjectionUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  camera: vec3<f32>
};

@group(0) @binding(auto) var<uniform> pbrProjection: pbrProjectionUniforms;
`,R={props:{},uniforms:{},defaultUniforms:{unlit:!1,baseColorMapEnabled:!1,baseColorFactor:[1,1,1,1],normalMapEnabled:!1,normalScale:1,emissiveMapEnabled:!1,emissiveFactor:[0,0,0],metallicRoughnessValues:[1,1],metallicRoughnessMapEnabled:!1,occlusionMapEnabled:!1,occlusionStrength:1,alphaCutoffEnabled:!1,alphaCutoff:.5,IBLenabled:!1,scaleIBLAmbient:[1,1],scaleDiffBaseMR:[0,0,0,0],scaleFGDSpec:[0,0,0,0],specularColorFactor:[1,1,1],specularIntensityFactor:1,specularColorMapEnabled:!1,specularIntensityMapEnabled:!1,ior:1.5,transmissionFactor:0,transmissionMapEnabled:!1,thicknessFactor:0,attenuationDistance:1e9,attenuationColor:[1,1,1],clearcoatFactor:0,clearcoatRoughnessFactor:0,clearcoatMapEnabled:!1,clearcoatRoughnessMapEnabled:!1,sheenColorFactor:[0,0,0],sheenRoughnessFactor:0,sheenColorMapEnabled:!1,sheenRoughnessMapEnabled:!1,iridescenceFactor:0,iridescenceIor:1.3,iridescenceThicknessRange:[100,400],iridescenceMapEnabled:!1,anisotropyStrength:0,anisotropyRotation:0,anisotropyDirection:[1,0],anisotropyMapEnabled:!1,emissiveStrength:1,baseColorUVSet:0,baseColorUVTransform:[1,0,0,0,1,0,0,0,1],metallicRoughnessUVSet:0,metallicRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],normalUVSet:0,normalUVTransform:[1,0,0,0,1,0,0,0,1],occlusionUVSet:0,occlusionUVTransform:[1,0,0,0,1,0,0,0,1],emissiveUVSet:0,emissiveUVTransform:[1,0,0,0,1,0,0,0,1],specularColorUVSet:0,specularColorUVTransform:[1,0,0,0,1,0,0,0,1],specularIntensityUVSet:0,specularIntensityUVTransform:[1,0,0,0,1,0,0,0,1],transmissionUVSet:0,transmissionUVTransform:[1,0,0,0,1,0,0,0,1],thicknessUVSet:0,thicknessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatUVSet:0,clearcoatUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatRoughnessUVSet:0,clearcoatRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatNormalUVSet:0,clearcoatNormalUVTransform:[1,0,0,0,1,0,0,0,1],sheenColorUVSet:0,sheenColorUVTransform:[1,0,0,0,1,0,0,0,1],sheenRoughnessUVSet:0,sheenRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceUVSet:0,iridescenceUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceThicknessUVSet:0,iridescenceThicknessUVTransform:[1,0,0,0,1,0,0,0,1],anisotropyUVSet:0,anisotropyUVTransform:[1,0,0,0,1,0,0,0,1]},name:"pbrMaterial",firstBindingSlot:0,bindingLayout:[{name:"pbrMaterial",group:3},{name:"pbr_baseColorSampler",group:3},{name:"pbr_normalSampler",group:3},{name:"pbr_emissiveSampler",group:3},{name:"pbr_metallicRoughnessSampler",group:3},{name:"pbr_occlusionSampler",group:3},{name:"pbr_specularColorSampler",group:3},{name:"pbr_specularIntensitySampler",group:3},{name:"pbr_transmissionSampler",group:3},{name:"pbr_thicknessSampler",group:3},{name:"pbr_clearcoatSampler",group:3},{name:"pbr_clearcoatRoughnessSampler",group:3},{name:"pbr_clearcoatNormalSampler",group:3},{name:"pbr_sheenColorSampler",group:3},{name:"pbr_sheenRoughnessSampler",group:3},{name:"pbr_iridescenceSampler",group:3},{name:"pbr_iridescenceThicknessSampler",group:3},{name:"pbr_anisotropySampler",group:3}],dependencies:[m.x,{name:"ibl",firstBindingSlot:32,bindingLayout:[{name:"pbr_diffuseEnvSampler",group:2},{name:"pbr_specularEnvSampler",group:2},{name:"pbr_brdfLUT",group:2}],source:d,vs:g,fs:g},{name:"pbrProjection",bindingLayout:[{name:"pbrProjection",group:0}],source:S,vs:_,fs:_,getUniforms:e=>e,uniformTypes:{modelViewProjectionMatrix:"mat4x4<f32>",modelMatrix:"mat4x4<f32>",normalMatrix:"mat4x4<f32>",camera:"vec3<f32>"}}],source:v,vs:h,fs:b,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,HAS_SPECULARCOLORMAP:!1,HAS_SPECULARINTENSITYMAP:!1,HAS_TRANSMISSIONMAP:!1,HAS_THICKNESSMAP:!1,HAS_CLEARCOATMAP:!1,HAS_CLEARCOATROUGHNESSMAP:!1,HAS_CLEARCOATNORMALMAP:!1,HAS_SHEENCOLORMAP:!1,HAS_SHEENROUGHNESSMAP:!1,HAS_IRIDESCENCEMAP:!1,HAS_IRIDESCENCETHICKNESSMAP:!1,HAS_ANISOTROPYMAP:!1,USE_MATERIAL_EXTENSIONS:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:e=>e,uniformTypes:{unlit:"i32",baseColorMapEnabled:"i32",baseColorFactor:"vec4<f32>",normalMapEnabled:"i32",normalScale:"f32",emissiveMapEnabled:"i32",emissiveFactor:"vec3<f32>",metallicRoughnessValues:"vec2<f32>",metallicRoughnessMapEnabled:"i32",occlusionMapEnabled:"i32",occlusionStrength:"f32",alphaCutoffEnabled:"i32",alphaCutoff:"f32",specularColorFactor:"vec3<f32>",specularIntensityFactor:"f32",specularColorMapEnabled:"i32",specularIntensityMapEnabled:"i32",ior:"f32",transmissionFactor:"f32",transmissionMapEnabled:"i32",thicknessFactor:"f32",attenuationDistance:"f32",attenuationColor:"vec3<f32>",clearcoatFactor:"f32",clearcoatRoughnessFactor:"f32",clearcoatMapEnabled:"i32",clearcoatRoughnessMapEnabled:"i32",sheenColorFactor:"vec3<f32>",sheenRoughnessFactor:"f32",sheenColorMapEnabled:"i32",sheenRoughnessMapEnabled:"i32",iridescenceFactor:"f32",iridescenceIor:"f32",iridescenceThicknessRange:"vec2<f32>",iridescenceMapEnabled:"i32",anisotropyStrength:"f32",anisotropyRotation:"f32",anisotropyDirection:"vec2<f32>",anisotropyMapEnabled:"i32",emissiveStrength:"f32",IBLenabled:"i32",scaleIBLAmbient:"vec2<f32>",scaleDiffBaseMR:"vec4<f32>",scaleFGDSpec:"vec4<f32>",baseColorUVSet:"i32",baseColorUVTransform:"mat3x3<f32>",metallicRoughnessUVSet:"i32",metallicRoughnessUVTransform:"mat3x3<f32>",normalUVSet:"i32",normalUVTransform:"mat3x3<f32>",occlusionUVSet:"i32",occlusionUVTransform:"mat3x3<f32>",emissiveUVSet:"i32",emissiveUVTransform:"mat3x3<f32>",specularColorUVSet:"i32",specularColorUVTransform:"mat3x3<f32>",specularIntensityUVSet:"i32",specularIntensityUVTransform:"mat3x3<f32>",transmissionUVSet:"i32",transmissionUVTransform:"mat3x3<f32>",thicknessUVSet:"i32",thicknessUVTransform:"mat3x3<f32>",clearcoatUVSet:"i32",clearcoatUVTransform:"mat3x3<f32>",clearcoatRoughnessUVSet:"i32",clearcoatRoughnessUVTransform:"mat3x3<f32>",clearcoatNormalUVSet:"i32",clearcoatNormalUVTransform:"mat3x3<f32>",sheenColorUVSet:"i32",sheenColorUVTransform:"mat3x3<f32>",sheenRoughnessUVSet:"i32",sheenRoughnessUVTransform:"mat3x3<f32>",iridescenceUVSet:"i32",iridescenceUVTransform:"mat3x3<f32>",iridescenceThicknessUVSet:"i32",iridescenceThicknessUVTransform:"mat3x3<f32>",anisotropyUVSet:"i32",anisotropyUVTransform:"mat3x3<f32>"}};var M=r(41481),C=r(4500);function x(e,t){if(!e)throw Error(t)}class y{id;matrix=new M.Matrix4;display=!0;position=new M.Vector3;rotation=new M.Vector3;scale=new M.Vector3(1,1,1);userData={};props={};constructor(e={}){let{id:t}=e;this.id=t||(0,C.L)(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return x(3===e.length,"setPosition requires vector argument"),this.position=e,this}setRotation(e){return x(3===e.length||4===e.length,"setRotation requires vector argument"),this.rotation=e,this}setScale(e){return x(3===e.length,"setScale requires vector argument"),this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){let{position:t,rotation:r,scale:o,update:a=!0}=e;return t&&this.setPosition(t),r&&this.setRotation(r),o&&this.setScale(o),a&&this.updateMatrix(),this}updateMatrix(){if(this.matrix.identity(),this.matrix.translate(this.position),4===this.rotation.length){let e=new M.Matrix4().fromQuaternion(this.rotation);this.matrix.multiplyRight(e)}else this.matrix.rotateXYZ(this.rotation);return this.matrix.scale(this.scale),this}update({position:e,rotation:t,scale:r}={}){return e&&this.setPosition(e),t&&this.setRotation(t),r&&this.setScale(r),this.updateMatrix(),this}getCoordinateUniforms(e,t){t=t||this.matrix;let r=new M.Matrix4(e).multiplyRight(t),o=r.invert(),a=o.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:r,worldInverseMatrix:o,worldInverseTransposeMatrix:a}}_setScenegraphNodeProps(e){e?.position&&this.setPosition(e.position),e?.rotation&&this.setRotation(e.rotation),e?.scale&&this.setScale(e.scale),this.updateMatrix(),e?.matrix&&this.setMatrix(e.matrix),Object.assign(this.props,e)}}var I=r(29651);class T extends y{children;constructor(e={}){let{children:t=[]}=e=Array.isArray(e)?{children:e}:e;I.R.assert(t.every(e=>e instanceof y),"every child must an instance of ScenegraphNode"),super(e),this.children=t}getBounds(){let e=[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]];return(this.traverse((t,{worldMatrix:r})=>{let o=t.getBounds();if(!o)return;let[a,i]=o,n=new M.Vector3(a).add(i).divide([2,2,2]);r.transformAsPoint(n,n);let s=new M.Vector3(i).subtract(a).divide([2,2,2]);r.transformAsVector(s,s);for(let t=0;t<8;t++){let r=new M.Vector3(1&t?-1:1,2&t?-1:1,4&t?-1:1).multiply(s).add(n);for(let t=0;t<3;t++)e[0][t]=Math.min(e[0][t],r[t]),e[1][t]=Math.max(e[1][t],r[t])}}),Number.isFinite(e[0][0]))?e:null}destroy(){this.children.forEach(e=>e.destroy()),this.removeAll(),super.destroy()}add(...e){for(let t of e)Array.isArray(t)?this.add(...t):this.children.push(t);return this}remove(e){let t=this.children,r=t.indexOf(e);return r>-1&&t.splice(r,1),this}removeAll(){return this.children=[],this}traverse(e,{worldMatrix:t=new M.Matrix4}={}){let r=new M.Matrix4(t).multiplyRight(this.matrix);for(let t of this.children)t instanceof T?t.traverse(e,{worldMatrix:r}):e(t,{worldMatrix:r})}preorderTraversal(e,{worldMatrix:t=new M.Matrix4}={}){let r=new M.Matrix4(t).multiplyRight(this.matrix);for(let t of(e(this,{worldMatrix:r}),this.children))t instanceof T?t.preorderTraversal(e,{worldMatrix:r}):e(t,{worldMatrix:r})}}class A extends y{model;bounds=null;managedResources;constructor(e){super(e),this.model=e.model,this.managedResources=e.managedResources||[],this.bounds=e.bounds||null,this.setProps(e)}destroy(){this.model&&(this.model.destroy(),this.model=null),this.managedResources.forEach(e=>e.destroy()),this.managedResources=[]}getBounds(){return this.bounds}draw(e){return this.model.draw(e)}}var E=r(90015),L=r(62196),P=r(75638),N=r(26839),U=r(80698),V=r(89277),O=r(95972),H=r(16698);class F{id;device;factory;shaderInputs;bindings={};_uniformStore;_bindGroupCacheToken={};constructor(e,t={}){this.id=t.id||(0,C.L)("material"),this.device=e,this.factory=t.factory||new B(e,{modules:t.modules||t.shaderInputs?.getModules()||[]});let r=Object.fromEntries((t.shaderInputs?.getModules()||this.factory.modules).map(e=>[e.name,e]));for(let[e,o]of(this.shaderInputs=t.shaderInputs||new E.l(r),this._uniformStore=new L.K(this.device,this.shaderInputs.modules),Object.entries(this.shaderInputs.modules)))if(this.ownsModule(e)&&(0,H.f)(o)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.updateShaderInputs(),t.bindings&&this._replaceOwnedBindings(t.bindings)}destroy(){this._uniformStore.destroy()}clone(e={}){let t=this.factory.createMaterial({id:e.id,shaderInputs:e.shaderInputs,bindings:{...this.getResourceBindings(),...e.bindings}});return e.shaderInputs||t.setProps(this.shaderInputs.getUniformValues()),e.moduleProps&&t.setProps(e.moduleProps),t}ownsBinding(e){return this.factory.ownsBinding(e)}ownsModule(e){return this.factory.ownsModule(e)}setProps(e){this.shaderInputs.setProps(e),this.updateShaderInputs()}updateShaderInputs(){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues()),this._setOwnedBindings(this.shaderInputs.getBindingValues())&&(this._bindGroupCacheToken={})}getResourceBindings(){let e={};for(let[t,r]of Object.entries(this.bindings))D(t)||(e[t]=r);return e}getBindings(){let e={};for(let[t,r]of Object.entries(this.bindings))r instanceof O.R?r.isReady&&(e[t]=r.texture):e[t]=r;return e}getBindingsByGroup(){return this.factory.getBindingsByGroup(this.getBindings())}getBindGroupCacheKey(e){return e===w?this._bindGroupCacheToken:null}getBindingsUpdateTimestamp(){let e=0;for(let t of Object.values(this.bindings))t instanceof P.X?e=Math.max(e,t.texture.updateTimestamp):t instanceof N.h||t instanceof U.g?e=Math.max(e,t.updateTimestamp):t instanceof O.R?e=t.texture?Math.max(e,t.texture.updateTimestamp):1/0:t instanceof V.L||(e=Math.max(e,t.buffer.updateTimestamp));return e}_replaceOwnedBindings(e){this._setOwnedBindings(e)&&(this._bindGroupCacheToken={})}_setOwnedBindings(e){let t=!1;for(let[r,o]of Object.entries(e))void 0!==o&&this.ownsBinding(r)&&this.bindings[r]!==o&&(this.bindings[r]=o,t=!0);return t}}let w=3;class B{device;modules;_materialBindingNames;_materialModuleNames;constructor(e,t={}){this.device=e,this.modules=t.modules||[];let r=new E.l(Object.fromEntries(this.modules.map(e=>[e.name,e])));this._materialBindingNames=function(e){let t=new Set;for(let r of Object.values(e.modules))for(let e of r.bindingLayout||[])e.group===w&&t.add(e.name);return t}(r),this._materialModuleNames=function(e){let t=new Set;for(let r of Object.values(e.modules))r.name&&r.bindingLayout?.some(e=>e.group===w&&e.name===r.name)&&t.add(r.name);return t}(r)}createMaterial(e={}){return new F(this.device,{...e,factory:this})}getBindingNames(){return Array.from(this._materialBindingNames)}ownsBinding(e){if(this._materialBindingNames.has(e))return!0;let t=D(e);return!!t&&this._materialModuleNames.has(t)}ownsModule(e){return this._materialModuleNames.has(e)}getBindingsByGroup(e){return Object.keys(e).length>0?{[w]:e}:{}}}function D(e){return e.endsWith("Uniforms")?e.slice(0,-8):null}(o=a||(a={}))[o.POINTS=0]="POINTS",o[o.LINES=1]="LINES",o[o.LINE_LOOP=2]="LINE_LOOP",o[o.LINE_STRIP=3]="LINE_STRIP",o[o.TRIANGLES=4]="TRIANGLES",o[o.TRIANGLE_STRIP=5]="TRIANGLE_STRIP",o[o.TRIANGLE_FAN=6]="TRIANGLE_FAN",o[o.ONE=1]="ONE",o[o.SRC_ALPHA=770]="SRC_ALPHA",o[o.ONE_MINUS_SRC_ALPHA=771]="ONE_MINUS_SRC_ALPHA",o[o.FUNC_ADD=32774]="FUNC_ADD",o[o.LINEAR=9729]="LINEAR",o[o.NEAREST=9728]="NEAREST",o[o.NEAREST_MIPMAP_NEAREST=9984]="NEAREST_MIPMAP_NEAREST",o[o.LINEAR_MIPMAP_NEAREST=9985]="LINEAR_MIPMAP_NEAREST",o[o.NEAREST_MIPMAP_LINEAR=9986]="NEAREST_MIPMAP_LINEAR",o[o.LINEAR_MIPMAP_LINEAR=9987]="LINEAR_MIPMAP_LINEAR",o[o.TEXTURE_MIN_FILTER=10241]="TEXTURE_MIN_FILTER",o[o.TEXTURE_WRAP_S=10242]="TEXTURE_WRAP_S",o[o.TEXTURE_WRAP_T=10243]="TEXTURE_WRAP_T",o[o.REPEAT=10497]="REPEAT",o[o.CLAMP_TO_EDGE=33071]="CLAMP_TO_EDGE",o[o.MIRRORED_REPEAT=33648]="MIRRORED_REPEAT",o[o.UNPACK_FLIP_Y_WEBGL=37440]="UNPACK_FLIP_Y_WEBGL";let k={props:{},uniforms:{},name:"skin",bindingLayout:[{name:"skin",group:0}],dependencies:[],source:`
struct skinUniforms {
  jointMatrix: array<mat4x4<f32>, 20>,
};

@group(0) @binding(auto) var<uniform> skin: skinUniforms;

fn getSkinMatrix(weights: vec4f, joints: vec4u) -> mat4x4<f32> {
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
}
`,vs:`\

layout(std140) uniform skinUniforms {
  mat4 jointMatrix[SKIN_MAX_JOINTS];
} skin;

mat4 getSkinMatrix(vec4 weights, uvec4 joints) {
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
}

`,fs:"",defines:{SKIN_MAX_JOINTS:20},getUniforms:(e={},t)=>{let{scenegraphsFromGLTF:r}=e;if(!r?.gltf?.skins?.[0])return{jointMatrix:[]};let{inverseBindMatrices:o,joints:a,skeleton:i}=r.gltf.skins[0],n=[],s=o.value.length/16;for(let e=0;e<s;e++){let t=o.value.subarray(16*e,16*e+16);n.push(new M.Matrix4(Array.from(t)))}let l=r.gltfNodeIndexToNodeMap.get(i),c={};l.preorderTraversal((e,{worldMatrix:t})=>{c[e.id]=t});let p=new Float32Array(320);for(let e=0;e<20;++e){let t=a[e];if(void 0===t)break;let o=c[r.gltfNodeIndexToNodeMap.get(t).id],i=n[e],s=new M.Matrix4().copy(o).multiplyRight(i),l=16*e;for(let e=0;e<16;e++)p[l+e]=s[e]}return{jointMatrix:p}},uniformTypes:{jointMatrix:["mat4x4<f32>",20]}};var G=r(54338);let z=`
struct VertexInputs {
  @location(0) positions: vec3f,
#ifdef HAS_NORMALS
  @location(1) normals: vec3f,
#endif
#ifdef HAS_TANGENTS
  @location(2) TANGENT: vec4f,
#endif
#ifdef HAS_UV
  @location(3) texCoords: vec2f,
#endif
#ifdef HAS_UV_1
  @location(4) texCoords1: vec2f,
#endif
#ifdef HAS_SKIN
  @location(5) JOINTS_0: vec4u,
  @location(6) WEIGHTS_0: vec4f,
#endif
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) pbrPosition: vec3f,
  @location(1) pbrUV0: vec2f,
  @location(2) pbrUV1: vec2f,
  @location(3) pbrNormal: vec3f,
#ifdef HAS_TANGENTS
  @location(4) pbrTangent: vec4f,
#endif
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  var position = vec4f(inputs.positions, 1.0);
  var normal = vec3f(0.0, 0.0, 1.0);
  var tangent = vec4f(1.0, 0.0, 0.0, 1.0);
  var uv0 = vec2f(0.0, 0.0);
  var uv1 = vec2f(0.0, 0.0);

#ifdef HAS_NORMALS
  normal = inputs.normals;
#endif
#ifdef HAS_UV
  uv0 = inputs.texCoords;
#endif
#ifdef HAS_UV_1
  uv1 = inputs.texCoords1;
#endif
#ifdef HAS_TANGENTS
  tangent = inputs.TANGENT;
#endif
#ifdef HAS_SKIN
  let skinMatrix = getSkinMatrix(inputs.WEIGHTS_0, inputs.JOINTS_0);
  position = skinMatrix * position;
  normal = normalize((skinMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((skinMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
#endif

  let worldPosition = pbrProjection.modelMatrix * position;

#ifdef HAS_NORMALS
  normal = normalize((pbrProjection.normalMatrix * vec4f(normal, 0.0)).xyz);
#endif
#ifdef HAS_TANGENTS
  let worldTangent = normalize((pbrProjection.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz);
  outputs.pbrTangent = vec4f(worldTangent, tangent.w);
#endif

  outputs.position = pbrProjection.modelViewProjectionMatrix * position;
  outputs.pbrPosition = worldPosition.xyz / worldPosition.w;
  outputs.pbrUV0 = uv0;
  outputs.pbrUV1 = uv1;
  outputs.pbrNormal = normal;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  fragmentInputs.pbr_vUV0 = inputs.pbrUV0;
  fragmentInputs.pbr_vUV1 = inputs.pbrUV1;
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;
#ifdef HAS_TANGENTS
  let tangent = normalize(inputs.pbrTangent.xyz);
  let bitangent = normalize(cross(inputs.pbrNormal, tangent)) * inputs.pbrTangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangent, bitangent, inputs.pbrNormal);
#endif
  return pbr_filterColor(vec4f(1.0));
}
`,K=`\
#version 300 es

  // in vec4 POSITION;
  in vec4 positions;

  #ifdef HAS_NORMALS
    // in vec4 NORMAL;
    in vec4 normals;
  #endif

  #ifdef HAS_TANGENTS
    in vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    // in vec2 TEXCOORD_0;
    in vec2 texCoords;
  #endif

  #ifdef HAS_UV_1
    in vec2 texCoords1;
  #endif

  #ifdef HAS_SKIN
    in uvec4 JOINTS_0;
    in vec4 WEIGHTS_0;
  #endif

  void main(void) {
    vec4 _NORMAL = vec4(0.);
    vec4 _TANGENT = vec4(0.);
    vec2 _TEXCOORD_0 = vec2(0.);
    vec2 _TEXCOORD_1 = vec2(0.);

    #ifdef HAS_NORMALS
      _NORMAL = normals;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = texCoords;
    #endif

    #ifdef HAS_UV_1
      _TEXCOORD_1 = texCoords1;
    #endif

    vec4 pos = positions;

    #ifdef HAS_SKIN
      mat4 skinMat = getSkinMatrix(WEIGHTS_0, JOINTS_0);
      pos = skinMat * pos;
      _NORMAL = skinMat * _NORMAL;
      _TANGENT = vec4((skinMat * vec4(_TANGENT.xyz, 0.)).xyz, _TANGENT.w);
    #endif

    pbr_setPositionNormalTangentUV(pos, _NORMAL, _TANGENT, _TEXCOORD_0, _TEXCOORD_1);
    gl_Position = pbrProjection.modelViewProjectionMatrix * pos;
  }
`,j=`\
#version 300 es
  out vec4 fragmentColor;

  void main(void) {
    vec3 pos = pbr_vPosition;
    fragmentColor = pbr_filterColor(vec4(1.0));
  }
`;function $(e,t){let r=t.materialFactory||new B(e,{modules:[R]}),o={...t.parsedPPBRMaterial.uniforms};delete o.camera;let a=Object.fromEntries(Object.entries({...o,...t.parsedPPBRMaterial.bindings}).filter(([e,t])=>{var o;return r.ownsBinding(e)&&((o=t)instanceof N.h||o instanceof O.R||o instanceof V.L||o instanceof U.g||o instanceof P.X)})),i=r.createMaterial({id:t.id,bindings:a});return i.setProps({pbrMaterial:o}),i}var X=r(42528);function q(e){switch(e){case a.CLAMP_TO_EDGE:return"clamp-to-edge";case a.REPEAT:return"repeat";case a.MIRRORED_REPEAT:return"mirror-repeat";default:return}}let W=[J("baseColor","pbr_baseColorSampler","baseColorTexture",["pbrMetallicRoughness","baseColorTexture"]),J("metallicRoughness","pbr_metallicRoughnessSampler","metallicRoughnessTexture",["pbrMetallicRoughness","metallicRoughnessTexture"]),J("normal","pbr_normalSampler","normalTexture",["normalTexture"]),J("occlusion","pbr_occlusionSampler","occlusionTexture",["occlusionTexture"]),J("emissive","pbr_emissiveSampler","emissiveTexture",["emissiveTexture"]),J("specularColor","pbr_specularColorSampler","KHR_materials_specular.specularColorTexture",["extensions","KHR_materials_specular","specularColorTexture"]),J("specularIntensity","pbr_specularIntensitySampler","KHR_materials_specular.specularTexture",["extensions","KHR_materials_specular","specularTexture"]),J("transmission","pbr_transmissionSampler","KHR_materials_transmission.transmissionTexture",["extensions","KHR_materials_transmission","transmissionTexture"]),J("thickness","pbr_thicknessSampler","KHR_materials_volume.thicknessTexture",["extensions","KHR_materials_volume","thicknessTexture"]),J("clearcoat","pbr_clearcoatSampler","KHR_materials_clearcoat.clearcoatTexture",["extensions","KHR_materials_clearcoat","clearcoatTexture"]),J("clearcoatRoughness","pbr_clearcoatRoughnessSampler","KHR_materials_clearcoat.clearcoatRoughnessTexture",["extensions","KHR_materials_clearcoat","clearcoatRoughnessTexture"]),J("clearcoatNormal","pbr_clearcoatNormalSampler","KHR_materials_clearcoat.clearcoatNormalTexture",["extensions","KHR_materials_clearcoat","clearcoatNormalTexture"]),J("sheenColor","pbr_sheenColorSampler","KHR_materials_sheen.sheenColorTexture",["extensions","KHR_materials_sheen","sheenColorTexture"]),J("sheenRoughness","pbr_sheenRoughnessSampler","KHR_materials_sheen.sheenRoughnessTexture",["extensions","KHR_materials_sheen","sheenRoughnessTexture"]),J("iridescence","pbr_iridescenceSampler","KHR_materials_iridescence.iridescenceTexture",["extensions","KHR_materials_iridescence","iridescenceTexture"]),J("iridescenceThickness","pbr_iridescenceThicknessSampler","KHR_materials_iridescence.iridescenceThicknessTexture",["extensions","KHR_materials_iridescence","iridescenceThicknessTexture"]),J("anisotropy","pbr_anisotropySampler","KHR_materials_anisotropy.anisotropyTexture",["extensions","KHR_materials_anisotropy","anisotropyTexture"])],Y=new Map(W.map(e=>[e.slot,e]));function J(e,t,r,o){return{slot:e,binding:t,displayName:r,pathSegments:o,uvSetUniform:`${e}UVSet`,uvTransformUniform:`${e}UVTransform`}}function Z(e){let t=Y.get(e);if(!t)throw Error(`Unknown PBR texture transform slot ${e}`);return t}function Q(e){let t=e?.extensions?.KHR_texture_transform;return{offset:t?.offset?[t.offset[0],t.offset[1]]:[0,0],rotation:t?.rotation??0,scale:t?.scale?[t.scale[0],t.scale[1]]:[1,1]}}function ee(e){let t=e?.extensions?.KHR_texture_transform;return t?.texCoord??e?.texCoord??0}function et(e){let t=new M.Matrix3().set(1,0,0,0,1,0,e.offset[0],e.offset[1],1),r=new M.Matrix3().set(Math.cos(e.rotation),Math.sin(e.rotation),0,-Math.sin(e.rotation),Math.cos(e.rotation),0,0,0,1),o=new M.Matrix3().set(e.scale[0],0,0,0,e.scale[1],0,0,0,1);return Array.from(t.multiplyRight(r).multiplyRight(o))}function er(e,t,r,o){let i={defines:{MANUAL_SRGB:!0,SRGB_FAST_APPROXIMATION:!0},bindings:{},uniforms:{camera:[0,0,0],metallicRoughnessValues:[1,1]},parameters:{},glParameters:{},generatedTextures:[]};i.defines.USE_TEX_LOD=!0;let{imageBasedLightingEnvironment:n}=o;return n&&(i.bindings.pbr_diffuseEnvSampler=n.diffuseEnvSampler.texture,i.bindings.pbr_specularEnvSampler=n.specularEnvSampler.texture,i.bindings.pbr_brdfLUT=n.brdfLutTexture.texture,i.uniforms.IBLenabled=!0,i.uniforms.scaleIBLAmbient=[1,1]),o?.pbrDebug&&(i.defines.PBR_DEBUG=!0,i.uniforms.scaleDiffBaseMR=[0,0,0,0],i.uniforms.scaleFGDSpec=[0,0,0,0]),r.NORMAL&&(i.defines.HAS_NORMALS=!0),r.TANGENT&&o?.useTangents&&(i.defines.HAS_TANGENTS=!0),r.TEXCOORD_0&&(i.defines.HAS_UV=!0),r.TEXCOORD_1&&(i.defines.HAS_UV_1=!0),r.JOINTS_0&&r.WEIGHTS_0&&(i.defines.HAS_SKIN=!0),r.COLOR_0&&(i.defines.HAS_COLORS=!0),o?.imageBasedLightingEnvironment&&(i.defines.USE_IBL=!0),o?.lights&&(i.defines.USE_LIGHTS=!0),t&&(!1!==o.validateAttributes&&function(e,t){let r=eo(e,0);r.length>0&&!t.TEXCOORD_0&&I.R.warn(`glTF material uses ${r.join(", ")} but primitive is missing TEXCOORD_0; textured shading will sample the default UV coordinates`)();let o=eo(e,1);if(o.length>0&&!t.TEXCOORD_1&&I.R.warn(`glTF material uses ${o.join(", ")} with TEXCOORD_1 but primitive is missing TEXCOORD_1; those textures will be skipped`)(),e.unlit||e.extensions?.KHR_materials_unlit||t.NORMAL)return;let a=e.normalTexture?"lit PBR shading with normalTexture":"lit PBR shading";I.R.warn(`glTF primitive is missing NORMAL while using ${a}; shading will fall back to geometric normals`)()}(t,r),function(e,t,r,o,i){if(r.uniforms.unlit=!!(t.unlit||t.extensions?.KHR_materials_unlit),t.pbrMetallicRoughness&&function(e,t,r,o,a){t.baseColorTexture&&ea(e,t.baseColorTexture,"pbr_baseColorSampler",r,{featureOptions:{define:"HAS_BASECOLORMAP",enabledUniformName:"baseColorMapEnabled"},gltf:a,attributes:o,textureTransformSlot:"baseColor"}),r.uniforms.baseColorFactor=t.baseColorFactor||[1,1,1,1],t.metallicRoughnessTexture&&ea(e,t.metallicRoughnessTexture,"pbr_metallicRoughnessSampler",r,{featureOptions:{define:"HAS_METALROUGHNESSMAP",enabledUniformName:"metallicRoughnessMapEnabled"},gltf:a,attributes:o,textureTransformSlot:"metallicRoughness"});let{metallicFactor:i=1,roughnessFactor:n=1}=t;r.uniforms.metallicRoughnessValues=[i,n]}(e,t.pbrMetallicRoughness,r,o,i),t.normalTexture){ea(e,t.normalTexture,"pbr_normalSampler",r,{featureOptions:{define:"HAS_NORMALMAP",enabledUniformName:"normalMapEnabled"},gltf:i,attributes:o,textureTransformSlot:"normal"});let{scale:a=1}=t.normalTexture;r.uniforms.normalScale=a}if(t.occlusionTexture){ea(e,t.occlusionTexture,"pbr_occlusionSampler",r,{featureOptions:{define:"HAS_OCCLUSIONMAP",enabledUniformName:"occlusionMapEnabled"},gltf:i,attributes:o,textureTransformSlot:"occlusion"});let{strength:a=1}=t.occlusionTexture;r.uniforms.occlusionStrength=a}switch(r.uniforms.emissiveFactor=t.emissiveFactor||[0,0,0],t.emissiveTexture&&ea(e,t.emissiveTexture,"pbr_emissiveSampler",r,{featureOptions:{define:"HAS_EMISSIVEMAP",enabledUniformName:"emissiveMapEnabled"},gltf:i,attributes:o,textureTransformSlot:"emissive"}),function(e,t,r,o,i={}){var n,s,l,c,p;t&&(((n=t).KHR_materials_specular||n.KHR_materials_ior||n.KHR_materials_transmission||n.KHR_materials_volume||n.KHR_materials_clearcoat||n.KHR_materials_sheen||n.KHR_materials_iridescence||n.KHR_materials_anisotropy)&&(r.defines.USE_MATERIAL_EXTENSIONS=!0),function(e,t,r,o,a={}){t&&(t.specularColorFactor&&(r.uniforms.specularColorFactor=t.specularColorFactor),void 0!==t.specularFactor&&(r.uniforms.specularIntensityFactor=t.specularFactor),t.specularColorTexture&&ea(e,t.specularColorTexture,"pbr_specularColorSampler",r,{featureOptions:{define:"HAS_SPECULARCOLORMAP",enabledUniformName:"specularColorMapEnabled"},gltf:o,attributes:a,textureTransformSlot:"specularColor"}),t.specularTexture&&ea(e,t.specularTexture,"pbr_specularIntensitySampler",r,{featureOptions:{define:"HAS_SPECULARINTENSITYMAP",enabledUniformName:"specularIntensityMapEnabled"},gltf:o,attributes:a,textureTransformSlot:"specularIntensity"}))}(e,t.KHR_materials_specular,r,o,i),s=t.KHR_materials_ior,l=r,s?.ior!==void 0&&(l.uniforms.ior=s.ior),function(e,t,r,o,i={}){t&&(void 0!==t.transmissionFactor&&(r.uniforms.transmissionFactor=t.transmissionFactor),t.transmissionTexture&&ea(e,t.transmissionTexture,"pbr_transmissionSampler",r,{featureOptions:{define:"HAS_TRANSMISSIONMAP",enabledUniformName:"transmissionMapEnabled"},gltf:o,attributes:i,textureTransformSlot:"transmission"}),(t.transmissionFactor??0)>0||t.transmissionTexture)&&(I.R.warn("KHR_materials_transmission uses a premultiplied-alpha blending approximation and may require mesh sorting")(),r.parameters.blend=!0,r.parameters.depthWriteEnabled=!1,r.parameters.blendColorOperation="add",r.parameters.blendColorSrcFactor="one",r.parameters.blendColorDstFactor="one-minus-src-alpha",r.parameters.blendAlphaOperation="add",r.parameters.blendAlphaSrcFactor="one",r.parameters.blendAlphaDstFactor="one-minus-src-alpha",r.glParameters.blend=!0,r.glParameters.depthMask=!1,r.glParameters.blendEquation=a.FUNC_ADD,r.glParameters.blendFunc=[a.ONE,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA])}(e,t.KHR_materials_transmission,r,o,i),function(e,t,r,o,a={}){t&&(void 0!==t.thicknessFactor&&(r.uniforms.thicknessFactor=t.thicknessFactor),t.thicknessTexture&&ea(e,t.thicknessTexture,"pbr_thicknessSampler",r,{featureOptions:{define:"HAS_THICKNESSMAP"},gltf:o,attributes:a,textureTransformSlot:"thickness"}),void 0!==t.attenuationDistance&&(r.uniforms.attenuationDistance=t.attenuationDistance),t.attenuationColor&&(r.uniforms.attenuationColor=t.attenuationColor))}(e,t.KHR_materials_volume,r,o,i),function(e,t,r,o,a={}){t&&(void 0!==t.clearcoatFactor&&(r.uniforms.clearcoatFactor=t.clearcoatFactor),void 0!==t.clearcoatRoughnessFactor&&(r.uniforms.clearcoatRoughnessFactor=t.clearcoatRoughnessFactor),t.clearcoatTexture&&ea(e,t.clearcoatTexture,"pbr_clearcoatSampler",r,{featureOptions:{define:"HAS_CLEARCOATMAP",enabledUniformName:"clearcoatMapEnabled"},gltf:o,attributes:a,textureTransformSlot:"clearcoat"}),t.clearcoatRoughnessTexture&&ea(e,t.clearcoatRoughnessTexture,"pbr_clearcoatRoughnessSampler",r,{featureOptions:{define:"HAS_CLEARCOATROUGHNESSMAP",enabledUniformName:"clearcoatRoughnessMapEnabled"},gltf:o,attributes:a,textureTransformSlot:"clearcoatRoughness"}),t.clearcoatNormalTexture&&ea(e,t.clearcoatNormalTexture,"pbr_clearcoatNormalSampler",r,{featureOptions:{define:"HAS_CLEARCOATNORMALMAP"},gltf:o,attributes:a,textureTransformSlot:"clearcoatNormal"}))}(e,t.KHR_materials_clearcoat,r,o,i),function(e,t,r,o,a={}){t&&(t.sheenColorFactor&&(r.uniforms.sheenColorFactor=t.sheenColorFactor),void 0!==t.sheenRoughnessFactor&&(r.uniforms.sheenRoughnessFactor=t.sheenRoughnessFactor),t.sheenColorTexture&&ea(e,t.sheenColorTexture,"pbr_sheenColorSampler",r,{featureOptions:{define:"HAS_SHEENCOLORMAP",enabledUniformName:"sheenColorMapEnabled"},gltf:o,attributes:a,textureTransformSlot:"sheenColor"}),t.sheenRoughnessTexture&&ea(e,t.sheenRoughnessTexture,"pbr_sheenRoughnessSampler",r,{featureOptions:{define:"HAS_SHEENROUGHNESSMAP",enabledUniformName:"sheenRoughnessMapEnabled"},gltf:o,attributes:a,textureTransformSlot:"sheenRoughness"}))}(e,t.KHR_materials_sheen,r,o,i),function(e,t,r,o,a={}){t&&(void 0!==t.iridescenceFactor&&(r.uniforms.iridescenceFactor=t.iridescenceFactor),void 0!==t.iridescenceIor&&(r.uniforms.iridescenceIor=t.iridescenceIor),(void 0!==t.iridescenceThicknessMinimum||void 0!==t.iridescenceThicknessMaximum)&&(r.uniforms.iridescenceThicknessRange=[t.iridescenceThicknessMinimum??100,t.iridescenceThicknessMaximum??400]),t.iridescenceTexture&&ea(e,t.iridescenceTexture,"pbr_iridescenceSampler",r,{featureOptions:{define:"HAS_IRIDESCENCEMAP",enabledUniformName:"iridescenceMapEnabled"},gltf:o,attributes:a,textureTransformSlot:"iridescence"}),t.iridescenceThicknessTexture&&ea(e,t.iridescenceThicknessTexture,"pbr_iridescenceThicknessSampler",r,{featureOptions:{define:"HAS_IRIDESCENCETHICKNESSMAP"},gltf:o,attributes:a,textureTransformSlot:"iridescenceThickness"}))}(e,t.KHR_materials_iridescence,r,o,i),function(e,t,r,o,a={}){t&&(void 0!==t.anisotropyStrength&&(r.uniforms.anisotropyStrength=t.anisotropyStrength),void 0!==t.anisotropyRotation&&(r.uniforms.anisotropyRotation=t.anisotropyRotation),t.anisotropyTexture&&ea(e,t.anisotropyTexture,"pbr_anisotropySampler",r,{featureOptions:{define:"HAS_ANISOTROPYMAP",enabledUniformName:"anisotropyMapEnabled"},gltf:o,attributes:a,textureTransformSlot:"anisotropy"}))}(e,t.KHR_materials_anisotropy,r,o,i),c=t.KHR_materials_emissive_strength,p=r,c?.emissiveStrength!==void 0&&(p.uniforms.emissiveStrength=c.emissiveStrength))}(e,t.extensions,r,i,o),t.alphaMode||"OPAQUE"){case"OPAQUE":break;case"MASK":{let{alphaCutoff:e=.5}=t;r.defines.ALPHA_CUTOFF=!0,r.uniforms.alphaCutoffEnabled=!0,r.uniforms.alphaCutoff=e;break}case"BLEND":var n;I.R.warn("glTF BLEND alphaMode might not work well because it requires mesh sorting")(),(n=r).parameters.blend=!0,n.parameters.blendColorOperation="add",n.parameters.blendColorSrcFactor="src-alpha",n.parameters.blendColorDstFactor="one-minus-src-alpha",n.parameters.blendAlphaOperation="add",n.parameters.blendAlphaSrcFactor="one",n.parameters.blendAlphaDstFactor="one-minus-src-alpha",n.glParameters.blend=!0,n.glParameters.blendEquation=a.FUNC_ADD,n.glParameters.blendFunc=[a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA]}}(e,t,i,r,o.gltf)),i}function eo(e,t){let r=[];for(let o of W){let a=function(e,t){let r=e;for(let e of t)if(!(r=r?.[e]))return null;return r}(e,o.pathSegments);a&&ee(a)===t&&r.push(o.displayName)}return r}function ea(e,t,r,o,i={}){let n,{featureOptions:s={},gltf:l,attributes:c={},textureTransformSlot:p}=i,{define:u,enabledUniformName:f}=s,m=ee(t);if(m>1)return void I.R.warn(`Skipping ${String(r)} because ${m} is not supported; only TEXCOORD_0 and TEXCOORD_1 are currently available`)();if(1===m&&!c.TEXCOORD_1)return void I.R.warn(`Skipping ${String(r)} because it requires TEXCOORD_1 but the primitive does not provide TEXCOORD_1`)();let d=function(e,t){if(e.texture||void 0===e.index||!t?.textures)return e;let r=t.textures[e.index];return r?"texture"in r&&r.texture?{...r,...e,texture:r.texture}:"source"in r?{...e,texture:r}:e:e}(t,l),g=d.texture?.source?.image;if(!g)return void I.R.warn(`Skipping unresolved glTF texture for ${String(r)}`)();let h={wrapS:10497,wrapT:10497,minFilter:9729,magFilter:9729,...d?.texture?.sampler},b={id:d.uniformName||d.id,sampler:{addressModeU:q(h.wrapS),addressModeV:q(h.wrapT),magFilter:function(e){switch(e){case a.NEAREST:return"nearest";case a.LINEAR:return"linear";default:return}}(h.magFilter),...function(e){switch(e){case a.NEAREST:return{minFilter:"nearest"};case a.LINEAR:return{minFilter:"linear"};case a.NEAREST_MIPMAP_NEAREST:return{minFilter:"nearest",mipmapFilter:"nearest"};case a.LINEAR_MIPMAP_NEAREST:return{minFilter:"linear",mipmapFilter:"nearest"};case a.NEAREST_MIPMAP_LINEAR:return{minFilter:"nearest",mipmapFilter:"linear"};case a.LINEAR_MIPMAP_LINEAR:return{minFilter:"linear",mipmapFilter:"linear"};default:return{}}}(h.minFilter)}};if(g.compressed)n=function(e,t,r){let o;if(0===(o=Array.isArray(t.data)&&t.data[0]?.data?t.data:"mipmaps"in t&&Array.isArray(t.mipmaps)?t.mipmaps:[]).length||!o[0]?.data)return I.R.warn("createCompressedTexture: compressed image has no valid mip levels, creating fallback")(),ei(e,r);let a=o[0],i=a.width??t.width??0,n=a.height??t.height??0;if(i<=0||n<=0)return I.R.warn("createCompressedTexture: base level has invalid dimensions, creating fallback")(),ei(e,r);let s=en(a);if(!s)return I.R.warn("createCompressedTexture: compressed image has no textureFormat, creating fallback")(),ei(e,r);let l=function(e,t,r){let{blockWidth:o=1,blockHeight:a=1}=X.vz.getInfo(r),i=1;for(let r=1;;r++){let n=Math.max(1,e>>r),s=Math.max(1,t>>r);if(n<o||s<a)break;i++}return i}(i,n,s),c=Math.min(o.length,l),p=1;for(let e=1;e<c;e++){let t=o[e];if(!t.data||t.width<=0||t.height<=0){I.R.warn(`createCompressedTexture: mip level ${e} has invalid data/dimensions, truncating`)();break}let r=en(t);if(r&&r!==s){I.R.warn(`createCompressedTexture: mip level ${e} format '${r}' differs from base '${s}', truncating`)();break}let a=Math.max(1,i>>e),l=Math.max(1,n>>e);if(t.width!==a||t.height!==l){I.R.warn(`createCompressedTexture: mip level ${e} dimensions ${t.width}x${t.height} don't match expected ${a}x${l}, truncating`)();break}p++}let u=e.createTexture({...r,format:s,usage:U.g.TEXTURE|U.g.COPY_DST,width:i,height:n,mipLevels:p,data:a.data});for(let e=1;e<p;e++)u.writeData(o[e].data,{width:o[e].width,height:o[e].height,mipLevel:e});return u}(e,g,b);else{let{width:t,height:r}=e.getExternalImageSize(g);n=e.createTexture({...b,width:t,height:r,data:g})}if(o.bindings[r]=n,u&&(o.defines[u]=!0),f&&(o.uniforms[f]=!0),p){let e=Z(p);o.uniforms[e.uvSetUniform]=m,o.uniforms[e.uvTransformUniform]=et(Q(t))}o.generatedTextures.push(n)}function ei(e,t){return e.createTexture({...t,format:"rgba8unorm",width:1,height:1,mipLevels:1})}function en(e){return e.textureFormat}let es={modelOptions:{},pbrDebug:!1,imageBasedLightingEnvironment:void 0,lights:!0,useTangents:!1,useByteColors:!0};var el=r(55611);function ec(e){return e.transformAsPoint([0,0,0])}function ep(e){return e.transformDirection([0,0,-1])}function eu(e,{input:t,interpolation:r,output:o},a){let i=t[t.length-1];if(!Number.isFinite(i)||i<=0)return o[0]||null;let n=e%i,s=t.findIndex(e=>e>=n);if(s<0)return o[o.length-1]||null;let l=Math.max(0,s-1),c=t[l],p=t[s];switch(r){case"STEP":return o[l];case"LINEAR":if(p>c)return function(e,t,r,o){if("rotation"===e)return new M.Quaternion().slerp({start:t,target:r,ratio:o});let a=[];for(let e=0;e<t.length;e++)a[e]=o*r[e]+(1-o)*t[e];return a}(a,o[l],o[s],(n-c)/(p-c));return o[l]||null;case"CUBICSPLINE":if(p>c){let e=o[3*l+1],t=o[3*l+2];return function({p0:e,outTangent0:t,inTangent1:r,p1:o,tDiff:a,ratio:i}){let n=[];for(let s=0;s<e.length;s++){let l=t[s]*a,c=r[s]*a;n[s]=(2*Math.pow(i,3)-3*Math.pow(i,2)+1)*e[s]+(Math.pow(i,3)-2*Math.pow(i,2)+i)*l+(-2*Math.pow(i,3)+3*Math.pow(i,2))*o[s]+(Math.pow(i,3)-Math.pow(i,2))*c}return n}({p0:e,outTangent0:t,inTangent1:o[3*s+0],p1:o[3*s+1],tDiff:p-c,ratio:(n-c)/(p-c)})}return o[3*l+1]||null;default:return I.R.warn(`Interpolation ${r} not supported`)(),null}}class ef{animation;gltfNodeIdToNodeMap;materials;startTime=0;playing=!0;speed=1;materialTextureTransformState=new Map;constructor(e){if(this.animation=e.animation,this.gltfNodeIdToNodeMap=e.gltfNodeIdToNodeMap,this.materials=e.materials||[],this.animation.name||="unnamed",Object.assign(this,e),this.animation.channels.some(e=>"node"!==e.type)&&!this.materials.length)throw Error(`Animation ${this.animation.name} targets materials, but GLTFAnimator was created without a materials array`)}setTime(e){if(!this.playing)return;let t=(e/1e3-this.startTime)*this.speed;this.animation.channels.forEach(e=>{var r,o,a,i,n,s,l,c;let p,u,f,m;if("node"===e.type){let{sampler:r,targetNodeId:o,path:a}=e,i=this.gltfNodeIdToNodeMap.get(o);if(!i)throw Error(`Cannot find animation target node ${o}`);!function(e,{input:t,interpolation:r,output:o},a,i){let n=eu(e,{input:t,interpolation:r,output:o},i);n&&function(e,t,r){switch(t){case"translation":return e.setPosition(r).updateMatrix();case"rotation":return e.setRotation(r).updateMatrix();case"scale":return e.setScale(r).updateMatrix();default:return I.R.warn(`Bad animation path ${t}`)()}}(a,i,n)}(t,r,i,a);return}let d=this.materials[e.targetMaterialIndex];if(!d)throw Error(`Cannot find animation target material ${e.targetMaterialIndex} for ${e.pointer}`);let g=eu(t,e.sampler);g&&("material"===e.type?(r=d,o=e,a=g,m=void 0!==o.component?{[o.property]:(s=(i=r,n=o.property,p=i.shaderInputs.getUniformValues(),Array.isArray(u=p.pbrMaterial?.[n])?[...u]:[]),l=o.component,c=a[0],(f=[...s])[l]=c,f)}:{[o.property]:1===a.length?a[0]:a},r.setProps({pbrMaterial:m})):function(e,t,r,o){var a,i,n,s;let l,c,p,u,f,m=Z(t.textureSlot),d=(i=o,n=e,s=t,(c=(l=i.get(n)||{})[s.textureSlot])||(c={offset:[...s.baseTransform.offset],rotation:s.baseTransform.rotation,scale:[...s.baseTransform.scale]},l[s.textureSlot]=c,i.set(n,l)),c);switch(t.path){case"offset":void 0!==t.component?d.offset[t.component]=r[0]:d.offset=[r[0],r[1]];break;case"rotation":d.rotation=r[0];break;case"scale":void 0!==t.component?d.scale[t.component]=r[0]:d.scale=[r[0],r[1]]}e.setProps({pbrMaterial:{[m.uvTransformUniform]:(a=t.baseTransform,p=new M.Matrix3(et(a)),u=new M.Matrix3(et(d)),f=new M.Matrix3(p).invert(),Array.from(u.multiplyRight(f)))}})}(d,e,g,this.materialTextureTransformState))})}}class em{animations;constructor(e){this.animations=e.animations.map((t,r)=>{let o=t.name||`Animation-${r}`;return new ef({gltfNodeIdToNodeMap:e.gltfNodeIdToNodeMap,materials:e.materials,animation:{name:o,channels:t.channels}})})}animate(e){I.R.warn("GLTFAnimator#animate is deprecated. Use GLTFAnimator#setTime instead")(),this.setTime(e)}setTime(e){this.animations.forEach(t=>t.setTime(e))}getAnimations(){return this.animations}}let ed={supportLevel:"none",comment:"Not currently listed in the luma.gl glTF extension support registry."},eg={KHR_draco_mesh_compression:{supportLevel:"built-in",comment:"Decoded by loaders.gl before luma.gl builds the scenegraph."},EXT_meshopt_compression:{supportLevel:"built-in",comment:"Meshopt-compressed primitives are decoded during load."},KHR_mesh_quantization:{supportLevel:"built-in",comment:"Quantized accessors are unpacked before geometry creation."},KHR_lights_punctual:{supportLevel:"built-in",comment:"Parsed into luma.gl Light objects."},KHR_materials_unlit:{supportLevel:"built-in",comment:"Unlit materials bypass the default lighting path."},KHR_materials_emissive_strength:{supportLevel:"built-in",comment:"Applied by the stock PBR shader."},KHR_texture_basisu:{supportLevel:"built-in",comment:"BasisU / KTX2 textures pass through when the device supports them."},KHR_texture_transform:{supportLevel:"built-in",comment:"UV transforms are applied during load."},EXT_texture_webp:{supportLevel:"loader-only",comment:"Texture source is resolved during load; final support depends on browser and device decode support."},EXT_texture_avif:{supportLevel:"loader-only",comment:"Texture source is resolved during load; final support depends on browser and device decode support."},KHR_materials_specular:{supportLevel:"built-in",comment:"The stock shader now applies specular factors and textures to the dielectric F0 term."},KHR_materials_ior:{supportLevel:"built-in",comment:"The stock shader now drives dielectric reflectance from the glTF IOR value."},KHR_materials_transmission:{supportLevel:"built-in",comment:"The stock shader now applies transmission to the base layer and exposes transparency through alpha, without a scene-color refraction buffer."},KHR_materials_volume:{supportLevel:"built-in",comment:"Thickness and attenuation now tint transmitted light in the stock shader."},KHR_materials_clearcoat:{supportLevel:"built-in",comment:"The stock shader now adds a secondary clearcoat specular lobe."},KHR_materials_sheen:{supportLevel:"built-in",comment:"The stock shader now adds a sheen lobe for cloth-like materials."},KHR_materials_iridescence:{supportLevel:"built-in",comment:"The stock shader now tints specular response with a view-dependent thin-film iridescence approximation."},KHR_materials_anisotropy:{supportLevel:"built-in",comment:"The stock shader now shapes highlights and IBL response with an anisotropy-direction approximation."},KHR_materials_pbrSpecularGlossiness:{supportLevel:"loader-only",comment:"Extension data can be loaded, but it is not translated into the default metallic-roughness material path."},KHR_materials_variants:{supportLevel:"loader-only",comment:"Variant metadata can be loaded, but applications must choose and apply variants."},EXT_mesh_gpu_instancing:{supportLevel:"none",comment:"GPU instancing data is not yet converted into luma.gl instanced draw setup."},KHR_node_visibility:{supportLevel:"none",comment:"Node-visibility animations and toggles are not mapped onto runtime scenegraph state."},KHR_animation_pointer:{supportLevel:"parsed-and-wired",comment:"Selected node TRS, material factor, and KHR_texture_transform offset/rotation/scale pointers are wired to runtime updates; unsupported targets are skipped."},KHR_materials_diffuse_transmission:{supportLevel:"none",comment:"Diffuse-transmission shading is not implemented in the stock PBR shader."},KHR_materials_dispersion:{supportLevel:"none",comment:"Chromatic dispersion is not implemented in the stock PBR shader."},KHR_materials_volume_scatter:{supportLevel:"none",comment:"Volume scattering is not implemented in the stock PBR shader."},KHR_xmp:{supportLevel:"none",comment:"Metadata payloads remain in the loaded glTF, but luma.gl does not interpret them."},KHR_xmp_json_ld:{supportLevel:"none",comment:"Metadata is preserved in the glTF, but luma.gl does not interpret it."},EXT_lights_image_based:{supportLevel:"none",comment:"Use loadPBREnvironment() or custom environment setup instead."},EXT_texture_video:{supportLevel:"none",comment:"Video textures are not created automatically by the stock pipeline."},MSFT_lod:{supportLevel:"none",comment:"Level-of-detail switching is not implemented in the stock scenegraph loader."}};function eh(e,t=[]){for(let r of t)e.add(r)}let eb={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},ev={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};function e_(e){let t=ev[e.componentType],r=eb[e.type],o=r*e.count,{buffer:a,byteOffset:i=0}=e.bufferView?.data??{};return{typedArray:new t(a,i+(e.byteOffset||0),o),components:r}}function eS(e){switch(e){case"translation":case"rotation":case"scale":case"weights":return e;default:return null}}function eR(e){let t=eM(e);if(t){let e=eg[t]||null;if(e?.supportLevel==="none")return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`no runtime target exists for material property "${e.join("/")}"`}function eM(e){let t=e.indexOf("extensions"),r=e[t+1];return t>=0&&r?r:null}function eC(e,t){I.R.warn(`KHR_animation_pointer target ${e} will be skipped because ${t}`)()}function ex(e,t){if(!e)throw Error(t)}function ey(e){if(!e)return{bounds:null,center:[0,0,0],size:[0,0,0],radius:.5,recommendedOrbitDistance:1};let t=[[e[0][0],e[0][1],e[0][2]],[e[1][0],e[1][1],e[1][2]]],r=[t[1][0]-t[0][0],t[1][1]-t[0][1],t[1][2]-t[0][2]],o=[t[0][0]+.5*r[0],t[0][1]+.5*r[1],t[0][2]+.5*r[2]],a=.5*Math.max(r[0],r[1],r[2]),i=Math.max(.5*Math.hypot(r[0],r[1],r[2]),.001);return{bounds:t,center:o,size:r,radius:i,recommendedOrbitDistance:Math.max(Math.max(a,.001)/Math.tan(Math.PI/6)*1.15,1.1*i)}}var eI=r(77933),eT=r(68986);async function eA(e){let t=[];return e.scenes.forEach(e=>{e.traverse(e=>{})}),await eE(()=>t.some(e=>!e.loaded))}async function eE(e){for(;e();)await new Promise(e=>requestAnimationFrame(e))}var eL=r(53439);let eP=Math.PI/180,eN=new Float32Array(16),eU=new Float32Array(12);function eV(e,t,r){let o=t[0]*eP,a=t[1]*eP,i=t[2]*eP,n=Math.sin(i),s=Math.sin(o),l=Math.sin(a),c=Math.cos(i),p=Math.cos(o),u=Math.cos(a),f=r[0],m=r[1],d=r[2];e[0]=f*u*p,e[1]=f*l*p,e[2]=-(f*s),e[3]=m*(-l*c+u*s*n),e[4]=m*(u*c+l*s*n),e[5]=m*p*n,e[6]=d*(l*n+u*s*c),e[7]=d*(-u*n+l*s*c),e[8]=d*p*c}function eO(e){return e[0]=e[0],e[1]=e[1],e[2]=e[2],e[3]=e[4],e[4]=e[5],e[5]=e[6],e[6]=e[8],e[7]=e[9],e[8]=e[10],e[9]=e[12],e[10]=e[13],e[11]=e[14],e.subarray(0,12)}let eH={size:12,accessor:["getOrientation","getScale","getTranslation","getTransformMatrix"],shaderAttributes:{instanceModelMatrixCol0:{size:3,elementOffset:0},instanceModelMatrixCol1:{size:3,elementOffset:3},instanceModelMatrixCol2:{size:3,elementOffset:6},instanceTranslation:{size:3,elementOffset:9}},update(e,{startRow:t,endRow:r}){let{data:o,getOrientation:a,getScale:i,getTranslation:n,getTransformMatrix:s}=this.props,l=Array.isArray(s),c=l&&16===s.length,p=Array.isArray(i),u=Array.isArray(a),f=Array.isArray(n),m=c||!l&&!!s(o[0]);m?e.constant=c:e.constant=u&&p&&f;let d=e.value;if(e.constant){let t;m?(eN.set(s),t=eO(eN)):(eV(t=eU,a,i),t.set(n,9)),e.value=new Float32Array(t)}else{let l=t*e.size,{iterable:g,objectInfo:h}=(0,eL.X)(o,t,r);for(let e of g){let t;(h.index++,m)?(eN.set(c?s:s(e,h)),t=eO(eN)):(eV(t=eU,u?a:a(e,h),p?i:i(e,h)),t.set(f?n:n(e,h),9)),d[l++]=t[0],d[l++]=t[1],d[l++]=t[2],d[l++]=t[3],d[l++]=t[4],d[l++]=t[5],d[l++]=t[6],d[l++]=t[7],d[l++]=t[8],d[l++]=t[9],d[l++]=t[10],d[l++]=t[11]}}}};function eF(e,t){return"cartesian"===t||"meter-offsets"===t||"default"===t&&!e.isGeospatial}let ew=`\
layout(std140) uniform scenegraphUniforms {
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  mat4 sceneModelMatrix;
  bool composeModelMatrix;
} scenegraph;
`,eB={name:"scenegraph",vs:ew,fs:ew,uniformTypes:{sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",sceneModelMatrix:"mat4x4<f32>",composeModelMatrix:"f32"}},eD=`\
#version 300 es
#define SHADER_NAME scenegraph-layer-vertex-shader
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
in vec3 instancePickingColors;
in vec3 instanceModelMatrixCol0;
in vec3 instanceModelMatrixCol1;
in vec3 instanceModelMatrixCol2;
in vec3 instanceTranslation;
in vec3 positions;
#ifdef HAS_UV
in vec2 texCoords;
#endif
#ifdef LIGHTING_PBR
#ifdef HAS_NORMALS
in vec3 normals;
#endif
#endif
out vec4 vColor;
#ifndef LIGHTING_PBR
#ifdef HAS_UV
out vec2 vTEXCOORD_0;
#endif
#endif
void main(void) {
#if defined(HAS_UV) && !defined(LIGHTING_PBR)
vTEXCOORD_0 = texCoords;
geometry.uv = texCoords;
#endif
geometry.worldPosition = instancePositions;
geometry.pickingColor = instancePickingColors;
mat3 instanceModelMatrix = mat3(instanceModelMatrixCol0, instanceModelMatrixCol1, instanceModelMatrixCol2);
vec3 normal = vec3(0.0, 0.0, 1.0);
#ifdef LIGHTING_PBR
#ifdef HAS_NORMALS
normal = instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4(normals, 0.0)).xyz;
#endif
#endif
float originalSize = project_size_to_pixel(scenegraph.sizeScale);
float clampedSize = clamp(originalSize, scenegraph.sizeMinPixels, scenegraph.sizeMaxPixels);
vec3 pos = (instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4(positions, 1.0)).xyz) * scenegraph.sizeScale * (clampedSize / originalSize) + instanceTranslation;
if(scenegraph.composeModelMatrix) {
DECKGL_FILTER_SIZE(pos, geometry);
geometry.normal = project_normal(normal);
geometry.worldPosition += pos;
gl_Position = project_position_to_clipspace(pos + instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
}
else {
pos = project_size(pos);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, pos, geometry.position);
geometry.normal = project_normal(normal);
}
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
#ifdef LIGHTING_PBR
pbr_vPosition = geometry.position.xyz;
#ifdef HAS_NORMALS
pbr_vNormal = geometry.normal;
#endif
#ifdef HAS_UV
pbr_vUV0 = texCoords;
#else
pbr_vUV0 = vec2(0., 0.);
#endif
pbr_vUV1 = vec2(0., 0.);
geometry.uv = pbr_vUV0;
#endif
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,ek=`\
#version 300 es
#define SHADER_NAME scenegraph-layer-fragment-shader
in vec4 vColor;
out vec4 fragColor;
#ifndef LIGHTING_PBR
#if defined(HAS_UV) && defined(HAS_BASECOLORMAP)
in vec2 vTEXCOORD_0;
uniform sampler2D pbr_baseColorSampler;
#endif
#endif
void main(void) {
#ifdef LIGHTING_PBR
fragColor = vColor * pbr_filterColor(vec4(0));
geometry.uv = pbr_vUV0;
#else
#if defined(HAS_UV) && defined(HAS_BASECOLORMAP)
fragColor = vColor * texture(pbr_baseColorSampler, vTEXCOORD_0);
geometry.uv = vTEXCOORD_0;
#else
fragColor = vColor;
#endif
#endif
fragColor.a *= layer.opacity;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,eG=[255,255,255,255],ez={scenegraph:{type:"object",value:null,async:!0},getScene:e=>e&&e.scenes?"object"==typeof e.scene?e.scene:e.scenes[e.scene||0]:e,getAnimator:e=>e&&e.animator,_animations:null,onFirstDraw:{type:"function",value:()=>{}},sizeScale:{type:"number",value:1,min:0},sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},getPosition:{type:"accessor",value:e=>e.position},getColor:{type:"accessor",value:eG},_lighting:"flat",_imageBasedLightingEnvironment:void 0,getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},loaders:[eI.B]};class eK extends p.A{getShaders(){let e,t={};"pbr"===this.props._lighting?(e=R,t.LIGHTING_PBR=1):e={name:"pbrMaterial"};let r=[u.A,f.A,eB,e];return super.getShaders({defines:t,vs:eD,fs:ek,modules:r})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),accessor:"getPosition",transition:!0},instanceColors:{type:"unorm8",size:this.props.colorFormat.length,accessor:"getColor",defaultValue:eG,transition:!0},instanceModelMatrix:eH})}updateState(e){super.updateState(e);let{props:t,oldProps:r}=e;t.scenegraph!==r.scenegraph?this._updateScenegraph():t._animations!==r._animations&&this._applyAnimationsProp(this.state.animator,t._animations)}finalizeState(e){super.finalizeState(e),this._destroyScenegraphAssets()}get isLoaded(){return!!(this.state?.scenegraph&&super.isLoaded)}_updateScenegraph(){let e=this.props,{device:t}=this.context,r=null;if(e.scenegraph instanceof y)r={scenes:[e.scenegraph]};else if(e.scenegraph&&"object"==typeof e.scenegraph){let o=e.scenegraph,n=function(e,t,r){var o;let n,s,l,c,{scenes:p,materials:u,gltfMeshIdToNodeMap:f,gltfNodeIdToNodeMap:m,gltfNodeIndexToNodeMap:d}=function(e,t,r={}){let o={...es,...r},n=new B(e,{modules:[R]}),s=(t.materials||[]).map((r,a)=>{var i,s;return $(e,{id:(i=r,s=a,i.name||i.id||`material-${s}`),parsedPPBRMaterial:er(e,r,{},{...o,gltf:t,validateAttributes:!1}),materialFactory:n})}),l=new Map;(t.materials||[]).forEach((e,t)=>{l.set(e.id,s[t])});let c=new Map;t.meshes.forEach((r,n)=>{var s,p,u,f,m;let d,g=(s=e,p=r,u=t,f=l,m=o,d=(p.primitives||[]).map((e,t)=>(function({device:e,gltfPrimitive:t,primitiveIndex:r,gltfMesh:o,gltf:n,gltfMaterialIdToMaterialMap:s,options:l}){let c=t.name||`${o.name||o.id}-primitive-${r}`,p=function(e){switch(e){case a.POINTS:return"point-list";case a.LINES:return"line-list";case a.LINE_STRIP:return"line-strip";case a.TRIANGLES:return"triangle-list";case a.TRIANGLE_STRIP:return"triangle-strip";default:throw Error(String(e))}}(t.mode??4),u=t.indices?t.indices.count:function(e){let t=1/0;for(let r of Object.values(e))if(r){let{value:e,size:o,components:a}=r,i=o??a;e?.length!==void 0&&i>=1&&(t=Math.min(t,e.length/i))}if(!Number.isFinite(t))throw Error("Could not determine vertex count from attributes");return t}(t.attributes),f=function(e,t,r){let o={};for(let[e,r]of Object.entries(t.attributes)){let{components:t,size:a,value:i,normalized:n}=r;o[e]={size:a??t,value:i,normalized:n}}return new i.V({id:e,topology:r,indices:t.indices?.value,attributes:o})}(c,t,p),m=er(e,t.material,f.attributes,{...l,gltf:n}),d=function(e,t){let{id:r,geometry:o,parsedPPBRMaterial:a,vertexCount:i,modelOptions:n={}}=t;I.R.info(4,"createGLTFModel defines: ",a.defines)();let s={id:r,source:z,vs:K,fs:j,geometry:o,topology:o.topology,vertexCount:i,modules:[R,k],...n,defines:{...a.defines,...n.defines},parameters:{depthWriteEnabled:!0,depthCompare:"less",depthFormat:"depth24plus",cullMode:"back",...a.parameters,...n.parameters}},l=t.material||$(e,{id:r?`${r}-material`:void 0,parsedPPBRMaterial:a});s.material=l;let c=new G.K(e,s),p={...a.uniforms,...n.uniforms,...a.bindings,...n.bindings},u=function(e,t,r){let o=new Map;for(let t of e){for(let e of Object.keys(t.uniformTypes||{}))o.set(e,t.name);for(let e of t.bindingLayout||[])o.set(e.name,t.name)}let a={};for(let[e,i]of Object.entries(r)){if(void 0===i)continue;let r=o.get(e);!r||t.ownsModule(r)||(a[r]||={},a[r][e]=i)}return a}(c.shaderInputs.getModules(),l,p);return c.shaderInputs.setProps(u),new A({managedResources:[],model:c})}(e,{id:c,geometry:f,material:t.material&&s.get(t.material.id)||null,parsedPPBRMaterial:m,modelOptions:l.modelOptions,vertexCount:u});return d.bounds=[t.attributes.POSITION.min,t.attributes.POSITION.max],d})({device:s,gltfPrimitive:e,primitiveIndex:t,gltfMesh:p,gltf:u,gltfMaterialIdToMaterialMap:f,options:m})),new T({id:p.name||p.id,children:d}));c.set(r.id,g)});let p=new Map,u=new Map;return t.nodes.forEach((e,t)=>{var r;let o=new T({id:(r=e).name||r.id,children:[],matrix:r.matrix,position:r.translation,rotation:r.rotation,scale:r.scale});p.set(t,o),u.set(e.id,o)}),t.nodes.forEach((e,t)=>{if(p.get(t).add((e.children??[]).map(({id:e})=>{let r=u.get(e);if(!r)throw Error(`Cannot find child ${e} of node ${t}`);return r})),e.mesh){let r=c.get(e.mesh.id);if(!r)throw Error(`Cannot find mesh child ${e.mesh.id} of node ${t}`);p.get(t).add(r)}}),{scenes:t.scenes.map(e=>{let t=(e.nodes||[]).map(({id:t})=>{let r=u.get(t);if(!r)throw Error(`Cannot find child ${t} of scene ${e.name||e.id}`);return r});return new T({id:e.name||e.id,children:t})}),materials:s,gltfMeshIdToNodeMap:c,gltfNodeIdToNodeMap:u,gltfNodeIndexToNodeMap:p}}(e,t,r),g=new em({animations:(s=t.animations||[],l=new Map,c=new Map,s.flatMap((e,r)=>{let o=e.name||`Animation-${r}`,a=new Map,i=e.channels.flatMap(({sampler:r,target:o})=>{let i=a.get(r);if(!i){let o=e.samplers[r];if(!o)throw Error(`Cannot find animation sampler ${r}`);let{input:n,interpolation:s="LINEAR",output:p}=o;i={input:function(e,t){if(t.has(e))return t.get(e);let{typedArray:r,components:o}=e_(e);ex(1===o,"accessorToJsArray1D must have exactly 1 component");let a=Array.from(r);return t.set(e,a),a}(t.accessors[n],l),interpolation:s,output:function(e,t){if(t.has(e))return t.get(e);let{typedArray:r,components:o}=e_(e);ex(o>=1,"accessorToJsArray2D must have at least 1 component");let a=[];for(let e=0;e<r.length;e+=o)a.push(Array.from(r.slice(e,e+o)));return t.set(e,a),a}(t.accessors[p],c)},a.set(r,i)}let n=function(e,t,r){if("pointer"===t.path)return function(e,t,r){let o=t.extensions?.KHR_animation_pointer?.pointer;if("string"!=typeof o||!o.startsWith("/"))return I.R.warn("KHR_animation_pointer channel is missing a valid JSON pointer and will be skipped")(),null;let a=o.slice(1).split("/").map(e=>e.replace(/~1/g,"/").replace(/~0/g,"~"));switch(a[0]){case"nodes":var i=e,n=a,s=r,l=o;if(3!==n.length)return eC(l,"node pointers must use /nodes/{index}/{translation|rotation|scale|weights}"),null;let c=Number(n[1]),p=i.nodes[c];if(!Number.isInteger(c)||!p)return I.R.warn(`KHR_animation_pointer target ${l} references a missing node and will be skipped`)(),null;let u=eS(n[2]);return u?"weights"===u?(I.R.warn(`KHR_animation_pointer target ${l} will be skipped because morph weights are not implemented in GLTFAnimator`)(),null):{type:"node",sampler:s,targetNodeId:p.id,path:u}:(eC(l,`node property "${n[2]}" has no runtime animation mapping`),null);case"materials":var f=e,m=a,d=r,g=o;if(m.length<3)return eC(g,"material pointers must include a material index and target property path"),null;let h=Number(m[1]),b=f.materials[h];if(!Number.isInteger(h)||!b)return I.R.warn(`KHR_animation_pointer target ${g} references a missing material and will be skipped`)(),null;let v=function(e,t){let r=function(e,t){var r;let o,a=t.lastIndexOf("extensions");if(a<0||"KHR_texture_transform"!==t[a+1]||a<1)return{reason:"not-a-texture-transform-target"};let i=(r=t.slice(0,a),W.find(e=>e.pathSegments.length===r.length&&e.pathSegments.every((e,t)=>r[t]===e))||null);if(!i)return{reason:function(e){let t=eM(e);if(t){let e=eg[t]||null;if(e?.supportLevel==="none")return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`texture-transform target "${e.join("/")}" has no runtime texture-slot mapping`}(t.slice(0,a))};let n=function(e,t){let r=e;for(let e of t)if(!(r=r?.[e]))return null;return r}(e,i.pathSegments);if(!n)return{reason:`texture-transform target "${t.slice(0,a).join("/")}" does not exist on the referenced material`};let s=t[a+2];if("texCoord"===s)return{reason:"animated KHR_texture_transform.texCoord is unsupported because texCoord selection is structural, not a runtime float/vector update"};if("offset"!==s&&"rotation"!==s&&"scale"!==s)return{reason:`KHR_texture_transform property "${s}" is not animatable; supported properties are offset, rotation, and scale`};let l=t[a+3];if(t.length>a+4)return{reason:`KHR_texture_transform.${s} does not support nested property paths`};if(void 0!==l){if(o=Number(l),"rotation"===s)return{reason:"KHR_texture_transform.rotation does not support component indices"};if(!Number.isInteger(o)||o<0||o>1)return{reason:`KHR_texture_transform.${s} component index "${l}" is invalid; only 0 and 1 are supported`}}return{type:"textureTransform",textureSlot:i.slot,path:s,component:o,baseTransform:Q(n)}}(e,t);if(!("reason"in r)||"not-a-texture-transform-target"!==r.reason)return r;switch(t.join("/")){case"pbrMetallicRoughness/baseColorFactor":return e.pbrMetallicRoughness?{type:"material",property:"baseColorFactor"}:{reason:eR(t)};case"pbrMetallicRoughness/metallicFactor":return e.pbrMetallicRoughness?{type:"material",property:"metallicRoughnessValues",component:0}:{reason:eR(t)};case"pbrMetallicRoughness/roughnessFactor":return e.pbrMetallicRoughness?{type:"material",property:"metallicRoughnessValues",component:1}:{reason:eR(t)};case"normalTexture/scale":return e.normalTexture?{type:"material",property:"normalScale"}:{reason:eR(t)};case"occlusionTexture/strength":return e.occlusionTexture?{type:"material",property:"occlusionStrength"}:{reason:eR(t)};case"emissiveFactor":return{type:"material",property:"emissiveFactor"};case"alphaCutoff":return{type:"material",property:"alphaCutoff"};case"extensions/KHR_materials_specular/specularFactor":return e.extensions?.KHR_materials_specular?{type:"material",property:"specularIntensityFactor"}:{reason:eR(t)};case"extensions/KHR_materials_specular/specularColorFactor":return e.extensions?.KHR_materials_specular?{type:"material",property:"specularColorFactor"}:{reason:eR(t)};case"extensions/KHR_materials_ior/ior":return e.extensions?.KHR_materials_ior?{type:"material",property:"ior"}:{reason:eR(t)};case"extensions/KHR_materials_transmission/transmissionFactor":return e.extensions?.KHR_materials_transmission?{type:"material",property:"transmissionFactor"}:{reason:eR(t)};case"extensions/KHR_materials_volume/thicknessFactor":return e.extensions?.KHR_materials_volume?{type:"material",property:"thicknessFactor"}:{reason:eR(t)};case"extensions/KHR_materials_volume/attenuationDistance":return e.extensions?.KHR_materials_volume?{type:"material",property:"attenuationDistance"}:{reason:eR(t)};case"extensions/KHR_materials_volume/attenuationColor":return e.extensions?.KHR_materials_volume?{type:"material",property:"attenuationColor"}:{reason:eR(t)};case"extensions/KHR_materials_clearcoat/clearcoatFactor":return e.extensions?.KHR_materials_clearcoat?{type:"material",property:"clearcoatFactor"}:{reason:eR(t)};case"extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor":return e.extensions?.KHR_materials_clearcoat?{type:"material",property:"clearcoatRoughnessFactor"}:{reason:eR(t)};case"extensions/KHR_materials_sheen/sheenColorFactor":return e.extensions?.KHR_materials_sheen?{type:"material",property:"sheenColorFactor"}:{reason:eR(t)};case"extensions/KHR_materials_sheen/sheenRoughnessFactor":return e.extensions?.KHR_materials_sheen?{type:"material",property:"sheenRoughnessFactor"}:{reason:eR(t)};case"extensions/KHR_materials_iridescence/iridescenceFactor":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceFactor"}:{reason:eR(t)};case"extensions/KHR_materials_iridescence/iridescenceIor":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceIor"}:{reason:eR(t)};case"extensions/KHR_materials_iridescence/iridescenceThicknessMinimum":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceThicknessRange",component:0}:{reason:eR(t)};case"extensions/KHR_materials_iridescence/iridescenceThicknessMaximum":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceThicknessRange",component:1}:{reason:eR(t)};case"extensions/KHR_materials_anisotropy/anisotropyStrength":return e.extensions?.KHR_materials_anisotropy?{type:"material",property:"anisotropyStrength"}:{reason:eR(t)};case"extensions/KHR_materials_anisotropy/anisotropyRotation":return e.extensions?.KHR_materials_anisotropy?{type:"material",property:"anisotropyRotation"}:{reason:eR(t)};case"extensions/KHR_materials_emissive_strength/emissiveStrength":return e.extensions?.KHR_materials_emissive_strength?{type:"material",property:"emissiveStrength"}:{reason:eR(t)};default:return{reason:eR(t)}}}(b,m.slice(2));return"reason"in v?(eC(g,v.reason),null):{sampler:d,pointer:g,targetMaterialIndex:h,...v};default:return eC(o,`top-level target "${a[0]}" has no runtime animation mapping`),null}}(e,t,r);let o=eS(t.path);if(!o)return null;let a=e.nodes[t.node??0];if(!a)throw Error(`Cannot find animation target ${t.node}`);return{type:"node",sampler:r,targetNodeId:a.id,path:o}}(t,o,i);return n?[n]:[]});return i.length?[{name:o,channels:i}]:[]})),gltfNodeIdToNodeMap:m,materials:u}),h=function(e,t={}){let r=e.lights||e.extensions?.KHR_lights_punctual?.lights;if(!r||!Array.isArray(r)||0===r.length)return[];let o=[],a=function(e){let t=new Map;for(let r of e)for(let e of r.children||[])t.set(e.id,r);return t}(e.nodes||[]),i=new Map;for(let p of e.nodes||[]){var n,s,l,c;let e=p.light??p.extensions?.KHR_lights_punctual?.light;if("number"!=typeof e)continue;let u=r[e];if(!u)continue;let f=(n=u.color||[1,1,1],t.useByteColors??!0?n.map(e=>255*e):(0,el.sC)(n,!1)),m=u.intensity??1,d=u.range,g=function e(t,r,o){let a=o.get(t.id);if(a)return a;let i=function(e){if(e.matrix)return new M.Matrix4(e.matrix);let t=new M.Matrix4;return e.translation&&t.translate(e.translation),e.rotation&&t.multiplyRight(new M.Matrix4().fromQuaternion(e.rotation)),e.scale&&t.scale(e.scale),t}(t),n=r.get(t.id),s=n?new M.Matrix4(e(n,r,o)).multiplyRight(i):i;return o.set(t.id,s),s}(p,a,i);switch(u.type){case"directional":o.push((s=g,l=f,c=m,{type:"directional",direction:ep(s),color:l,intensity:c}));break;case"point":o.push(function(e,t,r,o){let a=ec(e),i=[1,0,0];return void 0!==o&&o>0&&(i=[1,0,1/(o*o)]),{type:"point",position:a,color:t,intensity:r,attenuation:i}}(g,f,m,d));break;case"spot":o.push(function(e,t,r,o,a={}){let i=ec(e),n=ep(e),s=[1,0,0];return void 0!==o&&o>0&&(s=[1,0,1/(o*o)]),{type:"spot",position:i,direction:n,color:t,intensity:r,attenuation:s,innerConeAngle:a.innerConeAngle??0,outerConeAngle:a.outerConeAngle??Math.PI/4}}(g,f,m,d,u.spot))}}return o}(t,{useByteColors:r?.useByteColors??!0}),b=new Map(Array.from((o=t,eh(n=new Set,o.extensionsUsed),eh(n,o.extensionsRequired),eh(n,o.extensionsRemoved),eh(n,Object.keys(o.extensions||{})),(o.lights?.length||(o.nodes||[]).some(e=>"light"in e))&&n.add("KHR_lights_punctual"),(o.materials||[]).some(e=>e.unlit||e.extensions?.KHR_materials_unlit)&&n.add("KHR_materials_unlit"),n)).sort().map(e=>{let t=eg[e]||ed;return[e,{extensionName:e,supported:"built-in"===t.supportLevel||"parsed-and-wired"===t.supportLevel,supportLevel:t.supportLevel,comment:t.comment}]})),v=p.map(e=>ey(e.getBounds())),_=function(e){let t=null;for(let r of e)if(r.bounds){if(!t){t=[[...r.bounds[0]],[...r.bounds[1]]];continue}for(let e=0;e<3;e++)t[0][e]=Math.min(t[0][e],r.bounds[0][e]),t[1][e]=Math.max(t[1][e],r.bounds[1][e])}return ey(t)}(v);return{scenes:p,materials:u,animator:g,lights:h,extensionSupport:b,sceneBounds:v,modelBounds:_,gltfMeshIdToNodeMap:f,gltfNodeIdToNodeMap:m,gltfNodeIndexToNodeMap:d,gltf:t}}(t,o.json?(0,eT.R)(o):o,this._getModelOptions());r=n,eA(n).then(()=>this.setNeedsRedraw()).catch(e=>{this.raiseError(e,"loading glTF")})}let o={layer:this,device:this.context.device},n=e.getScene(r,o),l=e.getAnimator(r,o);if(n instanceof T){this._destroyScenegraphAssets(),this._applyAnimationsProp(l,e._animations);let t=[];n.traverse(e=>{e instanceof A&&t.push(e.model)}),this.setState({scenegraph:n,animator:l,materials:r?.materials||null,models:t,firstDrawSignaled:!1}),this.getAttributeManager().invalidateAll()}else null!==n&&s.A.warn("invalid scenegraph:",n)()}_destroyScenegraphAssets(){this.state.scenegraph?.destroy(),this.state.materials?.forEach(e=>e.destroy()),this.state.scenegraph=null,this.state.animator=null,this.state.materials=null,this.state.models=[]}_applyAnimationsProp(e,t){if(!e||!t)return;let r=e.getAnimations();Object.keys(t).sort().forEach(e=>{let o=t[e];if("*"===e)r.forEach(e=>{Object.assign(e,o)});else if(Number.isFinite(Number(e))){let t=Number(e);t>=0&&t<r.length?Object.assign(r[t],o):s.A.warn(`animation ${e} not found`)()}else{let t=r.find(({animation:t})=>t.name===e);t?Object.assign(t,o):s.A.warn(`animation ${e} not found`)()}})}_getModelOptions(){let e,{_imageBasedLightingEnvironment:t}=this.props;return t&&(e="function"==typeof t?t({gl:this.context.gl,layer:this}):t),{imageBasedLightingEnvironment:e,modelOptions:{id:this.props.id,isInstanced:!0,bufferLayout:this.getAttributeManager().getBufferLayouts(),...this.getShaders()},useTangents:!1}}draw({context:e}){if(!this.state.scenegraph)return;this.props._animations&&this.state.animator&&(this.state.animator.setTime(e.timeline.getTime()),this.setNeedsRedraw());let{viewport:t,renderPass:r}=this.context,{sizeScale:o,sizeMinPixels:a,sizeMaxPixels:i,coordinateSystem:n}=this.props,s={camera:t.cameraPosition},l=this.getNumInstances();this.state.scenegraph.traverse((e,{worldMatrix:c})=>{if(e instanceof A){let{model:p}=e;p.setInstanceCount(l);let u={sizeScale:o,sizeMinPixels:a,sizeMaxPixels:i,composeModelMatrix:eF(t,n),sceneModelMatrix:c};p.shaderInputs.setProps({pbrProjection:s,scenegraph:u}),p.draw(r)}}),this.state.firstDrawSignaled||(this.state.firstDrawSignaled=!0,this.props.onFirstDraw?.())}}eK.defaultProps=ez,eK.layerName="ScenegraphLayer";var ej=r(98881),e$=r(79439),eX=r(38846);let eq={name:"phongMaterial",firstBindingSlot:0,bindingLayout:[{name:"phongMaterial",group:3}],dependencies:[m.x,ej.$],source:e$.X,vs:eX.X,fs:eX.l,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:e=>({...eq.defaultUniforms,...e})},eW=`\
layout(std140) uniform simpleMeshUniforms {
  float sizeScale;
  bool composeModelMatrix;
  bool hasTexture;
  bool flatShading;
} simpleMesh;
`,eY={name:"simpleMesh",vs:eW,fs:eW,uniformTypes:{sizeScale:"f32",composeModelMatrix:"f32",hasTexture:"f32",flatShading:"f32"}},eJ=`#version 300 es
#define SHADER_NAME simple-mesh-layer-vs
in vec3 positions;
in vec3 normals;
in vec3 colors;
in vec2 texCoords;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
in vec3 instancePickingColors;
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
geometry.pickingColor = instancePickingColors;
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
`,eZ=`#version 300 es
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
`;var eQ=r(67916);function e0(e){let t=e.positions||e.POSITION;s.A.assert(t,'no "postions" or "POSITION" attribute in mesh');let r=t.value.length/t.size,o=e.COLOR_0||e.colors;o||(o={size:3,value:new Float32Array(3*r).fill(1)});let a=e.NORMAL||e.normals;a||(a={size:3,value:new Float32Array(3*r).fill(0)});let i=e.TEXCOORD_0||e.texCoords;return i||(i={size:2,value:new Float32Array(2*r).fill(0)}),{positions:t,colors:o,normals:a,texCoords:i}}function e3(e){return e instanceof i.V?(e.attributes=e0(e.attributes),e):new i.V(e.attributes?{...e,topology:"triangle-list",attributes:e0(e.attributes)}:{topology:"triangle-list",attributes:e0(e)})}class e1 extends p.A{getShaders(){return super.getShaders({vs:eJ,fs:eZ,modules:[u.A,eq,f.A,eY]})}getBounds(){if(this.props._instanced)return super.getBounds();let e=this.state.positionBounds;if(e)return e;let{mesh:t}=this.props;if(!t)return null;if(!(e=t.header?.boundingBox)){let{attributes:r}=e3(t);r.POSITION=r.POSITION||r.positions,e=(0,eQ.l)(r)}return this.state.positionBounds=e,e}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{transition:!0,type:"float64",fp64:this.use64bitPositions(),size:3,accessor:"getPosition"},instanceColors:{type:"unorm8",transition:!0,size:this.props.colorFormat.length,accessor:"getColor",defaultValue:[0,0,0,255]},instanceModelMatrix:eH}),this.setState({emptyTexture:this.context.device.createTexture({data:new Uint8Array(4),width:1,height:1})})}updateState(e){super.updateState(e);let{props:t,oldProps:r,changeFlags:o}=e;if(t.mesh!==r.mesh||o.extensionsChanged){if(this.state.positionBounds=null,this.state.model?.destroy(),t.mesh){this.state.model=this.getModel(t.mesh);let e=t.mesh.attributes||t.mesh;this.setState({hasNormals:!!(e.NORMAL||e.normals)})}this.getAttributeManager().invalidateAll()}t.texture!==r.texture&&t.texture instanceof U.g&&this.setTexture(t.texture),this.state.model&&this.state.model.setTopology(this.props.wireframe?"line-strip":"triangle-list")}finalizeState(e){super.finalizeState(e),this.state.emptyTexture.delete()}draw({uniforms:e}){let{model:t}=this.state;if(!t)return;let{viewport:r,renderPass:o}=this.context,{sizeScale:a,coordinateSystem:i,_instanced:n}=this.props,s={sizeScale:a,composeModelMatrix:!n||eF(r,i),flatShading:!this.state.hasNormals};t.shaderInputs.setProps({simpleMesh:s}),t.draw(o)}get isLoaded(){return!!(this.state?.model&&super.isLoaded)}getModel(e){let t=new G.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:e3(e),isInstanced:!0}),{texture:r}=this.props,{emptyTexture:o}=this.state;return t.shaderInputs.setProps({simpleMesh:{sampler:r||o,hasTexture:!!r}}),t}setTexture(e){let{emptyTexture:t,model:r}=this.state;r&&r.shaderInputs.setProps({simpleMesh:{sampler:e||t,hasTexture:!!e}})}}e1.defaultProps={mesh:{type:"object",value:null,async:!0},texture:{type:"image",value:null,async:!0},sizeScale:{type:"number",value:1,min:0},_instanced:!0,wireframe:!1,material:!0,getPosition:{type:"accessor",value:e=>e.position},getColor:{type:"accessor",value:[0,0,0,255]},getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},textureParameters:{type:"object",ignore:!0,value:null}},e1.layerName="SimpleMeshLayer";let e2=e1,e4=`\
layout(std140) uniform meshUniforms {
  bool pickFeatureIds;
} mesh;
`,e5={name:"mesh",vs:e4,fs:e4,uniformTypes:{pickFeatureIds:"f32"}},e9=`#version 300 es
#define SHADER_NAME simple-mesh-layer-vs
in vec3 positions;
in vec3 normals;
in vec3 colors;
in vec2 texCoords;
in vec4 uvRegions;
in vec3 featureIdsPickingColors;
in vec4 instanceColors;
in vec3 instancePickingColors;
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
geometry.pickingColor = featureIdsPickingColors;
} else {
geometry.pickingColor = instancePickingColors;
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
`,e6=`#version 300 es
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
`;class e8 extends e2{getShaders(){let e=super.getShaders();return e.modules.push(R,e5),{...e,vs:e9,fs:e6}}initializeState(){let{featureIds:e}=this.props;super.initializeState();let t=this.getAttributeManager();e&&t.add({featureIdsPickingColors:{type:"uint8",size:3,noAlloc:!0,update:this.calculateFeatureIdsPickingColors}})}updateState(e){super.updateState(e);let{props:t,oldProps:r}=e;t.pbrMaterial!==r.pbrMaterial&&this.updatePbrMaterialUniforms(t.pbrMaterial)}draw(e){let{featureIds:t}=this.props,{model:r}=this.state;if(!r)return;let o={camera:this.context.viewport.cameraPosition};r.shaderInputs.setProps({pbrProjection:o,mesh:{pickFeatureIds:!!t}}),super.draw(e)}getModel(e){var t;let r,o,{id:a}=this.props,i=this.parseMaterial(this.props.pbrMaterial,e);this.setState({parsedPBRMaterial:i});let n=this.getShaders();return o=(r=(t=e.attributes).positions||t.POSITION).value.length/r.size,t.COLOR_0||t.colors||(t.colors={size:4,value:new Uint8Array(4*o).fill(255),normalized:!0}),new G.K(this.context.device,{...this.getShaders(),id:a,geometry:e,bufferLayout:this.getAttributeManager().getBufferLayouts(),defines:{...n.defines,...i?.defines,HAS_UV_REGIONS:+!!e.attributes.uvRegions},parameters:i?.parameters,isInstanced:!0})}updatePbrMaterialUniforms(e){let{model:t}=this.state;if(t){let{mesh:r}=this.props,o=this.parseMaterial(e,r);this.setState({parsedPBRMaterial:o});let{pbr_baseColorSampler:a}=o.bindings,{emptyTexture:i}=this.state,{camera:n,...s}={...o.bindings,...o.uniforms};t.shaderInputs.setProps({simpleMesh:{sampler:a||i,hasTexture:!!a},pbrMaterial:s})}}parseMaterial(e,t){let r=!!(e.pbrMetallicRoughness&&e.pbrMetallicRoughness.baseColorTexture);return er(this.context.device,{unlit:r,...e},{NORMAL:t.attributes.normals,TEXCOORD_0:t.attributes.texCoords},{pbrDebug:!1,lights:!0,useTangents:!1})}calculateFeatureIdsPickingColors(e){let t=this.props.featureIds,r=new Uint8ClampedArray(t.length*e.size),o=[];for(let e=0;e<t.length;e++)this.encodePickingColor(t[e],o),r[3*e]=o[0],r[3*e+1]=o[1],r[3*e+2]=o[2];e.value=r}finalizeState(e){super.finalizeState(e),this.state.parsedPBRMaterial?.generatedTextures.forEach(e=>e.destroy()),this.setState({parsedPBRMaterial:null})}}e8.layerName="MeshLayer",e8.defaultProps={pbrMaterial:{type:"object",value:null},featureIds:{type:"array",value:null,optional:!0}};var e7=r(58682),te=r(1756),tt=r(77606),tr=r(16298);let to=[0],ta={getPointColor:{type:"accessor",value:[0,0,0,255]},pointSize:1,data:"",loader:tr.i,onTilesetLoad:{type:"function",value:e=>{}},onTileLoad:{type:"function",value:e=>{}},onTileUnload:{type:"function",value:e=>{}},onTileError:{type:"function",value:(e,t,r)=>{}},_getMeshColor:{type:"function",value:e=>[255,255,255]}};class ti extends n.A{initializeState(){"onTileLoadFail"in this.props&&s.A.removed("onTileLoadFail","onTileError")(),this.state={layerMap:{},tileset3d:null,activeViewports:{},lastUpdatedViewports:null}}get isLoaded(){return!!(this.state?.tileset3d?.isLoaded()&&super.isLoaded)}shouldUpdateState({changeFlags:e}){return e.somethingChanged}updateState({props:e,oldProps:t,changeFlags:r}){if(e.data&&e.data!==t.data&&this._loadTileset(e.data),r.viewportChanged){let{activeViewports:e}=this.state;Object.keys(e).length&&(this._updateTileset(e),this.state.lastUpdatedViewports=e,this.state.activeViewports={})}if(r.propsChanged){let{layerMap:e}=this.state;for(let t in e)e[t].needsUpdate=!0}}finalizeState(e){this.state.tileset3d?.destroy(),this.state.tileset3d=null,this.state.layerMap={},this.state.activeViewports={},this.state.lastUpdatedViewports=null,super.finalizeState(e)}activateViewport(e){let{activeViewports:t,lastUpdatedViewports:r}=this.state;this.internalState.viewport=e,t[e.id]=e;let o=r?.[e.id];o&&e.equals(o)||(this.setChangeFlags({viewportChanged:!0}),this.setNeedsUpdate())}getPickingInfo({info:e,sourceLayer:t}){let r=t&&t.props.tile;return e.picked&&(e.object=r),e.sourceTile=r,e}filterSubLayer({layer:e,viewport:t,cullRect:r,isPicking:o}){let{tile:a}=e.props,{id:i}=t;if(!a.selected||!a.viewportIds.includes(i))return!1;if(o&&r&&a.content?.cartographicOrigin){let[e,o]=t.project(a.content.cartographicOrigin),i=r.x+r.width/2,n=r.y+r.height/2,s=Math.max(t.width,t.height)/4,l=e-i,c=o-n;if(l*l+c*c>s*s)return!1}return!0}_updateAutoHighlight(e){let t=e.sourceTile,r=this.state.layerMap[t?.id];r&&r.layer&&r.layer.updateAutoHighlight(e)}async _loadTileset(e){let t=this.props.loadOptions||{},r=this.props.loaders?.length?this.props.loaders:this.props.loader,o=Array.isArray(r)?r[0]:r,{tileset:a,...i}=t,n={loadOptions:{...i},...a},s=e;if("preload"in o&&"function"==typeof o.preload){let r=await o.preload(e,t);r.url&&(s=r.url),r.headers&&(n.loadOptions.core={...n.loadOptions.core,fetch:{...n.loadOptions.core?.fetch,headers:r.headers}}),Object.assign(n,r)}let l=await (0,e7.H)(s,o,n.loadOptions),c=new te.Q(l,{onTileLoad:this._onTileLoad.bind(this),onTileUnload:this._onTileUnload.bind(this),onTileError:this.props.onTileError,onUpdate:()=>this.setNeedsUpdate(),...n});this.setState({tileset3d:c,layerMap:{}}),this._updateTileset(this.state.activeViewports),this.props.onTilesetLoad(c)}_onTileLoad(e){let{lastUpdatedViewports:t}=this.state;e.tileDrawn=!1,this.props.onTileLoad(e),this._updateTileset(t),this.setNeedsUpdate()}_onTileUnload(e){delete this.state.layerMap[e.id],this.props.onTileUnload(e)}_updateTileset(e){if(!e)return;let{tileset3d:t}=this.state,{timeline:r}=this.context,o=Object.keys(e).length;r&&o&&t&&t.selectTiles(Object.values(e)).then(e=>{this.state.frameNumber!==e&&this.setState({frameNumber:e})})}_getSubLayer(e,t){if(!e.content)return null;switch(e.type){case tt.WH.POINTCLOUD:return this._makePointCloudLayer(e,t);case tt.WH.SCENEGRAPH:return this._make3DModelLayer(e);case tt.WH.MESH:return this._makeSimpleMeshLayer(e,t);default:throw Error(`Tile3DLayer: Failed to render layer of type ${e.content.type}`)}}_makePointCloudLayer(e,t){let{attributes:r,pointCount:o,constantRGBA:a,cartographicOrigin:i,modelMatrix:n}=e.content,{positions:s,normals:p,colors:u}=r;if(!s)return null;let f=t&&t.props.data||{header:{vertexCount:o},attributes:{POSITION:s,NORMAL:p,COLOR_0:u}},{pointSize:m,getPointColor:d}=this.props;return new(this.getSubLayerClass("pointcloud",c.A))({pointSize:m},this.getSubLayerProps({id:"pointcloud"}),{id:`${this.id}-pointcloud-${e.id}`,tile:e,data:f,coordinateSystem:l.rf.METER_OFFSETS,coordinateOrigin:i,modelMatrix:n,getColor:a||d,_offset:0})}_make3DModelLayer(e){let{gltf:t,instances:r,cartographicOrigin:o,modelMatrix:a}=e.content;return new(this.getSubLayerClass("scenegraph",eK))({_lighting:"pbr"},this.getSubLayerProps({id:"scenegraph"}),{id:`${this.id}-scenegraph-${e.id}`,tile:e,data:r||to,scenegraph:t,coordinateSystem:l.rf.METER_OFFSETS,coordinateOrigin:o,modelMatrix:a,getTransformMatrix:e=>e.modelMatrix,getPosition:[0,0,0],_offset:0,onFirstDraw:()=>{e.tileDrawn=!0}})}_makeSimpleMeshLayer(e,t){var r;let o,{attributes:a,indices:n,modelMatrix:s,cartographicOrigin:c,coordinateSystem:p=l.rf.METER_OFFSETS,material:u,featureIds:f}=e.content,{_getMeshColor:m}=this.props,d=t&&t.props.mesh||new i.V({topology:"triangle-list",attributes:((o={}).positions={...(r=a).positions,value:new Float32Array(r.positions.value)},r.normals&&(o.normals=r.normals),r.texCoords&&(o.texCoords=r.texCoords),r.colors&&(o.colors=r.colors),r.uvRegions&&(o.uvRegions=r.uvRegions),o),indices:n});return new(this.getSubLayerClass("mesh",e8))(this.getSubLayerProps({id:"mesh"}),{id:`${this.id}-mesh-${e.id}`,tile:e,mesh:d,data:to,getColor:m(e),pbrMaterial:u,modelMatrix:s,coordinateOrigin:c,coordinateSystem:p,featureIds:f,_offset:0})}renderLayers(){let{tileset3d:e,layerMap:t}=this.state;return e?e.tiles.map(e=>{let r=t[e.id]=t[e.id]||{tile:e},{layer:o}=r;return e.selected&&(o?r.needsUpdate&&(o=this._getSubLayer(e,o),r.needsUpdate=!1):o=this._getSubLayer(e)),r.layer=o,o}).filter(Boolean):null}}ti.defaultProps=ta,ti.layerName="Tile3DLayer";let tn=ti},69198(e,t,r){r.d(t,{A:()=>_});var o=r(25799),a=r(84175),i=r(46487),n=r(95335),s=r(9350),l=r(37072),c=r(54338),p=r(25337);let u=`\
layout(std140) uniform pointCloudUniforms {
  float radiusPixels;
  highp int sizeUnits;
} pointCloud;
`,f={name:"pointCloud",source:"",vs:u,fs:u,uniformTypes:{radiusPixels:"f32",sizeUnits:"i32"}},m=`\
#version 300 es
#define SHADER_NAME point-cloud-layer-vertex-shader
in vec3 positions;
in vec3 instanceNormals;
in vec4 instanceColors;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec3 instancePickingColors;
out vec4 vColor;
out vec2 unitPosition;
void main(void) {
geometry.worldPosition = instancePositions;
geometry.normal = project_normal(instanceNormals);
unitPosition = positions.xy;
geometry.uv = unitPosition;
geometry.pickingColor = instancePickingColors;
vec3 offset = vec3(positions.xy * project_size_to_pixel(pointCloud.radiusPixels, pointCloud.sizeUnits), 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
vec3 lightColor = lighting_getLightColor(instanceColors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, instanceColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,d=`\
#version 300 es
#define SHADER_NAME point-cloud-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 unitPosition;
out vec4 fragColor;
void main(void) {
geometry.uv = unitPosition.xy;
float distToCenter = length(unitPosition);
if (distToCenter > 1.0) {
discard;
}
fragColor = vColor;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,g=`\
struct PointCloudUniforms {
  radiusPixels: f32,
  sizeUnits: i32,
};

@group(0) @binding(0)
var<uniform> pointCloudUniforms: PointCloudUniforms;

struct ConstantAttributes {
  instanceNormals: vec3<f32>,
  instanceColors: vec4<f32>,
  instancePositions: vec3<f32>,
  instancePositions64Low: vec3<f32>,
  instancePickingColors: vec3<f32>
};

const constants = ConstantAttributes(
  vec3<f32>(1.0, 0.0, 0.0),
  vec4<f32>(0.0, 0.0, 0.0, 1.0),
  vec3<f32>(0.0),
  vec3<f32>(0.0),
  vec3<f32>(0.0)
);

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions: vec3<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceNormals: vec3<f32>,
  @location(4) instanceColors: vec4<f32>,
  @location(5) instancePickingColors: vec3<f32>
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

  // position on the containing square in [-1, 1] space
  varyings.unitPosition = attributes.positions.xy;
  geometry.uv = varyings.unitPosition;
  geometry.pickingColor = attributes.instancePickingColors;

  // Find the center of the point and add the current vertex
  let offset = vec3<f32>(
    attributes.positions.xy *
      project_unit_size_to_pixel(pointCloudUniforms.radiusPixels, pointCloudUniforms.sizeUnits),
    0.0
  );
  // DECKGL_FILTER_SIZE(offset, geometry);

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
  varyings.pickingColor = attributes.instancePickingColors;

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  // var geometry: Geometry;
  // geometry.uv = unitPosition.xy;

  let distToCenter = length(varyings.unitPosition);
  if (distToCenter > 1.0) {
    discard;
  }

  var fragColor: vec4<f32>;

  fragColor = varyings.vColor;

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
`,h=[0,0,0,255],b=[0,0,1];class v extends o.A{getShaders(){return super.getShaders({vs:m,fs:d,source:g,modules:[a.A,i.A,l.J,n.A,f]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceNormals:{size:3,transition:!0,accessor:"getNormal",defaultValue:b},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:h}})}updateState(e){let{changeFlags:t,props:r}=e;super.updateState(e),t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()),t.dataChanged&&function(e){let{header:t,attributes:r}=e;if(t&&r&&(e.length=t.vertexCount,r.POSITION&&(r.instancePositions=r.POSITION),r.NORMAL&&(r.instanceNormals=r.NORMAL),r.COLOR_0)){let{size:e,value:t}=r.COLOR_0;r.instanceColors={size:e,type:"unorm8",value:t}}}(r.data)}draw({uniforms:e}){let{pointSize:t,sizeUnits:r}=this.props,o=this.state.model,a={sizeUnits:s.p5[r],radiusPixels:t};o.shaderInputs.setProps({pointCloud:a}),o.draw(this.context.renderPass)}_getModel(){let e=[];for(let t=0;t<3;t++){let r=t/3*Math.PI*2;e.push(2*Math.cos(r),2*Math.sin(r),0)}return new c.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new p.V({topology:"triangle-list",attributes:{positions:new Float32Array(e)}}),isInstanced:!0})}}v.layerName="PointCloudLayer",v.defaultProps={sizeUnits:"pixels",pointSize:{type:"number",min:0,value:10},getPosition:{type:"accessor",value:e=>e.position},getNormal:{type:"accessor",value:b},getColor:{type:"accessor",value:h},material:!0,radiusPixels:{deprecatedFor:"pointSize"}};let _=v}}]);