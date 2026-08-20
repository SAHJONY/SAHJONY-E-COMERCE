'use client';

import { useEffect } from 'react';

const BAG_KEY = 'sahjony-bag-v1';

export default function ClearBag() {
  useEffect(() => {
    localStorage.removeItem(BAG_KEY);
    window.dispatchEvent(new Event('sahjony:bag-updated'));
  }, []);
  return null;
}
