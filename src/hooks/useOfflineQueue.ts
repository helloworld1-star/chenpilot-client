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

        toast.success('Queued message sent');
      } catch (error: any) {
        dispatch(removePendingMessage(queuedMsg.id));
        const errorMsg = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to send queued message: ${errorMsg}`);
      }
    }

    if (queueCopy.length > 0) {
      toast.success(`All ${queueCopy.length} queued message${queueCopy.length !== 1 ? 's' : ''} sent!`);
    }
  }, [messageQueue, dispatch]);

  const isQueueableOperation = useCallback((query: string): boolean => {
    const lower = query.toLowerCase();
    const forbiddenKeywords = ['pay', 'send', 'sign', 'transfer', 'fund', 'withdraw', 'stake', 'deploy'];
    for (const keyword of forbiddenKeywords) {
      if (lower.includes(keyword)) {
        return false;
      }
    }
    return true;
  }, []);

  const queueMessageForSending = useCallback(
    (query: string, forceExplicit = false) => {
      if (!forceExplicit && !isQueueableOperation(query)) {
        toast.error('Payment and signing actions are excluded from offline queueing by default.');
        return null;
      }
      const msgId = `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dispatch(
        queueMessage({
          id: msgId,
          query,
        })
      );
      toast.success('Operation queued for replay when online.');
      return msgId;
    },
    [dispatch, isQueueableOperation]
  );

  return {
    isOnline,
    messageQueue,
    queueMessageForSending,
    processQueue,
    isQueueableOperation,
  };
};
