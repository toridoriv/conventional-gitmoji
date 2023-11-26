import { expect } from "./dev-dependencies.ts";
import { Template } from "../source/template.ts";

Deno.test("The constructor of the class Template should initialize the template with the provided value", () => {
  const template = new Template("Hello {name}");

  expect(`${template}`).to.equal("Hello {name}");
});

Deno.test("The constructor of the class Template should initialize the template with the provided value even if it doesn't have placeholders", () => {
  const template = new Template("Hello World");

  expect(`${template}`).to.equal("Hello World");
});

Deno.test("The constructor of the class Template should initialize the template with the provided value and default replacements", () => {
  const defaults = { name: "World" };
  const template = new Template("Hello {name}", defaults);

  expect(`${template}`).to.equal("Hello {name}");
  expect(template.replacements).to.equal(defaults);
});

Deno.test("A template instance should be reusable", () => {
  const template = new Template("Hello {name}");

  const result1 = template.render({ name: "World" });
  const result2 = template.render({ name: "Y'all" });

  expect(`${template}`).to.equal("Hello {name}");
  expect(result1).to.equal("Hello World");
  expect(result2).to.equal("Hello Y'all");
});

Deno.test("The method template.render() should replace a single placeholder in the template when the replacement value it's a string", () => {
  const template = new Template("Peace and love on the planet {planet_name}");

  const result = template.render({ planet_name: "Earth" });

  expect(result).to.equal("Peace and love on the planet Earth");
});

Deno.test("The method template.render() should replace a single placeholder in the template when the replacement value it's a number", () => {
  const template = new Template(
    "{number} is the loneliest number that you'll ever do",
  );

  const result = template.render({ number: 1 });

  expect(result).to.equal("1 is the loneliest number that you'll ever do");
});

Deno.test("The method template.render() should replace a single placeholder in the template when the replacement value it's a boolean", () => {
  const template = new Template("It's the {adjective} kinda love");

  const result = template.render({ adjective: true });

  expect(result).to.equal("It's the true kinda love");
});

Deno.test("The method template.render() should replace multiple unique placeholders", () => {
  const template = new Template("My name is {first_name} {last_name}");

  const result = template.render({ first_name: "Slim", last_name: "Shady" });

  expect(result).to.equal("My name is Slim Shady");
});

Deno.test("The method template.render() should replace multiple repeated placeholders", () => {
  const template = new Template(
    "Their name is {name}. {name} is {age} years old.",
  );

  const result = template.render({ name: "Ariel", age: 20 });

  expect(result).to.equal("Their name is Ariel. Ariel is 20 years old.");
});

Deno.test("The method template.render() should replace placeholders with provided and default replacements", () => {
  const template = new Template("Hello {name}! My age is {age}.", {
    name: "Unknown",
    age: 25,
  });

  const rendered = template.render({ name: "John" });

  expect(rendered).to.equal("Hello John! My age is 25.");
});

Deno.test("The method template.render() should replace placeholders with provided and default replacements, with the provided values having priority", () => {
  const template = new Template("Hello {name}! My age is {age}.", {
    name: "DefaultName",
    age: 25,
  });

  const rendered = template.render({ name: "John", age: 20 });

  expect(rendered).to.equal("Hello John! My age is 20.");
});

Deno.test("The method template.render() should throw an error if it doesn't receive replacements for all the placeholders", () => {
  const template = new Template("Hi {name}!");

  try {
    const result = template.render({});
    expect(result).not.to.be.a("string");
  } catch (e) {
    expect(e).to.be.instanceof(Error);
  }
});

Deno.test("The method template.partialRender() should create a new template instance with the placeholders that didn't receive a replacement", () => {
  const template = new Template("My name is {first_name} {last_name}");

  const result = template.partialRender({ first_name: "Sam" });

  expect(`${result}`).to.equal("My name is Sam {last_name}");
});

Deno.test("The method template.partialRender() should create a new template instance that carries over the default replacements that are still needed", () => {
  const template = new Template("My name is {first_name} {last_name}", {
    first_name: "Unknown",
    last_name: "Unknown",
  });

  const result = template.partialRender({ first_name: "Sam" });

  expect(result.replacements).to.deep.equal({ last_name: "Unknown" });
});
