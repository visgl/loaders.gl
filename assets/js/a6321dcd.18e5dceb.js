"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[3039],{92897:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>s,contentTitle:()=>l,default:()=>h,frontMatter:()=>d,metadata:()=>c,toc:()=>o});var t=n(85893),i=n(11151);const d={},l="Vectors",c={id:"arrowjs/api-reference/vector",title:"Vectors",description:"A Vector is an Array-like data structure. Use makeVector and vectorFromArray to create vectors.",source:"@site/../docs/arrowjs/api-reference/vector.md",sourceDirName:"arrowjs/api-reference",slug:"/arrowjs/api-reference/vector",permalink:"/docs/arrowjs/api-reference/vector",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/api-reference/vector.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Types",permalink:"/docs/arrowjs/api-reference/types"},next:{title:"Types and Vectors",permalink:"/docs/arrowjs/api-reference/vectors"}},s={},o=[{value:"makeVector",id:"makevector",level:3},{value:"vectorFromArray",id:"vectorfromarray",level:3},{value:"Vector",id:"vector",level:3},{value:"Fields",id:"fields",level:2},{value:"<code>type: DataType</code>",id:"type-datatype",level:3},{value:"<code>data: Data&lt;T&gt; (readonly)</code>",id:"data-datat-readonly",level:3},{value:"<code>numChildren: number (readonly)</code>",id:"numchildren-number-readonly",level:3},{value:"<code>typeId: T[&#39;typeId&#39;]</code>",id:"typeid-ttypeid",level:3},{value:"<code>length: number</code>",id:"length-number",level:3},{value:"<code>offset: number</code>",id:"offset-number",level:3},{value:"<code>stride: number</code>",id:"stride-number",level:3},{value:"<code>nullCount: number</code>",id:"nullcount-number",level:3},{value:"<code>VectorName: string</code>",id:"vectorname-string",level:3},{value:"<code>ArrayType: TypedArrayConstructor | ArrayConstructor</code>",id:"arraytype-typedarrayconstructor--arrayconstructor",level:3},{value:"<code>values: T[&#39;TArray&#39;]</code>",id:"values-ttarray",level:3},{value:"<code>typeIds: Int8Array | null</code>",id:"typeids-int8array--null",level:3},{value:"<code>nullBitmap: Uint8Array | null</code>",id:"nullbitmap-uint8array--null",level:3},{value:"<code>valueOffsets: Int32Array | null</code>",id:"valueoffsets-int32array--null",level:3},{value:"Methods",id:"methods",level:2},{value:"<code>clone(data: Data&lt;R&gt;, children): Vector&lt;R&gt;</code>",id:"clonedata-datar-children-vectorr",level:3},{value:"<code>concat(...others: Vector&lt;T&gt;[])</code>",id:"concatothers-vectort",level:3},{value:"<code>slice(begin?: number, end?: number)</code>",id:"slicebegin-number-end-number",level:3},{value:"<code>isValid()</code>",id:"isvalid",level:3},{value:"<code>getChildAt()</code>",id:"getchildat",level:3},{value:"<code>toJSON()</code>",id:"tojson",level:3}];function a(e){const r={code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,i.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.h1,{id:"vectors",children:"Vectors"}),"\n",(0,t.jsxs)(r.p,{children:["A ",(0,t.jsx)(r.code,{children:"Vector"})," is an Array-like data structure. Use ",(0,t.jsx)(r.code,{children:"makeVector"})," and ",(0,t.jsx)(r.code,{children:"vectorFromArray"})," to create vectors."]}),"\n",(0,t.jsx)(r.h3,{id:"makevector",children:"makeVector"}),"\n",(0,t.jsx)(r.h3,{id:"vectorfromarray",children:"vectorFromArray"}),"\n",(0,t.jsx)(r.h3,{id:"vector",children:"Vector"}),"\n",(0,t.jsxs)(r.p,{children:["Also referred to as ",(0,t.jsx)(r.code,{children:"BaseVector"}),". An abstract base class for vector types."]}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:"Can support a null map"}),"\n",(0,t.jsx)(r.li,{children:"..."}),"\n",(0,t.jsx)(r.li,{children:"TBD"}),"\n"]}),"\n",(0,t.jsx)(r.h2,{id:"fields",children:"Fields"}),"\n",(0,t.jsx)(r.h3,{id:"type-datatype",children:(0,t.jsx)(r.code,{children:"type: DataType"})}),"\n",(0,t.jsxs)(r.p,{children:["The Arrow ",(0,t.jsx)(r.code,{children:"DataType"})," that describes the elements in this Vector."]}),"\n",(0,t.jsx)(r.h3,{id:"data-datat-readonly",children:(0,t.jsx)(r.code,{children:"data: Data<T> (readonly)"})}),"\n",(0,t.jsx)(r.p,{children:"The underlying Data instance for this Vector."}),"\n",(0,t.jsx)(r.h3,{id:"numchildren-number-readonly",children:(0,t.jsx)(r.code,{children:"numChildren: number (readonly)"})}),"\n",(0,t.jsx)(r.p,{children:"The number of logical Vector children. Only applicable if the DataType of the Vector is one of the nested types (List, FixedSizeList, Struct, or Map)."}),"\n",(0,t.jsx)(r.h3,{id:"typeid-ttypeid",children:(0,t.jsx)(r.code,{children:"typeId: T['typeId']"})}),"\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.code,{children:"typeId"})," enum value of the ",(0,t.jsx)(r.code,{children:"type"})," instance"]}),"\n",(0,t.jsx)(r.h3,{id:"length-number",children:(0,t.jsx)(r.code,{children:"length: number"})}),"\n",(0,t.jsxs)(r.p,{children:["Number of elements in the ",(0,t.jsx)(r.code,{children:"Vector"})]}),"\n",(0,t.jsx)(r.h3,{id:"offset-number",children:(0,t.jsx)(r.code,{children:"offset: number"})}),"\n",(0,t.jsx)(r.p,{children:"Offset to the first element in the underlying data."}),"\n",(0,t.jsx)(r.h3,{id:"stride-number",children:(0,t.jsx)(r.code,{children:"stride: number"})}),"\n",(0,t.jsx)(r.p,{children:"Stride between successive elements in the the underlying data."}),"\n",(0,t.jsx)(r.p,{children:"The number of elements in the underlying data buffer that constitute a single logical value for the given type. The stride for all DataTypes is 1 unless noted here:"}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:["For ",(0,t.jsx)(r.code,{children:"Decimal"})," types, the stride is 4."]}),"\n",(0,t.jsxs)(r.li,{children:["For ",(0,t.jsx)(r.code,{children:"Date"})," types, the stride is 1 if the ",(0,t.jsx)(r.code,{children:"unit"})," is DateUnit.DAY, else 2."]}),"\n",(0,t.jsxs)(r.li,{children:["For ",(0,t.jsx)(r.code,{children:"Int"}),", ",(0,t.jsx)(r.code,{children:"Interval"}),", or ",(0,t.jsx)(r.code,{children:"Time"})," types, the stride is 1 if ",(0,t.jsx)(r.code,{children:"bitWidth <= 32"}),", else 2."]}),"\n",(0,t.jsxs)(r.li,{children:["For ",(0,t.jsx)(r.code,{children:"FixedSizeList"})," types, the stride is the ",(0,t.jsx)(r.code,{children:"listSize"})," property of the ",(0,t.jsx)(r.code,{children:"FixedSizeList"})," instance."]}),"\n",(0,t.jsxs)(r.li,{children:["For ",(0,t.jsx)(r.code,{children:"FixedSizeBinary"})," types, the stride is the ",(0,t.jsx)(r.code,{children:"byteWidth"})," property of the ",(0,t.jsx)(r.code,{children:"FixedSizeBinary"})," instance."]}),"\n"]}),"\n",(0,t.jsx)(r.h3,{id:"nullcount-number",children:(0,t.jsx)(r.code,{children:"nullCount: number"})}),"\n",(0,t.jsxs)(r.p,{children:["Number of ",(0,t.jsx)(r.code,{children:"null"})," values in this ",(0,t.jsx)(r.code,{children:"Vector"})," instance (",(0,t.jsx)(r.code,{children:"null"})," values require a null map to be present)."]}),"\n",(0,t.jsx)(r.h3,{id:"vectorname-string",children:(0,t.jsx)(r.code,{children:"VectorName: string"})}),"\n",(0,t.jsx)(r.p,{children:"Returns the name of the Vector"}),"\n",(0,t.jsx)(r.h3,{id:"arraytype-typedarrayconstructor--arrayconstructor",children:(0,t.jsx)(r.code,{children:"ArrayType: TypedArrayConstructor | ArrayConstructor"})}),"\n",(0,t.jsx)(r.p,{children:"Returns the constructor of the underlying typed array for the values buffer as determined by this Vector's DataType."}),"\n",(0,t.jsx)(r.h3,{id:"values-ttarray",children:(0,t.jsx)(r.code,{children:"values: T['TArray']"})}),"\n",(0,t.jsx)(r.p,{children:"Returns the underlying data buffer of the Vector, if applicable."}),"\n",(0,t.jsx)(r.h3,{id:"typeids-int8array--null",children:(0,t.jsx)(r.code,{children:"typeIds: Int8Array | null"})}),"\n",(0,t.jsx)(r.p,{children:"Returns the underlying typeIds buffer, if the Vector DataType is Union."}),"\n",(0,t.jsx)(r.h3,{id:"nullbitmap-uint8array--null",children:(0,t.jsx)(r.code,{children:"nullBitmap: Uint8Array | null"})}),"\n",(0,t.jsx)(r.p,{children:"Returns the underlying validity bitmap buffer, if applicable."}),"\n",(0,t.jsxs)(r.p,{children:["Note: Since the validity bitmap is a Uint8Array of bits, it is ",(0,t.jsx)(r.em,{children:"not"})," sliced when you call ",(0,t.jsx)(r.code,{children:"vector.slice()"}),". Instead, the ",(0,t.jsx)(r.code,{children:"vector.offset"})," property is updated on the returned Vector. Therefore, you must factor ",(0,t.jsx)(r.code,{children:"vector.offset"})," into the bit position if you wish to slice or read the null positions manually. See the implementation of ",(0,t.jsx)(r.code,{children:"BaseVector.isValid()"})," for an example of how this is done."]}),"\n",(0,t.jsx)(r.h3,{id:"valueoffsets-int32array--null",children:(0,t.jsx)(r.code,{children:"valueOffsets: Int32Array | null"})}),"\n",(0,t.jsx)(r.p,{children:"Returns the underlying valueOffsets buffer, if applicable. Only the List, Utf8, Binary, and DenseUnion DataTypes will have valueOffsets."}),"\n",(0,t.jsx)(r.h2,{id:"methods",children:"Methods"}),"\n",(0,t.jsx)(r.h3,{id:"clonedata-datar-children-vectorr",children:(0,t.jsx)(r.code,{children:"clone(data: Data<R>, children): Vector<R>"})}),"\n",(0,t.jsx)(r.p,{children:"Returns a clone of the current Vector, using the supplied Data and optional children for the new clone. Does not copy any underlying buffers."}),"\n",(0,t.jsx)(r.h3,{id:"concatothers-vectort",children:(0,t.jsx)(r.code,{children:"concat(...others: Vector<T>[])"})}),"\n",(0,t.jsxs)(r.p,{children:["Returns a ",(0,t.jsx)(r.code,{children:"Chunked"})," vector that concatenates this Vector with the supplied other Vectors. Other Vectors must be the same type as this Vector."]}),"\n",(0,t.jsx)(r.h3,{id:"slicebegin-number-end-number",children:(0,t.jsx)(r.code,{children:"slice(begin?: number, end?: number)"})}),"\n",(0,t.jsxs)(r.p,{children:["Returns a zero-copy slice of this Vector. The begin and end arguments are handled the same way as JS' ",(0,t.jsx)(r.code,{children:"Array.prototype.slice"}),"; they are clamped between 0 and ",(0,t.jsx)(r.code,{children:"vector.length"})," and wrap around when negative, e.g. ",(0,t.jsx)(r.code,{children:"slice(-1, 5)"})," or ",(0,t.jsx)(r.code,{children:"slice(5, -1)"})]}),"\n",(0,t.jsx)(r.h3,{id:"isvalid",children:(0,t.jsx)(r.code,{children:"isValid()"})}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"vector.isValid(index: number): boolean\n"})}),"\n",(0,t.jsxs)(r.p,{children:["Returns ",(0,t.jsx)(r.code,{children:"true"})," the supplied index is valid in the underlying validity bitmap."]}),"\n",(0,t.jsx)(r.h3,{id:"getchildat",children:(0,t.jsx)(r.code,{children:"getChildAt()"})}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"vector.getChildAt<R extends DataType = any>(index: number): Vector<R> | null\n"})}),"\n",(0,t.jsx)(r.p,{children:"Returns the inner Vector child if the DataType is one of the nested types such as Map or Struct."}),"\n",(0,t.jsx)(r.h3,{id:"tojson",children:(0,t.jsx)(r.code,{children:"toJSON()"})}),"\n",(0,t.jsx)(r.p,{children:"Returns a dense JS Array of the Vector values, with null sentinels in-place."})]})}function h(e={}){const{wrapper:r}={...(0,i.a)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(a,{...e})}):a(e)}},11151:(e,r,n)=>{n.d(r,{Z:()=>c,a:()=>l});var t=n(67294);const i={},d=t.createContext(i);function l(e){const r=t.useContext(d);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function c(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:l(e.components),t.createElement(d.Provider,{value:r},e.children)}}}]);