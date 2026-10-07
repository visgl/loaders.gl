(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["63518"],{41481(t){let e,i,r,n,s,a,o,l,u;var c,h,f,d,p,g,m,_,b,v,y,E=Object.defineProperty,M=Object.getOwnPropertyDescriptor,w=Object.getOwnPropertyNames,x=Object.prototype.hasOwnProperty,P=(t,e)=>{for(var i in e)E(t,i,{get:e[i],enumerable:!0})},A={};P(A,{Euler:()=>nT,Matrix3:()=>ip,Matrix4:()=>rZ,Pose:()=>nI,Quaternion:()=>nA,SphericalCoordinates:()=>nS,Vector2:()=>tK,Vector3:()=>eU,Vector4:()=>eF,_Euler:()=>nT,_MathUtils:()=>nL,_Pose:()=>nI,_SphericalCoordinates:()=>nS,acos:()=>V,asin:()=>D,assert:()=>K,atan:()=>$,clamp:()=>Y,clone:()=>C,config:()=>T,configure:()=>I,cos:()=>U,degrees:()=>z,equals:()=>q,exactEquals:()=>function t(e,i){if(e===i)return!0;if(e&&"object"==typeof e&&i&&"object"==typeof i){if(e.constructor!==i.constructor)return!1;if(e.exactEquals)return e.exactEquals(i)}if(B(e)&&B(i)){if(e.length!==i.length)return!1;for(let r=0;r<e.length;++r)if(!t(e[r],i[r]))return!1;return!0}return!1},formatValue:()=>L,isArray:()=>B,lerp:()=>function t(e,i,r){return B(e)?e.map((e,n)=>t(e,i[n],r)):r*i+(1-r)*e},mat3:()=>eV,mat4:()=>im,quat:()=>rK,radians:()=>k,sin:()=>j,tan:()=>F,toDegrees:()=>N,toRadians:()=>R,vec2:()=>Q,vec3:()=>tJ,vec4:()=>rs,withEpsilon:()=>G}),t.exports=((t,e,i,r)=>{if(e&&"object"==typeof e||"function"==typeof e)for(let n of w(e))x.call(t,n)||n===i||E(t,n,{get:()=>e[n],enumerable:!(r=M(e,n))||r.enumerable});return t})(E({},"__esModule",{value:!0}),A);var S=1/Math.PI*180,O=1/180*Math.PI;globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}};var T=globalThis.mathgl.config;function I(t){return Object.assign(T,t),T}function L(t,{precision:e=T.precision}={}){return t=Math.round(t/T.EPSILON)*T.EPSILON,`${parseFloat(t.toPrecision(e))}`}function B(t){return Array.isArray(t)||ArrayBuffer.isView(t)&&!(t instanceof DataView)}function C(t){return"clone"in t?t.clone():t.slice()}function R(t){return k(t)}function N(t){return z(t)}function k(t,e){return W(t,t=>t*O,e)}function z(t,e){return W(t,t=>t*S,e)}function j(t,e){return W(t,t=>Math.sin(t),e)}function U(t,e){return W(t,t=>Math.cos(t),e)}function F(t,e){return W(t,t=>Math.tan(t),e)}function D(t,e){return W(t,t=>Math.asin(t),e)}function V(t,e){return W(t,t=>Math.acos(t),e)}function $(t,e){return W(t,t=>Math.atan(t),e)}function Y(t,e,i){return W(t,t=>Math.max(e,Math.min(i,t)))}function q(t,e,i){let r=T.EPSILON;i&&(T.EPSILON=i);try{if(t===e)return!0;if(B(t)&&B(e)){if(t.length!==e.length)return!1;for(let i=0;i<t.length;++i)if(!q(t[i],e[i]))return!1;return!0}if(t&&t.equals)return t.equals(e);if(e&&e.equals)return e.equals(t);if("number"==typeof t&&"number"==typeof e)return Math.abs(t-e)<=T.EPSILON*Math.max(1,Math.abs(t),Math.abs(e));return!1}finally{T.EPSILON=r}}function G(t,e){let i,r=T.EPSILON;T.EPSILON=t;try{i=e()}finally{T.EPSILON=r}return i}function W(t,e,i){if(B(t)){i=i||(t.clone?t.clone():Array(t.length));for(let r=0;r<i.length&&r<t.length;++r){let n="number"==typeof t?t:t[r];i[r]=e(n,r,i)}return i}return e(t)}var X=class extends Array{clone(){return new this.constructor().copy(this)}fromArray(t,e=0){for(let i=0;i<this.ELEMENTS;++i)this[i]=t[i+e];return this.check()}toArray(t=[],e=0){for(let i=0;i<this.ELEMENTS;++i)t[e+i]=this[i];return t}toObject(t){return t}from(t){return Array.isArray(t)?this.copy(t):this.fromObject(t)}to(t){return t===this?this:B(t)?this.toArray(t):this.toObject(t)}toTarget(t){return t?this.to(t):this}toFloat32Array(){return new Float32Array(this)}toString(){return this.formatString(T)}formatString(t){let e="";for(let i=0;i<this.ELEMENTS;++i)e+=(i>0?", ":"")+L(this[i],t);return`${t.printTypes?this.constructor.name:""}[${e}]`}equals(t){if(!t||this.length!==t.length)return!1;for(let e=0;e<this.ELEMENTS;++e)if(!q(this[e],t[e]))return!1;return!0}exactEquals(t){if(!t||this.length!==t.length)return!1;for(let e=0;e<this.ELEMENTS;++e)if(this[e]!==t[e])return!1;return!0}negate(){for(let t=0;t<this.ELEMENTS;++t)this[t]=-this[t];return this.check()}lerp(t,e,i){if(void 0===i)return this.lerp(this,t,e);for(let r=0;r<this.ELEMENTS;++r){let n=t[r],s="number"==typeof e?e:e[r];this[r]=n+i*(s-n)}return this.check()}min(t){for(let e=0;e<this.ELEMENTS;++e)this[e]=Math.min(t[e],this[e]);return this.check()}max(t){for(let e=0;e<this.ELEMENTS;++e)this[e]=Math.max(t[e],this[e]);return this.check()}clamp(t,e){for(let i=0;i<this.ELEMENTS;++i)this[i]=Math.min(Math.max(this[i],t[i]),e[i]);return this.check()}add(...t){for(let e of t)for(let t=0;t<this.ELEMENTS;++t)this[t]+=e[t];return this.check()}subtract(...t){for(let e of t)for(let t=0;t<this.ELEMENTS;++t)this[t]-=e[t];return this.check()}scale(t){if("number"==typeof t)for(let e=0;e<this.ELEMENTS;++e)this[e]*=t;else for(let e=0;e<this.ELEMENTS&&e<t.length;++e)this[e]*=t[e];return this.check()}multiplyByScalar(t){for(let e=0;e<this.ELEMENTS;++e)this[e]*=t;return this.check()}check(){if(T.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let t=this.length===this.ELEMENTS;for(let e=0;e<this.ELEMENTS;++e)t=t&&Number.isFinite(this[e]);return t}sub(t){return this.subtract(t)}setScalar(t){for(let e=0;e<this.ELEMENTS;++e)this[e]=t;return this.check()}addScalar(t){for(let e=0;e<this.ELEMENTS;++e)this[e]+=t;return this.check()}subScalar(t){return this.addScalar(-t)}multiplyScalar(t){for(let e=0;e<this.ELEMENTS;++e)this[e]*=t;return this.check()}divideScalar(t){return this.multiplyByScalar(1/t)}clampScalar(t,e){for(let i=0;i<this.ELEMENTS;++i)this[i]=Math.min(Math.max(this[i],t),e);return this.check()}get elements(){return this}};function Z(t){if(!Number.isFinite(t))throw Error(`Invalid number ${JSON.stringify(t)}`);return t}function H(t,e,i=""){if(T.debug&&!function(t,e){if(t.length!==e)return!1;for(let e=0;e<t.length;++e)if(!Number.isFinite(t[e]))return!1;return!0}(t,e))throw Error(`math.gl: ${i} some fields set to invalid numbers'`);return t}function K(t,e){if(!t)throw Error(`math.gl assertion ${e}`)}var J=class extends X{get x(){return this[0]}set x(t){this[0]=Z(t)}get y(){return this[1]}set y(t){this[1]=Z(t)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let t=0;for(let e=0;e<this.ELEMENTS;++e)t+=this[e]*this[e];return t}magnitudeSquared(){return this.lengthSquared()}distance(t){return Math.sqrt(this.distanceSquared(t))}distanceSquared(t){let e=0;for(let i=0;i<this.ELEMENTS;++i){let r=this[i]-t[i];e+=r*r}return Z(e)}dot(t){let e=0;for(let i=0;i<this.ELEMENTS;++i)e+=this[i]*t[i];return Z(e)}normalize(){let t=this.magnitude();if(0!==t)for(let e=0;e<this.ELEMENTS;++e)this[e]/=t;return this.check()}multiply(...t){for(let e of t)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e[t];return this.check()}divide(...t){for(let e of t)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e[t];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(t){return this.distance(t)}distanceToSquared(t){return this.distanceSquared(t)}getComponent(t){return K(t>=0&&t<this.ELEMENTS,"index is out of range"),Z(this[t])}setComponent(t,e){return K(t>=0&&t<this.ELEMENTS,"index is out of range"),this[t]=e,this.check()}addVectors(t,e){return this.copy(t).add(e)}subVectors(t,e){return this.copy(t).subtract(e)}multiplyVectors(t,e){return this.copy(t).multiply(e)}addScaledVector(t,e){return this.add(new this.constructor(t).multiplyScalar(e))}},Q={};P(Q,{add:()=>tl,angle:()=>tN,ceil:()=>tf,clone:()=>tn,copy:()=>ta,create:()=>tr,cross:()=>tS,dist:()=>tY,distance:()=>tv,div:()=>t$,divide:()=>th,dot:()=>tA,equals:()=>tU,exactEquals:()=>tj,floor:()=>td,forEach:()=>tW,fromValues:()=>ts,inverse:()=>tx,len:()=>tF,length:()=>tE,lerp:()=>tO,max:()=>tg,min:()=>tp,mul:()=>tV,multiply:()=>tc,negate:()=>tw,normalize:()=>tP,random:()=>tT,rotate:()=>tR,round:()=>tm,scale:()=>t_,scaleAndAdd:()=>tb,set:()=>to,sqrDist:()=>tq,sqrLen:()=>tG,squaredDistance:()=>ty,squaredLength:()=>tM,str:()=>tz,sub:()=>tD,subtract:()=>tu,transformMat2:()=>tI,transformMat2d:()=>tL,transformMat3:()=>tB,transformMat4:()=>tC,zero:()=>tk});var tt="u">typeof Float32Array?Float32Array:Array,te=Math.random;function ti(t){return t>=0?Math.round(t):t%.5==0?Math.floor(t):Math.round(t)}function tr(){let t=new tt(2);return tt!=Float32Array&&(t[0]=0,t[1]=0),t}function tn(t){let e=new tt(2);return e[0]=t[0],e[1]=t[1],e}function ts(t,e){let i=new tt(2);return i[0]=t,i[1]=e,i}function ta(t,e){return t[0]=e[0],t[1]=e[1],t}function to(t,e,i){return t[0]=e,t[1]=i,t}function tl(t,e,i){return t[0]=e[0]+i[0],t[1]=e[1]+i[1],t}function tu(t,e,i){return t[0]=e[0]-i[0],t[1]=e[1]-i[1],t}function tc(t,e,i){return t[0]=e[0]*i[0],t[1]=e[1]*i[1],t}function th(t,e,i){return t[0]=e[0]/i[0],t[1]=e[1]/i[1],t}function tf(t,e){return t[0]=Math.ceil(e[0]),t[1]=Math.ceil(e[1]),t}function td(t,e){return t[0]=Math.floor(e[0]),t[1]=Math.floor(e[1]),t}function tp(t,e,i){return t[0]=Math.min(e[0],i[0]),t[1]=Math.min(e[1],i[1]),t}function tg(t,e,i){return t[0]=Math.max(e[0],i[0]),t[1]=Math.max(e[1],i[1]),t}function tm(t,e){return t[0]=ti(e[0]),t[1]=ti(e[1]),t}function t_(t,e,i){return t[0]=e[0]*i,t[1]=e[1]*i,t}function tb(t,e,i,r){return t[0]=e[0]+i[0]*r,t[1]=e[1]+i[1]*r,t}function tv(t,e){let i=e[0]-t[0],r=e[1]-t[1];return Math.sqrt(i*i+r*r)}function ty(t,e){let i=e[0]-t[0],r=e[1]-t[1];return i*i+r*r}function tE(t){let e=t[0],i=t[1];return Math.sqrt(e*e+i*i)}function tM(t){let e=t[0],i=t[1];return e*e+i*i}function tw(t,e){return t[0]=-e[0],t[1]=-e[1],t}function tx(t,e){return t[0]=1/e[0],t[1]=1/e[1],t}function tP(t,e){let i=e[0],r=e[1],n=i*i+r*r;return n>0&&(n=1/Math.sqrt(n)),t[0]=e[0]*n,t[1]=e[1]*n,t}function tA(t,e){return t[0]*e[0]+t[1]*e[1]}function tS(t,e,i){let r=e[0]*i[1]-e[1]*i[0];return t[0]=t[1]=0,t[2]=r,t}function tO(t,e,i,r){let n=e[0],s=e[1];return t[0]=n+r*(i[0]-n),t[1]=s+r*(i[1]-s),t}function tT(t,e){e=void 0===e?1:e;let i=2*te()*Math.PI;return t[0]=Math.cos(i)*e,t[1]=Math.sin(i)*e,t}function tI(t,e,i){let r=e[0],n=e[1];return t[0]=i[0]*r+i[2]*n,t[1]=i[1]*r+i[3]*n,t}function tL(t,e,i){let r=e[0],n=e[1];return t[0]=i[0]*r+i[2]*n+i[4],t[1]=i[1]*r+i[3]*n+i[5],t}function tB(t,e,i){let r=e[0],n=e[1];return t[0]=i[0]*r+i[3]*n+i[6],t[1]=i[1]*r+i[4]*n+i[7],t}function tC(t,e,i){let r=e[0],n=e[1];return t[0]=i[0]*r+i[4]*n+i[12],t[1]=i[1]*r+i[5]*n+i[13],t}function tR(t,e,i,r){let n=e[0]-i[0],s=e[1]-i[1],a=Math.sin(r),o=Math.cos(r);return t[0]=n*o-s*a+i[0],t[1]=n*a+s*o+i[1],t}function tN(t,e){let i=t[0],r=t[1],n=e[0],s=e[1],a=Math.sqrt((i*i+r*r)*(n*n+s*s));return Math.acos(Math.min(Math.max(a&&(i*n+r*s)/a,-1),1))}function tk(t){return t[0]=0,t[1]=0,t}function tz(t){return`vec2(${t[0]}, ${t[1]})`}function tj(t,e){return t[0]===e[0]&&t[1]===e[1]}function tU(t,e){let i=t[0],r=t[1],n=e[0],s=e[1];return Math.abs(i-n)<=1e-6*Math.max(1,Math.abs(i),Math.abs(n))&&Math.abs(r-s)<=1e-6*Math.max(1,Math.abs(r),Math.abs(s))}var tF=tE,tD=tu,tV=tc,t$=th,tY=tv,tq=ty,tG=tM,tW=(e=tr(),function(t,i,r,n,s,a){let o,l;for(i||(i=2),r||(r=0),l=n?Math.min(n*i+r,t.length):t.length,o=r;o<l;o+=i)e[0]=t[o],e[1]=t[o+1],s(e,e,a),t[o]=e[0],t[o+1]=e[1];return t});function tX(t,e,i){let r=e[0],n=e[1],s=i[3]*r+i[7]*n||1;return t[0]=(i[0]*r+i[4]*n)/s,t[1]=(i[1]*r+i[5]*n)/s,t}function tZ(t,e,i){let r=e[0],n=e[1],s=e[2],a=i[3]*r+i[7]*n+i[11]*s||1;return t[0]=(i[0]*r+i[4]*n+i[8]*s)/a,t[1]=(i[1]*r+i[5]*n+i[9]*s)/a,t[2]=(i[2]*r+i[6]*n+i[10]*s)/a,t}function tH(t,e,i){let r=e[0],n=e[1],s=e[2];return t[0]=i[0]*r+i[3]*n+i[6]*s,t[1]=i[1]*r+i[4]*n+i[7]*s,t[2]=i[2]*r+i[5]*n+i[8]*s,t[3]=e[3],t}var tK=class extends J{constructor(t=0,e=0){super(2),B(t)&&1==arguments.length?this.copy(t):(T.debug&&(Z(t),Z(e)),this[0]=t,this[1]=e)}set(t,e){return this[0]=t,this[1]=e,this.check()}copy(t){return this[0]=t[0],this[1]=t[1],this.check()}fromObject(t){return T.debug&&(Z(t.x),Z(t.y)),this[0]=t.x,this[1]=t.y,this.check()}toObject(t){return t.x=this[0],t.y=this[1],t}get ELEMENTS(){return 2}horizontalAngle(){return Math.atan2(this.y,this.x)}verticalAngle(){return Math.atan2(this.x,this.y)}transform(t){return this.transformAsPoint(t)}transformAsPoint(t){return tC(this,this,t),this.check()}transformAsVector(t){return tX(this,this,t),this.check()}transformByMatrix3(t){return tB(this,this,t),this.check()}transformByMatrix2x3(t){return tL(this,this,t),this.check()}transformByMatrix2(t){return tI(this,this,t),this.check()}},tJ={};function tQ(){let t=new tt(3);return tt!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t}function t0(t){let e=new tt(3);return e[0]=t[0],e[1]=t[1],e[2]=t[2],e}function t1(t){let e=t[0],i=t[1],r=t[2];return Math.sqrt(e*e+i*i+r*r)}function t2(t,e,i){let r=new tt(3);return r[0]=t,r[1]=e,r[2]=i,r}function t3(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t}function t4(t,e,i,r){return t[0]=e,t[1]=i,t[2]=r,t}function t6(t,e,i){return t[0]=e[0]+i[0],t[1]=e[1]+i[1],t[2]=e[2]+i[2],t}function t5(t,e,i){return t[0]=e[0]-i[0],t[1]=e[1]-i[1],t[2]=e[2]-i[2],t}function t8(t,e,i){return t[0]=e[0]*i[0],t[1]=e[1]*i[1],t[2]=e[2]*i[2],t}function t7(t,e,i){return t[0]=e[0]/i[0],t[1]=e[1]/i[1],t[2]=e[2]/i[2],t}function t9(t,e){return t[0]=Math.ceil(e[0]),t[1]=Math.ceil(e[1]),t[2]=Math.ceil(e[2]),t}function et(t,e){return t[0]=Math.floor(e[0]),t[1]=Math.floor(e[1]),t[2]=Math.floor(e[2]),t}function ee(t,e,i){return t[0]=Math.min(e[0],i[0]),t[1]=Math.min(e[1],i[1]),t[2]=Math.min(e[2],i[2]),t}function ei(t,e,i){return t[0]=Math.max(e[0],i[0]),t[1]=Math.max(e[1],i[1]),t[2]=Math.max(e[2],i[2]),t}function er(t,e){return t[0]=ti(e[0]),t[1]=ti(e[1]),t[2]=ti(e[2]),t}function en(t,e,i){return t[0]=e[0]*i,t[1]=e[1]*i,t[2]=e[2]*i,t}function es(t,e,i,r){return t[0]=e[0]+i[0]*r,t[1]=e[1]+i[1]*r,t[2]=e[2]+i[2]*r,t}function ea(t,e){let i=e[0]-t[0],r=e[1]-t[1],n=e[2]-t[2];return Math.sqrt(i*i+r*r+n*n)}function eo(t,e){let i=e[0]-t[0],r=e[1]-t[1],n=e[2]-t[2];return i*i+r*r+n*n}function el(t){let e=t[0],i=t[1],r=t[2];return e*e+i*i+r*r}function eu(t,e){return t[0]=-e[0],t[1]=-e[1],t[2]=-e[2],t}function ec(t,e){return t[0]=1/e[0],t[1]=1/e[1],t[2]=1/e[2],t}function eh(t,e){let i=e[0],r=e[1],n=e[2],s=i*i+r*r+n*n;return s>0&&(s=1/Math.sqrt(s)),t[0]=e[0]*s,t[1]=e[1]*s,t[2]=e[2]*s,t}function ef(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function ed(t,e,i){let r=e[0],n=e[1],s=e[2],a=i[0],o=i[1],l=i[2];return t[0]=n*l-s*o,t[1]=s*a-r*l,t[2]=r*o-n*a,t}function ep(t,e,i,r){let n=e[0],s=e[1],a=e[2];return t[0]=n+r*(i[0]-n),t[1]=s+r*(i[1]-s),t[2]=a+r*(i[2]-a),t}function eg(t,e,i,r){let n=Math.acos(Math.min(Math.max(ef(e,i),-1),1)),s=Math.sin(n),a=Math.sin((1-r)*n)/s,o=Math.sin(r*n)/s;return t[0]=a*e[0]+o*i[0],t[1]=a*e[1]+o*i[1],t[2]=a*e[2]+o*i[2],t}function em(t,e,i,r,n,s){let a=s*s,o=a*(2*s-3)+1,l=a*(s-2)+s,u=a*(s-1),c=a*(3-2*s);return t[0]=e[0]*o+i[0]*l+r[0]*u+n[0]*c,t[1]=e[1]*o+i[1]*l+r[1]*u+n[1]*c,t[2]=e[2]*o+i[2]*l+r[2]*u+n[2]*c,t}function e_(t,e,i,r,n,s){let a=1-s,o=a*a,l=s*s,u=o*a,c=3*s*o,h=3*l*a,f=l*s;return t[0]=e[0]*u+i[0]*c+r[0]*h+n[0]*f,t[1]=e[1]*u+i[1]*c+r[1]*h+n[1]*f,t[2]=e[2]*u+i[2]*c+r[2]*h+n[2]*f,t}function eb(t,e){e=void 0===e?1:e;let i=2*te()*Math.PI,r=2*te()-1,n=Math.sqrt(1-r*r)*e;return t[0]=Math.cos(i)*n,t[1]=Math.sin(i)*n,t[2]=r*e,t}function ev(t,e,i){let r=e[0],n=e[1],s=e[2],a=i[3]*r+i[7]*n+i[11]*s+i[15];return a=a||1,t[0]=(i[0]*r+i[4]*n+i[8]*s+i[12])/a,t[1]=(i[1]*r+i[5]*n+i[9]*s+i[13])/a,t[2]=(i[2]*r+i[6]*n+i[10]*s+i[14])/a,t}function ey(t,e,i){let r=e[0],n=e[1],s=e[2];return t[0]=r*i[0]+n*i[3]+s*i[6],t[1]=r*i[1]+n*i[4]+s*i[7],t[2]=r*i[2]+n*i[5]+s*i[8],t}function eE(t,e,i){let r=i[0],n=i[1],s=i[2],a=i[3],o=e[0],l=e[1],u=e[2],c=n*u-s*l,h=s*o-r*u,f=r*l-n*o,d=n*f-s*h,p=s*c-r*f,g=r*h-n*c,m=2*a;return c*=m,h*=m,f*=m,d*=2,p*=2,g*=2,t[0]=o+c+d,t[1]=l+h+p,t[2]=u+f+g,t}function eM(t,e,i,r){let n=[],s=[];return n[0]=e[0]-i[0],n[1]=e[1]-i[1],n[2]=e[2]-i[2],s[0]=n[0],s[1]=n[1]*Math.cos(r)-n[2]*Math.sin(r),s[2]=n[1]*Math.sin(r)+n[2]*Math.cos(r),t[0]=s[0]+i[0],t[1]=s[1]+i[1],t[2]=s[2]+i[2],t}function ew(t,e,i,r){let n=[],s=[];return n[0]=e[0]-i[0],n[1]=e[1]-i[1],n[2]=e[2]-i[2],s[0]=n[2]*Math.sin(r)+n[0]*Math.cos(r),s[1]=n[1],s[2]=n[2]*Math.cos(r)-n[0]*Math.sin(r),t[0]=s[0]+i[0],t[1]=s[1]+i[1],t[2]=s[2]+i[2],t}function ex(t,e,i,r){let n=[],s=[];return n[0]=e[0]-i[0],n[1]=e[1]-i[1],n[2]=e[2]-i[2],s[0]=n[0]*Math.cos(r)-n[1]*Math.sin(r),s[1]=n[0]*Math.sin(r)+n[1]*Math.cos(r),s[2]=n[2],t[0]=s[0]+i[0],t[1]=s[1]+i[1],t[2]=s[2]+i[2],t}function eP(t,e){let i=t[0],r=t[1],n=t[2],s=e[0],a=e[1],o=e[2],l=Math.sqrt((i*i+r*r+n*n)*(s*s+a*a+o*o));return Math.acos(Math.min(Math.max(l&&ef(t,e)/l,-1),1))}function eA(t){return t[0]=0,t[1]=0,t[2]=0,t}function eS(t){return`vec3(${t[0]}, ${t[1]}, ${t[2]})`}function eO(t,e){return t[0]===e[0]&&t[1]===e[1]&&t[2]===e[2]}function eT(t,e){let i=t[0],r=t[1],n=t[2],s=e[0],a=e[1],o=e[2];return Math.abs(i-s)<=1e-6*Math.max(1,Math.abs(i),Math.abs(s))&&Math.abs(r-a)<=1e-6*Math.max(1,Math.abs(r),Math.abs(a))&&Math.abs(n-o)<=1e-6*Math.max(1,Math.abs(n),Math.abs(o))}P(tJ,{add:()=>t6,angle:()=>eP,bezier:()=>e_,ceil:()=>t9,clone:()=>t0,copy:()=>t3,create:()=>tQ,cross:()=>ed,dist:()=>eC,distance:()=>ea,div:()=>eB,divide:()=>t7,dot:()=>ef,equals:()=>eT,exactEquals:()=>eO,floor:()=>et,forEach:()=>ez,fromValues:()=>t2,hermite:()=>em,inverse:()=>ec,len:()=>eN,length:()=>t1,lerp:()=>ep,max:()=>ei,min:()=>ee,mul:()=>eL,multiply:()=>t8,negate:()=>eu,normalize:()=>eh,random:()=>eb,rotateX:()=>eM,rotateY:()=>ew,rotateZ:()=>ex,round:()=>er,scale:()=>en,scaleAndAdd:()=>es,set:()=>t4,slerp:()=>eg,sqrDist:()=>eR,sqrLen:()=>ek,squaredDistance:()=>eo,squaredLength:()=>el,str:()=>eS,sub:()=>eI,subtract:()=>t5,transformMat3:()=>ey,transformMat4:()=>ev,transformQuat:()=>eE,zero:()=>eA});var eI=t5,eL=t8,eB=t7,eC=ea,eR=eo,eN=t1,ek=el,ez=(i=tQ(),function(t,e,r,n,s,a){let o,l;for(e||(e=3),r||(r=0),l=n?Math.min(n*e+r,t.length):t.length,o=r;o<l;o+=e)i[0]=t[o],i[1]=t[o+1],i[2]=t[o+2],s(i,i,a),t[o]=i[0],t[o+1]=i[1],t[o+2]=i[2];return t}),ej=[0,0,0],eU=class extends J{static get ZERO(){return d||Object.freeze(d=new eU(0,0,0)),d}constructor(t=0,e=0,i=0){super(-0,-0,-0),1==arguments.length&&B(t)?this.copy(t):(T.debug&&(Z(t),Z(e),Z(i)),this[0]=t,this[1]=e,this[2]=i)}set(t,e,i){return this[0]=t,this[1]=e,this[2]=i,this.check()}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this.check()}fromObject(t){return T.debug&&(Z(t.x),Z(t.y),Z(t.z)),this[0]=t.x,this[1]=t.y,this[2]=t.z,this.check()}toObject(t){return t.x=this[0],t.y=this[1],t.z=this[2],t}get ELEMENTS(){return 3}get z(){return this[2]}set z(t){this[2]=Z(t)}angle(t){return eP(this,t)}cross(t){return ed(this,this,t),this.check()}rotateX({radians:t,origin:e=ej}){return eM(this,this,e,t),this.check()}rotateY({radians:t,origin:e=ej}){return ew(this,this,e,t),this.check()}rotateZ({radians:t,origin:e=ej}){return ex(this,this,e,t),this.check()}transform(t){return this.transformAsPoint(t)}transformAsPoint(t){return ev(this,this,t),this.check()}transformAsVector(t){return tZ(this,this,t),this.check()}transformByMatrix3(t){return ey(this,this,t),this.check()}transformByMatrix2(t){let e,i;return e=this[0],i=this[1],this[0]=t[0]*e+t[2]*i,this[1]=t[1]*e+t[3]*i,this[2]=this[2],this.check()}transformByQuaternion(t){return eE(this,this,t),this.check()}},eF=class extends J{static get ZERO(){return p||Object.freeze(p=new eF(0,0,0,0)),p}constructor(t=0,e=0,i=0,r=0){super(-0,-0,-0,-0),B(t)&&1==arguments.length?this.copy(t):(T.debug&&(Z(t),Z(e),Z(i),Z(r)),this[0]=t,this[1]=e,this[2]=i,this[3]=r)}set(t,e,i,r){return this[0]=t,this[1]=e,this[2]=i,this[3]=r,this.check()}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this[3]=t[3],this.check()}fromObject(t){return T.debug&&(Z(t.x),Z(t.y),Z(t.z),Z(t.w)),this[0]=t.x,this[1]=t.y,this[2]=t.z,this[3]=t.w,this}toObject(t){return t.x=this[0],t.y=this[1],t.z=this[2],t.w=this[3],t}get ELEMENTS(){return 4}get z(){return this[2]}set z(t){this[2]=Z(t)}get w(){return this[3]}set w(t){this[3]=Z(t)}transform(t){return ev(this,this,t),this.check()}transformByMatrix3(t){return tH(this,this,t),this.check()}transformByMatrix2(t){let e,i;return e=this[0],i=this[1],this[0]=t[0]*e+t[2]*i,this[1]=t[1]*e+t[3]*i,this[2]=this[2],this[3]=this[3],this.check()}transformByQuaternion(t){return eE(this,this,t),this.check()}applyMatrix4(t){return t.transform(this,this),this}},eD=class extends X{toString(){let t="[";if(T.printRowMajor){t+="row-major:";for(let e=0;e<this.RANK;++e)for(let i=0;i<this.RANK;++i)t+=` ${this[i*this.RANK+e]}`}else{t+="column-major:";for(let e=0;e<this.ELEMENTS;++e)t+=` ${this[e]}`}return t+"]"}getElementIndex(t,e){return e*this.RANK+t}getElement(t,e){return this[e*this.RANK+t]}setElement(t,e,i){return this[e*this.RANK+t]=Z(i),this}getColumn(t,e=Array(this.RANK).fill(-0)){let i=t*this.RANK;for(let t=0;t<this.RANK;++t)e[t]=this[i+t];return e}setColumn(t,e){let i=t*this.RANK;for(let t=0;t<this.RANK;++t)this[i+t]=e[t];return this}},eV={};function e$(){let t=new tt(9);return tt!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[5]=0,t[6]=0,t[7]=0),t[0]=1,t[4]=1,t[8]=1,t}function eY(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[4],t[4]=e[5],t[5]=e[6],t[6]=e[8],t[7]=e[9],t[8]=e[10],t}function eq(t){let e=new tt(9);return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e}function eG(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t}function eW(t,e,i,r,n,s,a,o,l){let u=new tt(9);return u[0]=t,u[1]=e,u[2]=i,u[3]=r,u[4]=n,u[5]=s,u[6]=a,u[7]=o,u[8]=l,u}function eX(t,e,i,r,n,s,a,o,l,u){return t[0]=e,t[1]=i,t[2]=r,t[3]=n,t[4]=s,t[5]=a,t[6]=o,t[7]=l,t[8]=u,t}function eZ(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=1,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t}function eH(t,e){if(t===e){let i=e[1],r=e[2],n=e[5];t[1]=e[3],t[2]=e[6],t[3]=i,t[5]=e[7],t[6]=r,t[7]=n}else t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8];return t}function eK(t,e){let i=e[0],r=e[1],n=e[2],s=e[3],a=e[4],o=e[5],l=e[6],u=e[7],c=e[8],h=c*a-o*u,f=-c*s+o*l,d=u*s-a*l,p=i*h+r*f+n*d;return p?(p=1/p,t[0]=h*p,t[1]=(-c*r+n*u)*p,t[2]=(o*r-n*a)*p,t[3]=f*p,t[4]=(c*i-n*l)*p,t[5]=(-o*i+n*s)*p,t[6]=d*p,t[7]=(-u*i+r*l)*p,t[8]=(a*i-r*s)*p,t):null}function eJ(t,e){let i=e[0],r=e[1],n=e[2],s=e[3],a=e[4],o=e[5],l=e[6],u=e[7],c=e[8];return t[0]=a*c-o*u,t[1]=n*u-r*c,t[2]=r*o-n*a,t[3]=o*l-s*c,t[4]=i*c-n*l,t[5]=n*s-i*o,t[6]=s*u-a*l,t[7]=r*l-i*u,t[8]=i*a-r*s,t}function eQ(t){let e=t[0],i=t[1],r=t[2],n=t[3],s=t[4],a=t[5],o=t[6],l=t[7],u=t[8];return e*(u*s-a*l)+i*(-u*n+a*o)+r*(l*n-s*o)}function e0(t,e,i){let r=e[0],n=e[1],s=e[2],a=e[3],o=e[4],l=e[5],u=e[6],c=e[7],h=e[8],f=i[0],d=i[1],p=i[2],g=i[3],m=i[4],_=i[5],b=i[6],v=i[7],y=i[8];return t[0]=f*r+d*a+p*u,t[1]=f*n+d*o+p*c,t[2]=f*s+d*l+p*h,t[3]=g*r+m*a+_*u,t[4]=g*n+m*o+_*c,t[5]=g*s+m*l+_*h,t[6]=b*r+v*a+y*u,t[7]=b*n+v*o+y*c,t[8]=b*s+v*l+y*h,t}function e1(t,e,i){let r=e[0],n=e[1],s=e[2],a=e[3],o=e[4],l=e[5],u=e[6],c=e[7],h=e[8],f=i[0],d=i[1];return t[0]=r,t[1]=n,t[2]=s,t[3]=a,t[4]=o,t[5]=l,t[6]=f*r+d*a+u,t[7]=f*n+d*o+c,t[8]=f*s+d*l+h,t}function e2(t,e,i){let r=e[0],n=e[1],s=e[2],a=e[3],o=e[4],l=e[5],u=e[6],c=e[7],h=e[8],f=Math.sin(i),d=Math.cos(i);return t[0]=d*r+f*a,t[1]=d*n+f*o,t[2]=d*s+f*l,t[3]=d*a-f*r,t[4]=d*o-f*n,t[5]=d*l-f*s,t[6]=u,t[7]=c,t[8]=h,t}function e3(t,e,i){let r=i[0],n=i[1];return t[0]=r*e[0],t[1]=r*e[1],t[2]=r*e[2],t[3]=n*e[3],t[4]=n*e[4],t[5]=n*e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t}function e4(t,e){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=1,t[5]=0,t[6]=e[0],t[7]=e[1],t[8]=1,t}function e6(t,e){let i=Math.sin(e),r=Math.cos(e);return t[0]=r,t[1]=i,t[2]=0,t[3]=-i,t[4]=r,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t}function e5(t,e){return t[0]=e[0],t[1]=0,t[2]=0,t[3]=0,t[4]=e[1],t[5]=0,t[6]=0,t[7]=0,t[8]=1,t}function e8(t,e){return t[0]=e[0],t[1]=e[1],t[2]=0,t[3]=e[2],t[4]=e[3],t[5]=0,t[6]=e[4],t[7]=e[5],t[8]=1,t}function e7(t,e){let i=e[0],r=e[1],n=e[2],s=e[3],a=i+i,o=r+r,l=n+n,u=i*a,c=r*a,h=r*o,f=n*a,d=n*o,p=n*l,g=s*a,m=s*o,_=s*l;return t[0]=1-h-p,t[3]=c-_,t[6]=f+m,t[1]=c+_,t[4]=1-u-p,t[7]=d-g,t[2]=f-m,t[5]=d+g,t[8]=1-u-h,t}function e9(t,e){let i=e[0],r=e[1],n=e[2],s=e[3],a=e[4],o=e[5],l=e[6],u=e[7],c=e[8],h=e[9],f=e[10],d=e[11],p=e[12],g=e[13],m=e[14],_=e[15],b=i*o-r*a,v=i*l-n*a,y=i*u-s*a,E=r*l-n*o,M=r*u-s*o,w=n*u-s*l,x=c*g-h*p,P=c*m-f*p,A=c*_-d*p,S=h*m-f*g,O=h*_-d*g,T=f*_-d*m,I=b*T-v*O+y*S+E*A-M*P+w*x;return I?(I=1/I,t[0]=(o*T-l*O+u*S)*I,t[1]=(l*A-a*T-u*P)*I,t[2]=(a*O-o*A+u*x)*I,t[3]=(n*O-r*T-s*S)*I,t[4]=(i*T-n*A+s*P)*I,t[5]=(r*A-i*O-s*x)*I,t[6]=(g*w-m*M+_*E)*I,t[7]=(m*y-p*w-_*v)*I,t[8]=(p*M-g*y+_*b)*I,t):null}function it(t,e,i){return t[0]=2/e,t[1]=0,t[2]=0,t[3]=0,t[4]=-2/i,t[5]=0,t[6]=-1,t[7]=1,t[8]=1,t}function ie(t){return`mat3(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]}, ${t[4]}, ${t[5]}, ${t[6]}, ${t[7]}, ${t[8]})`}function ii(t){return Math.sqrt(t[0]*t[0]+t[1]*t[1]+t[2]*t[2]+t[3]*t[3]+t[4]*t[4]+t[5]*t[5]+t[6]*t[6]+t[7]*t[7]+t[8]*t[8])}function ir(t,e,i){return t[0]=e[0]+i[0],t[1]=e[1]+i[1],t[2]=e[2]+i[2],t[3]=e[3]+i[3],t[4]=e[4]+i[4],t[5]=e[5]+i[5],t[6]=e[6]+i[6],t[7]=e[7]+i[7],t[8]=e[8]+i[8],t}function is(t,e,i){return t[0]=e[0]-i[0],t[1]=e[1]-i[1],t[2]=e[2]-i[2],t[3]=e[3]-i[3],t[4]=e[4]-i[4],t[5]=e[5]-i[5],t[6]=e[6]-i[6],t[7]=e[7]-i[7],t[8]=e[8]-i[8],t}function ia(t,e,i){return t[0]=e[0]*i,t[1]=e[1]*i,t[2]=e[2]*i,t[3]=e[3]*i,t[4]=e[4]*i,t[5]=e[5]*i,t[6]=e[6]*i,t[7]=e[7]*i,t[8]=e[8]*i,t}function io(t,e,i,r){return t[0]=e[0]+i[0]*r,t[1]=e[1]+i[1]*r,t[2]=e[2]+i[2]*r,t[3]=e[3]+i[3]*r,t[4]=e[4]+i[4]*r,t[5]=e[5]+i[5]*r,t[6]=e[6]+i[6]*r,t[7]=e[7]+i[7]*r,t[8]=e[8]+i[8]*r,t}function il(t,e){return t[0]===e[0]&&t[1]===e[1]&&t[2]===e[2]&&t[3]===e[3]&&t[4]===e[4]&&t[5]===e[5]&&t[6]===e[6]&&t[7]===e[7]&&t[8]===e[8]}function iu(t,e){let i=t[0],r=t[1],n=t[2],s=t[3],a=t[4],o=t[5],l=t[6],u=t[7],c=t[8],h=e[0],f=e[1],d=e[2],p=e[3],g=e[4],m=e[5],_=e[6],b=e[7],v=e[8];return Math.abs(i-h)<=1e-6*Math.max(1,Math.abs(i),Math.abs(h))&&Math.abs(r-f)<=1e-6*Math.max(1,Math.abs(r),Math.abs(f))&&Math.abs(n-d)<=1e-6*Math.max(1,Math.abs(n),Math.abs(d))&&Math.abs(s-p)<=1e-6*Math.max(1,Math.abs(s),Math.abs(p))&&Math.abs(a-g)<=1e-6*Math.max(1,Math.abs(a),Math.abs(g))&&Math.abs(o-m)<=1e-6*Math.max(1,Math.abs(o),Math.abs(m))&&Math.abs(l-_)<=1e-6*Math.max(1,Math.abs(l),Math.abs(_))&&Math.abs(u-b)<=1e-6*Math.max(1,Math.abs(u),Math.abs(b))&&Math.abs(c-v)<=1e-6*Math.max(1,Math.abs(c),Math.abs(v))}P(eV,{add:()=>ir,adjoint:()=>eJ,clone:()=>eq,copy:()=>eG,create:()=>e$,determinant:()=>eQ,equals:()=>iu,exactEquals:()=>il,frob:()=>ii,fromMat2d:()=>e8,fromMat4:()=>eY,fromQuat:()=>e7,fromRotation:()=>e6,fromScaling:()=>e5,fromTranslation:()=>e4,fromValues:()=>eW,identity:()=>eZ,invert:()=>eK,mul:()=>ic,multiply:()=>e0,multiplyScalar:()=>ia,multiplyScalarAndAdd:()=>io,normalFromMat4:()=>e9,projection:()=>it,rotate:()=>e2,scale:()=>e3,set:()=>eX,str:()=>ie,sub:()=>ih,subtract:()=>is,translate:()=>e1,transpose:()=>eH});var ic=e0,ih=is;(c=g||(g={}))[c.COL0ROW0=0]="COL0ROW0",c[c.COL0ROW1=1]="COL0ROW1",c[c.COL0ROW2=2]="COL0ROW2",c[c.COL1ROW0=3]="COL1ROW0",c[c.COL1ROW1=4]="COL1ROW1",c[c.COL1ROW2=5]="COL1ROW2",c[c.COL2ROW0=6]="COL2ROW0",c[c.COL2ROW1=7]="COL2ROW1",c[c.COL2ROW2=8]="COL2ROW2";var id=Object.freeze([1,0,0,0,1,0,0,0,1]),ip=class extends eD{static get IDENTITY(){return ig||Object.freeze(ig=new ip),ig}static get ZERO(){return m||Object.freeze(m=new ip([0,0,0,0,0,0,0,0,0])),m}get ELEMENTS(){return 9}get RANK(){return 3}get INDICES(){return g}constructor(t,...e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0),1==arguments.length&&Array.isArray(t)?this.copy(t):e.length>0?this.copy([t,...e]):this.identity()}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this[3]=t[3],this[4]=t[4],this[5]=t[5],this[6]=t[6],this[7]=t[7],this[8]=t[8],this.check()}identity(){return this.copy(id)}fromObject(t){return this.check()}fromQuaternion(t){return e7(this,t),this.check()}set(t,e,i,r,n,s,a,o,l){return this[0]=t,this[1]=e,this[2]=i,this[3]=r,this[4]=n,this[5]=s,this[6]=a,this[7]=o,this[8]=l,this.check()}setRowMajor(t,e,i,r,n,s,a,o,l){return this[0]=t,this[1]=r,this[2]=a,this[3]=e,this[4]=n,this[5]=o,this[6]=i,this[7]=s,this[8]=l,this.check()}determinant(){return eQ(this)}transpose(){return eH(this,this),this.check()}invert(){return eK(this,this),this.check()}multiplyLeft(t){return e0(this,t,this),this.check()}multiplyRight(t){return e0(this,this,t),this.check()}rotate(t){return e2(this,this,t),this.check()}scale(t){return Array.isArray(t)?e3(this,this,t):e3(this,this,[t,t]),this.check()}translate(t){return e1(this,this,t),this.check()}transform(t,e){let i;switch(t.length){case 2:i=tB(e||[-0,-0],t,this);break;case 3:i=ey(e||[-0,-0,-0],t,this);break;case 4:i=tH(e||[-0,-0,-0,-0],t,this);break;default:throw Error("Illegal vector")}return H(i,t.length),i}transformVector(t,e){return this.transform(t,e)}transformVector2(t,e){return this.transform(t,e)}transformVector3(t,e){return this.transform(t,e)}},ig=null,im={};function i_(){let t=new tt(16);return tt!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0),t[0]=1,t[5]=1,t[10]=1,t[15]=1,t}function ib(t){let e=new tt(16);return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function iv(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t}function iy(t,e,i,r,n,s,a,o,l,u,c,h,f,d,p,g){let m=new tt(16);return m[0]=t,m[1]=e,m[2]=i,m[3]=r,m[4]=n,m[5]=s,m[6]=a,m[7]=o,m[8]=l,m[9]=u,m[10]=c,m[11]=h,m[12]=f,m[13]=d,m[14]=p,m[15]=g,m}function iE(t,e,i,r,n,s,a,o,l,u,c,h,f,d,p,g,m){return t[0]=e,t[1]=i,t[2]=r,t[3]=n,t[4]=s,t[5]=a,t[6]=o,t[7]=l,t[8]=u,t[9]=c,t[10]=h,t[11]=f,t[12]=d,t[13]=p,t[14]=g,t[15]=m,t}function iM(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function iw(t,e){if(t===e){let i=e[1],r=e[2],n=e[3],s=e[6],a=e[7],o=e[11];t[1]=e[4],t[2]=e[8],t[3]=e[12],t[4]=i,t[6]=e[9],t[7]=e[13],t[8]=r,t[9]=s,t[11]=e[14],t[12]=n,t[13]=a,t[14]=o}else t[0]=e[0],t[1]=e[4],t[2]=e[8],t[3]=e[12],t[4]=e[1],t[5]=e[5],t[6]=e[9],t[7]=e[13],t[8]=e[2],t[9]=e[6],t[10]=e[10],t[11]=e[14],t[12]=e[3],t[13]=e[7],t[14]=e[11],t[15]=e[15];return t}function ix(t,e){let i=e[0],r=e[1],n=e[2],s=e[3],a=e[4],o=e[5],l=e[6],u=e[7],c=e[8],h=e[9],f=e[10],d=e[11],p=e[12],g=e[13],m=e[14],_=e[15],b=i*o-r*a,v=i*l-n*a,y=i*u-s*a,E=r*l-n*o,M=r*u-s*o,w=n*u-s*l,x=c*g-h*p,P=c*m-f*p,A=c*_-d*p,S=h*m-f*g,O=h*_-d*g,T=f*_-d*m,I=b*T-v*O+y*S+E*A-M*P+w*x;return I?(I=1/I,t[0]=(o*T-l*O+u*S)*I,t[1]=(n*O-r*T-s*S)*I,t[2]=(g*w-m*M+_*E)*I,t[3]=(f*M-h*w-d*E)*I,t[4]=(l*A-a*T-u*P)*I,t[5]=(i*T-n*A+s*P)*I,t[6]=(m*y-p*w-_*v)*I,t[7]=(c*w-f*y+d*v)*I,t[8]=(a*O-o*A+u*x)*I,t[9]=(r*A-i*O-s*x)*I,t[10]=(p*M-g*y+_*b)*I,t[11]=(h*y-c*M-d*b)*I,t[12]=(o*P-a*S-l*x)*I,t[13]=(i*S-r*P+n*x)*I,t[14]=(g*v-p*E-m*b)*I,t[15]=(c*E-h*v+f*b)*I,t):null}function iP(t,e){let i=e[0],r=e[1],n=e[2],s=e[3],a=e[4],o=e[5],l=e[6],u=e[7],c=e[8],h=e[9],f=e[10],d=e[11],p=e[12],g=e[13],m=e[14],_=e[15],b=i*o-r*a,v=i*l-n*a,y=i*u-s*a,E=r*l-n*o,M=r*u-s*o,w=n*u-s*l,x=c*g-h*p,P=c*m-f*p,A=c*_-d*p,S=h*m-f*g,O=h*_-d*g,T=f*_-d*m;return t[0]=o*T-l*O+u*S,t[1]=n*O-r*T-s*S,t[2]=g*w-m*M+_*E,t[3]=f*M-h*w-d*E,t[4]=l*A-a*T-u*P,t[5]=i*T-n*A+s*P,t[6]=m*y-p*w-_*v,t[7]=c*w-f*y+d*v,t[8]=a*O-o*A+u*x,t[9]=r*A-i*O-s*x,t[10]=p*M-g*y+_*b,t[11]=h*y-c*M-d*b,t[12]=o*P-a*S-l*x,t[13]=i*S-r*P+n*x,t[14]=g*v-p*E-m*b,t[15]=c*E-h*v+f*b,t}function iA(t){let e=t[0],i=t[1],r=t[2],n=t[3],s=t[4],a=t[5],o=t[6],l=t[7],u=t[8],c=t[9],h=t[10],f=t[11],d=t[12],p=t[13],g=t[14],m=t[15],_=e*a-i*s,b=e*o-r*s,v=i*o-r*a,y=u*p-c*d,E=u*g-h*d,M=c*g-h*p;return l*(e*M-i*E+r*y)-n*(s*M-a*E+o*y)+m*(u*v-c*b+h*_)-f*(d*v-p*b+g*_)}function iS(t,e,i){let r=e[0],n=e[1],s=e[2],a=e[3],o=e[4],l=e[5],u=e[6],c=e[7],h=e[8],f=e[9],d=e[10],p=e[11],g=e[12],m=e[13],_=e[14],b=e[15],v=i[0],y=i[1],E=i[2],M=i[3];return t[0]=v*r+y*o+E*h+M*g,t[1]=v*n+y*l+E*f+M*m,t[2]=v*s+y*u+E*d+M*_,t[3]=v*a+y*c+E*p+M*b,v=i[4],y=i[5],E=i[6],M=i[7],t[4]=v*r+y*o+E*h+M*g,t[5]=v*n+y*l+E*f+M*m,t[6]=v*s+y*u+E*d+M*_,t[7]=v*a+y*c+E*p+M*b,v=i[8],y=i[9],E=i[10],M=i[11],t[8]=v*r+y*o+E*h+M*g,t[9]=v*n+y*l+E*f+M*m,t[10]=v*s+y*u+E*d+M*_,t[11]=v*a+y*c+E*p+M*b,v=i[12],y=i[13],E=i[14],M=i[15],t[12]=v*r+y*o+E*h+M*g,t[13]=v*n+y*l+E*f+M*m,t[14]=v*s+y*u+E*d+M*_,t[15]=v*a+y*c+E*p+M*b,t}function iO(t,e,i){let r,n,s,a,o,l,u,c,h,f,d,p,g=i[0],m=i[1],_=i[2];return e===t?(t[12]=e[0]*g+e[4]*m+e[8]*_+e[12],t[13]=e[1]*g+e[5]*m+e[9]*_+e[13],t[14]=e[2]*g+e[6]*m+e[10]*_+e[14],t[15]=e[3]*g+e[7]*m+e[11]*_+e[15]):(r=e[0],n=e[1],s=e[2],a=e[3],o=e[4],l=e[5],u=e[6],c=e[7],h=e[8],f=e[9],d=e[10],p=e[11],t[0]=r,t[1]=n,t[2]=s,t[3]=a,t[4]=o,t[5]=l,t[6]=u,t[7]=c,t[8]=h,t[9]=f,t[10]=d,t[11]=p,t[12]=r*g+o*m+h*_+e[12],t[13]=n*g+l*m+f*_+e[13],t[14]=s*g+u*m+d*_+e[14],t[15]=a*g+c*m+p*_+e[15]),t}function iT(t,e,i){let r=i[0],n=i[1],s=i[2];return t[0]=e[0]*r,t[1]=e[1]*r,t[2]=e[2]*r,t[3]=e[3]*r,t[4]=e[4]*n,t[5]=e[5]*n,t[6]=e[6]*n,t[7]=e[7]*n,t[8]=e[8]*s,t[9]=e[9]*s,t[10]=e[10]*s,t[11]=e[11]*s,t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t}function iI(t,e,i,r){let n,s,a,o,l,u,c,h,f,d,p,g,m,_,b,v,y,E,M,w,x,P,A,S,O=r[0],T=r[1],I=r[2],L=Math.sqrt(O*O+T*T+I*I);return L<1e-6?null:(O*=L=1/L,T*=L,I*=L,s=Math.sin(i),a=1-(n=Math.cos(i)),o=e[0],l=e[1],u=e[2],c=e[3],h=e[4],f=e[5],d=e[6],p=e[7],g=e[8],m=e[9],_=e[10],b=e[11],v=O*O*a+n,y=T*O*a+I*s,E=I*O*a-T*s,M=O*T*a-I*s,w=T*T*a+n,x=I*T*a+O*s,P=O*I*a+T*s,A=T*I*a-O*s,S=I*I*a+n,t[0]=o*v+h*y+g*E,t[1]=l*v+f*y+m*E,t[2]=u*v+d*y+_*E,t[3]=c*v+p*y+b*E,t[4]=o*M+h*w+g*x,t[5]=l*M+f*w+m*x,t[6]=u*M+d*w+_*x,t[7]=c*M+p*w+b*x,t[8]=o*P+h*A+g*S,t[9]=l*P+f*A+m*S,t[10]=u*P+d*A+_*S,t[11]=c*P+p*A+b*S,e!==t&&(t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t)}function iL(t,e,i){let r=Math.sin(i),n=Math.cos(i),s=e[4],a=e[5],o=e[6],l=e[7],u=e[8],c=e[9],h=e[10],f=e[11];return e!==t&&(t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t[4]=s*n+u*r,t[5]=a*n+c*r,t[6]=o*n+h*r,t[7]=l*n+f*r,t[8]=u*n-s*r,t[9]=c*n-a*r,t[10]=h*n-o*r,t[11]=f*n-l*r,t}function iB(t,e,i){let r=Math.sin(i),n=Math.cos(i),s=e[0],a=e[1],o=e[2],l=e[3],u=e[8],c=e[9],h=e[10],f=e[11];return e!==t&&(t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t[0]=s*n-u*r,t[1]=a*n-c*r,t[2]=o*n-h*r,t[3]=l*n-f*r,t[8]=s*r+u*n,t[9]=a*r+c*n,t[10]=o*r+h*n,t[11]=l*r+f*n,t}function iC(t,e,i){let r=Math.sin(i),n=Math.cos(i),s=e[0],a=e[1],o=e[2],l=e[3],u=e[4],c=e[5],h=e[6],f=e[7];return e!==t&&(t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t[0]=s*n+u*r,t[1]=a*n+c*r,t[2]=o*n+h*r,t[3]=l*n+f*r,t[4]=u*n-s*r,t[5]=c*n-a*r,t[6]=h*n-o*r,t[7]=f*n-l*r,t}function iR(t,e){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=e[0],t[13]=e[1],t[14]=e[2],t[15]=1,t}function iN(t,e){return t[0]=e[0],t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=e[1],t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=e[2],t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function ik(t,e,i){let r,n,s,a=i[0],o=i[1],l=i[2],u=Math.sqrt(a*a+o*o+l*l);return u<1e-6?null:(a*=u=1/u,o*=u,l*=u,n=Math.sin(e),s=1-(r=Math.cos(e)),t[0]=a*a*s+r,t[1]=o*a*s+l*n,t[2]=l*a*s-o*n,t[3]=0,t[4]=a*o*s-l*n,t[5]=o*o*s+r,t[6]=l*o*s+a*n,t[7]=0,t[8]=a*l*s+o*n,t[9]=o*l*s-a*n,t[10]=l*l*s+r,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t)}function iz(t,e){let i=Math.sin(e),r=Math.cos(e);return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=r,t[6]=i,t[7]=0,t[8]=0,t[9]=-i,t[10]=r,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function ij(t,e){let i=Math.sin(e),r=Math.cos(e);return t[0]=r,t[1]=0,t[2]=-i,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=i,t[9]=0,t[10]=r,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function iU(t,e){let i=Math.sin(e),r=Math.cos(e);return t[0]=r,t[1]=i,t[2]=0,t[3]=0,t[4]=-i,t[5]=r,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function iF(t,e,i){let r=e[0],n=e[1],s=e[2],a=e[3],o=r+r,l=n+n,u=s+s,c=r*o,h=r*l,f=r*u,d=n*l,p=n*u,g=s*u,m=a*o,_=a*l,b=a*u;return t[0]=1-(d+g),t[1]=h+b,t[2]=f-_,t[3]=0,t[4]=h-b,t[5]=1-(c+g),t[6]=p+m,t[7]=0,t[8]=f+_,t[9]=p-m,t[10]=1-(c+d),t[11]=0,t[12]=i[0],t[13]=i[1],t[14]=i[2],t[15]=1,t}function iD(t,e){let i=new tt(3),r=-e[0],n=-e[1],s=-e[2],a=e[3],o=e[4],l=e[5],u=e[6],c=e[7],h=r*r+n*n+s*s+a*a;return h>0?(i[0]=(o*a+c*r+l*s-u*n)*2/h,i[1]=(l*a+c*n+u*r-o*s)*2/h,i[2]=(u*a+c*s+o*n-l*r)*2/h):(i[0]=(o*a+c*r+l*s-u*n)*2,i[1]=(l*a+c*n+u*r-o*s)*2,i[2]=(u*a+c*s+o*n-l*r)*2),iF(t,e,i),t}function iV(t,e){return t[0]=e[12],t[1]=e[13],t[2]=e[14],t}function i$(t,e){let i=e[0],r=e[1],n=e[2],s=e[4],a=e[5],o=e[6],l=e[8],u=e[9],c=e[10];return t[0]=Math.sqrt(i*i+r*r+n*n),t[1]=Math.sqrt(s*s+a*a+o*o),t[2]=Math.sqrt(l*l+u*u+c*c),t}function iY(t,e){let i=new tt(3);i$(i,e);let r=1/i[0],n=1/i[1],s=1/i[2],a=e[0]*r,o=e[1]*n,l=e[2]*s,u=e[4]*r,c=e[5]*n,h=e[6]*s,f=e[8]*r,d=e[9]*n,p=e[10]*s,g=a+c+p,m=0;return g>0?(m=2*Math.sqrt(g+1),t[3]=.25*m,t[0]=(h-d)/m,t[1]=(f-l)/m,t[2]=(o-u)/m):a>c&&a>p?(m=2*Math.sqrt(1+a-c-p),t[3]=(h-d)/m,t[0]=.25*m,t[1]=(o+u)/m,t[2]=(f+l)/m):c>p?(m=2*Math.sqrt(1+c-a-p),t[3]=(f-l)/m,t[0]=(o+u)/m,t[1]=.25*m,t[2]=(h+d)/m):(m=2*Math.sqrt(1+p-a-c),t[3]=(o-u)/m,t[0]=(f+l)/m,t[1]=(h+d)/m,t[2]=.25*m),t}function iq(t,e,i,r){e[0]=r[12],e[1]=r[13],e[2]=r[14];let n=r[0],s=r[1],a=r[2],o=r[4],l=r[5],u=r[6],c=r[8],h=r[9],f=r[10];i[0]=Math.sqrt(n*n+s*s+a*a),i[1]=Math.sqrt(o*o+l*l+u*u),i[2]=Math.sqrt(c*c+h*h+f*f);let d=1/i[0],p=1/i[1],g=1/i[2],m=n*d,_=s*p,b=a*g,v=o*d,y=l*p,E=u*g,M=c*d,w=h*p,x=f*g,P=m+y+x,A=0;return P>0?(A=2*Math.sqrt(P+1),t[3]=.25*A,t[0]=(E-w)/A,t[1]=(M-b)/A,t[2]=(_-v)/A):m>y&&m>x?(A=2*Math.sqrt(1+m-y-x),t[3]=(E-w)/A,t[0]=.25*A,t[1]=(_+v)/A,t[2]=(M+b)/A):y>x?(A=2*Math.sqrt(1+y-m-x),t[3]=(M-b)/A,t[0]=(_+v)/A,t[1]=.25*A,t[2]=(E+w)/A):(A=2*Math.sqrt(1+x-m-y),t[3]=(_-v)/A,t[0]=(M+b)/A,t[1]=(E+w)/A,t[2]=.25*A),t}function iG(t,e,i,r){let n=e[0],s=e[1],a=e[2],o=e[3],l=n+n,u=s+s,c=a+a,h=n*l,f=n*u,d=n*c,p=s*u,g=s*c,m=a*c,_=o*l,b=o*u,v=o*c,y=r[0],E=r[1],M=r[2];return t[0]=(1-(p+m))*y,t[1]=(f+v)*y,t[2]=(d-b)*y,t[3]=0,t[4]=(f-v)*E,t[5]=(1-(h+m))*E,t[6]=(g+_)*E,t[7]=0,t[8]=(d+b)*M,t[9]=(g-_)*M,t[10]=(1-(h+p))*M,t[11]=0,t[12]=i[0],t[13]=i[1],t[14]=i[2],t[15]=1,t}function iW(t,e,i,r,n){let s=e[0],a=e[1],o=e[2],l=e[3],u=s+s,c=a+a,h=o+o,f=s*u,d=s*c,p=s*h,g=a*c,m=a*h,_=o*h,b=l*u,v=l*c,y=l*h,E=r[0],M=r[1],w=r[2],x=n[0],P=n[1],A=n[2],S=(1-(g+_))*E,O=(d+y)*E,T=(p-v)*E,I=(d-y)*M,L=(1-(f+_))*M,B=(m+b)*M,C=(p+v)*w,R=(m-b)*w,N=(1-(f+g))*w;return t[0]=S,t[1]=O,t[2]=T,t[3]=0,t[4]=I,t[5]=L,t[6]=B,t[7]=0,t[8]=C,t[9]=R,t[10]=N,t[11]=0,t[12]=i[0]+x-(S*x+I*P+C*A),t[13]=i[1]+P-(O*x+L*P+R*A),t[14]=i[2]+A-(T*x+B*P+N*A),t[15]=1,t}function iX(t,e){let i=e[0],r=e[1],n=e[2],s=e[3],a=i+i,o=r+r,l=n+n,u=i*a,c=r*a,h=r*o,f=n*a,d=n*o,p=n*l,g=s*a,m=s*o,_=s*l;return t[0]=1-h-p,t[1]=c+_,t[2]=f-m,t[3]=0,t[4]=c-_,t[5]=1-u-p,t[6]=d+g,t[7]=0,t[8]=f+m,t[9]=d-g,t[10]=1-u-h,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function iZ(t,e,i,r,n,s,a){let o=1/(i-e),l=1/(n-r),u=1/(s-a);return t[0]=2*s*o,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=2*s*l,t[6]=0,t[7]=0,t[8]=(i+e)*o,t[9]=(n+r)*l,t[10]=(a+s)*u,t[11]=-1,t[12]=0,t[13]=0,t[14]=a*s*2*u,t[15]=0,t}function iH(t,e,i,r,n){let s=1/Math.tan(e/2);if(t[0]=s/i,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=s,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=-1,t[12]=0,t[13]=0,t[15]=0,null!=n&&n!==1/0){let e=1/(r-n);t[10]=(n+r)*e,t[14]=2*n*r*e}else t[10]=-1,t[14]=-2*r;return t}P(im,{add:()=>i8,adjoint:()=>iP,clone:()=>ib,copy:()=>iv,create:()=>i_,decompose:()=>iq,determinant:()=>iA,equals:()=>ri,exactEquals:()=>re,frob:()=>i5,fromQuat:()=>iX,fromQuat2:()=>iD,fromRotation:()=>ik,fromRotationTranslation:()=>iF,fromRotationTranslationScale:()=>iG,fromRotationTranslationScaleOrigin:()=>iW,fromScaling:()=>iN,fromTranslation:()=>iR,fromValues:()=>iy,fromXRotation:()=>iz,fromYRotation:()=>ij,fromZRotation:()=>iU,frustum:()=>iZ,getRotation:()=>iY,getScaling:()=>i$,getTranslation:()=>iV,identity:()=>iM,invert:()=>ix,lookAt:()=>i3,mul:()=>rr,multiply:()=>iS,multiplyScalar:()=>i9,multiplyScalarAndAdd:()=>rt,ortho:()=>i1,orthoNO:()=>i0,orthoZO:()=>i2,perspective:()=>iK,perspectiveFromFieldOfView:()=>iQ,perspectiveNO:()=>iH,perspectiveZO:()=>iJ,rotate:()=>iI,rotateX:()=>iL,rotateY:()=>iB,rotateZ:()=>iC,scale:()=>iT,set:()=>iE,str:()=>i6,sub:()=>rn,subtract:()=>i7,targetTo:()=>i4,translate:()=>iO,transpose:()=>iw});var iK=iH;function iJ(t,e,i,r,n){let s=1/Math.tan(e/2);if(t[0]=s/i,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=s,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=-1,t[12]=0,t[13]=0,t[15]=0,null!=n&&n!==1/0){let e=1/(r-n);t[10]=n*e,t[14]=n*r*e}else t[10]=-1,t[14]=-r;return t}function iQ(t,e,i,r){let n=Math.tan(e.upDegrees*Math.PI/180),s=Math.tan(e.downDegrees*Math.PI/180),a=Math.tan(e.leftDegrees*Math.PI/180),o=Math.tan(e.rightDegrees*Math.PI/180),l=2/(a+o),u=2/(n+s);return t[0]=l,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=u,t[6]=0,t[7]=0,t[8]=-((a-o)*l*.5),t[9]=(n-s)*u*.5,t[10]=r/(i-r),t[11]=-1,t[12]=0,t[13]=0,t[14]=r*i/(i-r),t[15]=0,t}function i0(t,e,i,r,n,s,a){let o=1/(e-i),l=1/(r-n),u=1/(s-a);return t[0]=-2*o,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=-2*l,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=2*u,t[11]=0,t[12]=(e+i)*o,t[13]=(n+r)*l,t[14]=(a+s)*u,t[15]=1,t}var i1=i0;function i2(t,e,i,r,n,s,a){let o=1/(e-i),l=1/(r-n),u=1/(s-a);return t[0]=-2*o,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=-2*l,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=u,t[11]=0,t[12]=(e+i)*o,t[13]=(n+r)*l,t[14]=s*u,t[15]=1,t}function i3(t,e,i,r){let n,s,a,o,l,u,c,h,f,d,p=e[0],g=e[1],m=e[2],_=r[0],b=r[1],v=r[2],y=i[0],E=i[1],M=i[2];return 1e-6>Math.abs(p-y)&&1e-6>Math.abs(g-E)&&1e-6>Math.abs(m-M)?iM(t):(n=1/Math.sqrt((h=p-y)*h+(f=g-E)*f+(d=m-M)*d),h*=n,f*=n,d*=n,(n=Math.sqrt((s=b*d-v*f)*s+(a=v*h-_*d)*a+(o=_*f-b*h)*o))?(s*=n=1/n,a*=n,o*=n):(s=0,a=0,o=0),(n=Math.sqrt((l=f*o-d*a)*l+(u=d*s-h*o)*u+(c=h*a-f*s)*c))?(l*=n=1/n,u*=n,c*=n):(l=0,u=0,c=0),t[0]=s,t[1]=l,t[2]=h,t[3]=0,t[4]=a,t[5]=u,t[6]=f,t[7]=0,t[8]=o,t[9]=c,t[10]=d,t[11]=0,t[12]=-(s*p+a*g+o*m),t[13]=-(l*p+u*g+c*m),t[14]=-(h*p+f*g+d*m),t[15]=1,t)}function i4(t,e,i,r){let n=e[0],s=e[1],a=e[2],o=r[0],l=r[1],u=r[2],c=n-i[0],h=s-i[1],f=a-i[2],d=c*c+h*h+f*f;d>0&&(c*=d=1/Math.sqrt(d),h*=d,f*=d);let p=l*f-u*h,g=u*c-o*f,m=o*h-l*c;return(d=p*p+g*g+m*m)>0&&(p*=d=1/Math.sqrt(d),g*=d,m*=d),t[0]=p,t[1]=g,t[2]=m,t[3]=0,t[4]=h*m-f*g,t[5]=f*p-c*m,t[6]=c*g-h*p,t[7]=0,t[8]=c,t[9]=h,t[10]=f,t[11]=0,t[12]=n,t[13]=s,t[14]=a,t[15]=1,t}function i6(t){return`mat4(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]}, ${t[4]}, ${t[5]}, ${t[6]}, ${t[7]}, ${t[8]}, ${t[9]}, ${t[10]}, ${t[11]}, ${t[12]}, ${t[13]}, ${t[14]}, ${t[15]})`}function i5(t){return Math.sqrt(t[0]*t[0]+t[1]*t[1]+t[2]*t[2]+t[3]*t[3]+t[4]*t[4]+t[5]*t[5]+t[6]*t[6]+t[7]*t[7]+t[8]*t[8]+t[9]*t[9]+t[10]*t[10]+t[11]*t[11]+t[12]*t[12]+t[13]*t[13]+t[14]*t[14]+t[15]*t[15])}function i8(t,e,i){return t[0]=e[0]+i[0],t[1]=e[1]+i[1],t[2]=e[2]+i[2],t[3]=e[3]+i[3],t[4]=e[4]+i[4],t[5]=e[5]+i[5],t[6]=e[6]+i[6],t[7]=e[7]+i[7],t[8]=e[8]+i[8],t[9]=e[9]+i[9],t[10]=e[10]+i[10],t[11]=e[11]+i[11],t[12]=e[12]+i[12],t[13]=e[13]+i[13],t[14]=e[14]+i[14],t[15]=e[15]+i[15],t}function i7(t,e,i){return t[0]=e[0]-i[0],t[1]=e[1]-i[1],t[2]=e[2]-i[2],t[3]=e[3]-i[3],t[4]=e[4]-i[4],t[5]=e[5]-i[5],t[6]=e[6]-i[6],t[7]=e[7]-i[7],t[8]=e[8]-i[8],t[9]=e[9]-i[9],t[10]=e[10]-i[10],t[11]=e[11]-i[11],t[12]=e[12]-i[12],t[13]=e[13]-i[13],t[14]=e[14]-i[14],t[15]=e[15]-i[15],t}function i9(t,e,i){return t[0]=e[0]*i,t[1]=e[1]*i,t[2]=e[2]*i,t[3]=e[3]*i,t[4]=e[4]*i,t[5]=e[5]*i,t[6]=e[6]*i,t[7]=e[7]*i,t[8]=e[8]*i,t[9]=e[9]*i,t[10]=e[10]*i,t[11]=e[11]*i,t[12]=e[12]*i,t[13]=e[13]*i,t[14]=e[14]*i,t[15]=e[15]*i,t}function rt(t,e,i,r){return t[0]=e[0]+i[0]*r,t[1]=e[1]+i[1]*r,t[2]=e[2]+i[2]*r,t[3]=e[3]+i[3]*r,t[4]=e[4]+i[4]*r,t[5]=e[5]+i[5]*r,t[6]=e[6]+i[6]*r,t[7]=e[7]+i[7]*r,t[8]=e[8]+i[8]*r,t[9]=e[9]+i[9]*r,t[10]=e[10]+i[10]*r,t[11]=e[11]+i[11]*r,t[12]=e[12]+i[12]*r,t[13]=e[13]+i[13]*r,t[14]=e[14]+i[14]*r,t[15]=e[15]+i[15]*r,t}function re(t,e){return t[0]===e[0]&&t[1]===e[1]&&t[2]===e[2]&&t[3]===e[3]&&t[4]===e[4]&&t[5]===e[5]&&t[6]===e[6]&&t[7]===e[7]&&t[8]===e[8]&&t[9]===e[9]&&t[10]===e[10]&&t[11]===e[11]&&t[12]===e[12]&&t[13]===e[13]&&t[14]===e[14]&&t[15]===e[15]}function ri(t,e){let i=t[0],r=t[1],n=t[2],s=t[3],a=t[4],o=t[5],l=t[6],u=t[7],c=t[8],h=t[9],f=t[10],d=t[11],p=t[12],g=t[13],m=t[14],_=t[15],b=e[0],v=e[1],y=e[2],E=e[3],M=e[4],w=e[5],x=e[6],P=e[7],A=e[8],S=e[9],O=e[10],T=e[11],I=e[12],L=e[13],B=e[14],C=e[15];return Math.abs(i-b)<=1e-6*Math.max(1,Math.abs(i),Math.abs(b))&&Math.abs(r-v)<=1e-6*Math.max(1,Math.abs(r),Math.abs(v))&&Math.abs(n-y)<=1e-6*Math.max(1,Math.abs(n),Math.abs(y))&&Math.abs(s-E)<=1e-6*Math.max(1,Math.abs(s),Math.abs(E))&&Math.abs(a-M)<=1e-6*Math.max(1,Math.abs(a),Math.abs(M))&&Math.abs(o-w)<=1e-6*Math.max(1,Math.abs(o),Math.abs(w))&&Math.abs(l-x)<=1e-6*Math.max(1,Math.abs(l),Math.abs(x))&&Math.abs(u-P)<=1e-6*Math.max(1,Math.abs(u),Math.abs(P))&&Math.abs(c-A)<=1e-6*Math.max(1,Math.abs(c),Math.abs(A))&&Math.abs(h-S)<=1e-6*Math.max(1,Math.abs(h),Math.abs(S))&&Math.abs(f-O)<=1e-6*Math.max(1,Math.abs(f),Math.abs(O))&&Math.abs(d-T)<=1e-6*Math.max(1,Math.abs(d),Math.abs(T))&&Math.abs(p-I)<=1e-6*Math.max(1,Math.abs(p),Math.abs(I))&&Math.abs(g-L)<=1e-6*Math.max(1,Math.abs(g),Math.abs(L))&&Math.abs(m-B)<=1e-6*Math.max(1,Math.abs(m),Math.abs(B))&&Math.abs(_-C)<=1e-6*Math.max(1,Math.abs(_),Math.abs(C))}var rr=iS,rn=i7,rs={};function ra(){let t=new tt(4);return tt!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0,t[3]=0),t}function ro(t){let e=new tt(4);return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e}function rl(t,e,i,r){let n=new tt(4);return n[0]=t,n[1]=e,n[2]=i,n[3]=r,n}function ru(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t}function rc(t,e,i,r,n){return t[0]=e,t[1]=i,t[2]=r,t[3]=n,t}function rh(t,e,i){return t[0]=e[0]+i[0],t[1]=e[1]+i[1],t[2]=e[2]+i[2],t[3]=e[3]+i[3],t}function rf(t,e,i){return t[0]=e[0]-i[0],t[1]=e[1]-i[1],t[2]=e[2]-i[2],t[3]=e[3]-i[3],t}function rd(t,e,i){return t[0]=e[0]*i[0],t[1]=e[1]*i[1],t[2]=e[2]*i[2],t[3]=e[3]*i[3],t}function rp(t,e,i){return t[0]=e[0]/i[0],t[1]=e[1]/i[1],t[2]=e[2]/i[2],t[3]=e[3]/i[3],t}function rg(t,e){return t[0]=Math.ceil(e[0]),t[1]=Math.ceil(e[1]),t[2]=Math.ceil(e[2]),t[3]=Math.ceil(e[3]),t}function rm(t,e){return t[0]=Math.floor(e[0]),t[1]=Math.floor(e[1]),t[2]=Math.floor(e[2]),t[3]=Math.floor(e[3]),t}function r_(t,e,i){return t[0]=Math.min(e[0],i[0]),t[1]=Math.min(e[1],i[1]),t[2]=Math.min(e[2],i[2]),t[3]=Math.min(e[3],i[3]),t}function rb(t,e,i){return t[0]=Math.max(e[0],i[0]),t[1]=Math.max(e[1],i[1]),t[2]=Math.max(e[2],i[2]),t[3]=Math.max(e[3],i[3]),t}function rv(t,e){return t[0]=ti(e[0]),t[1]=ti(e[1]),t[2]=ti(e[2]),t[3]=ti(e[3]),t}function ry(t,e,i){return t[0]=e[0]*i,t[1]=e[1]*i,t[2]=e[2]*i,t[3]=e[3]*i,t}function rE(t,e,i,r){return t[0]=e[0]+i[0]*r,t[1]=e[1]+i[1]*r,t[2]=e[2]+i[2]*r,t[3]=e[3]+i[3]*r,t}function rM(t,e){let i=e[0]-t[0],r=e[1]-t[1],n=e[2]-t[2],s=e[3]-t[3];return Math.sqrt(i*i+r*r+n*n+s*s)}function rw(t,e){let i=e[0]-t[0],r=e[1]-t[1],n=e[2]-t[2],s=e[3]-t[3];return i*i+r*r+n*n+s*s}function rx(t){let e=t[0],i=t[1],r=t[2],n=t[3];return Math.sqrt(e*e+i*i+r*r+n*n)}function rP(t){let e=t[0],i=t[1],r=t[2],n=t[3];return e*e+i*i+r*r+n*n}function rA(t,e){return t[0]=-e[0],t[1]=-e[1],t[2]=-e[2],t[3]=-e[3],t}function rS(t,e){return t[0]=1/e[0],t[1]=1/e[1],t[2]=1/e[2],t[3]=1/e[3],t}function rO(t,e){let i=e[0],r=e[1],n=e[2],s=e[3],a=i*i+r*r+n*n+s*s;return a>0&&(a=1/Math.sqrt(a)),t[0]=i*a,t[1]=r*a,t[2]=n*a,t[3]=s*a,t}function rT(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]+t[3]*e[3]}function rI(t,e,i,r){let n=i[0]*r[1]-i[1]*r[0],s=i[0]*r[2]-i[2]*r[0],a=i[0]*r[3]-i[3]*r[0],o=i[1]*r[2]-i[2]*r[1],l=i[1]*r[3]-i[3]*r[1],u=i[2]*r[3]-i[3]*r[2],c=e[0],h=e[1],f=e[2],d=e[3];return t[0]=h*u-f*l+d*o,t[1]=-(c*u)+f*a-d*s,t[2]=c*l-h*a+d*n,t[3]=-(c*o)+h*s-f*n,t}function rL(t,e,i,r){let n=e[0],s=e[1],a=e[2],o=e[3];return t[0]=n+r*(i[0]-n),t[1]=s+r*(i[1]-s),t[2]=a+r*(i[2]-a),t[3]=o+r*(i[3]-o),t}function rB(t,e){let i,r,n,s,a,o;e=void 0===e?1:e;do a=(i=2*te()-1)*i+(r=2*te()-1)*r;while(a>=1)do o=(n=2*te()-1)*n+(s=2*te()-1)*s;while(o>=1)let l=Math.sqrt((1-a)/o);return t[0]=e*i,t[1]=e*r,t[2]=e*n*l,t[3]=e*s*l,t}function rC(t,e,i){let r=e[0],n=e[1],s=e[2],a=e[3];return t[0]=i[0]*r+i[4]*n+i[8]*s+i[12]*a,t[1]=i[1]*r+i[5]*n+i[9]*s+i[13]*a,t[2]=i[2]*r+i[6]*n+i[10]*s+i[14]*a,t[3]=i[3]*r+i[7]*n+i[11]*s+i[15]*a,t}function rR(t,e,i){let r=e[0],n=e[1],s=e[2],a=i[0],o=i[1],l=i[2],u=i[3],c=u*r+o*s-l*n,h=u*n+l*r-a*s,f=u*s+a*n-o*r,d=-a*r-o*n-l*s;return t[0]=c*u+-(d*a)+-(h*l)- -(f*o),t[1]=h*u+-(d*o)+-(f*a)- -(c*l),t[2]=f*u+-(d*l)+-(c*o)- -(h*a),t[3]=e[3],t}function rN(t){return t[0]=0,t[1]=0,t[2]=0,t[3]=0,t}function rk(t){return`vec4(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`}function rz(t,e){return t[0]===e[0]&&t[1]===e[1]&&t[2]===e[2]&&t[3]===e[3]}function rj(t,e){let i=t[0],r=t[1],n=t[2],s=t[3],a=e[0],o=e[1],l=e[2],u=e[3];return Math.abs(i-a)<=1e-6*Math.max(1,Math.abs(i),Math.abs(a))&&Math.abs(r-o)<=1e-6*Math.max(1,Math.abs(r),Math.abs(o))&&Math.abs(n-l)<=1e-6*Math.max(1,Math.abs(n),Math.abs(l))&&Math.abs(s-u)<=1e-6*Math.max(1,Math.abs(s),Math.abs(u))}P(rs,{add:()=>rh,ceil:()=>rg,clone:()=>ro,copy:()=>ru,create:()=>ra,cross:()=>rI,dist:()=>rV,distance:()=>rM,div:()=>rD,divide:()=>rp,dot:()=>rT,equals:()=>rj,exactEquals:()=>rz,floor:()=>rm,forEach:()=>rG,fromValues:()=>rl,inverse:()=>rS,len:()=>rY,length:()=>rx,lerp:()=>rL,max:()=>rb,min:()=>r_,mul:()=>rF,multiply:()=>rd,negate:()=>rA,normalize:()=>rO,random:()=>rB,round:()=>rv,scale:()=>ry,scaleAndAdd:()=>rE,set:()=>rc,sqrDist:()=>r$,sqrLen:()=>rq,squaredDistance:()=>rw,squaredLength:()=>rP,str:()=>rk,sub:()=>rU,subtract:()=>rf,transformMat4:()=>rC,transformQuat:()=>rR,zero:()=>rN});var rU=rf,rF=rd,rD=rp,rV=rM,r$=rw,rY=rx,rq=rP,rG=(r=ra(),function(t,e,i,n,s,a){let o,l;for(e||(e=4),i||(i=0),l=n?Math.min(n*e+i,t.length):t.length,o=i;o<l;o+=e)r[0]=t[o],r[1]=t[o+1],r[2]=t[o+2],r[3]=t[o+3],s(r,r,a),t[o]=r[0],t[o+1]=r[1],t[o+2]=r[2],t[o+3]=r[3];return t});(h=_||(_={}))[h.COL0ROW0=0]="COL0ROW0",h[h.COL0ROW1=1]="COL0ROW1",h[h.COL0ROW2=2]="COL0ROW2",h[h.COL0ROW3=3]="COL0ROW3",h[h.COL1ROW0=4]="COL1ROW0",h[h.COL1ROW1=5]="COL1ROW1",h[h.COL1ROW2=6]="COL1ROW2",h[h.COL1ROW3=7]="COL1ROW3",h[h.COL2ROW0=8]="COL2ROW0",h[h.COL2ROW1=9]="COL2ROW1",h[h.COL2ROW2=10]="COL2ROW2",h[h.COL2ROW3=11]="COL2ROW3",h[h.COL3ROW0=12]="COL3ROW0",h[h.COL3ROW1=13]="COL3ROW1",h[h.COL3ROW2=14]="COL3ROW2",h[h.COL3ROW3=15]="COL3ROW3";var rW=45*Math.PI/180,rX=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),rZ=class extends eD{static get IDENTITY(){return v||Object.freeze(v=new rZ),v}static get ZERO(){return b||Object.freeze(b=new rZ([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),b}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return _}constructor(t){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),1==arguments.length&&Array.isArray(t)?this.copy(t):this.identity()}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this[3]=t[3],this[4]=t[4],this[5]=t[5],this[6]=t[6],this[7]=t[7],this[8]=t[8],this[9]=t[9],this[10]=t[10],this[11]=t[11],this[12]=t[12],this[13]=t[13],this[14]=t[14],this[15]=t[15],this.check()}set(t,e,i,r,n,s,a,o,l,u,c,h,f,d,p,g){return this[0]=t,this[1]=e,this[2]=i,this[3]=r,this[4]=n,this[5]=s,this[6]=a,this[7]=o,this[8]=l,this[9]=u,this[10]=c,this[11]=h,this[12]=f,this[13]=d,this[14]=p,this[15]=g,this.check()}setRowMajor(t,e,i,r,n,s,a,o,l,u,c,h,f,d,p,g){return this[0]=t,this[1]=n,this[2]=l,this[3]=f,this[4]=e,this[5]=s,this[6]=u,this[7]=d,this[8]=i,this[9]=a,this[10]=c,this[11]=p,this[12]=r,this[13]=o,this[14]=h,this[15]=g,this.check()}toRowMajor(t){return t[0]=this[0],t[1]=this[4],t[2]=this[8],t[3]=this[12],t[4]=this[1],t[5]=this[5],t[6]=this[9],t[7]=this[13],t[8]=this[2],t[9]=this[6],t[10]=this[10],t[11]=this[14],t[12]=this[3],t[13]=this[7],t[14]=this[11],t[15]=this[15],t}identity(){return this.copy(rX)}fromObject(t){return this.check()}fromQuaternion(t){return iX(this,t),this.check()}frustum(t){var e,i,r,n,s,a;let{left:o,right:l,bottom:u,top:c,near:h=.1,far:f=500}=t;return f===1/0?(e=this,i=o,r=l,n=u,s=c,a=h,e[0]=2*a/(r-i),e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=2*a/(s-n),e[6]=0,e[7]=0,e[8]=(r+i)/(r-i),e[9]=(s+n)/(s-n),e[10]=-1,e[11]=-1,e[12]=0,e[13]=0,e[14]=-2*a,e[15]=0):iZ(this,o,l,u,c,h,f),this.check()}lookAt(t){let{eye:e,center:i=[0,0,0],up:r=[0,1,0]}=t;return i3(this,e,i,r),this.check()}ortho(t){let{left:e,right:i,bottom:r,top:n,near:s=.1,far:a=500}=t;return i1(this,e,i,r,n,s,a),this.check()}orthographic(t){let{fovy:e=rW,aspect:i=1,focalDistance:r=1,near:n=.1,far:s=500}=t;rH(e);let a=r*Math.tan(e/2),o=a*i;return this.ortho({left:-o,right:o,bottom:-a,top:a,near:n,far:s})}perspective(t){let{fovy:e=45*Math.PI/180,aspect:i=1,near:r=.1,far:n=500}=t;return rH(e),iK(this,e,i,r,n),this.check()}determinant(){return iA(this)}getScale(t=[-0,-0,-0]){return t[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),t[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),t[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),t}getTranslation(t=[-0,-0,-0]){return t[0]=this[12],t[1]=this[13],t[2]=this[14],t}getRotation(t,e){t=t||[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],e=e||[-0,-0,-0];let i=this.getScale(e),r=1/i[0],n=1/i[1],s=1/i[2];return t[0]=this[0]*r,t[1]=this[1]*n,t[2]=this[2]*s,t[3]=0,t[4]=this[4]*r,t[5]=this[5]*n,t[6]=this[6]*s,t[7]=0,t[8]=this[8]*r,t[9]=this[9]*n,t[10]=this[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}getRotationMatrix3(t,e){t=t||[-0,-0,-0,-0,-0,-0,-0,-0,-0],e=e||[-0,-0,-0];let i=this.getScale(e),r=1/i[0],n=1/i[1],s=1/i[2];return t[0]=this[0]*r,t[1]=this[1]*n,t[2]=this[2]*s,t[3]=this[4]*r,t[4]=this[5]*n,t[5]=this[6]*s,t[6]=this[8]*r,t[7]=this[9]*n,t[8]=this[10]*s,t}transpose(){return iw(this,this),this.check()}invert(){return ix(this,this),this.check()}multiplyLeft(t){return iS(this,t,this),this.check()}multiplyRight(t){return iS(this,this,t),this.check()}rotateX(t){return iL(this,this,t),this.check()}rotateY(t){return iB(this,this,t),this.check()}rotateZ(t){return iC(this,this,t),this.check()}rotateXYZ(t){return this.rotateX(t[0]).rotateY(t[1]).rotateZ(t[2])}rotateAxis(t,e){return iI(this,this,t,e),this.check()}scale(t){return iT(this,this,Array.isArray(t)?t:[t,t,t]),this.check()}translate(t){return iO(this,this,t),this.check()}transform(t,e){return 4===t.length?(H(e=rC(e||[-0,-0,-0,-0],t,this),4),e):this.transformAsPoint(t,e)}transformAsPoint(t,e){let i,{length:r}=t;switch(r){case 2:i=tC(e||[-0,-0],t,this);break;case 3:i=ev(e||[-0,-0,-0],t,this);break;default:throw Error("Illegal vector")}return H(i,t.length),i}transformAsVector(t,e){let i;switch(t.length){case 2:i=tX(e||[-0,-0],t,this);break;case 3:i=tZ(e||[-0,-0,-0],t,this);break;default:throw Error("Illegal vector")}return H(i,t.length),i}transformPoint(t,e){return this.transformAsPoint(t,e)}transformVector(t,e){return this.transformAsPoint(t,e)}transformDirection(t,e){return this.transformAsVector(t,e)}makeRotationX(t){return this.identity().rotateX(t)}makeTranslation(t,e,i){return this.identity().translate([t,e,i])}};function rH(t){if(t>2*Math.PI)throw Error("expected radians")}var rK={};function rJ(){let t=new tt(4);return tt!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t[3]=1,t}function rQ(t){return t[0]=0,t[1]=0,t[2]=0,t[3]=1,t}function r0(t,e,i){let r=Math.sin(i*=.5);return t[0]=r*e[0],t[1]=r*e[1],t[2]=r*e[2],t[3]=Math.cos(i),t}function r1(t,e){let i=2*Math.acos(e[3]),r=Math.sin(i/2);return r>1e-6?(t[0]=e[0]/r,t[1]=e[1]/r,t[2]=e[2]/r):(t[0]=1,t[1]=0,t[2]=0),i}function r2(t,e){let i=nd(t,e);return Math.acos(2*i*i-1)}function r3(t,e,i){let r=e[0],n=e[1],s=e[2],a=e[3],o=i[0],l=i[1],u=i[2],c=i[3];return t[0]=r*c+a*o+n*u-s*l,t[1]=n*c+a*l+s*o-r*u,t[2]=s*c+a*u+r*l-n*o,t[3]=a*c-r*o-n*l-s*u,t}function r4(t,e,i){i*=.5;let r=e[0],n=e[1],s=e[2],a=e[3],o=Math.sin(i),l=Math.cos(i);return t[0]=r*l+a*o,t[1]=n*l+s*o,t[2]=s*l-n*o,t[3]=a*l-r*o,t}function r6(t,e,i){i*=.5;let r=e[0],n=e[1],s=e[2],a=e[3],o=Math.sin(i),l=Math.cos(i);return t[0]=r*l-s*o,t[1]=n*l+a*o,t[2]=s*l+r*o,t[3]=a*l-n*o,t}function r5(t,e,i){i*=.5;let r=e[0],n=e[1],s=e[2],a=e[3],o=Math.sin(i),l=Math.cos(i);return t[0]=r*l+n*o,t[1]=n*l-r*o,t[2]=s*l+a*o,t[3]=a*l-s*o,t}function r8(t,e){let i=e[0],r=e[1],n=e[2];return t[0]=i,t[1]=r,t[2]=n,t[3]=Math.sqrt(Math.abs(1-i*i-r*r-n*n)),t}function r7(t,e){let i=e[0],r=e[1],n=e[2],s=e[3],a=Math.sqrt(i*i+r*r+n*n),o=Math.exp(s),l=a>0?o*Math.sin(a)/a:0;return t[0]=i*l,t[1]=r*l,t[2]=n*l,t[3]=o*Math.cos(a),t}function r9(t,e){let i=e[0],r=e[1],n=e[2],s=e[3],a=Math.sqrt(i*i+r*r+n*n),o=a>0?Math.atan2(a,s)/a:0;return t[0]=i*o,t[1]=r*o,t[2]=n*o,t[3]=.5*Math.log(i*i+r*r+n*n+s*s),t}function nt(t,e,i){return r9(t,e),nf(t,t,i),r7(t,t),t}function ne(t,e,i,r){let n,s,a,o,l,u=e[0],c=e[1],h=e[2],f=e[3],d=i[0],p=i[1],g=i[2],m=i[3];return(n=u*d+c*p+h*g+f*m)<0&&(n=-n,d=-d,p=-p,g=-g,m=-m),1-n>1e-6?(l=Math.sin(s=Math.acos(n)),a=Math.sin((1-r)*s)/l,o=Math.sin(r*s)/l):(a=1-r,o=r),t[0]=a*u+o*d,t[1]=a*c+o*p,t[2]=a*h+o*g,t[3]=a*f+o*m,t}function ni(t,e){let i=e[0],r=e[1],n=e[2],s=e[3],a=i*i+r*r+n*n+s*s,o=a?1/a:0;return t[0]=-i*o,t[1]=-r*o,t[2]=-n*o,t[3]=s*o,t}function nr(t,e){return t[0]=-e[0],t[1]=-e[1],t[2]=-e[2],t[3]=e[3],t}function nn(t,e){let i,r=e[0]+e[4]+e[8];if(r>0)i=Math.sqrt(r+1),t[3]=.5*i,i=.5/i,t[0]=(e[5]-e[7])*i,t[1]=(e[6]-e[2])*i,t[2]=(e[1]-e[3])*i;else{let r=0;e[4]>e[0]&&(r=1),e[8]>e[3*r+r]&&(r=2);let n=(r+1)%3,s=(r+2)%3;i=Math.sqrt(e[3*r+r]-e[3*n+n]-e[3*s+s]+1),t[r]=.5*i,i=.5/i,t[3]=(e[3*n+s]-e[3*s+n])*i,t[n]=(e[3*n+r]+e[3*r+n])*i,t[s]=(e[3*s+r]+e[3*r+s])*i}return t}function ns(t){return`quat(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`}P(rK,{add:()=>nc,calculateW:()=>r8,clone:()=>na,conjugate:()=>nr,copy:()=>nl,create:()=>rJ,dot:()=>nd,equals:()=>nE,exactEquals:()=>ny,exp:()=>r7,fromMat3:()=>nn,fromValues:()=>no,getAngle:()=>r2,getAxisAngle:()=>r1,identity:()=>rQ,invert:()=>ni,len:()=>nm,length:()=>ng,lerp:()=>np,ln:()=>r9,mul:()=>nh,multiply:()=>r3,normalize:()=>nv,pow:()=>nt,rotateX:()=>r4,rotateY:()=>r6,rotateZ:()=>r5,rotationTo:()=>nM,scale:()=>nf,set:()=>nu,setAxes:()=>nx,setAxisAngle:()=>r0,slerp:()=>ne,sqlerp:()=>nw,sqrLen:()=>nb,squaredLength:()=>n_,str:()=>ns});var na=ro,no=rl,nl=ru,nu=rc,nc=rh,nh=r3,nf=ry,nd=rT,np=rL,ng=rx,nm=ng,n_=rP,nb=n_,nv=rO,ny=rz;function nE(t,e){return Math.abs(rT(t,e))>=.999999}var nM=(n=tQ(),s=t2(1,0,0),a=t2(0,1,0),function(t,e,i){let r=ef(e,i);return r<-.999999?(ed(n,s,e),1e-6>eN(n)&&ed(n,a,e),eh(n,n),r0(t,n,Math.PI),t):r>.999999?(t[0]=0,t[1]=0,t[2]=0,t[3]=1,t):(ed(n,e,i),t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=1+r,nv(t,t))}),nw=(o=rJ(),l=rJ(),function(t,e,i,r,n,s){return ne(o,e,n,s),ne(l,i,r,s),ne(t,o,l,2*s*(1-s)),t}),nx=(u=e$(),function(t,e,i,r){return u[0]=i[0],u[3]=i[1],u[6]=i[2],u[1]=r[0],u[4]=r[1],u[7]=r[2],u[2]=-e[0],u[5]=-e[1],u[8]=-e[2],nv(t,nn(t,u))}),nP=[0,0,0,1],nA=class extends X{constructor(t=0,e=0,i=0,r=1){super(-0,-0,-0,-0),Array.isArray(t)&&1==arguments.length?this.copy(t):this.set(t,e,i,r)}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this[3]=t[3],this.check()}set(t,e,i,r){return this[0]=t,this[1]=e,this[2]=i,this[3]=r,this.check()}fromObject(t){return this[0]=t.x,this[1]=t.y,this[2]=t.z,this[3]=t.w,this.check()}fromMatrix3(t){return nn(this,t),this.check()}fromAxisRotation(t,e){return r0(this,t,e),this.check()}identity(){return rQ(this),this.check()}setAxisAngle(t,e){return this.fromAxisRotation(t,e)}get ELEMENTS(){return 4}get x(){return this[0]}set x(t){this[0]=Z(t)}get y(){return this[1]}set y(t){this[1]=Z(t)}get z(){return this[2]}set z(t){this[2]=Z(t)}get w(){return this[3]}set w(t){this[3]=Z(t)}len(){return ng(this)}lengthSquared(){return n_(this)}dot(t){return nd(this,t)}rotationTo(t,e){return nM(this,t,e),this.check()}add(t){return nc(this,this,t),this.check()}calculateW(){return r8(this,this),this.check()}conjugate(){return nr(this,this),this.check()}invert(){return ni(this,this),this.check()}lerp(t,e,i){return void 0===i?this.lerp(this,t,e):(np(this,t,e,i),this.check())}multiplyRight(t){return r3(this,this,t),this.check()}multiplyLeft(t){return r3(this,t,this),this.check()}normalize(){let t=this.len(),e=t>0?1/t:0;return this[0]=this[0]*e,this[1]=this[1]*e,this[2]=this[2]*e,this[3]=this[3]*e,0===t&&(this[3]=1),this.check()}rotateX(t){return r4(this,this,t),this.check()}rotateY(t){return r6(this,this,t),this.check()}rotateZ(t){return r5(this,this,t),this.check()}scale(t){return nf(this,this,t),this.check()}slerp(t,e,i){let r,n,s;switch(arguments.length){case 1:({start:r=nP,target:n,ratio:s}=t);break;case 2:r=this,n=t,s=e;break;default:r=t,n=e,s=i}return ne(this,r,n,s),this.check()}transformVector4(t,e=new eF){return rR(e,t,this),H(e,4)}lengthSq(){return this.lengthSquared()}setFromAxisAngle(t,e){return this.setAxisAngle(t,e)}premultiply(t){return this.multiplyLeft(t)}multiply(t){return this.multiplyRight(t)}},nS=class{constructor({phi:t=0,theta:e=0,radius:i=1,bearing:r,pitch:n,altitude:s,radiusScale:a=6371e3}={}){this.phi=t,this.theta=e,this.radius=i||s||1,this.radiusScale=a||1,void 0!==r&&(this.bearing=r),void 0!==n&&(this.pitch=n),this.check()}toString(){return this.formatString(T)}formatString({printTypes:t=!1}){let e=L;return`${t?"Spherical":""}[rho:${e(this.radius)},theta:${e(this.theta)},phi:${e(this.phi)}]`}equals(t){return q(this.radius,t.radius)&&q(this.theta,t.theta)&&q(this.phi,t.phi)}exactEquals(t){return this.radius===t.radius&&this.theta===t.theta&&this.phi===t.phi}get bearing(){return 180-z(this.phi)}set bearing(t){this.phi=Math.PI-k(t)}get pitch(){return z(this.theta)}set pitch(t){this.theta=k(t)}get longitude(){return z(this.phi)}get latitude(){return z(this.theta)}get lng(){return z(this.phi)}get lat(){return z(this.theta)}get z(){return(this.radius-1)*this.radiusScale}set(t,e,i){return this.radius=t,this.phi=e,this.theta=i,this.check()}clone(){return new nS().copy(this)}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this.check()}fromLngLatZ([t,e,i]){return this.radius=1+i/this.radiusScale,this.phi=k(e),this.theta=k(t),this.check()}fromVector3(t){return this.radius=t1(t),this.radius>0&&(this.theta=Math.atan2(t[0],t[1]),this.phi=Math.acos(Y(t[2]/this.radius,-1,1))),this.check()}toVector3(){return new eU(0,0,this.radius).rotateX({radians:this.theta}).rotateZ({radians:this.phi})}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}check(){if(!Number.isFinite(this.phi)||!Number.isFinite(this.theta)||!(this.radius>0))throw Error("SphericalCoordinates: some fields set to invalid numbers");return this}},nO="Unknown Euler angle order";(f=y||(y={}))[f.ZYX=0]="ZYX",f[f.YXZ=1]="YXZ",f[f.XZY=2]="XZY",f[f.ZXY=3]="ZXY",f[f.YZX=4]="YZX",f[f.XYZ=5]="XYZ";var nT=class extends X{static get ZYX(){return y.ZYX}static get YXZ(){return y.YXZ}static get XZY(){return y.XZY}static get ZXY(){return y.ZXY}static get YZX(){return y.YZX}static get XYZ(){return y.XYZ}static get RollPitchYaw(){return y.ZYX}static get DefaultOrder(){return y.ZYX}static get RotationOrders(){return y}static rotationOrder(t){return y[t]}get ELEMENTS(){return 4}constructor(t=0,e=0,i=0,r=nT.DefaultOrder){super(-0,-0,-0,-0),arguments.length>0&&Array.isArray(arguments[0])?this.fromVector3(...arguments):this.set(t,e,i,r)}fromQuaternion(t){let[e,i,r,n]=t,s=i*i,a=-2*(e*r-n*i),o=Math.atan2(2*(i*r+n*e),-2*(e*e+s)+1),l=Math.asin(a=(a=a>1?1:a)<-1?-1:a),u=Math.atan2(2*(e*i+n*r),-2*(s+r*r)+1);return this.set(o,l,u,nT.RollPitchYaw)}fromObject(t){throw Error("not implemented")}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this[3]=Number.isFinite(t[3])||this.order,this.check()}set(t=0,e=0,i=0,r){return this[0]=t,this[1]=e,this[2]=i,this[3]=Number.isFinite(r)?r:this[3],this.check()}validate(){var t;return(t=this[3])>=0&&t<6&&Number.isFinite(this[0])&&Number.isFinite(this[1])&&Number.isFinite(this[2])}toArray(t=[],e=0){return t[e]=this[0],t[e+1]=this[1],t[e+2]=this[2],t}toArray4(t=[],e=0){return t[e]=this[0],t[e+1]=this[1],t[e+2]=this[2],t[e+3]=this[3],t}toVector3(t=[-0,-0,-0]){return t[0]=this[0],t[1]=this[1],t[2]=this[2],t}get x(){return this[0]}set x(t){this[0]=Z(t)}get y(){return this[1]}set y(t){this[1]=Z(t)}get z(){return this[2]}set z(t){this[2]=Z(t)}get alpha(){return this[0]}set alpha(t){this[0]=Z(t)}get beta(){return this[1]}set beta(t){this[1]=Z(t)}get gamma(){return this[2]}set gamma(t){this[2]=Z(t)}get phi(){return this[0]}set phi(t){this[0]=Z(t)}get theta(){return this[1]}set theta(t){this[1]=Z(t)}get psi(){return this[2]}set psi(t){this[2]=Z(t)}get roll(){return this[0]}set roll(t){this[0]=Z(t)}get pitch(){return this[1]}set pitch(t){this[1]=Z(t)}get yaw(){return this[2]}set yaw(t){this[2]=Z(t)}get order(){return this[3]}set order(t){this[3]=function(t){if(t<0&&t>=6)throw Error(nO);return t}(t)}fromVector3(t,e){return this.set(t[0],t[1],t[2],Number.isFinite(e)?e:this[3])}fromArray(t,e=0){return this[0]=t[0+e],this[1]=t[1+e],this[2]=t[2+e],void 0!==t[3]&&(this[3]=t[3]),this.check()}fromRollPitchYaw(t,e,i){return this.set(t,e,i,y.ZYX)}fromRotationMatrix(t,e=nT.DefaultOrder){return this._fromRotationMatrix(t,e),this.check()}getRotationMatrix(t){return this._getRotationMatrix(t)}getQuaternion(){let t=new nA;switch(this[3]){case y.XYZ:return t.rotateX(this[0]).rotateY(this[1]).rotateZ(this[2]);case y.YXZ:return t.rotateY(this[0]).rotateX(this[1]).rotateZ(this[2]);case y.ZXY:return t.rotateZ(this[0]).rotateX(this[1]).rotateY(this[2]);case y.ZYX:return t.rotateZ(this[0]).rotateY(this[1]).rotateX(this[2]);case y.YZX:return t.rotateY(this[0]).rotateZ(this[1]).rotateX(this[2]);case y.XZY:return t.rotateX(this[0]).rotateZ(this[1]).rotateY(this[2]);default:throw Error(nO)}}_fromRotationMatrix(t,e=nT.DefaultOrder){let i=t[0],r=t[4],n=t[8],s=t[1],a=t[5],o=t[9],l=t[2],u=t[6],c=t[10];switch(e=e||this[3]){case nT.XYZ:this[1]=Math.asin(Y(n,-1,1)),.99999>Math.abs(n)?(this[0]=Math.atan2(-o,c),this[2]=Math.atan2(-r,i)):(this[0]=Math.atan2(u,a),this[2]=0);break;case nT.YXZ:this[0]=Math.asin(-Y(o,-1,1)),.99999>Math.abs(o)?(this[1]=Math.atan2(n,c),this[2]=Math.atan2(s,a)):(this[1]=Math.atan2(-l,i),this[2]=0);break;case nT.ZXY:this[0]=Math.asin(Y(u,-1,1)),.99999>Math.abs(u)?(this[1]=Math.atan2(-l,c),this[2]=Math.atan2(-r,a)):(this[1]=0,this[2]=Math.atan2(s,i));break;case nT.ZYX:this[1]=Math.asin(-Y(l,-1,1)),.99999>Math.abs(l)?(this[0]=Math.atan2(u,c),this[2]=Math.atan2(s,i)):(this[0]=0,this[2]=Math.atan2(-r,a));break;case nT.YZX:this[2]=Math.asin(Y(s,-1,1)),.99999>Math.abs(s)?(this[0]=Math.atan2(-o,a),this[1]=Math.atan2(-l,i)):(this[0]=0,this[1]=Math.atan2(n,c));break;case nT.XZY:this[2]=Math.asin(-Y(r,-1,1)),.99999>Math.abs(r)?(this[0]=Math.atan2(u,a),this[1]=Math.atan2(n,i)):(this[0]=Math.atan2(-o,c),this[1]=0);break;default:throw Error(nO)}return this[3]=e,this}_getRotationMatrix(t){let e=t||[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],i=this.x,r=this.y,n=this.z,s=Math.cos(i),a=Math.cos(r),o=Math.cos(n),l=Math.sin(i),u=Math.sin(r),c=Math.sin(n);switch(this[3]){case nT.XYZ:{let t=s*o,i=s*c,r=l*o,n=l*c;e[0]=a*o,e[4]=-a*c,e[8]=u,e[1]=i+r*u,e[5]=t-n*u,e[9]=-l*a,e[2]=n-t*u,e[6]=r+i*u,e[10]=s*a;break}case nT.YXZ:{let t=a*o,i=a*c,r=u*o,n=u*c;e[0]=t+n*l,e[4]=r*l-i,e[8]=s*u,e[1]=s*c,e[5]=s*o,e[9]=-l,e[2]=i*l-r,e[6]=n+t*l,e[10]=s*a;break}case nT.ZXY:{let t=a*o,i=a*c,r=u*o,n=u*c;e[0]=t-n*l,e[4]=-s*c,e[8]=r+i*l,e[1]=i+r*l,e[5]=s*o,e[9]=n-t*l,e[2]=-s*u,e[6]=l,e[10]=s*a;break}case nT.ZYX:{let t=s*o,i=s*c,r=l*o,n=l*c;e[0]=a*o,e[4]=r*u-i,e[8]=t*u+n,e[1]=a*c,e[5]=n*u+t,e[9]=i*u-r,e[2]=-u,e[6]=l*a,e[10]=s*a;break}case nT.YZX:{let t=s*a,i=s*u,r=l*a,n=l*u;e[0]=a*o,e[4]=n-t*c,e[8]=r*c+i,e[1]=c,e[5]=s*o,e[9]=-l*o,e[2]=-u*o,e[6]=i*c+r,e[10]=t-n*c;break}case nT.XZY:{let t=s*a,i=s*u,r=l*a,n=l*u;e[0]=a*o,e[4]=-c,e[8]=u*o,e[1]=t*c+n,e[5]=s*o,e[9]=i*c-r,e[2]=r*c-i,e[6]=l*o,e[10]=n*c+t;break}default:throw Error(nO)}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}toQuaternion(){let t=Math.cos(.5*this.yaw),e=Math.sin(.5*this.yaw),i=Math.cos(.5*this.roll),r=Math.sin(.5*this.roll),n=Math.cos(.5*this.pitch),s=Math.sin(.5*this.pitch);return new nA(t*r*n-e*i*s,t*i*s+e*r*n,e*i*n-t*r*s,t*i*n+e*r*s)}},nI=class{constructor({x:t=0,y:e=0,z:i=0,roll:r=0,pitch:n=0,yaw:s=0,position:a,orientation:o}={}){Array.isArray(a)&&3===a.length?this.position=new eU(a):this.position=new eU(t,e,i),Array.isArray(o)&&4===o.length?this.orientation=new nT(o,o[3]):this.orientation=new nT(r,n,s,nT.RollPitchYaw)}get x(){return this.position.x}set x(t){this.position.x=t}get y(){return this.position.y}set y(t){this.position.y=t}get z(){return this.position.z}set z(t){this.position.z=t}get roll(){return this.orientation.roll}set roll(t){this.orientation.roll=t}get pitch(){return this.orientation.pitch}set pitch(t){this.orientation.pitch=t}get yaw(){return this.orientation.yaw}set yaw(t){this.orientation.yaw=t}getPosition(){return this.position}getOrientation(){return this.orientation}equals(t){return!!t&&this.position.equals(t.position)&&this.orientation.equals(t.orientation)}exactEquals(t){return!!t&&this.position.exactEquals(t.position)&&this.orientation.exactEquals(t.orientation)}getTransformationMatrix(){let t=Math.sin(this.roll),e=Math.sin(this.pitch),i=Math.sin(this.yaw),r=Math.cos(this.roll),n=Math.cos(this.pitch),s=Math.cos(this.yaw);return new rZ().setRowMajor(s*n,-i*r+s*e*t,i*t+s*e*r,this.x,i*n,s*r+i*e*t,-s*t+i*e*r,this.y,-e,n*t,n*r,this.z,0,0,0,1)}getTransformationMatrixFromPose(t){return new rZ().multiplyRight(this.getTransformationMatrix()).multiplyRight(t.getTransformationMatrix().invert())}getTransformationMatrixToPose(t){return new rZ().multiplyRight(t.getTransformationMatrix()).multiplyRight(this.getTransformationMatrix().invert())}},nL={};P(nL,{EPSILON1:()=>nB,EPSILON10:()=>nD,EPSILON11:()=>nV,EPSILON12:()=>n$,EPSILON13:()=>nY,EPSILON14:()=>nq,EPSILON15:()=>nG,EPSILON16:()=>nW,EPSILON17:()=>nX,EPSILON18:()=>nZ,EPSILON19:()=>nH,EPSILON2:()=>nC,EPSILON20:()=>nK,EPSILON3:()=>nR,EPSILON4:()=>nN,EPSILON5:()=>nk,EPSILON6:()=>nz,EPSILON7:()=>nj,EPSILON8:()=>nU,EPSILON9:()=>nF,PI_OVER_FOUR:()=>nQ,PI_OVER_SIX:()=>n0,PI_OVER_TWO:()=>nJ,TWO_PI:()=>n1});var nB=.1,nC=.01,nR=.001,nN=1e-4,nk=1e-5,nz=1e-6,nj=1e-7,nU=1e-8,nF=1e-9,nD=1e-10,nV=1e-11,n$=1e-12,nY=1e-13,nq=1e-14,nG=1e-15,nW=1e-16,nX=1e-17,nZ=1e-18,nH=1e-19,nK=1e-20,nJ=Math.PI/2,nQ=Math.PI/4,n0=Math.PI/6,n1=2*Math.PI},43411(t,e,i){"use strict";i.d(e,{A:()=>a,k:()=>s});var r=i(3459);let n={};function s(t){n=t}function a(t,e,i,s){r.A.level>0&&n[t]&&n[t].call(null,e,i,s)}},9350(t,e,i){"use strict";i.d(e,{Kx:()=>a,We:()=>u,p5:()=>o,rf:()=>s,tg:()=>l});var r=i(3459),n=i(92767);let s={DEFAULT:"default",LNGLAT:"lnglat",METER_OFFSETS:"meter-offsets",LNGLAT_OFFSETS:"lnglat-offsets",CARTESIAN:"cartesian"};Object.defineProperty(s,"IDENTITY",{get:()=>(r.A.deprecated("COORDINATE_SYSTEM.IDENTITY","COORDINATE_SYSTEM.CARTESIAN")(),s.CARTESIAN)});let a={WEB_MERCATOR:1,GLOBE:2,WEB_MERCATOR_AUTO_OFFSET:4,IDENTITY:0},o={common:0,meters:1,pixels:2},l={click:"onClick",dblclick:"onClick",panstart:"onDragStart",panmove:"onDrag",panend:"onDragEnd"},u={multipan:[n.uq,{threshold:10,pointers:2,trackpad:!0}],pinch:[n.h1,{trackpad:!0},null,["multipan"]],pan:[n.uq,{threshold:1},["pinch"],["multipan"]],dblclick:[n.Cx,{event:"dblclick",taps:2,enable:!1}],dblclickdrag:[n.Cp,{event:"dblclickdrag",enable:!1},["dblclick"],null],click:[n.Cx,{event:"click"},["dblclickdrag"],["dblclick","dblclickdrag"]]}},41881(t,e,i){"use strict";i.d(e,{A:()=>ea});var r={};i.r(r),i.d(r,{arithmetic:()=>O,dot:()=>C,equalAll:()=>R,extent:()=>T,fround:()=>I,gather:()=>L,interleave:()=>B,length:()=>N,segmentedMap:()=>k,select:()=>j,sequence:()=>F,swizzle:()=>D});var n=i(26839),s=i(77359),a=i(40462),o=i(57285);let l=o.r.getDataType.bind(o.r);function u(t,e,i){if(e.size>4)return null;let r="webgpu"===i&&"uint8"===e.type?"unorm8":e.type,n=e.size,s=!!("webgpu"!==i&&3===n&&r&&["uint8","sint8","unorm8","snorm8","uint16","sint16","unorm16","snorm16"].includes(r));return{attribute:t,format:n>1?`${r}x${n}${s?"-webgl":""}`:e.type,byteOffset:e.offset||0}}function c(t){return t.stride||t.size*t.bytesPerElement}var h=i(23459),f=i(25667),d=i(3459);function p(t,e){e.offset&&d.A.removed("shaderAttribute.offset","vertexOffset, elementOffset")();let i=c(t),r=(void 0!==e.vertexOffset?e.vertexOffset:t.vertexOffset||0)*i+(e.elementOffset||0)*t.bytesPerElement+(t.offset||0);return{...e,offset:r,stride:i}}class g{constructor(t,e,i){let r;this._buffer=null,this.device=t,this.id=e.id||"",this.size=e.size||1;let n=e.logicalType||e.type,s="float64"===n,{defaultValue:o}=e;o=Number.isFinite(o)?[o]:o||Array(this.size).fill(0),r=s?"float32":!n&&e.isIndexed?"uint32":n||"float32";let l=function(t){switch(t){case"float64":return Float64Array;case"uint8":case"unorm8":return Uint8ClampedArray;default:return(0,a.Ak)(t)}}(n||r);this.doublePrecision=s,s&&!1===e.fp64&&(l=Float32Array),this.value=null,this.settings={...e,defaultType:l,defaultValue:o,logicalType:n,type:r,normalized:r.includes("norm"),size:this.size,bytesPerElement:l.BYTES_PER_ELEMENT},this.state={...i,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let t=this.getAccessor();return t.vertexOffset?t.vertexOffset*c(t):0}get numInstances(){return this.state.numInstances}set numInstances(t){this.state.numInstances=t}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&(this._buffer.delete(),this._buffer=null),h.A.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&"webgpu"!==this.device.type?null:this.state.externalBuffer||this._buffer}getValue(t=this.id,e=null){let i={};if(this.state.constant){let r=this.value;if("webgpu"===this.device.type&&this._buffer)i[t]=this._buffer;else if(e){let n=p(this.getAccessor(),e),s=n.offset/r.BYTES_PER_ELEMENT,a=n.size||this.size;i[t]=r.subarray(s,s+a)}else i[t]=r}else i[t]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?i[`${t}64Low`]=i[t]:i[`${t}64Low`]=new Float32Array(this.size)),i}_getBufferLayout(t=this.id,e=null){let i=this.getAccessor(),r=[],n={name:this.id,byteStride:"webgpu"===this.device.type&&this.state.constant?0:c(i)};if(this.doublePrecision){let n,s={high:n=p(i,e||{}),low:{...n,offset:n.offset+4*i.size}};r.push(u(t,{...i,...s.high},this.device.type),u(`${t}64Low`,{...i,...s.low},this.device.type))}else if(e){let n=p(i,e);r.push(u(t,{...i,...n},this.device.type))}else r.push(u(t,i,this.device.type));return n.attributes=r.filter(Boolean),n}setAccessor(t){this.state.bufferAccessor=t}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let t=null;if(this.state.constant&&this.value){let e=Array.from(this.value);t=[e,e]}else{let{value:e,numInstances:i,size:r}=this,n=i*r;if(e&&n&&e.length>=n){let i=Array(r).fill(1/0),s=Array(r).fill(-1/0);for(let t=0;t<n;)for(let n=0;n<r;n++){let r=e[t++];r<i[n]&&(i[n]=r),r>s[n]&&(s[n]=r)}t=[i,s]}}return this.state.bounds=t,t}setData(t){let e,{state:i}=this;e=ArrayBuffer.isView(t)?{value:t}:t instanceof n.h?{buffer:t}:t;let r={...this.settings,...e};if(ArrayBuffer.isView(e.value)){if(!e.type)if(this.doublePrecision&&e.value instanceof Float64Array)r.type="float32";else{let t=l(e.value);r.type=r.normalized?t.replace("int","norm"):t}r.bytesPerElement=e.value.BYTES_PER_ELEMENT,r.stride=c(r)}if(i.bounds=null,e.constant){let t=e.value;if(t=this._normalizeValue(t,[],0),this.settings.normalized&&(t=this.normalizeConstant(t)),!(!i.constant||!this._areValuesEqual(t,this.value)))return!1;i.externalBuffer=null,i.constant=!0,this.value=ArrayBuffer.isView(t)?t:new Float32Array(t)}else if(e.buffer)i.externalBuffer=e.buffer,i.constant=!1,this.value=e.value||null;else if(e.value){this._checkExternalBuffer(e);let t=e.value,n=t;i.externalBuffer=null,i.constant=!1,this.value=t,this._shouldSplitDoublePrecisionValue(n)&&(n=(0,f.cT)(n,r),t instanceof Float32Array&&(r.stride=2*r.size*Float32Array.BYTES_PER_ELEMENT));let{buffer:s}=this,a=c(r),o=(r.vertexOffset||0)*a;if(this.settings.isIndexed){let t=this.settings.defaultType;n.constructor!==t&&(n=new t(n))}let l=n.byteLength+o+2*a;(!s||s.byteLength<l)&&(s=this._createBuffer(l)),s.write(n,o)}return this.setAccessor(r),!0}updateSubBuffer(t={}){this.state.bounds=null;let e=this.value,{startOffset:i=0,endOffset:r}=t,n=this._shouldSplitDoublePrecisionValue(e);this.buffer.write(n?(0,f.cT)(e,{size:this.size,startIndex:i,endIndex:r}):e.subarray(i,r),i*(n?8:e.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(t,e=!1){let{state:i}=this,r=i.allocatedValue,n=h.A.allocate(r,t+1,{size:this.size,type:this.settings.defaultType,copy:e});this.value=n;let s=this._shouldSplitDoublePrecisionValue(n),a=s&&n instanceof Float32Array?{...this.settings,stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(a);let{byteOffset:o}=this,{buffer:l}=this,u=n.byteLength*(s&&n instanceof Float32Array?2:1);return(!l||l.byteLength<u+o)&&(l=this._createBuffer(u+o),e&&r&&l.write(this._shouldSplitDoublePrecisionValue(r)?(0,f.cT)(r,this):r,o)),i.allocatedValue=n,i.constant=!1,i.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(t){return!!(this.doublePrecision&&(t instanceof Float64Array||"webgpu"===this.device.type&&t instanceof Float32Array))}_checkExternalBuffer(t){let{value:e}=t;if(!ArrayBuffer.isView(e))throw Error(`Attribute ${this.id} value is not TypedArray`);let i=this.settings.defaultType,r=!1;if(this.doublePrecision&&(r=e.BYTES_PER_ELEMENT<4),r)throw Error(`Attribute ${this.id} does not support ${e.constructor.name}`);e instanceof i||!this.settings.normalized||"normalized"in t||d.A.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(t){switch(this.settings.type){case"snorm8":return new Float32Array(t).map(t=>(t+128)/255*2-1);case"snorm16":return new Float32Array(t).map(t=>(t+32768)/65535*2-1);case"unorm8":return new Float32Array(t).map(t=>t/255);case"unorm16":return new Float32Array(t).map(t=>t/65535);default:return t}}_normalizeValue(t,e,i){let{defaultValue:r,size:n}=this.settings;if(Number.isFinite(t))return e[i]=t,e;if(!t){let t=n;for(;--t>=0;)e[i+t]=r[t];return e}switch(n){case 4:e[i+3]=Number.isFinite(t[3])?t[3]:r[3];case 3:e[i+2]=Number.isFinite(t[2])?t[2]:r[2];case 2:e[i+1]=Number.isFinite(t[1])?t[1]:r[1];case 1:e[i+0]=Number.isFinite(t[0])?t[0]:r[0];break;default:let s=n;for(;--s>=0;)e[i+s]=Number.isFinite(t[s])?t[s]:r[s]}return e}_areValuesEqual(t,e){if(!t||!e)return!1;let{size:i}=this;for(let r=0;r<i;r++)if(t[r]!==e[r])return!1;return!0}_createBuffer(t){this._buffer&&this._buffer.destroy();let{isIndexed:e,type:i}=this.settings,r="webgpu"!==this.device.type||e?(e?n.h.INDEX:n.h.VERTEX)|n.h.COPY_DST:n.h.VERTEX|n.h.STORAGE|n.h.COPY_DST|n.h.COPY_SRC;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:r,indexType:e?i:void 0,byteLength:t}),this._buffer}}var m=i(24067),_=i(53439),b=i(38055);let v=[],y=[[0,1/0]],E={interpolation:{duration:0,easing:t=>t},spring:{stiffness:.05,damping:.5}};function M(t,e){if(!t)return null;Number.isFinite(t)&&(t={type:"interpolation",duration:t});let i=t.type||"interpolation";return{...E[i],...e,...t,type:i}}class w extends g{constructor(t,e){super(t,e,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:y}),this.constant=!1,this.settings.update=e.update||(e.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(t){this.state.startIndices=t}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:t=!1}={}){let e=this.state.needsRedraw;return this.state.needsRedraw=e&&!t,e}layoutChanged(){return this.state.layoutChanged}setAccessor(t){var e,i;(e=this.state).layoutChanged||(i=this.getAccessor(),e.layoutChanged=t.type!==i.type||t.size!==i.size||c(t)!==c(i)||(t.offset||0)!==(i.offset||0)),super.setAccessor(t)}getUpdateTriggers(){let{accessor:t}=this.settings;return[this.id].concat("function"!=typeof t&&t||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(t){if(!t||!this.supportsTransition())return null;let{accessor:e}=this.settings,i=this.settings.transition;return M(Array.isArray(e)?t[e.find(e=>t[e])]:t[e],i)}setNeedsUpdate(t=this.id,e){if(this.state.needsUpdate=this.state.needsUpdate||t,this.setNeedsRedraw(t),e){let{startRow:t=0,endRow:i=1/0}=e;this.state.updateRanges=function(t,e){if(t===y||(e[0]<0&&(e[0]=0),e[0]>=e[1]))return t;let i=[],r=t.length,n=0;for(let s=0;s<r;s++){let r=t[s];r[1]<e[0]?(i.push(r),n=s+1):r[0]>e[1]?i.push(r):e=[Math.min(r[0],e[0]),Math.max(r[1],e[1])]}return i.splice(n,0,e),i}(this.state.updateRanges,[t,i])}else this.state.updateRanges=y}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=v}setNeedsRedraw(t=this.id){this.state.needsRedraw=this.state.needsRedraw||t}allocate(t){let{state:e,settings:i}=this;if(i.noAlloc)return!1;if(i.update){let i=this.isConstant;return super.allocate(t,e.updateRanges!==y),e.layoutChanged||(e.layoutChanged=i&&"webgpu"===this.device.type),!0}return!1}updateBuffer({numInstances:t,data:e,props:i,context:r}){if(!this.needsUpdate())return!1;let{state:{updateRanges:n},settings:{update:s,noAlloc:a}}=this,o=!0;if(s){for(let[a,o]of n)s.call(r,this,{data:e,startRow:a,endRow:o,props:i,numInstances:t});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let t=this.value;this.value=null,this.setConstantValue(r,t)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[e,i]of n){let r=Number.isFinite(e)?this.getVertexOffset(e):0,n=Number.isFinite(i)?this.getVertexOffset(i):a||!Number.isFinite(t)?this.value.length:t*this.size;super.updateSubBuffer({startOffset:r,endOffset:n})}this._checkAttributeArray()}else o=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),o}setConstantValue(t,e){var i;if(void 0===e||"function"==typeof e)return!1;let r=this.isConstant,n=this.settings.transform&&t?this.settings.transform.call(t,e):e,s=this.settings.defaultType;this.state.constantValue=this._normalizeValue(n,new s(this.size),0);let a=this.setData({constant:!0,value:n});if("webgpu"===this.device.type){let t=this.state.constantValue;this.doublePrecision&&(t instanceof Float32Array||t instanceof Float64Array)&&(t=(0,f.cT)(t,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}));let e=this._buffer;(!e||e.byteLength<t.byteLength)&&(e=this._createBuffer(t.byteLength)),e.write(t),(i=this.state).layoutChanged||(i.layoutChanged=!r),this.constant=!1}return a&&this.setNeedsRedraw(),this.clearNeedsUpdate(),!0}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(t){let{state:e}=this;return t?(this.clearNeedsUpdate(),e.lastExternalBuffer===t||(e.lastExternalBuffer=t,this.setNeedsRedraw(),this.setData(t),!0)):(e.lastExternalBuffer=null,!1)}setBinaryValue(t,e=null){let{state:i,settings:r}=this;if(!t)return i.binaryValue=null,i.binaryAccessor=null,!1;if(r.noAlloc)return!1;if(i.binaryValue===t)return this.clearNeedsUpdate(),!0;if(i.binaryValue=t,this.setNeedsRedraw(),r.transform||e!==this.startIndices){ArrayBuffer.isView(t)&&(t={value:t});let n=t;(0,m.A)(ArrayBuffer.isView(n.value),`invalid ${r.accessor}`);let s=!!n.size&&n.size!==this.size;return i.binaryAccessor=(0,_.I)(n.value,{size:n.size||this.size,stride:n.stride,offset:n.offset,startIndices:e,nested:s}),!1}return this.clearNeedsUpdate(),this.setData(t),!0}getVertexOffset(t){let{startIndices:e}=this;return(e?t<e.length?e[t]:this.numInstances:t)*this.size}getValue(){let t=this.settings.shaderAttributes,e=super.getValue();if(!t)return e;for(let i in t)Object.assign(e,super.getValue(i,t[i]));return e}getBufferLayout(t){this.state.layoutChanged=!1;let e=this.settings.shaderAttributes,i=super._getBufferLayout(),{stepMode:r}=this.settings;if("dynamic"===r?i.stepMode=t?t.isInstanced?"instance":"vertex":"instance":i.stepMode=r??"vertex",!e)return i;for(let t in e){let r=super._getBufferLayout(t,e[t]);i.attributes.push(...r.attributes)}return i}_autoUpdater(t,{data:e,startRow:i,endRow:r,props:n,numInstances:s}){let{settings:a,state:o,value:l,size:u,startIndices:c}=t,{accessor:h,transform:f}=a,d=o.binaryAccessor||("function"==typeof h?h:n[h]);(0,m.A)("function"==typeof d,`accessor "${h}" is not a function`);let p=t.getVertexOffset(i),{iterable:g,objectInfo:v}=(0,_.X)(e,i,r);for(let e of g){v.index++;let i=d(e,v);if(f&&(i=f.call(this,i)),c){let e=(v.index<c.length-1?c[v.index+1]:s)-c[v.index];if(i&&Array.isArray(i[0])){let e=p;for(let r of i)t._normalizeValue(r,l,e),e+=u}else i&&i.length>u?l.set(i,p):(t._normalizeValue(i,v.target,0),(0,b.R)({target:l,source:v.target,start:p,count:e}));p+=e*u}else t._normalizeValue(i,l,p),p+=u}}_validateAttributeUpdaters(){let{settings:t}=this;if(!(t.noAlloc||"function"==typeof t.update))throw Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:t}=this,e=Math.min(4,this.size);if(t&&t.length>=e){let i=!0;switch(e){case 4:i=i&&Number.isFinite(t[3]);case 3:i=i&&Number.isFinite(t[2]);case 2:i=i&&Number.isFinite(t[1]);case 1:i=i&&Number.isFinite(t[0]);break;default:i=!1}if(!i)throw Error(`Illegal attribute generated for ${this.id}`)}}}var x=i(29651),P=i(78705);function A({elementWise:t,func:e,inputs:i,output:r,outputBuffer:n}){let s=Array.isArray(i)?i:Object.values(i);for(let t of s)if(!t.value)throw Error(`${t} does not have CPU value`);let a=r.length,o=r.size,l=new r.ValueType(a*o);for(let i=0;i<a;i++){let r=s.map(t=>S(t,i));if(t)for(let t=0;t<o;t++)l[i*o+t]=e.apply(null,r.map(e=>e[t]));else e.call(null,l.subarray(i*o,i*o+o),...r)}let u=r.ValueType.BYTES_PER_ELEMENT,c=r.offset/u,h=r.stride/u,f=l;if(0!==c||h!==o){f=new r.ValueType(c+r.byteLength/u);for(let t=0;t<a;t++){let e=t*o,i=c+t*h,r=l.subarray(e,e+o);f.set(r,i),n.write(r,i*u)}}else n.write(l);return{success:!0,value:f}}function S(t,e){let i=t.value,r=t.size,n=t.offset/t.ValueType.BYTES_PER_ELEMENT,s=t.stride/t.ValueType.BYTES_PER_ELEMENT,a=n+(t.isConstant?0:e)*s,o=i.slice(a,a+r);if(!t.normalized)return o;let l=new Float32Array(r);for(let e=0;e<r;e++)l[e]=function(t,e){switch(e){case"uint8":return t/255;case"uint16":return t/65535;case"uint32":return t/0xffffffff;case"sint8":return Math.max(t/127,-1);case"sint16":return Math.max(t/32767,-1);case"sint32":return Math.max(t/0x7fffffff,-1);case"float32":return t;default:throw Error(`Unsupported normalized source type ${e}`)}}(o[e],t.type);return l}let O=({inputs:t,output:e,target:i})=>{for(let e of Object.values(t.namedInputs))if(!e.value)throw Error(`${e} does not have CPU value`);let r=new e.ValueType(e.length*e.size);for(let i=0;i<e.length;i++){let n=Object.fromEntries(Object.entries(t.namedInputs).map(([t,e])=>[t,S(e,i)]));for(let s=0;s<e.size;s++)r[i*e.size+s]=function t(e,i,r){switch(e.kind){case"input":{let t=i[e.name];if(r<t.length)return t[r];return 1===t.length?t[0]:0}case"literal":if(Array.isArray(e.value))return e.value[r]??0;return e.value;case"call":{!function(t,e){let i=P.E[t].arity;if(e!==i)throw Error(`Arithmetic op '${t}' expects ${i} args, got ${e}`)}(e.op,e.args.length);let n=e.args.map(e=>t(e,i,r));switch(e.op){case"add":return n[0]+n[1];case"subtract":return n[0]-n[1];case"multiply":return n[0]*n[1];case"divide":return n[0]/n[1];case"pow":return Math.pow(n[0],n[1]);case"sqrt":return Math.sqrt(n[0]);case"abs":return Math.abs(n[0]);case"sin":return Math.sin(n[0]);case"cos":return Math.cos(n[0]);case"tan":return Math.tan(n[0]);case"exp":return Math.exp(n[0]);case"log":return Math.log(n[0]);default:{let t=e.op;throw Error(`Unsupported arithmetic op ${t}`)}}}default:throw Error(`Unsupported expression node ${e.kind}`)}}(t.expression,n,s)}return i.write(r),{success:!0,value:r}},T=({inputs:t,output:e,target:i})=>{let{sourceValues:r}=t;if(!r.value)throw Error(`${r} does not have CPU value`);let n=new e.ValueType(e.length*e.size);if(0===r.length)return{success:!1,error:Error(`${r} is empty`)};for(let t=0;t<r.size;t++){let i=S(r,0)[t],s=t*e.size,a=s+1;n[s]=i,n[a]=i;for(let e=1;e<r.length;e++){let i=S(r,e)[t];i<n[s]&&(n[s]=i),i>n[a]&&(n[a]=i)}}return i.write(n),{success:!0,value:n}},I=({inputs:t,output:e,target:i})=>A({func:(t,e)=>{let i=t.length/2,r=new Float64Array(e.buffer);for(let e=0;e<i;e++){let n=r[e];t[e]=Math.fround(n),t[e+i]=n-t[e]}return t},inputs:t,output:e,outputBuffer:i}),L=async({inputs:t,output:e,target:i})=>{let{ids:r,sourceValues:n}=t,s=r.value,a=n.value;if(!s)throw Error(`${r} does not have CPU value`);if(!a)throw Error(`${n} does not have CPU value`);let o=new e.ValueType(e.length*e.size),l=Array(e.size).fill(0);for(let t=0;t<e.length;t++){var u,c;let i=Number(S(r,t)[0]),s=(u=i,c=n.length,Number.isInteger(u)&&u>=0&&u<c)?S(n,i):l;o.set(s,t*e.size)}return i.write(o),{success:!0,value:o}},B=({inputs:t,output:e,target:i})=>A({func:(t,...e)=>{let i=0;for(let r of e)t.set(r,i),i+=r.length},inputs:t,output:e,outputBuffer:i}),C=({inputs:t,output:e,target:i})=>{let{x:r,y:n}=t,s=new e.ValueType(e.length);for(let t=0;t<e.length;t++){let e=S(r,t),i=S(n,t),a=0;for(let t=0;t<r.size;t++)a+=e[t]*i[t];s[t]=a}return i.write(s),{success:!0,value:s}},R=({inputs:t,output:e,target:i})=>{let{x:r,y:n}=t,s=new e.ValueType(e.length);for(let t=0;t<e.length;t++){let e=S(r,t),i=S(n,t),a=1;for(let t=0;t<r.size;t++)if(e[t]!==i[t]){a=0;break}s[t]=a}return i.write(s),{success:!0,value:s}},N=({inputs:t,output:e,target:i})=>{let{x:r}=t,n=new e.ValueType(e.length);for(let t=0;t<e.length;t++){let e=S(r,t),i=0;for(let t=0;t<r.size;t++)i+=e[t]*e[t];n[t]=Math.sqrt(i)}return i.write(n),{success:!0,value:n}},k=async({inputs:t,output:e,target:i})=>{let{segments:r,vertexCount:n}=t,s=r.value;if(!s)throw Error(`${r} does not have CPU value`);var a=s,o=r,l=n;if(o.length<1)throw Error("segmentedMap segments must contain at least one segment start");let u=0;for(let t=0;t<o.length;t++){let e=a[z(o,t)];if(0===t&&0!==e)throw Error(`segmentedMap segments must start at 0, got ${e}`);if(t>0&&e<u)throw Error(`segmentedMap segments must be non-decreasing, got ${e} after ${u}`);u=e}if(u>l)throw Error(`segmentedMap last segment start must be <= vertexCount, got ${u} > ${l}`);let c=new e.ValueType(e.length*e.size),h=0;for(let t=0;t<n;t++){for(;h+1<r.length&&s[z(r,h+1)]<=t;)h++;let i=s[z(r,h)],n=t*e.size;c[n]=h,c[n+1]=t-i}return i.write(c),{success:!0,value:c}};function z(t,e){return t.offset/t.ValueType.BYTES_PER_ELEMENT+e*(t.stride/t.ValueType.BYTES_PER_ELEMENT)}let j=async({inputs:t,output:e,target:i})=>{let{condition:r,whenTrue:n,whenFalse:s}=t,a=new e.ValueType(e.length*e.size);for(let t=0;t<e.length;t++){let i=S(r,t),o=S(n,t),l=S(s,t);for(let u=0;u<e.size;u++){let c=U(i,r.size,u);a[t*e.size+u]=0!==c?U(o,n.size,u):U(l,s.size,u)}}return i.write(a),{success:!0,value:a}};function U(t,e,i){return i<e?t[i]:1===e?t[0]:0}let F=({inputs:t,output:e,target:i})=>{let r=new e.ValueType(e.length);for(let i=0;i<e.length;i++)r[i]=t.start+i*t.step;return i.write(r),{success:!0,value:r}},D=({inputs:t,output:e,target:i})=>{let{columns:r}=t;return A({func:(t,e)=>{for(let i=0;i<r.length;i++)t[i]=e[r[i]]},inputs:{x:t.x},output:e,outputBuffer:i})},V=new class{_modules={cpu:r};add(t,e){let i=this._modules[t];if("function"==typeof e.then){let r=Promise.all([Promise.resolve(i||{}),e]).then(([t,e])=>({...t,...e}));return this._modules[t]=r,r.then(e=>{this._modules[t]=e}).catch(e=>{x.R.error(`Failed to register ${t} backend: ${e}`)()}),r}if(i&&"function"==typeof i.then){let r=Promise.resolve(i).then(t=>({...t,...e})).then(e=>(this._modules[t]=e,e)).catch(e=>{throw x.R.error(`Failed to register ${t} backend: ${e}`)(),e});return this._modules[t]=r,r}let r={...i||{},...e};return this._modules[t]=r,Promise.resolve(r)}async get(t,e){let r=this._modules[t];if(!r)if("webgl"===t)r=this.add("webgl",i.e("64435").then(i.bind(i,89022)));else if("webgpu"===t)r=this.add("webgpu",i.e("39916").then(i.bind(i,97095)));else throw Error(`${t} backend not registered`);let n=(await r)[e];if("function"!=typeof n)throw Error(`${t} backend does not implement ${e}`);return n}getSync(t,e){let i=this._modules[t];if(!i)throw Error(`${t} backend not registered`);if("function"==typeof i.then)throw Error(`${t} backend is not loaded yet`);let r=i[e];if("function"!=typeof r)throw Error(`${t} backend does not implement ${e}`);return r}clear(){this._modules={}}};var $=i(34010);class Y{inputs;dependencies;constructor(t){this.inputs=t,this.dependencies=Array.from(t instanceof Array?t:Object.values(t)).filter(t=>t instanceof $.GL)}async execute(t,e){return await this._resolveDependencies(t),await this._executeWithHandler(await V.get(this._getHandlerRegistry(t),this.name),e)}executeSync(t,e){var i;this._resolveDependenciesSync(t);let r=this._executeWithHandler(V.getSync(this._getHandlerRegistry(t),this.name),e);if(i=r,"function"==typeof i?.then)throw Error(`${this.name} returned a Promise in executeSync()`);return r}shouldExecuteOnCPU(){return this.output.length<=1&&Array.from(this.dependencies).every(t=>!!t.value)}_getHandlerRegistry(t){return this.shouldExecuteOnCPU()?"cpu":t.type}async _resolveDependencies(t){for(let e of this.dependencies)await e.evaluate(t);if("cpu"===this._getHandlerRegistry(t)||"null"===t.type)for(let t of this.dependencies)await t.ensureCPUValue()}_resolveDependenciesSync(t){for(let e of this.dependencies)e.evaluateSync(t);if("cpu"===this._getHandlerRegistry(t)||"null"===t.type)for(let t of this.dependencies)t.ensureCPUValueSync()}_executeWithHandler(t,e){return t({device:e.device,inputs:this.inputs,output:this.output,target:e})}}class q extends Y{name="interleave";output;constructor(t){super(t);let{isConstant:e,type:i,length:r}=function(...t){let e=function(t){let e=0,i=0;for(let r of t){if("f"===r[0])return"float32";let t=r.endsWith("8")?8:r.endsWith("6")?16:32;"u"===r[0]?e=Math.max(e,t):i=Math.max(i,t)}return e&&!i?`uint${e}`:i&&e<32?`sint${Math.max(i,2*e)}`:"float32"}(t.map(t=>t.type));return"f"!==e[0]&&t.some(t=>t.normalized)&&(e="float32"),{isConstant:t.every(t=>t.isConstant),type:e,size:t.reduce((t,e)=>Math.max(t,e.size),0),length:t.reduce((t,e)=>Math.max(t,e.length),0)}}(...t);this.output=new $.GL({isConstant:e,type:i,size:t.reduce((t,e)=>t+e.size,0),length:r,source:this})}toString(){return`_${this.inputs.join("_")}_`}}var G=i(99305),W=i(65181);class X{gpuDataEvaluators;format;length;id;_gpuVector;_ownsGPUDataEvaluators;_destroyed=!1;static fromGPUVector(t){if(t.bufferLayout)throw Error(`GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${t.name}"`);if(0===t.data.length)throw Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${t.name}"`);return new X({id:t.name,gpuDataEvaluators:t.data.map(e=>$.GL.fromGPUData(e,{id:t.name})),gpuVector:t,format:t.format})}static fromGPUDataEvaluators(t,e={}){return new X({id:e.id,gpuDataEvaluators:t,format:e.format})}constructor({id:t,gpuDataEvaluators:e,gpuVector:i,format:r}){if(0===e.length)throw Error("GPUVectorEvaluator requires at least one GPUData evaluator");(function(t){let e=t[0];for(let i of t.slice(1))if(i.type!==e.type||i.size!==e.size||i.normalized!==e.normalized||i.format!==e.format)throw Error("GPUVectorEvaluator requires matching GPUData evaluator layouts")})(e),this.id=t,this.gpuDataEvaluators=e,this.format=r??e[0].format,this.length=e.reduce((t,e)=>t+e.length,0),this._gpuVector=i,this._ownsGPUDataEvaluators=!i}get evaluated(){return!!this._gpuVector}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}mapGPUData(t){return X.fromGPUDataEvaluators(this.gpuDataEvaluators.map((e,i)=>t(e,i)),{id:this.id})}async evaluate(t,e={}){if(this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let i=await Promise.all(this.gpuDataEvaluators.map(i=>i.evaluate(t,e))),r=i[0],n=i.map(Z),s=e.format??this.format??r.format;return this._gpuVector=new W.M({type:"data",name:e.name??this.id??"vector",format:s,data:n,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}evaluateSync(t,e={}){if(this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let i=this.gpuDataEvaluators.map(i=>i.evaluateSync(t,e)),r=i[0],n=i.map(Z),s=e.format??this.format??r.format;return this._gpuVector=new W.M({type:"data",name:e.name??this.id??"vector",format:s,data:n,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}destroy(){if(this._ownsGPUDataEvaluators)for(let t of this.gpuDataEvaluators)t.destroy();this._gpuVector=void 0,this._destroyed=!0}toString(){return this.id??this.constructor.name}}function Z(t){let[e,...i]=t.data;if(!e||i.length>0)throw Error(`GPUVectorEvaluator requires one GPUData chunk for "${t.name}"`);return e}function H(t){return t instanceof $.GL?[t.buffer]:t.gpuVector.data.map(t=>t.buffer instanceof G.kL?t.buffer.buffer:t.buffer)}var K=i(10924);class J{constructor(t,{id:e,isTransitionAttribute:i}){this.packedBuffers={},this.device=t,this.id=e,this.isTransitionAttribute=i,"webgpu"===this.device.type&&V.add("webgpu",{interleave:K.C})}hasGroups(t){return"webgpu"===this.device.type&&Object.values(t).some(t=>!!t.settings.bufferGroup)}finalize(){for(let t of Object.values(this.packedBuffers))t.packed.destroy();this.packedBuffers={}}getBufferLayouts(t,e){let i=this._getPackedGroups(t,e,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(t,i,e)}getBindings(t,e,i,r){let n=this._getPackedGroups(t,i,{requireValues:!0,excludeAttributes:r}),s={},a=new Set;for(let t of n.values()){let i=!this.packedBuffers[t.id]||t.attributes.some(t=>!!e[t.id]);for(let e of(s[t.id]=this._getPackedBuffer(t,i),t.attributes))a.add(e.id)}return{bufferLayouts:this._getBufferLayouts(t,n,i).filter(e=>!r[e.name]&&!t[e.name]?.settings.isIndexed),buffers:s,groupedAttributeIds:a}}_getPackedGroups(t,e,{requireValues:i,excludeAttributes:r}){let n=new Map;for(let e of Object.values(t)){let t=e.settings.bufferGroup;if(!t)continue;let i=n.get(t)||[];i.push(e),n.set(t,i)}let s=new Map;for(let[t,a]of n){let n=this._getPackedGroup(t,a,e,i,r);n&&s.set(t,n)}return s}_getPackedGroup(t,e,i,r,n){if(e.length<2)return null;let s=e.map(t=>t.getBufferLayout(i)),a=s[0].stepMode,o=Math.max(1,e[0].numInstances),l=r&&e.every(t=>t.isConstant);for(let t=0;t<e.length;t++){let i=e[t],l=i.getAccessor(),u=l.size*l.bytesPerElement;if(n[i.id]||i.settings.isIndexed||i.settings.noAlloc||i.doublePrecision||this.isTransitionAttribute(i.id)||s[t].stepMode!==a||i.numInstances!==e[0].numInstances||0!==(l.offset||0)||0!==(l.vertexOffset||0)||c(l)!==u||r&&(i.isConstant?!i.getConstantValue()||i.getConstantValue().byteLength<u:!ArrayBuffer.isView(i.value)||i.value.byteLength<o*u))return null}let u={},h=[],f=0;for(let t=0;t<e.length;t++){let i=e[t];for(let e of(f=Q(f),u[i.id]=f,s[t].attributes||[]))h.push({...e,byteOffset:f+(e.byteOffset||0)});f+=c(i.getAccessor())}return{id:t,attributes:e,byteStride:f=Q(f),byteOffsets:u,rowCount:o,layout:{name:t,byteStride:l?0:f,stepMode:a,attributes:h}}}_getBufferLayouts(t,e,i){let r=[],n=new Set,s=new Set;for(let t of e.values())for(let e of t.attributes)s.add(e.id);for(let a of Object.values(t)){let t=a.settings.bufferGroup,o=t&&e.get(t);o&&s.has(a.id)?n.has(o.id)||(r.push(o.layout),n.add(o.id)):r.push(a.getBufferLayout(i))}return r}_getPackedBuffer(t,e){let i=JSON.stringify({byteStride:t.layout.byteStride,attributes:t.layout.attributes}),r=this.packedBuffers[t.id];if(r&&r.layoutKey===i||(e=!0),e){r&&(r.packed.destroy(),delete this.packedBuffers[t.id]);let e=this._interleavePackedGroup(t);return this.packedBuffers[t.id]={packed:e,layoutKey:i},e.buffer}if(!r)throw Error(`Attribute buffer group ${t.id} has no packed buffer`);return r.packed.buffer}_interleavePackedGroup(t){let e=function(...t){if(0===t.length)throw Error("interleave() requires at least one input");return 1===t.length?(0,$.uy)(t[0]):new q(t.map($.uy)).output}(...t.attributes.map(e=>this._getInterleaveInput(t,e)));return!function(t,e){let i,r=(function t(e,i,r){var n;if((n=e)instanceof $.GL||n instanceof X)return void i.add(e);if(!(!e||"object"!=typeof e||r.has(e))){let n;if(r.add(e),Array.isArray(e)){for(let n of e)t(n,i,r);return}if((n=Object.getPrototypeOf(e))===Object.prototype||null===n)for(let n of Object.values(e))t(n,i,r)}}(e,i=new Set,new Set),Array.from(i));for(let e of r)e.evaluateSync(t);var n=r;let s=new Set(n.flatMap(H)),a=new Set;for(let t of n)!function t(e,i){if(e instanceof X){for(let r of e.gpuDataEvaluators)t(r,i);return}let r=e.source;if(r){if(r instanceof $.GL){i.has(r)||(i.add(r),t(r,i));return}for(let e of r.dependencies)i.has(e)||(i.add(e),t(e,i))}}(t,a);for(let t of a)t.evaluated&&!s.has(t.buffer)&&t.destroy()}(this.device,e),e}_getInterleaveInput(t,e){let i=c(e.getAccessor()),r=t.byteOffsets[e.id];if(tt(`${t.id}.${e.id} rowByteLength`,i),tt(`${t.id}.${e.id} groupByteOffset`,r),e.isConstant){let r=e.getConstantValue();if(!r)throw Error(`Attribute group ${t.id} is missing constant value ${e.id}`);return tt(`${t.id}.${e.id} constant byteOffset`,r.byteOffset),new $.GL({id:e.id,type:"uint32",size:i/4,isConstant:!0,value:new Uint32Array(r.buffer,r.byteOffset,i/Uint32Array.BYTES_PER_ELEMENT)})}let n=e.getBuffer(),s=e.byteOffset,a=e.getAccessor().stride||i;if(tt(`${t.id}.${e.id} byteOffset`,s),tt(`${t.id}.${e.id} stride`,a),!n)throw Error(`Attribute group ${t.id} cannot interleave missing buffer ${e.id}`);return new $.GL({id:e.id,type:"uint32",size:i/4,offset:s,stride:a,length:t.rowCount,buffer:n})}}function Q(t){return 4*Math.ceil(t/4)}function tt(t,e){if(e%4!=0)throw Error(`Attribute buffer groups require 32-bit alignment: ${t}=${e}`)}var te=i(82417),ti=i(43411),tr=i(91783);function tn(t,e=[],i=0){let r=Math.fround(t),n=t-r;return e[i]=r,e[i+1]=n,e}let ts=`\

layout(std140) uniform fp64arithmeticUniforms {
  uniform float ONE;
  uniform float SPLIT;
} fp64;

/*
About LUMA_FP64_CODE_ELIMINATION_WORKAROUND

The purpose of this workaround is to prevent shader compilers from
optimizing away necessary arithmetic operations by swapping their sequences
or transform the equation to some 'equivalent' form.

These helpers implement Dekker/Veltkamp-style error tracking. If the compiler
folds constants or reassociates the arithmetic, the high/low split can stop
tracking the rounding error correctly. That failure mode tends to look fine in
simple coordinate setup, but then breaks down inside iterative arithmetic such
as fp64 Mandelbrot loops.

The method is to multiply an artifical variable, ONE, which will be known to
the compiler to be 1 only at runtime. The whole expression is then represented
as a polynomial with respective to ONE. In the coefficients of all terms, only one a
and one b should appear

err = (a + b) * ONE^6 - a * ONE^5 - (a + b) * ONE^4 + a * ONE^3 - b - (a + b) * ONE^2 + a * ONE
*/

float prevent_fp64_optimization(float value) {
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  return value + fp64.ONE * 0.0;
#else
  return value;
#endif
}

// Divide float number to high and low floats to extend fraction bits
vec2 split(float a) {
  // Keep SPLIT as a runtime uniform so the compiler cannot fold the Dekker
  // split into a constant expression and reassociate the recovery steps.
  float split = prevent_fp64_optimization(fp64.SPLIT);
  float t = prevent_fp64_optimization(a * split);
  float temp = t - a;
  float a_hi = t - temp;
  float a_lo = a - a_hi;
  return vec2(a_hi, a_lo);
}

// Divide float number again when high float uses too many fraction bits
vec2 split2(vec2 a) {
  vec2 b = split(a.x);
  b.y += a.y;
  return b;
}

// Special sum operation when a > b
vec2 quickTwoSum(float a, float b) {
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float sum = (a + b) * fp64.ONE;
  float err = b - (sum - a) * fp64.ONE;
#else
  float sum = a + b;
  float err = b - (sum - a);
#endif
  return vec2(sum, err);
}

// General sum operation
vec2 twoSum(float a, float b) {
  float s = (a + b);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float v = (s * fp64.ONE - a) * fp64.ONE;
  float err = (a - (s - v) * fp64.ONE) * fp64.ONE * fp64.ONE * fp64.ONE + (b - v);
#else
  float v = s - a;
  float err = (a - (s - v)) + (b - v);
#endif
  return vec2(s, err);
}

vec2 twoSub(float a, float b) {
  float s = (a - b);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float v = (s * fp64.ONE - a) * fp64.ONE;
  float err = (a - (s - v) * fp64.ONE) * fp64.ONE * fp64.ONE * fp64.ONE - (b + v);
#else
  float v = s - a;
  float err = (a - (s - v)) - (b + v);
#endif
  return vec2(s, err);
}

vec2 twoSqr(float a) {
  float prod = a * a;
  vec2 a_fp64 = split(a);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float err = ((a_fp64.x * a_fp64.x - prod) * fp64.ONE + 2.0 * a_fp64.x *
    a_fp64.y * fp64.ONE * fp64.ONE) + a_fp64.y * a_fp64.y * fp64.ONE * fp64.ONE * fp64.ONE;
#else
  float err = ((a_fp64.x * a_fp64.x - prod) + 2.0 * a_fp64.x * a_fp64.y) + a_fp64.y * a_fp64.y;
#endif
  return vec2(prod, err);
}

vec2 twoProd(float a, float b) {
  float prod = a * b;
  vec2 a_fp64 = split(a);
  vec2 b_fp64 = split(b);
  // twoProd is especially sensitive because mul_fp64 and div_fp64 both depend
  // on the split terms and cross terms staying in the original evaluation
  // order. If the compiler folds or reassociates them, the low part tends to
  // collapse to zero or NaN on some drivers.
  float highProduct = prevent_fp64_optimization(a_fp64.x * b_fp64.x);
  float crossProduct1 = prevent_fp64_optimization(a_fp64.x * b_fp64.y);
  float crossProduct2 = prevent_fp64_optimization(a_fp64.y * b_fp64.x);
  float lowProduct = prevent_fp64_optimization(a_fp64.y * b_fp64.y);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float err1 = (highProduct - prod) * fp64.ONE;
  float err2 = crossProduct1 * fp64.ONE * fp64.ONE;
  float err3 = crossProduct2 * fp64.ONE * fp64.ONE * fp64.ONE;
  float err4 = lowProduct * fp64.ONE * fp64.ONE * fp64.ONE * fp64.ONE;
#else
  float err1 = highProduct - prod;
  float err2 = crossProduct1;
  float err3 = crossProduct2;
  float err4 = lowProduct;
#endif
  float err = ((err1 + err2) + err3) + err4;
  return vec2(prod, err);
}

vec2 sum_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSum(a.x, b.x);
  t = twoSum(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 sub_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSub(a.x, b.x);
  t = twoSub(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 mul_fp64(vec2 a, vec2 b) {
  vec2 prod = twoProd(a.x, b.x);
  // y component is for the error
  prod.y += a.x * b.y;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  prod.y += a.y * b.x;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  return prod;
}

vec2 div_fp64(vec2 a, vec2 b) {
  float xn = 1.0 / b.x;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  vec2 yn = mul_fp64(a, vec2(xn, 0));
#else
  vec2 yn = a * xn;
#endif
  float diff = (sub_fp64(a, mul_fp64(b, yn))).x;
  vec2 prod = twoProd(xn, diff);
  return sum_fp64(yn, prod);
}

vec2 sqrt_fp64(vec2 a) {
  if (a.x == 0.0 && a.y == 0.0) return vec2(0.0, 0.0);
  if (a.x < 0.0) return vec2(0.0 / 0.0, 0.0 / 0.0);

  float x = 1.0 / sqrt(a.x);
  float yn = a.x * x;
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  vec2 yn_sqr = twoSqr(yn) * fp64.ONE;
#else
  vec2 yn_sqr = twoSqr(yn);
#endif
  float diff = sub_fp64(a, yn_sqr).x;
  vec2 prod = twoProd(x * 0.5, diff);
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  return sum_fp64(split(yn), prod);
#else
  return sum_fp64(vec2(yn, 0.0), prod);
#endif
}
`,ta=`\
struct Fp64F32Bits {
  sign: u32,
  baseExponent: i32,
  significand: u32,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};

// Decode an f32 as (-1)^sign * significand * 2^baseExponent.
fn fp64_decode_f32_bits(bits: u32) -> Fp64F32Bits {
  let sign = bits >> 31u;
  let exponentBits = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x7fffffu;

  if (exponentBits == 0xffu) {
    return Fp64F32Bits(sign, 0, 0u, false, fraction == 0u, fraction != 0u);
  }
  if (exponentBits == 0u) {
    return Fp64F32Bits(sign, -149, fraction, fraction == 0u, false, false);
  }
  return Fp64F32Bits(sign, i32(exponentBits) - 150, 0x800000u | fraction, false, false, false);
}

fn fp64_f32_magnitude_compare(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  return select(-1, 1, aMagnitude > bMagnitude);
}

fn fp64_make_residual_f32_bits(
  exactSign: u32,
  exactMagnitude: vec2u,
  exactBaseExponent: i32,
  highBits: u32
) -> u32 {
  if (fp64_u64_is_zero(exactMagnitude)) {
    return 0u;
  }

  let high = fp64_decode_f32_bits(highBits);
  if (high.isInf || high.isNan) {
    return exactSign << 31u;
  }
  if (high.isZero) {
    return fp64_make_f32_bits_from_u64(exactSign, exactMagnitude, exactBaseExponent);
  }

  let commonBaseExponent = min(exactBaseExponent, high.baseExponent);
  let exactShift = exactBaseExponent - commonBaseExponent;
  let highShift = high.baseExponent - commonBaseExponent;

  // A normal two-sum/two-product residual never needs a shift this large.
  // This guard gives deterministic underflow behavior outside that contract.
  if (exactShift >= 64 || highShift >= 64) {
    return exactSign << 31u;
  }

  let exactAligned = fp64_u64_shift_left(exactMagnitude, u32(exactShift));
  let highAligned = fp64_u64_shift_left(vec2u(0u, high.significand), u32(highShift));
  let comparison = fp64_u64_compare(exactAligned, highAligned);
  if (comparison == 0) {
    return 0u;
  }

  var residualSign = exactSign;
  var residualMagnitude: vec2u;
  if (comparison > 0) {
    residualMagnitude = fp64_u64_sub(exactAligned, highAligned);
  } else {
    residualSign = exactSign ^ 1u;
    residualMagnitude = fp64_u64_sub(highAligned, exactAligned);
  }
  return fp64_make_f32_bits_from_u64(
    residualSign,
    residualMagnitude,
    commonBaseExponent
  );
}

fn fp64_split_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  let highBits = fp64_make_f32_bits_from_u64(sign, magnitude, baseExponent);
  let lowBits = fp64_make_residual_f32_bits(sign, magnitude, baseExponent, highBits);
  return vec2u(highBits, lowBits);
}

fn fp64_two_sum_integer_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_f32_bits(aBits);
  let b = fp64_decode_f32_bits(bBits);

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    if (a.isInf && b.isInf && a.sign != b.sign) {
      return vec2u(0x7fc00000u, 0u);
    }
    return select(vec2u(bBits, 0u), vec2u(aBits, 0u), a.isInf);
  }
  if (a.isZero && b.isZero) {
    return vec2u((a.sign & b.sign) << 31u, 0u);
  }
  if (a.isZero) {
    return vec2u(bBits, 0u);
  }
  if (b.isZero) {
    return vec2u(aBits, 0u);
  }

  let exponentDifference = select(
    b.baseExponent - a.baseExponent,
    a.baseExponent - b.baseExponent,
    a.baseExponent >= b.baseExponent
  );

  // Beyond half an ulp, rounding cannot change the larger operand. Returning
  // the smaller operand intact also avoids an unbounded integer alignment.
  // At a power-of-two boundary the spacing below the larger operand is half
  // the spacing above it, so an opposite-sign gap-25 operand can still change
  // the rounded high limb. Gap 26 is the first universally safe early-out.
  if (exponentDifference > 25) {
    if (fp64_f32_magnitude_compare(aBits, bBits) >= 0) {
      return vec2u(aBits, bBits);
    }
    return vec2u(bBits, aBits);
  }

  let commonBaseExponent = min(a.baseExponent, b.baseExponent);
  let aMagnitude = fp64_u64_shift_left(
    vec2u(0u, a.significand),
    u32(a.baseExponent - commonBaseExponent)
  );
  let bMagnitude = fp64_u64_shift_left(
    vec2u(0u, b.significand),
    u32(b.baseExponent - commonBaseExponent)
  );

  var resultSign = a.sign;
  var resultMagnitude: vec2u;
  if (a.sign == b.sign) {
    resultMagnitude = fp64_u64_add(aMagnitude, bMagnitude);
  } else {
    let comparison = fp64_u64_compare(aMagnitude, bMagnitude);
    if (comparison == 0) {
      return vec2u(0u, 0u);
    }
    if (comparison > 0) {
      resultMagnitude = fp64_u64_sub(aMagnitude, bMagnitude);
    } else {
      resultSign = b.sign;
      resultMagnitude = fp64_u64_sub(bMagnitude, aMagnitude);
    }
  }

  return fp64_split_accumulator_bits(resultSign, resultMagnitude, commonBaseExponent);
}

fn fp64_two_sum_integer(a: f32, b: f32) -> vec2f {
  let resultBits = fp64_two_sum_integer_bits(bitcast<u32>(a), bitcast<u32>(b));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn fp64_multiply_significands(a: u32, b: u32) -> vec2u {
  let aLow = a & 0xffffu;
  let aHigh = a >> 16u;
  let bLow = b & 0xffffu;
  let bHigh = b >> 16u;
  let lowProduct = aLow * bLow;
  let crossProduct = aLow * bHigh + aHigh * bLow;
  let highProduct = aHigh * bHigh;

  var result = vec2u(0u, lowProduct);
  result = fp64_u64_add(
    result,
    fp64_u64_shift_left(vec2u(0u, crossProduct), 16u)
  );
  result = fp64_u64_add(result, vec2u(highProduct, 0u));
  return result;
}

fn fp64_two_prod_integer_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_f32_bits(aBits);
  let b = fp64_decode_f32_bits(bBits);
  let resultSign = a.sign ^ b.sign;

  if (a.isNan || b.isNan || ((a.isZero || b.isZero) && (a.isInf || b.isInf))) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    return vec2u((resultSign << 31u) | 0x7f800000u, resultSign << 31u);
  }
  if (a.isZero || b.isZero) {
    return vec2u(resultSign << 31u, resultSign << 31u);
  }

  let magnitude = fp64_multiply_significands(a.significand, b.significand);
  return fp64_split_accumulator_bits(
    resultSign,
    magnitude,
    a.baseExponent + b.baseExponent
  );
}

fn fp64_two_prod_integer(a: f32, b: f32) -> vec2f {
  let resultBits = fp64_two_prod_integer_bits(bitcast<u32>(a), bitcast<u32>(b));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn fp64_round_add_integer(a: f32, b: f32) -> f32 {
  return fp64_two_sum_integer(a, b).x;
}

fn fp64_round_mul_integer(a: f32, b: f32) -> f32 {
  return fp64_two_prod_integer(a, b).x;
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_f32_finite_exponent(value: Fp64F32Bits) -> i32 {
  let mostSignificantBit = 31u - countLeadingZeros(value.significand);
  return value.baseExponent + i32(mostSignificantBit);
}

fn fp64_scale_f32_integer(value: f32, exponent: i32) -> f32 {
  let decoded = fp64_decode_f32_bits(bitcast<u32>(value));
  if (decoded.isZero || decoded.isInf || decoded.isNan) {
    return value;
  }
  let resultBits = fp64_make_f32_bits_from_u64(
    decoded.sign,
    vec2u(0u, decoded.significand),
    decoded.baseExponent + exponent
  );
  return bitcast<f32>(resultBits);
}

// Divide normalized significands so the hardware operation cannot overflow,
// underflow, or flush a subnormal result. Reapply the exponent with integer
// packing, which also produces subnormal correction limbs without relying on
// floating-point arithmetic to preserve them.
fn fp64_divide_f32_integer(aValue: f32, bValue: f32) -> f32 {
  let a = fp64_decode_f32_bits(bitcast<u32>(aValue));
  let b = fp64_decode_f32_bits(bitcast<u32>(bValue));
  if (a.isZero || b.isZero || a.isInf || b.isInf || a.isNan || b.isNan) {
    return aValue / bValue;
  }

  let aMostSignificantBit = 31u - countLeadingZeros(a.significand);
  let bMostSignificantBit = 31u - countLeadingZeros(b.significand);
  let normalizedABits = fp64_make_f32_bits_from_u64(
    a.sign,
    vec2u(0u, a.significand),
    -i32(aMostSignificantBit)
  );
  let normalizedBBits = fp64_make_f32_bits_from_u64(
    b.sign,
    vec2u(0u, b.significand),
    -i32(bMostSignificantBit)
  );
  let normalizedQuotient = bitcast<f32>(normalizedABits) / bitcast<f32>(normalizedBBits);
  let quotient = fp64_decode_f32_bits(bitcast<u32>(normalizedQuotient));
  let exponentShift =
    a.baseExponent + i32(aMostSignificantBit) -
    b.baseExponent - i32(bMostSignificantBit);
  let quotientBits = fp64_make_f32_bits_from_u64(
    quotient.sign,
    vec2u(0u, quotient.significand),
    quotient.baseExponent + exponentShift
  );
  return bitcast<f32>(quotientBits);
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn split(a: f32) -> vec2f {
  let aBits = bitcast<u32>(a);
  let decoded = fp64_decode_f32_bits(aBits);
  if (decoded.isZero || decoded.isInf || decoded.isNan) {
    return vec2f(a, 0.0);
  }

  var roundedHigh = decoded.significand >> 12u;
  let remainder = decoded.significand & 0xfffu;
  if (remainder > 0x800u || (remainder == 0x800u && (roundedHigh & 1u) == 1u)) {
    roundedHigh = roundedHigh + 1u;
  }
  var highMagnitude = vec2u(0u, roundedHigh << 12u);
  var highBits = fp64_make_f32_bits_from_u64(
    decoded.sign,
    highMagnitude,
    decoded.baseExponent
  );
  // Rounding the high limb of a maximum-exponent value can overflow even
  // though the original value is finite. Truncate only in that boundary case
  // so split remains an exact finite decomposition.
  if (fp64_decode_f32_bits(highBits).isInf) {
    roundedHigh = decoded.significand >> 12u;
    highMagnitude = vec2u(0u, roundedHigh << 12u);
    highBits = fp64_make_f32_bits_from_u64(
      decoded.sign,
      highMagnitude,
      decoded.baseExponent
    );
  }
  let lowBits = fp64_make_residual_f32_bits(
    decoded.sign,
    vec2u(0u, decoded.significand),
    decoded.baseExponent,
    highBits
  );
  return vec2f(bitcast<f32>(highBits), bitcast<f32>(lowBits));
}

fn split2(a: vec2f) -> vec2f {
  var result = split(a.x);
  result.y = fp64_round_add_integer(result.y, a.y);
  return result;
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn quickTwoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}
#endif

fn twoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let bBits = bitcast<u32>(b) ^ 0x80000000u;
  let resultBits = fp64_two_sum_integer_bits(bitcast<u32>(a), bBits);
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn twoSqr(a: f32) -> vec2f {
  return fp64_two_prod_integer(a, a);
}

fn twoProd(a: f32, b: f32) -> vec2f {
  return fp64_two_prod_integer(a, b);
}
#endif

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  var sum = fp64_two_sum_integer(a.x, b.x);
  let lowSum = fp64_two_sum_integer(a.y, b.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.x);
  sum = fp64_two_sum_integer(sum.x, sum.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.y);
  return fp64_two_sum_integer(sum.x, sum.y);
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  let negatedB = vec2f(
    bitcast<f32>(bitcast<u32>(b.x) ^ 0x80000000u),
    bitcast<f32>(bitcast<u32>(b.y) ^ 0x80000000u)
  );
  return sum_fp64(a, negatedB);
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  var product = fp64_two_prod_integer(a.x, b.x);
  let crossProduct1 = fp64_round_mul_integer(a.x, b.y);
  product.y = fp64_round_add_integer(product.y, crossProduct1);
  product = fp64_two_sum_integer(product.x, product.y);
  let crossProduct2 = fp64_round_mul_integer(a.y, b.x);
  product.y = fp64_round_add_integer(product.y, crossProduct2);
  return fp64_two_sum_integer(product.x, product.y);
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_scale_fp64_integer(value: vec2f, exponent: i32) -> vec2f {
  let high = fp64_scale_f32_integer(value.x, exponent);
  let low = fp64_scale_f32_integer(value.y, exponent);
  return sum_fp64(vec2f(high, 0.0), vec2f(low, 0.0));
}

fn fp64_div_fp64_normalized(a: vec2f, b: vec2f) -> vec2f {
  let quotientHigh = fp64_divide_f32_integer(a.x, b.x);
  var quotient = vec2f(quotientHigh, 0.0);

  let remainder = sub_fp64(a, mul_fp64(b, quotient));
  let quotientLow = fp64_divide_f32_integer(remainder.x, b.x);
  quotient = sum_fp64(quotient, vec2f(quotientLow, 0.0));

  let secondRemainder = sub_fp64(a, mul_fp64(b, quotient));
  let correction = fp64_divide_f32_integer(secondRemainder.x, b.x);
  return sum_fp64(quotient, vec2f(correction, 0.0));
}

fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let decodedA = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let decodedB = fp64_decode_f32_bits(bitcast<u32>(b.x));
  if (
    decodedA.isZero || decodedB.isZero ||
    decodedA.isInf || decodedB.isInf ||
    decodedA.isNan || decodedB.isNan
  ) {
    return fp64_div_fp64_normalized(a, b);
  }

  let exponentA = fp64_f32_finite_exponent(decodedA);
  let exponentB = fp64_f32_finite_exponent(decodedB);
  // Correct the quotient near unity so b * q and the remainder stay clear of
  // both f32 underflow and overflow. The exponent difference is applied once.
  let normalizedA = fp64_scale_fp64_integer(a, -exponentA);
  let normalizedB = fp64_scale_fp64_integer(b, -exponentB);
  let normalizedQuotient = fp64_div_fp64_normalized(normalizedA, normalizedB);
  return fp64_scale_fp64_integer(normalizedQuotient, exponentA - exponentB);
}

fn fp64_sqrt_fp64_normalized(a: vec2f) -> vec2f {
  let estimate = sqrt(a.x);
  let difference = sub_fp64(a, fp64_two_prod_integer(estimate, estimate)).x;
  let denominator = fp64_round_add_integer(estimate, estimate);
  let correction = fp64_divide_f32_integer(difference, denominator);
  return sum_fp64(vec2f(estimate, 0.0), vec2f(correction, 0.0));
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  let decoded = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let decodedLow = fp64_decode_f32_bits(bitcast<u32>(a.y));
  if (decoded.isZero && decodedLow.isZero) {
    return vec2f(0.0, 0.0);
  }
  if (decoded.sign == 1u) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  if (decoded.isInf || decoded.isNan) {
    return fp64_sqrt_fp64_normalized(a);
  }
  let exponent = fp64_f32_finite_exponent(decoded);
  // An even scale lets the final square-root rescale use an integer exponent.
  let evenExponent = exponent - (exponent & 1);
  let normalizedA = fp64_scale_fp64_integer(a, -evenExponent);
  let normalizedRoot = fp64_sqrt_fp64_normalized(normalizedA);
  return fp64_scale_fp64_integer(normalizedRoot, evenExponent / 2);
}
#endif
`,to={name:"fp64arithmetic",source:`\
struct Fp64ArithmeticUniforms {
  ONE: f32,
  SPLIT: f32,
};

@group(0) @binding(auto) var<uniform> fp64arithmetic : Fp64ArithmeticUniforms;

#ifndef LUMA_FP64_F32_INPUT_ONLY
struct Fp64Bits {
  sign: u32,
  exponent: i32,
  significand: vec2u,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_nan(seed: f32) -> f32 {
  let nanBits = 0x7fc00000u | select(0u, 1u, seed < 0.0);
  return bitcast<f32>(nanBits);
}
#endif

fn fp64_u64_is_zero(value: vec2u) -> bool {
  return value.x == 0u && value.y == 0u;
}

fn fp64_u64_compare(a: vec2u, b: vec2u) -> i32 {
  if (a.x != b.x) {
    return select(-1, 1, a.x > b.x);
  }
  if (a.y != b.y) {
    return select(-1, 1, a.y > b.y);
  }
  return 0;
}

fn fp64_u64_add(a: vec2u, b: vec2u) -> vec2u {
  let low = a.y + b.y;
  let carry = select(0u, 1u, low < a.y);
  return vec2u(a.x + b.x + carry, low);
}

fn fp64_u64_sub(a: vec2u, b: vec2u) -> vec2u {
  let borrow = select(0u, 1u, a.y < b.y);
  return vec2u(a.x - b.x - borrow, a.y - b.y);
}

fn fp64_u64_shift_left(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u((value.x << shift) | (value.y >> (32u - shift)), value.y << shift);
  }
  if (shift == 32u) {
    return vec2u(value.y, 0u);
  }
  if (shift < 64u) {
    return vec2u(value.y << (shift - 32u), 0u);
  }
  return vec2u(0u);
}

fn fp64_u64_shift_right(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u(value.x >> shift, (value.y >> shift) | (value.x << (32u - shift)));
  }
  if (shift == 32u) {
    return vec2u(0u, value.x);
  }
  if (shift < 64u) {
    return vec2u(0u, value.x >> (shift - 32u));
  }
  return vec2u(0u);
}

fn fp64_u64_get_bit(value: vec2u, bitIndex: u32) -> bool {
  if (bitIndex >= 64u) {
    return false;
  }
  if (bitIndex >= 32u) {
    return ((value.x >> (bitIndex - 32u)) & 1u) != 0u;
  }
  return ((value.y >> bitIndex) & 1u) != 0u;
}

fn fp64_u64_has_bits_below(value: vec2u, bitCount: u32) -> bool {
  if (bitCount == 0u) {
    return false;
  }
  if (bitCount >= 64u) {
    return !fp64_u64_is_zero(value);
  }
  if (bitCount > 32u) {
    let highBitCount = bitCount - 32u;
    let highMask = (1u << highBitCount) - 1u;
    return value.y != 0u || (value.x & highMask) != 0u;
  }
  if (bitCount == 32u) {
    return value.y != 0u;
  }
  let lowMask = (1u << bitCount) - 1u;
  return (value.y & lowMask) != 0u;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_u64_shift_right_sticky(value: vec2u, shift: u32) -> vec2u {
  var shifted = fp64_u64_shift_right(value, shift);
  if (fp64_u64_has_bits_below(value, shift)) {
    shifted.y = shifted.y | 1u;
  }
  return shifted;
}
#endif

fn fp64_u64_count_leading_zeros(value: vec2u) -> u32 {
  if (value.x != 0u) {
    return countLeadingZeros(value.x);
  }
  return 32u + countLeadingZeros(value.y);
}

fn fp64_round_shift_right_to_u32(value: vec2u, shift: u32) -> u32 {
  if (shift == 0u) {
    return value.y;
  }

  let truncated = fp64_u64_shift_right(value, shift);
  var rounded = truncated.y;
  let guard = fp64_u64_get_bit(value, shift - 1u);
  let hasTrailingBits = fp64_u64_has_bits_below(value, shift - 1u);
  if (guard && (hasTrailingBits || (rounded & 1u) == 1u)) {
    rounded = rounded + 1u;
  }
  return rounded;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_round_shift_right(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }

  var rounded = fp64_u64_shift_right(value, shift);
  let guard = fp64_u64_get_bit(value, shift - 1u);
  let hasTrailingBits = fp64_u64_has_bits_below(value, shift - 1u);
  if (guard && (hasTrailingBits || (rounded.y & 1u) == 1u)) {
    rounded = fp64_u64_add(rounded, vec2u(0u, 1u));
  }
  return rounded;
}
#endif

fn fp64_make_f32_bits_from_u64(sign: u32, significand: vec2u, baseExponent: i32) -> u32 {
  if (fp64_u64_is_zero(significand)) {
    return sign << 31u;
  }

  let leadingZeros = fp64_u64_count_leading_zeros(significand);
  let mostSignificantBit = 63u - leadingZeros;
  var exponent = baseExponent + i32(mostSignificantBit);

  if (exponent > 127) {
    return (sign << 31u) | 0x7f800000u;
  }

  if (exponent >= -126) {
    let shift = i32(mostSignificantBit) - 23;
    var significand24: u32;
    if (shift > 0) {
      significand24 = fp64_round_shift_right_to_u32(significand, u32(shift));
    } else {
      significand24 = fp64_u64_shift_left(significand, u32(-shift)).y;
    }

    if (significand24 >= 0x1000000u) {
      significand24 = significand24 >> 1u;
      exponent = exponent + 1;
      if (exponent > 127) {
        return (sign << 31u) | 0x7f800000u;
      }
    }

    return (sign << 31u) | (u32(exponent + 127) << 23u) | (significand24 & 0x7fffffu);
  }

  let scaleExponent = baseExponent + 149;
  var mantissa: u32;
  if (scaleExponent >= 0) {
    mantissa = fp64_u64_shift_left(significand, u32(scaleExponent)).y;
  } else {
    mantissa = fp64_round_shift_right_to_u32(significand, u32(-scaleExponent));
  }

  if (mantissa >= 0x800000u) {
    return (sign << 31u) | 0x00800000u;
  }
  return (sign << 31u) | mantissa;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_decode_bits(bits: vec2u) -> Fp64Bits {
  let sign = bits.x >> 31u;
  let exponentBits = (bits.x >> 20u) & 0x7ffu;
  let fractionHigh = bits.x & 0xfffffu;
  let fractionLow = bits.y;
  let fraction = vec2u(fractionHigh, fractionLow);

  if (exponentBits == 0x7ffu) {
    let isInf = fp64_u64_is_zero(fraction);
    return Fp64Bits(sign, 0, vec2u(0u), false, isInf, !isInf);
  }

  if (exponentBits == 0u) {
    let isZero = fp64_u64_is_zero(fraction);
    return Fp64Bits(sign, -1022, fraction, isZero, false, false);
  }

  return Fp64Bits(sign, i32(exponentBits) - 1023, vec2u((1u << 20u) | fractionHigh, fractionLow), false, false, false);
}

fn fp64_finite_magnitude_compare(a: Fp64Bits, b: Fp64Bits) -> i32 {
  if (a.exponent != b.exponent) {
    return select(-1, 1, a.exponent > b.exponent);
  }
  return fp64_u64_compare(a.significand, b.significand);
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
struct Fp64RawF32Bits {
  sign: u32,
  baseExponent: i32,
  significand: u32,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};

// Decode an f32 as (-1)^sign * significand * 2^baseExponent. This shared
// integer representation lets normalization remain independent of the
// selected double-single arithmetic implementation.
fn fp64_decode_raw_f32_bits(bits: u32) -> Fp64RawF32Bits {
  let sign = bits >> 31u;
  let exponentBits = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x7fffffu;

  if (exponentBits == 0xffu) {
    return Fp64RawF32Bits(sign, 0, 0u, false, fraction == 0u, fraction != 0u);
  }
  if (exponentBits == 0u) {
    return Fp64RawF32Bits(sign, -149, fraction, fraction == 0u, false, false);
  }
  return Fp64RawF32Bits(
    sign,
    i32(exponentBits) - 150,
    0x800000u | fraction,
    false,
    false,
    false
  );
}

fn fp64_raw_f32_magnitude_compare(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  return select(-1, 1, aMagnitude > bMagnitude);
}

fn fp64_make_raw_residual_f32_bits(
  exactSign: u32,
  exactMagnitude: vec2u,
  exactBaseExponent: i32,
  highBits: u32
) -> u32 {
  if (fp64_u64_is_zero(exactMagnitude)) {
    return 0u;
  }

  let high = fp64_decode_raw_f32_bits(highBits);
  if (high.isInf || high.isNan) {
    return 0u;
  }
  if (high.isZero) {
    return fp64_make_f32_bits_from_u64(exactSign, exactMagnitude, exactBaseExponent);
  }

  let commonBaseExponent = min(exactBaseExponent, high.baseExponent);
  let exactShift = exactBaseExponent - commonBaseExponent;
  let highShift = high.baseExponent - commonBaseExponent;
  if (exactShift >= 64 || highShift >= 64) {
    return 0u;
  }

  let exactAligned = fp64_u64_shift_left(exactMagnitude, u32(exactShift));
  let highAligned = fp64_u64_shift_left(vec2u(0u, high.significand), u32(highShift));
  let comparison = fp64_u64_compare(exactAligned, highAligned);
  if (comparison == 0) {
    return 0u;
  }

  var residualSign = exactSign;
  var residualMagnitude: vec2u;
  if (comparison > 0) {
    residualMagnitude = fp64_u64_sub(exactAligned, highAligned);
  } else {
    residualSign = exactSign ^ 1u;
    residualMagnitude = fp64_u64_sub(highAligned, exactAligned);
  }
  return fp64_make_f32_bits_from_u64(
    residualSign,
    residualMagnitude,
    commonBaseExponent
  );
}

fn fp64_split_raw_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  if (fp64_u64_is_zero(magnitude)) {
    return vec2u(0u);
  }
  let highBits = fp64_make_f32_bits_from_u64(sign, magnitude, baseExponent);
  let rawLowBits = fp64_make_raw_residual_f32_bits(sign, magnitude, baseExponent, highBits);
  let lowBits = select(rawLowBits, 0u, (rawLowBits & 0x7fffffffu) == 0u);
  if ((highBits & 0x7fffffffu) == 0u && (lowBits & 0x7fffffffu) == 0u) {
    return vec2u(0u);
  }
  return vec2u(highBits, lowBits);
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
// Round an arithmetic accumulator to binary64 before splitting it. The
// aligned add/subtract paths retain three guard bits plus a sticky bit, which
// is sufficient for round-to-nearest-even at the binary64 boundary.
fn fp64_split_binary64_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  if (fp64_u64_is_zero(magnitude)) {
    return vec2u(0u);
  }

  let mostSignificantBit = 63u - fp64_u64_count_leading_zeros(magnitude);
  let exponent = baseExponent + i32(mostSignificantBit);
  if (exponent > 1023) {
    return vec2u((sign << 31u) | 0x7f800000u, 0u);
  }

  var roundedMagnitude = magnitude;
  var roundedBaseExponent = baseExponent;
  if (exponent >= -1022) {
    if (mostSignificantBit > 52u) {
      let shift = mostSignificantBit - 52u;
      roundedMagnitude = fp64_round_shift_right(magnitude, shift);
      roundedBaseExponent = baseExponent + i32(shift);
    }
  } else {
    let shift = -1074 - baseExponent;
    if (shift > 0) {
      roundedMagnitude = fp64_round_shift_right(magnitude, u32(shift));
      roundedBaseExponent = -1074;
    }
  }

  if (fp64_u64_is_zero(roundedMagnitude)) {
    return vec2u(0u);
  }
  return fp64_split_raw_accumulator_bits(sign, roundedMagnitude, roundedBaseExponent);
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_add_raw_f32_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_raw_f32_bits(aBits);
  let b = fp64_decode_raw_f32_bits(bBits);

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    if (a.isInf && b.isInf && a.sign != b.sign) {
      return vec2u(0x7fc00000u, 0u);
    }
    return select(vec2u(bBits, 0u), vec2u(aBits, 0u), a.isInf);
  }
  if (a.isZero && b.isZero) {
    return vec2u(0u);
  }
  if (a.isZero) {
    return vec2u(bBits, 0u);
  }
  if (b.isZero) {
    return vec2u(aBits, 0u);
  }

  let exponentDifference = abs(a.baseExponent - b.baseExponent);
  if (exponentDifference > 25) {
    if (fp64_raw_f32_magnitude_compare(aBits, bBits) >= 0) {
      return vec2u(aBits, bBits);
    }
    return vec2u(bBits, aBits);
  }

  let commonBaseExponent = min(a.baseExponent, b.baseExponent);
  let aMagnitude = fp64_u64_shift_left(
    vec2u(0u, a.significand),
    u32(a.baseExponent - commonBaseExponent)
  );
  let bMagnitude = fp64_u64_shift_left(
    vec2u(0u, b.significand),
    u32(b.baseExponent - commonBaseExponent)
  );

  var resultSign = a.sign;
  var resultMagnitude: vec2u;
  if (a.sign == b.sign) {
    resultMagnitude = fp64_u64_add(aMagnitude, bMagnitude);
  } else {
    let comparison = fp64_u64_compare(aMagnitude, bMagnitude);
    if (comparison == 0) {
      return vec2u(0u);
    }
    if (comparison > 0) {
      resultMagnitude = fp64_u64_sub(aMagnitude, bMagnitude);
    } else {
      resultSign = b.sign;
      resultMagnitude = fp64_u64_sub(bMagnitude, aMagnitude);
    }
  }

  return fp64_split_raw_accumulator_bits(
    resultSign,
    resultMagnitude,
    commonBaseExponent
  );
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_add_aligned_magnitudes_to_fp64_bits(
  sign: u32,
  larger: Fp64Bits,
  smaller: Fp64Bits
) -> vec2u {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_add(largeSignificand, smallSignificand);
  return fp64_split_binary64_accumulator_bits(
    sign,
    resultSignificand,
    larger.exponent - 55
  );
}

fn fp64_sub_aligned_magnitudes_to_fp64_bits(
  sign: u32,
  larger: Fp64Bits,
  smaller: Fp64Bits
) -> vec2u {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_sub(largeSignificand, smallSignificand);
  return fp64_split_binary64_accumulator_bits(
    sign,
    resultSignificand,
    larger.exponent - 55
  );
}

fn fp64_add_aligned_magnitudes_to_f32_bits(sign: u32, larger: Fp64Bits, smaller: Fp64Bits) -> u32 {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_add(largeSignificand, smallSignificand);
  return fp64_make_f32_bits_from_u64(sign, resultSignificand, larger.exponent - 55);
}

fn fp64_sub_aligned_magnitudes_to_f32_bits(sign: u32, larger: Fp64Bits, smaller: Fp64Bits) -> u32 {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_sub(largeSignificand, smallSignificand);
  return fp64_make_f32_bits_from_u64(sign, resultSignificand, larger.exponent - 55);
}

// Subtract two raw binary64 values and round the exact result once to f32.
// The input words are canonical high/low words: .x contains sign/exponent/high
// fraction bits, and .y contains the low 32 fraction bits.
fn sub_fp64u32_to_f32_bits(aBits: vec2u, bBits: vec2u) -> u32 {
  let a = fp64_decode_bits(aBits);
  let b = fp64_decode_bits(bBits);
  let bSubtractionSign = b.sign ^ 1u;

  if (a.isNan || b.isNan) {
    return 0x7fc00000u;
  }
  if (a.isInf && b.isInf) {
    if (a.sign == bSubtractionSign) {
      return (a.sign << 31u) | 0x7f800000u;
    }
    return 0x7fc00000u;
  }
  if (a.isInf) {
    return (a.sign << 31u) | 0x7f800000u;
  }
  if (b.isInf) {
    return (bSubtractionSign << 31u) | 0x7f800000u;
  }
  if (a.isZero && b.isZero) {
    return select(0u, 0x80000000u, a.sign == 1u && b.sign == 0u);
  }

  let magnitudeComparison = fp64_finite_magnitude_compare(a, b);
  if (a.sign == bSubtractionSign) {
    if (magnitudeComparison >= 0) {
      return fp64_add_aligned_magnitudes_to_f32_bits(a.sign, a, b);
    }
    return fp64_add_aligned_magnitudes_to_f32_bits(a.sign, b, a);
  }

  if (magnitudeComparison == 0) {
    return 0u;
  }
  if (magnitudeComparison > 0) {
    return fp64_sub_aligned_magnitudes_to_f32_bits(a.sign, a, b);
  }
  return fp64_sub_aligned_magnitudes_to_f32_bits(bSubtractionSign, b, a);
}

fn sub_fp64u32_to_f32(aBits: vec2u, bBits: vec2u) -> f32 {
  return bitcast<f32>(sub_fp64u32_to_f32_bits(aBits, bBits));
}

// Subtract two raw binary64 values, round once to binary64, then split the
// result into normalized f32 limbs. Finite results must fit within the f32
// exponent range; larger magnitudes map to infinity and smaller magnitudes
// map to zero. The input words use canonical high/low word order.
fn sub_fp64u32_to_fp64_bits(aBits: vec2u, bBits: vec2u) -> vec2u {
  let a = fp64_decode_bits(aBits);
  let b = fp64_decode_bits(bBits);
  let bSubtractionSign = b.sign ^ 1u;

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf && b.isInf) {
    if (a.sign == bSubtractionSign) {
      return vec2u((a.sign << 31u) | 0x7f800000u, 0u);
    }
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf) {
    return vec2u((a.sign << 31u) | 0x7f800000u, 0u);
  }
  if (b.isInf) {
    return vec2u((bSubtractionSign << 31u) | 0x7f800000u, 0u);
  }
  if (a.isZero && b.isZero) {
    return vec2u(0u);
  }

  let magnitudeComparison = fp64_finite_magnitude_compare(a, b);
  if (a.sign == bSubtractionSign) {
    if (magnitudeComparison >= 0) {
      return fp64_add_aligned_magnitudes_to_fp64_bits(a.sign, a, b);
    }
    return fp64_add_aligned_magnitudes_to_fp64_bits(a.sign, b, a);
  }

  if (magnitudeComparison == 0) {
    return vec2u(0u);
  }
  if (magnitudeComparison > 0) {
    return fp64_sub_aligned_magnitudes_to_fp64_bits(a.sign, a, b);
  }
  return fp64_sub_aligned_magnitudes_to_fp64_bits(bSubtractionSign, b, a);
}

fn sub_fp64u32_to_fp64(aBits: vec2u, bBits: vec2u) -> vec2f {
  let resultBits = sub_fp64u32_to_fp64_bits(aBits, bBits);
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_runtime_zero() -> f32 {
  return fp64arithmetic.ONE * 0.0;
}

fn prevent_fp64_optimization(value: f32) -> f32 {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  return value + fp64_runtime_zero();
#else
  return value;
#endif
}
#endif

#ifdef LUMA_FP64_INTEGER_ARITHMETIC
${ta}
#else
fn split(a: f32) -> vec2f {
  let splitValue = prevent_fp64_optimization(fp64arithmetic.SPLIT + fp64_runtime_zero());
  let t = prevent_fp64_optimization(a * splitValue);
  let temp = prevent_fp64_optimization(t - a);
  let aHi = prevent_fp64_optimization(t - temp);
  let aLo = prevent_fp64_optimization(a - aHi);
  return vec2f(aHi, aLo);
}

fn split2(a: vec2f) -> vec2f {
  var b = split(a.x);
  b.y = b.y + a.y;
  return b;
}

fn quickTwoSum(a: f32, b: f32) -> vec2f {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let sum = prevent_fp64_optimization((a + b) * fp64arithmetic.ONE);
  let err = prevent_fp64_optimization(b - (sum - a) * fp64arithmetic.ONE);
#else
  let sum = prevent_fp64_optimization(a + b);
  let err = prevent_fp64_optimization(b - (sum - a));
#endif
  return vec2f(sum, err);
}

fn twoSum(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a + b);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let v = prevent_fp64_optimization((s * fp64arithmetic.ONE - a) * fp64arithmetic.ONE);
  let err =
    prevent_fp64_optimization((a - (s - v) * fp64arithmetic.ONE) *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE) +
    prevent_fp64_optimization(b - v);
#else
  let v = prevent_fp64_optimization(s - a);
  let err = prevent_fp64_optimization(a - (s - v)) + prevent_fp64_optimization(b - v);
#endif
  return vec2f(s, err);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a - b);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let v = prevent_fp64_optimization((s * fp64arithmetic.ONE - a) * fp64arithmetic.ONE);
  let err =
    prevent_fp64_optimization((a - (s - v) * fp64arithmetic.ONE) *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE) -
    prevent_fp64_optimization(b + v);
#else
  let v = prevent_fp64_optimization(s - a);
  let err = prevent_fp64_optimization(a - (s - v)) - prevent_fp64_optimization(b + v);
#endif
  return vec2f(s, err);
}

fn twoSqr(a: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * a);
  let aFp64 = split(a);
  let highProduct = prevent_fp64_optimization(aFp64.x * aFp64.x);
  let crossProduct = prevent_fp64_optimization(2.0 * aFp64.x * aFp64.y);
  let lowProduct = prevent_fp64_optimization(aFp64.y * aFp64.y);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let err =
    (prevent_fp64_optimization(highProduct - prod) * fp64arithmetic.ONE +
      crossProduct * fp64arithmetic.ONE * fp64arithmetic.ONE) +
    lowProduct * fp64arithmetic.ONE * fp64arithmetic.ONE * fp64arithmetic.ONE;
#else
  let err = ((prevent_fp64_optimization(highProduct - prod) + crossProduct) + lowProduct);
#endif
  return vec2f(prod, err);
}

fn twoProd(a: f32, b: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * b);
  let aFp64 = split(a);
  let bFp64 = split(b);
  let highProduct = prevent_fp64_optimization(aFp64.x * bFp64.x);
  let crossProduct1 = prevent_fp64_optimization(aFp64.x * bFp64.y);
  let crossProduct2 = prevent_fp64_optimization(aFp64.y * bFp64.x);
  let lowProduct = prevent_fp64_optimization(aFp64.y * bFp64.y);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let err1 = (highProduct - prod) * fp64arithmetic.ONE;
  let err2 = crossProduct1 * fp64arithmetic.ONE * fp64arithmetic.ONE;
  let err3 = crossProduct2 * fp64arithmetic.ONE * fp64arithmetic.ONE * fp64arithmetic.ONE;
  let err4 =
    lowProduct *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE;
#else
  let err1 = highProduct - prod;
  let err2 = crossProduct1;
  let err3 = crossProduct2;
  let err4 = lowProduct;
#endif
  let err12InputA = prevent_fp64_optimization(err1);
  let err12InputB = prevent_fp64_optimization(err2);
  let err12 = prevent_fp64_optimization(err12InputA + err12InputB);
  let err123InputA = prevent_fp64_optimization(err12);
  let err123InputB = prevent_fp64_optimization(err3);
  let err123 = prevent_fp64_optimization(err123InputA + err123InputB);
  let err1234InputA = prevent_fp64_optimization(err123);
  let err1234InputB = prevent_fp64_optimization(err4);
  let err = prevent_fp64_optimization(err1234InputA + err1234InputB);
  return vec2f(prod, err);
}

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  var s = twoSum(a.x, b.x);
  let t = twoSum(a.y, b.y);
  s.y = prevent_fp64_optimization(s.y + t.x);
  s = quickTwoSum(s.x, s.y);
  s.y = prevent_fp64_optimization(s.y + t.y);
  s = quickTwoSum(s.x, s.y);
  return s;
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  var s = twoSub(a.x, b.x);
  let t = twoSub(a.y, b.y);
  s.y = prevent_fp64_optimization(s.y + t.x);
  s = quickTwoSum(s.x, s.y);
  s.y = prevent_fp64_optimization(s.y + t.y);
  s = quickTwoSum(s.x, s.y);
  return s;
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  var prod = twoProd(a.x, b.x);
  let crossProduct1 = prevent_fp64_optimization(a.x * b.y);
  prod.y = prevent_fp64_optimization(prod.y + crossProduct1);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  let crossProduct2 = prevent_fp64_optimization(a.y * b.x);
  prod.y = prevent_fp64_optimization(prod.y + crossProduct2);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  return prod;
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let xn = prevent_fp64_optimization(1.0 / b.x);
  let yn = mul_fp64(a, vec2f(xn, fp64_runtime_zero()));
  let diff = prevent_fp64_optimization(sub_fp64(a, mul_fp64(b, yn)).x);
  let prod = twoProd(xn, diff);
  return sum_fp64(yn, prod);
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  if (a.x == 0.0 && a.y == 0.0) {
    return vec2f(0.0, 0.0);
  }
  if (a.x < 0.0) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  let x = prevent_fp64_optimization(1.0 / sqrt(a.x));
  let yn = prevent_fp64_optimization(a.x * x);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let ynSqr = twoSqr(yn) * fp64arithmetic.ONE;
#else
  let ynSqr = twoSqr(yn);
#endif
  let diff = prevent_fp64_optimization(sub_fp64(a, ynSqr).x);
  let prod = twoProd(prevent_fp64_optimization(x * 0.5), diff);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  return sum_fp64(split(yn), prod);
#else
  return sum_fp64(vec2f(yn, 0.0), prod);
#endif
}
#endif
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_f32_bits_is_nan(bits: u32) -> bool {
  return (bits & 0x7fffffffu) > 0x7f800000u;
}

fn fp64_f32_bits_is_inf(bits: u32) -> bool {
  return (bits & 0x7fffffffu) == 0x7f800000u;
}

fn fp64_compare_f32_bits(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == 0u && bMagnitude == 0u) {
    return 0;
  }
  let aSign = aBits >> 31u;
  let bSign = bBits >> 31u;
  if (aSign != bSign) {
    return select(1, -1, aSign == 1u);
  }
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  let magnitudeComparison = select(-1, 1, aMagnitude > bMagnitude);
  return select(magnitudeComparison, -magnitudeComparison, aSign == 1u);
}

// Normalize an arbitrary pair of finite f32 limbs with integer accumulation.
// This is independent of LUMA_FP64_INTEGER_ARITHMETIC and canonicalizes every
// representation of zero to vec2f(+0.0, +0.0).
fn normalize_fp64(value: vec2f) -> vec2f {
  let resultBits = fp64_add_raw_f32_bits(bitcast<u32>(value.x), bitcast<u32>(value.y));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn is_nan_fp64(value: vec2f) -> bool {
  let normalized = normalize_fp64(value);
  return fp64_f32_bits_is_nan(bitcast<u32>(normalized.x)) ||
    fp64_f32_bits_is_nan(bitcast<u32>(normalized.y));
}

fn is_finite_fp64(value: vec2f) -> bool {
  let normalized = normalize_fp64(value);
  let highBits = bitcast<u32>(normalized.x);
  let lowBits = bitcast<u32>(normalized.y);
  return !fp64_f32_bits_is_nan(highBits) && !fp64_f32_bits_is_nan(lowBits) &&
    !fp64_f32_bits_is_inf(highBits) && !fp64_f32_bits_is_inf(lowBits);
}

// Returns -1, 0, or 1. NaN is unordered and returns 0; call is_nan_fp64 or
// is_finite_fp64 first when 0 must mean a finite zero.
fn sign_fp64(value: vec2f) -> i32 {
  let normalized = normalize_fp64(value);
  let highBits = bitcast<u32>(normalized.x);
  let lowBits = bitcast<u32>(normalized.y);
  if (fp64_f32_bits_is_nan(highBits) || fp64_f32_bits_is_nan(lowBits)) {
    return 0;
  }
  if ((highBits & 0x7fffffffu) != 0u) {
    return select(1, -1, (highBits >> 31u) == 1u);
  }
  if ((lowBits & 0x7fffffffu) != 0u) {
    return select(1, -1, (lowBits >> 31u) == 1u);
  }
  return 0;
}

// Compares double-single values and returns -1, 0, or 1. NaN is unordered
// and returns 0; callers that require equality semantics must first check
// is_nan_fp64 or is_finite_fp64.
fn compare_fp64(a: vec2f, b: vec2f) -> i32 {
  let normalizedA = normalize_fp64(a);
  let normalizedB = normalize_fp64(b);
  let aHighBits = bitcast<u32>(normalizedA.x);
  let aLowBits = bitcast<u32>(normalizedA.y);
  let bHighBits = bitcast<u32>(normalizedB.x);
  let bLowBits = bitcast<u32>(normalizedB.y);
  if (fp64_f32_bits_is_nan(aHighBits) || fp64_f32_bits_is_nan(aLowBits) ||
      fp64_f32_bits_is_nan(bHighBits) || fp64_f32_bits_is_nan(bLowBits)) {
    return 0;
  }
  let highComparison = fp64_compare_f32_bits(aHighBits, bHighBits);
  if (highComparison != 0) {
    return highComparison;
  }
  return fp64_compare_f32_bits(aLowBits, bLowBits);
}
#endif
`,fs:ts,vs:ts,defaultUniforms:{ONE:1,SPLIT:4097},uniformTypes:{ONE:"f32",SPLIT:"f32"},fp64ify:tn,fp64LowPart:function(t){return t-Math.fround(t)},fp64ifyMatrix4:function(t){let e=new Float32Array(32);for(let i=0;i<4;++i)for(let r=0;r<4;++r){let n=4*i+r;tn(t[4*r+i],e,2*n)}return e}};function tl(t){let{source:e,target:i,start:r=0,size:n,getData:s}=t,a=t.end||i.length,o=e.length,l=a-r;if(o>l)return void i.set(e.subarray(0,l),r);if(i.set(e,r),!s)return;let u=o;for(;u<l;){let t=s(u,e);for(let e=0;e<n;e++)i[r+u]=t[e]||0,u++}}function tu(t){switch(t){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw Error(`No defined attribute type for size "${t}"`)}}function tc(t){switch(t){case 1:return"float32";case 2:return"float32x2";case 3:return"float32x3";case 4:return"float32x4";default:throw Error("invalid type size")}}function th(t){t.push(t.shift())}function tf({device:t,source:e,target:i}){return(!i||i.byteLength<e.byteLength)&&(i?.destroy(),i=t.createBuffer({byteLength:e.byteLength,usage:e.usage})),i}function td({device:t,buffer:e,attribute:i,fromLength:r,toLength:n,fromStartIndices:s,getData:a=t=>t}){let o=i.isDoublePrecisionBuffer?2:1,l=i.size*o,u=i.byteOffset,c=i.settings.bytesPerElement<4?u/i.settings.bytesPerElement*4:u,h=i.startIndices,f=s&&h,d=i.isConstant;if(!f&&e&&r>=n)return e;let p=i.value instanceof Float64Array?Float32Array:i.value.constructor,g=d?i.value:new p(i.getBuffer().readSyncWebGL(u,n*p.BYTES_PER_ELEMENT).buffer);if(i.settings.normalized&&!d){let t=a;a=(e,r)=>i.normalizeConstant(t(e,r))}let m=d?(t,e)=>a(g,e):(t,e)=>a(g.subarray(t+u,t+u+l),e),_=new Float32Array(e?e.readSyncWebGL(c,4*r).buffer:0),b=new Float32Array(n);return!function({source:t,target:e,size:i,getData:r,sourceStartIndices:n,targetStartIndices:s}){if(!n||!s)return tl({source:t,target:e,size:i,getData:r});let a=0,o=0,l=r&&((t,e)=>r(t+o,e)),u=Math.min(n.length,s.length);for(let r=1;r<u;r++){let u=n[r]*i,c=s[r]*i;tl({source:t.subarray(a,u),target:e,start:o,end:c,size:i,getData:l}),a=u,o=c}o<e.length&&tl({source:[],target:e,start:o,size:i,getData:l})}({source:_,target:b,sourceStartIndices:s,targetStartIndices:h,size:l,getData:m}),(!e||e.byteLength<b.byteLength+c)&&(e?.destroy(),e=t.createBuffer({byteLength:b.byteLength+c,usage:35050})),e.write(b,c),e}var tp=i(2357);class tg{constructor({device:t,attribute:e,timeline:i}){this.buffers=[],this.currentLength=0,this.device=t,this.transition=new tp.A(i),this.attribute=e,this.attributeInTransition=function(t){let{device:e,settings:i,value:r}=t,n=new w(e,i);return n.setData({value:r instanceof Float64Array?new Float64Array(0):new Float32Array(0),normalized:i.normalized}),n}(e),this.currentStartIndices=e.startIndices}get inProgress(){return this.transition.inProgress}start(t,e,i=1/0){this.settings=t,this.currentStartIndices=this.attribute.startIndices,this.currentLength=function(t,e){let{settings:i,value:r,size:n}=t,s=t.isDoublePrecisionBuffer?2:1,a=0,{shaderAttributes:o}=t.settings;if(o)for(let t of Object.values(o))a=Math.max(a,t.vertexOffset??0);return(i.noAlloc?r.length:(e+a)*n)*s}(this.attribute,e),this.transition.start({...t,duration:i})}update(){let t=this.transition.update();return t&&this.onUpdate(),t}setBuffer(t){let{stride:e}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:t,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:e})}cancel(){this.transition.cancel()}delete(){for(let t of(this.cancel(),this.buffers))t.destroy();this.buffers.length=0}}let tm={name:"interpolation",vs:`\
layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,uniformTypes:{time:"f32"}},t_=`\
#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,tb=`\
#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aFrom64Low;
in ATTRIBUTE_TYPE aTo;
in ATTRIBUTE_TYPE aTo64Low;
out ATTRIBUTE_TYPE vCurrent;
out ATTRIBUTE_TYPE vCurrent64Low;

vec2 mix_fp64(vec2 a, vec2 b, float x) {
  vec2 range = sub_fp64(b, a);
  return sum_fp64(a, mul_fp64(range, vec2(x, 0.0)));
}

void main(void) {
  for (int i=0; i<ATTRIBUTE_SIZE; i++) {
    vec2 value = mix_fp64(vec2(aFrom[i], aFrom64Low[i]), vec2(aTo[i], aTo64Low[i]), interpolation.time);
    vCurrent[i] = value.x;
    vCurrent64Low[i] = value.y;
  }
  gl_Position = vec4(0.0);
}
`;function tv(t){return t.isDoublePrecisionBuffer}let ty={name:"spring",vs:`\
layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,uniformTypes:{damping:"f32",stiffness:"f32"}},tE=`\
#version 300 es
#define SHADER_NAME spring-transition-vertex-shader

#define EPSILON 0.00001

in ATTRIBUTE_TYPE aPrev;
in ATTRIBUTE_TYPE aCur;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vNext;
out float vIsTransitioningFlag;

ATTRIBUTE_TYPE getNextValue(ATTRIBUTE_TYPE cur, ATTRIBUTE_TYPE prev, ATTRIBUTE_TYPE dest) {
  ATTRIBUTE_TYPE velocity = cur - prev;
  ATTRIBUTE_TYPE delta = dest - cur;
  ATTRIBUTE_TYPE force = delta * spring.stiffness;
  ATTRIBUTE_TYPE resistance = velocity * spring.damping;
  return force - resistance + velocity + cur;
}

void main(void) {
  bool isTransitioning = length(aCur - aPrev) > EPSILON || length(aTo - aCur) > EPSILON;
  vIsTransitioningFlag = isTransitioning ? 1.0 : 0.0;

  vNext = getNextValue(aCur, aPrev, aTo);
  gl_Position = vec4(0, 0, 0, 1);
  gl_PointSize = 100.0;
}
`,tM=`\
#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`,tw={interpolation:class extends tg{constructor({device:t,attribute:e,timeline:i}){var r,n;let s,a,o,l;super({device:t,attribute:e,timeline:i}),this.type="interpolation",this.transform=(r=t,a=tu(s=(n=e).size),o=tc(s),l=n.getBufferLayout(),tv(n)?new tr.p(r,{vs:tb,bufferLayout:[{name:"aFrom",byteStride:8*s,attributes:[{attribute:"aFrom",format:o,byteOffset:0},{attribute:"aFrom64Low",format:o,byteOffset:4*s}]},{name:"aTo",byteStride:8*s,attributes:[{attribute:"aTo",format:o,byteOffset:0},{attribute:"aTo64Low",format:o,byteOffset:4*s}]}],modules:[to,tm],defines:{ATTRIBUTE_TYPE:a,ATTRIBUTE_SIZE:s},moduleSettings:{},varyings:["vCurrent","vCurrent64Low"],bufferMode:35980,disableWarnings:!0}):new tr.p(r,{vs:t_,bufferLayout:[{name:"aFrom",format:o},{name:"aTo",format:l.attributes[0].format}],modules:[tm],defines:{ATTRIBUTE_TYPE:a},varyings:["vCurrent"],disableWarnings:!0}))}start(t,e){let i=this.currentLength,r=this.currentStartIndices;if(super.start(t,e,t.duration),t.duration<=0)return void this.transition.cancel();let{buffers:n,attribute:s}=this;th(n),n[0]=td({device:this.device,buffer:n[0],attribute:s,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:t.enter}),n[1]=tf({device:this.device,source:n[0],target:n[1]}),this.setBuffer(n[1]);let{transform:a}=this,o=a.model,l=Math.floor(this.currentLength/s.size);tv(s)&&(l/=2),o.setVertexCount(l),s.isConstant?(o.setAttributes({aFrom:n[0]}),o.setConstantAttributes({aTo:s.value})):o.setAttributes({aFrom:n[0],aTo:s.getBuffer()}),a.transformFeedback.setBuffers({vCurrent:n[1]})}onUpdate(){let{duration:t,easing:e}=this.settings,{time:i}=this.transition,r=i/t;e&&(r=e(r));let{model:n}=this.transform,s={time:r};n.shaderInputs.setProps({interpolation:s}),this.transform.run({discard:!0})}delete(){super.delete(),this.transform.destroy()}},spring:class extends tg{constructor({device:t,attribute:e,timeline:i}){var r,n,s,a;let o,l;super({device:t,attribute:e,timeline:i}),this.type="spring",this.texture=t.createTexture({data:new Uint8Array(4),format:"rgba8unorm",width:1,height:1}),this.framebuffer=(r=t,n=this.texture,r.createFramebuffer({id:"spring-transition-is-transitioning-framebuffer",width:1,height:1,colorAttachments:[n]})),this.transform=(s=t,o=tu((a=e).size),l=tc(a.size),new tr.p(s,{vs:tE,fs:tM,bufferLayout:[{name:"aPrev",format:l},{name:"aCur",format:l},{name:"aTo",format:a.getBufferLayout().attributes[0].format}],varyings:["vNext"],modules:[ty],defines:{ATTRIBUTE_TYPE:o},parameters:{depthCompare:"always",blendColorOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}}))}start(t,e){let i=this.currentLength,r=this.currentStartIndices;super.start(t,e);let{buffers:n,attribute:s}=this;for(let e=0;e<2;e++)n[e]=td({device:this.device,buffer:n[e],attribute:s,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:t.enter});n[2]=tf({device:this.device,source:n[0],target:n[2]}),this.setBuffer(n[1]);let{model:a}=this.transform;a.setVertexCount(Math.floor(this.currentLength/s.size)),s.isConstant?a.setConstantAttributes({aTo:s.value}):a.setAttributes({aTo:s.getBuffer()})}onUpdate(){let{buffers:t,transform:e,framebuffer:i,transition:r}=this,n=this.settings;e.model.setAttributes({aPrev:t[0],aCur:t[1]}),e.transformFeedback.setBuffers({vNext:t[2]});let s={stiffness:n.stiffness,damping:n.damping};e.model.shaderInputs.setProps({spring:s}),e.run({framebuffer:i,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),th(t),this.setBuffer(t[1]),this.device.readPixelsToArrayWebGL(i)[0]>0||r.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}}};class tx{constructor(t,{id:e,timeline:i}){if(!t)throw Error("AttributeTransitionManager is constructed without device");this.id=e,this.device=t,this.timeline=i,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let t in this.transitions)this._removeTransition(t)}update({attributes:t,transitions:e,numInstances:i}){for(let r in this.numInstances=i||1,t){let i=t[r],n=i.getTransitionSetting(e);n&&this._updateAttribute(r,i,n)}for(let i in this.transitions){let r=t[i];r&&r.getTransitionSetting(e)||this._removeTransition(i)}}hasAttribute(t){let e=this.transitions[t];return e&&e.inProgress}getAttributes(){let t={};for(let e in this.transitions){let i=this.transitions[e];i.inProgress&&(t[e]=i.attributeInTransition)}return t}run(){if(0===this.numInstances)return!1;for(let t in this.transitions)this.transitions[t].update()&&(this.needsRedraw=!0);let t=this.needsRedraw;return this.needsRedraw=!1,t}_removeTransition(t){this.transitions[t].delete(),delete this.transitions[t]}_updateAttribute(t,e,i){let r=this.transitions[t],n=!r||r.type!==i.type;if(n){r&&this._removeTransition(t);let s=tw[i.type];s?this.transitions[t]=new s({attribute:e,timeline:this.timeline,device:this.device}):(d.A.error(`unsupported transition type '${i.type}'`)(),n=!1)}(n||e.needsRedraw())&&(this.needsRedraw=!0,this.transitions[t].start(i,this.numInstances))}}let tP="attributeManager.invalidate";class tA{constructor(t,{id:e="attribute-manager",stats:i,timeline:r}={}){this.mergeBoundsMemoized=(0,te.A)(f._Z),this.id=e,this.device=t,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=i,this.attributeTransitionManager=new tx(t,{id:`${e}-transitions`,timeline:r}),this.attributeBufferGroups="webgpu"===t.type?new J(t,{id:e,isTransitionAttribute:t=>this.attributeTransitionManager.hasAttribute(t)}):null,Object.seal(this)}finalize(){for(let t in this.attributeBufferGroups?.finalize(),this.attributes)this.attributes[t].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(t={clearRedrawFlags:!1}){let e=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!t.clearRedrawFlags,e&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(t){this._add(t)}addInstanced(t){this._add(t,{stepMode:"instance"})}remove(t){for(let e of t)void 0!==this.attributes[e]&&(this.attributes[e].delete(),delete this.attributes[e])}invalidate(t,e){let i=this._invalidateTrigger(t,e);(0,ti.A)(tP,this,t,i)}invalidateAll(t){for(let e in this.attributes)this.attributes[e].setNeedsUpdate(e,t);(0,ti.A)(tP,this,"all")}update({data:t,numInstances:e,startIndices:i=null,transitions:r,props:n={},buffers:s={},context:a={}}){let o=!1;for(let r in(0,ti.A)("attributeManager.updateStart",this),this.stats&&this.stats.get("Update Attributes").timeStart(),this.attributes){let l=this.attributes[r],u=l.settings.accessor;l.startIndices=i,l.numInstances=e,n[r]&&d.A.removed(`props.${r}`,`data.attributes.${r}`)(),l.setExternalBuffer(s[r])||l.setBinaryValue("string"==typeof u?s[u]:void 0,t.startIndices)||"string"==typeof u&&!s[u]&&l.setConstantValue(a,n[u])||l.needsUpdate()&&(o=!0,this._updateAttribute({attribute:l,numInstances:e,data:t,props:n,context:a})),this.needsRedraw=this.needsRedraw||l.needsRedraw()}o&&(0,ti.A)("attributeManager.updateEnd",this,e),this.stats&&(this.stats.get("Update Attributes").timeEnd(),o&&this.stats.get("Attributes updated").incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:e,transitions:r})}updateTransition(){let{attributeTransitionManager:t}=this,e=t.run();return this.needsRedraw=this.needsRedraw||e,e}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getBounds(t){let e=t.map(t=>this.attributes[t]?.getBounds());return this.mergeBoundsMemoized(e)}getChangedAttributes(t={clearChangedFlags:!1}){let{attributes:e,attributeTransitionManager:i}=this,r={...i.getAttributes()};for(let n in e){let s=e[n];s.needsRedraw(t)&&!i.hasAttribute(n)&&(r[n]=s)}return r}getBufferLayouts(t){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),t):Object.values(this.getAttributes()).map(e=>e.getBufferLayout(t))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(t,e,i={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),t,e,i):{bufferLayouts:this.getBufferLayouts(e),buffers:{},groupedAttributeIds:new Set}}_add(t,e){for(let i in t){let r=t[i],n={...r,id:i,size:r.isIndexed&&1||r.size||1,...e};this.attributes[i]=new w(this.device,n)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let t={};for(let e in this.attributes)this.attributes[e].getUpdateTriggers().forEach(i=>{t[i]||(t[i]=[]),t[i].push(e)});this.updateTriggers=t}_invalidateTrigger(t,e){let{attributes:i,updateTriggers:r}=this,n=r[t];return n&&n.forEach(t=>{let r=i[t];r&&r.setNeedsUpdate(r.id,e)}),n}_updateAttribute(t){let{attribute:e,numInstances:i}=t;((0,ti.A)("attribute.updateStart",e),e.constant)?e.setConstantValue(t.context,e.value):(e.allocate(i)&&(0,ti.A)("attribute.allocate",e,i),e.updateBuffer(t)&&(this.needsRedraw=!0,(0,ti.A)("attribute.updateEnd",e,i)))}}var tS=i(41481);class tO extends tp.A{get value(){return this._value}_onUpdate(){let{time:t,settings:{fromValue:e,toValue:i,duration:r,easing:n}}=this,s=n(t/r);this._value=(0,tS.lerp)(e,i,s)}}function tT(t,e,i,r,n){let s=e-t;return(i-e)*n+-s*r+s+e}function tI(t,e){if(Array.isArray(t)){let i=0;for(let r=0;r<t.length;r++){let n=t[r]-e[r];i+=n*n}return Math.sqrt(i)}return Math.abs(t-e)}class tL extends tp.A{get value(){return this._currValue}_onUpdate(){let{fromValue:t,toValue:e,damping:i,stiffness:r}=this.settings,{_prevValue:n=t,_currValue:s=t}=this,a=function(t,e,i,r,n){if(Array.isArray(i)){let s=[];for(let a=0;a<i.length;a++)s[a]=tT(t[a],e[a],i[a],r,n);return s}return tT(t,e,i,r,n)}(n,s,e,i,r),o=tI(a,e),l=tI(a,s);o<1e-5&&l<1e-5&&(a=e,this.end()),this._prevValue=s,this._currValue=a}}let tB={interpolation:tO,spring:tL};class tC{constructor(t){this.transitions=new Map,this.timeline=t}get active(){return this.transitions.size>0}add(t,e,i,r){let{transitions:n}=this;if(n.has(t)){let i=n.get(t),{value:r=i.settings.fromValue}=i;e=r,this.remove(t)}if(!(r=M(r)))return;let s=tB[r.type];if(!s)return void d.A.error(`unsupported transition type '${r.type}'`)();let a=new s(this.timeline);a.start({...r,fromValue:e,toValue:i}),n.set(t,a)}remove(t){let{transitions:e}=this;e.has(t)&&(e.get(t).cancel(),e.delete(t))}update(){let t={};for(let[e,i]of this.transitions)i.update(),t[e]=i.value,i.inProgress||this.remove(e);return t}clear(){for(let t of this.transitions.keys())this.remove(t)}}var tR=i(12897);function tN({newProps:t,oldProps:e,ignoreProps:i={},propTypes:r={},triggerName:n="props"}){if(e===t)return!1;if("object"!=typeof t||null===t||"object"!=typeof e||null===e)return`${n} changed shallowly`;for(let s of Object.keys(t))if(!(s in i)){if(!(s in e))return`${n}.${s} added`;let i=tk(t[s],e[s],r[s]);if(i)return`${n}.${s} ${i}`}for(let s of Object.keys(e))if(!(s in i)){if(!(s in t))return`${n}.${s} dropped`;if(!Object.hasOwnProperty.call(t,s)){let i=tk(t[s],e[s],r[s]);if(i)return`${n}.${s} ${i}`}}return!1}function tk(t,e,i){let r=i&&i.equal;return r&&!r(t,e,i)||!r&&(r=t&&e&&t.equals)&&!r.call(t,e)?"changed deeply":r||e===t?null:"changed shallowly"}function tz(t,e,i){let r=t.updateTriggers[i];r=null==r?{}:r;let n=e.updateTriggers[i];return tN({oldProps:n=null==n?{}:n,newProps:r,triggerName:i})}function tj(t,e){if(!e)return t;let i={...t,...e};if("defines"in e&&(i.defines={...t.defines,...e.defines}),"modules"in e&&(i.modules=(t.modules||[]).concat(e.modules),e.modules.some(t=>"project64"===t.name))){let t=i.modules.findIndex(t=>"project32"===t.name);t>=0&&i.modules.splice(t,1)}if("inject"in e)if(t.inject){let r={...t.inject};for(let t in e.inject)r[t]=(r[t]||"")+e.inject[t];i.inject=r}else i.inject=e.inject;return i}var tU=i(74334),tF=i(78374),tD=i(88967);let tV=[0,0,0];function t$(t,e,i=!1){let r=e.projectPosition(t);if(i&&e instanceof tF.A){let[i,n,s=0]=t,a=e.getDistanceScales([i,n]);r[2]=s*a.unitsPerMeter[2]}return r}function tY(t,{viewport:e,modelMatrix:i,coordinateSystem:r,coordinateOrigin:n,offsetMode:s}){let[a,o,l=0]=t;switch(i&&([a,o,l]=tS.vec4.transformMat4([],[a,o,l,1],i)),r){case"default":return tY(t,{viewport:e,modelMatrix:i,coordinateSystem:e.isGeospatial?"lnglat":"cartesian",coordinateOrigin:n,offsetMode:s});case"lnglat":return t$([a,o,l],e,s);case"lnglat-offsets":return t$([a+n[0],o+n[1],l+(n[2]||0)],e,s);case"meter-offsets":return t$((0,tD.dT)(n,[a,o,l]),e,s);case"cartesian":return e.isGeospatial?[a+n[0],o+n[1],l+n[2]]:e.projectPosition([a,o,l]);default:throw Error(`Invalid coordinateSystem: ${r}`)}}var tq=i(95335),tG=i(80698);let tW={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},tX={};var tZ=i(7914);let tH={boolean:{validate:(t,e)=>!0,equal:(t,e,i)=>!!t==!!e},number:{validate:(t,e)=>Number.isFinite(t)&&(!("max"in e)||t<=e.max)&&(!("min"in e)||t>=e.min)},color:{validate:(t,e)=>e.optional&&!t||tJ(t)&&(3===t.length||4===t.length),equal:(t,e,i)=>(0,tZ.b)(t,e,1)},accessor:{validate(t,e){let i=tQ(t);return"function"===i||i===tQ(e.value)},equal:(t,e,i)=>"function"==typeof e||(0,tZ.b)(t,e,1)},array:{validate:(t,e)=>e.optional&&!t||tJ(t),equal(t,e,i){let{compare:r}=i,n=Number.isInteger(r)?r:+!!r;return r?(0,tZ.b)(t,e,n):t===e}},object:{equal(t,e,i){if(i.ignore)return!0;let{compare:r}=i,n=Number.isInteger(r)?r:+!!r;return r?(0,tZ.b)(t,e,n):t===e}},function:{validate:(t,e)=>e.optional&&!t||"function"==typeof t,equal:(t,e,i)=>!i.compare&&!1!==i.ignore||t===e},data:{transform:(t,e,i)=>{if(!t)return t;let{dataTransform:r}=i.props;return r?r(t):"string"==typeof t.shape&&t.shape.endsWith("-table")&&Array.isArray(t.data)?t.data:t}},image:{transform:(t,e,i)=>{let r=i.context;return r&&r.device?function(t,e,i,r){if(i instanceof tG.g)return i;i.constructor&&"Object"!==i.constructor.name&&(i={data:i});let n=null;i.compressed&&(n={minFilter:"linear",mipmapFilter:i.data.length>1?"nearest":"linear"});let{width:s,height:a}=i.data,o=e.createTexture({...i,sampler:{...tW,...n,...r},mipLevels:e.getMipLevelCount(s,a)});return"webgl"===e.type?o.generateMipmapsWebGL():"webgpu"===e.type&&e.generateMipmapsWebGPU(o),tX[o.id]=t,o}(i.id,r.device,t,{...e.parameters,...i.props.textureParameters}):null},release:(t,e,i)=>{var r;r=i.id,t&&t instanceof tG.g&&tX[t.id]===r&&(t.delete(),delete tX[t.id])}}};function tK(t,e){return"type"in e?{name:t,...tH[e.type],...e}:"value"in e?{name:t,type:tQ(e.value),...e}:{name:t,type:"object",value:e}}function tJ(t){return Array.isArray(t)||ArrayBuffer.isView(t)}function tQ(t){return tJ(t)?"array":null===t?"null":typeof t}function t0(t,e){return Object.prototype.hasOwnProperty.call(t,e)}let t1=0;class t2{constructor(...t){this.props=function(t,e){let i;for(let t=e.length-1;t>=0;t--){let r=e[t];"extensions"in r&&(i=r.extensions)}let r=Object.create(function t(e,i){var r,n;if(!(e instanceof t3.constructor))return{};let s="_mergedDefaultProps";if(i)for(let t of i){let e=t.constructor;e&&(s+=`:${e.extensionName||e.name}`)}let a=t0(r=e,n=s)&&r[n];return a||(e[s]=function(e,i){var r;let n;if(!e.prototype)return null;let s=t(Object.getPrototypeOf(e)),a=function(t){let e={},i={},r={};for(let[n,s]of Object.entries(t)){let t=s?.deprecatedFor;if(t)r[n]=Array.isArray(t)?t:[t];else{let t=function(t,e){switch(tQ(e)){case"object":return tK(t,e);case"array":return tK(t,{type:"array",value:e,compare:!1});case"boolean":return tK(t,{type:"boolean",value:e});case"number":return tK(t,{type:"number",value:e});case"function":return tK(t,{type:"function",value:e,compare:!0});default:return{name:t,type:"unknown",value:e}}}(n,s);e[n]=t,i[n]=t.value}}return{propTypes:e,defaultProps:i,deprecatedProps:r}}(function(t,e){return t0(t,e)&&t[e]}(e,"defaultProps")||{}),o=Object.assign(Object.create(null),s,a.defaultProps),l=Object.assign(Object.create(null),s?.[tR.fW],a.propTypes),u=Object.assign(Object.create(null),s?.[tR.uH],a.deprecatedProps);for(let e of i){let i=t(e.constructor);i&&(Object.assign(o,i),Object.assign(l,i[tR.fW]),Object.assign(u,i[tR.uH]))}return Object.defineProperties(o,{id:{writable:!0,value:((n=(r=e).componentName)||d.A.warn(`${r.name}.componentName not specified`)(),n||r.name)}}),function(t,e){let i={},r={};for(let t in e){let n=e[t],{name:s,value:a}=n;n.async&&(i[s]=a,r[s]=function(t){return{enumerable:!0,set(e){"string"==typeof e||e instanceof Promise||(0,_.Td)(e)?this[tR.YN][t]=e:this[tR.vf][t]=e},get(){if(this[tR.vf]){if(t in this[tR.vf])return this[tR.vf][t]||this[tR.jA][t];if(t in this[tR.YN]){let e=this[tR.r3]&&this[tR.r3].internalState;if(e&&e.hasAsyncProp(t))return e.getAsyncProp(t)||this[tR.jA][t]}}return this[tR.jA][t]}}}(s))}t[tR.jA]=i,t[tR.YN]={},Object.defineProperties(t,r)}(o,l),function(t,e){for(let i in e)Object.defineProperty(t,i,{enumerable:!1,set(t){let r=`${this.id}: ${i}`;for(let r of e[i])t0(this,r)||(this[r]=t);d.A.deprecated(r,e[i].join("/"))()}})}(o,u),o[tR.fW]=l,o[tR.uH]=u,0!==i.length||t0(e,"_propTypes")||(e._propTypes=l),o}(e,i||[]))}(t.constructor,i));r[tR.r3]=t,r[tR.YN]={},r[tR.vf]={};for(let t=0;t<e.length;++t){let i=e[t];for(let t in i)r[t]=i[t]}return Object.freeze(r),r}(this,t),this.id=this.props.id,this.count=t1++}clone(t){let{props:e}=this,i={};for(let t in e[tR.jA])t in e[tR.vf]?i[t]=e[tR.vf][t]:t in e[tR.YN]&&(i[t]=e[tR.YN][t]);return new this.constructor({...e,...i,...t})}}t2.componentName="Component",t2.defaultProps={};let t3=t2,t4=Object.freeze({});class t6{constructor(t){this.component=t,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let t in this.asyncProps){let e=this.asyncProps[t];e&&e.type&&e.type.release&&e.type.release(e.resolvedValue,e.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||t4}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(t){return t in this.asyncProps}getAsyncProp(t){let e=this.asyncProps[t];return e&&e.resolvedValue}isAsyncPropLoading(t){if(t){let e=this.asyncProps[t];return!!(e&&e.pendingLoadCount>0&&e.pendingLoadCount!==e.resolvedLoadCount)}for(let t in this.asyncProps)if(this.isAsyncPropLoading(t))return!0;return!1}reloadAsyncProp(t,e){this._watchPromise(t,Promise.resolve(e))}setAsyncProps(t){this.component=t[tR.r3]||this.component;let e=t[tR.vf]||{},i=t[tR.YN]||t,r=t[tR.jA]||{};for(let t in e){let i=e[t];this._createAsyncPropData(t,r[t]),this._updateAsyncProp(t,i),e[t]=this.getAsyncProp(t)}for(let t in i){let e=i[t];this._createAsyncPropData(t,r[t]),this._updateAsyncProp(t,e)}}_fetch(t,e){return null}_onResolve(t,e){}_onError(t,e){}_updateAsyncProp(t,e){if(this._didAsyncInputValueChange(t,e)){if("string"==typeof e&&(e=this._fetch(t,e)),e instanceof Promise)return void this._watchPromise(t,e);if((0,_.Td)(e))return void this._resolveAsyncIterable(t,e);this._setPropValue(t,e)}}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps)for(let t in this.oldAsyncProps=Object.create(this.oldProps),this.asyncProps)Object.defineProperty(this.oldAsyncProps,t,{enumerable:!0,value:this.oldProps[t]})}_didAsyncInputValueChange(t,e){let i=this.asyncProps[t];return e!==i.resolvedValue&&e!==i.lastValue&&(i.lastValue=e,!0)}_setPropValue(t,e){this._freezeAsyncOldProps();let i=this.asyncProps[t];i&&(e=this._postProcessValue(i,e),i.resolvedValue=e,i.pendingLoadCount++,i.resolvedLoadCount=i.pendingLoadCount)}_setAsyncPropValue(t,e,i){let r=this.asyncProps[t];r&&i>=r.resolvedLoadCount&&void 0!==e&&(this._freezeAsyncOldProps(),r.resolvedValue=e,r.resolvedLoadCount=i,this.onAsyncPropUpdated(t,e))}_watchPromise(t,e){let i=this.asyncProps[t];if(i){i.pendingLoadCount++;let r=i.pendingLoadCount;e.then(e=>{this.component&&(e=this._postProcessValue(i,e),this._setAsyncPropValue(t,e,r),this._onResolve(t,e))}).catch(e=>{this._onError(t,e)})}}async _resolveAsyncIterable(t,e){if("data"!==t)return void this._setPropValue(t,e);let i=this.asyncProps[t];if(!i)return;i.pendingLoadCount++;let r=i.pendingLoadCount,n=[],s=0;for await(let i of e){if(!this.component)return;let{dataTransform:e}=this.component.props;Object.defineProperty(n=e?e(i,n):n.concat(i),"__diff",{enumerable:!1,value:[{startRow:s,endRow:n.length}]}),s=n.length,this._setAsyncPropValue(t,n,r)}this._onResolve(t,n)}_postProcessValue(t,e){let i=t.type;return i&&this.component&&(i.release&&i.release(t.resolvedValue,i,this.component),i.transform)?i.transform(e,i,this.component):e}_createAsyncPropData(t,e){if(!this.asyncProps[t]){let i=this.component&&this.component.props[tR.fW];this.asyncProps[t]={type:i&&i[t],lastValue:null,resolvedValue:e,pendingLoadCount:0,resolvedLoadCount:0}}}}class t5 extends t6{constructor({attributeManager:t,layer:e}){super(e),this.attributeManager=t,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}_fetch(t,e){let i=this.layer,r=i?.props.fetch;return r?r(e,{propName:t,layer:i}):super._fetch(t,e)}_onResolve(t,e){let i=this.layer;if(i){let r=i.props.onDataLoad;"data"===t&&r&&r(e,{propName:t,layer:i})}}_onError(t,e){let i=this.layer;i&&i.raiseError(e,`loading ${t} of ${this.layer}`)}}var t8=i(58682);let t7=Object.freeze([]),t9=(0,te.A)(({oldViewport:t,viewport:e})=>t.equals(e)),et=new Uint8ClampedArray(0);function ee(t){return t.rowIndexes||t.pickingColors||t.instancePickingColors}function ei(t){return t.rowIndexes}function er(t){return t.pickingColors||t.instancePickingColors}let en={data:{type:"data",value:t7,async:!0},dataComparator:{type:"function",value:null,optional:!0},_dataDiff:{type:"function",value:t=>t&&t.__diff,optional:!0},dataTransform:{type:"function",value:null,optional:!0},onDataLoad:{type:"function",value:null,optional:!0},onError:{type:"function",value:null,optional:!0},fetch:{type:"function",value:(t,{propName:e,layer:i,loaders:r,loadOptions:n,signal:s})=>{let{resourceManager:a}=i.context;n=n||i.getLoadOptions(),r=r||i.props.loaders,s&&(n={...n,core:{...n?.core,fetch:{...n?.core?.fetch,signal:s}}});let o=a.contains(t);return(o||n||(a.add({resourceId:t,data:(0,t8.H)(t,r),persistent:!1}),o=!0),o)?a.subscribe({resourceId:t,onChange:t=>i.internalState?.reloadAsyncProp(e,t),consumerId:i.id,requestId:e}):(0,t8.H)(t,r,n)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:"number",min:0,max:1,value:1},operation:"draw",onHover:{type:"function",value:null,optional:!0},onClick:{type:"function",value:null,optional:!0},onDragStart:{type:"function",value:null,optional:!0},onDrag:{type:"function",value:null,optional:!0},onDragEnd:{type:"function",value:null,optional:!0},coordinateSystem:"default",coordinateOrigin:{type:"array",value:[0,0,0],compare:!0},modelMatrix:{type:"array",value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:"XYZ",colorFormat:"RGBA",parameters:{type:"object",value:{},optional:!0,compare:2},loadOptions:{type:"object",value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:"array",value:[],optional:!0,ignore:!0},getPolygonOffset:{type:"function",value:({layerIndex:t})=>[0,-(100*t)]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:"accessor",value:[0,0,128,128]}};class es extends t3{constructor(){super(...arguments),this.internalState=null,this.lifecycle=tR.VD.NO_STATE,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,"layerName")?this.layerName:""}get root(){let t=this;for(;t.parent;)t=t.parent;return t}toString(){let t=this.constructor.layerName||this.constructor.name;return`${t}({id: '${this.props.id}'})`}project(t){(0,m.A)(this.internalState);let e=this.internalState.viewport||this.context.viewport,i=tY(t,{viewport:e,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem}),[r,n,s]=(0,tD.VJ)(i,e.pixelProjectionMatrix);return 2===t.length?[r,n]:[r,n,s]}unproject(t){return(0,m.A)(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(t)}projectPosition(t,e){return(0,m.A)(this.internalState),function(t,e){let{viewport:i,coordinateSystem:r,coordinateOrigin:n,modelMatrix:s,fromCoordinateSystem:a,fromCoordinateOrigin:o}=function(t){let{viewport:e,modelMatrix:i,coordinateOrigin:r}=t,{coordinateSystem:n,fromCoordinateSystem:s,fromCoordinateOrigin:a}=t;return"default"===n&&(n=e.isGeospatial?"lnglat":"cartesian"),void 0===s?s=n:"default"===s&&(s=e.isGeospatial?"lnglat":"cartesian"),void 0===a&&(a=r),{viewport:e,coordinateSystem:n,coordinateOrigin:r,modelMatrix:i,fromCoordinateSystem:s,fromCoordinateOrigin:a}}(e),{autoOffset:l=!0}=e,{geospatialOrigin:u=tV,shaderCoordinateOrigin:c=tV,offsetMode:h=!1}=l?(0,tU.ow)(i,r,n):{},f=tY(t,{viewport:i,modelMatrix:s,coordinateSystem:a,coordinateOrigin:o,offsetMode:h});if(h){let t=i.projectPosition(u||c);tS.vec3.sub(f,f,t)}return f}(t,{viewport:this.internalState.viewport||this.context.viewport,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem,...e})}get isComposite(){return!1}get isDrawable(){return!0}setState(t){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,t),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return!!this.internalState&&!this.internalState.isAsyncPropLoading()}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let t=this.state;return t&&(t.models||t.model&&[t.model])||[]}setShaderModuleProps(...t){for(let e of this.getModels())e.shaderInputs.setProps(...t)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}use64bitPositions(){let{coordinateSystem:t}=this.props;return"default"===t||"lnglat"===t||"cartesian"===t}onHover(t,e){return!!this.props.onHover&&(this.props.onHover(t,e)||!1)}onClick(t,e){return!!this.props.onClick&&(this.props.onClick(t,e)||!1)}nullPickingColor(){return[0,0,0]}encodePickingColor(t,e=[]){return e[0]=t+1&255,e[1]=t+1>>8&255,e[2]=t+1>>8>>8&255,e}decodePickingColor(t){(0,m.A)(t instanceof Uint8Array);let[e,i,r]=t;return e+256*i+65536*r-1}getNumInstances(){if(Number.isFinite(this.props.numInstances))return this.props.numInstances;if(this.state&&void 0!==this.state.numInstances)return this.state.numInstances;var t,e,i=this.props.data;if(null===(t=i)||"object"!=typeof t)throw Error("count(): argument not an object");if("function"==typeof i.count)return i.count();if(Number.isFinite(i.size))return i.size;if(Number.isFinite(i.length))return i.length;if(null!==(e=i)&&"object"==typeof e&&e.constructor===Object)return Object.keys(i).length;throw Error("count(): argument not a container")}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds(["positions","instancePositions"])}getShaders(t){for(let e of(t=tj(t,{disableWarnings:!0,modules:this.context.defaultShaderModules}),this.props.extensions))t=tj(t,e.getShaders.call(this,e));return t}shouldUpdateState(t){return t.changeFlags.propsOrDataChanged}updateState(t){let e=this.getAttributeManager(),{dataChanged:i}=t.changeFlags;if(i&&e)if(Array.isArray(i))for(let t of i)e.invalidateAll(t);else e.invalidateAll();if(e){let{props:i}=t,r=this.internalState.hasPickingBuffer,n=Number.isInteger(i.highlightedObjectIndex)||!!i.pickable||i.extensions.some(t=>t.getNeedsPickingBuffer.call(this,t));if(r!==n){this.internalState.hasPickingBuffer=n;let t=ee(e.attributes);t&&(n&&t.constant&&(t.constant=!1,e.invalidate(t.id)),t.value||n||(t.constant=!0,t.value=ei(e.attributes)?[tq.Z1]:[0,0,0]))}}}finalizeState(t){for(let t of this.getModels())t.destroy();let e=this.getAttributeManager();e&&e.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(t){for(let e of this.getModels())e.draw(t.renderPass)}getPickingInfo({info:t,mode:e,sourceLayer:i}){let{index:r}=t;return r>=0&&Array.isArray(this.props.data)&&(t.object=this.props.data[r]),t}raiseError(t,e){e&&(t=Error(`${e}: ${t.message}`,{cause:t})),this.props.onError?.(t)||this.context?.onError?.(t,this)}getNeedsRedraw(t={clearRedrawFlags:!1}){return this._getNeedsRedraw(t)}needsUpdate(){return!!this.internalState&&(this.internalState.needsUpdate||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()))}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(t){if(!this.internalState)return;let e=this.internalState.viewport;this.internalState.viewport=t,e&&t9({oldViewport:e,viewport:t})||(this.setChangeFlags({viewportChanged:!0}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(t="all"){let e=this.getAttributeManager();e&&("all"===t?e.invalidateAll():e.invalidate(t))}updateAttributes(t){let e=!1;for(let i in t)t[i].layoutChanged()&&(e=!0);for(let i of this.getModels())this._setModelAttributes(i,t,e)}_updateAttributes(){let t=this.getAttributeManager();if(!t)return;let e=this.props,i=this.getNumInstances(),r=this.getStartIndices();t.update({data:e.data,numInstances:i,startIndices:r,props:e,transitions:e.transitions,buffers:e.data.attributes,context:this});let n=t.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(n)}_updateAttributeTransition(){let t=this.getAttributeManager();t&&t.updateTransition()}_updateUniformTransition(){let{uniformTransitions:t}=this.internalState;if(t.active){let e=t.update(),i=Object.create(this.props);for(let t in e)Object.defineProperty(i,t,{value:e[t]});return i}return this.props}calculateInstancePickingColors(t,{numInstances:e}){if(t.constant)return;let i=Math.floor(et.length/4);this.internalState.usesPickingColorCache=!0;let r=e>0&&0===et[0];if(i<e||r){e>0xffffff&&d.A.warn("Layer has too many data objects. Picking might not be able to distinguish all objects.")();let t=Math.floor((et=h.A.allocate(et,e,{size:4,copy:!0,maxCount:Math.max(e,0xffffff)})).length/4),n=[0,0,0],s=r?0:i;for(let e=s;e<t;e++)this.encodePickingColor(e,n),et[4*e+0]=n[0],et[4*e+1]=n[1],et[4*e+2]=n[2],et[4*e+3]=0}t.value=et.subarray(0,4*e)}_setModelAttributes(t,e,i=!1){if(!Object.keys(e).length)return;let r=this.getAttributeManager();if(r?.hasBufferGroups())return void this._setGroupedModelAttributes(t,r,e);if(i){let i=this.getAttributeManager();t.setBufferLayout(i.getBufferLayouts(t)),e=i.getAttributes()}let s=t.userData?.excludeAttributes||{},a={},o={};for(let i in e){if(s[i])continue;let r=e[i].getValue();for(let s in r){let l=r[s];l instanceof n.h?e[i].settings.isIndexed?t.setIndexBuffer(l):a[s]=l:l&&(o[s]=l)}}t.setAttributes(a),t.setConstantAttributes(o)}_setGroupedModelAttributes(t,e,i){let r=t.userData?.excludeAttributes||{},s=e.getBufferGroupBindings(i,t,r);t.setBufferLayout(s.bufferLayouts);let a={...s.buffers},o={},l=e.getAttributes();for(let e in l){if(r[e]||s.groupedAttributeIds.has(e))continue;let i=l[e],u=i.getValue();for(let e in u){let r=u[e];r instanceof n.h?i.settings.isIndexed?t.setIndexBuffer(r):a[e]=r:r&&(o[e]=r)}}t.setAttributes(a),t.setConstantAttributes(o)}disablePickingIndex(t){let e=this.props.data;if(!("attributes"in e))return void this._disablePickingIndex(t);let i=this.getAttributeManager().attributes,r=ei(i),n=er(i),s=r&&e.attributes&&e.attributes[r.id];if(s&&s.value){let i=s.value;for(let n=0;n<e.length;n++)i[r.getVertexOffset(n)]===t&&this._disablePickingIndex(n);return}let a=n&&e.attributes&&e.attributes[n.id];if(a&&a.value){let i=a.value,r=this.encodePickingColor(t);for(let t=0;t<e.length;t++){let e=n.getVertexOffset(t);i[e]===r[0]&&i[e+1]===r[1]&&i[e+2]===r[2]&&this._disablePickingIndex(t)}}else this._disablePickingIndex(t)}_disablePickingIndex(t){let e=this.getAttributeManager().attributes,i=ei(e);if(i){let e=i.getVertexOffset(t),r=new Uint32Array(i.getVertexOffset(t+1)-e);r.fill(tq.Z1),i.buffer.write(r,e*r.BYTES_PER_ELEMENT);return}let r=er(e);if(!r){this.internalState&&(0,tq.uz)(this.internalState.disabledPickingIndices,t);return}let n=r.getVertexOffset(t),s=r.getVertexOffset(t+1);r.buffer.write(new Uint8Array(s-n),n)}restorePickingColors(){let t=this.getAttributeManager().attributes,e=ee(t);if(!e){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let i=er(t);this.internalState.usesPickingColorCache&&i&&i.value.buffer!==et.buffer&&(i.value=et.subarray(0,i.value.length)),e.updateSubBuffer({startOffset:0})}_initialize(){(0,m.A)(!this.internalState),(0,ti.A)("layer.initialize",this);let t=this._getAttributeManager();for(let e of(this.internalState=new t5({attributeManager:t,layer:this}),this._clearChangeFlags(),this.state={},Object.defineProperty(this.state,"attributeManager",{get:()=>(d.A.deprecated("layer.state.attributeManager","layer.getAttributeManager()")(),t)}),this.internalState.uniformTransitions=new tC(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context),this.props.extensions))e.initializeState.call(this,this.context,e);this.setChangeFlags({dataChanged:"init",propsChanged:"init",viewportChanged:!0,extensionsChanged:!0}),this._update()}_transferState(t){(0,ti.A)("layer.matched",this,this===t);let{state:e,internalState:i}=t;this!==t&&(this.internalState=i,this.state=e,this.internalState.setAsyncProps(this.props),this._diffProps(this.props,this.internalState.getOldProps()))}_update(){let t=this.needsUpdate();if((0,ti.A)("layer.update",this,t),!t)return;this.context.stats.get("Layer updates").incrementCount();let e=this.props,i=this.context,r=this.internalState,n=i.viewport,s=this._updateUniformTransition();r.propsInTransition=s,i.viewport=r.viewport||n,this.props=s;try{let t=this._getUpdateParams(),e=this.getModels();if(i.device)this.updateState(t);else try{this.updateState(t)}catch(t){}for(let e of this.props.extensions)e.updateState.call(this,t,e);this.setNeedsRedraw(),this._updateAttributes();let r=this.getModels()[0]!==e[0];this._postUpdate(t,r)}finally{i.viewport=n,this.props=e,this._clearChangeFlags(),r.needsUpdate=!1,r.resetOldProps()}}_finalize(){for(let t of((0,ti.A)("layer.finalize",this),this.finalizeState(this.context),this.props.extensions))t.finalizeState.call(this,this.context,t)}_drawLayer({renderPass:t,shaderModuleProps:e=null,uniforms:i={},parameters:r={}}){this._updateAttributeTransition();let n=this.props,a=this.context;this.props=this.internalState.propsInTransition||n;try{e&&this.setShaderModuleProps(e);let{getPolygonOffset:n}=this.props,o=n&&n(i)||[0,0];a.device instanceof s.WebGLDevice&&a.device.setParametersWebGL({polygonOffset:o});let l=a.device instanceof s.WebGLDevice?null:function(t){let{blendConstant:e,...i}=t;return e?{pipelineParameters:i,renderPassParameters:{blendConstant:e}}:{pipelineParameters:i}}(r);if(function(t,e,i,r){for(let n of t)"webgpu"===n.device.type?(function(t,e){let i=e.props.framebuffer||(e.framebuffer??null);if(!i)return;let r=i.colorAttachments.map(t=>t?.texture?.format??null),n=i.depthStencilAttachment?.texture?.format;(!function(t,e){if(t===e)return!0;if(!t||!e||t.length!==e.length)return!1;for(let i=0;i<t.length;i++)if(t[i]!==e[i])return!1;return!0}(t.props.colorAttachmentFormats,r)||t.props.depthStencilAttachmentFormat!==n)&&(t.props.colorAttachmentFormats=r,t.props.depthStencilAttachmentFormat=n,t._setPipelineNeedsUpdate("attachment formats"))}(n,e),n.setParameters({...n.parameters,...r?.pipelineParameters})):n.setParameters(i)}(this.getModels(),t,r,l),a.device instanceof s.WebGLDevice)a.device.withParametersWebGL(r,()=>{let n={renderPass:t,shaderModuleProps:e,uniforms:i,parameters:r,context:a};for(let t of this.props.extensions)t.draw.call(this,n,t);this.draw(n)});else{l?.renderPassParameters&&t.setParameters(l.renderPassParameters);let n={renderPass:t,shaderModuleProps:e,uniforms:i,parameters:r,context:a};for(let t of this.props.extensions)t.draw.call(this,n,t);this.draw(n)}}finally{this.props=n}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(t){if(!this.internalState)return;let{changeFlags:e}=this.internalState;for(let i in t)if(t[i]){let r=!1;if("dataChanged"===i){let n=t[i],s=e[i];n&&Array.isArray(s)&&(e.dataChanged=Array.isArray(n)?s.concat(n):n,r=!0)}e[i]||(e[i]=t[i],r=!0),r&&(0,ti.A)("layer.changeFlag",this,i,t)}let i=!!(e.dataChanged||e.updateTriggersChanged||e.propsChanged||e.extensionsChanged);e.propsOrDataChanged=i,e.somethingChanged=i||e.viewportChanged||e.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(t,e){let i,r,n,s=(i=tN({newProps:t,oldProps:e,propTypes:t[tR.fW],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),r=function(t,e){if(null===e)return"oldProps is null, initial diff";let i=!1,{dataComparator:r,_dataDiff:n}=t;return r?r(t.data,e.data)||(i="Data comparator detected a change"):t.data!==e.data&&(i="A new data container was supplied"),i&&n&&(i=n(t.data,e.data)||i),i}(t,e),n=!1,r||(n=function(t,e){if(null===e||"all"in t.updateTriggers&&tz(t,e,"all"))return{all:!0};let i={},r=!1;for(let n in t.updateTriggers)"all"!==n&&tz(t,e,n)&&(i[n]=!0,r=!0);return!!r&&i}(t,e)),{dataChanged:r,propsChanged:i,updateTriggersChanged:n,extensionsChanged:function(t,e){if(null===e)return!0;let i=e.extensions,{extensions:r}=t;if(r===i)return!1;if(!i||!r||r.length!==i.length)return!0;for(let t=0;t<r.length;t++)if(!r[t].equals(i[t]))return!0;return!1}(t,e),transitionsChanged:function(t,e){if(!t.transitions)return!1;let i={},r=t[tR.fW],n=!1;for(let s in t.transitions){let a=r[s],o=a&&a.type;("number"===o||"color"===o||"array"===o)&&tk(t[s],e[s],a)&&(i[s]=!0,n=!0)}return!!n&&i}(t,e)});if(s.updateTriggersChanged)for(let t in s.updateTriggersChanged)s.updateTriggersChanged[t]&&this.invalidateAttribute(t);if(s.transitionsChanged)for(let i in s.transitionsChanged)this.internalState.uniformTransitions.add(i,e[i],t[i],t.transitions?.[i]);return this.setChangeFlags(s)}validateProps(){!function(t){let e=t[tR.fW];for(let i in e){let r=e[i],{validate:n}=r;if(n&&!n(t[i],r))throw Error(`Invalid prop ${i}: ${t[i]}`)}}(this.props)}updateAutoHighlight(t){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(t)}_updateAutoHighlight(t){let e={highlightedObjectColor:t.picked?t.color:null},{highlightColor:i}=this.props;t.picked&&"function"==typeof i&&(e.highlightColor=i(t)),this.setShaderModuleProps({picking:e}),this.setNeedsRedraw()}_getAttributeManager(){let t=this.context;return new tA(t.device,{id:this.props.id,stats:t.stats,timeline:t.timeline})}_postUpdate(t,e){let{props:i,oldProps:r}=t,n=this.state.model;n?.isInstanced&&n.setInstanceCount(this.getNumInstances());let{autoHighlight:s,highlightedObjectIndex:a,highlightColor:o}=i;if(e||r.autoHighlight!==s||r.highlightedObjectIndex!==a||r.highlightColor!==o){let t={};Array.isArray(o)&&(t.highlightColor=o),(e||r.autoHighlight!==s||a!==r.highlightedObjectIndex)&&(t.highlightedObjectColor=Number.isFinite(a)&&a>=0?this.encodePickingColor(a):null),this.setShaderModuleProps({picking:t})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(t){if(!this.internalState)return!1;let e=!1;e=this.internalState.needsRedraw&&this.id;let i=this.getAttributeManager(),r=!!i&&i.getNeedsRedraw(t);if(e=e||r)for(let t of this.props.extensions)t.onNeedsRedraw.call(this,t);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!t.clearRedrawFlags,e}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}}es.defaultProps=en,es.layerName="Layer";let ea=es},12897(t,e,i){"use strict";i.d(e,{VD:()=>r,YN:()=>l,fW:()=>s,jA:()=>o,r3:()=>n,uH:()=>a,vf:()=>u});let r={NO_STATE:"Awaiting state",MATCHED:"Matched. State transferred from previous layer",INITIALIZED:"Initialized",AWAITING_GC:"Discarded. Awaiting garbage collection",AWAITING_FINALIZATION:"No longer matched. Awaiting garbage collection",FINALIZED:"Finalized! Awaiting garbage collection"},n=Symbol.for("component"),s=Symbol.for("propTypes"),a=Symbol.for("deprecatedProps"),o=Symbol.for("asyncPropDefaults"),l=Symbol.for("asyncPropOriginal"),u=Symbol.for("asyncPropResolved")},46487(t,e,i){"use strict";i.d(e,{A:()=>r});let r={name:"color",dependencies:[],source:`

@must_use
fn deckgl_premultiplied_alpha(fragColor: vec4<f32>) -> vec4<f32> {
    return vec4(fragColor.rgb * fragColor.a, fragColor.a); 
};
`,getUniforms:t=>({})}},3065(t,e,i){"use strict";i.d(e,{A:()=>n});let r="#define SMOOTH_EDGE_RADIUS 0.5",n={name:"geometry",source:`\
const SMOOTH_EDGE_RADIUS: f32 = 0.5;

struct VertexGeometry {
  position: vec4<f32>,
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry_: VertexGeometry = VertexGeometry(
  vec4<f32>(0.0, 0.0, 1.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec2<f32>(0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0)
);

struct FragmentGeometry {
  uv: vec2<f32>,
};

var<private> fragmentGeometry: FragmentGeometry;

fn smoothedge(edge: f32, x: f32) -> f32 {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`,vs:`\
${r}

struct VertexGeometry {
  vec4 position;
  vec3 worldPosition;
  vec3 worldPositionAlt;
  vec3 normal;
  vec2 uv;
  vec3 pickingColor;
} geometry = VertexGeometry(
  vec4(0.0, 0.0, 1.0, 0.0),
  vec3(0.0),
  vec3(0.0),
  vec3(0.0),
  vec2(0.0),
  vec3(0.0)
);
`,fs:`\
${r}

struct FragmentGeometry {
  vec2 uv;
};
FragmentGeometry geometry;

float smoothedge(float edge, float x) {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`}},95335(t,e,i){"use strict";i.d(e,{Z1:()=>a,Ay:()=>d,uz:()=>o});var r=i(55611);let n={props:{},uniforms:{},name:"picking",uniformTypes:{isActive:"f32",isAttribute:"f32",isHighlightActive:"f32",useByteColors:"f32",highlightedObjectColor:"vec3<f32>",highlightColor:"vec4<f32>"},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:[0,1,1,1]},vs:`\
layout(std140) uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useByteColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

out vec4 picking_vRGBcolor_Avalid;

// Normalize unsigned byte color to 0-1 range
vec3 picking_normalizeColor(vec3 color) {
  return picking.useByteColors > 0.5 ? color / 255.0 : color;
}

// Normalize unsigned byte color to 0-1 range
vec4 picking_normalizeColor(vec4 color) {
  return picking.useByteColors > 0.5 ? color / 255.0 : color;
}

bool picking_isColorZero(vec3 color) {
  return dot(color, vec3(1.0)) < 0.00001;
}

bool picking_isColorValid(vec3 color) {
  return dot(color, vec3(1.0)) > 0.00001;
}

// Check if this vertex is highlighted 
bool isVertexHighlighted(vec3 vertexColor) {
  vec3 highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
  return
    bool(picking.isHighlightActive) && picking_isColorZero(abs(vertexColor - highlightedObjectColor));
}

// Set the current picking color
void picking_setPickingColor(vec3 pickingColor) {
  pickingColor = picking_normalizeColor(pickingColor);

  if (bool(picking.isActive)) {
    // Use alpha as the validity flag. If pickingColor is [0, 0, 0] fragment is non-pickable
    picking_vRGBcolor_Avalid.a = float(picking_isColorValid(pickingColor));

    if (!bool(picking.isAttribute)) {
      // Stores the picking color so that the fragment shader can render it during picking
      picking_vRGBcolor_Avalid.rgb = pickingColor;
    }
  } else {
    // Do the comparison with selected item color in vertex shader as it should mean fewer compares
    picking_vRGBcolor_Avalid.a = float(isVertexHighlighted(pickingColor));
  }
}

void picking_setPickingAttribute(float value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.r = value;
  }
}

void picking_setPickingAttribute(vec2 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rg = value;
  }
}

void picking_setPickingAttribute(vec3 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rgb = value;
  }
}
`,fs:`\
layout(std140) uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useByteColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

in vec4 picking_vRGBcolor_Avalid;

/*
 * Returns highlight color if this item is selected.
 */
vec4 picking_filterHighlightColor(vec4 color) {
  // If we are still picking, we don't highlight
  if (picking.isActive > 0.5) {
    return color;
  }

  bool selected = bool(picking_vRGBcolor_Avalid.a);

  if (selected) {
    // Blend in highlight color based on its alpha value
    float highLightAlpha = picking.highlightColor.a;
    float blendedAlpha = highLightAlpha + color.a * (1.0 - highLightAlpha);
    float highLightRatio = highLightAlpha / blendedAlpha;

    vec3 blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);
    return vec4(blendedRGB, blendedAlpha);
  } else {
    return color;
  }
}

/*
 * Returns picking color if picking enabled else unmodified argument.
 */
vec4 picking_filterPickingColor(vec4 color) {
  if (bool(picking.isActive)) {
    if (picking_vRGBcolor_Avalid.a == 0.0) {
      discard;
    }
    return picking_vRGBcolor_Avalid;
  }
  return color;
}

/*
 * Returns picking color if picking is enabled if not
 * highlight color if this item is selected, otherwise unmodified argument.
 */
vec4 picking_filterColor(vec4 color) {
  vec4 highlightColor = picking_filterHighlightColor(color);
  return picking_filterPickingColor(highlightColor);
}
`,getUniforms:function(t={},e){let i={},n=(0,r.eS)(t.useByteColors,!0);return void 0===t.highlightedObjectColor||(null===t.highlightedObjectColor?i.isHighlightActive=!1:(i.isHighlightActive=!0,i.highlightedObjectColor=t.highlightedObjectColor.slice(0,3))),t.highlightColor&&(i.highlightColor=(0,r.jI)(t.highlightColor,n)),void 0!==t.isActive&&(i.isActive=!!t.isActive,i.isAttribute=!!t.isAttribute),void 0!==t.useByteColors&&(i.useByteColors=!!t.useByteColors),i}};var s=i(3459);let a=0xffffff;function o(t,e){10===t.length?s.A.warn("pickMultipleObjects can only exclude 10 previously picked objects for layers without picking buffers")():t.push(e)}let l=`\
  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function u(t){return t.replace("  vec4 highlightColor;\n} picking;",`  vec4 highlightColor;
${l}} picking;`)}function c(t,e){return[t[e]||0,t[e+1]||0,t[e+2]||0,t[e+3]||0]}let h=`\
vec3 picking_getPickingColorFromIndex(float objectIndex) {
  if (objectIndex < 0.0 || objectIndex >= ${a}.0) {
    return vec3(0.0);
  }

  for (int i = 0; i < 10; i++) {
    if (float(i) >= picking.disabledPickingIndexCount) {
      break;
    }
    vec4 disabledIndices = i < 4
      ? picking.disabledPickingIndices0
      : (i < 8 ? picking.disabledPickingIndices1 : picking.disabledPickingIndices2);
    float disabledIndex = disabledIndices[i - (i / 4) * 4];
    if (disabledIndex == objectIndex) {
      return vec3(0.0);
    }
  }

  float encodedIndex = objectIndex + 1.0;
  return vec3(
    mod(encodedIndex, 256.0),
    mod(floor(encodedIndex / 256.0), 256.0),
    mod(floor(encodedIndex / 65536.0), 256.0)
  );
}

vec3 picking_getPickingColorFromIndex(uint objectIndex) {
  return picking_getPickingColorFromIndex(float(objectIndex));
}

vec3 picking_getPickingColorFromInstanceID() {
  return picking_getPickingColorFromIndex(float(gl_InstanceID));
}

void picking_setPickingColorFromInstanceID() {
  picking_setPickingColor(picking_getPickingColorFromInstanceID());
}
`,f=`\
struct pickingUniforms {
  isActive: f32,
  isAttribute: f32,
  isHighlightActive: f32,
  useByteColors: f32,
  highlightedObjectColor: vec3<f32>,
  highlightColor: vec4<f32>,
  disabledPickingIndexCount: f32,
  disabledPickingIndices0: vec4<f32>,
  disabledPickingIndices1: vec4<f32>,
  disabledPickingIndices2: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> picking: pickingUniforms;

fn picking_normalizeColor(color: vec3<f32>) -> vec3<f32> {
  return select(color, color / 255.0, picking.useByteColors > 0.5);
}

fn picking_normalizeColor4(color: vec4<f32>) -> vec4<f32> {
  return select(color, color / 255.0, picking.useByteColors > 0.5);
}

fn picking_isColorZero(color: vec3<f32>) -> bool {
  return dot(color, vec3<f32>(1.0)) < 0.00001;
}

fn picking_isColorValid(color: vec3<f32>) -> bool {
  return dot(color, vec3<f32>(1.0)) > 0.00001;
}

fn picking_getPickingColorFromIndex(objectIndex: u32) -> vec3<f32> {
  if (objectIndex >= ${a}u) {
    return vec3<f32>(0.0);
  }

  for (var i = 0; i < 10; i = i + 1) {
    if (f32(i) >= picking.disabledPickingIndexCount) {
      break;
    }
    let disabledIndices = select(
      picking.disabledPickingIndices2,
      select(picking.disabledPickingIndices1, picking.disabledPickingIndices0, i < 4),
      i < 8
    );
    let disabledIndex = disabledIndices[i % 4];
    if (disabledIndex == f32(objectIndex)) {
      return vec3<f32>(0.0);
    }
  }

  let encodedIndex = objectIndex + 1u;
  return vec3<f32>(
    f32(encodedIndex % 256u),
    f32((encodedIndex / 256u) % 256u),
    f32((encodedIndex / 65536u) % 256u)
  ) / 255.0;
}
`,d={...n,vs:`${u(n.vs)}
${h}`,fs:u(n.fs),source:f,uniformTypes:{...n.uniformTypes,disabledPickingIndexCount:"f32",disabledPickingIndices0:"vec4<f32>",disabledPickingIndices1:"vec4<f32>",disabledPickingIndices2:"vec4<f32>"},defaultUniforms:{...n.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(t,e){let i=n.getUniforms(t,e),r=t.disabledPickingIndices||[];return i.disabledPickingIndexCount=r.length,i.disabledPickingIndices0=c(r,0),i.disabledPickingIndices1=c(r,4),i.disabledPickingIndices2=c(r,8),i},inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `,"vs:DECKGL_FILTER_COLOR":`
  picking_setPickingColor(geometry.pickingColor);
  `,"fs:DECKGL_FILTER_COLOR":{order:99,injection:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}}}},52948(t,e,i){"use strict";i.d(e,{A:()=>_});var r=i(34938),n=i(3065),s=i(74334),a=i(9350);let o=["default","lnglat","meter-offsets","lnglat-offsets","cartesian"].map(t=>`const COORDINATE_SYSTEM_${t.toUpperCase().replaceAll("-","_")}: i32 = ${(0,s.LB)(t)};`).join(""),l=Object.keys(a.Kx).map(t=>`const PROJECTION_MODE_${t}: i32 = ${a.Kx[t]};`).join(""),u=Object.keys(a.p5).map(t=>`const UNIT_${t.toUpperCase()}: i32 = ${a.p5[t]};`).join(""),c=`\
${o}
${l}
${u}

const TILE_SIZE: f32 = 512.0;
const PI: f32 = 3.1415926536;
const WORLD_SCALE: f32 = TILE_SIZE / (PI * 2.0);
const ZERO_64_LOW: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
const EARTH_RADIUS: f32 = 6370972.0; // meters
const GLOBE_RADIUS: f32 = 256.0;

// -----------------------------------------------------------------------------
// Uniform block (converted from GLSL uniform block)
// -----------------------------------------------------------------------------
struct ProjectUniforms {
  wrapLongitude: i32,
  coordinateSystem: i32,
  commonUnitsPerMeter: vec3<f32>,
  projectionMode: i32,
  scale: f32,
  commonUnitsPerWorldUnit: vec3<f32>,
  commonUnitsPerWorldUnit2: vec3<f32>,
  center: vec4<f32>,
  modelMatrix: mat4x4<f32>,
  viewProjectionMatrix: mat4x4<f32>,
  viewportSize: vec2<f32>,
  devicePixelRatio: f32,
  focalDistance: f32,
  cameraPosition: vec3<f32>,
  coordinateOrigin: vec3<f32>,
  commonOrigin: vec3<f32>,
  pseudoMeters: i32,
};

@group(0) @binding(auto)
var<uniform> project: ProjectUniforms;

// -----------------------------------------------------------------------------
// Geometry data shared across the project helpers.
// The active layer shader is responsible for populating this private module
// state before calling the project functions below.
// -----------------------------------------------------------------------------

// Structure to carry additional geometry data used by deck.gl filters.
struct Geometry {
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  position: vec4<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry: Geometry;
`,h=`\
${c}

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

// Returns an adjustment factor for commonUnitsPerMeter
fn _project_size_at_latitude(lat: f32) -> f32 {
  let y = clamp(lat, -89.9, 89.9);
  return 1.0 / cos(radians(y));
}

// Overloaded version: scales a value in meters at a given latitude.
fn _project_size_at_latitude_m(meters: f32, lat: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * _project_size_at_latitude(lat);
}

// Computes a non-linear scale factor based on geometry.
// (Note: This function relies on "geometry" being provided.)
fn project_size() -> f32 {
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
      project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
      project.pseudoMeters == 0) {
    if (geometry.position.w == 0.0) {
      return _project_size_at_latitude(geometry.worldPosition.y);
    }
    let y: f32 = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
    let y2 = y * y;
    let y4 = y2 * y2;
    let y6 = y4 * y2;
    return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
  }
  return 1.0;
}

// Overloads to scale offsets (meters to world units)
fn project_size_float(meters: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * project_size();
}

fn project_size_vec2(meters: vec2<f32>) -> vec2<f32> {
  return meters * project.commonUnitsPerMeter.xy * project_size();
}

fn project_size_vec3(meters: vec3<f32>) -> vec3<f32> {
  return meters * project.commonUnitsPerMeter * project_size();
}

fn project_size_vec4(meters: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(meters.xyz * project.commonUnitsPerMeter, meters.w);
}

// Returns a rotation matrix aligning the z\u{2011}axis with the given up vector.
fn project_get_orientation_matrix(up: vec3<f32>) -> mat3x3<f32> {
  let uz = normalize(up);
  let ux = select(
    vec3<f32>(1.0, 0.0, 0.0),
    normalize(vec3<f32>(uz.y, -uz.x, 0.0)),
    abs(uz.z) == 1.0
  );
  let uy = cross(uz, ux);
  return mat3x3<f32>(ux, uy, uz);
}

// Since WGSL does not support "out" parameters, we return a struct.
struct RotationResult {
  needsRotation: bool,
  transform: mat3x3<f32>,
};

fn project_needs_rotation(commonPosition: vec3<f32>) -> RotationResult {
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    return RotationResult(true, project_get_orientation_matrix(commonPosition));
  } else {
    return RotationResult(false, mat3x3<f32>());  // identity alternative if needed
  };
}

// Projects a normal vector from the current coordinate system to world space.
fn project_normal(vector: vec3<f32>) -> vec3<f32> {
  let normal_modelspace = project.modelMatrix * vec4<f32>(vector, 0.0);
  var n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
  let rotResult = project_needs_rotation(geometry.position.xyz);
  if (rotResult.needsRotation) {
    n = rotResult.transform * n;
  }
  return n;
}

// Applies a scale offset based on y-offset (dy)
fn project_offset_(offset: vec4<f32>) -> vec4<f32> {
  let dy: f32 = offset.y;
  let commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
  return vec4<f32>(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}

// Projects lng/lat coordinates to a unit tile [0,1]
fn project_mercator_(lnglat: vec2<f32>) -> vec2<f32> {
  var x = lnglat.x;
  if (project.wrapLongitude != 0) {
    x = ((x + 180.0) % 360.0) - 180.0;
  }
  let y = clamp(lnglat.y, -89.9, 89.9);
  return vec2<f32>(
    radians(x) + PI,
    PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// Projects lng/lat/z coordinates for a globe projection.
fn project_globe_(lnglatz: vec3<f32>) -> vec3<f32> {
  let lambda = radians(lnglatz.x);
  let phi = radians(lnglatz.y);
  let cosPhi = cos(phi);
  let D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
  return vec3<f32>(
    sin(lambda) * cosPhi,
    -cos(lambda) * cosPhi,
    sin(phi)
  ) * D;
}

// Projects positions (with an optional 64-bit low part) from the input
// coordinate system to the common space.
fn project_position_vec4_f64(position: vec4<f32>, position64Low: vec3<f32>) -> vec4<f32> {
  var position_world = project.modelMatrix * position;

  // Work around for a Mac+NVIDIA bug:
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_mercator_(position_world.xy),
        _project_size_at_latitude_m(position_world.z, position_world.y),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
      position_world = vec4f(position_world.xyz + project.coordinateOrigin, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_globe_(position_world.xyz),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
      let enuMatrix = project_get_orientation_matrix(project.commonOrigin);
      let metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
      let offsetCommon = (enuMatrix * vec3<f32>(-position_world.x, -position_world.y, position_world.z)) * metersToCommon;
      return vec4<f32>(project.commonOrigin + offsetCommon, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
        return vec4<f32>(
          project_mercator_(position_world.xy) - project.commonOrigin.xy,
          project_size_float(position_world.z),
          position_world.w
        );
      }
    }
  }
  if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
      (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
       (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
        project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
    position_world = vec4f(position_world.xyz - project.coordinateOrigin, position_world.w);
  }

  return project_offset_(position_world) +
         project_offset_(project.modelMatrix * vec4<f32>(position64Low, 0.0));
}

// Overloaded versions for different input types.
fn project_position_vec4_f32(position: vec4<f32>) -> vec4<f32> {
  return project_position_vec4_f64(position, ZERO_64_LOW);
}

fn project_position_vec3_f64(position: vec3<f32>, position64Low: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), position64Low);
  return projected_position.xyz;
}

fn project_position_vec3_f32(position: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), ZERO_64_LOW);
  return projected_position.xyz;
}

fn project_position_vec2_f32(position: vec2<f32>) -> vec2<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 0.0, 1.0), ZERO_64_LOW);
  return projected_position.xy;
}

// Transforms a common space position to clip space.
fn project_common_position_to_clipspace_with_projection(position: vec4<f32>, viewProjectionMatrix: mat4x4<f32>, center: vec4<f32>) -> vec4<f32> {
  var clipPosition = viewProjectionMatrix * position + center;
  // deck.gl projection matrices use WebGL's [-w, w] depth range; WebGPU clips z to [0, w].
  clipPosition.z = (clipPosition.z + clipPosition.w) * 0.5;
  return clipPosition;
}

// Uses the project viewProjectionMatrix and center.
fn project_common_position_to_clipspace(position: vec4<f32>) -> vec4<f32> {
  return project_common_position_to_clipspace_with_projection(position, project.viewProjectionMatrix, project.center);
}

// Returns a clip space offset corresponding to a given number of screen pixels.
fn project_pixel_size_to_clipspace(pixels: vec2<f32>) -> vec2<f32> {
  let offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
  return offset * project.focalDistance;
}

fn project_meter_size_to_pixel(meters: f32) -> f32 {
  return project_size_float(meters) * project.scale;
}

fn project_unit_size_to_pixel(size: f32, unit: i32) -> f32 {
  if (unit == UNIT_METERS) {
    return project_meter_size_to_pixel(size);
  } else if (unit == UNIT_COMMON) {
    return size * project.scale;
  }
  // UNIT_PIXELS: no scaling applied.
  return size;
}

fn project_pixel_size_float(pixels: f32) -> f32 {
  return pixels / project.scale;
}

fn project_pixel_size_vec2(pixels: vec2<f32>) -> vec2<f32> {
  return pixels / project.scale;
}
`,f=["default","lnglat","meter-offsets","lnglat-offsets","cartesian"].map(t=>`const int COORDINATE_SYSTEM_${t.toUpperCase().replaceAll("-","_")} = ${(0,s.LB)(t)};`).join(""),d=Object.keys(a.Kx).map(t=>`const int PROJECTION_MODE_${t} = ${a.Kx[t]};`).join(""),p=Object.keys(a.p5).map(t=>`const int UNIT_${t.toUpperCase()} = ${a.p5[t]};`).join(""),g=`\
${f}
${d}
${p}
layout(std140) uniform projectUniforms {
bool wrapLongitude;
int coordinateSystem;
vec3 commonUnitsPerMeter;
int projectionMode;
float scale;
vec3 commonUnitsPerWorldUnit;
vec3 commonUnitsPerWorldUnit2;
vec4 center;
mat4 modelMatrix;
mat4 viewProjectionMatrix;
vec2 viewportSize;
float devicePixelRatio;
float focalDistance;
vec3 cameraPosition;
vec3 coordinateOrigin;
vec3 commonOrigin;
bool pseudoMeters;
} project;
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / (PI * 2.0);
const vec3 ZERO_64_LOW = vec3(0.0);
const float EARTH_RADIUS = 6370972.0;
const float GLOBE_RADIUS = 256.0;
float project_size_at_latitude(float lat) {
float y = clamp(lat, -89.9, 89.9);
return 1.0 / cos(radians(y));
}
float project_size() {
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
project.pseudoMeters == false) {
if (geometry.position.w == 0.0) {
return project_size_at_latitude(geometry.worldPosition.y);
}
float y = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
float y2 = y * y;
float y4 = y2 * y2;
float y6 = y4 * y2;
return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
}
return 1.0;
}
float project_size_at_latitude(float meters, float lat) {
return meters * project.commonUnitsPerMeter.z * project_size_at_latitude(lat);
}
float project_size(float meters) {
return meters * project.commonUnitsPerMeter.z * project_size();
}
vec2 project_size(vec2 meters) {
return meters * project.commonUnitsPerMeter.xy * project_size();
}
vec3 project_size(vec3 meters) {
return meters * project.commonUnitsPerMeter * project_size();
}
vec4 project_size(vec4 meters) {
return vec4(meters.xyz * project.commonUnitsPerMeter, meters.w);
}
mat3 project_get_orientation_matrix(vec3 up) {
vec3 uz = normalize(up);
vec3 ux = abs(uz.z) == 1.0 ? vec3(1.0, 0.0, 0.0) : normalize(vec3(uz.y, -uz.x, 0));
vec3 uy = cross(uz, ux);
return mat3(ux, uy, uz);
}
bool project_needs_rotation(vec3 commonPosition, out mat3 transform) {
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
transform = project_get_orientation_matrix(commonPosition);
return true;
}
return false;
}
vec3 project_normal(vec3 vector) {
vec4 normal_modelspace = project.modelMatrix * vec4(vector, 0.0);
vec3 n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
mat3 rotation;
if (project_needs_rotation(geometry.position.xyz, rotation)) {
n = rotation * n;
}
return n;
}
vec4 project_offset_(vec4 offset) {
float dy = offset.y;
vec3 commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
return vec4(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}
vec2 project_mercator_(vec2 lnglat) {
float x = lnglat.x;
if (project.wrapLongitude) {
x = mod(x + 180., 360.0) - 180.;
}
float y = clamp(lnglat.y, -89.9, 89.9);
return vec2(
radians(x) + PI,
PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
) * WORLD_SCALE;
}
vec3 project_globe_(vec3 lnglatz) {
float lambda = radians(lnglatz.x);
float phi = radians(lnglatz.y);
float cosPhi = cos(phi);
float D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
return vec3(
sin(lambda) * cosPhi,
-cos(lambda) * cosPhi,
sin(phi)
) * D;
}
vec4 project_position(vec4 position, vec3 position64Low) {
vec4 position_world = project.modelMatrix * position;
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_mercator_(position_world.xy),
project_size_at_latitude(position_world.z, position_world.y),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
position_world.xyz += project.coordinateOrigin;
}
}
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_globe_(position_world.xyz),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
mat3 enuMatrix = project_get_orientation_matrix(project.commonOrigin);
float metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
vec3 offsetCommon = (enuMatrix * vec3(-position_world.xy, position_world.z)) * metersToCommon;
return vec4(project.commonOrigin + offsetCommon, position_world.w);
}
}
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
return vec4(
project_mercator_(position_world.xy) - project.commonOrigin.xy,
project_size(position_world.z),
position_world.w
);
}
}
}
if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
(project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
(project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
position_world.xyz -= project.coordinateOrigin;
}
return project_offset_(position_world) + project_offset_(project.modelMatrix * vec4(position64Low, 0.0));
}
vec4 project_position(vec4 position) {
return project_position(position, ZERO_64_LOW);
}
vec3 project_position(vec3 position, vec3 position64Low) {
vec4 projected_position = project_position(vec4(position, 1.0), position64Low);
return projected_position.xyz;
}
vec3 project_position(vec3 position) {
vec4 projected_position = project_position(vec4(position, 1.0), ZERO_64_LOW);
return projected_position.xyz;
}
vec2 project_position(vec2 position) {
vec4 projected_position = project_position(vec4(position, 0.0, 1.0), ZERO_64_LOW);
return projected_position.xy;
}
vec4 project_common_position_to_clipspace(vec4 position, mat4 viewProjectionMatrix, vec4 center) {
return viewProjectionMatrix * position + center;
}
vec4 project_common_position_to_clipspace(vec4 position) {
return project_common_position_to_clipspace(position, project.viewProjectionMatrix, project.center);
}
vec2 project_pixel_size_to_clipspace(vec2 pixels) {
vec2 offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
return offset * project.focalDistance;
}
float project_size_to_pixel(float meters) {
return project_size(meters) * project.scale;
}
vec2 project_size_to_pixel(vec2 meters) {
return project_size(meters) * project.scale;
}
float project_size_to_pixel(float size, int unit) {
if (unit == UNIT_METERS) return project_size_to_pixel(size);
if (unit == UNIT_COMMON) return size * project.scale;
return size;
}
float project_pixel_size(float pixels) {
return pixels / project.scale;
}
vec2 project_pixel_size(vec2 pixels) {
return pixels / project.scale;
}
`,m={},_={name:"project",dependencies:[r.i,n.A],source:h,vs:g,getUniforms:function(t=m){return"viewport"in t?(0,s.aY)(t):{}},uniformTypes:{wrapLongitude:"f32",coordinateSystem:"i32",commonUnitsPerMeter:"vec3<f32>",projectionMode:"i32",scale:"f32",commonUnitsPerWorldUnit:"vec3<f32>",commonUnitsPerWorldUnit2:"vec3<f32>",center:"vec4<f32>",modelMatrix:"mat4x4<f32>",viewProjectionMatrix:"mat4x4<f32>",viewportSize:"vec2<f32>",devicePixelRatio:"f32",focalDistance:"f32",cameraPosition:"vec3<f32>",coordinateOrigin:"vec3<f32>",commonOrigin:"vec3<f32>",pseudoMeters:"f32"}}},74334(t,e,i){"use strict";i.d(e,{LB:()=>f,aY:()=>g,ow:()=>p});var r=i(41481),n=i(9350),s=i(82417);let a=[0,0,0,0],o=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],l=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],u=[0,0,0],c=[0,0,0],h={default:-1,cartesian:0,lnglat:1,"meter-offsets":2,"lnglat-offsets":3};function f(t){let e=h[t];if(void 0===e)throw Error(`Invalid coordinateSystem: ${t}`);return e}let d=(0,s.A)(function({viewport:t,devicePixelRatio:e,coordinateSystem:i,coordinateOrigin:s}){let{projectionCenter:c,viewProjectionMatrix:h,originCommon:d,cameraPosCommon:g,shaderCoordinateOrigin:m,geospatialOrigin:_}=function(t,e,i){let{viewMatrixUncentered:n,projectionMatrix:s}=t,{viewMatrix:l,viewProjectionMatrix:u}=t,c=a,h=a,f=t.cameraPosition,{geospatialOrigin:d,shaderCoordinateOrigin:g,offsetMode:m}=p(t,e,i);return m&&(h=t.projectPosition(d||g),f=[f[0]-h[0],f[1]-h[1],f[2]-h[2]],h[3]=1,c=r.vec4.transformMat4([],h,u),l=n||l,u=r.mat4.multiply([],s,l),u=r.mat4.multiply([],u,o)),{viewMatrix:l,viewProjectionMatrix:u,projectionCenter:c,originCommon:h,cameraPosCommon:f,shaderCoordinateOrigin:g,geospatialOrigin:d}}(t,i,s),b=t.getDistanceScales(),v=[t.width*e,t.height*e],y=r.vec4.transformMat4([],[0,0,-t.focalDistance,1],t.projectionMatrix)[3]||1,E={coordinateSystem:f(i),projectionMode:t.projectionMode,coordinateOrigin:m,commonOrigin:d.slice(0,3),center:c,pseudoMeters:!!t._pseudoMeters,viewportSize:v,devicePixelRatio:e,focalDistance:y,commonUnitsPerMeter:b.unitsPerMeter,commonUnitsPerWorldUnit:b.unitsPerMeter,commonUnitsPerWorldUnit2:u,scale:t.scale,wrapLongitude:!1,viewProjectionMatrix:h,modelMatrix:l,cameraPosition:g};if(_){let e=t.getDistanceScales(_);switch(i){case"meter-offsets":E.commonUnitsPerWorldUnit=e.unitsPerMeter,E.commonUnitsPerWorldUnit2=e.unitsPerMeter2;break;case"lnglat":case"lnglat-offsets":t._pseudoMeters||(E.commonUnitsPerMeter=e.unitsPerMeter),E.commonUnitsPerWorldUnit=e.unitsPerDegree,E.commonUnitsPerWorldUnit2=e.unitsPerDegree2;break;case"cartesian":E.commonUnitsPerWorldUnit=[1,1,e.unitsPerMeter[2]],E.commonUnitsPerWorldUnit2=[0,0,e.unitsPerMeter2[2]]}}if(t.projectionMode===n.Kx.GLOBE&&"meter-offsets"===i){let t=s[0]*Math.PI/180,e=s[1]*Math.PI/180,i=Math.cos(e),r=((s[2]||0)/6370972+1)*256;E.commonOrigin=[Math.sin(t)*i*r,-Math.cos(t)*i*r,Math.sin(e)*r]}return E});function p(t,e,i=c){let r;i.length<3&&(i=[i[0],i[1],0]);let s=i,a=!0;switch(r="lnglat-offsets"===e||"meter-offsets"===e?i:t.isGeospatial?[Math.fround(t.longitude),Math.fround(t.latitude),0]:null,t.projectionMode){case n.Kx.WEB_MERCATOR:("lnglat"===e||"cartesian"===e)&&(r=[0,0,0],a=!1);break;case n.Kx.WEB_MERCATOR_AUTO_OFFSET:"lnglat"===e?s=r:"cartesian"===e&&(s=[Math.fround(t.center[0]),Math.fround(t.center[1]),0],r=t.unprojectPosition(s),s[0]-=i[0],s[1]-=i[1],s[2]-=i[2]);break;case n.Kx.IDENTITY:(s=t.position.map(Math.fround))[2]=s[2]||0;break;case n.Kx.GLOBE:a=!1,r=null;break;default:a=!1}return{geospatialOrigin:r,shaderCoordinateOrigin:s,offsetMode:a}}function g({viewport:t,devicePixelRatio:e=1,modelMatrix:i=null,coordinateSystem:r="default",coordinateOrigin:n=c,autoWrapLongitude:s=!1}){"default"===r&&(r=t.isGeospatial?"lnglat":"cartesian");let a=d({viewport:t,devicePixelRatio:e,coordinateSystem:r,coordinateOrigin:n});return a.wrapLongitude=s,a.modelMatrix=i||l,a}},84175(t,e,i){"use strict";i.d(e,{A:()=>a});var r=i(52948);let n=`\
// Define a structure to hold both the clip-space position and the common position.
struct ProjectResult {
  clipPosition: vec4<f32>,
  commonPosition: vec4<f32>,
};

// This function mimics the GLSL version with the 'out' parameter by returning both values.
fn project_position_to_clipspace_and_commonspace(
    position: vec3<f32>,
    position64Low: vec3<f32>,
    offset: vec3<f32>
) -> ProjectResult {
  // Compute the projected position.
  let projectedPosition: vec3<f32> = project_position_vec3_f64(position, position64Low);

  // Start with the provided offset.
  var finalOffset: vec3<f32> = offset;

  // Get whether a rotation is needed and the rotation matrix.
  let rotationResult = project_needs_rotation(projectedPosition);

  // If rotation is needed, update the offset.
  if (rotationResult.needsRotation) {
    finalOffset = rotationResult.transform * offset;
  }

  // Compute the common position.
  let commonPosition: vec4<f32> = vec4<f32>(projectedPosition + finalOffset, 1.0);

  // Convert to clip-space.
  let clipPosition: vec4<f32> = project_common_position_to_clipspace(commonPosition);

  return ProjectResult(clipPosition, commonPosition);
}

// A convenience overload that returns only the clip-space position.
fn project_position_to_clipspace(
    position: vec3<f32>,
    position64Low: vec3<f32>,
    offset: vec3<f32>
) -> vec4<f32> {
  return project_position_to_clipspace_and_commonspace(position, position64Low, offset).clipPosition;
}
`,s=`\
vec4 project_position_to_clipspace(
  vec3 position, vec3 position64Low, vec3 offset, out vec4 commonPosition
) {
  vec3 projectedPosition = project_position(position, position64Low);
  mat3 rotation;
  if (project_needs_rotation(projectedPosition, rotation)) {
    // offset is specified as ENU
    // when in globe projection, rotate offset so that the ground alighs with the surface of the globe
    offset = rotation * offset;
  }
  commonPosition = vec4(projectedPosition + offset, 1.0);
  return project_common_position_to_clipspace(commonPosition);
}

vec4 project_position_to_clipspace(
  vec3 position, vec3 position64Low, vec3 offset
) {
  vec4 commonPosition;
  return project_position_to_clipspace(position, position64Low, offset, commonPosition);
}
`,a={name:"project32",dependencies:[r.A],source:n,vs:s}},2357(t,e,i){"use strict";i.d(e,{A:()=>r});class r{constructor(t){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=t}get inProgress(){return this._inProgress}start(t){this.cancel(),this.settings=t,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1)}update(){if(!this._inProgress)return!1;if(null===this._handle){let{_timeline:t,settings:e}=this;this._handle=t.addChannel({delay:t.getTime(),duration:e.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}}},24067(t,e,i){"use strict";function r(t,e){if(!t)throw Error(e||"deck.gl: assertion failed.")}i.d(e,{A:()=>r})},7914(t,e,i){"use strict";i.d(e,{b:()=>function t(e,i,r){if(e===i)return!0;if(!r||!e||!i)return!1;if(Array.isArray(e)){if(!Array.isArray(i)||e.length!==i.length)return!1;for(let n=0;n<e.length;n++)if(!t(e[n],i[n],r-1))return!1;return!0}if(Array.isArray(i))return!1;if("object"==typeof e&&"object"==typeof i){let n=Object.keys(e),s=Object.keys(i);if(n.length!==s.length)return!1;for(let s of n)if(!i.hasOwnProperty(s)||!t(e[s],i[s],r-1))return!1;return!0}return!1}})},38055(t,e,i){"use strict";function r(t,e=()=>!0){return Array.isArray(t)?function t(e,i,r){let n=-1;for(;++n<e.length;){let s=e[n];Array.isArray(s)?t(s,i,r):i(s)&&r.push(s)}return r}(t,e,[]):e(t)?[t]:[]}function n({target:t,source:e,start:i=0,count:r=1}){let s=e.length,a=r*s,o=0;for(let r=i;o<s;o++)t[r++]=e[o];for(;o<a;)o<a-o?(t.copyWithin(i+o,i,i+o),o*=2):(t.copyWithin(i+o,i,i+a-o),o=a);return t}i.d(e,{B:()=>r,R:()=>n})},53439(t,e,i){"use strict";i.d(e,{I:()=>o,Td:()=>a,X:()=>s});let r=[],n=[];function s(t,e=0,i=1/0){let a=r,o={index:-1,data:t,target:[]};return t?"function"==typeof t[Symbol.iterator]?a=t:t.length>0&&(n.length=t.length,a=n):a=r,(e>0||Number.isFinite(i))&&(a=(Array.isArray(a)?a:Array.from(a)).slice(e,i),o.index=e-1),{iterable:a,objectInfo:o}}function a(t){return t&&t[Symbol.asyncIterator]}function o(t,e){let{size:i,stride:r,offset:n,startIndices:s,nested:a}=e,o=t.BYTES_PER_ELEMENT,l=r?r/o:i,u=n?n/o:0,c=Math.floor((t.length-u)/l);return(e,{index:r,target:n})=>{let o;if(!s){let e=r*l+u;for(let r=0;r<i;r++)n[r]=t[e+r];return n}let h=s[r],f=s[r+1]||c;if(a){o=Array(f-h);for(let e=h;e<f;e++){let r=e*l+u;n=Array(i);for(let e=0;e<i;e++)n[e]=t[r+e];o[e-h]=n}}else if(l===i)o=t.subarray(h*i+u,f*i+u);else{o=new t.constructor((f-h)*i);let e=0;for(let r=h;r<f;r++){let n=r*l+u;for(let r=0;r<i;r++)o[e++]=t[n+r]}}return o}}},3459(t,e,i){"use strict";i.d(e,{A:()=>r});let r=new(i(62465)).h({id:"deck"})},25667(t,e,i){"use strict";let r;i.d(e,{$M:()=>a,Vl:()=>l,_Z:()=>p,cT:()=>d,om:()=>u,on:()=>c,zi:()=>o});var n=i(23459),s=i(41481);function a(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function o(t,e){let i=t%e;return i<0?e+i:i}function l(t){return[t[12],t[13],t[14]]}function u(t){let e=t[10],i=t[14];return{near:i/(e-1),far:i/(e+1)}}function c(t){return{left:f(t[3]+t[0],t[7]+t[4],t[11]+t[8],t[15]+t[12]),right:f(t[3]-t[0],t[7]-t[4],t[11]-t[8],t[15]-t[12]),bottom:f(t[3]+t[1],t[7]+t[5],t[11]+t[9],t[15]+t[13]),top:f(t[3]-t[1],t[7]-t[5],t[11]-t[9],t[15]-t[13]),near:f(t[3]+t[2],t[7]+t[6],t[11]+t[10],t[15]+t[14]),far:f(t[3]-t[2],t[7]-t[6],t[11]-t[10],t[15]-t[14])}}let h=new s.Vector3;function f(t,e,i,r){h.set(t,e,i);let n=h.len();return{distance:r/n,normal:new s.Vector3(-t/n,-e/n,-i/n)}}function d(t,e){let{size:i=1,startIndex:s=0}=e,a=void 0!==e.endIndex?e.endIndex:t.length,o=(a-s)/i;r=n.A.allocate(r,o,{type:Float32Array,size:2*i});let l=s,u=0;for(;l<a;){for(let e=0;e<i;e++){let n=t[l++];r[u+e]=n,r[u+e+i]=n-Math.fround(n)}u+=2*i}return r.subarray(0,o*i*2)}function p(t){let e=null,i=!1;for(let r of t)r&&(e?(i||(e=[[e[0][0],e[0][1]],[e[1][0],e[1][1]]],i=!0),e[0][0]=Math.min(e[0][0],r[0][0]),e[0][1]=Math.min(e[0][1],r[0][1]),e[1][0]=Math.max(e[1][0],r[1][0]),e[1][1]=Math.max(e[1][1],r[1][1])):e=r);return e}},82417(t,e,i){"use strict";function r(t){let e,i={};return r=>{for(let n in r)if(!function(t,e){if(t===e)return!0;if(Array.isArray(t)){let i=t.length;if(!e||e.length!==i)return!1;for(let r=0;r<i;r++)if(t[r]!==e[r])return!1;return!0}return!1}(r[n],i[n])){e=t(r),i=r;break}return e}}i.d(e,{A:()=>r})},23459(t,e,i){"use strict";i.d(e,{A:()=>r});let r=new class{constructor(t={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(t)}setOptions(t){Object.assign(this.opts,t)}allocate(t,e,{size:i=1,type:r,padding:n=0,copy:s=!1,initialize:a=!1,maxCount:o}){let l=r||t&&t.constructor||Float32Array,u=e*i+n;if(ArrayBuffer.isView(t)){if(u<=t.length)return t;if(u*t.BYTES_PER_ELEMENT<=t.buffer.byteLength)return new l(t.buffer,0,u)}let c=1/0;o&&(c=o*i+n);let h=this._allocate(l,u,a,c);return t&&s?h.set(t):a||h.fill(0,0,4),this._release(t),h}release(t){this._release(t)}_allocate(t,e,i,r){let n=Math.max(Math.ceil(e*this.opts.overAlloc),1);n>r&&(n=r);let s=this._pool,a=t.BYTES_PER_ELEMENT*n,o=s.findIndex(t=>t.byteLength>=a);if(o>=0){let e=new t(s.splice(o,1)[0],0,n);return i&&e.fill(0),e}return new t(n)}_release(t){if(!ArrayBuffer.isView(t))return;let e=this._pool,{buffer:i}=t,{byteLength:r}=i,n=e.findIndex(t=>t.byteLength>=r);n<0?e.push(i):(n>0||e.length<this.opts.poolSize)&&e.splice(n,0,i),e.length>this.opts.poolSize&&e.shift()}}},47345(t,e,i){"use strict";i.d(e,{A:()=>d});var r=i(3459),n=i(25667),s=i(41481),a=i(88967),o=i(9350);let l=Math.PI/180,u=(0,n.$M)(),c=[0,0,0],h={unitsPerMeter:[1,1,1],metersPerUnit:[1,1,1]};class f{constructor(t={}){this._frustumPlanes={},this.id=t.id||this.constructor.displayName||"viewport",this.x=t.x||0,this.y=t.y||0,this.width=t.width||1,this.height=t.height||1,this.zoom=t.zoom||0,this.padding=t.padding,this.distanceScales=t.distanceScales||h,this.focalDistance=t.focalDistance||1,this.position=t.position||c,this.modelMatrix=t.modelMatrix||null;let{longitude:e,latitude:i}=t;this.isGeospatial=Number.isFinite(i)&&Number.isFinite(e),this._initProps(t),this._initMatrices(t),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return this.distanceScales.metersPerUnit[2]/this.scale}get projectionMode(){return this.isGeospatial?this.zoom<12?o.Kx.WEB_MERCATOR:o.Kx.WEB_MERCATOR_AUTO_OFFSET:o.Kx.IDENTITY}equals(t){return t instanceof f&&(this===t||t.width===this.width&&t.height===this.height&&t.scale===this.scale&&t.projectionMode===this.projectionMode&&t.resolution===this.resolution&&(0,s.equals)(t.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&(0,s.equals)(t.projectionMatrix,this.projectionMatrix)&&(0,s.equals)(t.viewMatrix,this.viewMatrix))}project(t,{topLeft:e=!0}={}){let i=this.projectPosition(t),r=(0,a.VJ)(i,this.pixelProjectionMatrix),[n,s]=r,o=e?s:this.height-s;return 2===t.length?[n,o]:[n,o,r[2]]}unproject(t,{topLeft:e=!0,targetZ:i}={}){let[r,n,s]=t,o=e?n:this.height-n,l=i&&i*this.distanceScales.unitsPerMeter[2],u=(0,a.xJ)([r,o,s],this.pixelUnprojectionMatrix,l),[c,h,f]=this.unprojectPosition(u);return Number.isFinite(s)?[c,h,f]:Number.isFinite(i)?[c,h,i]:[c,h]}projectPosition(t){let[e,i]=this.projectFlat(t);return[e,i,(t[2]||0)*this.distanceScales.unitsPerMeter[2]]}unprojectPosition(t){let[e,i]=this.unprojectFlat(t);return[e,i,(t[2]||0)*this.distanceScales.metersPerUnit[2]]}projectFlat(t){if(this.isGeospatial){let e=(0,a.Gw)(t);return e[1]=(0,s.clamp)(e[1],-318,830),e}return t}unprojectFlat(t){return this.isGeospatial?(0,a.iV)(t):t}getBounds(t={}){let e={targetZ:t.z||0},i=this.unproject([0,0],e),r=this.unproject([this.width,0],e),n=this.unproject([0,this.height],e),s=this.unproject([this.width,this.height],e);return[Math.min(i[0],r[0],n[0],s[0]),Math.min(i[1],r[1],n[1],s[1]),Math.max(i[0],r[0],n[0],s[0]),Math.max(i[1],r[1],n[1],s[1])]}getDistanceScales(t){return t&&this.isGeospatial?(0,a.nI)({longitude:t[0],latitude:t[1],highPrecision:!0}):this.distanceScales}containsPixel({x:t,y:e,width:i=1,height:r=1}){return t<this.x+this.width&&this.x<t+i&&e<this.y+this.height&&this.y<e+r}getFrustumPlanes(){return this._frustumPlanes.near||Object.assign(this._frustumPlanes,(0,n.on)(this.viewProjectionMatrix)),this._frustumPlanes}panByPosition(t,e,i){return null}_initProps(t){let e=t.longitude,i=t.latitude;this.isGeospatial&&(Number.isFinite(t.zoom)||(this.zoom=(0,a.fO)({latitude:i})+Math.log2(this.focalDistance)),this.distanceScales=t.distanceScales||(0,a.nI)({latitude:i,longitude:e}));let r=Math.pow(2,this.zoom);this.scale=r;let{position:n,modelMatrix:o}=t,l=c;if(n&&(l=o?new s.Matrix4(o).transformAsVector(n,[]):n),this.isGeospatial){let t=this.projectPosition([e,i,0]);this.center=new s.Vector3(l).scale(this.distanceScales.unitsPerMeter).add(t)}else this.center=this.projectPosition(l)}_initMatrices(t){let{viewMatrix:e=u,projectionMatrix:i=null,orthographic:a=!1,fovyRadians:o,fovy:c=75,near:h=.1,far:f=1e3,padding:d=null,focalDistance:p=1}=t;this.viewMatrixUncentered=e,this.viewMatrix=new s.Matrix4().multiplyRight(e).translate(new s.Vector3(this.center).negate()),this.projectionMatrix=i||function({width:t,height:e,orthographic:i,fovyRadians:r,focalDistance:n,padding:a,near:o,far:l}){let u=t/e,c=i?new s.Matrix4().orthographic({fovy:r,aspect:u,focalDistance:n,near:o,far:l}):new s.Matrix4().perspective({fovy:r,aspect:u,near:o,far:l});if(a){let{left:i=0,right:r=0,top:n=0,bottom:o=0}=a,l=(0,s.clamp)((i+t-r)/2,0,t)-t/2,u=(0,s.clamp)((n+e-o)/2,0,e)-e/2;c[8]-=2*l/t,c[9]+=2*u/e}return c}({width:this.width,height:this.height,orthographic:a,fovyRadians:o||c*l,focalDistance:p,padding:d,near:h,far:f});let g=(0,n.$M)();s.mat4.multiply(g,g,this.projectionMatrix),s.mat4.multiply(g,g,this.viewMatrix),this.viewProjectionMatrix=g,this.viewMatrixInverse=s.mat4.invert([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=(0,n.Vl)(this.viewMatrixInverse);let m=(0,n.$M)(),_=(0,n.$M)();s.mat4.scale(m,m,[this.width/2,-this.height/2,1]),s.mat4.translate(m,m,[1,-1,0]),s.mat4.multiply(_,m,this.viewProjectionMatrix),this.pixelProjectionMatrix=_,this.pixelUnprojectionMatrix=s.mat4.invert((0,n.$M)(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||r.A.warn("Pixel project matrix not invertible")()}}f.displayName="Viewport";let d=f},78374(t,e,i){"use strict";i.d(e,{A:()=>f});var r=i(47345),n=i(88967),s=i(83588),a=i(70177);let o=Math.PI/180;function l(t,e,i){let{pixelUnprojectionMatrix:r}=t,o=(0,a._U)(r,[e,0,1,1]),l=(0,a._U)(r,[e,t.height,1,1]),u=(i*t.distanceScales.unitsPerMeter[2]-o[2])/(l[2]-o[2]),c=s.Cc([],o,l,u),h=(0,n.iV)(c);return h.push(i),h}var u=i(26369),c=i(41481);class h extends r.A{constructor(t={}){let e,{latitude:i=0,longitude:r=0,zoom:s=0,pitch:a=0,bearing:o=0,nearZMultiplier:l=.1,farZMultiplier:u=1.01,nearZ:h,farZ:f,orthographic:d=!1,projectionMatrix:p,repeat:g=!1,worldOffset:m=0,position:_,padding:b,legacyMeterSizes:v=!1}=t,{width:y,height:E,altitude:M=1.5}=t,w=Math.pow(2,s);y=y||1,E=E||1;let x=null;if(p)M=p[5]/2,e=(0,n.Os)(M);else{let r;if(t.fovy?(e=t.fovy,M=(0,n.wZ)(e)):e=(0,n.Os)(M),b){let{top:t=0,bottom:e=0}=b;r=[0,(0,c.clamp)((t+E-e)/2,0,E)-E/2]}x=(0,n.om)({width:y,height:E,scale:w,center:_&&[0,0,_[2]*(0,n.mY)(i)],offset:r,pitch:a,fovy:e,nearZMultiplier:l,farZMultiplier:u}),Number.isFinite(h)&&(x.near=h),Number.isFinite(f)&&(x.far=f)}let P=(0,n.rY)({height:E,pitch:a,bearing:o,scale:w,altitude:M});m&&(P=new c.Matrix4().translate([512*m,0,0]).multiplyLeft(P)),super({...t,width:y,height:E,viewMatrix:P,longitude:r,latitude:i,zoom:s,...x,fovy:e,focalDistance:M}),this.latitude=i,this.longitude=r,this.zoom=s,this.pitch=a,this.bearing=o,this.altitude=M,this.fovy=e,this.orthographic=d,this._subViewports=g?[]:null,this._pseudoMeters=v,Object.freeze(this)}get subViewports(){if(this._subViewports&&!this._subViewports.length){let t=this.getBounds(),e=Math.floor((t[0]+180)/360),i=Math.ceil((t[2]-180)/360);for(let t=e;t<=i;t++){let e=t?new h({...this,worldOffset:t}):this;this._subViewports.push(e)}}return this._subViewports}equals(t){return t instanceof h&&t._pseudoMeters===this._pseudoMeters&&super.equals(t)}projectPosition(t){if(this._pseudoMeters)return super.projectPosition(t);let[e,i]=this.projectFlat(t);return[e,i,(t[2]||0)*(0,n.mY)(t[1])]}unprojectPosition(t){if(this._pseudoMeters)return super.unprojectPosition(t);let[e,i]=this.unprojectFlat(t),r=(t[2]||0)/(0,n.mY)(i);return[e,i,r]}addMetersToLngLat(t,e){return(0,n.dT)(t,e)}panByPosition(t,e,i){let r=(0,n.xJ)(e,this.pixelUnprojectionMatrix),s=this.projectFlat(t),a=c.vec2.add([],s,c.vec2.negate([],r)),o=c.vec2.add([],this.center,a),[l,u]=this.unprojectFlat(o);return{longitude:l,latitude:u}}panByPosition3D(t,e){let i=t[2]||0,r=c.vec2.sub([],t,this.unproject(e,{targetZ:i}));return{longitude:this.longitude+r[0],latitude:this.latitude+r[1]}}getBounds(t={}){let e=function(t,e=0){let i,r,{width:n,height:s,unproject:a}=t,u={targetZ:e},c=a([0,s],u),h=a([n,s],u);return(t.fovy?.5*t.fovy*o:Math.atan(.5/t.altitude))>(90-t.pitch)*o-.01?(i=l(t,0,e),r=l(t,n,e)):(i=a([0,0],u),r=a([n,0],u)),[c,h,r,i]}(this,t.z||0);return[Math.min(e[0][0],e[1][0],e[2][0],e[3][0]),Math.min(e[0][1],e[1][1],e[2][1],e[3][1]),Math.max(e[0][0],e[1][0],e[2][0],e[3][0]),Math.max(e[0][1],e[1][1],e[2][1],e[3][1])]}fitBounds(t,e={}){let{width:i,height:r}=this,{longitude:s,latitude:o,zoom:l}=function(t){let{width:e,height:i,bounds:r,minExtent:s=0,maxZoom:o=24,offset:l=[0,0]}=t,[[c,h],[f,d]]=r,p=function(t=0){return"number"==typeof t?{top:t,bottom:t,left:t,right:t}:((0,u.v)(Number.isFinite(t.top)&&Number.isFinite(t.bottom)&&Number.isFinite(t.left)&&Number.isFinite(t.right)),t)}(t.padding),g=(0,n.Gw)([c,(0,a.qE)(d,-n.aH,n.aH)]),m=(0,n.Gw)([f,(0,a.qE)(h,-n.aH,n.aH)]),_=[Math.max(Math.abs(m[0]-g[0]),s),Math.max(Math.abs(m[1]-g[1]),s)],b=[e-p.left-p.right-2*Math.abs(l[0]),i-p.top-p.bottom-2*Math.abs(l[1])];(0,u.v)(b[0]>0&&b[1]>0);let v=b[0]/_[0],y=b[1]/_[1],E=(p.right-p.left)/2/v,M=(p.top-p.bottom)/2/y,w=[(m[0]+g[0])/2+E,(m[1]+g[1])/2+M],x=(0,n.iV)(w),P=Math.min(o,(0,a.p6)(Math.abs(Math.min(v,y))));return(0,u.v)(Number.isFinite(P)),{longitude:x[0],latitude:x[1],zoom:P}}({width:i,height:r,bounds:t,...e});return new h({width:i,height:r,longitude:s,latitude:o,zoom:l})}}h.displayName="WebMercatorViewport";let f=h},91783(t,e,i){"use strict";i.d(e,{p:()=>o});var r=i(26839);let n=`\
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`,s=`#version 300 es
${n}`;var a=i(30638);class o{device;model;transformFeedback;static defaultProps={...a.K.defaultProps,feedbackBufferMode:"separate",outputs:void 0,feedbackBuffers:void 0};static isSupported(t){return t?.info?.type==="webgl"}constructor(t,e=o.defaultProps){if(!o.isSupported(t))throw Error("BufferTransform not yet implemented on WebGPU");this.device=t,this.model=new a.K(this.device,{id:e.id||"buffer-transform-model",fs:e.fs||function(){let{input:t,inputChannels:e,output:i}={};if(!t)return s;if(!e)throw Error("inputChannels");let r=function(t){switch(t){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw Error(`invalid channels: ${t}`)}}(e),n=function(t,e){switch(e){case 1:return`vec4(${t}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${t}, 0.0, 1.0)`;case 3:return`vec4(${t}, 1.0)`;case 4:return t;default:throw Error(`invalid channels: ${e}`)}}(t,e);return`\
#version 300 es
in ${r} ${t};
out vec4 ${i};
void main() {
  ${i} = ${n};
}`}(),topology:e.topology||"point-list",varyings:e.outputs||e.varyings,...e,bufferMode:e.bufferMode||("interleaved"===e.feedbackBufferMode?35980:35981)}),this.transformFeedback=this.device.createTransformFeedback({layout:this.model.pipeline.shaderLayout,buffers:e.feedbackBuffers}),this.model.setTransformFeedback(this.transformFeedback)}destroy(){this.model&&this.model.destroy()}delete(){this.destroy()}run(t){t?.inputBuffers&&this.model.setAttributes(t.inputBuffers),t?.outputBuffers&&this.transformFeedback.setBuffers(t.outputBuffers);let e=this.device.beginRenderPass({discard:!0,...t});this.model.draw(e),e.end()}getBuffer(t){return this.transformFeedback.getBuffer(t)}readAsync(t){let e=this.getBuffer(t);if(!e)throw Error("BufferTransform#getBuffer");if(e instanceof r.h)return e.readAsync();let{buffer:i,byteOffset:n=0,byteLength:s=i.byteLength}=e;return i.readAsync(n,s)}}},30257(t,e,i){"use strict";i.d(e,{C:()=>_});var r=i(69499),n=i(52009),s=i(83994),a=i(80979),o=i(94465),l=i(29651),u=i(57285),c=i(26839),h=i(34376),f=i(33823),d=i(76282),p=i(90015),g=i(16698),m=i(4500);class _{static defaultProps={...r.C.defaultProps,id:"unnamed",handle:void 0,userData:{},source:"",modules:[],defines:{},plugins:[],bindings:void 0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,shaderAssembler:h._P.getDefaultShaderAssembler("wgsl"),debugShaders:void 0};device;id;pipelineFactory;shaderFactory;userData={};bindings={};pipeline;source;shader;shaderInputs;_uniformStore;_pipelineNeedsUpdate="newly created";_getModuleUniforms;props;_destroyed=!1;constructor(t,e){var i;if("webgpu"!==t.type)throw Error("Computation is only supported in WebGPU");this.props={..._.defaultProps,...e},e=this.props,this.id=e.id||(0,m.L)("model"),this.device=t,Object.assign(this.userData,e.userData);let r={type:(i=t).type,shaderLanguage:i.info.shadingLanguage,shaderLanguageVersion:i.info.shadingLanguageVersion,gpu:i.info.gpu,limits:i.limits,features:i.features},o=(0,f.r)(this.props.plugins,r.shaderLanguage);if(Object.keys(o.vertexInputs).length>0||Object.keys(o.varyings).length>0)throw Error("Computation does not support ShaderPlugin vertex inputs or varyings");let l=Object.fromEntries((0,f.K)(this.props.modules,o.modules).map(t=>[t.name,t]));this.shaderInputs=e.shaderInputs||new p.l(l),e.shaderInputs&&o.modules.length>0&&this.shaderInputs.addModules(o.modules),this.setShaderInputs(this.shaderInputs);let u=(0,g.jY)(this.props.modules,this.shaderInputs?.getModules()),c={...o.defines,...this.props.defines};this.props.shaderLayout=(0,g.Y$)(this.props.shaderLayout,u)||null,this.pipelineFactory=e.pipelineFactory||n.N.getDefaultPipelineFactory(this.device),this.shaderFactory=e.shaderFactory||s.g.getDefaultShaderFactory(this.device);let d=this.props.shaderAssembler;(0,a.v)(d instanceof h.Ry);let{source:b,getUniforms:v,shaderLayout:y}=d.assembleWGSLShader({platformInfo:r,...this.props,modules:u,defines:c,scanVertexAttributes:!1,pluginInjections:o.injections});this.source=b,this._getModuleUniforms=v;let E=y??t.getShaderLayout?.(this.source,{scanVertexAttributes:!1});this.props.shaderLayout=(0,g.Y$)(this.props.shaderLayout||E||null,u)||null,this.pipeline=this._updatePipeline(),e.bindings&&this.setBindings(e.bindings)}destroy(){this._destroyed||(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),this._uniformStore.destroy(),this._destroyed=!0)}predraw(t){this.updateShaderInputs(t)}dispatch(t,e,i,r){try{this._logDrawCallStart(),this._setPipeline(t),t.dispatch(e,i,r)}finally{this._logDrawCallEnd()}}dispatchIndirect(t,e,i=0){try{this._logDrawCallStart(),this._setPipeline(t),t.dispatchIndirect(e,i)}finally{this._logDrawCallEnd()}}_setPipeline(t){this.pipeline=this._updatePipeline(),this.pipeline.setBindings(this.bindings),t.setPipeline(this.pipeline),t.setBindings({})}setVertexCount(t){}setInstanceCount(t){}setShaderInputs(t){for(let[e,i]of(this.shaderInputs=t,this._uniformStore=new o.K(this.device,this.shaderInputs.modules),Object.entries(this.shaderInputs.modules)))if((0,g.fX)(i)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}}setShaderModuleProps(t){let e=this._getModuleUniforms(t),i=Object.keys(e).filter(t=>{let i=e[t];return!(0,d.H9)(i)&&"number"!=typeof i&&"boolean"!=typeof i}),r={};for(let t of i)r[t]=e[t],delete e[t]}updateShaderInputs(t){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),t)}setBindings(t){Object.assign(this.bindings,t)}_setPipelineNeedsUpdate(t){this._pipelineNeedsUpdate=this._pipelineNeedsUpdate||t}_updatePipeline(){if(this._pipelineNeedsUpdate){let t=null;this.pipeline&&(l.R.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),t=this.shader),this._pipelineNeedsUpdate=!1,this.shader=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:"compute",source:this.source,debugShaders:this.props.debugShaders}),this.pipeline=this.pipelineFactory.createComputePipeline({...this.props,shader:this.shader}),t&&this.shaderFactory.release(t)}return this.pipeline}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let t=l.R.level>3?0:1e4;l.R.level<2||Date.now()-this._lastLogTime<t||(this._lastLogTime=Date.now(),this._logOpen=!0,l.R.group(2,`>>> DRAWING MODEL ${this.id}`,{collapsed:l.R.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let t=this.shaderInputs.getDebugTable();l.R.table(2,t)(),l.R.groupEnd(2)(),this._logOpen=!1}}_drawCount=0;_getBufferOrConstantValues(t,e){let i=u.r.getTypedArrayConstructor(e);return(t instanceof c.h?new i(t.debugData):t).toString()}}},84226(t,e,i){"use strict";i.d(e,{I:()=>n});var r=i(61954);class n{buffer;format;length;byteOffset;byteStride;constructor(t){let e=r.E.getVertexFormatInfo(t.format).byteLength,i=t.byteOffset??0,n=t.byteStride??e;if(s(t.length,"GPUDataView length"),s(i,"GPUDataView byteOffset"),s(n,"GPUDataView byteStride"),n<e)throw Error(`GPUDataView byteStride ${n} is smaller than ${t.format} byte length ${e}`);let a=0===t.length?0:(t.length-1)*n+e,o=i+a;if(!Number.isSafeInteger(a)||!Number.isSafeInteger(o))throw Error("GPUDataView byte range must use safe integers");if(o>t.buffer.byteLength)throw Error("GPUDataView exceeds its backing buffer byte length");this.buffer=t.buffer,this.format=t.format,this.length=t.length,this.byteOffset=i,this.byteStride=n}get elementByteLength(){return r.E.getVertexFormatInfo(this.format).byteLength}get byteLength(){return 0===this.length?0:(this.length-1)*this.byteStride+this.elementByteLength}}function s(t,e){if(!Number.isSafeInteger(t)||t<0)throw Error(`${e} must be a non-negative safe integer`)}},84(t,e,i){"use strict";i.d(e,{L:()=>h});var r=i(84226),n=i(61954),s=i(50584);function a(t){return!!(t&&"object"==typeof t&&"struct"===t.type)}function o(t,e){return 1===e?t:`vec${e}<${t}>`}function l(t,e){return Math.ceil(t/e)*e}var u=i(6917);class c{buffer;ownsDataBuffer;constructor(t,e){this.buffer=t,this.ownsDataBuffer=e}get ownsBuffer(){return this.ownsDataBuffer}transferBufferOwnership(t){if(t.buffer!==this.buffer)throw Error("GPUData ownership can only be transferred to the same buffer");t.ownsDataBuffer=this.ownsDataBuffer,this.ownsDataBuffer=!1}destroy(){this.ownsDataBuffer&&(this.buffer.destroy(),this.ownsDataBuffer=!1)}}let h=class extends c{dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;readbackMetadata;valueOffsets;nullBitmap;valueByteLength;constructor(t){let e,{buffer:i,format:r,length:c,valueLength:h,stride:f,byteOffset:d=0,byteStride:p,rowByteLength:g,ownsBuffer:m=!1,readbackMetadata:_,valueOffsets:b,nullBitmap:v,valueByteLength:y,dataType:E}=t;super(i,m);let M=a(e=r?"string"==typeof r?r:function(t,e){let i=Object.entries(t);if(0===i.length)throw Error("GPUData struct format must declare at least one field");return"packed"===e?function(t){let e=[],i=0,r=0;for(let[s,a]of t){let t=n.E.getVertexFormatInfo(a);if(t.webglOnly)throw Error(`Packed GPUData struct field "${s}" uses WebGL-only format ${a}`);i=l(i,Math.min(4,t.byteLength)),e.push([s,Object.freeze({format:a,byteOffset:i,byteLength:t.byteLength})]),i+=t.byteLength,r+=t.components}return Object.freeze({type:"struct",layout:"packed",fields:Object.freeze(Object.fromEntries(e)),components:r,byteStride:l(i,4),rowByteLength:i})}(i):function(t){let e=Object.fromEntries(t.map(([t,e])=>[t,function(t){let e=n.E.getVertexFormatInfo(t);switch(e.type){case"float32":return o("f32",e.components);case"sint32":return o("i32",e.components);case"uint32":return o("u32",e.components);default:return o("u32",Math.ceil(e.byteLength/4))}}(e)])),i=(0,s.Pr)(e,{layout:"wgsl-storage"}),r=[],a=0,l=0;for(let[e,s]of t){let t=n.E.getVertexFormatInfo(s),o=4*i.fields[e].offset;r.push([e,Object.freeze({format:s,byteOffset:o,byteLength:t.byteLength})]),a=Math.max(a,o+t.byteLength),l+=t.components}return Object.freeze({type:"struct",layout:"wgsl-storage",fields:Object.freeze(Object.fromEntries(r)),components:l,byteStride:i.byteLength,rowByteLength:a})}(i)}(r,t.layout??"wgsl-storage"):void 0)?e:void 0,w="string"==typeof e?(0,u.Ft)(e):void 0;if(this.dataType=E,this.format=e,this.length=c,this.valueLength=h??c,this.stride=f??w?.components??M?.components??p??g??1,this.byteOffset=d,this.rowByteLength=g??M?.rowByteLength??w?.byteLength??p??this.stride,this.byteStride=p??M?.byteStride??this.rowByteLength,M){if(this.rowByteLength<M.rowByteLength)throw Error(`GPUData rowByteLength ${this.rowByteLength} is smaller than struct format row byte length ${M.rowByteLength}`);if(this.byteStride<Math.max(M.byteStride,this.rowByteLength))throw Error(`GPUData byteStride ${this.byteStride} is smaller than its struct row layout`)}this.readbackMetadata=_,this.valueOffsets=b,this.nullBitmap=v,this.valueByteLength=y}getChild(t){if(!a(this.format))return null;let e=this.format.fields[t];return e?new r.I({buffer:this.buffer,format:e.format,length:this.length,byteOffset:this.byteOffset+e.byteOffset,byteStride:this.byteStride}):null}getChildAt(t){if(!a(this.format))return null;let e=Object.values(this.format.fields)[t];return e?new r.I({buffer:this.buffer,format:e.format,length:this.length,byteOffset:this.byteOffset+e.byteOffset,byteStride:this.byteStride}):null}}},6917(t,e,i){"use strict";i.d(e,{Ft:()=>l,Tm:()=>a,u4:()=>o});var r=i(61954);let n=/^vertex-list<([^<>]+)>$/,s=/^value-list<([^<>]+)>$/;function a(t){return n.test(t)}function o(t){return s.test(t)}function l(t){let e=function(t){let e=n.exec(t),i=s.exec(t),a=e?.[1]??i?.[1]??t;try{r.E.getVertexFormatInfo(a)}catch{throw Error(`Unsupported GPUVector format ${t}`)}return a}(t),i=a(t),l=o(t),u=r.E.getVertexFormatInfo(e),c=u.type,h=u.normalized,f=function(t,e){if(e)return"f32";switch(t){case"float32":return"f32";case"float16":return"f16";case"uint8":case"uint16":case"uint32":return"u32";case"sint8":case"sint16":case"sint32":return"i32";default:throw Error(`Unsupported GPUVector component type ${t}`)}}(c,h);return{format:t,elementFormat:e,vertexList:i,valueList:l,type:c,signedDataType:function(t,e){if("unorm10-10-10-2"===t)return"uint32";switch(e){case"unorm8":return"uint8";case"snorm8":return"sint8";case"unorm16":return"uint16";case"snorm16":return"sint16";default:return e}}(e,c),primitiveType:f,components:u.components,byteLength:u.byteLength,integer:u.integer,signed:u.signed,normalized:h,...u.webglOnly?{webglOnly:!0}:{}}}},65181(t,e,i){"use strict";i.d(e,{M:()=>s});var r=i(84),n=i(6917);class s{name;dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;bufferLayout;data=[];device;bufferProps;isAppendable=!1;ownsDataChunks=!0;ownedVectors=[];appendableByteLength=0;constructor(t){switch(t.type){case"buffer":{let{name:e,buffer:i,format:n,length:s,valueLength:o=s,byteOffset:l=0,ownsBuffer:u=!1}=t,{stride:c,byteStride:h,rowByteLength:f}=a(t);this.name=e,this.dataType=t.dataType,this.format=n,this.length=s,this.valueLength=o,this.stride=c,this.byteOffset=l,this.byteStride=h,this.rowByteLength=f,this.data.push(new r.L({buffer:i,format:n,length:s,valueLength:o,stride:c,byteOffset:l,byteStride:h,rowByteLength:f,ownsBuffer:u,dataType:t.dataType}));return}case"interleaved":{let{name:e,buffer:i,format:n,length:s,valueLength:a=s,byteOffset:o=0,byteStride:l,attributes:u,ownsBuffer:c=!1}=t;this.name=e,this.dataType=t.dataType,this.format=n,this.length=s,this.valueLength=a,this.stride=l,this.byteOffset=o,this.byteStride=l,this.rowByteLength=l,this.bufferLayout={name:e,byteStride:l,attributes:u},this.data.push(new r.L({buffer:i,format:n,length:s,valueLength:a,stride:l,byteOffset:o,byteStride:l,rowByteLength:l,ownsBuffer:c,dataType:t.dataType}));return}case"data":{var e;let i=t.format??(e=t.data,e[0]?.format),r=i?(0,n.Ft)(i):void 0,{name:s,data:a,stride:o=a[0]?.stride??r?.components??1,valueLength:l=a.reduce((t,e)=>t+e.valueLength,0),byteStride:u=a[0]?.byteStride??r?.byteLength,rowByteLength:c=a[0]?.rowByteLength??r?.byteLength,bufferLayout:h,ownsData:f=!1}=t;if(void 0===u||void 0===c)throw Error("GPUVector requires format or explicit byte layout metadata");i&&function(t,e){if(t.find(t=>t.format!==e))throw Error("GPUVector data chunks must share the declared format")}(a,i),this.name=s,this.dataType=t.dataType,this.format=i,this.length=a.reduce((t,e)=>t+e.length,0),this.valueLength=l,this.stride=o,this.byteOffset=1===a.length?a[0].byteOffset:0,this.byteStride=u,this.rowByteLength=c,this.bufferLayout=h,this.ownsDataChunks=f,this.data.push(...a);return}case"appendable":{let{name:e,device:i,format:r,valueLength:n=0,bufferProps:s}=t,{stride:o,byteStride:l,rowByteLength:u}=a(t);this.name=e,this.dataType=t.dataType,this.format=r,this.length=0,this.valueLength=n,this.stride=o,this.byteOffset=0,this.byteStride=l,this.rowByteLength=u,this.device=i,this.bufferProps=s,this.isAppendable=!0;return}}}get ownsBuffer(){return this.ownsDataChunks&&this.data.some(t=>t.ownsBuffer)||this.ownedVectors.some(t=>t.ownsBuffer)}get capacityRows(){return this.isAppendable?this.length:void 0}get appendedByteLength(){return this.appendableByteLength}addData(t){if(this.format&&t.format!==this.format)throw Error("GPUVector.addData() requires matching formats");if(t.byteStride!==this.byteStride)throw Error("GPUVector.addData() requires matching byteStride");if(t.rowByteLength!==this.rowByteLength)throw Error("GPUVector.addData() requires matching rowByteLength");return this.data.push(t),this.length+=t.length,this.valueLength+=t.valueLength,this}appendDataChunk(t,e=this.appendableByteLength+t.buffer.byteLength){if(!this.isAppendable)throw Error("GPUVector.appendDataChunk() requires appendable vector storage");if(this.format&&t.format!==this.format)throw Error("GPUVector.appendDataChunk() requires matching formats");if(t.byteStride!==this.byteStride||t.rowByteLength!==this.rowByteLength)throw Error("GPUVector.appendDataChunk() requires matching byte layout metadata");return this.data.push(t),this.length+=t.length,this.valueLength+=t.valueLength,this.appendableByteLength=e,this}resetLastBatch(){if(!this.isAppendable)throw Error("GPUVector.resetLastBatch() requires appendable vector storage");for(let t of this.data.splice(0))t.destroy();return this.length=0,this.valueLength=0,this.appendableByteLength=0,this}retainOwnedVectors(t){return this.ownedVectors.push(...t),this}transferBufferOwnership(t){let e=this.data[0],i=t.data[0];if(!e||!i||e.buffer!==i.buffer)throw Error("GPUVector ownership can only be transferred to the same buffer");e.transferBufferOwnership(i)}destroy(){if(this.ownsDataChunks)for(let t of this.data)t.destroy();for(let t of this.ownedVectors.splice(0))t.destroy()}}function a(t){let e=t.format?(0,n.Ft)(t.format):void 0,i=t.rowByteLength??t.byteStride??e?.byteLength;if(void 0===i)throw Error("GPUVector requires format or explicit rowByteLength");return{stride:t.stride??e?.components??1,byteStride:t.byteStride??i,rowByteLength:i}}},34010(t,e,i){"use strict";i.d(e,{GL:()=>c,uy:()=>h});var r=i(40462),n=i(99305),s=i(84226),a=i(65181),o=i(84),l=i(6917),u=i(65020);class c{static get bufferPoolSize(){return u.R.poolSize}static set bufferPoolSize(t){if(!Number.isSafeInteger(t)||t<0)throw Error("GPUDataEvaluator.bufferPoolSize must be a non-negative safe integer");u.R.poolSize=t,u.R.purge()}type;size;get offset(){return this._offset}get stride(){return this._stride}normalized;isConstant;length;get byteLength(){return this._byteLength}ValueType;source=null;format;_id;_destroyed=!1;_value;_offset;_stride;_byteLength;_gpuVector;_bufferOwnership="owned";_targetBuffer;static fromArray(t,{type:e,size:i=1,offset:n=0,stride:s=0,normalized:a=!1}){let o,l=e;return Array.isArray(t)?(l=l||"float32",o=new((0,r.Y0)(l))(t)):t instanceof Float64Array?(l="uint32",i*=2,n*=2,s*=2,o=new Uint32Array(t.buffer,t.byteOffset,t.byteLength/4)):(l=l||(0,r.UE)(t),o=t),new c({id:`<${l} * ${i}>`,type:l,size:i,offset:n,stride:s,normalized:a,value:o})}static fromConstant(t,e="float32"){let i,n=(0,r.Y0)(e);return Array.isArray(t)?i=`[${t.join(",")}]`:(i=String(t),t=[t]),new c({id:i,isConstant:!0,type:e,size:t.length,value:new n(t)})}static fromGPUData(t,e={}){return function(t){if(!t.format)throw Error("GPUDataEvaluator.fromGPUData() requires GPUData format metadata");if((0,l.Tm)(t.format)||(0,l.u4)(t.format))throw Error("GPUDataEvaluator.fromGPUData() does not support variable-length input");let e=(0,l.Ft)(t.format).byteLength;if(t.rowByteLength!==e)throw Error(`GPUDataEvaluator.fromGPUData() requires rowByteLength ${e} for GPUData`)}(t),new c({...f(new s.I({buffer:t.buffer,format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride})),id:e.id,gpuData:t})}static fromGPUDataView(t,e={}){return new c({...f(t),id:e.id,buffer:t.buffer})}constructor(t){let{id:e,value:i,buffer:n,gpuData:s,format:o,source:l=null,isConstant:u=!1}=t;if(!l&&!i&&!n&&!s)throw Error("GPUDataEvaluator must have a value source");let{type:h,size:f,offset:d,stride:p,normalized:g,length:m}=t;if(l instanceof c?(h=h??l.type,f=f??l.size,d=d??l.offset,p=p??l.stride,g=g??l.normalized,m=m??l.length):(f=f??1,d=d??0,g=g??!1,m=u?1:m),!h)throw Error("GPUDataEvaluator: type not defined");if(this._id=e,this.type=h,this.size=f,this.ValueType=(0,r.Y0)(this.type),this._offset=d,this._stride=p||this.ValueType.BYTES_PER_ELEMENT*f,this.normalized=g,this.source=l,this.format=o,void 0===m)if(u)m=1;else{if(!i)throw Error("GPUDataEvaluator: length not defined");m=Math.ceil(i.byteLength/this.stride)}this.isConstant=u,this.length=m;let _=this.ValueType.BYTES_PER_ELEMENT*this.size;this._byteLength=0===m?0:(m-1)*this.stride+_,this._value=i,this._bufferOwnership=l instanceof c||n||s?"borrowed":"owned",s?this._gpuVector=new a.M({type:"data",name:this._id??"data",format:s.format,data:[s],stride:s.stride,byteStride:s.byteStride,rowByteLength:s.rowByteLength}):n&&(this._gpuVector=this.createGPUVectorView({buffer:n,name:this._id,format:this.format}))}get value(){return this._value||(this.source instanceof c?this.source.value:void 0)}get evaluated(){return!!this._gpuVector}get id(){return this._id}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}get buffer(){return d(this.gpuVector)}setTargetBuffer({buffer:t,byteOffset:e=0,byteStride:i=this.stride}){if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)throw Error(`GPUDataEvaluator ${this} already evaluated`);if(!this.source||this.source instanceof c)throw Error("GPUDataEvaluator target buffers require a deferred operation source");this._targetBuffer={buffer:t,byteOffset:e,byteStride:i}}async evaluate(t,e={}){let i;if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;if(this.source instanceof c){let i=await this.source.evaluate(t);return this._gpuVector=this.createGPUVectorView({...e,buffer:d(i)}),this._gpuVector}if(i=this._getEvaluationBuffer(t),this._value)i.write(this._value);else{let e=await this.source.execute(t,i);if(!e.success)throw e.error||Error(`${this.source} evaluation failed`);e.value&&(this._value=e.value)}return this._gpuVector=this.createGPUVectorView({...e,buffer:i}),this._gpuVector}evaluateSync(t,e={}){let i;if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;if(this.source instanceof c){let i=this.source.evaluateSync(t);return this._gpuVector=this.createGPUVectorView({...e,buffer:d(i)}),this._gpuVector}if(i=this._getEvaluationBuffer(t),this._value)i.write(this._value);else{let e=this.source.executeSync(t,i);if(!e.success)throw e.error||Error(`${this.source} evaluation failed`);e.value&&(this._value=e.value)}return this._gpuVector=this.createGPUVectorView({...e,buffer:i}),this._gpuVector}createGPUVectorView(t){let e=t.name??this._id??"vector",i=t.format??this.format??function(t,e,i=!1){return e>=1&&e<=4?p(t,e,i):void 0}(this.type,this.size,this.normalized);if(t.interleaved){var r;let i,n="object"==typeof t.interleaved&&t.interleaved.attributes?t.interleaved.attributes:(r=this,function t(e,i,r){let n=e.source;if(n&&!(n instanceof c)&&"interleave"===n.name){for(let e of Object.values(n.inputs))e instanceof c&&t(e,i,r);return}i.push({attribute:e.id??e.toString(),format:p(e.type,e.size,e.normalized),byteOffset:r.byteOffset}),r.byteOffset+=e.ValueType.BYTES_PER_ELEMENT*e.size}(r,i=[],{byteOffset:0}),i);return new a.M({type:"interleaved",name:e,buffer:t.buffer,format:t.format??this.format,length:this.length,byteOffset:this.offset,byteStride:this.stride,attributes:n,ownsBuffer:!1})}return new a.M({type:"buffer",name:e,buffer:t.buffer,format:i,length:this.length,stride:this.size,byteOffset:this.offset,byteStride:this.stride,rowByteLength:this.ValueType.BYTES_PER_ELEMENT*this.size,ownsBuffer:!1})}_getEvaluationBuffer(t){let e=this._targetBuffer;if(!e)return u.R.createOrReuse(t,this.byteLength);if(e.buffer.device!==t)throw Error("GPUDataEvaluator target buffer belongs to a different device");let i=this.ValueType.BYTES_PER_ELEMENT*this.size,r=0===this.length?0:(this.length-1)*e.byteStride+i;if(e.byteOffset+r>e.buffer.byteLength)throw Error("GPUDataEvaluator target buffer is too small for the output layout");return this._offset=e.byteOffset,this._stride=e.byteStride,this._byteLength=r,this._bufferOwnership="borrowed",this._targetBuffer=void 0,e.buffer}async readValue(t=0,e){let{ValueType:i}=this,{size:r,offset:n,stride:s,length:a}=this,o=i.BYTES_PER_ELEMENT*r;if(e=e??a,e=Math.max(t=Math.max(0,Math.min(a,t)),Math.min(a,e)),this._value)return function(t,e,i,r){let{ValueType:n,size:s,offset:a,stride:o}=t,l=o/n.BYTES_PER_ELEMENT,u=a/n.BYTES_PER_ELEMENT,c=r-i;if(l===s){let t=u+i*l;return e.subarray(t,t+c*s)}let h=new n(c*s);for(let t=0;t<c;t++){let r=u+(i+t)*l;h.set(e.subarray(r,r+s),t*s)}return h}(this,this._value,t,e);let l=e-t;if(0===l)return new i(0);let u=n+t*s,c=await this.buffer.readAsync(u,s===o?l*o:(l-1)*s+o),h=new i(c.buffer,c.byteOffset,c.byteLength/i.BYTES_PER_ELEMENT);if(s===o)return h;let f=new Uint8Array(o*l);for(let t=0;t<l;t++){let e=t*s;f.set(c.subarray(e,e+o),t*o)}return new i(f.buffer)}async ensureCPUValue(){let t=this.value;if(t)return t;let e=await this.buffer.readAsync(0,this.offset+this.byteLength);if(e.byteLength%this.ValueType.BYTES_PER_ELEMENT!=0)throw Error(`${this} backing buffer byte length is not aligned to its scalar type`);let i=e.slice();return this._value=new this.ValueType(i.buffer,i.byteOffset,i.byteLength/this.ValueType.BYTES_PER_ELEMENT),this._value}ensureCPUValueSync(){let t=this.value;if(t)return t;throw Error(`${this} CPU value is not available for synchronous evaluation`)}toString(){return this._id??this.source?.toString()??this.constructor.name}destroy(){this._gpuVector&&("owned"===this._bufferOwnership&&u.R.recycle(d(this._gpuVector)),this._gpuVector=void 0),this._targetBuffer=void 0,this._destroyed=!0}}function h(t){if(t instanceof c)return t;if("number"==typeof t||Array.isArray(t))return c.fromConstant(t);if(t instanceof o.L)return c.fromGPUData(t);if(t instanceof s.I)return c.fromGPUDataView(t);throw Error("getGPUDataEvaluator() requires GPUDataEvaluator, GPUData, GPUDataView, number, or number[]")}function f(t){let e=(0,l.Ft)(t.format),i=(0,r.Y0)(e.signedDataType),n=i.BYTES_PER_ELEMENT*e.components;if(e.byteLength!==n)throw Error(`GPUDataEvaluator does not support packed vertex format ${t.format}: ${e.byteLength} physical bytes cannot expose ${e.components} ${e.signedDataType} components`);if(t.byteOffset%i.BYTES_PER_ELEMENT!=0||t.byteStride%i.BYTES_PER_ELEMENT!=0)throw Error(`GPUDataEvaluator requires ${t.format} offset and stride aligned to ${i.BYTES_PER_ELEMENT} bytes`);return{type:e.signedDataType,size:e.components,offset:t.byteOffset,stride:t.byteStride,normalized:e.normalized,length:t.length,format:t.format}}function d(t){let e=function(t){let[e,...i]=t.data;if(!e||i.length>0)throw Error(`GPUDataEvaluator requires exactly one GPUData chunk for "${t.name}"`);return e}(t).buffer;return e instanceof n.kL?e.buffer:e}function p(t,e,i=!1){if(e<1||e>4)throw Error(`Cannot synthesize a GPUVector vertex format with ${e} components`);let r=t;if(i)switch(t){case"uint8":r="unorm8";break;case"sint8":r="snorm8";break;case"uint16":r="unorm16";break;case"sint16":r="snorm16";break;case"float32":r="float32";break;default:throw Error(`Unsupported normalized vertex format for ${t}`)}return("uint8"===r||"sint8"===r||"uint16"===r||"sint16"===r||"unorm8"===r||"snorm8"===r||"unorm16"===r||"snorm16"===r)&&3===e?`${r}x3-webgl`:`${r}${1===e?"":`x${e}`}`}},78705(t,e,i){"use strict";i.d(e,{E:()=>r});let r={add:{arity:2,symbol:"arithmetic_add"},subtract:{arity:2,symbol:"arithmetic_subtract"},multiply:{arity:2,symbol:"arithmetic_multiply"},divide:{arity:2,symbol:"arithmetic_divide"},pow:{arity:2,symbol:"pow"},sqrt:{arity:1,symbol:"sqrt"},abs:{arity:1,symbol:"abs"},sin:{arity:1,symbol:"sin"},cos:{arity:1,symbol:"cos"},tan:{arity:1,symbol:"arithmetic_tan"},exp:{arity:1,symbol:"exp"},log:{arity:1,symbol:"log"}}},70049(t,e,i){"use strict";function r(t,e){var i;let r=Number.isFinite(i=e)&&i>0?Math.floor(i):65535,n=Math.max(1,Math.ceil(t)),s=Math.min(n,r),a=Math.min(Math.ceil(n/s),r),o=Math.ceil(n/s/a);if(o>r)throw Error(`WebGPU dispatch requires ${n} workgroups, exceeding the 3D dispatch limit of ${r} per dimension`);return{x:s,y:a,z:o}}function n(t,e="workgroupId"){return`((${e}.z * ${t.y}u + ${e}.y) * ${t.x}u + ${e}.x)`}function s(t,e,i="workgroupId",r="localId"){return`(${n(t,i)} * ${e}u + ${r}.x)`}i.d(e,{B:()=>n,BB:()=>r,vL:()=>s})},27611(t,e,i){"use strict";function r(t,e){switch(t){case"u32":return`${e}u`;case"f32":return Number.isInteger(e)?`${e}.0`:`${e}`;default:return`${e}`}}function n(t,e){switch(t){case"uint32":return r("u32",Math.trunc(e));case"sint32":return`${Math.trunc(e)}`;case"float32":return r("f32",e);default:throw Error(`WebGPU operations only support 32-bit output types, got ${t}`)}}function s(t){switch(t){case"uint32":return"0u";case"sint32":return"0";case"float32":return"0.0";default:throw Error(`WebGPU operations only support 32-bit output types, got ${t}`)}}function a(t){switch(t){case"uint32":return"u32";case"sint32":return"i32";case"float32":return"f32";default:throw Error(`WebGPU operations only support 32-bit storage types, got ${t}`)}}i.d(e,{C1:()=>n,Lm:()=>r,_1:()=>s,iP:()=>a})},26266(t,e,i){"use strict";i.d(e,{P:()=>l});var r=i(30257),n=i(34376),s=i(70049),a=i(27611);let o=new n.Ry;function l({module:t,elementWise:e=!1,expression:i,inputs:n,output:u,operationType:c=u.type,outputBuffer:h}){var f,d,p,g;let m,_,b,v;if(!t.source)throw Error(`WebGPU computation ${t.name} requires WGSL source`);let y=Array.isArray(f=n)?f.map((t,e)=>[`x${e}`,t]):Object.entries(f),E=y.map(([t,e])=>({name:t,input:e})),M=E.filter(({input:t})=>!t.isConstant).map((t,e)=>({...t,index:e})),w=(0,a.iP)(c),x=(0,a.iP)(u.type),P={TYPE:w,RESULT_LEN:u.size.toString()},A=(0,s.BB)(Math.ceil(u.length/64),h.device.limits.maxComputeWorkgroupsPerDimension);for(let[t,e]of y)P[`${t.toUpperCase()}_LEN`]=e.size.toString();let S=`
${function(t,e){for(let i in e)t=t.replaceAll(`{${i}}`,e[i]);return t}(t.source,P)}
${M.map(({name:t,input:e,index:i})=>(function(t,e,i){if(e.isConstant)return"";let r=(0,a.iP)(e.type);return`@group(0) @binding(${i}) var<storage, read> ${t}: array<${r}>;`})(t,e,i)).join("\n")}
${E.map(({name:t,input:e})=>{var i,r,n;let s,o,l,u;return i=t,r=e,n=c,s=(0,a.iP)(n),o=r.type===n?"":s,l=r.stride/r.ValueType.BYTES_PER_ELEMENT,u=r.offset/r.ValueType.BYTES_PER_ELEMENT,r.isConstant?`fn read_${i}(_rowIndex: u32) -> array<${s}, ${r.size}> {
  return array<${s}, ${r.size}>(${function(t,e){let i=t.value;if(!i)throw Error(`Constant input ${t} is missing CPU values`);return Array.from({length:t.size},(t,r)=>(0,a.Lm)(e,i[r]??0)).join(", ")}(r,o)});
}`:`fn read_${i}(rowIndex: u32) -> array<${s}, ${r.size}> {
  var value: array<${s}, ${r.size}>;
  let rowOffset = ${u}u + rowIndex * ${l}u;
${Array.from({length:r.size},(t,e)=>o?`  value[${e}] = ${o}(${i}[rowOffset + ${e}u]);`:`  value[${e}] = ${i}[rowOffset + ${e}u];`).join("\n")}
  return value;
}`}).join("\n")}
${(d=u,p=M.length,m=(0,a.iP)(d.type),`@group(0) @binding(${p}) var<storage, read_write> result: array<${m}>;`)}
${(_=(g=u).stride/g.ValueType.BYTES_PER_ELEMENT,b=g.offset/g.ValueType.BYTES_PER_ELEMENT,v=(0,a.iP)(g.type),`fn write_result(rowIndex: u32, value: array<${v}, ${g.size}>) {
  let rowOffset = ${b}u + rowIndex * ${_}u;
${Array.from({length:g.size},(t,e)=>`  result[rowOffset + ${e}u] = value[${e}];`).join("\n")}
}`)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${(0,s.vL)(A,64)};
  if (rowIndex >= ${u.length}u) {
    return;
  }

${E.map(({name:t})=>`  let ${t} = read_${t}(rowIndex);`).join("\n")}
  var result: array<${x}, ${u.size}>;
${function(t,e,i,r,n){let s="";if(n)for(let t=0;t<i.size;t++)s+=`  result[${t}] = ${n(t)};
`;else if(r){let r=(0,a._1)(i.type),n=(0,a.iP)(i.type);for(let o=0;o<i.size;o++){let i=e.map(([t,e])=>o<e.size?(0,a.iP)(e.type)===n?`${t}[${o}]`:`${n}(${t}[${o}])`:r);s+=`  result[${o}] = ${t}(${i.join(", ")});
`}}else s+=`result = ${t}(${e.map(([t])=>t).join(", ")});`;return s.trimEnd()}(t.name,y,u,e,i)}
  write_result(rowIndex, result);
}
`,O=new r.C(h.device,{source:S,modules:t.dependencies,shaderAssembler:o,shaderLayout:{bindings:[...M.map(({name:t},e)=>({name:t,type:"storage",group:0,location:e})),{name:"result",type:"storage",group:0,location:M.length}]}}),T=Object.fromEntries(M.map(({name:t,input:e})=>[t,e.buffer]));T.result=h,O.setBindings(T);let I=h.device.beginComputePass({});h.device.statsManager.getStats("GPGPU Operation Counts").get("Computation Runs").incrementCount(),O.dispatch(I,A.x,A.y,A.z),I.end(),h.device.submit(),O.destroy()}},10924(t,e,i){"use strict";i.d(e,{C:()=>n});var r=i(26266);let n=({inputs:t,output:e,target:i})=>{let n=t.map((t,e)=>[`x${e}`,t]);var s=i.device.limits,a=n;let o=a.filter(([,t])=>!t.isConstant).length+1;if(o>s.maxStorageBuffersPerShaderStage)throw Error(`interleave() requires ${o} storage buffers, exceeding device limit ${s.maxStorageBuffersPerShaderStage}`);if(o>s.maxBindingsPerBindGroup)throw Error(`interleave() requires ${o} bindings, exceeding bind group limit ${s.maxBindingsPerBindGroup}`);let l=n.map(([t,e])=>`${t}: array<{TYPE}, ${e.size}>`).join(", "),u=0,c=n.map(([t,e])=>{let i=Array.from({length:e.size},(e,i)=>`  out[${u+i}] = ${t}[${i}];`).join("\n");return u+=e.size,i}).join("\n"),h=`\
fn interleave(${l}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${c}
  return out;
}
`;return(0,r.P)({module:{name:"interleave",source:h},inputs:t,output:e,outputBuffer:i}),{success:!0}}},65020(t,e,i){"use strict";i.d(e,{R:()=>n});var r=i(26839);let n=new class{poolSize=20;bufferPools;constructor(){this.bufferPools=new Map}createOrReuse(t,e){if(e>t.limits.maxBufferSize)throw Error(`Buffer pool cannot allocate ${e} bytes: device.limits.maxBufferSize is ${t.limits.maxBufferSize}`);let i=this.bufferPools.get(t),n=i?i.findIndex(t=>t.byteLength>=e):-1;if(n<0)return t.createBuffer({usage:r.h.VERTEX|r.h.STORAGE|r.h.COPY_DST|r.h.COPY_SRC,byteLength:e});let[s]=i.splice(n,1);return s}recycle(t){let e=t.device;this.bufferPools.has(e)||this.bufferPools.set(e,[]);let i=this.bufferPools.get(e),r=i.findIndex(e=>e.byteLength>t.byteLength);r<0?i.push(t):i.splice(r,0,t),this.purge()}purge(){for(let[t,e]of this.bufferPools){let i=t.isLost?0:this.poolSize;for(;e.length>i;)e.shift().destroy();0===e.length&&this.bufferPools.delete(t)}}}},55611(t,e,i){"use strict";function r(t,e=!0){return t??e}function n(t=[0,0,0],e=!0){return e?t.map(t=>t/255):[...t]}function s(t,e=!0){let i=n(t.slice(0,3),e),r=Number.isFinite(t[3]),a=r?t[3]:1;return[i[0],i[1],i[2],e&&r?a/255:a]}i.d(e,{eS:()=>r,jI:()=>s,sC:()=>n})},34938(t,e,i){"use strict";i.d(e,{i:()=>r});let r={name:"fp32",source:`\
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
const FP32_TWO_PI: f32 = 6.2831854820251465;
const FP32_PI_2: f32 = 1.5707963705062866;
const FP32_PI_16: f32 = 0.1963495463132858;

const FP32_SIN_TABLE_0: f32 = 0.19509032368659973;
const FP32_SIN_TABLE_1: f32 = 0.3826834261417389;
const FP32_SIN_TABLE_2: f32 = 0.5555702447891235;
const FP32_SIN_TABLE_3: f32 = 0.7071067690849304;

const FP32_COS_TABLE_0: f32 = 0.9807852506637573;
const FP32_COS_TABLE_1: f32 = 0.9238795042037964;
const FP32_COS_TABLE_2: f32 = 0.8314695954322815;
const FP32_COS_TABLE_3: f32 = 0.7071067690849304;

const FP32_INVERSE_FACTORIAL_3: f32 = 1.666666716337204e-01;
const FP32_INVERSE_FACTORIAL_5: f32 = 8.333333767950535e-03;
const FP32_INVERSE_FACTORIAL_7: f32 = 1.9841270113829523e-04;
const FP32_INVERSE_FACTORIAL_9: f32 = 2.75573188446287533e-06;
const FP32_OVERFLOW: f32 = 3.402823466e+38;

fn sin_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let x = -a * a;
  var sum = a;
  var term = a;

  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_3;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_5;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_7;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_9;

  return sum;
}

fn tan_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let z = floor(a / FP32_TWO_PI);
  let reduced = a - FP32_TWO_PI * z;

  var quadrantValue = floor(reduced / FP32_PI_2 + 0.5);
  let quadrant = i32(quadrantValue);
  if (quadrant < -2 || quadrant > 2) {
    return FP32_OVERFLOW;
  }

  var angle = reduced - FP32_PI_2 * quadrantValue;
  quadrantValue = floor(angle / FP32_PI_16 + 0.5);
  let tableIndex = i32(quadrantValue);
  let absoluteTableIndex = abs(tableIndex);
  if (absoluteTableIndex > 4) {
    return FP32_OVERFLOW;
  }

  angle = angle - FP32_PI_16 * quadrantValue;
  let sinAngle = sin_taylor_fp32(angle);
  let cosAngle = sqrt(1.0 - sinAngle * sinAngle);

  var tableCos = 0.0;
  var tableSin = 0.0;
  if (absoluteTableIndex == 1) {
    tableCos = FP32_COS_TABLE_0;
    tableSin = FP32_SIN_TABLE_0;
  } else if (absoluteTableIndex == 2) {
    tableCos = FP32_COS_TABLE_1;
    tableSin = FP32_SIN_TABLE_1;
  } else if (absoluteTableIndex == 3) {
    tableCos = FP32_COS_TABLE_2;
    tableSin = FP32_SIN_TABLE_2;
  } else if (absoluteTableIndex == 4) {
    tableCos = FP32_COS_TABLE_3;
    tableSin = FP32_SIN_TABLE_3;
  }

  var sinReduced = sinAngle;
  var cosReduced = cosAngle;
  if (tableIndex > 0) {
    sinReduced = tableCos * sinAngle + tableSin * cosAngle;
    cosReduced = tableCos * cosAngle - tableSin * sinAngle;
  } else if (tableIndex < 0) {
    sinReduced = tableCos * sinAngle - tableSin * cosAngle;
    cosReduced = tableCos * cosAngle + tableSin * sinAngle;
  }

  var sinValue = 0.0;
  var cosValue = 0.0;
  if (quadrant == 0) {
    sinValue = sinReduced;
    cosValue = cosReduced;
  } else if (quadrant == 1) {
    sinValue = cosReduced;
    cosValue = -sinReduced;
  } else if (quadrant == -1) {
    sinValue = -cosReduced;
    cosValue = sinReduced;
  } else {
    sinValue = -sinReduced;
    cosValue = -cosReduced;
  }

  return sinValue / cosValue;
}

fn tan_fp32(a: f32) -> f32 {
  return tan_taylor_fp32(a);
}
#else
fn tan_fp32(a: f32) -> f32 {
  return tan(a);
}
#endif
`,vs:`\
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND

// All these functions are for substituting tan() function from Intel GPU only
const float TWO_PI = 6.2831854820251465;
const float PI_2 = 1.5707963705062866;
const float PI_16 = 0.1963495463132858;

const float SIN_TABLE_0 = 0.19509032368659973;
const float SIN_TABLE_1 = 0.3826834261417389;
const float SIN_TABLE_2 = 0.5555702447891235;
const float SIN_TABLE_3 = 0.7071067690849304;

const float COS_TABLE_0 = 0.9807852506637573;
const float COS_TABLE_1 = 0.9238795042037964;
const float COS_TABLE_2 = 0.8314695954322815;
const float COS_TABLE_3 = 0.7071067690849304;

const float INVERSE_FACTORIAL_3 = 1.666666716337204e-01; // 1/3!
const float INVERSE_FACTORIAL_5 = 8.333333767950535e-03; // 1/5!
const float INVERSE_FACTORIAL_7 = 1.9841270113829523e-04; // 1/7!
const float INVERSE_FACTORIAL_9 = 2.75573188446287533e-06; // 1/9!

float sin_taylor_fp32(float a) {
  float r, s, t, x;

  if (a == 0.0) {
    return 0.0;
  }

  x = -a * a;
  s = a;
  r = a;

  r = r * x;
  t = r * INVERSE_FACTORIAL_3;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_5;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_7;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_9;
  s = s + t;

  return s;
}

void sincos_taylor_fp32(float a, out float sin_t, out float cos_t) {
  if (a == 0.0) {
    sin_t = 0.0;
    cos_t = 1.0;
  }
  sin_t = sin_taylor_fp32(a);
  cos_t = sqrt(1.0 - sin_t * sin_t);
}

float tan_taylor_fp32(float a) {
    float sin_a;
    float cos_a;

    if (a == 0.0) {
        return 0.0;
    }

    // 2pi range reduction
    float z = floor(a / TWO_PI);
    float r = a - TWO_PI * z;

    float t;
    float q = floor(r / PI_2 + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return 1.0 / 0.0;
    }

    t = r - PI_2 * q;

    q = floor(t / PI_16 + 0.5);
    int k = int(q);
    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return 1.0 / 0.0;
    } else {
        t = t - PI_16 * q;
    }

    float u = 0.0;
    float v = 0.0;

    float sin_t, cos_t;
    float s, c;
    sincos_taylor_fp32(t, sin_t, cos_t);

    if (k == 0) {
        s = sin_t;
        c = cos_t;
    } else {
        if (abs(float(abs_k) - 1.0) < 0.5) {
            u = COS_TABLE_0;
            v = SIN_TABLE_0;
        } else if (abs(float(abs_k) - 2.0) < 0.5) {
            u = COS_TABLE_1;
            v = SIN_TABLE_1;
        } else if (abs(float(abs_k) - 3.0) < 0.5) {
            u = COS_TABLE_2;
            v = SIN_TABLE_2;
        } else if (abs(float(abs_k) - 4.0) < 0.5) {
            u = COS_TABLE_3;
            v = SIN_TABLE_3;
        }
        if (k > 0) {
            s = u * sin_t + v * cos_t;
            c = u * cos_t - v * sin_t;
        } else {
            s = u * sin_t - v * cos_t;
            c = u * cos_t + v * sin_t;
        }
    }

    if (j == 0) {
        sin_a = s;
        cos_a = c;
    } else if (j == 1) {
        sin_a = c;
        cos_a = -s;
    } else if (j == -1) {
        sin_a = -c;
        cos_a = s;
    } else {
        sin_a = -s;
        cos_a = -c;
    }
    return sin_a / cos_a;
}
#endif

float tan_fp32(float a) {
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
  return tan_taylor_fp32(a);
#else
  return tan(a);
#endif
}
`}},26369(t,e,i){"use strict";function r(t,e){if(!t)throw Error(e||"@math.gl/web-mercator: assertion failed.")}i.d(e,{v:()=>r})},70177(t,e,i){"use strict";i.d(e,{$M:()=>n,Cc:()=>a,_U:()=>s,p6:()=>l,qE:()=>o});var r=i(39426);function n(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function s(t,e){let i=r.Z0([],e,t);return r.hs(i,i,1/i[3]),i}function a(t,e,i){return i*e+(1-i)*t}function o(t,e,i){return t<e?e:t>i?i:t}let l=Math.log2||function(t){return Math.log(t)*Math.LOG2E}},88967(t,e,i){"use strict";i.d(e,{Gw:()=>g,J9:()=>p,Os:()=>w,VJ:()=>P,XM:()=>d,aH:()=>f,dT:()=>y,fO:()=>_,iV:()=>m,mY:()=>b,nI:()=>v,om:()=>M,rY:()=>E,wZ:()=>x,xJ:()=>A});var r=i(70177),n=i(90218),s=i(83588),a=i(82859),o=i(26369);let l=Math.PI,u=l/4,c=l/180,h=180/l,f=85.051129;function d(t){return Math.pow(2,t)}function p(t){return(0,r.p6)(t)}function g(t){let[e,i]=t;(0,o.v)(Number.isFinite(e)),(0,o.v)(Number.isFinite(i)&&i>=-90&&i<=90,"invalid latitude");let r=512*(l+Math.log(Math.tan(u+i*c*.5)))/(2*l);return[512*(e*c+l)/(2*l),r]}function m(t){let[e,i]=t,r=2*(Math.atan(Math.exp(i/512*(2*l)-l))-u);return[(e/512*(2*l)-l)*h,r*h]}function _(t){let{latitude:e}=t;return(0,o.v)(Number.isFinite(e)),p(4003e4*Math.cos(e*c))-9}function b(t){return 512/4003e4/Math.cos(t*c)}function v(t){let{latitude:e,longitude:i,highPrecision:r=!1}=t;(0,o.v)(Number.isFinite(e)&&Number.isFinite(i));let n=Math.cos(e*c),s=512/360/n,a=512/4003e4/n,l={unitsPerMeter:[a,a,a],metersPerUnit:[1/a,1/a,1/a],unitsPerDegree:[512/360,s,a],degreesPerUnit:[1/(512/360),1/s,1/a]};if(r){let t=c*Math.tan(e*c)/n,i=512/4003e4*t,r=i/s*a;l.unitsPerDegree2=[0,512/360*t/2,i],l.unitsPerMeter2=[r,0,r]}return l}function y(t,e){let[i,r,n]=t,[s,a,o]=e,{unitsPerMeter:l,unitsPerMeter2:u}=v({longitude:i,latitude:r,highPrecision:!0}),c=g(t);c[0]+=s*(l[0]+u[0]*a),c[1]+=a*(l[1]+u[1]*a);let h=m(c);return Number.isFinite(n)||Number.isFinite(o)?[h[0],h[1],(n||0)+(o||0)]:h}function E(t){let{height:e,pitch:i,bearing:s,altitude:o,scale:l,center:u}=t,h=(0,r.$M)();n.Tl(h,h,[0,0,-o]),n.eL(h,h,-i*c),n.Qr(h,h,s*c);let f=l/e;return n.hs(h,h,[f,f,f]),u&&n.Tl(h,h,a.ze([],u)),h}function M(t){let{width:e,height:i,altitude:n,pitch:s=0,offset:a,center:o,scale:l,nearZMultiplier:u=1,farZMultiplier:h=1}=t,{fovy:f=w(1.5)}=t;void 0!==n&&(f=w(n));let d=f*c,p=s*c,g=x(f),m=g;o&&(m+=o[2]*l/Math.cos(p)/i);let _=d*(.5+(a?a[1]:0)/i),b=Math.sin(_)*m/Math.sin((0,r.qE)(Math.PI/2-p-_,.01,Math.PI-.01));return{fov:d,aspect:e/i,focalDistance:g,near:u,far:Math.min((Math.sin(p)*b+m)*h,10*m)}}function w(t){return 2*Math.atan(.5/t)*h}function x(t){return .5/Math.tan(.5*t*c)}function P(t,e){let[i,n,s=0]=t;return(0,o.v)(Number.isFinite(i)&&Number.isFinite(n)&&Number.isFinite(s)),(0,r._U)(e,[i,n,s,1])}function A(t,e,i=0){let[n,a,l]=t;if((0,o.v)(Number.isFinite(n)&&Number.isFinite(a),"invalid pixel coordinate"),Number.isFinite(l))return(0,r._U)(e,[n,a,l,1]);let u=(0,r._U)(e,[n,a,0,1]),c=(0,r._U)(e,[n,a,1,1]),h=u[2],f=c[2];return s.Cc([],u,c,h===f?0:((i||0)-h)/(f-h))}},92767(t,e,i){"use strict";var r,n,s,a,o,l;i.d(e,{Cx:()=>k,uq:()=>U,Cp:()=>N,EU:()=>tr,h1:()=>D}),(a=r||(r={}))[a.Start=1]="Start",a[a.Move=2]="Move",a[a.End=4]="End",a[a.Cancel=8]="Cancel",(o=n||(n={}))[o.None=0]="None",o[o.Left=1]="Left",o[o.Right=2]="Right",o[o.Up=4]="Up",o[o.Down=8]="Down",o[o.Horizontal=3]="Horizontal",o[o.Vertical=12]="Vertical",o[o.All=15]="All",(l=s||(s={}))[l.Possible=1]="Possible",l[l.Began=2]="Began",l[l.Changed=4]="Changed",l[l.Ended=8]="Ended",l[l.Recognized=8]="Recognized",l[l.Cancelled=16]="Cancelled",l[l.Failed=32]="Failed";let u="manipulation";class c{constructor(t,e){this.actions="",this.manager=t,this.set(e)}set(t){"compute"===t&&(t=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=t,this.actions=t)}update(){this.set(this.manager.options.touchAction)}compute(){let t=[];for(let e of this.manager.recognizers)e.options.enable&&(t=t.concat(e.getTouchAction()));var e=t.join(" ");if(e.includes("none"))return"none";let i=e.includes("pan-x"),r=e.includes("pan-y");return i&&r?"none":i||r?i?"pan-x":"pan-y":e.includes(u)?u:"auto"}}function h(t){return t.trim().split(/\s+/g)}function f(t,e,i){if(t)for(let r of h(e))t.addEventListener(r,i,!1)}function d(t,e,i){if(t)for(let r of h(e))t.removeEventListener(r,i,!1)}function p(t){return(t.ownerDocument||t).defaultView}function g(t){let e=t.length;if(1===e)return{x:Math.round(t[0].clientX),y:Math.round(t[0].clientY)};let i=0,r=0,n=0;for(;n<e;)i+=t[n].clientX,r+=t[n].clientY,n++;return{x:Math.round(i/e),y:Math.round(r/e)}}function m(t){let e=[],i=0;for(;i<t.pointers.length;)e[i]={clientX:Math.round(t.pointers[i].clientX),clientY:Math.round(t.pointers[i].clientY)},i++;return{timeStamp:Date.now(),pointers:e,center:g(e),deltaX:t.deltaX,deltaY:t.deltaY}}function _(t,e){let i=e.x-t.x,r=e.y-t.y;return Math.sqrt(i*i+r*r)}function b(t,e){let i=e.clientX-t.clientX,r=e.clientY-t.clientY;return Math.sqrt(i*i+r*r)}function v(t,e){let i=e.clientX-t.clientX;return 180*Math.atan2(e.clientY-t.clientY,i)/Math.PI}function y(t,e){return t===e?n.None:Math.abs(t)>=Math.abs(e)?t<0?n.Left:n.Right:e<0?n.Up:n.Down}function E(t,e,i){return{x:e/t||0,y:i/t||0}}function M(t,e){return"pointerId"in t?t.pointerId:e}function w(t,e){t.movementOrigin=new Map(e.map((t,e)=>[M(t,e),{clientX:t.clientX,clientY:t.clientY}])),t.firstMovementTime=void 0}class x{constructor(t){this.evEl="",this.evWin="",this.evTarget="",this.domHandler=t=>{this.manager.options.enable&&this.handler(t)},this.manager=t,this.element=t.element,this.target=t.options.inputTarget||t.element}callback(t,e){var i;let n,s,a,o,l;i=this.manager,n=e.pointers.length,s=e.changedPointers.length,a=t&r.Start&&n-s==0,o=t&(r.End|r.Cancel)&&n-s==0,e.isFirst=!!a,e.isFinal=!!o,a&&(i.session={}),e.eventType=t,l=function(t,e){var i,n;let s,a,o,l,u,{session:c}=t,{pointers:h}=e,{length:f}=h;c.firstInput||(c.firstInput=m(e)),f>1&&!c.firstMultiple?c.firstMultiple=m(e):1===f&&(c.firstMultiple=!1);let{firstInput:d,firstMultiple:p}=c,x=p?p.center:d.center,P=e.center=g(h);e.timeStamp=Date.now(),e.deltaTime=e.timeStamp-d.timeStamp;let A=e.pointers.map(M);if(c.movementOrigin?.size===A.length&&A.every(t=>c.movementOrigin.has(t))||w(c,e.pointers),e.distancePerPointer=e.pointers.map((t,e)=>b(c.movementOrigin.get(A[e]),t)),e.eventType&r.Move&&e.distancePerPointer.some(t=>t>0)&&(c.firstMovementTime??(c.firstMovementTime=e.timeStamp)),e.movementDeltaTime=void 0===c.firstMovementTime?0:e.timeStamp-c.firstMovementTime,e.eventType&(r.End|r.Cancel)){let t=e.changedPointers.map(t=>M(t,e.pointers.indexOf(t)));w(c,e.pointers.filter((e,i)=>!t.includes(A[i])))}s=P.x-x.x,e.angle=180*Math.atan2(P.y-x.y,s)/Math.PI,e.distance=_(x,P);let{deltaX:S,deltaY:O}=(a=e.center,o=c.offsetDelta,l=c.prevDelta,u=c.prevInput,(e.eventType===r.Start||u?.eventType===r.End)&&(l=c.prevDelta={x:u?.deltaX||0,y:u?.deltaY||0},o=c.offsetDelta={x:a.x,y:a.y}),{deltaX:l.x+(a.x-o.x),deltaY:l.y+(a.y-o.y)});e.deltaX=S,e.deltaY=O,e.offsetDirection=y(e.deltaX,e.deltaY);let T=E(e.deltaTime,e.deltaX,e.deltaY);e.overallVelocityX=T.x,e.overallVelocityY=T.y,e.overallVelocity=Math.abs(T.x)>Math.abs(T.y)?T.x:T.y,e.scale=p?(i=p.pointers,b(h[0],h[1])/b(i[0],i[1])):1,e.rotation=p?(n=p.pointers,v(h[1],h[0])-v(n[1],n[0])):0,e.maxPointers=c.prevInput?e.pointers.length>c.prevInput.maxPointers?e.pointers.length:c.prevInput.maxPointers:e.pointers.length;let I=t.element;return function(t,e){let i=t;for(;i;){if(i===e)return!0;i=i.parentNode}return!1}(e.srcEvent.target,I)&&(I=e.srcEvent.target),e.target=I,!function(t,e){let i,n,s,a,o=t.lastInterval||e,l=e.timeStamp-o.timeStamp;if(e.eventType!==r.Cancel&&(l>25||void 0===o.velocity)){let r=e.deltaX-o.deltaX,u=e.deltaY-o.deltaY,c=E(l,r,u);n=c.x,s=c.y,i=Math.abs(c.x)>Math.abs(c.y)?c.x:c.y,a=y(r,u),t.lastInterval=e}else i=o.velocity,n=o.velocityX,s=o.velocityY,a=o.direction;e.velocity=i,e.velocityX=n,e.velocityY=s,e.direction=a}(c,e),e}(i,e),i.emit("hammer.input",l),i.recognize(l),i.session.prevInput=l}init(){f(this.element,this.evEl,this.domHandler),f(this.target,this.evTarget,this.domHandler),f(p(this.element),this.evWin,this.domHandler)}destroy(){d(this.element,this.evEl,this.domHandler),d(this.target,this.evTarget,this.domHandler),d(p(this.element),this.evWin,this.domHandler)}}let P={pointerdown:r.Start,pointermove:r.Move,pointerup:r.End,pointercancel:r.Cancel,pointerout:r.Cancel};class A extends x{constructor(t){super(t),this.evEl="pointerdown",this.evWin="pointermove pointerup pointercancel",this.store=this.manager.session.pointerEvents=[],this.init()}handler(t){let{store:e}=this,i=!1,n=P[t.type],s=t.pointerType,a="touch"===s,o=e.findIndex(e=>e.pointerId===t.pointerId);n&r.Start&&(t.buttons||a)?o<0&&(e.push(t),o=e.length-1):n&(r.End|r.Cancel)&&(i=!0),!(o<0)&&(e[o]=t,this.callback(n,{pointers:e,changedPointers:[t],eventType:n,pointerType:s,srcEvent:t}),i&&e.splice(o,1))}}let S=["","webkit","Moz","MS","ms","o"],O={touchAction:"compute",enable:!0,inputTarget:null,cssProps:{userSelect:"none",userDrag:"none",touchCallout:"none",tapHighlightColor:"rgba(0,0,0,0)"}};class T{constructor(t,e){this.options={...O,...e,cssProps:{...O.cssProps,...e.cssProps},inputTarget:e.inputTarget||t},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=t,this.input=new A(this),this.touchAction=new c(this,this.options.touchAction),this.toggleCssProps(!0)}set(t){return Object.assign(this.options,t),t.touchAction&&this.touchAction.update(),t.inputTarget&&(this.input.destroy(),this.input.target=t.inputTarget,this.input.init()),this}stop(t){this.session.stopped=t?2:1}recognize(t){let e,{session:i}=this;if(i.stopped)return;this.session.prevented&&t.srcEvent.preventDefault();let{recognizers:r}=this,{curRecognizer:n}=i;(!n||n&&n.state&s.Recognized)&&(n=i.curRecognizer=null);let a=0;for(;a<r.length;)e=r[a],2!==i.stopped&&(!n||e===n||e.canRecognizeWith(n))?e.recognize(t):e.reset(),!n&&e.state&(s.Began|s.Changed|s.Ended)&&(n=i.curRecognizer=e),a++}get(t){let{recognizers:e}=this;for(let i=0;i<e.length;i++)if(e[i].options.event===t)return e[i];return null}add(t){if(Array.isArray(t)){for(let e of t)this.add(e);return this}let e=this.get(t.options.event);return e&&this.remove(e),this.recognizers.push(t),t.manager=this,this.touchAction.update(),t}remove(t){if(Array.isArray(t)){for(let e of t)this.remove(e);return this}let e="string"==typeof t?this.get(t):t;if(e){let{recognizers:t}=this,i=t.indexOf(e);-1!==i&&(t.splice(i,1),this.touchAction.update())}return this}on(t,e){if(!t||!e)return;let{handlers:i}=this;for(let r of h(t))i[r]=i[r]||[],i[r].push(e)}off(t,e){if(!t)return;let{handlers:i}=this;for(let r of h(t))e?i[r]&&i[r].splice(i[r].indexOf(e),1):delete i[r]}emit(t,e){let i=this.handlers[t]&&this.handlers[t].slice();if(!i||!i.length)return;e.type=t,e.preventDefault=function(){e.srcEvent.preventDefault()};let r=0;for(;r<i.length;)i[r](e),r++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(t){let{element:e}=this;if(e){for(let[i,r]of Object.entries(this.options.cssProps)){let n=function(t,e){let i=e[0].toUpperCase()+e.slice(1);for(let r of S){let n=r?r+i:e;if(n in t)return n}}(e.style,i);t?(this.oldCssProps[n]=e.style[n],e.style[n]=r):e.style[n]=this.oldCssProps[n]||""}t||(this.oldCssProps={})}}}let I=1;function L(t){return t&s.Cancelled?"cancel":t&s.Ended?"end":t&s.Changed?"move":t&s.Began?"start":""}class B{constructor(t){this.options=t,this.id=I++,this.state=s.Possible,this.simultaneous={},this.requireFail=[]}set(t){return Object.assign(this.options,t),this.manager.touchAction.update(),this}recognizeWith(t){let e;if(Array.isArray(t)){for(let e of t)this.recognizeWith(e);return this}if("string"==typeof t){if(!(e=this.manager.get(t)))throw Error(`Cannot find recognizer ${t}`)}else e=t;let{simultaneous:i}=this;return i[e.id]||(i[e.id]=e,e.recognizeWith(this)),this}dropRecognizeWith(t){let e;if(Array.isArray(t)){for(let e of t)this.dropRecognizeWith(e);return this}return(e="string"==typeof t?this.manager.get(t):t)&&delete this.simultaneous[e.id],this}requireFailure(t){let e;if(Array.isArray(t)){for(let e of t)this.requireFailure(e);return this}if("string"==typeof t){if(!(e=this.manager.get(t)))throw Error(`Cannot find recognizer ${t}`)}else e=t;let{requireFail:i}=this;return -1===i.indexOf(e)&&(i.push(e),e.requireFailure(this)),this}dropRequireFailure(t){let e;if(Array.isArray(t)){for(let e of t)this.dropRequireFailure(e);return this}if(e="string"==typeof t?this.manager.get(t):t){let t=this.requireFail.indexOf(e);t>-1&&this.requireFail.splice(t,1)}return this}hasRequireFailures(){return!!this.requireFail.find(t=>t.options.enable)}canRecognizeWith(t){return!!this.simultaneous[t.id]}emit(t){if(!t)return;let{state:e}=this;e<s.Ended&&this.manager.emit(this.options.event+L(e),t),this.manager.emit(this.options.event,t),t.additionalEvent&&this.manager.emit(t.additionalEvent,t),e>=s.Ended&&this.manager.emit(this.options.event+L(e),t)}tryEmit(t){this.canEmit()?this.emit(t):this.state=s.Failed}canEmit(){let t=0;for(;t<this.requireFail.length;){if(!(this.requireFail[t].state&(s.Failed|s.Possible)))return!1;t++}return!0}recognize(t){let e={...t};if(!this.options.enable){this.reset(),this.state=s.Failed;return}this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible),this.state=this.process(e),this.state&(s.Began|s.Changed|s.Ended|s.Cancelled)&&this.tryEmit(e)}getEventNames(){return[this.options.event]}reset(){}}class C extends B{attrTest(t){let e=this.options.pointers;return 0===e||t.pointers.length===e}coherentTest(t){let e=this.options.coherent;return!e?.length||e.some(e=>{var i,r;return i=t,(void 0===(r=e).distance||i.distance>=r.distance)&&(void 0===r.distancePerPointer||i.distancePerPointer.length>0&&i.distancePerPointer.every(t=>t>=r.distancePerPointer))&&(void 0===r.movementDeltaTime||i.movementDeltaTime>=r.movementDeltaTime)&&(void 0===r.rotation||Math.abs(((i.rotation+180)%360+360)%360-180)>=r.rotation)&&(void 0===r.scale||Math.abs(i.scale-1)>=r.scale)})}process(t){let{state:e}=this,{eventType:i}=t,n=e&(s.Began|s.Changed),a=this.attrTest(t);return n&&(i&r.Cancel||!a)?e|s.Cancelled:n||a?i&r.End?e|s.Ended:e&s.Began?e|s.Changed:s.Began:s.Failed}}let R=["","start","move","end","cancel"];class N extends B{constructor(t={}){super({enable:!0,event:"doubleclickdrag",pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...t}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[u]}getEventNames(){return R.map(t=>this.options.event+t)}process(t){let{options:e}=this;return t.pointers.length!==e.pointers?(this.reset(),s.Failed):t.eventType&r.Start?this._handleStart(t):t.eventType&r.Move?this._handleMove(t):t.eventType&r.Cancel?this._handleEnd(t,!0):t.eventType&r.End?this._handleEnd(t,!1):s.Failed}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(t){if(t){if(this.state===s.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,t),this.manager.emit(this.options.event,t);return}if(this.state===s.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,t),this.manager.emit(this.options.event,t);return}if(this.state===s.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,t),this.manager.emit(`${this.options.event}end`,t),this._emittedStart=!1;return}if(this.state===s.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,t),this.manager.emit(`${this.options.event}cancel`,t),this._emittedStart=!1}}}_handleStart(t){let e=this._getPointerId(t);return this._lastTap&&this._isTapMatch(t,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:t.center,pointerId:e,active:!1},this._emittedStart=!1,s.Began):(this._tapStart={center:t.center,timeStamp:t.timeStamp,pointerId:e},this._lastTap=null,this._drag=null,this._emittedStart=!1,s.Failed)}_handleMove(t){if(!this._drag||!this._isSamePointer(t,this._drag.pointerId))return s.Failed;let e=this._drag.startCenter.y-t.center.y;return!this._drag.active&&Math.abs(e)<this.options.dragThreshold?s.Began:(this._drag.active=!0,t.scale=Math.pow(2,e/this.options.pixelsPerScale),this._emittedStart?s.Changed:s.Began)}_handleEnd(t,e){if(this._drag&&this._isSamePointer(t,this._drag.pointerId)){let{active:i,startCenter:r}=this._drag;if(this._drag=null,this._tapStart=null,this._lastTap=null,!i)return this._emittedStart=!1,s.Failed;let n=r.y-t.center.y;return t.scale=Math.pow(2,n/this.options.pixelsPerScale),e?s.Cancelled:s.Ended}return this._tapStart&&this._isSamePointer(t,this._tapStart.pointerId)?(this._isValidTap(t)?this._lastTap={center:t.center,timeStamp:t.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null):e&&this.reset(),s.Failed}_isTapMatch(t,e){return t.timeStamp-e.timeStamp<=this.options.interval&&_(t.center,e.center)<=this.options.threshold}_isValidTap(t){return t.deltaTime<=this.options.time&&t.distance<=this.options.threshold}_getPointerId(t){return"pointerId"in t.srcEvent?t.srcEvent.pointerId:null}_isSamePointer(t,e){return null===e||this._getPointerId(t)===e}}class k extends B{constructor(t={}){super({enable:!0,event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...t}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[u]}process(t){let{options:e}=this,i=t.pointers.length===e.pointers,n=t.distance<e.threshold,a=t.deltaTime<e.time;if(this.reset(),t.eventType&r.Start&&0===this.count)return this.failTimeout();if(n&&a&&i){if(t.eventType!==r.End)return this.failTimeout();let i=!this.pTime||t.timeStamp-this.pTime<e.interval,n=!this.pCenter||_(this.pCenter,t.center)<e.posThreshold;if(this.pTime=t.timeStamp,this.pCenter=t.center,n&&i?this.count+=1:this.count=1,this._input=t,0==this.count%e.taps)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=s.Recognized,this.tryEmit(this._input)},e.interval),s.Began):s.Recognized}return s.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=s.Failed},this.options.interval),s.Failed}reset(){clearTimeout(this._timer)}emit(t){this.state===s.Recognized&&(t.tapCount=this.count,this.manager.emit(this.options.event,t))}}class z extends C{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=t=>{"trackpad"===t.device&&this.handleTrackpadEvent(t)}}set(t){let{wheelSession:e,...i}=t;return e&&e!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=e),super.set(i),this.updateWheelSessionSubscription(),this}getTrackpadInput(t,e={}){let{srcEvent:i}=t,r=e.deltaX??t.deltaX,n=e.deltaY??t.deltaY,s=y(r,n),a=Math.sqrt(t.deltaX*t.deltaX+t.deltaY*t.deltaY);return{pointers:[i,i],changedPointers:[i,i],pointerType:"trackpad",srcEvent:i,eventType:t.eventType,timeStamp:t.timeStamp,deltaTime:t.deltaTime,center:t.center,deltaX:r,deltaY:n,angle:180*Math.atan2(n,r)/Math.PI,distance:Math.sqrt(r*r+n*n),distancePerPointer:[a,a],movementDeltaTime:t.deltaTime,scale:1,rotation:0,direction:s,offsetDirection:s,velocity:t.velocity,velocityX:t.velocityX,velocityY:t.velocityY,overallVelocity:t.overallVelocity,overallVelocityX:t.overallVelocityX,overallVelocityY:t.overallVelocityY,maxPointers:2,target:i.target||this.manager.element,additionalEvent:"",...e}}updateWheelSessionSubscription(){let t=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&2===this.options.pointers);t&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!t&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}}let j=["","start","move","end","cancel","up","down","left","right"];class U extends z{constructor(t={}){super({enable:!0,pointers:1,event:"pan",threshold:10,direction:n.All,trackpad:!1,coherent:[],...t}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:t}}=this,e=[];return t&n.Horizontal&&e.push("pan-y"),t&n.Vertical&&e.push("pan-x"),e}getEventNames(){return j.map(t=>this.options.event+t)}directionTest(t){let{options:e}=this,i=!0,{distance:r}=t,{direction:s}=t,a=t.deltaX,o=t.deltaY;return s&e.direction||(e.direction&n.Horizontal?(s=0===a?n.None:a<0?n.Left:n.Right,i=a!==this.pX,r=Math.abs(t.deltaX)):(s=0===o?n.None:o<0?n.Up:n.Down,i=o!==this.pY,r=Math.abs(t.deltaY))),t.direction=s,i&&r>e.threshold&&!!(s&e.direction)}attrTest(t){let e=!!(this.state&s.Began),i=!(this.options.coherent?.length&&t.eventType&(r.End|r.Cancel));return super.attrTest(t)&&(e||i&&this.coherentTest(t)&&this.directionTest(t))}emit(t){this.pX=t.deltaX,this.pY=t.deltaY;let e=n[t.direction].toLowerCase();e&&(t.additionalEvent=this.options.event+e),super.emit(t)}handleTrackpadEvent(t){t.isFirst&&(this.trackpadGesture=!t.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(t,{deltaX:-t.deltaX,deltaY:-t.deltaY,velocity:-t.velocity,velocityX:-t.velocityX,velocityY:-t.velocityY,overallVelocity:-t.overallVelocity,overallVelocityX:-t.overallVelocityX,overallVelocityY:-t.overallVelocityY})),t.isFinal&&(this.trackpadGesture=!1))}}let F=["","start","move","end","cancel","in","out"];class D extends z{constructor(t={}){super({enable:!0,event:"pinch",threshold:0,pointers:2,trackpad:!1,coherent:[],...t}),this.trackpadGesture=!1}getTouchAction(){return["none"]}getEventNames(){return F.map(t=>this.options.event+t)}attrTest(t){let e=!!this.options.coherent?.length,i=!!(this.state&s.Began),n=!(e&&t.eventType&(r.End|r.Cancel));return super.attrTest(t)&&(i||n&&(e?this.coherentTest(t):Math.abs(t.scale-1)>this.options.threshold))}emit(t){if(1!==t.scale){let e=t.scale<1?"in":"out";t.additionalEvent=this.options.event+e}super.emit(t)}handleTrackpadEvent(t){t.isFirst&&(this.trackpadGesture=t.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(t,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-t.deltaY/100)})),t.isFinal&&(this.trackpadGesture=!1))}}class V{constructor(t,e,i){this.element=t,this.callback=e,this.options=i}listen(t,e){e?this.element.addEventListener(t,this.handleEvent,{passive:!1}):this.element.removeEventListener(t,this.handleEvent)}}let $=-1!==("u">typeof navigator&&navigator.userAgent?navigator.userAgent.toLowerCase():"").indexOf("firefox");class Y extends V{constructor(t,e,i){i.enable=i.enable??!1,super(t,e,i),this.handleEvent=t=>{if(!this.options.enable)return;let e=t.deltaY;globalThis.WheelEvent&&($&&t.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(e/=globalThis.devicePixelRatio),t.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(e*=40)),t.shiftKey&&e&&(e*=.25),this.callback({type:"wheel",center:{x:t.clientX,y:t.clientY},delta:-e,device:this.options.wheelSession?.device??"unknown",srcEvent:t,pointerType:"mouse",target:t.target})},i.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen("wheel",!0))}destroy(){this.listen("wheel",!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(t,e){"wheel"===t&&this.options.enable!==e&&(this.options.enable=e,e&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen("wheel",e),e||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}}let q={classificationDelay:32,endDelay:80};class G{constructor(t,e={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=t=>{var e,i;let r,n;if(!this.hasSubscribers)return"unknown";let s=(e=t,i=this.pressedControlKeys.size>0,r=e.deltaX,n=e.deltaY,1===e.deltaMode&&(r*=40,n*=40),{event:e,timeStamp:e.timeStamp,deltaX:r,deltaY:n,isControlKeyDown:i}),a=this.session;if(a&&s.timeStamp-a.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return"unknown";a=null}a?(this.scheduleEnd(),this.addSample(a,s)):(a=this.startPendingSession(s),this.scheduleEnd());let{device:o}=a;return"unknown"===o&&"unknown"!==(o=W(a.samples,!1))&&this.begin(a,o),o},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||"unknown"!==this.session.device)return;let t=this.session,e=W(t.samples,!0);this.begin(t,"unknown"===e?"mouse":e)},this.end=()=>{if(!this.session)return;if("unknown"===this.session.device){let t=this.session,e=W(t.samples,!0);this.begin(t,"unknown"===e?"mouse":e)}if(!this.session)return;let t=this.session;this.emit(r.End,t.lastEvent),this.reset()},this.handleKeyDown=t=>{"Control"===t.key&&this.pressedControlKeys.add(t.code||t.key)},this.handleKeyUp=t=>{"Control"===t.key&&(t.code?this.pressedControlKeys.delete(t.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=t,this.options={...q,...e},this.element?.addEventListener("wheel",this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??"unknown"}on(t){let e={listener:t};return this.subscriptions.set(t,e),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(t)===e&&this.off(t)}}off(t){this.subscriptions.delete(t),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let t=this.session;t&&"unknown"!==t.device&&this.emit(r.Cancel,t.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener("wheel",this.handleEvent)}startPendingSession(t){let e={samples:[t],device:"unknown",firstTimeStamp:t.timeStamp,lastTimeStamp:t.timeStamp,totalDeltaX:t.deltaX,totalDeltaY:t.deltaY,velocityX:0,velocityY:0,lastEvent:t.event};return this.session=e,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),e}addSample(t,e){if(t.samples.push(e),t.lastTimeStamp=e.timeStamp,t.lastEvent=e.event,t.totalDeltaX+=e.deltaX,t.totalDeltaY+=e.deltaY,"unknown"!==t.device){let i=t.samples[t.samples.length-2],n=e.timeStamp-i.timeStamp;t.velocityX=n>0?e.deltaX/n:0,t.velocityY=n>0?e.deltaY/n:0,this.emit(r.Move,e.event,{velocityX:t.velocityX,velocityY:t.velocityY})}}begin(t,e){t.device=e,this.clearClassificationTimer(),this.emit(r.Start,t.samples[0].event);let i=t.lastTimeStamp-t.firstTimeStamp;t.velocityX=i>0?t.totalDeltaX/i:0,t.velocityY=i>0?t.totalDeltaY/i:0,this.emit(r.Move,t.lastEvent,{velocityX:t.velocityX,velocityY:t.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(t,e,i){let n=this.session;if(!n||"unknown"===n.device)return;let s=t===r.Start,a=t===r.End||t===r.Cancel,o=s?n.firstTimeStamp:n.lastTimeStamp,l=s?0:Math.max(0,o-n.firstTimeStamp),u=s?0:n.totalDeltaX,c=s?0:n.totalDeltaY,h=l>0?u/l:0,f=l>0?c/l:0,d=s?0:i?.velocityX??n.velocityX,p=s?0:i?.velocityY??n.velocityY,g={eventType:t,device:n.device,srcEvent:e,timeStamp:o,center:{x:e.clientX,y:e.clientY},deltaX:u,deltaY:c,deltaTime:l,velocity:Math.abs(d)>Math.abs(p)?d:p,velocityX:d,velocityY:p,overallVelocity:Math.abs(h)>Math.abs(f)?h:f,overallVelocityX:h,overallVelocityY:f,isFirst:s,isFinal:a};for(let{listener:t}of[...this.subscriptions.values()])t(g)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){null!==this.classificationTimer&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){null!==this.endTimer&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let t=this.hasSubscribers,e="u">typeof window?window:globalThis.document?.defaultView;e&&t!==this.listeningForControlKeys&&(this.listeningForControlKeys=t,t?(e.addEventListener("keydown",this.handleKeyDown,!0),e.addEventListener("keyup",this.handleKeyUp,!0),e.addEventListener("blur",this.handleWindowBlur)):(e.removeEventListener("keydown",this.handleKeyDown,!0),e.removeEventListener("keyup",this.handleKeyUp,!0),e.removeEventListener("blur",this.handleWindowBlur),this.pressedControlKeys.clear()))}}function W(t,e){return t.some(({event:t,isControlKeyDown:e})=>t.ctrlKey&&!e)?"trackpad":t.some(({event:t})=>0!==t.deltaMode)||t.some(X)||t.every(({event:t})=>{let e=t.wheelDelta;return void 0!==e&&Math.abs(e)%40==0})?"mouse":t.some(({deltaX:t})=>0!==t)||t.length>1&&function(t){for(let e=0;e<t.length;e++){let i=t[e];if(Math.abs(i.deltaX)>40||Math.abs(i.deltaY)>40||e>0&&i.timeStamp-t[e-1].timeStamp>40)return!1}return!0}(t)?"trackpad":e?"mouse":"unknown"}function X({event:t,deltaX:e,deltaY:i}){if(0!==e||0===i)return!1;if(Number.isInteger(Math.abs(i/4.000244140625)))return!0;let r=t.wheelDelta;return"number"==typeof r&&0!==r&&r%120==0}let Z=["mousedown","mousemove","mouseup","mouseover","mouseout","mouseenter","mouseleave"];class H extends V{constructor(t,e,i){super(t,e,{enable:!0,...i}),this.handleEvent=t=>{this.handleOverEvent(t),this.handleOutEvent(t),this.handleEnterEvent(t),this.handleLeaveEvent(t),this.handleMoveEvent(t)},this.pressed=!1;let{enable:r=!1}=this.options;this.enableMoveEvent=r,this.enableLeaveEvent=r,this.enableEnterEvent=r,this.enableOutEvent=r,this.enableOverEvent=r,r&&Z.forEach(t=>this.listen(t,!0))}destroy(){Z.forEach(t=>this.listen(t,!1))}enableEventType(t,e){switch(t){case"pointermove":this.enableMoveEvent!==e&&(this.enableMoveEvent=e,this.listen("mousedown",e),this.listen("mousemove",e),this.listen("mouseup",e));break;case"pointerover":this.enableOverEvent!==e&&(this.enableOverEvent=e,this.listen("mouseover",e));break;case"pointerout":this.enableOutEvent!==e&&(this.enableOutEvent=e,this.listen("mouseout",e));break;case"pointerenter":this.enableEnterEvent!==e&&(this.enableEnterEvent=e,this.listen("mouseenter",e));break;case"pointerleave":this.enableLeaveEvent!==e&&(this.enableLeaveEvent=e,this.listen("mouseleave",e))}}handleOverEvent(t){this.enableOverEvent&&"mouseover"===t.type&&this._emit("pointerover",t)}handleOutEvent(t){this.enableOutEvent&&"mouseout"===t.type&&this._emit("pointerout",t)}handleEnterEvent(t){this.enableEnterEvent&&"mouseenter"===t.type&&this._emit("pointerenter",t)}handleLeaveEvent(t){this.enableLeaveEvent&&"mouseleave"===t.type&&this._emit("pointerleave",t)}handleMoveEvent(t){if(this.enableMoveEvent)switch(t.type){case"mousedown":t.button>=0&&(this.pressed=!0);break;case"mousemove":0===t.buttons&&(this.pressed=!1),this.pressed||this._emit("pointermove",t);break;case"mouseup":this.pressed=!1}}_emit(t,e){this.callback({type:t,center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:"mouse",target:e.target})}}let K=["keydown","keyup"];class J extends V{constructor(t,e,i){super(t,e,{enable:!0,tabIndex:0,...i}),this.handleEvent=t=>{let e=t.target||t.srcElement;("INPUT"!==e.tagName||"text"!==e.type)&&"TEXTAREA"!==e.tagName&&(this.enableDownEvent&&"keydown"===t.type&&this.callback({type:"keydown",srcEvent:t,key:t.key,target:t.target}),this.enableUpEvent&&"keyup"===t.type&&this.callback({type:"keyup",srcEvent:t,key:t.key,target:t.target}))};let{enable:r=!1}=this.options;this.enableDownEvent=r,this.enableUpEvent=r,t.tabIndex=this.options.tabIndex,t.style.outline="none",r&&K.forEach(t=>this.listen(t,!0))}destroy(){K.forEach(t=>this.listen(t,!1))}enableEventType(t,e){"keydown"===t&&this.enableDownEvent!==e&&(this.enableDownEvent=e,this.listen(t,e)),"keyup"===t&&this.enableUpEvent!==e&&(this.enableUpEvent=e,this.listen(t,e))}}class Q extends V{constructor(t,e,i){i.enable=i.enable??!1,super(t,e,i),this.handleEvent=t=>{this.options.enable&&this.callback({type:"contextmenu",center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:"mouse",target:t.target})},i.enable&&this.listen("contextmenu",!0)}destroy(){this.listen("contextmenu",!1)}enableEventType(t,e){"contextmenu"===t&&this.options.enable!==e&&(this.options.enable=e,this.listen("contextmenu",e))}}let tt={pointerdown:1,pointermove:2,pointerup:4,mousedown:1,mousemove:2,mouseup:4},te={srcElement:"root",priority:0};class ti{constructor(t,e){this.handleEvent=t=>{if(this.isEmpty())return;let e=this._normalizeEvent(t),i=t.srcEvent.target;for(;i&&i!==e.rootElement;){if(this._emit(e,i),e.handled)return;i=i.parentNode}this._emit(e,"root")},this.eventManager=t,this.recognizerName=e,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(t,e,i,r=!1,n=!1){let{handlers:s,handlersByElement:a}=this,o={...te,...i},l=a.get(o.srcElement);l||(l=[],a.set(o.srcElement,l));let u={type:t,handler:e,srcElement:o.srcElement,priority:o.priority};r&&(u.once=!0),n&&(u.passive=!0),s.push(u),this._active=this._active||!u.passive;let c=l.length-1;for(;c>=0&&!(l[c].priority>=u.priority);)c--;l.splice(c+1,0,u)}remove(t,e){let{handlers:i,handlersByElement:r}=this;for(let n=i.length-1;n>=0;n--){let s=i[n];if(s.type===t&&s.handler===e){i.splice(n,1);let t=r.get(s.srcElement);t.splice(t.indexOf(s),1),0===t.length&&r.delete(s.srcElement)}}this._active=i.some(t=>!t.passive)}_emit(t,e){let i=this.handlersByElement.get(e);if(i){let e=!1,r=()=>{t.handled=!0},n=()=>{t.handled=!0,e=!0},s=[];for(let a=0;a<i.length;a++){let{type:o,handler:l,once:u}=i[a];if(l({...t,type:o,stopPropagation:r,stopImmediatePropagation:n}),u&&s.push(i[a]),e)break}for(let t=0;t<s.length;t++){let{type:e,handler:i}=s[t];this.remove(e,i)}}}_normalizeEvent(t){let e=this.eventManager.getElement();return{...t,...function(t){let e=tt[t.srcEvent.type];if(!e)return null;let{buttons:i,button:r}=t.srcEvent,n=!1,s=!1,a=!1;return 2===e?(n=!!(1&i),s=!!(4&i),a=!!(2&i)):(n=0===r,s=1===r,a=2===r),{leftButton:n,middleButton:s,rightButton:a}}(t),...function(t,e){let i=t.center;if(!i)return null;let r=e.getBoundingClientRect(),n=r.width/e.offsetWidth||1,s=r.height/e.offsetHeight||1,a={x:(i.x-r.left-e.clientLeft)/n,y:(i.y-r.top-e.clientTop)/s};return{center:i,offsetCenter:a}}(t,e),preventDefault:()=>{t.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:e}}}class tr{constructor(t=null,e={}){if(this._onBasicInput=t=>{this.manager.emit(t.srcEvent.type,t)},this._onOtherEvent=t=>{this.manager.emit(t.type,t)},this.options={recognizers:[],events:{},touchAction:"compute",tabIndex:0,cssProps:{},...e},this.events=new Map,this.element=t,this.wheelSession=new G(t),!t)return;for(let e of(this.manager=new T(t,this.options),this.options.recognizers)){let{recognizer:t,recognizeWith:i,requireFailure:r}=function(t){let e;if("recognizer"in t)return t;let i=Array.isArray(t)?[...t]:[t];return{recognizer:e="function"==typeof i[0]?new(i.shift())(i.shift()||{}):i.shift(),recognizeWith:"string"==typeof i[0]?[i[0]]:i[0],requireFailure:"string"==typeof i[1]?[i[1]]:i[1]}}(e);this.manager.add(t),i&&t.recognizeWith(i),r&&t.requireFailure(r)}this.manager.on("hammer.input",this._onBasicInput),this.wheelInput=new Y(t,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new H(t,this._onOtherEvent,{enable:!1}),this.keyInput=new J(t,this._onOtherEvent,{enable:!1,tabIndex:e.tabIndex}),this.contextmenuInput=new Q(t,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}getElement(){return this.element}destroy(){this.element?(this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()):this.wheelSession.destroy()}on(t,e,i){this._addEventHandler(t,e,i,!1)}once(t,e,i){this._addEventHandler(t,e,i,!0)}watch(t,e,i){this._addEventHandler(t,e,i,!1,!0)}off(t,e){this._removeEventHandler(t,e)}emit(t){this.manager?.emit(t.type,t)}_toggleRecognizer(t,e){let{manager:i}=this;if(!i)return;let r=i.get(t);r&&(r.set({enable:e,wheelSession:this.wheelSession}),i.touchAction.update()),this.wheelInput?.enableEventType(t,e),this.moveInput?.enableEventType(t,e),this.keyInput?.enableEventType(t,e),this.contextmenuInput?.enableEventType(t,e)}_addEventHandler(t,e,i,r,n){if("string"!=typeof t){for(let[s,a]of(i=e,Object.entries(t)))this._addEventHandler(s,a,i,r,n);return}let{manager:s,events:a}=this;if(!s)return;let o=a.get(t);!o&&(o=new ti(this,this._getRecognizerName(t)||t),a.set(t,o),s&&s.on(t,o.handleEvent)),o.add(t,e,i,r,n),o.isEmpty()||this._toggleRecognizer(o.recognizerName,!0)}_removeEventHandler(t,e){if("string"!=typeof t){for(let[e,i]of Object.entries(t))this._removeEventHandler(e,i);return}let{events:i}=this,r=i.get(t);if(r&&(r.remove(t,e),r.isEmpty())){let{recognizerName:t}=r,e=!1;for(let r of i.values())if(r.recognizerName===t&&!r.isEmpty()){e=!0;break}e||this._toggleRecognizer(t,!1)}}_getRecognizerName(t){return this.manager.recognizers.find(e=>e.getEventNames().includes(t))?.options.event}}}}]);