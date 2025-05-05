// Western Union Analytics Middleware Utilities
// Author: Andrew Chepurny for Western Union
// Version: 2025.05.03

(function () {


    // Create global namespace if it doesn't exist
    window.WUAnalytics = window.WUAnalytics || {};
    window.WUAnalytics.pvFired = false;
    window.WUAnalytics.pageViewSent = false;

    // Private variables
    var _debugMode = true; // Set to true for development
    var _retryLimit = 3;
    var _retryDelay = 100;
    var _eventTypeMap = {
        pageView: "web.webpagedetails.pageViews",
        linkClick: "web.webInteraction.linkClicks"
    };

    // Helper Functions
    function log(level, message, data) {
        if (!_debugMode) return;

        if (data) {
            _satellite.logger[level](message, data);
        } else {
            _satellite.logger[level](message);
        }
    }

    function getQueryParam(param) {
        var queryString = window.location.search;
        var urlParams = new URLSearchParams(queryString);
        return urlParams.get(param);
    }

    function getDataElement(elementName, defaultValue) {
        try {
            var value = _satellite.getVar(elementName);
            return (value !== undefined && value !== null && value !== "") ? value : defaultValue;
        } catch (e) {
            log("warn", "Error getting data element: " + elementName, e);
            return defaultValue;
        }
    }

    function isAnalyticsObjectAvailable() {
        return typeof window.analyticsObject !== "undefined" && window.analyticsObject !== null;
    }

    function getAnalyticsObjectValue(key, defaultValue) {
        try {
            if (!isAnalyticsObjectAvailable()) {
                return defaultValue;
            }

            if (typeof window.analyticsObject[key] === "undefined" || window.analyticsObject[key] === null || window.analyticsObject[key] === "") {
                return defaultValue;
            }

            return String(window.analyticsObject[key]).toLowerCase();
        } catch (e) {
            log("warn", "Error getting analytics object value: " + key, e);
            return defaultValue;
        }
    }

    // XDM Structure Functions
    function initializeXDM() {
        return {
            _experience: {
                analytics: {
                    customDimensions: {
                        eVars: {},
                        props: {},
                        listProps: {}
                    },
                    event1to100: {},
                    event101to200: {},
                    event201to300: {},
                    event301to400: {}
                }
            }
        };
    }

    function validateIdentityMap(identityMap) {
        if (!identityMap) return null;

        const validMap = {};
        let hasValidIdentities = false;

        Object.keys(identityMap).forEach(namespace => {
            if (Array.isArray(identityMap[namespace])) {
                const validIdentities = identityMap[namespace].filter(
                    id => id && id.id && typeof id.id === 'string' && id.id.trim() !== ''
                );

                if (validIdentities.length > 0) {
                    validMap[namespace] = validIdentities;
                    hasValidIdentities = true;
                }
            }
        });

        return hasValidIdentities ? validMap : null;
    }

    function ensureXDMStructure(xdm) {
        xdm = xdm || {};

        // Ensure top-level structure
        xdm._experience = xdm._experience || {};

        // Ensure analytics structure
        xdm._experience.analytics = xdm._experience.analytics || {};

        // Ensure dimensions
        xdm._experience.analytics.customDimensions = xdm._experience.analytics.customDimensions || {};
        xdm._experience.analytics.customDimensions.eVars = xdm._experience.analytics.customDimensions.eVars || {};
        xdm._experience.analytics.customDimensions.props = xdm._experience.analytics.customDimensions.props || {};
        xdm._experience.analytics.customDimensions.listProps = xdm._experience.analytics.customDimensions.listProps || {};

        // Ensure event buckets
        xdm._experience.analytics.event1to100 = xdm._experience.analytics.event1to100 || {};
        xdm._experience.analytics.event101to200 = xdm._experience.analytics.event101to200 || {};
        xdm._experience.analytics.event201to300 = xdm._experience.analytics.event201to300 || {};
        xdm._experience.analytics.event301to400 = xdm._experience.analytics.event301to400 || {};

        return xdm;
    }

    function deepCloneXDM(xdm) {
        return JSON.parse(JSON.stringify(xdm));
    }

    function mergeXDMWithTemplate(xdm) {
        // Get the template from data element
        const template = _satellite.getVar('XDMTemplate') || {};

        // Create a deep clone of the template to avoid reference issues
        const mergedXDM = JSON.parse(JSON.stringify(template));

        // Deep merge function to handle nested objects properly
        function deepMerge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    // If property doesn't exist on target, create it
                    if (!target[key]) target[key] = {};

                    // Recursively merge nested objects
                    deepMerge(target[key], source[key]);
                } else if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
                    // Only copy non-empty values
                    target[key] = source[key];
                }
            }
            return target;
        }

        // Perform the deep merge
        return deepMerge(mergedXDM, xdm);
    }

    // Event Functions
    function addEvent(xdm, eventNum, value, serialId) {
        // Ensure XDM has proper structure
        xdm = ensureXDMStructure(xdm);

        let targetObj;

        // Determine which event object to use based on event number
        if (eventNum <= 100) {
            targetObj = xdm._experience.analytics.event1to100;
        } else if (eventNum <= 200) {
            targetObj = xdm._experience.analytics.event101to200;
        } else if (eventNum <= 300) {
            targetObj = xdm._experience.analytics.event201to300;
        } else if (eventNum <= 400) {
            targetObj = xdm._experience.analytics.event301to400;
        } else {
            log("warn", "Event number out of range: " + eventNum);
            return xdm;
        }

        // Create the proper event object structure with value
        const eventName = `event${eventNum}`;
        const eventObj = {
            value: value !== undefined ? value : 1
        };

        // Only add ID for serialization if explicitly provided
        if (serialId) {
            eventObj.serialization = {
                id: serialId
            };
        }

        // Set the event object in the target
        targetObj[eventName] = eventObj;

        log("info", `Added event${eventNum} with value ${eventObj.value}${serialId ? ' and serialization ID: ' + serialId : ''}`);
        return xdm;
    }

    function addPurchaseEvent(xdm, serialId) {
        xdm = ensureXDMStructure(xdm);

        // Check for products - log warning if missing
        if (!xdm.productListItems || xdm.productListItems.length === 0) {
            log("warn", "Adding purchase event without products! Call setProduct before addPurchaseEvent.");
            // Initialize empty array if missing
            xdm.productListItems = xdm.productListItems || [];
        } else {
            log("info", `Purchase event includes ${xdm.productListItems.length} products`);
        }

        // Set up commerce object structure
        xdm.commerce = xdm.commerce || {};

        xdm.commerce.purchases = xdm.commerce.purchases || {};
        xdm.commerce.purchases.value = 1;

        // Add serialization ID if provided
        if (serialId) {
            xdm.commerce.purchases.id = serialId;

            // Also set order ID in commerce object
            xdm.commerce.order = xdm.commerce.order || {};
            xdm.commerce.order.purchaseID = serialId;
        }

        // For backward compatibility with analytics events
        if (!xdm._experience.analytics.customDimensions) {
            xdm._experience.analytics.customDimensions = {};
        }

        if (!xdm._experience.analytics.customDimensions.events) {
            xdm._experience.analytics.customDimensions.events = [];
        }

        // Create purchase event object
        const purchaseEvent = {
            name: 'purchase',
            value: 1
        };

        // Add serialization only if explicitly provided
        if (serialId) {
            purchaseEvent.serialization = {
                id: serialId
            };
        }

        // Add the purchase event
        xdm._experience.analytics.customDimensions.events.push(purchaseEvent);

        log("info", `Added purchase event${serialId ? ' with serialization ID: ' + serialId : ''}`);
        return xdm;
    }

    // XDM Type Functions
    function ensurePageView(xdm) {
        // First ensure structure is preserved and Deep Clone to prevent Race Conditions
        xdm = deepCloneXDM(ensureXDMStructure(xdm));

        // Ensure web structure exists and is properly populated
        xdm.web = xdm.web || {};
        xdm.web.webPageDetails = xdm.web.webPageDetails || {};

        // Always set pageViews value to 1
        xdm.web.webPageDetails.pageViews = { value: 1 };

        // Make sure page name is populated
        if (!xdm.web.webPageDetails.name || xdm.web.webPageDetails.name === "") {
            xdm.web.webPageDetails.name = getDataElement("WUPageNameJSObject", "unknown-page");
            log("warn", "Page name was empty, setting from data element: " + xdm.web.webPageDetails.name);
        }

        // Always set proper eventType for page views - CRITICAL FIX
        xdm.eventType = "web.webpagedetails.pageViews";

        // Remove linkClicks property but preserve webInteraction name if set
        if (xdm.web.webInteraction && xdm.web.webInteraction.linkClicks) {
            delete xdm.web.webInteraction.linkClicks;
        }

        // Add page URL if available
        if (window.location && window.location.href) {
            xdm.web.webPageDetails.URL = window.location.href;
        }

        // Log the page view for debugging
        log("info", "Ensuring page view for: " + xdm.web.webPageDetails.name);
        log("info", "Page view eventType set to: " + xdm.eventType);

        // Make sure we preserve the reference
        _satellite.setVar('XDM westernunion Merged Object', xdm);

        return xdm;
    }

    function ensureLinkClick(xdm) {
        // First ensure structure is preserved and Deep Clone to prevent Race Conditions
        xdm = deepCloneXDM(ensureXDMStructure(xdm));

        // PRESERVE existing web structure if present
        xdm.web = xdm.web || {};
        xdm.web.webInteraction = xdm.web.webInteraction || {};

        // CRITICAL: Initialize the name property to prevent "Cannot set properties of undefined" error
        xdm.web.webInteraction.name = xdm.web.webInteraction.name || "link_click";

        // Set link clicks value
        xdm.web.webInteraction.linkClicks = { value: 1 };

        // Set proper event type
        xdm.eventType = "web.webInteraction.linkClicks";

        // Log for debugging
        log("info", "Link click structure ensured with name: " + xdm.web.webInteraction.name);

        return xdm;
    }

    // Product Functions
    function setProduct(xdm, productName, price, eventData) {
        if (!productName) {
            log("warn", "Cannot set product with empty name");
            return xdm;
        }

        const product = {
            name: productName,
            SKU: productName
        };

        if (price !== undefined && price !== null) {
            product.priceTotal = price;
        }

        if (eventData) {
            product.eventData = eventData;
        }

        xdm.productListItems = xdm.productListItems || [];
        xdm.productListItems.push(product);

        return xdm;
    }

    // XDM Sending Functions
    function sendXDM(xdm) {
        try {
            if (!xdm) {
                log("error", "Cannot send empty XDM object");
                return Promise.reject(new Error("Cannot send empty XDM object"));
            }

            // Store the original eventType to ensure it doesn't get lost
            const originalEventType = xdm.eventType;

            // Deep clone the XDM object to prevent reference issues
            const clonedXDM = JSON.parse(JSON.stringify(xdm));

            // Restore the eventType (just in case it was lost in serialization)
            clonedXDM.eventType = originalEventType;

            // Merge with template before sending
            const mergedXDM = mergeXDMWithTemplate(clonedXDM);

            // Make sure the eventType is preserved after merging
            mergedXDM.eventType = originalEventType;

            // Store for reference/debugging
            _satellite.setVar('XDM westernunion Merged Object', mergedXDM);

            // Log the event type for debugging
            log("info", "Sending XDM with eventType: " + mergedXDM.eventType);

            // Handle identity map to prevent empty values
            if (mergedXDM.identityMap) {
                // Filter out any identity entries with empty values
                Object.keys(mergedXDM.identityMap).forEach(namespace => {
                    if (Array.isArray(mergedXDM.identityMap[namespace])) {
                        // Filter out entries with empty id values
                        mergedXDM.identityMap[namespace] = mergedXDM.identityMap[namespace].filter(
                            id => id && id.id && typeof id.id === 'string' && id.id.trim() !== ''
                        );

                        // If namespace has no valid IDs left, remove it
                        if (mergedXDM.identityMap[namespace].length === 0) {
                            delete mergedXDM.identityMap[namespace];
                        }
                    }
                });

                // If identityMap is empty, remove it to avoid errors
                if (Object.keys(mergedXDM.identityMap).length === 0) {
                    delete mergedXDM.identityMap;
                }
            }

            if (_debugMode) {
                mergedXDM._debug = {
                    timestamp: new Date().toISOString(),
                    eventType: mergedXDM.eventType  // Add to debug for easy inspection
                };
            }

            log("info", "Sending XDM object", JSON.stringify(mergedXDM));

            // Create a key to track events that have been sent to prevent collisions
            const eventKey = mergedXDM.eventType + '_' + new Date().getTime();

            // Track current events being processed
            window.WUAnalytics = window.WUAnalytics || {};
            window.WUAnalytics.pendingEvents = window.WUAnalytics.pendingEvents || {};

            // For page views in SPAs, clear previous page view attempts
            if (mergedXDM.eventType === "web.webpagedetails.pageViews") {
                // Store this as the current page view
                window.WUAnalytics.currentPageView = eventKey;

                // Create a tracking property to avoid duplicate page views
                window.WUAnalytics.pageViewTimestamp = new Date().getTime();

                // Set global flag for page view
                window.WUAnalytics.pageViewSent = true;
            }

            // For link clicks, check if we need to wait for a recent page view
            let delay = 0;
            if (mergedXDM.eventType === "web.webInteraction.linkClicks") {
                const pageViewTimestamp = window.WUAnalytics.pageViewTimestamp || 0;
                const timeSincePageView = new Date().getTime() - pageViewTimestamp;

                // If a page view happened in the last 500ms, wait for it to complete
                if (timeSincePageView < 500) {
                    delay = Math.max(200, 500 - timeSincePageView);
                }
            }

            // Register this event as pending
            window.WUAnalytics.pendingEvents[eventKey] = true;

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    // Only send if this event is still valid (not superseded by another)
                    if (window.WUAnalytics.pendingEvents[eventKey]) {
                        // IMPORTANT: Log the eventType just before sending
                        log("info", "Sending event with type: " + mergedXDM.eventType);

                        window.alloy("sendEvent", {
                            "xdm": mergedXDM
                        }).then((result) => {
                            // Clean up
                            delete window.WUAnalytics.pendingEvents[eventKey];
                            log("info", "Successfully sent event with type: " + mergedXDM.eventType);
                            resolve(result);
                        }).catch((error) => {
                            delete window.WUAnalytics.pendingEvents[eventKey];
                            log("error", "Error in alloy.sendEvent for type " + mergedXDM.eventType, error);
                            reject(error);
                        });
                    } else {
                        // This event was superseded, resolve without sending
                        resolve({ superseded: true });
                    }
                }, delay);
            });
        } catch (e) {
            log("error", "Error sending XDM", e);
            return Promise.reject(e);
        }
    }

    // Retry Functions
    function withRetry(fn, maxRetries, delay) {
        maxRetries = maxRetries || _retryLimit;
        delay = delay || _retryDelay;

        return function () {
            const args = arguments;
            let retries = 0;

            return new Promise((resolve, reject) => {
                function attempt() {
                    try {
                        const result = fn.apply(this, args);

                        if (result && typeof result.then === 'function') {
                            result.then(resolve).catch(function (error) {
                                retry(error);
                            });
                        } else {
                            resolve(result);
                        }
                    } catch (error) {
                        retry(error);
                    }
                }

                function retry(error) {
                    retries++;
                    if (retries >= maxRetries) {
                        reject(error);
                        return;
                    }

                    setTimeout(attempt, delay);
                }

                attempt();
            });
        };
    }

    // Base XDM Building
    function buildBaseXDM() {
        const xdm = initializeXDM();

        try {
            // Add common data elements
            const pageNameTmp = getDataElement("WUPageNameJSObject", "");
            const country = getDataElement("WUCountryJSObject", "");
            const accountID = getDataElement("WUAccountJSObject", "");
            const txnStatus = getDataElement("WUTxnStatusJSObject", "");
            const mtcn = getDataElement("WUMtcnJSObject", "");
            const linkName = getDataElement("WULinkIDJSObject", "");
            const pageNameEvent = getDataElement("WUPagenameForEventObject", "");

            log("info", "Building base XDM with pageName: " + pageNameTmp);

            // Ensure analytics data is initialized
            if (!isAnalyticsObjectAvailable()) {
                log("warn", "Analytics object not available, waiting for initialization");
            }

            // Set standard web properties
            xdm.web = xdm.web || {};
            xdm.web.webPageDetails = xdm.web.webPageDetails || {};
            xdm.web.webPageDetails.name = pageNameTmp;
            xdm.web.webPageDetails.siteSection = "web";
            xdm.web.webPageDetails.isErrorPage = false;

            // IMPORTANT: Initialize webInteraction object
            xdm.web.webInteraction = xdm.web.webInteraction || {};
            xdm.web.webInteraction.name = linkName || "page_interaction";

            // Initialize Western Union namespace
            xdm._westernunion = {
                identity: {}
            };

            // Only add accountID to identity map if it exists
            if (accountID && accountID !== '') {
                validateAndSetIdentity(xdm, "customerKey", accountID, false);
            }

            // Process product string
            let prod = "";
            const payMethod = getAnalyticsObjectValue("sc_payment_method", "");
            const delMethod = getAnalyticsObjectValue("sc_delivery_method", "");
            const txnType = getAnalyticsObjectValue("sc_txn_type", "");
            const platform = getAnalyticsObjectValue("sc_platform", "");

            if (payMethod && txnType && platform) {
                if (delMethod) {
                    prod = platform + "|" + txnType + "|" + payMethod + "|" + delMethod;
                } else {
                    prod = platform + "|" + txnType + "|" + payMethod;
                }

                log("info", "Product string generated: " + prod);
            }

            // Store key values in the XDM object for common reference
            xdm._wu = {
                pageName: pageNameTmp,
                country: country,
                txnStatus: txnStatus,
                mtcn: mtcn,
                linkName: linkName,
                pageNameEvent: pageNameEvent,
                product: prod
            };

            // Set delivery method if available
            if (getDataElement("WUDeliveryMethodJSObject", "") !== "") {
                let mwDelivery = getDataElement("WUDeliveryMethodJSObject", "");
                if (getDataElement("WUWalletServiceProvider", "") !== "none") {
                    mwDelivery = mwDelivery + "-" + getDataElement("WUWalletServiceProvider", "");
                }
                xdm._experience.analytics.customDimensions.eVars.eVar13 = mwDelivery;
            }
        } catch (e) {
            log("error", "Error building base XDM", e);
        }

        return xdm;
    }

    function detectSPAPageName() {
        const url = window.location.href;
        let pageName = "";

        // Extract path and remove trailing slash
        const path = window.location.pathname.replace(/\/$/, "");

        // Parse the URL to extract SPA route information
        if (path.includes("send-money")) {
            if (path.includes("review")) {
                pageName = "send-money:review";
            } else if (path.includes("receipt")) {
                if (url.includes("staged")) {
                    pageName = "send-money:receipt-staged";
                } else if (url.includes("under-review")) {
                    pageName = "send-money:receipt:under-review";
                } else if (url.includes("on-hold")) {
                    pageName = "send-money:receipt:on-hold";
                } else {
                    pageName = "send-money:receipt";
                }
            } else if (path.includes("paymentinformation")) {
                pageName = "send-money:paymentinformation";
            } else if (path.includes("receiverinformation")) {
                pageName = "send-money:receiverinformation";
            } else if (path.includes("start")) {
                pageName = "send-money:start";
            }
        }

        // If we detected a meaningful page name, update the data elements
        if (pageName && pageName !== "") {
            log("info", "SPA page name detected: " + pageName);
            _satellite.setVar("WUPageNameJSObject", pageName);

            // Update analytics object if available
            if (typeof analyticsObject !== "undefined") {
                analyticsObject.sc_page_name = pageName;
            }

            return pageName;
        }

        return null;
    }

    function validateAndSetIdentity(xdm, namespace, id, isPrimary) {
        if (!id || typeof id !== 'string' || id.trim() === '') {
            log("warn", `Skipping empty identity for namespace: ${namespace}`);
            return xdm;
        }

        xdm.identityMap = xdm.identityMap || {};
        xdm.identityMap[namespace] = xdm.identityMap[namespace] || [];

        const identityObj = {
            id: id.trim(),
            primary: !!isPrimary,
            authenticatedState: "ambiguous"
        };

        xdm.identityMap[namespace].push(identityObj);
        return xdm;
    }

    // Expose public methods to window.WUAnalytics
    window.WUAnalytics = {
        // Core functions
        setDebugMode: function (isDebug) {
            _debugMode = !!isDebug;
        },
        mergeXDMWithTemplate: mergeXDMWithTemplate,
        validateIdentityMap: validateIdentityMap,
        validateAndSetIdentity: validateAndSetIdentity,
        getAnalyticsObjectValue: getAnalyticsObjectValue,
        getQueryParam: getQueryParam,
        getDataElement: getDataElement,
        ensureXDMStructure: ensureXDMStructure,
        addEvent: addEvent,
        addPurchaseEvent: addPurchaseEvent,
        setProduct: setProduct,

        preInitialize: function () {
            // Force execution of key data elements and log results
            var pageName = getDataElement("WUPageNameJSObject", "");
            log("info", "Initialized pageName: " + (pageName || "empty"));

            var pageNameEvent = getDataElement("WUPagenameForEventObject", "");
            log("info", "Initialized pageNameEvent: " + (pageNameEvent || "empty"));

            // Check if analyticsObject is available
            var analyticsAvailable = isAnalyticsObjectAvailable();
            log("info", "analyticsObject available: " + analyticsAvailable);

            // If analytics object is available, log some key properties
            if (analyticsAvailable) {
                log("info", "Sample analytics values: " +
                    getAnalyticsObjectValue("sc_payment_method", "not found") + ", " +
                    getAnalyticsObjectValue("sc_delivery_method", "not found")
                );
            }

            return true;
        },

        // XDM type functions
        ensurePageView: ensurePageView,
        ensureLinkClick: ensureLinkClick,

        // XDM building functions
        buildBaseXDM: buildBaseXDM,

        // XDM sending functions
        sendXDM: sendXDM,
        withRetry: withRetry,

        // Page view flag management
        detectSPAPageName: detectSPAPageName,
        setPageViewFlag: function (value) {
            window.WUAnalytics.pvFired = value;
            _satellite.setVar("Common_Page_Name_Based_Event_Firing_Rule", value);
        },
        getPageViewFlag: function () {
            // Store the current URL
            const currentUrl = window.location.href;

            // If we haven't initialized lastTrackedUrl, do it now
            if (!window.WUAnalytics.lastTrackedUrl) {
                window.WUAnalytics.lastTrackedUrl = currentUrl;
            }

            // If URL has significantly changed, force a new page view
            if (currentUrl !== window.WUAnalytics.lastTrackedUrl) {
                // Update the last tracked URL
                window.WUAnalytics.lastTrackedUrl = currentUrl;

                // Check if the change is significant (not just a hash or query param change)
                const oldPath = window.WUAnalytics.lastTrackedUrl.split('?')[0].split('#')[0];
                const newPath = currentUrl.split('?')[0].split('#')[0];

                if (oldPath !== newPath) {
                    // Path has changed significantly, reset tracking flags
                    log("info", "URL path changed from " + oldPath + " to " + newPath + " - resetting page view flags");
                    window.WUAnalytics.pvFired = false;
                    window.WUAnalytics.pageViewSent = false;
                    return false;
                }
            }

            // Return the current tracking state
            return window.WUAnalytics.pvFired ||
                window.WUAnalytics.pageViewSent ||
                getDataElement("Common_Page_Name_Based_Event_Firing_Rule", false);
        },
        resetPageViewFlag: function (delay) {
            setTimeout(function () {
                window.WUAnalytics.pvFired = false;
                _satellite.setVar("Common_Page_Name_Based_Event_Firing_Rule", false);
            }, delay || 5000);
        },

        // Handle potentially empty XDM
        handleEmptyXDM: function (xdm) {
            const isEmpty = !xdm ||
                !xdm._experience ||
                !xdm._experience.analytics ||
                Object.keys(xdm._experience.analytics).length === 0;

            if (isEmpty) {
                log("warn", "Empty XDM detected, attempting recovery");

                const recoveredXDM = buildBaseXDM();

                if (xdm) {
                    for (var prop in recoveredXDM) {
                        if (!xdm[prop]) {
                            xdm[prop] = recoveredXDM[prop];
                        }
                    }
                    return xdm;
                }

                return recoveredXDM;
            }

            return xdm;
        }
    };

    // Initialize debug mode
    window.WUAnalytics.setDebugMode(true);

    // Log initialization
    log("info", "WUAnalytics utility initialized at page top");
    window.WUAnalytics.isInitialized = true;

    // ===== RUN SPA DETECTION CODE FIRST =====
    (function () {
        // Add time-based tracking protection
        var lastNavigationTime = 0;
        var minNavigationInterval = 500; // milliseconds

        // Helper function to handle navigation events with time check
        function handleNavigation(source) {
            var now = new Date().getTime();

            // Skip if another navigation was processed too recently
            if (now - lastNavigationTime < minNavigationInterval) {
                _satellite.logger.info("Skipping duplicate SPA navigation from " + source +
                    " (" + (now - lastNavigationTime) + "ms since last event)");
                return;
            }

            // Update the timestamp
            lastNavigationTime = now;

            // Log the navigation
            _satellite.logger.info("SPA navigation detected (" + source + "): " + window.location.href);

            // Reset tracking flags
            window.WUAnalytics = window.WUAnalytics || {};
            window.WUAnalytics.pvFired = false;
            window.WUAnalytics.pageViewSent = false;

            // Attempt to track the page view after a small delay
            setTimeout(function () {
                if (typeof attemptPageViewTracking === 'function') {
                    attemptPageViewTracking();
                } else {
                    _satellite.logger.info("attemptPageViewTracking not available yet, will try to track via rule");
                    // Try to trigger via rule
                    if (typeof _satellite !== "undefined" && _satellite.track) {
                        _satellite.track("spa-page-view");
                    }
                }
            }, 150);
        }

        // Store original history methods to detect SPA navigation
        var originalPushState = window.history.pushState;
        var originalReplaceState = window.history.replaceState;

        // Override history.pushState
        window.history.pushState = function () {
            // Call the original function
            originalPushState.apply(this, arguments);

            // Handle navigation with safety check
            handleNavigation("pushState");
        };

        // Override history.replaceState
        window.history.replaceState = function () {
            // Call the original function
            originalReplaceState.apply(this, arguments);

            // Handle navigation with safety check
            handleNavigation("replaceState");
        };

        // Add hash change listener
        window.addEventListener('hashchange', function () {
            // Handle navigation with safety check
            handleNavigation("hashchange");
        });

        // Add URL polling to detect changes that don't use history API
        var lastUrl = window.location.href;
        setInterval(function () {
            var currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;

                // Handle navigation with safety check
                handleNavigation("URL polling");
            }
        }, 500); // Check every 500ms
    })();
    // ===== RUN ANGULAR OBSERVER DETECTION CODE SECOND =====
    (function () {
        // Create observer to detect Angular view changes
        function setupAngularViewObserver() {
            // Target element that contains Angular views - adjust selector as needed
            const viewContainer = document.querySelector('#OptimusApp') || document.body;

            if (!viewContainer) return;

            const observer = new MutationObserver(function (mutations) {
                // Check if mutations indicate a view change
                let viewChanged = false;

                for (let mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // Look for Angular components being added
                        for (let node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.hasAttribute('ng-view') ||
                                    node.hasAttribute('data-ng-view') ||
                                    node.classList.contains('ng-view') ||
                                    node.querySelector('[ng-view],[data-ng-view],.ng-view')) {
                                    viewChanged = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (viewChanged) break;
                }

                if (viewChanged) {
                    _satellite.logger.info("Angular view change detected via DOM mutation");

                    // Reset page view tracking
                    window.WUAnalytics = window.WUAnalytics || {};
                    window.WUAnalytics.pvFired = false;
                    window.WUAnalytics.pageViewSent = false;

                    // Trigger custom event
                    document.dispatchEvent(new CustomEvent('spa:navigation'));

                    // Delay to let Angular finish rendering
                    setTimeout(function () {
                        if (typeof attemptPageViewTracking === 'function') {
                            attemptPageViewTracking();
                        }
                    }, 200);
                }
            });

            // Start observing
            observer.observe(viewContainer, {
                childList: true,
                subtree: true,
                attributes: false,
                characterData: false
            });

            _satellite.logger.info("Angular view observer initialized");
        }

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupAngularViewObserver);
        } else {
            setupAngularViewObserver();
        }
    })();
})();

