// Western Union Analytics Middleware Utilities
// Author: Andrew Chepurny for Western Union
// Version: 2025.05.26

(function () {
    // === 1. DEFINE PRIVATE VARIABLES & UTILITY FUNCTIONS ===
    var _debugMode = true; // Set to true for development
    var _retryLimit = 3;
    var _retryDelay = 100;
    var _eventTypeMap = {
        pageView: "web.webpagedetails.pageViews",
        linkClick: "web.webInteraction.linkClicks"
    };

    var _timePartingValue = "";

    // Add the DST schedule
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
    _timePartingValue = _satellite.getVar('WUTimePartingJSObject');//calculateTimeParting(-5);

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
        xdm._experience.analytics.event101to200 = xdm._experience.analytics.event101to200 || {};
        xdm._experience.analytics.event1to100 = xdm._experience.analytics.event1to100 || {};
        xdm._experience.analytics.event201to300 = xdm._experience.analytics.event201to300 || {};
        xdm._experience.analytics.event301to400 = xdm._experience.analytics.event301to400 || {};

        return xdm;
    }

    function deepCloneXDM(xdm) {
        return JSON.parse(JSON.stringify(xdm));
    }

    function mergeXDMWithTemplate(xdm) {
        // Get the template from data element
        const template = _satellite.getVar('XDM Template') || {};

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
            const clonedXDM = deepCloneXDM(xdm);
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
        attemptLinkTracking: function (attempts) {
            attempts = attempts || 0;

            // Force execution of page name data element first
            var pagenametmp = _satellite.getVar("WUPageNameJSObject");

            // Check if utility is available
            if (typeof WUAnalytics === "undefined") {
                if (attempts < 5) {
                    setTimeout(function () {
                        WUAnalytics.attemptLinkTracking(attempts + 1);
                    }, 100);
                    return;
                } else {
                    _satellite.logger.error("WUAnalytics utility not available after 5 attempts. Link tracking aborted.");
                    return;
                }
            }

            // Add preInitialize call here to ensure analyticsObject is ready
            if (typeof WUAnalytics.preInitialize === "function") {
                WUAnalytics.preInitialize();
            }

            try {
                WUAnalytics.handleLinkClick();
                _satellite.logger.info("Direct call rule executed successfully");
            } catch (e) {
                _satellite.logger.error("Error executing direct call rule:", e);
            }
        },
        initializeLinkClickListener: function () {
            // Known link patterns
            const linkPatterns = [
                /^button-/, /^btn-/, /^link-/, /^icon-/, /^tile-/,
                /^ct-/, /^select-/, /^change-/, /^return-/, /^edit-/,
                /^canceltxn-/, /^namechange-/, /^myreceiver-/, /^sendagain-/,
                /^continue/, /^report-fraud/, /^redeem-/, /^ifsc-/,
                /^resend-/, /^payment-/, /^mywu-/, /^yes-cancel-/
            ];

            // Click handler
            document.addEventListener('click', function (event) {
                let element = event.target;
                let linkName = null;

                // Try to find link name from element or parents
                while (element && element !== document.body) {
                    // Check data-linkname
                    if (element.getAttribute && element.getAttribute('data-linkname')) {
                        linkName = element.getAttribute('data-linkname');
                        break;
                    }

                    // Check ID
                    if (element.id) {
                        // Check if ID matches known patterns
                        for (let pattern of linkPatterns) {
                            if (pattern.test(element.id)) {
                                linkName = element.id;
                                break;
                            }
                        }
                        if (linkName) break;
                    }

                    element = element.parentElement;
                }

                // Process link click if found
                if (linkName) {
                    _satellite.logger.info("[LC] Link click detected: " + linkName);

                    // Prevent duplicate clicks
                    const now = Date.now();
                    if (window.WUAnalytics.lastLinkTime && (now - window.WUAnalytics.lastLinkTime) < 500) {
                        _satellite.logger.info("[LC] Duplicate click prevented");
                        return;
                    }
                    window.WUAnalytics.lastLinkTime = now;

                    // Set data elements
                    _satellite.setVar("WUDataLinkJSObject", linkName);
                    _satellite.setVar("WULinkIDJSObject", linkName);

                    if (typeof analyticsObject !== "undefined") {
                        analyticsObject.sc_link_name = linkName;
                    }

                    // Trigger link click rule with small delay
                    setTimeout(function () {
                        _satellite.track('linkClick');
                    }, 50);
                }
            }, true);

            _satellite.logger.info("[LC] Link click listener initialized");
        },
        handleLinkClick: function () {
            let linkName = WUAnalytics.getDataElement("WULinkIDJSObject", "") || WUAnalytics.getAnalyticsObjectValue("sc_link_name", "");

            // Time-based throttling to prevent double events
            var now = new Date().getTime();
            var lastLinkTime = window.WUAnalytics.lastLinkTime || 0;
            var timeDiff = now - lastLinkTime;


            if (timeDiff < 500) {
                _satellite.logger.info("Skipping duplicate link click - too soon after previous click");
                return false;
            }

            // Update last link time
            window.WUAnalytics.lastLinkTime = now;

            // Make sure Page is Done Loading...
            if (!linkName && document.readyState !== "complete") {
                _satellite.logger.info("Skipping link click handler during page load");
                return false;
            }

            // Check if WUAnalytics utility is available
            if (typeof WUAnalytics === "undefined") {
                _satellite.logger.error("WUAnalytics utility not available. Make sure utility/setup rule has fired first.");
                // Reset flag the old way as fallback
                _satellite.setVar("Common_Events_Based_Event_Firing_Rule", false);
                return false;
            }

            try {

                _satellite.logger.info("Processing link click for: " + linkName);

                // Get events from buildWUEventsXDM
                var eventsXDM = WUAnalytics.buildWUEventsXDM();

                // If it runs successfully, ensure link structure
                if (eventsXDM) {
                    // Add link name if available
                    if (linkName) {
                        eventsXDM._experience.analytics.customDimensions.eVars.eVar61 = linkName;
                    }

                    // Ensure web.webInteraction exists
                    eventsXDM.web = eventsXDM.web || {};
                    eventsXDM.web.webInteraction = eventsXDM.web.webInteraction || {};
                    eventsXDM.web.webInteraction.name = linkName || "link_click";

                    // Ensure link click structure using utility
                    var finalXDM = WUAnalytics.ensureLinkClick(eventsXDM);

                    // Merge with XDM template before sending
                    if (typeof WUAnalytics === "object" && typeof WUAnalytics.mergeXDMWithTemplate === "function") {
                        finalXDM = WUAnalytics.mergeXDMWithTemplate(finalXDM);
                    } else {
                        _satellite.logger.warn("mergeXDMWithTemplate function not available in WUAnalytics, skipping template merge");
                    }

                    // Log for debugging
                    _satellite.logger.info("LINK EVENT XDM:", JSON.stringify(finalXDM));

                    // Send using utility
                    return WUAnalytics.sendXDM(finalXDM);
                } else {
                    _satellite.logger.error("Failed to build XDM object for link click");
                    return false;
                }
            } catch (e) {
                _satellite.logger.error("Error in handleLinkClick:", e);
            }

            return false;
        },
        buildWUEventsXDM: function () {
            // Start with a base XDM object using the utility
            let xdm = WUAnalytics.buildBaseXDM();
            let txn_id = "";
            let campId = "";
            let tempmtcn = "";

            // Get page context data elements
            var pagenametmp = WUAnalytics.getDataElement("WUPageNameJSObject", "");
            var pagenameEvnt = WUAnalytics.getDataElement("WUPagenameForEventObject", "");
            var country = WUAnalytics.getDataElement("WUCountryJSObject", "");
            var txn_status = WUAnalytics.getDataElement("WUTxnStatusJSObject", "");
            var mtcn = WUAnalytics.getDataElement("WUMtcnJSObject", "");
            var txn_fee = WUAnalytics.getDataElement("AEP - WUTransactionFeeJSObject", "");
            var refundAmnt = WUAnalytics.getDataElement("WURefundAmntJSObject", "");

            // Get link name from data elements
            let linkName = WUAnalytics.getDataElement("WUDataLinkJSObject", "") ||
                WUAnalytics.getDataElement("WULinkIDJSObject", "") ||
                WUAnalytics.getAnalyticsObjectValue("sc_link_name", "");

            // Get product info from base XDM - correctly using _westernunion namespace
            var prod = xdm._westernunion?.product || "";

            // Process link click specific events
            if (linkName) {
                // Set eVar61 for the link name
                xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;

                // Process events based on link name - mapping from legacy code
                switch (linkName) {
                    // Common event183 cases
                    case 'canceltxn-chat':
                    case 'namechange-resendpin':
                    case 'mpname-checkbox':
                    case 'namechange-cancel':
                    case 'myreceiver-history':
                    case 'myreceiver-delete':
                    case 'sendagain-newreceiver':
                    case 'continue-web':
                    case 'report-fraud-btn':
                    case 'redeem-points':
                    case 'ifsc-applied':
                    case 'edit-resend-history':
                    case 'edit-resend-inmate':
                    case 'edit-resend-billpay':
                    case 'canceltxn-cancel':
                    case 'add-card':
                    case 'edit-billingaddress':
                    case 'add-bank':
                    case 'edit-summary':
                    case 'change-amount':
                    case 'select-call':
                    case 'call-tryagain':
                    case 'select-loweramount':
                    case 'amount-tryagain':
                    case 'change-payment':
                    case 'return-smo':
                    case 'ct-resendpin':
                    case 'btn-email-self':
                    case 'visit-website':
                    case 'default-interstitial-continue':
                    case 'sm-interstitial-continue':
                    case 'namechange-cont':
                    case 'namechange-review-editagain':
                    case 'banner-smartapp-install':
                    case 'btn-contact-cont':
                    case 'button-mywu-signup':
                    case 'button-mywu-rewards':
                    case 'link-pdf-download':
                    case 'btn-info-cancel':
                    case 'btn-info-cancel-yes':
                    case 'btn-info-cancel-no':
                    case 'btn-upload-cancel':
                    case 'btn-upload-cancel-yes':
                    case 'btn-upload-cancel-no':
                    case 'btn-signup-for-free-hero-banner':
                    case 'btn-login-to-mywu-hero-banner':
                    case 'btn-redeem-now-hero-banner':
                    case 'btn-learn-more-hero-banner':
                        WUAnalytics.addEvent(xdm, 183);
                        break;

                    case 'link-i-accept':
                    case 'link-i-do-not-accept':
                        WUAnalytics.addEvent(xdm, 183);
                        // Clear analyticsObject properties if needed
                        if (typeof analyticsObject !== "undefined" &&
                            typeof analyticsObject.sc_section !== "undefined" &&
                            typeof analyticsObject.sc_sub_section !== "undefined" &&
                            analyticsObject.sc_section === "register-rp" &&
                            analyticsObject.sc_sub_section === "tnc-popup") {
                            analyticsObject.sc_sub_section = "";
                        }
                        break;

                    // UDM cases
                    case 'link-showdetails':
                    case 'link-hidedetails':
                        WUAnalytics.addEvent(xdm, 3);
                        break;

                    case 'update-delivery-method':
                    case 'menu-update-delivery-method':
                        WUAnalytics.addEvent(xdm, 251);
                        break;

                    case 'btn-udm-sd-start-cont':
                        WUAnalytics.addEvent(xdm, 268);
                        break;

                    case 'btn-udm-sd-review-cont':
                        WUAnalytics.addEvent(xdm, 269);
                        break;

                    case 'btn-sd-review-edit':
                        WUAnalytics.addEvent(xdm, 274);
                        break;

                    case 'btn-udm-ra-cont':
                        WUAnalytics.addEvent(xdm, 270);
                        break;

                    case 'btn-udm-ra-start-cont':
                        WUAnalytics.addEvent(xdm, 271);
                        break;

                    case 'btn-ra-review-confirm':
                        WUAnalytics.addEvent(xdm, 272);
                        break;

                    case 'btn-ra-review-edit':
                        WUAnalytics.addEvent(xdm, 273);
                        break;

                    case 'btn-pr-register':
                        WUAnalytics.addEvent(xdm, 3);
                        break;

                    case 'button-smo-continue':
                        WUAnalytics.addEvent(xdm, 134);
                        // Trigger additional tag if needed
                        if (typeof _satellite !== "undefined") {
                            _satellite.track('3rd_Party_Tag_Global_FL_Send_Money_Start_Currency_Tool_Events');
                        }
                        break;
                    case 'button-review-continue':
                        WUAnalytics.addEvent(xdm, 183);
                        WUAnalytics.addEvent(xdm, 10);
                        break;

                    case 'button-Enroll':
                        xdm._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin-button-Enroll";
                        WUAnalytics.addEvent(xdm, 183);
                        WUAnalytics.addEvent(xdm, 40);
                        break;

                    case 'cont-add-receiver':
                        WUAnalytics.addEvent(xdm, 240);
                        break;

                    case 'cont-update-receiver':
                        WUAnalytics.addEvent(xdm, 241);
                        break;

                    case 'canceltxn-reason-cancel':
                        xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
                        WUAnalytics.addEvent(xdm, 183);
                        break;

                    case 'return-to-partner':
                        WUAnalytics.addEvent(xdm, 183);
                        break;

                    case 'canceltxn-reason-cont':
                        var reasoncode = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
                        var hiphenloc = reasoncode.indexOf("-");
                        if (hiphenloc > 0) {
                            xdm._experience.analytics.customDimensions.eVars.eVar68 = reasoncode.substring(0, hiphenloc);
                        }
                        WUAnalytics.addEvent(xdm, 183);
                        break;

                    case 'canceltxn-history':
                    case 'link-cancel-transfer':
                    case 'canceltxn-tt':
                        xdm._experience.analytics.customDimensions.eVars.eVar65 = "canceltxn-initiated";
                        WUAnalytics.addEvent(xdm, 196);
                        WUAnalytics.addEvent(xdm, 197);
                        break;

                    case 'canceltxn-reason':
                        xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
                        xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
                        WUAnalytics.addEvent(xdm, 183);
                        WUAnalytics.addEvent(xdm, 233);
                        break;

                    case 'canceltxn-submit-cr':
                        xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
                        WUAnalytics.addEvent(xdm, 183);
                        break;

                    case 'retailct-namechange':
                        xdm._experience.analytics.customDimensions.eVars.eVar65 = 'canceltxn-namechange';
                        WUAnalytics.addEvent(xdm, 183);
                        break;

                    case 'link-edit-receiver-name':
                        WUAnalytics.addEvent(xdm, 211);
                        break;

                    case 'namechange-submit':
                        WUAnalytics.addEvent(xdm, 212);
                        break;

                    case 'namechange-decline-ct':
                        xdm._experience.analytics.customDimensions.eVars.eVar65 = "canceltxn-initiated";
                        WUAnalytics.addEvent(xdm, 196);
                        WUAnalytics.addEvent(xdm, 197);
                        WUAnalytics.addEvent(xdm, 183);
                        break;

                    case 'button-lookup':
                    case 'yes-cancel-lookup':
                    case 'button-doc-submit':
                    case 'yes-cancel-docupload':
                    case 'mywu-tat-cta':
                        WUAnalytics.addEvent(xdm, 183);
                        break;

                    case 'sendagain_continue':
                        WUAnalytics.addEvent(xdm, 181);
                        WUAnalytics.addEvent(xdm, 182);
                        break;

                    case 'download-app':
                        WUAnalytics.addEvent(xdm, 68);
                        break;

                    // Resend cases
                    case 'resend-history':
                    case 'resend-billpay':
                    case 'resend-inmate':
                    case 'resend-receiver':
                    case 'rvw-resend-history':
                    case 'rvw-resend-inmate':
                    case 'rvw-resend-billpay':
                    case 'cont-resend-history':
                    case 'cont-resend-inmate':
                    case 'cont-resend-billpay':
                    case 'link-resend':
                        WUAnalytics.addEvent(xdm, 201);
                        WUAnalytics.addEvent(xdm, 202);
                        break;

                    case 'continue_details':
                    case 'continue_details_ta':
                        WUAnalytics.addEvent(xdm, 144);
                        WUAnalytics.addEvent(xdm, 145);
                        break;

                    case 'payment-continue':
                        WUAnalytics.addEvent(xdm, 222);
                        WUAnalytics.addEvent(xdm, 223);
                        break;

                    case 'doddfrankedit':
                        WUAnalytics.addEvent(xdm, 204);
                        break;

                    case 'button-video':
                    case 'button-geniii':
                    case 'button-start-video':
                        WUAnalytics.addEvent(xdm, 183);
                        break;

                    case 'btn-info-next':
                        WUAnalytics.addEvent(xdm, 283);
                        // Get unique reference number from form field
                        try {
                            var uniRefNum = document.getElementById('postalCode') ? document.getElementById('postalCode').value : '';
                            if (uniRefNum) {
                                xdm._experience.analytics.customDimensions.eVars.eVar75 = uniRefNum;
                                _satellite.cookie.set('uniRefNumCookie', uniRefNum);
                            }
                        } catch (e) {
                            _satellite.logger.error("Error getting postalCode value: " + e);
                        }
                        break;

                    case 'btn-upload-submit':
                        WUAnalytics.addEvent(xdm, 284);
                        // Get verification document type
                        try {
                            var kycIdSelected = document.getElementById("fieldid0");
                            if (kycIdSelected) {
                                xdm._experience.analytics.customDimensions.eVars.eVar76 = kycIdSelected.options[kycIdSelected.selectedIndex].text;
                            }
                        } catch (e) {
                            _satellite.logger.error("Error getting fieldid0 value: " + e);
                        }
                        break;

                    case 'btn-login':
                        WUAnalytics.addEvent(xdm, 1);
                        WUAnalytics.addEvent(xdm, 183);
                        break;

                    case 'btn-register-user':
                        WUAnalytics.addEvent(xdm, 3);
                        WUAnalytics.addEvent(xdm, 183);
                        break;
                }

                // Always add event183 to any link click (as per the original code)
                WUAnalytics.addEvent(xdm, 183);
            }

            // UDM Start
            switch (pagenameEvnt) {
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

            // Send Money Receipt Handling
            if (
                pagenametmp !== "" &&
                pagenametmp.indexOf("send-money:receipt-staged") === -1 &&
                pagenametmp.indexOf("send-money:receipt:under-review") === -1 &&
                pagenametmp.indexOf("send-money:receipt:on-hold") === -1 &&
                pagenametmp.indexOf("send-money:receipt") !== -1
            ) {
                if (typeof prod !== "undefined" && prod !== "" && txn_status === "approved") {
                    // Add event133 with principal value
                    WUAnalytics.addEvent(xdm, 133, WUAnalytics.getDataElement("WUPrincipalJSObject", 0));

                    // Add event71 with discount amount
                    WUAnalytics.addEvent(xdm, 71, WUAnalytics.getDataElement("WUDiscountAmountJSObject", 0));

                    // Store transaction ID in XDM
                    txn_id = WUAnalytics.getAnalyticsObjectValue("sc_transaction_id", "");
                    xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

                    // Store products in XDM
                    WUAnalytics.setProduct(xdm, prod, txn_fee);

                    // Add purchase event
                    WUAnalytics.addPurchaseEvent(xdm, txn_id, txn_fee);
                }
            }

            /* SM - Receipt (Approval) */
            else if (pagenametmp !== "" && pagenametmp.indexOf("send-money:confirmationscreen") !== -1) {
                if (typeof prod !== "undefined" && prod !== "" && txn_status === "approved") {
                    txn_id = WUAnalytics.getAnalyticsObjectValue("sc_transaction_id", "");
                    xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

                    // Add purchase event
                    WUAnalytics.setProduct(xdm, prod, txn_fee);
                    WUAnalytics.addPurchaseEvent(xdm, txn_id, txn_fee);
                }
            }
            else if (pagenametmp !== "" && (pagenametmp.indexOf("send-money:declineoptions") !== -1 || pagenametmp.indexOf("send-money:bank-decline-lightbox") !== -1)) {
                if (typeof prod !== "undefined" && prod !== "") {
                    // Add event56
                    WUAnalytics.addEvent(xdm, 56);

                    // Add event34
                    WUAnalytics.addEvent(xdm, 34);

                    WUAnalytics.setProduct(xdm, prod, txn_fee, { event34: txn_fee });
                }
            }

            /* SM - Kyc choose Options */
            else if (pagenametmp !== "" && pagenametmp.indexOf("send-money:kycconfirmidentity") !== -1) {
                if (typeof prod !== "undefined" && prod !== "") {
                    WUAnalytics.addEvent(xdm, 56);
                    WUAnalytics.addEvent(xdm, 34);
                    WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
                } else {
                    WUAnalytics.addEvent(xdm, 56);
                }
            }

            /* SM - Receipt on hold */
            else if (pagenametmp !== "" && pagenametmp.indexOf("send-money:receipt:on-hold") !== -1) {
                if (typeof prod !== "undefined" && prod !== "") {
                    WUAnalytics.addEvent(xdm, 56);
                    WUAnalytics.addEvent(xdm, 34);
                    WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
                } else {
                    WUAnalytics.addEvent(xdm, 56);
                }
            }

            // Send Money flow
            if (pagenametmp !== "" && pagenametmp.indexOf("fraudprotection") == -1) {
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

                    var loginStatus = WUAnalytics.getAnalyticsObjectValue("sc_login_state", "");
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

                if (pagenametmp != "" && pagenametmp.indexOf("send-money:receiverinformation") != -1) {
                    if (_satellite.cookie.get("SM_Start_Cookie") && _satellite.cookie.get("SM_Start_Cookie") == "true") {
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
                    } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") != "") {
                        xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
                    }
                }

                // SM - Payment
                if (pagenametmp != "" && pagenametmp.indexOf("send-money:paymentinformation") != -1) {
                    WUAnalytics.addEvent(xdm, 8);
                    WUAnalytics.addEvent(xdm, 13);

                    if (analyticsObject.sc_quicksend_id) {
                        campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                        xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
                    } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") != "") {
                        xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
                    }
                }

                // SM - Review
                if (pagenametmp != "" && pagenametmp.indexOf("send-money:review") != -1) {
                    WUAnalytics.addEvent(xdm, 9);
                    WUAnalytics.addEvent(xdm, 14);

                    if (analyticsObject.sc_quicksend_id) {
                        campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                        xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
                    } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") != "") {
                        xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
                    }
                }
            }

            // SM - Confirm Identity
            if (pagenametmp != "" && pagenametmp.indexOf("send-money:confirmidentity") != -1) {
                if (analyticsObject.sc_quicksend_id) {
                    campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") != "") {
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
                }
            }

            // SM - Receiver Information (More Info)
            if (pagenametmp != "" && pagenametmp.indexOf("send-money:receiverinformation:more-info") != -1) {
                if (analyticsObject.sc_quicksend_id) {
                    campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") != "") {
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
                }
            }

            // SM - WU Pay Receipt
            if (pagenametmp != "" &&
                (pagenametmp.indexOf("send-money:sendmoneywupayreceipt") != -1 ||
                    pagenametmp.indexOf("send-money:wire-complete") != -1 ||
                    pagenametmp.indexOf("send-money:sendmoneypartnerfundsreceipt") != -1)) {
                if (mtcn != "") {
                    WUAnalytics.addEvent(xdm, 64); // with mtcn
                    WUAnalytics.addEvent(xdm, 34); // with txn_id

                    if (typeof prod != "undefined" && prod != "") {
                        WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
                    }
                }
            }

            // Forgot Password flows
            if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:start") != -1) {
                WUAnalytics.addEvent(xdm, 82);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:emailsent") != -1) {
                WUAnalytics.addEvent(xdm, 85);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:securityquestion") != -1) {
                WUAnalytics.addEvent(xdm, 86);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:resetpassword") != -1) {
                WUAnalytics.addEvent(xdm, 87);
            }

            // Name Change flows
            if (pagenametmp != "" && pagenametmp.indexOf("name-change:enter-pin") != -1) {
                WUAnalytics.addEvent(xdm, 209);
                WUAnalytics.addEvent(xdm, 210);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("name-change:editreceiver-name") != -1) {
                var lastPgName = WUAnalytics.getDataElement("WULinkIDJSObject", "");
                if (lastPgName != "" && lastPgName.indexOf("cancel-transfer:reason") != -1) {
                    xdm._experience.analytics.customDimensions.eVars.eVar61 = "receiver-namechange";
                    WUAnalytics.addEvent(xdm, 213);
                    WUAnalytics.addEvent(xdm, 214);
                    WUAnalytics.addEvent(xdm, 211);
                } else {
                    WUAnalytics.addEvent(xdm, 213);
                    WUAnalytics.addEvent(xdm, 214);
                }
            }

            if (pagenametmp != "" && (pagenametmp.indexOf("name-change:review") != -1 || pagenametmp.indexOf("name-change:namechangereview") != -1)) {
                WUAnalytics.addEvent(xdm, 215);
                WUAnalytics.addEvent(xdm, 216);
            }

            if (pagenametmp != "" && (pagenametmp.indexOf("name-change:receipt") != -1 || pagenametmp.indexOf("name-change:namechangereceipt") != -1)) {
                if (txn_id != "") {
                    WUAnalytics.addEvent(xdm, 217);
                }
            }

            // Collect ID flows
            if (pagenametmp != "" && (pagenametmp.indexOf("collectid:details") != -1 || pagenametmp.indexOf("collect-id:details") != -1)) {
                WUAnalytics.addEvent(xdm, 142);
                WUAnalytics.addEvent(xdm, 143);

                if (typeof analyticsObject.sc_verify_status != "undefined" &&
                    analyticsObject.sc_verify_status.toLowerCase() == "unverified" &&
                    analyticsObject.sc_user_id != "" &&
                    typeof analyticsObject.sc_user_id != "undefined") {
                    WUAnalytics.addEvent(xdm, 244);
                }
            }

            if (pagenametmp != "" && pagenametmp.indexOf("collectid:failed") != -1) {
                WUAnalytics.addEvent(xdm, 148);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("fraudprotection") == -1) {
                // Profile page transaction history
                if (pagenametmp != "" && pagenametmp.indexOf("profile:txn-history") != -1) {
                    if (typeof analyticsObject.sc_verify_status != "undefined" &&
                        analyticsObject.sc_verify_status.toLowerCase() == "inprogress" &&
                        analyticsObject.sc_user_id != "" &&
                        typeof analyticsObject.sc_user_id != "undefined") {
                        WUAnalytics.addEvent(xdm, 245);
                    }
                }

                // Send money start verification status
                if (pagenametmp != "" && pagenametmp.indexOf("send-money:start") != -1) {
                    if (typeof analyticsObject.sc_verify_status != "undefined" &&
                        analyticsObject.sc_verify_status.toLowerCase() == "verified" &&
                        analyticsObject.sc_user_id != "" &&
                        typeof analyticsObject.sc_user_id != "undefined") {
                        WUAnalytics.addEvent(xdm, 248);
                    }
                }
            }

            // EKYC flows
            if (pagenametmp != "" && pagenametmp.indexOf("collectid:ekyc-failed") != -1) {
                if (typeof analyticsObject.sc_verify_status != "undefined" &&
                    analyticsObject.sc_verify_status.toLowerCase() == "suspended" &&
                    analyticsObject.sc_user_id != "" &&
                    typeof analyticsObject.sc_user_id != "undefined") {
                    WUAnalytics.addEvent(xdm, 247);
                }
            }

            if (pagenametmp != "" && pagenametmp.indexOf("collectid:identify") != -1) {
                if (typeof analyticsObject.sc_verify_status != "undefined" &&
                    analyticsObject.sc_verify_status.toLowerCase() == "rejected" &&
                    analyticsObject.sc_user_id != "" &&
                    typeof analyticsObject.sc_user_id != "undefined") {
                    WUAnalytics.addEvent(xdm, 246);
                }
            }

            // Track transfer flows
            if (pagenametmp != "" &&
                (pagenametmp.indexOf("track-transfer:moneytransfer-tab:status") != -1 ||
                    pagenametmp.indexOf("track-transfer:sender_tab:status") != -1 ||
                    pagenametmp.indexOf("track-transfer:receiver_tab:status") != -1 ||
                    pagenametmp.indexOf("track-transfer:sender-tab:status") != -1 ||
                    pagenametmp.indexOf("track-transfer:receiver-tab:status") != -1 ||
                    pagenametmp.indexOf("track-transfer-success") != -1)) {

                xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");

                if (WUAnalytics.getDataElement("WULinkDisplayJSObject", "") != "" && WUAnalytics.getDataElement("WULinkDisplayJSObject", "") != "null") {
                    xdm._experience.analytics.customDimensions.listProps.list1 = WUAnalytics.getDataElement("WULinkDisplayJSObject", "");
                    WUAnalytics.addEvent(xdm, 206);
                }

                if (WUAnalytics.getDataElement("WUMsgIdJSObject", "") != "" && WUAnalytics.getDataElement("WUMsgIdJSObject", "") != "null") {
                    xdm._experience.analytics.customDimensions.props.prop13 = "msg:" + WUAnalytics.getDataElement("WUMsgIdJSObject", "");
                    xdm._experience.analytics.customDimensions.props.prop14 = WUAnalytics.getDataElement("WUPageNameJSObject", "") + "|" + xdm._experience.analytics.customDimensions.props.prop13;
                }

                WUAnalytics.addEvent(xdm, 29);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("track-transfer:billpayment-tab:status") != -1) {
                WUAnalytics.addEvent(xdm, 29);
            }

            // Re-send sprint20
            if (pagenametmp != "" && pagenametmp.indexOf("send-money:sendagain") != -1) {
                WUAnalytics.addEvent(xdm, 5);
                WUAnalytics.addEvent(xdm, 11);

                if (analyticsObject.sc_quicksend_id) {
                    campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (WUAnalytics.getDataElement("WUInternalCampaignJSObject", "") != "") {
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = WUAnalytics.getDataElement("WUInternalCampaignJSObject", "");
                }
            }

            // Send money receipt staged
            if (pagenametmp != "" && pagenametmp.indexOf("send-money:receipt-staged") != -1) {
                if (typeof analyticsObject.sc_transaction_id != "undefined" &&
                    analyticsObject.sc_transaction_id != "" &&
                    analyticsObject.sc_transaction_id != null) {
                    var tid = analyticsObject.sc_transaction_id.toLowerCase();
                    tempmtcn = tid.slice(6).trim();
                }

                xdm._experience.analytics.customDimensions.eVars.eVar20 = tempmtcn;
                xdm._experience.analytics.customDimensions.eVars.eVar21 = "staged";
                WUAnalytics.addEvent(xdm, 118);
                WUAnalytics.addEvent(xdm, 120, txn_fee);
            }

            // HSFP
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

            // Collect ID YBL confirm
            if (pagenametmp != "" && pagenametmp.indexOf("collect-id:confirmybl") != -1) {
                WUAnalytics.addEvent(xdm, 236);
            }

            // KYC flows
            if (pagenametmp != "" && pagenametmp.indexOf("kyc:lookup") != -1) {
                if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() != "no") {
                    WUAnalytics.addEvent(xdm, 77);
                }
            }

            if (pagenametmp != "" && pagenametmp.indexOf("kyc:docupload") != -1) {
                if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() != "no") {
                    WUAnalytics.addEvent(xdm, 78);
                }
            }

            if (pagenametmp != "" && pagenametmp.indexOf("kyc:upload-success") != -1) {
                if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() != "no") {
                    WUAnalytics.addEvent(xdm, 79);
                }
            }

            // DUT KYC Changes
            if (pagenametmp != "" && pagenametmp.indexOf("kyc:info") != -1) {
                WUAnalytics.addEvent(xdm, 277);
                WUAnalytics.addEvent(xdm, 285);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("kyc:upload") != -1) {
                WUAnalytics.addEvent(xdm, 278);
                WUAnalytics.addEvent(xdm, 286);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("kyc:success") != -1) {
                WUAnalytics.addEvent(xdm, 279);
                WUAnalytics.addEvent(xdm, 287);
            }

            // Cancel transfer flows
            if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:reason") != -1) {
                xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
                xdm._experience.analytics.customDimensions.listProps.list2 = analyticsObject.sc_ab_testing ? analyticsObject.sc_ab_testing.toLowerCase() : "";
                WUAnalytics.addEvent(xdm, 218);
                WUAnalytics.addEvent(xdm, 219);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-transfer-cont") != -1) {
                xdm._experience.analytics.customDimensions.eVars.eVar61 = "canceltxn-abandoned";
                xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
                WUAnalytics.addEvent(xdm, 183);
            }

            if (pagenametmp != "" &&
                (pagenametmp.indexOf("cancel-transfer:review-full-refund") != -1 ||
                    pagenametmp.indexOf("cancel-transfer:review-pr-refund") != -1)) {

                xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");

                if (WUAnalytics.getDataElement("WULinkDisplayJSObject", "") != "" && WUAnalytics.getDataElement("WULinkDisplayJSObject", "") != "null") {
                    xdm._experience.analytics.customDimensions.listProps.list1 = WUAnalytics.getDataElement("WULinkDisplayJSObject", "");
                    WUAnalytics.addEvent(xdm, 206);
                }

                WUAnalytics.addEvent(xdm, 185);
                WUAnalytics.addEvent(xdm, 186);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-full-refund") != -1) {
                xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar21 = "refunded";

                if (mtcn != "") {
                    WUAnalytics.addEvent(xdm, 189);
                    WUAnalytics.addEvent(xdm, 198, refundAmnt);
                    WUAnalytics.addEvent(xdm, 199, txn_fee);
                }
                WUAnalytics.setProduct(xdm, prod, -txn_fee, { event34: txn_fee });
            }

            if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-pr-refund") != -1) {
                xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar21 = "refunded";

                if (mtcn != "") {
                    WUAnalytics.addEvent(xdm, 189);
                    WUAnalytics.addEvent(xdm, 198, refundAmnt);
                }
            }

            // Case request and declined transfers
            if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:case-request") != -1) {
                xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
            }

            if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:declined") != -1) {
                xdm._experience.analytics.customDimensions.eVars.eVar65 = WUAnalytics.getDataElement("WUCancelStatusJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar66 = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
                xdm._experience.analytics.customDimensions.eVars.eVar68 = WUAnalytics.getDataElement("WUReasonCategoryJSObject", "");
            }

            // Inmate receipt
            if (pagenametmp != "" && (pagenametmp.indexOf("send-inmate:inmatereceipt") != -1 ||
                pagenametmp.indexOf("send-inmate:receipt") != -1)) {
                if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
                    xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

                    WUAnalytics.addEvent(xdm, 133, WUAnalytics.getDataElement("WUPrincipalJSObject", 0));
                    WUAnalytics.setProduct(xdm, prod, WUAnalytics.getDataElement("WUPrincipalJSObject", 0), { event34: txn_fee });
                    WUAnalytics.addPurchaseEvent(xdm, txn_id, txn_fee);
                } else if (typeof prod != "undefined" && prod != "") {
                    // on-hold, under review, null
                    WUAnalytics.addEvent(xdm, 56);
                    WUAnalytics.addEvent(xdm, 34);
                    WUAnalytics.setProduct(xdm, prod, txn_fee, { event34: txn_fee });
                }
            }

            // Bill pay receipt
            if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:receipt") != -1) {
                if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
                    xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

                    WUAnalytics.addEvent(xdm, 133, WUAnalytics.getDataElement("WUPrincipalJSObject", 0));
                    WUAnalytics.setProduct(xdm, prod, txn_fee, { event34: txn_fee });
                    WUAnalytics.addPurchaseEvent(xdm, txn_id, txn_fee);
                } else if (typeof prod != "undefined" && prod != "") {
                    // on-hold, under review, null
                    WUAnalytics.addEvent(xdm, 56);
                    WUAnalytics.addEvent(xdm, 34);
                    WUAnalytics.setProduct(xdm, prod, txn_fee, { event34: txn_fee });
                }
            }

            // Fraud protection
            if (pagenametmp != "" && pagenametmp.indexOf("fraudprotection") != -1) {
                WUAnalytics.addEvent(xdm, 114);
                WUAnalytics.addEvent(xdm, 115);
            }

            // Request Money flow
            if (pagenametmp != "" && pagenametmp.indexOf("request-money:estimate") != -1) {
                WUAnalytics.addEvent(xdm, 172);
                WUAnalytics.addEvent(xdm, 173);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("request-money:receiverinfo") != -1) {
                WUAnalytics.addEvent(xdm, 174);
                WUAnalytics.addEvent(xdm, 175);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("request-money:complete") != -1) {
                WUAnalytics.addEvent(xdm, 180);
            }

            // Pickup cash flows
            if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:start") != -1) {
                WUAnalytics.addEvent(xdm, 160);
                WUAnalytics.addEvent(xdm, 161);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:senderinfo") != -1) {
                if (sessionStorage.getItem("sc_links")) {
                    var sclink = sessionStorage.getItem("sc_links");
                    if (sclink.indexOf("website:tracktransfer:details") != -1) {
                        // below events are added in case user reaches sender info page from track transfer flow
                        if ("mx" == country) {
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

            if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:senderinfo:namemismatch") != -1) {
                WUAnalytics.addEvent(xdm, 166);
                WUAnalytics.addEvent(xdm, 167);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:securityquestion") != -1) {
                WUAnalytics.addEvent(xdm, 168);
                WUAnalytics.addEvent(xdm, 169);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:confirm") != -1) {
                WUAnalytics.addEvent(xdm, 170);
                WUAnalytics.addEvent(xdm, 171);
            }

            // Profile Page Events
            linkName = linkName || "link-profile-icon";
            switch (pagenameEvnt) {
                case "profile:personal-info":
                    if (analyticsObject.sc_link_name && analyticsObject.sc_link_name != "" &&
                        analyticsObject.sc_link_name.toLowerCase() == "button-save-password") {
                        xdm._experience.analytics.customDimensions.eVars.eVar61 = analyticsObject.sc_link_name;
                        WUAnalytics.addEvent(xdm, 184);
                    } else {
                        xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
                        if (linkName != "") {
                            switch (linkName) {
                                case "button-save-address":
                                case "button-save-securityques":
                                case "confirm-pin":
                                    WUAnalytics.addEvent(xdm, 184);
                                    break;
                            }
                        }
                    }
                    break;

                case "profile:edit-address":
                    if ("icon-edit-address" == linkName) {
                        WUAnalytics.addEvent(xdm, 183);
                    }
                    xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
                    break;

                case "profile:edit-password":
                    if ("icon-edit-password" == linkName) {
                        WUAnalytics.addEvent(xdm, 183);
                    }
                    xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
                    break;

                case "profile:edit-securityques":
                    if ("icon-edit-securityques" == linkName) {
                        WUAnalytics.addEvent(xdm, 183);
                    }
                    xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
                    break;

                case "profile:edit-email":
                    if ("icon-edit-email" == linkName) {
                        WUAnalytics.addEvent(xdm, 183);
                    }
                    xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
                    break;
            }

            // Use Case Promo
            if (pagenametmp != "" && pagenametmp.indexOf("send-money:start:enterpromo") != -1) {
                if (WUAnalytics.getDataElement("WULinkDisplayJSObject", "") != "" && WUAnalytics.getDataElement("WULinkDisplayJSObject", "") != "null") {
                    xdm._experience.analytics.customDimensions.listProps.list1 = WUAnalytics.getDataElement("WULinkDisplayJSObject", "");
                    WUAnalytics.addEvent(xdm, 206);
                }
            }

            // Delete the mtchannel cookie for digital cancel transfer flow
            if (pagenametmp != "" && (pagenametmp.indexOf("profile:txn-history") != -1 || pagenametmp.indexOf("track-transfer") != -1)) {
                _satellite.cookie.remove("cancelTransferMTChannel");
            }

            // Third-party data consent popup
            if (pagenametmp.indexOf("thirdpartydataconsent") != -1) {
                WUAnalytics.addEvent(xdm, 300);
            }

            // Page Not Found
            if (window.document.title.match("404")) {
                WUAnalytics.addEvent(xdm, 404);
            }

            // Special handling for Peru currency exchange app
            if (pagenametmp != "" && pagenametmp.indexOf("pe:es:website-ce:perform-operation:confirm-subscription") != -1) {
                WUAnalytics.addEvent(xdm, 357);
            }

            if (pagenametmp != "" && pagenametmp.indexOf("pe:es:website-ce:perform-operation:success-subscription") != -1) {
                WUAnalytics.addEvent(xdm, 358);
            }

            // Forgot password specific flows
            if (analyticsObject.sc_fpstep3 && analyticsObject.sc_fpstep3 == "true") {
                WUAnalytics.addEvent(xdm, 86);
            }

            if (analyticsObject.sc_fpsuccess && analyticsObject.sc_fpsuccess == "true") {
                WUAnalytics.addEvent(xdm, 88);
            }

            // Progressive Register
            if ((pagenametmp != "" && pagenametmp.indexOf("register") != -1 && pagenametmp.indexOf("verifycode") == -1 && pagenametmp.indexOf("progressive-register:contact") == -1) || pagenametmp.indexOf("referee:tnc-popup") != -1) {

                xdm._experience.analytics.customDimensions.eVars.eVar45 = pagenametmp;
                xdm._experience.analytics.customDimensions.props.prop20 = pagenametmp;
                xdm._experience.analytics.customDimensions.eVars.eVar23 = 'progressive-register';

                // Ensure the web.webInteraction object exists
                xdm.web = xdm.web || {};
                xdm.web.webInteraction = xdm.web.webInteraction || {};
                xdm.web.webInteraction.name = 'progressive-flow';
                WUAnalytics.addEvent(xdm, 281);
            }

            // Registration success via analyticsObject
            if (analyticsObject.sc_registersuccess && analyticsObject.sc_registersuccess == "true") {
                WUAnalytics.addEvent(xdm, 4);
            }

            // Handle case when sending to NCA 2.0
            if ((pagenametmp.indexOf("send-money:receipt") != -1 ||
                pagenametmp.indexOf("send-money:sendmoneywupayreceipt") != -1 ||
                pagenametmp.indexOf("send-money:sendmoneycashreceipt") != -1 ||
                pagenametmp.indexOf("bill-pay:receipt") != -1) &&
                typeof countryConfig != "undefined") {

                // Setting Backup for Session Storage Object
                _satellite.cookie.set('lastTransactionDatestamp', new Date().getTime(), { expires: 365 });

                if (WUAnalytics.getDataElement("nca2.0", false)) {
                    WUAnalytics.addEvent(xdm, 282);
                }
            }

            // Clean up any login/register cookies
            function deleteCookieRegLogin() {
                if (localStorage && localStorage.sc_login_success && localStorage.sc_login_success == "true") {
                    localStorage.removeItem("sc_login_success");
                } else if (sessionStorage && sessionStorage.sc_login_success && sessionStorage.sc_login_success == "true") {
                    sessionStorage.removeItem("sc_login_success");
                }
                if (sessionStorage && sessionStorage.sc_register_success && sessionStorage.sc_register_success == "true") {
                    sessionStorage.removeItem("sc_register_success");
                }
            }

            // Login/Register Success handlers
            if (WUAnalytics.getDataElement("WULoginSuccessJSObject", false)) {
                xdm._experience.analytics.customDimensions.eVars.eVar42 = "login";
                _satellite.cookie.remove("NewUserCookie");
                if (!(country == "us" && pagenametmp != "" && pagenametmp.indexOf("contactus") != -1)) {
                    WUAnalytics.addEvent(xdm, 2);
                }
            }

            // Registration success handlers
            if (country && "nz" != country) {
                if (WUAnalytics.getDataElement("WURegisterSuccessJSObject", false)) {
                    xdm._experience.analytics.customDimensions.eVars.eVar42 = "register";
                    if (_satellite.cookie.get("mywuoptin") == "yes") {
                        xdm._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin";
                        WUAnalytics.addEvent(xdm, 40);
                    }

                    // Set NewUserCookie for registration
                    _satellite.cookie.set("NewUserCookie", true, { expires: 1 });

                    WUAnalytics.addEvent(xdm, 4);

                    // 3rdparty data user consent
                    if (analyticsObject.sc_3rdPartyDataOptin != undefined) {
                        WUAnalytics.addEvent(xdm, 299);
                        xdm._experience.analytics.customDimensions.eVars.eVar81 = analyticsObject.sc_3rdPartyDataOptin ? "consent-accepted" : "consent-denied";
                        analyticsObject.sc_3rdPartyDataOptin = undefined;
                    }
                }
            }

            // Process error events
            if (typeof analyticsObject.sc_error != "undefined" && analyticsObject.sc_error != "") {
                WUAnalytics.addEvent(xdm, 31);
            }

            // Make sure the XDM isn't empty
            if (typeof WUAnalytics === "object" && typeof WUAnalytics.handleEmptyXDM === "function") {
                xdm = WUAnalytics.handleEmptyXDM(xdm);
            } else {
                _satellite.logger.warn("handleEmptyXDM function not available in WUAnalytics, ensuring basic structure");
                // Basic fallback to ensure structure
                xdm = xdm || {};
                xdm.web = xdm.web || {};
                xdm.web.webPageDetails = xdm.web.webPageDetails || {};
                xdm.eventType = xdm.eventType || "web.webInteraction.linkClicks";
            }

            return xdm;
        },

        buildWUPageViewXDM: function () {
            // We only want this to run once on page load, using a DTM data element to store that flag
            if (typeof WUAnalytics.getPageViewFlag === "function" && WUAnalytics.getPageViewFlag()) {
                return null; // Already ran this function, so return null
            }

            // Don't set flag yet - wait until successful completion
            // WUAnalytics.setPageViewFlag(true); // Moved to after successful XDM creation

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

            // Make sure page name is populated in the XDM object
            if (!xdm.web.webPageDetails.name || xdm.web.webPageDetails.name === "") {
                xdm.web.webPageDetails.name = pageName;
            }
            _satellite.logger.info("Capturing page view for: " + pageName);

            // Get page context data elements
            var pagenametmp = WUAnalytics.getDataElement("WUPageNameJSObject", "");
            var country = WUAnalytics.getDataElement("WUCountryJSObject", "");
            var txn_status = WUAnalytics.getDataElement("WUTxnStatusJSObject", "");
            var mtcn = WUAnalytics.getDataElement("WUMtcnJSObject", "");
            var txn_fee = WUAnalytics.getDataElement("AEP - WUTransactionFeeJSObject", "");
            var refundAmnt = WUAnalytics.getDataElement("WURefundAmntJSObject", "");
            var verification_failed = WUAnalytics.getAnalyticsObjectValue("sc_id_verification_failed", "");
            var verification_blocked = WUAnalytics.getAnalyticsObjectValue("sc_online_verify", "");
            var verification_success = WUAnalytics.getAnalyticsObjectValue("sc_user_verify", "");
            var id_verification_success = WUAnalytics.getDataElement("WUIdVerifySuccessJSObject", "");
            var linkName = WUAnalytics.getDataElement("WULinkIDJSObject", "");
            var pageNameEvnt = WUAnalytics.getDataElement("WUPagenameForEventObject", "");
            var pageType = WUAnalytics.getDataElement("WUPageTypeJSObject", "");
            var accountid = WUAnalytics.getDataElement("WUAccountJSObject", "");

            // Get product info from base XDM - correctly using _westernunion namespace
            var prod = xdm._westernunion?.product || "";

            // Add a safe wrapper for WUAnalytics.addEvent to prevent errors
            function safeAddEvent(xdm, eventNum, value) {
                try {
                    if (typeof WUAnalytics === "object" && typeof WUAnalytics.addEvent === "function") {
                        WUAnalytics.addEvent(xdm, eventNum, value);
                    } else {
                        // Fallback implementation if WUAnalytics.addEvent is not available
                        var eventBucket = "event1to100";
                        var eventKey = "event" + eventNum;

                        if (eventNum > 100 && eventNum <= 200) {
                            eventBucket = "event101to200";
                        } else if (eventNum > 200 && eventNum <= 300) {
                            eventBucket = "event201to300";
                        } else if (eventNum > 300 && eventNum <= 400) {
                            eventBucket = "event301to400";
                        }

                        if (!xdm._experience) xdm._experience = {};
                        if (!xdm._experience.analytics) xdm._experience.analytics = {};
                        if (!xdm._experience.analytics[eventBucket]) xdm._experience.analytics[eventBucket] = {};

                        if (value) {
                            xdm._experience.analytics[eventBucket][eventKey] = { value: value };
                        } else {
                            xdm._experience.analytics[eventBucket][eventKey] = { value: 1 };
                        }
                    }
                } catch (e) {
                    _satellite.logger.error("Error adding event " + eventNum + ": " + e.message);
                }
            }

            // ===== KYC Functionality =====
            // DUT KYC - Info Page
            if (pagenametmp !== "" && pagenametmp.indexOf("kyc:info") !== -1) {
                safeAddEvent(xdm, 277);
                safeAddEvent(xdm, 285);
            }
            // DUT KYC - Upload Page
            else if (pagenametmp !== "" && pagenametmp.indexOf("kyc:upload") !== -1 && !pagenametmp.includes("kyc:upload-")) {
                safeAddEvent(xdm, 278);
                safeAddEvent(xdm, 286);
                // Safely set eVar75
                if (!xdm._experience) xdm._experience = {};
                if (!xdm._experience.analytics) xdm._experience.analytics = {};
                if (!xdm._experience.analytics.customDimensions) xdm._experience.analytics.customDimensions = {};
                if (!xdm._experience.analytics.customDimensions.eVars) xdm._experience.analytics.customDimensions.eVars = {};
                xdm._experience.analytics.customDimensions.eVars.eVar75 = _satellite.cookie.get("uniRefNumCookie");
                _satellite.cookie.remove("uniRefNumCookie");
            }
            // DUT KYC - Success Page
            else if (pagenametmp !== "" && pagenametmp.indexOf("kyc:success") !== -1) {
                safeAddEvent(xdm, 279);
                safeAddEvent(xdm, 287);
            }
            // Special case for Spanish doctransfer page
            else if (country == "es" && pagenametmp !== "" && pagenametmp.indexOf("send-money:doctransfer") !== -1) {
                if (lastPageUrl != "undefined" && lastPageUrl !== "" && lastPageUrl.indexOf("review.html") !== -1 && txn_status === "c2001") {
                    if (typeof prod !== "undefined" && prod !== "") {
                        // Handle product setting safely
                        if (typeof WUAnalytics === "object" && typeof WUAnalytics.setProduct === "function") {
                            WUAnalytics.setProduct(xdm, prod, null, { event34: txn_fee });
                        } else {
                            // Fallback for product setting
                            if (!xdm._experience.analytics.event1to100.event34) {
                                xdm._experience.analytics.event1to100.event34 = { value: txn_fee };
                            }
                        }
                        safeAddEvent(xdm, 56);
                        safeAddEvent(xdm, 34);
                    } else {
                        safeAddEvent(xdm, 56);
                    }
                }
            }

            // Make sure we merge with XDM Template
            if (typeof WUAnalytics === "object" && typeof WUAnalytics.handleEmptyXDM === "function") {
                xdm = WUAnalytics.handleEmptyXDM(xdm);
            } else {
                _satellite.logger.warn("handleEmptyXDM function not available in WUAnalytics, ensuring basic structure");
                // Basic fallback to ensure structure
                xdm = xdm || {};
                xdm.web = xdm.web || {};
                xdm.web.webPageDetails = xdm.web.webPageDetails || {};
                xdm.web.webPageDetails.pageViews = xdm.web.webPageDetails.pageViews || { value: 1 };
                xdm.eventType = "web.webpagedetails.pageViews";
            }

            return xdm;
        },
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