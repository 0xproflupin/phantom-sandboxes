import { Platform } from '../types';

export const getMobileOS = (): Platform => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) {
    return Platform.Android;
  } else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return Platform.iOS;
  }
  return Platform.Other;
};
