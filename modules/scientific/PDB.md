# PDB molecular structures

Load `PDBLoader` from `@loaders.gl/scientific`; import `PDBLoaderWithParser`
from `@loaders.gl/scientific/pdb-loader` for direct synchronous parsing.

The renderer-independent result contains molecular models, atom rows and explicit
undirected bonds indexed into each model's atoms. Coordinates are ångströms.
ATOM/HETATM fixed-column records preserve names, element, charge, alternate
locations, residue identifiers, occupancy and temperature factors. MODEL/ENDMDL
scope atom serials. Global CONECT records apply to every model; reciprocal and
repeated entries are deduplicated, without inferring bond order. Missing atom
references and malformed coordinates fail explicitly. Other records are retained.

This initial reader does not infer elements or bonds, choose alternate locations,
assign colors/radii, parse mmCIF or hybrid-36 numbering, or interpret ANISOU,
crystallographic transforms or biological assemblies.
