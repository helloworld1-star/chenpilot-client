'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setOnlineStatus, loadMessageQueue } from '@/store/slices/chatSlice';
import { WifiOff, Wifi, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { useSocket } from '@/components/providers/SocketProvider';

export const OfflineIndicator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOnline, messageQueue } = useAppSelector((state) => state.chat);
  const { connectionState } = useSocket();

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

  const isFullyConnected = isOnline && connectionState === 'connected';
  const isReconnecting = connectionState === 'reconnecting';
  const isFailed = connectionState === 'failed';

  if (isFullyConnected && messageQueue.length === 0) {
    return null; // Don't show indicator when fully online and no queue
  }

  const getIndicatorStyle = () => {
    if (isFailed) return 'bg-red-900/80 border border-red-700 text-red-200 animate-pulse';
    if (isReconnecting) return 'bg-yellow-900/80 border border-yellow-700 text-yellow-200 animate-pulse';
    if (isOnline) return 'bg-blue-900/80 border border-blue-700 text-blue-200';
    return 'bg-red-900/80 border border-red-700 text-red-200 animate-pulse';
  };

  return (
    <div
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium z-40 transition-all duration-300 ${getIndicatorStyle()}`}
    >
      {isFailed ? (
        <>
          <XCircle className="h-4 w-4" />
          <span>Connection failed • {messageQueue.length} message{messageQueue.length !== 1 ? 's' : ''} queued</span>
        </>
      ) : isReconnecting ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Reconnecting socket... • {messageQueue.length} message{messageQueue.length !== 1 ? 's' : ''} queued</span>
        </>
      ) : isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>
            {messageQueue.length > 0
              ? `Online • ${messageQueue.length} message${messageQueue.length !== 1 ? 's' : ''} queued`
              : 'Connection restored'}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>
            You're offline • {messageQueue.length} message{messageQueue.length !== 1 ? 's' : ''} queued
          </span>
        </>
      )}
    </div>
  );
};
