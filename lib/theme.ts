export const THEME_STORAGE_KEY = "mint-deck-theme"

/**
 * Runs synchronously in <head>, before the first paint, so a stored choice never
 * flashes the other theme. With no stored choice the attribute is left off and
 * the `prefers-color-scheme` rules in globals.css decide.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})()`
