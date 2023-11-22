"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[2646],{38653:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>c,contentTitle:()=>n,default:()=>a,frontMatter:()=>r,metadata:()=>l,toc:()=>o});var d=s(85893),i=s(11151);const r={},n="I3SLoader",l={id:"modules/i3s/api-reference/i3s-loader",title:"I3SLoader",description:"A loader for loading an Indexed 3d Scene (I3S) layer, and its geometries and textures data.",source:"@site/../docs/modules/i3s/api-reference/i3s-loader.md",sourceDirName:"modules/i3s/api-reference",slug:"/modules/i3s/api-reference/i3s-loader",permalink:"/docs/modules/i3s/api-reference/i3s-loader",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/i3s/api-reference/i3s-loader.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"GLBWriter",permalink:"/docs/modules/gltf/api-reference/glb-writer"},next:{title:"ImageLoader",permalink:"/docs/modules/images/api-reference/image-loader"}},c={},o=[{value:"I3S Layer type support",id:"i3s-layer-type-support",level:2},{value:"I3S Aspects support",id:"i3s-aspects-support",level:2},{value:"Texture formats",id:"texture-formats",level:2},{value:"Terms",id:"terms",level:2},{value:"Usage",id:"usage",level:2},{value:"Options",id:"options",level:2},{value:"Data formats",id:"data-formats",level:2},{value:"Tileset Object",id:"tileset-object",level:3},{value:"Tile Object",id:"tile-object",level:3},{value:"Tile Content",id:"tile-content",level:3}];function h(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,i.a)(),...e.components};return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(t.h1,{id:"i3sloader",children:"I3SLoader"}),"\n",(0,d.jsx)("p",{class:"badges",children:(0,d.jsx)("img",{src:"https://img.shields.io/badge/From-v2.1-blue.svg?style=flat-square",alt:"From-v2.1"})}),"\n",(0,d.jsxs)(t.p,{children:["A loader for loading an ",(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec",children:"Indexed 3d Scene (I3S) layer"}),", and its geometries and textures data."]}),"\n",(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:"Loader"}),(0,d.jsx)(t.th,{children:"Characteristic"})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"File Format"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec",children:"I3S Layer"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"File Type"}),(0,d.jsx)(t.td,{children:"Json, Binary"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"File Extension"}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:".json"})," (layer), ",(0,d.jsx)(t.code,{children:".bin"})," (geometries)"]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"File Format"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://www.opengeospatial.org/standards/i3s",children:"i3s"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"Data Format"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"#data-formats",children:"Data formats"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"Supported APIs"}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:"load"}),", ",(0,d.jsx)(t.code,{children:"parse"})]})]})]})]}),"\n",(0,d.jsx)(t.h2,{id:"i3s-layer-type-support",children:"I3S Layer type support"}),"\n",(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:"Layer Type"}),(0,d.jsx)(t.th,{children:"Supported"}),(0,d.jsx)(t.th,{children:"I3S Spec Link"})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"3DObject"}),(0,d.jsx)(t.td,{children:"\u2705"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3Dobject_ReadMe.md",children:"https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3Dobject_ReadMe.md"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"Integrated Mesh"}),(0,d.jsx)(t.td,{children:"\u2705"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.7/IntegratedMesh_ReadMe.md",children:"https://github.com/Esri/i3s-spec/blob/master/docs/1.7/IntegratedMesh_ReadMe.md"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"Points"}),(0,d.jsx)(t.td,{children:"\u274c"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.7/Point_ReadMe.md",children:"https://github.com/Esri/i3s-spec/blob/master/docs/1.7/Point_ReadMe.md"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"PointClouds"}),(0,d.jsx)(t.td,{children:"\u274c"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/2.0/pcsl_ReadMe.md",children:"https://github.com/Esri/i3s-spec/blob/master/docs/2.0/pcsl_ReadMe.md"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"Building Scene Layer"}),(0,d.jsx)(t.td,{children:"\ud83d\udea7 experimental"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/BSL_ReadMe.md",children:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/BSL_ReadMe.md"})})]})]})]}),"\n",(0,d.jsx)(t.h2,{id:"i3s-aspects-support",children:"I3S Aspects support"}),"\n",(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:"Aspect"}),(0,d.jsx)(t.th,{children:"Supported"}),(0,d.jsx)(t.th,{children:"I3S Spec Link"})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"Node pages"}),(0,d.jsx)(t.td,{children:"\u2705"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/nodePage.cmn.md",children:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/nodePage.cmn.md"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"Compressed attributes"}),(0,d.jsx)(t.td,{children:"\u2705"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/compressedAttributes.cmn.md",children:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/compressedAttributes.cmn.md"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"PBR materials"}),(0,d.jsx)(t.td,{children:"\u2705"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/pbrMetallicRoughness.cmn.md",children:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/pbrMetallicRoughness.cmn.md"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"Feature attributes"}),(0,d.jsx)(t.td,{children:"\u2705"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/attributeStorageInfo.cmn.md",children:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/attributeStorageInfo.cmn.md"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"Texture Atlas"}),(0,d.jsx)(t.td,{children:"\u2705"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/texture.cmn.md#atlas-usage-and-regions",children:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/texture.cmn.md#atlas-usage-and-regions"})})]})]})]}),"\n",(0,d.jsx)(t.h2,{id:"texture-formats",children:"Texture formats"}),"\n",(0,d.jsxs)(t.p,{children:["I3S textures specification - ",(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/texture.cmn.md",children:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/texture.cmn.md"})]}),"\n",(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:"Texture"}),(0,d.jsx)(t.th,{children:"Supported"})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"JPEG"}),(0,d.jsx)(t.td,{children:"\u2705"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"PNG"}),(0,d.jsx)(t.td,{children:"\u2705"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:".dds with DXT1 (no alpha)"}),(0,d.jsx)(t.td,{children:"\u2705"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:".dds with DXT5 (alpha channel)"}),(0,d.jsx)(t.td,{children:"\u2705"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"ktx-etc2"}),(0,d.jsx)(t.td,{children:"\ud83d\udea7 not tested"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"Basis Universal Texture format in Khronos KTX2"}),(0,d.jsx)(t.td,{children:"\u2705"})]})]})]}),"\n",(0,d.jsx)(t.h2,{id:"terms",children:"Terms"}),"\n",(0,d.jsxs)(t.p,{children:["The terms and concepts used in ",(0,d.jsx)(t.code,{children:"i3s"})," module have the corresponding parts ",(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md",children:"I3S Spec"}),"."]}),"\n",(0,d.jsxs)(t.ul,{children:["\n",(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:"tileset"}),": I3S Indexed 3D Layer File."]}),"\n",(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:"tile"}),": I3S node file."]}),"\n",(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:"tileContent"}),": I3S node content: geometries, textures, etc."]}),"\n"]}),"\n",(0,d.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,d.jsxs)(t.p,{children:["As an I3S tileset contains multiple file formats, ",(0,d.jsx)(t.code,{children:"I3SLoader"})," is needed to be explicitly specified when using ",(0,d.jsx)(t.a,{href:"https://loaders.gl/modules/core/docs/api-reference/load",children:(0,d.jsx)(t.code,{children:"load"})})," function."]}),"\n",(0,d.jsx)(t.p,{children:(0,d.jsxs)(t.strong,{children:["Load I3S tileset and render with ",(0,d.jsx)(t.a,{href:"https://deck.gl/#/",children:"deck.gl"})]})}),"\n",(0,d.jsxs)(t.p,{children:["A simple react app uses ",(0,d.jsx)(t.a,{href:"https://github.com/visgl/loaders.gl/blob/master/modules/i3s/src/i3s-loader.ts",children:(0,d.jsx)(t.code,{children:"I3SLoader"})})," to load ",(0,d.jsx)(t.a,{href:"https://www.arcgis.com/home/item.html?id=d3344ba99c3f4efaa909ccfbcc052ed5",children:"San Francisco Buildings"}),", render with ",(0,d.jsx)(t.a,{href:"https://deck.gl/",children:"deck.gl's"})," ",(0,d.jsx)(t.a,{href:"https://deck.gl/docs/api-reference/geo-layers/tile-3d-layer",children:(0,d.jsx)(t.code,{children:"Tile3Dlayer"})})," and dynamically load/unload tiles based on current viewport and adjust the level of details when zooming in and out."]}),"\n",(0,d.jsx)("table",{style:{border:0,align:"center"},children:(0,d.jsx)("tbody",{children:(0,d.jsx)("img",{style:{maxHeight:200},src:"https://raw.github.com/visgl/deck.gl-data/master/images/whats-new/esri-i3s.gif"})})}),"\n",(0,d.jsx)(t.p,{children:(0,d.jsx)(t.a,{href:"https://codepen.io/belom88/pen/JjamLvx",children:"Example Codepen"})}),"\n",(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:"language-typescript",children:"import React, {Component} from 'react';\n\nimport {StaticMap} from 'react-map-gl';\nimport DeckGL from '@deck.gl/react';\nimport {MapController} from '@deck.gl/core';\nimport {Tile3DLayer} from '@deck.gl/geo-layers';\nimport {I3SLoader} from '@loaders.gl/i3s';\n\n// How to get mapbox token https://docs.mapbox.com/help/how-mapbox-works/access-tokens/\nconst MAPBOX_TOKEN = ''; // add your Mapbox token here\n\nconst INITIAL_VIEW_STATE = {\n  longitude: -120,\n  latitude: 34,\n  height: 600,\n  width: 800,\n  pitch: 45,\n  maxPitch: 85,\n  bearing: 0,\n  minZoom: 2,\n  maxZoom: 30,\n  zoom: 14.5\n};\n\nexport default class App extends Component {\n  constructor(props) {\n    super(props);\n    this.state = {viewState: INITIAL_VIEW_STATE};\n  }\n\n  _onTilesetLoad(tileset) {\n    // update viewport to the tileset center\n    const {zoom, cartographicCenter} = tileset;\n    const [longitude, latitude] = cartographicCenter;\n\n    const viewState = {\n      ...this.state.viewState,\n      zoom: zoom + 2.5,\n      longitude,\n      latitude\n    };\n\n    this.setState({viewState});\n  }\n\n  render() {\n    const {viewState} = this.state;\n\n    // construct Tile3DLayer to render I3S tileset\n    const layer = new Tile3DLayer({\n      id: 'tile-3d-layer',\n      // Tileset entry point: Indexed 3D layer file url\n      data: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',\n      loader: I3SLoader,\n      onTilesetLoad: this._onTilesetLoad.bind(this)\n    });\n\n    return (\n      <DeckGL\n        layers={[layer]}\n        viewState={viewState}\n        controller={{type: MapController}}\n        onViewStateChange={({viewState}) => {\n          // update viewState when interacting with map\n          this.setState({viewState});\n        }}\n      >\n        <StaticMap\n          mapStyle={'mapbox://styles/mapbox/dark-v9'}\n          mapboxApiAccessToken={MAPBOX_TOKEN}\n          preventStyleDiffing\n        />\n      </DeckGL>\n    );\n  }\n}\n"})}),"\n",(0,d.jsxs)(t.p,{children:["A more complex example can be found ",(0,d.jsx)(t.a,{href:"https://github.com/visgl/loaders.gl/tree/master/examples/website/i3s",children:"here"}),", checkout website ",(0,d.jsx)(t.a,{href:"https://loaders.gl/examples/i3s",children:"example"}),"."]}),"\n",(0,d.jsx)(t.p,{children:(0,d.jsx)(t.strong,{children:"Basic API Usage"})}),"\n",(0,d.jsxs)(t.p,{children:["Basic API usage is illustrated in the following snippet. Create a ",(0,d.jsx)(t.code,{children:"Tileset3D"})," instance, point it a valid tileset URL, set up callbacks, and keep feeding in new camera positions:"]}),"\n",(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:"language-typescript",children:"import {load} from '@loaders.gl/core';\nimport {I3SLoader} from '@loaders.gl/i3s';\nimport {Tileset3D} from '@loaders.gl/tiles';\nimport {WebMercatorViewport} from '@deck.gl/core';\n\nconst tileseturl =\n  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';\n\nconst tileset = await load(tileseturl, I3SLoader);\n\nconst tileset3d = new Tileset3D(tilesetJson, {\n  onTileLoad: tile => console.log(tile)\n});\n\n// initial viewport\n// viewport should be deck.gl WebMercatorViewport instance\nconst viewport = new WebMercatorViewport({latitude, longitude, zoom, ...})\ntileset3d.update(viewport);\n\n// Viewport changes (pan zoom etc)\ntileset3d.selectTiles(viewport);\n\n// Visible tiles\nconst visibleTiles = tileset3d.tiles.filter(tile => tile.selected);\n\n// Note that visibleTiles will likely not immediately include all tiles\n// tiles will keep loading and file `onTileLoad` callbacks\n"})}),"\n",(0,d.jsx)(t.h2,{id:"options",children:"Options"}),"\n",(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:"Option"}),(0,d.jsx)(t.th,{children:"Type"}),(0,d.jsx)(t.th,{children:"Default"}),(0,d.jsx)(t.th,{children:"Description"})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"options.i3s.isTileset"})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:"Bool"})," or ",(0,d.jsx)(t.code,{children:"auto"})]}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"auto"})}),(0,d.jsxs)(t.td,{children:["Whether to load ",(0,d.jsx)(t.code,{children:"Tileset"})," (Layer 3D Index) file. If ",(0,d.jsx)(t.code,{children:"auto"}),", will decide if follow ",(0,d.jsx)(t.code,{children:"ArcGIS"})," tile layers' url convention"]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"options.i3s.isTileHeader"})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:"Bool"})," or ",(0,d.jsx)(t.code,{children:"auto"})]}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"auto"})}),(0,d.jsxs)(t.td,{children:["Whether to load ",(0,d.jsx)(t.code,{children:"TileHeader"}),"(node) file. If ",(0,d.jsx)(t.code,{children:"auto"}),", will decide if follow ",(0,d.jsx)(t.code,{children:"argis"})," url convention"]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"options.i3s.loadContent"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Bool"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"true"})}),(0,d.jsxs)(t.td,{children:["Whether to load tile content (geometries, texture, etc.). Note: I3S dataset, each tile node has separate urls pointing to tile metadata and its actual tile payload. If ",(0,d.jsx)(t.code,{children:"loadContent"})," is true, i3s loader will make a request to fetch the content fiile and decoded to the format as specified in ",(0,d.jsx)(t.a,{href:"#tile-object",children:"Tile Object"}),"."]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"options.i3s.token"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"string"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"null"})}),(0,d.jsx)(t.td,{children:"Authorization token for the layer"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"options.i3s.tileset"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Object"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"null"})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:"Tileset"})," object loaded by I3SLoader or follow the data format specified in ",(0,d.jsx)(t.a,{href:"#tileset-object",children:"Tileset Object"}),". It is required when loading i3s geometry content"]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"options.i3s.tile"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Object"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"null"})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:"Tile"})," object loaded by I3SLoader or follow the data format ",(0,d.jsx)(t.a,{href:"#tile-object",children:"Tile Object"}),". It is required when loading i3s geometry content"]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"options.i3s.useDracoGeometry"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Bool"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"true"})}),(0,d.jsx)(t.td,{children:"Use 'Draco' compressed geometry to show if applicable"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"options.i3s.useCompressedTextures"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Bool"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"true"})}),(0,d.jsx)(t.td,{children:'Use "Compressed textures" (_.dds or _.ktx) if available and supported by GPU'})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"options.i3s.decodeTextures"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Bool"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"true"})}),(0,d.jsx)(t.td,{children:"Decode texture image to ImageBitmap or compressed texture object (if supported by GPU)"})]})]})]}),"\n",(0,d.jsx)(t.h2,{id:"data-formats",children:"Data formats"}),"\n",(0,d.jsx)(t.p,{children:"Loaded data conforms to the 3D Tiles loader category specification with the following exceptions."}),"\n",(0,d.jsx)(t.h3,{id:"tileset-object",children:"Tileset Object"}),"\n",(0,d.jsx)(t.p,{children:"The following fields are guaranteed. Additionally, the loaded tileset object will contain all the data fetched from the provided url."}),"\n",(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:"Field"}),(0,d.jsx)(t.th,{children:"Type"}),(0,d.jsx)(t.th,{children:"Contents"})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"type"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsxs)(t.td,{children:["Value is ",(0,d.jsx)(t.code,{children:"i3s"}),". Indicates the returned object is an ",(0,d.jsx)(t.code,{children:"i3s"})," tileset."]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"lodMetricType"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsxs)(t.td,{children:["Root's level of detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Only support ",(0,d.jsx)(t.code,{children:"maxScreenThreshold"})," for now. Check I3S ",(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/lodSelection.cmn.md",children:"lodSelection"})," for more details."]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"lodMetricValue"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Number"})}),(0,d.jsx)(t.td,{children:"Root's level of detail (LoD) metric value."})]})]})]}),"\n",(0,d.jsx)(t.h3,{id:"tile-object",children:"Tile Object"}),"\n",(0,d.jsx)(t.p,{children:"The following fields are guaranteed. Additionally, the loaded tile object will contain all the data fetched from the provided url."}),"\n",(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:"Field"}),(0,d.jsx)(t.th,{children:"Type"}),(0,d.jsx)(t.th,{children:"Contents"})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"id"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsx)(t.td,{children:"Identifier of the tile, unique in a tileset"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"refine"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsxs)(t.td,{children:["Refinement type of the tile, currently only support ",(0,d.jsx)(t.code,{children:"REPLACE"})]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"type"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsxs)(t.td,{children:["Type of the tile, value is ",(0,d.jsx)(t.code,{children:"mesh"})," (currently only support ",(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec",children:"I3S MeshPyramids"})]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"url"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsx)(t.td,{children:"The url of this tile."})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"contentUrl"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsx)(t.td,{children:"The url of this tile."})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"featureUrl"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsx)(t.td,{children:"The url of this tile."})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"textureUrl"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsx)(t.td,{children:"The url of this tile."})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"boundingVolume"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Object"})}),(0,d.jsxs)(t.td,{children:["A bounding volume in Cartesian coordinates converted from i3s node's ",(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md",children:(0,d.jsx)(t.code,{children:"mbs"})})," that encloses a tile or its content. Exactly one box, region, or sphere property is required."]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"lodMetricType"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsxs)(t.td,{children:["Level of Detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Only support ",(0,d.jsx)(t.code,{children:"maxScreenThreshold"})," for now. Check I3S ",(0,d.jsx)(t.a,{href:"https://github.com/Esri/i3s-spec/blob/master/docs/1.8/lodSelection.cmn.md",children:"lodSelection"})," for more details."]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"lodMetricValue"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsx)(t.td,{children:"Level of Detail (LoD) metric value."})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"content"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"String"})}),(0,d.jsxs)(t.td,{children:["The actual payload of the tile or the url point to the actual payload. If ",(0,d.jsx)(t.code,{children:"option.loadContent"})," is enabled, content will be populated with the loaded value following the Tile Content section"]})]})]})]}),"\n",(0,d.jsx)(t.h3,{id:"tile-content",children:"Tile Content"}),"\n",(0,d.jsx)(t.p,{children:"After content is loaded, the following fields are guaranteed. But different tiles may have different extra content fields."}),"\n",(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:"Field"}),(0,d.jsx)(t.th,{children:"Type"}),(0,d.jsx)(t.th,{children:"Contents"})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"cartesianOrigin"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Number[3]"})}),(0,d.jsx)(t.td,{children:'"Center" of tile geometry in WGS84 fixed frame coordinates'})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"cartographicOrigin"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Number[3]"})}),(0,d.jsx)(t.td,{children:'"Origin" in lng/lat (center of tile\'s bounding volume)'})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"modelMatrix"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Number[16]"})}),(0,d.jsx)(t.td,{children:"Transforms tile geometry positions to fixed frame coordinates"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"vertexCount"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Number"})}),(0,d.jsx)(t.td,{children:"Transforms tile geometry positions to fixed frame coordinates"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"attributes"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Object"})}),(0,d.jsxs)(t.td,{children:["Each attribute follows luma.gl ",(0,d.jsx)(t.a,{href:"https://github.com/visgl/luma.gl/blob/master/docs/api-reference/webgl/README.md",children:"accessor"})," properties"]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"texture"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Object"})}),(0,d.jsxs)(t.td,{children:["Loaded texture by ",(0,d.jsx)(t.a,{href:"https://loaders.gl/modules/images/docs/api-reference/image-loader",children:(0,d.jsx)(t.code,{children:"loaders.gl/image"})})]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"featureData"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Object"})}),(0,d.jsx)(t.td,{children:"Loaded feature data for parsing the geometies (Will be deprecated in 2.x)"})]})]})]}),"\n",(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:"attributes"})," contains following fields"]}),"\n",(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:"Field"}),(0,d.jsx)(t.th,{children:"Type"}),(0,d.jsx)(t.th,{children:"Contents"})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"attributes.positions"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Object"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"{value, type, size, normalized}"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"attributes.normals"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Object"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"{value, type, size, normalized}"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"attributes.colors"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Object"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"{value, type, size, normalized}"})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"attributes.texCoords"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"Object"})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"{value, type, size, normalized}"})})]})]})]})]})}function a(e={}){const{wrapper:t}={...(0,i.a)(),...e.components};return t?(0,d.jsx)(t,{...e,children:(0,d.jsx)(h,{...e})}):h(e)}},11151:(e,t,s)=>{s.d(t,{Z:()=>l,a:()=>n});var d=s(67294);const i={},r=d.createContext(i);function n(e){const t=d.useContext(r);return d.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:n(e.components),d.createElement(r.Provider,{value:t},e.children)}}}]);