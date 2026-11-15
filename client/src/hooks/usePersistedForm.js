'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Unsaved form drafts in sessionStorage: they survive a refresh in this tab and die with it.
// Keys look like "draft:<userId|guest>:<form>[:<id>]". Never store passwords, tokens, OTP codes
// or card data here. Every storage access is guarded: blocked storage, SSR and a full quota
// just mean "no draft".
const PREFIX = 'draft:';
const SAVE_DELAY_MS = 300;

const listeners = new Set();
const subscribe = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};
const notify = () => listeners.forEach((callback) => callback());
const subscribeNoop = () => () => {};

function store() {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function readDraft(key) {
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeDraft(key, raw) {
  try {
    store()?.setItem(key, raw);
  } catch {
    // Quota exceeded or storage blocked: keep nothing rather than a stale copy.
    try {
      store()?.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  }
  notify();
}

function removeDraft(key) {
  try {
    store()?.removeItem(key);
  } catch {
    /* storage unavailable */
  }
  notify();
}

export function draftKey(user, ...parts) {
  const owner = user?.id ?? user?._id ?? 'guest';
  return `${PREFIX}${owner}:${parts.join(':')}`;
}

// Called on logout: no draft of one account may show up for the next one.
export function clearAllDrafts() {
  const storage = store();
  if (!storage) return;
  try {
    const keys = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  } catch {
    /* storage unavailable */
  }
  notify();
}

function parse(raw) {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Keeps `value` (a JSON-serialisable snapshot of the form) in sessionStorage under `key`.
 *
 * - The first render matches the server (no draft). The stored draft is read through
 *   useSyncExternalStore and applied once, right after hydration, by calling `onRestore(draft)`
 *   during render (a guarded update, no effect involved).
 * - `autoRestore: false` (edit forms): nothing is applied; `pending` is true while a draft that
 *   differs from `baseline` waits for restore() / discard(). Editing the form counts as a choice.
 * - A value equal to `baseline` removes the draft. Writes are debounced by 300ms and flushed when
 *   the page is hidden (refresh, tab close), so the last keystrokes are not lost.
 * - clear(): after a successful submit or a cancel.
 */
export function usePersistedForm({ key, value, baseline, onRestore, autoRestore = true, enabled = true }) {
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const active = hydrated && enabled && Boolean(key);
  const raw = useSyncExternalStore(subscribe, () => (active ? readDraft(key) : null), () => null);
  const serialized = JSON.stringify(value);
  const base = JSON.stringify(baseline);
  const [resolved, setResolved] = useState(false);
  // Set by clear(): this exact value is not written back (a late flush after a successful submit).
  const [clearedValue, setClearedValue] = useState(null);

  if (active && !resolved) {
    if (autoRestore) {
      setResolved(true);
      const draft = parse(raw);
      if (draft) onRestore(draft);
    } else if (raw === null || raw === base || serialized !== base) {
      // Nothing to offer, the draft equals the server data, or the user already started editing.
      setResolved(true);
    }
  }

  const pending = !autoRestore && active && !resolved && raw !== null;
  const canSave = active && resolved && clearedValue !== serialized;

  const latest = useRef({ key, serialized, base, canSave });
  const previousKey = useRef(null);
  useEffect(() => {
    latest.current = { key, serialized, base, canSave };
  });

  useEffect(() => {
    if (!canSave) return undefined;
    // Guest -> account after login: the draft moves to the new key.
    if (previousKey.current && previousKey.current !== key) removeDraft(previousKey.current);
    previousKey.current = key;
    const timer = setTimeout(() => {
      if (serialized === base) {
        if (readDraft(key) !== null) removeDraft(key);
      } else if (readDraft(key) !== serialized) {
        writeDraft(key, serialized);
      }
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [canSave, key, serialized, base]);

  // Refresh / tab close / bfcache: write what the debounce has not written yet.
  useEffect(() => {
    function flush() {
      const current = latest.current;
      if (!current.canSave) return;
      if (current.serialized === current.base) removeDraft(current.key);
      else writeDraft(current.key, current.serialized);
    }
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  const clear = useCallback(() => {
    latest.current = { ...latest.current, canSave: false }; // no flush before the next render
    setClearedValue(latest.current.serialized);
    if (latest.current.key) removeDraft(latest.current.key);
  }, []);

  const restore = useCallback(() => {
    const draft = parse(raw);
    if (draft) onRestore(draft);
    setResolved(true);
  }, [raw, onRestore]);

  const discard = useCallback(() => {
    if (key) removeDraft(key);
    setResolved(true);
  }, [key]);

  return { pending, restore, discard, clear };
}
