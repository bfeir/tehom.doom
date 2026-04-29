// src/components/AddToHomeScreenBanner.tsx
// Dismissable iOS "Add to Home Screen" install prompt.
// Shows only on iOS Safari when app is not running in standalone mode
// and the user has not previously dismissed the banner.

import React, { useState } from "react";

const DISMISSED_KEY = "addToHomeScreenBannerDismissed";

function isIOSSafari(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  const standaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
  const navigatorStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return standaloneMedia || navigatorStandalone;
}

function isDismissed(): boolean {
  return localStorage.getItem(DISMISSED_KEY) === "true";
}

export function AddToHomeScreenBanner(): React.ReactElement | null {
  const shouldShow = isIOSSafari() && !isStandalone() && !isDismissed();
  const [visible, setVisible] = useState(shouldShow);

  if (!visible) {
    return null;
  }

  function handleDismiss(): void {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  }

  return (
    <div role="banner" aria-label="Add to Home Screen banner">
      <p>{"Add to Home Screen: tap Share, then 'Add to Home Screen'"}</p>
      <button type="button" aria-label="Dismiss install banner" onClick={handleDismiss}>
        Dismiss
      </button>
    </div>
  );
}
