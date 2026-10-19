import React from 'react';
import { render, act } from '@testing-library/react';
import { SocketProvider, useSocket } from '../SocketProvider';

// Mock socket.io-client and socketManager
jest.mock('@/services/socketManager', () => {
  let currentConnected = false;
  const listeners: Record<string, Array<(...args: any[]) => void>> = {};
  const mockSocket = {
    get connected() { return currentConnected; },
  };
  const mockManager = {
    connect: jest.fn(() => mockSocket),
    disconnect: jest.fn(() => {
      currentConnected = false;
    }),
    on: jest.fn((event: string, cb: (...args: any[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    }),
    off: jest.fn((event: string, cb?: (...args: any[]) => void) => {
      if (!listeners[event]) return;
      if (cb) {
        listeners[event] = listeners[event].filter(fn => fn !== cb);
      } else {
        delete listeners[event];
      }
    }),
    emit: jest.fn(() => true),
    once: jest.fn(),
  };
  return {
    initializeSocketManager: jest.fn(() => mockManager),
    // helper for tests to trigger socket events
    __triggerEvent: (event: string, ...args: any[]) => {
      if (listeners[event]) {
        listeners[event].forEach(cb => cb(...args));
      }
    },
    __setConnected: (val: boolean) => {
      currentConnected = val;
    },
    __getManager: () => mockManager,
  };
});

const TestConsumer: React.FC<{ onRender?: (state: any) => void }> = ({ onRender }) => {
  const socketState = useSocket();
  if (onRender) onRender(socketState);
  return (
    <div>
      <span data-testid="connection-state">{socketState.connectionState}</span>
      <span data-testid="is-connected">{String(socketState.isConnected)}</span>
    </div>
  );
};

describe('SocketProvider Connection State', () => {
  const originalConfig = { url: 'http://localhost:3000' };

  it('initializes with unknown state before connecting', () => {
    let capturedState: any;
    render(
      <SocketProvider config={originalConfig} autoConnect={false}>
        <TestConsumer onRender={(s) => { capturedState = s; }} />
      </SocketProvider>
    );

    expect(capturedState.connectionState).toBe('unknown');
    expect(capturedState.isConnected).toBe(false);
  });

  it('transitions to connected and disconnected states correctly', () => {
    const socketManagerMock = require('@/services/socketManager');
    let capturedState: any;

    render(
      <SocketProvider config={originalConfig} autoConnect={true}>
        <TestConsumer onRender={(s) => { capturedState = s; }} />
      </SocketProvider>
    );

    // Trigger connect event
    act(() => {
      socketManagerMock.__setConnected(true);
      socketManagerMock.__triggerEvent('connect');
    });

    expect(capturedState.connectionState).toBe('connected');
    expect(capturedState.isConnected).toBe(true);

    // Trigger disconnect event
    act(() => {
      socketManagerMock.__setConnected(false);
      socketManagerMock.__triggerEvent('disconnect');
    });

    expect(capturedState.connectionState).toBe('disconnected');
    expect(capturedState.isConnected).toBe(false);
  });

  it('transitions to reconnecting and failed states correctly', () => {
    const socketManagerMock = require('@/services/socketManager');
    let capturedState: any;

    render(
      <SocketProvider config={originalConfig} autoConnect={false}>
        <TestConsumer onRender={(s) => { capturedState = s; }} />
      </SocketProvider>
    );

    expect(capturedState.connectionState).toBe('unknown');

    // Trigger reconnect attempt
    act(() => {
      socketManagerMock.__triggerEvent('reconnect_attempt');
    });

    expect(capturedState.connectionState).toBe('reconnecting');

    // Trigger connect error / failure
    act(() => {
      socketManagerMock.__triggerEvent('connect_error');
    });

    expect(capturedState.connectionState).toBe('failed');
    expect(capturedState.isConnected).toBe(false);
  });
});
