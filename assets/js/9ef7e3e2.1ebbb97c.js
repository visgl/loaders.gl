"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[8033],{34326:(e,s,i)=>{i.r(s),i.d(s,{assets:()=>l,contentTitle:()=>r,default:()=>h,frontMatter:()=>t,metadata:()=>d,toc:()=>o});var n=i(74848),a=i(28453);const t={},r="Image Utilities",d={id:"modules/images/api-reference/parsed-image-api",title:"Image Utilities",description:"A small set of image utility functions functions intended to help write image handling code that works across platforms.",source:"@site/../docs/modules/images/api-reference/parsed-image-api.md",sourceDirName:"modules/images/api-reference",slug:"/modules/images/api-reference/parsed-image-api",permalink:"/docs/modules/images/api-reference/parsed-image-api",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/images/api-reference/parsed-image-api.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Overview",permalink:"/docs/modules/images/"},next:{title:"Binary Image Utilities",permalink:"/docs/modules/images/api-reference/binary-image-api"}},l={},o=[{value:"Usage",id:"usage",level:2},{value:"Functions",id:"functions",level:2},{value:"getSupportedImageTypes()",id:"getsupportedimagetypes",level:3},{value:"isImageTypeSupported()",id:"isimagetypesupported",level:3},{value:"isImage()",id:"isimage",level:3},{value:"getImageType()",id:"getimagetype",level:3},{value:"getImageData()",id:"getimagedata",level:3}];function c(e){const s={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,a.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(s.h1,{id:"image-utilities",children:"Image Utilities"}),"\n",(0,n.jsx)(s.p,{children:"A small set of image utility functions functions intended to help write image handling code that works across platforms."}),"\n",(0,n.jsxs)(s.p,{children:["Background: The image returned by the ",(0,n.jsx)(s.a,{href:"/docs/modules/images/api-reference/image-loader",children:(0,n.jsx)(s.code,{children:"ImageLoader"})})," depends on the environment, i.e. whether the application is running in a new or old browser, or under Node.js."]}),"\n",(0,n.jsx)(s.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsxs)(s.p,{children:["E.g., the ",(0,n.jsx)(s.code,{children:"getImageData"})," method enables the application to get width, height and pixel data from an image returned by the ",(0,n.jsx)(s.code,{children:"ImageLoader"})," in a platform independent way:"]}),"\n",(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-typescript",children:"import {ImageLoader, getImageSize, getImageData} from `@loaders.gl/images`;\nimport {load} from `@loaders.gl/core`;\n\nconst image = await load(URL, ImageLoader);\n\n// Get an image data object regardless of whether the image is already an `Image`, `ImageBitmap` or already an image data object\nconst imageData = getImageData(image);\nconsole.log(imageData.width, imageData.height, imageData.data);\n"})}),"\n",(0,n.jsx)(s.h2,{id:"functions",children:"Functions"}),"\n",(0,n.jsx)(s.h3,{id:"getsupportedimagetypes",children:"getSupportedImageTypes()"}),"\n",(0,n.jsx)("p",{class:"badges",children:(0,n.jsx)("img",{src:"https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square",alt:"From-3.4"})}),"\n",(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-typescript",children:"getSupportedImageTypes(): Promise<Set<string>>\n"})}),"\n",(0,n.jsxs)(s.p,{children:["Returns a promise that resolves to a ",(0,n.jsx)(s.code,{children:"Set"})," of MIME types that ",(0,n.jsx)(s.code,{children:"@loaders.gl/images"})," can parse on the current platform (depends on the current browser, or whether the app is running under Node.js)."]}),"\n",(0,n.jsxs)(s.blockquote,{children:["\n",(0,n.jsx)(s.p,{children:"This function is asynchronous which can be inconvenient to use. However, for technical reasons, asynchronous testing of supported image formats is significantly more reliable and is recommended in browsers."}),"\n",(0,n.jsx)(s.p,{children:"A small caveat is that some formats like AVIF and WebP support different options in terms of bit-depths and packing and a specific browser may not support all combinations, this function just tests for basic image support."}),"\n"]}),"\n",(0,n.jsx)(s.h3,{id:"isimagetypesupported",children:"isImageTypeSupported()"}),"\n",(0,n.jsx)("p",{class:"badges",children:(0,n.jsx)("img",{src:"https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square",alt:"From-3.4"})}),"\n",(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-typescript",children:"isImageTypeSupported(mimeType : string): boolean\n"})}),"\n",(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:[(0,n.jsx)(s.code,{children:"mimeType"}),": value to test"]}),"\n"]}),"\n",(0,n.jsx)(s.p,{children:"Synchronously checks if an image type is supported."}),"\n",(0,n.jsxs)(s.p,{children:["Returns ",(0,n.jsx)(s.code,{children:"true"})," if ",(0,n.jsx)(s.code,{children:"mimeType"})," is one of the MIME types that ",(0,n.jsx)(s.code,{children:"@loaders.gl/images"})," can use on the current platform (depends on browser, or whether running under Node.js)."]}),"\n",(0,n.jsxs)(s.blockquote,{children:["\n",(0,n.jsxs)(s.p,{children:["At this time, run-time checks for some recently added image formats such as AVIF (and to a lesser extent, WEBP) can not reliably be done in browsers using synchronous techniques. If your code allows for asynchronous calls, use ",(0,n.jsx)(s.code,{children:"getSupportedImageTypes()"})," for the most accurate results."]}),"\n"]}),"\n",(0,n.jsx)(s.h3,{id:"isimage",children:"isImage()"}),"\n",(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-typescript",children:"isImage(image : any): boolean\n"})}),"\n",(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:[(0,n.jsx)(s.code,{children:"image"}),": An image returned by an image category loader, such as ",(0,n.jsx)(s.code,{children:"ImageLoader"})]}),"\n"]}),"\n",(0,n.jsxs)(s.p,{children:["Returns ",(0,n.jsx)(s.code,{children:"true"})," if ",(0,n.jsx)(s.code,{children:"image"})," is one of the types that ",(0,n.jsx)(s.code,{children:"@loaders.gl/images"})," can return."]}),"\n",(0,n.jsx)(s.h3,{id:"getimagetype",children:"getImageType()"}),"\n",(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-typescript",children:"getImageType(image : any): 'imagebitmap' | 'image' | 'data'\n"})}),"\n",(0,n.jsxs)(s.p,{children:["Returns the type of an image. Can be used when loading images with the default setting of ",(0,n.jsx)(s.code,{children:"options.type: 'auto'"})," to discover what type was actually returned."]}),"\n",(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:[(0,n.jsx)(s.code,{children:"image"}),": An image returned by an image category loader, such as ",(0,n.jsx)(s.code,{children:"ImageLoader"})]}),"\n"]}),"\n",(0,n.jsx)(s.p,{children:"Returns"}),"\n",(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsx)(s.li,{children:"a string describing the type of the image."}),"\n"]}),"\n",(0,n.jsx)(s.p,{children:"Throws"}),"\n",(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:["if ",(0,n.jsx)(s.code,{children:"image"})," is not of a recognized type."]}),"\n"]}),"\n",(0,n.jsx)(s.p,{children:"The following image types are distinguished"}),"\n",(0,n.jsxs)(s.table,{children:[(0,n.jsx)(s.thead,{children:(0,n.jsxs)(s.tr,{children:[(0,n.jsx)(s.th,{children:"Image Type"}),(0,n.jsx)(s.th,{children:"JavaScript Type"}),(0,n.jsx)(s.th,{children:"Description"})]})}),(0,n.jsxs)(s.tbody,{children:[(0,n.jsxs)(s.tr,{children:[(0,n.jsx)(s.td,{children:(0,n.jsx)(s.code,{children:"'data'"})}),(0,n.jsxs)(s.td,{children:["A simple JavaScript object with ",(0,n.jsx)(s.code,{children:"data"}),", ",(0,n.jsx)(s.code,{children:"width"}),", ",(0,n.jsx)(s.code,{children:"height"})," etc. fields.."]}),(0,n.jsxs)(s.td,{children:["Useful when additional manipulation of the image data is desired. Always used in Node.js since ",(0,n.jsx)(s.code,{children:"ImageBitmap"})," and ",(0,n.jsx)(s.code,{children:"Image"})," types are not available."]})]}),(0,n.jsxs)(s.tr,{children:[(0,n.jsx)(s.td,{children:(0,n.jsx)(s.code,{children:"'imagebitmap'"})}),(0,n.jsx)(s.td,{children:(0,n.jsx)(s.a,{href:"https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap",children:(0,n.jsx)(s.code,{children:"ImageBitmap"})})}),(0,n.jsx)(s.td,{children:"The preferred new HTML5 image class that is optimized for fast rendering (avialble in modern browsers only)"})]}),(0,n.jsxs)(s.tr,{children:[(0,n.jsx)(s.td,{children:(0,n.jsx)(s.code,{children:"'image'"})}),(0,n.jsxs)(s.td,{children:[(0,n.jsx)(s.a,{href:"https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image",children:(0,n.jsx)(s.code,{children:"Image"})})," (aka ",(0,n.jsx)(s.code,{children:"HTMLImageElement"}),")"]}),(0,n.jsx)(s.td,{children:"Fallback, supported in all browsers (but less performant and flexible than ImageBitmap)"})]})]})]}),"\n",(0,n.jsx)(s.h3,{id:"getimagedata",children:"getImageData()"}),"\n",(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-typescript",children:"getImageData(image : any): Object\n"})}),"\n",(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:[(0,n.jsx)(s.code,{children:"image"}),": An image returned by an image category loader, such as ",(0,n.jsx)(s.code,{children:"ImageLoader"})]}),"\n"]}),"\n",(0,n.jsx)(s.p,{children:"Returns and image data object with the following fields"}),"\n",(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:[(0,n.jsx)(s.code,{children:"data"})," typed array containing the pixels of the image"]}),"\n",(0,n.jsx)(s.li,{children:(0,n.jsx)(s.code,{children:"width"})}),"\n",(0,n.jsx)(s.li,{children:(0,n.jsx)(s.code,{children:"height"})}),"\n"]}),"\n",(0,n.jsx)(s.p,{children:"Throws"}),"\n",(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:["if ",(0,n.jsx)(s.code,{children:"image"})," is not of a recognized type."]}),"\n"]})]})}function h(e={}){const{wrapper:s}={...(0,a.R)(),...e.components};return s?(0,n.jsx)(s,{...e,children:(0,n.jsx)(c,{...e})}):c(e)}},28453:(e,s,i)=>{i.d(s,{R:()=>r,x:()=>d});var n=i(96540);const a={},t=n.createContext(a);function r(e){const s=n.useContext(t);return n.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function d(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:r(e.components),n.createElement(t.Provider,{value:s},e.children)}}}]);