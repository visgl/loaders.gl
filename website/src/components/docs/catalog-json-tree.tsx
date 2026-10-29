import React, {useState} from 'react';
import styled from 'styled-components';

/** Displays JSON with lazy, keyboard-accessible expansion of objects, arrays, and long values. */
export function CatalogJsonTree({
  label,
  value
}: {
  /** Property name or heading for this node. */
  label: string;
  /** JSON-compatible value to inspect. */
  value: unknown;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  const entries = value !== null && typeof value === 'object' ? Object.entries(value) : undefined;
  const text = entries ? '' : typeof value === 'string' ? value : String(value);
  const summary = entries
    ? `${Array.isArray(value) ? 'Array' : 'Object'} (${entries.length})`
    : text.length > 100
      ? `${text.slice(0, 100)}… (${text.length.toLocaleString()} characters)`
      : text;
  if (!entries && text.length <= 100) {
    return (
      <Leaf>
        <strong>{label}</strong>: <span>{text}</span>
      </Leaf>
    );
  }
  return (
    <Branch onToggle={event => setExpanded(event.currentTarget.open)}>
      <summary>
        <strong>{label}</strong>: <span>{summary}</span>
      </summary>
      {expanded ? (
        entries ? (
          <Children>
            {entries.slice(0, visibleCount).map(([name, entry]) => (
              <CatalogJsonTree key={name} label={name} value={entry} />
            ))}
            {entries.length > visibleCount ? (
              <button type="button" onClick={() => setVisibleCount(visibleCount + 100)}>
                Show next {Math.min(100, entries.length - visibleCount)} entries
              </button>
            ) : null}
          </Children>
        ) : (
          <LongValue>{text}</LongValue>
        )
      ) : null}
    </Branch>
  );
}

/** Wraps scalar values without widening the inspector. */
const Leaf = styled.div`padding:3px 0;font-size:.78rem;overflow-wrap:anywhere;`;
/** Keeps each disclosure compact until the user expands it. */
const Branch = styled.details`font-size:.78rem;summary{cursor:pointer;padding:4px 0;overflow-wrap:anywhere;}summary span{opacity:.75;}`;
/** Indents nested values without rendering collapsed subtrees. */
const Children = styled.div`margin-left:12px;padding-left:10px;border-left:1px solid var(--ifm-color-emphasis-300);`;
/** Reveals a complete long value only on request. */
const LongValue = styled.pre`white-space:pre-wrap;overflow-wrap:anywhere;font-size:.75rem;max-height:240px;overflow:auto;`;
