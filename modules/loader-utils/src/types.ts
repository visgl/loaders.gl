// Typed arrays

export type TypedIntArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Int32Array
  | Uint32Array;

export type TypedFloatArray = Uint16Array | Float32Array | Float64Array;

export type TypedArray = TypedIntArray | TypedFloatArray;

export type NumericArray = Array<number> | TypedIntArray | TypedFloatArray;

type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

interface ClientRequestArgs {
  abort?: AbortSignal;
  protocol?: string | null;
  host?: string | null;
  hostname?: string | null;
  family?: number;
  port?: number | string | null;
  defaultPort?: number | string;
  localAddress?: string;
  socketPath?: string;
  /**
   * @default 8192
   */
  maxHeaderSize?: number;
  method?: string;
  path?: string | null;
  headers?: {[key: string]: any};
  auth?: string | null;
  agent?: Object | boolean;
  _defaultAgent?: Object;
  timeout?: number;
  setHost?: boolean;
  // https://github.com/nodejs/node/blob/master/lib/_http_client.js#L278
  createConnection?: (
    options: ClientRequestArgs,
    oncreate: (err: Error, socket: Object) => void
  ) => Object;
}
interface RequestOptions extends ClientRequestArgs {}
type SecureVersion = 'TLSv1.3' | 'TLSv1.2' | 'TLSv1.1' | 'TLSv1';
interface KeyObject {
  /**
   * Private keys in PEM format.
   */
  pem: string | Buffer;
  /**
   * Optional passphrase.
   */
  passphrase?: string;
}
interface SecureContextOptions {
  /**
   * Optionally override the trusted CA certificates. Default is to trust
   * the well-known CAs curated by Mozilla. Mozilla's CAs are completely
   * replaced when CAs are explicitly specified using this option.
   */
  ca?: string | Buffer | Array<string | Buffer>;
  /**
   *  Cert chains in PEM format. One cert chain should be provided per
   *  private key. Each cert chain should consist of the PEM formatted
   *  certificate for a provided private key, followed by the PEM
   *  formatted intermediate certificates (if any), in order, and not
   *  including the root CA (the root CA must be pre-known to the peer,
   *  see ca). When providing multiple cert chains, they do not have to
   *  be in the same order as their private keys in key. If the
   *  intermediate certificates are not provided, the peer will not be
   *  able to validate the certificate, and the handshake will fail.
   */
  cert?: string | Buffer | Array<string | Buffer>;
  /**
   *  Colon-separated list of supported signature algorithms. The list
   *  can contain digest algorithms (SHA256, MD5 etc.), public key
   *  algorithms (RSA-PSS, ECDSA etc.), combination of both (e.g
   *  'RSA+SHA384') or TLS v1.3 scheme names (e.g. rsa_pss_pss_sha512).
   */
  sigalgs?: string;
  /**
   * Cipher suite specification, replacing the default. For more
   * information, see modifying the default cipher suite. Permitted
   * ciphers can be obtained via tls.getCiphers(). Cipher names must be
   * uppercased in order for OpenSSL to accept them.
   */
  ciphers?: string;
  /**
   * Name of an OpenSSL engine which can provide the client certificate.
   */
  clientCertEngine?: string;
  /**
   * PEM formatted CRLs (Certificate Revocation Lists).
   */
  crl?: string | Buffer | Array<string | Buffer>;
  /**
   * Diffie Hellman parameters, required for Perfect Forward Secrecy. Use
   * openssl dhparam to create the parameters. The key length must be
   * greater than or equal to 1024 bits or else an error will be thrown.
   * Although 1024 bits is permissible, use 2048 bits or larger for
   * stronger security. If omitted or invalid, the parameters are
   * silently discarded and DHE ciphers will not be available.
   */
  dhparam?: string | Buffer;
  /**
   * A string describing a named curve or a colon separated list of curve
   * NIDs or names, for example P-521:P-384:P-256, to use for ECDH key
   * agreement. Set to auto to select the curve automatically. Use
   * crypto.getCurves() to obtain a list of available curve names. On
   * recent releases, openssl ecparam -list_curves will also display the
   * name and description of each available elliptic curve. Default:
   * tls.DEFAULT_ECDH_CURVE.
   */
  ecdhCurve?: string;
  /**
   * Attempt to use the server's cipher suite preferences instead of the
   * client's. When true, causes SSL_OP_CIPHER_SERVER_PREFERENCE to be
   * set in secureOptions
   */
  honorCipherOrder?: boolean;
  /**
   * Private keys in PEM format. PEM allows the option of private keys
   * being encrypted. Encrypted keys will be decrypted with
   * options.passphrase. Multiple keys using different algorithms can be
   * provided either as an array of unencrypted key strings or buffers,
   * or an array of objects in the form {pem: <string|buffer>[,
   * passphrase: <string>]}. The object form can only occur in an array.
   * object.passphrase is optional. Encrypted keys will be decrypted with
   * object.passphrase if provided, or options.passphrase if it is not.
   */
  key?: string | Buffer | Array<Buffer | KeyObject>;
  /**
   * Name of an OpenSSL engine to get private key from. Should be used
   * together with privateKeyIdentifier.
   */
  privateKeyEngine?: string;
  /**
   * Identifier of a private key managed by an OpenSSL engine. Should be
   * used together with privateKeyEngine. Should not be set together with
   * key, because both options define a private key in different ways.
   */
  privateKeyIdentifier?: string;
  /**
   * Optionally set the maximum TLS version to allow. One
   * of `'TLSv1.3'`, `'TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. Cannot be specified along with the
   * `secureProtocol` option, use one or the other.
   * **Default:** `'TLSv1.3'`, unless changed using CLI options. Using
   * `--tls-max-v1.2` sets the default to `'TLSv1.2'`. Using `--tls-max-v1.3` sets the default to
   * `'TLSv1.3'`. If multiple of the options are provided, the highest maximum is used.
   */
  maxVersion?: SecureVersion;
  /**
   * Optionally set the minimum TLS version to allow. One
   * of `'TLSv1.3'`, `'TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. Cannot be specified along with the
   * `secureProtocol` option, use one or the other.  It is not recommended to use
   * less than TLSv1.2, but it may be required for interoperability.
   * **Default:** `'TLSv1.2'`, unless changed using CLI options. Using
   * `--tls-v1.0` sets the default to `'TLSv1'`. Using `--tls-v1.1` sets the default to
   * `'TLSv1.1'`. Using `--tls-min-v1.3` sets the default to
   * 'TLSv1.3'. If multiple of the options are provided, the lowest minimum is used.
   */
  minVersion?: SecureVersion;
  /**
   * Shared passphrase used for a single private key and/or a PFX.
   */
  passphrase?: string;
  /**
   * PFX or PKCS12 encoded private key and certificate chain. pfx is an
   * alternative to providing key and cert individually. PFX is usually
   * encrypted, if it is, passphrase will be used to decrypt it. Multiple
   * PFX can be provided either as an array of unencrypted PFX buffers,
   * or an array of objects in the form {buf: <string|buffer>[,
   * passphrase: <string>]}. The object form can only occur in an array.
   * object.passphrase is optional. Encrypted PFX will be decrypted with
   * object.passphrase if provided, or options.passphrase if it is not.
   */
  pfx?: string | Buffer | Array<string | Buffer | Object>;
  /**
   * Optionally affect the OpenSSL protocol behavior, which is not
   * usually necessary. This should be used carefully if at all! Value is
   * a numeric bitmask of the SSL_OP_* options from OpenSSL Options
   */
  secureOptions?: number; // Value is a numeric bitmask of the `SSL_OP_*` options
  /**
   * Legacy mechanism to select the TLS protocol version to use, it does
   * not support independent control of the minimum and maximum version,
   * and does not support limiting the protocol to TLSv1.3. Use
   * minVersion and maxVersion instead. The possible values are listed as
   * SSL_METHODS, use the function names as strings. For example, use
   * 'TLSv1_1_method' to force TLS version 1.1, or 'TLS_method' to allow
   * any TLS protocol version up to TLSv1.3. It is not recommended to use
   * TLS versions less than 1.2, but it may be required for
   * interoperability. Default: none, see minVersion.
   */
  secureProtocol?: string;
  /**
   * Opaque identifier used by servers to ensure session state is not
   * shared between applications. Unused by clients.
   */
  sessionIdContext?: string;
  /**
   * 48-bytes of cryptographically strong pseudo-random data.
   * See Session Resumption for more information.
   */
  ticketKeys?: Buffer;
  /**
   * The number of seconds after which a TLS session created by the
   * server will no longer be resumable. See Session Resumption for more
   * information. Default: 300.
   */
  sessionTimeout?: number;
}
type HttpsRequestOptions = RequestOptions &
  SecureContextOptions & {
    rejectUnauthorized?: boolean; // Defaults to true
    servername?: string; // SNI TLS Extension
  };

