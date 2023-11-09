"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[5117],{94498:(e,s,r)=>{r.r(s),r.d(s,{assets:()=>l,contentTitle:()=>d,default:()=>a,frontMatter:()=>o,metadata:()=>c,toc:()=>t});var i=r(85893),n=r(11151);const o={},d="Overview",c={id:"modules/compression/README",title:"Overview",description:"The @loaders.gl/compression module provides a selection of lossless,",source:"@site/../docs/modules/compression/README.md",sourceDirName:"modules/compression",slug:"/modules/compression/",permalink:"/docs/modules/compression/",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/compression/README.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Overview",permalink:"/docs/modules/csv/"},next:{title:"Compression",permalink:"/docs/modules/compression/api-reference/compression"}},l={},t=[{value:"API",id:"api",level:2},{value:"Compression Formats",id:"compression-formats",level:2},{value:"Gzip",id:"gzip",level:3},{value:"Deflate",id:"deflate",level:3},{value:"Brotli",id:"brotli",level:3},{value:"LZ4",id:"lz4",level:3},{value:"Zstandard",id:"zstandard",level:3},{value:"Snappy",id:"snappy",level:3},{value:"LZO (Lempel-Ziv-Oberheimer)",id:"lzo-lempel-ziv-oberheimer",level:3},{value:"Attributions",id:"attributions",level:2}];function h(e){const s={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,n.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(s.h1,{id:"overview",children:"Overview"}),"\n",(0,i.jsx)("p",{class:"badges",children:(0,i.jsx)("img",{src:"https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square",alt:"From-v3.0"})}),"\n",(0,i.jsxs)(s.p,{children:["The ",(0,i.jsx)(s.code,{children:"@loaders.gl/compression"}),' module provides a selection of lossless,\ncompression/decompression "transforms" with a unified interface that work both in browsers and in Node.js']}),"\n",(0,i.jsx)(s.h2,{id:"api",children:"API"}),"\n",(0,i.jsxs)(s.table,{children:[(0,i.jsx)(s.thead,{children:(0,i.jsxs)(s.tr,{children:[(0,i.jsx)(s.th,{children:"Compression Class"}),(0,i.jsx)(s.th,{children:"Format"}),(0,i.jsx)(s.th,{children:"Characteristics"}),(0,i.jsx)(s.th,{children:"Library Size"}),(0,i.jsx)(s.th,{children:"Notes"})]})}),(0,i.jsxs)(s.tbody,{children:[(0,i.jsxs)(s.tr,{children:[(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"/docs/modules/compression/api-reference/no-compression",children:(0,i.jsx)(s.code,{children:"NoCompression"})})}),(0,i.jsx)(s.td,{children:"none"}),(0,i.jsx)(s.td,{children:"-"}),(0,i.jsx)(s.td,{children:"-"}),(0,i.jsx)(s.td,{})]}),(0,i.jsxs)(s.tr,{children:[(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"/docs/modules/compression/api-reference/gzip-compression",children:(0,i.jsx)(s.code,{children:"GzipCompression"})})}),(0,i.jsxs)(s.td,{children:["gzip(",(0,i.jsx)(s.code,{children:".gz"}),")"]}),(0,i.jsx)(s.td,{children:"size"}),(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"https://bundlephobia.com/package/pako",children:"Small"})}),(0,i.jsx)(s.td,{})]}),(0,i.jsxs)(s.tr,{children:[(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"/docs/modules/compression/api-reference/deflate-compression",children:(0,i.jsx)(s.code,{children:"DeflateCompression"})})}),(0,i.jsx)(s.td,{children:"DEFLATE(PKZIP)"}),(0,i.jsx)(s.td,{children:"size"}),(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"https://bundlephobia.com/package/pako",children:"Small"})}),(0,i.jsx)(s.td,{})]}),(0,i.jsxs)(s.tr,{children:[(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"/docs/modules/compression/api-reference/lz4-compression",children:(0,i.jsx)(s.code,{children:"LZ4Compression"})})}),(0,i.jsx)(s.td,{children:"LZ4"}),(0,i.jsx)(s.td,{children:'speed ("real-time")'}),(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"https://bundlephobia.com/package/lz4",children:"Medium"})}),(0,i.jsx)(s.td,{})]}),(0,i.jsxs)(s.tr,{children:[(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"/docs/modules/compression/api-reference/zstd-compression",children:(0,i.jsx)(s.code,{children:"ZstdCompression"})})}),(0,i.jsx)(s.td,{children:"Zstandard"}),(0,i.jsx)(s.td,{children:'speed ("real-time")'}),(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"https://bundlephobia.com/package/zstd-codec",children:"Large"})}),(0,i.jsx)(s.td,{})]}),(0,i.jsxs)(s.tr,{children:[(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"/docs/modules/compression/api-reference/snappy-compression",children:(0,i.jsx)(s.code,{children:"SnappyCompression"})})}),(0,i.jsx)(s.td,{children:"Snappy(Zippy)"}),(0,i.jsx)(s.td,{children:'speed ("real-time")'}),(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"https://bundlephobia.com/package/snappys",children:"Small"})}),(0,i.jsx)(s.td,{})]}),(0,i.jsxs)(s.tr,{children:[(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"/docs/modules/compression/api-reference/brotli-compression",children:(0,i.jsx)(s.code,{children:"BrotliCompression"})})}),(0,i.jsx)(s.td,{children:"Brotli"}),(0,i.jsx)(s.td,{children:"Size, fast decompress, slow compress"}),(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"https://bundlephobia.com/package/brotli",children:"Large"})}),(0,i.jsx)(s.td,{})]}),(0,i.jsxs)(s.tr,{children:[(0,i.jsx)(s.td,{children:(0,i.jsx)(s.a,{href:"/docs/modules/compression/api-reference/lzo-compression",children:(0,i.jsx)(s.code,{children:"LZOCompression"})})}),(0,i.jsx)(s.td,{children:"Lempel-Ziv-Oberheimer"}),(0,i.jsx)(s.td,{children:"size"}),(0,i.jsx)(s.td,{children:"Node.js only"}),(0,i.jsx)(s.td,{})]})]})]}),"\n",(0,i.jsx)(s.h2,{id:"compression-formats",children:"Compression Formats"}),"\n",(0,i.jsx)(s.h3,{id:"gzip",children:"Gzip"}),"\n",(0,i.jsxs)(s.p,{children:[(0,i.jsx)(s.code,{children:"GZIP"})," uses ",(0,i.jsx)(s.code,{children:"DEFLATE"})," compression data, wrapping ",(0,i.jsx)(s.code,{children:"DEFLATE"})," compression data with\na header and a checksum. The ",(0,i.jsx)(s.code,{children:"GZIP"})," format is the most commonly used HTTP compression\nscheme, and it is also produced by ",(0,i.jsx)(s.code,{children:"gzip"})," tool."]}),"\n",(0,i.jsx)(s.h3,{id:"deflate",children:"Deflate"}),"\n",(0,i.jsxs)(s.p,{children:[(0,i.jsx)(s.code,{children:"DEFLATE"})," is a patent-free compression algorithm for lossless data compression.\n",(0,i.jsx)(s.code,{children:"DEFLATE"})," is a major HTTP compression scheme, and is also used internally in Zip archives\n(",(0,i.jsx)(s.code,{children:".zip"})," files)."]}),"\n",(0,i.jsx)(s.h3,{id:"brotli",children:"Brotli"}),"\n",(0,i.jsxs)(s.p,{children:[(0,i.jsx)(s.code,{children:"Brotli"})," is a newer HTTP compression scheme that results in better (~20%)\ncompressed data sizes at the cost of slower compression.\nAlso used internally in e.g. Apache Parquet files."]}),"\n",(0,i.jsxs)(s.p,{children:["Note that in contrast to Gzip and Deflate, ",(0,i.jsx)(s.code,{children:"brotli"})," is not\nsupported by all browsers. Therefore resources are usually served\nin both ",(0,i.jsx)(s.code,{children:"brotli"})," and ",(0,i.jsx)(s.code,{children:"gzip"})," versions by a server that understands\nthe ",(0,i.jsx)(s.code,{children:"Accept-Encoding"})," HTTP header."]}),"\n",(0,i.jsx)(s.h3,{id:"lz4",children:"LZ4"}),"\n",(0,i.jsxs)(s.p,{children:[(0,i.jsx)(s.a,{href:"https://en.wikipedia.org/wiki/LZ4_(compression_algorithm)",children:(0,i.jsx)(s.code,{children:"LZ4"})}),"\nis a real-time compression format focused on speed.\nUsed in e.g. Apache Arrow ",(0,i.jsx)(s.code,{children:".feather"})," files."]}),"\n",(0,i.jsx)(s.h3,{id:"zstandard",children:"Zstandard"}),"\n",(0,i.jsxs)(s.p,{children:[(0,i.jsx)(s.code,{children:"Zstandard"})," is a real-time compression format focused on speed.\nUsed in e.g. Apache Arrow ",(0,i.jsx)(s.code,{children:".feather"})," files."]}),"\n",(0,i.jsx)(s.h3,{id:"snappy",children:"Snappy"}),"\n",(0,i.jsxs)(s.p,{children:[(0,i.jsx)(s.code,{children:"Snappy"})," (Previously known as ",(0,i.jsx)(s.code,{children:"Zippy"}),") is a real-time compression format that\ntargets very high compression (GB/s) speed at the cost of compressed size.\nUsed in e.g. Apache Parquet files."]}),"\n",(0,i.jsx)(s.h3,{id:"lzo-lempel-ziv-oberheimer",children:"LZO (Lempel-Ziv-Oberheimer)"}),"\n",(0,i.jsxs)(s.p,{children:[(0,i.jsx)(s.code,{children:"Snappy"})," (Previously known as ",(0,i.jsx)(s.code,{children:"Zippy"}),") is a real-time compression format that\ntargets very high compression (GB/s) speed at the cost of compressed size.\nUsed in e.g. Apache Parquet files."]}),"\n",(0,i.jsx)(s.h2,{id:"attributions",children:"Attributions"}),"\n",(0,i.jsx)(s.p,{children:"MIT licensed. This module does not fork any code. however it includes npm dependencies as follows:"}),"\n",(0,i.jsxs)(s.p,{children:["| --- | ---\n| ",(0,i.jsx)(s.a,{href:"https://zlib.net/",children:"pako"}),"         | MIT |\n| ",(0,i.jsx)(s.a,{href:"https://github.com/lz4/lz4",children:"lz4"})," |  |\n| ",(0,i.jsx)(s.a,{href:"https://github.com/lz4/lz4",children:"lz4"})," |  |\n| ",(0,i.jsx)(s.a,{href:"https://github.com/lz4/lz4",children:"snappy"})," |              |\n| ",(0,i.jsx)(s.a,{href:"https://github.com/lz4/lz4",children:"brotli"})," | Arrow Feather               | Optimized for speed (real-time compression)             |\n|"]})]})}function a(e={}){const{wrapper:s}={...(0,n.a)(),...e.components};return s?(0,i.jsx)(s,{...e,children:(0,i.jsx)(h,{...e})}):h(e)}},11151:(e,s,r)=>{r.d(s,{Z:()=>c,a:()=>d});var i=r(67294);const n={},o=i.createContext(n);function d(e){const s=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function c(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:d(e.components),i.createElement(o.Provider,{value:s},e.children)}}}]);