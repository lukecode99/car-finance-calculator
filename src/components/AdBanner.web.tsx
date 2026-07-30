// Web build (gh-pages) has no AdMob — the native module doesn't resolve under
// react-native-web. Metro picks this file over AdBanner.tsx for platform 'web',
// which keeps the native SDK out of the web bundle entirely.

export async function initialiseAds() {}

export function AdBanner() {
  return null;
}
