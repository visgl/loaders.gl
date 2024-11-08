"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[9840],{75159:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>o,contentTitle:()=>i,default:()=>h,frontMatter:()=>r,metadata:()=>d,toc:()=>s});var a=t(62540),l=t(43023);const r={},i="Field",d={id:"arrowjs/api-reference/field",title:"Field",description:"This documentation reflects Arrow JS v4.0. Needs to be updated for the new Arrow API in v9.0 +.",source:"@site/../docs/arrowjs/api-reference/field.md",sourceDirName:"arrowjs/api-reference",slug:"/arrowjs/api-reference/field",permalink:"/docs/arrowjs/api-reference/field",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/api-reference/field.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Dictionary",permalink:"/docs/arrowjs/api-reference/dictionary"},next:{title:"RecordBatchReader",permalink:"/docs/arrowjs/api-reference/record-batch-reader"}},o={},s=[{value:"Members",id:"members",level:2},{value:"name : String (read only)",id:"name--string-read-only",level:3},{value:"type : Type (read only)",id:"type--type-read-only",level:3},{value:"nullable : Boolean (read only)",id:"nullable--boolean-read-only",level:3},{value:"metadata : Object | null (read only)",id:"metadata--object--null-read-only",level:3},{value:"typeId : ?",id:"typeid--",level:3},{value:"indices : ?",id:"indices--",level:3},{value:"Methods",id:"methods",level:2},{value:"constructor(name : String, nullable?: Boolean, metadata?: Object)",id:"constructorname--string-nullable-boolean-metadata-object",level:3}];function c(e){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",p:"p",ul:"ul",...(0,l.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.header,{children:(0,a.jsx)(n.h1,{id:"field",children:"Field"})}),"\n",(0,a.jsxs)(n.blockquote,{children:["\n",(0,a.jsx)(n.p,{children:"This documentation reflects Arrow JS v4.0. Needs to be updated for the new Arrow API in v9.0 +."}),"\n"]}),"\n",(0,a.jsx)(n.p,{children:"The combination of a field name and data type, with optional metadata. Fields are used to describe the individual constituents of a nested DataType or a Schema."}),"\n",(0,a.jsx)(n.h2,{id:"members",children:"Members"}),"\n",(0,a.jsx)(n.h3,{id:"name--string-read-only",children:"name : String (read only)"}),"\n",(0,a.jsx)(n.p,{children:"The name of this field."}),"\n",(0,a.jsx)(n.h3,{id:"type--type-read-only",children:"type : Type (read only)"}),"\n",(0,a.jsx)(n.p,{children:"The type of this field."}),"\n",(0,a.jsx)(n.h3,{id:"nullable--boolean-read-only",children:"nullable : Boolean (read only)"}),"\n",(0,a.jsxs)(n.p,{children:["Whether this field can contain ",(0,a.jsx)(n.code,{children:"null"})," values, in addition to values of ",(0,a.jsx)(n.code,{children:"Type"})," (this creates an extra null value map)."]}),"\n",(0,a.jsx)(n.h3,{id:"metadata--object--null-read-only",children:"metadata : Object | null (read only)"}),"\n",(0,a.jsxs)(n.p,{children:["A field's metadata is represented by a map which holds arbitrary key-value pairs. Returns ",(0,a.jsx)(n.code,{children:"null"})," if no metadata has been set."]}),"\n",(0,a.jsx)(n.h3,{id:"typeid--",children:"typeId : ?"}),"\n",(0,a.jsx)(n.p,{children:"TBD?"}),"\n",(0,a.jsx)(n.h3,{id:"indices--",children:"indices : ?"}),"\n",(0,a.jsx)(n.p,{children:"TBD? Used if data type is a dictionary."}),"\n",(0,a.jsx)(n.h2,{id:"methods",children:"Methods"}),"\n",(0,a.jsx)(n.h3,{id:"constructorname--string-nullable-boolean-metadata-object",children:"constructor(name : String, nullable?: Boolean, metadata?: Object)"}),"\n",(0,a.jsxs)(n.p,{children:["Creates an instance of ",(0,a.jsx)(n.code,{children:"Field"})," with parameters initialized as follows:"]}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsxs)(n.li,{children:[(0,a.jsx)(n.code,{children:"name"})," - Name of the column"]}),"\n",(0,a.jsxs)(n.li,{children:[(0,a.jsx)(n.code,{children:"nullable"}),"=",(0,a.jsx)(n.code,{children:"false"})," - Whether a null-array is maintained."]}),"\n",(0,a.jsxs)(n.li,{children:[(0,a.jsx)(n.code,{children:"metadata"}),"=",(0,a.jsx)(n.code,{children:"null"})," - Map of metadata"]}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,l.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}},43023:(e,n,t)=>{t.d(n,{R:()=>i,x:()=>d});var a=t(63696);const l={},r=a.createContext(l);function i(e){const n=a.useContext(r);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(l):e.components||l:i(e.components),a.createElement(r.Provider,{value:n},e.children)}}}]);