"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["43068"],{50126(e,t,i){i.d(t,{R:()=>w,b:()=>O,r:()=>T});var r=i(1110),n=i(33045),s=i(56289),a=i(77281),o=i(2119),l=i(66579),d=i(23233),c=i(89002),h=i(77046),u=i(71788),p=i(74767),f=i(45393),m=i(1411),v=i(17983),g=i(35449),_=i(72196),S=i(82088),b=i(75565),y=i(19274),x=i(96028),z=i(85580);let T=1;function O(e){let t=new x.N5,{attributes:i,varyings:O,vertex:w,fragment:A}=t,{applyMarkerOffset:P,draped:R,output:C,capType:D,stippleEnabled:E,falloffEnabled:L,roundJoins:W,wireframe:j,innerColorEnabled:M,hasAnimation:F,hasScreenSizePerspective:V}=e;A.include(l.p),t.include(s.s,e),t.include(a.q,e),t.include(n.g,e),t.include(d.Z,e),t.include(b.Q,e);let H=P&&!R;H&&(w.uniforms.add(new g.m("markerScale",e=>e.markerScale)),t.include(o.r,{space:2,hasScreenSizePerspective:V})),(0,u.NB)(w,e),w.uniforms.add(new S.F("inverseProjectionMatrix",e=>e.camera.inverseProjectionMatrix),new p.E("nearFar",e=>e.camera.nearFar),new g.m("miterLimit",e=>"miter"!==e.join?0:e.miterLimit),new f.I("viewport",e=>e.camera.fullViewport)),w.constants.add("LARGE_HALF_FLOAT","float",65500),i.add("position","vec3"),i.add("previousDelta","vec4"),i.add("nextDelta","vec4"),i.add("lineParameters","vec2"),i.add("u0","float"),O.add("vColor","vec4"),O.add("vpos","vec3",{invariant:!0}),O.add("vLineDistance","float"),O.add("vLineWidth","float"),E&&O.add("vLineSizeInv","float");let I=2===D,N=E&&I,k=L||N;return k&&O.add("vLineDistanceNorm","float"),I&&(O.add("vSegmentSDF","float"),O.add("vReverseSegmentSDF","float")),w.code.add((0,_.H)`vec2 perpendicular(vec2 v) {
return vec2(v.y, -v.x);
}
float interp(float ncp, vec4 a, vec4 b) {
return (-ncp - a.z) / (b.z - a.z);
}
vec2 rotate(vec2 v, float a) {
float s = sin(a);
float c = cos(a);
mat2 m = mat2(c, -s, s, c);
return m * v;
}`),w.code.add((0,_.H)`vec4 projectAndScale(vec4 pos) {
vec4 posNdc = proj * pos;
posNdc.xy *= viewport.zw / posNdc.w;
return posNdc;
}`),w.code.add((0,_.H)`void clip(
inout vec4 pos,
inout vec4 prev,
inout vec4 next,
bool isStartVertex
) {
float vnp = nearFar[0] * 0.99;
if (pos.z > -nearFar[0]) {
if (!isStartVertex) {
if (prev.z < -nearFar[0]) {
pos = mix(prev, pos, interp(vnp, prev, pos));
next = pos;
} else {
pos = vec4(0.0, 0.0, 0.0, 1.0);
}
} else {
if (next.z < -nearFar[0]) {
pos = mix(pos, next, interp(vnp, pos, next));
prev = pos;
} else {
pos = vec4(0.0, 0.0, 0.0, 1.0);
}
}
} else {
if (prev.z > -nearFar[0]) {
prev = mix(pos, prev, interp(vnp, pos, prev));
}
if (next.z > -nearFar[0]) {
next = mix(next, pos, interp(vnp, next, pos));
}
}
}`),(0,u.Nz)(w),w.constants.add("aaWidth","float",+!E).main.add((0,_.H)`bool isStartVertex = abs(abs(lineParameters.y) - 3.0) == 1.0;
vec3 prevPosition = position + previousDelta.xyz * previousDelta.w;
vec3 nextPosition = position + nextDelta.xyz * nextDelta.w;
float coverage = 1.0;
if (lineParameters.y == 0.0) {
gl_Position = vec4(1e038, 1e038, 1e038, 1.0);
}
else {
vec4 pos  = view * vec4(position, 1.0);
vec4 prev = view * vec4(prevPosition, 1.0);
vec4 next = view * vec4(nextPosition, 1.0);
bool isJoin = abs(lineParameters.y) < 3.0;`),H&&w.main.add((0,_.H)`vec4 other = isStartVertex ? next : prev;
bool markersHidden = areWorldMarkersHidden(pos.xyz, other.xyz);
if (!isJoin && !markersHidden) {
pos.xyz += normalize(other.xyz - pos.xyz) * getWorldMarkerSize(pos.xyz) * 0.5;
}`),t.include(h.F),w.main.add((0,_.H)`
      clip(pos, prev, next, isStartVertex);

      vec3 clippedPos = pos.xyz;
      vec3 clippedCenter = mix(pos.xyz, isStartVertex ? next.xyz : prev.xyz, 0.5);

      forwardViewPosDepth(pos.xyz);

      pos = projectAndScale(pos);
      next = projectAndScale(next);
      prev = projectAndScale(prev);

      vec2 left = (pos.xy - prev.xy);
      vec2 right = (next.xy - pos.xy);

      float leftLen = length(left);
      float rightLen = length(right);

      float lineSize = getSize(${(0,_.If)(V,"clippedPos")});
      ${(0,_.If)(E&&V,"float patternLineSize = getSize(clippedCenter);")}
      ${(0,_.If)(E&&!V,"float patternLineSize = lineSize;")}

      if (lineSize < 1.0) {
        coverage = lineSize; // convert sub-pixel coverage to alpha
        lineSize = 1.0;
      }
      lineSize += aaWidth;

      float lineWidth = lineSize * pixelRatio;
      vLineWidth = noPerspectiveWrite(lineWidth, pos.w);
      ${E?(0,_.H)`vLineSizeInv = noPerspectiveWrite(1.0 / lineSize, pos.w);`:""}
  `),(E||I)&&w.main.add((0,_.H)`
      float isEndVertex = float(!isStartVertex);
      vec2 segmentOrigin = mix(pos.xy, prev.xy, isEndVertex);
      vec2 segment = mix(right, left, isEndVertex);
      ${I?(0,_.H)`vec2 segmentEnd = mix(next.xy, pos.xy, isEndVertex);`:""}
    `),w.main.add((0,_.H)`left = (leftLen > 0.001) ? left/leftLen : vec2(0.0, 0.0);
right = (rightLen > 0.001) ? right/rightLen : vec2(0.0, 0.0);
vec2 capDisplacementDir = vec2(0, 0);
vec2 joinDisplacementDir = vec2(0, 0);
float displacementLen = lineWidth;
if (isJoin) {
bool isOutside = (left.x * right.y - left.y * right.x) * lineParameters.y > 0.0;
joinDisplacementDir = normalize(left + right);
joinDisplacementDir = perpendicular(joinDisplacementDir);
if (leftLen > 0.001 && rightLen > 0.001) {
float nDotSeg = dot(joinDisplacementDir, left);
displacementLen /= length(nDotSeg * left - joinDisplacementDir);
if (!isOutside) {
displacementLen = min(displacementLen, min(leftLen, rightLen)/abs(nDotSeg));
}
}
float subdivisionFactor = lineParameters.x;
if (isOutside && (displacementLen > miterLimit * lineWidth)) {`),W?w.main.add((0,_.H)`
        vec2 startDir = leftLen < 0.001 ? right : left;
        startDir = perpendicular(startDir);

        vec2 endDir = rightLen < 0.001 ? left : right;
        endDir = perpendicular(endDir);

        float factor = ${E?(0,_.H)`min(1.0, subdivisionFactor * ${_.H.float((T+2)/(T+1))})`:(0,_.H)`subdivisionFactor`};

        float rotationAngle = acos(clamp(dot(startDir, endDir), -1.0, 1.0));
        joinDisplacementDir = rotate(startDir, -sign(lineParameters.y) * factor * rotationAngle);
      `):w.main.add((0,_.H)`if (leftLen < 0.001) {
joinDisplacementDir = right;
}
else if (rightLen < 0.001) {
joinDisplacementDir = left;
}
else {
joinDisplacementDir = (isStartVertex || subdivisionFactor > 0.0) ? right : left;
}
joinDisplacementDir = perpendicular(joinDisplacementDir);`),w.main.add((0,_.H)`
        displacementLen = lineWidth;
      }
    } else {
      // CAP handling ---------------------------------------------------
      joinDisplacementDir = isStartVertex ? right : left;
      joinDisplacementDir = perpendicular(joinDisplacementDir);

      ${0!==D?(0,_.H)`capDisplacementDir = isStartVertex ? -right : left;`:""}
    }
  `),w.main.add((0,_.H)`
    // Displacement (in pixels) caused by join/or cap
    vec2 dpos = joinDisplacementDir * sign(lineParameters.y) * displacementLen + capDisplacementDir * displacementLen;
    float lineDistNorm = noPerspectiveWrite(sign(lineParameters.y), pos.w);

    vLineDistance = lineWidth * lineDistNorm;
    ${k?(0,_.H)`vLineDistanceNorm = lineDistNorm;`:""}

    pos.xy += dpos;
  `),I&&w.main.add((0,_.H)`vec2 segmentDir = normalize(segment);
vSegmentSDF = noPerspectiveWrite((isJoin && isStartVertex) ? LARGE_HALF_FLOAT : (dot(pos.xy - segmentOrigin, segmentDir)), pos.w);
vReverseSegmentSDF = noPerspectiveWrite((isJoin && !isStartVertex) ? LARGE_HALF_FLOAT : (dot(pos.xy - segmentEnd, -segmentDir)), pos.w);`),E&&(R?w.uniforms.add(new v.U("worldToScreenRatio",e=>1/e.screenToPCSRatio)):w.main.add((0,_.H)`vec3 segmentCenter = mix((nextPosition + position) * 0.5, (position + prevPosition) * 0.5, isEndVertex);
float worldToScreenRatio = computeWorldToScreenRatio(segmentCenter);`),w.main.add((0,_.H)`float segmentLengthScreenDouble = length(segment);
float segmentLengthScreen = segmentLengthScreenDouble * 0.5;
float discreteWorldToScreenRatio = discretizeWorldToScreenRatio(worldToScreenRatio);
float segmentLengthRender = length(mix(nextPosition - position, position - prevPosition, isEndVertex));
vStipplePatternStretch = worldToScreenRatio / discreteWorldToScreenRatio;`),R?w.main.add((0,_.H)`float segmentLengthPseudoScreen = segmentLengthScreen / pixelRatio * discreteWorldToScreenRatio / worldToScreenRatio;
float startPseudoScreen = u0 * discreteWorldToScreenRatio - mix(0.0, segmentLengthPseudoScreen, isEndVertex);`):w.main.add((0,_.H)`float startPseudoScreen = mix(u0, u0 - segmentLengthRender, isEndVertex) * discreteWorldToScreenRatio;
float segmentLengthPseudoScreen = segmentLengthRender * discreteWorldToScreenRatio;`),w.uniforms.add(new g.m("stipplePatternPixelSize",e=>(0,a.h)(e))),w.main.add((0,_.H)`float patternLength = patternLineSize * stipplePatternPixelSize;
vStippleDistanceLimits = computeStippleDistanceLimits(startPseudoScreen, segmentLengthPseudoScreen, segmentLengthScreen, patternLength);
vStippleDistance = mix(vStippleDistanceLimits.x, vStippleDistanceLimits.y, isEndVertex);
if (segmentLengthScreenDouble >= 0.001) {
vec2 stippleDisplacement = pos.xy - segmentOrigin;
float stippleDisplacementFactor = dot(segment, stippleDisplacement) / (segmentLengthScreenDouble * segmentLengthScreenDouble);
vStippleDistance += (stippleDisplacementFactor - isEndVertex) * (vStippleDistanceLimits.y - vStippleDistanceLimits.x);
}
vStippleDistanceLimits = noPerspectiveWrite(vStippleDistanceLimits, pos.w);
vStippleDistance = noPerspectiveWrite(vStippleDistance, pos.w);
vStippleDistanceLimits = isJoin ?
vStippleDistanceLimits :
isStartVertex ?
vec2(-1e34, vStippleDistanceLimits.y) :
vec2(vStippleDistanceLimits.x, 1e34);`)),w.main.add((0,_.H)`
      // Convert back into NDC
      pos.xy = (pos.xy / viewport.zw) * pos.w;

      vColor = getColor();
      vColor.a = noPerspectiveWrite(vColor.a * coverage, pos.w);

      ${j&&!R?"pos.z -= 0.001 * pos.w;":""}

      // transform final position to camera space for slicing
      vpos = (inverseProjectionMatrix * pos).xyz;
      gl_Position = pos;
      forwardObjectAndLayerIdColor();
    }`),t.fragment.include(r.HQ,e),t.include(y.z,e),A.include(c.a),A.main.add((0,_.H)`discardBySlice(vpos);
