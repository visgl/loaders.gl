"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[2302],{59813:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>l,contentTitle:()=>a,default:()=>u,frontMatter:()=>i,metadata:()=>o,toc:()=>d});var t=s(85893),n=s(11151);const i={},a="Overview",o={id:"modules/textures/README",title:"Overview",description:"The @loaders.gl/textures module contains loaders for compressed textures. More specifically it contains loaders and writers for compressed texture container formats, including KTX, DDS and PVR. It also supports supercompressed Basis textures.",source:"@site/../docs/modules/textures/README.md",sourceDirName:"modules/textures",slug:"/modules/textures/",permalink:"/docs/modules/textures/",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/textures/README.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"tile-converter-bundle",permalink:"/docs/modules/tile-converter/api-reference/tile-converter-bundle"},next:{title:"loadImage",permalink:"/docs/modules/textures/api-reference/load-image"}},l={},d=[{value:"Installation",id:"installation",level:2},{value:"API",id:"api",level:2},{value:"Return Types",id:"return-types",level:2},{value:"Texture APIs",id:"texture-apis",level:2},{value:"Attributions",id:"attributions",level:2}];function c(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,n.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.h1,{id:"overview",children:"Overview"}),"\n",(0,t.jsx)("p",{class:"badges",children:(0,t.jsx)("img",{src:"https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square",alt:"From-v3.0"})}),"\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.code,{children:"@loaders.gl/textures"})," module contains loaders for compressed textures. More specifically it contains loaders and writers for compressed texture ",(0,t.jsx)(r.strong,{children:"container"})," formats, including KTX, DDS and PVR. It also supports supercompressed Basis textures."]}),"\n",(0,t.jsx)(r.p,{children:'Note that a texture is more complex than an image. A texture typically has many subimages. A texture can represent a single logical image but can also be a texture cube, a texture array etc representing many logical images. In addition, each "image" typically has many mipmap levels.'}),"\n",(0,t.jsx)(r.p,{children:"In addition, in compressed textures each mipmap image is compressed opaquely into a format that can only be understood by certain GPUs."}),"\n",(0,t.jsx)(r.p,{children:"Basis encoded textures are super compressed. A more recent addition, they can be efficiently transcoded on the client into actual compressed texture formats appropriate for each device and are therefore quite convenient to use."}),"\n",(0,t.jsx)(r.h2,{id:"installation",children:"Installation"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-bash",children:"npm install @loaders.gl/textures\nnpm install @loaders.gl/core\n"})}),"\n",(0,t.jsx)(r.h2,{id:"api",children:"API"}),"\n",(0,t.jsxs)(r.table,{children:[(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Loader"}),(0,t.jsx)(r.th,{children:"Description"})]})}),(0,t.jsx)(r.tbody,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.a,{href:"/docs/modules/textures/api-reference/basis-loader",children:(0,t.jsx)(r.code,{children:"BasisLoader"})})}),(0,t.jsx)(r.td,{})]})})]}),"\n",(0,t.jsx)(r.h2,{id:"return-types",children:"Return Types"}),"\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.code,{children:"BasisLoader"})," returns Array of Array of ArrayBuffer"]}),"\n",(0,t.jsxs)(r.p,{children:["See ",(0,t.jsx)(r.a,{href:"/docs/modules/images/api-reference/image-loader",children:(0,t.jsx)(r.code,{children:"BasisLoader"})})," for more details on options etc."]}),"\n",(0,t.jsx)(r.h2,{id:"texture-apis",children:"Texture APIs"}),"\n",(0,t.jsx)(r.p,{children:'The textures API offers functions to load "composite" images for WebGL textures, cube textures and image mip levels.'}),"\n",(0,t.jsxs)(r.p,{children:["These functions take a ",(0,t.jsx)(r.code,{children:"getUrl"}),' parameter that enables the app to supply the url for each "sub-image", and return a single promise enabling applications to for instance load all the faces of a cube texture, with one image for each mip level for each face in a single async operation.']}),"\n",(0,t.jsxs)(r.table,{children:[(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Function"}),(0,t.jsx)(r.th,{children:"Description"})]})}),(0,t.jsxs)(r.tbody,{children:[(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.a,{href:"/docs/modules/textures/api-reference/load-image",children:(0,t.jsx)(r.code,{children:"loadImage"})})}),(0,t.jsx)(r.td,{children:"Load a single image"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.a,{href:"/docs/modules/textures/api-reference/load-image-array",children:(0,t.jsx)(r.code,{children:"loadImageArray"})})}),(0,t.jsxs)(r.td,{children:["Load an array of images, e.g. for a ",(0,t.jsx)(r.code,{children:"Texture2DArray"})," or ",(0,t.jsx)(r.code,{children:"Texture3D"})]})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.a,{href:"/docs/modules/textures/api-reference/load-image-cube",children:(0,t.jsx)(r.code,{children:"loadImageCube"})})}),(0,t.jsx)(r.td,{children:"Load a map of 6 images for the faces of a cube map, or a map of 6 arrays of images for the mip levels of the 6 faces."})]})]})]}),"\n",(0,t.jsx)(r.p,{children:"As with all loaders.gl functions, while these functions are intended for use in WebGL applications, they do not call any WebGL functions, and do not actually create any WebGL textures.."}),"\n",(0,t.jsx)(r.h2,{id:"attributions",children:"Attributions"}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:["The ",(0,t.jsx)(r.code,{children:"CompressedTextureLoader"})," was forked from ",(0,t.jsx)(r.a,{href:"https://github.com/tsherif/picogl.js/blob/master/examples/utils/utils.js",children:"PicoGL"}),", Copyright (c) 2017 Tarek Sherif, The MIT License (MIT)"]}),"\n",(0,t.jsxs)(r.li,{children:["The ",(0,t.jsx)(r.code,{children:"CompressedTextureWriter"})," is a wrapper around @TimvanScherpenzeel's ",(0,t.jsx)(r.a,{href:"https://github.com/TimvanScherpenzeel/texture-compressor",children:(0,t.jsx)(r.code,{children:"texture-compressor"})})," utility (MIT licensed)."]}),"\n"]})]})}function u(e={}){const{wrapper:r}={...(0,n.a)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(c,{...e})}):c(e)}},11151:(e,r,s)=>{s.d(r,{Z:()=>o,a:()=>a});var t=s(67294);const n={},i=t.createContext(n);function a(e){const r=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function o(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:a(e.components),t.createElement(i.Provider,{value:r},e.children)}}}]);