# Apache Arrow

loaders.gl is adding support for Apache Arrow as its standard in-memory representation of tables.

loaders.gl provides an `ArrowLoader` and an `ArrowWriter` that load and write Arrow files.

An increasing subset of tabular loaders can parse various formats directly into in-memory Arrow tables, and writers can write in-memory Arrow tables to those formats.

## Apache Arrow JS library

To work effectively with in-memory Apache Arrow data, a library is needed, and loaders.gl integrates with the official Apache Arrow JS `apache-arrow` package.

A subset of modules that import the Apache Arrow JS library:

- `@loaders.gl/arrow`
- `@loaders.gl/geoarrow`
- `@loaders.gl/parquet`
- `@loaders.gl/schema`
- `@loaders.gl/schema-utils`

### Apache Arrow JS versions

Currently, all loaders.gl modules that use Apache Arrow are designed to work with:

- `apache-arrow: ">= 17.0.0"`

These semver specifications are designed to deduplicate: if the application specifies an `apache-arrow` version that satisfies the version condition, all the loaders.gl modules should be linked with that library. This allows applications to control which Arrow version they want to have installed by adding a specific version to their own package.json `dependencies` section.

Note that future loaders.gl versions may drop support for older versions if compatibility issues require it.

With a clean install (`rm -rf node_modules package-lock.json yarn.lock` and reinstall), the latest version of `apache-arrow` is automatically installed.

You may still want to specify `apache-arrow` explicitly in your app to avoid being pinned down by lock files etc.

### Recommended install pattern

```bash
npm install apache-arrow @loaders.gl/core @loaders.gl/arrow
# plus any other loaders you use
```

or:

```bash
yarn add apache-arrow @loaders.gl/core @loaders.gl/arrow
```

### Troubleshooting

If you suspect version conflicts or duplicate apache-arrow versions in your application:

- Add `apache-arrow` as an explicitly top-level dependency in your app
- Try a clean reinstall after lockfile cleanup
- Align dependent packages to the same major/minor family of Arrow where possible

Most package managers have a way to check a dependency:

```bash
$ yarn why apache-arrow
├─ @loaders.gl/arrow@workspace:modules/arrow [c7e01]
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/arrow@workspace:modules/arrow
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/geoarrow@workspace:modules/geoarrow [49c26]
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/geoarrow@workspace:modules/geoarrow [eeaaa]
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/geoarrow@workspace:modules/geoarrow
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/schema-utils@workspace:modules/schema-utils [3820d]
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/schema-utils@workspace:modules/schema-utils [b9e22]
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/schema-utils@workspace:modules/schema-utils
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
└─ @loaders.gl/schema@workspace:modules/schema
   └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
```