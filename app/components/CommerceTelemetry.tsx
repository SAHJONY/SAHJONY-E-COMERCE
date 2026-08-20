'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getSessionKey() {
  const key = 'sahjony-commerce-session';
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    sessionStorage.setItem(key, value);
  }
  return value;
}

export default function CommerceTelemetry() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/owner')) return;
    const sessionKey = getSessionKey();
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionKey, eventName: 'page_view', path: pathname }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
