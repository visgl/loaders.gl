"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[6411],{24518:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>a,contentTitle:()=>d,default:()=>p,frontMatter:()=>s,metadata:()=>o,toc:()=>l});var i=t(74848),n=t(28453);const s={},d="ZipLoader",o={id:"modules/zip/api-reference/zip-loader",title:"ZipLoader",description:"Decodes a Zip Archive into a file map.",source:"@site/../docs/modules/zip/api-reference/zip-loader.md",sourceDirName:"modules/zip/api-reference",slug:"/modules/zip/api-reference/zip-loader",permalink:"/docs/modules/zip/api-reference/zip-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/zip/api-reference/zip-loader.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"XMLLoader",permalink:"/docs/modules/xml/api-reference/xml-loader"},next:{title:"ArrowWriter",permalink:"/docs/modules/arrow/api-reference/arrow-writer"}},a={},l=[{value:"Usage",id:"usage",level:2},{value:"Data Format",id:"data-format",level:2},{value:"Options",id:"options",level:2}];function c(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,n.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(r.h1,{id:"ziploader",children:"ZipLoader"}),"\n",(0,i.jsx)(r.p,{children:"Decodes a Zip Archive into a file map."}),"\n",(0,i.jsxs)(r.table,{children:[(0,i.jsx)(r.thead,{children:(0,i.jsxs)(r.tr,{children:[(0,i.jsx)(r.th,{children:"Loader"}),(0,i.jsx)(r.th,{children:"Characteristic"})]})}),(0,i.jsxs)(r.tbody,{children:[(0,i.jsxs)(r.tr,{children:[(0,i.jsx)(r.td,{children:"File Extension"}),(0,i.jsx)(r.td,{children:(0,i.jsx)(r.code,{children:".zip"})})]}),(0,i.jsxs)(r.tr,{children:[(0,i.jsx)(r.td,{children:"File Type"}),(0,i.jsx)(r.td,{children:"Binary"})]}),(0,i.jsxs)(r.tr,{children:[(0,i.jsx)(r.td,{children:"File Format"}),(0,i.jsx)(r.td,{children:(0,i.jsx)(r.a,{href:"/docs/modules/zip/formats/zip",children:"ZIP Archive"})})]}),(0,i.jsxs)(r.tr,{children:[(0,i.jsx)(r.td,{children:"Data Format"}),(0,i.jsx)(r.td,{children:'"File Map"'})]}),(0,i.jsxs)(r.tr,{children:[(0,i.jsx)(r.td,{children:"Decoder Type"}),(0,i.jsx)(r.td,{children:"Asynchronous"})]}),(0,i.jsxs)(r.tr,{children:[(0,i.jsx)(r.td,{children:"Worker Thread"}),(0,i.jsx)(r.td,{children:"No"})]}),(0,i.jsxs)(r.tr,{children:[(0,i.jsx)(r.td,{children:"Streaming"}),(0,i.jsx)(r.td,{children:"No"})]})]})]}),"\n",(0,i.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,i.jsx)(r.pre,{children:(0,i.jsx)(r.code,{className:"language-typescript",children:"import {parse} from '@loaders.gl/core';\nimport {ZipLoader} from '@loaders.gl/zip';\n\nconst fileMap = await parse(arrayBuffer, ZipLoader);\nfor (const fileName in FILE_MAP) {\n  const fileData = fileMap[key];\n  // Do something with the subfile\n}\n"})}),"\n",(0,i.jsx)(r.h2,{id:"data-format",children:"Data Format"}),"\n",(0,i.jsxs)(r.p,{children:["The file map is an object with keys representing file names or relative paths in the zip file, and values being the contents of each sub file (either ",(0,i.jsx)(r.code,{children:"ArrayBuffer"})," or ",(0,i.jsx)(r.code,{children:"String"}),")."]}),"\n",(0,i.jsx)(r.h2,{id:"options",children:"Options"}),"\n",(0,i.jsxs)(r.p,{children:["Options are forwarded to ",(0,i.jsx)(r.a,{href:"https://stuk.github.io/jszip/documentation/api_jszip/load_async.html",children:"JSZip.loadAsync"}),"."]})]})}function p(e={}){const{wrapper:r}={...(0,n.R)(),...e.components};return r?(0,i.jsx)(r,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}},28453:(e,r,t)=>{t.d(r,{R:()=>d,x:()=>o});var i=t(96540);const n={},s=i.createContext(n);function d(e){const r=i.useContext(s);return i.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function o(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:d(e.components),i.createElement(s.Provider,{value:r},e.children)}}}]);