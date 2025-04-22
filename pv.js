/**
 * Western Union WebSDK Page View Event Conversion
 * 
 * This code converts the page view event tracking from AppMeasurement format to WebSDK XDM format
 * It maintains all the same conditional logic but outputs an XDM object instead of setting s.events
 */

function ensurePageView(xdm) {
    var pageXDM = xdm || _satellite.getVar('XDM westernunion Merged Object') || {};

    pageXDM.web = {
        ...(pageXDM.web || {}),
        webPageDetails: {
            ...(pageXDM.web?.webPageDetails || {}),
            pageViews: { value: 1 }
        }
    };

    pageXDM.eventType = "web.webpagedetails.pageViews";
    _satellite.setVar('XDM westernunion Merged Object', pageXDM);

    return pageXDM;
}

function buildWUPageViewXDM() {
    // We only want this to run once on page load, using a DTM data element to store that flag
    if (_satellite.getVar("Common_Page_Name_Based_Event_Firing_Rule")) {
        return null; // Already ran this function, so return null
    }

    // Set flag to indicate we've run this function
    _satellite.setVar("Common_Page_Name_Based_Event_Firing_Rule", "true");

    // Initialize variables similar to the original code
    var pagenametmp = _satellite.getVar("WUPageNameJSObject");
    var country = _satellite.getVar("WUCountryJSObject");

    /* --------------- Generate product value start --------------- */
    try {
        var prod = "";
        var txn_type = "";
        var platform = "";
        var pay_method = "";
        var del_method = "";
        var loginStatus = "";
        var txn_fee = "";
        var sendzip = "";
        var principal = "";
        var txn_id = "";
        var txn_status = _satellite.getVar("WUTxnStatusJSObject");
        var verification_failed = analyticsObject.sc_id_verification_failed ? analyticsObject.sc_id_verification_failed.toLowerCase() : "";
        var verification_blocked = analyticsObject.sc_online_verify ? analyticsObject.sc_online_verify.toLowerCase() : "";
        var verification_success = analyticsObject.sc_user_verify ? analyticsObject.sc_user_verify.toLowerCase() : "";
        var id_verification_success = _satellite.getVar("WUIdVerifySuccessJSObject");
        var linkName = _satellite.getVar("WULinkIDJSObject") || "";
        var pageNameEvnt = _satellite.getVar("WUPagenameForEventObject");
        var pageType = _satellite.getVar("WUPageTypeJSObject");
        var mtcn = _satellite.getVar("WUMtcnJSObject");
        var txn_fee = _satellite.getVar("WUTransactionFeeJSObject");
        var refundAmnt = _satellite.getVar("WURefundAmntJSObject");
        var accountid = _satellite.getVar("WUAccountJSObject");
    } catch (e) {
        _satellite.logger.warn('Error in AEP Common PageView Rule.  Unable to set variable: ', e);
    }


    // Initialize the XDM object for Adobe WebSDK
    let xdm = {
        eventType: "web.webpagedetails.pageViews",
        web: {
            webPageDetails: {
                pageViews: {
                    value: 1
                }
            }
        },
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

    // Helper function to add events to XDM
    function addEvent(eventNum, value, context) {
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
            return; // Event number out of range
        }

        // Set event value in the appropriate object
        const eventName = `event${eventNum}`;
        targetObj[eventName] = value !== undefined ? value : 1;

        // Check if this is a link click event
        if (context && context.linkClick) {
            xdm.eventType = "web.webInteraction.linkClicks";
        }
    }

    // Add purchase event function
    function addPurchaseEvent() {
        xdm._experience.analytics.events = xdm._experience.analytics.events || [];
        xdm._experience.analytics.events.push({ name: 'purchase' });
    }

    // Get values from analyticsObject
    if (typeof analyticsObject != "undefined" && analyticsObject != "") {
        if (typeof analyticsObject.sc_payment_method != "undefined" && analyticsObject.sc_payment_method != "") {
            pay_method = String(analyticsObject.sc_payment_method).toLowerCase();
        }
        if (typeof analyticsObject.sc_delivery_method != "undefined" && analyticsObject.sc_delivery_method != "") {
            del_method = String(analyticsObject.sc_delivery_method).toLowerCase();
        }
        if (typeof analyticsObject.sc_txn_type != "undefined" && analyticsObject.sc_txn_type != "") {
            txn_type = String(analyticsObject.sc_txn_type).toLowerCase();
        }
        if (typeof analyticsObject.sc_platform != "undefined" && analyticsObject.sc_platform != "") {
            platform = String(analyticsObject.sc_platform).toLowerCase();
        }
        if (typeof analyticsObject.sc_login_state != "undefined" && analyticsObject.sc_login_state != "") {
            loginStatus = String(analyticsObject.sc_login_state).toLowerCase();
        }
        if (typeof analyticsObject.sc_principal != "undefined" && analyticsObject.sc_principal != "") {
            principal = String(analyticsObject.sc_principal).toLowerCase();
        }
        if (typeof analyticsObject.sc_send_zip != "undefined" && analyticsObject.sc_send_zip != "") {
            sendzip = String(analyticsObject.sc_send_zip).toLowerCase();
        }
        if (typeof analyticsObject.sc_txn_fee != "undefined" && analyticsObject.sc_txn_fee != "") {
            txn_fee = parseFloat(String(analyticsObject.sc_txn_fee)).toFixed(2);
            if (txn_fee < 0) {
                txn_fee = 0;
            }
        }
        if (typeof analyticsObject.sc_transaction_id != "undefined" && analyticsObject.sc_transaction_id != "") {
            txn_id = String(analyticsObject.sc_transaction_id).toLowerCase();
        }
        txn_status = _satellite.getVar("WUTxnStatusJSObject");
    }

    // Set up delivery method
    if (_satellite.getVar("WUDeliveryMethodJSObject") != "") {
        var mw_delivery = _satellite.getVar("WUDeliveryMethodJSObject");
        if (_satellite.getVar("WUWalletServiceProvider") != "none") {
            mw_delivery = mw_delivery + "-" + _satellite.getVar("WUWalletServiceProvider");
        }
        xdm._experience.analytics.customDimensions.eVars.eVar13 = mw_delivery;
    }

    // Set up product string
    if (pay_method != "" && txn_type != "" && platform != "") {
        if (del_method != "") {
            prod = platform + "|" + txn_type + "|" + pay_method + "|" + del_method;
        } else {
            prod = platform + "|" + txn_type + "|" + pay_method;
        }
    }

    // Start replicating the original conditional logic for event setting

    // UDM Start
    switch (pageNameEvnt) {
        case "update-delivery-method:start":
            addEvent(252);
            addEvent(253);
            break;

        case "update-delivery-method:review":
            addEvent(254);
            addEvent(255);
            break;

        case "update-delivery-method:receipt":
            if (mtcn != "") {
                addEvent(256);
            }
            break;

        case "update-delivery-method:decline":
        case "update-delivery-method:receiver-assisted:decline":
            addEvent(257);
            addEvent(258);
            break;

        case "update-delivery-method:redirect-start":
            addEvent(259);
            addEvent(260);
            break;

        case "update-delivery-method:receiver-assisted:start":
            addEvent(261);
            addEvent(262);
            break;

        case "update-delivery-method:receiver-assisted:shareinfo":
            addEvent(263);
            addEvent(264);
            break;

        case "update-delivery-method:receiver-assisted:review":
            addEvent(265);
            addEvent(266);
            break;

        case "update-delivery-method:receiver-assisted:receipt":
            if (mtcn != "") {
                addEvent(267);
            }
            break;
    }
    // UDM - End

    // Send Money Receipt Handling
    if (
        pagenametmp != "" &&
        pagenametmp.indexOf("send-money:receipt-staged") == -1 &&
        pagenametmp.indexOf("send-money:receipt:under-review") == -1 &&
        pagenametmp.indexOf("send-money:receipt:on-hold") == -1 &&
        pagenametmp.indexOf("send-money:receipt") != -1
    ) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            addPurchaseEvent();
            addEvent(133, _satellite.getVar("WUPrincipalJSObject") ?? 0);
            addEvent(71, _satellite.getVar("WUDiscountAmountJSObject") ?? 0);

            // Add transaction ID
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

            // Add products
            xdm.productListItems = [
                {
                    name: prod,
                    priceTotal: txn_fee
                }
            ];
        }
    }

    // SM - Receipt (Approval)
    else if (pagenametmp != "" && pagenametmp.indexOf("send-money:confirmationscreen") != -1) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;
            addPurchaseEvent();

            xdm.productListItems = [
                {
                    name: prod,
                    priceTotal: txn_fee
                }
            ];
        }
    }

    // SM - Kyc Confirmation
    else if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:receipt") != -1) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;
            addPurchaseEvent();
            addEvent(133, _satellite.getVar("WUPrincipalJSObject") ?? 0);

            xdm.productListItems = [
                {
                    name: prod,
                    priceTotal: txn_fee
                }
            ];
        } else if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        }
    }

    // PB - Receipt
    else if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:confirmationscreen") != -1) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;
            addPurchaseEvent();

            xdm.productListItems = [
                {
                    name: prod,
                    priceTotal: txn_fee
                }
            ];
        } else if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        }
    }

    // Inmate - Receipt
    else if (
        pagenametmp != "" &&
        (pagenametmp.indexOf("send-inmate:inmatereceipt") != -1 || pagenametmp.indexOf("send-inmate:receipt") != -1)
    ) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;
            addPurchaseEvent();
            addEvent(133, _satellite.getVar("WUPrincipalJSObject") ?? 0);

            xdm.productListItems = [
                {
                    name: prod,
                    priceTotal: txn_fee
                }
            ];
        } else if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        }
    }

    // Inmate - Kyc Confirmation
    else if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:confirmationscreen") != -1) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;
            addPurchaseEvent();

            xdm.productListItems = [
                {
                    name: prod,
                    priceTotal: txn_fee
                }
            ];
        } else if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        }
    }

    // SM - All Decline Scenarios
    else if (
        pagenametmp != "" &&
        (pagenametmp.indexOf("send-money:declineoptions") != -1 || pagenametmp.indexOf("send-money:bank-decline-lightbox") != -1)
    ) {
        if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        } else {
            addEvent(56);
        }
    }

    // SM - Kyc choose Options
    else if (pagenametmp != "" && pagenametmp.indexOf("send-money:kycconfirmidentity") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        } else {
            addEvent(56);
        }
    }

    // SM - Receipt on hold
    else if (pagenametmp != "" && pagenametmp.indexOf("send-money:receipt:on-hold") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        } else {
            addEvent(56);
        }
    }

    // SM - Receipt under review
    else if (pagenametmp != "" && pagenametmp.indexOf("send-money:receipt:under-review") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        } else {
            addEvent(56);
        }
    }

    // Pay-bills - Kyc choose Options
    else if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:kycconfirmidentity") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        } else {
            addEvent(56);
        }
    }

    // Pay-bills - bank decline
    else if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:bank-decline-lightbox") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        } else {
            addEvent(56);
        }
    }

    // Pay-bills - decline options
    else if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:declineoptions") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        } else {
            addEvent(56);
        }
    }

    // Inmate - Kyc options
    else if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:kycconfirmidentity") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        } else {
            addEvent(56);
        }
    }

    // Inmate - bank decline light box
    else if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:bank-decline-lightbox") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        } else {
            addEvent(56);
        }
    }

    // Inmate - wu-pay -and -cash decline light box
    else if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:declineoptions") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            addEvent(56);
            addEvent(34);

            xdm.productListItems = [
                {
                    name: prod,
                    eventData: {
                        event34: txn_fee
                    }
                }
            ];
        } else {
            addEvent(56);
        }
    }

    // DUT KYC - Info Page
    else if (pagenametmp != "" && pagenametmp.indexOf("kyc:info") != -1) {
        addEvent(277);
        addEvent(285);
    }

    // DUT KYC - Upload Page
    else if (pagenametmp != "" && pagenametmp.indexOf("kyc:upload") != -1 && !pagenametmp.includes("kyc:upload-")) {
        addEvent(278);
        addEvent(286);

        xdm._experience.analytics.customDimensions.eVars.eVar75 = _satellite.cookie.get("uniRefNumCookie");
        _satellite.cookie.remove("uniRefNumCookie");
    }

    // DUT KYC - Success Page
    else if (pagenametmp != "" && pagenametmp.indexOf("kyc:success") != -1) {
        addEvent(279);
        addEvent(287);
    }

    // Special case for Spanish doctransfer page
    else if (country == "es" && pagenametmp != "" && pagenametmp.indexOf("send-money:doctransfer") != -1) {
        var lastPageUrl = document.referrer;
        if (lastPageUrl != "undefined" && lastPageUrl != "" && lastPageUrl.indexOf("review.html") != -1 && txn_status == "c2001") {
            if (typeof prod != "undefined" && prod != "") {
                addEvent(56);
                addEvent(34);

                xdm.productListItems = [
                    {
                        name: prod,
                        eventData: {
                            event34: txn_fee
                        }
                    }
                ];
            } else {
                addEvent(56);
            }
        }
    }

    // Default case - set product if available, and handle all the other conditions
    else {
        if (typeof prod != "undefined" && prod != "") {
            xdm.productListItems = [
                {
                    name: prod,
                    priceTotal: 0
                }
            ];
        }

        if (pagenametmp != "" && pagenametmp.indexOf("fraudprotection") == -1) {
            // SM - Start
            if (pagenametmp != "" && pagenametmp.indexOf("send-money:start") != -1) {
                _satellite.cookie.remove("SM_Start_Cookie");
                if (country) {
                    if (country != "us") {
                        if (principal != "") {
                            addEvent(6);
                            addEvent(67);
                        }
                    }
                }
                if (loginStatus == "loggedin") {
                    addEvent(5);
                    addEvent(11);
                    _satellite.cookie.set("SM_Start_Cookie", "true");
                }

                var selectedText = "";
                var countrySelect = "";
                var countrySelect = document.getElementById("wu-country-list");
                if (countrySelect != null && countrySelect !== undefined) {
                    selectedText = countrySelect.options[countrySelect.selectedIndex].text;
                }
                if (selectedText != "" && selectedText != null && selectedText !== undefined && selectedText.trim().toLowerCase() == "service unavailable") {
                    xdm._experience.analytics.customDimensions.eVars.eVar61 = "service unavailable";
                    addEvent(206);
                }
            }

            // SM - Receiver
            if (pagenametmp != "" && pagenametmp.indexOf("send-money:receiverinformation") != -1) {
                if (_satellite.cookie.get("SM_Start_Cookie") && _satellite.cookie.get("SM_Start_Cookie") == "true") {
                    addEvent(7);
                    addEvent(12);
                } else {
                    _satellite.cookie.set("SM_Start_Cookie", "true");
                    addEvent(5);
                    addEvent(7);
                    addEvent(11);
                    addEvent(12);
                }

                if (analyticsObject.sc_quicksend_id) {
                    var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
                }
            }

            // SM - Payment
            if (pagenametmp != "" && pagenametmp.indexOf("send-money:paymentinformation") != -1) {
                addEvent(8);
                addEvent(13);

                if (analyticsObject.sc_quicksend_id) {
                    var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
                }
            }

            // SM - Review
            if (pagenametmp != "" && pagenametmp.indexOf("send-money:review") != -1) {
                addEvent(9);
                addEvent(14);

                if (analyticsObject.sc_quicksend_id) {
                    var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                    xdm._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
                }
            }
        }

        // SM - Confirm Identity
        if (pagenametmp != "" && pagenametmp.indexOf("send-money:confirmidentity") != -1) {
            if (analyticsObject.sc_quicksend_id) {
                var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
            } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                xdm._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
            }
        }

        // SM - Global Collect ID
        if (pagenametmp != "" && pagenametmp.indexOf("send-money:globalcollectid") != -1) {
            if (analyticsObject.sc_quicksend_id) {
                var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
            } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                xdm._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
            }
        }

        // SM - WU Pay Receipt
        if (
            pagenametmp != "" &&
            (pagenametmp.indexOf("send-money:sendmoneywupayreceipt") != -1 ||
                pagenametmp.indexOf("send-money:wire-complete") != -1 ||
                pagenametmp.indexOf("send-money:sendmoneypartnerfundsreceipt") != -1)
        ) {
            if (mtcn != "") {
                addEvent(64);
                addEvent(34);

                if (typeof prod != "undefined" && prod != "") {
                    xdm.productListItems = [
                        {
                            name: prod,
                            eventData: {
                                event34: txn_fee
                            }
                        }
                    ];
                }
            }
        }

        // PB - Start
        if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:start") != -1) {
            _satellite.cookie.remove("BillPay_Start_Cookie");
            if (loginStatus == "loggedin") {
                addEvent(121);
                addEvent(126);
                _satellite.cookie.set("BillPay_Start_Cookie", "true");
            }
        }

        // PB - Biller Information
        if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:requiredbillerinformation") != -1) {
            addEvent(121);
            addEvent(122);
            addEvent(126);
            addEvent(127);
        }

        // PB - Payment Information
        if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:paymentinformation") != -1) {
            if (_satellite.cookie.get("BillPay_Start_Cookie") && _satellite.cookie.get("BillPay_Start_Cookie") == "true") {
                addEvent(123);
                addEvent(128);
            } else {
                addEvent(121);
                addEvent(123);
                addEvent(126);
                addEvent(128);
                _satellite.cookie.set("BillPay_Start_Cookie", "true");
            }
        }

        // PB - Review
        if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:review") != -1) {
            addEvent(124);
            addEvent(129);
        }

        // Inmate - Start
        if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:start") != -1) {
            _satellite.cookie.remove("SendInmate_Start_Cookie");
            if (loginStatus == "loggedin") {
                addEvent(18);
                addEvent(23);
                _satellite.cookie.set("SendInmate_Start_Cookie", "true");
            }
        }

        // Inmate - Receiver
        if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:inmatereceiverinformation") != -1) {
            addEvent(18);
            addEvent(19);
            addEvent(23);
            addEvent(24);
        }

        // Inmate - Payment
        if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:inmatepaymentinformation") != -1) {
            if (_satellite.cookie.get("SendInmate_Start_Cookie") && _satellite.cookie.get("SendInmate_Start_Cookie") == "true") {
                addEvent(20);
                addEvent(25);
            } else {
                addEvent(18);
                addEvent(23);
                addEvent(20);
                addEvent(25);
                _satellite.cookie.set("SendInmate_Start_Cookie", "true");
            }
        }

        // Inmate - Review
        if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:inmatereview") != -1) {
            addEvent(21);
            addEvent(26);
        }

        // Price Estimate - Start
        if (
            pagenametmp != "" &&
            (pagenametmp.indexOf("price-estimator:continue") != -1 ||
                pagenametmp.indexOf("price-estimator:performestimatedfeeinquiry") != -1 ||
                pagenametmp.indexOf("send-inmate:performestimatedinmatefeeinquiry") != -1)
        ) {
            addEvent(30);
        }

        // Search - Results pages
        if (pagenametmp != "" && pagenametmp.indexOf("search:results") != -1) {
            addEvent(33);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("search:no-results") != -1) {
            addEvent(33);
        }

        // Password recovery pages
        if (
            pagenametmp != "" &&
            pagenametmp.indexOf("password-recovery") != -1 &&
            pagenametmp.indexOf("securityquestion") == -1 &&
            pagenametmp.indexOf("emailsent") == -1 &&
            pagenametmp.indexOf("resetpassword") == -1
        ) {
            addEvent(53);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("password-recovery:resetpassword") != -1) {
            addEvent(66);
        }

        // Registration pages
        if (
            pageNameEvnt != "" &&
            (pageNameEvnt == "send-money:register" ||
                pageNameEvnt == "register" ||
                pageNameEvnt == "send-inmate:register" ||
                pageNameEvnt == "register:sm-login" ||
                pageNameEvnt == "bill-pay:register")
        ) {
            addEvent(89);
            addEvent(92);
        }

        // Profile pages
        if (pagenametmp != "" && pagenametmp.indexOf("profile:personal-info") != -1) {
            if (
                analyticsObject.sc_link_name &&
                analyticsObject.sc_link_name != "" &&
                (analyticsObject.sc_link_name.toLowerCase() == "save-password" || analyticsObject.sc_link_name.toLowerCase() == "button-save-password")
            ) {
                xdm._experience.analytics.customDimensions.eVars.eVar61 = analyticsObject.sc_link_name;
                addEvent(184, 1, { linkClick: true });
            } else {
                xdm._experience.analytics.customDimensions.eVars.eVar61 = "link-profile-icon";
                if (linkName != "") {
                    switch (linkName) {
                        case "save-address":
                        case "button-save-address":
                        case "save-securityques":
                        case "button-save-securityques":
                        case "confirm-pin":
                            addEvent(184, 1, { linkClick: true });
                            break;
                    }
                }
            }
        }

        // Link click events
        if (pagenametmp != "" && pagenametmp.indexOf("profile:edit-address") != -1) {
            if ("edit-address" == linkName || "icon-edit-address" == linkName) {
                addEvent(183, 1, { linkClick: true });
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("profile:edit-password") != -1) {
            if ("edit-password" == linkName || "icon-edit-password" == linkName) {
                addEvent(183, 1, { linkClick: true });
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("profile:edit-securityques") != -1) {
            if ("edit-securityques" == linkName || "icon-edit-securityques" == linkName) {
                addEvent(183, 1, { linkClick: true });
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("profile:edit-email") != -1) {
            if ("edit-email" == linkName || "icon-edit-email" == linkName) {
                addEvent(183, 1, { linkClick: true });
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("my-receivers:edit-receiver") != -1) {
            if ("mysmreceiver-edit" == linkName || "mybillpayreceiver-edit" == linkName || "myinmatereceiver-edit" == linkName) {
                addEvent(183, 1, { linkClick: true });
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("my-receivers:add-receiver") != -1) {
            if ("myreceiver-add" == linkName) {
                addEvent(183, 1, { linkClick: true });
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        // Links from MyWU Portal
        if (s.Util.getQueryParam("sln")) {
            addEvent(183, 1, { linkClick: true });
            xdm._experience.analytics.customDimensions.eVars.eVar61 = s.Util.getQueryParam("sln");
        }

        // HSFP handling
        if (s.Util.getQueryParam("partnerName")) {
            _satellite.cookie.set("hsfp_partner", s.Util.getQueryParam("partnerName"));
        }

        if (_satellite.cookie.get("hsfp_partner")) {
            xdm._experience.analytics.customDimensions.eVars.eVar71 = _satellite.cookie.get("hsfp_partner").toLowerCase();
            _satellite.cookie.remove("hsfp_partner");
        }

        if (analyticsObject.sc_sso_status == "true") {
            addEvent(234);
        }

        // KYC pages
        if (pagenametmp != "" && pagenametmp.indexOf("kyc:lookup") != -1) {
            if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() != "no") {
                addEvent(77);
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("kyc:docupload") != -1) {
            if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() != "no") {
                addEvent(78);
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("kyc:upload-success") != -1) {
            if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() != "no") {
                addEvent(79);
            }
        }

        // Send money send again
        if (pagenametmp != "" && pagenametmp.indexOf("send-money:sendagain") != -1) {
            addEvent(5);
            addEvent(11);

            if (analyticsObject.sc_quicksend_id) {
                var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
            } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                xdm._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
            }
        }

        // Cancel transfer flows
        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:reason") != -1) {
            xdm._experience.analytics.customDimensions.listProps.list2 = analyticsObject.sc_ab_testing ? analyticsObject.sc_ab_testing.toLowerCase() : "";
            xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            addEvent(218);
            addEvent(219);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-transfer-cont") != -1) {
            xdm._experience.analytics.customDimensions.eVars.eVar61 = "canceltxn-abandoned";
            xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
            addEvent(183, 1, { linkClick: true });
        }

        if (
            pagenametmp != "" &&
            (pagenametmp.indexOf("cancel-transfer:review-full-refund") != -1 || pagenametmp.indexOf("cancel-transfer:review-pr-refund") != -1)
        ) {
            xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");

            if (_satellite.getVar("WULinkDisplayJSObject") != "" && _satellite.getVar("WULinkDisplayJSObject") != "null") {
                xdm._experience.analytics.customDimensions.listProps.list1 = _satellite.getVar("WULinkDisplayJSObject");
                addEvent(206);
            }

            addEvent(185);
            addEvent(186);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-full-refund") != -1) {
            xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar21 = "refunded";

            if (mtcn != "") {
                addEvent(189);
                addEvent(198, refundAmnt);
                addEvent(199, txn_fee);
            }

            xdm.productListItems = [
                {
                    name: "",
                    priceTotal: -txn_fee
                }
            ];
        }

        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-pr-refund") != -1) {
            xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar21 = "refunded";

            if (mtcn != "") {
                addEvent(189);
                addEvent(198, refundAmnt);
            }
        }

        // More cancel transfer handling
        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:case-request") != -1) {
            xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
        }

        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:declined") != -1) {
            xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            xdm._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
        }

        // Request Money flow
        if (pagenametmp != "" && pagenametmp.indexOf("request-money:estimate") != -1) {
            addEvent(172);
            addEvent(173);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("request-money:receiverinfo") != -1) {
            addEvent(174);
            addEvent(175);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("request-money:complete") != -1) {
            addEvent(180);
        }

        // Pickup cash flow
        if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:start") != -1) {
            addEvent(160);
            addEvent(161);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:senderinfo") != -1) {
            if (sessionStorage.getItem("sc_links")) {
                var sclink = sessionStorage.getItem("sc_links");
                if (sclink.indexOf("website:tracktransfer:details") != -1) {
                    if ("mx" == country) {
                        addEvent(160);
                        addEvent(161);
                        addEvent(162);
                        addEvent(163);
                    } else {
                        addEvent(160);
                        addEvent(161);
                    }
                }
            }

            addEvent(164);
            addEvent(165);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:senderinfo:namemismatch") != -1) {
            addEvent(166);
            addEvent(167);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:securityquestion") != -1) {
            addEvent(168);
            addEvent(169);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:confirm") != -1) {
            addEvent(170);
            addEvent(171);
        }

        // Send money receipt staged
        if (pagenametmp != "" && pagenametmp.indexOf("send-money:receipt-staged") != -1) {
            if (
                typeof analyticsObject.sc_transaction_id != "undefined" &&
                analyticsObject.sc_transaction_id != "" &&
                analyticsObject.sc_transaction_id != null
            ) {
                var tid = analyticsObject.sc_transaction_id.toLowerCase();
                var tempmtcn = tid.slice(6).trim();
            }

            xdm._experience.analytics.customDimensions.eVars.eVar20 = tempmtcn;
            xdm._experience.analytics.customDimensions.eVars.eVar21 = "staged";
            addEvent(118);
            addEvent(120, txn_fee);
        }

        // Handle cookie cleanup
        if (pagenametmp != "" && (pagenametmp.indexOf("profile:txn-history") != -1 || pagenametmp.indexOf("track-transfer") != -1)) {
            _satellite.cookie.remove("cancelTransferMTChannel");
        }

        // Login success
        if (_satellite.getVar("WULoginSuccessJSObject")) {
            xdm._experience.analytics.customDimensions.eVars.eVar42 = "login";
            _satellite.cookie.remove("NewUserCookie");

            if (!(country == "us" && pagenametmp != "" && pagenametmp.indexOf("contactus") != -1)) {
                addEvent(2);
            }
        }

        // Registration success (non-NZ)
        if (country && "nz" != country) {
            if (_satellite.getVar("WURegisterSuccessJSObject")) {
                xdm._experience.analytics.customDimensions.eVars.eVar42 = "register";

                if (_satellite.cookie.get("mywuoptin") == "yes") {
                    xdm._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin";
                    addEvent(40);
                }

                _satellite.cookie.set("NewUserCookie", true, { expires: 1 });
                addEvent(4);

                // 3rdparty data user consent
                if (analyticsObject.sc_3rdPartyDataOptin != undefined) {
                    addEvent(299);
                    xdm._experience.analytics.customDimensions.eVars.eVar81 = analyticsObject.sc_3rdPartyDataOptin ? "consent-accepted" : "consent-denied";
                    analyticsObject.sc_3rdPartyDataOptin = undefined;
                    sessionStorage.removeItem("DTM-3rdPartyDataOptin");
                }
            }
        }
        // Registration success (NZ)
        else if (country && "nz" == country) {
            if (_satellite.getVar("WUPageTypeJSObject") && _satellite.getVar("WUPageTypeJSObject") == "responsive") {
                if (_satellite.getVar("WURegisterSuccessJSObject")) {
                    xdm._experience.analytics.customDimensions.eVars.eVar42 = "register";

                    if (_satellite.cookie.get("mywuoptin") == "yes") {
                        xdm._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin";
                        addEvent(40);
                    }

                    _satellite.cookie.set("NewUserCookie", true, { expires: 1 });
                    addEvent(4);

                    // 3rdparty data user consent
                    if (analyticsObject.sc_3rdPartyDataOptin != undefined) {
                        addEvent(299);
                        xdm._experience.analytics.customDimensions.eVars.eVar81 = analyticsObject.sc_3rdPartyDataOptin ? "consent-accepted" : "consent-denied";
                        analyticsObject.sc_3rdPartyDataOptin = undefined;
                        sessionStorage.removeItem("DTM-3rdPartyDataOptin");
                    }
                }
            } else if (pagenametmp != "" && pagenametmp.indexOf("verification") != -1) {
                var lastPageUrl = document.referrer;
                if (lastPageUrl != "undefined" && lastPageUrl != "" && lastPageUrl.indexOf("register") != -1) {
                    xdm._experience.analytics.customDimensions.eVars.eVar42 = "register";

                    if (_satellite.cookie.get("mywuoptin") == "yes") {
                        xdm._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin";
                        addEvent(40);
                    }

                    _satellite.cookie.set("NewUserCookie", true, { expires: 1 });
                    addEvent(4);

                    // 3rdparty data user consent
                    if (analyticsObject.sc_3rdPartyDataOptin != undefined) {
                        addEvent(299);
                        xdm._experience.analytics.customDimensions.eVars.eVar81 = analyticsObject.sc_3rdPartyDataOptin ? "consent-accepted" : "consent-denied";
                        analyticsObject.sc_3rdPartyDataOptin = undefined;
                        sessionStorage.removeItem("DTM-3rdPartyDataOptin");
                    }
                }
            }
        }

        // Account activation
        if (_satellite.getVar("WUAccountActiveJSObject")) {
            addEvent(32);
        }

        // Forgot password pages
        if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:start") != -1) {
            addEvent(82);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:emailsent") != -1) {
            addEvent(85);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:securityquestion") != -1) {
            addEvent(86);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:resetpassword") != -1) {
            addEvent(87);
        }

        // Name change pages
        if (pagenametmp != "" && pagenametmp.indexOf("name-change:verificationoptions:text-me") != -1) {
            addEvent(207);
            addEvent(208);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("name-change:enter-pin") != -1) {
            addEvent(209);
            addEvent(210);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("name-change:editreceiver-name") != -1) {
            var lastPgName = _satellite.getVar("WULinkIDJSObject");
            if (lastPgName != "" && lastPgName.indexOf("cancel-transfer:reason") != -1) {
                xdm._experience.analytics.customDimensions.eVars.eVar61 = "receiver-namechange";
                addEvent(213);
                addEvent(214);
                addEvent(211);
            } else {
                addEvent(213);
                addEvent(214);
            }
        }

        if (pagenametmp != "" && (pagenametmp.indexOf("name-change:review") != -1 || pagenametmp.indexOf("name-change:namechangereview") != -1)) {
            addEvent(215);
            addEvent(216);
        }

        if (pagenametmp != "" && (pagenametmp.indexOf("name-change:receipt") != -1 || pagenametmp.indexOf("name-change:namechangereceipt") != -1)) {
            if (txn_id != "") {
                addEvent(217);
            }
        }

        // Collect ID pages
        if (pagenametmp != "" && (pagenametmp.indexOf("collectid:details") != -1 || pagenametmp.indexOf("collect-id:details") != -1)) {
            addEvent(142);
            addEvent(143);

            if (
                typeof analyticsObject.sc_verify_status != "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() == "unverified" &&
                analyticsObject.sc_user_id != "" &&
                typeof analyticsObject.sc_user_id != "undefined"
            ) {
                addEvent(244);
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("collectid:failed") != -1) {
            addEvent(148);
        }

        // More profile page events
        if (pagenametmp != "" && pagenametmp.indexOf("fraudprotection") == -1) {
            if (pagenametmp != "" && pagenametmp.indexOf("profile:txn-history") != -1) {
                if (
                    typeof analyticsObject.sc_verify_status != "undefined" &&
                    analyticsObject.sc_verify_status.toLowerCase() == "inprogress" &&
                    analyticsObject.sc_user_id != "" &&
                    typeof analyticsObject.sc_user_id != "undefined"
                ) {
                    addEvent(245);
                }
            }

            if (pagenametmp != "" && pagenametmp.indexOf("send-money:start") != -1) {
                if (
                    typeof analyticsObject.sc_verify_status != "undefined" &&
                    analyticsObject.sc_verify_status.toLowerCase() == "verified" &&
                    analyticsObject.sc_user_id != "" &&
                    typeof analyticsObject.sc_user_id != "undefined"
                ) {
                    addEvent(248);
                }
            }
        }

        // More collect ID pages
        if (pagenametmp != "" && pagenametmp.indexOf("collectid:ekyc-failed") != -1) {
            if (
                typeof analyticsObject.sc_verify_status != "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() == "suspended" &&
                analyticsObject.sc_user_id != "" &&
                typeof analyticsObject.sc_user_id != "undefined"
            ) {
                addEvent(247);
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("collectid:identify") != -1) {
            if (
                typeof analyticsObject.sc_verify_status != "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() == "rejected" &&
                analyticsObject.sc_user_id != "" &&
                typeof analyticsObject.sc_user_id != "undefined"
            ) {
                addEvent(246);
            }
        }

        // Password forgot completion
        if (typeof analyticsObject.sc_fp_complete != "undefined" && analyticsObject.sc_fp_complete != "") {
            if (analyticsObject.sc_fp_complete == "true") {
                addEvent(88);
            }
        }

        // Verification events
        if (typeof analyticsObject.sc_letter_sent != "undefined" && analyticsObject.sc_letter_sent.toString().toLowerCase() == "true") {
            _satellite.cookie.set("EUID_VERIFY_LETTER_SENT", "true");
            addEvent(140);
            addEvent(141);
        }

        if (verification_blocked != "" && verification_blocked == "blocked") {
            addEvent(147);
        }

        if (verification_failed != "" && verification_failed == "true") {
            addEvent(148);
        }

        if (verification_success != "" && verification_success == "true") {
            if (_satellite.cookie.get("EUID_VERIFY_LETTER_SENT") != "undefined" && _satellite.cookie.get("EUID_VERIFY_LETTER_SENT") == "true") {
                _satellite.cookie.remove("EUID_VERIFY_LETTER_SENT");
                addEvent(149);
            }
        }

        if (id_verification_success != "" && id_verification_success == "true") {
            addEvent(146);
        }

        // Another security question page
        if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:securityquestion") != -1) {
            addEvent(86);
        }

        // Fraud protection
        if (pagenametmp != "" && pagenametmp.indexOf("fraudprotection") != -1) {
            addEvent(114);
            addEvent(115);
        }

        // Progressive registration
        if (pagenametmp != "" && pagenametmp.indexOf("progressive-register") != -1) {
            addEvent(237);
        }

        if (pagenametmp != "" && pagenametmp.indexOf("progressive-register:contact") != -1) {
            addEvent(238);
        }

        // Error event
        if (typeof analyticsObject.sc_error != "undefined" && analyticsObject.sc_error != "") {
            addEvent(31);
        }
    }

    // Handle reset password cookie
    if (_satellite.cookie.get("RESET_PASSWORD_COOKIE") == "true") {
        addEvent(88);
    }

    // Page load time tracking - Add event294 with page load time value
    var pageLoadTime = _satellite.getVar('WUPageLoadTimeJSObject');
    if (pageLoadTime !== undefined && pageLoadTime !== null) {
        addEvent(294, pageLoadTime);
    }

    // NCA Event
    if (!sessionStorage.getItem("registrationDate1")) {
        if (
            pagenametmp.indexOf("profile:txn-history") != -1 ||
            pagenametmp.indexOf("send-money:start") != -1 ||
            pagenametmp.indexOf("send-money:receiverinformation") != -1 ||
            pagenametmp.indexOf("send-money:review") != -1 ||
            pagenametmp.indexOf("register:verifycode") != -1
        ) {
            var custDetails1 = JSON.parse(sessionStorage.getItem("GatewayCustomer"));
            if (custDetails1 && custDetails1.registrationDate) {
                sessionStorage.setItem("registrationDate1", custDetails1.registrationDate);
            }
        }
    }

    if (
        (pagenametmp.indexOf("send-money:receipt") != -1 ||
            pagenametmp.indexOf("send-money:sendmoneywupayreceipt") != -1 ||
            pagenametmp.indexOf("send-money:sendmoneycashreceipt") != -1 ||
            pagenametmp.indexOf("bill-pay:receipt") != -1) &&
        typeof countryConfig != "undefined"
    ) {
        if (_satellite.getVar("nca2.0")) {
            addEvent(282);
        }
    }

    // Page not found
    if (window.document.title.match("404")) {
        addEvent(404);
    }

    // Set register success cookie
    if (_satellite.getVar("WURegisterSuccessJSObject")) {
        _satellite.cookie.set("register_success_event", "true");
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

    deleteCookieRegLogin();

    // Peru Currency exchange events
    if (analyticsObject.sc_page_name && analyticsObject.sc_page_name == "pe:es:website-ce:perform-operation:start-subscription") {
        addEvent(356);
    }

    if (analyticsObject.sc_loginsuccess == "true") {
        addEvent(2);
    }

    if (analyticsObject.sc_accountactivation && analyticsObject.sc_accountactivation == "true") {
        addEvent(32);
    }

    if (analyticsObject.sc_fpstep1 && analyticsObject.sc_fpstep1 == "true") {
        addEvent(82);
    }

    if (analyticsObject.sc_fpstep4 && analyticsObject.sc_fpstep4 == "true") {
        addEvent(87);
    }

    // Return the XDM object to be merged with the existing one
    return xdm;
}

_satellite.setVar("Common_Page_Name_Based_Event_Firing_Rule", false);
var eventsXDM = buildWUPageViewXDM();

// Ensure page view data
var finalXDM = ensurePageView(eventsXDM);

// Store for reference
_satellite.setVar('XDM westernunion Merged Object', finalXDM);

// 3. DIRECT SEND - Skip the Launch UI Send Event
alloy("sendEvent", {
    "xdm": finalXDM
});
