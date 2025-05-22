/**
 * disable_call_volume_slider.js
 *
 * - Disables setCommunicationModeOn → no HFP (keeps A2DP).
 * - Stubs out requestAudioFocus → Android never thinks it's a call, so no "call" volume UI.
 * - (Optional) Hooks setMode → forces MODE_NORMAL after any attempt to switch to "in_communication".
 */

(function (exports, common, patcher) {
  "use strict";

  // 1) Grab Discord’s “native‐audio” module (either NativeAudioManagerModule or RTNAudioManager).
  const AudioModule =
    common.ReactNative.NativeModules.NativeAudioManagerModule === null
      ? common.ReactNative.NativeModules.RTNAudioManager
      : common.ReactNative.NativeModules.NativeAudioManagerModule;

  // 2) Disable setCommunicationModeOn(...) so Discord never switches into HFP.
  patcher.instead(
    "setCommunicationModeOn",
    AudioModule,
    () => {
      // no‐op
    }
  );

  // 3) Disable requestAudioFocus(...) so Android never thinks there's a VOICE_COMMUNICATION stream.
  //    This prevents the “call volume” slider from appearing.
  //    (Signature might be requestAudioFocus(params), but Vendetta will match by name.)
  patcher.instead(
    "requestAudioFocus",
    AudioModule,
    () => {
      // no-op
      return 0; // (AudioManager.AUDIOFOCUS_REQUEST_GRANTED) if Discord checks a return value
    }
  );

  // 4) (Optional) Patch setMode(...) so that if Discord ever says “setMode(MODE_IN_COMMUNICATION)”, we immediately set it back to MODE_NORMAL (0).
  //    This is just extra insurance that Android never thinks we’re “in call” mode.
  if (typeof AudioModule.setMode === "function") {
    patcher.after(
      "setMode",
      AudioModule,
      (args, res) => {
        // MODE_NORMAL = 0
        AudioModule.setMode(0);
      }
    );
  }

  // Expose an onUnload so Vendetta can clean everything up if you unload the tweak.
  exports.onUnload = function () {
    // revert everything
    patcher.unpatchAll();
  };

  return exports;
})(
  {},
  vendetta.metro.common,
  vendetta.patcher
);
