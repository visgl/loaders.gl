# Tile3DStyle

/** A style that is applied to a {@link Cesium3DTileset}. <p> Evaluates an expression defined using the {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling|3D Tiles Styling language}. </p> @alias Tile3DStyle @constructor @param {Resource|String|Object} [style] The url of a style or an object defining a style.



## Attribution

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md


## Usage

Creating a style instance
```js
tileset.style = new Cesium.Cesium3DTileStyle({
    color : {
        conditions : [
            ['${Height} >= 100', 'color("purple", 0.5)'],
            ['${Height} >= 50', 'color("red")'],
            ['true', 'color("blue")']
        ]
    },
    show : '${Height} > 0',
    meta : {
        description : '"Building id ${id} has height ${Height}."'
    }
});
```

```js
tileset.style = new Cesium.Cesium3DTileStyle({
    color : 'vec4(${Temperature})',
    pointSize : '${Temperature} * 2.0'
});
```

Evaluating `show` (feature visibility) using a style

```js
const style = new Tile3DStyle({
     show : '(regExp("^Chest").test(${County})) && (${YearBuilt} >= 1970)'
});
style.show.evaluate(feature); // returns true or false depending on the feature's properties
```

```js
const style = new Tile3DStyle();
// Override show expression with a custom function
style.show = {
     evaluate : function(feature) {
     return true;
   }
};
```

```js
const style = new Tile3DStyle();
// Override show expression with a boolean
style.show = true;
};
```

```js
const style = new Tile3DStyle();
// Override show expression with a string
style.show = '${Height} > 0';
};
```

```js
const style = new Tile3DStyle();
// Override show expression with a condition
style.show = {
     conditions: [
     ['${height} > 2', 'false'],
   ['true', 'true']
   ];
};
```

Evaluating colors using the style

```js
const style = new Tile3DStyle({
  color : '(${Temperature} > 90) ? color("red") : color("white")'
});
style.color.evaluateColor(feature, result); // returns a Color object
```

```js
const style = new Tile3DStyle();
// Override color expression with a custom function
style.color = {
     evaluateColor : function(feature, result) {
     return Color.clone(Color.WHITE, result);
   }
};
```

```js
const style = new Tile3DStyle();
// Override color expression with a string
style.color = 'color("blue")';
```

```js
const style = new Tile3DStyle();
// Override color expression with a condition
style.color = {
     conditions : [
     ['${height} > 2', 'color("cyan")'],
   ['true', 'color("blue")']
   ]
};
```

Controlling pointSize using styles

```js
const style = new Tile3DStyle({
     pointSize : '(${Temperature} > 90) ? 2.0 : 1.0'
});
style.pointSize.evaluate(feature); // returns a Number
```

```js
const style = new Tile3DStyle();
// Override pointSize expression with a custom function
style.pointSize = {
     evaluate : function(feature) {
     return 1.0;
   }
};
```

```js
const style = new Tile3DStyle();
// Override pointSize expression with a number
style.pointSize = 1.0;
```

```js
const style = new Tile3DStyle();
// Override pointSize expression with a string
style.pointSize = '${height} / 10';
```

```js
const style = new Tile3DStyle();
// Override pointSize expression with a condition
style.pointSize =  {
     conditions : [
     ['${height} > 2', '1.0'],
   ['true', '2.0']
   ]
};
```


Changing `pointOutlineColor` (experimental)

```js
const style = new Tile3DStyle();
// Override pointOutlineColor expression with a string
style.pointOutlineColor = 'color("blue")';
```

```js
const style = new Tile3DStyle();
// Override pointOutlineColor expression with a condition
style.pointOutlineColor = {
     conditions : [
     ['${height} > 2', 'color("cyan")'],
   ['true', 'color("blue")']
   ]
};
```

```js
const style = new Tile3DStyle();
// Override pointOutlineWidth expression with a string
style.pointOutlineWidth = '5';
```

```js
const style = new Tile3DStyle();
// Override pointOutlineWidth expression with a condition
style.pointOutlineWidth = {
     conditions : [
     ['${height} > 2', '5'],
   ['true', '0']
   ]
};
```

Setting label color

```js
const style = new Tile3DStyle();
// Override labelColor expression with a string
style.labelColor = 'color("blue")';
```

```js
const style = new Tile3DStyle();
// Override labelColor expression with a condition
style.labelColor = {
     conditions : [
     ['${height} > 2', 'color("cyan")'],
   ['true', 'color("blue")']
   ]
};
```

Setting label outline color

```js
const style = new Tile3DStyle();
// Override labelOutlineColor expression with a string
style.labelOutlineColor = 'color("blue")';
```

```js
const style = new Tile3DStyle();
// Override labelOutlineColor expression with a condition
style.labelOutlineColor = {
     conditions : [
     ['${height} > 2', 'color("cyan")'],
   ['true', 'color("blue")']
   ]
};
```

Evaluating a font using a style

```js
const style = new Tile3DStyle({
     font : '(${Temperature} > 90) ? "30px Helvetica" : "24px Helvetica"'
});
style.font.evaluate(feature); // returns a String
```

```js
const style = new Tile3DStyle();
// Override font expression with a custom function
style.font = {
     evaluate : function(feature) {
     return '24px Helvetica';
   }
};
```

Evaluating a `labelStyle` using a style

```js
const style = new Tile3DStyle({
     labelStyle : '(${Temperature} > 90) ? ' + LabelStyle.FILL_AND_OUTLINE + ' : ' + LabelStyle.FILL
});
style.labelStyle.evaluate(feature); // returns a LabelStyle
```

```js
const style = new Tile3DStyle();
// Override labelStyle expression with a custom function
style.labelStyle = {
     evaluate : function(feature) {
     return LabelStyle.FILL;
   }
};
```

Evaluating a labelText using a style

```js
const style = new Tile3DStyle({
     labelText : '(${Temperature} > 90) ? ">90" : "<=90"'
});
style.labelText.evaluate(feature); // returns a String
```

```js
const style = new Tile3DStyle();
// Override labelText expression with a custom function
style.labelText = {
     evaluate : function(feature) {
     return 'Example label text';
   }
};
```


## Member Fields

### style : Object (readonly)

Gets the object defining the style using the
{@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling|3D Tiles Styling language}.

Default: `{}`


### show : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `show` property. Alternatively a boolean, string, or object defining a show style can be used.

The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return or convert to a `Boolean`.

This expression is applicable to all tile formats.


### color : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `color` property. Alternatively a string or object defining a color style can be used.

The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Color`.

This expression is applicable to all tile formats.


### pointSize : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `pointSize` property. Alternatively a string or object defining a point size style can be used.

The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Number`.

This expression is only applicable to point features in a Vector tile or a Point Cloud tile.


### pointOutlineColor : StyleExpression

> **experimental** This feature is using part of the 3D Tiles spec that is not final and is subject to change without a standard deprecation policy.

Gets or sets the {@link StyleExpression} object used to evaluate the style's `pointOutlineColor` property. Alternatively a string or object defining a color style can be used.

The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Color`.

This expression is only applicable to point features in a Vector tile.


### pointOutlineWidth : StyleExpression

> **experimental** This feature is using part of the 3D Tiles spec that is not final and is subject to change without a standard deprecation policy.

Gets or sets the {@link StyleExpression} object used to evaluate the style's `pointOutlineWidth` property. Alternatively a string or object defining a number style can be used.

The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Number`.

This expression is only applicable to point features in a Vector tile.


### labelColor : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `labelColor` property. Alternatively a string or object defining a color style can be used.

The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Color`.

This expression is only applicable to point features in a Vector tile.



### labelOutlineColor : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `labelOutlineColor` property. Alternatively a string or object defining a color style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Color`.

This expression is only applicable to point features in a Vector tile.


### labelOutlineWidth : StuleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `labelOutlineWidth` property. Alternatively a string or object defining a number style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Number`.

This expression is only applicable to point features in a Vector tile.


@example
const style = new Tile3DStyle();
// Override labelOutlineWidth expression with a string
style.labelOutlineWidth = '5';

@example
const style = new Tile3DStyle();
// Override labelOutlineWidth expression with a condition
style.labelOutlineWidth = {
     conditions : [
     ['${height} > 2', '5'],
   ['true', '0']
   ]
};


### font

Gets or sets the {@link StyleExpression} object used to evaluate the style's `font` property. Alternatively a string or object defining a string style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `String`.

This expression is only applicable to point features in a Vector tile.

@type {StyleExpression}


### labelStyle : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `label style` property. Alternatively a string or object defining a number style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `LabelStyle`.

This expression is only applicable to point features in a Vector tile.


### labelText : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `labelText` property. Alternatively a string or object defining a string style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `String`.

This expression is only applicable to point features in a Vector tile.



Gets or sets the {@link StyleExpression} object used to evaluate the style's `backgroundColor` property. Alternatively a string or object defining a color style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Color`.

This expression is only applicable to point features in a Vector tile.


```js

const style = new Tile3DStyle();
// Override backgroundColor expression with a string
style.backgroundColor = 'color("blue")';

```js

const style = new Tile3DStyle();
// Override backgroundColor expression with a condition
style.backgroundColor = {
     conditions : [
     ['${height} > 2', 'color("cyan")'],
   ['true', 'color("blue")']
   ]
};
   */
  backgroundColor : {
    get : function() {
      this._checkReady();
      return this._backgroundColor;
    },
    set : function(value) {
      this._backgroundColor = getExpression(this, value);
      this._style.backgroundColor = getJsonFromExpression(this._backgroundColor);
    }
  },


