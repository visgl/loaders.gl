"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[5759],{35922:(e,d,r)=>{r.r(d),r.d(d,{assets:()=>i,contentTitle:()=>n,default:()=>a,frontMatter:()=>o,metadata:()=>c,toc:()=>A});var s=r(85893),t=r(11151);const o={},n="DracoLoader",c={id:"modules/draco/api-reference/draco-loader",title:"DracoLoader",description:"logo",source:"@site/../docs/modules/draco/api-reference/draco-loader.md",sourceDirName:"modules/draco/api-reference",slug:"/modules/draco/api-reference/draco-loader",permalink:"/docs/modules/draco/api-reference/draco-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/draco/api-reference/draco-loader.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"CSVLoader",permalink:"/docs/modules/csv/api-reference/csv-loader"},next:{title:"DracoWriter",permalink:"/docs/modules/draco/api-reference/draco-writer"}},i={},A=[{value:"Usage",id:"usage",level:2},{value:"Options",id:"options",level:2},{value:"Dependencies",id:"dependencies",level:2}];function l(e){const d={a:"a",code:"code",h1:"h1",h2:"h2",img:"img",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,t.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(d.h1,{id:"dracoloader",children:"DracoLoader"}),"\n",(0,s.jsx)(d.p,{children:(0,s.jsx)(d.img,{alt:"logo",src:r(34154).Z+"",width:"200",height:"153"})}),"\n",(0,s.jsxs)(d.p,{children:["The ",(0,s.jsx)(d.code,{children:"DracoLoader"})," decodes a mesh or point cloud (maps of attributes) using ",(0,s.jsx)(d.a,{href:"https://google.github.io/draco/",children:"DRACO"})," compression."]}),"\n",(0,s.jsxs)(d.table,{children:[(0,s.jsx)(d.thead,{children:(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.th,{children:"Loader"}),(0,s.jsx)(d.th,{children:"Characteristic"})]})}),(0,s.jsxs)(d.tbody,{children:[(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"File Extension"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:".drc"})})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"File Type"}),(0,s.jsx)(d.td,{children:"Binary"})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"File Format"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.a,{href:"https://google.github.io/draco/",children:"Draco"})})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"Data Format"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.a,{href:"/docs/specifications/category-mesh",children:"Mesh"})})]}),(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.td,{children:"Supported APIs"}),(0,s.jsx)(d.td,{children:(0,s.jsx)(d.code,{children:"parse"})})]})]})]}),"\n",(0,s.jsx)(d.p,{children:"Features:"}),"\n",(0,s.jsxs)(d.ul,{children:["\n",(0,s.jsx)(d.li,{children:"Supports meshes and point clouds."}),"\n",(0,s.jsx)(d.li,{children:"Supports custom attributes."}),"\n",(0,s.jsx)(d.li,{children:"Extracts metadata dictionaries, both for the full mesh and for each attribute."}),"\n",(0,s.jsxs)(d.li,{children:["Supports all Draco metadata field types, including ",(0,s.jsx)(d.code,{children:"Int32Array"}),"."]}),"\n",(0,s.jsx)(d.li,{children:"Loads draco decoders dynamically from CDN (can optionally be bundled)."}),"\n",(0,s.jsx)(d.li,{children:"Ability to prevent decompression of specific attributes (returns quantization or octahedron transform parameters)."}),"\n"]}),"\n",(0,s.jsx)(d.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(d.pre,{children:(0,s.jsx)(d.code,{className:"language-typescript",children:"import {DracoLoader} from '@loaders.gl/draco';\nimport {load} from '@loaders.gl/core';\n\nconst data = await load(url, DracoLoader, options);\n"})}),"\n",(0,s.jsx)(d.h2,{id:"options",children:"Options"}),"\n",(0,s.jsx)(d.table,{children:(0,s.jsx)(d.thead,{children:(0,s.jsxs)(d.tr,{children:[(0,s.jsx)(d.th,{children:"Option"}),(0,s.jsx)(d.th,{children:"Type"}),(0,s.jsx)(d.th,{children:"Default"}),(0,s.jsx)(d.th,{children:"Description"})]})})}),"\n",(0,s.jsx)(d.h2,{id:"dependencies",children:"Dependencies"}),"\n",(0,s.jsx)(d.p,{children:"Draco libraries by default are loaded from CDN, but can be bundled and injected. See [modules/draco/docs] for details."})]})}function a(e={}){const{wrapper:d}={...(0,t.a)(),...e.components};return d?(0,s.jsx)(d,{...e,children:(0,s.jsx)(l,{...e})}):l(e)}},34154:(e,d,r)=>{r.d(d,{Z:()=>s});const s="data:image/png;base64,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"},11151:(e,d,r)=>{r.d(d,{Z:()=>c,a:()=>n});var s=r(67294);const t={},o=s.createContext(t);function n(e){const d=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(d):{...d,...e}}),[d,e])}function c(e){let d;return d=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:n(e.components),s.createElement(o.Provider,{value:d},e.children)}}}]);