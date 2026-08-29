"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["44133"],{55230(e){function t(e,t,p){p=p||2;var d,g,x,v,y,m,P,_=t&&t.length,C=_?t[0]*p:e.length,b=i(e,0,C,p,!0),L=[];if(!b||b.next===b.prev)return L;if(_&&(b=function(e,t,s,l){var c,p,d,g,h,x=[];for(c=0,p=t.length;c<p;c++)d=t[c]*l,g=c<p-1?t[c+1]*l:e.length,(h=i(e,d,g,l,!1))===h.next&&(h.steiner=!0),x.push(function(e){var t=e,i=e;do(t.x<i.x||t.x===i.x&&t.y<i.y)&&(i=t),t=t.next;while(t!==e)return i}(h));for(x.sort(n),c=0;c<x.length;c++)s=function(e,t){var i=function(e,t){var i,o,n,s=t,l=e.x,c=e.y,p=-1/0;do{if(c<=s.y&&c>=s.next.y&&s.next.y!==s.y){var d=s.x+(c-s.y)*(s.next.x-s.x)/(s.next.y-s.y);if(d<=l&&d>p&&(p=d,n=s.x<s.next.x?s:s.next,d===l))return n}s=s.next}while(s!==t)if(!n)return null;var f,g=n,h=n.x,x=n.y,v=1/0;s=n;do{l>=s.x&&s.x>=h&&l!==s.x&&r(c<x?l:p,c,h,x,c<x?p:l,c,s.x,s.y)&&(f=Math.abs(c-s.y)/(l-s.x),u(s,e)&&(f<v||f===v&&(s.x>n.x||s.x===n.x&&(i=n,o=s,0>a(i.prev,i,o.prev)&&0>a(o.next,i,i.next))))&&(n=s,v=f)),s=s.next}while(s!==g)return n}(e,t);if(!i)return t;var n=f(i,e);return o(n,n.next),o(i,i.next)}(x[c],s);return s}(e,t,b,p)),e.length>80*p){d=x=e[0],g=v=e[1];for(var S=p;S<C;S+=p)y=e[S],m=e[S+1],y<d&&(d=y),m<g&&(g=m),y>x&&(x=y),m>v&&(v=m);P=0!==(P=Math.max(x-d,v-g))?32767/P:0}return function e(t,i,n,p,d,g,x){if(t){!x&&g&&function(e,t,i,o){var n=e;do 0===n.z&&(n.z=s(n.x,n.y,t,i,o)),n.prevZ=n.prev,n.nextZ=n.next,n=n.next;while(n!==e)n.prevZ.nextZ=null,n.prevZ=null,function(e){var t,i,o,n,s,r,a,l,c=1;do{for(i=e,e=null,s=null,r=0;i;){for(r++,o=i,a=0,t=0;t<c&&(a++,o=o.nextZ);t++);for(l=c;a>0||l>0&&o;)0!==a&&(0===l||!o||i.z<=o.z)?(n=i,i=i.nextZ,a--):(n=o,o=o.nextZ,l--),s?s.nextZ=n:e=n,n.prevZ=s,s=n;i=o}s.nextZ=null,c*=2}while(r>1)}(n)}(t,p,d,g);for(var v,y,m=t;t.prev!==t.next;){if(v=t.prev,y=t.next,g?function(e,t,i,o){var n=e.prev,l=e.next;if(a(n,e,l)>=0)return!1;for(var c=n.x,p=e.x,d=l.x,u=n.y,f=e.y,g=l.y,h=c<p?c<d?c:d:p<d?p:d,x=u<f?u<g?u:g:f<g?f:g,v=c>p?c>d?c:d:p>d?p:d,y=u>f?u>g?u:g:f>g?f:g,m=s(h,x,t,i,o),P=s(v,y,t,i,o),_=e.prevZ,C=e.nextZ;_&&_.z>=m&&C&&C.z<=P;){if(_.x>=h&&_.x<=v&&_.y>=x&&_.y<=y&&_!==n&&_!==l&&r(c,u,p,f,d,g,_.x,_.y)&&a(_.prev,_,_.next)>=0||(_=_.prevZ,C.x>=h&&C.x<=v&&C.y>=x&&C.y<=y&&C!==n&&C!==l&&r(c,u,p,f,d,g,C.x,C.y)&&a(C.prev,C,C.next)>=0))return!1;C=C.nextZ}for(;_&&_.z>=m;){if(_.x>=h&&_.x<=v&&_.y>=x&&_.y<=y&&_!==n&&_!==l&&r(c,u,p,f,d,g,_.x,_.y)&&a(_.prev,_,_.next)>=0)return!1;_=_.prevZ}for(;C&&C.z<=P;){if(C.x>=h&&C.x<=v&&C.y>=x&&C.y<=y&&C!==n&&C!==l&&r(c,u,p,f,d,g,C.x,C.y)&&a(C.prev,C,C.next)>=0)return!1;C=C.nextZ}return!0}(t,p,d,g):function(e){var t=e.prev,i=e.next;if(a(t,e,i)>=0)return!1;for(var o=t.x,n=e.x,s=i.x,l=t.y,c=e.y,p=i.y,d=o<n?o<s?o:s:n<s?n:s,u=l<c?l<p?l:p:c<p?c:p,f=o>n?o>s?o:s:n>s?n:s,g=l>c?l>p?l:p:c>p?c:p,h=i.next;h!==t;){if(h.x>=d&&h.x<=f&&h.y>=u&&h.y<=g&&r(o,l,n,c,s,p,h.x,h.y)&&a(h.prev,h,h.next)>=0)return!1;h=h.next}return!0}(t)){i.push(v.i/n|0),i.push(t.i/n|0),i.push(y.i/n|0),h(t),t=y.next,m=y.next;continue}if((t=y)===m){x?1===x?e(t=function(e,t,i){var n=e;do{var s=n.prev,r=n.next.next;!l(s,r)&&c(s,n,n.next,r)&&u(s,r)&&u(r,s)&&(t.push(s.i/i|0),t.push(n.i/i|0),t.push(r.i/i|0),h(n),h(n.next),n=e=r),n=n.next}while(n!==e)return o(n)}(o(t),i,n),i,n,p,d,g,2):2===x&&function(t,i,n,s,r,p){var d=t;do{for(var g,h,x=d.next.next;x!==d.prev;){if(d.i!==x.i&&(g=d,h=x,g.next.i!==h.i&&g.prev.i!==h.i&&!function(e,t){var i=e;do{if(i.i!==e.i&&i.next.i!==e.i&&i.i!==t.i&&i.next.i!==t.i&&c(i,i.next,e,t))return!0;i=i.next}while(i!==e)return!1}(g,h)&&(u(g,h)&&u(h,g)&&function(e,t){var i=e,o=!1,n=(e.x+t.x)/2,s=(e.y+t.y)/2;do i.y>s!=i.next.y>s&&i.next.y!==i.y&&n<(i.next.x-i.x)*(s-i.y)/(i.next.y-i.y)+i.x&&(o=!o),i=i.next;while(i!==e)return o}(g,h)&&(a(g.prev,g,h.prev)||a(g,h.prev,h))||l(g,h)&&a(g.prev,g,g.next)>0&&a(h.prev,h,h.next)>0))){var v=f(d,x);d=o(d,d.next),v=o(v,v.next),e(d,i,n,s,r,p,0),e(v,i,n,s,r,p,0);return}x=x.next}d=d.next}while(d!==t)}(t,i,n,p,d,g):e(o(t),i,n,p,d,g,1);break}}}}(b,L,p,d,g,P,0),L}function i(e,t,i,o,n){var s,r;if(n===v(e,t,i,o)>0)for(s=t;s<i;s+=o)r=g(s,e[s],e[s+1],r);else for(s=i-o;s>=t;s-=o)r=g(s,e[s],e[s+1],r);return r&&l(r,r.next)&&(h(r),r=r.next),r}function o(e,t){if(!e)return e;t||(t=e);var i,o=e;do if(i=!1,!o.steiner&&(l(o,o.next)||0===a(o.prev,o,o.next))){if(h(o),(o=t=o.prev)===o.next)break;i=!0}else o=o.next;while(i||o!==t)return t}function n(e,t){return e.x-t.x}function s(e,t,i,o,n){return(e=((e=((e=((e=((e=(e-i)*n|0)|e<<8)&0xff00ff)|e<<4)&0xf0f0f0f)|e<<2)&0x33333333)|e<<1)&0x55555555)|(t=((t=((t=((t=((t=(t-o)*n|0)|t<<8)&0xff00ff)|t<<4)&0xf0f0f0f)|t<<2)&0x33333333)|t<<1)&0x55555555)<<1}function r(e,t,i,o,n,s,r,a){return(n-r)*(t-a)>=(e-r)*(s-a)&&(e-r)*(o-a)>=(i-r)*(t-a)&&(i-r)*(s-a)>=(n-r)*(o-a)}function a(e,t,i){return(t.y-e.y)*(i.x-t.x)-(t.x-e.x)*(i.y-t.y)}function l(e,t){return e.x===t.x&&e.y===t.y}function c(e,t,i,o){var n=d(a(e,t,i)),s=d(a(e,t,o)),r=d(a(i,o,e)),l=d(a(i,o,t));return!!(n!==s&&r!==l||0===n&&p(e,i,t)||0===s&&p(e,o,t)||0===r&&p(i,e,o)||0===l&&p(i,t,o))}function p(e,t,i){return t.x<=Math.max(e.x,i.x)&&t.x>=Math.min(e.x,i.x)&&t.y<=Math.max(e.y,i.y)&&t.y>=Math.min(e.y,i.y)}function d(e){return e>0?1:e<0?-1:0}function u(e,t){return 0>a(e.prev,e,e.next)?a(e,t,e.next)>=0&&a(e,e.prev,t)>=0:0>a(e,t,e.prev)||0>a(e,e.next,t)}function f(e,t){var i=new x(e.i,e.x,e.y),o=new x(t.i,t.x,t.y),n=e.next,s=t.prev;return e.next=t,t.prev=e,i.next=n,n.prev=i,o.next=i,i.prev=o,s.next=o,o.prev=s,o}function g(e,t,i,o){var n=new x(e,t,i);return o?(n.next=o.next,n.prev=o,o.next.prev=n,o.next=n):(n.prev=n,n.next=n),n}function h(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function x(e,t,i){this.i=e,this.x=t,this.y=i,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function v(e,t,i,o){for(var n=0,s=t,r=i-o;s<i;s+=o)n+=(e[r]-e[s])*(e[s+1]+e[r+1]),r=s;return n}e.exports=t,e.exports.default=t,t.deviation=function(e,t,i,o){var n=t&&t.length,s=n?t[0]*i:e.length,r=Math.abs(v(e,0,s,i));if(n)for(var a=0,l=t.length;a<l;a++){var c=t[a]*i,p=a<l-1?t[a+1]*i:e.length;r-=Math.abs(v(e,c,p,i))}var d=0;for(a=0;a<o.length;a+=3){var u=o[a]*i,f=o[a+1]*i,g=o[a+2]*i;d+=Math.abs((e[u]-e[g])*(e[f+1]-e[u+1])-(e[u]-e[f])*(e[g+1]-e[u+1]))}return 0===r&&0===d?0:Math.abs((d-r)/r)},t.flatten=function(e){for(var t=e[0][0].length,i={vertices:[],holes:[],dimensions:t},o=0,n=0;n<e.length;n++){for(var s=0;s<e[n].length;s++)for(var r=0;r<t;r++)i.vertices.push(e[n][s][r]);n>0&&(o+=e[n-1].length,i.holes.push(o))}return i}},44941(e,t,i){i.d(t,{A:()=>a});var o=i(53439),n=i(23459),s=i(24067),r=i(26839);class a{constructor(e){this.indexStarts=[0],this.vertexStarts=[0],this.vertexCount=0,this.instanceCount=0;let{attributes:t={}}=e;this.typedArrayManager=n.A,this.attributes={},this._attributeDefs=t,this.opts=e,this.updateGeometry(e)}updateGeometry(e){Object.assign(this.opts,e);let{data:t,buffers:i={},getGeometry:o,geometryBuffer:n,positionFormat:r,dataChanged:a,normalize:l=!0}=this.opts;if(this.data=t,this.getGeometry=o,this.positionSize=n&&n.size||("XY"===r?2:3),this.buffers=i,this.normalize=l,n&&((0,s.A)(t.startIndices),this.getGeometry=this.getGeometryFromBuffer(n),l||(i.vertexPositions=n)),this.geometryBuffer=i.vertexPositions,Array.isArray(a))for(let e of a)this._rebuildGeometry(e);else this._rebuildGeometry()}updatePartialGeometry({startRow:e,endRow:t}){this._rebuildGeometry({startRow:e,endRow:t})}getGeometryFromBuffer(e){let t=e.value||e;return ArrayBuffer.isView(t)?(0,o.I)(t,{size:this.positionSize,offset:e.offset,stride:e.stride,startIndices:this.data.startIndices}):null}_allocate(e,t){let{attributes:i,buffers:o,_attributeDefs:n,typedArrayManager:s}=this;for(let r in n)if(r in o)s.release(i[r]),i[r]=null;else{let o=n[r];o.copy=t,i[r]=s.allocate(i[r],e,o)}}_forEachGeometry(e,t,i){let{data:n,getGeometry:s}=this,{iterable:r,objectInfo:a}=(0,o.X)(n,t,i);for(let t of r)a.index++,e(s?s(t,a):null,a.index)}_rebuildGeometry(e){if(!this.data)return;let{indexStarts:t,vertexStarts:i,instanceCount:o}=this,{data:n,geometryBuffer:s}=this,{startRow:a=0,endRow:l=1/0}=e||{},c={};if(e||(t=[0],i=[0]),this.normalize||!s)this._forEachGeometry((e,t)=>{let o=e&&this.normalizeGeometry(e);c[t]=o,i[t+1]=i[t]+(o?this.getGeometrySize(o):0)},a,l),o=i[i.length-1];else if(o=(i=n.startIndices)[n.length]||0,ArrayBuffer.isView(s))o=o||s.length/this.positionSize;else if(s instanceof r.h){let e=4*this.positionSize;o=o||s.byteLength/e}else if(s.buffer){let e=s.stride||4*this.positionSize;o=o||s.buffer.byteLength/e}else if(s.value){let e=s.value,t=s.stride/e.BYTES_PER_ELEMENT||this.positionSize;o=o||e.length/t}this._allocate(o,!!e),this.indexStarts=t,this.vertexStarts=i,this.instanceCount=o;let p={};this._forEachGeometry((e,n)=>{let s=c[n]||e;p.vertexStart=i[n],p.indexStart=t[n],p.geometrySize=(n<i.length-1?i[n+1]:o)-i[n],p.geometryIndex=n,this.updateGeometryAttributes(s,p)},a,l),this.vertexCount=t[t.length-1]}}},6116(e,t,i){i.d(t,{A:()=>eq});var o=i(59452),n=i(25799),s=i(84175),r=i(46487),a=i(95335),l=i(9350),c=i(3459),p=i(54338),d=i(25337);let u=`\
layout(std140) uniform iconUniforms {
  float sizeScale;
  vec2 iconsTextureDim;
  float sizeBasis;
  float sizeMinPixels;
  float sizeMaxPixels;
  bool billboard;
  highp int sizeUnits;
  float alphaCutoff;
} icon;
`,f={name:"icon",vs:u,fs:u,uniformTypes:{sizeScale:"f32",iconsTextureDim:"vec2<f32>",sizeBasis:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",billboard:"f32",sizeUnits:"i32",alphaCutoff:"f32"}},g=`\
#version 300 es
#define SHADER_NAME icon-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceSizes;
in float instanceAngles;
in vec4 instanceColors;
in vec3 instancePickingColors;
in vec4 instanceIconFrames;
in float instanceColorModes;
in vec2 instanceOffsets;
in vec2 instancePixelOffset;
out float vColorMode;
out vec4 vColor;
out vec2 vTextureCoords;
out vec2 uv;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = angle * PI / 180.0;
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = instancePickingColors;
uv = positions;
vec2 iconSize = instanceIconFrames.zw;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * icon.sizeScale, icon.sizeUnits),
icon.sizeMinPixels, icon.sizeMaxPixels
);
float iconConstraint = icon.sizeBasis == 0.0 ? iconSize.x : iconSize.y;
float instanceScale = iconConstraint == 0.0 ? 0.0 : sizePixels / iconConstraint;
vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
pixelOffset += instancePixelOffset;
pixelOffset.y *= -1.0;
if (icon.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
DECKGL_FILTER_SIZE(offset_common, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vTextureCoords = mix(
instanceIconFrames.xy,
instanceIconFrames.xy + iconSize,
(positions.xy + 1.0) / 2.0
) / icon.iconsTextureDim;
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
vColorMode = instanceColorModes;
}
`,h=`\
#version 300 es
#define SHADER_NAME icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in float vColorMode;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
vec4 texColor = texture(iconsTexture, vTextureCoords);
vec3 color = mix(texColor.rgb, vColor.rgb, vColorMode);
float a = texColor.a * layer.opacity * vColor.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color, a);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,x=`\
struct IconUniforms {
  sizeScale: f32,
  iconsTextureDim: vec2<f32>,
  sizeBasis: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  billboard: i32,
  sizeUnits: i32,
  alphaCutoff: f32
};

@group(0) @binding(auto) var<uniform> icon: IconUniforms;
@group(0) @binding(auto) var iconsTexture : texture_2d<f32>;
@group(0) @binding(auto) var iconsTextureSampler : sampler;

fn rotate_by_angle(vertex: vec2<f32>, angle_deg: f32) -> vec2<f32> {
  let angle_radian = angle_deg * PI / 180.0;
  let c = cos(angle_radian);
  let s = sin(angle_radian);
  let rotation = mat2x2<f32>(vec2<f32>(c, s), vec2<f32>(-s, c));
  return rotation * vertex;
}

struct Attributes {
  @location(0) positions: vec2<f32>,

  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceSizes: f32,
  @location(4) instanceAngles: f32,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instancePickingColors: vec3<f32>,
  @location(7) instanceIconFrames: vec4<f32>,
  @location(8) instanceColorModes: f32,
  @location(9) instanceOffsets: vec2<f32>,
  @location(10) instancePixelOffset: vec2<f32>,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,

  @location(0) vColorMode: f32,
  @location(1) vColor: vec4<f32>,
  @location(2) vTextureCoords: vec2<f32>,
  @location(3) uv: vec2<f32>,
  @location(4) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(inp: Attributes) -> Varyings {
  // write geometry fields used by filters + FS
  geometry.worldPosition = inp.instancePositions;
  geometry.uv = inp.positions;
  geometry.pickingColor = inp.instancePickingColors;

  var outp: Varyings;
  outp.uv = inp.positions;

  let iconSize = inp.instanceIconFrames.zw;

  // convert size in meters to pixels, then clamp
  let sizePixels = clamp(
    project_unit_size_to_pixel(inp.instanceSizes * icon.sizeScale, icon.sizeUnits),
    icon.sizeMinPixels, icon.sizeMaxPixels
  );

  // scale icon height to match instanceSize
  let iconConstraint = select(iconSize.y, iconSize.x, icon.sizeBasis == 0.0);
  let instanceScale = select(sizePixels / iconConstraint, 0.0, iconConstraint == 0.0);

  // scale and rotate vertex in "pixel" units; then add per-instance pixel offset
  var pixelOffset = inp.positions / 2.0 * iconSize + inp.instanceOffsets;
  pixelOffset = rotate_by_angle(pixelOffset, inp.instanceAngles) * instanceScale;
  pixelOffset = pixelOffset + inp.instancePixelOffset;
  pixelOffset.y = pixelOffset.y * -1.0;

  if (icon.billboard != 0) {
    var pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0)); // TODO, &geometry.position);
    // DECKGL_FILTER_GL_POSITION(pos, geometry);

    var offset = vec3<f32>(pixelOffset, 0.0);
    // DECKGL_FILTER_SIZE(offset, geometry);
    let clipOffset = project_pixel_size_to_clipspace(offset.xy);
    pos = vec4<f32>(pos.x + clipOffset.x, pos.y + clipOffset.y, pos.z, pos.w);
    outp.position = pos;
  } else {
    var offset_common = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    // DECKGL_FILTER_SIZE(offset_common, geometry);
    var pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, offset_common); // TODO, &geometry.position);
    // DECKGL_FILTER_GL_POSITION(pos, geometry);
    outp.position = pos;
  }

  let uvMix = (inp.positions.xy + vec2<f32>(1.0, 1.0)) * 0.5;
  outp.vTextureCoords = mix(inp.instanceIconFrames.xy, inp.instanceIconFrames.xy + iconSize, uvMix) / icon.iconsTextureDim;

  outp.vColor = inp.instanceColors;
  // DECKGL_FILTER_COLOR(outp.vColor, geometry);

  outp.vColorMode = inp.instanceColorModes;
  outp.pickingColor = inp.instancePickingColors;

  return outp;
}

@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  // expose to deck.gl filter hooks
  geometry.uv = inp.uv;

  let texColor = textureSample(iconsTexture, iconsTextureSampler, inp.vTextureCoords);

  // if colorMode == 0, use pixel color from the texture
  // if colorMode == 1 (or picking), use texture as transparency mask
  let rgb = mix(texColor.rgb, inp.vColor.rgb, inp.vColorMode);
  let a = texColor.a * layer.opacity * inp.vColor.a;

  if (a < icon.alphaCutoff) {
    discard;
  }

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  var fragColor = deckgl_premultiplied_alpha(vec4<f32>(rgb, a));

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inp.pickingColor - highlightedObjectColor))) {
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

  return fragColor;
}
`;var v=i(58682),y=i(53439);let m=()=>{},P={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},_={x:0,y:0,width:0,height:0};function C(e){return e&&(e.id||e.url)}function b(e){let{device:t}=e;"webgl"===t.type?e.generateMipmapsWebGL():"webgpu"===t.type&&t.generateMipmapsWebGPU(e)}function L(e,t,i){for(let o=0;o<t.length;o++){let{icon:n,xOffset:s}=t[o];e[C(n)]={...n,x:s,y:i}}}class S{constructor(e,{onUpdate:t=m,onError:i=m}){this._loadOptions=null,this._texture=null,this._externalTexture=null,this._mapping={},this._samplerParameters=null,this._pendingCount=0,this._autoPacking=!1,this._xOffset=0,this._yOffset=0,this._rowHeight=0,this._buffer=4,this._canvasWidth=1024,this._canvasHeight=0,this._canvas=null,this.device=e,this.onUpdate=t,this.onError=i}finalize(){this._texture?.delete()}getTexture(){return this._texture||this._externalTexture}getIconMapping(e){let t=this._autoPacking?C(e):e;return this._mapping[t]||_}setProps({loadOptions:e,autoPacking:t,iconAtlas:i,iconMapping:o,textureParameters:n}){e&&(this._loadOptions=e),void 0!==t&&(this._autoPacking=t),o&&(this._mapping=o),i&&(this._texture?.delete(),this._texture=null,this._externalTexture=i),n&&(this._samplerParameters=n)}get isLoaded(){return 0===this._pendingCount}packIcons(e,t){if(!this._autoPacking||"u"<typeof document)return;let i=Object.values(function(e,t,i){if(!e||!t)return null;i=i||{};let o={},{iterable:n,objectInfo:s}=(0,y.X)(e);for(let e of n){s.index++;let n=t(e,s),r=C(n);if(!n)throw Error("Icon is missing.");if(!n.url)throw Error("Icon url is missing.");o[r]||i[r]&&n.url===i[r].url||(o[r]={...n,source:e,sourceIndex:s.index})}return o}(e,t,this._mapping)||{});if(i.length>0){let{mapping:e,xOffset:t,yOffset:o,rowHeight:n,canvasHeight:s}=function({icons:e,buffer:t,mapping:i={},xOffset:o=0,yOffset:n=0,rowHeight:s=0,canvasWidth:r}){let a=[];for(let l=0;l<e.length;l++){let c=e[l];if(!i[C(c)]){let{height:e,width:l}=c;o+l+t>r&&(L(i,a,n),o=0,n=s+n+t,s=0,a=[]),a.push({icon:c,xOffset:o}),o=o+l+t,s=Math.max(s,e)}}return a.length>0&&L(i,a,n),{mapping:i,rowHeight:s,xOffset:o,yOffset:n,canvasWidth:r,canvasHeight:Math.pow(2,Math.ceil(Math.log2(s+n+t)))}}({icons:i,buffer:this._buffer,canvasWidth:this._canvasWidth,mapping:this._mapping,rowHeight:this._rowHeight,xOffset:this._xOffset,yOffset:this._yOffset});this._rowHeight=n,this._mapping=e,this._xOffset=t,this._yOffset=o,this._canvasHeight=s,this._texture||(this._texture=this.device.createTexture({format:"rgba8unorm",data:null,width:this._canvasWidth,height:this._canvasHeight,sampler:this._samplerParameters||P,mipLevels:this.device.getMipLevelCount(this._canvasWidth,this._canvasHeight)})),this._texture.height!==this._canvasHeight&&(this._texture=function(e,t,i,o){let{width:n,height:s,device:r}=e,a=r.createTexture({format:"rgba8unorm",width:t,height:i,sampler:o,mipLevels:r.getMipLevelCount(t,i)}),l=r.createCommandEncoder();l.copyTextureToTexture({sourceTexture:e,destinationTexture:a,width:n,height:s});let c=l.finish();return r.submit(c),b(a),e.destroy(),a}(this._texture,this._canvasWidth,this._canvasHeight,this._samplerParameters||P)),this.onUpdate(!0),this._canvas=this._canvas||document.createElement("canvas"),this._loadIcons(i)}}_loadIcons(e){let t=this._canvas.getContext("2d",{willReadFrequently:!0});for(let i of e)this._pendingCount++,(0,v.H)(i.url,this._loadOptions).then(e=>{let o=C(i),n=this._mapping[o],{x:s,y:r,width:a,height:l}=n,{image:c,width:p,height:d}=function(e,t,i,o){let n=Math.min(i/t.width,o/t.height),s=Math.floor(t.width*n),r=Math.floor(t.height*n);return 1===n?{image:t,width:s,height:r}:(e.canvas.height=r,e.canvas.width=s,e.clearRect(0,0,s,r),e.drawImage(t,0,0,t.width,t.height,0,0,s,r),{image:e.canvas,width:s,height:r})}(t,e,a,l),u=s+(a-p)/2,f=r+(l-d)/2;this._texture?.copyExternalImage({image:c,x:u,y:f,width:p,height:d}),n.x=u,n.y=f,n.width=p,n.height=d,this._texture&&b(this._texture),this.onUpdate(p!==a||d!==l)}).catch(e=>{this.onError({url:i.url,source:i.source,sourceIndex:i.sourceIndex,loadOptions:this._loadOptions,error:e})}).finally(()=>{this._pendingCount--})}}let z=[0,0,0,255],A={iconAtlas:{type:"image",value:null,async:!0},iconMapping:{type:"object",value:{},async:!0},sizeScale:{type:"number",value:1,min:0},billboard:!0,sizeUnits:"pixels",sizeBasis:"height",sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},alphaCutoff:{type:"number",value:.05,min:0,max:1},getPosition:{type:"accessor",value:e=>e.position},getIcon:{type:"accessor",value:e=>e.icon},getColor:{type:"accessor",value:z},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},onIconError:{type:"function",value:null,optional:!0},textureParameters:{type:"object",ignore:!0,value:null}};class w extends n.A{getShaders(){return super.getShaders({vs:g,fs:h,source:x,modules:[s.A,r.A,a.A,f]})}initializeState(){this.state={iconManager:new S(this.context.device,{onUpdate:this._onUpdate.bind(this),onError:this._onError.bind(this)})},this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceIconDefs:{size:7,accessor:"getIcon",transform:this.getInstanceIconDef,shaderAttributes:{instanceOffsets:{size:2,elementOffset:0},instanceIconFrames:{size:4,elementOffset:2},instanceColorModes:{size:1,elementOffset:6}}},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:z},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instancePixelOffset:{size:2,transition:!0,accessor:"getPixelOffset"}})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,n=this.getAttributeManager(),{iconAtlas:s,iconMapping:r,data:a,getIcon:l,textureParameters:c}=t,{iconManager:p}=this.state;if("string"==typeof s)return;let d=s||this.internalState.isAsyncPropLoading("iconAtlas");p.setProps({loadOptions:t.loadOptions,autoPacking:!d,iconAtlas:s,iconMapping:d?r:null,textureParameters:c}),d?i.iconMapping!==t.iconMapping&&n.invalidate("getIcon"):(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getIcon))&&p.packIcons(a,l),o.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),n.invalidateAll())}get isLoaded(){return super.isLoaded&&this.state.iconManager.isLoaded}finalizeState(e){super.finalizeState(e),this.state.iconManager.finalize()}draw({uniforms:e}){let{sizeScale:t,sizeBasis:i,sizeMinPixels:o,sizeMaxPixels:n,sizeUnits:s,billboard:r,alphaCutoff:a}=this.props,{iconManager:c}=this.state,p=c.getTexture();if(p){let e=this.state.model,c={iconsTexture:p,iconsTextureDim:[p.width,p.height],sizeUnits:l.p5[s],sizeScale:t,sizeBasis:+("height"===i),sizeMinPixels:o,sizeMaxPixels:n,billboard:r,alphaCutoff:a};e.shaderInputs.setProps({icon:c}),e.draw(this.context.renderPass)}}_getModel(){return new p.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new d.V({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([-1,-1,1,-1,-1,1,1,1])}}}),isInstanced:!0})}_onUpdate(e){e?(this.getAttributeManager()?.invalidate("getIcon"),this.setNeedsUpdate()):this.setNeedsRedraw()}_onError(e){let t=this.getCurrentLayer()?.props.onIconError;t?t(e):c.A.error(e.error.message)()}getInstanceIconDef(e){let{x:t,y:i,width:o,height:n,mask:s,anchorX:r=o/2,anchorY:a=n/2}=this.state.iconManager.getIconMapping(e);return[o/2-r,n/2-a,t,i,o,n,+!!s]}}w.defaultProps=A,w.layerName="IconLayer";let I=w,M=`\
layout(std140) uniform scatterplotUniforms {
  float radiusScale;
  float radiusMinPixels;
  float radiusMaxPixels;
  float lineWidthScale;
  float lineWidthMinPixels;
  float lineWidthMaxPixels;
  float stroked;
  float filled;
  bool antialiasing;
  bool billboard;
  highp int radiusUnits;
  highp int lineWidthUnits;
} scatterplot;
`,O={name:"scatterplot",vs:M,fs:M,source:"",uniformTypes:{radiusScale:"f32",radiusMinPixels:"f32",radiusMaxPixels:"f32",lineWidthScale:"f32",lineWidthMinPixels:"f32",lineWidthMaxPixels:"f32",stroked:"f32",filled:"f32",antialiasing:"f32",billboard:"f32",radiusUnits:"i32",lineWidthUnits:"i32"}},E=`\
#version 300 es
#define SHADER_NAME scatterplot-layer-vertex-shader
in vec3 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceRadius;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in vec3 instancePickingColors;
out vec4 vFillColor;
out vec4 vLineColor;
out vec2 unitPosition;
out float innerUnitRadius;
out float outerRadiusPixels;
void main(void) {
geometry.worldPosition = instancePositions;
outerRadiusPixels = clamp(
project_size_to_pixel(scatterplot.radiusScale * instanceRadius, scatterplot.radiusUnits),
scatterplot.radiusMinPixels, scatterplot.radiusMaxPixels
);
float lineWidthPixels = clamp(
project_size_to_pixel(scatterplot.lineWidthScale * instanceLineWidths, scatterplot.lineWidthUnits),
scatterplot.lineWidthMinPixels, scatterplot.lineWidthMaxPixels
);
outerRadiusPixels += scatterplot.stroked * lineWidthPixels / 2.0;
float edgePadding = scatterplot.antialiasing ? (outerRadiusPixels + SMOOTH_EDGE_RADIUS) / outerRadiusPixels : 1.0;
unitPosition = edgePadding * positions.xy;
geometry.uv = unitPosition;
geometry.pickingColor = instancePickingColors;
innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / outerRadiusPixels;
if (scatterplot.billboard) {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = edgePadding * positions * outerRadiusPixels;
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset = edgePadding * positions * project_pixel_size(outerRadiusPixels);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vFillColor, geometry);
vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,T=`\
#version 300 es
#define SHADER_NAME scatterplot-layer-fragment-shader
precision highp float;
in vec4 vFillColor;
in vec4 vLineColor;
in vec2 unitPosition;
in float innerUnitRadius;
in float outerRadiusPixels;
out vec4 fragColor;
void main(void) {
geometry.uv = unitPosition;
float distToCenter = length(unitPosition) * outerRadiusPixels;
float inCircle = scatterplot.antialiasing ?
smoothedge(distToCenter, outerRadiusPixels) :
step(distToCenter, outerRadiusPixels);
if (inCircle == 0.0) {
discard;
}
if (scatterplot.stroked > 0.5) {
float isLine = scatterplot.antialiasing ?
smoothedge(innerUnitRadius * outerRadiusPixels, distToCenter) :
step(innerUnitRadius * outerRadiusPixels, distToCenter);
if (scatterplot.filled > 0.5) {
fragColor = mix(vFillColor, vLineColor, isLine);
} else {
if (isLine == 0.0) {
discard;
}
fragColor = vec4(vLineColor.rgb, vLineColor.a * isLine);
}
} else if (scatterplot.filled < 0.5) {
discard;
} else {
fragColor = vFillColor;
}
fragColor.a *= inCircle;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,R=`\
// Main shaders

struct ScatterplotUniforms {
  radiusScale: f32,
  radiusMinPixels: f32,
  radiusMaxPixels: f32,
  lineWidthScale: f32,
  lineWidthMinPixels: f32,
  lineWidthMaxPixels: f32,
  stroked: f32,
  filled: i32,
  antialiasing: i32,
  billboard: i32,
  radiusUnits: i32,
  lineWidthUnits: i32,
};

struct ConstantAttributeUniforms {
 instancePositions: vec3<f32>,
 instancePositions64Low: vec3<f32>,
 instanceRadius: f32,
 instanceLineWidths: f32,
 instanceFillColors: vec4<f32>,
 instanceLineColors: vec4<f32>,
 instancePickingColors: vec3<f32>,

 instancePositionsConstant: i32,
 instancePositions64LowConstant: i32,
 instanceRadiusConstant: i32,
 instanceLineWidthsConstant: i32,
 instanceFillColorsConstant: i32,
 instanceLineColorsConstant: i32,
 instancePickingColorsConstant: i32
};

@group(0) @binding(0) var<uniform> scatterplot: ScatterplotUniforms;

struct ConstantAttributes {
  instancePositions: vec3<f32>,
  instancePositions64Low: vec3<f32>,
  instanceRadius: f32,
  instanceLineWidths: f32,
  instanceFillColors: vec4<f32>,
  instanceLineColors: vec4<f32>,
  instancePickingColors: vec3<f32>
};

const constants = ConstantAttributes(
  vec3<f32>(0.0),
  vec3<f32>(0.0),
  0.0,
  0.0,
  vec4<f32>(0.0, 0.0, 0.0, 1.0),
  vec4<f32>(0.0, 0.0, 0.0, 1.0),
  vec3<f32>(0.0)
);

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions: vec3<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceRadius: f32,
  @location(4) instanceLineWidths: f32,
  @location(5) instanceFillColors: vec4<f32>,
  @location(6) instanceLineColors: vec4<f32>,
  @location(7) instancePickingColors: vec3<f32>,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vFillColor: vec4<f32>,
  @location(1) vLineColor: vec4<f32>,
  @location(2) unitPosition: vec2<f32>,
  @location(3) innerUnitRadius: f32,
  @location(4) outerRadiusPixels: f32,
  @location(5) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  // Draw an inline geometry constant array clip space triangle to verify that rendering works.
  // var positions = array<vec2<f32>, 3>(vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));
  // if (attributes.instanceIndex == 0) {
  //   varyings.position = vec4<f32>(positions[attributes.vertexIndex], 0.0, 1.0);
  //   return varyings;
  // }

  geometry.worldPosition = attributes.instancePositions;

  // Multiply out radius and clamp to limits
  varyings.outerRadiusPixels = clamp(
    project_unit_size_to_pixel(scatterplot.radiusScale * attributes.instanceRadius, scatterplot.radiusUnits),
    scatterplot.radiusMinPixels, scatterplot.radiusMaxPixels
  );

  // Multiply out line width and clamp to limits
  let lineWidthPixels = clamp(
    project_unit_size_to_pixel(scatterplot.lineWidthScale * attributes.instanceLineWidths, scatterplot.lineWidthUnits),
    scatterplot.lineWidthMinPixels, scatterplot.lineWidthMaxPixels
  );

  // outer radius needs to offset by half stroke width
  varyings.outerRadiusPixels += scatterplot.stroked * lineWidthPixels / 2.0;
  // Expand geometry to accommodate edge smoothing
  let edgePadding = select(
    (varyings.outerRadiusPixels + SMOOTH_EDGE_RADIUS) / varyings.outerRadiusPixels,
    1.0,
    scatterplot.antialiasing != 0
  );

  // position on the containing square in [-1, 1] space
  varyings.unitPosition = edgePadding * attributes.positions.xy;
  geometry.uv = varyings.unitPosition;
  geometry.pickingColor = attributes.instancePickingColors;

  varyings.innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / varyings.outerRadiusPixels;

  if (scatterplot.billboard != 0) {
    varyings.position = project_position_to_clipspace(attributes.instancePositions, attributes.instancePositions64Low, vec3<f32>(0.0)); // TODO , geometry.position);
    // DECKGL_FILTER_GL_POSITION(varyings.position, geometry);
    let offset = attributes.positions; // * edgePadding * varyings.outerRadiusPixels;
    // DECKGL_FILTER_SIZE(offset, geometry);
    let clipPixels = project_pixel_size_to_clipspace(offset.xy);
    varyings.position.x = clipPixels.x;
    varyings.position.y = clipPixels.y;
  } else {
    let offset = edgePadding * attributes.positions * project_pixel_size_float(varyings.outerRadiusPixels);
    // DECKGL_FILTER_SIZE(offset, geometry);
    varyings.position = project_position_to_clipspace(attributes.instancePositions, attributes.instancePositions64Low, offset); // TODO , geometry.position);
    // DECKGL_FILTER_GL_POSITION(varyings.position, geometry);
  }

  // Apply opacity to instance color, or return instance picking color
  varyings.vFillColor = vec4<f32>(attributes.instanceFillColors.rgb, attributes.instanceFillColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(varyings.vFillColor, geometry);
  varyings.vLineColor = vec4<f32>(attributes.instanceLineColors.rgb, attributes.instanceLineColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(varyings.vLineColor, geometry);
  varyings.pickingColor = attributes.instancePickingColors;

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  // var geometry: Geometry;
  // geometry.uv = unitPosition;

  let distToCenter = length(varyings.unitPosition) * varyings.outerRadiusPixels;
  let inCircle = select(
    smoothedge(distToCenter, varyings.outerRadiusPixels),
    step(distToCenter, varyings.outerRadiusPixels),
    scatterplot.antialiasing != 0
  );

  if (inCircle == 0.0) {
    discard;
  }

  var fragColor: vec4<f32>;

  if (scatterplot.stroked != 0) {
    let isLine = select(
      smoothedge(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
      step(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
      scatterplot.antialiasing != 0
    );

    if (scatterplot.filled != 0) {
      fragColor = mix(varyings.vFillColor, varyings.vLineColor, isLine);
    } else {
      if (isLine == 0.0) {
        discard;
      }
      fragColor = vec4<f32>(varyings.vLineColor.rgb, varyings.vLineColor.a * isLine);
    }
  } else if (scatterplot.filled == 0) {
    discard;
  } else {
    fragColor = varyings.vFillColor;
  }

  fragColor.a *= inCircle;

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
  // return vec4<f32>(0, 0, 1, 1);
}
`,F=[0,0,0,255],k={radiusUnits:"meters",radiusScale:{type:"number",min:0,value:1},radiusMinPixels:{type:"number",min:0,value:0},radiusMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},lineWidthUnits:"meters",lineWidthScale:{type:"number",min:0,value:1},lineWidthMinPixels:{type:"number",min:0,value:0},lineWidthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},stroked:!1,filled:!0,billboard:!1,antialiasing:!0,getPosition:{type:"accessor",value:e=>e.position},getRadius:{type:"accessor",value:1},getFillColor:{type:"accessor",value:F},getLineColor:{type:"accessor",value:F},getLineWidth:{type:"accessor",value:1},strokeWidth:{deprecatedFor:"getLineWidth"},outline:{deprecatedFor:"stroked"},getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class B extends n.A{getShaders(){return super.getShaders({vs:E,fs:T,source:R,modules:[s.A,r.A,a.A,O]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceRadius:{size:1,transition:!0,accessor:"getRadius",defaultValue:1},instanceFillColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e),e.changeFlags.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{radiusUnits:t,radiusScale:i,radiusMinPixels:o,radiusMaxPixels:n,stroked:s,filled:r,billboard:a,antialiasing:c,lineWidthUnits:p,lineWidthScale:d,lineWidthMinPixels:u,lineWidthMaxPixels:f}=this.props,g={stroked:s,filled:r,billboard:a,antialiasing:c,radiusUnits:l.p5[t],radiusScale:i,radiusMinPixels:o,radiusMaxPixels:n,lineWidthUnits:l.p5[p],lineWidthScale:d,lineWidthMinPixels:u,lineWidthMaxPixels:f},h=this.state.model;h.shaderInputs.setProps({scatterplot:g}),h.draw(this.context.renderPass)}_getModel(){return new p.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new d.V({topology:"triangle-strip",attributes:{positions:{size:3,value:new Float32Array([-1,-1,0,1,-1,0,-1,1,0,1,1,0])}}}),isInstanced:!0})}}B.defaultProps=k,B.layerName="ScatterplotLayer";let G=`\
layout(std140) uniform sdfUniforms {
  float gamma;
  bool enabled;
  float buffer;
  float outlineBuffer;
  vec4 outlineColor;
} sdf;
`,W={name:"sdf",vs:G,fs:G,uniformTypes:{gamma:"f32",enabled:"f32",buffer:"f32",outlineBuffer:"f32",outlineColor:"vec4<f32>"}},D={none:0,start:1,center:2,end:3},j={name:"text",vs:`\
layout(std140) uniform textUniforms {
  highp vec2 cutoffPixels;
  highp ivec2 align;
  highp float fontSize;
  bool flipY;
} text;

#define ALIGN_MODE_START ${D.start}
#define ALIGN_MODE_CENTER ${D.center}
#define ALIGN_MODE_END ${D.end}
`,getUniforms:({contentCutoffPixels:e=[0,0],contentAlignHorizontal:t="none",contentAlignVertical:i="none",fontSize:o,viewport:n})=>({cutoffPixels:e,align:[D[t],D[i]],fontSize:o,flipY:n?.flipY??!1}),uniformTypes:{cutoffPixels:"vec2<f32>",align:"vec2<i32>",fontSize:"f32",flipY:"f32"}},N=`\
#version 300 es
#define SHADER_NAME multi-icon-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceSizes;
in float instanceAngles;
in vec4 instanceColors;
in vec3 instancePickingColors;
in vec4 instanceIconFrames;
in float instanceColorModes;
in vec2 instanceOffsets;
in vec2 instancePixelOffset;
in vec4 instanceClipRect;
out float vColorMode;
out vec4 vColor;
out vec2 vTextureCoords;
out vec2 uv;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = angle * PI / 180.0;
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
float getPixelOffsetFromAlignment(float anchor, float extent, float clipStart, float clipEnd, int mode) {
if (clipEnd < clipStart) return 0.0;
if (mode == ALIGN_MODE_START) {
return max(- (anchor + clipStart), 0.0);
}
if (mode == ALIGN_MODE_CENTER) {
float _min = max(0., anchor + clipStart);
float _max = min(extent, anchor + clipEnd);
return _min < _max ? (_min + _max) / 2.0 - anchor : 0.0;
}
if (mode == ALIGN_MODE_END) {
return min(extent - (anchor + clipEnd), 0.);
}
return 0.0;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = instancePickingColors;
uv = positions;
vec2 iconSize = instanceIconFrames.zw;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * icon.sizeScale, icon.sizeUnits),
icon.sizeMinPixels, icon.sizeMaxPixels
);
float instanceScale = sizePixels / text.fontSize;
vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
pixelOffset += instancePixelOffset;
pixelOffset.y *= -1.0;
vec2 anchorPosScreen;
if (icon.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
anchorPosScreen = gl_Position.xy / gl_Position.w;
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
if (text.flipY) {
offset_common.y *= -1.;
}
DECKGL_FILTER_SIZE(offset_common, geometry);
vec4 anchorPos = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0));
anchorPosScreen = anchorPos.xy / anchorPos.w;
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
anchorPosScreen = vec2(anchorPosScreen.x + 1.0, 1.0 - anchorPosScreen.y) / 2.0 * project.viewportSize / project.devicePixelRatio;
vec2 xy = project_size_to_pixel(instanceClipRect.xy);
vec2 wh = project_size_to_pixel(instanceClipRect.zw);
if (text.flipY) {
xy.y = -xy.y - wh.y;
}
if (text.align.x > 0 || text.align.y > 0) {
vec2 viewportPixels = project.viewportSize / project.devicePixelRatio;
vec2 scrollPixels = vec2(
getPixelOffsetFromAlignment(anchorPosScreen.x, viewportPixels.x, xy.x, xy.x + wh.x, text.align.x),
-getPixelOffsetFromAlignment(anchorPosScreen.y, viewportPixels.y, -xy.y - wh.y, -xy.y, text.align.y)
);
pixelOffset += scrollPixels;
gl_Position.xy += project_pixel_size_to_clipspace(scrollPixels);
}
if (instanceClipRect.z >= 0.) {
if (pixelOffset.x < xy.x || pixelOffset.x > xy.x + wh.x) {
gl_Position = vec4(0.0);
}
else if (text.cutoffPixels.x > 0.) {
float vpWidth = project.viewportSize.x / project.devicePixelRatio;
float l = max(anchorPosScreen.x + xy.x, 0.0);
float r = min(anchorPosScreen.x + xy.x + wh.x, vpWidth);
if (r - l < text.cutoffPixels.x) {
gl_Position = vec4(0.0);
}
}
}
if (instanceClipRect.w >= 0.) {
if (pixelOffset.y < xy.y || pixelOffset.y > xy.y + wh.y) {
gl_Position = vec4(0.0);
}
else if (text.cutoffPixels.y > 0.) {
float vpHeight = project.viewportSize.y / project.devicePixelRatio;
float t = max(anchorPosScreen.y - xy.y - wh.y, 0.0);
float b = min(anchorPosScreen.y - xy.y, vpHeight);
if (b - t < text.cutoffPixels.y) {
gl_Position = vec4(0.0);
}
}
}
vTextureCoords = mix(
instanceIconFrames.xy,
instanceIconFrames.xy + iconSize,
(positions.xy + 1.0) / 2.0
) / icon.iconsTextureDim;
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
vColorMode = instanceColorModes;
}
`,U=`\
#version 300 es
#define SHADER_NAME multi-icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
if (!bool(picking.isActive)) {
float alpha = texture(iconsTexture, vTextureCoords).a;
vec4 color = vColor;
if (sdf.enabled) {
float distance = alpha;
alpha = smoothstep(sdf.buffer - sdf.gamma, sdf.buffer + sdf.gamma, distance);
if (sdf.outlineBuffer > 0.0) {
float inFill = alpha;
float inBorder = smoothstep(sdf.outlineBuffer - sdf.gamma, sdf.outlineBuffer + sdf.gamma, distance);
color = mix(sdf.outlineColor, vColor, inFill);
alpha = inBorder;
}
}
float a = alpha * color.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color.rgb, a * layer.opacity);
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;class V extends I{getShaders(){let e=super.getShaders();return{...e,modules:[...e.modules,j,W],vs:N,fs:U}}initializeState(){super.initializeState();let e=this.getAttributeManager();e.attributes.instanceIconDefs.settings.update=this.calculateInstanceIconDefs,e.addInstanced({instancePickingColors:{type:"uint8",size:4,accessor:(e,{index:t,target:i})=>this.encodePickingColor(t,i)},instanceClipRect:{size:4,accessor:"getContentBox",defaultValue:[0,0,-1,-1]}})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,{outlineColor:n}=t;if(o.updateTriggersChanged&&(o.updateTriggersChanged.getIcon||o.updateTriggersChanged.getIconOffsets)&&this.getAttributeManager().invalidate("instanceIconDefs"),n!==i.outlineColor){let e=[n[0]/255,n[1]/255,n[2]/255,(n[3]??255)/255];this.setState({outlineColor:e})}!t.sdf&&t.outlineWidth&&c.A.warn(`${this.id}: fontSettings.sdf is required to render outline`)()}draw(e){let{sdf:t,smoothing:i,fontSize:o,outlineWidth:n,contentCutoffPixels:s,contentAlignHorizontal:r,contentAlignVertical:a}=this.props,{outlineColor:l}=this.state,c=n?Math.max(i,.75*(1-n)):-1,p=this.state.model,d={buffer:.75,outlineBuffer:c,gamma:i,enabled:!!t,outlineColor:l},u={contentCutoffPixels:s,contentAlignHorizontal:r,contentAlignVertical:a,fontSize:o,viewport:this.context.viewport};if(p.shaderInputs.setProps({sdf:d,text:u}),super.draw(e),t&&n){let{iconManager:e}=this.state;e.getTexture()&&(p.shaderInputs.setProps({sdf:{...d,outlineBuffer:.75}}),p.draw(this.context.renderPass))}}calculateInstanceIconDefs(e,{startRow:t,endRow:i}){let{data:o,getIcon:n,getIconOffsets:s}=this.props,r=e.getVertexOffset(t),a=e.value,{iterable:l,objectInfo:c}=(0,y.X)(o,t,i);for(let t of l){c.index++;let i=n(t,c),o=s(t,c);if(i){let t=0;for(let n of Array.from(i)){let i=super.getInstanceIconDef(n);i[0]=o[2*t],i[1]+=o[2*t+1],i[6]=1,a.set(i,r),r+=e.size,t++}}}}}V.defaultProps={getIconOffsets:{type:"accessor",value:e=>e.offsets},getContentBox:{type:"accessor",value:[0,0,-1,-1]},fontSize:1,alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:"color",value:[0,0,0,255]},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none"},V.layerName="MultiIconLayer";let K=new Float64Array(256);for(let e=0;e<256;e++){let t=.5-Math.pow(e/255,1/2.2);K[e]=t*Math.abs(t)}K[255]=-1e20;class Z{constructor({fontSize:e=24,buffer:t=3,radius:i=8,cutoff:o=.25,fontFamily:n="sans-serif",fontWeight:s="normal",fontStyle:r="normal",lang:a=null}={}){this.buffer=t,this.radius=i,this.cutoff=o,this.lang=a;let l=this.size=e+4*t,c=this._createCanvas(l),p=this.ctx=c.getContext("2d",{willReadFrequently:!0});p.font=`${r} ${s} ${e}px ${n}`,p.textBaseline="alphabetic",p.textAlign="left",p.fillStyle="black",this.gridOuter=new Float64Array(l*l),this.gridInner=new Float64Array(l*l),this.f=new Float64Array(l),this.z=new Float64Array(l+1),this.v=new Uint16Array(l)}_createCanvas(e){if("u">typeof OffscreenCanvas)return new OffscreenCanvas(e,e);let t=document.createElement("canvas");return t.width=t.height=e,t}draw(e){let{width:t,actualBoundingBoxAscent:i,actualBoundingBoxDescent:o,actualBoundingBoxLeft:n,actualBoundingBoxRight:s}=this.ctx.measureText(e),r=Math.ceil(i),a=Math.floor(n),l=Math.max(0,Math.min(this.size-this.buffer,Math.ceil(s)-a)),c=Math.max(0,Math.min(this.size-this.buffer,r+Math.ceil(o))),p=l+2*this.buffer,d=c+2*this.buffer,u=Math.max(p*d,0),f=new Uint8ClampedArray(u),g={data:f,width:p,height:d,glyphWidth:l,glyphHeight:c,glyphTop:r,glyphLeft:a,glyphAdvance:t};if(0===l||0===c)return g;let{ctx:h,buffer:x,gridInner:v,gridOuter:y}=this;this.lang&&(h.lang=this.lang),h.clearRect(x,x,l,c),h.fillText(e,x-a,x+r);let m=h.getImageData(x,x,l,c);y.fill(1e20,0,u),v.fill(0,0,u);let P=3;for(let e=0;e<c;e++){let t=(e+x)*p+x;for(let e=0;e<l;e++,P+=4,t++){let e=m.data[P];if(0===e)continue;let i=K[e];y[t]=Math.max(0,i),v[t]=Math.max(0,-i)}}H(y,0,0,p,d,p,this.f,this.v,this.z),H(v,x,x,l,c,p,this.f,this.v,this.z);let _=255/this.radius,C=255*(1-this.cutoff);for(let e=0;e<u;e++){let t=Math.sqrt(y[e])-Math.sqrt(v[e]);f[e]=Math.round(C-_*t)}return g}}function H(e,t,i,o,n,s,r,a,l){for(let c=t;c<t+o;c++)$(e,i*s+c,s,n,r,a,l);for(let c=i;c<i+n;c++)$(e,c*s+t,1,o,r,a,l)}function $(e,t,i,o,n,s,r){s[0]=0,r[0]=-1e20,r[1]=1e20,n[0]=e[t];for(let a=1,l=0,c=0;a<o;a++){n[a]=e[t+a*i];let o=a*a;do{let e=s[l];c=(n[a]-n[e]+o-e*e)/(a-e)/2}while(c<=r[l]&&--l>-1)s[++l]=a,r[l]=c,r[l+1]=1e20}for(let a=0,l=0;a<o;a++){for(;r[l+1]<a;)l++;let o=s[l],c=a-o;e[t+a*i]=n[o]+c*c}}let J=[];function X(e,t,i,o){let n=0;for(let s=t;s<i;s++){let t=e[s];n+=o[t]?.advance||0}return n}function Y(e,t,i,o,n,s){let r=t,a=0;for(let l=t;l<i;l++){let t=X(e,l,l+1,n);a+t>o&&(r<l&&s.push(l),r=l,a=0),a+=t}return a}class q{constructor(e=5){this._cache={},this._order=[],this.limit=e}get(e){let t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?this.delete(e):Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e)}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){let t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}}let Q={fontFamily:"Monaco, monospace",fontWeight:"normal",characterSet:function(){let e=[];for(let t=32;t<128;t++)e.push(String.fromCharCode(t));return e}(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},ee=new q(3);function et(e,t,i,o){e.font=`${o} ${i}px ${t}`,e.fillStyle="#000",e.textBaseline="alphabetic",e.textAlign="left"}class ei{constructor(){this.props={...Q}}get atlas(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}setProps(e={}){Object.assign(this.props,e),e._getFontRenderer&&(this._getFontRenderer=e._getFontRenderer),this._key=this._getKey();let t=function(e,t){let i;i=new Set("string"==typeof t?Array.from(t):t);let o=ee.get(e);if(!o)return i;for(let e in o.mapping)i.has(e)&&i.delete(e);return i}(this._key,this.props.characterSet),i=ee.get(this._key);if(i&&0===t.size){this._atlas!==i&&(this._atlas=i);return}let o=this._generateFontAtlas(t,i);this._atlas=o,ee.set(this._key,o)}_generateFontAtlas(e,t){let i,{fontFamily:o,fontWeight:n,fontSize:s,buffer:r,sdf:a,radius:l,cutoff:c}=this.props,p=t&&t.data;p||((p=document.createElement("canvas")).width=1024);let d=p.getContext("2d",{willReadFrequently:!0});et(d,o,s,n);let u=e=>(function(e,t,i){if(void 0===i){let i=e.measureText("A");return i.fontBoundingBoxAscent?{advance:0,width:0,ascent:Math.ceil(i.fontBoundingBoxAscent),descent:Math.ceil(i.fontBoundingBoxDescent)}:{advance:0,width:0,ascent:.9*t,descent:.3*t}}let o=e.measureText(i);return o.actualBoundingBoxAscent?{advance:o.width,width:Math.ceil(o.actualBoundingBoxRight-o.actualBoundingBoxLeft),ascent:Math.ceil(o.actualBoundingBoxAscent),descent:Math.ceil(o.actualBoundingBoxDescent)}:{advance:o.width,width:o.width,ascent:.9*t,descent:.3*t}})(d,s,e);this._getFontRenderer?i=this._getFontRenderer(this.props):a&&(i={measure:u,draw:function({fontSize:e,buffer:t,radius:i,cutoff:o,fontFamily:n,fontWeight:s}){let r=new Z({fontSize:e,buffer:t,radius:i,cutoff:o,fontFamily:n,fontWeight:`${s}`});return e=>{let{data:i,width:o,height:n}=r.draw(e),s=new ImageData(o,n);for(let e=0;e<i.length;e++)s.data[4*e+3]=i[e];return{data:s,left:t,top:t}}}(this.props)});let{mapping:f,canvasHeight:g,xOffset:h,yOffsetMin:x,yOffsetMax:v}=function({characterSet:e,measureText:t,buffer:i,maxCanvasWidth:o,mapping:n={},xOffset:s=0,yOffsetMin:r=0,yOffsetMax:a=0}){let l=s,c=r,p=a;for(let s of e)if(!n[s]){let{advance:e,width:r,ascent:a,descent:d}=t(s),u=a+d;l+r+2*i>o&&(l=0,c=p),n[s]={x:l+i,y:c+i,width:r,height:u,advance:e,anchorX:r/2,anchorY:a},l+=r+2*i,p=Math.max(p,c+u+2*i)}return{mapping:n,xOffset:l,yOffsetMin:c,yOffsetMax:p,canvasHeight:Math.pow(2,Math.ceil(Math.log2(p)))}}({measureText:e=>i?i.measure(e):u(e),buffer:r,characterSet:e,maxCanvasWidth:1024,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffsetMin:t.yOffsetMin,yOffsetMax:t.yOffsetMax}});if(p.height!==g){let e=p.height>0?d.getImageData(0,0,p.width,p.height):null;p.height=g,e&&d.putImageData(e,0,0)}if(et(d,o,s,n),i)for(let t of e){let e=f[t],{data:o,left:n=0,top:s=0}=i.draw(t),r=e.x-n,a=e.y-s,l=Math.max(0,Math.round(r)),c=Math.max(0,Math.round(a)),u=Math.min(o.width,p.width-l),g=Math.min(o.height,p.height-c);d.putImageData(o,l,c,0,0,u,g),e.x+=l-r,e.y+=c-a}else for(let t of e){let e=f[t];d.fillText(t,e.x,e.y+e.anchorY)}let y=i?i.measure():u();return{baselineOffset:(y.ascent-y.descent)/2,xOffset:h,yOffsetMin:x,yOffsetMax:v,mapping:f,data:p,width:p.width,height:p.height}}_getKey(){let{fontFamily:e,fontWeight:t,fontSize:i,buffer:o,sdf:n,radius:s,cutoff:r}=this.props;return n?`${e} ${t} ${i} ${o} ${s} ${r}`:`${e} ${t} ${i} ${o}`}}let eo=`\
layout(std140) uniform textBackgroundUniforms {
  bool billboard;
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  vec4 borderRadius;
  vec4 padding;
  highp int sizeUnits;
  bool stroked;
} textBackground;
`,en={name:"textBackground",vs:eo,fs:eo,uniformTypes:{billboard:"f32",sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",borderRadius:"vec4<f32>",padding:"vec4<f32>",sizeUnits:"i32",stroked:"f32"}},es=`\
#version 300 es
#define SHADER_NAME text-background-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceRects;
in vec4 instanceClipRect;
in float instanceSizes;
in float instanceAngles;
in vec2 instancePixelOffsets;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in vec3 instancePickingColors;
out vec4 vFillColor;
out vec4 vLineColor;
out float vLineWidth;
out vec2 uv;
out vec2 dimensions;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = radians(angle);
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = instancePickingColors;
uv = positions;
vLineWidth = instanceLineWidths;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * textBackground.sizeScale, textBackground.sizeUnits),
textBackground.sizeMinPixels, textBackground.sizeMaxPixels
);
float instanceScale = sizePixels / text.fontSize;
dimensions = instanceRects.zw * instanceScale + textBackground.padding.xy + textBackground.padding.zw;
vec2 pixelOffset = (positions * instanceRects.zw + instanceRects.xy) * instanceScale + mix(-textBackground.padding.xy, textBackground.padding.zw, positions);
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles);
pixelOffset += instancePixelOffsets;
pixelOffset.y *= -1.0;
vec2 xy = project_size_to_pixel(instanceClipRect.xy);
vec2 wh = project_size_to_pixel(instanceClipRect.zw);
if (text.flipY) {
xy.y = -xy.y - wh.y;
}
if (instanceClipRect.z >= 0.0) {
dimensions.x = wh.x;
pixelOffset.x = xy.x + uv.x * wh.x + mix(-textBackground.padding.x, textBackground.padding.z, uv.x);
}
if (instanceClipRect.w >= 0.0) {
dimensions.y = wh.y;
pixelOffset.y = xy.y + uv.y * wh.y + mix(-textBackground.padding.y, textBackground.padding.w, uv.y);
}
if (textBackground.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
if (text.flipY) {
offset_common.y *= -1.;
}
DECKGL_FILTER_SIZE(offset_common, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vFillColor, geometry);
vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,er=`\
#version 300 es
#define SHADER_NAME text-background-layer-fragment-shader
precision highp float;
in vec4 vFillColor;
in vec4 vLineColor;
in float vLineWidth;
in vec2 uv;
in vec2 dimensions;
out vec4 fragColor;
float round_rect(vec2 p, vec2 size, vec4 radii) {
vec2 pixelPositionCB = (p - 0.5) * size;
vec2 sizeCB = size * 0.5;
float maxBorderRadius = min(size.x, size.y) * 0.5;
vec4 borderRadius = vec4(min(radii, maxBorderRadius));
borderRadius.xy =
(pixelPositionCB.x > 0.0) ? borderRadius.xy : borderRadius.zw;
borderRadius.x = (pixelPositionCB.y > 0.0) ? borderRadius.x : borderRadius.y;
vec2 q = abs(pixelPositionCB) - sizeCB + borderRadius.x;
return -(min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - borderRadius.x);
}
float rect(vec2 p, vec2 size) {
vec2 pixelPosition = p * size;
return min(min(pixelPosition.x, size.x - pixelPosition.x),
min(pixelPosition.y, size.y - pixelPosition.y));
}
vec4 get_stroked_fragColor(float dist) {
float isBorder = smoothedge(dist, vLineWidth);
return mix(vFillColor, vLineColor, isBorder);
}
void main(void) {
geometry.uv = uv;
if (textBackground.borderRadius != vec4(0.0)) {
float distToEdge = round_rect(uv, dimensions, textBackground.borderRadius);
float shapeAlpha = smoothedge(-distToEdge, 0.0);
if (shapeAlpha == 0.0) {
discard;
}
if (textBackground.stroked) {
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
fragColor.a *= shapeAlpha;
} else {
if (textBackground.stroked) {
float distToEdge = rect(uv, dimensions);
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,ea={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,fontSize:1,borderRadius:{type:"object",value:0},padding:{type:"array",value:[0,0,0,0]},getPosition:{type:"accessor",value:e=>e.position},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},getBoundingRect:{type:"accessor",value:[0,0,0,0]},getClipRect:{type:"accessor",value:[0,0,-1,-1]},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:[0,0,0,255]},getLineWidth:{type:"accessor",value:1}};class el extends n.A{getShaders(){return super.getShaders({vs:es,fs:er,modules:[s.A,a.A,en,j]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instanceRects:{size:4,accessor:"getBoundingRect"},instanceClipRect:{size:4,accessor:"getClipRect",defaultValue:[0,0,-1,-1]},instancePixelOffsets:{size:2,transition:!0,accessor:"getPixelOffset"},instanceFillColors:{size:4,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e);let{changeFlags:t}=e;t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{billboard:t,sizeScale:i,sizeUnits:o,sizeMinPixels:n,sizeMaxPixels:s,getLineWidth:r,fontSize:a}=this.props,{padding:c,borderRadius:p}=this.props;c.length<4&&(c=[c[0],c[1],c[0],c[1]]),Array.isArray(p)||(p=[p,p,p,p]);let d=this.state.model,u={billboard:t,stroked:!!r,borderRadius:p,padding:c,sizeUnits:l.p5[o],sizeScale:i,sizeMinPixels:n,sizeMaxPixels:s},f={fontSize:a,viewport:this.context.viewport};d.shaderInputs.setProps({textBackground:u,text:f}),d.draw(this.context.renderPass)}_getModel(){return new p.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new d.V({topology:"triangle-strip",vertexCount:4,attributes:{positions:{size:2,value:new Float32Array([0,0,1,0,0,1,1,1])}}}),isInstanced:!0})}}el.defaultProps=ea,el.layerName="TextBackgroundLayer";let ec={start:1,middle:0,end:-1},ep={top:1,center:0,bottom:-1},ed=[0,0,0,255],eu={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,background:!1,getBackgroundColor:{type:"accessor",value:[255,255,255,255]},getBorderColor:{type:"accessor",value:ed},getBorderWidth:{type:"accessor",value:0},backgroundBorderRadius:{type:"object",value:0},backgroundPadding:{type:"array",value:[0,0,0,0]},characterSet:{type:"object",value:Q.characterSet},fontFamily:Q.fontFamily,fontWeight:Q.fontWeight,lineHeight:1,outlineWidth:{type:"number",value:0,min:0},outlineColor:{type:"color",value:ed},fontSettings:{type:"object",value:{},compare:1},wordBreak:"break-word",maxWidth:{type:"number",value:-1},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none",getText:{type:"accessor",value:e=>e.text},getPosition:{type:"accessor",value:e=>e.position},getColor:{type:"accessor",value:ed},getSize:{type:"accessor",value:32},getAngle:{type:"accessor",value:0},getTextAnchor:{type:"accessor",value:"middle"},getAlignmentBaseline:{type:"accessor",value:"center"},getPixelOffset:{type:"accessor",value:[0,0]},getContentBox:{type:"accessor",value:[0,0,-1,-1]},backgroundColor:{deprecatedFor:["background","getBackgroundColor"]}};class ef extends o.A{constructor(){super(...arguments),this.getBoundingRect=(e,t)=>{let{size:[i,o]}=this.transformParagraph(e,t),{getTextAnchor:n,getAlignmentBaseline:s}=this.props;return[(ec["function"==typeof n?n(e,t):n]-1)*i/2,(ep["function"==typeof s?s(e,t):s]-1)*o/2,i,o]},this.getIconOffsets=(e,t)=>{let{getTextAnchor:i,getAlignmentBaseline:o}=this.props,{x:n,y:s,rowWidth:r,size:[,a]}=this.transformParagraph(e,t),l=ec["function"==typeof i?i(e,t):i],c=ep["function"==typeof o?o(e,t):o],p=n.length,d=Array(2*p),u=0;for(let e=0;e<p;e++)d[u++]=(l-1)*r[e]/2+n[e],d[u++]=(c-1)*a/2+s[e];return d}}initializeState(){this.state={styleVersion:0,fontAtlasManager:new ei},this.props.maxWidth>0&&c.A.once(1,"v8.9 breaking change: TextLayer maxWidth is now relative to text size")()}updateState(e){let{props:t,oldProps:i,changeFlags:o}=e;(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==i.lineHeight||t.wordBreak!==i.wordBreak||t.maxWidth!==i.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){let{fontSettings:e,fontFamily:t,fontWeight:i,_getFontRenderer:o}=this.props,{fontAtlasManager:n,characterSet:s}=this.state,r={...e,characterSet:s,fontFamily:t,fontWeight:i,_getFontRenderer:o};if(!n.mapping)return n.setProps(r),!0;for(let e in r)if(r[e]!==n.props[e])return n.setProps(r),!0;return!1}_updateText(){let e,{data:t,characterSet:i}=this.props,o=t.attributes?.getText,{getText:n}=this.props,s=t.startIndices,r="auto"===i&&new Set;if(o&&s){let{texts:i,characterCount:a}=function({value:e,length:t,stride:i,offset:o,startIndices:n,characterSet:s}){let r=e.BYTES_PER_ELEMENT,a=i?i/r:1,l=o?o/r:0,c=n[t]||Math.ceil((e.length-l)/a),p=s&&new Set,d=Array(t),u=e;if(a>1||l>0){u=new e.constructor(c);for(let t=0;t<c;t++)u[t]=e[t*a+l]}for(let e=0;e<t;e++){let t=n[e],i=n[e+1]||c,o=u.subarray(t,i);d[e]=String.fromCodePoint.apply(null,o),p&&o.forEach(p.add,p)}if(p)for(let e of p)s.add(String.fromCodePoint(e));return{texts:d,characterCount:c}}({...ArrayBuffer.isView(o)?{value:o}:o,length:t.length,startIndices:s,characterSet:r});e=a,n=(e,{index:t})=>i[t]}else{let{iterable:i,objectInfo:o}=(0,y.X)(t);for(let t of(s=[0],e=0,i)){o.index++;let i=Array.from(n(t,o)||"");r&&i.forEach(r.add,r),e+=i.length,s.push(e)}}this.setState({getText:n,startIndices:s,numInstances:e,characterSet:r||i})}transformParagraph(e,t){let{fontAtlasManager:i}=this.state,o=i.mapping,{baselineOffset:n}=i.atlas,{fontSize:s}=i.props,r=this.state.getText,{wordBreak:a,lineHeight:l,maxWidth:p}=this.props;return function(e,t,i,o,n,s){let r=Array.from(e),a=r.length,l=Array(a),p=Array(a),d=Array(a),u=("break-word"===o||"break-all"===o)&&isFinite(n)&&n>0,f=[0,0],g=[0,0],h=0,x=t+i/2,v=0,y=0;for(let e=0;e<=a;e++){let t=r[e];if(("\n"===t||e===a)&&(y=e),y>v){let e=u?function(e,t,i,o,n=0,s){void 0===s&&(s=e.length);let r=[];return"break-all"===t?Y(e,n,s,i,o,r):!function(e,t,i,o,n,s){let r=t,a=t,l=t,c=0;for(let p=t;p<i;p++)if(" "===e[p]?l=p+1:(" "===e[p+1]||p+1===i)&&(l=p+1),l>a){let t=X(e,a,l,n);c+t>o&&(r<a&&(s.push(a),r=a,c=0),t>o&&(t=Y(e,a,l,o,n,s),r=s[s.length-1])),a=l,c+=t}}(e,n,s,i,o,r),r}(r,o,n,s,v,y):J;for(let t=0;t<=e.length;t++){let o=0===t?v:e[t-1],n=t<e.length?e[t]:y;!function(e,t,i,o,n,s){let r=0,a=0;for(let n=t;n<i;n++){let t=o[e[n]];t&&(a=Math.max(a,t.height))}for(let s=t;s<i;s++){let t=e[s],i=o[t];i?(n[s]=r+i.anchorX,r+=i.advance):(c.A.warn(`Missing character: ${t} (${t.codePointAt(0)})`)(),n[s]=r,r+=32)}s[0]=r,s[1]=a}(r,o,n,s,l,g);for(let e=o;e<n;e++)p[e]=x,d[e]=g[0];h++,x+=i,f[0]=Math.max(f[0],g[0])}v=y}"\n"===t&&(l[v]=0,p[v]=0,d[v]=0,v++)}return f[1]=h*i,{x:l,y:p,rowWidth:d,size:f}}(r(e,t)||"",n,l*s,a,p*s,o)}renderLayers(){let{startIndices:e,numInstances:t,getText:i,fontAtlasManager:{atlas:o,mapping:n},styleVersion:s}=this.state,{data:r,_dataDiff:a,getPosition:l,getColor:c,getSize:p,getAngle:d,getPixelOffset:u,getBackgroundColor:f,getBorderColor:g,getBorderWidth:h,getContentBox:x,backgroundBorderRadius:v,backgroundPadding:y,background:m,billboard:P,fontSettings:_,outlineWidth:C,outlineColor:b,sizeScale:L,sizeUnits:S,sizeMinPixels:z,sizeMaxPixels:A,contentCutoffPixels:w,contentAlignHorizontal:I,contentAlignVertical:M,transitions:O,updateTriggers:E}=this.props,T=this.getSubLayerClass("characters",V),R=this.getSubLayerClass("background",el),{fontSize:F}=this.state.fontAtlasManager.props;return[m&&new R({getFillColor:f,getLineColor:g,getLineWidth:h,borderRadius:v,padding:y,getPosition:l,getSize:p,getAngle:d,getPixelOffset:u,getClipRect:x,billboard:P,sizeScale:L,sizeUnits:S,sizeMinPixels:z,sizeMaxPixels:A,fontSize:F,transitions:O&&{getPosition:O.getPosition,getAngle:O.getAngle,getSize:O.getSize,getFillColor:O.getBackgroundColor,getLineColor:O.getBorderColor,getLineWidth:O.getBorderWidth,getPixelOffset:O.getPixelOffset}},this.getSubLayerProps({id:"background",updateTriggers:{getPosition:E.getPosition,getAngle:E.getAngle,getSize:E.getSize,getFillColor:E.getBackgroundColor,getLineColor:E.getBorderColor,getLineWidth:E.getBorderWidth,getPixelOffset:E.getPixelOffset,getBoundingRect:{getText:E.getText,getTextAnchor:E.getTextAnchor,getAlignmentBaseline:E.getAlignmentBaseline,styleVersion:s}}}),{data:r.attributes&&r.attributes.background?{length:r.length,attributes:r.attributes.background}:r,_dataDiff:a,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new T({sdf:_.sdf,smoothing:Number.isFinite(_.smoothing)?_.smoothing:Q.smoothing,outlineWidth:C/(_.radius||Q.radius),outlineColor:b,iconAtlas:o,iconMapping:n,getPosition:l,getColor:c,getSize:p,getAngle:d,getPixelOffset:u,getContentBox:x,billboard:P,sizeScale:L,sizeUnits:S,sizeMinPixels:z,sizeMaxPixels:A,fontSize:F,contentCutoffPixels:w,contentAlignHorizontal:I,contentAlignVertical:M,transitions:O&&{getPosition:O.getPosition,getAngle:O.getAngle,getColor:O.getColor,getSize:O.getSize,getPixelOffset:O.getPixelOffset,getContentBox:O.getContentBox}},this.getSubLayerProps({id:"characters",updateTriggers:{all:E.getText,getPosition:E.getPosition,getAngle:E.getAngle,getColor:E.getColor,getSize:E.getSize,getPixelOffset:E.getPixelOffset,getContentBox:E.getContentBox,getIconOffsets:{getTextAnchor:E.getTextAnchor,getAlignmentBaseline:E.getAlignmentBaseline,styleVersion:s}}}),{data:r,_dataDiff:a,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:i})]}static set fontAtlasCacheLimit(e){c.A.assert(Number.isFinite(e)&&e>=3,"Invalid cache limit"),ee=new q(e)}}ef.defaultProps=eu,ef.layerName="TextLayer";var eg=i(67199),eh=i(37072),ex=i(55230),ev=i(74985);let ey=ev.rJ.CLOCKWISE,em=ev.rJ.COUNTER_CLOCKWISE,eP={isClosed:!0};function e_(e){return"positions"in e?e.positions:e}function eC(e){return"holeIndices"in e?e.holeIndices:null}function eb(e,t,i,o,n){let s,r,a=t,l=i.length;for(let t=0;t<l;t++)for(let n=0;n<o;n++)e[a++]=i[t][n]||0;if(s=i[0],r=i[i.length-1],s[0]!==r[0]||s[1]!==r[1]||s[2]!==r[2])for(let t=0;t<o;t++)e[a++]=i[0][t]||0;return eP.start=t,eP.end=a,eP.size=o,(0,ev.UD)(e,n,eP),a}function eL(e,t,i,o,n=0,s,r){let a=(s=s||i.length)-n;if(a<=0)return t;let l=t;for(let t=0;t<a;t++)e[l++]=i[n+t];if(!function(e,t,i,o){for(let n=0;n<t;n++)if(e[i+n]!==e[o-t+n])return!1;return!0}(i,o,n,s))for(let t=0;t<o;t++)e[l++]=i[n+t];return eP.start=t,eP.end=l,eP.size=o,(0,ev.UD)(e,r,eP),l}function eS(e,t,i){let o=e.length/3,n=0;for(let s=0;s<o;s++){let r=(s+1)%o;n+=e[3*s+t]*e[3*r+i],n-=e[3*r+t]*e[3*s+i]}return Math.abs(n/2)}function ez(e,t,i,o){let n=e.length/3;for(let s=0;s<n;s++){let n=3*s,r=e[n+0],a=e[n+1],l=e[n+2];e[n+t]=r,e[n+i]=a,e[n+o]=l}}var eA=i(44941);class ew extends eA.A{constructor(e){let{fp64:t,IndexType:i=Uint32Array}=e;super({...e,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:i,size:1}}})}get(e){let{attributes:t}=this;return"indices"===e?t.indices&&t.indices.subarray(0,this.vertexCount):t[e]}updateGeometry(e){super.updateGeometry(e);let t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.getGeometry)throw Error("missing indices buffer")}normalizeGeometry(e){if(this.normalize){let t=function(e,t){var i,o=e;if(!Array.isArray(o=o&&o.positions||o)&&!ArrayBuffer.isView(o))throw Error("invalid polygon");let n=[],s=[];if("positions"in e){let{positions:i,holeIndices:o}=e;if(o){let e=0;for(let r=0;r<=o.length;r++)e=eL(n,e,i,t,o[r-1],o[r],0===r?ey:em),s.push(e);return s.pop(),{positions:n,holeIndices:s}}e=i}if(!Array.isArray(e[0]))return eL(n,0,e,t,0,n.length,ey),n;if(!((i=e).length>=1&&i[0].length>=2&&Number.isFinite(i[0][0]))){let i=0;for(let[o,r]of e.entries())i=eb(n,i,r,t,0===o?ey:em),s.push(i);return s.pop(),{positions:n,holeIndices:s}}return eb(n,0,e,t,ey),n}(e,this.positionSize);return this.opts.resolution?(0,ev.wk)(e_(t),eC(t),{size:this.positionSize,gridResolution:this.opts.resolution,edgeTypes:!0}):this.opts.wrapLongitude?(0,ev.Eg)(e_(t),eC(t),{size:this.positionSize,maxLatitude:86,edgeTypes:!0}):t}return e}getGeometrySize(e){if(eI(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}return e_(e).length/this.positionSize}getGeometryFromBuffer(e){return this.normalize||!this.buffers.indices?super.getGeometryFromBuffer(e):null}updateGeometryAttributes(e,t){if(e&&eI(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e,t.indexStart=this.indexStarts[t.geometryIndex+1]}else this._updateIndices(e,t),this._updatePositions(e,t),this._updateVertexValid(e,t)}_updateIndices(e,{geometryIndex:t,vertexStart:i,indexStart:o}){let{attributes:n,indexStarts:s,typedArrayManager:r}=this,a=n.indices;if(!a||!e)return;let l=o,c=function(e,t,i,o){let n=eC(e);n&&(n=n.map(e=>e/t));let s=e_(e),r=o&&3===t;if(i){let e=s.length;s=s.slice();let o=[];for(let n=0;n<e;n+=t){o[0]=s[n],o[1]=s[n+1],r&&(o[2]=s[n+2]);let e=i(o);s[n]=e[0],s[n+1]=e[1],r&&(s[n+2]=e[2])}}if(r){let e=eS(s,0,1),t=eS(s,0,2),o=eS(s,1,2);if(!e&&!t&&!o)return[];e>t&&e>o||(t>o?(i||(s=s.slice()),ez(s,0,2,1)):(i||(s=s.slice()),ez(s,2,0,1)))}return ex(s,n,t)}(e,this.positionSize,this.opts.preproject,this.opts.full3d);a=r.allocate(a,o+c.length,{copy:!0});for(let e=0;e<c.length;e++)a[l++]=c[e]+i;s[t+1]=o+c.length,n.indices=a}_updatePositions(e,{vertexStart:t,geometrySize:i}){let{attributes:{positions:o},positionSize:n}=this;if(!o||!e)return;let s=e_(e);for(let e=t,r=0;r<i;e++,r++){let t=s[r*n],i=s[r*n+1],a=n>2?s[r*n+2]:0;o[3*e]=t,o[3*e+1]=i,o[3*e+2]=a}}_updateVertexValid(e,{vertexStart:t,geometrySize:i}){let{positionSize:o}=this,n=this.attributes.vertexValid,s=e&&eC(e);if(e&&e.edgeTypes?n.set(e.edgeTypes,t):n.fill(1,t,t+i),s)for(let e=0;e<s.length;e++)n[t+s[e]/o-1]=0;n[t+i-1]=0}}function eI(e){return Array.isArray(e)&&e.length>0&&!Number.isFinite(e[0])}let eM=`\
layout(std140) uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,eO={name:"solidPolygon",vs:eM,fs:eM,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},eE=`\
in vec4 fillColors;
in vec4 lineColors;
in vec3 pickingColors;
out vec4 vColor;
struct PolygonProps {
vec3 positions;
vec3 positions64Low;
vec3 normal;
float elevations;
};
vec3 project_offset_normal(vec3 vector) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT_OFFSETS) {
return normalize(vector * project.commonUnitsPerWorldUnit);
}
return project_normal(vector);
}
void calculatePosition(PolygonProps props) {
vec3 pos = props.positions;
vec3 pos64Low = props.positions64Low;
vec3 normal = props.normal;
vec4 colors = solidPolygon.isWireframe ? lineColors : fillColors;
geometry.worldPosition = props.positions;
geometry.pickingColor = pickingColors;
if (solidPolygon.extruded) {
pos.z += props.elevations * solidPolygon.elevationScale;
}
gl_Position = project_position_to_clipspace(pos, pos64Low, vec3(0.), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
if (solidPolygon.extruded) {
#ifdef IS_SIDE_VERTEX
normal = project_offset_normal(normal);
#else
normal = project_normal(normal);
#endif
geometry.normal = normal;
vec3 lightColor = lighting_getLightColor(colors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, colors.a * layer.opacity);
} else {
vColor = vec4(colors.rgb, colors.a * layer.opacity);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,eT=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader
in vec3 vertexPositions;
in vec3 vertexPositions64Low;
in float elevations;
${eE}
void main(void) {
PolygonProps props;
props.positions = vertexPositions;
props.positions64Low = vertexPositions64Low;
props.elevations = elevations;
props.normal = vec3(0.0, 0.0, 1.0);
calculatePosition(props);
}
`,eR=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader-side
#define IS_SIDE_VERTEX
in vec2 positions;
in vec3 vertexPositions;
in vec3 nextVertexPositions;
in vec3 vertexPositions64Low;
in vec3 nextVertexPositions64Low;
in float elevations;
in float instanceVertexValid;
${eE}
void main(void) {
if(instanceVertexValid < 0.5){
gl_Position = vec4(0.);
return;
}
PolygonProps props;
vec3 pos;
vec3 pos64Low;
vec3 nextPos;
vec3 nextPos64Low;
#if RING_WINDING_ORDER_CW == 1
pos = vertexPositions;
pos64Low = vertexPositions64Low;
nextPos = nextVertexPositions;
nextPos64Low = nextVertexPositions64Low;
#else
pos = nextVertexPositions;
pos64Low = nextVertexPositions64Low;
nextPos = vertexPositions;
nextPos64Low = vertexPositions64Low;
#endif
props.positions = mix(pos, nextPos, positions.x);
props.positions64Low = mix(pos64Low, nextPos64Low, positions.x);
props.normal = vec3(
pos.y - nextPos.y + (pos64Low.y - nextPos64Low.y),
nextPos.x - pos.x + (nextPos64Low.x - pos64Low.x),
0.0);
props.elevations = elevations * positions.y;
calculatePosition(props);
}
`,eF=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-fragment-shader
precision highp float;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,ek=[0,0,0,255],eB={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};class eG extends n.A{getShaders(e){return super.getShaders({vs:"top"===e?eT:eR,fs:eF,defines:{RING_WINDING_ORDER_CW:this.props._normalize||"CCW"!==this.props._windingOrder?1:0},modules:[s.A,eh.J,a.A,eO]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){let e,{viewport:t}=this.context,{coordinateSystem:i}=this.props,{_full3d:o}=this.props;t.isGeospatial&&"default"===i&&(i="lnglat"),"lnglat"===i&&(e=o?t.projectPosition.bind(t):t.projectFlat.bind(t)),this.setState({numInstances:0,polygonTesselator:new ew({preproject:e,fp64:this.use64bitPositions(),IndexType:Uint32Array})});let n=this.getAttributeManager();n.remove(["instancePickingColors"]),n.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:!0},vertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:eB,accessor:"getPolygon",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{nextVertexPositions:{vertexOffset:1}}},instanceVertexValid:{size:1,type:"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:!0},elevations:{size:1,stepMode:"dynamic",transition:eB,accessor:"getElevation"},fillColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:eB,accessor:"getFillColor",defaultValue:ek},lineColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:eB,accessor:"getLineColor",defaultValue:ek},pickingColors:{size:4,type:"uint8",stepMode:"dynamic",accessor:(e,{index:t,target:i})=>this.encodePickingColor(e&&e.__source?e.__source.index:t,i)}})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,o=this.props.data;return o[0]&&o[0].__source&&(t.object=o.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{extruded:t,filled:i,wireframe:o,elevationScale:n}=this.props,{topModel:s,sideModel:r,wireframeModel:a,polygonTesselator:l}=this.state,c={extruded:!!t,elevationScale:n,isWireframe:!1};a&&o&&(a.setInstanceCount(l.instanceCount-1),a.shaderInputs.setProps({solidPolygon:{...c,isWireframe:!0}}),a.draw(this.context.renderPass)),r&&i&&(r.setInstanceCount(l.instanceCount-1),r.shaderInputs.setProps({solidPolygon:c}),r.draw(this.context.renderPass)),s&&i&&(s.setVertexCount(l.vertexCount),s.shaderInputs.setProps({solidPolygon:c}),s.draw(this.context.renderPass))}updateState(e){super.updateState(e),this.updateGeometry(e);let{props:t,oldProps:i,changeFlags:o}=e,n=this.getAttributeManager();(o.extensionsChanged||t.filled!==i.filled||t.extruded!==i.extruded)&&(this.state.models?.forEach(e=>e.destroy()),this.setState(this._getModels()),n.invalidateAll())}updateGeometry({props:e,oldProps:t,changeFlags:i}){if(i.dataChanged||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPolygon)){let{polygonTesselator:t}=this.state,o=e.data.attributes||{};t.updateGeometry({data:e.data,normalize:e._normalize,geometryBuffer:o.getPolygon,buffers:o,getGeometry:e.getPolygon,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude,resolution:this.context.viewport.resolution,fp64:this.use64bitPositions(),dataChanged:i.dataChanged,full3d:e._full3d}),this.setState({numInstances:t.instanceCount,startIndices:t.vertexStarts}),i.dataChanged||this.getAttributeManager().invalidateAll()}}_getModels(){let e,t,i,{id:o,filled:n,extruded:s}=this.props;if(n){let t=this.getShaders("top");t.defines.NON_INSTANCED_MODEL=1;let i=this.getAttributeManager().getBufferLayouts({isInstanced:!1});e=new p.K(this.context.device,{...t,id:`${o}-top`,topology:"triangle-list",bufferLayout:i,isIndexed:!0,userData:{excludeAttributes:{instanceVertexValid:!0}}})}if(s){let e=this.getAttributeManager().getBufferLayouts({isInstanced:!0});t=new p.K(this.context.device,{...this.getShaders("side"),id:`${o}-side`,bufferLayout:e,geometry:new d.V({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),i=new p.K(this.context.device,{...this.getShaders("side"),id:`${o}-wireframe`,bufferLayout:e,geometry:new d.V({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[t,i,e].filter(Boolean),topModel:e,sideModel:t,wireframeModel:i}}calculateIndices(e){let{polygonTesselator:t}=this.state;e.startIndices=t.indexStarts,e.value=t.get("indices")}calculatePositions(e){let{polygonTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateVertexValid(e){e.value=this.state.polygonTesselator.get("vertexValid")}}eG.defaultProps={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:e=>e.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:ek},getLineColor:{type:"accessor",value:ek},material:!0},eG.layerName="SolidPolygonLayer";let eW={circle:{type:B,props:{filled:"filled",stroked:"stroked",lineWidthMaxPixels:"lineWidthMaxPixels",lineWidthMinPixels:"lineWidthMinPixels",lineWidthScale:"lineWidthScale",lineWidthUnits:"lineWidthUnits",pointRadiusMaxPixels:"radiusMaxPixels",pointRadiusMinPixels:"radiusMinPixels",pointRadiusScale:"radiusScale",pointRadiusUnits:"radiusUnits",pointAntialiasing:"antialiasing",pointBillboard:"billboard",getFillColor:"getFillColor",getLineColor:"getLineColor",getLineWidth:"getLineWidth",getPointRadius:"getRadius"}},icon:{type:I,props:{iconAtlas:"iconAtlas",iconMapping:"iconMapping",iconSizeMaxPixels:"sizeMaxPixels",iconSizeMinPixels:"sizeMinPixels",iconSizeScale:"sizeScale",iconSizeUnits:"sizeUnits",iconAlphaCutoff:"alphaCutoff",iconBillboard:"billboard",getIcon:"getIcon",getIconAngle:"getAngle",getIconColor:"getColor",getIconPixelOffset:"getPixelOffset",getIconSize:"getSize"}},text:{type:ef,props:{textSizeMaxPixels:"sizeMaxPixels",textSizeMinPixels:"sizeMinPixels",textSizeScale:"sizeScale",textSizeUnits:"sizeUnits",textBackground:"background",textBackgroundPadding:"backgroundPadding",textFontFamily:"fontFamily",textFontWeight:"fontWeight",textLineHeight:"lineHeight",textMaxWidth:"maxWidth",textOutlineColor:"outlineColor",textOutlineWidth:"outlineWidth",textWordBreak:"wordBreak",textCharacterSet:"characterSet",textBillboard:"billboard",textFontSettings:"fontSettings",getText:"getText",getTextAngle:"getAngle",getTextColor:"getColor",getTextPixelOffset:"getPixelOffset",getTextSize:"getSize",getTextAnchor:"getTextAnchor",getTextAlignmentBaseline:"getAlignmentBaseline",getTextBackgroundColor:"getBackgroundColor",getTextBorderColor:"getBorderColor",getTextBorderWidth:"getBorderWidth"}}},eD={type:eg.A,props:{lineWidthUnits:"widthUnits",lineWidthScale:"widthScale",lineWidthMinPixels:"widthMinPixels",lineWidthMaxPixels:"widthMaxPixels",lineJointRounded:"jointRounded",lineCapRounded:"capRounded",lineMiterLimit:"miterLimit",lineBillboard:"billboard",getLineColor:"getColor",getLineWidth:"getWidth"}},ej={type:eG,props:{extruded:"extruded",filled:"filled",wireframe:"wireframe",elevationScale:"elevationScale",material:"material",_full3d:"_full3d",getElevation:"getElevation",getFillColor:"getFillColor",getLineColor:"getLineColor"}};function eN({type:e,props:t}){let i={};for(let o in t)i[o]=e.defaultProps[t[o]];return i}function eU(e,t){let{transitions:i,updateTriggers:o}=e.props,n={updateTriggers:{},transitions:i&&{getPosition:i.geometry}};for(let s in t){let r=t[s],a=e.props[s];s.startsWith("get")&&(a=e.getSubLayerAccessor(a),n.updateTriggers[r]=o[s],i&&(n.transitions[r]=i[s])),n[r]=a}return n}function eV(e,t,i={}){let o={pointFeatures:[],lineFeatures:[],polygonFeatures:[],polygonOutlineFeatures:[]},{startRow:n=0,endRow:s=e.length}=i;for(let i=n;i<s;i++){let n=e[i],{geometry:s}=n;if(s)if("GeometryCollection"===s.type){c.A.assert(Array.isArray(s.geometries),"GeoJSON does not have geometries array");let{geometries:e}=s;for(let s=0;s<e.length;s++)eK(e[s],o,t,n,i)}else eK(s,o,t,n,i)}return o}function eK(e,t,i,o,n){let{type:s,coordinates:r}=e,{pointFeatures:a,lineFeatures:l,polygonFeatures:p,polygonOutlineFeatures:d}=t;if(!function(e,t){let i=eZ[e];for(c.A.assert(i,`Unknown GeoJSON type ${e}`);t&&--i>0;)t=t[0];return t&&Number.isFinite(t[0])}(s,r))return void c.A.warn(`${s} coordinates are malformed`)();switch(s){case"Point":a.push(i({geometry:e},o,n));break;case"MultiPoint":r.forEach(e=>{a.push(i({geometry:{type:"Point",coordinates:e}},o,n))});break;case"LineString":l.push(i({geometry:e},o,n));break;case"MultiLineString":r.forEach(e=>{l.push(i({geometry:{type:"LineString",coordinates:e}},o,n))});break;case"Polygon":p.push(i({geometry:e},o,n)),r.forEach(e=>{d.push(i({geometry:{type:"LineString",coordinates:e}},o,n))});break;case"MultiPolygon":r.forEach(e=>{p.push(i({geometry:{type:"Polygon",coordinates:e}},o,n)),e.forEach(e=>{d.push(i({geometry:{type:"LineString",coordinates:e}},o,n))})})}}let eZ={Point:1,MultiPoint:2,LineString:2,MultiLineString:3,Polygon:3,MultiPolygon:4};function eH(){return{points:{},lines:{},polygons:{},polygonsOutline:{}}}function e$(e){return e.geometry.coordinates}let eJ=["points","linestrings","polygons"],eX={...eN(eW.circle),...eN(eW.icon),...eN(eW.text),...eN(eD),...eN(ej),stroked:!0,filled:!0,extruded:!1,wireframe:!1,_full3d:!1,iconAtlas:{type:"object",value:null},iconMapping:{type:"object",value:{}},getIcon:{type:"accessor",value:e=>e.properties.icon},getText:{type:"accessor",value:e=>e.properties.text},pointType:"circle",getRadius:{deprecatedFor:"getPointRadius"}};class eY extends o.A{initializeState(){this.state={layerProps:{},features:{},featuresDiff:{}}}updateState({props:e,changeFlags:t}){if(!t.dataChanged)return;let{data:i}=this.props,o=i&&"points"in i&&"polygons"in i&&"lines"in i;this.setState({binary:o}),o?this._updateStateBinary({props:e,changeFlags:t}):this._updateStateJSON({props:e,changeFlags:t})}_updateStateBinary({props:e,changeFlags:t}){let i=function(e,t){let i=eH(),{points:o,lines:n,polygons:s}=e,r=function(e,t){let i={points:null,lines:null,polygons:null};for(let o in i){let n=e[o].globalFeatureIds.value;i[o]=new Uint8ClampedArray(4*n.length);let s=[];for(let e=0;e<n.length;e++)t(n[e],s),i[o][4*e+0]=s[0],i[o][4*e+1]=s[1],i[o][4*e+2]=s[2],i[o][4*e+3]=255}return i}(e,t);i.points.data={length:o.positions.value.length/o.positions.size,attributes:{...o.attributes,getPosition:o.positions,instancePickingColors:{size:4,value:r.points}},properties:o.properties,numericProps:o.numericProps,featureIds:o.featureIds},i.lines.data={length:n.pathIndices.value.length-1,startIndices:n.pathIndices.value,attributes:{...n.attributes,getPath:n.positions,instancePickingColors:{size:4,value:r.lines}},properties:n.properties,numericProps:n.numericProps,featureIds:n.featureIds},i.lines._pathType="open";let a=Array(s.positions.value.length/s.positions.size).fill(1);for(let e of s.primitivePolygonIndices.value)a[e-1]=0;return i.polygons.data={length:s.polygonIndices.value.length-1,startIndices:s.polygonIndices.value,attributes:{...s.attributes,getPolygon:s.positions,instanceVertexValid:{size:1,value:new Uint16Array(a)},pickingColors:{size:4,value:r.polygons}},properties:s.properties,numericProps:s.numericProps,featureIds:s.featureIds},i.polygons._normalize=!1,s.triangles&&(i.polygons.data.attributes.indices=s.triangles.value),i.polygonsOutline.data={length:s.primitivePolygonIndices.value.length-1,startIndices:s.primitivePolygonIndices.value,attributes:{...s.attributes,getPath:s.positions,instancePickingColors:{size:4,value:r.polygons}},properties:s.properties,numericProps:s.numericProps,featureIds:s.featureIds},i.polygonsOutline._pathType="open",i}(e.data,this.encodePickingColor);this.setState({layerProps:i})}_updateStateJSON({props:e,changeFlags:t}){let i=function(e){if(Array.isArray(e))return e;switch(c.A.assert(e.type,"GeoJSON does not have type"),e.type){case"Feature":return[e];case"FeatureCollection":return c.A.assert(Array.isArray(e.features),"GeoJSON does not have features array"),e.features;default:return[{geometry:e}]}}(e.data),o=this.getSubLayerRow.bind(this),n={},s={};if(Array.isArray(t.dataChanged)){let e=this.state.features;for(let t in e)n[t]=e[t].slice(),s[t]=[];for(let r of t.dataChanged){let t=eV(i,o,r);for(let i in e)s[i].push(function({data:e,getIndex:t,dataRange:i,replace:o}){let{startRow:n=0,endRow:s=1/0}=i,r=e.length,a=r,l=r;for(let i=0;i<r;i++){let o=t(e[i]);if(a>i&&o>=n&&(a=i),o>=s){l=i;break}}let c=a,p=l-a!==o.length?e.slice(l):void 0;for(let t=0;t<o.length;t++)e[c++]=o[t];if(p){for(let t=0;t<p.length;t++)e[c++]=p[t];e.length=c}return{startRow:a,endRow:a+o.length}}({data:n[i],getIndex:e=>e.__source.index,dataRange:r,replace:t[i]}))}}else n=eV(i,o);let r=function(e,t){let i=eH(),{pointFeatures:o,lineFeatures:n,polygonFeatures:s,polygonOutlineFeatures:r}=e;return i.points.data=o,i.points._dataDiff=t.pointFeatures&&(()=>t.pointFeatures),i.points.getPosition=e$,i.lines.data=n,i.lines._dataDiff=t.lineFeatures&&(()=>t.lineFeatures),i.lines.getPath=e$,i.polygons.data=s,i.polygons._dataDiff=t.polygonFeatures&&(()=>t.polygonFeatures),i.polygons.getPolygon=e$,i.polygonsOutline.data=r,i.polygonsOutline._dataDiff=t.polygonOutlineFeatures&&(()=>t.polygonOutlineFeatures),i.polygonsOutline.getPath=e$,i}(n,s);this.setState({features:n,featuresDiff:s,layerProps:r})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i,sourceLayer:o}=t;return t.featureType=eJ.find(e=>o.id.startsWith(`${this.id}-${e}-`)),i>=0&&o.id.startsWith(`${this.id}-points-text`)&&this.state.binary&&(t.index=this.props.data.points.globalFeatureIds.value[i]),t}_updateAutoHighlight(e){let t=`${this.id}-points-`,i="points"===e.featureType;for(let o of this.getSubLayers())o.id.startsWith(t)===i&&o.updateAutoHighlight(e)}_renderPolygonLayer(){let{extruded:e,wireframe:t}=this.props,{layerProps:i}=this.state,o="polygons-fill",n=this.shouldRenderSubLayer(o,i.polygons?.data)&&this.getSubLayerClass(o,ej.type);if(n){let s=eU(this,ej.props),r=e&&t;return r||delete s.getLineColor,s.updateTriggers.lineColors=r,new n(s,this.getSubLayerProps({id:o,updateTriggers:s.updateTriggers}),i.polygons)}return null}_renderLineLayers(){let{extruded:e,stroked:t}=this.props,{layerProps:i}=this.state,o="polygons-stroke",n="linestrings",s=!e&&t&&this.shouldRenderSubLayer(o,i.polygonsOutline?.data)&&this.getSubLayerClass(o,eD.type),r=this.shouldRenderSubLayer(n,i.lines?.data)&&this.getSubLayerClass(n,eD.type);if(s||r){let e=eU(this,eD.props);return[s&&new s(e,this.getSubLayerProps({id:o,updateTriggers:e.updateTriggers}),i.polygonsOutline),r&&new r(e,this.getSubLayerProps({id:n,updateTriggers:e.updateTriggers}),i.lines)]}return null}_renderPointLayers(){let{pointType:e}=this.props,{layerProps:t,binary:i}=this.state,{highlightedObjectIndex:o}=this.props;!i&&Number.isFinite(o)&&(o=t.points.data.findIndex(e=>e.__source.index===o));let n=new Set(e.split("+")),s=[];for(let e of n){let n=`points-${e}`,r=eW[e],a=r&&this.shouldRenderSubLayer(n,t.points?.data)&&this.getSubLayerClass(n,r.type);if(a){let l=eU(this,r.props),c=t.points;if("text"===e&&i){let{instancePickingColors:e,...t}=c.data.attributes;c={...c,data:{...c.data,attributes:t}}}s.push(new a(l,this.getSubLayerProps({id:n,updateTriggers:l.updateTriggers,highlightedObjectIndex:o}),c))}}return s}renderLayers(){let{extruded:e}=this.props,t=this._renderPolygonLayer();return[!e&&t,this._renderLineLayers(),this._renderPointLayers(),e&&t]}getSubLayerAccessor(e){let{binary:t}=this.state;return t&&"function"==typeof e?(t,i)=>{let{data:o,index:n}=i;return e(function(e,t){if(!e)return null;let i="startIndices"in e?e.startIndices[t]:t,o=e.featureIds.value[i];return -1!==i?function(e,t,i){let o={properties:{...e.properties[t]}};for(let t in e.numericProps)o.properties[t]=e.numericProps[t].value[i];return o}(e,o,i):null}(o,n),i)}:super.getSubLayerAccessor(e)}}eY.layerName="GeoJsonLayer",eY.defaultProps=eX;let eq=eY},67199(e,t,i){i.d(t,{A:()=>_});var o=i(25799),n=i(84175),s=i(95335),r=i(9350),a=i(25337),l=i(54338),c=i(44941),p=i(74985);class d extends c.A{constructor(e){super({...e,attributes:{positions:{size:3,padding:18,initialize:!0,type:e.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:Uint8ClampedArray}}})}get(e){return this.attributes[e]}getGeometryFromBuffer(e){return this.normalize?super.getGeometryFromBuffer(e):null}normalizeGeometry(e){return this.normalize?function(e,t,i,o){let n;if(Array.isArray(e[0])){n=Array(e.length*t);for(let i=0;i<e.length;i++)for(let o=0;o<t;o++)n[i*t+o]=e[i][o]||0}else n=e;return i?(0,p.Mk)(n,{size:t,gridResolution:i}):o?(0,p.Iy)(n,{size:t}):n}(e,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):e}getGeometrySize(e){if(u(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}let t=this.getPathLength(e);return t<2?0:this.isClosed(e)?t<3?0:t+2:t}updateGeometryAttributes(e,t){if(0!==t.geometrySize)if(e&&u(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e}else this._updateSegmentTypes(e,t),this._updatePositions(e,t)}_updateSegmentTypes(e,t){let i=this.attributes.segmentTypes,o=!!e&&this.isClosed(e),{vertexStart:n,geometrySize:s}=t;i.fill(0,n,n+s),o?(i[n]=4,i[n+s-2]=4):(i[n]+=1,i[n+s-2]+=2),i[n+s-1]=4}_updatePositions(e,t){let{positions:i}=this.attributes;if(!i||!e)return;let{vertexStart:o,geometrySize:n}=t,s=[,,,];for(let t=o,r=0;r<n;t++,r++)this.getPointOnPath(e,r,s),i[3*t]=s[0],i[3*t+1]=s[1],i[3*t+2]=s[2]}getPathLength(e){return e.length/this.positionSize}getPointOnPath(e,t,i=[]){let{positionSize:o}=this;t*o>=e.length&&(t+=1-e.length/o);let n=t*o;return i[0]=e[n],i[1]=e[n+1],i[2]=3===o&&e[n+2]||0,i}isClosed(e){if(!this.normalize)return!!this.opts.loop;let{positionSize:t}=this,i=e.length-t;return e[0]===e[i]&&e[1]===e[i+1]&&(2===t||e[2]===e[i+2])}}function u(e){return Array.isArray(e[0])}let f=`\
layout(std140) uniform pathUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float jointType;
  float capType;
  float miterLimit;
  bool billboard;
  highp int widthUnits;
} path;
`,g={name:"path",vs:f,fs:f,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",jointType:"f32",capType:"f32",miterLimit:"f32",billboard:"f32",widthUnits:"i32"}},h=`\
#version 300 es
#define SHADER_NAME path-layer-vertex-shader
in vec2 positions;
in float instanceTypes;
in vec3 instanceStartPositions;
in vec3 instanceEndPositions;
in vec3 instanceLeftPositions;
in vec3 instanceRightPositions;
in vec3 instanceLeftPositions64Low;
in vec3 instanceStartPositions64Low;
in vec3 instanceEndPositions64Low;
in vec3 instanceRightPositions64Low;
in float instanceStrokeWidths;
in vec4 instanceColors;
in vec3 instancePickingColors;
uniform float opacity;
out vec4 vColor;
out vec2 vCornerOffset;
out float vMiterLength;
out vec2 vPathPosition;
out float vPathLength;
out float vJointType;
const float EPSILON = 0.001;
const vec3 ZERO_OFFSET = vec3(0.0);
float flipIfTrue(bool flag) {
return -(float(flag) * 2. - 1.);
}
vec3 getLineJoinOffset(
vec3 prevPoint, vec3 currPoint, vec3 nextPoint,
vec2 width
) {
bool isEnd = positions.x > 0.0;
float sideOfPath = positions.y;
float isJoint = float(sideOfPath == 0.0);
vec3 deltaA3 = (currPoint - prevPoint);
vec3 deltaB3 = (nextPoint - currPoint);
mat3 rotationMatrix;
bool needsRotation = !path.billboard && project_needs_rotation(currPoint, rotationMatrix);
if (needsRotation) {
deltaA3 = deltaA3 * rotationMatrix;
deltaB3 = deltaB3 * rotationMatrix;
}
vec2 deltaA = deltaA3.xy / width;
vec2 deltaB = deltaB3.xy / width;
float lenA = length(deltaA);
float lenB = length(deltaB);
vec2 dirA = lenA > 0. ? normalize(deltaA) : vec2(0.0, 0.0);
vec2 dirB = lenB > 0. ? normalize(deltaB) : vec2(0.0, 0.0);
vec2 perpA = vec2(-dirA.y, dirA.x);
vec2 perpB = vec2(-dirB.y, dirB.x);
vec2 tangent = dirA + dirB;
tangent = length(tangent) > 0. ? normalize(tangent) : perpA;
vec2 miterVec = vec2(-tangent.y, tangent.x);
vec2 dir = isEnd ? dirA : dirB;
vec2 perp = isEnd ? perpA : perpB;
float L = isEnd ? lenA : lenB;
float sinHalfA = abs(dot(miterVec, perp));
float cosHalfA = abs(dot(dirA, miterVec));
float turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
float cornerPosition = sideOfPath * turnDirection;
float miterSize = 1.0 / max(sinHalfA, EPSILON);
miterSize = mix(
min(miterSize, max(lenA, lenB) / max(cosHalfA, EPSILON)),
miterSize,
step(0.0, cornerPosition)
);
vec2 offsetVec = mix(miterVec * miterSize, perp, step(0.5, cornerPosition))
* (sideOfPath + isJoint * turnDirection);
bool isStartCap = lenA == 0.0 || (!isEnd && (instanceTypes == 1.0 || instanceTypes == 3.0));
bool isEndCap = lenB == 0.0 || (isEnd && (instanceTypes == 2.0 || instanceTypes == 3.0));
bool isCap = isStartCap || isEndCap;
if (isCap) {
offsetVec = mix(perp * sideOfPath, dir * path.capType * 4.0 * flipIfTrue(isStartCap), isJoint);
vJointType = path.capType;
} else {
vJointType = path.jointType;
}
vPathLength = L;
vCornerOffset = offsetVec;
vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
vMiterLength = isCap ? isJoint : vMiterLength;
vec2 offsetFromStartOfPath = vCornerOffset + deltaA * float(isEnd);
vPathPosition = vec2(
dot(offsetFromStartOfPath, perp),
dot(offsetFromStartOfPath, dir)
);
geometry.uv = vPathPosition;
float isValid = step(instanceTypes, 3.5);
vec3 offset = vec3(offsetVec * width * isValid, 0.0);
if (needsRotation) {
offset = rotationMatrix * offset;
}
return offset;
}
void clipLine(inout vec4 position, vec4 refPosition) {
if (position.w < EPSILON) {
float r = (EPSILON - refPosition.w) / (position.w - refPosition.w);
position = refPosition + (position - refPosition) * r;
}
}
void main() {
geometry.pickingColor = instancePickingColors;
vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity);
float isEnd = positions.x;
vec3 prevPosition = mix(instanceLeftPositions, instanceStartPositions, isEnd);
vec3 prevPosition64Low = mix(instanceLeftPositions64Low, instanceStartPositions64Low, isEnd);
vec3 currPosition = mix(instanceStartPositions, instanceEndPositions, isEnd);
vec3 currPosition64Low = mix(instanceStartPositions64Low, instanceEndPositions64Low, isEnd);
vec3 nextPosition = mix(instanceEndPositions, instanceRightPositions, isEnd);
vec3 nextPosition64Low = mix(instanceEndPositions64Low, instanceRightPositions64Low, isEnd);
geometry.worldPosition = currPosition;
vec2 widthPixels = vec2(clamp(
project_size_to_pixel(instanceStrokeWidths * path.widthScale, path.widthUnits),
path.widthMinPixels, path.widthMaxPixels) / 2.0);
vec3 width;
if (path.billboard) {
vec4 prevPositionScreen = project_position_to_clipspace(prevPosition, prevPosition64Low, ZERO_OFFSET);
vec4 currPositionScreen = project_position_to_clipspace(currPosition, currPosition64Low, ZERO_OFFSET, geometry.position);
vec4 nextPositionScreen = project_position_to_clipspace(nextPosition, nextPosition64Low, ZERO_OFFSET);
clipLine(prevPositionScreen, currPositionScreen);
clipLine(nextPositionScreen, currPositionScreen);
clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));
width = vec3(widthPixels, 0.0);
DECKGL_FILTER_SIZE(width, geometry);
vec3 offset = getLineJoinOffset(
prevPositionScreen.xyz / prevPositionScreen.w,
currPositionScreen.xyz / currPositionScreen.w,
nextPositionScreen.xyz / nextPositionScreen.w,
project_pixel_size_to_clipspace(width.xy)
);
DECKGL_FILTER_GL_POSITION(currPositionScreen, geometry);
gl_Position = vec4(currPositionScreen.xyz + offset * currPositionScreen.w, currPositionScreen.w);
} else {
prevPosition = project_position(prevPosition, prevPosition64Low);
currPosition = project_position(currPosition, currPosition64Low);
nextPosition = project_position(nextPosition, nextPosition64Low);
width = vec3(project_pixel_size(widthPixels), 0.0);
DECKGL_FILTER_SIZE(width, geometry);
vec3 offset = getLineJoinOffset(prevPosition, currPosition, nextPosition, width.xy);
geometry.position = vec4(currPosition + offset, 1.0);
gl_Position = project_common_position_to_clipspace(geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,x=`\
#version 300 es
#define SHADER_NAME path-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 vCornerOffset;
in float vMiterLength;
in vec2 vPathPosition;
in float vPathLength;
in float vJointType;
out vec4 fragColor;
void main(void) {
geometry.uv = vPathPosition;
if (vPathPosition.y < 0.0 || vPathPosition.y > vPathLength) {
if (vJointType > 0.5 && length(vCornerOffset) > 1.0) {
discard;
}
if (vJointType < 0.5 && vMiterLength > path.miterLimit + 1.0) {
discard;
}
}
fragColor = vColor;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,v=[0,0,0,255],y={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},billboard:!1,_pathType:null,getPath:{type:"accessor",value:e=>e.path},getColor:{type:"accessor",value:v},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},m={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};class P extends o.A{getShaders(){return super.getShaders({vs:h,fs:x,modules:[n.A,s.A,g]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){this.getAttributeManager().addInstanced({vertexPositions:{size:3,vertexOffset:1,type:"float64",fp64:this.use64bitPositions(),transition:m,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}},instanceTypes:{size:1,type:"uint8",update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{size:1,accessor:"getWidth",transition:m,defaultValue:1},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",accessor:"getColor",transition:m,defaultValue:v},instancePickingColors:{size:4,type:"uint8",accessor:(e,{index:t,target:i})=>this.encodePickingColor(e&&e.__source?e.__source.index:t,i)}}),this.setState({pathTesselator:new d({fp64:this.use64bitPositions()})})}updateState(e){super.updateState(e);let{props:t,changeFlags:i}=e,o=this.getAttributeManager();if(i.dataChanged||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPath)){let{pathTesselator:e}=this.state,n=t.data.attributes||{};e.updateGeometry({data:t.data,geometryBuffer:n.getPath,buffers:n,normalize:!t._pathType,loop:"loop"===t._pathType,getGeometry:t.getPath,positionFormat:t.positionFormat,wrapLongitude:t.wrapLongitude,resolution:this.context.viewport.resolution,dataChanged:i.dataChanged}),this.setState({numInstances:e.instanceCount,startIndices:e.vertexStarts}),i.dataChanged||o.invalidateAll()}i.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),o.invalidateAll())}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,o=this.props.data;return o[0]&&o[0].__source&&(t.object=o.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{jointRounded:t,capRounded:i,billboard:o,miterLimit:n,widthUnits:s,widthScale:a,widthMinPixels:l,widthMaxPixels:c}=this.props,p=this.state.model,d={jointType:Number(t),capType:Number(i),billboard:o,widthUnits:r.p5[s],widthScale:a,miterLimit:n,widthMinPixels:l,widthMaxPixels:c};p.shaderInputs.setProps({path:d}),p.draw(this.context.renderPass)}_getModel(){return new l.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new a.V({topology:"triangle-list",attributes:{indices:new Uint16Array([0,1,2,1,4,2,1,3,4,3,5,4]),positions:{value:new Float32Array([0,0,0,-1,0,1,1,-1,1,1,1,0]),size:2}}}),isInstanced:!0})}calculatePositions(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateSegmentTypes(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("segmentTypes")}}P.defaultProps=y,P.layerName="PathLayer";let _=P}}]);