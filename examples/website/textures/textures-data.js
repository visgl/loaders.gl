export const IMAGES_DATA = [
  {
    formatName: 'Browser Native Formats (Uncompressed)',
    description:
      'Standard image formats. No mipmaps, need to be fully decompressed in GPU texture memory.',
    codeSample: 'load(url, ImageLoader)',
    images: [
      {format: 'JPG', src: 'shannon.jpg', size: 99488},
      {format: 'GIF', src: 'shannon.gif', size: 133577},
      {format: 'PNG', src: 'shannon.png', size: 463987},
      {format: 'BMP', src: 'shannon.bmp', size: 786488},
      {format: 'WEBP', src: 'shannon.webp', size: 33378}
    ]
  },
  {
    formatName: 'S3 Texture Compression (WEBGL_compressed_texture_s3tc)',
    description: 'S3TC (aka DXTn, DXTC, or BCn).',
    availability: 'DXT5 is popular on desktop GPUs.',
    link: 'https://en.wikipedia.org/wiki/S3_Texture_Compression',
    codeSample: 'load(url, CompressedTextureLoader)',
    images: [
      {format: 'DXT1', src: 'shannon-dxt1.dds', size: 174904},
      {format: 'DXT3', src: 'shannon-dxt3.dds', size: 262272},
      {format: 'DXT5', src: 'shannon-dxt5.dds', size: 349680}
    ]
  },
  {
    formatName: 'PowerVR Texture Compression (WEBGL_compressed_texture_pvrtc)',
    description: 'Lossy, fixed-rate GPU texture compression format',
    availability:
      'Mobile devices with PowerVR chipsets, including iPhone, iPod Touch and iPad and certain Android devices.',
    link: 'https://en.wikipedia.org/wiki/PVRTC',
    codeSample: 'load(url, CompressedTextureLoader)',
    images: [
      {
        format: 'PVRTC (2BPP RGB)',
        src: 'shannon-pvrtc-2bpp-rgb.pvr',
        size: 87555
      },
      {
        format: 'PVRTC (2BPP RGBA)',
        src: 'shannon-pvrtc-2bpp-rgba.pvr',
        size: 87555
      },
      {
        format: 'PVRTC (4BPP RGB)',
        src: 'shannon-pvrtc-4bpp-rgb.pvr',
        size: 174915
      },
      {
        format: 'PVRTC (2BPP RGBA)',
        src: 'shannon-pvrtc-4bpp-rgba.pvr',
        size: 174915
      }
    ]
  },
  {
    formatName: 'ATC (WEBGL_compressed_texture_atc)',
    codeSample: 'load(url, CompressedTextureLoader)',
    images: [
      {format: 'ATC (RGB)', src: 'shannon-atc-rgb.dds', size: 131200},
      {
        format: 'ATC (RGBA, Explicit)',
        src: 'shannon-atc-rgba-explicit.dds',
        size: 262272
      },
      {
        format: 'ATC (RGBA, Interpolated)',
        src: 'shannon-atc-rgba-interpolated.dds',
        size: 262272
      }
    ]
  },
  {
    formatName: 'ASTN (WEBGL_compressed_texture_astn)',
    images: []
  },
  {
    formatName: 'ETC1 (WEBGL_compressed_texture_etc1)',
    images: [{format: 'ETC1', src: 'shannon-etc1.pvr', size: 174843}]
  },
  {
    formatName: 'Crunch',
    description: 'Advanced DXTn texture compression library.',
    link: 'https://github.com/BinomialLLC/crunch',
    codeSample: 'load(url, CrunchLoader)',
    images: [
      {format: 'DXT1 (Crunch)', src: 'shannon-dxt1.crn', size: 63186},
      {format: 'DXT5 (Crunch)', src: 'shannon-dxt5.crn', size: 71722}
    ]
  },
  {
    formatName: 'Basis Universal',
    description: 'Supercompressed GPU Texture Codec',
    link: 'https://github.com/BinomialLLC/basis_universal',
    codeSample: 'load(url, BasisLoader)',
    images: [
      {format: 'BASIS', src: 'alpha3.basis', size: 148691},
      {format: 'BASIS', src: 'kodim01.basis', size: 95914},
      {format: 'BASIS', src: 'kodim18.basis', size: 2143},
      {format: 'BASIS', src: 'kodim20_1024x1024.basis', size: 90783},
      {format: 'BASIS', src: 'kodim20.basis', size: 52496}
    ]
  }
];
