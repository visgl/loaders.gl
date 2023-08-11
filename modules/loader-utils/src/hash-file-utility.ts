/** Element of hash array */
export type HashElement = {
  /** File name hash */
  hash: Buffer;
  /** File offset in the archive */
  offset: bigint;
};

/**
 * Comparing md5 hashes according to https://github.com/Esri/i3s-spec/blob/master/docs/2.0/slpk_hashtable.pcsl.md step 5
 * @param hash1 hash to compare
 * @param hash2 hash to compare
 * @returns -1 if hash1 < hash2, 0 of hash1 === hash2, 1 if hash1 > hash2
 */
export const compareHashes = (hash1: Buffer, hash2: Buffer): number => {
  const h1 = new BigUint64Array(hash1.buffer, hash1.byteOffset, 2);
  const h2 = new BigUint64Array(hash2.buffer, hash2.byteOffset, 2);

  const diff = h1[0] === h2[0] ? h1[1] - h2[1] : h1[0] - h2[0];

  if (diff < 0n) {
    return -1;
  } else if (diff === 0n) {
    return 0;
  }
  return 1;
};

/**
 * Reads hash file from buffer and returns it in ready-to-use form
 * @param hashFile - bufer containing hash file
 * @returns Array containing file info
 */
export const parseHashFile = (hashFile: ArrayBuffer): HashElement[] => {
  const hashFileBuffer = Buffer.from(hashFile);
  const hashArray: HashElement[] = [];
  for (let i = 0; i < hashFileBuffer.buffer.byteLength; i = i + 24) {
    const offsetBuffer = new DataView(
      hashFileBuffer.buffer.slice(
        hashFileBuffer.byteOffset + i + 16,
        hashFileBuffer.byteOffset + i + 24
      )
    );
    const offset = offsetBuffer.getBigUint64(offsetBuffer.byteOffset, true);
    hashArray.push({
      hash: Buffer.from(
        hashFileBuffer.subarray(hashFileBuffer.byteOffset + i, hashFileBuffer.byteOffset + i + 16)
      ),
      offset
    });
  }
  return hashArray;
};

/**
 * Binary search in the hash info
 * @param hashToSearch hash that we need to find
 * @returns required hash element or undefined if not found
 */
export const findBin = (
  hashToSearch: Buffer,
  hashArray: HashElement[]
): HashElement | undefined => {
  let lowerBorder = 0;
  let upperBorder = hashArray.length;

  while (upperBorder - lowerBorder > 1) {
    const middle = lowerBorder + Math.floor((upperBorder - lowerBorder) / 2);
    const value = compareHashes(hashArray[middle].hash, hashToSearch);
    if (value === 0) {
      return hashArray[middle];
    } else if (value < 0) {
      lowerBorder = middle;
    } else {
      upperBorder = middle;
    }
  }
  return undefined;
};
