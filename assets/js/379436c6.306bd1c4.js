"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[6801],{88216:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>l,contentTitle:()=>n,default:()=>p,frontMatter:()=>i,metadata:()=>a,toc:()=>d});var o=s(85893),t=s(11151);const i={},n="registerLoaders",a={id:"modules/core/api-reference/register-loaders",title:"registerLoaders",description:"The loader registry allows applications to cherry-pick which loaders to include in their application bundle by importing just the loaders they need and registering them during initialization.",source:"@site/../docs/modules/core/api-reference/register-loaders.md",sourceDirName:"modules/core/api-reference",slug:"/modules/core/api-reference/register-loaders",permalink:"/docs/modules/core/api-reference/register-loaders",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/core/api-reference/register-loaders.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Loader Options",permalink:"/docs/modules/core/api-reference/set-loader-options"},next:{title:"selectSource \ud83d\udea7",permalink:"/docs/modules/core/api-reference/select-source"}},l={},d=[{value:"Usage",id:"usage",level:2},{value:"Functions",id:"functions",level:2},{value:"registerLoaders()",id:"registerloaders-1",level:3}];function c(e){const r={code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,t.a)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(r.h1,{id:"registerloaders",children:"registerLoaders"}),"\n",(0,o.jsx)(r.p,{children:"The loader registry allows applications to cherry-pick which loaders to include in their application bundle by importing just the loaders they need and registering them during initialization."}),"\n",(0,o.jsxs)(r.p,{children:["Applications can then make all those imported loaders available (via format autodetection) to all subsequent ",(0,o.jsx)(r.code,{children:"parse"})," and ",(0,o.jsx)(r.code,{children:"load"})," calls, without those calls having to specify which loaders to use."]}),"\n",(0,o.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,o.jsx)(r.p,{children:"Sample application initialization code that imports and registers loaders:"}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-typescript",children:"import {registerLoaders} from '@loaders.gl/core';\nimport {CSVLoader} from '@loaders.gl/csv';\n\nregisterLoaders(CSVLoader);\n"})}),"\n",(0,o.jsx)(r.p,{children:"Some other file that needs to load CSV:"}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-typescript",children:"import {load} from '@loaders.gl/core';\n\n// The pre-registered CSVLoader gets auto selected based on file extension...\nconst data = await load('data.csv');\n"})}),"\n",(0,o.jsx)(r.h2,{id:"functions",children:"Functions"}),"\n",(0,o.jsx)(r.h3,{id:"registerloaders-1",children:"registerLoaders()"}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-typescript",children:"registerLoaders(loaders : Loader | Loader[])\n"})}),"\n",(0,o.jsxs)(r.p,{children:["Registers one or more ",(0,o.jsx)(r.em,{children:"loader objects"})," to a global ",(0,o.jsx)(r.em,{children:"loader object registry"}),", these loaders will be used if no loader object is supplied to ",(0,o.jsx)(r.code,{children:"parse"})," and ",(0,o.jsx)(r.code,{children:"load"}),"."]}),"\n",(0,o.jsxs)(r.ul,{children:["\n",(0,o.jsxs)(r.li,{children:[(0,o.jsx)(r.code,{children:"loaders"})," - can be a single loader or an array of loaders. The specified loaders will be added to any previously registered loaders."]}),"\n"]})]})}function p(e={}){const{wrapper:r}={...(0,t.a)(),...e.components};return r?(0,o.jsx)(r,{...e,children:(0,o.jsx)(c,{...e})}):c(e)}},11151:(e,r,s)=>{s.d(r,{Z:()=>a,a:()=>n});var o=s(67294);const t={},i=o.createContext(t);function n(e){const r=o.useContext(i);return o.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function a(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:n(e.components),o.createElement(i.Provider,{value:r},e.children)}}}]);