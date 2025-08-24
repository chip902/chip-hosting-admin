// JARVIS API Route - Main endpoint
// Provides basic JARVIS information and capabilities

import { NextRequest, NextResponse } from 'next/server';
import { JarvisStatusResponse } from '@/types/jarvis';

export async function GET(request: NextRequest) {
  try {
    const jarvisInfo = {
      name: 'JARVIS',
      version: '2.0.0',
      description: 'AI Assistant with Enhanced Search and MCP Integration',
      capabilities: {
        voice_activation: true,
        text_input: true,
        enhanced_search: true,
        mcp_integration: true,
        confidence_scoring: true,
        audio_streaming: true,
        memory_persistence: true,
        web_search: true,
        document_search: true,
      },
      websocket: {
        url: process.env.NEXT_PUBLIC_JARVIS_WS_URL || 'ws://localhost:8765',
        available: true,
      },
      endpoints: {
        status: '/api/jarvis/status',
        message: '/api/jarvis/message',
        websocket: process.env.NEXT_PUBLIC_JARVIS_WS_URL || 'ws://localhost:8765',
      },
      documentation: {
        readme: 'https://github.com/your-repo/jarvis#readme',
        api: 'https://github.com/your-repo/jarvis/blob/main/API_DOCUMENTATION.md',
      },
    };

    return NextResponse.json(jarvisInfo, { status: 200 });
  } catch (error) {
    console.error('Error getting JARVIS info:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve JARVIS information',
        code: 'JARVIS_INFO_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}