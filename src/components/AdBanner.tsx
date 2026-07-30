import React from 'react';
import { View, StyleSheet } from 'react-native';
import mobileAds, { BannerAd, BannerAdSize, MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';
import { colors } from '../theme';
import { ADMOB_BANNER_UNIT_ID, PERSONALISED_ADS } from '../ads';

const unitId = ADMOB_BANNER_UNIT_ID || TestIds.ADAPTIVE_BANNER;

export async function initialiseAds() {
  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.G,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  });
  await mobileAds().initialize();
}

export function AdBanner() {
  const [failed, setFailed] = React.useState(false);

  // Collapse rather than leave a dead strip. Until the app is live on the store
  // there's little to no fill, so no-fill is the expected case, not an error.
  if (failed) return null;

  return (
    <View style={s.wrap}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: !PERSONALISED_ADS }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', backgroundColor: colors.background },
});
