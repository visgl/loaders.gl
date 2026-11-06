// SPDX-License-Identifier: MIT
/** An authored PDB atom, without inferred chemistry or display styling. */
export type PDBAtom = {
  /** Atom serial number in its model. */
  serial: number;
  /** ATOM or HETATM record category. */
  record: string;
  /** Authored atom name. */
  name: string;
  /** Alternate location identifier. */
  alternateLocation: string;
  /** Residue name. */
  residueName: string;
  /** Chain identifier. */
  chain: string;
  /** Residue sequence number. */
  residueNumber: number;
  /** Residue insertion code. */
  insertionCode: string;
  /** XYZ coordinates in ångströms. */
  position: [number, number, number];
  /** Authored occupancy, if supplied. */
  occupancy?: number;
  /** Isotropic temperature factor, if supplied. */
  temperatureFactor?: number;
  /** Authored element symbol; never inferred from atom name. */
  element: string;
  /** Authored charge string. */
  charge: string;
};

/** One molecular model with explicit undirected connectivity. */
export type PDBModel = {
  /** MODEL serial, or 1 for an implicit model. */
  serial: number;
  /** Atoms in source record order. */
  atoms: PDBAtom[];
  /** Unique bond pairs containing zero-based indices into atoms. No bond order is inferred. */
  bonds: [number, number][];
};

/** Parsed PDB structure. */
export type PDBStructure = {
  /** Coordinate unit. */
  coordinateUnit: 'angstrom';
  /** Independent molecular models. */
  models: PDBModel[];
  /** Non-coordinate records retained verbatim. */
  records: string[];
};

/** Parses wwPDB fixed-column coordinates and explicit CONECT bonds. */
export function parsePDB(text: string): PDBStructure {
  const models: PDBModel[] = [];
  const records: string[] = [];
  const connections: {model?: PDBModel; serials: number[]}[] = [];
  let active: PDBModel | undefined;
  let explicitModels = false;
  const serialMaps = new Map<PDBModel, Map<number, number>>();
  for (const line of text.split(/\r?\n/)) {
    const record = line.slice(0, 6).trim();
    if (!record) continue;
    if (record === 'MODEL') {
      if (active || (!explicitModels && models.length))
        throw new Error('PDB: invalid model nesting');
      explicitModels = true;
      const serial = readNumber(line.slice(10, 14), true);
      if (models.some(model => model.serial === serial))
        throw new Error('PDB: duplicate model serial');
      active = {serial, atoms: [], bonds: []};
      models.push(active);
    } else if (record === 'ENDMDL') {
      if (!explicitModels || !active) throw new Error('PDB: unmatched ENDMDL');
      active = undefined;
    } else if (record === 'ATOM' || record === 'HETATM') {
      if (!active) {
        if (explicitModels) throw new Error('PDB: atom outside MODEL');
        active = {serial: 1, atoms: [], bonds: []};
        models.push(active);
      }
      const atom: PDBAtom = {
        serial: readNumber(line.slice(6, 11), true),
        record,
        name: line.slice(12, 16).trim(),
        alternateLocation: line.slice(16, 17).trim(),
        residueName: line.slice(17, 20).trim(),
        chain: line.slice(21, 22).trim(),
        residueNumber: readNumber(line.slice(22, 26), true),
        insertionCode: line.slice(26, 27).trim(),
        position: [
          readNumber(line.slice(30, 38)),
          readNumber(line.slice(38, 46)),
          readNumber(line.slice(46, 54))
        ],
        occupancy: line.slice(54, 60).trim() ? readNumber(line.slice(54, 60)) : undefined,
        temperatureFactor: line.slice(60, 66).trim() ? readNumber(line.slice(60, 66)) : undefined,
        element: line.slice(76, 78).trim(),
        charge: line.slice(78, 80).trim()
      };
      const serials = serialMaps.get(active) || new Map<number, number>();
      if (serials.has(atom.serial)) throw new Error('PDB: duplicate atom serial in model');
      serials.set(atom.serial, active.atoms.length);
      serialMaps.set(active, serials);
      active.atoms.push(atom);
    } else if (record === 'CONECT') {
      const serials: number[] = [];
      for (let offset = 6; offset < 31; offset += 5) {
        const value = line.slice(offset, offset + 5);
        if (value.trim()) serials.push(readNumber(value, true));
      }
      if (serials.length < 2) throw new Error('PDB: incomplete CONECT');
      connections.push({model: explicitModels ? active : undefined, serials});
    } else {
      records.push(line);
    }
  }
  if (explicitModels && active) throw new Error('PDB: missing ENDMDL');
  if (!models.length || models.some(model => !model.atoms.length)) throw new Error('PDB: no atoms');
  for (const model of models) {
    const seen = new Set<string>();
    const serials = serialMaps.get(model)!;
    for (const connection of connections) {
      if (connection.model && connection.model !== model) continue;
      const source = serials.get(connection.serials[0]);
      for (const targetSerial of connection.serials.slice(1)) {
        const target = serials.get(targetSerial);
        if (source === undefined || target === undefined)
          throw new Error('PDB: CONECT references missing atom');
        if (source === target) throw new Error('PDB: self bond');
        const pair: [number, number] = source < target ? [source, target] : [target, source];
        const key = pair.join(':');
        if (!seen.has(key)) model.bonds.push(pair);
        seen.add(key);
      }
    }
  }
  return {coordinateUnit: 'angstrom', models, records};
}

/** Parses one required finite decimal fixed-column field. */
function readNumber(field: string, integer = false): number {
  const value = field.trim();
  if (!(integer ? /^[+-]?\d+$/ : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/).test(value))
    throw new Error('PDB: invalid numeric field');
  const number = Number(value);
  if (!Number.isFinite(number) || (integer && !Number.isSafeInteger(number)))
    throw new Error('PDB: invalid numeric range');
  return number;
}
