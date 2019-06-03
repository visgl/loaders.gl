// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
/*
var StyleCommandsNeeded = {
  ALL_OPAQUE : 0,
  ALL_TRANSLUCENT : 1,
  OPAQUE_AND_TRANSLUCENT : 2
}

export default class BatchTableRenderer {
  destroy() {
    this._batchTexture = this._batchTexture && this._batchTexture.destroy();
    this._pickTexture = this._pickTexture && this._pickTexture.destroy();

    const pickIds = this._pickIds;
    const length = pickIds.length;
    for (let i = 0; i < length; ++i) {
      pickIds[i].destroy();
    }

    return destroyObject(this);
  }

  getGlslComputeSt(batchTable) {
    // GLSL batchId is zero-based: [0, featuresLength - 1]
    if (batchTable._textureDimensions.y === 1) {
      return 'uniform vec4 tile_textureStep; \n' +
        'vec2 computeSt(float batchId) \n' +
        '{ \n' +
        '    float stepX = tile_textureStep.x; \n' +
        '    float centerX = tile_textureStep.y; \n' +
        '    return vec2(centerX + (batchId * stepX), 0.5); \n' +
        '} \n';
    }

    return 'uniform vec4 tile_textureStep; \n' +
      'uniform vec2 tile_textureDimensions; \n' +
      'vec2 computeSt(float batchId) \n' +
      '{ \n' +
      '    float stepX = tile_textureStep.x; \n' +
      '    float centerX = tile_textureStep.y; \n' +
      '    float stepY = tile_textureStep.z; \n' +
      '    float centerY = tile_textureStep.w; \n' +
      '    float xId = mod(batchId, tile_textureDimensions.x); \n' +
      '    float yId = floor(batchId / tile_textureDimensions.x); \n' +
      '    return vec2(centerX + (xId * stepX), centerY + (yId * stepY)); \n' +
      '} \n';
  }

  getVertexShaderCallback(handleTranslucent, batchIdAttributeName, diffuseAttributeOrUniformName) {
    if (this.featuresLength === 0) {
      return;
    }

    var that = this;
    return function(source) {
      // If the color blend mode is HIGHLIGHT, the highlight color will always be applied in the fragment shader.
      // No need to apply the highlight color in the vertex shader as well.
      var renamedSource = modifyDiffuse(source, diffuseAttributeOrUniformName, false);
      var newMain;

      if (ContextLimits.maximumVertexTextureImageUnits > 0) {
        // When VTF is supported, perform per-feature show/hide in the vertex shader
        newMain = '';
        if (handleTranslucent) {
          newMain += 'uniform bool tile_translucentCommand; \n';
        }
        newMain +=
          'uniform sampler2D tile_batchTexture; \n' +
          'varying vec4 tile_featureColor; \n' +
          'varying vec2 tile_featureSt; \n' +
          'void main() \n' +
          '{ \n' +
          '    vec2 st = computeSt(' + batchIdAttributeName + '); \n' +
          '    vec4 featureProperties = texture2D(tile_batchTexture, st); \n' +
          '    tile_color(featureProperties); \n' +
          '    float show = ceil(featureProperties.a); \n' +      // 0 - false, non-zeo - true
          '    gl_Position *= show; \n';                          // Per-feature show/hide
        if (handleTranslucent) {
          newMain +=
            '    bool isStyleTranslucent = (featureProperties.a != 1.0); \n' +
            '    if (czm_pass == czm_passTranslucent) \n' +
            '    { \n' +
            '        if (!isStyleTranslucent && !tile_translucentCommand) \n' + // Do not render opaque features in the translucent pass
            '        { \n' +
            '            gl_Position *= 0.0; \n' +
            '        } \n' +
            '    } \n' +
            '    else \n' +
            '    { \n' +
            '        if (isStyleTranslucent) \n' + // Do not render translucent features in the opaque pass
            '        { \n' +
            '            gl_Position *= 0.0; \n' +
            '        } \n' +
            '    } \n';
        }
        newMain +=
          '    tile_featureColor = featureProperties; \n' +
          '    tile_featureSt = st; \n' +
          '}';
      } else {
        // When VTF is not supported, color blend mode MIX will look incorrect due to the feature's color not being available in the vertex shader
        newMain =
          'varying vec2 tile_featureSt; \n' +
          'void main() \n' +
          '{ \n' +
          '    tile_color(vec4(1.0)); \n' +
          '    tile_featureSt = computeSt(' + batchIdAttributeName + '); \n' +
          '}';
      }

      return renamedSource + '\n' + getGlslComputeSt(that) + newMain;
    };
  }

  getDefaultShader(source, applyHighlight) {
    source = ShaderSource.replaceMain(source, 'tile_main');

    if (!applyHighlight) {
      return source +
           'void tile_color(vec4 tile_featureColor) \n' +
           '{ \n' +
           '    tile_main(); \n' +
           '} \n';
    }

    // The color blend mode is intended for the RGB channels so alpha is always just multiplied.
    // gl_FragColor is multiplied by the tile color only when tile_colorBlend is 0.0 (highlight)
    return source +
         'uniform float tile_colorBlend; \n' +
         'void tile_color(vec4 tile_featureColor) \n' +
         '{ \n' +
         '    tile_main(); \n' +
         '    gl_FragColor.a *= tile_featureColor.a; \n' +
         '    float highlight = ceil(tile_colorBlend); \n' +
         '    gl_FragColor.rgb *= mix(tile_featureColor.rgb, vec3(1.0), highlight); \n' +
         '} \n';
  }

  replaceDiffuseTextureCalls(source, diffuseAttributeOrUniformName) {
    var functionCall = 'texture2D(' + diffuseAttributeOrUniformName;

    var fromIndex = 0;
    var startIndex = source.indexOf(functionCall, fromIndex);
    var endIndex;

    while (startIndex > -1) {
      var nestedLevel = 0;
      for (var i = startIndex; i < source.length; ++i) {
        var character = source.charAt(i);
        if (character === '(') {
          ++nestedLevel;
        } else if (character === ')') {
          --nestedLevel;
          if (nestedLevel === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      var extractedFunction = source.slice(startIndex, endIndex);
      var replacedFunction = 'tile_diffuse_final(' + extractedFunction + ', tile_diffuse)';

      source = source.slice(0, startIndex) + replacedFunction + source.slice(endIndex);
      fromIndex = startIndex + replacedFunction.length;
      startIndex = source.indexOf(functionCall, fromIndex);
    }

    return source;
  }

  modifyDiffuse(source, diffuseAttributeOrUniformName, applyHighlight) {
    // If the glTF does not specify the _3DTILESDIFFUSE semantic, return the default shader.
    // Otherwise if _3DTILESDIFFUSE is defined prefer the shader below that can switch the color mode at runtime.
    if (!defined(diffuseAttributeOrUniformName)) {
      return getDefaultShader(source, applyHighlight);
    }

    // Find the diffuse uniform. Examples matches:
    //   uniform vec3 u_diffuseColor;
    //   uniform sampler2D diffuseTexture;
    var regex = new RegExp('(uniform|attribute|in)\\s+(vec[34]|sampler2D)\\s+' + diffuseAttributeOrUniformName + ';');
    var uniformMatch = source.match(regex);

    if (!defined(uniformMatch)) {
      // Could not find uniform declaration of type vec3, vec4, or sampler2D
      return getDefaultShader(source, applyHighlight);
    }

    var declaration = uniformMatch[0];
    var type = uniformMatch[2];

    source = ShaderSource.replaceMain(source, 'tile_main');
    source = source.replace(declaration, ''); // Remove uniform declaration for now so the replace below doesn't affect it

    // If the tile color is white, use the source color. This implies the feature has not been styled.
    // Highlight: tile_colorBlend is 0.0 and the source color is used
    // Replace: tile_colorBlend is 1.0 and the tile color is used
    // Mix: tile_colorBlend is between 0.0 and 1.0, causing the source color and tile color to mix
    var finalDiffuseFunction =
      'bool isWhite(vec3 color) \n' +
      '{ \n' +
      '    return all(greaterThan(color, vec3(1.0 - czm_epsilon3))); \n' +
      '} \n' +
      'vec4 tile_diffuse_final(vec4 sourceDiffuse, vec4 tileDiffuse) \n' +
      '{ \n' +
      '    vec4 blendDiffuse = mix(sourceDiffuse, tileDiffuse, tile_colorBlend); \n' +
      '    vec4 diffuse = isWhite(tileDiffuse.rgb) ? sourceDiffuse : blendDiffuse; \n' +
      '    return vec4(diffuse.rgb, sourceDiffuse.a); \n' +
      '} \n';

    // The color blend mode is intended for the RGB channels so alpha is always just multiplied.
    // gl_FragColor is multiplied by the tile color only when tile_colorBlend is 0.0 (highlight)
    var highlight =
      '    gl_FragColor.a *= tile_featureColor.a; \n' +
      '    float highlight = ceil(tile_colorBlend); \n' +
      '    gl_FragColor.rgb *= mix(tile_featureColor.rgb, vec3(1.0), highlight); \n';

    var setColor;
    if (type === 'vec3' || type === 'vec4') {
      var sourceDiffuse = (type === 'vec3') ? ('vec4(' + diffuseAttributeOrUniformName + ', 1.0)') : diffuseAttributeOrUniformName;
      var replaceDiffuse = (type === 'vec3') ? 'tile_diffuse.xyz' : 'tile_diffuse';
      regex = new RegExp(diffuseAttributeOrUniformName, 'g');
      source = source.replace(regex, replaceDiffuse);
      setColor =
        '    vec4 source = ' + sourceDiffuse + '; \n' +
        '    tile_diffuse = tile_diffuse_final(source, tile_featureColor); \n' +
        '    tile_main(); \n';
    } else if (type === 'sampler2D') {
      // Handles any number of nested parentheses
      // E.g. texture2D(u_diffuse, uv)
      // E.g. texture2D(u_diffuse, computeUV(index))
      source = replaceDiffuseTextureCalls(source, diffuseAttributeOrUniformName);
      setColor =
        '    tile_diffuse = tile_featureColor; \n' +
        '    tile_main(); \n';
    }

    source =
      'uniform float tile_colorBlend; \n' +
      'vec4 tile_diffuse = vec4(1.0); \n' +
      finalDiffuseFunction +
      declaration + '\n' +
      source + '\n' +
      'void tile_color(vec4 tile_featureColor) \n' +
      '{ \n' +
      setColor;

    if (applyHighlight) {
      source += highlight;
    }

    source += '} \n';
    return source;
  }

  getFragmentShaderCallback(handleTranslucent, diffuseAttributeOrUniformName) {
    if (this.featuresLength === 0) {
      return;
    }
    return function(source) {
      source = modifyDiffuse(source, diffuseAttributeOrUniformName, true);
      if (ContextLimits.maximumVertexTextureImageUnits > 0) {
        // When VTF is supported, per-feature show/hide already happened in the fragment shader
        source +=
          'uniform sampler2D tile_pickTexture; \n' +
          'varying vec2 tile_featureSt; \n' +
          'varying vec4 tile_featureColor; \n' +
          'void main() \n' +
          '{ \n' +
          '    tile_color(tile_featureColor); \n' +
          '}';
      } else {
        if (handleTranslucent) {
          source += 'uniform bool tile_translucentCommand; \n';
        }
        source +=
          'uniform sampler2D tile_pickTexture; \n' +
          'uniform sampler2D tile_batchTexture; \n' +
          'varying vec2 tile_featureSt; \n' +
          'void main() \n' +
          '{ \n' +
          '    vec4 featureProperties = texture2D(tile_batchTexture, tile_featureSt); \n' +
          '    if (featureProperties.a == 0.0) { \n' + // show: alpha == 0 - false, non-zeo - true
          '        discard; \n' +
          '    } \n';

        if (handleTranslucent) {
          source +=
            '    bool isStyleTranslucent = (featureProperties.a != 1.0); \n' +
            '    if (czm_pass == czm_passTranslucent) \n' +
            '    { \n' +
            '        if (!isStyleTranslucent && !tile_translucentCommand) \n' + // Do not render opaque features in the translucent pass
            '        { \n' +
            '            discard; \n' +
            '        } \n' +
            '    } \n' +
            '    else \n' +
            '    { \n' +
            '        if (isStyleTranslucent) \n' + // Do not render translucent features in the opaque pass
            '        { \n' +
            '            discard; \n' +
            '        } \n' +
            '    } \n';
        }

        source +=
          '    tile_color(featureProperties); \n' +
          '} \n';
      }
      return source;
    };
  }

  getClassificationFragmentShaderCallback() {
    if (this.featuresLength === 0) {
      return;
    }
    return function(source) {
      source = ShaderSource.replaceMain(source, 'tile_main');
      if (ContextLimits.maximumVertexTextureImageUnits > 0) {
        // When VTF is supported, per-feature show/hide already happened in the fragment shader
        source +=
          'uniform sampler2D tile_pickTexture;\n' +
          'varying vec2 tile_featureSt; \n' +
          'varying vec4 tile_featureColor; \n' +
          'void main() \n' +
          '{ \n' +
          '    tile_main(); \n' +
          '    gl_FragColor = tile_featureColor; \n' +
          '}';
      } else {
        source +=
          'uniform sampler2D tile_batchTexture; \n' +
          'uniform sampler2D tile_pickTexture;\n' +
          'varying vec2 tile_featureSt; \n' +
          'void main() \n' +
          '{ \n' +
          '    tile_main(); \n' +
          '    vec4 featureProperties = texture2D(tile_batchTexture, tile_featureSt); \n' +
          '    if (featureProperties.a == 0.0) { \n' + // show: alpha == 0 - false, non-zeo - true
          '        discard; \n' +
          '    } \n' +
          '    gl_FragColor = featureProperties; \n' +
          '} \n';
      }
      return source;
    };
  }

  getColorBlend(batchTable) {
    var tileset = batchTable._content._tileset;
    var colorBlendMode = tileset.colorBlendMode;
    var colorBlendAmount = tileset.colorBlendAmount;
    if (colorBlendMode === Cesium3DTileColorBlendMode.HIGHLIGHT) {
      return 0.0;
    }
    if (colorBlendMode === Cesium3DTileColorBlendMode.REPLACE) {
      return 1.0;
    }
    if (colorBlendMode === Cesium3DTileColorBlendMode.MIX) {
      // The value 0.0 is reserved for highlight, so clamp to just above 0.0.
      return CesiumMath.clamp(colorBlendAmount, CesiumMath.EPSILON4, 1.0);
    }
    //>>includeStart('debug', pragmas.debug);
    throw new Error('Invalid color blend mode "' + colorBlendMode + '".');
    //>>includeEnd('debug');
  }

  getUniformMapCallback() {
    if (this.featuresLength === 0) {
      return;
    }

    var that = this;
    return function(uniformMap) {
      var batchUniformMap = {
        tile_batchTexture : function() {
          // PERFORMANCE_IDEA: we could also use a custom shader that avoids the texture read.
          return defaultValue(that._batchTexture, that._defaultTexture);
        },
        tile_textureDimensions : function() {
          return that._textureDimensions;
        },
        tile_textureStep : function() {
          return that._textureStep;
        },
        tile_colorBlend : function() {
          return getColorBlend(that);
        },
        tile_pickTexture : function() {
          return that._pickTexture;
        }
      };

      return combine(uniformMap, batchUniformMap);
    };
  }

  getPickId() {
    return 'texture2D(tile_pickTexture, tile_featureSt)';
  }

  ///////////////////////////////////////////////////////////////////////////

  addDerivedCommands(frameState, commandStart, finalResolution) {
    var commandList = frameState.commandList;
    var commandEnd = commandList.length;
    var tile = this._content._tile;
    var tileset = tile._tileset;
    var bivariateVisibilityTest = tileset._skipLevelOfDetail && tileset._hasMixedContent && frameState.context.stencilBuffer;
    var styleCommandsNeeded = getStyleCommandsNeeded(this);

    for (var i = commandStart; i < commandEnd; ++i) {
      var command = commandList[i];
      var derivedCommands = command.derivedCommands.tileset;
      // Command may be marked dirty from Model shader recompilation for clipping planes
      if (!defined(derivedCommands) || command.dirty) {
        derivedCommands = {};
        command.derivedCommands.tileset = derivedCommands;
        derivedCommands.originalCommand = deriveCommand(command);
        command.dirty = false;
      }

      updateDerivedCommand(derivedCommands.originalCommand, command);

      if (styleCommandsNeeded !== StyleCommandsNeeded.ALL_OPAQUE) {
        if (!defined(derivedCommands.translucent)) {
          derivedCommands.translucent = deriveTranslucentCommand(derivedCommands.originalCommand);
        }
        updateDerivedCommand(derivedCommands.translucent, command);
      }

      if (bivariateVisibilityTest) {
        if (command.pass !== Pass.TRANSLUCENT && !finalResolution) {
          if (!defined(derivedCommands.zback)) {
            derivedCommands.zback = deriveZBackfaceCommand(frameState.context, derivedCommands.originalCommand);
          }
          tileset._backfaceCommands.push(derivedCommands.zback);
        }
        if (!defined(derivedCommands.stencil) || tile._selectionDepth !== tile._lastSelectionDepth) {
          derivedCommands.stencil = deriveStencilCommand(derivedCommands.originalCommand, tile._selectionDepth);
          tile._lastSelectionDepth = tile._selectionDepth;
        }
        updateDerivedCommand(derivedCommands.stencil, command);
      }

      var opaqueCommand = bivariateVisibilityTest ? derivedCommands.stencil : derivedCommands.originalCommand;
      var translucentCommand = derivedCommands.translucent;

      // If the command was originally opaque:
      //    * If the styling applied to the tile is all opaque, use the original command
      //      (with one additional uniform needed for the shader).
      //    * If the styling is all translucent, use new (cached) derived commands (front
      //      and back faces) with a translucent render state.
      //    * If the styling causes both opaque and translucent features in this tile,
      //      then use both sets of commands.
      if (command.pass !== Pass.TRANSLUCENT) {
        if (styleCommandsNeeded === StyleCommandsNeeded.ALL_OPAQUE) {
          commandList[i] = opaqueCommand;
        }
        if (styleCommandsNeeded === StyleCommandsNeeded.ALL_TRANSLUCENT) {
          commandList[i] = translucentCommand;
        }
        if (styleCommandsNeeded === StyleCommandsNeeded.OPAQUE_AND_TRANSLUCENT) {
          // PERFORMANCE_IDEA: if the tile has multiple commands, we do not know what features are in what
          // commands so this case may be overkill.
          commandList[i] = opaqueCommand;
          commandList.push(translucentCommand);
        }
      } else {
        // Command was originally translucent so no need to derive new commands;
        // as of now, a style can't change an originally translucent feature to
        // opaque since the style's alpha is modulated, not a replacement.  When
        // this changes, we need to derive new opaque commands here.
        commandList[i] = opaqueCommand;
      }
    }
  }

  updateDerivedCommand(derivedCommand, command) {
    derivedCommand.castShadows = command.castShadows;
    derivedCommand.receiveShadows = command.receiveShadows;
    derivedCommand.primitiveType = command.primitiveType;
  }

  getStyleCommandsNeeded(batchTable) {
    var translucentFeaturesLength = batchTable._translucentFeaturesLength;

    if (translucentFeaturesLength === 0) {
      return StyleCommandsNeeded.ALL_OPAQUE;
    } else if (translucentFeaturesLength === batchTable.featuresLength) {
      return StyleCommandsNeeded.ALL_TRANSLUCENT;
    }

    return StyleCommandsNeeded.OPAQUE_AND_TRANSLUCENT;
  }

  deriveCommand(command) {
    var derivedCommand = DrawCommand.shallowClone(command);

    // Add a uniform to indicate if the original command was translucent so
    // the shader knows not to cull vertices that were originally transparent
    // even though their style is opaque.
    var translucentCommand = (derivedCommand.pass === Pass.TRANSLUCENT);

    derivedCommand.uniformMap = defined(derivedCommand.uniformMap) ? derivedCommand.uniformMap : {};
    derivedCommand.uniformMap.tile_translucentCommand = function() {
      return translucentCommand;
    };

    return derivedCommand;
  }

  deriveTranslucentCommand(command) {
    var derivedCommand = DrawCommand.shallowClone(command);
    derivedCommand.pass = Pass.TRANSLUCENT;
    derivedCommand.renderState = getTranslucentRenderState(command.renderState);
    return derivedCommand;
  }

  getDisableLogDepthFragmentShaderProgram(context, shaderProgram) {
    var shader = context.shaderCache.getDerivedShaderProgram(shaderProgram, 'zBackfaceLogDepth');
    if (!defined(shader)) {
      var fs = shaderProgram.fragmentShaderSource.clone();
      fs.defines = defined(fs.defines) ? fs.defines.slice(0) : [];
      fs.defines.push('DISABLE_LOG_DEPTH_FRAGMENT_WRITE');

      shader = context.shaderCache.createDerivedShaderProgram(shaderProgram, 'zBackfaceLogDepth', {
        vertexShaderSource : shaderProgram.vertexShaderSource,
        fragmentShaderSource : fs,
        attributeLocations : shaderProgram._attributeLocations
      });
    }

    return shader;
  }

  deriveZBackfaceCommand(context, command) {
    // Write just backface depth of unresolved tiles so resolved stenciled tiles do not appear in front
    var derivedCommand = DrawCommand.shallowClone(command);
    var rs = clone(derivedCommand.renderState, true);
    rs.cull.enabled = true;
    rs.cull.face = CullFace.FRONT;
    // Back faces do not need to write color.
    rs.colorMask = {
      red : false,
      green : false,
      blue : false,
      alpha : false
    };
    // Push back face depth away from the camera so it is less likely that back faces and front faces of the same tile
    // intersect and overlap. This helps avoid flickering for very thin double-sided walls.
    rs.polygonOffset = {
      enabled : true,
      factor : 5.0,
      units : 5.0
    };
    derivedCommand.renderState = RenderState.fromCache(rs);
    derivedCommand.castShadows = false;
    derivedCommand.receiveShadows = false;
    // Disable the depth writes in the fragment shader. The back face commands were causing the higher resolution
    // tiles to disappear.
    derivedCommand.shaderProgram = getDisableLogDepthFragmentShaderProgram(context, command.shaderProgram);
    return derivedCommand;
  }

  deriveStencilCommand(command, reference) {
    var derivedCommand = command;
    if (command.renderState.depthMask) { // ignore if tile does not write depth (ex. translucent)
      // Tiles only draw if their selection depth is >= the tile drawn already. They write their
      // selection depth to the stencil buffer to prevent ancestor tiles from drawing on top
      derivedCommand = DrawCommand.shallowClone(command);
      var rs = clone(derivedCommand.renderState, true);
      // Stencil test is masked to the most significant 4 bits so the reference is shifted.
      // This is to prevent clearing the stencil before classification which needs the least significant
      // bits for increment/decrement operations.
      rs.stencilTest.enabled = true;
      rs.stencilTest.mask = 0xF0;
      rs.stencilTest.reference = reference << 4;
      rs.stencilTest.frontFunction = StencilFunction.GREATER_OR_EQUAL;
      rs.stencilTest.frontOperation.zPass = StencilOperation.REPLACE;
      derivedCommand.renderState = RenderState.fromCache(rs);
    }
    return derivedCommand;
  }

  getTranslucentRenderState(renderState) {
    var rs = clone(renderState, true);
    rs.cull.enabled = false;
    rs.depthTest.enabled = true;
    rs.depthMask = false;
    rs.blending = BlendingState.ALPHA_BLEND;

    return RenderState.fromCache(rs);
  }

  ///////////////////////////////////////////////////////////////////////////

  createTexture(batchTable, context, bytes) {
    var dimensions = batchTable._textureDimensions;
    return new Texture({
      context : context,
      pixelFormat : PixelFormat.RGBA,
      pixelDatatype : PixelDatatype.UNSIGNED_BYTE,
      source : {
        width : dimensions.x,
        height : dimensions.y,
        arrayBufferView : bytes
      },
      flipY : false,
      sampler : new Sampler({
        minificationFilter : TextureMinificationFilter.NEAREST,
        magnificationFilter : TextureMagnificationFilter.NEAREST
      })
    });
  }

  createPickTexture(batchTable, context) {
    var featuresLength = batchTable.featuresLength;
    if (!defined(batchTable._pickTexture) && (featuresLength > 0)) {
      var pickIds = batchTable._pickIds;
      var byteLength = getByteLength(batchTable);
      var bytes = new Uint8Array(byteLength);
      var content = batchTable._content;

      // PERFORMANCE_IDEA: we could skip the pick texture completely by allocating
      // a continuous range of pickIds and then converting the base pickId + batchId
      // to RGBA in the shader.  The only consider is precision issues, which might
      // not be an issue in WebGL 2.
      for (var i = 0; i < featuresLength; ++i) {
        var pickId = context.createPickId(content.getFeature(i));
        pickIds.push(pickId);

        var pickColor = pickId.color;
        var offset = i * 4;
        bytes[offset] = Color.floatToByte(pickColor.red);
        bytes[offset + 1] = Color.floatToByte(pickColor.green);
        bytes[offset + 2] = Color.floatToByte(pickColor.blue);
        bytes[offset + 3] = Color.floatToByte(pickColor.alpha);
      }

      batchTable._pickTexture = createTexture(batchTable, context, bytes);
      content._tileset._statistics.batchTableByteLength += batchTable._pickTexture.sizeInBytes;
    }
  }

  updateBatchTexture(batchTable) {
    var dimensions = batchTable._textureDimensions;
    // PERFORMANCE_IDEA: Instead of rewriting the entire texture, use fine-grained
    // texture updates when less than, for example, 10%, of the values changed.  Or
    // even just optimize the common case when one feature show/color changed.
    batchTable._batchTexture.copyFrom({
      width : dimensions.x,
      height : dimensions.y,
      arrayBufferView : batchTable._batchValues
    });
  }

  update(tileset, frameState) {
    var context = frameState.context;
    this._defaultTexture = context.defaultTexture;

    var passes = frameState.passes;
    if (passes.pick || passes.postProcess) {
      createPickTexture(this, context);
    }

    if (this._batchValuesDirty) {
      this._batchValuesDirty = false;

      // Create batch texture on-demand
      if (!defined(this._batchTexture)) {
        this._batchTexture = createTexture(this, context, this._batchValues);
        tileset._statistics.batchTableByteLength += this._batchTexture.sizeInBytes;
      }

      updateBatchTexture(this);  // Apply per-feature show/color updates
    }
  }
}
