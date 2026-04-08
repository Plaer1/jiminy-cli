/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  JiminyEventType,
  Scheduler,
  ROOT_SCHEDULER_ID,
  coreEvents,
  CoreEvent,
  createWorkingStdio,
  recordToolCallInteractions,
  ToolErrorType,
  debugLogger,
  getQuietModeStartupPrompt,
  getResponseText,
  LlmRole,
  type Config,
  type UserFeedbackPayload,
} from '@plaer1/jiminy-cli-core';

import type { Part, PartListUnion } from '@google/genai';
import stripAnsi from 'strip-ansi';

import { handleAtCommand } from './ui/hooks/atCommandProcessor.js';
import {
  handleError,
  handleToolError,
  handleCancellationError,
  handleMaxTurnsExceededError,
} from './utils/errors.js';
import { TextOutput } from './ui/utils/textOutput.js';
import { ConsolePatcher } from './ui/utils/ConsolePatcher.js';
import type { LoadedSettings } from './config/settings.js';

interface QuietInteractiveParams {
  config: Config;
  settings: LoadedSettings;
}

/**
 * Read a line of input using the terminal's built-in cooked-mode line editing.
 */
function readCanonicalLine(
  stdin: NodeJS.ReadStream,
  output: NodeJS.WriteStream,
  prompt: string,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const finish = (value: string | null) => {
      stdin.removeListener('data', onData);
      stdin.removeListener('end', onEnd);
      stdin.removeListener('error', onError);
      stdin.pause();
      resolve(value);
    };

    const onData = (data: Buffer | string) => {
      const text = String(data).replace(/[\r\n]+$/, '');
      finish(text);
    };

    const onEnd = () => {
      finish(null);
    };

    const onError = (error: Error) => {
      stdin.removeListener('data', onData);
      stdin.removeListener('end', onEnd);
      stdin.removeListener('error', onError);
      reject(error);
    };

    output.write(prompt);
    stdin.resume();
    stdin.on('data', onData);
    stdin.once('end', onEnd);
    stdin.once('error', onError);
  });
}

/**
 * Read a line of input with characters masked (for password entry).
 */
function readMaskedInput(
  stdin: NodeJS.ReadStream,
  output: NodeJS.WriteStream,
): Promise<string> {
  return new Promise((resolve) => {
    const chunks: string[] = [];
    const canUseRawMode = stdin.isTTY && typeof stdin.setRawMode === 'function';
    const wasRaw = stdin.isRaw || false;
    if (canUseRawMode) {
      stdin.setRawMode(true);
    }
    stdin.resume();

    const onData = (data: Buffer) => {
      const ch = data.toString('utf8');
      for (const c of ch) {
        if (c === '\r' || c === '\n') {
          stdin.removeListener('data', onData);
          if (canUseRawMode) {
            stdin.setRawMode(wasRaw);
          }
          stdin.pause();
          resolve(chunks.join(''));
          return;
        }
        if (c === '\u007f' || c === '\b') {
          if (chunks.length > 0) {
            chunks.pop();
            output.write('\b \b');
          }
        } else if (c === '\u0003') {
          stdin.removeListener('data', onData);
          if (canUseRawMode) {
            stdin.setRawMode(wasRaw);
          }
          stdin.pause();
          resolve('');
          return;
        } else {
          chunks.push(c);
          output.write('•');
        }
      }
    };

    stdin.on('data', onData);
  });
}

