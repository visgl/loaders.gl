# HTML

> The [`loaders.gl/xml`](/docs/modules/xml) module provides support for parsing XML and HTML.

HTML (Hyper Text Markup Language) is a (slightly incompatible) profile of XML. 

The goals of the `HTMLLoader` in loaders.gl are quite limited. 

It is designed for minimal ad-hoc use cases such as 
- the extraction of an error string from an HTML formatted error response from a server
- or possibly to extract some valuable information (perhaps the URL to a geospatial service) from a server that doesn't provide more structured return formats (such as JSON or XML).

The `HTMLLoader` is not intended for full fidelity parsing or display of HTML files.