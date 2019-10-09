# Managing Dependencies

> This section is work in progress, not all options are implemented/finalized

Parsers and encoders for some formats are quite complex and can be quite big in terms of code size.

### Loading Dependencies from Alternate CDN

By default, loaders.gl loads pre-built workers and a number of bigger external libraries from the [https://unpkg.com/](https://unpkg.com/) CDN.

It is possible to specify other CDNs using `options.cdn`.

Keep in mind that it is typically not sufficient to point to a server that just serves the data of the files in question. Browsers do a number of security checks on cross-origin content and requires certain response headers to be properly set, and unfortunately, error messages are not always helpful.

To determine your candidate CDN service is doing what is needed, check with `curl -u <url>` and look for headers like:

```
content-type: application/javascript; charset=utf-8
access-control-allow-origin: *
```

### Loading Dependencies from Your Own Server

By setting `options.cdn: false` and doing some extra setup, you can load dependencies from your own server. This removes the impact of a potentially flaky CDN.

Options:

- Load from `node_modules/@loaders.gl/<module>/dist/libs/...`
- Load from a modules directory `libs/...`
- Load from unique locations - `options.modules[<dependency name>]` can be set to url strings.

### Bundling Dependencies

It is also possible to include dependencies in your application bundle

- PRO: Doesn't require copying/configuring/serving supporting modules.
- CON: Increases the size of your application bundle

`options.modules` will let your application `import` or `require` dependencies (thus bundling them) and supply them to loaders.gl.

See each loader module for information on its dependencies.

Example: bundling the entire `draco3d` library:

```js
import draco from 'draco3d';
import {setLoaderOptions} from '@loaders.gl/core';
setLoaderOptions({
  modules: {
    draco3d
  }
});
```
