"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["34546"],{18742(e,t,i){i.d(t,{A:()=>n});var r=i(7914);class o{static get componentName(){return Object.prototype.hasOwnProperty.call(this,"extensionName")?this.extensionName:""}constructor(e){e&&(this.opts=e)}equals(e){return this===e||this.constructor===e.constructor&&(0,r.b)(this.opts,e.opts,1)}getShaders(e){return null}getSubLayerProps(e){let{defaultProps:t}=e.constructor,i={updateTriggers:{}};for(let e in t)if(e in this.props){let r=t[e],o=this.props[e];i[e]=o,r&&"accessor"===r.type&&(i.updateTriggers[e]=this.props.updateTriggers[e],"function"==typeof o&&(i[e]=this.getSubLayerAccessor(o)))}return i}initializeState(e,t){}updateState(e,t){}onNeedsRedraw(e){}getNeedsPickingBuffer(e){return!1}draw(e,t){}finalizeState(e,t){}}o.defaultProps={},o.extensionName="LayerExtension";let n=o},28193(e,t,i){i.d(t,{Ay:()=>p,bl:()=>f,rf:()=>c});var r=i(41481),o=i(88967),n=i(47345),s=i(9350),a=i(25667);let l=Math.PI/180,u=180/Math.PI,c=256;function h(e){return 1>Math.abs((0,a.zi)(e+180,360)-180)}class d extends n.A{constructor(e={}){let t,i,{longitude:n=0,bearing:s=0,pitch:a=0,zoom:u=0,nearZMultiplier:h=.5,farZMultiplier:d=1,resolution:p=10}=e,{latitude:g=0,height:m,altitude:y=1.5,fovy:x}=e;g=Math.max(Math.min(g,90),-90),m=m||1,x?y=(0,o.wZ)(x):x=(0,o.Os)(y);let v=Math.pow(2,u-f(Math.max(Math.min(g,o.aH),-o.aH))),b=a*l,_=e.nearZ??h,w=e.farZ??(y+2*c*v/m/Math.max(Math.cos(b),.1))*d,P=new r.Matrix4().lookAt({eye:[0,-y,0],up:[0,0,1]}).rotateX(-b).rotateY(-s*l).rotateX(g*l).rotateZ(-n*l).scale(v/m);super({...e,height:m,viewMatrix:P,longitude:n,latitude:g,zoom:u,distanceScales:{unitsPerMeter:[t=c/6370972,t,t],unitsPerMeter2:[0,0,0],metersPerUnit:[1/t,1/t,1/t],unitsPerDegree:[i=Math.PI/180*c,i,t],unitsPerDegree2:[0,0,0],degreesPerUnit:[1/i,1/i,1/t]},fovy:x,focalDistance:y,near:_,far:w}),this.scale=v,this.latitude=g,this.longitude=n,this.bearing=s,this.pitch=a,this.fovy=x,this.resolution=p}get projectionMode(){return s.Kx.GLOBE}getDistanceScales(){return this.distanceScales}getBounds(e={}){let t={targetZ:e.z||0},i=this.unproject([0,this.height/2],t),r=this.unproject([this.width/2,0],t),o=this.unproject([this.width,this.height/2],t),n=this.unproject([this.width/2,this.height],t);return o[0]<this.longitude&&(o[0]+=360),i[0]>this.longitude&&(i[0]-=360),[Math.min(i[0],o[0],r[0],n[0]),Math.min(i[1],o[1],r[1],n[1]),Math.max(i[0],o[0],r[0],n[0]),Math.max(i[1],o[1],r[1],n[1])]}_getRayToGlobe(e,{topLeft:t=!0,targetZ:i}={}){let[o,n]=e,s=t?n:this.height-n,{pixelUnprojectionMatrix:a}=this,l=g(a,[o,s,-1,1]),u=g(a,[o,s,1,1]),h=r.vec3.sqrLen(r.vec3.sub([],l,u)),d=r.vec3.sqrLen(l),p=r.vec3.sqrLen(u),f=(4*d*p-(h-d-p)**2)/16*4/h;return{rayStartPosition:l,rayEndPosition:u,radius:((i||0)/6370972+1)*c,rayLengthSquared:h,rayStartDistanceSquared:d,distanceToCenterSquared:f}}_getRayDistanceToGlobeCenterRatio(e,t){let{distanceToCenterSquared:i,radius:r}=this._getRayToGlobe(e,t);return Math.sqrt(Math.max(0,i))/r}getZoomAnchorStrength(e){let t=this._getRayDistanceToGlobeCenterRatio(e);if(t>=1.15)return 0;let i=Math.max(0,Math.min(1,(t-.75)/.3999999999999999));return 1-i*i*(3-2*i)}unproject(e,{topLeft:t=!0,targetZ:i}={}){let o,[n,s,a]=e,l=t?s:this.height-s,{pixelUnprojectionMatrix:u}=this;if(Number.isFinite(a))o=g(u,[n,l,a,1]);else{let{rayStartPosition:n,rayEndPosition:s,radius:a,rayLengthSquared:l,rayStartDistanceSquared:u,distanceToCenterSquared:c}=this._getRayToGlobe(e,{topLeft:t,targetZ:i}),h=(Math.sqrt(u-c)-Math.sqrt(Math.max(0,a*a-c)))/Math.sqrt(l);o=r.vec3.lerp([],n,s,h)}let[c,h,d]=this.unprojectPosition(o);return Number.isFinite(a)?[c,h,d]:Number.isFinite(i)?[c,h,i]:[c,h]}projectPosition(e){let[t,i,r=0]=e,o=t*l,n=i*l,s=Math.cos(n),a=(r/6370972+1)*c;return[Math.sin(o)*s*a,-Math.cos(o)*s*a,Math.sin(n)*a]}unprojectPosition(e){let[t,i,o]=e,n=r.vec3.len(e);return[Math.atan2(t,-i)*u,Math.asin(o/n)*u,(n/c-1)*6370972]}projectFlat(e){return e}unprojectFlat(e){return e}panByPosition(e,t,i){if(!i){let i=this.getZoomAnchorStrength(t);if(0===i)return{longitude:this.longitude,latitude:this.latitude};let r=this.unproject(t),n=(0,a.zi)(e[0]-r[0]+180,360)-180,s=e[1]-r[1],l=Math.abs(r[1])>o.aH||Math.abs(n)>90;return h(this.bearing)&&l?{longitude:this.longitude,latitude:this.latitude}:(h(this.bearing)&&0!==s&&(i=Math.min(i,Math.max(0,((s>0?o.aH:-o.aH)-this.latitude)/s))),{longitude:this.longitude+n*i,latitude:Math.max(Math.min(this.latitude+s*i,90),-90)})}let[r,n,s]=e,l=.25/Math.pow(2,this.zoom-f(this.latitude)),u=r+l*(i[0]-t[0]),c=n-l*(i[1]-t[1]),d={longitude:u,latitude:c=Math.max(Math.min(c,90),-90),zoom:s-f(n)};return d.zoom+=f(d.latitude),d}}d.displayName="GlobeViewport";let p=d;function f(e,t){return t&&(e=Math.max(Math.min(e,o.aH),-o.aH)),Math.log2(Math.PI*Math.cos(e*Math.PI/180))}function g(e,t){let i=r.vec4.transformMat4([],t,e);return r.vec4.scale(i,i,1/i[3]),i}},74640(e,t,i){let r;i.d(t,{A:()=>ed});var o=i(9350),n=i(3459),s=i(54683),a=i(18742);let l=`
layout(std140) uniform clipUniforms {
  vec4 bounds;
} clip;

bool clip_isInBounds(vec2 position) {
  return position.x >= clip.bounds[0] && position.y >= clip.bounds[1] && position.x < clip.bounds[2] && position.y < clip.bounds[3];
}
`,u={name:"clip",vs:l,uniformTypes:{bounds:"vec4<f32>"}},c={"vs:#decl":`
out float clip_isVisible;
`,"vs:DECKGL_FILTER_GL_POSITION":`
  clip_isVisible = float(clip_isInBounds(geometry.worldPosition.xy));
`,"fs:#decl":`
in float clip_isVisible;
`,"fs:DECKGL_FILTER_COLOR":`
  if (clip_isVisible < 0.5) discard;
`},h={name:"clip",fs:l,uniformTypes:{bounds:"vec4<f32>"}},d={"vs:#decl":`
out vec2 clip_commonPosition;
`,"vs:DECKGL_FILTER_GL_POSITION":`
  clip_commonPosition = geometry.position.xy;
`,"fs:#decl":`
in vec2 clip_commonPosition;
`,"fs:DECKGL_FILTER_COLOR":`
  if (!clip_isInBounds(clip_commonPosition)) discard;
