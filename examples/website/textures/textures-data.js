export const IMAGES_DATA = [
  {
    formatName: 'Browser Native Formats (Uncompressed)',
    images: [
      {format: 'JPG', src: 'compressed-textures/shannon.jpg', size: 99488},
      {format: 'GIF', src: 'compressed-textures/shannon.gif', size: 133577},
      {format: 'PNG', src: 'compressed-textures/shannon.png', size: 463987},
      {format: 'BMP', src: 'compressed-textures/shannon.bmp', size: 786488},
      {format: 'WEBP', src: 'compressed-textures/shannon.webp', size: 33378}
    ]
  },
  {
    formatName: 'WEBGL_compressed_texture_s3tc',
    images: [
      {format: 'DXT1', src: 'compressed-textures/shannon-dxt1.dds', size: 174904},
      {format: 'DXT3', src: 'compressed-textures/shannon-dxt3.dds', size: 262272},
      {format: 'DXT5', src: 'compressed-textures/shannon-dxt5.dds', size: 349680}
    ]
  },
  // Crunch is not supported
  // {
  //   formatName: 'WEBGL_compressed_texture_s3tc with Crunch Compression',
  //   images: [
  //     { format: 'DXT1 (Crunch)', src: 'compressed-textures/shannon-dxt1.crn', size: 63186 },
  //     { format: 'DXT5 (Crunch)', src: 'compressed-textures/shannon-dxt5.crn', size: 71722 }
  //   ]
  // },
  {
    formatName: 'WEBGL_compressed_texture_pvrtc',
    images: [
      {
        format: 'PVRTC (2BPP RGB)',
        src: 'compressed-textures/shannon-pvrtc-2bpp-rgb.pvr',
        size: 87555
      },
      {
        format: 'PVRTC (2BPP RGBA)',
        src: 'compressed-textures/shannon-pvrtc-2bpp-rgba.pvr',
        size: 87555
      },
      {
        format: 'PVRTC (4BPP RGB)',
        src: 'compressed-textures/shannon-pvrtc-4bpp-rgb.pvr',
        size: 174915
      },
      {
        format: 'PVRTC (2BPP RGBA)',
        src: 'compressed-textures/shannon-pvrtc-4bpp-rgba.pvr',
        size: 174915
      }
    ]
  },
  {
    formatName: 'WEBGL_compressed_texture_atc',
    images: [
      {format: 'ATC (RGB)', src: 'compressed-textures/shannon-atc-rgb.dds', size: 131200},
      {
        format: 'ATC (RGBA, Explicit)',
        src: 'compressed-textures/shannon-atc-rgba-explicit.dds',
        size: 262272
      },
      {
        format: 'ATC (RGBA, Interpolated)',
        src: 'compressed-textures/shannon-atc-rgba-interpolated.dds',
        size: 262272
      }
    ]
  },
  {
    formatName: 'WEBGL_compressed_texture_etc1',
    images: [{format: 'ETC1', src: 'compressed-textures/shannon-etc1.pvr', size: 174843}]
  },
  {
    formatName: 'WEBGL_compressed_texture_BASIS',
    images: [
      {format: 'BASIS', src: 'compressed-textures/alpha3.basis', size: 148691},
      {format: 'BASIS', src: 'compressed-textures/kodim01.basis', size: 95914},
      {format: 'BASIS', src: 'compressed-textures/kodim18.basis', size: 2143},
      {format: 'BASIS', src: 'compressed-textures/kodim20_1024x1024.basis', size: 90783},
      {format: 'BASIS', src: 'compressed-textures/kodim20.basis', size: 52496}
    ]
  }
];
