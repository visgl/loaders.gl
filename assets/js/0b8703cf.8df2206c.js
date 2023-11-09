"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[8820],{78645:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>o,contentTitle:()=>n,default:()=>h,frontMatter:()=>i,metadata:()=>c,toc:()=>a});var r=s(85893),d=s(11151);const i={},n="CSW - Catalog Service - Web",c={id:"modules/wms/formats/csw",title:"CSW - Catalog Service - Web",description:"ogc-logo",source:"@site/../docs/modules/wms/formats/csw.md",sourceDirName:"modules/wms/formats",slug:"/modules/wms/formats/csw",permalink:"/docs/modules/wms/formats/csw",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/wms/formats/csw.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Compressed Textures",permalink:"/docs/modules/textures/formats/compressed-textures"},next:{title:"WMS - Web Map Service",permalink:"/docs/modules/wms/formats/wms"}},o={},a=[];function l(e){const t={a:"a",code:"code",em:"em",h1:"h1",img:"img",li:"li",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,d.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.h1,{id:"csw---catalog-service---web",children:"CSW - Catalog Service - Web"}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"ogc-logo",src:s(63411).Z+"",width:"119",height:"60"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:(0,r.jsx)(t.em,{children:(0,r.jsx)(t.a,{href:"/docs/modules/wms",children:(0,r.jsx)(t.code,{children:"@loaders.gl/wms"})})})}),"\n",(0,r.jsx)(t.li,{children:(0,r.jsx)(t.em,{children:(0,r.jsx)(t.a,{href:"https://en.wikipedia.org/wiki/Catalogue_Service_for_the_Web",children:"Wikipedia article)"})})}),"\n"]}),"\n",(0,r.jsx)(t.p,{children:"CSW (Catalogue Service for the Web, sometimes written Catalogue Service - Web), is an OGC standard for exposing a catalogue of geospatial records in XML on the Internet (over HTTP). The catalogue is made up of records that describe geospatial data (e.g. KML), geospatial services (e.g. WMS), and related resources."}),"\n",(0,r.jsx)(t.p,{children:"Operations defined by the CSW standard include:"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Operation"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:(0,r.jsx)(t.code,{children:"GetCapabilities"})}),(0,r.jsx)(t.td,{children:"allows CSW clients to retrieve service metadata from a server"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:(0,r.jsx)(t.code,{children:"DescribeRecord"})}),(0,r.jsx)(t.td,{children:"allows a client to discover the information model supported by a target catalogue or service."})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:(0,r.jsx)(t.code,{children:"GetRecords"})}),(0,r.jsx)(t.td,{children:"search for records, returning record IDs"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:(0,r.jsx)(t.code,{children:"GetRecordById"})}),(0,r.jsx)(t.td,{children:"retrieves the default representation of catalogue records using their identifier"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsxs)(t.td,{children:[(0,r.jsx)(t.code,{children:"GetDomain"})," (optional)"]}),(0,r.jsx)(t.td,{children:"obtain information about the range of values of a metadata record or request parameter"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsxs)(t.td,{children:[(0,r.jsx)(t.code,{children:"Harvest"})," (optional)"]}),(0,r.jsx)(t.td,{children:"create/update metadata by asking the server to 'pull' metadata from somewhere"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsxs)(t.td,{children:[(0,r.jsx)(t.code,{children:"Transaction"})," (optional)"]}),(0,r.jsx)(t.td,{children:"create/edit metadata by 'pushing' the metadata to the server"})]})]})]}),"\n",(0,r.jsx)(t.p,{children:"Requests can encode the parameters in three different ways:"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Parameter encoding"}),(0,r.jsx)(t.th,{children:"loaders.gl support"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsxs)(t.td,{children:[(0,r.jsx)(t.code,{children:"GET"})," with URL parameters"]}),(0,r.jsx)(t.td,{children:"Yes"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsxs)(t.td,{children:[(0,r.jsx)(t.code,{children:"POST"})," with form-encoded payload"]}),(0,r.jsx)(t.td,{children:"No"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsxs)(t.td,{children:[(0,r.jsx)(t.code,{children:"POST"})," with XML payload"]}),(0,r.jsx)(t.td,{children:"No"})]})]})]}),"\n",(0,r.jsx)(t.p,{children:"Responses are in XML."})]})}function h(e={}){const{wrapper:t}={...(0,d.a)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(l,{...e})}):l(e)}},63411:(e,t,s)=>{s.d(t,{Z:()=>r});const r=s.p+"assets/images/ogc-logo-60-8ee2c25a50ccc14293453512c707a0c4.png"},11151:(e,t,s)=>{s.d(t,{Z:()=>c,a:()=>n});var r=s(67294);const d={},i=r.createContext(d);function n(e){const t=r.useContext(i);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(d):e.components||d:n(e.components),r.createElement(i.Provider,{value:t},e.children)}}}]);