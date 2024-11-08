"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[9727],{57732:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>t,contentTitle:()=>a,default:()=>d,frontMatter:()=>s,metadata:()=>h,toc:()=>c});var i=n(62540),l=n(43023);const s={},a="What's New",h={id:"arrowjs/whats-new",title:"What's New",description:"This page attempts to collect some of the relevant information about apache-arrow JS releases.",source:"@site/../docs/arrowjs/whats-new.md",sourceDirName:"arrowjs",slug:"/arrowjs/whats-new",permalink:"/docs/arrowjs/whats-new",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/whats-new.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Introduction",permalink:"/docs/arrowjs/"},next:{title:"Upgrade Guide",permalink:"/docs/arrowjs/upgrade-guide"}},t={},c=[{value:"v17.0",id:"v170",level:2},{value:"v16.1",id:"v161",level:2},{value:"v16.0",id:"v160",level:2},{value:"v15.0",id:"v150",level:2},{value:"v14.0",id:"v140",level:2},{value:"v13.0",id:"v130",level:2},{value:"v12.0",id:"v120",level:2},{value:"v11.0",id:"v110",level:2},{value:"v10.0",id:"v100",level:2},{value:"v9.0",id:"v90",level:2},{value:"v8.0",id:"v80",level:2},{value:"v7.0",id:"v70",level:2},{value:"v6.0",id:"v60",level:2},{value:"v5.0",id:"v50",level:2},{value:"v4.0",id:"v40",level:2},{value:"v3.0",id:"v30",level:2},{value:"v2.0",id:"v20",level:2},{value:"v1.0",id:"v10",level:2}];function o(e){const r={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",ul:"ul",...(0,l.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(r.header,{children:(0,i.jsx)(r.h1,{id:"whats-new",children:"What's New"})}),"\n",(0,i.jsx)(r.p,{children:"This page attempts to collect some of the relevant information about apache-arrow JS releases.\nUnfortunately for JavaScript users, Apache Arrow JS release notes are not very easy to find:"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsxs)(r.li,{children:["There are the ",(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/",children:"Apache Arrow release notes"})," where we can scan for issues with the ",(0,i.jsx)(r.code,{children:"[JS]"})," tag."]}),"\n",(0,i.jsxs)(r.li,{children:["But there are also ",(0,i.jsx)(r.a,{href:"https://arrow.apache.org/blog/",children:"blog posts"})," that can contain different/additional information in the ",(0,i.jsx)(r.code,{children:"JavaScript notes"})," section."]}),"\n",(0,i.jsx)(r.li,{children:"And every minor release has its own page and blog, so users need to scan through a lot of docs to catch all changes."}),"\n",(0,i.jsx)(r.li,{children:"Additionally, the release notes are very brief, more of a PR title rather than a user facing description of what the change entails without reading the linked github issue."}),"\n"]}),"\n",(0,i.jsxs)(r.admonition,{type:"caution",children:[(0,i.jsx)(r.p,{children:"Apache Arrow JS follows the versioning number scheme for the cross-language Apache Arrow repository releases,\nwhich results in frequent major release bumps, even though no significant or breaking JavaScript changes have been introduced."}),(0,i.jsxs)(r.p,{children:["This can be an inconvenience for JavaScript applications that rely on ",(0,i.jsx)(r.a,{href:"https://semver.org",children:"semantic versioning"}),"\nto restrict dependencies to compatible package. Therefore some extra attention around versions may be required,\nespecially if your app uses multiple JavaScript packages dependent on arrow. You may end up bundling two\ndifferent arrow js versions or the build may break due to version requirement incompatibilities."]})]}),"\n",(0,i.jsx)(r.h2,{id:"v170",children:"v17.0"}),"\n",(0,i.jsx)(r.p,{children:"July 16, 2024"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/17.0.0.html",children:"Apache Arrow 16.0.0"})}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v161",children:"v16.1"}),"\n",(0,i.jsx)(r.p,{children:"May 14, 2024"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:"GH-40407 - [JS] Fix string coercion in MapRowProxyHandler.ownKeys (#40408)"}),"\n",(0,i.jsx)(r.li,{children:"GH-39131 - [JS] Add at() for array like types (#40730)"}),"\n",(0,i.jsx)(r.li,{children:"GH-39482 - [JS] Refactor imports (#39483)"}),"\n",(0,i.jsx)(r.li,{children:"GH-40959 - [JS] Store Timestamps in 64 bits (#40960)"}),"\n",(0,i.jsx)(r.li,{children:"GH-40989 - [JS] Update dependencies (#40990)"}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v160",children:"v16.0"}),"\n",(0,i.jsx)(r.p,{children:"April 20, 2024"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/16.0.0.html",children:"Apache Arrow 16.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"GH-40718 - [JS] Fix set visitor in vectors for js dates (#40725)"}),"\n",(0,i.jsx)(r.li,{children:"GH-40851 - [JS] Fix nullcount and make vectors created from typed arrays not nullable (#40852)"}),"\n",(0,i.jsx)(r.li,{children:"GH-40891 - [JS] Store Dates as TimestampMillisecond (#40892)"}),"\n",(0,i.jsx)(r.li,{children:"GH-41015 - [JS][Benchmarking] allow JS benchmarks to run more portably (#41031)"}),"\n",(0,i.jsx)(r.li,{children:"GH-40784 - [JS] Use bigIntToNumber (#40785)"}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v150",children:"v15.0"}),"\n",(0,i.jsx)(r.p,{children:"Jan 21, 2024"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsxs)(r.li,{children:["\n",(0,i.jsx)(r.p,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/15.0.0.html",children:"Apache Arrow 15.0.0"})}),"\n"]}),"\n",(0,i.jsxs)(r.li,{children:["\n",(0,i.jsx)(r.p,{children:"GH-39604 - Do not use resizable buffers yet (#39607)"}),"\n"]}),"\n",(0,i.jsxs)(r.li,{children:["\n",(0,i.jsx)(r.p,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/blog/2024/01/21/15.0.0-release/#javascript-notes",children:"Blog Post"})}),"\n"]}),"\n",(0,i.jsxs)(r.li,{children:["\n",(0,i.jsx)(r.p,{children:"GH-39017 - Add typeId as attribute"}),"\n"]}),"\n",(0,i.jsxs)(r.li,{children:["\n",(0,i.jsx)(r.p,{children:"GH-39257 - LargeBinary"}),"\n"]}),"\n",(0,i.jsxs)(r.li,{children:["\n",(0,i.jsx)(r.p,{children:"GH-15060 - Add LargeUtf8 type"}),"\n"]}),"\n",(0,i.jsxs)(r.li,{children:["\n",(0,i.jsx)(r.p,{children:"GH-39259 - Remove getByteLength"}),"\n"]}),"\n",(0,i.jsxs)(r.li,{children:["\n",(0,i.jsx)(r.p,{children:"GH-39435 - Add Vector.nullable"}),"\n"]}),"\n",(0,i.jsxs)(r.li,{children:["\n",(0,i.jsx)(r.p,{children:"GH-39255 - Allow customization of schema when passing vectors to table constructor"}),"\n"]}),"\n",(0,i.jsxs)(r.li,{children:["\n",(0,i.jsx)(r.p,{children:"GH-37983 - Allow nullable fields in table when constructed from vector with nulls"}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(r.p,{children:"Notes:"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:"GH-39017 (Add typeId as attribute) is significant for loaders.gl as it enables arrow Schemas to be\nreconstructed after being serialized (e.g. when posted between worker threads)."}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v140",children:"v14.0"}),"\n",(0,i.jsx)(r.p,{children:"Nov, 2023"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/14.0.0.html",children:"Apache Arrow 14.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"GH-31621 - Fix Union null bitmaps (#37122)"}),"\n",(0,i.jsx)(r.li,{children:"GH-21815 - Add support for Duration type (#37341)"}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v130",children:"v13.0"}),"\n",(0,i.jsx)(r.p,{children:"August 23, 2023"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/13.0.0.html",children:"Apache Arrow 13.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"GH-36033 - Remove BigInt compat (#36034)"}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v120",children:"v12.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/12.0.0.html",children:"Apache Arrow 12.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"GH-33681 - Update flatbuffers (#33682)"}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v110",children:"v11.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/11.0.0.html",children:"Apache Arrow 11.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"Apache Arrow JS: No significant changes."}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v100",children:"v10.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/10.0.0.html",children:"Apache Arrow 10.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"Apache Arrow JS: No significant changes."}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v90",children:"v9.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/9.0.0.html",children:"Apache Arrow 9.0.0"})}),"\n",(0,i.jsxs)(r.li,{children:["Apache Arrow JS: Breaking API changes, see ",(0,i.jsx)(r.a,{href:"./upgrade-guide",children:"Upgrade Guide"}),"."]}),"\n",(0,i.jsx)(r.li,{children:"Apache Arrow JS: Smaller, focused, tree-shakeable API."}),"\n",(0,i.jsx)(r.li,{children:"Apache Arrow JS: Removes non-core functionality from the Arrow JS library."}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v80",children:"v8.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/8.0.0.html",children:"Apache Arrow 8.0.0"})}),"\n",(0,i.jsxs)(r.li,{children:["Apache Arrow JS: Breaking API changes, see ",(0,i.jsx)(r.a,{href:"./upgrade-guide",children:"Upgrade Guide"}),"."]}),"\n",(0,i.jsx)(r.li,{children:"Apache Arrow JS: Smaller, focused, tree-shakeable API."}),"\n",(0,i.jsx)(r.li,{children:"Apache Arrow JS: Removes non-core functionality from the Arrow JS library."}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v70",children:"v7.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/7.0.0.html",children:"Apache Arrow 7.0.0"})}),"\n",(0,i.jsxs)(r.li,{children:["Apache Arrow JS: Breaking API changes, see ",(0,i.jsx)(r.a,{href:"./upgrade-guide",children:"Upgrade Guide"}),"."]}),"\n",(0,i.jsx)(r.li,{children:"Apache Arrow JS: Smaller, focused, tree-shakeable API."}),"\n",(0,i.jsx)(r.li,{children:"Apache Arrow JS: Removes non-core functionality from the Arrow JS library."}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v60",children:"v6.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/6.0.0.html",children:"Apache Arrow 6.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"Changes in Apache Arrow JS: N/A"}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v50",children:"v5.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/5.0.0.html",children:"Apache Arrow 5.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"Changes in Apache Arrow JS: N/A"}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v40",children:"v4.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/4.0.0.html",children:"Apache Arrow 4.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"Changes in Apache Arrow JS: N/A"}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v30",children:"v3.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/3.0.0.html",children:"Apache Arrow 3.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"Changes in Apache Arrow JS: N/A"}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v20",children:"v2.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/2.0.0.html",children:"Apache Arrow 2.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"Changes in Apache Arrow JS: N/A"}),"\n"]}),"\n",(0,i.jsx)(r.h2,{id:"v10",children:"v1.0"}),"\n",(0,i.jsxs)(r.ul,{children:["\n",(0,i.jsx)(r.li,{children:(0,i.jsx)(r.a,{href:"https://arrow.apache.org/release/1.0.0.html",children:"Apache Arrow 1.0.0"})}),"\n",(0,i.jsx)(r.li,{children:"Initial version"}),"\n"]})]})}function d(e={}){const{wrapper:r}={...(0,l.R)(),...e.components};return r?(0,i.jsx)(r,{...e,children:(0,i.jsx)(o,{...e})}):o(e)}},43023:(e,r,n)=>{n.d(r,{R:()=>a,x:()=>h});var i=n(63696);const l={},s=i.createContext(l);function a(e){const r=i.useContext(s);return i.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function h(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(l):e.components||l:a(e.components),i.createElement(s.Provider,{value:r},e.children)}}}]);