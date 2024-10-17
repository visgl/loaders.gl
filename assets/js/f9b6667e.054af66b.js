"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[2004],{61729:(e,t,i)=>{i.r(t),i.d(t,{assets:()=>a,contentTitle:()=>n,default:()=>h,frontMatter:()=>d,metadata:()=>l,toc:()=>o});var s=i(62540),r=i(43023);const d={},n="PMTiles",l={id:"modules/pmtiles/formats/pmtiles",title:"PMTiles",description:"- @loaders.gl/pmtiles",source:"@site/../docs/modules/pmtiles/formats/pmtiles.mdx",sourceDirName:"modules/pmtiles/formats",slug:"/modules/pmtiles/formats/pmtiles",permalink:"/docs/modules/pmtiles/formats/pmtiles",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/pmtiles/formats/pmtiles.mdx",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"GeoParquet",permalink:"/docs/modules/parquet/formats/geoparquet"},next:{title:"Shapefile",permalink:"/docs/modules/shapefile/formats/shapefile"}},a={},o=[{value:"Tile types",id:"tile-types",level:2},{value:"Metadata",id:"metadata",level:2},{value:"Advanced Features",id:"advanced-features",level:2}];function c(e){const t={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,r.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.header,{children:(0,s.jsx)(t.h1,{id:"pmtiles",children:"PMTiles"})}),"\n",(0,s.jsxs)(t.ul,{children:["\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"/docs/modules/pmtiles",children:(0,s.jsx)(t.em,{children:(0,s.jsx)(t.code,{children:"@loaders.gl/pmtiles"})})})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"https://github.com/protomaps/PMTiles",children:(0,s.jsx)(t.em,{children:"PMTiles specification"})})}),"\n",(0,s.jsxs)(t.li,{children:[(0,s.jsx)(t.a,{href:"/examples/tiles/pmtiles",children:(0,s.jsx)(t.em,{children:"PMTiles example"})}),"."]}),"\n"]}),"\n",(0,s.jsx)(t.p,{children:"PMTiles is a general format for storing tiled data addressed by Z/X/Y coordinates in a single (big) archive file. PMTiles is optimized for the cloud and can be hosted on commodity storage platforms like S3, enabling low-cost, zero-maintenance map applications, without requiring a server in the middle. PMTiles is structured to minimize overhead requests. The current V3 version of the format includes directories and tile data."}),"\n",(0,s.jsx)(t.p,{children:"PMTiles is commonly used for visualization (e.g. for cartographic basemap vector tiles), and then often contains vector data, where each tile data contained within the archive is encoded as a Mapbox Vector Tile (MVT), however it can also be used to store image tiles (in PNG and JPEG format) containing e.g. raster data or terrain mesh data."}),"\n",(0,s.jsx)(t.p,{children:"A PMTiles archive replaces a big directory tree of thousands of individual tile files, allowing an entire tileset to be manipulated (uploaded, downloaded, served, analyzed) as a single file."}),"\n",(0,s.jsxs)(t.p,{children:["In addition, there is a range of utilities and libraries for working with PMTiles, such Python packages for reading and writing, and support for various programming languages and tools as well as a number of viewers. And tiling tools such as ",(0,s.jsx)(t.a,{href:"https://github.com/felt/tippecanoe",children:"tippecanoe"})," can now output directly to PMTiles."]}),"\n",(0,s.jsx)(t.h2,{id:"tile-types",children:"Tile types"}),"\n",(0,s.jsx)(t.p,{children:"PMTiles is a container format and can in principle contain any type of quadtree-organized tiles. A number of vector and image tile types are predefined."}),"\n",(0,s.jsxs)(t.table,{children:[(0,s.jsx)(t.thead,{children:(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.th,{children:"Type"}),(0,s.jsx)(t.th,{children:"MIME type"}),(0,s.jsx)(t.th,{children:"pmtiles"}),(0,s.jsx)(t.th,{children:"Description"})]})}),(0,s.jsxs)(t.tbody,{children:[(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"MVT"})}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"'application/vnd.mapbox-vector-tile'"})}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"1"})}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"/docs/modules/mvt/formats/mvt",children:"Mapbox Vector Tile"})})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"PNG"})}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"'image/png'"})}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"2"})}),(0,s.jsx)(t.td,{})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"JPEG"})}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"'image/jpeg'"})}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"3"})}),(0,s.jsx)(t.td,{})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"WEBP"})}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"'image/webp'"})}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"4"})}),(0,s.jsx)(t.td,{})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"AVIF"})}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"'image/avif'"})}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"5"})}),(0,s.jsx)(t.td,{})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"..."}),(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"'application/octet-stream'"})}),(0,s.jsx)(t.td,{children:"..."}),(0,s.jsx)(t.td,{children:"Can be used for custom tile types"})]})]})]}),"\n",(0,s.jsx)(t.h2,{id:"metadata",children:"Metadata"}),"\n",(0,s.jsxs)(t.p,{children:["The pmtiles header has a metadata field that can store arbitrary JSON metadata about the tileset. This means that for MVT pmtiles, ",(0,s.jsx)(t.a,{href:"/docs/modules/mvt/formats/tilejson",children:"TileJSON"})," is typically available in the PMTiles header."]}),"\n",(0,s.jsx)(t.h2,{id:"advanced-features",children:"Advanced Features"}),"\n",(0,s.jsx)(t.p,{children:"pmtiles supports refreshing the index if the underlying PMTiles file is rewritten and the storage backend supports ETag headers (which Amazon S3 does)."})]})}function h(e={}){const{wrapper:t}={...(0,r.R)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}},43023:(e,t,i)=>{i.d(t,{R:()=>n,x:()=>l});var s=i(63696);const r={},d=s.createContext(r);function n(e){const t=s.useContext(d);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:n(e.components),s.createElement(d.Provider,{value:t},e.children)}}}]);