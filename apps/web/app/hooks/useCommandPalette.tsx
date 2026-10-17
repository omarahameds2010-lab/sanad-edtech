"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";

export interface CommandAction {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon?: string;
  perform: () => void;
  keywords?: string[];
}

interface CommandPaletteContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  registerAction: (action: CommandAction) => void;
  unregisterAction: (id: string) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  registerAction: () => {},
  unregisterAction: () => {},
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [actions, setActions] = useState<CommandAction[]>([]);
  const actionsRef = useRef<CommandAction[]>([]);

  actionsRef.current = actions;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const registerAction = useCallback((action: CommandAction) => {
    setActions((prev) => {
      if (prev.some((a) => a.id === action.id)) return prev;
      return [...prev, action];
    });
  }, []);

  const unregisterAction = useCallback((id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, toggle, close]);

  // Duplicate @types/react copies in this workspace break the Provider JSX
  // type; the cast keeps the real runtime component unchanged.
  const PaletteProvider = CommandPaletteContext.Provider as any;

  return (
    <PaletteProvider
      value={{ isOpen, open, close, toggle, registerAction, unregisterAction }}
    >
      {children as any}
      {isOpen && (
        <CommandPaletteUI
          actions={actions}
          onClose={close}
          onPerform={(action) => {
            action.perform();
            close();
          }}
        />
      )}
    </PaletteProvider>
  );
}

function CommandPaletteUI({
  actions,
  onClose,
  onPerform,
}: {
  actions: CommandAction[];
  onClose: () => void;
  onPerform: (action: CommandAction) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.keywords?.some((k) => k.toLowerCase().includes(q)),
    );
  }, [actions, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandAction[]>();
    filtered.forEach((a) => {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    });
    return map;
  }, [filtered]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    listRef.current
      ?.querySelectorAll("[data-index]")
      .item(selectedIndex)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const action = filtered[selectedIndex];
      if (action) onPerform(action);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let currentIndex = -1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6, 8, 10, 0.68)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "rgba(20, 23, 28, 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 24,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 32px 80px -24px rgba(0, 0, 0, 0.8)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "var(--space-md)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ابحث عن أمر أو إجراء..."
            className="cp-input"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: "#F4F4F6",
              fontSize: 16,
              outline: "none",
            }}
          />
        </div>

        <div ref={listRef} style={{ maxHeight: 320, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "var(--space-lg)",
                textAlign: "center",
                color: "rgba(244, 244, 246, 0.5)",
              }}
            >
              لا توجد نتائج
            </div>
          ) : (
            Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category}>
                <div
                  style={{
                    padding: "6px 16px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(244, 244, 246, 0.45)",
                    background: "rgba(255, 255, 255, 0.03)",
                  }}
                >
                  {category}
                </div>
                {items.map((action) => {
                  currentIndex++;
                  const idx = currentIndex;
                  return (
                    <button
                      key={action.id}
                      data-index={idx}
                      onClick={() => onPerform(action)}
                      style={{
                        width: "100%",
                        textAlign: "start",
                        padding: "10px 16px",
                        background:
                          idx === selectedIndex
                            ? "rgba(4, 120, 87, 0.15)"
                            : "transparent",
                        border: "none",
                        borderInlineStart:
                          idx === selectedIndex
                            ? `2px solid var(--color-action)`
                            : "2px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 500,
                          color:
                            idx === selectedIndex
                              ? "#FFFFFF"
                              : "rgba(244, 244, 246, 0.85)",
                        }}
                      >
                        {action.title}
                      </div>
                      {action.description && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "rgba(244, 244, 246, 0.5)",
                          }}
                        >
                          {action.description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: 11,
            color: "rgba(244, 244, 246, 0.45)",
            display: "flex",
            gap: "var(--space-md)",
          }}
        >
          <span>↑↓ للتنقل</span>
          <span>↵ لتنفيذ</span>
          <span>Esc للإغلاق</span>
        </div>
      </div>
    </div>
  );
}
