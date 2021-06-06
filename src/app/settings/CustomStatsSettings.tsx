import { customStatsSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import ClassIcon from 'app/dim-ui/ClassIcon';
import Select from 'app/dim-ui/Select';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { armorStats, evenStatWeights } from 'app/search/d2-known-values';
import { addIcon, AppIcon, editIcon, saveIcon } from 'app/shell/icons';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
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

  // const addNewStat = useAddNewStat();
  const defs = useD2Definitions();
  if (!defs) {
    return null;
  }
  const onAddNew = () => {
    const newStat = createNewStat();
    setProvisionalStat(newStat);
    setEditing(newStat.id);
  };

  return (
    <div className={'setting'}>
      {!editing && (
        <button type="button" className={clsx('dim-button', styles.addNew)} onClick={onAddNew}>
          <AppIcon icon={addIcon} />
        </button>
      )}
      <label htmlFor={''}>{'Custom Stat Totals'}</label>
      <div className={'fineprint'}>like original custom totals, but better</div>
      <div className={styles.customStatsSettings}>
        {}
        {[...(editing === provisionalStat?.id ? [provisionalStat] : []), ...customStatList].map(
          (c) => {
            const Component = c.id === editing ? CustomStatEditor : CustomStatView;
            return <Component setEditing={setEditing} statDef={c} key={c.id} />;
          }
        )}
      </div>
    </div>
  );
}

function CustomStatEditor({
  statDef,
  className,
  setEditing,
}: {
  statDef: CustomStatDef;
  className?: string;
  // used to alert upstream that we are done editing this stat
  setEditing: React.Dispatch<React.SetStateAction<string>>;
}) {
  const defs = useD2Definitions()!;
  const [classType, setClassType] = useState(statDef.class);
  const [label, setLabel] = useState(statDef.label);
  // cheating with types here: pedantically speaking, editingStat might be undefined.
  // but no conditional hooks allowed, so this wrong type works to our advantage
  // since we can't short circuit/narrow early by returning if !editingStat
  const [weights, setWeight] = useStatWeightsEditor(statDef.weights); // leave this ?. here
  const saveStat = useSaveStat();
  const options = classes.map((c) => ({
    key: `${c}`,
    content: (
      <span>
        <ClassIcon classType={c} />
        {/* <ClassIcon proportional classType={c} /> {getClassTypeNameLocalized(c, defs)} */}
      </span>
    ),
    value: c,
  }));
  const onClassChange = ({ target }: React.ChangeEvent<HTMLInputElement>) =>
    setLabel(target.value.slice(0, 30));
  const simpleLabel = simplifyStatLabel(label);

  return (
    <div className={clsx(className, styles.customStatEditor)}>
      <div className={styles.identifiyingInfo}>
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion*/}
        <Select options={options} onChange={(c) => setClassType(c!)} value={classType} />
        {/* <ClassIcon proportional classType={classType} />
        </Select> */}
        <input type="text" className={styles.inputlike} value={label} onChange={onClassChange} />
        {simpleLabel.length > 0 && <span className="fineprint">{`stat:${simpleLabel}:>=30`}</span>}
      </div>

      <div className={styles.statWeightRow}>
        {armorStats.map((statHash) => {
          const stat = defs.Stat.get(statHash);
          const weight = weights[statHash] || 0;
          const onVal = ({ target }: React.ChangeEvent<HTMLInputElement>) =>
            setWeight(statHash, target.value);

          const className = weight ? styles.nonZero : styles.zero;
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
        <button
          type="button"
          className="dim-button"
          onClick={() => {
            // try saving the proposed new stat, with newly set label, class, and weights
            saveStat({ ...statDef, class: classType, label, weights }) && setEditing('');
          }}
        >
          <AppIcon icon={saveIcon} />
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
// function statWeightsEditor(weights: CustomStatWeights) {
//   return [
//     weights,
//     (statHash: number, value: string) =>
//       setWeights((old) => ({ ...old, [statHash]: parseInt(value) || 0 })),
//   ] as const;
// }

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
  const defs = useD2Definitions()!;
  // if true, this stat is only include/exclude, no weighting
  const binaryWeights = Object.values(statDef.weights).every((v) => v === 1 || v === 0);
  return (
    <div className={clsx(className, styles.customStatView)}>
      <div className={styles.identifiyingInfo}>
        <button type="button" className="dim-button" onClick={() => setEditing(statDef.id)}>
          <AppIcon icon={editIcon} />
        </button>
        <ClassIcon className={styles.classIcon} classType={statDef.class} />
        <span className={styles.label}>{statDef.label}</span>
      </div>
      <div className={clsx(styles.statWeightRow, { [styles.binaryWeights]: binaryWeights })}>
        {armorStats.map((statHash) => {
          const stat = defs.Stat.get(statHash);
          const weight = statDef.weights[statHash] || 0;
          if (!weight && binaryWeights) {
            return null;
          }
          const className = weight ? styles.nonZero : styles.zero;
          return (
            <React.Fragment key={statHash}>
              <span className={styles.inputlike}>
                <BungieImage
                  className={className}
                  title={stat.displayProperties.name}
                  src={stat.displayProperties.icon}
                />
                {!binaryWeights && <span className={className}>{weight}</span>}
              </span>
              {binaryWeights && <span className={styles.plus}>+</span>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

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
      // or all zeroes
      !weightValues.some(Boolean) ||
      // or there's not enough label
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
      warnInvalidCustomStat();
      return false;
    } else {
      dispatch(setSetting('customStats', [...allOtherStats, newStat]));
      return true;
    }
  };
}

function createNewStat(): CustomStatDef {
  return {
    label: 'new asdf',
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

function warnInvalidCustomStat() {
  showNotification({
    type: 'warning',
    title: t('dont do that'),
    body: t('cannot save this custom stat'),
    duration: 5000,
  });
}
