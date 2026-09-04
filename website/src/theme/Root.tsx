import React from 'react';
import {installWorkerHMR} from '../shims/loadersgl-worker-hmr';

installWorkerHMR();

/** Adds the website root while allowing development-only worker cleanup on HMR. */
export default function Root({children}: {children: React.ReactNode}) {
  return <>{children}</>;
}
