export const IMAGES_DATA = [
  {
    formatName: 'Browser Native Formats (Uncompressed)',
    description:
      'Standard image formats. No mipmaps, need to be fully decompressed in GPU texture memory.',
    codeSample: 'load(url, ImageLoader)',
    images: [
      {format: 'JPG', src: 'shannon.jpg'},
      {format: 'GIF', src: 'shannon.gif'},
      {format: 'PNG', src: 'shannon.png'},
      {format: 'BMP', src: 'shannon.bmp'},
      {format: 'WEBP', src: 'shannon.webp'}
    ]
  },
  {
    formatName: 'S3 Texture Compression (WEBGL_compressed_texture_s3tc)',
    description: 'S3TC (aka DXTn, DXTC, or BCn).',
    availability: 'DXT5 is popular on desktop GPUs.',
    link: 'https://en.wikipedia.org/wiki/S3_Texture_Compression',
    codeSample: 'load(url, CompressedTextureLoader)',
    images: [
      {format: 'DXT1', src: 'shannon-dxt1.dds'},
      {format: 'DXT3', src: 'shannon-dxt3.dds'},
      {format: 'DXT5', src: 'shannon-dxt5.dds'}
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
        src: 'shannon-pvrtc-2bpp-rgb.pvr'
      },
      {
        format: 'PVRTC (2BPP RGBA)',
        src: 'shannon-pvrtc-2bpp-rgba.pvr'
      },
      {
        format: 'PVRTC (4BPP RGB)',
        src: 'shannon-pvrtc-4bpp-rgb.pvr'
      },
      {
        format: 'PVRTC (2BPP RGBA)',
        src: 'shannon-pvrtc-4bpp-rgba.pvr'
      }
    ]
  },
  {
    formatName: 'ATC (WEBGL_compressed_texture_atc)',
    codeSample: 'load(url, CompressedTextureLoader)',
    images: [
      {format: 'ATC (RGB)', src: 'shannon-atc-rgb.dds'},
      {
        format: 'ATC (RGBA, Explicit)',
        src: 'shannon-atc-rgba-explicit.dds'
      },
      {
        format: 'ATC (RGBA, Interpolated)',
        src: 'shannon-atc-rgba-interpolated.dds'
      }
    ]
  },
  {
    formatName: 'ASTN (WEBGL_compressed_texture_astn)',
    images: []
  },
  {
    formatName: 'ETC1 (WEBGL_compressed_texture_etc1)',
    images: [{format: 'ETC1', src: 'shannon-etc1.pvr'}]
  },
  {
    formatName: 'Crunch',
    description: 'Advanced DXTn texture compression library.',
    link: 'https://github.com/BinomialLLC/crunch',
    codeSample: 'load(url, CrunchLoader)',
    images: [
      {format: 'DXT1 (Crunch)', src: 'shannon-dxt1.crn'},
      {format: 'DXT5 (Crunch)', src: 'shannon-dxt5.crn'}
    ]
  },
  {
    formatName: 'Basis Universal',
    description: 'Supercompressed GPU Texture Codec',
    link: 'https://github.com/BinomialLLC/basis_universal',
    codeSample: 'load(url, BasisLoader)',
    images: [
      {format: 'BASIS', src: 'alpha3.basis'},
      {format: 'BASIS', src: 'kodim01.basis'},
      {format: 'BASIS', src: 'kodim18.basis'},
      {format: 'BASIS', src: 'kodim20_1024x1024.basis'},
      {format: 'BASIS', src: 'kodim20.basis'}
    ]
  }
];
