import { useState } from 'react'

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
const isStandalone = window.navigator.standalone === true

export default function InstallBanner() {
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem('bytereels_install_dismissed')
  )

  if (!isIOS || isStandalone || dismissed) return null

  function handleDismiss() {
    localStorage.setItem('bytereels_install_dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-neutral-700 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold mb-0.5">Install ByteReels</p>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Tap{' '}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline w-3.5 h-3.5 align-text-bottom mx-0.5"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            {' '}then{' '}
            <strong className="text-neutral-200">Add to Home Screen</strong>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install banner"
          className="shrink-0 flex items-center justify-center w-8 h-8 text-neutral-500 hover:text-white active:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
