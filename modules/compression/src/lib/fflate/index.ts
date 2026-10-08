// biome-ignore-all lint/suspicious/noDoubleEquals: Retain upstream coercion semantics for parity with fflate 0.7.4.
// biome-ignore-all lint/suspicious/noAssignInExpressions: Retain upstream bit-reader control flow for parity.
// SPDX-License-Identifier: MIT
// Copyright (c) 2020 Arjun Barrett
// Synchronous/streaming subset of fflate v0.7.4. See README.md and LICENSE.

// aliases for shorter compressed code (most minifers don't do this)
const u8 = Uint8Array,
  u16 = Uint16Array,
  u32 = Uint32Array;

// fixed length extra bits
const fleb = new u8([
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0,
  /* unused */ 0, 0, /* impossible */ 0
]);

// fixed distance extra bits
// see fleb note
const fdeb = new u8([
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13,
  /* unused */ 0, 0
]);

// code length index map
const clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);

// get base, reverse index map from extra bits
/** get base, reverse index map from extra bits. */
const freb = (eb: Uint8Array, start: number) => {
  const b = new u16(31);
  for (let i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  // numbers here are at max 18 bits
  const r = new u32(b[30]);
  for (let i = 1; i < 30; ++i) {
    for (let j = b[i]; j < b[i + 1]; ++j) {
      r[j] = ((j - b[i]) << 5) | i;
    }
  }
  return [b, r] as const;
};

const [fl, revfl] = freb(fleb, 2);

// we can ignore the fact that the other numbers are wrong; they never happen anyway
(fl[28] = 258), (revfl[258] = 28);

const [fd, revfd] = freb(fdeb, 0);

// map of value to reverse (assuming 16 bits)
const rev = new u16(32768);

for (let i = 0; i < 32768; ++i) {
  // reverse table algorithm from SO
  let x = ((i & 0xaaaa) >>> 1) | ((i & 0x5555) << 1);
  x = ((x & 0xcccc) >>> 2) | ((x & 0x3333) << 2);
  x = ((x & 0xf0f0) >>> 4) | ((x & 0x0f0f) << 4);
  rev[i] = (((x & 0xff00) >>> 8) | ((x & 0x00ff) << 8)) >>> 1;
}

// create huffman tree from u8 "map": index -> code length for code index
// mb (max bits) must be at most 15
// TODO: optimize/split up?
/** create huffman tree from u8 "map": index -> code length for code index mb (max bits) must be at most 15 TODO: optimize/split up?. */
const hMap = (cd: Uint8Array, mb: number, r: 0 | 1) => {
  const s = cd.length;
  // index
  let i = 0;
  // u16 "map": index -> # of codes with bit length = index
  const l = new u16(mb);
  // length of cd must be 288 (total # of codes)
  for (; i < s; ++i) {
    if (cd[i]) ++l[cd[i] - 1];
  }
  // u16 "map": index -> minimum code for bit length = index
  const le = new u16(mb);
  for (i = 0; i < mb; ++i) {
    le[i] = (le[i - 1] + l[i - 1]) << 1;
  }
  let co: Uint16Array;
  if (r) {
    // u16 "map": index -> number of actual bits, symbol for code
    co = new u16(1 << mb);
    // bits to remove for reverser
    const rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      // ignore 0 lengths
      if (cd[i]) {
        // num encoding both symbol and bits read
        const sv = (i << 4) | cd[i];
        // free bits
        const r = mb - cd[i];
        // start value
        let v = le[cd[i] - 1]++ << r;
        // m is end value
        for (const m = v | ((1 << r) - 1); v <= m; ++v) {
          // every 16 bit value starting with the code yields the same result
          co[rev[v] >>> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >>> (15 - cd[i]);
      }
    }
  }
  return co;
};

// fixed length tree
const flt = new u8(288);

for (let i = 0; i < 144; ++i) flt[i] = 8;

for (let i = 144; i < 256; ++i) flt[i] = 9;

for (let i = 256; i < 280; ++i) flt[i] = 7;

for (let i = 280; i < 288; ++i) flt[i] = 8;

// fixed distance tree
const fdt = new u8(32);

for (let i = 0; i < 32; ++i) fdt[i] = 5;

// fixed length map
const flm = /*#__PURE__*/ hMap(flt, 9, 0),
  flrm = /*#__PURE__*/ hMap(flt, 9, 1);

// fixed distance map
const fdm = /*#__PURE__*/ hMap(fdt, 5, 0),
  fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);

// find max of array
/** find max of array. */
const max = (a: Uint8Array | number[]) => {
  let m = a[0];
  for (let i = 1; i < a.length; ++i) {
    if (a[i] > m) m = a[i];
  }
  return m;
};

// read d, starting at bit p and mask with m
/** read d, starting at bit p and mask with m. */
const bits = (d: Uint8Array, p: number, m: number) => {
  const o = (p / 8) | 0;
  return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
};

// read d, starting at bit p continuing for at least 16 bits
/** read d, starting at bit p continuing for at least 16 bits. */
const bits16 = (d: Uint8Array, p: number) => {
  const o = (p / 8) | 0;
  return (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7);
};

// get end of byte
/** get end of byte. */
const shft = (p: number) => ((p + 7) / 8) | 0;

// typed array slice - allows garbage collector to free original reference,
// while being more compatible than .slice
/** typed array slice - allows garbage collector to free original reference, while being more compatible than .slice. */
const slc = <T extends Uint8Array | Uint16Array | Uint32Array>(v: T, s: number, e?: number): T => {
  if (s == null || s < 0) s = 0;
  if (e == null || e > v.length) e = v.length;
  // can't use .constructor in case user-supplied
  const n = new (v.BYTES_PER_ELEMENT == 2 ? u16 : v.BYTES_PER_ELEMENT == 4 ? u32 : u8)(e - s) as T;
  n.set(v.subarray(s, e));
  return n;
};

// inflate state
type InflateState = {
  // lmap
  l?: Uint16Array;
  // dmap
  d?: Uint16Array;
  // lbits
  m?: number;
  // dbits
  n?: number;
  // final
  f?: number;
  // pos
  p?: number;
  // byte
  b?: number;
  // lstchk
  i?: boolean;
};

/**
 * Codes for errors generated within this library
 */
export const FlateErrorCode = {
  UnexpectedEOF: 0,
  InvalidBlockType: 1,
  InvalidLengthLiteral: 2,
  InvalidDistance: 3,
  StreamFinished: 4,
  NoStreamHandler: 5,
  InvalidHeader: 6,
  NoCallback: 7,
  InvalidUTF8: 8,
  ExtraFieldTooLong: 9,
  InvalidDate: 10,
  FilenameTooLong: 11,
  StreamFinishing: 12,
  InvalidZipData: 13,
  UnknownCompressionMethod: 14
} as const;

// error codes
const ec = [
  'unexpected EOF',
  'invalid block type',
  'invalid length/literal',
  'invalid distance',
  'stream finished',
  'no stream handler',
  ,
  // determined by compression function
  'no callback',
  'invalid UTF-8 data',
  'extra field too long',
  'date not in range 1980-2099',
  'filename too long',
  'stream finishing',
  'invalid zip data'
  // determined by unknown compression method
];

/**
 * An error generated within this library
 */
export interface FlateError extends Error {
  /**
   * The code associated with this error
   */
  code: number;
}

const err = (ind: number, msg?: string | 0, nt?: 1) => {
  const e: Partial<FlateError> = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace) Error.captureStackTrace(e, err);
  if (!nt) throw e;
  return e as FlateError;
};

