"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["6469"],{55230(e){function t(e,t,p){p=p||2;var f,g,x,v,m,y,_,P=t&&t.length,C=P?t[0]*p:e.length,b=i(e,0,C,p,!0),L=[];if(!b||b.next===b.prev)return L;if(P&&(b=function(e,t,s,l){var c,p,f,g,h,x=[];for(c=0,p=t.length;c<p;c++)f=t[c]*l,g=c<p-1?t[c+1]*l:e.length,(h=i(e,f,g,l,!1))===h.next&&(h.steiner=!0),x.push(function(e){var t=e,i=e;do(t.x<i.x||t.x===i.x&&t.y<i.y)&&(i=t),t=t.next;while(t!==e)return i}(h));for(x.sort(n),c=0;c<x.length;c++)s=function(e,t){var i=function(e,t){var i,o,n,s=t,l=e.x,c=e.y,p=-1/0;do{if(c<=s.y&&c>=s.next.y&&s.next.y!==s.y){var f=s.x+(c-s.y)*(s.next.x-s.x)/(s.next.y-s.y);if(f<=l&&f>p&&(p=f,n=s.x<s.next.x?s:s.next,f===l))return n}s=s.next}while(s!==t)if(!n)return null;var u,g=n,h=n.x,x=n.y,v=1/0;s=n;do{l>=s.x&&s.x>=h&&l!==s.x&&r(c<x?l:p,c,h,x,c<x?p:l,c,s.x,s.y)&&(u=Math.abs(c-s.y)/(l-s.x),d(s,e)&&(u<v||u===v&&(s.x>n.x||s.x===n.x&&(i=n,o=s,0>a(i.prev,i,o.prev)&&0>a(o.next,i,i.next))))&&(n=s,v=u)),s=s.next}while(s!==g)return n}(e,t);if(!i)return t;var n=u(i,e);return o(n,n.next),o(i,i.next)}(x[c],s);return s}(e,t,b,p)),e.length>80*p){f=x=e[0],g=v=e[1];for(var S=p;S<C;S+=p)m=e[S],y=e[S+1],m<f&&(f=m),y<g&&(g=y),m>x&&(x=m),y>v&&(v=y);_=0!==(_=Math.max(x-f,v-g))?32767/_:0}return function e(t,i,n,p,f,g,x){if(t){!x&&g&&function(e,t,i,o){var n=e;do 0===n.z&&(n.z=s(n.x,n.y,t,i,o)),n.prevZ=n.prev,n.nextZ=n.next,n=n.next;while(n!==e)n.prevZ.nextZ=null,n.prevZ=null,function(e){var t,i,o,n,s,r,a,l,c=1;do{for(i=e,e=null,s=null,r=0;i;){for(r++,o=i,a=0,t=0;t<c&&(a++,o=o.nextZ);t++);for(l=c;a>0||l>0&&o;)0!==a&&(0===l||!o||i.z<=o.z)?(n=i,i=i.nextZ,a--):(n=o,o=o.nextZ,l--),s?s.nextZ=n:e=n,n.prevZ=s,s=n;i=o}s.nextZ=null,c*=2}while(r>1)}(n)}(t,p,f,g);for(var v,m,y=t;t.prev!==t.next;){if(v=t.prev,m=t.next,g?function(e,t,i,o){var n=e.prev,l=e.next;if(a(n,e,l)>=0)return!1;for(var c=n.x,p=e.x,f=l.x,d=n.y,u=e.y,g=l.y,h=c<p?c<f?c:f:p<f?p:f,x=d<u?d<g?d:g:u<g?u:g,v=c>p?c>f?c:f:p>f?p:f,m=d>u?d>g?d:g:u>g?u:g,y=s(h,x,t,i,o),_=s(v,m,t,i,o),P=e.prevZ,C=e.nextZ;P&&P.z>=y&&C&&C.z<=_;){if(P.x>=h&&P.x<=v&&P.y>=x&&P.y<=m&&P!==n&&P!==l&&r(c,d,p,u,f,g,P.x,P.y)&&a(P.prev,P,P.next)>=0||(P=P.prevZ,C.x>=h&&C.x<=v&&C.y>=x&&C.y<=m&&C!==n&&C!==l&&r(c,d,p,u,f,g,C.x,C.y)&&a(C.prev,C,C.next)>=0))return!1;C=C.nextZ}for(;P&&P.z>=y;){if(P.x>=h&&P.x<=v&&P.y>=x&&P.y<=m&&P!==n&&P!==l&&r(c,d,p,u,f,g,P.x,P.y)&&a(P.prev,P,P.next)>=0)return!1;P=P.prevZ}for(;C&&C.z<=_;){if(C.x>=h&&C.x<=v&&C.y>=x&&C.y<=m&&C!==n&&C!==l&&r(c,d,p,u,f,g,C.x,C.y)&&a(C.prev,C,C.next)>=0)return!1;C=C.nextZ}return!0}(t,p,f,g):function(e){var t=e.prev,i=e.next;if(a(t,e,i)>=0)return!1;for(var o=t.x,n=e.x,s=i.x,l=t.y,c=e.y,p=i.y,f=o<n?o<s?o:s:n<s?n:s,d=l<c?l<p?l:p:c<p?c:p,u=o>n?o>s?o:s:n>s?n:s,g=l>c?l>p?l:p:c>p?c:p,h=i.next;h!==t;){if(h.x>=f&&h.x<=u&&h.y>=d&&h.y<=g&&r(o,l,n,c,s,p,h.x,h.y)&&a(h.prev,h,h.next)>=0)return!1;h=h.next}return!0}(t)){i.push(v.i/n|0),i.push(t.i/n|0),i.push(m.i/n|0),h(t),t=m.next,y=m.next;continue}if((t=m)===y){x?1===x?e(t=function(e,t,i){var n=e;do{var s=n.prev,r=n.next.next;!l(s,r)&&c(s,n,n.next,r)&&d(s,r)&&d(r,s)&&(t.push(s.i/i|0),t.push(n.i/i|0),t.push(r.i/i|0),h(n),h(n.next),n=e=r),n=n.next}while(n!==e)return o(n)}(o(t),i,n),i,n,p,f,g,2):2===x&&function(t,i,n,s,r,p){var f=t;do{for(var g,h,x=f.next.next;x!==f.prev;){if(f.i!==x.i&&(g=f,h=x,g.next.i!==h.i&&g.prev.i!==h.i&&!function(e,t){var i=e;do{if(i.i!==e.i&&i.next.i!==e.i&&i.i!==t.i&&i.next.i!==t.i&&c(i,i.next,e,t))return!0;i=i.next}while(i!==e)return!1}(g,h)&&(d(g,h)&&d(h,g)&&function(e,t){var i=e,o=!1,n=(e.x+t.x)/2,s=(e.y+t.y)/2;do i.y>s!=i.next.y>s&&i.next.y!==i.y&&n<(i.next.x-i.x)*(s-i.y)/(i.next.y-i.y)+i.x&&(o=!o),i=i.next;while(i!==e)return o}(g,h)&&(a(g.prev,g,h.prev)||a(g,h.prev,h))||l(g,h)&&a(g.prev,g,g.next)>0&&a(h.prev,h,h.next)>0))){var v=u(f,x);f=o(f,f.next),v=o(v,v.next),e(f,i,n,s,r,p,0),e(v,i,n,s,r,p,0);return}x=x.next}f=f.next}while(f!==t)}(t,i,n,p,f,g):e(o(t),i,n,p,f,g,1);break}}}}(b,L,p,f,g,_,0),L}function i(e,t,i,o,n){var s,r;if(n===v(e,t,i,o)>0)for(s=t;s<i;s+=o)r=g(s,e[s],e[s+1],r);else for(s=i-o;s>=t;s-=o)r=g(s,e[s],e[s+1],r);return r&&l(r,r.next)&&(h(r),r=r.next),r}function o(e,t){if(!e)return e;t||(t=e);var i,o=e;do if(i=!1,!o.steiner&&(l(o,o.next)||0===a(o.prev,o,o.next))){if(h(o),(o=t=o.prev)===o.next)break;i=!0}else o=o.next;while(i||o!==t)return t}function n(e,t){return e.x-t.x}function s(e,t,i,o,n){return(e=((e=((e=((e=((e=(e-i)*n|0)|e<<8)&0xff00ff)|e<<4)&0xf0f0f0f)|e<<2)&0x33333333)|e<<1)&0x55555555)|(t=((t=((t=((t=((t=(t-o)*n|0)|t<<8)&0xff00ff)|t<<4)&0xf0f0f0f)|t<<2)&0x33333333)|t<<1)&0x55555555)<<1}function r(e,t,i,o,n,s,r,a){return(n-r)*(t-a)>=(e-r)*(s-a)&&(e-r)*(o-a)>=(i-r)*(t-a)&&(i-r)*(s-a)>=(n-r)*(o-a)}function a(e,t,i){return(t.y-e.y)*(i.x-t.x)-(t.x-e.x)*(i.y-t.y)}function l(e,t){return e.x===t.x&&e.y===t.y}function c(e,t,i,o){var n=f(a(e,t,i)),s=f(a(e,t,o)),r=f(a(i,o,e)),l=f(a(i,o,t));return!!(n!==s&&r!==l||0===n&&p(e,i,t)||0===s&&p(e,o,t)||0===r&&p(i,e,o)||0===l&&p(i,t,o))}function p(e,t,i){return t.x<=Math.max(e.x,i.x)&&t.x>=Math.min(e.x,i.x)&&t.y<=Math.max(e.y,i.y)&&t.y>=Math.min(e.y,i.y)}function f(e){return e>0?1:e<0?-1:0}function d(e,t){return 0>a(e.prev,e,e.next)?a(e,t,e.next)>=0&&a(e,e.prev,t)>=0:0>a(e,t,e.prev)||0>a(e,e.next,t)}function u(e,t){var i=new x(e.i,e.x,e.y),o=new x(t.i,t.x,t.y),n=e.next,s=t.prev;return e.next=t,t.prev=e,i.next=n,n.prev=i,o.next=i,i.prev=o,s.next=o,o.prev=s,o}function g(e,t,i,o){var n=new x(e,t,i);return o?(n.next=o.next,n.prev=o,o.next.prev=n,o.next=n):(n.prev=n,n.next=n),n}function h(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function x(e,t,i){this.i=e,this.x=t,this.y=i,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function v(e,t,i,o){for(var n=0,s=t,r=i-o;s<i;s+=o)n+=(e[r]-e[s])*(e[s+1]+e[r+1]),r=s;return n}e.exports=t,e.exports.default=t,t.deviation=function(e,t,i,o){var n=t&&t.length,s=n?t[0]*i:e.length,r=Math.abs(v(e,0,s,i));if(n)for(var a=0,l=t.length;a<l;a++){var c=t[a]*i,p=a<l-1?t[a+1]*i:e.length;r-=Math.abs(v(e,c,p,i))}var f=0;for(a=0;a<o.length;a+=3){var d=o[a]*i,u=o[a+1]*i,g=o[a+2]*i;f+=Math.abs((e[d]-e[g])*(e[u+1]-e[d+1])-(e[d]-e[u])*(e[g+1]-e[d+1]))}return 0===r&&0===f?0:Math.abs((f-r)/r)},t.flatten=function(e){for(var t=e[0][0].length,i={vertices:[],holes:[],dimensions:t},o=0,n=0;n<e.length;n++){for(var s=0;s<e[n].length;s++)for(var r=0;r<t;r++)i.vertices.push(e[n][s][r]);n>0&&(o+=e[n-1].length,i.holes.push(o))}return i}},51236(e,t,i){i.d(t,{A:()=>L});var o=i(59452),n=i(6053),s=i(86982),r=i(82759),a=i(32013),l=i(48314),c=i(63744);let p={circle:{type:r.A,props:{filled:"filled",stroked:"stroked",lineWidthMaxPixels:"lineWidthMaxPixels",lineWidthMinPixels:"lineWidthMinPixels",lineWidthScale:"lineWidthScale",lineWidthUnits:"lineWidthUnits",pointRadiusMaxPixels:"radiusMaxPixels",pointRadiusMinPixels:"radiusMinPixels",pointRadiusScale:"radiusScale",pointRadiusUnits:"radiusUnits",pointAntialiasing:"antialiasing",pointBillboard:"billboard",getFillColor:"getFillColor",getLineColor:"getLineColor",getLineWidth:"getLineWidth",getPointRadius:"getRadius"}},icon:{type:s.A,props:{iconAtlas:"iconAtlas",iconMapping:"iconMapping",iconSizeMaxPixels:"sizeMaxPixels",iconSizeMinPixels:"sizeMinPixels",iconSizeScale:"sizeScale",iconSizeUnits:"sizeUnits",iconAlphaCutoff:"alphaCutoff",iconBillboard:"billboard",getIcon:"getIcon",getIconAngle:"getAngle",getIconColor:"getColor",getIconPixelOffset:"getPixelOffset",getIconSize:"getSize"}},text:{type:a.A,props:{textSizeMaxPixels:"sizeMaxPixels",textSizeMinPixels:"sizeMinPixels",textSizeScale:"sizeScale",textSizeUnits:"sizeUnits",textBackground:"background",textBackgroundPadding:"backgroundPadding",textFontFamily:"fontFamily",textFontWeight:"fontWeight",textLineHeight:"lineHeight",textMaxWidth:"maxWidth",textOutlineColor:"outlineColor",textOutlineWidth:"outlineWidth",textWordBreak:"wordBreak",textCharacterSet:"characterSet",textBillboard:"billboard",textFontSettings:"fontSettings",getText:"getText",getTextAngle:"getAngle",getTextColor:"getColor",getTextPixelOffset:"getPixelOffset",getTextSize:"getSize",getTextAnchor:"getTextAnchor",getTextAlignmentBaseline:"getAlignmentBaseline",getTextBackgroundColor:"getBackgroundColor",getTextBorderColor:"getBorderColor",getTextBorderWidth:"getBorderWidth"}}},f={type:l.A,props:{lineWidthUnits:"widthUnits",lineWidthScale:"widthScale",lineWidthMinPixels:"widthMinPixels",lineWidthMaxPixels:"widthMaxPixels",lineJointRounded:"jointRounded",lineCapRounded:"capRounded",lineMiterLimit:"miterLimit",lineBillboard:"billboard",lineAntialiasing:"antialiasing",getLineColor:"getColor",getLineWidth:"getWidth"}},d={type:c.A,props:{extruded:"extruded",filled:"filled",wireframe:"wireframe",elevationScale:"elevationScale",material:"material",_full3d:"_full3d",getElevation:"getElevation",getFillColor:"getFillColor",getLineColor:"getLineColor"}};function u({type:e,props:t}){let i={};for(let o in t)i[o]=e.defaultProps[t[o]];return i}function g(e,t,i="getPosition"){let{transitions:o,updateTriggers:n}=e.props,s={updateTriggers:{},transitions:o&&{[i]:o.geometry}};for(let i in t){let r=t[i],a=e.props[i];i.startsWith("get")&&(a=e.getSubLayerAccessor(a),s.updateTriggers[r]=n[i],o&&(s.transitions[r]=o[i])),s[r]=a}return s}var h=i(68996);function x(e,t,i={}){let o={pointFeatures:[],lineFeatures:[],polygonFeatures:[],polygonOutlineFeatures:[]},{startRow:n=0,endRow:s=e.length}=i;for(let i=n;i<s;i++){let n=e[i],{geometry:s}=n;if(s)if("GeometryCollection"===s.type){h.A.assert(Array.isArray(s.geometries),"GeoJSON does not have geometries array");let{geometries:e}=s;for(let s=0;s<e.length;s++)v(e[s],o,t,n,i)}else v(s,o,t,n,i)}return o}function v(e,t,i,o,n){let{type:s,coordinates:r}=e,{pointFeatures:a,lineFeatures:l,polygonFeatures:c,polygonOutlineFeatures:p}=t;if(!function(e,t){let i=m[e];for(h.A.assert(i,`Unknown GeoJSON type ${e}`);t&&--i>0;)t=t[0];return t&&Number.isFinite(t[0])}(s,r))return void h.A.warn(`${s} coordinates are malformed`)();switch(s){case"Point":a.push(i({geometry:e},o,n));break;case"MultiPoint":r.forEach(e=>{a.push(i({geometry:{type:"Point",coordinates:e}},o,n))});break;case"LineString":l.push(i({geometry:e},o,n));break;case"MultiLineString":r.forEach(e=>{l.push(i({geometry:{type:"LineString",coordinates:e}},o,n))});break;case"Polygon":c.push(i({geometry:e},o,n)),r.forEach(e=>{p.push(i({geometry:{type:"LineString",coordinates:e}},o,n))});break;case"MultiPolygon":r.forEach(e=>{c.push(i({geometry:{type:"Polygon",coordinates:e}},o,n)),e.forEach(e=>{p.push(i({geometry:{type:"LineString",coordinates:e}},o,n))})})}}let m={Point:1,MultiPoint:2,LineString:2,MultiLineString:3,Polygon:3,MultiPolygon:4};function y(){return{points:{},lines:{},polygons:{},polygonsOutline:{}}}function _(e){return e.geometry.coordinates}let P=["points","linestrings","polygons"],C={...u(p.circle),...u(p.icon),...u(p.text),...u(f),...u(d),stroked:!0,filled:!0,extruded:!1,wireframe:!1,_full3d:!1,iconAtlas:{type:"object",value:null},iconMapping:{type:"object",value:{}},getIcon:{type:"accessor",value:e=>e.properties.icon},getText:{type:"accessor",value:e=>e.properties.text},pointType:"circle",getRadius:{deprecatedFor:"getPointRadius"}};class b extends o.A{initializeState(){this.state={layerProps:{},features:{},featuresDiff:{}}}updateState({props:e,changeFlags:t}){if(!t.dataChanged)return;let{data:i}=this.props,o=i&&"points"in i&&"polygons"in i&&"lines"in i;this.setState({binary:o}),o?this._updateStateBinary({props:e,changeFlags:t}):this._updateStateJSON({props:e,changeFlags:t})}_updateStateBinary({props:e,changeFlags:t}){let i=function(e){let t=y(),{points:i,lines:o,polygons:n}=e,s=function(e){let t={points:null,lines:null,polygons:null};for(let i in t){let o=e[i].globalFeatureIds.value;t[i]=new Uint32Array(o)}return t}(e);t.points.data={length:i.positions.value.length/i.positions.size,attributes:{...i.attributes,getPosition:i.positions,rowIndexes:{size:1,type:"uint32",value:s.points}},properties:i.properties,numericProps:i.numericProps,featureIds:i.featureIds},t.lines.data={length:o.pathIndices.value.length-1,startIndices:o.pathIndices.value,attributes:{...o.attributes,getPath:o.positions,rowIndexes:{size:1,type:"uint32",value:s.lines}},properties:o.properties,numericProps:o.numericProps,featureIds:o.featureIds},t.lines._pathType="open";let r=Array(n.positions.value.length/n.positions.size).fill(1);for(let e of n.primitivePolygonIndices.value)r[e-1]=0;return t.polygons.data={length:n.polygonIndices.value.length-1,startIndices:n.polygonIndices.value,attributes:{...n.attributes,getPolygon:n.positions,instanceVertexValid:{size:1,value:new Uint16Array(r)},rowIndexes:{size:1,type:"uint32",value:s.polygons}},properties:n.properties,numericProps:n.numericProps,featureIds:n.featureIds},t.polygons._normalize=!1,n.triangles&&(t.polygons.data.attributes.indices=n.triangles.value),t.polygonsOutline.data={length:n.primitivePolygonIndices.value.length-1,startIndices:n.primitivePolygonIndices.value,attributes:{...n.attributes,getPath:n.positions,rowIndexes:{size:1,type:"uint32",value:s.polygons}},properties:n.properties,numericProps:n.numericProps,featureIds:n.featureIds},t.polygonsOutline._pathType="open",t}(e.data);this.setState({layerProps:i})}_updateStateJSON({props:e,changeFlags:t}){let i=function(e){if(Array.isArray(e))return e;switch(h.A.assert(e.type,"GeoJSON does not have type"),e.type){case"Feature":return[e];case"FeatureCollection":return h.A.assert(Array.isArray(e.features),"GeoJSON does not have features array"),e.features;default:return[{geometry:e}]}}(e.data),o=this.getSubLayerRow.bind(this),s={},r={};if(Array.isArray(t.dataChanged)){let e=this.state.features;for(let t in e)s[t]=e[t].slice(),r[t]=[];for(let a of t.dataChanged){let t=x(i,o,a);for(let i in e)r[i].push((0,n.J)({data:s[i],getIndex:e=>e.__source.index,dataRange:a,replace:t[i]}))}}else s=x(i,o);let a=function(e,t){let i=y(),{pointFeatures:o,lineFeatures:n,polygonFeatures:s,polygonOutlineFeatures:r}=e;return i.points.data=o,i.points._dataDiff=t.pointFeatures&&(()=>t.pointFeatures),i.points.getPosition=_,i.lines.data=n,i.lines._dataDiff=t.lineFeatures&&(()=>t.lineFeatures),i.lines.getPath=_,i.polygons.data=s,i.polygons._dataDiff=t.polygonFeatures&&(()=>t.polygonFeatures),i.polygons.getPolygon=_,i.polygonsOutline.data=r,i.polygonsOutline._dataDiff=t.polygonOutlineFeatures&&(()=>t.polygonOutlineFeatures),i.polygonsOutline.getPath=_,i}(s,r);this.setState({features:s,featuresDiff:r,layerProps:a})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i,sourceLayer:o}=t;return t.featureType=P.find(e=>o.id.startsWith(`${this.id}-${e}-`)),i>=0&&o.id.startsWith(`${this.id}-points-text`)&&this.state.binary&&(t.index=this.props.data.points.globalFeatureIds.value[i]),t}_updateAutoHighlight(e){let t=`${this.id}-points-`,i="points"===e.featureType;for(let o of this.getSubLayers())o.id.startsWith(t)===i&&o.updateAutoHighlight(e)}_renderPolygonLayer(){let{extruded:e,wireframe:t}=this.props,{layerProps:i}=this.state,o="polygons-fill",n=this.shouldRenderSubLayer(o,i.polygons?.data)&&this.getSubLayerClass(o,d.type);if(n){let s=g(this,d.props,"getPolygon"),r=e&&t;return r||delete s.getLineColor,s.updateTriggers.lineColors=r,new n(s,this.getSubLayerProps({id:o,updateTriggers:s.updateTriggers}),i.polygons)}return null}_renderLineLayers(){let{extruded:e,stroked:t}=this.props,{layerProps:i}=this.state,o="polygons-stroke",n="linestrings",s=!e&&t&&this.shouldRenderSubLayer(o,i.polygonsOutline?.data)&&this.getSubLayerClass(o,f.type),r=this.shouldRenderSubLayer(n,i.lines?.data)&&this.getSubLayerClass(n,f.type);if(s||r){let e=g(this,f.props,"getPath");return[s&&new s(e,this.getSubLayerProps({id:o,updateTriggers:e.updateTriggers}),i.polygonsOutline),r&&new r(e,this.getSubLayerProps({id:n,updateTriggers:e.updateTriggers}),i.lines)]}return null}_renderPointLayers(){let{pointType:e}=this.props,{layerProps:t,binary:i}=this.state,{highlightedObjectIndex:o}=this.props;!i&&Number.isFinite(o)&&(o=t.points.data.findIndex(e=>e.__source.index===o));let n=new Set(e.split("+")),s=[];for(let e of n){let n=`points-${e}`,r=p[e],a=r&&this.shouldRenderSubLayer(n,t.points?.data)&&this.getSubLayerClass(n,r.type);if(a){let l=g(this,r.props),c=t.points;if("text"===e&&i){let{rowIndexes:e,...t}=c.data.attributes;c={...c,data:{...c.data,attributes:t}}}s.push(new a(l,this.getSubLayerProps({id:n,updateTriggers:l.updateTriggers,highlightedObjectIndex:o}),c))}}return s}renderLayers(){let{extruded:e}=this.props,t=this._renderPolygonLayer();return[!e&&t,this._renderLineLayers(),this._renderPointLayers(),e&&t]}getSubLayerAccessor(e){let{binary:t}=this.state;return t&&"function"==typeof e?(t,i)=>{let{data:o,index:n}=i;return e(function(e,t){if(!e)return null;let i="startIndices"in e?e.startIndices[t]:t,o=e.featureIds.value[i];return -1!==i?function(e,t,i){let o={properties:{...e.properties[t]}};for(let t in e.numericProps)o.properties[t]=e.numericProps[t].value[i];return o}(e,o,i):null}(o,n),i)}:super.getSubLayerAccessor(e)}}b.layerName="GeoJsonLayer",b.defaultProps=C;let L=b},86982(e,t,i){i.d(t,{A:()=>R});var o=i(66260),n=i(84175),s=i(46487),r=i(19754),a=i(60608),l=i(9350),c=i(88599),p=i(68996),f=i(3770),d=i(62459),u=i(25337);let g=`\
layout(std140) uniform iconUniforms {
  float sizeScale;
  vec2 iconsTextureDim;
  float sizeBasis;
  float sizeMinPixels;
  float sizeMaxPixels;
  bool billboard;
  highp int sizeUnits;
  float alphaCutoff;
  highp uint rowIndexOffset;
} icon;
`,h={name:"icon",vs:g,fs:g,uniformTypes:{sizeScale:"f32",iconsTextureDim:"vec2<f32>",sizeBasis:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",billboard:"f32",sizeUnits:"i32",alphaCutoff:"f32",rowIndexOffset:"u32"}},x=`\
#version 300 es
#define SHADER_NAME icon-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceSizes;
in float instanceAngles;
in vec4 instanceColors;
#ifdef USE_ROW_INDEXES
in float rowIndexes;
#endif
in vec4 instanceIconFrames;
in float instanceColorModes;
in vec2 instanceOffsets;
in vec2 instancePixelOffset;
out float vColorMode;
out vec4 vColor;
out vec2 vTextureCoords;
out vec2 uv;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = angle * PI / 180.0;
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
#ifdef USE_ROW_INDEXES
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
#else
geometry.pickingColor = picking_getPickingColorFromIndex(uint(gl_InstanceID) + icon.rowIndexOffset);
#endif
uv = positions;
vec2 iconSize = instanceIconFrames.zw;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * icon.sizeScale, icon.sizeUnits),
icon.sizeMinPixels, icon.sizeMaxPixels
);
float iconConstraint = icon.sizeBasis == 0.0 ? iconSize.x : iconSize.y;
float instanceScale = iconConstraint == 0.0 ? 0.0 : sizePixels / iconConstraint;
vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
pixelOffset += instancePixelOffset;
pixelOffset.y *= -1.0;
if (icon.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
gl_Position = project_globe_billboard_clipspace(gl_Position, geometry.position.xyz);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
if (project_globe_is_occluded(geometry.position.xyz)) {
gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
DECKGL_FILTER_SIZE(offset_common, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vTextureCoords = mix(
instanceIconFrames.xy,
instanceIconFrames.xy + iconSize,
(positions.xy + 1.0) / 2.0
) / icon.iconsTextureDim;
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
vColorMode = instanceColorModes;
}
`,v=`\
#version 300 es
#define SHADER_NAME icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in float vColorMode;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
vec4 texColor = texture(iconsTexture, vTextureCoords);
vec3 color = mix(texColor.rgb, vColor.rgb, vColorMode);
float a = texColor.a * layer.opacity * vColor.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color, a);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,m=`\
struct IconUniforms {
  sizeScale: f32,
  iconsTextureDim: vec2<f32>,
  sizeBasis: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  billboard: i32,
  sizeUnits: i32,
  alphaCutoff: f32,
  rowIndexOffset: u32
};

@group(0) @binding(auto) var<uniform> icon: IconUniforms;
@group(0) @binding(auto) var iconsTexture : texture_2d<f32>;
@group(0) @binding(auto) var iconsTextureSampler : sampler;

fn rotate_by_angle(vertex: vec2<f32>, angle_deg: f32) -> vec2<f32> {
  let angle_radian = angle_deg * PI / 180.0;
  let c = cos(angle_radian);
  let s = sin(angle_radian);
  let rotation = mat2x2<f32>(vec2<f32>(c, s), vec2<f32>(-s, c));
  return rotation * vertex;
}

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @location(0) positions: vec2<f32>,

  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceSizes: f32,
  @location(4) instanceAngles: f32,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instanceIconFrames: vec4<f32>,
  @location(7) instanceColorModes: f32,
  @location(8) instanceOffsets: vec2<f32>,
  @location(9) instancePixelOffset: vec2<f32>,
  PICKING_COLOR_ATTRIBUTE
};

struct Varyings {
  @builtin(position) position: vec4<f32>,

  @location(0) vColorMode: f32,
  @location(1) vColor: vec4<f32>,
  @location(2) vTextureCoords: vec2<f32>,
  @location(3) uv: vec2<f32>,
  @location(4) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(inp: Attributes) -> Varyings {
  // write geometry fields used by filters + FS
  geometry.worldPosition = inp.instancePositions;
  geometry.uv = inp.positions;
  geometry.pickingColor = PICKING_COLOR_VALUE;

  var outp: Varyings;
  outp.uv = inp.positions;

  let iconSize = inp.instanceIconFrames.zw;

  // convert size in meters to pixels, then clamp
  let sizePixels = clamp(
    project_unit_size_to_pixel(inp.instanceSizes * icon.sizeScale, icon.sizeUnits),
    icon.sizeMinPixels, icon.sizeMaxPixels
  );

  // scale icon height to match instanceSize
  let iconConstraint = select(iconSize.y, iconSize.x, icon.sizeBasis == 0.0);
  let instanceScale = select(sizePixels / iconConstraint, 0.0, iconConstraint == 0.0);

  // scale and rotate vertex in "pixel" units; then add per-instance pixel offset
  var pixelOffset = inp.positions / 2.0 * iconSize + inp.instanceOffsets;
  pixelOffset = rotate_by_angle(pixelOffset, inp.instanceAngles) * instanceScale;
  pixelOffset = pixelOffset + inp.instancePixelOffset;
  pixelOffset.y = pixelOffset.y * -1.0;

  if (icon.billboard != 0) {
    let anchorCommon = project_position_vec3_f64(inp.instancePositions, inp.instancePositions64Low);
    geometry.position = vec4<f32>(anchorCommon, 1.0);
    var pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0)); // TODO, &geometry.position);
    pos = project_globe_billboard_clipspace(pos, anchorCommon);
    // DECKGL_FILTER_GL_POSITION(pos, geometry);

    var offset = vec3<f32>(pixelOffset, 0.0);
    DECKGL_FILTER_SIZE(&offset, geometry);
    let clipOffset = project_pixel_size_to_clipspace(offset.xy);
    pos = vec4<f32>(pos.x + clipOffset.x, pos.y + clipOffset.y, pos.z, pos.w);
    // Hide icons whose anchor is behind the globe; culling handles non-billboard icons
    if (project_globe_is_occluded(anchorCommon)) {
      pos = vec4<f32>(0.0, 0.0, 2.0, 1.0);
    }
    outp.position = pos;
  } else {
    var offset_common = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    DECKGL_FILTER_SIZE(&offset_common, geometry);
    let projected = project_position_to_clipspace_and_commonspace(inp.instancePositions, inp.instancePositions64Low, offset_common);
    geometry.position = projected.commonPosition;
    var pos = projected.clipPosition;
    // DECKGL_FILTER_GL_POSITION(pos, geometry);
    outp.position = pos;
  }

  let uvMix = (inp.positions.xy + vec2<f32>(1.0, 1.0)) * 0.5;
  outp.vTextureCoords = mix(inp.instanceIconFrames.xy, inp.instanceIconFrames.xy + iconSize, uvMix) / icon.iconsTextureDim;

  outp.vColor = inp.instanceColors;
  // DECKGL_FILTER_COLOR(outp.vColor, geometry);

  outp.vColorMode = inp.instanceColorModes;
  outp.pickingColor = geometry.pickingColor;

  DECKGL_FILTER_GL_POSITION(&outp.position, geometry);

  return outp;
}

@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  // expose to deck.gl filter injection targets
  geometry.uv = inp.uv;
  fragmentGeometry.uv = geometry.uv;

  let texColor = textureSample(iconsTexture, iconsTextureSampler, inp.vTextureCoords);

  // if colorMode == 0, use pixel color from the texture
  // if colorMode == 1 (or picking), use texture as transparency mask
  let rgb = mix(texColor.rgb, inp.vColor.rgb, inp.vColorMode);
  let a = texColor.a * layer.opacity * inp.vColor.a;

  if (a < icon.alphaCutoff) {
    discard;
  }

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    var extensionColor = vec4<f32>(inp.pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  var fragColor = vec4<f32>(rgb, a);

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inp.pickingColor - highlightedObjectColor))) {
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

  DECKGL_FILTER_COLOR(&fragColor, fragmentGeometry);
  return deckgl_premultiplied_alpha(fragColor);
}
`;var y=i(58682),_=i(53439);let P=()=>{},C={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},b={x:0,y:0,width:0,height:0};function L(e){return e&&(e.id||e.url)}function S(e){let{device:t}=e;"webgl"===t.type?e.generateMipmapsWebGL():"webgpu"===t.type&&t.generateMipmapsWebGPU(e)}function w(e,t,i){for(let o=0;o<t.length;o++){let{icon:n,xOffset:s}=t[o];e[L(n)]={...n,x:s,y:i}}}class A{constructor(e,{onUpdate:t=P,onError:i=P}){this._loadOptions=null,this._texture=null,this._externalTexture=null,this._mapping={},this._samplerParameters=null,this._pendingCount=0,this._autoPacking=!1,this._xOffset=0,this._yOffset=0,this._rowHeight=0,this._buffer=4,this._canvasWidth=1024,this._canvasHeight=0,this._canvas=null,this.device=e,this.onUpdate=t,this.onError=i}finalize(){this._texture?.delete(),this._texture=null}getTexture(){return this._texture||this._externalTexture}getIconMapping(e){let t=this._autoPacking?L(e):e;return this._mapping[t]||b}setProps({loadOptions:e,autoPacking:t,iconAtlas:i,iconMapping:o,textureParameters:n}){e&&(this._loadOptions=e),void 0!==t&&(this._autoPacking=t),o&&(this._mapping=o),i&&(this._texture?.delete(),this._texture=null,this._externalTexture=i),n&&(this._samplerParameters=n)}get isLoaded(){return 0===this._pendingCount}packIcons(e,t){if(!this._autoPacking||"u"<typeof document)return;let i=Object.values(function(e,t,i){if(!e||!t)return null;i=i||{};let o={},{iterable:n,objectInfo:s}=(0,_.X)(e);for(let e of n){s.index++;let n=t(e,s),r=L(n);if(!n)throw Error("Icon is missing.");if(!n.url)throw Error("Icon url is missing.");o[r]||i[r]&&n.url===i[r].url||(o[r]={...n,source:e,sourceIndex:s.index})}return o}(e,t,this._mapping)||{});if(i.length>0){let{mapping:e,xOffset:t,yOffset:o,rowHeight:n,canvasHeight:s}=function({icons:e,buffer:t,mapping:i={},xOffset:o=0,yOffset:n=0,rowHeight:s=0,canvasWidth:r}){let a=[];for(let l=0;l<e.length;l++){let c=e[l];if(!i[L(c)]){let{height:e,width:l}=c;o+l+t>r&&(w(i,a,n),o=0,n=s+n+t,s=0,a=[]),a.push({icon:c,xOffset:o}),o=o+l+t,s=Math.max(s,e)}}return a.length>0&&w(i,a,n),{mapping:i,rowHeight:s,xOffset:o,yOffset:n,canvasWidth:r,canvasHeight:Math.pow(2,Math.ceil(Math.log2(s+n+t)))}}({icons:i,buffer:this._buffer,canvasWidth:this._canvasWidth,mapping:this._mapping,rowHeight:this._rowHeight,xOffset:this._xOffset,yOffset:this._yOffset});this._rowHeight=n,this._mapping=e,this._xOffset=t,this._yOffset=o,this._canvasHeight=s,this._texture||(this._texture=this.device.createTexture({format:"rgba8unorm",data:null,width:this._canvasWidth,height:this._canvasHeight,sampler:this._samplerParameters||C,mipLevels:this.device.getMipLevelCount(this._canvasWidth,this._canvasHeight)})),this._texture.height!==this._canvasHeight&&(this._texture=function(e,t,i,o){let{width:n,height:s,device:r}=e,a=r.createTexture({format:"rgba8unorm",width:t,height:i,sampler:o,mipLevels:r.getMipLevelCount(t,i)}),l=r.createCommandEncoder();l.copyTextureToTexture({sourceTexture:e,destinationTexture:a,width:n,height:s});let c=l.finish();return r.submit(c),S(a),e.destroy(),a}(this._texture,this._canvasWidth,this._canvasHeight,this._samplerParameters||C)),this.onUpdate(!0),this._canvas=this._canvas||document.createElement("canvas"),this._loadIcons(i)}}_loadIcons(e){let t=this._canvas.getContext("2d",{willReadFrequently:!0});for(let i of e)this._pendingCount++,(0,y.H)(i.url,this._loadOptions).then(e=>{let o=L(i),n=this._mapping[o],{x:s,y:r,width:a,height:l}=n,{image:c,width:p,height:f}=function(e,t,i,o){let n=Math.min(i/t.width,o/t.height),s=Math.floor(t.width*n),r=Math.floor(t.height*n);return 1===n?{image:t,width:s,height:r}:(e.canvas.height=r,e.canvas.width=s,e.clearRect(0,0,s,r),e.drawImage(t,0,0,t.width,t.height,0,0,s,r),{image:e.canvas,width:s,height:r})}(t,e,a,l),d=s+(a-p)/2,u=r+(l-f)/2;this._texture?.copyExternalImage({image:c,x:d,y:u,width:p,height:f}),n.x=d,n.y=u,n.width=p,n.height=f,this._texture&&S(this._texture),this.onUpdate(p!==a||f!==l)}).catch(e=>{this.onError({url:i.url,source:i.source,sourceIndex:i.sourceIndex,loadOptions:this._loadOptions,error:e})}).finally(()=>{this._pendingCount--})}}let I=[0,0,0,255],z={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},sizes:{attribute:"instanceSizes",accessor:"getSize",semantic:"scalar",size:1,defaultValue:1},colors:{attribute:"instanceColors",accessor:"getColor",semantic:"color",size:4},angles:{attribute:"instanceAngles",accessor:"getAngle",semantic:"scalar",size:1},pixelOffsets:{attribute:"instancePixelOffset",accessor:"getPixelOffset",semantic:"vector",size:2},iconOffset:{attribute:"instanceOffsets",accessor:"iconOffset",semantic:"vector",size:2,prop:!1},iconFrame:{attribute:"instanceIconFrames",accessor:"iconFrame",semantic:"vector",size:4,prop:!1},iconMask:{attribute:"instanceColorModes",accessor:"iconMask",semantic:"vector",size:1,prop:!1}},O={positions:{type:"object",value:null,optional:!0},sizes:{type:"object",value:null,optional:!0},colors:{type:"object",value:null,optional:!0},angles:{type:"object",value:null,optional:!0},pixelOffsets:{type:"object",value:null,optional:!0},iconAtlas:{type:"image",value:null,async:!0},iconMapping:{type:"object",value:{},async:!0},sizeScale:{type:"number",value:1,min:0},billboard:!0,sizeUnits:"pixels",sizeBasis:"height",sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},alphaCutoff:{type:"number",value:.05,min:0,max:1},getPosition:{type:"accessor",value:e=>e.position},getIcon:{type:"accessor",value:e=>e.icon},getColor:{type:"accessor",value:I},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},onIconError:{type:"function",value:null,optional:!0},textureParameters:{type:"object",ignore:!0,value:null}};class E extends o.A{getShaders(){let e=!!this.props.data?.attributes?.rowIndexes;return super.getShaders({vs:x,fs:v,source:function(e,t=!1){return(t?m.replace("@location(0) positions: vec2<f32>,","@builtin(vertex_index) vertexIndex: u32,").replace("  // write geometry fields",`  let quad = array(vec2<f32>(-1, 1), vec2<f32>(1, 1), vec2<f32>(-1, -1), vec2<f32>(1, -1));
  let quadPosition = quad[inp.vertexIndex];
  // write geometry fields`).replaceAll("inp.positions","quadPosition"):m).replace("PICKING_COLOR_ATTRIBUTE",e?"@location(10) rowIndexes: u32,":"").replace("PICKING_COLOR_VALUE",e?"picking_getPickingColorFromIndex(inp.rowIndexes)":"picking_getPickingColorFromIndex(inp.instanceIndex + icon.rowIndexOffset)")}(e,!!this.state?.columns),defines:e?{USE_ROW_INDEXES:!0}:{},modules:[n.A,s.A,r.Ay,h]})}initializeState(){this.state={iconManager:new A(this.context.device,{onUpdate:this._onUpdate.bind(this),onError:this._onError.bind(this)})},this._initializeAttributes()}_initializeAttributes(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,bufferGroup:"icon-instance-data",accessor:"getSize",defaultValue:1},instanceIconDefs:{size:7,bufferGroup:"icon-instance-data",accessor:"getIcon",transform:this.getInstanceIconDef,shaderAttributes:{instanceOffsets:{size:2,elementOffset:0},instanceIconFrames:{size:4,elementOffset:2},instanceColorModes:{size:1,elementOffset:6}}},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,bufferGroup:"icon-instance-data",accessor:"getColor",defaultValue:I},instanceAngles:{size:1,transition:!0,bufferGroup:"icon-instance-data",accessor:"getAngle"},instancePixelOffset:{size:2,transition:!0,bufferGroup:"icon-instance-data",accessor:"getPixelOffset"},...this.props.data?.attributes?.rowIndexes?{rowIndexes:{size:1,type:"uint32",noAlloc:!0}}:{}})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,n=this.getAttributeManager(),{iconAtlas:s,iconMapping:r,data:a,getIcon:l,textureParameters:c}=t,{iconManager:p}=this.state;if("string"==typeof s)return;let f=s||this.internalState.isAsyncPropLoading("iconAtlas");p.setProps({loadOptions:t.loadOptions,autoPacking:!f,iconAtlas:s,iconMapping:f?r:null,textureParameters:c}),f?i.iconMapping!==t.iconMapping&&n?.invalidate("getIcon"):(o.dataChanged||t.iconAtlas!==i.iconAtlas||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getIcon))&&p.packIcons(a,l),!this._updateColumnState(e)&&o.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}_updateColumnState(e){return Object.entries(z).some(([t,i])=>!1!==i.prop&&e.props[t])?(this._updateColumns(e),!0):!!this.state.columns&&(this._destroyColumns(),this.internalState.attributeManager=super._getAttributeManager(),this._initializeAttributes(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll(),!0)}_updateColumns(e){let{props:t,oldProps:i,changeFlags:o}=e;if(t.extensions.length||Object.keys(t.transitions||{}).length)throw Error("Icon Arrow columns do not support extensions or transitions");let n=!!t.data?.attributes?.rowIndexes;if(!this.state.columns||!!i.data?.attributes?.rowIndexes!==n){this._destroyColumns(),this.state.model?.destroy(),this.state.model=void 0,this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null;let e=new a.h(this.context.device,z,"Icon",!0);this.state.columns=e;let i="webgl"===this.context.device.type?(0,f.M)(this.context.device,this._getGeometry()):void 0;this.state.arrowGeometry=i,this.state.arrowModel=new d.X(this.context.device,{...this.getShaders(),id:t.id,...i?{geometry:i}:{topology:"triangle-strip",vertexCount:4},bufferLayout:e.getBufferLayouts(n),isInstanced:!0,inferDrawCount:"instance"})}let s=(e,i)=>this.getInstanceIconDef(t.getIcon(e,i)),r={iconOffset:(e,t)=>s(e,t).slice(0,2),iconFrame:(e,t)=>s(e,t).slice(2,6),iconMask:(e,t)=>s(e,t)[6]};this.state.columns.updateIfNeeded({props:Object.assign(Object.create(t),r),oldProps:Object.assign(Object.create(i),r),changeFlags:{...o,dataChanged:o.dataChanged||(!!this.state.iconDefinitionsDirty||t.iconMapping!==i.iconMapping)&&"icon definitions changed"}},{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:e=>this.raiseError(e,"converting Arrow columns"),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!0}}),this.state.iconDefinitionsDirty=!1}_destroyColumns(){this.state.columns?.destroy(),this.state.arrowModel?.destroy(),this.state.arrowGeometry?.destroy(),this.state.columns=void 0,this.state.arrowModel=void 0,this.state.arrowGeometry=void 0}getModels(){return this.state?.arrowModel?[this.state.arrowModel]:super.getModels()}getBounds(){return this.state?.columns?this.state.columns.getBounds():super.getBounds()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}get isLoaded(){return super.isLoaded&&this.state.iconManager.isLoaded&&!this.state.columns?.loading}finalizeState(e){this._destroyColumns(),super.finalizeState(e),this.state.iconManager.finalize()}draw({uniforms:e}){this._drawModel(this.state.arrowModel??this.state.model)}_drawModel(e){let{sizeScale:t,sizeBasis:i,sizeMinPixels:o,sizeMaxPixels:n,sizeUnits:s,billboard:r,alphaCutoff:a}=this.props,{iconManager:c}=this.state,p=c.getTexture();if(p){let c={rowIndexOffset:0,iconsTexture:p,iconsTextureDim:[p.width,p.height],sizeUnits:l.p5[s],sizeScale:t,sizeBasis:+("height"===i),sizeMinPixels:o,sizeMaxPixels:n,billboard:r,alphaCutoff:a};e.shaderInputs.setProps({icon:c}),this.state.columns?this.state.columns.draw(e,this.context.renderPass,t=>{e.setInstanceCount(Math.min(e.instanceCount,Math.max(0,this.getNumInstances()-t))),e.shaderInputs.setProps({icon:{rowIndexOffset:t}})}):e.draw(this.context.renderPass)}}_getGeometry(){return new u.V2({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([-1,1,1,1,-1,-1,1,-1])}}})}_getModel(e=this.props.id){return new c.A(this.context.device,{...this.getShaders(),id:e,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:this._getGeometry(),isInstanced:!0})}_onUpdate(e){e?(this.state.iconDefinitionsDirty=!0,this.getAttributeManager()?.invalidate("getIcon"),this.setNeedsUpdate()):this.setNeedsRedraw()}_onError(e){let t=this.getCurrentLayer()?.props.onIconError;t?t(e):p.A.error(e.error.message)()}getInstanceIconDef(e){let{x:t,y:i,width:o,height:n,mask:s,anchorX:r=o/2,anchorY:a=n/2}=this.state.iconManager.getIconMapping(e);return[o/2-r,n/2-a,t,i,o,n,+!!s]}}E.defaultProps=O,E.layerName="IconLayer";let R=E},48314(e,t,i){i.d(t,{A:()=>O});var o=i(66260),n=i(3984),s=i(84175),r=i(46487),a=i(19754),l=i(91349),c=i(78374),p=i(52948),f=i(7914),d=i(9350),u=i(88599),g=i(25337),h=i(44941),x=i(12116),v=i(65441);function m(e,t,i,o){let n;if(Array.isArray(e[0])){n=Array(e.length*t);for(let i=0;i<e.length;i++)for(let o=0;o<t;o++)n[i*t+o]=e[i][o]||0}else n=e;return i?(0,x.M)(n,{size:t,gridResolution:i}):o?(0,v.I)(n,{size:t}):n}var y=i(40961);class _ extends h.A{constructor(e){super({...e,attributes:{positions:{size:3,padding:18,initialize:!0,type:e.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:e.isWebGPU?Float32Array:Uint8ClampedArray}}})}get(e){return this.attributes[e]}getPathSegmentIndices(e){let t=this.attributes.segmentTypes,i=this.vertexStarts[e],o=Math.min(this.vertexStarts[e+1]??this.instanceCount,this.instanceCount),n=[];for(let e=i;e<o-1;e++)(4&t[e])==0&&n.push(e);return n.length&&(4&t[i])!=0&&n.unshift(n.pop()),n}getGeometryFromBuffer(e){return this.normalize||this.opts.transform||this.opts.isWebGPU?super.getGeometryFromBuffer(e):null}prepareGeometry(e){let t=this.normalize?m(e,this.inputPositionSize,this.opts.resolution,this.opts.wrapLongitude):e,{projectionTolerance:i,projectionToleranceScale:o,transform:n}=this.opts;if(!i)return t;if(!this.normalize||!n)throw Error("Projection refinement requires normalized, preprojected paths");let s=o||[1,1,1],r=e=>(0,y.A)(e,{size:this.inputPositionSize,targetSize:3,transform:e=>n(Array.from(e)).map((e,t)=>e*s[t]),tolerance:i}).sourcePositions;return P(t)?t.map(r):r(t)}normalizeGeometry(e){return this.normalize&&!this.opts.transform?m(e,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):e}getGeometrySize(e){if(P(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}let t=this.getPathLength(e);return t<2?0:this.isClosed(e)?t<3?0:t+2:t}updateGeometryAttributes(e,t){if(0!==t.geometrySize)if(e&&P(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e}else this._updateSegmentTypes(e,t),this._updatePositions(e,t)}_updateSegmentTypes(e,t){let i=this.attributes.segmentTypes,o=!!e&&this.isClosed(e),{vertexStart:n,geometrySize:s}=t;i.fill(0,n,n+s),o?(i[n]=4,i[n+s-2]=4):(i[n]+=1,i[n+s-2]+=2),i[n+s-1]=4}_updatePositions(e,t){let{positions:i}=this.attributes;if(!i||!e)return;let{vertexStart:o,geometrySize:n}=t,s=[,,,];for(let t=o,r=0;r<n;t++,r++)this.getPointOnPath(e,r,s),i[3*t]=s[0],i[3*t+1]=s[1],i[3*t+2]=s[2]}getPathLength(e){return e.length/this.positionSize}getPointOnPath(e,t,i=[]){let{positionSize:o}=this;t*o>=e.length&&(t+=1-e.length/o);let n=t*o;return i[0]=e[n],i[1]=e[n+1],i[2]=3===o&&e[n+2]||0,i}isClosed(e){if(!this.normalize)return!!this.opts.loop;let{positionSize:t}=this,i=e.length-t;return e[0]===e[i]&&e[1]===e[i+1]&&(2===t||e[2]===e[i+2])}}function P(e){return Array.isArray(e[0])}var C=i(6053);let b=`\
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
`,L=`\
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
`,S=[0,0,0,255],w={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},antialiasing:!1,billboard:!1,_pathType:null,_projectionTolerance:{type:"number",value:0,min:0},_projectionNoCut:!1,getPath:{type:"accessor",value:e=>e.path},getColor:{type:"accessor",value:S},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},A={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};function I(e,t){return e===t||!!(e&&t&&e.length===t.length&&e.every((e,i)=>e===t[i]))}class z extends o.A{getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:b,fs:L,source:n.TX,plugins:"webgpu"===this.context.device.type?[n.Cq]:[],defines:e?{ANTIALIASING:1}:{},modules:[s.A,r.A,a.Ay,l.B]})}get wrapLongitude(){return!1}getBounds(){return"webgpu"===this.context.device.type?null:this.getAttributeManager()?.getBounds(["vertexPositions"])}getPathProjectionScale(e){let t=this.props.coordinateSystem;if(!this.getAttributeManager()?.getAttributes().instanceDashOffsets)return null;if(e instanceof c.A&&e.zoom>=12&&"meter-offsets"!==t&&"lnglat-offsets"!==t){let i=p.A.getUniforms({viewport:e,coordinateSystem:t,sourceCrs:this.internalState.sourceCrs,coordinateOrigin:this.props.coordinateOrigin,autoWrapLongitude:this.wrapLongitude});return[e.projectionMode,i.coordinateOrigin[1],i.commonOrigin[1],...i.commonUnitsPerWorldUnit,...i.commonUnitsPerWorldUnit2,i.commonUnitsPerMeter[2]]}let i=function(e){if(e.isGeospatial)return null;let{unitsPerMeter:t}=e.distanceScales;return[t[0],t[1],t[2]]}(e);return i?[e.projectionMode,...i]:[e.projectionMode]}shouldUpdateState(e){let{viewport:t}=this.context;return super.shouldUpdateState(e)||this.state?.subdivisionStep!==this.getSubdivisionStep()||!I(this.state?.pathProjectionScale,this.getPathProjectionScale(t))}initializeState(){let e="webgpu"===this.context.device.type;this.getAttributeManager().addInstanced({...e?{pathPositions:{...this.usePositionTransforms(),size:24,type:"float32",transition:!1,accessor:"getPath",update:this.calculateWebGPUPositions,shaderAttributes:{instanceLeftPositions:{size:3,elementOffset:0},instanceStartPositions:{size:3,elementOffset:3},instanceEndPositions:{size:3,elementOffset:6},instanceRightPositions:{size:3,elementOffset:9},instanceLeftPositions64Low:{size:3,elementOffset:12},instanceStartPositions64Low:{size:3,elementOffset:15},instanceEndPositions64Low:{size:3,elementOffset:18},instanceRightPositions64Low:{size:3,elementOffset:21}},noAlloc:!0}}:{vertexPositions:{...this.usePositionTransforms(),size:3,vertexOffset:1,type:"float64",fp64:this.use64bitPositions(),transition:A,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}}},instanceTypes:{size:1,type:e?"float32":"uint8",update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{transform:null,size:1,accessor:"getWidth",transition:!e&&A,defaultValue:1,bufferGroup:"path-instance-data"},instanceColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",accessor:"getColor",transition:!e&&A,defaultValue:S,bufferGroup:"path-instance-data"},rowIndexes:{size:1,type:"uint32",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"path-instance-data"}}),this.setState({pathTesselator:new _({fp64:this.use64bitPositions(),isWebGPU:e}),subdivisionStep:this.getSubdivisionStep(),pathProjectionScale:this.getPathProjectionScale(this.context.viewport)})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,n=this.getAttributeManager(),s=n.attributes;s.instanceStrokeWidths.settings.transform=t._projectionTolerance?E:null,s.instanceColors.settings.transform=t._projectionTolerance?R:null;let{viewport:r}=this.context,a=this.state.subdivisionStep!==this.getSubdivisionStep(),l=this.getPathProjectionScale(r),c=!I(this.state.pathProjectionScale,l),p=o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getPath),d=o.projectionChanged||this.state.preproject&&(!(0,f.b)(t.modelMatrix,i.modelMatrix,1)||!(0,f.b)(t.coordinateOrigin,i.coordinateOrigin,1))||p||t._projectionTolerance!==i._projectionTolerance||t._projectionNoCut!==i._projectionNoCut||t._pathType!==i._pathType||t.positionFormat!==i.positionFormat||t.wrapLongitude!==i.wrapLongitude||a;if(o.dataChanged||d){let{pathTesselator:e}=this.state,i=t.data.attributes||{},s=(0,C.A)(this.state.packedCrs);if(t._projectionTolerance&&(!s||!this.usePositionTransforms().transform||t._pathType||i.getPath&&!ArrayBuffer.isView(i.getPath.value??i.getPath)||Object.keys(i).some(e=>"getPath"!==e)))throw Error("Projection refinement requires linear target units, normalized paths and per-object attributes");e.updateGeometry({data:t.data,geometryBuffer:i.getPath,buffers:i,normalize:!t._pathType,loop:"loop"===t._pathType,getGeometry:t.getPath,transform:this.usePositionTransforms().transform?.bind(this),positionFormat:t.positionFormat,wrapLongitude:t.wrapLongitude&&!this.state.preproject&&this.state.sourceCrs?.signature==="WGS84",resolution:t._projectionNoCut?0:this.getSubdivisionStep(),projectionTolerance:t._projectionTolerance,projectionToleranceScale:s??void 0,dataChanged:d?void 0:o.dataChanged}),this.setState({numInstances:e.instanceCount,startIndices:e.vertexStarts,subdivisionStep:this.getSubdivisionStep(),pathProjectionScale:l}),!o.dataChanged||d?n.invalidateAll():c&&n.invalidate("instanceDashOffsets")}else c&&(this.setState({pathProjectionScale:l}),n.invalidate("instanceDashOffsets"));(o.extensionsChanged||t.antialiasing!==i.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),n.invalidateAll())}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,o=this.props.data;return o[0]&&o[0].__source&&(t.object=o.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{jointRounded:t,capRounded:i,billboard:o,miterLimit:n,widthUnits:s,widthScale:r,widthMinPixels:a,widthMaxPixels:l}=this.props,c=this.state.model,p={jointType:Number(t),capType:Number(i),billboard:o,widthUnits:d.p5[s],widthScale:r,miterLimit:n,widthMinPixels:a,widthMaxPixels:l};c.shaderInputs.setProps({path:p}),c.draw(this.context.renderPass)}_getModel(){return new u.A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new g.V2({topology:"triangle-list",attributes:{indices:new Uint16Array([0,1,2,1,4,2,1,3,4,3,5,4]),positions:{value:new Float32Array([0,0,0,-1,0,1,1,-1,1,1,1,0]),size:2}}}),isInstanced:!0})}calculatePositions(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateSegmentTypes(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("segmentTypes")}calculateWebGPUPositions(e){let{pathTesselator:t}=this.state,i=t.get("positions");if(!i){e.value=null;return}let o=t.instanceCount,n=new Float32Array(24*o),s=[-1,0,1,2];for(let e=0;e<o;e++){let t=24*e;for(let r=0;r<4;r++){let a=e+s[r],l=t+3*r;for(let e=0;e<3;e++){let t=a>=0&&a<o?i[3*a+e]:0,s=Math.fround(t);n[l+e]=s,n[l+e+12]=t-s}}}e.startIndices=t.vertexStarts,e.value=n}}z.defaultProps=w,z.layerName="PathLayer";let O=z;function E(e){if(this.props._projectionTolerance&&"number"!=typeof e)throw Error("Projection refinement requires per-object widths");return e}function R(e){if(this.props._projectionTolerance&&("object"==typeof e?.[0]||e?.length>4))throw Error("Projection refinement requires per-object colors");return this.props._projectionTolerance&&"RGB"===this.props.colorFormat&&e?.length===4?e.slice(0,3):e}},82759(e,t,i){i.d(t,{A:()=>S});var o=i(66260),n=i(84175),s=i(46487),r=i(19754),a=i(9350),l=i(88599),c=i(25337),p=i(62459),f=i(3770);let d=`\
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
`,u={name:"scatterplot",vs:d,fs:d,source:"",uniformTypes:{radiusScale:"f32",radiusMinPixels:"f32",radiusMaxPixels:"f32",lineWidthScale:"f32",lineWidthMinPixels:"f32",lineWidthMaxPixels:"f32",stroked:"f32",filled:"f32",antialiasing:"f32",billboard:"f32",radiusUnits:"i32",lineWidthUnits:"i32",rowIndexOffset:"u32"}},g=`\
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
`,h=`\
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
`,x=`\
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
`;var v=i(60608);let m={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},radii:{attribute:"instanceRadius",accessor:"getRadius",semantic:"scalar",size:1,defaultValue:1},fillColors:{attribute:"instanceFillColors",accessor:"getFillColor",semantic:"color",size:4},lineColors:{attribute:"instanceLineColors",accessor:"getLineColor",semantic:"color",size:4},lineWidths:{attribute:"instanceLineWidths",accessor:"getLineWidth",semantic:"scalar",size:1,defaultValue:1},pixelOffsets:{attribute:"instancePixelOffset",accessor:"getPixelOffset",semantic:"vector",size:2,prop:!1}};function y(e){return Object.entries(m).some(([t,i])=>!1!==i.prop&&!!e[t])}class _ extends v.h{constructor(e){super(e,m,"Scatterplot",!0)}}let P=e=>e.position,C=[0,0,0,255],b={radiusUnits:"meters",radiusScale:{type:"number",min:0,value:1},radiusMinPixels:{type:"number",min:0,value:0},radiusMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},lineWidthUnits:"meters",lineWidthScale:{type:"number",min:0,value:1},lineWidthMinPixels:{type:"number",min:0,value:0},lineWidthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},stroked:!1,filled:!0,billboard:!1,antialiasing:!0,getPosition:{type:"accessor",value:P},getRadius:{type:"accessor",value:1},getFillColor:{type:"accessor",value:C},getLineColor:{type:"accessor",value:C},getLineWidth:{type:"accessor",value:1},getPixelOffset:{type:"accessor",value:[0,0]},positions:{type:"object",value:null,optional:!0},radii:{type:"object",value:null,optional:!0},fillColors:{type:"object",value:null,optional:!0},lineColors:{type:"object",value:null,optional:!0},lineWidths:{type:"object",value:null,optional:!0},strokeWidth:{deprecatedFor:"getLineWidth"},outline:{deprecatedFor:"stroked"},getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class L extends o.A{getBounds(){return this.state?.columns?this.state.columns.getBounds():super.getBounds()}_getAttributeManager(){return y(this.props)?null:super._getAttributeManager()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}get isLoaded(){return!this.state?.columns?.loading&&super.isLoaded}finalizeState(e){this.state.columns?.destroy(),super.finalizeState(e),this.state.geometry?.destroy()}getShaders(){let e=!!this.props.data?.attributes?.rowIndexes;return super.getShaders({vs:g,fs:h,source:function(e,t=!1){return(t?x.replace("@location(0) positions: vec3<f32>,","").replace("  var varyings: Varyings;",`  var varyings: Varyings;
  let quadPositions = array<vec3<f32>, 4>(vec3<f32>(-1.0, -1.0, 0.0), vec3<f32>(1.0, -1.0, 0.0), vec3<f32>(-1.0, 1.0, 0.0), vec3<f32>(1.0, 1.0, 0.0));
  let quadPosition = quadPositions[attributes.vertexIndex];`).replaceAll("attributes.positions","quadPosition"):x).replace("PICKING_COLOR_ATTRIBUTE",e?"@location(8) rowIndexes: u32,":"").replace("PICKING_COLOR_VALUE",e?"picking_getPickingColorFromIndex(attributes.rowIndexes)":"picking_getPickingColorFromIndex(attributes.instanceIndex + scatterplot.rowIndexOffset)")}(e,"webgpu"===this.context.device.type&&y(this.props)),defines:e?{USE_ROW_INDEXES:!0}:{},modules:[n.A,s.A,r.Ay,u]})}initializeState(){if(y(this.props)){if(this.props.extensions.length)throw Error("Scatterplot Arrow columns do not support extensions");return}this.initializeAccessorAttributes()}initializeAccessorAttributes(){let e=this.props.data?.attributes?.rowIndexes?{rowIndexes:{size:1,type:"uint32",noAlloc:!0}}:{};this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition",...this.usePositionTransforms()},instanceRadius:{size:1,transition:!0,accessor:"getRadius",defaultValue:1,bufferGroup:"scatterplot-instance-data"},instanceFillColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255],bufferGroup:"scatterplot-instance-data"},instanceLineColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255],bufferGroup:"scatterplot-instance-data"},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1,bufferGroup:"scatterplot-instance-data"},instancePixelOffset:{size:2,transition:!0,accessor:"getPixelOffset",bufferGroup:"scatterplot-instance-data"},...e})}updateState(e){y(this.props)?this.updateColumnState(e):(this.restoreAccessorState(),super.updateState(e),e.changeFlags.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()))}restoreAccessorState(){this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.internalState.attributeManager=super._getAttributeManager(),this.initializeAccessorAttributes(),this.state.model?.destroy(),this.state.model=this._getModel())}updateColumnState(e){if(this.props.extensions.length)throw Error("Scatterplot Arrow columns do not support extensions");let t=!this.state.columns;t&&(this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new _(this.context.device)),(t||e.changeFlags.extensionsChanged||!!e.props.data?.attributes?.rowIndexes!=!!e.oldProps.data?.attributes?.rowIndexes)&&(this.state.model?.destroy(),this.state.model=this._getModel()),this.state.columns.updateIfNeeded(e,{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:e=>this.raiseError(e,"converting Arrow columns"),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!this.props.positions&&this.props.getPosition===P}})}draw({uniforms:e}){let{radiusUnits:t,radiusScale:i,radiusMinPixels:o,radiusMaxPixels:n,stroked:s,filled:r,billboard:l,antialiasing:c,lineWidthUnits:p,lineWidthScale:f,lineWidthMinPixels:d,lineWidthMaxPixels:u}=this.props,g={stroked:s,filled:r,billboard:l,antialiasing:c,radiusUnits:a.p5[t],radiusScale:i,radiusMinPixels:o,radiusMaxPixels:n,lineWidthUnits:a.p5[p],lineWidthScale:f,lineWidthMinPixels:d,lineWidthMaxPixels:u,rowIndexOffset:0},h=this.state.model;!h||this.state.columns&&!!this.props.data?.attributes?.rowIndexes!==this.state.columns.hasRowIndexes||(h.shaderInputs.setProps({scatterplot:g}),this.state.columns?this.state.columns.draw(h,this.context.renderPass,e=>{h.setInstanceCount(Math.min(h.instanceCount,Math.max(0,this.getNumInstances()-e))),h.shaderInputs.setProps({scatterplot:{rowIndexOffset:e}})}):h.draw(this.context.renderPass))}_getModel(){this.state.geometry?.destroy(),this.state.geometry=void 0;let e=new c.V2({topology:"triangle-strip",attributes:{positions:{size:3,value:new Float32Array([-1,-1,0,1,-1,0,-1,1,0,1,1,0])}}}),t={...this.getShaders(),id:this.props.id,bufferLayout:this.state.columns?.getBufferLayouts(!!this.props.data?.attributes?.rowIndexes)??this.getAttributeManager().getBufferLayouts(),isInstanced:!0};if(this.state.columns){if("webgpu"===this.context.device.type)return new p.X(this.context.device,{...t,topology:"triangle-strip",vertexCount:4,inferDrawCount:"instance"});let i=(0,f.M)(this.context.device,e);return this.state.geometry=i,new p.X(this.context.device,{...t,geometry:i,inferDrawCount:"instance"})}return new l.A(this.context.device,{...t,geometry:e,enforceMatchingVectorLengths:!1,inferDrawCount:"no"})}}L.defaultProps=b,L.layerName="ScatterplotLayer";let S=L},41661(e,t,i){i.d(t,{$q:()=>h,A4:()=>c,Dt:()=>l,S8:()=>d});var o=i(55230),n=i(78009);let s="clockwise",r="counter-clockwise",a={isClosed:!0};function l(e){return"positions"in e?e.positions:e}function c(e){return"holeIndices"in e?e.holeIndices:null}function p(e,t,i,o,s){let r,l,c=t,p=i.length;for(let t=0;t<p;t++)for(let n=0;n<o;n++)e[c++]=i[t][n]||0;if(r=i[0],l=i[i.length-1],r[0]!==l[0]||r[1]!==l[1]||r[2]!==l[2])for(let t=0;t<o;t++)e[c++]=i[0][t]||0;return a.start=t,a.end=c,a.size=o,(0,n.UD)(e,s,a),c}function f(e,t,i,o,s=0,r,l){let c=(r=r||i.length)-s;if(c<=0)return t;let p=t;for(let t=0;t<c;t++)e[p++]=i[s+t];if(!function(e,t,i,o){for(let n=0;n<t;n++)if(e[i+n]!==e[o-t+n])return!1;return!0}(i,o,s,r))for(let t=0;t<o;t++)e[p++]=i[s+t];return a.start=t,a.end=p,a.size=o,(0,n.UD)(e,l,a),p}function d(e,t){var i,o=e;if(!Array.isArray(o=o&&o.positions||o)&&!ArrayBuffer.isView(o))throw Error("invalid polygon");let n=[],a=[];if("positions"in e){let{positions:i,holeIndices:o}=e;if(o){let e=0;for(let l=0;l<=o.length;l++)e=f(n,e,i,t,o[l-1],o[l],0===l?s:r),a.push(e);return a.pop(),{positions:n,holeIndices:a}}e=i}if(!Array.isArray(e[0]))return f(n,0,e,t,0,n.length,s),n;if(!((i=e).length>=1&&i[0].length>=2&&Number.isFinite(i[0][0]))){let i=0;for(let[o,l]of e.entries())i=p(n,i,l,t,0===o?s:r),a.push(i);return a.pop(),{positions:n,holeIndices:a}}return p(n,0,e,t,s),n}function u(e,t,i){let o=e.length/3,n=0;for(let s=0;s<o;s++){let r=(s+1)%o;n+=e[3*s+t]*e[3*r+i],n-=e[3*r+t]*e[3*s+i]}return Math.abs(n/2)}function g(e,t,i,o){let n=e.length/3;for(let s=0;s<n;s++){let n=3*s,r=e[n+0],a=e[n+1],l=e[n+2];e[n+t]=r,e[n+i]=a,e[n+o]=l}}function h(e,t,i,n,s){let r=c(e);r&&(r=r.map(e=>e/t));let a=l(e),p=n&&(3===t||s),f=t;if(p&&2===t){let e=[];for(let t=0;t<a.length;t+=2)e.push(a[t],a[t+1],0);a=e,f=3}if(i){let e=a.length;a=a.slice();let t=[];for(let o=0;o<e;o+=f){t[0]=a[o],t[1]=a[o+1],p&&(t[2]=a[o+2]??0);let e=i(t);a[o]=e[0],a[o+1]=e[1],p&&(a[o+2]=e[2])}}let d=s?a.slice():null;if(p){let e=u(a,0,1),t=u(a,0,2),o=u(a,1,2);if(!e&&!t&&!o)return[];e>t&&e>o||(t>o?(i||(a=a.slice()),g(a,0,2,1)):(i||(a=a.slice()),g(a,2,0,1)))}let h=o(a,r,f);if(d)for(let e=0;e<h.length;e+=3){let t=h[e]*f,i=h[e+1]*f,o=h[e+2]*f;d[t]*(d[i+1]*d[o+2]-d[i+2]*d[o+1])+d[t+1]*(d[i+2]*d[o]-d[i]*d[o+2])+d[t+2]*(d[i]*d[o+1]-d[i+1]*d[o])<0&&([h[e+1],h[e+2]]=[h[e+2],h[e+1]])}return h}},63744(e,t,i){i.d(t,{A:()=>E});var o=i(66260),n=i(84175),s=i(46487),r=i(87238),a=i(19754),l=i(7914),c=i(88599),p=i(25337),f=i(41661),d=i(44941),u=i(78009),g=i(12116),h=i(65441),x=i(40961);class v extends d.A{constructor(e){let{fp64:t,IndexType:i=Uint32Array}=e;super({...e,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:i,size:1}}})}get(e){let{attributes:t}=this;return"indices"===e?t.indices&&t.indices.subarray(0,this.vertexCount):t[e]}updateGeometry(e){super.updateGeometry(e);let t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.geometryAccessor)throw Error("missing indices buffer")}prepareGeometry(e){return this.preparePolygon(e,this.inputPositionSize)}normalizeGeometry(e){if(!this.opts.transform)return this.preparePolygon(e,this.positionSize);if(!this.normalize)return e;if(m(e)){for(let t of e){let{positions:e,holeIndices:i,edgeTypes:o}=t,n=[...i||[],e.length],s=0;for(let t=0;t<n.length;t++){let i=n[t];if((0,u.UD)(e,0===t?"clockwise":"counter-clockwise",{start:s,end:i,size:this.positionSize,isClosed:!0})&&o){let e=s/this.positionSize,t=i/this.positionSize-1,n=o.slice(e,t).reverse();for(let t=0;t<n.length;t++)o[e+t]=n[t]}s=i}}return e}return f.S8(e,this.positionSize)}preparePolygon(e,t){if(this.normalize){let i=f.S8(e,t);if(this.opts.resolution){let e=(0,g.w)(f.Dt(i),f.A4(i),{size:t,gridResolution:this.opts.resolution,edgeTypes:!0});return this.refinePolygons(e,t)}if(this.opts.wrapLongitude){let e=(0,h.E)(f.Dt(i),f.A4(i),{size:t,maxLatitude:86,edgeTypes:!0});return this.refinePolygons(e,t)}return this.opts.projectionTolerance?this.refinePolygons([i],t):i}return e}refinePolygons(e,t){let{projectionTolerance:i,projectionToleranceScale:o,transform:n}=this.opts;if(!i)return e;if(!n)throw Error("Projection refinement requires preprojected polygons");let s=o||[1,1,1];return e.map(e=>{let o=f.Dt(e),r=f.A4(e),a=e.edgeTypes,l=[],c=[],p=[],d=0;for(let e of[...r||[],o.length]){d&&c.push(l.length);let r=Array.from(o.slice(d,e));r.length&&r.slice(0,t).some((e,i)=>e!==r[r.length-t+i])&&r.push(...r.slice(0,t));let f=(0,x.A)(r,{size:t,targetSize:3,transform:e=>n(Array.from(e)).map((e,t)=>e*s[t]),tolerance:i});for(let e of f.sourcePositions)l.push(e);for(let e=0;e<f.segmentIndices.length;e++){let i=d/t+(f.segmentIndices[e]+ +(1===f.segmentFractions[e]));p.push(a?a[i]:1)}p[p.length-1]=0,d=e}return{positions:l,holeIndices:c,edgeTypes:p}})}getGeometrySize(e){if(m(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}return f.Dt(e).length/this.positionSize}getGeometryFromBuffer(e){return this.normalize||this.opts.transform||!this.buffers.indices?super.getGeometryFromBuffer(e):null}updateGeometryAttributes(e,t){if(e&&m(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e,t.indexStart=this.indexStarts[t.geometryIndex+1]}else this._updateIndices(e,t),this._updatePositions(e,t),this._updateVertexValid(e,t)}_updateIndices(e,{geometryIndex:t,vertexStart:i,indexStart:o}){let{attributes:n,indexStarts:s,typedArrayManager:r}=this,a=n.indices;if(!a||!e)return;let l=o,c=f.$q(e,this.positionSize,this.opts.preproject,this.opts.full3d,this.opts.geocentric);a=r.allocate(a,o+c.length,{copy:!0});for(let e=0;e<c.length;e++)a[l++]=c[e]+i;s[t+1]=o+c.length,n.indices=a}_updatePositions(e,{vertexStart:t,geometrySize:i}){let{attributes:{positions:o},positionSize:n}=this;if(!o||!e)return;let s=f.Dt(e);for(let e=t,r=0;r<i;e++,r++){let t=s[r*n],i=s[r*n+1],a=n>2?s[r*n+2]:0;o[3*e]=t,o[3*e+1]=i,o[3*e+2]=a}}_updateVertexValid(e,{vertexStart:t,geometrySize:i}){let{positionSize:o}=this,n=this.attributes.vertexValid,s=e&&f.A4(e);if(e&&e.edgeTypes?n.set(e.edgeTypes,t):n.fill(1,t,t+i),s)for(let e=0;e<s.length;e++)n[t+s[e]/o-1]=0;n[t+i-1]=0}}function m(e){return Array.isArray(e)&&e.length>0&&!Number.isFinite(e[0])}let y=`\
layout(std140) uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,_={name:"solidPolygon",source:`\
struct SolidPolygonUniforms {
  extruded: f32,
  isWireframe: f32,
  elevationScale: f32,
};

@group(0) @binding(auto) var<uniform> solidPolygon: SolidPolygonUniforms;
`,vs:y,fs:y,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},P=`\
in vec4 fillColors;
in vec4 lineColors;
in float rowIndexes;
out vec4 vColor;
struct PolygonProps {
vec3 positions;
vec3 positions64Low;
vec3 normal;
float elevations;
};
vec3 project_offset_normal(vec3 vector) {
if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
return normalize(vector * project.commonUnitsPerWorldUnit);
}
return project_normal(vector);
}
void calculatePosition(PolygonProps props) {
vec3 pos = props.positions;
vec3 pos64Low = props.positions64Low;
vec3 normal = props.normal;
vec4 colors = solidPolygon.isWireframe ? lineColors : fillColors;
geometry.worldPosition = props.positions;
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
if (solidPolygon.extruded) {
pos.z += props.elevations * solidPolygon.elevationScale;
}
gl_Position = project_position_to_clipspace(pos, pos64Low, vec3(0.), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
if (solidPolygon.extruded) {
#ifdef IS_SIDE_VERTEX
normal = project_offset_normal(normal);
#else
normal = project_normal(normal);
#endif
geometry.normal = normal;
vec3 lightColor = lighting_getLightColor(colors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, colors.a * layer.opacity);
} else {
vColor = vec4(colors.rgb, colors.a * layer.opacity);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,C=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader
in vec3 vertexPositions;
in vec3 vertexPositions64Low;
in float elevations;
${P}
void main(void) {
PolygonProps props;
props.positions = vertexPositions;
props.positions64Low = vertexPositions64Low;
props.elevations = elevations;
props.normal = vec3(0.0, 0.0, 1.0);
calculatePosition(props);
}
`,b=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader-side
#define IS_SIDE_VERTEX
in vec2 positions;
in vec3 vertexPositions;
in vec3 nextVertexPositions;
in vec3 vertexPositions64Low;
in vec3 nextVertexPositions64Low;
in float elevations;
in float instanceVertexValid;
${P}
void main(void) {
if(instanceVertexValid < 0.5){
gl_Position = vec4(0.);
return;
}
PolygonProps props;
vec3 pos;
vec3 pos64Low;
vec3 nextPos;
vec3 nextPos64Low;
#if RING_WINDING_ORDER_CW == 1
pos = vertexPositions;
pos64Low = vertexPositions64Low;
nextPos = nextVertexPositions;
nextPos64Low = nextVertexPositions64Low;
#else
pos = nextVertexPositions;
pos64Low = nextVertexPositions64Low;
nextPos = vertexPositions;
nextPos64Low = vertexPositions64Low;
#endif
props.positions = mix(pos, nextPos, positions.x);
props.positions64Low = mix(pos64Low, nextPos64Low, positions.x);
props.normal = vec3(
pos.y - nextPos.y + (pos64Low.y - nextPos64Low.y),
nextPos.x - pos.x + (nextPos64Low.x - pos64Low.x),
0.0);
props.elevations = elevations * positions.y;
calculatePosition(props);
}
`,L=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-fragment-shader
precision highp float;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;function S(){return`\
fn project_offset_normal(vector: vec3<f32>) -> vec3<f32> {
  if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
    return normalize(vector * project.commonUnitsPerWorldUnit);
  }
  return project_normal(vector);
}

fn apply_polygon_color(
  colors: vec4<f32>,
  normal: vec3<f32>,
  position: vec4<f32>
) -> vec4<f32> {
  if (solidPolygon.extruded > 0.5) {
    let lightColor = lighting_getLightColor2(
      colors.rgb,
      project.cameraPosition,
      position.xyz,
      normal
    );
    return vec4<f32>(lightColor, colors.a * layer.opacity);
  }
  return vec4<f32>(colors.rgb, colors.a * layer.opacity);
}
`}function w(){return`\
@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = vec2<f32>(0.0, 0.0);
  fragmentGeometry.uv = geometry.uv;


  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    var extensionColor = vec4<f32>(inp.pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  var fragColor = inp.vColor;

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inp.pickingColor - highlightedObjectColor))) {
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

  DECKGL_FILTER_COLOR(&fragColor, fragmentGeometry);
  return deckgl_premultiplied_alpha(fragColor);
}
`}var A=i(6053);let I=[0,0,0,255],z={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};class O extends o.A{getShaders(e){var t;let i=this.props._normalize||"CCW"!==this.props._windingOrder?1:0;return super.getShaders({vs:"top"===e?C:b,fs:L,source:(t=!!i,"top"===e?`\
${S()}

