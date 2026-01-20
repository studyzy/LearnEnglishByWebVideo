/**
 * Message Bridge Unit Tests
 * 
 * Tests for type-safe message passing between Content Script and Service Worker
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendToBackground,
  sendToTab,
  registerMessageHandler,
  createErrorMessage,
  isErrorMessage,
} from '../../src/lib/message-bridge';
import { MessageType } from '../../src/types/index';
import type { Message, GetUserProfileMessage } from '../../src/types/index';

describe('Message Bridge - Send to Background', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send message to background and receive response', async () => {
    const mockResponse: Message = {
      type: MessageType.USER_PROFILE_RESPONSE,
      profile: {
        englishLevel: 'intermediate',
        llmProvider: 'openai',
        llmApiKey: 'test-key',
        masteredWords: [],
        focusWords: [],
        subtitleFontSize: 16,
        subtitleFontColor: '#ffffff',
        subtitleBackgroundColor: 'rgba(0,0,0,0.8)',
        translationColor: '#ffeb3b',
        isEnabled: true,
        showOnboardingGuide: true,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      },
    };

    (browser.runtime.sendMessage as any).mockResolvedValue(mockResponse);

    const message: GetUserProfileMessage = {
      type: MessageType.GET_USER_PROFILE,
    };

    const response = await sendToBackground(message);

    expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MessageType.GET_USER_PROFILE,
        requestId: expect.any(String),
      }),
    );

    expect(response).toEqual(mockResponse);
  });

  it('should add request ID if not present', async () => {
    (browser.runtime.sendMessage as any).mockResolvedValue({
      type: MessageType.USER_PROFILE_RESPONSE,
    });

    const message: Message = {
      type: MessageType.GET_USER_PROFILE,
    };

    await sendToBackground(message);

    const sentMessage = (browser.runtime.sendMessage as any).mock.calls[0][0];
    expect(sentMessage.requestId).toBeDefined();
    expect(typeof sentMessage.requestId).toBe('string');
  });

  it('should preserve existing request ID', async () => {
    (browser.runtime.sendMessage as any).mockResolvedValue({
      type: MessageType.USER_PROFILE_RESPONSE,
    });

    const message: Message = {
      type: MessageType.GET_USER_PROFILE,
      requestId: 'custom-id-123',
    };

    await sendToBackground(message);

    const sentMessage = (browser.runtime.sendMessage as any).mock.calls[0][0];
    expect(sentMessage.requestId).toBe('custom-id-123');
  });

  it('should reject on timeout', async () => {
    // Mock sendMessage to never resolve
    (browser.runtime.sendMessage as any).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const message: Message = {
      type: MessageType.GET_USER_PROFILE,
    };

    await expect(sendToBackground(message, 100)).rejects.toThrow(/timed out/);
  });

  it('should reject when receiving error response', async () => {
    const errorResponse: Message = {
      type: MessageType.ERROR,
      error: 'Test error message',
    };

    (browser.runtime.sendMessage as any).mockResolvedValue(errorResponse);

    const message: Message = {
      type: MessageType.GET_USER_PROFILE,
    };

    await expect(sendToBackground(message)).rejects.toThrow('Test error message');
  });

  it('should reject when no response received', async () => {
    (browser.runtime.sendMessage as any).mockResolvedValue(null);

    const message: Message = {
      type: MessageType.GET_USER_PROFILE,
    };

    await expect(sendToBackground(message)).rejects.toThrow('No response received');
  });
});

describe('Message Bridge - Send to Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send message to specific tab', async () => {
    const mockResponse: Message = {
      type: MessageType.USER_PROFILE_RESPONSE,
    };

    (browser.tabs.sendMessage as any).mockResolvedValue(mockResponse);

    const message: Message = {
      type: MessageType.UPDATE_USER_PROFILE,
    };

    const response = await sendToTab(123, message);

    expect(browser.tabs.sendMessage).toHaveBeenCalledWith(
      123,
      expect.objectContaining({
        type: MessageType.UPDATE_USER_PROFILE,
        requestId: expect.any(String),
      }),
    );

    expect(response).toEqual(mockResponse);
  });

  it('should reject on timeout when sending to tab', async () => {
    (browser.tabs.sendMessage as any).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const message: Message = {
      type: MessageType.UPDATE_USER_PROFILE,
    };

    await expect(sendToTab(123, message, 100)).rejects.toThrow(/timed out/);
  });

  it('should reject when tab returns error', async () => {
    const errorResponse: Message = {
      type: MessageType.ERROR,
      error: 'Tab error',
    };

    (browser.tabs.sendMessage as any).mockResolvedValue(errorResponse);

    const message: Message = {
      type: MessageType.UPDATE_USER_PROFILE,
    };

    await expect(sendToTab(123, message)).rejects.toThrow('Tab error');
  });
});

describe('Message Bridge - Message Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register and invoke message handler', async () => {
    const handler = vi.fn().mockResolvedValue({
      type: MessageType.USER_PROFILE_RESPONSE,
    });

    registerMessageHandler(MessageType.GET_USER_PROFILE, handler);

    // Verify listener was added
    expect(browser.runtime.onMessage.addListener).toHaveBeenCalledWith(
      expect.any(Function),
    );

    // Get the registered listener function
    const listener = (browser.runtime.onMessage.addListener as any).mock.calls[0][0];

    // Simulate incoming message
    const message: Message = {
      type: MessageType.GET_USER_PROFILE,
      requestId: 'test-123',
    };

    const sendResponse = vi.fn();
    const result = listener(message, {}, sendResponse);

    // Should return true for async response
    expect(result).toBe(true);

    // Wait for handler to be called
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify handler was called
    expect(handler).toHaveBeenCalledWith(message, {});

    // Verify response was sent
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MessageType.USER_PROFILE_RESPONSE,
      }),
    );
  });

  it('should filter messages by type', async () => {
    const handler = vi.fn().mockResolvedValue({
      type: MessageType.USER_PROFILE_RESPONSE,
    });

    registerMessageHandler(MessageType.GET_USER_PROFILE, handler);

    const listener = (browser.runtime.onMessage.addListener as any).mock.calls[0][0];

    // Send message with different type
    const message: Message = {
      type: MessageType.VIDEO_CHANGED,
    };

    const result = listener(message, {}, vi.fn());

    // Should return false (not handling this message)
    expect(result).toBe(false);

    // Handler should not be called
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle errors in message handler', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Handler error'));

    registerMessageHandler(MessageType.GET_USER_PROFILE, handler);

    const listener = (browser.runtime.onMessage.addListener as any).mock.calls[0][0];

    const message: Message = {
      type: MessageType.GET_USER_PROFILE,
      requestId: 'test-123',
    };

    const sendResponse = vi.fn();
    listener(message, {}, sendResponse);

    // Wait for error to be handled
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should send error response
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MessageType.ERROR,
        error: 'Handler error',
        requestId: 'test-123',
      }),
    );
  });
});

describe('Message Bridge - Utility Functions', () => {
  it('should create error message', () => {
    const error = createErrorMessage('Test error', 'req-123');

    expect(error.type).toBe(MessageType.ERROR);
    expect((error as any).error).toBe('Test error');
    expect(error.requestId).toBe('req-123');
  });

  it('should create error message from Error object', () => {
    const error = createErrorMessage(new Error('Error object'), 'req-456');

    expect(error.type).toBe(MessageType.ERROR);
    expect((error as any).error).toBe('Error object');
    expect(error.requestId).toBe('req-456');
  });

  it('should identify error messages', () => {
    const errorMsg: Message = {
      type: MessageType.ERROR,
      error: 'Test',
    };

    const normalMsg: Message = {
      type: MessageType.GET_USER_PROFILE,
    };

    expect(isErrorMessage(errorMsg)).toBe(true);
    expect(isErrorMessage(normalMsg)).toBe(false);
  });
});
