/**
 * Western Union WebSDK Event Conversion for the Generic Direct Call Rule
 * Uses page context to determine which events to send
 * Works with the WUAnalytics utility
 * This code converts the event tracking from AppMeasurement format to WebSDK XDM format
 * It maintains all the same conditional logic but outputs an XDM object instead of setting s.events
 */

(function () {
    function attemptLinkTracking(attempts) {
        attempts = attempts || 0;

        // Force execution of page name data element first
        var pagenametmp = _satellite.getVar("WUPageNameJSObject");

        // Check if utility is available
        if (typeof WUAnalytics === "undefined") {
            if (attempts < 5) {
                setTimeout(function () {
                    attemptLinkTracking(attempts + 1);
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
            handleLinkClick();
            _satellite.logger.info("Direct call rule executed successfully");
        } catch (e) {
            _satellite.logger.error("Error executing direct call rule:", e);
        }
    }

    attemptLinkTracking();
})();

function buildWUEventsXDM() {
    // Check if WUAnalytics utility is available
    if (typeof WUAnalytics === "undefined") {
        _satellite.logger.error("WUAnalytics utility not available. Make sure utility/setup rule has fired first.");
        return null;
    }

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
    var txn_fee = WUAnalytics.getDataElement("WUTransactionFeeJSObject", "");
    var refundAmnt = WUAnalytics.getDataElement("WURefundAmntJSObject", "");

    // Get link name from data elements
    let linkName = WUAnalytics.getDataElement("WUDataLinkJSObject", "") ||
        WUAnalytics.getDataElement("WULinkIDJSObject", "") ||
        WUAnalytics.getAnalyticsObjectValue("sc_link_name", "");

    // Get product info from base XDM
    var prod = xdm._wu?.product || "";

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
            WUAnalytics.addPurchaseEvent(xdm, txn_id);
        }
    }
    /* SM - Receipt (Approval) */
    else if (pagenametmp !== "" && pagenametmp.indexOf("send-money:confirmationscreen") !== -1) {
        if (typeof prod !== "undefined" && prod !== "" && txn_status === "approved") {
            txn_id = WUAnalytics.getAnalyticsObjectValue("sc_transaction_id", "");
            xdm._experience.analytics.customDimensions.eVars.purchaseID = txn_id;

            // Add purchase event
            WUAnalytics.setProduct(xdm, prod, txn_fee);
            WUAnalytics.addPurchaseEvent(xdm, txn_id);
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
            } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                xdm._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
            }
        }

        // SM - Payment
        if (pagenametmp != "" && pagenametmp.indexOf("send-money:paymentinformation") != -1) {
            WUAnalytics.addEvent(xdm, 8);
            WUAnalytics.addEvent(xdm, 13);

            if (analyticsObject.sc_quicksend_id) {
                campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
            } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                xdm._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
            }
        }

        // SM - Review
        if (pagenametmp != "" && pagenametmp.indexOf("send-money:review") != -1) {
            WUAnalytics.addEvent(xdm, 9);
            WUAnalytics.addEvent(xdm, 14);

            if (analyticsObject.sc_quicksend_id) {
                campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
            } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                xdm._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
            }
        }
    }

    // SM - Confirm Identity
    if (pagenametmp != "" && pagenametmp.indexOf("send-money:confirmidentity") != -1) {
        if (analyticsObject.sc_quicksend_id) {
            campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
            xdm._experience.analytics.customDimensions.eVars.eVar47 = campId;
        } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
            xdm._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
        }
    }

    // SM - Receiver Information (More Info)
    if (pagenametmp != "" && pagenametmp.indexOf("send-money:receiverinformation:more-info") != -1) {
        if (analyticsObject.sc_quicksend_id) {
            campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
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
        var lastPgName = _satellite.getVar("WULinkIDJSObject");
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
            analyticsObject.sc_user_id == "" &&
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

        xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");

        if (_satellite.getVar("WULinkDisplayJSObject") != "" && _satellite.getVar("WULinkDisplayJSObject") != "null") {
            xdm._experience.analytics.customDimensions.listProps.list1 = _satellite.getVar("WULinkDisplayJSObject");
            WUAnalytics.addEvent(xdm, 206);
        }

        if (_satellite.getVar("WUMsgIdJSObject") != "" && _satellite.getVar("WUMsgIdJSObject") != "null") {
            xdm._experience.analytics.customDimensions.props.prop13 = "msg:" + _satellite.getVar("WUMsgIdJSObject");
            xdm._experience.analytics.customDimensions.props.prop14 = _satellite.getVar("WUPageNameJSObject") + "|" + xdm._experience.analytics.customDimensions.props.prop13;
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
        xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
        xdm._experience.analytics.customDimensions.listProps.list2 = analyticsObject.sc_ab_testing ? analyticsObject.sc_ab_testing.toLowerCase() : "";
        WUAnalytics.addEvent(xdm, 218);
        WUAnalytics.addEvent(xdm, 219);
    }

    if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-transfer-cont") != -1) {
        xdm._experience.analytics.customDimensions.eVars.eVar61 = "canceltxn-abandoned";
        xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
        WUAnalytics.addEvent(xdm, 183);
    }

    if (pagenametmp != "" &&
        (pagenametmp.indexOf("cancel-transfer:review-full-refund") != -1 ||
            pagenametmp.indexOf("cancel-transfer:review-pr-refund") != -1)) {

        xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");

        if (_satellite.getVar("WULinkDisplayJSObject") != "" && _satellite.getVar("WULinkDisplayJSObject") != "null") {
            xdm._experience.analytics.customDimensions.listProps.list1 = _satellite.getVar("WULinkDisplayJSObject");
            WUAnalytics.addEvent(xdm, 206);
        }

        WUAnalytics.addEvent(xdm, 185);
        WUAnalytics.addEvent(xdm, 186);
    }

    if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-full-refund") != -1) {
        xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar21 = "refunded";

        if (mtcn != "") {
            WUAnalytics.addEvent(xdm, 189);
            WUAnalytics.addEvent(xdm, 198, refundAmnt);
            WUAnalytics.addEvent(xdm, 199, txn_fee);
        }
        WUAnalytics.setProduct(xdm, prod, -txn_fee, { event34: txn_fee });

    }

    if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-pr-refund") != -1) {
        xdm._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
        xdm._experience.analytics.customDimensions.eVars.eVar21 = "refunded";

        if (mtcn != "") {
            WUAnalytics.addEvent(xdm, 189);
            WUAnalytics.addEvent(xdm, 198, refundAmnt);
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

            WUAnalytics.addEvent(xdm, 133, _satellite.getVar("WUPrincipalJSObject") ?? 0);
            WUAnalytics.setProduct(xdm, prod, _satellite.getVar("WUPrincipalJSObject") ?? 0, { event34: txn_fee });
            WUAnalytics.addPurchaseEvent(xdm, txn_id);
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

            WUAnalytics.addEvent(xdm, 133, _satellite.getVar("WUPrincipalJSObject") ?? 0);
            WUAnalytics.setProduct(xdm, prod, txn_fee, { event34: txn_fee });
            WUAnalytics.addPurchaseEvent(xdm, txn_id);

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
    linkName = "link-profile-icon";
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
        if (_satellite.getVar("WULinkDisplayJSObject") != "" && _satellite.getVar("WULinkDisplayJSObject") != "null") {
            xdm._experience.analytics.customDimensions.listProps.list1 = _satellite.getVar("WULinkDisplayJSObject");
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

        if (_satellite.getVar("nca2.0")) {
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
    if (_satellite.getVar("WULoginSuccessJSObject")) {
        xdm._experience.analytics.customDimensions.eVars.eVar42 = "login";
        _satellite.cookie.remove("NewUserCookie");
        if (!(country == "us" && pagenametmp != "" && pagenametmp.indexOf("contactus") != -1)) {
            WUAnalytics.addEvent(xdm, 2);
        }
    }

    // Registration success handlers
    if (country && "nz" != country) {
        if (_satellite.getVar("WURegisterSuccessJSObject")) {
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
    xdm = WUAnalytics.handleEmptyXDM(xdm);

    return xdm;
}

/**
 * Main function called by direct call rule
 * This function is reactionary to the current page state
 */
function handleLinkClick() {
    let linkName = WUAnalytics.getDataElement("WULinkIDJSObject", "");

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
    } else {
        // Reset flag using utility
        WUAnalytics.setPageViewFlag(false);
    }

    try {
        // Get link name from context if available
        linkName = WUAnalytics.getDataElement("WULinkIDJSObject", "");
        if (!linkName) {
            linkName = WUAnalytics.getAnalyticsObjectValue("sc_link_name", "");
        }

        _satellite.logger.info("Processing link click for: " + linkName);

        // Get events from buildWUEventsXDM
        var eventsXDM = buildWUEventsXDM();

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
}

// Self-execution if called directly by the rule
(function () {
    try {
        handleLinkClick();
        _satellite.logger.info("Direct call rule executed successfully");
    } catch (e) {
        _satellite.logger.error("Error executing direct call rule:", e);
    }
})();