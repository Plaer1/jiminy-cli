/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Config,
  ServerJiminyStreamEvent,
  UserFeedbackPayload,
} from '@plaer1/jiminy-cli-core';
import { JiminyEventType } from '@plaer1/jiminy-cli-core';
import type { GenerateContentResponse } from '@google/genai';
import type { LoadedSettings } from './config/settings.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runQuietInteractive } from './quietCli.js';

const mockSchedulerSchedule = vi.hoisted(() => vi.fn());
const mockHandleAtCommand = vi.hoisted(() => vi.fn());

const mockCoreEvents = vi.hoisted(() => {
  const listeners = new Map<
    string,
    Set<(payload: UserFeedbackPayload) => void>
  >();
  let backlog: UserFeedbackPayload[] = [];
  const userFeedbackEvent = 'user-feedback';

  const getListeners = (event: string) => {
    let eventListeners = listeners.get(event);
    if (!eventListeners) {
      eventListeners = new Set();
      listeners.set(event, eventListeners);
    }
    return eventListeners;
  };

  return {
    on: vi.fn(
      (event: string, handler: (payload: UserFeedbackPayload) => void) => {
        getListeners(event).add(handler);
      },
    ),
    off: vi.fn(
      (event: string, handler: (payload: UserFeedbackPayload) => void) => {
        listeners.get(event)?.delete(handler);
      },
    ),
    emitConsoleLog: vi.fn(),
    drainBacklogs: vi.fn(() => {
      const queued = backlog;
      backlog = [];
      for (const payload of queued) {
        for (const handler of listeners.get(userFeedbackEvent) || []) {
          handler(payload);
        }
      }
    }),
    queueFeedback: (payload: UserFeedbackPayload) => {
      backlog.push(payload);
    },
    reset: () => {
      listeners.clear();
      backlog = [];
      mockCoreEvents.on.mockClear();
      mockCoreEvents.off.mockClear();
      mockCoreEvents.emitConsoleLog.mockClear();
      mockCoreEvents.drainBacklogs.mockClear();
    },
  };
});

vi.mock('./ui/hooks/atCommandProcessor.js', () => ({
  handleAtCommand: mockHandleAtCommand,
}));

vi.mock('./utils/errors.js', () => ({
  handleError: vi.fn(),
  handleToolError: vi.fn(),
  handleCancellationError: vi.fn(),
  handleMaxTurnsExceededError: vi.fn(),
}));

vi.mock('./ui/utils/ConsolePatcher.js', () => ({
  ConsolePatcher: class {
    patch = vi.fn();
    cleanup = vi.fn();
  },
}));

vi.mock('@plaer1/jiminy-cli-core', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@plaer1/jiminy-cli-core')>();

  return {
    ...original,
    Scheduler: class {
      schedule = mockSchedulerSchedule;
    },
    coreEvents: mockCoreEvents,
    createWorkingStdio: vi.fn(() => ({
      stdout: process.stdout,
      stderr: process.stderr,
    })),
    recordToolCallInteractions: vi.fn().mockResolvedValue(undefined),
    getQuietModeStartupPrompt: vi.fn(
      (_vibe: string, _seed: string) =>
        'Reply with a very short ready marker for this launch.',
    ),
  };
});

