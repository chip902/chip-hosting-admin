/**
 * Western Union WebSDK Event Conversion for the Generic Direct Call Rule on SM Flow
 * 
 * This code converts the event tracking from AppMeasurement format to WebSDK XDM format
 * It maintains all the same conditional logic but outputs an XDM object instead of setting s.events
 */

function ensureLinkClick(xdm) {
    // Start with the XDM object passed in or get current one
    var linkXDM = xdm || _satellite.getVar('XDM westernunion Merged Object') || {};

    // Use spreading to preserve existing properties
    linkXDM.web = {
        ...(linkXDM.web || {}),
        webInteraction: {
            ...(linkXDM.web?.webInteraction || {}),
            linkClicks: { value: 1 }
        }
    };

    // Set the correct event type
    linkXDM.eventType = "web.webInteraction.linkClicks";

    return linkXDM;
}

function buildWUEventsXDM() {
    // Initialize variables similar to the original code
    var pagenametmp = _satellite.getVar("WUPageNameJSObject");
    var pagenameEvnt = _satellite.getVar("WUPagenameForEventObject");
    var country = _satellite.getVar("WUCountryJSObject");
    var doddFrank = _satellite.getVar("WUDFJSObject");

    /* --------------- Generate product value start --------------- */
    try {
        var prod = "";
        var txn_type = "";
        var platform = "";
        var pay_method = "";
        var del_method = "";
        var loginStatus = "";
        var sendzip = "";
        var principal = "";
        var txn_id = "";
        var txn_status = _satellite.getVar("WUTxnStatusJSObject");
        var pageType = _satellite.getVar("WUPageTypeJSObject");
        var txn_fee = _satellite.getVar("WUTransactionFeeJSObject");
        var refundAmnt = _satellite.getVar("WURefundAmntJSObject");
        var mtcn = _satellite.getVar("WUMtcnJSObject");
        var accountid = _satellite.getVar("WUAccountJSObject");
        var pageNameEvnt = _satellite.getVar("WUPagenameForEventObject");
    } catch (e) {
        _satellite.logger.warn("Error in AEP Generic Direct Call Rule. Unable to set variable: ", e);
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

    // Initialize the XDM object for Adobe WebSDK
    let xdm = {
        _experience: {
            analytics: {
                customDimensions: {
                    eVars: {}
                },
                event1to100: {},
                event101to200: {},
                event201to300: {},
                event301to400: {}
            }
        }
    };

    // Helper function to add events to XDM
    function addEvent(eventNum, value) {
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
    }

    // Add purchase event function
    function addPurchaseEvent() {
        xdm._experience.analytics.events = xdm._experience.analytics.events || [];
        xdm._experience.analytics.events.push({ name: 'purchase' });
    }

    // Set up product string similar to original code
    if (_satellite.getVar("WUDeliveryMethodJSObject") != "") {
        var mw_delivery = _satellite.getVar("WUDeliveryMethodJSObject");
        if (_satellite.getVar("WUWalletServiceProvider") != "none") {
            mw_delivery = mw_delivery + "-" + _satellite.getVar("WUWalletServiceProvider");
        }
        xdm._experience.analytics.customDimensions.eVars.eVar13 = mw_delivery;
    }

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
                // Store MTCN in a serialization variable if needed
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
                // Store MTCN in a serialization variable if needed
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
            // Add purchase event
            addPurchaseEvent();

            // Add event133 with principal value
            addEvent(133, _satellite.getVar("WUPrincipalJSObject") ?? 0);

            // Add event71 with discount amount
            addEvent(71, _satellite.getVar("WUDiscountAmountJSObject") ?? 0);

            // Store transaction ID in XDM
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

            // Store products in XDM - note that for WebSDK, product strings are handled differently
            xdm.productListItems = [
                {
                    name: prod,
                    priceTotal: txn_fee
                }
            ];
        }
    }
    /* SM - Receipt (Approval) */
    else if (pagenametmp != "" && pagenametmp.indexOf("send-money:confirmationscreen") != -1) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

            // Add purchase event
            addPurchaseEvent();

            xdm.productListItems = [
                {
                    name: prod,
                    priceTotal: txn_fee
                }
            ];
        }
    }
    else if (pagenametmp != "" && (pagenametmp.indexOf("send-money:declineoptions") != -1 || pagenametmp.indexOf("send-money:bank-decline-lightbox") != -1)) {
        if (typeof prod != "undefined" && prod != "") {
            // Add event56
            addEvent(56);

            // Add event34
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

    /* SM - Kyc choose Options */
    else if (pagenametmp != "" && pagenametmp.indexOf("send-money:kycconfirmidentity") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            // Add event56
            addEvent(56);

            // Add event34
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
            // Add event56
            addEvent(56);
        }
    }

    /* SM - Receipt on hold */
    else if (pagenametmp != "" && pagenametmp.indexOf("send-money:receipt:on-hold") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            // Add event56
            addEvent(56);

            // Add event34
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
            // Add event56
            addEvent(56);
        }
    }

    // Send Money flow
    if (pagenametmp != "" && pagenametmp.indexOf("fraudprotection") == -1) {
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

    // SM - Receiver Information (More Info)
    if (pagenametmp != "" && pagenametmp.indexOf("send-money:receiverinformation:more-info") != -1) {
        if (analyticsObject.sc_quicksend_id) {
            var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
            xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
        } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
            xdm._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
        }
    }

    // SM - WU Pay Receipt
    if (pagenametmp != "" &&
        (pagenametmp.indexOf("send-money:sendmoneywupayreceipt") != -1 ||
            pagenametmp.indexOf("send-money:wire-complete") != -1 ||
            pagenametmp.indexOf("send-money:sendmoneypartnerfundsreceipt") != -1)) {
        if (mtcn != "") {
            addEvent(64); // with mtcn
            addEvent(34); // with txn_id

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

    // Forgot Password flows
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

    // Name Change flows
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

    // Collect ID flows
    if (pagenametmp != "" && (pagenametmp.indexOf("collectid:details") != -1 || pagenametmp.indexOf("collect-id:details") != -1)) {
        addEvent(142);
        addEvent(143);

        if (typeof analyticsObject.sc_verify_status != "undefined" &&
            analyticsObject.sc_verify_status.toLowerCase() == "unverified" &&
            analyticsObject.sc_user_id == "" &&
            typeof analyticsObject.sc_user_id != "undefined") {
            addEvent(244);
        }
    }

    if (pagenametmp != "" && pagenametmp.indexOf("collectid:failed") != -1) {
        addEvent(148);
    }

    if (pagenametmp != "" && pagenametmp.indexOf("fraudprotection") == -1) {
        // Profile page transaction history
        if (pagenametmp != "" && pagenametmp.indexOf("profile:txn-history") != -1) {
            if (typeof analyticsObject.sc_verify_status != "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() == "inprogress" &&
                analyticsObject.sc_user_id != "" &&
                typeof analyticsObject.sc_user_id != "undefined") {
                addEvent(245);
            }
        }

        // Send money start verification status
        if (pagenametmp != "" && pagenametmp.indexOf("send-money:start") != -1) {
            if (typeof analyticsObject.sc_verify_status != "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() == "verified" &&
                analyticsObject.sc_user_id != "" &&
                typeof analyticsObject.sc_user_id != "undefined") {
                addEvent(248);
            }
        }
    }

    // EKYC flows
    if (pagenametmp != "" && pagenametmp.indexOf("collectid:ekyc-failed") != -1) {
        if (typeof analyticsObject.sc_verify_status != "undefined" &&
            analyticsObject.sc_verify_status.toLowerCase() == "suspended" &&
            analyticsObject.sc_user_id != "" &&
            typeof analyticsObject.sc_user_id != "undefined") {
            addEvent(247);
        }
    }

    if (pagenametmp != "" && pagenametmp.indexOf("collectid:identify") != -1) {
        if (typeof analyticsObject.sc_verify_status != "undefined" &&
            analyticsObject.sc_verify_status.toLowerCase() == "rejected" &&
            analyticsObject.sc_user_id != "" &&
            typeof analyticsObject.sc_user_id != "undefined") {
            addEvent(246);
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

        xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");

        if (_satellite.getVar("WULinkDisplayJSObject") != "" && _satellite.getVar("WULinkDisplayJSObject") != "null") {
            xdm._experience.analytics.customDimensions.listProps.list1 = _satellite.getVar("WULinkDisplayJSObject");
            addEvent(206);
        }

        if (_satellite.getVar("WUMsgIdJSObject") != "" && _satellite.getVar("WUMsgIdJSObject") != "null") {
            xdm._experience.analytics.customDimensions.props.prop13 = "msg:" + _satellite.getVar("WUMsgIdJSObject");
            xdm._experience.analytics.customDimensions.props.prop14 = _satellite.getVar("WUPageNameJSObject") + "|" + xdm._experience.analytics.customDimensions.props.prop13;
        }

        addEvent(29);
    }

    if (pagenametmp != "" && pagenametmp.indexOf("track-transfer:billpayment-tab:status") != -1) {
        addEvent(29);
    }

    // Re-send sprint20
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

    // Send money receipt staged
    if (pagenametmp != "" && pagenametmp.indexOf("send-money:receipt-staged") != -1) {
        if (typeof analyticsObject.sc_transaction_id != "undefined" &&
            analyticsObject.sc_transaction_id != "" &&
            analyticsObject.sc_transaction_id != null) {
            var tid = analyticsObject.sc_transaction_id.toLowerCase();
            var tempmtcn = tid.slice(6).trim();
        }

        xdm._experience.analytics.customDimensions.eVars.eVar20 = tempmtcn;
        xdm._experience.analytics.customDimensions.eVars.eVar21 = "staged";
        addEvent(118); // with tempmtcn
        addEvent(120, txn_fee); // with tempmtcn
    }

    // HSFP
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

    // Collect ID YBL confirm
    if (pagenametmp != "" && pagenametmp.indexOf("collect-id:confirmybl") != -1) {
        addEvent(236);
    }

    // KYC flows
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

    // DUT KYC Changes
    if (pagenametmp != "" && pagenametmp.indexOf("kyc:info") != -1) {
        addEvent(277);
        addEvent(285);
    }

    if (pagenametmp != "" && pagenametmp.indexOf("kyc:upload") != -1) {
        addEvent(278);
        addEvent(286);
    }

    if (pagenametmp != "" && pagenametmp.indexOf("kyc:success") != -1) {
        addEvent(279);
        addEvent(287);
    }

    // Cancel transfer flows
    if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:reason") != -1) {
        xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
        xdm._experience.analytics.customDimensions.listProps.list2 = analyticsObject.sc_ab_testing ? analyticsObject.sc_ab_testing.toLowerCase() : "";
        addEvent(218);
        addEvent(219);
    }

    if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-transfer-cont") != -1) {
        xdm._experience.analytics.customDimensions.eVars.eVar61 = "canceltxn-abandoned";
        xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
        addEvent(183);
    }

    if (pagenametmp != "" &&
        (pagenametmp.indexOf("cancel-transfer:review-full-refund") != -1 ||
            pagenametmp.indexOf("cancel-transfer:review-pr-refund") != -1)) {

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

    // Case request and declined transfers
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

    // Inmate receipt
    if (pagenametmp != "" && (pagenametmp.indexOf("send-inmate:inmatereceipt") != -1 ||
        pagenametmp.indexOf("send-inmate:receipt") != -1)) {
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
            // on-hold, under review, null
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

    // Bill pay receipt
    if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:receipt") != -1) {
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
            // on-hold, under review, null
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

    // Fraud protection
    if (pagenametmp != "" && pagenametmp.indexOf("fraudprotection") != -1) {
        addEvent(114);
        addEvent(115);
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

    // Pickup cash flows
    if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:start") != -1) {
        addEvent(160);
        addEvent(161);
    }

    if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:senderinfo") != -1) {
        if (sessionStorage.getItem("sc_links")) {
            var sclink = sessionStorage.getItem("sc_links");
            if (sclink.indexOf("website:tracktransfer:details") != -1) {
                // below events are added in case user reaches sender info page from track transfer flow
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

    // Profile Page Events
    var linkName = "link-profile-icon";
    switch (pagenameEvnt) {
        case "profile:personal-info":
            if (analyticsObject.sc_link_name && analyticsObject.sc_link_name != "" &&
                analyticsObject.sc_link_name.toLowerCase() == "button-save-password") {
                xdm._experience.analytics.customDimensions.eVars.eVar61 = analyticsObject.sc_link_name;
                addEvent(184);
            } else {
                xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
                if (linkName != "") {
                    switch (linkName) {
                        case "button-save-address":
                        case "button-save-securityques":
                        case "confirm-pin":
                            addEvent(184);
                            break;
                    }
                }
            }
            break;

        case "profile:edit-address":
            if ("icon-edit-address" == linkName) {
                addEvent(183);
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
            break;

        case "profile:edit-password":
            if ("icon-edit-password" == linkName) {
                addEvent(183);
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
            break;

        case "profile:edit-securityques":
            if ("icon-edit-securityques" == linkName) {
                addEvent(183);
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
            break;

        case "profile:edit-email":
            if ("icon-edit-email" == linkName) {
                addEvent(183);
            }
            xdm._experience.analytics.customDimensions.eVars.eVar61 = linkName;
            break;
    }

    // Use Case Promo
    if (pagenametmp != "" && pagenametmp.indexOf("send-money:start:enterpromo") != -1) {
        if (_satellite.getVar("WULinkDisplayJSObject") != "" && _satellite.getVar("WULinkDisplayJSObject") != "null") {
            xdm._experience.analytics.customDimensions.listProps.list1 = _satellite.getVar("WULinkDisplayJSObject");
            addEvent(206);
        }
    }

    // Delete the mtchannel cookie for digital cancel transfer flow
    if (pagenametmp != "" && (pagenametmp.indexOf("profile:txn-history") != -1 || pagenametmp.indexOf("track-transfer") != -1)) {
        _satellite.cookie.remove("cancelTransferMTChannel");
    }

    // Third-party data consent popup
    if (pagenametmp.indexOf("thirdpartydataconsent") != -1) {
        addEvent(300);
    }

    // Page Not Found
    if (window.document.title.match("404")) {
        addEvent(404);
    }

    // Special handling for Peru currency exchange app
    if (pagenametmp != "" && pagenametmp.indexOf("pe:es:website-ce:perform-operation:confirm-subscription") != -1) {
        addEvent(357);
    }

    if (pagenametmp != "" && pagenametmp.indexOf("pe:es:website-ce:perform-operation:success-subscription") != -1) {
        addEvent(358);
    }

    // Forgot password specific flows
    if (analyticsObject.sc_fpstep3 && analyticsObject.sc_fpstep3 == "true") {
        addEvent(86);
    }

    if (analyticsObject.sc_fpsuccess && analyticsObject.sc_fpsuccess == "true") {
        addEvent(88);
    }

    // Registration success via analyticsObject
    if (analyticsObject.sc_registersuccess && analyticsObject.sc_registersuccess == "true") {
        addEvent(4);
    }

    // Handle case when sending to NCA 2.0
    if ((pagenametmp.indexOf("send-money:receipt") != -1 ||
        pagenametmp.indexOf("send-money:sendmoneywupayreceipt") != -1 ||
        pagenametmp.indexOf("send-money:sendmoneycashreceipt") != -1 ||
        pagenametmp.indexOf("bill-pay:receipt") != -1) &&
        typeof countryConfig != "undefined") {

        // Setting Backup for Session Storage Object
        _satellite.cookie.set('lastTransactionDatestamp', new Date().getTime(), { expires: 365 });

        if (_satellite.getVar("nca2.0")) {
            addEvent(282);
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
    if (_satellite.getVar("WULoginSuccessJSObject")) {
        xdm._experience.analytics.customDimensions.eVars.eVar42 = "login";
        _satellite.cookie.remove("NewUserCookie");
        if (!(country == "us" && pagenametmp != "" && pagenametmp.indexOf("contactus") != -1)) {
            addEvent(2);
        }
    }

    // Registration success handlers
    if (country && "nz" != country) {
        if (_satellite.getVar("WURegisterSuccessJSObject")) {
            xdm._experience.analytics.customDimensions.eVars.eVar42 = "register";
            if (_satellite.cookie.get("mywuoptin") == "yes") {
                xdm._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin";
                addEvent(40);
            }

            // Set NewUserCookie for registration
            _satellite.cookie.set("NewUserCookie", true, { expires: 1 });

            addEvent(4);

            // 3rdparty data user consent
            if (analyticsObject.sc_3rdPartyDataOptin != undefined) {
                addEvent(299);
                xdm._experience.analytics.customDimensions.eVars.eVar81 = analyticsObject.sc_3rdPartyDataOptin ? "consent-accepted" : "consent-denied";
                analyticsObject.sc_3rdPartyDataOptin = undefined;
            }
        }
    }

    // Process error events
    if (typeof analyticsObject.sc_error != "undefined" && analyticsObject.sc_error != "") {
        addEvent(31);
    }

    // Call our cookie cleanup function
    deleteCookieRegLogin();

    // Return the XDM object to be merged with the existing one
    return xdm;
}

function handleLinkClick(linkName, linkContext) {
    // Reset the flag to ensure buildWUEventsXDM runs
    _satellite.setVar("Common_Events_Based_Event_Firing_Rule", false);

    // Get events from your original function
    var eventsXDM = buildWUEventsXDM();

    // If it runs successfully, ensure link structure
    if (eventsXDM) {
        // Add any link-specific properties
        if (linkName) {
            eventsXDM._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        // Ensure link click structure
        var finalXDM = ensureLinkClick(eventsXDM);

        // Log for debugging
        _satellite.logger.warn("LINK EVENT XDM:", JSON.stringify(finalXDM));

        // Direct send to WebSDK
        alloy("sendEvent", {
            "xdm": finalXDM
        });

        return true;
    }

    return false;
}