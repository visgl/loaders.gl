/*
///////////////////////////////////////////////////////////////////////////
// Styling tests

test('Tileset3d#applies show style to a tileset', t => {
  const tileset = await loadTileset(scene, WITHOUT_BATCH_TABLE_URL);
    const hideStyle = new Cesium3DTileStyle({show: 'false'});
    tileset.style = hideStyle;
    expect(tileset.style).toBe(hideStyle);
    expect(scene).toRender([0, 0, 0, 255]);

    tileset.style = new Cesium3DTileStyle({show: 'true'});
    expect(scene).notToRender([0, 0, 0, 255]);
  });
  t.end();
});

test('Tileset3d#applies show style to a tileset without features', t => {
  const tileset = await loadTileset(scene, NO_BATCH_IDS_URL);
    const hideStyle = new Cesium3DTileStyle({show: 'false'});
    tileset.style = hideStyle;
    expect(tileset.style).toBe(hideStyle);
    expect(scene).toRender([0, 0, 0, 255]);

    tileset.style = new Cesium3DTileStyle({show: 'true'});
    expect(scene).notToRender([0, 0, 0, 255]);
  });
  t.end();
});

test('Tileset3d#applies style with complex show expression to a tileset', t => {
  const tileset = await loadTileset(scene, WITH_BATCH_TABLE_URL);
    // Each feature in the b3dm file has an id property from 0 to 9
    // ${id} >= 10 will always evaluate to false
    tileset.style = new Cesium3DTileStyle({show: '${id} >= 50 * 2'});
    expect(scene).toRender([0, 0, 0, 255]);

    // ${id} < 10 will always evaluate to true
    tileset.style = new Cesium3DTileStyle({show: '${id} < 200 / 2'});
    expect(scene).notToRender([0, 0, 0, 255]);
  });
  t.end();
});

test('Tileset3d#applies show style to a tileset with a composite tile', t => {
  const tileset = await loadTileset(scene, COMPOSITE_URL);
    tileset.style = new Cesium3DTileStyle({show: 'false'});
    expect(scene).toRender([0, 0, 0, 255]);

    tileset.style = new Cesium3DTileStyle({show: 'true'});
    expect(scene).notToRender([0, 0, 0, 255]);
  });
});

function expectColorStyle(tileset) {
  const color;
  expect(scene).toRenderAndCall(rgba => {
    color = rgba;
  });

  tileset.style = new Cesium3DTileStyle({color: 'color("blue")'});
  expect(scene).toRenderAndCall(rgba => {
    t.equals(rgba[0], 0);
    t.equals(rgba[1], 0);
    expect(rgba[2]).toBeGreaterThan(0);
    t.equals(rgba[3], 255);
  });

  // set color to transparent
  tileset.style = new Cesium3DTileStyle({color: 'color("blue", 0.0)'});
  expect(scene).toRender([0, 0, 0, 255]);

  tileset.style = new Cesium3DTileStyle({color: 'color("cyan")'});
  expect(scene).toRenderAndCall(rgba => {
    t.equals(rgba[0], 0);
    expect(rgba[1]).toBeGreaterThan(0);
    expect(rgba[2]).toBeGreaterThan(0);
    t.equals(rgba[3], 255);
  });

  // Remove style
  tileset.style = undefined;
  expect(scene).toRender(color);
  t.end();
}

test('Tileset3d#applies color style to a tileset', t => {
  const tileset = await loadTileset(scene, WITHOUT_BATCH_TABLE_URL);
    expectColorStyle(tileset);
  });
  t.end();
});

test('Tileset3d#applies color style to a tileset with translucent tiles', t => {
  const tileset = await loadTileset(scene, TRANSLUCENT_URL);
    expectColorStyle(tileset);
  });
  t.end();
});

test('Tileset3d#applies color style to a tileset with translucent and opaque tiles', t => {
  const tileset = await loadTileset(scene, TRANSLUCENT_OPAQUE_MIX_URL);
    expectColorStyle(tileset);
  });
  t.end();
});

test('Tileset3d#applies color style to tileset without features', t => {
  const tileset = await loadTileset(scene, NO_BATCH_IDS_URL);
    expectColorStyle(tileset);
  });
  t.end();
});

test('Tileset3d#applies style when feature properties change', t => {
  const tileset = await loadTileset(scene, WITH_BATCH_TABLE_URL);
    // Initially, all feature ids are less than 10
    tileset.style = new Cesium3DTileStyle({show: '${id} < 10'});
    expect(scene).notToRender([0, 0, 0, 255]);

    // Change feature ids so the show expression will evaluate to false
    const content = tileset.root.content;
    const length = content.featuresLength;
    const i;
    const feature;
    for (i = 0; i < length; ++i) {
      feature = content.getFeature(i);
      feature.setProperty('id', feature.getProperty('id') + 10);
    }
    expect(scene).toRender([0, 0, 0, 255]);

    // Change ids back
    for (i = 0; i < length; ++i) {
      feature = content.getFeature(i);
      feature.setProperty('id', feature.getProperty('id') - 10);
    }
    expect(scene).notToRender([0, 0, 0, 255]);
  });
  t.end();
});

test('Tileset3d#applies style when tile is selected after new style is applied', t => {
  const tileset = await loadTileset(scene, WITH_BATCH_TABLE_URL);
    const feature = tileset.root.content.getFeature(0);
    tileset.style = new Cesium3DTileStyle({color: 'color("red")'});
    scene.renderForSpecs();
    t.equals(feature.color, Color.RED);

    tileset.style = new Cesium3DTileStyle({color: 'color("blue")'});
    scene.renderForSpecs();
    t.equals(feature.color, Color.BLUE);

    viewNothing();
    tileset.style = new Cesium3DTileStyle({color: 'color("lime")'});
    scene.renderForSpecs();
    t.equals(feature.color, Color.BLUE); // Hasn't been selected yet

    viewAllTiles();
    scene.renderForSpecs();
    t.equals(feature.color, Color.LIME);

    // Feature's show property is preserved if the style hasn't changed and the feature is newly selected
    feature.show = false;
    scene.renderForSpecs();
    expect(feature.show).toBe(false);
    viewNothing();
    scene.renderForSpecs();
    expect(feature.show).toBe(false);
    viewAllTiles();
    expect(feature.show).toBe(false);
  });
  t.end();
});

test('Tileset3d#does not reapply style during pick pass', t => {
  const tileset = await loadTileset(scene, WITH_BATCH_TABLE_URL);
    tileset.style = new Cesium3DTileStyle({color: 'color("red")'});
    scene.renderForSpecs();
    expect(tileset._statisticsLastRender.numberOfTilesStyled).toBe(1);
    scene.pickForSpecs();
    expect(tileset._statisticsLastPick.numberOfTilesStyled).toBe(0);
  });
  t.end();
});

test('Tileset3d#applies style with complex color expression to a tileset', t => {
  const tileset = await loadTileset(scene, WITH_BATCH_TABLE_URL);
    // Each feature in the b3dm file has an id property from 0 to 9
    // ${id} >= 10 will always evaluate to false
    tileset.style = new Cesium3DTileStyle({
      color: '(${id} >= 50 * 2) ? color("red") : color("blue")'
    });
    expect(scene).toRenderAndCall(rgba => {
      t.equals(rgba[0], 0);
      t.equals(rgba[1], 0);
      expect(rgba[2]).toBeGreaterThan(0);
      t.equals(rgba[3], 255);
    });

    // ${id} < 10 will always evaluate to true
    tileset.style = new Cesium3DTileStyle({
      color: '(${id} < 50 * 2) ? color("red") : color("blue")'
    });
    expect(scene).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(0);
      t.equals(rgba[1], 0);
      t.equals(rgba[2], 0);
      t.equals(rgba[3], 255);
    });
  });
  t.end();
});

test('Tileset3d#applies conditional color style to a tileset', t => {
  const tileset = await loadTileset(scene, WITH_BATCH_TABLE_URL);
    // ${id} < 10 will always evaluate to true
    tileset.style = new Cesium3DTileStyle({
      color: {
        conditions: [['${id} < 10', 'color("red")'], ['true', 'color("blue")']]
      }
    });
    expect(scene).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(0);
      t.equals(rgba[1], 0);
      t.equals(rgba[2], 0);
      t.equals(rgba[3], 255);
    });

    // ${id}>= 10 will always evaluate to false
    tileset.style = new Cesium3DTileStyle({
      color: {
        conditions: [['${id} >= 10', 'color("red")'], ['true', 'color("blue")']]
      }
    });
    expect(scene).toRenderAndCall(rgba => {
      t.equals(rgba[0], 0);
      t.equals(rgba[1], 0);
      expect(rgba[2]).toBeGreaterThan(0);
      t.equals(rgba[3], 255);
    });
  });
  t.end();
});

test('Tileset3d#loads style from uri', t => {
  const tileset = await loadTileset(scene, WITH_BATCH_TABLE_URL);
    // ${id} < 10 will always evaluate to true
    tileset.style = new Cesium3DTileStyle(STYLE_URL);
    return tileset.style.readyPromise
      .then(function(style) {
        expect(scene).toRenderAndCall(rgba => {
          expect(rgba[0]).toBeGreaterThan(0);
          t.equals(rgba[1], 0);
          t.equals(rgba[2], 0);
          t.equals(rgba[3], 255);
        });
      })
      .otherwise(function(error) {
        expect(error).not.toBeDefined();
      });
  });
  t.end();
});

test('Tileset3d#applies custom style to a tileset', t => {
  const style = new Cesium3DTileStyle();
  style.show = {
    evaluate: function(feature) {
      return this._value;
    },
    _value: false
  };
  style.color = {
    evaluateColor: function(feature, result) {
      return Color.clone(Color.WHITE, result);
    }
  };

  const tileset = await loadTileset(scene, WITHOUT_BATCH_TABLE_URL);
    tileset.style = style;
    expect(tileset.style).toBe(style);
    expect(scene).toRender([0, 0, 0, 255]);

    style.show._value = true;
    tileset.makeStyleDirty();
    expect(scene).notToRender([0, 0, 0, 255]);
  });
});

function testColorBlendMode(url) {
  const tileset = await loadTileset(scene, url);
    tileset.luminanceAtZenith = undefined;

    // Check that the feature is red
    const sourceRed;
    const renderOptions = {
      scene: scene,
      time: new JulianDate(2457522.154792)
    };
    expect(renderOptions).toRenderAndCall(rgba => {
      sourceRed = rgba[0];
    });

    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(200);
      expect(rgba[1]).toBeLessThan(25);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Use HIGHLIGHT blending
    tileset.colorBlendMode = Cesium3DTileColorBlendMode.HIGHLIGHT;

    // Style with dark yellow. Expect the red channel to be darker than before.
    tileset.style = new Cesium3DTileStyle({
      color: 'rgb(128, 128, 0)'
    });
    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(100);
      expect(rgba[0]).toBeLessThan(sourceRed);
      expect(rgba[1]).toBeLessThan(25);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Style with yellow + alpha. Expect the red channel to be darker than before.
    tileset.style = new Cesium3DTileStyle({
      color: 'rgba(255, 255, 0, 0.5)'
    });
    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(100);
      expect(rgba[0]).toBeLessThan(sourceRed);
      expect(rgba[1]).toBeLessThan(25);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Use REPLACE blending
    tileset.colorBlendMode = Cesium3DTileColorBlendMode.REPLACE;

    // Style with dark yellow. Expect the red and green channels to be roughly dark yellow.
    tileset.style = new Cesium3DTileStyle({
      color: 'rgb(128, 128, 0)'
    });
    const replaceRed;
    const replaceGreen;
    expect(renderOptions).toRenderAndCall(rgba => {
      replaceRed = rgba[0];
      replaceGreen = rgba[1];
      expect(rgba[0]).toBeGreaterThan(100);
      expect(rgba[0]).toBeLessThan(255);
      expect(rgba[1]).toBeGreaterThan(100);
      expect(rgba[1]).toBeLessThan(255);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Style with yellow + alpha. Expect the red and green channels to be a shade of yellow.
    tileset.style = new Cesium3DTileStyle({
      color: 'rgba(255, 255, 0, 0.5)'
    });
    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(100);
      expect(rgba[0]).toBeLessThan(255);
      expect(rgba[1]).toBeGreaterThan(100);
      expect(rgba[1]).toBeLessThan(255);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Use MIX blending
    tileset.colorBlendMode = Cesium3DTileColorBlendMode.MIX;
    tileset.colorBlendAmount = 0.5;

    // Style with dark yellow. Expect color to be a mix of the source and style colors.
    tileset.style = new Cesium3DTileStyle({
      color: 'rgb(128, 128, 0)'
    });
    const mixRed;
    const mixGreen;
    expect(renderOptions).toRenderAndCall(rgba => {
      mixRed = rgba[0];
      mixGreen = rgba[1];
      expect(rgba[0]).toBeGreaterThan(replaceRed);
      expect(rgba[0]).toBeLessThan(sourceRed);
      expect(rgba[1]).toBeGreaterThan(50);
      expect(rgba[1]).toBeLessThan(replaceGreen);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Set colorBlendAmount to 0.25. Expect color to be closer to the source color.
    tileset.colorBlendAmount = 0.25;
    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(mixRed);
      expect(rgba[0]).toBeLessThan(sourceRed);
      expect(rgba[1]).toBeGreaterThan(0);
      expect(rgba[1]).toBeLessThan(mixGreen);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Set colorBlendAmount to 0.0. Expect color to equal the source color
    tileset.colorBlendAmount = 0.0;
    expect(renderOptions).toRenderAndCall(rgba => {
      t.equals(rgba[0], sourceRed);
      expect(rgba[1]).toBeLessThan(25);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Set colorBlendAmount to 1.0. Expect color to equal the style color
    tileset.colorBlendAmount = 1.0;
    expect(renderOptions).toRenderAndCall(rgba => {
      t.equals(rgba[0], replaceRed);
      t.equals(rgba[1], replaceGreen);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });

    // Style with yellow + alpha. Expect color to be a mix of the source and style colors.
    tileset.colorBlendAmount = 0.5;
    tileset.style = new Cesium3DTileStyle({
      color: 'rgba(255, 255, 0, 0.5)'
    });
    expect(renderOptions).toRenderAndCall(rgba => {
      expect(rgba[0]).toBeGreaterThan(0);
      expect(rgba[1]).toBeGreaterThan(0);
      expect(rgba[2]).toBeLessThan(25);
      t.equals(rgba[3], 255);
    });
  });
  t.end();
}

test('Tileset3d#sets colorBlendMode', t => {
  return testColorBlendMode(COLORS_URL);
  t.end();
});

test('Tileset3d#sets colorBlendMode when vertex texture fetch is not supported', t => {
  // Disable VTF
  const maximumVertexTextureImageUnits = ContextLimits.maximumVertexTextureImageUnits;
  ContextLimits._maximumVertexTextureImageUnits = 0;
  return testColorBlendMode(COLORS_URL).then(function() {
    // Re-enable VTF
    ContextLimits._maximumVertexTextureImageUnits = maximumVertexTextureImageUnits;
  });
  t.end();
});

test('Tileset3d#sets colorBlendMode for textured tileset', t => {
  return testColorBlendMode(TEXTURED_URL);
  t.end();
});

test('Tileset3d#sets colorBlendMode for instanced tileset', t => {
  viewInstances();
  return testColorBlendMode(INSTANCED_RED_MATERIAL_URL);
  t.end();
});

test('Tileset3d#sets colorBlendMode for vertex color tileset', t => {
  return testColorBlendMode(BATCHED_VERTEX_COLORS_URL);
  t.end();
});

*/
