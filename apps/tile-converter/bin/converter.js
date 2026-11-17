#!/usr/bin/env node
import {printConverterVersion} from './converter-version.js';

if (!printConverterVersion('legacy-v4')) {
  await import('../dist/converter.min.cjs');
}