// expands raw DEFLATE data
/** expands raw DEFLATE data. */
const inflt = (dat: Uint8Array, buf?: Uint8Array, st?: InflateState) => {
  // source length
  const sl = dat.length;
  if (!sl || (st && st.f && !st.l)) return buf || new u8(0);
  // have to estimate size
  const noBuf = !buf || (st as unknown as boolean);
  // no state
  const noSt = !st || st.i;
  if (!st) st = {};
  // Assumes roughly 33% compression ratio average
  if (!buf) buf = new u8(sl * 3);
  // ensure buffer can fit at least l elements
  const cbuf = (l: number) => {
    let bl = buf!.length;
    // need to increase size to fit
    if (l > bl) {
      // Double or set to necessary, whichever is greater
      const nbuf = new u8(Math.max(bl * 2, l));
      nbuf.set(buf!);
      buf = nbuf;
    }
  };
  //  last chunk         bitpos           bytes
  let final = st.f || 0,
    pos = st.p || 0,
    bt = st.b || 0,
    lm = st.l,
    dm = st.d,
    lbt = st.m,
    dbt = st.n;
  // total bits
  const tbts = sl * 8;
  do {
    if (!lm) {
      // BFINAL - this is only 1 when last chunk is next
      final = bits(dat, pos, 1);
      // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
      const type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        // go to end of byte boundary
        const s = shft(pos) + 4,
          l = dat[s - 4] | (dat[s - 3] << 8),
          t = s + l;
        if (t > sl) {
          if (noSt) err(0);
          break;
        }
        // ensure size
        if (noBuf) cbuf(bt + l);
        // Copy over uncompressed data
        buf.set(dat.subarray(s, t), bt);
        // Get new bitpos, update byte count
        (st.b = bt += l), (st.p = pos = t * 8), (st.f = final);
        continue;
      } else if (type == 1) (lm = flrm), (dm = fdrm), (lbt = 9), (dbt = 5);
      else if (type == 2) {
        //  literal                            lengths
        const hLit = bits(dat, pos, 31) + 257,
          hcLen = bits(dat, pos + 10, 15) + 4;
        const tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        // length+distance tree
        const ldt = new u8(tl);
        // code length tree
        const clt = new u8(19);
        for (let i = 0; i < hcLen; ++i) {
          // use index map to get real code
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        // code lengths bits
        const clb = max(clt),
          clbmsk = (1 << clb) - 1;
        // code lengths map
        const clm = hMap(clt, clb, 1);
        for (let i = 0; i < tl; ) {
          const r = clm[bits(dat, pos, clbmsk)];
          // bits read
          pos += r & 15;
          // symbol
          const s = r >>> 4;
          // code length to copy
          if (s < 16) {
            ldt[i++] = s;
          } else {
            //  copy   count
            let c = 0,
              n = 0;
            if (s == 16) (n = 3 + bits(dat, pos, 3)), (pos += 2), (c = ldt[i - 1]);
            else if (s == 17) (n = 3 + bits(dat, pos, 7)), (pos += 3);
            else if (s == 18) (n = 11 + bits(dat, pos, 127)), (pos += 7);
            while (n--) ldt[i++] = c;
          }
        }
        //    length tree                 distance tree
        const lt = ldt.subarray(0, hLit),
          dt = ldt.subarray(hLit);
        // max length bits
        lbt = max(lt);
        // max dist bits
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else err(1);
      if (pos > tbts) {
        if (noSt) err(0);
        break;
      }
    }
    // Make sure the buffer can hold this + the largest possible addition
    // Maximum chunk size (practically, theoretically infinite) is 2^17;
    if (noBuf) cbuf(bt + 131072);
    const lms = (1 << lbt!) - 1,
      dms = (1 << dbt!) - 1;
    let lpos = pos;
    for (; ; lpos = pos) {
      // bits read, code
      const c = lm![bits16(dat, pos) & lms],
        sym = c >>> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt) err(0);
        break;
      }
      if (!c) err(2);
      if (sym < 256) buf[bt++] = sym;
      else if (sym == 256) {
        (lpos = pos), (lm = undefined);
        break;
      } else {
        let add = sym - 254;
        // no extra bits needed if less
        if (sym > 264) {
          // index
          const i = sym - 257,
            b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        // dist
        const d = dm![bits16(dat, pos) & dms],
          dsym = d >>> 4;
        if (!d) err(3);
        pos += d & 15;
        let dt = fd[dsym];
        if (dsym > 3) {
          const b = fdeb[dsym];
          (dt += bits16(dat, pos) & ((1 << b) - 1)), (pos += b);
        }
        if (pos > tbts) {
          if (noSt) err(0);
          break;
        }
        if (noBuf) cbuf(bt + 131072);
        const end = bt + add;
        for (; bt < end; bt += 4) {
          buf[bt] = buf[bt - dt];
          buf[bt + 1] = buf[bt + 1 - dt];
          buf[bt + 2] = buf[bt + 2 - dt];
          buf[bt + 3] = buf[bt + 3 - dt];
        }
        bt = end;
      }
    }
    (st.l = lm), (st.p = lpos), (st.b = bt), (st.f = final);
    if (lm) (final = 1), (st.m = lbt), (st.d = dm), (st.n = dbt);
  } while (!final);
  return bt == buf.length ? buf : slc(buf, 0, bt);
};

