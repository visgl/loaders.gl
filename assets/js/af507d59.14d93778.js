"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[8638],{48950:(e,i,s)=>{s.r(i),s.d(i,{assets:()=>d,contentTitle:()=>r,default:()=>h,frontMatter:()=>n,metadata:()=>o,toc:()=>a});var l=s(74848),t=s(28453);const n={},r="Overview",o={id:"modules/3d-tiles/README",title:"Overview",description:"ogc-logo",source:"@site/../docs/modules/3d-tiles/README.md",sourceDirName:"modules/3d-tiles",slug:"/modules/3d-tiles/",permalink:"/docs/modules/3d-tiles/",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/3d-tiles/README.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"parseWithContext",permalink:"/docs/modules/loader-utils/api-reference/parse-with-context"},next:{title:"Overview",permalink:"/docs/modules/arrow/"}},d={},a=[{value:"Installation",id:"installation",level:2},{value:"API",id:"api",level:2},{value:"Usage",id:"usage",level:2},{value:"Remarks",id:"remarks",level:2},{value:"Attribution",id:"attribution",level:2}];function c(e){const i={a:"a",code:"code",h1:"h1",h2:"h2",img:"img",li:"li",p:"p",pre:"pre",ul:"ul",...(0,t.R)(),...e.components};return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(i.h1,{id:"overview",children:"Overview"}),"\n",(0,l.jsxs)(i.p,{children:[(0,l.jsx)(i.img,{alt:"ogc-logo",src:s(44505).A+"",width:"119",height:"60"}),"\n\xa0\n",(0,l.jsx)(i.img,{alt:"3dtiles-logo",src:s(19088).A+"",width:"227",height:"60"})]}),"\n",(0,l.jsxs)(i.p,{children:["The ",(0,l.jsx)(i.code,{children:"@loaders.gl/3d-tiles"})," module supports loading and traversing 3D Tiles."]}),"\n",(0,l.jsx)(i.p,{children:"References"}),"\n",(0,l.jsxs)(i.ul,{children:["\n",(0,l.jsxs)(i.li,{children:[(0,l.jsx)(i.a,{href:"https://github.com/AnalyticalGraphicsInc/3d-tiles",children:"3D Tiles Specification"})," - The living specification."]}),"\n",(0,l.jsxs)(i.li,{children:[(0,l.jsx)(i.a,{href:"https://www.opengeospatial.org/standards/3DTiles",children:"3D Tiles Standard"})," - The official standard from ",(0,l.jsx)(i.a,{href:"https://www.opengeospatial.org/",children:"OGC"}),", the Open Geospatial Consortium."]}),"\n"]}),"\n",(0,l.jsx)(i.h2,{id:"installation",children:"Installation"}),"\n",(0,l.jsx)(i.pre,{children:(0,l.jsx)(i.code,{className:"language-bash",children:"npm install @loaders.gl/3d-tiles\nnpm install @loaders.gl/core\n"})}),"\n",(0,l.jsx)(i.h2,{id:"api",children:"API"}),"\n",(0,l.jsx)(i.p,{children:"A standard complement of loaders and writers are provided to load the individual 3d Tile file formats:"}),"\n",(0,l.jsxs)(i.ul,{children:["\n",(0,l.jsxs)(i.li,{children:[(0,l.jsx)(i.a,{href:"/docs/modules/3d-tiles/api-reference/tiles-3d-loader",children:(0,l.jsx)(i.code,{children:"Tiles3DLoader"})}),", a loader for loading a top-down or nested tileset and its tiles."]}),"\n",(0,l.jsxs)(i.li,{children:[(0,l.jsx)(i.a,{href:"/docs/modules/3d-tiles/api-reference/cesium-ion-loader",children:(0,l.jsx)(i.code,{children:"CesiumIonLoader"})}),", a loader extends from ",(0,l.jsx)(i.code,{children:"Tiles3DLoader"})," with resolving credentials from Cesium ion."]}),"\n"]}),"\n",(0,l.jsxs)(i.p,{children:["To handle the complex dynamic tile selection and loading required to performantly render larger-than-browser-memory tilesets, additional helper classes are provided in ",(0,l.jsx)(i.code,{children:"@loaders.gl/tiles"})," module:"]}),"\n",(0,l.jsxs)(i.ul,{children:["\n",(0,l.jsxs)(i.li,{children:[(0,l.jsx)(i.a,{href:"/docs/modules/tiles/api-reference/tileset-3d",children:(0,l.jsx)(i.code,{children:"Tileset3D"})})," to work with the loaded tileset."]}),"\n",(0,l.jsxs)(i.li,{children:[(0,l.jsx)(i.a,{href:"/docs/modules/tiles/api-reference/tile-3d",children:(0,l.jsx)(i.code,{children:"Tile3D"})})," to access data for a specific tile."]}),"\n"]}),"\n",(0,l.jsx)(i.h2,{id:"usage",children:"Usage"}),"\n",(0,l.jsxs)(i.p,{children:["Basic API usage is illustrated in the following snippet. Create a ",(0,l.jsx)(i.code,{children:"Tileset3D"})," instance, point it a valid tileset URL, set up callbacks, and keep feeding in new camera positions:"]}),"\n",(0,l.jsx)(i.pre,{children:(0,l.jsx)(i.code,{className:"language-typescript",children:"import {load} from '@loaders.gl/core';\nimport {Tiles3DLoader} from '@loaders.gl/3d-tiles';\nimport {Tileset3D} from '@loaders.gl/tiles';\n\nconst tilesetUrl = ''; // add the url to your tileset.json file here\n\nconst tilesetJson = await load(tilesetUrl, Tiles3DLoader);\n\nconst tileset3d = new Tileset3D(tilesetJson, {\n  onTileLoad: (tile) => console.log(tile)\n});\n\n// initial viewport\ntileset3d.update(viewport);\n\n// Viewport changes (pan zoom etc)\ntileset3d.selectTiles(viewport);\n\n// Visible tiles\nconst visibleTiles = tileset3d.tiles.filter((tile) => tile.selected);\n\n// Note that visibleTiles will likely not immediately include all tiles\n// tiles will keep loading and file `onTileLoad` callbacks\n"})}),"\n",(0,l.jsx)(i.h2,{id:"remarks",children:"Remarks"}),"\n",(0,l.jsxs)(i.p,{children:[(0,l.jsx)(i.code,{children:"@loaders.gl/3d-tiles"})," does not yet support the full 3D tiles standard. Notable omissions are:"]}),"\n",(0,l.jsxs)(i.ul,{children:["\n",(0,l.jsxs)(i.li,{children:[(0,l.jsx)(i.a,{href:"https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume",children:"Region bounding volumes"})," are supported but not optimally"]}),"\n",(0,l.jsxs)(i.li,{children:[(0,l.jsx)(i.a,{href:"https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling",children:"Styling"})," is not yet supported"]}),"\n",(0,l.jsxs)(i.li,{children:[(0,l.jsx)(i.a,{href:"https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#viewer-request-volume",children:"Viewer request volumes"})," are not yet supported"]}),"\n"]}),"\n",(0,l.jsx)(i.h2,{id:"attribution",children:"Attribution"}),"\n",(0,l.jsxs)(i.p,{children:[(0,l.jsx)(i.code,{children:"@loaders.gl/3d-tiles"})," is a fork of 3D tile related code in the ",(0,l.jsx)(i.a,{href:"https://github.com/AnalyticalGraphicsInc/cesium",children:"Cesium github repository"})," under Apache 2 License, and is developed in collabration with the Cesium engineering team."]})]})}function h(e={}){const{wrapper:i}={...(0,t.R)(),...e.components};return i?(0,l.jsx)(i,{...e,children:(0,l.jsx)(c,{...e})}):c(e)}},44505:(e,i,s)=>{s.d(i,{A:()=>l});const l=s.p+"assets/images/ogc-logo-60-8ee2c25a50ccc14293453512c707a0c4.png"},19088:(e,i,s)=>{s.d(i,{A:()=>l});const l=s.p+"assets/images/3d-tiles-logo-60-1a1a0d0391897fd8df74ccfa3f82a128.png"},28453:(e,i,s)=>{s.d(i,{R:()=>r,x:()=>o});var l=s(96540);const t={},n=l.createContext(t);function r(e){const i=l.useContext(n);return l.useMemo((function(){return"function"==typeof e?e(i):{...i,...e}}),[i,e])}function o(e){let i;return i=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:r(e.components),l.createElement(n.Provider,{value:i},e.children)}}}]);