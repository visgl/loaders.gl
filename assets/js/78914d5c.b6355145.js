"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[5483],{28764:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>i,contentTitle:()=>n,default:()=>u,frontMatter:()=>c,metadata:()=>a,toc:()=>l});var o=s(85893),t=s(11151);const c={},n="createDataSource \ud83d\udea7",a={id:"modules/core/api-reference/create-data-source",title:"createDataSource \ud83d\udea7",description:"This function creates a DataSource for an",source:"@site/../docs/modules/core/api-reference/create-data-source.md",sourceDirName:"modules/core/api-reference",slug:"/modules/core/api-reference/create-data-source",permalink:"/docs/modules/core/api-reference/create-data-source",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/modules/core/api-reference/create-data-source.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"selectSource \ud83d\udea7",permalink:"/docs/modules/core/api-reference/select-source"},next:{title:"encode",permalink:"/docs/modules/core/api-reference/encode"}},i={},l=[{value:"Usage",id:"usage",level:2},{value:"Functions",id:"functions",level:2},{value:"createDataSource(data: String | Blob, sources: Source[], options?: Object) : Promise&lt;DataSource&gt;",id:"createdatasourcedata-string--blob-sources-source-options-object--promisedatasource",level:3},{value:"createDataSourceSync(data: String | Blob, sources: Source[], options?: Object) : Promise&lt;Any&gt;",id:"createdatasourcesyncdata-string--blob-sources-source-options-object--promiseany",level:3}];function d(e){const r={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,t.a)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(r.h1,{id:"createdatasource-",children:"createDataSource \ud83d\udea7"}),"\n",(0,o.jsxs)(r.p,{children:["This function creates a ",(0,o.jsx)(r.code,{children:"DataSource"}),' for an\n(i.e. parses the entire data set in one operation). It can be called on "already loaded" data such as ',(0,o.jsx)(r.code,{children:"ArrayBuffer"})," and ",(0,o.jsx)(r.code,{children:"string"})," objects."]}),"\n",(0,o.jsxs)(r.p,{children:["In contrast to ",(0,o.jsx)(r.code,{children:"load"})," and ",(0,o.jsx)(r.code,{children:"parse"})," which parse a single file, the returned ",(0,o.jsx)(r.code,{children:"DataSource"})," is a a class instance that offers an API for querying additional data (such as tiles from a tile server)."]}),"\n",(0,o.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,o.jsxs)(r.p,{children:["The return value from ",(0,o.jsx)(r.code,{children:"fetch"})," or ",(0,o.jsx)(r.code,{children:"fetchFile"})," is a ",(0,o.jsx)(r.code,{children:"Promise"})," that resolves to the fetch ",(0,o.jsx)(r.code,{children:"Response"})," object and can be passed directly to the non-sync parser functions:"]}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-typescript",children:"import {createDataSource, parse} from '@loaders.gl/core';\nimport {OBJLoader} from '@loaders.gl/obj';\n\nconst source = await createDataSource(url, OBJLoader);\n// Application code here\n...\n"})}),"\n",(0,o.jsx)(r.p,{children:"Selection is supported."}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-typescript",children:"import {fetchFile, parseInBatches} from '@loaders.gl/core';\nimport {CSVLoader} from '@loaders.gl/obj';\n\nconst batchIterator = await createDataSource(url, CSVLoader);\nfor await (const batch of batchIterator) {\n  console.log(batch.length);\n}\n"})}),"\n",(0,o.jsx)(r.p,{children:"Handling errors"}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-typescript",children:"try {\n  const response = await fetch(url); // fetch can throw in case of network errors\n  const data = await parse(response); // parse will throw if server reports an error\n} catch (error) {\n  console.log(error);\n}\n"})}),"\n",(0,o.jsx)(r.h2,{id:"functions",children:"Functions"}),"\n",(0,o.jsx)(r.h3,{id:"createdatasourcedata-string--blob-sources-source-options-object--promisedatasource",children:"createDataSource(data: String | Blob, sources: Source[], options?: Object) : Promise<DataSource>"}),"\n",(0,o.jsxs)(r.p,{children:["Parses data asynchronously either using the provided source or sources, or using the pre-registered sources (see ",(0,o.jsx)(r.code,{children:"register-sources"}),")."]}),"\n",(0,o.jsxs)(r.ul,{children:["\n",(0,o.jsxs)(r.li,{children:["\n",(0,o.jsxs)(r.p,{children:[(0,o.jsx)(r.code,{children:"data"}),": loaded data or an object that allows data to be loaded. This parameter can be any of the following types:"]}),"\n",(0,o.jsxs)(r.ul,{children:["\n",(0,o.jsxs)(r.li,{children:[(0,o.jsx)(r.code,{children:"String"})," - Parse from text data in a string. (Only works for sources that support textual input)."]}),"\n",(0,o.jsxs)(r.li,{children:[(0,o.jsx)(r.code,{children:"File"})," - A browser file object (from drag-and-drop or file selection operations)."]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(r.li,{children:["\n",(0,o.jsxs)(r.p,{children:[(0,o.jsx)(r.code,{children:"sources"})," - can be a single source or an array of sources. If single source is provided, will force to use it. If ommitted, will use the list of pre-registered sources (see ",(0,o.jsx)(r.code,{children:"registerLoaders"}),")"]}),"\n"]}),"\n",(0,o.jsxs)(r.li,{children:["\n",(0,o.jsxs)(r.p,{children:[(0,o.jsx)(r.code,{children:"data"}),": loaded data or an object that allows data to be loaded. See table below for valid input types for this parameter."]}),"\n"]}),"\n",(0,o.jsxs)(r.li,{children:["\n",(0,o.jsxs)(r.p,{children:[(0,o.jsx)(r.code,{children:"sources"})," - can be a single source or an array of sources. If ommitted, will use the list of pre-registered sources (see ",(0,o.jsx)(r.code,{children:"registerLoaders"}),")"]}),"\n"]}),"\n",(0,o.jsxs)(r.li,{children:["\n",(0,o.jsxs)(r.p,{children:[(0,o.jsx)(r.code,{children:"options"}),": Passed to the data source."]}),"\n"]}),"\n",(0,o.jsxs)(r.li,{children:["\n",(0,o.jsxs)(r.p,{children:[(0,o.jsx)(r.code,{children:"url"}),": optional, assists in the autoselection of a source if multiple sources are supplied to ",(0,o.jsx)(r.code,{children:"source"}),"."]}),"\n"]}),"\n"]}),"\n",(0,o.jsx)(r.p,{children:"Returns:"}),"\n",(0,o.jsxs)(r.ul,{children:["\n",(0,o.jsx)(r.li,{children:"A valid data source or null."}),"\n"]}),"\n",(0,o.jsx)(r.p,{children:"Notes:"}),"\n",(0,o.jsx)(r.h3,{id:"createdatasourcesyncdata-string--blob-sources-source-options-object--promiseany",children:"createDataSourceSync(data: String | Blob, sources: Source[], options?: Object) : Promise<Any>"})]})}function u(e={}){const{wrapper:r}={...(0,t.a)(),...e.components};return r?(0,o.jsx)(r,{...e,children:(0,o.jsx)(d,{...e})}):d(e)}},11151:(e,r,s)=>{s.d(r,{Z:()=>a,a:()=>n});var o=s(67294);const t={},c=o.createContext(t);function n(e){const r=o.useContext(c);return o.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function a(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:n(e.components),o.createElement(c.Provider,{value:r},e.children)}}}]);