const STARTUP_VIBES = [
  'gamer',
  'terminally online',
  'unhinged',
  'corporate',
  'pirate',
  'cowboy',
  'robot',
  'cryptid',
  'parody',
  'meme',
  'abstract',
  'avant-garde',
  'feral',
  'glitchy',
  'cursed',
  'chaotic',
  'surreal',
  'vaporwave',
  'post-ironic',
  'shitpost',
];
const STARTUP_PHRASES: Record<string, string[]> = {
  gamer: ['lets go', 'gg', 'speedrun'],
  'terminally online': [
    'touch grass nvm lets go',
    'online and ready',
    'chronically here',
  ],
  unhinged: ['chaos time', 'unhinged and ready', 'no rules'],
  corporate: ['synergized', 'lets circle back', 'ready to deliver'],
  pirate: ['yo ho', 'ahoy', 'set sail'],
  cowboy: ['yeehaw', 'saddle up', 'ride out'],
  robot: ['beep boop', 'online', 'systems go'],
  cryptid: ['emerging', 'observed', 'manifesting'],
  parody: ['we have ai at home', 'great value ready', 'knockoff online'],
  meme: ['stonks', 'its showtime', 'vibes loaded'],
  abstract: ['undefined', 'NaN ready', 'null state'],
  'avant-garde': ['performance art', 'the piece', 'exhibit ready'],
  feral: ['hissing', 'scratching ready', 'uncontained'],
  glitchy: ['r-r-ready', 'segfault go', 'buffer overflow'],
  cursed: ['cursed and ready', 'doomed lets go', 'hexed online'],
  chaotic: ['entropy max', 'pure chaos', 'disorder ready'],
  surreal: ['melting clocks', 'dream state', 'beyond ready'],
  vaporwave: ['a e s t h e t i c', 'mall soft ready', 'late cap ready'],
  'post-ironic': ['unironically ready', 'sincerely go', 'earnest mode'],
  shitpost: ['lmao ready', 'zero effort go', 'shitpost engage'],
};

function pickRandomSeed(): { vibe: string; phrase: string } {
  const vibe = STARTUP_VIBES[Math.floor(Math.random() * STARTUP_VIBES.length)];
  const pool = STARTUP_PHRASES[vibe] || ['ready'];
  const phrase = pool[Math.floor(Math.random() * pool.length)];
  return { vibe, phrase };
}

async function generateQuietStartupMarker(config: Config): Promise<string> {
  const { vibe, phrase } = pickRandomSeed();
  try {
    const baseLlmClient = config.getBaseLlmClient();
    const prompt = getQuietModeStartupPrompt(vibe, phrase);
    const response = await baseLlmClient.generateContent({
      modelConfigKey: { model: 'quiet-startup' },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      abortSignal: AbortSignal.timeout(5000),
      promptId: 'quiet-startup',
      role: LlmRole.UTILITY_TOOL,
    });
    const text = getResponseText(response)?.trim();
    return text || phrase;
  } catch {
    return phrase;
  }
}

function writeAssistantTurn(
  textOutput: TextOutput,
  responseText: string,
): void {
  const normalizedText = stripAnsi(responseText).replace(/[\r\n]+$/, '');
  if (!normalizedText.trim()) {
    return;
  }
  textOutput.writeOnNewLine(`✦ ${normalizedText}`);
  textOutput.ensureTrailingNewline();
}

function flushBufferedFeedback(
  bufferedFeedback: UserFeedbackPayload[],
  handleUserFeedback: (payload: UserFeedbackPayload) => void,
): void {
  for (const payload of bufferedFeedback) {
    if (payload.severity !== 'info') {
      handleUserFeedback(payload);
    }
  }
}

function prepareStdinForCookedInput(
  stdin: NodeJS.ReadStream,
): (() => void) | undefined {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    return undefined;
  }

  const wasRaw = stdin.isRaw || false;
  if (wasRaw) {
    stdin.setRawMode(false);
  }

  return () => {
    if (wasRaw) {
      stdin.setRawMode(true);
    }
  };
}

/**
 * Present the sudo password menu and configure the service.
 */
