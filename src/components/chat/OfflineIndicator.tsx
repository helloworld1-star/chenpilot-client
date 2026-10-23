'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setOnlineStatus, loadMessageQueue } from '@/store/slices/chatSlice';
import { useSocketConnection } from '@/hooks/useSocket';
import { WifiOff, Wifi, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOnline, messageQueue } = useAppSelector((state) => state.chat);
  const { connectionState } = useSocketConnection();

  useEffect(() => {
    // Load queue on mount
    dispatch(loadMessageQueue());

    // Set up event listeners
    const handleOnline = () => {
      dispatch(setOnlineStatus(true));
    };

    const handleOffline = () => {
      dispatch(setOnlineStatus(false));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  const isEffectivelyOnline = isOnline && connectionState === 'connected';

  if (isEffectivelyOnline && messageQueue.length === 0 && connectionState === 'connected') {
    return null; // Don't show indicator when online and fully connected with no queue
  }

  const getBadgeStyle = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-blue-900/80 border border-blue-700 text-blue-200';
      case 'reconnecting':
        return 'bg-amber-900/80 border border-amber-700 text-amber-200 animate-pulse';
      case 'failed':
        return 'bg-red-900/80 border border-red-700 text-red-200 animate-pulse';
      case 'disconnected':
      case 'unknown':
      default:
        return 'bg-red-900/80 border border-red-700 text-red-200 animate-pulse';
    }
  };

  return (
    <div
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium z-40 transition-all duration-300 ${getBadgeStyle()}`}
    >
      {connectionState === 'connected' && isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-blue-300" />
          <span>
            {messageQueue.length > 0
              ? `Online • ${messageQueue.length} message${messageQueue.length !== 1 ? 's' : ''} queued`
              : 'Connection restored'}
          </span>
        </>
      ) : connectionState === 'reconnecting' ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin text-amber-300" />
          <span>
            Socket reconnecting... {messageQueue.length > 0 ? `• ${messageQueue.length} queued` : ''}
          </span>
        </>
      ) : connectionState === 'failed' ? (
        <>
          <AlertCircle className="h-4 w-4 text-red-300" />
          <span>
            Connection failed • Retrying... {messageQueue.length > 0 ? `• ${messageQueue.length} queued` : ''}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-300" />
          <span>
            {connectionState === 'unknown' ? 'Connecting to socket...' : "You're offline"} • {messageQueue.length} message{messageQueue.length !== 1 ? 's' : ''} queued
          </span>
        </>
      )}
    </div>
  );
};
