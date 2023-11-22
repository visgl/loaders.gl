"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[4285],{2250:(e,d,s)=>{s.r(d),s.d(d,{assets:()=>l,contentTitle:()=>n,default:()=>a,frontMatter:()=>t,metadata:()=>c,toc:()=>o});var r=s(85893),i=s(11151);const t={},n="Mesh and PointCloud Loaders",c={id:"specifications/category-mesh",title:"Mesh and PointCloud Loaders",description:'The mesh and pointcloud loader category is intended for simpler mesh and point clouds formats that describe a "single geometry primitive" (as opposed to e.g. a scenegraph consisting of a hierarchy of multiple geometries).',source:"@site/../docs/specifications/category-mesh.md",sourceDirName:"specifications",slug:"/specifications/category-mesh",permalink:"/docs/specifications/category-mesh",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/specifications/category-mesh.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Geospatial Loaders",permalink:"/docs/specifications/category-gis"},next:{title:"Scenegraph Loaders",permalink:"/docs/specifications/category-scenegraph"}},l={},o=[{value:"Mesh/PointCloud Category Loaders",id:"meshpointcloud-category-loaders",level:2},{value:"Data Format",id:"data-format",level:2},{value:"Header",id:"header",level:3},{value:"Mode",id:"mode",level:3},{value:"Accessor",id:"accessor",level:3},{value:"glTF Attribute Name Mapping",id:"gltf-attribute-name-mapping",level:3},{value:"Limitations",id:"limitations",level:2},{value:"Scenegraph support",id:"scenegraph-support",level:3},{value:"Material support",id:"material-support",level:3}];function h(e){const d={a:"a",blockquote:"blockquote",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,i.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(d.h1,{id:"mesh-and-pointcloud-loaders",children:"Mesh and PointCloud Loaders"}),"\n",(0,r.jsxs)(d.p,{children:["The ",(0,r.jsx)(d.em,{children:"mesh and pointcloud"}),' loader category is intended for simpler mesh and point clouds formats that describe a "single geometry primitive" (as opposed to e.g. a scenegraph consisting of a hierarchy of multiple geometries).']}),"\n",(0,r.jsx)(d.h2,{id:"meshpointcloud-category-loaders",children:"Mesh/PointCloud Category Loaders"}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Loader"}),(0,r.jsx)(d.th,{children:"Notes"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.a,{href:"/docs/modules/draco/api-reference/draco-loader",children:(0,r.jsx)(d.code,{children:"DracoLoader"})})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.a,{href:"/docs/modules/las/api-reference/las-loader",children:(0,r.jsx)(d.code,{children:"LASLoader"})})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.a,{href:"/docs/modules/obj/api-reference/obj-loader",children:(0,r.jsx)(d.code,{children:"OBJLoader"})})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.a,{href:"/docs/modules/pcd/api-reference/pcd-loader",children:(0,r.jsx)(d.code,{children:"PCDLoader"})})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.a,{href:"/docs/modules/ply/api-reference/ply-loader",children:(0,r.jsx)(d.code,{children:"PLYLoader"})})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.a,{href:"/docs/modules/terrain/api-reference/quantized-mesh-loader",children:(0,r.jsx)(d.code,{children:"QuantizedMeshLoader"})})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.a,{href:"/docs/modules/terrain/api-reference/terrain-loader",children:(0,r.jsx)(d.code,{children:"TerrainLoader"})})}),(0,r.jsx)(d.td,{})]})]})]}),"\n",(0,r.jsx)(d.h2,{id:"data-format",children:"Data Format"}),"\n",(0,r.jsxs)(d.p,{children:["A single mesh is typically defined by a set of attributes, such as ",(0,r.jsx)(d.code,{children:"positions"}),", ",(0,r.jsx)(d.code,{children:"colors"}),", ",(0,r.jsx)(d.code,{children:"normals"})," etc, as well as a draw mode."]}),"\n",(0,r.jsx)(d.p,{children:"The Pointcloud/Mesh loaders output mesh data in a common form that is optimized for use in WebGL frameworks:"}),"\n",(0,r.jsxs)(d.ul,{children:["\n",(0,r.jsx)(d.li,{children:"All attributes (and indices if present) are stored as typed arrays of the proper type."}),"\n",(0,r.jsxs)(d.li,{children:['All attributes (and indices if present) are wrapped into glTF-style "accessor objects", e.g. ',(0,r.jsx)(d.code,{children:"{size: 1-4, value: typedArray}"}),"."]}),"\n",(0,r.jsx)(d.li,{children:"Attribute names are mapped to glTF attribute names (on a best-effort basis)."}),"\n",(0,r.jsxs)(d.li,{children:["An ",(0,r.jsx)(d.code,{children:"indices"})," field is added (only if present in the loaded geometry)."]}),"\n",(0,r.jsxs)(d.li,{children:["A primitive drawing ",(0,r.jsx)(d.code,{children:"mode"})," value is added (the numeric value matches WebGL constants, e.g ",(0,r.jsx)(d.code,{children:"GL.TRIANGLES"}),")."]}),"\n"]}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Field"}),(0,r.jsx)(d.th,{children:"Type"}),(0,r.jsx)(d.th,{children:"Contents"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"loaderData"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"Object"})," (Optional)"]}),(0,r.jsx)(d.td,{children:"Loader and format specific data"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"header"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"Object"})}),(0,r.jsxs)(d.td,{children:["See ",(0,r.jsx)(d.a,{href:"#header",children:"Header"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"mode"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"Number"})}),(0,r.jsxs)(d.td,{children:["See ",(0,r.jsx)(d.a,{href:"#mode",children:"Mode"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"attributes"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"Object"})}),(0,r.jsxs)(d.td,{children:["Keys are ",(0,r.jsx)(d.a,{href:"#gltf-attribute-name-mapping",children:"glTF attribute names"})," and values are ",(0,r.jsx)(d.a,{href:"#accessor",children:"accessor"})," objects."]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"indices"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"Object"})," (Optional)"]}),(0,r.jsxs)(d.td,{children:["If present, describes the indices (elements) of the geometry as an ",(0,r.jsx)(d.a,{href:"#accessor",children:"accessor"})," object."]})]})]})]}),"\n",(0,r.jsx)(d.h3,{id:"header",children:"Header"}),"\n",(0,r.jsxs)(d.p,{children:["The ",(0,r.jsx)(d.code,{children:"header"})," fields are only recommended at this point, applications can not assume they will be present:"]}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsxs)(d.th,{children:[(0,r.jsx)(d.code,{children:"header"})," Field"]}),(0,r.jsx)(d.th,{children:"Type"}),(0,r.jsx)(d.th,{children:"Contents"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"vertexCount"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"Number"})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"boundingBox"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"Array"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"[[minX, minY, minZ], [maxX, maxY, maxZ]]"})})]})]})]}),"\n",(0,r.jsx)(d.h3,{id:"mode",children:"Mode"}),"\n",(0,r.jsxs)(d.p,{children:["Primitive modes are aligned with ",(0,r.jsx)(d.a,{href:"https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#primitive",children:"OpenGL/glTF primitive types"})]}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Value"}),(0,r.jsx)(d.th,{children:"Primitive Mode"}),(0,r.jsx)(d.th,{children:"Comment"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"0"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"POINTS"})}),(0,r.jsx)(d.td,{children:"Used for point cloud category data"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"1"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"LINES"})}),(0,r.jsx)(d.td,{children:"Lines are rarely used due to limitations in GPU-based rendering"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"LINE_LOOP"})}),(0,r.jsx)(d.td,{children:"-"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"3"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"LINE_STRIP"})}),(0,r.jsx)(d.td,{children:"-"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"TRIANGLES"})}),(0,r.jsx)(d.td,{children:"Used for most meshes. Indices attributes are often used to reuse vertex data in remaining attributes"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"5"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"TRIANGLE_STRIP"})}),(0,r.jsx)(d.td,{children:"-"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"6"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"TRIANGLE_FAN"})}),(0,r.jsx)(d.td,{children:"-"})]})]})]}),"\n",(0,r.jsx)(d.h3,{id:"accessor",children:"Accessor"}),"\n",(0,r.jsxs)(d.p,{children:[(0,r.jsx)(d.code,{children:"attributes"})," and ",(0,r.jsx)(d.code,{children:"indices"}),' are represented by glTF "accessor objects" with the binary data for that attribute resolved into a typed array of the proper type.']}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Accessors Fields"}),(0,r.jsx)(d.th,{children:"glTF?"}),(0,r.jsx)(d.th,{children:"Type"}),(0,r.jsx)(d.th,{children:"Contents"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"value"})}),(0,r.jsx)(d.td,{children:"No"}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"TypedArray"})}),(0,r.jsxs)(d.td,{children:["Contains the typed array (corresponds to ",(0,r.jsx)(d.code,{children:"bufferView"}),"). The type of the array will match the GL constant in ",(0,r.jsx)(d.code,{children:"componentType"}),"."]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"size"})}),(0,r.jsx)(d.td,{children:"No"}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"Number"})}),(0,r.jsxs)(d.td,{children:["Number of components, ",(0,r.jsx)(d.code,{children:"1"}),"-",(0,r.jsx)(d.code,{children:"4"}),"."]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"byteOffset"})}),(0,r.jsx)(d.td,{children:"Yes"}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"Number"})}),(0,r.jsx)(d.td,{children:"Starting offset into the bufferView."})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"count"})}),(0,r.jsx)(d.td,{children:"Yes"}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"Number"})}),(0,r.jsx)(d.td,{children:"The number of elements/vertices in the attribute data."})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"originalName"})}),(0,r.jsx)(d.td,{children:"No"}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"String"})," (Optional)"]}),(0,r.jsx)(d.td,{children:"If this was a named attribute in the original file, the original name (before substitution with glTF attribute names) will be made available here."})]})]})]}),"\n",(0,r.jsx)(d.h3,{id:"gltf-attribute-name-mapping",children:"glTF Attribute Name Mapping"}),"\n",(0,r.jsxs)(d.p,{children:["To help applications manage attribute name differences between various formats, mesh loaders map known attribute names to ",(0,r.jsx)(d.a,{href:"https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#geometry",children:"glTF 2.0 standard attribute names"})," a best-effort basis."]}),"\n",(0,r.jsx)(d.p,{children:"When a loader can map an attribute name, it will replace ir with the glTF equivalent. This allows applications to use common code to handle meshes and point clouds from different formats."}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Name"}),(0,r.jsx)(d.th,{children:"Accessor Type(s)"}),(0,r.jsx)(d.th,{children:"Component Type(s)"}),(0,r.jsx)(d.th,{children:"Description"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"POSITION"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'"VEC3"'})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"5126"})," (FLOAT)"]}),(0,r.jsx)(d.td,{children:"XYZ vertex positions"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"NORMAL"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'"VEC3"'})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"5126"})," (FLOAT)"]}),(0,r.jsx)(d.td,{children:"Normalized XYZ vertex normals"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"TANGENT"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'"VEC4"'})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"5126"})," (FLOAT)"]}),(0,r.jsxs)(d.td,{children:["XYZW vertex tangents where the ",(0,r.jsx)(d.em,{children:"w"})," component is a sign value (-1 or +1) indicating handedness of the tangent basis"]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"TEXCOORD_0"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'"VEC2"'})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"5126"})," (FLOAT), ",(0,r.jsx)(d.code,{children:"5121"})," (UNSIGNED_BYTE) normalized, ",(0,r.jsx)(d.code,{children:"5123"})," (UNSIGNED_SHORT) normalized"]}),(0,r.jsx)(d.td,{children:"UV texture coordinates for the first set"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"TEXCOORD_1"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'"VEC2"'})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"5126"})," (FLOAT), ",(0,r.jsx)(d.code,{children:"5121"})," (UNSIGNED_BYTE) normalized, ",(0,r.jsx)(d.code,{children:"5123"})," (UNSIGNED_SHORT) normalized"]}),(0,r.jsx)(d.td,{children:"UV texture coordinates for the second set"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"COLOR_0"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:'"VEC3"'}),", ",(0,r.jsx)(d.code,{children:'"VEC4"'})]}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"5126"})," (FLOAT), ",(0,r.jsx)(d.code,{children:"5121"})," (UNSIGNED_BYTE) normalized, ",(0,r.jsx)(d.code,{children:"5123"})," (UNSIGNED_SHORT) normalized"]}),(0,r.jsx)(d.td,{children:"RGB or RGBA vertex color"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"JOINTS_0"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'"VEC4"'})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"5121"})," (UNSIGNED_BYTE), ",(0,r.jsx)(d.code,{children:"5123"})," (UNSIGNED_SHORT)"]}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"WEIGHTS_0"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:'"VEC4"'})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"5126"})," (FLOAT), ",(0,r.jsx)(d.code,{children:"5121"})," (UNSIGNED_BYTE) normalized, ",(0,r.jsx)(d.code,{children:"5123"})," (UNSIGNED_SHORT) normalized"]}),(0,r.jsx)(d.td,{})]})]})]}),"\n",(0,r.jsxs)(d.blockquote,{children:["\n",(0,r.jsx)(d.p,{children:"Note that for efficiency reasons, mesh loaders are not required to convert the format of an attribute's binary data to match the glTF specifications (i.e. if normals were encoded using BYTES then that is what will be returned even though glTF calls out for FLOAT32). Any such alignment needs to be done by the application as a second step."}),"\n"]}),"\n",(0,r.jsx)(d.h2,{id:"limitations",children:"Limitations"}),"\n",(0,r.jsx)(d.h3,{id:"scenegraph-support",children:"Scenegraph support"}),"\n",(0,r.jsxs)(d.p,{children:["For more complex, scenegraph-type formats (i.e. formats that contain multiple geometric primitives), loaders.gl provides glTF 2.0 support via the ",(0,r.jsx)(d.code,{children:"GLTFLoader"}),"."]}),"\n",(0,r.jsx)(d.h3,{id:"material-support",children:"Material support"}),"\n",(0,r.jsx)(d.p,{children:"Material support is provided by some mesh formats (e.g. OBJ/MTL) and is currently not implemented by loaders.gl, however the glTF loader has full support for PBR (Physically-Based Rendering) materials."})]})}function a(e={}){const{wrapper:d}={...(0,i.a)(),...e.components};return d?(0,r.jsx)(d,{...e,children:(0,r.jsx)(h,{...e})}):h(e)}},11151:(e,d,s)=>{s.d(d,{Z:()=>c,a:()=>n});var r=s(67294);const i={},t=r.createContext(i);function n(e){const d=r.useContext(t);return r.useMemo((function(){return"function"==typeof e?e(d):{...d,...e}}),[d,e])}function c(e){let d;return d=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:n(e.components),r.createElement(t.Provider,{value:d},e.children)}}}]);