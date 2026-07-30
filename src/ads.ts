// AdMob configuration.
//
// Both IDs below are still placeholders — the AdMob console entries for this app
// don't exist yet (Google blocks automated sign-in from this container, so Luke
// creates them by hand). While they're empty the app falls back to Google's test
// ad unit, which always fills and is what you're meant to develop against.
//
// To go live: paste the two real IDs in, set the same app ID in app.json under the
// react-native-google-mobile-ads plugin, and rebuild. Nothing else needs touching.
//
// !! A build with these blank must NOT be submitted to the App Store — the test
// !! app ID in Info.plist would ship with it.

export const ADMOB_IOS_APP_ID = ''; // ca-app-pub-XXXXXXXX~YYYYYYYY
export const ADMOB_BANNER_UNIT_ID = ''; // ca-app-pub-XXXXXXXX/YYYYYYYY

// Non-personalised ads only. This is deliberate: personalised ads require an ATT
// prompt, which in turn requires App Privacy "tracking" labels — that's exactly
// what blocked the EPC Estimator submission on 30-Jul. Flipping this to true means
// adding ATT + a UMP consent flow first, not just changing the flag.
export const PERSONALISED_ADS = false;

export const USING_TEST_ADS = !ADMOB_BANNER_UNIT_ID;
