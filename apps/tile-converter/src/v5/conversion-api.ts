/** A diagnostic produced while inspecting, converting, or validating tiles. */
export interface TileConversionDiagnostic {
  /** Stable machine-readable diagnostic code. */
  readonly code: string;
  /** Human-readable explanation of the diagnostic. */
  readonly message: string;
  /** Severity used by callers to decide whether the result is acceptable. */
  readonly severity: 'info' | 'warning' | 'error';
  /** Optional resource that produced the diagnostic. */
  readonly resourceId?: string;
}

/** Typed failure raised when a conversion policy or validation gate rejects a resource. */
export class TileConversionError extends Error {
  /** Stable machine-readable failure code. */
  readonly code: string;
  /** Diagnostics associated with this failure. */
  readonly diagnostics: readonly TileConversionDiagnostic[];

  /** Creates a typed conversion failure. */
  constructor(
    code: string,
    message: string,
    diagnostics: readonly TileConversionDiagnostic[] = []
  ) {
    super(message);
    this.name = 'TileConversionError';
    this.code = code;
    this.diagnostics = diagnostics;
  }
}

/** Progress reported by the portable conversion core. */
export interface TileConversionProgress {
  /** Current conversion phase. */
  readonly phase: 'inspect' | 'convert' | 'validate' | 'finalize';
  /** Number of input resources consumed so far. */
  readonly inputResources: number;
  /** Number of output resources written so far. */
  readonly outputResources: number;
  /** Number of input bytes consumed so far. */
  readonly inputBytes: number;
  /** Number of output bytes written so far. */
  readonly outputBytes: number;
}

/** Summary returned after a tileset conversion completes. */
export interface TileConversionReport {
  /** Completed conversion state. Failed conversions reject with their cause. */
  readonly state: 'completed';
  /** Number of input resources consumed. */
  readonly inputResources: number;
  /** Number of output resources written. */
  readonly outputResources: number;
  /** Number of input bytes consumed. */
  readonly inputBytes: number;
  /** Number of output bytes written. */
  readonly outputBytes: number;
  /** Largest output resource written. */
  readonly largestOutputResourceBytes: number;
  /** Diagnostics reported during conversion and validation. */
  readonly diagnostics: readonly TileConversionDiagnostic[];
}

/** Portable source adapter that resolves and reads a tileset. */
export interface TileConversionSource<TInspection, TInput> {
  /** Inspect the source and return its profile-specific metadata. */
  inspect(signal?: AbortSignal): Promise<TInspection>;
  /** Stream input resources in deterministic traversal order. */
  read(inspection: TInspection, signal?: AbortSignal): AsyncIterable<TInput>;
}

/** Output adapter whose awaited writes apply backpressure to conversion. */
export interface TileConversionSink<TOutput> {
  /** Write one completed output resource and resolve when it can be released. */
  write(resource: TOutput, signal?: AbortSignal): Promise<void>;
  /** Finalize the destination after every resource has been written. */
  finalize(report: TileConversionReport): Promise<void>;
  /** Abort and clean up a partial destination after a failure. */
  abort(reason: unknown): Promise<void>;
}

/** Codec adapter used to convert one input resource into streamed outputs. */
export interface TileConversionCodec<TInspection, TInput, TOutput> {
  /** Convert one input resource into zero or more output resources. */
  convert(
    resource: TInput,
    inspection: TInspection,
    signal?: AbortSignal
  ): AsyncIterable<TOutput> | Promise<AsyncIterable<TOutput>>;
  /** Optionally validate each output resource before it is written. */
  validateOutput?(
    resource: TOutput,
    signal?: AbortSignal
  ): Promise<readonly TileConversionDiagnostic[]>;
}

/** Options for the portable `convertTileset` operation. */
export interface ConvertTilesetOptions<TInspection, TInput, TOutput> {
  /** Injected input resolver and resource reader. */
  readonly source: TileConversionSource<TInspection, TInput>;
  /** Injected output codec. */
  readonly codec: TileConversionCodec<TInspection, TInput, TOutput>;
  /** Injected destination writer. */
  readonly sink: TileConversionSink<TOutput>;
  /** Return the byte size of an input resource. */
  readonly measureInputBytes: (resource: TInput) => number;
  /** Return the byte size of an output resource. */
  readonly measureOutputBytes: (resource: TOutput) => number;
  /** Reject any output resource larger than this configured byte limit. */
  readonly maxOutputResourceBytes?: number;
  /** Cancel inspection, conversion, validation, or writes. */
  readonly signal?: AbortSignal;
  /** Receive progress updates after each resource transition. */
  readonly onProgress?: (progress: TileConversionProgress) => void;
}

