"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[4742],{78204:(e,s,n)=>{n.r(s),n.d(s,{assets:()=>o,contentTitle:()=>c,default:()=>t,frontMatter:()=>h,metadata:()=>d,toc:()=>i});var a=n(62540),r=n(43023);const h={},c="Hash",d={id:"modules/crypto/api-reference/hash",title:"Hash",description:"Hash is the abstract base class for loaders.gl hash classes.",source:"@site/../docs/modules/crypto/api-reference/hash.md",sourceDirName:"modules/crypto/api-reference",slug:"/modules/crypto/api-reference/hash",permalink:"/docs/modules/crypto/api-reference/hash",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/crypto/api-reference/hash.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Overview",permalink:"/docs/modules/crypto/"},next:{title:"CRC32CHash",permalink:"/docs/modules/crypto/api-reference/crc32-hash"}},o={},i=[{value:"Fields",id:"fields",level:2},{value:"<code>name</code>: string",id:"name-string",level:4},{value:"<code>isSupported</code>: boolean",id:"issupported-boolean",level:4},{value:"Methods",id:"methods",level:2},{value:"<code>preload()</code>",id:"preload",level:4},{value:"<code>hash()</code>",id:"hash-1",level:4},{value:"<code>hashSync()</code>",id:"hashsync",level:4},{value:"<code>hashInBactches()</code>",id:"hashinbactches",level:4}];function l(e){const s={admonition:"admonition",code:"code",h1:"h1",h2:"h2",h4:"h4",header:"header",p:"p",pre:"pre",...(0,r.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(s.header,{children:(0,a.jsx)(s.h1,{id:"hash",children:"Hash"})}),"\n",(0,a.jsx)("p",{class:"badges",children:(0,a.jsx)("img",{src:"https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square",alt:"From-v3.0"})}),"\n",(0,a.jsxs)(s.p,{children:[(0,a.jsx)(s.code,{children:"Hash"})," is the abstract base class for loaders.gl hash classes."]}),"\n",(0,a.jsx)(s.h2,{id:"fields",children:"Fields"}),"\n",(0,a.jsxs)(s.h4,{id:"name-string",children:[(0,a.jsx)(s.code,{children:"name"}),": string"]}),"\n",(0,a.jsx)(s.p,{children:"The name of the hash algorithm"}),"\n",(0,a.jsxs)(s.h4,{id:"issupported-boolean",children:[(0,a.jsx)(s.code,{children:"isSupported"}),": boolean"]}),"\n",(0,a.jsx)(s.h2,{id:"methods",children:"Methods"}),"\n",(0,a.jsx)(s.h4,{id:"preload",children:(0,a.jsx)(s.code,{children:"preload()"})}),"\n",(0,a.jsx)(s.p,{children:(0,a.jsx)(s.code,{children:"preload(): Promise<void>"})}),"\n",(0,a.jsxs)(s.p,{children:["Asynchronously loads required libraries. For some hash classes this must be completed before\n",(0,a.jsx)(s.code,{children:"hashSync()"})," is available."]}),"\n",(0,a.jsx)(s.h4,{id:"hash-1",children:(0,a.jsx)(s.code,{children:"hash()"})}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-typescript",children:"  hash.hash(data: ArrayBuffer, encoding: 'hex' | 'base64'): Promise<ArrayBuffer>\n"})}),"\n",(0,a.jsx)(s.p,{children:"Asynchronously hashes data."}),"\n",(0,a.jsx)(s.h4,{id:"hashsync",children:(0,a.jsx)(s.code,{children:"hashSync()"})}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-typescript",children:"  hash.hashSync(data: ArrayBuffer, encoding: 'hex' | 'base64'): ArrayBuffer\n"})}),"\n",(0,a.jsx)(s.p,{children:"Synchronously hashes data."}),"\n",(0,a.jsx)(s.admonition,{type:"caution",children:(0,a.jsxs)(s.p,{children:["For some hash sub classes, ",(0,a.jsx)(s.code,{children:"preload()"})," must have been called and completed before\nsynchronous operations are available."]})}),"\n",(0,a.jsx)(s.h4,{id:"hashinbactches",children:(0,a.jsx)(s.code,{children:"hashInBactches()"})}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-typescript",children:"  hash.hashBatches(data: AsyncIterable<ArrayBuffer>, encoding: 'hex' | 'base64'): AsyncIterable<ArrayBuffer>\n"})}),"\n",(0,a.jsx)(s.p,{children:"Asynchronously hashes data in batches."}),"\n",(0,a.jsxs)(s.p,{children:["If the underlying hashion does not support streaming hashion,\nthe incoming data will be concatenated into a single ",(0,a.jsx)(s.code,{children:"ArrayBuffer"}),"\nand a single hashed batch will be yielded."]})]})}function t(e={}){const{wrapper:s}={...(0,r.R)(),...e.components};return s?(0,a.jsx)(s,{...e,children:(0,a.jsx)(l,{...e})}):l(e)}},43023:(e,s,n)=>{n.d(s,{R:()=>c,x:()=>d});var a=n(63696);const r={},h=a.createContext(r);function c(e){const s=a.useContext(h);return a.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function d(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:c(e.components),a.createElement(h.Provider,{value:s},e.children)}}}]);