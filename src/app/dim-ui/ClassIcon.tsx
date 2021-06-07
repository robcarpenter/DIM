import { AppIcon, globeIcon } from 'app/shell/icons';
import {
  dimHunterIcon,
  dimHunterProportionalIcon,
  dimTitanIcon,
  dimTitanProportionalIcon,
  dimWarlockIcon,
  dimWarlockProportionalIcon,
} from 'app/shell/icons/custom';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React from 'react';

const classIcons = {
  [DestinyClass.Hunter]: dimHunterIcon,
  [DestinyClass.Titan]: dimTitanIcon,
  [DestinyClass.Warlock]: dimWarlockIcon,
  [DestinyClass.Unknown]: globeIcon,
} as const;

const classIconsProportional = {
  [DestinyClass.Hunter]: dimHunterProportionalIcon,
  [DestinyClass.Titan]: dimTitanProportionalIcon,
  [DestinyClass.Warlock]: dimWarlockProportionalIcon,
  [DestinyClass.Unknown]: globeIcon,
} as const;

/**
 * Displays a class icon given a class type.
 */
export default function ClassIcon({
  classType,
  proportional,
  className,
}: {
  classType: DestinyClass;
  proportional?: boolean;
  className?: string;
}) {
  return (
    <AppIcon
      icon={(proportional ? classIconsProportional : classIcons)[classType]}
      className={className}
    />
  );
}
