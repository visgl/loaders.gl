"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[3540],{97513:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>d,contentTitle:()=>i,default:()=>h,frontMatter:()=>o,metadata:()=>a,toc:()=>l});var t=n(85893),s=n(11151);const o={},i="TWKBLoader \ud83c\udd95 \ud83d\udea7",a={id:"modules/wkt/api-reference/twkb-loader",title:"TWKBLoader \ud83c\udd95 \ud83d\udea7",description:"Loader for the Well-known binary format for representation of geometry.",source:"@site/../docs/modules/wkt/api-reference/twkb-loader.md",sourceDirName:"modules/wkt/api-reference",slug:"/modules/wkt/api-reference/twkb-loader",permalink:"/docs/modules/wkt/api-reference/twkb-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/wkt/api-reference/twkb-loader.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"WKBWriter",permalink:"/docs/modules/wkt/api-reference/wkb-writer"},next:{title:"TWKBWriter \ud83c\udd95 \ud83d\udea7",permalink:"/docs/modules/wkt/api-reference/twkb-writer"}},d={},l=[{value:"Installation",id:"installation",level:2},{value:"Usage",id:"usage",level:2},{value:"Options",id:"options",level:2},{value:"Format Summary",id:"format-summary",level:2}];function c(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",img:"img",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,s.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.h1,{id:"twkbloader--",children:"TWKBLoader \ud83c\udd95 \ud83d\udea7"}),"\n",(0,t.jsx)("p",{class:"badges",children:(0,t.jsx)("img",{src:"https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square",alt:"From-v4.0"})}),"\n",(0,t.jsxs)(r.p,{children:["Loader for the ",(0,t.jsx)(r.a,{href:"https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary",children:"Well-known binary"})," format for representation of geometry."]}),"\n",(0,t.jsxs)(r.table,{children:[(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Loader"}),(0,t.jsx)(r.th,{children:"Characteristic"})]})}),(0,t.jsxs)(r.tbody,{children:[(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"File Extension"}),(0,t.jsxs)(r.td,{children:[(0,t.jsx)(r.code,{children:".wkb"}),","]})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"File Type"}),(0,t.jsx)(r.td,{children:"Binary"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"File Format"}),(0,t.jsx)(r.td,{children:"[Tiny Well Known Binary][twkb]"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Data Format"}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.a,{href:"/docs/specifications/category-gis",children:"Geometry"})})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Supported APIs"}),(0,t.jsxs)(r.td,{children:[(0,t.jsx)(r.code,{children:"load"}),", ",(0,t.jsx)(r.code,{children:"parse"}),", ",(0,t.jsx)(r.code,{children:"parseSync"})]})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Decoder Type"}),(0,t.jsx)(r.td,{children:"Synchronous"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Worker Thread Support"}),(0,t.jsx)(r.td,{children:"Yes"})]})]})]}),"\n",(0,t.jsx)(r.h2,{id:"installation",children:"Installation"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-bash",children:"npm install @loaders.gl/wkt\nnpm install @loaders.gl/core\n"})}),"\n",(0,t.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"import {TWKBLoader} from '@loaders.gl/wkt';\nimport {parseSync} from '@loaders.gl/core';\n\n// prettier-ignore\nconst buffer = new Uint8Array([\n  1, 1, 0, 0,   0,  0,  0,\n  0, 0, 0, 0, 240, 63,  0,\n  0, 0, 0, 0,   0,  0, 64\n]).buffer;\nconst data = parseSync(buffer, TWKBLoader);\n// => { positions: { value: Float64Array(2) [ 1, 2 ], size: 2 } }\n"})}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"import {TWKBLoader} from '@loaders.gl/wkt';\nimport {load} from '@loaders.gl/core';\n\nconst data = await load(url, TWKBLoader);\n"})}),"\n",(0,t.jsx)(r.h2,{id:"options",children:"Options"}),"\n",(0,t.jsx)(r.p,{children:"N/A"}),"\n",(0,t.jsx)(r.h2,{id:"format-summary",children:"Format Summary"}),"\n",(0,t.jsxs)(r.p,{children:["Well-known binary (WKB) is a binary geometry encoding to store geometries (it\ndoesn't store attributes). It's used in databases such as PostGIS and as the\ninternal storage format of Shapefiles. It's also being discussed as the internal\nstorage format for a ",(0,t.jsx)(r.a,{href:"https://github.com/geopandas/geo-arrow-spec",children:'"GeoArrow"'}),"\nspecification. WKB is defined starting on page 62 of the ",(0,t.jsx)(r.a,{href:"http://portal.opengeospatial.org/files/?artifact_id=25355",children:"OGC Simple Features\nspecification"}),"."]}),"\n",(0,t.jsxs)(r.p,{children:["It's essentially a binary representation of WKT. For common geospatial types\nincluding (Multi) ",(0,t.jsx)(r.code,{children:"Point"}),", ",(0,t.jsx)(r.code,{children:"Line"}),", and ",(0,t.jsx)(r.code,{children:"Polygon"}),", there's a 1:1 correspondence\nbetween WKT/WKB and GeoJSON. WKT and WKB also support extended geometry types,\nsuch as ",(0,t.jsx)(r.code,{children:"Curve"}),", ",(0,t.jsx)(r.code,{children:"Surface"}),", and ",(0,t.jsx)(r.code,{children:"TIN"}),", which don't have a correspondence to\nGeoJSON."]}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:"Coordinates can be 2-4 dimensions and are interleaved."}),"\n",(0,t.jsx)(r.li,{children:"Positions stored as double precision"}),"\n"]}),"\n",(0,t.jsx)(r.p,{children:(0,t.jsx)(r.img,{src:"https://user-images.githubusercontent.com/15164633/83707157-90413b80-a5d6-11ea-921c-b04208942e79.png",alt:"image"})})]})}function h(e={}){const{wrapper:r}={...(0,s.a)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(c,{...e})}):c(e)}},11151:(e,r,n)=>{n.d(r,{Z:()=>a,a:()=>i});var t=n(67294);const s={},o=t.createContext(s);function i(e){const r=t.useContext(o);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function a(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:i(e.components),t.createElement(o.Provider,{value:r},e.children)}}}]);