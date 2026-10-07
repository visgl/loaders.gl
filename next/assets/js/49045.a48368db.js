"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["49045"],{69726(e,t,i){i.d(t,{H:()=>T,b:()=>V,c:()=>_,f:()=>F});var n=i(60704),r=i(59646),o=i(28152),a=i(99817),l=i(1110),s=i(33045),c=i(16917),u=i(97085),f=i(36985),p=i(3097),d=i(81097),h=i(34328),v=i(89002),g=i(6916),m=i(71788),y=i(54473),x=i(45393),b=i(84674),w=i(1411),S=i(17983),A=i(35449),P=i(72196),z=i(96390),C=i(79856),O=i(96028),M=i(85580);function V(e){let t=new O.N5,{signedDistanceFieldEnabled:i,occlusionTestEnabled:r,horizonCullingEnabled:V,pixelSnappingEnabled:F,hasScreenSizePerspective:T,debugDrawLabelBorder:R,hasVVSize:E,hasVVColor:I,hasRotation:U,occludedFragmentFade:$,sampleSignedDistanceFieldTexelCenter:W}=e;t.include(u.Q,e),t.vertex.include(l.rA,e);let{occlusionPass:B,output:N,oitPass:L}=e;if(B)return t.include(f.I,e),t;let{vertex:G,fragment:q}=t;t.include(g.Y6),t.include(h.A,e),t.include(s.g,e),r&&t.include(p.y),q.include(v.a),t.varyings.add("vcolor","vec4"),t.varyings.add("vtc","vec2"),t.varyings.add("vsize","vec2");let k=9===N,Y=k&&r;Y&&t.varyings.add("voccluded","float"),G.uniforms.add(new x.I("viewport",e=>e.camera.fullViewport),new y.G("screenOffset",(e,t)=>(0,n.hZ)(H,2*e.screenOffset[0]*t.camera.pixelRatio,2*e.screenOffset[1]*t.camera.pixelRatio)),new y.G("anchorPosition",e=>_(e)),new w.E("materialColor",e=>e.color),new A.m("materialRotation",e=>e.rotation),new C.N("tex",e=>e.texture)),(0,m.Nz)(G),i&&(G.uniforms.add(new w.E("outlineColor",e=>e.outlineColor)),q.uniforms.add(new w.E("outlineColor",e=>D(e)?e.outlineColor:o.uY),new A.m("outlineSize",e=>D(e)?e.outlineSize:0))),V&&G.uniforms.add(new b.V("pointDistanceSphere",(e,t)=>{let i=t.camera.eye,n=e.origin;return(0,o.fA)(n[0]-i[0],n[1]-i[1],n[2]-i[2],a.$O.radius)})),F&&G.include(c.K),T&&((0,g.pM)(G),(0,g.OH)(G)),R&&t.varyings.add("debugBorderCoords","vec4"),t.attributes.add("uv0","vec2"),t.attributes.add("uvi","vec4"),t.attributes.add("color","vec4"),t.attributes.add("size","vec2"),t.attributes.add("rotation","float"),(E||I)&&t.attributes.add("featureAttribute","vec4"),G.code.add(V?(0,P.H)`bool behindHorizon(vec3 posModel) {
vec3 camToEarthCenter = pointDistanceSphere.xyz - localOrigin;
vec3 camToPos = pointDistanceSphere.xyz + posModel;
float earthRadius = pointDistanceSphere.w;
float a = dot(camToPos, camToPos);
float b = dot(camToPos, camToEarthCenter);
float c = dot(camToEarthCenter, camToEarthCenter) - earthRadius * earthRadius;
return b > 0.0 && b < a && b * b  > a * c;
}`:(0,P.H)`bool behindHorizon(vec3 posModel) { return false; }`),G.main.add((0,P.H)`
    ProjectHUDAux projectAux;
    vec4 posProj = projectPositionHUD(projectAux);
    forwardObjectAndLayerIdColor();

    if (rejectBySlice(projectAux.posModel)) {
      // Project outside of clip plane
      gl_Position = vec4(1e038, 1e038, 1e038, 1.0);
      return;
    }

    if (behindHorizon(projectAux.posModel)) {
      // Project outside of clip plane
      gl_Position = vec4(1e038, 1e038, 1e038, 1.0);
      return;
    }

    vec2 inputSize;
    ${(0,P.If)(T,(0,P.H)`
        inputSize = screenSizePerspectiveScaleVec2(size, projectAux.absCosAngle, projectAux.distanceToCamera, screenSizePerspective);
        vec2 screenOffsetScaled = screenSizePerspectiveScaleVec2(screenOffset, projectAux.absCosAngle, projectAux.distanceToCamera, screenSizePerspectiveAlignment);`,(0,P.H)`
        inputSize = size;
        vec2 screenOffsetScaled = screenOffset;`)}
    ${(0,P.If)(E,(0,P.H)`inputSize *= vvScale(featureAttribute).xx;`)}

    vec2 combinedSize = inputSize * pixelRatio;
    vec4 quadOffset = vec4(0.0);

    ${(0,P.If)(r,(0,P.H)`
    bool visible = testHUDVisibility(posProj);
    if (!visible) {
      vtc = vec2(0.0);
      ${(0,P.If)(R,"debugBorderCoords = vec4(0.5, 0.5, 1.5 / combinedSize);")}
      return;
    }`)}
    ${(0,P.If)(Y,(0,P.H)`voccluded = visible ? 0.0 : 1.0;`)}
  `);let Q=(0,P.H)`
      vec2 uv = mix(uvi.xy, uvi.zw, bvec2(uv0));
      vec2 texSize = vec2(textureSize(tex, 0));
      uv = mix(vec2(1.0), uv / texSize, lessThan(uv, vec2(${j})));
      quadOffset.xy = (uv0 - anchorPosition) * 2.0 * combinedSize;

      ${(0,P.If)(U,(0,P.H)`
          float angle = radians(materialRotation + rotation);
          float cosAngle = cos(angle);
          float sinAngle = sin(angle);
          mat2 rotate = mat2(cosAngle, -sinAngle, sinAngle,  cosAngle);

          quadOffset.xy = rotate * quadOffset.xy;
        `)}

      quadOffset.xy = (quadOffset.xy + screenOffsetScaled) / viewport.zw * posProj.w;
  `,J=F?i?(0,P.H)`posProj = alignToPixelOrigin(posProj, viewport.zw) + quadOffset;`:(0,P.H)`posProj += quadOffset;
