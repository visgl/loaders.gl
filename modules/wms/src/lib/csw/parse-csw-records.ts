// loaders.gl, MIT license

import {XMLLoaderOptions, convertXMLFieldToArrayInPlace} from '@loaders.gl/xml';
import {XMLLoader} from '@loaders.gl/xml';
import {parseExceptionReport} from './parse-exception-report';

export type CSWRecords = {
  searchStatus: {
    timestamp?: string;
  };
  searchResults: {
    numberOfRecordsMatched: number;
    numberOfRecordsReturned: number;
    elementSet: string;
    nextRecord: number;
  };
  records: {
    type: string;
    title: string;
    abstract: string;
    subject: string[];
    boundingBoxes: {
      crs: string;
      value: [number, number, number, number];
    }[];
    references: {
      value: string;
      scheme: string;
    }[];
  }[];
};

/**
 * Parses a typed data structure from raw XML for `GetRecords` response
 * @note Error handlings is fairly weak
 */
export function parseCSWRecords(text: string, options?: XMLLoaderOptions): CSWRecords {
  const parsedXML = XMLLoader.parseTextSync(text, {
    ...options,
    xml: {
      ...options?.xml,
      removeNSPrefix: true,
      uncapitalizeKeys: true,
      arrayPaths: []
    },
    _fastXML: {
      ...options?._fastXML,
      parseAttributeValue: true
    }
  });

  parseExceptionReport(parsedXML);

  const xmlRecords: any = parsedXML.getRecordsResponse;

  // Move results to top
  const elementSet = xmlRecords.searchResults.elementSet;
  const recordsFieldName = `${elementSet}Record`;
  xmlRecords.records = xmlRecords.searchResults[recordsFieldName];
  delete xmlRecords.searchResults[recordsFieldName];

  convertXMLFieldToArrayInPlace(xmlRecords, 'records');

  for (const record of xmlRecords.records) {
    record.boundingBoxes = record.boundingBox;
    delete record.boundingBox;

    convertXMLFieldToArrayInPlace(record, 'boundingBoxes');

    for (const boundingBox of record.boundingBoxes) {
      boundingBox.value = [
        boundingBox.upperCorner[0],
        boundingBox.upperCorner[1],
        boundingBox.lowerCorner[0],
        boundingBox.lowerCorner[1]
      ];
      delete boundingBox.upperCorner;
      delete boundingBox.lowerCorner;
    }
  }

  return xmlRecords as CSWRecords;
}

export function renameXMLTags(xml: any, renameKeys: Record<string, string>): void {
  for (const [oldKey, newKey] of Object.entries(renameKeys)) {
    xml[newKey] = xml[oldKey];
    delete xml[oldKey];
  }
}
