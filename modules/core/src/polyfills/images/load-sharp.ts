// SPDX-License-Identifier: MIT

/** Loads the optional Node image codec only when image processing is requested. */
export async function loadSharp(): Promise<typeof import('sharp').default> {
  try {
    return (await import('sharp')).default;
  } catch (error) {
    throw new Error(
      "Node image decoding and encoding require the optional 'sharp' package. Install it with 'npm install sharp'.",
      {cause: error}
    );
  }
}