// starting at p, write the minimum number of bits that can hold v to d
/** starting at p, write the minimum number of bits that can hold v to d. */
const wbits = (d: Uint8Array, p: number, v: number) => {
  v <<= p & 7;
  const o = (p / 8) | 0;
  d[o] |= v;
  d[o + 1] |= v >>> 8;
};

// starting at p, write the minimum number of bits (>8) that can hold v to d
/** starting at p, write the minimum number of bits (>8) that can hold v to d. */
const wbits16 = (d: Uint8Array, p: number, v: number) => {
  v <<= p & 7;
  const o = (p / 8) | 0;
  d[o] |= v;
  d[o + 1] |= v >>> 8;
  d[o + 2] |= v >>> 16;
};

type HuffNode = {
  // symbol
  s: number;
  // frequency
  f: number;
  // left child
  l?: HuffNode;
  // right child
  r?: HuffNode;
};

// creates code lengths from a frequency table
/** creates code lengths from a frequency table. */
const hTree = (d: Uint16Array, mb: number) => {
  // Need extra info to make a tree
  const t: HuffNode[] = [];
  for (let i = 0; i < d.length; ++i) {
    if (d[i]) t.push({s: i, f: d[i]});
  }
  const s = t.length;
  const t2 = t.slice();
  if (!s) return [et, 0] as const;
  if (s == 1) {
    const v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return [v, 1] as const;
  }
  t.sort((a, b) => a.f - b.f);
  // after i2 reaches last ind, will be stopped
  // freq must be greater than largest possible number of symbols
  t.push({s: -1, f: 25001});
  let l = t[0],
    r = t[1],
    i0 = 0,
    i1 = 1,
    i2 = 2;
  t[0] = {s: -1, f: l.f + r.f, l, r};
  // efficient algorithm from UZIP.js
  // i0 is lookbehind, i2 is lookahead - after processing two low-freq
  // symbols that combined have high freq, will start processing i2 (high-freq,
  // non-composite) symbols instead
  // see https://reddit.com/r/photopea/comments/ikekht/uzipjs_questions/
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = {s: -1, f: l.f + r.f, l, r};
  }
  let maxSym = t2[0].s;
  for (let i = 1; i < s; ++i) {
    if (t2[i].s > maxSym) maxSym = t2[i].s;
  }
  // code lengths
  const tr = new u16(maxSym + 1);
  // max bits in tree
  let mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    // more algorithms from UZIP.js
    // TODO: find out how this code works (debt)
    //  ind    debt
    let i = 0,
      dt = 0;
    //    left            cost
    const lft = mbt - mb,
      cst = 1 << lft;
    t2.sort((a, b) => tr[b.s] - tr[a.s] || a.f - b.f);
    for (; i < s; ++i) {
      const i2 = t2[i].s;
      if (tr[i2] > mb) {
        dt += cst - (1 << (mbt - tr[i2]));
        tr[i2] = mb;
      } else break;
    }
    dt >>>= lft;
    while (dt > 0) {
      const i2 = t2[i].s;
      if (tr[i2] < mb) dt -= 1 << (mb - tr[i2]++ - 1);
      else ++i;
    }
    for (; i >= 0 && dt; --i) {
      const i2 = t2[i].s;
      if (tr[i2] == mb) {
        --tr[i2];
        ++dt;
      }
    }
    mbt = mb;
  }
  return [new u8(tr), mbt] as const;
};