if (inputSize.x == size.x) {
posProj = alignToPixelOrigin(posProj, viewport.zw);
}`:(0,P.H)`posProj += quadOffset;`;G.main.add((0,P.H)`
    ${Q}
    ${I?"vcolor = interpolateVVColor(featureAttribute.y) * materialColor;":"vcolor = color / 255.0 * materialColor;"}

    ${(0,P.If)(10===N,(0,P.H)`vcolor.a = 1.0;`)}

    bool alphaDiscard = vcolor.a < ${P.H.float(M.Q)};
    ${(0,P.If)(i,`alphaDiscard = alphaDiscard && outlineColor.a < ${P.H.float(M.Q)};`)}
    if (alphaDiscard) {
      // "early discard" if both symbol color (= fill) and outline color (if applicable) are transparent
      gl_Position = vec4(1e38, 1e38, 1e38, 1.0);
      return;
    } else {
      ${J}
      gl_Position = posProj;
    }

    vtc = uv;

    ${(0,P.If)(R,(0,P.H)`debugBorderCoords = vec4(uv01, 1.5 / combinedSize);`)}
    vsize = inputSize;
  `),q.uniforms.add(new C.N("tex",e=>e.texture)),$&&!k&&q.uniforms.add(new z.x("depthMap",e=>e.mainDepth),new S.U("occludedOpacity",e=>e.hudOccludedFragmentOpacity));let Z=R?(0,P.H)`(isBorder > 0.0 ? 0.0 : ${P.H.float(M.Q)})`:P.H.float(M.Q),X=(0,P.H)`
    ${(0,P.If)(R,(0,P.H)`float isBorder = float(any(lessThan(debugBorderCoords.xy, debugBorderCoords.zw)) || any(greaterThan(debugBorderCoords.xy, 1.0 - debugBorderCoords.zw)));`)}

    vec2 samplePos = vtc;

    ${(0,P.If)(W,(0,P.H)`
      float txSize = float(textureSize(tex, 0).x);
      float texelSize = 1.0 / txSize;

      // Calculate how much we have to add/subtract to/from each texel to reach the size of an onscreen pixel
      vec2 scaleFactor = (vsize - txSize) * texelSize;
      samplePos += (vec2(1.0, -1.0) * texelSize) * scaleFactor;`)}

    ${i?(0,P.H)`
      vec4 fillPixelColor = vcolor;

      // Get distance in output units (i.e. pixels)

      float sdf = texture(tex, samplePos).r;
      float pixelDistance = sdf * vsize.x;

      // Create smooth transition from the icon into its outline
      float fillAlphaFactor = clamp(0.5 - pixelDistance, 0.0, 1.0);
      fillPixelColor.a *= fillAlphaFactor;

      if (outlineSize > 0.25) {
        vec4 outlinePixelColor = outlineColor;
        float clampedOutlineSize = min(outlineSize, 0.5*vsize.x);

        // Create smooth transition around outline
        float outlineAlphaFactor = clamp(0.5 - (abs(pixelDistance) - 0.5*clampedOutlineSize), 0.0, 1.0);
        outlinePixelColor.a *= outlineAlphaFactor;

        if (
          outlineAlphaFactor + fillAlphaFactor < ${Z} ||
          fillPixelColor.a + outlinePixelColor.a < ${P.H.float(M.Q)}
        ) {
          discard;
        }

        // perform un-premultiplied over operator (see https://en.wikipedia.org/wiki/Alpha_compositing#Description)
        float compositeAlpha = outlinePixelColor.a + fillPixelColor.a * (1.0 - outlinePixelColor.a);
        vec3 compositeColor = vec3(outlinePixelColor) * outlinePixelColor.a +
          vec3(fillPixelColor) * fillPixelColor.a * (1.0 - outlinePixelColor.a);

        ${(0,P.If)(!k,(0,P.H)`fragColor = vec4(compositeColor, compositeAlpha);`)}
      } else {
        if (fillAlphaFactor < ${Z}) {
          discard;
        }

        ${(0,P.If)(!k,(0,P.H)`fragColor = premultiplyAlpha(fillPixelColor);`)}
      }

      // visualize SDF:
      // fragColor = vec4(clamp(-pixelDistance/vsize.x*2.0, 0.0, 1.0), clamp(pixelDistance/vsize.x*2.0, 0.0, 1.0), 0.0, 1.0);
      `:(0,P.H)`
          vec4 texColor = texture(tex, samplePos, -0.5);
          if (texColor.a < ${Z}) {
            discard;
          }
          ${(0,P.If)(!k,(0,P.H)`fragColor = texColor * premultiplyAlpha(vcolor);`)}
          `}

    ${(0,P.If)($&&!k,(0,P.H)`
        float zSample = texelFetch(depthMap, ivec2(gl_FragCoord.xy), 0).x;
        if (zSample < gl_FragCoord.z) {
          fragColor *= occludedOpacity;
        }
        `)}

    ${(0,P.If)(!k&&R,(0,P.H)`fragColor = mix(fragColor, vec4(1.0, 0.0, 1.0, 1.0), isBorder * 0.5);`)}
  `;switch(N){case 0:case 1:t.outputs.add("fragColor","vec4",0),1===N&&t.outputs.add("fragEmission","vec4",1),1===L&&t.outputs.add("fragAlpha","float",1===N?2:1),q.main.add((0,P.H)`
        ${X}
        ${(0,P.If)(2===L,(0,P.H)`fragColor.rgb /= fragColor.a;`)}
        ${(0,P.If)(1===N,(0,P.H)`fragEmission = vec4(0.0);`)}
        ${(0,P.If)(1===L,(0,P.H)`fragAlpha = fragColor.a;`)}`);break;case 10:q.main.add((0,P.H)`
        ${X}
        outputObjectAndLayerIdColor();`);break;case 9:t.include(d.Q,e),q.main.add((0,P.H)`
        ${X}
        outputHighlight(${(0,P.If)(Y,(0,P.H)`voccluded == 1.0`,(0,P.H)`false`)});`)}return t}function D(e){return e.outlineColor[3]>0&&e.outlineSize>0}function _(e){var t,i,r;return e.textureIsSignedDistanceField?(t=e.anchorPosition,i=e.distanceFieldBoundingBox,r=H,(0,n.hZ)(r,t[0]*(i[2]-i[0])+i[0],t[1]*(i[3]-i[1])+i[1])):(0,n.C)(H,e.anchorPosition),H}let H=(0,r.vt)(),F=32e3,j=P.H.float(F),T=Object.freeze(Object.defineProperty({__proto__:null,build:V,calculateAnchorPosition:_,fullUV:F},Symbol.toStringTag,{value:"Module"}))},64442(e,t,i){i.d(t,{EB:()=>f,Im:()=>function e(t){if(null==t)return!0;switch(t.type){case"complete":return!1;case"collection":for(let i of t.added)if(!e(i))return!1;for(let i of t.removed)if(!e(i))return!1;for(let i of t.changed)if(!e(i))return!1;return!0;case"partial":for(let i in t.diff)if(!e(t.diff[i]))return!1;return!0}},Ui:()=>p});var n=i(2148),r=i(65923),o=i(55135);let a=new Set(["esri.Color","esri.portal.Portal","esri.symbols.support.Symbol3DAnchorPosition2D","esri.symbols.support.Symbol3DAnchorPosition3D"]);function l(e){return e instanceof n.A}function s(e){return e instanceof r.A?Object.keys(e.items):l(e)?(0,o.oY)(e).keys():e?Object.keys(e):[]}function c(e,t){return e instanceof r.A?e.items[t]:e[t]}function u(e){return e?e.declaredClass:null}function f(e,t){if(null==e)return!1;let i=t.split("."),n=e;for(let e of i){if("complete"===n.type)break;if("partial"!==n.type)return!1;{let t=n.diff[e];if(!t)return!1;n=t}}return!0}function p(e,t){if("function"!=typeof e&&"function"!=typeof t&&(null!=e||null!=t))return null==e||null==t||"object"==typeof e&&"object"==typeof t&&u(e)!==u(t)?{type:"complete",oldValue:e,newValue:t}:function e(t,i){let n,r=t.diff;if(r&&"function"==typeof r)return r(t,i);let o=s(t),f=s(i);if(0===o.length&&0===f.length)return;if(!o.length||!f.length||!(!Array.isArray(t)||!Array.isArray(i))&&t.length!==i.length)return{type:"complete",oldValue:t,newValue:i};let p=f.filter(e=>!o.includes(e)),d=o.filter(e=>!f.includes(e)),h=o.filter(e=>f.includes(e)&&c(t,e)!==c(i,e)).concat(p,d).sort(),v=u(t);if(v&&a.has(v)&&h.length)return{type:"complete",oldValue:t,newValue:i};let g=l(t)&&l(i);for(let o of h){let a,l=c(t,o),s=c(i,o);if((g||"function"!=typeof l&&"function"!=typeof s)&&l!==s&&(null!=l||null!=s)){if(r&&r[o]&&"function"==typeof r[o])a=r[o]?.(l,s);else if(l instanceof Date&&s instanceof Date){if(l.getTime()===s.getTime())continue;a={type:"complete",oldValue:l,newValue:s}}else a="object"==typeof l&&"object"==typeof s&&u(l)===u(s)?e(l,s):{type:"complete",oldValue:l,newValue:s};null!=a&&(null!=n?n.diff[o]=a:n={type:"partial",diff:{[o]:a}})}}return n}(e,t)}},81531(e,t,i){function n(){return new Float32Array(3)}function r(e){let t=new Float32Array(3);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t}function o(e,t,i){let n=new Float32Array(3);return n[0]=e,n[1]=t,n[2]=i,n}function a(){return n()}function l(){return o(1,1,1)}function s(){return o(1,0,0)}function c(){return o(0,1,0)}function u(){return o(0,0,1)}i.d(t,{fA:()=>o,o8:()=>r,vt:()=>n});let f=a();Object.freeze(Object.defineProperty({__proto__:null,ONES:l(),UNIT_X:s(),UNIT_Y:c(),UNIT_Z:u(),ZEROS:f,clone:r,create:n,fromValues:o,ones:l,unitX:s,unitY:c,unitZ:u,zeros:a},Symbol.toStringTag,{value:"Module"}))},66316(e,t,i){i.d(t,{fY:()=>o});var n=i(86942),r=i(11449);function o(e,t=!1){return e<=n.y9?t?Array(e).fill(0):Array(e):(0,r.Bg)(e)}},80009(e,t,i){i.d(t,{v:()=>n});function n(e){return"point"===e.type}},26207(e,t,i){i.d(t,{A7:()=>c,Cx:()=>u,Hk:()=>f,JJ:()=>v,SF:()=>p,UK:()=>s,jM:()=>d,x3:()=>h}),i(39831);var n=i(68882),r=i(80609),o=i(23369),a=i(42602),l=i(23173);let s=o.A.fromJSON(l.Cb),c=r.A.fromJSON(l.yM),u=n.A.fromJSON(l.WR),f=a.A.fromJSON(l.JZ);function p(e){if(null==e)return null;switch(e.type){case"mesh":break;case"point":case"multipoint":return s;case"polyline":return c;case"polygon":case"extent":return u}return null}let d=o.A.fromJSON(l.nC),h=r.A.fromJSON(l.HW),v=n.A.fromJSON(l.b6)},23173(e,t,i){i.d(t,{Cb:()=>o,HW:()=>u,JR:()=>r,JZ:()=>s,WR:()=>l,b6:()=>f,fT:()=>n,nC:()=>c,yM:()=>a});let n=[252,146,31,255],r=[153,153,153,255],o={type:"esriSMS",style:"esriSMSCircle",size:6,color:n,outline:{type:"esriSLS",style:"esriSLSSolid",width:.75,color:[153,153,153,255]}},a={type:"esriSLS",style:"esriSLSSolid",width:.75,color:n},l={type:"esriSFS",style:"esriSFSSolid",color:[252,146,31,196],outline:{type:"esriSLS",style:"esriSLSSolid",width:.75,color:[255,255,255,191]}},s={type:"esriTS",color:[255,255,255,255],font:{family:"arial-unicode-ms",size:10,weight:"bold"},horizontalAlignment:"center",kerning:!0,haloColor:[0,0,0,255],haloSize:1,rotated:!1,text:"",xoffset:0,yoffset:0,angle:0},c={type:"esriSMS",style:"esriSMSCircle",color:[0,0,0,255],outline:null,size:10.5},u={type:"esriSLS",style:"esriSLSSolid",color:[0,0,0,255],width:1.5},f={type:"esriSFS",style:"esriSFSSolid",color:[0,0,0,255],outline:null}},54096(e,t,i){i.d(t,{$2:()=>C,$C:()=>S,Hj:()=>P,Mh:()=>z,W$:()=>m,pW:()=>A,t8:()=>w,vY:()=>O});var n=i(92976),r=i(21742),o=i(86128),a=i(58359),l=i(2662),s=i(28152),c=i(1510),u=i(4675),f=i(80510),p=i(23806),d=i(65319),h=i(1114),v=i(29394),g=i(85174);function m(e,t){if("point"===e.type)return b(e,t,!1);if((0,g.gr)(e))switch(e.type){case"extent":return b(e.center,t,!1);case"polygon":return b(x(e),t,!1);case"polyline":return b(y(e),t,!0);case"mesh":return b((0,h.MW)(e.vertexSpace,e.spatialReference)??e.extent.center,t,!1);case"multipoint":return}else switch(e.type){case"extent":var i;return b((i=e,(0,v.TH)(.5*(i.xmax+i.xmin),.5*(i.ymax+i.ymin),null!=i.zmin&&null!=i.zmax&&isFinite(i.zmin)&&isFinite(i.zmax)?.5*(i.zmax+i.zmin):void 0,i.spatialReference)),t,!0);case"polygon":return b(x(e),t,!0);case"polyline":return b(y(e),t,!0);case"multipoint":return}}function y(e){let t=e.paths[0];if(!t||0===t.length)return null;let i=(0,d.$H)(t,(0,d.Yl)(t)/2);return(0,v.TH)(i[0],i[1],i[2],e.spatialReference)}function x(e){let t=e.rings[0];if(!t||0===t.length)return null;let i=(0,p.S8)(e.rings,!!e.hasZ);return(0,v.TH)(i[0],i[1],i[2],e.spatialReference)}function b(e,t,i){let n=i?e:(0,g.EL)(e);return t&&e?(0,c.projectPoint)(e,n,t)?n:null:n}function w(e,t,i,n=0){if(e){t||(t=(0,f.vt)());let r=.5*e.width*(i-1),o=.5*e.height*(i-1);return e.width<1e-7*e.height?r+=o/20:e.height<1e-7*e.width&&(o+=r/20),(0,l.s)(t,e.xmin-r-n,e.ymin-o-n,e.xmax+r+n,e.ymax+o+n),t}return null}function S(e,t,i=null){let n=(0,s.o8)(s.Un);return null!=e&&(n[0]=e[0],n[1]=e[1],n[2]=e[2],e.length>3&&(n[3]=e[3])),null!=t&&(n[3]=t),i&&(0,l.c)(n,n,i),n}function A(e=a.Un,t,i,n=1){let r=[,,,];if(null==t||null==i)r[0]=1,r[1]=1,r[2]=1;else{let n,o=0;for(let a=2;a>=0;a--){let l,s=e[a],c=null!=s,u=0===a&&!n&&!c,f=i[a];"symbol-value"===s||u?l=0!==f?t[a]/f:1:c&&"proportional"!==s&&isFinite(s)&&(l=0!==f?s/f:1),null!=l&&(r[a]=l,n=l,o=Math.max(o,Math.abs(l)))}for(let e=2;e>=0;e--)null==r[e]?r[e]=n:0===r[e]&&(r[e]=.001*o)}for(let e=2;e>=0;e--)r[e]/=n;return(0,a.ci)(r)}function P(e){return z(null!=e.isPrimitive?[e.width,e.depth,e.height]:e)?null:"Symbol sizes may not be negative values"}function z(e){let t=e=>null==e||e>=0;return Array.isArray(e)?e.every(t):t(e)}function C(e,t,i,n=(0,o.vt)()){return e&&(0,r.Qr)(n,n,-e/180*Math.PI),t&&(0,r.eL)(n,n,t/180*Math.PI),i&&(0,r.Z8)(n,n,i/180*Math.PI),n}function O(e,t,i){if(null!=i.minDemResolution)return i.minDemResolution;let r=(0,n.GA)(t),o=(0,u.VL)(e)*r,a=(0,u.yr)(e)*r,l=(0,u.uJ)(e)*(t.isGeographic?1:r);return 0===o&&0===a&&0===l?i.minDemResolutionForPoints:.01*Math.max(o,a,l)}},46684(e,t,i){i.d(t,{Uf:()=>m,te:()=>h,xJ:()=>x,zh:()=>y});var n=i(60704),r=i(59646),o=i(28152),a=i(47936),l=i(12943),s=i(90166),c=i(50961),u=i(66316),f=i(42965),p=i(70807),d=i(74932);function h(e,t,i=null){var r,u,y,x,b,w,S,A,P,z,C,O,M,V,D,_,H,F;let j,T,R,E=[],I=t.mapPositions,U=function(e,t){var i;let n,{attributeData:{position:r},removeDuplicateStartEnd:o}=e,a=(n=(i=r).length,i[0]===i[n-3]&&i[1]===i[n-2]&&i[2]===i[n-1]&&o),l=r.length/3-!!a,s=Array(2*(l-1)),c=a?r.slice(0,-3):r,u=0;for(let e=0;e<l-1;e++)s[u++]=e,s[u++]=e+1;let f=new p.n(c,s,3,a);return t.push(["position",f]),f}(t,E),$=U.data,W=U.indices.length,B=(0,f.EH)(W);return function(e,t,i){if(null!=e.attributeData.colorFeature)return;let n=e.attributeData.color;t.push(["color",new p.n(n??o.Un,i,4)])}(t,E,B),r=t,u=E,y=B,null==r.attributeData.sizeFeature&&u.push(["size",new p.n([r.attributeData.size??1],y,1,!0)]),x=t,b=E,w=B,x.attributeData.normal&&b.push(["normal",new p.n(x.attributeData.normal,w,3)]),S=t,A=E,P=U.indices,z=B,null!=(j=S.attributeData.colorFeature)&&("number"==typeof j?A.push(["colorFeatureAttribute",new p.n([j],z,1,!0)]):A.push(["colorFeatureAttribute",new p.n(j,P,1,!0)])),C=t,O=E,M=U.indices,V=B,null!=(T=C.attributeData.sizeFeature)&&("number"==typeof T?O.push(["sizeFeatureAttribute",new p.n([T],V,1,!0)]):O.push(["sizeFeatureAttribute",new p.n(T,M,1,!0)])),function(e,t){let{attributeData:{position:i,timeStamps:n}}=e;if(!n)return;let r=i.length/3,o=Array(2*(r-1)),a=0;for(let e=0;e<r-1;e++)o[a++]=e,o[a++]=e+1;t.push(["timeStamps",new p.n(n,o,m,!0)])}(t,E),D=t,_=E,H=U.indices,F=B,null!=(R=D.attributeData.opacityFeature)&&("number"==typeof R?_.push(["opacityFeatureAttribute",new p.n([R],F,1,!0)]):_.push(["opacityFeatureAttribute",new p.n(R,H,1,!0)])),function(e,t,i){if(null==e.overlayInfo||1!==e.overlayInfo.renderCoordsHelper.viewingMode||!e.overlayInfo.spatialReference.isGeographic)return;let r=(0,s.jh)(i.length),o=(0,a.tO)(e.overlayInfo.spatialReference);for(let e=0;e<r.length;e+=3)(0,l.RC)(i,e,r,e,o);let u=i.length/3,f=(0,c.oe)(u+1),d=v,h=g,m=0,y=0;(0,n.hZ)(d,r[y++],r[y++]),y++,f[0]=0;for(let e=1;e<u+1;++e)e===u&&(y=0),(0,n.hZ)(h,r[y++],r[y++]),y++,m+=(0,n.xg)(d,h),f[e]=m,[d,h]=[h,d];t.push(["distanceToStart",new p.n(f,t[0][1].indices,1,!0)])}(t,E,$),new d.V(e,E,I,2,i)}let v=(0,r.vt)(),g=(0,r.vt)(),m=4;function y(e,t,i,n,r){if(null==e||0===e.length)return[];let o=[];return e.forEach((e,a)=>{let l=e.length,c=(0,s.jh)(3*l);e.forEach((e,t)=>{c[3*t]=e[0],c[3*t+1]=e[1],c[3*t+2]=e[2]});let u={attributeData:{position:c,normal:t,colorFeature:i?.[a],opacityFeature:n?.[a],sizeFeature:r?.[a]},removeDuplicateStartEnd:!1};o.push(u)}),o}function x(e,t){let i=(0,u.fY)(e.length*m),n=e[0],r=e[e.length-1];for(let o=0;o<e.length;o++)i[o*m]=e[o],i[o*m+1]=n,i[o*m+2]=r,i[o*m+3]=t+.5;return i}},97213(e,t,i){i.d(t,{CN:()=>l,I9:()=>f,PY:()=>s,Q_:()=>a,ny:()=>c,sZ:()=>u}),i(39831);var n=i(28152),r=i(29829),o=i(41746);let a=128,l=.5,s=(0,n.CN)(l/2,l/2,1-l/2,1-l/2);function c(e){return"cross"===e||"x"===e}function u(e,t=a,i=t*l,n=0){let{data:o,parameters:s}=f(e,t,i,n);return new r.g(o,s)}function f(e,t=a,i=t*l,n=0){return{data:function(e,t=a,i=t*l,n=0){var r,o,s,c,u,f;switch(e){case"circle":default:let m;return r=t,o=i,m=r/2-.5,g(r,h(m,m,o/2));case"square":return p(t,i,!1);case"cross":return function(e,t,i=0){return d(e,t,!1,i)}(t,i,n);case"x":return function(e,t,i=0){return d(e,t,!0,i)}(t,i,n);case"kite":return p(t,i,!0);case"triangle":return g(s=t,v(s/2,c=i,c/2));case"arrow":let y,x,b,w,S;return u=t,y=(f=i)/2,x=u/2,b=.8*f,w=h(x,(u-f)/2-b,Math.sqrt(b*b+y*y)),S=v(x,f,y),g(u,(e,t)=>Math.max(S(e,t),-w(e,t)))}}(e,t,i,n),parameters:{mipmap:!1,wrap:{s:33071,t:33071},width:t,height:t,noUnpackFlip:!0,dataType:o.ld.FLOAT,pixelFormat:6403,internalFormat:o.H0.R16F,reloadable:!0}}}function p(e,t,i){return i&&(t/=Math.SQRT2),g(e,(n,r)=>{let o=n-.5*e+.25,a=.5*e-r-.75;if(i){let e=(o+a)/Math.SQRT2;a=(a-o)/Math.SQRT2,o=e}return Math.max(Math.abs(o),Math.abs(a))-.5*t})}function d(e,t,i,n=0){t-=n,i&&(t*=Math.SQRT2);let r=.5*t;return g(e,(t,o)=>{let a=t-.5*e,l=.5*e-o-1;if(i){let e=(a+l)/Math.SQRT2;l=(l-a)/Math.SQRT2,a=e}return((a=Math.abs(a))>(l=Math.abs(l))?a>r?Math.sqrt((a-r)*(a-r)+l*l):l:l>r?Math.sqrt(a*a+(l-r)*(l-r)):a)-n/2})}function h(e,t,i){return(n,r)=>{let o=n-e,a=r-t;return Math.sqrt(o*o+a*a)-i}}function v(e,t,i){let n=Math.sqrt(t*t+i*i);return(r,o)=>{let a=Math.abs(r-e)-i,l=o-e+t/2+.75;return Math.max((t*a+i*l)/n,-l)}}function g(e,t){let i=new Float32Array(e*e);for(let n=0;n<e;n++)for(let r=0;r<e;r++)i[r+e*n]=t(r,n)/e;return i}},16917(e,t,i){i.d(t,{K:()=>o});var n=i(10561),r=i(72196);function o(e){e.uniforms.add(new n.o("alignPixelEnabled",e=>e.alignPixelEnabled)),e.code.add((0,r.H)`vec4 alignToPixelCenter(vec4 clipCoord, vec2 widthHeight) {
if (!alignPixelEnabled)
return clipCoord;
vec2 xy = vec2(0.500123) + 0.5 * clipCoord.xy / clipCoord.w;
vec2 pixelSz = vec2(1.0) / widthHeight;
vec2 ij = (floor(xy * widthHeight) + vec2(0.5)) * pixelSz;
vec2 result = (ij * 2.0 - vec2(1.0)) * clipCoord.w;
return vec4(result, clipCoord.zw);
}`),e.code.add((0,r.H)`vec4 alignToPixelOrigin(vec4 clipCoord, vec2 widthHeight) {
if (!alignPixelEnabled)
return clipCoord;
vec2 xy = vec2(0.5) + 0.5 * clipCoord.xy / clipCoord.w;
vec2 pixelSz = vec2(1.0) / widthHeight;
vec2 ij = floor((xy + 0.5 * pixelSz) * widthHeight) * pixelSz;
vec2 result = (ij * 2.0 - vec2(1.0)) * clipCoord.w;
return vec4(result, clipCoord.zw);
}`)}},97085(e,t,i){i.d(t,{Q:()=>f,R:()=>u});var n=i(54009),r=i(6916),o=i(71788),a=i(45393),l=i(17983),s=i(35449),c=i(72196);let u=.5;function f(e,t){e.include(r.Y6),e.attributes.add("position","vec3"),e.attributes.add("normal","vec3"),e.attributes.add("centerOffsetAndDistance","vec4");let i=e.vertex;(0,o.NB)(i,t),(0,o.yu)(i,t),i.uniforms.add(new a.I("viewport",e=>e.camera.fullViewport),new s.m("polygonOffset",e=>e.shaderPolygonOffset),new l.U("cameraGroundRelative",e=>e.camera.aboveGround?1:-1)),t.hasVerticalOffset&&(0,n.VQ)(i),i.code.add((0,c.H)`struct ProjectHUDAux {
vec3 posModel;
vec3 posView;
vec3 vnormal;
float distanceToCamera;
float absCosAngle;
};`),i.code.add((0,c.H)`
    float applyHUDViewDependentPolygonOffset(float pointGroundDistance, float absCosAngle, inout vec3 posView) {
      float pointGroundSign = ${t.terrainDepthTest?c.H.float(0):(0,c.H)`sign(pointGroundDistance)`};
      if (pointGroundSign == 0.0) {
        pointGroundSign = cameraGroundRelative;
      }

      // cameraGroundRelative is -1 if camera is below ground, 1 if above ground
      // groundRelative is 1 if both camera and symbol are on the same side of the ground, -1 otherwise
      float groundRelative = cameraGroundRelative * pointGroundSign;

      // view angle dependent part of polygon offset emulation: we take the absolute value because the sign that is
      // dropped is instead introduced using the ground-relative position of the symbol and the camera
      if (polygonOffset > .0) {
        float cosAlpha = clamp(absCosAngle, 0.01, 1.0);
        float tanAlpha = sqrt(1.0 - cosAlpha * cosAlpha) / cosAlpha;
        float factor = (1.0 - tanAlpha / viewport[2]);

        // same side of the terrain
        if (groundRelative > 0.0) {
          posView *= factor;
        }
        // opposite sides of the terrain
        else {
          posView /= factor;
        }
      }

      return groundRelative;
    }
  `),t.draped&&!t.hasVerticalOffset||(0,o.S7)(i),t.draped||(i.uniforms.add(new l.U("perDistancePixelRatio",e=>Math.tan(e.camera.fovY/2)/(e.camera.fullViewport[2]/2))),i.code.add((0,c.H)`
    void applyHUDVerticalGroundOffset(vec3 normalModel, inout vec3 posModel, inout vec3 posView) {
      float distanceToCamera = length(posView);

      // Compute offset in world units for a half pixel shift
      float pixelOffset = distanceToCamera * perDistancePixelRatio * ${c.H.float(u)};

      // Apply offset along normal in the direction away from the ground surface
      vec3 modelOffset = normalModel * cameraGroundRelative * pixelOffset;

      // Apply the same offset also on the view space position
      vec3 viewOffset = (viewNormal * vec4(modelOffset, 1.0)).xyz;

      posModel += modelOffset;
      posView += viewOffset;
    }
  `)),t.screenCenterOffsetUnitsEnabled&&(0,o.Nz)(i),t.hasScreenSizePerspective&&(0,r.OH)(i),i.code.add((0,c.H)`
    vec4 projectPositionHUD(out ProjectHUDAux aux) {
      vec3 centerOffset = centerOffsetAndDistance.xyz;
      float pointGroundDistance = centerOffsetAndDistance.w;

      aux.posModel = position;
      aux.posView = (view * vec4(aux.posModel, 1.0)).xyz;
      aux.vnormal = normal;
      ${t.draped?"":"applyHUDVerticalGroundOffset(aux.vnormal, aux.posModel, aux.posView);"}

      // Screen sized offset in world space, used for example for line callouts
      // Note: keep this implementation in sync with the CPU implementation, see
      //   - MaterialUtil.verticalOffsetAtDistance
      //   - HUDMaterial.applyVerticalOffsetTransformation

      aux.distanceToCamera = length(aux.posView);

      vec3 viewDirObjSpace = normalize(cameraPosition - aux.posModel);
      float cosAngle = dot(aux.vnormal, viewDirObjSpace);

      aux.absCosAngle = abs(cosAngle);

      ${t.hasScreenSizePerspective&&(t.hasVerticalOffset||t.screenCenterOffsetUnitsEnabled)?"vec3 perspectiveFactor = screenSizePerspectiveScaleFactor(aux.absCosAngle, aux.distanceToCamera, screenSizePerspectiveAlignment);":""}

      ${t.hasVerticalOffset?t.hasScreenSizePerspective?"float verticalOffsetScreenHeight = applyScreenSizePerspectiveScaleFactorFloat(verticalOffset.x, perspectiveFactor);":"float verticalOffsetScreenHeight = verticalOffset.x;":""}

      ${t.hasVerticalOffset?(0,c.H)`
            float worldOffset = clamp(verticalOffsetScreenHeight * verticalOffset.y * aux.distanceToCamera, verticalOffset.z, verticalOffset.w);
            vec3 modelOffset = aux.vnormal * worldOffset;
            aux.posModel += modelOffset;
            vec3 viewOffset = (viewNormal * vec4(modelOffset, 1.0)).xyz;
            aux.posView += viewOffset;
            // Since we elevate the object, we need to take that into account
            // in the distance to ground
            pointGroundDistance += worldOffset;`:""}

      float groundRelative = applyHUDViewDependentPolygonOffset(pointGroundDistance, aux.absCosAngle, aux.posView);

      ${t.screenCenterOffsetUnitsEnabled?"":(0,c.H)`
            // Apply x/y in view space, but z in screen space (i.e. along posView direction)
            aux.posView += vec3(centerOffset.x, centerOffset.y, 0.0);

            // Same material all have same z != 0.0 condition so should not lead to
            // branch fragmentation and will save a normalization if it's not needed
            if (centerOffset.z != 0.0) {
              aux.posView -= normalize(aux.posView) * centerOffset.z;
            }
          `}

      vec4 posProj = proj * vec4(aux.posView, 1.0);

      ${t.screenCenterOffsetUnitsEnabled?t.hasScreenSizePerspective?"float centerOffsetY = applyScreenSizePerspectiveScaleFactorFloat(centerOffset.y, perspectiveFactor);":"float centerOffsetY = centerOffset.y;":""}

      ${t.screenCenterOffsetUnitsEnabled?"posProj.xy += vec2(centerOffset.x, centerOffsetY) * pixelRatio * 2.0 / viewport.zw * posProj.w;":""}

      // constant part of polygon offset emulation
      posProj.z -= groundRelative * polygonOffset * posProj.w;
      return posProj;
    }
  `)}},36985(e,t,i){i.d(t,{I:()=>a});var n=i(16917),r=i(23233),o=i(72196);function a(e,t){let{vertex:i,fragment:a}=e;e.include(r.Z,t),i.include(n.K),i.main.add((0,o.H)`vec4 posProjCenter;