`};class p extends a.A{getShaders(){let e="instancePositions"in this.getAttributeManager().attributes;return(void 0!==this.props.clipByInstance&&(e=!!this.props.clipByInstance),this.state.clipByInstance=e,"webgpu"===this.context.device.type)?{}:e?{modules:[u],inject:c}:{modules:[h],inject:d}}draw(){let{clipBounds:e}=this.props,t={};if(this.state.clipByInstance)t.bounds=e;else{let i=this.projectPosition([e[0],e[1],0]),r=this.projectPosition([e[2],e[3],0]);t.bounds=[Math.min(i[0],r[0]),Math.min(i[1],r[1]),Math.max(i[0],r[0]),Math.max(i[1],r[1])]}"webgpu"===this.context.device.type&&(t.enabled=!0,t.mode=this.state.clipByInstance?"instance":"geometry"),this.setShaderModuleProps({clip:t})}}p.defaultProps={clipBounds:[0,0,1,1],clipByInstance:void 0},p.extensionName="ClipExtension";var f=i(41481);let g={x:0,y:1,z:2};function m(e,t={}){let{start:i=0,end:r=e.length,plane:o="xy"}=t,n=t.size||2,s=0,a=g[o[0]],l=g[o[1]];for(let t=i,o=r-n;t<r;t+=n)s+=(e[t+a]-e[o+a])*(e[t+l]+e[o+l]),o=t;return s/2}function y(e,t,i,r,o,n,s){let a,l;void 0===n&&(n=m(e,{start:t,end:i,size:r,plane:s}));let u=g[s[0]],c=g[s[1]];if(o===n<0)for(a=t;a<i;a+=r)l=T(a,e[a+u],e[a+c],l);else for(a=i-r;a>=t;a-=r)l=T(a,e[a+u],e[a+c],l);return l&&P(l,l.next)&&(L(l),l=l.next),l}function x(e,t){let i;if(!e)return e;t||(t=e);let r=e;do if(i=!1,!r.steiner&&(P(r,r.next)||0===w(r.prev,r,r.next))){if(L(r),(r=t=r.prev)===r.next)break;i=!0}else r=r.next;while(i||r!==t)return t}function v(e,t){return e.x-t.x}function b(e,t,i,r,o){return(e=((e=((e=((e=((e=(e-i)*o|0)|e<<8)&0xff00ff)|e<<4)&0xf0f0f0f)|e<<2)&0x33333333)|e<<1)&0x55555555)|(t=((t=((t=((t=((t=(t-r)*o|0)|t<<8)&0xff00ff)|t<<4)&0xf0f0f0f)|t<<2)&0x33333333)|t<<1)&0x55555555)<<1}function _(e,t,i,r,o,n,s,a){return(o-s)*(t-a)>=(e-s)*(n-a)&&(e-s)*(r-a)>=(i-s)*(t-a)&&(i-s)*(n-a)>=(o-s)*(r-a)}function w(e,t,i){return(t.y-e.y)*(i.x-t.x)-(t.x-e.x)*(i.y-t.y)}function P(e,t){return e.x===t.x&&e.y===t.y}function M(e,t,i,r){let o=S(w(e,t,i)),n=S(w(e,t,r)),s=S(w(i,r,e)),a=S(w(i,r,t));return!!(o!==n&&s!==a||0===o&&C(e,i,t)||0===n&&C(e,r,t)||0===s&&C(i,e,r)||0===a&&C(i,t,r))}function C(e,t,i){return t.x<=Math.max(e.x,i.x)&&t.x>=Math.min(e.x,i.x)&&t.y<=Math.max(e.y,i.y)&&t.y>=Math.min(e.y,i.y)}function S(e){return e>0?1:e<0?-1:0}function A(e,t){return 0>w(e.prev,e,e.next)?w(e,t,e.next)>=0&&w(e,e.prev,t)>=0:0>w(e,t,e.prev)||0>w(e,e.next,t)}function I(e,t){let i=new z(e.i,e.x,e.y),r=new z(t.i,t.x,t.y),o=e.next,n=t.prev;return e.next=t,t.prev=e,i.next=o,o.prev=i,r.next=i,i.prev=r,n.next=r,r.prev=n,r}function T(e,t,i,r){let o=new z(e,t,i);return r?(o.next=r.next,o.prev=r,r.next.prev=o,r.next=o):(o.prev=o,o.next=o),o}function L(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}class z{constructor(e,t,i){this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1,this.i=e,this.x=t,this.y=i}}function V(e,t){let i={};for(let r in e)i[r]={value:e[r],size:t};return i}function R(e,t,i,r){for(let o in e.numericProps)if(o in t){let n=t[o];e.numericProps[o].fill(n,i,i+r)}}function E(e,t){let i={};for(let r in e)t.includes(r)||(i[r]=e[r]);return i}var F=i(6855);let N="4.5.4",k=N[0]>="0"&&N[0]<="9"?`v${N}`:"",q=(r=new F.h({id:"loaders.gl"}),globalThis.loaders||={},globalThis.loaders.log=r,globalThis.loaders.version=k,globalThis.probe||={},globalThis.probe.loaders=r,r);var O=i(93571);function j(e,t){for(let i=0;i<e.length;++i)e[i]/=t}class U{properties;extent;type;id;_pbf;_geometry;_keys;_values;_geometryInfo;static types=["Unknown","Point","LineString","Polygon"];constructor(e,t,i,r,o,n){this.properties={},this.extent=i,this.type=0,this.id=null,this._pbf=e,this._geometry=-1,this._keys=r,this._values=o,this._geometryInfo=n,e.readFields(B,this,t)}toGeoJSONFeature(e,t){let i=this.loadGeometry();return"wgs84"===e?D(this,i,e=>(function e(t,i,r){if("number"!=typeof t[0][0]){for(let o of t)e(o,i,r);return}let o=r*Math.pow(2,i.z),n=r*i.x,s=r*i.y;for(let e=0;e<t.length;e++){let i=t[e];i[0]=(i[0]+n)*360/o-180;let r=180-(i[1]+s)*360/o;i[1]=360/Math.PI*Math.atan(Math.exp(r*Math.PI/180))-90}})(e,t,this.extent)):D(this,i,function e(t,i){if(Array.isArray(t[0])){for(let r of t)e(r,i);return}t[0]/=i,t[1]/=i})}toBinaryFeature(e,t){let i=this.loadFlatGeometry();return"wgs84"===e?this._toBinaryCoordinates(i,e=>(function(e,t,i){let{x:r,y:o,z:n}=t,s=i*Math.pow(2,n),a=i*r,l=i*o;for(let t=0,i=e.length;t<i;t+=2){e[t]=(e[t]+a)*360/s-180;let i=180-(e[t+1]+l)*360/s;e[t+1]=360/Math.PI*Math.atan(Math.exp(i*Math.PI/180))-90}})(e,t,this.extent)):this._toBinaryCoordinates(i,j)}bbox(){let e=this._pbf;e.pos=this._geometry;let t=e.readVarint()+e.pos,i=1,r=0,o=0,n=0,s=1/0,a=-1/0,l=1/0,u=-1/0;for(;e.pos<t;){if(r<=0){let t=e.readVarint();i=7&t,r=t>>3}if(r--,1===i||2===i)o+=e.readSVarint(),n+=e.readSVarint(),o<s&&(s=o),o>a&&(a=o),n<l&&(l=n),n>u&&(u=n);else if(7!==i)throw Error(`unknown command ${i}`)}return[s,l,a,u]}_toBinaryCoordinates(e,t){let i;switch(t(e.data,this.extent),this.type){case 1:this._geometryInfo.pointFeaturesCount++,this._geometryInfo.pointPositionsCount+=e.indices.length,i={type:"Point",...e};break;case 2:this._geometryInfo.lineFeaturesCount++,this._geometryInfo.linePathsCount+=e.indices.length,this._geometryInfo.linePositionsCount+=e.data.length/2,i={type:"LineString",...e};break;case 3:for(let t of(i=function(e){let t,i=e.indices.length,r="Polygon";if(i<=1)return{type:r,data:e.data,areas:[[m(e.data)]],indices:[e.indices]};let o=[],n=[],s=[],a=[],l=0;for(let r,u=0,c;u<i;u++){c=e.indices[u]-l,r=e.indices[u+1]-l||e.data.length;let i=m(e.data.slice(c,r));if(0===i){let t=e.data.slice(0,c),i=e.data.slice(r);e.data=t.concat(i),l+=r-c;continue}void 0===t&&(t=i<0),t===i<0?(a.length&&(o.push(s),n.push(a)),a=[c],s=[i]):(s.push(i),a.push(c))}return s&&o.push(s),a.length&&n.push(a),{type:r,areas:o,indices:n,data:e.data}}(e),this._geometryInfo.polygonFeaturesCount++,this._geometryInfo.polygonObjectsCount+=i.indices.length,i.indices))this._geometryInfo.polygonRingsCount+=t.length;this._geometryInfo.polygonPositionsCount+=i.data.length/2;break;default:throw Error(`Invalid geometry type: ${this.type}`)}let r={type:"Feature",geometry:i,properties:this.properties};return null!==this.id&&(r.id=this.id),r}loadGeometry(){let e,t=this._pbf;t.pos=this._geometry;let i=t.readVarint()+t.pos,r=1,o=0,n=0,s=0,a=[];for(;t.pos<i;){if(o<=0){let e=t.readVarint();r=7&e,o=e>>3}switch(o--,r){case 1:case 2:n+=t.readSVarint(),s+=t.readSVarint(),1===r&&(e&&a.push(e),e=[]),e&&e.push([n,s]);break;case 7:e&&e.push(e[0].slice());break;default:throw Error(`unknown command ${r}`)}}return e&&a.push(e),a}loadFlatGeometry(){let e,t=this._pbf;t.pos=this._geometry;let i=t.readVarint()+t.pos,r=1,o=0,n=0,s=0,a=0,l=[],u=[];for(;t.pos<i;)if(o<=0&&(r=7&(e=t.readVarint()),o=e>>3),o--,1===r||2===r)n+=t.readSVarint(),s+=t.readSVarint(),1===r&&l.push(a),u.push(n,s),a+=2;else if(7===r){if(a>0){let e=l[l.length-1];u.push(u[e],u[e+1]),a+=2}}else throw Error(`unknown command ${r}`);return{data:u,indices:l}}}function D(e,t,i){let r,o,n,s=U.types[e.type];switch(e.type){case 1:let a=[];for(r=0;r<t.length;r++)a[r]=t[r][0];i(n=a,e.extent);break;case 2:for(r=0,n=t;r<n.length;r++)i(n[r],e.extent);break;case 3:for(r=0,n=function(e){let t,i,r=e.length;if(r<=1)return[e];let o=[];for(let n=0;n<r;n++){let r=function(e){let t=0;for(let i=0,r=e.length-1,o,n;i<e.length;r=i++)o=e[i],t+=((n=e[r])[0]-o[0])*(o[1]+n[1]);return t}(e[n]);0!==r&&(void 0===i&&(i=r<0),i===r<0?(t&&o.push(t),t=[e[n]]):t&&t.push(e[n]))}return t&&o.push(t),o}(t);r<n.length;r++)for(o=0;o<n[r].length;o++)i(n[r][o],e.extent);break;default:throw Error("illegal vector tile type")}1===n.length?n=n[0]:s=`Multi${s}`;let l={type:"Feature",geometry:{type:s,coordinates:n},properties:e.properties};return null!==e.id&&(l.id=e.id),l}function B(e,t,i){t&&i&&(1===e?t.id=i.readVarint():2===e?function(e,t){let i=e.readVarint()+e.pos;for(;e.pos<i;){let i=t._keys[e.readVarint()],r=t._values[e.readVarint()];t.properties[i]=r}}(i,t):3===e?t.type=i.readVarint():4===e&&(t._geometry=i.pos))}class G{version;name;extent;length;_pbf;_keys;_values;_features;constructor(e,t){this.version=1,this.name="",this.extent=4096,this.length=0,this._pbf=e,this._keys=[],this._values=[],this._features=[],e.readFields(Z,this,t),this.length=this._features.length}getGeoJSONFeature(e){if(e<0||e>=this._features.length)throw Error("feature index out of bounds");this._pbf.pos=this._features[e];let t=this._pbf.readVarint()+this._pbf.pos;return new U(this._pbf,t,this.extent,this._keys,this._values)}getBinaryFeature(e,t){if(e<0||e>=this._features.length)throw Error("feature index out of bounds");this._pbf.pos=this._features[e];let i=this._pbf.readVarint()+this._pbf.pos;return new U(this._pbf,i,this.extent,this._keys,this._values,t)}}function Z(e,t,i){t&&i&&(15===e?t.version=i.readVarint():1===e?t.name=i.readString():5===e?t.extent=i.readVarint():2===e?t._features.push(i.pos):3===e?t._keys.push(i.readString()):4===e&&t._values.push(function(e){let t=null,i=e.readVarint()+e.pos;for(;e.pos<i;){let i=e.readVarint()>>3;t=1===i?e.readString():2===i?e.readFloat():3===i?e.readDouble():4===i?e.readVarint64():5===i?e.readVarint():6===i?e.readSVarint():7===i?e.readBoolean():null}return t}(i)))}class W{layers;constructor(e,t){this.layers=e.readFields(H,{},t)}}function H(e,t,i){if(3===e&&i){let e=new G(i,i.readVarint()+i.pos);e.length&&t&&(t[e.name]=e)}}function K(e,t){let i=function(e){if(!e?.mvt)throw Error("mvt options required");if(e.mvt?.coordinates==="wgs84"&&!e.mvt.tileIndex)throw Error("MVT Loader: WGS84 coordinates need tileIndex property");return e.gis&&q.warn('MVTLoader: "options.gis" is deprecated, use "options.mvt.shape" instead')(),e.mvt}(t),r=t?.gis?.format||t?.mvt?.shape||t?.shape;switch(r){case"columnar-table":return{shape:"columnar-table",data:X(e,i)};case"geojson-table":return{shape:"geojson-table",type:"FeatureCollection",features:$(e,i)};case"geojson":return $(e,i);case"binary-geometry":case"binary":return X(e,i);default:throw Error(r||"undefined shape")}}function X(e,t){let i,r,[o,n]=function(e,t){let i=[],r={coordLength:2,pointPositionsCount:0,pointFeaturesCount:0,linePositionsCount:0,linePathsCount:0,lineFeaturesCount:0,polygonPositionsCount:0,polygonObjectsCount:0,polygonRingsCount:0,polygonFeaturesCount:0};if(e.byteLength<=0)return[i,r];let o=new W(new O(e));return(t&&Array.isArray(t.layers)?t.layers:Object.keys(o.layers)).forEach(e=>{let n=o.layers[e];if(n)for(let o=0;o<n.length;o++){let s=function(e,t,i){let r=e.toBinaryFeature(t.coordinates||"local",t.tileIndex);return t.layerProperty&&r.properties&&(r.properties[t.layerProperty]=i),r}(n.getBinaryFeature(o,r),t,e);i.push(s)}}),[i,r]}(e,t),s=(r=Object.keys(i=function(e){let t={};for(let o of e)if(o.properties)for(let e in o.properties){var i,r;let n=o.properties[e];t[e]=(i=n,(r=t[e])!==Array&&Number.isFinite(i)?r===Float64Array||Math.fround(i)!==i?Float64Array:Float32Array:Array)}return t}(o)).filter(e=>i[e]!==Array),function(e,t,i){var r,o,n,s;let a,{pointPositionsCount:l,pointFeaturesCount:u,linePositionsCount:c,linePathsCount:h,lineFeaturesCount:d,polygonPositionsCount:p,polygonObjectsCount:f,polygonRingsCount:g,polygonFeaturesCount:m,propArrayTypes:C,coordLength:S}=t,{numericPropKeys:T=[],PositionDataType:z=Float32Array,triangulate:F=!0}=i,N=e[0]&&"id"in e[0],k=e.length>65535?Uint32Array:Uint16Array,q={type:"Point",positions:new z(l*S),globalFeatureIds:new k(l),featureIds:u>65535?new Uint32Array(l):new Uint16Array(l),numericProps:{},properties:[],fields:[]},O={type:"LineString",pathIndices:c>65535?new Uint32Array(h+1):new Uint16Array(h+1),positions:new z(c*S),globalFeatureIds:new k(c),featureIds:d>65535?new Uint32Array(c):new Uint16Array(c),numericProps:{},properties:[],fields:[]},j={type:"Polygon",polygonIndices:p>65535?new Uint32Array(f+1):new Uint16Array(f+1),primitivePolygonIndices:p>65535?new Uint32Array(g+1):new Uint16Array(g+1),positions:new z(p*S),globalFeatureIds:new k(p),featureIds:m>65535?new Uint32Array(p):new Uint16Array(p),numericProps:{},properties:[],fields:[]};for(let e of(F&&(j.triangles=[]),[q,O,j]))for(let t of T){let i=C[t];e.numericProps[t]=new i(e.positions.length/S)}O.pathIndices[h]=c,j.polygonIndices[f]=p,j.primitivePolygonIndices[g]=p;let U={pointPosition:0,pointFeature:0,linePosition:0,linePath:0,lineFeature:0,polygonPosition:0,polygonObject:0,polygonRing:0,polygonFeature:0,feature:0};for(let t of e){let e=t.geometry,i=t.properties||{};switch(e.type){case"Point":(function(e,t,i,r,o){t.positions.set(e.data,i.pointPosition*r);let n=e.data.length/r;R(t,o,i.pointPosition,n),t.globalFeatureIds.fill(i.feature,i.pointPosition,i.pointPosition+n),t.featureIds.fill(i.pointFeature,i.pointPosition,i.pointPosition+n),i.pointPosition+=n})(e,q,U,S,i),q.properties.push(E(i,T)),N&&q.fields.push({id:t.id}),U.pointFeature++;break;case"LineString":(function(e,t,i,r,o){t.positions.set(e.data,i.linePosition*r);let n=e.data.length/r;R(t,o,i.linePosition,n),t.globalFeatureIds.fill(i.feature,i.linePosition,i.linePosition+n),t.featureIds.fill(i.lineFeature,i.linePosition,i.linePosition+n);for(let o=0,n=e.indices.length;o<n;++o){let s=e.indices[o],a=o===n-1?e.data.length:e.indices[o+1];t.pathIndices[i.linePath++]=i.linePosition,i.linePosition+=(a-s)/r}})(e,O,U,S,i),O.properties.push(E(i,T)),N&&O.fields.push({id:t.id}),U.lineFeature++;break;case"Polygon":(function(e,t,i,r,o){t.positions.set(e.data,i.polygonPosition*r);let n=e.data.length/r;R(t,o,i.polygonPosition,n),t.globalFeatureIds.fill(i.feature,i.polygonPosition,i.polygonPosition+n),t.featureIds.fill(i.polygonFeature,i.polygonPosition,i.polygonPosition+n);for(let o=0,n=e.indices.length;o<n;++o){let n=i.polygonPosition;t.polygonIndices[i.polygonObject++]=n;let s=e.areas[o],a=e.indices[o],l=e.indices[o+1];for(let o=0,n=a.length;o<n;++o){let s=a[o],u=o===n-1?void 0===l?e.data.length:l[0]:a[o+1];t.primitivePolygonIndices[i.polygonRing++]=i.polygonPosition,i.polygonPosition+=(u-s)/r}!function(e,t,i,{startPosition:r,endPosition:o,coordLength:n}){if(!e.triangles)return;let s=e.positions.subarray(r*n,o*n),a=i[0],l=function(e,t,i=2,r,o="xy"){let n,s,a,l,u,c,h,d=t&&t.length,p=d?t[0]*i:e.length,f=y(e,0,p,i,!0,r&&r[0],o),g=[];if(!f||f.next===f.prev)return g;if(d&&(f=function(e,t,i,r,o,n){let s,a,l,u,c,h=[];for(s=0,a=t.length;s<a;s++)l=t[s]*r,u=s<a-1?t[s+1]*r:e.length,(c=y(e,l,u,r,!1,o&&o[s+1],n))===c.next&&(c.steiner=!0),h.push(function(e){let t=e,i=e;do(t.x<i.x||t.x===i.x&&t.y<i.y)&&(i=t),t=t.next;while(t!==e)return i}(c));for(h.sort(v),s=0;s<h.length;s++)i=function(e,t){let i=function(e,t){let i,r,o=t,n=e.x,s=e.y,a=-1/0;do{if(s<=o.y&&s>=o.next.y&&o.next.y!==o.y){let e=o.x+(s-o.y)*(o.next.x-o.x)/(o.next.y-o.y);if(e<=n&&e>a&&(a=e,i=o.x<o.next.x?o:o.next,e===n))return i}o=o.next}while(o!==t)if(!i)return null;let l=i,u=i.x,c=i.y,h=1/0;o=i;do{var d,p;n>=o.x&&o.x>=u&&n!==o.x&&_(s<c?n:a,s,u,c,s<c?a:n,s,o.x,o.y)&&(r=Math.abs(s-o.y)/(n-o.x),A(o,e)&&(r<h||r===h&&(o.x>i.x||o.x===i.x&&(d=i,p=o,0>w(d.prev,d,p.prev)&&0>w(p.next,d,d.next))))&&(i=o,h=r)),o=o.next}while(o!==l)return i}(e,t);if(!i)return t;let r=I(i,e);return x(r,r.next),x(i,i.next)}(h[s],i);return i}(e,t,f,i,r,o)),e.length>80*i){l=s=e[0],u=a=e[1];for(let t=i;t<p;t+=i)c=e[t],h=e[t+1],c<l&&(l=c),h<u&&(u=h),c>s&&(s=c),h>a&&(a=h);n=0!==(n=Math.max(s-l,a-u))?32767/n:0}return function e(t,i,r,o,n,s,a){let l,u;if(!t)return;!a&&s&&function(e,t,i,r){let o=e;do 0===o.z&&(o.z=b(o.x,o.y,t,i,r)),o.prevZ=o.prev,o.nextZ=o.next,o=o.next;while(o!==e)o.prevZ.nextZ=null,o.prevZ=null,function(e){let t,i,r,o,n,s,a,l,u=1;do{for(o=e,e=null,l=null,r=0;o;){for(r++,s=o,n=0,i=0;i<u&&(n++,s=s.nextZ);i++);for(a=u;n>0||a>0&&s;)0!==n&&(0===a||!s||o.z<=s.z)?(t=o,o=o.nextZ,n--):(t=s,s=s.nextZ,a--),l?l.nextZ=t:e=t,t.prevZ=l,l=t;o=s}l.nextZ=null,u*=2}while(r>1)}(o)}(t,o,n,s);let c=t;for(;t.prev!==t.next;){if(l=t.prev,u=t.next,s?function(e,t,i,r){let o=e.prev,n=e.next;if(w(o,e,n)>=0)return!1;let s=o.x,a=e.x,l=n.x,u=o.y,c=e.y,h=n.y,d=s<a?s<l?s:l:a<l?a:l,p=u<c?u<h?u:h:c<h?c:h,f=s>a?s>l?s:l:a>l?a:l,g=u>c?u>h?u:h:c>h?c:h,m=b(d,p,t,i,r),y=b(f,g,t,i,r),x=e.prevZ,v=e.nextZ;for(;x&&x.z>=m&&v&&v.z<=y;){if(x.x>=d&&x.x<=f&&x.y>=p&&x.y<=g&&x!==o&&x!==n&&_(s,u,a,c,l,h,x.x,x.y)&&w(x.prev,x,x.next)>=0||(x=x.prevZ,v.x>=d&&v.x<=f&&v.y>=p&&v.y<=g&&v!==o&&v!==n&&_(s,u,a,c,l,h,v.x,v.y)&&w(v.prev,v,v.next)>=0))return!1;v=v.nextZ}for(;x&&x.z>=m;){if(x.x>=d&&x.x<=f&&x.y>=p&&x.y<=g&&x!==o&&x!==n&&_(s,u,a,c,l,h,x.x,x.y)&&w(x.prev,x,x.next)>=0)return!1;x=x.prevZ}for(;v&&v.z<=y;){if(v.x>=d&&v.x<=f&&v.y>=p&&v.y<=g&&v!==o&&v!==n&&_(s,u,a,c,l,h,v.x,v.y)&&w(v.prev,v,v.next)>=0)return!1;v=v.nextZ}return!0}(t,o,n,s):function(e){let t=e.prev,i=e.next;if(w(t,e,i)>=0)return!1;let r=t.x,o=e.x,n=i.x,s=t.y,a=e.y,l=i.y,u=r<o?r<n?r:n:o<n?o:n,c=s<a?s<l?s:l:a<l?a:l,h=r>o?r>n?r:n:o>n?o:n,d=s>a?s>l?s:l:a>l?a:l,p=i.next;for(;p!==t;){if(p.x>=u&&p.x<=h&&p.y>=c&&p.y<=d&&_(r,s,o,a,n,l,p.x,p.y)&&w(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}(t)){i.push(l.i/r|0),i.push(t.i/r|0),i.push(u.i/r|0),L(t),t=u.next,c=u.next;continue}if((t=u)===c){a?1===a?e(t=function(e,t,i){let r=e;do{let o=r.prev,n=r.next.next;!P(o,n)&&M(o,r,r.next,n)&&A(o,n)&&A(n,o)&&(t.push(o.i/i|0),t.push(r.i/i|0),t.push(n.i/i|0),L(r),L(r.next),r=e=n),r=r.next}while(r!==e)return x(r)}(x(t),i,r),i,r,o,n,s,2):2===a&&function(t,i,r,o,n,s){let a=t;do{let t=a.next.next;for(;t!==a.prev;){var l,u;if(a.i!==t.i&&(l=a,u=t,l.next.i!==u.i&&l.prev.i!==u.i&&!function(e,t){let i=e;do{if(i.i!==e.i&&i.next.i!==e.i&&i.i!==t.i&&i.next.i!==t.i&&M(i,i.next,e,t))return!0;i=i.next}while(i!==e)return!1}(l,u)&&(A(l,u)&&A(u,l)&&function(e,t){let i=e,r=!1,o=(e.x+t.x)/2,n=(e.y+t.y)/2;do i.y>n!=i.next.y>n&&i.next.y!==i.y&&o<(i.next.x-i.x)*(n-i.y)/(i.next.y-i.y)+i.x&&(r=!r),i=i.next;while(i!==e)return r}(l,u)&&(w(l.prev,l,u.prev)||w(l,u.prev,u))||P(l,u)&&w(l.prev,l,l.next)>0&&w(u.prev,u,u.next)>0))){let l=I(a,t);a=x(a,a.next),l=x(l,l.next),e(a,i,r,o,n,s,0),e(l,i,r,o,n,s,0);return}t=t.next}a=a.next}while(a!==t)}(t,i,r,o,n,s):e(x(t),i,r,o,n,s,1);break}}}(f,g,i,l,u,n,0),g}(s,i.slice(1).map(e=>(e-a)/n),n,t);for(let t=0,i=l.length;t<i;++t)e.triangles.push(r+l[t])}(t,s,a,{startPosition:n,endPosition:i.polygonPosition,coordLength:r})}})(e,j,U,S,i),j.properties.push(E(i,T)),N&&j.fields.push({id:t.id}),U.polygonFeature++;break;default:throw Error("Invalid geometry type")}U.feature++}return r=q,o=O,n=j,s=S,(a={shape:"binary-feature-collection",points:{...r,positions:{value:r.positions,size:s},globalFeatureIds:{value:r.globalFeatureIds,size:1},featureIds:{value:r.featureIds,size:1},numericProps:V(r.numericProps,1)},lines:{...o,positions:{value:o.positions,size:s},pathIndices:{value:o.pathIndices,size:1},globalFeatureIds:{value:o.globalFeatureIds,size:1},featureIds:{value:o.featureIds,size:1},numericProps:V(o.numericProps,1)},polygons:{...n,positions:{value:n.positions,size:s},polygonIndices:{value:n.polygonIndices,size:1},primitivePolygonIndices:{value:n.primitivePolygonIndices,size:1},globalFeatureIds:{value:n.globalFeatureIds,size:1},featureIds:{value:n.featureIds,size:1},numericProps:V(n.numericProps,1)}}).polygons&&n.triangles&&(a.polygons.triangles={value:new Uint32Array(n.triangles),size:1}),a}(o,{propArrayTypes:i,...n},{numericPropKeys:r,PositionDataType:Float32Array,triangulate:!0}));return s.byteLength=e.byteLength,s}function $(e,t){if(e.byteLength<=0)return[];let i=[],r=new W(new O(e));return(Array.isArray(t.layers)?t.layers:Object.keys(r.layers)).forEach(e=>{let o=r.layers[e];if(o)for(let r=0;r<o.length;r++){let n=function(e,t,i){let r=e.toGeoJSONFeature(t.coordinates||"local",t.tileIndex);return t.layerProperty&&(r.properties||={},r.properties[t.layerProperty]=i),r}(o.getGeoJSONFeature(r),t,e);i.push(n)}}),i}let Q={name:"Mapbox Vector Tile",id:"mvt",module:"mvt",extensions:["mvt","pbf"],mimeTypes:["application/vnd.mapbox-vector-tile","application/x-protobuf"],category:"geometry",dataType:null,batchType:null,version:"4.5.4",worker:!0,options:{mvt:{shape:"geojson",coordinates:"local",layerProperty:"layerName",layers:void 0,tileIndex:void 0}}};function J(e,t,i){t=t||0,i=i||e.value.length/e.size;let r=[];for(let o=t;o<i;o++){let t=[];for(let i=o*e.size;i<(o+1)*e.size;i++)t.push(Number(e.value[i]));r.push(t)}return r}function Y(e,t){let i=t?.globalFeatureId;return void 0!==i?function(e,t){for(let i of ee(e)){let e=0,r=i.featureIds.value[0];for(let o=0;o<i.featureIds.value.length;o++){let n=i.featureIds.value[o];if(n!==r){if(t===i.globalFeatureIds.value[e])return et(i,e,o);e=o,r=n}}if(t===i.globalFeatureIds.value[e])return et(i,e,i.featureIds.value.length)}throw Error(`featureId:${t} not found`)}(e,i):function(e){let t=[];for(let i of e){if(0===i.featureIds.value.length)continue;let e=0,r=i.featureIds.value[0];for(let o=0;o<i.featureIds.value.length;o++){let n=i.featureIds.value[o];n!==r&&(t.push(et(i,e,o)),e=o,r=n)}t.push(et(i,e,i.featureIds.value.length))}return t}(ee(e,t?.type))}function ee(e,t){let i=[];return e.points&&(e.points.type="Point",i.push(e.points)),e.lines&&(e.lines.type="LineString",i.push(e.lines)),e.polygons&&(e.polygons.type="Polygon",i.push(e.polygons)),i}function et(e,t,i){let r=function(e,t,i){switch(e.type){case"Point":return function(e,t,i){let{positions:r}=e,o=J(r,t,i);return o.length>1?{type:"MultiPoint",coordinates:o}:{type:"Point",coordinates:o[0]}}(e,t,i);case"LineString":return function(e,t=-1/0,i=1/0){let{positions:r}=e,o=e.pathIndices.value.filter(e=>e>=t&&e<=i);if(!(o.length>2))return{type:"LineString",coordinates:J(r,o[0],o[1])};let n=[];for(let e=0;e<o.length-1;e++){let t=J(r,o[e],o[e+1]);n.push(t)}return{type:"MultiLineString",coordinates:n}}(e,t,i);case"Polygon":return function e(t,i=-1/0,r=1/0){let{positions:o}=t,n=t.polygonIndices.value.filter(e=>e>=i&&e<=r),s=t.primitivePolygonIndices.value.filter(e=>e>=i&&e<=r);if(!(n.length>2)){let e=[];for(let t=0;t<s.length-1;t++){let i=J(o,s[t],s[t+1]);e.push(i)}return{type:"Polygon",coordinates:e}}let a=[];for(let i=0;i<n.length-1;i++){let r=e(t,n[i],n[i+1]).coordinates;a.push(r)}return{type:"MultiPolygon",coordinates:a}}(e,t,i);default:throw Error(`Unsupported geometry type: ${e?.type}`)}}(e,t,i);return{type:"Feature",geometry:r,properties:function(e,t=0){let i=Object.assign({},e.properties[e.featureIds.value[t]]);for(let r in e.numericProps)i[r]=e.numericProps[r].value[t];return i}(e,t),...function(e,t=0){return e.fields&&e.fields[e.featureIds.value[t]]}(e,t)}}({...Q,parse:async(e,t)=>K(e,t),parseSync:K,binary:!0});let ei={Point:er,MultiPoint:function(e,t,i){return eo(e,t,i)},LineString:function(e,t,i){return eo(e,t,i)},MultiLineString:function(e,t,i){return e.map(e=>eo(e,t,i))},Polygon:en,MultiPolygon:function(e,t,i){return e.map(e=>en(e,t,i))}};function er([e,t],[i,r],o){let n=(0,f.lerp)(i[0],r[0],e),s=(0,f.lerp)(i[1],r[1],t);return o.unprojectFlat([n,s])}function eo(e,t,i){return e.map(e=>er(e,t,i))}function en(e,t,i){return e.map(e=>eo(e,t,i))}let es=["points","lines","polygons"];function ea(e,t,i,r){for(let o=i;o<r;o++)if(t(e[o],o))return o;return -1}var el=i(32774),eu=i(95564);let ec={...s.A.defaultProps,data:eu.cS,onDataLoad:{type:"function",value:null,optional:!0,compare:!1},uniqueIdProperty:"",highlightedFeatureId:null,loaders:[Q],binary:!0};class eh extends el.A{initializeState(){super.initializeState();let e=void 0===this.context.viewport.resolution&&this.props.binary;this.setState({binary:e,data:null,tileJSON:null,hoveredFeatureId:null,hoveredFeatureLayerName:null})}get isLoaded(){return!!(this.state?.data&&super.isLoaded)}updateState({props:e,oldProps:t,context:i,changeFlags:r}){r.dataChanged&&this._updateTileData(),this.state?.data&&(super.updateState({props:e,oldProps:t,context:i,changeFlags:r}),this._setWGS84PropertyForTiles());let{highlightColor:o}=e;o!==t.highlightColor&&Array.isArray(o)&&this.setState({highlightColor:o})}async _updateTileData(){let e=this.props.data,t=null;if("string"!=typeof e||(0,eu.Ar)(e))e&&"object"==typeof e&&"tilejson"in e&&(t=e);else{let{onDataLoad:i,fetch:r}=this.props;this.setState({data:null,tileJSON:null});try{t=await r(e,{propName:"data",layer:this,loaders:[]})}catch(t){this.raiseError(t,"loading TileJSON"),e=null}i&&i(t,{propName:"data",layer:this})}t&&(e=t.tiles),this.setState({data:e,tileJSON:t})}_getTilesetOptions(){let e=super._getTilesetOptions(),t=this.state.tileJSON,{minZoom:i,maxZoom:r}=this.props;return t&&(Number.isFinite(t.minzoom)&&t.minzoom>i&&(e.minZoom=t.minzoom),Number.isFinite(t.maxzoom)&&(!Number.isFinite(r)||t.maxzoom<r)&&(e.maxZoom=t.maxzoom)),e}renderLayers(){return this.state?.data?super.renderLayers():null}getTileData(e){let{data:t,binary:i}=this.state,{index:r,signal:o}=e,n=(0,eu.g8)(t,e);if(!n)return Promise.reject("Invalid URL");let s=this.getLoadOptions(),{fetch:a}=this.props;return a(n,{propName:"data",layer:this,loadOptions:s={...s,core:{...s?.core,mimeType:"application/x-protobuf"},mvt:{...s?.mvt,shape:i?"binary":"geojson",coordinates:this.context.viewport.resolution?"wgs84":"local",tileIndex:r}},signal:o})}renderSubLayers(e){let{x:t,y:i,z:r}=e.tile.index,a=Math.pow(2,r),l=512/a,u=new f.Matrix4().scale([l,-l,1]);e.autoHighlight=!1,this.context.viewport.resolution||(e.modelMatrix=u,e.coordinateOrigin=[512*t/a,512*(1-i/a),0],e.coordinateSystem=o.rf.CARTESIAN,e.extensions=[...e.extensions||[],new p]);let c=super.renderSubLayers(e);return!this.state.binary||c instanceof s.A||n.A.warn("renderSubLayers() must return GeoJsonLayer when using binary:true")(),c}_updateAutoHighlight(e){let{uniqueIdProperty:t}=this.props,{hoveredFeatureId:i,hoveredFeatureLayerName:r}=this.state,o=e.object,n=null,s=null;o&&(n=ep(o,t),s=ef(o));let{highlightColor:a}=this.props;"function"==typeof a&&(a=a(e)),(i!==n||r!==s)&&this.setState({highlightColor:a,hoveredFeatureId:n,hoveredFeatureLayerName:s})}_isWGS84(){return!!this.context.viewport.resolution}getPickingInfo(e){let t=super.getPickingInfo(e);if(this.state.binary&&-1!==t.index){let{data:i}=e.sourceLayer.props;t.object=Y(i,{globalFeatureId:t.index})}return t.object&&!this._isWGS84()&&(t.object=em(t.object,t.tile.bbox,this.context.viewport)),t}getSubLayerPropsByTile(e){return{highlightedObjectIndex:this.getHighlightedObjectIndex(e),highlightColor:this.state.highlightColor}}getHighlightedObjectIndex(e){let{hoveredFeatureId:t,hoveredFeatureLayerName:i,binary:r}=this.state,{uniqueIdProperty:o,highlightedFeatureId:n}=this.props,s=e.content,a=eg(n);if(!(eg(t)||a))return -1;let l=a?n:t;if(Array.isArray(s))return s.findIndex(e=>{let t=ep(e,o)===l,r=a||ef(e)===i;return t&&r});if(s&&r){var u=a?"":i;for(let e of es){let t=s[e]&&function(e,t,i,r){let o=e.featureIds.value;if(!o.length)return -1;let n=0,s=o[o.length-1]+1;if(r){let t=function(e,t){if(!e.__layers){let t={},{properties:i}=e;for(let e=0;e<i.length;e++){let{layerName:r}=i[e];r&&(t[r]?t[r][1]=e:t[r]=[e,e])}e.__layers=t}return e.__layers[t]}(e,r);if(!t)return -1;n=t[0],s=t[1]+1}let a=-1;if(t in e.numericProps){let r=e.numericProps[t].value.findIndex((e,t)=>e===i&&o[t]>=n&&o[t]<s);return r>=0?e.globalFeatureIds.value[r]:-1}return t?a=ea(e.properties,e=>e[t]===i,n,s):e.fields&&(a=ea(e.fields,e=>e.id===i,n,s)),a>=0?function(e,t){if(!e.__ids){let t=[],i=e.featureIds.value,r=e.globalFeatureIds.value;for(let e=0;e<i.length;e++)t[i[e]]=r[e];e.__ids=t}return e.__ids[t]}(e,a):-1}(s[e],o,l,u);if(t>=0)return t}}return -1}_pickObjects(e){let{deck:t,viewport:i}=this.context,r=i.width,o=i.height,n=i.x,s=i.y,a=[this.id];return t.pickObjects({x:n,y:s,width:r,height:o,layerIds:a,maxObjects:e})}getRenderedFeatures(e=null){let t=this._pickObjects(e),i=new Set,r=[];for(let e of t){let t=ep(e.object,this.props.uniqueIdProperty);void 0===t?r.push(e.object):i.has(t)||(i.add(t),r.push(e.object))}return r}_setWGS84PropertyForTiles(){let e="dataInWGS84";this.state.tileset.selectedTiles.forEach(t=>{t.hasOwnProperty(e)||Object.defineProperty(t,e,{get:()=>{if(!t.content)return null;if(this.state.binary&&Array.isArray(t.content)&&!t.content.length)return[];let{bbox:e}=t;if(void 0===t._contentWGS84&&(0,eu.NV)(e)){let i=this.state.binary?Y(t.content):t.content;t._contentWGS84=i.map(t=>em(t,e,this.context.viewport))}return t._contentWGS84}})})}}eh.layerName="MVTLayer",eh.defaultProps=ec;let ed=eh;function ep(e,t){return e.properties&&t?e.properties[t]:"id"in e?e.id:void 0}function ef(e){return e.properties?.layerName||null}function eg(e){return null!=e&&""!==e}function em(e,t,i){let r={...e,geometry:{type:e.geometry.type}};return Object.defineProperty(r.geometry,"coordinates",{get:()=>{var r;let o,n;return(r=e.geometry,o=i.projectFlat([t.west,t.north]),n=i.projectFlat([t.east,t.south]),{...r,coordinates:ei[r.type](r.coordinates,[o,n],i)}).coordinates}}),r}},32774(e,t,i){i.d(t,{A:()=>v});var r=i(59452),o=i(38055),n=i(54683),s=i(36827);let a={id:"request-scheduler",throttleRequests:!0,maxRequests:6,debounceTime:0};class l{props;stats;activeRequestCount=0;requestQueue=[];requestMap=new Map;updateTimer=null;constructor(e={}){this.props={...a,...e},this.stats=new s.Uz({id:this.props.id}),this.stats.get("Queued Requests"),this.stats.get("Active Requests"),this.stats.get("Cancelled Requests"),this.stats.get("Queued Requests Ever"),this.stats.get("Active Requests Ever")}setProps(e){void 0!==e.throttleRequests&&(this.props.throttleRequests=e.throttleRequests),void 0!==e.maxRequests&&(this.props.maxRequests=e.maxRequests),void 0!==e.debounceTime&&(this.props.debounceTime=e.debounceTime)}scheduleRequest(e,t=()=>0){if(!this.props.throttleRequests)return Promise.resolve({done:()=>{}});if(this.requestMap.has(e))return this.requestMap.get(e);let i={handle:e,priority:0,getPriority:t},r=new Promise(e=>(i.resolve=e,i));return this.requestQueue.push(i),this.requestMap.set(e,r),this._issueNewRequests(),r}_issueRequest(e){let{handle:t,resolve:i}=e,r=!1,o=()=>{r||(r=!0,this.requestMap.delete(t),this.activeRequestCount--,null===this.updateTimer&&(this.updateTimer=setTimeout(()=>this._issueNewRequestsAsync(),0)))};return this.activeRequestCount++,i?i({done:o}):Promise.resolve({done:o})}_issueNewRequests(){null!==this.updateTimer&&clearTimeout(this.updateTimer),this.updateTimer=setTimeout(()=>this._issueNewRequestsAsync(),this.props.debounceTime)}_issueNewRequestsAsync(){null!==this.updateTimer&&clearTimeout(this.updateTimer),this.updateTimer=null;let e=Math.max(this.props.maxRequests-this.activeRequestCount,0);if(0!==e){this._updateAllRequests();for(let t=0;t<e;++t){let e=this.requestQueue.shift();e&&this._issueRequest(e)}}}_updateAllRequests(){let e=this.requestQueue;for(let t=0;t<e.length;++t){let i=e[t];!this._updateRequest(i)&&(e.splice(t,1),this.requestMap.delete(i.handle),t--)}e.sort((e,t)=>e.priority-t.priority)}_updateRequest(e){return e.priority=e.getPriority(e.handle),!(e.priority<0)||(e.resolve(null),!1)}}var u=i(41481);class c{constructor(e){this.index=e,this.isVisible=!1,this.isSelected=!1,this.parent=null,this.children=[],this.content=null,this._loader=void 0,this._abortController=null,this._loaderId=0,this._isLoaded=!1,this._isCancelled=!1,this._needsReload=!1}get bbox(){return this._bbox}set bbox(e){this._bbox||(this._bbox=e,"west"in e?this.boundingBox=[[e.west,e.south],[e.east,e.north]]:this.boundingBox=[[e.left,e.top],[e.right,e.bottom]])}get data(){return this.isLoading&&this._loader?this._loader.then(()=>this.data):this.content}get isLoaded(){return this._isLoaded&&!this._needsReload}get isLoading(){return!!this._loader&&!this._isCancelled}get needsReload(){return this._needsReload||this._isCancelled}get byteLength(){let e=this.content?this.content.byteLength:0;return Number.isFinite(e)||console.error("byteLength not defined in tile data"),e}async _loadData({getData:e,getRequestPriority:t,requestScheduler:i,onLoad:r,onError:o}){let n,{index:s,id:a,bbox:l,userData:u,zoom:c}=this,h=this._loaderId;this._abortController=new AbortController;let{signal:d}=this._abortController,p=await i.scheduleRequest(this,t);if(!p){this._isCancelled=!0;return}if(this._isCancelled)return void p.done();let f=null;try{f=await e({index:s,id:a,bbox:l,userData:u,zoom:c,signal:d})}catch(e){n=e||!0}finally{p.done()}if(h===this._loaderId){if(this._loader=void 0,this.content=f,this._isCancelled&&!f){this._isLoaded=!1;return}this._isLoaded=!0,this._isCancelled=!1,n?o(n,this):r(this)}}loadData(e){return this._isLoaded=!1,this._isCancelled=!1,this._needsReload=!1,this._loaderId++,this._loader=this._loadData(e),this._loader}setNeedsReload(){this.isLoading&&(this.abort(),this._loader=void 0),this._needsReload=!0}abort(){this.isLoaded||(this._isCancelled=!0,this._abortController?.abort())}}var h=i(95564);let d="best-available",p={[d]:function(e){for(let t of e)t.state=0;for(let t of e)t.isSelected&&!g(t)&&m(t);for(let t of e)t.isVisible=!!(2&t.state)},"no-overlap":function(e){for(let t of e)t.state=0;for(let t of e)t.isSelected&&g(t);for(let t of Array.from(e).sort((e,t)=>e.zoom-t.zoom))if(t.isVisible=!!(2&t.state),t.children&&(t.isVisible||1&t.state))for(let e of t.children)e.state=1;else t.isSelected&&m(t)},never:()=>{}},f={extent:null,tileSize:512,maxZoom:null,minZoom:null,maxCacheSize:null,maxCacheByteSize:null,refinementStrategy:"best-available",zRange:null,maxRequests:6,debounceTime:0,zoomOffset:0,visibleMinZoom:null,visibleMaxZoom:null,onTileLoad:()=>{},onTileUnload:()=>{},onTileError:()=>{}};function g(e){let t=e;for(;t;){if(t.isLoaded||t.content)return t.state|=2,!0;t=t.parent}return!1}function m(e){for(let t of e.children)t.isLoaded||t.content?t.state|=2:m(t)}let y={TilesetClass:class{constructor(e){var t;let i,r;this._getCullBounds=(t=h.ws,r={},e=>{for(let o in e)if(!function(e,t){if(e===t)return!0;if(Array.isArray(e)){let i=e.length;if(!t||t.length!==i)return!1;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}return!1}(e[o],r[o])){i=t(e),r=e;break}return i}),this.opts={...f,...e},this.setOptions(this.opts),this.onTileLoad=e=>{this.opts.onTileLoad?.(e),null!==this.opts.maxCacheByteSize&&(this._cacheByteSize+=e.byteLength,this._resizeCache())},this._requestScheduler=new l({throttleRequests:this.opts.maxRequests>0||this.opts.debounceTime>0,maxRequests:this.opts.maxRequests,debounceTime:this.opts.debounceTime}),this._cache=new Map,this._tiles=[],this._dirty=!1,this._cacheByteSize=0,this._viewport=null,this._zRange=null,this._selectedTiles=null,this._frameNumber=0,this._modelMatrix=new u.Matrix4,this._modelMatrixInverse=new u.Matrix4}get tiles(){return this._tiles}get selectedTiles(){return this._selectedTiles}get isLoaded(){return null!==this._selectedTiles&&this._selectedTiles.every(e=>e.isLoaded)}get needsReload(){return null!==this._selectedTiles&&this._selectedTiles.some(e=>e.needsReload)}setOptions(e){Object.assign(this.opts,e),Number.isFinite(e.maxZoom)&&(this._maxZoom=Math.floor(e.maxZoom)),Number.isFinite(e.minZoom)&&(this._minZoom=Math.ceil(e.minZoom)),this._viewport=null}finalize(){for(let e of this._cache.values())e.isLoading&&e.abort();this._cache.clear(),this._tiles=[],this._selectedTiles=null}reloadAll(){for(let e of this._cache.keys()){let t=this._cache.get(e);this._selectedTiles&&this._selectedTiles.includes(t)?t.setNeedsReload():this._cache.delete(e)}}update(e,{zRange:t,modelMatrix:i}={zRange:null,modelMatrix:null}){let r=i?new u.Matrix4(i):new u.Matrix4,o=!r.equals(this._modelMatrix);if(this._viewport&&e.equals(this._viewport)&&(0,u.equals)(this._zRange,t)&&!o)this.needsReload&&(this._selectedTiles=this._selectedTiles.map(e=>this._getTile(e.index,!0)));else{o&&(this._modelMatrixInverse=r.clone().invert(),this._modelMatrix=r),this._viewport=e,this._zRange=t;let i=this.getTileIndices({viewport:e,maxZoom:this._maxZoom,minZoom:this._minZoom,zRange:t,modelMatrix:this._modelMatrix,modelMatrixInverse:this._modelMatrixInverse});this._selectedTiles=i.map(e=>this._getTile(e,!0)),this._dirty&&this._rebuildTree()}let n=this.updateTileStates();return this._pruneRequests(),this._dirty&&this._resizeCache(),n&&this._frameNumber++,this._frameNumber}isTileVisible(e,t,i){if(!e.isVisible)return!1;if(t&&this._viewport){let r=this._getCullBounds({viewport:this._viewport,z:this._zRange,cullRect:t}),{bbox:o}=e;for(let[e,t,n,s]of r){let r;if("west"in o)r=o.west<n&&o.east>e&&o.south<s&&o.north>t;else{if(i&&!u.Matrix4.IDENTITY.equals(i)){let[e,t,r,n]=(0,h.Ww)([o.left,o.top,o.right,o.bottom],i);o={left:e,top:t,right:r,bottom:n}}let a=Math.min(o.top,o.bottom),l=Math.max(o.top,o.bottom);r=o.left<n&&o.right>e&&a<s&&l>t}if(r)return!0}return!1}return!0}getTileIndices({viewport:e,maxZoom:t,minZoom:i,zRange:r,modelMatrix:o,modelMatrixInverse:n}){let{tileSize:s,extent:a,zoomOffset:l,visibleMinZoom:u,visibleMaxZoom:c}=this.opts;return(0,h.Om)({viewport:e,maxZoom:t,minZoom:i,zRange:r,tileSize:s,extent:a,modelMatrix:o,modelMatrixInverse:n,zoomOffset:l,visibleMinZoom:u,visibleMaxZoom:c})}getTileId(e){return`${e.x}-${e.y}-${e.z}`}getTileZoom(e){return e.z}getTileMetadata(e){let{tileSize:t}=this.opts;return{bbox:(0,h.bR)(this._viewport,e.x,e.y,e.z,t)}}getParentIndex(e){let t=Math.floor(e.x/2);return{x:t,y:Math.floor(e.y/2),z:e.z-1}}updateTileStates(){let e=this.opts.refinementStrategy||d,t=Array(this._cache.size),i=0;for(let e of this._cache.values())t[i++]=e.isVisible,e.isSelected=!1,e.isVisible=!1;for(let e of this._selectedTiles)e.isSelected=!0,e.isVisible=!0;for(let r of(("function"==typeof e?e:p[e])(Array.from(this._cache.values())),i=0,this._cache.values()))if(t[i++]!==r.isVisible)return!0;return!1}_getRequestPriority(e){if(!e.isSelected&&!e.isVisible)return -1;let t=this._getTileDistancePriority(e);return e.isSelected?0+t:1e8+t}_getTileDistancePriority(e){let{width:t,height:i}=this._viewport||{};if(!this._viewport||!t||!i)return 0;try{let r=this._getTileScreenCorners(e.bbox),o=[t/2,i/2];if(4===r.length){if(this._isPointInPolygon(o,r))return 0;let e=r.reduce((e,t,i)=>{let n=r[(i+1)%r.length];return Math.min(e,this._getPointToSegmentDistanceSquared(o,t,n))},Number.MAX_SAFE_INTEGER);return Math.min(e,0x5f5e0ff)}}catch{}return 0x5f5e0ff}_getTileScreenCorners(e){return("west"in e?[[e.west,e.south],[e.east,e.south],[e.east,e.north],[e.west,e.north]]:[[e.left,e.top],[e.right,e.top],[e.right,e.bottom],[e.left,e.bottom]]).map(e=>this._viewport.project(e)).filter(([e,t])=>Number.isFinite(e)&&Number.isFinite(t))}_isPointInPolygon(e,t){let i=!1,[r,o]=e;for(let e=0,n=t.length-1;e<t.length;n=e++){let[s,a]=t[e],[l,u]=t[n];a>o!=u>o&&r<(l-s)*(o-a)/(u-a)+s&&(i=!i)}return i}_getPointToSegmentDistanceSquared(e,t,i){let[r,o]=e,[n,s]=t,[a,l]=i,u=a-n,c=l-s,h=u*u+c*c,d=h?Math.max(0,Math.min(1,((r-n)*u+(o-s)*c)/h)):0,p=r-(n+d*u),f=o-(s+d*c);return p*p+f*f}_pruneRequests(){let{maxRequests:e=0}=this.opts,t=[],i=0;for(let e of this._cache.values())e.isLoading&&(i++,e.isSelected||e.isVisible||t.push(e));for(;e>0&&i>e&&t.length>0;)t.shift().abort(),i--}_rebuildTree(){let{_cache:e}=this;for(let t of e.values())t.parent=null,t.children&&(t.children.length=0);for(let t of e.values()){let e=this._getNearestAncestor(t);t.parent=e,e?.children&&e.children.push(t)}}_resizeCache(){let{_cache:e,opts:t}=this,i=t.maxCacheSize??(null!==t.maxCacheByteSize?1/0:5*this.selectedTiles.length),r=t.maxCacheByteSize??1/0;if(e.size>i||this._cacheByteSize>r){for(let[o,n]of e)if(n.isVisible||n.isSelected||(this._cacheByteSize-=null!==t.maxCacheByteSize?n.byteLength:0,e.delete(o),this.opts.onTileUnload?.(n)),e.size<=i&&this._cacheByteSize<=r)break;this._rebuildTree(),this._dirty=!0}this._dirty&&(this._tiles=Array.from(this._cache.values()).sort((e,t)=>e.zoom-t.zoom),this._dirty=!1)}_getTile(e,t){let i=this.getTileId(e),r=this._cache.get(i),o=!1;return!r&&t?(Object.assign(r=new c(e),this.getTileMetadata(r.index)),Object.assign(r,{id:i,zoom:this.getTileZoom(r.index)}),o=!0,this._cache.set(i,r),this._dirty=!0):r&&r.needsReload&&(o=!0),r&&o&&r.loadData({getData:this.opts.getTileData,getRequestPriority:this._getRequestPriority.bind(this),requestScheduler:this._requestScheduler,onLoad:this.onTileLoad,onError:this.opts.onTileError}),r}_getNearestAncestor(e){let{_minZoom:t=0}=this,i=e.index;for(;this.getTileZoom(i)>t;){i=this.getParentIndex(i);let e=this._getTile(i);if(e)return e}return null}},data:{type:"data",value:[]},dataComparator:h.cS.equal,renderSubLayers:{type:"function",value:e=>new n.A(e)},getTileData:{type:"function",optional:!0,value:null},onViewportLoad:{type:"function",optional:!0,value:null},onTileLoad:{type:"function",value:e=>{}},onTileUnload:{type:"function",value:e=>{}},onTileError:{type:"function",value:e=>console.error(e)},extent:{type:"array",optional:!0,value:null,compare:!0},tileSize:512,maxZoom:null,minZoom:0,maxCacheSize:null,maxCacheByteSize:null,refinementStrategy:d,zRange:null,maxRequests:6,debounceTime:0,zoomOffset:0,visibleMinZoom:null,visibleMaxZoom:null};class x extends r.A{initializeState(){this.state={tileset:null,isLoaded:!1}}finalizeState(){this.state?.tileset?.finalize()}get isLoaded(){return!!this.state?.tileset?.selectedTiles?.every(e=>e.isLoaded&&(!e.content||!e.layers||e.layers.every(e=>e.isLoaded)))}shouldUpdateState({changeFlags:e}){return e.somethingChanged}updateState({changeFlags:e}){let{tileset:t}=this.state,i=e.propsOrDataChanged||e.updateTriggersChanged,r=e.dataChanged||e.updateTriggersChanged&&(e.updateTriggersChanged.all||e.updateTriggersChanged.getTileData);t?i&&(t.setOptions(this._getTilesetOptions()),r?t.reloadAll():t.tiles.forEach(e=>{e.layers=null})):(t=new this.props.TilesetClass(this._getTilesetOptions()),this.setState({tileset:t})),this._updateTileset()}_getTilesetOptions(){let{tileSize:e,maxCacheSize:t,maxCacheByteSize:i,refinementStrategy:r,extent:o,maxZoom:n,minZoom:s,maxRequests:a,debounceTime:l,zoomOffset:u,visibleMinZoom:c,visibleMaxZoom:h}=this.props;return{maxCacheSize:t,maxCacheByteSize:i,maxZoom:n,minZoom:s,tileSize:e,refinementStrategy:r,extent:o,maxRequests:a,debounceTime:l,zoomOffset:u,visibleMinZoom:c,visibleMaxZoom:h,getTileData:this.getTileData.bind(this),onTileLoad:this._onTileLoad.bind(this),onTileError:this._onTileError.bind(this),onTileUnload:this._onTileUnload.bind(this)}}_updateTileset(){let e=this.state.tileset,{zRange:t,modelMatrix:i}=this.props,r=e.update(this.context.viewport,{zRange:t,modelMatrix:i}),{isLoaded:o}=e,n=this.state.isLoaded!==o,s=this.state.frameNumber!==r;o&&(n||s)&&this._onViewportLoad(),s&&this.setState({frameNumber:r}),this.state.isLoaded=o}_onViewportLoad(){let{tileset:e}=this.state,{onViewportLoad:t}=this.props;t&&t(e.selectedTiles)}_onTileLoad(e){this.props.onTileLoad(e),e.layers=null,this.setNeedsUpdate()}_onTileError(e,t){this.props.onTileError(e),t.layers=null,this.setNeedsUpdate()}_onTileUnload(e){this.props.onTileUnload(e)}getTileData(e){let{data:t,getTileData:i,fetch:r}=this.props,{signal:o}=e;return(e.url="string"==typeof t||Array.isArray(t)?(0,h.g8)(t,e):null,i)?i(e):r&&e.url?r(e.url,{propName:"data",layer:this,signal:o}):null}renderSubLayers(e){return this.props.renderSubLayers(e)}getSubLayerPropsByTile(e){return null}getPickingInfo(e){let t=e.sourceLayer,i=t.props.tile,r=e.info;return r.picked&&(r.tile=i),r.sourceTile=i,r.sourceTileSubLayer=t,r}_updateAutoHighlight(e){e.sourceTileSubLayer.updateAutoHighlight(e)}renderLayers(){let{visibleMinZoom:e,visibleMaxZoom:t,minZoom:i,extent:r}=this.props,n=this.context.viewport.zoom;if(null!=e&&n<e||null!=t&&n>t||null!=i&&!r&&n<i){for(let e of this.state.tileset.tiles)e.layers=null;return[]}return this.state.tileset.tiles.map(e=>{let t=this.getSubLayerPropsByTile(e);if(e.isLoaded||e.content)if(e.layers)t&&e.layers[0]&&Object.keys(t).some(i=>e.layers[0].props[i]!==t[i])&&(e.layers=e.layers.map(e=>e.clone(t)));else{let i=this.renderSubLayers({...this.props,...this.getSubLayerProps({id:e.id,updateTriggers:this.props.updateTriggers}),data:e.content,_offset:0,tile:e});e.layers=(0,o.B)(i,Boolean).map(i=>i.clone({tile:e,...t}))}return e.layers})}filterSubLayer({layer:e,cullRect:t}){let{tile:i}=e.props,{modelMatrix:r}=this.props;return this.state.tileset.isTileVisible(i,t,r?new u.Matrix4(r):null)}}x.defaultProps=y,x.layerName="TileLayer";let v=x},95564(e,t,i){i.d(t,{Om:()=>et,bR:()=>ee,Ar:()=>ei,ws:()=>$,g8:()=>X,Ww:()=>K,cS:()=>H,NV:()=>er,uY:()=>J});var r=i(28193),o=i(78374),n=i(41481);let s=new n.Vector3,a=new n.Vector3;class l{constructor(e=[0,0,0],t=[0,0,0],i){i=i||s.copy(e).add(t).scale(.5),this.center=new n.Vector3(i),this.halfDiagonal=new n.Vector3(t).subtract(this.center),this.minimum=new n.Vector3(e),this.maximum=new n.Vector3(t)}clone(){return new l(this.minimum,this.maximum,this.center)}equals(e){return this===e||!!e&&this.minimum.equals(e.minimum)&&this.maximum.equals(e.maximum)}transform(e){return this.center.transformAsPoint(e),this.halfDiagonal.transform(e),this.minimum.transform(e),this.maximum.transform(e),this}intersectPlane(e){let{halfDiagonal:t}=this,i=a.from(e.normal),r=t.x*Math.abs(i.x)+t.y*Math.abs(i.y)+t.z*Math.abs(i.z),o=this.center.dot(i)+e.distance;return o-r>0?1:o+r<0?-1:0}distanceTo(e){return Math.sqrt(this.distanceSquaredTo(e))}distanceSquaredTo(e){let t,i=s.from(e).subtract(this.center),{halfDiagonal:r}=this,o=0;return(t=Math.abs(i.x)-r.x)>0&&(o+=t*t),(t=Math.abs(i.y)-r.y)>0&&(o+=t*t),(t=Math.abs(i.z)-r.z)>0&&(o+=t*t),o}}let u=new n.Vector3,c=new n.Vector3;class h{constructor(e=[0,0,0],t=0){this.radius=-0,this.center=new n.Vector3,this.fromCenterRadius(e,t)}fromCenterRadius(e,t){return this.center.from(e),this.radius=t,this}fromCornerPoints(e,t){return t=u.from(t),this.center=new n.Vector3().from(e).add(t).scale(.5),this.radius=this.center.distance(t),this}equals(e){return this===e||!!e&&this.center.equals(e.center)&&this.radius===e.radius}clone(){return new h(this.center,this.radius)}union(e){let t=this.center,i=this.radius,r=e.center,o=e.radius,n=u.copy(r).subtract(t),s=n.magnitude();if(i>=s+o)return this.clone();if(o>=s+i)return e.clone();let a=(i+s+o)*.5;return c.copy(n).scale((-i+a)/s).add(t),this.center.copy(c),this.radius=a,this}expand(e){let t=u.from(e).subtract(this.center).magnitude();return t>this.radius&&(this.radius=t),this}transform(e){this.center.transform(e);let t=n.mat4.getScaling(u,e);return this.radius=Math.max(t[0],Math.max(t[1],t[2]))*this.radius,this}distanceSquaredTo(e){let t=this.distanceTo(e);return t*t}distanceTo(e){return Math.max(0,u.from(e).subtract(this.center).len()-this.radius)}intersectPlane(e){let t=this.center,i=this.radius,r=e.normal.dot(t)+e.distance;return r<-i?-1:r<i?0:1}}let d=new n.Vector3,p=new n.Vector3,f=new n.Vector3,g=new n.Vector3,m=new n.Vector3,y=new n.Vector3,x=new n.Vector3;class v{constructor(e=[0,0,0],t=[0,0,0,0,0,0,0,0,0]){this.center=new n.Vector3().from(e),this.halfAxes=new n.Matrix3(t)}get halfSize(){let e=this.halfAxes.getColumn(0),t=this.halfAxes.getColumn(1),i=this.halfAxes.getColumn(2);return[new n.Vector3(e).len(),new n.Vector3(t).len(),new n.Vector3(i).len()]}get quaternion(){let e=this.halfAxes.getColumn(0),t=this.halfAxes.getColumn(1),i=this.halfAxes.getColumn(2),r=new n.Vector3(e).normalize(),o=new n.Vector3(t).normalize(),s=new n.Vector3(i).normalize();return new n.Quaternion().fromMatrix3(new n.Matrix3([...r,...o,...s]))}fromCenterHalfSizeQuaternion(e,t,i){let r=new n.Quaternion(i),o=new n.Matrix3().fromQuaternion(r);return o[0]=o[0]*t[0],o[1]=o[1]*t[0],o[2]=o[2]*t[0],o[3]=o[3]*t[1],o[4]=o[4]*t[1],o[5]=o[5]*t[1],o[6]=o[6]*t[2],o[7]=o[7]*t[2],o[8]=o[8]*t[2],this.center=new n.Vector3().from(e),this.halfAxes=o,this}clone(){return new v(this.center,this.halfAxes)}equals(e){return this===e||!!e&&this.center.equals(e.center)&&this.halfAxes.equals(e.halfAxes)}getBoundingSphere(e=new h){let t=this.halfAxes,i=t.getColumn(0,f),r=t.getColumn(1,g),o=t.getColumn(2,m),n=d.copy(i).add(r).add(o);return e.center.copy(this.center),e.radius=n.magnitude(),e}intersectPlane(e){let t=this.center,i=e.normal,r=this.halfAxes,o=i.x,n=i.y,s=i.z,a=Math.abs(o*r[0]+n*r[1]+s*r[2])+Math.abs(o*r[3]+n*r[4]+s*r[5])+Math.abs(o*r[6]+n*r[7]+s*r[8]),l=i.dot(t)+e.distance;return l<=-a?-1:1*!!(l>=a)}distanceTo(e){return Math.sqrt(this.distanceSquaredTo(e))}distanceSquaredTo(e){let t,i=p.from(e).subtract(this.center),r=this.halfAxes,o=r.getColumn(0,f),n=r.getColumn(1,g),s=r.getColumn(2,m),a=o.magnitude(),l=n.magnitude(),u=s.magnitude();o.normalize(),n.normalize(),s.normalize();let c=0;return(t=Math.abs(i.dot(o))-a)>0&&(c+=t*t),(t=Math.abs(i.dot(n))-l)>0&&(c+=t*t),(t=Math.abs(i.dot(s))-u)>0&&(c+=t*t),c}computePlaneDistances(e,t,i=[-0,-0]){let r=1/0,o=-1/0,n=this.center,s=this.halfAxes,a=s.getColumn(0,f),l=s.getColumn(1,g),u=s.getColumn(2,m),c=y.copy(a).add(l).add(u).add(n),h=x.copy(c).subtract(e),d=t.dot(h);return r=Math.min(d,r),o=Math.max(d,o),c.copy(n).add(a).add(l).subtract(u),h.copy(c).subtract(e),r=Math.min(d=t.dot(h),r),o=Math.max(d,o),c.copy(n).add(a).subtract(l).add(u),h.copy(c).subtract(e),r=Math.min(d=t.dot(h),r),o=Math.max(d,o),c.copy(n).add(a).subtract(l).subtract(u),h.copy(c).subtract(e),r=Math.min(d=t.dot(h),r),o=Math.max(d,o),n.copy(c).subtract(a).add(l).add(u),h.copy(c).subtract(e),r=Math.min(d=t.dot(h),r),o=Math.max(d,o),n.copy(c).subtract(a).add(l).subtract(u),h.copy(c).subtract(e),r=Math.min(d=t.dot(h),r),o=Math.max(d,o),n.copy(c).subtract(a).subtract(l).add(u),h.copy(c).subtract(e),r=Math.min(d=t.dot(h),r),o=Math.max(d,o),n.copy(c).subtract(a).subtract(l).subtract(u),h.copy(c).subtract(e),r=Math.min(d=t.dot(h),r),o=Math.max(d,o),i[0]=r,i[1]=o,i}transform(e){this.center.transformAsPoint(e);let t=this.halfAxes.getColumn(0,f);t.transformAsPoint(e);let i=this.halfAxes.getColumn(1,g);i.transformAsPoint(e);let r=this.halfAxes.getColumn(2,m);return r.transformAsPoint(e),this.halfAxes=new n.Matrix3([...t,...i,...r]),this}getTransform(){throw Error("not implemented")}}let b=new n.Vector3,_=new n.Vector3;class w{constructor(e=[0,0,1],t=0){this.normal=new n.Vector3,this.distance=-0,this.fromNormalDistance(e,t)}fromNormalDistance(e,t){return(0,n.assert)(Number.isFinite(t)),this.normal.from(e).normalize(),this.distance=t,this}fromPointNormal(e,t){e=b.from(e),this.normal.from(t).normalize();let i=-this.normal.dot(e);return this.distance=i,this}fromCoefficients(e,t,i,r){return this.normal.set(e,t,i),(0,n.assert)((0,n.equals)(this.normal.len(),1)),this.distance=r,this}clone(){return new w(this.normal,this.distance)}equals(e){return(0,n.equals)(this.distance,e.distance)&&(0,n.equals)(this.normal,e.normal)}getPointDistance(e){return this.normal.dot(e)+this.distance}transform(e){let t=_.copy(this.normal).transformAsVector(e).normalize(),i=this.normal.scale(-this.distance).transform(e);return this.fromPointNormal(i,t)}projectPointOntoPlane(e,t=[0,0,0]){let i=b.from(e),r=this.getPointDistance(i),o=_.copy(this.normal).scale(r);return i.subtract(o).to(t)}}let P=[new n.Vector3([1,0,0]),new n.Vector3([0,1,0]),new n.Vector3([0,0,1])],M=new n.Vector3,C=new n.Vector3;class S{constructor(e=[]){this.planes=e}fromBoundingSphere(e){this.planes.length=2*P.length;let t=e.center,i=e.radius,r=0;for(let e of P){let o=this.planes[r],n=this.planes[r+1];o||(o=this.planes[r]=new w),n||(n=this.planes[r+1]=new w);let s=M.copy(e).scale(-i).add(t);o.fromPointNormal(s,e);let a=M.copy(e).scale(i).add(t),l=C.copy(e).negate();n.fromPointNormal(a,l),r+=2}return this}computeVisibility(e){let t=1;for(let i of this.planes)switch(e.intersectPlane(i)){case -1:return -1;case 0:t=0}return t}computeVisibilityWithPlaneMask(e,t){if((0,n.assert)(Number.isFinite(t),"parentPlaneMask is required."),t===S.MASK_OUTSIDE||t===S.MASK_INSIDE)return t;let i=S.MASK_INSIDE,r=this.planes;for(let o=0;o<this.planes.length;++o){let n=o<31?1<<o:0;if(o<31&&(t&n)==0)continue;let s=r[o],a=e.intersectPlane(s);if(-1===a)return S.MASK_OUTSIDE;0===a&&(i|=n)}return i}}S.MASK_OUTSIDE=0xffffffff,S.MASK_INSIDE=0,S.MASK_INDETERMINATE=0x7fffffff,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3,new n.Vector3;let A=new n.Matrix3,I=new n.Matrix3,T=new n.Matrix3,L=new n.Matrix3,z=new n.Matrix3,V=[1,0,0],R=[2,2,1],E=new n.Vector3,F=new n.Vector3,N=new n.Vector3,k=new n.Vector3,q=new n.Vector3,O=new n.Matrix3,j={diagonal:new n.Matrix3,unitary:new n.Matrix3};var U=i(88967);let D=[[.5,.5],[0,0],[0,1],[1,0],[1,1]],B=D.concat([[0,.5],[.5,0],[1,.5],[.5,1]]),G=B.concat([[.25,.5],[.75,.5]]);class Z{constructor(e,t,i){this.x=e,this.y=t,this.z=i}get children(){if(!this._children){let e=2*this.x,t=2*this.y,i=this.z+1;this._children=[new Z(e,t,i),new Z(e,t+1,i),new Z(e+1,t,i),new Z(e+1,t+1,i)]}return this._children}update(e){let{viewport:t,cullingVolume:i,elevationBounds:r,minZ:o,maxZ:n,bounds:s,offset:a,project:l}=e,u=this.getBoundingVolume(r,a,l);if(s&&!this.insideBounds(s)||0>i.computeVisibility(u)||l&&this.beyondHorizon(t.cameraPosition,l,r[1]))return!1;if(!this.childVisible){let{z:e}=this;if(e<n&&e>=o&&(e+=Math.floor(Math.log2(u.distanceTo(t.cameraPosition)*t.scale/t.height))),e>=n)return this.selected=!0,!0}for(let t of(this.selected=!1,this.childVisible=!0,this.children))t.update(e);return!0}getSelected(e=[]){if(this.selected&&e.push(this),this._children)for(let t of this._children)t.getSelected(e);return e}beyondHorizon(e,t,i){let r=e[0],o=e[1],n=e[2],s=Math.sqrt(r*r+o*o+n*n),a=180*Math.atan2(r,-o)/Math.PI,l=180*Math.asin(n/s)/Math.PI,[u,c]=J(this.x,this.y,this.z),[h,d]=J(this.x+1,this.y+1,this.z),p=(u+h)/2,f=t([Math.max(u,Math.min(p+((a-p+540)%360-180),h)),Math.max(d,Math.min(l,c)),i]);return f[0]*r+f[1]*o+f[2]*n<=f[0]*f[0]+f[1]*f[1]+f[2]*f[2]}insideBounds([e,t,i,r]){let o=512/Math.pow(2,this.z);return this.x*o<i&&this.y*o<r&&(this.x+1)*o>e&&(this.y+1)*o>t}getBoundingVolume(e,t,i){if(i){let t=this.z<1?G:this.z<2?B:D,r=[];for(let o of t){let t=J(this.x+o[0],this.y+o[1],this.z);t[2]=e[0],r.push(i(t)),e[0]!==e[1]&&(t[2]=e[1],r.push(i(t)))}return function(e,t=new v){if(!e||0===e.length)return t.halfAxes=new n.Matrix3([0,0,0,0,0,0,0,0,0]),t.center=new n.Vector3,t;let i=e.length,r=new n.Vector3(0,0,0);for(let t of e)r.add(t);let o=1/i;r.multiplyByScalar(o);let s=0,a=0,l=0,u=0,c=0,h=0;for(let t of e){let e=E.copy(t).subtract(r);s+=e.x*e.x,a+=e.x*e.y,l+=e.x*e.z,u+=e.y*e.y,c+=e.y*e.z,h+=e.z*e.z}s*=o,a*=o,l*=o,u*=o,c*=o,h*=o,O[0]=s,O[1]=a,O[2]=l,O[3]=a,O[4]=u,O[5]=c,O[6]=l,O[7]=c,O[8]=h;let{unitary:d}=function(e,t={}){let i=n._MathUtils.EPSILON20,r=0,o=0;I.identity(),T.copy(e);let s=i*function(e){let t=0;for(let i=0;i<9;++i){let r=e[i];t+=r*r}return Math.sqrt(t)}(T);for(;o<10&&function(e){let t=0;for(let i=0;i<3;++i){let r=e[A.getElementIndex(R[i],V[i])];t+=2*r*r}return Math.sqrt(t)}(T)>s;)(function(e,t){let i=n._MathUtils.EPSILON15,r=0,o=1;for(let t=0;t<3;++t){let i=Math.abs(e[A.getElementIndex(R[t],V[t])]);i>r&&(o=t,r=i)}let s=V[o],a=R[o],l=1,u=0;if(Math.abs(e[A.getElementIndex(a,s)])>i){let t,i=(e[A.getElementIndex(a,a)]-e[A.getElementIndex(s,s)])/2/e[A.getElementIndex(a,s)];l=1/Math.sqrt(1+(t=i<0?-1/(-i+Math.sqrt(1+i*i)):1/(i+Math.sqrt(1+i*i)))*t),u=t*l}n.Matrix3.IDENTITY.to(t),t[A.getElementIndex(s,s)]=t[A.getElementIndex(a,a)]=l,t[A.getElementIndex(a,s)]=u,t[A.getElementIndex(s,a)]=-u})(T,L),z.copy(L).transpose(),T.multiplyRight(L),T.multiplyLeft(z),I.multiplyRight(L),++r>2&&(++o,r=0);return t.unitary=I.toTarget(t.unitary),t.diagonal=T.toTarget(t.diagonal),t}(O,j),p=t.halfAxes.copy(d),f=p.getColumn(0,N),g=p.getColumn(1,k),m=p.getColumn(2,q),y=-Number.MAX_VALUE,x=-Number.MAX_VALUE,b=-Number.MAX_VALUE,_=Number.MAX_VALUE,w=Number.MAX_VALUE,P=Number.MAX_VALUE;for(let t of e)E.copy(t),y=Math.max(E.dot(f),y),x=Math.max(E.dot(g),x),b=Math.max(E.dot(m),b),_=Math.min(E.dot(f),_),w=Math.min(E.dot(g),w),P=Math.min(E.dot(m),P);f=f.multiplyByScalar(.5*(_+y)),g=g.multiplyByScalar(.5*(w+x)),m=m.multiplyByScalar(.5*(P+b)),t.center.copy(f).add(g).add(m);let M=F.set(y-_,x-w,b-P).multiplyByScalar(.5),C=new n.Matrix3([M[0],0,0,0,M[1],0,0,0,M[2]]);return t.halfAxes.multiplyRight(C),t}(r)}let r=512/Math.pow(2,this.z),o=this.x*r+512*t,s=512-(this.y+1)*r;return new l([o,s,e[0]],[o+r,s+r,e[1]])}}let W=[-1/0,-1/0,1/0,1/0],H={type:"object",value:null,validate:(e,t)=>t.optional&&null===e||"string"==typeof e||Array.isArray(e)&&e.every(e=>"string"==typeof e),equal:(e,t)=>{if(e===t)return!0;if(!Array.isArray(e)||!Array.isArray(t))return!1;let i=e.length;if(i!==t.length)return!1;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}};function K(e,t){let i=[t.transformAsPoint([e[0],e[1]]),t.transformAsPoint([e[2],e[1]]),t.transformAsPoint([e[0],e[3]]),t.transformAsPoint([e[2],e[3]])];return[Math.min(...i.map(e=>e[0])),Math.min(...i.map(e=>e[1])),Math.max(...i.map(e=>e[0])),Math.max(...i.map(e=>e[1]))]}function X(e,t){if(!e||!e.length)return null;let{index:i,id:r}=t;if(Array.isArray(e)){let t=Math.abs(r.split("").reduce((e,t)=>(e<<5)-e+t.charCodeAt(0)|0,0))%e.length;e=e[t]}let o=e;for(let e of Object.keys(i)){let t=RegExp(`{${e}}`,"g");o=o.replace(t,String(i[e]))}return Number.isInteger(i.y)&&Number.isInteger(i.z)&&(o=o.replace(/\{-y\}/g,String(Math.pow(2,i.z)-i.y-1))),o}function $({viewport:e,z:t,cullRect:i}){return(e.subViewports||[e]).map(e=>(function e(t,i,r){if(!Array.isArray(i)){let e=r.x-t.x,o=r.y-t.y,{width:n,height:s}=r,a={targetZ:i},l=t.unproject([e,o],a),u=t.unproject([e+n,o],a),c=t.unproject([e,o+s],a),h=t.unproject([e+n,o+s],a);return[Math.min(l[0],u[0],c[0],h[0]),Math.min(l[1],u[1],c[1],h[1]),Math.max(l[0],u[0],c[0],h[0]),Math.max(l[1],u[1],c[1],h[1])]}let o=e(t,i[0],r),n=e(t,i[1],r);return[Math.min(o[0],n[0]),Math.min(o[1],n[1]),Math.max(o[2],n[2]),Math.max(o[3],n[3])]})(e,t||0,i))}function Q(e,t){return 512*Math.pow(2,e)/t}function J(e,t,i){let r=Q(i,512),o=Math.PI-2*Math.PI*t/r;return[e/r*360-180,180/Math.PI*Math.atan(.5*(Math.exp(o)-Math.exp(-o)))]}function Y(e,t,i,r){let o=Q(i,r);return[e/o*512,t/o*512]}function ee(e,t,i,r,o=512){if(e.isGeospatial){let[e,o]=J(t,i,r),[n,s]=J(t+1,i+1,r);return{west:e,north:o,east:n,south:s}}let[n,s]=Y(t,i,r,o),[a,l]=Y(t+1,i+1,r,o);return{left:n,top:s,right:a,bottom:l}}function et({viewport:e,maxZoom:t,minZoom:i,zRange:n,extent:s,tileSize:a=512,modelMatrix:l,modelMatrixInverse:u,zoomOffset:c=0,visibleMinZoom:h,visibleMaxZoom:d}){let p=e.isGeospatial?Math.round(e.zoom+Math.log2(512/a)+c):Math.ceil(e.zoom+c);if("number"==typeof i&&Number.isFinite(i)&&p<i){if(!s)return[];p=i}if("number"==typeof t&&Number.isFinite(t)&&p>t&&(p=t),null!=h&&e.zoom<h||null!=d&&e.zoom>d)return[];let f=s;return l&&u&&s&&!e.isGeospatial&&(f=K(s,l)),e.isGeospatial?function(e,t,i,n){let s=e instanceof r.Ay?e.projectPosition:null,a=new S(Object.values(e.getFrustumPlanes()).map(({normal:e,distance:t})=>new w(e.clone().negate(),t))),l=e.distanceScales.unitsPerMeter[2],u=i&&i[0]*l||0,c=i&&i[1]*l||0,h=e instanceof o.A&&e.pitch<=60?t:0;if(n){let[e,t,i,r]=n,o=(0,U.Gw)([e,r]),s=(0,U.Gw)([i,t]);n=[o[0],512-o[1],s[0],512-s[1]]}let d=new Z(0,0,0),p={viewport:e,project:s,cullingVolume:a,elevationBounds:[u,c],minZ:h,maxZ:t,bounds:n,offset:0};if(d.update(p),e instanceof o.A&&e.subViewports&&e.subViewports.length>1){for(p.offset=-1;d.update(p)&&!(--p.offset<-3););for(p.offset=1;d.update(p)&&!(++p.offset>3););}return d.getSelected()}(e,p,n,s):function(e,t,i,r,o){var n,s;let a,l=(n=e,s=r,a=n.getBounds(),n.isGeospatial?[Math.max(a[0],s[0]),Math.max(a[1],s[1]),Math.min(a[2],s[2]),Math.min(a[3],s[3])]:[Math.max(Math.min(a[0],s[2]),s[0]),Math.max(Math.min(a[1],s[3]),s[1]),Math.min(Math.max(a[2],s[0]),s[2]),Math.min(Math.max(a[3],s[1]),s[3])]),u=Q(t,i),[c,h,d,p]=o?K(l,o).map(e=>e*u/512):l.map(e=>e*u/512),f=[];for(let e=Math.floor(c);e<d;e++)for(let i=Math.floor(h);i<p;i++)f.push({x:e,y:i,z:t});return f}(e,p,a,f||W,u)}function ei(e){return/(?=.*{z})(?=.*{x})(?=.*({y}|{-y}))/.test(e)}function er(e){return Number.isFinite(e.west)&&Number.isFinite(e.north)&&Number.isFinite(e.east)&&Number.isFinite(e.south)}},17686(e,t,i){i.d(t,{A:()=>v});var r=i(41881),o=i(46487),n=i(84175),s=i(95335),a=i(30638),l=i(88967),u=i(41481);let c=new Uint32Array([0,2,1,0,3,2]),h=new Float32Array([0,1,0,0,1,0,1,1]),d=`\
layout(std140) uniform bitmapUniforms {
  vec4 bounds;
  float coordinateConversion;
  float desaturate;
  vec3 tintColor;
  vec4 transparentColor;
} bitmap;
`,p={name:"bitmap",source:`
struct BitmapUniforms {
  bounds: vec4<f32>,
  coordinateConversion: f32,
  desaturate: f32,
  tintColor: vec3<f32>,
  transparentColor: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> bitmap: BitmapUniforms;
@group(0) @binding(auto) var bitmapTexture: texture_2d<f32>;
@group(0) @binding(auto) var bitmapTextureSampler: sampler;
`,vs:d,fs:d,uniformTypes:{bounds:"vec4<f32>",coordinateConversion:"f32",desaturate:"f32",tintColor:"vec3<f32>",transparentColor:"vec4<f32>"}},f=`\
struct Attributes {
  @location(0) positions: vec3<f32>,
  @location(1) positions64Low: vec3<f32>,
  @location(2) texCoords: vec2<f32>,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vTexCoord: vec2<f32>,
  @location(1) vTexPos: vec2<f32>,
  @location(2) pickingColor: vec3<f32>,
  @location(3) pickingDepth: f32,
};

// from degrees to Web Mercator
fn lnglat_to_mercator(lnglat: vec2<f32>) -> vec2<f32> {
  let x = lnglat.x;
  let y = clamp(lnglat.y, -89.9, 89.9);
  return vec2<f32>(
    radians(x) + PI,
    PI + log(tan(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// from Web Mercator to degrees
fn mercator_to_lnglat(xy: vec2<f32>) -> vec2<f32> {
  let position = xy / WORLD_SCALE;
  return degrees(vec2<f32>(
    position.x - PI,
    atan(exp(position.y - PI)) * 2.0 - PI * 0.5
  ));
}

fn color_desaturate(colorValue: vec3<f32>) -> vec3<f32> {
  let luminance = (colorValue.r + colorValue.g + colorValue.b) * 0.333333333;
  return mix(colorValue, vec3<f32>(luminance), bitmap.desaturate);
}

fn color_tint(colorValue: vec3<f32>) -> vec3<f32> {
  return colorValue * bitmap.tintColor;
}

fn apply_opacity(colorValue: vec3<f32>, alpha: f32) -> vec4<f32> {
  if (bitmap.transparentColor.a == 0.0) {
    return vec4<f32>(colorValue, alpha);
  }
  let blendedAlpha = alpha + bitmap.transparentColor.a * (1.0 - alpha);
  let highLightRatio = alpha / blendedAlpha;
  let blendedRGB = mix(bitmap.transparentColor.rgb, colorValue, highLightRatio);
  return vec4<f32>(blendedRGB, blendedAlpha);
}

fn getUV(position: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(
    (position.x - bitmap.bounds[0]) / (bitmap.bounds[2] - bitmap.bounds[0]),
    (position.y - bitmap.bounds[3]) / (bitmap.bounds[1] - bitmap.bounds[3])
  );
}

// Pack the top 12 bits of two normalized floats into three 8-bit values.
fn packUVsIntoRGB(uv: vec2<f32>) -> vec3<f32> {
  let uv8bit = floor(uv * 256.0);
  let uvFraction = fract(uv * 256.0);
  let uvFraction4bit = floor(uvFraction * 16.0);
  let fractions = uvFraction4bit.x + uvFraction4bit.y * 16.0;
  return vec3<f32>(uv8bit, fractions) / 255.0;
}

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var output: Varyings;
  geometry.worldPosition = attributes.positions;
  geometry.uv = attributes.texCoords;
  geometry.pickingColor = picking_getPickingColorFromIndex(0u);

  let projectedPosition = project_position_to_clipspace_and_commonspace(
    attributes.positions,
    attributes.positions64Low,
    vec3<f32>(0.0)
  );
  geometry.position = projectedPosition.commonPosition;
  output.position = projectedPosition.clipPosition;
  output.vTexCoord = attributes.texCoords;
  output.vTexPos = vec2<f32>(0.0);
  output.pickingColor = geometry.pickingColor;
  output.pickingDepth = output.position.z / output.position.w;

  if (bitmap.coordinateConversion < -0.5) {
    output.vTexPos = geometry.position.xy + project.commonOrigin.xy;
  } else if (bitmap.coordinateConversion > 0.5) {
    output.vTexPos = geometry.worldPosition.xy;
  }

  return output;
}

@fragment
fn fragmentMain(input: Varyings) -> @location(0) vec4<f32> {
  var uv = input.vTexCoord;
  if (bitmap.coordinateConversion < -0.5) {
    uv = getUV(mercator_to_lnglat(input.vTexPos));
  } else if (bitmap.coordinateConversion > 0.5) {
    uv = getUV(lnglat_to_mercator(input.vTexPos));
  }

  let bitmapColor = textureSample(bitmapTexture, bitmapTextureSampler, uv);
  var fragColor = apply_opacity(
    color_tint(color_desaturate(bitmapColor.rgb)),
    bitmapColor.a * layer.opacity
  );

  geometry.uv = uv;

  if (picking.isActive > 0.5) {
    if (picking.isAttribute > 0.5) {
      return vec4<f32>(input.pickingDepth, 0.0, 0.0, 1.0);
    }
    return vec4<f32>(packUVsIntoRGB(uv), 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(input.pickingColor - highlightedObjectColor))) {
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

  return deckgl_premultiplied_alpha(fragColor);
}
`,g=`\
#version 300 es
#define SHADER_NAME bitmap-layer-vertex-shader

in vec2 texCoords;
in vec3 positions;
in vec3 positions64Low;

out vec2 vTexCoord;
out vec2 vTexPos;

const vec3 pickingColor = vec3(1.0, 0.0, 0.0);

void main(void) {
  geometry.worldPosition = positions;
  geometry.uv = texCoords;
  geometry.pickingColor = pickingColor;

  gl_Position = project_position_to_clipspace(positions, positions64Low, vec3(0.0), geometry.position);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  vTexCoord = texCoords;

  if (bitmap.coordinateConversion < -0.5) {
    vTexPos = geometry.position.xy + project.commonOrigin.xy;
  } else if (bitmap.coordinateConversion > 0.5) {
    vTexPos = geometry.worldPosition.xy;
  }

  vec4 color = vec4(0.0);
  DECKGL_FILTER_COLOR(color, geometry);
}
`,m=`
vec3 packUVsIntoRGB(vec2 uv) {
  // Extract the top 8 bits. We want values to be truncated down so we can add a fraction
  vec2 uv8bit = floor(uv * 256.);

  // Calculate the normalized remainders of u and v parts that do not fit into 8 bits
  // Scale and clamp to 0-1 range
  vec2 uvFraction = fract(uv * 256.);
  vec2 uvFraction4bit = floor(uvFraction * 16.);

  // Remainder can be encoded in blue channel, encode as 4 bits for pixel coordinates
  float fractions = uvFraction4bit.x + uvFraction4bit.y * 16.;

  return vec3(uv8bit, fractions) / 255.;
}
`,y=`\
#version 300 es
#define SHADER_NAME bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture;

in vec2 vTexCoord;
in vec2 vTexPos;

out vec4 fragColor;

/* projection utils */
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / PI / 2.0;

// from degrees to Web Mercator
vec2 lnglat_to_mercator(vec2 lnglat) {
  float x = lnglat.x;
  float y = clamp(lnglat.y, -89.9, 89.9);
  return vec2(
    radians(x) + PI,
    PI + log(tan(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// from Web Mercator to degrees
vec2 mercator_to_lnglat(vec2 xy) {
  xy /= WORLD_SCALE;
  return degrees(vec2(
    xy.x - PI,
    atan(exp(xy.y - PI)) * 2.0 - PI * 0.5
  ));
}
/* End projection utils */

// apply desaturation
vec3 color_desaturate(vec3 color) {
  float luminance = (color.r + color.g + color.b) * 0.333333333;
  return mix(color, vec3(luminance), bitmap.desaturate);
}

// apply tint
vec3 color_tint(vec3 color) {
  return color * bitmap.tintColor;
}

// blend with background color
vec4 apply_opacity(vec3 color, float alpha) {
  if (bitmap.transparentColor.a == 0.0) {
    return vec4(color, alpha);
  }
  float blendedAlpha = alpha + bitmap.transparentColor.a * (1.0 - alpha);
  float highLightRatio = alpha / blendedAlpha;
  vec3 blendedRGB = mix(bitmap.transparentColor.rgb, color, highLightRatio);
  return vec4(blendedRGB, blendedAlpha);
}

vec2 getUV(vec2 pos) {
  return vec2(
    (pos.x - bitmap.bounds[0]) / (bitmap.bounds[2] - bitmap.bounds[0]),
    (pos.y - bitmap.bounds[3]) / (bitmap.bounds[1] - bitmap.bounds[3])
  );
}

${m}

void main(void) {
  vec2 uv = vTexCoord;
  if (bitmap.coordinateConversion < -0.5) {
    vec2 lnglat = mercator_to_lnglat(vTexPos);
    uv = getUV(lnglat);
  } else if (bitmap.coordinateConversion > 0.5) {
    vec2 commonPos = lnglat_to_mercator(vTexPos);
    uv = getUV(commonPos);
  }
  vec4 bitmapColor = texture(bitmapTexture, uv);

  fragColor = apply_opacity(color_tint(color_desaturate(bitmapColor.rgb)), bitmapColor.a * layer.opacity);

  geometry.uv = uv;
  DECKGL_FILTER_COLOR(fragColor, geometry);

  if (bool(picking.isActive) && !bool(picking.isAttribute)) {
    // Since instance information is not used, we can use picking color for pixel index
    fragColor.rgb = packUVsIntoRGB(uv);
  }
}
`;class x extends r.A{getShaders(){return super.getShaders({vs:g,fs:y,source:f,modules:[o.A,n.A,s.Ay,p]})}initializeState(){this.getAttributeManager().add({indices:{size:1,isIndexed:!0,update:e=>e.value=this.state.mesh.indices,noAlloc:!0},positions:{size:3,type:"float64",fp64:this.use64bitPositions(),update:e=>e.value=this.state.mesh.positions,noAlloc:!0},texCoords:{size:2,update:e=>e.value=this.state.mesh.texCoords,noAlloc:!0}})}updateState({props:e,oldProps:t,changeFlags:i}){let r=this.getAttributeManager();if(i.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),r.invalidateAll()),e.bounds!==t.bounds){let e=this.state.mesh,t=this._createMesh();for(let i in this.state.model.setVertexCount(t.vertexCount),t)e&&e[i]!==t[i]&&r.invalidate(i);this.setState({mesh:t,...this._getCoordinateUniforms()})}else e._imageCoordinateSystem!==t._imageCoordinateSystem&&this.setState(this._getCoordinateUniforms())}getPickingInfo(e){let{image:t}=this.props,i=e.info;if(!i.color||!t)return i.bitmap=null,i;let{width:r,height:o}=t;i.index=0;let n=function(e){let[t,i,r]=e;return[(t+(15&r)/16)/256,(i+(240&r)/256)/256]}(i.color);return i.bitmap={size:{width:r,height:o},uv:n,pixel:[Math.floor(n[0]*r),Math.floor(n[1]*o)]},i}disablePickingIndex(){this.setState({disablePicking:!0})}restorePickingColors(){this.setState({disablePicking:!1})}_updateAutoHighlight(e){super._updateAutoHighlight({...e,color:this.encodePickingColor(0)})}_createMesh(){let{bounds:e}=this.props,t=e;return b(e)&&(t=[[e[0],e[1]],[e[0],e[3]],[e[2],e[3]],[e[2],e[1]]]),function(e,t){if(!t){var i,r,o,n=e;let t=new Float64Array(12);for(let e=0;e<n.length;e++)t[3*e+0]=n[e][0],t[3*e+1]=n[e][1],t[3*e+2]=n[e][2]||0;return{vertexCount:6,positions:t,indices:c,texCoords:h}}let s=Math.max(Math.abs(e[0][0]-e[3][0]),Math.abs(e[1][0]-e[2][0])),a=Math.max(Math.abs(e[1][1]-e[0][1]),Math.abs(e[2][1]-e[3][1])),l=Math.ceil(s/t)+1,d=Math.ceil(a/t)+1,p=(l-1)*(d-1)*6,f=new Uint32Array(p),g=new Float32Array(l*d*2),m=new Float64Array(l*d*3),y=0,x=0;for(let t=0;t<l;t++){let n=t/(l-1);for(let s=0;s<d;s++){let a=s/(d-1),l=(i=e,r=n,o=a,(0,u.lerp)((0,u.lerp)(i[0],i[1],o),(0,u.lerp)(i[3],i[2],o),r));m[3*y+0]=l[0],m[3*y+1]=l[1],m[3*y+2]=l[2]||0,g[2*y+0]=n,g[2*y+1]=1-a,t>0&&s>0&&(f[x++]=y-d,f[x++]=y-d-1,f[x++]=y-1,f[x++]=y-d,f[x++]=y-1,f[x++]=y),y++}}return{vertexCount:p,positions:m,indices:f,texCoords:g}}(t,this.context.viewport.resolution)}_getModel(){let e="webgpu"===this.context.device.type?this.getAttributeManager().getBufferLayouts({isInstanced:!1}).filter(e=>"indices"!==e.name):this.getAttributeManager().getBufferLayouts();return new a.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:e,topology:"triangle-list",isInstanced:!1})}draw(e){let{shaderModuleProps:t}=e,{model:i,coordinateConversion:r,bounds:o,disablePicking:n}=this.state,{image:s,desaturate:a,transparentColor:l,tintColor:u}=this.props;if((!t.picking.isActive||!n)&&s&&i){let e={bitmapTexture:s,bounds:o,coordinateConversion:r,desaturate:a,tintColor:u.slice(0,3).map(e=>e/255),transparentColor:l.map(e=>e/255)};i.shaderInputs.setProps({bitmap:e}),i.draw(this.context.renderPass)}}_getCoordinateUniforms(){let{_imageCoordinateSystem:e}=this.props;if("default"!==e){let{bounds:t}=this.props;if(!b(t))throw Error("_imageCoordinateSystem only supports rectangular bounds");let i=this.context.viewport.resolution?"lnglat":"cartesian";if("lnglat"==(e="lnglat"===e?"lnglat":"cartesian")&&"cartesian"===i)return{coordinateConversion:-1,bounds:t};if("cartesian"===e&&"lnglat"===i){let e=(0,l.Gw)([t[0],t[1]]),i=(0,l.Gw)([t[2],t[3]]);return{coordinateConversion:1,bounds:[e[0],e[1],i[0],i[1]]}}}return{coordinateConversion:0,bounds:[0,0,0,0]}}}x.layerName="BitmapLayer",x.defaultProps={image:{type:"image",value:null,async:!0},bounds:{type:"array",value:[1,0,0,1],compare:!0},_imageCoordinateSystem:"default",desaturate:{type:"number",min:0,max:1,value:0},transparentColor:{type:"color",value:[0,0,0,0]},tintColor:{type:"color",value:[255,255,255]},textureParameters:{type:"object",ignore:!0,value:null}};let v=x;function b(e){return Number.isFinite(e[0])}},52557(e,t,i){i.d(t,{A:()=>y});var r=i(41881),o=i(84175),n=i(46487),s=i(95335),a=i(9350),l=i(30638),u=i(25337);let c=`\
layout(std140) uniform lineUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float useShortestPath;
  highp int widthUnits;
} line;
`,h={name:"line",source:"",vs:c,fs:c,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",useShortestPath:"f32",widthUnits:"i32"}},d=`\
// ---------- Helper Structures & Functions ----------

// Placeholder filter functions.
fn deckgl_filter_size(offset: vec3<f32>, geometry: Geometry) -> vec3<f32> {
  return offset;
}
fn deckgl_filter_gl_position(p: vec4<f32>, geometry: Geometry) -> vec4<f32> {
  if (picking.isAttribute > 0.5) {
    // For depth picking, write normalized depth into the picking payload.
    // This mirrors the legacy DECKGL_FILTER_GL_POSITION hook on WebGL.
  }
  return p;
}

// Compute an extrusion offset given a line direction (in clipspace),
// an offset direction (-1 or 1), and a width in pixels.
// Assumes a uniform "project" with a viewportSize field is available.
fn getExtrusionOffset(line_clipspace: vec2<f32>, offset_direction: f32, width: f32) -> vec2<f32> {
  // project.viewportSize should be provided as a uniform (not shown here)
  let dir_screenspace = normalize(line_clipspace * project.viewportSize);
  // Rotate by 90\xb0: (x,y) becomes (-y,x)
  let rotated = vec2<f32>(-dir_screenspace.y, dir_screenspace.x);
  return rotated * offset_direction * width / 2.0;
}

// Splits the line between two points at a given x coordinate.
// Interpolates the y and z components.
fn splitLine(a: vec3<f32>, b: vec3<f32>, x: f32) -> vec3<f32> {
  let t: f32 = (x - a.x) / (b.x - a.x);
  return vec3<f32>(x, a.yz + t * (b.yz - a.yz));
}

// ---------- Uniforms & Global Structures ----------

struct LineUniforms {
  widthScale: f32,
  widthMinPixels: f32,
  widthMaxPixels: f32,
  useShortestPath: f32,
  widthUnits: i32,
};

@group(0) @binding(0)
var<uniform> line: LineUniforms;



// ---------- Vertex Output Structure ----------

struct Varyings {
  @builtin(position) gl_Position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) pickingColor: vec3<f32>,
};

// ---------- Vertex Shader Entry Point ----------

@vertex
fn vertexMain(
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec3<f32>,
  @location(1) instanceSourcePositions: vec3<f32>,
  @location(2) instanceTargetPositions: vec3<f32>,
  @location(3) instanceSourcePositions64Low: vec3<f32>,
  @location(4) instanceTargetPositions64Low: vec3<f32>,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instanceWidths: f32
) -> Varyings {
  geometry.worldPosition = instanceSourcePositions;
  geometry.worldPositionAlt = instanceTargetPositions;

  var source_world: vec3<f32> = instanceSourcePositions;
  var target_world: vec3<f32> = instanceTargetPositions;
  var source_world_64low: vec3<f32> = instanceSourcePositions64Low;
  var target_world_64low: vec3<f32> = instanceTargetPositions64Low;

  // Apply shortest-path adjustments if needed.
  if (line.useShortestPath > 0.5 || line.useShortestPath < -0.5) {
    source_world.x = (source_world.x + 180.0 % 360.0) - 180.0;
    target_world.x = (target_world.x + 180.0 % 360.0) - 180.0;
    let deltaLng: f32 = target_world.x - source_world.x;

    if (deltaLng * line.useShortestPath > 180.0) {
      source_world.x = source_world.x + 360.0 * line.useShortestPath;
      source_world = splitLine(source_world, target_world, 180.0 * line.useShortestPath);
      source_world_64low = vec3<f32>(0.0, 0.0, 0.0);
    } else if (deltaLng * line.useShortestPath < -180.0) {
      target_world.x = target_world.x + 360.0 * line.useShortestPath;
      target_world = splitLine(source_world, target_world, 180.0 * line.useShortestPath);
      target_world_64low = vec3<f32>(0.0, 0.0, 0.0);
    } else if (line.useShortestPath < 0.0) {
      var abortOut: Varyings;
      abortOut.gl_Position = vec4<f32>(0.0);
      abortOut.vColor = vec4<f32>(0.0);
      abortOut.uv = vec2<f32>(0.0);
      return abortOut;
    }
  }

  // Project Pos and target positions to clip space.
  let sourceResult = project_position_to_clipspace_and_commonspace(source_world, source_world_64low, vec3<f32>(0.0));
  let targetResult = project_position_to_clipspace_and_commonspace(target_world, target_world_64low, vec3<f32>(0.0));
  let sourcePos: vec4<f32> = sourceResult.clipPosition;
  let targetPos: vec4<f32> = targetResult.clipPosition;
  let source_commonspace: vec4<f32> = sourceResult.commonPosition;
  let target_commonspace: vec4<f32> = targetResult.commonPosition;

  // Interpolate along the line segment.
  let segmentIndex: f32 = positions.x;
  let p: vec4<f32> = sourcePos + segmentIndex * (targetPos - sourcePos);
  geometry.position = source_commonspace + segmentIndex * (target_commonspace - source_commonspace);
#ifdef ANTIALIASING
  var uv: vec2<f32> = positions.xy;
#else
  let uv: vec2<f32> = positions.xy;
#endif
  geometry.uv = uv;
  geometry.pickingColor = picking_getPickingColorFromIndex(instanceIndex);

  // Determine width in pixels.
  let widthPixels: f32 = clamp(
    project_unit_size_to_pixel(instanceWidths * line.widthScale, line.widthUnits),
    line.widthMinPixels, line.widthMaxPixels
  );

  // Compute extrusion offset.
  let extrusion: vec2<f32> = getExtrusionOffset(targetPos.xy - sourcePos.xy, positions.y, widthPixels);
  let offset: vec3<f32> = vec3<f32>(extrusion, 0.0);

  // Apply deck.gl filter functions.
#ifdef ANTIALIASING
  var filteredOffset = deckgl_filter_size(offset, geometry);
  let halfWidthPixels = length(filteredOffset.xy);
  if (halfWidthPixels > 0.0) {
    // Keep the declared edge at abs(uv.y) == 1 while rasterizing the outer half of the centered
    // one-device-pixel coverage ramp.
    let coverageScale = 1.0 + 0.5 / project.devicePixelRatio / halfWidthPixels;
    filteredOffset *= coverageScale;
    uv.y *= coverageScale;
  }
  geometry.uv = uv;
#else
  let filteredOffset = deckgl_filter_size(offset, geometry);
#endif
  let filteredP = deckgl_filter_gl_position(p, geometry);

  let clipOffset: vec2<f32> = project_pixel_size_to_clipspace(filteredOffset.xy);
  let finalPosition: vec4<f32> = filteredP + vec4<f32>(clipOffset, 0.0, 0.0);

  // Compute color.
  var vColor: vec4<f32> = vec4<f32>(instanceColors.rgb, instanceColors.a * layer.opacity);
  // vColor = deckgl_filter_color(vColor, geometry);

  var output: Varyings;
  output.gl_Position = finalPosition;
  output.vColor = vColor;
  output.uv = uv;
  output.pickingColor = geometry.pickingColor;
  return output;
}

@fragment
fn fragmentMain(
  @location(0) vColor: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) pickingColor: vec3<f32>
) -> @location(0) vec4<f32> {
  // Create and initialize geometry with the provided uv.
  var geometry: Geometry;
  geometry.uv = uv;

  // Start with the input color.
  var fragColor: vec4<f32> = vColor;

#ifdef ANTIALIASING
  // Distance to the edge in device pixels, from the derivative of uv.y. Taken in uniform control
  // flow, ahead of the picking discard below
  let edgeCoord = abs(uv.y);
  let edgePixels = (1.0 - edgeCoord) / max(fwidth(edgeCoord), 1e-6);

  // Fragments outside the coverage ramp must not write depth or picking colors.
  if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
    discard;
  }

  // Feather one device pixel across the width, before premultiplication below. The ends are left
  // hard - they abut neighbors
  fragColor.a *= smoothedge(0.0, edgePixels);
#endif

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(pickingColor)) {
      discard;
    }
    return vec4<f32>(pickingColor, 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(pickingColor - highlightedObjectColor))) {
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
`,p=`\
#version 300 es
#define SHADER_NAME line-layer-vertex-shader
in vec3 positions;
in vec3 instanceSourcePositions;
in vec3 instanceTargetPositions;
in vec3 instanceSourcePositions64Low;
in vec3 instanceTargetPositions64Low;
in vec4 instanceColors;
in float instanceWidths;
out vec4 vColor;
out vec2 uv;
vec2 getExtrusionOffset(vec2 line_clipspace, float offset_direction, float width) {
vec2 dir_screenspace = normalize(line_clipspace * project.viewportSize);
dir_screenspace = vec2(-dir_screenspace.y, dir_screenspace.x);
return dir_screenspace * offset_direction * width / 2.0;
}
vec3 splitLine(vec3 a, vec3 b, float x) {
float t = (x - a.x) / (b.x - a.x);
return vec3(x, mix(a.yz, b.yz, t));
}
void main(void) {
geometry.worldPosition = instanceSourcePositions;
geometry.worldPositionAlt = instanceTargetPositions;
vec3 source_world = instanceSourcePositions;
vec3 target_world = instanceTargetPositions;
vec3 source_world_64low = instanceSourcePositions64Low;
vec3 target_world_64low = instanceTargetPositions64Low;
if (line.useShortestPath > 0.5 || line.useShortestPath < -0.5) {
source_world.x = mod(source_world.x + 180., 360.0) - 180.;
target_world.x = mod(target_world.x + 180., 360.0) - 180.;
float deltaLng = target_world.x - source_world.x;
if (deltaLng * line.useShortestPath > 180.) {
source_world.x += 360. * line.useShortestPath;
source_world = splitLine(source_world, target_world, 180. * line.useShortestPath);
source_world_64low = vec3(0.0);
} else if (deltaLng * line.useShortestPath < -180.) {
target_world.x += 360. * line.useShortestPath;
target_world = splitLine(source_world, target_world, 180. * line.useShortestPath);
target_world_64low = vec3(0.0);
} else if (line.useShortestPath < 0.) {
gl_Position = vec4(0.);
return;
}
}
vec4 source_commonspace;
vec4 target_commonspace;
vec4 source = project_position_to_clipspace(source_world, source_world_64low, vec3(0.), source_commonspace);
vec4 target = project_position_to_clipspace(target_world, target_world_64low, vec3(0.), target_commonspace);
float segmentIndex = positions.x;
vec4 p = mix(source, target, segmentIndex);
geometry.position = mix(source_commonspace, target_commonspace, segmentIndex);
uv = positions.xy;
geometry.uv = uv;
geometry.pickingColor = picking_getPickingColorFromInstanceID();
float widthPixels = clamp(
project_size_to_pixel(instanceWidths * line.widthScale, line.widthUnits),
line.widthMinPixels, line.widthMaxPixels
);
vec3 offset = vec3(
getExtrusionOffset(target.xy - source.xy, positions.y, widthPixels),
0.0);
DECKGL_FILTER_SIZE(offset, geometry);
#ifdef ANTIALIASING
float halfWidthPixels = length(offset.xy);
if (halfWidthPixels > 0.0) {
float coverageScale = 1.0 + 0.5 / project.devicePixelRatio / halfWidthPixels;
offset.xy *= coverageScale;
uv.y *= coverageScale;
}
geometry.uv = uv;
#endif
DECKGL_FILTER_GL_POSITION(p, geometry);
gl_Position = p + vec4(project_pixel_size_to_clipspace(offset.xy), 0.0, 0.0);
vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,f=`\
#version 300 es
#define SHADER_NAME line-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
fragColor = vColor;
#ifdef ANTIALIASING
float edgeCoord = abs(uv.y);
float edgePixels = (1.0 - edgeCoord) / max(fwidth(edgeCoord), 1e-6);
if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
discard;
}
fragColor.a *= smoothedge(0.0, edgePixels);
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,g={getSourcePosition:{type:"accessor",value:e=>e.sourcePosition},getTargetPosition:{type:"accessor",value:e=>e.targetPosition},getColor:{type:"accessor",value:[0,0,0,255]},getWidth:{type:"accessor",value:1},widthUnits:"pixels",widthScale:{type:"number",value:1,min:0},widthMinPixels:{type:"number",value:0,min:0},widthMaxPixels:{type:"number",value:Number.MAX_SAFE_INTEGER,min:0},antialiasing:!1};class m extends r.A{getBounds(){return this.getAttributeManager()?.getBounds(["instanceSourcePositions","instanceTargetPositions"])}getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:p,fs:f,source:d,defines:e?{ANTIALIASING:1}:{},modules:[o.A,n.A,s.Ay,h]})}get wrapLongitude(){return!1}initializeState(){this.getAttributeManager().addInstanced({instanceSourcePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getSourcePosition"},instanceTargetPositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getTargetPosition"},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:[0,0,0,255]},instanceWidths:{size:1,transition:!0,accessor:"getWidth",defaultValue:1}})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:r}=e;(r.extensionsChanged||t.antialiasing!==i.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{widthUnits:t,widthScale:i,widthMinPixels:r,widthMaxPixels:o,wrapLongitude:n}=this.props,s=this.state.model,l={widthUnits:a.p5[t],widthScale:i,widthMinPixels:r,widthMaxPixels:o,useShortestPath:+!!n};s.shaderInputs.setProps({line:l}),s.draw(this.context.renderPass),n&&(s.shaderInputs.setProps({line:{...l,useShortestPath:-1}}),s.draw(this.context.renderPass))}_getModel(){return new l.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new u.V({topology:"triangle-strip",attributes:{positions:{size:3,value:new Float32Array([0,-1,0,0,1,0,1,-1,0,1,1,0])}}}),isInstanced:!0})}}m.layerName="LineLayer",m.defaultProps=g;let y=m},89054(e,t,i){i.d(t,{Z:()=>b});var r=i(87597),o=i(82557);let n=new o.d,s=new o.d,a=new o.d,l=new o.d,u=new o.d,c=[1,0,0],h=[2,2,1];var d=i(49828);let p=new r.P,f=new r.P,g=new r.P,m=new r.P,y=new r.P,x=new o.d,v={diagonal:new o.d,unitary:new o.d};function b(e,t=new d.C){if(!e||0===e.length)return t.halfAxes=new o.d([0,0,0,0,0,0,0,0,0]),t.center=new r.P,t;let i=e.length,_=new r.P(0,0,0);for(let t of e)_.add(t);let w=1/i;_.multiplyByScalar(w);let P=0,M=0,C=0,S=0,A=0,I=0;for(let t of e){let e=p.copy(t).subtract(_);P+=e.x*e.x,M+=e.x*e.y,C+=e.x*e.z,S+=e.y*e.y,A+=e.y*e.z,I+=e.z*e.z}P*=w,M*=w,C*=w,S*=w,A*=w,I*=w,x[0]=P,x[1]=M,x[2]=C,x[3]=M,x[4]=S,x[5]=A,x[6]=C,x[7]=A,x[8]=I;let{unitary:T}=function(e,t={}){let i=0,r=0;s.identity(),a.copy(e);let d=1e-20*function(e){let t=0;for(let i=0;i<9;++i){let r=e[i];t+=r*r}return Math.sqrt(t)}(a);for(;r<10&&function(e){let t=0;for(let i=0;i<3;++i){let r=e[n.getElementIndex(h[i],c[i])];t+=2*r*r}return Math.sqrt(t)}(a)>d;)(function(e,t){let i=0,r=1;for(let t=0;t<3;++t){let o=Math.abs(e[n.getElementIndex(h[t],c[t])]);o>i&&(r=t,i=o)}let s=c[r],a=h[r],l=1,u=0;if(Math.abs(e[n.getElementIndex(a,s)])>1e-15){let t,i=(e[n.getElementIndex(a,a)]-e[n.getElementIndex(s,s)])/2/e[n.getElementIndex(a,s)];l=1/Math.sqrt(1+(t=i<0?-1/(-i+Math.sqrt(1+i*i)):1/(i+Math.sqrt(1+i*i)))*t),u=t*l}o.d.IDENTITY.to(t),t[n.getElementIndex(s,s)]=t[n.getElementIndex(a,a)]=l,t[n.getElementIndex(a,s)]=u,t[n.getElementIndex(s,a)]=-u})(a,l),u.copy(l).transpose(),a.multiplyRight(l),a.multiplyLeft(u),s.multiplyRight(l),++i>2&&(++r,i=0);return t.unitary=s.toTarget(t.unitary),t.diagonal=a.toTarget(t.diagonal),t}(x,v),L=t.halfAxes.copy(T),z=L.getColumn(0,g),V=L.getColumn(1,m),R=L.getColumn(2,y),E=-Number.MAX_VALUE,F=-Number.MAX_VALUE,N=-Number.MAX_VALUE,k=Number.MAX_VALUE,q=Number.MAX_VALUE,O=Number.MAX_VALUE;for(let t of e)p.copy(t),E=Math.max(p.dot(z),E),F=Math.max(p.dot(V),F),N=Math.max(p.dot(R),N),k=Math.min(p.dot(z),k),q=Math.min(p.dot(V),q),O=Math.min(p.dot(R),O);z=z.multiplyByScalar(.5*(k+E)),V=V.multiplyByScalar(.5*(q+F)),R=R.multiplyByScalar(.5*(O+N)),t.center.copy(z).add(V).add(R);let j=f.set(E-k,F-q,N-O).multiplyByScalar(.5),U=new o.d([j[0],0,0,0,j[1],0,0,0,j[2]]);return t.halfAxes.multiplyRight(U),t}},68292(e,t,i){i.d(t,{d:()=>s});var r=i(87597);let o=new r.P,n=new r.P;class s{constructor(e=[0,0,0],t=[0,0,0],i){i=i||o.copy(e).add(t).scale(.5),this.center=new r.P(i),this.halfDiagonal=new r.P(t).subtract(this.center),this.minimum=new r.P(e),this.maximum=new r.P(t)}clone(){return new s(this.minimum,this.maximum,this.center)}equals(e){return this===e||!!e&&this.minimum.equals(e.minimum)&&this.maximum.equals(e.maximum)}transform(e){return this.center.transformAsPoint(e),this.halfDiagonal.transform(e),this.minimum.transform(e),this.maximum.transform(e),this}intersectPlane(e){let{halfDiagonal:t}=this,i=n.from(e.normal),r=t.x*Math.abs(i.x)+t.y*Math.abs(i.y)+t.z*Math.abs(i.z),o=this.center.dot(i)+e.distance;return o-r>0?"inside":o+r<0?"outside":"intersecting"}distanceTo(e){return Math.sqrt(this.distanceSquaredTo(e))}distanceSquaredTo(e){let t,i=o.from(e).subtract(this.center),{halfDiagonal:r}=this,n=0;return(t=Math.abs(i.x)-r.x)>0&&(n+=t*t),(t=Math.abs(i.y)-r.y)>0&&(n+=t*t),(t=Math.abs(i.z)-r.z)>0&&(n+=t*t),n}}}}]);