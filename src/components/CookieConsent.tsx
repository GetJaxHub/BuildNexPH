import { useState, useEffect } from 'react';
import { Cookie, X, Check, Settings } from 'lucide-react';

type ConsentChoice = 'accepted' | 'rejected' | 'customized' | null;

interface CookiePrefs {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const STORAGE_KEY = 'buildmart_cookie_consent';
const DEFAULT_PREFS: CookiePrefs = { necessary: true, analytics: false, marketing: false };

function loadConsent(): { choice: ConsentChoice; prefs: CookiePrefs } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      choice: parsed.choice ?? null,
      prefs: parsed.prefs ?? DEFAULT_PREFS,
    };
  } catch {
    return null;
  }
}

function saveConsent(choice: ConsentChoice, prefs: CookiePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, prefs, timestamp: Date.now() }));
  window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: { choice, prefs } }));
}

export function getCookieConsent(): CookiePrefs {
  const stored = loadConsent();
  if (!stored || stored.choice === null) return DEFAULT_PREFS;
  return stored.prefs;
}

export function hasConsented(): boolean {
  const stored = loadConsent();
  return stored?.choice !== null && stored?.choice !== undefined;
}

let openPreferencesFn: (() => void) | null = null;

export function openCookiePreferences() {
  openPreferencesFn?.();
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    const stored = loadConsent();
    if (!stored || stored.choice === null) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    openPreferencesFn = () => {
      const stored = loadConsent();
      if (stored) setPrefs(stored.prefs);
      setShowPrefs(true);
      setVisible(true);
    };
    return () => { openPreferencesFn = null; };
  }, []);

  const handleAccept = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    saveConsent('accepted', allAccepted);
    setVisible(false);
    setShowPrefs(false);
  };

  const handleReject = () => {
    saveConsent('rejected', DEFAULT_PREFS);
    setVisible(false);
    setShowPrefs(false);
  };

  const handleSavePrefs = () => {
    saveConsent('customized', prefs);
    setVisible(false);
    setShowPrefs(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="max-w-3xl mx-auto m-4 card p-5 shadow-xl border-neutral-300">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Cookie size={20} className="text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-neutral-900">We value your privacy</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
              Necessary cookies are required for the site to function. You can choose to enable or disable optional cookies below.
              Read our{' '}
              <a href="/cookie-policy" className="text-primary-600 font-semibold hover:underline">Cookie Policy</a>.
            </p>
          </div>
        </div>

        {showPrefs && (
          <div className="space-y-3 mb-4 border-t border-neutral-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-neutral-700">Necessary</span>
                <p className="text-xs text-neutral-400">Required for site functionality. Cannot be disabled.</p>
              </div>
              <span className="badge bg-success-100 text-success-700 border border-success-200">Always On</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-neutral-700">Analytics</span>
                <p className="text-xs text-neutral-400">Help us understand how visitors interact with the site.</p>
              </div>
              <button
                onClick={() => setPrefs((p) => ({ ...p, analytics: !p.analytics }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${prefs.analytics ? 'bg-primary-600' : 'bg-neutral-300'}`}
                role="switch"
                aria-checked={prefs.analytics}
                aria-label="Toggle analytics cookies"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${prefs.analytics ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-neutral-700">Marketing</span>
                <p className="text-xs text-neutral-400">Used to deliver relevant advertisements and track campaigns.</p>
              </div>
              <button
                onClick={() => setPrefs((p) => ({ ...p, marketing: !p.marketing }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${prefs.marketing ? 'bg-primary-600' : 'bg-neutral-300'}`}
                role="switch"
                aria-checked={prefs.marketing}
                aria-label="Toggle marketing cookies"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${prefs.marketing ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={handleAccept} className="btn-primary flex-1 !py-2.5">
            <Check size={16} /> Accept All
          </button>
          <button onClick={handleReject} className="btn-secondary flex-1 !py-2.5">
            Reject Optional
          </button>
          {!showPrefs ? (
            <button onClick={() => setShowPrefs(true)} className="btn-secondary flex-1 !py-2.5">
              <Settings size={16} /> Preferences
            </button>
          ) : (
            <button onClick={handleSavePrefs} className="btn-secondary flex-1 !py-2.5">
              Save Preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
