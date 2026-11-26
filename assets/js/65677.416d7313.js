"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["65677"],{48314(e,t,i){i.d(t,{A:()=>R});var o=i(66260),n=i(3984),s=i(84175),r=i(46487),a=i(19754),l=i(91349),c=i(78374),d=i(52948),p=i(7914),f=i(9350),u=i(88599),h=i(25337),g=i(44941),v=i(12116),P=i(65441);function m(e,t,i,o){let n;if(Array.isArray(e[0])){n=Array(e.length*t);for(let i=0;i<e.length;i++)for(let o=0;o<t;o++)n[i*t+o]=e[i][o]||0}else n=e;return i?(0,v.M)(n,{size:t,gridResolution:i}):o?(0,P.I)(n,{size:t}):n}var y=i(40961);class x extends g.A{constructor(e){super({...e,attributes:{positions:{size:3,padding:18,initialize:!0,type:e.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:e.isWebGPU?Float32Array:Uint8ClampedArray}}})}get(e){return this.attributes[e]}getPathSegmentIndices(e){let t=this.attributes.segmentTypes,i=this.vertexStarts[e],o=Math.min(this.vertexStarts[e+1]??this.instanceCount,this.instanceCount),n=[];for(let e=i;e<o-1;e++)(4&t[e])==0&&n.push(e);return n.length&&(4&t[i])!=0&&n.unshift(n.pop()),n}getGeometryFromBuffer(e){return this.normalize||this.opts.transform||this.opts.isWebGPU?super.getGeometryFromBuffer(e):null}prepareGeometry(e){let t=this.normalize?m(e,this.inputPositionSize,this.opts.resolution,this.opts.wrapLongitude):e,{projectionTolerance:i,projectionToleranceScale:o,transform:n}=this.opts;if(!i)return t;if(!this.normalize||!n)throw Error("Projection refinement requires normalized, preprojected paths");let s=o||[1,1,1],r=e=>(0,y.A)(e,{size:this.inputPositionSize,targetSize:3,transform:e=>n(Array.from(e)).map((e,t)=>e*s[t]),tolerance:i}).sourcePositions;return _(t)?t.map(r):r(t)}normalizeGeometry(e){return this.normalize&&!this.opts.transform?m(e,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):e}getGeometrySize(e){if(_(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}let t=this.getPathLength(e);return t<2?0:this.isClosed(e)?t<3?0:t+2:t}updateGeometryAttributes(e,t){if(0!==t.geometrySize)if(e&&_(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e}else this._updateSegmentTypes(e,t),this._updatePositions(e,t)}_updateSegmentTypes(e,t){let i=this.attributes.segmentTypes,o=!!e&&this.isClosed(e),{vertexStart:n,geometrySize:s}=t;i.fill(0,n,n+s),o?(i[n]=4,i[n+s-2]=4):(i[n]+=1,i[n+s-2]+=2),i[n+s-1]=4}_updatePositions(e,t){let{positions:i}=this.attributes;if(!i||!e)return;let{vertexStart:o,geometrySize:n}=t,s=[,,,];for(let t=o,r=0;r<n;t++,r++)this.getPointOnPath(e,r,s),i[3*t]=s[0],i[3*t+1]=s[1],i[3*t+2]=s[2]}getPathLength(e){return e.length/this.positionSize}getPointOnPath(e,t,i=[]){let{positionSize:o}=this;t*o>=e.length&&(t+=1-e.length/o);let n=t*o;return i[0]=e[n],i[1]=e[n+1],i[2]=3===o&&e[n+2]||0,i}isClosed(e){if(!this.normalize)return!!this.opts.loop;let{positionSize:t}=this,i=e.length-t;return e[0]===e[i]&&e[1]===e[i+1]&&(2===t||e[2]===e[i+2])}}function _(e){return Array.isArray(e[0])}var C=i(6053);let L=`\
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
in float rowIndexes;
uniform float opacity;
out vec4 vColor;
out vec2 vCornerOffset;
out float vMiterLength;
out vec2 vPathPosition;
out float vPathLength;
out float vJointType;
#ifdef DASH_ENABLED
out vec2 vPathBounds;
#endif
const float EPSILON = 0.001;
const vec3 ZERO_OFFSET = vec3(0.0);
float flipIfTrue(bool flag) {
return -(float(flag) * 2. - 1.);
}
vec3 getLineJoinOffset(
vec3 prevPoint, vec3 currPoint, vec3 nextPoint,
vec2 width
#ifdef DASH_ENABLED
, float sourcePathLength, vec2 sourcePathRange
#endif
#ifdef ANTIALIASING
, float coverageScale
#endif
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
#ifdef DASH_ENABLED
vec3 currDelta3 = isEnd ? deltaA3 : deltaB3;
float currLength2D = length(currDelta3.xy);
float arcLengthRatio = 1.0;
float pathPositionOffset = 0.0;
float pathLength = L;
if (path.billboard) {
float visiblePathLength = sourcePathLength * (sourcePathRange.y - sourcePathRange.x);
arcLengthRatio = L > 0.0 ? visiblePathLength / L : 0.0;
pathPositionOffset = sourcePathLength * sourcePathRange.x;
pathLength = sourcePathLength;
} else if (currLength2D > 0.0) {
arcLengthRatio = length(currDelta3) / currLength2D;
pathLength = L * arcLengthRatio;
}
#endif
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
#ifdef ANTIALIASING
vec2 coverageOffsetVec = offsetVec * coverageScale;
#ifdef DASH_ENABLED
vPathLength = pathLength;
#else
vPathLength = L;
#endif
vCornerOffset = coverageOffsetVec;
vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
vMiterLength = isCap ? isJoint : vMiterLength;
vec2 offsetFromStartOfPath = coverageOffsetVec + deltaA * float(isEnd);
vPathPosition = vec2(
dot(offsetFromStartOfPath, perp),
#ifdef DASH_ENABLED
pathPositionOffset + dot(offsetFromStartOfPath, dir) * arcLengthRatio
#else
dot(offsetFromStartOfPath, dir)
#endif
);
geometry.uv = vPathPosition;
float isValid = step(instanceTypes, 3.5);
vec3 offset = vec3(coverageOffsetVec * width * isValid, 0.0);
#else
#ifdef DASH_ENABLED
vPathLength = pathLength;
#else
vPathLength = L;
#endif
vCornerOffset = offsetVec;
vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
vMiterLength = isCap ? isJoint : vMiterLength;
vec2 offsetFromStartOfPath = vCornerOffset + deltaA * float(isEnd);
vPathPosition = vec2(
dot(offsetFromStartOfPath, perp),
#ifdef DASH_ENABLED
pathPositionOffset + dot(offsetFromStartOfPath, dir) * arcLengthRatio
#else
dot(offsetFromStartOfPath, dir)
#endif
);
geometry.uv = vPathPosition;
float isValid = step(instanceTypes, 3.5);
vec3 offset = vec3(offsetVec * width * isValid, 0.0);
#endif
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
#ifdef DASH_ENABLED
vec2 getClippedPathRange(float startW, float endW) {
bool startClipped = startW < EPSILON;
bool endClipped = endW < EPSILON;
if (startClipped && endClipped) {
return vec2(0.0);
}
if (startClipped || endClipped) {
float intersection = clamp((EPSILON - startW) / (endW - startW), 0.0, 1.0);
return startClipped ? vec2(intersection, 1.0) : vec2(0.0, intersection);
}
return vec2(0.0, 1.0);
}
#endif
void main() {
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
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
#ifdef DASH_ENABLED
vec4 prevPositionCommon;
vec4 nextPositionCommon;
vec4 prevPositionScreen = project_position_to_clipspace(
prevPosition, prevPosition64Low, ZERO_OFFSET, prevPositionCommon
);
#else
vec4 prevPositionScreen = project_position_to_clipspace(
prevPosition, prevPosition64Low, ZERO_OFFSET
);
#endif
vec4 currPositionScreen = project_position_to_clipspace(currPosition, currPosition64Low, ZERO_OFFSET, geometry.position);
#ifdef DASH_ENABLED
vec4 nextPositionScreen = project_position_to_clipspace(
nextPosition, nextPosition64Low, ZERO_OFFSET, nextPositionCommon
);
#else
vec4 nextPositionScreen = project_position_to_clipspace(
nextPosition, nextPosition64Low, ZERO_OFFSET
);
#endif
#ifdef DASH_ENABLED
vec4 sourcePathStartScreen = mix(currPositionScreen, prevPositionScreen, isEnd);
vec4 sourcePathEndScreen = mix(nextPositionScreen, currPositionScreen, isEnd);
vec2 billboardPathRange = getClippedPathRange(
sourcePathStartScreen.w, sourcePathEndScreen.w
);
#endif
clipLine(prevPositionScreen, currPositionScreen);
clipLine(nextPositionScreen, currPositionScreen);
clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));
width = vec3(widthPixels, 0.0);
DECKGL_FILTER_SIZE(width, geometry);
#ifdef ANTIALIASING
vec2 coveragePadding = vec2(0.5 / project.devicePixelRatio);
float coverageScale = length(width.xy) > 0.0
? length(width.xy + coveragePadding) / length(width.xy)
: 1.0;
#endif
#ifdef DASH_ENABLED
vec3 currentDeltaCommon = isEnd > 0.0
? geometry.position.xyz - prevPositionCommon.xyz
: nextPositionCommon.xyz - geometry.position.xyz;
float billboardPathLength = width.x > 0.0
? length(currentDeltaCommon) * project.scale / (width.x * project.focalDistance)
: 0.0;
#endif
vec3 offset = getLineJoinOffset(
prevPositionScreen.xyz / prevPositionScreen.w,
currPositionScreen.xyz / currPositionScreen.w,
nextPositionScreen.xyz / nextPositionScreen.w,
project_pixel_size_to_clipspace(width.xy)
#ifdef DASH_ENABLED
,
billboardPathLength, billboardPathRange
#endif
#ifdef ANTIALIASING
,
coverageScale
#endif
);
#ifdef DASH_ENABLED
vPathBounds = billboardPathLength * billboardPathRange;
#endif
DECKGL_FILTER_GL_POSITION(currPositionScreen, geometry);
gl_Position = vec4(currPositionScreen.xyz + offset * currPositionScreen.w, currPositionScreen.w);
} else {
prevPosition = project_position(prevPosition, prevPosition64Low);
currPosition = project_position(currPosition, currPosition64Low);
nextPosition = project_position(nextPosition, nextPosition64Low);
width = vec3(project_pixel_size(widthPixels), 0.0);
DECKGL_FILTER_SIZE(width, geometry);
#ifdef ANTIALIASING
vec2 coveragePadding = project_pixel_size(vec2(0.5 / project.devicePixelRatio));
float coverageScale = length(width.xy) > 0.0
? length(width.xy + coveragePadding) / length(width.xy)
: 1.0;
#endif
vec3 offset = getLineJoinOffset(
prevPosition, currPosition, nextPosition, width.xy
#ifdef DASH_ENABLED
, 1.0, vec2(0.0, 1.0)
#endif
#ifdef ANTIALIASING
, coverageScale
#endif
);
#ifdef DASH_ENABLED
vPathBounds = vec2(0.0, vPathLength);
#endif
geometry.position = vec4(currPosition + offset, 1.0);
gl_Position = project_common_position_to_clipspace(geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,b=`\
#version 300 es
#define SHADER_NAME path-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 vCornerOffset;
in float vMiterLength;
in vec2 vPathPosition;
in float vPathLength;
in float vJointType;
#ifdef DASH_ENABLED
in vec2 vPathBounds;
#endif
out vec4 fragColor;
void main(void) {
geometry.uv = vPathPosition;
#ifdef ANTIALIASING
#ifdef DASH_ENABLED
bool isCorner = vPathPosition.y < vPathBounds.x || vPathPosition.y > vPathBounds.y;
#else
bool isCorner = vPathPosition.y < 0.0 || vPathPosition.y > vPathLength;
#endif
bool isRound = vJointType > 0.5;
float bodyCoord = abs(vPathPosition.x);
float cornerCoord = length(vCornerOffset);
float bodyPixels = (1.0 - bodyCoord) / max(fwidth(bodyCoord), 1e-6);
float cornerPixels = (1.0 - cornerCoord) / max(fwidth(cornerCoord), 1e-6);
#ifdef PATH_STYLE_OFFSET
float edgePixels = isRound && isCorner ? min(cornerPixels, bodyPixels) : bodyPixels;
#else
float edgePixels = isRound && isCorner ? cornerPixels : bodyPixels;
#endif
if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
discard;
}
if (isCorner) {
if (!isRound && vMiterLength > path.miterLimit + 1.0) {
discard;
}
}
fragColor = vColor;
fragColor.a *= smoothedge(0.0, edgePixels);
#else
#ifdef DASH_ENABLED
if (vPathPosition.y < vPathBounds.x || vPathPosition.y > vPathBounds.y) {
#else
if (vPathPosition.y < 0.0 || vPathPosition.y > vPathLength) {
#endif
if (vJointType > 0.5 && length(vCornerOffset) > 1.0) {
discard;
}
if (vJointType < 0.5 && vMiterLength > path.miterLimit + 1.0) {
discard;
}
}
fragColor = vColor;
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,S=[0,0,0,255],A={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},antialiasing:!1,billboard:!1,_pathType:null,_projectionTolerance:{type:"number",value:0,min:0},_projectionNoCut:!1,getPath:{type:"accessor",value:e=>e.path},getColor:{type:"accessor",value:S},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},E={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};function w(e,t){return e===t||!!(e&&t&&e.length===t.length&&e.every((e,i)=>e===t[i]))}class I extends o.A{getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:L,fs:b,source:n.TX,plugins:"webgpu"===this.context.device.type?[n.Cq]:[],defines:e?{ANTIALIASING:1}:{},modules:[s.A,r.A,a.Ay,l.B]})}get wrapLongitude(){return!1}getBounds(){return"webgpu"===this.context.device.type?null:this.getAttributeManager()?.getBounds(["vertexPositions"])}getPathProjectionScale(e){let t=this.props.coordinateSystem;if(!this.getAttributeManager()?.getAttributes().instanceDashOffsets)return null;if(e instanceof c.A&&e.zoom>=12&&"meter-offsets"!==t&&"lnglat-offsets"!==t){let i=d.A.getUniforms({viewport:e,coordinateSystem:t,sourceCrs:this.internalState.sourceCrs,coordinateOrigin:this.props.coordinateOrigin,autoWrapLongitude:this.wrapLongitude});return[e.projectionMode,i.coordinateOrigin[1],i.commonOrigin[1],...i.commonUnitsPerWorldUnit,...i.commonUnitsPerWorldUnit2,i.commonUnitsPerMeter[2]]}let i=function(e){if(e.isGeospatial)return null;let{unitsPerMeter:t}=e.distanceScales;return[t[0],t[1],t[2]]}(e);return i?[e.projectionMode,...i]:[e.projectionMode]}shouldUpdateState(e){let{viewport:t}=this.context;return super.shouldUpdateState(e)||this.state?.subdivisionStep!==this.getSubdivisionStep()||!w(this.state?.pathProjectionScale,this.getPathProjectionScale(t))}initializeState(){let e="webgpu"===this.context.device.type;this.getAttributeManager().addInstanced({...e?{pathPositions:{...this.usePositionTransforms(),size:24,type:"float32",transition:!1,accessor:"getPath",update:this.calculateWebGPUPositions,shaderAttributes:{instanceLeftPositions:{size:3,elementOffset:0},instanceStartPositions:{size:3,elementOffset:3},instanceEndPositions:{size:3,elementOffset:6},instanceRightPositions:{size:3,elementOffset:9},instanceLeftPositions64Low:{size:3,elementOffset:12},instanceStartPositions64Low:{size:3,elementOffset:15},instanceEndPositions64Low:{size:3,elementOffset:18},instanceRightPositions64Low:{size:3,elementOffset:21}},noAlloc:!0}}:{vertexPositions:{...this.usePositionTransforms(),size:3,vertexOffset:1,type:"float64",fp64:this.use64bitPositions(),transition:E,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}}},instanceTypes:{size:1,type:e?"float32":"uint8",update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{transform:null,size:1,accessor:"getWidth",transition:!e&&E,defaultValue:1,bufferGroup:"path-instance-data"},instanceColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",accessor:"getColor",transition:!e&&E,defaultValue:S,bufferGroup:"path-instance-data"},rowIndexes:{size:1,type:"uint32",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"path-instance-data"}}),this.setState({pathTesselator:new x({fp64:this.use64bitPositions(),isWebGPU:e}),subdivisionStep:this.getSubdivisionStep(),pathProjectionScale:this.getPathProjectionScale(this.context.viewport)})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,n=this.getAttributeManager(),s=n.attributes;s.instanceStrokeWidths.settings.transform=t._projectionTolerance?O:null,s.instanceColors.settings.transform=t._projectionTolerance?T:null;let{viewport:r}=this.context,a=this.state.subdivisionStep!==this.getSubdivisionStep(),l=this.getPathProjectionScale(r),c=!w(this.state.pathProjectionScale,l),d=o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getPath),f=o.projectionChanged||this.state.preproject&&(!(0,p.b)(t.modelMatrix,i.modelMatrix,1)||!(0,p.b)(t.coordinateOrigin,i.coordinateOrigin,1))||d||t._projectionTolerance!==i._projectionTolerance||t._projectionNoCut!==i._projectionNoCut||t._pathType!==i._pathType||t.positionFormat!==i.positionFormat||t.wrapLongitude!==i.wrapLongitude||a;if(o.dataChanged||f){let{pathTesselator:e}=this.state,i=t.data.attributes||{},s=(0,C.A)(this.state.packedCrs);if(t._projectionTolerance&&(!s||!this.usePositionTransforms().transform||t._pathType||i.getPath&&!ArrayBuffer.isView(i.getPath.value??i.getPath)||Object.keys(i).some(e=>"getPath"!==e)))throw Error("Projection refinement requires linear target units, normalized paths and per-object attributes");e.updateGeometry({data:t.data,geometryBuffer:i.getPath,buffers:i,normalize:!t._pathType,loop:"loop"===t._pathType,getGeometry:t.getPath,transform:this.usePositionTransforms().transform?.bind(this),positionFormat:t.positionFormat,wrapLongitude:t.wrapLongitude&&!this.state.preproject&&this.state.sourceCrs?.signature==="WGS84",resolution:t._projectionNoCut?0:this.getSubdivisionStep(),projectionTolerance:t._projectionTolerance,projectionToleranceScale:s??void 0,dataChanged:f?void 0:o.dataChanged}),this.setState({numInstances:e.instanceCount,startIndices:e.vertexStarts,subdivisionStep:this.getSubdivisionStep(),pathProjectionScale:l}),!o.dataChanged||f?n.invalidateAll():c&&n.invalidate("instanceDashOffsets")}else c&&(this.setState({pathProjectionScale:l}),n.invalidate("instanceDashOffsets"));(o.extensionsChanged||t.antialiasing!==i.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),n.invalidateAll())}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,o=this.props.data;return o[0]&&o[0].__source&&(t.object=o.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{jointRounded:t,capRounded:i,billboard:o,miterLimit:n,widthUnits:s,widthScale:r,widthMinPixels:a,widthMaxPixels:l}=this.props,c=this.state.model,d={jointType:Number(t),capType:Number(i),billboard:o,widthUnits:f.p5[s],widthScale:r,miterLimit:n,widthMinPixels:a,widthMaxPixels:l};c.shaderInputs.setProps({path:d}),c.draw(this.context.renderPass)}_getModel(){return new u.A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new h.V2({topology:"triangle-list",attributes:{indices:new Uint16Array([0,1,2,1,4,2,1,3,4,3,5,4]),positions:{value:new Float32Array([0,0,0,-1,0,1,1,-1,1,1,1,0]),size:2}}}),isInstanced:!0})}calculatePositions(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateSegmentTypes(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("segmentTypes")}calculateWebGPUPositions(e){let{pathTesselator:t}=this.state,i=t.get("positions");if(!i){e.value=null;return}let o=t.instanceCount,n=new Float32Array(24*o),s=[-1,0,1,2];for(let e=0;e<o;e++){let t=24*e;for(let r=0;r<4;r++){let a=e+s[r],l=t+3*r;for(let e=0;e<3;e++){let t=a>=0&&a<o?i[3*a+e]:0,s=Math.fround(t);n[l+e]=s,n[l+e+12]=t-s}}}e.startIndices=t.vertexStarts,e.value=n}}I.defaultProps=A,I.layerName="PathLayer";let R=I;function O(e){if(this.props._projectionTolerance&&"number"!=typeof e)throw Error("Projection refinement requires per-object widths");return e}function T(e){if(this.props._projectionTolerance&&("object"==typeof e?.[0]||e?.length>4))throw Error("Projection refinement requires per-object colors");return this.props._projectionTolerance&&"RGB"===this.props.colorFormat&&e?.length===4?e.slice(0,3):e}},82759(e,t,i){i.d(t,{A:()=>S});var o=i(66260),n=i(84175),s=i(46487),r=i(19754),a=i(9350),l=i(88599),c=i(25337),d=i(62459),p=i(3770);let f=`\
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
  highp uint rowIndexOffset;
} scatterplot;
`,u={name:"scatterplot",vs:f,fs:f,source:"",uniformTypes:{radiusScale:"f32",radiusMinPixels:"f32",radiusMaxPixels:"f32",lineWidthScale:"f32",lineWidthMinPixels:"f32",lineWidthMaxPixels:"f32",stroked:"f32",filled:"f32",antialiasing:"f32",billboard:"f32",radiusUnits:"i32",lineWidthUnits:"i32",rowIndexOffset:"u32"}},h=`\
#version 300 es
#define SHADER_NAME scatterplot-layer-vertex-shader
in vec3 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceRadius;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
#ifdef USE_ROW_INDEXES
in float rowIndexes;
#endif
in vec2 instancePixelOffset;
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
#ifdef USE_ROW_INDEXES
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
#else
geometry.pickingColor = picking_getPickingColorFromIndex(uint(gl_InstanceID) + scatterplot.rowIndexOffset);
#endif
innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / outerRadiusPixels;
if (scatterplot.billboard) {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
gl_Position = project_globe_billboard_clipspace(gl_Position, geometry.position.xyz);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = edgePadding * positions * outerRadiusPixels;
offset.xy += instancePixelOffset;
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
if (project_globe_is_occluded(geometry.position.xyz)) {
gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}
} else {
vec3 offset = edgePadding * positions * project_pixel_size(outerRadiusPixels);
offset.xy += project_pixel_size(instancePixelOffset);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vFillColor, geometry);
vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,g=`\
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
`,v=`\
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
  rowIndexOffset: u32,
};

@group(0) @binding(0) var<uniform> scatterplot: ScatterplotUniforms;

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
  @location(7) instancePixelOffset: vec2<f32>,
  PICKING_COLOR_ATTRIBUTE
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
  // WGSL selects the second value when the condition is true, so keep the antialiased path second.
  let edgePadding = select(
    1.0,
    (varyings.outerRadiusPixels + SMOOTH_EDGE_RADIUS) / varyings.outerRadiusPixels,
    scatterplot.antialiasing != 0
  );

  // position on the containing square in [-1, 1] space
  varyings.unitPosition = edgePadding * attributes.positions.xy;
  geometry.uv = varyings.unitPosition;
  geometry.pickingColor = PICKING_COLOR_VALUE;

  varyings.innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / varyings.outerRadiusPixels;

  if (scatterplot.billboard != 0) {
    let projectedPosition = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      vec3<f32>(0.0)
    );
    geometry.position = projectedPosition.commonPosition;
    varyings.position = project_globe_billboard_clipspace(projectedPosition.clipPosition, geometry.position.xyz);
    // DECKGL_FILTER_GL_POSITION(varyings.position, geometry);
    var offset = edgePadding * attributes.positions * varyings.outerRadiusPixels;
    offset = vec3<f32>(offset.xy + attributes.instancePixelOffset, offset.z);
    DECKGL_FILTER_SIZE(&offset, geometry);
    let clipPixels = project_pixel_size_to_clipspace(offset.xy);
    varyings.position = vec4<f32>(varyings.position.x + clipPixels.x, varyings.position.y + clipPixels.y, varyings.position.z, varyings.position.w);
    geometry.position = vec4<f32>(
      geometry.position.xy + project_pixel_size_vec2(offset.xy),
      geometry.position.zw
    );
    // Hide points whose anchor is behind the globe; culling handles non-billboard points
    if (project_globe_is_occluded(projectedPosition.commonPosition.xyz)) {
      varyings.position = vec4<f32>(0.0, 0.0, 2.0, 1.0);
    }
  } else {
    var offset = edgePadding * attributes.positions * project_pixel_size_float(varyings.outerRadiusPixels);
    offset = vec3<f32>(offset.xy + project_pixel_size_vec2(attributes.instancePixelOffset), offset.z);
    DECKGL_FILTER_SIZE(&offset, geometry);
    let projectedPosition = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      offset
    );
    geometry.position = projectedPosition.commonPosition;
    varyings.position = projectedPosition.clipPosition;
    // DECKGL_FILTER_GL_POSITION(varyings.position, geometry);
  }


  // Apply opacity to instance color, or return instance picking color
  varyings.vFillColor = vec4<f32>(attributes.instanceFillColors.rgb, attributes.instanceFillColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(varyings.vFillColor, geometry);
  varyings.vLineColor = vec4<f32>(attributes.instanceLineColors.rgb, attributes.instanceLineColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(varyings.vLineColor, geometry);
  varyings.pickingColor = geometry.pickingColor;

  DECKGL_FILTER_GL_POSITION(&varyings.position, geometry);

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  fragmentGeometry.uv = varyings.unitPosition;

  let distToCenter = length(varyings.unitPosition) * varyings.outerRadiusPixels;
  let inCircle = select(
    step(distToCenter, varyings.outerRadiusPixels),
    smoothedge(distToCenter, varyings.outerRadiusPixels),
    scatterplot.antialiasing != 0
  );

  if (inCircle == 0.0) {
    discard;
  }

  var fragColor: vec4<f32>;

  if (scatterplot.stroked != 0) {
    let isLine = select(
      step(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
      smoothedge(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
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
    var extensionColor = fragColor;
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  DECKGL_FILTER_COLOR(&fragColor, fragmentGeometry);

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
`;var P=i(60608);let m={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},radii:{attribute:"instanceRadius",accessor:"getRadius",semantic:"scalar",size:1,defaultValue:1},fillColors:{attribute:"instanceFillColors",accessor:"getFillColor",semantic:"color",size:4},lineColors:{attribute:"instanceLineColors",accessor:"getLineColor",semantic:"color",size:4},lineWidths:{attribute:"instanceLineWidths",accessor:"getLineWidth",semantic:"scalar",size:1,defaultValue:1},pixelOffsets:{attribute:"instancePixelOffset",accessor:"getPixelOffset",semantic:"vector",size:2,prop:!1}};function y(e){return Object.entries(m).some(([t,i])=>!1!==i.prop&&!!e[t])}class x extends P.h{constructor(e){super(e,m,"Scatterplot",!0)}}let _=e=>e.position,C=[0,0,0,255],L={radiusUnits:"meters",radiusScale:{type:"number",min:0,value:1},radiusMinPixels:{type:"number",min:0,value:0},radiusMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},lineWidthUnits:"meters",lineWidthScale:{type:"number",min:0,value:1},lineWidthMinPixels:{type:"number",min:0,value:0},lineWidthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},stroked:!1,filled:!0,billboard:!1,antialiasing:!0,getPosition:{type:"accessor",value:_},getRadius:{type:"accessor",value:1},getFillColor:{type:"accessor",value:C},getLineColor:{type:"accessor",value:C},getLineWidth:{type:"accessor",value:1},getPixelOffset:{type:"accessor",value:[0,0]},positions:{type:"object",value:null,optional:!0},radii:{type:"object",value:null,optional:!0},fillColors:{type:"object",value:null,optional:!0},lineColors:{type:"object",value:null,optional:!0},lineWidths:{type:"object",value:null,optional:!0},strokeWidth:{deprecatedFor:"getLineWidth"},outline:{deprecatedFor:"stroked"},getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class b extends o.A{getBounds(){return this.state?.columns?this.state.columns.getBounds():super.getBounds()}_getAttributeManager(){return y(this.props)?null:super._getAttributeManager()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}get isLoaded(){return!this.state?.columns?.loading&&super.isLoaded}finalizeState(e){this.state.columns?.destroy(),super.finalizeState(e),this.state.geometry?.destroy()}getShaders(){let e=!!this.props.data?.attributes?.rowIndexes;return super.getShaders({vs:h,fs:g,source:function(e,t=!1){return(t?v.replace("@location(0) positions: vec3<f32>,","").replace("  var varyings: Varyings;",`  var varyings: Varyings;
  let quadPositions = array<vec3<f32>, 4>(vec3<f32>(-1.0, -1.0, 0.0), vec3<f32>(1.0, -1.0, 0.0), vec3<f32>(-1.0, 1.0, 0.0), vec3<f32>(1.0, 1.0, 0.0));
  let quadPosition = quadPositions[attributes.vertexIndex];`).replaceAll("attributes.positions","quadPosition"):v).replace("PICKING_COLOR_ATTRIBUTE",e?"@location(8) rowIndexes: u32,":"").replace("PICKING_COLOR_VALUE",e?"picking_getPickingColorFromIndex(attributes.rowIndexes)":"picking_getPickingColorFromIndex(attributes.instanceIndex + scatterplot.rowIndexOffset)")}(e,"webgpu"===this.context.device.type&&y(this.props)),defines:e?{USE_ROW_INDEXES:!0}:{},modules:[n.A,s.A,r.Ay,u]})}initializeState(){if(y(this.props)){if(this.props.extensions.length)throw Error("Scatterplot Arrow columns do not support extensions");return}this.initializeAccessorAttributes()}initializeAccessorAttributes(){let e=this.props.data?.attributes?.rowIndexes?{rowIndexes:{size:1,type:"uint32",noAlloc:!0}}:{};this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition",...this.usePositionTransforms()},instanceRadius:{size:1,transition:!0,accessor:"getRadius",defaultValue:1,bufferGroup:"scatterplot-instance-data"},instanceFillColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255],bufferGroup:"scatterplot-instance-data"},instanceLineColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255],bufferGroup:"scatterplot-instance-data"},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1,bufferGroup:"scatterplot-instance-data"},instancePixelOffset:{size:2,transition:!0,accessor:"getPixelOffset",bufferGroup:"scatterplot-instance-data"},...e})}updateState(e){y(this.props)?this.updateColumnState(e):(this.restoreAccessorState(),super.updateState(e),e.changeFlags.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()))}restoreAccessorState(){this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.internalState.attributeManager=super._getAttributeManager(),this.initializeAccessorAttributes(),this.state.model?.destroy(),this.state.model=this._getModel())}updateColumnState(e){if(this.props.extensions.length)throw Error("Scatterplot Arrow columns do not support extensions");let t=!this.state.columns;t&&(this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new x(this.context.device)),(t||e.changeFlags.extensionsChanged||!!e.props.data?.attributes?.rowIndexes!=!!e.oldProps.data?.attributes?.rowIndexes)&&(this.state.model?.destroy(),this.state.model=this._getModel()),this.state.columns.updateIfNeeded(e,{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:e=>this.raiseError(e,"converting Arrow columns"),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!this.props.positions&&this.props.getPosition===_}})}draw({uniforms:e}){let{radiusUnits:t,radiusScale:i,radiusMinPixels:o,radiusMaxPixels:n,stroked:s,filled:r,billboard:l,antialiasing:c,lineWidthUnits:d,lineWidthScale:p,lineWidthMinPixels:f,lineWidthMaxPixels:u}=this.props,h={stroked:s,filled:r,billboard:l,antialiasing:c,radiusUnits:a.p5[t],radiusScale:i,radiusMinPixels:o,radiusMaxPixels:n,lineWidthUnits:a.p5[d],lineWidthScale:p,lineWidthMinPixels:f,lineWidthMaxPixels:u,rowIndexOffset:0},g=this.state.model;!g||this.state.columns&&!!this.props.data?.attributes?.rowIndexes!==this.state.columns.hasRowIndexes||(g.shaderInputs.setProps({scatterplot:h}),this.state.columns?this.state.columns.draw(g,this.context.renderPass,e=>{g.setInstanceCount(Math.min(g.instanceCount,Math.max(0,this.getNumInstances()-e))),g.shaderInputs.setProps({scatterplot:{rowIndexOffset:e}})}):g.draw(this.context.renderPass))}_getModel(){this.state.geometry?.destroy(),this.state.geometry=void 0;let e=new c.V2({topology:"triangle-strip",attributes:{positions:{size:3,value:new Float32Array([-1,-1,0,1,-1,0,-1,1,0,1,1,0])}}}),t={...this.getShaders(),id:this.props.id,bufferLayout:this.state.columns?.getBufferLayouts(!!this.props.data?.attributes?.rowIndexes)??this.getAttributeManager().getBufferLayouts(),isInstanced:!0};if(this.state.columns){if("webgpu"===this.context.device.type)return new d.X(this.context.device,{...t,topology:"triangle-strip",vertexCount:4,inferDrawCount:"instance"});let i=(0,p.M)(this.context.device,e);return this.state.geometry=i,new d.X(this.context.device,{...t,geometry:i,inferDrawCount:"instance"})}return new l.A(this.context.device,{...t,geometry:e,enforceMatchingVectorLengths:!1,inferDrawCount:"no"})}}b.defaultProps=L,b.layerName="ScatterplotLayer";let S=b},6053(e,t,i){function o(e){if(!e||"projected"!==e.coordinateFrame&&"geocentric"!==e.coordinateFrame)return null;let t=e.xUnit.metersPerUnit,i=e.yUnit.metersPerUnit,o=e.zUnit.metersPerUnit;return"number"!=typeof t||!Number.isFinite(t)||t<=0||"number"!=typeof i||!Number.isFinite(i)||i<=0||"number"!=typeof o||!Number.isFinite(o)||o<=0?null:[t,i,o]}function n({data:e,getIndex:t,dataRange:i,replace:o}){let{startRow:s=0,endRow:r=1/0}=i,a=e.length,l=a,c=a;for(let i=0;i<a;i++){let o=t(e[i]);if(l>i&&o>=s&&(l=i),o>=r){c=i;break}}let d=l,p=c-l!==o.length?e.slice(c):void 0;for(let t=0;t<o.length;t++)e[d++]=o[t];if(p){for(let t=0;t<p.length;t++)e[d++]=p[t];e.length=d}return{startRow:l,endRow:l+o.length}}i.d(t,{A:()=>o,J:()=>n})},12116(e,t,i){function o(e,t,i,n,s=[]){let r,a;if(8&i)r=(n[3]-e[1])/(t[1]-e[1]),a=3;else if(4&i)r=(n[1]-e[1])/(t[1]-e[1]),a=1;else if(2&i)r=(n[2]-e[0])/(t[0]-e[0]),a=2;else{if(!(1&i))return null;r=(n[0]-e[0])/(t[0]-e[0]),a=0}for(let i=0;i<e.length;i++)s[i]=(1&a)===i?n[a]:r*(t[i]-e[i])+e[i];return s}function n(e,t){let i=0;return e[0]<t[0]?i|=1:e[0]>t[2]&&(i|=2),e[1]<t[1]?i|=4:e[1]>t[3]&&(i|=8),i}i.d(t,{w:()=>a,M:()=>r});var s=i(46954);function r(e,t){let i,r,{size:a=2,broken:l=!1,gridResolution:d=10,gridOffset:p=[0,0],startIndex:f=0,endIndex:u=e.length}=t||{},h=(u-f)/a,g=[],v=[g],P=(0,s.ah)(e,0,a,f),m=c(P,d,p,[]),y=[];(0,s.VC)(g,P);for(let t=1;t<h;t++){for(r=n(i=(0,s.ah)(e,t,a,f,i),m);r;){var x,_,C;o(P,i,r,m,y);let e=n(y,m);e&&(o(P,y,e,m,y),r=e),(0,s.VC)(g,y),(0,s.C)(P,y),x=m,_=d,8&(C=r)?(x[1]+=_,x[3]+=_):4&C?(x[1]-=_,x[3]-=_):2&C?(x[0]+=_,x[2]+=_):1&C&&(x[0]-=_,x[2]-=_),l&&g.length>a&&(g=[],v.push(g),(0,s.VC)(g,P)),r=n(i,m)}(0,s.VC)(g,i),(0,s.C)(P,i)}return l?v:v[0]}function a(e,t=null,i){if(!e.length)return[];let{size:o=2,gridResolution:s=10,gridOffset:r=[0,0],edgeTypes:p=!1}=i||{},f=[],u=[{pos:e,types:p?Array(e.length/o).fill(1):null,holes:t||[]}],h=[[],[]],g=[];for(;u.length;){let{pos:e,types:t,holes:i}=u.shift();(function(e,t,i,o){let n=1/0,s=-1/0,r=1/0,a=-1/0;for(let o=0;o<i;o+=t){let t=e[o],i=e[o+1];n=t<n?t:n,s=t>s?t:s,r=i<r?i:r,a=i>a?i:a}o[0][0]=n,o[0][1]=r,o[1][0]=s,o[1][1]=a})(e,o,i[0]||e.length,h),g=c(h[0],s,r,g);let a=n(h[1],g);if(a){let n=l(e,t,o,0,i[0]||e.length,g,a),s={pos:n[0].pos,types:n[0].types,holes:[]},r={pos:n[1].pos,types:n[1].types,holes:[]};u.push(s,r);for(let c=0;c<i.length;c++)(n=l(e,t,o,i[c],i[c+1]||e.length,g,a))[0]&&(s.holes.push(s.pos.length),s.pos=d(s.pos,n[0].pos),p&&(s.types=d(s.types,n[0].types))),n[1]&&(r.holes.push(r.pos.length),r.pos=d(r.pos,n[1].pos),p&&(r.types=d(r.types,n[1].types)))}else{let o={positions:e};p&&(o.edgeTypes=t),i.length&&(o.holeIndices=i),f.push(o)}}return f}function l(e,t,i,n,r,a,l){let c,d,p,f=(r-n)/i,u=[],h=[],g=[],v=[],P=[],m=(0,s.ah)(e,f-1,i,n),y=Math.sign(8&l?m[1]-a[3]:m[0]-a[2]),x=t&&t[f-1],_=0,C=0;for(let r=0;r<f;r++)c=(0,s.ah)(e,r,i,n,c),d=Math.sign(8&l?c[1]-a[3]:c[0]-a[2]),p=t&&t[n/i+r],d&&y&&y!==d&&(o(m,c,l,a,P),(0,s.VC)(u,P)&&g.push(x),(0,s.VC)(h,P)&&v.push(x)),d<=0?((0,s.VC)(u,c)&&g.push(p),_-=d):g.length&&(g[g.length-1]=0),d>=0?((0,s.VC)(h,c)&&v.push(p),C+=d):v.length&&(v[v.length-1]=0),(0,s.C)(m,c),y=d,x=p;return[_?{pos:u,types:t&&g}:null,C?{pos:h,types:t&&v}:null]}function c(e,t,i,o){let n=Math.floor((e[0]-i[0])/t)*t+i[0],s=Math.floor((e[1]-i[1])/t)*t+i[1];return o[0]=n,o[1]=s,o[2]=n+t,o[3]=s+t,o}function d(e,t){for(let i=0;i<t.length;i++)e.push(t[i]);return e}},65441(e,t,i){i.d(t,{E:()=>r,I:()=>s});var o=i(12116),n=i(46954);function s(e,t){let{size:i=2,startIndex:n=0,endIndex:s=e.length,normalize:r=!0}=t||{},c=e.slice(n,s);a(c,i,0,s-n);let d=(0,o.M)(c,{size:i,broken:!0,gridResolution:360,gridOffset:[-180,-180]});if(r)for(let e of d)l(e,i);return d}function r(e,t=null,i){let{size:s=2,normalize:c=!0,edgeTypes:d=!1}=i||{};t=t||[];let p=[],f=[],u=0,h=0;for(let o=0;o<=t.length;o++){let r=t[o]||e.length,l=h,c=function(e,t,i,o){let n=-1,s=-1;for(let r=i+1;r<o;r+=t){let t=Math.abs(e[r]);t>n&&(n=t,s=r-1)}return s}(e,s,u,r);for(let t=c;t<r;t++)p[h++]=e[t];for(let t=u;t<c;t++)p[h++]=e[t];a(p,s,l,h),function(e,t,i,o,s=85.051129){let r=e[i],a=e[o-t];if(Math.abs(r-a)>180){let o=(0,n.ah)(e,0,t,i);o[0]+=360*Math.round((a-r)/360),(0,n.VC)(e,o),o[1]=Math.sign(o[1])*s,(0,n.VC)(e,o),o[0]=r,(0,n.VC)(e,o)}}(p,s,l,h,i?.maxLatitude),u=r,f[o]=h}f.pop();let g=(0,o.w)(p,f,{size:s,gridResolution:360,gridOffset:[-180,-180],edgeTypes:d});if(c)for(let e of g)l(e.positions,s);return g}function a(e,t,i,o){let n,s=e[0];for(let r=i;r<o;r+=t){let t=(n=e[r])-s;(t>180||t<-180)&&(n-=360*Math.round(t/360)),e[r]=s=n}}function l(e,t){let i,o=e.length/t;for(let n=0;n<o&&((i=e[n*t])+180)%360==0;n++);let n=-(360*Math.round(i/360));if(0!==n)for(let i=0;i<o;i++)e[i*t]+=n}},40961(e,t,i){i.d(t,{A:()=>o});function o(e,t){let{transform:i,tolerance:o,createEdgeSampler:n,size:s=2,targetSize:r=s,maxSegmentLength:a=1/0,maxDepth:l=16,maxVertices:c=65536}=t;if("function"!=typeof i||void 0!==n&&"function"!=typeof n||!Number.isFinite(o)||o<=0||2!==s&&3!==s||2!==r&&3!==r||!(a>0)||!Number.isFinite(a)&&a!==1/0||!Number.isInteger(l)||l<0||l>30||!Number.isSafeInteger(c)||c<1||c>0xffffffff||!Number.isSafeInteger(e.length)||e.length<0||e.length%s!=0)throw RangeError("Invalid polyline subdivision options or input length");let d=e.length/s;if(d>c)throw RangeError("Polyline exceeds maxVertices");let p=[];for(let t=0;t<e.length;t++){let i=e[t];if(!Number.isFinite(i))throw RangeError("Source positions must be finite");p.push(i)}let f=[],u=[],h=[],g=[];function v(e,t){let o=i(e.slice());if(!o||o.length!==r)throw RangeError("Transform must return a position with targetSize components");let n=Array.from(o);if(!n.every(Number.isFinite))throw RangeError("Transform returned nonfinite coordinates");return{source:e,target:n,fraction:t}}function P(e,t){if(h.length>=c)throw RangeError("Polyline subdivision exceeded maxVertices");for(let t of e.source)f.push(t);for(let t of e.target)u.push(t);h.push(t),g.push(e.fraction)}function m(e,t){let i=e.sample(t);if(!i||i.length!==s)throw RangeError("Invalid source-edge sample size");let o=Array.from(i);if(!o.every(Number.isFinite))throw RangeError("Nonfinite source-edge sample");return o}if(d){let e=v(p.slice(0,s),0);P(e,0);for(let t=1;t<d;t++){let i=v(p.slice(t*s,(t+1)*s),1),r={...e,fraction:0},c=n?.(r.source.slice(),i.source.slice(),t-1);if(n){if(!c||"function"!=typeof c.sample||!Number.isFinite(c.length)||c.length<0)throw RangeError("Invalid source-edge sampler");for(let e of[r,i])if(m(c,e.fraction).some((t,i)=>t!==e.source[i]))throw RangeError("Source-edge sampler endpoints must match input")}!function e(t,i,n,s,r){let c,d=0;for(let e of[.25,.5,.75]){let o=function(e,t,i,o){let n=e.fraction*(1-i)+t.fraction*i;return v(o?m(o,n):e.source.map((e,o)=>e*(1-i)+t.source[o]*i),n)}(t,i,e,r);.5===e&&(c=o),d=Math.max(d,Math.hypot(...o.target.map((o,n)=>o-(t.target[n]*(1-e)+i.target[n]*e))))}let p=r?r.length*(i.fraction-t.fraction):Math.hypot(...t.source.map((e,t)=>e-i.source[t]));if(d<=o&&p<=a)return void P(i,n);if(s>=l)throw RangeError(`Polyline subdivision exceeded maxDepth on input edge ${n}`);e(t,c,n,s+1,r),e(c,i,n,s+1,r)}(r,i,t-1,0,c),e=i}}return{sourcePositions:new Float64Array(f),positions:new Float64Array(u),segmentIndices:new Uint32Array(h),segmentFractions:new Float64Array(g)}}},46954(e,t,i){function o(e,t){let i=t.length,o=e.length;if(o>0){let n=!0;for(let s=0;s<i;s++)if(e[o-i+s]!==t[s]){n=!1;break}if(n)return!1}for(let n=0;n<i;n++)e[o+n]=t[n];return!0}function n(e,t){let i=t.length;for(let o=0;o<i;o++)e[o]=t[o]}function s(e,t,i,o,n=[]){let r=o+t*i;for(let t=0;t<i;t++)n[t]=e[r+t];return n}i.d(t,{C:()=>n,VC:()=>o,ah:()=>s})}}]);