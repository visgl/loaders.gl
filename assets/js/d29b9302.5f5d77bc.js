"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[6881],{63284:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>l,contentTitle:()=>i,default:()=>h,frontMatter:()=>s,metadata:()=>d,toc:()=>t});var o=n(85893),a=n(11151);const s={},i="Using Worker Loaders",d={id:"developer-guide/using-worker-loaders",title:"Using Worker Loaders",description:"Most loaders.gl loaders can perform parsing on JavaScript worker threads.",source:"@site/../docs/developer-guide/using-worker-loaders.md",sourceDirName:"developer-guide",slug:"/developer-guide/using-worker-loaders",permalink:"/docs/developer-guide/using-worker-loaders",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/developer-guide/using-worker-loaders.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Loader Categories",permalink:"/docs/developer-guide/loader-categories"},next:{title:"Using Batched Loaders",permalink:"/docs/developer-guide/using-streaming-loaders"}},l={},t=[{value:"Processing Data on Workers",id:"processing-data-on-workers",level:2},{value:"Parsing data on Workers",id:"parsing-data-on-workers",level:2},{value:"Loading Files in Parallel using Worker Loaders",id:"loading-files-in-parallel-using-worker-loaders",level:2},{value:"Disabling Worker Loaders",id:"disabling-worker-loaders",level:2},{value:"Disabling Reuse of Workers",id:"disabling-reuse-of-workers",level:2},{value:"Concurrency Level and Worker Reuse",id:"concurrency-level-and-worker-reuse",level:2},{value:"ArrayBuffer Neutering",id:"arraybuffer-neutering",level:2},{value:"Specifying Worker Script URLs (Advanced)",id:"specifying-worker-script-urls-advanced",level:2},{value:"Composite Loaders and Workers (Advanced)",id:"composite-loaders-and-workers-advanced",level:2},{value:"Debugging Worker Loaders (Advanced)",id:"debugging-worker-loaders-advanced",level:2}];function c(e){const r={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,a.a)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(r.h1,{id:"using-worker-loaders",children:"Using Worker Loaders"}),"\n",(0,o.jsx)(r.p,{children:"Most loaders.gl loaders can perform parsing on JavaScript worker threads.\nThis means that the main thread will not block during parsing and can continue\nto respond to user interactions or do parallel processing."}),"\n",(0,o.jsx)(r.p,{children:"Worker threads can also run in parallel, increasing your application's performance\nwhen loading parsing many files in parallel."}),"\n",(0,o.jsx)(r.p,{children:"Note that worker thread loading is not always the best choice since the transfer of\ndata between workers and the main thread is only efficient if the data is predominantly\nbinary."}),"\n",(0,o.jsx)(r.p,{children:"When worker thread loading is not offered in a specific loader it is usually\nbecause it would not provide any performance benefits."}),"\n",(0,o.jsx)(r.p,{children:"Another advantage when using pure worker loaders is that the code required to\nparse a format is not bundled into the application but loaded on demand. This is\nparticularly useful when adding loaders that are only used occasionally by your\napplication."}),"\n",(0,o.jsxs)(r.p,{children:["More details on advantages and complications with worker thread based loading the\n",(0,o.jsx)(r.a,{href:"./concepts/worker-threads",children:"Worker Threads"})," article in the concepts section."]}),"\n",(0,o.jsx)(r.h2,{id:"processing-data-on-workers",children:"Processing Data on Workers"}),"\n",(0,o.jsxs)(r.p,{children:["The ",(0,o.jsx)(r.code,{children:"processOnWorker"})," function in ",(0,o.jsx)(r.code,{children:"@loaders.gl/worker-utils"})," is used with worker objects\nexported by modules like ",(0,o.jsx)(r.code,{children:"@loaders.gl/compression"})," and ",(0,o.jsx)(r.code,{children:"@loaders.gl/crypto"})," to move\nprocessing intensive tasks to workers."]}),"\n",(0,o.jsx)(r.h2,{id:"parsing-data-on-workers",children:"Parsing data on Workers"}),"\n",(0,o.jsx)(r.h2,{id:"loading-files-in-parallel-using-worker-loaders",children:"Loading Files in Parallel using Worker Loaders"}),"\n",(0,o.jsxs)(r.p,{children:["The ",(0,o.jsx)(r.code,{children:"DracoLoader"})," is an example of a worker enabled loader.\nIt parses data on worker threads by default. To load two Draco encoded meshes\n",(0,o.jsx)(r.em,{children:"in parallel"})," on worker threads, just use the ",(0,o.jsx)(r.code,{children:"DracoLoader"})," as follows:"]}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-typescript",children:"import {load} from '@loaders.gl/core';\nimport {DracoLoader} from '@loaders.gl/draco';\n\nasync function loadInParallel(url1, url2) {\n  const [data1, data2] = await Promise.all([load(url1, DracoLoader), load(url2, DracoLoader)]);\n}\n"})}),"\n",(0,o.jsx)(r.h2,{id:"disabling-worker-loaders",children:"Disabling Worker Loaders"}),"\n",(0,o.jsxs)(r.p,{children:["Applications can use the ",(0,o.jsx)(r.code,{children:"worker: false"})," option to disable worker loaders, for instance to simplify debugging of parsing issues:"]}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-typescript",children:"async function loadWithoutWorker(url1) {\n  const data = await load(url1, DracoLoader, {worker: false});\n}\n"})}),"\n",(0,o.jsx)(r.h2,{id:"disabling-reuse-of-workers",children:"Disabling Reuse of Workers"}),"\n",(0,o.jsxs)(r.p,{children:["Applications reuse already created workers by default. To avoid ",(0,o.jsx)(r.code,{children:"enlarge memory arrays"})," error it is really nesessary to disable it if you need to load multiple datasets in a sequence.\nThis functionality can be disabled by ",(0,o.jsx)(r.code,{children:"reuseWorkers: false"})," option:"]}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-typescript",children:"async function loadwWithoutWorker(url1) {\n  const data = await load(url1, DracoLoader, {worker: true, reuseWorkers: false});\n}\n"})}),"\n",(0,o.jsx)(r.h2,{id:"concurrency-level-and-worker-reuse",children:"Concurrency Level and Worker Reuse"}),"\n",(0,o.jsxs)(r.p,{children:["Concurrency - The ",(0,o.jsx)(r.code,{children:"options.maxConcurrency"})," and ",(0,o.jsx)(r.code,{children:"option.maxMobileConcurrency"})," options can be adjusted to define how many worker instances should be created for each format. Note that setting this higher than roughly the number CPU cores on your current machine will not provide much benefit and may create extra overhead."]}),"\n",(0,o.jsx)(r.p,{children:"Worker reuse - Workers threads can occupy memoery and"}),"\n",(0,o.jsx)(r.h2,{id:"arraybuffer-neutering",children:"ArrayBuffer Neutering"}),"\n",(0,o.jsxs)(r.p,{children:["Be aware that when calling worker loaders, binary data is transferred from the calling thread to the worker thread. This means that if you are using ",(0,o.jsx)(r.code,{children:"parse"}),", any ",(0,o.jsx)(r.code,{children:"ArrayBuffer"}),' parameter you pass in to the will be "neutered" and no longer be accessible in the calling thread.']}),"\n",(0,o.jsx)(r.p,{children:"Most applications will not need to do further processing on the raw binary data after it has been parsed so this is rarely an issue, but if you do, you may need to copy the data before parsing, or disable worker loading (see above)."}),"\n",(0,o.jsx)(r.h2,{id:"specifying-worker-script-urls-advanced",children:"Specifying Worker Script URLs (Advanced)"}),"\n",(0,o.jsxs)(r.p,{children:["In JavaScript, worker threads are loaded from separate scripts files and are typically not part of the main application bundle. For ease-of-use, loaders.gl provides a default set of pre-built worker threads which are published on loaders.gl npm distribution from ",(0,o.jsx)(r.code,{children:"unpck.com"})," CDN (Content Delivery Network)."]}),"\n",(0,o.jsx)(r.p,{children:"As an advanced option, it is possible to for application to specify alternate URLs for loading a pre-built worker loader instance."}),"\n",(0,o.jsx)(r.p,{children:"This can be useful e.g. when building applications that cannot access CDNs or when creating highly customized application builds, or doing in-depth debugging."}),"\n",(0,o.jsx)(r.h2,{id:"composite-loaders-and-workers-advanced",children:"Composite Loaders and Workers (Advanced)"}),"\n",(0,o.jsx)(r.p,{children:"loaders.gl supports sub-loader invocation from worker loaders."}),"\n",(0,o.jsx)(r.p,{children:"A worker loader starts a seperate thread with a javascript bundle that only contains the code for that loader, so a worker loader needs to call the main thread (and indirectly, potentially another worker thread with another worrker loader) to parse using a sub-loader, properly transferring data into and back from the other thread."}),"\n",(0,o.jsx)(r.h2,{id:"debugging-worker-loaders-advanced",children:"Debugging Worker Loaders (Advanced)"}),"\n",(0,o.jsxs)(r.p,{children:["Debugging worker loaders is tricky. While it is always possible to specify ",(0,o.jsx)(r.code,{children:"options.worker: false"})," which helps in many situations, there are cases where the worker loader itself must be debugged."]}),"\n",(0,o.jsx)(r.p,{children:"TBA - There is an ambition to provide better support for debugging worker loaders:"}),"\n",(0,o.jsxs)(r.ul,{children:["\n",(0,o.jsx)(r.li,{children:"Pre-build non-minified versions of workers, and provide option to easily select those."}),"\n",(0,o.jsx)(r.li,{children:"Let loaders.gl developers easily switch between CDN and locally built workers."}),"\n",(0,o.jsx)(r.li,{children:"..."}),"\n"]})]})}function h(e={}){const{wrapper:r}={...(0,a.a)(),...e.components};return r?(0,o.jsx)(r,{...e,children:(0,o.jsx)(c,{...e})}):c(e)}},11151:(e,r,n)=>{n.d(r,{Z:()=>d,a:()=>i});var o=n(67294);const a={},s=o.createContext(a);function i(e){const r=o.useContext(s);return o.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function d(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:i(e.components),o.createElement(s.Provider,{value:r},e.children)}}}]);