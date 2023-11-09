"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[2737],{90887:(e,t,l)=>{l.r(t),l.d(t,{assets:()=>f,contentTitle:()=>r,default:()=>i,frontMatter:()=>u,metadata:()=>d,toc:()=>s});var a=l(85893),n=l(11151);const u={},r="Data",d={id:"arrowjs/api-reference/data",title:"Data",description:"This documentation reflects Arrow JS v4.0. Needs to be updated for the new Arrow API in v9.0 +.",source:"@site/../docs/arrowjs/api-reference/data.md",sourceDirName:"arrowjs/api-reference",slug:"/arrowjs/api-reference/data",permalink:"/docs/arrowjs/api-reference/data",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/api-reference/data.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Apache Arrow JavaScript API Reference",permalink:"/docs/arrowjs/api-reference/"},next:{title:"Dictionary",permalink:"/docs/arrowjs/api-reference/dictionary"}},f={},s=[{value:"Fields",id:"fields",level:2},{value:"Static Methods",id:"static-methods",level:2},{value:"<code>Data.Null&lt;T extends Null&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer) : Data",id:"datanullt-extends-nulltype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer--data",level:3},{value:"<code>Data.Int&lt;T extends Int&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: <code>DataBuffer&lt;T&gt;</code>) : Data",id:"dataintt-extends-inttype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",level:3},{value:"<code>Data.Dictionary&lt;T extends Dictionary&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: <code>DataBuffer&lt;T&gt;</code>) : Data",id:"datadictionaryt-extends-dictionarytype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",level:3},{value:"<code>Data.Float&lt;T extends Float&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: <code>DataBuffer&lt;T&gt;</code>) : Data",id:"datafloatt-extends-floattype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",level:3},{value:"<code>Data.Bool&lt;T extends Bool&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: <code>DataBuffer&lt;T&gt;</code>) : Data",id:"databoolt-extends-booltype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",level:3},{value:"<code>Data.Decimal&lt;T extends Decimal&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: <code>DataBuffer&lt;T&gt;</code>) : Data",id:"datadecimalt-extends-decimaltype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",level:3},{value:"<code>Data.Date&lt;T extends Date_&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: <code>DataBuffer&lt;T&gt;</code>) : Data",id:"datadatet-extends-date_type-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",level:3},{value:"<code>Data.Time&lt;T extends Time&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: <code>DataBuffer&lt;T&gt;</code>) : Data",id:"datatimet-extends-timetype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",level:3},{value:"<code>Data.Timestamp&lt;T extends Timestamp&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: <code>DataBuffer&lt;T&gt;</code>) : Data",id:"datatimestampt-extends-timestamptype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",level:3},{value:"<code>Data.Interval&lt;T extends Interval&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: <code>DataBuffer&lt;T&gt;</code>) : Data",id:"dataintervalt-extends-intervaltype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",level:3},{value:"<code>Data.FixedSizeBinary&lt;T extends FixedSizeBinary&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: <code>DataBuffer&lt;T&gt;</code>) : Data",id:"datafixedsizebinaryt-extends-fixedsizebinarytype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",level:3},{value:"<code>Data.Binary&lt;T extends Binary&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, valueOffsets: ValueOffsetsBuffer, data: Uint8Array) : Data",id:"databinaryt-extends-binarytype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-valueoffsets-valueoffsetsbuffer-data-uint8array--data",level:3},{value:"<code>Data.Utf8&lt;T extends Utf8&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, valueOffsets: ValueOffsetsBuffer, data: Uint8Array) : Data",id:"datautf8t-extends-utf8type-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-valueoffsets-valueoffsetsbuffer-data-uint8array--data",level:3},{value:"<code>Data.List&lt;T extends List&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, valueOffsets: ValueOffsetsBuffer, child: <code>Data&lt;T[&#39;valueType&#39;]&gt; | Vector&lt;T[&#39;valueType&#39;]&gt;</code>) : Data",id:"datalistt-extends-listtype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-valueoffsets-valueoffsetsbuffer-child-datatvaluetype--vectortvaluetype--data",level:3},{value:"<code>Data.FixedSizeList&lt;T extends FixedSizeList&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, child: Data | Vector) : Data",id:"datafixedsizelistt-extends-fixedsizelisttype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-child-data--vector--data",level:3},{value:"<code>Data.Struct&lt;T extends Struct&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, children: (Data | Vector)[]) : Data",id:"datastructt-extends-structtype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-children-data--vector--data",level:3},{value:"<code>Data.Map&lt;T extends Map_&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, children: <code>(Data | Vector)[])</code> : Data",id:"datamapt-extends-map_type-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-children-data--vector--data",level:3},{value:"<code>Data.Union&lt;T extends SparseUnion&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, typeIds: TypeIdsBuffer, children: <code>(Data | Vector)[])</code> : Data",id:"datauniont-extends-sparseuniontype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-typeids-typeidsbuffer-children-data--vector--data",level:3},{value:"<code>Data.Union&lt;T extends DenseUnion&gt;</code>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, typeIds: TypeIdsBuffer, valueOffsets: ValueOffsetsBuffer, children: <code>(Data | Vector)[])</code> : Data",id:"datauniont-extends-denseuniontype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-typeids-typeidsbuffer-valueoffsets-valueoffsetsbuffer-children-data--vector--data",level:3},{value:"Methods",id:"methods",level:2},{value:"constructor(type: T, offset: Number, length: Number, nullCount?: Number, buffers?: <code>Partial&lt;Buffers&lt;T&gt;</code>&gt; | <code>Data&lt;T&gt;</code>, childData?: (Data | Vector)[]);",id:"constructortype-t-offset-number-length-number-nullcount-number-buffers-partialbufferst--datat-childdata-data--vector",level:3},{value:"clone(type: DataType, offset?: Number, length?: Number, nullCount?: Number, buffers?: <code>Buffers&lt;R&gt;</code>, childData?: (Data | Vector)[]) : Data;",id:"clonetype-datatype-offset-number-length-number-nullcount-number-buffers-buffersr-childdata-data--vector--data",level:3},{value:"slice(offset: Number, length: Number) : Data",id:"sliceoffset-number-length-number--data",level:3}];function o(e){const t={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",p:"p",...(0,n.a)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.h1,{id:"data",children:"Data"}),"\n",(0,a.jsxs)(t.blockquote,{children:["\n",(0,a.jsx)(t.p,{children:"This documentation reflects Arrow JS v4.0. Needs to be updated for the new Arrow API in v9.0 +."}),"\n"]}),"\n",(0,a.jsxs)(t.p,{children:["Untyped storage backing for ",(0,a.jsx)(t.code,{children:"Vector"}),"."]}),"\n",(0,a.jsxs)(t.p,{children:["Can be thought of as array of ",(0,a.jsx)(t.code,{children:"ArrayBuffer"})," instances."]}),"\n",(0,a.jsx)(t.p,{children:"Also contains slice offset (including null bitmaps)."}),"\n",(0,a.jsx)(t.h2,{id:"fields",children:"Fields"}),"\n",(0,a.jsx)(t.p,{children:"readonly type: T;"}),"\n",(0,a.jsx)(t.p,{children:"readonly length: Number;"}),"\n",(0,a.jsx)(t.p,{children:"readonly offset: Number;"}),"\n",(0,a.jsx)(t.p,{children:"readonly stride: Number;"}),"\n",(0,a.jsx)(t.p,{children:"readonly childData: Data[];"}),"\n",(0,a.jsxs)(t.p,{children:["readonly values: ",(0,a.jsx)(t.code,{children:"Buffers<T>"}),"[BufferType.DATA];"]}),"\n",(0,a.jsxs)(t.p,{children:["readonly typeIds: ",(0,a.jsx)(t.code,{children:"Buffers<T>"}),"[BufferType.TYPE];"]}),"\n",(0,a.jsxs)(t.p,{children:["readonly nullBitmap: ",(0,a.jsx)(t.code,{children:"Buffers<T>"}),"[BufferType.VALIDITY];"]}),"\n",(0,a.jsxs)(t.p,{children:["readonly valueOffsets: ",(0,a.jsx)(t.code,{children:"Buffers<T>"}),"[BufferType.OFFSET];"]}),"\n",(0,a.jsx)(t.p,{children:"readonly ArrayType: any;"}),"\n",(0,a.jsx)(t.p,{children:"readonly typeId: T['TType'];"}),"\n",(0,a.jsxs)(t.p,{children:["readonly buffers: ",(0,a.jsx)(t.code,{children:"Buffers<T>"}),";"]}),"\n",(0,a.jsx)(t.p,{children:"readonly nullCount: Number;"}),"\n",(0,a.jsx)(t.h2,{id:"static-methods",children:"Static Methods"}),"\n",(0,a.jsx)(t.p,{children:"Convenience methods for creating Data instances for each of the Arrow Vector types."}),"\n",(0,a.jsxs)(t.h3,{id:"datanullt-extends-nulltype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer--data",children:[(0,a.jsx)(t.code,{children:"Data.Null<T extends Null>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer) : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"dataintt-extends-inttype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",children:[(0,a.jsx)(t.code,{children:"Data.Int<T extends Int>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: ",(0,a.jsx)(t.code,{children:"DataBuffer<T>"}),") : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datadictionaryt-extends-dictionarytype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",children:[(0,a.jsx)(t.code,{children:"Data.Dictionary<T extends Dictionary>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: ",(0,a.jsx)(t.code,{children:"DataBuffer<T>"}),") : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datafloatt-extends-floattype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",children:[(0,a.jsx)(t.code,{children:"Data.Float<T extends Float>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: ",(0,a.jsx)(t.code,{children:"DataBuffer<T>"}),") : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"databoolt-extends-booltype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",children:[(0,a.jsx)(t.code,{children:"Data.Bool<T extends Bool>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: ",(0,a.jsx)(t.code,{children:"DataBuffer<T>"}),") : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datadecimalt-extends-decimaltype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",children:[(0,a.jsx)(t.code,{children:"Data.Decimal<T extends Decimal>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: ",(0,a.jsx)(t.code,{children:"DataBuffer<T>"}),") : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datadatet-extends-date_type-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",children:[(0,a.jsx)(t.code,{children:"Data.Date<T extends Date_>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: ",(0,a.jsx)(t.code,{children:"DataBuffer<T>"}),") : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datatimet-extends-timetype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",children:[(0,a.jsx)(t.code,{children:"Data.Time<T extends Time>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: ",(0,a.jsx)(t.code,{children:"DataBuffer<T>"}),") : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datatimestampt-extends-timestamptype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",children:[(0,a.jsx)(t.code,{children:"Data.Timestamp<T extends Timestamp>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: ",(0,a.jsx)(t.code,{children:"DataBuffer<T>"}),") : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"dataintervalt-extends-intervaltype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",children:[(0,a.jsx)(t.code,{children:"Data.Interval<T extends Interval>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: ",(0,a.jsx)(t.code,{children:"DataBuffer<T>"}),") : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datafixedsizebinaryt-extends-fixedsizebinarytype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-data-databuffert--data",children:[(0,a.jsx)(t.code,{children:"Data.FixedSizeBinary<T extends FixedSizeBinary>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: ",(0,a.jsx)(t.code,{children:"DataBuffer<T>"}),") : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"databinaryt-extends-binarytype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-valueoffsets-valueoffsetsbuffer-data-uint8array--data",children:[(0,a.jsx)(t.code,{children:"Data.Binary<T extends Binary>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, valueOffsets: ValueOffsetsBuffer, data: Uint8Array) : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datautf8t-extends-utf8type-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-valueoffsets-valueoffsetsbuffer-data-uint8array--data",children:[(0,a.jsx)(t.code,{children:"Data.Utf8<T extends Utf8>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, valueOffsets: ValueOffsetsBuffer, data: Uint8Array) : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datalistt-extends-listtype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-valueoffsets-valueoffsetsbuffer-child-datatvaluetype--vectortvaluetype--data",children:[(0,a.jsx)(t.code,{children:"Data.List<T extends List>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, valueOffsets: ValueOffsetsBuffer, child: ",(0,a.jsx)(t.code,{children:"Data<T['valueType']> | Vector<T['valueType']>"}),") : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datafixedsizelistt-extends-fixedsizelisttype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-child-data--vector--data",children:[(0,a.jsx)(t.code,{children:"Data.FixedSizeList<T extends FixedSizeList>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, child: Data | Vector) : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datastructt-extends-structtype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-children-data--vector--data",children:[(0,a.jsx)(t.code,{children:"Data.Struct<T extends Struct>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, children: (Data | Vector)[]) : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datamapt-extends-map_type-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-children-data--vector--data",children:[(0,a.jsx)(t.code,{children:"Data.Map<T extends Map_>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, children: ",(0,a.jsx)(t.code,{children:"(Data | Vector)[])"})," : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datauniont-extends-sparseuniontype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-typeids-typeidsbuffer-children-data--vector--data",children:[(0,a.jsx)(t.code,{children:"Data.Union<T extends SparseUnion>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, typeIds: TypeIdsBuffer, children: ",(0,a.jsx)(t.code,{children:"(Data | Vector)[])"})," : Data"]}),"\n",(0,a.jsxs)(t.h3,{id:"datauniont-extends-denseuniontype-t-offset-number-length-number-nullcount-number-nullbitmap-nullbuffer-typeids-typeidsbuffer-valueoffsets-valueoffsetsbuffer-children-data--vector--data",children:[(0,a.jsx)(t.code,{children:"Data.Union<T extends DenseUnion>"}),"(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, typeIds: TypeIdsBuffer, valueOffsets: ValueOffsetsBuffer, children: ",(0,a.jsx)(t.code,{children:"(Data | Vector)[])"})," : Data"]}),"\n",(0,a.jsx)(t.p,{children:"}"}),"\n",(0,a.jsx)(t.h2,{id:"methods",children:"Methods"}),"\n",(0,a.jsxs)(t.h3,{id:"constructortype-t-offset-number-length-number-nullcount-number-buffers-partialbufferst--datat-childdata-data--vector",children:["constructor(type: T, offset: Number, length: Number, nullCount?: Number, buffers?: ",(0,a.jsx)(t.code,{children:"Partial<Buffers<T>"}),"> | ",(0,a.jsx)(t.code,{children:"Data<T>"}),", childData?: (Data | Vector)[]);"]}),"\n",(0,a.jsxs)(t.h3,{id:"clonetype-datatype-offset-number-length-number-nullcount-number-buffers-buffersr-childdata-data--vector--data",children:["clone(type: DataType, offset?: Number, length?: Number, nullCount?: Number, buffers?: ",(0,a.jsx)(t.code,{children:"Buffers<R>"}),", childData?: (Data | Vector)[]) : Data;"]}),"\n",(0,a.jsx)(t.h3,{id:"sliceoffset-number-length-number--data",children:"slice(offset: Number, length: Number) : Data"})]})}function i(e={}){const{wrapper:t}={...(0,n.a)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(o,{...e})}):o(e)}},11151:(e,t,l)=>{l.d(t,{Z:()=>d,a:()=>r});var a=l(67294);const n={},u=a.createContext(n);function r(e){const t=a.useContext(u);return a.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function d(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:r(e.components),a.createElement(u.Provider,{value:t},e.children)}}}]);