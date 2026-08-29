"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["92117"],{51009(e,t,i){i.d(t,{A:()=>A});var o=i(9350),s=i(3459),r=i(6116),n=i(7914);class a{static get componentName(){return Object.prototype.hasOwnProperty.call(this,"extensionName")?this.extensionName:""}constructor(e){e&&(this.opts=e)}equals(e){return this===e||this.constructor===e.constructor&&(0,n.b)(this.opts,e.opts,1)}getShaders(e){return null}getSubLayerProps(e){let{defaultProps:t}=e.constructor,i={updateTriggers:{}};for(let e in t)if(e in this.props){let o=t[e],s=this.props[e];i[e]=s,o&&"accessor"===o.type&&(i.updateTriggers[e]=this.props.updateTriggers[e],"function"==typeof s&&(i[e]=this.getSubLayerAccessor(s)))}return i}initializeState(e,t){}updateState(e,t){}onNeedsRedraw(e){}getNeedsPickingBuffer(e){return!1}draw(e,t){}finalizeState(e,t){}}a.defaultProps={},a.extensionName="LayerExtension";let l=a,c=`
layout(std140) uniform clipUniforms {
  vec4 bounds;
} clip;

bool clip_isInBounds(vec2 position) {
  return position.x >= clip.bounds[0] && position.y >= clip.bounds[1] && position.x < clip.bounds[2] && position.y < clip.bounds[3];
}
`,u={name:"clip",vs:c,uniformTypes:{bounds:"vec4<f32>"}},d={"vs:#decl":`
out float clip_isVisible;
`,"vs:DECKGL_FILTER_GL_POSITION":`
  clip_isVisible = float(clip_isInBounds(geometry.worldPosition.xy));
`,"fs:#decl":`
in float clip_isVisible;
`,"fs:DECKGL_FILTER_COLOR":`
  if (clip_isVisible < 0.5) discard;
`},h={name:"clip",fs:c,uniformTypes:{bounds:"vec4<f32>"}},p={"vs:#decl":`
out vec2 clip_commonPosition;
`,"vs:DECKGL_FILTER_GL_POSITION":`
  clip_commonPosition = geometry.position.xy;
`,"fs:#decl":`
in vec2 clip_commonPosition;
`,"fs:DECKGL_FILTER_COLOR":`
  if (!clip_isInBounds(clip_commonPosition)) discard;
