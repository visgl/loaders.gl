"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[2543],{42384:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>ee,contentTitle:()=>Y,default:()=>oe,frontMatter:()=>K,metadata:()=>Q,toc:()=>te});var r=n(87462),o=n(67294),a=n(3905),i=(n(20745),n(33545)),s=n(24613),c=n.n(s),l=n(8977),u=n(66883),f=n(30615),d=n(19521),p=n(45697),y=n.n(p);const h="Vancouver",g="GeoJSON",m={height:600,width:800,pitch:45,maxPitch:60,bearing:0,minZoom:1,maxZoom:30,zoom:11},w={GeoPackage:{Rivers:{data:"https://raw.githubusercontent.com/ngageoint/geopackage-js/master/test/fixtures/rivers.gpkg",viewState:{...m,longitude:-4.65,latitude:0,zoom:1.76}}},GeoJSON:{Vancouver:{data:"https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json",viewState:{...m,latitude:49.254,longitude:-123.13}}},FlatGeobuf:{Countries:{data:"https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/flatgeobuf/test/data/countries.fgb",viewState:{...m,longitude:-4.65,latitude:-29.76,zoom:1.76}}}},b=d.ZP.div.withConfig({displayName:"control-panel__Container",componentId:"sc-tkzqjo-0"})(["display:flex;flex-direction:column;position:absolute;top:0;right:0;max-width:320px;background:#fff;color:#121212;box-shadow:0 2px 4px rgba(0,0,0,0.3);padding:12px 24px;margin:20px;font-size:13px;line-height:2;outline:none;z-index:100;"]),v=d.ZP.select.withConfig({displayName:"control-panel__DropDown",componentId:"sc-tkzqjo-1"})(["margin-bottom:6px;"]),x={examples:y().object,selectedExample:y().string,selectedLoader:y().string,onExampleChange:y().func};class A extends o.PureComponent{constructor(e){super(e),this._autoSelected=!1}componentDidMount(){const{examples:e={},onExampleChange:t}=this.props;let n=this.props.selectedLoader,r=this.props.selectedExample;if(n&&r||this._autoSelected||(n=g,r=e[n][h],this._autoSelected=!0),n&&r){t({selectedLoader:n,selectedExample:r,example:e[n][r]})}}_renderDropDown(){const{examples:e={},selectedLoader:t,selectedExample:n,onExampleChange:r}=this.props;if(!t||!n)return!1;const a=t+"."+n;return o.createElement(v,{value:a,onChange:t=>{const n=t.target.value.split("."),o=n[0],a=n[1],i=e[o][a];r({selectedLoader:o,selectedExample:a,example:i})}},Object.keys(e).map(((t,n)=>{const r=e[t];return o.createElement("optgroup",{key:n,label:t},Object.keys(r).map(((e,n)=>{const r=t+"."+e;return o.createElement("option",{key:n,value:r},e+" ("+t+")")})))})))}_renderHeader(){const{selectedLoader:e,selectedExample:t}=this.props;return e&&t?o.createElement("div",null,o.createElement("h3",null,t," ",o.createElement("b",null,e)," ")):null}render(){return o.createElement(b,null,this._renderHeader(),this._renderDropDown(),this.props.children)}}A.propTypes=x,A.defaultProps={examples:{},droppedFile:null,selectedExample:null,selectedLoader:null,onChange:()=>{}};const E={id:"flatgeobuf",name:"FlatGeobuf",module:"flatgeobuf",version:"3.4.0-alpha.2",worker:!0,extensions:["fgb"],mimeTypes:["application/octet-stream"],category:"geometry",options:{flatgeobuf:{shape:"geojson"}}};var k=n(74968);function L(e,t){for(const n of e)n.geometry.coordinates=C(n.geometry.coordinates,t);return e}function C(e,t){return function(e){return Number.isFinite(e[0])&&Number.isFinite(e[1])}(e)?t(e):e.map((e=>C(e,t)))}var S=n(53359),U=n(79184),T=n(13959),j=n(54591);function _(e){const t=e.xyArray(),n=F(t,e.zArray()),r=e.endsArray()&&Array.from(e.endsArray())||[t.length/2];r.unshift(0);return{positions:n,primitivePolygonIndices:{value:new Uint16Array(r),size:1},polygonIndices:{value:new Uint16Array([0,t.length/2]),size:1}}}function F(e,t){if(!t)return{value:e,size:2};if(2*t.length!==e.length)throw new Error("Z array must be half XY array's length");const n=e.length+t.length,r=new Float64Array(n);for(let o=0;o<e.length/2;o++)r[3*o+0]=e[2*o+0],r[3*o+1]=e[2*o+1],r[3*o+2]=t[o];return{value:r,size:3}}function I(e,t){switch(t){case j.GeometryType.Point:case j.GeometryType.MultiPoint:return function(e){return{positions:F(e.xyArray(),e.zArray())}}(e);case j.GeometryType.LineString:case j.GeometryType.MultiLineString:return function(e){const t=e.xyArray(),n=F(t,e.zArray()),r=e.endsArray()&&Array.from(e.endsArray())||[t.length/2];return r.unshift(0),{positions:n,pathIndices:{value:new Uint16Array(r),size:1}}}(e);case j.GeometryType.Polygon:return _(e);case j.GeometryType.MultiPolygon:return function(e){const t=[];let n=0,r=1,o=1;for(let d=0;d<e.partsLength();d++){const a=_(e.parts(d));n+=a.positions.value.length,r+=a.primitivePolygonIndices.value.length-1,o+=a.polygonIndices.value.length-1,t.push(a)}const a=new Float64Array(n),i=new Uint32Array(r),s=new Uint32Array(o);let c=0,l=1,u=1;const f=t[0].positions.size;for(const d of t)a.set(d.positions.value,c*f),i.set(d.primitivePolygonIndices.value.subarray(1).map((e=>e+c)),l),s.set(d.polygonIndices.value.subarray(1).map((e=>e+c)),u),c+=d.positions.value.length/f,l+=d.primitivePolygonIndices.value.length-1,u+=d.polygonIndices.value.length-1;return{positions:{value:a,size:f},primitivePolygonIndices:{value:i,size:1},polygonIndices:{value:s,size:1}}}(e);default:throw new Error("Unimplemented geometry type: ".concat(t))}}function B(e,t){const n=e.geometry(),r=t.geometryType||n.type(),o=I(n,r);return o.properties=(0,T.parseProperties)(e,t.columns),o}function D(e,t){var n,r;const o=(null==t||null===(n=t.gis)||void 0===n?void 0:n.format)||(null==t||null===(r=t.flatgeobuf)||void 0===r?void 0:r.shape);switch(o){case"geojson-row-table":return{shape:"geojson-row-table",data:O(e,t)};case"columnar-table":return{shape:"columnar-table",data:z(e,t)};case"geojson":return O(e,t);case"binary":return z(e,t);default:throw new Error(o)}}function z(e,t){const n=new Uint8Array(e);return(0,U.vB)(n,B)}function O(e,t){if(0===e.byteLength)return[];const{reproject:n=!1,_targetCrs:r="WGS84"}=t&&t.gis||{},o=new Uint8Array(e);let a;const{features:i}=(0,S.vB)(o,!1,(e=>{a=e})),s=a&&a.crs;let c;if(n&&s)try{c=new k.A({from:s.wkt,to:r})}catch(l){}return c?L(i,(e=>c.project(e))):i}const P={...E,parse:async(e,t)=>D(e,t),parseSync:D,parseInBatchesFromStream:function(e,t){return t&&t.gis&&"binary"===t.gis.format?function(e,t){const n=(0,U.vB)(e,B);return n}(e):async function*(e,t){const{reproject:n=!1,_targetCrs:r="WGS84"}=t&&t.gis||{};let o;const a=(0,S.vB)(e,!1,(e=>{o=e}));let i,s=!0;for await(const c of a){if(s){const e=o&&o.crs;n&&e&&(i=new k.A({from:e.wkt,to:r})),s=!1}n&&i?yield L([c],(e=>i.project(e))):yield c}}(e,t)},binary:!0};var M=n(99121),R=n(37258);const Z=d.ZP.h1.withConfig({displayName:"parse-file__ErrorFormatHeader",componentId:"sc-ubgnk1-0"})(["color:red;font-size:16px;"]);(0,M.fh)([P]);const G={file:y().object,onFileUploaded:y().func};class V extends o.PureComponent{constructor(e){super(e),this.state={fileError:null,data:null}}async componentDidMount(){const e=await this.getFileDataUrl();this.setState({data:e})}async getFileDataUrl(){const{file:e,onFileUploaded:t}=this.props;try{t(await(0,R.z)(e),e)}catch(n){console.error(n),this.setState({fileError:n.message})}}render(){const{fileError:e}=this.state;return o.createElement(Z,{style:{color:"red"}},e)}}V.propTypes=G,V.defaultProps={file:null};const N=d.ZP.div.withConfig({displayName:"file-uploader__Container",componentId:"sc-1445ooq-0"})(["display:flex;flex-flow:column nowrap;"]),W=d.ZP.div.withConfig({displayName:"file-uploader__FileFrame",componentId:"sc-1445ooq-1"})(["display:flex;width:256px;height:20px;align-items:center;justify-content:center;border:1px dashed black;"]),q=d.ZP.div.withConfig({displayName:"file-uploader__FileContainer",componentId:"sc-1445ooq-2"})(["display:flex;flex-flow:column nowrap;align-items:center;width:270px;"]),J={onFileRemoved:y().func,onFileUploaded:y().func};class X extends o.PureComponent{constructor(e){super(e),this.state={uploadedFile:null},this.handleLoadFile=this.handleLoadFile.bind(this),this.handleCleanFile=this.handleCleanFile.bind(this)}handleLoadFile(e){const t=e.dataTransfer.files[0];this.setState({uploadedFile:t}),e.preventDefault()}handleCleanFile(){const{onFileRemoved:e}=this.props;e(),this.setState({uploadedFile:null})}render(){const{onFileUploaded:e}=this.props,{uploadedFile:t}=this.state;return o.createElement("div",null,!t&&o.createElement(N,null,o.createElement(W,{onDrop:this.handleLoadFile,onDragOver:e=>e.preventDefault()},"Drag&Drop file")),o.createElement(q,null,t&&o.createElement(V,{file:t,onFileUploaded:e}),t&&o.createElement("button",{onClick:this.handleCleanFile},"Clean")))}}X.propTypes=J;const H={latitude:49.254,longitude:-123.13,zoom:11,maxZoom:16,pitch:45,bearing:0};class $ extends o.PureComponent{constructor(e){super(e),this.state={viewState:H,selectedExample:h,selectedLoader:g,uploadedFile:null},this._onExampleChange=this._onExampleChange.bind(this),this._onFileRemoved=this._onFileRemoved.bind(this),this._onFileUploaded=this._onFileUploaded.bind(this),this._onViewStateChange=this._onViewStateChange.bind(this)}_onViewStateChange(e){let{viewState:t}=e;this.setState({viewState:t})}_onExampleChange(e){let{selectedLoader:t,selectedExample:n,example:r}=e;const{viewState:o}=r;this.setState({selectedLoader:t,selectedExample:n,viewState:o})}_onFileRemoved(){this.setState({uploadedFile:null})}_onFileUploaded(e,t){this.setState({selectedExample:t.name,uploadedFile:e})}_renderControlPanel(){const{selectedExample:e,viewState:t,selectedLoader:n}=this.state;return o.createElement(A,{examples:w,selectedExample:e,selectedLoader:n,onExampleChange:this._onExampleChange},o.createElement("div",{style:{textAlign:"center"}},"long/lat: ",t.longitude.toFixed(5),",",t.latitude.toFixed(5),", zoom:",t.zoom.toFixed(2)),o.createElement(X,{onFileUploaded:this._onFileUploaded,onFileRemoved:this._onFileRemoved}))}_renderLayer(){const{selectedExample:e,selectedLoader:t,uploadedFile:n}=this.state;let r;return r=n||(w[t][e]?w[t][e].data:w[g][h].data),[new f.Z({id:"geojson-"+e+"("+t+")",data:r,opacity:.8,stroked:!1,filled:!0,extruded:!0,wireframe:!0,getElevation:e=>10*Math.sqrt(e.properties.valuePerSqm),getFillColor:[255,255,255],getLineColor:[0,0,0],getLineWidth:3,lineWidthUnits:"pixels",pickable:!0,loadOptions:{gis:{format:"geojson",reproject:!0,_targetCrs:"WGS84"}},dataTransform:(e,t)=>"object"!=typeof e||Array.isArray(e)||e.type?e:Object.values(e).flat()})]}render(){const{viewState:e}=this.state;return o.createElement("div",{style:{position:"relative",height:"100%"}},this._renderControlPanel(),o.createElement(l.Z,{layers:this._renderLayer(),viewState:e,onViewStateChange:this._onViewStateChange,controller:{type:u.Z,maxPitch:85}},o.createElement(i.D5,{reuseMaps:!0,mapLib:c(),mapStyle:"https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",preventStyleDiffing:!0})))}}const K={},Y="Geospatial",Q={unversionedId:"geospatial",id:"geospatial",title:"Geospatial",description:"",source:"@site/src/examples/geospatial.mdx",sourceDirName:".",slug:"/geospatial",permalink:"/examples/geospatial",draft:!1,tags:[],version:"current",frontMatter:{},sidebar:"examplesSidebar",previous:{title:"Textures",permalink:"/examples/textures"},next:{title:"WMS",permalink:"/examples/wms"}},ee={},te=[],ne={toc:te},re="wrapper";function oe(e){let{components:t,...n}=e;return(0,a.kt)(re,(0,r.Z)({},ne,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"geospatial"},"Geospatial"),(0,a.kt)("div",{style:{height:"100vh"}},(0,a.kt)($,{mdxType:"Demo"})))}oe.isMDXComponent=!0},745:(e,t,n)=>{n.d(t,{D0:()=>c,Ew:()=>l,Kn:()=>a,Lj:()=>u,Os:()=>d,Ss:()=>i,TW:()=>s,zH:()=>f});const r=e=>"boolean"==typeof e,o=e=>"function"==typeof e,a=e=>null!==e&&"object"==typeof e,i=e=>a(e)&&e.constructor==={}.constructor,s=e=>e&&"function"==typeof e[Symbol.iterator],c=e=>e&&"function"==typeof e[Symbol.asyncIterator],l=e=>"undefined"!=typeof Response&&e instanceof Response||e&&e.arrayBuffer&&e.text&&e.json,u=e=>"undefined"!=typeof Blob&&e instanceof Blob,f=e=>e&&"object"==typeof e&&e.isBuffer,d=e=>(e=>"undefined"!=typeof ReadableStream&&e instanceof ReadableStream||a(e)&&o(e.tee)&&o(e.cancel)&&o(e.getReader))(e)||(e=>a(e)&&o(e.read)&&o(e.pipe)&&r(e.readable))(e)},37258:(e,t,n)=>{n.d(t,{z:()=>s});var r=n(745),o=n(35163),a=n(89752),i=n(93865);async function s(e,t,n,s){Array.isArray(t)||(0,o.C)(t)||(void 0,n=t,t=void 0);const c=(0,a.b)(n);let l=e;return"string"==typeof e&&(l=await c(e)),(0,r.Lj)(e)&&(l=await c(e)),await(0,i.Q)(l,t,n)}},93865:(e,t,n)=>{n.d(t,{Q:()=>S});var r=n(96040),o=n(57254),a=n(96013),i=n(13842),s=n(9164);async function c(e,t,n,r,o){const a=e.id,c=(0,s.j)(e,n),u=i.Z.getWorkerFarm(n).getWorkerPool({name:a,url:c});n=JSON.parse(JSON.stringify(n)),r=JSON.parse(JSON.stringify(r||{}));const f=await u.startJob("process-on-worker",l.bind(null,o));f.postMessage("process",{input:t,options:n,context:r});const d=await f.result;return await d.result}async function l(e,t,n,r){switch(n){case"done":t.done(r);break;case"error":t.error(new Error(r.error));break;case"process":const{id:a,input:i,options:s}=r;try{const n=await e(i,s);t.postMessage("done",{id:a,result:n})}catch(o){const e=o instanceof Error?o.message:"unknown error";t.postMessage("error",{id:a,error:e})}break;default:console.warn("parse-with-worker unknown message ".concat(n))}}var u=n(35163),f=n(745),d=n(48657),p=n(25735);const y=262144;const h=262144;const g=1048576;var m=n(39579);function w(e){if((t=e)&&"object"==typeof t&&t.isBuffer)return e;var t;if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e))return 0===e.byteOffset&&e.byteLength===e.buffer.byteLength?e.buffer:e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength);if("string"==typeof e){const t=e;return(new TextEncoder).encode(t).buffer}if(e&&"object"==typeof e&&e._toArrayBuffer)return e._toArrayBuffer();throw new Error("toArrayBuffer")}function b(e,t){return m.jU?async function*(e,t){const n=e.getReader();let r;try{for(;;){const e=r||n.read();null!=t&&t._streamReadAhead&&(r=n.read());const{done:o,value:a}=await e;if(o)return;yield w(a)}}catch(o){n.releaseLock()}}(e,t):async function*(e,t){for await(const n of e)yield w(n)}(e)}function v(e,t){if("string"==typeof e)return function*(e,t){const n=(null==t?void 0:t.chunkSize)||y;let r=0;const o=new TextEncoder;for(;r<e.length;){const t=Math.min(e.length-r,n),a=e.slice(r,r+t);r+=t,yield o.encode(a)}}(e,t);if(e instanceof ArrayBuffer)return function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return function*(){const{chunkSize:n=h}=t;let r=0;for(;r<e.byteLength;){const t=Math.min(e.byteLength-r,n),o=new ArrayBuffer(t),a=new Uint8Array(e,r,t);new Uint8Array(o).set(a),r+=t,yield o}}()}(e,t);if((0,f.Lj)(e))return async function*(e,t){const n=(null==t?void 0:t.chunkSize)||g;let r=0;for(;r<e.size;){const t=r+n,o=await e.slice(r,t).arrayBuffer();r=t,yield o}}(e,t);if((0,f.Os)(e))return b(e,t);if((0,f.Ew)(e)){return b(e.body,t)}throw new Error("makeIterator")}var x=n(78741);const A="Cannot convert supplied data type";async function E(e,t,n){const r=e instanceof ArrayBuffer||ArrayBuffer.isView(e);if("string"==typeof e||r)return function(e,t,n){if(t.text&&"string"==typeof e)return e;if((0,f.zH)(e)&&(e=e.buffer),e instanceof ArrayBuffer){const n=e;return t.text&&!t.binary?new TextDecoder("utf8").decode(n):n}if(ArrayBuffer.isView(e)){if(t.text&&!t.binary)return new TextDecoder("utf8").decode(e);let n=e.buffer;const r=e.byteLength||e.length;return 0===e.byteOffset&&r===n.byteLength||(n=n.slice(e.byteOffset,e.byteOffset+r)),n}throw new Error(A)}(e,t);if((0,f.Lj)(e)&&(e=await(0,x.L1)(e)),(0,f.Ew)(e)){const n=e;return await(0,x.mm)(n),t.binary?await n.arrayBuffer():await n.text()}if((0,f.Os)(e)&&(e=v(e,n)),(0,f.TW)(e)||(0,f.D0)(e))return(0,p.GZ)(e);throw new Error(A)}var k=n(89752);var L=n(97949),C=n(86539);async function S(e,t,n,s){(0,r.h)(!s||"object"==typeof s),!t||Array.isArray(t)||(0,u.C)(t)||(s=void 0,n=t,t=void 0),e=await e,n=n||{};const{url:l}=(0,L.l)(e),p=function(e,t){if(!t&&e&&!Array.isArray(e))return e;let n;if(e&&(n=Array.isArray(e)?e:[e]),t&&t.loaders){const e=Array.isArray(t.loaders)?t.loaders:[t.loaders];n=n?[...n,...e]:e}return n&&n.length?n:null}(t,s),y=await(0,C.A)(e,p,n);return y?(s=function(e,t){let n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null;if(n)return n;const r={fetch:(0,k.b)(t,e),...e};return Array.isArray(r.loaders)||(r.loaders=null),r}({url:l,parse:S,loaders:p},n=(0,d.GR)(n,y,p,l),s),await async function(e,t,n,s){if((0,o.z)(e),(0,f.Ew)(t)){const e=t,{ok:n,redirected:r,status:o,statusText:a,type:i,url:c}=e,l=Object.fromEntries(e.headers.entries());s.response={headers:l,ok:n,redirected:r,status:o,statusText:a,type:i,url:c}}if(t=await E(t,e,n),e.parseTextSync&&"string"==typeof t)return n.dataType="text",e.parseTextSync(t,n,s,e);if(function(e,t){return!!i.Z.isSupported()&&!!(a.jU||null!=t&&t._nodeWorkers)&&e.worker&&(null==t?void 0:t.worker)}(e,n))return await c(e,t,n,s,S);if(e.parseText&&"string"==typeof t)return await e.parseText(t,n,s,e);if(e.parse)return await e.parse(t,n,s,e);throw(0,r.h)(!e.parseSync),new Error("".concat(e.id," loader - no parser found and worker is disabled"))}(y,e,n,s)):null}},99121:(e,t,n)=>{n.d(t,{fh:()=>i,kO:()=>s});var r=n(35163),o=n(48657);const a=()=>{const e=(0,o.rx)();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function i(e){const t=a();e=Array.isArray(e)?e:[e];for(const n of e){const e=(0,r.T)(n);t.find((t=>e===t))||t.unshift(e)}}function s(){return a()}},86539:(e,t,n)=>{n.d(t,{A:()=>f});var r=n(59645),o=n(2482),a=n(35163);const i=new(n(56426).Z)({id:"loaders.gl"});var s=n(97949),c=n(99121),l=n(745);const u=/\.([^.]+)$/;async function f(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],n=arguments.length>2?arguments[2]:void 0,r=arguments.length>3?arguments[3]:void 0;if(!p(e))return null;let o=d(e,t,{...n,nothrow:!0},r);if(o)return o;if((0,l.Lj)(e)&&(o=d(e=await e.slice(0,10).arrayBuffer(),t,n,r)),!(o||null!=n&&n.nothrow))throw new Error(y(e));return o}function d(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],n=arguments.length>2?arguments[2]:void 0,r=arguments.length>3?arguments[3]:void 0;if(!p(e))return null;if(t&&!Array.isArray(t))return(0,a.T)(t);let o=[];t&&(o=o.concat(t)),null!=n&&n.ignoreRegisteredLoaders||o.push(...(0,c.kO)()),function(e){for(const t of e)(0,a.T)(t)}(o);const l=function(e,t,n,r){const{url:o,type:a}=(0,s.l)(e),c=o||(null==r?void 0:r.url);let l=null,f="";null!=n&&n.mimeType&&(l=h(t,null==n?void 0:n.mimeType),f="match forced by supplied MIME type ".concat(null==n?void 0:n.mimeType));var d;l=l||function(e,t){const n=t&&u.exec(t),r=n&&n[1];return r?function(e,t){t=t.toLowerCase();for(const n of e)for(const e of n.extensions)if(e.toLowerCase()===t)return n;return null}(e,r):null}(t,c),f=f||(l?"matched url ".concat(c):""),l=l||h(t,a),f=f||(l?"matched MIME type ".concat(a):""),l=l||function(e,t){if(!t)return null;for(const n of e)if("string"==typeof t){if(g(t,n))return n}else if(ArrayBuffer.isView(t)){if(m(t.buffer,t.byteOffset,n))return n}else if(t instanceof ArrayBuffer){if(m(t,0,n))return n}return null}(t,e),f=f||(l?"matched initial data ".concat(w(e)):""),l=l||h(t,null==n?void 0:n.fallbackMimeType),f=f||(l?"matched fallback MIME type ".concat(a):""),f&&i.log(1,"selectLoader selected ".concat(null===(d=l)||void 0===d?void 0:d.name,": ").concat(f,"."));return l}(e,o,n,r);if(!(l||null!=n&&n.nothrow))throw new Error(y(e));return l}function p(e){return!(e instanceof Response&&204===e.status)}function y(e){const{url:t,type:n}=(0,s.l)(e);let o="No valid loader found (";o+=t?"".concat(r.vB(t),", "):"no url provided, ",o+="MIME type: ".concat(n?'"'.concat(n,'"'):"not provided",", ");const a=e?w(e):"";return o+=a?' first bytes: "'.concat(a,'"'):"first bytes: not available",o+=")",o}function h(e,t){for(const n of e){if(n.mimeTypes&&n.mimeTypes.includes(t))return n;if(t==="application/x.".concat(n.id))return n}return null}function g(e,t){if(t.testText)return t.testText(e);return(Array.isArray(t.tests)?t.tests:[t.tests]).some((t=>e.startsWith(t)))}function m(e,t,n){return(Array.isArray(n.tests)?n.tests:[n.tests]).some((r=>function(e,t,n,r){if(r instanceof ArrayBuffer)return(0,o.Xq)(r,e,r.byteLength);switch(typeof r){case"function":return r(e,n);case"string":return r===b(e,t,r.length);default:return!1}}(e,t,n,r)))}function w(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:5;if("string"==typeof e)return e.slice(0,t);if(ArrayBuffer.isView(e))return b(e.buffer,e.byteOffset,t);if(e instanceof ArrayBuffer){return b(e,0,t)}return""}function b(e,t,n){if(e.byteLength<t+n)return"";const r=new DataView(e);let o="";for(let a=0;a<n;a++)o+=String.fromCharCode(r.getUint8(t+a));return o}},8551:(e,t,n)=>{n.d(t,{d:()=>a});var r=n(96351),o=n(78741);async function a(e,t){if("string"==typeof e){e=(0,r.i3)(e);let n=t;return null!=t&&t.fetch&&"function"!=typeof(null==t?void 0:t.fetch)&&(n=t.fetch),await fetch(e,n)}return await(0,o.L1)(e)}},89752:(e,t,n)=>{n.d(t,{b:()=>i});var r=n(745),o=n(8551),a=n(48657);function i(e,t){const n=(0,a.pm)(),i=e||n;return"function"==typeof i.fetch?i.fetch:(0,r.Kn)(i.fetch)?e=>(0,o.d)(e,i):null!=t&&t.fetch?null==t?void 0:t.fetch:o.d}},35163:(e,t,n)=>{n.d(t,{C:()=>o,T:()=>a});var r=n(73613);function o(e){var t;if(!e)return!1;Array.isArray(e)&&(e=e[0]);return Array.isArray(null===(t=e)||void 0===t?void 0:t.extensions)}function a(e){var t,n;let a;return(0,r.h)(e,"null loader"),(0,r.h)(o(e),"invalid loader"),Array.isArray(e)&&(a=e[1],e=e[0],e={...e,options:{...e.options,...a}}),(null!==(t=e)&&void 0!==t&&t.parseTextSync||null!==(n=e)&&void 0!==n&&n.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}},48657:(e,t,n)=>{n.d(t,{pm:()=>f,rx:()=>u,GR:()=>d});var r=n(745),o=n(81180);const a=new(n(56426).Z)({id:"loaders.gl"});class i{log(){return()=>{}}info(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}}var s=n(39579);const c={fetch:null,mimeType:void 0,nothrow:!1,log:new class{constructor(){(0,o.Z)(this,"console",void 0),this.console=console}log(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return this.console.log.bind(this.console,...t)}info(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return this.console.info.bind(this.console,...t)}warn(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return this.console.warn.bind(this.console,...t)}error(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return this.console.error.bind(this.console,...t)}},CDN:"https://unpkg.com/@loaders.gl",worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:s.jU,_nodeWorkers:!1,_workerType:"",limit:0,_limitMB:0,batchSize:"auto",batchDebounceMs:0,metadata:!1,transforms:[]},l={throws:"nothrow",dataType:"(no longer used)",uri:"baseUri",method:"fetch.method",headers:"fetch.headers",body:"fetch.body",mode:"fetch.mode",credentials:"fetch.credentials",cache:"fetch.cache",redirect:"fetch.redirect",referrer:"fetch.referrer",referrerPolicy:"fetch.referrerPolicy",integrity:"fetch.integrity",keepalive:"fetch.keepalive",signal:"fetch.signal"};function u(){globalThis.loaders=globalThis.loaders||{};const{loaders:e}=globalThis;return e._state=e._state||{},e._state}const f=()=>{const e=u();return e.globalOptions=e.globalOptions||{...c},e.globalOptions};function d(e,t,n,r){return n=n||[],function(e,t){p(e,null,c,l,t);for(const n of t){const r=e&&e[n.id]||{},o=n.options&&n.options[n.id]||{},a=n.deprecatedOptions&&n.deprecatedOptions[n.id]||{};p(r,n.id,o,a,t)}}(e,n=Array.isArray(n)?n:[n]),h(t,e,r)}function p(e,t,n,o,i){const s=t||"Top level",c=t?"".concat(t,"."):"";for(const l in e){const u=!t&&(0,r.Kn)(e[l]);if(!(l in n)&&!("baseUri"===l&&!t)&&!("workerUrl"===l&&t))if(l in o)a.warn("".concat(s," loader option '").concat(c).concat(l,"' no longer supported, use '").concat(o[l],"'"))();else if(!u){const e=y(l,i);a.warn("".concat(s," loader option '").concat(c).concat(l,"' not recognized. ").concat(e))()}}}function y(e,t){const n=e.toLowerCase();let r="";for(const o of t)for(const t in o.options){if(e===t)return"Did you mean '".concat(o.id,".").concat(t,"'?");const a=t.toLowerCase();(n.startsWith(a)||a.startsWith(n))&&(r=r||"Did you mean '".concat(o.id,".").concat(t,"'?"))}return r}function h(e,t,n){const r={...e.options||{}};return function(e,t){t&&!("baseUri"in e)&&(e.baseUri=t)}(r,n),null===r.log&&(r.log=new i),g(r,f()),g(r,t),r}function g(e,t){for(const n in t)if(n in t){const o=t[n];(0,r.Ss)(o)&&(0,r.Ss)(e[n])?e[n]={...e[n],...t[n]}:e[n]=t[n]}}},97949:(e,t,n)=>{n.d(t,{C:()=>u,l:()=>l});var r=n(745);const o=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,a=/^([-\w.]+\/[-\w.+]+)/;function i(e){const t=a.exec(e);return t?t[1]:e}function s(e){const t=o.exec(e);return t?t[1]:""}const c=/\?.*/;function l(e){if((0,r.Ew)(e)){const t=f(e.url||"");return{url:t,type:i(e.headers.get("content-type")||"")||s(t)}}return(0,r.Lj)(e)?{url:f(e.name||""),type:e.type||""}:"string"==typeof e?{url:f(e),type:s(e)}:{url:"",type:""}}function u(e){return(0,r.Ew)(e)?e.headers["content-length"]||-1:(0,r.Lj)(e)?e.size:"string"==typeof e?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}function f(e){return e.replace(c,"")}},78741:(e,t,n)=>{n.d(t,{L1:()=>a,mm:()=>i});var r=n(745),o=n(97949);async function a(e){if((0,r.Ew)(e))return e;const t={},n=(0,o.C)(e);n>=0&&(t["content-length"]=String(n));const{url:a,type:i}=(0,o.l)(e);i&&(t["content-type"]=i);const s=await async function(e){const t=5;if("string"==typeof e)return"data:,".concat(e.slice(0,t));if(e instanceof Blob){const t=e.slice(0,5);return await new Promise((e=>{const n=new FileReader;n.onload=t=>{var n;return e(null==t||null===(n=t.target)||void 0===n?void 0:n.result)},n.readAsDataURL(t)}))}if(e instanceof ArrayBuffer){const n=function(e){let t="";const n=new Uint8Array(e);for(let r=0;r<n.byteLength;r++)t+=String.fromCharCode(n[r]);return btoa(t)}(e.slice(0,t));return"data:base64,".concat(n)}return null}(e);s&&(t["x-first-bytes"]=s),"string"==typeof e&&(e=(new TextEncoder).encode(e));const c=new Response(e,{headers:t});return Object.defineProperty(c,"url",{value:a}),c}async function i(e){if(!e.ok){const t=await async function(e){let t="Failed to fetch resource ".concat(e.url," (").concat(e.status,"): ");try{const n=e.headers.get("Content-Type");let r=e.statusText;n.includes("application/json")&&(r+=" ".concat(await e.text())),t+=r,t=t.length>60?"".concat(t.slice(0,60),"..."):t}catch(n){}return t}(e);throw new Error(t)}}},87391:(e,t,n)=>{n.d(t,{S:()=>a});var r=n(77552),o=n(46936);const a={id:"image",module:"images",name:"Images",version:"3.4.0-alpha.2",mimeTypes:["image/png","image/jpeg","image/gif","image/webp","image/avif","image/bmp","image/vnd.microsoft.icon","image/svg+xml"],extensions:["png","jpg","jpeg","gif","webp","bmp","ico","svg","avif"],parse:r.Z,tests:[e=>Boolean((0,o.I)(new DataView(e)))],options:{image:{type:"auto",decode:!0}}}},46936:(e,t,n)=>{function r(e){return function(e,t){let n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;const r=(o=t,[...o].map((e=>e.charCodeAt(0))));var o;for(let a=0;a<r.length;++a)if(r[a]!==e[a+n])return!1;return!0}(e,"ftyp",4)?0==(96&e[8])?null:function(e){switch((t=e,n=8,r=12,String.fromCharCode(...t.slice(n,r))).replace("\0"," ").trim()){case"avif":case"avis":return{extension:"avif",mimeType:"image/avif"};default:return null}var t,n,r}(e):null}n.d(t,{I:()=>i});const o=!1,a=!0;function i(e){const t=s(e);return function(e){const t=s(e),n=t.byteLength>=24&&2303741511===t.getUint32(0,o);if(!n)return null;return{mimeType:"image/png",width:t.getUint32(16,o),height:t.getUint32(20,o)}}(t)||function(e){const t=s(e),n=t.byteLength>=3&&65496===t.getUint16(0,o)&&255===t.getUint8(2);if(!n)return null;const{tableMarkers:r,sofMarkers:a}=function(){const e=new Set([65499,65476,65484,65501,65534]);for(let n=65504;n<65520;++n)e.add(n);const t=new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502]);return{tableMarkers:e,sofMarkers:t}}();let i=2;for(;i+9<t.byteLength;){const e=t.getUint16(i,o);if(a.has(e))return{mimeType:"image/jpeg",height:t.getUint16(i+5,o),width:t.getUint16(i+7,o)};if(!r.has(e))return null;i+=2,i+=t.getUint16(i,o)}return null}(t)||function(e){const t=s(e),n=t.byteLength>=10&&1195984440===t.getUint32(0,o);if(!n)return null;return{mimeType:"image/gif",width:t.getUint16(6,a),height:t.getUint16(8,a)}}(t)||function(e){const t=s(e),n=t.byteLength>=14&&16973===t.getUint16(0,o)&&t.getUint32(2,a)===t.byteLength;if(!n)return null;return{mimeType:"image/bmp",width:t.getUint32(18,a),height:t.getUint32(22,a)}}(t)||function(e){const t=new Uint8Array(e instanceof DataView?e.buffer:e),n=r(t);if(!n)return null;return{mimeType:n.mimeType,width:0,height:0}}(t)}function s(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw new Error("toDataView")}},72944:(e,t,n)=>{function r(e){const t=i(e);if(!t)throw new Error("Not an image");return t}function o(e){return a(e)}function a(e){switch(r(e)){case"data":return e;case"image":case"imagebitmap":const t=document.createElement("canvas"),n=t.getContext("2d");if(!n)throw new Error("getImageData");return t.width=e.width,t.height=e.height,n.drawImage(e,0,0),n.getImageData(0,0,e.width,e.height);default:throw new Error("getImageData")}}function i(e){return"undefined"!=typeof ImageBitmap&&e instanceof ImageBitmap?"imagebitmap":"undefined"!=typeof Image&&e instanceof Image?"image":e&&"object"==typeof e&&e.data&&e.width&&e.height?"data":null}n.d(t,{Ad:()=>o,n$:()=>a})},77552:(e,t,n)=>{n.d(t,{Z:()=>v});var r=n(73613),o=n(39579);const{_parseImageNode:a}=globalThis,i="undefined"!=typeof Image,s="undefined"!=typeof ImageBitmap,c=Boolean(a),l=!!o.jU||c;var u=n(72944);const f=/^data:image\/svg\+xml/,d=/\.svg((\?|#).*)?$/;function p(e){return e&&(f.test(e)||d.test(e))}function y(e,t){if(p(t))throw new Error("SVG cannot be parsed directly to imagebitmap");return new Blob([new Uint8Array(e)])}async function h(e,t,n){const r=function(e,t){if(p(t)){let t=(new TextDecoder).decode(e);try{"function"==typeof unescape&&"function"==typeof encodeURIComponent&&(t=unescape(encodeURIComponent(t)))}catch(n){throw new Error(n.message)}return"data:image/svg+xml;base64,".concat(btoa(t))}return y(e,t)}(e,n),o=self.URL||self.webkitURL,a="string"!=typeof r&&o.createObjectURL(r);try{return await async function(e,t){const n=new Image;if(n.src=e,t.image&&t.image.decode&&n.decode)return await n.decode(),n;return await new Promise(((t,r)=>{try{n.onload=()=>t(n),n.onerror=t=>r(new Error("Could not load image ".concat(e,": ").concat(t)))}catch(o){r(o)}}))}(a||r,t)}finally{a&&o.revokeObjectURL(a)}}const g={};let m=!0;async function w(e,t,n){let r;if(p(n)){r=await h(e,t,n)}else r=y(e,n);const o=t&&t.imagebitmap;return await async function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;!function(e){for(const t in e||g)return!1;return!0}(t)&&m||(t=null);if(t)try{return await createImageBitmap(e,t)}catch(n){console.warn(n),m=!1}return await createImageBitmap(e)}(r,o)}var b=n(46936);async function v(e,t,n){const o=((t=t||{}).image||{}).type||"auto",{url:a}=n||{};let c;switch(function(e){switch(e){case"auto":case"data":return function(){if(s)return"imagebitmap";if(i)return"image";if(l)return"data";throw new Error("Install '@loaders.gl/polyfills' to parse images under Node.js")}();default:return function(e){switch(e){case"auto":return s||i||l;case"imagebitmap":return s;case"image":return i;case"data":return l;default:throw new Error("@loaders.gl/images: image ".concat(e," not supported in this environment"))}}(e),e}}(o)){case"imagebitmap":c=await w(e,t,a);break;case"image":c=await h(e,t,a);break;case"data":c=await async function(e,t){const{mimeType:n}=(0,b.I)(e)||{},o=globalThis._parseImageNode;return(0,r.h)(o),await o(e,n)}(e);break;default:(0,r.h)(!1)}return"data"===o&&(c=(0,u.n$)(c)),c}},2482:(e,t,n)=>{function r(e,t,n){if(n=n||e.byteLength,e.byteLength<n||t.byteLength<n)return!1;const r=new Uint8Array(e),o=new Uint8Array(t);for(let a=0;a<r.length;++a)if(r[a]!==o[a])return!1;return!0}function o(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];const r=t.map((e=>e instanceof ArrayBuffer?new Uint8Array(e):e)),o=r.reduce(((e,t)=>e+t.byteLength),0),a=new Uint8Array(o);let i=0;for(const s of r)a.set(s,i),i+=s.byteLength;return a.buffer}function a(e,t,n){const r=void 0!==n?new Uint8Array(e).subarray(t,t+n):new Uint8Array(e).subarray(t);return new Uint8Array(r).buffer}n.d(t,{JY:()=>o,Xq:()=>r,qv:()=>a})},73613:(e,t,n)=>{function r(e,t){if(!e)throw new Error(t||"loader assertion failed.")}n.d(t,{h:()=>r})},39579:(e,t,n)=>{n.d(t,{jU:()=>r});"undefined"!=typeof self&&self,"undefined"!=typeof window&&window,void 0!==n.g&&n.g,"undefined"!=typeof document&&document;const r=Boolean("object"!=typeof process||"[object process]"!==String(process)||process.browser),o="undefined"!=typeof process&&process.version&&/v([0-9]*)/.exec(process.version);o&&parseFloat(o[1])},25735:(e,t,n)=>{n.d(t,{Ed:()=>o,GZ:()=>a});var r=n(2482);async function o(e,t){for(;;){const{done:n,value:r}=await e.next();if(n)return void e.return();if(t(r))return}}async function a(e){const t=[];for await(const n of e)t.push(n);return(0,r.JY)(...t)}},96351:(e,t,n)=>{n.d(t,{i3:()=>a});let r="";const o={};function a(e){for(const t in o)if(e.startsWith(t)){const n=o[t];e=e.replace(t,n)}return e.startsWith("http://")||e.startsWith("https://")||(e="".concat(r).concat(e)),e}},59645:(e,t,n)=>{function r(e){const t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(t+1):""}function o(e){const t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(0,t):""}n.d(t,{XX:()=>o,vB:()=>r})}}]);