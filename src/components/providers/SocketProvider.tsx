'use client';

import React, { createContext, useContext, useEffect, useCallback, useRef, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { SocketManager, SocketConfig, initializeSocketManager } from '@/services/socketManager';
import { SocketConnectionState } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  socketManager: SocketManager | null;
  isConnected: boolean;
  connectionState: SocketConnectionState;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: unknown) => boolean;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback?: (...args: unknown[]) => void) => void;
  once: (event: string, callback: (...args: unknown[]) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
  config: SocketConfig;
  configKey?: string;
  autoConnect?: boolean;
}

export function SocketProvider({ children, config, configKey, autoConnect = true }: SocketProviderProps) {
  const [socketManager, setSocketManager] = useState<SocketManager | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<SocketConnectionState>('unknown');
  const isConnected = connectionState === 'connected';

  const handleConnect = useRef(() => setConnectionState('connected'));
  const handleDisconnect = useRef(() => setConnectionState('disconnected'));
  const handleConnectError = useRef(() => setConnectionState('failed'));
  const handleReconnectAttempt = useRef(() => setConnectionState('reconnecting'));

  const registerStateHandlers = useCallback((manager: SocketManager) => {
    manager.off('connect', handleConnect.current);
    manager.off('disconnect', handleDisconnect.current);
    manager.off('connect_error', handleConnectError.current);
    manager.off('reconnect_attempt', handleReconnectAttempt.current);

    manager.on('connect', handleConnect.current);
    manager.on('disconnect', handleDisconnect.current);
    manager.on('connect_error', handleConnectError.current);
    manager.on('reconnect_attempt', handleReconnectAttempt.current);
  }, []);

  useEffect(() => {
    const manager = initializeSocketManager(config);
    setSocketManager(manager);
    setConnectionState('disconnected');

    if (autoConnect) {
      setConnectionState('reconnecting');
      const socketInstance = manager.connect();
      setSocket(socketInstance);
      setConnectionState(socketInstance.connected ? 'connected' : 'disconnected');
      registerStateHandlers(manager);
    }

    return () => {
      manager.disconnect();
      setConnectionState('disconnected');
    };
  }, [config, configKey, autoConnect, registerStateHandlers]);

  const connect = useCallback(() => {
    if (socketManager) {
      setConnectionState('reconnecting');
      const socketInstance = socketManager.connect();
      setSocket(socketInstance);
      setConnectionState(socketInstance.connected ? 'connected' : 'disconnected');
      registerStateHandlers(socketManager);
    }
  }, [socketManager, registerStateHandlers]);

  const disconnect = () => {
    if (socketManager) {
      socketManager.disconnect();
      setSocket(null);
      setConnectionState('disconnected');
    }
  };

  const emit = (event: string, data?: unknown): boolean => {
    return socketManager?.emit(event, data) ?? false;
  };

  const on = (event: string, callback: (...args: unknown[]) => void) => {
    socketManager?.on(event, callback);
  };

  const off = (event: string, callback?: (...args: unknown[]) => void) => {
    socketManager?.off(event, callback);
  };

  const once = (event: string, callback: (...args: unknown[]) => void) => {
    socketManager?.once(event, callback);
  };

  const value: SocketContextType = {
    socket,
    socketManager,
    isConnected,
    connectionState,
    connect,
    disconnect,
    emit,
    on,
    off,
    once,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
