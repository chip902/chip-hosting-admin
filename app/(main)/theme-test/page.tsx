"use client";

export default function ThemeTestPage() {
	return (
		<div className="space-y-8">
			<h1 className="text-3xl font-bold text-foreground">Theme Test Page</h1>
			
			<div className="grid gap-4">
				<div className="p-4 bg-card border border-border rounded-lg">
					<h2 className="text-xl font-semibold text-foreground mb-2">Card Component</h2>
					<p className="text-muted-foreground">This is muted text in a card with proper theme colors.</p>
				</div>

				<div className="p-4 bg-muted rounded-lg">
					<h2 className="text-xl font-semibold text-foreground mb-2">Muted Background</h2>
					<p className="text-muted-foreground">This section has a muted background.</p>
				</div>

				<div className="p-4 bg-accent rounded-lg">
					<h2 className="text-xl font-semibold text-accent-foreground mb-2">Accent Background</h2>
					<p className="text-accent-foreground">This section has an accent background.</p>
				</div>

				<div className="p-4 bg-primary text-primary-foreground rounded-lg">
					<h2 className="text-xl font-semibold mb-2">Primary Background</h2>
					<p>This section has a primary background with appropriate text color.</p>
				</div>

				<div className="p-4 bg-secondary text-secondary-foreground rounded-lg">
					<h2 className="text-xl font-semibold mb-2">Secondary Background</h2>
					<p>This section has a secondary background.</p>
				</div>

				<div className="flex gap-4">
					<button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 transition">
						Primary Button
					</button>
					<button className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90 transition">
						Secondary Button
					</button>
					<button className="px-4 py-2 border border-border text-foreground rounded hover:bg-accent hover:text-accent-foreground transition">
						Outline Button
					</button>
				</div>
			</div>
		</div>
	);
}