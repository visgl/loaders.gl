"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[1911],{24099:(e,r,c)=>{c.r(r),c.d(r,{assets:()=>d,contentTitle:()=>o,default:()=>l,frontMatter:()=>t,metadata:()=>s,toc:()=>h});var a=c(62540),n=c(43023);const t={},o="RecordBatch",s={id:"arrowjs/api-reference/record-batch",title:"RecordBatch",description:"This documentation reflects Arrow JS v4.0. Needs to be updated for the new Arrow API in v9.0 +.",source:"@site/../docs/arrowjs/api-reference/record-batch.md",sourceDirName:"arrowjs/api-reference",slug:"/arrowjs/api-reference/record-batch",permalink:"/docs/arrowjs/api-reference/record-batch",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/api-reference/record-batch.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"record-batch-writer",permalink:"/docs/arrowjs/api-reference/record-batch-writer"},next:{title:"Row",permalink:"/docs/arrowjs/api-reference/row"}},d={},h=[{value:"Overview",id:"overview",level:2},{value:"Usage",id:"usage",level:2},{value:"Inheritance",id:"inheritance",level:2},{value:"Members",id:"members",level:2},{value:"schema : Schema (readonly)",id:"schema--schema-readonly",level:3},{value:"numCols : Number (readonly)",id:"numcols--number-readonly",level:3},{value:"Static Methods",id:"static-methods",level:2},{value:"RecordBatch.from(vectors: Array, names: String[] = []) : RecordBatch",id:"recordbatchfromvectors-array-names-string----recordbatch",level:3},{value:"RecordBatch.new(vectors: Array, names: String[] = []) : RecordBatch",id:"recordbatchnewvectors-array-names-string----recordbatch",level:3},{value:"Methods",id:"methods",level:2},{value:"constructor(schema: Schema, numRows: Number, childData: (Data | Vector)[])",id:"constructorschema-schema-numrows-number-childdata-data--vector",level:3},{value:"constructor(schema: Schema, data: Data, children?: Vector[])",id:"constructorschema-schema-data-data-children-vector",level:3},{value:"constructor(...args: any[])",id:"constructorargs-any",level:3},{value:"clone(data: Data, children?: Array) : RecordBatch",id:"clonedata-data-children-array--recordbatch",level:3},{value:"concat(...others: Vector[]) : Table",id:"concatothers-vector--table",level:3},{value:"select(...columnNames: K[]) : RecordBatch",id:"selectcolumnnames-k--recordbatch",level:3}];function i(e){const r={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,n.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(r.header,{children:(0,a.jsx)(r.h1,{id:"recordbatch",children:"RecordBatch"})}),"\n",(0,a.jsxs)(r.blockquote,{children:["\n",(0,a.jsx)(r.p,{children:"This documentation reflects Arrow JS v4.0. Needs to be updated for the new Arrow API in v9.0 +."}),"\n"]}),"\n",(0,a.jsx)(r.h2,{id:"overview",children:"Overview"}),"\n",(0,a.jsx)(r.p,{children:"A Record Batch in Apache Arrow is a collection of equal-length array instances."}),"\n",(0,a.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,a.jsxs)(r.p,{children:["A record batch can be created from this list of arrays using ",(0,a.jsx)(r.code,{children:"RecordBatch.from"}),":"]}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{children:"const data = [\n  new Array([1, 2, 3, 4]),\n  new Array(['foo', 'bar', 'baz', None]),\n  new Array([True, None, False, True])\n]\n\nconst recordBatch = RecordBatch.from(arrays);\n"})}),"\n",(0,a.jsx)(r.h2,{id:"inheritance",children:"Inheritance"}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.code,{children:"RecordBatch"})," extends ",(0,a.jsx)(r.a,{href:"/docs/arrowjs/api-reference/struct-vector",children:(0,a.jsx)(r.code,{children:"StructVector"})})," extends ",(0,a.jsx)(r.a,{href:"/docs/arrowjs/api-reference/vector",children:(0,a.jsx)(r.code,{children:"BaseVector"})})]}),"\n",(0,a.jsx)(r.h2,{id:"members",children:"Members"}),"\n",(0,a.jsx)(r.h3,{id:"schema--schema-readonly",children:"schema : Schema (readonly)"}),"\n",(0,a.jsx)(r.p,{children:"Returns the schema of the data in the record batch"}),"\n",(0,a.jsx)(r.h3,{id:"numcols--number-readonly",children:"numCols : Number (readonly)"}),"\n",(0,a.jsxs)(r.p,{children:["Returns number of fields/columns in the schema (shorthand for ",(0,a.jsx)(r.code,{children:"this.schema.fields.length"}),")."]}),"\n",(0,a.jsx)(r.h2,{id:"static-methods",children:"Static Methods"}),"\n",(0,a.jsx)(r.h3,{id:"recordbatchfromvectors-array-names-string----recordbatch",children:"RecordBatch.from(vectors: Array, names: String[] = []) : RecordBatch"}),"\n",(0,a.jsxs)(r.p,{children:["Creates a ",(0,a.jsx)(r.code,{children:"RecordBatch"}),", see ",(0,a.jsx)(r.code,{children:"RecordBatch.new()"}),"."]}),"\n",(0,a.jsx)(r.h3,{id:"recordbatchnewvectors-array-names-string----recordbatch",children:"RecordBatch.new(vectors: Array, names: String[] = []) : RecordBatch"}),"\n",(0,a.jsx)(r.p,{children:"Creates new a record batch."}),"\n",(0,a.jsxs)(r.p,{children:["Schema is auto inferred, using names or index positions if ",(0,a.jsx)(r.code,{children:"names"})," are not supplied."]}),"\n",(0,a.jsx)(r.h2,{id:"methods",children:"Methods"}),"\n",(0,a.jsx)(r.h3,{id:"constructorschema-schema-numrows-number-childdata-data--vector",children:"constructor(schema: Schema, numRows: Number, childData: (Data | Vector)[])"}),"\n",(0,a.jsxs)(r.p,{children:["Create a new ",(0,a.jsx)(r.code,{children:"RecordBatch"})," instance with ",(0,a.jsx)(r.code,{children:"numRows"})," rows of child data."]}),"\n",(0,a.jsxs)(r.ul,{children:["\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.code,{children:"numRows"})," -"]}),"\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.code,{children:"childData"})," -"]}),"\n"]}),"\n",(0,a.jsx)(r.h3,{id:"constructorschema-schema-data-data-children-vector",children:"constructor(schema: Schema, data: Data, children?: Vector[])"}),"\n",(0,a.jsxs)(r.p,{children:["Create a new ",(0,a.jsx)(r.code,{children:"RecordBatch"})," instance with ",(0,a.jsx)(r.code,{children:"numRows"})," rows of child data."]}),"\n",(0,a.jsx)(r.h3,{id:"constructorargs-any",children:"constructor(...args: any[])"}),"\n",(0,a.jsx)(r.h3,{id:"clonedata-data-children-array--recordbatch",children:"clone(data: Data, children?: Array) : RecordBatch"}),"\n",(0,a.jsxs)(r.p,{children:["Returns a newly allocated copy of this ",(0,a.jsx)(r.code,{children:"RecordBatch"})]}),"\n",(0,a.jsx)(r.h3,{id:"concatothers-vector--table",children:"concat(...others: Vector[]) : Table"}),"\n",(0,a.jsxs)(r.p,{children:["Concatenates a number of ",(0,a.jsx)(r.code,{children:"Vector"})," instances."]}),"\n",(0,a.jsx)(r.h3,{id:"selectcolumnnames-k--recordbatch",children:"select(...columnNames: K[]) : RecordBatch"}),"\n",(0,a.jsxs)(r.p,{children:["Return a new ",(0,a.jsx)(r.code,{children:"RecordBatch"})," with a subset of columns."]})]})}function l(e={}){const{wrapper:r}={...(0,n.R)(),...e.components};return r?(0,a.jsx)(r,{...e,children:(0,a.jsx)(i,{...e})}):i(e)}},43023:(e,r,c)=>{c.d(r,{R:()=>o,x:()=>s});var a=c(63696);const n={},t=a.createContext(n);function o(e){const r=a.useContext(t);return a.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function s(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:o(e.components),a.createElement(t.Provider,{value:r},e.children)}}}]);