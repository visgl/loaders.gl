"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[4705],{26959:(t,e,r)=>{r.r(e),r.d(e,{assets:()=>d,contentTitle:()=>i,default:()=>h,frontMatter:()=>n,metadata:()=>c,toc:()=>l});var o=r(62540),a=r(43023);const n={},i="Types and Vectors",c={id:"arrowjs/api-reference/vectors",title:"Types and Vectors",description:"This documentation reflects Arrow JS v4.0. Needs to be updated for the new Arrow API in v9.0 +.",source:"@site/../docs/arrowjs/api-reference/vectors.md",sourceDirName:"arrowjs/api-reference",slug:"/arrowjs/api-reference/vectors",permalink:"/docs/arrowjs/api-reference/vectors",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/api-reference/vectors.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Vectors",permalink:"/docs/arrowjs/api-reference/vector"}},d={},l=[{value:"Overview",id:"overview",level:2},{value:"Usage",id:"usage",level:2},{value:"Special Vectors",id:"special-vectors",level:2},{value:"Dictionary Arrays",id:"dictionary-arrays",level:3},{value:"StructVector",id:"structvector",level:3},{value:"Bool Vectors",id:"bool-vectors",level:3},{value:"Binary Vectors",id:"binary-vectors",level:3},{value:"FloatVectors",id:"floatvectors",level:2},{value:"Static FloatVector Methods",id:"static-floatvector-methods",level:3},{value:"FloatVector.from(data: Uint16Array): Float16Vector;",id:"floatvectorfromdata-uint16array-float16vector",level:3},{value:"FloatVector.from(data: Float32Array): Float32Vector;",id:"floatvectorfromdata-float32array-float32vector",level:3},{value:"FloatVector.from(data: Float64Array): Float64Vector;",id:"floatvectorfromdata-float64array-float64vector",level:3},{value:"FloatVector16.from(data: Uint8Array | <code>Iterable&lt;Number&gt;</code>): Float16Vector;",id:"floatvector16fromdata-uint8array--iterablenumber-float16vector",level:3},{value:"FloatVector16.from(data: Uint16Array | <code>Iterable&lt;Number&gt;</code>): Float16Vector;",id:"floatvector16fromdata-uint16array--iterablenumber-float16vector",level:3},{value:"FloatVector32.from(data: Float32[&#39;TArray&#39;] | <code>Iterable&lt;Number&gt;</code>): Float32Vector;",id:"floatvector32fromdata-float32tarray--iterablenumber-float32vector",level:3},{value:"FloatVector64.from(data: Float64[&#39;TArray&#39;] | <code>Iterable&lt;Number&gt;</code>): Float64Vector;",id:"floatvector64fromdata-float64tarray--iterablenumber-float64vector",level:3},{value:"Float16Vector Methods",id:"float16vector-methods",level:2},{value:"toArray() : <code>Uint16Array</code>",id:"toarray--uint16array",level:3},{value:"toFloat32Array() : Float32Array",id:"tofloat32array--float32array",level:3},{value:"toFloat64Array() : Float64Array",id:"tofloat64array--float64array",level:3},{value:"IntVectors",id:"intvectors",level:2},{value:"Int64Vector Methods",id:"int64vector-methods",level:2},{value:"toArray() : <code>Int32Array</code>",id:"toarray--int32array",level:3},{value:"toBigInt64Array(): <code>BigInt64Array</code>",id:"tobigint64array-bigint64array",level:3},{value:"Uint64Vector Methods",id:"uint64vector-methods",level:2},{value:"toArray() : <code>Uint32Array</code>",id:"toarray--uint32array",level:3},{value:"toBigUint64Array(): <code>BigUint64Array</code>",id:"tobiguint64array-biguint64array",level:3},{value:"Static IntVector Methods",id:"static-intvector-methods",level:2},{value:"IntVector.from(data: Int8Array): Int8Vector;",id:"intvectorfromdata-int8array-int8vector",level:3},{value:"IntVector.from(data: Int16Array): Int16Vector;",id:"intvectorfromdata-int16array-int16vector",level:3},{value:"IntVector.from(data: Int32Array, is64?: boolean): Int32Vector | Int64Vector;",id:"intvectorfromdata-int32array-is64-boolean-int32vector--int64vector",level:3},{value:"IntVector.from(data: Uint8Array): Uint8Vector;",id:"intvectorfromdata-uint8array-uint8vector",level:3},{value:"IntVector.from(data: Uint16Array): Uint16Vector;",id:"intvectorfromdata-uint16array-uint16vector",level:3},{value:"IntVector.from(data: Uint32Array, is64?: boolean): Uint32Vector | Uint64Vector;",id:"intvectorfromdata-uint32array-is64-boolean-uint32vector--uint64vector",level:3},{value:"Int8Vector.from(this: typeof Int8Vector, data: Int8Array | <code>Iterable&lt;number&gt;</code>): Int8Vector;",id:"int8vectorfromthis-typeof-int8vector-data-int8array--iterablenumber-int8vector",level:3},{value:"Int16Vector.from(this: typeof Int16Vector, data: Int16Array | <code>Iterable&lt;number&gt;</code>): Int16Vector;",id:"int16vectorfromthis-typeof-int16vector-data-int16array--iterablenumber-int16vector",level:3},{value:"Int32Vector.from(this: typeof Int32Vector, data: Int32Array | <code>Iterable&lt;number&gt;</code>): Int32Vector;",id:"int32vectorfromthis-typeof-int32vector-data-int32array--iterablenumber-int32vector",level:3},{value:"Int64Vector.from(this: typeof Int64Vector, data: Int32Array | <code>Iterable&lt;number&gt;</code>): Int64Vector;",id:"int64vectorfromthis-typeof-int64vector-data-int32array--iterablenumber-int64vector",level:3},{value:"Uint8Vector.from(this: typeof Uint8Vector, data: Uint8Array | <code>Iterable&lt;number&gt;</code>): Uint8Vector;",id:"uint8vectorfromthis-typeof-uint8vector-data-uint8array--iterablenumber-uint8vector",level:3},{value:"Uint16Vector.from(this: typeof Uint16Vector, data: Uint16Array | <code>Iterable&lt;number&gt;</code>): Uint16Vector;",id:"uint16vectorfromthis-typeof-uint16vector-data-uint16array--iterablenumber-uint16vector",level:3},{value:"Uint32Vector.from(this: typeof Uint32Vector, data: Uint32Array | <code>Iterable&lt;number&gt;</code>): Uint32Vector;",id:"uint32vectorfromthis-typeof-uint32vector-data-uint32array--iterablenumber-uint32vector",level:3},{value:"Uint64Vector.from(this: typeof Uint64Vector, data: Uint32Array | <code>Iterable&lt;number&gt;</code>): Uint64Vector;",id:"uint64vectorfromthis-typeof-uint64vector-data-uint32array--iterablenumber-uint64vector",level:3},{value:"Date Vectors",id:"date-vectors",level:2}];function s(t){const e={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,a.R)(),...t.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(e.header,{children:(0,o.jsx)(e.h1,{id:"types-and-vectors",children:"Types and Vectors"})}),"\n",(0,o.jsxs)(e.blockquote,{children:["\n",(0,o.jsx)(e.p,{children:"This documentation reflects Arrow JS v4.0. Needs to be updated for the new Arrow API in v9.0 +."}),"\n"]}),"\n",(0,o.jsx)(e.h2,{id:"overview",children:"Overview"}),"\n",(0,o.jsx)(e.h2,{id:"usage",children:"Usage"}),"\n",(0,o.jsxs)(e.p,{children:["Constructing new ",(0,o.jsx)(e.code,{children:"Vector"})," instances is done through the static ",(0,o.jsx)(e.code,{children:"from()"})," methods"]}),"\n",(0,o.jsx)(e.h2,{id:"special-vectors",children:"Special Vectors"}),"\n",(0,o.jsx)(e.h3,{id:"dictionary-arrays",children:"Dictionary Arrays"}),"\n",(0,o.jsx)(e.p,{children:"The Dictionary type is a special array type that enables one or more record batches in a file or stream to transmit integer indices referencing a shared dictionary containing the distinct values in the logical array. Later record batches reuse indices in earlier batches and add new ones as needed."}),"\n",(0,o.jsxs)(e.p,{children:["A ",(0,o.jsx)(e.code,{children:"Dictionary"})," is similar to a ",(0,o.jsx)(e.code,{children:"factor"}),' in R or a pandas, or "Categorical" in Python. It is is often used with strings to save memory and improve performance.']}),"\n",(0,o.jsx)(e.h3,{id:"structvector",children:"StructVector"}),"\n",(0,o.jsx)(e.p,{children:"Holds nested fields."}),"\n",(0,o.jsx)(e.h3,{id:"bool-vectors",children:"Bool Vectors"}),"\n",(0,o.jsxs)(e.table,{children:[(0,o.jsx)(e.thead,{children:(0,o.jsx)(e.tr,{children:(0,o.jsx)(e.th,{children:"Bool Vectors"})})}),(0,o.jsx)(e.tbody,{children:(0,o.jsx)(e.tr,{children:(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"BoolVector"})})})})]}),"\n",(0,o.jsx)(e.h3,{id:"binary-vectors",children:"Binary Vectors"}),"\n",(0,o.jsxs)(e.table,{children:[(0,o.jsx)(e.thead,{children:(0,o.jsx)(e.tr,{children:(0,o.jsx)(e.th,{children:"Binary Vectors"})})}),(0,o.jsx)(e.tbody,{children:(0,o.jsx)(e.tr,{children:(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"BinaryVector"})})})})]}),"\n",(0,o.jsx)(e.h2,{id:"floatvectors",children:"FloatVectors"}),"\n",(0,o.jsxs)(e.table,{children:[(0,o.jsx)(e.thead,{children:(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.th,{children:"Float Vectors"}),(0,o.jsx)(e.th,{children:"Backing"}),(0,o.jsx)(e.th,{children:"Comments"})]})}),(0,o.jsxs)(e.tbody,{children:[(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Float16Vector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Uint16Array"})}),(0,o.jsx)(e.td,{children:"No native JS 16 bit type, additional methods available"})]}),(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Float32Vector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Float32Array"})}),(0,o.jsx)(e.td,{children:"Holds 32 bit floats"})]}),(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Float64Vector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Float64Array"})}),(0,o.jsx)(e.td,{children:"Holds 64 bit floats"})]})]})]}),"\n",(0,o.jsx)(e.h3,{id:"static-floatvector-methods",children:"Static FloatVector Methods"}),"\n",(0,o.jsx)(e.h3,{id:"floatvectorfromdata-uint16array-float16vector",children:"FloatVector.from(data: Uint16Array): Float16Vector;"}),"\n",(0,o.jsx)(e.h3,{id:"floatvectorfromdata-float32array-float32vector",children:"FloatVector.from(data: Float32Array): Float32Vector;"}),"\n",(0,o.jsx)(e.h3,{id:"floatvectorfromdata-float64array-float64vector",children:"FloatVector.from(data: Float64Array): Float64Vector;"}),"\n",(0,o.jsxs)(e.h3,{id:"floatvector16fromdata-uint8array--iterablenumber-float16vector",children:["FloatVector16.from(data: Uint8Array | ",(0,o.jsx)(e.code,{children:"Iterable<Number>"}),"): Float16Vector;"]}),"\n",(0,o.jsxs)(e.h3,{id:"floatvector16fromdata-uint16array--iterablenumber-float16vector",children:["FloatVector16.from(data: Uint16Array | ",(0,o.jsx)(e.code,{children:"Iterable<Number>"}),"): Float16Vector;"]}),"\n",(0,o.jsxs)(e.h3,{id:"floatvector32fromdata-float32tarray--iterablenumber-float32vector",children:["FloatVector32.from(data: Float32['TArray'] | ",(0,o.jsx)(e.code,{children:"Iterable<Number>"}),"): Float32Vector;"]}),"\n",(0,o.jsxs)(e.h3,{id:"floatvector64fromdata-float64tarray--iterablenumber-float64vector",children:["FloatVector64.from(data: Float64['TArray'] | ",(0,o.jsx)(e.code,{children:"Iterable<Number>"}),"): Float64Vector;"]}),"\n",(0,o.jsx)(e.h2,{id:"float16vector-methods",children:"Float16Vector Methods"}),"\n",(0,o.jsxs)(e.p,{children:["Since JS doesn't have half floats, ",(0,o.jsx)(e.code,{children:"Float16Vector"})," is backed by a ",(0,o.jsx)(e.code,{children:"Uint16Array"})," integer array. To make it practical to work with these arrays in JS, some extra methods are added."]}),"\n",(0,o.jsxs)(e.h3,{id:"toarray--uint16array",children:["toArray() : ",(0,o.jsx)(e.code,{children:"Uint16Array"})]}),"\n",(0,o.jsxs)(e.p,{children:["Returns a zero-copy view of the underlying ",(0,o.jsx)(e.code,{children:"Uint16Array"})," data."]}),"\n",(0,o.jsxs)(e.p,{children:["Note: Avoids incurring extra compute or copies if you're calling ",(0,o.jsx)(e.code,{children:"toArray()"})," in order to create a buffer for something like WebGL, but makes it hard to use the returned data as floating point values in JS."]}),"\n",(0,o.jsx)(e.h3,{id:"tofloat32array--float32array",children:"toFloat32Array() : Float32Array"}),"\n",(0,o.jsx)(e.p,{children:"This method will convert values to 32 bit floats. Allocates a new Array."}),"\n",(0,o.jsx)(e.h3,{id:"tofloat64array--float64array",children:"toFloat64Array() : Float64Array"}),"\n",(0,o.jsx)(e.p,{children:"This method will convert values to 64 bit floats. Allocates a new Array."}),"\n",(0,o.jsx)(e.h2,{id:"intvectors",children:"IntVectors"}),"\n",(0,o.jsxs)(e.table,{children:[(0,o.jsx)(e.thead,{children:(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.th,{children:"Int Vectors"}),(0,o.jsx)(e.th,{children:"Backing"}),(0,o.jsx)(e.th,{children:"Comments"})]})}),(0,o.jsxs)(e.tbody,{children:[(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Int8Vector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Int8Array"})}),(0,o.jsx)(e.td,{})]}),(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Int16Vector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Int16Array"})}),(0,o.jsx)(e.td,{})]}),(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Int32Vector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Int32Array"})}),(0,o.jsx)(e.td,{})]}),(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Int64Vector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Int32Array"})}),(0,o.jsxs)(e.td,{children:["64-bit values stored as pairs of ",(0,o.jsx)(e.code,{children:"lo, hi"})," 32-bit values for engines without BigInt support, extra methods available"]})]}),(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Uint8Vector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Uint8Array"})}),(0,o.jsx)(e.td,{})]}),(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Uint16Vector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Uint16Array "})}),(0,o.jsx)(e.td,{})]}),(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Uint32Vector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Uint32Array "})}),(0,o.jsx)(e.td,{})]}),(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Uint64Vector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Uint32Array"})}),(0,o.jsxs)(e.td,{children:["64-bit values stored as pairs of ",(0,o.jsx)(e.code,{children:"lo, hi"})," 32-bit values for engines without BigInt support, extra methods available"]})]})]})]}),"\n",(0,o.jsx)(e.h2,{id:"int64vector-methods",children:"Int64Vector Methods"}),"\n",(0,o.jsxs)(e.h3,{id:"toarray--int32array",children:["toArray() : ",(0,o.jsx)(e.code,{children:"Int32Array"})]}),"\n",(0,o.jsxs)(e.p,{children:["Returns a zero-copy view of the underlying pairs of ",(0,o.jsx)(e.code,{children:"lo, hi"})," 32-bit values as an ",(0,o.jsx)(e.code,{children:"Int32Array"}),". This Array's length is twice the logical length of the ",(0,o.jsx)(e.code,{children:"Int64Vector"}),"."]}),"\n",(0,o.jsxs)(e.h3,{id:"tobigint64array-bigint64array",children:["toBigInt64Array(): ",(0,o.jsx)(e.code,{children:"BigInt64Array"})]}),"\n",(0,o.jsxs)(e.p,{children:["Returns a zero-copy view of the underlying 64-bit integers as a ",(0,o.jsx)(e.code,{children:"BigInt64Array"}),". This Array has the samne length as the length of the original ",(0,o.jsx)(e.code,{children:"Int64Vector"}),"."]}),"\n",(0,o.jsxs)(e.p,{children:["Note: as of 03/2019, ",(0,o.jsx)(e.code,{children:"BigInt64Array"})," is only available in v8/Chrome. In JS runtimes without support for ",(0,o.jsx)(e.code,{children:"BigInt"}),", this method throws an unsupported error."]}),"\n",(0,o.jsx)(e.h2,{id:"uint64vector-methods",children:"Uint64Vector Methods"}),"\n",(0,o.jsxs)(e.h3,{id:"toarray--uint32array",children:["toArray() : ",(0,o.jsx)(e.code,{children:"Uint32Array"})]}),"\n",(0,o.jsxs)(e.p,{children:["Returns a zero-copy view of the underlying pairs of ",(0,o.jsx)(e.code,{children:"lo, hi"})," 32-bit values as a ",(0,o.jsx)(e.code,{children:"Uint32Array"}),". This Array's length is twice the logical length of the ",(0,o.jsx)(e.code,{children:"Uint64Vector"}),"."]}),"\n",(0,o.jsxs)(e.h3,{id:"tobiguint64array-biguint64array",children:["toBigUint64Array(): ",(0,o.jsx)(e.code,{children:"BigUint64Array"})]}),"\n",(0,o.jsxs)(e.p,{children:["Returns a zero-copy view of the underlying 64-bit integers as a ",(0,o.jsx)(e.code,{children:"BigUint64Array"}),". This Array has the samne length as the length of the original ",(0,o.jsx)(e.code,{children:"Uint64Vector"}),"."]}),"\n",(0,o.jsxs)(e.p,{children:["Note: as of 03/2019, ",(0,o.jsx)(e.code,{children:"BigUint64Array"})," is only available in v8/Chrome. In JS runtimes without support for ",(0,o.jsx)(e.code,{children:"BigInt"}),", this method throws an unsupported error."]}),"\n",(0,o.jsx)(e.h2,{id:"static-intvector-methods",children:"Static IntVector Methods"}),"\n",(0,o.jsx)(e.h3,{id:"intvectorfromdata-int8array-int8vector",children:"IntVector.from(data: Int8Array): Int8Vector;"}),"\n",(0,o.jsx)(e.h3,{id:"intvectorfromdata-int16array-int16vector",children:"IntVector.from(data: Int16Array): Int16Vector;"}),"\n",(0,o.jsx)(e.h3,{id:"intvectorfromdata-int32array-is64-boolean-int32vector--int64vector",children:"IntVector.from(data: Int32Array, is64?: boolean): Int32Vector | Int64Vector;"}),"\n",(0,o.jsx)(e.h3,{id:"intvectorfromdata-uint8array-uint8vector",children:"IntVector.from(data: Uint8Array): Uint8Vector;"}),"\n",(0,o.jsx)(e.h3,{id:"intvectorfromdata-uint16array-uint16vector",children:"IntVector.from(data: Uint16Array): Uint16Vector;"}),"\n",(0,o.jsx)(e.h3,{id:"intvectorfromdata-uint32array-is64-boolean-uint32vector--uint64vector",children:"IntVector.from(data: Uint32Array, is64?: boolean): Uint32Vector | Uint64Vector;"}),"\n",(0,o.jsxs)(e.h3,{id:"int8vectorfromthis-typeof-int8vector-data-int8array--iterablenumber-int8vector",children:["Int8Vector.from(this: typeof Int8Vector, data: Int8Array | ",(0,o.jsx)(e.code,{children:"Iterable<number>"}),"): Int8Vector;"]}),"\n",(0,o.jsxs)(e.h3,{id:"int16vectorfromthis-typeof-int16vector-data-int16array--iterablenumber-int16vector",children:["Int16Vector.from(this: typeof Int16Vector, data: Int16Array | ",(0,o.jsx)(e.code,{children:"Iterable<number>"}),"): Int16Vector;"]}),"\n",(0,o.jsxs)(e.h3,{id:"int32vectorfromthis-typeof-int32vector-data-int32array--iterablenumber-int32vector",children:["Int32Vector.from(this: typeof Int32Vector, data: Int32Array | ",(0,o.jsx)(e.code,{children:"Iterable<number>"}),"): Int32Vector;"]}),"\n",(0,o.jsxs)(e.h3,{id:"int64vectorfromthis-typeof-int64vector-data-int32array--iterablenumber-int64vector",children:["Int64Vector.from(this: typeof Int64Vector, data: Int32Array | ",(0,o.jsx)(e.code,{children:"Iterable<number>"}),"): Int64Vector;"]}),"\n",(0,o.jsxs)(e.h3,{id:"uint8vectorfromthis-typeof-uint8vector-data-uint8array--iterablenumber-uint8vector",children:["Uint8Vector.from(this: typeof Uint8Vector, data: Uint8Array | ",(0,o.jsx)(e.code,{children:"Iterable<number>"}),"): Uint8Vector;"]}),"\n",(0,o.jsxs)(e.h3,{id:"uint16vectorfromthis-typeof-uint16vector-data-uint16array--iterablenumber-uint16vector",children:["Uint16Vector.from(this: typeof Uint16Vector, data: Uint16Array | ",(0,o.jsx)(e.code,{children:"Iterable<number>"}),"): Uint16Vector;"]}),"\n",(0,o.jsxs)(e.h3,{id:"uint32vectorfromthis-typeof-uint32vector-data-uint32array--iterablenumber-uint32vector",children:["Uint32Vector.from(this: typeof Uint32Vector, data: Uint32Array | ",(0,o.jsx)(e.code,{children:"Iterable<number>"}),"): Uint32Vector;"]}),"\n",(0,o.jsxs)(e.h3,{id:"uint64vectorfromthis-typeof-uint64vector-data-uint32array--iterablenumber-uint64vector",children:["Uint64Vector.from(this: typeof Uint64Vector, data: Uint32Array | ",(0,o.jsx)(e.code,{children:"Iterable<number>"}),"): Uint64Vector;"]}),"\n",(0,o.jsx)(e.h2,{id:"date-vectors",children:"Date Vectors"}),"\n",(0,o.jsxs)(e.table,{children:[(0,o.jsx)(e.thead,{children:(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.th,{children:"Date Vectors"}),(0,o.jsx)(e.th,{children:"Backing"}),(0,o.jsx)(e.th,{})]})}),(0,o.jsxs)(e.tbody,{children:[(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"DateDayVector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Int32Array"})}),(0,o.jsx)(e.td,{})]}),(0,o.jsxs)(e.tr,{children:[(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"DateMillisecondVector"})}),(0,o.jsx)(e.td,{children:(0,o.jsx)(e.code,{children:"Int32Array"})}),(0,o.jsx)(e.td,{children:"TBD - stride: 2?"})]})]})]})]})}function h(t={}){const{wrapper:e}={...(0,a.R)(),...t.components};return e?(0,o.jsx)(e,{...t,children:(0,o.jsx)(s,{...t})}):s(t)}},43023:(t,e,r)=>{r.d(e,{R:()=>i,x:()=>c});var o=r(63696);const a={},n=o.createContext(a);function i(t){const e=o.useContext(n);return o.useMemo((function(){return"function"==typeof t?t(e):{...e,...t}}),[e,t])}function c(t){let e;return e=t.disableParentContext?"function"==typeof t.components?t.components(a):t.components||a:i(t.components),o.createElement(n.Provider,{value:e},t.children)}}}]);