import {useCallback, useState} from 'react';
import {ExpandState} from '../types';

export function useExpand(initialState: ExpandState): [ExpandState, () => void] {
  const [expandState, setExpandState] = useState<ExpandState>(initialState);
  const expand = useCallback(
    () =>
      setExpandState((prev) => {
        if (prev === ExpandState.expanded) {
          return ExpandState.collapsed;
        }
        return ExpandState.expanded;
      }),
    [expandState]
  );

  return [expandState, expand];
}
