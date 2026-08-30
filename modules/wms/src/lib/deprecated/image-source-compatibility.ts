// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageSource as ImageSourceContract} from '@loaders.gl/loader-utils';

/** Type-only image source capability retained by the WMS package. */
export type ImageSource = ImageSourceContract;

/**
 * Structural compatibility guard for deck.gl 9.x `instanceof ImageSource` checks.
 *
 * @deprecated `ImageSource` is a type-only capability contract. Do not construct or extend this
 * value; use it only for compatibility with deck.gl versions that still perform the legacy check.
 */
export const ImageSource = {
  /** Recognizes the image-source capability without requiring a shared implementation class. */
  [Symbol.hasInstance](value: unknown): value is ImageSourceContract {
    return Boolean(
      value &&
        (typeof value === 'object' || typeof value === 'function') &&
        'getMetadata' in value &&
        typeof value.getMetadata === 'function' &&
        'getImage' in value &&
        typeof value.getImage === 'function'
    );
  }
};
