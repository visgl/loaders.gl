#!/usr/bin/env node
import {printConverterVersion} from './converter-version.js';

if (!printConverterVersion('v5')) {
  await import('../dist/v5/converter-cli.js');
}
