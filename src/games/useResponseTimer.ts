import { useEffect, useRef } from 'react';

/** Chronomètre démarré à l'affichage de la question (composant remonté à chaque question). */
export function useResponseTimer(): () => number {
  const start = useRef(0);
  useEffect(() => {
    start.current = performance.now();
  }, []);
  return () => performance.now() - start.current;
}
