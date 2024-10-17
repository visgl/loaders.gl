"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[6799],{46660:(e,s,o)=>{o.r(s),o.d(s,{assets:()=>c,contentTitle:()=>r,default:()=>h,frontMatter:()=>t,metadata:()=>l,toc:()=>d});var a=o(74848),n=o(28453);const t={},r="GeoPackageLoader",l={id:"modules/geopackage/api-reference/geopackage-loader",title:"GeoPackageLoader",description:"ogc-logo",source:"@site/../docs/modules/geopackage/api-reference/geopackage-loader.md",sourceDirName:"modules/geopackage/api-reference",slug:"/modules/geopackage/api-reference/geopackage-loader",permalink:"/docs/modules/geopackage/api-reference/geopackage-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/geopackage/api-reference/geopackage-loader.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"FlatGeobufLoader",permalink:"/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader"},next:{title:"GeoTIFFLoader",permalink:"/docs/modules/geotiff/api-reference/geotiff-loader"}},c={},d=[{value:"Usage",id:"usage",level:2},{value:"Options",id:"options",level:2},{value:"Output",id:"output",level:2},{value:"Remarks",id:"remarks",level:2},{value:"Future Work",id:"future-work",level:2}];function i(e){const s={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",img:"img",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,n.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(s.h1,{id:"geopackageloader",children:"GeoPackageLoader"}),"\n",(0,a.jsx)(s.p,{children:(0,a.jsx)(s.img,{alt:"ogc-logo",src:o(44505).A+"",width:"119",height:"60"})}),"\n",(0,a.jsx)("p",{class:"badges",children:(0,a.jsx)("img",{src:"https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square",alt:"From-v3.0"})}),"\n",(0,a.jsx)(s.admonition,{type:"caution",children:(0,a.jsxs)(s.p,{children:["The ",(0,a.jsx)(s.code,{children:"GeoPackageLoader"})," depends on the ",(0,a.jsx)(s.a,{href:"https://github.com/sql-js/sql.js",children:(0,a.jsx)(s.code,{children:"sql.js"})})," npm module which has caused issues with certain JavaScript bundlers. It is recommended that you do your own tests before using the ",(0,a.jsx)(s.code,{children:"GeoPackageLoader"})," in your project."]})}),"\n",(0,a.jsx)(s.p,{children:"GeoPackage loader"}),"\n",(0,a.jsxs)(s.table,{children:[(0,a.jsx)(s.thead,{children:(0,a.jsxs)(s.tr,{children:[(0,a.jsx)(s.th,{children:"Loader"}),(0,a.jsx)(s.th,{children:"Characteristic"})]})}),(0,a.jsxs)(s.tbody,{children:[(0,a.jsxs)(s.tr,{children:[(0,a.jsx)(s.td,{children:"File Extension"}),(0,a.jsx)(s.td,{children:(0,a.jsx)(s.code,{children:".gpkg"})})]}),(0,a.jsxs)(s.tr,{children:[(0,a.jsx)(s.td,{children:"File Type"}),(0,a.jsx)(s.td,{children:"Binary"})]}),(0,a.jsxs)(s.tr,{children:[(0,a.jsx)(s.td,{children:"File Format"}),(0,a.jsx)(s.td,{children:(0,a.jsx)(s.a,{href:"https://www.geopackage.org/",children:"GeoPackage"})})]}),(0,a.jsxs)(s.tr,{children:[(0,a.jsx)(s.td,{children:"Data Format"}),(0,a.jsx)(s.td,{children:(0,a.jsx)(s.a,{href:"/docs/specifications/category-gis",children:"Geometry"})})]}),(0,a.jsxs)(s.tr,{children:[(0,a.jsx)(s.td,{children:"Supported APIs"}),(0,a.jsxs)(s.td,{children:[(0,a.jsx)(s.code,{children:"load"}),", ",(0,a.jsx)(s.code,{children:"parse"})]})]}),(0,a.jsxs)(s.tr,{children:[(0,a.jsx)(s.td,{children:"Decoder Type"}),(0,a.jsx)(s.td,{children:"Asynchronous"})]}),(0,a.jsxs)(s.tr,{children:[(0,a.jsx)(s.td,{children:"Worker Thread Support"}),(0,a.jsx)(s.td,{children:"No"})]})]})]}),"\n",(0,a.jsx)(s.h2,{id:"usage",children:"Usage"}),"\n",(0,a.jsx)(s.p,{children:"To load all tables in a geopackage file as GeoJSON:"}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-typescript",children:"import {GeoPackageLoader, GeoPackageLoaderOptions} from '@loaders.gl/geopackage';\nimport {load} from '@loaders.gl/core';\nimport {Tables, ObjectRowTable, Feature} from '@loaders.gl/schema';\n\nconst optionsAsTable: GeoPackageLoaderOptions = {\n  geopackage: {\n    shape: 'tables',\n    sqlJsCDN: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/'\n  }\n};\nconst tablesData: Tables<GeoJSONTable> = await load(url, GeoPackageLoader, optionsAsTable);\n"})}),"\n",(0,a.jsxs)(s.p,{children:["To load a specific table named ",(0,a.jsx)(s.code,{children:"feature_table"})," in a geopackage file as GeoJSON:"]}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-typescript",children:"const optionsAsGeoJson: GeoPackageLoaderOptions = {\n  geopackage: {\n    shape: 'geojson',\n    table: 'feature_table',\n    sqlJsCDN: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/'\n  }\n};\n\nconst geoJsonData: GeoJSONTable = await load(url, GeoPackageLoader, optionsAsGeoJson);\n"})}),"\n",(0,a.jsx)(s.h2,{id:"options",children:"Options"}),"\n",(0,a.jsxs)(s.p,{children:["| Option                | Type   | Default                                                  | Description                                                                                                            |\n| --------------------- | ------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------- |\n| ",(0,a.jsx)(s.code,{children:"options.shape"}),"       | String | ",(0,a.jsx)(s.code,{children:"'tables'"})," | '",(0,a.jsx)(s.code,{children:"geojson-table'"}),"                          | Output format.                                                                                                         |\n| ",(0,a.jsx)(s.code,{children:"options.table"}),"       | String | N/A                                                      | name of table to load                                                                                                  | Output format. |\n| ",(0,a.jsx)(s.code,{children:"geopackage.sqlJsCDN"})," | String | ",(0,a.jsx)(s.code,{children:"'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/'"})," | CDN from which to load the SQL.js bundle. This is loaded asynchronously when the GeoPackageLoader is called on a file. |"]}),"\n",(0,a.jsx)(s.h2,{id:"output",children:"Output"}),"\n",(0,a.jsxs)(s.p,{children:["The ",(0,a.jsx)(s.code,{children:"GeoPackageLoader"})," currently loads all features from all vector tables."]}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:["\n",(0,a.jsxs)(s.p,{children:["If ",(0,a.jsx)(s.code,{children:"options.gis.format"})," is ",(0,a.jsx)(s.code,{children:"'tables'"})," (the default):"]}),"\n",(0,a.jsxs)(s.p,{children:["Returns ",(0,a.jsx)(s.code,{children:"Tables<ObjectRowTable>"}),", an object whose ",(0,a.jsx)(s.code,{children:".tables"})," member is an array of objects with ",(0,a.jsx)(s.code,{children:"name"})," and ",(0,a.jsx)(s.code,{children:"table"})," keys. Each ",(0,a.jsx)(s.code,{children:"name"})," member holds the name of the GeoPackage table name, and each ",(0,a.jsx)(s.code,{children:".table"})," member holds a ",(0,a.jsx)(s.code,{children:"Table"})," instance. The ",(0,a.jsx)(s.code,{children:"Table.data"})," member is an array of GeoJSON features, while ",(0,a.jsx)(s.code,{children:"Table.schema"})," describes the schema types of the original Sqlite3 table."]}),"\n"]}),"\n",(0,a.jsxs)(s.li,{children:["\n",(0,a.jsxs)(s.p,{children:["If ",(0,a.jsx)(s.code,{children:"options.gis.format"})," is ",(0,a.jsx)(s.code,{children:"'geojson'"}),":"]}),"\n",(0,a.jsxs)(s.p,{children:["Returns ",(0,a.jsx)(s.code,{children:"Record<string, Feature[]>"}),", an object mapping from table name to an array of GeoJSON features. The ",(0,a.jsx)(s.code,{children:"Feature"})," type is defined in ",(0,a.jsx)(s.code,{children:"@loaders.gl/schema"}),"."]}),"\n"]}),"\n"]}),"\n",(0,a.jsx)(s.h2,{id:"remarks",children:"Remarks"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"options.geopackage.sqlJsCDN"}),": As of March 2022, SQL.js versions 1.6.0, 1.6.1, and 1.6.2 were tested as not working."]}),"\n"]}),"\n",(0,a.jsx)(s.h2,{id:"future-work",children:"Future Work"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsx)(s.li,{children:"Select a single vector layer/table to load. This could would fit well in the two-stage loader process, where the first stage reads metadata from the file (i.e. the list of available layers) and the second stage loads one or more tables."}),"\n",(0,a.jsx)(s.li,{children:"Binary and GeoJSON output. Right now the output is GeoJSON-only, and is contained within an object mapping table names to geometry data. This is the same problem as we discussed previously for MVT, where with GeoPackage especially it's decently likely to only desire a portion of the layers contained in the file."}),"\n"]})]})}function h(e={}){const{wrapper:s}={...(0,n.R)(),...e.components};return s?(0,a.jsx)(s,{...e,children:(0,a.jsx)(i,{...e})}):i(e)}},44505:(e,s,o)=>{o.d(s,{A:()=>a});const a=o.p+"assets/images/ogc-logo-60-8ee2c25a50ccc14293453512c707a0c4.png"},28453:(e,s,o)=>{o.d(s,{R:()=>r,x:()=>l});var a=o(96540);const n={},t=a.createContext(n);function r(e){const s=a.useContext(t);return a.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function l(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:r(e.components),a.createElement(t.Provider,{value:s},e.children)}}}]);