import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'ja';
const KEY = 'ppa-lang';
const listeners = new Set<() => void>();
let current: Lang = (localStorage.getItem(KEY) as Lang) === 'ja' ? 'ja' : 'en';
document.documentElement.lang = current;

export function setLang(lang: Lang) {
  current = lang;
  localStorage.setItem(KEY, lang);
  document.documentElement.lang = lang;
  listeners.forEach((l) => l());
}

export function useLang() {
  const lang = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => current);
  /** Pick the English or Japanese string for the current language. */
  const t = (en: string, ja: string) => (lang === 'ja' ? ja : en);
  return { lang, setLang, t };
}