async function setupSudoPrompt(
  config: Config,
  output: NodeJS.WriteStream,
): Promise<void> {
  const sudoService = config.sudoPasswordService;

  output.write(
    'Sudo password handling:\n' +
      '  1) Enter password now (remembered for this session)\n' +
      '  2) Ask me when needed\n' +
      "  3) Don't use sudo this session\n\n",
  );

  const choice = await readCanonicalLine(
    process.stdin,
    output,
    'Choice [1/2/3]: ',
  );
  const trimmedChoice = choice?.trim() || '';

  if (trimmedChoice === '1') {
    output.write('Password: ');
    const password = await readMaskedInput(process.stdin, output);
    output.write('\n');
    if (password) {
      sudoService.setCachedPassword(password);
    }
    sudoService.registerPasswordPrompter(async () => {
      output.write('Sudo password required.\nPassword: ');
      const pw = await readMaskedInput(process.stdin, output);
      output.write('\n');
      return pw || null;
    });
  } else if (trimmedChoice === '2') {
    sudoService.registerPasswordPrompter(async () => {
      output.write('Sudo password required.\nPassword: ');
      const pw = await readMaskedInput(process.stdin, output);
      output.write('\n');
      return pw || null;
    });
  } else {
    sudoService.setSkipForSession();
  }

  output.write('\n');
}

