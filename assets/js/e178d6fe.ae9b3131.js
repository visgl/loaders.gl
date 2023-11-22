"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[3819],{47911:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>c,contentTitle:()=>d,default:()=>u,frontMatter:()=>s,metadata:()=>t,toc:()=>a});var i=r(85893),l=r(11151);const s={},d="Builders",t={id:"arrowjs/api-reference/builder",title:"Builders",description:"The makeBuilder() function creates a Builder instance that is set up to build",source:"@site/../docs/arrowjs/api-reference/builder.md",sourceDirName:"arrowjs/api-reference",slug:"/arrowjs/api-reference/builder",permalink:"/docs/arrowjs/api-reference/builder",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/api-reference/builder.md",tags:[],version:"current",frontMatter:{}},c={},a=[{value:"Usage",id:"usage",level:2},{value:"makeBuilder",id:"makebuilder",level:2},{value:"Builder",id:"builder",level:2}];function o(e){const n={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,l.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.h1,{id:"builders",children:"Builders"}),"\n",(0,i.jsxs)(n.p,{children:["The ",(0,i.jsx)(n.code,{children:"makeBuilder()"})," function creates a ",(0,i.jsx)(n.code,{children:"Builder"})," instance that is set up to build\na columnar vector of the supplied ",(0,i.jsx)(n.code,{children:"DataType"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["A ",(0,i.jsx)(n.code,{children:"Builder"})," is responsible for writing arbitrary JavaScript values\nto ArrayBuffers and/or child Builders according to the Arrow specification\nor each DataType, creating or resizing the underlying ArrayBuffers as necessary."]}),"\n",(0,i.jsxs)(n.p,{children:["The ",(0,i.jsx)(n.code,{children:"Builder"})," for each Arrow ",(0,i.jsx)(n.code,{children:"DataType"})," handles converting and appending\nvalues for a given ",(0,i.jsx)(n.code,{children:"DataType"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["Once created, ",(0,i.jsx)(n.code,{children:"Builder"})," instances support both appending values to the end\nof the ",(0,i.jsx)(n.code,{children:"Builder"}),", and random-access writes to specific indices\n",(0,i.jsx)(n.code,{children:"builder.append(value)"})," is a convenience method for\nbuilder.set(builder.length, value)`). Appending or setting values beyond the\nuilder's current length may cause the builder to grow its underlying buffers\nr child Builders (if applicable) to accommodate the new values."]}),"\n",(0,i.jsxs)(n.p,{children:["After enough values have been written to a ",(0,i.jsx)(n.code,{children:"Builder"}),", ",(0,i.jsx)(n.code,{children:"builder.flush()"}),"\nill commit the values to the underlying ArrayBuffers (or child Builders). The\nnternal Builder state will be reset, and an instance of ",(0,i.jsx)(n.code,{children:"Data<T>"})," is returned.\nlternatively, ",(0,i.jsx)(n.code,{children:"builder.toVector()"})," will flush the ",(0,i.jsx)(n.code,{children:"Builder"})," and return\nn instance of ",(0,i.jsx)(n.code,{children:"Vector<T>"})," instead."]}),"\n",(0,i.jsxs)(n.p,{children:["When there are no more values to write, use ",(0,i.jsx)(n.code,{children:"builder.finish()"})," to\ninalize the ",(0,i.jsx)(n.code,{children:"Builder"}),". This does not reset the internal state, so it is\necessary to call ",(0,i.jsx)(n.code,{children:"builder.flush()"})," or ",(0,i.jsx)(n.code,{children:"toVector()"})," one last time\nf there are still values queued to be flushed."]}),"\n",(0,i.jsxs)(n.p,{children:["Note: calling ",(0,i.jsx)(n.code,{children:"builder.finish()"})," is required when using a ",(0,i.jsx)(n.code,{children:"DictionaryBuilder"}),",\necause this is when it flushes the values that have been enqueued in its internal\nictionary's ",(0,i.jsx)(n.code,{children:"Builder"}),", and creates the ",(0,i.jsx)(n.code,{children:"dictionaryVector"})," for the ",(0,i.jsx)(n.code,{children:"Dictionary"})," ",(0,i.jsx)(n.code,{children:"DataType"}),"."]}),"\n",(0,i.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,i.jsx)(n.p,{children:"Creating a utf8 array"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-ts",children:"import { Builder, Utf8 } from 'apache-arrow';\n\nconst utf8Builder = makeBuilder({\n    type: new Utf8(),\n    nullValues: [null, 'n/a']\n});\n\nutf8Builder\n    .append('hello')\n    .append('n/a')\n    .append('world')\n    .append(null);\n\nconst utf8Vector = utf8Builder.finish().toVector();\n\nconsole.log(utf8Vector.toJSON());\n// > [\"hello\", null, \"world\", null]\n"})}),"\n",(0,i.jsx)(n.h2,{id:"makebuilder",children:"makeBuilder"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-ts",children:"function makeBuilder(options: BuilderOptions): Builder;\n"})}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-ts",children:"type BuilderOptions<T extends DataType = any, TNull = any> {\n    type: T;\n    nullValues?: TNull[] | ReadonlyArray<TNull> | null;\n    children?: { [key: string]: BuilderOptions } | BuilderOptions[];\n}\n"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"type"})," - the data type of the column. This can be an arbitrarily nested data type with children (",(0,i.jsx)(n.code,{children:"List"}),", ",(0,i.jsx)(n.code,{children:"Struct"})," etc)."]}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"nullValues?"})," - The javascript values which will be considered null-values."]}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"children?"})," - ",(0,i.jsx)(n.code,{children:"BuilderOptions"})," for any nested columns."]}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"type T"})," - The ",(0,i.jsx)(n.code,{children:"DataType"})," of this ",(0,i.jsx)(n.code,{children:"Builder"}),"."]}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"type TNull"})," - The type(s) of values which will be considered null-value sentinels."]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"builder",children:"Builder"}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"makeBuilder()"})," returns ",(0,i.jsx)(n.code,{children:"Builder"})," which is a base class for the various that Arrow JS builder subclasses that\nconstruct Arrow Vectors from JavaScript values."]})]})}function u(e={}){const{wrapper:n}={...(0,l.a)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(o,{...e})}):o(e)}},11151:(e,n,r)=>{r.d(n,{Z:()=>t,a:()=>d});var i=r(67294);const l={},s=i.createContext(l);function d(e){const n=i.useContext(s);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function t(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(l):e.components||l:d(e.components),i.createElement(s.Provider,{value:n},e.children)}}}]);