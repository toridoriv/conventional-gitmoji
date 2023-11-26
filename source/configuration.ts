import { deepMerge } from "https://deno.land/std@0.208.0/collections/deep_merge.ts";
import z from "https://deno.land/x/zod@v3.22.4/index.ts";
import { EmojiObjectSchema } from "./emoji.ts";

const TextSchema = z.string().trim().min(1);

/**
 * Schema for valid release types.
 */
export const ReleaseTypeSchema = z.enum(["major", "minor", "patch"]);

/**
 * Represents a valid release type.
 */
export type ReleaseType = z.TypeOf<typeof ReleaseTypeSchema>;

/**
 * Schema that validates the structure of a commit type definition.
 *
 * @example
 *
 * ```ts
 * import { CommitTypeSchema } from "./gitmoji.ts";
 *
 * const commitType = {
 *   type: "feat",
 *   title: "Features",
 *   description: "A new feature",
 *   semver: "minor",
 *   changelog: true,
 *   emoji: {
 *     character: "✨",
 *     code: ":sparkles:",
 *     name: "sparkles",
 *   },
 * };
 *
 * const isValid = CommitTypeSchema.safeParse(commitType).success;
 *
 * console.assert(isValid);
 * ```
 */
export const CommitTypeSchema = z
  .object({
    /** Unique identifier string for the commit type. @example "feat" */
    type: TextSchema.describe(
      "Unique identifier string for the commit type. Example: `feat`",
    ),
    /** Display title of the commit type. @example "Features" */
    title: TextSchema.describe(
      "Display title of the commit type. Example: `Features`.",
    ),
    /** Longer description of the commit type. @example "A new feature." */
    description: TextSchema.describe(
      "Longer description of the commit type. Example: `A new feature.`",
    ),
    /** Optional release type. @example "minor" */
    semver: ReleaseTypeSchema.nullable().describe(
      "Optional release type. Example: `minor`.",
    ),
    /** Whether changes should be included in changelog. */
    changelog: z
      .boolean()
      .describe("Whether changes should be included in changelog."),
    /** Emoji object associated with this commit type. */
    emoji: EmojiObjectSchema.describe(
      "Emoji object associated with this commit type.",
    ),
  })
  .describe("Structure of a commit type definition.");

/**
 * Represents a commit type definition.
 */
export type CommitType = z.TypeOf<typeof CommitTypeSchema>;

/**
 * Schema that validates the structure of a commit type alias definition.
 *
 * A commit type alias allows alternate names to be used for existing commit types.
 *
 * It has the same structure as a {@link CommitTypeSchema}, except it:
 *
 * - Omits the `title` property
 * - Adds a `name` property for the alias string
 *
 * @example
 *
 * ```ts
 * import { CommitAliasSchema } from "./gitmoji.ts";
 *
 * const alias = {
 *   type: "feat",
 *   name: "initial",
 *   description: "Initiate project",
 *   semver: null,
 *   changelog: false,
 *   emoji: {
 *     character: "🎉",
 *     code: ":tada:",
 *     name: "tada"
 *   }
 * };
 *
 * const isValid = CommitAliasSchema.safeParse(alias);
 *
 * console.assert(isValid);
 * ```
 */
export const CommitAliasSchema = CommitTypeSchema.omit({ title: true }).extend({
  name: TextSchema,
});

/**
 * Represents  commit alias definition.
 * A commit alias allows alternate names to be used for existing commit types.
 */
export type CommitAlias = z.TypeOf<typeof CommitAliasSchema>;

const ConfigurationSchema = z
  .object({
    types: z
      .record(TextSchema, CommitTypeSchema)
      .describe(
        "The commit types mapped to their emoji, title, description, and scope.",
      ),
    aliases: z.record(TextSchema, CommitAliasSchema),
    fallback: TextSchema,
    scopes: z.custom<{ [k: string]: string[] }>(),
    order: z.array(TextSchema).default([]),
  })
  .refine(({ fallback, types }) => fallback in types, {
    message: "The fallback type must be a valid commit type.",
  })
  .transform(function (value) {
    const { scopes } = value;
    const keys = Object.keys(value.types);
    const shape = {} as Record<
      string,
      z.ZodDefault<z.ZodArray<z.ZodString, "many">>
    >;

    for (let i = 0; i < keys.length; i++) {
      shape[keys[i]] = z.array(TextSchema).default([]);

      if (!value.order.includes(keys[i])) {
        value.order.push(keys[i]);
      }
    }

    const schema = z.object(shape);

    Object.assign(value, { scopes: schema.parse(scopes) });
    Object.assign(value, { order: z.array(schema.keyof()).parse(value.order) });

    return value;
  });