// get the max length and assign length codes
/** get the max length and assign length codes. */
const ln = (n: HuffNode, l: Uint16Array, d: number): number => {
  return n.s == -1 ? Math.max(ln(n.l!, l, d + 1), ln(n.r!, l, d + 1)) : (l[n.s] = d);
};

// length codes generation
/** length codes generation. */
const lc = (c: Uint8Array) => {
  let s = c.length;
  // Note that the semicolon was intentional
  while (s && !c[--s]);
  const cl = new u16(++s);
  //  ind      num         streak
  let cli = 0,
    cln = c[0],
    cls = 1;
  const w = (v: number) => {
    cl[cli++] = v;
  };
  for (let i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s) ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138) w(32754);
        if (cls > 2) {
          w(cls > 10 ? ((cls - 11) << 5) | 28690 : ((cls - 3) << 5) | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6) w(8304);
        if (cls > 2) w(((cls - 3) << 5) | 8208), (cls = 0);
      }
      while (cls--) w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return [cl.subarray(0, cli), s] as const;
};

// calculate the length of output from tree, code lengths
/** calculate the length of output from tree, code lengths. */
const clen = (cf: Uint16Array, cl: Uint8Array) => {
  let l = 0;
  for (let i = 0; i < cl.length; ++i) l += cf[i] * cl[i];
  return l;
};

// writes a fixed block
// returns the new bit pos
/** writes a fixed block returns the new bit pos. */
const wfblk = (out: Uint8Array, pos: number, dat: Uint8Array) => {
  // no need to write 00 as type: TypedArray defaults to 0
  const s = dat.length;
  const o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >>> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (let i = 0; i < s; ++i) out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};

// writes a block
/** writes a block. */
const wblk = (
  dat: Uint8Array,
  out: Uint8Array,
  final: number,
  syms: Uint32Array,
  lf: Uint16Array,
  df: Uint16Array,
  eb: number,
  li: number,
  bs: number,
  bl: number,
  p: number
) => {
  wbits(out, p++, final);
  ++lf[256];
  const [dlt, mlb] = hTree(lf, 15);
  const [ddt, mdb] = hTree(df, 15);
  const [lclt, nlc] = lc(dlt);
  const [lcdt, ndc] = lc(ddt);
  const lcfreq = new u16(19);
  for (let i = 0; i < lclt.length; ++i) lcfreq[lclt[i] & 31]++;
  for (let i = 0; i < lcdt.length; ++i) lcfreq[lcdt[i] & 31]++;
  const [lct, mlcb] = hTree(lcfreq, 7);
  let nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc);
  const flen = (bl + 5) << 3;
  const ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  const dtlen =
    clen(lf, dlt) +
    clen(df, ddt) +
    eb +
    14 +
    3 * nlcc +
    clen(lcfreq, lct) +
    (2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18]);
  if (flen <= ftlen && flen <= dtlen) return wfblk(out, p, dat.subarray(bs, bs + bl));
  let lm: Uint16Array, ll: Uint8Array, dm: Uint16Array, dl: Uint8Array;
  wbits(out, p, 1 + ((dtlen < ftlen) as unknown as number)), (p += 2);
  if (dtlen < ftlen) {
    (lm = hMap(dlt, mlb, 0)), (ll = dlt), (dm = hMap(ddt, mdb, 0)), (dl = ddt);
    const llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (let i = 0; i < nlcc; ++i) wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    const lcts = [lclt, lcdt];
    for (let it = 0; it < 2; ++it) {
      const clct = lcts[it];
      for (let i = 0; i < clct.length; ++i) {
        const len = clct[i] & 31;
        wbits(out, p, llm[len]), (p += lct[len]);
        if (len > 15) wbits(out, p, (clct[i] >>> 5) & 127), (p += clct[i] >>> 12);
      }
    }
  } else {
    (lm = flm), (ll = flt), (dm = fdm), (dl = fdt);
  }
  for (let i = 0; i < li; ++i) {
    if (syms[i] > 255) {
      const len = (syms[i] >>> 18) & 31;
      wbits16(out, p, lm[len + 257]), (p += ll[len + 257]);
      if (len > 7) wbits(out, p, (syms[i] >>> 23) & 31), (p += fleb[len]);
      const dst = syms[i] & 31;
      wbits16(out, p, dm[dst]), (p += dl[dst]);
      if (dst > 3) wbits16(out, p, (syms[i] >>> 5) & 8191), (p += fdeb[dst]);
    } else {
      wbits16(out, p, lm[syms[i]]), (p += ll[syms[i]]);
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};

// deflate options (nice << 13) | chain
const deo = /*#__PURE__*/ new u32([
  65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632
]);

// empty
const et = /*#__PURE__*/ new u8(0);

// compresses data into a raw DEFLATE buffer
/** compresses data into a raw DEFLATE buffer. */
const dflt = (
  dat: Uint8Array,
  lvl: number,
  plvl: number,
  pre: number,
  post: number,
  lst: 0 | 1
) => {
  const s = dat.length;
  const o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7000)) + post);
  // writing to this writes to the output buffer
  const w = o.subarray(pre, o.length - post);
  let pos = 0;
  if (!lvl || s < 8) {
    for (let i = 0; i <= s; i += 65535) {
      // end
      const e = i + 65535;
      if (e >= s) {
        // write final block
        w[pos >> 3] = lst;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
  } else {
    const opt = deo[lvl - 1];
    const n = opt >>> 13,
      c = opt & 8191;
    const msk = (1 << plvl) - 1;
    //    prev 2-byte val map    curr 2-byte val map
    const prev = new u16(32768),
      head = new u16(msk + 1);
    const bs1 = Math.ceil(plvl / 3),
      bs2 = 2 * bs1;
    const hsh = (i: number) => (dat[i] ^ (dat[i + 1] << bs1) ^ (dat[i + 2] << bs2)) & msk;
    // 24576 is an arbitrary number of maximum symbols per block
    // 424 buffer for last block
    const syms = new u32(25000);
    // length/literal freq   distance freq
    const lf = new u16(288),
      df = new u16(32);
    //  l/lcnt  exbits  index  l/lind  waitdx  bitpos
    let lc = 0,
      eb = 0,
      i = 0,
      li = 0,
      wi = 0,
      bs = 0;
    for (; i < s; ++i) {
      // hash value
      // deopt when i > s - 3 - at end, deopt acceptable
      const hv = hsh(i);
      // index mod 32768    previous index mod
      let imod = i & 32767,
        pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      // We always should modify head and prev, but only add symbols if
      // this data is not yet processed ("wait" for wait index)
      if (wi <= i) {
        // bytes remaining
        const rem = s - i;
        if ((lc > 7000 || li > 24576) && rem > 423) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          (li = lc = eb = 0), (bs = i);
          for (let j = 0; j < 286; ++j) lf[j] = 0;
          for (let j = 0; j < 30; ++j) df[j] = 0;
        }
        //  len    dist   chain
        let l = 2,
          d = 0,
          ch = c,
          dif = (imod - pimod) & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          const maxn = Math.min(n, rem) - 1;
          const maxd = Math.min(32767, i);
          // max possible length
          // not capped at dif because decompressors implement "rolling" index population
          const ml = Math.min(258, rem);
          while (dif <= maxd && --ch && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              let nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl);
              if (nl > l) {
                (l = nl), (d = dif);
                // break out early when we reach "nice" (we are satisfied enough)
                if (nl > maxn) break;
                // now, find the rarest 2-byte sequence within this
                // length of literals and search for that instead.
                // Much faster than just using the start
                const mmd = Math.min(dif, nl - 2);
                let md = 0;
                for (let j = 0; j < mmd; ++j) {
                  const ti = (i - dif + j + 32768) & 32767;
                  const pti = prev[ti];
                  const cd = (ti - pti + 32768) & 32767;
                  if (cd > md) (md = cd), (pimod = ti);
                }
              }
            }
            // check the previous match
            (imod = pimod), (pimod = prev[imod]);
            dif += (imod - pimod + 32768) & 32767;
          }
        }
        // d will be nonzero only when a match was found
        if (d) {
          // store both dist and len data in one Uint32
          // Make sure this is recognized as a len/dist with 28th bit (2^28)
          syms[li++] = 268435456 | (revfl[l] << 18) | revfd[d];
          const lin = revfl[l] & 31,
            din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    // this is the easiest way to avoid needing to maintain state
    if (!lst && pos & 7) pos = wfblk(w, pos + 1, et);
  }
  return slc(o, 0, pre + shft(pos) + post);
};

