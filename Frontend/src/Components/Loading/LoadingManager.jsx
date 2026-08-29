import { createContext, useContext, useMemo, useRef, useState } from "react";
import Loading from "./Loading";

const LoadingContext = createContext(null);

export const LoadingManagerProvider = ({ components, children }) => {
  const targets = useMemo(() => Array.from(new Set(components)), [components]);
  const loadedRef = useRef(new Set());
  const [, force] = useState(0);
  const markLoaded = (name) => {
    if (!name) return;
    if (targets.includes(name)) {
      const before = loadedRef.current.size;
      loadedRef.current.add(name);
      if (loadedRef.current.size !== before) force((x) => x + 1);
    }
  };
  const isAllLoaded = loadedRef.current.size >= targets.length;
  const value = useMemo(() => ({ markLoaded, isAllLoaded }), [isAllLoaded]);
  return (
    <LoadingContext.Provider value={value}>
      {!isAllLoaded && <Loading />}
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingManager = () => {
  const ctx = useContext(LoadingContext);
  return ctx || { markLoaded: () => {}, isAllLoaded: true };
};
