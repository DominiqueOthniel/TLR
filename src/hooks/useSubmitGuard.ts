import { useCallback, useRef, useState } from 'react';

/**
 * Empêche les doubles soumissions (double-clic pendant une requête lente).
 * La ref bloque immédiatement avant le re-render ; l’état permet de désactiver
 * le bouton et d’afficher un indicateur de chargement.
 */
export function useSubmitGuard() {
  const lockRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const withGuard = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (lockRef.current) return undefined;
    lockRef.current = true;
    setIsSubmitting(true);
    try {
      return await fn();
    } finally {
      lockRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, withGuard };
}
