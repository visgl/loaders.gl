import React, {type ReactNode} from 'react';
import {HtmlClassNameProvider} from '@docusaurus/theme-common';
import {DocProvider} from '@docusaurus/plugin-content-docs/client';
import DocItemMetadata from '@theme/DocItem/Metadata';
import DocItemLayout from '@theme/DocItem/Layout';
import type {Props} from '@theme/DocItem';

/**
 * Main docs item wrapper that keeps the default Docusaurus layout while enabling loaders.gl docs extensions.
 */
export default function DocItem(props: Props): ReactNode {
  const usesDesignedReadingLayout = props.content.frontMatter.page_style === 'designed';
  const docHtmlClassName = [
    `docs-doc-id-${props.content.metadata.id}`,
    usesDesignedReadingLayout && 'docs-designed-page'
  ]
    .filter(Boolean)
    .join(' ');
  const MDXComponent = props.content;
  return (
    <DocProvider content={props.content}>
      <HtmlClassNameProvider className={docHtmlClassName}>
        <DocItemMetadata />
        <DocItemLayout>
          <MDXComponent />
        </DocItemLayout>
      </HtmlClassNameProvider>
    </DocProvider>
  );
}