struct Attributes {
  @location(0) vertexPositions: vec3<f32>,
  @location(1) vertexPositions64Low: vec3<f32>,
  @location(2) elevations: f32,
  @location(3) fillColors: vec4<f32>,
  @location(4) lineColors: vec4<f32>,
  @location(5) rowIndexes: u32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var outp: Varyings;

  var pos = attributes.vertexPositions;
  if (solidPolygon.extruded > 0.5) {
    pos.z += attributes.elevations * solidPolygon.elevationScale;
  }

  geometry.worldPosition = attributes.vertexPositions;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);

  let projectedPosition = project_position_to_clipspace_and_commonspace(
    pos,
    attributes.vertexPositions64Low,
    vec3<f32>(0.0)
  );
  geometry.position = projectedPosition.commonPosition;
  outp.position = projectedPosition.clipPosition;

  let normal = project_normal(vec3<f32>(0.0, 0.0, 1.0));
  geometry.normal = normal;

  let colors = select(
    attributes.fillColors,
    attributes.lineColors,
    solidPolygon.isWireframe > 0.5
  );
  outp.vColor = apply_polygon_color(colors, normal, geometry.position);
  outp.pickingColor = geometry.pickingColor;


  DECKGL_FILTER_GL_POSITION(&outp.position, geometry);

  return outp;
}

