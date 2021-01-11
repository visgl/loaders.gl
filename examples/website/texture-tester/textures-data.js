export const IMAGES_DATA = [
  {
    formatName: 'Browser Native Formats (Uncompressed)',
    images: [
      {format: 'JPG', src: 'compressed-textures/shannon.jpg'},
      {format: 'GIF', src: 'compressed-textures/shannon.gif'},
      {format: 'PNG', src: 'compressed-textures/shannon.png'},
      {format: 'BMP', src: 'compressed-textures/shannon.bmp'},
      {format: 'WEBP', src: 'compressed-textures/shannon.webp'}
    ]
  },
  {
    formatName: 'WEBGL_compressed_texture_s3tc',
    images: [
      {format: 'DXT1', src: 'compressed-textures/shannon-dxt1.dds'},
      {format: 'DXT3', src: 'compressed-textures/shannon-dxt3.dds'},
      {format: 'DXT5', src: 'compressed-textures/shannon-dxt5.dds'}
    ]
  },
  // Crunch is not supported
  // {
  //   formatName: 'WEBGL_compressed_texture_s3tc with Crunch Compression',
  //   images: [
  //     { format: 'DXT1 (Crunch)', src: 'compressed-textures/shannon-dxt1.crn' },
  //     { format: 'DXT5 (Crunch)', src: 'compressed-textures/shannon-dxt5.crn' }
  //   ]
  // },
  {
    formatName: 'WEBGL_compressed_texture_pvrtc',
    images: [
      {format: 'PVRTC (2BPP RGB)', src: 'compressed-textures/shannon-pvrtc-2bpp-rgb.pvr'},
      {format: 'PVRTC (2BPP RGBA)', src: 'compressed-textures/shannon-pvrtc-2bpp-rgba.pvr'},
      {format: 'PVRTC (4BPP RGB)', src: 'compressed-textures/shannon-pvrtc-4bpp-rgb.pvr'},
      {format: 'PVRTC (2BPP RGBA)', src: 'compressed-textures/shannon-pvrtc-4bpp-rgba.pvr'}
    ]
  },
  {
    formatName: 'WEBGL_compressed_texture_atc',
    images: [
      {format: 'ATC (RGB)', src: 'compressed-textures/shannon-atc-rgb.dds'},
      {format: 'ATC (RGBA, Explicit)', src: 'compressed-textures/shannon-atc-rgba-explicit.dds'},
      {
        format: 'ATC (RGBA, Interpolated)',
        src: 'compressed-textures/shannon-atc-rgba-interpolated.dds'
      }
    ]
  },
  {
    formatName: 'WEBGL_compressed_texture_etc1',
    images: [{format: 'ETC1', src: 'compressed-textures/shannon-etc1.pvr'}]
  },
  {
    formatName: 'WEBGL_compressed_texture_BASIS',
    images: [
      {format: 'BASIS', src: 'compressed-textures/alpha3.basis'},
      {format: 'BASIS', src: 'compressed-textures/kodim01.basis'},
      {format: 'BASIS', src: 'compressed-textures/kodim18.basis'},
      {format: 'BASIS', src: 'compressed-textures/kodim20_1024x1024.basis'},
      {format: 'BASIS', src: 'compressed-textures/kodim20.basis'}
    ]
  }
];
