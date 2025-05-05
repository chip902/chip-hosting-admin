/**
 * Western Union WebSDK Page View Event Conversion
 * 
 * This code converts the page view event tracking from AppMeasurement format to WebSDK XDM format
 * It maintains all the same conditional logic but outputs an XDM object instead of setting s.events
 * Now uses the WUAnalytics utility for consistent XDM handling
 */

function attemptPageViewTracking(attempts) {
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
                attemptPageViewTracking(attempts + 1);
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

    // Add detection of SPA page name
    var detectedPageName = WUAnalytics.detectSPAPageName();
    if (detectedPageName) {
        _satellite.logger.info("Using detected SPA page name: " + detectedPageName);
    }

    try {
        // Reset flag to ensure we're processing events
        WUAnalytics.setPageViewFlag(false);

        // Get XDM with all page view information
        var eventsXDM = buildWUPageViewXDM();

        // Ensure page view data and send
        if (eventsXDM) {
            // Critical fix: Explicitly set eventType to page view before sending
            eventsXDM.eventType = "web.webpagedetails.pageViews";

            var finalXDM = WUAnalytics.ensurePageView(eventsXDM);

            // Again, make sure it's set as a page view
            finalXDM.eventType = "web.webpagedetails.pageViews";

            _satellite.setVar('XDM westernunion Merged Object', finalXDM);

            // Log the page view attempt
            _satellite.logger.info("Sending page view for: " + pagenametmp);
            _satellite.logger.info("Page view eventType: " + finalXDM.eventType);

            // Set page view flag BEFORE sending to prevent race conditions
            WUAnalytics.setPageViewFlag(true);

            // Send XDM and handle any errors
            WUAnalytics.sendXDM(finalXDM).then(function (result) {
                _satellite.logger.info("Successfully sent page view for: " + pagenametmp);
                // Keep the flag set after success
                WUAnalytics.pageViewSent = true;
            }).catch(function (error) {
                _satellite.logger.error("Error sending page view for " + pagenametmp + ": " + error);

                // If we failed, reset the flag so we can try again
                WUAnalytics.setPageViewFlag(false);
                WUAnalytics.pageViewSent = false;

                // Try again once more after a delay
                if (attempts < 1) {
                    setTimeout(function () {
                        attemptPageViewTracking(attempts + 1);
                    }, 500);
                }
            });
        } else {
            _satellite.logger.warn("No XDM data available for page view tracking on " + pagenametmp);

            // If we don't have XDM data yet, retry after a delay
            if (attempts < 2) {
                setTimeout(function () {
                    attemptPageViewTracking(attempts + 1);
                }, 300);
            }
        }
    } catch (e) {
        _satellite.logger.error("Error during page view tracking: " + e.message);

        // If we encounter an error, reset the flag so we can try again
        WUAnalytics.setPageViewFlag(false);
        WUAnalytics.pageViewSent = false;

        // Try again once more after a delay
        if (attempts < 1) {
            setTimeout(function () {
                attemptPageViewTracking(attempts + 1);
            }, 500);
        }
    }
}

