"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[2971],{31800:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>s,default:()=>l,frontMatter:()=>n,metadata:()=>i,toc:()=>d});var o=r(85893),a=r(11151);const n={},s="Notes on Memory Management",i={id:"arrowjs/developer-guide/memory-management",title:"Notes on Memory Management",description:"Apache Arrow is a performance-optimized architecture, and the foundation of that performance is the approach to memory management. It can be useful to have an understanding of how.",source:"@site/../docs/arrowjs/developer-guide/memory-management.md",sourceDirName:"arrowjs/developer-guide",slug:"/arrowjs/developer-guide/memory-management",permalink:"/docs/arrowjs/developer-guide/memory-management",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/developer-guide/memory-management.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Extracting Data",permalink:"/docs/arrowjs/developer-guide/converting-data"},next:{title:"Working with BigInts",permalink:"/docs/arrowjs/developer-guide/big-ints"}},c={},d=[{value:"How Arrow Stores Data",id:"how-arrow-stores-data",level:2}];function m(e){const t={code:"code",h1:"h1",h2:"h2",p:"p",...(0,a.a)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(t.h1,{id:"notes-on-memory-management",children:"Notes on Memory Management"}),"\n",(0,o.jsx)(t.p,{children:"Apache Arrow is a performance-optimized architecture, and the foundation of that performance is the approach to memory management. It can be useful to have an understanding of how."}),"\n",(0,o.jsx)(t.h2,{id:"how-arrow-stores-data",children:"How Arrow Stores Data"}),"\n",(0,o.jsx)(t.p,{children:'Arrow reads in arrow data as arraybuffer(s) and then creates chunks that are "sub array views" into that big array buffer, and lists of those chunks are then composed into "logical" arrays.'}),"\n",(0,o.jsx)(t.p,{children:"Chunks are created for each column in each RecordBatch."}),"\n",(0,o.jsxs)(t.p,{children:['The chunks can be "sliced and diced" by operations on ',(0,o.jsx)(t.code,{children:"Column"}),", ",(0,o.jsx)(t.code,{children:"Table"})," and ",(0,o.jsx)(t.code,{children:"DataFrame"})," objects, but are never copied (as long as flattening is not requested) and are conceptually immutable. (There is a low-level ",(0,o.jsx)(t.code,{children:"Vector.set()"})," method however given that it could modify data that is used by multiple objects its use should be reserved for cases where implications are fully understood)."]})]})}function l(e={}){const{wrapper:t}={...(0,a.a)(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(m,{...e})}):m(e)}},11151:(e,t,r)=>{r.d(t,{Z:()=>i,a:()=>s});var o=r(67294);const a={},n=o.createContext(a);function s(e){const t=o.useContext(n);return o.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function i(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:s(e.components),o.createElement(n.Provider,{value:t},e.children)}}}]);