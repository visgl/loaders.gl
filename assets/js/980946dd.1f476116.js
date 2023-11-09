"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[1267],{79159:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>i,contentTitle:()=>c,default:()=>p,frontMatter:()=>n,metadata:()=>d,toc:()=>t});var a=s(85893),o=s(11151);const n={},c="Compression",d={id:"modules/compression/api-reference/compression",title:"Compression",description:"Compression is the abstract base class for loaders.gl compressions.",source:"@site/../docs/modules/compression/api-reference/compression.md",sourceDirName:"modules/compression/api-reference",slug:"/modules/compression/api-reference/compression",permalink:"/docs/modules/compression/api-reference/compression",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/compression/api-reference/compression.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Overview",permalink:"/docs/modules/compression/"},next:{title:"BrotliCompression",permalink:"/docs/modules/compression/api-reference/brotli-compression"}},i={},t=[{value:"Fields",id:"fields",level:2},{value:"<code>name</code>: string",id:"name-string",level:4},{value:"<code>isSupported</code>: string",id:"issupported-string",level:4},{value:"Methods",id:"methods",level:2},{value:"<code>preload(): Promise&lt;void&gt;</code>",id:"preload-promisevoid",level:4},{value:"<code>compress(data: ArrayBuffer): Promise&lt;ArrayBuffer&gt;</code>",id:"compressdata-arraybuffer-promisearraybuffer",level:4},{value:"<code>decompress(data: ArrayBuffer): Promise&lt;ArrayBuffer&gt;</code>",id:"decompressdata-arraybuffer-promisearraybuffer",level:4},{value:"<code>compressSync(data: ArrayBuffer): ArrayBuffer</code>",id:"compresssyncdata-arraybuffer-arraybuffer",level:4},{value:"<code>decompressSync(data: ArrayBuffer): ArrayBuffer</code>",id:"decompresssyncdata-arraybuffer-arraybuffer",level:4},{value:"<code>compressBatches(data: AsyncIterable&lt;ArrayBuffer&gt;): AsyncIterable&lt;ArrayBuffer&gt;</code>",id:"compressbatchesdata-asynciterablearraybuffer-asynciterablearraybuffer",level:4},{value:"<code>decompressBatches(data: AsyncIterable&lt;ArrayBuffer&gt;): AsyncIterable&lt;ArrayBuffer&gt;</code>",id:"decompressbatchesdata-asynciterablearraybuffer-asynciterablearraybuffer",level:4}];function l(e){const r={code:"code",h1:"h1",h2:"h2",h4:"h4",p:"p",...(0,o.a)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(r.h1,{id:"compression",children:"Compression"}),"\n",(0,a.jsx)("p",{class:"badges",children:(0,a.jsx)("img",{src:"https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square",alt:"From-v3.0"})}),"\n",(0,a.jsxs)(r.p,{children:[(0,a.jsx)(r.code,{children:"Compression"})," is the abstract base class for loaders.gl compressions."]}),"\n",(0,a.jsx)(r.h2,{id:"fields",children:"Fields"}),"\n",(0,a.jsxs)(r.h4,{id:"name-string",children:[(0,a.jsx)(r.code,{children:"name"}),": string"]}),"\n",(0,a.jsx)(r.p,{children:"The name of the compression scheme"}),"\n",(0,a.jsxs)(r.h4,{id:"issupported-string",children:[(0,a.jsx)(r.code,{children:"isSupported"}),": string"]}),"\n",(0,a.jsx)(r.h2,{id:"methods",children:"Methods"}),"\n",(0,a.jsx)(r.h4,{id:"preload-promisevoid",children:(0,a.jsx)(r.code,{children:"preload(): Promise<void>"})}),"\n",(0,a.jsxs)(r.p,{children:["Asynchronously loads required libraries. For some compressions this must be completed before\n",(0,a.jsx)(r.code,{children:"compressSync()"})," and ",(0,a.jsx)(r.code,{children:"decompressSync()"})," are available."]}),"\n",(0,a.jsx)(r.h4,{id:"compressdata-arraybuffer-promisearraybuffer",children:(0,a.jsx)(r.code,{children:"compress(data: ArrayBuffer): Promise<ArrayBuffer>"})}),"\n",(0,a.jsx)(r.p,{children:"Asynchronously compresses data."}),"\n",(0,a.jsx)(r.h4,{id:"decompressdata-arraybuffer-promisearraybuffer",children:(0,a.jsx)(r.code,{children:"decompress(data: ArrayBuffer): Promise<ArrayBuffer>"})}),"\n",(0,a.jsx)(r.p,{children:"Asynchronously decompresses data."}),"\n",(0,a.jsx)(r.h4,{id:"compresssyncdata-arraybuffer-arraybuffer",children:(0,a.jsx)(r.code,{children:"compressSync(data: ArrayBuffer): ArrayBuffer"})}),"\n",(0,a.jsx)(r.p,{children:"Synchronously compresses data."}),"\n",(0,a.jsxs)(r.p,{children:["For some compressions ",(0,a.jsx)(r.code,{children:"preload()"})," must have been called and completed before\nsynchronous operations are available."]}),"\n",(0,a.jsx)(r.h4,{id:"decompresssyncdata-arraybuffer-arraybuffer",children:(0,a.jsx)(r.code,{children:"decompressSync(data: ArrayBuffer): ArrayBuffer"})}),"\n",(0,a.jsx)(r.p,{children:"Asynchronously decompresses data."}),"\n",(0,a.jsxs)(r.p,{children:["For some compressions ",(0,a.jsx)(r.code,{children:"preload()"})," must have been called and completed before\nsynchronous operations are available."]}),"\n",(0,a.jsx)(r.h4,{id:"compressbatchesdata-asynciterablearraybuffer-asynciterablearraybuffer",children:(0,a.jsx)(r.code,{children:"compressBatches(data: AsyncIterable<ArrayBuffer>): AsyncIterable<ArrayBuffer>"})}),"\n",(0,a.jsx)(r.p,{children:"Asynchronously compresses data in batches."}),"\n",(0,a.jsxs)(r.p,{children:["If the underlying compression does not support streaming compression,\nthe incoming data will be concatenated into a single ",(0,a.jsx)(r.code,{children:"ArrayBuffer"}),"\nand a single compressed batch will be yielded."]}),"\n",(0,a.jsx)(r.h4,{id:"decompressbatchesdata-asynciterablearraybuffer-asynciterablearraybuffer",children:(0,a.jsx)(r.code,{children:"decompressBatches(data: AsyncIterable<ArrayBuffer>): AsyncIterable<ArrayBuffer>"})}),"\n",(0,a.jsx)(r.p,{children:"Asynchronously decompresses data."}),"\n",(0,a.jsxs)(r.p,{children:["Note: If the underlying compression does not support streaming compression,\nthe incoming data will be concatenated into a single ",(0,a.jsx)(r.code,{children:"ArrayBuffer"}),"\nand a single decompressed batch will be yielded."]})]})}function p(e={}){const{wrapper:r}={...(0,o.a)(),...e.components};return r?(0,a.jsx)(r,{...e,children:(0,a.jsx)(l,{...e})}):l(e)}},11151:(e,r,s)=>{s.d(r,{Z:()=>d,a:()=>c});var a=s(67294);const o={},n=a.createContext(o);function c(e){const r=a.useContext(n);return a.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function d(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:c(e.components),a.createElement(n.Provider,{value:r},e.children)}}}]);