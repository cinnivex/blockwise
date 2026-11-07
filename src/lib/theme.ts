export type ThemeChoice = "system" | "light" | "dark";

export const THEME_KEY = "blockwise:theme";
export const THEME_EVENT = "blockwise:theme-change";

/**
 * Runs in <head> before the page paints, so a saved Light/Dark choice applies
 * without a flash of the wrong colors. "System" means no data-theme attribute,
 * letting the CSS follow the device setting.
 */
export const themeInitScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function readTheme(): ThemeChoice {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
  try {
    if (choice === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Private browsing etc.: the choice still applies for this visit.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}
