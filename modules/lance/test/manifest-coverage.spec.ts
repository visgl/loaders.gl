import {expect, test} from 'vitest';
import {parseLanceManifest} from '../src/lance-manifest';
import {LanceSourceLoader} from '../src/lance-source-loader';

function varint(value: number): number[] {
  const bytes: number[] = [];
  do {
    let byte = value & 0x7f;
    value >>>= 7;
    if (value) byte |= 0x80;
    bytes.push(byte);
  } while (value);
  return bytes;
}

function field(number: number, value: number | number[]): number[] {
  const bytes = varint(number << 3);
  return [...bytes, ...(Array.isArray(value) ? value : varint(value))];
}

function bytesField(number: number, value: number[]): number[] {
  return [...varint((number << 3) | 2), ...varint(value.length), ...value];
}

function stringField(number: number, value: string): number[] {
  return bytesField(number, Array.from(new TextEncoder().encode(value)));
}

function createManifest(): Uint8Array {
  const fieldMessage = [
    ...field(1, 2),
    ...stringField(2, 'temperature'),
    ...field(3, 7),
    ...field(4, 0),
    ...stringField(5, 'float32'),
    ...field(6, 1),
    0x49,
    ...new Array(8).fill(0)
  ];
  const dataFile = [
    ...stringField(1, 'fragment.lance'),
    ...field(2, 7),
    ...bytesField(2, [8, 9]),
    ...field(4, 1),
    ...field(5, 2),
    ...field(6, 123),
    ...field(7, 4)
  ];
  const fragment = [...field(1, 3), ...bytesField(2, dataFile), ...field(4, 12)];
  const dataFormat = [...stringField(1, 'lance'), ...stringField(2, '2.0')];
  return Uint8Array.from([
    ...bytesField(1, fieldMessage),
    ...bytesField(2, fragment),
    ...field(3, 9),
    ...field(9, 5),
    ...bytesField(15, dataFormat),
    0x2d,
    1,
    2,
    3,
    4
  ]);
}

test('parseLanceManifest decodes optional fields, packed ids, and skipped protobuf fields', () => {
  const manifest = parseLanceManifest(createManifest());

  expect(manifest.version).toBe(9);
  expect(manifest.readerFeatureFlags).toBe(5);
  expect(manifest.dataFormat).toEqual({fileFormat: 'lance', version: '2.0'});
  expect(manifest.fields[0]).toEqual({
    type: 2,
    name: 'temperature',
    id: 7,
    parentId: 0,
    logicalType: 'float32',
    nullable: true
  });
  expect(manifest.fragments[0]).toEqual({
    id: 3,
    physicalRows: 12,
    files: [
      {
        path: 'fragment.lance',
        fieldIds: [7, 8, 9],
        fileMajorVersion: 1,
        fileMinorVersion: 2,
        fileSizeBytes: 123,
        baseId: 4
      }
    ]
  });
});

test('LanceSource resolves latest and explicit manifest URLs', async () => {
  const manifest = createManifest();
  const fetch = async (url: string) => {
    if (url.endsWith('latest_version_hint.json'))
      return new Response(JSON.stringify({version: 9}), {status: 200});
    return new Response(manifest, {status: 200});
  };

  const latestSource = LanceSourceLoader.createDataSource('https://example.com/table.lance/', {
    core: {loadOptions: {core: {fetch}}}
  } as any);
  expect((await latestSource.getMetadata()).manifestURL).toBe(
    'https://example.com/table.lance/_versions/9.manifest'
  );

  const explicitSource = LanceSourceLoader.createDataSource('https://example.com/table.lance', {
    lance: {version: 4},
    core: {loadOptions: {core: {fetch}}}
  } as any);
  expect((await explicitSource.getMetadata()).manifestURL).toBe(
    'https://example.com/table.lance/_versions/4.manifest'
  );
});

test('LanceSource reports manifest discovery and HTTP failures', async () => {
  const failingFetch = async () => new Response('missing', {status: 404});
  const source = LanceSourceLoader.createDataSource('https://example.com/table.lance', {
    core: {loadOptions: {core: {fetch: failingFetch}}}
  } as any);

  await expect(source.getMetadata()).rejects.toThrow(
    'Unable to discover the latest Lance manifest'
  );

  const invalidHintSource = LanceSourceLoader.createDataSource('https://example.com/table.lance', {
    core: {
      loadOptions: {
        core: {fetch: async () => new Response(JSON.stringify({}), {status: 200})}
      }
    }
  } as any);
  await expect(invalidHintSource.getMetadata()).rejects.toThrow('does not contain a version');
});
