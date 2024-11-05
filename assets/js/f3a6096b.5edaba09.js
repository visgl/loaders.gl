"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[7290],{90736:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>c,contentTitle:()=>d,default:()=>h,frontMatter:()=>t,metadata:()=>a,toc:()=>i});var s=r(74848),o=r(28453);const t={},d="NDJSONLoader",a={id:"modules/json/api-reference/ndjson-loader",title:"NDJSONLoader",description:"Streaming loader for NDJSON encoded files and related formats (LDJSON and JSONL).",source:"@site/../docs/modules/json/api-reference/ndjson-loader.md",sourceDirName:"modules/json/api-reference",slug:"/modules/json/api-reference/ndjson-loader",permalink:"/docs/modules/json/api-reference/ndjson-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/json/api-reference/ndjson-loader.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"JSONLoader",permalink:"/docs/modules/json/api-reference/json-loader"},next:{title:"GeoJSONLoader",permalink:"/docs/modules/json/api-reference/geojson-loader"}},c={},i=[{value:"Usage",id:"usage",level:2},{value:"Data Format",id:"data-format",level:2},{value:"Options",id:"options",level:2}];function l(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,o.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.h1,{id:"ndjsonloader",children:"NDJSONLoader"}),"\n",(0,s.jsx)(n.p,{children:"Streaming loader for NDJSON encoded files and related formats (LDJSON and JSONL)."}),"\n",(0,s.jsxs)(n.table,{children:[(0,s.jsx)(n.thead,{children:(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.th,{children:"Loader"}),(0,s.jsx)(n.th,{children:"Characteristic"})]})}),(0,s.jsxs)(n.tbody,{children:[(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"File Extension"}),(0,s.jsxs)(n.td,{children:[(0,s.jsx)(n.code,{children:".ndjson"}),", ",(0,s.jsx)(n.code,{children:".jsonl"}),", ",(0,s.jsx)(n.code,{children:".ldjson"})]})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"Media Type"}),(0,s.jsxs)(n.td,{children:[(0,s.jsx)(n.code,{children:"application/x-ndjson"}),", ",(0,s.jsx)(n.code,{children:"application/x-ldjson"}),", ",(0,s.jsx)(n.code,{children:"application/json-seq"})]})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"File Type"}),(0,s.jsx)(n.td,{children:"Text"})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"File Format"}),(0,s.jsxs)(n.td,{children:[(0,s.jsx)(n.a,{href:"http://ndjson.org/",children:"NDJSON"}),", [LDJSON][format_], [][format_]"]})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"Data Format"}),(0,s.jsx)(n.td,{children:(0,s.jsx)(n.a,{href:"/docs/specifications/category-table",children:"Classic Table"})})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"Supported APIs"}),(0,s.jsxs)(n.td,{children:[(0,s.jsx)(n.code,{children:"load"}),", ",(0,s.jsx)(n.code,{children:"parse"}),", ",(0,s.jsx)(n.code,{children:"parseSync"}),", ",(0,s.jsx)(n.code,{children:"parseInBatches"})]})]})]})]}),"\n",(0,s.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"import {NDJSONLoader} from '@loaders.gl/json';\nimport {load} from '@loaders.gl/core';\n\nconst data = await load(url, NDJSONLoader, {ndjson: options});\n"})}),"\n",(0,s.jsx)(n.p,{children:'The NDJSONLoader supports streaming NDJSON parsing, in which case it will yield "batches" of rows, where each row is a parsed line from the NDJSON stream.'}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"import {NDJSONLoader} from '@loaders.gl/json';\nimport {loadInBatches} from '@loaders.gl/core';\n\nconst batches = await loadInBatches('ndjson.ndjson', NDJSONLoader);\n\nfor await (const batch of batches) {\n  // batch.data will contain a number of rows\n  for (const obj of batch.data) {\n    // Process obj\n    ...\n  }\n}\n"})}),"\n",(0,s.jsx)(n.h2,{id:"data-format",children:"Data Format"}),"\n",(0,s.jsx)(n.p,{children:"Parsed batches are of the format."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"{\n  // standard batch payload\n  data: any[] | any;\n  bytesUsed: number;\n  batchCount: number;\n}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Each element in the ",(0,s.jsx)(n.code,{children:"data"})," array corresponds to a line (Object) in the NDJSON data."]}),"\n",(0,s.jsx)(n.h2,{id:"options",children:"Options"}),"\n",(0,s.jsxs)(n.p,{children:["Supports the table category options such as ",(0,s.jsx)(n.code,{children:"batchSize"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(l,{...e})}):l(e)}},28453:(e,n,r)=>{r.d(n,{R:()=>d,x:()=>a});var s=r(96540);const o={},t=s.createContext(o);function d(e){const n=s.useContext(t);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:d(e.components),s.createElement(t.Provider,{value:n},e.children)}}}]);