"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[3122],{75813:(e,s,n)=>{n.r(s),n.d(s,{assets:()=>c,contentTitle:()=>i,default:()=>p,frontMatter:()=>a,metadata:()=>o,toc:()=>l});var r=n(85893),t=n(11151);const a={},i="WMSService",o={id:"modules/wms/api-reference/wms-service",title:"WMSService",description:"ogc-logo",source:"@site/../docs/modules/wms/api-reference/wms-service.md",sourceDirName:"modules/wms/api-reference",slug:"/modules/wms/api-reference/wms-service",permalink:"/docs/modules/wms/api-reference/wms-service",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/wms/api-reference/wms-service.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"CSWService",permalink:"/docs/modules/wms/api-reference/csw-service"},next:{title:"WMSCapabilitiesLoader",permalink:"/docs/modules/wms/api-reference/wms-capabilities-loader"}},c={},l=[{value:"Usage",id:"usage",level:2},{value:"Methods",id:"methods",level:2},{value:"constructor()",id:"constructor",level:3},{value:"getCapabilities()",id:"getcapabilities",level:3},{value:"getMap()",id:"getmap",level:3},{value:"getFeatureInfo()",id:"getfeatureinfo",level:3},{value:"describeLayer()",id:"describelayer",level:3},{value:"getLegendGraphic()",id:"getlegendgraphic",level:3},{value:"Limitations",id:"limitations",level:2}];function d(e){const s={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",img:"img",p:"p",pre:"pre",...(0,t.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(s.h1,{id:"wmsservice",children:"WMSService"}),"\n",(0,r.jsx)(s.p,{children:(0,r.jsx)(s.img,{alt:"ogc-logo",src:n(63411).Z+"",width:"119",height:"60"})}),"\n",(0,r.jsxs)("p",{class:"badges",children:[(0,r.jsx)("img",{src:"https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square",alt:"From-3.3"}),(0,r.jsx)(s.p,{children:"\xa0"}),(0,r.jsx)("img",{src:"https://img.shields.io/badge/-BETA-teal.svg",alt:"BETA"})]}),"\n",(0,r.jsxs)(s.p,{children:["The ",(0,r.jsx)(s.code,{children:"WMSService"})," class helps applications interact with a WMS service (discover its capabilities, request map images and information about geospatial features, etc)."]}),"\n",(0,r.jsxs)(s.p,{children:["The ",(0,r.jsx)(s.code,{children:"WMSService"})," provides a type safe API that forms valid WMS URLs and issues requests, handles WMS version differences and edge cases under the hood and parses results and errors into strongly typed JavaScript objects."]}),"\n",(0,r.jsxs)(s.p,{children:["The ",(0,r.jsx)(s.code,{children:"WMSService"})," implements the ",(0,r.jsx)(s.code,{children:"ImageService"})," interface, allowing WMS services to be used as one interchangeable source of asynchronously generated map image data."]}),"\n",(0,r.jsx)(s.h2,{id:"usage",children:"Usage"}),"\n",(0,r.jsxs)(s.p,{children:["A ",(0,r.jsx)(s.code,{children:"WMSService"})," instance provides type safe methods to send requests to a WMS service and parse the responses:"]}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"  const wmsService = new WMSService({url: WMS_SERVICE_URL, wmsParameters: {layers: ['oms']}});\n  const mapImage = await wmsService.getMap({\n    width: 800,\n    height: 600,\n    bbox: [30, 70, 35, 75]\n  });\n  // Render mapImage...\n"})}),"\n",(0,r.jsx)(s.p,{children:"Capabilities metadata can be queried:"}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"  const wmsService = new WMSService({url: WMS_SERVICE_URL});\n  const capabilities = await wmsService.getCapabilities({});\n  // Check capabilities\n"})}),"\n",(0,r.jsx)(s.p,{children:"The WMS version as well as other default WMS parameters can be specified in the constructor"}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"  // Specify the older 1.1.1 version (1.3.0 is the default)\n  const wmsService = new WMSService({url: WMS_SERVICE_URL, version: '1.1.1', layers: ['oms']});\n  const getMap = await wmsService.getMap({\n    width: 800,\n    height: 600,\n    bbox: [30, 70, 35, 75],\n    \n  });\n"})}),"\n",(0,r.jsxs)(s.p,{children:["Custom fetch options, such as HTTP headers, and loader-specific options can be specified via the\nstandard loaders.gl ",(0,r.jsx)(s.code,{children:"loadOptions"})," argument, which is forwarded to all load and parse operations:"]}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"  const wmsService = new WMSService({url: WMS_SERVICE_URL, loadOptions: {\n    fetch: {\n      headers: {\n        Authentication: 'Bearer abc...'\n      }\n    }\n  }});\n\n  const getMap = await wmsService.getMap({\n    width: 800,\n    height: 600,\n    bbox: [30, 70, 35, 75],\n    layers: ['oms']\n  });\n"})}),"\n",(0,r.jsxs)(s.p,{children:["For special use cases, is possible to use the ",(0,r.jsx)(s.code,{children:"WMSService"})," to just generate URLs, so that the application issue its own requests and parse responses."]}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"  const wmsService = new WMSService({url: WMS_SERVICE_URL});\n  const getMapUrl = await wmsService.getMapURL({\n    width: 800,\n    height: 600,\n    bbox: [30, 70, 35, 75],\n    layers: ['oms']\n  });\n  const response = await myCustomFetch(getMapURL);\n  // parse...\n"})}),"\n",(0,r.jsx)(s.h2,{id:"methods",children:"Methods"}),"\n",(0,r.jsx)(s.h3,{id:"constructor",children:"constructor()"}),"\n",(0,r.jsxs)(s.p,{children:["Creates a ",(0,r.jsx)(s.code,{children:"WMSService"})," instance"]}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"export type WMSServiceProps = {\n  url: string; // Base URL to the service\n  loadOptions?: LoaderOptions; // Any load options to the loaders.gl Loaders used by the WMSService methods\n  substituteCRS84?: boolean; // In WMS 1.3.0, replaces EPSG:4326 with CRS:84 to ensure lng,lat axis order. Default true.\n\n  wmsParameters: {\n    // Default WMS parameters can be provided here\n    version?: '1.3.0' | '1.1.1'; /** WMS version */\n    layers?: string[]; /** Layers to render */\n    query_layers?: string[]; /** Layers to query */\n    crs?: string; /** CRS for the image (not the bounding box) */\n    format?: 'image/png'; /** Requested format for the return image */\n    info_format?: 'text/plain' | 'application/vnd.ogc.gml'; /** Requested MIME type of returned feature info */\n    styles?: unknown; /** Styling */\n    transparent?: boolean; /** Render transparent pixels if no data */\n  },\n  vendorParameters\n};\n\nconstructor(props: WMSServiceProps)\n"})}),"\n",(0,r.jsx)(s.h3,{id:"getcapabilities",children:"getCapabilities()"}),"\n",(0,r.jsx)(s.p,{children:"Get Capabilities"}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"  async getCapabilities(\n    wmsParameters?: WMSGetCapabilitiesParameters,\n    vendorParameters?: Record<string, unknown>\n  ): Promise<WMSCapabilities>\n"})}),"\n",(0,r.jsxs)(s.p,{children:["Returns a capabilities objects. See [",(0,r.jsx)(s.code,{children:"WMSCapabilitiesLoader"}),"][/docs/modules/wms/api-reference/wms-capabilities-loader] for detailed information about the ",(0,r.jsx)(s.code,{children:"WMSCapabilities"})," type."]}),"\n",(0,r.jsx)(s.h3,{id:"getmap",children:"getMap()"}),"\n",(0,r.jsx)(s.p,{children:"Get a map image"}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"  async getMap(wmsParameters: WMSGetMapParameters, vendorParameters?: Record<string, unknown>): Promise<ImageType>\n"})}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"export type WMSGetMapParameters = {\n  bbox: [number, number, number, number]; // bounding box of the requested map image \n  width: number; // pixel width of returned image \n  height: number; // pixels \n\n  // constructor parameters can be overridden in the actual calls\n  layers?: string | string[]; // Layers to render \n  styles?: unknown; // Styling \n  crs?: string; // crs for the image (not the bounding box) \n  format?: 'image/png'; // requested format for the return image \n};\n"})}),"\n",(0,r.jsx)(s.h3,{id:"getfeatureinfo",children:"getFeatureInfo()"}),"\n",(0,r.jsxs)(s.blockquote,{children:["\n",(0,r.jsxs)(s.p,{children:["This request is not supported by all WNS servers. Use ",(0,r.jsx)(s.code,{children:"getCapabilities()"})," to determine if it is."]}),"\n"]}),"\n",(0,r.jsx)(s.p,{children:"Get Feature Info for a coordinate"}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"  async getFeatureInfo(\n    wmsParameters: WMSGetFeatureInfoParameters,\n    vendorParameters?: Record<string, unknown>\n  ): Promise<WMSFeatureInfo>\n"})}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"// https://imagery.pasda.psu.edu/arcgis/services/pasda/UrbanTreeCanopy_Landcover/MapServer/WmsServer?SERVICE=WMS&\nexport type WMSGetFeatureInfoParameters = {\n  x: number; // x coordinate for the feature info request\n  y: number; // y coordinate for the feature info request\n  query_layers: string[]; // list of layers to query (could be different from rendered layers)\n  info_format?: 'text/plain' | 'application/geojson' | 'application/vnd.ogc.gml'; // MIME type of returned feature info\n  layers: string[]; // Layers to render\n  styles?: unknown; // Styling\n  bbox: [number, number, number, number]; // bounding box of the requested map image\n  width: number; // pixel width of returned image\n  height: number; // pixels\n  crs?: string; // crs for the image (not the bounding box)\n  format?: 'image/png'; // requested format for the return image\n};\n"})}),"\n",(0,r.jsx)(s.h3,{id:"describelayer",children:"describeLayer()"}),"\n",(0,r.jsxs)(s.blockquote,{children:["\n",(0,r.jsxs)(s.p,{children:["This request is not supported by all WNS servers. Use ",(0,r.jsx)(s.code,{children:"getCapabilities()"})," to determine if it is."]}),"\n"]}),"\n",(0,r.jsx)(s.p,{children:"Get more information about a layer."}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"  async describeLayer(\n    wmsParameters: WMSDescribeLayerParameters,\n    vendorParameters?: Record<string, unknown>\n  ): Promise<WMSLayerDescription>\n"})}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"export type WMSDescribeLayerParameters = {\n  layer: string; // Layer to describe\n};\n"})}),"\n",(0,r.jsx)(s.h3,{id:"getlegendgraphic",children:"getLegendGraphic()"}),"\n",(0,r.jsxs)(s.blockquote,{children:["\n",(0,r.jsxs)(s.p,{children:["This request is not supported by all WMS servers. Use ",(0,r.jsx)(s.code,{children:"getCapabilities()"})," to determine if it is."]}),"\n"]}),"\n",(0,r.jsx)(s.p,{children:"Get an image with a semantic legend"}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"  async getLegendGraphic(\n    wmsParameters: WMSGetLegendGraphicParameters,\n    vendorParameters?: Record<string, unknown>\n  ): Promise<ImageType>\n"})}),"\n",(0,r.jsx)(s.pre,{children:(0,r.jsx)(s.code,{className:"language-typescript",children:"export type WMSGetLegendGraphicParameters = {\n};\n"})}),"\n",(0,r.jsx)(s.h2,{id:"limitations",children:"Limitations"}),"\n",(0,r.jsxs)(s.p,{children:["The ",(0,r.jsx)(s.code,{children:"WMSService"})," only supports WMS URL parameters generation and HTTP GET requests against a WMS server. The OGC WMS standard also allows WMS services to accept XML payloads with HTTP POST messages, however generation of such XML payloads is not supported."]})]})}function p(e={}){const{wrapper:s}={...(0,t.a)(),...e.components};return s?(0,r.jsx)(s,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},63411:(e,s,n)=>{n.d(s,{Z:()=>r});const r=n.p+"assets/images/ogc-logo-60-8ee2c25a50ccc14293453512c707a0c4.png"},11151:(e,s,n)=>{n.d(s,{Z:()=>o,a:()=>i});var r=n(67294);const t={},a=r.createContext(t);function i(e){const s=r.useContext(a);return r.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function o(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:i(e.components),r.createElement(a.Provider,{value:s},e.children)}}}]);