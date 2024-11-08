"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[5979],{35573:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>i,contentTitle:()=>c,default:()=>a,frontMatter:()=>n,metadata:()=>o,toc:()=>l});var t=s(62540),d=s(43023);const n={},c="DracoWriter",o={id:"modules/draco/images/draco-writer",title:"DracoWriter",description:"The DracoWriter encodes a mesh or point cloud (maps of attributes) using Draco3D compression.",source:"@site/../docs/modules/draco/images/draco-writer.md",sourceDirName:"modules/draco/images",slug:"/modules/draco/images/draco-writer",permalink:"/docs/modules/draco/images/draco-writer",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/draco/images/draco-writer.md",tags:[],version:"current",frontMatter:{}},i={},l=[{value:"Usage",id:"usage",level:2},{value:"Options",id:"options",level:2}];function h(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",header:"header",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,d.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.header,{children:(0,t.jsx)(r.h1,{id:"dracowriter",children:"DracoWriter"})}),"\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.code,{children:"DracoWriter"})," encodes a mesh or point cloud (maps of attributes) using ",(0,t.jsx)(r.a,{href:"https://google.github.io/draco/",children:"Draco3D"})," compression."]}),"\n",(0,t.jsxs)(r.table,{children:[(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Loader"}),(0,t.jsx)(r.th,{children:"Characteristic"})]})}),(0,t.jsxs)(r.tbody,{children:[(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"File Extension"}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:".drc"})})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"File Typoe"}),(0,t.jsx)(r.td,{children:"Binary"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Data Format"}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.a,{href:"/docs/specifications/category-mesh",children:"Mesh"})})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"File Format"}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.a,{href:"https://google.github.io/draco/",children:"Draco"})})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Encoder Type"}),(0,t.jsx)(r.td,{children:"Synchronous"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Worker Thread Support"}),(0,t.jsx)(r.td,{children:"Yes"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Streaming Support"}),(0,t.jsx)(r.td,{children:"No"})]})]})]}),"\n",(0,t.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"import {DracoWriter} from '@loaders.gl/draco';\nimport {encode} from '@loaders.gl/core';\n\nconst mesh = {\n  attributes: {\n    POSITION: {...}\n  }\n};\n\nconst data = await encode(mesh, DracoWriter, options);\n"})}),"\n",(0,t.jsx)(r.h2,{id:"options",children:"Options"}),"\n",(0,t.jsxs)(r.table,{children:[(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Option"}),(0,t.jsx)(r.th,{children:"Type"}),(0,t.jsx)(r.th,{children:"Default"}),(0,t.jsx)(r.th,{children:"Description"})]})}),(0,t.jsxs)(r.tbody,{children:[(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"pointcloud"})}),(0,t.jsx)(r.td,{children:"Boolean"}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"false"})}),(0,t.jsxs)(r.td,{children:["set to ",(0,t.jsx)(r.code,{children:"true"})," to compress pointclouds (mode=",(0,t.jsx)(r.code,{children:"0"})," and no ",(0,t.jsx)(r.code,{children:"indices"}),")."]})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"method"})}),(0,t.jsx)(r.td,{children:"String"}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"MESH_EDGEBREAKER_ENCODING"})}),(0,t.jsx)(r.td,{children:"set Draco encoding method (applies to meshes only)."})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"speed"})}),(0,t.jsx)(r.td,{children:"[Number, Number]"}),(0,t.jsx)(r.td,{children:"set Draco speed options."}),(0,t.jsx)(r.td,{})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"log"})}),(0,t.jsx)(r.td,{children:"Function"}),(0,t.jsx)(r.td,{children:"callback for debug info."}),(0,t.jsx)(r.td,{})]})]})]})]})}function a(e={}){const{wrapper:r}={...(0,d.R)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(h,{...e})}):h(e)}},43023:(e,r,s)=>{s.d(r,{R:()=>c,x:()=>o});var t=s(63696);const d={},n=t.createContext(d);function c(e){const r=t.useContext(n);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function o(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(d):e.components||d:c(e.components),t.createElement(n.Provider,{value:r},e.children)}}}]);