import z from "https://deno.land/x/zod@v3.22.4/index.ts";
import emojiRegex from "https://esm.sh/emoji-regex@10.3.0/index.mjs";

/**
 * Regular expression to match emoji code strings like :unicorn:.
 *
 * This matches emoji names contained within colons, like :unicorn: or :thumbs_up:.
 * It can be used to test if a string contains an emoji code.
 *
 * @example
 *
 * ```ts
 * import { EMOJI_CODE_REGEX } from "./emoji.ts";
 *
 * const str = ":unicorn:";
 *
 * console.assert(EMOJI_CODE_REGEX.test(str));
 * console.assert(EMOJI_CODE_REGEX.test("🦄") === false);
 *
 * ```
 */
export const EMOJI_CODE_REGEX = /^:\w+:$/;

/**
 * Global regular expression to match emoji codes.
 *
 * This matches emoji names contained within colons. It is the global
 * version of {@link EMOJI_CODE_REGEX}, meaning it will match all occurrences
 * in a string rather than just the isolated emoji code.
 *
 * Useful for replacing or extracting all emoji codes from a string.
 *
 * @example
 *
 * ```ts
 * import { EMOJI_CODE_REGEX_GLOBAL } from "./emoji.ts";
 *
 * const str = "Hello :unicorn: :sparkles:";
 *
 * // Get all emoji codes
 * const codes = str.match(EMOJI_CODE_REGEX_GLOBAL);
 * console.assert(JSON.stringify(codes) === '[":unicorn:",":sparkles:"]');
 *
 * // Replace all emoji codes
 * const replaced = str.replace(EMOJI_CODE_REGEX_GLOBAL, "-");
 * console.assert(replaced === "Hello - -");
 * ```
 */
export const EMOJI_CODE_REGEX_GLOBAL = /:\w+:/g;

/**
 * Global regular expression to match emoji characters.
 *
 * This matches any emoji characters like 🦄 or ✨ in a string.
 * It is the global version of {@link EMOJI_CHAR_REGEX}, meaning it will match
 * all occurrences rather than just rather than just the isolated emoji.
 *
 * Useful for replacing or extracting all emoji characters from a string.
 *
 * @example
 *
 * ```ts
 * import { EMOJI_CHAR_REGEX_GLOBAL } from "./emoji.ts";
 *
 * const str = "Hello 🦄 ✨";
 *
 * // Get all emoji characters
 * const chars = str.match(EMOJI_CHAR_REGEX_GLOBAL);
 * console.assert(JSON.stringify(chars) === '["🦄","✨"]');
 *
 * // Replace all emoji characters
 * const replaced = str.replace(EMOJI_CHAR_REGEX_GLOBAL, "-");
 * console.assert(replaced === "Hello - -");
 * ```
 */
export const EMOJI_CHAR_REGEX_GLOBAL: RegExp = emojiRegex();

/**
 * Schema that validates emoji objects containing the emoji character, code, and name.
 *
 * @example
 *
 * ```ts
 * import { EmojiObjectSchema } from "./gitmoji.ts";
 *
 * const emoji = {
 *   character: "✨",
 *   code: ":sparkles:",
 *   name: "sparkles"
 * };
 *
 * console.assert(EmojiObjectSchema.parse(emoji));
 * ```
 */
export const EmojiObjectSchema = z
  .object({
    /** A valid emoji character. @example "🔥" */
    character: z
      .string()
      .regex(EMOJI_CHAR_REGEX_GLOBAL)
      .describe("A valid emoji character. Example: `🔥`."),
    /** A valid emoji code. @example ":fire:" */
    code: z
      .string()
      .regex(EMOJI_CODE_REGEX)
      .describe("A valid emoji code. Example: `:fire:`."),
    /** A name for this emoji. Usually is the same as the code, but without colons. @example "fire"  */
    name: z.string().describe(
      "A name for this emoji. Usually is the same as the code, but without colons. Example: `fire`.",
    ),
  })
  .describe("Emoji object containing the emoji character, code, and name.");
