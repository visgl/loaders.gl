"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[8582],{30857:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>o,contentTitle:()=>d,default:()=>h,frontMatter:()=>n,metadata:()=>l,toc:()=>c});var s=t(85893),i=t(11151);const n={},d="KMLLoader",l={id:"modules/kml/api-reference/kml-loader",title:"KMLLoader",description:"ogc-logo",source:"@site/../docs/modules/kml/api-reference/kml-loader.md",sourceDirName:"modules/kml/api-reference",slug:"/modules/kml/api-reference/kml-loader",permalink:"/docs/modules/kml/api-reference/kml-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/kml/api-reference/kml-loader.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"GPXLoader",permalink:"/docs/modules/kml/api-reference/gpx-loader"},next:{title:"TCXLoader",permalink:"/docs/modules/kml/api-reference/tcx-loader"}},o={},c=[{value:"Usage",id:"usage",level:2},{value:"Options",id:"options",level:2},{value:"Limitations",id:"limitations",level:2}];function a(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",img:"img",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,i.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(r.h1,{id:"kmlloader",children:"KMLLoader"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.img,{alt:"ogc-logo",src:t(63411).Z+"",width:"119",height:"60"})}),"\n",(0,s.jsxs)(r.p,{children:["The ",(0,s.jsx)(r.code,{children:"KMLLoader"})," parses ",(0,s.jsx)(r.a,{href:"https://en.wikipedia.org/wiki/Keyhole_Markup_Language",children:"KML files"})," into GeoJSON. From Wikipedia:"]}),"\n",(0,s.jsxs)(r.table,{children:[(0,s.jsx)(r.thead,{children:(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.th,{children:"Loader"}),(0,s.jsx)(r.th,{children:"Characteristic"})]})}),(0,s.jsxs)(r.tbody,{children:[(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Extension"}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:".kml"})})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Type"}),(0,s.jsx)(r.td,{children:"Text"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Format"}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"https://en.wikipedia.org/wiki/Keyhole_Markup_Language",children:"KML"})})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Data Format"}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"/docs/specifications/category-gis",children:"GIS"})})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Decoder Type"}),(0,s.jsx)(r.td,{children:"Synchronous"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Worker Thread Support"}),(0,s.jsx)(r.td,{children:"No"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Streaming Support"}),(0,s.jsx)(r.td,{children:"No"})]})]})]}),"\n",(0,s.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-typescript",children:"import {KMLLoader} from '@loaders.gl/kml';\nimport {load} from '@loaders.gl/core';\n\nconst data = await load(url, KMLLoader, options);\n"})}),"\n",(0,s.jsx)(r.h2,{id:"options",children:"Options"}),"\n",(0,s.jsxs)(r.table,{children:[(0,s.jsx)(r.thead,{children:(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.th,{children:"Option"}),(0,s.jsx)(r.th,{children:"Type"}),(0,s.jsx)(r.th,{children:"Default"}),(0,s.jsx)(r.th,{children:"Description"})]})}),(0,s.jsx)(r.tbody,{children:(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"gis.format"})}),(0,s.jsx)(r.td,{children:"string"}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"'geojson'"})}),(0,s.jsxs)(r.td,{children:["Can be set to ",(0,s.jsx)(r.code,{children:"'raw'"}),", ",(0,s.jsx)(r.code,{children:"'geojson'"})," or ",(0,s.jsx)(r.code,{children:"'binary'"}),"."]})]})})]}),"\n",(0,s.jsx)(r.h2,{id:"limitations",children:"Limitations"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:["In Node.JS, applications must import ",(0,s.jsx)(r.code,{children:"@loaders.gl/polyfills"})," for the ",(0,s.jsx)(r.code,{children:"DOMParser"})," polyfill."]}),"\n"]})]})}function h(e={}){const{wrapper:r}={...(0,i.a)(),...e.components};return r?(0,s.jsx)(r,{...e,children:(0,s.jsx)(a,{...e})}):a(e)}},63411:(e,r,t)=>{t.d(r,{Z:()=>s});const s=t.p+"assets/images/ogc-logo-60-8ee2c25a50ccc14293453512c707a0c4.png"},11151:(e,r,t)=>{t.d(r,{Z:()=>l,a:()=>d});var s=t(67294);const i={},n=s.createContext(i);function d(e){const r=s.useContext(n);return s.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function l(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:d(e.components),s.createElement(n.Provider,{value:r},e.children)}}}]);