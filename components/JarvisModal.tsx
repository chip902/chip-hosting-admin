"use client";

import { useJarvisModal } from "@/hooks/use-jarvis-modal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JarvisChat } from "@/components/JarvisChat";
import { JarvisAudioLevels as JarvisAudioRefresh } from "./JarvisAudioLevels";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useJarvis } from "@/app/hooks/useJarvis";
import { Bot, Wrench } from "lucide-react";

export function JarvisModal() {
	const { isOpen, setIsOpen } = useJarvisModal();
	const { isConnected, status } = useJarvis();
	const [showAudioRefresh, setShowAudioRefresh] = useState(false);

	const handleAudioRefreshComplete = (result: any) => {
		if (result.success) {
			// Audio refresh completed successfully
			console.log("Audio devices refreshed in modal");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0">
				<DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white">
								<Bot className="h-5 w-5" />
							</div>
							<div>
								<DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
									JARVIS Assistant
								</DialogTitle>
								<DialogDescription className="text-sm text-gray-600">
									AI Assistant with Enhanced Search • Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 rounded border">Cmd+K</kbd> to
									open
								</DialogDescription>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{/* Connection Status */}
							<Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
								{isConnected ? (
									<>
										<span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>Online
									</>
								) : (
									<>
										<span className="w-2 h-2 bg-red-400 rounded-full mr-1.5"></span>Offline
									</>
								)}
							</Badge>

							{/* Audio Refresh Toggle */}
							<Button variant="outline" size="sm" onClick={() => setShowAudioRefresh(!showAudioRefresh)} className="text-xs">
								<Wrench className="h-4 w-4 inline mr-1" />Audio Setup
							</Button>
						</div>
					</div>

					{/* Audio Refresh Panel */}
					{showAudioRefresh && (
						<div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
							<div className="flex items-center gap-2 mb-3">
								<span className="text-sm font-medium">Audio Device Management</span>
								<Badge variant="outline" className="text-xs">
									JARVIS Integration
								</Badge>
							</div>
							<JarvisAudioRefresh className="w-full" onRefreshComplete={handleAudioRefreshComplete} />
						</div>
					)}
				</DialogHeader>

				{/* Main Chat Content */}
				<div className="flex-1 min-h-0">
					<JarvisChat
						className="h-full border-none rounded-none"
						showStatus={true}
						enableVoice={true}
						enableStreaming={true}
						showConfidence={true}
						showSources={true}
						theme="auto"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
