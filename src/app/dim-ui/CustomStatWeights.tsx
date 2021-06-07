import { customStatsSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats, CUSTOM_STAT_BASE_HASH } from 'app/search/d2-known-values';
import { CustomStatDef } from 'app/settings/initial-settings';
import clsx from 'clsx';
import React, { ReactElement, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import styles from './CustomStatWeights.m.scss';

export function CustomStatWeightsFromHash({
  customStatHash,
  className,
}: {
  customStatHash: number;
  className?: string;
}) {
  const customStatsList = useSelector(customStatsSelector);
  const statIndex = -customStatHash + CUSTOM_STAT_BASE_HASH;
  const customStat = customStatsList[statIndex];
  if (!customStat) {
    return null;
  }
  return <CustomStatWeightsDisplay className={className} customStat={customStat} />;
}

export function CustomStatWeightsDisplay({
  customStat,
  className,
  singleStatClass,
}: {
  customStat: CustomStatDef;
  className?: string;
  singleStatClass?: string;
}) {
  const defs = useD2Definitions()!;
  // if true, this stat is only include/exclude, no weighting
  const binaryWeights = Object.values(customStat.weights).every((v) => v === 1 || v === 0);
  return (
    <div className={clsx(styles.statWeightRow, className)}>
      {addDividers(
        armorStats
          .map((statHash) => {
            const stat = defs.Stat.get(statHash);
            const weight = customStat.weights[statHash] || 0;
            if (!weight) {
              return null;
            }
            return (
              <span key={statHash} title={stat.displayProperties.name} className={singleStatClass}>
                <BungieImage
                  className="stat-icon"
                  title={stat.displayProperties.name}
                  src={stat.displayProperties.icon}
                />
                {!binaryWeights && <span>{weight}</span>}
              </span>
            );
          })
          .filter(Boolean),
        <span className={styles.divider} />
      )}
    </div>
  );
}

/** places a divider between each element of arr */
function addDividers<T extends React.ReactNode>(arr: T[], divider: ReactElement): ReactNode[] {
  return arr.flatMap((e, i) => [
    i ? React.cloneElement(divider, { key: `divider-${i}` }) : null,
    e,
  ]);
}
