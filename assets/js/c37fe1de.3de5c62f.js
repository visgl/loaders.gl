"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[6305],{26168:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>i,contentTitle:()=>o,default:()=>h,frontMatter:()=>r,metadata:()=>c,toc:()=>d});var n=s(62540),a=s(43023);const r={},o="Schemas",c={id:"arrowjs/developer-guide/schemas",title:"Schemas",description:"The Schema class stores a list of Field instances that provide",source:"@site/../docs/arrowjs/developer-guide/schemas.md",sourceDirName:"arrowjs/developer-guide",slug:"/arrowjs/developer-guide/schemas",permalink:"/docs/arrowjs/developer-guide/schemas",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/developer-guide/schemas.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Data Types",permalink:"/docs/arrowjs/developer-guide/data-types"},next:{title:"Working with Tables",permalink:"/docs/arrowjs/developer-guide/tables"}},i={},d=[{value:"Create a new Schema",id:"create-a-new-schema",level:3},{value:"Working with Arrow Schemas",id:"working-with-arrow-schemas",level:3}];function l(e){const t={admonition:"admonition",code:"code",h1:"h1",h3:"h3",header:"header",p:"p",pre:"pre",...(0,a.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.header,{children:(0,n.jsx)(t.h1,{id:"schemas",children:"Schemas"})}),"\n",(0,n.jsxs)(t.p,{children:["The ",(0,n.jsx)(t.code,{children:"Schema"})," class stores a list of ",(0,n.jsx)(t.code,{children:"Field"})," instances that provide\ninformation about the columns in a table: name, data type and nullability."]}),"\n",(0,n.jsxs)(t.p,{children:["A ",(0,n.jsx)(t.code,{children:"Schema"})," can also contain metadata, both on the table level and on each Field."]}),"\n",(0,n.jsxs)(t.p,{children:["Every ",(0,n.jsx)(t.code,{children:"Table"})," and ",(0,n.jsx)(t.code,{children:"RecordBatch"})," contains a ",(0,n.jsx)(t.code,{children:"Schema"})," instance."]}),"\n",(0,n.jsx)(t.admonition,{type:"info",children:(0,n.jsxs)(t.p,{children:["Note that since Arrow allows for composite columns (",(0,n.jsx)(t.code,{children:"List"}),", ",(0,n.jsx)(t.code,{children:"Struct"}),", ",(0,n.jsx)(t.code,{children:"Map_"})," etc),\ndata types can contain nested ",(0,n.jsx)(t.code,{children:"Field"})," objects."]})}),"\n",(0,n.jsx)(t.h3,{id:"create-a-new-schema",children:"Create a new Schema"}),"\n",(0,n.jsx)(t.h3,{id:"working-with-arrow-schemas",children:"Working with Arrow Schemas"}),"\n",(0,n.jsx)(t.p,{children:"Get the names of the columns in a table."}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-typescript",children:'const fieldNames = table.schema.fields.map((f) => f.name);\n// Array(3) ["Latitude", "Longitude", "Date"]\n'})}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-typescript",children:'const fieldTypes = schema.fields.map(f => f.type)\n// Array(3) [Float, Float, Timestamp]\n\nconst fieldTypeNames = ...;\n// Array(3) ["Float64", "Float64", "Timestamp<MICROSECOND>"]\n'})})]})}function h(e={}){const{wrapper:t}={...(0,a.R)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(l,{...e})}):l(e)}},43023:(e,t,s)=>{s.d(t,{R:()=>o,x:()=>c});var n=s(63696);const a={},r=n.createContext(a);function o(e){const t=n.useContext(r);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:o(e.components),n.createElement(r.Provider,{value:t},e.children)}}}]);