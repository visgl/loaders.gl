import React, {Suspense} from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'

import type {StructuredDataLiveExampleConfig} from './structured-data-live-example'

const StructuredDataLiveExample = React.lazy(() => import('./structured-data-live-example'))

/**
 * Renders the structured-data live example only in the browser.
 */
export function ClientStructuredDataLiveExample({
  config
}: {
  /** Structured-data live example configuration. */
  config: StructuredDataLiveExampleConfig
}) {
  return (
    <BrowserOnly fallback={<p>Loading structured data preview...</p>}>
      {() => (
        <Suspense fallback={<p>Loading structured data preview...</p>}>
          <StructuredDataLiveExample config={config} />
        </Suspense>
      )}
    </BrowserOnly>
  )
}
