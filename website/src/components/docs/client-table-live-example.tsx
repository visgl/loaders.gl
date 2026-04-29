import React, {Suspense} from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'

import type {TableLiveExampleConfig} from './table-live-example'

const TableLiveExample = React.lazy(() => import('./table-live-example'))

/**
 * Renders the table live example only in the browser.
 */
export function ClientTableLiveExample({
  config
}: {
  /** Table live example configuration. */
  config: TableLiveExampleConfig
}) {
  return (
    <BrowserOnly fallback={<p>Loading table preview...</p>}>
      {() => (
        <Suspense fallback={<p>Loading table preview...</p>}>
          <TableLiveExample config={config} />
        </Suspense>
      )}
    </BrowserOnly>
  )
}
