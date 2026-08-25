This standalone web app executes one portable table query through two physical backends:

- a canonical Arrow table queried directly with `queryArrowTable()`;
- DuckDB-Wasm queried through `DuckDBSQLSource` and generated parameterized SQL.

The example starts on the Arrow backend. DuckDB and its one-time table ingestion are initialized
only when the DuckDB backend is selected and run.

### Usage

```bash
yarn
yarn start
```

Build the example with:

```bash
yarn build
```