discardByTerrainDepth();`),t.include(h.m),A.main.add((0,_.H)`
    float lineWidth = noPerspectiveRead(vLineWidth);
    float lineDistance = noPerspectiveRead(vLineDistance);
    ${(0,_.If)(k,(0,_.H)`float lineDistanceNorm = noPerspectiveRead(vLineDistanceNorm);`)}
  `),j?A.main.add((0,_.H)`vec4 finalColor = vec4(1.0, 0.0, 1.0, 1.0);`):(I&&A.main.add((0,_.H)`
        float sdf = noPerspectiveRead(min(vSegmentSDF, vReverseSegmentSDF));
        vec2 fragmentPosition = vec2(min(sdf, 0.0), lineDistance);

        float fragmentRadius = length(fragmentPosition);
        float fragmentCapSDF = (fragmentRadius - lineWidth) * 0.5; // Divide by 2 to transform from double pixel scale
        float capCoverage = clamp(0.5 - fragmentCapSDF, 0.0, 1.0);

        if (capCoverage < ${_.H.float(z.Q)}) {
          discard;
        }
      `),N?A.main.add((0,_.H)`
      vec2 stipplePosition = vec2(
        min(getStippleSDF() * 2.0 - 1.0, 0.0),
        lineDistanceNorm
      );
      float stippleRadius = length(stipplePosition * lineWidth);
      float stippleCapSDF = (stippleRadius - lineWidth) * 0.5; // Divide by 2 to transform from double pixel scale
      float stippleCoverage = clamp(0.5 - stippleCapSDF, 0.0, 1.0);
      float stippleAlpha = step(${_.H.float(z.Q)}, stippleCoverage);
      `):A.main.add((0,_.H)`float stippleAlpha = getStippleAlpha(lineWidth);`),10!==C&&A.main.add((0,_.H)`discardByStippleAlpha(stippleAlpha, ${_.H.float(z.Q)});`),t.include(h.m),A.uniforms.add(new m.E("intrinsicColor",e=>e.color)).main.add((0,_.H)`vec4 color = intrinsicColor * vColor;
