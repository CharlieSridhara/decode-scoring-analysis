import { useEffect, useRef, useState } from "react";

export default function useKeyboardCycleEntry({
  enabled,
  blocked,
  elapsedTime,
  mode,
  phase,
  onAddCycle,
  onAddGate,
}) {
  const [keyEntry, setKeyEntry] = useState({
    total: null,
    scored: null,
    overflow: 0,
    overflowMode: false,
  });

  const [keyEntryVisible, setKeyEntryVisible] = useState(false);
  const [keyEntryExpiresAt, setKeyEntryExpiresAt] = useState(null);

  const expireTimeoutRef = useRef(null);

  // =====================
  // Helpers
  // =====================
  const resetEntry = () => {
    setKeyEntry({
      total: null,
      scored: null,
      overflow: 0,
      overflowMode: false,
    });
    setKeyEntryVisible(false);
    setKeyEntryExpiresAt(null);
  };

  // =====================
  // Expiration timer
  // =====================
  useEffect(() => {
    if (expireTimeoutRef.current) {
      clearTimeout(expireTimeoutRef.current);
      expireTimeoutRef.current = null;
    }

    if (keyEntryVisible && keyEntryExpiresAt) {
      const ms = Math.max(0, keyEntryExpiresAt - Date.now());
      expireTimeoutRef.current = setTimeout(() => {
        resetEntry();
      }, ms);
    }

    return () => {
      if (expireTimeoutRef.current) {
        clearTimeout(expireTimeoutRef.current);
        expireTimeoutRef.current = null;
      }
    };
  }, [keyEntryVisible, keyEntryExpiresAt]);

  // =====================
  // Keyboard handling
  // =====================
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!enabled || blocked) return;

      const ae = document.activeElement;
      if (
        ae &&
        (ae.tagName === "INPUT" ||
          ae.tagName === "TEXTAREA" ||
          ae.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const now = Date.now();

      // ---------------------
      // No active entry
      // ---------------------
      if (!keyEntryVisible) {
        if (e.key?.toLowerCase() === "g") {
          onAddGate?.({
            timestamp: elapsedTime,
            phase: mode === "match" ? phase : undefined,
          });
          e.preventDefault();
          return;
        }

        if (e.key >= "1" && e.key <= "3") {
          setKeyEntry({
            total: parseInt(e.key, 10),
            scored: null,
            overflow: 0,
            overflowMode: false,
          });
          setKeyEntryVisible(true);
          setKeyEntryExpiresAt(now + 5000);
          e.preventDefault();
        }
        return;
      }

      // ---------------------
      // Cancel
      // ---------------------
      if (e.key === "Escape") {
        resetEntry();
        e.preventDefault();
        return;
      }

      // ---------------------
      // Commit
      // ---------------------
      if (e.key === "Enter") {
        if (keyEntry.total != null && keyEntry.scored != null) {
          onAddCycle?.({
            total: keyEntry.total,
            scored: keyEntry.scored,
            overflow: keyEntry.overflow, // ALWAYS numeric
            timestamp: elapsedTime,
            phase: mode === "match" ? phase : undefined,
          });
          resetEntry();
        }
        e.preventDefault();
        return;
      }

      // ---------------------
      // Enter overflow mode
      // ---------------------
      if (
        e.key?.toLowerCase() === "o" &&
        keyEntry.scored != null
      ) {
        setKeyEntry((prev) => ({
          ...prev,
          overflowMode: true,
          overflow: 0,
        }));
        setKeyEntryExpiresAt(now + 5000);
        e.preventDefault();
        return;
      }

      // ---------------------
      // Numeric input
      // ---------------------
      if (e.key >= "0" && e.key <= "9") {
        const val = parseInt(e.key, 10);

        // Overflow input
        if (keyEntry.overflowMode) {
          if (val >= 0 && val <= keyEntry.scored) {
            setKeyEntry((prev) => ({
              ...prev,
              overflow: val,
            }));
            setKeyEntryExpiresAt(now + 5000);
          }
          e.preventDefault();
          return;
        }

        // Normal scored input
        if (keyEntry.total != null && val <= keyEntry.total) {
          setKeyEntry((prev) => ({
            ...prev,
            scored: val,
          }));
          setKeyEntryExpiresAt(now + 5000);
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    blocked,
    keyEntryVisible,
    keyEntry,
    elapsedTime,
    mode,
    phase,
    onAddCycle,
    onAddGate,
  ]);

  return {
    keyEntry,
    keyEntryVisible,
    clearKeyEntry: resetEntry,
  };
}
