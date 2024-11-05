"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[8194],{53585:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>c,contentTitle:()=>o,default:()=>h,frontMatter:()=>d,metadata:()=>i,toc:()=>l});var s=t(74848),n=t(28453);const d={},o="Worker",i={id:"modules/textures/api-reference/crunch-loader",title:"Worker",description:"Loader for compressed textures in the Crunch file format",source:"@site/../docs/modules/textures/api-reference/crunch-loader.md",sourceDirName:"modules/textures/api-reference",slug:"/modules/textures/api-reference/crunch-loader",permalink:"/docs/modules/textures/api-reference/crunch-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/textures/api-reference/crunch-loader.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"CompressedTextureLoader",permalink:"/docs/modules/textures/api-reference/compressed-texture-loader"},next:{title:"NPYLoader",permalink:"/docs/modules/textures/api-reference/npy-loader"}},c={},l=[{value:"Usage",id:"usage",level:2},{value:"Data Format",id:"data-format",level:2},{value:"Options",id:"options",level:2}];function a(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,n.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(r.h1,{id:"worker",children:"Worker"}),"\n",(0,s.jsx)("p",{class:"badges",children:(0,s.jsx)("img",{src:"https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square",alt:"From-v3.0"})}),"\n",(0,s.jsx)(r.p,{children:"Loader for compressed textures in the Crunch file format"}),"\n",(0,s.jsxs)(r.table,{children:[(0,s.jsx)(r.thead,{children:(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.th,{children:"Loader"}),(0,s.jsx)(r.th,{children:"Characteristic"})]})}),(0,s.jsxs)(r.tbody,{children:[(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Format"}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"https://github.com/BinomialLLC/crunch",children:"CRN"})})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Extension"}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:".crn"})})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Type"}),(0,s.jsx)(r.td,{children:"Binary"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Data Format"}),(0,s.jsx)(r.td,{children:"Array of compressed image data objects"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Supported APIs"}),(0,s.jsxs)(r.td,{children:[(0,s.jsx)(r.code,{children:"load"}),", ",(0,s.jsx)(r.code,{children:"parse"})]})]})]})]}),"\n",(0,s.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-typescript",children:"import {CrunchWorkerLoader} from '@loaders.gl/textures';\nimport {load} from '@loaders.gl/core';\n\nconst mipLevels = await load(url, CrunchWorkerLoader);\nfor (const image of mipLevels) {\n  ...\n}\n"})}),"\n",(0,s.jsx)(r.h2,{id:"data-format",children:"Data Format"}),"\n",(0,s.jsx)(r.p,{children:"Returns an array of image data objects representing mip levels."}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.code,{children:"{compressed: true, format, width, height, data: ..., levelSize}"})}),"\n",(0,s.jsx)(r.h2,{id:"options",children:"Options"}),"\n",(0,s.jsxs)(r.table,{children:[(0,s.jsx)(r.thead,{children:(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.th,{children:"Option"}),(0,s.jsx)(r.th,{children:"Type"}),(0,s.jsx)(r.th,{children:"Default"}),(0,s.jsx)(r.th,{children:"Description"})]})}),(0,s.jsx)(r.tbody,{children:(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"N/A"}),(0,s.jsx)(r.td,{}),(0,s.jsx)(r.td,{}),(0,s.jsx)(r.td,{})]})})]})]})}function h(e={}){const{wrapper:r}={...(0,n.R)(),...e.components};return r?(0,s.jsx)(r,{...e,children:(0,s.jsx)(a,{...e})}):a(e)}},28453:(e,r,t)=>{t.d(r,{R:()=>o,x:()=>i});var s=t(96540);const n={},d=s.createContext(n);function o(e){const r=s.useContext(d);return s.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function i(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:o(e.components),s.createElement(d.Provider,{value:r},e.children)}}}]);