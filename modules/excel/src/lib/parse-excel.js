import * as xlsx from 'xlsx';

// local table names cache with dataUrl/tableNames array key/values
const dataTableNamesMap = {};

/**
 * Gets local or remote Excel file data.
 * @param arrayBuffer Loaded data
 * @param options Data parse options.
 * @param context Load data callback.
 */
export async function parseExcel(arrayBuffer, options, context) {
  const dataUrl = 'dummy';
  // const dataFileType: string = dataUrl.substr(dataUrl.lastIndexOf('.')); // file extension

  // create Excel 'workbook'
  debugger
  const workbook = xlsx.read(arrayBuffer, {
    cellDates: true
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
    if (options.dataTable.length > 0 && workbook.SheetNames.indexOf(options.dataTable) >= 0) {
      // reset to requested table name
      sheetName = options.dataTable;
    }

    // get worksheet data row objects array
    const worksheet = workbook.Sheets[sheetName];
    dataRows = xlsx.utils.sheet_to_json(worksheet);

    // create json data file for binary Excel file text data preview
    /*
    if (options.createJsonFiles && config.supportedBinaryDataFiles.test(dataFileName)) {
      // create json data file path
      let jsonFilePath = dataUrl.replace(dataFileType, '.json');
      if (options.dataTable.length > 0 && workbook.SheetNames.length > 1) {
        // append table name to the generated json data file name
        jsonFilePath = jsonFilePath.replace('.json', `-${options.dataTable}.json`);
      }
      // if (!fs.existsSync(jsonFilePath)) {
      //   fileUtils.createJsonFile(jsonFilePath, dataRows);
      // }
    }
    */
  }

  return dataRows;
}
