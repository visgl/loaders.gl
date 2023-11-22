"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[5860],{78348:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>l,contentTitle:()=>d,default:()=>x,frontMatter:()=>i,metadata:()=>o,toc:()=>c});var s=t(85893),n=t(11151);const i={},d="CompressedTextureWriter \ud83d\udea7",o={id:"modules/textures/api-reference/compressed-texture-writer",title:"CompressedTextureWriter \ud83d\udea7",description:"The experimental CompressedTextureWriter class can encode a binary encoded image into a compressed texture.",source:"@site/../docs/modules/textures/api-reference/compressed-texture-writer.md",sourceDirName:"modules/textures/api-reference",slug:"/modules/textures/api-reference/compressed-texture-writer",permalink:"/docs/modules/textures/api-reference/compressed-texture-writer",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/textures/api-reference/compressed-texture-writer.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"CompressedTextureLoader",permalink:"/docs/modules/textures/api-reference/compressed-texture-loader"},next:{title:"KTX2BasisWriter \ud83d\udea7",permalink:"/docs/modules/textures/api-reference/ktx2-basis-texture-writer"}},l={},c=[{value:"Usage",id:"usage",level:2},{value:"Data Format",id:"data-format",level:2},{value:"Options",id:"options",level:2},{value:"Remarks",id:"remarks",level:2}];function a(e){const r={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,n.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(r.h1,{id:"compressedtexturewriter-",children:"CompressedTextureWriter \ud83d\udea7"}),"\n",(0,s.jsxs)("p",{class:"badges",children:[(0,s.jsx)("img",{src:"https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square",alt:"From-v3.0"}),(0,s.jsx)("img",{src:"https://img.shields.io/badge/Node.js-only-red.svg?style=flat-square",alt:"Node.js-only"})]}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:["The experimental ",(0,s.jsx)(r.code,{children:"CompressedTextureWriter"})," class can encode a binary encoded image into a compressed texture."]}),"\n"]}),"\n",(0,s.jsxs)(r.table,{children:[(0,s.jsx)(r.thead,{children:(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.th,{children:"Loader"}),(0,s.jsx)(r.th,{children:"Characteristic"})]})}),(0,s.jsxs)(r.tbody,{children:[(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Extension"}),(0,s.jsx)(r.td,{})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Type"}),(0,s.jsx)(r.td,{children:"Binary"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Data Format"}),(0,s.jsx)(r.td,{})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"File Format"}),(0,s.jsx)(r.td,{})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Encoder Type"}),(0,s.jsx)(r.td,{children:"Asynchronous"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Worker Thread"}),(0,s.jsx)(r.td,{children:"No (but may run on separate native thread in browsers)"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:"Streaming"}),(0,s.jsx)(r.td,{children:"No"})]})]})]}),"\n",(0,s.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-typescript",children:"import '@loaders.gl/polyfill'; // only if using under Node\nimport {encodeURLtoURL} from '@loaders.gl/core';\nimport {CompressedTextureWriter} from '@loaders.gl/textures';\n\nexport const IMAGE_URL = 'image.png';\n\nconst outputFilename = await encodeURLtoURL(IMAGE_URL, '/tmp/test.ktx', CompressedTextureWriter);\n\n// app can now read the file from outputFilename\n"})}),"\n",(0,s.jsx)(r.h2,{id:"data-format",children:"Data Format"}),"\n",(0,s.jsx)(r.p,{children:"TBA"}),"\n",(0,s.jsx)(r.h2,{id:"options",children:"Options"}),"\n",(0,s.jsx)(r.table,{children:(0,s.jsx)(r.thead,{children:(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.th,{children:"Option"}),(0,s.jsx)(r.th,{children:"Type"}),(0,s.jsx)(r.th,{children:"Default"}),(0,s.jsx)(r.th,{children:"Description"})]})})}),"\n",(0,s.jsx)(r.h2,{id:"remarks",children:"Remarks"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:["For more information, see ",(0,s.jsx)(r.a,{href:"https://github.com/TimvanScherpenzeel/texture-compressor",children:(0,s.jsx)(r.code,{children:"texture-compressor"})}),"."]}),"\n"]})]})}function x(e={}){const{wrapper:r}={...(0,n.a)(),...e.components};return r?(0,s.jsx)(r,{...e,children:(0,s.jsx)(a,{...e})}):a(e)}},11151:(e,r,t)=>{t.d(r,{Z:()=>o,a:()=>d});var s=t(67294);const n={},i=s.createContext(n);function d(e){const r=s.useContext(i);return s.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function o(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:d(e.components),s.createElement(i.Provider,{value:r},e.children)}}}]);