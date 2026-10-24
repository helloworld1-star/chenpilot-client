'use client';

import { useState, useEffect, useCallback } from 'react';

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp?: number;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineAction[]>([]);

  const isSupportedAction = useCallback((type: string): boolean => {
    const excluded = ['send_payment', 'sign_transaction', 'transfer', 'sign'];
    return !excluded.includes(type);
  }, []);

  const enqueueAction = useCallback((action: OfflineAction) => {
    if (!isSupportedAction(action.type)) {
      return false;
    }
    setQueue((prev) => {
      if (prev.some((item) => item.id === action.id)) {
        return prev;
      }
      return [...prev, { ...action, timestamp: Date.now() }];
    });
    return true;
  }, [isSupportedAction]);

  return {
    queue,
    enqueueAction,
    isSupportedAction,
  };
}
