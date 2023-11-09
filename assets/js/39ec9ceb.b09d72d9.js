"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[2338],{73264:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>c,contentTitle:()=>i,default:()=>o,frontMatter:()=>s,metadata:()=>l,toc:()=>a});var n=t(85893),d=t(11151);const s={},i="GLType",l={id:"modules/math/api-reference/gl-type",title:"GLType",description:"Helper functions to work with WebGL data type constants.",source:"@site/../docs/modules/math/api-reference/gl-type.md",sourceDirName:"modules/math/api-reference",slug:"/modules/math/api-reference/gl-type",permalink:"/docs/modules/math/api-reference/gl-type",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/math/api-reference/gl-type.md",tags:[],version:"current",frontMatter:{}},c={},a=[{value:"Usage",id:"usage",level:2},{value:"Static Methods",id:"static-methods",level:2},{value:"GLType.fromTypedArray(typedArray: Typed Array | Function) : string",id:"gltypefromtypedarraytypedarray-typed-array--function--string",level:3},{value:"GLType.fromName(name: String): number",id:"gltypefromnamename-string-number",level:3},{value:"GLType.getArrayType(glType: Number) : function",id:"gltypegetarraytypegltype-number--function",level:3},{value:"static GLType.getByteSize(glType: Number) : number",id:"static-gltypegetbytesizegltype-number--number",level:3},{value:"static GLType.validate(glType) : boolean",id:"static-gltypevalidategltype--boolean",level:3},{value:"<code>static GLType.createTypedArray(glType : number, buffer : ArrayBuffer [, byteOffset : number [, length : number]]) : TypedArray</code>",id:"static-gltypecreatetypedarraygltype--number-buffer--arraybuffer--byteoffset--number--length--number--typedarray",level:3}];function h(e){const r={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,d.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.h1,{id:"gltype",children:"GLType"}),"\n",(0,n.jsx)(r.p,{children:"Helper functions to work with WebGL data type constants."}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{children:"WebGL type constant"}),(0,n.jsx)(r.th,{children:"JavaScript Typed Array"}),(0,n.jsx)(r.th,{children:"Notes"})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"GL.FLOAT"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"Float32Array"})}),(0,n.jsx)(r.td,{})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"GL.DOUBLE"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"Float64Array"})}),(0,n.jsx)(r.td,{children:"Not yet directly usable in WebGL/GLSL"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"GL.UNSIGNED_SHORT"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"Uint16Array"})}),(0,n.jsx)(r.td,{})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"GL.UNSIGNED_INT"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"Uint32Array"})}),(0,n.jsx)(r.td,{})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"GL.UNSIGNED_BYTE"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"Uint8Array"})}),(0,n.jsx)(r.td,{})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"GL.UNSIGNED_BYTE"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"Uint8ClampedArray"})}),(0,n.jsx)(r.td,{})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"GL.BYTE"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"Int8Array"})}),(0,n.jsx)(r.td,{})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"GL.SHORT"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"Int16Array"})}),(0,n.jsx)(r.td,{})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"GL.INT"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"Int32Array"})}),(0,n.jsx)(r.td,{})]})]})]}),"\n",(0,n.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-typescript",children:"import {GL, GLType} from '@loaders.gl/math';\n// Returns Int8Array.BYTES_PER_ELEMENT\nvar size = GLType.getSizeInBytes(GL.BYTE);\n"})}),"\n",(0,n.jsx)(r.h2,{id:"static-methods",children:"Static Methods"}),"\n",(0,n.jsx)(r.h3,{id:"gltypefromtypedarraytypedarray-typed-array--function--string",children:"GLType.fromTypedArray(typedArray: Typed Array | Function) : string"}),"\n",(0,n.jsx)(r.p,{children:"Returns the size, in bytes, of the corresponding datatype."}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"glType"})," The component datatype to get the size of."]}),"\n"]}),"\n",(0,n.jsx)(r.p,{children:"Returns"}),"\n",(0,n.jsx)(r.p,{children:"The size in bytes."}),"\n",(0,n.jsx)(r.p,{children:"Throws"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsx)(r.li,{children:"glType is not a valid value."}),"\n"]}),"\n",(0,n.jsx)(r.p,{children:"Gets the component data type for the provided TypedArray instance."}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsx)(r.li,{children:"array The typed array."}),"\n"]}),"\n",(0,n.jsx)(r.p,{children:"Returns"}),"\n",(0,n.jsx)(r.p,{children:"The ComponentDatatype for the provided array, or undefined if the array is not a TypedArray."}),"\n",(0,n.jsx)(r.h3,{id:"gltypefromnamename-string-number",children:"GLType.fromName(name: String): number"}),"\n",(0,n.jsx)(r.p,{children:"Extracts name for glType from array NAME_TO_GL_TYPE"}),"\n",(0,n.jsx)(r.h3,{id:"gltypegetarraytypegltype-number--function",children:"GLType.getArrayType(glType: Number) : function"}),"\n",(0,n.jsx)(r.p,{children:"Returns the constructor of the array"}),"\n",(0,n.jsx)(r.h3,{id:"static-gltypegetbytesizegltype-number--number",children:"static GLType.getByteSize(glType: Number) : number"}),"\n",(0,n.jsx)(r.p,{children:"Returns the size in bytes of one element of the provided WebGL type."}),"\n",(0,n.jsxs)(r.p,{children:["Equivalent to ",(0,n.jsx)(r.code,{children:"GLType.getArrayType(glType).BYTES_PER_ELEMENT"}),"."]}),"\n",(0,n.jsx)(r.h3,{id:"static-gltypevalidategltype--boolean",children:"static GLType.validate(glType) : boolean"}),"\n",(0,n.jsxs)(r.p,{children:["Returns ",(0,n.jsx)(r.code,{children:"true"})," if ",(0,n.jsx)(r.code,{children:"glType"})," is a valid WebGL data type."]}),"\n",(0,n.jsx)(r.h3,{id:"static-gltypecreatetypedarraygltype--number-buffer--arraybuffer--byteoffset--number--length--number--typedarray",children:(0,n.jsx)(r.code,{children:"static GLType.createTypedArray(glType : number, buffer : ArrayBuffer [, byteOffset : number [, length : number]]) : TypedArray"})}),"\n",(0,n.jsx)(r.p,{children:"Creates a typed view of an array of bytes."}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"glType"})," The type of typed array (ArrayBuffer view) to create."]}),"\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"buffer"})," The buffer storage to use for the view."]}),"\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"byteOffset"}),"=",(0,n.jsx)(r.code,{children:"0"})," The offset, in bytes, to the first element in the view."]}),"\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"length"}),"= The number of elements in the view. Defaults to buffer length."]}),"\n"]}),"\n",(0,n.jsx)(r.p,{children:"Returns"}),"\n",(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.code,{children:"Int8Array"}),"|",(0,n.jsx)(r.code,{children:"Uint8Array"}),"|",(0,n.jsx)(r.code,{children:"Int16Array"}),"|",(0,n.jsx)(r.code,{children:"Uint16Array"}),"|",(0,n.jsx)(r.code,{children:"Int32Array"}),"|",(0,n.jsx)(r.code,{children:"Uint32Array"}),"|",(0,n.jsx)(r.code,{children:"Float32Array"}),"|",(0,n.jsx)(r.code,{children:"Float64Array"})," A typed array view of the buffer."]}),"\n",(0,n.jsx)(r.p,{children:"Throws"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"glType"})," is not a valid value."]}),"\n"]})]})}function o(e={}){const{wrapper:r}={...(0,d.a)(),...e.components};return r?(0,n.jsx)(r,{...e,children:(0,n.jsx)(h,{...e})}):h(e)}},11151:(e,r,t)=>{t.d(r,{Z:()=>l,a:()=>i});var n=t(67294);const d={},s=n.createContext(d);function i(e){const r=n.useContext(s);return n.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function l(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(d):e.components||d:i(e.components),n.createElement(s.Provider,{value:r},e.children)}}}]);