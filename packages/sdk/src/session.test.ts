/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JiminyCliSession } from './session.js';
import type { JiminyCliAgent } from './agent.js';
import type { JiminyCliAgentOptions } from './types.js';

// Mutable mock client so individual tests can override sendMessageStream
const mockClient = {
  resumeChat: vi.fn().mockResolvedValue(undefined),
  getHistory: vi.fn().mockReturnValue([]),
  sendMessageStream: vi.fn().mockReturnValue((async function* () {})()),
  updateSystemInstruction: vi.fn(),
};

// Mutable mock config so individual tests can spy on setUserMemory etc.
const mockConfig = {
  initialize: vi.fn().mockResolvedValue(undefined),
  refreshAuth: vi.fn().mockResolvedValue(undefined),
  getSkillManager: vi.fn().mockReturnValue({
    getSkills: vi.fn().mockReturnValue([]),
    addSkills: vi.fn(),
  }),
  getToolRegistry: vi.fn().mockReturnValue({
    getTool: vi.fn().mockReturnValue(null),
    registerTool: vi.fn(),
    unregisterTool: vi.fn(),
  }),
  getMessageBus: vi.fn().mockReturnValue({}),
  getJiminyClient: vi.fn().mockReturnValue(mockClient),
  getSessionId: vi.fn().mockReturnValue('mock-session-id'),
  getWorkingDir: vi.fn().mockReturnValue('/tmp'),
  setUserMemory: vi.fn(),
};

// Mock scheduleAgentTools at module level so tests can override it
const mockScheduleAgentTools = vi.fn().mockResolvedValue([]);

// Mock @plaer1/jiminy-cli-core to avoid heavy filesystem/auth/telemetry setup
vi.mock('@plaer1/jiminy-cli-core', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@plaer1/jiminy-cli-core')>();
  return {
    ...actual,
    Config: vi.fn().mockImplementation(() => mockConfig),
    getAuthTypeFromEnv: vi.fn().mockReturnValue(null),
    scheduleAgentTools: (...args: unknown[]) => mockScheduleAgentTools(...args),
    loadSkillsFromDir: vi.fn().mockResolvedValue([]),
    ActivateSkillTool: class {
      static Name = 'activate_skill';
    },
    PolicyDecision: actual.PolicyDecision,
  };
});

const mockAgent = {} as unknown as JiminyCliAgent;

const baseOptions: JiminyCliAgentOptions = {
  instructions: 'You are a helpful assistant.',
};

beforeEach(() => {
  vi.clearAllMocks();
  // Reset sendMessageStream to empty stream by default
  mockClient.sendMessageStream.mockReturnValue((async function* () {})());
  mockScheduleAgentTools.mockResolvedValue([]);
});

describe('JiminyCliSession constructor', () => {
  it('accepts string instructions', () => {
    expect(
      () => new JiminyCliSession(baseOptions, 'session-1', mockAgent),
    ).not.toThrow();
  });

  it('accepts function instructions', () => {
    const options: JiminyCliAgentOptions = {
      instructions: async () => 'dynamic instructions',
    };
    expect(
      () => new JiminyCliSession(options, 'session-2', mockAgent),
    ).not.toThrow();
  });

  it('throws when instructions is an object (not string or function)', () => {
    const options = {
      instructions: { invalid: true },
    } as unknown as JiminyCliAgentOptions;
    expect(() => new JiminyCliSession(options, 'session-3', mockAgent)).toThrow(
      'Instructions must be a string or a function.',
    );
  });

  it('throws when instructions is a number', () => {
    const options = {
      instructions: 42,
    } as unknown as JiminyCliAgentOptions;
    expect(() => new JiminyCliSession(options, 'session-4', mockAgent)).toThrow(
      'Instructions must be a string or a function.',
    );
  });

  it('throws when instructions is an array', () => {
    const options = {
      instructions: ['step1', 'step2'],
    } as unknown as JiminyCliAgentOptions;
    expect(() => new JiminyCliSession(options, 'session-5', mockAgent)).toThrow(
      'Instructions must be a string or a function.',
    );
  });
});

describe('JiminyCliSession id getter', () => {
  it('returns the sessionId passed to the constructor', () => {
    const session = new JiminyCliSession(
      baseOptions,
      'my-session-id',
      mockAgent,
    );
    expect(session.id).toBe('my-session-id');
  });

  it('returns different ids for different sessions', () => {
    const s1 = new JiminyCliSession(baseOptions, 'session-a', mockAgent);
    const s2 = new JiminyCliSession(baseOptions, 'session-b', mockAgent);
    expect(s1.id).not.toBe(s2.id);
  });
});

