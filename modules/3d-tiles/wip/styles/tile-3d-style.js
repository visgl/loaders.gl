// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// NOTE: This file is only partially ported and is a work in progress
/* eslint-disable */

export default class Tile3DStyle {
  constructor(styleJson = {}) {
    this._style = {};
    this._ready = false;

    this._show = undefined;
    this._color = undefined;
    this._pointSize = undefined;
    this._pointOutlineColor = undefined;
    this._pointOutlineWidth = undefined;
    this._labelColor = undefined;
    this._labelOutlineColor = undefined;
    this._labelOutlineWidth = undefined;
    this._font = undefined;
    this._labelStyle = undefined;
    this._labelText = undefined;
    this._backgroundColor = undefined;
    this._backgroundPadding = undefined;
    this._backgroundEnabled = undefined;
    this._scaleByDistance = undefined;
    this._translucencyByDistance = undefined;
    this._distanceDisplayCondition = undefined;
    this._heightOffset = undefined;
    this._anchorLineEnabled = undefined;
    this._anchorLineColor = undefined;
    this._image = undefined;
    this._disableDepthTestDistance = undefined;
    this._horizontalOrigin = undefined;
    this._verticalOrigin = undefined;
    this._labelHorizontalOrigin = undefined;
    this._labelVerticalOrigin = undefined;
    this._meta = undefined;

    this._colorShaderFunction = undefined;
    this._showShaderFunction = undefined;
    this._pointSizeShaderFunction = undefined;
    this._colorShaderFunctionReady = false;
    this._showShaderFunctionReady = false;
    this._pointSizeShaderFunctionReady = false;

    this._colorShaderTranslucent = false;

    setup(this, styleJson);
  }

  // Gets the object defining the style using the
  get style() {
    return this._style;
  }

  //
  get show() {
    return this._show;
  }
  set show(value) {
    this._show = getExpression(this, value);
    this._style.show = getJsonFromExpression(this._show);
    this._showShaderFunctionReady = false;
  }

  get color() {
    return this._color;
  }
  set color(value) {
    this._color = getExpression(this, value);
    this._style.color = getJsonFromExpression(this._color);
    this._colorShaderFunctionReady = false;
  }

  get pointSize() {
    return this._pointSize;
  }
  set pointSize(value) {
    this._pointSize = getExpression(this, value);
    this._style.pointSize = getJsonFromExpression(this._pointSize);
    this._pointSizeShaderFunctionReady = false;
  }

  get pointOutlineColor() {
    return this._pointOutlineColor;
  }
  set pointOutlineColor(value) {
    this._pointOutlineColor = getExpression(this, value);
    this._style.pointOutlineColor = getJsonFromExpression(this._pointOutlineColor);
  }

