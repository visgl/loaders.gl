"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[336],{35933:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>d,contentTitle:()=>i,default:()=>h,frontMatter:()=>t,metadata:()=>o,toc:()=>l});var a=n(62540),s=n(43023);const t={},i="Worker Threads",o={id:"developer-guide/concepts/worker-threads",title:"Worker Threads",description:"On modern browsers, many loaders.gl loaders are set up to run on JavaScript worker threads. (Refer the documentation of each loader to see if it supports worker thread loading).",source:"@site/../docs/developer-guide/concepts/worker-threads.md",sourceDirName:"developer-guide/concepts",slug:"/developer-guide/concepts/worker-threads",permalink:"/docs/developer-guide/concepts/worker-threads",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/developer-guide/concepts/worker-threads.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"AsyncIterators",permalink:"/docs/developer-guide/concepts/async-iterators"},next:{title:"I3S Building Scene Layer (BSL)",permalink:"/docs/modules/i3s/recipes/building-scene-layer"}},d={},l=[{value:"Data Transfer",id:"data-transfer",level:2},{value:"Data Types",id:"data-types",level:2},{value:"Message Passing",id:"message-passing",level:2},{value:"Build Configuration",id:"build-configuration",level:2},{value:"Bundle size concerns",id:"bundle-size-concerns",level:2},{value:"Debugging and Benchmarking",id:"debugging-and-benchmarking",level:2}];function c(e){const r={h1:"h1",h2:"h2",header:"header",li:"li",p:"p",strong:"strong",ul:"ul",...(0,s.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(r.header,{children:(0,a.jsx)(r.h1,{id:"worker-threads",children:"Worker Threads"})}),"\n",(0,a.jsx)(r.p,{children:"On modern browsers, many loaders.gl loaders are set up to run on JavaScript worker threads. (Refer the documentation of each loader to see if it supports worker thread loading)."}),"\n",(0,a.jsx)(r.p,{children:"Loading and parsing of data on worker threads can bring significant advantages"}),"\n",(0,a.jsxs)(r.ul,{children:["\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Avoid blocking the browser main thread"}),' - when parsing longer files, the main thread can become blocked, effectively "freezing" the application\'s user interface until parsing completes.']}),"\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Parallel parsing on multi-core CPUs"})," - when parsing multiple files on machines that have multiple cores (essentially all machines, even modern mobile phones tend to have at least two cores), worker threads enables multiple files to be parsed in parallel which can dramatically reduce the total load times."]}),"\n"]}),"\n",(0,a.jsx)(r.p,{children:"Hoever, there are a number of considerations when loading and parsing data on JavaScript worker threads:"}),"\n",(0,a.jsxs)(r.ul,{children:["\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Serialization/deserializion overhead"})," when transferring resuls back to main thread can more than defeat gains from loading on a separate thread."]}),"\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Choice of Data Types"})," - Due to data transfer issues there are constraints on what data types are appropriate"]}),"\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Build configuration"})," - Workers can require complex build system setup/configuration."]}),"\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Message Passing"})," - Parsing on workers requires message passing between threads. While simple it can add clutter to application code."]}),"\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Debugging"})," - Worker based code tends to be harder to debug. Being able to easily switch back to main thread parsing (or an alternate worker build) can be very helpful."]}),"\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Startup Times"})," - Worker startup times can defeat speed gains from parsing on workers."]}),"\n"]}),"\n",(0,a.jsx)(r.h2,{id:"data-transfer",children:"Data Transfer"}),"\n",(0,a.jsx)(r.p,{children:"Threads cannot share non-binary data structures and these have to be serialized/deserialized. This is a big issue for worker thread based loading as the purpose of loaders is typically to load and parse big datastructures, and main thread deserialization times are often comparable to or even exceed the time required to parse the data in the first place, defeating the value of moving parsing to a worker thread."}),"\n",(0,a.jsx)(r.p,{children:"The solution is usually to use data types that support ownership transfer (see next section) as much as possible and minimize the amount of non-binary data returned from the parser."}),"\n",(0,a.jsx)(r.h2,{id:"data-types",children:"Data Types"}),"\n",(0,a.jsx)(r.p,{children:"JavaScript ArrayBuffers and Typed Arrays can be passed with minimal overhead (ownership transfer) and the value of worker based parsing usually depends on whether the loaded data can (mostly) be stored in these types."}),"\n",(0,a.jsx)(r.h2,{id:"message-passing",children:"Message Passing"}),"\n",(0,a.jsx)(r.p,{children:"loaders.gl will handle message passing behind the scenes. Loading on a worker thread returns a promise that completes when the worker is done and the data has been transferred back to the main thread."}),"\n",(0,a.jsx)(r.h2,{id:"build-configuration",children:"Build Configuration"}),"\n",(0,a.jsx)(r.p,{children:'All worker enabled loaders come with a pre-built, minimal worker "executable" to enable zero-configuration use in applications.'}),"\n",(0,a.jsx)(r.h2,{id:"bundle-size-concerns",children:"Bundle size concerns"}),"\n",(0,a.jsx)(r.p,{children:"All worker enabled loaders provide separate loader objects to ensure that tree-shaking bundlers will be able to remove the code for the unused case."}),"\n",(0,a.jsx)(r.h2,{id:"debugging-and-benchmarking",children:"Debugging and Benchmarking"}),"\n",(0,a.jsx)(r.p,{children:"Loaders.gl offers loader objects for main thread and worker threads. A simple switch lets you move your loading back to the main thread for easier debugging and benchmarking (comparing speeds to ensure you are gaining the benefits you expect from worker thread based loading)."})]})}function h(e={}){const{wrapper:r}={...(0,s.R)(),...e.components};return r?(0,a.jsx)(r,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}},43023:(e,r,n)=>{n.d(r,{R:()=>i,x:()=>o});var a=n(63696);const s={},t=a.createContext(s);function i(e){const r=a.useContext(t);return a.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function o(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:i(e.components),a.createElement(t.Provider,{value:r},e.children)}}}]);