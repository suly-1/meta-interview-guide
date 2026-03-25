/**
 * llmSafe.ts — Graceful degradation wrapper for LLM calls
 *
 * Wraps `invokeLLM` with:
 *   - Configurable timeout (default 30s) — prevents LLM slowness from hanging requests
 *   - Automatic retry with exponential back-off (default 2 retries)
 *   - Typed fallback value returned on failure instead of throwing
 *   - Structured error logging with context
 *
 * Usage:
 *   // Instead of: const result = await invokeLLM({ messages });
 *   const result = await invokeLLMSafe(
 *     { messages },
 *     { fallback: null, timeoutMs: 15_000, retries: 1 }
 *   );
 *   if (!result) {
 *     // LLM was unavailable — show fallback UI
 *   }
 *
 * This ensures that if the LLM API is slow, down, or returns an error,
 * the page still renders (with a graceful fallback) instead of crashing.
 */

import { invokeLLM } from "./llm";
import type { InvokeParams, InvokeResult } from "./llm";

export interface LLMSafeOptions<T> {
  /** Value to return if all attempts fail. Defaults to null. */
  fallback: T;
  /** Timeout in milliseconds per attempt. Defaults to 30_000 (30s). */
  timeoutMs?: number;
  /** Number of retry attempts after the first failure. Defaults to 1. */
  retries?: number;
  /** Label for logging — helps identify which feature triggered the call. */
  context?: string;
}

/**
 * Wraps a single invokeLLM call with a timeout.
 */
async function invokeLLMWithTimeout(
  params: InvokeParams,
  timeoutMs: number
): Promise<InvokeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // invokeLLM uses fetch internally; we can't pass the signal directly,
    // so we race the promise against a timeout rejection.
    const result = await Promise.race([
      invokeLLM(params),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`LLM call timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls invokeLLM with graceful degradation.
 * Returns the LLM result on success, or `options.fallback` on any failure.
 */
export async function invokeLLMSafe<T>(
  params: InvokeParams,
  options: LLMSafeOptions<T>
): Promise<InvokeResult | T> {
  const {
    fallback,
    timeoutMs = 30_000,
    retries = 1,
    context = "unknown",
  } = options;

  let lastError: unknown;
  const maxAttempts = 1 + retries;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await invokeLLMWithTimeout(params, timeoutMs);
      return result;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);

      if (attempt < maxAttempts) {
        // Exponential back-off: 1s, 2s, 4s, ...
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 8_000);
        console.warn(
          `[LLM:${context}] Attempt ${attempt}/${maxAttempts} failed: ${msg}. Retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error(
          `[LLM:${context}] All ${maxAttempts} attempt(s) failed. Returning fallback. Last error: ${msg}`
        );
      }
    }
  }

  return fallback;
}

/**
 * Extracts the text content from a successful LLM response.
 * Returns null if the response is missing or malformed.
 */
export function extractLLMText(result: InvokeResult | null | undefined): string | null {
  if (!result) return null;
  const content = result.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  return null;
}

/**
 * Parses JSON from an LLM response that was requested with response_format: json_schema.
 * Returns null on parse failure.
 */
export function parseLLMJson<T>(
  result: InvokeResult | null | undefined
): T | null {
  const text = extractLLMText(result);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error("[LLM] Failed to parse JSON response:", text.slice(0, 200));
    return null;
  }
}
