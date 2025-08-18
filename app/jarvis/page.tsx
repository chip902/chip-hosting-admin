// app/jarvis/page.tsx
// Example page demonstrating JARVIS integration

import { JarvisChat } from '@/components/JarvisChat';
import { JarvisStatusIndicator } from '@/components/JarvisStatusIndicator';

export default function JarvisPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">JARVIS AI Assistant</h1>
        <p className="text-gray-600">
          Your always-on AI assistant with voice activation and local processing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Panel */}
        <div className="lg:col-span-1">
          <JarvisStatusIndicator variant="full" showDetails={true} />
          
          {/* Quick Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">💡 Quick Tips</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Say "JARVIS" to activate voice mode</li>
              <li>• Type messages or use voice input</li>
              <li>• Conversations are saved to Obsidian</li>
              <li>• Local processing keeps data private</li>
            </ul>
          </div>

          {/* Features */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">🚀 Features</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>✅ Voice activation</li>
              <li>✅ Dual audio input</li>
              <li>✅ Local Ollama AI</li>
              <li>✅ Obsidian memory</li>
              <li>✅ Real-time responses</li>
              <li>🔄 Text-to-speech (coming soon)</li>
              <li>🔄 Command execution (coming soon)</li>
            </ul>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-2">
          <JarvisChat maxHeight="700px" />
        </div>
      </div>
    </div>
  );
}