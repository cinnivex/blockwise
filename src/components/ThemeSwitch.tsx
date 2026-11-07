"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, readTheme, THEME_EVENT, THEME_KEY, type ThemeChoice } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_KEY) return;
    applyTheme(readTheme()); // keep other open tabs in sync
    onChange();
  };
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const OPTIONS: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "Match device",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="2.5" y="3.5" width="15" height="10" rx="2" />
        <path d="M7 17h6M10 13.5V17" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="10" cy="10" r="3.5" />
        <path
          d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M16.5 12.5A7 7 0 0 1 7.5 3.5a7 7 0 1 0 9 9z" strokeLinejoin="round" />
      </svg>
    ),
  },
];

/** Three-way System / Light / Dark switch. The choice is remembered on this device. */
export function ThemeSwitch() {
  // Server render shows "system"; the browser then reads the saved choice.
  const current = useSyncExternalStore(subscribe, readTheme, () => "system" as ThemeChoice);

  return (
    <div role="radiogroup" aria-label="Color theme" className="inline-flex rounded-full border border-border p-0.5">
      {OPTIONS.map((o) => {
        const selected = current === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={o.label}
            title={o.label}
            onClick={() => applyTheme(o.value)}
            className={`rounded-full p-1.5 ${
              selected ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
}
