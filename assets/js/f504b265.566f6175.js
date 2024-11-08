"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[4267],{4465:(e,i,d)=>{d.r(i),d.d(i,{assets:()=>l,contentTitle:()=>c,default:()=>h,frontMatter:()=>r,metadata:()=>t,toc:()=>o});var s=d(62540),n=d(43023);const r={},c="loadCubeImages",t={id:"modules/textures/api-reference/load-image-cube",title:"loadCubeImages",description:"A function that loads 6 images representing the faces of a cube. Primarily intended for loading images for WebGL GL.TEXTURE_CUBE textures.",source:"@site/../docs/modules/textures/api-reference/load-image-cube.md",sourceDirName:"modules/textures/api-reference",slug:"/modules/textures/api-reference/load-image-cube",permalink:"/docs/modules/textures/api-reference/load-image-cube",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/textures/api-reference/load-image-cube.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"loadImages",permalink:"/docs/modules/textures/api-reference/load-image-array"},next:{title:"Overview",permalink:"/docs/modules/video/"}},l={},o=[{value:"Usage",id:"usage",level:2},{value:"getUrl Callback Parameters",id:"geturl-callback-parameters",level:2},{value:"loadImageCube(getUrl : <code>({face, direction, index}) =&gt; String</code>, options? : Object) : Object",id:"loadimagecubegeturl--face-direction-index--string-options--object--object",level:3},{value:"Options",id:"options",level:2},{value:"Remarks",id:"remarks",level:2}];function a(e){const i={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,n.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(i.header,{children:(0,s.jsx)(i.h1,{id:"loadcubeimages",children:"loadCubeImages"})}),"\n",(0,s.jsxs)(i.p,{children:["A function that loads 6 images representing the faces of a cube. Primarily intended for loading images for WebGL ",(0,s.jsx)(i.code,{children:"GL.TEXTURE_CUBE"})," textures."]}),"\n",(0,s.jsx)(i.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(i.p,{children:"Load images for a cubemap with one image per face"}),"\n",(0,s.jsx)(i.pre,{children:(0,s.jsx)(i.code,{className:"language-typescript",children:"import '@loaders.gl/polyfills'; // only needed for Node.js support\nimport {loadImageCube} from `@loaders.gl/images`;\n\nconst imageCube = await loadImageCube(({direction}) => `diffuse-${direction}.png`);\n\nfor (const face in imageCube) {\n  const image = imageCube[face];\n}\n"})}),"\n",(0,s.jsx)(i.p,{children:"Load images for a cubemap with an array of mip images per face"}),"\n",(0,s.jsx)(i.pre,{children:(0,s.jsx)(i.code,{className:"language-typescript",children:"import '@loaders.gl/polyfills'; // only needed for Node.js support\nimport {loadImageCube} from `@loaders.gl/images`;\n\nconst imageCube = await loadImageCube('mips', ({direction}) => `diffuse-${direction}.png`);\n\nfor (const face in imageCube) {\n  const imageArray = imageCube[face];\n  for (const lodImage of imageArray) {\n    ...\n  }\n}\n"})}),"\n",(0,s.jsx)(i.h2,{id:"geturl-callback-parameters",children:"getUrl Callback Parameters"}),"\n",(0,s.jsxs)(i.p,{children:["The following fields will be supplied as named parameters to the ",(0,s.jsx)(i.code,{children:"getUrl"})," function when loading cube maps:"]}),"\n",(0,s.jsxs)(i.table,{children:[(0,s.jsx)(i.thead,{children:(0,s.jsxs)(i.tr,{children:[(0,s.jsx)(i.th,{children:(0,s.jsx)(i.code,{children:"faceIndex"})}),(0,s.jsx)(i.th,{children:(0,s.jsx)(i.code,{children:"face"})}),(0,s.jsx)(i.th,{children:(0,s.jsx)(i.code,{children:"direction"})}),(0,s.jsx)(i.th,{children:(0,s.jsx)(i.code,{children:"axis"})}),(0,s.jsx)(i.th,{children:(0,s.jsx)(i.code,{children:"sign"})})]})}),(0,s.jsxs)(i.tbody,{children:[(0,s.jsxs)(i.tr,{children:[(0,s.jsx)(i.td,{children:"0"}),(0,s.jsxs)(i.td,{children:[(0,s.jsx)(i.code,{children:"GL.TEXTURE_CUBE_MAP_POSITIVE_X"})," (0x8515)"]}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'right'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'x'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'positive'"})})]}),(0,s.jsxs)(i.tr,{children:[(0,s.jsx)(i.td,{children:"1"}),(0,s.jsxs)(i.td,{children:[(0,s.jsx)(i.code,{children:"GL.TEXTURE_CUBE_MAP_NEGATIVE_X"})," (0x8516)"]}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'left'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'x'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'negative'"})})]}),(0,s.jsxs)(i.tr,{children:[(0,s.jsx)(i.td,{children:"2"}),(0,s.jsxs)(i.td,{children:[(0,s.jsx)(i.code,{children:"GL.TEXTURE_CUBE_MAP_POSITIVE_Y"})," (0x8517)"]}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'top'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'y'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'positive'"})})]}),(0,s.jsxs)(i.tr,{children:[(0,s.jsx)(i.td,{children:"3"}),(0,s.jsxs)(i.td,{children:[(0,s.jsx)(i.code,{children:"GL.TEXTURE_CUBE_MAP_NEGATIVE_Y"})," (0x8518)"]}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'bottom'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'y'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'negative'"})})]}),(0,s.jsxs)(i.tr,{children:[(0,s.jsx)(i.td,{children:"4"}),(0,s.jsxs)(i.td,{children:[(0,s.jsx)(i.code,{children:"GL.TEXTURE_CUBE_MAP_POSITIVE_Z"})," (0x8519)"]}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'front'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'z'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'positive'"})})]}),(0,s.jsxs)(i.tr,{children:[(0,s.jsx)(i.td,{children:"5"}),(0,s.jsxs)(i.td,{children:[(0,s.jsx)(i.code,{children:"GL.TEXTURE_CUBE_MAP_NEGATIVE_Z"})," (0x851a)"]}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'back'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'z'"})}),(0,s.jsx)(i.td,{children:(0,s.jsx)(i.code,{children:"'negative'"})})]})]})]}),"\n",(0,s.jsxs)(i.p,{children:["Note: In addition to these values, all ",(0,s.jsx)(i.code,{children:"options"})," passed in to ",(0,s.jsx)(i.code,{children:"loadImageCube"})," are also available in the ",(0,s.jsx)(i.code,{children:"getUrl"})," method."]}),"\n",(0,s.jsxs)(i.h3,{id:"loadimagecubegeturl--face-direction-index--string-options--object--object",children:["loadImageCube(getUrl : ",(0,s.jsx)(i.code,{children:"({face, direction, index}) => String"}),", options? : Object) : Object"]}),"\n",(0,s.jsx)(i.p,{children:"Loads and image cube, i.e. 6 images keyed by WebGL face constants (see table)."}),"\n",(0,s.jsx)(i.p,{children:"Parameters:"}),"\n",(0,s.jsxs)(i.ul,{children:["\n",(0,s.jsxs)(i.li,{children:[(0,s.jsx)(i.code,{children:"getUrl"}),": A function that generates the url for each image, it is called for each image with the ",(0,s.jsx)(i.code,{children:"index"})," of that image."]}),"\n",(0,s.jsxs)(i.li,{children:[(0,s.jsx)(i.code,{children:"options"}),": Supports the same options as ",(0,s.jsx)(i.a,{href:"/docs/modules/images/api-reference/image-loader",children:(0,s.jsx)(i.code,{children:"ImageLoader"})}),"."]}),"\n"]}),"\n",(0,s.jsx)(i.p,{children:"Returns"}),"\n",(0,s.jsxs)(i.ul,{children:["\n",(0,s.jsx)(i.li,{children:"An object with 6 key/value pairs containing images (or arrays of mip images) for for each cube face. They keys are the (stringified) numeric values of the GL constant for the respective faces of the cube"}),"\n"]}),"\n",(0,s.jsx)(i.h2,{id:"options",children:"Options"}),"\n",(0,s.jsxs)(i.p,{children:["Accepts the same options as ",(0,s.jsx)(i.a,{href:"/docs/modules/images/api-reference/image-loader",children:(0,s.jsx)(i.code,{children:"ImageLoader"})}),", and"]}),"\n",(0,s.jsxs)(i.p,{children:["| Option            | Type    | Default | Description |\n| ----------------- | ------- | ------- | ----------- | ------------------------------------------------------ |\n| ",(0,s.jsx)(i.code,{children:"image.mipLevels"})," | ",(0,s.jsx)(i.code,{children:"Number | String"})," | ",(0,s.jsx)(i.code,{children:"0"}),"         | If ",(0,s.jsx)(i.code,{children:"'auto'"})," or non-zero, loads an array of mip images. |"]}),"\n",(0,s.jsxs)(i.p,{children:["Number of mip level images to load: Use ",(0,s.jsx)(i.code,{children:"0"})," to indicate a single image with no mips. Supplying the string ",(0,s.jsx)(i.code,{children:"'auto'"})," will infer the mipLevel from the size of the ",(0,s.jsx)(i.code,{children:"lod"}),"=",(0,s.jsx)(i.code,{children:"0"})," image."]}),"\n",(0,s.jsx)(i.h2,{id:"remarks",children:"Remarks"}),"\n",(0,s.jsxs)(i.ul,{children:["\n",(0,s.jsxs)(i.li,{children:["Returned images can be passed directly to WebGL texture methods. See ",(0,s.jsx)(i.a,{href:"/docs/modules/images/api-reference/image-loader",children:(0,s.jsx)(i.code,{children:"ImageLoader"})})," for details about the type of the returned images."]}),"\n"]})]})}function h(e={}){const{wrapper:i}={...(0,n.R)(),...e.components};return i?(0,s.jsx)(i,{...e,children:(0,s.jsx)(a,{...e})}):a(e)}},43023:(e,i,d)=>{d.d(i,{R:()=>c,x:()=>t});var s=d(63696);const n={},r=s.createContext(n);function c(e){const i=s.useContext(r);return s.useMemo((function(){return"function"==typeof e?e(i):{...i,...e}}),[i,e])}function t(e){let i;return i=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:c(e.components),s.createElement(r.Provider,{value:i},e.children)}}}]);