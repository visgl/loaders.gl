import React, {type ComponentProps, type ReactNode} from 'react';
import clsx from 'clsx';
import {useDoc} from '@docusaurus/plugin-content-docs/client';

/**
 * Wraps markdown-rendered tables in a card-like scroll container for docs pages.
 */
export function MarkdownTable({
  className,
  children,
  ...tableProps
}: ComponentProps<'table'>): ReactNode {
  const {metadata} = useDoc()

  return (
    <div className="docs-markdown-table">
      <table {...tableProps} className={clsx('docs-markdown-table__table', className)}>
        {transformTableContent(children, metadata.title)}
      </table>
    </div>
  );
}

/**
 * Replaces generic loader spec table headers and normalizes common cell values.
 */
function transformTableContent(children: ReactNode, documentTitle: string): ReactNode {
  return React.Children.map(children, child => {
    if (!React.isValidElement(child)) {
      return child
    }

    if (child.type === 'thead') {
      const headChildren = React.Children.map(child.props.children, rowChild => {
        if (!React.isValidElement(rowChild) || rowChild.type !== 'tr') {
          return rowChild
        }

        const cells = React.Children.toArray(rowChild.props.children)
        const cellLabels = cells.map(getCellText)

        if (cellLabels.join('|') !== 'Loader|Characteristic') {
          return React.cloneElement(
            rowChild,
            rowChild.props,
            cells.map(cell => normalizeTableCellNode(cell))
          )
        }

        return React.cloneElement(
          rowChild,
          rowChild.props,
          <th colSpan={cells.length}>{documentTitle}</th>
        )
      })

      return React.cloneElement(child, child.props, headChildren)
    }

    if (child.type === 'tbody') {
      const bodyChildren = React.Children.map(child.props.children, rowChild => {
        if (!React.isValidElement(rowChild) || rowChild.type !== 'tr') {
          return rowChild
        }

        const cells = React.Children.toArray(rowChild.props.children)
        return React.cloneElement(
          rowChild,
          rowChild.props,
          cells.map(cell => normalizeTableCellNode(cell))
        )
      })

      return React.cloneElement(child, child.props, bodyChildren)
    }

    return child
  })
}

/**
 * Normalizes common boolean table values for docs presentation.
 */
function normalizeTableCellValue(node: ReactNode): ReactNode {
  const text = getCellText(node)

  if (text === 'Yes') {
    return '✅'
  }

  if (text === 'No') {
    return '❌'
  }

  return node
}

/**
 * Preserves the table cell element while normalizing its child text.
 */
function normalizeTableCellNode(node: ReactNode): ReactNode {
  if (!React.isValidElement(node)) {
    return normalizeTableCellValue(node)
  }

  return React.cloneElement(
    node,
    node.props,
    normalizeTableCellValue(node.props.children)
  )
}

/**
 * Returns plain text from one table header cell when possible.
 */
function getCellText(node: ReactNode): string {
  if (typeof node === 'string') {
    return node.trim()
  }

  if (typeof node === 'number') {
    return String(node)
  }

  if (!React.isValidElement(node)) {
    return ''
  }

  return React.Children.toArray(node.props.children).map(getCellText).join('').trim()
}
