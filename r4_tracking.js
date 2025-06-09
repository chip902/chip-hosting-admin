/**
 * Western Union WebSDK Combined Page View and Link Click Tracking
 * This combined file handles both page view tracking and link click tracking
 * Maintains all functionality from the original pv_R4.js and lc_R4.js files
 */

// === PAGE VIEW TRACKING FUNCTION ===
window.attemptPageViewTracking = function (attempts) {
    // If tracking already happened, exit immediately
    if (typeof WUAnalytics !== "undefined" && WUAnalytics.getPageViewFlag()) {
        _satellite.logger.info("Page view already tracked, skipping duplicate call");
        return;
    }
    attempts = attempts || 0;

    // Force execution of page name data element first to ensure analyticsObject is initialized
    var pagenametmp = _satellite.getVar("WUPageNameJSObject");

    // Log the attempt for debugging
    if (pagenametmp) {
        _satellite.logger.info("Attempting to track page view for: " + pagenametmp + " (attempt " + (attempts + 1) + ")");
    }

    // Check if utility is available
    if (typeof WUAnalytics === "undefined") {
        if (attempts < 10) {  // Increased max attempts from 5 to 10
            // Try again in 100ms, up to 10 times
            _satellite.logger.warn("WUAnalytics not available, retrying in 100ms (attempt " + (attempts + 1) + ")");
            setTimeout(function () {
                WUAnalytics.attemptPageViewTracking(attempts + 1);
            }, 100);
            return;
        } else {
            _satellite.logger.error("WUAnalytics utility not available after 10 attempts. Page view tracking aborted.");
            return;
        }
    }

    // Add preInitialize call here to ensure analyticsObject is ready
    if (typeof WUAnalytics.preInitialize === "function") {
        WUAnalytics.preInitialize();
    }

    // Add detection of SPA page name if the function exists
    var detectedPageName = "";
    if (typeof WUAnalytics.detectSPAPageName === "function") {
        detectedPageName = WUAnalytics.detectSPAPageName();
        if (detectedPageName) {
            _satellite.logger.info("Using detected SPA page name: " + detectedPageName);
        }
    } else {
        _satellite.logger.warn("detectSPAPageName function not available in WUAnalytics");
    }

    try {
        // Reset flag to ensure we're processing events
        if (typeof WUAnalytics.setPageViewFlag === "function") {
            WUAnalytics.setPageViewFlag(false);
        } else {
            _satellite.logger.warn("setPageViewFlag function not available in WUAnalytics");
        }

        // Get XDM with all page view information
        var eventsXDM = WUAnalytics.buildWUPageViewXDM();

        // Ensure page view data and send
        if (eventsXDM) {
            // Critical fix: Explicitly set eventType to page view before sending
            eventsXDM.eventType = "web.webpagedetails.pageViews";

            var finalXDM;
            if (typeof WUAnalytics.ensurePageView === "function") {
                finalXDM = WUAnalytics.ensurePageView(eventsXDM);
            } else {
                _satellite.logger.warn("ensurePageView function not available in WUAnalytics, using basic fallback");
                // Basic fallback to ensure structure
                finalXDM = eventsXDM || {};
                finalXDM.web = finalXDM.web || {};
                finalXDM.web.webPageDetails = finalXDM.web.webPageDetails || {};
                finalXDM.web.webPageDetails.pageViews = finalXDM.web.webPageDetails.pageViews || { value: 1 };
                finalXDM.eventType = "web.webpagedetails.pageViews";
            }

            // Again, make sure it's set as a page view
            finalXDM.eventType = "web.webpagedetails.pageViews";

            // Merge with XDM template before sending
            if (typeof WUAnalytics === "object" && typeof WUAnalytics.mergeXDMWithTemplate === "function") {
                finalXDM = WUAnalytics.mergeXDMWithTemplate(finalXDM);
            } else {
                _satellite.logger.warn("mergeXDMWithTemplate function not available in WUAnalytics, skipping template merge");
            }

            _satellite.setVar('XDM westernunion Merged Object', finalXDM);

            // Log the page view attempt
            _satellite.logger.info("Sending page view for: " + pagenametmp);
            _satellite.logger.info("Page view eventType: " + finalXDM.eventType);

            // Set page view flag right before sending
            if (typeof WUAnalytics.setPageViewFlag === "function") {
                WUAnalytics.setPageViewFlag(true);
            } else {
                _satellite.logger.warn("setPageViewFlag function not available in WUAnalytics");
            }

            // Debug logging for troubleshooting
            _satellite.logger.info("WebPageDetails structure:", JSON.stringify(finalXDM.web.webPageDetails));
            _satellite.logger.info("EventType setting:", finalXDM.eventType);

            // Ensure proper namespace for Western Union data
            if (!finalXDM._westernunion) {
                // Create _westernunion namespace if it doesn't exist
                finalXDM._westernunion = {};
            }

            // Ensure all necessary dimensions are included
            finalXDM._westernunion.pageName = finalXDM._westernunion.pageName || pagenametmp;
            finalXDM._westernunion.country = finalXDM._westernunion.country || WUAnalytics.getDataElement("WUCountryJSObject", "");
            finalXDM._westernunion.product = finalXDM._westernunion.product || "";

            // Add any analytics custom dimensions that might be missing
            if (!finalXDM._experience?.analytics?.customDimensions?.eVars) {
                if (!finalXDM._experience) finalXDM._experience = {};
                if (!finalXDM._experience.analytics) finalXDM._experience.analytics = {};
                if (!finalXDM._experience.analytics.customDimensions) finalXDM._experience.analytics.customDimensions = {};
                if (!finalXDM._experience.analytics.customDimensions.eVars) finalXDM._experience.analytics.customDimensions.eVars = {};
            }

            // Add time parting if available
            if (typeof WUAnalytics.getDataElement === "function") {
                var timePart = WUAnalytics.getDataElement("WUTimePartingJSObject", "");
                if (timePart) {
                    finalXDM._experience.analytics.customDimensions.eVars.eVar43 = timePart;
                }
            }

            // Log the full XDM structure
            _satellite.logger.info("Full XDM structure for page view:", JSON.stringify(finalXDM));

            // Send XDM and handle any errors
            if (typeof WUAnalytics.sendXDM !== "function") {
                _satellite.logger.error("sendXDM function not available in WUAnalytics");
                return;
            }

            WUAnalytics.sendXDM(finalXDM).then(function (result) {
                _satellite.logger.info("Successfully sent page view for: " + pagenametmp);
                // Keep the flag set after success
                if (typeof WUAnalytics === "object") {
                    WUAnalytics.pageViewSent = true;
                }
            }).catch(function (error) {
                _satellite.logger.error("Error sending page view for " + pagenametmp + ": " + error);

                // If we failed, reset the flag so we can try again
                if (typeof WUAnalytics.setPageViewFlag === "function") {
                    WUAnalytics.setPageViewFlag(false);
                }
                if (typeof WUAnalytics === "object") {
                    WUAnalytics.pageViewSent = false;
                }

                // Try again once more after a delay
                if (attempts < 1) {
                    setTimeout(function () {
                        WUAnalytics.attemptPageViewTracking(attempts + 1);
                    }, 500);
                }
            });
        } else {
            _satellite.logger.warn("No XDM data available for page view tracking on " + pagenametmp);

            // If we don't have XDM data yet, retry after a delay
            if (attempts < 2) {
                setTimeout(function () {
                    WUAnalytics.attemptPageViewTracking(attempts + 1);
                }, 300);
            }
        }
    } catch (e) {
        _satellite.logger.error("Error during page view tracking: " + e.message);

        // If we encounter an error, reset the flag so we can try again
        if (typeof WUAnalytics === "function" && typeof WUAnalytics.setPageViewFlag === "function") {
            WUAnalytics.setPageViewFlag(false);
        }
        if (typeof WUAnalytics === "object") {
            WUAnalytics.pageViewSent = false;
        }

        // Try again once more after a delay
        if (attempts < 1) {
            setTimeout(function () {
                WUAnalytics.attemptPageViewTracking(attempts + 1);
            }, 500);
        }
    }
};

