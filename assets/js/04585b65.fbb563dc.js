"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[731],{97306:(e,d,s)=>{s.r(d),s.d(d,{assets:()=>l,contentTitle:()=>i,default:()=>x,frontMatter:()=>t,metadata:()=>n,toc:()=>h});var r=s(85893),c=s(11151);const t={},i="Parquet",n={id:"modules/parquet/formats/parquet",title:"Parquet",description:"- @loaders.gl/parquet",source:"@site/../docs/modules/parquet/formats/parquet.md",sourceDirName:"modules/parquet/formats",slug:"/modules/parquet/formats/parquet",permalink:"/docs/modules/parquet/formats/parquet",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/parquet/formats/parquet.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"TileJSON / Tilestats",permalink:"/docs/modules/mvt/formats/tilejson"},next:{title:"GeoParquet",permalink:"/docs/modules/parquet/formats/geoparquet"}},l={},h=[{value:"Pages",id:"pages",level:2},{value:"Alternatives",id:"alternatives",level:2},{value:"Compression",id:"compression",level:2},{value:"Encoding",id:"encoding",level:2},{value:"Repetition",id:"repetition",level:2},{value:"Record Shredding",id:"record-shredding",level:3},{value:"Types",id:"types",level:2}];function j(e){const d={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,c.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(d.h1,{id:"parquet",children:"Parquet"}),"\n",(0,r.jsxs)(d.ul,{children:["\n",(0,r.jsx)(d.li,{children:(0,r.jsx)(d.em,{children:(0,r.jsx)(d.a,{href:"/docs/modules/parquet",children:(0,r.jsx)(d.code,{children:"@loaders.gl/parquet"})})})}),"\n",(0,r.jsx)(d.li,{children:(0,r.jsx)(d.em,{children:(0,r.jsx)(d.a,{href:"https://parquet.apache.org/docs/file-format/",children:"Parquet"})})}),"\n"]}),"\n",(0,r.jsx)(d.p,{children:"Parquet is a binary columnar format optimized for compact storage on disk."}),"\n",(0,r.jsxs)(d.p,{children:["The GitHUB specification of ",(0,r.jsx)(d.a,{href:"https://github.com/apache/parquet-format/blob/master/README.md",children:"Apache Parquet"}),"."]}),"\n",(0,r.jsx)(d.h2,{id:"pages",children:"Pages"}),"\n",(0,r.jsx)(d.p,{children:"columns can be divided into pages (similar to Apache Arrow record batches) so that partial columns covering a range of rows can be read without reading the entire file."}),"\n",(0,r.jsx)(d.h2,{id:"alternatives",children:"Alternatives"}),"\n",(0,r.jsx)(d.p,{children:"In contrast to Arrow which is designed to minimize serialization and deserialization, Parquet is optimized for storage on disk."}),"\n",(0,r.jsx)(d.h2,{id:"compression",children:"Compression"}),"\n",(0,r.jsx)(d.p,{children:"Since Parquet is designed for read-write access, compression is applied per column chunk."}),"\n",(0,r.jsx)(d.p,{children:"A wide range of compression codecs are supported. Internal parquet compression formats."}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Type"}),(0,r.jsx)(d.th,{children:"Read"}),(0,r.jsx)(d.th,{children:"Write"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"UNCOMPRESSED"})}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u2705"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"GZIP"})}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u2705"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"SNAPPY"})}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u2705"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"BROTLI"})}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"No"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"LZO"})}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsx)(d.td,{children:"\u274c"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"LZ4"})}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u2705"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"LZ4_RAW"})}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u2705"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"ZSTD"})}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u2705"})]})]})]}),"\n",(0,r.jsx)(d.h2,{id:"encoding",children:"Encoding"}),"\n",(0,r.jsx)(d.p,{children:"Some encodings are intended to improve successive column compression by organizing data so that it is less random."}),"\n",(0,r.jsx)(d.p,{children:"The following Parquet encodings are supported:"}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Encoding"}),(0,r.jsx)(d.th,{children:"Read"}),(0,r.jsx)(d.th,{children:"Write"}),(0,r.jsx)(d.th,{children:"Types"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"PLAIN"})}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"All"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"PLAIN_DICTIONARY"})}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"All"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"RLE_DICTIONARY"})}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsx)(d.td,{children:"All"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"DELTA_BINARY_PACKED"})}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"INT32"}),", ",(0,r.jsx)(d.code,{children:"INT64"}),", ",(0,r.jsx)(d.code,{children:"INT_8"}),", ",(0,r.jsx)(d.code,{children:"INT_16"}),", ",(0,r.jsx)(d.code,{children:"INT_32"}),", ",(0,r.jsx)(d.code,{children:"INT_64"}),", ",(0,r.jsx)(d.code,{children:"UINT_8"}),", ",(0,r.jsx)(d.code,{children:"UINT_16"}),", ",(0,r.jsx)(d.code,{children:"UINT_32"}),", ",(0,r.jsx)(d.code,{children:"UINT_64"}),", ",(0,r.jsx)(d.code,{children:"TIME_MILLIS"}),", ",(0,r.jsx)(d.code,{children:"TIME_MICROS"}),", ",(0,r.jsx)(d.code,{children:"TIMESTAMP_MILLIS"}),", ",(0,r.jsx)(d.code,{children:"TIMESTAMP_MICROS"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"DELTA_BYTE_ARRAY"})}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"BYTE_ARRAY"}),", ",(0,r.jsx)(d.code,{children:"UTF8"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"DELTA_LENGTH_BYTE_ARRAY"})}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"BYTE_ARRAY"}),", ",(0,r.jsx)(d.code,{children:"UTF8"})]})]})]})]}),"\n",(0,r.jsx)(d.h2,{id:"repetition",children:"Repetition"}),"\n",(0,r.jsx)(d.p,{children:"There are three repetition types in Parquet:"}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Repetition"}),(0,r.jsx)(d.th,{children:"Supported"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"REQUIRED"})}),(0,r.jsx)(d.td,{children:"\u2705"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"OPTIONAL"})}),(0,r.jsx)(d.td,{children:"\u2705"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"REPEATED"})}),(0,r.jsx)(d.td,{children:"\u2705"})]})]})]}),"\n",(0,r.jsx)(d.h3,{id:"record-shredding",children:"Record Shredding"}),"\n",(0,r.jsx)(d.p,{children:"The optional and repeated flags allow for very flexible, nested JSON like data storage in table cells."}),"\n",(0,r.jsxs)(d.p,{children:["The algorithm for compacting is referred to as ",(0,r.jsx)(d.a,{href:"https://www.joekearney.co.uk/posts/understanding-record-shredding",children:"Record Shredding"})]}),"\n",(0,r.jsx)(d.h2,{id:"types",children:"Types"}),"\n",(0,r.jsx)(d.p,{children:"TBA - This table is not complete"}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Name"}),(0,r.jsx)(d.th,{children:"Type"}),(0,r.jsx)(d.th,{children:"Supported"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"bool"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'BOOLEAN"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"int32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"int64"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT64"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"int96"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT96"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'FLOAT"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"double"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'DOUBLE"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"bytearray"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'BYTE_ARRAY"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"FixedLenByteArray"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'FIXED_LEN_BYTE_ARRAY, length=10"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"utf8"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"int_8"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, convertedtype=INT32, convertedtype=INT_8"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"int_16"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, convertedtype=INT_16"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"int_32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, convertedtype=INT_32"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"int_64"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT64, convertedtype=INT_64"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint_8"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, convertedtype=UINT_8"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint_16"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, convertedtype=UINT_16"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint_32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, convertedtype=UINT_32"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint_64"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT64, convertedtype=UINT_64"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"date"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, convertedtype=DATE"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"date2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, convertedtype=DATE, logicaltype=DATE"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"timemillis"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, convertedtype=TIME_MILLIS"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"timemillis2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, logicaltype=TIME, logicaltype.isadjustedtoutc=true, logicaltype.unit=MILLIS"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"timemicros"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT64, convertedtype=TIME_MICROS"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"timemicros2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT64, logicaltype=TIME, logicaltype.isadjustedtoutc=false, logicaltype.unit=MICROS"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"timestampmillis"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT64, convertedtype=TIMESTAMP_MILLIS"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"timestampmillis2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT64, logicaltype=TIMESTAMP, logicaltype.isadjustedtoutc=true, logicaltype.unit=MILLIS"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"timestampmicros"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT64, convertedtype=TIMESTAMP_MICROS"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"timestampmicros2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT64, logicaltype=TIMESTAMP, logicaltype.isadjustedtoutc=false, logicaltype.unit=MICROS"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"interval"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'BYTE_ARRAY, convertedtype=INTERVAL"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"decimal1"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, convertedtype=DECIMAL, scale=2, precision=9"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"decimal2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT64, convertedtype=DECIMAL, scale=2, precision=18"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"decimal3"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'FIXED_LEN_BYTE_ARRAY, convertedtype=DECIMAL, scale=2, precision=10, length=12"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"decimal4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'BYTE_ARRAY, convertedtype=DECIMAL, scale=2, precision=20"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"decimal5"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'INT32, logicaltype=DECIMAL, logicaltype.precision=10, logicaltype.scale=2"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"parquet"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'map, type=MAP, convertedtype=MAP, keytype=BYTE_ARRAY, keyconvertedtype=UTF8, valuetype=INT32"'})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"list"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"MAP"})," convertedtype=LIST, valuetype=BYTE_ARRAY, valueconvertedtype=UTF8"]}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:"`repeated"}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"INT32"}),' repetitiontype=REPEATED"`']}),(0,r.jsx)(d.td,{})]})]})]})]})}function x(e={}){const{wrapper:d}={...(0,c.a)(),...e.components};return d?(0,r.jsx)(d,{...e,children:(0,r.jsx)(j,{...e})}):j(e)}},11151:(e,d,s)=>{s.d(d,{Z:()=>n,a:()=>i});var r=s(67294);const c={},t=r.createContext(c);function i(e){const d=r.useContext(t);return r.useMemo((function(){return"function"==typeof e?e(d):{...d,...e}}),[d,e])}function n(e){let d;return d=e.disableParentContext?"function"==typeof e.components?e.components(c):e.components||c:i(e.components),r.createElement(t.Provider,{value:d},e.children)}}}]);