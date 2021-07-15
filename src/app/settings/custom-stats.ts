// this is in a separate file so search config doesn't necessarily drag in everything from settings

export function simplifyStatLabel(s: string) {
  return s.toLocaleLowerCase().replace(/\W/gu, '');
}
