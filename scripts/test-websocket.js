#!/usr/bin/env node

/**
 * Simple WebSocket Test for JARVIS
 * Tests WebSocket connection to JARVIS backend
 */

const WebSocket = require('ws');

const JARVIS_WEBSOCKET_URL = 'ws://localhost:8765/ws';

console.log(`🔍 Testing WebSocket connection to: ${JARVIS_WEBSOCKET_URL}`);

const ws = new WebSocket(JARVIS_WEBSOCKET_URL);

ws.on('open', function open() {
  console.log('✅ WebSocket connection established!');
  
  // Send a test message
  const testMessage = {
    type: 'jarvis_message',
    data: {
      message: 'Hello from frontend test',
      userId: 'test-user',
      metadata: {
        source: 'test'
      }
    }
  };
  
  console.log('📤 Sending test message...');
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', function message(data) {
  console.log('📥 Received message:');
  try {
    const parsed = JSON.parse(data.toString());
    console.log(JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log(data.toString());
  }
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket error:', err.message);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
  process.exit(0);
});

// Close connection after 5 seconds if still open
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log('⏰ Closing test connection...');
    ws.close();
  }
}, 5000);