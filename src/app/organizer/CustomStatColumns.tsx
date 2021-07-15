import { CustomStatWeightsDisplay } from 'app/dim-ui/CustomStatWeights';
import { DimItem } from 'app/inventory/item-types';
import { CUSTOM_STAT_BASE_HASH } from 'app/search/d2-known-values';
import { CustomStatDef } from 'app/settings/initial-settings';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React from 'react';
import { ColumnDefinition, SortDirection } from './table-types';

export function createCustomStatColumns(
  customStatDefs: CustomStatDef[],
  classType: DestinyClass
): (ColumnDefinition | undefined)[] {
  return customStatDefs.map((c, i) => {
    if (c.class === classType || c.class === DestinyClass.Unknown) {
      return {
        id: c.shortLabel + i,
        header: (
          <>
            {c.label}
            <CustomStatWeightsDisplay customStat={c} />
          </>
        ),
        value: (item: DimItem) =>
          item.stats?.find((s) => s.statHash === CUSTOM_STAT_BASE_HASH - i)?.value,
        defaultSort: SortDirection.DESC,
        filter: (value) => `stat:${c.label}:>=${value}`,
        columnGroup: {
          id: c.shortLabel + i,
          header: c.label,
        },
      };
    }
  });
}
