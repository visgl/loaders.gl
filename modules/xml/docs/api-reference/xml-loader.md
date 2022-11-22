# XMLLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
	<img src="https://img.shields.io/badge/-BETA-teal.svg" alt="BETA" />
</p>

The `XMLLoader` parses XML-encoded data.

| Loader                | Characteristic                                           |
| --------------------- | -------------------------------------------------------- |
| File Extension        | `.xml`                                                   |
| File Type             | Text                                                     |
| File Format           | [eXtensible Markup Language](https://www.w3.org/TR/xml/) |
| Data Format           | Free format data structure                               |
| Decoder Type          | Synchronous                                              |
| Worker Thread Support | No                                                       |
| Streaming Support     | No                                                       |

## Usage

```js
import {XMLLoader} from '@loaders.gl/xml';
import {load} from '@loaders.gl/core';

const data = await load(url, XMLLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
