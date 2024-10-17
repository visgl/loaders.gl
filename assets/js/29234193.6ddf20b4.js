"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[6620],{40481:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>d,contentTitle:()=>i,default:()=>h,frontMatter:()=>n,metadata:()=>t,toc:()=>l});var a=s(62540),o=s(43023);const n={},i="Introduction",t={id:"README",title:"Introduction",description:"&nbsp;",source:"@site/../docs/README.mdx",sourceDirName:".",slug:"/",permalink:"/docs/",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/README.mdx",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",next:{title:"Get Started",permalink:"/docs/developer-guide/get-started"}},d={},l=[{value:"Overview",id:"overview",level:2},{value:"Loaders",id:"loaders",level:2},{value:"Code Examples",id:"code-examples",level:2},{value:"Supported Platforms",id:"supported-platforms",level:2},{value:"Design Goals",id:"design-goals",level:2},{value:"Licenses",id:"licenses",level:2},{value:"Credits and Attributions",id:"credits-and-attributions",level:2},{value:"Primary maintainers",id:"primary-maintainers",level:2},{value:"Open Governance",id:"open-governance",level:2}];function c(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,o.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(r.header,{children:(0,a.jsx)(r.h1,{id:"introduction",children:"Introduction"})}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)("img",{src:"https://badge.fury.io/js/%40loaders.gl%2Fcore.svg"})," \xa0\n",(0,a.jsx)("img",{src:"https://img.shields.io/badge/License-MIT-green.svg"})," \xa0\n",(0,a.jsx)("img",{src:"https://img.shields.io/npm/dm/@loaders.gl/core.svg"}),"  \xa0 \xa0 \xa0"]}),"\n",(0,a.jsx)("br",{}),"\n",(0,a.jsx)("br",{}),"\n",(0,a.jsxs)(r.p,{children:["This documentation describes loaders.gl ",(0,a.jsx)(r.strong,{children:"v4"}),". See our ",(0,a.jsx)(r.a,{href:"/docs/whats-new",children:(0,a.jsx)(r.strong,{children:"release notes"})})," to learn what is new."]}),"\n",(0,a.jsxs)(r.p,{children:["Docs for older versions are available on github:\n",(0,a.jsx)(r.strong,{children:(0,a.jsx)(r.a,{href:"https://github.com/visgl/loaders.gl/blob/3.3-release/docs/README.md",children:"v3.3"})}),",\n",(0,a.jsx)(r.strong,{children:(0,a.jsx)(r.a,{href:"https://github.com/visgl/loaders.gl/blob/2.3-release/docs/README.md",children:"v2.3"})}),",\n",(0,a.jsx)(r.strong,{children:(0,a.jsx)(r.a,{href:"https://github.com/visgl/loaders.gl/blob/1.3-release/docs/README.md",children:"v1.3"})}),"."]}),"\n",(0,a.jsx)(r.h2,{id:"overview",children:"Overview"}),"\n",(0,a.jsx)(r.p,{children:"loaders.gl is a collection of open source loaders and writers for various file formats,\nprimarily focused on supporting visualization and analytics of big data.\nTabular, geospatial, and 3D file formats are well covered."}),"\n",(0,a.jsx)(r.p,{children:"Published as a suite of composable loader modules with consistent APIs and features,\noffering advanced features such as worker thread and incremental parsing,\nloaders.gl aims to be a trusted companion when you need to load data into your application."}),"\n",(0,a.jsxs)(r.p,{children:["While loaders.gl can be used with any JavaScript application or framework,\n",(0,a.jsx)(r.a,{href:"https://vis.gl/frameworks",children:"vis.gl frameworks"})," such as ",(0,a.jsx)(r.a,{href:"https://deck.gl",children:(0,a.jsx)(r.strong,{children:"deck.gl"})}),"\ncome pre-integrated with loaders.gl."]}),"\n",(0,a.jsx)(r.h2,{id:"loaders",children:"Loaders"}),"\n",(0,a.jsx)(r.p,{children:"loaders.gl provides a wide selection of loaders organized into categories:"}),"\n",(0,a.jsxs)(r.table,{children:[(0,a.jsx)(r.thead,{children:(0,a.jsxs)(r.tr,{children:[(0,a.jsx)(r.th,{children:"Category"}),(0,a.jsx)(r.th,{children:"Loaders"})]})}),(0,a.jsxs)(r.tbody,{children:[(0,a.jsxs)(r.tr,{children:[(0,a.jsx)(r.td,{children:(0,a.jsx)(r.a,{href:"/docs/specifications/category-table",children:"Table Loaders"})}),(0,a.jsxs)(r.td,{children:["Streaming tabular loaders for ",(0,a.jsx)(r.a,{href:"/docs/modules/csv/api-reference/csv-loader",children:"CSV"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/json/api-reference/json-loader",children:"JSON"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/arrow/api-reference/arrow-loader",children:"Arrow"})," etc"]})]}),(0,a.jsxs)(r.tr,{children:[(0,a.jsx)(r.td,{children:(0,a.jsx)(r.a,{href:"/docs/specifications/category-gis",children:"Geospatial Loaders"})}),(0,a.jsxs)(r.td,{children:["Loaders for geospatial formats such as ",(0,a.jsx)(r.a,{href:"/docs/modules/json/api-reference/geojson-loader",children:"GeoJSON"})," ",(0,a.jsx)(r.a,{href:"/docs/modules/kml/api-reference/kml-loader",children:"KML"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/wkt/api-reference/wkt-loader",children:"WKT/WKB"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/mvt/api-reference/mvt-loader",children:"Mapbox Vector Tiles"})," etc."]})]}),(0,a.jsxs)(r.tr,{children:[(0,a.jsx)(r.td,{children:(0,a.jsx)(r.a,{href:"/docs/specifications/category-image",children:"Image Loaders"})}),(0,a.jsxs)(r.td,{children:["Loaders for ",(0,a.jsx)(r.a,{href:"/docs/modules/images/api-reference/image-loader",children:"images"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/textures/api-reference/compressed-texture-loader",children:"compressed textures"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/textures/api-reference/basis-loader",children:"supercompressed textures (Basis)"}),". Utilities for ",(0,a.jsx)(r.a,{href:"/docs/modules/textures/api-reference/load-image-array",children:"mipmapped arrays"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/textures/api-reference/load-image-cube",children:"cubemaps"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/images/api-reference/binary-image-api",children:"binary images"})," and more."]})]}),(0,a.jsxs)(r.tr,{children:[(0,a.jsx)(r.td,{children:(0,a.jsx)(r.a,{href:"/docs/specifications/category-mesh",children:"Pointcloud and Mesh Loaders"})}),(0,a.jsxs)(r.td,{children:["Loaders for point cloud and simple mesh formats such as ",(0,a.jsx)(r.a,{href:"/docs/modules/draco/api-reference/draco-loader",children:"Draco"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/las/api-reference/las-loader",children:"LAS"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/pcd/api-reference/pcd-loader",children:"PCD"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/ply/api-reference/ply-loader",children:"PLY"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/obj/api-reference/obj-loader",children:"OBJ"}),", and ",(0,a.jsx)(r.a,{href:"/docs/modules/terrain/api-reference/terrain-loader",children:"Terrain"}),"."]})]}),(0,a.jsxs)(r.tr,{children:[(0,a.jsx)(r.td,{children:(0,a.jsx)(r.a,{href:"/docs/specifications/category-scenegraph",children:"Scenegraph Loaders"})}),(0,a.jsxs)(r.td,{children:[(0,a.jsx)(r.a,{href:"/docs/modules/gltf/api-reference/gltf-loader",children:"glTF"})," loader"]})]}),(0,a.jsxs)(r.tr,{children:[(0,a.jsx)(r.td,{children:(0,a.jsx)(r.a,{href:"/docs/specifications/category-3d-tiles",children:"Tiled Data Loaders"})}),(0,a.jsxs)(r.td,{children:["Loaders for 3D tile formats such as ",(0,a.jsx)(r.a,{href:"/docs/modules/3d-tiles/api-reference/tiles-3d-loader",children:"3D Tiles"}),", ",(0,a.jsx)(r.a,{href:"/docs/modules/i3s/api-reference/i3s-loader",children:"I3S"})," and potree"]})]})]})]}),"\n",(0,a.jsx)(r.h2,{id:"code-examples",children:"Code Examples"}),"\n",(0,a.jsx)(r.p,{children:"loaders.gl provides a small core API module with common functions to load and save data,\nand a range of optional modules that provide loaders and writers for specific file formats."}),"\n",(0,a.jsxs)(r.p,{children:["A minimal example using the ",(0,a.jsx)(r.code,{children:"load"})," function and the ",(0,a.jsx)(r.code,{children:"CSVLoader"})," to load a CSV formatted table into a JavaScript array:"]}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{className:"language-typescript",children:"import {load} from '@loaders.gl/core';\nimport {CSVLoader} from '@loaders.gl/csv';\n\nconst data = await load('data.csv', CSVLoader);\n\nfor (const row of data) {\n  console.log(JSON.stringify(row)); // => '{header1: value1, header2: value2}'\n}\n"})}),"\n",(0,a.jsx)(r.p,{children:'Streaming parsing is available using ES2018 async iterators, e.g. allowing "larger than memory" files to be incrementally processed:'}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{className:"language-typescript",children:"import {loadInBatches} from '@loaders.gl/core';\nimport {CSVLoader} from '@loaders.gl/csv';\n\nfor await (const batch of await loadInBatches('data.csv', CSVLoader)) {\n  for (const row of batch) {\n    console.log(JSON.stringify(row)); // => '{header1: value1, header2: value2}'\n  }\n}\n"})}),"\n",(0,a.jsxs)(r.p,{children:["To quickly get up to speed on how the loaders.gl API works, please see ",(0,a.jsx)(r.a,{href:"docs/developer-guide/get-started",children:"Get Started"}),"."]}),"\n",(0,a.jsx)(r.h2,{id:"supported-platforms",children:"Supported Platforms"}),"\n",(0,a.jsx)(r.p,{children:"loaders.gl supports both browsers and Node.js:"}),"\n",(0,a.jsxs)(r.ul,{children:["\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Evergreen Browsers"})," recent versions of major evergreen browsers (e.g. Chrome, Firefox, Safari) are supported on both desktop and mobile."]}),"\n",(0,a.jsxs)(r.li,{children:[(0,a.jsx)(r.strong,{children:"Node.js"})," All current ",(0,a.jsx)(r.a,{href:"https://nodejs.org/en/about/previous-releases",children:"LTS releases"})," are supported."]}),"\n"]}),"\n",(0,a.jsx)(r.h2,{id:"design-goals",children:"Design Goals"}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Framework Agnostic"})," - Files are parsed into clearly documented plain data structures (objects + typed arrays) that can be used with any JavaScript framework."]}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Browser Support"})," - supports recent versions of evergreen browsers, and ensures that loaders are easy to bundle."]}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Node Support"})," - loaders.gl can be used when writing backend and cloud services, and you can confidently run your unit tests under Node."]}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Worker Support"})," - Many loaders.gl loaders come with pre-built web workers, keeping the main thread free for other tasks while parsing completes."]}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Loader Categories"}),' - loaders.gl groups similar data formats into "categories" that return parsed data in "standardized" form. This makes it easier to build applications that can handle multiple similar file formats.']}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Format Autodection"})," - Applications can specify multiple loaders when parsing a file, and loaders.gl will automatically pick the right loader for a given file based on a combination of file/url extensions, MIME types and initial data bytes."]}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Streaming Support"}),' - Many loaders can parse in batches from both node and WhatWG streams, allowing "larger than memory" files to be processed, and initial results to be available while the remainder of a file is still loading.']}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Composability and Bundle-Size Optimization"})," - Loaders for each file format are published in independent npm modules to allow applications to cherry-pick only the loaders it needs. In addition, modules are optimized for tree-shaking, and many larger loader libraries and web workers are loaded from CDN on use and not included in your application bundle."]}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Binary Data"})," - loaders.gl is optimized to load into compact memory representations and use with WebGL frameworks (e.g. by returning typed arrays whenever possible). Note that in spite of the ",(0,a.jsx)(r.code,{children:".gl"})," naming, loaders.gl has no any actual WebGL dependencies and loaders can be used without restrictions in non-WebGL applications."]}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Multi-Asset Loading"})," - Formats like glTF, Shapefile, or mip mapped / cube textures can require dozens of separate loads to resolve all linked assets (external buffers, images etc). loaders.gl loads all linked assets before resolving the returned ",(0,a.jsx)(r.code,{children:"Promise"}),"."]}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.strong,{children:"Modern JavaScript"})," - loaders.gl is written in TypeScript 5.0 and standard ES2018, is packaged as ECMAScript modules, and the API emphasizes modern, portable JavaScript constructs, e.g. async iterators instead of streams, ",(0,a.jsx)(r.code,{children:"ArrayBuffer"})," instead of ",(0,a.jsx)(r.code,{children:"Buffer"}),", etc."]}),"\n",(0,a.jsx)(r.h2,{id:"licenses",children:"Licenses"}),"\n",(0,a.jsx)(r.p,{children:"loaders.gl itself is MIT licensed, however various modules contain forked code under several permissive, compatible open source licenses, such as ISC, BSD and Apache licenses. Each loader module provides some license notes, so if the distinction matters to you, please check the documentation for each module and decide accordingly. We guarantee that loaders.gl will never include code with non-permissive, commercial or copy-left licenses."}),"\n",(0,a.jsx)(r.h2,{id:"credits-and-attributions",children:"Credits and Attributions"}),"\n",(0,a.jsx)(r.p,{children:"loaders.gl is maintained by a group of organizations collaborating through open governance under the OpenJS and Linux Foundations."}),"\n",(0,a.jsx)(r.p,{children:"While loaders.gl contains substantial amounts of original code, it also repackages lots of superb work done by others in the open source community. We try to be as explicit as we can about the origins and attributions of each piece of code, both in the documentation page for each module and in the preservation of comments relating to authorship and contributions inside forked source code."}),"\n",(0,a.jsx)(r.p,{children:"Even so, we can make mistakes, and we may not have the full history of the code we are reusing. If you think that we have missed something, or that we could do better in regard to attribution, please let us know."}),"\n",(0,a.jsx)(r.h2,{id:"primary-maintainers",children:"Primary maintainers"}),"\n",(0,a.jsx)(r.p,{children:"Organizations that currently contribute most significantly to the development and maintenance of loaders.gl:"}),"\n",(0,a.jsxs)("p",{style:{marginLeft:30,marginRight:"auto"},children:[(0,a.jsx)("a",{href:"https://studio.foursquare.com",children:(0,a.jsx)("img",{height:"80",src:"https://raw.githubusercontent.com/visgl/deck.gl-data/master/images/logos/Foursquare.svg"})}),(0,a.jsx)("br",{}),(0,a.jsx)("br",{}),(0,a.jsx)("a",{href:"https://carto.com",children:(0,a.jsx)("img",{height:"80",src:"https://raw.githubusercontent.com/visgl/deck.gl-data/master/images/logos/carto.svg"})})]}),"\n",(0,a.jsx)(r.h2,{id:"open-governance",children:"Open Governance"}),"\n",(0,a.jsxs)(r.p,{children:["loaders.gl is a part of the ",(0,a.jsx)("a",{href:"https://vis.gl",children:(0,a.jsx)("b",{children:"vis.gl framework suite"})}),", an open governance Linux Foundation project that is developed collaboratively by multiple organizations and individuals and the Urban Computing Foundation."]}),"\n",(0,a.jsx)("a",{href:"https://vis.gl",children:(0,a.jsxs)("span",{style:{display:"flex",flexDirection:"column",padding:30,gap:50},children:[(0,a.jsx)("img",{height:"30",width:"150",src:"https://raw.githubusercontent.com/visgl/deck.gl-data/master/images/logos/openjsf-color-textg.png"}),(0,a.jsx)("img",{height:"30",width:"150",src:"https://raw.githubusercontent.com/visgl/deck.gl-data/master/images/logos/vis-logo.png"})]})})]})}function h(e={}){const{wrapper:r}={...(0,o.R)(),...e.components};return r?(0,a.jsx)(r,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}},43023:(e,r,s)=>{s.d(r,{R:()=>i,x:()=>t});var a=s(63696);const o={},n=a.createContext(o);function i(e){const r=a.useContext(n);return a.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function t(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:i(e.components),a.createElement(n.Provider,{value:r},e.children)}}}]);