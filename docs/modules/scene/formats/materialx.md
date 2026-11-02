# MaterialX

MaterialX is an XML-based format for exchanging material and shader graph descriptions. Files commonly use the `.mtlx` extension. See the [MaterialX project](https://materialx.org/).

A document contains a `materialx` root with a version, and may contain node graphs, node definitions, materials, inputs, outputs, and library references.

## Current support

The initial scene implementation reads a MaterialX 1.x XML document into an ordered element tree. It preserves category names, string attributes, child order, custom node categories, and named connection references.

This is structural parsing. It does not validate MaterialX node signatures, resolve connections or library includes, apply inherited defaults, convert to glTF, evaluate graphs, or generate shaders. References and includes remain authored attributes; parsing does not fetch them.

Parsing uses the native documents XML parser in browsers and Node.js. Document types and entity declarations are rejected. Malformed XML, a missing MaterialX root or version, and excessive element nesting produce errors.

## Example

```xml
<materialx version="1.39">
  <nodegraph name="example">
    <constant name="color" type="color3">
      <input name="value" type="color3" value="1.0, 0.0, 0.0"/>
    </constant>
    <output name="out" type="color3" nodename="color"/>
  </nodegraph>
</materialx>
```

The input value remains the string `"1.0, 0.0, 0.0"`; the parser does not infer a numeric tuple.
