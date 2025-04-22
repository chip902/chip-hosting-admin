// Western Union Analytics Utilities
// Author: Andrew Chepurny for Western Union
// Version: 2025.04.20

(function () {
    // Create global namespace if it doesn't exist
    window.WUAnalytics = window.WUAnalytics || {};
    window.WUAnalytics.pvFired = false;

    // Private variables
    var _debugMode = false;
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
    function addEvent(xdm, eventNum, value) {
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

        // Set event value in the appropriate object
        const eventName = `event${eventNum}`;
        targetObj[eventName] = value !== undefined ? value : 1;

        return xdm;
    }

    function addPurchaseEvent(xdm) {
        xdm = ensureXDMStructure(xdm);

        xdm._experience.analytics.events = xdm._experience.analytics.events || [];
        xdm._experience.analytics.events.push({ name: 'purchase' });

        return xdm;
    }

    // XDM Type Functions
    function ensurePageView(xdm) {
        // First ensure structure is preserved
        xdm = ensureXDMStructure(xdm);

        // PRESERVE existing web structure if present
        xdm.web = xdm.web || {};
        xdm.web.webPageDetails = xdm.web.webPageDetails || {};
        xdm.web.webPageDetails.pageViews = { value: 1 };

        xdm.eventType = _eventTypeMap.pageView;

        // Make sure we preserve the reference
        _satellite.setVar('XDM westernunion Merged Object', xdm);

        return xdm;
    }

    function ensureLinkClick(xdm) {
        // First ensure structure is preserved
        xdm = ensureXDMStructure(xdm);

        // PRESERVE existing web structure if present
        xdm.web = xdm.web || {};
        xdm.web.webInteraction = xdm.web.webInteraction || {};
        xdm.web.webInteraction.linkClicks = { value: 1 };

        xdm.eventType = _eventTypeMap.linkClick;

        return xdm;
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

    // Product Functions
    function setProduct(xdm, productName, price, eventData) {
        if (!productName) {
            log("warn", "Cannot set product with empty name");
            return xdm;
        }

        const product = {
            name: productName
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

            // Merge with template before sending
            const mergedXDM = mergeXDMWithTemplate(xdm);

            // Store for reference/debugging
            _satellite.setVar('XDM westernunion Merged Object', mergedXDM);

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
                    timestamp: new Date().toISOString()
                };
            }

            log("info", "Sending merged XDM object", JSON.stringify(mergedXDM));

            return window.alloy("sendEvent", {
                "xdm": mergedXDM
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
                // Consider adding retry logic here
            }

            xdm._westernunion = {
                identity: {}
            };

            // Only add accountID to identity map if it exists
            if (accountID && accountID !== '') {
                validateAndSetIdentity(xdm, "AACUSTOMID", accountID, false);
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
        setPageViewFlag: function (value) {
            window.WUAnalytics.pvFired = value;
            _satellite.setVar("Common_Page_Name_Based_Event_Firing_Rule", value);
        },

        // Update your getPageViewFlag function
        getPageViewFlag: function () {
            return window.WUAnalytics.pvFired || getDataElement("Common_Page_Name_Based_Event_Firing_Rule", false);
        },
        resetPageViewFlag: function (delay) {
            setTimeout(function () {
                _satellite.setVar("Common_Page_Name_Based_Event_Firing_Rule", false);
            }, delay || 5000);
        },
        validateAndSetIdentity: function (xdm, namespace, id, isPrimary) {
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
    };

    // Initialize debug mode
    window.WUAnalytics.setDebugMode(true);

    // Log initialization
    log("info", "WUAnalytics utility initialized at page top");
    window.WUAnalytics.isInitialized = true;
})();