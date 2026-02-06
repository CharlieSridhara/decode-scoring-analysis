function KeyboardEntryToast({ visible, keyEntry }) {
  if (!visible) return null;

  const { total, scored, overflow, overflowMode } = keyEntry;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:top-4 sm:right-4 z-50 w-[min(22rem,calc(100vw-1.5rem))]">
      <div className="card shadow p-4 w-full">
        <div className="text-sm text-brand-text mb-1">Quick Entry</div>

        <div className="text-lg font-semibold mb-2">
          Shot {total ?? "_"} balls; how many scored?
        </div>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand-text text-sm">Scored:</span>
          <span className="text-2xl font-mono">{scored ?? "_"}</span>
          {total != null && (
            <span className="text-sm text-brand-text">(0–{total})</span>
          )}
        </div>

        {scored != null && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand-text text-sm">
              Overflow:
            </span>
            <span className="text-2xl font-mono">
              {overflowMode ? overflow : overflow ?? 0}
            </span>
            <span className="text-sm text-brand-text">
              (press O)
            </span>
          </div>
        )}

        <div className="text-xs text-brand-text mt-2">
          Type numbers → Enter to confirm · O for overflow · Esc to cancel
        </div>
      </div>
    </div>
  );
}

export default KeyboardEntryToast;
