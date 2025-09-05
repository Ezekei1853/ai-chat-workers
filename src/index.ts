/// <reference types="@cloudflare/workers-types" />
// index.ts

interface Env {
  DEEPSEEK_API_KEY: string; // DeepSeek API密钥环境变量
}

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  reply: string;
  timestamp: string;
}

interface HealthResponse {
  status: string
}

interface ErrorResponse {
  error: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS 头部设置
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://zcx.icu', // 你的前端域名
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24小时
    };

    // 处理预检请求 (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;
     
      if (path === '/' && request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'DeepSeek Chat API is running',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
      
      // 路由处理
      if (path === '/chat' && request.method === 'POST') {
        return await handleChat(request, env, corsHeaders);
      }
      
      if (path === '/chat/history' && request.method === 'GET') {
        return await handleChatHistory(request, corsHeaders);
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

// 处理聊天请求
async function handleChat(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const { message, timestamp } = await request.json();
    
    // 验证输入
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // 检查 API Key
    if (!env.DEEPSEEK_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'DeepSeek API密钥未配置' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // 调用 DeepSeek API
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // DeepSeek的聊天模型
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
        max_tokens: 2000, // DeepSeek支持更长的输出
        temperature: 0.7,
        stream: false, // 不使用流式输出
      }),
    });

    if (!deepseekResponse.ok) {
      const error = await deepseekResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('DeepSeek API Error:', error);
      
      // 处理常见错误
      let errorMessage = 'AI服务暂时不可用，请稍后重试';
      if (deepseekResponse.status === 401) {
        errorMessage = 'API密钥无效或已过期';
      } else if (deepseekResponse.status === 429) {
        errorMessage = '请求过于频繁，请稍后重试';
      } else if (deepseekResponse.status === 400) {
        errorMessage = '请求参数错误';
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const data = await deepseekResponse.json();
    const reply = data.choices?.[0]?.message?.content || '抱歉，我没有理解您的问题。';

    return new Response(JSON.stringify({
      reply,
      timestamp: new Date().toISOString(),
      model: 'deepseek-chat', // 返回使用的模型信息
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Chat handler error:', error);
    
    return new Response(JSON.stringify({ 
      error: '服务器内部错误，请稍后重试' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// 处理聊天历史请求 (示例实现)
async function handleChatHistory(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // 这里可以添加实际的数据库查询逻辑
    // 目前只是返回示例数据
    
    return new Response(JSON.stringify({
      history: [],
      message: '聊天历史功能待实现',
      timestamp: new Date().toISOString(),
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get history',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// 处理删除聊天历史请求
async function handleDeleteHistory(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // 这里可以添加实际的数据库删除逻辑
    // 目前只是返回成功响应
    
    return new Response(JSON.stringify({
      success: true,
      message: '聊天历史已清除',
      timestamp: new Date().toISOString(),
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to delete history',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}