/**
 * Core Loader Options
 */
export type LoaderOptions = {
  /** fetch options or a custom fetch function */
  fetch?: typeof fetch | FetchLike | RequestInit | HttpsRequestOptions | null;
  /** Do not throw on errors */
  nothrow?: boolean;

  /** loader selection, search first for supplied mimeType */
  mimeType?: string;
  /** loader selection, provide fallback mimeType is server does not provide */
  fallbackMimeType?: string;
  /** loader selection, avoid searching registered loaders */
  ignoreRegisteredLoaders?: boolean;

  // general
  /** Experimental: Supply a logger to the parser */
  log?: any;

  // batched parsing

  /** Size of each batch. `auto` matches batches to size of incoming chunks */
  batchSize?: number | 'auto';
  /** Minimal amount of time between batches */
  batchDebounceMs?: number;
  /** Stop loading after a given number of rows (compare SQL limit clause) */
  limit?: 0;
  /** Experimental: Stop loading after reaching */
  _limitMB?: 0;
  /** Generate metadata batches */
  metadata?: boolean;
  /** Transforms to run on incoming batches */
  transforms?: TransformBatches[];

  // workers

  /** CDN load workers from */
  CDN?: string;
  /** Set to `false` to disable workers */
  worker?: boolean;
  /** Number of concurrent workers (per loader) on desktop browser */
  maxConcurrency?: number;
  /** Number of concurrent workers (per loader) on mobile browsers */
  maxMobileConcurrency?: number;
  /** Set to `false` to prevent reuse workers */
  reuseWorkers?: boolean;
  /** Whether to use workers under Node.js (experimental) */
  _nodeWorkers?: boolean;
  /** set to 'test' to run local worker */
  _workerType?: string;

  /** @deprecated `options.batchType` removed, Use `options.<loader>.type` instead */
  batchType?: 'row' | 'columnar' | 'arrow';
  /** @deprecated `options.throw removed`, Use `options.nothrow` instead */
  throws?: boolean;
  /** @deprecated `options.dataType` no longer used */
  dataType?: any;
  /** @deprecated `options.uri` no longer used */
  uri?: any;
  /** @deprecated `options.method` removed. Use `options.fetch.method` */
  method?: any;
  /** @deprecated `options.headers` removed. Use `options.fetch.headers` */
  headers?: any;
  /** @deprecated `options.body` removed. Use `options.fetch.body` */
  body?: any;
  /** @deprecated `options.mode` removed. Use `options.fetch.mode` */
  mode?: any;
  /** @deprecated `options.credentials` removed. Use `options.fetch.credentials` */
  credentials?: any;
  /** @deprecated `options.cache` removed. Use `options.fetch.cache` */
  cache?: any;
  /** @deprecated `options.redirect` removed. Use `options.fetch.redirect` */
  redirect?: any;
  /** @deprecated `options.referrer` removed. Use `options.fetch.referrer` */
  referrer?: any;
  /** @deprecated `options.referrerPolicy` removed. Use `options.fetch.referrerPolicy` */
  referrerPolicy?: any;
  /** @deprecated `options.integrity` removed. Use `options.fetch.integrity` */
  integrity?: any;
  /** @deprecated `options.keepalive` removed. Use `options.fetch.keepalive` */
  keepalive?: any;
  /** @deprecated `options.signal` removed. Use `options.fetch.signal` */
  signal?: any;

  // Accept other keys (loader options objects, e.g. `options.csv`, `options.json` ...)
  [loaderId: string]: any;
};

