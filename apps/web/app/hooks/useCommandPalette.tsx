'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';

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

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, toggle, close]);

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle, registerAction, unregisterAction }}>
      {children}
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
    </CommandPaletteContext.Provider>
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
  const [query, setQuery] = useState('');
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
    listRef.current?.querySelectorAll('[data-index]').item(selectedIndex)?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const action = filtered[selectedIndex];
      if (action) onPerform(action);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let currentIndex = -1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-subtle)' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ابحث عن أمر أو إجراء..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 16,
              outline: 'none',
            }}
          />
        </div>

        <div ref={listRef} style={{ maxHeight: 320, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
              لا توجد نتائج
            </div>
          ) : (
            Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category}>
                <div
                  style={{
                    padding: '6px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-base)',
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
                        width: '100%',
                        textAlign: 'right',
                        padding: '10px 16px',
                        background: idx === selectedIndex ? 'var(--color-action)15' : 'transparent',
                        border: 'none',
                        borderInlineStart: idx === selectedIndex ? `2px solid var(--color-action)` : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{action.title}</div>
                      {action.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{action.description}</div>
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
            padding: '8px 16px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex',
            gap: 'var(--space-md)',
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