/**
 * Header describing a NetDCF file
 * @param recordDimension: Number with the length of record dimension
 * @param dimensions: List of dimensions
 * @param attributes: List of global attributes
 * @param variables: List of variables
 */
export type NetCDFHeader = {
  version: number;
  recordDimension: NetCDFRecordDimension;
  dimensions: NetCDFDimension[];
  attributes: NetCDFAttribute[];
  variables: NetCDFVariable[];
};

/**
 * Metadata for the record dimension
 * @param length Number of elements in the record dimension
 * @param id Id in the list of dimensions for the record dimension
 * @param name  name of the record dimension
 * @param recordStep the record variables step size
 */
export type NetCDFRecordDimension = {
  length: number;
  id: number; // id of the unlimited dimension
  name: string; // name of the unlimited dimension
  recordStep: number;
};

/**
 * `dimensions` is an array of dimension objects:
 * @param name name of the dimension
 * @param size size of the dimension
 * @param recordId: id of the dimension that has unlimited size or undefined,
 * @param recordName: name of the dimension that has unlimited size
 */
export type NetCDFDimension = {
  name: string;
  size: number;
  recordId: number;
  recordName: string;
};

/**
 * Number of recordStep and list of variables with:
 * @param name String with the name of the variable
 * @param dimensions Array with the dimension IDs of the variable
 * @param attributes Array with the attributes of the variable
 * @param type String with the type of the variable
 * @param size Number with the size of the variable
 * @param offset Number with the offset where of the variable begins
 * @param record True if is a record variable, false otherwise (unlimited size)
 */
export type NetCDFVariable = {
  name: string;
  dimensions: [];
  attributes: [];
  type: string;
  size: number;
  offset: number;
  record: boolean;
};

/**
 * @param name name of the attribute
 * @param type type of the attribute
 * @param value number or string with the value of the attribute
 */
export type NetCDFAttribute = {
  name: string;
  type: string;
  value: string;
};