/** Options for a standalone tileset validation pass. */
export interface ValidateTilesetOptions<TTileset> {
  /** Tileset or conversion result to validate. */
  readonly tileset: TTileset;
  /** Injected profile-specific validator. */
  readonly validate: (
    tileset: TTileset,
    signal?: AbortSignal
  ) => Promise<readonly TileConversionDiagnostic[]>;
  /** Cancel validation. */
  readonly signal?: AbortSignal;
}

/** Result of validating a tileset. */
export interface TileValidationReport {
  /** False when at least one error diagnostic was reported. */
  readonly valid: boolean;
  /** Diagnostics returned by the injected validator. */
  readonly diagnostics: readonly TileConversionDiagnostic[];
}

/** Inspects a tileset with an injected, platform-specific source adapter. */
export async function inspectTileset<TInspection, TInput>(
  source: TileConversionSource<TInspection, TInput>,
  signal?: AbortSignal
): Promise<TInspection> {
  throwIfAborted(signal);
  const inspection = await source.inspect(signal);
  throwIfAborted(signal);
  return inspection;
}

/**
 * Converts a stream of tileset resources through injected source, codec, and sink adapters.
 * Writes are awaited one resource at a time, keeping queued output bytes bounded by the
 * largest emitted resource and the configured `maxOutputResourceBytes` limit.
 */
export async function convertTileset<TInspection, TInput, TOutput>(
  options: ConvertTilesetOptions<TInspection, TInput, TOutput>
): Promise<TileConversionReport> {
  const {
    source,
    codec,
    sink,
    measureInputBytes,
    measureOutputBytes,
    maxOutputResourceBytes = Number.POSITIVE_INFINITY,
    signal,
    onProgress
  } = options;
  let inputResources = 0;
  let outputResources = 0;
  let inputBytes = 0;
  let outputBytes = 0;
  let largestOutputResourceBytes = 0;
  const diagnostics: TileConversionDiagnostic[] = [];
  const reportProgress = (phase: TileConversionProgress['phase']): void => {
    onProgress?.({phase, inputResources, outputResources, inputBytes, outputBytes});
  };

  try {
    reportProgress('inspect');
    const inspection = await inspectTileset(source, signal);
    for await (const inputResource of source.read(inspection, signal)) {
      throwIfAborted(signal);
      inputResources++;
      inputBytes += measureInputBytes(inputResource);
      reportProgress('convert');
      const convertedResources = await codec.convert(inputResource, inspection, signal);
      for await (const outputResource of convertedResources) {
        throwIfAborted(signal);
        reportProgress('validate');
        const resourceDiagnostics = (await codec.validateOutput?.(outputResource, signal)) || [];
        diagnostics.push(...resourceDiagnostics);
        const outputResourceBytes = measureOutputBytes(outputResource);
        largestOutputResourceBytes = Math.max(largestOutputResourceBytes, outputResourceBytes);
        if (outputResourceBytes > maxOutputResourceBytes) {
          throw new TileConversionError(
            'OUTPUT_RESOURCE_TOO_LARGE',
            `Output resource is ${outputResourceBytes} bytes, exceeding the configured limit of ${maxOutputResourceBytes} bytes`
          );
        }
        if (resourceDiagnostics.some(diagnostic => diagnostic.severity === 'error')) {
          throw new TileConversionError(
            'OUTPUT_VALIDATION_FAILED',
            'Output resource validation failed',
            resourceDiagnostics
          );
        }
        throwIfAborted(signal);
        await sink.write(outputResource, signal);
        throwIfAborted(signal);
        outputResources++;
        outputBytes += outputResourceBytes;
        reportProgress('convert');
      }
    }

    const report: TileConversionReport = {
      state: 'completed',
      inputResources,
      outputResources,
      inputBytes,
      outputBytes,
      largestOutputResourceBytes,
      diagnostics
    };
    throwIfAborted(signal);
    reportProgress('finalize');
    await sink.finalize(report);
    return report;
  } catch (error) {
    try {
      await sink.abort(error);
    } catch (abortError) {
      throw new AggregateError(
        [error, abortError],
        'Conversion failed and the destination could not abort'
      );
    }
    throw error;
  }
}

/** Validates a tileset through an injected profile-specific validator. */
export async function validateTileset<TTileset>(
  options: ValidateTilesetOptions<TTileset>
): Promise<TileValidationReport> {
  throwIfAborted(options.signal);
  const diagnostics = await options.validate(options.tileset, options.signal);
  throwIfAborted(options.signal);
  return {
    valid: !diagnostics.some(diagnostic => diagnostic.severity === 'error'),
    diagnostics
  };
}

/** Throws the signal reason when a conversion operation has been cancelled. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
  }
}