`};class f extends l{getShaders(){let e="instancePositions"in this.getAttributeManager().attributes;return void 0!==this.props.clipByInstance&&(e=!!this.props.clipByInstance),this.state.clipByInstance=e,e?{modules:[u],inject:d}:{modules:[h],inject:p}}draw(){let{clipBounds:e}=this.props,t={};if(this.state.clipByInstance)t.bounds=e;else{let i=this.projectPosition([e[0],e[1],0]),o=this.projectPosition([e[2],e[3],0]);t.bounds=[Math.min(i[0],o[0]),Math.min(i[1],o[1]),Math.max(i[0],o[0]),Math.max(i[1],o[1])]}this.setShaderModuleProps({clip:t})}}f.defaultProps={clipBounds:[0,0,1,1],clipByInstance:void 0},f.extensionName="ClipExtension";var g=i(31886),m=i(33088),_=i(74432),v=i(54901);let y={Point:b,MultiPoint:function(e,t,i){return x(e,t,i)},LineString:function(e,t,i){return x(e,t,i)},MultiLineString:function(e,t,i){return e.map(e=>x(e,t,i))},Polygon:w,MultiPolygon:function(e,t,i){return e.map(e=>w(e,t,i))}};function b([e,t],[i,o],s){let r=(0,v.Cc)(i[0],o[0],e),n=(0,v.Cc)(i[1],o[1],t);return s.unprojectFlat([r,n])}function x(e,t,i){return e.map(e=>b(e,t,i))}function w(e,t,i){return e.map(e=>x(e,t,i))}let P=["points","lines","polygons"];function C(e,t,i,o){for(let s=i;s<o;s++)if(t(e[s],s))return s;return -1}var S=i(32528),T=i(33429);let L={...r.A.defaultProps,data:T.cS,onDataLoad:{type:"function",value:null,optional:!0,compare:!1},uniqueIdProperty:"",highlightedFeatureId:null,loaders:[m.f],binary:!0};class M extends S.A{initializeState(){super.initializeState();let e=void 0===this.context.viewport.resolution&&this.props.binary;this.setState({binary:e,data:null,tileJSON:null,hoveredFeatureId:null,hoveredFeatureLayerName:null})}get isLoaded(){return!!(this.state?.data&&super.isLoaded)}updateState({props:e,oldProps:t,context:i,changeFlags:o}){o.dataChanged&&this._updateTileData(),this.state?.data&&(super.updateState({props:e,oldProps:t,context:i,changeFlags:o}),this._setWGS84PropertyForTiles());let{highlightColor:s}=e;s!==t.highlightColor&&Array.isArray(s)&&this.setState({highlightColor:s})}async _updateTileData(){let e=this.props.data,t=null;if("string"!=typeof e||(0,T.Ar)(e))e&&"object"==typeof e&&"tilejson"in e&&(t=e);else{let{onDataLoad:i,fetch:o}=this.props;this.setState({data:null,tileJSON:null});try{t=await o(e,{propName:"data",layer:this,loaders:[]})}catch(t){this.raiseError(t,"loading TileJSON"),e=null}i&&i(t,{propName:"data",layer:this})}t&&(e=t.tiles),this.setState({data:e,tileJSON:t})}_getTilesetOptions(){let e=super._getTilesetOptions(),t=this.state.tileJSON,{minZoom:i,maxZoom:o}=this.props;return t&&(Number.isFinite(t.minzoom)&&t.minzoom>i&&(e.minZoom=t.minzoom),Number.isFinite(t.maxzoom)&&(!Number.isFinite(o)||t.maxzoom<o)&&(e.maxZoom=t.maxzoom)),e}renderLayers(){return this.state?.data?super.renderLayers():null}getTileData(e){let{data:t,binary:i}=this.state,{index:o,signal:s}=e,r=(0,T.g8)(t,e);if(!r)return Promise.reject("Invalid URL");let n=this.getLoadOptions(),{fetch:a}=this.props;return a(r,{propName:"data",layer:this,loadOptions:n={...n,core:{...n?.core,mimeType:"application/x-protobuf"},mvt:{...n?.mvt,shape:i?"binary":"geojson",coordinates:this.context.viewport.resolution?"wgs84":"local",tileIndex:o}},signal:s})}renderSubLayers(e){let{x:t,y:i,z:n}=e.tile.index,a=Math.pow(2,n),l=512/a,c=new g.k().scale([l,-l,1]);e.autoHighlight=!1,this.context.viewport.resolution||(e.modelMatrix=c,e.coordinateOrigin=[512*t/a,512*(1-i/a),0],e.coordinateSystem=o.rf.CARTESIAN,e.extensions=[...e.extensions||[],new f]);let u=super.renderSubLayers(e);return!this.state.binary||u instanceof r.A||s.A.warn("renderSubLayers() must return GeoJsonLayer when using binary:true")(),u}_updateAutoHighlight(e){let{uniqueIdProperty:t}=this.props,{hoveredFeatureId:i,hoveredFeatureLayerName:o}=this.state,s=e.object,r=null,n=null;s&&(r=I(s,t),n=z(s));let{highlightColor:a}=this.props;"function"==typeof a&&(a=a(e)),(i!==r||o!==n)&&this.setState({highlightColor:a,hoveredFeatureId:r,hoveredFeatureLayerName:n})}_isWGS84(){return!!this.context.viewport.resolution}getPickingInfo(e){let t=super.getPickingInfo(e);if(this.state.binary&&-1!==t.index){let{data:i}=e.sourceLayer.props;t.object=(0,_.Ki)(i,{globalFeatureId:t.index})}return t.object&&!this._isWGS84()&&(t.object=R(t.object,t.tile.bbox,this.context.viewport)),t}getSubLayerPropsByTile(e){return{highlightedObjectIndex:this.getHighlightedObjectIndex(e),highlightColor:this.state.highlightColor}}getHighlightedObjectIndex(e){let{hoveredFeatureId:t,hoveredFeatureLayerName:i,binary:o}=this.state,{uniqueIdProperty:s,highlightedFeatureId:r}=this.props,n=e.content,a=O(r);if(!(O(t)||a))return -1;let l=a?r:t;if(Array.isArray(n))return n.findIndex(e=>{let t=I(e,s)===l,o=a||z(e)===i;return t&&o});if(n&&o){var c=a?"":i;for(let e of P){let t=n[e]&&function(e,t,i,o){let s=e.featureIds.value;if(!s.length)return -1;let r=0,n=s[s.length-1]+1;if(o){let t=function(e,t){if(!e.__layers){let t={},{properties:i}=e;for(let e=0;e<i.length;e++){let{layerName:o}=i[e];o&&(t[o]?t[o][1]=e:t[o]=[e,e])}e.__layers=t}return e.__layers[t]}(e,o);if(!t)return -1;r=t[0],n=t[1]+1}let a=-1;if(t in e.numericProps){let o=e.numericProps[t].value.findIndex((e,t)=>e===i&&s[t]>=r&&s[t]<n);return o>=0?e.globalFeatureIds.value[o]:-1}return t?a=C(e.properties,e=>e[t]===i,r,n):e.fields&&(a=C(e.fields,e=>e.id===i,r,n)),a>=0?function(e,t){if(!e.__ids){let t=[],i=e.featureIds.value,o=e.globalFeatureIds.value;for(let e=0;e<i.length;e++)t[i[e]]=o[e];e.__ids=t}return e.__ids[t]}(e,a):-1}(n[e],s,l,c);if(t>=0)return t}}return -1}_pickObjects(e){let{deck:t,viewport:i}=this.context,o=i.width,s=i.height,r=i.x,n=i.y,a=[this.id];return t.pickObjects({x:r,y:n,width:o,height:s,layerIds:a,maxObjects:e})}getRenderedFeatures(e=null){let t=this._pickObjects(e),i=new Set,o=[];for(let e of t){let t=I(e.object,this.props.uniqueIdProperty);void 0===t?o.push(e.object):i.has(t)||(i.add(t),o.push(e.object))}return o}_setWGS84PropertyForTiles(){let e="dataInWGS84";this.state.tileset.selectedTiles.forEach(t=>{t.hasOwnProperty(e)||Object.defineProperty(t,e,{get:()=>{if(!t.content)return null;if(this.state.binary&&Array.isArray(t.content)&&!t.content.length)return[];let{bbox:e}=t;if(void 0===t._contentWGS84&&(0,T.NV)(e)){let i=this.state.binary?(0,_.Ki)(t.content):t.content;t._contentWGS84=i.map(t=>R(t,e,this.context.viewport))}return t._contentWGS84}})})}}M.layerName="MVTLayer",M.defaultProps=L;let A=M;function I(e,t){return e.properties&&t?e.properties[t]:"id"in e?e.id:void 0}function z(e){return e.properties?.layerName||null}function O(e){return null!=e&&""!==e}function R(e,t,i){let o={...e,geometry:{type:e.geometry.type}};return Object.defineProperty(o.geometry,"coordinates",{get:()=>{var o;let s,r;return(o=e.geometry,s=i.projectFlat([t.west,t.north]),r=i.projectFlat([t.east,t.south]),{...o,coordinates:y[o.type](o.coordinates,[s,r],i)}).coordinates}}),o}},32528(e,t,i){i.d(t,{A:()=>v});var o=i(59452),s=i(38055),r=i(6116),n=i(45492),a=i(31886),l=i(54901);class c{constructor(e){this.index=e,this.isVisible=!1,this.isSelected=!1,this.parent=null,this.children=[],this.content=null,this._loader=void 0,this._abortController=null,this._loaderId=0,this._isLoaded=!1,this._isCancelled=!1,this._needsReload=!1}get bbox(){return this._bbox}set bbox(e){this._bbox||(this._bbox=e,"west"in e?this.boundingBox=[[e.west,e.south],[e.east,e.north]]:this.boundingBox=[[e.left,e.top],[e.right,e.bottom]])}get data(){return this.isLoading&&this._loader?this._loader.then(()=>this.data):this.content}get isLoaded(){return this._isLoaded&&!this._needsReload}get isLoading(){return!!this._loader&&!this._isCancelled}get needsReload(){return this._needsReload||this._isCancelled}get byteLength(){let e=this.content?this.content.byteLength:0;return Number.isFinite(e)||console.error("byteLength not defined in tile data"),e}async _loadData({getData:e,requestScheduler:t,onLoad:i,onError:o}){let s,{index:r,id:n,bbox:a,userData:l,zoom:c}=this,u=this._loaderId;this._abortController=new AbortController;let{signal:d}=this._abortController,h=await t.scheduleRequest(this,e=>e.isSelected?1:-1);if(!h){this._isCancelled=!0;return}if(this._isCancelled)return void h.done();let p=null;try{p=await e({index:r,id:n,bbox:a,userData:l,zoom:c,signal:d})}catch(e){s=e||!0}finally{h.done()}if(u===this._loaderId){if(this._loader=void 0,this.content=p,this._isCancelled&&!p){this._isLoaded=!1;return}this._isLoaded=!0,this._isCancelled=!1,s?o(s,this):i(this)}}loadData(e){return this._isLoaded=!1,this._isCancelled=!1,this._needsReload=!1,this._loaderId++,this._loader=this._loadData(e),this._loader}setNeedsReload(){this.isLoading&&(this.abort(),this._loader=void 0),this._needsReload=!0}abort(){this.isLoaded||(this._isCancelled=!0,this._abortController?.abort())}}var u=i(33429);let d="best-available",h={[d]:function(e){for(let t of e)t.state=0;for(let t of e)t.isSelected&&!f(t)&&g(t);for(let t of e)t.isVisible=!!(2&t.state)},"no-overlap":function(e){for(let t of e)t.state=0;for(let t of e)t.isSelected&&f(t);for(let t of Array.from(e).sort((e,t)=>e.zoom-t.zoom))if(t.isVisible=!!(2&t.state),t.children&&(t.isVisible||1&t.state))for(let e of t.children)e.state=1;else t.isSelected&&g(t)},never:()=>{}},p={extent:null,tileSize:512,maxZoom:null,minZoom:null,maxCacheSize:null,maxCacheByteSize:null,refinementStrategy:"best-available",zRange:null,maxRequests:6,debounceTime:0,zoomOffset:0,visibleMinZoom:null,visibleMaxZoom:null,onTileLoad:()=>{},onTileUnload:()=>{},onTileError:()=>{}};function f(e){let t=e;for(;t;){if(t.isLoaded||t.content)return t.state|=2,!0;t=t.parent}return!1}function g(e){for(let t of e.children)t.isLoaded||t.content?t.state|=2:g(t)}let m={TilesetClass:class{constructor(e){var t;let i,o;this._getCullBounds=(t=u.ws,o={},e=>{for(let s in e)if(!function(e,t){if(e===t)return!0;if(Array.isArray(e)){let i=e.length;if(!t||t.length!==i)return!1;for(let o=0;o<i;o++)if(e[o]!==t[o])return!1;return!0}return!1}(e[s],o[s])){i=t(e),o=e;break}return i}),this.opts={...p,...e},this.setOptions(this.opts),this.onTileLoad=e=>{this.opts.onTileLoad?.(e),null!==this.opts.maxCacheByteSize&&(this._cacheByteSize+=e.byteLength,this._resizeCache())},this._requestScheduler=new n.A({throttleRequests:this.opts.maxRequests>0||this.opts.debounceTime>0,maxRequests:this.opts.maxRequests,debounceTime:this.opts.debounceTime}),this._cache=new Map,this._tiles=[],this._dirty=!1,this._cacheByteSize=0,this._viewport=null,this._zRange=null,this._selectedTiles=null,this._frameNumber=0,this._modelMatrix=new a.k,this._modelMatrixInverse=new a.k}get tiles(){return this._tiles}get selectedTiles(){return this._selectedTiles}get isLoaded(){return null!==this._selectedTiles&&this._selectedTiles.every(e=>e.isLoaded)}get needsReload(){return null!==this._selectedTiles&&this._selectedTiles.some(e=>e.needsReload)}setOptions(e){Object.assign(this.opts,e),Number.isFinite(e.maxZoom)&&(this._maxZoom=Math.floor(e.maxZoom)),Number.isFinite(e.minZoom)&&(this._minZoom=Math.ceil(e.minZoom)),this._viewport=null}finalize(){for(let e of this._cache.values())e.isLoading&&e.abort();this._cache.clear(),this._tiles=[],this._selectedTiles=null}reloadAll(){for(let e of this._cache.keys()){let t=this._cache.get(e);this._selectedTiles&&this._selectedTiles.includes(t)?t.setNeedsReload():this._cache.delete(e)}}update(e,{zRange:t,modelMatrix:i}={zRange:null,modelMatrix:null}){let o=i?new a.k(i):new a.k,s=!o.equals(this._modelMatrix);if(this._viewport&&e.equals(this._viewport)&&(0,l.aI)(this._zRange,t)&&!s)this.needsReload&&(this._selectedTiles=this._selectedTiles.map(e=>this._getTile(e.index,!0)));else{s&&(this._modelMatrixInverse=o.clone().invert(),this._modelMatrix=o),this._viewport=e,this._zRange=t;let i=this.getTileIndices({viewport:e,maxZoom:this._maxZoom,minZoom:this._minZoom,zRange:t,modelMatrix:this._modelMatrix,modelMatrixInverse:this._modelMatrixInverse});this._selectedTiles=i.map(e=>this._getTile(e,!0)),this._dirty&&this._rebuildTree()}let r=this.updateTileStates();return this._pruneRequests(),this._dirty&&this._resizeCache(),r&&this._frameNumber++,this._frameNumber}isTileVisible(e,t,i){if(!e.isVisible)return!1;if(t&&this._viewport){let o=this._getCullBounds({viewport:this._viewport,z:this._zRange,cullRect:t}),{bbox:s}=e;for(let[e,t,r,n]of o){let o;if("west"in s)o=s.west<r&&s.east>e&&s.south<n&&s.north>t;else{if(i&&!a.k.IDENTITY.equals(i)){let[e,t,o,r]=(0,u.Ww)([s.left,s.top,s.right,s.bottom],i);s={left:e,top:t,right:o,bottom:r}}let l=Math.min(s.top,s.bottom),c=Math.max(s.top,s.bottom);o=s.left<r&&s.right>e&&l<n&&c>t}if(o)return!0}return!1}return!0}getTileIndices({viewport:e,maxZoom:t,minZoom:i,zRange:o,modelMatrix:s,modelMatrixInverse:r}){let{tileSize:n,extent:a,zoomOffset:l,visibleMinZoom:c,visibleMaxZoom:d}=this.opts;return(0,u.Om)({viewport:e,maxZoom:t,minZoom:i,zRange:o,tileSize:n,extent:a,modelMatrix:s,modelMatrixInverse:r,zoomOffset:l,visibleMinZoom:c,visibleMaxZoom:d})}getTileId(e){return`${e.x}-${e.y}-${e.z}`}getTileZoom(e){return e.z}getTileMetadata(e){let{tileSize:t}=this.opts;return{bbox:(0,u.bR)(this._viewport,e.x,e.y,e.z,t)}}getParentIndex(e){let t=Math.floor(e.x/2);return{x:t,y:Math.floor(e.y/2),z:e.z-1}}updateTileStates(){let e=this.opts.refinementStrategy||d,t=Array(this._cache.size),i=0;for(let e of this._cache.values())t[i++]=e.isVisible,e.isSelected=!1,e.isVisible=!1;for(let e of this._selectedTiles)e.isSelected=!0,e.isVisible=!0;for(let o of(("function"==typeof e?e:h[e])(Array.from(this._cache.values())),i=0,this._cache.values()))if(t[i++]!==o.isVisible)return!0;return!1}_pruneRequests(){let{maxRequests:e=0}=this.opts,t=[],i=0;for(let e of this._cache.values())e.isLoading&&(i++,e.isSelected||e.isVisible||t.push(e));for(;e>0&&i>e&&t.length>0;)t.shift().abort(),i--}_rebuildTree(){let{_cache:e}=this;for(let t of e.values())t.parent=null,t.children&&(t.children.length=0);for(let t of e.values()){let e=this._getNearestAncestor(t);t.parent=e,e?.children&&e.children.push(t)}}_resizeCache(){let{_cache:e,opts:t}=this,i=t.maxCacheSize??(null!==t.maxCacheByteSize?1/0:5*this.selectedTiles.length),o=t.maxCacheByteSize??1/0;if(e.size>i||this._cacheByteSize>o){for(let[s,r]of e)if(r.isVisible||r.isSelected||(this._cacheByteSize-=null!==t.maxCacheByteSize?r.byteLength:0,e.delete(s),this.opts.onTileUnload?.(r)),e.size<=i&&this._cacheByteSize<=o)break;this._rebuildTree(),this._dirty=!0}this._dirty&&(this._tiles=Array.from(this._cache.values()).sort((e,t)=>e.zoom-t.zoom),this._dirty=!1)}_getTile(e,t){let i=this.getTileId(e),o=this._cache.get(i),s=!1;return!o&&t?(Object.assign(o=new c(e),this.getTileMetadata(o.index)),Object.assign(o,{id:i,zoom:this.getTileZoom(o.index)}),s=!0,this._cache.set(i,o),this._dirty=!0):o&&o.needsReload&&(s=!0),o&&s&&o.loadData({getData:this.opts.getTileData,requestScheduler:this._requestScheduler,onLoad:this.onTileLoad,onError:this.opts.onTileError}),o}_getNearestAncestor(e){let{_minZoom:t=0}=this,i=e.index;for(;this.getTileZoom(i)>t;){i=this.getParentIndex(i);let e=this._getTile(i);if(e)return e}return null}},data:{type:"data",value:[]},dataComparator:u.cS.equal,renderSubLayers:{type:"function",value:e=>new r.A(e)},getTileData:{type:"function",optional:!0,value:null},onViewportLoad:{type:"function",optional:!0,value:null},onTileLoad:{type:"function",value:e=>{}},onTileUnload:{type:"function",value:e=>{}},onTileError:{type:"function",value:e=>console.error(e)},extent:{type:"array",optional:!0,value:null,compare:!0},tileSize:512,maxZoom:null,minZoom:0,maxCacheSize:null,maxCacheByteSize:null,refinementStrategy:d,zRange:null,maxRequests:6,debounceTime:0,zoomOffset:0,visibleMinZoom:null,visibleMaxZoom:null};class _ extends o.A{initializeState(){this.state={tileset:null,isLoaded:!1}}finalizeState(){this.state?.tileset?.finalize()}get isLoaded(){return!!this.state?.tileset?.selectedTiles?.every(e=>e.isLoaded&&(!e.content||!e.layers||e.layers.every(e=>e.isLoaded)))}shouldUpdateState({changeFlags:e}){return e.somethingChanged}updateState({changeFlags:e}){let{tileset:t}=this.state,i=e.propsOrDataChanged||e.updateTriggersChanged,o=e.dataChanged||e.updateTriggersChanged&&(e.updateTriggersChanged.all||e.updateTriggersChanged.getTileData);t?i&&(t.setOptions(this._getTilesetOptions()),o?t.reloadAll():t.tiles.forEach(e=>{e.layers=null})):(t=new this.props.TilesetClass(this._getTilesetOptions()),this.setState({tileset:t})),this._updateTileset()}_getTilesetOptions(){let{tileSize:e,maxCacheSize:t,maxCacheByteSize:i,refinementStrategy:o,extent:s,maxZoom:r,minZoom:n,maxRequests:a,debounceTime:l,zoomOffset:c,visibleMinZoom:u,visibleMaxZoom:d}=this.props;return{maxCacheSize:t,maxCacheByteSize:i,maxZoom:r,minZoom:n,tileSize:e,refinementStrategy:o,extent:s,maxRequests:a,debounceTime:l,zoomOffset:c,visibleMinZoom:u,visibleMaxZoom:d,getTileData:this.getTileData.bind(this),onTileLoad:this._onTileLoad.bind(this),onTileError:this._onTileError.bind(this),onTileUnload:this._onTileUnload.bind(this)}}_updateTileset(){let e=this.state.tileset,{zRange:t,modelMatrix:i}=this.props,o=e.update(this.context.viewport,{zRange:t,modelMatrix:i}),{isLoaded:s}=e,r=this.state.isLoaded!==s,n=this.state.frameNumber!==o;s&&(r||n)&&this._onViewportLoad(),n&&this.setState({frameNumber:o}),this.state.isLoaded=s}_onViewportLoad(){let{tileset:e}=this.state,{onViewportLoad:t}=this.props;t&&t(e.selectedTiles)}_onTileLoad(e){this.props.onTileLoad(e),e.layers=null,this.setNeedsUpdate()}_onTileError(e,t){this.props.onTileError(e),t.layers=null,this.setNeedsUpdate()}_onTileUnload(e){this.props.onTileUnload(e)}getTileData(e){let{data:t,getTileData:i,fetch:o}=this.props,{signal:s}=e;return(e.url="string"==typeof t||Array.isArray(t)?(0,u.g8)(t,e):null,i)?i(e):o&&e.url?o(e.url,{propName:"data",layer:this,signal:s}):null}renderSubLayers(e){return this.props.renderSubLayers(e)}getSubLayerPropsByTile(e){return null}getPickingInfo(e){let t=e.sourceLayer,i=t.props.tile,o=e.info;return o.picked&&(o.tile=i),o.sourceTile=i,o.sourceTileSubLayer=t,o}_updateAutoHighlight(e){e.sourceTileSubLayer.updateAutoHighlight(e)}renderLayers(){let{visibleMinZoom:e,visibleMaxZoom:t,minZoom:i,extent:o}=this.props,r=this.context.viewport.zoom;if(null!=e&&r<e||null!=t&&r>t||null!=i&&!o&&r<i){for(let e of this.state.tileset.tiles)e.layers=null;return[]}return this.state.tileset.tiles.map(e=>{let t=this.getSubLayerPropsByTile(e);if(e.isLoaded||e.content)if(e.layers)t&&e.layers[0]&&Object.keys(t).some(i=>e.layers[0].props[i]!==t[i])&&(e.layers=e.layers.map(e=>e.clone(t)));else{let i=this.renderSubLayers({...this.props,...this.getSubLayerProps({id:e.id,updateTriggers:this.props.updateTriggers}),data:e.content,_offset:0,tile:e});e.layers=(0,s.B)(i,Boolean).map(i=>i.clone({tile:e,...t}))}return e.layers})}filterSubLayer({layer:e,cullRect:t}){let{tile:i}=e.props,{modelMatrix:o}=this.props;return this.state.tileset.isTileVisible(i,t,o?new a.k(o):null)}}_.defaultProps=m,_.layerName="TileLayer";let v=_},33429(e,t,i){i.d(t,{Om:()=>b,bR:()=>y,Ar:()=>x,ws:()=>g,g8:()=>f,Ww:()=>p,cS:()=>h,NV:()=>w,uY:()=>_});var o=i(28193),s=i(78374),r=i(48034),n=i(88967);let a=[[.5,.5],[0,0],[0,1],[1,0],[1,1]],l=a.concat([[0,.5],[.5,0],[1,.5],[.5,1]]),c=l.concat([[.25,.5],[.75,.5]]);class u{constructor(e,t,i){this.x=e,this.y=t,this.z=i}get children(){if(!this._children){let e=2*this.x,t=2*this.y,i=this.z+1;this._children=[new u(e,t,i),new u(e,t+1,i),new u(e+1,t,i),new u(e+1,t+1,i)]}return this._children}update(e){let{viewport:t,cullingVolume:i,elevationBounds:o,minZ:s,maxZ:r,bounds:n,offset:a,project:l}=e,c=this.getBoundingVolume(o,a,l);if(n&&!this.insideBounds(n)||0>i.computeVisibility(c))return!1;if(!this.childVisible){let{z:e}=this;if(e<r&&e>=s&&(e+=Math.floor(Math.log2(c.distanceTo(t.cameraPosition)*t.scale/t.height))),e>=r)return this.selected=!0,!0}for(let t of(this.selected=!1,this.childVisible=!0,this.children))t.update(e);return!0}getSelected(e=[]){if(this.selected&&e.push(this),this._children)for(let t of this._children)t.getSelected(e);return e}insideBounds([e,t,i,o]){let s=512/Math.pow(2,this.z);return this.x*s<i&&this.y*s<o&&(this.x+1)*s>e&&(this.y+1)*s>t}getBoundingVolume(e,t,i){if(i){let t=this.z<1?c:this.z<2?l:a,o=[];for(let s of t){let t=_(this.x+s[0],this.y+s[1],this.z);t[2]=e[0],o.push(i(t)),e[0]!==e[1]&&(t[2]=e[1],o.push(i(t)))}return(0,r.ZZ)(o)}let o=512/Math.pow(2,this.z),s=this.x*o+512*t,n=512-(this.y+1)*o;return new r.dO([s,n,e[0]],[s+o,n+o,e[1]])}}let d=[-1/0,-1/0,1/0,1/0],h={type:"object",value:null,validate:(e,t)=>t.optional&&null===e||"string"==typeof e||Array.isArray(e)&&e.every(e=>"string"==typeof e),equal:(e,t)=>{if(e===t)return!0;if(!Array.isArray(e)||!Array.isArray(t))return!1;let i=e.length;if(i!==t.length)return!1;for(let o=0;o<i;o++)if(e[o]!==t[o])return!1;return!0}};function p(e,t){let i=[t.transformAsPoint([e[0],e[1]]),t.transformAsPoint([e[2],e[1]]),t.transformAsPoint([e[0],e[3]]),t.transformAsPoint([e[2],e[3]])];return[Math.min(...i.map(e=>e[0])),Math.min(...i.map(e=>e[1])),Math.max(...i.map(e=>e[0])),Math.max(...i.map(e=>e[1]))]}function f(e,t){if(!e||!e.length)return null;let{index:i,id:o}=t;if(Array.isArray(e)){let t=Math.abs(o.split("").reduce((e,t)=>(e<<5)-e+t.charCodeAt(0)|0,0))%e.length;e=e[t]}let s=e;for(let e of Object.keys(i)){let t=RegExp(`{${e}}`,"g");s=s.replace(t,String(i[e]))}return Number.isInteger(i.y)&&Number.isInteger(i.z)&&(s=s.replace(/\{-y\}/g,String(Math.pow(2,i.z)-i.y-1))),s}function g({viewport:e,z:t,cullRect:i}){return(e.subViewports||[e]).map(e=>(function e(t,i,o){if(!Array.isArray(i)){let e=o.x-t.x,s=o.y-t.y,{width:r,height:n}=o,a={targetZ:i},l=t.unproject([e,s],a),c=t.unproject([e+r,s],a),u=t.unproject([e,s+n],a),d=t.unproject([e+r,s+n],a);return[Math.min(l[0],c[0],u[0],d[0]),Math.min(l[1],c[1],u[1],d[1]),Math.max(l[0],c[0],u[0],d[0]),Math.max(l[1],c[1],u[1],d[1])]}let s=e(t,i[0],o),r=e(t,i[1],o);return[Math.min(s[0],r[0]),Math.min(s[1],r[1]),Math.max(s[2],r[2]),Math.max(s[3],r[3])]})(e,t||0,i))}function m(e,t){return 512*Math.pow(2,e)/t}function _(e,t,i){let o=m(i,512),s=Math.PI-2*Math.PI*t/o;return[e/o*360-180,180/Math.PI*Math.atan(.5*(Math.exp(s)-Math.exp(-s)))]}function v(e,t,i,o){let s=m(i,o);return[e/s*512,t/s*512]}function y(e,t,i,o,s=512){if(e.isGeospatial){let[e,s]=_(t,i,o),[r,n]=_(t+1,i+1,o);return{west:e,north:s,east:r,south:n}}let[r,n]=v(t,i,o,s),[a,l]=v(t+1,i+1,o,s);return{left:r,top:n,right:a,bottom:l}}function b({viewport:e,maxZoom:t,minZoom:i,zRange:a,extent:l,tileSize:c=512,modelMatrix:h,modelMatrixInverse:f,zoomOffset:g=0,visibleMinZoom:_,visibleMaxZoom:v}){let y=e.isGeospatial?Math.round(e.zoom+Math.log2(512/c)+g):Math.ceil(e.zoom+g);if("number"==typeof i&&Number.isFinite(i)&&y<i){if(!l)return[];y=i}if("number"==typeof t&&Number.isFinite(t)&&y>t&&(y=t),null!=_&&e.zoom<_||null!=v&&e.zoom>v)return[];let x=l;return h&&f&&l&&!e.isGeospatial&&(x=p(l,h)),e.isGeospatial?function(e,t,i,a){let l=e instanceof o.Ay&&e.resolution?e.projectPosition:null,c=Object.values(e.getFrustumPlanes()).map(({normal:e,distance:t})=>new r.Zc(e.clone().negate(),t)),d=new r.R2(c),h=e.distanceScales.unitsPerMeter[2],p=i&&i[0]*h||0,f=i&&i[1]*h||0,g=e instanceof s.A&&e.pitch<=60?t:0;if(a){let[e,t,i,o]=a,s=(0,n.Gw)([e,o]),r=(0,n.Gw)([i,t]);a=[s[0],512-s[1],r[0],512-r[1]]}let m=new u(0,0,0),_={viewport:e,project:l,cullingVolume:d,elevationBounds:[p,f],minZ:g,maxZ:t,bounds:a,offset:0};if(m.update(_),e instanceof s.A&&e.subViewports&&e.subViewports.length>1){for(_.offset=-1;m.update(_)&&!(--_.offset<-3););for(_.offset=1;m.update(_)&&!(++_.offset>3););}return m.getSelected()}(e,y,a,l):function(e,t,i,o,s){var r,n;let a,l=(r=e,n=o,a=r.getBounds(),r.isGeospatial?[Math.max(a[0],n[0]),Math.max(a[1],n[1]),Math.min(a[2],n[2]),Math.min(a[3],n[3])]:[Math.max(Math.min(a[0],n[2]),n[0]),Math.max(Math.min(a[1],n[3]),n[1]),Math.min(Math.max(a[2],n[0]),n[2]),Math.min(Math.max(a[3],n[1]),n[3])]),c=m(t,i),[u,d,h,f]=s?p(l,s).map(e=>e*c/512):l.map(e=>e*c/512),g=[];for(let e=Math.floor(u);e<h;e++)for(let i=Math.floor(d);i<f;i++)g.push({x:e,y:i,z:t});return g}(e,y,c,x||d,f)}function x(e){return/(?=.*{z})(?=.*{x})(?=.*({y}|{-y}))/.test(e)}function w(e){return Number.isFinite(e.west)&&Number.isFinite(e.north)&&Number.isFinite(e.east)&&Number.isFinite(e.south)}},25371(e,t,i){i.d(t,{A:()=>_});var o=i(25799),s=i(84175),r=i(95335),n=i(54338),a=i(88967),l=i(54901);let c=new Uint32Array([0,2,1,0,3,2]),u=new Float32Array([0,1,0,0,1,0,1,1]),d=`\
layout(std140) uniform bitmapUniforms {
  vec4 bounds;
  float coordinateConversion;
  float desaturate;
  vec3 tintColor;
  vec4 transparentColor;
} bitmap;
`,h={name:"bitmap",vs:d,fs:d,uniformTypes:{bounds:"vec4<f32>",coordinateConversion:"f32",desaturate:"f32",tintColor:"vec3<f32>",transparentColor:"vec4<f32>"}},p=`\
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
`,f=`
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
`,g=`\
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

