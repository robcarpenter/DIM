import { useDispatch } from 'react-redux';
import { setSettingAction } from './actions';
import { Settings } from './initial-settings';

export function useSetSetting() {
  const dispatch = useDispatch();
  return <V extends keyof Settings>(property: V, value: Settings[V]) =>
    dispatch(setSettingAction(property, value));
}
