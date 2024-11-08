"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[6943],{13552:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>s,contentTitle:()=>c,default:()=>h,frontMatter:()=>o,metadata:()=>i,toc:()=>d});var n=a(62540),r=a(43023);const o={},c="Extracting Data",i={id:"arrowjs/developer-guide/converting-data",title:"Extracting Data",description:"While keeping data in Arrow format allows for efficient data frame operations, there are of course cases where data needs to be extracted in a form that can be use with non-Arrow-aware JavaScript code.",source:"@site/../docs/arrowjs/developer-guide/converting-data.md",sourceDirName:"arrowjs/developer-guide",slug:"/arrowjs/developer-guide/converting-data",permalink:"/docs/arrowjs/developer-guide/converting-data",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/developer-guide/converting-data.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Building columns and tables",permalink:"/docs/arrowjs/developer-guide/builders"},next:{title:"Notes on Memory Management",permalink:"/docs/arrowjs/developer-guide/memory-management"}},s={},d=[{value:"Converting Data",id:"converting-data",level:3},{value:"Extracting Data by Row",id:"extracting-data-by-row",level:3},{value:"Extracting Data by Column",id:"extracting-data-by-column",level:3},{value:"Extracting data by Column and Batch",id:"extracting-data-by-column-and-batch",level:3}];function l(e){const t={code:"code",h1:"h1",h3:"h3",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.header,{children:(0,n.jsx)(t.h1,{id:"extracting-data",children:"Extracting Data"})}),"\n",(0,n.jsx)(t.p,{children:"While keeping data in Arrow format allows for efficient data frame operations, there are of course cases where data needs to be extracted in a form that can be use with non-Arrow-aware JavaScript code."}),"\n",(0,n.jsx)(t.h3,{id:"converting-data",children:"Converting Data"}),"\n",(0,n.jsx)(t.p,{children:"Many arrow classes support the following methods:"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"toArray()"})," - Typically returns a typed array."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"toJSON()"})," - Arrow JS types can be converted to JSON."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"toString()"})," - Arrow JS types can be converted to strings."]}),"\n"]}),"\n",(0,n.jsx)(t.h3,{id:"extracting-data-by-row",children:"Extracting Data by Row"}),"\n",(0,n.jsx)(t.p,{children:"You can get a temporary object representing a row in a table."}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-typescript",children:"const row = table.get(0);\n"})}),"\n",(0,n.jsxs)(t.p,{children:["Note that the ",(0,n.jsx)(t.code,{children:"row"})," does not retain the schema, so you'll either need to know the order of columns ",(0,n.jsx)(t.code,{children:"row.get(0)"}),", or use the ",(0,n.jsx)(t.code,{children:"to*()"})," methods."]}),"\n",(0,n.jsx)(t.h3,{id:"extracting-data-by-column",children:"Extracting Data by Column"}),"\n",(0,n.jsx)(t.p,{children:"More efficient is to get a column."}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-typescript",children:"const column = table.getColumn('data');\n"})}),"\n",(0,n.jsx)(t.p,{children:"The column can be chunked, so to get a contiguous (typed) array, call"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-typescript",children:"const array = table.getColumn('columnName').toArray();\n"})}),"\n",(0,n.jsx)(t.p,{children:"Note that if there are multiple chunks in the array, this will create a new typed array and copy the typed arrays in the chunks into that array."}),"\n",(0,n.jsx)(t.h3,{id:"extracting-data-by-column-and-batch",children:"Extracting data by Column and Batch"}),"\n",(0,n.jsx)(t.p,{children:"A more efficient (zero-copy) way to get access to data (especially if the table has not been sliced or filtered) could be to walk through the chunks in each column and get the underlying typed array for that chunk."})]})}function h(e={}){const{wrapper:t}={...(0,r.R)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(l,{...e})}):l(e)}},43023:(e,t,a)=>{a.d(t,{R:()=>c,x:()=>i});var n=a(63696);const r={},o=n.createContext(r);function c(e){const t=n.useContext(o);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function i(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:c(e.components),n.createElement(o.Provider,{value:t},e.children)}}}]);