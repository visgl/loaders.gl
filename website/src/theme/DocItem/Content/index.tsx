import React, {type ComponentProps, type ReactNode} from 'react';
import {MDXProvider} from '@mdx-js/react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXComponents from '@theme/MDXComponents';
import {LoaderLiveExample} from '../../../components/docs/loader-live-example';
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

/**
 * Places the live example after title-adjacent badges, logos, and the first intro paragraph.
 */
function insertLoaderLiveExample(children: ReactNode, syntheticTitle: string | null): ReactNode[] {
  const nodes = React.Children.toArray(children)
  const beforeExample: ReactNode[] = []
  const afterExample: ReactNode[] = []
  let exampleInserted = false
  let sawRenderedTitle = Boolean(syntheticTitle)
  let introParagraphCount = 0

  for (const node of nodes) {
    if (!exampleInserted) {
      if (!sawRenderedTitle && isHeadingNode(node, 'h1')) {
        beforeExample.push(node)
        sawRenderedTitle = true
        continue
      }

      if (isBadgeParagraph(node) || isImageParagraph(node)) {
        beforeExample.push(node)
        continue
      }

      if (sawRenderedTitle && introParagraphCount === 0 && isPlainParagraph(node)) {
        beforeExample.push(node)
        introParagraphCount += 1
        continue
      }

      exampleInserted = true
      afterExample.push(node)
      continue
    }

    afterExample.push(node)
  }

  return [...beforeExample, <LoaderLiveExample key="loader-live-example" />, ...afterExample]
}

function isHeadingNode(node: ReactNode, tagName: string): boolean {
  return React.isValidElement(node) && node.type === tagName
}

function isParagraphNode(node: ReactNode): boolean {
  return React.isValidElement(node) && node.type === 'p'
}

function isBadgeParagraph(node: ReactNode): boolean {
  return (
    isParagraphNode(node) &&
    typeof node.props.className === 'string' &&
    node.props.className.split(' ').includes('badges')
  )
}

function isImageParagraph(node: ReactNode): boolean {
  if (!isParagraphNode(node)) {
    return false
  }

  return React.Children.toArray(node.props.children).some(
    child => React.isValidElement(child) && child.type === 'img'
  )
}

function isPlainParagraph(node: ReactNode): boolean {
  return isParagraphNode(node) && !isBadgeParagraph(node) && !isImageParagraph(node)
}

/**
 * Renders doc markdown and injects loader live examples after the page title.
 */
export default function DocItemContent({children}: Props): ReactNode {
  const syntheticTitle = useSyntheticTitle();
  const contentNodes = insertLoaderLiveExample(children, syntheticTitle)
  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
        </header>
      )}
      <DocsMDXContent>{contentNodes}</DocsMDXContent>
    </div>
  );
}
