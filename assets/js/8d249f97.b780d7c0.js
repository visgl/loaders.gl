"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[7960],{55890:(e,r,d)=>{d.r(r),d.d(r,{assets:()=>l,contentTitle:()=>n,default:()=>h,frontMatter:()=>s,metadata:()=>i,toc:()=>c});var t=d(74848),o=d(28453);const s={},n="VideoLoader",i={id:"modules/video/api-reference/video-loader",title:"VideoLoader",description:"The VideoLoader is experimental.",source:"@site/../docs/modules/video/api-reference/video-loader.md",sourceDirName:"modules/video/api-reference",slug:"/modules/video/api-reference/video-loader",permalink:"/docs/modules/video/api-reference/video-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/video/api-reference/video-loader.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"NPYLoader",permalink:"/docs/modules/textures/api-reference/npy-loader"},next:{title:"WKTLoader",permalink:"/docs/modules/wkt/api-reference/wkt-loader"}},l={},c=[{value:"Usage",id:"usage",level:2},{value:"Options",id:"options",level:2}];function a(e){const r={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,o.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.h1,{id:"videoloader",children:"VideoLoader"}),"\n",(0,t.jsx)("p",{class:"badges",children:(0,t.jsx)("img",{src:"https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square",alt:"From-v2.2"})}),"\n",(0,t.jsxs)(r.blockquote,{children:["\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.code,{children:"VideoLoader"})," is experimental."]}),"\n"]}),"\n",(0,t.jsx)(r.p,{children:"A basic Video element loader. Only works in the browser."}),"\n",(0,t.jsxs)(r.table,{children:[(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Loader"}),(0,t.jsx)(r.th,{children:"Characteristic"})]})}),(0,t.jsxs)(r.tbody,{children:[(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"File Extension"}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:".mp4"})})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"File Type"}),(0,t.jsx)(r.td,{children:"Binary"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"File Format"}),(0,t.jsx)(r.td,{children:"Image"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Data Format"}),(0,t.jsxs)(r.td,{children:[(0,t.jsx)(r.code,{children:"Video"})," (browsers) (Not currently supported on node.js)"]})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Supported APIs"}),(0,t.jsxs)(r.td,{children:[(0,t.jsx)(r.code,{children:"load"}),", ",(0,t.jsx)(r.code,{children:"parse"})]})]})]})]}),"\n",(0,t.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"import '@loaders.gl/polyfills'; // only needed if using under Node\nimport {VideoLoader} from '@loaders.gl/video';\nimport {load} from '@loaders.gl/core';\n\nconst image = await load(url, VideoLoader, options);\n"})}),"\n",(0,t.jsx)(r.h2,{id:"options",children:"Options"}),"\n",(0,t.jsx)(r.table,{children:(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Option"}),(0,t.jsx)(r.th,{children:"Type"}),(0,t.jsx)(r.th,{children:"Default"}),(0,t.jsx)(r.th,{children:"Description"})]})})})]})}function h(e={}){const{wrapper:r}={...(0,o.R)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(a,{...e})}):a(e)}},28453:(e,r,d)=>{d.d(r,{R:()=>n,x:()=>i});var t=d(96540);const o={},s=t.createContext(o);function n(e){const r=t.useContext(s);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function i(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:n(e.components),t.createElement(s.Provider,{value:r},e.children)}}}]);