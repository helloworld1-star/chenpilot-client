import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  queueMessage,
  dequeueMessage,
  addPendingMessage,
  removePendingMessage,
  sendMessage,
} from '@/store/slices/chatSlice';
import toast from 'react-hot-toast';


export const useOfflineQueue = () => {
  const dispatch = useAppDispatch();
  const { isOnline, messageQueue } = useAppSelector((state) => state.chat);

  // Process queued messages when coming back online
  useEffect(() => {
    if (isOnline && messageQueue.length > 0) {
      processQueue();
    }
  }, [isOnline]);

  const processQueue = useCallback(async () => {
    const queueCopy = [...messageQueue];

    for (const queuedMsg of queueCopy) {
      try {
        // Mark as pending
        dispatch(addPendingMessage(queuedMsg.id));

        // Send message
        await dispatch(sendMessage(queuedMsg.query)).unwrap();

        // Remove from queue
        dispatch(dequeueMessage(queuedMsg.id));
        dispatch(removePendingMessage(queuedMsg.id));

        toast.success(`Replay Outcome: Success for queued item (${queuedMsg.id})`);
      } catch (error: any) {
        dispatch(removePendingMessage(queuedMsg.id));
        const errorMsg = error instanceof Error ? error.message : String(error);
        toast.error(`Replay Outcome: Failed for queued item (${queuedMsg.id}): ${errorMsg}`);
      }
    }

    if (queueCopy.length > 0) {
      toast.success(`Queue replay completed for ${queueCopy.length} item(s).`);
    }
  }, [messageQueue, dispatch]);

  const queueMessageForSending = useCallback(
    (query: string, category: OperationCategory = 'chat') => {
      if (!isOperationQueueable(query, category)) {
        toast.error('Payment and signing actions cannot be queued offline by default.');
        return null;
      }
      // Duplicate replay protection check
      const existingDuplicate = messageQueue.find(
        (m: { id: string; query: string; timestamp?: string }) => m.query.trim().toLowerCase() === query.trim().toLowerCase()
      );
      if (existingDuplicate) {
        toast.error('Duplicate operation already exists in offline queue.');
        return existingDuplicate.id;
      }

      const msgId = `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dispatch(
        queueMessage({
          id: msgId,
          query,
        })
      );
      toast.success('Operation queued safely for offline replay.');
      return msgId;
    },
    [dispatch, messageQueue]
  );

  return {
    isOnline,
    messageQueue,
    queueMessageForSending,
    processQueue,
    isOperationQueueable,
  };
};
export type OperationCategory = 'chat' | 'payment' | 'signing' | 'general';

export interface ClassifiedOperation {
  id: string;
  query: string;
  category: OperationCategory;
  idempotent: boolean;
  timestamp: string;
}

export const isOperationQueueable = (query: string, category: OperationCategory = 'chat'): boolean => {
  if (category === 'payment' || category === 'signing') {
    return false;
  }
  const lower = query.toLowerCase();
  if (
    lower.includes('pay onchain') ||
    lower.includes('send payment') ||
    lower.includes('sign transaction') ||
    lower.includes('transfer ') ||
    lower.includes('deploy account')
  ) {
    return false;
  }
  return true;
};