// crc check
type CRCV = {
  p(d: Uint8Array): void;
  d(): number;
};

// CRC32 table
const crct = /*#__PURE__*/ (() => {
  const t = new Int32Array(256);
  for (let i = 0; i < 256; ++i) {
    let c = i,
      k = 9;
    while (--k) c = (c & 1 && -306674912) ^ (c >>> 1);
    t[i] = c;
  }
  return t;
})();

// CRC32
/** CRC32. */
const crc = (): CRCV => {
  let c = -1;
  return {
    p(d) {
      // closures have awful performance
      let cr = c;
      for (let i = 0; i < d.length; ++i) cr = crct[(cr & 255) ^ d[i]] ^ (cr >>> 8);
      c = cr;
    },
    d() {
      return ~c;
    }
  };
};

// Alder32
/** Alder32. */
const adler = (): CRCV => {
  let a = 1,
    b = 0;
  return {
    p(d) {
      // closures have awful performance
      let n = a,
        m = b;
      const l = d.length | 0;
      for (let i = 0; i != l; ) {
        const e = Math.min(i + 2655, l);
        for (; i < e; ++i) m += n += d[i];
        (n = (n & 65535) + 15 * (n >> 16)), (m = (m & 65535) + 15 * (m >> 16));
      }
      (a = n), (b = m);
    },
    d() {
      (a %= 65521), (b %= 65521);
      return ((a & 255) << 24) | ((a >>> 8) << 16) | ((b & 255) << 8) | (b >>> 8);
    }
  };
};

/**
 * Options for compressing data into a DEFLATE format
 */
