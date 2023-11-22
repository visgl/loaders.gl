"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[4475],{51273:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>c,contentTitle:()=>o,default:()=>d,frontMatter:()=>i,metadata:()=>l,toc:()=>a});var n=s(85893),r=s(11151);const i={},o="Request Scheduler",l={id:"modules/loader-utils/api-reference/request-scheduler",title:"Request Scheduler",description:'The request scheduler enables an application to "issue" a large number of requests without flooding the browser\'s limited request queue.',source:"@site/../docs/modules/loader-utils/api-reference/request-scheduler.md",sourceDirName:"modules/loader-utils/api-reference",slug:"/modules/loader-utils/api-reference/request-scheduler",permalink:"/docs/modules/loader-utils/api-reference/request-scheduler",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/loader-utils/api-reference/request-scheduler.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Overview",permalink:"/docs/modules/loader-utils/"},next:{title:"parseWithContext",permalink:"/docs/modules/loader-utils/api-reference/parse-with-context"}},c={},a=[{value:"Usage",id:"usage",level:2},{value:"Methods",id:"methods",level:2},{value:"constructor(options?: object)",id:"constructoroptions-object",level:3},{value:"<code>scheduleRequest(handle: any, getPriority?: () =&gt; number): Promise&lt;{done: () =&gt; any)}&gt;</code>",id:"schedulerequesthandle-any-getpriority---number-promisedone---any",level:3},{value:"About Request Priorities",id:"about-request-priorities",level:2}];function u(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"request-scheduler",children:"Request Scheduler"}),"\n",(0,n.jsx)("p",{class:"badges",children:(0,n.jsx)("img",{src:"https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square",alt:"From-v2.2"})}),"\n",(0,n.jsx)(t.p,{children:'The request scheduler enables an application to "issue" a large number of requests without flooding the browser\'s limited request queue.'}),"\n",(0,n.jsx)(t.p,{children:'A getPriority callback is called on all outstanding requests whenever a slot frees up, allowing the application to reprioritize or even cancel "issued" requests if the application state has changed.'}),"\n",(0,n.jsx)(t.p,{children:"Note: The request scheduler does not actually issue requests, it just lets apps know when the request can be issued without overwhelming the connection and the server."}),"\n",(0,n.jsx)(t.p,{children:"A primary use case is to let the app reprioritize or cancel requests if circumstances change before the request can be scheduled."}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:["Some information on browser ",(0,n.jsx)(t.a,{href:"https://docs.pushtechnology.com/cloud/latest/manual/html/designguide/solution/support/connection_limitations.html",children:"request throttling"})]}),"\n"]}),"\n",(0,n.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsx)(t.p,{children:"To schedule a request so that it can be issued at a time when it can be immediately processed."}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-typescript",children:"const URL = '...';\nconst requestToken = await requestScheduler.scheduleRequest(URL);\nif (requestToken) {\n  await fetch(URL);\n  requestToken.done(); // NOTE: **must** be called for the next request in queue to resolve\n}\n"})}),"\n",(0,n.jsx)(t.h2,{id:"methods",children:"Methods"}),"\n",(0,n.jsx)(t.h3,{id:"constructoroptions-object",children:"constructor(options?: object)"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"id"}),"?: string;"]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"throttleRequests"}),"?: boolean;"]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"maxRequests"}),"?: number;"]}),"\n"]}),"\n",(0,n.jsx)(t.h3,{id:"schedulerequesthandle-any-getpriority---number-promisedone---any",children:(0,n.jsx)(t.code,{children:"scheduleRequest(handle: any, getPriority?: () => number): Promise<{done: () => any)}>"})}),"\n",(0,n.jsx)(t.p,{children:"Called by an application that wants to issue a request, without having it deeply queued by the browser"}),"\n",(0,n.jsxs)(t.p,{children:["When the returned promise resolved, it is OK for the application to issue a request.\nThe promise resolves to an object that contains a ",(0,n.jsx)(t.code,{children:"done"})," method.\nWhen the application's request has completed (or failed), the application must call the ",(0,n.jsx)(t.code,{children:"done"})," function"]}),"\n",(0,n.jsx)(t.p,{children:"Parameters"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"handle"})," an arbitrary handle to identify the request, e.g. a URL string"]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"getPriority"}),' will be called when request "slots" open up,\nallowing the caller to update priority or cancel the request\nHighest priority executes first, priority < 0 cancels the request']}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:"Returns a promise that"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:["resolves to an object (with a ",(0,n.jsx)(t.code,{children:"done"})," field) when the request can be issued without queueing. The application should issue the request and call ",(0,n.jsx)(t.code,{children:"done()"})," when completed."]}),"\n",(0,n.jsxs)(t.li,{children:["resolves to ",(0,n.jsx)(t.code,{children:"null"})," if the request has been cancelled (by the callback return < 0).\nIn this case the application should not issue the request."]}),"\n"]}),"\n",(0,n.jsx)(t.h2,{id:"about-request-priorities",children:"About Request Priorities"}),"\n",(0,n.jsxs)(t.p,{children:["The ",(0,n.jsx)(t.code,{children:"getPriority"})," callback controls priority of requests and also cancellation of outstanding requests."]})]})}function d(e={}){const{wrapper:t}={...(0,r.a)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(u,{...e})}):u(e)}},11151:(e,t,s)=>{s.d(t,{Z:()=>l,a:()=>o});var n=s(67294);const r={},i=n.createContext(r);function o(e){const t=n.useContext(i);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:o(e.components),n.createElement(i.Provider,{value:t},e.children)}}}]);