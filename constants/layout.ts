import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';

/** Widest the reading column ever gets, so desktop viewports don't stretch a phone layout. */
export const CONTENT_MAX_WIDTH = 780;

/** Home dashboard — wide enough for main column + How It Works rail on web/tablet. */
export const HOME_MAX_WIDTH = 1120;

/** Sidebar appears beside the main column at this width and up. */
export const HOME_SIDEBAR_BREAKPOINT = 900;

/**
 * Type sizes are tuned for a phone held at arm's length. The same numbers read as
 * tiny on a desktop monitor, so web gets a lift — heavier for the micro labels,
 * which lose legibility fastest.
 */
export function fs(size: number): number {
  if (!isWeb) return size;
  return Math.round(size * (size <= 11 ? 1.3 : 1.15));
}
