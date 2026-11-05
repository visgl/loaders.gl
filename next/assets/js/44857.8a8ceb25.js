"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["44857"],{63399(e,t,r){let a,i,n;r.d(t,{A:()=>aq});var o={};r.r(o),r.d(o,{createExtMeshFeatures:()=>re,decode:()=>t5,encode:()=>t7,name:()=>t6});var s={};r.r(s),r.d(s,{createExtStructuralMetadata:()=>ro,decode:()=>ra,encode:()=>ri,name:()=>rr});var l={};r.r(l),r.d(l,{decode:()=>rd,name:()=>rm});var c={};r.r(c),r.d(c,{decode:()=>rh,name:()=>rb});var f={};r.r(f),r.d(f,{name:()=>rx,preprocess:()=>r_});var p={};r.r(p),r.d(p,{name:()=>rR,preprocess:()=>rT});var u={};r.r(u),r.d(u,{name:()=>rA,preprocess:()=>rM});var m={};r.r(m),r.d(m,{decode:()=>rJ,encode:()=>r$,name:()=>rq,preprocess:()=>rW});var d={};r.r(d),r.d(d,{decode:()=>r8,name:()=>r3});var b={};r.r(b),r.d(b,{decode:()=>r7,encode:()=>ae,name:()=>r5});var h={};r.r(h),r.d(h,{decode:()=>aa,encode:()=>ai,name:()=>ar});var g={};r.r(g),r.d(g,{decode:()=>as,encode:()=>al,name:()=>ao});var v={};r.r(v),r.d(v,{decode:()=>ap,name:()=>af});var x=r(66260),_=r(84175),S=r(46487),R=r(95335),T=r(3459),y=r(83980),A=r(41481),M=r(4500);function I(e,t){if(!e)throw Error(t)}class C{id;matrix=new A.Matrix4;display=!0;position=new A.Vector3;rotation=new A.Vector3;scale=new A.Vector3(1,1,1);userData={};props={};constructor(e={}){let{id:t}=e;this.id=t||(0,M.L)(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return I(3===e.length,"setPosition requires vector argument"),this.position=e,this}setRotation(e){return I(3===e.length||4===e.length,"setRotation requires vector argument"),this.rotation=e,this}setScale(e){return I(3===e.length,"setScale requires vector argument"),this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){let{position:t,rotation:r,scale:a,update:i=!0}=e;return t&&this.setPosition(t),r&&this.setRotation(r),a&&this.setScale(a),i&&this.updateMatrix(),this}updateMatrix(){if(this.matrix.identity(),this.matrix.translate(this.position),4===this.rotation.length){let e=new A.Matrix4().fromQuaternion(this.rotation);this.matrix.multiplyRight(e)}else this.matrix.rotateXYZ(this.rotation);return this.matrix.scale(this.scale),this}update({position:e,rotation:t,scale:r}={}){return e&&this.setPosition(e),t&&this.setRotation(t),r&&this.setScale(r),this.updateMatrix(),this}getCoordinateUniforms(e,t){t=t||this.matrix;let r=new A.Matrix4(e).multiplyRight(t),a=r.invert(),i=a.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:r,worldInverseMatrix:a,worldInverseTransposeMatrix:i}}_setScenegraphNodeProps(e){void 0!==e.display&&(this.display=e.display),e?.position&&this.setPosition(e.position),e?.rotation&&this.setRotation(e.rotation),e?.scale&&this.setScale(e.scale),this.updateMatrix(),e?.matrix&&this.setMatrix(e.matrix),Object.assign(this.props,e)}}var E=r(29651);function w(){return[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]]}function N(e,t,r){let a=new A.Matrix4(r);for(let r=0;r<8;r++){let i=new A.Vector3(t[1&r?1:0][0],t[2&r?1:0][1],t[4&r?1:0][2]);a.transformAsPoint(i,i);for(let t=0;t<3;t++)e[0][t]=Math.min(e[0][t],i[t]),e[1][t]=Math.max(e[1][t],i[t])}}function P(e){return Number.isFinite(e[0][0])}class U extends C{children;constructor(e={}){let{children:t=[]}=e=Array.isArray(e)?{children:e}:e;E.R.assert(t.every(e=>e instanceof C),"every child must an instance of ScenegraphNode"),super(e),this.children=t}getBounds(){let e=w();return this.traverse((t,{worldMatrix:r})=>{let a=t.getBounds();a&&N(e,a,new A.Matrix4(r).multiplyRight(t.matrix))}),P(e)?e:null}destroy(){this.children.forEach(e=>e.destroy()),this.removeAll(),super.destroy()}add(...e){for(let t of e)Array.isArray(t)?this.add(...t):this.children.push(t);return this}remove(e){let t=this.children,r=t.indexOf(e);return r>-1&&t.splice(r,1),this}removeAll(){return this.children=[],this}traverse(e,{worldMatrix:t=new A.Matrix4}={}){if(!this.display)return;let r=new A.Matrix4(t).multiplyRight(this.matrix);for(let t of this.children)t.display&&(t instanceof U?t.traverse(e,{worldMatrix:r}):e(t,{worldMatrix:r}))}traverseDepthSorted(e,{viewMatrix:t,worldMatrix:r=new A.Matrix4,order:a="back-to-front"}){let i=new A.Matrix4(t),n=[];this.traverse((e,t)=>{let r=e.getBounds(),a=r?new A.Vector3(r[0]).add(r[1]).divide([2,2,2]):new A.Vector3,o=new A.Matrix4(t.worldMatrix).multiplyRight(e.matrix);o.transformAsPoint(a,a),i.transformAsPoint(a,a),n.push({node:e,context:{worldMatrix:o,bounds:r,depth:-a[2]},index:n.length})},{worldMatrix:new A.Matrix4(r)});let o="back-to-front"===a?-1:1;for(let{node:t,context:r}of(n.sort((e,t)=>o*(e.context.depth-t.context.depth)||e.index-t.index),n))e(t,r)}preorderTraversal(e,{worldMatrix:t=new A.Matrix4}={}){let r=new A.Matrix4(t).multiplyRight(this.matrix);for(let t of(e(this,{worldMatrix:r}),this.children))t instanceof U?t.preorderTraversal(e,{worldMatrix:r}):e(t,{worldMatrix:r})}}class L extends C{model;instanceMatrices;bounds=null;managedResources;constructor(e){super(e),this.model=e.model,this.managedResources=e.managedResources||[],this.instanceMatrices=e.instanceMatrices||null,this.bounds=e.bounds?this.instanceMatrices?function(e,t){let r=w();for(let a of t)N(r,e,a);return P(r)?r:null}(e.bounds,this.instanceMatrices):e.bounds:null,this.setProps(e)}destroy(){this.model&&(this.model.destroy(),this.model=null),this.managedResources.forEach(e=>e.destroy()),this.managedResources=[]}getBounds(){return this.bounds}draw(e){return this.model.draw(e)}}var F=r(90015),O=r(94465),k=r(75638),V=r(26839),j=r(80698),D=r(74744),H=r(99305),B=r(22345),G=r(16698);class z{id;device;factory;shaderInputs;bindings={};_uniformStore;_bindGroupCacheToken={};_dynamicResourceGenerations={};constructor(e,t={}){this.id=t.id||(0,M.L)("material"),this.device=e,this.factory=t.factory||new q(e,{modules:t.modules||t.shaderInputs?.getModules()||[]});let r=Object.fromEntries((t.shaderInputs?.getModules()||this.factory.modules).map(e=>[e.name,e]));for(let[e,a]of(this.shaderInputs=t.shaderInputs||new F.l(r),this._uniformStore=new O.K(this.device,this.shaderInputs.modules),Object.entries(this.shaderInputs.modules)))if(this.ownsModule(e)&&(0,G.fX)(a)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.updateShaderInputs(),t.bindings&&this._replaceOwnedBindings(t.bindings)}destroy(){this._uniformStore.destroy()}clone(e={}){let t=this.factory.createMaterial({id:e.id,shaderInputs:e.shaderInputs,bindings:{...this.getResourceBindings(),...e.bindings}});return e.shaderInputs||t.setProps(this.shaderInputs.getUniformValues()),e.moduleProps&&t.setProps(e.moduleProps),t.updateShaderInputs(),t}ownsBinding(e){return this.factory.ownsBinding(e)}ownsModule(e){return this.factory.ownsModule(e)}setProps(e){this.shaderInputs.setProps(e)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this._setOwnedBindings(this.shaderInputs.getBindingValues())&&(this._bindGroupCacheToken={})}getResourceBindings(){let e={};for(let[t,r]of Object.entries(this.bindings))W(t)||(e[t]=r);return e}getBindings(e={bindings:[]}){this._syncDynamicResourceGenerations();let t={};for(let[r,a]of Object.entries(this.bindings))if((0,B.YT)(a)){let i=(0,B.l0)(e,r,{fallbackGroup:K}),n=i?a.resolveTextureBinding(i):null;n&&(t[r]=n)}else a instanceof H.kL?t[r]=a.buffer:(0,H.Hd)(a)?t[r]=(0,H.j8)(a):t[r]=a;return this._syncDynamicResourceGenerations(),t}getBindingsByGroup(e={bindings:[]}){return this.factory.getBindingsByGroup(this.getBindings(e))}getBindGroupCacheKey(e){return this._syncDynamicResourceGenerations(),e===K?this._bindGroupCacheToken:null}getBindingsUpdateTimestamp(){let e=0;for(let t of Object.values(this.bindings))t instanceof k.X?e=Math.max(e,t.texture.updateTimestamp):t instanceof V.h||t instanceof j.g||t instanceof D.r||t instanceof H.kL?e=Math.max(e,t.updateTimestamp):(0,B.YT)(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:(0,H.Hd)(t)&&(e=Math.max(e,(t.buffer instanceof H.kL,t.buffer.updateTimestamp)));return e}_replaceOwnedBindings(e){this._setOwnedBindings(e)&&(this._bindGroupCacheToken={})}_setOwnedBindings(e){let t=!1;for(let[r,a]of Object.entries(e))void 0!==a&&this.ownsBinding(r)&&this.bindings[r]!==a&&(this.bindings[r]=a,t=!0);return t}_syncDynamicResourceGenerations(){let e={},t=!1;for(let[a,i]of Object.entries(this.bindings)){var r;let n=(r=i,(0,B.YT)(r)?r.generation:(0,H.Xk)(r)?.generation??null);null!==n&&(e[a]=n,this._dynamicResourceGenerations[a]!==n&&(t=!0))}Object.keys(e).length!==Object.keys(this._dynamicResourceGenerations).length&&(t=!0),this._dynamicResourceGenerations=e,t&&(this._bindGroupCacheToken={})}}let K=3;class q{device;modules;_materialBindingNames;_materialModuleNames;constructor(e,t={}){this.device=e,this.modules=t.modules||[];let r=new F.l(Object.fromEntries(this.modules.map(e=>[e.name,e])));this._materialBindingNames=function(e){let t=new Set;for(let r of Object.values(e.modules))for(let e of r.bindingLayout||[])e.group===K&&t.add(e.name);return t}(r),this._materialModuleNames=function(e){let t=new Set;for(let r of Object.values(e.modules))r.name&&r.bindingLayout?.some(e=>e.group===K&&e.name===r.name)&&t.add(r.name);return t}(r)}createMaterial(e={}){return new z(this.device,{...e,factory:this})}getBindingNames(){return Array.from(this._materialBindingNames)}ownsBinding(e){if(this._materialBindingNames.has(e))return!0;let t=W(e);return!!t&&this._materialModuleNames.has(t)}ownsModule(e){return this._materialModuleNames.has(e)}getBindingsByGroup(e){return Object.keys(e).length>0?{[K]:e}:{}}}function W(e){return e.endsWith("Uniforms")?e.slice(0,-8):null}var J=r(25337),$=r(11205);function X(e){let t=e.value;if(t instanceof Float32Array)return t;let r=new Float32Array(t.length),a=Y(t),i=t instanceof Int8Array||t instanceof Int16Array||t instanceof Int32Array;for(let n=0;n<t.length;n++){let o=Number(t[n]);r[n]=e.normalized&&a?i?Math.max(o/a,-1):o/a:o}return r}function Y(e){return e instanceof Int8Array?127:e instanceof Uint8Array||e instanceof Uint8ClampedArray?255:e instanceof Int16Array?32767:e instanceof Uint16Array?65535:e instanceof Int32Array?0x7fffffff:0xffffffff*(e instanceof Uint32Array)}var Q=r(89277),Z=r(30638),ee=r(90153);let et={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function er(e){return e?Array.isArray(e)?e[0]??null:e:null}function ea(e){if((0,ee.x)(e))return(0,ee.c)(e);if("object"==typeof e&&"width"in e&&"height"in e)return{width:e.width,height:e.height};throw Error("Unsupported mip-level data")}function ei(e){let{textureFormat:t,format:r}=e;if(t&&r&&t!==r)throw Error(`Conflicting texture formats "${t}" and "${r}" provided for the same mip level`);return t??r}function en(e){let t=et[e];if(void 0===t)throw Error(`Invalid cube face: ${e}`);return t}function eo(e){throw Error("setTexture1DData not supported in WebGL.")}function es(e,t,r,a){let i=Array.isArray(t)?t:[t],n=[];for(let t=0;t<i.length;t++){let o=i[t];if((0,ee.x)(o))n.push({type:"external-image",image:o,z:e,mipLevel:t});else if("object"==typeof o&&null!==o&&"data"in o&&"width"in o&&"height"in o)n.push({type:"texture-data",data:o,textureFormat:ei(o),z:e,mipLevel:t});else if(ArrayBuffer.isView(o)&&r)n.push({type:"texture-data",data:{data:o,width:Math.max(1,r.width>>t),height:Math.max(1,r.height>>t),...a?{format:a}:{}},textureFormat:a,z:e,mipLevel:t});else throw Error("Unsupported 2D mip-level payload")}return n}function el(e){let t=[];for(let r=0;r<e.length;r++)t.push(...es(r,e[r]));return t}function ec(e){let t=[];for(let r=0;r<e.length;r++)t.push(...es(r,e[r]));return t}function ef(e){let t=[];for(let[r,a]of Object.entries(e)){let e=en(r);t.push(...es(e,a))}return t}function ep(e){let t=[];return e.forEach((e,r)=>{for(let[a,i]of Object.entries(e)){let e=6*r+en(a);t.push(...es(e,i))}}),t}class eu{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error("Texture not initialized yet");return this._texture}get sampler(){if(!this._sampler)throw Error("Sampler not initialized yet");return this._sampler}get view(){if(!this._view)throw Error("View not initialized yet");return this._view}get[Symbol.toStringTag](){return"DynamicTexture"}toString(){let e=this._texture?.width??this.props.width??"?",t=this._texture?.height??this.props.height??"?";return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?"ready":"loading..."})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(e,t){this.device=e;let r=(0,M.L)("dynamic-texture");this.props={...eu.defaultProps,id:r,...t,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(t)}async initAsync(e){try{let t=await this._loadAllData(e);this._checkNotDestroyed();let r=t.data?function(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,r="format"in e?e.format:void 0;switch(e.dimension){case"1d":return eo(e.data);case"2d":return es(0,e.data,t,r);case"3d":return el(e.data);case"2d-array":return ec(e.data);case"cube":return ef(e.data);case"cube-array":return ep(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}({...t,width:e.width,height:e.height,format:e.format}):[],a="format"in e&&void 0!==e.format,i="usage"in e&&void 0!==e.usage,n=(()=>{if(this.props.width&&this.props.height)return{width:this.props.width,height:this.props.height};let e=function(e){let{dimension:t,data:r}=e;if(!r)return null;switch(t){case"1d":{let e=er(r);if(!e)return null;let{width:t}=ea(e);return{width:t,height:1}}case"2d":{if(ArrayBuffer.isView(r))return null;let e=er(r);return e?ea(e):null}case"3d":case"2d-array":{if(!Array.isArray(r)||0===r.length)return null;let e=er(r[0]);return e?ea(e):null}case"cube":{let e=Object.keys(r)[0]??null;if(!e)return null;let t=er(r[e]);return t?ea(t):null}case"cube-array":{if(!Array.isArray(r)||0===r.length)return null;let e=r[0],t=Object.keys(e)[0]??null;if(!t)return null;let a=er(e[t]);return a?ea(a):null}default:return null}}(t);return e||{width:this.props.width||1,height:this.props.height||1}})();if(!n||n.width<=0||n.height<=0)throw Error(`${this} size could not be determined or was zero`);let o=function(e,t,r,a){if(0===t.length)return{subresources:t,mipLevels:1,format:a.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let n=t.some(e=>e.mipLevel>0),o=a.format,s=1/0,l=[];for(let[t,a]of i){let i=[...a].sort((e,t)=>e.mipLevel-t.mipLevel),n=i[0];if(!n||0!==n.mipLevel)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let c=ed(e,n);if(c.width!==r.width||c.height!==r.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${c.width}x${c.height} do not match expected ${r.width}x${r.height}`);let f=em(n);if(f){if(o&&o!==f)throw Error(`DynamicTexture: slice ${t} base level format "${f}" does not match texture format "${o}"`);o=f}let p=o&&e.isTextureFormatCompressed(o)?function(e,t,r,a){let{blockWidth:i=1,blockHeight:n=1}=e.getTextureFormatInfo(a),o=1;for(let e=1;;e++){let a=Math.max(1,t>>e),s=Math.max(1,r>>e);if(a<i||s<n)break;o++}return o}(e,c.width,c.height,o):e.getMipLevelCount(c.width,c.height),u=0;for(let t=0;t<i.length;t++){let r=i[t];if(!r||r.mipLevel!==t||t>=p)break;let a=ed(e,r),n=Math.max(1,c.width>>t),s=Math.max(1,c.height>>t);if(a.width!==n||a.height!==s)break;let f=em(r);if(f&&(o||(o=f),f!==o))break;u++,l.push(r)}s=Math.min(s,u)}let c=Number.isFinite(s)?Math.max(1,s):1;return{subresources:l.filter(e=>e.mipLevel<c),mipLevels:c,format:o,hasExplicitMipChain:n}}(this.device,r,n,{format:a?e.format:void 0}),s=o.format??this.props.format,l={...this.props,...n,format:s,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(s)&&!i&&(l.usage=j.g.SAMPLE|j.g.COPY_DST);let c=this.props.mipmaps&&!o.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(s);if("webgpu"===this.device.type&&c){let e="3d"===this.props.dimension?j.g.SAMPLE|j.g.STORAGE|j.g.COPY_DST|j.g.COPY_SRC:j.g.SAMPLE|j.g.RENDER|j.g.COPY_DST|j.g.COPY_SRC;l.usage|=e}let f=this.device.getMipLevelCount(l.width,l.height),p=o.hasExplicitMipChain?o.mipLevels:"auto"===this.props.mipLevels?f:Math.max(1,Math.min(f,this.props.mipLevels??1)),u={...l,mipLevels:p};this._texture=this.device.createTexture(u),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),o.subresources.length&&this._setTextureSubresources(o.subresources),!this.props.mipmaps||o.hasExplicitMipChain||c||E.R.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),c&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),E.R.info(1,`${this} created`)()}catch(t){let e=t instanceof Error?t:Error(String(t));this.rejectReady(e)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){"webgl"===this.device.type?(this.texture.generateMipmapsWebGL(),this._touch()):"webgpu"===this.device.type?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):E.R.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof Q.L?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,r=e.height??this.texture.height,a=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:r,depthOrArrayLayers:a}),n=this.device.createBuffer({byteLength:i.byteLength,usage:V.h.COPY_DST|V.h.MAP_READ});this.texture.readBuffer({...e,width:t,height:r,depthOrArrayLayers:a},n);let o=this.device.createFence();return await o.signaled,o.destroy(),n}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,r=e.height??this.texture.height,a=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:r,depthOrArrayLayers:a}),n=await this.readBuffer(e),o=await n.readAsync(0,i.byteLength);return n.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),E.R.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=et[e];if(void 0===t)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),"1d"!==this.texture.props.dimension)throw Error(`${this} is not 1d`);let t=eo(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),"2d"!==this.texture.props.dimension)throw Error(`${this} is not 2d`);let r=es(t,e);this._setTextureSubresources(r)}setTexture3DData(e){if("3d"!==this.texture.props.dimension)throw Error(`${this} is not 3d`);let t=el(e);this._setTextureSubresources(t)}setTextureArrayData(e){if("2d-array"!==this.texture.props.dimension)throw Error(`${this} is not 2d-array`);let t=ec(e);this._setTextureSubresources(t)}setTextureCubeData(e){if("cube"!==this.texture.props.dimension)throw Error(`${this} is not cube`);let t=ef(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if("cube-array"!==this.texture.props.dimension)throw Error(`${this} is not cube-array`);let t=ep(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:r}=t;switch(t.type){case"external-image":let{image:a,flipY:i}=t;this.texture.copyExternalImage({image:a,z:e,mipLevel:r,flipY:i});break;case"texture-data":let{data:n,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${r} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(n.data,{x:0,y:0,z:e,width:n.width,height:n.height,depthOrArrayLayers:1,mipLevel:r});break;default:throw Error("Unsupported 2D mip-level payload")}}e.length>0&&this._touch()}async _loadAllData(e){let t=await eb(e.data);return{dimension:e.dimension??"2d",data:t??null}}_checkNotDestroyed(){this.destroyed&&E.R.warn(`${this} already destroyed`)}_checkReady(){this.isReady||E.R.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...j.g.defaultProps,dimension:"2d",data:null,mipmaps:!1}}function em(e){if("texture-data"===e.type)return e.textureFormat??ei(e.data)}function ed(e,t){switch(t.type){case"external-image":return e.getExternalImageSize(t.image);case"texture-data":return{width:t.data.width,height:t.data.height};default:throw Error("Unsupported texture subresource")}}async function eb(e){if(Array.isArray(e=await e))return await Promise.all(e.map(eb));if(e&&"object"==typeof e&&e.constructor===Object){let t=e,r=await Promise.all(Object.values(t).map(eb)),a=Object.keys(t),i={};for(let e=0;e<a.length;e++)i[a[e]]=r[e];return i}return e}let eh={props:{},uniforms:{},bindings:{},name:"skin",bindingLayout:[{name:"skin",group:0},{name:"skinJointMatrices",group:0,visibility:1}],dependencies:[],source:`
struct skinUniforms {
  jointMatrix: array<mat4x4<f32>, 64>,
};

@group(0) @binding(auto) var<uniform> skin: skinUniforms;

#ifdef HAS_INSTANCED_SKIN
@group(0) @binding(auto) var<storage, read> skinJointMatrices: array<mat4x4<f32>>;

fn getInstancedSkinMatrix(
  weights: vec4f,
  joints: vec4u,
  instanceIndex: u32,
  jointsPerInstance: u32
) -> mat4x4<f32> {
  let firstJoint = instanceIndex * jointsPerInstance;
  return (weights.x * skinJointMatrices[firstJoint + joints.x])
       + (weights.y * skinJointMatrices[firstJoint + joints.y])
       + (weights.z * skinJointMatrices[firstJoint + joints.z])
       + (weights.w * skinJointMatrices[firstJoint + joints.w]);
}
#endif

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

#ifdef HAS_INSTANCED_SKIN
uniform highp sampler2D skinJointMatrices;

mat4 getInstancedJointMatrix(uint jointIndex, uint instanceIndex) {
  int firstColumn = int(jointIndex * 4u);
  int row = int(instanceIndex);
  return mat4(
    texelFetch(skinJointMatrices, ivec2(firstColumn, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 1, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 2, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 3, row), 0)
  );
}

mat4 getInstancedSkinMatrix(
  vec4 weights,
  uvec4 joints,
  uint instanceIndex,
  uint jointsPerInstance
) {
  return (weights.x * getInstancedJointMatrix(joints.x, instanceIndex))
       + (weights.y * getInstancedJointMatrix(joints.y, instanceIndex))
       + (weights.z * getInstancedJointMatrix(joints.z, instanceIndex))
       + (weights.w * getInstancedJointMatrix(joints.w, instanceIndex));
}
#endif

mat4 getSkinMatrix(vec4 weights, uvec4 joints) {
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
}

`,fs:"",defines:{SKIN_MAX_JOINTS:64},getUniforms:(e={},t)=>{let{jointMatrices:r,skinJointMatrices:a,scenegraphsFromGLTF:i,skinIndex:n=0,meshWorldMatrix:o}=e,s=a?{skinJointMatrices:a}:{};if(r){var l;let e;return{jointMatrix:(l=r,(e=new Float32Array(1024)).set(l instanceof Float32Array?l.subarray(0,e.length):l.slice(0,e.length)),e),...s}}let c=i?.gltf?.skins?.[n];if(!c)return{jointMatrix:[],...s};let{inverseBindMatrices:f,joints:p,skeleton:u}=c,m=i.gltfNodeIndexToNodeMap,d=new Map,b=void 0===u?void 0:m?.get(u);for(let e of b?[b]:i.scenes||[])e.preorderTraversal((e,{worldMatrix:t})=>{d.set(e.id,t)});let h=o?new A.Matrix4(o).invert():null,g=new Float32Array(1024),v=f?.value;for(let e=0;e<Math.min(p.length,64);e++){let t=m?.get(p[e]);if(!t)continue;let r=d.get(t.id)||t.matrix,a=h?new A.Matrix4(h).multiplyRight(r):new A.Matrix4(r);v&&v.length>=(e+1)*16&&a.multiplyRight(new A.Matrix4(Array.from(v.slice(16*e,(e+1)*16)))),g.set(a,16*e)}return{jointMatrix:g,...s}},uniformTypes:{jointMatrix:["mat4x4<f32>",64]}},eg={name:"gpuAnimation",props:{},uniforms:{},bindings:{},source:`
#ifdef HAS_GPU_CROWD_ANIMATION
@group(0) @binding(auto) var<storage, read> gpuAnimationFrames: array<vec4f>;

fn readGPUAnimationFrame(frame: u32, offset: u32, frameStride: u32) -> vec4f {
  return gpuAnimationFrames[frame * frameStride + offset];
}

fn sampleGPUAnimationFrame(
  frames: vec4f,
  blend: vec4f,
  offset: u32,
  frameStride: u32
) -> vec4f {
  let first = mix(
    readGPUAnimationFrame(u32(frames.x), offset, frameStride),
    readGPUAnimationFrame(u32(frames.y), offset, frameStride),
    frames.z
  );
  if (blend.w <= 0.0) {
    return first;
  }
  let second = mix(
    readGPUAnimationFrame(u32(blend.x), offset, frameStride),
    readGPUAnimationFrame(u32(blend.y), offset, frameStride),
    blend.z
  );
  return mix(first, second, blend.w);
}

fn sampleGPUAnimationMatrix(
  frames: vec4f,
  blend: vec4f,
  firstColumn: u32,
  frameStride: u32
) -> mat4x4f {
  return mat4x4f(
    sampleGPUAnimationFrame(frames, blend, firstColumn, frameStride),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 1u, frameStride),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 2u, frameStride),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 3u, frameStride)
  );
}

fn getGPUAnimatedSkinMatrix(
  weights: vec4f,
  joints: vec4u,
  frames: vec4f,
  blend: vec4f,
  frameStride: u32
) -> mat4x4f {
  return weights.x * sampleGPUAnimationMatrix(frames, blend, 4u + joints.x * 4u, frameStride)
       + weights.y * sampleGPUAnimationMatrix(frames, blend, 4u + joints.y * 4u, frameStride)
       + weights.z * sampleGPUAnimationMatrix(frames, blend, 4u + joints.z * 4u, frameStride)
       + weights.w * sampleGPUAnimationMatrix(frames, blend, 4u + joints.w * 4u, frameStride);
}
#endif

#ifdef HAS_INSTANCED_MORPH
@group(0) @binding(auto) var<storage, read> gpuMorphTargets: array<vec4f>;

#ifndef HAS_GPU_CROWD_ANIMATION
@group(0) @binding(auto) var<storage, read> gpuMorphWeights: array<vec4f>;
#endif

fn getGPUCrowdMorphWeight(
  instanceIndex: u32,
  targetIndex: u32,
  targetCount: u32,
  jointsPerInstance: u32,
  frames: vec4f,
  blend: vec4f,
  frameStride: u32
) -> f32 {
#ifdef HAS_GPU_CROWD_ANIMATION
  let offset = 4u + jointsPerInstance * 4u + targetIndex;
  return sampleGPUAnimationFrame(frames, blend, offset, frameStride).x;
#else
  let packedCount = (targetCount + 3u) / 4u;
  let packedWeights = gpuMorphWeights[instanceIndex * packedCount + targetIndex / 4u];
  return packedWeights[targetIndex % 4u];
#endif
}

fn getGPUCrowdMorphDelta(
  instanceIndex: u32,
  vertexIndex: u32,
  attributeIndex: u32,
  vertexCount: u32,
  targetCount: u32,
  jointsPerInstance: u32,
  frames: vec4f,
  blend: vec4f,
  frameStride: u32
) -> vec3f {
  var result = vec3f(0.0);
  for (var targetIndex = 0u; targetIndex < targetCount; targetIndex++) {
    let weight = getGPUCrowdMorphWeight(
      instanceIndex,
      targetIndex,
      targetCount,
      jointsPerInstance,
      frames,
      blend,
      frameStride
    );
    let offset = (targetIndex * 3u + attributeIndex) * vertexCount + vertexIndex;
    result += gpuMorphTargets[offset].xyz * weight;
  }
  return result;
}
#endif
`,vs:`
#ifdef HAS_GPU_CROWD_ANIMATION
uniform highp sampler2D gpuAnimationFrames;

vec4 sampleGPUAnimationFrame(vec4 frames, vec4 blend, int offset) {
  vec4 first = mix(
    texelFetch(gpuAnimationFrames, ivec2(offset, int(frames.x)), 0),
    texelFetch(gpuAnimationFrames, ivec2(offset, int(frames.y)), 0),
    frames.z
  );
  if (blend.w <= 0.0) {
    return first;
  }
  vec4 second = mix(
    texelFetch(gpuAnimationFrames, ivec2(offset, int(blend.x)), 0),
    texelFetch(gpuAnimationFrames, ivec2(offset, int(blend.y)), 0),
    blend.z
  );
  return mix(first, second, blend.w);
}

mat4 sampleGPUAnimationMatrix(vec4 frames, vec4 blend, int firstColumn) {
  return mat4(
    sampleGPUAnimationFrame(frames, blend, firstColumn),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 1),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 2),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 3)
  );
}

mat4 getGPUAnimatedSkinMatrix(vec4 weights, uvec4 joints, vec4 frames, vec4 blend) {
  return weights.x * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.x) * 4)
       + weights.y * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.y) * 4)
       + weights.z * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.z) * 4)
       + weights.w * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.w) * 4);
}
#endif

#ifdef HAS_INSTANCED_MORPH
uniform highp sampler2D gpuMorphTargets;

#ifndef HAS_GPU_CROWD_ANIMATION
uniform highp sampler2D gpuMorphWeights;
#endif

float getGPUCrowdMorphWeight(
  uint instanceIndex,
  uint targetIndex,
  uint jointsPerInstance,
  vec4 frames,
  vec4 blend
) {
#ifdef HAS_GPU_CROWD_ANIMATION
  int offset = 4 + int(jointsPerInstance) * 4 + int(targetIndex);
  return sampleGPUAnimationFrame(frames, blend, offset).x;
#else
  vec4 packedWeights = texelFetch(
    gpuMorphWeights,
    ivec2(int(targetIndex / 4u), int(instanceIndex)),
    0
  );
  return packedWeights[int(targetIndex % 4u)];
#endif
}

vec3 getGPUCrowdMorphDelta(
  uint instanceIndex,
  uint vertexIndex,
  uint attributeIndex,
  uint targetCount,
  uint jointsPerInstance,
  vec4 frames,
  vec4 blend
) {
  vec3 result = vec3(0.0);
  for (uint targetIndex = 0u; targetIndex < targetCount; targetIndex++) {
    float weight = getGPUCrowdMorphWeight(
      instanceIndex,
      targetIndex,
      jointsPerInstance,
      frames,
      blend
    );
    result += texelFetch(
      gpuMorphTargets,
      ivec2(int(vertexIndex), int(targetIndex * 3u + attributeIndex)),
      0
    ).xyz * weight;
  }
  return result;
}
#endif
`,fs:"",bindingLayout:[{name:"gpuAnimationFrames",group:0,visibility:1},{name:"gpuMorphTargets",group:0,visibility:1},{name:"gpuMorphWeights",group:0,visibility:1}],getUniforms:(e={})=>e},ev=`
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
#ifdef HAS_GLTF_INSTANCING
  @location(8) instanceModelMatrixCol0: vec4f,
  @location(9) instanceModelMatrixCol1: vec4f,
  @location(10) instanceModelMatrixCol2: vec4f,
  @location(11) instanceModelMatrixCol3: vec4f,
  @builtin(instance_index) instanceIndex: u32,
#endif
#ifdef HAS_GPU_CROWD_ANIMATION
  @location(12) instanceAnimationFrames: vec4f,
  @location(13) instanceAnimationBlend: vec4f,
#endif
#ifdef HAS_INSTANCED_MORPH
  @builtin(vertex_index) vertexIndex: u32,
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

#ifdef HAS_GLTF_INSTANCING
fn getGLTFInstanceNormalMatrix(matrix: mat3x3f) -> mat3x3f {
  let firstCofactor = cross(matrix[1], matrix[2]);
  let inverseDeterminant = 1.0 / dot(matrix[0], firstCofactor);
  return mat3x3f(
    firstCofactor,
    cross(matrix[2], matrix[0]),
    cross(matrix[0], matrix[1])
  ) * inverseDeterminant;
}
#endif

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

#ifdef HAS_INSTANCED_MORPH
  var animationFrames = vec4f(0.0);
  var animationBlend = vec4f(0.0);
#ifdef HAS_GPU_CROWD_ANIMATION
  animationFrames = inputs.instanceAnimationFrames;
  animationBlend = inputs.instanceAnimationBlend;
#endif
  position = vec4f(
    position.xyz + getGPUCrowdMorphDelta(
      inputs.instanceIndex,
      inputs.vertexIndex,
      0u,
      u32(CROWD_MORPH_VERTEX_COUNT),
      u32(CROWD_MORPH_TARGET_COUNT),
      u32(CROWD_ANIMATION_JOINT_COUNT),
      animationFrames,
      animationBlend,
      u32(CROWD_ANIMATION_FRAME_STRIDE)
    ),
    1.0
  );
#ifdef HAS_NORMALS
  normal = normalize(normal + getGPUCrowdMorphDelta(
    inputs.instanceIndex,
    inputs.vertexIndex,
    1u,
    u32(CROWD_MORPH_VERTEX_COUNT),
    u32(CROWD_MORPH_TARGET_COUNT),
    u32(CROWD_ANIMATION_JOINT_COUNT),
    animationFrames,
    animationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  ));
#endif
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize(tangent.xyz + getGPUCrowdMorphDelta(
    inputs.instanceIndex,
    inputs.vertexIndex,
    2u,
    u32(CROWD_MORPH_VERTEX_COUNT),
    u32(CROWD_MORPH_TARGET_COUNT),
    u32(CROWD_ANIMATION_JOINT_COUNT),
    animationFrames,
    animationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  )), tangent.w);
#endif
#endif

#ifdef HAS_SKIN
#ifdef HAS_GPU_CROWD_ANIMATION
  let skinMatrix = getGPUAnimatedSkinMatrix(
    inputs.WEIGHTS_0,
    inputs.JOINTS_0,
    inputs.instanceAnimationFrames,
    inputs.instanceAnimationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  );
#else
#ifdef HAS_INSTANCED_SKIN
  let skinMatrix = getInstancedSkinMatrix(
    inputs.WEIGHTS_0,
    inputs.JOINTS_0,
    inputs.instanceIndex,
    u32(CROWD_JOINTS_PER_INSTANCE)
  );
#else
  let skinMatrix = getSkinMatrix(inputs.WEIGHTS_0, inputs.JOINTS_0);
#endif
#endif
  position = skinMatrix * position;
  normal = normalize((skinMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((skinMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
#endif

#ifdef HAS_GLTF_INSTANCING
  var instanceMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
#ifdef HAS_GPU_CROWD_ANIMATION
  instanceMatrix *= sampleGPUAnimationMatrix(
    inputs.instanceAnimationFrames,
    inputs.instanceAnimationBlend,
    0u,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  );
#endif
  position = instanceMatrix * position;
  normal = normalize(getGLTFInstanceNormalMatrix(mat3x3f(
    instanceMatrix[0].xyz,
    instanceMatrix[1].xyz,
    instanceMatrix[2].xyz
  )) * normal);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((instanceMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
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
`,ex=`\
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

  #ifdef HAS_GLTF_INSTANCING
    in vec4 instanceModelMatrixCol0;
    in vec4 instanceModelMatrixCol1;
    in vec4 instanceModelMatrixCol2;
    in vec4 instanceModelMatrixCol3;
  #endif

  #ifdef HAS_GPU_CROWD_ANIMATION
    in vec4 instanceAnimationFrames;
    in vec4 instanceAnimationBlend;
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

    #ifdef HAS_INSTANCED_MORPH
      vec4 animationFrames = vec4(0.0);
      vec4 animationBlend = vec4(0.0);
      #ifdef HAS_GPU_CROWD_ANIMATION
        animationFrames = instanceAnimationFrames;
        animationBlend = instanceAnimationBlend;
      #endif
      pos.xyz += getGPUCrowdMorphDelta(
        uint(gl_InstanceID),
        uint(gl_VertexID),
        0u,
        uint(CROWD_MORPH_TARGET_COUNT),
        uint(CROWD_ANIMATION_JOINT_COUNT),
        animationFrames,
        animationBlend
      );
      #ifdef HAS_NORMALS
        _NORMAL.xyz = normalize(_NORMAL.xyz + getGPUCrowdMorphDelta(
          uint(gl_InstanceID),
          uint(gl_VertexID),
          1u,
          uint(CROWD_MORPH_TARGET_COUNT),
          uint(CROWD_ANIMATION_JOINT_COUNT),
          animationFrames,
          animationBlend
        ));
      #endif
      #ifdef HAS_TANGENTS
        _TANGENT.xyz = normalize(_TANGENT.xyz + getGPUCrowdMorphDelta(
          uint(gl_InstanceID),
          uint(gl_VertexID),
          2u,
          uint(CROWD_MORPH_TARGET_COUNT),
          uint(CROWD_ANIMATION_JOINT_COUNT),
          animationFrames,
          animationBlend
        ));
      #endif
    #endif

    #ifdef HAS_SKIN
      #ifdef HAS_GPU_CROWD_ANIMATION
        mat4 skinMat = getGPUAnimatedSkinMatrix(
          WEIGHTS_0,
          JOINTS_0,
          instanceAnimationFrames,
          instanceAnimationBlend
        );
      #else
      #ifdef HAS_INSTANCED_SKIN
        mat4 skinMat = getInstancedSkinMatrix(
          WEIGHTS_0,
          JOINTS_0,
          uint(gl_InstanceID),
          uint(CROWD_JOINTS_PER_INSTANCE)
        );
      #else
      mat4 skinMat = getSkinMatrix(WEIGHTS_0, JOINTS_0);
      #endif
      #endif
      pos = skinMat * pos;
      _NORMAL = skinMat * _NORMAL;
      _TANGENT = vec4((skinMat * vec4(_TANGENT.xyz, 0.)).xyz, _TANGENT.w);
    #endif

    #ifdef HAS_GLTF_INSTANCING
      mat4 instanceMatrix = mat4(
        instanceModelMatrixCol0,
        instanceModelMatrixCol1,
        instanceModelMatrixCol2,
        instanceModelMatrixCol3
      );
      #ifdef HAS_GPU_CROWD_ANIMATION
        instanceMatrix *= sampleGPUAnimationMatrix(
          instanceAnimationFrames,
          instanceAnimationBlend,
          0
        );
      #endif
      pos = instanceMatrix * pos;
      _NORMAL = vec4(normalize(transpose(inverse(mat3(instanceMatrix))) * _NORMAL.xyz), 0.0);
      _TANGENT = vec4(normalize(mat3(instanceMatrix) * _TANGENT.xyz), _TANGENT.w);
    #endif

    pbr_setPositionNormalTangentUV(pos, _NORMAL, _TANGENT, _TEXCOORD_0, _TEXCOORD_1);
    gl_Position = pbrProjection.modelViewProjectionMatrix * pos;
  }
`,e_=`\
#version 300 es
  out vec4 fragmentColor;

  void main(void) {
    vec3 pos = pbr_vPosition;
    fragmentColor = pbr_filterColor(vec4(1.0));
  }
`;function eS(e,t){let r=t.materialFactory||new q(e,{modules:[y.s]}),a={...t.parsedPPBRMaterial.uniforms};delete a.camera;let i=Object.fromEntries(Object.entries({...a,...t.parsedPPBRMaterial.bindings}).filter(([e,t])=>{var a;return r.ownsBinding(e)&&((a=t)instanceof V.h||a instanceof eu||a instanceof Q.L||a instanceof j.g||a instanceof k.X)})),n=r.createMaterial({id:t.id,bindings:i});return n.setProps({pbrMaterial:a}),n}function eR(e,t,r,a,i){if("webgpu"===e.type)return e.createBuffer({id:t,data:r,usage:V.h.STORAGE|V.h.COPY_DST});let n=e.createTexture({id:t,format:"rgba32float",width:a,height:i,usage:j.g.SAMPLE|j.g.COPY_DST,sampler:{minFilter:"nearest",magFilter:"nearest",mipmapFilter:"nearest"}});return n.writeData(r,{width:a,height:i}),n}function eT(e,t,r){if(!e)return[...r];let a=e.value;return r.map((r,i)=>{let n=a[t*e.size+i];return void 0===n?r:e.normalized?e.value instanceof Int8Array?Math.max(n/127,-1):e.value instanceof Int16Array?Math.max(n/32767,-1):e.value instanceof Uint8Array?n/255:e.value instanceof Uint16Array?n/65535:n:n})}function ey(e,t){for(let r of(e.userData.morphWeights=[...t],e.userData.morphMeshes||[]))r.preorderTraversal(e=>{if(!(e instanceof L))return;let r=e.userData.morphTargets;r&&(!function(e,t,r,a){let i={};for(let e of["POSITION","NORMAL","TANGENT"]){let r=t.attributes[e];r&&(i[e]=X(r))}let n=function(e,t,r){let a={};for(let i of["POSITION","NORMAL","TANGENT"]){let n=e[i];if(!n)continue;let o=new Float32Array(n),s="TANGENT"===i?4:3,l=Math.floor(n.length/s);for(let e=0;e<Math.min(t.length,r.length);e++){let a=r[e],n=t[e][i];if(!a||!n)continue;let c="TANGENT"===i&&n.length===4*l?4:3;for(let e=0;e<l;e++){let t=e*s,r=e*c;for(let e=0;e<3;e++)o[t+e]+=(n[r+e]||0)*a}}"POSITION"!==i&&function(e,t){for(let r=0;r<e.length;r+=t){let t=Math.hypot(e[r],e[r+1],e[r+2]);t>0&&(e[r]/=t,e[r+1]/=t,e[r+2]/=t)}}(o,s),a[i]=o}return a}(i,r,a),o={};for(let[e,r]of Object.entries(t.attributes))r&&(o[e]=r);for(let e of["POSITION","NORMAL","TANGENT"]){let t=n[e],r=o[e];t&&r&&(o[e]={...r,value:function(e,t){if(e.value instanceof Float32Array)return t;let r=e.value.slice(),a=Y(r),i=r instanceof Int8Array||r instanceof Int16Array||r instanceof Int32Array;for(let n=0;n<t.length;n++){let o=t[n];r[n]=e.normalized&&a?Math.round(Math.max(i?-1:0,Math.min(1,o))*a):o}return r}(r,t)})}let s=new J.V({id:t.id,topology:t.topology||"triangle-list",vertexCount:t.vertexCount,indices:t.indices,attributes:o,bufferLayout:t.bufferLayout}),l=(0,$.C)(s),c=l.attributes.geometry?.value,f=e._gpuGeometry?.attributes.geometry||e.bufferAttributes.geometry;if(c&&f)return f.write(c);for(let t of["POSITION","NORMAL","TANGENT"]){let r=n[t];if(r){let a="POSITION"===t?"positions":"NORMAL"===t?"normals":"TANGENT";e.bufferAttributes[a]?.write(r)}}}(e.model,r.geometry,r.targets,t),e.userData.morphWeights=[...t])})}var eA=r(54393),eM=r(20998);let eI={modelOptions:{},pbrDebug:!1,imageBasedLightingEnvironment:void 0,lights:!0,useTangents:!1,useByteColors:!0,strictExtensions:!1};function eC(e,t,r,a){let i=(0,eM.lO)(e,t,r,a);for(let e of i.generatedTextures)a.generatedTextures.add(e);return i}function eE(e,t,r,a,i,n){let o=(t.primitives||[]).map((o,s)=>(function({device:e,gltfPrimitive:t,primitiveIndex:r,gltfMesh:a,gltf:i,gltfMaterialIdToMaterialMap:n,options:o,instancing:s}){let l=t.name||`${a.name||a.id}-primitive-${r}`,c=function(e){let t=1/0;for(let r of Object.values(e))if(r){let{value:e,size:a,components:i}=r,n=a??i;e?.length!==void 0&&n>=1&&(t=Math.min(t,e.length/n))}if(!Number.isFinite(t))throw Error("Could not determine vertex count from attributes");return t}(t.attributes),f=function(e,t,r){if(e!==eA.n.LINE_LOOP&&e!==eA.n.TRIANGLE_FAN)return{topology:function(e){switch(e){case eA.n.POINTS:return"point-list";case eA.n.LINES:return"line-list";case eA.n.LINE_STRIP:return"line-strip";case eA.n.TRIANGLES:return"triangle-list";case eA.n.TRIANGLE_STRIP:return"triangle-strip";default:throw Error(String(e))}}(e)};let a=t?.length??r,i=new(t instanceof Uint32Array||!t&&r>65536?Uint32Array:Uint16Array)(e===eA.n.LINE_LOOP?a>=2?2*a:0:a>=3?(a-2)*3:0),n=e=>t?.[e]??e;if(e===eA.n.LINE_LOOP){for(let e=0;e<a;e++)i[2*e]=n(e),i[2*e+1]=n((e+1)%a);return{topology:"line-list",indices:i}}for(let e=0;e<a-2;e++)i[3*e]=n(0),i[3*e+1]=n(e+1),i[3*e+2]=n(e+2);return{topology:"triangle-list",indices:i}}(t.mode??4,t.indices?.value,c),p=function(e,t,r){let a={};for(let[e,r]of Object.entries(t.attributes)){let{components:i,size:n,value:o,normalized:s}=r,l="POSITION"===e||"NORMAL"===e||"TANGENT"===e,c=!!(t.targets?.length&&l);a[e]={size:n??i,value:c?X({value:o,normalized:s}):o,normalized:!c&&s}}return new J.V({id:e,topology:r.topology,indices:r.indices??t.indices?.value,attributes:a})}(l,t,f),u=p.vertexCount,m=function(e,t,r){if(!e.targets?.length)return;let a={};for(let e of["POSITION","NORMAL","TANGENT"]){let t=r.attributes[e]?.value;t instanceof Float32Array&&(a[e]=new Float32Array(t))}return{geometry:r,baseAttributes:a,targets:e.targets.map(e=>{let r={};for(let a of["POSITION","NORMAL","TANGENT"]){let i=e[a],n="number"==typeof i?t.accessors[i]:i;n?.value&&ArrayBuffer.isView(n.value)&&(r[a]=X(n))}return r})}}(t,i,p),d=eC(e,t.material,p.attributes,{...o,gltf:i}),b=function(e,t){let r,a,i,n,o,s,l,c,f,p,u,{id:m,geometry:d,parsedPPBRMaterial:b,vertexCount:h,modelOptions:g={},instanceMatrices:v,morphTargets:x=[]}=t,_=g.userData?.gltfAnimatedCrowd;if(_&&v)throw Error("Nested glTF crowd instancing is unsupported");E.R.info(4,"createGLTFModel defines: ",b.defines)();let S=[],R={},T=[],A=[],M=[],I=!!_?.gpuAnimation;if(v||_)for(let t=0;t<4;t++){let r=new Float32Array(4*(_?.capacity||v?.length||0));v?.forEach((e,a)=>{for(let i=0;i<4;i++)r[4*a+i]=e[4*t+i]});let a=`instanceModelMatrixCol${t}`,i=e.createBuffer({id:`${m||"gltf"}-${a}`,data:r,usage:V.h.VERTEX|V.h.COPY_DST});R[a]=i,T.push({name:a,format:"float32x4",stepMode:"instance"}),S.push(i),A.push(i),M.push(r)}if(_&&I)for(let[t,o]of[["instanceAnimationFrames",r=new Float32Array(4*_.capacity)],["instanceAnimationBlend",i=new Float32Array(4*_.capacity)]]){let r=e.createBuffer({id:`${m||"gltf"}-${t}`,data:o,usage:V.h.VERTEX|V.h.COPY_DST});R[t]=r,T.push({name:t,format:"float32x4",stepMode:"instance"}),S.push(r),"instanceAnimationFrames"===t?a=r:n=r}let C=!!b.defines.HAS_SKIN,w=!!(_&&C&&!I);_&&w&&(s=new Float32Array(_.capacity*_.jointsPerInstance*16),o="webgpu"===e.type?e.createBuffer({id:`${m||"gltf"}-crowd-joint-matrices`,byteLength:s.byteLength,usage:V.h.STORAGE|V.h.COPY_DST}):e.createTexture({id:`${m||"gltf"}-crowd-joint-matrices`,format:"rgba32float",width:4*_.jointsPerInstance,height:_.capacity,usage:j.g.SAMPLE|j.g.COPY_DST,sampler:{minFilter:"nearest",magFilter:"nearest",mipmapFilter:"nearest"}}),S.push(o));let N=_?x.length:0,P=Math.floor((d.attributes.POSITION?.value.length||0)/3);if(_&&N>0&&P>0){let t=new Float32Array(3*N*P*4);for(let[e,r]of x.entries())for(let[a,i]of["POSITION","NORMAL","TANGENT"].entries()){let n=r[i];if(!n)continue;let o="TANGENT"===i&&n.length===4*P?4:3;for(let r=0;r<P;r++){let i=((3*e+a)*P+r)*4,s=r*o;t[i]=n[s]||0,t[i+1]=n[s+1]||0,t[i+2]=n[s+2]||0}}if(l=eR(e,`${m||"gltf"}-crowd-morph-targets`,t,P,3*N),S.push(l),!I){let t=Math.ceil(N/4);f=eR(e,`${m||"gltf"}-crowd-morph-weights`,c=new Float32Array(_.capacity*t*4),t,_.capacity),S.push(f)}}let U=C&&_?_.jointsPerInstance:0,F=4+4*U+N;_?.gpuAnimation&&(p=eR(e,`${m||"gltf"}-crowd-animation-frames`,u=new Float32Array(_.gpuAnimation.frameCount*F*4),F,_.gpuAnimation.frameCount),S.push(p));let O=ev;for(let[e,t]of[["CROWD_JOINTS_PER_INSTANCE",_?.jointsPerInstance||0],["CROWD_MORPH_VERTEX_COUNT",P],["CROWD_MORPH_TARGET_COUNT",N],["CROWD_ANIMATION_JOINT_COUNT",U],["CROWD_ANIMATION_FRAME_STRIDE",F]])O=O.replaceAll(`u32(${e})`,`u32(${t})`);let k={id:m,source:O,vs:ex,fs:e_,geometry:d,topology:d.topology,vertexCount:h,modules:[y.s,eh,..._?[eg]:[]],...g,...v||_?{attributes:{...g.attributes,...R},bufferLayout:[...g.bufferLayout||[],...T],instanceCount:v?.length||0,isInstanced:!0}:{},defines:{...b.defines,...g.defines,...v||_?{HAS_GLTF_INSTANCING:!0}:{},...w?{HAS_INSTANCED_SKIN:!0,CROWD_JOINTS_PER_INSTANCE:_.jointsPerInstance}:{},...I?{HAS_GPU_CROWD_ANIMATION:!0,CROWD_ANIMATION_FRAME_STRIDE:F}:{},...l?{HAS_INSTANCED_MORPH:!0,CROWD_MORPH_TARGET_COUNT:N}:{},..._?{CROWD_ANIMATION_JOINT_COUNT:U}:{}},parameters:{depthWriteEnabled:!0,depthCompare:"less",depthFormat:"depth24plus",cullMode:"back",...b.parameters,...g.parameters}},D=t.material||eS(e,{id:m?`${m}-material`:void 0,parsedPPBRMaterial:b});k.material=D;let H=new Z.K(e,k),B={...b.uniforms,...g.uniforms,...b.bindings,...g.bindings},G=function(e,t,r){let a=new Map;for(let t of e){for(let e of Object.keys(t.uniformTypes||{}))a.set(e,t.name);for(let e of t.bindingLayout||[])a.set(e.name,t.name)}let i={};for(let[e,n]of Object.entries(r)){if(void 0===n)continue;let r=a.get(e);!r||t.ownsModule(r)||(i[r]||={},i[r][e]=n)}return i}(H.shaderInputs.getModules(),D,B);H.shaderInputs.setProps(G),o&&H.shaderInputs.setProps({skin:{jointMatrices:[],skinJointMatrices:o}}),(p||l||f)&&H.shaderInputs.setProps({gpuAnimation:{...p?{gpuAnimationFrames:p}:{},...l?{gpuMorphTargets:l}:{},...f?{gpuMorphWeights:f}:{}}});let z=new L({managedResources:S,model:H,bounds:t.bounds,instanceMatrices:v});return _&&(z.userData.gltfAnimatedCrowd={transformBuffers:A,transformColumns:M,skinJointMatrices:o,jointMatrices:s,jointsPerInstance:_.jointsPerInstance,morphTargetCount:N,morphTargetData:l,morphWeights:c,morphWeightData:f,animationFrames:p,animationFrameValues:u,animationFrameStride:F,animationJointCount:U,animationParameters:r,animationParameterBuffer:a,animationBlend:i,animationBlendBuffer:n}),z}(e,{id:l,geometry:p,material:t.material&&n.get(t.material.id)||null,parsedPPBRMaterial:d,modelOptions:o.modelOptions,vertexCount:u,bounds:[t.attributes.POSITION.min,t.attributes.POSITION.max],instanceMatrices:s?.matrices,morphTargets:m?.targets});s&&(b.userData.gltfInstancing=s);let h=t.extensions?.KHR_materials_variants?.mappings||[];if(h.length){let t=new Map;for(let r of h){let a="number"==typeof r.material?i.materials[r.material]:r.material,s=a&&n.get(a.id);if(!s)continue;let l=eC(e,a,p.attributes,{...o,gltf:i});for(let e of r.variants||[])t.set(e,{material:s,parameters:{...b.model.parameters,...l.parameters,depthWriteEnabled:"BLEND"!==a.alphaMode,cullMode:a.doubleSided?"none":"back"}})}b.userData.gltfMaterialVariants={defaultMaterial:b.model.material,defaultParameters:{...b.model.parameters},mappings:t}}return m&&(b.userData.morphTargets=m),b})({device:e,gltfPrimitive:o,primitiveIndex:s,gltfMesh:t,gltf:r,gltfMaterialIdToMaterialMap:a,options:i,instancing:n}));return new U({id:t.name||t.id,children:o})}var ew=r(55611);function eN(e,t={}){let r=t.lightDefinitions||e.lights||e.extensions?.KHR_lights_punctual?.lights;if(!r||!Array.isArray(r)||0===r.length)return[];let a=[],i=function(e){let t=new Map;for(let r of e)for(let e of r.children||[])t.set(e.id,r);return t}(e.nodes||[]),n=new Map;for(let f of e.nodes||[]){var o,s,l,c;if(!function(e,t,r){let a=e;for(;a;){let e=r?.get(a.id);if(e?!e.display:a.extensions?.KHR_node_visibility?.visible===!1)return!1;a=t.get(a.id)}return!0}(f,i,t.nodeVisibility))continue;let e=f.light??f.extensions?.KHR_lights_punctual?.light;if("number"!=typeof e||t.nodeIdentifiers&&!t.nodeIdentifiers.has(f.id))continue;let p=r[e];if(!p)continue;let u=(o=p.color||[1,1,1],t.useByteColors??!0?o.map(e=>255*e):(0,ew.sC)(o,!1)),m=p.intensity??1,d=p.range,b=function e(t,r,a){let i=a.get(t.id);if(i)return i;let n=function(e){if(e.matrix)return new A.Matrix4(e.matrix);let t=new A.Matrix4;return e.translation&&t.translate(e.translation),e.rotation&&t.multiplyRight(new A.Matrix4().fromQuaternion(e.rotation)),e.scale&&t.scale(e.scale),t}(t),o=r.get(t.id),s=o?new A.Matrix4(e(o,r,a)).multiplyRight(n):n;return a.set(t.id,s),s}(f,i,n);switch(p.type){case"directional":a.push((s=b,l=u,c=m,{type:"directional",direction:eU(s),color:l,intensity:c}));break;case"point":a.push(function(e,t,r,a){let i=eP(e),n=[1,0,0];return void 0!==a&&a>0&&(n=[1,0,1/(a*a)]),{type:"point",position:i,color:t,intensity:r,attenuation:n}}(b,u,m,d));break;case"spot":a.push(function(e,t,r,a,i={}){let n=eP(e),o=eU(e),s=[1,0,0];return void 0!==a&&a>0&&(s=[1,0,1/(a*a)]),{type:"spot",position:n,direction:o,color:t,intensity:r,attenuation:s,innerConeAngle:i.innerConeAngle??0,outerConeAngle:i.outerConeAngle??Math.PI/4}}(b,u,m,d,p.spot))}}return a}function eP(e){return e.transformAsPoint([0,0,0])}function eU(e){return e.transformDirection([0,0,-1])}class eL{name;playing=!0;speed=1;startTime=0;constructor(e={}){this.name=e.name||"unnamed",Object.assign(this,e)}setTime(e){if(!this.playing)return;let t=(e/1e3-this.startTime)*this.speed;this.applyTime(t)}}class eF{clips;animations;constructor(e){this.clips=e,this.animations=e}animate(e){E.R.warn(`${this.constructor.name}#animate is deprecated. Use ${this.constructor.name}#setTime instead`)(),this.setTime(e)}setTime(e){this.clips.forEach(t=>t.setTime(e))}getAnimations(){return this.clips}}function eO(e,t,r){let a=eV(e),i=eV(t),n=a.reduce((e,t,r)=>e+t*i[r],0),o=n<0?-1:1;if((n=Math.min(Math.abs(n),1))>.9995)return eV(a.map((e,t)=>e+r*(i[t]*o-e)));let s=Math.acos(n),l=Math.sin(s),c=Math.sin((1-r)*s)/l,f=Math.sin(r*s)/l*o;return eV(a.map((e,t)=>e*c+i[t]*f))}function ek(e,t,r,a){let i=e["CUBICSPLINE"===t?3*r+1:r];return i?"quaternion"===a?eV(i):[...i]:null}function eV(e){let t=Math.hypot(...e);return t>0?e.map(e=>e/t):[0,0,0,1]}class ej{clip;mixer;time=0;timeScale;weight;loop;repetitions;paused=!1;playing=!1;elapsedTime=0;fade=null;constructor(e,t,r={}){this.mixer=e,this.clip=t,this.loop=r.loop||"repeat",this.repetitions=r.repetitions??1/0,this.timeScale=r.timeScale??1,this.weight=r.weight??1}play(){return this.playing=!0,this.paused=!1,this}pause(){return this.paused=!0,this}resume(){return this.playing=!0,this.paused=!1,this}stop(){return this.playing=!1,this.paused=!1,this.fade=null,this.reset()}reset(){return this.elapsedTime=0,this.time=0,this}setTime(e){return this.elapsedTime=e,this.time=this.resolveLocalTime(e),this}setLoop(e,t=1/0){return this.loop=e,this.repetitions=t,this.time=this.resolveLocalTime(this.elapsedTime),this}setEffectiveWeight(e){return this.weight=Math.max(0,e),this.fade=null,this}setEffectiveTimeScale(e){return this.timeScale=e,this}fadeIn(e){return this.scheduleFade(1,e)}fadeOut(e){return this.scheduleFade(0,e)}crossFadeTo(e,t){return e.weight=0,e.play().fadeIn(t),this.fadeOut(t)}crossFadeFrom(e,t){return e.crossFadeTo(this,t),this}advance(e){this.playing&&!this.paused&&(this.advanceFade(Math.abs(e)),this.elapsedTime+=e*this.timeScale,this.time=this.resolveLocalTime(this.elapsedTime),this.hasFinished()&&(this.playing=!1))}get shouldApply(){return(this.playing||this.hasFinished())&&this.weight>0}scheduleFade(e,t){return t<=0?(this.weight=e,this.fade=null):this.fade={duration:t,elapsedTime:0,startWeight:this.weight,endWeight:e},this}advanceFade(e){if(!this.fade)return;this.fade.elapsedTime+=e;let t=Math.min(this.fade.elapsedTime/this.fade.duration,1);this.weight=this.fade.startWeight+(this.fade.endWeight-this.fade.startWeight)*t,1===t&&(this.fade=null)}hasFinished(){let e=this.clip.duration;return e<=0?"once"===this.loop:"once"===this.loop?this.elapsedTime>=e||this.elapsedTime<0:Number.isFinite(this.repetitions)&&Math.abs(this.elapsedTime)>=e*this.repetitions}resolveLocalTime(e){let t=this.clip.duration;if(t<=0)return 0;if("once"===this.loop)return Math.min(Math.max(e,0),t);if(Number.isFinite(this.repetitions)&&Math.abs(e)>=t*this.repetitions)return"ping-pong"===this.loop&&this.repetitions%2==0||e<0?0:t;let r=e>=0&&e<t?e:(e%t+t)%t;return"repeat"===this.loop||0===Math.abs(Math.floor(e/t)%2)?r:t-r}}class eD{time=0;timeScale=1;clips=new Map;actions=new Map;initialValues=new Map;constructor(e=[]){e.forEach(e=>this.addClip(e))}addClip(e){return this.clips.set(e.name,e),this}clipAction(e,t){let r="string"==typeof e?this.clips.get(e):e;if(!r)throw Error(`Unknown animation clip: ${e}`);this.addClip(r);let a=this.actions.get(r);return a||(a=new ej(this,r,t),this.actions.set(r,a)),a}getAction(e){let t=this.clips.get(e);return t?this.actions.get(t):void 0}update(e){return this.advance(e),this.applyValues(),this}advance(e){let t=e*this.timeScale;return this.time+=t,this.actions.forEach(e=>e.advance(t)),this}setTime(e){return this.time=e,this.actions.forEach(t=>{t.paused||t.setTime(e*t.timeScale)}),this.applyValues(),this}stopAllAction(){return this.actions.forEach(e=>e.stop()),this}applyValues(){let e=new Map;this.actions.forEach(t=>{(t.shouldApply||t.playing&&0===t.weight)&&t.clip.tracks.forEach(r=>{let a=r.evaluate(t.time);if(!a)return;let i=r.binding.id||r.binding;if(!this.initialValues.has(i)){let e=r.binding.getValue?.();e&&this.initialValues.set(i,[...e])}if(0===t.weight&&!this.initialValues.has(i))return;let n=e.get(i);if(!n)return void e.set(i,{binding:r.binding,value:[...a],valueType:r.valueType,weight:t.weight});if(0===t.weight)return;let o=n.weight+t.weight,s=t.weight/o;n.value="quaternion"===r.valueType?eO(n.value,a,s):n.value.map((e,t)=>e+(a[t]-e)*s),n.weight=o})}),e.forEach(({binding:e,value:t,valueType:r,weight:a},i)=>{let n=a<1?this.initialValues.get(i):void 0;n&&n.length===t.length&&(t="quaternion"===r?eO(n,t,a):t.map((e,t)=>n[t]+(e-n[t])*a)),e.setValue(t)})}}class eH{name;tracks;duration;constructor(e){this.name=e.name||"unnamed",this.tracks=e.tracks,this.duration=e.duration??Math.max(0,...e.tracks.map(e=>e.duration))}}class eB{name;times;values;interpolation;valueType;binding;constructor(e){this.name=e.name||e.binding.id||"unnamed",this.times=e.times,this.values=e.values,this.interpolation=e.interpolation||"LINEAR",this.valueType=e.valueType||"vector",this.binding=e.binding}get duration(){return this.times[this.times.length-1]||0}get sampler(){return{input:this.times,output:this.values,interpolation:this.interpolation}}evaluate(e){return function(e,t,r="vector"){var a,i,n,o,s,l,c,f,p;let{input:u,output:m,interpolation:d="LINEAR"}=t;if(!u.length||!m.length||!Number.isFinite(e))return null;let b=u.length-1;if(e<=u[0]||0===b)return ek(m,d,0,r);if(e>=u[b])return ek(m,d,b,r);let h=0,g=b;for(;g-h>1;){let t=Math.floor((h+g)/2);u[t]<=e?h=t:g=t}let v=u[h],x=u[g]-v;if(x<=0||"STEP"===d)return ek(m,d,h,r);let _=(e-v)/x;switch(d){case"LINEAR":{let e=m[h],t=m[g];if(!e||!t)return null;return"quaternion"===r?eO(e,t,_):(a=e,i=t,n=_,a.map((e,t)=>(1-n)*e+n*i[t]))}case"CUBICSPLINE":{let e,t,a=m[3*h+1],i=m[3*h+2],n=m[3*g],u=m[3*g+1];if(!a||!i||!n||!u)return null;let d=(o=a,s=i,l=n,c=u,f=x,t=(e=(p=_)*p)*p,o.map((r,a)=>(2*t-3*e+1)*r+(t-2*e+p)*s[a]*f+(-2*t+3*e)*c[a]+(t-e)*l[a]*f));return"quaternion"===r?eV(d):d}default:return null}}(e,this.sampler,this.valueType)}}var eG=r(63168);class ez extends eL{animation;gltfNodeIdToNodeMap;onVisibilityChange;cameras;lightDefinitions;onLightChange;materials;clip;mixer;action;materialTextureTransformState=new Map;constructor(e){if(super({name:e.animation.name||"unnamed"}),this.animation=e.animation,this.gltfNodeIdToNodeMap=e.gltfNodeIdToNodeMap,this.onVisibilityChange=e.onVisibilityChange,this.cameras=e.cameras||[],this.lightDefinitions=e.lightDefinitions||[],this.onLightChange=e.onLightChange,this.materials=e.materials||[],this.animation.name||="unnamed",this.name=this.animation.name,this.animation.channels.some(e=>"material"===e.type||"textureTransform"===e.type)&&!this.materials.length)throw Error(`Animation ${this.animation.name} targets materials, but GLTFAnimator was created without a materials array`);this.mixer=e.mixer||new eD,this.clip=new eH({name:this.name,tracks:this.animation.channels.map(e=>this.createAnimationTrack(e))}),this.action=this.mixer.clipAction(this.clip).play()}applyTime(e){this.action.setTime(e),this.mixer.update(0)}createAnimationTrack(e){let t=function(e){switch(e){case"STEP":case"LINEAR":case"CUBICSPLINE":return e;default:throw Error(`Unsupported animation interpolation: ${e}`)}}(e.sampler.interpolation);if("node"===e.type)return new eB({name:`${e.targetNodeId}.${e.path}`,times:e.sampler.input,values:e.sampler.output,interpolation:t,valueType:"rotation"===e.path?"quaternion":"vector",binding:{id:`node:${e.targetNodeId}:${e.path}`,getValue:()=>this.getNodeAnimationValue(e.targetNodeId,e.path),setValue:t=>this.applyNodeAnimationValue(e.targetNodeId,e.path,t)}});if("camera"===e.type||"light"===e.type)return new eB({name:e.pointer,times:e.sampler.input,values:e.sampler.output,interpolation:t,binding:{id:e.pointer,getValue:()=>this.getSceneAnimationValue(e),setValue:t=>this.applySceneAnimationValue(e,t)}});let r=this.materials[e.targetMaterialIndex];if(!r)throw Error(`Cannot find animation target material ${e.targetMaterialIndex} for ${e.pointer}`);return new eB({name:e.pointer,times:e.sampler.input,values:e.sampler.output,interpolation:t,binding:{id:e.pointer,getValue:"material"===e.type?()=>{var t,a;let i,n;return t=r,a=e,i=t.shaderInputs.getUniformValues(),Array.isArray(n=i.pbrMaterial?.[a.property])?void 0===a.component?[...n]:[n[a.component]]:"number"==typeof n?[n]:[]}:void 0,setValue:t=>{var a,i,n,o,s,l,c,f;let p,u,m,d;"material"===e.type?(a=r,i=e,n=t,d=void 0!==i.component?{[i.property]:(l=(o=a,s=i.property,p=o.shaderInputs.getUniformValues(),Array.isArray(u=p.pbrMaterial?.[s])?[...u]:[]),c=i.component,f=n[0],(m=[...l])[c]=f,m)}:{[i.property]:1===n.length?n[0]:n},a.setProps({pbrMaterial:d})):function(e,t,r,a){var i,n,o;let s,l,c=(0,eG.lz)(t.textureSlot),f=(i=a,n=e,o=t,(l=(s=i.get(n)||{})[o.textureSlot])||(l={offset:[...o.baseTransform.offset],rotation:o.baseTransform.rotation,scale:[...o.baseTransform.scale]},s[o.textureSlot]=l,i.set(n,s)),l);switch(t.path){case"offset":void 0!==t.component?f.offset[t.component]=r[0]:f.offset=[r[0],r[1]];break;case"rotation":f.rotation=r[0];break;case"scale":void 0!==t.component?f.scale[t.component]=r[0]:f.scale=[r[0],r[1]]}e.setProps({pbrMaterial:{[c.uvTransformUniform]:(0,eG.dy)(t.baseTransform,f)}})}(r,e,t,this.materialTextureTransformState)}}})}getNodeAnimationValue(e,t){let r=this.getTargetNode(e);switch(t){case"translation":return Array.from(r.position);case"rotation":return Array.from(r.rotation);case"scale":return Array.from(r.scale);case"weights":return Array.from(r.userData.morphWeights||[]);case"visibility":return[+!!r.display];default:return[]}}applyNodeAnimationValue(e,t,r){let a=this.getTargetNode(e);switch(t){case"translation":a.setPosition(r).updateMatrix();break;case"rotation":a.setRotation(r).updateMatrix();break;case"scale":a.setScale(r).updateMatrix();break;case"weights":ey(a,r);break;case"visibility":a.setProps({display:0!==r[0]}),this.onVisibilityChange?.();break;default:E.R.warn(`Bad animation path ${t}`)()}}getTargetNode(e){let t=this.gltfNodeIdToNodeMap.get(e);if(!t)throw Error(`Cannot find animation target node ${e}`);return t}getSceneAnimationValue(e){if("camera"===e.type){let t=this.cameras[e.targetCameraIndex],r=t?.[e.projection]?.[e.property];return"number"==typeof r?[r]:[]}let t=this.lightDefinitions[e.targetLightIndex],r="innerConeAngle"===e.property||"outerConeAngle"===e.property?t?.spot?.[e.property]:t?.[e.property];return Array.isArray(r)?void 0===e.component?[...r]:[r[e.component]]:"number"==typeof r?[r]:[]}applySceneAnimationValue(e,t){if("camera"===e.type){let r=this.cameras[e.targetCameraIndex];r?.[e.projection]&&(r[e.projection][e.property]=t[0]);return}let r=this.lightDefinitions[e.targetLightIndex];if(r){if("innerConeAngle"===e.property||"outerConeAngle"===e.property)r.spot||={},r.spot[e.property]=t[0];else if(void 0!==e.component){let a=[...r[e.property]||[1,1,1]];a[e.component]=t[0],r[e.property]=a}else r[e.property]=1===t.length?t[0]:[...t];this.onLightChange?.()}}}class eK extends eF{mixer;activeClip;onUpdate;previousTimeSeconds;constructor(e){let t=new eD;super(e.animations.map((r,a)=>{let i=r.name||`Animation-${a}`;return new ez({gltfNodeIdToNodeMap:e.gltfNodeIdToNodeMap,onVisibilityChange:e.onVisibilityChange,cameras:e.cameras,lightDefinitions:e.lightDefinitions,onLightChange:e.onLightChange,materials:e.materials,mixer:t,animation:{name:i,channels:r.channels}})})),this.mixer=t,this.onUpdate=e.onUpdate,this.activeClip=this.clips[0]?.name,!1===e.autoplay?this.clips.forEach(e=>{e.playing=!1,e.action.stop()}):"first"===e.autoplay&&this.activeClip&&this.selectClip(this.activeClip)}setUpdateHandler(e){return this.onUpdate=e,this}setTime(e){let t=e/1e3,r=void 0===this.previousTimeSeconds?0:t-this.previousTimeSeconds;this.previousTimeSeconds=t;let a=r*this.mixer.timeScale;this.clips.forEach(e=>{if(!e.playing)return void e.action.stop();if(e.action.paused)return;e.action.resume();let r=Math.max(0,t-e.startTime)*e.speed;e.action.setTime(r-a*e.action.timeScale)}),this.mixer.update(r),this.onUpdate?.()}update(e){this.mixer.update(e),this.onUpdate?.()}selectClip(e,t={}){let r=this.clips.find(t=>t.name===e);if(!r)throw Error(`Unknown animation clip: ${e}`);let a=this.clips.find(e=>e.name===this.activeClip),i=t.crossFadeDuration||0;for(let e of this.clips)e===r||i>0&&e===a||(e.playing=!1,e.action.stop());return r.playing=!0,i>0&&a&&a!==r?(a.playing=!0,a.action.crossFadeTo(r.action,i)):r.action.reset().setEffectiveWeight(1).play(),this.activeClip=e,r}}class eq{bindings;scenes;constructor(e){this.scenes=e.scenes,this.bindings=function(e){let{gltf:t,gltfNodeIndexToNodeMap:r}=e,a=[],i=t.skins||[],n=new Set;for(let t of e.scenes)t.preorderTraversal(e=>{e instanceof U&&n.add(e)});for(let[e,o]of t.nodes.entries()){let s=o.skin;if(void 0===s||!o.mesh)continue;let l=function(e,t){return"number"==typeof t?t:(e.skins||[]).findIndex(r=>{if(r===t||t.id&&r.id===t.id)return!0;if(r.joints.length!==t.joints?.length||!r.joints.every((e,r)=>e===t.joints?.[r]))return!1;if("number"==typeof t.inverseBindMatrices){let a=e.accessors[t.inverseBindMatrices];return!r.inverseBindMatrices||r.inverseBindMatrices===a}return!0})}(t,s),c=i[l],f=r.get(e);if(!c||!f||!n.has(f))continue;let p=c.joints.flatMap(e=>{let t=r.get(e);return t?[t]:[]});if(p.length!==c.joints.length)continue;let u=o.mesh,m=f.userData.gltfMesh,d=m instanceof U?m:f.children.find(e=>e instanceof U&&e.id===(u.name||u.id));if(!(d instanceof U))continue;let b=d.children.flatMap(e=>e instanceof L?[e]:[]),h=c.inverseBindMatrices?.value;a.push({nodeIndex:e,skinIndex:l,node:f,joints:p,...h instanceof Float32Array?{inverseBindMatrices:h}:{},jointMatrices:new Float32Array(16*p.length),models:b})}return a}(e),this.update()}update(){if(0===this.bindings.length)return;let e=new Map;for(let t of this.scenes)t.preorderTraversal((t,{worldMatrix:r})=>{t instanceof U&&e.set(t,new A.Matrix4(r))});for(let t of this.bindings)for(let r of(!function(e){let{joints:t,meshNode:r,worldMatrices:a,inverseBindMatrices:i,target:n}=e,o=t.length,s=n&&n.length===16*o?n:new Float32Array(16*o),l=r?a.get(r)||r.matrix:void 0,c=l?new A.Matrix4(l).invert():null;for(let e=0;e<o;e++){let r=t[e],n=a.get(r)||r.matrix,o=c?new A.Matrix4(c).multiplyRight(n):new A.Matrix4(n),l=16*e;if(i&&i.length>=l+16){let e=new A.Matrix4;for(let t=0;t<16;t++)e[t]=i[l+t];o.multiplyRight(e)}s.set(o,l)}}({joints:t.joints,meshNode:t.node,worldMatrices:e,inverseBindMatrices:t.inverseBindMatrices,target:t.jointMatrices}),t.models))r.model.shaderInputs.setProps({skin:{jointMatrices:t.jointMatrices}})}getBinding(e){return this.bindings.find(t=>"number"==typeof e?t.nodeIndex===e:t.node===e)}}let eW={supportLevel:"none",standardStatus:"unknown",comment:"Not currently listed in the luma.gl glTF extension support registry."},eJ={KHR_draco_mesh_compression:{supportLevel:"built-in",standardStatus:"ratified",comment:"Decoded by loaders.gl before luma.gl builds the scenegraph."},EXT_meshopt_compression:{supportLevel:"built-in",standardStatus:"ratified",comment:"EXT meshopt-compressed buffer views are decoded by loaders.gl before rendering."},KHR_meshopt_compression:{supportLevel:"none",standardStatus:"release-candidate",comment:"The installed loaders.gl GLTFLoader supports EXT_meshopt_compression, not the KHR release candidate."},KHR_mesh_quantization:{supportLevel:"built-in",standardStatus:"ratified",comment:"Loader-materialized quantized accessors retain their typed values and normalization."},EXT_mesh_features:{supportLevel:"loader-only",standardStatus:"ratified",comment:"Feature identifiers are decoded by loaders.gl; automatic rendering and picking are application-owned."},EXT_structural_metadata:{supportLevel:"loader-only",standardStatus:"ratified",comment:"Structural metadata is decoded by loaders.gl; automatic rendering and querying are application-owned."},KHR_lights_punctual:{supportLevel:"built-in",standardStatus:"ratified",comment:"Parsed into luma.gl Light objects."},KHR_materials_unlit:{supportLevel:"built-in",standardStatus:"ratified",comment:"Unlit materials bypass the default lighting path."},KHR_materials_emissive_strength:{supportLevel:"built-in",standardStatus:"ratified",comment:"Applied by the stock PBR shader."},KHR_texture_basisu:{supportLevel:"built-in",standardStatus:"ratified",comment:"BasisU / KTX2 textures pass through when the device supports them."},KHR_texture_transform:{supportLevel:"built-in",standardStatus:"ratified",comment:"Per-slot UV transforms and animated pointers are applied at runtime; avoid duplicate legacy loader-side baking."},EXT_texture_webp:{supportLevel:"loader-only",standardStatus:"ratified",comment:"Texture source is resolved during load; final support depends on browser and device decode support."},EXT_texture_avif:{supportLevel:"none",standardStatus:"ratified",comment:"The image loader can decode supported AVIF images, but GLTFLoader does not select EXT_texture_avif sources."},KHR_materials_specular:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now applies specular factors and textures to the dielectric F0 term."},KHR_materials_ior:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now drives dielectric reflectance from the glTF IOR value."},KHR_materials_transmission:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now applies transmission to the base layer and exposes transparency through alpha, without a scene-color refraction buffer."},KHR_materials_volume:{supportLevel:"built-in",standardStatus:"ratified",comment:"Thickness and attenuation now tint transmitted light in the stock shader."},KHR_materials_clearcoat:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now adds a secondary clearcoat specular lobe."},KHR_materials_sheen:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now adds a sheen lobe for cloth-like materials."},KHR_materials_iridescence:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now tints specular response with a view-dependent thin-film iridescence approximation."},KHR_materials_anisotropy:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now shapes highlights and IBL response with an anisotropy-direction approximation."},KHR_materials_pbrSpecularGlossiness:{supportLevel:"loader-only",standardStatus:"archived",comment:"Extension data can be loaded, but it is not translated into the default metallic-roughness material path."},KHR_materials_variants:{supportLevel:"parsed-and-wired",standardStatus:"ratified",comment:"Primitive material variants can be selected and restored on the generated scenegraph."},EXT_mesh_gpu_instancing:{supportLevel:"built-in",standardStatus:"ratified",comment:"Accessor-backed instance transforms use one instanced draw per source primitive."},KHR_node_visibility:{supportLevel:"parsed-and-wired",standardStatus:"ratified",comment:"Recursive node visibility controls rendered geometry, punctual lights, and animation."},KHR_animation_pointer:{supportLevel:"parsed-and-wired",standardStatus:"ratified",comment:"Node transforms, morph weights and visibility, material factors, texture transforms, camera projections, and punctual lights are wired to runtime updates."},EXT_materials_bump:{supportLevel:"built-in",standardStatus:"draft",comment:"The experimental bump-map draft perturbs the canonical surface normal from a linear height texture."},KHR_materials_diffuse_transmission:{supportLevel:"built-in",standardStatus:"release-candidate",comment:"The Khronos release candidate adds energy-conserving back-lit diffuse transmission and independent color/factor textures."},KHR_materials_dispersion:{supportLevel:"parsed-and-wired",standardStatus:"ratified",comment:"The canonical PBR shader separates red, green, and blue transmission using wavelength-dependent refraction."},KHR_materials_volume_scatter:{supportLevel:"parsed-and-wired",standardStatus:"draft",comment:"The unratified volume-scattering draft is approximated per surface; random-walk and screen-space diffusion are not implemented."},KHR_xmp:{supportLevel:"none",standardStatus:"archived",comment:"Metadata payloads remain in the loaded glTF, but luma.gl does not interpret them."},KHR_xmp_json_ld:{supportLevel:"none",standardStatus:"ratified",comment:"Metadata is preserved in the glTF, but luma.gl does not interpret it."},EXT_lights_image_based:{supportLevel:"none",standardStatus:"multi-vendor",comment:"Use loadPBREnvironment() or custom environment setup instead."},EXT_texture_video:{supportLevel:"none",standardStatus:"multi-vendor",comment:"Video textures are not created automatically by the stock pipeline."},MSFT_lod:{supportLevel:"parsed-and-wired",standardStatus:"vendor",comment:"Node levels are parsed and selected by opt-in animated crowds; material LOD and GPU-driven selection are not implemented."}};function e$(e,t){var r;let a,i=Array.from((r=e,eX(a=new Set,r.extensionsUsed),eX(a,r.extensionsRequired),eX(a,r.extensionsRemoved),eX(a,Object.keys(r.extensions||{})),(r.lights?.length||(r.nodes||[]).some(e=>"light"in e))&&a.add("KHR_lights_punctual"),(r.materials||[]).some(e=>e.unlit||e.extensions?.KHR_materials_unlit)&&a.add("KHR_materials_unlit"),a)).sort(),n=new Set(e.extensionsRequired||[]);return new Map(i.map(r=>{var a;let i=eJ[r]||eW,o=function(e,t,r,a){if("KHR_texture_basisu"!==e||!a)return t;let i=(function(e){let t=[];for(let r of e.textures||[]){let e=r?.source?.image;if(!e?.compressed)continue;let a=Array.isArray(e.data)?e.data[0]:Array.isArray(e.mipmaps)?e.mipmaps[0]:void 0;t.push(a?.textureFormat??null)}return t})(r).find(e=>null===e||!a.isTextureFormatSupported(e));return void 0===i?t:{supportLevel:"none",comment:null===i?`The ${a.type} device cannot use a BasisU texture whose transcoded GPU format is missing.`:`The ${a.type} device does not support the transcoded BasisU texture format '${i}'.`}}(r,i,e,t);return[r,{extensionName:r,required:n.has(r),supported:"built-in"===(a=o.supportLevel)||"parsed-and-wired"===a,supportLevel:o.supportLevel,standardStatus:i.standardStatus,comment:o.comment}]}))}function eX(e,t=[]){for(let r of t)e.add(r)}function eY(e){switch(e){case"translation":case"rotation":case"scale":case"weights":return e;default:return null}}function eQ(e){let t=eZ(e);if(t){let e=eJ[t]||null;if(e?.supportLevel==="none")return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`no runtime target exists for material property "${e.join("/")}"`}function eZ(e){let t=e.indexOf("extensions"),r=e[t+1];return t>=0&&r?r:null}function e0(e,t){E.R.warn(`KHR_animation_pointer target ${e} will be skipped because ${t}`)()}function e3(e){if(e.value)return{value:e.value,components:e.components};let t=e.bufferView?.data;e1(void 0!==t),e1(5126===e.componentType);let r="SCALAR"===e.type?1:Number(e.type.slice(3));return{value:new Float32Array(t.buffer,t.byteOffset+(e.byteOffset||0),e.count*r),components:r}}function e1(e,t){if(!e)throw Error(t)}class e2{variants;names;activeVariant=null;modelNodes;constructor(e,t){let r=e.extensions?.KHR_materials_variants?.variants||[];this.variants=r.map((e,t)=>({name:e.name||`Variant-${t}`,index:t})),this.names=this.variants.map(e=>e.name);let a=new Set;for(let e of t)e.preorderTraversal(e=>{e instanceof L&&e.userData.gltfMaterialVariants&&a.add(e)});this.modelNodes=Array.from(a)}selectVariant(e){let t=this.variants.find(t=>t.name===e);if(!t)throw Error(`Unknown glTF material variant: ${e}`);for(let e of this.modelNodes){let r=e.userData.gltfMaterialVariants,a=r.mappings.get(t.index);e.model.setMaterial(a?.material||r.defaultMaterial),e.model.setParameters(a?.parameters||r.defaultParameters)}this.activeVariant=e}resetVariant(){for(let e of this.modelNodes){let t=e.userData.gltfMaterialVariants;e.model.setMaterial(t.defaultMaterial),e.model.setParameters(t.defaultParameters)}this.activeVariant=null}}function e9(e){if(!e)return{bounds:null,center:[0,0,0],size:[0,0,0],radius:.5,recommendedOrbitDistance:1};let t=[[e[0][0],e[0][1],e[0][2]],[e[1][0],e[1][1],e[1][2]]],r=[t[1][0]-t[0][0],t[1][1]-t[0][1],t[1][2]-t[0][2]],a=[t[0][0]+.5*r[0],t[0][1]+.5*r[1],t[0][2]+.5*r[2]],i=.5*Math.max(r[0],r[1],r[2]),n=Math.max(.5*Math.hypot(r[0],r[1],r[2]),.001);return{bounds:t,center:a,size:r,radius:n,recommendedOrbitDistance:Math.max(Math.max(i,.001)/Math.tan(Math.PI/6)*1.15,1.1*n)}}function e8(e,t,r){if(e.byteLength<=t+r)return"";let a=new DataView(e),i="";for(let e=0;e<r;e++)i+=String.fromCharCode(a.getUint8(t+e));return i}function e4(e,t,r){let a=void 0!==r?new Uint8Array(e).subarray(t,t+r):new Uint8Array(e).subarray(t);return new Uint8Array(a).buffer}async function e6(e,t,r,a){return a._parse(e,t,r,a)}var e5=r(61787),e7=r(88538);let te={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document};te.self||te.window||te.global,te.window||te.self||te.global,te.global||te.self||te.window,te.document;let tt="object"!=typeof e7||"[object process]"!==String(e7)||e7.browser,tr="function"==typeof importScripts;"u">typeof window&&window.orientation;let ta=void 0!==e7&&e7.version&&/v([0-9]*)/.exec(e7.version);ta&&parseFloat(ta[1]);let ti=(globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version="4.5.4"),globalThis._loadersgl_.version),tn={};function to(e={}){let t=e.useLocalLibraries??e.core?.useLocalLibraries,r=e.CDN??e.core?.CDN,a=e.modules;return{...void 0!==t?{useLocalLibraries:t}:{},...void 0!==r?{CDN:r}:{},...void 0!==a?{modules:a}:{}}}async function ts(e,t=null,r={},a=null){if(t){let i=r.modules?.[a||e];if(void 0!==i&&"string"!=typeof i)return i;e=function(e,t,r={},a=null){if(r?.core)throw Error("loadLibrary: options.core must be pre-normalized");a=a||e;let i=r.modules||{};if("string"==typeof i[a])return i[a];if(!r.useLocalLibraries&&e.startsWith("http"))return e;if(!tt)return`modules/${t}/dist/libs/${a}`;if(r.CDN){if(!r.CDN.startsWith("http"))throw Error("loaders.gl assertion failed.");return`${r.CDN}/${t}@${ti}/dist/libs/${a}`}return tr?`../src/libs/${a}`:`modules/${t}/src/libs/${a}`}(e,t,r,a)}return tn[e]=tn[e]||tl(e),await tn[e]}async function tl(e){if(e.endsWith("wasm"))return await tc(e);if(!tt){let{requireFromFile:t}=globalThis.loaders||{};try{let r=await t?.(e);if(r||!e.includes("/dist/libs/"))return r;return await t?.(e.replace("/dist/libs/","/src/libs/"))}catch(r){if(e.includes("/dist/libs/"))try{return await t?.(e.replace("/dist/libs/","/src/libs/"))}catch{}return console.error(r),null}}return tr?importScripts(e):function(e,t){if(!tt){let{requireFromString:r}=globalThis.loaders||{};return r?.(e,t)}if(tr)return eval.call(globalThis,e),null;let r=document.createElement("script");r.id=t;try{r.appendChild(document.createTextNode(e))}catch(t){r.text=e}return document.body.appendChild(r),null}(await tf(e),e)}async function tc(e){let{readFileAsArrayBuffer:t}=globalThis.loaders||{};if(tt||!t||e.startsWith("http")){let t=await fetch(e);return await t.arrayBuffer()}try{return await t(e)}catch{if(e.includes("/dist/libs/"))return await t(e.replace("/dist/libs/","/src/libs/"));throw Error(`Failed to load ArrayBuffer from ${e}`)}}async function tf(e){let{readFileAsText:t}=globalThis.loaders||{};if(tt||!t||e.startsWith("http")){let t=await fetch(e);return await t.text()}try{return await t(e)}catch{if(e.includes("/dist/libs/"))return await t(e.replace("/dist/libs/","/src/libs/"));throw Error(`Failed to load text from ${e}`)}}async function tp(e){var t;t=e.modules,globalThis.loaders||={},globalThis.loaders.modules||={},Object.assign(globalThis.loaders.modules,t);let r=globalThis.loaders?.modules?.basis||null;return r||(a||=tu(e),await a)}async function tu(e){var t,r;let a,i=null,n=null;return[i,n]=await Promise.all([await ts("basis_transcoder.js","textures",e),await ts("basis_transcoder.wasm","textures",e)]),i=i||globalThis.BASIS,await (t=i,a={},(r=n)&&(a.wasmBinary=r),new Promise(e=>{t(a).then(t=>{let{BasisFile:r,initializeBasis:a}=t;a(),e({BasisFile:r})})}))}async function tm(e){let t=e.modules||{};return t.basisEncoder?t.basisEncoder:(i=i||td(e),await i)}async function td(e){var t,r;let a,i=null,n=null;return[i,n]=await Promise.all([await ts("basis_encoder.js","textures",e),await ts("basis_encoder.wasm","textures",e)]),i=i||globalThis.BASIS,await (t=i,a={},(r=n)&&(a.wasmBinary=r),new Promise(e=>{t(a).then(t=>{let{BasisFile:r,KTX2File:a,initializeBasis:i,BasisEncoder:n}=t;i(),e({BasisFile:r,KTX2File:a,BasisEncoder:n})})}))}let tb=["","WEBKIT_","MOZ_"],th={WEBGL_compressed_texture_s3tc:["bc1-rgb-unorm-webgl","bc1-rgba-unorm","bc2-rgba-unorm","bc3-rgba-unorm"],WEBGL_compressed_texture_s3tc_srgb:["bc1-rgb-unorm-srgb-webgl","bc1-rgba-unorm-srgb","bc2-rgba-unorm-srgb","bc3-rgba-unorm-srgb"],EXT_texture_compression_rgtc:["bc4-r-unorm","bc4-r-snorm","bc5-rg-unorm","bc5-rg-snorm"],EXT_texture_compression_bptc:["bc6h-rgb-ufloat","bc6h-rgb-float","bc7-rgba-unorm","bc7-rgba-unorm-srgb"],WEBGL_compressed_texture_etc1:["etc1-rgb-unorm-webgl"],WEBGL_compressed_texture_etc:["etc2-rgb8unorm","etc2-rgb8unorm-srgb","etc2-rgb8a1unorm","etc2-rgb8a1unorm-srgb","etc2-rgba8unorm","etc2-rgba8unorm-srgb","eac-r11unorm","eac-r11snorm","eac-rg11unorm","eac-rg11snorm"],WEBGL_compressed_texture_pvrtc:["pvrtc-rgb4unorm-webgl","pvrtc-rgba4unorm-webgl","pvrtc-rgb2unorm-webgl","pvrtc-rgba2unorm-webgl"],WEBGL_compressed_texture_atc:["atc-rgb-unorm-webgl","atc-rgba-unorm-webgl","atc-rgbai-unorm-webgl"],WEBGL_compressed_texture_astc:["astc-4x4-unorm","astc-4x4-unorm-srgb","astc-5x4-unorm","astc-5x4-unorm-srgb","astc-5x5-unorm","astc-5x5-unorm-srgb","astc-6x5-unorm","astc-6x5-unorm-srgb","astc-6x6-unorm","astc-6x6-unorm-srgb","astc-8x5-unorm","astc-8x5-unorm-srgb","astc-8x6-unorm","astc-8x6-unorm-srgb","astc-8x8-unorm","astc-8x8-unorm-srgb","astc-10x5-unorm","astc-10x5-unorm-srgb","astc-10x6-unorm","astc-10x6-unorm-srgb","astc-10x8-unorm","astc-10x8-unorm-srgb","astc-10x10-unorm","astc-10x10-unorm-srgb","astc-12x10-unorm","astc-12x10-unorm-srgb","astc-12x12-unorm","astc-12x12-unorm-srgb"]},tg=null,tv=[171,75,84,88,32,50,48,187,13,10,26,10],tx=Promise.resolve(),t_={etc1:{basisFormat:0,compressed:!0,format:36196,textureFormat:"etc1-rgb-unorm-webgl"},etc2:{basisFormat:1,compressed:!0,format:37493,textureFormat:"etc2-rgba8unorm"},bc1:{basisFormat:2,compressed:!0,format:33776,textureFormat:"bc1-rgb-unorm-webgl"},bc3:{basisFormat:3,compressed:!0,format:33779,textureFormat:"bc3-rgba-unorm"},bc4:{basisFormat:4,compressed:!0,format:36283,textureFormat:"bc4-r-unorm"},bc5:{basisFormat:5,compressed:!0,format:36285,textureFormat:"bc5-rg-unorm"},"bc7-m6-opaque-only":{basisFormat:6,compressed:!0,format:36492,textureFormat:"bc7-rgba-unorm"},"bc7-m5":{basisFormat:7,compressed:!0,format:36492,textureFormat:"bc7-rgba-unorm"},"pvrtc1-4-rgb":{basisFormat:8,compressed:!0,format:35840,textureFormat:"pvrtc-rgb4unorm-webgl"},"pvrtc1-4-rgba":{basisFormat:9,compressed:!0,format:35842,textureFormat:"pvrtc-rgba4unorm-webgl"},"astc-4x4":{basisFormat:10,compressed:!0,format:37808,textureFormat:"astc-4x4-unorm"},"atc-rgb":{basisFormat:11,compressed:!0,format:35986,textureFormat:"atc-rgb-unorm-webgl"},"atc-rgba-interpolated-alpha":{basisFormat:12,compressed:!0,format:34798,textureFormat:"atc-rgbai-unorm-webgl"},rgba32:{basisFormat:13,compressed:!1,format:32856,textureFormat:"rgba8unorm"},rgb565:{basisFormat:14,compressed:!1,format:36194,textureFormat:"rgb565unorm-webgl"},bgr565:{basisFormat:15,compressed:!1,format:36194,textureFormat:"rgb565unorm-webgl"},rgba4444:{basisFormat:16,compressed:!1,format:32854,textureFormat:"rgba4unorm-webgl"}};async function tS(e){let t,r=tx;tx=new Promise(e=>{t=e}),await r;try{return await e()}finally{t()}}async function tR(e,t={}){let r=to(t);return await tS(async()=>{if(!t.basis?.containerFormat||"auto"===t.basis.containerFormat){let a;if(!((a=new Uint8Array(e)).byteLength<tv.length||a[0]!==tv[0]||a[1]!==tv[1]||a[2]!==tv[2]||a[3]!==tv[3]||a[4]!==tv[4]||a[5]!==tv[5]||a[6]!==tv[6]||a[7]!==tv[7]||a[8]!==tv[8]||a[9]!==tv[9]||a[10]!==tv[10]||a[11]!==tv[11]))return ty((await tm(r)).KTX2File,e,t);let{BasisFile:i}=await tp(r);return tT(i,e,t)}if("encoder"===t.basis.module){let a=await tm(r);return"ktx2"===t.basis.containerFormat?ty(a.KTX2File,e,t):tT(a.BasisFile,e,t)}{let{BasisFile:a}=await tp(r);return tT(a,e,t)}})}function tT(e,t,r){let a=new e(new Uint8Array(t));try{if(!a.startTranscoding())throw Error("Failed to start basis transcoding");let e=a.getNumImages(),t=[];for(let i=0;i<e;i++){let e=a.getNumLevels(i),n=[];for(let t=0;t<e;t++)n.push(function(e,t,r,a){let i=e.getImageWidth(t,r),n=e.getImageHeight(t,r),o=e.getHasAlpha(),{compressed:s,format:l,basisFormat:c,textureFormat:f}=tA(a,o),p=new Uint8Array(e.getImageTranscodedSizeInBytes(t,r,c));if(!e.transcodeImage(p,t,r,c,0,0))throw Error("failed to start Basis transcoding");return{shape:"texture-level",width:i,height:n,data:p,compressed:s,...void 0!==l?{format:l}:{},...void 0!==f?{textureFormat:f}:{},hasAlpha:o}}(a,i,t,r));t.push(n)}return t}finally{a.close(),a.delete()}}function ty(e,t,r){let a=new e(new Uint8Array(t));try{if(!a.startTranscoding())throw Error("failed to start KTX2 transcoding");let e=a.getLevels(),t=[];for(let i=0;i<e;i++)t.push(function(e,t,r){let{alphaFlag:a,height:i,width:n}=e.getImageLevelInfo(t,0,0),{compressed:o,format:s,basisFormat:l,textureFormat:c}=tA(r,a),f=e.getImageTranscodedSizeInBytes(t,0,0,l),p=new Uint8Array(f);if(!e.transcodeImage(p,t,0,0,l,0,-1,-1))throw Error("Failed to transcode KTX2 image");return{shape:"texture-level",width:n,height:i,data:p,compressed:o,...void 0!==s?{format:s}:{},...void 0!==c?{textureFormat:c}:{},levelSize:f,hasAlpha:a}}(a,i,r));return[t]}finally{a.close(),a.delete()}}function tA(e,t){let r=e.basis?.format||"auto";"auto"===r&&(r=e.basis?.supportedTextureFormats?tM(e.basis.supportedTextureFormats):tM()),"object"==typeof r&&(r=t?r.alpha:r.noAlpha);let a=t_[r.toLowerCase()];if(!a)throw Error(`Unknown Basis format ${r}`);return a}function tM(e=function(e){if(!tg){for(let t of(e=e||function(){try{return document.createElement("canvas").getContext("webgl")}catch(e){return null}}()||void 0,tg=new Set,tb))for(let r in th)if(e&&e.getExtension(`${t}${r}`))for(let e of th[r])tg.add(e)}return tg}()){let t=new Set(e);if(tI(t,["astc-4x4-unorm","astc-4x4-unorm-srgb"]))return"astc-4x4";if(tI(t,["bc7-rgba-unorm","bc7-rgba-unorm-srgb"]))return{alpha:"bc7-m5",noAlpha:"bc7-m6-opaque-only"};if(tI(t,["bc1-rgb-unorm-webgl","bc1-rgb-unorm-srgb-webgl","bc1-rgba-unorm","bc1-rgba-unorm-srgb","bc2-rgba-unorm","bc2-rgba-unorm-srgb","bc3-rgba-unorm","bc3-rgba-unorm-srgb"]))return{alpha:"bc3",noAlpha:"bc1"};if(tI(t,["pvrtc-rgb4unorm-webgl","pvrtc-rgba4unorm-webgl","pvrtc-rgb2unorm-webgl","pvrtc-rgba2unorm-webgl"]))return{alpha:"pvrtc1-4-rgba",noAlpha:"pvrtc1-4-rgb"};if(tI(t,["etc2-rgb8unorm","etc2-rgb8unorm-srgb","etc2-rgb8a1unorm","etc2-rgb8a1unorm-srgb","etc2-rgba8unorm","etc2-rgba8unorm-srgb","eac-r11unorm","eac-r11snorm","eac-rg11unorm","eac-rg11snorm"]))return"etc2";else if(t.has("etc1-rgb-unorm-webgl"))return"etc1";else if(tI(t,["atc-rgb-unorm-webgl","atc-rgba-unorm-webgl","atc-rgbai-unorm-webgl"]))return{alpha:"atc-rgba-interpolated-alpha",noAlpha:"atc-rgb"};return"rgb565"}function tI(e,t){return t.some(t=>e.has(t))}Object.freeze(Object.keys(t_));let tC={dataType:null,batchType:null,name:"Basis",id:"basis",module:"textures",version:"4.4.5",worker:!0,extensions:["basis","ktx2"],mimeTypes:["application/octet-stream","image/ktx2"],tests:["sB"],binary:!0,options:{basis:{format:"auto",containerFormat:"auto",module:"transcoder"}},parse:tR};function tE(e,t){if(!e)throw Error(t||"assert failed: gltf")}function tw(e,t){if(!e)throw Error(t||"loader assertion failed.")}function tN(e,t){return tw(e>=0),tw(t>0),e+(t-1)&~(t-1)}function tP(e,t,r,a){let i=new Uint8Array(t.buffer,r,a);return e.json=JSON.parse(new TextDecoder("utf8").decode(i)),tN(a,4)}function tU(e,t,r,a){return e.header.hasBinChunk=!0,e.binChunks.push({byteOffset:r,byteLength:a,arrayBuffer:t.buffer}),tN(a,4)}function tL(e,t,r){if(e.startsWith("data:")||e.startsWith("http:")||e.startsWith("https:"))return e;let a=r?.baseUrl||function(e){if(!e)return;if(e.endsWith("/"))return e;let t=e.lastIndexOf("/");return t>=0?e.slice(0,t+1):""}(t?.core?.baseUrl);if(!a)throw Error(`'baseUrl' must be provided to resolve relative url ${e}`);return a.endsWith("/")?`${a}${e}`:`${a}/${e}`}let tF={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},tO={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},tk=["SCALAR","VEC2","VEC3","VEC4"],tV=new Map([[Int8Array,5120],[Uint8Array,5121],[Int16Array,5122],[Uint16Array,5123],[Uint32Array,5125],[Float32Array,5126],[Float64Array,5130]]),tj={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},tD={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},tH={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};function tB(e){return tk[e-1]||tk[0]}function tG(e){let t=tV.get(e.constructor);if(!t)throw Error("Illegal typed array");return t}function tz(e,t){let r=tH[e.componentType],a=tj[e.type],i=tD[e.componentType],n=e.count*a,o=e.count*a*i;return tE(o>=0&&o<=t.byteLength),{ArrayType:r,length:n,byteLength:o,componentByteSize:tO[e.componentType],numberOfComponentsInElement:tF[e.type]}}var tK=r(54551);class tq{gltf;sourceBuffers;byteLength;constructor(e){this.gltf={json:e?.json||{asset:{version:"2.0",generator:"loaders.gl"},buffers:[],extensions:{},extensionsRequired:[],extensionsUsed:[]},buffers:e?.buffers||[],images:e?.images||[]},this.sourceBuffers=[],this.byteLength=0,this.gltf.buffers&&this.gltf.buffers[0]&&(this.byteLength=this.gltf.buffers[0].byteLength,this.sourceBuffers=[this.gltf.buffers[0]])}get json(){return this.gltf.json}getApplicationData(e){return this.json[e]}getExtraData(e){return(this.json.extras||{})[e]}hasExtension(e){let t=this.getUsedExtensions().find(t=>t===e),r=this.getRequiredExtensions().find(t=>t===e);return"string"==typeof t||"string"==typeof r}getExtension(e){let t=this.getUsedExtensions().find(t=>t===e),r=this.json.extensions||{};return t?r[e]:null}getRequiredExtension(e){return this.getRequiredExtensions().find(t=>t===e)?this.getExtension(e):null}getRequiredExtensions(){return this.json.extensionsRequired||[]}getUsedExtensions(){return this.json.extensionsUsed||[]}getRemovedExtensions(){return this.json.extensionsRemoved||[]}getObjectExtension(e,t){return(e.extensions||{})[t]}getScene(e){return this.getObject("scenes",e)}getNode(e){return this.getObject("nodes",e)}getSkin(e){return this.getObject("skins",e)}getMesh(e){return this.getObject("meshes",e)}getMaterial(e){return this.getObject("materials",e)}getAccessor(e){return this.getObject("accessors",e)}getTexture(e){return this.getObject("textures",e)}getSampler(e){return this.getObject("samplers",e)}getImage(e){return this.getObject("images",e)}getBufferView(e){return this.getObject("bufferViews",e)}getBuffer(e){return this.getObject("buffers",e)}getObject(e,t){if("object"==typeof t)return t;let r=this.json[e]&&this.json[e][t];if(!r)throw Error(`glTF file error: Could not find ${e}[${t}]`);return r}getTypedArrayForBufferView(e){let t=(e=this.getBufferView(e)).buffer,r=this.gltf.buffers[t];tE(r);let a=(e.byteOffset||0)+r.byteOffset;return new Uint8Array(r.arrayBuffer,a,e.byteLength)}getTypedArrayForAccessor(e){let t=this.getAccessor(e);return function(e,t,r){let a="number"==typeof r?e.accessors?.[r]:r;if(!a)throw Error(`No gltf accessor ${JSON.stringify(r)}`);let i=e.bufferViews?.[a.bufferView||0];if(!i)throw Error(`No gltf buffer view for accessor ${i}`);let{arrayBuffer:n,byteOffset:o}=t[i.buffer],s=(o||0)+(a.byteOffset||0)+(i.byteOffset||0),{ArrayType:l,length:c,componentByteSize:f,numberOfComponentsInElement:p}=tz(a,i),u=f*p,m=i.byteStride||u;if(void 0===i.byteStride||i.byteStride===u)return new l(n,s,c);let d=new l(c);for(let e=0;e<a.count;e++){let t=new l(n,s+e*m,p);d.set(t,e*p)}return d}(this.gltf.json,this.gltf.buffers,t)}getTypedArrayForImageData(e){e=this.getAccessor(e);let t=this.getBufferView(e.bufferView);return new Uint8Array(this.getBuffer(t.buffer).data,t.byteOffset||0,t.byteLength)}addApplicationData(e,t){return this.json[e]=t,this}addExtraData(e,t){return this.json.extras=this.json.extras||{},this.json.extras[e]=t,this}addObjectExtension(e,t,r){return e.extensions=e.extensions||{},e.extensions[t]=r,this.registerUsedExtension(t),this}setObjectExtension(e,t,r){(e.extensions||{})[t]=r}removeObjectExtension(e,t){let r=e?.extensions||{};if(r[t]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];let e=this.json.extensionsRemoved;e.includes(t)||e.push(t)}delete r[t]}addExtension(e,t={}){return tE(t),this.json.extensions=this.json.extensions||{},this.json.extensions[e]=t,this.registerUsedExtension(e),t}addRequiredExtension(e,t={}){return tE(t),this.addExtension(e,t),this.registerRequiredExtension(e),t}registerUsedExtension(e){this.json.extensionsUsed=this.json.extensionsUsed||[],this.json.extensionsUsed.find(t=>t===e)||this.json.extensionsUsed.push(e)}registerRequiredExtension(e){this.registerUsedExtension(e),this.json.extensionsRequired=this.json.extensionsRequired||[],this.json.extensionsRequired.find(t=>t===e)||this.json.extensionsRequired.push(e)}removeExtension(e){if(this.json.extensions?.[e]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];let t=this.json.extensionsRemoved;t.includes(e)||t.push(e)}this.json.extensions&&delete this.json.extensions[e],this.json.extensionsRequired&&this._removeStringFromArray(this.json.extensionsRequired,e),this.json.extensionsUsed&&this._removeStringFromArray(this.json.extensionsUsed,e)}setDefaultScene(e){this.json.scene=e}addScene(e){let{nodeIndices:t}=e;return this.json.scenes=this.json.scenes||[],this.json.scenes.push({nodes:t}),this.json.scenes.length-1}addNode(e){let{meshIndex:t,matrix:r}=e;this.json.nodes=this.json.nodes||[];let a={mesh:t};return r&&(a.matrix=r),this.json.nodes.push(a),this.json.nodes.length-1}addMesh(e){let{attributes:t,indices:r,material:a,mode:i=4}=e,n={primitives:[{attributes:this._addAttributes(t),mode:i}]};if(r){let e=this._addIndices(r);n.primitives[0].indices=e}return Number.isFinite(a)&&(n.primitives[0].material=a),this.json.meshes=this.json.meshes||[],this.json.meshes.push(n),this.json.meshes.length-1}addPointCloud(e){let t=this._addAttributes(e);return this.json.meshes=this.json.meshes||[],this.json.meshes.push({primitives:[{attributes:t,mode:0}]}),this.json.meshes.length-1}addImage(e,t){let r=(0,tK.m)(e),a=t||r?.mimeType,i=this.addBufferView(e);return this.json.images=this.json.images||[],this.json.images.push({bufferView:i,mimeType:a}),this.json.images.length-1}addBufferView(e,t=0,r=this.byteLength){let a=e.byteLength;return tE(Number.isFinite(a)),this.sourceBuffers=this.sourceBuffers||[],this.sourceBuffers.push(e),this.byteLength+=tN(a,4),this.json.bufferViews=this.json.bufferViews||[],this.json.bufferViews.push({buffer:t,byteOffset:r,byteLength:a}),this.json.bufferViews.length-1}addAccessor(e,t){let r={bufferView:e,type:tB(t.size),componentType:t.componentType,count:t.count,max:t.max,min:t.min};return this.json.accessors=this.json.accessors||[],this.json.accessors.push(r),this.json.accessors.length-1}addBinaryBuffer(e,t={size:3}){let r=this.addBufferView(e),a={min:t.min,max:t.max};a.min&&a.max||(a=this._getAccessorMinMax(e,t.size));let i={size:t.size,componentType:tG(e),count:Math.round(e.length/t.size),min:a.min,max:a.max};return this.addAccessor(r,Object.assign(i,t))}addTexture(e){let{imageIndex:t}=e;return this.json.textures=this.json.textures||[],this.json.textures.push({source:t}),this.json.textures.length-1}addMaterial(e){return this.json.materials=this.json.materials||[],this.json.materials.push(e),this.json.materials.length-1}createBinaryChunk(){let e=this.byteLength,t=new ArrayBuffer(e),r=new Uint8Array(t),a=0;for(let e of this.sourceBuffers||[])a=function(e,t,r){let a;if(e instanceof ArrayBuffer)a=new Uint8Array(e);else{let t=e.byteOffset,r=e.byteLength;a=new Uint8Array(e.buffer||e.arrayBuffer,t,r)}return t.set(a,r),r+tN(a.byteLength,4)}(e,r,a);this.json?.buffers?.[0]?this.json.buffers[0].byteLength=e:this.json.buffers=[{byteLength:e}],this.gltf.binary=t,this.sourceBuffers=[t],this.gltf.buffers=[{arrayBuffer:t,byteOffset:0,byteLength:t.byteLength}]}_removeStringFromArray(e,t){let r=!0;for(;r;){let a=e.indexOf(t);a>-1?e.splice(a,1):r=!1}}_addAttributes(e={}){let t={};for(let r in e){let a=e[r],i=this._getGltfAttributeName(r),n=this.addBinaryBuffer(a.value,a);t[i]=n}return t}_addIndices(e){return this.addBinaryBuffer(e,{size:1})}_getGltfAttributeName(e){switch(e.toLowerCase()){case"position":case"positions":case"vertices":return"POSITION";case"normal":case"normals":return"NORMAL";case"color":case"colors":return"COLOR_0";case"texcoord":case"texcoords":return"TEXCOORD_0";default:return e}}_getAccessorMinMax(e,t){let r={min:null,max:null};if(e.length<t)return r;for(let a of(r.min=[],r.max=[],e.subarray(0,t)))r.min.push(a),r.max.push(a);for(let a=t;a<e.length;a+=t)for(let i=0;i<t;i++)r.min[0+i]=Math.min(r.min[0+i],e[a+i]),r.max[0+i]=Math.max(r.max[0+i],e[a+i]);return r}}var tW=r(78624);function tJ(e){if(e instanceof ArrayBuffer)return e;if("u">typeof SharedArrayBuffer&&e instanceof SharedArrayBuffer)return t$(e);let{buffer:t,byteOffset:r,byteLength:a}=e;return t instanceof ArrayBuffer&&0===r&&a===t.byteLength?t:t$(t,r,a)}function t$(e,t=0,r=e.byteLength-t){let a=new Uint8Array(e,t,r),i=new Uint8Array(a.length);return i.set(a),i.buffer}let tX={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16,BOOLEAN:1,STRING:1,ENUM:1},tY={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:BigInt64Array,UINT64:BigUint64Array,FLOAT32:Float32Array,FLOAT64:Float64Array},tQ={INT8:1,UINT8:1,INT16:2,UINT16:2,INT32:4,UINT32:4,INT64:8,UINT64:8,FLOAT32:4,FLOAT64:8};function tZ(e,t,r,a){if("UINT8"!==r&&"UINT16"!==r&&"UINT32"!==r&&"UINT64"!==r)return null;let i=t0(e.getTypedArrayForBufferView(t),"SCALAR",r,a+1);return i instanceof BigInt64Array||i instanceof BigUint64Array?null:i}function t0(e,t,r,a=1){let i=tX[t],n=tY[r],o=tQ[r],s=a*i,l=s*o,c=e.buffer,f=e.byteOffset;return f%o!=0&&(c=new Uint8Array(c).slice(f,f+l).buffer,f=0),new n(tJ(c),f,s)}function t3(e,t,r){let a=`TEXCOORD_${t.texCoord||0}`,i=r.attributes[a],n=e.getTypedArrayForAccessor(i),o=e.gltf.json,s=t.index,l=o.textures?.[s]?.source;if(void 0!==l){let r=o.images?.[l]?.mimeType,a=e.gltf.images?.[l];if(a&&void 0!==a.width){let e=[];for(let i=0;i<n.length;i+=2){let o=function(e,t,r,a,i=[0]){let n={r:{offset:0,shift:0},g:{offset:1,shift:8},b:{offset:2,shift:16},a:{offset:3,shift:24}},o=r[a],s=r[a+1],l=1;t&&(-1!==t.indexOf("image/jpeg")||-1!==t.indexOf("image/png"))&&(l=4);let c=function(e,t,r,a=1){let i=r.width,n=Math.round((e%1+1)%1*(i-1));return(Math.round((t%1+1)%1*(r.height-1))*i+n)*(r.components?r.components:a)}(o,s,e,l),f=0;for(let t of i){let r="number"==typeof t?Object.values(n)[t]:n[t],a=c+r.offset,i=(0,tW.M5)(e);if(i.data.length<=a)throw Error(`${i.data.length} <= ${a}`);f|=i.data[a]<<r.shift}return f}(a,r,n,i,t.channels);e.push(o)}return e}}return[]}function t1(e,t,r,a,i){if(!r?.length)return;let n=[];for(let e of r){let t=a.findIndex(t=>t===e);-1===t&&(t=a.push(e)-1),n.push(t)}let o=new Uint32Array(n),s=e.gltf.buffers.push({arrayBuffer:o.buffer,byteOffset:o.byteOffset,byteLength:o.byteLength})-1,l=e.addBufferView(o,s,0),c=e.addAccessor(l,{size:1,componentType:tG(o),count:o.length});i.attributes[t]=c}function t2(e,t,r,a,i){let n=[];for(let o=0;o<t;o++){let t=r[o],s=r[o+1]-r[o];if(s+t>a)break;let l=t/i,c=s/i;n.push(e.slice(l,l+c))}return n}function t9(e,t,r){let a=[];for(let i=0;i<t;i++){let t=i*r;a.push(e.slice(t,t+r))}return a}function t8(e,t,r,a){if(r)throw Error("Not implemented - arrayOffsets for strings is specified");if(a){let r=[],i=new TextDecoder("utf8"),n=0;for(let o=0;o<e;o++){let e=a[o+1]-a[o];if(e+n<=t.length){let a=t.subarray(n,e+n),o=i.decode(a);r.push(o),n+=e}}return r}return[]}let t4="EXT_mesh_features",t6=t4;async function t5(e,t){var r=new tq(e),a=t;let i=r.gltf.json;if(i.meshes)for(let e of i.meshes)for(let t of e.primitives)!function(e,t,r){if(!r?.gltf?.loadBuffers)return;let a=t.extensions?.[t4],i=a?.featureIds;if(i)for(let a of i){let i;if(void 0!==a.attribute){let r=`_FEATURE_ID_${a.attribute}`,n=t.attributes[r];i=e.getTypedArrayForAccessor(n)}else i=void 0!==a.texture&&r?.gltf?.loadImages?t3(e,a.texture,t):[];a.data=i}}(r,t,a)}function t7(e,t){let r=new tq(e);return function(e){let t=e.gltf.json.meshes;if(t)for(let r of t)for(let t of r.primitives)!function(e,t){let r=t.extensions?.[t4];if(!r)return;let a=r.featureIds;a.forEach((r,i)=>{if(r.data){let{accessorKey:n,index:o}=function(e){let t="_FEATURE_ID_",r=Object.keys(e).filter(e=>0===e.indexOf(t)),a=-1;for(let e of r){let r=Number(e.substring(t.length));r>a&&(a=r)}return a++,{accessorKey:`${t}${a}`,index:a}}(t.attributes),s=new Uint32Array(r.data);a[i]={featureCount:s.length,propertyTable:r.propertyTable,attribute:o},e.gltf.buffers.push({arrayBuffer:s.buffer,byteOffset:s.byteOffset,byteLength:s.byteLength});let l=e.addBufferView(s),c=e.addAccessor(l,{size:1,componentType:tG(s),count:s.length});t.attributes[n]=c}})}(e,t)}(r),r.createBinaryChunk(),r.gltf}function re(e,t,r,a){t.extensions||(t.extensions={});let i=t.extensions[t4];i||(i={featureIds:[]},t.extensions[t4]=i);let{featureIds:n}=i,o={featureCount:r.length,propertyTable:a,data:r};n.push(o),e.addObjectExtension(t,t4,i)}let rt="EXT_structural_metadata",rr=rt;async function ra(e,t){!function(e,t){if(!t.gltf?.loadBuffers)return;let r=e.getExtension(rt);r&&(t.gltf?.loadImages&&function(e,t){let r=t.propertyTextures,a=e.gltf.json;if(r&&a.meshes)for(let i of a.meshes)for(let a of i.primitives)!function(e,t,r,a){if(!t)return;let i=r.extensions?.[rt],n=i?.propertyTextures;if(n)for(let i of n)!function(e,t,r,a){if(!t.properties)return;a.dataAttributeNames||(a.dataAttributeNames=[]);let i=t.class;for(let n in t.properties){let o=`${i}_${n}`,s=t.properties?.[n];if(!s)continue;s.data||(s.data=[]);let l=s.data,c=t3(e,s,r);null!==c&&(t1(e,o,c,l,r),s.data=l,a.dataAttributeNames.push(o))}}(e,t[i],r,a)}(e,r,a,t)}(e,r),function(e,t){let r=t.schema;if(!r)return;let a=r.classes,i=t.propertyTables;if(a&&i)for(let t in a){let a=function(e,t){for(let r of e)if(r.class===t)return r;return null}(i,t);a&&function(e,t,r){let a=t.classes?.[r.class];if(!a)throw Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${r.class}`);let i=r.count;for(let n in a.properties){let o=a.properties[n],s=r.properties?.[n];if(s){let r=function(e,t,r,a,i){var n,o,s,l,c,f,p;let u=[],m=i.values,d=e.getTypedArrayForBufferView(m),b=(n=e,o=r,s=i,l=a,o.array&&void 0===o.count&&void 0!==s.arrayOffsets?tZ(n,s.arrayOffsets,s.arrayOffsetType||"UINT32",l):null),h=(c=e,f=i,p=a,void 0!==f.stringOffsets?tZ(c,f.stringOffsets,f.stringOffsetType||"UINT32",p):null);switch(r.type){case"SCALAR":case"VEC2":case"VEC3":case"VEC4":case"MAT2":case"MAT3":case"MAT4":u=function(e,t,r,a){var i;let n,o=e.array,s=e.count,l=(i=e.type,tQ[e.componentType]*tX[i]),c=r.byteLength/l;return(n=e.componentType?t0(r,e.type,e.componentType,c):r,o)?a?t2(n,t,a,r.length,l):s?t9(n,t,s):[]:n}(r,a,d,b);break;case"BOOLEAN":throw Error(`Not implemented - classProperty.type=${r.type}`);case"STRING":u=t8(a,d,b,h);break;case"ENUM":u=function(e,t,r,a,i){var n;let o=t.enumType;if(!o)throw Error("Incorrect data in the EXT_structural_metadata extension: classProperty.enumType is not set for type ENUM");let s=e.enums?.[o];if(!s)throw Error(`Incorrect data in the EXT_structural_metadata extension: schema.enums does't contain ${o}`);let l=s.valueType||"UINT16",c=(n=t.type,tQ[l]*tX[n]),f=a.byteLength/c,p=t0(a,t.type,l,f);if(p||(p=a),t.array){if(i)return function(e){let{valuesData:t,numberOfElements:r,arrayOffsets:a,valuesDataBytesLength:i,elementSize:n,enumEntry:o}=e,s=[];for(let e=0;e<r;e++){let r=a[e],l=a[e+1]-a[e];if(l+r>i)break;let c=rn(t,r/n,l/n,o);s.push(c)}return s}({valuesData:p,numberOfElements:r,arrayOffsets:i,valuesDataBytesLength:a.length,elementSize:c,enumEntry:s});let e=t.count;return e?function(e,t,r,a){let i=[];for(let n=0;n<t;n++){let t=rn(e,r*n,r,a);i.push(t)}return i}(p,r,e,s):[]}return rn(p,0,r,s)}(t,r,a,d,b);break;default:throw Error(`Unknown classProperty type ${r.type}`)}return u}(e,t,o,i,s);s.data=r}}}(e,r,a)}}(e,r))}(new tq(e),t)}function ri(e,t){let r=new tq(e);return function(e){let t=e.getExtension(rt);if(t&&t.propertyTables)for(let r of t.propertyTables){let a=r.class,i=t.schema?.classes?.[a];r.properties&&i&&function(e,t,r){for(let a in e.properties){let i=e.properties[a].data;if(i){let n=t.properties[a];if(n){let t=function(e,t,r){let a={values:0};if("STRING"===t.type){let{stringData:t,stringOffsets:i}=function(e){let t=new TextEncoder,r=[],a=0;for(let i of e){let e=t.encode(i);a+=e.length,r.push(e)}let i=new Uint8Array(a),n=[],o=0;for(let e of r)i.set(e,o),n.push(o),o+=e.length;return n.push(o),{stringData:i,stringOffsets:new Uint32Array(n)}}(e);a.stringOffsets=rl(i,r),a.values=rl(t,r)}else"SCALAR"===t.type&&t.componentType&&(a.values=rl(function(e,t){let r=[];for(let t of e)r.push(Number(t));let a=rs[t];if(!a)throw Error("Illegal component type");return new a(r)}(e,t.componentType),r));return a}(i,n,r);e.properties[a]=t}}}}(r,i,e)}}(r),r.createBinaryChunk(),r.gltf}function rn(e,t,r,a){let i=[];for(let n=0;n<r;n++)if(e instanceof BigInt64Array||e instanceof BigUint64Array)i.push("");else{let r=function(e,t){for(let r of e.values)if(r.value===t)return r;return null}(a,e[t+n]);r?i.push(r.name):i.push("")}return i}function ro(e,t,r="schemaClassId"){let a=e.getExtension(rt);a||(a=e.addExtension(rt)),a.schema=function(e,t,r){let a=r??{id:"schema_id"},i={properties:{}};for(let t of e){let e={type:t.elementType,componentType:t.componentType};i.properties[t.name]=e}return a.classes={},a.classes[t]=i,a}(t,r,a.schema);let i=function(e,t,r){let a={class:t,count:0},i=0,n=r.classes?.[t];for(let t of e){if(0===i&&(i=t.values.length),i!==t.values.length&&t.values.length)throw Error("Illegal values in attributes");n?.properties[t.name]&&(a.properties||(a.properties={}),a.properties[t.name]={values:0,data:t.values})}return a.count=i,a}(t,r,a.schema);return a.propertyTables||(a.propertyTables=[]),a.propertyTables.push(i)-1}let rs={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:Int32Array,UINT64:Uint32Array,FLOAT32:Float32Array,FLOAT64:Float64Array};function rl(e,t){return t.gltf.buffers.push({arrayBuffer:tJ(e.buffer),byteOffset:e.byteOffset,byteLength:e.byteLength}),t.addBufferView(e)}var rc=function(){var e,t=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),r=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if("object"!=typeof WebAssembly)return{supported:!1};var a=WebAssembly.validate(t)?n("b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuixkbbebeeddddilve9Weeeviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WbwY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbDl79IV9Rbqq:I9Dklbzik94evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaeai86b:q:W:cjbaecitab8Piw83i:q:G:cjbaecefgecjd9hmbkk:SBlEud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaialfgxar9RhodnadTgmmbavaoad;8qbbkaicefhPcj;abad9Uc;WFbGcjdadca0EhsdndndnadTmbaoadfhzcbhHinaeaH9nmdaxaP9RaD6miabaHad2fgOavcjdfasaeaH9RaHasfae6EgAaAcsfgoc9WGgCSEhXaPaDfhQaocl4cifcd4hLavcj;cbfaCcetfhKavcj;cbfaCci2fhYavcj;cbfaCfh8AcbhEaoc;ab6h3incbh5dnawTmbaPaEcd4fRbbh5kcbh8Eavcj;cbfh8Findndndndna5a8Ecet4ciGgoc9:fPdebdkaxaQ9RaC6mwdnaCTmbavcj;cbfa8EaC2faQaC;8qbbkaQaAfhQxdkaCTmeavcj;cbfa8EaC2fcbaC;8kbxekaxaQ9RaL6moaoclVcbawEhraQaLfhocbhidna3mbaxao9Rc;Gb6mbcbhlina8FalfhidndndndndndnaQalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaiaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaiczfaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaicafaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsaap5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbaiaoclffaqRb:q:W:cjbfhoxikaic8Wfaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsaap5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbaiaocwffaqRb:q:W:cjbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitpbi:q:G:cjbaiRb:q:W:cjbgipsaoRbegqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqRb:q:W:cjbfhokalc;abfhialcjefaC0meaihlaxao9Rc;Fb0mbkkdnaiaC9pmbaici4hlinaxao9RcK6mwa8FaifhqdndndndndndnaQaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spkbbagaoclffa8JRb:q:W:cjbfhoxikaqaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spkbbagaocwffa8JRb:q:W:cjbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpkbbagaocdffa8JRb:q:W:cjbfhokalcdfhlaiczfgiaC6mbkkaohQaoTmoka8FaCfh8Fa8Ecefg8Ecl9hmbkdndndndnawTmbazaEcd4fRbbglciGPlbedwbkaCTmdaXaEfhlavaEfpbdbh8Kcbhoinalavcj;cbfaofpblbg8La8Aaofpblbg8MpmbzeHdOiAlCvXoQrLg8NaKaofpblbgyaYaofpblbg8PpmbzeHdOiAlCvXoQrLgIpmbezHdiOAlvCXorQLgacep9Taapxeeeeeeeeeeeeeeeeghp9op9Hp9rgaa8Kp9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8NaIpmwDKYqk8AExm35Ps8E8Fgacep9Taaahp9op9Hp9rgap9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8La8MpmwKDYq8AkEx3m5P8Es8Fg8Laya8PpmwKDYq8AkEx3m5P8Es8Fg8MpmbezHdiOAlvCXorQLgacep9Taaahp9op9Hp9rgap9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8La8MpmwDKYqk8AExm35Ps8E8Fgacep9Taaahp9op9Hp9rgap9Ughp9Abbbaladfglahaaaapmlvorlvorlvorlvorp9Ughp9AbbbaladfglahaaaapmwDqkwDqkwDqkwDqkp9Ughp9AbbbaladfglahaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9AbbbaladfhlaoczfgoaC6mbxikkaCTmeaXaEfhlavaEfpbdbh8Kcbhoinalavcj;cbfaofpblbg8La8Aaofpblbg8MpmbzeHdOiAlCvXoQrLg8NaKaofpblbgyaYaofpblbg8PpmbzeHdOiAlCvXoQrLgIpmbezHdiOAlvCXorQLgacep:neaapxebebebebebebebebghp9op:bep9rgaa8Kp:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8NaIpmwDKYqk8AExm35Ps8E8Fgacep:neaaahp9op:bep9rgap:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8La8MpmwKDYq8AkEx3m5P8Es8Fg8Laya8PpmwKDYq8AkEx3m5P8Es8Fg8MpmbezHdiOAlvCXorQLgacep:neaaahp9op:bep9rgap:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8La8MpmwDKYqk8AExm35Ps8E8Fgacep:neaaahp9op:bep9rgap:oeghp9Abbbaladfglahaaaapmlvorlvorlvorlvorp:oeghp9AbbbaladfglahaaaapmwDqkwDqkwDqkwDqkp:oeghp9AbbbaladfglahaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9AbbbaladfhlaoczfgoaC6mbxdkkaCTmbaXaEfhrcbhocbalcl4gl9Rc8FGhiavaEfpbdbhhinaravcj;cbfaofpblbg8Ka8Aaofpblbg8LpmbzeHdOiAlCvXoQrLg8MaKaofpblbg8NaYaofpblbgypmbzeHdOiAlCvXoQrLg8PpmbezHdiOAlvCXorQLgaaip:Reaaalp:Tep9qgaahp9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ma8PpmwDKYqk8AExm35Ps8E8Fgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ka8LpmwKDYq8AkEx3m5P8Es8Fg8Ka8NaypmwKDYq8AkEx3m5P8Es8Fg8LpmbezHdiOAlvCXorQLgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ka8LpmwDKYqk8AExm35Ps8E8Fgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9AbbbaradfhraoczfgoaC6mbkkaEclfgEad6mbkdnaXavcjdf9hmbaAad2goTmbaOavcjdfao;8qbbkdnammbavaXaAcufad2fad;8qbbkaAaHfhHc9:hoaQhPaQmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdasaeao9Raoasfae6Eaofgoae6mbkaial9RhPkcbc99axaP9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbkpPesu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgwce0mbavc;abfcFecje;8kbav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhDaicefgiarfhqdndnaeci9pmbaqhexekcmcsawceSEhkcbhxcbhmaqhecbhlcbhoindndnaiRbbgrc;Ve0mbavc;abfaoarcu7gPcl4fcsGcitfgwydlhsawydbhzdndnarcsGgwak9pmbavalaPfcsGcdtfydbaxawEhraxawTgHfhxxekdnaeaD9nmbc9:hoxokdndnawcsSmbcehHamawcetfcWfhrxekaecefhrae8SbbgwcFeGhPdndnawcu9mmbarhexekaecvfheaPcFbGhPcrhwdninar8SbbgHcFbGawtaPVhPaHcu9kmearcefhrawcrfgwc8J9hmbxdkkarcefhekcehHaPce4cbaPceG9R7amfhrkarhmkavc;abfaocitfgwarBdbawasBdlavalcdtfarBdbavc;abfaocefcsGcitfgwazBdbawarBdlaocdfhoaHalfhldnadcd9hmbabar87elabas87edabaz87ebabcofhbxdkabarBdwabasBdlabazBdbabcxfhbxekdnarcpe0mbavalaDarcsGfRbbgwcl4gP9RcsGcdtfydbaxcefgsaPEhravalaw9RcsGcdtfydbasaPTgzfgsawcsGgPEhwaPThPdndnadcd9hmbabaw87elabar87edabax87ebcohHxekabawBdwabarBdlabaxBdbcxhHkavalcdtfaxBdbavc;abfaocitfgOarBdbaOaxBdlavalcefglcsGcdtfarBdbavc;abfaocefcsGcitfgOawBdbaOarBdlavalazfglcsGcdtfawBdbavc;abfaocdfcsGcitfgraxBdbarawBdlaocifhoabaHfhbalaPfhlasaPfhxxekdnaeaD9nmbc9:hoxlkaxcbaeRbbgwEgHarc;:eSgrfhsawcsGhOdndnawcl4gAmbascefhzxekashzavalaA9RcsGcdtfydbhskdndnaOmbazcefhxxekazhxavalaw9RcsGcdtfydbhzkdndnarTmbaecefhrxekaecdfhrae8SbegPcFeGhwdnaPcu9kmbaecofhHawcFbGhwcrhedninar8SbbgPcFbGaetawVhwaPcu9kmearcefhraecrfgec8J9hmbkaHhrxekarcefhrkawce4cbawceG9R7amfgmhHkdndnaAcsSmbarhwxekarcefhwar8SbbgecFeGhPdnaecu9kmbarcvfhsaPcFbGhPcrhedninaw8SbbgrcFbGaetaPVhParcu9kmeawcefhwaecrfgec8J9hmbkashwxekawcefhwkaPce4cbaPceG9R7amfgmhskdndnaOcsSmbawhexekawcefheaw8SbbgrcFeGhPdnarcu9kmbawcvfhzaPcFbGhPcrhrdninae8SbbgwcFbGartaPVhPawcu9kmeaecefhearcrfgrc8J9hmbkazhexekaecefhekaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabaz87elabas87edabaH87ebcohrxekabazBdwabasBdlabaHBdbcxhrkavc;abfaocitfgwasBdbawaHBdlavalcdtfaHBdbavc;abfaocefcsGcitfgwazBdbawasBdlavalcefglcsGcdtfasBdbavc;abfaocdfcsGcitfgwaHBdbawazBdlavalaATaAcsSVfglcsGcdtfazBdbalaOTaOcsSVfhlaocifhoabarfhbkaocsGhoalcsGhlaicefgiaq6mbkkcbc99aeaDSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk;Toio97eue97aec98Ghedndnadcl9hmbaeTmecbhdinababpbbbgicKp:RecKp:Sep;6eglaicwp:RecKp:Sep;6ealp;Geaiczp:RecKp:Sep;6egvp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgwp9op9rp;Keglpxbb;:9cbb;:9cbb;:9cbb;:9calalp;Meaoaop;Meavaravawp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFbbbFbbbFbbbFbbbp9oaipxbbbFbbbFbbbFbbbFp9op9qalavp;Mearp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaoavp;Mearp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgDaDpbbbgipxbbbbbbFFbbbbbbFFgwp9oabpbbbgoaipmbediwDqkzHOAKY8AEgvczp:Reczp:Sep;6eglaoaipmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eavczp:Sep;6egvp;Gealp;Gep;Kep;Legipxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgqp9op9rp;Keglpxb;:FSb;:FSb;:FSb;:FSalalp;Meaiaip;Meavaravaqp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbp9oaiavp;Mearp;Keczp:Rep9qgialavp;Mearp;KepxFFbbFFbbFFbbFFbbp9oglpmwDKYqk8AExm35Ps8E8Fp9qpkbbabaoawp9oaialpmbezHdiOAlvCXorQLp9qpkbbabcafhbadclfgdae6mbkkk;2ileue97euo97dnaec98GgiTmbcbheinabcKfpx:ji:1S:ji:1S:ji:1S:ji:1SabpbbbglabczfgvpbbbgopmlvorxmPsCXQL358E8Fgrczp:Segwpxibbbibbbibbbibbbp9qp;6egDp;NegqaDaDp;MegDaDp;KealaopmbediwDqkzHOAKY8AEgDczp:Reczp:Sep;6eglalp;MeaDczp:Sep;6egoaop;Mearczp:Reczp:Sep;6egrarp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jep;Mepxbbn0bbn0bbn0bbn0gDp;KepxFFbbFFbbFFbbFFbbgkp9oaqaop;MeaDp;Keczp:Rep9qgoaqalp;MeaDp;Keakp9oaqarp;MeaDp;Keczp:Rep9qgDpmwDKYqk8AExm35Ps8E8Fglp5eawclp:RegqpEi:T:j83ibavalp5baqpEd:T:j83ibabcwfaoaDpmbezHdiOAlvCXorQLgDp5eaqpEe:T:j83ibabaDp5baqpEb:T:j83ibabcafhbaeclfgeai6mbkkkuee97dnadcd4ae2c98GgeTmbcbhdinababpbbbgicwp:Recwp:Sep;6eaicep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbabczfhbadclfgdae6mbkkk:Sodw97euaec98Ghedndnadcl9hmbaeTmecbhdinabpxbbuJbbuJbbuJbbuJabpbbbgicKp:TeglaicYp:Tep9qgvcdp:Teavp9qgvclp:Teavp9qgop;6ep;Negvaicwp:RecKp:SegraipxFbbbFbbbFbbbFbbbgwp9ogDp:Uep;6ep;Mepxbbn0bbn0bbn0bbn0gqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9oavaDarp:Xeaiczp:RecKp:Segip:Uep;6ep;Meaqp;Keawp9op9qavaDaraip:Uep:Xep;6ep;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qavaoalcep:Rep9oalpxebbbebbbebbbebbbp9op9qp;6ep;Meaqp;KecKp:Rep9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgkpxbFu9hbFu9hbFu9hbFu9habpbbbglakpbbbgrpmlvorxmPsCXQL358E8Fgvczp:TegqavcHp:Tep9qgicdp:Teaip9qgiclp:Teaip9qgicwp:Teaip9qgop;6ep;NegialarpmbediwDqkzHOAKY8AEgDpxFFbbFFbbFFbbFFbbglp9ograDczp:Segwp:Ueavczp:Reczp:SegDp:Xep;6ep;Mepxbbn0bbn0bbn0bbn0gvp;Kealp9oaiarawaDp:Uep:Xep;6ep;Meavp;Keczp:Rep9qgwaiaoaqcep:Rep9oaqpxebbbebbbebbbebbbp9op9qp;6ep;Meavp;Keczp:ReaiaDarp:Uep;6ep;Meavp;Kealp9op9qgipmwDKYqk8AExm35Ps8E8FpkbbabawaipmbezHdiOAlvCXorQLpkbbabcafhbadclfgdae6mbkkk9teiucbcbydj:G:cjbgeabcifc98GfgbBdj:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkxebcj:Gdklz:zbb"):n("b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuixkbeeeddddillviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WboY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbrl79IV9Rbwq;X8:kdbk:kYi5ud9:du8Jjjjjbcjq9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz:jjjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCaAcethXaxaDfhiaOaeaoaeao6E9RhQalcl4cifcd4hLazcjdfaAfhKcbhYabaOad2fg8AhEaHh3incbh5dnawTmbaxaYcd4fRbbh5kcbh8Eazcjdfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcjdfa8EaA2fa8FaAz:jjjjb8Aa8FaAfhixdkazcjdfa8EaA2fcbaAz:kjjjb8Aa8FhixekaPa8F9RaL6mva8FaLfhidnaCTmbaPai9RcK6mbaocdtc:q:G:cjbfcj:G:cjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bwar9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfcbaicdfa8J9c8N1:NfghRbbag9cjjjjjw:dg8J9qE86bbarcVfcbaha8J9c8M1:NfghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fcbaha8J9c8N1:NfgiRbbag9cjjjjjw:dg8J9qE86bbarc96fcbaia8J9c8M1:NfgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbw83bwarai8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasaYcd4fRbbgociGPlbedrbkaATmdazaYfh8Fazcjdfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeazaYfhaazcjdfhhcbhoceh8EaKh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaQaocefgofmbka8FaXfh8FcdhoaacdfhaahaXfhha8EceGhlcbh8EalmbxdkkaATmbaocl4h8EazaYfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaKhainazcjdfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E94aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3aYclfgYad6mbkaza8AaAcufad2fadz:jjjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcjqf8Kjjjjbaok:bsesu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgwce0mbavc;abfcFecjez:kjjjb8Aav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhDaicefgiarfhqdndnaeci9pmbaqhexekcmcsawceSEhkcbhxcbhmaqhecbhlcbhoindndnaiRbbgrc;Ve0mbavc;abfaoarcu7gPcl4fcsGcitfgwydlhsawydbhzdndnarcsGgwak9pmbavalaPfcsGcdtfydbaxawEhraxawTgHfhxxekdnaeaD9nmbc9:hoxokdndnawcsSmbcehHamawcetfcWfhrxekaecefhrae8SbbgwcFeGhPdndnawcu9mmbarhexekaecvfheaPcFbGhPcrhwdninar8SbbgHcFbGawtaPVhPaHcu9kmearcefhrawcrfgwc8J9hmbxdkkarcefhekcehHaPce4cbaPceG9R7amfhrkarhmkavc;abfaocitfgwarBdbawasBdlavalcdtfarBdbavc;abfaocefcsGcitfgwazBdbawarBdlaocdfhoaHalfhldnadcd9hmbabar87elabas87edabaz87ebabcofhbxdkabarBdwabasBdlabazBdbabcxfhbxekdnarcpe0mbavalaDarcsGfRbbgwcl4gP9RcsGcdtfydbaxcefgsaPEhravalaw9RcsGcdtfydbasaPTgzfgsawcsGgPEhwaPThPdndnadcd9hmbabaw87elabar87edabax87ebcohHxekabawBdwabarBdlabaxBdbcxhHkavalcdtfaxBdbavc;abfaocitfgOarBdbaOaxBdlavalcefglcsGcdtfarBdbavc;abfaocefcsGcitfgOawBdbaOarBdlavalazfglcsGcdtfawBdbavc;abfaocdfcsGcitfgraxBdbarawBdlaocifhoabaHfhbalaPfhlasaPfhxxekdnaeaD9nmbc9:hoxlkaxcbaeRbbgwEgHarc;:eSgrfhsawcsGhOdndnawcl4gAmbascefhzxekashzavalaA9RcsGcdtfydbhskdndnaOmbazcefhxxekazhxavalaw9RcsGcdtfydbhzkdndnarTmbaecefhrxekaecdfhrae8SbegPcFeGhwdnaPcu9kmbaecofhHawcFbGhwcrhedninar8SbbgPcFbGaetawVhwaPcu9kmearcefhraecrfgec8J9hmbkaHhrxekarcefhrkawce4cbawceG9R7amfgmhHkdndnaAcsSmbarhwxekarcefhwar8SbbgecFeGhPdnaecu9kmbarcvfhsaPcFbGhPcrhedninaw8SbbgrcFbGaetaPVhParcu9kmeawcefhwaecrfgec8J9hmbkashwxekawcefhwkaPce4cbaPceG9R7amfgmhskdndnaOcsSmbawhexekawcefheaw8SbbgrcFeGhPdnarcu9kmbawcvfhzaPcFbGhPcrhrdninae8SbbgwcFbGartaPVhPawcu9kmeaecefhearcrfgrc8J9hmbkazhexekaecefhekaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabaz87elabas87edabaH87ebcohrxekabazBdwabasBdlabaHBdbcxhrkavc;abfaocitfgwasBdbawaHBdlavalcdtfaHBdbavc;abfaocefcsGcitfgwazBdbawasBdlavalcefglcsGcdtfasBdbavc;abfaocdfcsGcitfgwaHBdbawazBdlavalaATaAcsSVfglcsGcdtfazBdbalaOTaOcsSVfhlaocifhoabarfhbkaocsGhoalcsGhlaicefgiaq6mbkkcbc99aeaDSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk:4ioiue99dud99dud99dnaeTmbcbhiabhlindndnal8Uebgv:YgoJ:ji:1Salcof8UebgrciVgw:Y:vgDNJbbbZJbbb:;avcu9kEMgq:lJbbb9p9DTmbaq:Ohkxekcjjjj94hkkalclf8Uebhvalcdf8UebhxalarcefciGcetfak87ebdndnax:YgqaDNJbbbZJbbb:;axcu9kEMgm:lJbbb9p9DTmbam:Ohxxekcjjjj94hxkabaiarciGgkfcd7cetfax87ebdndnav:YgmaDNJbbbZJbbb:;avcu9kEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkalarcufciGcetfav87ebdndnawaw2:ZgPaPMaoaoN:taqaqN:tamamN:tgoJbbbbaoJbbbb9GE:raDNJbbbZMgD:lJbbb9p9DTmbaD:Ohrxekcjjjj94hrkalakcetfar87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk:Tvirud99eudndnadcl9hmbaeTmeindndnabRbbgiabcefgl8Sbbgvabcdfgo8Sbbgrf9R:YJbbuJabcifgwRbbgdce4adVgDcd4aDVgDcl4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax86bbdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao86bbdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai86bbdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad86bbabclfhbaecufgembxdkkaeTmbindndnab8Vebgiabcdfgl8Uebgvabclfgo8Uebgrf9R:YJbFu9habcofgw8Vebgdce4adVgDcd4aDVgDcl4aDVgDcw4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax87ebdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao87ebdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai87ebdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad87ebabcwfhbaecufgembkkk9teiucbcbyd:K:G:cjbgeabcifc98GfgbBd:K:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk83dbcj:Gdk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:K:Gdkl8W:qbb"),i=WebAssembly.instantiate(a,{}).then(function(t){(e=t.instance).exports.__wasm_call_ctors()});function n(e){for(var t=new Uint8Array(e.length),a=0;a<e.length;++a){var i=e.charCodeAt(a);t[a]=i>96?i-97:i>64?i-39:i+4}for(var n=0,a=0;a<e.length;++a)t[n++]=t[a]<60?r[t[a]]:(t[a]-60)*64+t[++a];return t.buffer.slice(0,n)}function o(e,t,r,a,i,n,o){var s=e.exports.sbrk,l=a+3&-4,c=s(l*i),f=s(n.length),p=new Uint8Array(e.exports.memory.buffer);p.set(n,f);var u=t(c,a,i,f,n.length);if(0==u&&o&&o(c,l,i),r.set(p.subarray(c,c+a*i)),s(c-s(0)),0!=u)throw Error("Malformed buffer data: "+u)}var s={NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp",COLOR:"meshopt_decodeFilterColor"},l={ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"},c=[],f=0;function p(e){var t=e.data;self.ready.then(function(e){if(!t.id)return self.close();try{var r=new Uint8Array(t.count*t.size);o(e,e.exports[t.mode],r,t.count,t.size,t.source,e.exports[t.filter]),self.postMessage({id:t.id,count:t.count,action:"resolve",value:r},[r.buffer])}catch(e){self.postMessage({id:t.id,count:t.count,action:"reject",value:e})}})}return{ready:i,supported:!0,useWorkers:function(e){for(var t=new Blob(["self.ready = WebAssembly.instantiate(new Uint8Array(["+new Uint8Array(a)+"]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = "+p.name+";"+o.toString()+p.toString()],{type:"text/javascript"}),r=URL.createObjectURL(t),i=c.length;i<e;++i)c[i]=function(e){var t={object:new Worker(e),pending:0,requests:{}};return t.object.onmessage=function(e){var r=e.data;t.pending-=r.count,t.requests[r.id][r.action](r.value),delete t.requests[r.id]},t}(r);for(var i=e;i<c.length;++i)c[i].object.postMessage({});c.length=e,URL.revokeObjectURL(r)},decodeVertexBuffer:function(t,r,a,i,n){o(e,e.exports.meshopt_decodeVertexBuffer,t,r,a,i,e.exports[s[n]])},decodeIndexBuffer:function(t,r,a,i){o(e,e.exports.meshopt_decodeIndexBuffer,t,r,a,i)},decodeIndexSequence:function(t,r,a,i){o(e,e.exports.meshopt_decodeIndexSequence,t,r,a,i)},decodeGltfBuffer:function(t,r,a,i,n,c){o(e,e.exports[l[n]],t,r,a,i,e.exports[s[c]])},decodeGltfBufferAsync:function(t,r,a,n,p){return c.length>0?function(e,t,r,a,i){for(var n=c[0],o=1;o<c.length;++o)c[o].pending<n.pending&&(n=c[o]);return new Promise(function(o,s){var l=new Uint8Array(r),c=++f;n.pending+=e,n.requests[c]={resolve:o,reject:s},n.object.postMessage({id:c,count:e,size:t,source:l,mode:a,filter:i},[l.buffer])})}(t,r,a,l[n],s[p]):i.then(function(){var i=new Uint8Array(t*r);return o(e,e.exports[l[n]],i,t,r,a,e.exports[s[p]]),i})}}}();async function rf(e,t,r,a,i,n="NONE"){await rc.ready,rc.decodeGltfBuffer(e,t,r,a,i,"string"==typeof n?n:["NONE","OCTAHEDRAL","QUATERNION","EXPONENTIAL","COLOR"][n])}async function rp(e,t,r){if(!t.gltf?.decompressMeshes||!t.gltf.loadBuffers)return;!function(e){let t=e.bufferViews||[];for(let e=0;e<t.length;e++){let r=t[e].extensions;if(r?.KHR_meshopt_compression&&r.EXT_meshopt_compression)throw Error(`glTF bufferView ${e} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`)}let r=e.buffers||[];for(let e=0;e<r.length;e++){let t=r[e].extensions;if(t?.KHR_meshopt_compression&&t.EXT_meshopt_compression)throw Error(`glTF buffer ${e} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`)}}(e.json);let a=new tq(e),i=e.json.bufferViews||[],n=i.map(e=>ru(a,e,r));for(let e of(await Promise.all(n),i))a.removeObjectExtension(e,r);for(let t of e.json.buffers||[])a.removeObjectExtension(t,r);a.removeExtension(r)}async function ru(e,t,r){let a=e.getObjectExtension(t,r);if(!a)return;let{byteOffset:i=0,byteLength:n,byteStride:o,count:s,mode:l,filter:c="NONE",buffer:f}=a,p=e.gltf.buffers[f],u=e.gltf.buffers[t.buffer],m=new Uint8Array(p.arrayBuffer,p.byteOffset+i,n),d=new Uint8Array(u.arrayBuffer,u.byteOffset+(t.byteOffset||0),t.byteLength);await rf(d,s,o,m,l,c)}let rm="EXT_meshopt_compression";async function rd(e,t){await rp(e,t,rm)}let rb="KHR_meshopt_compression";async function rh(e,t){await rp(e,t,rb)}var rg=r(46635);let rv="EXT_texture_webp",rx=rv;function r_(e,t){let r=new tq(e);if(!(0,rg.X)("image/webp")){if(r.getRequiredExtensions().includes(rv))throw Error(`gltf: Required extension ${rv} not supported by browser`);return}let{json:a}=r;for(let e of a.textures||[]){let t=r.getObjectExtension(e,rv);t&&(e.source=t.source),r.removeObjectExtension(e,rv)}r.removeExtension(rv)}let rS="EXT_texture_avif",rR=rS;async function rT(e,t){let r=new tq(e);if(!(await (0,rg.y)()).has("image/avif")){if(r.getRequiredExtensions().includes(rS))throw Error(`gltf: Required extension ${rS} not supported by browser`);return}let{json:a}=r;for(let e of a.textures||[]){let t=r.getObjectExtension(e,rS);t&&(e.source=t.source),r.removeObjectExtension(e,rS)}r.removeExtension(rS)}let ry="KHR_texture_basisu",rA=ry;function rM(e,t){let r=new tq(e),{json:a}=r;for(let e of a.textures||[]){let t=r.getObjectExtension(e,ry);t&&(e.source=t.source,r.removeObjectExtension(e,ry))}r.removeExtension(ry)}function rI(e,t,r){var a;let i,n,o,s=r?rC(r.metadata):void 0;return n=function(e){switch(e.constructor){case Int8Array:return"int8";case Uint8Array:case Uint8ClampedArray:return"uint8";case Int16Array:return"int16";case Uint16Array:return"uint16";case Int32Array:return"int32";case Uint32Array:return"uint32";case Float32Array:return"float32";case Float64Array:return"float64";default:return"null"}}(t.value),o=s||(i={},"byteOffset"in(a=t)&&(i.byteOffset=a.byteOffset.toString(10)),"byteStride"in a&&(i.byteStride=a.byteStride.toString(10)),"normalized"in a&&(i.normalized=a.normalized.toString()),i),{name:e,type:{type:"fixed-size-list",listSize:t.size,children:[{name:"value",type:n}]},nullable:!1,metadata:o}}function rC(e){Object.entries(e);let t={};for(let r in e)t[`${r}.string`]=JSON.stringify(e[r]);return t}let rE={POSITION:"POSITION",NORMAL:"NORMAL",COLOR:"COLOR_0",TEX_COORD:"TEXCOORD_0"},rw={1:Int8Array,2:Uint8Array,3:Int16Array,4:Uint16Array,5:Int32Array,6:Uint32Array,9:Float32Array};class rN{draco;decoder;metadataQuerier;constructor(e){this.draco=e,this.decoder=new this.draco.Decoder,this.metadataQuerier=new this.draco.MetadataQuerier}destroy(){this.draco.destroy(this.decoder),this.draco.destroy(this.metadataQuerier)}parseSync(e,t={}){let r=new this.draco.DecoderBuffer;r.Init(new Int8Array(e),e.byteLength),this._disableAttributeTransforms(t);let a=this.decoder.GetEncodedGeometryType(r),i=a===this.draco.TRIANGULAR_MESH?new this.draco.Mesh:new this.draco.PointCloud;try{let e;switch(a){case this.draco.TRIANGULAR_MESH:e=this.decoder.DecodeBufferToMesh(r,i);break;case this.draco.POINT_CLOUD:e=this.decoder.DecodeBufferToPointCloud(r,i);break;default:throw Error("DRACO: Unknown geometry type.")}if(!e.ok()||!i.ptr){let t=`DRACO decompression failed: ${e.error_msg()}`;throw Error(t)}let n=this._getDracoLoaderData(i,a,t),o=this._getMeshData(i,n,t),s=function(e){let t=1/0,r=1/0,a=1/0,i=-1/0,n=-1/0,o=-1/0,s=e.POSITION?e.POSITION.value:[],l=s&&s.length;for(let e=0;e<l;e+=3){let l=s[e],c=s[e+1],f=s[e+2];t=l<t?l:t,r=c<r?c:r,a=f<a?f:a,i=l>i?l:i,n=c>n?c:n,o=f>o?f:o}return[[t,r,a],[i,n,o]]}(o.attributes),l=function(e,t,r){let a=rC(t.metadata),i=[],n=function(e){let t={};for(let r in e){let a=e[r];t[a.name||"undefined"]=a}return t}(t.attributes);for(let t in e){let r=e[t],a=rI(t,r,n[t]);i.push(a)}if(r){let e=rI("indices",r);i.push(e)}return{fields:i,metadata:a}}(o.attributes,n,o.indices);return{loader:"draco",loaderData:n,header:{vertexCount:i.num_points(),boundingBox:s},...o,schema:l}}finally{this.draco.destroy(r),i&&this.draco.destroy(i)}}_getDracoLoaderData(e,t,r){let a=this._getTopLevelMetadata(e),i=this._getDracoAttributes(e,r);return{geometry_type:t,num_attributes:e.num_attributes(),num_points:e.num_points(),num_faces:e instanceof this.draco.Mesh?e.num_faces():0,metadata:a,attributes:i}}_getDracoAttributes(e,t){let r={};for(let a=0;a<e.num_attributes();a++){let i=this.decoder.GetAttribute(e,a),n=this._getAttributeMetadata(e,a);r[i.unique_id()]={unique_id:i.unique_id(),attribute_type:i.attribute_type(),data_type:i.data_type(),num_components:i.num_components(),byte_offset:i.byte_offset(),byte_stride:i.byte_stride(),normalized:i.normalized(),attribute_index:a,metadata:n};let o=this._getQuantizationTransform(i,t);o&&(r[i.unique_id()].quantization_transform=o);let s=this._getOctahedronTransform(i,t);s&&(r[i.unique_id()].octahedron_transform=s)}return r}_getMeshData(e,t,r){let a=this._getMeshAttributes(t,e,r);if(!a.POSITION)throw Error("DRACO: No position attribute found.");if(e instanceof this.draco.Mesh)if("triangle-strip"===r.topology)return{topology:"triangle-strip",mode:4,attributes:a,indices:{value:this._getTriangleStripIndices(e),size:1}};else return{topology:"triangle-list",mode:5,attributes:a,indices:{value:this._getTriangleListIndices(e),size:1}};return{topology:"point-list",mode:0,attributes:a}}_getMeshAttributes(e,t,r){let a={};for(let i of Object.values(e.attributes)){let e=this._deduceAttributeName(i,r);i.name=e;let n=this._getAttributeValues(t,i);if(n){let{value:t,size:r}=n;a[e]={value:t,size:r,byteOffset:i.byte_offset,byteStride:i.byte_stride,normalized:i.normalized}}}return a}_getTriangleListIndices(e){let t=3*e.num_faces(),r=4*t,a=this.draco._malloc(r);try{return this.decoder.GetTrianglesUInt32Array(e,r,a),new Uint32Array(this.draco.HEAPF32.buffer,a,t).slice()}finally{this.draco._free(a)}}_getTriangleStripIndices(e){let t=new this.draco.DracoInt32Array;try{return this.decoder.GetTriangleStripsFromMesh(e,t),function(e){let t=e.size(),r=new Int32Array(t);for(let a=0;a<t;a++)r[a]=e.GetValue(a);return r}(t)}finally{this.draco.destroy(t)}}_getAttributeValues(e,t){let r,a=rw[t.data_type];if(!a)return console.warn(`DRACO: Unsupported attribute type ${t.data_type}`),null;let i=t.num_components,n=e.num_points()*i,o=n*a.BYTES_PER_ELEMENT,s=function(e,t){switch(t){case Float32Array:return e.DT_FLOAT32;case Int8Array:return e.DT_INT8;case Int16Array:return e.DT_INT16;case Int32Array:return e.DT_INT32;case Uint8Array:return e.DT_UINT8;case Uint16Array:return e.DT_UINT16;case Uint32Array:return e.DT_UINT32;default:return e.DT_INVALID}}(this.draco,a),l=this.draco._malloc(o);try{let i=this.decoder.GetAttribute(e,t.attribute_index);this.decoder.GetAttributeDataArrayForAllPoints(e,i,s,o,l),r=new a(this.draco.HEAPF32.buffer,l,n).slice()}finally{this.draco._free(l)}return{value:r,size:i}}_deduceAttributeName(e,t){let r=e.unique_id;for(let[e,a]of Object.entries(t.extraAttributes||{}))if(a===r)return e;let a=e.attribute_type;for(let e in rE)if(this.draco[e]===a)return rE[e];let i=t.attributeNameEntry||"name";return e.metadata[i]?e.metadata[i].string:`CUSTOM_ATTRIBUTE_${r}`}_getTopLevelMetadata(e){let t=this.decoder.GetMetadata(e);return this._getDracoMetadata(t)}_getAttributeMetadata(e,t){let r=this.decoder.GetAttributeMetadata(e,t);return this._getDracoMetadata(r)}_getDracoMetadata(e){if(!e||!e.ptr)return{};let t={},r=this.metadataQuerier.NumEntries(e);for(let a=0;a<r;a++){let r=this.metadataQuerier.GetEntryName(e,a);t[r]=this._getDracoMetadataField(e,r)}return t}_getDracoMetadataField(e,t){let r=new this.draco.DracoInt32Array;try{this.metadataQuerier.GetIntEntryArray(e,t,r);let a=function(e){let t=e.size(),r=new Int32Array(t);for(let a=0;a<t;a++)r[a]=e.GetValue(a);return r}(r);return{int:this.metadataQuerier.GetIntEntry(e,t),string:this.metadataQuerier.GetStringEntry(e,t),double:this.metadataQuerier.GetDoubleEntry(e,t),intArray:a}}finally{this.draco.destroy(r)}}_disableAttributeTransforms(e){let{quantizedAttributes:t=[],octahedronAttributes:r=[]}=e;for(let e of[...t,...r])this.decoder.SkipAttributeTransform(this.draco[e])}_getQuantizationTransform(e,t){let{quantizedAttributes:r=[]}=t,a=e.attribute_type();if(r.map(e=>this.decoder[e]).includes(a)){let t=new this.draco.AttributeQuantizationTransform;try{if(t.InitFromAttribute(e))return{quantization_bits:t.quantization_bits(),range:t.range(),min_values:new Float32Array([1,2,3]).map(e=>t.min_value(e))}}finally{this.draco.destroy(t)}}return null}_getOctahedronTransform(e,t){let{octahedronAttributes:r=[]}=t,a=e.attribute_type();if(r.map(e=>this.decoder[e]).includes(a)){let t=new this.draco.AttributeQuantizationTransform;try{if(t.InitFromAttribute(e))return{quantization_bits:t.quantization_bits()}}finally{this.draco.destroy(t)}}return null}}function rP(e,t){return new Promise((r,a)=>{let i=!1;function n(e){i||(i=!0,a(e))}function o(e){if(!i){i=!0;try{r(t(e))}catch(e){a(e)}}}try{let t=e(o,n);t?.then(o,n)}catch(e){n(e)}})}let rU="https://www.gstatic.com/draco/versioned/decoders/1.5.6",rL="draco_wasm_wrapper.js",rF="draco_decoder.wasm",rO="draco_decoder.js",rk="draco_encoder.js",rV={[rL]:`${rU}/${rL}`,[rF]:`${rU}/${rF}`,[rO]:`${rU}/${rO}`,[rk]:`https://raw.githubusercontent.com/google/draco/1.4.1/javascript/${rk}`};async function rj(e={},t){let r=e.modules||{};return r.draco3d?n||=rP(()=>r.draco3d.createDecoderModule({}),e=>({draco:e})):n||=rH(e,t),await n}function rD(e,t){if(e&&"object"==typeof e){if(e.default)return e.default;if(e[t])return e[t]}return e}async function rH(e,t){let r,a;if("js"===t)r=await ts(rV[rO],"draco",e,rO);else try{[r,a]=await Promise.all([await ts(rV[rL],"draco",e,rL),await ts(rV[rF],"draco",e,rF)])}catch{r=null,a=null}return(r=(r=rD(r,"DracoDecoderModule"))||globalThis.DracoDecoderModule)||tt||([r,a]=await Promise.all([await ts(rV[rL],"draco",{...e,useLocalLibraries:!0},rL),await ts(rV[rF],"draco",{...e,useLocalLibraries:!0},rF)]),r=(r=rD(r,"DracoDecoderModule"))||globalThis.DracoDecoderModule),await function(e,t){if("function"!=typeof e)throw Error("DracoDecoderModule could not be loaded");let r={};return t&&(r.wasmBinary=t),rP(t=>e({...r,onModuleLoaded:t}),e=>({draco:e}))}(r,a)}let rB={...{dataType:null,batchType:null,name:"Draco",id:"draco",module:"draco",version:"4.5.4",worker:!0,extensions:["drc"],mimeTypes:["application/octet-stream"],binary:!0,tests:["DRACO"],options:{draco:{decoderType:"object"==typeof WebAssembly?"wasm":"js",extraAttributes:{},attributeNameEntry:void 0}}},parse:rG};async function rG(e,t){let{draco:r}=await rj(to(t),t?.draco?.decoderType||"wasm"),a=new rN(r);try{return a.parseSync(e,t?.draco)}finally{a.destroy()}}function rz(e){var t;let r,a,i,{buffer:n,size:o,count:s}=(r=t=e,a=1,i=0,t&&t.value&&(r=t.value,a=t.size||1),r&&(ArrayBuffer.isView(r)||(r=function(e,t,r=!1){return e?!Array.isArray(e)&&(!r||e instanceof t)?e:new t(e):null}(r,Float32Array)),i=r.length/a),{buffer:r,size:a,count:i});return{value:n,size:o,byteOffset:0,count:s,type:tB(o),componentType:tG(n)}}let rK="KHR_draco_mesh_compression",rq=rK;function rW(e,t,r){let a=new tq(e);for(let e of rY(a))a.getObjectExtension(e,rK)}async function rJ(e,t,r){if(!t?.gltf?.decompressMeshes)return;let a=new tq(e),i=[];for(let e of rY(a))a.getObjectExtension(e,rK)&&i.push(rX(a,e,t,r));await Promise.all(i),a.removeExtension(rK)}function r$(e,t={}){let r=new tq(e);for(let e of r.json.meshes||[])(function(e){if(!(void 0).DracoWriter)throw Error("options.gltf.DracoWriter not provided");let t=(void 0).DracoWriter.encodeSync({attributes:e}),r=void 0;(void 0)._addFauxAttributes(r.attributes),(void 0).addBufferView(t)})(e),r.addRequiredExtension(rK)}async function rX(e,t,r,a){let i=e.getObjectExtension(t,rK);if(!i)return;let n=e.getTypedArrayForBufferView(i.bufferView),o=e4(n.buffer,n.byteOffset),s={...r};delete s["3d-tiles"];let l=await e6(o,rB,s,a),c=function(e){let t={};for(let r in e){let a=e[r];if("indices"!==r){let e=rz(a);t[r]=e}}return t}(l.attributes);for(let[r,a]of Object.entries(c))if(r in t.attributes){let i=t.attributes[r],n=e.getAccessor(i);n?.min&&n?.max&&(a.min=n.min,a.max=n.max)}t.attributes=c,l.indices&&(t.indices=rz(l.indices)),e.removeObjectExtension(t,rK),function(e){if(!e.attributes&&Object.keys(e.attributes).length>0)throw Error("glTF: Empty primitive detected: Draco decompression failure?")}(t)}function*rY(e){for(let t of e.json.meshes||[])for(let e of t.primitives)yield e}var rQ=r(87597),rZ=r(82557);let r0="KHR_texture_transform",r3=r0,r1=new rQ.P,r2=new rZ.d,r9=new rZ.d;async function r8(e,t){let r=new tq(e);if(!r.hasExtension(r0)||!t.gltf?.loadBuffers)return;let a=e.json.materials||[];for(let t=0;t<a.length;t++)!function(e,t,r){let a=r4(t.json.materials?.[e]),i=new Map,n=function(e){let t=-1;for(let r of e.json.meshes||[])for(let e of r.primitives)for(let r of Object.keys(e.attributes)){let e=/^TEXCOORD_(\d+)$/.exec(r);e&&(t=Math.max(t,Number(e[1])))}return t+1}(t);for(let o of a){let a=o.extensions?.[r0];if(a){let s=a.texCoord??o.texCoord??0,l=function(e,t){let{offset:r=[0,0],rotation:a=0,scale:i=[1,1]}=t;return JSON.stringify([e,r,a,i])}(s,a),c=i.get(l);if(!c){if(!function(e,t,r){let a=[];for(let r of e.json.meshes||[])for(let e of r.primitives){let r=e.material;Number.isFinite(r)&&t===r&&a.push(e)}if(0===a.length||a.some(t=>!function(e,t,r){let a=t.attributes[`TEXCOORD_${r}`];if(!Number.isFinite(a))return!1;let i=e.json.accessors?.[a];if(!i||void 0===i.bufferView||i.sparse)return!1;let n=e.json.bufferViews?.[i.bufferView];return!!(n&&e.buffers[n.buffer])}(e,t,r.sourceTexCoord)))return!1;for(let t of a)!function(e,t,r){let{sourceTexCoord:a,texCoord:i,matrix:n}=r,o=t.attributes[`TEXCOORD_${a}`];if(Number.isFinite(o)){let r=e.json.accessors?.[o];if(r&&void 0!==r.bufferView){let a=e.json.bufferViews?.[r.bufferView];if(a){let{arrayBuffer:o,byteOffset:s}=e.buffers[a.buffer],l=(s||0)+(r.byteOffset||0)+(a.byteOffset||0),{ArrayType:c,length:f}=tz(r,a),p=tO[r.componentType],u=tF[r.type],m=a.byteStride||p*u,d=new Float32Array(f);for(let e=0;e<r.count;e++){let t=new c(o,l+e*m,2);r1.set(t[0],t[1],1),r1.transformByMatrix3(n),d.set([r1[0],r1[1]],e*u)}!function(e,t,r,a,i){a.buffers.push({arrayBuffer:tJ(i.buffer),byteOffset:0,byteLength:i.buffer.byteLength}),a.json.bufferViews=a.json.bufferViews||[];let n=a.json.bufferViews;n.push({buffer:a.buffers.length-1,byteLength:i.buffer.byteLength,byteOffset:0});let o=a.json.accessors;o&&(o.push({bufferView:n?.length-1,byteOffset:0,componentType:5126,count:t.count,type:"VEC2"}),r.attributes[`TEXCOORD_${e}`]=o.length-1)}(i,r,t,e,d)}}}}(e,t,r);return!0}(t,e,c={sourceTexCoord:s,texCoord:n,matrix:function(e){let{offset:t=[0,0],rotation:r=0,scale:a=[1,1]}=e,i=new rZ.d().set(1,0,0,0,1,0,t[0],t[1],1),n=r2.set(Math.cos(r),Math.sin(r),0,-Math.sin(r),Math.cos(r),0,0,0,1),o=r9.set(a[0],0,0,0,a[1],0,0,0,1);return i.multiplyRight(n).multiplyRight(o)}(a)}))continue;n++,i.set(l,c)}o.texCoord=c.texCoord,r.removeObjectExtension(o,r0),o.extensions&&0===Object.keys(o.extensions).length&&delete o.extensions}}}(t,e,r);a.some(e=>r4(e).length>0)||r.removeExtension(r0)}function r4(e){if(!e||"object"!=typeof e)return[];let t=[],r=e.extensions;for(let[a,i]of(Number.isFinite(e.index)&&r?.[r0]&&t.push(e),Object.entries(e)))"extras"!==a&&t.push(...r4(i));return t}let r6="KHR_lights_punctual",r5=r6;async function r7(e){let t=new tq(e),{json:r}=t,a=t.getExtension(r6);for(let e of(a&&(t.json.lights=a.lights,t.removeExtension(r6)),r.nodes||[])){let r=t.getObjectExtension(e,r6);r&&(e.light=r.light),t.removeObjectExtension(e,r6)}}async function ae(e){let t=new tq(e),{json:r}=t;if(r.lights){let e=t.addExtension(r6);tE(!e.lights),e.lights=r.lights,delete r.lights}if(t.json.lights){for(let e of t.json.lights){let r=e.node;t.addObjectExtension(r,r6,e)}delete t.json.lights}}let at="KHR_materials_unlit",ar=at;async function aa(e){let t=new tq(e),{json:r}=t;for(let e of r.materials||[])e.extensions&&e.extensions.KHR_materials_unlit&&(e.unlit=!0),t.removeObjectExtension(e,at);t.removeExtension(at)}function ai(e){let t=new tq(e),{json:r}=t;if(t.materials)for(let e of r.materials||[])e.unlit&&(delete e.unlit,t.addObjectExtension(e,at,{}),t.addExtension(at))}let an="KHR_techniques_webgl",ao=an;async function as(e){let t=new tq(e),{json:r}=t,a=t.getExtension(an);if(a){let e=function(e,t){let{programs:r=[],shaders:a=[],techniques:i=[]}=e,n=new TextDecoder;return a.forEach(e=>{if(Number.isFinite(e.bufferView))e.code=n.decode(t.getTypedArrayForBufferView(e.bufferView));else throw Error("KHR_techniques_webgl: no shader code")}),r.forEach(e=>{e.fragmentShader=a[e.fragmentShader],e.vertexShader=a[e.vertexShader]}),i.forEach(e=>{e.program=r[e.program]}),i}(a,t);for(let a of r.materials||[]){let r=t.getObjectExtension(a,an);r&&(a.technique=Object.assign({},r,e[r.technique]),a.technique.values=function(e,t){let r=Object.assign({},e.values);return Object.keys(e.uniforms||{}).forEach(t=>{!e.uniforms[t].value||t in r||(r[t]=e.uniforms[t].value)}),Object.keys(r).forEach(e=>{"object"==typeof r[e]&&void 0!==r[e].index&&(r[e].texture=t.getTexture(r[e].index))}),r}(a.technique,t)),t.removeObjectExtension(a,an)}t.removeExtension(an)}}async function al(e,t){}let ac="EXT_feature_metadata",af=ac;async function ap(e,t){!function(e,t){if(!t.gltf?.loadBuffers)return;let r=e.getExtension(ac);r&&(t.gltf?.loadImages&&function(e,t){let r=t.schema;if(!r)return;let a=r.classes,{featureTextures:i}=t;if(a&&i)for(let t in a){let r=a[t],n=function(e,t){for(let r in e){let a=e[r];if(a.class===t)return a}return null}(i,t);n&&function(e,t,r){let a=t.class;for(let i in r.properties){let r=t?.properties?.[i];if(r){let t=function(e,t,r){let a=e.gltf.json;if(!a.meshes)return[];let i=[];for(let n of a.meshes)for(let a of n.primitives)!function(e,t,r,a,i){let n=t3(e,{channels:r.channels,...r.texture},i);n&&t1(e,t,n,a,i)}(e,r,t,i,a);return i}(e,r,a);r.data=t}}}(e,n,r)}}(e,r),function(e,t){let r=t.schema;if(!r)return;let a=r.classes,i=t.featureTables;if(a&&i)for(let t in a){let a=function(e,t){for(let r in e){let a=e[r];if(a.class===t)return a}return null}(i,t);a&&function(e,t,r){if(!r.class)return;let a=t.classes?.[r.class];if(!a)throw Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${r.class}`);let i=r.count;for(let t in a.properties){let n=a.properties[t],o=r.properties?.[t];if(o){let t=function(e,t,r,a){var i,n,o,s,l,c,f;let p=[],u=a.bufferView,m=e.getTypedArrayForBufferView(u),d=(i=e,n=t,o=a,s=r,"ARRAY"===n.type&&void 0===n.componentCount&&void 0!==o.arrayOffsetBufferView?tZ(i,o.arrayOffsetBufferView,o.offsetType||"UINT32",s):null),b=(l=e,c=a,f=r,void 0!==c.stringOffsetBufferView?tZ(l,c.stringOffsetBufferView,c.offsetType||"UINT32",f):null);return"STRING"===t.type||"STRING"===t.componentType?p=t8(r,m,d,b):function(e){let t=["UINT8","INT16","UINT16","INT32","UINT32","INT64","UINT64","FLOAT32","FLOAT64"];return t.includes(e.type)||void 0!==e.componentType&&t.includes(e.componentType)}(t)&&(p=function(e,t,r,a){let i="ARRAY"===e.type,n=e.componentCount,o="SCALAR",s=e.componentType||e.type,l=tQ[s]*tX[o],c=r.byteLength/l,f=t0(r,o,s,c);return i?a?t2(f,t,a,r.length,l):n?t9(f,t,n):[]:f}(t,r,m,d)),p}(e,n,i,o);o.data=t}}}(e,r,a)}}(e,r))}(new tq(e),t)}let au=[s,o,c,l,p,f,u,m,b,h,g,d,v];async function am(e,t={},r){for(let a of au.filter(e=>ab(e.name,t)))await a.preprocess?.(e,t,r)}async function ad(e,t={},r){for(let a of au.filter(e=>ab(e.name,t)))await a.decode?.(e,t,r)}function ab(e,t){let r=t?.gltf?.excludeExtensions||{};return!(e in r&&!r[e])}let ah="KHR_binary_glTF",ag={accessors:"accessor",animations:"animation",buffers:"buffer",bufferViews:"bufferView",images:"image",materials:"material",meshes:"mesh",nodes:"node",samplers:"sampler",scenes:"scene",skins:"skin",textures:"texture"},av={accessor:"accessors",animations:"animation",buffer:"buffers",bufferView:"bufferViews",image:"images",material:"materials",mesh:"meshes",node:"nodes",sampler:"samplers",scene:"scenes",skin:"skins",texture:"textures"};class ax{idToIndexMap={animations:{},accessors:{},buffers:{},bufferViews:{},images:{},materials:{},meshes:{},nodes:{},samplers:{},scenes:{},skins:{},textures:{}};json;normalize(e,t){this.json=e.json;let r=e.json;switch(r.asset&&r.asset.version){case"2.0":return;case void 0:case"1.0":break;default:console.warn(`glTF: Unknown version ${r.asset.version}`);return}if(!t.normalize)throw Error("glTF v1 is not supported.");console.warn("Converting glTF v1 to glTF v2 format. This is experimental and may fail."),this._addAsset(r),this._convertTopLevelObjectsToArrays(r),function(e){let t=new tq(e),{json:r}=t;for(let e of r.images||[]){let r=t.getObjectExtension(e,ah);r&&Object.assign(e,r),t.removeObjectExtension(e,ah)}r.buffers&&r.buffers[0]&&delete r.buffers[0].uri,t.removeExtension(ah)}(e),this._convertObjectIdsToArrayIndices(r),this._updateObjects(r),this._updateMaterial(r)}_addAsset(e){e.asset=e.asset||{},e.asset.version="2.0",e.asset.generator=e.asset.generator||"Normalized to glTF 2.0 by loaders.gl"}_convertTopLevelObjectsToArrays(e){for(let t in ag)this._convertTopLevelObjectToArray(e,t)}_convertTopLevelObjectToArray(e,t){let r=e[t];if(!(!r||Array.isArray(r)))for(let a in e[t]=[],r){let i=r[a];i.id=i.id||a;let n=e[t].length;e[t].push(i),this.idToIndexMap[t][a]=n}}_convertObjectIdsToArrayIndices(e){for(let t in ag)this._convertIdsToIndices(e,t);for(let t of("scene"in e&&(e.scene=this._convertIdToIndex(e.scene,"scene")),e.textures))this._convertTextureIds(t);for(let t of e.meshes)this._convertMeshIds(t);for(let t of e.nodes)this._convertNodeIds(t);for(let t of e.scenes)this._convertSceneIds(t)}_convertTextureIds(e){e.source&&(e.source=this._convertIdToIndex(e.source,"image"))}_convertMeshIds(e){for(let t of e.primitives){let{attributes:e,indices:r,material:a}=t;for(let t in e)e[t]=this._convertIdToIndex(e[t],"accessor");r&&(t.indices=this._convertIdToIndex(r,"accessor")),a&&(t.material=this._convertIdToIndex(a,"material"))}}_convertNodeIds(e){e.children&&(e.children=e.children.map(e=>this._convertIdToIndex(e,"node"))),e.meshes&&(e.meshes=e.meshes.map(e=>this._convertIdToIndex(e,"mesh")))}_convertSceneIds(e){e.nodes&&(e.nodes=e.nodes.map(e=>this._convertIdToIndex(e,"node")))}_convertIdsToIndices(e,t){for(let r of(e[t]||(console.warn(`gltf v1: json doesn't contain attribute ${t}`),e[t]=[]),e[t]))for(let e in r){let t=r[e],a=this._convertIdToIndex(t,e);r[e]=a}}_convertIdToIndex(e,t){let r=av[t];if(r in this.idToIndexMap){let a=this.idToIndexMap[r][e];if(!Number.isFinite(a))throw Error(`gltf v1: failed to resolve ${t} with id ${e}`);return a}return e}_updateObjects(e){for(let e of this.json.buffers)delete e.type}_updateMaterial(e){for(let t of e.materials){t.pbrMetallicRoughness={baseColorFactor:[1,1,1,1],metallicFactor:1,roughnessFactor:1};let r=t.values?.tex||t.values?.texture2d_0||t.values?.diffuseTex,a=e.textures.findIndex(e=>e.id===r);-1!==a&&(t.pbrMetallicRoughness.baseColorTexture={index:a})}}}async function a_(e,t,r=0,a,i){return function(e,t,r,a){if(a.core?.baseUrl&&(e.baseUri=a.core?.baseUrl),t instanceof ArrayBuffer&&!function(e,t=0,r={}){let a=new DataView(e),{magic:i=0x676c5446}=r,n=a.getUint32(t,!1);return n===i||0x676c5446===n}(t,r,a.glb)&&(t=new TextDecoder().decode(t)),"string"==typeof t)e.json=function(e){try{return JSON.parse(e)}catch(t){throw Error(`Failed to parse JSON from data starting with "${function(e,t=5){return"string"==typeof e?e.slice(0,t):ArrayBuffer.isView(e)?e8(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?e8(e,0,t):""}(e)}"`)}}(t);else if(t instanceof ArrayBuffer){let i={};r=function(e,t,r=0,a={}){var i,n,o,s,l,c,f;let p=new DataView(t),u=function(e,t=0){return`\
${String.fromCharCode(e.getUint8(t+0))}\
${String.fromCharCode(e.getUint8(t+1))}\
${String.fromCharCode(e.getUint8(t+2))}\
${String.fromCharCode(e.getUint8(t+3))}`}(p,r+0),m=p.getUint32(r+4,!0),d=p.getUint32(r+8,!0);switch(Object.assign(e,{header:{byteOffset:r,byteLength:d,hasBinChunk:!1},type:u,version:m,json:{},binChunks:[]}),r+=12,e.version){case 1:let b,h;return i=e,n=p,o=r,tw(i.header.byteLength>20),b=n.getUint32(o+0,!0),h=n.getUint32(o+4,!0),o+=8,tw(0===h),tP(i,n,o,b),o+=b,o+=tU(i,n,o,i.header.byteLength);case 2:return s=e,l=p,c=r,f={},tw(s.header.byteLength>20),function(e,t,r,a){for(;r+8<=e.header.byteLength;){let i=t.getUint32(r+0,!0),n=t.getUint32(r+4,!0);switch(r+=8,n){case 0x4e4f534a:tP(e,t,r,i);break;case 5130562:tU(e,t,r,i);break;case 0:a.strict||tP(e,t,r,i);break;case 1:a.strict||tU(e,t,r,i)}r+=tN(i,4)}}(s,l,c,f),c+s.header.byteLength;default:throw Error(`Invalid GLB version ${e.version}. Only supports version 1 and 2.`)}}(i,t,r,a.glb),tE("glTF"===i.type,`Invalid GLB magic string ${i.type}`),e._glb=i,e.json=i.json}else tE(!1,"GLTF: must be ArrayBuffer or string");let i=e.json.buffers||[];if(e.buffers=Array(i.length).fill(null),e._glb&&e._glb.header.hasBinChunk){let{binChunks:t}=e._glb;e.buffers[0]={arrayBuffer:t[0].arrayBuffer,byteOffset:t[0].byteOffset,byteLength:t[0].byteLength}}let n=e.json.images||[];e.images=Array(n.length).fill({})}(e,t,r,a),!function(e,t={}){new ax().normalize(e,t)}(e,{normalize:a?.gltf?.normalize}),await am(e,a,i),a?.gltf?.loadBuffers&&e.json.buffers&&await aS(e,a,i),a?.gltf?.loadImages&&await aR(e,a,i),await ad(e,a,i),e}async function aS(e,t,r){let a=e.json.buffers||[];for(let i=0;i<a.length;++i){let n=a[i];if(n.uri){let{fetch:a}=r;tE(a);let o=tL(n.uri,t,r),s=await r?.fetch?.(o),l=await s?.arrayBuffer?.();e.buffers[i]={arrayBuffer:l,byteOffset:0,byteLength:l.byteLength},delete n.uri}else null===e.buffers[i]&&(e.buffers[i]={arrayBuffer:new ArrayBuffer(n.byteLength),byteOffset:0,byteLength:n.byteLength})}}async function aR(e,t,r){let a=function(e){let t=new Set;for(let r of e.json.textures||[])void 0!==r.source&&t.add(r.source);return Array.from(t).sort()}(e),i=e.json.images||[],n=[];for(let o of a)n.push(aT(e,i[o],o,t,r));return await Promise.all(n)}async function aT(e,t,r,a,i){var n,o,s,l;let c,f,p;if(t.uri&&!t.hasOwnProperty("bufferView")){let e=tL(t.uri,a,i),{fetch:r}=i,n=await r(e);t.bufferView={data:c=await n.arrayBuffer()}}if(Number.isFinite(t.bufferView)){let r,a,i,l=(n=e.json,o=e.buffers,s=t.bufferView,tE(r=n.bufferViews[s]),tE(a=o[r.buffer]),i=(r.byteOffset||0)+a.byteOffset,new Uint8Array(a.arrayBuffer,i,r.byteLength));c=e4(l.buffer,l.byteOffset,l.byteLength)}tE(c,"glTF image has no data");let u=(l=t.mimeType,f=a.basis,p=f?.format,{...a,core:{...a.core,mimeType:l},basis:{...f,format:p&&"auto"!==p?p:tM(f?.supportedTextureFormats)}}),m=await e6(c,[e5.$,tC],u,i);m&&m[0]&&(m={compressed:!0,mipmaps:!1,width:m[0].width,height:m[0].height,data:m[0]}),e.images=e.images||[],e.images[r]=m}let ay={dataType:null,batchType:null,name:"glTF",id:"gltf",module:"gltf",version:"4.5.4",extensions:["gltf","glb"],mimeTypes:["model/gltf+json","model/gltf-binary"],text:!0,binary:!0,tests:["glTF"],parse:aA,options:{gltf:{normalize:!0,loadBuffers:!0,loadImages:!0,decompressMeshes:!0}}};async function aA(e,t={},r){let a={...ay.options,...t};a.gltf={...ay.options.gltf,...a.gltf};let i=t?.glb?.byteOffset||0;return await a_({},e,i,a,r)}let aM={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},aI={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},aC={magFilter:10240,minFilter:10241,wrapS:10242,wrapT:10243},aE={10240:9729,10241:9986,10242:10497,10243:10497};class aw{baseUri="";jsonUnprocessed;json;buffers=[];images=[];postProcess(e,t={}){let{json:r,buffers:a=[],images:i=[]}=e,{baseUri:n=""}=e;return tE(r),this.baseUri=n,this.buffers=a,this.images=i,this.jsonUnprocessed=r,this.json=this._resolveTree(e.json,t),this.json}_resolveTree(e,t={}){let r={...e};return this.json=r,e.bufferViews&&(r.bufferViews=e.bufferViews.map((e,t)=>this._resolveBufferView(e,t))),e.images&&(r.images=e.images.map((e,t)=>this._resolveImage(e,t))),e.samplers&&(r.samplers=e.samplers.map((e,t)=>this._resolveSampler(e,t))),e.textures&&(r.textures=e.textures.map((e,t)=>this._resolveTexture(e,t))),e.accessors&&(r.accessors=e.accessors.map((e,t)=>this._resolveAccessor(e,t))),e.materials&&(r.materials=e.materials.map((e,t)=>this._resolveMaterial(e,t))),e.meshes&&(r.meshes=e.meshes.map((e,t)=>this._resolveMesh(e,t))),e.nodes&&(r.nodes=e.nodes.map((e,t)=>this._resolveNode(e,t)),r.nodes=r.nodes.map((e,t)=>this._resolveNodeChildren(e))),e.skins&&(r.skins=e.skins.map((e,t)=>this._resolveSkin(e,t))),e.scenes&&(r.scenes=e.scenes.map((e,t)=>this._resolveScene(e,t))),"number"==typeof this.json.scene&&r.scenes&&(r.scene=r.scenes[this.json.scene]),r}getScene(e){return this._get(this.json.scenes,e)}getNode(e){return this._get(this.json.nodes,e)}getSkin(e){return this._get(this.json.skins,e)}getMesh(e){return this._get(this.json.meshes,e)}getMaterial(e){return this._get(this.json.materials,e)}getAccessor(e){return this._get(this.json.accessors,e)}getCamera(e){return this._get(this.json.cameras,e)}getTexture(e){return this._get(this.json.textures,e)}getSampler(e){return this._get(this.json.samplers,e)}getImage(e){return this._get(this.json.images,e)}getBufferView(e){return this._get(this.json.bufferViews,e)}getBuffer(e){return this._get(this.json.buffers,e)}_get(e,t){if("object"==typeof t)return t;let r=e&&e[t];return r||console.warn(`glTF file error: Could not find ${e}[${t}]`),r}_resolveScene(e,t){return{...e,id:e.id||`scene-${t}`,nodes:(e.nodes||[]).map(e=>this.getNode(e))}}_resolveNode(e,t){let r={...e,id:e?.id||`node-${t}`};return void 0!==e.mesh&&(r.mesh=this.getMesh(e.mesh)),void 0!==e.camera&&(r.camera=this.getCamera(e.camera)),void 0!==e.skin&&(r.skin=this.getSkin(e.skin)),void 0!==e.meshes&&e.meshes.length&&(r.mesh=e.meshes.reduce((e,t)=>{let r=this.getMesh(t);return e.id=r.id,e.primitives=e.primitives.concat(r.primitives),e},{primitives:[]})),r}_resolveNodeChildren(e){return e.children&&(e.children=e.children.map(e=>this.getNode(e))),e}_resolveSkin(e,t){let r="number"==typeof e.inverseBindMatrices?this.getAccessor(e.inverseBindMatrices):void 0;return{...e,id:e.id||`skin-${t}`,inverseBindMatrices:r}}_resolveMesh(e,t){let r={...e,id:e.id||`mesh-${t}`,primitives:[]};return e.primitives&&(r.primitives=e.primitives.map((e,t)=>{let a={...e,attributes:{},indices:void 0,material:void 0},i=e.attributes;for(let e in i)a.attributes[e]=this.getAccessor(i[e]);return void 0!==e.indices&&(a.indices=this.getAccessor(e.indices)),void 0!==e.material&&(a.material=this.getMaterial(e.material)),function(e,t,r){let a;if(2!==e.mode&&6!==e.mode)return e;let i=e.indices?.value,n=e.indices?.count??(tE(a=Object.values(e.attributes)[0],"glTF primitive must define at least one attribute"),a.count),o=function(e,t){if(!e)return Math.max(0,t-1);let r=0;for(let a=0;a<t;a++)r=Math.max(r,Number(e[a]));return r}(i,n),s=o<=65535?Uint16Array:Uint32Array,l=2===e.mode?function(e,t,r){if(t<2)return new r(0);let a=new r(2*t);for(let r=0;r<t;r++)a[2*r]=aN(e,r),a[2*r+1]=aN(e,(r+1)%t);return a}(i,n,s):function(e,t,r){let a=Math.max(0,t-2),i=new r(3*a);for(let t=0;t<a;t++)i[3*t]=aN(e,0),i[3*t+1]=aN(e,t+1),i[3*t+2]=aN(e,t+2);return i}(i,n,s);return e.mode=2===e.mode?1:4,e.indices={id:`${t}-primitive-${r}-portable-indices`,components:1,bytesPerComponent:s.BYTES_PER_ELEMENT,bytesPerElement:s.BYTES_PER_ELEMENT,componentType:s===Uint16Array?5123:5125,normalized:!1,count:l.length,type:"SCALAR",min:l.length?[function(e){let t=1/0;for(let r of e)t=Math.min(t,r);return t}(l)]:void 0,max:l.length?[o]:void 0,value:l},e}(a,r.id,t)})),r}_resolveMaterial(e,t){let r={...e,id:e.id||`material-${t}`};if(r.normalTexture&&(r.normalTexture={...r.normalTexture},r.normalTexture.texture=this.getTexture(r.normalTexture.index)),r.occlusionTexture&&(r.occlusionTexture={...r.occlusionTexture},r.occlusionTexture.texture=this.getTexture(r.occlusionTexture.index)),r.emissiveTexture&&(r.emissiveTexture={...r.emissiveTexture},r.emissiveTexture.texture=this.getTexture(r.emissiveTexture.index)),r.emissiveFactor||(r.emissiveFactor=r.emissiveTexture?[1,1,1]:[0,0,0]),r.pbrMetallicRoughness){r.pbrMetallicRoughness={...r.pbrMetallicRoughness};let e=r.pbrMetallicRoughness;e.baseColorTexture&&(e.baseColorTexture={...e.baseColorTexture},e.baseColorTexture.texture=this.getTexture(e.baseColorTexture.index)),e.metallicRoughnessTexture&&(e.metallicRoughnessTexture={...e.metallicRoughnessTexture},e.metallicRoughnessTexture.texture=this.getTexture(e.metallicRoughnessTexture.index))}return r}_resolveAccessor(e,t){let r=aI[e.componentType],a=aM[e.type],i={...e,id:e.id||`accessor-${t}`,bytesPerComponent:r,components:a,bytesPerElement:r*a,value:void 0,bufferView:void 0,sparse:void 0};if(void 0!==e.bufferView&&(i.bufferView=this.getBufferView(e.bufferView)),i.bufferView){let e=i.bufferView.buffer,{ArrayType:t,byteLength:r}=tz(i,i.bufferView),a=(i.bufferView.byteOffset||0)+(i.byteOffset||0)+e.byteOffset,n=t$(e.arrayBuffer,a,r);i.bufferView.byteStride&&(n=this._getValueFromInterleavedBuffer(e,a,i.bufferView.byteStride,i.bytesPerElement,i.count)),i.value=new t(n)}else{let{ArrayType:e}=tz(i,{byteLength:i.count*i.bytesPerElement});i.value=new e(i.count*i.components)}return e.sparse&&this._applySparseAccessor(i,e.sparse),i}_applySparseAccessor(e,t){let r=function(e){switch(e){case 5121:return Uint8Array;case 5123:return Uint16Array;case 5125:return Uint32Array;default:throw Error(`Invalid glTF sparse index component type ${e}`)}}(t.indices.componentType),a=this._getTypedArrayFromBufferView(r,this.getBufferView(t.indices.bufferView),t.indices.byteOffset||0,t.count),i=e.value.constructor,n=this._getTypedArrayFromBufferView(i,this.getBufferView(t.values.bufferView),t.values.byteOffset||0,t.count*e.components);for(let r=0;r<t.count;r++){let t=Number(a[r]);tE(Number.isInteger(t)&&t>=0&&t<e.count,"glTF sparse accessor index is out of bounds");for(let a=0;a<e.components;a++){let i=t*e.components+a,o=r*e.components+a;Reflect.set(e.value,i,n[o])}}}_getTypedArrayFromBufferView(e,t,r,a){let i=a*e.BYTES_PER_ELEMENT;tE(r+i<=t.byteLength,"glTF sparse accessor data exceeds its buffer view");let n=t.buffer,o=n.byteOffset+(t.byteOffset||0)+r;return new e(t$(n.arrayBuffer,o,i))}_getValueFromInterleavedBuffer(e,t,r,a,i){let n=new Uint8Array(i*a);for(let o=0;o<i;o++){let i=t+o*r;n.set(new Uint8Array(e.arrayBuffer.slice(i,i+a)),o*a)}return n.buffer}_resolveTexture(e,t){return{...e,id:e.id||`texture-${t}`,sampler:"number"==typeof e.sampler?this.getSampler(e.sampler):{id:"default-sampler",parameters:aE},source:"number"==typeof e.source?this.getImage(e.source):void 0}}_resolveSampler(e,t){let r={id:e.id||`sampler-${t}`,...e,parameters:{}};for(let e in r){let t=this._enumSamplerParameter(e);void 0!==t&&(r.parameters[t]=r[e])}return r}_enumSamplerParameter(e){return aC[e]}_resolveImage(e,t){let r={...e,id:e.id||`image-${t}`,image:null,bufferView:void 0!==e.bufferView?this.getBufferView(e.bufferView):void 0},a=this.images[t];return a&&(r.image=a),r}_resolveBufferView(e,t){let r=e.buffer,a=this.buffers[r].arrayBuffer,i=this.buffers[r].byteOffset||0;return e.byteOffset&&(i+=e.byteOffset),{id:`bufferView-${t}`,...e,buffer:this.buffers[r],data:new Uint8Array(a,i,e.byteLength)}}_resolveCamera(e,t){let r={...e,id:e.id||`camera-${t}`};return r.perspective,r.orthographic,r}}function aN(e,t){return e?Number(e[t]):t}async function aP(e){let t=[];return e.scenes.forEach(e=>{e.traverse(e=>{})}),await aU(()=>t.some(e=>!e.loaded))}async function aU(e){for(;e();)await new Promise(e=>requestAnimationFrame(e))}var aL=r(21671);let aF=`\
layout(std140) uniform scenegraphUniforms {
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  mat4 sceneModelMatrix;
  float composeModelMatrix;
} scenegraph;
`,aO={name:"scenegraph",source:`\
struct ScenegraphUniforms {
  sizeScale: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  sceneModelMatrix: mat4x4<f32>,
  composeModelMatrix: f32,
};

@group(0) @binding(auto)
var<uniform> scenegraph: ScenegraphUniforms;
`,vs:aF,fs:aF,uniformTypes:{sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",sceneModelMatrix:"mat4x4<f32>",composeModelMatrix:"f32"}},ak=`\
#version 300 es
#define SHADER_NAME scenegraph-layer-vertex-shader
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
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
geometry.pickingColor = picking_getPickingColorFromInstanceID();
mat3 instanceModelMatrix = mat3(instanceModelMatrixCol0, instanceModelMatrixCol1, instanceModelMatrixCol2);
vec3 normal = vec3(0.0, 0.0, 1.0);
#ifdef LIGHTING_PBR
#ifdef HAS_NORMALS
normal = instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4(normals, 0.0)).xyz;
#endif
#endif
float originalSize = project_size_to_pixel(scenegraph.sizeScale);
float clampedSize = clamp(originalSize, scenegraph.sizeMinPixels, scenegraph.sizeMaxPixels);
float sizeRatio = originalSize == 0.0 ? 0.0 : clampedSize / originalSize;
vec3 pos = (instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4(positions, 1.0)).xyz) * scenegraph.sizeScale * sizeRatio + instanceTranslation;
if(scenegraph.composeModelMatrix > 0.5) {
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
`,aV=`\
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
fragColor = pbr_filterColor(vColor);
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
`,aj=`\
struct VertexInputs {
  @location(0) positions: vec3<f32>,
#ifdef HAS_NORMALS
  @location(1) normals: vec3<f32>,
#endif
#ifdef HAS_UV
  @location(3) texCoords: vec2<f32>,
#endif
  @location(6) instancePositions: vec3<f32>,
  @location(7) instancePositions64Low: vec3<f32>,
  @location(8) instanceColors: vec4<f32>,
  @location(10) instanceModelMatrixCol0: vec3<f32>,
  @location(11) instanceModelMatrixCol1: vec3<f32>,
  @location(12) instanceModelMatrixCol2: vec3<f32>,
  @location(13) instanceTranslation: vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) vTexCoord: vec2<f32>,
  @location(2) pbrPosition: vec3<f32>,
  @location(3) pbrUV: vec2<f32>,
  @location(4) pbrNormal: vec3<f32>,
  @location(5) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> FragmentInputs {
  var outputs: FragmentInputs;

  geometry.worldPosition = inputs.instancePositions;
  geometry.pickingColor = picking_getPickingColorFromIndex(instanceIndex);

  var vertexPosition = inputs.positions;
  var texCoord = vec2<f32>(0.0, 0.0);
  var normal = vec3<f32>(0.0, 0.0, 1.0);

#ifdef HAS_UV
  texCoord = inputs.texCoords;
#endif
#ifdef HAS_NORMALS
  normal = inputs.normals;
#endif

  geometry.uv = texCoord;

  let instanceModelMatrix = mat3x3<f32>(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2
  );

  let scenePosition = (scenegraph.sceneModelMatrix * vec4<f32>(vertexPosition, 1.0)).xyz;
  let worldNormal = instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4<f32>(normal, 0.0)).xyz;

  let originalSize = project_meter_size_to_pixel(scenegraph.sizeScale);
  let clampedSize = clamp(originalSize, scenegraph.sizeMinPixels, scenegraph.sizeMaxPixels);
  let sizeRatio = select(0.0, clampedSize / originalSize, originalSize > 0.0);

  let pos =
    (instanceModelMatrix * scenePosition) * scenegraph.sizeScale * sizeRatio +
    inputs.instanceTranslation;

  if (scenegraph.composeModelMatrix > 0.5) {
    geometry.normal = project_normal(worldNormal);
    geometry.worldPosition = inputs.instancePositions + pos;
    geometry.position = vec4<f32>(
      project_position_vec3_f64(inputs.instancePositions + pos, inputs.instancePositions64Low),
      1.0
    );
  } else {
    let sizeAdjustedPos = project_size_vec3(pos);
    // Scenegraph offsets are east/north/up in globe mode. Use project32's helper so it can
    // rotate the offset onto the local tangent plane before producing the common position.
    let projectResult = project_position_to_clipspace_and_commonspace(
      inputs.instancePositions,
      inputs.instancePositions64Low,
      sizeAdjustedPos
    );
    geometry.position = projectResult.commonPosition;
    geometry.normal = project_normal(worldNormal);
  }

  outputs.position = project_common_position_to_clipspace(geometry.position);
  outputs.vColor = inputs.instanceColors;
  outputs.vTexCoord = texCoord;
  outputs.pbrPosition = geometry.position.xyz;
  outputs.pbrUV = texCoord;
  outputs.pbrNormal = geometry.normal;
  outputs.pickingColor = geometry.pickingColor;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  fragmentGeometry.uv = inputs.vTexCoord;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inputs.pickingColor)) {
      discard;
    }
    return vec4<f32>(inputs.pickingColor, 1.0);
  }

  var fragColor = inputs.vColor;

#ifdef LIGHTING_PBR
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  // scenegraphPbrMaterial uses the indexed UV fields from the current PBR module.
  fragmentInputs.pbr_vUV0 = inputs.pbrUV;
  fragmentInputs.pbr_vUV1 = vec2<f32>(0.0);
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;
  // Vertex color is part of the material base color and must be applied before lighting.
  fragColor = pbr_filterColor(fragColor);
#else
#ifdef HAS_BASECOLORMAP
  fragColor =
    fragColor *
    textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, inputs.vTexCoord);
#endif
#endif

  fragColor.a *= layer.opacity;

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inputs.pickingColor - highlightedObjectColor))) {
      let highlightAlpha = picking.highlightColor.a;
      let blendedAlpha = highlightAlpha + fragColor.a * (1.0 - highlightAlpha);
      if (blendedAlpha > 0.0) {
        let highlightRatio = highlightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highlightRatio),
          blendedAlpha
        );
      }
    }
  }

  return deckgl_premultiplied_alpha(fragColor);
}
`;var aD=r(66925);let aH=y.s.source.replace(/fn pbr_setPositionNormalTangentUV\([\s\S]*?\n}\n/,`fn pbr_setPositionNormalTangentUV(position: vec4f, normal: vec4f, tangent: vec4f, uv: vec2f)
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
`).replace(/pbrProjection\.camera/g,"project.cameraPosition"),aB={...y.s,dependencies:[aD.x],source:aH},aG=[255,255,255,255],az={scenegraph:{type:"object",value:null,async:!0},getScene:e=>e&&e.scenes?"object"==typeof e.scene?e.scene:e.scenes[e.scene||0]:e,getAnimator:e=>e&&e.animator,_animations:null,onFirstDraw:{type:"function",value:()=>{}},sizeScale:{type:"number",value:1,min:0},sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},getPosition:{type:"accessor",value:e=>e.position},getColor:{type:"accessor",value:aG},_lighting:"flat",_imageBasedLightingEnvironment:void 0,getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},loaders:[ay]};class aK extends x.A{getShaders(){let e,t={},r=this.context.device?.type==="webgpu";"pbr"===this.props._lighting?(e=r?aB:y.s,t.LIGHTING_PBR=1):e=r?aB:{name:"pbrMaterial"};let a=[_.A,S.A,R.Ay,aO,e];return super.getShaders({defines:t,vs:ak,fs:aV,source:aj,modules:a})}initializeState(){let e=this.getAttributeManager(),t="webgpu"!==this.context.device.type;e.addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),accessor:"getPosition",transition:t},instanceColors:{type:"unorm8",size:this.props.colorFormat.length,accessor:"getColor",defaultValue:aG,transition:t},instanceModelMatrix:aL.U})}updateState(e){super.updateState(e);let{props:t,oldProps:r}=e;t.scenegraph!==r.scenegraph?this._updateScenegraph():t._animations!==r._animations&&this._applyAnimationsProp(this.state.animator,t._animations)}finalizeState(e){super.finalizeState(e),this._destroyScenegraphAssets()}get isLoaded(){return!!(this.state?.scenegraph&&super.isLoaded)}_updateScenegraph(){let e=this.props,{device:t}=this.context,r=null;if(e.scenegraph instanceof C)r={scenes:[e.scenegraph]};else if(e.scenegraph&&"object"==typeof e.scenegraph){let a=e.scenegraph,i=function(e,t,r){let a,i,n;r?.strictExtensions&&function(e,t){let r=Array.from(e$(e,t).values()).filter(e=>e.required&&!e.supported);if(r.length)throw Error(`Unsupported required glTF extensions: ${r.map(e=>e.extensionName).join(", ")}`)}(t,e);let{scenes:o,materials:s,gltfMeshIdToNodeMap:l,gltfNodeIdToNodeMap:c,gltfNodeIndexToNodeMap:f,generatedTextures:p}=function(e,t,r={}){let a=new Set,i={...eI,...r,generatedTextures:a},n=new q(e,{modules:[y.s]}),o=(t.materials||[]).map((r,a)=>{var o,s;return eS(e,{id:(o=r,s=a,o.name||o.id||`material-${s}`),parsedPPBRMaterial:eC(e,r,{},{...i,gltf:t,validateAttributes:!1}),materialFactory:n})}),s=new Map;(t.materials||[]).forEach((e,t)=>{s.set(e.id,o[t])});let l=new Map;t.meshes.forEach((r,a)=>{let n=eE(e,r,t,s,i);l.set(r.id,n)});let c=new Map,f=new Map,p=new Set,u=new Set,m=new Set;return t.nodes.forEach((e,t)=>{var r;let a=new U({id:(r=e).name||r.id,children:[],matrix:r.matrix,display:r.extensions?.KHR_node_visibility?.visible!==!1,position:r.translation,rotation:r.rotation,scale:r.scale});c.set(t,a),f.set(e.id,a)}),t.nodes.forEach((r,a)=>{if(c.get(a).add((r.children??[]).map(({id:e})=>{let t=f.get(e);if(!t)throw Error(`Cannot find child ${e} of node ${a}`);return t})),r.mesh){let n=r.mesh,o=function(e,t){let r,a=t.extensions?.EXT_mesh_gpu_instancing?.attributes;if(!a||"object"!=typeof a)return null;let i={};for(let[t,n]of Object.entries(a)){let a="number"==typeof n?e.accessors[n]:n;if(!a||!ArrayBuffer.isView(a.value))throw Error(`Invalid glTF instance accessor for ${t}`);if(void 0!==r&&a.count!==r)throw Error("glTF instance attributes must have matching accessor counts");r=a.count,i[t]={value:a.value,size:a.components||function(e){switch(e){case"VEC2":return 2;case"VEC3":return 3;case"VEC4":return 4;default:return 1}}(a.type),count:a.count,normalized:!!a.normalized}}let n=[];for(let e=0;e<(r||0);e++){let t=eT(i.TRANSLATION,e,[0,0,0]),r=eT(i.ROTATION,e,[0,0,0,1]),a=eT(i.SCALE,e,[1,1,1]),o=Math.hypot(...r);if(o>0)for(let e=0;e<r.length;e++)r[e]/=o;n.push(new A.Matrix4().translate(t).multiplyRight(new A.Matrix4().fromQuaternion(r)).scale(a))}return{matrices:n,attributes:i}}(t,r),f=n.primitives.some(e=>!!e.targets?.length),d=o||f&&p.has(n.id)?eE(e,n,t,s,i,o||void 0):l.get(n.id);if(!d)throw Error(`Cannot find mesh child ${r.mesh.id} of node ${a}`);let b=c.get(a),h=l.get(n.id),g=u.has(n.id)&&(void 0!==r.skin||m.has(n.id))&&d===h?eE(e,n,t,s,i):d;if(b.add(g),b.userData.gltfMesh=g,u.add(n.id),void 0!==r.skin&&m.add(n.id),f){p.add(n.id);let e=n.primitives.find(e=>e.targets?.length)?.targets?.length||0,t=r.weights||n.weights||Array(e).fill(0);b.userData.morphMeshes=[g],i.modelOptions?.userData?.gltfAnimatedCrowd?b.userData.morphWeights=[...t]:ey(b,t)}}}),{scenes:t.scenes.map(e=>{let t=(e.nodes||[]).map(({id:t})=>{let r=f.get(t);if(!r)throw Error(`Cannot find child ${t} of scene ${e.name||e.id}`);return r});return new U({id:e.name||e.id,children:t})}),materials:o,gltfMeshIdToNodeMap:l,gltfNodeIdToNodeMap:f,gltfNodeIndexToNodeMap:c,generatedTextures:a}}(e,t,r),u=(a=t.animations||[],i=new Map,n=new Map,a.flatMap((e,r)=>{let a=e.name||`Animation-${r}`,o=new Map,s=e.channels.flatMap(({sampler:r,target:a})=>{let s=function(e,t){let r;if("weights"===t.path)r=t.node;else{if("pointer"!==t.path)return;let e=t.extensions?.KHR_animation_pointer?.pointer,a="string"==typeof e?/^\/nodes\/(\d+)\/weights$/.exec(e):null;if(!a)return;r=Number(a[1])}let a=e.nodes[r??0],i="number"==typeof a?.mesh?e.meshes[a.mesh]:a?.mesh;return a?.weights?.length||i?.weights?.length||i?.primitives?.[0]?.targets?.length||1}(t,a),l=`${r}:${s??0}`,c=o.get(l);if(!c){let a=e.samplers[r];if(!a)throw Error(`Cannot find animation sampler ${r}`);let{input:f,interpolation:p="LINEAR",output:u}=a,m=function(e,t){if(t.has(e))return t.get(e);let{value:r,components:a}=e3(e);e1(1===a,"accessorToJsArray1D must have exactly 1 component");let i=Array.from(r);return t.set(e,i),i}(t.accessors[f],i),d=function(e,t){if(t.has(e))return t.get(e);let{value:r,components:a}=e3(e);e1(a>=1,"accessorToJsArray2D must have at least 1 component");let i=[];for(let e=0;e<r.length;e+=a)i.push(Array.from(r.slice(e,e+a)));return t.set(e,i),i}(t.accessors[u],n);c={input:m,interpolation:p,output:void 0!==s?function(e,t,r,a){let i=e.length/(Math.max(t,1)*("CUBICSPLINE"===r?3:1)),n=a>1?a:Number.isInteger(i)&&i>1?i:a;if(n<=1)return e;let o=e.flat(),s=[];for(let e=0;e<o.length;e+=n)s.push(o.slice(e,e+n));return s}(d,m.length,p,s):d},o.set(l,c)}let f=function(e,t,r){if("pointer"===t.path)return function(e,t,r){let a=t.extensions?.KHR_animation_pointer?.pointer;if("string"!=typeof a||!a.startsWith("/"))return E.R.warn("KHR_animation_pointer channel is missing a valid JSON pointer and will be skipped")(),null;let i=a.slice(1).split("/").map(e=>e.replace(/~1/g,"/").replace(/~0/g,"~"));switch(i[0]){case"nodes":var n,o,s,l,c,f,p,u,m=e,d=i,b=r,h=a;let g=5===d.length&&"extensions"===d[2]&&"KHR_node_visibility"===d[3]&&"visible"===d[4];if(3!==d.length&&!g)return e0(h,"node pointers must target transforms, morph weights, or KHR_node_visibility.visible"),null;let v=Number(d[1]),x=m.nodes[v];if(!Number.isInteger(v)||!x)return E.R.warn(`KHR_animation_pointer target ${h} references a missing node and will be skipped`)(),null;if(g&&"STEP"!==b.interpolation)return e0(h,"boolean visibility animation requires STEP interpolation"),null;let _=g?"visibility":eY(d[2]);return _?{type:"node",sampler:b,targetNodeId:x.id,path:_}:(e0(h,`node property "${d[2]}" has no runtime animation mapping`),null);case"materials":var S=e,R=i,T=r,y=a;if(R.length<3)return e0(y,"material pointers must include a material index and target property path"),null;let A=Number(R[1]),M=S.materials[A];if(!Number.isInteger(A)||!M)return E.R.warn(`KHR_animation_pointer target ${y} references a missing material and will be skipped`)(),null;let I=function(e,t){let r=function(e,t){let r,a=t.lastIndexOf("extensions");if(a<0||"KHR_texture_transform"!==t[a+1]||a<1)return{reason:"not-a-texture-transform-target"};let i=(0,eG.Mg)(t.slice(0,a));if(!i)return{reason:function(e){let t=eZ(e);if(t){let e=eJ[t]||null;if(e?.supportLevel==="none")return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`texture-transform target "${e.join("/")}" has no runtime texture-slot mapping`}(t.slice(0,a))};let n=function(e,t){let r=e;for(let e of t)if(!(r=r?.[e]))return null;return r}(e,i.pathSegments);if(!n)return{reason:`texture-transform target "${t.slice(0,a).join("/")}" does not exist on the referenced material`};let o=t[a+2];if("texCoord"===o)return{reason:"animated KHR_texture_transform.texCoord is unsupported because texCoord selection is structural, not a runtime float/vector update"};if("offset"!==o&&"rotation"!==o&&"scale"!==o)return{reason:`KHR_texture_transform property "${o}" is not animatable; supported properties are offset, rotation, and scale`};let s=t[a+3];if(t.length>a+4)return{reason:`KHR_texture_transform.${o} does not support nested property paths`};if(void 0!==s){if(r=Number(s),"rotation"===o)return{reason:"KHR_texture_transform.rotation does not support component indices"};if(!Number.isInteger(r)||r<0||r>1)return{reason:`KHR_texture_transform.${o} component index "${s}" is invalid; only 0 and 1 are supported`}}return{type:"textureTransform",textureSlot:i.slot,path:o,component:r,baseTransform:(0,eG.e3)(n)}}(e,t);if(!("reason"in r)||"not-a-texture-transform-target"!==r.reason)return r;switch(t.join("/")){case"pbrMetallicRoughness/baseColorFactor":return e.pbrMetallicRoughness?{type:"material",property:"baseColorFactor"}:{reason:eQ(t)};case"pbrMetallicRoughness/metallicFactor":return e.pbrMetallicRoughness?{type:"material",property:"metallicRoughnessValues",component:0}:{reason:eQ(t)};case"pbrMetallicRoughness/roughnessFactor":return e.pbrMetallicRoughness?{type:"material",property:"metallicRoughnessValues",component:1}:{reason:eQ(t)};case"normalTexture/scale":return e.normalTexture?{type:"material",property:"normalScale"}:{reason:eQ(t)};case"occlusionTexture/strength":return e.occlusionTexture?{type:"material",property:"occlusionStrength"}:{reason:eQ(t)};case"emissiveFactor":return{type:"material",property:"emissiveFactor"};case"alphaCutoff":return{type:"material",property:"alphaCutoff"};case"extensions/KHR_materials_specular/specularFactor":return e.extensions?.KHR_materials_specular?{type:"material",property:"specularIntensityFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_specular/specularColorFactor":return e.extensions?.KHR_materials_specular?{type:"material",property:"specularColorFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_ior/ior":return e.extensions?.KHR_materials_ior?{type:"material",property:"ior"}:{reason:eQ(t)};case"extensions/EXT_materials_bump/bumpFactor":return e.extensions?.EXT_materials_bump?{type:"material",property:"bumpFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor":return e.extensions?.KHR_materials_diffuse_transmission?{type:"material",property:"diffuseTransmissionFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor":return e.extensions?.KHR_materials_diffuse_transmission?{type:"material",property:"diffuseTransmissionColorFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_volume_scatter/multiscatterColorFactor":case"extensions/KHR_materials_volume_scatter/multiscatterColor":return e.extensions?.KHR_materials_volume_scatter?{type:"material",property:"multiscatterColorFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_volume_scatter/scatterAnisotropy":return e.extensions?.KHR_materials_volume_scatter?{type:"material",property:"scatterAnisotropy"}:{reason:eQ(t)};case"extensions/KHR_materials_dispersion/dispersion":return e.extensions?.KHR_materials_dispersion?{type:"material",property:"dispersion"}:{reason:eQ(t)};case"extensions/KHR_materials_transmission/transmissionFactor":return e.extensions?.KHR_materials_transmission?{type:"material",property:"transmissionFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_volume/thicknessFactor":return e.extensions?.KHR_materials_volume?{type:"material",property:"thicknessFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_volume/attenuationDistance":return e.extensions?.KHR_materials_volume?{type:"material",property:"attenuationDistance"}:{reason:eQ(t)};case"extensions/KHR_materials_volume/attenuationColor":return e.extensions?.KHR_materials_volume?{type:"material",property:"attenuationColor"}:{reason:eQ(t)};case"extensions/KHR_materials_clearcoat/clearcoatFactor":return e.extensions?.KHR_materials_clearcoat?{type:"material",property:"clearcoatFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor":return e.extensions?.KHR_materials_clearcoat?{type:"material",property:"clearcoatRoughnessFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_sheen/sheenColorFactor":return e.extensions?.KHR_materials_sheen?{type:"material",property:"sheenColorFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_sheen/sheenRoughnessFactor":return e.extensions?.KHR_materials_sheen?{type:"material",property:"sheenRoughnessFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_iridescence/iridescenceFactor":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceFactor"}:{reason:eQ(t)};case"extensions/KHR_materials_iridescence/iridescenceIor":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceIor"}:{reason:eQ(t)};case"extensions/KHR_materials_iridescence/iridescenceThicknessMinimum":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceThicknessRange",component:0}:{reason:eQ(t)};case"extensions/KHR_materials_iridescence/iridescenceThicknessMaximum":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceThicknessRange",component:1}:{reason:eQ(t)};case"extensions/KHR_materials_anisotropy/anisotropyStrength":return e.extensions?.KHR_materials_anisotropy?{type:"material",property:"anisotropyStrength"}:{reason:eQ(t)};case"extensions/KHR_materials_anisotropy/anisotropyRotation":return e.extensions?.KHR_materials_anisotropy?{type:"material",property:"anisotropyRotation"}:{reason:eQ(t)};case"extensions/KHR_materials_emissive_strength/emissiveStrength":return e.extensions?.KHR_materials_emissive_strength?{type:"material",property:"emissiveStrength"}:{reason:eQ(t)};default:return{reason:eQ(t)}}}(M,R.slice(2));return"reason"in I?(e0(y,I.reason),null):{sampler:T,pointer:y,targetMaterialIndex:A,...I};case"cameras":let C,w,N,P;return n=e,o=i,s=r,l=a,C=Number(o[1]),w=n.cameras?.[C],N=o[2],P=o[3],4===o.length&&Number.isInteger(C)&&w&&("perspective"===N||"orthographic"===N)&&w.type===N&&("perspective"===N?["aspectRatio","yfov","znear","zfar"]:["xmag","ymag","znear","zfar"]).includes(P)?{type:"camera",sampler:s,pointer:l,targetCameraIndex:C,projection:N,property:P}:(e0(l,"camera pointers must target a supported projection property"),null);case"extensions":if("KHR_lights_punctual"===i[1]){let t,n,o,s,l,m;return c=e,f=i,p=r,u=a,t=Number(f[3]),n=c.lights||c.extensions?.KHR_lights_punctual?.lights,s=(o="spot"===f[4])?f[5]:f[4],l=o||"color"!==s?void 0:f[5],m=o||void 0!==l?6:5,"lights"===f[2]&&f.length===m&&Number.isInteger(t)&&Array.isArray(n)&&n[t]&&["color","intensity","range","innerConeAngle","outerConeAngle"].includes(s)&&(!o||"innerConeAngle"===s||"outerConeAngle"===s)&&(void 0===l||/^[0-2]$/.test(l)&&"color"===s)?{type:"light",sampler:p,pointer:u,targetLightIndex:t,property:s,...void 0===l?{}:{component:Number(l)}}:(e0(u,"punctual-light pointers must target supported typed light properties"),null)}}return e0(a,`top-level target "${i[0]}" has no runtime animation mapping`),null}(e,t,r);let a=eY(t.path);if(!a)return null;let i=e.nodes[t.node??0];if(!i)throw Error(`Cannot find animation target ${t.node}`);return{type:"node",sampler:r,targetNodeId:i.id,path:a}}(t,a,c);return f?[f]:[]});return s.length?[{name:a,channels:s}]:[]})),m=(t.lights||t.extensions?.KHR_lights_punctual?.lights||[]).map(e=>({...e,...Array.isArray(e.color)?{color:[...e.color]}:{},...e.spot?{spot:{...e.spot}}:{}})),d=(t.cameras||[]).map(e=>{let t={...e};return e.perspective&&(t.perspective={...e.perspective}),e.orthographic&&(t.orthographic={...e.orthographic}),t}),b={useByteColors:r?.useByteColors??!0,nodeVisibility:c,lightDefinitions:m},h=eN(t,b),g=()=>{h.splice(0,h.length,...eN(t,b))},v=new eK({onVisibilityChange:g,cameras:d,lightDefinitions:m,onLightChange:g,animations:u,gltfNodeIdToNodeMap:c,materials:s}),x=new e2(t,o),_=e$(t,e),S=o.map(e=>e9(e.getBounds())),R=function(e){let t=null;for(let r of e)if(r.bounds){if(!t){t=[[...r.bounds[0]],[...r.bounds[1]]];continue}for(let e=0;e<3;e++)t[0][e]=Math.min(t[0][e],r.bounds[0][e]),t[1][e]=Math.max(t[1][e],r.bounds[1][e])}return e9(t)}(S),T=new eq({gltf:t,scenes:o,gltfNodeIndexToNodeMap:f});v.setUpdateHandler(()=>T.update());let M=!1;return{scenes:o,materials:s,variants:x,cameras:d,animator:v,animations:u,lights:h,extensionSupport:_,sceneBounds:S,modelBounds:R,gltfMeshIdToNodeMap:l,gltfNodeIdToNodeMap:c,gltfNodeIndexToNodeMap:f,skins:T,gltf:t,destroy:()=>{if(M)return;M=!0;let e=new Set([...o,...l.values(),...c.values()]),t=new Set,r=new Set(s);for(let a of e)a.preorderTraversal(e=>{e instanceof L&&(t.add(e),e.model?.material&&r.add(e.model.material))});for(let e of t)e.destroy();for(let t of e)t.destroy();for(let e of r)e.destroy();for(let e of p)e.destroy();p.clear()}}}(t,a.json?new aw().postProcess(a,void 0):a,this._getModelOptions());r=i,aP(i).then(()=>this.setNeedsRedraw()).catch(e=>{this.raiseError(e,"loading glTF")})}let a={layer:this,device:this.context.device},i=e.getScene(r,a),n=e.getAnimator(r,a);if(i instanceof U){this._destroyScenegraphAssets(),this._applyAnimationsProp(n,e._animations);let t=[];i.traverse(e=>{e instanceof L&&t.push(e.model)}),this.setState({scenegraph:i,animator:n,materials:r?.materials||null,models:t,firstDrawSignaled:!1}),this.getAttributeManager().invalidateAll()}else null!==i&&T.A.warn("invalid scenegraph:",i)()}_destroyScenegraphAssets(){this.state.scenegraph?.destroy(),this.state.materials?.forEach(e=>e.destroy()),this.state.scenegraph=null,this.state.animator=null,this.state.materials=null,this.state.models=[]}_applyAnimationsProp(e,t){if(!e||!t)return;let r=e.getAnimations();Object.keys(t).sort().forEach(e=>{let a=t[e];if("*"===e)r.forEach(e=>{Object.assign(e,a)});else if(Number.isFinite(Number(e))){let t=Number(e);t>=0&&t<r.length?Object.assign(r[t],a):T.A.warn(`animation ${e} not found`)()}else{let t=r.find(({animation:t})=>t.name===e);t?Object.assign(t,a):T.A.warn(`animation ${e} not found`)()}})}_getModelOptions(){let e,{_imageBasedLightingEnvironment:t}=this.props;t&&(e="function"==typeof t?t({device:this.context.device,gl:this.context.gl,layer:this}):t);let r="webgpu"===this.context.device.type?{depthWriteEnabled:!0,depthCompare:"less-equal"}:void 0;return{imageBasedLightingEnvironment:e,modelOptions:{id:this.props.id,isInstanced:!0,bufferLayout:this.getAttributeManager().getBufferLayouts(),parameters:r,...this.getShaders()},useTangents:!1}}draw({context:e}){if(!this.state.scenegraph)return;this.props._animations&&this.state.animator&&(this.state.animator.setTime(e.timeline.getTime()),this.setNeedsRedraw());let{viewport:t,renderPass:r}=this.context,{sizeScale:a,sizeMinPixels:i,sizeMaxPixels:n,coordinateSystem:o}=this.props,s={camera:t.cameraPosition},l=this.getNumInstances();this.state.scenegraph.traverse((e,{worldMatrix:c})=>{if(e instanceof L){let{model:f}=e;f.setInstanceCount(l);let p={sizeScale:a,sizeMinPixels:i,sizeMaxPixels:n,composeModelMatrix:+!!(0,aL.w)(t,o),sceneModelMatrix:c};f.shaderInputs.setProps({pbrProjection:s,scenegraph:p}),f.draw(r)}}),this.state.firstDrawSignaled||(this.state.firstDrawSignaled=!0,this.props.onFirstDraw?.())}}aK.defaultProps=az,aK.layerName="ScenegraphLayer";let aq=aK},21671(e,t,r){r.d(t,{U:()=>c,w:()=>f});var a=r(53439);let i=Math.PI/180,n=new Float32Array(16),o=new Float32Array(12);function s(e,t,r){let a=t[0]*i,n=t[1]*i,o=t[2]*i,s=Math.sin(o),l=Math.sin(a),c=Math.sin(n),f=Math.cos(o),p=Math.cos(a),u=Math.cos(n),m=r[0],d=r[1],b=r[2];e[0]=m*u*p,e[1]=m*c*p,e[2]=-(m*l),e[3]=d*(-c*f+u*l*s),e[4]=d*(u*f+c*l*s),e[5]=d*p*s,e[6]=b*(c*s+u*l*f),e[7]=b*(-u*s+c*l*f),e[8]=b*p*f}function l(e){return e[0]=e[0],e[1]=e[1],e[2]=e[2],e[3]=e[4],e[4]=e[5],e[5]=e[6],e[6]=e[8],e[7]=e[9],e[8]=e[10],e[9]=e[12],e[10]=e[13],e[11]=e[14],e.subarray(0,12)}let c={size:12,accessor:["getOrientation","getScale","getTranslation","getTransformMatrix"],shaderAttributes:{instanceModelMatrixCol0:{size:3,elementOffset:0},instanceModelMatrixCol1:{size:3,elementOffset:3},instanceModelMatrixCol2:{size:3,elementOffset:6},instanceTranslation:{size:3,elementOffset:9}},update(e,{startRow:t,endRow:r}){let{data:i,getOrientation:c,getScale:f,getTranslation:p,getTransformMatrix:u}=this.props,m=Array.isArray(u),d=m&&16===u.length,b=Array.isArray(f),h=Array.isArray(c),g=Array.isArray(p),v=d||!m&&!!u(i[0]);v?e.constant=d:e.constant=h&&b&&g;let x=e.value;if(e.constant){let t;v?(n.set(u),t=l(n)):(s(t=o,c,f),t.set(p,9)),e.value=new Float32Array(t)}else{let m=t*e.size,{iterable:_,objectInfo:S}=(0,a.X)(i,t,r);for(let e of _){let t;(S.index++,v)?(n.set(d?u:u(e,S)),t=l(n)):(s(t=o,h?c:c(e,S),b?f:f(e,S)),t.set(g?p:p(e,S),9)),x[m++]=t[0],x[m++]=t[1],x[m++]=t[2],x[m++]=t[3],x[m++]=t[4],x[m++]=t[5],x[m++]=t[6],x[m++]=t[7],x[m++]=t[8],x[m++]=t[9],x[m++]=t[10],x[m++]=t[11]}}}};function f(e,t){return"cartesian"===t||"meter-offsets"===t||"default"===t&&!e.isGeospatial}},20998(e,t,r){r.d(t,{lO:()=>f});var a=r(29651),i=r(80698),n=r(42528),o=r(63168),s=r(54393);function l(e){switch(e){case s.n.CLAMP_TO_EDGE:return"clamp-to-edge";case s.n.REPEAT:return"repeat";case s.n.MIRRORED_REPEAT:return"mirror-repeat";default:return}}let c={NORMAL:["NORMAL","normals"],TANGENT:["TANGENT"],TEXCOORD_0:["TEXCOORD_0","texCoords"],TEXCOORD_1:["TEXCOORD_1","texCoords1"],JOINTS_0:["JOINTS_0"],WEIGHTS_0:["WEIGHTS_0"],COLOR_0:["COLOR_0","colors"]};function f(e,t,r,i){let n={defines:{MANUAL_SRGB:!0},bindings:{},uniforms:{camera:[0,0,0],metallicRoughnessValues:[1,1]},parameters:{},glParameters:{},generatedTextures:[]};n.defines.USE_TEX_LOD=!0;let{imageBasedLightingEnvironment:o}=i;return o&&(n.bindings.pbr_diffuseEnvSampler=o.diffuseEnvSampler.texture,n.bindings.pbr_specularEnvSampler=o.specularEnvSampler.texture,n.bindings.pbr_brdfLUT=o.brdfLutTexture.texture,n.uniforms.IBLenabled=!0,n.uniforms.scaleIBLAmbient=[1,1]),i?.pbrDebug&&(n.defines.PBR_DEBUG=!0,n.uniforms.scaleDiffBaseMR=[0,0,0,0],n.uniforms.scaleFGDSpec=[0,0,0,0]),u(r,"NORMAL")&&(n.defines.HAS_NORMALS=!0),u(r,"TANGENT")&&i?.useTangents&&(n.defines.HAS_TANGENTS=!0),u(r,"TEXCOORD_0")&&(n.defines.HAS_UV=!0),u(r,"TEXCOORD_1")&&(n.defines.HAS_UV_1=!0),u(r,"JOINTS_0")&&u(r,"WEIGHTS_0")&&(n.defines.HAS_SKIN=!0),u(r,"COLOR_0")&&(n.defines.HAS_COLORS=!0),i?.imageBasedLightingEnvironment&&(n.defines.USE_IBL=!0),i?.lights&&(n.defines.USE_LIGHTS=!0),t&&(!1!==i.validateAttributes&&function(e,t){let r=p(e,0);r.length>0&&!u(t,"TEXCOORD_0")&&a.R.warn(`glTF material uses ${r.join(", ")} but primitive is missing TEXCOORD_0; textured shading will sample the default UV coordinates`)();let i=p(e,1);if(i.length>0&&!u(t,"TEXCOORD_1")&&a.R.warn(`glTF material uses ${i.join(", ")} with TEXCOORD_1 but primitive is missing TEXCOORD_1; those textures will be skipped`)(),e.unlit||e.extensions?.KHR_materials_unlit||u(t,"NORMAL"))return;let n=e.normalTexture?"lit PBR shading with normalTexture":"lit PBR shading";a.R.warn(`glTF primitive is missing NORMAL while using ${n}; shading will fall back to geometric normals`)()}(t,r),function(e,t,r,i,n){if(r.uniforms.unlit=!!(t.unlit||t.extensions?.KHR_materials_unlit),t.pbrMetallicRoughness&&function(e,t,r,a,i){t.baseColorTexture&&m(e,t.baseColorTexture,"pbr_baseColorSampler",r,{featureOptions:{define:"HAS_BASECOLORMAP",enabledUniformName:"baseColorMapEnabled"},gltf:i,attributes:a,textureTransformSlot:"baseColor"}),r.uniforms.baseColorFactor=t.baseColorFactor||[1,1,1,1],t.metallicRoughnessTexture&&m(e,t.metallicRoughnessTexture,"pbr_metallicRoughnessSampler",r,{featureOptions:{define:"HAS_METALROUGHNESSMAP",enabledUniformName:"metallicRoughnessMapEnabled"},gltf:i,attributes:a,textureTransformSlot:"metallicRoughness"});let{metallicFactor:n=1,roughnessFactor:o=1}=t;r.uniforms.metallicRoughnessValues=[n,o]}(e,t.pbrMetallicRoughness,r,i,n),t.normalTexture){m(e,t.normalTexture,"pbr_normalSampler",r,{featureOptions:{define:"HAS_NORMALMAP",enabledUniformName:"normalMapEnabled"},gltf:n,attributes:i,textureTransformSlot:"normal"});let{scale:a=1}=t.normalTexture;r.uniforms.normalScale=a}if(t.occlusionTexture){m(e,t.occlusionTexture,"pbr_occlusionSampler",r,{featureOptions:{define:"HAS_OCCLUSIONMAP",enabledUniformName:"occlusionMapEnabled"},gltf:n,attributes:i,textureTransformSlot:"occlusion"});let{strength:a=1}=t.occlusionTexture;r.uniforms.occlusionStrength=a}switch(r.uniforms.emissiveFactor=t.emissiveFactor||[0,0,0],t.emissiveTexture&&m(e,t.emissiveTexture,"pbr_emissiveSampler",r,{featureOptions:{define:"HAS_EMISSIVEMAP",enabledUniformName:"emissiveMapEnabled"},gltf:n,attributes:i,textureTransformSlot:"emissive"}),function(e,t,r,i,n={}){var o,l,c,f,p,u,d;t&&(((o=t).KHR_materials_specular||o.KHR_materials_ior||o.EXT_materials_bump||o.KHR_materials_transmission||o.KHR_materials_diffuse_transmission||o.KHR_materials_volume||o.KHR_materials_volume_scatter||o.KHR_materials_dispersion||o.KHR_materials_clearcoat||o.KHR_materials_sheen||o.KHR_materials_iridescence||o.KHR_materials_anisotropy)&&(r.defines.USE_MATERIAL_EXTENSIONS=!0),function(e,t,r,a,i={}){t&&(t.specularColorFactor&&(r.uniforms.specularColorFactor=t.specularColorFactor),void 0!==t.specularFactor&&(r.uniforms.specularIntensityFactor=t.specularFactor),t.specularColorTexture&&m(e,t.specularColorTexture,"pbr_specularColorSampler",r,{featureOptions:{define:"HAS_SPECULARCOLORMAP",enabledUniformName:"specularColorMapEnabled"},gltf:a,attributes:i,textureTransformSlot:"specularColor"}),t.specularTexture&&m(e,t.specularTexture,"pbr_specularIntensitySampler",r,{featureOptions:{define:"HAS_SPECULARINTENSITYMAP",enabledUniformName:"specularIntensityMapEnabled"},gltf:a,attributes:i,textureTransformSlot:"specularIntensity"}))}(e,t.KHR_materials_specular,r,i,n),l=t.KHR_materials_ior,c=r,l?.ior!==void 0&&(c.uniforms.ior=l.ior),function(e,t,r,a,i={}){t&&(r.uniforms.bumpFactor=Math.max(t.bumpFactor??1,0),t.bumpTexture&&m(e,t.bumpTexture,"pbr_bumpSampler",r,{featureOptions:{define:"HAS_BUMPMAP",enabledUniformName:"bumpMapEnabled"},gltf:a,attributes:i,textureTransformSlot:"bump"}))}(e,t.EXT_materials_bump,r,i,n),function(e,t,r,i,n={}){t&&(void 0!==t.transmissionFactor&&(r.uniforms.transmissionFactor=t.transmissionFactor),t.transmissionTexture&&m(e,t.transmissionTexture,"pbr_transmissionSampler",r,{featureOptions:{define:"HAS_TRANSMISSIONMAP",enabledUniformName:"transmissionMapEnabled"},gltf:i,attributes:n,textureTransformSlot:"transmission"}),(t.transmissionFactor??0)>0||t.transmissionTexture)&&(a.R.warn("KHR_materials_transmission uses a premultiplied-alpha blending approximation and may require mesh sorting")(),r.parameters.blend=!0,r.parameters.depthWriteEnabled=!1,r.parameters.blendColorOperation="add",r.parameters.blendColorSrcFactor="one",r.parameters.blendColorDstFactor="one-minus-src-alpha",r.parameters.blendAlphaOperation="add",r.parameters.blendAlphaSrcFactor="one",r.parameters.blendAlphaDstFactor="one-minus-src-alpha",r.glParameters.blend=!0,r.glParameters.depthMask=!1,r.glParameters.blendEquation=s.n.FUNC_ADD,r.glParameters.blendFunc=[s.n.ONE,s.n.ONE_MINUS_SRC_ALPHA,s.n.ONE,s.n.ONE_MINUS_SRC_ALPHA])}(e,t.KHR_materials_transmission,r,i,n),function(e,t,r,a,i={}){t&&(r.uniforms.diffuseTransmissionFactor=Math.min(Math.max(t.diffuseTransmissionFactor??0,0),1),r.uniforms.diffuseTransmissionColorFactor=t.diffuseTransmissionColorFactor||[1,1,1],t.diffuseTransmissionTexture&&m(e,t.diffuseTransmissionTexture,"pbr_diffuseTransmissionSampler",r,{featureOptions:{define:"HAS_DIFFUSETRANSMISSIONMAP",enabledUniformName:"diffuseTransmissionMapEnabled"},gltf:a,attributes:i,textureTransformSlot:"diffuseTransmission"}),t.diffuseTransmissionColorTexture&&m(e,t.diffuseTransmissionColorTexture,"pbr_diffuseTransmissionColorSampler",r,{featureOptions:{define:"HAS_DIFFUSETRANSMISSIONCOLORMAP",enabledUniformName:"diffuseTransmissionColorMapEnabled"},gltf:a,attributes:i,textureTransformSlot:"diffuseTransmissionColor"}))}(e,t.KHR_materials_diffuse_transmission,r,i,n),function(e,t,r,a,i={}){t&&(void 0!==t.thicknessFactor&&(r.uniforms.thicknessFactor=t.thicknessFactor),t.thicknessTexture&&m(e,t.thicknessTexture,"pbr_thicknessSampler",r,{featureOptions:{define:"HAS_THICKNESSMAP"},gltf:a,attributes:i,textureTransformSlot:"thickness"}),void 0!==t.attenuationDistance&&(r.uniforms.attenuationDistance=t.attenuationDistance),t.attenuationColor&&(r.uniforms.attenuationColor=t.attenuationColor))}(e,t.KHR_materials_volume,r,i,n),function(e,t,r,a,i,n={}){t&&r&&(a.uniforms.multiscatterColorFactor=t.multiscatterColorFactor||t.multiscatterColor||[0,0,0],a.uniforms.scatterAnisotropy=Math.min(Math.max(t.scatterAnisotropy??0,-.999),.999),t.multiscatterColorTexture&&m(e,t.multiscatterColorTexture,"pbr_multiscatterColorSampler",a,{featureOptions:{define:"HAS_MULTISCATTERCOLORMAP",enabledUniformName:"multiscatterColorMapEnabled"},gltf:i,attributes:n,textureTransformSlot:"multiscatterColor"}))}(e,t.KHR_materials_volume_scatter,t.KHR_materials_volume,r,i,n),f=t.KHR_materials_dispersion,p=r,f?.dispersion!==void 0&&(p.uniforms.dispersion=Math.max(f.dispersion,0)),function(e,t,r,a,i={}){t&&(void 0!==t.clearcoatFactor&&(r.uniforms.clearcoatFactor=t.clearcoatFactor),void 0!==t.clearcoatRoughnessFactor&&(r.uniforms.clearcoatRoughnessFactor=t.clearcoatRoughnessFactor),t.clearcoatTexture&&m(e,t.clearcoatTexture,"pbr_clearcoatSampler",r,{featureOptions:{define:"HAS_CLEARCOATMAP",enabledUniformName:"clearcoatMapEnabled"},gltf:a,attributes:i,textureTransformSlot:"clearcoat"}),t.clearcoatRoughnessTexture&&m(e,t.clearcoatRoughnessTexture,"pbr_clearcoatRoughnessSampler",r,{featureOptions:{define:"HAS_CLEARCOATROUGHNESSMAP",enabledUniformName:"clearcoatRoughnessMapEnabled"},gltf:a,attributes:i,textureTransformSlot:"clearcoatRoughness"}),t.clearcoatNormalTexture&&m(e,t.clearcoatNormalTexture,"pbr_clearcoatNormalSampler",r,{featureOptions:{define:"HAS_CLEARCOATNORMALMAP"},gltf:a,attributes:i,textureTransformSlot:"clearcoatNormal"}))}(e,t.KHR_materials_clearcoat,r,i,n),function(e,t,r,a,i={}){t&&(t.sheenColorFactor&&(r.uniforms.sheenColorFactor=t.sheenColorFactor),void 0!==t.sheenRoughnessFactor&&(r.uniforms.sheenRoughnessFactor=t.sheenRoughnessFactor),t.sheenColorTexture&&m(e,t.sheenColorTexture,"pbr_sheenColorSampler",r,{featureOptions:{define:"HAS_SHEENCOLORMAP",enabledUniformName:"sheenColorMapEnabled"},gltf:a,attributes:i,textureTransformSlot:"sheenColor"}),t.sheenRoughnessTexture&&m(e,t.sheenRoughnessTexture,"pbr_sheenRoughnessSampler",r,{featureOptions:{define:"HAS_SHEENROUGHNESSMAP",enabledUniformName:"sheenRoughnessMapEnabled"},gltf:a,attributes:i,textureTransformSlot:"sheenRoughness"}))}(e,t.KHR_materials_sheen,r,i,n),function(e,t,r,a,i={}){t&&(void 0!==t.iridescenceFactor&&(r.uniforms.iridescenceFactor=t.iridescenceFactor),void 0!==t.iridescenceIor&&(r.uniforms.iridescenceIor=t.iridescenceIor),(void 0!==t.iridescenceThicknessMinimum||void 0!==t.iridescenceThicknessMaximum)&&(r.uniforms.iridescenceThicknessRange=[t.iridescenceThicknessMinimum??100,t.iridescenceThicknessMaximum??400]),t.iridescenceTexture&&m(e,t.iridescenceTexture,"pbr_iridescenceSampler",r,{featureOptions:{define:"HAS_IRIDESCENCEMAP",enabledUniformName:"iridescenceMapEnabled"},gltf:a,attributes:i,textureTransformSlot:"iridescence"}),t.iridescenceThicknessTexture&&m(e,t.iridescenceThicknessTexture,"pbr_iridescenceThicknessSampler",r,{featureOptions:{define:"HAS_IRIDESCENCETHICKNESSMAP"},gltf:a,attributes:i,textureTransformSlot:"iridescenceThickness"}))}(e,t.KHR_materials_iridescence,r,i,n),function(e,t,r,a,i={}){t&&(void 0!==t.anisotropyStrength&&(r.uniforms.anisotropyStrength=t.anisotropyStrength),void 0!==t.anisotropyRotation&&(r.uniforms.anisotropyRotation=t.anisotropyRotation),t.anisotropyTexture&&m(e,t.anisotropyTexture,"pbr_anisotropySampler",r,{featureOptions:{define:"HAS_ANISOTROPYMAP",enabledUniformName:"anisotropyMapEnabled"},gltf:a,attributes:i,textureTransformSlot:"anisotropy"}))}(e,t.KHR_materials_anisotropy,r,i,n),u=t.KHR_materials_emissive_strength,d=r,u?.emissiveStrength!==void 0&&(d.uniforms.emissiveStrength=u.emissiveStrength))}(e,t.extensions,r,n,i),t.alphaMode||"OPAQUE"){case"OPAQUE":break;case"MASK":{let{alphaCutoff:e=.5}=t;r.defines.ALPHA_CUTOFF=!0,r.uniforms.alphaCutoffEnabled=!0,r.uniforms.alphaCutoff=e;break}case"BLEND":var o;a.R.warn("glTF BLEND alphaMode might not work well because it requires mesh sorting")(),(o=r).parameters.blend=!0,o.parameters.blendColorOperation="add",o.parameters.blendColorSrcFactor="src-alpha",o.parameters.blendColorDstFactor="one-minus-src-alpha",o.parameters.blendAlphaOperation="add",o.parameters.blendAlphaSrcFactor="one",o.parameters.blendAlphaDstFactor="one-minus-src-alpha",o.glParameters.blend=!0,o.glParameters.blendEquation=s.n.FUNC_ADD,o.glParameters.blendFunc=[s.n.SRC_ALPHA,s.n.ONE_MINUS_SRC_ALPHA,s.n.ONE,s.n.ONE_MINUS_SRC_ALPHA]}}(e,t,n,r,i.gltf)),n}function p(e,t){let r=[];for(let a of(0,o.ii)()){let i=function(e,t){let r=e;for(let e of t)if(!(r=r?.[e]))return null;return r}(e,a.pathSegments);i&&(0,o.CC)(i)===t&&r.push(a.displayName)}return r}function u(e,t){return c[t].some(t=>!!e[t])}function m(e,t,r,c,f={}){let{featureOptions:p={},gltf:h,attributes:g={},textureTransformSlot:v}=f,{define:x,enabledUniformName:_}=p,S=(0,o.CC)(t);if(S>1)return void a.R.warn(`Skipping ${String(r)} because ${S} is not supported; only TEXCOORD_0 and TEXCOORD_1 are currently available`)();if(1===S&&!u(g,"TEXCOORD_1"))return void a.R.warn(`Skipping ${String(r)} because it requires TEXCOORD_1 but the primitive does not provide TEXCOORD_1`)();let R=function(e,t){if(e.texture||void 0===e.index||!t?.textures)return e;let r=t.textures[e.index];return r?"texture"in r&&r.texture?{...r,...e,texture:r.texture}:"source"in r?{...e,texture:r}:e:e}(t,h),T=R.texture?.source?.image;if(!T)return void a.R.warn(`Skipping unresolved glTF texture for ${String(r)}`)();let y=function(e,t,r){if("compressed"in t)return function(e,t,r){let o;if(0===(o=Array.isArray(t.data)&&t.data[0]?.data?t.data:"mipmaps"in t&&Array.isArray(t.mipmaps)?t.mipmaps:[]).length||!o[0]?.data)return a.R.warn("createCompressedTexture: compressed image has no valid mip levels, creating fallback")(),d(e,r);let s=o[0],l=s.width??t.width??0,c=s.height??t.height??0;if(l<=0||c<=0)return a.R.warn("createCompressedTexture: base level has invalid dimensions, creating fallback")(),d(e,r);let f=b(s);if(!f)return a.R.warn("createCompressedTexture: compressed image has no textureFormat, creating fallback")(),d(e,r);if(!e.isTextureFormatSupported(f))return a.R.warn(`createCompressedTexture: ${e.type} device does not support '${f}', creating fallback`)(),d(e,r);let p=function(e,t,r){let{blockWidth:a=1,blockHeight:i=1}=n.vz.getInfo(r),o=1;for(let r=1;;r++){let n=Math.max(1,e>>r),s=Math.max(1,t>>r);if(n<a||s<i)break;o++}return o}(l,c,f),u=Math.min(o.length,p),m=1;for(let e=1;e<u;e++){let t=o[e];if(!t.data||t.width<=0||t.height<=0){a.R.warn(`createCompressedTexture: mip level ${e} has invalid data/dimensions, truncating`)();break}let r=b(t);if(r&&r!==f){a.R.warn(`createCompressedTexture: mip level ${e} format '${r}' differs from base '${f}', truncating`)();break}let i=Math.max(1,l>>e),n=Math.max(1,c>>e);if(t.width!==i||t.height!==n){a.R.warn(`createCompressedTexture: mip level ${e} dimensions ${t.width}x${t.height} don't match expected ${i}x${n}, truncating`)();break}m++}let h=e.createTexture({...r,format:f,usage:i.g.TEXTURE|i.g.COPY_DST,width:l,height:c,mipLevels:m,data:s.data});for(let e=1;e<m;e++)h.writeData(o[e].data,{width:o[e].width,height:o[e].height,mipLevel:e});return h}(e,t,{id:r.id,sampler:r.sampler});let o=void 0!==r.width&&void 0!==r.height?{width:r.width,height:r.height}:e.getExternalImageSize(t),s="nearest"===r.sampler.mipmapFilter||"linear"===r.sampler.mipmapFilter,l=s?e.getMipLevelCount(o.width,o.height):1,c=e.createTexture({id:r.id,sampler:r.sampler,width:o.width,height:o.height,mipLevels:l,...s?{usage:i.g.SAMPLE|i.g.RENDER|i.g.COPY_DST|i.g.COPY_SRC}:{},...r.colorSpace?{format:"srgb"===r.colorSpace?"rgba8unorm-srgb":"rgba8unorm"}:{},data:t});return l>1&&("webgl"===e.type?c.generateMipmapsWebGL():"webgpu"===e.type&&e.generateMipmapsWebGPU(c)),c}(e,T,{id:R.uniformName||R.id,sampler:{addressModeU:"repeat",addressModeV:"repeat",minFilter:"linear",magFilter:"linear",...function(e={}){let t=e.wrapS??e.parameters?.[s.n.TEXTURE_WRAP_S],r=e.wrapT??e.parameters?.[s.n.TEXTURE_WRAP_T],a=e.magFilter??e.parameters?.[s.n.TEXTURE_MAG_FILTER],i=e.minFilter??e.parameters?.[s.n.TEXTURE_MIN_FILTER],n=l(t),o=l(r),c=function(e){switch(e){case s.n.NEAREST:return"nearest";case s.n.LINEAR:return"linear";default:return}}(a);return{...n?{addressModeU:n}:{},...o?{addressModeV:o}:{},...c?{magFilter:c}:{},...function(e){switch(e){case s.n.NEAREST:return{minFilter:"nearest"};case s.n.LINEAR:return{minFilter:"linear"};case s.n.NEAREST_MIPMAP_NEAREST:return{minFilter:"nearest",mipmapFilter:"nearest"};case s.n.LINEAR_MIPMAP_NEAREST:return{minFilter:"linear",mipmapFilter:"nearest"};case s.n.NEAREST_MIPMAP_LINEAR:return{minFilter:"nearest",mipmapFilter:"linear"};case s.n.LINEAR_MIPMAP_LINEAR:return{minFilter:"linear",mipmapFilter:"linear"};default:return{}}}(i)}}(R.texture.sampler)}});if(c.bindings[r]=y,x&&(c.defines[x]=!0),_&&(c.uniforms[_]=!0),v){let e=(0,o.lz)(v);c.uniforms[e.uvSetUniform]=S,c.uniforms[e.uvTransformUniform]=(0,o.VJ)((0,o.e3)(t))}c.generatedTextures.push(y)}function d(e,t){return e.createTexture({...t,format:"rgba8unorm",width:1,height:1,mipLevels:1})}function b(e){return e.textureFormat}},63168(e,t,r){r.d(t,{CC:()=>f,Mg:()=>p,VJ:()=>u,dy:()=>m,e3:()=>c,ii:()=>s,lz:()=>l});var a=r(41481);let i=[o("baseColor","pbr_baseColorSampler","baseColorTexture",["pbrMetallicRoughness","baseColorTexture"]),o("metallicRoughness","pbr_metallicRoughnessSampler","metallicRoughnessTexture",["pbrMetallicRoughness","metallicRoughnessTexture"]),o("normal","pbr_normalSampler","normalTexture",["normalTexture"]),o("occlusion","pbr_occlusionSampler","occlusionTexture",["occlusionTexture"]),o("emissive","pbr_emissiveSampler","emissiveTexture",["emissiveTexture"]),o("specularColor","pbr_specularColorSampler","KHR_materials_specular.specularColorTexture",["extensions","KHR_materials_specular","specularColorTexture"]),o("specularIntensity","pbr_specularIntensitySampler","KHR_materials_specular.specularTexture",["extensions","KHR_materials_specular","specularTexture"]),o("transmission","pbr_transmissionSampler","KHR_materials_transmission.transmissionTexture",["extensions","KHR_materials_transmission","transmissionTexture"]),o("thickness","pbr_thicknessSampler","KHR_materials_volume.thicknessTexture",["extensions","KHR_materials_volume","thicknessTexture"]),o("clearcoat","pbr_clearcoatSampler","KHR_materials_clearcoat.clearcoatTexture",["extensions","KHR_materials_clearcoat","clearcoatTexture"]),o("clearcoatRoughness","pbr_clearcoatRoughnessSampler","KHR_materials_clearcoat.clearcoatRoughnessTexture",["extensions","KHR_materials_clearcoat","clearcoatRoughnessTexture"]),o("clearcoatNormal","pbr_clearcoatNormalSampler","KHR_materials_clearcoat.clearcoatNormalTexture",["extensions","KHR_materials_clearcoat","clearcoatNormalTexture"]),o("sheenColor","pbr_sheenColorSampler","KHR_materials_sheen.sheenColorTexture",["extensions","KHR_materials_sheen","sheenColorTexture"]),o("sheenRoughness","pbr_sheenRoughnessSampler","KHR_materials_sheen.sheenRoughnessTexture",["extensions","KHR_materials_sheen","sheenRoughnessTexture"]),o("iridescence","pbr_iridescenceSampler","KHR_materials_iridescence.iridescenceTexture",["extensions","KHR_materials_iridescence","iridescenceTexture"]),o("iridescenceThickness","pbr_iridescenceThicknessSampler","KHR_materials_iridescence.iridescenceThicknessTexture",["extensions","KHR_materials_iridescence","iridescenceThicknessTexture"]),o("anisotropy","pbr_anisotropySampler","KHR_materials_anisotropy.anisotropyTexture",["extensions","KHR_materials_anisotropy","anisotropyTexture"]),o("bump","pbr_bumpSampler","EXT_materials_bump.bumpTexture",["extensions","EXT_materials_bump","bumpTexture"]),o("diffuseTransmission","pbr_diffuseTransmissionSampler","KHR_materials_diffuse_transmission.diffuseTransmissionTexture",["extensions","KHR_materials_diffuse_transmission","diffuseTransmissionTexture"]),o("diffuseTransmissionColor","pbr_diffuseTransmissionColorSampler","KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture",["extensions","KHR_materials_diffuse_transmission","diffuseTransmissionColorTexture"]),o("multiscatterColor","pbr_multiscatterColorSampler","KHR_materials_volume_scatter.multiscatterColorTexture",["extensions","KHR_materials_volume_scatter","multiscatterColorTexture"])],n=new Map(i.map(e=>[e.slot,e]));function o(e,t,r,a){return{slot:e,binding:t,displayName:r,pathSegments:a,colorSpace:"baseColor"===e||"emissive"===e||"specularColor"===e||"sheenColor"===e||"diffuseTransmissionColor"===e||"multiscatterColor"===e?"srgb":"linear",uvSetUniform:`${e}UVSet`,uvTransformUniform:`${e}UVTransform`}}function s(){return i}function l(e){let t=n.get(e);if(!t)throw Error(`Unknown PBR texture transform slot ${e}`);return t}function c(e){let t=e?.extensions?.KHR_texture_transform;return{offset:t?.offset?[t.offset[0],t.offset[1]]:[0,0],rotation:t?.rotation??0,scale:t?.scale?[t.scale[0],t.scale[1]]:[1,1]}}function f(e){let t=e?.extensions?.KHR_texture_transform;return t?.texCoord??e?.texCoord??0}function p(e){return i.find(t=>t.pathSegments.length===e.length&&t.pathSegments.every((t,r)=>e[r]===t))||null}function u(e){let t=new a.Matrix3().set(1,0,0,0,1,0,e.offset[0],e.offset[1],1),r=new a.Matrix3().set(Math.cos(e.rotation),Math.sin(e.rotation),0,-Math.sin(e.rotation),Math.cos(e.rotation),0,0,0,1),i=new a.Matrix3().set(e.scale[0],0,0,0,e.scale[1],0,0,0,1);return Array.from(t.multiplyRight(r).multiplyRight(i))}function m(e,t){let r=new a.Matrix3(u(e)),i=new a.Matrix3(u(t)),n=new a.Matrix3(r).invert();return Array.from(i.multiplyRight(n))}},54393(e,t,r){var a,i;r.d(t,{n:()=>a}),(i=a||(a={}))[i.POINTS=0]="POINTS",i[i.LINES=1]="LINES",i[i.LINE_LOOP=2]="LINE_LOOP",i[i.LINE_STRIP=3]="LINE_STRIP",i[i.TRIANGLES=4]="TRIANGLES",i[i.TRIANGLE_STRIP=5]="TRIANGLE_STRIP",i[i.TRIANGLE_FAN=6]="TRIANGLE_FAN",i[i.ONE=1]="ONE",i[i.SRC_ALPHA=770]="SRC_ALPHA",i[i.ONE_MINUS_SRC_ALPHA=771]="ONE_MINUS_SRC_ALPHA",i[i.FUNC_ADD=32774]="FUNC_ADD",i[i.LINEAR=9729]="LINEAR",i[i.NEAREST=9728]="NEAREST",i[i.NEAREST_MIPMAP_NEAREST=9984]="NEAREST_MIPMAP_NEAREST",i[i.LINEAR_MIPMAP_NEAREST=9985]="LINEAR_MIPMAP_NEAREST",i[i.NEAREST_MIPMAP_LINEAR=9986]="NEAREST_MIPMAP_LINEAR",i[i.LINEAR_MIPMAP_LINEAR=9987]="LINEAR_MIPMAP_LINEAR",i[i.TEXTURE_MAG_FILTER=10240]="TEXTURE_MAG_FILTER",i[i.TEXTURE_MIN_FILTER=10241]="TEXTURE_MIN_FILTER",i[i.TEXTURE_WRAP_S=10242]="TEXTURE_WRAP_S",i[i.TEXTURE_WRAP_T=10243]="TEXTURE_WRAP_T",i[i.REPEAT=10497]="REPEAT",i[i.CLAMP_TO_EDGE=33071]="CLAMP_TO_EDGE",i[i.MIRRORED_REPEAT=33648]="MIRRORED_REPEAT",i[i.UNPACK_FLIP_Y_WEBGL=37440]="UNPACK_FLIP_Y_WEBGL"},83980(e,t,r){r.d(t,{s:()=>p});let a=`\
#ifdef USE_IBL
@group(2) @binding(auto) var pbr_diffuseEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_diffuseEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_specularEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_specularEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_brdfLUT: texture_2d<f32>;
@group(2) @binding(auto) var pbr_brdfLUTSampler: sampler;
#endif
`,i=`\
#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif
`;var n=r(66925);let o=`\
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
`,s=`\
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
  float dispersion;
  
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

  float bumpFactor;
  bool bumpMapEnabled;
  float diffuseTransmissionFactor;
  bool diffuseTransmissionMapEnabled;
  vec3 diffuseTransmissionColorFactor;
  bool diffuseTransmissionColorMapEnabled;
  vec3 multiscatterColorFactor;
  bool multiscatterColorMapEnabled;
  float scatterAnisotropy;

  int bumpUVSet;
  mat3 bumpUVTransform;
  int diffuseTransmissionUVSet;
  mat3 diffuseTransmissionUVTransform;
  int diffuseTransmissionColorUVSet;
  mat3 diffuseTransmissionColorUVTransform;
  int multiscatterColorUVSet;
  mat3 multiscatterColorUVTransform;
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
#ifdef HAS_BUMPMAP
uniform sampler2D pbr_bumpSampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONMAP
uniform sampler2D pbr_diffuseTransmissionSampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
uniform sampler2D pbr_diffuseTransmissionColorSampler;
#endif
#ifdef HAS_MULTISCATTERCOLORMAP
uniform sampler2D pbr_multiscatterColorSampler;
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
  vec3 l;                       // direction from the surface toward the current light
  vec3 h;                       // half vector between the current light and camera
};

const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

// Widen sub-pixel specular lobes using the screen-space normal footprint.
// This is geometric specular antialiasing: the normal variance is converted
// into an additional squared perceptual roughness before evaluating BRDFs.
float widenSpecularRoughness(float perceptualRoughness, vec3 normal)
{
  vec3 normalDerivativeX = dFdx(normal);
  vec3 normalDerivativeY = dFdy(normal);
  float normalVariance =
    dot(normalDerivativeX, normalDerivativeX) +
    dot(normalDerivativeY, normalDerivativeY);
  float kernelRoughnessSquared = min(2.0 * normalVariance, 1.0);
  return clamp(
    sqrt(perceptualRoughness * perceptualRoughness + kernelRoughnessSquared),
    c_MinRoughness,
    1.0
  );
}

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

#ifdef HAS_BUMPMAP
  vec2 bumpUV = getMaterialUV(pbrMaterial.bumpUVSet, pbrMaterial.bumpUVTransform);
  vec2 bumpTexelSize = 1.0 / vec2(textureSize(pbr_bumpSampler, 0));
  float bumpHeight = texture(pbr_bumpSampler, bumpUV).r;
  vec2 bumpGradient = vec2(
    texture(pbr_bumpSampler, bumpUV + vec2(bumpTexelSize.x, 0.0)).r - bumpHeight,
    texture(pbr_bumpSampler, bumpUV + vec2(0.0, bumpTexelSize.y)).r - bumpHeight
  );
  n = normalize(n - pbrMaterial.bumpFactor *
    (tbn[0] * bumpGradient.x + tbn[1] * bumpGradient.y));
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
#ifdef USE_SCENE_ENVIRONMENT
  float maximumMipLevel = max(pbrScene.environmentMipCount - 1.0, 0.0);
  float rotationSine = sin(pbrScene.environmentRotation);
  float rotationCosine = cos(pbrScene.environmentRotation);
  mat2 environmentRotation = mat2(rotationCosine, rotationSine, -rotationSine, rotationCosine);
  vec3 environmentNormal = vec3(environmentRotation * n.xz, n.y).xzy;
  vec3 environmentReflection = vec3(environmentRotation * reflection.xz, reflection.y).xzy;
#else
  float maximumMipLevel = 9.0;
  vec3 environmentNormal = n;
  vec3 environmentReflection = reflection;
#endif
  float lod = pbrInfo.perceptualRoughness * maximumMipLevel;
  // retrieve a scale and bias to F0. See [1], Figure 3
  vec4 brdfSample = texture(pbr_brdfLUT,
    vec2(pbrInfo.NdotV, 1.0 - pbrInfo.perceptualRoughness));
  vec4 diffuseSample = texture(pbr_diffuseEnvSampler, environmentNormal);

#ifdef USE_TEX_LOD
  vec4 specularSample = textureLod(pbr_specularEnvSampler, environmentReflection, lod);
#else
  vec4 specularSample = texture(pbr_specularEnvSampler, environmentReflection);
#endif

#ifdef USE_SCENE_ENVIRONMENT
  vec3 brdf = brdfSample.rgb;
  vec3 diffuseLight = diffuseSample.rgb;
  vec3 specularLight = specularSample.rgb;
#else
  vec3 brdf = SRGBtoLINEAR(brdfSample).rgb;
  vec3 diffuseLight = SRGBtoLINEAR(diffuseSample).rgb;
  vec3 specularLight = SRGBtoLINEAR(specularSample).rgb;
#endif

  vec3 diffuse = diffuseLight * pbrInfo.diffuseColor;
  vec3 specular = specularLight * (pbrInfo.specularColor * brdf.x + brdf.y);

  // For presentation, this allows us to disable IBL terms
  diffuse *= pbrMaterial.scaleIBLAmbient.x;
  specular *= pbrMaterial.scaleIBLAmbient.y;

#ifdef USE_SCENE_ENVIRONMENT
  return (diffuse + specular) * max(pbrScene.environmentIntensity, 0.0);
#else
  return diffuse + specular;
#endif
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

vec3 encodeLinearSRGB(vec3 linearColor)
{
  vec3 positiveColor = max(linearColor, vec3(0.0));
  return mix(
    positiveColor * 12.92,
    1.055 * pow(positiveColor, vec3(1.0 / 2.4)) - 0.055,
    greaterThan(positiveColor, vec3(0.0031308))
  );
}

vec3 toneMapKhronosPBRNeutral(vec3 color)
{
  const float startCompression = 0.76;
  float darkestChannel = min(color.r, min(color.g, color.b));
  float offset = darkestChannel < 0.08
    ? darkestChannel - 6.25 * darkestChannel * darkestChannel
    : 0.04;
  color -= vec3(offset);

  float peak = maxComponent(color);
  if (peak < startCompression) {
    return color;
  }

  float compressionRange = 1.0 - startCompression;
  float compressedPeak = 1.0 - compressionRange * compressionRange /
    (peak + compressionRange - startCompression);
  color *= compressedPeak / max(peak, 0.0001);
  float desaturation = 1.0 - 1.0 / (0.15 * (peak - compressedPeak) + 1.0);
  return mix(color, vec3(compressedPeak), desaturation);
}

vec3 applySceneColorManagement(vec3 sceneColor)
{
#ifdef USE_SCENE_COLOR_MANAGEMENT
  vec3 color = max(sceneColor, vec3(0.0)) * max(pbrScene.exposure, 0.0);
  if (pbrScene.toneMapMode == 1) {
    color /= vec3(1.0) + color;
  } else if (pbrScene.toneMapMode == 2) {
    color = toneMapKhronosPBRNeutral(color);
  } else if (pbrScene.toneMapMode == 3) {
    color = clamp(
      (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14),
      vec3(0.0),
      vec3(1.0)
    );
  }
  return pbrScene.outputEncoding == 0 ? color : encodeLinearSRGB(color);
#else
  return pow(max(sceneColor, vec3(0.0)), vec3(1.0 / 2.2));
#endif
}

float dielectricSchlick(float reflectance, float cosine)
{
  return reflectance + (1.0 - reflectance) * pow(clamp(1.0 - cosine, 0.0, 1.0), 5.0);
}

vec3 evaluateIridescenceSensitivity(float opticalPathDifference, vec3 phaseShift)
{
  float phase = 2.0 * M_PI * opticalPathDifference * 1.0e-9;
  vec3 sensitivity = vec3(5.4856e-13, 4.4201e-13, 5.2481e-13);
  vec3 position = vec3(1.6810e6, 1.7953e6, 2.2084e6);
  vec3 variance = vec3(4.3278e9, 9.3046e9, 6.6121e9);
  vec3 xyz = sensitivity * sqrt(2.0 * M_PI * variance) *
    cos(position * phase + phaseShift) * exp(-phase * phase * variance);
  xyz.x += 9.7470e-14 * sqrt(2.0 * M_PI * 4.5282e9) *
    cos(2.2399e6 * phase + phaseShift.x) * exp(-4.5282e9 * phase * phase);
  xyz /= 1.0685e-7;
  return mat3(
    3.2404542, -0.9692660, 0.0556434,
    -1.5371385, 1.8760108, -0.2040259,
    -0.4985314, 0.0415560, 1.0572252
  ) * xyz;
}

vec3 getIridescenceTint(float iridescence, float thickness, float NdotV, vec3 baseReflectance)
{
  if (iridescence <= 0.0 || thickness <= 0.0) {
    return baseReflectance;
  }

  float filmIor = max(pbrMaterial.iridescenceIor, 1.0);
  float sineSquared = (1.0 - NdotV * NdotV) / (filmIor * filmIor);
  float cosineSquared = 1.0 - sineSquared;
  if (cosineSquared <= 0.0) {
    return mix(baseReflectance, vec3(1.0), iridescence);
  }
  float filmCosine = sqrt(cosineSquared);
  float firstInterfaceReflectance = dielectricSchlick(getDielectricF0(filmIor), NdotV);
  float transmittedEnergy = 1.0 - firstInterfaceReflectance;

  vec3 baseIor = (vec3(1.0) + sqrt(clamp(baseReflectance, vec3(0.0), vec3(0.9999)))) /
    (vec3(1.0) - sqrt(clamp(baseReflectance, vec3(0.0), vec3(0.9999))));
  vec3 secondInterfaceF0 = (baseIor - vec3(filmIor)) / (baseIor + vec3(filmIor));
  secondInterfaceF0 *= secondInterfaceF0;
  vec3 secondInterfaceReflectance = secondInterfaceF0 +
    (vec3(1.0) - secondInterfaceF0) * pow(1.0 - filmCosine, 5.0);
  vec3 phaseShift = vec3(M_PI);
  phaseShift += mix(vec3(0.0), vec3(M_PI), lessThan(baseIor, vec3(filmIor)));
  float opticalPathDifference = 2.0 * filmIor * thickness * filmCosine;
  vec3 combinedReflectance = clamp(
    firstInterfaceReflectance * secondInterfaceReflectance,
    vec3(0.00001),
    vec3(0.9999)
  );
  vec3 recurringAmplitude = sqrt(combinedReflectance);
  vec3 interfaceResponse = transmittedEnergy * transmittedEnergy * secondInterfaceReflectance /
    (vec3(1.0) - combinedReflectance);
  vec3 reflectedSpectrum = vec3(firstInterfaceReflectance) + interfaceResponse;
  vec3 harmonicAmplitude = interfaceResponse - vec3(transmittedEnergy);
  for (int harmonic = 1; harmonic <= 2; harmonic++) {
    harmonicAmplitude *= recurringAmplitude;
    reflectedSpectrum += harmonicAmplitude * 2.0 * evaluateIridescenceSensitivity(
      float(harmonic) * opticalPathDifference,
      float(harmonic) * phaseShift
    );
  }
  return mix(baseReflectance, clamp(reflectedSpectrum, vec3(0.0), vec3(1.0)), iridescence);
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

// KHR_materials_volume_scatter is an active draft. This evaluates a local,
// thickness-aware single-scattering approximation rather than random walk.
vec3 getDiffuseTransmissionAttenuation(
  PBRInfo pbrInfo,
  vec3 multiscatterColor,
  float thickness
)
{
  vec3 volumeAttenuation = getVolumeAttenuation(thickness);
  float scatteringStrength = maxComponent(multiscatterColor);
  if (thickness <= 0.0 || scatteringStrength <= 0.0001) {
    return volumeAttenuation;
  }

  float anisotropy = clamp(pbrMaterial.scatterAnisotropy, -0.95, 0.95);
  float scatteringCosine = clamp(dot(-pbrInfo.v, pbrInfo.l), -1.0, 1.0);
  float phaseDenominator = max(
    1.0 + anisotropy * anisotropy - 2.0 * anisotropy * scatteringCosine,
    0.0001
  );
  float phaseWeight = clamp(
    (1.0 - anisotropy * anisotropy) / pow(phaseDenominator, 1.5),
    0.0,
    4.0
  );
  float scatteringDepth = thickness / max(pbrMaterial.attenuationDistance, 0.0001);
  float scatteringProbability = 1.0 - exp(-scatteringDepth);
  vec3 scatteringColor = clamp(multiscatterColor, vec3(0.0), vec3(1.0));
  return mix(
    volumeAttenuation,
    volumeAttenuation * mix(vec3(1.0), scatteringColor * phaseWeight, scatteringColor),
    scatteringProbability
  );
}

vec3 calculateDiffuseTransmissionLight(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 diffuseTransmissionColor,
  float diffuseTransmission,
  vec3 multiscatterColor,
  float thickness
)
{
  float oppositeHemisphere = max(dot(-pbrInfo.n, pbrInfo.l), 0.0);
  if (oppositeHemisphere <= 0.0 || diffuseTransmission <= 0.0) {
    return vec3(0.0);
  }

  vec3 nonReflectedEnergy = vec3(1.0) - clamp(pbrInfo.reflectance0, vec3(0.0), vec3(1.0));
  vec3 attenuatedColor = getDiffuseTransmissionAttenuation(
    pbrInfo,
    multiscatterColor,
    thickness
  );
  return lightColor * diffuseTransmissionColor * nonReflectedEnergy *
    attenuatedColor * (diffuseTransmission * oppositeHemisphere / M_PI);
}

#ifdef USE_IBL
vec3 calculateDiffuseTransmissionIBL(
  PBRInfo pbrInfo,
  vec3 diffuseTransmissionColor,
  float diffuseTransmission,
  vec3 multiscatterColor,
  float thickness
)
{
  if (diffuseTransmission <= 0.0) {
    return vec3(0.0);
  }

#ifdef USE_SCENE_ENVIRONMENT
  float rotationSine = sin(pbrScene.environmentRotation);
  float rotationCosine = cos(pbrScene.environmentRotation);
  mat2 environmentRotation = mat2(rotationCosine, rotationSine, -rotationSine, rotationCosine);
  vec3 oppositeNormal = vec3(environmentRotation * -pbrInfo.n.xz, -pbrInfo.n.y).xzy;
  vec3 environmentColor = texture(pbr_diffuseEnvSampler, oppositeNormal).rgb *
    max(pbrScene.environmentIntensity, 0.0);
#else
  vec3 environmentColor = SRGBtoLINEAR(texture(pbr_diffuseEnvSampler, -pbrInfo.n)).rgb;
#endif
  vec3 nonReflectedEnergy = vec3(1.0) - clamp(pbrInfo.reflectance0, vec3(0.0), vec3(1.0));
  return environmentColor * diffuseTransmissionColor * nonReflectedEnergy *
    getDiffuseTransmissionAttenuation(pbrInfo, multiscatterColor, thickness) *
    diffuseTransmission * pbrMaterial.scaleIBLAmbient.x;
}
#endif

#ifdef USE_TRANSMISSION_FRAMEBUFFER
vec3 sampleTransmittedSceneColor(
  vec3 position,
  vec3 normal,
  vec3 viewDirection,
  float thickness,
  float perceptualRoughness,
  float indexOfRefraction
)
{
  vec3 refractionDirection = refract(
    -viewDirection,
    normal,
    1.0 / max(indexOfRefraction, 1.0)
  );
  vec3 refractedPosition = position + refractionDirection * thickness;
  vec4 clipPosition = pbrScene.projectionMatrix *
    pbrScene.viewMatrix * vec4(refractedPosition, 1.0);
  vec2 textureCoordinate = clipPosition.xy / max(clipPosition.w, 0.0001) * 0.5 + 0.5;
  textureCoordinate = clamp(textureCoordinate, vec2(0.001), vec2(0.999));

  vec2 blurRadius = perceptualRoughness * perceptualRoughness * 8.0 /
    max(pbrScene.framebufferSize, vec2(1.0));
  vec3 sceneColor = texture(pbr_transmissionFramebufferSampler, textureCoordinate).rgb * 0.4;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate + vec2(blurRadius.x, 0.0)
  ).rgb * 0.15;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate - vec2(blurRadius.x, 0.0)
  ).rgb * 0.15;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate + vec2(0.0, blurRadius.y)
  ).rgb * 0.15;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate - vec2(0.0, blurRadius.y)
  ).rgb * 0.15;
  return max(sceneColor, vec3(0.0));
}

vec3 getTransmittedSceneColor(
  vec3 position,
  vec3 normal,
  vec3 viewDirection,
  float thickness,
  float perceptualRoughness
)
{
  if (pbrMaterial.dispersion <= 0.0) {
    return sampleTransmittedSceneColor(
      position,
      normal,
      viewDirection,
      thickness,
      perceptualRoughness,
      pbrMaterial.ior
    );
  }

  float halfSpread = (max(pbrMaterial.ior, 1.0) - 1.0) * 0.025 * pbrMaterial.dispersion;
  vec3 indicesOfRefraction = max(
    vec3(pbrMaterial.ior - halfSpread, pbrMaterial.ior, pbrMaterial.ior + halfSpread),
    vec3(1.0)
  );
  return vec3(
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.r
    ).r,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.g
    ).g,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.b
    ).b
  );
}
#endif

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
    basePBRInfo.v,
    basePBRInfo.l,
    basePBRInfo.h
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

  float alpha = max(sheenRoughness * sheenRoughness, 0.0001);
  float inverseAlpha = 1.0 / alpha;
  float sineSquared = max(1.0 - pbrInfo.NdotH * pbrInfo.NdotH, 0.0);
  float distribution = (2.0 + inverseAlpha) * pow(sineSquared, inverseAlpha * 0.5) /
    (2.0 * M_PI);
  float visibility = 1.0 / max(
    4.0 * (pbrInfo.NdotL + pbrInfo.NdotV - pbrInfo.NdotL * pbrInfo.NdotV),
    0.0001
  );
  return pbrInfo.NdotL * lightColor * sheenColor * distribution * visibility *
    (1.0 - pbrInfo.metalness);
}

vec3 calculateAnisotropicLightColor(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 anisotropyTangent,
  float anisotropyStrength
) {
  if (anisotropyStrength <= 0.0) {
    return calculateFinalColor(pbrInfo, lightColor);
  }

  vec3 anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  float tangentRoughness = mix(
    pbrInfo.alphaRoughness,
    1.0,
    anisotropyStrength * anisotropyStrength
  );
  float bitangentRoughness = clamp(pbrInfo.alphaRoughness, 0.001, 1.0);
  float roughnessProduct = tangentRoughness * bitangentRoughness;
  vec3 distributionVector = vec3(
    bitangentRoughness * dot(anisotropyTangent, pbrInfo.h),
    tangentRoughness * dot(anisotropyBitangent, pbrInfo.h),
    roughnessProduct * pbrInfo.NdotH
  );
  float distributionFactor = roughnessProduct /
    max(dot(distributionVector, distributionVector), 0.000001);
  float distribution = roughnessProduct * distributionFactor * distributionFactor / M_PI;
  float viewMask = pbrInfo.NdotL * length(vec3(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.v),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.v),
    pbrInfo.NdotV
  ));
  float lightMask = pbrInfo.NdotV * length(vec3(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.l),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.l),
    pbrInfo.NdotL
  ));
  float visibility = clamp(0.5 / max(viewMask + lightMask, 0.000001), 0.0, 1.0);
  vec3 fresnel = specularReflection(pbrInfo);
  vec3 diffuseContribution = (vec3(1.0) - fresnel) * diffuse(pbrInfo);
  return pbrInfo.NdotL * lightColor *
    (diffuseContribution + fresnel * distribution * visibility);
}

vec3 getAnisotropicReflection(PBRInfo pbrInfo, vec3 anisotropyTangent, float anisotropyStrength)
{
  if (anisotropyStrength <= 0.0) {
    return -normalize(reflect(pbrInfo.v, pbrInfo.n));
  }
  vec3 anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  vec3 anisotropicNormal = normalize(cross(anisotropyBitangent, pbrInfo.v));
  anisotropicNormal = normalize(cross(anisotropicNormal, anisotropyBitangent));
  float bend = anisotropyStrength * (1.0 - pbrInfo.perceptualRoughness);
  return -normalize(reflect(pbrInfo.v, normalize(mix(pbrInfo.n, anisotropicNormal, bend))));
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
  vec3 color = calculateAnisotropicLightColor(
    pbrInfo,
    lightColor,
    anisotropyTangent,
    anisotropyStrength
  );
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
  pbrInfo.l = pbrInfo.n;
  pbrInfo.h = pbrInfo.n;
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
  pbrInfo.l = l;
  pbrInfo.h = h;
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

vec4 pbr_filterColor(vec4 vertexColor)
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
  vec2 diffuseTransmissionUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionUVSet,
    pbrMaterial.diffuseTransmissionUVTransform
  );
  vec2 diffuseTransmissionColorUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionColorUVSet,
    pbrMaterial.diffuseTransmissionColorUVTransform
  );
  vec2 multiscatterColorUV = getMaterialUV(
    pbrMaterial.multiscatterColorUVSet,
    pbrMaterial.multiscatterColorUVTransform
  );

  // The albedo may be defined from a base texture or a flat color
#ifdef HAS_BASECOLORMAP
  vec4 baseColor =
    SRGBtoLINEAR(texture(pbr_baseColorSampler, baseColorUV)) *
    pbrMaterial.baseColorFactor * vertexColor;
#else
  vec4 baseColor = pbrMaterial.baseColorFactor * vertexColor;
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
    perceptualRoughness = widenSpecularRoughness(perceptualRoughness, n);
    vec3 v = normalize(pbrProjection.camera - pbr_vPosition);  // Vector from surface point to camera
    float NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
#ifdef USE_MATERIAL_EXTENSIONS
    bool useExtendedPBR =
      pbrMaterial.specularColorMapEnabled ||
      pbrMaterial.specularIntensityMapEnabled ||
      abs(pbrMaterial.specularIntensityFactor - 1.0) > 0.0001 ||
      maxComponent(abs(pbrMaterial.specularColorFactor - vec3(1.0))) > 0.0001 ||
      abs(pbrMaterial.ior - 1.5) > 0.0001 ||
      pbrMaterial.dispersion > 0.0001 ||
      pbrMaterial.transmissionMapEnabled ||
      pbrMaterial.transmissionFactor > 0.0001 ||
      pbrMaterial.diffuseTransmissionMapEnabled ||
      pbrMaterial.diffuseTransmissionColorMapEnabled ||
      pbrMaterial.diffuseTransmissionFactor > 0.0001 ||
      pbrMaterial.multiscatterColorMapEnabled ||
      maxComponent(pbrMaterial.multiscatterColorFactor) > 0.0001 ||
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
        v,
        n,
        n
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

      return vec4(applySceneColorManagement(color), baseColor.a);
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

    float diffuseTransmission = clamp(pbrMaterial.diffuseTransmissionFactor, 0.0, 1.0);
#ifdef HAS_DIFFUSETRANSMISSIONMAP
    if (pbrMaterial.diffuseTransmissionMapEnabled) {
      diffuseTransmission *= texture(pbr_diffuseTransmissionSampler, diffuseTransmissionUV).a;
    }
#endif
    diffuseTransmission *= (1.0 - metallic) * (1.0 - transmission);
    vec3 diffuseTransmissionColor = pbrMaterial.diffuseTransmissionColorFactor;
#ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
    if (pbrMaterial.diffuseTransmissionColorMapEnabled) {
      diffuseTransmissionColor *= SRGBtoLINEAR(
        texture(pbr_diffuseTransmissionColorSampler, diffuseTransmissionColorUV)
      ).rgb;
    }
#endif
    vec3 multiscatterColor = pbrMaterial.multiscatterColorFactor;
#ifdef HAS_MULTISCATTERCOLORMAP
    if (pbrMaterial.multiscatterColorMapEnabled) {
      multiscatterColor *= SRGBtoLINEAR(
        texture(pbr_multiscatterColorSampler, multiscatterColorUV)
      ).rgb;
    }
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
    clearcoatRoughness = widenSpecularRoughness(clearcoatRoughness, clearcoatNormal);

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
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    float dielectricF0 = getDielectricF0(pbrMaterial.ior);
    vec3 dielectricSpecularF0 = min(
      vec3(dielectricF0) * specularFactor * specularIntensity,
      vec3(1.0)
    );
    dielectricSpecularF0 = getIridescenceTint(
      iridescence,
      iridescenceThickness,
      NdotV,
      dielectricSpecularF0
    );
    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - dielectricSpecularF0);
    diffuseColor *= (1.0 - metallic) * (1.0 - transmission) * (1.0 - diffuseTransmission);
    vec3 specularColor = mix(dielectricSpecularF0, baseColor.rgb, metallic);

    float clearcoatViewFresnel = dielectricSchlick(
      0.04,
      clamp(abs(dot(clearcoatNormal, v)), 0.0, 1.0)
    );
    float sheenDirectionalAlbedo = maxComponent(sheenColor) *
      (0.157 + 0.343 * (1.0 - NdotV)) * (1.0 - sheenRoughness * 0.5);
    float baseLayerEnergy = (1.0 - clearcoatFactor * clearcoatViewFresnel) *
      (1.0 - clamp(sheenDirectionalAlbedo, 0.0, 1.0));
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
      v,
      n,
      n
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
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getDirectionalLight(i).color,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
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
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getPointLight(i).color / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
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
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getSpotLight(i).color / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }
#endif

    // Calculate lighting contribution from image based lighting source (IBL)
#ifdef USE_IBL
    if (pbrMaterial.IBLenabled) {
      color += getIBLContribution(
        pbrInfo,
        n,
        getAnisotropicReflection(pbrInfo, anisotropyTangent, anisotropyStrength)
      );
      color += calculateClearcoatIBLContribution(
        pbrInfo,
        clearcoatNormal,
        -normalize(reflect(v, clearcoatNormal)),
        clearcoatFactor,
        clearcoatRoughness
      );
      color += calculateDiffuseTransmissionIBL(
        pbrInfo,
        diffuseTransmissionColor,
        diffuseTransmission,
        multiscatterColor,
        thickness
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
#ifdef USE_TRANSMISSION_FRAMEBUFFER
      float dielectricFresnel = getDielectricF0(pbrMaterial.ior);
      float transmissionFresnel = dielectricFresnel +
        (1.0 - dielectricFresnel) * pow(1.0 - NdotV, 5.0);
      vec3 transmittedColor = getTransmittedSceneColor(
        pbr_vPosition,
        n,
        v,
        thickness,
        perceptualRoughness
      );
      color += transmittedColor * getVolumeAttenuation(thickness) *
        transmission * (1.0 - transmissionFresnel);
#else
      color = mix(color, color * getVolumeAttenuation(thickness), transmission);
#endif
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

#ifdef USE_TRANSMISSION_FRAMEBUFFER
  float alpha = clamp(baseColor.a, 0.0, 1.0);
#else
  float alpha = clamp(baseColor.a * (1.0 - transmission), 0.0, 1.0);
#endif
  return vec4(applySceneColorManagement(color), alpha);
}
`,l=`\
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
  dispersion: f32,
  
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

  bumpFactor: f32,
  bumpMapEnabled: i32,
  diffuseTransmissionFactor: f32,
  diffuseTransmissionMapEnabled: i32,
  diffuseTransmissionColorFactor: vec3f,
  diffuseTransmissionColorMapEnabled: i32,
  multiscatterColorFactor: vec3f,
  multiscatterColorMapEnabled: i32,
  scatterAnisotropy: f32,

  bumpUVSet: i32,
  bumpUVTransform: mat3x3f,
  diffuseTransmissionUVSet: i32,
  diffuseTransmissionUVTransform: mat3x3f,
  diffuseTransmissionColorUVSet: i32,
  diffuseTransmissionColorUVTransform: mat3x3f,
  multiscatterColorUVSet: i32,
  multiscatterColorUVTransform: mat3x3f,
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
#ifdef HAS_BUMPMAP
@group(3) @binding(auto) var pbr_bumpSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_bumpSamplerSampler: sampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONMAP
@group(3) @binding(auto) var pbr_diffuseTransmissionSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_diffuseTransmissionSamplerSampler: sampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
@group(3) @binding(auto) var pbr_diffuseTransmissionColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_diffuseTransmissionColorSamplerSampler: sampler;
#endif
#ifdef HAS_MULTISCATTERCOLORMAP
@group(3) @binding(auto) var pbr_multiscatterColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_multiscatterColorSamplerSampler: sampler;
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
  l: vec3f,                       // direction from the surface toward the current light
  h: vec3f                        // half vector between the current light and camera
};

const M_PI = 3.141592653589793;
const c_MinRoughness = 0.04;

// Widen sub-pixel specular lobes using the screen-space normal footprint.
// This is geometric specular antialiasing: the normal variance is converted
// into an additional squared perceptual roughness before evaluating BRDFs.
fn widenSpecularRoughness(perceptualRoughness: f32, normal: vec3f) -> f32 {
  let normalDerivativeX = dpdx(normal);
  let normalDerivativeY = dpdy(normal);
  let normalVariance =
    dot(normalDerivativeX, normalDerivativeX) +
    dot(normalDerivativeY, normalDerivativeY);
  let kernelRoughnessSquared = min(2.0 * normalVariance, 1.0);
  return clamp(
    sqrt(perceptualRoughness * perceptualRoughness + kernelRoughnessSquared),
    c_MinRoughness,
    1.0
  );
}

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

  var ng: vec3f = cross(pos_dy, pos_dx);
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

#ifdef HAS_BUMPMAP
  let bumpUV = getMaterialUV(pbrMaterial.bumpUVSet, pbrMaterial.bumpUVTransform);
  let bumpTexelSize = 1.0 / vec2f(textureDimensions(pbr_bumpSampler, 0));
  let bumpHeight = textureSample(pbr_bumpSampler, pbr_bumpSamplerSampler, bumpUV).r;
  let bumpGradient = vec2f(
    textureSample(
      pbr_bumpSampler,
      pbr_bumpSamplerSampler,
      bumpUV + vec2f(bumpTexelSize.x, 0.0)
    ).r - bumpHeight,
    textureSample(
      pbr_bumpSampler,
      pbr_bumpSamplerSampler,
      bumpUV + vec2f(0.0, bumpTexelSize.y)
    ).r - bumpHeight
  );
  n = normalize(n - pbrMaterial.bumpFactor *
    (tbn[0] * bumpGradient.x + tbn[1] * bumpGradient.y));
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
#ifdef USE_SCENE_ENVIRONMENT
  let maximumMipLevel = max(pbrScene.environmentMipCount - 1.0, 0.0);
  let rotationSine = sin(pbrScene.environmentRotation);
  let rotationCosine = cos(pbrScene.environmentRotation);
  let environmentRotation = mat2x2f(
    vec2f(rotationCosine, rotationSine),
    vec2f(-rotationSine, rotationCosine)
  );
  let rotatedNormal = environmentRotation * n.xz;
  let rotatedReflection = environmentRotation * reflection.xz;
  let environmentNormal = vec3f(rotatedNormal.x, n.y, rotatedNormal.y);
  let environmentReflection = vec3f(rotatedReflection.x, reflection.y, rotatedReflection.y);
#else
  let maximumMipLevel = 9.0;
  let environmentNormal = n;
  let environmentReflection = reflection;
#endif
  let lod = pbrInfo.perceptualRoughness * maximumMipLevel;
  // retrieve a scale and bias to F0. See [1], Figure 3
  let brdfSample = textureSampleLevel(
    pbr_brdfLUT,
    pbr_brdfLUTSampler,
    vec2f(pbrInfo.NdotV, 1.0 - pbrInfo.perceptualRoughness),
    0.0
  );
  let diffuseSample = textureSampleLevel(
    pbr_diffuseEnvSampler,
    pbr_diffuseEnvSamplerSampler,
    environmentNormal,
    0.0
  );
  var specularSample = textureSampleLevel(
    pbr_specularEnvSampler,
    pbr_specularEnvSamplerSampler,
    environmentReflection,
    0.0
  );
#ifdef USE_TEX_LOD
  specularSample = textureSampleLevel(
    pbr_specularEnvSampler,
    pbr_specularEnvSamplerSampler,
    environmentReflection,
    lod
  );
#endif

#ifdef USE_SCENE_ENVIRONMENT
  let brdf = brdfSample.rgb;
  let diffuseLight = diffuseSample.rgb;
  let specularLight = specularSample.rgb;
#else
  let brdf = SRGBtoLINEAR(brdfSample).rgb;
  let diffuseLight = SRGBtoLINEAR(diffuseSample).rgb;
  let specularLight = SRGBtoLINEAR(specularSample).rgb;
#endif

  let diffuse = diffuseLight * pbrInfo.diffuseColor * pbrMaterial.scaleIBLAmbient.x;
  let specular =
    specularLight * (pbrInfo.specularColor * brdf.x + brdf.y) * pbrMaterial.scaleIBLAmbient.y;

#ifdef USE_SCENE_ENVIRONMENT
  return (diffuse + specular) * max(pbrScene.environmentIntensity, 0.0);
#else
  return diffuse + specular;
#endif
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

fn encodeLinearSRGB(linearColor: vec3f) -> vec3f {
  let positiveColor = max(linearColor, vec3f(0.0));
  return select(
    positiveColor * 12.92,
    1.055 * pow(positiveColor, vec3f(1.0 / 2.4)) - 0.055,
    positiveColor > vec3f(0.0031308)
  );
}

fn toneMapKhronosPBRNeutral(inputColor: vec3f) -> vec3f {
  let startCompression = 0.76;
  let darkestChannel = min(inputColor.r, min(inputColor.g, inputColor.b));
  let offset = select(
    0.04,
    darkestChannel - 6.25 * darkestChannel * darkestChannel,
    darkestChannel < 0.08
  );
  var color = inputColor - vec3f(offset);
  let peak = maxComponent(color);
  if (peak < startCompression) {
    return color;
  }

  let compressionRange = 1.0 - startCompression;
  let compressedPeak = 1.0 - compressionRange * compressionRange /
    (peak + compressionRange - startCompression);
  color *= compressedPeak / max(peak, 0.0001);
  let desaturation = 1.0 - 1.0 / (0.15 * (peak - compressedPeak) + 1.0);
  return mix(color, vec3f(compressedPeak), desaturation);
}

fn applySceneColorManagement(sceneColor: vec3f) -> vec3f {
#ifdef USE_SCENE_COLOR_MANAGEMENT
  var color = max(sceneColor, vec3f(0.0)) * max(pbrScene.exposure, 0.0);
  if (pbrScene.toneMapMode == 1) {
    color /= vec3f(1.0) + color;
  } else if (pbrScene.toneMapMode == 2) {
    color = toneMapKhronosPBRNeutral(color);
  } else if (pbrScene.toneMapMode == 3) {
    color = clamp(
      (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14),
      vec3f(0.0),
      vec3f(1.0)
    );
  }
  if (pbrScene.outputEncoding == 0) {
    return color;
  }
  return encodeLinearSRGB(color);
#else
  return pow(max(sceneColor, vec3f(0.0)), vec3f(1.0 / 2.2));
#endif
}

fn dielectricSchlick(reflectance: f32, cosine: f32) -> f32 {
  return reflectance + (1.0 - reflectance) * pow(clamp(1.0 - cosine, 0.0, 1.0), 5.0);
}

fn evaluateIridescenceSensitivity(opticalPathDifference: f32, phaseShift: vec3f) -> vec3f {
  let phase = 2.0 * M_PI * opticalPathDifference * 1.0e-9;
  let sensitivity = vec3f(5.4856e-13, 4.4201e-13, 5.2481e-13);
  let position = vec3f(1.6810e6, 1.7953e6, 2.2084e6);
  let variance = vec3f(4.3278e9, 9.3046e9, 6.6121e9);
  var xyz = sensitivity * sqrt(2.0 * M_PI * variance) *
    cos(position * phase + phaseShift) * exp(-phase * phase * variance);
  xyz.x += 9.7470e-14 * sqrt(2.0 * M_PI * 4.5282e9) *
    cos(2.2399e6 * phase + phaseShift.x) * exp(-4.5282e9 * phase * phase);
  xyz /= 1.0685e-7;
  return mat3x3f(
    vec3f(3.2404542, -0.9692660, 0.0556434),
    vec3f(-1.5371385, 1.8760108, -0.2040259),
    vec3f(-0.4985314, 0.0415560, 1.0572252)
  ) * xyz;
}

fn getIridescenceTint(
  iridescence: f32,
  thickness: f32,
  NdotV: f32,
  baseReflectance: vec3f
) -> vec3f {
  if (iridescence <= 0.0 || thickness <= 0.0) {
    return baseReflectance;
  }

  let filmIor = max(pbrMaterial.iridescenceIor, 1.0);
  let sineSquared = (1.0 - NdotV * NdotV) / (filmIor * filmIor);
  let cosineSquared = 1.0 - sineSquared;
  if (cosineSquared <= 0.0) {
    return mix(baseReflectance, vec3f(1.0), iridescence);
  }
  let filmCosine = sqrt(cosineSquared);
  let firstInterfaceReflectance = dielectricSchlick(getDielectricF0(filmIor), NdotV);
  let transmittedEnergy = 1.0 - firstInterfaceReflectance;
  let squareRootReflectance = sqrt(clamp(baseReflectance, vec3f(0.0), vec3f(0.9999)));
  let baseIor = (vec3f(1.0) + squareRootReflectance) /
    (vec3f(1.0) - squareRootReflectance);
  var secondInterfaceF0 = (baseIor - vec3f(filmIor)) / (baseIor + vec3f(filmIor));
  secondInterfaceF0 *= secondInterfaceF0;
  let secondInterfaceReflectance = secondInterfaceF0 +
    (vec3f(1.0) - secondInterfaceF0) * pow(1.0 - filmCosine, 5.0);
  let phaseShift = vec3f(M_PI) + select(
    vec3f(0.0),
    vec3f(M_PI),
    baseIor < vec3f(filmIor)
  );
  let opticalPathDifference = 2.0 * filmIor * thickness * filmCosine;
  let combinedReflectance = clamp(
    firstInterfaceReflectance * secondInterfaceReflectance,
    vec3f(0.00001),
    vec3f(0.9999)
  );
  let recurringAmplitude = sqrt(combinedReflectance);
  let interfaceResponse = transmittedEnergy * transmittedEnergy * secondInterfaceReflectance /
    (vec3f(1.0) - combinedReflectance);
  var reflectedSpectrum = vec3f(firstInterfaceReflectance) + interfaceResponse;
  var harmonicAmplitude = interfaceResponse - vec3f(transmittedEnergy);
  for (var harmonic = 1; harmonic <= 2; harmonic++) {
    harmonicAmplitude *= recurringAmplitude;
    reflectedSpectrum += harmonicAmplitude * 2.0 * evaluateIridescenceSensitivity(
      f32(harmonic) * opticalPathDifference,
      f32(harmonic) * phaseShift
    );
  }
  return mix(baseReflectance, clamp(reflectedSpectrum, vec3f(0.0), vec3f(1.0)), iridescence);
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

// KHR_materials_volume_scatter is an active draft. This evaluates a local,
// thickness-aware single-scattering approximation rather than random walk.
fn getDiffuseTransmissionAttenuation(
  pbrInfo: PBRInfo,
  multiscatterColor: vec3f,
  thickness: f32
) -> vec3f {
  let volumeAttenuation = getVolumeAttenuation(thickness);
  let scatteringStrength = maxComponent(multiscatterColor);
  if (thickness <= 0.0 || scatteringStrength <= 0.0001) {
    return volumeAttenuation;
  }

  let anisotropy = clamp(pbrMaterial.scatterAnisotropy, -0.95, 0.95);
  let scatteringCosine = clamp(dot(-pbrInfo.v, pbrInfo.l), -1.0, 1.0);
  let phaseDenominator = max(
    1.0 + anisotropy * anisotropy - 2.0 * anisotropy * scatteringCosine,
    0.0001
  );
  let phaseWeight = clamp(
    (1.0 - anisotropy * anisotropy) / pow(phaseDenominator, 1.5),
    0.0,
    4.0
  );
  let scatteringDepth = thickness / max(pbrMaterial.attenuationDistance, 0.0001);
  let scatteringProbability = 1.0 - exp(-scatteringDepth);
  let scatteringColor = clamp(multiscatterColor, vec3f(0.0), vec3f(1.0));
  return mix(
    volumeAttenuation,
    volumeAttenuation * mix(vec3f(1.0), scatteringColor * phaseWeight, scatteringColor),
    scatteringProbability
  );
}

fn calculateDiffuseTransmissionLight(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  diffuseTransmissionColor: vec3f,
  diffuseTransmission: f32,
  multiscatterColor: vec3f,
  thickness: f32
) -> vec3f {
  let oppositeHemisphere = max(dot(-pbrInfo.n, pbrInfo.l), 0.0);
  if (oppositeHemisphere <= 0.0 || diffuseTransmission <= 0.0) {
    return vec3f(0.0);
  }

  let nonReflectedEnergy = vec3f(1.0) - clamp(pbrInfo.reflectance0, vec3f(0.0), vec3f(1.0));
  let attenuatedColor = getDiffuseTransmissionAttenuation(
    pbrInfo,
    multiscatterColor,
    thickness
  );
  return lightColor * diffuseTransmissionColor * nonReflectedEnergy *
    attenuatedColor * (diffuseTransmission * oppositeHemisphere / M_PI);
}

#ifdef USE_IBL
fn calculateDiffuseTransmissionIBL(
  pbrInfo: PBRInfo,
  diffuseTransmissionColor: vec3f,
  diffuseTransmission: f32,
  multiscatterColor: vec3f,
  thickness: f32
) -> vec3f {
  if (diffuseTransmission <= 0.0) {
    return vec3f(0.0);
  }

#ifdef USE_SCENE_ENVIRONMENT
  let rotationSine = sin(pbrScene.environmentRotation);
  let rotationCosine = cos(pbrScene.environmentRotation);
  let environmentRotation = mat2x2f(
    vec2f(rotationCosine, rotationSine),
    vec2f(-rotationSine, rotationCosine)
  );
  let rotatedNormal = environmentRotation * -pbrInfo.n.xz;
  let oppositeNormal = vec3f(rotatedNormal.x, -pbrInfo.n.y, rotatedNormal.y);
  let environmentColor = textureSampleLevel(
    pbr_diffuseEnvSampler,
    pbr_diffuseEnvSamplerSampler,
    oppositeNormal,
    0.0
  ).rgb * max(pbrScene.environmentIntensity, 0.0);
#else
  let environmentColor = SRGBtoLINEAR(
    textureSampleLevel(pbr_diffuseEnvSampler, pbr_diffuseEnvSamplerSampler, -pbrInfo.n, 0.0)
  ).rgb;
#endif
  let nonReflectedEnergy = vec3f(1.0) - clamp(pbrInfo.reflectance0, vec3f(0.0), vec3f(1.0));
  return environmentColor * diffuseTransmissionColor * nonReflectedEnergy *
    getDiffuseTransmissionAttenuation(pbrInfo, multiscatterColor, thickness) *
    diffuseTransmission * pbrMaterial.scaleIBLAmbient.x;
}
#endif

#ifdef USE_TRANSMISSION_FRAMEBUFFER
fn sampleTransmittedSceneColor(
  position: vec3f,
  normal: vec3f,
  viewDirection: vec3f,
  thickness: f32,
  perceptualRoughness: f32,
  indexOfRefraction: f32
) -> vec3f {
  let refractionDirection = refract(
    -viewDirection,
    normal,
    1.0 / max(indexOfRefraction, 1.0)
  );
  let refractedPosition = position + refractionDirection * thickness;
  let clipPosition = pbrScene.projectionMatrix *
    pbrScene.viewMatrix * vec4f(refractedPosition, 1.0);
  var textureCoordinate = clipPosition.xy / max(clipPosition.w, 0.0001) * 0.5 + 0.5;
  textureCoordinate.y = 1.0 - textureCoordinate.y;
  textureCoordinate = clamp(textureCoordinate, vec2f(0.001), vec2f(0.999));

  let blurRadius = perceptualRoughness * perceptualRoughness * 8.0 /
    max(pbrScene.framebufferSize, vec2f(1.0));
  var sceneColor = textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate,
    0.0
  ).rgb * 0.4;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate + vec2f(blurRadius.x, 0.0),
    0.0
  ).rgb * 0.15;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate - vec2f(blurRadius.x, 0.0),
    0.0
  ).rgb * 0.15;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate + vec2f(0.0, blurRadius.y),
    0.0
  ).rgb * 0.15;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate - vec2f(0.0, blurRadius.y),
    0.0
  ).rgb * 0.15;
  return max(sceneColor, vec3f(0.0));
}

fn getTransmittedSceneColor(
  position: vec3f,
  normal: vec3f,
  viewDirection: vec3f,
  thickness: f32,
  perceptualRoughness: f32
) -> vec3f {
  if (pbrMaterial.dispersion <= 0.0) {
    return sampleTransmittedSceneColor(
      position,
      normal,
      viewDirection,
      thickness,
      perceptualRoughness,
      pbrMaterial.ior
    );
  }

  let halfSpread = (max(pbrMaterial.ior, 1.0) - 1.0) * 0.025 * pbrMaterial.dispersion;
  let indicesOfRefraction = max(
    vec3f(pbrMaterial.ior - halfSpread, pbrMaterial.ior, pbrMaterial.ior + halfSpread),
    vec3f(1.0)
  );
  return vec3f(
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.r
    ).r,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.g
    ).g,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.b
    ).b
  );
}
#endif

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
    basePBRInfo.v,
    basePBRInfo.l,
    basePBRInfo.h
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

  let alpha = max(sheenRoughness * sheenRoughness, 0.0001);
  let inverseAlpha = 1.0 / alpha;
  let sineSquared = max(1.0 - pbrInfo.NdotH * pbrInfo.NdotH, 0.0);
  let distribution = (2.0 + inverseAlpha) * pow(sineSquared, inverseAlpha * 0.5) /
    (2.0 * M_PI);
  let visibility = 1.0 / max(
    4.0 * (pbrInfo.NdotL + pbrInfo.NdotV - pbrInfo.NdotL * pbrInfo.NdotV),
    0.0001
  );
  return pbrInfo.NdotL * lightColor * sheenColor * distribution * visibility *
    (1.0 - pbrInfo.metalness);
}

fn calculateAnisotropicLightColor(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  anisotropyTangent: vec3f,
  anisotropyStrength: f32
) -> vec3f {
  if (anisotropyStrength <= 0.0) {
    return calculateFinalColor(pbrInfo, lightColor);
  }

  let anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  let tangentRoughness = mix(
    pbrInfo.alphaRoughness,
    1.0,
    anisotropyStrength * anisotropyStrength
  );
  let bitangentRoughness = clamp(pbrInfo.alphaRoughness, 0.001, 1.0);
  let roughnessProduct = tangentRoughness * bitangentRoughness;
  let distributionVector = vec3f(
    bitangentRoughness * dot(anisotropyTangent, pbrInfo.h),
    tangentRoughness * dot(anisotropyBitangent, pbrInfo.h),
    roughnessProduct * pbrInfo.NdotH
  );
  let distributionFactor = roughnessProduct /
    max(dot(distributionVector, distributionVector), 0.000001);
  let distribution = roughnessProduct * distributionFactor * distributionFactor / M_PI;
  let viewMask = pbrInfo.NdotL * length(vec3f(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.v),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.v),
    pbrInfo.NdotV
  ));
  let lightMask = pbrInfo.NdotV * length(vec3f(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.l),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.l),
    pbrInfo.NdotL
  ));
  let visibility = clamp(0.5 / max(viewMask + lightMask, 0.000001), 0.0, 1.0);
  let fresnel = specularReflection(pbrInfo);
  let diffuseContribution = (vec3f(1.0) - fresnel) * diffuse(pbrInfo);
  return pbrInfo.NdotL * lightColor *
    (diffuseContribution + fresnel * distribution * visibility);
}

fn getAnisotropicReflection(
  pbrInfo: PBRInfo,
  anisotropyTangent: vec3f,
  anisotropyStrength: f32
) -> vec3f {
  if (anisotropyStrength <= 0.0) {
    return -normalize(reflect(pbrInfo.v, pbrInfo.n));
  }
  let anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  var anisotropicNormal = normalize(cross(anisotropyBitangent, pbrInfo.v));
  anisotropicNormal = normalize(cross(anisotropicNormal, anisotropyBitangent));
  let bend = anisotropyStrength * (1.0 - pbrInfo.perceptualRoughness);
  return -normalize(reflect(pbrInfo.v, normalize(mix(pbrInfo.n, anisotropicNormal, bend))));
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
  var color = calculateAnisotropicLightColor(
    pbrInfo,
    lightColor,
    anisotropyTangent,
    anisotropyStrength
  );
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
  (*pbrInfo).l = (*pbrInfo).n;
  (*pbrInfo).h = (*pbrInfo).n;
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
  (*pbrInfo).l = l;
  (*pbrInfo).h = h;
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

fn pbr_filterColor(vertexColor: vec4<f32>) -> vec4<f32> {
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
  let diffuseTransmissionUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionUVSet,
    pbrMaterial.diffuseTransmissionUVTransform
  );
  let diffuseTransmissionColorUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionColorUVSet,
    pbrMaterial.diffuseTransmissionColorUVTransform
  );
  let multiscatterColorUV = getMaterialUV(
    pbrMaterial.multiscatterColorUVSet,
    pbrMaterial.multiscatterColorUVTransform
  );

  // The albedo may be defined from a base texture or a flat color
  var baseColor: vec4<f32> = pbrMaterial.baseColorFactor * vertexColor;
  #ifdef HAS_BASECOLORMAP
  baseColor = SRGBtoLINEAR(
    textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, baseColorUV)
  ) * pbrMaterial.baseColorFactor * vertexColor;
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
    perceptualRoughness = widenSpecularRoughness(perceptualRoughness, n);
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
      pbrMaterial.dispersion > 0.0001 ||
      pbrMaterial.transmissionMapEnabled != 0 ||
      pbrMaterial.transmissionFactor > 0.0001 ||
      pbrMaterial.diffuseTransmissionMapEnabled != 0 ||
      pbrMaterial.diffuseTransmissionColorMapEnabled != 0 ||
      pbrMaterial.diffuseTransmissionFactor > 0.0001 ||
      pbrMaterial.multiscatterColorMapEnabled != 0 ||
      maxComponent(pbrMaterial.multiscatterColorFactor) > 0.0001 ||
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
        v,
        n,
        n
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

      return vec4<f32>(applySceneColorManagement(color), baseColor.a);
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

    var diffuseTransmission = clamp(pbrMaterial.diffuseTransmissionFactor, 0.0, 1.0);
    #ifdef HAS_DIFFUSETRANSMISSIONMAP
    if (pbrMaterial.diffuseTransmissionMapEnabled != 0) {
      diffuseTransmission *= textureSample(
        pbr_diffuseTransmissionSampler,
        pbr_diffuseTransmissionSamplerSampler,
        diffuseTransmissionUV
      ).a;
    }
    #endif
    diffuseTransmission *= (1.0 - metallic) * (1.0 - transmission);
    var diffuseTransmissionColor = pbrMaterial.diffuseTransmissionColorFactor;
    #ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
    if (pbrMaterial.diffuseTransmissionColorMapEnabled != 0) {
      diffuseTransmissionColor *= SRGBtoLINEAR(
        textureSample(
          pbr_diffuseTransmissionColorSampler,
          pbr_diffuseTransmissionColorSamplerSampler,
          diffuseTransmissionColorUV
        )
      ).rgb;
    }
    #endif
    var multiscatterColor = pbrMaterial.multiscatterColorFactor;
    #ifdef HAS_MULTISCATTERCOLORMAP
    if (pbrMaterial.multiscatterColorMapEnabled != 0) {
      multiscatterColor *= SRGBtoLINEAR(
        textureSample(
          pbr_multiscatterColorSampler,
          pbr_multiscatterColorSamplerSampler,
          multiscatterColorUV
        )
      ).rgb;
    }
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
    clearcoatRoughness = widenSpecularRoughness(clearcoatRoughness, clearcoatNormal);

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
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    let alphaRoughness = perceptualRoughness * perceptualRoughness;

    let dielectricF0 = getDielectricF0(pbrMaterial.ior);
    var dielectricSpecularF0 = min(
      vec3f(dielectricF0) * specularFactor * specularIntensity,
      vec3f(1.0)
    );
    dielectricSpecularF0 = getIridescenceTint(
      iridescence,
      iridescenceThickness,
      NdotV,
      dielectricSpecularF0
    );
    var diffuseColor = baseColor.rgb * (vec3f(1.0) - dielectricSpecularF0);
    diffuseColor *= (1.0 - metallic) * (1.0 - transmission) * (1.0 - diffuseTransmission);
    var specularColor = mix(dielectricSpecularF0, baseColor.rgb, metallic);

    let clearcoatViewFresnel = dielectricSchlick(
      0.04,
      clamp(abs(dot(clearcoatNormal, v)), 0.0, 1.0)
    );
    let sheenDirectionalAlbedo = maxComponent(sheenColor) *
      (0.157 + 0.343 * (1.0 - NdotV)) * (1.0 - sheenRoughness * 0.5);
    let baseLayerEnergy = (1.0 - clearcoatFactor * clearcoatViewFresnel) *
      (1.0 - clamp(sheenDirectionalAlbedo, 0.0, 1.0));
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
      v,
      n,
      n
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
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getDirectionalLight(i).color,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
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
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getPointLight(i).color / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
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
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getSpotLight(i).color / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }
    #endif

    // Calculate lighting contribution from image based lighting source (IBL)
    #ifdef USE_IBL
    if (pbrMaterial.IBLenabled != 0) {
      color += getIBLContribution(
        pbrInfo,
        n,
        getAnisotropicReflection(pbrInfo, anisotropyTangent, anisotropyStrength)
      );
      color += calculateClearcoatIBLContribution(
        pbrInfo,
        clearcoatNormal,
        -normalize(reflect(v, clearcoatNormal)),
        clearcoatFactor,
        clearcoatRoughness
      );
      color += calculateDiffuseTransmissionIBL(
        pbrInfo,
        diffuseTransmissionColor,
        diffuseTransmission,
        multiscatterColor,
        thickness
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
      #ifdef USE_TRANSMISSION_FRAMEBUFFER
      let dielectricFresnel = getDielectricF0(pbrMaterial.ior);
      let transmissionFresnel = dielectricFresnel +
        (1.0 - dielectricFresnel) * pow(1.0 - NdotV, 5.0);
      let transmittedColor = getTransmittedSceneColor(
        fragmentInputs.pbr_vPosition,
        n,
        v,
        thickness,
        perceptualRoughness
      );
      color += transmittedColor * getVolumeAttenuation(thickness) *
        transmission * (1.0 - transmissionFresnel);
      #else
      color = mix(color, color * getVolumeAttenuation(thickness), transmission);
      #endif
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

  #ifdef USE_TRANSMISSION_FRAMEBUFFER
  let alpha = clamp(baseColor.a, 0.0, 1.0);
  #else
  let alpha = clamp(baseColor.a * (1.0 - transmission), 0.0, 1.0);
  #endif
  return vec4<f32>(applySceneColorManagement(color), alpha);
}
`,c=`\
layout(std140) uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,f=`\
struct pbrProjectionUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  camera: vec3<f32>
};

@group(0) @binding(auto) var<uniform> pbrProjection: pbrProjectionUniforms;
`,p={props:{},uniforms:{},defaultUniforms:{unlit:!1,baseColorMapEnabled:!1,baseColorFactor:[1,1,1,1],normalMapEnabled:!1,normalScale:1,emissiveMapEnabled:!1,emissiveFactor:[0,0,0],metallicRoughnessValues:[1,1],metallicRoughnessMapEnabled:!1,occlusionMapEnabled:!1,occlusionStrength:1,alphaCutoffEnabled:!1,alphaCutoff:.5,IBLenabled:!1,scaleIBLAmbient:[1,1],scaleDiffBaseMR:[0,0,0,0],scaleFGDSpec:[0,0,0,0],specularColorFactor:[1,1,1],specularIntensityFactor:1,specularColorMapEnabled:!1,specularIntensityMapEnabled:!1,ior:1.5,transmissionFactor:0,transmissionMapEnabled:!1,thicknessFactor:0,attenuationDistance:1e9,attenuationColor:[1,1,1],clearcoatFactor:0,clearcoatRoughnessFactor:0,clearcoatMapEnabled:!1,clearcoatRoughnessMapEnabled:!1,sheenColorFactor:[0,0,0],sheenRoughnessFactor:0,sheenColorMapEnabled:!1,sheenRoughnessMapEnabled:!1,iridescenceFactor:0,iridescenceIor:1.3,iridescenceThicknessRange:[100,400],iridescenceMapEnabled:!1,anisotropyStrength:0,anisotropyRotation:0,anisotropyDirection:[1,0],anisotropyMapEnabled:!1,emissiveStrength:1,dispersion:0,baseColorUVSet:0,baseColorUVTransform:[1,0,0,0,1,0,0,0,1],metallicRoughnessUVSet:0,metallicRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],normalUVSet:0,normalUVTransform:[1,0,0,0,1,0,0,0,1],occlusionUVSet:0,occlusionUVTransform:[1,0,0,0,1,0,0,0,1],emissiveUVSet:0,emissiveUVTransform:[1,0,0,0,1,0,0,0,1],specularColorUVSet:0,specularColorUVTransform:[1,0,0,0,1,0,0,0,1],specularIntensityUVSet:0,specularIntensityUVTransform:[1,0,0,0,1,0,0,0,1],transmissionUVSet:0,transmissionUVTransform:[1,0,0,0,1,0,0,0,1],thicknessUVSet:0,thicknessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatUVSet:0,clearcoatUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatRoughnessUVSet:0,clearcoatRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatNormalUVSet:0,clearcoatNormalUVTransform:[1,0,0,0,1,0,0,0,1],sheenColorUVSet:0,sheenColorUVTransform:[1,0,0,0,1,0,0,0,1],sheenRoughnessUVSet:0,sheenRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceUVSet:0,iridescenceUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceThicknessUVSet:0,iridescenceThicknessUVTransform:[1,0,0,0,1,0,0,0,1],anisotropyUVSet:0,anisotropyUVTransform:[1,0,0,0,1,0,0,0,1],bumpFactor:1,bumpMapEnabled:!1,diffuseTransmissionFactor:0,diffuseTransmissionMapEnabled:!1,diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorMapEnabled:!1,multiscatterColorFactor:[0,0,0],multiscatterColorMapEnabled:!1,scatterAnisotropy:0,bumpUVSet:0,bumpUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionUVSet:0,diffuseTransmissionUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionColorUVSet:0,diffuseTransmissionColorUVTransform:[1,0,0,0,1,0,0,0,1],multiscatterColorUVSet:0,multiscatterColorUVTransform:[1,0,0,0,1,0,0,0,1]},name:"pbrMaterial",firstBindingSlot:0,bindingLayout:[{name:"pbrMaterial",group:3},{name:"pbr_baseColorSampler",group:3},{name:"pbr_normalSampler",group:3},{name:"pbr_emissiveSampler",group:3},{name:"pbr_metallicRoughnessSampler",group:3},{name:"pbr_occlusionSampler",group:3},{name:"pbr_specularColorSampler",group:3},{name:"pbr_specularIntensitySampler",group:3},{name:"pbr_transmissionSampler",group:3},{name:"pbr_thicknessSampler",group:3},{name:"pbr_clearcoatSampler",group:3},{name:"pbr_clearcoatRoughnessSampler",group:3},{name:"pbr_clearcoatNormalSampler",group:3},{name:"pbr_sheenColorSampler",group:3},{name:"pbr_sheenRoughnessSampler",group:3},{name:"pbr_iridescenceSampler",group:3},{name:"pbr_iridescenceThicknessSampler",group:3},{name:"pbr_anisotropySampler",group:3},{name:"pbr_bumpSampler",group:3},{name:"pbr_diffuseTransmissionSampler",group:3},{name:"pbr_diffuseTransmissionColorSampler",group:3},{name:"pbr_multiscatterColorSampler",group:3}],dependencies:[n.x,{name:"ibl",firstBindingSlot:32,bindingLayout:[{name:"pbr_diffuseEnvSampler",group:2},{name:"pbr_specularEnvSampler",group:2},{name:"pbr_brdfLUT",group:2}],source:a,vs:i,fs:i},{name:"pbrProjection",bindingLayout:[{name:"pbrProjection",group:0}],source:f,vs:c,fs:c,getUniforms:e=>e,uniformTypes:{modelViewProjectionMatrix:"mat4x4<f32>",modelMatrix:"mat4x4<f32>",normalMatrix:"mat4x4<f32>",camera:"vec3<f32>"}}],source:l,vs:o,fs:s,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,HAS_SPECULARCOLORMAP:!1,HAS_SPECULARINTENSITYMAP:!1,HAS_TRANSMISSIONMAP:!1,HAS_THICKNESSMAP:!1,HAS_CLEARCOATMAP:!1,HAS_CLEARCOATROUGHNESSMAP:!1,HAS_CLEARCOATNORMALMAP:!1,HAS_SHEENCOLORMAP:!1,HAS_SHEENROUGHNESSMAP:!1,HAS_IRIDESCENCEMAP:!1,HAS_IRIDESCENCETHICKNESSMAP:!1,HAS_ANISOTROPYMAP:!1,HAS_BUMPMAP:!1,HAS_DIFFUSETRANSMISSIONMAP:!1,HAS_DIFFUSETRANSMISSIONCOLORMAP:!1,HAS_MULTISCATTERCOLORMAP:!1,USE_MATERIAL_EXTENSIONS:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:e=>e,uniformTypes:{unlit:"i32",baseColorMapEnabled:"i32",baseColorFactor:"vec4<f32>",normalMapEnabled:"i32",normalScale:"f32",emissiveMapEnabled:"i32",emissiveFactor:"vec3<f32>",metallicRoughnessValues:"vec2<f32>",metallicRoughnessMapEnabled:"i32",occlusionMapEnabled:"i32",occlusionStrength:"f32",alphaCutoffEnabled:"i32",alphaCutoff:"f32",specularColorFactor:"vec3<f32>",specularIntensityFactor:"f32",specularColorMapEnabled:"i32",specularIntensityMapEnabled:"i32",ior:"f32",transmissionFactor:"f32",transmissionMapEnabled:"i32",thicknessFactor:"f32",attenuationDistance:"f32",attenuationColor:"vec3<f32>",clearcoatFactor:"f32",clearcoatRoughnessFactor:"f32",clearcoatMapEnabled:"i32",clearcoatRoughnessMapEnabled:"i32",sheenColorFactor:"vec3<f32>",sheenRoughnessFactor:"f32",sheenColorMapEnabled:"i32",sheenRoughnessMapEnabled:"i32",iridescenceFactor:"f32",iridescenceIor:"f32",iridescenceThicknessRange:"vec2<f32>",iridescenceMapEnabled:"i32",anisotropyStrength:"f32",anisotropyRotation:"f32",anisotropyDirection:"vec2<f32>",anisotropyMapEnabled:"i32",emissiveStrength:"f32",dispersion:"f32",IBLenabled:"i32",scaleIBLAmbient:"vec2<f32>",scaleDiffBaseMR:"vec4<f32>",scaleFGDSpec:"vec4<f32>",baseColorUVSet:"i32",baseColorUVTransform:"mat3x3<f32>",metallicRoughnessUVSet:"i32",metallicRoughnessUVTransform:"mat3x3<f32>",normalUVSet:"i32",normalUVTransform:"mat3x3<f32>",occlusionUVSet:"i32",occlusionUVTransform:"mat3x3<f32>",emissiveUVSet:"i32",emissiveUVTransform:"mat3x3<f32>",specularColorUVSet:"i32",specularColorUVTransform:"mat3x3<f32>",specularIntensityUVSet:"i32",specularIntensityUVTransform:"mat3x3<f32>",transmissionUVSet:"i32",transmissionUVTransform:"mat3x3<f32>",thicknessUVSet:"i32",thicknessUVTransform:"mat3x3<f32>",clearcoatUVSet:"i32",clearcoatUVTransform:"mat3x3<f32>",clearcoatRoughnessUVSet:"i32",clearcoatRoughnessUVTransform:"mat3x3<f32>",clearcoatNormalUVSet:"i32",clearcoatNormalUVTransform:"mat3x3<f32>",sheenColorUVSet:"i32",sheenColorUVTransform:"mat3x3<f32>",sheenRoughnessUVSet:"i32",sheenRoughnessUVTransform:"mat3x3<f32>",iridescenceUVSet:"i32",iridescenceUVTransform:"mat3x3<f32>",iridescenceThicknessUVSet:"i32",iridescenceThicknessUVTransform:"mat3x3<f32>",anisotropyUVSet:"i32",anisotropyUVTransform:"mat3x3<f32>",bumpFactor:"f32",bumpMapEnabled:"i32",diffuseTransmissionFactor:"f32",diffuseTransmissionMapEnabled:"i32",diffuseTransmissionColorFactor:"vec3<f32>",diffuseTransmissionColorMapEnabled:"i32",multiscatterColorFactor:"vec3<f32>",multiscatterColorMapEnabled:"i32",scatterAnisotropy:"f32",bumpUVSet:"i32",bumpUVTransform:"mat3x3<f32>",diffuseTransmissionUVSet:"i32",diffuseTransmissionUVTransform:"mat3x3<f32>",diffuseTransmissionColorUVSet:"i32",diffuseTransmissionColorUVTransform:"mat3x3<f32>",multiscatterColorUVSet:"i32",multiscatterColorUVTransform:"mat3x3<f32>"}}},72734(e,t,r){r.d(t,{JM:()=>n,PI:()=>i,Sy:()=>a});let a=Math.PI/2,i=Math.PI,n=2*Math.PI}}]);