if (dot(position, position) > 0.0) {
ProjectHUDAux projectAux;
vec4 posProj = projectPositionHUD(projectAux);
posProjCenter = alignToPixelCenter(posProj, viewport.zw);
forwardViewPosDepth(projectAux.posView);
vec3 vpos = projectAux.posModel;
if (rejectBySlice(vpos)) {
posProjCenter = vec4(1e038, 1e038, 1e038, 1.0);
}
} else {
posProjCenter = vec4(1e038, 1e038, 1e038, 1.0);
}
gl_Position = posProjCenter;
gl_PointSize = 1.0;`),a.main.add((0,o.H)`fragColor = vec4(1);
if(discardByTerrainDepth()) {
fragColor.g = 0.5;
}`)}},3097(e,t,i){i.d(t,{y:()=>s});var n=i(16917),r=i(45393),o=i(17983),a=i(72196),l=i(96390);function s(e){e.vertex.uniforms.add(new o.U("renderTransparentlyOccludedHUD",e=>0===e.hudRenderStyle?1:.75*(1!==e.hudRenderStyle)),new r.I("viewport",e=>e.camera.fullViewport),new l.x("hudVisibilityTexture",e=>e.hudVisibility?.getTexture())),e.vertex.include(n.K),e.vertex.code.add((0,a.H)`bool testHUDVisibility(vec4 posProj) {
vec4 posProjCenter = alignToPixelCenter(posProj, viewport.zw);
vec4 occlusionPixel = texture(hudVisibilityTexture, .5 + .5 * posProjCenter.xy / posProjCenter.w);
if (renderTransparentlyOccludedHUD > 0.5) {
return occlusionPixel.r * occlusionPixel.g > 0.0 && occlusionPixel.g * renderTransparentlyOccludedHUD < 1.0;
}
return occlusionPixel.r * occlusionPixel.g > 0.0 && occlusionPixel.g == 1.0;
}`)}},84674(e,t,i){i.d(t,{V:()=>r});var n=i(99120);class r extends n.n{constructor(e,t,i){super(e,"vec4",2,(n,r,o)=>n.setUniform4fv(e,t(r,o),i))}}},70987(e,t,i){i.d(t,{uX:()=>q,Xl:()=>el,Z8:()=>ei,Ho:()=>L,Y6:()=>k,C1:()=>z,nW:()=>K,Nq:()=>et,td:()=>D,Nb:()=>ee,_B:()=>en,DJ:()=>Y,zC:()=>eo,CM:()=>G,xh:()=>er,EE:()=>X,YG:()=>Z,Gj:()=>J});var n=i(24121),r=i(81531),o=i(58359),a=i(90166),l=i(50961),s=i(42965),c=i(38774),u=i(10151),f=i(46684),p=i(70807);function d(e,t){let i=e[t],n=e[t+1],r=e[t+2];return Math.sqrt(i*i+n*n+r*r)}function h(e,t,i){e[t]*=i,e[t+1]*=i,e[t+2]*=i}var v=i(74932),g=i(58947),m=i(1477);let y=null,x=[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]],b=[0,0,1,-1,0,0,1,0,0,0,-1,0,0,1,0,0,0,-1],w=[0,0,1,0,1,1,0,1],S=[0,1,2,2,3,0,4,0,3,3,7,4,1,5,6,6,2,1,1,0,4,4,5,1,3,2,6,6,7,3,5,4,7,7,6,5],A=Array(36);for(let e=0;e<6;e++)for(let t=0;t<6;t++)A[6*e+t]=e;let P=Array(36);for(let e=0;e<6;e++)P[6*e]=0,P[6*e+1]=1,P[6*e+2]=2,P[6*e+3]=2,P[6*e+4]=3,P[6*e+5]=0;function z(e,t){Array.isArray(t)||(t=[t,t,t]);let i=Array(24);for(let e=0;e<8;e++)i[3*e]=x[e][0]*t[0],i[3*e+1]=x[e][1]*t[1],i[3*e+2]=x[e][2]*t[2];return new v.V(e,[["position",new p.n(i,S,3,!0)],["normal",new p.n(b,A,3)],["uv0",new p.n(w,P,2)]])}let C=[[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5],[0,-.5,0],[0,.5,0]],O=[0,1,-1,1,1,0,0,1,1,-1,1,0,0,-1,-1,1,-1,0,0,-1,1,-1,-1,0],M=[5,1,0,5,2,1,5,3,2,5,0,3,4,0,1,4,1,2,4,2,3,4,3,0],V=[0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7];function D(e,t){Array.isArray(t)||(t=[t,t,t]);let i=Array(18);for(let e=0;e<6;e++)i[3*e]=C[e][0]*t[0],i[3*e+1]=C[e][1]*t[1],i[3*e+2]=C[e][2]*t[2];return new v.V(e,[["position",new p.n(i,M,3,!0)],["normal",new p.n(O,V,3)]])}let _=(0,r.fA)(-.5,0,-.5),H=(0,r.fA)(.5,0,-.5),F=(0,r.fA)(0,0,.5),j=(0,r.fA)(0,.5,0),T=(0,r.vt)(),R=(0,r.vt)(),E=(0,r.vt)(),I=(0,r.vt)(),U=(0,r.vt)();(0,n.e)(T,_,j),(0,n.e)(R,_,H),(0,n.i)(E,T,R),(0,n.n)(E,E),(0,n.e)(T,H,j),(0,n.e)(R,H,F),(0,n.i)(I,T,R),(0,n.n)(I,I),(0,n.e)(T,F,j),(0,n.e)(R,F,_),(0,n.i)(U,T,R),(0,n.n)(U,U);let $=[_,H,F,j],W=[0,-1,0,E[0],E[1],E[2],I[0],I[1],I[2],U[0],U[1],U[2]],B=[0,1,2,3,1,0,3,2,1,3,0,2],N=[0,0,0,1,1,1,2,2,2,3,3,3];function L(e,t){Array.isArray(t)||(t=[t,t,t]);let i=Array(12);for(let e=0;e<4;e++)i[3*e]=$[e][0]*t[0],i[3*e+1]=$[e][1]*t[1],i[3*e+2]=$[e][2]*t[2];return new v.V(e,[["position",new p.n(i,B,3,!0)],["normal",new p.n(W,N,3)]])}function G(e,t,i,n,r={uv:!0}){let o=-Math.PI,a=2*Math.PI,c=-Math.PI/2,u=Math.PI,f=Math.max(3,Math.floor(i)),d=Math.max(2,Math.floor(n)),h=(f+1)*(d+1),g=(0,l.oe)(3*h),m=(0,l.oe)(3*h),y=(0,l.oe)(2*h),x=[],b=0;for(let e=0;e<=d;e++){let i=[],n=e/d,r=c+n*u,l=Math.cos(r);for(let e=0;e<=f;e++){let s=e/f,c=o+s*a,u=Math.cos(c)*l,p=Math.sin(r),d=-Math.sin(c)*l;g[3*b]=u*t,g[3*b+1]=p*t,g[3*b+2]=d*t,m[3*b]=u,m[3*b+1]=p,m[3*b+2]=d,y[2*b]=s,y[2*b+1]=n,i.push(b),++b}x.push(i)}let w=[];for(let e=0;e<d;e++)for(let t=0;t<f;t++){let i=x[e][t],n=x[e][t+1],r=x[e+1][t+1],o=x[e+1][t];0===e?(w.push(i),w.push(r),w.push(o)):e===d-1?(w.push(i),w.push(n),w.push(r)):(w.push(i),w.push(n),w.push(r),w.push(r),w.push(o),w.push(i))}let S=[["position",new p.n(g,w,3,!0)],["normal",new p.n(m,w,3,!0)]];return r.uv&&S.push(["uv0",new p.n(y,w,2,!0)]),r.offset&&(S[0][0]="offset",S.push(["position",new p.n(Float64Array.from(r.offset),(0,s.EH)(w.length),3,!0)])),new v.V(e,S)}function q(e,t,i,n){let r=k(t,i,n);return new v.V(e,r)}function k(e,t,i){let n,r;if(i)n=[0,-1,0,1,0,0,0,0,1,-1,0,0,0,0,-1,0,1,0],r=[0,1,2,0,2,3,0,3,4,0,4,1,1,5,2,2,5,3,3,5,4,4,5,1];else{let t=e*(1+Math.sqrt(5))/2;n=[-e,t,0,e,t,0,-e,-t,0,e,-t,0,0,-e,t,0,e,t,0,-e,-t,0,e,-t,t,0,-e,t,0,e,-t,0,-e,-t,0,e],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1]}for(let t=0;t<n.length;t+=3)h(n,t,e/d(n,t));let o={};function a(t,i){t>i&&([t,i]=[i,t]);let r=t.toString()+"."+i.toString();if(o[r])return o[r];let a=n.length;return n.length+=3,function(e,t,i,n,r,o=t){(r=r||e)[o]=e[t]+i[n],r[o+1]=e[t+1]+i[n+1],r[o+2]=e[t+2]+i[n+2]}(n,3*t,n,3*i,n,a),h(n,a,e/d(n,a)),a/=3,o[r]=a,a}for(let e=0;e<t;e++){let e=r.length,t=Array(4*e);for(let i=0;i<e;i+=3){let e=r[i],n=r[i+1],o=r[i+2],l=a(e,n),s=a(n,o),c=a(o,e),u=4*i;t[u]=e,t[u+1]=l,t[u+2]=c,t[u+3]=n,t[u+4]=s,t[u+5]=l,t[u+6]=o,t[u+7]=c,t[u+8]=s,t[u+9]=l,t[u+10]=s,t[u+11]=c}r=t,o={}}let s=(0,l.Wz)(n);for(let e=0;e<s.length;e+=3)!function(e,t){let i=e[t],n=e[t+1],r=e[t+2],o=1/Math.sqrt(i*i+n*n+r*r);e[t]*=o,e[t+1]*=o,e[t+2]*=o}(s,e);return[["position",new p.n((0,l.Wz)(n),r,3,!0)],["normal",new p.n(s,r,3,!0)]]}function Y(e,{normal:t,position:i,color:n,rotation:r,size:a,centerOffsetAndDistance:l,uvi:c,featureAttribute:u,olidColor:f=null}={}){let d,h=i?(0,o.o8)(i):(0,o.vt)(),g=t?(0,o.o8)(t):(0,o.fA)(0,0,1),x=n?[n[0],n[1],n[2],n.length>3?n[3]:255]:[255,255,255,255],b=null!=a&&2===a.length?a:[1,1],w=(0,s.EH)(1),S=[["position",new p.n(h,w,3,!0)],["normal",new p.n(g,w,3,!0)],["color",new p.n(x,w,4,!0)],["size",new p.n(b,w,2)],["rotation",new p.n(null!=r?[r]:[0],w,1,!0)]];if(c&&S.push(["uvi",new p.n(c,w,c.length)]),null!=l){let e=[l[0],l[1],l[2],l[3]];S.push(["centerOffsetAndDistance",new p.n(e,w,4)])}if(u){let e=[u[0],u[1],u[2],u[3]];S.push(["featureAttribute",new p.n(e,w,4)])}return new v.V(e,S,null,1,f,void 0,y??=(d=new p.n([0,0,0,255,255,0,255,255],[0,1,2,3],2,!0),new m.F([["uv0",d]])))}let Q=[[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0]];function J(e,t=Q){let i=Array(12);for(let e=0;e<4;e++)for(let n=0;n<3;n++)i[3*e+n]=t[e][n];let n=[0,1,2,2,3,0],r=[0,0,0,0,0,0],o=[["position",new p.n(i,n,3,!0)],["normal",new p.n([0,0,1],r,3,!0)],["uv0",new p.n([0,0,1,0,1,1,0,1],n,2,!0)],["color",new p.n([255,255,255,255],r,4,!0)]];return new v.V(e,o)}function Z(e,t,i,n,o=!0,a=!0){let s=0,c=(0,r.fA)(0,s,0),u=(0,r.fA)(0,s+e,0),f=(0,r.fA)(0,-1,0),d=(0,r.fA)(0,1,0);n&&(s=e,u=(0,r.fA)(0,0,0),c=(0,r.fA)(0,s,0),f=(0,r.fA)(0,1,0),d=(0,r.fA)(0,-1,0));let h=[u,c],v=[f,d],g=i+2,m=Math.sqrt(e*e+t*t);if(n)for(let n=i-1;n>=0;n--){let o=2*Math.PI/i*n,a=(0,r.fA)(Math.cos(o)*t,s,Math.sin(o)*t);h.push(a);let l=(0,r.fA)(e*Math.cos(o)/m,-t/m,e*Math.sin(o)/m);v.push(l)}else for(let n=0;n<i;n++){let o=2*Math.PI/i*n,a=(0,r.fA)(Math.cos(o)*t,s,Math.sin(o)*t);h.push(a);let l=(0,r.fA)(e*Math.cos(o)/m,t/m,e*Math.sin(o)/m);v.push(l)}let y=[],x=[];if(o){for(let e=3;e<h.length;e++)y.push(1),y.push(e-1),y.push(e),x.push(0),x.push(0),x.push(0);y.push(h.length-1),y.push(2),y.push(1),x.push(0),x.push(0),x.push(0)}if(a){for(let e=3;e<h.length;e++)y.push(e),y.push(e-1),y.push(0),x.push(e),x.push(e-1),x.push(1);y.push(0),y.push(2),y.push(h.length-1),x.push(1),x.push(2),x.push(v.length-1)}let b=(0,l.oe)(3*g);for(let e=0;e<g;e++)b[3*e]=h[e][0],b[3*e+1]=h[e][1],b[3*e+2]=h[e][2];let w=(0,l.oe)(3*g);for(let e=0;e<g;e++)w[3*e]=v[e][0],w[3*e+1]=v[e][1],w[3*e+2]=v[e][2];return[["position",new p.n(b,y,3,!0)],["normal",new p.n(w,x,3,!0)]]}function X(e,t,i,n,r,o=!0,a=!0){return new v.V(e,Z(t,i,n,r,o,a))}function K(e,t,i,o,a,s,c){let u=a?(0,r.o8)(a):(0,r.fA)(1,0,0),f=s?(0,r.o8)(s):(0,r.fA)(0,0,0);c??=!0;let d=(0,r.vt)();(0,n.n)(d,u);let h=(0,r.vt)();(0,n.h)(h,d,Math.abs(t));let g=(0,r.vt)();(0,n.h)(g,h,-.5),(0,n.g)(g,g,f);let m=(0,r.fA)(0,1,0);.2>Math.abs(1-(0,n.f)(d,m))&&(0,n.j)(m,0,0,1);let y=(0,r.vt)();(0,n.i)(y,d,m),(0,n.n)(y,y),(0,n.i)(m,y,d);let x=2*o+2*!!c,b=o+2*!!c,w=(0,l.oe)(3*x),S=(0,l.oe)(3*b),A=(0,l.oe)(2*x),P=Array(3*o*(c?4:2)),z=Array(3*o*(c?4:2));c&&(w[3*(x-2)]=g[0],w[3*(x-2)+1]=g[1],w[3*(x-2)+2]=g[2],A[2*(x-2)]=0,A[2*(x-2)+1]=0,w[3*(x-1)]=w[3*(x-2)]+h[0],w[3*(x-1)+1]=w[3*(x-2)+1]+h[1],w[3*(x-1)+2]=w[3*(x-2)+2]+h[2],A[2*(x-1)]=1,A[2*(x-1)+1]=1,S[3*(b-2)]=-d[0],S[3*(b-2)+1]=-d[1],S[3*(b-2)+2]=-d[2],S[3*(b-1)]=d[0],S[3*(b-1)+1]=d[1],S[3*(b-1)+2]=d[2]);let C=(e,t,i)=>{P[e]=t,z[e]=i},O=0,M=(0,r.vt)(),V=(0,r.vt)();for(let e=0;e<o;e++){let t=2*Math.PI/o*e;(0,n.h)(M,m,Math.sin(t)),(0,n.h)(V,y,Math.cos(t)),(0,n.g)(M,M,V),S[3*e]=M[0],S[3*e+1]=M[1],S[3*e+2]=M[2],(0,n.h)(M,M,i),(0,n.g)(M,M,g),w[3*e]=M[0],w[3*e+1]=M[1],w[3*e+2]=M[2],A[2*e]=e/o,A[2*e+1]=0,w[3*(e+o)]=w[3*e]+h[0],w[3*(e+o)+1]=w[3*e+1]+h[1],w[3*(e+o)+2]=w[3*e+2]+h[2],A[2*(e+o)]=e/o,A[2*e+1]=1;let r=(e+1)%o;C(O++,e,e),C(O++,e+o,e),C(O++,r,r),C(O++,r,r),C(O++,e+o,e),C(O++,r+o,r)}if(c){for(let e=0;e<o;e++){let t=(e+1)%o;C(O++,x-2,b-2),C(O++,e,b-2),C(O++,t,b-2)}for(let e=0;e<o;e++){let t=(e+1)%o;C(O++,e+o,b-1),C(O++,x-1,b-1),C(O++,t+o,b-1)}}let D=[["position",new p.n(w,P,3,!0)],["normal",new p.n(S,z,3,!0)],["uv0",new p.n(A,P,2,!0)]];return new v.V(e,D)}function ee(e,t,i,n,r,o){n=n||10,r=null==r||r,(0,g.vA)(t.length>1);let a=[],l=[];for(let e=0;e<n;e++){a.push([0,-e-1,-(e+1)%n-1]);let t=e/n*2*Math.PI;l.push([Math.cos(t)*i,Math.sin(t)*i])}return et(e,l,t,[[0,0,0]],a,r,o)}function et(e,t,i,a,s,f,d=(0,r.fA)(0,0,0)){let h=t.length,g=(0,l.oe)(i.length*h*3+(6*a.length||0)),m=(0,l.oe)(i.length*h*3+6*!!a),y=[],x=[],b=0,w=0,S=(0,o.vt)(),A=(0,o.vt)(),P=(0,o.vt)(),z=(0,o.vt)(),C=(0,o.vt)(),O=(0,o.vt)(),M=(0,o.vt)(),V=(0,o.vt)(),D=(0,o.vt)(),_=(0,o.vt)(),H=(0,o.vt)(),F=(0,o.vt)(),j=(0,o.vt)(),T=(0,c.vt)();(0,n.j)(D,0,1,0),(0,n.e)(A,i[1],i[0]),(0,n.n)(A,A),f?((0,n.g)(V,i[0],d),(0,n.n)(P,V)):(0,n.j)(P,0,0,1),el(A,P,D,D,C,P,es),(0,n.d)(z,P),(0,n.d)(F,C);for(let e=0;e<a.length;e++)(0,n.h)(O,C,a[e][0]),(0,n.h)(V,P,a[e][2]),(0,n.g)(O,O,V),(0,n.g)(O,O,i[0]),g[b++]=O[0],g[b++]=O[1],g[b++]=O[2];m[w++]=-A[0],m[w++]=-A[1],m[w++]=-A[2];for(let e=0;e<s.length;e++)y.push(s[e][0]>0?s[e][0]:-s[e][0]-1+a.length),y.push(s[e][1]>0?s[e][1]:-s[e][1]-1+a.length),y.push(s[e][2]>0?s[e][2]:-s[e][2]-1+a.length),x.push(0),x.push(0),x.push(0);let R=a.length,E=a.length-1;for(let e=0;e<i.length;e++){let r=!1;e>0&&((0,n.d)(S,A),e<i.length-1?((0,n.e)(A,i[e+1],i[e]),(0,n.n)(A,A)):r=!0,(0,n.g)(_,S,A),(0,n.n)(_,_),(0,n.g)(H,i[e-1],z),(0,c.O_)(i[e],_,T),(0,c.Ui)(T,(0,u.LV)(H,S),V)?((0,n.e)(V,V,i[e]),(0,n.n)(P,V),(0,n.i)(C,_,P),(0,n.n)(C,C)):el(_,z,F,D,C,P,es),(0,n.d)(z,P),(0,n.d)(F,C)),f&&((0,n.g)(V,i[e],d),(0,n.n)(j,V));for(let o=0;o<h;o++)if((0,n.h)(O,C,t[o][0]),(0,n.h)(V,P,t[o][1]),(0,n.g)(O,O,V),(0,n.n)(M,O),m[w++]=M[0],m[w++]=M[1],m[w++]=M[2],(0,n.g)(O,O,i[e]),g[b++]=O[0],g[b++]=O[1],g[b++]=O[2],!r){let e=(o+1)%h;y.push(R+o),y.push(R+h+o),y.push(R+e),y.push(R+e),y.push(R+h+o),y.push(R+h+e);for(let e=0;e<6;e++){let t=y.length-6;x.push(y[t+e]-E)}}R+=h}let I=i[i.length-1];for(let e=0;e<a.length;e++)(0,n.h)(O,C,a[e][0]),(0,n.h)(V,P,a[e][1]),(0,n.g)(O,O,V),(0,n.g)(O,O,I),g[b++]=O[0],g[b++]=O[1],g[b++]=O[2];let U=w/3;m[w++]=A[0],m[w++]=A[1],m[w++]=A[2];let $=R-h;for(let e=0;e<s.length;e++)y.push(s[e][0]>=0?R+s[e][0]:-s[e][0]-1+$),y.push(s[e][2]>=0?R+s[e][2]:-s[e][2]-1+$),y.push(s[e][1]>=0?R+s[e][1]:-s[e][1]-1+$),x.push(U),x.push(U),x.push(U);let W=[["position",new p.n(g,y,3,!0)],["normal",new p.n(m,x,3,!0)]];return new v.V(e,W)}function ei(e,t,i,n,r){let o=(0,a.jh)(3*t.length),c=Array(2*(t.length-1)),u=0,d=0;for(let e=0;e<t.length;e++){for(let i=0;i<3;i++)o[u++]=t[e][i];e>0&&(c[d++]=e-1,c[d++]=e)}let h=[["position",new p.n(o,c,3,!0)]];if(i&&i.length===t.length&&3===i[0].length){let e=(0,l.oe)(3*i.length),n=0;for(let r=0;r<t.length;r++)for(let t=0;t<3;t++)e[n++]=i[r][t];h.push(["normal",new p.n(e,c,3,!0)])}if(n&&h.push(["color",new p.n(n,(0,s.tM)(n.length/4),4)]),r&&r.length===t.length){let e=(0,f.xJ)(r,1);h.push(["timeStamps",new p.n(e,c,f.Uf,!0)])}return new v.V(e,h,null,2)}function en(e,t,i,n,r,o=0){let a=Array(18),l=[[-i,o,r/2],[n,o,r/2],[0,t+o,r/2],[-i,o,-r/2],[n,o,-r/2],[0,t+o,-r/2]];for(let e=0;e<6;e++)a[3*e]=l[e][0],a[3*e+1]=l[e][1],a[3*e+2]=l[e][2];return new v.V(e,[["position",new p.n(a,[0,1,2,3,0,2,2,5,3,1,4,5,5,2,1,1,0,3,3,4,1,4,3,5],3,!0)]])}function er(e,t){let i=e.getMutableAttribute("position").data;for(let e=0;e<i.length;e+=3){let r=i[e],o=i[e+1],a=i[e+2];(0,n.j)(ec,r,o,a),(0,n.t)(ec,ec,t),i[e]=ec[0],i[e+1]=ec[1],i[e+2]=ec[2]}}function eo(e,t=e){let i=e.attributes,n=i.get("position").data,r=i.get("normal").data;if(r){let e=t.getMutableAttribute("normal").data;for(let t=0;t<r.length;t+=3){let i=r[t+1];e[t+1]=-r[t+2],e[t+2]=i}}if(n){let e=t.getMutableAttribute("position").data;for(let t=0;t<n.length;t+=3){let i=n[t+1];e[t+1]=-n[t+2],e[t+2]=i}}}function ea(e,t,i,r,o){return!(Math.abs((0,n.f)(t,e))>o)&&((0,n.i)(i,e,t),(0,n.n)(i,i),(0,n.i)(r,i,e),(0,n.n)(r,r),!0)}function el(e,t,i,n,r,o,a){return ea(e,t,r,o,a)||ea(e,i,r,o,a)||ea(e,n,r,o,a)}let es=.99619469809,ec=(0,o.vt)()},46296(e,t,i){i.d(t,{R:()=>q});var n=i(92504),r=i(25423),o=i(78607),a=i(21742),l=i(86128),s=i(60704),c=i(59646),u=i(24121),f=i(58359),p=i(28152),d=i(80510),h=i(69399),v=i(69463),g=i(19620),m=i(55274),y=i(97085),x=i(89140),b=i(45722),w=i(28953),S=i(58947),A=i(81500),P=i(29117),z=i(69726),C=i(15788),O=i(11110),M=i(47705),V=i(67319),D=i(36340),_=i(1931),H=i(41746),F=i(2449),j=i(76588);class T extends V.w{constructor(e,t){super(e,t,new M.$(z.H,()=>i.e("79671").then(i.bind(i,35466))),(0,j._u)([E,$()].map(C.U))),this.primitiveType=t.occlusionPass?H.WR.POINTS:H.WR.TRIANGLE_STRIP}initializePipeline(e){let{oitPass:t,hasPolygonOffset:i,draped:n,output:r,depthTestEnabled:o,occlusionPass:a}=e,l=o&&!n&&1!==t&&!a&&9!==r;return(0,F.Ey)({blending:(0,m.RN)(r)?(0,_.Yf)(t,!0):null,depthTest:o&&!n?{func:515}:null,depthWrite:l?F.Uy:null,drawBuffers:(0,_.m6)(t,r),colorWrite:F.kn,polygonOffset:i?R:null})}}let R={factor:0,units:-4},E=(0,O.BP)().vec2u8("uv0",{glNormalized:!0}),I=(0,O.BP)().vec3f("position").vec3f("normal").vec4i16("uvi").vec4u8("color").vec2f("size").f32("rotation").vec4f("centerOffsetAndDistance").vec4f("featureAttribute"),U=I.clone().vec4u8("olidColor");function $(){return(0,D.E)()?U:I}var W=i(34629),B=i(46640),N=i(9319);class L extends N.E{constructor(e){super(),this.spherical=e,this.screenCenterOffsetUnitsEnabled=!1,this.occlusionTestEnabled=!0,this.signedDistanceFieldEnabled=!1,this.sampleSignedDistanceFieldTexelCenter=!1,this.hasVVSize=!1,this.hasVVColor=!1,this.hasVerticalOffset=!1,this.hasScreenSizePerspective=!1,this.hasRotation=!1,this.debugDrawLabelBorder=!1,this.hasPolygonOffset=!1,this.depthTestEnabled=!0,this.pixelSnappingEnabled=!0,this.draped=!1,this.terrainDepthTest=!1,this.cullAboveTerrain=!1,this.occlusionPass=!1,this.occludedFragmentFade=!1,this.horizonCullingEnabled=!0,this.isFocused=!0,this.olidColorInstanced=!1,this.textureCoordinateType=0,this.emissionSource=0,this.discardInvisibleFragments=!0,this.hasVVInstancing=!1,this.snowCover=!1}}(0,W.__decorate)([(0,B.W)()],L.prototype,"screenCenterOffsetUnitsEnabled",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"occlusionTestEnabled",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"signedDistanceFieldEnabled",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"sampleSignedDistanceFieldTexelCenter",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"hasVVSize",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"hasVVColor",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"hasVerticalOffset",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"hasScreenSizePerspective",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"hasRotation",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"debugDrawLabelBorder",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"hasPolygonOffset",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"depthTestEnabled",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"pixelSnappingEnabled",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"draped",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"terrainDepthTest",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"cullAboveTerrain",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"occlusionPass",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"occludedFragmentFade",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"horizonCullingEnabled",void 0),(0,W.__decorate)([(0,B.W)()],L.prototype,"isFocused",void 0);var G=i(85580);class q extends b.i{constructor(e,t){super(e,eg),this.produces=new Map([[13,e=>(0,m.Mb)(e)&&!this.parameters.drawAsLabel],[14,e=>(0,m.Mb)(e)&&this.parameters.drawAsLabel],[12,()=>this.parameters.occlusionTest],[18,e=>this.parameters.draped&&(0,m.Mb)(e)]]),this._visible=!0,this._configuration=new L(t)}getConfiguration(e,t){let i=this.parameters.draped;return super.getConfiguration(e,t,this._configuration),this._configuration.hasSlicePlane=this.parameters.hasSlicePlane,this._configuration.hasVerticalOffset=!!this.parameters.verticalOffset,this._configuration.hasScreenSizePerspective=!!this.parameters.screenSizePerspective,this._configuration.screenCenterOffsetUnitsEnabled="screen"===this.parameters.centerOffsetUnits,this._configuration.hasPolygonOffset=this.parameters.polygonOffset,this._configuration.draped=i,this._configuration.occlusionTestEnabled=this.parameters.occlusionTest,this._configuration.pixelSnappingEnabled=this.parameters.pixelSnappingEnabled,this._configuration.signedDistanceFieldEnabled=this.parameters.textureIsSignedDistanceField,this._configuration.sampleSignedDistanceFieldTexelCenter=this.parameters.sampleSignedDistanceFieldTexelCenter,this._configuration.hasRotation=this.parameters.hasRotation,this._configuration.hasVVSize=!!this.parameters.vvSize,this._configuration.hasVVColor=!!this.parameters.vvColor,this._configuration.occlusionPass=12===t.slot,this._configuration.occludedFragmentFade=!i&&this.parameters.occludedFragmentFade,this._configuration.horizonCullingEnabled=this.parameters.horizonCullingEnabled,this._configuration.isFocused=this.parameters.isFocused,this._configuration.depthTestEnabled=this.parameters.depthEnabled||12===t.slot,(0,m.RN)(e)&&(this._configuration.debugDrawLabelBorder=!!g.b.LABELS_SHOW_BORDER),this._configuration.oitPass=t.oitPass,this._configuration.terrainDepthTest=t.terrainDepthTest,this._configuration.cullAboveTerrain=t.cullAboveTerrain,this._configuration}intersect(e,t,i,n,o,l){var s;let c,d,h,v,g,m,y,x,b,w,A,P,{options:{selectionMode:C,hud:O,excludeLabels:M},point:V,camera:D}=i,{parameters:_}=this;if(!C||!O||M&&_.isLabel||!e.visible||!V||!D)return;let H=e.attributes.get("featureAttribute"),{scaleX:F,scaleY:j}=ey(null==H?null:(0,p.ci)(H.data,eu),_,D.pixelRatio);(0,r.z0)(er,t),e.attributes.has("featureAttribute")&&(c=(s=er)[0],d=s[1],h=s[2],v=s[3],g=s[4],m=s[5],y=s[6],x=s[7],b=s[8],w=1/Math.sqrt(c*c+d*d+h*h),A=1/Math.sqrt(v*v+g*g+m*m),P=1/Math.sqrt(y*y+x*x+b*b),s[0]=c*w,s[1]=d*w,s[2]=h*w,s[3]=v*A,s[4]=g*A,s[5]=m*A,s[6]=y*P,s[7]=x*P,s[8]=b*P);let T=e.attributes.get("position"),R=e.attributes.get("size"),E=e.attributes.get("normal"),I=e.attributes.get("rotation"),U=e.attributes.get("centerOffsetAndDistance");(0,S.vA)(T.size>=3);let $=(0,z.c)(_),W="screen"===this.parameters.centerOffsetUnits;for(let e=0;e<T.data.length/T.size;e++){let n=e*T.size;(0,u.j)(Z,T.data[n],T.data[n+1],T.data[n+2]),(0,u.t)(Z,Z,t),(0,u.t)(Z,Z,D.viewMatrix);let r=e*U.size;if((0,u.j)(es,U.data[r],U.data[r+1],U.data[r+2]),!W&&(Z[0]+=es[0],Z[1]+=es[1],0!==es[2])){let e=es[2];(0,u.n)(es,Z),(0,u.e)(Z,Z,(0,u.h)(es,es,e))}let o=e*E.size;if((0,u.j)(X,E.data[o],E.data[o+1],E.data[o+2]),Y(X,er,D,ef),ex(this.parameters,Z,ef,D,J),D.applyProjection(Z,K),K[0]>-1){W&&(es[0]||es[1])&&(K[0]+=es[0]*D.pixelRatio,0!==es[1]&&(K[1]+=J.alignmentEvaluator.apply(es[1])*D.pixelRatio),D.unapplyProjection(K,Z)),K[0]+=this.parameters.screenOffset[0]*D.pixelRatio,K[1]+=this.parameters.screenOffset[1]*D.pixelRatio,K[0]=Math.floor(K[0]),K[1]=Math.floor(K[1]);let t=e*R.size;eh[0]=R.data[t],eh[1]=R.data[t+1],J.evaluator.applyVec2(eh,eh);let n=ep*D.pixelRatio,r=0;_.textureIsSignedDistanceField&&(r=Math.min(_.outlineSize,.5*eh[0])*D.pixelRatio/2),eh[0]*=F,eh[1]*=j;let o=e*I.size,s=_.rotation+I.data[o];if(Q(V,K[0],K[1],eh,n,r,s,_,$)){let e=i.ray;if((0,u.t)(et,Z,(0,a.B8)(ea,D.viewMatrix)),K[0]=V[0],K[1]=V[1],D.unprojectFromRenderScreen(K,Z)){let t=(0,f.vt)();(0,u.d)(t,e.direction);let i=1/(0,u.b)(t);(0,u.h)(t,t,i),l((0,u.k)(e.origin,Z)*i,t,-1,et)}}}}}intersectDraped(e,t,i,n,r){let o=e.attributes.get("position"),a=e.attributes.get("size"),l=e.attributes.get("rotation"),s=this.parameters,c=(0,z.c)(s),u=e.attributes.get("featureAttribute"),{scaleX:f,scaleY:d}=ey(null==u?null:(0,p.ci)(u.data,eu),s,e.screenToWorldRatio),h=ed*e.screenToWorldRatio;for(let t=0;t<o.data.length/o.size;t++){let u=t*o.size,p=o.data[u],v=o.data[u+1],g=t*a.size;eh[0]=a.data[g],eh[1]=a.data[g+1];let m=0;s.textureIsSignedDistanceField&&(m=Math.min(s.outlineSize,.5*eh[0])*e.screenToWorldRatio/2),eh[0]*=f,eh[1]*=d;let y=t*l.size;Q(i,p,v,eh,h,m,s.rotation+l.data[y],s,c)&&n(r.distance,r.normal,-1)}}createBufferWriter(){return new em}applyShaderOffsetsView(e,t,i,n,r,o,a){let l=Y(t,i,r,ef);return this._applyVerticalGroundOffsetView(e,l,r,a),ex(this.parameters,a,l,r,o),this._applyPolygonOffsetView(a,l,n[3],r,a),this._applyCenterOffsetView(a,n,a),a}applyShaderOffsetsNDC(e,t,i,n,r){return this._applyCenterOffsetNDC(e,t,i,n),null!=r&&(0,u.d)(r,n),this._applyPolygonOffsetNDC(n,t,i,n),n}_applyPolygonOffsetView(e,t,i,r,o){let a=r.aboveGround?1:-1,l=Math.sign(i);0===l&&(l=a);let s=a*l;if(this.parameters.shaderPolygonOffset<=0)return(0,u.d)(o,e);let c=(0,n.qE)(Math.abs(t.cosAngle),.01,1),f=1-Math.sqrt(1-c*c)/c/r.viewport[2];return(0,u.h)(o,e,s>0?f:1/f),o}_applyVerticalGroundOffsetView(e,t,i,n){let r=(0,u.b)(e),o=i.aboveGround?1:-1,a=i.computeRenderPixelSizeAtDist(r)*y.R,l=(0,u.h)(Z,t.normal,o*a);return(0,u.g)(n,e,l),n}_applyCenterOffsetView(e,t,i){let n="screen"!==this.parameters.centerOffsetUnits;return i!==e&&(0,u.d)(i,e),n&&(i[0]+=t[0],i[1]+=t[1],t[2]&&((0,u.n)(X,i),(0,u.a)(i,i,(0,u.h)(X,X,t[2])))),i}_applyCenterOffsetNDC(e,t,i,n){let r="screen"!==this.parameters.centerOffsetUnits;return n!==e&&(0,u.d)(n,e),r||(n[0]+=t[0]/i.fullWidth*2,n[1]+=t[1]/i.fullHeight*2),n}_applyPolygonOffsetNDC(e,t,i,n){let r=this.parameters.shaderPolygonOffset;if(e!==n&&(0,u.d)(n,e),r){let e=i.aboveGround?1:-1,o=e*Math.sign(t[3]);n[2]-=(o||e)*r}return n}set visible(e){this._visible=e}get visible(){let{color:e,outlineSize:t,outlineColor:i}=this.parameters,n=e[3]>=G.Q||t>=G.Q&&i[3]>=G.Q;return this._visible&&n}createGLMaterial(e){return new k(e)}calculateRelativeScreenBounds(e,t,i=(0,d.vt)()){var n,r,o,a;return n=this.parameters,r=e,o=t,(a=i)[0]=-(n.anchorPosition[0]*r[0])+n.screenOffset[0]*o,a[1]=-(n.anchorPosition[1]*r[1])+n.screenOffset[1]*o,i[2]=i[0]+e[0],i[3]=i[1]+e[1],i}}class k extends x.m8{constructor(e){super({...e,...e.material.parameters})}beginSlot(e){return this.updateTexture(this._material.parameters.textureId),this._material.setParameters(this.textureBindParameters),this.getTechnique(T,e)}}function Y(e,t,i,n){var o,a;return((a=o=t)instanceof Float32Array&&a.length>=16||Array.isArray(o)&&o.length>=16)&&(t=(0,r.z0)(eo,t)),(0,u.o)(n.normal,e,t),(0,u.t)(n.normal,n.normal,i.viewInverseTransposeMatrix),n.cosAngle=(0,u.f)(ee,ev),n}function Q(e,t,i,r,o,a,l,c,u){let f=t-o-r[0]*u[0],p=f+r[0]+2*o,d=i-o-r[1]*u[1],h=d+r[1]+2*o,v=c.distanceFieldBoundingBox;return c.textureIsSignedDistanceField&&null!=v&&(f+=r[0]*v[0],d+=r[1]*v[1],p-=r[0]*(1-v[2]),h-=r[1]*(1-v[3]),f-=a,p+=a,d-=a,h+=a),(0,s.hZ)(en,t,i),(0,s.e$)(ei,e,en,(0,n.kU)(l)),ei[0]>f&&ei[0]<p&&ei[1]>d&&ei[1]<h}let J=new w.fc,Z=(0,f.vt)(),X=(0,f.vt)(),K=(0,p.vt)(),ee=(0,f.vt)(),et=(0,f.vt)(),ei=(0,c.vt)(),en=(0,c.vt)(),er=(0,o.vt)(),eo=(0,o.vt)(),ea=(0,l.vt)(),el=(0,p.vt)(),es=(0,f.vt)(),ec=(0,f.vt)(),eu=(0,p.vt)(),ef={normal:ee,cosAngle:0},ep=1,ed=2,eh=(0,c.fA)(0,0),ev=(0,f.fA)(0,0,1);class eg extends x.NV{constructor(){super(...arguments),this.renderOccluded=1,this.isDecoration=!1,this.color=(0,p.CN)(1,1,1,1),this.polygonOffset=!1,this.anchorPosition=(0,c.fA)(.5,.5),this.screenOffset=[0,0],this.shaderPolygonOffset=1e-5,this.textureIsSignedDistanceField=!1,this.sampleSignedDistanceFieldTexelCenter=!1,this.outlineColor=(0,p.CN)(1,1,1,1),this.outlineSize=0,this.distanceFieldBoundingBox=(0,p.vt)(),this.rotation=0,this.hasRotation=!1,this.vvSizeEnabled=!1,this.vvSize=null,this.vvColor=null,this.vvOpacity=null,this.vvSymbolAnchor=null,this.vvSymbolRotationMatrix=null,this.hasSlicePlane=!1,this.pixelSnappingEnabled=!0,this.occlusionTest=!0,this.occludedFragmentFade=!1,this.horizonCullingEnabled=!1,this.centerOffsetUnits="world",this.drawAsLabel=!1,this.depthEnabled=!0,this.isFocused=!0,this.focusStyle="bright",this.draped=!1,this.isLabel=!1}get hasVVSize(){return!!this.vvSize}get hasVVColor(){return!!this.vvColor}get hasVVOpacity(){return!!this.vvOpacity}}class em{constructor(){this.layout=E,this.instanceLayout=$()}elementCount(e){return e.get("position").indices.length}elementCountBaseInstance(e){return e.get("uv0").indices.length}write(e,t,i,n,r,o){let{position:a,normal:l,color:s,size:c,rotation:u,centerOffsetAndDistance:f,featureAttribute:p,uvi:d}=r;(0,A.Hk)(i.get("position"),e,a,o),(0,A.p1)(i.get("normal"),t,l,o);let v=i.get("position").indices.length,g=0,m=0,y=z.f,x=z.f,b=i.get("uvi")?.data;b&&b.length>=4&&(g=b[0],m=b[1],y=b[2],x=b[3]);for(let e=0;e<v;++e){let t=o+e;d.setValues(t,g,m,y,x)}if((0,A.tb)(i.get("color"),4,s,o),(0,A.Ue)(i.get("size"),c,o),(0,A.uO)(i.get("rotation"),u,o),i.get("centerOffsetAndDistance")?(0,A.Ut)(i.get("centerOffsetAndDistance"),f,o):(0,A.Pq)(f,o,v),i.get("featureAttribute")?(0,A.Ut)(i.get("featureAttribute"),p,o):(0,A.Pq)(p,o,v),null!=n){let e=i.get("position")?.indices;if(e){let t=e.length,i=r.getField("olidColor",h.XP);(0,A.vx)(n,i,t,o)}}return{numVerticesPerItem:1,numItems:v}}writeBaseInstance(e,t){let{uv0:i}=t;(0,A.Ue)(e.get("uv0"),i,0)}intersect(e,t,i,n,r,o,l){let{options:{selectionMode:s,hud:c,excludeLabels:p},point:d,camera:h}=n;if(!s||!c||p&&t.isLabel||!d)return;let{position:v,normal:g,rotation:m,size:y,featureAttribute:x,centerOffsetAndDistance:b}=this.instanceLayout.createView(e),w="screen"===t.centerOffsetUnits,S=(0,z.c)(t);if(null==v||null==g||null==m||null==y||null==b||null==h)return;let{scaleX:A,scaleY:P}=ey(null==x?null:x.getVec(0,eu),t,h.pixelRatio),C=v.count;for(let e=0;e<C;e++){if(v.getVec(e,Z),null!=i&&(0,u.g)(Z,Z,i),(0,u.t)(Z,Z,h.viewMatrix),b.getVec(e,el),(0,u.j)(es,el[0],el[1],el[2]),!w&&(Z[0]+=es[0],Z[1]+=es[1],0!==es[2])){let e=es[2];(0,u.n)(es,Z),(0,u.e)(Z,Z,(0,u.h)(es,es,e))}if(g.getVec(e,X),Y(X,er,h,ef),ex(t,Z,ef,h,J),h.applyProjection(Z,K),K[0]>-1){w&&(es[0]||es[1])&&(K[0]+=es[0]*h.pixelRatio,0!==es[1]&&(K[1]+=J.alignmentEvaluator.apply(es[1])*h.pixelRatio),h.unapplyProjection(K,Z)),K[0]+=t.screenOffset[0]*h.pixelRatio,K[1]+=t.screenOffset[1]*h.pixelRatio,K[0]=Math.floor(K[0]),K[1]=Math.floor(K[1]),y.getVec(e,eh),J.evaluator.applyVec2(eh,eh);let i=ep*h.pixelRatio,r=0;t.textureIsSignedDistanceField&&(r=Math.min(t.outlineSize,.5*eh[0])*h.pixelRatio/2),eh[0]*=A,eh[1]*=P;let o=m.get(e),s=t.rotation+o;if(Q(d,K[0],K[1],eh,i,r,s,t,S)){let t=n.ray;if((0,u.t)(et,Z,(0,a.B8)(ea,h.viewMatrix)),K[0]=d[0],K[1]=d[1],h.unprojectFromRenderScreen(K,Z)){let i=(0,f.vt)();(0,u.d)(i,t.direction);let n=1/(0,u.b)(i);(0,u.h)(i,i,n),l((0,u.k)(t.origin,Z)*n,i,e,et)}}}}}}function ey(e,t,i){return null==e||null==t.vvSize?{scaleX:i,scaleY:i}:((0,v.VC)(ec,t,e),{scaleX:ec[0]*i,scaleY:ec[1]*i})}function ex(e,t,i,n,r){if(!e.verticalOffset?.screenLength){let n=(0,u.b)(t);return r.update(i.cosAngle,n,e.screenSizePerspective,e.screenSizePerspectiveMinPixelReferenceSize,e.screenSizePerspectiveAlignment,null),t}let o=(0,u.b)(t),a=e.screenSizePerspectiveAlignment??e.screenSizePerspective,l=(0,P.kE)(n,o,e.verticalOffset,i.cosAngle,a,e.screenSizePerspectiveMinPixelReferenceSize);return r.update(i.cosAngle,o,e.screenSizePerspective,e.screenSizePerspectiveMinPixelReferenceSize,e.screenSizePerspectiveAlignment,null),(0,u.h)(i.normal,i.normal,l),(0,u.g)(t,t,i.normal)}}}]);