  get pointOutlineWidth() {
    return this._pointOutlineWidth;
  }
  set pointOutlineWidth(value) {
    this._pointOutlineWidth = getExpression(this, value);
    this._style.pointOutlineWidth = getJsonFromExpression(this._pointOutlineWidth);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>labelColor</code> property.
  get labelColor() {
    return this._labelColor;
  }
  set labelColor(value) {
    this._labelColor = getExpression(this, value);
    this._style.labelColor = getJsonFromExpression(this._labelColor);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>labelOutlineColor</code> property.
  get labelOutlineColor() {
    return this._labelOutlineColor;
  }
  set labelOutlineColor(value) {
    this._labelOutlineColor = getExpression(this, value);
    this._style.labelOutlineColor = getJsonFromExpression(this._labelOutlineColor);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>labelOutlineWidth</code> property.
  get labelOutlineWidth() {
    return this._labelOutlineWidth;
  }
  set labelOutlineWidth(value) {
    this._labelOutlineWidth = getExpression(this, value);
    this._style.labelOutlineWidth = getJsonFromExpression(this._labelOutlineWidth);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>font</code> property.
  get font() {
    return this._font;
  }
  set font(value) {
    this._font = getExpression(this, value);
    this._style.font = getJsonFromExpression(this._font);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>label style</code> property.
  get labelStyle() {
    return this._labelStyle;
  }
  set labelStyle(value) {
    this._labelStyle = getExpression(this, value);
    this._style.labelStyle = getJsonFromExpression(this._labelStyle);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>labelText</code> property.
  get labelText() {
    return this._labelText;
  }
  set labelText(value) {
    this._labelText = getExpression(this, value);
    this._style.labelText = getJsonFromExpression(this._labelText);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>backgroundColor</code> property.
  get backgroundColor() {
    return this._backgroundColor;
  }
  set backgroundColor(value) {
    this._backgroundColor = getExpression(this, value);
    this._style.backgroundColor = getJsonFromExpression(this._backgroundColor);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>backgroundPadding</code> property.
  get backgroundPadding() {
    return this._backgroundPadding;
  }
  set backgroundPadding(value) {
    this._backgroundPadding = getExpression(this, value);
    this._style.backgroundPadding = getJsonFromExpression(this._backgroundPadding);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>backgroundEnabled</code> property.
  get distanceDisplayCondition() {
    return this._distanceDisplayCondition;
  }
  set distanceDisplayCondition(value) {
    this._distanceDisplayCondition = getExpression(this, value);
    this._style.distanceDisplayCondition = getJsonFromExpression(this._distanceDisplayCondition);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>heightOffset</code> property.
  get heightOffset() {
    return this._heightOffset;
  }
  set heightOffset(value) {
    this._heightOffset = getExpression(this, value);
    this._style.heightOffset = getJsonFromExpression(this._heightOffset);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>anchorLineEnabled</code> property.
  get anchorLineEnabled() {
    return this._anchorLineEnabled;
  }
  set anchorLineEnabled(value) {
    this._anchorLineEnabled = getExpression(this, value);
    this._style.anchorLineEnabled = getJsonFromExpression(this._anchorLineEnabled);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>anchorLineColor</code> property.
  get anchorLineColor() {
    return this._anchorLineColor;
  }
  set anchorLineColor(value) {
    this._anchorLineColor = getExpression(this, value);
    this._style.anchorLineColor = getJsonFromExpression(this._anchorLineColor);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>image</code> property.
  get image() {
    return this._image;
  }
  set image(value) {
    this._image = getExpression(this, value);
    this._style.image = getJsonFromExpression(this._image);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>disableDepthTestDistance</code> property.
  get disableDepthTestDistance() {
    return this._disableDepthTestDistance;
  }
  set disableDepthTestDistance(value) {
    this._disableDepthTestDistance = getExpression(this, value);
    this._style.disableDepthTestDistance = getJsonFromExpression(this._disableDepthTestDistance);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>horizontalOrigin</code> property.
  get horizontalOrigin() {
    return this._horizontalOrigin;
  }
  set horizontalOrigin(value) {
    this._horizontalOrigin = getExpression(this, value);
    this._style.horizontalOrigin = getJsonFromExpression(this._horizontalOrigin);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>verticalOrigin</code> property.
  get verticalOrigin() {
    return this._verticalOrigin;
  }
  set verticalOrigin(value) {
    this._verticalOrigin = getExpression(this, value);
    this._style.verticalOrigin = getJsonFromExpression(this._verticalOrigin);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>labelHorizontalOrigin</code> property.
  get labelHorizontalOrigin() {
    return this._labelHorizontalOrigin;
  }
  set labelHorizontalOrigin(value) {
    this._labelHorizontalOrigin = getExpression(this, value);
    this._style.labelHorizontalOrigin = getJsonFromExpression(this._labelHorizontalOrigin);
  }

  // Gets or sets the {@link StyleExpression} object used to evaluate the style's <code>labelVerticalOrigin</code> property.
  get labelVerticalOrigin() {
    return this._labelVerticalOrigin;
  }
  set labelVerticalOrigin(value) {
    this._labelVerticalOrigin = getExpression(this, value);
    this._style.labelVerticalOrigin = getJsonFromExpression(this._labelVerticalOrigin);
  }

  // Gets or sets the object containing application-specific expression that can be explicitly evaluated, e.g., for display in a UI.
  get meta() {
    return this._meta;
  }
  set meta(value) {
    this._meta = value;
  }

  /**
   * Gets the color shader function for this style.
   *
   * @param {String} functionName Name to give to the generated function.
   * @param {String} attributePrefix Prefix that is added to any variable names to access vertex attributes.
   * @param {Object} shaderState Stores information about the generated shader function, including whether it is translucent.
   *
   * @returns {String} The shader function.
   *
   * @private
   */
  getColorShaderFunction(functionName, attributePrefix, shaderState) {
    if (this._colorShaderFunctionReady) {
      shaderState.translucent = this._colorShaderTranslucent;
      // Return the cached result, may be undefined
      return this._colorShaderFunction;
    }

    this._colorShaderFunctionReady = true;
    this._colorShaderFunction = defined(this.color)
      ? this.color.getShaderFunction(functionName, attributePrefix, shaderState, 'vec4')
      : undefined;
    this._colorShaderTranslucent = shaderState.translucent;
    return this._colorShaderFunction;
  }

  /**
   * Gets the show shader function for this style.
   *
   * @param {String} functionName Name to give to the generated function.
   * @param {String} attributePrefix Prefix that is added to any variable names to access vertex attributes.
   * @param {Object} shaderState Stores information about the generated shader function, including whether it is translucent.
   *
   * @returns {String} The shader function.
   *
   * @private
   */
  getShowShaderFunction(functionName, attributePrefix, shaderState) {
    if (this._showShaderFunctionReady) {
      // Return the cached result, may be undefined
      return this._showShaderFunction;
    }

    this._showShaderFunctionReady = true;
    this._showShaderFunction = defined(this.show)
      ? this.show.getShaderFunction(functionName, attributePrefix, shaderState, 'bool')
      : undefined;
    return this._showShaderFunction;
  }

  /**
   * Gets the pointSize shader function for this style.
   *
   * @param {String} functionName Name to give to the generated function.
   * @param {String} attributePrefix Prefix that is added to any variable names to access vertex attributes.
   * @param {Object} shaderState Stores information about the generated shader function, including whether it is translucent.
   *
   * @returns {String} The shader function.
   *
   * @private
   */
  getPointSizeShaderFunction(functionName, attributePrefix, shaderState) {
    if (this._pointSizeShaderFunctionReady) {
      // Return the cached result, may be undefined
      return this._pointSizeShaderFunction;
    }

    this._pointSizeShaderFunctionReady = true;
    this._pointSizeShaderFunction = defined(this.pointSize)
      ? this.pointSize.getShaderFunction(functionName, attributePrefix, shaderState, 'float')
      : undefined;
    return this._pointSizeShaderFunction;
  }
}

function setup(that, styleJson) {
  // styleJson = defaultValue(clone(styleJson, true), that._style);
  that._style = styleJson;

  that.show = styleJson.show;
  that.color = styleJson.color;
  that.pointSize = styleJson.pointSize;
  that.pointOutlineColor = styleJson.pointOutlineColor;
  that.pointOutlineWidth = styleJson.pointOutlineWidth;
  that.labelColor = styleJson.labelColor;
  that.labelOutlineColor = styleJson.labelOutlineColor;
  that.labelOutlineWidth = styleJson.labelOutlineWidth;
  that.labelStyle = styleJson.labelStyle;
  that.font = styleJson.font;
  that.labelText = styleJson.labelText;
  that.backgroundColor = styleJson.backgroundColor;
  that.backgroundPadding = styleJson.backgroundPadding;
  that.backgroundEnabled = styleJson.backgroundEnabled;
  that.scaleByDistance = styleJson.scaleByDistance;
  that.translucencyByDistance = styleJson.translucencyByDistance;
  that.distanceDisplayCondition = styleJson.distanceDisplayCondition;
  that.heightOffset = styleJson.heightOffset;
  that.anchorLineEnabled = styleJson.anchorLineEnabled;
  that.anchorLineColor = styleJson.anchorLineColor;
  that.image = styleJson.image;
  that.disableDepthTestDistance = styleJson.disableDepthTestDistance;
  that.horizontalOrigin = styleJson.horizontalOrigin;
  that.verticalOrigin = styleJson.verticalOrigin;
  that.labelHorizontalOrigin = styleJson.labelHorizontalOrigin;
  that.labelVerticalOrigin = styleJson.labelVerticalOrigin;

  var meta = {};
  if (defined(styleJson.meta)) {
    var defines = styleJson.defines;
    var metaJson = defaultValue(styleJson.meta, defaultValue.EMPTY_OBJECT);
    for (var property in metaJson) {
      if (metaJson.hasOwnProperty(property)) {
        meta[property] = new Expression(metaJson[property], defines);
      }
    }
  }

  that._meta = meta;

  that._ready = true;
}

function getExpression(tileStyle, value) {
  var defines = defaultValue(tileStyle._style, defaultValue.EMPTY_OBJECT).defines;

  if (!defined(value)) {
    return undefined;
  } else if (typeof value === 'boolean' || typeof value === 'number') {
    return new Expression(String(value));
  } else if (typeof value === 'string') {
    return new Expression(value, defines);
  } else if (defined(value.conditions)) {
    return new ConditionsExpression(value, defines);
  }
  return value;
}

function getJsonFromExpression(expression) {
  if (!defined(expression)) {
    return undefined;
  } else if (defined(expression.expression)) {
    return expression.expression;
  } else if (defined(expression.conditionsExpression)) {
    return clone(expression.conditionsExpression, true);
  }
  return expression;
}
