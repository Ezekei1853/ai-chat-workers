var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-B4aJbO/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.ts
var typeDefs = `
  type Message {
    id: ID!
    content: String!
    sender: String!
    timestamp: String!
    model: String
  }

  type ChatResponse {
    message: Message!
    success: Boolean!
    error: String
  }

  type HistoryResponse {
    messages: [Message!]!
    success: Boolean!
    error: String
  }

  type DeleteResponse {
    success: Boolean!
    message: String!
    deletedCount: String
  }

  input ChatInput {
    message: String!
    userId: String
  }

  input DeleteHistoryInput {
    userId: String
    messageId: String
  }

  type Query {
    getChatHistory(userId: String): HistoryResponse!
    health: String!
  }

  type Mutation {
    sendMessage(input: ChatInput!): ChatResponse!
    deleteHistory(input: DeleteHistoryInput!): DeleteResponse!
  }
`;
var resolvers = {
  Query: {
    getChatHistory: /* @__PURE__ */ __name(async (_, { userId = "anonymous" }, { env }) => {
      try {
        const messages = [
          {
            id: "1",
            content: "\u4F60\u597D\uFF01\u6211\u662F\u4F60\u7684AI\u52A9\u624B\uFF0C\u6709\u4EC0\u4E48\u53EF\u4EE5\u5E2E\u52A9\u4F60\u7684\u5417\uFF1F",
            sender: "ai",
            timestamp: new Date(Date.now() - 36e5).toISOString(),
            model: "deepseek-chat"
          },
          {
            id: "2",
            content: "\u4ECA\u5929\u5929\u6C14\u600E\u4E48\u6837\uFF1F",
            sender: "user",
            timestamp: new Date(Date.now() - 3e6).toISOString()
          },
          {
            id: "3",
            content: "\u62B1\u6B49\uFF0C\u6211\u65E0\u6CD5\u83B7\u53D6\u5B9E\u65F6\u5929\u6C14\u4FE1\u606F\u3002\u5EFA\u8BAE\u60A8\u67E5\u770B\u5929\u6C14\u9884\u62A5\u5E94\u7528\u6216\u7F51\u7AD9\u83B7\u53D6\u51C6\u786E\u7684\u5929\u6C14\u4FE1\u606F\u3002",
            sender: "ai",
            timestamp: new Date(Date.now() - 29e5).toISOString(),
            model: "deepseek-chat"
          }
        ];
        return {
          messages,
          success: true,
          error: null
        };
      } catch (error) {
        return {
          messages: [],
          success: false,
          error: error.message
        };
      }
    }, "getChatHistory"),
    health: /* @__PURE__ */ __name(() => {
      return "DeepSeek GraphQL API is running";
    }, "health")
  },
  Mutation: {
    sendMessage: /* @__PURE__ */ __name(async (_, { input }, { env }) => {
      try {
        const { message, userId = "anonymous" } = input;
        if (!message || typeof message !== "string") {
          throw new Error("Message is required");
        }
        if (!env.DEEPSEEK_API_KEY) {
          throw new Error("DeepSeek API\u5BC6\u94A5\u672A\u914D\u7F6E");
        }
        const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: "\u4F60\u662F\u4E00\u4E2A\u6709\u7528\u7684AI\u52A9\u624B\uFF0C\u8BF7\u7528\u4E2D\u6587\u56DE\u590D\u7528\u6237\u7684\u95EE\u9898\u3002"
              },
              {
                role: "user",
                content: message
              }
            ],
            max_tokens: 2e3,
            temperature: 0.7,
            stream: false
          })
        });
        if (!deepseekResponse.ok) {
          const error = await deepseekResponse.json().catch(() => ({ error: "Unknown error" }));
          console.error("DeepSeek API Error:", error);
          let errorMessage = "AI\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5";
          if (deepseekResponse.status === 401) {
            errorMessage = "API\u5BC6\u94A5\u65E0\u6548\u6216\u5DF2\u8FC7\u671F";
          } else if (deepseekResponse.status === 429) {
            errorMessage = "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5";
          } else if (deepseekResponse.status === 400) {
            errorMessage = "\u8BF7\u6C42\u53C2\u6570\u9519\u8BEF";
          }
          throw new Error(errorMessage);
        }
        const data = await deepseekResponse.json();
        const reply = data.choices?.[0]?.message?.content || "\u62B1\u6B49\uFF0C\u6211\u6CA1\u6709\u7406\u89E3\u60A8\u7684\u95EE\u9898\u3002";
        const responseMessage = {
          id: Date.now().toString(),
          content: reply,
          sender: "ai",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          model: "deepseek-chat"
        };
        return {
          message: responseMessage,
          success: true,
          error: null
        };
      } catch (error) {
        console.error("Chat mutation error:", error);
        return {
          message: {
            id: Date.now().toString(),
            content: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
            sender: "ai",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          },
          success: false,
          error: error.message
        };
      }
    }, "sendMessage"),
    deleteHistory: /* @__PURE__ */ __name(async (_, { input }, { env }) => {
      try {
        const { userId = "anonymous", messageId } = input;
        const deletedCount = messageId ? "1" : "all";
        const message = messageId ? `\u6D88\u606F ${messageId} \u5DF2\u5220\u9664` : "\u6240\u6709\u804A\u5929\u5386\u53F2\u5DF2\u6E05\u9664";
        return {
          success: true,
          message,
          deletedCount
        };
      } catch (error) {
        console.error("Delete history mutation error:", error);
        return {
          success: false,
          message: "\u5220\u9664\u5931\u8D25: " + error.message,
          deletedCount: "0"
        };
      }
    }, "deleteHistory")
  }
};
async function executeGraphQL(schema, query, variables, context) {
  try {
    const trimmedQuery = query.trim();
    const isQuery = trimmedQuery.startsWith("query") || !trimmedQuery.startsWith("mutation") && !trimmedQuery.startsWith("subscription");
    const isMutation = trimmedQuery.startsWith("mutation");
    if (isQuery) {
      if (trimmedQuery.includes("getChatHistory")) {
        const userId = variables?.userId;
        return await resolvers.Query.getChatHistory(null, { userId }, context);
      } else if (trimmedQuery.includes("health")) {
        return resolvers.Query.health();
      }
    } else if (isMutation) {
      if (trimmedQuery.includes("sendMessage")) {
        const input = variables?.input;
        return await resolvers.Mutation.sendMessage(null, { input }, context);
      } else if (trimmedQuery.includes("deleteHistory")) {
        const input = variables?.input;
        return await resolvers.Mutation.deleteHistory(null, { input }, context);
      }
    }
    throw new Error("Unsupported GraphQL operation");
  } catch (error) {
    throw new Error(`GraphQL execution error: ${error.message}`);
  }
}
__name(executeGraphQL, "executeGraphQL");
var src_default = {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://zcx.icu",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      if (path === "/graphql" && request.method === "GET") {
        const playgroundHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>GraphQL Playground</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css">
          </head>
          <body>
            <div id="root">
              <style>
                body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
                #root { height: 100vh; }
              </style>
              <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8f9fa;">
                <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h1 style="color: #333; margin-bottom: 20px;">GraphQL API</h1>
                  <p style="color: #666; margin-bottom: 30px;">DeepSeek Chat GraphQL API is running</p>
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; text-align: left; font-family: monospace;">
                    <div>POST /graphql</div>
                    <div style="margin-top: 10px; color: #666;">Query: getChatHistory, health</div>
                    <div style="color: #666;">Mutations: sendMessage, deleteHistory</div>
                  </div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
        return new Response(playgroundHTML, {
          headers: {
            "Content-Type": "text/html",
            ...corsHeaders
          }
        });
      }
      if (path === "/graphql" && request.method === "POST") {
        const { query, variables } = await request.json();
        if (!query) {
          return new Response(JSON.stringify({
            errors: [{ message: "Query is required" }]
          }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }
        try {
          const result = await executeGraphQL(typeDefs, query, variables, { env });
          return new Response(JSON.stringify({
            data: result
          }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            errors: [{ message: error.message }]
          }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }
      }
      if (path === "/" && request.method === "GET") {
        return new Response(JSON.stringify({
          status: "ok",
          message: "DeepSeek GraphQL API is running",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          version: "1.0.0",
          endpoints: {
            graphql: "/graphql",
            playground: "/graphql (GET)"
          }
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      return new Response("Not Found", {
        status: 404,
        headers: corsHeaders
      });
    } catch (error) {
      return new Response("Internal Server Error", {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-B4aJbO/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-B4aJbO/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
