; Remove only obsolete WebView service-worker data from previous desktop
; releases. User preferences, conversations and the rest of the WebView
; profile remain untouched.
!macro NSIS_HOOK_POSTINSTALL
  RMDir /r "$LOCALAPPDATA\ai.zareksystems.jarvis\EBWebView\Default\Service Worker"
!macroend