describe('runQuietInteractive', () => {
  let mockConfig: Config;
  let mockSettings: LoadedSettings;
  let writeLog: Array<{ stream: 'stdout' | 'stderr'; chunk: string }>;
  let stdinResumeSpy: ReturnType<typeof vi.fn>;
  let stdinPauseSpy: ReturnType<typeof vi.fn>;
  let originalIsTTY: boolean | undefined;
  let originalIsRaw: boolean | undefined;
  let originalSetRawMode: ((mode: boolean) => void) | undefined;

  const flush = async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  const waitForRenderedText = async (text: string) => {
    for (let i = 0; i < 10; i++) {
      if (writeLog.some((entry) => entry.chunk.includes(text))) {
        return;
      }
      await flush();
    }
    throw new Error(`Timed out waiting for output: ${text}`);
  };

  async function* createStreamFromEvents(
    events: ServerJiminyStreamEvent[],
  ): AsyncGenerator<ServerJiminyStreamEvent> {
    for (const event of events) {
      yield event;
    }
  }

  const createGenerateContentResponse = (
    text: string,
  ): GenerateContentResponse =>
    ({
      candidates: [
        {
          content: {
            role: 'model',
            parts: [{ text }],
          },
        },
      ],
    }) as unknown as GenerateContentResponse;

  beforeEach(() => {
    mockCoreEvents.reset();
    mockSchedulerSchedule.mockReset();
    mockHandleAtCommand.mockReset();
    mockHandleAtCommand.mockImplementation(async ({ query }) => ({
      processedQuery: [{ text: query }],
    }));

    writeLog = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writeLog.push({ stream: 'stdout', chunk: String(chunk) });
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      writeLog.push({ stream: 'stderr', chunk: String(chunk) });
      return true;
    });

    stdinResumeSpy = vi.fn();
    stdinPauseSpy = vi.fn();
    vi.spyOn(process.stdin, 'resume').mockImplementation(() => {
      stdinResumeSpy();
      return process.stdin;
    });
    vi.spyOn(process.stdin, 'pause').mockImplementation(() => {
      stdinPauseSpy();
      return process.stdin;
    });

    originalIsTTY = process.stdin.isTTY;
    originalIsRaw = process.stdin.isRaw;
    originalSetRawMode = process.stdin.setRawMode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.stdin as any).isTTY = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.stdin as any).isRaw = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.stdin as any).setRawMode = vi.fn((mode: boolean) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.stdin as any).isRaw = mode;
    });

    const mockJiminyClient = {
      sendMessageStream: vi.fn(),
      getCurrentSequenceModel: vi.fn().mockReturnValue('test-model'),
      getChat: vi.fn().mockReturnValue({
        recordCompletedToolCalls: vi.fn(),
      }),
    };
    const mockBaseLlmClient = {
      generateContent: vi
        .fn()
        .mockResolvedValue(createGenerateContentResponse('ready')),
    };

    mockConfig = {
      getDebugMode: vi.fn().mockReturnValue(false),
      getMessageBus: vi.fn().mockReturnValue({
        publish: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      }),
      getJiminyClient: vi.fn().mockReturnValue(mockJiminyClient),
      getBaseLlmClient: vi.fn().mockReturnValue(mockBaseLlmClient),
      getMaxSessionTurns: vi.fn().mockReturnValue(10),
      getModel: vi.fn().mockReturnValue('test-model'),
      sudoPasswordService: {
        setCachedPassword: vi.fn(),
        registerPasswordPrompter: vi.fn(),
        setSkipForSession: vi.fn(),
      },
    } as unknown as Config;

    mockSettings = {} as LoadedSettings;
  });

  afterEach(() => {
    process.stdin.removeAllListeners('data');
    process.stdin.removeAllListeners('end');
    process.stdin.removeAllListeners('error');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.stdin as any).isTTY = originalIsTTY;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.stdin as any).isRaw = originalIsRaw;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.stdin as any).setRawMode = originalSetRawMode;
    vi.restoreAllMocks();
  });

  it('shows sudo setup first, suppresses buffered info messages, and preserves the generated startup marker', async () => {
    mockCoreEvents.queueFeedback({
      severity: 'info',
      message: 'startup chatter',
    });
    mockCoreEvents.queueFeedback({
      severity: 'warning',
      message: 'heads up',
    });

    const mockBaseLlmClient = mockConfig.getBaseLlmClient();
    vi.mocked(mockBaseLlmClient.generateContent).mockResolvedValue(
      createGenerateContentResponse('gogogo'),
    );

    const runPromise = runQuietInteractive({
      config: mockConfig,
      settings: mockSettings,
    });

    await flush();
    process.stdin.emit('data', Buffer.from('3\n'));
    await flush();
    process.stdin.emit('end');
    await runPromise;

    const rendered = writeLog.map((entry) => entry.chunk).join('');
    const sudoIndex = rendered.indexOf('Sudo password handling:');
    const warningIndex = rendered.indexOf('[WARNING] heads up');
    const readyIndex = rendered.indexOf('✦ gogogo');
    const promptIndex = rendered.lastIndexOf('> ');

    expect(sudoIndex).toBe(0);
    expect(rendered).not.toContain('startup chatter');
    expect(warningIndex).toBeGreaterThan(sudoIndex);
    expect(readyIndex).toBeGreaterThan(warningIndex);
    expect(promptIndex).toBeGreaterThan(readyIndex);
  });

  it('uses a one-shot startup call, suppresses pre-tool narration, prefixes assistant responses, and does not replay the user query', async () => {
    const mockJiminyClient = mockConfig.getJiminyClient();
    const toolRequest = {
      callId: 'tool-1',
      name: 'run_shell_command',
      args: { command: 'install conky' },
      isClientInitiated: false,
      prompt_id: 'quiet-prompt',
      traceId: 'trace-1',
    };
    vi.mocked(mockJiminyClient.sendMessageStream)
      .mockReturnValueOnce(
        createStreamFromEvents([
          {
            type: JiminyEventType.Content,
            value:
              'I will check for an available package manager and install Conky.',
          },
          {
            type: JiminyEventType.ToolCallRequest,
            value: toolRequest,
          },
          {
            type: JiminyEventType.Finished,
            value: { reason: undefined, usageMetadata: { totalTokenCount: 1 } },
          },
        ]),
      )
      .mockReturnValueOnce(
        createStreamFromEvents([
          {
            type: JiminyEventType.Content,
            value: 'Shell command execution is restricted by policy.',
          },
          {
            type: JiminyEventType.Finished,
            value: { reason: undefined, usageMetadata: { totalTokenCount: 1 } },
          },
        ]),
      );
    mockSchedulerSchedule.mockResolvedValue([
      {
        request: toolRequest,
        response: {
          responseParts: [{ text: 'tool response' }],
        },
      },
    ]);

    const runPromise = runQuietInteractive({
      config: mockConfig,
      settings: mockSettings,
    });

    await flush();
    process.stdin.emit('data', Buffer.from('3\n'));
    await waitForRenderedText('> ');
    process.stdin.emit('data', Buffer.from('test\n'));
    await flush();
    await flush();
    process.stdin.emit('end');
    await runPromise;

    const rendered = writeLog.map((entry) => entry.chunk).join('');

    expect(mockConfig.getBaseLlmClient().generateContent).toHaveBeenCalledTimes(
      1,
    );
    expect(mockConfig.getBaseLlmClient().generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        modelConfigKey: { model: 'quiet-startup' },
      }),
    );
    expect(mockJiminyClient.sendMessageStream).toHaveBeenCalledTimes(2);
    expect(mockJiminyClient.sendMessageStream).toHaveBeenNthCalledWith(
      1,
      [{ text: 'test' }],
      expect.any(AbortSignal),
      expect.stringMatching(/^quiet-\d+$/),
      undefined,
      false,
      'test',
    );
    expect(mockJiminyClient.sendMessageStream).toHaveBeenNthCalledWith(
      2,
      [{ text: 'tool response' }],
      expect.any(AbortSignal),
      expect.stringMatching(/^quiet-\d+$/),
      undefined,
      false,
      undefined,
    );
    expect(rendered).toContain('✦ ready\n');
    expect(rendered).toContain(
      '✦ Shell command execution is restricted by policy.\n',
    );
    expect(rendered).toContain('> ');
    expect(rendered).not.toContain('> test');
    expect(rendered).not.toContain(
      'I will check for an available package manager and install Conky.',
    );
    expect(stdinResumeSpy).toHaveBeenCalled();
    expect(stdinPauseSpy).toHaveBeenCalled();
  });
});
