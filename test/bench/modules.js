// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Override aliases to point to publicly accessible github
// TODO maybe setPathPrefix is enough?
import ALIASES from '../../test/aliases';
import {_addAliases} from '@loaders.gl/loader-utils';

import imageBench from '@loaders.gl/images/test/images.bench';
import coreBench from '@loaders.gl/core/test/core.bench';
import csvBench from '@loaders.gl/csv/test/csv.bench';
import jsonBench from '@loaders.gl/json/test/json-loader.bench';
// import dracoBench from '@loaders.gl/draco/test/draco.bench';

import cryptoBench from '@loaders.gl/crypto/test/crypto.bench';

_addAliases(ALIASES);

export async function addModuleBenchmarksToSuite(suite) {
  // add tests
  await imageBench(suite);
  await cryptoBench(suite);

  // await dracoBench(suite); - does not build in website
  await csvBench(suite);
  await jsonBench(suite);
  await coreBench(suite);
}
