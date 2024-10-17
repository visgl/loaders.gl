"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[3573],{97705:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>l,contentTitle:()=>n,default:()=>h,frontMatter:()=>i,metadata:()=>o,toc:()=>d});var s=r(62540),c=r(43023);const i={},n="MVTSource",o={id:"modules/mvt/api-reference/mvt-source",title:"MVTSource",description:"The MVTSource dynamically loads tiles, typically from big pre-tiled hierarchies on cloud storage.",source:"@site/../docs/modules/mvt/api-reference/mvt-source.md",sourceDirName:"modules/mvt/api-reference",slug:"/modules/mvt/api-reference/mvt-source",permalink:"/docs/modules/mvt/api-reference/mvt-source",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/mvt/api-reference/mvt-source.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"PMTilesSource",permalink:"/docs/modules/pmtiles/api-reference/pmtiles-source"},next:{title:"TableTileSource",permalink:"/docs/modules/mvt/api-reference/table-tile-source"}},l={},d=[{value:"Usage",id:"usage",level:2},{value:"Options",id:"options",level:2}];function a(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",header:"header",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,c.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.header,{children:(0,s.jsx)(t.h1,{id:"mvtsource",children:"MVTSource"})}),"\n",(0,s.jsx)("p",{class:"badges",children:(0,s.jsx)("img",{src:"https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square",alt:"From-v4.0"})}),"\n",(0,s.jsxs)(t.p,{children:["The ",(0,s.jsx)(t.code,{children:"MVTSource"})," dynamically loads tiles, typically from big pre-tiled hierarchies on cloud storage."]}),"\n",(0,s.jsxs)(t.table,{children:[(0,s.jsx)(t.thead,{children:(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.th,{children:"Source"}),(0,s.jsx)(t.th,{children:"Characteristic"})]})}),(0,s.jsxs)(t.tbody,{children:[(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"File Extension"}),(0,s.jsxs)(t.td,{children:[(0,s.jsx)(t.code,{children:".mvt"})," ",(0,s.jsx)(t.code,{children:".tilejson"})]})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"File Type"}),(0,s.jsx)(t.td,{children:"Binary Archive"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"File Format"}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"/docs/modules/mvt/formats/mvt",children:"Mapbox Vector Tiles"})})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"Data Format"}),(0,s.jsx)(t.td,{children:"GeoJSON"})]})]})]}),"\n",(0,s.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"import {createDataSource} from '@loaders.gl/core';\nimport {MVTSource} from '@loaders.gl/pmtiles';\n\nconst source = createDataSource(url, [MVTSource]);\nconst tile = await source.getTile(...);\n"})}),"\n",(0,s.jsx)(t.h2,{id:"options",children:"Options"}),"\n",(0,s.jsx)(t.table,{children:(0,s.jsx)(t.thead,{children:(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.th,{children:"Option"}),(0,s.jsx)(t.th,{children:"Type"}),(0,s.jsx)(t.th,{children:"Default"}),(0,s.jsx)(t.th,{children:"Description"})]})})})]})}function h(e={}){const{wrapper:t}={...(0,c.R)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(a,{...e})}):a(e)}},43023:(e,t,r)=>{r.d(t,{R:()=>n,x:()=>o});var s=r(63696);const c={},i=s.createContext(c);function n(e){const t=s.useContext(i);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function o(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(c):e.components||c:n(e.components),s.createElement(i.Provider,{value:t},e.children)}}}]);