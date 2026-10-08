"use client";

import { useEffect, useRef, useState } from "react";
import { getRemainingSeconds } from "./exam";

/**
 * Server-anchored countdown. `expiresAtISO` comes from the API
 * (attempt start + timer minutes, computed server-side). The hook only
 * displays the derived remainder and fires `onExpire` once at zero —
 * expiry itself is enforced by the server on submit.
 */
export function useCountdown(
  expiresAtISO: string | null,
  onExpire: () => void,
): number | null {
  const [remaining, setRemaining] = useState<number | null>(() =>
    expiresAtISO === null ? null : getRemainingSeconds(expiresAtISO),
  );
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const firedRef = useRef(false);

  useEffect(() => {
    if (expiresAtISO === null) {
      setRemaining(null);
      return;
    }
    firedRef.current = false;
    setRemaining(getRemainingSeconds(expiresAtISO));

    const id = setInterval(() => {
      const left = getRemainingSeconds(expiresAtISO);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(id);
        onExpireRef.current();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [expiresAtISO]);

  return remaining;
}
