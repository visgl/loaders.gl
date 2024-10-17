"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[5894],{7439:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>l,contentTitle:()=>i,default:()=>h,frontMatter:()=>s,metadata:()=>o,toc:()=>c});var a=t(62540),n=t(43023);const s={},i="Working with Tables",o={id:"arrowjs/developer-guide/tables",title:"Working with Tables",description:"References:",source:"@site/../docs/arrowjs/developer-guide/tables.md",sourceDirName:"arrowjs/developer-guide",slug:"/arrowjs/developer-guide/tables",permalink:"/docs/arrowjs/developer-guide/tables",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/developer-guide/tables.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Schemas",permalink:"/docs/arrowjs/developer-guide/schemas"},next:{title:"Building columns and tables",permalink:"/docs/arrowjs/developer-guide/builders"}},l={},c=[{value:"Loading Arrow Data",id:"loading-arrow-data",level:2},{value:"Getting Records Count",id:"getting-records-count",level:2},{value:"Getting Arrow Schema Metadata",id:"getting-arrow-schema-metadata",level:3},{value:"Accessing Arrow Table Row Data",id:"accessing-arrow-table-row-data",level:3},{value:"Record toJSON and toArray",id:"record-tojson-and-toarray",level:2},{value:"Slicing Arrow Data",id:"slicing-arrow-data",level:2},{value:"Iterating over Rows and Cells",id:"iterating-over-rows-and-cells",level:3},{value:"Converting Dates",id:"converting-dates",level:3},{value:"Column Data Vectors",id:"column-data-vectors",level:3},{value:"Filtering Timestamped Data",id:"filtering-timestamped-data",level:3}];function d(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,n.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(r.header,{children:(0,a.jsx)(r.h1,{id:"working-with-tables",children:"Working with Tables"})}),"\n",(0,a.jsx)(r.p,{children:"References:"}),"\n",(0,a.jsxs)(r.ul,{children:["\n",(0,a.jsxs)(r.li,{children:["Much of the text in this section is adapted from Brian Hulette's ",(0,a.jsx)(r.a,{href:"https://observablehq.com/@theneuralbit/using-apache-arrow-js-with-large-datasets",children:"Using Apache Arrow JS with Large Datasets"})]}),"\n"]}),"\n",(0,a.jsx)(r.h2,{id:"loading-arrow-data",children:"Loading Arrow Data"}),"\n",(0,a.jsxs)(r.p,{children:["Applications often start with loading some Arrow formatted data. The Arrow API provides several ways to do this, but in many cases, the simplest approach is to use ",(0,a.jsx)(r.code,{children:"Table.from()"}),"."]}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{className:"language-typescript",children:"import {Table} from 'apache-arrow';\nconst response = await fetch(dataUrl);\nconst arrayBuffer = await response.arrayBuffer();\nconst dataTable = arrow.Table.from(new Uint8Array(arrayBuffer));\n"})}),"\n",(0,a.jsx)(r.h2,{id:"getting-records-count",children:"Getting Records Count"}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{className:"language-typescript",children:"const count = table.count();\n"})}),"\n",(0,a.jsx)(r.h3,{id:"getting-arrow-schema-metadata",children:"Getting Arrow Schema Metadata"}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{className:"language-typescript",children:'const fieldNames = table.schema.fields.map((f) => f.name);\n// Array(3) ["Latitude", "Longitude", "Date"]\n'})}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{className:"language-typescript",children:'const fieldTypes = tables.schema.fields.map(f => f.type)\n// Array(3) [Float, Float, Timestamp]\n\nconst fieldTypeNames = ...;\n// Array(3) ["Float64", "Float64", "Timestamp<MICROSECOND>"]\n'})}),"\n",(0,a.jsx)(r.h3,{id:"accessing-arrow-table-row-data",children:"Accessing Arrow Table Row Data"}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{className:"language-typescript",children:"const firstRow = tables.get(0); // 1st row data\nconst lastRow = tables.get(rowCount - 1);\n"})}),"\n",(0,a.jsx)(r.h2,{id:"record-tojson-and-toarray",children:"Record toJSON and toArray"}),"\n",(0,a.jsx)(r.p,{children:"It is easy to converting Rows to JSON/Arrays/Strings:"}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{className:"language-typescript",children:"toJSON = Array(3)[(41.890751259, -87.71617311899999, Int32Array(2))];\ntoArray = Array(3)[(41.933659084, -87.72369064600001, Int32Array(2))];\n"})}),"\n",(0,a.jsx)(r.p,{children:"Similar conversion methods are avaiable on many Arrow classes."}),"\n",(0,a.jsx)(r.p,{children:"tables.get(0).toJSON()"}),"\n",(0,a.jsx)(r.h2,{id:"slicing-arrow-data",children:"Slicing Arrow Data"}),"\n",(0,a.jsx)(r.p,{children:"every10KRow = Array(17) [Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3)]"}),"\n",(0,a.jsx)(r.p,{children:"Our custom arrow data range stepper for sampling data:"}),"\n",(0,a.jsx)(r.p,{children:"range = \u0192(start, end, step)"}),"\n",(0,a.jsx)(r.h3,{id:"iterating-over-rows-and-cells",children:"Iterating over Rows and Cells"}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{className:"language-typescript",children:"for (let row of dataFrame) {\n  for (let cell of row) {\n    if (Array.isArray(cell)) {\n      td = '[' + cell.map((value) => (value == null ? 'null' : value)).join(', ') + ']';\n    } else if (fields[k] === 'Date') {\n      td = toDate(cell); // convert Apache arrow Timestamp to Date\n    } else {\n      td = cell.toString();\n    }\n    k++;\n  }\n}\n"})}),"\n",(0,a.jsx)(r.h3,{id:"converting-dates",children:"Converting Dates"}),"\n",(0,a.jsx)(r.p,{children:'Apache Arrow Timestamp is a 64-bit int of milliseconds since the epoch, represented as two 32-bit ints in JS to preserve precision. The fist number is the "low" int and the second number is the "high" int.'}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{className:"language-typescript",children:"function toDate(timestamp) {\n  return new Date((timestamp[1] * Math.pow(2, 32) + timestamp[0]) / 1000);\n}\n"})}),"\n",(0,a.jsx)(r.h3,{id:"column-data-vectors",children:"Column Data Vectors"}),"\n",(0,a.jsx)(r.p,{children:"Apache Arrow stores columns in typed arrays and vectors:"}),"\n",(0,a.jsx)(r.p,{children:"Typed vectors have convinience methods to convert Int32 arrays data to JS values you can work with."}),"\n",(0,a.jsx)(r.p,{children:"For example, to get timestamps in milliseconds:"}),"\n",(0,a.jsx)(r.p,{children:"timestamps = Array(10) [2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01]"}),"\n",(0,a.jsx)(r.h3,{id:"filtering-timestamped-data",children:"Filtering Timestamped Data"}),"\n",(0,a.jsx)(r.pre,{children:(0,a.jsx)(r.code,{className:"language-typescript",children:"function filterByDate(startDate, endDate) {\n  const dateFilter = arrow.predicate.custom(\n    (i) => {\n      const arrowDate = table.getColumn('Date').get(i);\n      const date = toDate(arrowDate);\n      return date >= startDate && date <= endDate;\n    },\n    (b) => 1\n  );\n\n  const getDate;\n  const results = [];\n  table.filter(dateFilter).scan(\n    (index) => {\n      results.push({\n        date: toDate(getDate(index))\n      });\n    },\n    (batch) => {\n      getDate = arrow.predicate.col('Date').bind(batch);\n    }\n  );\n\n  return results;\n}\n"})}),"\n",(0,a.jsx)(r.p,{children:"Our custom filter by date method uses custom arrow table predicate filter and scan methods to generate JS friendly data you can map or graph:"})]})}function h(e={}){const{wrapper:r}={...(0,n.R)(),...e.components};return r?(0,a.jsx)(r,{...e,children:(0,a.jsx)(d,{...e})}):d(e)}},43023:(e,r,t)=>{t.d(r,{R:()=>i,x:()=>o});var a=t(63696);const n={},s=a.createContext(n);function i(e){const r=a.useContext(s);return a.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function o(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:i(e.components),a.createElement(s.Provider,{value:r},e.children)}}}]);