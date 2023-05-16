# File Formats

This section collects articles that provide additional information about a number of the file formats supported by loaders.gl.

Note that these file format articles are essentially a cleaned up collection of research notes for some of the formats supported by loaders.gl. They are not intended to be comprehensive or exhaustive. The hope is that by sharing these notes we may help some readers quickly build deeper understanding of a particular format, by providing a high level, easily digestible summary of the key points of that format. 

## Documentation Structure

The file format articles in this section aim to follow the following structure:

- **Links** -Articles should start off with links to the loaders.gl module that implements this format, as well as specifications and if available, the corresponding wikipedia article.
- **Overview** of formats - what is the purpose of the format?
- **Features** details about what is stored in the format (columns, metadata, data types, encodings, compressions, ...).
- **Versions** - if the format has undergone notable revisions, it is desirable to have a section about what these are and what changed between releases. It is good to be able to show when the versions were standardized to place them in context of the evolution of file formats.
- **Example** - Especially for textual formats it is often illustrative to show a short example file.

The preference is that file format articles should focus on the format itself and avoid describing the loaders.gl API. The articles  can then be relevant for a bigger audience, and loaders.gl API information can be concentrated into the reference docs. 

However for practical reasons some information showing loaders.gl support for various file format features may be included. For example, an extra loaders.gl specific column can occasionally found in tables listing out format features, indicating if those features are supported in loaders.gl. The information should so that it is clearly marked and can easily be ignored.

## Caveats

The documentation in this "Formats" section are provided on an as-is basis, there is no currently no stated goal of provide similar documentation for all covered formats. Requesting maintainers to write new articles or update existing articles will likely not be successful. That said, egregious errors will be fixed if reported. GitHub Pull Requests with corrections or additional contributions are welcome, as long the proposed changes are reasonably consistent with the general style and level detail of the existing documentation.
