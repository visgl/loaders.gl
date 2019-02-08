# ArrowLoader (Experimental)

A simple non-streaming loader for the Apache Arrow columnar table format.

| Loader                     | Characteristic |
| ---                        | ---            |
| File Extension             | `.arrow`       |
| File Format                | Binary         |
| Category                   | Columnar Table |
| Parser Type                | Synchronous    |
| Worker Thread Suitability  | Yes            |


References:
* For details on format see [Encapsulated message format](http://arrow.apache.org/docs/ipc.html).


## About Columnar Tables

Columnar tables are stored as one array per column. Columns that are numeric are loaded as typed arrays. These can be efficiently transferred from worker threads to main thread and also be directly uploaded to the GPU for further processing.


## Options

TBA