type PreloadOptions = {
  [key: string]: any;
};

/**
 * A worker loader definition that can be used with `@loaders.gl/core` functions
 */
export type Loader = {
  // Worker
  name: string;
  id: string;
  module: string;
  version: string;
  worker?: string | boolean;
  options: object;
  deprecatedOptions?: object;
  // end Worker

  category?: string;
  extensions: string[];
  mimeTypes: string[];

  binary?: boolean;
  text?: boolean;

  tests?: (((ArrayBuffer) => boolean) | ArrayBuffer | string)[];

  // TODO - deprecated
  supported?: boolean;
  testText?: (string) => boolean;
};

/**
 * A "bundled" loader definition that can be used with `@loaders.gl/core` functions
 * If a worker loader is supported it will also be supported.
 */
export type LoaderWithParser = Loader & {
  // TODO - deprecated
  testText?: (string) => boolean;

  parse: Parse;
  preload?: Preload;
  parseSync?: ParseSync;
  parseText?: ParseText;
  parseTextSync?: ParseTextSync;
  parseInBatches?: ParseInBatches;
  parseFileInBatches?: ParseFileInBatches;
};

/** Options for writers */
export type WriterOptions = {
  /** worker source. If is set will be used instead of loading worker from the Internet */
  souce?: string | null;
  /** writer-specific options */
  [writerId: string]: any;
};