// === INITIALIZATION CODE ===
// Set up global window.attemptPageViewTracking function
window.attemptPageViewTracking = attemptPageViewTracking;

// Make sure the page view tracking initiates when the page is ready
document.addEventListener('DOMContentLoaded', function () {
    WUAnalytics.initializeLinkClickListener();
    attemptPageViewTracking();
});

// Also try when the page is fully loaded (some SPAs might need this)
window.addEventListener('load', function () {
    if (typeof WUAnalytics !== "undefined" && !WUAnalytics.getPageViewFlag()) {
        attemptPageViewTracking();
    }
});

// For SPA support, listen for history changes (if this is a SPA)
window.addEventListener('popstate', function () {
    // Reset page view flag when navigation happens
    if (typeof WUAnalytics !== "undefined") {
        WUAnalytics.setPageViewFlag(false);
        WUAnalytics.pageViewSent = false;
        setTimeout(function () {
            attemptPageViewTracking();
        }, 100);
    }
});

// Also listen for custom events that might indicate a SPA navigation
document.addEventListener('spa:navigation', function () {
    if (typeof WUAnalytics !== "undefined") {
        WUAnalytics.setPageViewFlag(false);
        WUAnalytics.pageViewSent = false;
        setTimeout(function () {
            attemptPageViewTracking();
        }, 100);
    }
});

