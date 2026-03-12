/**
 * Haptic feedback utility for touch devices.
 * Uses the Vibration API where supported, falls back gracefully on unsupported platforms.
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error'

/** Duration mappings in milliseconds for each style */
const HAPTIC_PATTERNS: Record<HapticStyle, number | number[]> = {
  selection: 10,
  light: 15,
  medium: 30,
  heavy: 50,
  success: [30, 20, 30],
  warning: [40, 30, 40],
  error: [50, 30, 50, 30, 50],
}

/**
 * Trigger haptic feedback using the Vibration API.
 * Silently ignored on platforms that do not support vibration.
 */
export function haptic(style: HapticStyle = 'light'): void {
  if (typeof window === 'undefined') return
  if (!('vibrate' in navigator)) return

  const pattern = HAPTIC_PATTERNS[style]
  try {
    navigator.vibrate(pattern)
  } catch {
    // Silently ignore errors (e.g. in iframe, permissions policy)
  }
}
