"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[9648],{92757:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>h,frontMatter:()=>s,metadata:()=>l,toc:()=>a});var n=o(85893),r=o(11151);const s={},i="I3SConverter class",l={id:"modules/tile-converter/api-reference/i3s-converter",title:"I3SConverter class",description:"The I3SConverter class converts a 3D Tiles tileset to I3S layer.",source:"@site/../docs/modules/tile-converter/api-reference/i3s-converter.md",sourceDirName:"modules/tile-converter/api-reference",slug:"/modules/tile-converter/api-reference/i3s-converter",permalink:"/docs/modules/tile-converter/api-reference/i3s-converter",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/tile-converter/api-reference/i3s-converter.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Tiles3DConverter class",permalink:"/docs/modules/tile-converter/api-reference/3d-tiles-converter"},next:{title:"Build Instructions",permalink:"/docs/modules/tile-converter/api-reference/build-instructions"}},c={},a=[{value:"Usage",id:"usage",level:2},{value:"Methods",id:"methods",level:2},{value:"constructor()",id:"constructor",level:3},{value:"convert(options: object): object",id:"convertoptions-object-object",level:3},{value:"Validation",id:"validation",level:3}];function d(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"i3sconverter-class",children:"I3SConverter class"}),"\n",(0,n.jsx)("p",{class:"badges",children:(0,n.jsx)("img",{src:"https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square",alt:"From-v3.0"})}),"\n",(0,n.jsxs)(t.p,{children:["The ",(0,n.jsx)(t.code,{children:"I3SConverter"})," class converts a 3D Tiles tileset to I3S layer."]}),"\n",(0,n.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-typescript",children:"import {I3SConverter} from '@loaders.gl/tile-converter';\n\nconst converter = new I3SConverter();\nconst tilesetJson = await converter.convert({\n  inputUrl: TILESET_URL,\n  outputPath: 'data',\n  tilesetName: 'BatchedColors'\n});\n\n// The converted tiles are written to the specified output path\nconst rootTileJson = await fs.readFile('data/BatchedColors/layers/0/nodes/root/index.json', 'utf8');\n"})}),"\n",(0,n.jsx)(t.h2,{id:"methods",children:"Methods"}),"\n",(0,n.jsx)(t.h3,{id:"constructor",children:"constructor()"}),"\n",(0,n.jsxs)(t.p,{children:["Constructs a new ",(0,n.jsx)(t.code,{children:"I3SConverter"})," instance."]}),"\n",(0,n.jsx)(t.h3,{id:"convertoptions-object-object",children:"convert(options: object): object"}),"\n",(0,n.jsx)(t.p,{children:"Converts a tileset to I3S format"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.inputUrl: string"})," the url to read the tileset from"]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.outputPath: string"})," the output filename"]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.tilesetName: string"})," the output name of the tileset"]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.maxDepth: number"})," The max tree depth of conversion"]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.slpk: boolean"}),' Whether the resulting layer be saved as "*.slpk" package']}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.sevenZipExe: string"}),' Windows only option. The path of 7-zip archiver tool for creating "*.slpk" file']}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.egmFilePath: string"})," location of *.pgm file to convert heights from ellipsoidal to gravity-related format. A model file can be loaded from GeographicLib ",(0,n.jsx)(t.a,{href:"https://geographiclib.sourceforge.io/html/geoid.html",children:"https://geographiclib.sourceforge.io/html/geoid.html"})]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.token: string"})," ION token of input tileset"]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.draco: boolean"})," Default: ",(0,n.jsx)(t.code,{children:"true"}),'. Whether the converter creates DRACO compressed geometry in path "layers/0/nodes/xxx/geometries/1" along with non-compressed geometry in path "layers/0/nodes/xxx/geometries/0"']}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.mergeMaterials: boolean"})," Default: ",(0,n.jsx)(t.code,{children:"true"}),". Whether the converter should try to merge PBR materials. If ",(0,n.jsx)(t.code,{children:"true"}),", the converter will try to merge PBR materials, joining textures in an atlas. This operation allows to create one I3S node for one 3DTiles tile. If one material has a texture but another doesn't have, materials are not merged and the 3DTiles tile will be splitted into 2 I3S nodes."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.generateTextures: boolean"})," Whether the converter should generate additional texture of another format. For non-compressed source texture format (JPG, PNG) the converter creates additional KTX2 texture. For compressed source texture (KTX2) the converter creates additional JPG texture. To encode and decode KTX2 ",(0,n.jsx)(t.a,{href:"https://github.com/BinomialLLC/basis_universal",children:"Basis Universal Supercompressed GPU Texture Codec"})," is used."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.generateBoundingVolumes: boolean"})," Whether the converter generate new bounding volumes from the mesh vertices. The default behavior is convertion bounding volumes (box, sphere or region) from 3DTiles tileset data. If this option is set ",(0,n.jsx)(t.code,{children:"true"})," the converter will ignore source bounding volume and generate new bounding volume (oriented bounding box and minimal bounding sphere) from the geometry POSITION attribute."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.instantNodeWriting: boolean"})," Whether the converter should keep JSON resources (",(0,n.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/3DNodeIndexDocument.cmn",children:"3DNodeIndexDocuments"})," and ",(0,n.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/nodePage.cmn",children:"nodePages"}),") on disk during conversion. The default behavior is the converter keeps JSON resources in memory till the end of conversion. Those resources need to be updated during conversion (adding child nodes and neighbor nodes). If this option is set ",(0,n.jsx)(t.code,{children:"true"}),' the converter will keep JSON resources on disk all the time. Use this option for large datasets when the nodes tree is large and "memory overflow" error occurs. Instant node writing saves memory usage in cost of conversion speed (>2 times slower).']}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.metadataClass: string"}),' One of the list of feature metadata classes, detected by converter on "analyze" stage']}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.analyze: boolean"})," Analyze the input tileset content without conversion."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"options.validate: boolean"})," Enable Validation."]}),"\n"]}),"\n",(0,n.jsx)(t.h3,{id:"validation",children:"Validation"}),"\n",(0,n.jsxs)(t.p,{children:["By specifying the ",(0,n.jsx)(t.code,{children:"--validate"})," parameter, the tile-converter will perform checks on the tileset data. The following checks are performed:"]}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"Bounding volume validation"}),"\n",(0,n.jsx)(t.li,{children:"Refinement type validation"}),"\n"]})]})}function h(e={}){const{wrapper:t}={...(0,r.a)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(d,{...e})}):d(e)}},11151:(e,t,o)=>{o.d(t,{Z:()=>l,a:()=>i});var n=o(67294);const r={},s=n.createContext(r);function i(e){const t=n.useContext(s);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:i(e.components),n.createElement(s.Provider,{value:t},e.children)}}}]);