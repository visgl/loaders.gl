"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[2253],{99784:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>i,contentTitle:()=>d,default:()=>h,frontMatter:()=>o,metadata:()=>a,toc:()=>l});var r=s(85893),n=s(11151);const o={},d="GMLLoader",a={id:"modules/wms/api-reference/gml-loader",title:"GMLLoader",description:"ogc-logo",source:"@site/../docs/modules/wms/api-reference/gml-loader.md",sourceDirName:"modules/wms/api-reference",slug:"/modules/wms/api-reference/gml-loader",permalink:"/docs/modules/wms/api-reference/gml-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/wms/api-reference/gml-loader.md",tags:[],version:"current",frontMatter:{}},i={},l=[{value:"Usage",id:"usage",level:2},{value:"Parsed Data Format",id:"parsed-data-format",level:2},{value:"Options",id:"options",level:2}];function c(e){const t={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",img:"img",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,n.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.h1,{id:"gmlloader",children:"GMLLoader"}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"ogc-logo",src:s(63411).Z+"",width:"119",height:"60"})}),"\n",(0,r.jsxs)("p",{class:"badges",children:[(0,r.jsx)("img",{src:"https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square",alt:"From-3.3"}),(0,r.jsx)(t.p,{children:"\xa0"}),(0,r.jsx)("img",{src:"https://img.shields.io/badge/-BETA-teal.svg",alt:"BETA"})]}),"\n",(0,r.jsxs)(t.p,{children:["The ",(0,r.jsx)(t.code,{children:"GMLLoader"})," parses the XML-formatted response from the\nthe ",(0,r.jsx)(t.a,{href:"https://www.opengeospatial.org/",children:"OGC"}),"-standardized ",(0,r.jsx)(t.a,{href:"https://www.ogc.org/standards/wms",children:"GML"})," (Geographic Markup Language) file format into a standard geospatial feature table."]}),"\n",(0,r.jsxs)(t.blockquote,{children:["\n",(0,r.jsx)(t.p,{children:"Note that the GML standard is very ambitious and full support of the format is out of scope."}),"\n"]}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Loader"}),(0,r.jsx)(t.th,{children:"Characteristic"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"File Extension"}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.code,{children:".gml"})})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"File Type"}),(0,r.jsx)(t.td,{children:"Text"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"File Format"}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.a,{href:"https://en.wikipedia.org/wiki/Web_Map_Service",children:"GML"})})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"Data Format"}),(0,r.jsx)(t.td,{children:"Data structure"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"Decoder Type"}),(0,r.jsx)(t.td,{children:"Synchronous"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"Worker Thread Support"}),(0,r.jsx)(t.td,{children:"Yes"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"Streaming Support"}),(0,r.jsx)(t.td,{children:"No"})]})]})]}),"\n",(0,r.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-typescript",children:"import {GMLLoader} from '@loaders.gl/wms';\nimport {load} from '@loaders.gl/core';\n\n// Form a GML request\nconst url = `${WFS_SERVICE_URL}?REQUEST=GetFeature&...`;\n\nconst data = await load(url, GMLLoader, options);\n"})}),"\n",(0,r.jsx)(t.h2,{id:"parsed-data-format",children:"Parsed Data Format"}),"\n",(0,r.jsxs)(t.p,{children:["The ",(0,r.jsx)(t.code,{children:"GMLLoader"}),' only supports parsing the standard geospatial subset of features (points, multipoints, lines, linestrings, polygons and multipolygons), on a "best effort" basis. Because of this, the ',(0,r.jsx)(t.code,{children:"GMLLoader"})," is treated as a geospatial loader and can return GeoJSON style output."]}),"\n",(0,r.jsx)(t.h2,{id:"options",children:"Options"}),"\n",(0,r.jsx)(t.table,{children:(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Option"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Default"}),(0,r.jsx)(t.th,{children:"Description"})]})})})]})}function h(e={}){const{wrapper:t}={...(0,n.a)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(c,{...e})}):c(e)}},63411:(e,t,s)=>{s.d(t,{Z:()=>r});const r=s.p+"assets/images/ogc-logo-60-8ee2c25a50ccc14293453512c707a0c4.png"},11151:(e,t,s)=>{s.d(t,{Z:()=>a,a:()=>d});var r=s(67294);const n={},o=r.createContext(n);function d(e){const t=r.useContext(o);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:d(e.components),r.createElement(o.Provider,{value:t},e.children)}}}]);