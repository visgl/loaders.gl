"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[4507],{20423:(e,s,i)=>{i.r(s),i.d(s,{assets:()=>l,contentTitle:()=>n,default:()=>h,frontMatter:()=>r,metadata:()=>t,toc:()=>d});var a=i(85893),o=i(11151);const r={},n="Preferred JavaScript APIs",t={id:"developer-guide/concepts/javascript-apis",title:"Preferred JavaScript APIs",description:"loaders.gl supports input and output of data from JavaScript/TypeScript programs. To do this it is necessary to use platform APIs for",source:"@site/../docs/developer-guide/concepts/javascript-apis.md",sourceDirName:"developer-guide/concepts",slug:"/developer-guide/concepts/javascript-apis",permalink:"/docs/developer-guide/concepts/javascript-apis",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/developer-guide/concepts/javascript-apis.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Development Environment",permalink:"/docs/developer-guide/dev-env"},next:{title:"Binary Data",permalink:"/docs/developer-guide/concepts/binary-data"}},l={},d=[{value:"Loading data with <code>fetch()</code>",id:"loading-data-with-fetch",level:2},{value:"Local file access",id:"local-file-access",level:2},{value:"Saving data",id:"saving-data",level:2},{value:"Binary data APIs",id:"binary-data-apis",level:2},{value:"Image APIs",id:"image-apis",level:2}];function c(e){const s={admonition:"admonition",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",ul:"ul",...(0,o.a)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(s.h1,{id:"preferred-javascript-apis",children:"Preferred JavaScript APIs"}),"\n",(0,a.jsx)(s.p,{children:"loaders.gl supports input and output of data from JavaScript/TypeScript programs. To do this it is necessary to use platform APIs for"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsx)(s.li,{children:"loading data from files and URLs"}),"\n",(0,a.jsx)(s.li,{children:"writing data to files"}),"\n",(0,a.jsx)(s.li,{children:"manipulating binary data"}),"\n",(0,a.jsx)(s.li,{children:"parsing images"}),"\n",(0,a.jsx)(s.li,{children:"etc"}),"\n"]}),"\n",(0,a.jsx)(s.p,{children:"Over the years, a number of different JavaScript APIs have emerged. Depending on the version of JavaScript supported by a browser or the version of Node.js being used. In addition, the set of available APIs move"}),"\n",(0,a.jsxs)(s.h2,{id:"loading-data-with-fetch",children:["Loading data with ",(0,a.jsx)(s.code,{children:"fetch()"})]}),"\n",(0,a.jsxs)(s.p,{children:["loaders.gl standardizes on the ",(0,a.jsx)(s.code,{children:"fetch()"})," API. The result of a ",(0,a.jsx)(s.code,{children:"fetch"})," operation is a ",(0,a.jsx)(s.code,{children:"Response"})," object which can be passed to many loaders.gl functions, meaning that the application can call ",(0,a.jsx)(s.code,{children:"fetch()"})," itself to fully control the requests."]}),"\n",(0,a.jsx)(s.admonition,{type:"info",children:(0,a.jsxs)(s.p,{children:["The ",(0,a.jsx)(s.code,{children:"fetch()"})," API emerged in browsers, but is now also supported natively on Node, starting with Node.js v18.\nFor older Node.js versions, ",(0,a.jsx)(s.code,{children:"@loaders.gl/polyfills"})," installs polyfills of ",(0,a.jsx)(s.code,{children:"fetch"}),", ",(0,a.jsx)(s.code,{children:"Response"})," and ",(0,a.jsx)(s.code,{children:"Headers"})," classes."]})}),"\n",(0,a.jsx)(s.h2,{id:"local-file-access",children:"Local file access"}),"\n",(0,a.jsxs)(s.p,{children:["loaders.gl offers a ",(0,a.jsx)(s.code,{children:"FileSystem"}),", ",(0,a.jsx)(s.code,{children:"ReadableFile"})," and ",(0,a.jsx)(s.code,{children:"WritableFile"})," interfaces, and various implementations of these."]}),"\n",(0,a.jsxs)(s.p,{children:["For local file access in the browser, the ",(0,a.jsx)(s.code,{children:"File"})," class (a derivate of ",(0,a.jsx)(s.code,{children:"Blob"}),", see below) is the tool of choice.\nIt is not clear if a counterpart to the ",(0,a.jsx)(s.code,{children:"File"})," class will eventually be supported by Node.js."]}),"\n",(0,a.jsxs)(s.blockquote,{children:["\n",(0,a.jsx)(s.p,{children:"Note that reading local files in the browser has limitations. Actual file paths are obscured and files can only be created as a result of an interactive file selection or file drop action by the user."}),"\n"]}),"\n",(0,a.jsx)(s.h2,{id:"saving-data",children:"Saving data"}),"\n",(0,a.jsx)(s.p,{children:"Saving data from a browser is either done by POST requests to a server, or via local downloads."}),"\n",(0,a.jsx)(s.h2,{id:"binary-data-apis",children:"Binary data APIs"}),"\n",(0,a.jsxs)(s.p,{children:["The choice of binary data API in JavaScript usually comes down to either using Node.js ",(0,a.jsx)(s.code,{children:"Buffer"})," class or a combination of ",(0,a.jsx)(s.code,{children:"ArrayBuffer"}),", ",(0,a.jsx)(s.code,{children:"TextEncoder"}),"/",(0,a.jsx)(s.code,{children:"TextDecoder"})," classes."]}),"\n",(0,a.jsxs)(s.p,{children:["The ",(0,a.jsx)(s.code,{children:"Buffer"})," class in Node.js is not supported by browsers. Polyfills are available, but they can add considerable size (~50KB) to an application, and can cause small but frustrating bundling issues."]}),"\n",(0,a.jsx)(s.admonition,{type:"caution",children:(0,a.jsxs)(s.p,{children:["Therefore loaders.gl tries to avoid use of the ",(0,a.jsx)(s.code,{children:"Buffer"})," class in its core libraries and loaders, preferring to use ",(0,a.jsx)(s.code,{children:"ArrayBuffer"}),", typed arrays and ",(0,a.jsx)(s.code,{children:"Blob"}),"s."]})}),"\n",(0,a.jsxs)(s.p,{children:["The ",(0,a.jsx)(s.code,{children:"Blob"})," (and ",(0,a.jsx)(s.code,{children:"File"}),") classes in the browser have some unique advantages. They leverage an efficient blob storage mechanism in the browser, and they also enable partial, random-access reads from large blobs in that storage or from local files. ",(0,a.jsx)(s.code,{children:"Blob"}),"s are available in Node starting with Node.js v18. For lower versions, a polyfill will be installed by ",(0,a.jsx)(s.code,{children:"@laoders.gl/polyfills"}),"."]}),"\n",(0,a.jsx)(s.h2,{id:"image-apis",children:"Image APIs"}),"\n",(0,a.jsxs)(s.p,{children:["The preferred image platform API is the ",(0,a.jsx)(s.code,{children:"ImageBitmap"}),". It is currently only supported on modern browsers, not in Node.js."]}),"\n",(0,a.jsx)(s.p,{children:"At this stage loaders.gl does not provide an ImageBitmap polyfill, and it is not clear if future versions of Node.js would support something similar natively."})]})}function h(e={}){const{wrapper:s}={...(0,o.a)(),...e.components};return s?(0,a.jsx)(s,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}},11151:(e,s,i)=>{i.d(s,{Z:()=>t,a:()=>n});var a=i(67294);const o={},r=a.createContext(o);function n(e){const s=a.useContext(r);return a.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function t(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:n(e.components),a.createElement(r.Provider,{value:s},e.children)}}}]);