${w()}
`:`\
const RING_WINDING_ORDER_CW: bool = ${t?"true":"false"};

${S()}

struct Attributes {
  @location(0) positions: vec2<f32>,
  @location(1) vertexPositions: vec3<f32>,
  @location(2) vertexPositions64Low: vec3<f32>,
  @location(3) nextVertexPositions: vec3<f32>,
  @location(4) nextVertexPositions64Low: vec3<f32>,
  @location(5) vertexValid: f32,
  @location(6) elevations: f32,
  @location(7) fillColors: vec4<f32>,
  @location(8) lineColors: vec4<f32>,
  @location(9) rowIndexes: u32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var outp: Varyings;
  outp.position = vec4<f32>(0.0);
  outp.vColor = vec4<f32>(0.0);
  outp.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);

  if (attributes.vertexValid < 0.5) {
    DECKGL_FILTER_GL_POSITION(&outp.position, geometry);
    return outp;
  }

  let pos = select(attributes.nextVertexPositions, attributes.vertexPositions, RING_WINDING_ORDER_CW);
  let pos64Low = select(
    attributes.nextVertexPositions64Low,
    attributes.vertexPositions64Low,
    RING_WINDING_ORDER_CW
  );
  let nextPos = select(attributes.vertexPositions, attributes.nextVertexPositions, RING_WINDING_ORDER_CW);
  let nextPos64Low = select(
    attributes.vertexPositions64Low,
    attributes.nextVertexPositions64Low,
    RING_WINDING_ORDER_CW
  );

  let position = mix(pos, nextPos, attributes.positions.x);
  let position64Low = mix(pos64Low, nextPos64Low, attributes.positions.x);

  var worldPosition = position;
  if (solidPolygon.extruded > 0.5) {
    worldPosition.z += attributes.elevations * attributes.positions.y * solidPolygon.elevationScale;
  }

  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);

  let projectedPosition = project_position_to_clipspace_and_commonspace(
    worldPosition,
    position64Low,
    vec3<f32>(0.0)
  );
  geometry.position = projectedPosition.commonPosition;
  outp.position = projectedPosition.clipPosition;

  let normal = project_offset_normal(vec3<f32>(
    pos.y - nextPos.y + (pos64Low.y - nextPos64Low.y),
    nextPos.x - pos.x + (nextPos64Low.x - pos64Low.x),
    0.0
  ));
  geometry.normal = normal;

  let colors = select(
    attributes.fillColors,
    attributes.lineColors,
    solidPolygon.isWireframe > 0.5
  );
  outp.vColor = apply_polygon_color(colors, normal, geometry.position);
  outp.pickingColor = geometry.pickingColor;


  DECKGL_FILTER_GL_POSITION(&outp.position, geometry);

  return outp;
}

