"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[1850],{99395:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>l,contentTitle:()=>o,default:()=>h,frontMatter:()=>s,metadata:()=>a,toc:()=>d});var t=n(62540),i=n(43023);const s={},o="MeshArrow: Storing Meshes in Arrow Tables",a={id:"arrowjs/usage-guide/mesharrow",title:"MeshArrow: Storing Meshes in Arrow Tables",description:"arrow-logo",source:"@site/../docs/arrowjs/usage-guide/mesharrow.md",sourceDirName:"arrowjs/usage-guide",slug:"/arrowjs/usage-guide/mesharrow",permalink:"/docs/arrowjs/usage-guide/mesharrow",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/arrowjs/usage-guide/mesharrow.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Storing Geospatial Features in Arrow",permalink:"/docs/arrowjs/usage-guide/geoarrow"},next:{title:"Data Types",permalink:"/docs/arrowjs/developer-guide/data-types"}},l={},d=[{value:"Design Goals",id:"design-goals",level:2},{value:"Relationship to GeoArrow",id:"relationship-to-geoarrow",level:2},{value:"Relationship to GeoParquet",id:"relationship-to-geoparquet",level:2},{value:"Design Goals",id:"design-goals-1",level:2},{value:"One mesh",id:"one-mesh",level:4},{value:"Feature Ids",id:"feature-ids",level:3},{value:"Meshes that do not fit well into MeshArrow",id:"meshes-that-do-not-fit-well-into-mesharrow",level:3},{value:"Materials",id:"materials",level:4},{value:"Background",id:"background",level:2},{value:"Vertexes",id:"vertexes",level:3},{value:"Attributes",id:"attributes",level:3},{value:"Topologies",id:"topologies",level:2},{value:"Column Conventions",id:"column-conventions",level:2},{value:"Row Modes",id:"row-modes",level:3},{value:"Indexes",id:"indexes",level:3},{value:"Mesharrow Metadata Conventions",id:"mesharrow-metadata-conventions",level:2},{value:"Considerations",id:"considerations",level:2},{value:"Expanding/duplicating rows to match geometry",id:"expandingduplicating-rows-to-match-geometry",level:3},{value:"Row Ids",id:"row-ids",level:3},{value:"Draw",id:"draw",level:2},{value:"Instanced Draws",id:"instanced-draws",level:3},{value:"MultiDraw Support",id:"multidraw-support",level:3},{value:"Library Functionality",id:"library-functionality",level:2},{value:"getRowIndexAttributeColumn",id:"getrowindexattributecolumn",level:3},{value:"getVertexAttribute",id:"getvertexattribute",level:3},{value:"&quot;GeoArrow&quot; functions",id:"geoarrow-functions",level:2},{value:"Triangulation",id:"triangulation",level:3}];function c(e){const r={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",h4:"h4",header:"header",hr:"hr",img:"img",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,i.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.header,{children:(0,t.jsx)(r.h1,{id:"mesharrow-storing-meshes-in-arrow-tables",children:"MeshArrow: Storing Meshes in Arrow Tables"})}),"\n",(0,t.jsx)(r.p,{children:(0,t.jsx)(r.img,{alt:"arrow-logo",src:n(26054).A+"",width:"200",height:"73"})}),"\n",(0,t.jsx)(r.p,{children:'This page describes "MeshArrow", a set of conventions for storing binary GPU geometries\n(point clouds and meshes) in Apache Arrow tables.'}),"\n",(0,t.jsx)(r.h2,{id:"design-goals",children:"Design Goals"}),"\n",(0,t.jsx)(r.p,{children:"To be able to store 3D meshes in arrow tables in a well-defined way."}),"\n",(0,t.jsxs)(r.p,{children:["A key realization is that each row can have all its vertices in a ",(0,t.jsx)(r.code,{children:"POSITIONS"})," column in a ",(0,t.jsx)(r.code,{children:"List<FixedSizeList<3, double>>"}),"."]}),"\n",(0,t.jsx)(r.h2,{id:"relationship-to-geoarrow",children:"Relationship to GeoArrow"}),"\n",(0,t.jsx)(r.p,{children:(0,t.jsx)(r.em,{children:"Mesharrow"})}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:["\n",(0,t.jsx)(r.p,{children:"was inspired by GeoArrow, in terms of being a set of column type and metadata conventions for Apache Arrow."}),"\n"]}),"\n",(0,t.jsxs)(r.li,{children:["\n",(0,t.jsx)(r.p,{children:"In contrast to GeoArrow which focuses on storing simple 2D geospatial features, MeshArrow focuses on storing GPU renderable geometries (meshes)."}),"\n"]}),"\n",(0,t.jsxs)(r.li,{children:["\n",(0,t.jsx)(r.p,{children:"is independent and can be used separately or together with GeoArrow."}),"\n"]}),"\n",(0,t.jsxs)(r.li,{children:["\n",(0,t.jsx)(r.p,{children:"GeoArrow allows for simple 2D geometries (points, lines and polygons) to be stored in binary columnar form in Apache Arrow (and Parquet) tables."}),"\n"]}),"\n",(0,t.jsxs)(r.li,{children:["\n",(0,t.jsx)(r.p,{children:"However, the stored geometries are not GPU renderable (in particular, for polygon fills)"}),"\n"]}),"\n",(0,t.jsxs)(r.li,{children:["\n",(0,t.jsx)(r.p,{children:"GeoArrow objects must often be transformed (e.g. through triangulation) into a form that can be rendered by GPUs, and the resulting format is often no longer stored in Arrow."}),"\n"]}),"\n"]}),"\n",(0,t.jsx)(r.p,{children:'Mesharrow allows GeoArrow derived, renderable geometries to be stored in Apache Arrow format, even appended as an additional "MeshArrow" column to the source GeoArrow table.'}),"\n",(0,t.jsx)(r.h2,{id:"relationship-to-geoparquet",children:"Relationship to GeoParquet"}),"\n",(0,t.jsx)(r.p,{children:'All the conventions defined by "MeshArrow" can be applied to Parquet tables, so feel free to store mesharrow data in Parquet and think of it as "MeshParquet".\nIn contrast to GeoParquet/GeoArrow, MeshArrow is not a standard. Mesharrow is being defined as a set of conventions for the vis.gl frameworks (loaders.gl, luma.gl, deck.gl etc). If defacto standards similar to "mesharrow" were to emerge, expect vis.gl to adopt and favor those over MeshArrow.'}),"\n",(0,t.jsx)(r.h2,{id:"design-goals-1",children:"Design Goals"}),"\n",(0,t.jsxs)(r.p,{children:["A key realization is that each row can have all its vertices in a ",(0,t.jsx)(r.code,{children:"POSITIONS"})," column in a ",(0,t.jsx)(r.code,{children:"List<FixedSizeList<3, double>>"}),"."]}),"\n",(0,t.jsx)(r.h4,{id:"one-mesh",children:"One mesh"}),"\n",(0,t.jsx)(r.p,{children:'A mesh typically is separated into of a number of primitives with different "materials"'}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:'"One-mesh-primitive-per-row" approach.'}),"\n",(0,t.jsx)(r.li,{children:'"One-mesh-per-row" approach.'}),"\n",(0,t.jsxs)(r.li,{children:["One-mesh-per-record-batch?","\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:["Record Batches - The Apache Arrow record batch structure can certainly be used to wrap each mesh in its own record batch. An advantage is that each RecordBatch has its own ",(0,t.jsx)(r.code,{children:"Data"})," object so there is no need to concatenate all the array buffers from the different meshes being combined into a table."]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,t.jsx)(r.h3,{id:"feature-ids",children:"Feature Ids"}),"\n",(0,t.jsx)(r.p,{children:"Tracking feature ids in geometries is very important"}),"\n",(0,t.jsxs)(r.table,{children:[(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Id type"}),(0,t.jsx)(r.th,{children:"Description"})]})}),(0,t.jsxs)(r.tbody,{children:[(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"row index"}),(0,t.jsx)(r.td,{children:"primary feature id for a one-mesh-per-row-table is naturally the row index."})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:'"global" id'}),(0,t.jsx)(r.td,{children:'An additional column can be added to the table to contain an "arbitrary" global feature id for the row.'})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Vertex based"}),(0,t.jsxs)(r.td,{children:["An additional ",(0,t.jsx)(r.code,{children:"List<Uint32>"})," can contain a per vertex feature id. Not that shader interpolation should be disabled."]})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:"Texture based"}),(0,t.jsxs)(r.td,{children:["If the geometry has ",(0,t.jsx)(r.code,{children:"uvs"})," a ",(0,t.jsx)(r.code,{children:"featureTexture"})," can be added, see e.g. ",(0,t.jsx)(r.code,{children:"EXT_mesh_features"}),"."]})]})]})]}),"\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.a,{href:"https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features",children:(0,t.jsx)(r.code,{children:"EXT_mesh_features"})})," glTF extension gives some details around advanced feature id specification."]}),"\n",(0,t.jsx)(r.h3,{id:"meshes-that-do-not-fit-well-into-mesharrow",children:"Meshes that do not fit well into MeshArrow"}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:"Heavily indexed meshes, where mesh primitives share vertices via indices."}),"\n"]}),"\n",(0,t.jsx)(r.h4,{id:"materials",children:"Materials"}),"\n",(0,t.jsx)(r.p,{children:"Full Handling of materials is outside the scope of this MeshArrow proposal. A material involved a bunch of settings that can be JSON encoded, however it also involves a number of a textures that typically need to be parsed into a browser specific object."}),"\n",(0,t.jsx)(r.p,{children:"Binary data required to create images can be stored in a separate Apache Arrow table. However, textures typically need to be parsed into browser specific objects."}),"\n",(0,t.jsx)(r.hr,{}),"\n",(0,t.jsx)(r.h2,{id:"background",children:"Background"}),"\n",(0,t.jsx)(r.h3,{id:"vertexes",children:"Vertexes"}),"\n",(0,t.jsx)(r.p,{children:"This MeshArrow proposal currently only supports interleaved 3 component, 32 bit floating point vertexes."}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"type VertexArrowType = arrow.FixedSizeList<3, arrow.Float>;\n"})}),"\n",(0,t.jsx)(r.h3,{id:"attributes",children:"Attributes"}),"\n",(0,t.jsx)(r.p,{children:'A binary geometry suitable for GPU rendering typically has a number of "attributes", which are just binary columns, suitable as columns in an Apache Arrow table.'}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:(0,t.jsx)(r.code,{children:"positions"})}),"\n",(0,t.jsx)(r.li,{children:(0,t.jsx)(r.code,{children:"normals"})}),"\n",(0,t.jsx)(r.li,{children:(0,t.jsx)(r.code,{children:"uvs"})}),"\n",(0,t.jsx)(r.li,{children:(0,t.jsx)(r.code,{children:"colors"})}),"\n",(0,t.jsx)(r.li,{children:"..."}),"\n"]}),"\n",(0,t.jsx)(r.h2,{id:"topologies",children:"Topologies"}),"\n",(0,t.jsx)(r.p,{children:"A topology describes how vertexes are interpreted (how primitives are formed) during rendering.\nTopology is stored in mesharrow metadata for a column.\nAll columns with attribute layout will need to be la"}),"\n",(0,t.jsx)(r.h2,{id:"column-conventions",children:"Column Conventions"}),"\n",(0,t.jsx)(r.h3,{id:"row-modes",children:"Row Modes"}),"\n",(0,t.jsx)(r.p,{children:"Mesharrow identifies several modes in which geometries can be stored in tables"}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:"One position vertex per Arrow Table row."}),"\n",(0,t.jsx)(r.li,{children:"One mesh (list of position vertexes) per Arrow Table row."}),"\n"]}),"\n",(0,t.jsxs)(r.table,{children:[(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Row Mode"}),(0,t.jsx)(r.th,{children:"POSITIONS column type"}),(0,t.jsx)(r.th,{children:"Topology"})]})}),(0,t.jsxs)(r.tbody,{children:[(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"vertex"})}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"FixedSizeList<3, Float*>"})}),(0,t.jsx)(r.td,{children:"One vertex per table row"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"primitive"})}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"List<FixedSizeList<3, Float*>>"})}),(0,t.jsx)(r.td,{children:"One primitive per arrow table row"})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"mesh"})}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"List<List<FixedSizeList<3, Float*>>>"})}),(0,t.jsx)(r.td,{children:"Multiple primitives per arrow table row"})]})]})]}),"\n",(0,t.jsx)(r.h3,{id:"indexes",children:"Indexes"}),"\n",(0,t.jsx)(r.p,{children:"An index column can be defined, it will be a list of indexes into the POSITIONS column"}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:["Indexes ",(0,t.jsx)(r.code,{children:"List<Uint32>"})]}),"\n"]}),"\n",(0,t.jsx)(r.p,{children:"Note: Indexes are not always well supported."}),"\n",(0,t.jsx)(r.h2,{id:"mesharrow-metadata-conventions",children:"Mesharrow Metadata Conventions"}),"\n",(0,t.jsx)(r.p,{children:"Table / Schema Metadata Conventions include:"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-json",children:'{\n  "geometryColumns": ["..."],\n  "attributeColumns": ["..."],\n  "rowMode": "vertex/primitive/mesh"\n}\n'})}),"\n",(0,t.jsx)(r.p,{children:"Field Metadata"}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:"Whether a column represents positions, normals, etc well known attributes"}),"\n"]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-json",children:'{\n  "semantic?": "POSITION"\n}\n'})}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:"Whether a column is quantized"}),"\n"]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-json",children:'{\n  "quantization?": {\n    "scale": 1,\n    "offset": 0\n  }\n}\n'})}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:"Whether a transform should be applied (e.g. UVs)"}),"\n"]}),"\n",(0,t.jsx)(r.h2,{id:"considerations",children:"Considerations"}),"\n",(0,t.jsx)(r.h3,{id:"expandingduplicating-rows-to-match-geometry",children:"Expanding/duplicating rows to match geometry"}),"\n",(0,t.jsx)(r.p,{children:"For a table where each row has its own variable length geometry, the GPU either needs other columns to match the length, or it needs to use indirection through row ids."}),"\n",(0,t.jsx)(r.h3,{id:"row-ids",children:"Row Ids"}),"\n",(0,t.jsx)(r.p,{children:"As each GPU shader can see only the current triangle and its vertices, it is useful to be able to know which row in the arrow table a specific vertex belongs to."}),"\n",(0,t.jsx)(r.p,{children:"a simple process is to generate a"}),"\n",(0,t.jsxs)(r.p,{children:[(0,t.jsx)(r.code,{children:"List<FixedSizeList<Float>>"})," => ",(0,t.jsx)(r.code,{children:"List<Uint32>"})]}),"\n",(0,t.jsx)(r.p,{children:"This creates a columnar array where each vertex index references the current row index, and additional looups can be done."}),"\n",(0,t.jsx)(r.h2,{id:"draw",children:"Draw"}),"\n",(0,t.jsx)(r.h3,{id:"instanced-draws",children:"Instanced Draws"}),"\n",(0,t.jsx)(r.p,{children:"Instanced draws are very useful in data visualization since many visualizations\ndraw a copy of the same geometry (a circle, hexagon, line etc) for each row in the input table.\nFor instanced draws, the geometry is often separated from the data table."}),"\n",(0,t.jsx)(r.h3,{id:"multidraw-support",children:"MultiDraw Support"}),"\n",(0,t.jsxs)(r.p,{children:["GPU APIs often support MultiDraw operations (typically as an optional extension)\n",(0,t.jsx)(r.a,{href:"https://developer.chrome.com/blog/new-in-webgpu-131#experimental_support_for_multi-draw_indirect",children:"https://developer.chrome.com/blog/new-in-webgpu-131#experimental_support_for_multi-draw_indirect"})]}),"\n",(0,t.jsx)(r.p,{children:"As for multidraw, my understanding is that it is an optimized way to draw all the mesh primitives that share materials etc in a single lower overhead call."}),"\n",(0,t.jsx)(r.p,{children:"If we store one mesh per row, we could just filter out all the Arrow Table rows that were using the same material, and get the start and end indices from the underlying arrow.Data offsets, and populate the multidraw parameter buffer."}),"\n",(0,t.jsx)(r.hr,{}),"\n",(0,t.jsx)(r.h2,{id:"library-functionality",children:"Library Functionality"}),"\n",(0,t.jsx)(r.p,{children:"A mesharrow library can provide a number of transformations to make"}),"\n",(0,t.jsx)(r.h3,{id:"getrowindexattributecolumn",children:"getRowIndexAttributeColumn"}),"\n",(0,t.jsx)(r.p,{children:"Create a column"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"getRowIndexAttributeColumn(table: arrow.Table, columnName: string) => arrow.Vector<List<Uint32>>\n"})}),"\n",(0,t.jsx)(r.h3,{id:"getvertexattribute",children:"getVertexAttribute"}),"\n",(0,t.jsx)(r.p,{children:"Map a normal column to a vertex attribute by duplicating"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"getVertexAttribute(table: arrow.Table, columnName: string) => arrow.Vector<List<...>>\n"})}),"\n",(0,t.jsx)(r.h2,{id:"geoarrow-functions",children:'"GeoArrow" functions'}),"\n",(0,t.jsx)(r.h3,{id:"triangulation",children:"Triangulation"}),"\n",(0,t.jsx)(r.p,{children:"Mesharrow is designed to hold triangulated geometries. Sometimes these geometries need to be generated (triangulated) from other, more complex geometries."}),"\n",(0,t.jsx)(r.p,{children:'An important example is GeoArrow polygons (these can be very complex with an outer hull and multiple complex holes).\nA computationally expensive triangulation process needs to be performed that converts the "abstract" polygon hull geometry into a simple list\nof triangles that a GPU can render.'}),"\n",(0,t.jsx)(r.p,{children:"It is useful to offer support for GeoArrow to MeshArrow triangulation, preserving the full GeoArrow table."}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"triangulateGeoArrowToMeshArrow(table: arrow.Table, colum) => arrow.Table\n"})})]})}function h(e={}){const{wrapper:r}={...(0,i.R)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(c,{...e})}):c(e)}},26054:(e,r,n)=>{n.d(r,{A:()=>t});const t="data:image/png;base64,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"},43023:(e,r,n)=>{n.d(r,{R:()=>o,x:()=>a});var t=n(63696);const i={},s=t.createContext(i);function o(e){const r=t.useContext(s);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function a(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),t.createElement(s.Provider,{value:r},e.children)}}}]);