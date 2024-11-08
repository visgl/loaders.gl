"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[3262],{30514:(e,n,o)=>{o.r(n),o.d(n,{assets:()=>a,contentTitle:()=>c,default:()=>d,frontMatter:()=>t,metadata:()=>i,toc:()=>l});var r=o(62540),s=o(43023);const t={},c="fetchProgress \ud83d\udea7",i={id:"modules/core/api-reference/fetch-progress",title:"fetchProgress \ud83d\udea7",description:"This function is still experimental",source:"@site/../docs/modules/core/api-reference/fetch-progress.md",sourceDirName:"modules/core/api-reference",slug:"/modules/core/api-reference/fetch-progress",permalink:"/docs/modules/core/api-reference/fetch-progress",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/core/api-reference/fetch-progress.md",tags:[],version:"current",frontMatter:{}},a={},l=[{value:"Usage",id:"usage",level:2},{value:"_fetchProgress(response : Response | Promise, onProgress : function, onDone : function, onError : function) : Response",id:"_fetchprogressresponse--response--promise-onprogress--function-ondone--function-onerror--function--response",level:2}];function p(e){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",header:"header",p:"p",pre:"pre",...(0,s.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.header,{children:(0,r.jsx)(n.h1,{id:"fetchprogress-",children:"fetchProgress \ud83d\udea7"})}),"\n",(0,r.jsxs)(n.blockquote,{children:["\n",(0,r.jsx)(n.p,{children:"This function is still experimental"}),"\n"]}),"\n",(0,r.jsxs)(n.p,{children:["A function that tracks a fetch response object and calls ",(0,r.jsx)(n.code,{children:"onProgress"})," callbacks."]}),"\n",(0,r.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"import {_fetchProgress} from '@loaders.gl/core';\n\nfunction onProgress(percent, {loadedBytes, totalBytes}) {\n  console.log(`${percent}% ${Math.round(loadedBytes/1000)} of ${Math.round(totalBytes/1000)} Kbytes`);\n}\n\nasync function main() {\n  const response = await _fetchProgress(fetch(PROGRESS_IMAGE_URL, onProgress),\n  const data = await response.arrayBuffer();\n  // At this point, onProgress will have been called one or more times.\n  ...\n}\n"})}),"\n",(0,r.jsx)(n.h2,{id:"_fetchprogressresponse--response--promise-onprogress--function-ondone--function-onerror--function--response",children:"_fetchProgress(response : Response | Promise, onProgress : function, onDone : function, onError : function) : Response"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.code,{children:"onProgress: (percent: number, {loadedBytes : number, totalBytes : number}) => void"})})]})}function d(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(p,{...e})}):p(e)}},43023:(e,n,o)=>{o.d(n,{R:()=>c,x:()=>i});var r=o(63696);const s={},t=r.createContext(s);function c(e){const n=r.useContext(t);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function i(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:c(e.components),r.createElement(t.Provider,{value:n},e.children)}}}]);