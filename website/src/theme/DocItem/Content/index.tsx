import React, {type ComponentProps, type ReactNode} from 'react';
import {MDXProvider} from '@mdx-js/react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXComponents from '@theme/MDXComponents';
import {MarkdownTable} from '../../../components/docs/markdown-table';
import type {Props} from '@theme/DocItem/Content';

/**
 * Returns the Docusaurus synthetic title when the doc content does not include its own title.
 */
function useSyntheticTitle(): string | null {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender = !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

/**
 * Provides MDX components used by loaders.gl docs pages.
 */
function DocsMDXContent({children}: {children: ReactNode}): ReactNode {
  const MDXHeading =
    MDXComponents.h1 ?? ((props: ComponentProps<'h1'>) => <Heading as="h1" {...props} />);

  const components = {
    ...MDXComponents,
    h1: (props: ComponentProps<'h1'>) => <MDXHeading {...props} />,
    table: (props: ComponentProps<'table'>) => <MarkdownTable {...props} />
  };

  return <MDXProvider components={components}>{children}</MDXProvider>;
}

/** Renders the document content with the shared markdown table treatment. */
export default function DocItemContent({children}: Props): ReactNode {
  const syntheticTitle = useSyntheticTitle();
  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
        </header>
      )}
      <DocsMDXContent>{children}</DocsMDXContent>
    </div>
  );
}
