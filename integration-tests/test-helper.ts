/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export * from '@plaer1/jiminy-cli-test-utils';
export { normalizePath } from '@plaer1/jiminy-cli-test-utils';

export const skipFlaky = !process.env['RUN_FLAKY_INTEGRATION'];
