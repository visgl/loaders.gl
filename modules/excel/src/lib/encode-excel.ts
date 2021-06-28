// import * as xlsx from 'xlsx';

/**
   * Saves JSON data in Excel format for html, ods, xml, xlsb and xlsx file types.
   * @param filePath Local data file path.
   * @param fileData Raw data to save.
   * @param tableName Table name for data files with multiple tables support.
   * @param showData Show saved data callback.
   *
  public saveData(filePath: string, fileData: any, tableName: string, showData?: Function): void {
    const fileType: string = filePath.substr(filePath.lastIndexOf('.'));
    fileData = this.jsonToExcelData(fileData, fileType, tableName);
    if ( fileData.length > 0) {
      // TODO: change this to async later
      fs.writeFile(filePath, fileData, (error) => showData(error));
    }
  }

  /**
   * Converts JSON data to Excel data formats.
   * @param jsonData Json data to convert.
   * @param bookType Excel data file/book type.
   *
  private jsonToExcelData(jsonData: any, fileType: string, tableName: string): any {
    console.debug('jsonToExcelData(): creating excel data:', fileType);

    // create new workbook
    const workbook = xlsx.utils.book_new();

    // convert json data to worksheet format
    const worksheet = xlsx.utils.json_to_sheet(jsonData, {
      //header: JSON.parse(this._viewConfig.columns)
    });

    // append worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, tableName);

    // get text data string or binary spreadsheet data buffer
    let data: any = '';
    if (fileType === 'html' || fileType === 'xml') {
      data = xlsx.write(workbook, {
        type: 'string',
        compression: false,
        bookType: getBookType(fileType)
      });
    } else {
      data = xlsx.write(workbook, {
        type: 'buffer',
        compression: true, // use zip compression for zip-based formats
        bookType: getBookType(fileType)
      });
    }
    return data;
  }


}

/**
 * Converts file type to Excel book type.
 * @param {string} fileType File type: .html, .ods, .xml, .xlsb, .xlsx, etc.
 * @returns {xlsx.BookType}
 *
function getBookType(fileType) {
  // TODO: must be a better way to do this string to type conversion :)
  switch (fileType) {
    case '.html':
      return 'html';
    case '.ods':
      return 'ods';
    case '.xml':
      return 'xlml';
    case '.xlsb':
      return 'xlsb';
    case '.xlsx':
      return 'xlsx';
    default:
      return 'xlsb';
  }
}
*/