describe('JiminyCliSession initialize()', () => {
  it('initializes successfully with string instructions', async () => {
    const session = new JiminyCliSession(
      baseOptions,
      'session-init-1',
      mockAgent,
    );
    await expect(session.initialize()).resolves.toBeUndefined();
  });

  it('is idempotent — calling initialize() twice does not throw', async () => {
    const session = new JiminyCliSession(
      baseOptions,
      'session-init-2',
      mockAgent,
    );
    await session.initialize();
    await expect(session.initialize()).resolves.toBeUndefined();
  });

  it('initializes with empty tools array', async () => {
    const options: JiminyCliAgentOptions = { ...baseOptions, tools: [] };
    const session = new JiminyCliSession(options, 'session-init-3', mockAgent);
    await expect(session.initialize()).resolves.toBeUndefined();
  });

  it('initializes with empty skills array', async () => {
    const options: JiminyCliAgentOptions = { ...baseOptions, skills: [] };
    const session = new JiminyCliSession(options, 'session-init-4', mockAgent);
    await expect(session.initialize()).resolves.toBeUndefined();
  });

  it('initializes with custom model', async () => {
    const options: JiminyCliAgentOptions = {
      ...baseOptions,
      model: 'gemini-2.0-flash',
    };
    const session = new JiminyCliSession(options, 'session-init-5', mockAgent);
    await expect(session.initialize()).resolves.toBeUndefined();
  });

  it('initializes with custom cwd', async () => {
    const options: JiminyCliAgentOptions = {
      ...baseOptions,
      cwd: '/custom/working/dir',
    };
    const session = new JiminyCliSession(options, 'session-init-6', mockAgent);
    await expect(session.initialize()).resolves.toBeUndefined();
  });
});

// TODO(#24999): Mock uses getJiminyClient() method but session.ts expects jiminyClient property.
describe.skip('JiminyCliSession sendStream()', () => {
  it('auto-initializes if not yet initialized', async () => {
    const session = new JiminyCliSession(
      baseOptions,
      'session-stream-1',
      mockAgent,
    );
    const events = [];
    for await (const event of session.sendStream('Hello')) {
      events.push(event);
    }
    expect(events).toHaveLength(0);
  });

  it('completes cleanly when model returns no tool calls', async () => {
    const session = new JiminyCliSession(
      baseOptions,
      'session-stream-2',
      mockAgent,
    );
    await session.initialize();
    const events = [];
    for await (const event of session.sendStream('Hello')) {
      events.push(event);
    }
    expect(events).toHaveLength(0);
  });

  it('accepts an AbortSignal without throwing', async () => {
    const session = new JiminyCliSession(
      baseOptions,
      'session-stream-3',
      mockAgent,
    );
    const controller = new AbortController();
    const events = [];
    for await (const event of session.sendStream('Hello', controller.signal)) {
      events.push(event);
    }
    expect(events).toHaveLength(0);
  });

  it('executes tool call loop and sends function response back to model', async () => {
    const { JiminyEventType } = await import('@plaer1/jiminy-cli-core');

    // First call: yield a ToolCallRequest, then end
    // Second call: empty stream (model is done after tool result)
    let callCount = 0;
    mockClient.sendMessageStream.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return (async function* () {
          yield {
            type: JiminyEventType.ToolCallRequest,
            value: {
              callId: 'call-1',
              name: 'testTool',
              args: { input: 'value' },
            },
          };
        })();
      }
      return (async function* () {})();
    });

    mockScheduleAgentTools.mockResolvedValue([
      {
        response: {
          responseParts: [
            {
              functionResponse: {
                name: 'testTool',
                response: { result: 'done' },
              },
            },
          ],
        },
      },
    ]);

    const session = new JiminyCliSession(
      baseOptions,
      'session-stream-4',
      mockAgent,
    );
    const events = [];
    for await (const event of session.sendStream('Use the tool')) {
      events.push(event);
    }

    // The ToolCallRequest event should have been yielded to the caller
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(JiminyEventType.ToolCallRequest);

    // scheduleAgentTools should have been called with the tool call
    expect(mockScheduleAgentTools).toHaveBeenCalledOnce();

    // sendMessageStream called twice: once for prompt, once with tool result
    expect(mockClient.sendMessageStream).toHaveBeenCalledTimes(2);
  });

  it('calls setUserMemory and updateSystemInstruction when instructions is a function', async () => {
    const dynamicInstructions = vi
      .fn()
      .mockResolvedValue('updated instructions');
    const options: JiminyCliAgentOptions = {
      instructions: dynamicInstructions,
    };

    const session = new JiminyCliSession(
      options,
      'session-stream-5',
      mockAgent,
    );
    for await (const _event of session.sendStream('Hello')) {
      // consume stream
    }

    // The instructions function should have been called with a SessionContext
    expect(dynamicInstructions).toHaveBeenCalledOnce();
    const context = dynamicInstructions.mock.calls[0][0];
    expect(context).toHaveProperty('sessionId');
    expect(context).toHaveProperty('transcript');
    expect(context).toHaveProperty('cwd');
    expect(context).toHaveProperty('timestamp');

    // Config should have been updated with the new instructions
    expect(mockConfig.setUserMemory).toHaveBeenCalledWith(
      'updated instructions',
    );

    // Client system instruction should have been refreshed
    expect(mockClient.updateSystemInstruction).toHaveBeenCalledOnce();
  });

  it('does not call setUserMemory when instructions is a string', async () => {
    const session = new JiminyCliSession(
      baseOptions,
      'session-stream-6',
      mockAgent,
    );
    for await (const _event of session.sendStream('Hello')) {
      // consume stream
    }
    expect(mockConfig.setUserMemory).not.toHaveBeenCalled();
    expect(mockClient.updateSystemInstruction).not.toHaveBeenCalled();
  });
});
