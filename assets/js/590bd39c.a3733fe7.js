"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[7786],{53513:(e,t,i)=>{i.r(t),i.d(t,{assets:()=>d,contentTitle:()=>n,default:()=>h,frontMatter:()=>r,metadata:()=>o,toc:()=>l});var a=i(85893),s=i(11151);const r={},n="Cloud Native Geospatial Formats",o={id:"specifications/cloud-native-geospatial",title:"Cloud Native Geospatial Formats",description:"Author: Ib Green",source:"@site/../docs/specifications/cloud-native-geospatial.md",sourceDirName:"specifications",slug:"/specifications/cloud-native-geospatial",permalink:"/docs/specifications/cloud-native-geospatial",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/specifications/cloud-native-geospatial.md",tags:[],version:"current",frontMatter:{}},d={},l=[{value:"The Formats",id:"the-formats",level:2},{value:"References",id:"references",level:2}];function c(e){const t={a:"a",h1:"h1",h2:"h2",li:"li",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,s.a)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.h1,{id:"cloud-native-geospatial-formats",children:"Cloud Native Geospatial Formats"}),"\n",(0,a.jsx)(t.p,{children:"Author: Ib Green"}),"\n",(0,a.jsx)(t.p,{children:"There is a lot of excitement in the geospatial community about \u201ccloud native geospatial formats\u201d."}),"\n",(0,a.jsx)(t.h2,{id:"the-formats",children:"The Formats"}),"\n",(0,a.jsx)(t.p,{children:"Notable characteristics of these formats are found below"}),"\n",(0,a.jsxs)(t.table,{children:[(0,a.jsx)(t.thead,{children:(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.th,{children:"Format"}),(0,a.jsx)(t.th,{children:"Description"})]})}),(0,a.jsxs)(t.tbody,{children:[(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"Big Data:"}),(0,a.jsx)(t.td,{children:"CNGFs are designed for big geospatial data"})]}),(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"Serverless"}),(0,a.jsx)(t.td,{children:"All CNGFs can be loaded by a client directly from files on e.g. s3 or a CDN without an intermediary server."})]}),(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"Chunked/Tiled/Pre-indexed"}),(0,a.jsx)(t.td,{children:"Data in CNGFs is structured in a way that allows clients (backend and front-end clients) to do partial reads from big files, loading just the data that is required for the geospatial region they need."})]}),(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"HTTP range requests"}),(0,a.jsx)(t.td,{children:"A core technology that is being exploited is the ability to do a standard REST HTTP GET call but reading just the required range of bytes from a large, potentially too-large-to-load file."})]})]})]}),"\n",(0,a.jsx)(t.p,{children:"In some cases, the files are really collections of smaller files (e.g. \u201ctiles\u201d) that can be read using range requests and clients are expected to load a small subset of the tiles at a time rather than the full file."}),"\n",(0,a.jsx)(t.p,{children:"Key contenders in cloud native geospatial format category are:"}),"\n",(0,a.jsxs)(t.table,{children:[(0,a.jsx)(t.thead,{children:(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.th,{children:"Format"}),(0,a.jsx)(t.th,{children:"Description"})]})}),(0,a.jsxs)(t.tbody,{children:[(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"flatgeobuf (spec)"}),(0,a.jsx)(t.td,{children:"A project of passion from Bj\xf6rn Hartell (Norway) that started as a compact binary geojson alternative."})]}),(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"The format initially gained interest because of its beautiful streaming capabilities (demo). Bjorn has kept working on it and added spatial indexing, making a good case for counting it as a cloud native geospatial format."}),(0,a.jsx)(t.td,{})]}),(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"Geoparquet"}),(0,a.jsx)(t.td,{children:"Parquet is a binary columnar data format optimized for storage. Files can be chunked so that it is possible to read a range of rows without reading the whole file. Geoparquet defines metadata fields specifying which buffers contain WKB-encoded geometry."})]}),(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"Geoarrow"}),(0,a.jsx)(t.td,{children:"Arrow is a binary columnar data format optimized for in-memory usage. Files can be chunked so that it is possible to read a range of rows without reading the whole file. Like geoparquet, geoarrow defines almost identical metadata fields specifying which buffers contain WKB-encoded geometry."})]}),(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"COG (Cloud Optimized Geotiff)"}),(0,a.jsx)(t.td,{})]}),(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"pmtiles"}),(0,a.jsx)(t.td,{children:"Stores of a large number of tiles in a single very big file, indexed for partial (HTTP range request) reads.  Can be cleaner than having directories of 10 - 100K tile files."})]}),(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"COPC"}),(0,a.jsx)(t.td,{children:"Store massive point clouds in a single file with additive subclouds being available for range HTTP requests."})]}),(0,a.jsxs)(t.tr,{children:[(0,a.jsx)(t.td,{children:"STAC"}),(0,a.jsx)(t.td,{children:"STAC is not a file format but a catalog format, that complements the CNGFs above. It is generally used to describe collections of cloud optimized geotiff files, however it is a general geospatial data catalog format that is increasingly being used for more general geospatial data archives. E.g. both Amazon and Microsoft offer petabyte sized archives of satellite data indexed by STAC."})]})]})]}),"\n",(0,a.jsx)(t.h2,{id:"references",children:"References"}),"\n",(0,a.jsxs)(t.ul,{children:["\n",(0,a.jsxs)(t.li,{children:["[Cloud Native Geospatial Foundation]9",(0,a.jsx)(t.a,{href:"https://cloudnativegeo.org/",children:"https://cloudnativegeo.org/"}),") foundation."]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.a,{href:"https://radiant.earth/",children:"Radiant Earth"})," - Non-profit foundation, CEO Jed Sundvall (worked on Cloud-Optimized GeoTiff standard),"]}),"\n"]})]})}function h(e={}){const{wrapper:t}={...(0,s.a)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}},11151:(e,t,i)=>{i.d(t,{Z:()=>o,a:()=>n});var a=i(67294);const s={},r=a.createContext(s);function n(e){const t=a.useContext(r);return a.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function o(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:n(e.components),a.createElement(r.Provider,{value:t},e.children)}}}]);