// loaders.gl
// SPDX-License-Identifier: MIT

/** Typed connection to one node output. */
export interface ProceduralConnection {
  /** Stable identifier of the upstream node. */
  node: string;
  /** Name of its output port. */
  output: string;
}

/** Input supplied by a constant or another node. */
export interface ProceduralInput {
  /** Declared value type. */
  type: string;
  /** Constant value, retained without implicit conversion. */
  value?: unknown;
  /** Optional upstream connection. */
  connection?: ProceduralConnection;
}

/** Renderer-independent operation with explicitly declared ports. */
export interface ProceduralNode {
  /** Stable node identifier, unique within the graph. */
  id: string;
  /** Operation identifier for a downstream implementation registry. */
  operation: string;
  /** Named inputs. */
  inputs: Record<string, ProceduralInput>;
  /** Named output value types. */
  outputs: Record<string, string>;
}

/** Graph contract independent of GPU resources or shader languages. */
export interface ProceduralGraph {
  /** Nodes in authored order. */
  nodes: ProceduralNode[];
  /** Named graph outputs and their upstream connections. */
  outputs: Record<string, ProceduralConnection>;
}

/**
 * Validates explicit references and exact port types, returning dependency-first nodes.
 * Does not infer conversions, resolve MaterialX definitions, or evaluate operations.
 */
export function orderProceduralGraph(graph: ProceduralGraph): ProceduralNode[] {
  const nodes = new Map<string, ProceduralNode>();
  for (const node of graph.nodes) {
    if (!node.id || nodes.has(node.id)) throw new Error('Procedural graph: duplicate or empty node ID.');
    nodes.set(node.id, node);
  }
  const dependencies = new Map<string, Set<string>>();
  const dependents = new Map<string, string[]>();
  for (const node of graph.nodes) {
    const upstream = new Set<string>();
    for (const input of Object.values(node.inputs)) {
      if (!input.connection) continue;
      if (Object.hasOwn(input, 'value')) throw new Error('Procedural graph: connected input also has a value.');
      const source = resolveOutput(input.connection);
      if (source.outputs[input.connection.output] !== input.type) {
        throw new Error('Procedural graph: incompatible connection types.');
      }
      upstream.add(source.id);
    }
    dependencies.set(node.id, upstream);
    for (const identifier of upstream) {
      const downstream = dependents.get(identifier) || [];
      downstream.push(node.id);
      dependents.set(identifier, downstream);
    }
  }
  for (const output of Object.values(graph.outputs)) resolveOutput(output);
  const ordered = graph.nodes.filter(node => dependencies.get(node.id)!.size === 0);
  for (let index = 0; index < ordered.length; index++) {
    for (const identifier of dependents.get(ordered[index].id) || []) {
      const upstream = dependencies.get(identifier)!;
      upstream.delete(ordered[index].id);
      if (!upstream.size) ordered.push(nodes.get(identifier)!);
    }
  }
  if (ordered.length !== graph.nodes.length) throw new Error('Procedural graph: cycle detected.');
  return ordered;

  /** Resolves an explicitly named output without accepting inherited properties. */
  function resolveOutput(connection: ProceduralConnection): ProceduralNode {
    const node = nodes.get(connection.node);
    if (!node || !Object.hasOwn(node.outputs, connection.output)) {
      throw new Error('Procedural graph: missing node or output.');
    }
    return node;
  }
}