Gets or sets the {@link StyleExpression} object used to evaluate the style's `backgroundPadding` property. Alternatively a string or object defining a vec2 style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Cartesian2`.

This expression is only applicable to point features in a Vector tile.


```js

const style = new Tile3DStyle();
// Override backgroundPadding expression with a string
style.backgroundPadding = 'vec2(5.0, 7.0)';
style.backgroundPadding.evaluate(feature); // returns a Cartesian2
   */
  backgroundPadding : {
    get : function() {
      this._checkReady();
      return this._backgroundPadding;
    },
    set : function(value) {
      this._backgroundPadding = getExpression(this, value);
      this._style.backgroundPadding = getJsonFromExpression(this._backgroundPadding);
    }
  },


Gets or sets the {@link StyleExpression} object used to evaluate the style's `backgroundEnabled` property. Alternatively a string or object defining a boolean style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Boolean`.

This expression is only applicable to point features in a Vector tile.


```js

const style = new Tile3DStyle();
// Override backgroundEnabled expression with a string
style.backgroundEnabled = 'true';

```js

const style = new Tile3DStyle();
// Override backgroundEnabled expression with a condition
style.backgroundEnabled = {
     conditions : [
     ['${height} > 2', 'true'],
   ['true', 'false']
   ]
};
   */
  backgroundEnabled : {
    get : function() {
      this._checkReady();
      return this._backgroundEnabled;
    },
    set : function(value) {
      this._backgroundEnabled = getExpression(this, value);
      this._style.backgroundEnabled = getJsonFromExpression(this._backgroundEnabled);
    }
  },


