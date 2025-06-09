import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		// Get the master sync server URL from environment variables
		const masterSyncUrl = process.env.NEXT_PUBLIC_CALENDAR_MICROSERVICE_URL;
		if (!masterSyncUrl) {
			console.error("Master sync server URL not configured");
			return new NextResponse("Server configuration error", { status: 500 });
		}

		if (error) {
			console.error("OAuth error:", error);
			return new NextResponse(`OAuth error: ${error}`, { status: 400 });
		}

		if (!code) {
			console.error("No authorization code provided");
			return new NextResponse("No authorization code provided", { status: 400 });
		}

		// Determine the provider from the state or referer
		let provider = "google"; // Default to google if not specified

		// Try to extract provider from state if it's in the format "provider_123"
		if (state && state.includes("_")) {
			const parts = state.split("_");
			if (parts.length > 0) {
				provider = parts[0];
			}
		} else if (state) {
			// If state doesn't contain underscore, treat it as the provider name
			const validProviders = ["google", "microsoft", "apple", "exchange"];
			if (validProviders.includes(state.toLowerCase())) {
				provider = state.toLowerCase();
			}
		}

		// Build the token exchange URL
		const tokenUrl = `${masterSyncUrl}/api/auth/${provider}/callback`;
		const tokenParams = new URLSearchParams({
			code: code,
			redirect_uri: `${request.nextUrl.origin}/api/calendar/auth/callback`
		});
		if (state) {
			tokenParams.append('state', state);
		}

		if (process.env.NODE_ENV === "development") {
			console.log("Exchanging code for tokens at:", `${tokenUrl}?${tokenParams.toString()}`);
		}

		// Exchange the authorization code for tokens
		const response = await axios.get(`${tokenUrl}?${tokenParams.toString()}`, {
			validateStatus: () => true, // Don't throw on error
		});

		if (process.env.NODE_ENV === "development") {
			console.log("Token exchange response status:", response.status);
			console.log("Token data received:", response.data);
		}

		// If there was an error, return it
		if (response.data.error) {
			console.error("Error exchanging code for tokens:", response.data);

			// Return HTML page that sends error message to parent window
			const errorHtml = `
				<!DOCTYPE html>
				<html>
				<head>
					<title>Authentication Error</title>
					<script>
						(function() {
							function sendErrorMessage() {
								try {
									if (window.opener) {
										window.opener.postMessage({ 
											type: 'oauth-error',
											error: ${JSON.stringify(response.data.error)},
											error_description: ${JSON.stringify(response.data.error_description || "Authentication failed")}
										}, window.location.origin);
										
										setTimeout(() => {
											if (window.opener) {
												window.close();
											}
										}, 500);
									} else {
										setTimeout(sendErrorMessage, 100);
									}
								} catch (e) {
									console.error('Error in sendErrorMessage:', e);
								}
							}
							window.addEventListener('load', sendErrorMessage);
							if (document.readyState === 'complete') {
								sendErrorMessage();
							}
						})();
					</script>
				</head>
				<body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
					<div style="max-width: 500px; margin: 50px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fff5f5;">
						<h2 style="color: #e53e3e;">Authentication Failed</h2>
						<p>There was an error during authentication: ${response.data.error}</p>
						<p style="margin-top: 20px; font-size: 14px; color: #666;">
							This window will close automatically...
						</p>
					</div>
				</body>
				</html>`;

			return new NextResponse(errorHtml, {
				headers: { "Content-Type": "text/html" },
			});
		}

		// Check if we got a successful response with tokens
		if (response.status !== 200 || !response.data) {
			console.error("Invalid response from token exchange:", {
				status: response.status,
				data: response.data,
			});

			// Return HTML page that sends error message to parent window
			const errorHtml = `
				<!DOCTYPE html>
				<html>
				<head>
					<title>Authentication Error</title>
					<script>
						(function() {
							function sendErrorMessage() {
								try {
									if (window.opener) {
										window.opener.postMessage({ 
											type: 'oauth-error',
											error: 'invalid_response',
											error_description: 'Failed to exchange authorization code for tokens'
										}, window.location.origin);
										
										setTimeout(() => {
											if (window.opener) {
												window.close();
											}
										}, 500);
									} else {
										setTimeout(sendErrorMessage, 100);
									}
								} catch (e) {
									console.error('Error in sendErrorMessage:', e);
								}
							}
							window.addEventListener('load', sendErrorMessage);
							if (document.readyState === 'complete') {
								sendErrorMessage();
							}
						})();
					</script>
				</head>
				<body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
					<div style="max-width: 500px; margin: 50px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fff5f5;">
						<h2 style="color: #e53e3e;">Authentication Failed</h2>
						<p>Failed to exchange authorization code for tokens.</p>
						<p style="margin-top: 20px; font-size: 14px; color: #666;">
							This window will close automatically...
						</p>
					</div>
				</body>
				</html>`;

			return new NextResponse(errorHtml, {
				headers: { "Content-Type": "text/html" },
			});
		}

		// Create a simple HTML page that communicates with the opener and closes the popup
		const tokenData = response.data;
		const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Successful</title>
        <script>
          (function() {
            function sendMessage() {
              try {
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'oauth-success',
                    token: ${JSON.stringify(tokenData)},
                    state: ${JSON.stringify(state || "")}
                  }, window.location.origin);
                  
                  // Close the popup after a short delay to ensure the message is sent
                  setTimeout(() => {
                    if (window.opener) {
                      window.close();
                    }
                  }, 500);
                } else {
                  // If no opener, try again shortly
                  console.warn('No opener window found, retrying...');
                  setTimeout(sendMessage, 100);
                }
              } catch (e) {
                console.error('Error in sendMessage:', e);
              }
            }

            // Try to send the message when the page loads
            window.addEventListener('load', sendMessage);
            
            // Also try immediately in case load already happened
            if (document.readyState === 'complete') {
              sendMessage();
            }
          })();
        </script>
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <div style="max-width: 500px; margin: 50px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="color: #4CAF50;">Authentication Successful</h2>
          <p>You have successfully authenticated with your calendar provider.</p>
          <p>This window will close automatically...</p>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            If this window doesn't close automatically, you can safely close it.
          </p>
        </div>
      </body>
      </html>`;

		return new NextResponse(html, {
			headers: {
				"Content-Type": "text/html",
			},
		});
	} catch (error: any) {
		console.error("Error in OAuth callback:", error);

		// Return HTML page that sends error message to parent window
		const errorHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Authentication Error</title>
				<script>
					(function() {
						function sendErrorMessage() {
							try {
								if (window.opener) {
									window.opener.postMessage({ 
										type: 'oauth-error',
										error: ${JSON.stringify(error.message || "Authentication failed")},
										error_description: ${JSON.stringify("An error occurred during authentication")}
									}, window.location.origin);
									
									setTimeout(() => {
										if (window.opener) {
											window.close();
										}
									}, 500);
								} else {
									setTimeout(sendErrorMessage, 100);
								}
							} catch (e) {
								console.error('Error in sendErrorMessage:', e);
							}
						}
						window.addEventListener('load', sendErrorMessage);
						if (document.readyState === 'complete') {
							sendErrorMessage();
						}
					})();
				</script>
			</head>
			<body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
				<div style="max-width: 500px; margin: 50px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fff5f5;">
					<h2 style="color: #e53e3e;">Authentication Failed</h2>
					<p>An error occurred during authentication.</p>
					<p style="margin-top: 20px; font-size: 14px; color: #666;">
						This window will close automatically...
					</p>
				</div>
			</body>
			</html>`;

		return new NextResponse(errorHtml, {
			headers: { "Content-Type": "text/html" },
		});
	}
}
