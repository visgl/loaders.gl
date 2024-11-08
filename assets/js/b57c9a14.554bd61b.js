"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[9695],{95858:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>c,contentTitle:()=>s,default:()=>h,frontMatter:()=>i,metadata:()=>t,toc:()=>l});var o=n(62540),d=n(43023);const i={},s="LoaderOptions",t={id:"modules/core/api-reference/loader-options",title:"LoaderOptions",description:"APIs in @loaders.gl/core takes an options?: LoaderOptions parameter. The options are documented on this page.",source:"@site/../docs/modules/core/api-reference/loader-options.md",sourceDirName:"modules/core/api-reference",slug:"/modules/core/api-reference/loader-options",permalink:"/docs/modules/core/api-reference/loader-options",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/core/api-reference/loader-options.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Overview",permalink:"/docs/modules/core/"},next:{title:"load",permalink:"/docs/modules/core/api-reference/load"}},c={},l=[{value:"Loader specific options",id:"loader-specific-options",level:2},{value:"Top-level options",id:"top-level-options",level:2},{value:"Batched parsing options",id:"batched-parsing-options",level:2}];function a(e){const r={code:"code",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,d.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(r.header,{children:(0,o.jsx)(r.h1,{id:"loaderoptions",children:"LoaderOptions"})}),"\n",(0,o.jsxs)(r.p,{children:["APIs in ",(0,o.jsx)(r.code,{children:"@loaders.gl/core"})," takes an ",(0,o.jsx)(r.code,{children:"options?: LoaderOptions"})," parameter. The options are documented on this page."]}),"\n",(0,o.jsx)(r.h2,{id:"loader-specific-options",children:"Loader specific options"}),"\n",(0,o.jsx)(r.p,{children:"The options object can contain loader specific options. The options for each loader are supplied in a sub object,\nsee the documentation for each loader for details:"}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-typescript",children:"{\n  csv: {\n    shape: 'row-object-table'\n  },\n  json: {\n    shape: 'row-object-table'\n  }\n}\n"})}),"\n",(0,o.jsx)(r.h2,{id:"top-level-options",children:"Top-level options"}),"\n",(0,o.jsx)(r.p,{children:"Top level options are interpreted by the core API and apply to all loaders."}),"\n",(0,o.jsxs)(r.table,{children:[(0,o.jsx)(r.thead,{children:(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.th,{children:"Option"}),(0,o.jsx)(r.th,{children:"Type"}),(0,o.jsx)(r.th,{children:"Default"}),(0,o.jsx)(r.th,{children:"Description"})]})}),(0,o.jsxs)(r.tbody,{children:[(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"options.fetch"})}),(0,o.jsxs)(r.td,{children:[(0,o.jsx)(r.code,{children:"object"})," or ",(0,o.jsx)(r.code,{children:"function"})]}),(0,o.jsx)(r.td,{children:"-"}),(0,o.jsxs)(r.td,{children:["Specifies either a ",(0,o.jsx)(r.code,{children:"RequestInit"})," object containing options to pass to ",(0,o.jsx)(r.code,{children:"fetchFile"}),", or a function that is called in place of ",(0,o.jsx)(r.code,{children:"fetchFile"})," to fetch data in any subloaders."]})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"options.nothrow"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"boolean"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"false"})}),(0,o.jsxs)(r.td,{children:["Specifies either an object with options to pass to ",(0,o.jsx)(r.code,{children:"fetchFile"}),", or a function that is called in place of ",(0,o.jsx)(r.code,{children:"fetchFile"})," to fetch data in any subloaders."]})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"options.mimeType"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"string"})}),(0,o.jsx)(r.td,{children:"-"}),(0,o.jsxs)(r.td,{children:["Loader selection will first look for a loader matching ",(0,o.jsx)(r.code,{children:"mimeType"}),". A specific loaders can be specified using ",(0,o.jsx)(r.code,{children:"'application/x-<loader.id>'"})]})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"options.fallbackMimeType"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"string"})}),(0,o.jsx)(r.td,{children:"-"}),(0,o.jsxs)(r.td,{children:["Loader selection a fallback ",(0,o.jsx)(r.code,{children:"mimeType"})," in case not provided by server. A specific loader can be specified with ",(0,o.jsx)(r.code,{children:"'application/x-<loader.id>'"})]})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{}),(0,o.jsx)(r.td,{}),(0,o.jsx)(r.td,{}),(0,o.jsx)(r.td,{})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"options.log"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"object"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"console"})}),(0,o.jsxs)(r.td,{children:["By default set to a ",(0,o.jsx)(r.code,{children:"console"})," wrapper. Setting log to ",(0,o.jsx)(r.code,{children:"null"})," will turn off logging."]})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"options.worker"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"boolean"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"true"})}),(0,o.jsx)(r.td,{children:"Runs the loader on a worker thread, if the selected loader and the runtime environment support it."})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"options.maxConcurrency"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"number"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"3"})}),(0,o.jsx)(r.td,{children:"How many worker instances should be created for each loader. Note that setting this higher than roughly the number CPU cores on your current machine will not provide much benefit and may create extra overhead."})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"option.maxMobileConcurrency"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"number"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"1"})}),(0,o.jsx)(r.td,{children:"How many worker instances should be created for each loader on mobile devices. Mobile devicee have fewer cores and less memory available."})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"options.reuseWorkers"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"boolean"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"true"})}),(0,o.jsxs)(r.td,{children:["By default, worker threads are kept in memory and reused. But if ",(0,o.jsx)(r.code,{children:"reuseWorkers"})," is ",(0,o.jsx)(r.code,{children:"false"})," workers will be automatically terminated after job completion and reloaded for each job."]})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"options.<loader-id>.workerUrl"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"string"})}),(0,o.jsx)(r.td,{children:"per-loader"}),(0,o.jsx)(r.td,{children:"If the corresponding loader can parse on a worker, the url to the worker script can be controller with this option."})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"options.modules"})}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"object"})}),(0,o.jsx)(r.td,{children:"-"}),(0,o.jsx)(r.td,{children:"Supply bundled modules (like draco3d) instead of loading from CDN."})]}),(0,o.jsxs)(r.tr,{children:[(0,o.jsxs)(r.td,{children:[(0,o.jsx)(r.code,{children:"options.CDN"})," (\ud83d\udea7 experimental)"]}),(0,o.jsx)(r.td,{children:(0,o.jsx)(r.code,{children:"string"})}),(0,o.jsx)(r.td,{children:"-"}),(0,o.jsxs)(r.td,{children:["Controls certain script loading from CDN. ",(0,o.jsx)(r.code,{children:"true"})," loads from ",(0,o.jsx)(r.code,{children:"unpkg.com/@loaders.gl"}),". ",(0,o.jsx)(r.code,{children:"false"})," load from local urls. ",(0,o.jsx)(r.code,{children:"string"})," alternate CDN url."]})]})]})]}),"\n",(0,o.jsx)(r.h2,{id:"batched-parsing-options",children:"Batched parsing options"}),"\n",(0,o.jsxs)(r.p,{children:["| Option                       | Type      | Default | Description                                                                                               |\n| ---------------------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |\n| ",(0,o.jsx)(r.code,{children:"options.metadata"}),"           | ",(0,o.jsx)(r.code,{children:"boolean"})," | ",(0,o.jsx)(r.code,{children:"false"})," | An initial batch with ",(0,o.jsx)(r.code,{children:"batchType: 'metadata'"})," will be added with information about the data being loaded. |\n| ",(0,o.jsx)(r.code,{children:"options.batches.chunkSize?"})," | ",(0,o.jsx)(r.code,{children:"number"}),'  | N/A     | When set, "atomic" inputs (like ',(0,o.jsx)(r.code,{children:"ArrayBuffer"})," or ",(0,o.jsx)(r.code,{children:"string"}),") are chunked, enabling batched parsing.         | No effect if input is already an iterator or stream. |\n| ",(0,o.jsx)(r.code,{children:"options.transforms"}),"         | ",(0,o.jsx)(r.code,{children:"*[]"}),"     | ",(0,o.jsx)(r.code,{children:"[]"}),"    | An array with transform functions that can be applied to the input data before parsing.                   |"]}),"\n",(0,o.jsx)(r.p,{children:"Notes:"}),"\n",(0,o.jsxs)(r.ul,{children:["\n",(0,o.jsxs)(r.li,{children:[(0,o.jsx)(r.code,{children:"transforms"})," is an array functions that accept and return an ",(0,o.jsx)(r.code,{children:"AsyncIterable<ArrayBuffer>"})]}),"\n"]})]})}function h(e={}){const{wrapper:r}={...(0,d.R)(),...e.components};return r?(0,o.jsx)(r,{...e,children:(0,o.jsx)(a,{...e})}):a(e)}},43023:(e,r,n)=>{n.d(r,{R:()=>s,x:()=>t});var o=n(63696);const d={},i=o.createContext(d);function s(e){const r=o.useContext(i);return o.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function t(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(d):e.components||d:s(e.components),o.createElement(i.Provider,{value:r},e.children)}}}]);