import React from 'react';
import styled from 'styled-components';
import {HtmlClassNameProvider} from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';

const DemoContainer = styled.div`
position: absolute;
overflow: auto !important;
left: 0;
right: 0;
top: 0;
bottom: 0;

`

/** Passed to @docusaurus/plugin-content-docs to render the mdx content */
export default function({content, route}) {
  const MDXComponent = content;
  const indexPath = useBaseUrl('/examples');
  const htmlClassName = route.path === indexPath ? 'examples-index-page' : 'examples-demo-page';

  return (
    <HtmlClassNameProvider className={htmlClassName}>
      {route.path === indexPath ? (
        <div key="index">
          <MDXComponent />
        </div>
      ) : (
        <DemoContainer key="demo">
          <MDXComponent />
        </DemoContainer>
      )}
    </HtmlClassNameProvider>
  );
}
