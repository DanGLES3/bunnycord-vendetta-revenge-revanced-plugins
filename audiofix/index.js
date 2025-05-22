(function(t, e, a) {
  "use strict";

  // 1) Determine the correct native‐audio module
  const AudioModule =
    e.ReactNative.NativeModules.NativeAudioManagerModule === null
      ? e.ReactNative.NativeModules.RTNAudioManager
      : e.ReactNative.NativeModules.NativeAudioManagerModule;

  // 2) Patch setCommunicationModeOn → no-op
  const unpatchSetCommMode = a.instead(
    "setCommunicationModeOn",
    AudioModule,
    function() {}
  );

  // 3) Patch requestAudioFocus → no-op (return 0 as if AUDIOFOCUS_REQUEST_GRANTED)
  const unpatchRequestFocus = a.instead(
    "requestAudioFocus",
    AudioModule,
    function() {
      return 0;
    }
  );

  // 4) (Optional) Patch setMode → force MODE_NORMAL (0) after any call to setMode
  let unpatchSetMode = null;
  if (typeof AudioModule.setMode === "function") {
    unpatchSetMode = a.after("setMode", AudioModule, function(args, res) {
      AudioModule.setMode(0);
    });
  }

  // 5) onUnload should revert all patches
  t.onUnload = function() {
    unpatchSetCommMode();
    unpatchRequestFocus();
    if (unpatchSetMode) unpatchSetMode();
  };

  return t;
})(
  {},
  vendetta.metro.common,
  vendetta.patcher
);
