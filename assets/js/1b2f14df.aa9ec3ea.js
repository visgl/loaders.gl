"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[6063],{6679:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>a,contentTitle:()=>i,default:()=>h,frontMatter:()=>d,metadata:()=>o,toc:()=>l});var s=t(74848),n=t(28453);const d={},i="NPYLoader",o={id:"modules/textures/api-reference/npy-loader",title:"NPYLoader",description:"The NPYLoader parses an array from the NPY format, a lightweight encoding of multidimensional arrays used by the Python NumPy library.",source:"@site/../docs/modules/textures/api-reference/npy-loader.md",sourceDirName:"modules/textures/api-reference",slug:"/modules/textures/api-reference/npy-loader",permalink:"/docs/modules/textures/api-reference/npy-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/textures/api-reference/npy-loader.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Worker",permalink:"/docs/modules/textures/api-reference/crunch-loader"},next:{title:"VideoLoader",permalink:"/docs/modules/video/api-reference/video-loader"}},a={},l=[{value:"Usage",id:"usage",level:2},{value:"Options",id:"options",level:2}];function c(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,n.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(r.h1,{id:"npyloader",children:"NPYLoader"}),"\n",(0,s.jsx)("p",{class:"badges",children:(0,s.jsx)("img",{src:"https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square",alt:"From-v3.0"})}),"\n",(0,s.jsxs)(r.p,{children:["The ",(0,s.jsx)(r.code,{children:"NPYLoader"})," parses an array from the ",(0,s.jsx)(r.a,{href:"https://numpy.org/doc/stable/reference/generated/numpy.lib.format.html",children:"NPY format"}),", a lightweight encoding of multidimensional arrays used by the Python NumPy library."]}),"\n",(0,s.jsxs)(r.table,{children:[(0,s.jsx)(r.thead,{children:(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.th,{children:"Loader"}),(0,s.jsx)(r.th,{children:"Characteristic"})]})}),(0,s.jsxs)(r.tbody,{children:[(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Extension"}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:".npy"})})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Type"}),(0,s.jsx)(r.td,{children:"Binary"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Format"}),(0,s.jsx)(r.td,{children:"Array"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Data Format"}),(0,s.jsx)(r.td,{children:"Array"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Supported APIs"}),(0,s.jsxs)(r.td,{children:[(0,s.jsx)(r.code,{children:"load"}),", ",(0,s.jsx)(r.code,{children:"parse"}),", ",(0,s.jsx)(r.code,{children:"parseSync"})]})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Decoder Type"}),(0,s.jsx)(r.td,{children:"Synchronous"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Worker Thread Support"}),(0,s.jsx)(r.td,{children:"Yes"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Streaming Support"}),(0,s.jsx)(r.td,{children:"No"})]})]})]}),"\n",(0,s.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-typescript",children:"import {_NPYLoader} from '@loaders.gl/textures';\nimport {load} from '@loaders.gl/core';\n\nconst {data, header} = await load(url, _NPYLoader);\n"})}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.code,{children:"data"})," is a TypedArray containing the array's data."]}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.code,{children:"header"})," is an object with three keys:"]}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"descr"}),": a string describing the data type. E.g. ",(0,s.jsx)(r.code,{children:"|u1"})," refers to ",(0,s.jsx)(r.code,{children:"uint8"})," and ",(0,s.jsx)(r.code,{children:"<u2"})," refers to little-endian ",(0,s.jsx)(r.code,{children:"uint16"}),". Full details are available in the ",(0,s.jsx)(r.a,{href:"https://numpy.org/doc/stable/reference/arrays.dtypes.html",children:"NumPy documentation"}),"."]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"fortran_order"}),": a boolean that is ",(0,s.jsx)(r.code,{children:"true"})," if the array is stored in Fortran order instead of C order."]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"shape"}),": an array of integers that describes the shape of the array. The length of the array corresponds to the number of dimensions of the array."]}),"\n"]}),"\n",(0,s.jsx)(r.h2,{id:"options",children:"Options"}),"\n",(0,s.jsx)(r.p,{children:"Currently no options are supported for this loader."}),"\n",(0,s.jsx)(r.table,{children:(0,s.jsx)(r.thead,{children:(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.th,{children:"Option"}),(0,s.jsx)(r.th,{children:"Type"}),(0,s.jsx)(r.th,{children:"Default"}),(0,s.jsx)(r.th,{children:"Description"})]})})})]})}function h(e={}){const{wrapper:r}={...(0,n.R)(),...e.components};return r?(0,s.jsx)(r,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}},28453:(e,r,t)=>{t.d(r,{R:()=>i,x:()=>o});var s=t(96540);const n={},d=s.createContext(n);function i(e){const r=s.useContext(d);return s.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function o(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:i(e.components),s.createElement(d.Provider,{value:r},e.children)}}}]);