Gets or sets the {@link StyleExpression} object used to evaluate the style's `scaleByDistance` property. Alternatively a string or object defining a vec4 style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Cartesian4`.

This expression is only applicable to point features in a Vector tile.


```js

const style = new Tile3DStyle();
// Override scaleByDistance expression with a string
style.scaleByDistance = 'vec4(1.5e2, 2.0, 1.5e7, 0.5)';
style.scaleByDistance.evaluate(feature); // returns a Cartesian4
   */
  scaleByDistance : {
    get : function() {
      this._checkReady();
      return this._scaleByDistance;
    },
    set : function(value) {
      this._scaleByDistance = getExpression(this, value);
      this._style.scaleByDistance = getJsonFromExpression(this._scaleByDistance);
    }
  },


Gets or sets the {@link StyleExpression} object used to evaluate the style's `translucencyByDistance` property. Alternatively a string or object defining a vec4 style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Cartesian4`.

This expression is only applicable to point features in a Vector tile.


```js

const style = new Tile3DStyle();
// Override translucencyByDistance expression with a string
style.translucencyByDistance = 'vec4(1.5e2, 1.0, 1.5e7, 0.2)';
style.translucencyByDistance.evaluate(feature); // returns a Cartesian4
   */
  translucencyByDistance : {
    get : function() {
      this._checkReady();
      return this._translucencyByDistance;
    },
    set : function(value) {
      this._translucencyByDistance = getExpression(this, value);
      this._style.translucencyByDistance = getJsonFromExpression(this._translucencyByDistance);
    }
  },


### distanceDisplayCondition : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `distanceDisplayCondition` property. Alternatively a string or object defining a vec2 style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Cartesian2`.

This expression is only applicable to point features in a Vector tile.


```js
const style = new Tile3DStyle();
// Override distanceDisplayCondition expression with a string
style.distanceDisplayCondition = 'vec2(0.0, 5.5e6)';
style.distanceDisplayCondition.evaluate(feature); // returns a Cartesian2
```

### heightOffset : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `heightOffset` property. Alternatively a string or object defining a number style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Number`.

This expression is only applicable to point features in a Vector tile.

```js
const style = new Tile3DStyle();
// Override heightOffset expression with a string
style.heightOffset = '2.0';
```

```js
const style = new Tile3DStyle();
// Override heightOffset expression with a condition
style.heightOffset = {
     conditions : [
     ['${height} > 2', '4.0'],
   ['true', '2.0']
   ]
};
```

### anchorLineEnabled : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `anchorLineEnabled` property. Alternatively a string or object defining a boolean style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Boolean`.

This expression is only applicable to point features in a Vector tile.


```js
const style = new Tile3DStyle();
// Override anchorLineEnabled expression with a string
style.anchorLineEnabled = 'true';
```

