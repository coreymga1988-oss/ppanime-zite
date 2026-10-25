import { useEffect } from 'react';
import { JA } from '../lib/ja';
import { useLang } from '../lib/i18n';

const ATTRS = ['placeholder', 'title', 'aria-label'] as const;
const origText = new WeakMap<Text, string>();
const origAttr = new WeakMap<Element, Record<string, string>>();
const skip = (el: Element | null) => !!el?.closest('script,style,textarea,[contenteditable],[data-no-translate]');

function translateText(node: Text, ja: boolean) {
  const raw = node.nodeValue ?? '';
  if (ja) {
    const key = raw.trim();
    const hit = key && JA[key];
    if (hit && !skip(node.parentElement)) { origText.set(node, raw); node.nodeValue = raw.replace(key, hit); }
  } else if (origText.has(node)) {
    node.nodeValue = origText.get(node)!;
    origText.delete(node);
  }
}

function translateEl(el: Element, ja: boolean) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v == null) continue;
    const saved = origAttr.get(el) ?? {};
    if (ja && JA[v.trim()]) { saved[a] = v; origAttr.set(el, saved); el.setAttribute(a, JA[v.trim()]); }
    else if (!ja && saved[a]) { el.setAttribute(a, saved[a]); delete saved[a]; }
  }
}

function walk(root: Node, ja: boolean) {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text, ja);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  translateEl(root as Element, ja);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateText(n as Text, ja);
    else translateEl(n as Element, ja);
  }
}

/** Translates every page's fixed text into Japanese when 日本語 is selected, and keeps up as pages change. */
export default function PageTranslator() {
  const { lang } = useLang();
  useEffect(() => {
    const ja = lang === 'ja';
    walk(document.body, ja);
    if (!ja) return;
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'characterData') translateText(m.target as Text, true);
        else if (m.type === 'attributes') translateEl(m.target as Element, true);
        else m.addedNodes.forEach((n) => walk(n, true));
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    return () => obs.disconnect();
  }, [lang]);
  return null;
}
