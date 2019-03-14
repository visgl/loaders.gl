# Working with BigInts

If the platform supports `BigInt64Array`


Additional methods are injected

### toJSON(this: BN<BigNumArray>) { return `"${bignumToString(this)}"`; },
### toString(this: BN<BigNumArray>) { return bignumToString(this); },
### valueOf(this: BN<BigNumArray>) { return bignumToNumber(this); },
### [Symbol.toPrimitive]<T extends BN<BigNumArray>>(this: T, hint: 'string' | 'number' | 'default') {