/**
 * A writer definition that can be used with `@loaders.gl/core` functions
 */
export type Writer = {
  name: string;

  id: string;
  module: string;
  version: string;
  worker?: string | boolean;

  options: WriterOptions;
  deprecatedOptions?: object;

  // TODO - are these are needed?
  binary?: boolean;
  extensions?: string[];
  mimeTypes?: string[];
  text?: boolean;

  encode?: Encode;
  encodeSync?: EncodeSync;
  encodeInBatches?: EncodeInBatches;
  encodeURLtoURL?: EncodeURLtoURL;
  encodeText?: EncodeText;
};

export type LoaderContext = {
  loaders?: Loader[] | null;
  url?: string;

  fetch: typeof fetch;
  parse: (
    arrayBuffer: ArrayBuffer,
    loaders?,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => Promise<any>;
  parseSync?: (
    arrayBuffer: ArrayBuffer,
    loaders?,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => any;
  parseInBatches?: (
    iterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
    loaders?,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => AsyncIterable<any> | Promise<AsyncIterable<any>>;
};

type Parse = (
  arrayBuffer: ArrayBuffer,
  options?: LoaderOptions,
  context?: LoaderContext
) => Promise<any>;
type ParseSync = (
  arrayBuffer: ArrayBuffer,
  options?: LoaderOptions,
  context?: LoaderContext
) => any;
type ParseText = (text: string, options?: LoaderOptions) => Promise<any>;
type ParseTextSync = (text: string, options?: LoaderOptions) => any;
type ParseInBatches = (
  iterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: LoaderOptions,
  context?: LoaderContext
) => AsyncIterable<any>;
type ParseFileInBatches = (
  file: Blob,
  options?: LoaderOptions,
  context?: LoaderContext
) => AsyncIterable<any>;

type Encode = (data: any, options?: WriterOptions) => Promise<ArrayBuffer>;
type EncodeSync = (data: any, options?: WriterOptions) => ArrayBuffer;
// TODO
type EncodeText = Function;
type EncodeInBatches = Function;
type EncodeURLtoURL = (
  inputUrl: string,
  outputUrl: string,
  options?: WriterOptions
) => Promise<string>;
type Preload = (url: string, options?: PreloadOptions) => any;

export type TransformBatches = (
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
) => AsyncIterable<ArrayBuffer>;

/** Types that can be synchronously parsed */
export type SyncDataType = string | ArrayBuffer; // TODO File | Blob can be read synchronously...

/** Types that can be parsed async */
export type DataType =
  | string
  | ArrayBuffer
  | File
  | Blob
  | Response
  | ReadableStream
  | Iterable<ArrayBuffer>
  | AsyncIterable<ArrayBuffer>;

/** Types that can be parsed in batches */
export type BatchableDataType =
  | DataType
  | Iterable<ArrayBuffer>
  | AsyncIterable<ArrayBuffer>
  | Promise<AsyncIterable<ArrayBuffer>>;

/**
 * A FileSystem interface can encapsulate a FileList, a ZipFile, a GoogleDrive etc.
 */
export interface IFileSystem {
  /**
   * Return a list of file names
   * @param dirname directory name. file system root directory if omitted
   */
  readdir(dirname?: string, options?: {recursive?: boolean}): Promise<string[]>;

  /**
   * Gets information from a local file from the filesystem
   * @param filename file name to stat
   * @param options currently unused
   * @throws if filename is not in local filesystem
   */
  stat(filename: string, options?: object): Promise<{size: number}>;

  /**
   * Fetches a local file from the filesystem (or a URL)
   * @param filename
   * @param options
   */
  fetch(filename: string, options?: object): Promise<Response>;
}

type ReadOptions = {buffer?: ArrayBuffer; offset?: number; length?: number; position?: number};
export interface IRandomAccessReadFileSystem extends IFileSystem {
  open(path: string, flags, mode?): Promise<any>;
  close(fd: any): Promise<void>;
  fstat(fd: any): Promise<object>;
  read(fd: any, options?: ReadOptions): Promise<{bytesRead: number; buffer: Buffer}>;
}
