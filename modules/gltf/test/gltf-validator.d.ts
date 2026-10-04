/** Test-only API declarations for the official Khronos validator's JavaScript distribution. */
declare module 'gltf-validator' {
  /** Validate a complete JSON document without accessing external services. */
  export function validateString(
    json: string,
    options?: ValidationOptions
  ): Promise<ValidationReport>;
  /** Validate serialized glTF JSON or GLB bytes. */
  export function validateBytes(
    bytes: Uint8Array,
    options?: ValidationOptions
  ): Promise<ValidationReport>;
  /** Minimal options used by hermetic conformance fixtures. */
  export type ValidationOptions = {
    /** Omit nondeterministic wall-clock metadata. */
    writeTimestamp?: boolean;
    /** Explicit resource resolver; tests reject non-embedded dependencies. */
    externalResourceFunction?: (uri: string) => Promise<Uint8Array>;
  };
  /** Error summary returned by independent validation. */
  export type ValidationReport = {
    /** Counted issues and diagnostic messages. */
    issues: {
      /** Number of glTF conformance errors. */
      numErrors: number;
      /** Individual issues, including informational and warning messages. */
      messages: Array<{
        /** Severity zero denotes an error. */
        severity: number;
        /** Stable validator diagnostic code. */
        code: string;
        /** Human-readable validation diagnostic. */
        message: string;
      }>;
    };
  };
}
