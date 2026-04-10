# Extracting Data

While keeping data in Arrow format enables efficient operations, there are many cases where you need native JavaScript values.

## Converting Data

Many Arrow classes support:

- `toArray()` — typically returns a typed array or array.
- `toJSON()` — JSON-style values.
- `toString()` — printable representation.

## Extracting Data by Row

Get a temporary object representing a row in a table.

```typescript
const row = table.get(0);
```

Rows do not retain a schema reference. Access by index or use row object helpers such as `toJSON()`.

## Extracting Data by Column

Get a column vector by name.

```typescript
const column = table.getChild('data');
```

```typescript
const array = table.getChild('columnName')?.toArray();
```

## Extracting data by Column and Batch

A low-copy approach is to iterate through chunks and read per-chunk typed arrays when tables are chunked.