${f}

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
`;class m extends o.A{getShaders(){return super.getShaders({vs:p,fs:g,modules:[s.A,r.A,h]})}initializeState(){let e=this.getAttributeManager();e.remove(["instancePickingColors"]),e.add({indices:{size:1,isIndexed:!0,update:e=>e.value=this.state.mesh.indices,noAlloc:!0},positions:{size:3,type:"float64",fp64:this.use64bitPositions(),update:e=>e.value=this.state.mesh.positions,noAlloc:!0},texCoords:{size:2,update:e=>e.value=this.state.mesh.texCoords,noAlloc:!0}})}updateState({props:e,oldProps:t,changeFlags:i}){let o=this.getAttributeManager();if(i.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),o.invalidateAll()),e.bounds!==t.bounds){let e=this.state.mesh,t=this._createMesh();for(let i in this.state.model.setVertexCount(t.vertexCount),t)e&&e[i]!==t[i]&&o.invalidate(i);this.setState({mesh:t,...this._getCoordinateUniforms()})}else e._imageCoordinateSystem!==t._imageCoordinateSystem&&this.setState(this._getCoordinateUniforms())}getPickingInfo(e){let{image:t}=this.props,i=e.info;if(!i.color||!t)return i.bitmap=null,i;let{width:o,height:s}=t;i.index=0;let r=function(e){let[t,i,o]=e;return[(t+(15&o)/16)/256,(i+(240&o)/256)/256]}(i.color);return i.bitmap={size:{width:o,height:s},uv:r,pixel:[Math.floor(r[0]*o),Math.floor(r[1]*s)]},i}disablePickingIndex(){this.setState({disablePicking:!0})}restorePickingColors(){this.setState({disablePicking:!1})}_updateAutoHighlight(e){super._updateAutoHighlight({...e,color:this.encodePickingColor(0)})}_createMesh(){let{bounds:e}=this.props,t=e;return v(e)&&(t=[[e[0],e[1]],[e[0],e[3]],[e[2],e[3]],[e[2],e[1]]]),function(e,t){if(!t){var i,o,s,r=e;let t=new Float64Array(12);for(let e=0;e<r.length;e++)t[3*e+0]=r[e][0],t[3*e+1]=r[e][1],t[3*e+2]=r[e][2]||0;return{vertexCount:6,positions:t,indices:c,texCoords:u}}let n=Math.max(Math.abs(e[0][0]-e[3][0]),Math.abs(e[1][0]-e[2][0])),a=Math.max(Math.abs(e[1][1]-e[0][1]),Math.abs(e[2][1]-e[3][1])),d=Math.ceil(n/t)+1,h=Math.ceil(a/t)+1,p=(d-1)*(h-1)*6,f=new Uint32Array(p),g=new Float32Array(d*h*2),m=new Float64Array(d*h*3),_=0,v=0;for(let t=0;t<d;t++){let r=t/(d-1);for(let n=0;n<h;n++){let a=n/(h-1),c=(i=e,o=r,s=a,(0,l.Cc)((0,l.Cc)(i[0],i[1],s),(0,l.Cc)(i[3],i[2],s),o));m[3*_+0]=c[0],m[3*_+1]=c[1],m[3*_+2]=c[2]||0,g[2*_+0]=r,g[2*_+1]=1-a,t>0&&n>0&&(f[v++]=_-h,f[v++]=_-h-1,f[v++]=_-1,f[v++]=_-h,f[v++]=_-1,f[v++]=_),_++}}return{vertexCount:p,positions:m,indices:f,texCoords:g}}(t,this.context.viewport.resolution)}_getModel(){return new n.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),topology:"triangle-list",isInstanced:!1})}draw(e){let{shaderModuleProps:t}=e,{model:i,coordinateConversion:o,bounds:s,disablePicking:r}=this.state,{image:n,desaturate:a,transparentColor:l,tintColor:c}=this.props;if((!t.picking.isActive||!r)&&n&&i){let e={bitmapTexture:n,bounds:s,coordinateConversion:o,desaturate:a,tintColor:c.slice(0,3).map(e=>e/255),transparentColor:l.map(e=>e/255)};i.shaderInputs.setProps({bitmap:e}),i.draw(this.context.renderPass)}}_getCoordinateUniforms(){let{_imageCoordinateSystem:e}=this.props;if("default"!==e){let{bounds:t}=this.props;if(!v(t))throw Error("_imageCoordinateSystem only supports rectangular bounds");let i=this.context.viewport.resolution?"lnglat":"cartesian";if("lnglat"==(e="lnglat"===e?"lnglat":"cartesian")&&"cartesian"===i)return{coordinateConversion:-1,bounds:t};if("cartesian"===e&&"lnglat"===i){let e=(0,a.Gw)([t[0],t[1]]),i=(0,a.Gw)([t[2],t[3]]);return{coordinateConversion:1,bounds:[e[0],e[1],i[0],i[1]]}}}return{coordinateConversion:0,bounds:[0,0,0,0]}}}m.layerName="BitmapLayer",m.defaultProps={image:{type:"image",value:null,async:!0},bounds:{type:"array",value:[1,0,0,1],compare:!0},_imageCoordinateSystem:"default",desaturate:{type:"number",min:0,max:1,value:0},transparentColor:{type:"color",value:[0,0,0,0]},tintColor:{type:"color",value:[255,255,255]},textureParameters:{type:"object",ignore:!0,value:null}};let _=m;function v(e){return Number.isFinite(e[0])}},52557(e,t,i){i.d(t,{A:()=>_});var o=i(25799),s=i(84175),r=i(46487),n=i(95335),a=i(9350),l=i(54338),c=i(25337);let u=`\
layout(std140) uniform lineUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float useShortestPath;
  highp int widthUnits;
} line;
`,d={name:"line",source:"",vs:u,fs:u,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",useShortestPath:"f32",widthUnits:"i32"}},h=`\
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
  @location(0) positions: vec3<f32>,
  @location(1) instanceSourcePositions: vec3<f32>,
  @location(2) instanceTargetPositions: vec3<f32>,
  @location(3) instanceSourcePositions64Low: vec3<f32>,
  @location(4) instanceTargetPositions64Low: vec3<f32>,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instancePickingColors: vec3<f32>,
  @location(7) instanceWidths: f32
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
  let uv: vec2<f32> = positions.xy;
  geometry.uv = uv;
  geometry.pickingColor = instancePickingColors;

  // Determine width in pixels.
  let widthPixels: f32 = clamp(
    project_unit_size_to_pixel(instanceWidths * line.widthScale, line.widthUnits),
    line.widthMinPixels, line.widthMaxPixels
  );

  // Compute extrusion offset.
  let extrusion: vec2<f32> = getExtrusionOffset(targetPos.xy - sourcePos.xy, positions.y, widthPixels);
  let offset: vec3<f32> = vec3<f32>(extrusion, 0.0);

  // Apply deck.gl filter functions.
  let filteredOffset = deckgl_filter_size(offset, geometry);
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
  output.pickingColor = instancePickingColors;
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
in vec3 instancePickingColors;
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
geometry.pickingColor = instancePickingColors;
float widthPixels = clamp(
project_size_to_pixel(instanceWidths * line.widthScale, line.widthUnits),
line.widthMinPixels, line.widthMaxPixels
);
vec3 offset = vec3(
getExtrusionOffset(target.xy - source.xy, positions.y, widthPixels),
0.0);
DECKGL_FILTER_SIZE(offset, geometry);
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
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,g={getSourcePosition:{type:"accessor",value:e=>e.sourcePosition},getTargetPosition:{type:"accessor",value:e=>e.targetPosition},getColor:{type:"accessor",value:[0,0,0,255]},getWidth:{type:"accessor",value:1},widthUnits:"pixels",widthScale:{type:"number",value:1,min:0},widthMinPixels:{type:"number",value:0,min:0},widthMaxPixels:{type:"number",value:Number.MAX_SAFE_INTEGER,min:0}};class m extends o.A{getBounds(){return this.getAttributeManager()?.getBounds(["instanceSourcePositions","instanceTargetPositions"])}getShaders(){return super.getShaders({vs:p,fs:f,source:h,modules:[s.A,r.A,n.A,d]})}get wrapLongitude(){return!1}initializeState(){this.getAttributeManager().addInstanced({instanceSourcePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getSourcePosition"},instanceTargetPositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getTargetPosition"},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:[0,0,0,255]},instanceWidths:{size:1,transition:!0,accessor:"getWidth",defaultValue:1}})}updateState(e){super.updateState(e),e.changeFlags.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{widthUnits:t,widthScale:i,widthMinPixels:o,widthMaxPixels:s,wrapLongitude:r}=this.props,n=this.state.model,l={widthUnits:a.p5[t],widthScale:i,widthMinPixels:o,widthMaxPixels:s,useShortestPath:+!!r};n.shaderInputs.setProps({line:l}),n.draw(this.context.renderPass),r&&(n.shaderInputs.setProps({line:{...l,useShortestPath:-1}}),n.draw(this.context.renderPass))}_getModel(){return new l.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new c.V({topology:"triangle-strip",attributes:{positions:{size:3,value:new Float32Array([0,-1,0,0,1,0,1,-1,0,1,1,0])}}}),isInstanced:!0})}}m.layerName="LineLayer",m.defaultProps=g;let _=m}}]);