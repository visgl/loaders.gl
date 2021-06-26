import * as xlsx from 'xlsx';

// local table names cache with dataUrl/tableNames array key/values
const dataTableNamesMap = {};

/**
 * Gets local or remote Excel file data.
 * @param arrayBuffer Loaded data
 * @param options Data parse options.
 */
export async function parseExcel(arrayBuffer, options) {
  const excelOptions = options.excel || {};

  const dataUrl = 'dummy';
  // const dataFileType: string = dataUrl.substr(dataUrl.lastIndexOf('.')); // file extension

  // create Excel 'workbook'
  const workbook = xlsx.read(arrayBuffer, {
    type: 'array'
    // cellDates: true
  });

  // load data sheets
  let dataRows = [];
  dataTableNamesMap[dataUrl] = [];
  if (workbook.SheetNames.length > 0) {
    if (workbook.SheetNames.length > 1) {
      // cache sheet names
      dataTableNamesMap[dataUrl] = workbook.SheetNames;
      // eslint-ignore-next-line
      // console.debug(`getData(): file:  sheetNames:`, workbook.SheetNames);
    }

    // determine spreadsheet to load
    let sheetName = workbook.SheetNames[0];
    if (excelOptions.sheet && workbook.SheetNames.indexOf(excelOptions.sheet) >= 0) {
      // reset to requested table name
      sheetName = excelOptions.sheet;
    }

    // get worksheet data row objects array
    const worksheet = workbook.Sheets[sheetName];
    dataRows = xlsx.utils.sheet_to_json(worksheet);
  }

  return dataRows;
}
