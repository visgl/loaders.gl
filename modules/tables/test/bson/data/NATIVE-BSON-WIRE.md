# Native BSON wire fixtures

These small fixtures were independently generated from explicit values using MongoDB's
Apache-2.0-licensed `bson@4.2.0` serializer, before removing that dependency.
The generator input covers each scalar family, nested objects/arrays, binary subtypes,
and numeric boundaries. Fixtures record only wire bytes and descriptive names;
no library implementation or third-party corpus is included. Tests run offline.