export interface DeflateOptions {
  /**
   * The level of compression to use, ranging from 0-9.
   *
   * 0 will store the data without compression.
   * 1 is fastest but compresses the worst, 9 is slowest but compresses the best.
   * The default level is 6.
   *
   * Typically, binary data benefits much more from higher values than text data.
   * In both cases, higher values usually take disproportionately longer than the reduction in final size that results.
   *
   * For example, a 1 MB text file could:
   * - become 1.01 MB with level 0 in 1ms
   * - become 400 kB with level 1 in 10ms
   * - become 320 kB with level 9 in 100ms
   */
  level?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /**
   * The memory level to use, ranging from 0-12. Increasing this increases speed and compression ratio at the cost of memory.
   *
   * Note that this is exponential: while level 0 uses 4 kB, level 4 uses 64 kB, level 8 uses 1 MB, and level 12 uses 16 MB.
   * It is recommended not to lower the value below 4, since that tends to hurt performance.
   * In addition, values above 8 tend to help very little on most data and can even hurt performance.
   *
   * The default value is automatically determined based on the size of the input data.
   */
  mem?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

/**
 * Options for compressing data into a GZIP format
 */
export interface GzipOptions extends DeflateOptions {
  /**
   * When the file was last modified. Defaults to the current time.
   * Set this to 0 to avoid revealing a modification date entirely.
   */
  mtime?: Date | string | number;
  /**
   * The filename of the data. If the `gunzip` command is used to decompress the data, it will output a file
   * with this name instead of the name of the compressed file.
   */
  filename?: string;
}

/**
 * Options for compressing data into a Zlib format
 */
export interface ZlibOptions extends DeflateOptions {}

/**
 * Handler for data (de)compression streams
 * @param data The data output from the stream processor
 * @param final Whether this is the final block
 */
export type FlateStreamHandler = (data: Uint8Array, final: boolean) => void;

// deflate with opts
/** deflate with opts. */
const dopt = (dat: Uint8Array, opt: DeflateOptions, pre: number, post: number, st?: boolean) =>
  dflt(
    dat,
    opt.level == null ? 6 : opt.level,
    opt.mem == null
      ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5)
      : 12 + opt.mem,
    pre,
    post,
    !st as unknown as 0 | 1
  );

// write bytes
/** write bytes. */
const wbytes = (d: Uint8Array, b: number, v: number) => {
  for (; v; ++b) (d[b] = v), (v >>>= 8);
};

// gzip header
/** gzip header. */
const gzh = (c: Uint8Array, o: GzipOptions) => {
  const fn = o.filename;
  (c[0] = 31),
    (c[1] = 139),
    (c[2] = 8),
    (c[8] = o.level! < 2 ? 4 : o.level == 9 ? 2 : 0),
    (c[9] = 3); // assume Unix
  if (o.mtime != 0)
    wbytes(
      c,
      4,
      Math.floor((new Date((o.mtime as string | number) || Date.now()) as unknown as number) / 1000)
    );
  if (fn) {
    c[3] = 8;
    for (let i = 0; i <= fn.length; ++i) c[i + 10] = fn.charCodeAt(i);
  }
};

// gzip footer: -8 to -4 = CRC, -4 to -0 is length

// gzip start
/** gzip footer: -8 to -4 = CRC, -4 to -0 is length gzip start. */
const gzs = (d: Uint8Array) => {
  if (d[0] != 31 || d[1] != 139 || d[2] != 8) err(6, 'invalid gzip data');
  const flg = d[3];
  let st = 10;
  if (flg & 4) st += d[10] | ((d[11] << 8) + 2);
  for (let zs = ((flg >> 3) & 1) + ((flg >> 4) & 1); zs > 0; zs -= !d[st++] as unknown as number);
  return st + (flg & 2);
};

// gzip length
/** gzip length. */
const gzl = (d: Uint8Array) => {
  const l = d.length;
  return (d[l - 4] | (d[l - 3] << 8) | (d[l - 2] << 16) | (d[l - 1] << 24)) >>> 0;
};

// gzip header length
/** gzip header length. */
const gzhl = (o: GzipOptions) => 10 + ((o.filename && o.filename.length + 1) || 0);

// zlib header
/** zlib header. */
const zlh = (c: Uint8Array, o: ZlibOptions) => {
  const lv = o.level,
    fl = lv == 0 ? 0 : lv! < 6 ? 1 : lv == 9 ? 3 : 2;
  (c[0] = 120), (c[1] = (fl << 6) | (fl ? 32 - 2 * fl : 1));
};

// zlib valid
/** zlib valid. */
const zlv = (d: Uint8Array) => {
  if ((d[0] & 15) != 8 || d[0] >>> 4 > 7 || ((d[0] << 8) | d[1]) % 31) err(6, 'invalid zlib data');
  if (d[1] & 32) err(6, 'invalid zlib data: preset dictionaries not supported');
};

// zlib footer: -4 to -0 is Adler32

/**
 * Streaming DEFLATE compression
 */
export class Deflate {
  /**
   * Creates a DEFLATE stream
   * @param opts The compression options
   * @param cb The callback to call whenever data is deflated
   */
  constructor(opts: DeflateOptions, cb?: FlateStreamHandler);
  /** Initializes the stream and its output handler. */
  constructor(cb?: FlateStreamHandler);
  /** Initializes the stream and its output handler. */
  constructor(opts?: DeflateOptions | FlateStreamHandler, cb?: FlateStreamHandler) {
    if (!cb && typeof opts == 'function') (cb = opts as FlateStreamHandler), (opts = {});
    this.ondata = cb!;
    this.o = (opts as DeflateOptions) || {};
  }
  /** Compression options or retained output window for this stream. */
  protected o: DeflateOptions;
  /** Whether the stream has received its final chunk. */
  protected d!: boolean;
  /**
   * The handler to call whenever data is available
   */
  ondata!: FlateStreamHandler;