export type ConfigurationProperties = z.TypeOf<typeof ConfigurationSchema>;

export interface Configuration extends ConfigurationProperties {
  types: Record<string, CommitType & { index: number }>;
}

/**
 * Configuration class to handle gitmoji configuration data.
 *
 * Provides static methods to load configuration from files,
 * as well as a constructor to create a Configuration instance
 * from a configuration object.
 *
 * @example <caption>Load default configuration from file:</caption>
 *
 * ```ts
 * import { Configuration } from "./configuration.ts";
 *
 * const config = Configuration.fromFile("path/to/config.json");
 * ```
 *
 * @example <caption>Load default and custom configuration from files:</caption>
 *
 * ```ts
 * import { Configuration } from "./configuration.ts";
 *
 * const config = Configuration.fromFiles("default.json", "custom.json");
 * ```
 */
export class Configuration {
  /**
   * Create a Configuration instance from a file containing JSON configuration.
   *
   * @param path - Path to JSON configuration file.
   * @returns Configuration instance.
   */
  static fromFile(path: string) {
    const raw = Deno.readTextFileSync(path);

    return new Configuration(JSON.parse(raw));
  }
  /**
   * Create Configuration instance from default and custom JSON config files.
   * Merges the two configurations with custom taking precedence.
   *
   * @param defaultPath - Path to default JSON configuration.
   * @param customPath - Path to custom JSON configuration.
   * @returns Configuration instance.
   */
  static fromFiles(defaultPath: string, customPath: string) {
    const rawDefaults = JSON.parse(Deno.readTextFileSync(defaultPath));
    const rawCustom = JSON.parse(Deno.readTextFileSync(customPath));
    const merged = deepMerge(rawDefaults, rawCustom);

    if ("order" in rawCustom) {
      merged.order = rawCustom.order;
    }

    return new Configuration(merged as ConfigurationProperties);
  }

  protected constructor(value: z.input<typeof ConfigurationSchema>) {
    Object.assign(this, ConfigurationSchema.parse(value));

    for (const key in this.types) {
      const commitType = this.types[key];

      commitType.index = this.order.indexOf(commitType.type);
    }
  }

  /**
   * Finds a commit type configuration by its name.
   *
   * @param name - The name of the commit type to find.
   * @returns The commit type configuration if found, `null` otherwise.
   */
  public findTypeByName(name: string) {
    if (name in this.types) {
      return this.types[name];
    }

    return null;
  }

  /**
   * Finds a commit type configuration by a commit alias name.
   *
   * Looks up the commit alias with the given name, and if found,
   * returns the associated commit type configuration.
   *
   * @param name - The name of the commit alias to find
   * @returns The commit type configuration if the alias is found,
   * `null` otherwise'
   */
  public findTypeByAliasName(name: string) {
    const alias = this.findAliasByName(name);

    if (alias === null) return null;

    return this.findTypeByName(alias.type);
  }

  /**
   * Finds a commit type configuration by an emoji code.
   *
   * @param emoji - Emoji code string to find
   * @returns Commit type if found, `null` otherwise
   */
  public findTypeByEmojiCode(emoji: string) {
    for (const key in this.types) {
      const type = this.types[key];

      if (type.emoji.code === emoji) {
        return type;
      }
    }

    return null;
  }

  /**
   * Finds a commit alias configuration by its name.
   *
   * @param name - The name of the commit alias to find.
   * @returns The commit alias configuration if found, `null` otherwise.
   */
  public findAliasByName(name: string) {
    if (name in this.aliases) {
      return this.aliases[name];
    }

    return null;
  }

  /**
   * Finds a commit type configuration by an emoji code.
   *
   * @param emoji - Emoji code string to find
   * @returns Commit type if found, `null` otherwise
   */
  public findAliasByEmojiCode(emoji: string) {
    for (const key in this.aliases) {
      const alias = this.aliases[key];

      if (alias.emoji.code === emoji) {
        return alias;
      }
    }

    return null;
  }
}
