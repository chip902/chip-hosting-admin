"use client";

import React, { useState, useEffect } from "react";
import { CalendarClient } from "@/lib/CalendarClient";
import { RemoteAgent, SyncConfiguration } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

interface RemoteAgentOnlyModeProps {
	calendarClient: CalendarClient;
	onEventsLoaded?: (events: any) => void;
}

export const RemoteAgentOnlyMode: React.FC<RemoteAgentOnlyModeProps> = ({
	calendarClient,
	onEventsLoaded,
}) => {
	const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const syncRemoteAgents = async () => {
		try {
			setSyncStatus("syncing");
			setError(null);

			// Run sync for all remote agent sources
			const config = await calendarClient.getSyncConfiguration();
			const remoteAgentSources = config.sources.filter(
				(source) => source.syncMethod === "agent"
			);

			if (remoteAgentSources.length === 0) {
				throw new Error("No remote agent sources configured");
			}

			// Sync each remote agent source
			for (const source of remoteAgentSources) {
				await calendarClient.runSourceSync(source.id);
			}

			// Fetch updated events
			await onEventsLoaded?.(await calendarClient.getEvents());
			setSyncStatus("success");
		} catch (err: any) {
			console.error("Error syncing remote agents:", err);
			setError(err.message || "Failed to sync remote agents");
			setSyncStatus("error");
		}
	};

	useEffect(() => {
		setLoading(false);
	}, []);

	if (loading) {
		return (
			<div className="flex items-center space-x-2">
				<div className="animate-spin">
					<Loader2 className="h-4 w-4" />
				</div>
				<span className="text-sm text-gray-600">Loading...</span>
			</div>
		);
	}

	return (
		<div className="flex items-center space-x-2">
			<Button
				onClick={syncRemoteAgents}
				variant="outline"
				size="sm"
				disabled={syncStatus === "syncing"}
				className="gap-2"
			>
				<RefreshCw className={`h-4 w-4 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
				{syncStatus === "syncing" ? "Syncing..." : "Sync Agents"}
			</Button>

			{error && (
				<span className="text-xs text-red-600">{error}</span>
			)}
		</div>
	);
};
