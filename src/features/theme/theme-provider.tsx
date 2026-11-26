import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = Exclude<ThemePreference, 'system'>;
const key = 'hu-theme';
const query = '(prefers-color-scheme: dark)';

const ThemeContext = createContext<{
  preference: ThemePreference;
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
} | null>(null);

function readPreference(): ThemePreference {
  try {
    const saved = window.localStorage.getItem(key);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // System appearance is still available when storage is blocked.
  }
  return 'system';
}

function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(query).matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setCurrentPreference] = useState(readPreference);
  const system = useSyncExternalStore(subscribe, getSystemTheme);
  const theme = preference === 'system' ? system : preference;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function setPreference(next: ThemePreference) {
    setCurrentPreference(next);
    try {
      window.localStorage.setItem(key, next);
    } catch {
      // Continue with the in-memory preference.
    }
  }

  return (
    <ThemeContext value={{ preference, theme, setPreference }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeProvider is required.');
  return context;
}
