// AdMob configuration. Real IDs, live from 30-Jul-2026.
//
// The iOS app ID is NOT here — it lives in app.json under the
// react-native-google-mobile-ads plugin, because that's what writes it into
// Info.plist at prebuild. Nothing at runtime reads it. It used to be duplicated
// here as an unused constant, which meant pasting a real ID into this file looked
// like it had worked and changed nothing. To change the app ID, change app.json.
//
// Current app ID, for reference only — do not re-add it as a constant:
//   ca-app-pub-9879821077971587~8449305381
//
// A new ad unit can take up to an hour to start filling, and fill stays low until
// the app is actually live on the App Store. A blank banner shortly after a build
// is expected, not a wiring fault.

export const ADMOB_BANNER_UNIT_ID = 'ca-app-pub-9879821077971587/5657435173';

// Non-personalised ads only. This is deliberate: personalised ads require an ATT
// prompt, which in turn requires App Privacy "tracking" labels — that's exactly
// what blocked the EPC Estimator submission on 30-Jul. Flipping this to true means
// adding ATT + a UMP consent flow first, not just changing the flag.
export const PERSONALISED_ADS = false;
