// Adsgram and Adsterra integration service

/**
 * Show Rewarded Adsgram Ad to claim Boss Reward or complete Daily task
 * @param {Function} onRewardCallback - callback called when user finishes watching ad
 */
export async function showAdsgramRewardAd(onRewardCallback) {
  const blockId = import.meta.env.VITE_ADSGRAM_BLOCK_ID || 'int-0000';

  if (typeof window !== 'undefined' && window.Adsgram) {
    try {
      const AdController = window.Adsgram.init({ blockId });
      const result = await AdController.show();
      if (result && result.done) {
        if (onRewardCallback) onRewardCallback(true);
        return true;
      }
    } catch (err) {
      console.warn('Adsgram native show failed, fallback to simulator:', err);
    }
  }

  // Fallback simulator modal for local dev / preview environments
  return new Promise((resolve) => {
    simulateRewardAdVideo((success) => {
      if (success && onRewardCallback) {
        onRewardCallback(true);
      }
      resolve(success);
    });
  });
}

/**
 * Interactive simulated rewarded video ad modal when outside Telegram or in dev mode
 */
function simulateRewardAdVideo(callback) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4';
  overlay.id = 'ad-simulation-overlay';

  let countdown = 5;

  overlay.innerHTML = `
    <div class="relative w-full max-w-sm rounded-2xl bg-[#121216] border border-white/10 p-6 text-center text-white shadow-2xl animate-fade-in">
      <div class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg">
        <svg class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div class="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-green-400 mb-2">
        ADSGRAM SPONSORED REWARD
      </div>

      <h3 class="text-xl font-bold">Asteroid Defense Force</h3>
      <p class="mt-2 text-xs text-neutral-400">Watch full sponsor clip to claim your 200 Boss Coins.</p>

      <div class="my-6 rounded-xl bg-neutral-900/80 p-4 border border-white/5">
        <div class="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
          <div id="ad-progress-bar" class="h-full bg-green-500 transition-all duration-1000" style="width: 0%"></div>
        </div>
        <p id="ad-timer-text" class="mt-3 text-sm font-semibold text-neutral-300">Reward unlocks in ${countdown}s...</p>
      </div>

      <button id="ad-claim-btn" disabled class="w-full rounded-xl bg-neutral-700 py-3 text-sm font-bold text-neutral-400 cursor-not-allowed transition-all">
        Watching Sponsor...
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const timerText = document.getElementById('ad-timer-text');
  const progressBar = document.getElementById('ad-progress-bar');
  const claimBtn = document.getElementById('ad-claim-btn');

  const interval = setInterval(() => {
    countdown -= 1;
    const percent = ((5 - countdown) / 5) * 100;
    if (progressBar) progressBar.style.width = `${percent}%`;

    if (countdown > 0) {
      if (timerText) timerText.innerText = `Reward unlocks in ${countdown}s...`;
    } else {
      clearInterval(interval);
      if (timerText) timerText.innerText = 'Reward verified! Click below to claim.';
      if (claimBtn) {
        claimBtn.disabled = false;
        claimBtn.innerText = 'Claim 200 Boss Coins';
        claimBtn.className = 'w-full rounded-xl bg-white py-3 text-sm font-bold text-black shadow-lg hover:bg-neutral-200 active:scale-95 transition-all';
        claimBtn.onclick = () => {
          overlay.remove();
          callback(true);
        };
      }
    }
  }, 1000);
}