${w()}
`),defines:{RING_WINDING_ORDER_CW:i},modules:[n.A,s.A,r.J,a.Ay,_]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){this.setState({numInstances:0,polygonTesselator:new v({fp64:this.use64bitPositions(),IndexType:Uint32Array})});let e=this.getAttributeManager(),t="webgpu"===this.context.device.type;e.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:!0},vertexPositions:{...this.usePositionTransforms(),size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:z,accessor:"getPolygon",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{nextVertexPositions:{vertexOffset:1}}},[t?"vertexValid":"instanceVertexValid"]:{size:1,type:t?"float32":"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:!0},elevations:{transform:null,size:1,stepMode:"dynamic",transition:z,accessor:"getElevation",bufferGroup:"solid-polygon-instance-data"},fillColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:z,accessor:"getFillColor",defaultValue:I,bufferGroup:"solid-polygon-instance-data"},lineColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:z,accessor:"getLineColor",defaultValue:I,bufferGroup:"solid-polygon-instance-data"},rowIndexes:{size:1,type:"uint32",stepMode:"dynamic",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"solid-polygon-instance-data"}})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,o=this.props.data;return o[0]&&o[0].__source&&(t.object=o.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{extruded:t,filled:i,wireframe:o,elevationScale:n}=this.props,{topModel:s,sideModel:r,wireframeModel:a,polygonTesselator:l}=this.state,c={extruded:!!t,elevationScale:n,isWireframe:!1};a&&o&&(a.setInstanceCount(l.instanceCount-1),a.shaderInputs.setProps({solidPolygon:{...c,isWireframe:!0}}),a.draw(this.context.renderPass)),r&&i&&(r.setInstanceCount(l.instanceCount-1),r.shaderInputs.setProps({solidPolygon:c}),r.draw(this.context.renderPass)),s&&i&&(s.setVertexCount(l.vertexCount),s.shaderInputs.setProps({solidPolygon:c}),s.draw(this.context.renderPass))}updateState(e){super.updateState(e),this.updateGeometry(e);let{props:t,oldProps:i,changeFlags:o}=e,n=this.getAttributeManager(),s=n.attributes;s.elevations.settings.transform=t._projectionTolerance?R:null,s.fillColors.settings.transform=t._projectionTolerance?T:null,s.lineColors.settings.transform=t._projectionTolerance?T:null,(o.extensionsChanged||t.filled!==i.filled||t.extruded!==i.extruded)&&(this.state.models?.forEach(e=>e.destroy()),this.setState(this._getModels()),n.invalidateAll())}updateGeometry({props:e,oldProps:t,changeFlags:i}){let{viewport:o}=this.context,n=this.getSubdivisionStep(),s=!!(this.state.packedCrs&&o.crs?.coordinateFrame==="geocentric"),r=i.projectionChanged||this.state.subdivisionStep!==n||o.isGeospatial&&(!(0,l.b)(e.modelMatrix,t.modelMatrix,1)||!(0,l.b)(e.coordinateOrigin,t.coordinateOrigin,1)),a=e._projectionTolerance!==t._projectionTolerance||e._projectionTolerance>0&&e._normalize!==t._normalize;if(a||i.dataChanged||r||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPolygon)){let{polygonTesselator:t}=this.state,l=e.data.attributes||{},c=(0,A.A)(this.state.packedCrs);if(e._projectionTolerance&&(!c||!this.usePositionTransforms().transform||!e._normalize||l.getPolygon&&!ArrayBuffer.isView(l.getPolygon.value??l.getPolygon)||Object.keys(l).some(e=>"getPolygon"!==e)))throw Error("Projection refinement requires linear target units, normalized polygons and per-object attributes");t.updateGeometry({data:e.data,normalize:e._normalize,geometryBuffer:l.getPolygon,buffers:l,getGeometry:e.getPolygon,transform:this.usePositionTransforms().transform?.bind(this),preproject:this.state.packedCrs?e=>this.state.preproject?o.projectPosition(e,{sourceCrs:this.state.packedCrs}):this.projectPosition(e,{viewport:o,autoOffset:!1}):void 0,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude&&!this.state.preproject&&this.state.sourceCrs?.signature==="WGS84",resolution:n,projectionTolerance:e._projectionTolerance,projectionToleranceScale:c??void 0,fp64:this.use64bitPositions(),dataChanged:r||a?void 0:i.dataChanged,full3d:e._full3d||s,geocentric:s}),this.setState({subdivisionStep:n,numInstances:t.instanceCount,startIndices:t.vertexStarts}),(!i.dataChanged||r||a)&&this.getAttributeManager().invalidateAll()}}_getModels(){let e,t,i,{id:o,filled:n,extruded:s}=this.props;if(n){let t=this.getShaders("top");t.defines={...t.defines,NON_INSTANCED_MODEL:1};let i=this.getAttributeManager().getBufferLayouts({isInstanced:!1});"webgpu"===this.context.device.type&&(i=i.filter(e=>"indices"!==e.name&&"vertexValid"!==e.name&&"instanceVertexValid"!==e.name&&"nextVertexPositions"!==e.name)),e=new c.A(this.context.device,{...t,id:`${o}-top`,topology:"triangle-list",bufferLayout:i,isIndexed:!0,isInstanced:!1,userData:{excludeAttributes:{vertexValid:!0,instanceVertexValid:!0,nextVertexPositions:!0}}})}if(s){let e=this.getAttributeManager().getBufferLayouts({isInstanced:!0});"webgpu"===this.context.device.type&&(e=e.filter(e=>"indices"!==e.name)),t=new c.A(this.context.device,{...this.getShaders("side"),id:`${o}-side`,bufferLayout:e,geometry:new p.V2({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),i=new c.A(this.context.device,{...this.getShaders("side"),id:`${o}-wireframe`,bufferLayout:e,geometry:new p.V2({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[t,i,e].filter(Boolean),topModel:e,sideModel:t,wireframeModel:i}}calculateIndices(e){let{polygonTesselator:t}=this.state;e.startIndices=t.indexStarts,e.value=t.get("indices")}calculatePositions(e){let{polygonTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateVertexValid(e){let t=this.props.data.attributes?.instanceVertexValid?.value,i="webgpu"===this.context.device.type&&t?t:this.state.polygonTesselator.get("vertexValid");e.value="webgpu"===this.context.device.type&&i?Float32Array.from(i):i}}O.defaultProps={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,_projectionTolerance:{type:"number",value:0,min:0},elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:e=>e.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:I},getLineColor:{type:"accessor",value:I},material:!0},O.layerName="SolidPolygonLayer";let E=O;function R(e){if(this.props._projectionTolerance&&"number"!=typeof e)throw Error("Projection refinement requires per-object elevations");return e}function T(e){if(this.props._projectionTolerance&&("object"==typeof e?.[0]||e?.length>4))throw Error("Projection refinement requires per-object colors");return this.props._projectionTolerance&&"RGB"===this.props.colorFormat&&e?.length===4?e.slice(0,3):e}},75027(e,t,i){i.d(t,{A:()=>u});var o=i(68996),n=i(53439),s=i(86982);let r=`\
layout(std140) uniform sdfUniforms {
  float gamma;
  bool enabled;
  float buffer;
  float outlineBuffer;
  vec4 outlineColor;
} sdf;
`,a={name:"sdf",vs:r,fs:r,uniformTypes:{gamma:"f32",enabled:"f32",buffer:"f32",outlineBuffer:"f32",outlineColor:"vec4<f32>"}};var l=i(20157);let c=`\
#version 300 es
#define SHADER_NAME multi-icon-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceSizes;
in float instanceAngles;
in vec4 instanceColors;
in float rowIndexes;
in vec4 instanceIconFrames;
in float instanceColorModes;
in vec2 instanceOffsets;
in vec2 instancePixelOffset;
in vec4 instanceClipRect;
out float vColorMode;
out vec4 vColor;
out vec2 vTextureCoords;
out vec2 uv;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = angle * PI / 180.0;
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
float getPixelOffsetFromAlignment(float anchor, float extent, float clipStart, float clipEnd, int mode) {
if (clipEnd < clipStart) return 0.0;
if (mode == ALIGN_MODE_START) {
return max(- (anchor + clipStart), 0.0);
}
if (mode == ALIGN_MODE_CENTER) {
float _min = max(0., anchor + clipStart);
float _max = min(extent, anchor + clipEnd);
return _min < _max ? (_min + _max) / 2.0 - anchor : 0.0;
}
if (mode == ALIGN_MODE_END) {
return min(extent - (anchor + clipEnd), 0.);
}
return 0.0;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
uv = positions;
vec2 iconSize = instanceIconFrames.zw;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * icon.sizeScale, icon.sizeUnits),
icon.sizeMinPixels, icon.sizeMaxPixels
);
float instanceScale = sizePixels / text.fontSize;
vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
pixelOffset += instancePixelOffset;
pixelOffset.y *= -1.0;
vec2 anchorPosScreen;
bool globeOccluded = false;
if (icon.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
gl_Position = project_globe_billboard_clipspace(gl_Position, geometry.position.xyz);
globeOccluded = project_globe_is_occluded(geometry.position.xyz);
anchorPosScreen = gl_Position.xy / gl_Position.w;
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
if (text.flipY) {
offset_common.y *= -1.;
}
DECKGL_FILTER_SIZE(offset_common, geometry);
vec4 anchorPos = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0));
anchorPosScreen = anchorPos.xy / anchorPos.w;
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
anchorPosScreen = vec2(anchorPosScreen.x + 1.0, 1.0 - anchorPosScreen.y) / 2.0 * project.viewportSize / project.devicePixelRatio;
vec2 xy = project_size_to_pixel(instanceClipRect.xy);
vec2 wh = project_size_to_pixel(instanceClipRect.zw);
if (text.flipY) {
xy.y = -xy.y - wh.y;
}
if (text.align.x > 0 || text.align.y > 0) {
vec2 viewportPixels = project.viewportSize / project.devicePixelRatio;
vec2 scrollPixels = vec2(
getPixelOffsetFromAlignment(anchorPosScreen.x, viewportPixels.x, xy.x, xy.x + wh.x, text.align.x),
-getPixelOffsetFromAlignment(anchorPosScreen.y, viewportPixels.y, -xy.y - wh.y, -xy.y, text.align.y)
);
pixelOffset += scrollPixels;
gl_Position.xy += project_pixel_size_to_clipspace(scrollPixels);
}
if (instanceClipRect.z >= 0.) {
if (pixelOffset.x < xy.x || pixelOffset.x > xy.x + wh.x) {
gl_Position = vec4(0.0);
}
else if (text.cutoffPixels.x > 0.) {
float vpWidth = project.viewportSize.x / project.devicePixelRatio;
float l = max(anchorPosScreen.x + xy.x, 0.0);
float r = min(anchorPosScreen.x + xy.x + wh.x, vpWidth);
if (r - l < text.cutoffPixels.x) {
gl_Position = vec4(0.0);
}
}
}
if (instanceClipRect.w >= 0.) {
if (pixelOffset.y < xy.y || pixelOffset.y > xy.y + wh.y) {
gl_Position = vec4(0.0);
}
else if (text.cutoffPixels.y > 0.) {
float vpHeight = project.viewportSize.y / project.devicePixelRatio;
float t = max(anchorPosScreen.y - xy.y - wh.y, 0.0);
float b = min(anchorPosScreen.y - xy.y, vpHeight);
if (b - t < text.cutoffPixels.y) {
gl_Position = vec4(0.0);
}
}
}
if (globeOccluded) {
gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}
vTextureCoords = mix(
instanceIconFrames.xy,
instanceIconFrames.xy + iconSize,
(positions.xy + 1.0) / 2.0
) / icon.iconsTextureDim;
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
vColorMode = instanceColorModes;
}
`,p=`\
#version 300 es
#define SHADER_NAME multi-icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
if (!bool(picking.isActive)) {
float alpha = texture(iconsTexture, vTextureCoords).a;
vec4 color = vColor;
if (sdf.enabled) {
float distance = alpha;
alpha = smoothstep(sdf.buffer - sdf.gamma, sdf.buffer + sdf.gamma, distance);
if (sdf.outlineBuffer > 0.0) {
float inFill = alpha;
float inBorder = smoothstep(sdf.outlineBuffer - sdf.gamma, sdf.outlineBuffer + sdf.gamma, distance);
color = mix(sdf.outlineColor, vColor, inFill);
alpha = inBorder;
}
}
float a = alpha * color.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color.rgb, a * layer.opacity);
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,f=function({collision:e=!1}={}){return`\
struct IconUniforms {
  sizeScale: f32,
  iconsTextureDim: vec2<f32>,
  sizeBasis: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  billboard: i32,
  sizeUnits: i32,
  alphaCutoff: f32
};

struct TextUniforms {
  cutoffPixels: vec2<f32>,
  align: vec2<i32>,
  fontSize: f32,
  flipY: f32
};

struct SdfUniforms {
  gamma: f32,
  enabled: f32,
  buffer: f32,
  outlineBuffer: f32,
  outlineColor: vec4<f32>
};

${e?`\
struct CollisionUniforms {
  sort: i32,
  enabled: i32
};
`:""}

const ALIGN_MODE_START: i32 = 1;
const ALIGN_MODE_CENTER: i32 = 2;
const ALIGN_MODE_END: i32 = 3;

@group(0) @binding(auto) var<uniform> icon: IconUniforms;
@group(0) @binding(auto) var<uniform> text: TextUniforms;
@group(0) @binding(auto) var<uniform> sdf: SdfUniforms;
${e?"@group(0) @binding(auto) var<uniform> collision: CollisionUniforms;":""}
@group(0) @binding(auto) var iconsTexture : texture_2d<f32>;
@group(0) @binding(auto) var iconsTextureSampler : sampler;
${e?`\
@group(0) @binding(auto) var collision_texture : texture_2d<f32>;
`:""}

fn rotate_by_angle(vertex: vec2<f32>, angle_deg: f32) -> vec2<f32> {
  let angle_radian = angle_deg * PI / 180.0;
  let c = cos(angle_radian);
  let s = sin(angle_radian);
  let rotation = mat2x2<f32>(vec2<f32>(c, -s), vec2<f32>(s, c));
  return rotation * vertex;
}

fn get_pixel_offset_from_alignment(
  anchor: f32,
  extent: f32,
  clipStart: f32,
  clipEnd: f32,
  mode: i32
) -> f32 {
  if (clipEnd < clipStart) {
    return 0.0;
  }
  if (mode == ALIGN_MODE_START) {
    return max(-(anchor + clipStart), 0.0);
  }
  if (mode == ALIGN_MODE_CENTER) {
    let minValue = max(0.0, anchor + clipStart);
    let maxValue = min(extent, anchor + clipEnd);
    if (minValue < maxValue) {
      return (minValue + maxValue) / 2.0 - anchor;
    }
    return 0.0;
  }
  if (mode == ALIGN_MODE_END) {
    return min(extent - (anchor + clipEnd), 0.0);
  }
  return 0.0;
}

${e?`\
fn collision_match(texCoords: vec2<f32>, pickingColor: vec3<f32>) -> f32 {
  let textureSize = vec2<i32>(textureDimensions(collision_texture));
  let pixelCoords = clamp(
    vec2<i32>(texCoords * vec2<f32>(textureSize)),
    vec2<i32>(0),
    textureSize - vec2<i32>(1)
  );
  let collisionPickingColor = textureLoad(collision_texture, pixelCoords, 0);
  let delta = dot(abs(collisionPickingColor.rgb - pickingColor), vec3<f32>(1.0));
  return step(delta, 0.001);
}

fn collision_is_visible(texCoords: vec2<f32>, pickingColor: vec3<f32>) -> f32 {
  if (collision.enabled == 0) {
    return 1.0;
  }

  var accumulator = 0.0;
  let stepSize = vec2<f32>(1.0) / project.viewportSize;

  for (var i: i32 = -2; i <= 2; i = i + 1) {
    for (var j: i32 = -2; j <= 2; j = j + 1) {
      let delta = vec2<f32>(f32(j), f32(i)) * stepSize;
      accumulator = accumulator + collision_match(texCoords + delta, pickingColor);
    }
  }

  return pow(accumulator / 25.0, 2.2);
}
`:""}

struct Attributes {
  @location(0) positions: vec2<f32>,

  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceSizes: f32,
  @location(4) instanceAngles: f32,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instanceIconFrames: vec4<f32>,
  @location(7) instanceColorModes: f32,
  @location(8) instanceOffsets: vec2<f32>,
  @location(9) instancePixelOffset: vec2<f32>,
  @location(10) rowIndexes: u32,
  @location(11) instanceClipRect: vec4<f32>,
  ${e?"@location(12) collisionPriorities: f32,":""}
};

struct Varyings {
  @builtin(position) position: vec4<f32>,

  @location(0) vColorMode: f32,
  @location(1) vColor: vec4<f32>,
  @location(2) vTextureCoords: vec2<f32>,
  @location(3) uv: vec2<f32>,
  @location(4) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(inp: Attributes) -> Varyings {
  geometry.worldPosition = inp.instancePositions;
  geometry.uv = inp.positions;
  geometry.pickingColor = picking_getPickingColorFromIndex(inp.rowIndexes);

  var outp: Varyings;
  outp.uv = inp.positions;

  let iconSize = inp.instanceIconFrames.zw;

  let sizePixels = clamp(
    project_unit_size_to_pixel(inp.instanceSizes * icon.sizeScale, icon.sizeUnits),
    icon.sizeMinPixels, icon.sizeMaxPixels
  );
  let instanceScale = sizePixels / text.fontSize;

  var pixelOffset = inp.positions / 2.0 * iconSize + inp.instanceOffsets;
  pixelOffset = rotate_by_angle(pixelOffset, inp.instanceAngles) * instanceScale;
  pixelOffset = pixelOffset + inp.instancePixelOffset;
  pixelOffset.y = pixelOffset.y * -1.0;

  var pos: vec4<f32>;
  var anchorPosScreen: vec2<f32>;
  // Hide glyphs whose anchor is behind the globe; culling handles non-billboard glyphs
  var globeOccluded = false;
  if (icon.billboard != 0) {
    let anchorCommon = project_position_vec3_f64(inp.instancePositions, inp.instancePositions64Low);
    geometry.position = vec4<f32>(anchorCommon, 1.0);
    pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0));
    pos = project_globe_billboard_clipspace(pos, anchorCommon);
    globeOccluded = project_globe_is_occluded(anchorCommon);
    anchorPosScreen = pos.xy / pos.w;

    var size = vec3<f32>(pixelOffset, 0.0);
    DECKGL_FILTER_SIZE(&size, geometry);
    let clipOffset = project_pixel_size_to_clipspace(size.xy);
    pos = vec4<f32>(pos.x + clipOffset.x, pos.y + clipOffset.y, pos.z, pos.w);
  } else {
    var offsetCommon = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    if (text.flipY > 0.5) {
      offsetCommon.y = offsetCommon.y * -1.0;
    }
    let anchorPos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0));
    anchorPosScreen = anchorPos.xy / anchorPos.w;
    DECKGL_FILTER_SIZE(&offsetCommon, geometry);
    let projected = project_position_to_clipspace_and_commonspace(inp.instancePositions, inp.instancePositions64Low, offsetCommon);
    geometry.position = projected.commonPosition;
    pos = projected.clipPosition;
  }

  anchorPosScreen = vec2<f32>(anchorPosScreen.x + 1.0, 1.0 - anchorPosScreen.y) / 2.0 *
    project.viewportSize / project.devicePixelRatio;
  var xy = project_size_vec2(inp.instanceClipRect.xy) * project.scale;
  var wh = project_size_vec2(inp.instanceClipRect.zw) * project.scale;

  if (text.flipY > 0.5) {
    xy.y = -xy.y - wh.y;
  }
  if (text.align.x > 0 || text.align.y > 0) {
    let viewportPixels = project.viewportSize / project.devicePixelRatio;
    let scrollPixels = vec2<f32>(
      get_pixel_offset_from_alignment(anchorPosScreen.x, viewportPixels.x, xy.x, xy.x + wh.x, text.align.x),
      -get_pixel_offset_from_alignment(anchorPosScreen.y, viewportPixels.y, -xy.y - wh.y, -xy.y, text.align.y)
    );
    pixelOffset = pixelOffset + scrollPixels;
    let scrollClipOffset = project_pixel_size_to_clipspace(scrollPixels);
    pos.x = pos.x + scrollClipOffset.x;
    pos.y = pos.y + scrollClipOffset.y;
  }

  if (inp.instanceClipRect.z >= 0.0) {
    if (pixelOffset.x < xy.x || pixelOffset.x > xy.x + wh.x) {
      pos = vec4<f32>(0.0);
    } else if (text.cutoffPixels.x > 0.0) {
      let viewportWidth = project.viewportSize.x / project.devicePixelRatio;
      let left = max(anchorPosScreen.x + xy.x, 0.0);
      let right = min(anchorPosScreen.x + xy.x + wh.x, viewportWidth);
      if (right - left < text.cutoffPixels.x) {
        pos = vec4<f32>(0.0);
      }
    }
  }
  if (inp.instanceClipRect.w >= 0.0) {
    if (pixelOffset.y < xy.y || pixelOffset.y > xy.y + wh.y) {
      pos = vec4<f32>(0.0);
    } else if (text.cutoffPixels.y > 0.0) {
      let viewportHeight = project.viewportSize.y / project.devicePixelRatio;
      let top = max(anchorPosScreen.y - xy.y - wh.y, 0.0);
      let bottom = min(anchorPosScreen.y - xy.y, viewportHeight);
      if (bottom - top < text.cutoffPixels.y) {
        pos = vec4<f32>(0.0);
      }
    }
  }

  ${e?`\
  if (collision.sort != 0) {
    pos.z = -0.001 * inp.collisionPriorities * pos.w;
  }
  `:""}

  if (globeOccluded) {
    pos = vec4<f32>(0.0, 0.0, 2.0, 1.0);
  }

  let uvMix = (inp.positions.xy + vec2<f32>(1.0, 1.0)) * 0.5;
  outp.vTextureCoords = mix(inp.instanceIconFrames.xy, inp.instanceIconFrames.xy + iconSize, uvMix) / icon.iconsTextureDim;

  outp.position = pos;
  outp.vColor = inp.instanceColors;
  outp.vColorMode = inp.instanceColorModes;
  outp.pickingColor = picking_getPickingColorFromIndex(inp.rowIndexes);

  DECKGL_FILTER_GL_POSITION(&outp.position, geometry);

  return outp;
}

@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = inp.uv;
  fragmentGeometry.uv = geometry.uv;

  let texColor = textureSample(iconsTexture, iconsTextureSampler, inp.vTextureCoords);
  var alpha = texColor.a;
  var color = inp.vColor;

  if (sdf.enabled > 0.5) {
    let distance = alpha;
    alpha = smoothstep(sdf.buffer - sdf.gamma, sdf.buffer + sdf.gamma, distance);

    if (sdf.outlineBuffer > 0.0) {
      let inFill = alpha;
      let inBorder = smoothstep(sdf.outlineBuffer - sdf.gamma, sdf.outlineBuffer + sdf.gamma, distance);
      color = mix(sdf.outlineColor, inp.vColor, inFill);
      alpha = inBorder;
    }
  } else if (inp.vColorMode == 0.0) {
    color = texColor;
  }

  var a = alpha * color.a * layer.opacity;
  if (a < icon.alphaCutoff) {
    discard;
  }

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    var extensionColor = vec4<f32>(inp.pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  ${e?`\
  let collisionFade = collision_is_visible(inp.position.xy / project.viewportSize, inp.pickingColor);
  a = a * collisionFade;
  if (a <= 0.0001) {
    discard;
  }
  `:""}

  var fragColor = vec4<f32>(color.rgb, a);

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inp.pickingColor - highlightedObjectColor))) {
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

  DECKGL_FILTER_COLOR(&fragColor, fragmentGeometry);
  return deckgl_premultiplied_alpha(fragColor);
}
`}();class d extends s.A{getShaders(){let e=super.getShaders();return{...e,modules:[...e.modules,l.Z,a],vs:c,fs:p,source:f}}initializeState(){super.initializeState();let e=this.getAttributeManager();e.attributes.instanceIconDefs.settings.update=this.calculateInstanceIconDefs,e.addInstanced({rowIndexes:{type:"uint32",size:1,bufferGroup:"icon-instance-data",accessor:(e,{index:t})=>t},instanceClipRect:{size:4,bufferGroup:"icon-instance-data",accessor:"getContentBox",defaultValue:[0,0,-1,-1]}})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:n}=e,{outlineColor:s}=t;if(n.extensionsChanged){this.state.fillModel?.destroy();let e="webgpu"===this.context.device.type?this._getModel(`${this.props.id}-fill`):void 0;this.setState({fillModel:e,models:e?[this.state.model,e]:[this.state.model]})}if(n.updateTriggersChanged&&(n.updateTriggersChanged.getIcon||n.updateTriggersChanged.getIconOffsets)&&this.getAttributeManager().invalidate("instanceIconDefs"),s!==i.outlineColor){let e=[s[0]/255,s[1]/255,s[2]/255,(s[3]??255)/255];this.setState({outlineColor:e})}!t.sdf&&t.outlineWidth&&o.A.warn(`${this.id}: fontSettings.sdf is required to render outline`)()}draw(e){let{sdf:t,smoothing:i,fontSize:o,outlineWidth:n,contentCutoffPixels:s,contentAlignHorizontal:r,contentAlignVertical:a}=this.props,{outlineColor:l}=this.state,c=n?Math.max(i,.75*(1-n)):-1,p=this.state.model,f={buffer:.75,outlineBuffer:c,gamma:i,enabled:!!t,outlineColor:l},d={contentCutoffPixels:s,contentAlignHorizontal:r,contentAlignVertical:a,fontSize:o,viewport:this.context.viewport};if(p.shaderInputs.setProps({sdf:f,text:d}),super.draw(e),t&&n){let{iconManager:e}=this.state;if(e.getTexture()){let e=this.state.fillModel||p;e.shaderInputs.setProps({sdf:{...f,outlineBuffer:.75},text:d}),this._drawModel(e)}}}calculateInstanceIconDefs(e,{startRow:t,endRow:i}){let{data:o,getIcon:s,getIconOffsets:r}=this.props,a=e.getVertexOffset(t),l=e.value,{iterable:c,objectInfo:p}=(0,n.X)(o,t,i);for(let t of c){p.index++;let i=s(t,p),o=r(t,p);if(i){let t=0;for(let n of Array.from(i)){let i=super.getInstanceIconDef(n);i[0]=o[2*t],i[1]+=o[2*t+1],i[6]=1,l.set(i,a),a+=e.size,t++}}}}}d.defaultProps={getIconOffsets:{type:"accessor",value:e=>e.offsets},getContentBox:{type:"accessor",value:[0,0,-1,-1]},fontSize:1,alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:"color",value:[0,0,0,255]},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none"},d.layerName="MultiIconLayer";let u=d},1592(e,t,i){i.d(t,{A:()=>m});var o=i(66260),n=i(84175),s=i(46487),r=i(19754),a=i(9350),l=i(88599),c=i(25337);let p=`\
layout(std140) uniform textBackgroundUniforms {
  bool billboard;
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  vec4 borderRadius;
  vec4 padding;
  highp int sizeUnits;
  bool stroked;
} textBackground;
`,f={name:"textBackground",source:`\
struct TextBackgroundUniforms {
  billboard: f32,
  sizeScale: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  borderRadius: vec4<f32>,
  padding: vec4<f32>,
  sizeUnits: i32,
  stroked: f32,
};