color.a = noPerspectiveRead(color.a);`),M&&A.uniforms.add(new m.E("innerColor",e=>e.innerColor??e.color),new g.m("innerWidth",(e,t)=>e.innerWidth*t.camera.pixelRatio)).main.add((0,_.H)`float distToInner = abs(lineDistance) - innerWidth;
float innerAA = clamp(0.5 - distToInner, 0.0, 1.0);
float innerAlpha = innerColor.a + color.a * (1.0 - innerColor.a);
color = mix(color, vec4(innerColor.rgb, innerAlpha), innerAA);`),A.main.add((0,_.H)`vec4 finalColor = blendStipple(color, stippleAlpha);`),L&&(A.uniforms.add(new g.m("falloff",e=>e.falloff)),A.main.add((0,_.H)`finalColor.a *= pow(max(0.0, 1.0 - abs(lineDistanceNorm)), falloff);`)),E||A.main.add((0,_.H)`float featherStartDistance = max(lineWidth - 2.0, 0.0);
float value = abs(lineDistance);
float feather = (value - featherStartDistance) / (lineWidth - featherStartDistance);
finalColor.a *= 1.0 - clamp(feather, 0.0, 1.0);`),F&&A.main.add((0,_.H)`
        finalColor = animate(finalColor);

        ${(0,_.If)(10!==C,(0,_.H)`
            if (finalColor.a <= ${_.H.float(z.Q)}) {
              discard;
            }`)}
      `)),A.main.add((0,_.H)`outputColorHighlightOID(finalColor, vpos, finalColor.rgb);`),t}let w=Object.freeze(Object.defineProperty({__proto__:null,build:O,ribbonlineNumRoundJoinSubdivisions:1},Symbol.toStringTag,{value:"Module"}))},40210(e,t,i){i.d(t,{F:()=>a,Ti:()=>n});var r=i(39831);let n=-3,s=!!(0,r.A)("esri-tests-disable-gpu-memory-measurements");class a{get size(){return this._size}constructor(e=0xa00000){this._maxSize=e,this._db=new Map,this._size=0,this._hit=0,this._miss=0,this._users=new Map,this._sizeLimits=new Map}destroy(){this.clearAll(),this._sizeLimits.clear(),this._users.clear(),this._db=null}register(e){this._users.set(e.id.slice(0,-1),e)}deregister(e){this.clear(e),this._sizeLimits.delete(e),this._users.delete(e.id.slice(0,-1))}get maxSize(){return this._maxSize}set maxSize(e){this._maxSize=Math.max(e,-1),this._checkSize()}getSize(e,t){let i=this._db.get(e.id+t);return i?.size??0}put(e,t,i,r,a){t=e.id+t;let l=this._db.get(t);if(l&&(this._size-=l.size,e.size-=l.size,this._db.delete(t),l.entry!==i&&this._notifyRemove(t,l.entry,l.size,0)),r>this._maxSize)return void this._notifyRemove(t,i,r,0);if(void 0===i)return void console.warn("Refusing to cache undefined entry ");if(!r||r<0)return s||console.warn(`Refusing to cache entry with size ${r} for key ${t}`),void this._notifyRemove(t,i,0,0);let d=1+Math.max(a,-4)-n;this._db.set(t,new o(i,r,d)),this._size+=r,e.size+=r,this._checkSize()}updateSize(e,t){t=e.id+t;let i=this._db.get(t);if(!i)return;this._size-=i.size,e.size-=i.size;let r=i.entry.usedMemory;for(;r>this._maxSize;){let e=this._notifyRemove(t,i.entry,r,1);if(!(null!=e&&e>0))return void this._db.delete(t);r=e}i.size=r,this._size+=r,e.size+=r,this._checkSize()}pop(e,t){t=e.id+t;let i=this._db.get(t);if(i)return this._size-=i.size,e.size-=i.size,this._db.delete(t),++this._hit,i.entry;++this._miss}get(e,t){t=e.id+t;let i=this._db.get(t);if(void 0!==i)return this._db.delete(t),i.lives=i.lifetime,this._db.set(t,i),++this._hit,i.entry;++this._miss}peek(e,t){let i=this._db.get(e.id+t);return i?++this._hit:++this._miss,i?.entry}get performanceInfo(){let e={Size:Math.round(this._size/1048576)+"/"+Math.round(this._maxSize/1048576)+"MB","Hit rate":Math.round(100*this._getHitRate())+"%",Entries:this._db.size.toString()},t={},i=[];this._db.forEach((e,r)=>{let n=e.lifetime;i[n]=(i[n]||0)+e.size,this._users.forEach(i=>{let{id:n,name:s}=i;if(r.startsWith(n)){let i=t[s]||0;t[s]=i+e.size}})});let r={};this._users.forEach(e=>{let i=e.name;if("hitRate"in e&&"number"==typeof e.hitRate&&!isNaN(e.hitRate)&&e.hitRate>0){let n=t[i]||0;t[i]=n,r[i]=Math.round(100*e.hitRate)+"%"}else r[i]="0%"});let s=Object.keys(t);s.sort((e,i)=>t[i]-t[e]),s.forEach(i=>e[i]=Math.round(t[i]/1048576)+"MB / "+r[i]);for(let t=i.length-1;t>=0;--t){let r=i[t];r&&(e["Priority "+(t+n-1)]=Math.round(r/this._size*100)+"%")}return e}resetStats(){this._hit=this._miss=0,this._users.forEach(e=>e.resetHitRate())}clear(e){let t=e.id;this._db.forEach((e,i)=>{i.startsWith(t)&&(this._size-=e.size,this._db.delete(i),this._notifyRemove(i,e.entry,e.size,0))}),e.size=0}clearAll(){this._db.forEach((e,t)=>this._notifyRemove(t,e.entry,e.size,0)),this._users.forEach(e=>e.size=0),this._size=0,this._db.clear()}*values(e){for(let[t,i]of this._db)t.startsWith(e.id)&&(yield i.entry)}_getHitRate(){return this._hit/(this._hit+this._miss)}_notifyRemove(e,t,i,r){let n=this._users.get(e.split(l)[0])?.removeFunc,s=n?.(t,r,i);return"number"==typeof s?s:null}_checkSize(){this._sizeLimits.forEach((e,t)=>this._checkSizeLimits(e,t)),this._checkSizeLimits(this.maxSize)}setMaxSize(e,t){null==t||t<=0?this._sizeLimits.delete(e):this._sizeLimits.set(e,t)}_checkSizeLimits(e,t){let i=t??this;if(i.size<=e)return;let r=t?.id,n=!0;for(;n;)for(let[s,a]of(n=!1,this._db))if(0===a.lifetime&&(!r||s.startsWith(r))){let r=t??this._users.get(s.split(l)[0]);if(this._purgeItem(s,a,r),i.size<=.9*e)return;n||=this._db.has(s)}for(let[n,s]of this._db)if(!r||n.startsWith(r)){let r=t??this._users.get(n.split(l)[0]);if(this._purgeItem(n,s,r),i.size<=.9*e)return}}_purgeItem(e,t,i){if(this._db.delete(e),t.lives<=1){this._size-=t.size,i&&(i.size-=t.size);let r=this._notifyRemove(e,t.entry,t.size,1);null!=r&&r>0&&(this._size+=r,i&&(i.size+=r),t.lives=t.lifetime,t.size=r,this._db.set(e,t))}else--t.lives,this._db.set(e,t)}}new a(0);class o{constructor(e,t,i){this.entry=e,this.size=t,this.lifetime=i,this.lives=i}}let l=":"},4754(e,t,i){i.d(t,{$B:()=>n,Qf:()=>d,Qh:()=>o,RS:()=>s,ez:()=>h,i5:()=>u,lM:()=>a,qK:()=>c});var r=i(86942);function n(e){return 32+e.length}let s=16;function a(e){if(!e)return 0;let t=c;for(let i in e)e.hasOwnProperty(i)&&(t+=l(e[i],!1));return t}function o(e){if(!e)return 0;if("number"==typeof e[0])return d(e);if(Array.isArray(e)){var t=e;let i=t.length;if(0===i||"number"==typeof t[0])return function(e,t){return h+e.length*t}(t,8);let r=h;for(let e=0;e<i;e++)r+=l(t[e]);return r}let i=c;for(let t in e)e.hasOwnProperty(t)&&(i+=l(e[t]));return i}function l(e,t=!0){switch(typeof e){case"object":return t?o(e):c;case"string":return n(e);case"number":return s;case"boolean":return 4;default:return 8}}function d(...e){return e.reduce((e,t)=>{var i,n;return e+(t?(0,r.iu)(t)?t.byteLength+u:Array.isArray(t)?(i=t,n=s,h+i.length*n):0:0)},0)}let c=32,h=16,u=145},9723(e,t,i){i.d(t,{CI:()=>s,fk:()=>a}),i(39831);var r=i(92504),n=i(87926);function s(e,t){return e===t||null!=e&&null!=t&&(0,n.aI)(e.spatialReference,t.spatialReference)&&e.x===t.x&&e.y===t.y&&e.z===t.z&&e.m===t.m}function a(e,t,i){return e===t||null!=e&&null!=t&&(0,n.aI)(e.spatialReference,t.spatialReference)&&(0,r.Sp)(e.x,t.x,i)&&(0,r.Sp)(e.y,t.y,i)&&(0,r.Sp)(e.z??0,t.z??0,i)&&(0,r.Sp)(e.m??0,t.m??0,i)}},58343(e,t,i){i.d(t,{F:()=>s});var r=i(74665),n=i(9104);class s{constructor(){this._meterUnitOffset=0,this._renderUnitOffset=0,this._unit="meters",this._metersPerElevationInfoUnit=1,this._featureExpressionInfoContext=null,this.mode=null,this.centerInElevationSR=null}get featureExpressionInfoContext(){return this._featureExpressionInfoContext}get meterUnitOffset(){return this._meterUnitOffset}get unit(){return this._unit}set unit(e){this._unit=e,this._metersPerElevationInfoUnit=(0,r.Ao)(e)}get requiresSampledElevationInfo(){return"absolute-height"!==this.mode}reset(){this.mode=null,this._meterUnitOffset=0,this._renderUnitOffset=0,this._featureExpressionInfoContext=null,this.unit="meters"}set offsetMeters(e){this._meterUnitOffset=e,this._renderUnitOffset=0}set offsetElevationInfoUnits(e){this._meterUnitOffset=e*this._metersPerElevationInfoUnit,this._renderUnitOffset=0}addOffsetRenderUnits(e){this._renderUnitOffset+=e}geometryZWithOffset(e,t){let i=this.calculateOffsetRenderUnits(t);return null!=this.featureExpressionInfoContext?i:e+i}calculateOffsetRenderUnits(e){let t=this._meterUnitOffset,i=this.featureExpressionInfoContext;return null!=i&&(t+=(0,n.g7)(i)*this._metersPerElevationInfoUnit),t/e.unitInMeters+this._renderUnitOffset}setFromElevationInfo(e){this.mode=e.mode,this.unit=(0,r.Tg)(e.unit)?e.unit:"meters",this.offsetElevationInfoUnits=e.offset??0}setFeatureExpressionInfoContext(e){this._featureExpressionInfoContext=e}updateFeatureExpressionInfoContextForGraphic(e,t,i){e.arcade?(this._featureExpressionInfoContext=(0,n.o8)(e),this.updateFeatureExpressionFeature(t,i)):this._featureExpressionInfoContext=e}updateFeatureExpressionFeature(e,t){let i=this.featureExpressionInfoContext;i?.arcade&&(i.cachedResult=void 0,(0,n.gf)(this._featureExpressionInfoContext,e.geometry?(0,n.VG)(i.arcade.modules,e,t):null))}static fromElevationInfo(e){let t=new s;return null!=e&&t.setFromElevationInfo(e),t}}},27716(e,t,i){i.d(t,{I2:()=>p,Kf:()=>m,Uk:()=>_,ai:()=>g,au:()=>c,fe:()=>v,nG:()=>u,nu:()=>f,sE:()=>h});var r=i(21742),n=i(86128),s=i(58359),a=i(59538),o=i(84119),l=i(80009),d=i(27054);function c(e,t,i,r,n,s,a,l,d,c,h){let u=S[h.mode],p,f,m=0;if((0,o.projectBuffer)(e,t,i,r,d.spatialReference,n,l))return u?.requiresAlignment(h)?(m=u.applyElevationAlignmentBuffer(r,n,s,a,l,d,c,h),p=s,f=a):(p=r,f=n),(0,o.projectBuffer)(p,d.spatialReference,f,s,c.spatialReference,a,l)?m:void 0}function h(e,t,i,r,n){let s=((0,l.v)(e)?e.z:(0,d.cN)(e)?e.array[e.offset+2]:e[2])||0;switch(i.mode){case"on-the-ground":{let i=(0,d.R1)(t,e,"ground")??0;return n.verticalDistanceToGround=0,n.sampledElevation=i,void(n.z=i)}case"relative-to-ground":{let a=(0,d.R1)(t,e,"ground")??0,o=i.geometryZWithOffset(s,r);return n.verticalDistanceToGround=o,n.sampledElevation=a,void(n.z=o+a)}case"relative-to-scene":{let a=(0,d.R1)(t,e,"scene")??0,o=i.geometryZWithOffset(s,r);return n.verticalDistanceToGround=o,n.sampledElevation=a,void(n.z=o+a)}case"absolute-height":{let a=i.geometryZWithOffset(s,r),o=(0,d.R1)(t,e,"ground")??0;return n.verticalDistanceToGround=a-o,n.sampledElevation=o,void(n.z=a)}default:return void(n.z=0)}}function u(e,t,i,r){return h(e,t,i,r,y),y.z}function p(e,t,i){return"on-the-ground"===t&&"on-the-ground"===i?e.staysOnTheGround:t===i||"on-the-ground"!==t&&"on-the-ground"!==i?null==t||null==i?e.definedChanged:1:e.onTheGroundChanged}function f(e){return"relative-to-ground"===e||"relative-to-scene"===e}function m(e){return"absolute-height"!==e}function v(e,t,i,n,s){h(t,i,s,n,y),g(e,y.verticalDistanceToGround);let o=y.sampledElevation,l=(0,r.C)(b,e.transformation);return x[0]=t.x,x[1]=t.y,x[2]=y.z,(0,a.l)(t.spatialReference,x,l,n.spatialReference)?e.transformation=l:console.warn("Could not locate symbol object properly, it might be misplaced"),o}function g(e,t){for(let i=0;i<e.geometries.length;++i){let r=e.geometries[i].getMutableAttribute("centerOffsetAndDistance");r&&r.data[3]!==t&&(r.data[3]=t,e.geometryVertexAttributeUpdated(e.geometries[i],"centerOffsetAndDistance"))}}class _{constructor(){this.verticalDistanceToGround=0,this.sampledElevation=0,this.z=0}}let S={"absolute-height":{applyElevationAlignmentBuffer:function(e,t,i,r,n,s,a,o){let l=o.calculateOffsetRenderUnits(a),d=o.featureExpressionInfoContext;t*=3,r*=3;for(let s=0;s<n;++s){let n=e[t],s=e[t+1],a=e[t+2];i[r]=n,i[r+1]=s,i[r+2]=null==d?a+l:l,t+=3,r+=3}return 0},requiresAlignment:function(e){let t=e.meterUnitOffset,i=e.featureExpressionInfoContext;return 0!==t||null!=i}},"on-the-ground":{applyElevationAlignmentBuffer:function(e,t,i,r,n,s){let a=0,o=s.spatialReference;t*=3,r*=3;for(let l=0;l<n;++l){let n=e[t],l=e[t+1],d=e[t+2],c=s.getElevation(n,l,d,o,"ground")??0;a+=c,i[r]=n,i[r+1]=l,i[r+2]=c,t+=3,r+=3}return a/n},requiresAlignment:()=>!0},"relative-to-ground":{applyElevationAlignmentBuffer:function(e,t,i,r,n,s,a,o){let l=0,d=o.calculateOffsetRenderUnits(a),c=o.featureExpressionInfoContext,h=s.spatialReference;t*=3,r*=3;for(let a=0;a<n;++a){let n=e[t],a=e[t+1],o=e[t+2],u=s.getElevation(n,a,o,h,"ground")??0;l+=u,i[r]=n,i[r+1]=a,i[r+2]=null==c?o+u+d:u+d,t+=3,r+=3}return l/n},requiresAlignment:()=>!0},"relative-to-scene":{applyElevationAlignmentBuffer:function(e,t,i,r,n,s,a,o){let l=0,d=o.calculateOffsetRenderUnits(a),c=o.featureExpressionInfoContext,h=s.spatialReference;t*=3,r*=3;for(let a=0;a<n;++a){let n=e[t],a=e[t+1],o=e[t+2],u=s.getElevation(n,a,o,h,"scene")??0;l+=u,i[r]=n,i[r+1]=a,i[r+2]=null==c?o+u+d:u+d,t+=3,r+=3}return l/n},requiresAlignment:()=>!0}},b=(0,n.vt)(),y=new _,x=(0,s.vt)()},9104(e,t,i){i.d(t,{KF:()=>p,MF:()=>u,VG:()=>d,g7:()=>h,gf:()=>c,o8:()=>o,q6:()=>l});var r=i(539),n=i(40189),s=i(85174),a=i(35387);function o(e){return{cachedResult:e.cachedResult,arcade:e.arcade?{func:e.arcade.func,context:e.arcade.modules.arcadeUtils.createExecContext(null,{sr:e.arcade.context.spatialReference}),modules:e.arcade.modules}:null}}async function l(e,t,i,r){let s=e?.expression;if("string"!=typeof s)return null;let o="0"===s?0:null;if(null!=o)return{cachedResult:o};let l=await (0,a.l)();(0,n.Te)(i);let d=l.arcadeUtils,c=d.createSyntaxTree(s);return d.dependsOnView(c)?(null!=r&&r.error("Expressions containing '$view' are not supported on ElevationInfo"),{cachedResult:0}):{arcade:{func:d.createFunction(c),context:d.createExecContext(null,{sr:t}),modules:l}}}function d(e,t,i){return e.arcadeUtils.createFeature(t.attributes,t.geometry,i)}function c(e,t){if(null!=e&&!f(e)){if(!t||!e.arcade)return void r.A.getLogger("esri.views.3d.layers.graphics.featureExpressionInfoUtils").errorOncePerTick("Arcade support required but not provided");t._geometry&&(t._geometry=(0,s.wZ)(t._geometry)),e.arcade.modules.arcadeUtils.updateExecContext(e.arcade.context,t)}}function h(e){if(null!=e){if(f(e))return e.cachedResult;let t=e.arcade,i=t?.modules.arcadeUtils.executeFunction(t.func,t.context);return"number"!=typeof i&&(e.cachedResult=0,i=0),i}return 0}function u(e,t=!1){let i=e?.featureExpressionInfo,r=i?.expression;return t||"0"===r||(i=null),i??null}let p={cachedResult:0};function f(e){return null!=e.cachedResult}},27054(e,t,i){i.d(t,{R1:()=>a,aY:()=>n,cN:()=>s});var r=i(80009);class n{constructor(e,t=null,i=0){this.array=e,this.spatialReference=t,this.offset=i}}function s(e){return"array"in e}function a(e,t,i="ground"){if((0,r.v)(t))return e.getElevation(t.x,t.y,t.z||0,t.spatialReference,i);if(s(t)){let r=t.offset;return e.getElevation(t.array[r++],t.array[r++],t.array[r]||0,t.spatialReference??e.spatialReference,i)}return e.getElevation(t[0],t[1],t[2]||0,e.spatialReference,i)}},50980(e,t,i){i.d(t,{Cz:()=>n,DZ:()=>a,PV:()=>s,vO:()=>r}),i(97213),i(41746),i(90571),i(45758);let r=64,n=32,s=10,a=.25},56289(e,t,i){i.d(t,{s:()=>p});var r=i(21742),n=i(86128),s=i(34328),a=i(6916),o=i(71788),l=i(60840),d=i(35449),c=i(45160),h=i(72196),u=i(70695);function p(e,t){let{vertex:i,attributes:n}=e;i.uniforms.add(new d.m("intrinsicWidth",e=>e.width));let{hasScreenSizePerspective:p,spherical:m}=t;p?(e.include(a.Y6,t),(0,a.pM)(i),(0,o.yu)(i,t),i.uniforms.add(new u.S("inverseViewMatrix",(e,t)=>(0,r.B8)(f,(0,r.Tl)(f,t.camera.viewMatrix,e.origin)))),i.code.add((0,h.H)`
      float applyLineSizeScreenSizePerspective(float size, vec3 pos) {
        vec3 worldPos = (inverseViewMatrix * vec4(pos, 1)).xyz;
        vec3 groundUp = ${m?(0,h.H)`normalize(worldPos + localOrigin)`:(0,h.H)`vec3(0.0, 0.0, 1.0)`};
        float absCosAngle = abs(dot(groundUp, normalize(worldPos - cameraPosition)));

        return screenSizePerspectiveScaleFloat(size, absCosAngle, length(pos), screenSizePerspective);
      }
    `)):i.code.add((0,h.H)`float applyLineSizeScreenSizePerspective(float size, vec3 pos) {
return size;
}`),t.hasVVSize?(n.add("sizeFeatureAttribute","float"),i.uniforms.add(new l.t("vvSizeMinSize",e=>e.vvSize.minSize),new l.t("vvSizeMaxSize",e=>e.vvSize.maxSize),new l.t("vvSizeOffset",e=>e.vvSize.offset),new l.t("vvSizeFactor",e=>e.vvSize.factor),new l.t("vvSizeFallback",e=>e.vvSize.fallback)),i.code.add((0,h.H)`
    float getSize(${(0,h.If)(p,"vec3 pos")}) {
      float size = isnan(sizeFeatureAttribute)
        ? vvSizeFallback.x
        : intrinsicWidth * clamp(vvSizeOffset + sizeFeatureAttribute * vvSizeFactor, vvSizeMinSize, vvSizeMaxSize).x;

      return ${(0,h.If)(p,"applyLineSizeScreenSizePerspective(size, pos)","size")};
    }
    `)):(n.add("size","float"),i.code.add((0,h.H)`
    float getSize(${(0,h.If)(p,"vec3 pos")}) {
      float fullSize = intrinsicWidth * size;
      return ${(0,h.If)(p,"applyLineSizeScreenSizePerspective(fullSize, pos)","fullSize")};
    }
    `)),t.hasVVOpacity?(n.add("opacityFeatureAttribute","float"),i.constants.add("vvOpacityNumber","int",8),i.uniforms.add(new c.x("vvOpacityValues",e=>e.vvOpacity.values,8),new c.x("vvOpacityOpacities",e=>e.vvOpacity.opacityValues,8),new d.m("vvOpacityFallback",e=>e.vvOpacity.fallback,{supportsNaN:!0})),i.code.add((0,h.H)`
    float interpolateOpacity(float value) {
      if (value <= vvOpacityValues[0]) {
        return vvOpacityOpacities[0];
      }

      for (int i = 1; i < vvOpacityNumber; ++i) {
        if (vvOpacityValues[i] >= value) {
          float f = (value - vvOpacityValues[i-1]) / (vvOpacityValues[i] - vvOpacityValues[i-1]);
          return mix(vvOpacityOpacities[i-1], vvOpacityOpacities[i], f);
        }
      }

      return vvOpacityOpacities[vvOpacityNumber - 1];
    }

    vec4 applyOpacity(vec4 color) {
      if (isnan(opacityFeatureAttribute)) {
        // If there is a color vv then it will already have taken care of applying the fallback
        return ${(0,h.If)(t.hasVVColor,"color","vec4(color.rgb, vvOpacityFallback)")};
      }

      return vec4(color.rgb, interpolateOpacity(opacityFeatureAttribute));
    }
    `)):i.code.add((0,h.H)`vec4 applyOpacity(vec4 color) {
return color;
}`),t.hasVVColor?(e.include(s.A,t),n.add("colorFeatureAttribute","float"),i.code.add((0,h.H)`vec4 getColor() {
vec4 color = interpolateVVColor(colorFeatureAttribute);
if (isnan(color.r)) {
return vec4(0);
}
return applyOpacity(color);
}`)):(n.add("color","vec4"),i.code.add((0,h.H)`vec4 getColor() {
return applyOpacity(color);
}`))}let f=(0,n.vt)()},77281(e,t,i){i.d(t,{q:()=>p,h:()=>f});var r=i(77046),n=i(71788),s=i(1411),a=i(17983),o=i(35449),l=i(72196),d=i(79856);i(41746),i(90571),i(45758);var c=i(2662),h=i(28152);let u=(0,h.vt)();function p(e,t){if(!t.stippleEnabled)return void e.fragment.code.add((0,l.H)`float getStippleAlpha(float lineWidth) { return 1.0; }
void discardByStippleAlpha(float stippleAlpha, float threshold) {}
vec4 blendStipple(vec4 color, float stippleAlpha) { return color; }`);let i=!(t.draped&&t.stipplePreferContinuous),{vertex:p,fragment:v}=e;t.draped||((0,n.yu)(p,t),p.uniforms.add(new a.U("worldToScreenPerDistanceRatio",({camera:e})=>1/e.perScreenPixelRatio)).code.add((0,l.H)`float computeWorldToScreenRatio(vec3 segmentCenter) {
float segmentDistanceToCamera = length(segmentCenter - cameraPosition);
return worldToScreenPerDistanceRatio / segmentDistanceToCamera;
}`)),e.varyings.add("vStippleDistance","float"),e.varyings.add("vStippleDistanceLimits","vec2"),e.varyings.add("vStipplePatternStretch","float"),p.code.add((0,l.H)`
    float discretizeWorldToScreenRatio(float worldToScreenRatio) {
      float step = ${l.H.float(m)};

      float discreteWorldToScreenRatio = log(worldToScreenRatio);
      discreteWorldToScreenRatio = ceil(discreteWorldToScreenRatio / step) * step;
      discreteWorldToScreenRatio = exp(discreteWorldToScreenRatio);
      return discreteWorldToScreenRatio;
    }
  `),(0,n.Nz)(p),p.code.add((0,l.H)`
    vec2 computeStippleDistanceLimits(float startPseudoScreen, float segmentLengthPseudoScreen, float segmentLengthScreen, float patternLength) {

      // First check if the segment is long enough to support fully screen space patterns.
      // Force sparse mode for segments that are very large in screen space even if it is not allowed,
      // to avoid imprecision from calculating with large floats.
      if (segmentLengthPseudoScreen >= ${i?"patternLength":"1e4"}) {
        // Round the screen length to get an integer number of pattern repetitions (minimum 1).
        float repetitions = segmentLengthScreen / (patternLength * pixelRatio);
        float flooredRepetitions = max(1.0, floor(repetitions + 0.5));
        float segmentLengthScreenRounded = flooredRepetitions * patternLength;

        float stretch = repetitions / flooredRepetitions;

        // We need to impose a lower bound on the stretch factor to prevent the dots from merging together when there is only 1 repetition.
        // 0.75 is the lowest possible stretch value for flooredRepetitions > 1, so it makes sense as lower bound.
        vStipplePatternStretch = max(0.75, stretch);

        return vec2(0.0, segmentLengthScreenRounded);
      }
      return vec2(startPseudoScreen, startPseudoScreen + segmentLengthPseudoScreen);
    }
  `),v.uniforms.add(new d.N("stipplePatternTexture",e=>e.stippleTexture),new o.m("stipplePatternPixelSizeInv",e=>1/f(e))),t.stippleOffColorEnabled&&v.uniforms.add(new s.E("stippleOffColor",e=>{var t;return null==(t=e.stippleOffColor)?h.uY:4===t.length?t:(0,c.s)(u,t[0],t[1],t[2],1)})),e.include(r.m),v.code.add((0,l.H)`float getStippleSDF(out bool isClamped) {
float stippleDistanceClamped = noPerspectiveRead(clamp(vStippleDistance, vStippleDistanceLimits.x, vStippleDistanceLimits.y));
float lineSizeInv = noPerspectiveRead(vLineSizeInv);
vec2 aaCorrectedLimits = vStippleDistanceLimits + vec2(1.0, -1.0) / gl_FragCoord.w;
isClamped = vStippleDistance < aaCorrectedLimits.x || vStippleDistance > aaCorrectedLimits.y;
float u = stippleDistanceClamped * stipplePatternPixelSizeInv * lineSizeInv;
u = fract(u);
float sdf = texture(stipplePatternTexture, vec2(u, 0.5)).r;
return (sdf - 0.5) * vStipplePatternStretch + 0.5;
}
float getStippleSDF() {
bool ignored;
return getStippleSDF(ignored);
}
float getStippleAlpha(float lineWidth) {
bool isClamped;
float stippleSDF = getStippleSDF(isClamped);
float antiAliasedResult = clamp(stippleSDF * lineWidth + 0.5, 0.0, 1.0);
return isClamped ? floor(antiAliasedResult + 0.5) : antiAliasedResult;
}`),v.code.add((0,l.H)`
    void discardByStippleAlpha(float stippleAlpha, float threshold) {
     ${(0,l.If)(!t.stippleOffColorEnabled,"if (stippleAlpha < threshold) { discard; }")}
    }

    vec4 blendStipple(vec4 color, float stippleAlpha) {
      return ${t.stippleOffColorEnabled?"mix(color, stippleOffColor, stippleAlpha)":"vec4(color.rgb, color.a * stippleAlpha)"};
    }
  `)}function f(e){let t=e.stipplePattern;return t?function(e){return null==e?1:Math.floor(e.pattern.map(t=>Math.round(t*e.pixelRatio)).reduce((e,t)=>e+t))}(e.stipplePattern)/t.pixelRatio:1}let m=.4},2119(e,t,i){i.d(t,{r:()=>o});var r=i(50980),n=i(71788),s=i(17983),a=i(72196);function o(e,t){let i=e.vertex,o=t.hasScreenSizePerspective;(0,n.Nz)(i),null==i.uniforms.get("markerScale")&&i.constants.add("markerScale","float",1),i.constants.add("markerSizePerLineWidth","float",r.PV).code.add((0,a.H)`
  float getLineWidth(${(0,a.If)(o,"vec3 pos")}) {
     return max(getSize(${(0,a.If)(o,"pos")}), 1.0) * pixelRatio;
  }

  float getScreenMarkerSize(float lineWidth) {
    return markerScale * markerSizePerLineWidth * lineWidth;
  }
  `),2===t.space&&(i.constants.add("maxSegmentLengthFraction","float",.45),i.uniforms.add(new s.U("perRenderPixelRatio",e=>e.camera.perRenderPixelRatio)),i.code.add((0,a.H)`
  bool areWorldMarkersHidden(vec3 pos, vec3 other) {
    vec3 midPoint = mix(pos, other, 0.5);
    float distanceToCamera = length(midPoint);
    float screenToWorldRatio = perRenderPixelRatio * distanceToCamera * 0.5;
    float worldMarkerSize = getScreenMarkerSize(getLineWidth(${(0,a.If)(o,"pos")})) * screenToWorldRatio;
    float segmentLen = length(pos - other);
    return worldMarkerSize > maxSegmentLengthFraction * segmentLen;
  }

  float getWorldMarkerSize(vec3 pos) {
    float distanceToCamera = length(pos);
    float screenToWorldRatio = perRenderPixelRatio * distanceToCamera * 0.5;
    return getScreenMarkerSize(getLineWidth(${(0,a.If)(o,"pos")})) * screenToWorldRatio;
  }
  `))}},77046(e,t,i){function r(e){e.vertex.code.add("#define noPerspectiveWrite(x, w) (x * w)")}function n(e){e.fragment.code.add("#define noPerspectiveRead(x) (x * gl_FragCoord.w)")}i.d(t,{F:()=>r,m:()=>n})},24734(e,t,i){i.d(t,{g:()=>m}),i(39831);var r=i(65061),n=i(24121),s=i(58359),a=i(28152),o=i(84119),l=i(70807),d=i(74932),c=i(32926),h=i(55103),u=i(53834),p=i(77879),f=i(2990);class m{constructor(e){this._originSR=e,this._rootOriginId="root/"+(0,r.c)(),this._origins=new Map,this._objects=new Map,this._gridSize=5e5}getOrigin(e){let t=this._origins.get(this._rootOriginId);if(null==t){let t=u.Q.rootOrigin;if(null!=t)return this._origins.set(this._rootOriginId,(0,c.f)(t[0],t[1],t[2],this._rootOriginId)),this.getOrigin(e);let i=(0,c.f)(e[0]+Math.random()-.5,e[1]+Math.random()-.5,e[2]+Math.random()-.5,this._rootOriginId);return this._origins.set(this._rootOriginId,i),i}let i=this._gridSize,r=Math.round(e[0]/i),s=Math.round(e[1]/i),a=Math.round(e[2]/i),o=`${r}/${s}/${a}`,l=this._origins.get(o),d=.5*i;if((0,n.e)(v,e,t.vec3),v[0]=Math.abs(v[0]),v[1]=Math.abs(v[1]),v[2]=Math.abs(v[2]),v[0]<d&&v[1]<d&&v[2]<d){if(l){let t=Math.max(...v);if((0,n.e)(v,e,l.vec3),v[0]=Math.abs(v[0]),v[1]=Math.abs(v[1]),v[2]=Math.abs(v[2]),Math.max(...v)<t)return l}return t}return l||(l=(0,c.f)(r*i,s*i,a*i,o),this._origins.set(o,l)),l}_drawOriginBox(e,t=(0,a.fA)(1,1,0,1)){let i=window.view,r=i.stage,n=t.toString();if(!this._objects.has(n)){this._material=new f.W({width:2,color:t},!1);let e=new p.x(r,{pickable:!1}),i=new h.B({castShadow:!1});e.add(i),this._objects.set(n,i)}let s=this._objects.get(n),c=[0,1,5,4,0,2,1,7,6,2,0,1,3,7,5,4,6,2,0],u=c.length,m=Array(3*u),v=[],g=.5*this._gridSize;for(let t=0;t<u;t++)m[3*t]=e[0]+(1&c[t]?g:-g),m[3*t+1]=e[1]+(2&c[t]?g:-g),m[3*t+2]=e[2]+(4&c[t]?g:-g),t>0&&v.push(t-1,t);(0,o.projectBuffer)(m,this._originSR,0,m,i.renderSpatialReference,0,u);let _=new d.V(this._material,[["position",new l.n(m,v,3,!0)]],null,2);s.addGeometry(_)}get test(){}}let v=(0,s.vt)()},32926(e,t,i){i.d(t,{f:()=>s});var r=i(58359);class n{constructor(e,t){this.vec3=e,this.id=t}}function s(e,t,i,s){return new n((0,r.fA)(e,t,i),s)}},55103(e,t,i){i.d(t,{B:()=>f}),i(39831);var r=i(65061),n=i(21742),s=i(86128),a=i(24121),o=i(58359),l=i(16553),d=i(72699),c=i(22775),h=i(58947),u=i(50645),p=i(29688);class f{constructor(e={}){this.id=(0,r.c)(),this._highlightIds=new Set,this._shaderTransformation=null,this._visible=!0,this.castShadow=e.castShadow??!0,this.usesVerticalDistanceToGround=e.usesVerticalDistanceToGround??!1,this.graphicUid=e.graphicUid,this.layerViewUid=e.layerViewUid,e.isElevationSource&&(this.lastValidElevationBB=new m),this._geometries=e.geometries?Array.from(e.geometries):[]}dispose(){this._geometries.length=0}get layer(){return this._layer}set layer(e){(0,h.vA)(null==this._layer||null==e,"Object3D can only be added to a single Layer"),this._layer=e}addGeometry(e){for(let t of(e.visible=this._visible,this._geometries.push(e),this._highlightIds))e.addHighlight(t);this._emit("geometryAdded",{object:this,geometry:e}),this._highlightIds.size&&this._emit("highlightChanged",this),this._invalidateBoundingVolume()}removeGeometry(e){let t=this._geometries.splice(e,1)[0];if(t){for(let e of this._highlightIds)t.removeHighlight(e);this._emit("geometryRemoved",{object:this,geometry:t}),this._highlightIds.size&&this._emit("highlightChanged",this),this._invalidateBoundingVolume()}}removeAllGeometries(){for(;this._geometries.length>0;)this.removeGeometry(0)}geometryVertexAttributeUpdated(e,t,i=!1){this._emit("attributesChanged",{object:this,geometry:e,attribute:t,sync:i}),(0,u.b)(t)&&this._invalidateBoundingVolume()}get visible(){return this._visible}set visible(e){if(this._visible!==e){for(let t of(this._visible=e,this._geometries))t.visible=this._visible;this._emit("visibilityChanged",this)}}maskOccludee(){let e=new c.p;for(let t of this._geometries)t.occludees=(0,p.Ci)(t.occludees,e);return this._emit("occlusionChanged",this),e}removeOcclude(e){for(let t of this._geometries)t.occludees=(0,p.PC)(t.occludees,e);this._emit("occlusionChanged",this)}highlight(e){let t=new c.h(e);for(let e of this._geometries)e.addHighlight(t);return this._emit("highlightChanged",this),this._highlightIds.add(t),t}removeHighlight(e){for(let t of(this._highlightIds.delete(e),this._geometries))t.removeHighlight(e);this._emit("highlightChanged",this)}removeStateID(e){0===e.channel?this.removeHighlight(e):this.removeOcclude(e)}getCombinedStaticTransformation(e,t){return(0,n.lw)(t,this.transformation,e.transformation)}getCombinedShaderTransformation(e,t=(0,s.vt)()){return(0,n.lw)(t,this.effectiveTransformation,e.transformation)}get boundingVolumeWorldSpace(){return this._bvWorldSpace||(this._bvWorldSpace=this._bvWorldSpace||new v,this._validateBoundingVolume(this._bvWorldSpace,0)),this._bvWorldSpace}get boundingVolumeObjectSpace(){return this._bvObjectSpace||(this._bvObjectSpace=this._bvObjectSpace||new v,this._validateBoundingVolume(this._bvObjectSpace,1)),this._bvObjectSpace}_validateBoundingVolume(e,t){let i=1===t;for(let t of this._geometries){let r=t.boundingInfo;r&&function(e,t,i){let r=e.bbMin,s=e.bbMax;if((0,n.tZ)(i)){let e=(0,a.j)(g,i[12],i[13],i[14]);return(0,a.g)(_,r,e),(0,a.g)(S,s,e),t.minWith(_),t.maxWith(S)}if((0,a.t)(_,r,i),(0,a.q)(r,s))return t.minWith(_),t.maxWith(_);(0,a.t)(S,s,i),t.minWith(_),t.minWith(S),t.maxWith(_),t.maxWith(S);for(let e=0;e<3;++e)(0,a.d)(_,r),(0,a.d)(S,s),_[e]=s[e],S[e]=r[e],(0,a.t)(_,_,i),(0,a.t)(S,S,i),t.minWith(_),t.minWith(S),t.maxWith(_),t.maxWith(S)}(r,e,i?t.transformation:this.getCombinedShaderTransformation(t))}for(let t of((0,l.o)(e.bounds,(0,a.l)(b,e.min,e.max,.5)),this._geometries)){let r=t.boundingInfo;if(null==r)continue;let n=i?t.transformation:this.getCombinedShaderTransformation(t),s=(0,d.hG)(n);(0,a.t)(b,r.center,n);let o=(0,a.k)(b,(0,l.a)(e.bounds)),c=r.radius*s;e.bounds[3]=Math.max(e.bounds[3],o+c)}}_invalidateBoundingVolume(){let e=this._bvWorldSpace?.bounds;this._bvObjectSpace=this._bvWorldSpace=void 0,this.layer&&e&&this.layer.notifyObjectBBChanged(this,e)}_emit(e,t){this.layer?.events.emit(e,t)}get geometries(){return this._geometries}get transformation(){return this._transformation??s.zK}set transformation(e){this._transformation=(0,n.C)(this._transformation??(0,s.vt)(),e),this._invalidateBoundingVolume(),this._emit("transformationChanged",this)}get shaderTransformation(){return this._shaderTransformation}set shaderTransformation(e){this._shaderTransformation=e?(0,n.C)(this._shaderTransformation??(0,s.vt)(),e):null,this._invalidateBoundingVolume(),this._emit("shaderTransformationChanged",this)}get effectiveTransformation(){return this.shaderTransformation??this.transformation}get test(){}}class m{constructor(){this._data=[Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE,-Number.MAX_VALUE,-Number.MAX_VALUE,-Number.MAX_VALUE]}get min(){return(0,o.fA)(this._data[0],this._data[1],this._data[2])}get max(){return(0,o.fA)(this._data[3],this._data[4],this._data[5])}minWith(e){let{_data:t}=this;t[0]=Math.min(t[0],e[0]),t[1]=Math.min(t[1],e[1]),t[2]=Math.min(t[2],e[2])}maxWith(e){let{_data:t}=this;t[3]=Math.max(t[3],e[0]),t[4]=Math.max(t[4],e[1]),t[5]=Math.max(t[5],e[2])}assignMinMax(e,t){for(let i=0;i<3;++i)this._data[0+i]=e[i],this._data[3+i]=t[i]}isEmpty(){return this._data[3]<this._data[0]&&this._data[4]<this._data[1]&&this._data[5]<this._data[2]}}class v extends m{constructor(){super(...arguments),this.bounds=(0,l.c)()}}let g=(0,o.vt)(),_=(0,o.vt)(),S=(0,o.vt)(),b=(0,o.vt)()},91337(e,t,i){i.d(t,{x:()=>h});var r=i(67705),n=i(22855),s=i(24121),a=i(58359),o=i(94982),l=i(10151),d=i(16553),c=i(58947);class h{get bounds(){return this._root.bounds}get halfSize(){return this._root.halfSize}get root(){return this._root.node}get maximumObjectsPerNode(){return this._maximumObjectsPerNode}get maximumDepth(){return this._maximumDepth}get objectCount(){return this._objectCount}constructor(e,t){this.objectToBoundingSphere=e,this._maximumObjectsPerNode=10,this._maximumDepth=20,this._degenerateObjects=new Set,this._root=new u,this._objectCount=0,t&&(void 0!==t.maximumObjectsPerNode&&(this._maximumObjectsPerNode=t.maximumObjectsPerNode),void 0!==t.maximumDepth&&(this._maximumDepth=t.maximumDepth))}destroy(){this._degenerateObjects.clear(),u.clearPool(),T[0]=null,R.prune(),j.prune()}add(e){let t=Array.from(e);this._grow(t);let i=u.acquire();for(let e of t)++this._objectCount,this._isDegenerate(e)?this._degenerateObjects.add(e):(i.init(this._root),this._add(e,i));u.release(i)}remove(e,t=null){this._objectCount-=e.length;let i=u.acquire();for(let r of e){let e=t??(0,d.m)(this.objectToBoundingSphere(r),C);b(e[3])?(i.init(this._root),function(e,t,i){R.clear();let r=i.advanceTo(t,(e,t)=>{R.push(e.node),R.push(t)})?i.node.terminals:i.node.residents;if(r.removeUnordered(e),0===r.length){var s,a;for(let e=R.length-2;e>=0&&(s=R.data[e],(a=R.data[e+1])>=0&&(s.children[a]=null),m(s)&&(null===s.residents&&(s.residents=new n.A({shrink:!0})),1));e-=2);}}(r,e,i)):this._degenerateObjects.delete(r)}u.release(i),this._shrink()}update(e,t){var i;if(!b(t[3])&&this._isDegenerate(e))return;let r=(i=e,T[0]=i,T);this.remove(r,t),this.add(r)}forEachAlongRay(e,t,i){let r=(0,l.LV)(e,t);p(this._root,e=>{var t,n;if(t=r,n=e,v((0,d.a)(n.bounds),-(2*n.halfSize),A),v((0,d.a)(n.bounds),2*n.halfSize,P),!(0,c.O_)(t.origin,t.direction,A,P))return!1;let s=e.node;return s.terminals.forAll(e=>{this._intersectsObject(r,e)&&i(e)}),null!==s.residents&&s.residents.forAll(e=>{this._intersectsObject(r,e)&&i(e)}),!0})}forEachAlongRayWithVerticalOffset(e,t,i,r){let n=(0,l.LV)(e,t);p(this._root,e=>{var t,s,a;if(t=n,s=e,a=r,v((0,d.a)(s.bounds),-(2*s.halfSize),A),v((0,d.a)(s.bounds),2*s.halfSize,P),a.applyToMinMax(A,P),!(0,c.O_)(t.origin,t.direction,A,P))return!1;let o=e.node;return o.terminals.forAll(e=>{this._intersectsObjectWithOffset(n,e,r)&&i(e)}),null!==o.residents&&o.residents.forAll(e=>{this._intersectsObjectWithOffset(n,e,r)&&i(e)}),!0})}forEach(e){p(this._root,t=>{let i=t.node;return i.terminals.forAll(e),null!==i.residents&&i.residents.forAll(e),!0}),this._degenerateObjects.forEach(e)}forEachDegenerateObject(e){this._degenerateObjects.forEach(e)}findClosest(e,t,i,r=()=>!0,n=1/0){let a=1/0,l=1/0,c=null,h=_(e,t),u=s=>{if(--n,!r(s))return;let h=this.objectToBoundingSphere(s);if(!(0,o.m7)(i,h))return;let u=S(e,t,(0,d.a)(h)),p=u-h[3],f=u+h[3];p<a&&(a=p,l=f,c=s)};return f(this._root,r=>{if(n<=0||!(0,o.m7)(i,r.bounds)||((0,s.h)(w,h,r.halfSize),(0,s.g)(w,w,(0,d.a)(r.bounds)),S(e,t,w)>l))return!1;let a=r.node;return a.terminals.forAll(e=>u(e)),null!==a.residents&&a.residents.forAll(e=>u(e)),!0},e,t),c}forEachInDepthRange(e,t,i,r,n,a,l){let c=-1/0,h=1/0,u={setRange:e=>{1===i?(c=Math.max(c,e.near),h=Math.min(h,e.far)):(c=Math.max(c,-e.far),h=Math.min(h,-e.near))}};u.setRange(r);let p=S(t,i,e),m=_(t,i),v=_(t,-i),g=e=>{if(!l(e))return;let r=this.objectToBoundingSphere(e),s=S(t,i,(0,d.a)(r))-p,f=s-r[3],m=s+r[3];f>h||m<c||!(0,o.m7)(a,r)||n(e,u)};f(this._root,e=>{if(!(0,o.m7)(a,e.bounds)||((0,s.h)(w,m,e.halfSize),(0,s.g)(w,w,(0,d.a)(e.bounds)),S(t,i,w)-p>h)||((0,s.h)(w,v,e.halfSize),(0,s.g)(w,w,(0,d.a)(e.bounds)),S(t,i,w)-p<c))return!1;let r=e.node;return r.terminals.forAll(e=>g(e)),null!==r.residents&&r.residents.forAll(e=>g(e)),!0},t,i)}forEachNode(e){p(this._root,t=>e(t.node,t.bounds,t.halfSize,t.depth))}forEachNeighbor(e,t){let i=(0,d.g)(t),r=(0,d.n)(t,(0,a.vt)()),n=t=>{let n=this.objectToBoundingSphere(t),a=i+(0,d.g)(n);return!((0,s.s)((0,d.a)(n),r)-a*a<=0)||e(t)},o=!0,l=e=>{o&&(o=n(e))};p(this._root,e=>{let t=i+(0,d.g)(e.bounds);if((0,s.s)((0,d.a)(e.bounds),r)-t*t>0)return!1;let n=e.node;return n.terminals.forAll(l),o&&null!==n.residents&&n.residents.forAll(l),o}),o&&this.forEachDegenerateObject(l)}_intersectsObject(e,t){let i=this.objectToBoundingSphere(t);return!(i[3]>0)||(0,d.w)(i,e)}_intersectsObjectWithOffset(e,t,i){let r=this.objectToBoundingSphere(t);return!(r[3]>0)||(0,d.w)(i.applyToBoundingSphere(r),e)}_add(e,t){t.advanceTo(this.objectToBoundingSphere(e))?t.node.terminals.push(e):(t.node.residents.push(e),t.node.residents.length>this._maximumObjectsPerNode&&t.depth<this._maximumDepth&&this._split(t))}_split(e){let t=e.node.residents;e.node.residents=null;for(let i=0;i<t.length;i++){let r=u.acquire().init(e);this._add(t.at(i),r),u.release(r)}}_grow(e){if(g(e,e=>this.objectToBoundingSphere(e),D),b(D[3])&&!this._fitsInsideTree(D))if(m(this._root.node))(0,d.m)(D,this._root.bounds),this._root.halfSize=1.25*this._root.bounds[3],this._root.updateBoundsRadiusFromHalfSize();else{let e=this._rootBoundsForRootAsSubNode(D);this._placingRootViolatesMaxDepth(e)?this._rebuildTree(D,e):this._growRootAsSubNode(e),u.release(e)}}_rebuildTree(e,t){(0,d.x)(E,t.bounds),E[3]=t.halfSize,g([e,E],e=>e,L);let i=u.acquire().init(this._root);this._root.initFrom(null,L,L[3]),this._root.increaseHalfSize(1.25),p(i,e=>(this.add(e.node.terminals.data),null!==e.node.residents&&this.add(e.node.residents.data),!0)),u.release(i)}_placingRootViolatesMaxDepth(e){let t=Math.log(e.halfSize/this._root.halfSize)*Math.LOG2E,i=0;return p(this._root,e=>(i=Math.max(i,e.depth))+t<=this._maximumDepth),i+t>this._maximumDepth}_rootBoundsForRootAsSubNode(e){let t=e[3],i=-1/0,r=this._root.bounds,n=this._root.halfSize;for(let s=0;s<3;s++){let a=r[s]-n-(e[s]-t),o=e[s]+t-(r[s]+n),l=Math.max(0,Math.ceil(a/(2*n))),d=Math.max(0,Math.ceil(o/(2*n)))+1;i=Math.max(i,2**Math.ceil(Math.log(l+d)*Math.LOG2E)),W[s].min=l,W[s].max=d}for(let e=0;e<3;e++){let t=W[e].min,s=W[e].max,a=(i-(t+s))/2;t+=Math.ceil(a),s+=Math.floor(a);let o=r[e]-n-t*n*2;O[e]=o+(s+t)*n}let s=i*n;return O[3]=s*z,u.acquire().initFrom(null,O,s,0)}_growRootAsSubNode(e){let t=this._root.node;(0,d.x)(D,this._root.bounds),D[3]=this._root.halfSize,this._root.init(e),e.advanceTo(D,null,!0),e.node.children=t.children,e.node.residents=t.residents,e.node.terminals=t.terminals}_shrink(){for(;;){let e=this._findShrinkIndex();if(-1===e)break;this._root.advance(e),this._root.depth=0}}_findShrinkIndex(){if(0!==this._root.node.terminals.length||this._root.isLeaf())return -1;let e=null,t=this._root.node.children,i=0,r=0;for(;r<t.length&&null==e;)e=t[i=r++];for(;r<t.length;)if(t[r++])return -1;return i}_isDegenerate(e){return!b(this.objectToBoundingSphere(e)[3])}_fitsInsideTree(e){let t=this._root.bounds,i=this._root.halfSize;return e[3]<=i&&e[0]>=t[0]-i&&e[0]<=t[0]+i&&e[1]>=t[1]-i&&e[1]<=t[1]+i&&e[2]>=t[2]-i&&e[2]<=t[2]+i}toJSON(){let{maximumDepth:e,maximumObjectsPerNode:t,_objectCount:i}=this,r=this._nodeToJSON(this._root.node);return{maximumDepth:e,maximumObjectsPerNode:t,objectCount:i,root:{bounds:this._root.bounds,halfSize:this._root.halfSize,depth:this._root.depth,node:r}}}_nodeToJSON(e){return{children:e.children.map(e=>e?this._nodeToJSON(e):null),residents:e.residents?.map(e=>this.objectToBoundingSphere(e)),terminals:e.terminals?.map(e=>this.objectToBoundingSphere(e))}}static fromJSON(e){let t=new h(e=>e,{maximumDepth:e.maximumDepth,maximumObjectsPerNode:e.maximumObjectsPerNode});return t._objectCount=e.objectCount,t._root.initFrom(e.root.node,e.root.bounds,e.root.halfSize,e.root.depth),t}}class u{constructor(){this.bounds=(0,d.c)(),this.halfSize=0,this.initFrom(null,null,0,0)}init(e){return this.initFrom(e.node,e.bounds,e.halfSize,e.depth)}initFrom(e,t,i,r=this.depth){return this.node=null!=e?e:u.createEmptyNode(),t&&(0,d.m)(t,this.bounds),this.halfSize=i,this.depth=r,this}increaseHalfSize(e){this.halfSize*=e,this.updateBoundsRadiusFromHalfSize()}updateBoundsRadiusFromHalfSize(){this.bounds[3]=this.halfSize*z}advance(e){let t=this.node.children[e];t||(t=u.createEmptyNode(),this.node.children[e]=t),this.node=t,this.halfSize/=2,this.depth++;let i=y[e];return this.bounds[0]+=i[0]*this.halfSize,this.bounds[1]+=i[1]*this.halfSize,this.bounds[2]+=i[2]*this.halfSize,this.updateBoundsRadiusFromHalfSize(),this}advanceTo(e,t,i=!1){for(;;){if(this.isTerminalFor(e))return t?.(this,-1),!0;if(this.isLeaf()){if(!i)return t?.(this,-1),!1;this.node.residents=null}let r=this._childIndex(e);t?.(this,r),this.advance(r)}}isLeaf(){return null!=this.node.residents}isTerminalFor(e){return e[3]>this.halfSize/2}_childIndex(e){let t=this.bounds;return+(t[0]<e[0])+2*(t[1]<e[1])+4*(t[2]<e[2])}static createEmptyNode(){return{children:[null,null,null,null,null,null,null,null],terminals:new n.A({shrink:!0}),residents:new n.A({shrink:!0})}}static{this._pool=new r.A(()=>new u)}static acquire(){return u._pool.acquire()}static release(e){u._pool.release(e)}static clearPool(){u._pool.prune()}}function p(e,t){let i=u.acquire().init(e),r=[i];for(;0!==r.length;){if(t(i=r.pop())&&!i.isLeaf())for(let e=0;e<i.node.children.length;e++)i.node.children[e]&&r.push(u.acquire().init(i).advance(e));u.release(i)}}function f(e,t,i,r=1){let n=u.acquire().init(e),s=[n];for(function(e,t,i){if(!j.length)for(let e=0;e<8;++e)j.push({index:0,distance:0});for(let i=0;i<8;++i){let r=y[i];j.data[i].index=i,j.data[i].distance=S(e,t,r)}j.sort((e,t)=>e.distance-t.distance);for(let e=0;e<8;++e)i[e]=j.data[e].index}(i,r,M);0!==s.length;){if(t(n=s.pop())&&!n.isLeaf())for(let e=7;e>=0;--e){let t=M[e];n.node.children[t]&&s.push(u.acquire().init(n).advance(t))}u.release(n)}}function m(e){if(0!==e.terminals.length)return!1;if(null!==e.residents)return 0===e.residents.length;for(let t=0;t<e.children.length;t++)if(e.children[t])return!1;return!0}function v(e,t,i){i[0]=e[0]+t,i[1]=e[1]+t,i[2]=e[2]+t}function g(e,t,i){for(let i of(A[0]=1/0,A[1]=1/0,A[2]=1/0,P[0]=-1/0,P[1]=-1/0,P[2]=-1/0,e)){let e=t(i);b(e[3])&&(A[0]=Math.min(A[0],e[0]-e[3]),A[1]=Math.min(A[1],e[1]-e[3]),A[2]=Math.min(A[2],e[2]-e[3]),P[0]=Math.max(P[0],e[0]+e[3]),P[1]=Math.max(P[1],e[1]+e[3]),P[2]=Math.max(P[2],e[2]+e[3]))}(0,d.o)(i,(0,s.l)(F,A,P,.5)),i[3]=Math.max(P[0]-A[0],P[1]-A[1],P[2]-A[2])/2}function _(e,t){let i,r=1/0;for(let n=0;n<8;++n){let s=S(e,t,x[n]);s<r&&(r=s,i=x[n])}return i}function S(e,t,i){return t*(e[0]*i[0]+e[1]*i[1]+e[2]*i[2])}function b(e){return!isNaN(e)&&e!==-1/0&&e!==1/0&&e>0}let y=[(0,a.fA)(-1,-1,-1),(0,a.fA)(1,-1,-1),(0,a.fA)(-1,1,-1),(0,a.fA)(1,1,-1),(0,a.fA)(-1,-1,1),(0,a.fA)(1,-1,1),(0,a.fA)(-1,1,1),(0,a.fA)(1,1,1)],x=[(0,a.fA)(-1,-1,-1),(0,a.fA)(-1,-1,1),(0,a.fA)(-1,1,-1),(0,a.fA)(-1,1,1),(0,a.fA)(1,-1,-1),(0,a.fA)(1,-1,1),(0,a.fA)(1,1,-1),(0,a.fA)(1,1,1)],z=Math.sqrt(3),T=[null],O=(0,d.c)(),w=(0,a.vt)(),A=(0,a.vt)(),P=(0,a.vt)(),R=new n.A,C=(0,d.c)(),D=(0,d.c)(),E=(0,d.c)(),L=(0,d.c)(),W=[{min:0,max:0},{min:0,max:0},{min:0,max:0}],j=new n.A,M=[0,0,0,0,0,0,0,0],F=(0,a.vt)()},50645(e,t,i){i.d(t,{b:()=>r});function r(e){return"position"===e}},77879(e,t,i){i.d(t,{x:()=>h});var r=i(85569),n=i(73345),s=i(17306),a=i(1436);i(39831);var o=i(6267),l=i(65061);let d=["layerObjectAdded","layerObjectRemoved","layerObjectsAdded","layerObjectsRemoved","transformationChanged","shaderTransformationChanged","visibilityChanged","occlusionChanged","highlightChanged","geometryAdded","geometryRemoved","attributesChanged"];var c=i(91337);class h{constructor(e,t,i=""){for(let r of(this.stage=e,this.apiLayerViewUid=i,this.id=(0,l.c)(),this.events=new s.bk,this.visible=!0,this.sliceable=!1,this._objectsAdded=[],this._handles=new a.A,this._objects=new Map,this._pickable=!0,this.visible=t?.visible??!0,this._pickable=t?.pickable??!0,this.updatePolicy=t?.updatePolicy??0,e.addLayer(this),d))this._handles.add(this.events.on(r,t=>e.handleEvent(r,t)))}destroy(){this._handles.size&&(this._handles.destroy(),this.stage.removeLayer(this),this.invalidateSpatialQueryAccelerator())}get objects(){return this._objects}getObject(e){return(0,n.zI)(this._objects.get(e))}set pickable(e){this._pickable=e}get pickable(){return this._pickable&&this.visible}add(e){this._objects.set(e.id,e),e.layer=this,this.events.emit("layerObjectAdded",e),null!=this._octree&&this._objectsAdded.push(e)}remove(e){this._objects.delete(e.id)&&(this.events.emit("layerObjectRemoved",e),e.layer=null,null!=this._octree&&((0,r.Xy)(this._objectsAdded,e)||this._octree.remove([e])))}addMany(e){for(let t of e)this._objects.set(t.id,t),t.layer=this;this.events.emit("layerObjectsAdded",e),null!=this._octree&&this._objectsAdded.push(...e)}removeMany(e){let t=[];for(let i of e)this._objects.delete(i.id)&&t.push(i);if(0!==t.length&&(this.events.emit("layerObjectsRemoved",t),t.forEach(e=>e.layer=null),null!=this._octree)){for(let e=0;e<t.length;)(0,r.Xy)(this._objectsAdded,t[e])?(t[e]=t[t.length-1],t.length-=1):++e;this._octree.remove(t)}}commit(){this.stage.commitLayer(this)}sync(){1!==this.updatePolicy&&this.stage.syncLayer(this.id)}notifyObjectBBChanged(e,t){null==this._octree||this._objectsAdded.includes(e)||this._octree.update(e,t)}getSpatialQueryAccelerator(){return null==this._octree&&this._objects.size>50?(this._octree=new c.x(e=>e.boundingVolumeWorldSpace.bounds),this._octree.add(this._objects.values())):null!=this._octree&&this._objectsAdded.length>0&&(this._octree.add(this._objectsAdded),this._objectsAdded.length=0),this._octree}invalidateSpatialQueryAccelerator(){this._octree=(0,o.pR)(this._octree),this._objectsAdded.length=0}get test(){}}},53834(e,t,i){i.d(t,{G:()=>r,Q:()=>n});let r={stableRendering:!1},n={rootOrigin:null}},2990(e,t,i){i.d(t,{W:()=>V});var r=i(539),n=i(92504),s=i(89882),a=i(60882),o=i(60704),l=i(24121),d=i(58359),c=i(2662),h=i(28152),u=i(11449),p=i(22759),f=i(38774),m=i(55274),v=i(36340),g=i(67341),_=i(45722),S=i(58947),b=i(17745),y=i(81500),x=i(50126);i(39831);var z=i(11110),T=i(47705),O=i(67319),w=i(1931),A=i(98546),P=i(41746),R=i(2449);class C extends O.w{constructor(e,t){super(e,t,new T.$(x.R,()=>i.e("68903").then(i.bind(i,97274))),E(t).locations),this.primitiveType=t.wireframe?P.WR.LINES:P.WR.TRIANGLE_STRIP}_makePipelineState(e,t){let{oitPass:i,output:r,hasOccludees:n,hasPolygonOffset:s}=e,a=0===i,o=2===i;return(0,R.Ey)({blending:(0,m.RN)(r)?(0,w.Yf)(i):null,depthTest:{func:(0,w.K_)(i)},depthWrite:(0,w.z5)(e),drawBuffers:(0,O.L)(r,(0,w.m6)(i,r)),colorWrite:R.kn,stencilWrite:n?A.v0:null,stencilTest:n?t?A.a9:A.qh:null,polygonOffset:a||o?s?D:null:w.SE})}initializePipeline(e){if(e.occluder){let t=e.hasPolygonOffset?D:null,{output:i,hasOccludees:r}=e;this._occluderPipelineTransparent=(0,R.Ey)({blending:R.T8,polygonOffset:t,depthTest:A.sf,depthWrite:null,colorWrite:R.kn,stencilWrite:null,stencilTest:r?A.mK:null,drawBuffers:(0,O.L)(i)}),this._occluderPipelineOpaque=(0,R.Ey)({blending:R.T8,polygonOffset:t,depthTest:r?A.sf:A.m,depthWrite:null,colorWrite:R.kn,stencilWrite:r?A.r8:null,stencilTest:r?A.I$:null,drawBuffers:(0,O.L)(i)}),this._occluderPipelineMaskWrite=(0,R.Ey)({blending:null,polygonOffset:t,depthTest:A.m,depthWrite:null,colorWrite:null,stencilWrite:r?A.v0:null,stencilTest:r?A.a9:null,drawBuffers:(0,O.L)(i)})}return this._occludeePipeline=this._makePipelineState(e,!0),this._makePipelineState(e,!1)}getPipeline(e,t){if(e)return this._occludeePipeline;switch(t){case 11:return this._occluderPipelineTransparent??super.getPipeline();case 10:return this._occluderPipelineOpaque??super.getPipeline();default:return this._occluderPipelineMaskWrite??super.getPipeline()}}}let D={factor:0,units:-4};function E(e){let t=(0,z.BP)().vec3f("position").vec4f16("previousDelta").vec4f16("nextDelta").f32("u0").vec2f16("lineParameters");return e.hasVVColor?t.f32("colorFeatureAttribute"):t.vec4u8("color",{glNormalized:!0}),e.hasVVSize?t.f32("sizeFeatureAttribute"):t.f32("size"),e.hasVVOpacity&&t.f32("opacityFeatureAttribute"),(0,v.E)()&&t.vec4u8("olidColor"),e.hasAnimation&&t.vec4f16("timeStamps"),t}var L=i(34629),W=i(46640),j=i(9319);class M extends j.E{constructor(e){super(),this.spherical=e,this.capType=0,this.emissionSource=0,this.hasPolygonOffset=!1,this.writeDepth=!1,this.draped=!1,this.stippleEnabled=!1,this.stippleOffColorEnabled=!1,this.stipplePreferContinuous=!0,this.roundJoins=!1,this.applyMarkerOffset=!1,this.hasVVSize=!1,this.hasVVColor=!1,this.hasVVOpacity=!1,this.falloffEnabled=!1,this.innerColorEnabled=!1,this.hasOccludees=!1,this.occluder=!1,this.terrainDepthTest=!1,this.cullAboveTerrain=!1,this.wireframe=!1,this.discardInvisibleFragments=!1,this.animation=2,this.hasScreenSizePerspective=!1,this.textureCoordinateType=0,this.occlusionPass=!1,this.hasVVInstancing=!1,this.hasSliceTranslatedView=!0,this.overlayEnabled=!1,this.snowCover=!1}get hasAnimation(){return 0!==this.animation}}(0,L.__decorate)([(0,W.W)({count:3})],M.prototype,"capType",void 0),(0,L.__decorate)([(0,W.W)({count:8})],M.prototype,"emissionSource",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"hasPolygonOffset",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"writeDepth",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"draped",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"stippleEnabled",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"stippleOffColorEnabled",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"stipplePreferContinuous",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"roundJoins",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"applyMarkerOffset",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"hasVVSize",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"hasVVColor",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"hasVVOpacity",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"falloffEnabled",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"innerColorEnabled",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"hasOccludees",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"occluder",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"terrainDepthTest",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"cullAboveTerrain",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"wireframe",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"discardInvisibleFragments",void 0),(0,L.__decorate)([(0,W.W)({count:4})],M.prototype,"animation",void 0),(0,L.__decorate)([(0,W.W)()],M.prototype,"hasScreenSizePerspective",void 0);var F=i(85580);class V extends _.i{constructor(e,t){super(e,I),this.produces=new Map([[2,e=>(0,m.CL)(e)||(0,m.RN)(e)&&8===this.parameters.renderOccluded],[3,e=>(0,m.eh)(e)],[10,e=>(0,m.T2)(e)&&8===this.parameters.renderOccluded],[11,e=>(0,m.T2)(e)&&8===this.parameters.renderOccluded],[4,e=>(0,m.RN)(e)&&this.parameters.writeDepth&&8!==this.parameters.renderOccluded],[8,e=>(0,m.RN)(e)&&!this.parameters.writeDepth&&8!==this.parameters.renderOccluded],[18,e=>(0,m.i3)(e)]]),this._configuration=new M(t)}getConfiguration(e,t){var i;super.getConfiguration(e,t,this._configuration),this._configuration.oitPass=t.oitPass,this._configuration.draped=18===t.slot;let r=null!=this.parameters.stipplePattern&&9!==e;return this._configuration.stippleEnabled=r,this._configuration.stippleOffColorEnabled=r&&null!=this.parameters.stippleOffColor,this._configuration.stipplePreferContinuous=r&&this.parameters.stipplePreferContinuous,this._configuration.hasSlicePlane=this.parameters.hasSlicePlane,this._configuration.roundJoins="round"===this.parameters.join,this._configuration.capType=this.parameters.cap,this._configuration.applyMarkerOffset=null!=this.parameters.markerParameters&&1===(i=this.parameters.markerParameters).anchor&&i.hideOnShortSegments&&"begin-end"===i.placement&&i.worldSpace,this._configuration.hasPolygonOffset=this.parameters.hasPolygonOffset,this._configuration.writeDepth=this.parameters.writeDepth,this._configuration.hasVVSize=this.parameters.hasVVSize,this._configuration.hasVVColor=this.parameters.hasVVColor,this._configuration.hasVVOpacity=this.parameters.hasVVOpacity,this._configuration.innerColorEnabled=this.parameters.innerWidth>0&&null!=this.parameters.innerColor,this._configuration.falloffEnabled=this.parameters.falloff>0,this._configuration.hasOccludees=t.hasOccludees,this._configuration.occluder=8===this.parameters.renderOccluded,this._configuration.terrainDepthTest=t.terrainDepthTest&&(0,m.RN)(e),this._configuration.cullAboveTerrain=t.cullAboveTerrain,this._configuration.wireframe=this.parameters.wireframe,this._configuration.animation=this.parameters.animation,this._configuration.emissionSource=+!!this.hasEmissions,this._configuration.hasScreenSizePerspective=!!this.parameters.screenSizePerspective,this._configuration}get visible(){return this.parameters.color[3]>=F.Q||null!=this.parameters.stipplePattern&&(this.parameters.stippleOffColor?.[3]??0)>F.Q}setParameters(e,t){e.animation=this.parameters.animation,super.setParameters(e,t)}intersectDraped({attributes:e,screenToWorldRatio:t},i,r,s,a){if(!i.options.selectionMode)return;let o=e.get("size"),l=this.parameters.width;if(this.parameters.vvSize){let t=e.get("sizeFeatureAttribute").data[0];Number.isNaN(t)?l*=this.parameters.vvSize.fallback[0]:l*=(0,n.qE)(this.parameters.vvSize.offset[0]+t*this.parameters.vvSize.factor[0],this.parameters.vvSize.minSize[0],this.parameters.vvSize.maxSize[0])}else o&&(l*=o.data[0]);let d=r[0],c=r[1],h=(l/2+4)*t,u=Number.MAX_VALUE,p=0,f=e.get("position").data,m=B(this.parameters,e)?f.length-2:f.length-5;for(let e=0;e<m;e+=3){let t=f[e],i=f[e+1],r=(e+3)%f.length,s=d-t,a=c-i,o=f[r]-t,l=f[r+1]-i,h=(0,n.qE)((o*s+l*a)/(o*o+l*l),0,1),m=o*h-s,v=l*h-a,g=m*m+v*v;g<u&&(u=g,p=e/3)}u<h*h&&s(a.distance,a.normal,p)}intersect(e,t,i,s,a,d){let{options:c,camera:h,rayBegin:u,rayEnd:m}=i;if(!c.selectionMode||!e.visible||!h)return;if(!(0,S.zH)(t))return void r.A.getLogger("esri.views.3d.webgl-engine.materials.RibbonLineMaterial").error("intersection assumes a translation-only matrix");let v=e.attributes,g=v.get("position").data,_=this.parameters.width;if(this.parameters.vvSize){let e=v.get("sizeFeatureAttribute").data[0];Number.isNaN(e)||(_*=(0,n.qE)(this.parameters.vvSize.offset[0]+e*this.parameters.vvSize.factor[0],this.parameters.vvSize.minSize[0],this.parameters.vvSize.maxSize[0]))}else v.has("size")&&(_*=v.get("size").data[0]);(0,o.C)(J,i.point);let b=_*h.pixelRatio/2+4*h.pixelRatio;(0,l.j)(es[0],J[0]-b,J[1]+b,0),(0,l.j)(es[1],J[0]+b,J[1]+b,0),(0,l.j)(es[2],J[0]+b,J[1]-b,0),(0,l.j)(es[3],J[0]-b,J[1]-b,0);for(let e=0;e<4;e++)if(!h.unprojectFromRenderScreen(es[e],ea[e]))return;(0,f.Cr)(h.eye,ea[0],ea[1],eo),(0,f.Cr)(h.eye,ea[1],ea[2],el),(0,f.Cr)(h.eye,ea[2],ea[3],ed),(0,f.Cr)(h.eye,ea[3],ea[0],ec);let y=Number.MAX_VALUE,x=0,z=B(this.parameters,v)?g.length-2:g.length-5;for(let e=0;e<z;e+=3){U[0]=g[e]+t[12],U[1]=g[e+1]+t[13],U[2]=g[e+2]+t[14];let i=(e+3)%g.length;if($[0]=g[i]+t[12],$[1]=g[i+1]+t[13],$[2]=g[i+2]+t[14],0>(0,f.mN)(eo,U)&&0>(0,f.mN)(eo,$)||0>(0,f.mN)(el,U)&&0>(0,f.mN)(el,$)||0>(0,f.mN)(ed,U)&&0>(0,f.mN)(ed,$)||0>(0,f.mN)(ec,U)&&0>(0,f.mN)(ec,$))continue;let r=h.projectToRenderScreen(U,Q),n=h.projectToRenderScreen($,X);if(null==r||null==n)continue;if(r[2]<0&&n[2]>0){(0,l.e)(q,U,$);let e=h.frustum,t=-(0,f.mN)(e[4],U)/(0,l.f)(q,(0,f.Qj)(e[4]));if((0,l.h)(q,q,t),(0,l.g)(U,U,q),!h.projectToRenderScreen(U,r))continue}else if(r[2]>0&&n[2]<0){(0,l.e)(q,$,U);let e=h.frustum,t=-(0,f.mN)(e[4],$)/(0,l.f)(q,(0,f.Qj)(e[4]));if((0,l.h)(q,q,t),(0,l.g)($,$,q),!h.projectToRenderScreen($,n))continue}else if(r[2]<0&&n[2]<0)continue;r[2]=0,n[2]=0;let s=(0,p.kb)((0,p.Cr)(r,n,K),J);s<y&&(y=s,(0,l.d)(Y,U),(0,l.d)(Z,$),x=e/3)}if(y<b*b){let e=Number.MAX_VALUE;if((0,p.ld)((0,p.Cr)(Y,Z,K),(0,p.Cr)(u,m,ee),G)){(0,l.e)(G,G,u);let t=(0,l.b)(G);(0,l.h)(G,G,1/t),e=t/(0,l.k)(u,m)}d(e,G,x)}}get hasEmissions(){return this.parameters.emissiveStrength>0}createBufferWriter(){return new N(E(this.parameters),this.parameters)}createGLMaterial(e){return new H(e)}validateParameters(e){"miter"!==e.join&&(e.miterLimit=0),null!=e.markerParameters&&(e.markerScale=e.markerParameters.width/e.width)}update(e){let{hasAnimation:t}=this.parameters;return!!t&&(this.setParameters({timeElapsed:(0,a.y)(e.time)},!1),0!==e.dt)}}class H extends g.A{constructor(){super(...arguments),this._stipplePattern=null}dispose(){super.dispose(),this._stippleTextures?.release(this._stipplePattern),this._stipplePattern=null}beginSlot(e){let t=this._material.parameters.stipplePattern;return this._stipplePattern!==t&&(this._material.setParameters({stippleTexture:this._stippleTextures.swap(t,this._stipplePattern)}),this._stipplePattern=t),this.getTechnique(C,e)}}class I extends b.S{constructor(){super(...arguments),this.width=0,this.color=h.Un,this.join="miter",this.cap=0,this.miterLimit=5,this.writeDepth=!0,this.hasPolygonOffset=!1,this.stippleTexture=null,this.stipplePreferContinuous=!0,this.markerParameters=null,this.markerScale=1,this.hasSlicePlane=!1,this.vvFastUpdate=!1,this.isClosed=!1,this.falloff=0,this.innerWidth=0,this.wireframe=!1,this.timeElapsed=0,this.animation=0,this.animationSpeed=1,this.trailLength=1,this.startTime=0,this.endTime=1/0,this.fadeInTime=0,this.fadeOutTime=1/0,this.emissiveStrength=0}get transparent(){return this.color[3]<1||this.hasAnimation||null!=this.stipplePattern&&(this.stippleOffColor?.[3]??0)<1}get hasAnimation(){return 0!==this.animation}}class N{constructor(e,t){this.layout=e,this._parameters=t;let i=+!!t.stipplePattern;switch(this._parameters.join){case"miter":case"bevel":this.numJoinSubdivisions=i;break;case"round":this.numJoinSubdivisions=x.r+i}}_isClosed(e){return B(this._parameters,e)}allocate(e){return this.layout.createBuffer(e)}elementCount(e){let t=e.get("position").indices.length/2+1,i=this._isClosed(e),r=i?2:4;return r+=((i?t:t-1)-!i)*(2*this.numJoinSubdivisions+4)+2,this._parameters.wireframe&&(r=2+4*(r-2)),r}write(e,t,i,r,n,s){let a=this.layout,o=i.get("position"),d=o.indices,h=o.data.length/3,p=i.get("distanceToStart")?.data;d&&d.length!==2*(h-1)&&console.warn("RibbonLineMaterial does not support indices");let f=a.fields.has("sizeFeatureAttribute"),m=1,g=null;if(f){let e=i.get("sizeFeatureAttribute");1===e.data.length?m=e.data[0]:g=e.data}else m=i.get("size")?.data[0]??1;let _=[1,1,1,1],S=0,b=null,x=a.fields.has("colorFeatureAttribute");if(x){let e=i.get("colorFeatureAttribute");1===e.data.length?S=e.data[0]:b=e.data}else _=i.get("color")?.data??_;let z=i.get("timeStamps")?.data,T=z&&a.fields.has("timeStamps"),O=a.fields.has("opacityFeatureAttribute"),w=0,A=null;if(O){let e=i.get("opacityFeatureAttribute");1===e.data.length?w=e.data[0]:A=e.data}let P=new Float32Array(n.buffer),R=(0,u.Bg)(n.buffer),C=new Uint8Array(n.buffer),D=a.stride/4,E=s*D,L=E,W=0,j=p?(e,t,i)=>W=p[i]:(e,t,i)=>W+=(0,l.k)(e,t),M=P.BYTES_PER_ELEMENT/R.BYTES_PER_ELEMENT,F=4/M,V=(0,v.E)(),H=(e,t,i,n,s,a,o,l)=>{P[E++]=t[0],P[E++]=t[1],P[E++]=t[2],(0,y.Wu)(e,t,R,E*M),E+=F,(0,y.Wu)(i,t,R,E*M),E+=F,P[E++]=l;let d=E*M;if(R[d++]=s,R[d++]=a,E=Math.ceil(d/M),x)P[E]=b?.[o]??S;else{let e=Math.min(4*o,_.length-4),t=4*E;C[t]=255*_[e],C[t+1]=255*_[e+1],C[t+2]=255*_[e+2],C[t+3]=255*_[e+3]}if(E++,P[E++]=g?.[o]??m,O&&(P[E++]=A?.[o]??w),V){let e=4*E;r?(C[e++]=r[0],C[e++]=r[1],C[e++]=r[2],C[e++]=r[3]):(C[e++]=0,C[e++]=0,C[e++]=0,C[e++]=0),E=Math.ceil(.25*e)}T&&(d=E*M,R[d++]=n[0],R[d++]=n[1],R[d++]=n[2],R[d++]=n[3],E=Math.ceil(d/M))};E+=D,(0,l.j)(ei,o.data[0],o.data[1],o.data[2]),T&&(0,c.s)(en,z[0],z[1],z[2],z[3]),e&&(0,l.t)(ei,ei,e);let I=this._isClosed(i);if(I){let t=o.data.length-3;(0,l.j)(et,o.data[t],o.data[t+1],o.data[t+2]),e&&(0,l.t)(et,et,e)}else(0,l.j)(er,o.data[3],o.data[4],o.data[5]),e&&(0,l.t)(er,er,e),H(ei,ei,er,en,1,-4,0,0),H(ei,ei,er,en,1,4,0,0),(0,l.d)(et,ei),(0,l.d)(ei,er),T&&(0,c.s)(en,z[4],z[5],z[6],z[7]);let N=+!I,B=I?h:h-1;for(let t=N;t<B;t++){let i=(t+1)%h*3;(0,l.j)(er,o.data[i],o.data[i+1],o.data[i+2]),e&&(0,l.t)(er,er,e),j(et,ei,t),H(et,ei,er,en,0,-1,t,W),H(et,ei,er,en,0,1,t,W);let r=this.numJoinSubdivisions;for(let e=0;e<r;++e){let i=(e+1)/(r+1);H(et,ei,er,en,i,-1,t,W),H(et,ei,er,en,i,1,t,W)}if(H(et,ei,er,en,1,-2,t,W),H(et,ei,er,en,1,2,t,W),(0,l.d)(et,ei),(0,l.d)(ei,er),T){let e=(t+1)%h*4;(0,c.s)(en,z[e],z[e+1],z[e+2],z[e+3])}}return I?((0,l.j)(er,o.data[3],o.data[4],o.data[5]),e&&(0,l.t)(er,er,e),W=j(et,ei,B),H(et,ei,er,en,0,-1,N,W),H(et,ei,er,en,0,1,N,W)):(W=j(et,ei,B),H(et,ei,ei,en,0,-5,B,W),H(et,ei,ei,en,0,5,B,W)),k(P,L+D,P,L,D),E=k(P,E-D,P,E,D),this._parameters.wireframe&&this._addWireframeVertices(n,L,E,D),null}_addWireframeVertices(e,t,i,r){let n=new Float32Array(e.buffer,i*Float32Array.BYTES_PER_ELEMENT),s=new Float32Array(e.buffer,t*Float32Array.BYTES_PER_ELEMENT,i-t),a=0,o=e=>a=k(s,e,n,a,r);for(let e=0;e<s.length-1;e+=2*r)o(e),o(e+2*r),o(e+ +r),o(e+2*r),o(e+ +r),o(e+3*r)}}function k(e,t,i,r,n){for(let s=0;s<n;s++)i[r++]=e[t++];return r}function B(e,t){return!!e.isClosed&&t.get("position").indices.length>2}let U=(0,d.vt)(),$=(0,d.vt)(),q=(0,d.vt)(),G=(0,d.vt)(),J=(0,d.vt)(),Q=(0,s.r_)(),X=(0,s.r_)(),Y=(0,d.vt)(),Z=(0,d.vt)(),K=(0,p.vt)(),ee=(0,p.vt)(),et=(0,d.vt)(),ei=(0,d.vt)(),er=(0,d.vt)(),en=(0,h.vt)(),es=[(0,s.r_)(),(0,s.r_)(),(0,s.r_)(),(0,s.r_)()],ea=[(0,d.vt)(),(0,d.vt)(),(0,d.vt)(),(0,d.vt)()],eo=(0,f.vt)(),el=(0,f.vt)(),ed=(0,f.vt)(),ec=(0,f.vt)()},29688(e,t,i){i.d(t,{Ci:()=>s,PC:()=>a,Vk:()=>o});var r=i(58359),n=i(76698);function s(e,t){return null==e&&(e=[]),e.push(t),e}function a(e,t){if(null==e)return null;let i=e.filter(e=>e!==t);return 0===i.length?null:i}function o(e,t,i,r,s){l[0]=e.get(t,0),l[1]=e.get(t,1),l[2]=e.get(t,2),(0,n.jS)(l,d,3),i.set(s,0,d[0]),r.set(s,0,d[1]),i.set(s,1,d[2]),r.set(s,1,d[3]),i.set(s,2,d[4]),r.set(s,2,d[5])}let l=(0,r.vt)(),d=new Float32Array(6)},75565(e,t,i){i.d(t,{Q:()=>l});var r=i(2662),n=i(28152),s=i(1411),a=i(35449),o=i(72196);function l(e,t){if(!t.hasAnimation)return;let{attributes:i,varyings:n,vertex:l,fragment:c}=e;i.add("timeStamps","vec4"),n.add("vTimeStamp","float"),n.add("vFirstTime","float"),n.add("vLastTime","float"),n.add("vTransitionType","float"),l.main.add((0,o.H)`vTimeStamp = timeStamps.x;
