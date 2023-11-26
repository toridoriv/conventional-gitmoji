import { Configuration } from "../source/configuration.ts";
import { expect } from "./dev-dependencies.ts";

const FIXTURES_DIR_PATH = "./test/fixtures/configuration";

const FIXTURES_PATHS = {
  custom: FIXTURES_DIR_PATH + "/custom.json",
  customOrder: FIXTURES_DIR_PATH + "/custom-order.json",
  defaults: FIXTURES_DIR_PATH + "/defaults.json",
  notValid: FIXTURES_DIR_PATH + "/not-valid.json",
  missing: "path-to-missing-file.json",
};

const RAW_CONFIGURATION = {
  custom: JSON.parse(Deno.readTextFileSync(FIXTURES_PATHS.custom)),
  customOrder: JSON.parse(Deno.readTextFileSync(FIXTURES_PATHS.customOrder)),
  defaults: JSON.parse(Deno.readTextFileSync(FIXTURES_PATHS.defaults)),
  notValid: JSON.parse(Deno.readTextFileSync(FIXTURES_PATHS.notValid)),
};

const EXPECTED_CONFIGURATION_PROPERTIES = [
  "types",
  "aliases",
  "fallback",
  "order",
  "scopes",
];

Deno.test("Configuration.fromFile() creates a new configuration instance with the expected properties when a valid file path is provided", () => {
  const config = Configuration.fromFile(FIXTURES_PATHS.defaults);

  expect(config).to.have.all.keys(EXPECTED_CONFIGURATION_PROPERTIES);
});

Deno.test("Configuration.fromFile() throws an error when an invalid file path is provided", () => {
  const config = Configuration.fromFile.bind(null, FIXTURES_PATHS.missing);

  expect(config).to.throw(Error);
});

Deno.test("Configuration.fromFiles() creates a new configuration instance with the expected properties when valid file paths are provided", () => {
  const config = Configuration.fromFiles(
    FIXTURES_PATHS.defaults,
    FIXTURES_PATHS.custom,
  );

  expect(config).to.have.all.keys(EXPECTED_CONFIGURATION_PROPERTIES);
});

Deno.test("Configuration.fromFiles() merges the default and custom values when valid file paths are provided", () => {
  const config = Configuration.fromFiles(
    FIXTURES_PATHS.defaults,
    FIXTURES_PATHS.custom,
  );
  const requiredKeys = Array.from(
    new Set([
      ...Object.keys(RAW_CONFIGURATION.defaults.types),
      ...Object.keys(RAW_CONFIGURATION.custom.types),
    ]),
  );

  expect(config.fallback).to.equal(RAW_CONFIGURATION.custom.fallback);
  expect(config.types).to.have.all.keys(requiredKeys);
});

Deno.test("Configuration.fromFiles() throws an error when an invalid file path is provided", () => {
  const config = Configuration.fromFiles.bind(
    null,
    FIXTURES_PATHS.defaults,
    FIXTURES_PATHS.missing,
  );

  expect(config).to.throw(Error);
});

Deno.test("Configuration.constructor() adds an index property to commit types based on the sort order provided when creating a new instance", () => {
  const config = Configuration.fromFiles(
    FIXTURES_PATHS.defaults,
    FIXTURES_PATHS.customOrder,
  );

  RAW_CONFIGURATION.customOrder.order.forEach((type: string, index: number) => {
    expect(config.types[type].index).to.equal(index);
  });
});

Deno.test("configuration.findTypeByName() returns the commit type when it exists", () => {
  const config = Configuration.fromFile(FIXTURES_PATHS.defaults);
  const commitType = config.findTypeByName("feat");

  expect(commitType?.type).to.equal("feat");
});

Deno.test("configuration.findTypeByName() returns null when it doesn't exist", () => {
  const config = Configuration.fromFile(FIXTURES_PATHS.defaults);
  const commitType = config.findTypeByName("uwu");

  expect(commitType).to.be.null;
});

Deno.test("configuration.findTypeByAliasName() returns the commit type when the alias exists", () => {
  const config = Configuration.fromFile(FIXTURES_PATHS.defaults);
  const commitType = config.findTypeByAliasName("dependencies");

  expect(commitType?.type).to.equal("build");
});

Deno.test("configuration.findTypeByAliasName() returns null when the alias doesn't exist", () => {
  const config = Configuration.fromFile(FIXTURES_PATHS.defaults);
  const commitType = config.findTypeByAliasName("uwu");

  expect(commitType).to.be.null;
});

Deno.test("configuration.findTypeByEmojiCode() returns the commit type when it exists", () => {
  const config = Configuration.fromFile(FIXTURES_PATHS.defaults);
  const commitType = config.findTypeByEmojiCode(":broom:");

  expect(commitType?.type).to.equal("chore");
});

Deno.test("configuration.findTypeByEmojiCode() returns null when it doesn't exist", () => {
  const config = Configuration.fromFile(FIXTURES_PATHS.defaults);
  const commitType = config.findTypeByEmojiCode(":uwu:");

  expect(commitType).to.be.null;
});

Deno.test("configuration.findAliasByName() returns the commit alias when it exists", () => {
  const config = Configuration.fromFile(FIXTURES_PATHS.defaults);
  const alias = config.findAliasByName("devDependencies");

  expect(alias?.name).to.equal("devDependencies");
});

Deno.test("configuration.findAliasByName() returns null when it doesn't exist", () => {
  const config = Configuration.fromFile(FIXTURES_PATHS.defaults);
  const alias = config.findAliasByName("owo");

  expect(alias).to.be.null;
});

Deno.test("configuration.findAliasByEmojiCode() returns the commit type when it exists", () => {
  const config = Configuration.fromFile(FIXTURES_PATHS.defaults);
  const alias = config.findAliasByEmojiCode(":tada:");

  expect(alias?.name).to.equal("initial");
});

Deno.test("configuration.findAliasByEmojiCode() returns null when it doesn't exist", () => {
  const config = Configuration.fromFile(FIXTURES_PATHS.defaults);
  const alias = config.findAliasByEmojiCode(":owo:");

  expect(alias).to.be.null;
});