@group(0) @binding(auto) var<uniform> textBackground: TextBackgroundUniforms;
`,vs:p,fs:p,uniformTypes:{billboard:"f32",sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",borderRadius:"vec4<f32>",padding:"vec4<f32>",sizeUnits:"i32",stroked:"f32"}};var d=i(20157);let u=`\
#version 300 es
#define SHADER_NAME text-background-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceRects;
in vec4 instanceClipRect;
in float instanceSizes;
in float instanceAngles;
in vec2 instancePixelOffsets;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
out vec4 vFillColor;
out vec4 vLineColor;
out float vLineWidth;
out vec2 uv;
out vec2 dimensions;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = radians(angle);
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = picking_getPickingColorFromInstanceID();
uv = positions;
vLineWidth = instanceLineWidths;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * textBackground.sizeScale, textBackground.sizeUnits),
textBackground.sizeMinPixels, textBackground.sizeMaxPixels
);
float instanceScale = sizePixels / text.fontSize;
dimensions = instanceRects.zw * instanceScale + textBackground.padding.xy + textBackground.padding.zw;
vec2 pixelOffset = (positions * instanceRects.zw + instanceRects.xy) * instanceScale + mix(-textBackground.padding.xy, textBackground.padding.zw, positions);
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles);
pixelOffset += instancePixelOffsets;
pixelOffset.y *= -1.0;
vec2 xy = project_size_to_pixel(instanceClipRect.xy);
vec2 wh = project_size_to_pixel(instanceClipRect.zw);
if (text.flipY) {
xy.y = -xy.y - wh.y;
}
if (instanceClipRect.z >= 0.0) {
dimensions.x = wh.x;
pixelOffset.x = xy.x + uv.x * wh.x + mix(-textBackground.padding.x, textBackground.padding.z, uv.x);
}
if (instanceClipRect.w >= 0.0) {
dimensions.y = wh.y;
float v = 1.0 - uv.y;
pixelOffset.y = xy.y + v * wh.y + mix(-textBackground.padding.y, textBackground.padding.w, v);
}
if (textBackground.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
gl_Position = project_globe_billboard_clipspace(gl_Position, geometry.position.xyz);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
if (project_globe_is_occluded(geometry.position.xyz)) {
gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
if (text.flipY) {
offset_common.y *= -1.;
}
DECKGL_FILTER_SIZE(offset_common, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vFillColor, geometry);
vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,g=`\
#version 300 es
#define SHADER_NAME text-background-layer-fragment-shader
precision highp float;
in vec4 vFillColor;
in vec4 vLineColor;
in float vLineWidth;
in vec2 uv;
in vec2 dimensions;
out vec4 fragColor;
float round_rect(vec2 p, vec2 size, vec4 radii) {
vec2 pixelPositionCB = (p - 0.5) * size;
vec2 sizeCB = size * 0.5;
float maxBorderRadius = min(size.x, size.y) * 0.5;
vec4 borderRadius = vec4(min(radii, maxBorderRadius));
borderRadius.xy =
(pixelPositionCB.x > 0.0) ? borderRadius.xy : borderRadius.zw;
borderRadius.x = (pixelPositionCB.y > 0.0) ? borderRadius.x : borderRadius.y;
vec2 q = abs(pixelPositionCB) - sizeCB + borderRadius.x;
return -(min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - borderRadius.x);
}
float rect(vec2 p, vec2 size) {
vec2 pixelPosition = p * size;
return min(min(pixelPosition.x, size.x - pixelPosition.x),
min(pixelPosition.y, size.y - pixelPosition.y));
}
vec4 get_stroked_fragColor(float dist) {
float isBorder = smoothedge(dist, vLineWidth);
return mix(vFillColor, vLineColor, isBorder);
}
void main(void) {
geometry.uv = uv;
if (textBackground.borderRadius != vec4(0.0)) {
float distToEdge = round_rect(uv, dimensions, textBackground.borderRadius);
float shapeAlpha = smoothedge(-distToEdge, 0.0);
if (shapeAlpha == 0.0) {
discard;
}
if (textBackground.stroked) {
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
fragColor.a *= shapeAlpha;
} else {
if (textBackground.stroked) {
float distToEdge = rect(uv, dimensions);
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,h=`\
struct TextUniforms {
  cutoffPixels: vec2<f32>,
  align: vec2<i32>,
  fontSize: f32,
  flipY: f32,
};

@group(0) @binding(auto) var<uniform> text: TextUniforms;

fn rotate_by_angle(vertex: vec2<f32>, angle: f32) -> vec2<f32> {
  let angleRadian = radians(angle);
  let cosine = cos(angleRadian);
  let sine = sin(angleRadian);
  let rotationMatrix = mat2x2<f32>(
    vec2<f32>(cosine, -sine),
    vec2<f32>(sine, cosine)
  );
  return rotationMatrix * vertex;
}

struct Attributes {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec2<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceSizes: f32,
  @location(4) instanceAngles: f32,
  @location(5) instanceRects: vec4<f32>,
  @location(6) instanceClipRect: vec4<f32>,
  @location(7) instancePixelOffsets: vec2<f32>,
  @location(8) instanceFillColors: vec4<f32>,
  @location(9) instanceLineColors: vec4<f32>,
  @location(10) instanceLineWidths: f32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vFillColor: vec4<f32>,
  @location(1) vLineColor: vec4<f32>,
  @location(2) vLineWidth: f32,
  @location(3) uv: vec2<f32>,
  @location(4) dimensions: vec2<f32>,
  @location(5) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  geometry.worldPosition = attributes.instancePositions;
  geometry.uv = attributes.positions;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex);

  var varyings: Varyings;
  varyings.uv = attributes.positions;
  varyings.vLineWidth = attributes.instanceLineWidths;

  let sizePixels = clamp(
    project_unit_size_to_pixel(
      attributes.instanceSizes * textBackground.sizeScale,
      textBackground.sizeUnits
    ),
    textBackground.sizeMinPixels,
    textBackground.sizeMaxPixels
  );
  let instanceScale = sizePixels / text.fontSize;

  varyings.dimensions = attributes.instanceRects.zw * instanceScale +
    textBackground.padding.xy + textBackground.padding.zw;

  var pixelOffset =
    (attributes.positions * attributes.instanceRects.zw + attributes.instanceRects.xy) *
      instanceScale +
    mix(-textBackground.padding.xy, textBackground.padding.zw, attributes.positions);
  pixelOffset = rotate_by_angle(pixelOffset, attributes.instanceAngles);
  pixelOffset = pixelOffset + attributes.instancePixelOffsets;
  pixelOffset.y = pixelOffset.y * -1.0;

  var xy = project_size_vec2(attributes.instanceClipRect.xy) * project.scale;
  let wh = project_size_vec2(attributes.instanceClipRect.zw) * project.scale;
  if (text.flipY > 0.5) {
    xy.y = -xy.y - wh.y;
  }
  if (attributes.instanceClipRect.z >= 0.0) {
    varyings.dimensions.x = wh.x;
    pixelOffset.x = xy.x + varyings.uv.x * wh.x + mix(
      -textBackground.padding.x,
      textBackground.padding.z,
      varyings.uv.x
    );
  }
  if (attributes.instanceClipRect.w >= 0.0) {
    varyings.dimensions.y = wh.y;
    // Assign the same corners in the flipped order of the default offset above so the strip
    // stays front-facing
    let v = 1.0 - varyings.uv.y;
    pixelOffset.y = xy.y + v * wh.y + mix(
      -textBackground.padding.y,
      textBackground.padding.w,
      v
    );
  }

  if (textBackground.billboard > 0.5) {
    let anchorCommon = project_position_vec3_f64(attributes.instancePositions, attributes.instancePositions64Low);
    geometry.position = vec4<f32>(anchorCommon, 1.0);
    var position = project_position_to_clipspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      vec3<f32>(0.0)
    );
    position = project_globe_billboard_clipspace(position, anchorCommon);
    var size = vec3<f32>(pixelOffset, 0.0);
    DECKGL_FILTER_SIZE(&size, geometry);
    let clipOffset = project_pixel_size_to_clipspace(size.xy);
    position = vec4<f32>(
      position.x + clipOffset.x,
      position.y + clipOffset.y,
      position.z,
      position.w
    );
    // Hide backgrounds whose anchor is behind the globe; culling handles non-billboard ones
    if (project_globe_is_occluded(anchorCommon)) {
      position = vec4<f32>(0.0, 0.0, 2.0, 1.0);
    }
    varyings.position = position;
  } else {
    var offsetCommon = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    if (text.flipY > 0.5) {
      offsetCommon.y = offsetCommon.y * -1.0;
    }
    DECKGL_FILTER_SIZE(&offsetCommon, geometry);
    let projected = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      offsetCommon
    );
    geometry.position = projected.commonPosition;
    varyings.position = projected.clipPosition;
  }

  varyings.vFillColor = vec4<f32>(
    attributes.instanceFillColors.rgb,
    attributes.instanceFillColors.a * layer.opacity
  );
  varyings.vLineColor = vec4<f32>(
    attributes.instanceLineColors.rgb,
    attributes.instanceLineColors.a * layer.opacity
  );
  varyings.pickingColor = geometry.pickingColor;
  DECKGL_FILTER_GL_POSITION(&varyings.position, geometry);
  return varyings;
}

