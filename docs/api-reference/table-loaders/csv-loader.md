# CSVLoader (Experimental)

A simple non-streaming loader for the CSV columnar table format.

| Loader                     | Characteristic    |
| ---                        | ---               |
| File Extension             | `.csv`            |
| File Type                  | text              |
| Category                   | Table             |
| Parser Type                | Synchronous       |
| Worker Thread Overhead     | Depends on config |


## About Columnar Tables

Columnar tables are stored as one array per column. Columns that are numeric are loaded as typed arrays. These can be efficiently transferred from worker threads to main thread and also be directly uploaded to the GPU for further processing.


## Options

TBA
