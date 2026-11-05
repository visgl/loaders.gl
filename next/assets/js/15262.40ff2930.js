"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["15262"],{79216(e,t,i){i.d(t,{v:()=>o});var s=i(81413),r=i(21992),n=i(82717);class o extends n.Z{static defaultProps={...n.Z.defaultProps,id:"column-panels",title:"Panels",theme:"inherit"};getChildPanels(){return this.props.panels}renderContent(){let{panels:e}=this.props;return(0,s.Y)(a,{panels:e})}}function a({panels:e,className:t}){return(0,s.Y)("div",{className:t,style:l,children:e.map((e,t)=>(0,s.FD)("section",{style:{...c,borderTop:t>0?"1px solid var(--menu-border-color, var(--menu-border, rgba(148, 163, 184, 0.25)))":"none",opacity:e.disabled?.55:1},children:[e.title?(0,s.Y)("header",{style:d,children:e.title}):null,(0,s.Y)("div",{style:p,children:(0,s.Y)(r.U,{panel:e,children:e.content})})]},e.id))})}let l={display:"grid",gap:"0"},c={display:"grid",gap:"var(--panel-gap, 10px)",padding:"var(--panel-padding, 12px 0)"},d={fontSize:"var(--panel-font-size, 12px)",fontWeight:700,color:"var(--button-text, currentColor)",padding:"var(--panel-padding, 0 2px)"},p={minWidth:0}},74866(e,t,i){i.d(t,{A:()=>d});var s=i(94717),r=i(60676),n=i(58532),o=i(25667),a=i(70053),l=i(41481);class c extends r.A{constructor(e){let{width:t,height:i,position:s=[0,0,0],bearing:r=0,pitch:n=0,longitude:o=null,latitude:a=null,maxPitch:l=90,minPitch:c=-90,maxBounds:d=null,maxBoundsPadding:p=null,startRotatePos:h,startBearing:u,startPitch:g,startZoomPosition:m,startPanPos:f,startPanPosition:v}=e;super({width:t,height:i,position:s,bearing:r,pitch:n,longitude:o,latitude:a,maxPitch:l,minPitch:c,maxBounds:d,maxBoundsPadding:p},{startRotatePos:h,startBearing:u,startPitch:g,startZoomPosition:m,startPanPos:f,startPanPosition:v},e.makeViewport)}panStart({pos:e}){let{position:t}=this.getViewportProps();return this._getUpdatedState({startPanPos:e,startPanPosition:t})}pan({pos:e}){if(!e)return this;let{startPanPos:t=[0,0],startPanPosition:i=[0,0]}=this.getState(),{width:s,height:r,bearing:n,pitch:o}=this.getViewportProps(),a=500*(e[0]-t[0])/s,c=500*(e[1]-t[1])/r,d=new l._SphericalCoordinates({bearing:n,pitch:o}),p=new l._SphericalCoordinates({bearing:n,pitch:-90}),h=d.toVector3().normalize(),u=p.toVector3().cross(h).normalize();return this._getUpdatedState({position:new l.Vector3(i).add(u.scale(a)).add(h.scale(c))})}panEnd(){return this._getUpdatedState({startPanPos:null,startPanPosition:null})}rotateStart({pos:e}){return this._getUpdatedState({startRotatePos:e,startBearing:this.getViewportProps().bearing,startPitch:this.getViewportProps().pitch})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:i=0}){let s,{startRotatePos:r,startBearing:n,startPitch:o}=this.getState(),{width:a,height:l}=this.getViewportProps();return r&&void 0!==n&&void 0!==o?(s=e?{bearing:n-180*((e[0]-r[0])/a),pitch:o-90*((e[1]-r[1])/l)}:{bearing:n-t,pitch:o-i},this._getUpdatedState(s)):this}rotateEnd(){return this._getUpdatedState({startRotatePos:null,startBearing:null,startPitch:null})}zoomStart(){return this._getUpdatedState({startZoomPosition:this.getViewportProps().position})}zoom({pos:e,scale:t}){let i=this.getViewportProps(),s=this.getState().startZoomPosition||i.position,{projectionMatrix:r,width:n}=this.makeViewport(i),o=2*Math.atan(1/r[0])*(e[0]/n-.5),a=this.getDirection(!0);return this._move(a.rotateZ({radians:-o}),20*Math.log2(t),s)}zoomEnd(){return this._getUpdatedState({startZoomPosition:null})}moveLeft(e=20){let t=this.getDirection(!0);return this._move(t.rotateZ({radians:Math.PI/2}),e)}moveRight(e=20){let t=this.getDirection(!0);return this._move(t.rotateZ({radians:-Math.PI/2}),e)}moveUp(e=20){let t=this.getDirection(!0);return this._move(t,e)}moveDown(e=20){let t=this.getDirection(!0);return this._move(t.negate(),e)}rotateLeft(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing-e})}rotateRight(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing+e})}rotateUp(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch+e})}rotateDown(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch-e})}zoomIn(e=20){return this._move(new l.Vector3(0,0,1),e)}zoomOut(e=20){return this._move(new l.Vector3(0,0,-1),e)}shortestPathFrom(e){let t=e.getViewportProps(),i={...this.getViewportProps()},{bearing:s,longitude:r}=i;return Math.abs(s-t.bearing)>180&&(i.bearing=s<0?s+360:s-360),null!==r&&null!==t.longitude&&Math.abs(r-t.longitude)>180&&(i.longitude=r<0?r+360:r-360),i}_move(e,t,i=this.getViewportProps().position){let s=e.scale(t);return this._getUpdatedState({position:new l.Vector3(i).add(s)})}getDirection(e=!1){return new l._SphericalCoordinates({bearing:this.getViewportProps().bearing,pitch:e?90:90+this.getViewportProps().pitch}).toVector3().normalize()}_getUpdatedState(e){return new c({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e})}applyConstraints(e){let{pitch:t,maxPitch:i,minPitch:s,longitude:r,position:a,bearing:c,maxBounds:d}=e;if(e.pitch=(0,l.clamp)(t,s,i),null!==r&&(r<-180||r>180)&&(e.longitude=(0,o.zi)(r+180,360)-180),(c<-180||c>180)&&(e.bearing=(0,o.zi)(c+180,360)-180),d){let t=(0,n.CI)(e.width,e.height,e.maxBoundsPadding);if(t.width>=0&&t.height>=0){let t=(0,l.clamp)(a[0],d[0][0],d[1][0]),i=(0,l.clamp)(a[1],d[0][1],d[1][1]),s=(0,l.clamp)(a[2]??0,d[0][2]??0,d[1][2]??0);(t!==a[0]||i!==a[1]||s!==a[2])&&(e.position=[t,i,s])}}return e}}class d extends s.A{constructor(){super(...arguments),this.ControllerState=c,this.transition={transitionDuration:300,transitionInterpolator:new a.A(["position","pitch","bearing"])}}}},82678(e,t,i){i.d(t,{A:()=>a});var s=i(47345),r=i(88967),n=i(41481);class o extends s.A{constructor(e){let{longitude:t,latitude:i,modelMatrix:s,bearing:o=0,pitch:a=0,up:l=[0,0,1]}=e,c=new n._SphericalCoordinates({bearing:o,pitch:-90===a?1e-4:90+a}).toVector3().normalize(),d=s?new n.Matrix4(s).transformAsVector(c):c,p=Number.isFinite(i)?(0,r.fO)({latitude:i}):0,h=Math.pow(2,p),u=new n.Matrix4().lookAt({eye:[0,0,0],center:d,up:l}).scale(h);super({...e,zoom:p,viewMatrix:u}),this.latitude=i,this.longitude=t,this.pitch=a,this.bearing=o,this.up=l}}o.displayName="FirstPersonViewport";let a=o},4856(e,t,i){i.d(t,{A:()=>a});var s=i(12041),r=i(82678),n=i(74866);class o extends s.A{constructor(e={}){super(e)}getViewportType(){return r.A}get ControllerType(){return n.A}}o.displayName="FirstPersonView";let a=o},69198(e,t,i){i.d(t,{A:()=>y});var s=i(66260),r=i(84175),n=i(46487),o=i(95335),a=i(9350),l=i(37072),c=i(30638),d=i(25337);let p=`\
layout(std140) uniform pointCloudUniforms {
  float radiusPixels;
  highp int sizeUnits;
} pointCloud;
`,h={name:"pointCloud",source:"",vs:p,fs:p,uniformTypes:{radiusPixels:"f32",sizeUnits:"i32"}},u=`\
#version 300 es
#define SHADER_NAME point-cloud-layer-vertex-shader
in vec3 positions;
in vec3 instanceNormals;
in vec4 instanceColors;
in vec3 instancePositions;
in vec3 instancePositions64Low;
out vec4 vColor;
out vec2 unitPosition;
void main(void) {
geometry.worldPosition = instancePositions;
geometry.normal = project_normal(instanceNormals);
unitPosition = positions.xy;
geometry.uv = unitPosition;
geometry.pickingColor = picking_getPickingColorFromInstanceID();
vec3 offset = vec3(positions.xy * project_size_to_pixel(pointCloud.radiusPixels, pointCloud.sizeUnits), 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
#ifdef ANTIALIASING
float triangleRadiusPixels = length(offset.xy);
if (triangleRadiusPixels > 0.0) {
float coverageScale = 1.0 + 1.0 / project.devicePixelRatio / triangleRadiusPixels;
offset.xy *= coverageScale;
unitPosition *= coverageScale;
geometry.uv = unitPosition;
}
#endif
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
vec3 lightColor = lighting_getLightColor(instanceColors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, instanceColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,g=`\
#version 300 es
#define SHADER_NAME point-cloud-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 unitPosition;
out vec4 fragColor;
void main(void) {
geometry.uv = unitPosition.xy;
float distToCenter = length(unitPosition);
#ifdef ANTIALIASING
float edgePixels = (1.0 - distToCenter) / max(fwidth(distToCenter), 1e-6);
if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
#else
if (distToCenter > 1.0) {
#endif
discard;
}
fragColor = vColor;
#ifdef ANTIALIASING
fragColor.a *= smoothedge(0.0, edgePixels);
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,m=`\
struct PointCloudUniforms {
  radiusPixels: f32,
  sizeUnits: i32,
};

@group(0) @binding(0)
var<uniform> pointCloudUniforms: PointCloudUniforms;

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions: vec3<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceNormals: vec3<f32>,
  @location(4) instanceColors: vec4<f32>
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

  // Position on the enclosing triangle. Its edges are tangent to the unit circle.
  varyings.unitPosition = attributes.positions.xy;
  geometry.uv = varyings.unitPosition;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex);

  // Find the center of the point and add the current vertex
#ifdef ANTIALIASING
  var offset = vec3<f32>(
#else
  let offset = vec3<f32>(
#endif
    attributes.positions.xy *
      project_unit_size_to_pixel(pointCloudUniforms.radiusPixels, pointCloudUniforms.sizeUnits),
    0.0
  );
  // DECKGL_FILTER_SIZE(offset, geometry);
#ifdef ANTIALIASING
  let triangleRadiusPixels = length(offset.xy);
  if (triangleRadiusPixels > 0.0) {
    // The triangle's inradius is half its vertex radius. Scaling its vertex radius by one device
    // pixel therefore adds half a device pixel around all three tangent points.
    let coverageScale = 1.0 + 1.0 / project.devicePixelRatio / triangleRadiusPixels;
    offset *= coverageScale;
    varyings.unitPosition *= coverageScale;
    geometry.uv = varyings.unitPosition;
  }
#endif

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
  varyings.pickingColor = geometry.pickingColor;

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  // var geometry: Geometry;
  // geometry.uv = unitPosition.xy;

  let distToCenter = length(varyings.unitPosition);
#ifdef ANTIALIASING
  let edgePixels = (1.0 - distToCenter) / max(fwidth(distToCenter), 1e-6);
  if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
#else
  if (distToCenter > 1.0) {
#endif
    discard;
  }

  var fragColor: vec4<f32>;

  fragColor = varyings.vColor;

#ifdef ANTIALIASING
  fragColor.a *= smoothedge(0.0, edgePixels);
#endif

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
`,f=[0,0,0,255],v=[0,0,1];class P extends s.A{getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:u,fs:g,source:m,defines:e?{ANTIALIASING:1}:{},modules:[r.A,n.A,l.J,o.Ay,h]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceNormals:{size:3,transition:!0,accessor:"getNormal",defaultValue:v},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:f}})}updateState(e){let{changeFlags:t,props:i,oldProps:s}=e;super.updateState(e),(t.extensionsChanged||i.antialiasing!==s.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()),t.dataChanged&&function(e){let{header:t,attributes:i}=e;if(t&&i&&(e.length=t.vertexCount,i.POSITION&&(i.instancePositions=i.POSITION),i.NORMAL&&(i.instanceNormals=i.NORMAL),i.COLOR_0)){let{size:e,value:t}=i.COLOR_0;i.instanceColors={size:e,type:"unorm8",value:t}}}(i.data)}draw({uniforms:e}){let{pointSize:t,sizeUnits:i}=this.props,s=this.state.model,r={sizeUnits:a.p5[i],radiusPixels:t};s.shaderInputs.setProps({pointCloud:r}),s.draw(this.context.renderPass)}_getModel(){let e=[];for(let t=0;t<3;t++){let i=t/3*Math.PI*2;e.push(2*Math.cos(i),2*Math.sin(i),0)}return new c.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new d.V({topology:"triangle-list",attributes:{positions:new Float32Array(e)}}),isInstanced:!0})}}P.layerName="PointCloudLayer",P.defaultProps={sizeUnits:"pixels",pointSize:{type:"number",min:0,value:10},antialiasing:!1,getPosition:{type:"accessor",value:e=>e.position},getNormal:{type:"accessor",value:v},getColor:{type:"accessor",value:f},material:!0,radiusPixels:{deprecatedFor:"pointSize"}};let y=P},39299(e,t,i){i.d(t,{e:()=>l});var s=i(81413),r=i(66347),n=i(3459),o=i(60616),a=i(37070);class l extends r.x{constructor(e={}){super(e),this.className="deck-widget-fullscreen",this.placement="top-left",this.fullscreen=!1,this.setProps(this.props)}onAdd(){document.addEventListener("fullscreenchange",this.onFullscreenChange.bind(this))}onRemove(){document.removeEventListener("fullscreenchange",this.onFullscreenChange.bind(this))}onRenderHTML(e){let t=this.getFullscreen();(0,o.XX)((0,s.Y)(a.K,{onClick:()=>{this.handleClick().catch(e=>n.A.error(e)())},label:t?this.props.exitLabel:this.props.enterLabel,tooltip:t?this.props.exitTooltip:this.props.enterTooltip,className:t?"deck-widget-fullscreen-exit":"deck-widget-fullscreen-enter"}),e)}setProps(e){this.placement=e.placement??this.placement,this.viewId=e.viewId??this.viewId,super.setProps(e)}getContainer(){return this.props.container||this.deck?.props.parent||this.deck?.getCanvas()?.parentElement}getFullscreen(){return this.fullscreen}onFullscreenChange(){let e=document.fullscreenElement===this.getContainer();e!==this.fullscreen&&(this.fullscreen=e,this.props.onFullscreenChange?.(e),this.updateHTML())}async handleClick(){this.getFullscreen()?await this.exitFullscreen():await this.requestFullscreen()}async requestFullscreen(){let e=this.getContainer();e?.requestFullscreen?await e.requestFullscreen({navigationUI:"hide"}):this.togglePseudoFullscreen()}async exitFullscreen(){document.exitFullscreen?await document.exitFullscreen():this.togglePseudoFullscreen()}togglePseudoFullscreen(){this.getContainer()?.classList.toggle("deck-pseudo-fullscreen"),this.fullscreen=!this.fullscreen,this.props.onFullscreenChange?.(this.fullscreen),this.updateHTML()}}l.defaultProps={...r.x.defaultProps,id:"fullscreen",placement:"top-left",viewId:null,enterLabel:"Enter Fullscreen",exitLabel:"Exit Fullscreen",enterTooltip:void 0,exitTooltip:void 0,container:void 0,onFullscreenChange:()=>{}}},37070(e,t,i){i.d(t,{K:()=>a});var s=i(81413),r=i(43078),n=i(16357);let o=({content:e,placement:t="right",children:i})=>{let o=(0,r.li)(null),a=(0,r.li)(null),[l,c]=(0,r.J0)(!1),d=(0,r.li)(),p=(0,r.hb)(()=>{clearTimeout(d.current),c(!0)},[]),h=(0,r.hb)(()=>{clearTimeout(d.current),c(!1)},[]),u=(0,r.hb)(e=>{"Escape"===e.key&&h()},[h]);(0,r.vJ)(()=>{let e=a.current,i=o.current?.firstElementChild;if(l&&e&&i)return(0,n.ll)(i,e,()=>{(0,n.rD)(i,e,{placement:t,strategy:"fixed",middleware:[(0,n.cY)(8),(0,n.UU)(),(0,n.BN)({padding:4})]}).then(({x:t,y:i})=>{a.current===e&&Object.assign(e.style,{left:`${t}px`,top:`${i}px`,opacity:"1"})})})},[l,t]),(0,r.vJ)(()=>()=>clearTimeout(d.current),[]);let g=(0,r.hb)(t=>{t&&e instanceof HTMLElement&&t.replaceChildren(e.cloneNode(!0))},[e]);return null==e||!1===e||""===e?(0,s.Y)(s.FK,{children:i}):(0,s.FD)("div",{ref:o,className:"deck-widget-tooltip-trigger",onPointerEnter:p,onPointerLeave:h,onFocusCapture:p,onBlurCapture:h,onKeyDown:u,children:[i,l&&(0,s.Y)("div",{ref:a,className:"deck-widget-tooltip",role:"tooltip",style:{position:"fixed",opacity:0,fontSize:"12px",padding:"4px 8px"},children:e instanceof HTMLElement?(0,s.Y)("div",{ref:g}):e})]})},a=e=>{let{className:t="",style:i,color:n,icon:a,label:l,tooltip:c,onClick:d,children:p}=e,h=!1===c?void 0:c??l,u=(0,r.Kr)(()=>{let e=function(e){if(!e)return;let t=`url("${e.replace(/"/g,"'")}")`;return{maskImage:t,WebkitMaskImage:t}}(a);return n?{...e,backgroundColor:n}:e},[n,a]),g=(0,s.Y)("button",{className:`deck-widget-icon-button ${t}`,type:"button",onClick:d,"aria-label":l,children:p||(0,s.Y)("div",{className:"deck-widget-icon",style:u})});return(0,s.Y)("div",{className:"deck-widget-button",style:i,children:h?(0,s.Y)(o,{content:h,children:g}):g})}},54157(e,t,i){i.d(t,{c:()=>u});var s=i(81413),r=i(66347),n=i(95850),o=i(60616),a=i(43078),l=i(37070);let c=e=>`${e.name}: ${e.count}`;function d(e){return e<1e3?`${e.toFixed(2)}ms`:`${(e/1e3).toFixed(2)}s`}function p(e){return`${(e/1e6).toFixed(1)} MB`}let h={count:c,averageTime:e=>`${e.name}: ${d(e.getAverageTime())}`,totalTime:e=>`${e.name}: ${d(e.time)}`,fps:e=>`${e.name}: ${Math.round(e.getHz())}fps`,memory:e=>`${e.name}: ${p(e.count)}`};class u extends r.x{getExpanded(){return this.props.expanded??this._expanded}constructor(e={}){super(e),this.className="deck-widget-stats",this.placement="top-left",this._counter=0,this._expanded=!1,this._toggleExpanded=()=>{let e=!this.getExpanded();this.props.onExpandedChange?.(e),void 0===this.props.expanded&&(this._expanded=e,this.updateHTML())},this._getFps=()=>Math.round(this.deck?.metrics.fps??0),this._formatters={...h},this._resetOnUpdate={...this.props.resetOnUpdate},this._expanded=!!e.initialExpanded,this.setProps(e)}setProps(e){if(this.placement=e.placement??this.placement,this.viewId=e.viewId??this.viewId,e.formatters)for(let t in e.formatters){let i=e.formatters[t];this._formatters[t]="string"==typeof i?h[i]||c:i}e.resetOnUpdate&&(this._resetOnUpdate={...e.resetOnUpdate}),super.setProps(e)}onRemove(){this.rootElement&&(0,o.XX)(null,this.rootElement)}onRenderHTML(e){if(!this.getExpanded())return void(0,o.XX)((0,s.Y)(g,{getFps:this._getFps,onClick:this._toggleExpanded}),e);let t=this._getStats(),i=this.props.title||("id"in t?t.id:null)||"Stats",r=this._getDeviceLabel(),n=[];t&&t.forEach(e=>{let t=this._getLines(e).split("\n");this._resetOnUpdate&&this._resetOnUpdate[e.name]&&e.reset(),t.forEach((t,i)=>{n.push((0,s.Y)("div",{style:{whiteSpace:"pre"},children:t},`${e.name}-${i}`))})}),(0,o.XX)((0,s.FD)("div",{className:"deck-widget-stats-container",style:{cursor:"default"},children:[(0,s.FD)("div",{className:"deck-widget-stats-header",style:{cursor:"pointer",pointerEvents:"auto"},onClick:this._toggleExpanded,children:[(0,s.Y)("b",{children:i}),r&&(0,s.Y)("span",{className:"deck-widget-stats-device",children:r}),(0,s.Y)("button",{className:"deck-widget-dropdown-button",children:(0,s.Y)("span",{className:"deck-widget-dropdown-icon open"})})]}),(0,s.Y)("div",{className:"deck-widget-stats-content",children:n})]}),e)}onRedraw(){if(this.getExpanded()){let e=Math.max(1,this.props.framesPerUpdate||1);this._counter++%e==0&&this.updateHTML()}}_getStats(){switch(this.props.type){case"deck":return Object.entries(this.deck?.metrics??{});case"luma":return Array.from(n.a.stats.stats.values())[0];case"device":let e=this.deck?.device,t=e?.statsManager.stats.values();return t?Array.from(t)[0]:[];case"custom":return this.props.stats;default:throw Error(`Unknown stats type: ${this.props.type}`)}}_getDeviceLabel(){let e=this.deck?.device?.type;if(!e)return null;switch(e){case"webgpu":return"WebGPU";case"webgl":return"WebGL";default:return String(e)}}_getLines(e){if("count"in e)return(this._formatters[e.name]||this._formatters[e.type||""]||c)(e);let[t,i]=e,s=t.endsWith("Memory")?p(i):t.includes("Time")?d(i):`${i.toFixed(2)}`;return`${t}: ${s}`}}function g({getFps:e,onClick:t}){let[i,r]=(0,a.J0)(e());return(0,a.vJ)(()=>{let t=()=>{r(e()),i=requestAnimationFrame(t)},i=requestAnimationFrame(t);return()=>{cancelAnimationFrame(i)}},[e]),(0,s.Y)(l.K,{onClick:t,children:(0,s.FD)("div",{className:"text",children:["FPS",(0,s.Y)("br",{}),i]})})}u.defaultProps={...r.x.defaultProps,type:"deck",placement:"top-left",viewId:null,initialExpanded:!1,stats:void 0,title:"Stats",framesPerUpdate:1,formatters:{},resetOnUpdate:{},id:"stats",expanded:void 0,onExpandedChange:()=>{}}},72734(e,t,i){i.d(t,{JM:()=>n,PI:()=>r,Sy:()=>s});let s=Math.PI/2,r=Math.PI,n=2*Math.PI},80765(e,t,i){i.d(t,{C_:()=>s,pX:()=>r});let s=globalThis.Float16Array;function r(){return s??Uint16Array}},65925(e,t,i){i.d(t,{i:()=>a});var s=i(87597),r=i(90218);let n=new s.P,o=new s.P;class a{constructor(e=[0,0,0],t=0){this.radius=-0,this.center=new s.P,this.fromCenterRadius(e,t)}fromCenterRadius(e,t){return this.center.from(e),this.radius=t,this}fromCornerPoints(e,t){return t=n.from(t),this.center=new s.P().from(e).add(t).scale(.5),this.radius=this.center.distance(t),this}equals(e){return this===e||!!e&&this.center.equals(e.center)&&this.radius===e.radius}clone(){return new a(this.center,this.radius)}union(e){let t=this.center,i=this.radius,s=e.center,r=e.radius,a=n.copy(s).subtract(t),l=a.magnitude();if(i>=l+r)return this.clone();if(r>=l+i)return e.clone();let c=(i+l+r)*.5;return o.copy(a).scale((-i+c)/l).add(t),this.center.copy(o),this.radius=c,this}expand(e){let t=n.from(e).subtract(this.center).magnitude();return t>this.radius&&(this.radius=t),this}transform(e){this.center.transform(e);let t=(0,r.IL)(n,e);return this.radius=Math.max(t[0],Math.max(t[1],t[2]))*this.radius,this}distanceSquaredTo(e){let t=this.distanceTo(e);return t*t}distanceTo(e){return Math.max(0,n.from(e).subtract(this.center).len()-this.radius)}intersectPlane(e){let t=this.center,i=this.radius,s=e.normal.dot(t)+e.distance;return s<-i?"outside":s<i?"intersecting":"inside"}}},1407(e,t,i){i.d(t,{R:()=>c});var s=i(87597),r=i(4990),n=i(12858);let o=[new s.P([1,0,0]),new s.P([0,1,0]),new s.P([0,0,1])],a=new s.P,l=new s.P;class c{constructor(e=[]){this.planes=e}fromBoundingSphere(e){this.planes.length=2*o.length;let t=e.center,i=e.radius,s=0;for(let e of o){let r=this.planes[s],o=this.planes[s+1];r||(r=this.planes[s]=new n.Z),o||(o=this.planes[s+1]=new n.Z);let c=a.copy(e).scale(-i).add(t);r.fromPointNormal(c,e);let d=a.copy(e).scale(i).add(t),p=l.copy(e).negate();o.fromPointNormal(d,p),s+=2}return this}computeVisibility(e){let t="inside";for(let i of this.planes)switch(e.intersectPlane(i)){case"outside":return"outside";case"intersecting":t="intersecting"}return t}computeVisibilityWithPlaneMask(e,t){if((0,r.v)(Number.isFinite(t),"parentPlaneMask is required."),t===c.MASK_OUTSIDE||t===c.MASK_INSIDE)return t;let i=c.MASK_INSIDE,s=this.planes;for(let r=0;r<this.planes.length;++r){let n=r<31?1<<r:0;if(r<31&&(t&n)==0)continue;let o=s[r],a=e.intersectPlane(o);if("outside"===a)return c.MASK_OUTSIDE;"intersecting"===a&&(i|=n)}return i}}c.MASK_OUTSIDE=0xffffffff,c.MASK_INSIDE=0,c.MASK_INDETERMINATE=0x7fffffff},12858(e,t,i){i.d(t,{Z:()=>l});var s=i(87597),r=i(4990),n=i(54901);let o=new s.P,a=new s.P;class l{constructor(e=[0,0,1],t=0){this.normal=new s.P,this.distance=-0,this.fromNormalDistance(e,t)}fromNormalDistance(e,t){return(0,r.v)(Number.isFinite(t)),this.normal.from(e).normalize(),this.distance=t,this}fromPointNormal(e,t){e=o.from(e),this.normal.from(t).normalize();let i=-this.normal.dot(e);return this.distance=i,this}fromCoefficients(e,t,i,s){return this.normal.set(e,t,i),(0,r.v)((0,n.aI)(this.normal.len(),1)),this.distance=s,this}clone(){return new l(this.normal,this.distance)}equals(e){return(0,n.aI)(this.distance,e.distance)&&(0,n.aI)(this.normal,e.normal)}getPointDistance(e){return this.normal.dot(e)+this.distance}transform(e){let t=a.copy(this.normal).transformAsVector(e).normalize(),i=this.normal.scale(-this.distance).transform(e);return this.fromPointNormal(i,t)}projectPointOntoPlane(e,t=[0,0,0]){let i=o.from(e),s=this.getPointDistance(i),r=a.copy(this.normal).scale(s);return i.subtract(r).to(t)}intersectWithRay(e,t=new s.P){let i=e.origin,r=e.direction,n=this.normal,o=n.dot(r);if(1e-15>Math.abs(o))return;let a=(-this.distance-n.dot(i))/o;if(!(a<0))return t.copy(r).multiplyByScalar(a).add(i)}}}}]);