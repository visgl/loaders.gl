import {describe, expect, test} from 'vitest';
import {ArrayBufferFile} from '../../../src/lib/files/array-buffer-file';
import {FileProvider} from '../../../src/lib/file-provider/file-provider';

describe('FileProvider', () => {
  test('reads primitive values and slices an in-memory file', async () => {
    const bytes = new Uint8Array(16);
    const view = new DataView(bytes.buffer);
    view.setUint8(0, 0xab);
    view.setUint16(2, 0x1234, true);
    view.setUint32(4, 0x89abcdef, true);
    view.setBigInt64(8, 0x0102030405060708n, true);
    const provider = await FileProvider.create(new ArrayBufferFile(bytes.buffer));

    expect(provider.length).toBe(16n);
    expect(await provider.getUint8(0)).toBe(0xab);
    expect(await provider.getUint16(2)).toBe(0x1234);
    expect(await provider.getUint32(4)).toBe(0x89abcdef);
    expect(await provider.getBigUint64(8)).toBe(0x0102030405060708n);
    expect(new Uint8Array(await provider.slice(4, 8))).toEqual(bytes.slice(4, 8));
  });

  test('derives size from numeric size and stat fallbacks', async () => {
    const numericSizeFile = createReadableFile({size: 7});
    const statSizeFile = createReadableFile({statBigsize: 9n});

    await expect(FileProvider.create(numericSizeFile)).resolves.toHaveProperty('length', 7n);
    await expect(FileProvider.create(statSizeFile)).resolves.toHaveProperty('length', 9n);
  });

  test('rejects mutation and unsafe or empty reads', async () => {
    const provider = await FileProvider.create(new ArrayBufferFile(new ArrayBuffer(0)));

    await expect(provider.truncate(0)).rejects.toThrow('cannot be changed');
    await expect(provider.append(new Uint8Array())).rejects.toThrow('cannot be changed');
    await expect(provider.destroy()).rejects.toThrow('cannot be changed');
    await expect(provider.getUint8(0)).rejects.toThrow('something went wrong');
    await expect(provider.getUint16(0)).rejects.toThrow('something went wrong');
    await expect(provider.getUint32(0)).rejects.toThrow('something went wrong');
    await expect(provider.getBigUint64(0)).rejects.toThrow('something went wrong');
    await expect(provider.slice(0n, BigInt(Number.MAX_SAFE_INTEGER) + 1n)).rejects.toThrow(
      'too big slice'
    );
  });
});

/** Creates a minimal readable file for size-discovery coverage. */
function createReadableFile(options: {size?: number; statBigsize?: bigint}) {
  return {
    handle: null,
    size: options.size || 0,
    bigsize: 0n,
    url: '',
    async read(): Promise<ArrayBuffer> {
      return new ArrayBuffer(0);
    },
    async stat() {
      return {
        size: Number(options.statBigsize || 0n),
        bigsize: options.statBigsize || 0n,
        isDirectory: false
      };
    },
    async close(): Promise<void> {}
  };
}