vFirstTime = timeStamps.y;
vLastTime = timeStamps.z;
vTransitionType = timeStamps.w;`);let{animation:h}=t;3===h&&c.constants.add("decayRate","float",2.3),c.code.add((0,o.H)`
    float getTrailOpacity(float x) {
      ${function(e){switch(e){case 2:return"return x >= 0.0 && x <= 1.0 ? 1.0 : 0.0;";case 3:return"float cutOff = exp(-decayRate);\n        return (exp(-decayRate * x) - cutOff) / (1.0 - cutOff);";default:return"return 1.0;"}}(h)}
    }`),c.uniforms.add(new a.m("timeElapsed",e=>e.timeElapsed),new a.m("trailLength",e=>e.trailLength),new a.m("speed",e=>e.animationSpeed),new s.E("timingOptions",e=>(0,r.s)(d,e.startTime,e.endTime,e.fadeInTime,e.fadeOutTime))),c.code.add((0,o.H)`float fadeIn(float x) {
return smoothstep(0.0, timingOptions[2], x);
}
float fadeOut(float x) {
return isinf(timingOptions[3]) ? 1.0 : smoothstep(timingOptions[3], 0.0, x);
}`),c.code.add((0,o.H)`vec4 animate(vec4 color) {
float startTime = timingOptions[0];
float endTime = timingOptions[1];
float totalTime = vLastTime - vFirstTime;
float actualEndTime = int(vTransitionType) == 2 ? min(endTime, startTime + vLastTime / speed) : endTime;
vec4 animatedColor = color;
if (speed == 0.0) {
animatedColor.a *= getTrailOpacity((totalTime - (vTimeStamp - vFirstTime)) / trailLength);
animatedColor.a *= isinf(actualEndTime) ? 1.0 : fadeOut(timeElapsed - actualEndTime);
animatedColor.a *= fadeIn(timeElapsed - startTime);
return animatedColor;
}
float relativeStartTime = mod(startTime, totalTime);
float vHeadRelativeToFirst = mod((timeElapsed - relativeStartTime) * speed - vFirstTime, totalTime);
float vRelativeToHead = vHeadRelativeToFirst + vFirstTime - vTimeStamp;
bool inPreviousCycle = vRelativeToHead < 0.0;
vRelativeToHead += inPreviousCycle ? totalTime : 0.0;
float vAbsoluteTime = timeElapsed - vRelativeToHead / speed;
if (vAbsoluteTime > actualEndTime) {
vRelativeToHead = (timeElapsed - relativeStartTime) * speed - vTimeStamp;
vAbsoluteTime = timeElapsed - vRelativeToHead / speed;
}
animatedColor *= step(startTime, vAbsoluteTime);
animatedColor *= step(vAbsoluteTime, actualEndTime);
animatedColor.a *= isinf(actualEndTime) ? 1.0 : fadeOut(timeElapsed - actualEndTime);
animatedColor.a *= inPreviousCycle ? fadeOut(vHeadRelativeToFirst / speed) : 1.0;
animatedColor.a *= getTrailOpacity(vRelativeToHead / trailLength);
animatedColor.a *= int(vTransitionType) == 0 ? fadeIn(vAbsoluteTime - startTime) : 1.0;
animatedColor.a *= fadeIn(vTimeStamp - vFirstTime);
return animatedColor;
}`)}let d=(0,n.vt)()}}]);