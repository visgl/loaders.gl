"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[7645],{69319:(e,a,t)=>{t.r(a),t.d(a,{assets:()=>l,contentTitle:()=>i,default:()=>m,frontMatter:()=>r,metadata:()=>o,toc:()=>c});var s=t(62540),n=t(43023);const r={},i="XML",o={id:"modules/xml/formats/xml",title:"XML",description:"- @loaders.gl/xml",source:"@site/../docs/modules/xml/formats/xml.md",sourceDirName:"modules/xml/formats",slug:"/modules/xml/formats/xml",permalink:"/docs/modules/xml/formats/xml",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/xml/formats/xml.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"WKT-CRS - Well-Known Text for Coordinate Reference Systems",permalink:"/docs/modules/wkt/formats/wkt-crs"},next:{title:"Zip Archive",permalink:"/docs/modules/zip/formats/zip"}},l={},c=[{value:"Converting between XML and JavaScript / JSON data structures",id:"converting-between-xml-and-javascript--json-data-structures",level:2},{value:"Arrays",id:"arrays",level:3},{value:"Tag Names",id:"tag-names",level:3},{value:"Converting between JavaScript / JSON and XML",id:"converting-between-javascript--json-and-xml",level:2},{value:"Arrays",id:"arrays-1",level:3},{value:"XML schemas",id:"xml-schemas",level:2}];function d(e){const a={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",p:"p",ul:"ul",...(0,n.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(a.header,{children:(0,s.jsx)(a.h1,{id:"xml",children:"XML"})}),"\n",(0,s.jsxs)(a.ul,{children:["\n",(0,s.jsx)(a.li,{children:(0,s.jsx)(a.em,{children:(0,s.jsx)(a.a,{href:"/docs/modules/xml",children:(0,s.jsx)(a.code,{children:"@loaders.gl/xml"})})})}),"\n",(0,s.jsx)(a.li,{children:(0,s.jsx)(a.em,{children:(0,s.jsx)(a.a,{href:"https://en.wikipedia.org/wiki/XML",children:"Wikipedia article"})})}),"\n"]}),"\n",(0,s.jsx)(a.p,{children:"XML (eXtensible Markup Language) is a markup language and file format for storing, transmitting, and reconstructing arbitrary data."}),"\n",(0,s.jsx)(a.p,{children:"Just like JSON, XML is not quite a format in itself, in that it doesn't define a schema. Rather other formats are defined as XML-based formats."}),"\n",(0,s.jsxs)(a.p,{children:['The "schema" of specific XML based formats are typically described in the documentation of that format or standard. However a format specific schema can also be formally described using ',(0,s.jsx)(a.em,{children:"XML Schemas"}),". This article does not go deeply into these, but here are some notes on XML Schemas below."]}),"\n",(0,s.jsx)(a.p,{children:"XML was very successful and experienced a huge wave of adoption in the late 1990s and early 2000s, and it sometimes feels like most things were XML encoded one way or another at that time."}),"\n",(0,s.jsx)(a.p,{children:"However, XML is not a client friendly format, and it has largely fallen out of favor, being replaced (often by JSON) as the base syntax for new formats. While it is rare to see a new format today being based on XML, we still have a large number of XML-based data formats that remain in use, meaning that we still need to parse (and in some, more rare cases, generate) XML for a long time to come."}),"\n",(0,s.jsx)(a.h2,{id:"converting-between-xml-and-javascript--json-data-structures",children:"Converting between XML and JavaScript / JSON data structures"}),"\n",(0,s.jsx)(a.h3,{id:"arrays",children:"Arrays"}),"\n",(0,s.jsx)(a.p,{children:"Structurally, XML does not have a formal array type.\nA repetition of XML elements with the same tag name is typically converted into a JS array with that name, however when only a single element or no element with that tag is provided in an XML file, it is not possible for an XML parser to conclude that this is intended to be an array."}),"\n",(0,s.jsx)(a.h3,{id:"tag-names",children:"Tag Names"}),"\n",(0,s.jsxs)(a.ul,{children:["\n",(0,s.jsx)(a.li,{children:"JavaScript prefers camelCase where XML favors PascalCase, so a simple conversion step can make the parsed data more natural to use in JS."}),"\n",(0,s.jsx)(a.li,{children:"Namespaced tags complicate things in JavaScripts and it is often simplest to just strip XML namespaces from tags."}),"\n"]}),"\n",(0,s.jsx)(a.h2,{id:"converting-between-javascript--json-and-xml",children:"Converting between JavaScript / JSON and XML"}),"\n",(0,s.jsx)(a.h3,{id:"arrays-1",children:"Arrays"}),"\n",(0,s.jsx)(a.p,{children:"TBA"}),"\n",(0,s.jsx)(a.h2,{id:"xml-schemas",children:"XML schemas"}),"\n",(0,s.jsx)(a.p,{children:'As XML is really just a lexical format without semantics, actual XML-based formats define the "schema" of the XML file. These schemas can optionally be formally defined by so called XML schemas (which are of course are also defined in XML).'}),"\n",(0,s.jsx)(a.p,{children:"Although it would seem to be appealing to be able to automatically generate parsers, typescript types and even JSON schema from XML schemas, this is not trivial."}),"\n",(0,s.jsx)(a.p,{children:"In fact, XML schemas are not always practical to work with in JavaScript."}),"\n",(0,s.jsxs)(a.ul,{children:["\n",(0,s.jsx)(a.li,{children:"The XML schema definition is sophisticated and takes time to learn."}),"\n",(0,s.jsx)(a.li,{children:"Schemas tend to get very verbose and can be in the megabytes."}),"\n",(0,s.jsx)(a.li,{children:"Creating an XML schema from scratch is usually out of the question unless you have time to devote to this."}),"\n",(0,s.jsx)(a.li,{children:"Even if you find high-quality XML schemas for the formats you are interested in, using them in order to implement small specific parsers quickly becomes overkill."}),"\n"]}),"\n",(0,s.jsx)(a.p,{children:"(Naturally, it could be a different story in server languages like Java, with extensive mature framework support for XML)."})]})}function m(e={}){const{wrapper:a}={...(0,n.R)(),...e.components};return a?(0,s.jsx)(a,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},43023:(e,a,t)=>{t.d(a,{R:()=>i,x:()=>o});var s=t(63696);const n={},r=s.createContext(n);function i(e){const a=s.useContext(r);return s.useMemo((function(){return"function"==typeof e?e(a):{...a,...e}}),[a,e])}function o(e){let a;return a=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:i(e.components),s.createElement(r.Provider,{value:a},e.children)}}}]);