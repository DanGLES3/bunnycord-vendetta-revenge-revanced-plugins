/**
 * disable_call_volume_slider_fixed.js
 *
 * – Grabs the true AudioModule via vendetta.metro.findByProps
 * – Safely no-ops setCommunicationModeOn (→ keeps A2DP)
 * – Safely no-ops requestAudioFocus (→ Android never shows call slider)
 * – Safely forces MODE_NORMAL after any setMode call (extra insurance)
 */

(function (t, metro, patcher) {
  "use strict";

  // 1) Try to find the native-audio bridge by its exported methods
  const AudioModule =
    // prefer the module that actually exports these props
    metro.findByProps("setCommunicationModeOn", "requestAudioFocus") ||
    // fallback to ReactNative.NativeModules
    (metro.common &&
      metro.common.ReactNative &&
      metro.common.ReactNative.NativeModules &&
      (metro.common.ReactNative.NativeModules.NativeAudioManagerModule ||
        metro.common.ReactNative.NativeModules.RTNAudioManager)) ||
    null;

  if (!AudioModule) {
    console.warn(
      "[disable_call_volume_slider_fixed] 🔇 AudioModule not found, skipping all patches."
    );
    return t;
  }

  // helper to patch only if method exists
  function safeInstead(name, fn) {
    if (typeof AudioModule[name] === "function") {
      return patcher.instead(name, AudioModule, fn);
    } else {
      console.warn(
        `[disable_call_volume_slider_fixed] ⚠️ ${name}() not found, skipping.`
      );
      return () => {};
    }
  }
  function safeAfter(name, fn) {
    if (typeof AudioModule[name] === "function") {
      return patcher.after(name, AudioModule, fn);
    } else {
      console.warn(
        `[disable_call_volume_slider_fixed] ⚠️ after ${name}() not found, skipping.`
      );
      return () => {};
    }
  }

  // 2) No-op setCommunicationModeOn → never enter HFP
  const unpatchCommMode = safeInstead("setCommunicationModeOn", () => {});

  // 3) No-op requestAudioFocus → Android never thinks it's a call
  const unpatchFocus = safeInstead("requestAudioFocus", () => {
    return 0; // AUDIOFOCUS_REQUEST_GRANTED
  });

  // 4) (Optional) After any setMode, force MODE_NORMAL (0)
  const unpatchMode = safeAfter("setMode", (args, res) => {
    try {
      AudioModule.setMode(0);
    } catch (_e) {
      /* ignore */
    }
  });

  // 5) onUnload should revert them all
  t.onUnload = () => {
    unpatchCommMode();
    unpatchFocus();
    unpatchMode();
    console.log(
      "[disable_call_volume_slider_fixed] ✅ All patches reverted."
    );
  };

  console.log("[disable_call_volume_slider_fixed] ✅ Patches applied.");
  return t;
})(
  {},
  vendetta.metro,
  vendetta.patcher
);
