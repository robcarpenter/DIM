import { customStatsSelector } from 'app/dim-api/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';
import BungieImage from './BungieImage';
import ClassIcon from './ClassIcon';
import './CustomStat.scss';
import Select from './Select';

export type StatHashListsKeyedByDestinyClass = Record<number, number[]>;

const classes = [
  DestinyClass.Hunter,
  DestinyClass.Titan,
  DestinyClass.Warlock,
  DestinyClass.Unknown,
];

export function CustomStatEditor({
  statIndex,
  className,
}: {
  statIndex: number;
  className?: string;
}) {
  const defs = useD2Definitions();
  const customStats = useSelector(customStatsSelector);
  const editingStat = customStats[statIndex];

  // const dispatch = useDispatch();
  if (!defs || !editingStat) {
    return null;
  }

  return (
    <div className={clsx(className, 'customStatControl')}>
      <div className="customStatLabel">
        <Select
          options={classes.map((c) => ({
            key: `${c}`,
            content: <ClassIcon classType={c} />,
            value: c,
          }))}
          onChange={(c) => {
            // eslint-disable-next-line no-console
            console.log(c);
          }}
          value={editingStat.class}
        />
        <input type="text" className="inputlike" value={editingStat.label} />
        <span className="fineprint">{`stat:${simplifyStatLabel(editingStat.label)}:>=30`}</span>
      </div>

      <div className="customStatWeights">
        {armorStats.map((statHash) => {
          const stat = defs.Stat.get(statHash);
          return (
            <label className="inputlike" key={statHash}>
              <BungieImage src={stat.displayProperties.icon} />
              <input type="number" value={editingStat.weights[statHash]} />
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function simplifyStatLabel(s: string) {
  return s.toLocaleLowerCase().replace(/\W/gu, '');
}

export function normalizeStatLabel(s: string) {
  return s.trim().slice(0, 30);
}
