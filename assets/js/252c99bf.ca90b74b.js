"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[3607],{89461:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>i,contentTitle:()=>d,default:()=>h,frontMatter:()=>a,metadata:()=>o,toc:()=>c});var s=r(62540),n=r(43023);const a={},d="WMSFeatureInfoLoader",o={id:"modules/wms/api-reference/wms-feature-info-loader",title:"WMSFeatureInfoLoader",description:"ogc-logo",source:"@site/../docs/modules/wms/api-reference/wms-feature-info-loader.md",sourceDirName:"modules/wms/api-reference",slug:"/modules/wms/api-reference/wms-feature-info-loader",permalink:"/docs/modules/wms/api-reference/wms-feature-info-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/wms/api-reference/wms-feature-info-loader.md",tags:[],version:"current",frontMatter:{}},i={},c=[{value:"Usage",id:"usage",level:2},{value:"Parsed Data Format",id:"parsed-data-format",level:2},{value:"Options",id:"options",level:2}];function l(e){const t={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",header:"header",img:"img",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,n.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.header,{children:(0,s.jsx)(t.h1,{id:"wmsfeatureinfoloader",children:"WMSFeatureInfoLoader"})}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.img,{alt:"ogc-logo",src:r(9215).A+"",width:"119",height:"60"})}),"\n",(0,s.jsxs)("p",{class:"badges",children:[(0,s.jsx)("img",{src:"https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square",alt:"From-v3.3"}),(0,s.jsx)(t.p,{children:"\xa0"}),(0,s.jsx)("img",{src:"https://img.shields.io/badge/-BETA-teal.svg",alt:"BETA"})]}),"\n",(0,s.jsxs)(t.p,{children:["The ",(0,s.jsx)(t.code,{children:"WMSFeatureInfoLoader"})," parses the XML-formatted response from the\nthe ",(0,s.jsx)(t.a,{href:"https://www.opengeospatial.org/",children:"OGC"})," ",(0,s.jsx)(t.a,{href:"https://www.ogc.org/standards/wms",children:"WMS"})," (Web Map Service) standard ",(0,s.jsx)(t.code,{children:"GetFeatureInfo"})," request into a typed JavaScript data structure."]}),"\n",(0,s.jsxs)(t.blockquote,{children:["\n",(0,s.jsxs)(t.p,{children:["Note that the WMS standard is rather verbose and the XML responses can contain many rarely used metadata fields, not all of which are extracted by this loader. If this is a problem, it is possible to use the ",(0,s.jsx)(t.code,{children:"XMLLoader"})," directly though the result will be untyped and not normalized."]}),"\n"]}),"\n",(0,s.jsxs)(t.table,{children:[(0,s.jsx)(t.thead,{children:(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.th,{children:"Loader"}),(0,s.jsx)(t.th,{children:"Characteristic"})]})}),(0,s.jsxs)(t.tbody,{children:[(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"File Extension"}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:".xml"})})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"File Type"}),(0,s.jsx)(t.td,{children:"Text"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"File Format"}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"https://en.wikipedia.org/wiki/Web_Map_Service",children:"WMS"})})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"Data Format"}),(0,s.jsx)(t.td,{children:"Data structure"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"Decoder Type"}),(0,s.jsx)(t.td,{children:"Synchronous"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"Worker Thread Support"}),(0,s.jsx)(t.td,{children:"No"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"Streaming Support"}),(0,s.jsx)(t.td,{children:"No"})]})]})]}),"\n",(0,s.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"import {WMSFeatureInfoLoader} from '@loaders.gl/wms';\nimport {load} from '@loaders.gl/core';\n\n// Form a WMS request\nconst url = `${WMS_SERVICE_URL}?REQUEST=GetFeatureInfo&LAYER=...`;\n\nconst data = (await load(url, WMSFeatureInfoLoader, options)) as WMSFeatureInfo;\n"})}),"\n",(0,s.jsx)(t.h2,{id:"parsed-data-format",children:"Parsed Data Format"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"/** All capabilities of a WMS service. Typed data structure extracted from XML */\nexport type WMSFeatureInfo = {\n  // TO BE DOCUMENTED\n};\n"})}),"\n",(0,s.jsx)(t.h2,{id:"options",children:"Options"}),"\n",(0,s.jsx)(t.table,{children:(0,s.jsx)(t.thead,{children:(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.th,{children:"Option"}),(0,s.jsx)(t.th,{children:"Type"}),(0,s.jsx)(t.th,{children:"Default"}),(0,s.jsx)(t.th,{children:"Description"})]})})})]})}function h(e={}){const{wrapper:t}={...(0,n.R)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(l,{...e})}):l(e)}},9215:(e,t,r)=>{r.d(t,{A:()=>s});const s=r.p+"assets/images/ogc-logo-60-8ee2c25a50ccc14293453512c707a0c4.png"},43023:(e,t,r)=>{r.d(t,{R:()=>d,x:()=>o});var s=r(63696);const n={},a=s.createContext(n);function d(e){const t=s.useContext(a);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function o(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:d(e.components),s.createElement(a.Provider,{value:t},e.children)}}}]);