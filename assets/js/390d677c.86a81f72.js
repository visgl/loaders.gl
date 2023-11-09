"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[6005],{11363:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>d,contentTitle:()=>i,default:()=>h,frontMatter:()=>o,metadata:()=>a,toc:()=>l});var s=r(85893),t=r(11151);const o={},i="HexWKBLoader \ud83c\udd95 \ud83d\udea7",a={id:"modules/wkt/api-reference/hex-wkb-loader",title:"HexWKBLoader \ud83c\udd95 \ud83d\udea7",description:"ogc-logo",source:"@site/../docs/modules/wkt/api-reference/hex-wkb-loader.md",sourceDirName:"modules/wkt/api-reference",slug:"/modules/wkt/api-reference/hex-wkb-loader",permalink:"/docs/modules/wkt/api-reference/hex-wkb-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/wkt/api-reference/hex-wkb-loader.md",tags:[],version:"current",frontMatter:{}},d={},l=[{value:"Installation",id:"installation",level:2},{value:"Usage",id:"usage",level:2},{value:"Options",id:"options",level:2},{value:"Format Summary",id:"format-summary",level:2}];function c(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",img:"img",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,t.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.h1,{id:"hexwkbloader--",children:"HexWKBLoader \ud83c\udd95 \ud83d\udea7"}),"\n",(0,s.jsx)("p",{class:"badges",children:(0,s.jsx)("img",{src:"https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square",alt:"From-v2.2"})}),"\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.img,{alt:"ogc-logo",src:r(63411).Z+"",width:"119",height:"60"})}),"\n",(0,s.jsxs)(n.p,{children:["Loader for hex encoded ",(0,s.jsx)(n.a,{href:"https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary",children:"Well-known binary"})," format for representation of geometry."]}),"\n",(0,s.jsxs)(n.table,{children:[(0,s.jsx)(n.thead,{children:(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.th,{children:"Loader"}),(0,s.jsx)(n.th,{children:"Characteristic"})]})}),(0,s.jsxs)(n.tbody,{children:[(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"File Extension"}),(0,s.jsxs)(n.td,{children:[(0,s.jsx)(n.code,{children:".wkb"}),","]})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"File Type"}),(0,s.jsx)(n.td,{children:"Binary"})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"File Format"}),(0,s.jsx)(n.td,{children:(0,s.jsx)(n.a,{href:"https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary",children:"Well Known Binary"})})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"Data Format"}),(0,s.jsx)(n.td,{children:(0,s.jsx)(n.a,{href:"/docs/specifications/category-gis",children:"Geometry"})})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"Supported APIs"}),(0,s.jsxs)(n.td,{children:[(0,s.jsx)(n.code,{children:"load"}),", ",(0,s.jsx)(n.code,{children:"parse"}),", ",(0,s.jsx)(n.code,{children:"parseSync"})]})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"Decoder Type"}),(0,s.jsx)(n.td,{children:"Synchronous"})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"Worker Thread Support"}),(0,s.jsx)(n.td,{children:"Yes"})]})]})]}),"\n",(0,s.jsx)(n.h2,{id:"installation",children:"Installation"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"npm install @loaders.gl/wkt\nnpm install @loaders.gl/core\n"})}),"\n",(0,s.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"import {HexWKBLoader} from '@loaders.gl/wkt';\nimport {parseSync} from '@loaders.gl/core';\n\n// prettier-ignore\nconst data = parseSync(data, HexWKBLoader);\n// => { positions: { value: Float64Array(2) [ 1, 2 ], size: 2 } }\n"})}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"import {HexWKBLoader} from '@loaders.gl/wkt';\nimport {load} from '@loaders.gl/core';\n\nconst data = await load(url, HexWKBLoader);\n"})}),"\n",(0,s.jsx)(n.h2,{id:"options",children:"Options"}),"\n",(0,s.jsx)(n.p,{children:"N/A"}),"\n",(0,s.jsx)(n.h2,{id:"format-summary",children:"Format Summary"}),"\n",(0,s.jsxs)(n.p,{children:["Well-known binary (WKB) is a binary geometry encoding to store geometries (it\ndoesn't store attributes). It's used in databases such as PostGIS and as the\ninternal storage format of Shapefiles. It's also being discussed as the internal\nstorage format for a ",(0,s.jsx)(n.a,{href:"https://github.com/geopandas/geo-arrow-spec",children:'"GeoArrow"'}),"\nspecification. WKB is defined starting on page 62 of the ",(0,s.jsx)(n.a,{href:"http://portal.opengeospatial.org/files/?artifact_id=25355",children:"OGC Simple Features\nspecification"}),"."]}),"\n",(0,s.jsxs)(n.p,{children:["It's essentially a binary representation of WKT. For common geospatial types\nincluding (Multi) ",(0,s.jsx)(n.code,{children:"Point"}),", ",(0,s.jsx)(n.code,{children:"Line"}),", and ",(0,s.jsx)(n.code,{children:"Polygon"}),", there's a 1:1 correspondence\nbetween WKT/WKB and GeoJSON. WKT and WKB also support extended geometry types,\nsuch as ",(0,s.jsx)(n.code,{children:"Curve"}),", ",(0,s.jsx)(n.code,{children:"Surface"}),", and ",(0,s.jsx)(n.code,{children:"TIN"}),", which don't have a correspondence to\nGeoJSON."]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Coordinates can be 2-4 dimensions and are interleaved."}),"\n",(0,s.jsx)(n.li,{children:"Positions stored as double precision"}),"\n"]}),"\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.img,{src:"https://user-images.githubusercontent.com/15164633/83707157-90413b80-a5d6-11ea-921c-b04208942e79.png",alt:"image"})})]})}function h(e={}){const{wrapper:n}={...(0,t.a)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}},63411:(e,n,r)=>{r.d(n,{Z:()=>s});const s=r.p+"assets/images/ogc-logo-60-8ee2c25a50ccc14293453512c707a0c4.png"},11151:(e,n,r)=>{r.d(n,{Z:()=>a,a:()=>i});var s=r(67294);const t={},o=s.createContext(t);function i(e){const n=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:i(e.components),s.createElement(o.Provider,{value:n},e.children)}}}]);