export async function runQuietInteractive({
  config,
  settings: _settings,
}: QuietInteractiveParams): Promise<void> {
  const consolePatcher = new ConsolePatcher({
    stderr: true,
    debugMode: config.getDebugMode(),
    errorsOnly: !config.getDebugMode(),
    onNewMessage: (msg) => {
      coreEvents.emitConsoleLog(msg.type, msg.content);
    },
  });
  consolePatcher.patch();

  const restoreCookedInput = prepareStdinForCookedInput(process.stdin);
  const { stdout: workingStdout, stderr: workingStderr } = createWorkingStdio();
  const textOutput = new TextOutput(workingStdout);
  const bufferedFeedback: UserFeedbackPayload[] = [];

  const bufferUserFeedback = (payload: UserFeedbackPayload) => {
    bufferedFeedback.push(payload);
  };

  const handleUserFeedback = (payload: UserFeedbackPayload) => {
    const prefix = payload.severity.toUpperCase();
    workingStderr.write(`[${prefix}] ${payload.message}\n`);
    if (payload.error && config.getDebugMode()) {
      const errorToLog =
        payload.error instanceof Error
          ? payload.error.stack || payload.error.message
          : String(payload.error);
      workingStderr.write(`${errorToLog}\n`);
    }
  };

  coreEvents.on(CoreEvent.UserFeedback, bufferUserFeedback);
  coreEvents.drainBacklogs();

  const jiminyClient = config.getJiminyClient();
  const scheduler = new Scheduler({
    context: config,
    messageBus: config.getMessageBus(),
    getPreferredEditor: () => undefined,
    schedulerId: ROOT_SCHEDULER_ID,
  });

  const processLine = async (line: string): Promise<void> => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const abortController = new AbortController();
    let isAborting = false;
    const canUseRawMode =
      process.stdin.isTTY && typeof process.stdin.setRawMode === 'function';
    const wasRaw = process.stdin.isRaw || false;

    if (canUseRawMode) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
    }

    const keypressHandler = (data: Buffer) => {
      if (data.toString() === '\u0003' && !isAborting) {
        isAborting = true;
        workingStderr.write('\nCancelled\n');
        abortController.abort();
      }
    };

    if (canUseRawMode) {
      process.stdin.on('data', keypressHandler);
    }

    const restoreTerminal = () => {
      if (canUseRawMode) {
        process.stdin.removeListener('data', keypressHandler);
        process.stdin.setRawMode(wasRaw);
        process.stdin.pause();
      }
    };

    try {
      const { processedQuery, error } = await handleAtCommand({
        query: trimmed,
        config,
        addItem: (_item, _timestamp) => 0,
        onDebugMessage: () => {},
        messageId: Date.now(),
        signal: abortController.signal,
        escapePastedAtSymbols: false,
      });

      if (error || !processedQuery) {
        workingStderr.write(`Error: ${error || 'Failed to process input'}\n`);
        return;
      }

      let currentMessageParts: PartListUnion = processedQuery;

      let turnCount = 0;
      while (true) {
        turnCount++;
        if (
          config.getMaxSessionTurns() >= 0 &&
          turnCount > config.getMaxSessionTurns()
        ) {
          handleMaxTurnsExceededError(config);
        }

        const toolCallRequests: Array<
          import('@plaer1/jiminy-cli-core').ToolCallRequestInfo
        > = [];

        const responseStream = jiminyClient.sendMessageStream(
          currentMessageParts,
          abortController.signal,
          `quiet-${Date.now()}`,
          undefined,
          false,
          turnCount === 1 ? trimmed : undefined,
        );

        let responseText = '';
        for await (const event of responseStream) {
          if (abortController.signal.aborted) {
            handleCancellationError(config);
          }

          if (event.type === JiminyEventType.Content) {
            responseText += stripAnsi(event.value);
          } else if (event.type === JiminyEventType.ToolCallRequest) {
            toolCallRequests.push(event.value);
          } else if (event.type === JiminyEventType.Error) {
            throw event.value.error;
          } else if (event.type === JiminyEventType.AgentExecutionStopped) {
            const msg = event.value.systemMessage?.trim() || event.value.reason;
            workingStderr.write(`Stopped: ${msg}\n`);
            break;
          } else if (event.type === JiminyEventType.AgentExecutionBlocked) {
            const msg = event.value.systemMessage?.trim() || event.value.reason;
            workingStderr.write(`[WARNING] Blocked: ${msg}\n`);
          }
        }

        if (toolCallRequests.length > 0) {
          const completedToolCalls = await scheduler.schedule(
            toolCallRequests,
            abortController.signal,
          );
          const toolResponseParts: Part[] = [];

          for (const completedToolCall of completedToolCalls) {
            const toolResponse = completedToolCall.response;
            const requestInfo = completedToolCall.request;

            if (toolResponse.error) {
              handleToolError(
                requestInfo.name,
                toolResponse.error,
                config,
                toolResponse.errorType || 'TOOL_EXECUTION_ERROR',
                typeof toolResponse.resultDisplay === 'string'
                  ? toolResponse.resultDisplay
                  : undefined,
              );
            }

            if (toolResponse.responseParts) {
              toolResponseParts.push(...toolResponse.responseParts);
            }
          }

          try {
            const currentModel =
              jiminyClient.getCurrentSequenceModel() ?? config.getModel();
            jiminyClient
              .getChat()
              .recordCompletedToolCalls(currentModel, completedToolCalls);
            await recordToolCallInteractions(config, completedToolCalls);
          } catch (err) {
            debugLogger.error(
              `Error recording completed tool call information: ${err}`,
            );
          }

          const stopTool = completedToolCalls.find(
            (tc) => tc.response.errorType === ToolErrorType.STOP_EXECUTION,
          );
          if (stopTool?.response.error) {
            workingStderr.write(
              `Stopped: ${stopTool.response.error.message}\n`,
            );
            break;
          }

          currentMessageParts = toolResponseParts;
        } else {
          writeAssistantTurn(textOutput, responseText);
          break;
        }
      }
    } catch (err) {
      if (!isAborting) {
        handleError(err, config);
      }
    } finally {
      restoreTerminal();
    }
  };

  try {
    await setupSudoPrompt(config, workingStderr);

    coreEvents.off(CoreEvent.UserFeedback, bufferUserFeedback);
    coreEvents.on(CoreEvent.UserFeedback, handleUserFeedback);
    flushBufferedFeedback(bufferedFeedback, handleUserFeedback);

    writeAssistantTurn(textOutput, await generateQuietStartupMarker(config));

    while (true) {
      const line = await readCanonicalLine(process.stdin, workingStderr, '> ');
      if (line === null) {
        break;
      }
      await processLine(line);
    }
  } finally {
    coreEvents.off(CoreEvent.UserFeedback, bufferUserFeedback);
    coreEvents.off(CoreEvent.UserFeedback, handleUserFeedback);
    consolePatcher.cleanup();
    restoreCookedInput?.();
  }
}
