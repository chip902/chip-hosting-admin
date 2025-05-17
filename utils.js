// Western Union Analytics Middleware Utilities
// Author: Andrew Chepurny for Western Union
// Version: 2025.05.06

(function () {
    // === 1. DEFINE PRIVATE VARIABLES & UTILITY FUNCTIONS ===
    var _debugMode = true; // Set to true for development to make Dynamic later
    var _retryLimit = 3;
    var _retryDelay = 100;
    var _eventTypeMap = {
        pageView: "web.webpagedetails.pageViews",
        linkClick: "web.webInteraction.linkClicks"
    };

    var _timePartingValue = "";

    // DST schedule for Time Parting
    var _dstSchedule = {
        2012: "3/11,11/4", 2013: "3/10,11/3", 2014: "3/9,11/2",
        2015: "3/8,11/1", 2016: "3/13,11/6", 2017: "3/12,11/5",
        2018: "3/11,11/4", 2019: "3/10,11/3", 2020: "3/8,11/1",
        2021: "3/14,11/7", 2022: "3/13,11/6", 2023: "3/12,11/5",
        2024: "3/10,11/3", 2025: "3/9,11/2"
    };

    // Time parting function - moved from data element to utils.js
    function calculateTimeParting(timezone) {
        // Default to Eastern Time if not specified
        timezone = timezone || -5;

        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let adjustedTimezone = timezone;

        // Check for DST
        const currentYear = now.getFullYear();
        if (_dstSchedule[currentYear]) {
            const [dstStartStr, dstEndStr] = _dstSchedule[currentYear].split(',');
            const dstStart = new Date(`${dstStartStr}/${currentYear}`);
            const dstEnd = new Date(`${dstEndStr}/${currentYear}`);

            // Apply DST adjustment if applicable for Northern Hemisphere
            if (now > dstStart && now < dstEnd) {
                adjustedTimezone += 1;
            }
        }

        // Calculate time with timezone adjustment
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const adjustedTime = new Date(utcTime + (3600000 * adjustedTimezone));

        // Format the time
        let hour = adjustedTime.getHours();
        const minute = adjustedTime.getMinutes().toString().padStart(2, '0');
        const day = days[adjustedTime.getDay()];

        // Convert to AM/PM format
        const period = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12;

        const formattedTime = `${hour}:${minute} ${period}`;

        return `${formattedTime}|${day}`;
    }

    // Calculate time parting right away during initialization
    _timePartingValue = calculateTimeParting(-5);

    // Initialize tracking state variables
    window.WUAnalytics = window.WUAnalytics || {};
    window.WUAnalytics.pvFired = false;
    window.WUAnalytics.pageViewSent = false;
    window.WUAnalytics.lastLinkTime = 0;
    window.WUAnalytics.pendingEvents = {};
    window.WUAnalytics.lastTrackedUrl = '';

    // SPA tracking variables
    var lastPageName = "";
    var lastPageViewTime = 0;
    var minPageViewInterval = 1000;
    var lastNavigationTime = 0;
    var minNavigationInterval = 500;

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

    // === 2. XDM STRUCTURE FUNCTIONS ===
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

    // === 3. EVENT FUNCTIONS ===
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

    function addPurchaseEvent(xdm, serialId, transactionFee) {
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

        // Ensure purchase events are counted as page views too
        xdm.web = xdm.web || {};
        xdm.web.webPageDetails = xdm.web.webPageDetails || {};
        xdm.web.webPageDetails.pageViews = { value: 1 };

        // Add serialization ID if provided
        if (serialId) {
            xdm.commerce.purchase.id = serialId;
            xdm.commerce.purchases.id = serialId;

            // Also set order ID in commerce object
            xdm.commerce.order = xdm.commerce.order || {};
            xdm.commerce.order.purchaseID = serialId;
        }

        // CRITICAL: Add revenue field - ONLY the transaction fee
        if (transactionFee && !isNaN(parseFloat(transactionFee))) {
            // Set the transaction fee as the revenue
            xdm.commerce.order = xdm.commerce.order || {};
            xdm.commerce.order.priceTotal = parseFloat(transactionFee);

            log("info", `Setting transaction fee as revenue: ${transactionFee}`);
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

    // === 4. XDM TYPE FUNCTIONS ===
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
        xdm.eventType = _eventTypeMap.pageView;

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
        xdm.eventType = _eventTypeMap.linkClick;

        // Log for debugging
        log("info", "Link click structure ensured with name: " + xdm.web.webInteraction.name);

        return xdm;
    }

    // === 5. PRODUCT FUNCTIONS ===
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

    // === 6. XDM SENDING FUNCTIONS ===

    function sendXDM(xdm) {
        try {
            if (!xdm) {
                log("error", "Cannot send empty XDM object!!!");
                return Promise.reject(new Error("Cannot send empty XDM object"));
            }

            // Store necessary values to reduce repeated lookups
            const originalEventType = xdm.eventType;
            const eventType = xdm.eventType;
            const satellite = _satellite;
            // Ensure WUAnalytics is properly initialized
            window.WUAnalytics = window.WUAnalytics || {};
            window.WUAnalytics.pendingEvents = window.WUAnalytics.pendingEvents || {};


            // Function expression using const and arrow function
            const deepClone = (obj) => {
                let clone;

                if (obj === null || typeof obj !== 'object') {
                    return obj;
                }

                if (Array.isArray(obj)) {
                    clone = [];
                    for (const item of obj) {
                        clone.push(deepClone(item));
                    }
                    return clone;
                }

                if (Object.prototype.toString.call(obj) === '[object Object]') {
                    clone = {};
                    for (const key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            clone[key] = deepClone(obj[key]);
                        }
                    }
                    return clone;
                }

                // Handle other data types like Date, Set, Map, etc., as needed
                const cloned = new obj.constructor();
                for (const key of Object.getOwnPropertyNames(obj)) {
                    cloned[key] = deepClone(obj[key]);
                }
                return cloned;
            };

            // Create a deep clone using the optimized function instead of JSON methods
            const clonedXDM = deepClone(xdm);
            clonedXDM.eventType = eventType;  // Restore eventType in case of issues

            const mergedXDM = mergeXDMWithTemplate(clonedXDM);
            mergedXDM.eventType = originalEventType;

            // Log the event type for debugging (moved to a variable for efficiency)
            const logDebugInfo = () => {
                log("info", "Sending XDM with eventType: " + mergedXDM.eventType);
            };

            logDebugInfo();

            if (mergedXDM.identityMap) {
                processIdentityMap(mergedXDM);  // Move identity processing to a helper function
            }

            // Add debug info if needed, using the global reference for efficiency
            if (satellite.debugEnabled && _debugMode) {
                mergedXDM._debug = {
                    timestamp: new Date().toISOString(),
                    eventType: mergedXDM.eventType
                };
            }

            log("info", "Sending XDM object", JSON.stringify(mergedXDM));

            // Create event key for tracking
            const eventKey = `pending_${originalEventType}_${Date.now()}`;

            // Register the event as pending
            window.WUAnalytics.pendingEvents[eventKey] = true;

            // Handle link click delay if needed
            let delay = 0;
            if (mergedXDM.eventType === 'web.webInteraction.linkClicks') {
                checkAndSetDelay(window.WUAnalytics, eventKey, 500);
            }

            return new Promise((resolve) => {
                setTimeout(() => {
                    try {
                        if (window.WUAnalytics.pendingEvents[eventKey]) {
                            delete window.WUAnalytics.pendingEvents[eventKey];
                            alloy_SEND(mergedXDM, resolve);
                        } else {
                            resolve({ superseded: true });
                        }
                    } catch (e) {
                        log("error", "Error in sendXDM timeout handler", e);
                        resolve({ error: e.message });
                    }
                }, delay);
            });

        } catch (e) {
            log("error", "Error in sendXDM", e);
            return Promise.reject(e);
        }
    }

    // Helper function to process identityMap more efficiently
    function processIdentityMap(xdm) {
        const identityMap = xdm.identityMap;

        if (identityMap) {
            Object.keys(identityMap).forEach(namespace => {
                const entries = identityMap[namespace];

                // Ensure it's an array and filter out invalid IDs
                let processedEntries;
                if (Array.isArray(entries)) {
                    processedEntries = entries.filter(id => id?.toString());
                } else {
                    processedEntries = [];
                }

                xdm.identityMap[namespace] = processedEntries;

                if (!xdm.identityMap[namespace].length) {
                    delete xdm.identityMap[namespace];  // Remove empty namespace
                }
            });

            Object.keys(identityMap).forEach(ns => {
                if (!identityMap[ns]) {
                    delete identityMap[ns];
                }
            });
        }

        return xdm;
    }

    // Helper function to handle event delays more efficiently
    function checkAndSetDelay(analytics, eventKey, maxTimeDiff = 500) {
        if (!analytics) {
            return 0; // Return 0 delay if analytics is not available
        }

        const pageViewTimestamp = analytics.pageViewData?.timestamp || 0;
        const timeSincePageView = Date.now() - pageViewTimestamp;

        return Math.max(200, timeSincePageView < maxTimeDiff ? maxTimeDiff - timeSincePageView : 0);
    }

    // Wrapper function for alloy sendEvent to handle errors and logging
    function alloy_SEND(xdmData, resolve) {
        window.alloy("sendEvent", { "xdm": xdmData })
            .then((result) => {
                log("info", "Successfully sent event with type: " + xdmData.eventType);
                resolve(result);
            })
            .catch((error) => {
                log("error", `Error in alloy.sendEvent for type ${xdmData.eventType}`, error);
                // Rejecting the promise here; since it's not chained, perhaps adjust handling if needed
                throw error;
            });
    }


    // === 7. RETRY FUNCTIONS ===
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

    // === 8. BASE XDM BUILDING ===
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

            // Set Globals
            xdm._experience = xdm._experience || {};
            xdm._experience.analytics = xdm._experience.analytics || {};
            xdm._experience.analytics.customDimensions = xdm._experience.analytics.customDimensions || {};
            xdm._experience.analytics.customDimensions.eVars = xdm._experience.analytics.customDimensions.eVars || {};
            xdm._experience.analytics.customDimensions.eVars.eVar43 = _timePartingValue;


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
            xdm._westernunion = {
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

    // === 9. SPA DETECTION FUNCTIONS ===
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

    // Helper function for SPA navigation
    function handleNavigation(source) {
        var now = new Date().getTime();

        // Skip if another navigation was processed too recently
        if (now - lastNavigationTime < minNavigationInterval) {
            log("info", "Skipping duplicate SPA navigation from " + source +
                " (" + (now - lastNavigationTime) + "ms since last event)");
            return;
        }

        // Update the timestamp
        lastNavigationTime = now;

        // Log the navigation
        log("info", "SPA navigation detected (" + source + "): " + window.location.href);

        // Reset tracking flags
        window.WUAnalytics.pvFired = false;
        window.WUAnalytics.pageViewSent = false;

        // Attempt to track the page view after a small delay
        setTimeout(function () {
            if (typeof attemptPageViewTracking === 'function') {
                attemptPageViewTracking();
            } else {
                log("info", "attemptPageViewTracking not available yet, will try to track via rule");
                // Try to trigger via rule
                if (typeof _satellite !== "undefined" && _satellite.track) {
                    _satellite.track("spa-page-view");
                }
            }
        }, 150);
    }

    // Function to check for page name changes
    function checkPageNameChange() {
        // Skip if page view tracking isn't available yet
        if (typeof attemptPageViewTracking !== 'function') {
            return;
        }

        // Check if analyticsObject exists
        if (typeof window.analyticsObject === "undefined" ||
            typeof window.analyticsObject.sc_page_name === "undefined") {
            return;
        }

        var currentPageName = window.analyticsObject.sc_page_name;
        var now = new Date().getTime();

        // If page name has changed and it's not empty
        if (currentPageName &&
            currentPageName !== "" &&
            currentPageName !== lastPageName &&
            (now - lastPageViewTime) > minPageViewInterval) {

            // Update tracking variables
            lastPageName = currentPageName;
            lastPageViewTime = now;

            // Log the change
            log("info", "Page name changed to: " + currentPageName);

            // Update Data Element directly (critical)
            _satellite.setVar("WUPageNameJSObject", currentPageName);

            // Reset page view flags
            window.WUAnalytics.pvFired = false;
            window.WUAnalytics.pageViewSent = false;

            // Trigger page view tracking directly
            log("info", "Triggering page view tracking for: " + currentPageName);

            // Small delay to ensure data elements are updated
            setTimeout(function () {
                attemptPageViewTracking();
            }, 50);
        }
    }

    // === 10. DEFINE PUBLIC WUAnalytics OBJECT ===
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
        },

        // Link click duplicate prevention
        preventDuplicateClicks: function (linkName) {
            var now = new Date().getTime();
            var lastTime = window.WUAnalytics.lastLinkTime || 0;

            // Prevent clicks less than 500ms apart
            if ((now - lastTime) < 500) {
                log("info", "Preventing duplicate click: " + linkName);
                return false;
            }

            // Update timestamp
            window.WUAnalytics.lastLinkTime = now;
            return true;
        }
    };

    // === 11. INITIALIZE THE UTILITY ===
    window.WUAnalytics.setDebugMode(true);
    log("info", "WUAnalytics utility initialized at page top");
    window.WUAnalytics.isInitialized = true;

    // === 12. SET UP SPA DETECTION ===

    // 12.1. HISTORY API AND URL MONITORING
    (function () {
        // Store original history methods
        var originalPushState = window.history.pushState;
        var originalReplaceState = window.history.replaceState;

        // Override history.pushState
        window.history.pushState = function () {
            // Call the original function
            originalPushState.apply(this, arguments);

            // Handle navigation
            handleNavigation("pushState");
        };

        // Override history.replaceState
        window.history.replaceState = function () {
            // Call the original function
            originalReplaceState.apply(this, arguments);

            // Handle navigation
            handleNavigation("replaceState");
        };

        // Add hash change listener
        window.addEventListener('hashchange', function () {
            handleNavigation("hashchange");
        });

        // Add URL polling to detect changes that don't use history API
        var lastUrl = window.location.href;
        setInterval(function () {
            var currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                handleNavigation("URL polling");
            }
        }, 500); // Check every 500ms

        log("info", "History API and URL monitoring initialized");
    })();

    // 12.2. PAGE NAME CHANGE MONITORING
    (function () {
        // Set up interval for checking page name changes
        setInterval(checkPageNameChange, 250);

        // Also check immediately
        setTimeout(checkPageNameChange, 500);

        log("info", "Page name monitor initialized");
    })();

    // 12.3. ANGULAR DOM MUTATION OBSERVER
    (function () {
        // Function to set up the observer
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
                    log("info", "Angular view change detected via DOM mutation");

                    // Reset page view tracking
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

            log("info", "Angular view observer initialized");
        }

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupAngularViewObserver);
        } else {
            setupAngularViewObserver();
        }
    })();

})();