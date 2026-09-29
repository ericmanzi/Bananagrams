import { router } from 'expo-router';

/** Back to the home screen without stacking a second copy of it. */
export function goHome() {
  if (router.canGoBack()) router.dismissAll();
  else router.replace('/');
}
