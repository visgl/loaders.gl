// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {openZipArchive} from '@loaders.gl/archives/zip';
import type {ZipArchiveInput, ZipEntry} from '@loaders.gl/archives/zip';

/** Reads small archive fixtures with complete size/CRC validation and closes their transport. */
export async function readZip(input: ZipArchiveInput): Promise<{
  /** Validated records, in archive directory order. */
  entries: ZipEntry[];
  /** Completed CRC-verified bytes, including empty directories. */
  files: Record<string, ArrayBuffer>;
  /** Archive-level comment. */
  comment: string;
}> {
  const archive = await openZipArchive(input);
  try {
    const entries: ZipEntry[] = [];
    const files: Record<string, ArrayBuffer> = Object.create(null);
    for await (const entry of archive.entries()) {
      entries.push(entry);
      files[entry.path] = await archive.read(entry);
    }
    return {entries, files, comment: archive.comment};
  } finally {
    await archive.close();
  }
}
