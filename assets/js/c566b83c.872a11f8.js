"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[7375],{11158:(e,d,s)=>{s.r(d),s.d(d,{assets:()=>c,contentTitle:()=>t,default:()=>j,frontMatter:()=>i,metadata:()=>l,toc:()=>h});var n=s(74848),r=s(28453);const i={},t="WKB - Well-Known Binary",l={id:"modules/wkt/formats/wkb",title:"WKB - Well-Known Binary",description:"ogc-logo",source:"@site/../docs/modules/wkt/formats/wkb.md",sourceDirName:"modules/wkt/formats",slug:"/modules/wkt/formats/wkb",permalink:"/docs/modules/wkt/formats/wkb",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/wkt/formats/wkb.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"WKT - Well-Known Text",permalink:"/docs/modules/wkt/formats/wkt"},next:{title:"WKT-CRS - Well-Known Text for Coordinate Reference Systems",permalink:"/docs/modules/wkt/formats/wkt-crs"}},c={},h=[{value:"Overview",id:"overview",level:2},{value:"Variations",id:"variations",level:2},{value:"Alternatives",id:"alternatives",level:2},{value:"Version History",id:"version-history",level:2},{value:"Ecosystem Support",id:"ecosystem-support",level:2},{value:"Format Details",id:"format-details",level:2}];function x(e){const d={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",img:"img",li:"li",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,r.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(d.h1,{id:"wkb---well-known-binary",children:"WKB - Well-Known Binary"}),"\n",(0,n.jsx)(d.p,{children:(0,n.jsx)(d.img,{alt:"ogc-logo",src:s(44505).A+"",width:"119",height:"60"})}),"\n",(0,n.jsxs)(d.ul,{children:["\n",(0,n.jsx)(d.li,{children:(0,n.jsx)(d.em,{children:(0,n.jsx)(d.a,{href:"/docs/modules/wkt",children:(0,n.jsx)(d.code,{children:"@loaders.gl/wkt"})})})}),"\n"]}),"\n",(0,n.jsx)(d.p,{children:"Well-Known Binary (WKB) is a binary version of Well-known Text"}),"\n",(0,n.jsx)(d.h2,{id:"overview",children:"Overview"}),"\n",(0,n.jsx)(d.p,{children:"Well-known binary (WKB) representations are typically shown in hexadecimal strings."}),"\n",(0,n.jsx)(d.h2,{id:"variations",children:"Variations"}),"\n",(0,n.jsxs)(d.ul,{children:["\n",(0,n.jsx)(d.li,{children:"EKWB - Adds spatial reference systems"}),"\n",(0,n.jsx)(d.li,{children:"TWKB"}),"\n"]}),"\n",(0,n.jsx)(d.h2,{id:"alternatives",children:"Alternatives"}),"\n",(0,n.jsxs)(d.ul,{children:["\n",(0,n.jsx)(d.li,{children:"WKT"}),"\n",(0,n.jsx)(d.li,{children:"GeoJSON Geometry"}),"\n",(0,n.jsx)(d.li,{children:"GML Geometry"}),"\n"]}),"\n",(0,n.jsxs)(d.table,{children:[(0,n.jsx)(d.thead,{children:(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.th,{children:"Format"}),(0,n.jsx)(d.th,{children:"Support"}),(0,n.jsx)(d.th,{children:"Description"})]})}),(0,n.jsxs)(d.tbody,{children:[(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:"WKB"}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:"TWKB"}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"WKB variant reduces binary size ~2x."})]})]})]}),"\n",(0,n.jsx)(d.p,{children:"TWKB uses varints, precision truncation and zigzag point encoding to reduce binary size ~2x (however compressed size reduction is less)"}),"\n",(0,n.jsx)(d.h2,{id:"version-history",children:"Version History"}),"\n",(0,n.jsx)(d.p,{children:"TBA."}),"\n",(0,n.jsx)(d.h2,{id:"ecosystem-support",children:"Ecosystem Support"}),"\n",(0,n.jsxs)(d.ul,{children:["\n",(0,n.jsxs)(d.li,{children:["PostGIS offers a function to return geometries in TWKB format: ",(0,n.jsx)(d.a,{href:"https://postgis.net/docs/ST_AsTWKB.html",children:"ST_AsTWKB"}),"."]}),"\n"]}),"\n",(0,n.jsx)(d.h2,{id:"format-details",children:"Format Details"}),"\n",(0,n.jsx)(d.p,{children:"The first byte indicates the byte order for the data:"}),"\n",(0,n.jsxs)(d.ul,{children:["\n",(0,n.jsx)(d.li,{children:"00 : big endian"}),"\n",(0,n.jsx)(d.li,{children:"01 : little endian"}),"\n"]}),"\n",(0,n.jsx)(d.p,{children:"The next 4 bytes are a 32-bit unsigned integer for the geometry type, as described below:"}),"\n",(0,n.jsxs)(d.table,{children:[(0,n.jsx)(d.thead,{children:(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.th,{children:"Type"}),(0,n.jsx)(d.th,{children:"Supported"}),(0,n.jsx)(d.th,{children:"2D"}),(0,n.jsx)(d.th,{children:"Z"}),(0,n.jsx)(d.th,{children:"M"}),(0,n.jsx)(d.th,{children:"ZM"})]})}),(0,n.jsxs)(d.tbody,{children:[(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"Geometry"})}),(0,n.jsx)(d.td,{children:"\u2705"}),(0,n.jsx)(d.td,{children:"0000"}),(0,n.jsx)(d.td,{children:"1000"}),(0,n.jsx)(d.td,{children:"2000"}),(0,n.jsx)(d.td,{children:"3000"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"Point"})}),(0,n.jsx)(d.td,{children:"\u2705"}),(0,n.jsx)(d.td,{children:"0001"}),(0,n.jsx)(d.td,{children:"1001"}),(0,n.jsx)(d.td,{children:"2001"}),(0,n.jsx)(d.td,{children:"3001"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"LineString"})}),(0,n.jsx)(d.td,{children:"\u2705"}),(0,n.jsx)(d.td,{children:"0002"}),(0,n.jsx)(d.td,{children:"1002"}),(0,n.jsx)(d.td,{children:"2002"}),(0,n.jsx)(d.td,{children:"3002"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"Polygon"})}),(0,n.jsx)(d.td,{children:"\u2705"}),(0,n.jsx)(d.td,{children:"0003"}),(0,n.jsx)(d.td,{children:"1003"}),(0,n.jsx)(d.td,{children:"2003"}),(0,n.jsx)(d.td,{children:"3003"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"MultiPoint"})}),(0,n.jsx)(d.td,{children:"\u2705"}),(0,n.jsx)(d.td,{children:"0004"}),(0,n.jsx)(d.td,{children:"1004"}),(0,n.jsx)(d.td,{children:"2004"}),(0,n.jsx)(d.td,{children:"3004"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"MultiLineString"})}),(0,n.jsx)(d.td,{children:"\u2705"}),(0,n.jsx)(d.td,{children:"0005"}),(0,n.jsx)(d.td,{children:"1005"}),(0,n.jsx)(d.td,{children:"2005"}),(0,n.jsx)(d.td,{children:"3005"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"MultiPolygon"})}),(0,n.jsx)(d.td,{children:"\u2705"}),(0,n.jsx)(d.td,{children:"0006"}),(0,n.jsx)(d.td,{children:"1006"}),(0,n.jsx)(d.td,{children:"2006"}),(0,n.jsx)(d.td,{children:"3006"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"GeometryCollection"})}),(0,n.jsx)(d.td,{children:"\u2705 *"}),(0,n.jsx)(d.td,{children:"0007"}),(0,n.jsx)(d.td,{children:"1007"}),(0,n.jsx)(d.td,{children:"2007"}),(0,n.jsx)(d.td,{children:"3007"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{}),(0,n.jsx)(d.td,{}),(0,n.jsx)(d.td,{}),(0,n.jsx)(d.td,{}),(0,n.jsx)(d.td,{}),(0,n.jsx)(d.td,{})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"CircularString"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0008"}),(0,n.jsx)(d.td,{children:"1008"}),(0,n.jsx)(d.td,{children:"2008"}),(0,n.jsx)(d.td,{children:"3008"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"CompoundCurve"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0009"}),(0,n.jsx)(d.td,{children:"1009"}),(0,n.jsx)(d.td,{children:"2009"}),(0,n.jsx)(d.td,{children:"3009"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"CurvePolygon"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0010"}),(0,n.jsx)(d.td,{children:"1010"}),(0,n.jsx)(d.td,{children:"2010"}),(0,n.jsx)(d.td,{children:"3010"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"MultiCurve"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0011"}),(0,n.jsx)(d.td,{children:"1011"}),(0,n.jsx)(d.td,{children:"2011"}),(0,n.jsx)(d.td,{children:"3011"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"MultiSurface"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0012"}),(0,n.jsx)(d.td,{children:"1012"}),(0,n.jsx)(d.td,{children:"2012"}),(0,n.jsx)(d.td,{children:"3012"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"Curve"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0013"}),(0,n.jsx)(d.td,{children:"1013"}),(0,n.jsx)(d.td,{children:"2013"}),(0,n.jsx)(d.td,{children:"3013"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"Surface"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0014"}),(0,n.jsx)(d.td,{children:"1014"}),(0,n.jsx)(d.td,{children:"2014"}),(0,n.jsx)(d.td,{children:"3014"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"PolyhedralSurface"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0015"}),(0,n.jsx)(d.td,{children:"1015"}),(0,n.jsx)(d.td,{children:"2015"}),(0,n.jsx)(d.td,{children:"3015"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"TIN"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0016"}),(0,n.jsx)(d.td,{children:"1016"}),(0,n.jsx)(d.td,{children:"2016"}),(0,n.jsx)(d.td,{children:"3016"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"Triangle"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0017"}),(0,n.jsx)(d.td,{children:"1017"}),(0,n.jsx)(d.td,{children:"2017"}),(0,n.jsx)(d.td,{children:"3017"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"Circle"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0018"}),(0,n.jsx)(d.td,{children:"1018"}),(0,n.jsx)(d.td,{children:"2018"}),(0,n.jsx)(d.td,{children:"3018"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"GeodesicString"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0019"}),(0,n.jsx)(d.td,{children:"1019"}),(0,n.jsx)(d.td,{children:"2019"}),(0,n.jsx)(d.td,{children:"3019"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"EllipticalCurve"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0020"}),(0,n.jsx)(d.td,{children:"1020"}),(0,n.jsx)(d.td,{children:"2020"}),(0,n.jsx)(d.td,{children:"3020"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"NurbsCurve"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0021"}),(0,n.jsx)(d.td,{children:"1021"}),(0,n.jsx)(d.td,{children:"2021"}),(0,n.jsx)(d.td,{children:"3021"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"Clothoid"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0022"}),(0,n.jsx)(d.td,{children:"1022"}),(0,n.jsx)(d.td,{children:"2022"}),(0,n.jsx)(d.td,{children:"3022"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"SpiralCurve"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0023"}),(0,n.jsx)(d.td,{children:"1023"}),(0,n.jsx)(d.td,{children:"2023"}),(0,n.jsx)(d.td,{children:"3023"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"CompoundSurface"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"0024"}),(0,n.jsx)(d.td,{children:"1024"}),(0,n.jsx)(d.td,{children:"2024"}),(0,n.jsx)(d.td,{children:"3024"})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"BrepSolid"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{}),(0,n.jsx)(d.td,{children:"1025"}),(0,n.jsx)(d.td,{}),(0,n.jsx)(d.td,{})]}),(0,n.jsxs)(d.tr,{children:[(0,n.jsx)(d.td,{children:(0,n.jsx)(d.code,{children:"AffinePlacement"})}),(0,n.jsx)(d.td,{children:"\u274c"}),(0,n.jsx)(d.td,{children:"102"}),(0,n.jsx)(d.td,{children:"1102"}),(0,n.jsx)(d.td,{}),(0,n.jsx)(d.td,{})]})]})]}),"\n",(0,n.jsx)(d.p,{children:"Remarks:"}),"\n",(0,n.jsxs)(d.ul,{children:["\n",(0,n.jsx)(d.li,{children:(0,n.jsx)(d.em,{children:"Many implementations, including loaders.gl, only handle the core GeoJSON geometry equivalents (points, line strings, polygons and to a varying degrees geometry collections of the same)."})}),"\n",(0,n.jsxs)(d.li,{children:[(0,n.jsx)(d.em,{children:(0,n.jsx)(d.code,{children:"GeometryCollection"})})," can be difficult for some clients to handle."]}),"\n"]})]})}function j(e={}){const{wrapper:d}={...(0,r.R)(),...e.components};return d?(0,n.jsx)(d,{...e,children:(0,n.jsx)(x,{...e})}):x(e)}},44505:(e,d,s)=>{s.d(d,{A:()=>n});const n=s.p+"assets/images/ogc-logo-60-8ee2c25a50ccc14293453512c707a0c4.png"},28453:(e,d,s)=>{s.d(d,{R:()=>t,x:()=>l});var n=s(96540);const r={},i=n.createContext(r);function t(e){const d=n.useContext(i);return n.useMemo((function(){return"function"==typeof e?e(d):{...d,...e}}),[d,e])}function l(e){let d;return d=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:t(e.components),n.createElement(i.Provider,{value:d},e.children)}}}]);