import React from 'react';

/**
 * Adds optional line-break opportunities at camel-case word boundaries without splitting words.
 * @param {{children: string}} props Component properties.
 * @returns {React.ReactElement} Text with semantic break opportunities.
 */
export function NaturalBreaks({children}) {
  const parts = children.split(/(?=[A-Z][a-z])/);

  return (
    <span>
      {parts.map((part, index) => (
        <React.Fragment key={`${part}-${index}`}>
          {index > 0 && <wbr />}
          {part}
        </React.Fragment>
      ))}
    </span>
  );
}
