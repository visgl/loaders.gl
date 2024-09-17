"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[5482],{29027:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>d,contentTitle:()=>o,default:()=>h,frontMatter:()=>i,metadata:()=>l,toc:()=>a});var r=s(85893),n=s(11151);const i={},o="Tile Converter",l={id:"modules/tile-converter/cli-reference/tile-converter",title:"Tile Converter",description:"The tile-converter is a command line utility (CLI) for two-way batch conversion between I3S and 3D Tiles, both an OGC community standard. It can load tilesets to be converted directly from an URL or file based formats. I3S and 3DTiles are large formats that include different layer types and data formats. See Supported Features page that describes what the tile-converter supports.",source:"@site/../docs/modules/tile-converter/cli-reference/tile-converter.md",sourceDirName:"modules/tile-converter/cli-reference",slug:"/modules/tile-converter/cli-reference/tile-converter",permalink:"/docs/modules/tile-converter/cli-reference/tile-converter",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/tile-converter/cli-reference/tile-converter.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Overview",permalink:"/docs/modules/zip/"},next:{title:"I3S Server",permalink:"/docs/modules/tile-converter/cli-reference/i3s-server"}},d={},a=[{value:"Installation",id:"installation",level:2},{value:"Usage",id:"usage",level:2},{value:"Supported Platforms",id:"supported-platforms",level:2},{value:"Options",id:"options",level:2},{value:"Metadata class selection",id:"metadata-class-selection",level:2},{value:"Quiet mode",id:"quiet-mode",level:2},{value:"<code>--add-hash</code> and <code>--quiet</code>",id:"--add-hash-and---quiet",level:3},{value:"Resume conversion with <code>--quiet</code> option",id:"resume-conversion-with---quiet-option",level:3},{value:"Metadata class selection with <code>--quiet</code> option",id:"metadata-class-selection-with---quiet-option",level:3},{value:"Running local server to handle I3S layer",id:"running-local-server-to-handle-i3s-layer",level:2},{value:"Show converted layer on a map",id:"show-converted-layer-on-a-map",level:3},{value:"Docker image",id:"docker-image",level:2}];function c(e){const t={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",img:"img",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,n.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.h1,{id:"tile-converter",children:"Tile Converter"}),"\n",(0,r.jsxs)("p",{class:"badges",children:[(0,r.jsx)("img",{src:"https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square",alt:"From-v3.0"}),(0,r.jsx)("a",{href:"https://badge.fury.io/js/%40loaders.gl%2Ftile-converter",children:(0,r.jsx)("img",{src:"https://badge.fury.io/js/%40loaders.gl%2Ftile-converter.svg",alt:"npm version",height:"18"})}),(0,r.jsx)("a",{href:"https://hub.docker.com/r/visgl/tile-converter/tags",children:(0,r.jsx)("img",{alt:"Dockerhub",src:"https://img.shields.io/docker/v/visgl/tile-converter?label=dockerhub"})})]}),"\n",(0,r.jsxs)(t.p,{children:["The ",(0,r.jsx)(t.code,{children:"tile-converter"})," is a command line utility (CLI) for two-way batch conversion between ",(0,r.jsx)(t.a,{href:"https://www.ogc.org/standards/i3s",children:"I3S"})," and ",(0,r.jsx)(t.a,{href:"https://www.ogc.org/standards/3DTiles",children:"3D Tiles"}),", both an OGC community standard. It can load tilesets to be converted directly from an URL or file based formats. I3S and 3DTiles are large formats that include different layer types and data formats. See ",(0,r.jsx)(t.a,{href:"/docs/modules/tile-converter/cli-reference/supported-features",children:"Supported Features"})," page that describes what the tile-converter supports."]}),"\n",(0,r.jsx)(t.h2,{id:"installation",children:"Installation"}),"\n",(0,r.jsx)(t.p,{children:"The tile-converter is published as an npm module and as a docker image."}),"\n",(0,r.jsxs)(t.p,{children:["Installing ",(0,r.jsx)(t.code,{children:"@loaders.gl/tile-converter"})," from npm makes the ",(0,r.jsx)(t.code,{children:"tile-converter"})," command line tool available."]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"npm i @loaders.gl/tile-converter\n"})}),"\n",(0,r.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,r.jsxs)(t.p,{children:["Tile Converter can be run using ",(0,r.jsx)(t.code,{children:"npx"}),"."]}),"\n",(0,r.jsx)(t.p,{children:"Aknowledge available options:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"npx tile-converter --help\n"})}),"\n",(0,r.jsx)(t.p,{children:"Install dependencies:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"npx tile-converter --install-dependencies\n"})}),"\n",(0,r.jsx)(t.p,{children:"Run conversion:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"npx tile-converter --input-type \\<I3S\\|3DTILES\\> --tileset \\<tileset\\> --name <tileset name> [--output <output folder>] [--no-draco] [--max-depth 4] [--slpk] [--7zExe <path/to/7z.exe>] [--token <ION token>] [--egm <pat/to/*.pgm|none>] [--split-nodes] [--instant-node-writing] [--generate-textures] [--generate-bounding-volumes]\n"})}),"\n",(0,r.jsx)(t.p,{children:"Alternatively, you can use syntax with the equal sign:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"npx tile-converter --input-type=\\<I3S\\|3DTILES\\> --tileset=<tileset> --splk=true|false ...\n"})}),"\n",(0,r.jsx)(t.p,{children:"Alternatively, there is a docker image to run:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"docker pull visgl/tile-converter\n"})}),"\n",(0,r.jsxs)(t.p,{children:["See more details ",(0,r.jsx)(t.a,{href:"#docker-image",children:"here"})]}),"\n",(0,r.jsx)(t.h2,{id:"supported-platforms",children:"Supported Platforms"}),"\n",(0,r.jsx)(t.p,{children:"Operationg Systems: Windows 8.1 or higher, Ubuntu 20.04 or higher"}),"\n",(0,r.jsx)(t.p,{children:"NodeJS 14 or higher is required."}),"\n",(0,r.jsx)(t.h2,{id:"options",children:"Options"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Option"}),(0,r.jsx)(t.th,{children:"3DTiles to I3S conversion"}),(0,r.jsx)(t.th,{children:"I3S to 3DTiles conversion"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"help"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"Show the converter tool options list"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"install-dependencies"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:'Run the script for installing dependencies. Run this options separate from others. It installs "*.pgm" Earth Gravity Model, loader workers, sharp and join-images npm packages'})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"input-type"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:'"I3S" - for I3S to 3DTiles conversion, "3DTILES" for 3DTiles to I3S conversion'})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"tileset"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsxs)(t.td,{children:['"tileset.json" file (3DTiles) / "',(0,r.jsx)(t.a,{href:"http://..../SceneServer/layers/0",children:"http://..../SceneServer/layers/0"}),'"'," resource (I3S)"]})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"output"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:'Output folder. This folder will be created by converter if doesn\'t exist. It is relative to the converter path. Default: "./data" folder'})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"name"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsxs)(t.td,{children:["Tileset name. This option is required for naming in the output json resouces and for the output ",(0,r.jsx)(t.code,{children:"path/\\*.slpk"})," file naming"]})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"output-version"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsxs)(t.td,{children:['Version of 3D Tiles format. This option is used for I3S to 3DTiles conversion only (optional). Possible values - "1.0", "1.1" (default). More information on the 3D Tiles revisions: ',(0,r.jsx)(t.a,{href:"https://github.com/CesiumGS/3d-tiles/blob/main/3d-tiles-reference-card-1.1.pdf",children:"https://github.com/CesiumGS/3d-tiles/blob/main/3d-tiles-reference-card-1.1.pdf"})]})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"max-depth"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"Maximal depth of the hierarchical tiles tree traversal, default: infinity"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"slpk"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"Whether the converter generates *.slpk (Scene Layer Package) I3S output files"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"7zExe"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:'location of 7z.exe archiver to create slpk on Windows OS, default: "C:\\Program Files\\7-Zip\\7z.exe"'})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"egm"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsxs)(t.td,{children:['location of the Earth Gravity Model (*.pgm) file to convert heights from ellipsoidal to gravity-related format or "None" to not use it, default: "./deps/egm2008-5.pgm". A model file can be loaded from GeographicLib ',(0,r.jsx)(t.a,{href:"https://geographiclib.sourceforge.io/html/geoid.html",children:"https://geographiclib.sourceforge.io/html/geoid.html"})]})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"token"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"Token for Cesium ION tileset authentication."})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"no-draco"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"Disable draco compression for geometry. Default: not set"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"instant-node-writing"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{}),(0,r.jsxs)(t.td,{children:["Whether the converter should keep JSON resources (",(0,r.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/3DNodeIndexDocument.cmn.md",children:"3DNodeIndexDocuments"})," and ",(0,r.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/nodePage.cmn.md",children:"nodePages"}),") on disk during conversion. The default behavior is the converter keeps JSON resources in memory till the end of conversion. Those resources need to be updated during conversion (adding child nodes and neighbor nodes). If this option is set ",(0,r.jsx)(t.code,{children:"true"}),' the converter will keep JSON resources on disk all the time. Use this option for large datasets when the nodes tree is large and "memory overflow" error occurs. Instant node writing saves memory usage in cost of conversion speed (>2 times slower).']})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"split-nodes"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:'The converter will generate new node for every PBR material in the glTF file. Prevent merge of similar materials that could lead to incorrect visualization. By default, the converter tries to merge PBR materials to create one node for all primitives in a glTF file. Note can cause refinement issues because "leaf" nodes are generated in the middle of the nodes tree tree'})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"generate-textures"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"Create compressed KTX2 textures if non-compressed (JPG, PNG) texture is presented in the input tileset or generate JPG texture if compressed KTX2 is presented in the input tileset"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"generate-bounding-volumes"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"Create new OBB and MBS bounding volumes from geometry instead of conversion it from the source tile bounding volume"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"metadata-class"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{}),(0,r.jsxs)(t.td,{children:["Set metadata class related to EXT_feature_metadata or EXT_structural_meatadata extensions. See details ",(0,r.jsx)(t.a,{href:"#metadata-class-selection",children:"below"})]})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"analyze"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"Analyze the input tileset content without conversion"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"quiet"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsxs)(t.td,{children:["Skip user prompts during conversion. Tile-converter won't stop to wait for an action from a user. See details ",(0,r.jsx)(t.a,{href:"#quiet-mode",children:"below"})]})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"validate"}),(0,r.jsx)(t.td,{children:"*"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"Perform counting of all tiles. Check whether a particular child node fits into the parent one or not. If not, warn about it."})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"add-hash"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsxs)(t.td,{children:["Adds hash file to the SLPK with no one. Provide the slpk name in the ",(0,r.jsx)(t.code,{children:"--tileset "})," option and updated SLPK path to the ",(0,r.jsx)(t.code,{children:"--output"})," (optional)"]})]})]})]}),"\n",(0,r.jsx)(t.h2,{id:"metadata-class-selection",children:"Metadata class selection"}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.em,{children:'This topic is applicable only for source type "3DTILES".'})}),"\n",(0,r.jsxs)(t.p,{children:["An input glTF resource may contain ",(0,r.jsx)(t.a,{href:"https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata/README.md",children:"EXT_feature_metadata"})," or ",(0,r.jsx)(t.a,{href:"https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/README.md",children:"EXT_structural_metadata"})," extensions."]}),"\n",(0,r.jsx)(t.p,{children:"Those extensions provide the structural metadata storage. Metadata\u2009-\u2009represented as entities and properties\u2009-\u2009may be closely associated with parts of 3D content, with data representations appropriate for large, distributed datasets. For the most detailed use cases, properties allow vertex- and texel-level associations; higher-level property associations are also supported."}),"\n",(0,r.jsxs)(t.p,{children:["One glTF resource might include more than one metadata class. That means that parts of a mesh might be associated with different sets of properties.\nFor example, the glTF might have ",(0,r.jsx)(t.code,{children:"bridges"})," and ",(0,r.jsx)(t.code,{children:"buildings"})," classes. In that case, one part of the mesh is related to ",(0,r.jsx)(t.code,{children:"bridges"})," properties (eg. ",(0,r.jsx)(t.code,{children:"construction_year"}),", ",(0,r.jsx)(t.code,{children:"type"}),") and another part of the mesh is related to ",(0,r.jsx)(t.code,{children:"buildings"})," properties (eg. ",(0,r.jsx)(t.code,{children:"construction_year"}),", ",(0,r.jsx)(t.code,{children:"height"}),", ",(0,r.jsx)(t.code,{children:"number_of_floors"}),", ",(0,r.jsx)(t.code,{children:"ownership"}),")."]}),"\n",(0,r.jsxs)(t.p,{children:["On another side there is an output I3S layer that doesn't support structural metadata and multiple classes. I3S has ",(0,r.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.9/attributeStorageInfo.cmn.md",children:"feature attributes"})," metadata that is the same for every node in the layer. So I3S can consume only one set of properties."]}),"\n",(0,r.jsx)(t.p,{children:"In case when the input 3DTiles dataset has multiple metadata classes, the tile-converter provides a promt to select one class from the list:"}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"Metadata class selection",src:s(49271).Z+"",width:"736",height:"140"})}),"\n",(0,r.jsxs)(t.p,{children:["If the wanted class is known before the conversion it is possible to skip the prompt with setting ",(0,r.jsx)(t.code,{children:"metadata-class"})," option. For example:"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"npx tile-converter --input-type 3DTILES --tileset ..... --metadata-class bridges\n"})}),"\n",(0,r.jsx)(t.h2,{id:"quiet-mode",children:"Quiet mode"}),"\n",(0,r.jsxs)(t.p,{children:["Use ",(0,r.jsx)(t.code,{children:"--quet"})," option to avoid user prompts during conversion. In some cases, tile-converter stops and waits for an input from a user, for example, asks weither resume conversion or start a new one."]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"npx tile-converter ..... --quiet\n"})}),"\n",(0,r.jsxs)(t.p,{children:["With ",(0,r.jsx)(t.code,{children:"--quiet"})," option, tile-converter won't ask a user to make a decision, it will do a default action instead."]}),"\n",(0,r.jsxs)(t.h3,{id:"--add-hash-and---quiet",children:[(0,r.jsx)(t.code,{children:"--add-hash"})," and ",(0,r.jsx)(t.code,{children:"--quiet"})]}),"\n",(0,r.jsxs)(t.p,{children:["In ",(0,r.jsx)(t.code,{children:"--add-hash"})," case tile-converter offers to create a new file or modify the existing SLPK. With ",(0,r.jsx)(t.code,{children:"--quiet"})," option, the existing SLPK will be modified."]}),"\n",(0,r.jsxs)(t.h3,{id:"resume-conversion-with---quiet-option",children:["Resume conversion with ",(0,r.jsx)(t.code,{children:"--quiet"})," option"]}),"\n",(0,r.jsxs)(t.p,{children:["Resume conversion is a feature that allows to resume a conversion that was unpredictably stopped, for example when terminal was closed or a user pressed ",(0,r.jsx)(t.code,{children:"CTRL+C"}),". When converter detects a previous conversion, it offers to resume it or start a new one.\nWith ",(0,r.jsx)(t.code,{children:"--quiet"})," option, tile-converter will resume. To start a new conversion with ",(0,r.jsx)(t.code,{children:"--quiet"})," option, remove output folder that was created by tile-converter before."]}),"\n",(0,r.jsxs)(t.h3,{id:"metadata-class-selection-with---quiet-option",children:["Metadata class selection with ",(0,r.jsx)(t.code,{children:"--quiet"})," option"]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.em,{children:'This topic is applicable only for source type "3DTILES".'})}),"\n",(0,r.jsxs)(t.p,{children:["This case is applicable for the specific type of datasets. See ",(0,r.jsx)(t.a,{href:"#metadata-class-selection",children:"Metadata class selection"}),".\nWith ",(0,r.jsx)(t.code,{children:"--quiet"})," option and when multiple metadata classes was detected, tile-converter will stop. To convert such a dataset with ",(0,r.jsx)(t.code,{children:"--quiet"})," option, use ",(0,r.jsx)(t.code,{children:"--metadata-class"})," option to select a metadata class."]}),"\n",(0,r.jsx)(t.h2,{id:"running-local-server-to-handle-i3s-layer",children:"Running local server to handle I3S layer"}),"\n",(0,r.jsxs)(t.p,{children:["After conversion without ",(0,r.jsx)(t.code,{children:"--slpk"}),' option a new I3S layer is created in output ("data" by default) directory.']}),"\n",(0,r.jsx)(t.p,{children:"Run it with the local web server:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:'PORT=8080 HTTPS_PORT=4443 I3sLayerPath="./data" DEBUG=i3s-server:* npx i3s-server\n'})}),"\n",(0,r.jsxs)(t.p,{children:["See more details ",(0,r.jsx)(t.a,{href:"/docs/modules/tile-converter/cli-reference/i3s-server",children:"here"})]}),"\n",(0,r.jsx)(t.h3,{id:"show-converted-layer-on-a-map",children:"Show converted layer on a map"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{children:"open https://loaders.gl/examples/i3s?url=http://localhost:8080/NewLayerName/SceneServer/layers/0\n"})}),"\n",(0,r.jsx)(t.h2,{id:"docker-image",children:"Docker image"}),"\n",(0,r.jsxs)(t.p,{children:["The tile converter is available as a docker image in the ",(0,r.jsx)(t.a,{href:"https://hub.docker.com/r/visgl/tile-converter/tags",children:"visgl/tile-converter"})," dockerhub repo. The advantage of docker image is that it has dependencies pre-installed so it is not necessary to call ",(0,r.jsx)(t.code,{children:"npx tile-converter --install-dependencies"}),"."]}),"\n",(0,r.jsx)(t.p,{children:"To download the tile-converter docker image, run:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"docker pull visgl/tile-converter\n"})}),"\n",(0,r.jsx)(t.p,{children:"To use converter run:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"docker run \\\n  --rm  \\\n  -v /path/to/output_folder:/loaders-bundle/data \\\n  -v /path/to/input-tileset:/loaders-bundle/input-data \\\n  visgl/tile-converter \\\n  --input-type 3dtiles \\\n  --token ... \\\n  --tileset input-data/tileset.json \\\n  --name ... \\\n  --output data \\\n  --max-depth 3 \\\n  ...\n"})}),"\n",(0,r.jsx)(t.p,{children:"Docker run arguments:"}),"\n",(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.code,{children:"-v"})," - Create docker volume, linked to internal data folder"]}),"\n",(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.code,{children:"--rm"})," - Remove container after conversion"]}),"\n",(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.code,{children:"visgl/tile-converter"})," - Image name"]}),"\n",(0,r.jsx)(t.p,{children:"To build your own tile-converter docker image:"}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsxs)(t.li,{children:["Clone ",(0,r.jsx)(t.a,{href:"https://github.com/visgl/loaders.gl",children:"loaders.gl"})," project."]}),"\n",(0,r.jsx)(t.li,{children:"In root folder of the project run:"}),"\n"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"  yarn bootstrap\n  docker build -t [docker_image_name] -f modules/tile-converter/Dockerfile .\n"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"Push docker image to your docker hub"}),"\n"]})]})}function h(e={}){const{wrapper:t}={...(0,n.a)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(c,{...e})}):c(e)}},49271:(e,t,s)=>{s.d(t,{Z:()=>r});const r=s.p+"assets/images/metadata-class-selection-promt-3259fca7cb388951dd00c407c4edd804.png"},11151:(e,t,s)=>{s.d(t,{Z:()=>l,a:()=>o});var r=s(67294);const n={},i=r.createContext(n);function o(e){const t=r.useContext(i);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:o(e.components),r.createElement(i.Provider,{value:t},e.children)}}}]);