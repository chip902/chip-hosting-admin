// JARVIS Message API Route
// Handles sending messages to JARVIS service (fallback for non-WebSocket scenarios)

import { NextRequest, NextResponse } from 'next/server';
import { JarvisMessageRequest, JarvisMessageResponse } from '@/types/jarvis';

// Mock JARVIS message processing
async function sendToJarvisService(request: JarvisMessageRequest): Promise<JarvisMessageResponse> {
  const jarvisServiceUrl = process.env.JARVIS_SERVICE_URL || 'http://localhost:8000';
  
  try {
    // Attempt to send to actual JARVIS service
    const response = await fetch(`${jarvisServiceUrl}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error(`JARVIS service responded with status: ${response.status}`);
    }
  } catch (fetchError) {
    console.log('JARVIS service not available, using mock response:', fetchError);
    
    // Mock response for development/testing
    const mockResponse: JarvisMessageResponse = {
      response: `I'm a mock JARVIS response to: "${request.message}". The actual JARVIS service appears to be offline. Please ensure the JARVIS backend is running on ${jarvisServiceUrl}.`,
      metadata: {
        response_time: Math.random() * 1000 + 500, // Mock response time
        confidence: Math.random() * 40 + 60, // Mock confidence 60-100%
        search_sources: ['mock_documents'],
        mcp_enhanced: false,
        confidence_breakdown: {
          search_quality: Math.random() * 30 + 70,
          tool_success: Math.random() * 30 + 70,
          response_quality: Math.random() * 30 + 70,
          model_behavior: Math.random() * 30 + 70,
          overall_score: Math.random() * 40 + 60,
        },
        token_count: Math.floor(Math.random() * 200 + 50),
        model_used: 'mock-model',
        session_id: `mock-session-${Date.now()}`,
      },
      status: 'success',
    };

    return mockResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        {
          error: 'Message is required and must be a string',
          code: 'INVALID_MESSAGE',
        },
        { status: 400 }
      );
    }

    const jarvisRequest: JarvisMessageRequest = {
      message: body.message,
      userId: body.userId || 'anonymous',
      metadata: {
        source: 'text',
        timestamp: Date.now(),
        session_id: body.metadata?.session_id || `session-${Date.now()}`,
        ...body.metadata,
      },
    };

    // Send to JARVIS service
    const startTime = Date.now();
    const response = await sendToJarvisService(jarvisRequest);
    const endTime = Date.now();

    // Add actual response time if not provided
    if (!response.metadata.response_time) {
      response.metadata.response_time = endTime - startTime;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in JARVIS message endpoint:', error);
    
    // Determine error type and status code
    let statusCode = 500;
    let errorCode = 'MESSAGE_ERROR';
    
    if (error instanceof SyntaxError) {
      statusCode = 400;
      errorCode = 'INVALID_JSON';
    } else if (error instanceof TypeError) {
      statusCode = 400;
      errorCode = 'INVALID_REQUEST';
    }
    
    return NextResponse.json(
      {
        error: 'Failed to process JARVIS message',
        code: errorCode,
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      },
      { status: statusCode }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}