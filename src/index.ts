/// <reference types="@cloudflare/workers-types" />
// index.ts


interface Env {
  // 可以根据实际需要添加环境变量类型定义
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
  async fetch(request, env, ctx) {
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

      // 路由处理
      if (path === '/chat' && request.method === 'POST') {
        return await handleChat(request, corsHeaders);
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
async function handleChat(request, corsHeaders) {
  try {
    const { message, timestamp } = await request.json();
    
    // 这里添加你的 AI 聊天逻辑
    const reply = `收到消息: ${message}`;
    
    return new Response(JSON.stringify({
      reply,
      timestamp: new Date().toISOString(),
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// 处理删除聊天历史请求
async function handleDeleteHistory(request, corsHeaders) {
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