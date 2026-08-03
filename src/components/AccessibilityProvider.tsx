import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';

interface AccessibilityContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function useAnnounce(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    return {
      announce: () => {
        /* no-op outside provider */
      },
    };
  }
  return ctx;
}

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const region = priority === 'assertive' ? assertiveRef.current : politeRef.current;
      if (region) {
        region.textContent = '';
        requestAnimationFrame(() => {
          region.textContent = message;
        });
      }
    },
    []
  );

  useEffect(() => {
    const handler = () => {
      const heading = document.querySelector('h1');
      if (heading) {
        announce(`Page loaded: ${heading.textContent || 'MalikAuth'}`);
      }
    };
    window.addEventListener('load', handler);
    return () => window.removeEventListener('load', handler);
  }, [announce]);

  return (
    <AccessibilityContext.Provider value={{ announce }}>
      <div
        ref={politeRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        ref={assertiveRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
      {children}
    </AccessibilityContext.Provider>
  );
};
