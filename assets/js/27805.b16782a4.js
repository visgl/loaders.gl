"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["27805"],{46908(e,t,i){function r(e){return 16===e.typeId}function n(e){return 2===e.typeId||3===e.typeId}function s(e,t={}){let{semantic:i="auto",...o}=t;if("position"===i&&(!r(e)||![2,3].includes(e.listSize)))throw Error("Arrow positions must be FixedSizeList[2] or FixedSizeList[3]");if("scalar"===i&&!n(e))throw Error("Arrow scalar input must be numeric");let a=o.format;if(a||("color"===i&&(a="unorm8x4"),"scalar"===i&&(a="float32"),"position"===i&&(a=r(e)&&2===e.listSize?"float32x2":"float32x3")),!a){let t=r(e)?e.listSize:1;a=1===t?"float32":`float32x${t}`}let l="color"===i||"unorm8x4"===a,u="float32"===a?1:Number(/x([234])$/.exec(a)?.[1]);if(!u||(l?"unorm8x4"!==a:!a.startsWith("float32")))throw Error(`Unsupported Arrow output format: ${a}`);let c=r(e),f=c?e.listSize:1;if(!n(c?e.children[0].type:e))throw Error("Arrow input must contain numeric values");if(!l&&!o.transform&&f>u||l&&![3,4].includes(f))throw Error("Arrow input width does not match the requested output format");return a}i.d(t,{H:()=>s})},88203(e,t,i){i.d(t,{_:()=>r});function r(e){return!!(e&&Number.isInteger(e.numRows)&&Array.isArray(e.schema?.fields)&&"function"==typeof e.get&&"function"==typeof e.getChild)}},43411(e,t,i){i.d(t,{A:()=>o,k:()=>s});var r=i(68996);let n={};function s(e){n=e}function o(e,t,i,s){r.A.level>0&&n[e]&&n[e].call(null,t,i,s)}},6903(e,t,i){i.d(t,{A:()=>ey});var r={};i.r(r),i.d(r,{arithmetic:()=>c,castData:()=>f.K,convertColors:()=>d.K,dot:()=>m,equalAll:()=>b,extent:()=>p,fround:()=>h,gather:()=>_,interleave:()=>g,length:()=>v,segmentedMap:()=>y,select:()=>w,sequence:()=>P,swizzle:()=>S});var n=i(35204),s=i(1069),o=i(64344),a=i(8663);function l({elementWise:e,func:t,inputs:i,output:r,outputBuffer:n}){let s=Array.isArray(i)?i:Object.values(i);for(let e of s)if(!e.value)throw Error(`${e} does not have CPU value`);let o=r.length,a=r.size,c=new r.ValueType(o*a);for(let i=0;i<o;i++){let r=s.map(e=>u(e,i));if(e)for(let e=0;e<a;e++)c[i*a+e]=t.apply(null,r.map(t=>t[e]));else t.call(null,c.subarray(i*a,i*a+a),...r)}let f=r.ValueType.BYTES_PER_ELEMENT,d=r.offset/f,p=r.stride/f,h=c;if(0!==d||p!==a){h=new r.ValueType(d+r.byteLength/f);for(let e=0;e<o;e++){let t=e*a,i=d+e*p,r=c.subarray(t,t+a);h.set(r,i),n.write(r,i*f)}}else n.write(c);return{success:!0,value:h}}function u(e,t){let i=e.value,r=e.size,n=e.offset/e.ValueType.BYTES_PER_ELEMENT,s=e.stride/e.ValueType.BYTES_PER_ELEMENT,o=n+(e.isConstant?0:t)*s,a=i.slice(o,o+r);if(!e.normalized)return a;let l=new Float32Array(r);for(let t=0;t<r;t++)l[t]=function(e,t){switch(t){case"uint8":return e/255;case"uint16":return e/65535;case"uint32":return e/0xffffffff;case"sint8":return Math.max(e/127,-1);case"sint16":return Math.max(e/32767,-1);case"sint32":return Math.max(e/0x7fffffff,-1);case"float32":return e;default:throw Error(`Unsupported normalized source type ${t}`)}}(a[t],e.type);return l}let c=({inputs:e,output:t,target:i})=>{for(let t of Object.values(e.namedInputs))if(!t.value)throw Error(`${t} does not have CPU value`);let r=new t.ValueType(t.length*t.size);for(let i=0;i<t.length;i++){let n=Object.fromEntries(Object.entries(e.namedInputs).map(([e,t])=>[e,u(t,i)]));for(let s=0;s<t.size;s++)r[i*t.size+s]=function e(t,i,r){switch(t.kind){case"input":{let e=i[t.name];if(r<e.length)return e[r];return 1===e.length?e[0]:0}case"literal":if(Array.isArray(t.value))return t.value[r]??0;return t.value;case"call":{!function(e,t){let i=a.E[e].arity;if(t!==i)throw Error(`Arithmetic op '${e}' expects ${i} args, got ${t}`)}(t.op,t.args.length);let n=t.args.map(t=>e(t,i,r));switch(t.op){case"add":return n[0]+n[1];case"subtract":return n[0]-n[1];case"multiply":return n[0]*n[1];case"divide":return n[0]/n[1];case"pow":return Math.pow(n[0],n[1]);case"sqrt":return Math.sqrt(n[0]);case"abs":return Math.abs(n[0]);case"sin":return Math.sin(n[0]);case"cos":return Math.cos(n[0]);case"tan":return Math.tan(n[0]);case"exp":return Math.exp(n[0]);case"log":return Math.log(n[0]);default:{let e=t.op;throw Error(`Unsupported arithmetic op ${e}`)}}}default:throw Error(`Unsupported expression node ${t.kind}`)}}(e.expression,n,s)}return i.write(r),{success:!0,value:r}};var f=i(24789),d=i(76159);let p=({inputs:e,output:t,target:i})=>{let{sourceValues:r}=e;if(!r.value)throw Error(`${r} does not have CPU value`);let n=new t.ValueType(t.length*t.size);if(0===r.length)return{success:!1,error:Error(`${r} is empty`)};for(let e=0;e<r.size;e++){let i=u(r,0)[e],s=e*t.size,o=s+1;n[s]=i,n[o]=i;for(let t=1;t<r.length;t++){let i=u(r,t)[e];i<n[s]&&(n[s]=i),i>n[o]&&(n[o]=i)}}return i.write(n),{success:!0,value:n}},h=({inputs:e,output:t,target:i})=>l({func:(e,t)=>{let i=e.length/2,r=new Float64Array(t.buffer);for(let t=0;t<i;t++){let n=r[t];e[t]=Math.fround(n),e[t+i]=n-e[t]}return e},inputs:e,output:t,outputBuffer:i}),_=async({inputs:e,output:t,target:i})=>{let{ids:r,sourceValues:n}=e,s=r.value,o=n.value;if(!s)throw Error(`${r} does not have CPU value`);if(!o)throw Error(`${n} does not have CPU value`);let a=new t.ValueType(t.length*t.size),l=Array(t.size).fill(0);for(let e=0;e<t.length;e++){var c,f;let i=Number(u(r,e)[0]),s=(c=i,f=n.length,Number.isInteger(c)&&c>=0&&c<f)?u(n,i):l;a.set(s,e*t.size)}return i.write(a),{success:!0,value:a}},g=({inputs:e,output:t,target:i})=>l({func:(e,...t)=>{let i=0;for(let r of t)e.set(r,i),i+=r.length},inputs:e,output:t,outputBuffer:i}),m=({inputs:e,output:t,target:i})=>{let{x:r,y:n}=e,s=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=u(r,e),i=u(n,e),o=0;for(let e=0;e<r.size;e++)o+=t[e]*i[e];s[e]=o}return i.write(s),{success:!0,value:s}},b=({inputs:e,output:t,target:i})=>{let{x:r,y:n}=e,s=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=u(r,e),i=u(n,e),o=1;for(let e=0;e<r.size;e++)if(t[e]!==i[e]){o=0;break}s[e]=o}return i.write(s),{success:!0,value:s}},v=({inputs:e,output:t,target:i})=>{let{x:r}=e,n=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=u(r,e),i=0;for(let e=0;e<r.size;e++)i+=t[e]*t[e];n[e]=Math.sqrt(i)}return i.write(n),{success:!0,value:n}},y=async({inputs:e,output:t,target:i})=>{let{segments:r,vertexCount:n}=e,s=r.value;if(!s)throw Error(`${r} does not have CPU value`);var o=s,a=r,l=n;if(a.length<1)throw Error("segmentedMap segments must contain at least one segment start");let u=0;for(let e=0;e<a.length;e++){let t=o[E(a,e)];if(0===e&&0!==t)throw Error(`segmentedMap segments must start at 0, got ${t}`);if(e>0&&t<u)throw Error(`segmentedMap segments must be non-decreasing, got ${t} after ${u}`);u=t}if(u>l)throw Error(`segmentedMap last segment start must be <= vertexCount, got ${u} > ${l}`);let c=new t.ValueType(t.length*t.size),f=0;for(let e=0;e<n;e++){for(;f+1<r.length&&s[E(r,f+1)]<=e;)f++;let i=s[E(r,f)],n=e*t.size;c[n]=f,c[n+1]=e-i}return i.write(c),{success:!0,value:c}};function E(e,t){return e.offset/e.ValueType.BYTES_PER_ELEMENT+t*(e.stride/e.ValueType.BYTES_PER_ELEMENT)}let w=async({inputs:e,output:t,target:i})=>{let{condition:r,whenTrue:n,whenFalse:s}=e,o=new t.ValueType(t.length*t.size);for(let e=0;e<t.length;e++){let i=u(r,e),a=u(n,e),l=u(s,e);for(let u=0;u<t.size;u++){let c=x(i,r.size,u);o[e*t.size+u]=0!==c?x(a,n.size,u):x(l,s.size,u)}}return i.write(o),{success:!0,value:o}};function x(e,t,i){return i<t?e[i]:1===t?e[0]:0}let P=({inputs:e,output:t,target:i})=>{let r=new t.ValueType(t.length);for(let i=0;i<t.length;i++)r[i]=e.start+i*e.step;return i.write(r),{success:!0,value:r}},S=({inputs:e,output:t,target:i})=>{let{columns:r}=e;return l({func:(e,t)=>{for(let i=0;i<r.length;i++)e[i]=t[r[i]]},inputs:{x:e.x},output:t,outputBuffer:i})},T=new class{_modules={cpu:r};add(e,t){let i=this._modules[e];if("function"==typeof t.then){let r=Promise.all([Promise.resolve(i||{}),t]).then(([e,t])=>({...e,...t}));return this._modules[e]=r,r.then(t=>{this._modules[e]=t}).catch(t=>{o.R.error(`Failed to register ${e} backend: ${t}`)()}),r}if(i&&"function"==typeof i.then){let r=Promise.resolve(i).then(e=>({...e,...t})).then(t=>(this._modules[e]=t,t)).catch(t=>{throw o.R.error(`Failed to register ${e} backend: ${t}`)(),t});return this._modules[e]=r,r}let r={...i||{},...t};return this._modules[e]=r,Promise.resolve(r)}async get(e,t){let r=this._modules[e];if(!r)if("webgl"===e)r=this.add("webgl",i.e("44376").then(i.bind(i,59403)));else if("webgpu"===e)r=this.add("webgpu",i.e("89923").then(i.bind(i,41422)));else throw Error(`${e} backend not registered`);let n=(await r)[t];if("function"!=typeof n&&("webgl"===e?n=(await i.e("44376").then(i.bind(i,59403)))[t]:"webgpu"===e&&(n=(await i.e("89923").then(i.bind(i,41422)))[t])),"function"!=typeof n)throw Error(`${e} backend does not implement ${t}`);return n}getSync(e,t){let i=this._modules[e];if(!i)throw Error(`${e} backend not registered`);if("function"==typeof i.then)throw Error(`${e} backend is not loaded yet`);let r=i[t];if("function"!=typeof r)throw Error(`${e} backend does not implement ${t}`);return r}clear(){this._modules={}}};var O=i(46296);class A{inputs;dependencies;constructor(e){this.inputs=e,this.dependencies=Array.from(e instanceof Array?e:Object.values(e)).filter(e=>e instanceof O.GL)}async execute(e,t,i){i||await this._resolveDependencies(e);let r=await T.get(this._getHandlerRegistry(e,i),this.name);if(i&&("webgpu"!==e.type||!r.supportsEvaluationScope))throw Error(`${this.name} does not support deferred-submission evaluation`);return i&&await this._resolveDependencies(e,i),await this._executeWithHandler(r,t,i)}executeSync(e,t){var i;this._resolveDependenciesSync(e);let r=this._executeWithHandler(T.getSync(this._getHandlerRegistry(e),this.name),t);if(i=r,"function"==typeof i?.then)throw Error(`${this.name} returned a Promise in executeSync()`);return r}shouldExecuteOnCPU(){return this.output.length<=1&&Array.from(this.dependencies).every(e=>!!e.value)}_getHandlerRegistry(e,t){return!t&&this.shouldExecuteOnCPU()?"cpu":e.type}async _resolveDependencies(e,t){for(let i of this.dependencies)await i.evaluate(e,{scope:t});if("cpu"===this._getHandlerRegistry(e,t)||"null"===e.type)for(let e of this.dependencies)await e.ensureCPUValue()}_resolveDependenciesSync(e){for(let t of this.dependencies)t.evaluateSync(e);if("cpu"===this._getHandlerRegistry(e)||"null"===e.type)for(let e of this.dependencies)e.ensureCPUValueSync()}_executeWithHandler(e,t,i){return e({scope:i,device:t.device,inputs:this.inputs,output:this.output,target:t})}}class I extends A{name="interleave";output;constructor(e){super(e);let{isConstant:t,type:i,length:r}=function(...e){let t=function(e){let t=0,i=0;for(let r of e){if("f"===r[0])return"float32";let e=r.endsWith("8")?8:r.endsWith("6")?16:32;"u"===r[0]?t=Math.max(t,e):i=Math.max(i,e)}return t&&!i?`uint${t}`:i&&t<32?`sint${Math.max(i,2*t)}`:"float32"}(e.map(e=>e.type));return"f"!==t[0]&&e.some(e=>e.normalized)&&(t="float32"),{isConstant:e.every(e=>e.isConstant),type:t,size:e.reduce((e,t)=>Math.max(e,t.size),0),length:e.reduce((e,t)=>Math.max(e,t.length),0)}}(...e);this.output=new O.GL({isConstant:t,type:i,size:e.reduce((e,t)=>e+t.size,0),length:r,source:this})}toString(){return`_${this.inputs.join("_")}_`}}var B=i(7036),L=i(89362),M=i(51002);class C{gpuDataEvaluators;format;length;id;_gpuVector;_ownsGPUDataEvaluators;_destroyed=!1;_evaluationScope;static fromGPUVector(e){if(e.bufferLayout)throw Error(`GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${e.name}"`);if(0===e.data.length)throw Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${e.name}"`);return new C({id:e.name,gpuDataEvaluators:e.data.map(t=>O.GL.fromGPUData(t,{id:e.name})),gpuVector:e,format:e.format})}static fromGPUDataEvaluators(e,t={}){return new C({id:t.id,gpuDataEvaluators:e,format:t.format})}constructor({id:e,gpuDataEvaluators:t,gpuVector:i,format:r}){if(0===t.length)throw Error("GPUVectorEvaluator requires at least one GPUData evaluator");(function(e){let t=e[0];for(let i of e.slice(1))if(i.type!==t.type||i.size!==t.size||i.normalized!==t.normalized||i.format!==t.format)throw Error("GPUVectorEvaluator requires matching GPUData evaluator layouts")})(t),this.id=e,this.gpuDataEvaluators=t,this.format=r??t[0].format,this.length=t.reduce((e,t)=>e+t.length,0),this._gpuVector=i,this._ownsGPUDataEvaluators=!i}get evaluated(){return!!this._gpuVector}getInspection(){return(0,L.r)(this.gpuDataEvaluators)}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}mapGPUData(e){return C.fromGPUDataEvaluators(this.gpuDataEvaluators.map((t,i)=>e(t,i)),{id:this.id})}async evaluate(e,t={}){let i;if(this.assertScopeAccess(t.scope),this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);let r=t.scope;if(r){if(r.assertEvaluating(e),!this._evaluationScope){let e=this._gpuVector;this._evaluationScope=r,r.retain(t=>{this._evaluationScope=void 0,t||(this._gpuVector=e)})}for(let r of(i=[],this.gpuDataEvaluators))i.push(await r.evaluate(e,t));if(this._gpuVector)return this._gpuVector}else{if(this._gpuVector)return this._gpuVector;i=await Promise.all(this.gpuDataEvaluators.map(i=>i.evaluate(e,t)))}let n=i[0],s=i.map(j),o=t.format??this.format??n.format;return this._gpuVector=new M.M({type:"data",name:t.name??this.id??"vector",format:o,data:s,stride:n.stride,byteStride:n.byteStride,rowByteLength:n.rowByteLength,bufferLayout:n.bufferLayout}),this._gpuVector}evaluateSync(e,t={}){if(t.scope)throw Error("Use scope.evaluate() for deferred submission");if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let i=this.gpuDataEvaluators.map(i=>i.evaluateSync(e,t)),r=i[0],n=i.map(j),s=t.format??this.format??r.format;return this._gpuVector=new M.M({type:"data",name:t.name??this.id??"vector",format:s,data:n,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}invalidate(){if(this.assertScopeAccess(),this._destroyed)throw Error("Cannot invalidate a destroyed evaluator");this._gpuVector=void 0}destroy(){if(this.assertScopeAccess(),this._ownsGPUDataEvaluators)for(let e of this.gpuDataEvaluators)e.destroy();this._gpuVector=void 0,this._destroyed=!0}assertScopeAccess(e){if(this._evaluationScope&&this._evaluationScope!==e)throw Error("Evaluator is retained by an unsubmitted scope")}toString(){return this.id??this.constructor.name}}function j(e){let[t,...i]=e.data;if(!t||i.length>0)throw Error(`GPUVectorEvaluator requires one GPUData chunk for "${e.name}"`);return t}function z(e){return e instanceof O.GL?[e.buffer]:e.gpuVector.data.map(e=>e.buffer instanceof B.kL?e.buffer.buffer:e.buffer)}var R=i(60138);class U{constructor(e,{id:t,isTransitionAttribute:i}){this.packedBuffers={},this.device=e,this.id=t,this.isTransitionAttribute=i,"webgpu"===this.device.type&&T.add("webgpu",{interleave:R.C})}hasGroups(e){return"webgpu"===this.device.type&&Object.values(e).some(e=>!!e.settings.bufferGroup)}finalize(){for(let e of Object.values(this.packedBuffers))e.packed.destroy();this.packedBuffers={}}getBufferLayouts(e,t){let i=this._getPackedGroups(e,t,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(e,i,t)}getBindings(e,t,i,r){let n=this._getPackedGroups(e,i,{requireValues:!0,excludeAttributes:r}),s={},o=new Set;for(let e of n.values()){let i=!this.packedBuffers[e.id]||e.attributes.some(e=>!!t[e.id]);for(let t of(s[e.id]=this._getPackedBuffer(e,i),e.attributes))o.add(t.id)}return{bufferLayouts:this._getBufferLayouts(e,n,i).filter(t=>!r[t.name]&&!e[t.name]?.settings.isIndexed),buffers:s,groupedAttributeIds:o}}_getPackedGroups(e,t,{requireValues:i,excludeAttributes:r}){let n=new Map;for(let t of Object.values(e)){let e=t.settings.bufferGroup;if(!e)continue;let i=n.get(e)||[];i.push(t),n.set(e,i)}let s=new Map;for(let[e,o]of n){let n=this._getPackedGroup(e,o,t,i,r);n&&s.set(e,n)}return s}_getPackedGroup(e,t,i,r,n){if(t.length<2)return null;let o=t.map(e=>e.getBufferLayout(i)),a=o[0].stepMode,l=Math.max(1,t[0].numInstances),u=r&&t.every(e=>e.isConstant);for(let e=0;e<t.length;e++){let i=t[e],u=i.getAccessor(),c=u.size*u.bytesPerElement;if(n[i.id]||i.settings.isIndexed||i.settings.noAlloc||i.doublePrecision||this.isTransitionAttribute(i.id)||o[e].stepMode!==a||i.numInstances!==t[0].numInstances||0!==(u.offset||0)||0!==(u.vertexOffset||0)||(0,s.m$)(u)!==c||r&&(i.isConstant?!i.getConstantValue()||i.getConstantValue().byteLength<c:!ArrayBuffer.isView(i.value)||i.value.byteLength<l*c))return null}let c={},f=[],d=0;for(let e=0;e<t.length;e++){let i=t[e];for(let t of(d=N(d),c[i.id]=d,o[e].attributes||[]))f.push({...t,byteOffset:d+(t.byteOffset||0)});d+=(0,s.m$)(i.getAccessor())}return{id:e,attributes:t,byteStride:d=N(d),byteOffsets:c,rowCount:l,layout:{name:e,byteStride:u?0:d,stepMode:a,attributes:f}}}_getBufferLayouts(e,t,i){let r=[],n=new Set,s=new Set;for(let e of t.values())for(let t of e.attributes)s.add(t.id);for(let o of Object.values(e)){let e=o.settings.bufferGroup,a=e&&t.get(e);a&&s.has(o.id)?n.has(a.id)||(r.push(a.layout),n.add(a.id)):r.push(o.getBufferLayout(i))}return r}_getPackedBuffer(e,t){let i=JSON.stringify({byteStride:e.layout.byteStride,attributes:e.layout.attributes}),r=this.packedBuffers[e.id];if(r&&r.layoutKey===i||(t=!0),t){r&&(r.packed.destroy(),delete this.packedBuffers[e.id]);let t=this._interleavePackedGroup(e);return this.packedBuffers[e.id]={packed:t,layoutKey:i},t.buffer}if(!r)throw Error(`Attribute buffer group ${e.id} has no packed buffer`);return r.packed.buffer}_interleavePackedGroup(e){let t=function(...e){if(0===e.length)throw Error("interleave() requires at least one input");return 1===e.length?(0,O.uy)(e[0]):new I(e.map(O.uy)).output}(...e.attributes.map(t=>this._getInterleaveInput(e,t)));return!function(e,t){let i,r=(function e(t,i,r){var n;if((n=t)instanceof O.GL||n instanceof C)return void i.add(t);if(!(!t||"object"!=typeof t||r.has(t))){let n;if(r.add(t),Array.isArray(t)){for(let n of t)e(n,i,r);return}if((n=Object.getPrototypeOf(t))===Object.prototype||null===n)for(let n of Object.values(t))e(n,i,r)}}(t,i=new Set,new Set),Array.from(i));for(let t of r)t.evaluateSync(e);var n=r;let s=new Set(n.flatMap(z)),o=new Set;for(let e of n)!function e(t,i){if(t instanceof C){for(let r of t.gpuDataEvaluators)e(r,i);return}let r=t.source;if(r){if(r instanceof O.GL){i.has(r)||(i.add(r),e(r,i));return}for(let t of r.dependencies)i.has(t)||(i.add(t),e(t,i))}}(e,o);for(let e of o)e.evaluated&&!s.has(e.buffer)&&e.destroy()}(this.device,t),t}_getInterleaveInput(e,t){let i=(0,s.m$)(t.getAccessor()),r=e.byteOffsets[t.id];if(k(`${e.id}.${t.id} rowByteLength`,i),k(`${e.id}.${t.id} groupByteOffset`,r),t.isConstant){let r=t.getConstantValue();if(!r)throw Error(`Attribute group ${e.id} is missing constant value ${t.id}`);return k(`${e.id}.${t.id} constant byteOffset`,r.byteOffset),new O.GL({id:t.id,type:"uint32",size:i/4,isConstant:!0,value:new Uint32Array(r.buffer,r.byteOffset,i/Uint32Array.BYTES_PER_ELEMENT)})}let n=t.getBuffer(),o=t.byteOffset,a=t.getAccessor().stride||i;if(k(`${e.id}.${t.id} byteOffset`,o),k(`${e.id}.${t.id} stride`,a),!n)throw Error(`Attribute group ${e.id} cannot interleave missing buffer ${t.id}`);return new O.GL({id:t.id,type:"uint32",size:i/4,offset:o,stride:a,length:e.rowCount,buffer:n})}}function N(e){return 4*Math.ceil(e/4)}function k(e,t){if(t%4!=0)throw Error(`Attribute buffer groups require 32-bit alignment: ${e}=${t}`)}var F=i(68996),D=i(82417),V=i(25667),G=i(43411),$=i(58006),Y=i(8994),W=i(63702),q=i(62459),H=i(11499);class X{device;model;transformFeedback;outputVectorBindings={};outputBuffers={};static defaultProps={...q.X.defaultProps,inputVectors:void 0,outputVectors:void 0,feedbackBufferMode:"separate",outputs:void 0,feedbackBuffers:void 0};static isSupported(e){return e?.info?.type==="webgl"}constructor(e,t=X.defaultProps){if(!X.isSupported(e))throw Error("BufferTransform not yet implemented on WebGPU");this.device=e,this.outputBuffers=t.feedbackBuffers||{};let{inputVectors:i,outputVectors:r,...n}=t;this.model=new q.X(this.device,{id:t.id||"buffer-transform-model",fs:t.fs||(0,W.Wk)(),topology:t.topology||"point-list",varyings:t.outputs||t.varyings,...n,bufferMode:t.bufferMode||("interleaved"===t.feedbackBufferMode?35980:35981)}),this.transformFeedback=this.device.createTransformFeedback({layout:this.model.pipeline.shaderLayout,buffers:t.feedbackBuffers}),this.model.setTransformFeedback(this.transformFeedback),i&&this.model.setGPUVectors(i,{count:"vertex"}),r&&this.setOutputVectors(r)}destroy(){this.model&&this.model.destroy()}delete(){this.destroy()}run(e){let{inputVectors:t,outputVectors:i,inputBuffers:r,outputBuffers:n,...s}=e??{};r&&this.model.setAttributes(r),t&&this.model.setGPUVectors(t,{count:"vertex"}),n&&(this.outputBuffers=n),(n||i||Object.keys(this.outputVectorBindings).length>0)&&this.setOutputVectors(i??this.outputVectorBindings);let o=this.device.beginRenderPass({discard:!0,...s});try{this.model.draw(o)}finally{o.end()}}setOutputVectors(e){let t=(0,H.t)(this.model.id,e);(0,$.v)(0===t.length||35980!==this.model.pipeline.props.bufferMode),(0,$.v)(t.length<=1),this.outputVectorBindings=e,this.transformFeedback.setBuffers({...this.outputBuffers,...Object.fromEntries(Object.entries(t[0]?.data??{}).map(([e,t])=>((0,$.v)(t.byteStride===t.rowByteLength),[e,{buffer:t.buffer instanceof B.kL?t.buffer.buffer:t.buffer,byteOffset:t.byteOffset,byteLength:t.length*t.byteStride}])))})}getBuffer(e){return this.transformFeedback.getBuffer(e)}readAsync(e){let t=this.getBuffer(e);if(!t)throw Error("BufferTransform#getBuffer");if(t instanceof Y.h)return t.readAsync();let{buffer:i,byteOffset:r=0,byteLength:n=i.byteLength}=t;return i.readAsync(r,n)}}function K(e,t=[],i=0){let r=Math.fround(e),n=e-r;return t[i]=r,t[i+1]=n,t}let Z=`\

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
`,J=`\
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

`,Q=`\
${J}

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

struct Fp64IntegerAccumulator {
  sign: u32,
  magnitude: vec2u,
};

fn fp64_accumulate_f32_integer(
  accumulator: Fp64IntegerAccumulator,
  value: Fp64F32Bits,
  commonBaseExponent: i32
) -> Fp64IntegerAccumulator {
  if (value.isZero) {
    return accumulator;
  }

  let magnitude = fp64_u64_shift_left(
    vec2u(0u, value.significand),
    u32(value.baseExponent - commonBaseExponent)
  );
  if (fp64_u64_is_zero(accumulator.magnitude)) {
    return Fp64IntegerAccumulator(value.sign, magnitude);
  }
  if (accumulator.sign == value.sign) {
    return Fp64IntegerAccumulator(
      accumulator.sign,
      fp64_u64_add(accumulator.magnitude, magnitude)
    );
  }

  let comparison = fp64_u64_compare(accumulator.magnitude, magnitude);
  if (comparison == 0) {
    return Fp64IntegerAccumulator(0u, vec2u(0u));
  }
  if (comparison > 0) {
    return Fp64IntegerAccumulator(
      accumulator.sign,
      fp64_u64_sub(accumulator.magnitude, magnitude)
    );
  }
  return Fp64IntegerAccumulator(
    value.sign,
    fp64_u64_sub(magnitude, accumulator.magnitude)
  );
}

fn fp64_sum_integer_unfused(a: vec2f, b: vec2f) -> vec2f {
  var sum = fp64_two_sum_integer(a.x, b.x);
  let lowSum = fp64_two_sum_integer(a.y, b.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.x);
  sum = fp64_two_sum_integer(sum.x, sum.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.y);
  return fp64_two_sum_integer(sum.x, sum.y);
}

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  let aHigh = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let aLow = fp64_decode_f32_bits(bitcast<u32>(a.y));
  let bHigh = fp64_decode_f32_bits(bitcast<u32>(b.x));
  let bLow = fp64_decode_f32_bits(bitcast<u32>(b.y));
  if (
    aHigh.isInf || aHigh.isNan || aLow.isInf || aLow.isNan ||
    bHigh.isInf || bHigh.isNan || bLow.isInf || bLow.isNan
  ) {
    return fp64_sum_integer_unfused(a, b);
  }

  var minimumBaseExponent = 2147483647;
  var maximumBaseExponent = -2147483647;
  if (!aHigh.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, aHigh.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, aHigh.baseExponent);
  }
  if (!aLow.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, aLow.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, aLow.baseExponent);
  }
  if (!bHigh.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, bHigh.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, bHigh.baseExponent);
  }
  if (!bLow.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, bLow.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, bLow.baseExponent);
  }
  if (maximumBaseExponent < minimumBaseExponent) {
    return vec2f(0.0, 0.0);
  }

  // Four 24-bit significands spanning at most 38 bits fit in the 64-bit
  // accumulator, including the two extra carry bits needed by their sum.
  if (maximumBaseExponent - minimumBaseExponent > 38) {
    return fp64_sum_integer_unfused(a, b);
  }

  var accumulator = Fp64IntegerAccumulator(0u, vec2u(0u));
  accumulator = fp64_accumulate_f32_integer(accumulator, aHigh, minimumBaseExponent);
  accumulator = fp64_accumulate_f32_integer(accumulator, aLow, minimumBaseExponent);
  accumulator = fp64_accumulate_f32_integer(accumulator, bHigh, minimumBaseExponent);
  accumulator = fp64_accumulate_f32_integer(accumulator, bLow, minimumBaseExponent);
  let resultBits = fp64_split_accumulator_bits(
    accumulator.sign,
    accumulator.magnitude,
    minimumBaseExponent
  );
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
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
  product = sum_fp64(product, vec2f(crossProduct1, 0.0));
  let crossProduct2 = fp64_round_mul_integer(a.y, b.x);
  return sum_fp64(product, vec2f(crossProduct2, 0.0));
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
`,ee=`\
${J}

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
  result.y = result.y + a.y;
  return result;
}

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
  let highSum = fp64_two_sum_integer(a.x, b.x);
  let lowSum = prevent_fp64_optimization((a.y + b.y) + highSum.y);
  return fp64_two_sum_integer(highSum.x, lowSum);
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  let highDifference = twoSub(a.x, b.x);
  let lowDifference = prevent_fp64_optimization((a.y - b.y) + highDifference.y);
  return fp64_two_sum_integer(highDifference.x, lowDifference);
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  let highProduct = fp64_two_prod_integer(a.x, b.x);
  let crossTerms = prevent_fp64_optimization(a.x * b.y + a.y * b.x);
  let lowTerms = prevent_fp64_optimization((crossTerms + a.y * b.y) + highProduct.y);
  return fp64_two_sum_integer(highProduct.x, lowTerms);
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let estimate = prevent_fp64_optimization(1.0 / b.x);
  let quotient = mul_fp64(a, vec2f(estimate, fp64_runtime_zero()));
  let remainder = prevent_fp64_optimization(sub_fp64(a, mul_fp64(b, quotient)).x);
  return sum_fp64(quotient, twoProd(estimate, remainder));
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  if (a.x == 0.0 && a.y == 0.0) {
    return vec2f(0.0, 0.0);
  }
  if (a.x < 0.0) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  let reciprocalRoot = prevent_fp64_optimization(1.0 / sqrt(a.x));
  let estimate = prevent_fp64_optimization(a.x * reciprocalRoot);
  let difference = prevent_fp64_optimization(sub_fp64(a, twoSqr(estimate)).x);
  let correction = twoProd(prevent_fp64_optimization(reciprocalRoot * 0.5), difference);
  return sum_fp64(vec2f(estimate, 0.0), correction);
}
#endif
`,et={name:"fp64arithmetic",source:`\
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
// Zero bits the compiler cannot prove are zero: the uniform ONE is 1.0 at runtime.
// Some WGSL backends compile with fast-math flags (e.g. Firefox WebGPU on Windows, where DXC
// runs without IEEE strictness). There, a float barrier such as \`x + ONE * 0.0\` folds away,
// and the error terms of the double-single transforms are re-associated and lost. An integer
// OR is opaque to floating-point simplification, and unlike XOR two nested barriers do not
// cancel. Each rounding step the transforms rely on gets its own barrier.
fn fp64_runtime_zero_bits() -> u32 {
  return bitcast<u32>(fp64arithmetic.ONE) ^ 0x3f800000u;
}

fn fp64_runtime_zero() -> f32 {
  return bitcast<f32>(fp64_runtime_zero_bits());
}

fn prevent_fp64_optimization(value: f32) -> f32 {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  return bitcast<f32>(bitcast<u32>(value) | fp64_runtime_zero_bits());
#else
  return value;
#endif
}
#endif

#ifdef LUMA_FP64_INTEGER_ARITHMETIC
${Q}
#else
#ifdef LUMA_FP64_HYBRID_ARITHMETIC
${ee}
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
  b.y = prevent_fp64_optimization(b.y + a.y);
  return b;
}

fn quickTwoSum(a: f32, b: f32) -> vec2f {
  let sum = prevent_fp64_optimization(a + b);
  let err = prevent_fp64_optimization(b - prevent_fp64_optimization(sum - a));
  return vec2f(sum, err);
}

fn twoSum(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a + b);
  let v = prevent_fp64_optimization(s - a);
  let aErr = prevent_fp64_optimization(a - prevent_fp64_optimization(s - v));
  let bErr = prevent_fp64_optimization(b - v);
  let err = prevent_fp64_optimization(aErr + bErr);
  return vec2f(s, err);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a - b);
  let v = prevent_fp64_optimization(s - a);
  let aErr = prevent_fp64_optimization(a - prevent_fp64_optimization(s - v));
  let bErr = prevent_fp64_optimization(b + v);
  let err = prevent_fp64_optimization(aErr - bErr);
  return vec2f(s, err);
}

fn twoSqr(a: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * a);
  let aFp64 = split(a);
  let highProduct = prevent_fp64_optimization(aFp64.x * aFp64.x);
  let crossProduct = prevent_fp64_optimization(2.0 * aFp64.x * aFp64.y);
  let lowProduct = prevent_fp64_optimization(aFp64.y * aFp64.y);
  let highErr = prevent_fp64_optimization(highProduct - prod);
  let err = prevent_fp64_optimization(
    prevent_fp64_optimization(highErr + crossProduct) + lowProduct
  );
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

// Scale by 2^exponent under either arithmetic. The classic path repacks each limb with
// integer operations and no floating-point arithmetic, so hardware that flushes subnormal
// results cannot zero a subnormal limb. Its result has the value of the integer path's,
// which also renormalizes the limbs; that renormalization would flush them here.
fn fp64_scale_fp64(value: vec2f, exponent: i32) -> vec2f {
#ifdef LUMA_FP64_INTEGER_ARITHMETIC
  return fp64_scale_fp64_integer(value, exponent);
#else
  let high = fp64_decode_raw_f32_bits(bitcast<u32>(value.x));
  let low = fp64_decode_raw_f32_bits(bitcast<u32>(value.y));
  var scaledHigh = value.x;
  if (!(high.isZero || high.isInf || high.isNan)) {
    scaledHigh = bitcast<f32>(
      fp64_make_f32_bits_from_u64(high.sign, vec2u(0u, high.significand), high.baseExponent + exponent)
    );
  }
  var scaledLow = value.y;
  if (!(low.isZero || low.isInf || low.isNan)) {
    scaledLow = bitcast<f32>(
      fp64_make_f32_bits_from_u64(low.sign, vec2u(0u, low.significand), low.baseExponent + exponent)
    );
  }
  return vec2f(scaledHigh, scaledLow);
#endif
}
#endif
`,fs:Z,vs:Z,defaultUniforms:{ONE:1,SPLIT:4097},uniformTypes:{ONE:"f32",SPLIT:"f32"},fp64ify:K,fp64LowPart:function(e){return e-Math.fround(e)},fp64ifyMatrix4:function(e){let t=new Float32Array(32);for(let i=0;i<4;++i)for(let r=0;r<4;++r){let n=4*i+r;K(e[4*r+i],t,2*n)}return t}};function ei(e){let{source:t,target:i,start:r=0,size:n,getData:s}=e,o=e.end||i.length,a=t.length,l=o-r;if(a>l)return void i.set(t.subarray(0,l),r);if(i.set(t,r),!s)return;let u=a;for(;u<l;){let e=s(u,t);for(let t=0;t<n;t++)i[r+u]=e[t]||0,u++}}function er(e){switch(e){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw Error(`No defined attribute type for size "${e}"`)}}function en(e){switch(e){case 1:return"float32";case 2:return"float32x2";case 3:return"float32x3";case 4:return"float32x4";default:throw Error("invalid type size")}}function es(e){e.push(e.shift())}function eo({device:e,source:t,target:i}){return(!i||i.byteLength<t.byteLength)&&(i?.destroy(),i=e.createBuffer({byteLength:t.byteLength,usage:t.usage})),i}function ea({device:e,buffer:t,attribute:i,fromLength:r,toLength:n,fromStartIndices:s,getData:o=e=>e}){let a=i.isDoublePrecisionBuffer?2:1,l=i.size*a,u=i.byteOffset,c=i.settings.bytesPerElement<4?u/i.settings.bytesPerElement*4:u,f=i.startIndices,d=s&&f,p=i.isConstant;if(!d&&t&&r>=n)return t;let h=i.value instanceof Float64Array?Float32Array:i.value.constructor,_=p?i.value:new h(i.getBuffer().readSyncWebGL(u,n*h.BYTES_PER_ELEMENT).buffer);if(i.settings.normalized&&!p){let e=o;o=(t,r)=>i.normalizeConstant(e(t,r))}let g=p?(e,t)=>o(_,t):(e,t)=>o(_.subarray(e,e+l),t),m=new Float32Array(t?t.readSyncWebGL(c,4*r).buffer:0),b=new Float32Array(n);return!function({source:e,target:t,size:i,getData:r,sourceStartIndices:n,targetStartIndices:s}){if(!n||!s)return ei({source:e,target:t,size:i,getData:r});let o=0,a=0,l=r&&((e,t)=>r(e+a,t)),u=Math.min(n.length,s.length);for(let r=1;r<u;r++){let u=n[r]*i,c=s[r]*i;ei({source:e.subarray(o,u),target:t,start:a,end:c,size:i,getData:l}),o=u,a=c}a<t.length&&ei({source:[],target:t,start:a,size:i,getData:l})}({source:m,target:b,sourceStartIndices:s,targetStartIndices:f,size:l,getData:g}),(!t||t.byteLength<b.byteLength+c)&&(t?.destroy(),t=e.createBuffer({byteLength:b.byteLength+c,usage:35050})),t.write(b,c),t}var el=i(2357);class eu{constructor({device:e,attribute:t,timeline:i}){this.buffers=[],this.currentLength=0,this.device=e,this.transition=new el.A(i),this.attribute=t,this.attributeInTransition=function(e){let{device:t,settings:i,value:r}=e,s=new n.A(t,i);return s.setData({value:r instanceof Float64Array?new Float64Array(0):new Float32Array(0),normalized:i.normalized}),s}(t),this.currentStartIndices=t.startIndices}get inProgress(){return this.transition.inProgress}start(e,t,i=1/0){this.settings=e,this.attributeInTransition.numInstances=this.attribute.numInstances,this.currentStartIndices=this.attribute.startIndices,this.currentLength=function(e,t){let{settings:i,value:r,size:n}=e,s=e.isDoublePrecisionBuffer?2:1,o=0,{shaderAttributes:a}=e.settings;if(a)for(let e of Object.values(a))o=Math.max(o,e.vertexOffset??0);return(i.noAlloc?r.length:(t+o)*n)*s}(this.attribute,t),this.transition.start({...e,duration:i})}update(){let e=this.transition.update();return e&&this.onUpdate(),e}setBuffer(e){let{stride:t}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:e,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:t})}cancel(){this.transition.cancel()}delete(){for(let e of(this.cancel(),this.buffers))e.destroy();this.buffers.length=0}}let ec={name:"interpolation",vs:`\
layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,uniformTypes:{time:"f32"}},ef=`\
#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,ed=`\
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
`;function ep(e){return e.isDoublePrecisionBuffer}let eh={name:"spring",vs:`\
layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,uniformTypes:{damping:"f32",stiffness:"f32"}},e_=`\
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
`,eg=`\
#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`,em={interpolation:class extends eu{constructor({device:e,attribute:t,timeline:i}){var r,n;let s,o,a,l;super({device:e,attribute:t,timeline:i}),this.type="interpolation",this.hasUpdated=!1,this.transform=(r=e,o=er(s=(n=t).size),a=en(s),l=n.getBufferLayout(),ep(n)?new X(r,{vs:ed,bufferLayout:[{name:"aFrom",byteStride:8*s,attributes:[{attribute:"aFrom",format:a,byteOffset:0},{attribute:"aFrom64Low",format:a,byteOffset:4*s}]},{name:"aTo",byteStride:8*s,attributes:[{attribute:"aTo",format:a,byteOffset:0},{attribute:"aTo64Low",format:a,byteOffset:4*s}]}],modules:[et,ec],defines:{ATTRIBUTE_TYPE:o,ATTRIBUTE_SIZE:s},moduleSettings:{},varyings:["vCurrent","vCurrent64Low"],bufferMode:35980,disableWarnings:!0}):new X(r,{vs:ef,bufferLayout:[{name:"aFrom",format:a},{name:"aTo",format:l.attributes[0].format}],modules:[ec],defines:{ATTRIBUTE_TYPE:o},varyings:["vCurrent"],disableWarnings:!0}))}start(e,t){let i=this.currentLength,r=this.currentStartIndices;if(super.start(e,t,e.duration),e.duration<=0)return void this.transition.cancel();let{buffers:n,attribute:s}=this;this.hasUpdated&&es(n),this.hasUpdated=!1,n[0]=ea({device:this.device,buffer:n[0],attribute:s,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:e.enter}),n[1]=eo({device:this.device,source:n[0],target:n[1]}),this.setBuffer(n[1]);let{transform:o}=this,a=o.model,l=Math.floor(this.currentLength/s.size);ep(s)&&(l/=2),a.setVertexCount(l),s.isConstant?(a.setAttributes({aFrom:n[0]}),a.setConstantAttributes({aTo:s.value})):a.setAttributes({aFrom:n[0],aTo:s.getBuffer()}),o.transformFeedback.setBuffers({vCurrent:n[1]})}onUpdate(){let{duration:e,easing:t}=this.settings,{time:i}=this.transition,r=i/e;t&&(r=t(r));let{model:n}=this.transform,s={time:r};n.shaderInputs.setProps({interpolation:s}),this.transform.run({discard:!0}),this.hasUpdated=!0}delete(){super.delete(),this.transform.destroy()}},spring:class extends eu{constructor({device:e,attribute:t,timeline:i}){var r,n,s,o;let a,l;super({device:e,attribute:t,timeline:i}),this.type="spring",this.texture=e.createTexture({data:new Uint8Array(4),format:"rgba8unorm",width:1,height:1}),this.framebuffer=(r=e,n=this.texture,r.createFramebuffer({id:"spring-transition-is-transitioning-framebuffer",width:1,height:1,colorAttachments:[n]})),this.transform=(s=e,a=er((o=t).size),new X(s,{vs:e_,fs:eg,bufferLayout:[{name:"aPrev",format:l=en(o.size)},{name:"aCur",format:l},{name:"aTo",format:o.getBufferLayout().attributes[0].format}],varyings:["vNext"],modules:[eh],defines:{ATTRIBUTE_TYPE:a},parameters:{depthCompare:"always",blendColorOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}}))}start(e,t){let i=this.currentLength,r=this.currentStartIndices;super.start(e,t);let{buffers:n,attribute:s}=this;for(let t=0;t<2;t++)n[t]=ea({device:this.device,buffer:n[t],attribute:s,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:e.enter});n[2]=eo({device:this.device,source:n[0],target:n[2]}),this.setBuffer(n[1]);let{model:o}=this.transform;o.setVertexCount(Math.floor(this.currentLength/s.size)),s.isConstant?o.setConstantAttributes({aTo:s.value}):o.setAttributes({aTo:s.getBuffer()})}onUpdate(){let{buffers:e,transform:t,framebuffer:i,transition:r}=this,n=this.settings;t.model.setAttributes({aPrev:e[0],aCur:e[1]}),t.transformFeedback.setBuffers({vNext:e[2]});let s={stiffness:n.stiffness,damping:n.damping};t.model.shaderInputs.setProps({spring:s}),t.run({framebuffer:i,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),es(e),this.setBuffer(e[1]),this.device.readPixelsToArrayWebGL(i)[0]>0||r.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}}};class eb{constructor(e,{id:t,timeline:i}){if(!e)throw Error("AttributeTransitionManager is constructed without device");this.id=t,this.device=e,this.timeline=i,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let e in this.transitions)this._removeTransition(e)}update({attributes:e,transitions:t,numInstances:i}){for(let r in this.numInstances=i||1,e){let i=e[r],n=i.getTransitionSetting(t);n&&this._updateAttribute(r,i,n)}for(let i in this.transitions){let r=e[i];r&&r.getTransitionSetting(t)||(this._removeTransition(i),r&&(r.setNeedsRedraw(),r.setLayoutChanged()))}}hasAttribute(e){let t=this.transitions[e];return t&&t.inProgress}getAttributes(){let e={};for(let t in this.transitions){let i=this.transitions[t];i.inProgress&&(e[t]=i.attributeInTransition)}return e}run(){if(0===this.numInstances)return!1;for(let e in this.transitions)this.transitions[e].update()&&(this.needsRedraw=!0);let e=this.needsRedraw;return this.needsRedraw=!1,e}_removeTransition(e){this.transitions[e].delete(),delete this.transitions[e]}_updateAttribute(e,t,i){let r=this.transitions[e],n=!r||r.type!==i.type;if(n){r&&this._removeTransition(e);let s=em[i.type];s?this.transitions[e]=new s({attribute:t,timeline:this.timeline,device:this.device}):(F.A.error(`unsupported transition type '${i.type}'`)(),n=!1)}(n||t.needsRedraw())&&(this.needsRedraw=!0,this.transitions[e].start(i,this.numInstances))}}let ev="attributeManager.invalidate";class ey{constructor(e,{id:t="attribute-manager",stats:i,timeline:r}={}){this.mergeBoundsMemoized=(0,D.A)(V._Z),this.id=t,this.device=e,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=i,this.attributeTransitionManager=new eb(e,{id:`${t}-transitions`,timeline:r}),this.attributeBufferGroups="webgpu"===e.type?new U(e,{id:t,isTransitionAttribute:e=>this.attributeTransitionManager.hasAttribute(e)}):null,Object.seal(this)}finalize(){for(let e in this.attributeBufferGroups?.finalize(),this.attributes)this.attributes[e].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(e={clearRedrawFlags:!1}){let t=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!e.clearRedrawFlags,t&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(e){this._add(e)}addInstanced(e){this._add(e,{stepMode:"instance"})}remove(e){for(let t of e)void 0!==this.attributes[t]&&(this.attributes[t].delete(),delete this.attributes[t])}invalidate(e,t){let i=this._invalidateTrigger(e,t);(0,G.A)(ev,this,e,i)}invalidateAll(e){for(let t in this.attributes)this.attributes[t].setNeedsUpdate(t,e);(0,G.A)(ev,this,"all")}update({data:e,numInstances:t,startIndices:i=null,transitions:r,props:n={},buffers:s={},context:o={}}){let a=!1;for(let r in(0,G.A)("attributeManager.updateStart",this),this.stats&&this.stats.get("Update Attributes").timeStart(),this.attributes){let l=this.attributes[r],u=l.settings.accessor;l.startIndices=i,l.numInstances=t,n[r]&&F.A.removed(`props.${r}`,`data.attributes.${r}`)(),l.setExternalBuffer(s[r])||l.setBinaryValue("string"==typeof u?s[u]:void 0,e.startIndices)||"string"==typeof u&&!s[u]&&l.setConstantValue(o,n[u])||l.needsUpdate()&&(a=!0,this._updateAttribute({attribute:l,numInstances:t,data:e,props:n,context:o})),this.needsRedraw=this.needsRedraw||l.needsRedraw()}a&&(0,G.A)("attributeManager.updateEnd",this,t),this.stats&&(this.stats.get("Update Attributes").timeEnd(),a&&this.stats.get("Attributes updated").incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:t,transitions:r})}updateTransition(){let{attributeTransitionManager:e}=this,t=e.run();return this.needsRedraw=this.needsRedraw||t,t}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getGPUVectors(e=this.getAttributes(),t){let i={};for(let t of Object.values(e))Object.assign(i,t.getGPUVector());if(t)for(let e of t.bufferLayouts){let r=t.buffers[e.name];r&&(i[e.name]=new M.M({type:"interleaved",name:e.name,buffer:r,length:t.length,byteStride:e.byteStride,attributes:e.attributes,ownsBuffer:!1}))}return i}getBounds(e){let t=e.map(e=>this.attributes[e]?.getBounds());return this.mergeBoundsMemoized(t)}getChangedAttributes(e={clearChangedFlags:!1}){let{attributes:t,attributeTransitionManager:i}=this,r={...i.getAttributes()};for(let n in t){let s=t[n];s.needsRedraw(e)&&!i.hasAttribute(n)&&(r[n]=s)}return r}getBufferLayouts(e){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),e):Object.values(this.getAttributes()).map(t=>t.getBufferLayout(e))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(e,t,i={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),e,t,i):{bufferLayouts:this.getBufferLayouts(t),buffers:{},groupedAttributeIds:new Set}}_add(e,t){for(let i in e){let r=e[i],s={...r,id:i,size:r.isIndexed&&1||r.size||1,...t};this.attributes[i]=new n.A(this.device,s)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let e={};for(let t in this.attributes)this.attributes[t].getUpdateTriggers().forEach(i=>{e[i]||(e[i]=[]),e[i].push(t)});this.updateTriggers=e}_invalidateTrigger(e,t){let{attributes:i,updateTriggers:r}=this,n=r[e];return n&&n.forEach(e=>{let r=i[e];r&&r.setNeedsUpdate(r.id,t)}),n}_updateAttribute(e){let{attribute:t,numInstances:i}=e;((0,G.A)("attribute.updateStart",t),t.constant)?t.setConstantValue(e.context,t.value):(t.allocate(i)&&(0,G.A)("attribute.allocate",t,i),t.updateBuffer(e)&&(this.needsRedraw=!0,(0,G.A)("attribute.updateEnd",t,i)))}}},35204(e,t,i){i.d(t,{A:()=>y});var r=i(8994),n=i(1069),s=i(23459),o=i(25667),a=i(68996);function l(e,t){t.offset&&a.A.removed("shaderAttribute.offset","vertexOffset, elementOffset")();let i=(0,n.m$)(e),r=(void 0!==t.vertexOffset?t.vertexOffset:e.vertexOffset||0)*i+(t.elementOffset||0)*e.bytesPerElement+(e.offset||0);return{...t,offset:r,stride:i}}class u{constructor(e,t,i){let r;this._buffer=null,this.device=e,this.id=t.id||"",this.size=t.size||1;let s=t.logicalType||t.type,o="float64"===s,{defaultValue:a}=t;a=Number.isFinite(a)?[a]:a||Array(this.size).fill(0),r=o?"float32":!s&&t.isIndexed?"uint32":s||"float32";let l=(0,n.ol)(s||r);this.doublePrecision=o,o&&!1===t.fp64&&(l=Float32Array),this.value=null,this.settings={...t,defaultType:l,defaultValue:a,logicalType:s,type:r,normalized:r.includes("norm"),size:this.size,bytesPerElement:l.BYTES_PER_ELEMENT},this.state={...i,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let e=this.getAccessor();return e.vertexOffset?e.vertexOffset*(0,n.m$)(e):0}get numInstances(){return this.state.numInstances}set numInstances(e){this.state.numInstances=e}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&(this._buffer.delete(),this._buffer=null),s.A.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&"webgpu"!==this.device.type?null:this.state.externalBuffer||this._buffer}getValue(e=this.id,t=null){let i={};if(this.state.constant){let r=this.value;if("webgpu"===this.device.type&&this._buffer)i[e]=this._buffer;else if(t){let n=l(this.getAccessor(),t),s=n.offset/r.BYTES_PER_ELEMENT,o=n.size||this.size;i[e]=r.subarray(s,s+o)}else i[e]=r}else i[e]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?i[`${e}64Low`]=i[e]:i[`${e}64Low`]=new Float32Array(this.size)),i}_getBufferLayout(e=this.id,t=null){let i=this.getAccessor(),r=[],s={name:this.id,byteStride:"webgpu"===this.device.type&&this.state.constant?0:(0,n.m$)(i)};if(this.doublePrecision){let s,o={high:s=l(i,t||{}),low:{...s,offset:s.offset+4*i.size}};r.push((0,n.bj)(e,{...i,...o.high},this.device.type),(0,n.bj)(`${e}64Low`,{...i,...o.low},this.device.type))}else if(t){let s=l(i,t);r.push((0,n.bj)(e,{...i,...s},this.device.type))}else r.push((0,n.bj)(e,i,this.device.type));return s.attributes=r.filter(Boolean),s}setAccessor(e){this.state.bufferAccessor=e}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let e=null;if(this.state.constant&&this.value){let t=Array.from(this.value);e=[t,t]}else{let{value:t,numInstances:i,size:r}=this,n=i*r;if(t&&n&&t.length>=n){let i=Array(r).fill(1/0),s=Array(r).fill(-1/0);for(let e=0;e<n;)for(let n=0;n<r;n++){let r=t[e++];r<i[n]&&(i[n]=r),r>s[n]&&(s[n]=r)}e=[i,s]}}return this.state.bounds=e,e}setData(e){let t,{state:i}=this;t=ArrayBuffer.isView(e)?{value:e}:e instanceof r.h?{buffer:e}:e;let s={...this.settings,...t};if(ArrayBuffer.isView(t.value)){if(!t.type)if(this.doublePrecision&&t.value instanceof Float64Array)s.type="float32";else{let e=(0,n.Y5)(t.value);s.type=s.normalized?e.replace("int","norm"):e}s.bytesPerElement=t.value.BYTES_PER_ELEMENT,s.stride=(0,n.m$)(s)}if(i.bounds=null,t.constant){let e=t.value;if(e=this._normalizeValue(e,[],0),this.settings.normalized&&(e=this.normalizeConstant(e)),!(!i.constant||!this._areValuesEqual(e,this.value)))return!1;i.externalBuffer=null,i.constant=!0,this.value=ArrayBuffer.isView(e)?e:new Float32Array(e)}else if(t.buffer)i.externalBuffer=t.buffer,i.constant=!1,this.value=t.value||null;else if(t.value){this._checkExternalBuffer(t);let e=t.value,r=e;i.externalBuffer=null,i.constant=!1,this.value=e,this._shouldSplitDoublePrecisionValue(r)&&(r=(0,o.cT)(r,s),e instanceof Float32Array&&(s.stride=2*s.size*Float32Array.BYTES_PER_ELEMENT));let{buffer:a}=this,l=(0,n.m$)(s),u=(s.vertexOffset||0)*l;if(this.settings.isIndexed){let e=this.settings.defaultType;r.constructor!==e&&(r=new e(r))}let c=r.byteLength+u+2*l;(!a||a.byteLength<c)&&(a=this._createBuffer(c)),a.write(r,u)}return this.setAccessor(s),!0}updateSubBuffer(e={}){this.state.bounds=null;let t=this.value,{startOffset:i=0,endOffset:r}=e,n=this._shouldSplitDoublePrecisionValue(t);this.buffer.write(n?(0,o.cT)(t,{size:this.size,startIndex:i,endIndex:r}):t.subarray(i,r),i*(n?8:t.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(e,t=!1){let{state:i}=this,r=i.allocatedValue,n=s.A.allocate(r,e+1,{size:this.size,type:this.settings.defaultType,copy:t});this.value=n;let a=this._shouldSplitDoublePrecisionValue(n),l=a&&n instanceof Float32Array?{...this.settings,stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(l);let{byteOffset:u}=this,{buffer:c}=this,f=n.byteLength*(a&&n instanceof Float32Array?2:1);return(!c||c.byteLength<f+u)&&(c=this._createBuffer(f+u),t&&r&&c.write(this._shouldSplitDoublePrecisionValue(r)?(0,o.cT)(r,this):r,u)),i.allocatedValue=n,i.constant=!1,i.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(e){return!!(this.doublePrecision&&(e instanceof Float64Array||"webgpu"===this.device.type&&e instanceof Float32Array))}_checkExternalBuffer(e){let{value:t}=e;if(!ArrayBuffer.isView(t))throw Error(`Attribute ${this.id} value is not TypedArray`);let i=this.settings.defaultType,r=!1;if(this.doublePrecision&&(r=t.BYTES_PER_ELEMENT<4),r)throw Error(`Attribute ${this.id} does not support ${t.constructor.name}`);t instanceof i||!this.settings.normalized||"normalized"in e||a.A.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(e){switch(this.settings.type){case"snorm8":return new Float32Array(e).map(e=>(e+128)/255*2-1);case"snorm16":return new Float32Array(e).map(e=>(e+32768)/65535*2-1);case"unorm8":return new Float32Array(e).map(e=>e/255);case"unorm16":return new Float32Array(e).map(e=>e/65535);default:return e}}_normalizeValue(e,t,i){let{defaultValue:r,size:n}=this.settings;if(Number.isFinite(e))return t[i]=e,t;if(!e){let e=n;for(;--e>=0;)t[i+e]=r[e];return t}switch(n){case 4:t[i+3]=Number.isFinite(e[3])?e[3]:r[3];case 3:t[i+2]=Number.isFinite(e[2])?e[2]:r[2];case 2:t[i+1]=Number.isFinite(e[1])?e[1]:r[1];case 1:t[i+0]=Number.isFinite(e[0])?e[0]:r[0];break;default:let s=n;for(;--s>=0;)t[i+s]=Number.isFinite(e[s])?e[s]:r[s]}return t}_areValuesEqual(e,t){if(!e||!t)return!1;let{size:i}=this;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}_createBuffer(e){this._buffer&&this._buffer.destroy();let{isIndexed:t,type:i}=this.settings,n="webgpu"!==this.device.type||t?(t?r.h.INDEX:r.h.VERTEX)|r.h.COPY_DST:r.h.VERTEX|r.h.STORAGE|r.h.COPY_DST|r.h.COPY_SRC;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:n,indexType:t?i:void 0,byteLength:e}),this._buffer}}var c=i(24067),f=i(53439),d=i(38055);let p=[],h=[[0,1/0]];var _=i(8199),g=i(72246),m=i(51002),b=i(35098),v=i(61439);class y extends u{constructor(e,t){super(e,t,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:h}),this.constant=!1,this.settings.update=t.update||(t.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(e){this.state.startIndices=e}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:e=!1}={}){let t=this.state.needsRedraw;return this.state.needsRedraw=t&&!e,t}layoutChanged(){return this.state.layoutChanged}setLayoutChanged(){this.state.layoutChanged=!0}setAccessor(e){var t;(t=this.state).layoutChanged||(t.layoutChanged=!(0,n.Lk)(e,this.getAccessor())),super.setAccessor(e)}getUpdateTriggers(){let{accessor:e}=this.settings;return[this.id].concat("function"!=typeof e&&e||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(e){if(!e||!this.supportsTransition())return null;let{accessor:t}=this.settings,i=this.settings.transition,r=Array.isArray(t)?e[t.find(t=>e[t])]:e[t];return(0,_.K)(r,i)}setNeedsUpdate(e=this.id,t){if(this.state.needsUpdate=this.state.needsUpdate||e,this.setNeedsRedraw(e),t){let{startRow:e=0,endRow:i=1/0}=t;this.state.updateRanges=function(e,t){if(e===h||(t[0]<0&&(t[0]=0),t[0]>=t[1]))return e;let i=[],r=e.length,n=0;for(let s=0;s<r;s++){let r=e[s];r[1]<t[0]?(i.push(r),n=s+1):r[0]>t[1]?i.push(r):t=[Math.min(r[0],t[0]),Math.max(r[1],t[1])]}return i.splice(n,0,t),i}(this.state.updateRanges,[e,i])}else this.state.updateRanges=h}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=p}setNeedsRedraw(e=this.id){this.state.needsRedraw=this.state.needsRedraw||e}allocate(e){let{state:t,settings:i}=this;if(i.noAlloc)return!1;if(i.update){let i=this.isConstant;return super.allocate(e,t.updateRanges!==h),t.layoutChanged||(t.layoutChanged=i&&"webgpu"===this.device.type),!0}return!1}updateBuffer({numInstances:e,data:t,props:i,context:r}){if(!this.needsUpdate())return!1;let{state:{updateRanges:n},settings:{update:s,noAlloc:o}}=this,a=!0;if(s){for(let[o,a]of n)s.call(r,this,{data:t,startRow:o,endRow:a,props:i,numInstances:e});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let e=this.value;this.value=null,this.setConstantValue(r,e)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[t,i]of n){let r=Number.isFinite(t)?this.getVertexOffset(t):0,n=Number.isFinite(i)?this.getVertexOffset(i):o||!Number.isFinite(e)?this.value.length:e*this.size;super.updateSubBuffer({startOffset:r,endOffset:n})}this._checkAttributeArray()}else a=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),a}setConstantValue(e,t){if(void 0===t||"function"==typeof t)return!1;let i=this.settings.transform&&e?this.settings.transform.call(e,t):t;return this.setData({constant:!0,value:i}),!0}setData(e){var t,i;let n=this.isConstant;if(ArrayBuffer.isView(e)||e instanceof r.h||!e.constant){let i=super.setData(e);return this.state.constantValue=null,(t=this.state).layoutChanged||(t.layoutChanged=n&&"webgpu"===this.device.type),i}let s=this.settings.defaultType;this.state.constantValue=this._normalizeValue(e.value,new s(this.size),0);let a=super.setData(e);if("webgpu"===this.device.type){let e=this.state.constantValue;this.doublePrecision&&(e instanceof Float32Array||e instanceof Float64Array)&&(e=(0,o.cT)(e,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}));let t=this._buffer;(!t||t.byteLength<e.byteLength)&&(t=this._createBuffer(e.byteLength)),t.write(e),(i=this.state).layoutChanged||(i.layoutChanged=!n),this.constant=!1}return a&&this.setNeedsRedraw(),this.clearNeedsUpdate(),a}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(e){let{state:t}=this;return e?(this.clearNeedsUpdate(),t.lastExternalBuffer===e||(t.lastExternalBuffer=e,this.setNeedsRedraw(),this.setData(e),!0)):(t.lastExternalBuffer=null,!1)}setBinaryValue(e,t=null){let{state:i,settings:n}=this;if(!e)return i.binaryValue=null,i.binaryAccessor=null,!1;if(n.noAlloc)return!1;if(e instanceof m.M&&(0,c.A)(e.length>=this.numInstances,"GPUVector attribute is shorter than the draw count"),i.binaryValue===e&&!(n.transform&&this.needsUpdate()))return this.clearNeedsUpdate(),!0;if(i.binaryValue=e,this.setNeedsRedraw(),e instanceof m.M){if(!e.format)throw Error("GPUVector attributes require a format");let t=(0,b.Ft)(e.format),i=t.type;if("float16"===i)throw Error("GPUVector float16 attributes are not supported");(0,c.A)(!t.vertexList&&!t.valueList,"GPUVector attributes require fixed-width values");let n=function(e){let[t,...i]=e.data;if(!t||i.length>0)throw Error(`GPUVector "${e.name}" requires exactly one GPUData chunk`);return t}(e);(0,c.A)(n.buffer instanceof r.h,"GPUVector attributes require a concrete Buffer"),e={buffer:n.buffer,type:i,size:t.components,offset:n.byteOffset,stride:n.byteStride}}if(n.transform||t!==this.startIndices){ArrayBuffer.isView(e)&&(e={value:e});let r=e;(0,c.A)(ArrayBuffer.isView(r.value),`invalid ${n.accessor}`);let s=!!r.size&&r.size!==this.size;return i.binaryAccessor=(0,f.I)(r.value,{size:r.size||this.size,stride:r.stride,offset:r.offset,startIndices:t,nested:s}),!1}return this.clearNeedsUpdate(),this.setData(e),!0}getVertexOffset(e){let{startIndices:t}=this;return(t?e<t.length?t[e]:this.numInstances:e)*this.size}getValue(){let e=this.settings.shaderAttributes,t=super.getValue();if(!e)return t;for(let i in e)Object.assign(t,super.getValue(i,e[i]));return t}getGPUVector(){if(!this.isConstant&&!this.getBuffer())return{};let e=this._getShaderBufferLayout(),t=this.getValue(),i={},n=this.getConstantValue();for(let s of(this.doublePrecision&&(n instanceof Float32Array||n instanceof Float64Array)&&(n="webgpu"===this.device.type?(0,o.cT)(n,{size:this.size}):new Float32Array([...this.value,...new Float32Array(this.size)])),e.attributes||[])){let o=s.attribute,a=t[o],l=(0,b.Ft)(s.format);if(this.isConstant&&n){let e=(0,g.Y0)(l.type),t=(s.byteOffset||0)/n.BYTES_PER_ELEMENT;i[o]=new v.z({format:s.format,value:new e(n.subarray(t,t+l.components))})}else a instanceof r.h?i[o]=new m.M({type:"buffer",name:o,buffer:a,format:s.format,length:this.numInstances,byteOffset:s.byteOffset||0,byteStride:e.byteStride,ownsBuffer:!1}):a&&(i[o]=new v.z({format:s.format,value:new((0,g.Y0)(l.type))(a).subarray(0,l.components)}))}return i}getBufferLayout(e){return this.state.layoutChanged=!1,this._getShaderBufferLayout(e)}_getShaderBufferLayout(e){let t=this.settings.shaderAttributes,i=super._getBufferLayout(),{stepMode:r}=this.settings;if("dynamic"===r?i.stepMode=e?e.isInstanced?"instance":"vertex":"instance":i.stepMode=r??"vertex",!t)return i;for(let e in t){let r=super._getBufferLayout(e,t[e]);i.attributes.push(...r.attributes)}return i}_autoUpdater(e,{data:t,startRow:i,endRow:r,props:n,numInstances:s}){let{settings:o,state:a,value:l,size:u,startIndices:p}=e,{accessor:h,transform:_}=o,g=a.binaryAccessor||("function"==typeof h?h:n[h]);(0,c.A)("function"==typeof g,`accessor "${h}" is not a function`);let m=e.getVertexOffset(i),{iterable:b,objectInfo:v}=(0,f.X)(t,i,r);for(let t of b){v.index++;let i=g(t,v);if(_&&(i=_.call(this,i)),p){let t=(v.index<p.length-1?p[v.index+1]:s)-p[v.index];if(i&&Array.isArray(i[0])){let t=m;for(let r of i)e._normalizeValue(r,l,t),t+=u}else i&&i.length>u?l.set(i,m):(e._normalizeValue(i,v.target,0),(0,d.R)({target:l,source:v.target,start:m,count:t}));m+=t*u}else e._normalizeValue(i,l,m),m+=u}}_validateAttributeUpdaters(){let{settings:e}=this;if(!(e.noAlloc||"function"==typeof e.update))throw Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:e}=this,t=Math.min(4,this.size);if(e&&e.length>=t){let i=!0;switch(t){case 4:i=i&&Number.isFinite(e[3]);case 3:i=i&&Number.isFinite(e[2]);case 2:i=i&&Number.isFinite(e[1]);case 1:i=i&&Number.isFinite(e[0]);break;default:i=!1}if(!i)throw Error(`Illegal attribute generated for ${this.id}`)}}}},1069(e,t,i){i.d(t,{Lk:()=>u,Y5:()=>o,bj:()=>a,m$:()=>l,ol:()=>s});var r=i(72246),n=i(57285);function s(e){switch(e){case"float64":return Float64Array;case"uint8":case"unorm8":return Uint8ClampedArray;default:return(0,r.Ak)(e)}}let o=n.r.getDataType.bind(n.r);function a(e,t,i){if(t.size>4)return null;let r="webgpu"===i&&"uint8"===t.type?"unorm8":t.type,n=t.size,s=!!("webgpu"!==i&&3===n&&r&&["uint8","sint8","unorm8","snorm8","uint16","sint16","unorm16","snorm16"].includes(r));return{attribute:e,format:n>1?`${r}x${n}${s?"-webgl":""}`:t.type,byteOffset:t.offset||0}}function l(e){return e.stride||e.size*e.bytesPerElement}function u(e,t){return e.type===t.type&&e.size===t.size&&l(e)===l(t)&&(e.offset||0)===(t.offset||0)}},8199(e,t,i){i.d(t,{K:()=>n});let r={interpolation:{duration:0,easing:e=>e},spring:{stiffness:.05,damping:.5}};function n(e,t){if(!e)return null;Number.isFinite(e)&&(e={type:"interpolation",duration:e});let i=e.type||"interpolation";return{...r[i],...t,...e,type:i}}},9350(e,t,i){i.d(t,{We:()=>o,p5:()=>n,qR:()=>a,tg:()=>s});var r=i(92767);let n={common:0,meters:1,pixels:2},s={click:"onClick",dblclick:"onClick",panstart:"onDragStart",panmove:"onDrag",panend:"onDragEnd"},o={multipan:[r.uq,{threshold:10,pointers:2,trackpad:!0}],pinch:[r.h1,{trackpad:!0},null,["multipan"]],pan:[r.uq,{threshold:1},["pinch"],["multipan"]],dblclick:[r.Cx,{event:"dblclick",taps:2,enable:!1}],dblclickdrag:[r.Cp,{event:"dblclickdrag",enable:!1},["dblclick"],null],click:[r.Cx,{event:"click"},["dblclickdrag"],["dblclick","dblclickdrag"]]},a={DRAW:"draw",MASK:"mask",TERRAIN:"terrain"}},66260(e,t,i){i.d(t,{A:()=>q});var r=i(8994),n=i(33789),s=i(88203),o=i(15465),a=i(6903),l=i(88599),u=i(8199),c=i(31609),f=i(2357);class d extends f.A{get value(){return this._value}_onUpdate(){let{time:e,settings:{fromValue:t,toValue:i,duration:r,easing:n}}=this,s=n(e/r);this._value=(0,c.Cc)(t,i,s)}}function p(e,t,i,r,n){let s=t-e;return(i-t)*n+-s*r+s+t}function h(e,t){if(Array.isArray(e)){let i=0;for(let r=0;r<e.length;r++){let n=e[r]-t[r];i+=n*n}return Math.sqrt(i)}return Math.abs(e-t)}class _ extends f.A{get value(){return this._currValue}_onUpdate(){let{fromValue:e,toValue:t,damping:i,stiffness:r}=this.settings,{_prevValue:n=e,_currValue:s=e}=this,o=function(e,t,i,r,n){if(Array.isArray(i)){let s=[];for(let o=0;o<i.length;o++)s[o]=p(e[o],t[o],i[o],r,n);return s}return p(e,t,i,r,n)}(n,s,t,i,r),a=h(o,t),l=h(o,s);a<1e-5&&l<1e-5&&(o=t,this.end()),this._prevValue=s,this._currValue=o}}var g=i(68996);let m={interpolation:d,spring:_};class b{constructor(e){this.transitions=new Map,this.timeline=e}get active(){return this.transitions.size>0}add(e,t,i,r){let{transitions:n}=this;if(n.has(e)){let i=n.get(e),{value:r=i.settings.fromValue}=i;t=r,this.remove(e)}if(!(r=(0,u.K)(r)))return;let s=m[r.type];if(!s)return void g.A.error(`unsupported transition type '${r.type}'`)();let o=new s(this.timeline);o.start({...r,fromValue:t,toValue:i}),n.set(e,o)}remove(e){let{transitions:t}=this;t.has(e)&&(t.get(e).cancel(),t.delete(e))}update(){let e={};for(let[t,i]of this.transitions)i.update(),e[t]=i.value,i.inProgress||this.remove(t);return e}clear(){for(let e of this.transitions.keys())this.remove(e)}}var v=i(12294),y=i(12897),E=i(10062),w=i(43411),x=i(24067),P=i(82417),S=i(7914),T=i(66540),O=i(63400),A=i(23459),I=i(19754),B=i(72068),L=i(68767),M=i(97625),C=i(71651);class j extends C.A{constructor({attributeManager:e,layer:t}){super(t),this.sourceCrs=null,this.packedCrs=null,this.preproject=null,this.unpreproject=null,this.preprojectionSignature=null,this.preprojectionChanged=!1,this.tessellationSignature=null,this.attributeManager=e,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}_fetch(e,t){let i=this.layer,r=i?.props.fetch;return r?r(t,{propName:e,layer:i}):super._fetch(e,t)}_onResolve(e,t){let i=this.layer;if(i){let r=i.props.onDataLoad;"data"===e&&r&&r(t,{propName:e,layer:i})}}_onError(e,t){let i=this.layer;i&&i.raiseError(t,`loading ${e} of ${this.layer}`)}}var z=i(67681),R=i(29527),U=i(58682),N=i(60275);let k=Object.freeze([]),F=(0,P.A)(({oldViewport:e,viewport:t})=>e.equals(t)),D=new Uint8ClampedArray(0);function V(e){return e.rowIndexes||e.pickingColors||e.instancePickingColors}function G(e){return e.rowIndexes}function $(e){return e.pickingColors||e.instancePickingColors}let Y={data:{type:"data",value:k,async:!0},dataComparator:{type:"function",value:null,optional:!0},_dataDiff:{type:"function",value:e=>e&&e.__diff,optional:!0},dataTransform:{type:"function",value:null,optional:!0},onDataLoad:{type:"function",value:null,optional:!0},onError:{type:"function",value:null,optional:!0},fetch:{type:"function",value:(e,{propName:t,layer:i,loaders:r,loadOptions:n,signal:s})=>{let{resourceManager:o}=i.context;n=n||i.getLoadOptions(),r=r||i.props.loaders,s&&(n={...n,core:{...n?.core,fetch:{...n?.core?.fetch,signal:s}}});let a=o.contains(e);return(a||n||(o.add({resourceId:e,data:(0,U.H)(e,r),persistent:!1}),a=!0),a)?o.subscribe({resourceId:e,onChange:e=>i.internalState?.reloadAsyncProp(t,e),consumerId:i.id,requestId:t}):(0,U.H)(e,r,n)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:"number",min:0,max:1,value:1},operation:"draw",onHover:{type:"function",value:null,optional:!0},onClick:{type:"function",value:null,optional:!0},onDragStart:{type:"function",value:null,optional:!0},onDrag:{type:"function",value:null,optional:!0},onDragEnd:{type:"function",value:null,optional:!0},coordinateSystem:{type:"object",value:"default",validate:e=>"string"==typeof e||!!e&&"object"==typeof e,equal:L.vk},coordinateOrigin:{type:"array",value:[0,0,0],compare:!0},modelMatrix:{type:"array",value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:"XYZ",colorFormat:"RGBA",parameters:{type:"object",value:{},optional:!0,compare:2},loadOptions:{type:"object",value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:"array",value:[],optional:!0,ignore:!0},getPolygonOffset:{type:"function",value:({layerIndex:e})=>[0,-(100*e)]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:"accessor",value:[0,0,128,128]}};class W extends B.A{constructor(){super(...arguments),this.internalState=null,this.lifecycle=y.VD.NO_STATE,this._coordinateSystemLoading=!1,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,"layerName")?this.layerName:""}get root(){let e=this;for(;e.parent;)e=e.parent;return e}toString(){let e=this.constructor.layerName||this.constructor.name;return`${e}({id: '${this.props.id}'})`}project(e){(0,x.A)(this.internalState);let t=this.internalState.viewport||this.context.viewport,i=this.projectPosition(e,{autoOffset:!1}),[r,n,s]=(0,z.VJ)(i,t.pixelProjectionMatrix);return 2===e.length?[r,n]:[r,n,s]}unproject(e){return(0,x.A)(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(e)}projectPosition(e,t={}){(0,x.A)(this.internalState);let{viewport:i=this.internalState.viewport||this.context.viewport,sourceCrs:r=this.internalState.sourceCrs,coordinateSystem:n=t.sourceCrs?.signature??this.props.coordinateSystem,modelMatrix:s=this.props.modelMatrix,coordinateOrigin:o=this.props.coordinateOrigin,autoOffset:a}=t;return(0,O.R)(e,{viewport:i,sourceCrs:r,coordinateSystem:n,modelMatrix:s,coordinateOrigin:o,autoOffset:a})}get isComposite(){return!1}get isDrawable(){return!0}setState(e){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,e),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return!!this.internalState&&!this._coordinateSystemLoading&&!this.internalState.isAsyncPropLoading()}get isCoordinateSystemLoaded(){return!this._coordinateSystemLoading}_setSourceCrs(e){this._coordinateSystemLoading=void 0===e,void 0!==e&&(this._sourceCrs=e,this.internalState&&(this.internalState.sourceCrs=e,this._updatePreprojection(this.internalState.viewport||this.context.viewport)))}_updatePreprojection(e){let t=this.internalState,i=!(0,M.eN)(e.projectionMode,t.sourceCrs,e.crs),r=JSON.stringify([t.sourceCrs?.signature,i?e.projectionMode===N.K.CUSTOM_GEOSPATIAL?e.crs?.signature:"WGS84":null]),n=t.preprojectionSignature!==r;n&&(Object.assign(t,e.getPreprojection(t.sourceCrs)),t.preprojectionSignature=r,t.preprojectionChanged=!0);let s=JSON.stringify([e.crs?.signature,e.projectionSignature]),o=t.tessellationSignature!==s;return t.tessellationSignature=s,Object.assign(this.state,{sourceCrs:t.sourceCrs,packedCrs:t.packedCrs,preproject:t.preproject,unpreproject:t.unpreproject}),(n||o)&&t.changeFlags&&this.setChangeFlags({projectionChanged:!0}),n||o}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let e=this.state;return e&&(e.models||e.model&&[e.model])||[]}setShaderModuleProps(...e){for(let t of this.getModels())t.shaderInputs.setProps(...e)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}usePositionTransforms(){return{transformSource:"projection",transform:this.internalState?.preproject?H:null}}getSubdivisionStep(){let e=this.internalState?.sourceCrs;if(!e)return 0;let t=this.context.viewport.getSubdivisionStep(e),{modelMatrix:i}=this.props;if(!t||!i)return t;let r=Math.max(Math.hypot(i[0],i[1],i[2]),Math.hypot(i[4],i[5],i[6]));return r>0?t/r:0}use64bitPositions(){let{coordinateSystem:e}=this.props;return!!this.internalState?.sourceCrs||this.context?.viewport?.projectionMode===N.K.CUSTOM_GEOSPATIAL||"default"===e||"lnglat"===e||"cartesian"===e}onHover(e,t){return!!this.props.onHover&&(this.props.onHover(e,t)||!1)}onClick(e,t){return!!this.props.onClick&&(this.props.onClick(e,t)||!1)}nullPickingColor(){return[0,0,0]}encodePickingColor(e,t=[]){return t[0]=e+1&255,t[1]=e+1>>8&255,t[2]=e+1>>8>>8&255,t}decodePickingColor(e){(0,x.A)(e instanceof Uint8Array);let[t,i,r]=e;return t+256*i+65536*r-1}getNumInstances(){return Number.isFinite(this.props.numInstances)?this.props.numInstances:this.state&&void 0!==this.state.numInstances?this.state.numInstances:(0,E.U)(this.props.data)}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds(["positions","instancePositions"])}resolveColumns(e,t=!1){return(0,o.S)(this.props,e,t)}getShaders(e){for(let t of(e=(0,T.n)({defines:{USE_EXTERNAL_PROJECTION:this.context.viewport.projectionMode===N.K.CUSTOM_GEOSPATIAL}},e),e.modules?.includes(I.Ay)&&!e.plugins?.includes(I.lT)&&(e=(0,T.n)(e,{plugins:[I.lT]})),e=(0,T.n)(e,{disableWarnings:!0,modules:this.context.defaultShaderModules,plugins:this.context.defaultShaderPlugins}),this.props.extensions))e=(0,T.n)(e,t.getShaders.call(this,t));return{...e,shaderAssembler:this.context.shaderAssembler}}shouldUpdateState(e){return e.changeFlags.propsOrDataChanged}updateState(e){let t=this.getAttributeManager(),{dataChanged:i}=e.changeFlags;if(i&&t)if(Array.isArray(i))for(let e of i)t.invalidateAll(e);else t.invalidateAll();if(t){let{props:i}=e,r=this.internalState.hasPickingBuffer,n=Number.isInteger(i.highlightedObjectIndex)||!!i.pickable||i.extensions.some(e=>e.getNeedsPickingBuffer.call(this,e));if(r!==n){this.internalState.hasPickingBuffer=n;let e=V(t.attributes);e&&(n&&e.constant&&(e.constant=!1,t.invalidate(e.id)),e.value||n||(e.constant=!0,e.value=G(t.attributes)?[I.Z1]:[0,0,0]))}}}finalizeState(e){for(let e of this.getModels())e.destroy();let t=this.getAttributeManager();t&&t.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(e){for(let t of this.getModels())t.draw(e.renderPass)}getPickingInfo({info:e,mode:t,sourceLayer:i}){let{index:r}=e;return r>=0&&(Array.isArray(this.props.data)?e.object=this.props.data[r]:(0,s._)(this.props.data)&&(e.object=this.props.data.get(r))),e}raiseError(e,t){t&&(e=Error(`${t}: ${e.message}`,{cause:e})),this.props.onError?.(e)||this.context?.onError?.(e,this)}getNeedsRedraw(e={clearRedrawFlags:!1}){return this._getNeedsRedraw(e)}needsUpdate(){return!!this.internalState&&(this.internalState.needsUpdate||this.internalState.changeFlags.projectionChanged||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()))}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(e){if(!this.internalState||!this.context.layerManager.isViewportReady(this))return;let t=this.internalState.viewport;if(this.internalState.viewport=e,this._coordinateSystemLoading)return;let i=this._updatePreprojection(e);t&&F({oldViewport:t,viewport:e})||(this.setChangeFlags({viewportChanged:!0,projectionChanged:i}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(e="all"){let t=this.getAttributeManager();t&&("all"===e?t.invalidateAll():t.invalidate(e))}updateAttributes(e){let t=!1;for(let i in e)e[i].layoutChanged()&&(t=!0);let i=this.getAttributeManager(),r=!!i?.hasBufferGroups();for(let n of(r&&i.getBufferGroupBindings(e),this.getModels()))this._setModelAttributes(n,e,t,r)}_updateAttributes(){let e=this.getAttributeManager();if(!e)return;let t=this.props,i=this.getNumInstances(),r=this.getStartIndices();e.update({data:t.data,numInstances:i,startIndices:r,props:t,transitions:t.transitions,buffers:t.data.attributes,context:this});let n=e.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(n)}_updateAttributeTransition(){let e=this.getAttributeManager();e&&e.updateTransition()}_updateUniformTransition(){let{uniformTransitions:e}=this.internalState;if(e.active){let t=e.update(),i=Object.create(this.props);for(let e in t)Object.defineProperty(i,e,{value:t[e]});return i}return this.props}calculateInstancePickingColors(e,{numInstances:t}){if(e.constant)return;let i=Math.floor(D.length/4);this.internalState.usesPickingColorCache=!0;let r=t>0&&0===D[0];if(i<t||r){t>0xffffff&&g.A.warn("Layer has too many data objects. Picking might not be able to distinguish all objects.")();let e=Math.floor((D=A.A.allocate(D,t,{size:4,copy:!0,maxCount:Math.max(t,0xffffff)})).length/4),n=[0,0,0],s=r?0:i;for(let t=s;t<e;t++)this.encodePickingColor(t,n),D[4*t+0]=n[0],D[4*t+1]=n[1],D[4*t+2]=n[2],D[4*t+3]=0}e.value=D.subarray(0,4*t)}_setGPUVectorModelAttributes(e,t,i){let r,n=e.userData?.excludeAttributes||{},s=t.getBufferGroupBindings(i,e,n),o={...t.getAttributes()};for(let e in o)n[e]||s.groupedAttributeIds.has(e)?delete o[e]:o[e].settings.isIndexed&&(r=o[e].getBuffer(),delete o[e]);let a=t.getGPUVectors(o,{...s,length:this.getNumInstances()});e.setGPUAttributes(a,s.bufferLayouts),void 0!==r&&e.setIndexBuffer(r)}_setModelAttributes(e,t,i=!1,n=!1){if(!Object.keys(t).length)return;let s=this.getAttributeManager(),o=n?{}:t;if(e instanceof l.A&&s)return void this._setGPUVectorModelAttributes(e,s,o);if(s?.hasBufferGroups())return void this._setGroupedModelAttributes(e,s,o);if(i){let i=this.getAttributeManager();e.setBufferLayout(i.getBufferLayouts(e)),t=i.getAttributes()}let a=e.userData?.excludeAttributes||{},u={},c={};for(let i in t){if(a[i])continue;let n=t[i].getValue();for(let s in n){let o=n[s];o instanceof r.h?t[i].settings.isIndexed?e.setIndexBuffer(o):u[s]=o:o&&(c[s]=o)}}e.setAttributes(u),e.setConstantAttributes(c)}_setGroupedModelAttributes(e,t,i){let n=e.userData?.excludeAttributes||{},s=t.getBufferGroupBindings(i,e,n);e.setBufferLayout(s.bufferLayouts);let o={...s.buffers},a={},l=t.getAttributes();for(let t in l){if(n[t]||s.groupedAttributeIds.has(t))continue;let i=l[t],u=i.getValue();for(let t in u){let n=u[t];n instanceof r.h?i.settings.isIndexed?e.setIndexBuffer(n):o[t]=n:n&&(a[t]=n)}}e.setAttributes(o),e.setConstantAttributes(a)}disablePickingIndex(e){let t=this.props.data;if(!("attributes"in t)||(0,s._)(t))return void this._disablePickingIndex(e);let i=this.getAttributeManager()?.getAttributes()||{},r=G(i),n=$(i),o=r&&t.attributes&&t.attributes[r.id];if(o&&o.value){let i=o.value;for(let n=0;n<t.length;n++)i[r.getVertexOffset(n)]===e&&this._disablePickingIndex(n);return}let a=n&&t.attributes&&t.attributes[n.id];if(a&&a.value){let i=a.value,r=this.encodePickingColor(e);for(let e=0;e<t.length;e++){let t=n.getVertexOffset(e);i[t]===r[0]&&i[t+1]===r[1]&&i[t+2]===r[2]&&this._disablePickingIndex(e)}}else this._disablePickingIndex(e)}_disablePickingIndex(e){let t=this.getAttributeManager()?.getAttributes()||{},i=G(t);if(i){let t=i.getVertexOffset(e),r=new Uint32Array(i.getVertexOffset(e+1)-t);r.fill(I.Z1),i.buffer.write(r,t*r.BYTES_PER_ELEMENT);return}let r=$(t);if(!r){this.internalState&&(0,I.uz)(this.internalState.disabledPickingIndices,e);return}let n=r.getVertexOffset(e),s=r.getVertexOffset(e+1);r.buffer.write(new Uint8Array(s-n),n)}restorePickingColors(){let e=this.getAttributeManager()?.getAttributes()||{},t=V(e);if(!t){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let i=$(e);this.internalState.usesPickingColorCache&&i&&i.value.buffer!==D.buffer&&(i.value=D.subarray(0,i.value.length)),t.updateSubBuffer({startOffset:0})}_initialize(e){(0,x.A)(!this.internalState);let t=this.context.viewport;this.context.viewport=e||t;try{(0,w.A)("layer.initialize",this);let t=this._getAttributeManager();this.internalState=new j({attributeManager:t,layer:this}),this.internalState.viewport=e,this._clearChangeFlags(),this.state={};let i=(this.props.coordinateSystem??"default")==="default"?this.context.viewport.isGeospatial?"WGS84":"cartesian":this.props.coordinateSystem,r=void 0===this._sourceCrs?(0,L.rs)(i):this._sourceCrs;for(let e of((0,x.A)(!(r instanceof Promise)),this.internalState.sourceCrs=r,this._updatePreprojection(this.context.viewport),Object.defineProperty(this.state,"attributeManager",{get:()=>(g.A.deprecated("layer.state.attributeManager","layer.getAttributeManager()")(),t)}),this.internalState.uniformTransitions=new b(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context),this.props.extensions))e.initializeState.call(this,this.context,e);this.setChangeFlags({dataChanged:"init",propsChanged:"init",viewportChanged:!0,extensionsChanged:!0}),this._update()}finally{this.context.viewport=t}}_transferState(e){(0,w.A)("layer.matched",this,this===e);let{state:t,internalState:i}=e;this!==e&&(this.internalState=i,this.state=t,this.internalState.setAsyncProps(this.props),this._diffProps(this.props,this.internalState.getOldProps()))}_update(){if(!this.internalState||this._coordinateSystemLoading||!this.context.layerManager.isViewportReady(this))return;this._updatePreprojection(this.internalState?.viewport||this.context.viewport);let e=this.needsUpdate();if((0,w.A)("layer.update",this,e),!e)return;this.context.stats.get("Layer updates").incrementCount();let t=this.props,i=this.context,r=this.internalState,n=i.viewport,s=this._updateUniformTransition();r.propsInTransition=s,i.viewport=r.viewport||n,this.props=s;try{let e=this._getUpdateParams(),t=this.getModels(),n=!(0,L.vk)(e.props.coordinateSystem,e.oldProps.coordinateSystem);if(r.preprojectionChanged||this.internalState.preproject&&(n||!(0,S.b)(e.props.modelMatrix,e.oldProps.modelMatrix,1)||!(0,S.b)(e.props.coordinateOrigin,e.oldProps.coordinateOrigin,1))){let e=this.getAttributeManager();for(let[t,i]of Object.entries(e?.attributes||{}))"projection"===i.settings.transformSource&&("transform"in i.settings&&(!i.settings.transform||i.settings.transform===H)&&(i.settings.transform=this.usePositionTransforms().transform),e.invalidate(t))}if(i.device)this.updateState(e);else try{this.updateState(e)}catch(e){}for(let t of this.props.extensions)t.updateState.call(this,e,t);this.setNeedsRedraw(),this._updateAttributes();let s=this.getModels()[0]!==t[0];this._postUpdate(e,s)}finally{i.viewport=n,this.props=t,this._clearChangeFlags(),r.needsUpdate=!1,r.preprojectionChanged=!1,r.resetOldProps()}}_finalize(){for(let e of((0,w.A)("layer.finalize",this),this.finalizeState(this.context),this.props.extensions))e.finalizeState.call(this,this.context,e)}_drawLayer({renderPass:e,shaderModuleProps:t=null,uniforms:i={},parameters:r={}}){this._updateAttributeTransition();let s=this.props,o=this.context;this.props=this.internalState.propsInTransition||s;try{t&&this.setShaderModuleProps(t);let{getPolygonOffset:s}=this.props,a=s&&s(i)||[0,0];o.device instanceof n.WebGLDevice&&o.device.setParametersWebGL({polygonOffset:a});let l=o.device instanceof n.WebGLDevice?null:function(e){let{blendConstant:t,...i}=e;return t?{pipelineParameters:i,renderPassParameters:{blendConstant:t}}:{pipelineParameters:i}}(r);if(function(e,t,i,r){for(let n of e)"webgpu"===n.device.type?n.setParameters({...n.parameters,...n.topology.startsWith("triangle")&&{depthBias:Math.round(r[1]),depthBiasSlopeScale:r[0]},...i?.pipelineParameters}):n.setParameters(t)}(this.getModels(),r,l,a),o.device instanceof n.WebGLDevice){let{colorMask:n,...s}=r;"number"==typeof n?Object.assign(s,{colorMask:[!!(1&n),!!(2&n),!!(4&n),!!(8&n)]}):n&&Object.assign(s,{colorMask:n}),o.device.withParametersWebGL(s,()=>{let n={renderPass:e,shaderModuleProps:t,uniforms:i,parameters:r,context:o};for(let e of this.props.extensions)e.draw.call(this,n,e);this.draw(n)})}else{let n=e.getParameters();try{e.setParameters(l?.renderPassParameters||{});let n={renderPass:e,shaderModuleProps:t,uniforms:i,parameters:r,context:o};for(let e of this.props.extensions)e.draw.call(this,n,e);this.draw(n)}finally{e.setParameters(n)}}}finally{this.props=s}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(e){if(!this.internalState)return;let{changeFlags:t}=this.internalState;for(let i in e)if(e[i]){let r=!1;if("dataChanged"===i){let n=e[i],s=t[i];n&&Array.isArray(s)&&(t.dataChanged=Array.isArray(n)?s.concat(n):n,r=!0)}t[i]||(t[i]=e[i],r=!0),r&&(0,w.A)("layer.changeFlag",this,i,e)}let i=!!(t.dataChanged||t.updateTriggersChanged||t.propsChanged||t.extensionsChanged);t.propsOrDataChanged=i,t.somethingChanged=i||t.viewportChanged||t.projectionChanged||t.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,projectionChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(e,t){let i={...(0,v.mg)(e,t),projectionChanged:!(0,L.vk)(e.coordinateSystem,t.coordinateSystem)};if(i.updateTriggersChanged)for(let e in i.updateTriggersChanged)i.updateTriggersChanged[e]&&this.invalidateAttribute(e);if(i.transitionsChanged)for(let r in i.transitionsChanged)this.internalState.uniformTransitions.add(r,t[r],e[r],e.transitions?.[r]);return this.setChangeFlags(i)}validateProps(){(0,v.zo)(this.props)}updateAutoHighlight(e){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(e)}_updateAutoHighlight(e){let t={highlightedObjectColor:e.picked?e.color:null},{highlightColor:i}=this.props;e.picked&&"function"==typeof i&&(t.highlightColor=i(e)),this.setShaderModuleProps({picking:t}),this.setNeedsRedraw()}_getAttributeManager(){let e=this.context;return new a.A(e.device,{id:this.props.id,stats:e.stats,timeline:e.timeline})}_postUpdate(e,t){let{props:i,oldProps:r}=e,n=this.state.model;n?.isInstanced&&n.setInstanceCount(this.getNumInstances());let{autoHighlight:s,highlightedObjectIndex:o,highlightColor:a}=i;if(t||r.autoHighlight!==s||r.highlightedObjectIndex!==o||r.highlightColor!==a){let e={};Array.isArray(a)&&(e.highlightColor=a),(t||r.autoHighlight!==s||o!==r.highlightedObjectIndex)&&(e.highlightedObjectColor=Number.isFinite(o)&&o>=0?this.encodePickingColor(o):null),this.setShaderModuleProps({picking:e})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(e){if(!this.internalState)return!1;let t=!1;t=this.internalState.needsRedraw&&this.id;let i=this.getAttributeManager(),r=!!i&&i.getNeedsRedraw(e);if(t=t||r)for(let e of this.props.extensions)e.onNeedsRedraw.call(this,e);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!e.clearRedrawFlags,t}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}}W.defaultProps=Y,W.layerName="Layer";let q=W;function H(e){let t=[e[0],e[1],e[2]??0];this.props.modelMatrix&&(0,R.Z0)(t,t,this.props.modelMatrix);for(let e=0;e<3;e++)t[e]+=this.props.coordinateOrigin[e];return this.internalState.preproject(t)}},88599(e,t,i){i.d(t,{A:()=>s});var r=i(33027);class n extends r.K{}n.defaultProps={...r.K.defaultProps,enforceMatchingVectorLengths:!1};let s=n},15465(e,t,i){i.d(t,{S:()=>s});var r=i(88203),n=i(46908);function s(e,t,i=!1){let o=i&&(0,r._)(e.data)?e.data:null,a={};for(let[i,r]of Object.entries(t)){if(!1===r.prop)continue;let t=e[i];if(null!=t){a[i]=t;continue}if(!r.semantic)continue;let s=o?.getChild(i);if(s){try{let e=(0,n.H)(s.type,{semantic:"vector"===r.semantic?"numeric":r.semantic});if("vector"===r.semantic&&r.size&&e!==(1===r.size?"float32":`float32x${r.size}`))continue}catch{continue}a[i]=s}}return a}},71651(e,t,i){i.d(t,{A:()=>o});var r=i(53439),n=i(12897);let s=Object.freeze({});class o{constructor(e){this.component=e,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let e in this.asyncProps){let t=this.asyncProps[e];t&&t.type&&t.type.release&&t.type.release(t.resolvedValue,t.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||s}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(e){return e in this.asyncProps}getAsyncProp(e){let t=this.asyncProps[e];return t&&t.resolvedValue}isAsyncPropLoading(e){if(e){let t=this.asyncProps[e];return!!(t&&t.pendingLoadCount>0&&t.pendingLoadCount!==t.resolvedLoadCount)}for(let e in this.asyncProps)if(this.isAsyncPropLoading(e))return!0;return!1}reloadAsyncProp(e,t){this._watchPromise(e,Promise.resolve(t))}setAsyncProps(e){this.component=e[n.r3]||this.component;let t=e[n.vf]||{},i=e[n.YN]||e,r=e[n.jA]||{};for(let e in t){let i=t[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,i),t[e]=this.getAsyncProp(e)}for(let e in i){let t=i[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,t)}}_fetch(e,t){return null}_onResolve(e,t){}_onError(e,t){}_updateAsyncProp(e,t){if(this._didAsyncInputValueChange(e,t)){if("string"==typeof t&&(t=this._fetch(e,t)),t instanceof Promise)return void this._watchPromise(e,t);if((0,r.Td)(t))return void this._resolveAsyncIterable(e,t);this._setPropValue(e,t)}}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps)for(let e in this.oldAsyncProps=Object.create(this.oldProps),this.asyncProps)Object.defineProperty(this.oldAsyncProps,e,{enumerable:!0,value:this.oldProps[e]})}_didAsyncInputValueChange(e,t){let i=this.asyncProps[e];return t!==i.resolvedValue&&t!==i.lastValue&&(i.lastValue=t,!0)}_setPropValue(e,t){this._freezeAsyncOldProps();let i=this.asyncProps[e];i&&(t=this._postProcessValue(i,t),i.resolvedValue=t,i.pendingLoadCount++,i.resolvedLoadCount=i.pendingLoadCount)}_setAsyncPropValue(e,t,i){let r=this.asyncProps[e];r&&i>=r.resolvedLoadCount&&void 0!==t&&(this._freezeAsyncOldProps(),r.resolvedValue=t,r.resolvedLoadCount=i,this.onAsyncPropUpdated(e,t))}_watchPromise(e,t){let i=this.asyncProps[e];if(i){i.pendingLoadCount++;let r=i.pendingLoadCount;t.then(t=>{!this.component||r<i.resolvedLoadCount||(t=this._postProcessValue(i,t),this._setAsyncPropValue(e,t,r),this._onResolve(e,t))}).catch(t=>{this._onError(e,t)})}}async _resolveAsyncIterable(e,t){if("data"!==e)return void this._setPropValue(e,t);let i=this.asyncProps[e];if(!i)return;i.pendingLoadCount++;let r=i.pendingLoadCount,n=[],s=0;for await(let i of t){if(!this.component)return;let{dataTransform:t}=this.component.props;Object.defineProperty(n=t?t(i,n):n.concat(i),"__diff",{enumerable:!1,value:[{startRow:s,endRow:n.length}]}),s=n.length,this._setAsyncPropValue(e,n,r)}this._onResolve(e,n)}_postProcessValue(e,t){let i=e.type;return i&&this.component&&(i.release&&i.release(e.resolvedValue,i,this.component),i.transform)?i.transform(t,i,this.component):t}_createAsyncPropData(e,t){if(!this.asyncProps[e]){let i=this.component&&this.component.props[n.fW];this.asyncProps[e]={type:i&&i[e],lastValue:null,resolvedValue:t,pendingLoadCount:0,resolvedLoadCount:0}}}}},72068(e,t,i){i.d(t,{A:()=>m});var r=i(12897),n=i(68996),s=i(53439),o=i(55861);let a={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},l={};var u=i(7914);let c={boolean:{validate:(e,t)=>!0,equal:(e,t,i)=>!!e==!!t},number:{validate:(e,t)=>Number.isFinite(e)&&(!("max"in t)||e<=t.max)&&(!("min"in t)||e>=t.min)},color:{validate:(e,t)=>t.optional&&!e||d(e)&&(3===e.length||4===e.length),equal:(e,t,i)=>(0,u.b)(e,t,1)},accessor:{validate(e,t){let i=p(e);return"function"===i||i===p(t.value)},equal:(e,t,i)=>"function"==typeof t||(0,u.b)(e,t,1)},array:{validate:(e,t)=>t.optional&&!e||d(e),equal(e,t,i){let{compare:r}=i,n=Number.isInteger(r)?r:+!!r;return r?(0,u.b)(e,t,n):e===t}},object:{equal(e,t,i){if(i.ignore)return!0;let{compare:r}=i,n=Number.isInteger(r)?r:+!!r;return r?(0,u.b)(e,t,n):e===t}},function:{validate:(e,t)=>t.optional&&!e||"function"==typeof e,equal:(e,t,i)=>!i.compare&&!1!==i.ignore||e===t},data:{transform:(e,t,i)=>{if(!e)return e;let{dataTransform:r}=i.props;return r?r(e):"string"==typeof e.shape&&e.shape.endsWith("-table")&&Array.isArray(e.data)?e.data:e}},image:{transform:(e,t,i)=>{let r=i.context;return r&&r.device?function(e,t,i,r){if(i instanceof o.g)return i;i.constructor&&"Object"!==i.constructor.name&&(i={data:i});let n=null;i.compressed&&(n={minFilter:"linear",mipmapFilter:i.data.length>1?"nearest":"linear"});let{width:s,height:u}=i.data,c=t.createTexture({...i,sampler:{...a,...n,...r},mipLevels:t.getMipLevelCount(s,u)});return"webgl"===t.type?c.generateMipmapsWebGL():"webgpu"===t.type&&t.generateMipmapsWebGPU(c),l[c.id]=e,c}(i.id,r.device,e,{...t.parameters,...i.props.textureParameters}):null},release:(e,t,i)=>{var r;r=i.id,e&&e instanceof o.g&&l[e.id]===r&&(e.delete(),delete l[e.id])}}};function f(e,t){return"type"in t?{name:e,...c[t.type],...t}:"value"in t?{name:e,type:p(t.value),...t}:{name:e,type:"object",value:t}}function d(e){return Array.isArray(e)||ArrayBuffer.isView(e)}function p(e){return d(e)?"array":null===e?"null":typeof e}function h(e,t){return Object.prototype.hasOwnProperty.call(e,t)}let _=0;class g{constructor(...e){this.props=function(e,t){let i;for(let e=t.length-1;e>=0;e--){let r=t[e];"extensions"in r&&(i=r.extensions)}let o=Object.create(function e(t,i){var o,a;if(!(t instanceof m.constructor))return{};let l="_mergedDefaultProps";if(i)for(let e of i){let t=e.constructor;t&&(l+=`:${t.extensionName||t.name}`)}let u=h(o=t,a=l)&&o[a];return u||(t[l]=function(t,i){var o;let a;if(!t.prototype)return null;let l=e(Object.getPrototypeOf(t)),u=function(e){let t={},i={},r={};for(let[n,s]of Object.entries(e)){let e=s?.deprecatedFor;if(e)r[n]=Array.isArray(e)?e:[e];else{let e=function(e,t){switch(p(t)){case"object":return f(e,t);case"array":return f(e,{type:"array",value:t,compare:!1});case"boolean":return f(e,{type:"boolean",value:t});case"number":return f(e,{type:"number",value:t});case"function":return f(e,{type:"function",value:t,compare:!0});default:return{name:e,type:"unknown",value:t}}}(n,s);t[n]=e,i[n]=e.value}}return{propTypes:t,defaultProps:i,deprecatedProps:r}}(function(e,t){return h(e,t)&&e[t]}(t,"defaultProps")||{}),c=Object.assign(Object.create(null),l,u.defaultProps),d=Object.assign(Object.create(null),l?.[r.fW],u.propTypes),_=Object.assign(Object.create(null),l?.[r.uH],u.deprecatedProps);for(let t of i){let i=e(t.constructor);i&&(Object.assign(c,i),Object.assign(d,i[r.fW]),Object.assign(_,i[r.uH]))}return Object.defineProperties(c,{id:{writable:!0,value:((a=(o=t).componentName)||n.A.warn(`${o.name}.componentName not specified`)(),a||o.name)}}),function(e,t){let i={},n={};for(let e in t){let o=t[e],{name:a,value:l}=o;o.async&&(i[a]=l,n[a]=function(e){return{enumerable:!0,set(t){"string"==typeof t||t instanceof Promise||(0,s.Td)(t)?this[r.YN][e]=t:this[r.vf][e]=t},get(){if(this[r.vf]){if(e in this[r.vf])return this[r.vf][e]||this[r.jA][e];if(e in this[r.YN]){let t=this[r.r3]&&this[r.r3].internalState;if(t&&t.hasAsyncProp(e))return t.getAsyncProp(e)||this[r.jA][e]}}return this[r.jA][e]}}}(a))}e[r.jA]=i,e[r.YN]={},Object.defineProperties(e,n)}(c,d),function(e,t){for(let i in t)Object.defineProperty(e,i,{enumerable:!1,set(e){let r=`${this.id}: ${i}`;for(let r of t[i])h(this,r)||(this[r]=e);n.A.deprecated(r,t[i].join("/"))()}})}(c,_),c[r.fW]=d,c[r.uH]=_,0!==i.length||h(t,"_propTypes")||(t._propTypes=d),c}(t,i||[]))}(e.constructor,i));o[r.r3]=e,o[r.YN]={},o[r.vf]={};for(let e=0;e<t.length;++e){let i=t[e];for(let e in i)o[e]=i[e]}return Object.freeze(o),o}(this,e),this.id=this.props.id,this.count=_++}clone(e){let{props:t}=this,i={};for(let e in t[r.jA])e in t[r.vf]?i[e]=t[r.vf][e]:e in t[r.YN]&&(i[e]=t[r.YN][e]);return new this.constructor({...t,...i,...e})}}g.componentName="Component",g.defaultProps={};let m=g},12897(e,t,i){i.d(t,{VD:()=>r,YN:()=>l,fW:()=>s,jA:()=>a,r3:()=>n,uH:()=>o,vf:()=>u});let r={NO_STATE:"Awaiting state",MATCHED:"Matched. State transferred from previous layer",INITIALIZED:"Initialized",AWAITING_GC:"Discarded. Awaiting garbage collection",AWAITING_FINALIZATION:"No longer matched. Awaiting garbage collection",FINALIZED:"Finalized! Awaiting garbage collection"},n=Symbol.for("component"),s=Symbol.for("propTypes"),o=Symbol.for("deprecatedProps"),a=Symbol.for("asyncPropDefaults"),l=Symbol.for("asyncPropOriginal"),u=Symbol.for("asyncPropResolved")},12294(e,t,i){i.d(t,{Me:()=>o,mg:()=>s,zo:()=>n});var r=i(12897);function n(e){let t=e[r.fW];for(let i in t){let r=t[i],{validate:n}=r;if(n&&!n(e[i],r))throw Error(`Invalid prop ${i}: ${e[i]}`)}}function s(e,t){let i=o({newProps:e,oldProps:t,propTypes:e[r.fW],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),n=function(e,t){if(null===t)return"oldProps is null, initial diff";let i=!1,{dataComparator:r,_dataDiff:n}=e;return r?r(e.data,t.data)||(i="Data comparator detected a change"):e.data!==t.data&&(i="A new data container was supplied"),i&&n&&(i=n(e.data,t.data)||i),i}(e,t),s=!1;return n||(s=function(e,t){if(null===t||"all"in e.updateTriggers&&l(e,t,"all"))return{all:!0};let i={},r=!1;for(let n in e.updateTriggers)"all"!==n&&l(e,t,n)&&(i[n]=!0,r=!0);return!!r&&i}(e,t)),{dataChanged:n,propsChanged:i,updateTriggersChanged:s,extensionsChanged:function(e,t){if(null===t)return!0;let i=t.extensions,{extensions:r}=e;if(r===i)return!1;if(!i||!r||r.length!==i.length)return!0;for(let e=0;e<r.length;e++)if(!r[e].equals(i[e]))return!0;return!1}(e,t),transitionsChanged:function(e,t){if(!e.transitions)return!1;let i={},n=e[r.fW],s=!1;for(let r in e.transitions){let o=n[r],l=o&&o.type;("number"===l||"color"===l||"array"===l)&&a(e[r],t[r],o)&&(i[r]=!0,s=!0)}return!!s&&i}(e,t)}}function o({newProps:e,oldProps:t,ignoreProps:i={},propTypes:r={},triggerName:n="props"}){if(t===e)return!1;if("object"!=typeof e||null===e||"object"!=typeof t||null===t)return`${n} changed shallowly`;for(let s of Object.keys(e))if(!(s in i)){if(!(s in t))return`${n}.${s} added`;let i=a(e[s],t[s],r[s]);if(i)return`${n}.${s} ${i}`}for(let s of Object.keys(t))if(!(s in i)){if(!(s in e))return`${n}.${s} dropped`;if(!Object.hasOwnProperty.call(e,s)){let i=a(e[s],t[s],r[s]);if(i)return`${n}.${s} ${i}`}}return!1}function a(e,t,i){let r=i&&i.equal;return r&&!r(e,t,i)||!r&&(r=e&&t&&e.equals)&&!r.call(e,t)?"changed deeply":r||t===e?null:"changed shallowly"}function l(e,t,i){let r=e.updateTriggers[i];r=null==r?{}:r;let n=t.updateTriggers[i];return o({oldProps:n=null==n?{}:n,newProps:r,triggerName:i})}},46487(e,t,i){i.d(t,{A:()=>r});let r={name:"color",dependencies:[],source:`

@must_use
fn deckgl_premultiplied_alpha(fragColor: vec4<f32>) -> vec4<f32> {
    return vec4(fragColor.rgb * fragColor.a, fragColor.a); 
};
`,getUniforms:e=>({})}},3065(e,t,i){i.d(t,{A:()=>n});let r="#define SMOOTH_EDGE_RADIUS 0.5",n={name:"geometry",source:`\
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
`}},19754(e,t,i){i.d(t,{lT:()=>_,uz:()=>a,Ay:()=>h,Z1:()=>o});var r=i(34353);let n={props:{},uniforms:{},name:"picking",uniformTypes:{isActive:"f32",isAttribute:"f32",isHighlightActive:"f32",useByteColors:"f32",highlightedObjectColor:"vec3<f32>",highlightColor:"vec4<f32>"},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:[0,1,1,1]},vs:`\
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
`,getUniforms:function(e={},t){let i={},n=(0,r.eS)(e.useByteColors,!0);return void 0===e.highlightedObjectColor||(null===e.highlightedObjectColor?i.isHighlightActive=!1:(i.isHighlightActive=!0,i.highlightedObjectColor=e.highlightedObjectColor.slice(0,3))),e.highlightColor&&(i.highlightColor=(0,r.jI)(e.highlightColor,n)),void 0!==e.isActive&&(i.isActive=!!e.isActive,i.isAttribute=!!e.isAttribute),void 0!==e.useByteColors&&(i.useByteColors=!!e.useByteColors),i}};var s=i(68996);let o=0xffffff;function a(e,t){10===e.length?s.A.warn("pickMultipleObjects can only exclude 10 previously picked objects for layers without picking buffers")():e.push(t)}let l=`\
  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function u(e){return e.replace("  vec4 highlightColor;\n} picking;",`  vec4 highlightColor;
${l}} picking;`)}function c(e,t){return[e[t]||0,e[t+1]||0,e[t+2]||0,e[t+3]||0]}let f=`\
vec3 picking_getPickingColorFromIndex(float objectIndex) {
  if (objectIndex < 0.0 || objectIndex >= ${o}.0) {
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
`,d=`\
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
  if (objectIndex >= ${o}u) {
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
`,p={...n,vs:`${u(n.vs)}
${f}`,fs:u(n.fs),source:d,uniformTypes:{...n.uniformTypes,disabledPickingIndexCount:"f32",disabledPickingIndices0:"vec4<f32>",disabledPickingIndices1:"vec4<f32>",disabledPickingIndices2:"vec4<f32>"},defaultUniforms:{...n.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(e,t){let i=n.getUniforms(e,t),r=e.disabledPickingIndices||[];return i.disabledPickingIndexCount=r.length,i.disabledPickingIndices0=c(r,0),i.disabledPickingIndices1=c(r,4),i.disabledPickingIndices2=c(r,8),i}},h=p,_={name:"picking",module:p,injections:[{stage:"vertex",target:"DECKGL_FILTER_GL_POSITION",glsl:`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `},{stage:"vertex",target:"DECKGL_FILTER_COLOR",glsl:`
  picking_setPickingColor(geometry.pickingColor);
  `},{stage:"fragment",target:"DECKGL_FILTER_COLOR",order:99,glsl:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}]}},63400(e,t,i){i.d(t,{R:()=>f,w:()=>c});var r=i(78374),n=i(60275),s=i(74334),o=i(29527),a=i(70998),l=i(67681);function u(e,t,i=!1){let n=t.projectPosition(e);if(i&&t instanceof r.A){let[i,r,s=0]=e,o=t.getDistanceScales([i,r]);n[2]=s*o.unitsPerMeter[2]}return n}function c(e,{sourceCrs:t,viewport:i,modelMatrix:r,coordinateOrigin:s,coordinateSystem:o,offsetMode:f=!1}){let[d,p,h=0]=e;switch(r&&([d,p,h]=a.Z0([],[d,p,h,1],r)),o){case"meter-offsets":if(i.projectionMode===n.K.CUSTOM_GEOSPATIAL){let e=i.projectPosition(s),t=i.crs.converter.WGS84.from(s),{unitsPerMeter:r}=i.getDistanceScales(t);return[e[0]+d*r[0],e[1]+p*r[1],e[2]+h*r[2]]}return u((0,l.dT)(s,[d,p,h]),i,f);case"cartesian":break;default:if(t){let e=[d+s[0],p+s[1],h+(s[2]||0)],{preproject:r}=i.getPreprojection(t),o=r?r(e):e;if(i.projectionMode===n.K.CUSTOM_GEOSPATIAL)return o.map((e,t)=>e*i.distanceScales.unitsPerWorldUnit[t]);return u(o,i,f)}}if(i.projectionMode===n.K.CUSTOM_GEOSPATIAL){let e=i.distanceScales.unitsPerWorldUnit;return[(d+s[0])*e[0],(p+s[1])*e[1],(h+s[2])*e[2]]}return i.isGeospatial?[d+s[0],p+s[1],h+s[2]]:i.projectPosition([d,p,h])}function f(e,t){let{viewport:i,sourceCrs:r,coordinateSystem:n,coordinateOrigin:a}=t,l=!1===t.autoOffset?null:(0,s.ow)(i,n,a,r),u=c(e,{...t,offsetMode:!!l?.offsetMode});if(l?.offsetMode){let e=l.commonOrigin||i.projectPosition(l.geospatialOrigin||l.shaderCoordinateOrigin);o.jb(u,u,e)}return u}},52948(e,t,i){i.d(t,{A:()=>v});var r=i(5652),n=i(8994),s=i(3065),o=i(74334),a=i(9350),l=i(60275);let u=Object.entries(l.r).map(([e,t])=>`const COORDINATE_SYSTEM_${e}: i32 = ${t};`).join(""),c=Object.keys(l.K).map(e=>`const PROJECTION_MODE_${e}: i32 = ${l.K[e]};`).join(""),f=Object.keys(a.p5).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${a.p5[e]};`).join(""),d=`\
${u}
${c}
${f}

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
  coordinateFrame: i32,
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
  sizeScaleSize: i32,
  sizeScaleTransform: vec4<f32>,
};

@group(0) @binding(auto)
var<uniform> project: ProjectUniforms;

#ifdef USE_EXTERNAL_PROJECTION
@group(0) @binding(auto)
var<storage, read> project_sizeScaleBuffer: array<vec4<f32>>;
#endif

// -----------------------------------------------------------------------------
// Geometry data shared across the project helpers.
// The active layer shader is responsible for populating this private module
// state before calling the project functions below.
// -----------------------------------------------------------------------------

alias Geometry = VertexGeometry;
var<private> geometry: Geometry;
`,p=`\
${d}

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
      project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC &&
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

#ifdef USE_EXTERNAL_PROJECTION
// Nearest-record Taylor reconstruction: x=scalar XY scale, yz=slopes per sampler
// unit, w=Z scale. x=0 marks invalid samples. One load preserves instance aspect ratio.
// Alternatives if discontinuities/accuracy become visible: blend four local Taylor
// estimates for continuity, or use four-fetch bicubic Hermite with a mixed derivative
// for higher accuracy (which would require moving Z scale out of w).
fn project_external_size_scale_at(mapPosition: vec2<f32>) -> vec3<f32> {
  if (project.sizeScaleSize <= 0) { return project.commonUnitsPerMeter; }
  let samplePosition = mapPosition * project.sizeScaleTransform.xy + project.sizeScaleTransform.zw;
  if (any(samplePosition < vec2<f32>(0.0)) || any(samplePosition > vec2<f32>(512.0))) {
    return project.commonUnitsPerMeter;
  }
  let dimensions = vec2<i32>(project.sizeScaleSize);
  let index = clamp(vec2<i32>(floor(samplePosition / 512.0 * vec2<f32>(dimensions))),
    vec2<i32>(0), dimensions - 1);
  let record = project_sizeScaleBuffer[u32(index.y * project.sizeScaleSize + index.x)];
  if (record.x <= 0.0) { return project.commonUnitsPerMeter; }
  let center = (vec2<f32>(index) + 0.5) * 512.0 / vec2<f32>(dimensions);
  var scale = record.x + dot(record.yz, samplePosition - center);
  // This bound rejects non-finite reconstructions without WGSL classification builtins.
  if (!(scale > 0.0 && scale <= 3.4028234663852886e38)) { scale = record.x; }
  return vec3<f32>(scale, scale, record.w * scale / record.x) * project.commonUnitsPerWorldUnit;
}

fn project_external_size_scale() -> vec3<f32> {
  return project_external_size_scale_at(select((project.modelMatrix * vec4<f32>(geometry.worldPosition, 1.0)).xy + project.commonOrigin.xy / project.commonUnitsPerWorldUnit.xy - project.coordinateOrigin.xy,
    (geometry.position.xy + project.commonOrigin.xy) / project.commonUnitsPerWorldUnit.xy, geometry.position.w != 0.0));
}

#endif

// Overloads to scale offsets (meters to world units)
fn project_size_float(meters: f32) -> f32 {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) { return meters * project_external_size_scale().z; }
#endif
  return meters * project.commonUnitsPerMeter.z * project_size();
}

fn project_size_vec2(meters: vec2<f32>) -> vec2<f32> {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) { return meters * project_external_size_scale().xy; }
#endif
  return meters * project.commonUnitsPerMeter.xy * project_size();
}

fn project_size_vec3(meters: vec3<f32>) -> vec3<f32> {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) { return meters * project_external_size_scale(); }
#endif
  return meters * project.commonUnitsPerMeter * project_size();
}

fn project_size_vec4(meters: vec4<f32>) -> vec4<f32> {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) {
    return vec4<f32>(meters.xyz * project_external_size_scale(), meters.w);
  }
#endif
  return vec4<f32>(meters.xyz * project.commonUnitsPerMeter, meters.w);
}

// Returns a rotation matrix aligning the z\u{2011}axis with the given up vector.
// On the globe, ux points east and uy north. Longitude 0 lies on -y and the north pole on +z.
// At a pole, ux is the limit of east along the longitude that up retains; it is +x only when up
// lies exactly on the polar axis.
fn project_get_orientation_matrix(up: vec3<f32>) -> mat3x3<f32> {
  let uz = normalize(up);
  // Tangent on XY plane
  let horizontalLength = length(uz.xy);
  var ux = vec3<f32>(1.0, 0.0, 0.0);
  if (horizontalLength > 0.0) {
    ux = vec3<f32>(-uz.y, uz.x, 0.0) / horizontalLength;
  }
  let uy = cross(uz, ux);
  return mat3x3<f32>(ux, uy, uz);
}

// Since WGSL does not support "out" parameters, we return a struct.
struct RotationResult {
  needsRotation: bool,
  transform: mat3x3<f32>,
};

fn project_needs_rotation(commonPosition: vec3<f32>) -> RotationResult {
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
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
  // Preserve longitude at the poles despite GPU cosine rounding to zero or negative.
  var cosPhi = cos(phi);
  if (abs(lnglatz.y) == 90.0) { cosPhi = max(abs(cosPhi), 1e-7); }
  let D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
  return vec3<f32>(
    sin(lambda) * cosPhi,
    -cos(lambda) * cosPhi,
    sin(phi)
  ) * D;
}

// Mercator y of project_mercator_'s latitude clamp: log(tan(PI / 4 + radians(89.9) / 2))
const MAX_MERCATOR_Y: f32 = 7.0439589847;

// Inverse of project_globe_ followed by project_mercator_, without forming lat/lng:
// Mercator y = atanh(sin(lat)) = log((D + |z|) / |xy|), which stays accurate near the poles
fn project_globe_to_mercator_(spherePos: vec3<f32>) -> vec2<f32> {
  let D = length(spherePos);
  let h = max(length(spherePos.xy), 1e-20);
  let y = sign(spherePos.z) * min(log((D + abs(spherePos.z)) / h), MAX_MERCATOR_Y);
  let x = atan2(spherePos.x, -spherePos.y);
  return (vec2<f32>(x, y) + PI) * WORLD_SCALE;
}

// Flat common space (Mercator or cartesian) of a common position; identity except under GLOBE.
// WGSL has no function overloading: pass position.xyz for a vec4. See project.glsl.ts.
fn project_common_position_to_flat(commonPosition: vec3<f32>) -> vec2<f32> {
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    return project_globe_to_mercator_(commonPosition);
  }
  return commonPosition.xy;
}

// World copy of a flat x nearest to referenceX
fn project_wrap_flat_x_(x: f32, referenceX: f32) -> f32 {
  return x - TILE_SIZE * floor((x - referenceX) / TILE_SIZE + 0.5);
}

// Flat position in the world copy nearest to referenceX (e.g. a bounds centre); geospatial only
fn project_common_position_to_flat_wrapped(commonPosition: vec3<f32>, referenceX: f32) -> vec2<f32> {
  var flatPosition = project_common_position_to_flat(commonPosition);
  if (project.projectionMode != PROJECTION_MODE_IDENTITY) {
    flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
  }
  return flatPosition;
}

// Flat position continuous across the antimeridian under GLOBE (seam moved opposite referenceX,
// e.g. the camera); identity for flat modes. For periodic patterns.
fn project_common_position_to_flat_continuous(commonPosition: vec3<f32>, referenceX: f32) -> vec2<f32> {
  var flatPosition = project_common_position_to_flat(commonPosition);
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
  }
  return flatPosition;
}

// Projects positions (with an optional 64-bit low part) from the input
// coordinate system to the common space.
fn project_position_vec4_f64(position: vec4<f32>, position64Low: vec3<f32>) -> vec4<f32> {
  var position_world = project.modelMatrix * position;

  // Work around for a Mac+NVIDIA bug:
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
      return vec4<f32>(
        project_mercator_(position_world.xy),
        _project_size_at_latitude_m(position_world.z, position_world.y),
        position_world.w
      );
    }
    if (project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED) {
      position_world = vec4f(position_world.xyz + project.coordinateOrigin, position_world.w);
    }
  }
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEOCENTRIC) {
      // Globe-centered Cartesian XYZ are meters, not longitude/latitude.
      let position_low = project.modelMatrix * vec4<f32>(position64Low, 0.0);
      return vec4<f32>(
        position_world.xyz * project.commonUnitsPerMeter + position_low.xyz * project.commonUnitsPerMeter,
        position_world.w
      );
    }
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
      return vec4<f32>(
        project_globe_(position_world.xyz),
        position_world.w
      );
    }
    if (project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS) {
      let enuMatrix = project_get_orientation_matrix(project.commonOrigin);
      let offsetCommon = (enuMatrix * position_world.xyz) * project.commonUnitsPerMeter;
      return vec4<f32>(project.commonOrigin + offsetCommon, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
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
      project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL ||
      (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
       (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC ||
        project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED))) {
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

// True when the globe hides commonPosition from the camera: the segment from the camera to the
// position passes through the sphere. Exact at any altitude. Always false for flat projections.
fn project_globe_is_occluded(commonPosition: vec3<f32>) -> bool {
  if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    return false;
  }
  let eye = project.cameraPosition;
  let ray = commonPosition - eye;
  let rayLength2 = dot(ray, ray);
  if (rayLength2 == 0.0) {
    return false;
  }
  let t = clamp(-dot(eye, ray) / rayLength2, 0.0, 1.0);
  let closest = eye + ray * t;
  return t < 1.0 && dot(closest, closest) < GLOBE_RADIUS * GLOBE_RADIUS;
}

// Distance from eye along the unit direction to the first globe surface point, or fallback
fn project_globe_ray_distance_(eye: vec3<f32>, direction: vec3<f32>, fallback: f32) -> f32 {
  let b = dot(eye, direction);
  let discriminant = b * b - dot(eye, eye) + GLOBE_RADIUS * GLOBE_RADIUS;
  if (discriminant < 0.0) {
    return fallback;
  }
  let distance = -b - sqrt(discriminant);
  return select(fallback, distance, distance > 0.0);
}

// Screen-space radius, in pixels, that a billboard is assumed to cover around its anchor
const GLOBE_BILLBOARD_FOOTPRINT_PIXELS: f32 = 64.0;

// Clip-space position for a billboard anchored at commonPosition. Under GLOBE the billboard is
// moved toward the camera by the amount the globe surface rises within its footprint, so the
// curve of the globe does not clip a sprite whose anchor is visible. The shift is zero where the
// surface faces the camera and grows with the grazing angle, about 1.8 km at zoom 12 with pitch
// 60, so other 3D geometry that is in front of the anchor by less than the shift no longer hides
// the sprite. Pair with project_globe_is_occluded. Identity for flat projections.
fn project_globe_billboard_clipspace(clipPosition: vec4<f32>, commonPosition: vec3<f32>) -> vec4<f32> {
  if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    return clipPosition;
  }
  let eye = project.cameraPosition;
  let ray = commonPosition - eye;
  let anchorDistance = length(ray);
  if (anchorDistance == 0.0) {
    return clipPosition;
  }
  let direction = ray / anchorDistance;
  // On screen, the surface is nearest toward the point of the globe below the camera
  let inward = -eye - dot(-eye, direction) * direction;
  let inwardLength = length(inward);
  if (inwardLength == 0.0) {
    return clipPosition;
  }
  // Ray through the inward edge of the footprint
  let footprint = project_pixel_size_float(GLOBE_BILLBOARD_FOOTPRINT_PIXELS);
  let edgeDirection = normalize(ray + inward / inwardLength * footprint);
  let surfaceDistance = project_globe_ray_distance_(eye, direction, anchorDistance);
  let edgeDistance = project_globe_ray_distance_(eye, edgeDirection, surfaceDistance);
  let shift = surfaceDistance - edgeDistance;
  if (shift <= 0.0) {
    return clipPosition;
  }
  let shiftedClip = project_common_position_to_clipspace(vec4<f32>(commonPosition - direction * shift, 1.0));
  return vec4<f32>(clipPosition.xy, shiftedClip.z / shiftedClip.w * clipPosition.w, clipPosition.w);
}
`,h=Object.entries(l.r).map(([e,t])=>`const int COORDINATE_SYSTEM_${e} = ${t};`).join(""),_=Object.keys(l.K).map(e=>`const int PROJECTION_MODE_${e} = ${l.K[e]};`).join(""),g=Object.keys(a.p5).map(e=>`const int UNIT_${e.toUpperCase()} = ${a.p5[e]};`).join(""),m=`\
${h}
${_}
${g}
layout(std140) uniform projectUniforms {
bool wrapLongitude;
int coordinateFrame;
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
int sizeScaleSize;
vec4 sizeScaleTransform;
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
project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC &&
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
#ifdef USE_EXTERNAL_PROJECTION
uniform highp usampler2D project_sizeScaleTexture;
vec3 project_external_size_scale_at(vec2 mapPosition) {
if (project.sizeScaleSize <= 0) return project.commonUnitsPerMeter;
vec2 samplePosition = mapPosition * project.sizeScaleTransform.xy + project.sizeScaleTransform.zw;
if (any(lessThan(samplePosition, vec2(0.0))) || any(greaterThan(samplePosition, vec2(512.0)))) return project.commonUnitsPerMeter;
ivec2 dimensions = textureSize(project_sizeScaleTexture, 0);
ivec2 index = clamp(ivec2(floor(samplePosition / 512.0 * vec2(dimensions))), ivec2(0), dimensions - 1);
vec4 texel = uintBitsToFloat(texelFetch(project_sizeScaleTexture, index, 0));
if (texel.r <= 0.0) return project.commonUnitsPerMeter;
vec2 center = (vec2(index) + 0.5) * 512.0 / vec2(dimensions);
float scale = texel.r + dot(texel.gb, samplePosition - center);
if (!(scale > 0.0) || isinf(scale) || isnan(scale)) scale = texel.r;
return vec3(scale, scale, texel.a * scale / texel.r) * project.commonUnitsPerWorldUnit;
}
vec3 project_external_size_scale() {
return project_external_size_scale_at(geometry.position.w == 0.0
? (project.modelMatrix * vec4(geometry.worldPosition, 1.0)).xy + project.commonOrigin.xy / project.commonUnitsPerWorldUnit.xy - project.coordinateOrigin.xy : (geometry.position.xy + project.commonOrigin.xy) / project.commonUnitsPerWorldUnit.xy);
}
#endif
float project_size_at_latitude(float meters, float lat) {
return meters * project.commonUnitsPerMeter.z * project_size_at_latitude(lat);
}
float project_size(float meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return meters * project_external_size_scale().z;
#endif
return meters * project.commonUnitsPerMeter.z * project_size();
}
vec2 project_size(vec2 meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return meters * project_external_size_scale().xy;
#endif
return meters * project.commonUnitsPerMeter.xy * project_size();
}
vec3 project_size(vec3 meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return meters * project_external_size_scale();
#endif
return meters * project.commonUnitsPerMeter * project_size();
}
vec4 project_size(vec4 meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return vec4(meters.xyz * project_external_size_scale(), meters.w);
#endif
return vec4(meters.xyz * project.commonUnitsPerMeter, meters.w);
}
mat3 project_get_orientation_matrix(vec3 up) {
vec3 uz = normalize(up);
float horizontalLength = length(uz.xy);
vec3 ux = horizontalLength > 0.0 ? vec3(-uz.y, uz.x, 0.0) / horizontalLength : vec3(1.0, 0.0, 0.0);
vec3 uy = cross(uz, ux);
return mat3(ux, uy, uz);
}
bool project_needs_rotation(vec3 commonPosition, out mat3 transform) {
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
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
if (abs(lnglatz.y) == 90.0) cosPhi = max(abs(cosPhi), 1e-7);
float D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
return vec3(
sin(lambda) * cosPhi,
-cos(lambda) * cosPhi,
sin(phi)
) * D;
}
const float MAX_MERCATOR_Y = 7.0439589847;
vec2 project_globe_to_mercator_(vec3 spherePos) {
float D = length(spherePos);
float h = max(length(spherePos.xy), 1e-20);
float y = sign(spherePos.z) * min(log((D + abs(spherePos.z)) / h), MAX_MERCATOR_Y);
float x = atan(spherePos.x, -spherePos.y);
return (vec2(x, y) + PI) * WORLD_SCALE;
}
vec2 project_common_position_to_flat(vec3 commonPosition) {
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
return project_globe_to_mercator_(commonPosition);
}
return commonPosition.xy;
}
vec2 project_common_position_to_flat(vec4 commonPosition) {
return project_common_position_to_flat(commonPosition.xyz);
}
float project_wrap_flat_x_(float x, float referenceX) {
return x - TILE_SIZE * floor((x - referenceX) / TILE_SIZE + 0.5);
}
vec2 project_common_position_to_flat_wrapped(vec3 commonPosition, float referenceX) {
vec2 flatPosition = project_common_position_to_flat(commonPosition);
if (project.projectionMode != PROJECTION_MODE_IDENTITY) {
flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
}
return flatPosition;
}
vec2 project_common_position_to_flat_wrapped(vec4 commonPosition, float referenceX) {
return project_common_position_to_flat_wrapped(commonPosition.xyz, referenceX);
}
vec2 project_common_position_to_flat_continuous(vec3 commonPosition, float referenceX) {
vec2 flatPosition = project_common_position_to_flat(commonPosition);
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
}
return flatPosition;
}
vec2 project_common_position_to_flat_continuous(vec4 commonPosition, float referenceX) {
return project_common_position_to_flat_continuous(commonPosition.xyz, referenceX);
}
vec4 project_position(vec4 position, vec3 position64Low) {
vec4 position_world = project.modelMatrix * position;
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
return vec4(
project_mercator_(position_world.xy),
project_size_at_latitude(position_world.z, position_world.y),
position_world.w
);
}
if (project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED) {
position_world.xyz += project.coordinateOrigin;
}
}
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
if (project.coordinateFrame == COORDINATE_SYSTEM_GEOCENTRIC) {
vec4 position_low = project.modelMatrix * vec4(position64Low, 0.0);
return vec4(
position_world.xyz * project.commonUnitsPerMeter + position_low.xyz * project.commonUnitsPerMeter,
position_world.w
);
}
if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
return vec4(
project_globe_(position_world.xyz),
position_world.w
);
}
if (project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS) {
mat3 enuMatrix = project_get_orientation_matrix(project.commonOrigin);
vec3 offsetCommon = (enuMatrix * position_world.xyz) * project.commonUnitsPerMeter;
return vec4(project.commonOrigin + offsetCommon, position_world.w);
}
}
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
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
project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL ||
(project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
(project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC ||
project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED))) {
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
bool project_globe_is_occluded(vec3 commonPosition) {
if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
return false;
}
vec3 eye = project.cameraPosition;
vec3 ray = commonPosition - eye;
float rayLength2 = dot(ray, ray);
if (rayLength2 == 0.0) {
return false;
}
float t = clamp(-dot(eye, ray) / rayLength2, 0.0, 1.0);
vec3 closest = eye + ray * t;
return t < 1.0 && dot(closest, closest) < GLOBE_RADIUS * GLOBE_RADIUS;
}
float project_globe_ray_distance_(vec3 eye, vec3 direction, float fallback) {
float b = dot(eye, direction);
float discriminant = b * b - dot(eye, eye) + GLOBE_RADIUS * GLOBE_RADIUS;
if (discriminant < 0.0) {
return fallback;
}
float distance = -b - sqrt(discriminant);
return distance > 0.0 ? distance : fallback;
}
#define GLOBE_BILLBOARD_FOOTPRINT_PIXELS 64.0
vec4 project_globe_billboard_clipspace(vec4 clipPosition, vec3 commonPosition) {
if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
return clipPosition;
}
vec3 eye = project.cameraPosition;
vec3 ray = commonPosition - eye;
float anchorDistance = length(ray);
if (anchorDistance == 0.0) {
return clipPosition;
}
vec3 direction = ray / anchorDistance;
vec3 inward = -eye - dot(-eye, direction) * direction;
float inwardLength = length(inward);
if (inwardLength == 0.0) {
return clipPosition;
}
float footprint = project_pixel_size(GLOBE_BILLBOARD_FOOTPRINT_PIXELS);
vec3 edgeDirection = normalize(ray + inward / inwardLength * footprint);
float surfaceDistance = project_globe_ray_distance_(eye, direction, anchorDistance);
float edgeDistance = project_globe_ray_distance_(eye, edgeDirection, surfaceDistance);
float shift = surfaceDistance - edgeDistance;
if (shift <= 0.0) {
return clipPosition;
}
vec4 shiftedClip = project_common_position_to_clipspace(vec4(commonPosition - direction * shift, 1.0));
clipPosition.z = shiftedClip.z / shiftedClip.w * clipPosition.w;
return clipPosition;
}
`,b={},v={name:"project",dependencies:[r.i,s.A],source:p,vs:m,getUniforms:function(e=b){return"viewport"in e?{...(0,o.aY)(e),sizeScaleTransform:e.sizeScaleTransform||e.viewport.sizeScaleTransform||[1,1,0,0],...e.sizeScale instanceof n.h?{project_sizeScaleBuffer:e.sizeScale,sizeScaleSize:Math.sqrt(e.sizeScale.byteLength/16)}:e.sizeScale?{project_sizeScaleTexture:e.sizeScale,sizeScaleSize:e.sizeScale.width}:{sizeScaleSize:0}}:{}},isCustomProjection:e=>e.projectionMode===l.K.CUSTOM_GEOSPATIAL,uniformTypes:{wrapLongitude:"f32",coordinateFrame:"i32",commonUnitsPerMeter:"vec3<f32>",projectionMode:"i32",scale:"f32",commonUnitsPerWorldUnit:"vec3<f32>",commonUnitsPerWorldUnit2:"vec3<f32>",center:"vec4<f32>",modelMatrix:"mat4x4<f32>",viewProjectionMatrix:"mat4x4<f32>",viewportSize:"vec2<f32>",devicePixelRatio:"f32",focalDistance:"f32",cameraPosition:"vec3<f32>",coordinateOrigin:"vec3<f32>",commonOrigin:"vec3<f32>",pseudoMeters:"f32",sizeScaleSize:"i32",sizeScaleTransform:"vec4<f32>"}}},74334(e,t,i){i.d(t,{aY:()=>h,ow:()=>p});var r=i(36526),n=i(70998),s=i(60275),o=i(97625),a=i(82417);let l=[0,0,0,0],u=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],c=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],f=[0,0,0],d=(0,a.A)(function({viewport:e,devicePixelRatio:t,coordinateSystem:i,coordinateOrigin:o}){let{projectionCenter:a,viewProjectionMatrix:f,originCommon:d,cameraPosCommon:h,shaderCoordinateOrigin:_,geospatialOrigin:g}=function(e,t,i){let{viewMatrixUncentered:s,projectionMatrix:o}=e,{viewMatrix:a,viewProjectionMatrix:c}=e,f=l,d=l,h=e.cameraPosition,{geospatialOrigin:_,shaderCoordinateOrigin:g,commonOrigin:m,offsetMode:b}=p(e,t,i);return b&&(d=m||e.projectPosition(_||g),h=[h[0]-d[0],h[1]-d[1],h[2]-d[2]],d[3]=1,f=n.Z0([],d,c),a=s||a,c=r.lw([],o,a),c=r.lw([],c,u)),{viewMatrix:a,viewProjectionMatrix:c,projectionCenter:f,originCommon:d,cameraPosCommon:h,shaderCoordinateOrigin:g,geospatialOrigin:_}}(e,i,o),m=e.getDistanceScales(),b=[e.width*t,e.height*t],v=n.Z0([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,y={coordinateFrame:function(e,t){switch(e){case"lnglat":case"lnglat-offsets":return s.r.GEODETIC;case"meter-offsets":return s.r.IDENTITY;case"cartesian":switch(t.crs?.coordinateFrame){case"geographic":return s.r.GEODETIC;case"geocentric":return s.r.GEOCENTRIC;case"projected":return s.r.PROJECTED;default:return s.r.IDENTITY}default:throw Error(`Invalid coordinateSystem: ${e}`)}}(i,e),projectionMode:function(e,t){switch(t){case"meter-offsets":switch(e){case s.K.GLOBE:return s.K.GLOBE_METER_OFFSETS;case s.K.WEB_MERCATOR:case s.K.WEB_MERCATOR_AUTO_OFFSET:case s.K.CUSTOM_GEOSPATIAL:return s.K.METER_OFFSETS}break;case"lnglat-offsets":switch(e){case s.K.WEB_MERCATOR:case s.K.WEB_MERCATOR_AUTO_OFFSET:return s.K.GEODETIC_OFFSETS}}return e}(e.projectionMode,i),coordinateOrigin:_,commonOrigin:d.slice(0,3),center:a,pseudoMeters:!!e._pseudoMeters,sizeScaleSize:1,sizeScaleTransform:[1,1,0,0],viewportSize:b,devicePixelRatio:t,focalDistance:v,commonUnitsPerMeter:m.unitsPerMeter,commonUnitsPerWorldUnit:m.unitsPerWorldUnit,commonUnitsPerWorldUnit2:m.unitsPerWorldUnit2,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:f,modelMatrix:c,cameraPosition:h};if(g){let t=e.projectionMode===s.K.CUSTOM_GEOSPATIAL?e.crs.converter.WGS84.from(g):g,r=e.getDistanceScales(t);switch(i){case"meter-offsets":y.commonUnitsPerWorldUnit=r.unitsPerMeter,y.commonUnitsPerWorldUnit2=r.unitsPerMeter2,e.projectionMode===s.K.CUSTOM_GEOSPATIAL&&(y.commonUnitsPerMeter=r.unitsPerMeter);break;case"lnglat":case"lnglat-offsets":e._pseudoMeters||(y.commonUnitsPerMeter=r.unitsPerMeter),y.commonUnitsPerWorldUnit=r.unitsPerWorldUnit,y.commonUnitsPerWorldUnit2=r.unitsPerWorldUnit2;break;case"cartesian":y.commonUnitsPerWorldUnit=[1,1,r.unitsPerMeter[2]],y.commonUnitsPerWorldUnit2=[0,0,r.unitsPerMeter2[2]]}}if(e.projectionMode===s.K.GLOBE&&"meter-offsets"===i){let e=o[0]*Math.PI/180,t=o[1]*Math.PI/180,i=Math.cos(t),r=((o[2]||0)/6370972+1)*256;y.commonOrigin=[Math.sin(e)*i*r,-Math.cos(e)*i*r,Math.sin(t)*r]}return y});function p(e,t,i=f,r){let n,a;i.length<3&&(i=[i[0],i[1],0]);let l=i,u=(0,o.ic)(t,e,r);t=u.coordinateSystem,u.preprojected&&(i=f);let c=!0;switch(t){case"lnglat-offsets":case"meter-offsets":a=i;break;default:a=e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null}switch(e.projectionMode){case s.K.WEB_MERCATOR:switch(t){case"lnglat":a=[0,0,0],c=!1;break;case"cartesian":c=!1,a=e.unprojectPosition([Math.fround(e.center[0]),Math.fround(e.center[1]),0])}break;case s.K.WEB_MERCATOR_AUTO_OFFSET:switch(t){case"lnglat":l=a;break;case"cartesian":l=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],a=e.unprojectPosition(l),l[0]-=i[0],l[1]-=i[1],l[2]-=i[2]}break;case s.K.IDENTITY:(l=e.position.map(Math.fround))[2]=l[2]||0;break;case s.K.CUSTOM_GEOSPATIAL:{if("meter-offsets"===t){l=f,n=e.projectPosition(i);break}a=null;let r=e.distanceScales.unitsPerWorldUnit;n=(l=e.center.map((e,t)=>Math.fround(e/r[t]-i[t]))).map((e,t)=>(e+i[t])*r[t]);break}case s.K.GLOBE:c=!1,a=null;break;default:c=!1}return{geospatialOrigin:a,shaderCoordinateOrigin:l,commonOrigin:n,offsetMode:c}}function h({viewport:e,devicePixelRatio:t=1,modelMatrix:i=null,coordinateSystem:r="default",coordinateOrigin:n=f,autoWrapLongitude:a=!1,sourceCrs:l}){let u=(0,o.ic)(r,e,l);if("lnglat-offsets"===(r=u.coordinateSystem)&&e.projectionMode===s.K.GLOBE&&(r="lnglat"),!u.preprojected&&"lnglat"===r&&n.some(e=>0!==e)){let e=Array.from(i||c);e[12]+=n[0],e[13]+=n[1],e[14]+=n[2]||0,i=e,n=f}u.preprojected&&(n=f,i=null,a=!1);let p=d({viewport:e,devicePixelRatio:t,coordinateSystem:r,coordinateOrigin:n});return p.wrapLongitude=a,p.modelMatrix=i||c,p}},84175(e,t,i){i.d(t,{A:()=>o});var r=i(52948);let n=`\
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
`,o={name:"project32",dependencies:[r.A],source:n,vs:s}},10062(e,t,i){i.d(t,{U:()=>n});var r=i(88203);function n(e){var t,i;if(null===(t=e)||"object"!=typeof t)throw Error("count(): argument not an object");if((0,r._)(e))return e.numRows;if("function"==typeof e.count)return e.count();if(Number.isFinite(e.size))return e.size;if(Number.isFinite(e.length))return e.length;if(null!==(i=e)&&"object"==typeof i&&i.constructor===Object)return Object.keys(e).length;throw Error("count(): argument not a container")}},38055(e,t,i){function r(e,t=()=>!0){return Array.isArray(e)?function e(t,i,r){let n=-1;for(;++n<t.length;){let s=t[n];Array.isArray(s)?e(s,i,r):i(s)&&r.push(s)}return r}(e,t,[]):t(e)?[e]:[]}function n({target:e,source:t,start:i=0,count:r=1}){let s=t.length,o=r*s,a=0;for(let r=i;a<s;a++)e[r++]=t[a];for(;a<o;)a<o-a?(e.copyWithin(i+a,i,i+a),a*=2):(e.copyWithin(i+a,i,i+o-a),a=o);return e}i.d(t,{B:()=>r,R:()=>n})},53439(e,t,i){i.d(t,{I:()=>a,Td:()=>o,X:()=>s});let r=[],n=[];function s(e,t=0,i=1/0){let o=r,a={index:-1,data:e,target:[]};return e?"function"==typeof e[Symbol.iterator]?o=e:e.length>0&&(n.length=e.length,o=n):o=r,(t>0||Number.isFinite(i))&&(o=(Array.isArray(o)?o:Array.from(o)).slice(t,i),a.index=t-1),{iterable:o,objectInfo:a}}function o(e){return e&&e[Symbol.asyncIterator]}function a(e,t){let{size:i,stride:r,offset:n,startIndices:s,nested:o}=t,a=e.BYTES_PER_ELEMENT,l=r?r/a:i,u=n?n/a:0,c=Math.floor((e.length-u)/l);return(t,{index:r,target:n})=>{let a;if(!s){let t=r*l+u;for(let r=0;r<i;r++)n[r]=e[t+r];return n}let f=s[r],d=s[r+1]||c;if(o){a=Array(d-f);for(let t=f;t<d;t++){let r=t*l+u;n=Array(i);for(let t=0;t<i;t++)n[t]=e[r+t];a[t-f]=n}}else if(l===i)a=e.subarray(f*i+u,d*i+u);else{a=new e.constructor((d-f)*i);let t=0;for(let r=f;r<d;r++){let n=r*l+u;for(let r=0;r<i;r++)a[t++]=e[n+r]}}return a}}},82417(e,t,i){i.d(t,{A:()=>r});function r(e){let t,i={};return r=>{for(let n in r)if(!function(e,t){if(e===t)return!0;if(Array.isArray(e)){let i=e.length;if(!t||t.length!==i)return!1;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}return!1}(r[n],i[n])){t=e(r),i=r;break}return t}}},66540(e,t,i){i.d(t,{n:()=>r});function r(e,t){if(!t)return e;let i={...e,...t};if("defines"in t&&(i.defines={...e.defines,...t.defines}),"modules"in t&&(i.modules=(e.modules||[]).concat(t.modules),t.modules.some(e=>"project64"===e.name))){let e=i.modules.findIndex(e=>"project32"===e.name);e>=0&&i.modules.splice(e,1)}if("plugins"in t&&(i.plugins=[...new Set([...e.plugins||[],...t.plugins||[]])]),"inject"in t)if(e.inject){let r={...e.inject};for(let e in t.inject)r[e]=(r[e]||"")+t.inject[e];i.inject=r}else i.inject=t.inject;return i}},8982(e,t,i){i.d(t,{M:()=>s});var r=i(70940),n=i(46779);class s{static async createAsync(e,t){let i,n=!r.N.getAsyncCompilation(e),o=n?r.N.beginAsyncCompilation(e):r.N.getAsyncCompilation(e);try{i=new s(e,t)}finally{n&&r.N.endAsyncCompilation(e,o)}try{return n?await Promise.all(o):await i._pipelineInitialization,i}catch(e){throw i.destroy(),e}}device;id;source;pipelineFactory;shaderFactory;shader;pipeline;_pipelineInitialization;_destroyed=!1;constructor(e,t){if("webgpu"!==e.type)throw Error("Kernel is only supported in WebGPU");let{source:i,pipelineFactory:s,shaderFactory:o,debugShaders:a,...l}=t;this.device=e,this.id=t.id??"kernel",this.source=i,this.pipelineFactory=s??r.N.getDefaultPipelineFactory(e),this.shaderFactory=o??n.g.getDefaultShaderFactory(e),this.shader=this.shaderFactory.createShader({id:`${this.id}-compute`,stage:"compute",source:this.source,debugShaders:a});let u={...l,shader:this.shader},c=r.N.getAsyncCompilation(e);if(c){let e=this.pipelineFactory.createComputePipelineAsync(u);this._pipelineInitialization=e,c.push(e.then(e=>(this.pipeline=e,e)))}else this.pipeline=this.pipelineFactory.createComputePipeline(u)}dispatch(e,t){this._setPipeline(e,t.bindings),e.dispatch(t.x,t.y,t.z)}dispatchIndirect(e,t){this._setPipeline(e,t.bindings),e.dispatchIndirect(t.indirectBuffer,t.indirectOffset??0)}destroy(){this._destroyed||(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),this._destroyed=!0)}_setPipeline(e,t={}){e.setPipeline(this.pipeline),e.setBindings(t)}}},61439(e,t,i){i.d(t,{z:()=>s});var r=i(72246),n=i(35098);class s{isConstant=!0;format;value;byteLength;constructor({format:e,value:t}){var i;let s=(0,n.Ft)(e);if(s.fixedSizeList)throw Error("GPUConstant cannot represent fixed-size-list storage columns");let o="unorm10-10-10-2"===(i=e)?Uint32Array:(0,r.Y0)((0,n.Ft)(i).type);if(t.constructor!==o)throw Error(`GPUConstant format "${e}" requires ${o.name}, received ${t.constructor.name}`);if(t.byteLength!==s.byteLength)throw Error(`GPUConstant format "${e}" requires exactly ${s.byteLength} bytes, received ${t.byteLength}`);let a=t.constructor;this.format=e,this.value=new a(t),this.byteLength=this.value.byteLength}}},49201(e,t,i){i.d(t,{I:()=>n});var r=i(61954);class n{buffer;format;length;byteOffset;byteStride;constructor(e){let t=r.E.getVertexFormatInfo(e.format).byteLength,i=e.byteOffset??0,n=e.byteStride??t;if(s(e.length,"GPUDataView length"),s(i,"GPUDataView byteOffset"),s(n,"GPUDataView byteStride"),n<t)throw Error(`GPUDataView byteStride ${n} is smaller than ${e.format} byte length ${t}`);let o=0===e.length?0:(e.length-1)*n+t,a=i+o;if(!Number.isSafeInteger(o)||!Number.isSafeInteger(a))throw Error("GPUDataView byte range must use safe integers");if(a>e.buffer.byteLength)throw Error("GPUDataView exceeds its backing buffer byte length");this.buffer=e.buffer,this.format=e.format,this.length=e.length,this.byteOffset=i,this.byteStride=n}get elementByteLength(){return r.E.getVertexFormatInfo(this.format).byteLength}get byteLength(){return 0===this.length?0:(this.length-1)*this.byteStride+this.elementByteLength}}function s(e,t){if(!Number.isSafeInteger(e)||e<0)throw Error(`${t} must be a non-negative safe integer`)}},88461(e,t,i){i.d(t,{L:()=>f});var r=i(49201),n=i(61954),s=i(15506);function o(e){return!!(e&&"object"==typeof e&&"struct"===e.type)}function a(e,t){return 1===t?e:`vec${t}<${e}>`}function l(e,t){return Math.ceil(e/t)*t}var u=i(35098);class c{buffer;ownsDataBuffer;constructor(e,t){this.buffer=e,this.ownsDataBuffer=t}get ownsBuffer(){return this.ownsDataBuffer}transferBufferOwnership(e){if(e.buffer!==this.buffer)throw Error("GPUData ownership can only be transferred to the same buffer");e.ownsDataBuffer=this.ownsDataBuffer,this.ownsDataBuffer=!1}destroy(){this.ownsDataBuffer&&(this.buffer.destroy(),this.ownsDataBuffer=!1)}}let f=class extends c{dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;readbackMetadata;valueOffsets;nullBitmap;valueByteLength;constructor(e){let t,{buffer:i,format:r,length:c,valueLength:f,stride:d,byteOffset:p=0,byteStride:h,rowByteLength:_,ownsBuffer:g=!1,readbackMetadata:m,valueOffsets:b,nullBitmap:v,valueByteLength:y,dataType:E}=e;super(i,g);let w=o(t=r?"string"==typeof r?r:function(e,t){let i=Object.entries(e);if(0===i.length)throw Error("GPUData struct format must declare at least one field");return"packed"===t?function(e){let t=[],i=0,r=0;for(let[s,o]of e){let e=n.E.getVertexFormatInfo(o);if(e.webglOnly)throw Error(`Packed GPUData struct field "${s}" uses WebGL-only format ${o}`);i=l(i,Math.min(4,e.byteLength)),t.push([s,Object.freeze({format:o,byteOffset:i,byteLength:e.byteLength})]),i+=e.byteLength,r+=e.components}return Object.freeze({type:"struct",layout:"packed",fields:Object.freeze(Object.fromEntries(t)),components:r,byteStride:l(i,4),rowByteLength:i})}(i):function(e){let t=Object.fromEntries(e.map(([e,t])=>[e,function(e){let t=n.E.getVertexFormatInfo(e);switch(t.type){case"float32":return a("f32",t.components);case"sint32":return a("i32",t.components);case"uint32":return a("u32",t.components);default:return a("u32",Math.ceil(t.byteLength/4))}}(t)])),i=(0,s.Pr)(t,{layout:"wgsl-storage"}),r=[],o=0,l=0;for(let[t,s]of e){let e=n.E.getVertexFormatInfo(s),a=4*i.fields[t].offset;r.push([t,Object.freeze({format:s,byteOffset:a,byteLength:e.byteLength})]),o=Math.max(o,a+e.byteLength),l+=e.components}return Object.freeze({type:"struct",layout:"wgsl-storage",fields:Object.freeze(Object.fromEntries(r)),components:l,byteStride:i.byteLength,rowByteLength:o})}(i)}(r,e.layout??"wgsl-storage"):void 0)?t:void 0,x="string"==typeof t?(0,u.Ft)(t):void 0;if(this.dataType=E,this.format=t,this.length=c,this.valueLength=f??c*(x?.listSize??1),this.stride=d??(x?x.components*(x.listSize??1):void 0)??w?.components??h??_??1,this.byteOffset=p,this.rowByteLength=_??w?.rowByteLength??x?.byteLength??h??this.stride,this.byteStride=h??w?.byteStride??this.rowByteLength,x?.fixedSizeList){let e=c*x.listSize;if(!Number.isSafeInteger(c)||c<0||!Number.isSafeInteger(e)||!Number.isSafeInteger(this.byteOffset)||this.byteOffset<0||!Number.isSafeInteger(this.byteStride)||!Number.isSafeInteger(this.rowByteLength)||!Number.isSafeInteger(this.stride))throw Error("GPUData fixed-size-list row layout must use safe non-negative integers");if(this.valueLength!==e)throw Error("GPUData fixed-size-list valueLength must equal its flattened row elements");if(this.stride<x.components*x.listSize)throw Error("GPUData fixed-size-list stride cannot truncate its row components");if(this.rowByteLength<x.byteLength)throw Error("GPUData fixed-size-list rowByteLength cannot truncate its row payload");if(this.byteStride<this.rowByteLength)throw Error("GPUData fixed-size-list byteStride cannot overlap its row payload");let t=0===c?0:(c-1)*this.byteStride+this.rowByteLength,r=this.byteOffset+t;if(!Number.isSafeInteger(t)||!Number.isSafeInteger(r))throw Error("GPUData fixed-size-list byte range must use safe integers");if(r>i.byteLength)throw Error("GPUData fixed-size-list exceeds its backing buffer byte length")}if(w){if(this.rowByteLength<w.rowByteLength)throw Error(`GPUData rowByteLength ${this.rowByteLength} is smaller than struct format row byte length ${w.rowByteLength}`);if(this.byteStride<Math.max(w.byteStride,this.rowByteLength))throw Error(`GPUData byteStride ${this.byteStride} is smaller than its struct row layout`)}this.readbackMetadata=m,this.valueOffsets=b,this.nullBitmap=v,this.valueByteLength=y}getChild(e){if(!o(this.format))return null;let t=this.format.fields[e];return t?new r.I({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}getChildAt(e){if(!o(this.format))return null;let t=Object.values(this.format.fields)[e];return t?new r.I({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}}},35098(e,t,i){i.d(t,{Ft:()=>u,Tm:()=>a,u4:()=>l});var r=i(61954);let n=/^vertex-list<([^<>]+)>$/,s=/^value-list<([^<>]+)>$/,o=/^fixed-size-list<([^<>,]+),([1-9][0-9]*)>$/;function a(e){return n.test(e)}function l(e){return s.test(e)}function u(e){let t=function(e){let t=n.exec(e),i=s.exec(e),o=c(e),a=o?.elementFormat??t?.[1]??i?.[1]??e;try{r.E.getVertexFormatInfo(a)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return a}(e),i=a(e),o=l(e),u=c(e),f=r.E.getVertexFormatInfo(t),d=f.byteLength*(u?.listSize??1);if(!Number.isSafeInteger(d))throw Error(`Unsupported GPUVector format ${e}`);let p=f.type,h=f.normalized,_=function(e,t){if(t)return"f32";switch(e){case"float32":return"f32";case"float16":return"f16";case"uint8":case"uint16":case"uint32":return"u32";case"sint8":case"sint16":case"sint32":return"i32";default:throw Error(`Unsupported GPUVector component type ${e}`)}}(p,h);return{format:e,elementFormat:t,vertexList:i,valueList:o,fixedSizeList:!!u,...u?{listSize:u.listSize}:{},type:p,signedDataType:function(e,t){if("unorm10-10-10-2"===e)return"uint32";switch(t){case"unorm8":return"uint8";case"snorm8":return"sint8";case"unorm16":return"uint16";case"snorm16":return"sint16";default:return t}}(t,p),primitiveType:_,components:f.components,elementByteLength:f.byteLength,byteLength:d,integer:f.integer,signed:f.signed,normalized:h,...f.webglOnly?{webglOnly:!0}:{}}}function c(e){let t=o.exec(e);if(!t)return;let i=Number(t[2]);if(!Number.isSafeInteger(i))return;let n=t[1];try{let e=r.E.getVertexFormatInfo(n);if(!Number.isSafeInteger(i*e.components)||!Number.isSafeInteger(i*e.byteLength))return}catch{return}return{elementFormat:n,listSize:i}}},51002(e,t,i){i.d(t,{M:()=>s});var r=i(88461),n=i(35098);class s{name;dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;bufferLayout;data=[];device;bufferProps;isAppendable=!1;ownsDataChunks=!0;ownedVectors=[];appendableByteLength=0;get chunks(){var e;let t;return e=this.data,t=0,Object.freeze(e.map(e=>{let i=Object.freeze({offset:t,length:e.length,data:e});return t+=e.length,i}))}constructor(e){switch(e.type){case"buffer":{let{name:t,buffer:i,format:n,length:s,valueLength:a,byteOffset:l=0,ownsBuffer:u=!1}=e,{stride:c,byteStride:f,rowByteLength:d,listSize:p}=o(e),h=a??s*(p??1);this.name=t,this.dataType=e.dataType,this.format=n,this.length=s,this.valueLength=h,this.stride=c,this.byteOffset=l,this.byteStride=f,this.rowByteLength=d,this.data.push(new r.L({buffer:i,format:n,length:s,valueLength:h,stride:c,byteOffset:l,byteStride:f,rowByteLength:d,ownsBuffer:u,dataType:e.dataType}));return}case"interleaved":{let{name:t,buffer:i,format:s,length:o,valueLength:a,byteOffset:l=0,byteStride:u,attributes:c,ownsBuffer:f=!1}=e,d=s?(0,n.Ft)(s):void 0,p=a??o*(d?.listSize??1),h=d?.fixedSizeList?d.components*d.listSize:u,_=d?.fixedSizeList?d.byteLength:u;this.name=t,this.dataType=e.dataType,this.format=s,this.length=o,this.valueLength=p,this.stride=h,this.byteOffset=l,this.byteStride=u,this.rowByteLength=_,this.bufferLayout={name:t,byteStride:u,attributes:c},this.data.push(new r.L({buffer:i,format:s,length:o,valueLength:p,stride:h,byteOffset:l,byteStride:u,rowByteLength:_,ownsBuffer:f,dataType:e.dataType}));return}case"data":{var t;let i=e.format??(t=e.data,t[0]?.format),r=i?(0,n.Ft)(i):void 0,{name:s,data:o,stride:a=o[0]?.stride??(r?r.components*(r.listSize??1):1),valueLength:l=o.reduce((e,t)=>e+t.valueLength,0),byteStride:u=o[0]?.byteStride??r?.byteLength,rowByteLength:c=o[0]?.rowByteLength??r?.byteLength,bufferLayout:f,ownsData:d=!1}=e;if(void 0===u||void 0===c)throw Error("GPUVector requires format or explicit byte layout metadata");i&&function(e,t){if(e.find(e=>e.format!==t))throw Error("GPUVector data chunks must share the declared format")}(o,i),this.name=s,this.dataType=e.dataType,this.format=i,this.length=o.reduce((e,t)=>e+t.length,0),this.valueLength=l,this.stride=a,this.byteOffset=1===o.length?o[0].byteOffset:0,this.byteStride=u,this.rowByteLength=c,this.bufferLayout=f,this.ownsDataChunks=d,this.data.push(...o);return}case"appendable":{let{name:t,device:i,format:r,valueLength:n=0,bufferProps:s}=e,{stride:a,byteStride:l,rowByteLength:u}=o(e);this.name=t,this.dataType=e.dataType,this.format=r,this.length=0,this.valueLength=n,this.stride=a,this.byteOffset=0,this.byteStride=l,this.rowByteLength=u,this.device=i,this.bufferProps=s,this.isAppendable=!0;return}}}get ownsBuffer(){return this.ownsDataChunks&&this.data.some(e=>e.ownsBuffer)||this.ownedVectors.some(e=>e.ownsBuffer)}get capacityRows(){return this.isAppendable?this.length:void 0}get appendedByteLength(){return this.appendableByteLength}addData(e){if(this.format&&e.format!==this.format)throw Error("GPUVector.addData() requires matching formats");if(e.byteStride!==this.byteStride)throw Error("GPUVector.addData() requires matching byteStride");if(e.rowByteLength!==this.rowByteLength)throw Error("GPUVector.addData() requires matching rowByteLength");return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this}appendDataChunk(e,t=this.appendableByteLength+e.buffer.byteLength){if(!this.isAppendable)throw Error("GPUVector.appendDataChunk() requires appendable vector storage");if(this.format&&e.format!==this.format)throw Error("GPUVector.appendDataChunk() requires matching formats");if(e.byteStride!==this.byteStride||e.rowByteLength!==this.rowByteLength)throw Error("GPUVector.appendDataChunk() requires matching byte layout metadata");return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this.appendableByteLength=t,this}resetLastBatch(){if(!this.isAppendable)throw Error("GPUVector.resetLastBatch() requires appendable vector storage");for(let e of this.data.splice(0))e.destroy();return this.length=0,this.valueLength=0,this.appendableByteLength=0,this}retainOwnedVectors(e){return this.ownedVectors.push(...e),this}transferBufferOwnership(e){let t=this.data[0],i=e.data[0];if(!t||!i||t.buffer!==i.buffer)throw Error("GPUVector ownership can only be transferred to the same buffer");t.transferBufferOwnership(i)}destroy(){if(this.ownsDataChunks)for(let e of this.data)e.destroy();for(let e of this.ownedVectors.splice(0))e.destroy()}}function o(e){let t=e.format?(0,n.Ft)(e.format):void 0,i=e.rowByteLength??(t?.fixedSizeList?t.byteLength:e.byteStride)??t?.byteLength;if(void 0===i)throw Error("GPUVector requires format or explicit rowByteLength");return{stride:e.stride??(t?t.components*(t.listSize??1):1),byteStride:e.byteStride??i,rowByteLength:i,...t?.listSize?{listSize:t.listSize}:{}}}},46296(e,t,i){i.d(t,{GL:()=>f,uy:()=>d});var r=i(89362),n=i(72246),s=i(7036),o=i(49201),a=i(51002),l=i(88461),u=i(35098),c=i(96002);class f{static get bufferPoolSize(){return c.R.poolSize}static set bufferPoolSize(e){if(!Number.isSafeInteger(e)||e<0)throw Error("GPUDataEvaluator.bufferPoolSize must be a non-negative safe integer");c.R.poolSize=e,c.R.purge()}type;size;get offset(){return this._offset}get stride(){return this._stride}normalized;isConstant;length;get byteLength(){return this._byteLength}ValueType;source=null;format;_id;_destroyed=!1;_evaluationScope;_value;_offset;_stride;_byteLength;_gpuVector;_bufferOwnership="owned";_targetBuffer;static fromArray(e,{type:t,size:i=1,offset:r=0,stride:s=0,normalized:o=!1}){let a,l=t;return Array.isArray(e)?(l=l||"float32",a=new((0,n.Y0)(l))(e)):e instanceof Float64Array?(l="uint32",i*=2,r*=2,s*=2,a=new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4)):(l=l||(0,n.UE)(e),a=e),new f({id:`<${l} * ${i}>`,type:l,size:i,offset:r,stride:s,normalized:o,value:a})}static fromConstant(e,t="float32"){let i,r=(0,n.Y0)(t);return Array.isArray(e)?i=`[${e.join(",")}]`:(i=String(e),e=[e]),new f({id:i,isConstant:!0,type:t,size:e.length,value:new r(e)})}static fromGPUData(e,t={}){return function(e){if(!e.format)throw Error("GPUDataEvaluator.fromGPUData() requires GPUData format metadata");if((0,u.Tm)(e.format)||(0,u.u4)(e.format))throw Error("GPUDataEvaluator.fromGPUData() does not support variable-length input");let t=(0,u.Ft)(e.format).byteLength;if(e.rowByteLength!==t)throw Error(`GPUDataEvaluator.fromGPUData() requires rowByteLength ${t} for GPUData`)}(e),new f({...p(new o.I({buffer:e.buffer,format:e.format,length:e.length,byteOffset:e.byteOffset,byteStride:e.byteStride})),id:t.id,gpuData:e})}static fromGPUDataView(e,t={}){return new f({...p(e),id:t.id,buffer:e.buffer})}constructor(e){let{id:t,value:i,buffer:r,gpuData:s,format:o,source:l=null,isConstant:u=!1}=e;if(!l&&!i&&!r&&!s)throw Error("GPUDataEvaluator must have a value source");let{type:c,size:d,offset:p,stride:h,normalized:_,length:g}=e;if(l instanceof f?(c=c??l.type,d=d??l.size,p=p??l.offset,h=h??l.stride,_=_??l.normalized,g=g??l.length):(d=d??1,p=p??0,_=_??!1,g=u?1:g),!c)throw Error("GPUDataEvaluator: type not defined");if(this._id=t,this.type=c,this.size=d,this.ValueType=(0,n.Y0)(this.type),this._offset=p,this._stride=h||this.ValueType.BYTES_PER_ELEMENT*d,this.normalized=_,this.source=l,this.format=o,void 0===g)if(u)g=1;else{if(!i)throw Error("GPUDataEvaluator: length not defined");g=Math.ceil(i.byteLength/this.stride)}this.isConstant=u,this.length=g;let m=this.ValueType.BYTES_PER_ELEMENT*this.size;this._byteLength=0===g?0:(g-1)*this.stride+m,this._value=i,this._bufferOwnership=l instanceof f||r||s?"borrowed":"owned",s?this._gpuVector=new a.M({type:"data",name:this._id??"data",format:s.format,data:[s],stride:s.stride,byteStride:s.byteStride,rowByteLength:s.rowByteLength}):r&&(this._gpuVector=this.createGPUVectorView({buffer:r,name:this._id,format:this.format}))}get value(){return this._value||(this.source instanceof f?this.source.value:void 0)}get evaluated(){return!!this._gpuVector}getInspection(){return(0,r.r)([this])}get id(){return this._id}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}get buffer(){return h(this.gpuVector)}setTargetBuffer({buffer:e,byteOffset:t=0,byteStride:i=this.stride}){if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)throw Error(`GPUDataEvaluator ${this} already evaluated`);if(!this.source||this.source instanceof f)throw Error("GPUDataEvaluator target buffers require a deferred operation source");this._targetBuffer={buffer:e,byteOffset:t,byteStride:i}}async evaluate(e,t={}){let i;if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this.assertScopeAccess(t.scope),t.scope&&(t.scope.assertEvaluating(e),!this._evaluationScope)){let e=!!this._gpuVector,i={offset:this._offset,stride:this._stride,byteLength:this._byteLength,ownership:this._bufferOwnership,target:this._targetBuffer};this._evaluationScope=t.scope,t.scope.retain(t=>{this._evaluationScope=void 0,t||e||!this._gpuVector||("owned"===this._bufferOwnership&&c.R.recycle(h(this._gpuVector)),this._gpuVector=void 0),t||e||(this._offset=i.offset,this._stride=i.stride,this._byteLength=i.byteLength,this._bufferOwnership=i.ownership,this._targetBuffer=i.target)})}if(this._gpuVector){if(t.scope&&this.source instanceof f&&await this.source.evaluate(e,{scope:t.scope}),t.scope&&this.buffer.device!==e)throw Error("Evaluator buffer belongs to a different device");return this._gpuVector}if(this.source instanceof f){let i=await this.source.evaluate(e,{scope:t.scope});return this._gpuVector=this.createGPUVectorView({...t,buffer:h(i)}),this._gpuVector}if(i=this._getEvaluationBuffer(e),this._value)i.write(this._value);else{let r;try{r=await this.source.execute(e,i,t.scope)}catch(e){throw t.scope&&"owned"===this._bufferOwnership&&c.R.recycle(i),e}if(!r.success)throw t.scope&&"owned"===this._bufferOwnership&&c.R.recycle(i),r.error||Error(`${this.source} evaluation failed`);r.value&&(this._value=r.value)}return this._gpuVector=this.createGPUVectorView({...t,buffer:i}),this._gpuVector}evaluateSync(e,t={}){let i;if(t.scope)throw Error("Use scope.evaluate() for deferred submission");if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;if(this.source instanceof f){let i=this.source.evaluateSync(e);return this._gpuVector=this.createGPUVectorView({...t,buffer:h(i)}),this._gpuVector}if(i=this._getEvaluationBuffer(e),this._value)i.write(this._value);else{let t=this.source.executeSync(e,i);if(!t.success)throw t.error||Error(`${this.source} evaluation failed`);t.value&&(this._value=t.value)}return this._gpuVector=this.createGPUVectorView({...t,buffer:i}),this._gpuVector}createGPUVectorView(e){let t=e.name??this._id??"vector",i=e.format??this.format??function(e,t,i=!1){return t>=1&&t<=4?_(e,t,i):void 0}(this.type,this.size,this.normalized);if(e.interleaved){var r;let i,n="object"==typeof e.interleaved&&e.interleaved.attributes?e.interleaved.attributes:(r=this,function e(t,i,r){let n=t.source;if(n&&!(n instanceof f)&&"interleave"===n.name){for(let t of Object.values(n.inputs))t instanceof f&&e(t,i,r);return}i.push({attribute:t.id??t.toString(),format:_(t.type,t.size,t.normalized),byteOffset:r.byteOffset}),r.byteOffset+=t.ValueType.BYTES_PER_ELEMENT*t.size}(r,i=[],{byteOffset:0}),i);return new a.M({type:"interleaved",name:t,buffer:e.buffer,format:e.format??this.format,length:this.length,byteOffset:this.offset,byteStride:this.stride,attributes:n,ownsBuffer:!1})}return new a.M({type:"buffer",name:t,buffer:e.buffer,format:i,length:this.length,stride:this.size,byteOffset:this.offset,byteStride:this.stride,rowByteLength:this.ValueType.BYTES_PER_ELEMENT*this.size,ownsBuffer:!1})}_getEvaluationBuffer(e){let t=this._targetBuffer;if(!t)return c.R.createOrReuse(e,Math.max(this.offset+this.byteLength,this._value?.byteLength??0));if(t.buffer.device!==e)throw Error("GPUDataEvaluator target buffer belongs to a different device");let i=this.ValueType.BYTES_PER_ELEMENT*this.size,r=0===this.length?0:(this.length-1)*t.byteStride+i;if(t.byteOffset+r>t.buffer.byteLength)throw Error("GPUDataEvaluator target buffer is too small for the output layout");return this._offset=t.byteOffset,this._stride=t.byteStride,this._byteLength=r,this._bufferOwnership="borrowed",this._targetBuffer=void 0,t.buffer}async readValue(e=0,t){this.assertScopeAccess();let{ValueType:i}=this,{size:r,offset:n,stride:s,length:o}=this,a=i.BYTES_PER_ELEMENT*r;if(t=t??o,t=Math.max(e=Math.max(0,Math.min(o,e)),Math.min(o,t)),this._value)return function(e,t,i,r){let{ValueType:n,size:s,offset:o,stride:a}=e,l=a/n.BYTES_PER_ELEMENT,u=o/n.BYTES_PER_ELEMENT,c=r-i;if(l===s){let e=u+i*l;return t.subarray(e,e+c*s)}let f=new n(c*s);for(let e=0;e<c;e++){let r=u+(i+e)*l;f.set(t.subarray(r,r+s),e*s)}return f}(this,this._value,e,t);let l=t-e;if(0===l)return new i(0);let u=n+e*s,c=await this.buffer.readAsync(u,s===a?l*a:(l-1)*s+a),f=new i(c.buffer,c.byteOffset,c.byteLength/i.BYTES_PER_ELEMENT);if(s===a)return f;let d=new Uint8Array(a*l);for(let e=0;e<l;e++){let t=e*s;d.set(c.subarray(t,t+a),e*a)}return new i(d.buffer)}async ensureCPUValue(){this.assertScopeAccess();let e=this.value;if(e)return e;let t=await this.buffer.readAsync(0,this.offset+this.byteLength);if(t.byteLength%this.ValueType.BYTES_PER_ELEMENT!=0)throw Error(`${this} backing buffer byte length is not aligned to its scalar type`);let i=t.slice();return this._value=new this.ValueType(i.buffer,i.byteOffset,i.byteLength/this.ValueType.BYTES_PER_ELEMENT),this._value}ensureCPUValueSync(){this.assertScopeAccess();let e=this.value;if(e)return e;throw Error(`${this} CPU value is not available for synchronous evaluation`)}assertScopeAccess(e){if(this._evaluationScope&&this._evaluationScope!==e)throw Error("Evaluator is retained by an unsubmitted scope")}toString(){return this._id??this.source?.toString()??this.constructor.name}invalidate(){if(this.assertScopeAccess(),this._destroyed)throw Error("Cannot invalidate a destroyed evaluator");if((this.source||"borrowed"===this._bufferOwnership)&&(this._value=void 0),(this.source||"borrowed"!==this._bufferOwnership)&&this._gpuVector){let e=h(this._gpuVector);"owned"===this._bufferOwnership?c.R.recycle(e):this.source instanceof f||(this._targetBuffer={buffer:e,byteOffset:this.offset,byteStride:this.stride}),this._gpuVector=void 0}}destroy(){this.assertScopeAccess(),this._gpuVector&&("owned"===this._bufferOwnership&&c.R.recycle(h(this._gpuVector)),this._gpuVector=void 0),this._targetBuffer=void 0,this._destroyed=!0}}function d(e){if(e instanceof f)return e;if("number"==typeof e||Array.isArray(e))return f.fromConstant(e);if(e instanceof l.L)return f.fromGPUData(e);if(e instanceof o.I)return f.fromGPUDataView(e);throw Error("getGPUDataEvaluator() requires GPUDataEvaluator, GPUData, GPUDataView, number, or number[]")}function p(e){let t=(0,u.Ft)(e.format),i=(0,n.Y0)(t.signedDataType),r=i.BYTES_PER_ELEMENT*t.components;if(t.byteLength!==r)throw Error(`GPUDataEvaluator does not support packed vertex format ${e.format}: ${t.byteLength} physical bytes cannot expose ${t.components} ${t.signedDataType} components`);if(e.byteOffset%i.BYTES_PER_ELEMENT!=0||e.byteStride%i.BYTES_PER_ELEMENT!=0)throw Error(`GPUDataEvaluator requires ${e.format} offset and stride aligned to ${i.BYTES_PER_ELEMENT} bytes`);return{type:t.signedDataType,size:t.components,offset:e.byteOffset,stride:e.byteStride,normalized:t.normalized,length:e.length,format:e.format}}function h(e){let t=function(e){let[t,...i]=e.data;if(!t||i.length>0)throw Error(`GPUDataEvaluator requires exactly one GPUData chunk for "${e.name}"`);return t}(e).buffer;return t instanceof s.kL?t.buffer:t}function _(e,t,i=!1){if(t<1||t>4)throw Error(`Cannot synthesize a GPUVector vertex format with ${t} components`);if("float16"===e&&3===t&&!i)return"uint16x3-webgl";let r=e;if(i)switch(e){case"uint8":r="unorm8";break;case"sint8":r="snorm8";break;case"uint16":r="unorm16";break;case"sint16":r="snorm16";break;case"float32":r="float32";break;default:throw Error(`Unsupported normalized vertex format for ${e}`)}return("uint8"===r||"sint8"===r||"uint16"===r||"sint16"===r||"unorm8"===r||"snorm8"===r||"unorm16"===r||"snorm16"===r)&&3===t?`${r}x3-webgl`:`${r}${1===t?"":`x${t}`}`}},89362(e,t,i){i.d(t,{r:()=>o});var r=i(58006),n=i(61954),s=i(46296);function o(e,t){let i=new Map,o=[],a=new Set;return Object.freeze({outputs:Object.freeze(e.map(function e(l){(0,r.v)(!a.has(l));let u=i.get(l);if(u)return u;let c=t?.(l,i.size)??`value-${i.size}`;a.add(l),i.set(l,c);let f=l.source,d=f instanceof s.GL,p=(d?[f]:f?.dependencies??[]).map(e);return o.push(Object.freeze({id:c,label:l.id,kind:d?"alias":f?"operation":"source",operation:f&&!d?f.name:void 0,dependencies:Object.freeze(p),type:l.type,size:l.size,format:function(e){if(e.format)return e.format;let t=e.size;if(1===t||2===t||3===t||4===t){if(3===t&&!e.normalized&&("uint8"===e.type||"sint8"===e.type))return"uint8"===e.type?"uint8x3-webgl":"sint8x3-webgl";try{return n.E.makeVertexFormat(e.type,t,e.normalized)}catch{return}}}(l),length:l.length,normalized:l.normalized,isConstant:l.isConstant,offset:l.offset,stride:l.stride,byteLength:l.byteLength,evaluated:l.evaluated})),a.delete(l),c})),nodes:Object.freeze(o)})}},8663(e,t,i){i.d(t,{E:()=>r});let r={add:{arity:2,symbol:"arithmetic_add"},subtract:{arity:2,symbol:"arithmetic_subtract"},multiply:{arity:2,symbol:"arithmetic_multiply"},divide:{arity:2,symbol:"arithmetic_divide"},pow:{arity:2,symbol:"pow"},sqrt:{arity:1,symbol:"sqrt"},abs:{arity:1,symbol:"abs"},sin:{arity:1,symbol:"sin"},cos:{arity:1,symbol:"cos"},tan:{arity:1,symbol:"arithmetic_tan"},exp:{arity:1,symbol:"exp"},log:{arity:1,symbol:"log"}}},24789(e,t,i){i.d(t,{K:()=>s});var r=i(6772),n=i(35098);let s=({inputs:e,output:t,target:i})=>o(e,t,i);async function o(e,t,i){let s=await e.source.ensureCPUValue(),o=(0,n.Ft)(e.inputFormat),l=(0,n.Ft)(e.outputFormat),u=new t.ValueType(t.length*t.size),c=e.source.offset/e.source.ValueType.BYTES_PER_ELEMENT,f=e.source.stride/e.source.ValueType.BYTES_PER_ELEMENT;for(let i=0;i<t.length;i++)for(let n=0;n<t.size;n++){let d=function(e,t,i){if("float16"===t)return(0,r.U)(e);if(!i)return e;let{minimum:n,maximum:s}=a(t);return Math.max(e/s,n<0?-1:0)}(s[c+i*f+n],e.source.type,o.normalized);u[i*t.size+n]=function(e,t,i){if("float16"===t.type)return(0,r.X)(e);if(!i&&"float32"===t.type)return e;let{minimum:n,maximum:s}=a(t.type),o=i?e*s:e;return Math.round(Math.min(s,Math.max(n,o)))}(d,t,l.normalized)}return i.write(u),{success:!0,value:u}}function a(e){switch(e){case"sint8":return{minimum:-127,maximum:127};case"sint16":return{minimum:-32767,maximum:32767};case"sint32":return{minimum:-0x80000000,maximum:0x7fffffff};case"uint8":return{minimum:0,maximum:255};case"uint16":return{minimum:0,maximum:65535};case"uint32":return{minimum:0,maximum:0xffffffff};default:throw Error(`castData CPU output does not support ${e}`)}}},76159(e,t,i){i.d(t,{K:()=>a});var r=i(58006),n=i(35098);class s{buffer;format;length;valueLength;byteOffset;byteStride;rowByteLength;valueOffsets;nullBitmap;constructor(e){let t=(0,n.Ft)(e.format),i=ArrayBuffer.isView(e.buffer)?e.buffer:void 0;this.buffer=i?i.buffer:e.buffer,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength??e.length*(t.listSize??1);let s=e.byteOffset??0;this.byteOffset=(i?.byteOffset??0)+s,this.rowByteLength=e.rowByteLength??t.byteLength,this.byteStride=e.byteStride??this.rowByteLength,this.valueOffsets=e.valueOffsets,this.nullBitmap=e.nullBitmap;let o=t.vertexList||t.valueList,a=o?this.valueLength:this.length;(0,r.v)([this.length,this.valueLength,s,this.rowByteLength,this.byteStride].every(e=>Number.isSafeInteger(e)&&e>=0)),(0,r.v)(this.rowByteLength>=t.byteLength&&this.byteStride>=this.rowByteLength),(0,r.v)(o||this.valueLength===this.length*(t.listSize??1)),(0,r.v)(s+(a?(a-1)*this.byteStride+this.rowByteLength:0)<=e.buffer.byteLength)}}var o=i(6772);let a=async({inputs:e,target:t})=>{let{source:i,inputFormat:a,outputFormat:l}=e,u=function(e,t,i){let a=(0,n.Ft)(e.format),l=i?.startsWith("float16")?"float16":a.signedDataType,u=i?.endsWith("x3")?3:a.components;(0,r.v)((3===u||4===u)&&["uint8","float16","float32"].includes(l));let c="uint8"===l?1:"float16"===l?2:4,f=new DataView(e.buffer,e.byteOffset),d="unorm8x4"===t?new Uint8Array(4*e.length):"float16x4"===t?new Uint16Array(4*e.length):new Float32Array(4*e.length),p=new DataView(new ArrayBuffer(4));for(let i=0;i<e.length;i++)for(let r=0;r<4;r++){let n=i*e.byteStride+r*c,s=r>=u?1:"uint8"===l?f.getUint8(n)/255:"float16"===l?(0,o.U)(f.getUint16(n,!0)):f.getFloat32(n,!0);d[4*i+r]="unorm8x4"===t?Math.round(255*Math.min(Math.max(s,0),1)):"float16x4"===t?function(e,t){t.setFloat32(0,e,!0);let i=t.getUint32(0,!0),r=i>>>16&32768,n=i>>>23&255,s=8388607&i;if(255===n)return 31744|r|512*!!s;if(n>142)return 31744|r;if(n<102)return r;let o=n<113?8388608|s:s,a=2**(n<113?126-n:13),l=Math.floor(o/a),u=o%a;return r|(n<113?0:(n-112)*1024)+(l+(u>a/2||u===a/2&&l%2?1:0))}(s,p):s}return new s({buffer:d,format:t,length:e.length,nullBitmap:e.nullBitmap&&new Uint8Array(e.nullBitmap)})}(new s({buffer:await i.ensureCPUValue(),format:i.format??("uint8x3"===a?"uint8x3-webgl":"float16x3"===a?"uint16x3-webgl":a),length:i.length,byteOffset:i.offset,byteStride:i.stride}),l,a),c=new Uint8Array(u.buffer,u.byteOffset,u.length*u.byteStride);return t.write(c),{success:!0}}},14659(e,t,i){function r(e,t){var i;let r=Number.isFinite(i=t)&&i>0?Math.floor(i):65535,n=Math.max(1,Math.ceil(e)),s=Math.min(n,r),o=Math.min(Math.ceil(n/s),r),a=Math.ceil(n/s/o);if(a>r)throw Error(`WebGPU dispatch requires ${n} workgroups, exceeding the 3D dispatch limit of ${r} per dimension`);return{x:s,y:o,z:a}}function n(e,t="workgroupId"){return`((${t}.z * ${e.y}u + ${t}.y) * ${e.x}u + ${t}.x)`}function s(e,t,i="workgroupId",r="localId"){return`(${n(e,i)} * ${t}u + ${r}.x)`}i.d(t,{B:()=>n,BB:()=>r,vL:()=>s})},70025(e,t,i){function r(e,t){switch(e){case"u32":return`${t}u`;case"f32":return Number.isInteger(t)?`${t}.0`:`${t}`;default:return`${t}`}}function n(e,t){switch(e){case"uint32":return r("u32",Math.trunc(t));case"sint32":return`${Math.trunc(t)}`;case"float32":return r("f32",t);default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function s(e){switch(e){case"uint32":return"0u";case"sint32":return"0";case"float32":return"0.0";default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function o(e){switch(e){case"uint32":return"u32";case"sint32":return"i32";case"float32":return"f32";default:throw Error(`WebGPU operations only support 32-bit storage types, got ${e}`)}}i.d(t,{C1:()=>n,Lm:()=>r,_1:()=>s,iP:()=>o})},57092(e,t,i){i.d(t,{P:()=>u,g:()=>c});var r=i(8982),n=i(44060),s=i(20921),o=i(14659),a=i(70025);let l=new s.R;function u(e){return!e.isConstant||!e.value}function c({scope:e,module:t,elementWise:i=!1,expression:s,inputs:f,output:d,operationType:p=d.type,outputBuffer:h}){var _,g,m,b;let v,y,E,w;if(!t.source)throw Error(`WebGPU kernel ${t.name} requires WGSL source`);let x=Array.isArray(_=f)?_.map((e,t)=>[`x${t}`,e]):Object.entries(_),P=x.map(([e,t])=>({name:e,input:t})),S=P.filter(({input:e})=>u(e)).map((e,t)=>({...e,index:t})),T=(0,a.iP)(p),O=(0,a.iP)(d.type),A={TYPE:T,RESULT_LEN:d.size.toString()},I=(0,o.BB)(Math.ceil(d.length/64),h.device.limits.maxComputeWorkgroupsPerDimension);for(let[e,t]of x)A[`${e.toUpperCase()}_LEN`]=t.size.toString();let B=`
${function(e,t){for(let i in t)e=e.replaceAll(`{${i}}`,t[i]);return e}(t.source,A)}
${S.map(({name:e,input:t,index:i})=>{var r,n,s;let o;return r=e,n=t,s=i,o=(0,a.iP)(n.type),`@group(0) @binding(${s}) var<storage, read> ${r}: array<${o}>;`}).join("\n")}
${P.map(({name:e,input:t})=>{var i,r,n;let s,o,l,c;return i=e,r=t,n=p,s=(0,a.iP)(n),o=r.type===n?"":s,l=r.stride/r.ValueType.BYTES_PER_ELEMENT,c=r.offset/r.ValueType.BYTES_PER_ELEMENT,u(r)?`fn read_${i}(rowIndex: u32) -> array<${s}, ${r.size}> {
  var value: array<${s}, ${r.size}>;
  let rowOffset = ${c}u + ${r.isConstant?"0u":"rowIndex"} * ${l}u;
${Array.from({length:r.size},(e,t)=>o?`  value[${t}] = ${o}(${i}[rowOffset + ${t}u]);`:`  value[${t}] = ${i}[rowOffset + ${t}u];`).join("\n")}
  return value;
}`:`fn read_${i}(_rowIndex: u32) -> array<${s}, ${r.size}> {
  return array<${s}, ${r.size}>(${function(e,t){let i=e.value;if(!i)throw Error(`Constant input ${e} is missing CPU values`);return Array.from({length:e.size},(e,r)=>(0,a.Lm)(t,i[r]??0)).join(", ")}(r,o)});
}`}).join("\n")}
${(g=d,m=S.length,v=(0,a.iP)(g.type),`@group(0) @binding(${m}) var<storage, read_write> result: array<${v}>;`)}
${(y=(b=d).stride/b.ValueType.BYTES_PER_ELEMENT,E=b.offset/b.ValueType.BYTES_PER_ELEMENT,w=(0,a.iP)(b.type),`fn write_result(rowIndex: u32, value: array<${w}, ${b.size}>) {
  let rowOffset = ${E}u + rowIndex * ${y}u;
${Array.from({length:b.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join("\n")}
}`)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${(0,o.vL)(I,64)};
  if (rowIndex >= ${d.length}u) {
    return;
  }

${P.map(({name:e})=>`  let ${e} = read_${e}(rowIndex);`).join("\n")}
  var result: array<${O}, ${d.size}>;
${function(e,t,i,r,n){let s="";if(n)for(let e=0;e<i.size;e++)s+=`  result[${e}] = ${n(e)};
`;else if(r){let r=(0,a._1)(i.type),n=(0,a.iP)(i.type);for(let o=0;o<i.size;o++){let i=t.map(([e,t])=>o<t.size?(0,a.iP)(t.type)===n?`${e}[${o}]`:`${n}(${e}[${o}])`:r);s+=`  result[${o}] = ${e}(${i.join(", ")});
`}}else s+=`result = ${e}(${t.map(([e])=>e).join(", ")});`;return s.trimEnd()}(t.name,x,d,i,s)}
  write_result(rowIndex, result);
}
`,L=l.assembleWGSLShader({platformInfo:(0,n.O)(h.device),source:B,modules:t.dependencies,shaderStage:"compute",scanVertexAttributes:!1}),M=new r.M(h.device,{source:L.source,shaderLayout:{bindings:[...S.map(({name:e},t)=>({name:e,type:"storage",group:0,location:t})),{name:"result",type:"storage",group:0,location:S.length}]}});e&&e.retain(()=>M.destroy());let C=Object.fromEntries(S.map(({name:e,input:t})=>[e,t.buffer]));C.result=h;let j=e?e.commandEncoder.beginComputePass({}):h.device.beginComputePass({});h.device.statsManager.getStats("GPGPU Operation Counts").get("Computation Runs").incrementCount(),M.dispatch(j,{bindings:C,...I}),j.end(),e||(h.device.submit(),M.destroy())}},60138(e,t,i){i.d(t,{C:()=>n});var r=i(57092);let n=({inputs:e,output:t,target:i,scope:n})=>{let s=e.map((e,t)=>[`x${t}`,e]);var o=i.device.limits,a=s;let l=a.filter(([,e])=>(0,r.P)(e)).length+1;if(l>o.maxStorageBuffersPerShaderStage)throw Error(`interleave() requires ${l} storage buffers, exceeding device limit ${o.maxStorageBuffersPerShaderStage}`);if(l>o.maxBindingsPerBindGroup)throw Error(`interleave() requires ${l} bindings, exceeding bind group limit ${o.maxBindingsPerBindGroup}`);let u=s.map(([e,t])=>`${e}: array<{TYPE}, ${t.size}>`).join(", "),c=0,f=s.map(([e,t])=>{let i=Array.from({length:t.size},(t,i)=>`  out[${c+i}] = ${e}[${i}];`).join("\n");return c+=t.size,i}).join("\n"),d=`\
fn interleave(${u}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${f}
  return out;
}
`;return(0,r.g)({scope:n,module:{name:"interleave",source:d},inputs:e,output:t,outputBuffer:i}),{success:!0}};n.supportsEvaluationScope=!0},96002(e,t,i){i.d(t,{R:()=>n});var r=i(8994);let n=new class{poolSize=20;bufferPools;constructor(){this.bufferPools=new Map}createOrReuse(e,t){if(t>e.limits.maxBufferSize)throw Error(`Buffer pool cannot allocate ${t} bytes: device.limits.maxBufferSize is ${e.limits.maxBufferSize}`);let i=this.bufferPools.get(e),n=i?i.findIndex(e=>e.byteLength>=t):-1;if(n<0)return e.createBuffer({usage:r.h.VERTEX|r.h.STORAGE|r.h.COPY_DST|r.h.COPY_SRC,byteLength:t});let[s]=i.splice(n,1);return s}recycle(e){let t=e.device;this.bufferPools.has(t)||this.bufferPools.set(t,[]);let i=this.bufferPools.get(t),r=i.findIndex(t=>t.byteLength>e.byteLength);r<0?i.push(e):i.splice(r,0,e),this.purge()}purge(){for(let[e,t]of this.bufferPools){let i=e.isLost?0:this.poolSize;for(;t.length>i;)t.shift().destroy();0===t.length&&this.bufferPools.delete(e)}}}},34353(e,t,i){function r(e,t=!0){return e??t}function n(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}function s(e,t=!0){let i=n(e.slice(0,3),t),r=Number.isFinite(e[3]),o=r?e[3]:1;return[i[0],i[1],i[2],t&&r?o/255:o]}i.d(t,{eS:()=>r,jI:()=>s,sC:()=>n})},63702(e,t,i){i.d(t,{Wk:()=>s});let r=`\
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`,n=`#version 300 es
${r}`;function s(e){let{input:t,inputChannels:i,output:r}=e||{};if(!t)return n;if(!i)throw Error("inputChannels");let s=function(e){switch(e){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw Error(`invalid channels: ${e}`)}}(i),o=function(e,t){switch(t){case 1:return`vec4(${e}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${e}, 0.0, 1.0)`;case 3:return`vec4(${e}, 1.0)`;case 4:return e;default:throw Error(`invalid channels: ${t}`)}}(t,i);return`\
#version 300 es
in ${s} ${t};
out vec4 ${r};
void main() {
  ${r} = ${o};
}`}},6772(e,t,i){i.d(t,{U:()=>u,X:()=>l});var r=i(29936);let n=null,s=new ArrayBuffer(4),o=new Float32Array(s),a=new Uint32Array(s);function l(e){n||=c(),e=(0,r.qE)(e,-65504,65504),o[0]=e;let t=a[0],i=t>>23&511;return n.baseTable[i]+((8388607&t)>>n.shiftTable[i])}function u(e){n||=c();let t=e>>10;return a[0]=n.mantissaTable[n.offsetTable[t]+(1023&e)]+n.exponentTable[t],o[0]}function c(){let e=new Uint32Array(512),t=new Uint32Array(512);for(let i=0;i<256;++i){let r=i-127;r<-27?(e[i]=0,e[256|i]=32768,t[i]=24,t[256|i]=24):r<-14?(e[i]=1024>>-r-14,e[256|i]=1024>>-r-14|32768,t[i]=-r-1,t[256|i]=-r-1):r<=15?(e[i]=r+15<<10,e[256|i]=r+15<<10|32768,t[i]=13,t[256|i]=13):r<128?(e[i]=31744,e[256|i]=64512,t[i]=24,t[256|i]=24):(e[i]=31744,e[256|i]=64512,t[i]=13,t[256|i]=13)}let i=new Uint32Array(2048),r=new Uint32Array(64),n=new Uint32Array(64);for(let e=1;e<1024;++e){let t=e<<13,r=0;for(;(8388608&t)==0;)t<<=1,r-=8388608;t&=-8388609,r+=0x38800000,i[e]=t|r}for(let e=1024;e<2048;++e)i[e]=0x38000000+(e-1024<<13);for(let e=1;e<31;++e)r[e]=e<<23;r[31]=0x47800000,r[32]=0x80000000;for(let e=33;e<63;++e)r[e]=0x80000000+(e-32<<23);r[63]=0xc7800000;for(let e=1;e<64;++e)32!==e&&(n[e]=1024);return{baseTable:e,shiftTable:t,mantissaTable:i,exponentTable:r,offsetTable:n}}},5652(e,t,i){i.d(t,{i:()=>r});let r={name:"fp32",source:`\
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
`}},29936(e,t,i){i.d(t,{$W:()=>r,Fl:()=>n,aI:()=>function e(t,i,n){let o=r.EPSILON;n&&(r.EPSILON=n);try{if(t===i)return!0;if(s(t)&&s(i)){if(t.length!==i.length)return!1;for(let r=0;r<t.length;++r)if(!e(t[r],i[r]))return!1;return!0}if(t&&t.equals)return t.equals(i);if(i&&i.equals)return i.equals(t);if("number"==typeof t&&"number"==typeof i)return Math.abs(t-i)<=r.EPSILON*Math.max(1,Math.abs(t),Math.abs(i));return!1}finally{r.EPSILON=o}},cy:()=>s,qE:()=>o}),globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}};let r=globalThis.mathgl.config;function n(e,{precision:t=r.precision}={}){return e=Math.round(e/r.EPSILON)*r.EPSILON,`${parseFloat(e.toPrecision(t))}`}function s(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function o(e,t,i){return function(e,t,i){if(s(e)){i=i||(e.clone?e.clone():Array(e.length));for(let r=0;r<i.length&&r<e.length;++r){let n="number"==typeof e?e:e[r];i[r]=t(n,r,i)}return i}return t(e)}(e,e=>Math.max(t,Math.min(i,e)))}},92767(e,t,i){var r,n,s,o,a,l;i.d(t,{Cx:()=>R,uq:()=>k,Cp:()=>z,EU:()=>er,h1:()=>D}),(o=r||(r={}))[o.Start=1]="Start",o[o.Move=2]="Move",o[o.End=4]="End",o[o.Cancel=8]="Cancel",(a=n||(n={}))[a.None=0]="None",a[a.Left=1]="Left",a[a.Right=2]="Right",a[a.Up=4]="Up",a[a.Down=8]="Down",a[a.Horizontal=3]="Horizontal",a[a.Vertical=12]="Vertical",a[a.All=15]="All",(l=s||(s={}))[l.Possible=1]="Possible",l[l.Began=2]="Began",l[l.Changed=4]="Changed",l[l.Ended=8]="Ended",l[l.Recognized=8]="Recognized",l[l.Cancelled=16]="Cancelled",l[l.Failed=32]="Failed";let u="manipulation";class c{constructor(e,t){this.actions="",this.manager=e,this.set(t)}set(e){"compute"===e&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));var t=e.join(" ");if(t.includes("none"))return"none";let i=t.includes("pan-x"),r=t.includes("pan-y");return i&&r?"none":i||r?i?"pan-x":"pan-y":t.includes(u)?u:"auto"}}function f(e){return e.trim().split(/\s+/g)}function d(e,t,i){if(e)for(let r of f(t))e.addEventListener(r,i,!1)}function p(e,t,i){if(e)for(let r of f(t))e.removeEventListener(r,i,!1)}function h(e){return(e.ownerDocument||e).defaultView}function _(e){let t=e.length;if(1===t)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let i=0,r=0,n=0;for(;n<t;)i+=e[n].clientX,r+=e[n].clientY,n++;return{x:Math.round(i/t),y:Math.round(r/t)}}function g(e){let t=[],i=0;for(;i<e.pointers.length;)t[i]={clientX:Math.round(e.pointers[i].clientX),clientY:Math.round(e.pointers[i].clientY)},i++;return{timeStamp:Date.now(),pointers:t,center:_(t),deltaX:e.deltaX,deltaY:e.deltaY}}function m(e,t){let i=t.x-e.x,r=t.y-e.y;return Math.sqrt(i*i+r*r)}function b(e,t){let i=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.sqrt(i*i+r*r)}function v(e,t){let i=t.clientX-e.clientX;return 180*Math.atan2(t.clientY-e.clientY,i)/Math.PI}function y(e,t){return e===t?n.None:Math.abs(e)>=Math.abs(t)?e<0?n.Left:n.Right:t<0?n.Up:n.Down}function E(e,t,i){return{x:t/e||0,y:i/e||0}}function w(e,t){return"pointerId"in e?e.pointerId:t}function x(e,t){e.movementOrigin=new Map(t.map((e,t)=>[w(e,t),{clientX:e.clientX,clientY:e.clientY}])),e.firstMovementTime=void 0}class P{constructor(e){this.evEl="",this.evWin="",this.evTarget="",this.domHandler=e=>{this.manager.options.enable&&this.handler(e)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){var i;let n,s,o,a,l;i=this.manager,n=t.pointers.length,s=t.changedPointers.length,o=e&r.Start&&n-s==0,a=e&(r.End|r.Cancel)&&n-s==0,t.isFirst=!!o,t.isFinal=!!a,o&&(i.session={}),t.eventType=e,l=function(e,t){var i,n;let s,o,a,l,u,{session:c}=e,{pointers:f}=t,{length:d}=f;c.firstInput||(c.firstInput=g(t)),d>1&&!c.firstMultiple?c.firstMultiple=g(t):1===d&&(c.firstMultiple=!1);let{firstInput:p,firstMultiple:h}=c,P=h?h.center:p.center,S=t.center=_(f);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-p.timeStamp;let T=t.pointers.map(w);if(c.movementOrigin?.size===T.length&&T.every(e=>c.movementOrigin.has(e))||x(c,t.pointers),t.distancePerPointer=t.pointers.map((e,t)=>b(c.movementOrigin.get(T[t]),e)),t.eventType&r.Move&&t.distancePerPointer.some(e=>e>0)&&(c.firstMovementTime??(c.firstMovementTime=t.timeStamp)),t.movementDeltaTime=void 0===c.firstMovementTime?0:t.timeStamp-c.firstMovementTime,t.eventType&(r.End|r.Cancel)){let e=t.changedPointers.map(e=>w(e,t.pointers.indexOf(e)));x(c,t.pointers.filter((t,i)=>!e.includes(T[i])))}s=S.x-P.x,t.angle=180*Math.atan2(S.y-P.y,s)/Math.PI,t.distance=m(P,S);let{deltaX:O,deltaY:A}=(o=t.center,a=c.offsetDelta,l=c.prevDelta,u=c.prevInput,(t.eventType===r.Start||u?.eventType===r.End)&&(l=c.prevDelta={x:u?.deltaX||0,y:u?.deltaY||0},a=c.offsetDelta={x:o.x,y:o.y}),{deltaX:l.x+(o.x-a.x),deltaY:l.y+(o.y-a.y)});t.deltaX=O,t.deltaY=A,t.offsetDirection=y(t.deltaX,t.deltaY);let I=E(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=I.x,t.overallVelocityY=I.y,t.overallVelocity=Math.abs(I.x)>Math.abs(I.y)?I.x:I.y,t.scale=h?(i=h.pointers,b(f[0],f[1])/b(i[0],i[1])):1,t.rotation=h?(n=h.pointers,v(f[1],f[0])-v(n[1],n[0])):0,t.maxPointers=c.prevInput?t.pointers.length>c.prevInput.maxPointers?t.pointers.length:c.prevInput.maxPointers:t.pointers.length;let B=e.element;return function(e,t){let i=e;for(;i;){if(i===t)return!0;i=i.parentNode}return!1}(t.srcEvent.target,B)&&(B=t.srcEvent.target),t.target=B,!function(e,t){let i,n,s,o,a=e.lastInterval||t,l=t.timeStamp-a.timeStamp;if(t.eventType!==r.Cancel&&(l>25||void 0===a.velocity)){let r=t.deltaX-a.deltaX,u=t.deltaY-a.deltaY,c=E(l,r,u);n=c.x,s=c.y,i=Math.abs(c.x)>Math.abs(c.y)?c.x:c.y,o=y(r,u),e.lastInterval=t}else i=a.velocity,n=a.velocityX,s=a.velocityY,o=a.direction;t.velocity=i,t.velocityX=n,t.velocityY=s,t.direction=o}(c,t),t}(i,t),i.emit("hammer.input",l),i.recognize(l),i.session.prevInput=l}init(){d(this.element,this.evEl,this.domHandler),d(this.target,this.evTarget,this.domHandler),d(h(this.element),this.evWin,this.domHandler)}destroy(){p(this.element,this.evEl,this.domHandler),p(this.target,this.evTarget,this.domHandler),p(h(this.element),this.evWin,this.domHandler)}}let S={pointerdown:r.Start,pointermove:r.Move,pointerup:r.End,pointercancel:r.Cancel,pointerout:r.Cancel};class T extends P{constructor(e){super(e),this.evEl="pointerdown",this.evWin="pointermove pointerup pointercancel",this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,i=!1,n=S[e.type],s=e.pointerType,o="touch"===s,a=t.findIndex(t=>t.pointerId===e.pointerId);n&r.Start&&(e.buttons||o)?a<0&&(t.push(e),a=t.length-1):n&(r.End|r.Cancel)&&(i=!0),!(a<0)&&(t[a]=e,this.callback(n,{pointers:t,changedPointers:[e],eventType:n,pointerType:s,srcEvent:e}),i&&t.splice(a,1))}}let O=["","webkit","Moz","MS","ms","o"],A={touchAction:"compute",enable:!0,inputTarget:null,cssProps:{userSelect:"none",userDrag:"none",touchCallout:"none",tapHighlightColor:"rgba(0,0,0,0)"}};class I{constructor(e,t){this.options={...A,...t,cssProps:{...A.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new T(this),this.touchAction=new c(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?2:1}recognize(e){let t,{session:i}=this;if(i.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let{recognizers:r}=this,{curRecognizer:n}=i;(!n||n&&n.state&s.Recognized)&&(n=i.curRecognizer=null);let o=0;for(;o<r.length;)t=r[o],2!==i.stopped&&(!n||t===n||t.canRecognizeWith(n))?t.recognize(e):t.reset(),!n&&t.state&(s.Began|s.Changed|s.Ended)&&(n=i.curRecognizer=t),o++}get(e){let{recognizers:t}=this;for(let i=0;i<t.length;i++)if(t[i].options.event===e)return t[i];return null}add(e){if(Array.isArray(e)){for(let t of e)this.add(t);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let t of e)this.remove(t);return this}let t="string"==typeof e?this.get(e):e;if(t){let{recognizers:e}=this,i=e.indexOf(t);-1!==i&&(e.splice(i,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:i}=this;for(let r of f(e))i[r]=i[r]||[],i[r].push(t)}off(e,t){if(!e)return;let{handlers:i}=this;for(let r of f(e))t?i[r]&&i[r].splice(i[r].indexOf(t),1):delete i[r]}emit(e,t){let i=this.handlers[e]&&this.handlers[e].slice();if(!i||!i.length)return;t.type=e,t.preventDefault=function(){t.srcEvent.preventDefault()};let r=0;for(;r<i.length;)i[r](t),r++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[i,r]of Object.entries(this.options.cssProps)){let n=function(e,t){let i=t[0].toUpperCase()+t.slice(1);for(let r of O){let n=r?r+i:t;if(n in e)return n}}(t.style,i);e?(this.oldCssProps[n]=t.style[n],t.style[n]=r):t.style[n]=this.oldCssProps[n]||""}e||(this.oldCssProps={})}}}let B=1;function L(e){return e&s.Cancelled?"cancel":e&s.Ended?"end":e&s.Changed?"move":e&s.Began?"start":""}class M{constructor(e){this.options=e,this.id=B++,this.state=s.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){let t;if(Array.isArray(e)){for(let t of e)this.recognizeWith(t);return this}if("string"==typeof e){if(!(t=this.manager.get(e)))throw Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:i}=this;return i[t.id]||(i[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){let t;if(Array.isArray(e)){for(let t of e)this.dropRecognizeWith(t);return this}return(t="string"==typeof e?this.manager.get(e):e)&&delete this.simultaneous[t.id],this}requireFailure(e){let t;if(Array.isArray(e)){for(let t of e)this.requireFailure(t);return this}if("string"==typeof e){if(!(t=this.manager.get(e)))throw Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:i}=this;return -1===i.indexOf(t)&&(i.push(t),t.requireFailure(this)),this}dropRequireFailure(e){let t;if(Array.isArray(e)){for(let t of e)this.dropRequireFailure(t);return this}if(t="string"==typeof e?this.manager.get(e):e){let e=this.requireFail.indexOf(t);e>-1&&this.requireFail.splice(e,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<s.Ended&&this.manager.emit(this.options.event+L(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=s.Ended&&this.manager.emit(this.options.event+L(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=s.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&(s.Failed|s.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=s.Failed;return}this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible),this.state=this.process(t),this.state&(s.Began|s.Changed|s.Ended|s.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}}class C extends M{attrTest(e){let t=this.options.pointers;return 0===t||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(t=>{var i,r;return i=e,(void 0===(r=t).distance||i.distance>=r.distance)&&(void 0===r.distancePerPointer||i.distancePerPointer.length>0&&i.distancePerPointer.every(e=>e>=r.distancePerPointer))&&(void 0===r.movementDeltaTime||i.movementDeltaTime>=r.movementDeltaTime)&&(void 0===r.rotation||Math.abs(((i.rotation+180)%360+360)%360-180)>=r.rotation)&&(void 0===r.scale||Math.abs(i.scale-1)>=r.scale)})}process(e){let{state:t}=this,{eventType:i}=e,n=t&(s.Began|s.Changed),o=this.attrTest(e);return n&&(i&r.Cancel||!o)?t|s.Cancelled:n||o?i&r.End?t|s.Ended:t&s.Began?t|s.Changed:s.Began:s.Failed}}let j=["","start","move","end","cancel"];class z extends M{constructor(e={}){super({enable:!0,event:"doubleclickdrag",pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[u]}getEventNames(){return j.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length!==t.pointers?(this.reset(),s.Failed):e.eventType&r.Start?this._handleStart(e):e.eventType&r.Move?this._handleMove(e):e.eventType&r.Cancel?this._handleEnd(e,!0):e.eventType&r.End?this._handleEnd(e,!1):s.Failed}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===s.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===s.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===s.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===s.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,s.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,s.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return s.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?s.Began:(this._drag.active=!0,e.scale=Math.pow(2,t/this.options.pixelsPerScale),this._emittedStart?s.Changed:s.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:i,startCenter:r}=this._drag;if(this._drag=null,this._tapStart=null,this._lastTap=null,!i)return this._emittedStart=!1,s.Failed;let n=r.y-e.center.y;return e.scale=Math.pow(2,n/this.options.pixelsPerScale),t?s.Cancelled:s.Ended}return this._tapStart&&this._isSamePointer(e,this._tapStart.pointerId)?(this._isValidTap(e)?this._lastTap={center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null):t&&this.reset(),s.Failed}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&m(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return"pointerId"in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return null===t||this._getPointerId(e)===t}}class R extends M{constructor(e={}){super({enable:!0,event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[u]}process(e){let{options:t}=this,i=e.pointers.length===t.pointers,n=e.distance<t.threshold,o=e.deltaTime<t.time;if(this.reset(),e.eventType&r.Start&&0===this.count)return this.failTimeout();if(n&&o&&i){if(e.eventType!==r.End)return this.failTimeout();let i=!this.pTime||e.timeStamp-this.pTime<t.interval,n=!this.pCenter||m(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,n&&i?this.count+=1:this.count=1,this._input=e,0==this.count%t.taps)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=s.Recognized,this.tryEmit(this._input)},t.interval),s.Began):s.Recognized}return s.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=s.Failed},this.options.interval),s.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===s.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}}class U extends C{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{"trackpad"===e.device&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...i}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(i),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:i}=e,r=t.deltaX??e.deltaX,n=t.deltaY??e.deltaY,s=y(r,n),o=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY);return{pointers:[i,i],changedPointers:[i,i],pointerType:"trackpad",srcEvent:i,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:r,deltaY:n,angle:180*Math.atan2(n,r)/Math.PI,distance:Math.sqrt(r*r+n*n),distancePerPointer:[o,o],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:s,offsetDirection:s,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:i.target||this.manager.element,additionalEvent:"",...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&2===this.options.pointers);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}}let N=["","start","move","end","cancel","up","down","left","right"];class k extends U{constructor(e={}){super({enable:!0,pointers:1,event:"pan",threshold:10,direction:n.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&n.Horizontal&&t.push("pan-y"),e&n.Vertical&&t.push("pan-x"),t}getEventNames(){return N.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,i=!0,{distance:r}=e,{direction:s}=e,o=e.deltaX,a=e.deltaY;return s&t.direction||(t.direction&n.Horizontal?(s=0===o?n.None:o<0?n.Left:n.Right,i=o!==this.pX,r=Math.abs(e.deltaX)):(s=0===a?n.None:a<0?n.Up:n.Down,i=a!==this.pY,r=Math.abs(e.deltaY))),e.direction=s,i&&r>t.threshold&&!!(s&t.direction)}attrTest(e){let t=!!(this.state&s.Began),i=!(this.options.coherent?.length&&e.eventType&(r.End|r.Cancel));return super.attrTest(e)&&(t||i&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=n[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}}let F=["","start","move","end","cancel","in","out"];class D extends U{constructor(e={}){super({enable:!0,event:"pinch",threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return["none"]}getEventNames(){return F.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,i=!!(this.state&s.Began),n=!(t&&e.eventType&(r.End|r.Cancel));return super.attrTest(e)&&(i||n&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(1!==e.scale){let t=e.scale<1?"in":"out";e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}}class V{constructor(e,t,i){this.element=e,this.callback=t,this.options=i}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}}let G=-1!==("u">typeof navigator&&navigator.userAgent?navigator.userAgent.toLowerCase():"").indexOf("firefox");class $ extends V{constructor(e,t,i){i.enable=i.enable??!1,super(e,t,i),this.handleEvent=e=>{if(!this.options.enable)return;let t=e.deltaY;globalThis.WheelEvent&&(G&&e.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(t/=globalThis.devicePixelRatio),e.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(t*=40)),e.shiftKey&&t&&(t*=.25),this.callback({type:"wheel",center:{x:e.clientX,y:e.clientY},delta:-t,device:this.options.wheelSession?.device??"unknown",srcEvent:e,pointerType:"mouse",target:e.target})},i.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen("wheel",!0))}destroy(){this.listen("wheel",!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){"wheel"===e&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen("wheel",t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}}let Y={classificationDelay:32,endDelay:80};class W{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=e=>{var t,i;let r,n;if(!this.hasSubscribers)return"unknown";let s=(t=e,i=this.pressedControlKeys.size>0,r=t.deltaX,n=t.deltaY,1===t.deltaMode&&(r*=40,n*=40),{event:t,timeStamp:t.timeStamp,deltaX:r,deltaY:n,isControlKeyDown:i}),o=this.session;if(o&&s.timeStamp-o.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return"unknown";o=null}o?(this.scheduleEnd(),this.addSample(o,s)):(o=this.startPendingSession(s),this.scheduleEnd());let{device:a}=o;return"unknown"===a&&"unknown"!==(a=q(o.samples,!1))&&this.begin(o,a),a},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||"unknown"!==this.session.device)return;let e=this.session,t=q(e.samples,!0);this.begin(e,"unknown"===t?"mouse":t)},this.end=()=>{if(!this.session)return;if("unknown"===this.session.device){let e=this.session,t=q(e.samples,!0);this.begin(e,"unknown"===t?"mouse":t)}if(!this.session)return;let e=this.session;this.emit(r.End,e.lastEvent),this.reset()},this.handleKeyDown=e=>{"Control"===e.key&&this.pressedControlKeys.add(e.code||e.key)},this.handleKeyUp=e=>{"Control"===e.key&&(e.code?this.pressedControlKeys.delete(e.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...Y,...t},this.element?.addEventListener("wheel",this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??"unknown"}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&"unknown"!==e.device&&this.emit(r.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener("wheel",this.handleEvent)}startPendingSession(e){let t={samples:[e],device:"unknown",firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,"unknown"!==e.device){let i=e.samples[e.samples.length-2],n=t.timeStamp-i.timeStamp;e.velocityX=n>0?t.deltaX/n:0,e.velocityY=n>0?t.deltaY/n:0,this.emit(r.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(r.Start,e.samples[0].event);let i=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=i>0?e.totalDeltaX/i:0,e.velocityY=i>0?e.totalDeltaY/i:0,this.emit(r.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,i){let n=this.session;if(!n||"unknown"===n.device)return;let s=e===r.Start,o=e===r.End||e===r.Cancel,a=s?n.firstTimeStamp:n.lastTimeStamp,l=s?0:Math.max(0,a-n.firstTimeStamp),u=s?0:n.totalDeltaX,c=s?0:n.totalDeltaY,f=l>0?u/l:0,d=l>0?c/l:0,p=s?0:i?.velocityX??n.velocityX,h=s?0:i?.velocityY??n.velocityY,_={eventType:e,device:n.device,srcEvent:t,timeStamp:a,center:{x:t.clientX,y:t.clientY},deltaX:u,deltaY:c,deltaTime:l,velocity:Math.abs(p)>Math.abs(h)?p:h,velocityX:p,velocityY:h,overallVelocity:Math.abs(f)>Math.abs(d)?f:d,overallVelocityX:f,overallVelocityY:d,isFirst:s,isFinal:o};for(let{listener:e}of[...this.subscriptions.values()])e(_)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){null!==this.classificationTimer&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){null!==this.endTimer&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t="u">typeof window?window:globalThis.document?.defaultView;t&&e!==this.listeningForControlKeys&&(this.listeningForControlKeys=e,e?(t.addEventListener("keydown",this.handleKeyDown,!0),t.addEventListener("keyup",this.handleKeyUp,!0),t.addEventListener("blur",this.handleWindowBlur)):(t.removeEventListener("keydown",this.handleKeyDown,!0),t.removeEventListener("keyup",this.handleKeyUp,!0),t.removeEventListener("blur",this.handleWindowBlur),this.pressedControlKeys.clear()))}}function q(e,t){return e.some(({event:e,isControlKeyDown:t})=>e.ctrlKey&&!t)?"trackpad":e.some(({event:e})=>0!==e.deltaMode)||e.some(H)||e.every(({event:e})=>{let t=e.wheelDelta;return void 0!==t&&Math.abs(t)%40==0})?"mouse":e.some(({deltaX:e})=>0!==e)||e.length>1&&function(e){for(let t=0;t<e.length;t++){let i=e[t];if(Math.abs(i.deltaX)>40||Math.abs(i.deltaY)>40||t>0&&i.timeStamp-e[t-1].timeStamp>40)return!1}return!0}(e)?"trackpad":t?"mouse":"unknown"}function H({event:e,deltaX:t,deltaY:i}){if(0!==t||0===i)return!1;if(Number.isInteger(Math.abs(i/4.000244140625)))return!0;let r=e.wheelDelta;return"number"==typeof r&&0!==r&&r%120==0}let X=["mousedown","mousemove","mouseup","mouseover","mouseout","mouseenter","mouseleave"];class K extends V{constructor(e,t,i){super(e,t,{enable:!0,...i}),this.handleEvent=e=>{this.handleOverEvent(e),this.handleOutEvent(e),this.handleEnterEvent(e),this.handleLeaveEvent(e),this.handleMoveEvent(e)},this.pressed=!1;let{enable:r=!1}=this.options;this.enableMoveEvent=r,this.enableLeaveEvent=r,this.enableEnterEvent=r,this.enableOutEvent=r,this.enableOverEvent=r,r&&X.forEach(e=>this.listen(e,!0))}destroy(){X.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case"pointermove":this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen("mousedown",t),this.listen("mousemove",t),this.listen("mouseup",t));break;case"pointerover":this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen("mouseover",t));break;case"pointerout":this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen("mouseout",t));break;case"pointerenter":this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen("mouseenter",t));break;case"pointerleave":this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen("mouseleave",t))}}handleOverEvent(e){this.enableOverEvent&&"mouseover"===e.type&&this._emit("pointerover",e)}handleOutEvent(e){this.enableOutEvent&&"mouseout"===e.type&&this._emit("pointerout",e)}handleEnterEvent(e){this.enableEnterEvent&&"mouseenter"===e.type&&this._emit("pointerenter",e)}handleLeaveEvent(e){this.enableLeaveEvent&&"mouseleave"===e.type&&this._emit("pointerleave",e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case"mousedown":e.button>=0&&(this.pressed=!0);break;case"mousemove":0===e.buttons&&(this.pressed=!1),this.pressed||this._emit("pointermove",e);break;case"mouseup":this.pressed=!1}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:"mouse",target:t.target})}}let Z=["keydown","keyup"];class J extends V{constructor(e,t,i){super(e,t,{enable:!0,tabIndex:0,...i}),this.handleEvent=e=>{let t=e.target||e.srcElement;("INPUT"!==t.tagName||"text"!==t.type)&&"TEXTAREA"!==t.tagName&&(this.enableDownEvent&&"keydown"===e.type&&this.callback({type:"keydown",srcEvent:e,key:e.key,target:e.target}),this.enableUpEvent&&"keyup"===e.type&&this.callback({type:"keyup",srcEvent:e,key:e.key,target:e.target}))};let{enable:r=!1}=this.options;this.enableDownEvent=r,this.enableUpEvent=r,e.tabIndex=this.options.tabIndex,e.style.outline="none",r&&Z.forEach(e=>this.listen(e,!0))}destroy(){Z.forEach(e=>this.listen(e,!1))}enableEventType(e,t){"keydown"===e&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),"keyup"===e&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}}class Q extends V{constructor(e,t,i){i.enable=i.enable??!1,super(e,t,i),this.handleEvent=e=>{this.options.enable&&this.callback({type:"contextmenu",center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:"mouse",target:e.target})},i.enable&&this.listen("contextmenu",!0)}destroy(){this.listen("contextmenu",!1)}enableEventType(e,t){"contextmenu"===e&&this.options.enable!==t&&(this.options.enable=t,this.listen("contextmenu",t))}}let ee={pointerdown:1,pointermove:2,pointerup:4,mousedown:1,mousemove:2,mouseup:4},et={srcElement:"root",priority:0};class ei{constructor(e,t){this.handleEvent=e=>{if(this.isEmpty())return;let t=this._normalizeEvent(e),i=e.srcEvent.target;for(;i&&i!==t.rootElement;){if(this._emit(t,i),t.handled)return;i=i.parentNode}this._emit(t,"root")},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,i,r=!1,n=!1){let{handlers:s,handlersByElement:o}=this,a={...et,...i},l=o.get(a.srcElement);l||(l=[],o.set(a.srcElement,l));let u={type:e,handler:t,srcElement:a.srcElement,priority:a.priority};r&&(u.once=!0),n&&(u.passive=!0),s.push(u),this._active=this._active||!u.passive;let c=l.length-1;for(;c>=0&&!(l[c].priority>=u.priority);)c--;l.splice(c+1,0,u)}remove(e,t){let{handlers:i,handlersByElement:r}=this;for(let n=i.length-1;n>=0;n--){let s=i[n];if(s.type===e&&s.handler===t){i.splice(n,1);let e=r.get(s.srcElement);e.splice(e.indexOf(s),1),0===e.length&&r.delete(s.srcElement)}}this._active=i.some(e=>!e.passive)}_emit(e,t){let i=this.handlersByElement.get(t);if(i){let t=!1,r=()=>{e.handled=!0},n=()=>{e.handled=!0,t=!0},s=[];for(let o=0;o<i.length;o++){let{type:a,handler:l,once:u}=i[o];if(l({...e,type:a,stopPropagation:r,stopImmediatePropagation:n}),u&&s.push(i[o]),t)break}for(let e=0;e<s.length;e++){let{type:t,handler:i}=s[e];this.remove(t,i)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...function(e){let t=ee[e.srcEvent.type];if(!t)return null;let{buttons:i,button:r}=e.srcEvent,n=!1,s=!1,o=!1;return 2===t?(n=!!(1&i),s=!!(4&i),o=!!(2&i)):(n=0===r,s=1===r,o=2===r),{leftButton:n,middleButton:s,rightButton:o}}(e),...function(e,t){let i=e.center;if(!i)return null;let r=t.getBoundingClientRect(),n=r.width/t.offsetWidth||1,s=r.height/t.offsetHeight||1,o={x:(i.x-r.left-t.clientLeft)/n,y:(i.y-r.top-t.clientTop)/s};return{center:i,offsetCenter:o}}(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}}class er{constructor(e=null,t={}){if(this._onBasicInput=e=>{this.manager.emit(e.srcEvent.type,e)},this._onOtherEvent=e=>{this.manager.emit(e.type,e)},this.options={recognizers:[],events:{},touchAction:"compute",tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new W(e),!e)return;for(let t of(this.manager=new I(e,this.options),this.options.recognizers)){let{recognizer:e,recognizeWith:i,requireFailure:r}=function(e){let t;if("recognizer"in e)return e;let i=Array.isArray(e)?[...e]:[e];return{recognizer:t="function"==typeof i[0]?new(i.shift())(i.shift()||{}):i.shift(),recognizeWith:"string"==typeof i[0]?[i[0]]:i[0],requireFailure:"string"==typeof i[1]?[i[1]]:i[1]}}(t);this.manager.add(e),i&&e.recognizeWith(i),r&&e.requireFailure(r)}this.manager.on("hammer.input",this._onBasicInput),this.wheelInput=new $(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new K(e,this._onOtherEvent,{enable:!1}),this.keyInput=new J(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new Q(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}getElement(){return this.element}destroy(){this.element?(this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()):this.wheelSession.destroy()}on(e,t,i){this._addEventHandler(e,t,i,!1)}once(e,t,i){this._addEventHandler(e,t,i,!0)}watch(e,t,i){this._addEventHandler(e,t,i,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:i}=this;if(!i)return;let r=i.get(e);r&&(r.set({enable:t,wheelSession:this.wheelSession}),i.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,i,r,n){if("string"!=typeof e){for(let[s,o]of(i=t,Object.entries(e)))this._addEventHandler(s,o,i,r,n);return}let{manager:s,events:o}=this;if(!s)return;let a=o.get(e);!a&&(a=new ei(this,this._getRecognizerName(e)||e),o.set(e,a),s&&s.on(e,a.handleEvent)),a.add(e,t,i,r,n),a.isEmpty()||this._toggleRecognizer(a.recognizerName,!0)}_removeEventHandler(e,t){if("string"!=typeof e){for(let[t,i]of Object.entries(e))this._removeEventHandler(t,i);return}let{events:i}=this,r=i.get(e);if(r&&(r.remove(e,t),r.isEmpty())){let{recognizerName:e}=r,t=!1;for(let r of i.values())if(r.recognizerName===e&&!r.isEmpty()){t=!0;break}t||this._toggleRecognizer(e,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}}}}]);