  /** Encodes a chunk and emits its framed output. */
  protected p(c: Uint8Array, f: boolean) {
    this.ondata(dopt(c, this.o, 0, 0, !f), f);
  }

  /**
   * Pushes a chunk to be deflated
   * @param chunk The chunk to push
   * @param final Whether this is the last chunk
   */
  push(chunk: Uint8Array, final?: boolean) {
    if (!this.ondata) err(5);
    if (this.d) err(4);
    this.d = final!;
    this.p(chunk, final || false);
  }
}

/**
 * Compresses data with DEFLATE without any wrapper
 * @param data The data to compress
 * @param opts The compression options
 * @returns The deflated version of the data
 */
export function deflateSync(data: Uint8Array, opts?: DeflateOptions) {
  return dopt(data, opts || {}, 0, 0);
}

/**
 * Streaming DEFLATE decompression
 */
export class Inflate {
  /**
   * Creates an inflation stream
   * @param cb The callback to call whenever data is inflated
   */
  constructor(cb?: FlateStreamHandler) {
    this.ondata = cb!;
  }
  /** Persistent bit-reader and Huffman decoding state. */
  private s: InflateState = {};
  /** Compression options or retained output window for this stream. */
  protected o!: Uint8Array;
  /** Compressed bytes pending decoding. */
  protected p: Uint8Array = new u8(0);
  /** Whether the stream has received its final chunk. */
  protected d!: boolean;
  /**
   * The handler to call whenever data is available
   */
  ondata!: FlateStreamHandler;

  /** Appends pending input after checking stream lifecycle. */
  protected e(c: Uint8Array) {
    if (!this.ondata) err(5);
    if (this.d) err(4);
    const l = this.p.length;
    const n = new u8(l + c.length);
    n.set(this.p), n.set(c, l), (this.p = n);
  }

  /** Decodes pending input and retains the sliding window. */
  protected c(final?: boolean) {
    this.d = this.s.i = final || false;
    const bts = this.s.b;
    const dt = inflt(this.p, this.o, this.s);
    this.ondata(slc(dt, bts!, this.s.b), this.d);
    (this.o = slc(dt, this.s.b! - 32768)), (this.s.b = this.o.length);
    (this.p = slc(this.p, (this.s.p! / 8) | 0)), (this.s.p! &= 7);
  }

  /**
   * Pushes a chunk to be inflated
   * @param chunk The chunk to push
   * @param final Whether this is the final chunk
   */
  push(chunk: Uint8Array, final?: boolean) {
    this.e(chunk), this.c(final);
  }
}

/**
 * Expands DEFLATE data with no wrapper
 * @param data The data to decompress
 * @param out Where to write the data. Saves memory if you know the decompressed size and provide an output buffer of that length.
 * @returns The decompressed version of the data
 */
export function inflateSync(data: Uint8Array, out?: Uint8Array) {
  return inflt(data, out);
}

// before you yell at me for not just using extends, my reason is that TS inheritance is hard to workerize.

/**
 * Streaming GZIP compression
 */
export class Gzip extends Deflate {
  /** Checksum accumulator for the framed output. */
  private c = crc();
  /** Total uncompressed byte count for the GZIP footer. */
  private l = 0;
  /** Whether the stream header still needs to be emitted or consumed. */
  private v = 1;
  /** Compression options or retained output window for this stream. */
  protected declare o: GzipOptions;
  /**
   * The handler to call whenever data is available
   */
  declare ondata: FlateStreamHandler;

  /**
   * Creates a GZIP stream
   * @param opts The compression options
   * @param cb The callback to call whenever data is deflated
   */
  constructor(opts: GzipOptions, cb?: FlateStreamHandler);
  /**
   * Creates a GZIP stream
   * @param cb The callback to call whenever data is deflated
   */
  constructor(cb?: FlateStreamHandler);
  /** Initializes the stream and its output handler. */
  constructor(opts?: GzipOptions | FlateStreamHandler, cb?: FlateStreamHandler) {
    super(opts as DeflateOptions, cb);
  }

  /**
   * Pushes a chunk to be GZIPped
   * @param chunk The chunk to push
   * @param final Whether this is the last chunk
   */
  push(chunk: Uint8Array, final?: boolean) {
    Deflate.prototype.push.call(this, chunk, final);
  }

  /** Encodes a chunk and emits its framed output. */
  protected p(c: Uint8Array, f: boolean) {
    this.c.p(c);
    this.l += c.length;
    const raw = dopt(c, this.o, this.v ? gzhl(this.o) : 0, f ? 8 : 0, !f);
    if (this.v) gzh(raw, this.o), (this.v = 0);
    if (f) wbytes(raw, raw.length - 8, this.c.d()), wbytes(raw, raw.length - 4, this.l);
    this.ondata(raw, f);
  }
}

/**
 * Compresses data with GZIP
 * @param data The data to compress
 * @param opts The compression options
 * @returns The gzipped version of the data
 */
export function gzipSync(data: Uint8Array, opts?: GzipOptions) {
  if (!opts) opts = {};
  const c = crc(),
    l = data.length;
  c.p(data);
  const d = dopt(data, opts, gzhl(opts), 8),
    s = d.length;
  return gzh(d, opts), wbytes(d, s - 8, c.d()), wbytes(d, s - 4, l), d;
}

/**
 * Streaming GZIP decompression
 */
