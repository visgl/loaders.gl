"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[9048],{70411:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>u,frontMatter:()=>a,metadata:()=>l,toc:()=>d});var r=n(74848),o=n(28453);const a={},i="Building columns and tables",l={id:"arrowjs/developer-guide/builders",title:"Building columns and tables",description:"Many JavaScript application may only need to be able to load and iterate of the data in existing Apache Arrow files creating outside of JavaScript.",source:"@site/../docs/arrowjs/developer-guide/builders.md",sourceDirName:"arrowjs/developer-guide",slug:"/arrowjs/developer-guide/builders",permalink:"/docs/arrowjs/developer-guide/builders",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/developer-guide/builders.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Working with Tables",permalink:"/docs/arrowjs/developer-guide/tables"},next:{title:"Extracting Data",permalink:"/docs/arrowjs/developer-guide/converting-data"}},s={},d=[];function c(e){const t={code:"code",h1:"h1",p:"p",pre:"pre",...(0,o.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.h1,{id:"building-columns-and-tables",children:"Building columns and tables"}),"\n",(0,r.jsx)(t.p,{children:"Many JavaScript application may only need to be able to load and iterate of the data in existing Apache Arrow files creating outside of JavaScript."}),"\n",(0,r.jsx)(t.p,{children:"However a JS application may also want to create its own Arrow tables from scratch."}),"\n",(0,r.jsxs)(t.p,{children:["For this situation, Apache Arrow JS provides the ",(0,r.jsx)(t.code,{children:"makeBuilder()"})," function that returns ",(0,r.jsx)(t.code,{children:"Builder"})," instances that can be used to build columns of specific data types."]}),"\n",(0,r.jsx)(t.p,{children:"However, creating arrow-compatible binary data columns for complex, potentially nullable data types can be quite tricky."}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",children:"import {Builder, Utf8} from 'apache-arrow';\n\nconst utf8Builder = makeBuilder({\n  type: new Utf8(),\n  nullValues: [null, 'n/a']\n});\n\nutf8Builder.append('hello').append('n/a').append('world').append(null);\n\nconst utf8Vector = utf8Builder.finish().toVector();\n\nconsole.log(utf8Vector.toJSON());\n// > [\"hello\", null, \"world\", null]\n"})})]})}function u(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(c,{...e})}):c(e)}},28453:(e,t,n)=>{n.d(t,{R:()=>i,x:()=>l});var r=n(96540);const o={},a=r.createContext(o);function i(e){const t=r.useContext(a);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:i(e.components),r.createElement(a.Provider,{value:t},e.children)}}}]);