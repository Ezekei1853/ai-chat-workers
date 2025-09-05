/// <reference types="@cloudflare/workers-types" />

interface Env {
  DEEPSEEK_API_KEY: string;
  CHAT_HISTORY?: KVNamespace;
}

// GraphQL 类型定义
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  model?: string;
}

interface ChatInput {
  message: string;
  userId?: string;
}

interface DeleteHistoryInput {
  userId?: string;
  messageId?: string;
}

// GraphQL Schema 定义
const typeDefs = `
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

// GraphQL Resolvers
const resolvers = {
  Query: {
    getChatHistory: async (_: any, { userId = 'anonymous' }: { userId?: string }, { env }: { env: Env }) => {
      try {
        // 这里可以从 KV 存储或数据库获取历史记录
        // 目前返回示例数据
        const messages: Message[] = [
          {
            id: '1',
            content: '你好！我是你的AI助手，有什么可以帮助你的吗？',
            sender: 'ai',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            model: 'deepseek-chat'
          },
          {
            id: '2',
            content: '今天天气怎么样？',
            sender: 'user',
            timestamp: new Date(Date.now() - 3000000).toISOString(),
          },
          {
            id: '3',
            content: '抱歉，我无法获取实时天气信息。建议您查看天气预报应用或网站获取准确的天气信息。',
            sender: 'ai',
            timestamp: new Date(Date.now() - 2900000).toISOString(),
            model: 'deepseek-chat'
          }
        ];

        return {
          messages,
          success: true,
          error: null
        };
      } catch (error: any) {
        return {
          messages: [],
          success: false,
          error: error.message
        };
      }
    },

    health: () => {
      return 'DeepSeek GraphQL API is running';
    }
  },

  Mutation: {
    sendMessage: async (_: any, { input }: { input: ChatInput }, { env }: { env: Env }) => {
      try {
        const { message, userId = 'anonymous' } = input;

        // 验证输入
        if (!message || typeof message !== 'string') {
          throw new Error('Message is required');
        }

        // 检查 API Key
        if (!env.DEEPSEEK_API_KEY) {
          
          throw new Error('DeepSeek API密钥未配置');
        }

        // 调用 DeepSeek API
        const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: '你是一个有用的AI助手，请用中文回复用户的问题。'
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 2000,
            temperature: 0.7,
            stream: false,
          }),
        });

        if (!deepseekResponse.ok) {
          const error = await deepseekResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error('DeepSeek API Error:', error);
          
          let errorMessage = 'AI服务暂时不可用，请稍后重试';
          if (deepseekResponse.status === 401) {
            errorMessage = 'API密钥无效或已过期';
          } else if (deepseekResponse.status === 429) {
            errorMessage = '请求过于频繁，请稍后重试';
          } else if (deepseekResponse.status === 400) {
            errorMessage = '请求参数错误';
          }
          
          throw new Error(errorMessage);
        }

        const data = await deepseekResponse.json();
        const reply = data.choices?.[0]?.message?.content || '抱歉，我没有理解您的问题。';

        // 创建响应消息
        const responseMessage: Message = {
          id: Date.now().toString(),
          content: reply,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          model: 'deepseek-chat'
        };

        // 这里可以保存到 KV 存储
        // if (env.CHAT_HISTORY) {
        //   const historyKey = `history:${userId}`;
        //   const existingHistory = await env.CHAT_HISTORY.get(historyKey);
        //   const history = existingHistory ? JSON.parse(existingHistory) : [];
        //   
        //   // 添加用户消息和AI响应
        //   history.push({
        //     id: (Date.now() - 1).toString(),
        //     content: message,
        //     sender: 'user',
        //     timestamp: new Date().toISOString()
        //   });
        //   history.push(responseMessage);
        //   
        //   await env.CHAT_HISTORY.put(historyKey, JSON.stringify(history));
        // }

        return {
          message: responseMessage,
          success: true,
          error: null
        };

      } catch (error: any) {
        console.error('Chat mutation error:', error);
        
        return {
          message: {
            id: Date.now().toString(),
            content: '服务器内部错误，请稍后重试',
            sender: 'ai',
            timestamp: new Date().toISOString(),
          },
          success: false,
          error: error.message
        };
      }
    },

    deleteHistory: async (_: any, { input }: { input: DeleteHistoryInput }, { env }: { env: Env }) => {
      try {
        const { userId = 'anonymous', messageId } = input;

        // 这里可以实现真实的删除逻辑
        // if (env.CHAT_HISTORY) {
        //   const historyKey = `history:${userId}`;
        //   
        //   if (messageId) {
        //     // 删除特定消息
        //     const existingHistory = await env.CHAT_HISTORY.get(historyKey);
        //     if (existingHistory) {
        //       const history = JSON.parse(existingHistory);
        //       const updatedHistory = history.filter((msg: Message) => msg.id !== messageId);
        //       await env.CHAT_HISTORY.put(historyKey, JSON.stringify(updatedHistory));
        //       
        //       return {
        //         success: true,
        //         message: `消息 ${messageId} 已删除`,
        //         deletedCount: '1'
        //       };
        //     }
        //   } else {
        //     // 删除所有历史记录
        //     await env.CHAT_HISTORY.delete(historyKey);
        //     
        //     return {
        //       success: true,
        //       message: '所有聊天历史已清除',
        //       deletedCount: 'all'
        //     };
        //   }
        // }

        // 模拟删除成功
        const deletedCount = messageId ? '1' : 'all';
        const message = messageId 
          ? `消息 ${messageId} 已删除` 
          : '所有聊天历史已清除';

        return {
          success: true,
          message,
          deletedCount
        };

      } catch (error: any) {
        console.error('Delete history mutation error:', error);
        
        return {
          success: false,
          message: '删除失败: ' + error.message,
          deletedCount: '0'
        };
      }
    }
  }
};

// 简单的 GraphQL 执行器
async function executeGraphQL(schema: string, query: string, variables: any, context: any) {
  // 这是一个简化的 GraphQL 执行器
  // 在生产环境中，建议使用完整的 GraphQL 库如 graphql-js
  
  try {
    // 解析查询类型
    const trimmedQuery = query.trim();
    const isQuery = trimmedQuery.startsWith('query') || (!trimmedQuery.startsWith('mutation') && !trimmedQuery.startsWith('subscription'));
    const isMutation = trimmedQuery.startsWith('mutation');

    if (isQuery) {
      if (trimmedQuery.includes('getChatHistory')) {
        const userId = variables?.userId;
        return await resolvers.Query.getChatHistory(null, { userId }, context);
      } else if (trimmedQuery.includes('health')) {
        return resolvers.Query.health();
      }
    } else if (isMutation) {
      if (trimmedQuery.includes('sendMessage')) {
        const input = variables?.input;
        return await resolvers.Mutation.sendMessage(null, { input }, context);
      } else if (trimmedQuery.includes('deleteHistory')) {
        const input = variables?.input;
        return await resolvers.Mutation.deleteHistory(null, { input }, context);
      }
    }

    throw new Error('Unsupported GraphQL operation');
  } catch (error: any) {
    throw new Error(`GraphQL execution error: ${error.message}`);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://zcx.icu',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // GraphQL Playground (GET 请求到 /graphql)
      if (path === '/graphql' && request.method === 'GET') {
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
            'Content-Type': 'text/html',
            ...corsHeaders,
          },
        });
      }

      // GraphQL 查询处理 (POST 请求到 /graphql)
      if (path === '/graphql' && request.method === 'POST') {
        const { query, variables } = await request.json();
        
        if (!query) {
          return new Response(JSON.stringify({
            errors: [{ message: 'Query is required' }]
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        try {
          const result = await executeGraphQL(typeDefs, query, variables, { env });
          
          return new Response(JSON.stringify({
            data: result
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({
            errors: [{ message: error.message }]
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }

      // 健康检查
      if (path === '/' && request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'DeepSeek GraphQL API is running',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          endpoints: {
            graphql: '/graphql',
            playground: '/graphql (GET)'
          }
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // 404 处理
      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders,
      });

    } catch (error) {
      return new Response('Internal Server Error', {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};