"use client";

import React, { useState, useEffect } from "react";
import { CalendarClient } from "@/lib/CalendarClient";
import { SyncSource, CalendarProvider } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Settings } from "lucide-react";

interface SourceManagementProps {
	calendarClient: CalendarClient;
	onSourcesChanged?: (sources: SyncSource[]) => void;
}

export const SourceManagementComponent: React.FC<SourceManagementProps> = ({
	calendarClient,
	onSourcesChanged,
}) => {
	const [sources, setSources] = useState<SyncSource[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSources = async () => {
		try {
			setLoading(true);
			const config = await calendarClient.getSyncConfiguration();
			setSources(config.sources || []);
			onSourcesChanged?.(config.sources || []);
		} catch (err) {
			console.error("Error fetching sync sources:", err);
			setError("Failed to load sync sources");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSources();
	}, [calendarClient]);

	const handleDeleteSource = async (sourceId: string) => {
		try {
			await calendarClient.deleteSyncSource(sourceId);
			await fetchSources(); // Refresh the list
		} catch (err) {
			console.error("Error deleting source:", err);
			setError("Failed to delete source");
		}
	};

	const getProviderIcon = (providerType: string) => {
		switch (providerType.toLowerCase()) {
			case "google":
				return "🇬";
			case "microsoft":
				return "🇲";
			case "apple":
				return "🍎";
			case "exchange":
				return "📧";
			case "remote_agent":
				return "🤖";
			default:
				return "📅";
		}
	};

	const getStatusBadgeColor = (enabled: boolean) => {
		return enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
	};

	const formatLastSync = (lastSync?: string) => {
		if (!lastSync) return "Never";
		return new Date(lastSync).toLocaleString();
	};

	if (loading) {
		return (
			<div className="bg-white rounded-lg shadow p-6">
				<h3 className="text-lg font-medium text-gray-900 mb-4">Calendar Sources</h3>
				<div className="animate-pulse">
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-16 bg-gray-200 rounded"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white rounded-lg shadow p-6">
				<h3 className="text-lg font-medium text-gray-900 mb-4">Calendar Sources</h3>
				<div className="text-red-600 text-sm">{error}</div>
				<button
					onClick={fetchSources}
					className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
				>
					Try again
				</button>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow">
			<div className="px-6 py-4 border-b border-gray-200">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-medium text-gray-900">Calendar Sources</h3>
					<div className="flex items-center gap-2">
						<Button
							onClick={fetchSources}
							variant="ghost"
							size="sm"
							className="text-blue-600 hover:text-blue-800"
						>
							Refresh
						</Button>
					</div>
				</div>
			</div>

			{sources.length === 0 ? (
				<div className="px-6 py-8 text-center">
					<p className="text-gray-500">No calendar sources configured</p>
					<p className="text-sm text-gray-400 mt-1">
						Configure OAuth calendars and remote agents as sources first, then set up your destination calendar.
					</p>
				</div>
			) : (
				<div className="divide-y divide-gray-200">
					{sources.map((source) => (
						<div key={source.id} className="px-6 py-4">
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<div className="flex items-center">
										<span className="text-lg mr-2">
											{getProviderIcon(source.providerType)}
										</span>
										<h4 className="text-sm font-medium text-gray-900">
											{source.name}
										</h4>
										<span
											className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
												source.enabled
											)}`}
										>
											{source.enabled ? "Enabled" : "Disabled"}
										</span>
									</div>
									<div className="mt-1 text-sm text-gray-500">
										<div className="flex items-center gap-4">
											<span>Type: {source.providerType}</span>
											<span>Method: {source.syncMethod}</span>
											<span>Direction: {source.syncDirection}</span>
											<span>Frequency: {source.syncFrequency}</span>
										</div>
										{source.calendars.length > 0 && (
											<div className="mt-1">
												Calendars: {source.calendars.length} configured
											</div>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<div className="text-right text-sm text-gray-500">
										<div>Last sync: {formatLastSync(source.lastSync)}</div>
									</div>
									<Button
										onClick={() => handleDeleteSource(source.id)}
										variant="ghost"
										size="sm"
										className="text-red-600 hover:text-red-800"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			<div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
				<p className="text-xs text-gray-600">
					<strong>Setup Flow:</strong> Configure calendar sources (OAuth + Remote Agents) first, then set up your destination calendar in the Sync tab.
				</p>
			</div>
		</div>
	);
};