// Make sure the page view tracking initiates when the page is ready
document.addEventListener('DOMContentLoaded', function () {
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

// Initiate the initial attempt
attemptPageViewTracking();


/**
 * Initialize global link click listener for data-linkname attributes now that the
 * page is loaded. This implementation avoids explicit loops for better performance
 */
(function () {
    // Map of known link prefixes/names for efficient lookups
    var knownLinkMap = {
        // Exact matches
        "doddfrankedit": true,
        "mpname-checkbox": true,
        "menu-update-delivery-method": true,
        "update-delivery-method": true,
        "button-add-myself": true,
        "button-add-receiver": true,
        "button-review-continue": true,

        // Common prefixes
        "button-": true,
        "icon-": true,
        "tile-": true,
        "link-": true,
        "btn-": true,
        "ct-": true,
        "select-": true,
        "change-": true,
        "return-": true,
        "edit-": true,
        "continue_details": true,
        "canceltxn-": true,
        "namechange-": true,
        "myreceiver-": true,
        "sendagain-": true,
        "continue-": true,
        "report-fraud-": true,
        "redeem-": true,
        "ifsc-": true,
        "resend-": true,
        "rvw-resend-": true,
        "cont-resend-": true,
        "payment-": true,
        "default-interstitial-": true,
        "sm-interstitial-": true,
        "mywu-": true,
        "yes-cancel-": true,
        "btn-udm-": true,
        "btn-sd-": true,
        "btn-ra-": true,
        "btn-info-": true,
        "btn-upload-": true,
        "btn-signup-": true,
        "btn-login-": true,
        "btn-redeem-": true,
        "btn-learn-": true
    };

    // Regex pattern for special btn- pattern - only used when needed
    var btnCapitalPattern = /^btn-[A-Z-]+$/;

    // Throttle cache to prevent duplicate tracking
    var trackedLinks = {};

    // Function to check if we should track a link
    function shouldTrackLink(linkName) {
        // First check if it's an exact match
        if (knownLinkMap[linkName]) {
            return true;
        }

        // Check for prefix matches
        for (var prefix in knownLinkMap) {
            if (linkName.indexOf(prefix) === 0) {
                return true;
            }
        }

        // Special case for btn-[A-Z-]+ pattern
        if (linkName.indexOf('btn-') === 0 && btnCapitalPattern.test(linkName)) {
            return true;
        }

        return false;
    }

    // Main click event handler using existing knownLinkMap
    document.addEventListener('click', function (event) {
        // Find the clicked element
        var element = event.target;

        // Get link name from element or its parent using various attributes
        var linkName = null;
        var attributeSource = null; // For debugging

        // Try getting data-linkname (primary method)
        if (element.getAttribute && element.getAttribute('data-linkname')) {
            linkName = element.getAttribute('data-linkname');
            attributeSource = 'data-linkname';
        }
        // Then try finding a parent with data-linkname
        else if (element.closest && element.closest('[data-linkname]')) {
            linkName = element.closest('[data-linkname]').getAttribute('data-linkname');
            attributeSource = 'parent-data-linkname';
        }

        // If no linkName yet, try element ID
        if (!linkName && element.id) {
            // Special case handling for specific IDs
            var specialIds = {
                "fundsIn_CreditCard": "fundsin-creditcard-tile"
                // Add more special cases as needed
            };

            if (specialIds[element.id]) {
                linkName = specialIds[element.id];
                attributeSource = 'special-id';
            } else {
                // Use the element ID directly
                linkName = element.id;
                attributeSource = 'id';
            }
        }

        // If no linkName yet, try parent element ID
        if (!linkName && element.closest && element.closest('[id]')) {
            var parent = element.closest('[id]');
            var parentId = parent.id;

            // Special case handling for specific parent IDs
            var specialParentIds = {
                "fundsIn_CreditCard": "fundsin-creditcard-tile"
                // Add more special cases as needed
            };

            if (specialParentIds[parentId]) {
                linkName = specialParentIds[parentId];
                attributeSource = 'special-parent-id';
            } else {
                // Use the parent ID directly
                linkName = parentId;
                attributeSource = 'parent-id';
            }
        }

        // If no linkName yet, try amplitude-id (as a fallback)
        if (!linkName) {
            let specialAmplitudeIds = "";
            // Check for amplitude-id on the element
            if (element.getAttribute && element.getAttribute('amplitude-id')) {
                var amplitudeId = element.getAttribute('amplitude-id');
                // Map for specific amplitude-ids to linkName values
                specialAmplitudeIds = {
                    "tile-fundsin-creditcard": "fundsin-creditcard-tile"
                    // Add more special cases as needed
                };

                linkName = specialAmplitudeIds[amplitudeId] || amplitudeId;
                attributeSource = 'amplitude-id';
            }
            // Check for amplitude-id on parent elements
            else if (element.closest && element.closest('[amplitude-id]')) {
                var parentAmplitudeId = element.closest('[amplitude-id]').getAttribute('amplitude-id');
                linkName = specialAmplitudeIds[parentAmplitudeId] || parentAmplitudeId;
                attributeSource = 'parent-amplitude-id';
            }
        }

        // If still no linkName, check for specific classes
        if (!linkName) {
            // Check specific class combinations that indicate important elements
            if (element.classList) {
                if (element.classList.contains("wu-thumbnail-selected") &&
                    element.classList.contains("wu-payin-thumbnail")) {
                    linkName = "fundsin-creditcard-tile";
                    attributeSource = 'class-combination';
                }
                else if (element.classList.contains("btn-primary")) {
                    // Try to get text content for more specific identification
                    linkName = "btn-" + (element.textContent || "primary").trim().toLowerCase().replace(/\s+/g, '-');
                    attributeSource = 'class-btn-primary';
                }
                else if (element.classList.contains("btn-secondary")) {
                    linkName = "btn-" + (element.textContent || "secondary").trim().toLowerCase().replace(/\s+/g, '-');
                    attributeSource = 'class-btn-secondary';
                }
            }
        }

        // Exit if no link name was found after all checks
        if (!linkName) {
            return;
        }

        // Special handling for mpname-checkbox
        if (linkName === 'mpname-checkbox' && element.tagName === 'INPUT' && (!element.checked)) {
            return;
        }

        // Check if this link should be tracked using the existing knownLinkMap and patterns
        if (shouldTrackLink(linkName)) {
            // Prevent duplicate tracking within 1 second
            var now = new Date().getTime();
            if (trackedLinks[linkName] && (now - trackedLinks[linkName] < 1000)) {
                return;
            }

            trackedLinks[linkName] = now;

            // Log for debugging
            _satellite.logger.info("Detected trackable click: " + linkName + " (via " + attributeSource + ")");

            // Store the link name in data elements and analytics object
            _satellite.setVar("WUDataLinkJSObject", linkName);
            _satellite.setVar("WULinkIDJSObject", linkName);

            if (typeof analyticsObject !== "undefined") {
                analyticsObject.sc_link_name = linkName;

                // Special handling for specific cases
                if (linkName === "fundsin-creditcard-tile") {
                    analyticsObject.sc_fundsin_selected = "creditcard";
                }
            }

            // Trigger the direct call rule
            setTimeout(function () {
                _satellite.track('linkClick');
            }, 50);
        }
    }, true); // Use capture phase to catch all clicks

    _satellite.logger.info("Link click listener initialized");
})();

function buildWUPageViewXDM() {
    // Check if WUAnalytics utility is available
    if (typeof WUAnalytics === "undefined") {
        _satellite.logger.error("WUAnalytics utility not available. Make sure utility/setup rule has fired first.");
        return null;
    }

    // We only want this to run once on page load, using a DTM data element to store that flag
    if (WUAnalytics.getPageViewFlag()) {
        return null; // Already ran this function, so return null
    }

    // Set flag to indicate we've run this function
    WUAnalytics.setPageViewFlag(true);

    // Start with a base XDM object using the utility
    let xdm = WUAnalytics.buildBaseXDM();
    let txn_id = "";
    let campId = "";
    let loginStatus = "";
    let lastPageUrl = document.referrer;


    // IMPORTANT: Force page view structure for all pages
    // This ensures the page view event type is set properly
    xdm.web = xdm.web || {};
    xdm.web.webPageDetails = xdm.web.webPageDetails || {};
    xdm.web.webPageDetails.pageViews = { value: 1 };
    xdm.eventType = "web.webpagedetails.pageViews";

    // Get page name for logging
    var pageName = WUAnalytics.getDataElement("WUPageNameJSObject", "unknown");
    _satellite.logger.info("Capturing page view for: " + pageName);

    // Get page context data elements
    var pagenametmp = WUAnalytics.getDataElement("WUPageNameJSObject", "");
    var country = WUAnalytics.getDataElement("WUCountryJSObject", "");
    var txn_status = WUAnalytics.getDataElement("WUTxnStatusJSObject", "");
    var mtcn = WUAnalytics.getDataElement("WUMtcnJSObject", "");
    var txn_fee = WUAnalytics.getDataElement("WUTransactionFeeJSObject", "");
    var refundAmnt = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
    var verification_failed = WUAnalytics.getAnalyticsObjectValue("sc_id_verification_failed", "");
    var verification_blocked = WUAnalytics.getAnalyticsObjectValue("sc_online_verify", "");
    var verification_success = WUAnalytics.getAnalyticsObjectValue("sc_user_verify", "");
    var id_verification_success = WUAnalytics.getDataElement("WUIdVerifySuccessJSObject", "");
    var linkName = WUAnalytics.getDataElement("WULinkIDJSObject", "");
    var pageNameEvnt = WUAnalytics.getDataElement("WUPagenameForEventObject", "");
    var pageType = WUAnalytics.getDataElement("WUPageTypeJSObject", "");
    var accountid = WUAnalytics.getDataElement("WUAccountJSObject", "");

    // Get product info from base XDM
    var prod = xdm._wu?.product || "";

    // UDM Start
    switch (pageNameEvnt) {
        case "update-delivery-method:start":
            WUAnalytics.addEvent(xdm, 252);
            WUAnalytics.addEvent(xdm, 253);
            break;
        case "update-delivery-method:review":
            WUAnalytics.addEvent(xdm, 254);
            WUAnalytics.addEvent(xdm, 255);
            break;
        case "update-delivery-method:receipt":
            if (mtcn !== "") {
                WUAnalytics.addEvent(xdm, 256);
            }
            break;
        case "update-delivery-method:decline":
        case "update-delivery-method:receiver-assisted:decline":
            WUAnalytics.addEvent(xdm, 257);
            WUAnalytics.addEvent(xdm, 258);
            break;
        case "update-delivery-method:redirect-start":
            WUAnalytics.addEvent(xdm, 259);
            WUAnalytics.addEvent(xdm, 260);
            break;
        case "update-delivery-method:receiver-assisted:start":
            WUAnalytics.addEvent(xdm, 261);
            WUAnalytics.addEvent(xdm, 262);
            break;
        case "update-delivery-method:receiver-assisted:shareinfo":
            WUAnalytics.addEvent(xdm, 263);
            WUAnalytics.addEvent(xdm, 264);
            break;
        case "update-delivery-method:receiver-assisted:review":
            WUAnalytics.addEvent(xdm, 265);
            WUAnalytics.addEvent(xdm, 266);
            break;
        case "update-delivery-method:receiver-assisted:receipt":
            if (mtcn !== "") {
                WUAnalytics.addEvent(xdm, 267);
            }
            break;
    }
    // UDM - End

    // Send Money Receipt Handling
    if (
        pagenametmp !== "" &&
        pagenametmp.indexOf("send-money:receipt-staged") === -1 &&
        pagenametmp.indexOf("send-money:receipt:under-review") === -1 &&
        pagenametmp.indexOf("send-money:receipt:on-hold") === -1 &&
        pagenametmp.indexOf("send-money:receipt") !== -1
    ) {
        if (typeof prod !== "undefined" && prod !== "" && txn_status === "approved") {
            WUAnalytics.setProduct(xdm, prod, txn_fee);
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;
            WUAnalytics.addEvent(xdm, 133, WUAnalytics.getDataElement("WUPrincipalJSObject", 0));
            WUAnalytics.addEvent(xdm, 71, WUAnalytics.getDataElement("WUDiscountAmountJSObject", 0));
            WUAnalytics.addPurchaseEvent(xdm, txn_id);
        }
    }

    // SM - Receipt (Approval)
    else if (pagenametmp !== "" && pagenametmp.indexOf("send-money:confirmationscreen") !== -1) {
        if (typeof prod !== "undefined" && prod !== "" && txn_status === "approved") {
            txn_id = WUAnalytics.getAnalyticsObjectValue("sc_transaction_id", "");
            WUAnalytics.setProduct(xdm, prod, txn_fee);
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;
            WUAnalytics.addEvent(xdm, 133, WUAnalytics.getDataElement("WUPrincipalJSObject", 0));
            WUAnalytics.addEvent(xdm, 71, WUAnalytics.getDataElement("WUDiscountAmountJSObject", 0));
            WUAnalytics.addPurchaseEvent(xdm, txn_id);
        }
    }

    // SM - Kyc Confirmation
    else if (pagenametmp !== "" && pagenametmp.indexOf("bill-pay:receipt") !== -1) {
        if (typeof prod !== "undefined" && prod !== "" && txn_status === "approved") {
            txn_id = WUAnalytics.getAnalyticsObjectValue("sc_transaction_id", "");
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

            // Pass txn_id as serialization parameter
            WUAnalytics.addEvent(xdm, 133, WUAnalytics.getDataElement("WUPrincipalJSObject", 0));
            WUAnalytics.setProduct(xdm, prod, txn_fee);
            WUAnalytics.addPurchaseEvent(xdm, txn_id);
        } else if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
        }
    }

    // PB - Receipt
    else if (pagenametmp !== "" && pagenametmp.indexOf("bill-pay:confirmationscreen") !== -1) {
        if (typeof prod !== "undefined" && prod !== "" && txn_status === "approved") {
            txn_id = WUAnalytics.getAnalyticsObjectValue("sc_transaction_id", "");
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

            // Pass txn_id as serialization parameter
            WUAnalytics.setProduct(xdm, prod, txn_fee);
            WUAnalytics.addEvent(xdm, 133, WUAnalytics.getDataElement("WUPrincipalJSObject", 0));
            WUAnalytics.addPurchaseEvent(xdm, txn_id);
        } else if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        }
    }

    // Inmate - Receipt
    else if (
        pagenametmp !== "" &&
        (pagenametmp.indexOf("send-inmate:inmatereceipt") !== -1 || pagenametmp.indexOf("send-inmate:receipt") !== -1)
    ) {
        if (typeof prod !== "undefined" && prod !== "" && txn_status === "approved") {
            txn_id = WUAnalytics.getAnalyticsObjectValue("sc_transaction_id", "");
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

            WUAnalytics.setProduct(xdm, prod, txn_fee);
            WUAnalytics.addEvent(xdm, 133, WUAnalytics.getDataElement("WUPrincipalJSObject", 0));
            WUAnalytics.addPurchaseEvent(xdm, txn_id);
        } else if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        }
    }

    // Inmate - Kyc Confirmation
    else if (pagenametmp !== "" && pagenametmp.indexOf("send-inmate:confirmationscreen") !== -1) {
        if (typeof prod !== "undefined" && prod !== "" && txn_status === "approved") {
            txn_id = WUAnalytics.getAnalyticsObjectValue("sc_transaction_id", "");
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

            WUAnalytics.setProduct(xdm, prod, txn_fee);
            WUAnalytics.addPurchaseEvent(xdm, txn_id);
        } else if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        }
    }

    // SM - All Decline Scenarios
    else if (
        pagenametmp !== "" &&
        (pagenametmp.indexOf("send-money:declineoptions") !== -1 || pagenametmp.indexOf("send-money:bank-decline-lightbox") !== -1)
    ) {
        if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        } else {
            WUAnalytics.addEvent(xdm, 56);
        }
    }

    // SM - Kyc choose Options
    else if (pagenametmp !== "" && pagenametmp.indexOf("send-money:kycconfirmidentity") !== -1) {
        if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        } else {
            WUAnalytics.addEvent(xdm, 56);
        }
    }

    // SM - Receipt on hold
    else if (pagenametmp !== "" && pagenametmp.indexOf("send-money:receipt:on-hold") !== -1) {
        if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        } else {
            WUAnalytics.addEvent(xdm, 56);
        }
    }

    // SM - Receipt under review
    else if (pagenametmp !== "" && pagenametmp.indexOf("send-money:receipt:under-review") !== -1) {
        if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        } else {
            WUAnalytics.addEvent(xdm, 56);
        }
    }

    // Pay-bills - Kyc choose Options
    else if (pagenametmp !== "" && pagenametmp.indexOf("bill-pay:kycconfirmidentity") !== -1) {
        if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        } else {
            WUAnalytics.addEvent(xdm, 56);
        }
    }

    // Pay-bills - bank decline
    else if (pagenametmp !== "" && pagenametmp.indexOf("bill-pay:bank-decline-lightbox") !== -1) {
        if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        } else {
            WUAnalytics.addEvent(xdm, 56);
        }
    }

    // Pay-bills - decline options
    else if (pagenametmp !== "" && pagenametmp.indexOf("bill-pay:declineoptions") !== -1) {
        if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        } else {
            WUAnalytics.addEvent(xdm, 56);
        }
    }

    // Inmate - Kyc options
    else if (pagenametmp !== "" && pagenametmp.indexOf("send-inmate:kycconfirmidentity") !== -1) {
        if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        } else {
            WUAnalytics.addEvent(xdm, 56);
        }
    }

    // Inmate - bank decline light box
    else if (pagenametmp !== "" && pagenametmp.indexOf("send-inmate:bank-decline-lightbox") !== -1) {
        if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        } else {
            WUAnalytics.addEvent(xdm, 56);
        }
    }

    // Inmate - wu-pay -and -cash decline light box
    else if (pagenametmp !== "" && pagenametmp.indexOf("send-inmate:declineoptions") !== -1) {
        if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
            WUAnalytics.addEvent(xdm, 56);
            WUAnalytics.addEvent(xdm, 34);
        } else {
            WUAnalytics.addEvent(xdm, 56);
        }
    }

    // DUT KYC - Info Page
    else if (pagenametmp !== "" && pagenametmp.indexOf("kyc:info") !== -1) {
        WUAnalytics.addEvent(xdm, 277);
        WUAnalytics.addEvent(xdm, 285);
    }

    // DUT KYC - Upload Page
    else if (pagenametmp !== "" && pagenametmp.indexOf("kyc:upload") !== -1 && !pagenametmp.includes("kyc:upload-")) {
        WUAnalytics.addEvent(xdm, 278);
        WUAnalytics.addEvent(xdm, 286);

        xdm._experience.analytics.customDimensions.eVars.eVar75 = _satellite.cookie.get("uniRefNumCookie");
        _satellite.cookie.remove("uniRefNumCookie");
    }

    // DUT KYC - Success Page
    else if (pagenametmp !== "" && pagenametmp.indexOf("kyc:success") !== -1) {
        WUAnalytics.addEvent(xdm, 279);
        WUAnalytics.addEvent(xdm, 287);
    }

    // Special case for Spanish doctransfer page
    else if (country == "es" && pagenametmp !== "" && pagenametmp.indexOf("send-money:doctransfer") !== -1) {
        if (lastPageUrl != "undefined" && lastPageUrl !== "" && lastPageUrl.indexOf("review.html") !== -1 && txn_status === "c2001") {
            if (typeof prod !== "undefined" && prod !== "") {
                WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
                WUAnalytics.addEvent(xdm, 56);
                WUAnalytics.addEvent(xdm, 34);
            } else {
                WUAnalytics.addEvent(xdm, 56);
            }
        }
    }

    // Default case - set product if available, and handle all the other conditions
    else {
        if (typeof prod !== "undefined" && prod !== "") {
            WUAnalytics.setProduct(xdm, prod, 0);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("fraudprotection") === -1) {
            // SM - Start
            if (pagenametmp !== "" && pagenametmp.indexOf("send-money:start") !== -1) {
                _satellite.cookie.remove("SM_Start_Cookie");
                if (country) {
                    if (country !== "us") {
                        var principal = WUAnalytics.getAnalyticsObjectValue("sc_principal", "");
                        if (principal !== "") {
                            WUAnalytics.addEvent(xdm, 6);
                            WUAnalytics.addEvent(xdm, 67);
                        }
                    }
                }

                loginStatus = WUAnalytics.getAnalyticsObjectValue("sc_login_state", "");
                if (loginStatus === "loggedin") {
                    WUAnalytics.addEvent(xdm, 5);
                    WUAnalytics.addEvent(xdm, 11);
                    _satellite.cookie.set("SM_Start_Cookie", "true");
                }

                var selectedText = "";
                var countrySelect = document.getElementById("wu-country-list");
                if (countrySelect !== null && countrySelect !== undefined) {
                    selectedText = countrySelect.options[countrySelect.selectedIndex].text;
                }
                if (selectedText !== "" && selectedText !== null && selectedText !== undefined && selectedText.trim().toLowerCase() === "service unavailable") {
                    xdm._experience.analytics.customDimensions.eVars.eVar61 = "service unavailable";
                    WUAnalytics.addEvent(xdm, 206);
                }
            }

            // SM - Receiver
            if (pagenametmp !== "" && pagenametmp.indexOf("send-money:receiverinformation") !== -1) {
                if (_satellite.cookie.get("SM_Start_Cookie") && _satellite.cookie.get("SM_Start_Cookie") === "true") {
                    WUAnalytics.addEvent(xdm, 7);
                    WUAnalytics.addEvent(xdm, 12);
                } else {
                    _satellite.cookie.set("SM_Start_Cookie", "true");
                    WUAnalytics.addEvent(xdm, 5);
                    WUAnalytics.addEvent(xdm, 7);
                    WUAnalytics.addEvent(xdm, 11);
                    WUAnalytics.addEvent(xdm, 12);
                }

                if (analyticsObject.sc_quicksend_id) {
                    campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") !== "") {
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
                }
            }

            // SM - Payment
            if (pagenametmp !== "" && pagenametmp.indexOf("send-money:paymentinformation") !== -1) {
                WUAnalytics.addEvent(xdm, 8);
                WUAnalytics.addEvent(xdm, 13);

                if (analyticsObject.sc_quicksend_id) {
                    campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") !== "") {
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
                }
            }

            // SM - Review
            if (pagenametmp !== "" && pagenametmp.indexOf("send-money:review") !== -1) {
                WUAnalytics.addEvent(xdm, 9);
                WUAnalytics.addEvent(xdm, 14);

                if (analyticsObject.sc_quicksend_id) {
                    campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") !== "") {
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
                }
            }
        }

        // SM - Confirm Identity
        if (pagenametmp !== "" && pagenametmp.indexOf("send-money:confirmidentity") !== -1) {
            if (analyticsObject.sc_quicksend_id) {
                ampId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
            } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") !== "") {
                xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
            }
        }

        // SM - Global Collect ID
        if (pagenametmp !== "" && pagenametmp.indexOf("send-money:globalcollectid") !== -1) {
            if (analyticsObject.sc_quicksend_id) {
                campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
            } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") !== "") {
                xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
            }
        }

        // SM - WU Pay Receipt
        if (
            pagenametmp !== "" &&
            (pagenametmp.indexOf("send-money:sendmoneywupayreceipt") !== -1 ||
                pagenametmp.indexOf("send-money:wire-complete") !== -1 ||
                pagenametmp.indexOf("send-money:sendmoneypartnerfundsreceipt") !== -1)
        ) {
            if (mtcn !== "") {
                WUAnalytics.addEvent(xdm, 64);
                WUAnalytics.addEvent(xdm, 34);

                if (typeof prod !== "undefined" && prod !== "") {
                    WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
                }
            }
        }

        // PB - Start
        if (pagenametmp !== "" && pagenametmp.indexOf("bill-pay:start") !== -1) {
            _satellite.cookie.remove("BillPay_Start_Cookie");
            loginStatus = WUAnalytics.getAnalyticsObjectValue("sc_login_state", "");
            if (loginStatus === "loggedin") {
                WUAnalytics.addEvent(xdm, 121);
                WUAnalytics.addEvent(xdm, 126);
                _satellite.cookie.set("BillPay_Start_Cookie", "true");
            }
        }

        // PB - Biller Information
        if (pagenametmp !== "" && pagenametmp.indexOf("bill-pay:requiredbillerinformation") !== -1) {
            WUAnalytics.addEvent(xdm, 121);
            WUAnalytics.addEvent(xdm, 122);
            WUAnalytics.addEvent(xdm, 126);
            WUAnalytics.addEvent(xdm, 127);
        }

        // PB - Payment Information
        if (pagenametmp !== "" && pagenametmp.indexOf("bill-pay:paymentinformation") !== -1) {
            if (_satellite.cookie.get("BillPay_Start_Cookie") && _satellite.cookie.get("BillPay_Start_Cookie") === "true") {
                WUAnalytics.addEvent(xdm, 123);
                WUAnalytics.addEvent(xdm, 128);
            } else {
                WUAnalytics.addEvent(xdm, 121);
                WUAnalytics.addEvent(xdm, 123);
                WUAnalytics.addEvent(xdm, 126);
                WUAnalytics.addEvent(xdm, 128);
                _satellite.cookie.set("BillPay_Start_Cookie", "true");
            }
        }

        // PB - Review
        if (pagenametmp !== "" && pagenametmp.indexOf("bill-pay:review") !== -1) {
            WUAnalytics.addEvent(xdm, 124);
            WUAnalytics.addEvent(xdm, 129);
        }

        // Inmate - Start
        if (pagenametmp !== "" && pagenametmp.indexOf("send-inmate:start") !== -1) {
            _satellite.cookie.remove("SendInmate_Start_Cookie");
            loginStatus = WUAnalytics.getAnalyticsObjectValue("sc_login_state", "");
            if (loginStatus === "loggedin") {
                WUAnalytics.addEvent(xdm, 18);
                WUAnalytics.addEvent(xdm, 23);
                _satellite.cookie.set("SendInmate_Start_Cookie", "true");
            }
        }

        // Inmate - Receiver
        if (pagenametmp !== "" && pagenametmp.indexOf("send-inmate:inmatereceiverinformation") !== -1) {
            WUAnalytics.addEvent(xdm, 18);
            WUAnalytics.addEvent(xdm, 19);
            WUAnalytics.addEvent(xdm, 23);
            WUAnalytics.addEvent(xdm, 24);
        }

        // Inmate - Payment
        if (pagenametmp !== "" && pagenametmp.indexOf("send-inmate:inmatepaymentinformation") !== -1) {
            if (_satellite.cookie.get("SendInmate_Start_Cookie") && _satellite.cookie.get("SendInmate_Start_Cookie") === "true") {
                WUAnalytics.addEvent(xdm, 20);
                WUAnalytics.addEvent(xdm, 25);
            } else {
                WUAnalytics.addEvent(xdm, 18);
                WUAnalytics.addEvent(xdm, 23);
                WUAnalytics.addEvent(xdm, 20);
                WUAnalytics.addEvent(xdm, 25);
                _satellite.cookie.set("SendInmate_Start_Cookie", "true");
            }
        }

        // Inmate - Review
        if (pagenametmp !== "" && pagenametmp.indexOf("send-inmate:inmatereview") !== -1) {
            WUAnalytics.addEvent(xdm, 21);
            WUAnalytics.addEvent(xdm, 26);
        }

        // Price Estimate - Start
        if (
            pagenametmp !== "" &&
            (pagenametmp.indexOf("price-estimator:continue") !== -1 ||
                pagenametmp.indexOf("price-estimator:performestimatedfeeinquiry") !== -1 ||
                pagenametmp.indexOf("send-inmate:performestimatedinmatefeeinquiry") !== -1)
        ) {
            WUAnalytics.addEvent(xdm, 30);
        }

        // Search - Results pages
        if (pagenametmp !== "" && pagenametmp.indexOf("search:results") !== -1) {
            WUAnalytics.addEvent(xdm, 33);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("search:no-results") !== -1) {
            WUAnalytics.addEvent(xdm, 33);
        }

        // Password recovery pages
        if (
            pagenametmp !== "" &&
            pagenametmp.indexOf("password-recovery") !== -1 &&
            pagenametmp.indexOf("securityquestion") === -1 &&
            pagenametmp.indexOf("emailsent") === -1 &&
            pagenametmp.indexOf("resetpassword") === -1
        ) {
            WUAnalytics.addEvent(xdm, 53);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("password-recovery:resetpassword") !== -1) {
            WUAnalytics.addEvent(xdm, 66);
        }

        // Registration pages
        if (
            pageNameEvnt !== "" &&
            (pageNameEvnt === "send-money:register" ||
                pageNameEvnt === "register" ||
                pageNameEvnt === "send-inmate:register" ||
                pageNameEvnt === "register:sm-login" ||
                pageNameEvnt === "bill-pay:register")
        ) {
            WUAnalytics.addEvent(xdm, 89);
            WUAnalytics.addEvent(xdm, 92);
        }

        // Profile pages
        if (pagenametmp !== "" && pagenametmp.indexOf("profile:personal-info") !== -1) {
            if (
                analyticsObject.sc_link_name &&
                analyticsObject.sc_link_name !== "" &&
                (analyticsObject.sc_link_name.toLowerCase() === "save-password" || analyticsObject.sc_link_name.toLowerCase() === "button-save-password")
            ) {
                xdm._experience.analytics.customDimensions.eVars.eVar61 = analyticsObject.sc_link_name;
                WUAnalytics.addEvent(xdm, 184);
            } else {
                xdm._experience.analytics.customDimensions.eVars.eVar61 = "link-profile-icon";
                if (linkName !== "") {
                    switch (linkName) {
                        case "save-address":
                        case "button-save-address":
                        case "save-securityques":
                        case "button-save-securityques":
                        case "confirm-pin":
                            WUAnalytics.addEvent(xdm, 184);
                            break;
                    }
                }
            }
        }

        // Link click events
        if (pagenametmp !== "" && pagenametmp.indexOf("profile:edit-address") !== -1) {
            if ("edit-address" === linkName || "icon-edit-address" === linkName) {
                WUAnalytics.addEvent(xdm, 183);
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("profile:edit-password") !== -1) {
            if ("edit-password" === linkName || "icon-edit-password" === linkName) {
                WUAnalytics.addEvent(xdm, 183);
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("profile:edit-securityques") !== -1) {
            if ("edit-securityques" === linkName || "icon-edit-securityques" === linkName) {
                WUAnalytics.addEvent(xdm, 183);
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("profile:edit-email") !== -1) {
            if ("edit-email" === linkName || "icon-edit-email" === linkName) {
                WUAnalytics.addEvent(xdm, 183);
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("my-receivers:edit-receiver") !== -1) {
            if ("mysmreceiver-edit" === linkName || "mybillpayreceiver-edit" === linkName || "myinmatereceiver-edit" === linkName) {
                WUAnalytics.addEvent(xdm, 183);
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("my-receivers:add-receiver") !== -1) {
            if ("myreceiver-add" === linkName) {
                WUAnalytics.addEvent(xdm, 183);
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        // Links from MyWU Portal
        if (WUAnalytics.getQueryParam("sln")) {
            WUAnalytics.addEvent(xdm, 183);
            xdm._experience.analytics.customDimensions.eVars.eVar61 = WUAnalytics.getQueryParam("sln");
        }

        // HSFP handling
        if (WUAnalytics.getQueryParam("partnerName")) {
            _satellite.cookie.set("hsfp_partner", WUAnalytics.getQueryParam("partnerName"));
        }

        if (_satellite.cookie.get("hsfp_partner")) {
            xdm._experience.analytics.customDimensions.eVars.eVar71 = _satellite.cookie.get("hsfp_partner").toLowerCase();
            _satellite.cookie.remove("hsfp_partner");
        }

        if (analyticsObject.sc_sso_status == "true") {
            WUAnalytics.addEvent(xdm, 234);
        }

        // KYC pages
        if (pagenametmp !== "" && pagenametmp.indexOf("kyc:lookup") !== -1) {
            if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() !== "no") {
                WUAnalytics.addEvent(xdm, 77);
            }
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("kyc:docupload") !== -1) {
            if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() !== "no") {
                WUAnalytics.addEvent(xdm, 78);
            }
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("kyc:upload-success") !== -1) {
            if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() !== "no") {
                WUAnalytics.addEvent(xdm, 79);
            }
        }

        // Send money send again
        if (pagenametmp !== "" && pagenametmp.indexOf("send-money:sendagain") !== -1) {
            WUAnalytics.addEvent(xdm, 5);
            WUAnalytics.addEvent(xdm, 11);

            if (analyticsObject.sc_quicksend_id) {
                campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
            } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") !== "") {
                xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
            }
        }

        // Cancel transfer flows
        if (pagenametmp !== "" && pagenametmp.indexOf("cancel-transfer:reason") !== -1) {
            xdm._experience.analytics.customDimensions.listProps.list2 = analyticsObject.sc_ab_testing ? analyticsObject.sc_ab_testing.toLowerCase() : "";
            xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
            WUAnalytics.addEvent(xdm, 218);
            WUAnalytics.addEvent(xdm, 219);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("cancel-transfer:receipt-transfer-cont") !== -1) {
            xdm._experience.analytics.customDimensions.eVars.eVar61 = "canceltxn-abandoned";
            xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
            WUAnalytics.addEvent(xdm, 183);
        }

        if (
            pagenametmp !== "" &&
            (pagenametmp.indexOf("cancel-transfer:review-full-refund") !== -1 || pagenametmp.indexOf("cancel-transfer:review-pr-refund") !== -1)
        ) {
            xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");

            if (WUAnalytics.getDataElement("WULinkDisplayJSObject", "") !== "" && WUAnalytics.getDataElement("WULinkDisplayJSObject", "") !== "null") {
                xdm._experience.analytics.customDimensions.listProps.list1 = WUAnalytics.getDataElement("WULinkDisplayJSObject", "");
                WUAnalytics.addEvent(xdm, 206);
            }

            WUAnalytics.addEvent(xdm, 185);
            WUAnalytics.addEvent(xdm, 186);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("cancel-transfer:receipt-full-refund") !== -1) {
            xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar21 = "refunded";

            if (mtcn !== "") {
                WUAnalytics.addEvent(xdm, 189);
                WUAnalytics.addEvent(xdm, 198, refundAmnt);
                WUAnalytics.addEvent(xdm, 199, txn_fee);
            }

            WUAnalytics.setProduct(xdm, "", -txn_fee);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("cancel-transfer:receipt-pr-refund") !== -1) {
            xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar21 = "refunded";

            if (mtcn !== "") {
                WUAnalytics.addEvent(xdm, 189);
                WUAnalytics.addEvent(xdm, 198, refundAmnt);
            }
        }

        // More cancel transfer handling
        if (pagenametmp !== "" && pagenametmp.indexOf("cancel-transfer:case-request") !== -1) {
            xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("cancel-transfer:declined") !== -1) {
            xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
        }

        // Request Money flow
        if (pagenametmp !== "" && pagenametmp.indexOf("request-money:estimate") !== -1) {
            WUAnalytics.addEvent(xdm, 172);
            WUAnalytics.addEvent(xdm, 173);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("request-money:receiverinfo") !== -1) {
            WUAnalytics.addEvent(xdm, 174);
            WUAnalytics.addEvent(xdm, 175);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("request-money:complete") !== -1) {
            WUAnalytics.addEvent(xdm, 180);
        }

        // Pickup cash flow
        if (pagenametmp !== "" && pagenametmp.indexOf("pickupcash:start") !== -1) {
            WUAnalytics.addEvent(xdm, 160);
            WUAnalytics.addEvent(xdm, 161);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("pickupcash:senderinfo") !== -1) {
            if (sessionStorage.getItem("sc_links")) {
                var sclink = sessionStorage.getItem("sc_links");
                if (sclink.indexOf("website:tracktransfer:details") !== -1) {
                    if ("mx" === country) {
                        WUAnalytics.addEvent(xdm, 160);
                        WUAnalytics.addEvent(xdm, 161);
                        WUAnalytics.addEvent(xdm, 162);
                        WUAnalytics.addEvent(xdm, 163);
                    } else {
                        WUAnalytics.addEvent(xdm, 160);
                        WUAnalytics.addEvent(xdm, 161);
                    }
                }
            }

            WUAnalytics.addEvent(xdm, 164);
            WUAnalytics.addEvent(xdm, 165);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("pickupcash:senderinfo:namemismatch") !== -1) {
            WUAnalytics.addEvent(xdm, 166);
            WUAnalytics.addEvent(xdm, 167);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("pickupcash:securityquestion") !== -1) {
            WUAnalytics.addEvent(xdm, 168);
            WUAnalytics.addEvent(xdm, 169);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("pickupcash:confirm") !== -1) {
            WUAnalytics.addEvent(xdm, 170);
            WUAnalytics.addEvent(xdm, 171);
        }

        // Send money receipt staged
        if (pagenametmp !== "" && pagenametmp.indexOf("send-money:receipt-staged") !== -1) {
            let tempmtcn = "";
            if (
                typeof analyticsObject.sc_transaction_id !== "undefined" &&
                analyticsObject.sc_transaction_id !== "" &&
                analyticsObject.sc_transaction_id !== null
            ) {
                var tid = analyticsObject.sc_transaction_id.toLowerCase();
                tempmtcn = tid.slice(6).trim();
            }

            xdm._experience.analytics.customDimensions.eVars.eVar20 = tempmtcn;
            xdm._experience.analytics.customDimensions.eVars.eVar21 = "staged";
            WUAnalytics.addEvent(xdm, 118);
            WUAnalytics.addEvent(xdm, 120, txn_fee);
        }

        // Handle cookie cleanup
        if (pagenametmp !== "" && (pagenametmp.indexOf("profile:txn-history") !== -1 || pagenametmp.indexOf("track-transfer") !== -1)) {
            _satellite.cookie.remove("cancelTransferMTChannel");
        }

        // Login success
        if (WUAnalytics.getDataElement("WULoginSuccessJSObject", false)) {
            xdm._experience.analytics.customDimensions.eVars.eVar42 = "login";
            _satellite.cookie.remove("NewUserCookie");

            if (!(country === "us" && pagenametmp !== "" && pagenametmp.indexOf("contactus") !== -1)) {
                WUAnalytics.addEvent(xdm, 2);
            }
        }

        // Registration success (non-NZ)
        if (country && "nz" !== country) {
            if (WUAnalytics.getDataElement("WURegisterSuccessJSObject", false)) {
                xdm._experience.analytics.customDimensions.eVars.eVar42 = "register";

                if (_satellite.cookie.get("mywuoptin") === "yes") {
                    xdm._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin";
                    WUAnalytics.addEvent(xdm, 40);
                }

                _satellite.cookie.set("NewUserCookie", true, { expires: 1 });
                WUAnalytics.addEvent(xdm, 4);

                // 3rdparty data user consent
                if (analyticsObject.sc_3rdPartyDataOptin !== undefined) {
                    WUAnalytics.addEvent(xdm, 299);
                    xdm._experience.analytics.customDimensions.eVars.eVar81 = analyticsObject.sc_3rdPartyDataOptin ? "consent-accepted" : "consent-denied";
                    analyticsObject.sc_3rdPartyDataOptin = undefined;
                    sessionStorage.removeItem("DTM-3rdPartyDataOptin");
                }
            }
        }
        // Registration success (NZ)
        else if (country && "nz" === country) {
            if (WUAnalytics.getDataElement("WUPageTypeJSObject", "") && WUAnalytics.getDataElement("WUPageTypeJSObject", "") === "responsive") {
                if (WUAnalytics.getDataElement("WURegisterSuccessJSObject", false)) {
                    xdm._experience.analytics.customDimensions.eVars.eVar42 = "register";

                    if (_satellite.cookie.get("mywuoptin") === "yes") {
                        xdm._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin";
                        WUAnalytics.addEvent(xdm, 40);
                    }

                    _satellite.cookie.set("NewUserCookie", true, { expires: 1 });
                    WUAnalytics.addEvent(xdm, 4);

                    // 3rdparty data user consent
                    if (analyticsObject.sc_3rdPartyDataOptin !== undefined) {
                        WUAnalytics.addEvent(xdm, 299);
                        xdm._experience.analytics.customDimensions.eVars.eVar81 = analyticsObject.sc_3rdPartyDataOptin ? "consent-accepted" : "consent-denied";
                        analyticsObject.sc_3rdPartyDataOptin = undefined;
                        sessionStorage.removeItem("DTM-3rdPartyDataOptin");
                    }
                }
            } else if (pagenametmp !== "" && pagenametmp.indexOf("verification") !== -1) {
                if (lastPageUrl !== "undefined" && lastPageUrl !== "" && lastPageUrl.indexOf("register") !== -1) {
                    xdm._experience.analytics.customDimensions.eVars.eVar42 = "register";

                    if (_satellite.cookie.get("mywuoptin") === "yes") {
                        xdm._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin";
                        WUAnalytics.addEvent(xdm, 40);
                    }

                    _satellite.cookie.set("NewUserCookie", true, { expires: 1 });
                    WUAnalytics.addEvent(xdm, 4);

                    // 3rdparty data user consent
                    if (analyticsObject.sc_3rdPartyDataOptin !== undefined) {
                        WUAnalytics.addEvent(xdm, 299);
                        xdm._experience.analytics.customDimensions.eVars.eVar81 = analyticsObject.sc_3rdPartyDataOptin ? "consent-accepted" : "consent-denied";
                        analyticsObject.sc_3rdPartyDataOptin = undefined;
                        sessionStorage.removeItem("DTM-3rdPartyDataOptin");
                    }
                }
            }
        }

        // Account activation
        if (WUAnalytics.getDataElement("WUAccountActiveJSObject", false)) {
            WUAnalytics.addEvent(xdm, 32);
        }

        // Forgot password pages
        if (pagenametmp !== "" && pagenametmp.indexOf("forgot-password:start") !== -1) {
            WUAnalytics.addEvent(xdm, 82);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("forgot-password:emailsent") !== -1) {
            WUAnalytics.addEvent(xdm, 85);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("forgot-password:securityquestion") !== -1) {
            WUAnalytics.addEvent(xdm, 86);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("forgot-password:resetpassword") !== -1) {
            WUAnalytics.addEvent(xdm, 87);
        }

        // Name change pages
        if (pagenametmp !== "" && pagenametmp.indexOf("name-change:verificationoptions:text-me") !== -1) {
            WUAnalytics.addEvent(xdm, 207);
            WUAnalytics.addEvent(xdm, 208);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("name-change:enter-pin") !== -1) {
            WUAnalytics.addEvent(xdm, 209);
            WUAnalytics.addEvent(xdm, 210);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("name-change:editreceiver-name") !== -1) {
            var lastPgName = WUAnalytics.getDataElement("WULinkIDJSObject", "");
            if (lastPgName !== "" && lastPgName.indexOf("cancel-transfer:reason") !== -1) {
                xdm._experience.analytics.customDimensions.eVars.eVar61 = "receiver-namechange";
                WUAnalytics.addEvent(xdm, 213);
                WUAnalytics.addEvent(xdm, 214);
                WUAnalytics.addEvent(xdm, 211);
            } else {
                WUAnalytics.addEvent(xdm, 213);
                WUAnalytics.addEvent(xdm, 214);
            }
        }

        if (pagenametmp !== "" && (pagenametmp.indexOf("name-change:review") !== -1 || pagenametmp.indexOf("name-change:namechangereview") !== -1)) {
            WUAnalytics.addEvent(xdm, 215);
            WUAnalytics.addEvent(xdm, 216);
        }

        if (pagenametmp !== "" && (pagenametmp.indexOf("name-change:receipt") !== -1 || pagenametmp.indexOf("name-change:namechangereceipt") !== -1)) {
            if (txn_id !== "") {
                WUAnalytics.addEvent(xdm, 217);
            }
        }

        // Collect ID pages
        if (pagenametmp !== "" && (pagenametmp.indexOf("collectid:details") !== -1 || pagenametmp.indexOf("collect-id:details") !== -1)) {
            WUAnalytics.addEvent(xdm, 142);
            WUAnalytics.addEvent(xdm, 143);

            if (
                typeof analyticsObject.sc_verify_status !== "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() === "unverified" &&
                analyticsObject.sc_user_id !== "" &&
                typeof analyticsObject.sc_user_id !== "undefined"
            ) {
                WUAnalytics.addEvent(xdm, 244);
            }
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("collectid:failed") !== -1) {
            WUAnalytics.addEvent(xdm, 148);
        }

        // More profile page events
        if (pagenametmp !== "" && pagenametmp.indexOf("fraudprotection") === -1) {
            if (pagenametmp !== "" && pagenametmp.indexOf("profile:txn-history") !== -1) {
                if (
                    typeof analyticsObject.sc_verify_status !== "undefined" &&
                    analyticsObject.sc_verify_status.toLowerCase() === "inprogress" &&
                    analyticsObject.sc_user_id !== "" &&
                    typeof analyticsObject.sc_user_id !== "undefined"
                ) {
                    WUAnalytics.addEvent(xdm, 245);
                }
            }

            if (pagenametmp !== "" && pagenametmp.indexOf("send-money:start") !== -1) {
                if (
                    typeof analyticsObject.sc_verify_status !== "undefined" &&
                    analyticsObject.sc_verify_status.toLowerCase() === "verified" &&
                    analyticsObject.sc_user_id !== "" &&
                    typeof analyticsObject.sc_user_id !== "undefined"
                ) {
                    WUAnalytics.addEvent(xdm, 248);
                }
            }
        }

        // More collect ID pages
        if (pagenametmp !== "" && pagenametmp.indexOf("collectid:ekyc-failed") !== -1) {
            if (
                typeof analyticsObject.sc_verify_status !== "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() === "suspended" &&
                analyticsObject.sc_user_id !== "" &&
                typeof analyticsObject.sc_user_id !== "undefined"
            ) {
                WUAnalytics.addEvent(xdm, 247);
            }
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("collectid:identify") !== -1) {
            if (
                typeof analyticsObject.sc_verify_status !== "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() === "rejected" &&
                analyticsObject.sc_user_id !== "" &&
                typeof analyticsObject.sc_user_id !== "undefined"
            ) {
                WUAnalytics.addEvent(xdm, 246);
            }
        }

        // Password forgot completion
        if (typeof analyticsObject.sc_fp_complete !== "undefined" && analyticsObject.sc_fp_complete !== "") {
            if (analyticsObject.sc_fp_complete === "true") {
                WUAnalytics.addEvent(xdm, 88);
            }
        }

        // Verification events
        if (typeof analyticsObject.sc_letter_sent !== "undefined" && analyticsObject.sc_letter_sent.toString().toLowerCase() === "true") {
            _satellite.cookie.set("EUID_VERIFY_LETTER_SENT", "true");
            WUAnalytics.addEvent(xdm, 140);
            WUAnalytics.addEvent(xdm, 141);
        }

        if (verification_blocked !== "" && verification_blocked === "blocked") {
            WUAnalytics.addEvent(xdm, 147);
        }

        if (verification_failed !== "" && verification_failed === "true") {
            WUAnalytics.addEvent(xdm, 148);
        }

        if (verification_success !== "" && verification_success === "true") {
            if (_satellite.cookie.get("EUID_VERIFY_LETTER_SENT") !== "undefined" && _satellite.cookie.get("EUID_VERIFY_LETTER_SENT") === "true") {
                _satellite.cookie.remove("EUID_VERIFY_LETTER_SENT");
                WUAnalytics.addEvent(xdm, 149);
            }
        }

        if (id_verification_success !== "" && id_verification_success === "true") {
            WUAnalytics.addEvent(xdm, 146);
        }

        // Another security question page
        if (pagenametmp !== "" && pagenametmp.indexOf("forgot-password:securityquestion") !== -1) {
            WUAnalytics.addEvent(xdm, 86);
        }

        // Fraud protection
        if (pagenametmp !== "" && pagenametmp.indexOf("fraudprotection") !== -1) {
            WUAnalytics.addEvent(xdm, 114);
            WUAnalytics.addEvent(xdm, 115);
        }

        // Progressive registration
        if (pagenametmp !== "" && pagenametmp.indexOf("progressive-register") !== -1) {
            WUAnalytics.addEvent(xdm, 237);
        }

        if (pagenametmp !== "" && pagenametmp.indexOf("progressive-register:contact") !== -1) {
            WUAnalytics.addEvent(xdm, 238);
        }

        // Error event
        if (typeof analyticsObject.sc_error !== "undefined" && analyticsObject.sc_error !== "") {
            WUAnalytics.addEvent(xdm, 31);
        }
    }

    // Handle reset password cookie
    if (_satellite.cookie.get("RESET_PASSWORD_COOKIE") === "true") {
        WUAnalytics.addEvent(xdm, 88);
    }

    // Page load time tracking - Add event294 with page load time value
    var pageLoadTime = WUAnalytics.getDataElement('WUPageLoadTimeJSObject', null);
    if (pageLoadTime !== undefined && pageLoadTime !== null) {
        WUAnalytics.addEvent(xdm, 294, pageLoadTime);
    }

    // NCA Event
    if (!sessionStorage.getItem("registrationDate1")) {
        if (
            pagenametmp.indexOf("profile:txn-history") !== -1 ||
            pagenametmp.indexOf("send-money:start") !== -1 ||
            pagenametmp.indexOf("send-money:receiverinformation") !== -1 ||
            pagenametmp.indexOf("send-money:review") !== -1 ||
            pagenametmp.indexOf("register:verifycode") !== -1
        ) {
            var custDetails1 = JSON.parse(sessionStorage.getItem("GatewayCustomer"));
            if (custDetails1 && custDetails1.registrationDate) {
                sessionStorage.setItem("registrationDate1", custDetails1.registrationDate);
            }
        }
    }

    // Page not found
    if (window.document.title.match("404")) {
        WUAnalytics.addEvent(xdm, 404);
    }

    // Set register success cookie
    if (WUAnalytics.getDataElement("WURegisterSuccessJSObject", false)) {
        _satellite.cookie.set("register_success_event", "true");
    }

    // Clean up any login/register cookies
    function deleteCookieRegLogin() {
        if (localStorage && localStorage.sc_login_success && localStorage.sc_login_success === "true") {
            localStorage.removeItem("sc_login_success");
        } else if (sessionStorage && sessionStorage.sc_login_success && sessionStorage.sc_login_success === "true") {
            sessionStorage.removeItem("sc_login_success");
        }
        if (sessionStorage && sessionStorage.sc_register_success && sessionStorage.sc_register_success === "true") {
            sessionStorage.removeItem("sc_register_success");
        }
    }

    deleteCookieRegLogin();

    // Peru Currency exchange events
    if (analyticsObject.sc_page_name && analyticsObject.sc_page_name === "pe:es:website-ce:perform-operation:start-subscription") {
        WUAnalytics.addEvent(xdm, 356);
    }

    if (analyticsObject.sc_loginsuccess === "true") {
        WUAnalytics.addEvent(xdm, 2);
    }

    if (analyticsObject.sc_accountactivation && analyticsObject.sc_accountactivation === "true") {
        WUAnalytics.addEvent(xdm, 32);
    }

    if (analyticsObject.sc_fpstep1 && analyticsObject.sc_fpstep1 === "true") {
        WUAnalytics.addEvent(xdm, 82);
    }

    if (analyticsObject.sc_fpstep4 && analyticsObject.sc_fpstep4 === "true") {
        WUAnalytics.addEvent(xdm, 87);
    }

    if (!xdm.web || !xdm.web.webPageDetails || !xdm.web.webPageDetails.pageViews) {
        _satellite.logger.warn("Page view structure not set for " + pageName + ". Adding it explicitly.");
        xdm.web = xdm.web || {};
        xdm.web.webPageDetails = xdm.web.webPageDetails || {};
        xdm.web.webPageDetails.pageViews = { value: 1 };
        xdm.eventType = "web.webpagedetails.pageViews";
    }

    // Make sure the XDM isn't empty
    xdm = WUAnalytics.handleEmptyXDM(xdm);

    // Return the XDM object
    return xdm;
}