// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const ERROR_TEST_CASES: {xml: string; parsed: string}[] = [
  {
    parsed: 'missing parameters [\'version\', \'layer\', \'format\']',
    xml: `\
<?xml version="1.0"?>
<!DOCTYPE ServiceExceptionReport SYSTEM "http://schemas.opengis.net/wms/1.1.1/exception_1_1_1.dtd">
<ServiceExceptionReport version="1.1.1">
    <ServiceException>missing parameters ['version', 'layer', 'format']</ServiceException>
</ServiceExceptionReport>
`
  }
];
