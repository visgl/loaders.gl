"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[9258],{67886:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>a,contentTitle:()=>c,default:()=>u,frontMatter:()=>n,metadata:()=>i,toc:()=>d});var t=s(62540),o=s(43023);const n={},c="Using Sources",i={id:"developer-guide/using-sources",title:"Using Sources",description:"loaders.gl provides a number of Source exports that support multi-step data loading. Sources are different from loaders:",source:"@site/../docs/developer-guide/using-sources.md",sourceDirName:"developer-guide",slug:"/developer-guide/using-sources",permalink:"/docs/developer-guide/using-sources",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/developer-guide/using-sources.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Using Writers",permalink:"/docs/developer-guide/using-writers"},next:{title:"Loader Categories",permalink:"/docs/developer-guide/loader-categories"}},a={},d=[{value:"Source",id:"source",level:2},{value:"DataSource",id:"datasource",level:2},{value:"Metadata",id:"metadata",level:2},{value:"Adapter Sources",id:"adapter-sources",level:2},{value:"Source auto-selection",id:"source-auto-selection",level:2},{value:"Creating new Sources",id:"creating-new-sources",level:2},{value:"Options",id:"options",level:2},{value:"Example",id:"example",level:2}];function l(e){const r={code:"code",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,o.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.header,{children:(0,t.jsx)(r.h1,{id:"using-sources",children:"Using Sources"})}),"\n",(0,t.jsxs)(r.p,{children:["loaders.gl provides a number of ",(0,t.jsx)(r.code,{children:"Source"})," exports that support multi-step data loading. ",(0,t.jsx)(r.strong,{children:"Sources"})," are different from ",(0,t.jsx)(r.strong,{children:"loaders"}),":"]}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:'loaders are designed for "one-shot" atomic or streaming loads of data'}),"\n",(0,t.jsxs)(r.li,{children:["while a ",(0,t.jsx)(r.code,{children:"Source"})," can be thought of as a multi-step or multi-resource loader, which is required for a number of data formats and access patterns."]}),"\n"]}),"\n",(0,t.jsxs)(r.p,{children:[(0,t.jsx)(r.strong,{children:"Sources"})," are designed encapsulates the following data access models:"]}),"\n",(0,t.jsxs)(r.table,{children:[(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Data Access Model"}),(0,t.jsx)(r.th,{children:"Description"})]})}),(0,t.jsxs)(r.tbody,{children:[(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.strong,{children:"*web service"})}),(0,t.jsx)(r.td,{children:"Interact with a web service that returns data assets for different regions etc."})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.strong,{children:"cloud storage"})}),(0,t.jsx)(r.td,{children:"Read static assets as-needed from large cloud-native file formats"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.strong,{children:"archive files"})}),(0,t.jsx)(r.td,{children:"Read individual assets from a (very large) multi-asset archive files."})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.strong,{children:"dynamic data generation"})}),(0,t.jsx)(r.td,{children:"Generate data (tiles, images etc) dynamically based on application requests."})]})]})]}),"\n",(0,t.jsx)(r.h2,{id:"source",children:"Source"}),"\n",(0,t.jsxs)(r.p,{children:["A ",(0,t.jsx)(r.code,{children:"Source"})," object provides general information about the supported resource format, and the capability to a ",(0,t.jsx)(r.code,{children:"DataSource"})," for that format."]}),"\n",(0,t.jsx)(r.h2,{id:"datasource",children:"DataSource"}),"\n",(0,t.jsxs)(r.p,{children:["A ",(0,t.jsx)(r.code,{children:"DateSource"})," instance provides methods to query metadata, and to query data for specific geospatial areas."]}),"\n",(0,t.jsxs)(r.p,{children:["A ",(0,t.jsx)(r.code,{children:"DataSource"})," can (and sometimes must) expose a completely unique API. However a big advantages comes when a ",(0,t.jsx)(r.code,{children:"DataSource"})," conforms to an existing ",(0,t.jsx)(r.code,{children:"*Source"})," interface."]}),"\n",(0,t.jsx)(r.p,{children:"This means that applications written against that interface can now support the new source without any changes to existing logic."}),"\n",(0,t.jsxs)(r.table,{children:[(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Source Interface"}),(0,t.jsx)(r.th,{children:"Data access model"}),(0,t.jsx)(r.th,{children:"Examples"})]})}),(0,t.jsxs)(r.tbody,{children:[(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"ImageSource"})}),(0,t.jsx)(r.td,{children:"Loads image covering a region"}),(0,t.jsxs)(r.td,{children:[(0,t.jsx)(r.code,{children:"WMSSource"}),", ",(0,t.jsx)(r.code,{children:"_ArcGISImageServerSource"})]})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"VectorSource"})}),(0,t.jsx)(r.td,{children:'Load "features" in a region'}),(0,t.jsx)(r.td,{children:"WFS (N/A), ArcGIS FeatureServer"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"ImageTileSource"})}),(0,t.jsx)(r.td,{children:"Load image covering a specific tile index"}),(0,t.jsx)(r.td,{children:"WMTS (N/A)"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"VectorTileSource"})}),(0,t.jsx)(r.td,{children:'Load "features" in a specific tile index'}),(0,t.jsxs)(r.td,{children:["Mapbox Vector Tiles, ",(0,t.jsx)(r.code,{children:"PMTilesSource"})]})]})]})]}),"\n",(0,t.jsx)(r.h2,{id:"metadata",children:"Metadata"}),"\n",(0,t.jsxs)(r.p,{children:["A ",(0,t.jsx)(r.code,{children:"DateSource"})," instance provides methods to query metadata: ",(0,t.jsx)(r.code,{children:"await dataSource.getMetadata()"}),"."]}),"\n",(0,t.jsx)(r.h2,{id:"adapter-sources",children:"Adapter Sources"}),"\n",(0,t.jsxs)(r.p,{children:["While most ",(0,t.jsx)(r.code,{children:"Source"})," implementations provide an interface for interacting with a specific web service or cloud archive file format (e.g. ",(0,t.jsx)(r.code,{children:"PMtilesSource"}),"), it is also possible to create adapters:"]}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:["that provide a ",(0,t.jsx)(r.code,{children:"Source"})," interface to local data (",(0,t.jsx)(r.code,{children:"TableTileSource"}),")"]}),"\n",(0,t.jsxs)(r.li,{children:["that adapts one type of Source to another (e.g. ",(0,t.jsx)(r.code,{children:"ImageTileSource"})," calling an ",(0,t.jsx)(r.code,{children:"ImageSource"})," to generate each tile)."]}),"\n"]}),"\n",(0,t.jsx)(r.h2,{id:"source-auto-selection",children:"Source auto-selection"}),"\n",(0,t.jsxs)(r.p,{children:["Just like the appropriate loader can be selected automatically from a list of ",(0,t.jsx)(r.code,{children:"Loader"})," objects, ",(0,t.jsx)(r.code,{children:"createDataSource()"})," and ",(0,t.jsx)(r.code,{children:"selectSource()"})," accept a list of ",(0,t.jsx)(r.code,{children:"Source"})," objects and attempt to select the correct one based on URL pattern matching, root file first bytes etc."]}),"\n",(0,t.jsx)(r.h2,{id:"creating-new-sources",children:"Creating new Sources"}),"\n",(0,t.jsxs)(r.p,{children:["Just like applications can create their own own loaders, apps can also create (and potentially contribute) their own sources and use them with loaders.gl, as long as they follow the required interfaces (e.g, every source instance must inherit from ",(0,t.jsx)(r.code,{children:"DataSource"}),")."]}),"\n",(0,t.jsx)(r.h2,{id:"options",children:"Options"}),"\n",(0,t.jsx)(r.p,{children:"Just like loaders, sources accept nested options, so that options for multiple sources can be specified:"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"import {createDataSource} from '@loaders.gl/core';\nimport {PMTileseSource} from '@loaders.gl/pmtiles';\nimport {MVTSource} from '@loaders.gl/mvt`;\n\nconst dataSource = createDataSource(url, [PMTileSource, MVTSource], {\n  core: {\n    // Any common options for createDataSource\n  }\n  pmtiles: {\n    // Options specific to PMTilesSource, used if the URL is determined to reference a PMTiles file.\n  },\n  mvt: {\n    // Options specific to MVTSource, used if the URL is determined to reference an MVT file hierarchy.\n  }\n});\n"})}),"\n",(0,t.jsxs)(r.p,{children:["A source can sometimes use one or more loaders internally to load sub resources. In this case, the application can pass options to those loaders using the ",(0,t.jsx)(r.code,{children:"core.loadOptions"})," property."]}),"\n",(0,t.jsx)(r.h2,{id:"example",children:"Example"}),"\n",(0,t.jsxs)(r.p,{children:["An advanced source is the ",(0,t.jsx)(r.code,{children:"TableTileSource"})," which lets you dynamically generate MVT tiles from a table."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"import {createDataSource} from '@loaders.gl/core';\nimport {TableTileSource} from '@loaders.gl/mvt';\nimport {GeoJSONLoader} from '@loaders.gl/json';\n\n// build an initial index of tiles.\nconst tileSource = createDataSource(url, TableTileSource, {\n  core: {\n    loaders: [GeoJSONLoader]\n  }\n});\n\n// request a particular tile\nconst features = tileSource.getTile(z, x, y).features;\n"})})]})}function u(e={}){const{wrapper:r}={...(0,o.R)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(l,{...e})}):l(e)}},43023:(e,r,s)=>{s.d(r,{R:()=>c,x:()=>i});var t=s(63696);const o={},n=t.createContext(o);function c(e){const r=t.useContext(n);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function i(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:c(e.components),t.createElement(n.Provider,{value:r},e.children)}}}]);