# Using with Typescript

This documentation does not include advanced type definitions in the interest of simplicity and making the documentation accessible to more JavaScript developers. If you are working with Typescript in your application and would benefit from documentation that includes the Typescript definitions, you can refer to the auto generated JSDocs for the API.

## Considerations when Using Typescript

To ensure that type information "flows" correctly from the types of function/constructor arguments to the types of returned objects, some special methods are provided (effectively working around limitations in Typescript).

A key example is the availability of static `new()` methods on a number of classes that are intended to be used instead of calling `new` on the constructor. Accordingly, `Table.new()` is an alternative to `new Table()`, that provides stronger type inference on the returned Table.

You may want to leverage this syntax if your application is written in Typescript.