// Store original _satellite.track method
_satellite._originalTrack = _satellite.track;

// Override _satellite.track to handle linkClick events
_satellite.track = function (ruleName) {
    if (ruleName === "linkClick") {
        WUAnalytics.attemptLinkTracking();
    } else {
        // Call original _satellite.track for other rules
        this._originalTrack(ruleName);
    }
};

// Initiate the initial attempt - this will be the first execution when the script loads
attemptPageViewTracking();


function setupTrackingListeners() {
    try {
        _satellite.logger.info("Setting up tracking listeners");

        // Initialize the link click listener first
        try {
            WUAnalytics.initializeLinkClickListener();
            _satellite.logger.info("Link click listener initialized successfully");
        } catch (e) {
            _satellite.logger.error("ERROR setting up link click listener: " + e.message);
            console.error("Link click listener setup failed:", e);
        }

        // Initialize page view tracking
        try {
            attemptPageViewTracking();
            _satellite.logger.info("Page view tracking initialized");
        } catch (e) {
            _satellite.logger.error("ERROR setting up page view tracking: " + e.message);
        }

    } catch (e) {
        console.error("Fatal error during tracking setup:", e);
    }
}

// Set up listeners in multiple ways to ensure they run
// 1. If the DOM is already loaded, run immediately
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("Document already ready, initializing immediately");
    setupTrackingListeners();
}
// 2. Otherwise wait for DOMContentLoaded
else {
    console.log("Waiting for DOMContentLoaded");
    document.addEventListener('DOMContentLoaded', setupTrackingListeners);
}

// 3. Also try on window load (for SPAs or late-loading scripts)
window.addEventListener('load', function () {
    console.log("Window load event - ensuring tracking is initialized");
    // Only initialize if not done already
    if (!window.WUAnalytics || !window.WUAnalytics.clickListenerInitialized) {
        setupTrackingListeners();
    }
});

// 4. Store original _satellite.track method
if (_satellite && !_satellite._originalTrack) {
    _satellite._originalTrack = _satellite.track;

    // Override _satellite.track to handle linkClick events
    _satellite.track = function (ruleName) {
        console.log("_satellite.track called with:", ruleName);
        if (ruleName === "linkClick") {
            WUAnalytics.attemptLinkTracking();
        } else {
            // Call original _satellite.track for other rules
            this._originalTrack(ruleName);
        }
    };
}

// 5. Flag to prevent duplicate initialization
window.WUAnalytics = window.WUAnalytics || {};
window.WUAnalytics.clickListenerInitialized = true;

// 6. Force immediate initialization 
console.log("Forcing immediate initialization");
setupTrackingListeners();