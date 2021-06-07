import { customStatsSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import ClassIcon from 'app/dim-ui/ClassIcon';
import { CustomStatWeightsDisplay } from 'app/dim-ui/CustomStatWeights';
import Select from 'app/dim-ui/Select';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { armorStats, evenStatWeights } from 'app/search/d2-known-values';
import { addIcon, AppIcon, deleteIcon, editIcon, saveIcon } from 'app/shell/icons';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line css-modules/no-unused-class
import weightsStyles from '../dim-ui/CustomStatWeights.m.scss';
import { setSetting } from './actions';
import styles from './CustomStatsSettings.m.scss';
import { CustomStatDef, CustomStatWeights } from './initial-settings';

const classes = [
  DestinyClass.Hunter,
  DestinyClass.Titan,
  DestinyClass.Warlock,
  DestinyClass.Unknown,
];

export function CustomStatsSettings() {
  const customStatList = useSelector(customStatsSelector);
  const [editing, setEditing] = useState('');
  const [provisionalStat, setProvisionalStat] = useState<CustomStatDef>();

  const defs = useD2Definitions();
  if (!defs) {
    return null;
  }
  const onAddNew = () => {
    const newStat = createNewStat();
    setProvisionalStat(newStat);
    setEditing(newStat.id);
  };
  const onDoneEditing = () => {
    setEditing('');
    setProvisionalStat(undefined);
  };
  return (
    <div className={'setting'}>
      {!editing && (
        <button type="button" className={clsx('dim-button', styles.addNew)} onClick={onAddNew}>
          <AppIcon icon={addIcon} />
        </button>
      )}
      <label htmlFor={''}>{t('Settings.CustomStatTitle')}</label>
      <div className={clsx(styles.customDesc, 'fineprint')}>{t('Settings.CustomStatDesc')}</div>
      <div className={styles.customStatsSettings}>
        {[...(provisionalStat ? [provisionalStat] : []), ...customStatList].map((c) =>
          c.id === editing ? (
            <CustomStatEditor onDoneEditing={onDoneEditing} statDef={c} key={c.id} />
          ) : (
            <CustomStatView setEditing={setEditing} statDef={c} key={c.id} />
          )
        )}
      </div>
    </div>
  );
}

function CustomStatEditor({
  statDef,
  className,
  onDoneEditing,
}: {
  statDef: CustomStatDef;
  className?: string;
  // used to alert upstream that we are done editing this stat
  onDoneEditing(): void;
}) {
  const defs = useD2Definitions()!;
  const [classType, setClassType] = useState(statDef.class);
  const [label, setLabel] = useState(statDef.label);
  // cheating with types here: pedantically speaking, editingStat might be undefined.
  // but no conditional hooks allowed, so this wrong type works to our advantage
  // since we can't short circuit/narrow early by returning if !editingStat
  const [weights, setWeight] = useStatWeightsEditor(statDef.weights);
  const saveStat = useSaveStat();
  const removeStat = useRemoveStat();
  const options = classes.map((c) => ({
    key: `${c}`,
    content: <ClassIcon classType={c} />,
    value: c,
  }));
  const onClassChange = ({ target }: React.ChangeEvent<HTMLInputElement>) =>
    setLabel(target.value.slice(0, 30));
  const simpleLabel = simplifyStatLabel(label);

  return (
    <div className={clsx(className, styles.customStatEditor)}>
      <div className={styles.identifyingInfo}>
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion*/}
        <Select options={options} onChange={(c) => setClassType(c!)} value={classType} />
        <input
          type="text"
          placeholder={t('Settings.CustomName')}
          className={styles.inputlike}
          value={label}
          onChange={onClassChange}
        />
      </div>

      <div className={clsx(styles.editableStatsRow, weightsStyles.statWeightRow)}>
        {armorStats.map((statHash) => {
          const stat = defs.Stat.get(statHash);
          const weight = weights[statHash] || 0;
          const onVal = ({ target }: React.ChangeEvent<HTMLInputElement>) =>
            setWeight(statHash, target.value);

          const className = weight ? 'stat-icon' : styles.zero;
          return (
            <label className={styles.inputlike} key={statHash}>
              <BungieImage
                className={className}
                title={stat.displayProperties.name}
                src={stat.displayProperties.icon}
              />
              <input type="number" max={9} min={0} maxLength={30} value={weight} onChange={onVal} />
            </label>
          );
        })}
      </div>
      <div className={styles.identifyingInfo}>
        <span className={clsx('fineprint', styles.filter)}>
          {simpleLabel.length > 0 && (
            <>
              {t('Filter.Filter')}
              {': '}
              <code>{`stat:${simpleLabel}:>=30`}</code>
            </>
          )}
        </span>
        <button
          type="button"
          className="dim-button"
          onClick={() => {
            // try saving the proposed new stat, with newly set label, class, and weights
            saveStat({ ...statDef, class: classType, label, weights }) && onDoneEditing();
          }}
        >
          <AppIcon icon={saveIcon} />
        </button>
        <button
          type="button"
          className="dim-button"
          onClick={() => removeStat(statDef) && onDoneEditing()}
        >
          <AppIcon icon={deleteIcon} />
        </button>
      </div>
    </div>
  );
}

