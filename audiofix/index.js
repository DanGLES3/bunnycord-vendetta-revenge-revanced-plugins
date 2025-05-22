/**
 * disable_call_volume_slider_safe.js
 *
 * A safer Vendetta tweak that:
 *  - Disables setCommunicationModeOn (no HFP → keeps A2DP).
 *  - Disables requestAudioFocus (Android won’t show call volume).
 *  - Forces MODE_NORMAL if Discord tries to switch to in-communication (optional).
 *
 * Each patch is applied only if the target method actually exists.
 */

(function (exports, common, patcher) {
  "use strict";

  // 1) Find the audio module (NativeAudioManagerModule or RTNAudioManager).
  const AudioModule =
    common.ReactNative.NativeModules.NativeAudioManagerModule ||
    common.ReactNative.NativeModules.RTNAudioManager ||
    null;

  if (!AudioModule) {
    // If we can’t find any audio module, do nothing.
    console.warn("[disable_call_volume_slider_safe] Could not locate AudioModule—tweak will not apply.");
    return exports;
  }

  // Helper: only patch if the method exists on AudioModule as a function.
  function safeInstead(methodName, replacement) {
    if (typeof AudioModule[methodName] === "function") {
      patcher.instead(methodName, AudioModule, replacement);
      console.log(`[disable_call_volume_slider_safe] Patched ${methodName}`);
    } else {
      console.warn(`[disable_call_volume_slider_safe] Skipped patch for ${methodName} (not found).`);
    }
  }

  function safeAfter(methodName, callback) {
    if (typeof AudioModule[methodName] === "function") {
      patcher.after(methodName, AudioModule, callback);
      console.log(`[disable_call_volume_slider_safe] Patched after ${methodName}`);
    } else {
      console.warn(`[disable_call_volume_slider_safe] Skipped after-patch for ${methodName} (not found).`);
    }
  }

  // 2) Disable setCommunicationModeOn(...) → no HFP
  safeInstead("setCommunicationModeOn", () => {
    // no-op
  });

  // 3) Disable requestAudioFocus(...) → Android never sees a VOICE_COMMUNICATION focus
  safeInstead("requestAudioFocus", () => {
    // Return 0 (AudioManager.AUDIOFOCUS_REQUEST_GRANTED) if Discord checks the return value.
    return 0;
  });

  // 4) (Optional) After setMode(...), force MODE_NORMAL = 0
  safeAfter("setMode", (args, res) => {
    try {
      // Only call if setMode still exists
      AudioModule.setMode(0);
    } catch (_e) {
      // Silently ignore if something goes wrong
    }
  });

  // 5) onUnload—unpatch everything
  exports.onUnload = function () {
    patcher.unpatchAll();
    console.log("[disable_call_volume_slider_safe] All patches reverted.");
  };

  return exports;
})(
  {},
  vendetta.metro.common,
  vendetta.patcher
);
