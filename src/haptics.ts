import * as Haptics from 'expo-haptics';

// Haptics are a nicety; a device without them should never surface an error.
const quiet = (p: Promise<unknown>) => void p.catch(() => {});

export const haptics = {
  place: () => quiet(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => quiet(Haptics.selectionAsync()),
  success: () => quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  refuse: () => quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
