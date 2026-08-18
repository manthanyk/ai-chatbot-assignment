import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app, requestChatCompletion, validateMessages } from "../backend/server.js";

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("validateMessages accepts a complete conversation", () => {
  assert.equal(validateMessages([
    { role: "user", content: "What is JavaScript?" },
    { role: "assistant", content: "A programming language." },
  ]), true);
});

test("validateMessages rejects malformed or empty history", () => {
  assert.equal(validateMessages([]), false);
  assert.equal(validateMessages([{ role: "admin", content: "bad" }]), false);
  assert.equal(validateMessages([{ role: "user", content: "" }]), false);
});

test("health endpoint reports service availability", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "secure-ai-chatbot" });
});

test("chat endpoint validates the request body", async () => {
  const response = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [] }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /messages must be/);
});

test("provider response is converted to a frontend-safe reply", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  const fakeFetch = async (_url, options) => {
    const requestBody = JSON.parse(options.body);
    assert.equal(requestBody.messages.at(-1).content, "Give me an example.");
    assert.equal(options.headers.Authorization, "Bearer test-key");
    return new Response(JSON.stringify({ choices: [{ message: { content: "Here is an example." } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const reply = await requestChatCompletion([
    { role: "user", content: "What is JavaScript?" },
    { role: "assistant", content: "A programming language." },
    { role: "user", content: "Give me an example." },
  ], fakeFetch);
  assert.equal(reply, "Here is an example.");
});
