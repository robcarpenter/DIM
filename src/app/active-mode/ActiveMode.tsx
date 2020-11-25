import { DestinyAccount } from 'app/accounts/destiny-account';
import { currentAccountSelector } from 'app/accounts/selectors';
import CurrentActivity from 'app/active-mode/Views/CurrentActivity';
import FarmingView from 'app/active-mode/Views/FarmingView';
import PursuitsView from 'app/active-mode/Views/PursuitsView';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import {
  bucketsSelector,
  currentStoreSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { loadAllVendors } from 'app/vendors/actions';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import '../inventory/Stores.scss';
import styles from './ActiveMode.m.scss';

interface StoreProps {
  buckets: InventoryBuckets;
  currentStore: DimStore;
  isPhonePortrait: boolean;
  stores: DimStore[];
  account: DestinyAccount;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    buckets: bucketsSelector(state)!,
    currentStore: currentStoreSelector(state)!,
    isPhonePortrait: state.shell.isPhonePortrait,
    stores: sortedStoresSelector(state),
    account: currentAccountSelector(state)!,
  };
}

type Props = StoreProps & ThunkDispatchProp;

/**
 * Display current activity, selected character, and entire inventory
 */
function ActiveMode(this: void, { dispatch, stores, account, currentStore, buckets }: Props) {
  useEffect(() => {
    ga('send', 'pageview', `/profileMembershipId/d${account.destinyVersion}/active`);
  }, [account]);

  useEffect(() => {
    dispatch(loadAllVendors(account, currentStore.id));
  }, [account, currentStore.id, dispatch]);

  if (!stores.length || !buckets) {
    return null;
  }

  return (
    <div className={styles.activityColumn}>
      <div className={styles.contents}>
        <CurrentActivity account={account} store={currentStore} buckets={buckets} />
        <PursuitsView store={currentStore} />
        <FarmingView store={currentStore} />
      </div>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(ActiveMode);
