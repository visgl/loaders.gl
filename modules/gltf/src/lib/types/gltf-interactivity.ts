// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTF} from './gltf-json-schema';

/** Metadata shared by KHR_interactivity schema objects. */
export type GLTFInteractivityProperty = {
  /** Extension-specific data. */
  extensions?: Record<string, unknown>;
  /** Application-specific data. */
  extras?: unknown;
};

/** An input value socket: a connected output or a typed inline/default value. */
export type GLTFInteractivityValue = GLTFInteractivityProperty &
  (
    | {
        /** Source node index in this graph. */
        node: number;
        /** Source output socket identifier. */
        socket?: string;
        /** Optional type index for the connected socket. */
        type?: number;
        /** Connected sockets cannot also have inline values. */
        value?: never;
      }
    | {
        /** Inline sockets do not reference nodes. */
        node?: never;
        /** Inline sockets do not reference output sockets. */
        socket?: never;
        /** Type index in this graph. */
        type: number;
        /** Components of the inline value; omission uses the type's default. */
        value?: unknown[];
      }
  );

/** An output flow connection to another node. */
export type GLTFInteractivitySocket = GLTFInteractivityProperty & {
  /** Destination node index in this graph. */
  node: number;
  /** Destination input flow socket; defaults to `in`. */
  socket?: string;
};

/** Static configuration for an operation. */
export type GLTFInteractivityConfiguration = GLTFInteractivityProperty & {
  /** Configuration components, interpreted by the operation. */
  value: unknown[];
};

/** An operation instance in a behavior graph. */
export type GLTFInteractivityNode = GLTFInteractivityProperty & {
  /** Index of the operation declaration in this graph. */
  declaration: number;
  /** Input value sockets keyed by identifier. */
  values?: Record<string, GLTFInteractivityValue>;
  /** Output flow connections keyed by identifier. */
  flows?: Record<string, GLTFInteractivitySocket>;
  /** Static configuration keyed by identifier. */
  configuration?: Record<string, GLTFInteractivityConfiguration>;
};

/** A value socket declared by an extension-defined operation. */
export type GLTFInteractivityDeclarationSocket = GLTFInteractivityProperty & {
  /** Type index in this graph. */
  type: number;
};

/** An operation declaration; custom socket declarations require an extension. */
export type GLTFInteractivityDeclaration = GLTFInteractivityProperty & {
  /** Operation identifier. */
  op: string;
} & (
    | {
        /** Extension defining the operation. */
        extension: string;
        /** Extension-defined input value sockets. */
        inputValueSockets?: Record<string, GLTFInteractivityDeclarationSocket>;
        /** Extension-defined output value sockets. */
        outputValueSockets?: Record<string, GLTFInteractivityDeclarationSocket>;
      }
    | {
        /** Built-in operations do not declare an extension. */
        extension?: never;
        /** Built-in input sockets are defined by the specification. */
        inputValueSockets?: never;
        /** Built-in output sockets are defined by the specification. */
        outputValueSockets?: never;
      }
  );

/** A graph-local value type. */
export type GLTFInteractivityType = GLTFInteractivityProperty & {
  /** Standard type signature; extension-defined types use `custom`. */
  signature:
    | 'bool'
    | 'float'
    | 'float2'
    | 'float3'
    | 'float4'
    | 'float2x2'
    | 'float3x3'
    | 'float4x4'
    | 'int'
    | 'ref'
    | 'custom';
};

/** A typed event value socket with an optional initial value. */
export type GLTFInteractivityEventValue = GLTFInteractivityProperty & {
  /** Type index in this graph. */
  type: number;
  /** Initial components; omission uses the type's default. */
  value?: unknown[];
};

/** A graph-local variable. */
export type GLTFInteractivityVariable = GLTFInteractivityEventValue & {
  /** Optional user-defined name. */
  name?: string;
};

/** A custom event; events without an id are internal to the graph. */
export type GLTFInteractivityEvent = GLTFInteractivityProperty & {
  /** Optional external event identifier. */
  id?: string;
  /** Optional user-defined name. */
  name?: string;
  /** Event payload sockets keyed by identifier. */
  values?: Record<string, GLTFInteractivityEventValue>;
};

/** A behavior graph with graph-local indices. */
export type GLTFInteractivityGraph = GLTFInteractivityProperty & {
  /** Operation declarations referenced by nodes. */
  declarations?: GLTFInteractivityDeclaration[];
  /** Operation instances; requires declarations when present. */
  nodes?: GLTFInteractivityNode[];
  /** Value types referenced by sockets and variables. */
  types?: GLTFInteractivityType[];
  /** Graph variables; requires types when present. */
  variables?: GLTFInteractivityVariable[];
  /** Custom event definitions. */
  events?: GLTFInteractivityEvent[];
  /** Optional user-defined name. */
  name?: string;
};

/** KHR_interactivity root extension; graph execution belongs to the rendering runtime. */
export type GLTF_KHR_interactivity = GLTFInteractivityProperty & {
  /** Default behavior graph index; defaults to zero. */
  graph?: number;
  /** Available behavior graphs. */
  graphs: GLTFInteractivityGraph[];
};

/**
 * Read the raw extension from glTF JSON or a GLTFLoader result.
 * Returns the original object without validation, cloning, or default expansion.
 */
export function getGLTFInteractivity(gltf: GLTF | {json: GLTF}): GLTF_KHR_interactivity | null {
  // GLTF permits arbitrary properties, so an `in` check cannot narrow this union.
  const json = ('asset' in gltf ? gltf : gltf.json) as GLTF;
  return (json.extensions?.KHR_interactivity as GLTF_KHR_interactivity | undefined) ?? null;
}