fn round_rect(point: vec2<f32>, size: vec2<f32>, radii: vec4<f32>) -> f32 {
  let pixelPosition = (point - 0.5) * size;
  let halfSize = size * 0.5;
  let maxBorderRadius = min(size.x, size.y) * 0.5;
  var borderRadius = min(radii, vec4<f32>(maxBorderRadius));

  borderRadius = select(borderRadius.zwxy, borderRadius, pixelPosition.x > 0.0);
  let radius = select(borderRadius.y, borderRadius.x, pixelPosition.y > 0.0);
  let q = abs(pixelPosition) - halfSize + radius;
  return -(min(max(q.x, q.y), 0.0) + length(max(q, vec2<f32>(0.0))) - radius);
}

fn rect(point: vec2<f32>, size: vec2<f32>) -> f32 {
  let pixelPosition = point * size;
  return min(
    min(pixelPosition.x, size.x - pixelPosition.x),
    min(pixelPosition.y, size.y - pixelPosition.y)
  );
}

fn get_stroked_frag_color(
  distanceToEdge: f32,
  lineWidth: f32,
  fillColor: vec4<f32>,
  lineColor: vec4<f32>
) -> vec4<f32> {
  let isBorder = smoothedge(distanceToEdge, lineWidth);
  return mix(fillColor, lineColor, isBorder);
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = varyings.uv;
  fragmentGeometry.uv = geometry.uv;
  var fragColor: vec4<f32>;

  if (any(textBackground.borderRadius != vec4<f32>(0.0))) {
    let distanceToEdge = round_rect(
      varyings.uv,
      varyings.dimensions,
      textBackground.borderRadius
    );
    let shapeAlpha = smoothedge(-distanceToEdge, 0.0);
    if (shapeAlpha == 0.0) {
      discard;
    }
    if (textBackground.stroked > 0.5) {
      fragColor = get_stroked_frag_color(
        distanceToEdge,
        varyings.vLineWidth,
        varyings.vFillColor,
        varyings.vLineColor
      );
    } else {
      fragColor = varyings.vFillColor;
    }
    fragColor.a = fragColor.a * shapeAlpha;
  } else if (textBackground.stroked > 0.5) {
    let distanceToEdge = rect(varyings.uv, varyings.dimensions);
    fragColor = get_stroked_frag_color(
      distanceToEdge,
      varyings.vLineWidth,
      varyings.vFillColor,
      varyings.vLineColor
    );
  } else {
    fragColor = varyings.vFillColor;
  }

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
      let highlightAlpha = picking.highlightColor.a;
      let blendedAlpha = highlightAlpha + fragColor.a * (1.0 - highlightAlpha);
      if (blendedAlpha > 0.0) {
        let highlightRatio = highlightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highlightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  return deckgl_premultiplied_alpha(fragColor);
}
`,x={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,fontSize:1,borderRadius:{type:"object",value:0},padding:{type:"array",value:[0,0,0,0]},getPosition:{type:"accessor",value:e=>e.position},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},getBoundingRect:{type:"accessor",value:[0,0,0,0]},getClipRect:{type:"accessor",value:[0,0,-1,-1]},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:[0,0,0,255]},getLineWidth:{type:"accessor",value:1}};class v extends o.A{getShaders(){return super.getShaders({vs:u,fs:g,source:h,modules:[n.A,s.A,r.Ay,f,d.Z]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getSize",defaultValue:1},instanceAngles:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getAngle"},instanceRects:{size:4,bufferGroup:"text-background-instance-data",accessor:"getBoundingRect"},instanceClipRect:{size:4,bufferGroup:"text-background-instance-data",accessor:"getClipRect",defaultValue:[0,0,-1,-1]},instancePixelOffsets:{size:2,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getPixelOffset"},instanceFillColors:{size:4,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e);let{changeFlags:t}=e;t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{billboard:t,sizeScale:i,sizeUnits:o,sizeMinPixels:n,sizeMaxPixels:s,getLineWidth:r,fontSize:l}=this.props,{padding:c,borderRadius:p}=this.props;c.length<4&&(c=[c[0],c[1],c[0],c[1]]),Array.isArray(p)||(p=[p,p,p,p]);let f=this.state.model,d={billboard:t,stroked:!!r,borderRadius:p,padding:c,sizeUnits:a.p5[o],sizeScale:i,sizeMinPixels:n,sizeMaxPixels:s},u={fontSize:l,viewport:this.context.viewport};f.shaderInputs.setProps({textBackground:d,text:u}),f.draw(this.context.renderPass)}_getModel(){return new l.A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new c.V2({topology:"triangle-strip",vertexCount:4,attributes:{positions:{size:2,value:new Float32Array([0,1,1,1,0,0,1,0])}}}),isInstanced:!0})}}v.defaultProps=x,v.layerName="TextBackgroundLayer";let m=v},32013(e,t,i){i.d(t,{A:()=>S});var o=i(59452),n=i(68996),s=i(53439),r=i(75027);let a=new Float64Array(256);for(let e=0;e<256;e++){let t=.5-Math.pow(e/255,1/2.2);a[e]=t*Math.abs(t)}a[255]=-1e20;class l{constructor({fontSize:e=24,buffer:t=3,radius:i=8,cutoff:o=.25,fontFamily:n="sans-serif",fontWeight:s="normal",fontStyle:r="normal",lang:a=null}={}){this.buffer=t,this.radius=i,this.cutoff=o,this.lang=a;let l=this.size=e+4*t,c=this._createCanvas(l),p=this.ctx=c.getContext("2d",{willReadFrequently:!0});p.font=`${r} ${s} ${e}px ${n}`,p.textBaseline="alphabetic",p.textAlign="left",p.fillStyle="black",this.gridOuter=new Float64Array(l*l),this.gridInner=new Float64Array(l*l),this.f=new Float64Array(l),this.z=new Float64Array(l+1),this.v=new Uint16Array(l)}_createCanvas(e){if("u">typeof OffscreenCanvas)return new OffscreenCanvas(e,e);let t=document.createElement("canvas");return t.width=t.height=e,t}draw(e){let{width:t,actualBoundingBoxAscent:i,actualBoundingBoxDescent:o,actualBoundingBoxLeft:n,actualBoundingBoxRight:s}=this.ctx.measureText(e),r=Math.ceil(i),l=Math.floor(n),p=Math.max(0,Math.min(this.size-this.buffer,Math.ceil(s)-l)),f=Math.max(0,Math.min(this.size-this.buffer,r+Math.ceil(o))),d=p+2*this.buffer,u=f+2*this.buffer,g=Math.max(d*u,0),h=new Uint8ClampedArray(g),x={data:h,width:d,height:u,glyphWidth:p,glyphHeight:f,glyphTop:r,glyphLeft:l,glyphAdvance:t};if(0===p||0===f)return x;let{ctx:v,buffer:m,gridInner:y,gridOuter:_}=this;this.lang&&(v.lang=this.lang),v.clearRect(m,m,p,f),v.fillText(e,m-l,m+r);let P=v.getImageData(m,m,p,f);_.fill(1e20,0,g),y.fill(0,0,g);let C=3;for(let e=0;e<f;e++){let t=(e+m)*d+m;for(let e=0;e<p;e++,C+=4,t++){let e=P.data[C];if(0===e)continue;let i=a[e];_[t]=Math.max(0,i),y[t]=Math.max(0,-i)}}c(_,0,0,d,u,d,this.f,this.v,this.z),c(y,m,m,p,f,d,this.f,this.v,this.z);let b=255/this.radius,L=255*(1-this.cutoff);for(let e=0;e<g;e++){let t=Math.sqrt(_[e])-Math.sqrt(y[e]);h[e]=Math.round(L-b*t)}return x}}function c(e,t,i,o,n,s,r,a,l){for(let c=t;c<t+o;c++)p(e,i*s+c,s,n,r,a,l);for(let c=i;c<i+n;c++)p(e,c*s+t,1,o,r,a,l)}function p(e,t,i,o,n,s,r){s[0]=0,r[0]=-1e20,r[1]=1e20,n[0]=e[t];for(let a=1,l=0,c=0;a<o;a++){n[a]=e[t+a*i];let o=a*a;do{let e=s[l];c=(n[a]-n[e]+o-e*e)/(a-e)/2}while(c<=r[l]&&--l>-1)s[++l]=a,r[l]=c,r[l+1]=1e20}for(let a=0,l=0;a<o;a++){for(;r[l+1]<a;)l++;let o=s[l],c=a-o;e[t+a*i]=n[o]+c*c}}let f=[];function d(e,t,i,o){let n=0;for(let s=t;s<i;s++){let t=e[s];n+=o[t]?.advance||0}return n}function u(e,t,i,o,n,s){let r=t,a=0;for(let l=t;l<i;l++){let t=d(e,l,l+1,n);a+t>o&&(r<l&&s.push(l),r=l,a=0),a+=t}return a}class g{constructor(e=5){this._cache={},this._order=[],this.limit=e}get(e){let t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?this.delete(e):Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e)}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){let t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}}let h={fontFamily:"Monaco, monospace",fontWeight:"normal",characterSet:function(){let e=[];for(let t=32;t<128;t++)e.push(String.fromCharCode(t));return e}(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},x=new g(3);function v(e,t,i,o){e.font=`${o} ${i}px ${t}`,e.fillStyle="#000",e.textBaseline="alphabetic",e.textAlign="left"}class m{constructor(){this.props={...h}}get atlas(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}setProps(e={}){Object.assign(this.props,e),e._getFontRenderer&&(this._getFontRenderer=e._getFontRenderer),this._key=this._getKey();let t=function(e,t){let i;i=new Set("string"==typeof t?Array.from(t):t);let o=x.get(e);if(!o)return i;for(let e in o.mapping)i.has(e)&&i.delete(e);return i}(this._key,this.props.characterSet),i=x.get(this._key);if(i&&0===t.size){this._atlas!==i&&(this._atlas=i);return}let o=this._generateFontAtlas(t,i);this._atlas=o,x.set(this._key,o)}_generateFontAtlas(e,t){let i,{fontFamily:o,fontWeight:n,fontSize:s,buffer:r,sdf:a,radius:c,cutoff:p}=this.props,f=t&&t.data;f||((f=document.createElement("canvas")).width=1024);let d=f.getContext("2d",{willReadFrequently:!0});v(d,o,s,n);let u=e=>(function(e,t,i){if(void 0===i){let i=e.measureText("A");return i.fontBoundingBoxAscent?{advance:0,width:0,ascent:Math.ceil(i.fontBoundingBoxAscent),descent:Math.ceil(i.fontBoundingBoxDescent)}:{advance:0,width:0,ascent:.9*t,descent:.3*t}}let o=e.measureText(i);return o.actualBoundingBoxAscent?{advance:o.width,width:Math.ceil(o.actualBoundingBoxRight-o.actualBoundingBoxLeft),ascent:Math.ceil(o.actualBoundingBoxAscent),descent:Math.ceil(o.actualBoundingBoxDescent)}:{advance:o.width,width:o.width,ascent:.9*t,descent:.3*t}})(d,s,e);this._getFontRenderer?i=this._getFontRenderer(this.props):a&&(i={measure:u,draw:function({fontSize:e,buffer:t,radius:i,cutoff:o,fontFamily:n,fontWeight:s}){let r=new l({fontSize:e,buffer:t,radius:i,cutoff:o,fontFamily:n,fontWeight:`${s}`});return e=>{let{data:i,width:o,height:n}=r.draw(e),s=new ImageData(o,n);for(let e=0;e<i.length;e++)s.data[4*e+3]=i[e];return{data:s,left:t,top:t}}}(this.props)});let{mapping:g,canvasHeight:h,xOffset:x,yOffsetMin:m,yOffsetMax:y}=function({characterSet:e,measureText:t,buffer:i,maxCanvasWidth:o,mapping:n={},xOffset:s=0,yOffsetMin:r=0,yOffsetMax:a=0}){let l=s,c=r,p=a;for(let s of e)if(!n[s]){let{advance:e,width:r,ascent:a,descent:f}=t(s),d=a+f;l+r+2*i>o&&(l=0,c=p),n[s]={x:l+i,y:c+i,width:r,height:d,advance:e,anchorX:r/2,anchorY:a},l+=r+2*i,p=Math.max(p,c+d+2*i)}return{mapping:n,xOffset:l,yOffsetMin:c,yOffsetMax:p,canvasHeight:Math.pow(2,Math.ceil(Math.log2(p)))}}({measureText:e=>i?i.measure(e):u(e),buffer:r,characterSet:e,maxCanvasWidth:1024,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffsetMin:t.yOffsetMin,yOffsetMax:t.yOffsetMax}});if(f.height!==h){let e=f.height>0?d.getImageData(0,0,f.width,f.height):null;f.height=h,e&&d.putImageData(e,0,0)}if(v(d,o,s,n),i)for(let t of e){let e=g[t],o=e.width,{data:n,left:s=0,top:r=0}=i.draw(t),a=e.x-s,l=e.y-r,c=Math.max(0,Math.round(a)),p=Math.max(0,Math.round(l)),u=Math.min(n.width,f.width-c),h=Math.min(n.height,f.height-p);d.putImageData(n,c,p,0,0,u,h),e.x=c,e.y=p,e.width=u,e.height=h,e.anchorX+=u/2-s-o/2,e.anchorY+=r}else for(let t of e){let e=g[t];d.fillText(t,e.x,e.y+e.anchorY)}let _=i?i.measure():u();return{baselineOffset:(_.ascent-_.descent)/2,xOffset:x,yOffsetMin:m,yOffsetMax:y,mapping:g,data:f,width:f.width,height:f.height}}_getKey(){let{fontFamily:e,fontWeight:t,fontSize:i,buffer:o,sdf:n,radius:s,cutoff:r}=this.props;return n?`${e} ${t} ${i} ${o} ${s} ${r}`:`${e} ${t} ${i} ${o}`}}var y=i(1592);let _={start:1,middle:0,end:-1},P={top:1,center:0,bottom:-1},C=[0,0,0,255],b={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,background:!1,getBackgroundColor:{type:"accessor",value:[255,255,255,255]},getBorderColor:{type:"accessor",value:C},getBorderWidth:{type:"accessor",value:0},backgroundBorderRadius:{type:"object",value:0},backgroundPadding:{type:"array",value:[0,0,0,0]},characterSet:{type:"object",value:h.characterSet},fontFamily:h.fontFamily,fontWeight:h.fontWeight,lineHeight:1,outlineWidth:{type:"number",value:0,min:0},outlineColor:{type:"color",value:C},fontSettings:{type:"object",value:{},compare:1},wordBreak:"break-word",maxWidth:{type:"number",value:-1},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none",getText:{type:"accessor",value:e=>e.text},getPosition:{type:"accessor",value:e=>e.position},getColor:{type:"accessor",value:C},getSize:{type:"accessor",value:32},getAngle:{type:"accessor",value:0},getTextAnchor:{type:"accessor",value:"middle"},getAlignmentBaseline:{type:"accessor",value:"center"},getPixelOffset:{type:"accessor",value:[0,0]},getContentBox:{type:"accessor",value:[0,0,-1,-1]},backgroundColor:{deprecatedFor:["background","getBackgroundColor"]}};class L extends o.A{constructor(){super(...arguments),this.getBoundingRect=(e,t)=>{let{size:[i,o]}=this.transformParagraph(e,t),{getTextAnchor:n,getAlignmentBaseline:s}=this.props;return[(_["function"==typeof n?n(e,t):n]-1)*i/2,(P["function"==typeof s?s(e,t):s]-1)*o/2,i,o]},this.getIconOffsets=(e,t)=>{let{getTextAnchor:i,getAlignmentBaseline:o}=this.props,{x:n,y:s,rowWidth:r,size:[,a]}=this.transformParagraph(e,t),l=_["function"==typeof i?i(e,t):i],c=P["function"==typeof o?o(e,t):o],p=n.length,f=Array(2*p),d=0;for(let e=0;e<p;e++)f[d++]=(l-1)*r[e]/2+n[e],f[d++]=(c-1)*a/2+s[e];return f}}initializeState(){this.state={styleVersion:0,fontAtlasManager:new m},this.props.maxWidth>0&&n.A.once(1,"v8.9 breaking change: TextLayer maxWidth is now relative to text size")()}updateState(e){let{props:t,oldProps:i,changeFlags:o}=e;(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==i.lineHeight||t.wordBreak!==i.wordBreak||t.maxWidth!==i.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){let{fontSettings:e,fontFamily:t,fontWeight:i,_getFontRenderer:o}=this.props,{fontAtlasManager:n,characterSet:s}=this.state,r={...e,characterSet:s,fontFamily:t,fontWeight:i,_getFontRenderer:o};if(!n.mapping)return n.setProps(r),!0;for(let e in r)if(r[e]!==n.props[e])return n.setProps(r),!0;return!1}_updateText(){let e,{data:t,characterSet:i}=this.props,o=t.attributes?.getText,{getText:n}=this.props,r=t.startIndices,a="auto"===i&&new Set;if(o&&r){let{texts:i,characterCount:s}=function({value:e,length:t,stride:i,offset:o,startIndices:n,characterSet:s}){let r=e.BYTES_PER_ELEMENT,a=i?i/r:1,l=o?o/r:0,c=n[t]||Math.ceil((e.length-l)/a),p=s&&new Set,f=Array(t),d=e;if(a>1||l>0){d=new e.constructor(c);for(let t=0;t<c;t++)d[t]=e[t*a+l]}for(let e=0;e<t;e++){let t=n[e],i=n[e+1]||c,o=d.subarray(t,i);f[e]=String.fromCodePoint.apply(null,o),p&&o.forEach(p.add,p)}if(p)for(let e of p)s.add(String.fromCodePoint(e));return{texts:f,characterCount:c}}({...ArrayBuffer.isView(o)?{value:o}:o,length:t.length,startIndices:r,characterSet:a});e=s,n=(e,{index:t})=>i[t]}else{let{iterable:i,objectInfo:o}=(0,s.X)(t);for(let t of(r=[0],e=0,i)){o.index++;let i=Array.from(n(t,o)||"");a&&i.forEach(a.add,a),e+=i.length,r.push(e)}}this.setState({getText:n,startIndices:r,numInstances:e,characterSet:a||i})}transformParagraph(e,t){let{fontAtlasManager:i}=this.state,o=i.mapping,{baselineOffset:s}=i.atlas,{fontSize:r}=i.props,a=this.state.getText,{wordBreak:l,lineHeight:c,maxWidth:p}=this.props;return function(e,t,i,o,s,r){let a=Array.from(e),l=a.length,c=Array(l),p=Array(l),g=Array(l),h=("break-word"===o||"break-all"===o)&&isFinite(s)&&s>0,x=[0,0],v=[0,0],m=0,y=t+i/2,_=0,P=0;for(let e=0;e<=l;e++){let t=a[e];if(("\n"===t||e===l)&&(P=e),P>_){let e=h?function(e,t,i,o,n=0,s){void 0===s&&(s=e.length);let r=[];return"break-all"===t?u(e,n,s,i,o,r):!function(e,t,i,o,n,s){let r=t,a=t,l=t,c=0;for(let p=t;p<i;p++)if(" "===e[p]?l=p+1:(" "===e[p+1]||p+1===i)&&(l=p+1),l>a){let t=d(e,a,l,n);c+t>o&&(r<a&&(s.push(a),r=a,c=0),t>o&&(t=u(e,a,l,o,n,s),r=s[s.length-1])),a=l,c+=t}}(e,n,s,i,o,r),r}(a,o,s,r,_,P):f;for(let t=0;t<=e.length;t++){let o=0===t?_:e[t-1],s=t<e.length?e[t]:P;!function(e,t,i,o,s,r){let a=0,l=0;for(let n=t;n<i;n++){let t=o[e[n]];t&&(l=Math.max(l,t.height))}for(let r=t;r<i;r++){let t=e[r],i=o[t];i?(s[r]=a+i.anchorX,a+=i.advance):(n.A.warn(`Missing character: ${t} (${t.codePointAt(0)})`)(),s[r]=a,a+=32)}r[0]=a,r[1]=l}(a,o,s,r,c,v);for(let e=o;e<s;e++)p[e]=y,g[e]=v[0];m++,y+=i,x[0]=Math.max(x[0],v[0])}_=P}"\n"===t&&(c[_]=0,p[_]=0,g[_]=0,_++)}return x[1]=m*i,{x:c,y:p,rowWidth:g,size:x}}(a(e,t)||"",s,c*r,l,p*r,o)}renderLayers(){let{startIndices:e,numInstances:t,getText:i,fontAtlasManager:{atlas:o,mapping:n},styleVersion:s}=this.state,{data:a,_dataDiff:l,getPosition:c,getColor:p,getSize:f,getAngle:d,getPixelOffset:u,getBackgroundColor:g,getBorderColor:x,getBorderWidth:v,getContentBox:m,backgroundBorderRadius:_,backgroundPadding:P,background:C,billboard:b,fontSettings:L,outlineWidth:S,outlineColor:w,sizeScale:A,sizeUnits:I,sizeMinPixels:z,sizeMaxPixels:O,contentCutoffPixels:E,contentAlignHorizontal:R,contentAlignVertical:T,transitions:M,updateTriggers:k}=this.props,F=this.getSubLayerClass("characters",r.A),j=this.getSubLayerClass("background",y.A),{fontSize:D}=this.state.fontAtlasManager.props;return[C&&new j({getFillColor:g,getLineColor:x,getLineWidth:v,borderRadius:_,padding:P,getPosition:c,getSize:f,getAngle:d,getPixelOffset:u,getClipRect:m,billboard:b,sizeScale:A,sizeUnits:I,sizeMinPixels:z,sizeMaxPixels:O,fontSize:D,transitions:M&&{getPosition:M.getPosition,getAngle:M.getAngle,getSize:M.getSize,getFillColor:M.getBackgroundColor,getLineColor:M.getBorderColor,getLineWidth:M.getBorderWidth,getPixelOffset:M.getPixelOffset}},this.getSubLayerProps({id:"background",updateTriggers:{getPosition:k.getPosition,getAngle:k.getAngle,getSize:k.getSize,getFillColor:k.getBackgroundColor,getLineColor:k.getBorderColor,getLineWidth:k.getBorderWidth,getPixelOffset:k.getPixelOffset,getBoundingRect:{getText:k.getText,getTextAnchor:k.getTextAnchor,getAlignmentBaseline:k.getAlignmentBaseline,styleVersion:s}}}),{data:a.attributes&&a.attributes.background?{length:a.length,attributes:a.attributes.background}:a,_dataDiff:l,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new F({sdf:L.sdf,smoothing:Number.isFinite(L.smoothing)?L.smoothing:h.smoothing,outlineWidth:S/(L.radius||h.radius),outlineColor:w,iconAtlas:o,iconMapping:n,getPosition:c,getColor:p,getSize:f,getAngle:d,getPixelOffset:u,getContentBox:m,billboard:b,sizeScale:A,sizeUnits:I,sizeMinPixels:z,sizeMaxPixels:O,fontSize:D,contentCutoffPixels:E,contentAlignHorizontal:R,contentAlignVertical:T,transitions:M&&{getPosition:M.getPosition,getAngle:M.getAngle,getColor:M.getColor,getSize:M.getSize,getPixelOffset:M.getPixelOffset,getContentBox:M.getContentBox}},this.getSubLayerProps({id:"characters",updateTriggers:{all:k.getText,getPosition:k.getPosition,getAngle:k.getAngle,getColor:k.getColor,getSize:k.getSize,getPixelOffset:k.getPixelOffset,getContentBox:k.getContentBox,getIconOffsets:{getTextAnchor:k.getTextAnchor,getAlignmentBaseline:k.getAlignmentBaseline,styleVersion:s}}}),{data:a,_dataDiff:l,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:i})]}static set fontAtlasCacheLimit(e){n.A.assert(Number.isFinite(e)&&e>=3,"Invalid cache limit"),x=new g(e)}}L.defaultProps=b,L.layerName="TextLayer";let S=L},20157(e,t,i){i.d(t,{Z:()=>n});let o={none:0,start:1,center:2,end:3},n={name:"text",vs:`\
layout(std140) uniform textUniforms {
  highp vec2 cutoffPixels;
  highp ivec2 align;
  highp float fontSize;
  bool flipY;
} text;

#define ALIGN_MODE_START ${o.start}
#define ALIGN_MODE_CENTER ${o.center}
#define ALIGN_MODE_END ${o.end}
`,getUniforms:({contentCutoffPixels:e=[0,0],contentAlignHorizontal:t="none",contentAlignVertical:i="none",fontSize:n,viewport:s})=>({cutoffPixels:e,align:[o[t],o[i]],fontSize:n,flipY:s?.flipY??!1}),uniformTypes:{cutoffPixels:"vec2<f32>",align:"vec2<i32>",fontSize:"f32",flipY:"f32"}}},6053(e,t,i){function o(e){if(!e||"projected"!==e.coordinateFrame&&"geocentric"!==e.coordinateFrame)return null;let t=e.xUnit.metersPerUnit,i=e.yUnit.metersPerUnit,o=e.zUnit.metersPerUnit;return"number"!=typeof t||!Number.isFinite(t)||t<=0||"number"!=typeof i||!Number.isFinite(i)||i<=0||"number"!=typeof o||!Number.isFinite(o)||o<=0?null:[t,i,o]}function n({data:e,getIndex:t,dataRange:i,replace:o}){let{startRow:s=0,endRow:r=1/0}=i,a=e.length,l=a,c=a;for(let i=0;i<a;i++){let o=t(e[i]);if(l>i&&o>=s&&(l=i),o>=r){c=i;break}}let p=l,f=c-l!==o.length?e.slice(c):void 0;for(let t=0;t<o.length;t++)e[p++]=o[t];if(f){for(let t=0;t<f.length;t++)e[p++]=f[t];e.length=p}return{startRow:l,endRow:l+o.length}}i.d(t,{A:()=>o,J:()=>n})},12116(e,t,i){function o(e,t,i,n,s=[]){let r,a;if(8&i)r=(n[3]-e[1])/(t[1]-e[1]),a=3;else if(4&i)r=(n[1]-e[1])/(t[1]-e[1]),a=1;else if(2&i)r=(n[2]-e[0])/(t[0]-e[0]),a=2;else{if(!(1&i))return null;r=(n[0]-e[0])/(t[0]-e[0]),a=0}for(let i=0;i<e.length;i++)s[i]=(1&a)===i?n[a]:r*(t[i]-e[i])+e[i];return s}function n(e,t){let i=0;return e[0]<t[0]?i|=1:e[0]>t[2]&&(i|=2),e[1]<t[1]?i|=4:e[1]>t[3]&&(i|=8),i}i.d(t,{w:()=>a,M:()=>r});var s=i(46954);function r(e,t){let i,r,{size:a=2,broken:l=!1,gridResolution:p=10,gridOffset:f=[0,0],startIndex:d=0,endIndex:u=e.length}=t||{},g=(u-d)/a,h=[],x=[h],v=(0,s.ah)(e,0,a,d),m=c(v,p,f,[]),y=[];(0,s.VC)(h,v);for(let t=1;t<g;t++){for(r=n(i=(0,s.ah)(e,t,a,d,i),m);r;){var _,P,C;o(v,i,r,m,y);let e=n(y,m);e&&(o(v,y,e,m,y),r=e),(0,s.VC)(h,y),(0,s.C)(v,y),_=m,P=p,8&(C=r)?(_[1]+=P,_[3]+=P):4&C?(_[1]-=P,_[3]-=P):2&C?(_[0]+=P,_[2]+=P):1&C&&(_[0]-=P,_[2]-=P),l&&h.length>a&&(h=[],x.push(h),(0,s.VC)(h,v)),r=n(i,m)}(0,s.VC)(h,i),(0,s.C)(v,i)}return l?x:x[0]}function a(e,t=null,i){if(!e.length)return[];let{size:o=2,gridResolution:s=10,gridOffset:r=[0,0],edgeTypes:f=!1}=i||{},d=[],u=[{pos:e,types:f?Array(e.length/o).fill(1):null,holes:t||[]}],g=[[],[]],h=[];for(;u.length;){let{pos:e,types:t,holes:i}=u.shift();(function(e,t,i,o){let n=1/0,s=-1/0,r=1/0,a=-1/0;for(let o=0;o<i;o+=t){let t=e[o],i=e[o+1];n=t<n?t:n,s=t>s?t:s,r=i<r?i:r,a=i>a?i:a}o[0][0]=n,o[0][1]=r,o[1][0]=s,o[1][1]=a})(e,o,i[0]||e.length,g),h=c(g[0],s,r,h);let a=n(g[1],h);if(a){let n=l(e,t,o,0,i[0]||e.length,h,a),s={pos:n[0].pos,types:n[0].types,holes:[]},r={pos:n[1].pos,types:n[1].types,holes:[]};u.push(s,r);for(let c=0;c<i.length;c++)(n=l(e,t,o,i[c],i[c+1]||e.length,h,a))[0]&&(s.holes.push(s.pos.length),s.pos=p(s.pos,n[0].pos),f&&(s.types=p(s.types,n[0].types))),n[1]&&(r.holes.push(r.pos.length),r.pos=p(r.pos,n[1].pos),f&&(r.types=p(r.types,n[1].types)))}else{let o={positions:e};f&&(o.edgeTypes=t),i.length&&(o.holeIndices=i),d.push(o)}}return d}function l(e,t,i,n,r,a,l){let c,p,f,d=(r-n)/i,u=[],g=[],h=[],x=[],v=[],m=(0,s.ah)(e,d-1,i,n),y=Math.sign(8&l?m[1]-a[3]:m[0]-a[2]),_=t&&t[d-1],P=0,C=0;for(let r=0;r<d;r++)c=(0,s.ah)(e,r,i,n,c),p=Math.sign(8&l?c[1]-a[3]:c[0]-a[2]),f=t&&t[n/i+r],p&&y&&y!==p&&(o(m,c,l,a,v),(0,s.VC)(u,v)&&h.push(_),(0,s.VC)(g,v)&&x.push(_)),p<=0?((0,s.VC)(u,c)&&h.push(f),P-=p):h.length&&(h[h.length-1]=0),p>=0?((0,s.VC)(g,c)&&x.push(f),C+=p):x.length&&(x[x.length-1]=0),(0,s.C)(m,c),y=p,_=f;return[P?{pos:u,types:t&&h}:null,C?{pos:g,types:t&&x}:null]}function c(e,t,i,o){let n=Math.floor((e[0]-i[0])/t)*t+i[0],s=Math.floor((e[1]-i[1])/t)*t+i[1];return o[0]=n,o[1]=s,o[2]=n+t,o[3]=s+t,o}function p(e,t){for(let i=0;i<t.length;i++)e.push(t[i]);return e}},65441(e,t,i){i.d(t,{E:()=>r,I:()=>s});var o=i(12116),n=i(46954);function s(e,t){let{size:i=2,startIndex:n=0,endIndex:s=e.length,normalize:r=!0}=t||{},c=e.slice(n,s);a(c,i,0,s-n);let p=(0,o.M)(c,{size:i,broken:!0,gridResolution:360,gridOffset:[-180,-180]});if(r)for(let e of p)l(e,i);return p}function r(e,t=null,i){let{size:s=2,normalize:c=!0,edgeTypes:p=!1}=i||{};t=t||[];let f=[],d=[],u=0,g=0;for(let o=0;o<=t.length;o++){let r=t[o]||e.length,l=g,c=function(e,t,i,o){let n=-1,s=-1;for(let r=i+1;r<o;r+=t){let t=Math.abs(e[r]);t>n&&(n=t,s=r-1)}return s}(e,s,u,r);for(let t=c;t<r;t++)f[g++]=e[t];for(let t=u;t<c;t++)f[g++]=e[t];a(f,s,l,g),function(e,t,i,o,s=85.051129){let r=e[i],a=e[o-t];if(Math.abs(r-a)>180){let o=(0,n.ah)(e,0,t,i);o[0]+=360*Math.round((a-r)/360),(0,n.VC)(e,o),o[1]=Math.sign(o[1])*s,(0,n.VC)(e,o),o[0]=r,(0,n.VC)(e,o)}}(f,s,l,g,i?.maxLatitude),u=r,d[o]=g}d.pop();let h=(0,o.w)(f,d,{size:s,gridResolution:360,gridOffset:[-180,-180],edgeTypes:p});if(c)for(let e of h)l(e.positions,s);return h}function a(e,t,i,o){let n,s=e[0];for(let r=i;r<o;r+=t){let t=(n=e[r])-s;(t>180||t<-180)&&(n-=360*Math.round(t/360)),e[r]=s=n}}function l(e,t){let i,o=e.length/t;for(let n=0;n<o&&((i=e[n*t])+180)%360==0;n++);let n=-(360*Math.round(i/360));if(0!==n)for(let i=0;i<o;i++)e[i*t]+=n}},78009(e,t,i){function o(e,t,i={}){return function(e,t={}){var i;return(i=function(e,t={}){let{start:i=0,end:o=e.length,plane:s="xy"}=t,r=t.size||2,a=0,l=n[s[0]],c=n[s[1]];for(let t=i,n=o-r;t<o;t+=r)a+=(e[t+l]-e[n+l])*(e[t+c]+e[n+c]),n=t;return a/2}(e,t))>0?"clockwise":i<0?"counter-clockwise":"none"}(e,i)!==t&&(function(e,t){let{start:i=0,end:o=e.length,size:n=2}=t,s=(o-i)/n,r=Math.floor(s/2);for(let t=0;t<r;++t){let o=i+t*n,r=i+(s-1-t)*n;for(let t=0;t<n;++t){let i=e[o+t];e[o+t]=e[r+t],e[r+t]=i}}}(e,i),!0)}i.d(t,{UD:()=>o});let n={x:0,y:1,z:2}},40961(e,t,i){i.d(t,{A:()=>o});function o(e,t){let{transform:i,tolerance:o,createEdgeSampler:n,size:s=2,targetSize:r=s,maxSegmentLength:a=1/0,maxDepth:l=16,maxVertices:c=65536}=t;if("function"!=typeof i||void 0!==n&&"function"!=typeof n||!Number.isFinite(o)||o<=0||2!==s&&3!==s||2!==r&&3!==r||!(a>0)||!Number.isFinite(a)&&a!==1/0||!Number.isInteger(l)||l<0||l>30||!Number.isSafeInteger(c)||c<1||c>0xffffffff||!Number.isSafeInteger(e.length)||e.length<0||e.length%s!=0)throw RangeError("Invalid polyline subdivision options or input length");let p=e.length/s;if(p>c)throw RangeError("Polyline exceeds maxVertices");let f=[];for(let t=0;t<e.length;t++){let i=e[t];if(!Number.isFinite(i))throw RangeError("Source positions must be finite");f.push(i)}let d=[],u=[],g=[],h=[];function x(e,t){let o=i(e.slice());if(!o||o.length!==r)throw RangeError("Transform must return a position with targetSize components");let n=Array.from(o);if(!n.every(Number.isFinite))throw RangeError("Transform returned nonfinite coordinates");return{source:e,target:n,fraction:t}}function v(e,t){if(g.length>=c)throw RangeError("Polyline subdivision exceeded maxVertices");for(let t of e.source)d.push(t);for(let t of e.target)u.push(t);g.push(t),h.push(e.fraction)}function m(e,t){let i=e.sample(t);if(!i||i.length!==s)throw RangeError("Invalid source-edge sample size");let o=Array.from(i);if(!o.every(Number.isFinite))throw RangeError("Nonfinite source-edge sample");return o}if(p){let e=x(f.slice(0,s),0);v(e,0);for(let t=1;t<p;t++){let i=x(f.slice(t*s,(t+1)*s),1),r={...e,fraction:0},c=n?.(r.source.slice(),i.source.slice(),t-1);if(n){if(!c||"function"!=typeof c.sample||!Number.isFinite(c.length)||c.length<0)throw RangeError("Invalid source-edge sampler");for(let e of[r,i])if(m(c,e.fraction).some((t,i)=>t!==e.source[i]))throw RangeError("Source-edge sampler endpoints must match input")}!function e(t,i,n,s,r){let c,p=0;for(let e of[.25,.5,.75]){let o=function(e,t,i,o){let n=e.fraction*(1-i)+t.fraction*i;return x(o?m(o,n):e.source.map((e,o)=>e*(1-i)+t.source[o]*i),n)}(t,i,e,r);.5===e&&(c=o),p=Math.max(p,Math.hypot(...o.target.map((o,n)=>o-(t.target[n]*(1-e)+i.target[n]*e))))}let f=r?r.length*(i.fraction-t.fraction):Math.hypot(...t.source.map((e,t)=>e-i.source[t]));if(p<=o&&f<=a)return void v(i,n);if(s>=l)throw RangeError(`Polyline subdivision exceeded maxDepth on input edge ${n}`);e(t,c,n,s+1,r),e(c,i,n,s+1,r)}(r,i,t-1,0,c),e=i}}return{sourcePositions:new Float64Array(d),positions:new Float64Array(u),segmentIndices:new Uint32Array(g),segmentFractions:new Float64Array(h)}}},46954(e,t,i){function o(e,t){let i=t.length,o=e.length;if(o>0){let n=!0;for(let s=0;s<i;s++)if(e[o-i+s]!==t[s]){n=!1;break}if(n)return!1}for(let n=0;n<i;n++)e[o+n]=t[n];return!0}function n(e,t){let i=t.length;for(let o=0;o<i;o++)e[o]=t[o]}function s(e,t,i,o,n=[]){let r=o+t*i;for(let t=0;t<i;t++)n[t]=e[r+t];return n}i.d(t,{C:()=>n,VC:()=>o,ah:()=>s})}}]);