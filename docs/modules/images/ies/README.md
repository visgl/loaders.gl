# IES photometric profiles

Use `IESLoader` from `@loaders.gl/images`, or `IESLoaderWithParser` from
`@loaders.gl/images/ies-loader`. The initial reader supports LM-63-1991, 1995 and
2002 Type C profiles with TILT=NONE. Unsupported revisions, Type A/B and tilt
payloads fail explicitly; external tilt files are never fetched.

The result retains vertical/horizontal degree samples, raw Float64 candela samples
(vertical fastest), the candela multiplier, lamp count/lumens, dimensions/units,
ballast factors, input watts and label records. Multiply samples by
`candelaMultiplier` to obtain candela. Revision-dependent ballast fields remain
separate; no maximum normalization, symmetry expansion, angular-origin shift,
interpolation, texture generation or light object is applied.
