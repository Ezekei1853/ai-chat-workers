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
  status: string;
}

interface ErrorResponse {
  error: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 处理CORS
    const corsHeaders: HeadersInit = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理OPTIONS预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    // API路由
    if (url.pathname === '/api/chat') {
      return handleChat(request, corsHeaders);
    }
    
    if (url.pathname === '/api/health') {
      const healthResponse: HealthResponse = { status: 'ok' };
      return new Response(JSON.stringify(healthResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

async function handleChat(request: Request, corsHeaders: HeadersInit): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { message } = await request.json<ChatRequest>();
    
    // 这里实现你的聊天逻辑
    const response: ChatResponse = {
      reply: `你说了: ${message}`,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse: ErrorResponse = { error: 'Internal Server Error' };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}