function useStatWeightsEditor(w: CustomStatWeights) {
  const [weights, setWeights] = useState(w);
  return [
    weights,
    (statHash: number, value: string) =>
      setWeights((old) => ({ ...old, [statHash]: parseInt(value) || 0 })),
  ] as const;
}

function CustomStatView({
  statDef,
  className,
  setEditing,
}: {
  statDef: CustomStatDef;
  className?: string;
  // used to alert upstream that we want to edit this stat
  setEditing: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div className={clsx(className, styles.customStatView)}>
      <div className={styles.identifyingInfo}>
        <button type="button" className="dim-button" onClick={() => setEditing(statDef.id)}>
          <AppIcon icon={editIcon} />
        </button>
        <ClassIcon proportional className={styles.classIcon} classType={statDef.class} />
        <span className={styles.label}>{statDef.label}</span>
      </div>
      <CustomStatWeightsDisplay customStat={statDef} />
    </div>
  );
}

// custom stat retrieval from state/settings needs to be in a stable order,
// between stat generation (stats.ts) and display (ItemStat.tsx)
// so let's just neatly sort them as we commit them to settings.
const customStatSort = chainComparator(
  compareBy((customStat: CustomStatDef) => customStat.class),
  compareBy((customStat: CustomStatDef) => customStat.label)
);

function useSaveStat() {
  const dispatch = useDispatch();
  const customStatList = useSelector(customStatsSelector);
  return (newStat: CustomStatDef) => {
    const weightValues = Object.values(newStat.weights);
    const allOtherStats = customStatList.filter((s) => s.id !== newStat.id);
    const proposedSimpleLabel = simplifyStatLabel(newStat.label);

    if (
      // if there's any invalid values
      !weightValues.every((v) => Number.isInteger(v) && v! >= 0) ||
      // or too few included stats
      weightValues.filter(Boolean).length < 2
    ) {
      warnInvalidCustomStat(t('Settings.CustomErrorValues'));
      return false;
    }
    if (
      // if there's not enough label
      !proposedSimpleLabel ||
      // or there's an existing stat with an overlapping label & class
      allOtherStats.some(
        (s) =>
          simplifyStatLabel(s.label) === proposedSimpleLabel &&
          (s.class === newStat.class ||
            s.class === DestinyClass.Unknown ||
            newStat.class === DestinyClass.Unknown)
      )
    ) {
      warnInvalidCustomStat(t('Settings.CustomErrorLabel'));
      return false;
    } else {
      dispatch(
        setSetting(
          'customStats',
          [...allOtherStats.filter((s) => s.id), newStat].sort(customStatSort)
        )
      );
      return true;
    }
  };
}

function useRemoveStat() {
  const dispatch = useDispatch();
  const customStatList = useSelector(customStatsSelector);
  return (stat: CustomStatDef) => {
    if (stat.label === '' || confirm(t('Settings.CustomDelete'))) {
      dispatch(
        setSetting(
          'customStats',
          customStatList.filter((s) => s.id !== stat.id).sort(customStatSort)
        )
      );
      return true;
    }
    return false;
  };
}

function createNewStat(): CustomStatDef {
  return {
    label: '',
    class: DestinyClass.Unknown,
    weights: { ...evenStatWeights },
    id: uuidv4(),
  };
}

export function simplifyStatLabel(s: string) {
  return s.toLocaleLowerCase().replace(/\W/gu, '');
}

export function normalizeStatLabel(s: string) {
  return s.trim().slice(0, 30);
}

function warnInvalidCustomStat(errorMsg: string) {
  showNotification({
    type: 'warning',
    title: t('dont do that'),
    body: errorMsg,
    duration: 5000,
  });
}
