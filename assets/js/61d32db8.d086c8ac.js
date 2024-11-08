"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[803],{43243:(e,r,a)=>{a.r(r),a.d(r,{assets:()=>l,contentTitle:()=>o,default:()=>m,frontMatter:()=>s,metadata:()=>d,toc:()=>t});var n=a(62540),i=a(43023);const s={},o="loadImages",d={id:"modules/textures/api-reference/load-image-array",title:"loadImages",description:"A function that loads an array of images. Primarily intended for loading:",source:"@site/../docs/modules/textures/api-reference/load-image-array.md",sourceDirName:"modules/textures/api-reference",slug:"/modules/textures/api-reference/load-image-array",permalink:"/docs/modules/textures/api-reference/load-image-array",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/textures/api-reference/load-image-array.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"loadImage",permalink:"/docs/modules/textures/api-reference/load-image"},next:{title:"loadCubeImages",permalink:"/docs/modules/textures/api-reference/load-image-cube"}},l={},t=[{value:"Usage",id:"usage",level:2},{value:"getUrl Callback Parameters",id:"geturl-callback-parameters",level:2},{value:"loadImageArray(count : Number | String, getUrl : <code>({index}) =&gt; String</code>, options? : Object) : <code>image[] | image[][]</code>",id:"loadimagearraycount--number--string-geturl--index--string-options--object--image--image",level:3},{value:"Options",id:"options",level:2},{value:"Remarks",id:"remarks",level:2}];function c(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,i.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.header,{children:(0,n.jsx)(r.h1,{id:"loadimages",children:"loadImages"})}),"\n",(0,n.jsx)(r.p,{children:"A function that loads an array of images. Primarily intended for loading:"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:["an array of images for a WebGL ",(0,n.jsx)(r.code,{children:"TEXTURE_2D_ARRAY"})," or ",(0,n.jsx)(r.code,{children:"TEXTURE_3D"})," textures"]}),"\n",(0,n.jsxs)(r.li,{children:["an array of images representing mip levels of a single WebGL ",(0,n.jsx)(r.code,{children:"TEXTURE_2D"})," texture or one ",(0,n.jsx)(r.code,{children:"TEXTURE_CUBE"})," face."]}),"\n"]}),"\n",(0,n.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsx)(r.p,{children:"Loading an array of images"}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-typescript",children:"import '@loaders.gl/polyfills'; // only needed for Node.js support\nimport {loadImageArray} from `@loaders.gl/images`;\n\nconst images = await loadImageArray(count, ({index}) => `filename-${index}`);\n\nfor (const image of images) {\n  ...\n}\n"})}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-typescript",children:"import '@loaders.gl/polyfills'; // only needed for Node.js support\nimport {loadImageArray} from `@loaders.gl/images`;\n\nconst images = await loadImageArray(count,  ({index}) => `filename-${index}`, {\n  mipLevels: 'auto'\n});\n\nfor (const imageArray of images) {\n  for (const lodImage of imageArray) {\n    ...\n  }\n}\n"})}),"\n",(0,n.jsx)(r.h2,{id:"geturl-callback-parameters",children:"getUrl Callback Parameters"}),"\n",(0,n.jsxs)(r.p,{children:["the ",(0,n.jsx)(r.code,{children:"getUrl"})," callback will be called for each image with the following parameters:"]}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{children:"Parameter"}),(0,n.jsx)(r.th,{children:"Description"})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"index"})}),(0,n.jsxs)(r.td,{children:["The index of the image being loaded, from ",(0,n.jsx)(r.code,{children:"0"})," to ",(0,n.jsx)(r.code,{children:"count - 1"}),"."]})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"lod"})}),(0,n.jsxs)(r.td,{children:["The mip level image being loaded, from ",(0,n.jsx)(r.code,{children:"0"})," to ",(0,n.jsx)(r.code,{children:"mipLevels - 1"}),"."]})]})]})]}),"\n",(0,n.jsxs)(r.p,{children:["Note: In addition to these values, all ",(0,n.jsx)(r.code,{children:"options"})," passed in to ",(0,n.jsx)(r.code,{children:"loadImageArray"})," are also available in the ",(0,n.jsx)(r.code,{children:"getUrl"})," method."]}),"\n",(0,n.jsxs)(r.h3,{id:"loadimagearraycount--number--string-geturl--index--string-options--object--image--image",children:["loadImageArray(count : Number | String, getUrl : ",(0,n.jsx)(r.code,{children:"({index}) => String"}),", options? : Object) : ",(0,n.jsx)(r.code,{children:"image[] | image[][]"})]}),"\n",(0,n.jsx)(r.p,{children:"Parameters:"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"count"}),": Number of images to load."]}),"\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"getUrl"}),": A function that generates the url for each image, it is called for each image with the ",(0,n.jsx)(r.code,{children:"index"})," of that image."]}),"\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"options"}),": Supports the same options as ",(0,n.jsx)(r.a,{href:"/docs/modules/images/api-reference/image-loader",children:(0,n.jsx)(r.code,{children:"ImageLoader"})}),"."]}),"\n"]}),"\n",(0,n.jsx)(r.p,{children:"Returns"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsx)(r.li,{children:"an array of images (or array of arrays of mip images)"}),"\n"]}),"\n",(0,n.jsx)(r.h2,{id:"options",children:"Options"}),"\n",(0,n.jsxs)(r.p,{children:["Accepts the same options as ",(0,n.jsx)(r.a,{href:"/docs/modules/images/api-reference/image-loader",children:(0,n.jsx)(r.code,{children:"ImageLoader"})}),", and"]}),"\n",(0,n.jsxs)(r.p,{children:["| Option            | Type    | Default | Description |\n| ----------------- | ------- | ------- | ----------- | ------------------------------------------------------ |\n| ",(0,n.jsx)(r.code,{children:"image.mipLevels"})," | ",(0,n.jsx)(r.code,{children:"Number | String"})," | ",(0,n.jsx)(r.code,{children:"0"}),"         | If ",(0,n.jsx)(r.code,{children:"'auto'"})," or non-zero, loads an array of mip images. |"]}),"\n",(0,n.jsxs)(r.p,{children:["Number of mip level images to load: Use ",(0,n.jsx)(r.code,{children:"0"})," to indicate a single image with no mips. Supplying the string ",(0,n.jsx)(r.code,{children:"'auto'"})," will infer the mipLevel from the size of the ",(0,n.jsx)(r.code,{children:"lod"}),"=",(0,n.jsx)(r.code,{children:"0"})," image."]}),"\n",(0,n.jsx)(r.h2,{id:"remarks",children:"Remarks"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:["Returned images can be passed directly to WebGL texture methods. See ",(0,n.jsx)(r.a,{href:"/docs/modules/images/api-reference/image-loader",children:(0,n.jsx)(r.code,{children:"ImageLoader"})})," for details about the type of the returned images."]}),"\n"]})]})}function m(e={}){const{wrapper:r}={...(0,i.R)(),...e.components};return r?(0,n.jsx)(r,{...e,children:(0,n.jsx)(c,{...e})}):c(e)}},43023:(e,r,a)=>{a.d(r,{R:()=>o,x:()=>d});var n=a(63696);const i={},s=n.createContext(i);function o(e){const r=n.useContext(s);return n.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function d(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),n.createElement(s.Provider,{value:r},e.children)}}}]);