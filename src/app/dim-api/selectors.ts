import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { currentAccountSelector, destinyVersionSelector } from 'app/accounts/selectors';
import { t } from 'app/i18next-t';
import { CustomStatDef, CustomStatWeights } from 'app/settings/initial-settings';
import { RootState } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { createSelector } from 'reselect';

export function makeProfileKeyFromAccount(account: DestinyAccount) {
  return makeProfileKey(account.membershipId, account.destinyVersion);
}
export function makeProfileKey(platformMembershipId: string, destinyVersion: DestinyVersion) {
  return `${platformMembershipId}-d${destinyVersion}`;
}

export const settingsSelector = (state: RootState) => state.dimApi.settings;
export const oldCustomTotalSelector = (state: RootState) =>
  state.dimApi.settings.customTotalStatsByClass;

export const customStatsSelector = (state: RootState) => state.dimApi.settings.customStats;

export const oldAndNewCustomStatsSelector = (state: RootState): CustomStatDef[] => {
  const oldCustomStats = oldCustomTotalSelector(state);
  const convertedOldStats: CustomStatDef[] = [];

  for (const classEnumString in oldCustomStats) {
    const classEnum = parseInt(classEnumString) as DestinyClass;
    const statHashList = oldCustomStats[classEnum];

    if (classEnum !== DestinyClass.Unknown && statHashList?.length > 0) {
      const weights: CustomStatWeights = {};
      for (const statHash of statHashList) {
        weights[statHash] = 1;
      }
      convertedOldStats.push({
        label: t('Stats.Custom'),
        shortLabel: 'custom',
        class: classEnum,
        weights,
        id: '__custom__' + classEnumString,
      });
    }
  }
  return [...convertedOldStats, ...customStatsSelector(state)];
};
export const apiPermissionGrantedSelector = (state: RootState) =>
  state.dimApi.apiPermissionGranted === true;

/**
 * Return saved API data for the currently active profile (account).
 */
export const currentProfileSelector = createSelector(
  currentAccountSelector,
  (state: RootState) => state.dimApi.profiles,
  (currentAccount, profiles) =>
    currentAccount ? profiles[makeProfileKeyFromAccount(currentAccount)] : undefined
);

/**
 * Returns all recent/saved searches.
 *
 * TODO: Sort/trim this list
 */
export const recentSearchesSelector = (state: RootState) =>
  state.dimApi.searches[destinyVersionSelector(state)];

export const trackedTriumphsSelector = createSelector(
  currentProfileSelector,
  (profile) => profile?.triumphs || []
);
