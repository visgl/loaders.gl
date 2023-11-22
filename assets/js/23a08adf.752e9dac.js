"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[8878],{48796:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>d,contentTitle:()=>o,default:()=>h,frontMatter:()=>s,metadata:()=>l,toc:()=>c});var i=n(85893),r=n(11151);const s={},o="GeoJSONTiler",l={id:"modules/mvt/api-reference/geojson-tiler",title:"GeoJSONTiler",description:"The GeoJSONTiler slices large GeoJSON data into small vector tiles on the fly.",source:"@site/../docs/modules/mvt/api-reference/geojson-tiler.md",sourceDirName:"modules/mvt/api-reference",slug:"/modules/mvt/api-reference/geojson-tiler",permalink:"/docs/modules/mvt/api-reference/geojson-tiler",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/mvt/api-reference/geojson-tiler.md",tags:[],version:"current",frontMatter:{}},d={},c=[{value:"Install",id:"install",level:3},{value:"Usage",id:"usage",level:3},{value:"Options",id:"options",level:3},{value:"Attribution",id:"attribution",level:2}];function a(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,r.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.h1,{id:"geojsontiler",children:"GeoJSONTiler"}),"\n",(0,i.jsxs)(t.p,{children:["The ",(0,i.jsx)(t.code,{children:"GeoJSONTiler"})," slices large GeoJSON data into small vector tiles on the fly."]}),"\n",(0,i.jsx)(t.p,{children:"The primary intended use case is to enable rendering and interacting with large geospatial datasets\nin the browser (without requiring data to be pre-tiled and tiles to be served from a server)."}),"\n",(0,i.jsxs)(t.p,{children:["The resulting tiles conform to the JSON output of the ",(0,i.jsx)(t.a,{href:"./mvt-loader",children:(0,i.jsx)(t.code,{children:"MVTLoader"})}),"\n(which loads pre-tiled tiles in the ",(0,i.jsx)(t.a,{href:"https://github.com/mapbox/vector-tile-spec/",children:"vector tile specification"}),"\ninto GeoJSON format)."]}),"\n",(0,i.jsx)(t.p,{children:"To make data rendering and interaction fast, the GeoJSON content in the generated tiles\nis not only cut out from the larger input GeoJSON. It are also optimized further to only\nretain the minimum level of detail appropriate for each zoom level\n(shapes are simplified and tiny polygons and line segments are filtered out)."}),"\n",(0,i.jsx)(t.h3,{id:"install",children:"Install"}),"\n",(0,i.jsxs)(t.p,{children:["Install using NPM (",(0,i.jsx)(t.code,{children:"npm install @loaders.gl/mvt"}),") or Yarn (",(0,i.jsx)(t.code,{children:"yarn install @loaders.gl/mvt"}),")."]}),"\n",(0,i.jsx)(t.p,{children:"TBD - Or use a browser build directly:"}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-html",children:'<script src="https://unpkg.com/@loaders.gl/mvt/dist.min.js"><\/script>\n'})}),"\n",(0,i.jsx)(t.h3,{id:"usage",children:"Usage"}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-typescript",children:"import {GeoJSONTiler} from '@loaders.gl/mvt';\n\n// build an initial index of tiles\nconst tileSource = new GeoJSONTiler(geoJSON);\n\n// request a particular tile\nconst features = tileSource.getTile(z, x, y).features;\n\n// show an array of tile coordinates created so far\nconsole.log(tileSource.tileCoords); // [{z: 0, x: 0, y: 0}, ...]\n"})}),"\n",(0,i.jsx)(t.h3,{id:"options",children:"Options"}),"\n",(0,i.jsx)(t.p,{children:"You can fine-tune the results with an options object,\nalthough the defaults are sensible and work well for most use cases."}),"\n",(0,i.jsxs)(t.table,{children:[(0,i.jsx)(t.thead,{children:(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.th,{children:"Option"}),(0,i.jsx)(t.th,{children:"Default"}),(0,i.jsx)(t.th,{children:"Description"})]})}),(0,i.jsxs)(t.tbody,{children:[(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"indexMaxZoom"})}),(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"5"})}),(0,i.jsx)(t.td,{children:"Max zoom in the initial tile index"})]}),(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"indexMaxPoints"})}),(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"100000"})}),(0,i.jsx)(t.td,{children:"Max number of points per tile in the index"})]}),(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"maxZoom"})}),(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"14"})}),(0,i.jsx)(t.td,{children:"Max zoom to preserve detail on; can't be higher than 24"})]}),(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"tolerance"})}),(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"3"})}),(0,i.jsx)(t.td,{children:"Simplification tolerance (higher means simpler)"})]}),(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"extent"})}),(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"4096"})}),(0,i.jsx)(t.td,{children:"tile extent (both width and height)"})]}),(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"buffer"})}),(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"64"})}),(0,i.jsx)(t.td,{children:"Tile buffer on each side"})]}),(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"promoteId"})}),(0,i.jsx)(t.td,{children:"N/A"}),(0,i.jsx)(t.td,{children:"Name of a feature property to use for feature.id."})]}),(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"generateId"})}),(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"false"})}),(0,i.jsx)(t.td,{children:"Whether to generate feature ids."})]}),(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"debug"})}),(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"0"})}),(0,i.jsx)(t.td,{children:"Logging level (0 to disable, 1 or 2)"})]}),(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"lineMetrics"})}),(0,i.jsx)(t.td,{children:(0,i.jsx)(t.code,{children:"false"})}),(0,i.jsx)(t.td,{children:"Enable line metrics tracking for LineString/MultiLineString features"})]})]})]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-typescript",children:"import {GeoJSONTiler} from '@loaders.gl/mvt`\nconst tileSource = new GeoJSONTiler(parsedGeojson, {\n\tindexMaxZoom: 5,  // max zoom in the initial tile index\n\tmaxZoom: 14,      // max zoom to preserve detail on; can't be higher than 24\n\ttolerance: 3,     // simplification tolerance (higher means simpler)\n\textent: 4096,     // tile extent (both width and height)\n\tbuffer: 64,   // tile buffer on each side\n\tdebug: 0,     // logging level (0 to disable, 1 or 2)\n\tlineMetrics: false, // whether to enable line metrics tracking for LineString/MultiLineString features\n\tpromoteId: null,    // name of a feature property to promote to feature.id. Cannot be used with `generateId`\n\tgenerateId: false,  // whether to generate feature ids. Cannot be used with `promoteId`\n\tindexMaxPoints: 100000 // max number of points per tile in the index\n});\n"})}),"\n",(0,i.jsx)(t.p,{children:"Remarks:"}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsx)(t.li,{children:"GeoJSONTiler only operates on zoom levels up to 24."}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.code,{children:"generateId"})," and ",(0,i.jsx)(t.code,{children:"promoteId"})," cannot both be specified at the same time."]}),"\n",(0,i.jsxs)(t.li,{children:["The ",(0,i.jsx)(t.code,{children:"promoteId"})," and ",(0,i.jsx)(t.code,{children:"generateId"})," options ignore existing ",(0,i.jsx)(t.code,{children:"id"})," values on the feature objects."]}),"\n",(0,i.jsxs)(t.li,{children:["By default, tiles at zoom levels above ",(0,i.jsx)(t.code,{children:"indexMaxZoom"})," are generated on the fly, but you can pre-generate all possible tiles for ",(0,i.jsx)(t.code,{children:"data"})," by setting ",(0,i.jsx)(t.code,{children:"indexMaxZoom"})," and ",(0,i.jsx)(t.code,{children:"maxZoom"})," to the same value, setting ",(0,i.jsx)(t.code,{children:"indexMaxPoints"})," to ",(0,i.jsx)(t.code,{children:"0"}),", and then accessing the resulting tile coordinates from the ",(0,i.jsx)(t.code,{children:"tileCoords"})," property of ",(0,i.jsx)(t.code,{children:"tileSource"}),"."]}),"\n"]}),"\n",(0,i.jsx)(t.h2,{id:"attribution",children:"Attribution"}),"\n",(0,i.jsxs)(t.p,{children:["This class is a fork of Mapbox / Vladimir Agafonkin's wonderful ",(0,i.jsx)(t.a,{href:"https://github.com/mapbox/geojson-vt",children:"geojson-vt"})," module."]}),"\n",(0,i.jsxs)(t.p,{children:["This directory is forked from Mapbox's ",(0,i.jsx)(t.a,{href:"https://github.com/mapbox/geojson-vt",children:"https://github.com/mapbox/geojson-vt"})," under ISC License."]})]})}function h(e={}){const{wrapper:t}={...(0,r.a)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(a,{...e})}):a(e)}},11151:(e,t,n)=>{n.d(t,{Z:()=>l,a:()=>o});var i=n(67294);const r={},s=i.createContext(r);function o(e){const t=i.useContext(s);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:o(e.components),i.createElement(s.Provider,{value:t},e.children)}}}]);