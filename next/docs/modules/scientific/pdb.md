<!-- -->

<!-- -->

scientific format

# PDB — molecular coordinate records

Read atoms, models, and authored connectivity without choosing a molecular display.

[scientific module](https://loaders.gl/next/docs/modules/scientific.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scientific.md)

Format feature card

## Read PDB as data.

Ångström coordinates; no inferred chemistry

01

Input

Fixed-column ATOM/HETATM, MODEL/ENDMDL and CONECT

02

Output

PDBStructure with model-local atoms and explicit bond pairs

03

Loader

PDBLoader · @loaders.gl/scientific

04

Parser

@loaders.gl/scientific/pdb

Detailed guide

## Format, usage and output reference

Understand the source data, load it through the public entry point, and check the supported subset before integrating it.

## API support[​](#api-support "Direct link to API support")

| API                   | Kind                  | Import                                                   |
| --------------------- | --------------------- | -------------------------------------------------------- |
| `PDBLoader`           | Metadata loader       | `@loaders.gl/scientific` or `@loaders.gl/scientific/pdb` |
| `PDBLoaderWithParser` | Parser-bearing loader | `@loaders.gl/scientific/pdb`                             |

## What is PDB?[​](#what-is-pdb "Direct link to What is PDB?")

The Protein Data Bank coordinate format is a fixed-column text representation of molecular structures. Atom records identify an atom, residue, chain, position, and related measurements. A structure can contain multiple models. Column positions matter: this is not a whitespace-delimited table.

PDB files describe coordinates and records, not a particular ball-and-stick or ribbon appearance. Element assignment, chemical bond inference, alternate-location selection, and biological assembly construction require separate decisions or algorithms. PDB and PDBx/mmCIF are different formats; this loader does not parse mmCIF.

## Read models and explicit bonds[​](#read-models-and-explicit-bonds "Direct link to Read models and explicit bonds")

```
import {load} from '@loaders.gl/core';

import {PDBLoader} from '@loaders.gl/scientific/pdb';



const structure = await load('molecule.pdb', PDBLoader);

for (const model of structure.models) {

  console.log(model.serial, model.atoms.length, model.bonds.length);

  for (const [firstIndex, secondIndex] of model.bonds) {

    const first = model.atoms[firstIndex];

    const second = model.atoms[secondIndex];

    console.log(first.position, second.position);

  }

}
```

An empty bond list means there were no usable authored CONECT pairs. It does not mean the molecule has no chemical bonds.

## Output contract[​](#output-contract "Direct link to Output contract")

| Field            | Meaning                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `coordinateUnit` | `angstrom`; one ångström is 0.1 nanometers                            |
| `models`         | Source models, each with its own atom serial namespace                |
| `model.atoms`    | Atom rows in source order                                             |
| `model.bonds`    | Unique undirected pairs of zero-based indices into that model's atoms |
| `records`        | Other source records, retained verbatim                               |

Atom rows retain serial, ATOM/HETATM category, name, alternateLocation, residueName, chain, residueNumber, insertionCode, XYZ position, authored element and charge, and optional occupancy and temperatureFactor. Missing optional numeric fields remain absent. Element names are not inferred from atom names.

Without MODEL records, atoms form implicit model 1. Global CONECT records apply to each model. Blank and zero-filled unused CONECT target slots are ignored. Reciprocal and repeated pairs are deduplicated; repeat count is not interpreted as bond order. Serial references are resolved within the relevant model.

## Supported features and limits[​](#supported-features-and-limits "Direct link to Supported features and limits")

Malformed coordinates, duplicate model/atom identifiers where they are ambiguous, invalid model nesting, and missing CONECT atom references reject. Alternate locations are retained, not filtered.

Hybrid-36 numbering, mmCIF, inferred bonds/elements, colors/radii, ANISOU interpretation, crystallographic transforms, biological assemblies, and writers are outside the initial scope. Retaining a record does not mean its semantics have been implemented.

## Direct parsing[​](#direct-parsing "Direct link to Direct parsing")

```
import {parseSync} from '@loaders.gl/core';

import {PDBLoaderWithParser} from '@loaders.gl/scientific/pdb/bundled';



const structure = parseSync(text, PDBLoaderWithParser);
```

The root metadata loader preloads through async core APIs. Direct parsing is synchronous and has no format-specific options. The result contains ordinary records and arrays, with no renderer dependency.