```js
const style = new Tile3DStyle();
// Override anchorLineEnabled expression with a condition
style.anchorLineEnabled = {
     conditions : [
     ['${height} > 2', 'true'],
   ['true', 'false']
   ]
};
```

### anchorLineColor : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `anchorLineColor` property. Alternatively a string or object defining a color style can be used.

The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Color`.

This expression is only applicable to point features in a Vector tile.


```js
const style = new Tile3DStyle();
// Override anchorLineColor expression with a string
style.anchorLineColor = 'color("blue")';
```

```js
const style = new Tile3DStyle();
// Override anchorLineColor expression with a condition
style.anchorLineColor = {
     conditions : [
     ['${height} > 2', 'color("cyan")'],
   ['true', 'color("blue")']
   ]
};
```

###

Gets or sets the {@link StyleExpression} object used to evaluate the style's `image` property. Alternatively a string or object defining a string style can be used.

The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `String`.

This expression is only applicable to point features in a Vector tile.

```js
const style = new Tile3DStyle({
     image : '(${Temperature} > 90) ? "/url/to/image1" : "/url/to/image2"'
});
style.image.evaluate(feature); // returns a String
```

```js
const style = new Tile3DStyle();
// Override image expression with a custom function
style.image = {
     evaluate : function(feature) {
     return '/url/to/image';
   }
};
```

Gets or sets the {@link StyleExpression} object used to evaluate the style's `disableDepthTestDistance` property. Alternatively a string or object defining a number style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `Number`.

This expression is only applicable to point features in a Vector tile.


```js
const style = new Tile3DStyle();
// Override disableDepthTestDistance expression with a string
style.disableDepthTestDistance = '1000.0';
style.disableDepthTestDistance.evaluate(feature); // returns a Number
```


Gets or sets the {@link StyleExpression} object used to evaluate the style's `horizontalOrigin` property. Alternatively a string or object defining a number style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `HorizontalOrigin`.

This expression is only applicable to point features in a Vector tile.


```js
const style = new Tile3DStyle({
     horizontalOrigin : HorizontalOrigin.LEFT
});
style.horizontalOrigin.evaluate(feature); // returns a HorizontalOrigin
```

```js
const style = new Tile3DStyle();
// Override horizontalOrigin expression with a custom function
style.horizontalOrigin = {
     evaluate : function(feature) {
     return HorizontalOrigin.CENTER;
   }
};
```

### verticalOrigin : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `verticalOrigin` property. Alternatively a string or object defining a number style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `VerticalOrigin`.

This expression is only applicable to point features in a Vector tile.

```js

const style = new Tile3DStyle({
     verticalOrigin : VerticalOrigin.TOP
});
style.verticalOrigin.evaluate(feature); // returns a VerticalOrigin
```

```js
const style = new Tile3DStyle();
// Override verticalOrigin expression with a custom function
style.verticalOrigin = {
     evaluate : function(feature) {
     return VerticalOrigin.CENTER;
   }
};
```

### labelVerticalOrigin : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `labelHorizontalOrigin` property. Alternatively a string or object defining a number style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `HorizontalOrigin`.

This expression is only applicable to point features in a Vector tile.


```js
const style = new Tile3DStyle({
     labelHorizontalOrigin : HorizontalOrigin.LEFT
});
style.labelHorizontalOrigin.evaluate(feature); // returns a HorizontalOrigin
```

```js
const style = new Tile3DStyle();
// Override labelHorizontalOrigin expression with a custom function
style.labelHorizontalOrigin = {
     evaluate : function(feature) {
     return HorizontalOrigin.CENTER;
   }
};
```

### labelVerticalOrigin : StyleExpression

Gets or sets the {@link StyleExpression} object used to evaluate the style's `labelVerticalOrigin` property. Alternatively a string or object defining a number style can be used.
The getter will return the internal {@link Expression} or {@link ConditionsExpression}, which may differ from the value provided to the setter.

The expression must return a `VerticalOrigin`.

This expression is only applicable to point features in a Vector tile.


```js
const style = new Tile3DStyle({
     labelVerticalOrigin : VerticalOrigin.TOP
});
style.labelVerticalOrigin.evaluate(feature); // returns a VerticalOrigin
```

```js
const style = new Tile3DStyle();
// Override labelVerticalOrigin expression with a custom function
style.labelVerticalOrigin = {
     evaluate : function(feature) {
     return VerticalOrigin.CENTER;
   }
};
```

### meta : StyleExpression

Gets or sets the object containing application-specific expression that can be explicitly evaluated, e.g., for display in a UI.


```js
const style = new Tile3DStyle({
     meta : {
     description : '"Building id ${id} has height ${Height}."'
   }
});
```
