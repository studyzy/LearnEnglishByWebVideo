/**
 * Message Bridge
 * 
 * This module provides type-safe message passing between:
 * - Content Script ↔ Service Worker
 * - Service Worker ↔ Content Script
 * 
 * It wraps chrome.runtime.sendMessage with proper typing and error handling.
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import type { Message } from '../types/index';
import { MessageType } from '../types/index';

/**
 * Generate a unique request ID for message tracking
 * 
 * @returns Unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Send message from Content Script to Service Worker (Background)
 * 
 * @param message - Message to send
 * @param timeout - Optional timeout in milliseconds (default: 10000ms)
 * @returns Promise resolving to response message
 */
export async function sendToBackground<T extends Message = Message>(
  message: T,
  timeout: number = 60000,
): Promise<Message> {
  // Add request ID if not present
  const messageWithId = {
    ...message,
    requestId: message.requestId || generateRequestId(),
  };

  return new Promise((resolve, reject) => {
    // Set timeout
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Message to background timed out after ${timeout}ms (type: ${message.type})`,
        ),
      );
    }, timeout);

    try {
      browser.runtime
        .sendMessage(messageWithId)
        .then((response: Message) => {
          clearTimeout(timeoutId);

          if (!response) {
            reject(new Error('No response received from background'));
            return;
          }

          // Check for error response
          if (response.type === MessageType.ERROR) {
            reject(new Error((response as any).error || 'Unknown error from background'));
            return;
          }

          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

/**
 * Send message from Service Worker to Content Script in a specific tab
 * 
 * @param tabId - Tab ID to send message to
 * @param message - Message to send
 * @param timeout - Optional timeout in milliseconds (default: 10000ms)
 * @returns Promise resolving to response message
 */
export async function sendToTab<T extends Message = Message>(
  tabId: number,
  message: T,
  timeout: number = 10000,
): Promise<Message> {
  // Add request ID if not present
  const messageWithId = {
    ...message,
    requestId: message.requestId || generateRequestId(),
  };

  return new Promise((resolve, reject) => {
    // Set timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Message to tab ${tabId} timed out after ${timeout}ms (type: ${message.type})`));
    }, timeout);

    try {
      browser.tabs
        .sendMessage(tabId, messageWithId)
        .then((response: Message) => {
          clearTimeout(timeoutId);

          if (!response) {
            reject(new Error(`No response received from tab ${tabId}`));
            return;
          }

          // Check for error response
          if (response.type === MessageType.ERROR) {
            reject(new Error((response as any).error || 'Unknown error from tab'));
            return;
          }

          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

/**
 * Send message to all active YouTube tabs
 * Useful for broadcasting configuration updates
 * 
 * @param message - Message to broadcast
 * @returns Promise resolving to array of responses (one per tab)
 */
export async function broadcastToYouTubeTabs<T extends Message = Message>(
  message: T,
): Promise<Array<{ tabId: number; response?: Message; error?: Error }>> {
  try {
    // Query all YouTube watch tabs
    const tabs = await browser.tabs.query({
      url: '*://www.youtube.com/watch*',
    });

    if (tabs.length === 0) {
      console.log('No YouTube tabs found for broadcast');
      return [];
    }

    // Send message to all tabs concurrently
    const results = await Promise.allSettled(
      tabs.map(async (tab) => {
        if (!tab.id) {
          throw new Error('Tab has no ID');
        }

        const response = await sendToTab(tab.id, message);
        return { tabId: tab.id, response };
      }),
    );

    // Convert results to array with error handling
    return results.map((result, index) => {
      const tabId = tabs[index]?.id || -1;

      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          tabId,
          error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
        };
      }
    });
  } catch (error) {
    console.error('Failed to broadcast to YouTube tabs:', error);
    return [];
  }
}

/**
 * Message handler type for registering listeners
 */
export type MessageHandler<T extends Message = Message> = (
  message: T,
  sender: chrome.runtime.MessageSender,
) => Promise<Message> | Message;

/**
 * Register a message handler in Service Worker or Content Script
 * Provides automatic error handling and response wrapping
 * 
 * @param messageType - Type of message to handle (null for all types)
 * @param handler - Handler function
 */
export function registerMessageHandler<T extends Message = Message>(
  messageType: MessageType | null,
  handler: MessageHandler<T>,
): void {
  browser.runtime.onMessage.addListener(
    (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: Message) => void) => {
      // Filter by message type if specified
      if (messageType !== null && message.type !== messageType) {
        return false; // Not handling this message
      }

      // Execute handler asynchronously
      Promise.resolve(handler(message as T, sender))
        .then((response) => {
          sendResponse(response);
        })
        .catch((error) => {
          console.error(`Error handling message type ${message.type}:`, error);
          sendResponse({
            type: MessageType.ERROR,
            error: error instanceof Error ? error.message : String(error),
            requestId: message.requestId,
          });
        });

      // Return true to indicate async response
      return true;
    },
  );
}

/**
 * Register multiple message handlers at once
 * 
 * @param handlers - Map of message type to handler function
 */
export function registerMessageHandlers(handlers: Map<MessageType, MessageHandler>): void {
  for (const [messageType, handler] of handlers.entries()) {
    registerMessageHandler(messageType, handler);
  }
}

/**
 * Create an error message response
 * 
 * @param error - Error message or Error object
 * @param requestId - Optional request ID to match with original request
 * @returns Error message
 */
export function createErrorMessage(error: string | Error, requestId?: string): Message {
  return {
    type: MessageType.ERROR,
    error: error instanceof Error ? error.message : error,
    requestId,
  };
}

/**
 * Check if a message is an error message
 * 
 * @param message - Message to check
 * @returns True if message is an error
 */
export function isErrorMessage(message: Message): boolean {
  return message.type === MessageType.ERROR;
}

/**
 * Wait for background service worker to be ready
 * Useful during extension startup
 * 
 * @param timeout - Maximum time to wait in milliseconds (default: 5000ms)
 * @returns Promise that resolves when background is ready
 */
export async function waitForBackgroundReady(timeout: number = 5000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Try to send a simple ping message
      await browser.runtime.sendMessage({ type: 'PING' });
      return; // Success
    } catch (error) {
      // Background not ready yet, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error('Background service worker did not become ready in time');
}

/**
 * Log message for debugging (only in development)
 * 
 * @param direction - Message direction ('send' or 'receive')
 * @param message - Message being sent/received
 * @param context - Additional context
 */
export function logMessage(
  direction: 'send' | 'receive',
  message: Message,
  context?: string,
): void {
  if (import.meta.env.DEV) {
    const prefix = direction === 'send' ? '→' : '←';
    const contextStr = context ? ` [${context}]` : '';
    console.log(`${prefix} Message${contextStr}:`, message.type, message);
  }
}
