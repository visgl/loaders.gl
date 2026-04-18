// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {_StatsWidget as DeckStatsWidget, type StatsWidgetProps} from '@deck.gl/widgets';
import '@deck.gl/widgets/stylesheet.css';

/**
 * Creates a stable deck.gl 9.3 stats widget for website examples.
 */
export function createDeckStatsWidget(
  id: string,
  props: Partial<StatsWidgetProps> = {}
) {
  return new DeckStatsWidget({
    id,
    type: 'deck',
    placement: 'top-left',
    framesPerUpdate: 10,
    ...props
  });
}
