// Telegram WebApp SDK Integration Service

export function getTelegramWebApp() {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function initTelegramApp() {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      if (tg.setHeaderColor) tg.setHeaderColor('#070709');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#070709');
    } catch (e) {
      console.warn('Telegram WebApp init warning:', e);
    }
  }
}

export function getTelegramInitData() {
  const tg = getTelegramWebApp();
  if (tg && tg.initData) {
    return tg.initData;
  }
  return '';
}

export function getTelegramUser() {
  const tg = getTelegramWebApp();
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    return tg.initDataUnsafe.user;
  }
  return null;
}

export function getStartParamReferral() {
  const tg = getTelegramWebApp();
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
    const param = tg.initDataUnsafe.start_param;
    if (param.startsWith('ref_')) {
      return param.replace('ref_', '');
    }
    return param;
  }

  // Also check URL search params (e.g. ?startapp=ref_XYZ or ?ref=XYZ)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const startApp = params.get('startapp') || params.get('ref');
    if (startApp) {
      return startApp.replace('ref_', '');
    }
  }
  return null;
}

export function triggerHaptic(type = 'light') {
  const tg = getTelegramWebApp();
  if (tg && tg.HapticFeedback) {
    try {
      if (type === 'selection') {
        tg.HapticFeedback.selectionChanged();
      } else if (['light', 'medium', 'heavy', 'rigid', 'soft'].includes(type)) {
        tg.HapticFeedback.impactOccurred(type);
      } else if (['error', 'success', 'warning'].includes(type)) {
        tg.HapticFeedback.notificationOccurred(type);
      }
    } catch (e) {
      // Haptics not supported on device
    }
  }
}

export function openTelegramShare(url, text = 'Play Asteroid Blaster with me and earn rewards!') {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const tg = getTelegramWebApp();
  if (tg && tg.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
}
