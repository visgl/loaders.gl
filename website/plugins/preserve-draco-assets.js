// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Preserves the global initializer names in already minified, classic Draco runtime assets. */
module.exports = {
  /** Marks only vendored runtime assets before the production JavaScript minimizer runs. */
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('PreserveDracoAssets', compilation => {
      compilation.hooks.processAssets.tap(
        {
          name: 'PreserveDracoAssets',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE - 1
        },
        () => {
          for (const asset of compilation.getAssets()) {
            if (
              /modules[\\/]scene[\\/](?:src[\\/]draco[\\/]libs|dist[\\/]libs)[\\/][^\\/]+\.js$/.test(
                asset.info.sourceFilename || ''
              )
            ) {
              // Re-minification can rename DracoEncoderModule/DracoDecoderModule, breaking eval loading.
              compilation.updateAsset(asset.name, asset.source, {...asset.info, minimized: true});
            }
          }
        }
      );
    });
  }
};