export class Gunzip extends Inflate {
  /** Whether the stream header still needs to be emitted or consumed. */
  private v = 1;
  /** Compressed bytes pending decoding. */
  protected declare p: Uint8Array;
  /**
   * The handler to call whenever data is available
   */
  declare ondata: FlateStreamHandler;

  /**
   * Creates a GUNZIP stream
   * @param cb The callback to call whenever data is inflated
   */
  constructor(cb?: FlateStreamHandler) {
    super(cb);
  }

  /**
   * Pushes a chunk to be GUNZIPped
   * @param chunk The chunk to push
   * @param final Whether this is the last chunk
   */
  push(chunk: Uint8Array, final?: boolean) {
    (Inflate.prototype as unknown as {e: (typeof Inflate.prototype)['e']}).e.call(this, chunk);
    if (this.v) {
      const s = this.p.length > 3 ? gzs(this.p) : 4;
      if (s >= this.p.length && !final) return;
      (this.p = this.p.subarray(s)), (this.v = 0);
    }
    if (final) {
      if (this.p.length < 8) err(6, 'invalid gzip data');
      this.p = this.p.subarray(0, -8);
    }
    // necessary to prevent TS from using the closure value
    // This allows for workerization to function correctly
    (Inflate.prototype as unknown as {c: (typeof Inflate.prototype)['c']}).c.call(this, final);
  }
}

/**
 * Expands GZIP data
 * @param data The data to decompress
 * @param out Where to write the data. GZIP already encodes the output size, so providing this doesn't save memory.
 * @returns The decompressed version of the data
 */
export function gunzipSync(data: Uint8Array, out?: Uint8Array) {
  return inflt(data.subarray(gzs(data), -8), out || new u8(gzl(data)));
}

/**
 * Streaming Zlib compression
 */
export class Zlib extends Deflate {
  /** Checksum accumulator for the framed output. */
  private c = adler();
  /** Whether the stream header still needs to be emitted or consumed. */
  private v = 1;
  /** Compression options or retained output window for this stream. */
  protected declare o: GzipOptions;
  /**
   * The handler to call whenever data is available
   */
  declare ondata: FlateStreamHandler;

  /**
   * Creates a Zlib stream
   * @param opts The compression options
   * @param cb The callback to call whenever data is deflated
   */
  constructor(opts: ZlibOptions, cb?: FlateStreamHandler);
  /**
   * Creates a Zlib stream
   * @param cb The callback to call whenever data is deflated
   */
  constructor(cb?: FlateStreamHandler);
  /** Initializes the stream and its output handler. */
  constructor(opts?: ZlibOptions | FlateStreamHandler, cb?: FlateStreamHandler) {
    super(opts as DeflateOptions, cb);
  }

  /**
   * Pushes a chunk to be zlibbed
   * @param chunk The chunk to push
   * @param final Whether this is the last chunk
   */
  push(chunk: Uint8Array, final?: boolean) {
    Deflate.prototype.push.call(this, chunk, final);
  }

  /** Encodes a chunk and emits its framed output. */
  protected p(c: Uint8Array, f: boolean) {
    this.c.p(c);
    const raw = dopt(c, this.o, this.v ? 2 : 0, f ? 4 : 0, !f);
    if (this.v) zlh(raw, this.o), (this.v = 0);
    if (f) wbytes(raw, raw.length - 4, this.c.d());
    this.ondata(raw, f);
  }
}

/**
 * Compress data with Zlib
 * @param data The data to compress
 * @param opts The compression options
 * @returns The zlib-compressed version of the data
 */
export function zlibSync(data: Uint8Array, opts?: ZlibOptions) {
  if (!opts) opts = {};
  const a = adler();
  a.p(data);
  const d = dopt(data, opts, 2, 4);
  return zlh(d, opts), wbytes(d, d.length - 4, a.d()), d;
}

/**
 * Streaming Zlib decompression
 */
export class Unzlib extends Inflate {
  /** Whether the stream header still needs to be emitted or consumed. */
  private v = 1;
  /** Compressed bytes pending decoding. */
  protected declare p: Uint8Array;
  /**
   * The handler to call whenever data is available
   */
  declare ondata: FlateStreamHandler;
  /**
   * Creates a Zlib decompression stream
   * @param cb The callback to call whenever data is inflated
   */
  constructor(cb?: FlateStreamHandler) {
    super(cb);
  }

  /**
   * Pushes a chunk to be unzlibbed
   * @param chunk The chunk to push
   * @param final Whether this is the last chunk
   */
  push(chunk: Uint8Array, final?: boolean) {
    (Inflate.prototype as unknown as {e: (typeof Inflate.prototype)['e']}).e.call(this, chunk);
    if (this.v) {
      if (this.p.length < 2 && !final) return;
      (this.p = this.p.subarray(2)), (this.v = 0);
    }
    if (final) {
      if (this.p.length < 4) err(6, 'invalid zlib data');
      this.p = this.p.subarray(0, -4);
    }
    // necessary to prevent TS from using the closure value
    // This allows for workerization to function correctly
    (Inflate.prototype as unknown as {c: (typeof Inflate.prototype)['c']}).c.call(this, final);
  }
}

/**
 * Expands Zlib data
 * @param data The data to decompress
 * @param out Where to write the data. Saves memory if you know the decompressed size and provide an output buffer of that length.
 * @returns The decompressed version of the data
 */
export function unzlibSync(data: Uint8Array, out?: Uint8Array) {
  return inflt((zlv(data), data.subarray(2, -4)), out);
}
