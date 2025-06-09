console.log("-------------Arjun page load fired-------------");
//common page load rule
content._experience ??= {};
content._experience.analytics ??= {};
content._experience.analytics.customDimensions ??= {};
content._experience.analytics.customDimensions.eVars ??= {};
content._experience.analytics.customDimensions.props ??= {};

content._experience.analytics.event1to100 ??= {};
content._experience.analytics.event101to200 ??= {};
content._experience.analytics.event201to300 ??= {};
content._experience.analytics.event301to400 ??= {};
content._experience.analytics.event401to500 ??= {};


//-- this is hack to over come event245 batch failure errors.------
content._experience.analytics.event201to300.event245 = content._experience.analytics.event201to300.event245 || {};
content._experience.analytics.event201to300.event245.value = 0;
//----end of Hack code----------------------

    var pagenametmp = _satellite.getVar('WUPageNameJSObject');
    var country = _satellite.getVar("WUCountryJSObject");
    var eventStr = "";
    /* --------------- Generate product value start --------------- */
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
    var linkName = _satellite.getVar("WULinkIDJSObject");
    var pageNameEvnt = _satellite.getVar("WUPagenameForEventObject");
    var pageType = _satellite.getVar("WUPageTypeJSObject");
    var mtcn = _satellite.getVar("WUMtcnJSObject");
    var txn_fee = _satellite.getVar("WUTransactionFeeJSObject");
    var refundAmnt = _satellite.getVar("WURefundAmntJSObject");
    var accountid = _satellite.getVar("WUAccountJSObject");

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

    if (_satellite.getVar("WUDeliveryMethodJSObject") != "") {
        var mw_delivery = _satellite.getVar("WUDeliveryMethodJSObject");
        if (_satellite.getVar("WUWalletServiceProvider") != "none") {
            mw_delivery = mw_delivery + "-" + _satellite.getVar("WUWalletServiceProvider");
        }
        content._experience.analytics.customDimensions.eVars.eVar13 = mw_delivery;
    }

    _satellite.logger.log("payment method= " + pay_method + " ,txn_type= " + txn_type + " ,platform= " + platform + ", del_method= " + del_method, 1); //Changed for Notify

    if (pay_method != "" && txn_type != "" && platform != "") {
        if (del_method != "") {
            prod = platform + "|" + txn_type + "|" + pay_method + "|" + del_method;
        } else {
            prod = platform + "|" + txn_type + "|" + pay_method;
        }
    }
    /* --------------- Generate product value end --------------- */

    /* --------------- Fill product & create event string start-------------------- */

    switch (pageNameEvnt) {
        //UDM Start
        case "update-delivery-method:start":
            content._experience.analytics.event201to300.event252 = content._experience.analytics.event201to300.event252 || {};
            content._experience.analytics.event201to300.event252.value = 1;
            content._experience.analytics.event201to300.event253 = content._experience.analytics.event201to300.event253 || {};
            content._experience.analytics.event201to300.event253.value = 1;
            break;

        case "update-delivery-method:review":
            content._experience.analytics.event201to300.event254 = content._experience.analytics.event201to300.event254 || {};
            content._experience.analytics.event201to300.event254.value = 1;
            content._experience.analytics.event201to300.event255 = content._experience.analytics.event201to300.event255 || {};
            content._experience.analytics.event201to300.event255.value = 1;
            break;

        case "update-delivery-method:receipt":
            if (mtcn != "") {
                content._experience.analytics.event201to300.event256 = content._experience.analytics.event201to300.event256 || {};
                content._experience.analytics.event201to300.event256.value = 1;
                content._experience.analytics.event201to300.event256.id = mtcn;
            }
            break;

        case "update-delivery-method:decline":
        case "update-delivery-method:receiver-assisted:decline":
            //if (eventStr != "") eventStr = eventStr + ",event257,event258";
            //else eventStr = "event257,event258";
            content._experience.analytics.event201to300.event257 = content._experience.analytics.event201to300.event257 || {};
            content._experience.analytics.event201to300.event257.value = 1;
            content._experience.analytics.event201to300.event258 = content._experience.analytics.event201to300.event258 || {};
            content._experience.analytics.event201to300.event258.value = 1;
            break;

        case "update-delivery-method:redirect-start":
            //if (eventStr != "") eventStr = eventStr + ",event259,event260";
            //else eventStr = "event259,event260";
            content._experience.analytics.event201to300.event259 = content._experience.analytics.event201to300.event259 || {};
            content._experience.analytics.event201to300.event256.value = 1;
            content._experience.analytics.event201to300.event260 = content._experience.analytics.event201to300.event260 || {};
            content._experience.analytics.event201to300.event260.value = 1;
            break;

        case "update-delivery-method:receiver-assisted:start":
            //if (eventStr != "") eventStr = eventStr + ",event261,event262";
            //else eventStr = "event261,event262";
            content._experience.analytics.event201to300.event261 = content._experience.analytics.event201to300.event261 || {};
            content._experience.analytics.event201to300.event261.value = 1;
            content._experience.analytics.event201to300.event262 = content._experience.analytics.event201to300.event262 || {};
            content._experience.analytics.event201to300.event262.value = 1;
            break;

        case "update-delivery-method:receiver-assisted:shareinfo":
            //if (eventStr != "") eventStr = eventStr + ",event263,event264";
            //else eventStr = "event263,event264";
            content._experience.analytics.event201to300.event263 = content._experience.analytics.event201to300.event263 || {};
            content._experience.analytics.event201to300.event263.value = 1;
            content._experience.analytics.event201to300.event264 = content._experience.analytics.event201to300.event264 || {};
            content._experience.analytics.event201to300.event264.value = 1;
            break;

        case "update-delivery-method:receiver-assisted:review":
            //if (eventStr != "") eventStr = eventStr + ",event265,event266";
            //else eventStr = "event265,event266";
            content._experience.analytics.event201to300.event265 = content._experience.analytics.event201to300.event265 || {};
            content._experience.analytics.event201to300.event265.value = 1;
            content._experience.analytics.event201to300.event266 = content._experience.analytics.event201to300.event266 || {};
            content._experience.analytics.event201to300.event266.value = 1;
            break;

        case "update-delivery-method:receiver-assisted:receipt":
            if (mtcn != "") {
                //if (eventStr != "") eventStr = eventStr + ",event267:" + mtcn;
                //else eventStr = "event267:" + mtcn;
                content._experience.analytics.event201to300.event267 = content._experience.analytics.event201to300.event267 || {};
                content._experience.analytics.event201to300.event267.value = 1;
                content._experience.analytics.event201to300.event267.id = mtcn;
            }
            break;
    }
    //UDM - End

    if (
        pagenametmp != "" &&
        pagenametmp.indexOf("send-money:receipt-staged") == -1 &&
        pagenametmp.indexOf("send-money:receipt:under-review") == -1 &&
        pagenametmp.indexOf("send-money:receipt:on-hold") == -1 &&
        pagenametmp.indexOf("send-money:receipt") != -1
    ) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            //kirti - event71 aaded for total discount
            //eventStr = "purchase,event133=" + (_satellite.getVar("WUPrincipalJSObject") ?? 0) +
            //	",event71=" + (_satellite.getVar("WUDiscountAmountJSObject") ?? 0);
            //events[0].content.commerce.purchases = events[0].content.commerce.purchases || {};
            //events[0].content.commerce.purchases.value = 1;
            //content._experience.analytics.event100to200.event133 = content._experience.analytics.event100to200.event133 || {};
            //content._experience.analytics.event100to200.event133.value = _satellite.getVar("WUPrincipalJSObject");
            //content._experience.analytics.event1to100.event71 = content._experience.analytics.event1to100.event71 || {};
            //content._experience.analytics.event1to100.event71.value = _satellite.getVar("WUDiscountAmountJSObject");
            if (txn_id) {
                //s.purchaseID = txn_id;
                //events[0].content.commerce.order.purchaseID = content.commerce.order.purchaseID || {};
                //events[0].content.commerce.order.purchaseID.value = txn_id;
            }
            //s.products = ";" + prod + ";;" + txn_fee + ";;";
        }
    } /* SM - Receipt (Approval) */ else if (pagenametmp != "" && pagenametmp.indexOf("send-money:confirmationscreen") != -1) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            if (txn_id) {
                //s.purchaseID = txn_id;
                content.commerce.order.purchaseID = content.commerce.order.purchaseID || {};
                content.commerce.order.purchaseID.value = txn_id;
            }
            //eventStr = "purchase";
            //s.products = ";" + prod + ";;" + txn_fee + ";;";
            content.commerce.purchases = content.commerce.purchases || {};
            content.commerce.purchases.value = 1;
        }
    } /* SM - Kyc Confirmation */ else if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:receipt") != -1) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            if (txn_id) {
                //s.purchaseID = txn_id;
                content.commerce.order.purchaseID = content.commerce.order.purchaseID || {};
                content.commerce.order.purchaseID.value = txn_id;
            }
            //eventStr = "purchase,event133=" + (_satellite.getVar("WUPrincipalJSObject") ?? 0);
            //s.products = ";" + prod + ";;" + txn_fee + ";;";
            content.commerce.purchases = content.commerce.purchases || {};
            content.commerce.purchases.value = 1;
            content._experience.analytics.event100to200.event133 = content._experience.analytics.event100to200.event133 || {};
            content._experience.analytics.event100to200.event133.value = 1;
            content._experience.analytics.event100to200.event133.id = _satellite.getVar("WUPrincipalJSObject");

        } else if (typeof prod != "undefined" && prod != "") {
            //on-hold, under review, null
            if (typeof prod != "undefined" && prod != "") {
                //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
                //s.products = ";" + prod + ";;;event34=" + txn_fee;
                content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
                content._experience.analytics.event1to100.event56.value = 1;
                content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
                content._experience.analytics.event1to100.event34.value = 1;
                content._experience.analytics.event100to200.event133 = content._experience.analytics.event100to200.event133 || {};
                content._experience.analytics.event100to200.event133.value = 1;
                content._experience.analytics.event100to200.event133.id = _satellite.getVar("WUPrincipalJSObject");
            } else {
                //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
                content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
                content._experience.analytics.event1to100.event56.value = 1;
            }
        }
    } /* PB - Receipt */ else if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:confirmationscreen") != -1) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            if (txn_id) {
                //s.purchaseID = txn_id;
                content.commerce.order.purchaseID = content.commerce.order.purchaseID || {};
                content.commerce.order.purchaseID.value = txn_id;
            }
            //eventStr = "purchase";
            //s.products = ";" + prod + ";;" + txn_fee + ";;";
            content.commerce.purchases = content.commerce.purchases || {};
            content.commerce.purchases.value = 1;
        } else if (typeof prod != "undefined" && prod != "") {
            //on-hold, under review, null
            if (typeof prod != "undefined" && prod != "") {
                //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
                //s.products = ";" + prod + ";;;event34=" + txn_fee;
                content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
                content._experience.analytics.event1to100.event56.value = 1;
                content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
                content._experience.analytics.event1to100.event34.value = 1;
            } else {
                //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
                content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
                content._experience.analytics.event1to100.event56.value = 1;
            }
        }
    } /* PB - Kyc Confirmation */ else if (
        pagenametmp != "" &&
        (pagenametmp.indexOf("send-inmate:inmatereceipt") != -1 || pagenametmp.indexOf("send-inmate:receipt") != -1)
    ) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            if (txn_id) {
                //s.purchaseID = txn_id;
                content.commerce.order.purchaseID = content.commerce.order.purchaseID || {};
                content.commerce.order.purchaseID.value = txn_id;
            }
            //eventStr = "purchase,event133=" + (_satellite.getVar("WUPrincipalJSObject") ?? 0);
            //s.products = ";" + prod + ";;" + txn_fee + ";;";
            content._experience.analytics.event100to200.event133 = content._experience.analytics.event100to200.event133 || {};
            content._experience.analytics.event100to200.event133.value = 1;
            content._experience.analytics.event100to200.event133.id = _satellite.getVar("WUPrincipalJSObject");

        } else if (typeof prod != "undefined" && prod != "") {
            //on-hold, under review, null
            if (typeof prod != "undefined" && prod != "") {
                //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
                //s.products = ";" + prod + ";;;event34=" + txn_fee;
                content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
                content._experience.analytics.event1to100.event56.value = 1;
                content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
                content._experience.analytics.event1to100.event34.value = 1;
            } else {
                //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
                content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
                content._experience.analytics.event1to100.event56.value = 1;
            }
        }

    } /* Inmate - Receipt */ else if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:confirmationscreen") != -1) {
        if (typeof prod != "undefined" && prod != "" && txn_status == "approved") {
            if (txn_id) {
                //s.purchaseID = txn_id;
                content.commerce.order.purchaseID = content.commerce.order.purchaseID || {};
                content.commerce.order.purchaseID.value = txn_id;
            }
            //eventStr = "purchase";
            //s.products = ";" + prod + ";;" + txn_fee + ";;";
        } else if (typeof prod != "undefined" && prod != "") {
            //on-hold, under review, null
            if (typeof prod != "undefined" && prod != "") {
                //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
                //s.products = ";" + prod + ";;;event34=" + txn_fee;
                content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
                content._experience.analytics.event1to100.event56.value = 1;
                content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
                content._experience.analytics.event1to100.event34.value = 1;
            } else {
                //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
                content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
                content._experience.analytics.event1to100.event56.value = 1;
            }
        }
    } /* Inmate - Kyc Confirmation */ else if (
        pagenametmp != "" &&
        (pagenametmp.indexOf("send-money:declineoptions") != -1 || pagenametmp.indexOf("send-money:bank-decline-lightbox") != -1)
    ) {
        if (typeof prod != "undefined" && prod != "") {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
            //s.products = ";" + prod + ";;;event34=" + txn_fee;
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
            content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
            content._experience.analytics.event1to100.event34.value = 1;
        } else {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
        }
    } /* SM - All Decline Scenarios Only */ else if (pagenametmp != "" && pagenametmp.indexOf("send-money:kycconfirmidentity") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
            //s.products = ";" + prod + ";;;event34=" + txn_fee;
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
            content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
            content._experience.analytics.event1to100.event34.value = 1;
        } else {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
        }
    } /* SM - Kyc choose Options */ else if (pagenametmp != "" && pagenametmp.indexOf("send-money:receipt:on-hold") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
            //s.products = ";" + prod + ";;;event34=" + txn_fee;
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
            content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
            content._experience.analytics.event1to100.event34.value = 1;
        } else {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
        }
    } /* SM - Receipt on hold */ else if (pagenametmp != "" && pagenametmp.indexOf("send-money:receipt:under-review") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
            //s.products = ";" + prod + ";;;event34=" + txn_fee;
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
            content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
            content._experience.analytics.event1to100.event34.value = 1;
        } else {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
        }
    } /* SM - Receipt under review */ else if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:kycconfirmidentity") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
            //s.products = ";" + prod + ";;;event34=" + txn_fee;
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
            content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
            content._experience.analytics.event1to100.event34.value = 1;
        } else {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
        }

    } /* Pay-bills - Kyc choose Options */ else if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:bank-decline-lightbox") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
            //s.products = ";" + prod + ";;;event34=" + txn_fee;
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
            content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
            content._experience.analytics.event1to100.event34.value = 1;
        } else {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
        }
    } /* Pay-bills - bank decline */ else if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:declineoptions") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
            //s.products = ";" + prod + ";;;event34=" + txn_fee;
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
            content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
            content._experience.analytics.event1to100.event34.value = 1;
        } else {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
        }
    } else if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:kycconfirmidentity") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
            //s.products = ";" + prod + ";;;event34=" + txn_fee;
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
            content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
            content._experience.analytics.event1to100.event34.value = 1;
        } else {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
        }
    } /* Inmate - Kyc options*/ else if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:bank-decline-lightbox") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
            //s.products = ";" + prod + ";;;event34=" + txn_fee;
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
            content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
            content._experience.analytics.event1to100.event34.value = 1;
        } else {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
        }
    } /* Inmate - bank decline light box*/ else if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:declineoptions") != -1) {
        if (typeof prod != "undefined" && prod != "") {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
            //s.products = ";" + prod + ";;;event34=" + txn_fee;
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
            content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
            content._experience.analytics.event1to100.event34.value = 1;
        } else {
            //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
            content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
            content._experience.analytics.event1to100.event56.value = 1;
        }
    } /* Inmate - wu-pay -and -cash decline light box*/

    // DUT KYC CHANGES ---
    else if (pagenametmp != "" && pagenametmp.indexOf("kyc:info") != -1) {
        /*if (eventStr == "") {
            eventStr = "event277,event285";
        } else {
            eventStr = eventStr + ",event277,event285";
        }*/
        content._experience.analytics.event201to300.event277 = content._experience.analytics.event201to300.event277 || {};
        content._experience.analytics.event201to300.event277.value = 1;
        content._experience.analytics.event201to300.event285 = content._experience.analytics.event201to300.event285 || {};
        content._experience.analytics.event201to300.event285.value = 1;
    } /* DUT KYC - Info Page - updated*/ else if (pagenametmp != "" && pagenametmp.indexOf("kyc:upload") != -1 && !pagenametmp.includes("kyc:upload-")) {
        /*if (eventStr == "") {
            eventStr = "event278,event286";
        } else {
            eventStr = eventStr + ",event278,event286";
        }*/
        content._experience.analytics.event201to300.event278 = content._experience.analytics.event201to300.event278 || {};
        content._experience.analytics.event201to300.event278.value = 1;
        content._experience.analytics.event201to300.event286 = content._experience.analytics.event201to300.event286 || {};
        content._experience.analytics.event201to300.event286.value = 1;

        //s.eVar75 = _satellite.cookie.get("uniRefNumCookie");
        content._experience.analytics.customDimensions.eVars.eVar75 = _satellite.cookie.get("uniRefNumCookie");
        _satellite.cookie.remove("uniRefNumCookie");
    } /* DUT KYC - Upload Page - updated*/ else if (pagenametmp != "" && pagenametmp.indexOf("kyc:success") != -1) {
        /*if (eventStr == "") {
            eventStr = "event279,event287";
        } else {
            eventStr = eventStr + ",event279,event287";
        }*/
        content._experience.analytics.event201to300.event279 = content._experience.analytics.event201to300.event279 || {};
        content._experience.analytics.event201to300.event279.value = 1;
        content._experience.analytics.event201to300.event287 = content._experience.analytics.event201to300.event287 || {};
        content._experience.analytics.event201to300.event287.value = 1;

    } /* DUT KYC - Success Page - updated*/ else if (country == "es" && pagenametmp != "" && pagenametmp.indexOf("send-money:doctransfer") != -1) {
        var lastPageUrl = document.referrer;
        if (lastPageUrl != "undefined" && lastPageUrl != "" && lastPageUrl.indexOf("review.html") != -1 && txn_status == "c2001") {
            if (typeof prod != "undefined" && prod != "") {
                //eventStr = "event56" + (txn_id ? ":" + txn_id : "") + ",event34" + (txn_id ? ":" + txn_id : "");
                //s.products = ";" + prod + ";;;event34=" + txn_fee;
                content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
                content._experience.analytics.event1to100.event56.value = 1;
                content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
                content._experience.analytics.event1to100.event34.value = 1;
            } else {
                //eventStr = "event56" + (txn_id ? ":" + txn_id : "");
                content._experience.analytics.event1to100.event56 = content._experience.analytics.event1to100.event56 || {};
                content._experience.analytics.event1to100.event56.value = 1;
            }
        }
    } else {
        if (typeof prod != "undefined" && prod != "") {
            //s.products = ";" + prod + ";;;;";
        }

        if (pagenametmp != "" && pagenametmp.indexOf("fraudprotection") == -1) {
            if (pagenametmp != "" && pagenametmp.indexOf("send-money:start") != -1) {
                _satellite.cookie.remove("SM_Start_Cookie");
                if (country) {
                    if (country != "us") {
                        if (principal != "") {
                            //eventStr = "event6,event67";
                            content._experience.analytics.event1to100.event6 = content._experience.analytics.event1to100.event6 || {};
                            content._experience.analytics.event1to100.event6.value = 1;
                            content._experience.analytics.event1to100.event67 = content._experience.analytics.event1to100.event67 || {};
                            content._experience.analytics.event1to100.event67.value = 1;
                        }
                    }
                }
                if (loginStatus == "loggedin") {
                    /*if (eventStr != "") {
                        eventStr = eventStr + ",event5,event11";

                    } else {
                        eventStr = "event5,event11";
                    }*/
                    content._experience.analytics.event1to100.event5 = content._experience.analytics.event1to100.event5 || {};
                    content._experience.analytics.event1to100.event5.value = 1;
                    content._experience.analytics.event1to100.event11 = content._experience.analytics.event1to100.event11 || {};
                    content._experience.analytics.event1to100.event11.value = 1;
                    _satellite.cookie.set("SM_Start_Cookie", "true");
                }

                var selectedText = "";
                var countrySelect = "";
                var countrySelect = document.getElementById("wu-country-list");
                if (countrySelect != null && countrySelect !== undefined) {
                    selectedText = countrySelect.options[countrySelect.selectedIndex].text;
                }
                if (selectedText != "" && selectedText != null && selectedText !== undefined && selectedText.trim().toLowerCase() == "service unavailable") {
                    //s.eVar61 = "service unavailable";
                    content._experience.analytics.customDimensions.eVars.eVar61 = "service unavailable";
                    /*if (eventStr != "") {
                        eventStr = eventStr + ",event206";
                    } else {
                        eventStr = "event206";
                    }*/
                    content._experience.analytics.event201to300.event206 = content._experience.analytics.event201to300.event206 || {};
                    content._experience.analytics.event201to300.event206.value = 1;
                }
            } /* SM - Start */

            if (pagenametmp != "" && pagenametmp.indexOf("send-money:receiverinformation") != -1) {
                if (_satellite.cookie.get("SM_Start_Cookie") && _satellite.cookie.get("SM_Start_Cookie") == "true") {
                    //eventStr = "event7,event12";
                    content._experience.analytics.event1to100.event12 = content._experience.analytics.event1to100.event12 || {};
                    content._experience.analytics.event1to100.event12.value = 1;
                    content._experience.analytics.event1to100.event7 = content._experience.analytics.event1to100.event7 || {};
                    content._experience.analytics.event1to100.event7.value = 1;
                } else {
                    _satellite.cookie.set("SM_Start_Cookie", "true");
                    //eventStr = "event5,event7,event11,event12";
                    content._experience.analytics.event1to100.event5 = content._experience.analytics.event1to100.event5 || {};
                    content._experience.analytics.event1to100.event5.value = 1;
                    content._experience.analytics.event1to100.event7 = content._experience.analytics.event1to100.event7 || {};
                    content._experience.analytics.event1to100.event7.value = 1;
                    content._experience.analytics.event1to100.event12 = content._experience.analytics.event1to100.event12 || {};
                    content._experience.analytics.event1to100.event12.value = 1;
                    content._experience.analytics.event1to100.event11 = content._experience.analytics.event1to100.event11 || {};
                    content._experience.analytics.event1to100.event11.value = 1;
                }

                if (analyticsObject.sc_quicksend_id) {
                    var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    content._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                    content._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
                }
            }
            /* SM - Receiver */

            if (pagenametmp != "" && pagenametmp.indexOf("send-money:paymentinformation") != -1) {
                //eventStr = "event8,event13";
                content._experience.analytics.event1to100.event8 = content._experience.analytics.event1to100.event8 || {};
                content._experience.analytics.event1to100.event8.value = 1;
                content._experience.analytics.event1to100.event13 = content._experience.analytics.event1to100.event13 || {};
                content._experience.analytics.event1to100.event13.value = 1;
                if (analyticsObject.sc_quicksend_id) {
                    var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    content._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                    content._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
                }
            } /* SM - Payment */

            if (pagenametmp != "" && pagenametmp.indexOf("send-money:review") != -1) {
                //eventStr = "event9,event14";
                content._experience.analytics.event1to100.event9 = content._experience.analytics.event1to100.event9 || {};
                content._experience.analytics.event1to100.event9.value = 1;
                content._experience.analytics.event1to100.event14 = content._experience.analytics.event1to100.event14 || {};
                content._experience.analytics.event1to100.event14.value = 1;
                if (analyticsObject.sc_quicksend_id) {
                    var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                    content._experience.analytics.customDimensions.eVars.eVar47 = campId;
                } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                    content._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
                }
            } /* SM - Review */
        }
        if (pagenametmp != "" && pagenametmp.indexOf("send-money:confirmidentity") != -1) {
            if (analyticsObject.sc_quicksend_id) {
                var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                content._experience.analytics.customDimensions.eVars.eVar47 = campId;
            } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                content._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
            }
        } /* SM - Confirm Identity */

        if (pagenametmp != "" && pagenametmp.indexOf("send-money:globalcollectid") != -1) {
            if (analyticsObject.sc_quicksend_id) {
                var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                content._experience.analytics.customDimensions.eVars.eVar47 = campId;
            } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                content._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
            }
        } /* SM - Confirm Identity */

        if (
            pagenametmp != "" &&
            (pagenametmp.indexOf("send-money:sendmoneywupayreceipt") != -1 ||
                pagenametmp.indexOf("send-money:wire-complete") != -1 ||
                pagenametmp.indexOf("send-money:sendmoneypartnerfundsreceipt") != -1)
        ) {
            if (mtcn != "") {
                /*if (eventStr == "") {
                    eventStr = "event64:" + mtcn + ",event34" + (txn_id ? ":" + txn_id : "");
                } else {
                    eventStr = eventStr + "event64:" + mtcn + ",event34" + (txn_id ? ":" + txn_id : "");
                }*/
                content._experience.analytics.event1to100.event64 = content._experience.analytics.event1to100.event64 || {};
                content._experience.analytics.event1to100.event64.value =  1;
                content._experience.analytics.event1to100.event64.id =  mtcn;
                content._experience.analytics.event1to100.event34 = content._experience.analytics.event1to100.event34 || {};
                content._experience.analytics.event1to100.event34.value = 1;
                //if (typeof prod != "undefined" && prod != "") s.products = ";" + prod + ";;;event34=" + txn_fee;
            }
        } /* SM - WU Pay Receipt */

        if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:start") != -1) {
            _satellite.cookie.remove("BillPay_Start_Cookie");
            if (loginStatus == "loggedin") {
                //eventStr = "event121,event126";
                content._experience.analytics.event101to200.event121 = content._experience.analytics.event101to200.event121 || {};
                content._experience.analytics.event1to100.event121.value = 1;
                content._experience.analytics.event101to200.event126 = content._experience.analytics.event101to200.event126 || {};
                content._experience.analytics.event101to200.event126.value = 1;
                _satellite.cookie.set("BillPay_Start_Cookie", "true");
            }
        } /* PB - Start */

        if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:requiredbillerinformation") != -1) {
            //eventStr = "event121,event122,event126,event127";
            content._experience.analytics.event101to200.event121 = content._experience.analytics.event101to200.event121 || {};
            content._experience.analytics.event1to100.event121.value = 1;
            content._experience.analytics.event101to200.event126 = content._experience.analytics.event101to200.event126 || {};
            content._experience.analytics.event101to200.event126.value = 1;
            content._experience.analytics.event101to200.event122 = content._experience.analytics.event101to200.event122 || {};
            content._experience.analytics.event1to100.event122.value = 1;
            content._experience.analytics.event101to200.event127 = content._experience.analytics.event101to200.event127 || {};
            content._experience.analytics.event101to200.event127.value = 1;
        } /* PB - Biller Information */

        if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:paymentinformation") != -1) {
            if (_satellite.cookie.get("BillPay_Start_Cookie") && _satellite.cookie.get("BillPay_Start_Cookie") == "true") {
                //eventStr = "event123,event128";
                content._experience.analytics.event101to200.event123 = content._experience.analytics.event101to200.event123 || {};
                content._experience.analytics.event1to100.event123.value = 1;
                content._experience.analytics.event101to200.event128 = content._experience.analytics.event101to200.event128 || {};
                content._experience.analytics.event101to200.event128.value = 1;
            } else {
                //eventStr = "event121,event123,event126,event128";
                content._experience.analytics.event101to200.event121 = content._experience.analytics.event101to200.event121 || {};
                content._experience.analytics.event1to100.event121.value = 1;
                content._experience.analytics.event101to200.event123 = content._experience.analytics.event101to200.event123 || {};
                content._experience.analytics.event1to100.event123.value = 1;
                content._experience.analytics.event101to200.event126 = content._experience.analytics.event101to200.event126 || {};
                content._experience.analytics.event101to200.event126.value = 1;
                content._experience.analytics.event101to200.event128 = content._experience.analytics.event101to200.event128 || {};
                content._experience.analytics.event101to200.event128.value = 1;
                _satellite.cookie.set("BillPay_Start_Cookie", "true");
            }
        } /* PB - Biller Information */

        if (pagenametmp != "" && pagenametmp.indexOf("bill-pay:review") != -1) {
            //eventStr = "event124,event129";
            content._experience.analytics.event101to200.event124 = content._experience.analytics.event101to200.event124 || {};
            content._experience.analytics.event1to100.event124.value = 1;
            content._experience.analytics.event101to200.event129 = content._experience.analytics.event101to200.event129 || {};
            content._experience.analytics.event1to100.event129.value = 1;
        } /* PB - Review */

        if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:start") != -1) {
            _satellite.cookie.remove("SendInmate_Start_Cookie");
            if (loginStatus == "loggedin") {
                //eventStr = "event18,event23";
                content._experience.analytics.event1to100.event18 = content._experience.analytics.event1to100.event18 || {};
                content._experience.analytics.event1to100.event18.value = 1;
                content._experience.analytics.event1to100.event23 = content._experience.analytics.event1to100.event23 || {};
                content._experience.analytics.event1to100.event23.value = 1;
                _satellite.cookie.set("SendInmate_Start_Cookie", "true");
            }
        } /* Inmate - Start */

        if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:inmatereceiverinformation") != -1) {
            //eventStr = "event18,event19,event23,event24";
            content._experience.analytics.event1to100.event18 = content._experience.analytics.event1to100.event18 || {};
            content._experience.analytics.event1to100.event18.value = 1;
            content._experience.analytics.event1to100.event19 = content._experience.analytics.event1to100.event19 || {};
            content._experience.analytics.event1to100.event19.value = 1;
            content._experience.analytics.event1to100.event23 = content._experience.analytics.event1to100.event23 || {};
            content._experience.analytics.event1to100.event23.value = 1;
            content._experience.analytics.event1to100.event24 = content._experience.analytics.event1to100.event24 || {};
            content._experience.analytics.event1to100.event24.value = 1;
        } /* Inmate - Receiver */

        if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:inmatepaymentinformation") != -1) {
            if (_satellite.cookie.get("SendInmate_Start_Cookie") && _satellite.cookie.get("SendInmate_Start_Cookie") == "true") {
                //eventStr = "event20,event25";
                content._experience.analytics.event1to100.event20 = content._experience.analytics.event1to100.event20 || {};
                content._experience.analytics.event1to100.event20.value = 1;
                content._experience.analytics.event1to100.event25 = content._experience.analytics.event1to100.event25 || {};
                content._experience.analytics.event1to100.event25.value = 1;
            } else {
                //eventStr = "event18,event23,event20,event25";
                content._experience.analytics.event1to100.event18 = content._experience.analytics.event1to100.event18 || {};
                content._experience.analytics.event1to100.event18.value = 1;
                content._experience.analytics.event1to100.event23 = content._experience.analytics.event1to100.event23 || {};
                content._experience.analytics.event1to100.event23.value = 1;
                content._experience.analytics.event1to100.event20 = content._experience.analytics.event1to100.event20 || {};
                content._experience.analytics.event1to100.event20.value = 1;
                content._experience.analytics.event1to100.event25 = content._experience.analytics.event1to100.event25 || {};
                content._experience.analytics.event1to100.event25.value = 1;
                _satellite.cookie.set("SendInmate_Start_Cookie", "true");
            }
        } /* Inmate - Payment */

        if (pagenametmp != "" && pagenametmp.indexOf("send-inmate:inmatereview") != -1) {
            //eventStr = "event21,event26";
            content._experience.analytics.event1to100.event21 = content._experience.analytics.event1to100.event21 || {};
            content._experience.analytics.event1to100.event21.value = 1;
            content._experience.analytics.event1to100.event26 = content._experience.analytics.event1to100.event26 || {};
            content._experience.analytics.event1to100.event26.value = 1;
        } /* Inmate - Review */

        if (
            pagenametmp != "" &&
            (pagenametmp.indexOf("price-estimator:continue") != -1 ||
                pagenametmp.indexOf("price-estimator:performestimatedfeeinquiry") != -1 ||
                pagenametmp.indexOf("send-inmate:performestimatedinmatefeeinquiry") != -1)
        ) {
            //eventStr = "event30";
            content._experience.analytics.event1to100.event30 = content._experience.analytics.event1to100.event30 || {};
            content._experience.analytics.event1to100.event30.value = 1;
        } /* Price Estimate - Start */

        if (pagenametmp != "" && pagenametmp.indexOf("search:results") != -1) {
            //eventStr = "event33";
            content._experience.analytics.event1to100.event33 = content._experience.analytics.event1to100.event33 || {};
            content._experience.analytics.event1to100.event33.value = 1;
        } /* Search - Search Results page */

        if (pagenametmp != "" && pagenametmp.indexOf("search:no-results") != -1) {
            //eventStr = "event33";
            content._experience.analytics.event1to100.event33 = content._experience.analytics.event1to100.event33 || {};
            content._experience.analytics.event1to100.event33.value = 1;
        } /* Search - Pls help us understand better. */

        if (
            pagenametmp != "" &&
            pagenametmp.indexOf("password-recovery") != -1 &&
            pagenametmp.indexOf("securityquestion") == -1 &&
            pagenametmp.indexOf("emailsent") == -1 &&
            pagenametmp.indexOf("resetpassword") == -1
        ) {
            //eventStr = "event53";
            content._experience.analytics.event1to100.event53 = content._experience.analytics.event1to100.event53 || {};
            content._experience.analytics.event1to100.event53.value = 1;
        } /* password recovery start. */

        //Added by Sameer Jindal for PBL 293
        if (pagenametmp != "" && pagenametmp.indexOf("password-recovery:resetpassword") != -1) {
            //eventStr = "event66";
            content._experience.analytics.event1to100.event66 = content._experience.analytics.event1to100.event66 || {};
            content._experience.analytics.event1to100.event66.value = 1;
        }

        if (
            pageNameEvnt != "" &&
            (pageNameEvnt == "send-money:register" ||
                pageNameEvnt == "register" ||
                pageNameEvnt == "send-inmate:register" ||
                pageNameEvnt == "register:sm-login" ||
                pageNameEvnt == "bill-pay:register")
        ) {
            //eventStr = "event89,event92";
            content._experience.analytics.event1to100.event89 = content._experience.analytics.event1to100.event89 || {};
            content._experience.analytics.event1to100.event89.value = 1;
            content._experience.analytics.event1to100.event92 = content._experience.analytics.event1to100.event92 || {};
            content._experience.analytics.event1to100.event92.value = 1;
                    if (sessionStorage.getItem("isProgressiveRegEnabled") === "true") 
                        {
                            analyticsObject.sc_progressive_page = "progressive-register";
                            content._experience.analytics.customDimensions.eVars.eVar23 = "progressive-register";
                            content._experience.analytics.event201to300.event281 = content._experience.analytics.event201to300.event281 || {};
                            content._experience.analytics.event201to300.event281.value = 1;
                        }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("profile:personal-info") != -1) {
            if (
                analyticsObject.sc_link_name &&
                analyticsObject.sc_link_name != "" &&
                (analyticsObject.sc_link_name.toLowerCase() == "save-password" || analyticsObject.sc_link_name.toLowerCase() == "button-save-password")
            ) {
                content._experience.analytics.customDimensions.eVars.eVar61 = analyticsObject.sc_link_name;
                //eventStr = "event184";
                content._experience.analytics.event101to200.event184 = content._experience.analytics.event101to200.event184 || {};
                content._experience.analytics.event101to200.event184.value = 1;
            } else {
                content._experience.analytics.customDimensions.eVars.eVar61 = "link-profile-icon";
                if (linkName != "") {
                    switch (linkName) {
                        case "save-address":
                        case "button-save-address":
                        case "save-securityques":
                        case "button-save-securityques":
                        case "confirm-pin":
                            //eventStr = "event184";
                            content._experience.analytics.event101to200.event184 = content._experience.analytics.event101to200.event184 || {};
                            content._experience.analytics.event101to200.event184.value = 1;
                            break;
                    }
                }
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("profile:edit-address") != -1) {
            if ("edit-address" == linkName || "icon-edit-address" == linkName) {
                //eventStr = "event183";
                content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
                content._experience.analytics.event101to200.event183.value = 1;
            }
            content._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("profile:edit-password") != -1) {
            if ("edit-password" == linkName || "icon-edit-password" == linkName) {
                //eventStr = "event183";
                content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
                content._experience.analytics.event101to200.event183.value = 1;
            }
            content._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("profile:edit-securityques") != -1) {
            if ("edit-securityques" == linkName || "icon-edit-securityques" == linkName) {
                //eventStr = "event183";
                content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
                content._experience.analytics.event101to200.event183.value = 1;
            }
            content._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("profile:edit-email") != -1) {
            if ("edit-email" == linkName || "icon-edit-email" == linkName) {
                //eventStr = "event183";
                content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
                content._experience.analytics.event101to200.event183.value = 1;
            }
            content._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("my-receivers:edit-receiver") != -1) {
            if ("mysmreceiver-edit" == linkName || "mybillpayreceiver-edit" == linkName || "myinmatereceiver-edit" == linkName) {
                //eventStr = "event183";
                content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
                content._experience.analytics.event101to200.event183.value = 1;
            }
            content._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("my-receivers:add-receiver") != -1) {
            if ("myreceiver-add" == linkName) {
                //eventStr = "event183";
                content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
                content._experience.analytics.event101to200.event183.value = 1;
            }
            content._experience.analytics.customDimensions.eVars.eVar61 = linkName;
        }

        //Links from MyWU Portal
        /*if (s.Util.getQueryParam("sln")) {
            //eventStr = "event183";
                content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
                content._experience.analytics.event101to200.event183.value = 1;
            content._experience.analytics.customDimensions.eVars.eVar61 = s.Util.getQueryParam("sln");
        }

        //HSFP
        if (s.Util.getQueryParam("partnerName")) _satellite.cookie.set("hsfp_partner", s.Util.getQueryParam("partnerName"));
        if (_satellite.cookie.get("hsfp_partner")) {
            content._experience.analytics.customDimensions.eVars.eVar71 = _satellite.cookie.get("hsfp_partner").toLowerCase();
            _satellite.cookie.remove("hsfp_partner");
        }*/

        if (analyticsObject.sc_sso_status == "true") {
            /*if (eventStr == "") eventStr = "event234";
            else eventStr = eventStr + ",event234";*/
            content._experience.analytics.event201to300.event234 = content._experience.analytics.event201to300.event234 || {};
            content._experience.analytics.event201to300.event234.value = 1;
        }
        //HSFP END

        if (pagenametmp != "" && pagenametmp.indexOf("kyc:lookup") != -1) {
            if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() != "no") {
                /*if (eventStr == "") {
                    eventStr = "event77";
                } else {
                    eventStr = eventStr + ",event77";
                }*/
                content._experience.analytics.event1to100.event77 = content._experience.analytics.event1to100.event77 || {};
                content._experience.analytics.event1to100.event77.value = 1;
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("kyc:docupload") != -1) {
            if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() != "no") {
                /*if (eventStr == "") {
                    eventStr = "event78";
                } else {
                    eventStr = eventStr + ",event78";
                }*/
                content._experience.analytics.event1to100.event78 = content._experience.analytics.event1to100.event78 || {};
                content._experience.analytics.event1to100.event78.value = 1;
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("kyc:upload-success") != -1) {
            if (typeof analyticsObject.sc_fire_event == "undefined" || analyticsObject.sc_fire_event.toLowerCase() != "no") {
                /*if (eventStr == "") {
                    eventStr = "event79";
                } else {
                    eventStr = eventStr + ",event79";
                }*/
                content._experience.analytics.event1to100.event79 = content._experience.analytics.event1to100.event79 || {};
                content._experience.analytics.event1to100.event79.value = 1;
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("send-money:sendagain") != -1) {
            //eventStr = "event5,event11";
            if (analyticsObject.sc_quicksend_id) {
                var campId = String(analyticsObject.sc_quicksend_id).toLowerCase();
                content._experience.analytics.customDimensions.eVars.eVar47 = campId;
            } else if (_satellite.getVar("WUInternalCampaignJSObject") != "") {
                content._experience.analytics.customDimensions.eVars.eVar47 = _satellite.getVar("WUInternalCampaignJSObject");
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:reason") != -1) {
            //s.list2 = analyticsObject.sc_ab_testing ? analyticsObject.sc_ab_testing.toLowerCase() : "";
            content._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            //eventStr = "event218,event219";
            content._experience.analytics.event201to300.event218 = content._experience.analytics.event201to300.event218 || {};
            content._experience.analytics.event201to300.event218.value = 1;
            content._experience.analytics.event201to300.event219 = content._experience.analytics.event201to300.event219 || {};
            content._experience.analytics.event201to300.event219.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-transfer-cont") != -1) {
            content._experience.analytics.customDimensions.eVars.eVar61 = "canceltxn-abandoned";
            content._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            content._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            content._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
            //eventStr = "event183";
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
        }

        if (
            pagenametmp != "" &&
            (pagenametmp.indexOf("cancel-transfer:review-full-refund") != -1 || pagenametmp.indexOf("cancel-transfer:review-pr-refund") != -1)
        ) {
            content._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            content._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            content._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
            if (_satellite.getVar("WULinkDisplayJSObject") != "" && _satellite.getVar("WULinkDisplayJSObject") != "null") {
                content._experience.analytics.customDimensions.eVars.list1 = _satellite.getVar("WULinkDisplayJSObject");
                //eventStr = "event206";
                content._experience.analytics.event201to300.event206 = content._experience.analytics.event201to300.event206 || {};
                content._experience.analytics.event201to300.event206.value = 1;
            }

            /*if (eventStr != "") {
                eventStr = eventStr + ",event185,event186";
            } else {
                eventStr = "event185,event186";
            }*/
            content._experience.analytics.event101to200.event185 = content._experience.analytics.event101to200.event185 || {};
            content._experience.analytics.event101to200.event185.value = 1;
            content._experience.analytics.event101to200.event186 = content._experience.analytics.event101to200.event186 || {};
            content._experience.analytics.event101to200.event186.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-full-refund") != -1) {
            content._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            content._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            content._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
            content._experience.analytics.customDimensions.eVars.eVar21 = "refunded";

            if (mtcn != "") {
                //eventStr = "event189:" + mtcn + ",event198=" + refundAmnt + ":" + mtcn + ",event199=" + txn_fee + ":" + mtcn;
                content._experience.analytics.event101to200.event189 = content._experience.analytics.event101to200.event189 || {};
                content._experience.analytics.event101to200.event189.value = 1;
                content._experience.analytics.event101to200.event189.id = mtcn;
                content._experience.analytics.event101to200.event198 = content._experience.analytics.event101to200.event198 || {};
                content._experience.analytics.event101to200.event198.value = 1;
                content._experience.analytics.event101to200.event198.id = refundAmnt + ":" + mtcn;
                content._experience.analytics.event101to200.event199 = content._experience.analytics.event101to200.event199 || {};
                content._experience.analytics.event101to200.event199.value = 1;
                content._experience.analytics.event101to200.event199.id = txn_fee + ":" + mtcn;
            }
            //s.products = ";;;-" + txn_fee + ";;";
        }

        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:receipt-pr-refund") != -1) {
            content._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            content._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            content._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
            content._experience.analytics.customDimensions.eVars.eVar21 = "refunded";

            if (mtcn != "") {
                //eventStr = "event189:" + mtcn + ",event198=" + refundAmnt + ":" + mtcn;
                content._experience.analytics.event101to200.event189 = content._experience.analytics.event101to200.event189 || {};
                content._experience.analytics.event101to200.event189.value = 1;
                content._experience.analytics.event101to200.event189.id = mtcn;
                content._experience.analytics.event101to200.event198 = content._experience.analytics.event101to200.event198 || {};
                content._experience.analytics.event101to200.event198.value = 1;
                content._experience.analytics.event101to200.event198.id = refundAmnt + ":" + mtcn;
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:case-request") != -1) {
            content._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            content._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            content._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
        }

        if (pagenametmp != "" && pagenametmp.indexOf("cancel-transfer:declined") != -1) {
            content._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
            content._experience.analytics.customDimensions.eVars.eVar66 = _satellite.getVar("WURefundAmntJSObject");
            content._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar("WUReasonCategoryJSObject");
        }
        /*if(pagenametmp !='' && (pagenametmp.indexOf('profile:edit-address') != -1) || (pagenametmp.indexOf('profile:edit-password') != -1) || (pagenametmp.indexOf('profile:edit-securityques') != -1)) {
        s.eVar61 = linkName;
        eventStr = 'event183';
      }*/

        //changes for sprint 20 end
        //Added for RequestMoney flow

        if (pagenametmp != "" && pagenametmp.indexOf("request-money:estimate") != -1) {
            //eventStr = "event172,event173";
            content._experience.analytics.event101to200.event172 = content._experience.analytics.event101to200.event172 || {};
            content._experience.analytics.event101to200.event172.value = 1;
            content._experience.analytics.event101to200.event173 = content._experience.analytics.event101to200.event173 || {};
            content._experience.analytics.event101to200.event173.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("request-money:receiverinfo") != -1) {
            //eventStr = "event174,event175";
            content._experience.analytics.event101to200.event174 = content._experience.analytics.event101to200.event174 || {};
            content._experience.analytics.event101to200.event174.value = 1;
            content._experience.analytics.event101to200.event175 = content._experience.analytics.event101to200.event175 || {};
            content._experience.analytics.event101to200.event175.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("request-money:complete") != -1) {
            //eventStr = "event180";
            content._experience.analytics.event101to200.event180 = content._experience.analytics.event101to200.event180 || {};
            content._experience.analytics.event101to200.event180.value = 1;
        }
        //RequestMoney flow end

        //pickup cash start
        if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:start") != -1) {
            //eventStr = "event160,event161";
            content._experience.analytics.event101to200.event160 = content._experience.analytics.event101to200.event160 || {};
            content._experience.analytics.event101to200.event160.value = 1;
            content._experience.analytics.event101to200.event161 = content._experience.analytics.event101to200.event161 || {};
            content._experience.analytics.event101to200.event161.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:senderinfo") != -1) {
            if (sessionStorage.getItem("sc_links")) {
                var sclink = sessionStorage.getItem("sc_links");
                if (sclink.indexOf("website:tracktransfer:details") != -1) {
                    //below events are added in case user reaches sender info page from track transfer flow
                    if ("mx" == country) {
                        //eventStr = "event160,event161,event162,event163";
                        content._experience.analytics.event101to200.event160 = content._experience.analytics.event101to200.event160 || {};
                        content._experience.analytics.event101to200.event160.value = 1;
                        content._experience.analytics.event101to200.event161 = content._experience.analytics.event101to200.event161 || {};
                        content._experience.analytics.event101to200.event161.value = 1;
                        content._experience.analytics.event101to200.event162 = content._experience.analytics.event101to200.event162 || {};
                        content._experience.analytics.event101to200.event162.value = 1;
                        content._experience.analytics.event101to200.event163 = content._experience.analytics.event101to200.event163 || {};
                        content._experience.analytics.event101to200.event163.value = 1;
                    } else {
                        //eventStr = "event160,event161";
                        content._experience.analytics.event101to200.event160 = content._experience.analytics.event101to200.event160 || {};
                        content._experience.analytics.event101to200.event160.value = 1;
                        content._experience.analytics.event101to200.event161 = content._experience.analytics.event101to200.event161 || {};
                        content._experience.analytics.event101to200.event161.value = 1;
                    }
                }
            }
            if (eventStr == "") {
                //eventStr = "event164,event165";
                content._experience.analytics.event101to200.event164 = content._experience.analytics.event101to200.event164 || {};
                content._experience.analytics.event101to200.event164.value = 1;
                content._experience.analytics.event101to200.event165 = content._experience.analytics.event101to200.event165 || {};
                content._experience.analytics.event101to200.event165.value = 1;
            } else {
                //eventStr = eventStr + ",event164,event165";
                content._experience.analytics.event101to200.event164 = content._experience.analytics.event101to200.event164 || {};
                content._experience.analytics.event101to200.event164.value = 1;
                content._experience.analytics.event101to200.event165 = content._experience.analytics.event101to200.event165 || {};
                content._experience.analytics.event101to200.event165.value = 1;
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:senderinfo:namemismatch") != -1) {
            //eventStr = "event166,event167";
            content._experience.analytics.event101to200.event166 = content._experience.analytics.event101to200.event166 || {};
            content._experience.analytics.event101to200.event166.value = 1;
            content._experience.analytics.event101to200.event167 = content._experience.analytics.event101to200.event167 || {};
            content._experience.analytics.event101to200.event167.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:securityquestion") != -1) {
            //eventStr = "event168,event169";
            content._experience.analytics.event101to200.event168 = content._experience.analytics.event101to200.event168 || {};
            content._experience.analytics.event101to200.event168.value = 1;
            content._experience.analytics.event101to200.event169 = content._experience.analytics.event101to200.event169 || {};
            content._experience.analytics.event101to200.event169.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("pickupcash:confirm") != -1) {
            //eventStr = "event170,event171";
            content._experience.analytics.event101to200.event170 = content._experience.analytics.event101to200.event170 || {};
            content._experience.analytics.event101to200.event170.value = 1;
            content._experience.analytics.event101to200.event171 = content._experience.analytics.event101to200.event171 || {};
            content._experience.analytics.event101to200.event171.value = 1;
        }

        //pickup cash end

        //added for send monet receipt staged
        if (pagenametmp != "" && pagenametmp.indexOf("send-money:receipt-staged") != -1) {
            if (
                typeof analyticsObject.sc_transaction_id != "undefined" &&
                analyticsObject.sc_transaction_id != "" &&
                analyticsObject.sc_transaction_id != null
            ) {
                tid = analyticsObject.sc_transaction_id.toLowerCase();
                var tempmtcn = tid.slice(6).trim();
            }
            content._experience.analytics.customDimensions.eVars.eVar20 = tempmtcn;
            content._experience.analytics.customDimensions.eVars.eVar21 = "staged";
            //eventStr = "event118:" + tempmtcn + ",event120=" + txn_fee + ":" + tempmtcn;
            content._experience.analytics.event101to200.event118 = content._experience.analytics.event101to200.event118 || {};
            content._experience.analytics.event101to200.event118.value = 1;
            content._experience.analytics.event101to200.event118.id = tempmtcn;
            content._experience.analytics.event101to200.event120 = content._experience.analytics.event101to200.event120 || {};
            content._experience.analytics.event101to200.event120.value = 1;
            content._experience.analytics.event101to200.event120.id = txn_fee + ":" + tempmtcn;
        }

        if (pagenametmp != "" && (pagenametmp.indexOf("profile:txn-history") != -1 || pagenametmp.indexOf("track-transfer") != -1)) {
            _satellite.cookie.remove("cancelTransferMTChannel");
        }

        if (_satellite.getVar("WULoginSuccessJSObject")) {
            content._experience.analytics.customDimensions.eVars.eVar42 = "login";
            _satellite.cookie.remove("NewUserCookie");
            if (country == "us" && pagenametmp != "" && pagenametmp.indexOf("contactus") != -1) {
            } else {
                /*if (eventStr == "") {
                    eventStr = "event2";
                } else {
                    eventStr = eventStr + ",event2";
                }*/
                content._experience.analytics.event1to100.event2 = content._experience.analytics.event1to100.event2 || {};
                content._experience.analytics.event1to100.event2.value = 1;
            }
        }

        //Kirti - changed the check back to NZ from responsive
        if (country && "nz" != country) {
            if (_satellite.getVar("WURegisterSuccessJSObject")) {
                content._experience.analytics.customDimensions.eVars.eVar42 = "register";
                if (_satellite.cookie.get("mywuoptin") == "yes") {
                    content._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin";
                    /*if (eventStr == "") {
                        eventStr = "event40";
                    } else {
                        eventStr = eventStr + ",event40";
                    }*/
                    content._experience.analytics.event1to100.event40 = content._experience.analytics.event1to100.event40 || {};
                    content._experience.analytics.event1to100.event40.value = 1;
                }
                //Kirti - added the code to set NewUserCookie for registration to identify new user during the same session in which the registration took place
                _satellite.cookie.set("NewUserCookie", true, { expires: 1 });
                /*if (eventStr == "") {
                    eventStr = "event4";
                } else {
                    eventStr = eventStr + ",event4";
                }*/
                content._experience.analytics.event1to100.event4 = content._experience.analytics.event1to100.event4 || {};
                content._experience.analytics.event1to100.event4.value = 1;
                //Check the 3rdparty data user consent on successful registration ~pk~
                if (analyticsObject.sc_3rdPartyDataOptin != undefined) {
                    eventStr += ",event299";
                    content._experience.analytics.event201to300.event299 = content._experience.analytics.event201to300.event299 || {};
                    content._experience.analytics.event201to300.event299.value = 1;
                    content._experience.analytics.customDimensions.eVars.eVar81 = analyticsObject.sc_3rdPartyDataOptin ? "consent-accepted" : "consent-denied";
                    analyticsObject.sc_3rdPartyDataOptin = undefined;
                    sessionStorage.removeItem("DTM-3rdPartyDataOptin");
                }
            }
            //}
            //}
        } else if (country && "nz" == country) {
            if (_satellite.getVar("WUPageTypeJSObject") && _satellite.getVar("WUPageTypeJSObject") == "responsive") {
                if (_satellite.getVar("WURegisterSuccessJSObject")) {
                    content._experience.analytics.customDimensions.eVars.eVar42 = "register";
                    if (_satellite.cookie.get("mywuoptin") == "yes") {
                        content._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin";
                        /*if (eventStr == "") {
                            eventStr = "event40";
                        } else {
                            eventStr = eventStr + ",event40";
                        }*/
                        content._experience.analytics.event1to100.event40 = content._experience.analytics.event1to100.event40 || {};
                        content._experience.analytics.event1to100.event40.value = 1;
                    }
                    //Kirti - added the code to set NewUserCookie for registration to identify new user during the same session in which the registration took place
                    _satellite.cookie.set("NewUserCookie", true, { expires: 1 });
                    /*if (eventStr == "") {
                        eventStr = "event4";
                    } else {
                        eventStr = eventStr + ",event4";
                    }*/
                    content._experience.analytics.event1to100.event4 = content._experience.analytics.event1to100.event4 || {};
                    content._experience.analytics.event1to100.event4.value = 1;
                    //Check the 3rdparty data user consent on successful registration ~pk~
                    if (analyticsObject.sc_3rdPartyDataOptin != undefined) {
                        eventStr += ",event299";
                        content._experience.analytics.event201to300.event299 = content._experience.analytics.event201to300.event299 || {};
                        content._experience.analytics.event201to300.event299.value = 1;
                        content._experience.analytics.customDimensions.eVars.eVar81 = analyticsObject.sc_3rdPartyDataOptin ? "consent-accepted" : "consent-denied";
                        analyticsObject.sc_3rdPartyDataOptin = undefined;
                        sessionStorage.removeItem("DTM-3rdPartyDataOptin");
                    }
                }
            } else if (pagenametmp != "" && pagenametmp.indexOf("verification") != -1) {
                var lastPageUrl = document.referrer;
                if (lastPageUrl != "undefined" && lastPageUrl != "" && lastPageUrl.indexOf("register") != -1) {
                    content._experience.analytics.customDimensions.eVars.eVar42 = "register";
                    if (_satellite.cookie.get("mywuoptin") == "yes") {
                        content._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin";
                        /*if (eventStr == "") {
                            eventStr = "event40";
                        } else {
                            eventStr = eventStr + ",event40";
                        }*/
                        content._experience.analytics.event1to100.event40 = content._experience.analytics.event1to100.event40 || {};
                        content._experience.analytics.event1to100.event40.value = 1;
                    }
                    _satellite.cookie.set("NewUserCookie", true, { expires: 1 });
                    /*if (eventStr == "") {
                        eventStr = "event4";
                    } else {
                        eventStr = eventStr + ",event4";
                    }*/
                    content._experience.analytics.event1to100.event4 = content._experience.analytics.event1to100.event4 || {};
                    content._experience.analytics.event1to100.event4.value = 1;
                    //Check the 3rdparty data user consent on successful registration ~pk~
                    if (analyticsObject.sc_3rdPartyDataOptin != undefined) {
                        //eventStr += ",event299";
                        content._experience.analytics.event201to300.event299 = content._experience.analytics.event201to300.event299 || {};
                        content._experience.analytics.event201to300.event299.value = 1;
                        content._experience.analytics.customDimensions.eVars.eVar81 = analyticsObject.sc_3rdPartyDataOptin ? "consent-accepted" : "consent-denied";
                        analyticsObject.sc_3rdPartyDataOptin = undefined;
                        sessionStorage.removeItem("DTM-3rdPartyDataOptin");
                    }
                }
            }
        }

        if (_satellite.getVar("WUAccountActiveJSObject")) {
            //Kirti - Commenting the setting of NewUserCookie as account activation is not getting fired in case of responsive websites where OTP page is not coming in the flow. Moving it to registration success block.
            //_satellite.cookie.set('NewUserCookie',true,1);
            /*if (eventStr == "") {
                eventStr = "event32";
            } else {
                eventStr = eventStr + ",event32";
            }*/
            content._experience.analytics.event1to100.event32 = content._experience.analytics.event1to100.event32 || {};
            content._experience.analytics.event1to100.event32.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:start") != -1) {
            //eventStr = "event82";
            content._experience.analytics.event1to100.event82 = content._experience.analytics.event1to100.event82 || {};
            content._experience.analytics.event1to100.event82.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:emailsent") != -1) {
            //eventStr = "event85";
            content._experience.analytics.event1to100.event85 = content._experience.analytics.event1to100.event85 || {};
            content._experience.analytics.event1to100.event85.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:securityquestion") != -1) {
            //eventStr = "event86";
            content._experience.analytics.event1to100.event86 = content._experience.analytics.event1to100.event86 || {};
            content._experience.analytics.event1to100.event86.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:resetpassword") != -1) {
            //eventStr = "event87";
            content._experience.analytics.event1to100.event87 = content._experience.analytics.event1to100.event87 || {};
            content._experience.analytics.event1to100.event87.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("name-change:verificationoptions:text-me") != -1) {
            //eventStr = "event207,event208";
            content._experience.analytics.event201to300.event207 = content._experience.analytics.event201to300.event207 || {};
            content._experience.analytics.event201to300.event207.value = 1;
            content._experience.analytics.event201to300.event208 = content._experience.analytics.event201to300.event208 || {};
            content._experience.analytics.event201to300.event208.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("name-change:enter-pin") != -1) {
            //eventStr = "event209,event210";
            content._experience.analytics.event201to300.event209 = content._experience.analytics.event201to300.event209 || {};
            content._experience.analytics.event201to300.event209.value = 1;
            content._experience.analytics.event201to300.event210 = content._experience.analytics.event201to300.event210 || {};
            content._experience.analytics.event201to300.event210.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("name-change:editreceiver-name") != -1) {
            var lastPgName = _satellite.getVar("WULinkIDJSObject");
            if (lastPgName != "" && lastPgName.indexOf("cancel-transfer:reason") != -1) {
                content._experience.analytics.customDimensions.eVars.eVar61 = "receiver-namechange";
                /*if (eventStr == "") {
                    eventStr = "event213,event214,event211";
                } else {
                    eventStr = eventStr + ",event213,event214,event211";
                }*/
                content._experience.analytics.event201to300.event213 = content._experience.analytics.event201to300.event213 || {};
                content._experience.analytics.event201to300.event213.value = 1;
                content._experience.analytics.event201to300.event214 = content._experience.analytics.event201to300.event214 || {};
                content._experience.analytics.event201to300.event214.value = 1;
                content._experience.analytics.event201to300.event211 = content._experience.analytics.event201to300.event211 || {};
                content._experience.analytics.event201to300.event211.value = 1;
            } else {
                /*if (eventStr == "") {
                    eventStr = "event213,event214";
                } else {
                    eventStr = eventStr + ",event213,event214";
                }*/
                content._experience.analytics.event201to300.event213 = content._experience.analytics.event201to300.event213 || {};
                content._experience.analytics.event201to300.event213.value = 1;
                content._experience.analytics.event201to300.event214 = content._experience.analytics.event201to300.event214 || {};
                content._experience.analytics.event201to300.event214.value = 1;
            }
        }

        if (pagenametmp != "" && (pagenametmp.indexOf("name-change:review") != -1 || pagenametmp.indexOf("name-change:namechangereview") != -1)) {
            //eventStr = "event215,event216";
            content._experience.analytics.event201to300.event215 = content._experience.analytics.event201to300.event215 || {};
            content._experience.analytics.event201to300.event215.value = 1;
            content._experience.analytics.event201to300.event216 = content._experience.analytics.event201to300.event216 || {};
            content._experience.analytics.event201to300.event216.value = 1;
        }

        if (pagenametmp != "" && (pagenametmp.indexOf("name-change:receipt") != -1 || pagenametmp.indexOf("name-change:namechangereceipt") != -1)) {
            if (txn_id != "") {
                //eventStr = "event217:" + txn_id;
                content._experience.analytics.event201to300.event217 = content._experience.analytics.event201to300.event217 || {};
                content._experience.analytics.event201to300.event217.value = 1;
                content._experience.analytics.event201to300.event217.id = txn_id;
            }
        }

        if (pagenametmp != "" && (pagenametmp.indexOf("collectid:details") != -1 || pagenametmp.indexOf("collect-id:details") != -1)) {
            /*if (eventStr == "") {
                eventStr = "event142,event143";
            } else {
                eventStr = eventStr + ",event142,event143";
            }*/
            content._experience.analytics.event101to200.event142 = content._experience.analytics.event101to200.event142 || {};
            content._experience.analytics.event101to200.event142.value = 1;
            content._experience.analytics.event101to200.event143 = content._experience.analytics.event201to300.event143 || {};
            content._experience.analytics.event201to300.event143.value = 1;
            if (
                typeof analyticsObject.sc_verify_status != "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() == "unverified" &&
                analyticsObject.sc_user_id != "" &&
                typeof analyticsObject.sc_user_id != "undefined"
            ) {
                //eventStr = eventStr + ",event244:" + analyticsObject.sc_user_id;
                content._experience.analytics.event201to300.event244 = content._experience.analytics.event201to300.event244 || {};
                content._experience.analytics.event201to300.event244.value = 1;
                content._experience.analytics.event201to300.event244.id = analyticsObject.sc_user_id;
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("collectid:failed") != -1) {
            //eventStr = "event148";
            content._experience.analytics.event101to200.event148 = content._experience.analytics.event201to300.event148 || {};
            content._experience.analytics.event201to300.event148.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("fraudprotection") == -1) {

            if (pagenametmp != "" && pagenametmp.indexOf("profile:txn-history") != -1)
                if (
                    typeof analyticsObject.sc_verify_status != "undefined" &&
                    analyticsObject.sc_verify_status.toLowerCase() == "inprogress" &&
                    analyticsObject.sc_user_id != "" &&
                    typeof analyticsObject.sc_user_id != "undefined"
                ){
                    //if (eventStr == "") eventStr = "event245:" + analyticsObject.sc_user_id;
                    //else eventStr = eventStr + ",event245:" + analyticsObject.sc_user_id;

                    content._experience.analytics.event201to300.event245 = content._experience.analytics.event201to300.event245 || {};
                    content._experience.analytics.event201to300.event245.value = 1;
                }

            if (pagenametmp != "" && pagenametmp.indexOf("send-money:start") != -1)

            if (
                typeof analyticsObject.sc_verify_status != "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() == "verified" &&
                analyticsObject.sc_user_id != "" &&
                typeof analyticsObject.sc_user_id != "undefined"
            )
                //if (eventStr == "") eventStr = "event248:" + analyticsObject.sc_user_id;
                //else eventStr = eventStr + ",event248:" + analyticsObject.sc_user_id;
              {  

            content._experience.analytics.event201to300.event248 = content._experience.analytics.event201to300.event248 || {};
            content._experience.analytics.event201to300.event248.value = 1;
              }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("collectid:ekyc-failed") != -1) {

            if (
                typeof analyticsObject.sc_verify_status != "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() == "suspended" &&
                analyticsObject.sc_user_id != "" &&
                typeof analyticsObject.sc_user_id != "undefined"
            ) {
                /*if (eventStr == "") {
                    eventStr = "event247:" + analyticsObject.sc_user_id;
                } else {
                    eventStr = eventStr + ",event247:" + analyticsObject.sc_user_id;
                }*/

                content._experience.analytics.event201to300.event247 = content._experience.analytics.event201to300.event247 || {};
                content._experience.analytics.event201to300.event247.value = 1;
                content._experience.analytics.event201to300.event247.id = analyticsObject.sc_user_id;
            }
        }

        if (pagenametmp != "" && pagenametmp.indexOf("collectid:identify") != -1) {
            if (
                typeof analyticsObject.sc_verify_status != "undefined" &&
                analyticsObject.sc_verify_status.toLowerCase() == "rejected" &&
                analyticsObject.sc_user_id != "" &&
                typeof analyticsObject.sc_user_id != "undefined"
            ) {
                /*if (eventStr == "") {
                    eventStr = "event246:" + analyticsObject.sc_user_id;
                } else {
                    eventStr = eventStr + ",event246:" + analyticsObject.sc_user_id;
                }*/
                content._experience.analytics.event201to300.event246 = content._experience.analytics.event201to300.event246 || {};
                content._experience.analytics.event201to300.event246.value = 1;
                content._experience.analytics.event201to300.event246.id = analyticsObject.sc_user_id;
            }
        }

        //Changing from event 84 to event 88 due to changes in the password reset flow HQW-2369
        if (typeof analyticsObject.sc_fp_complete != "undefined" && analyticsObject.sc_fp_complete != "") {
            if (analyticsObject.sc_fp_complete == "true") {
                /*if (eventStr == "") {
                    eventStr = "event88";
                } else {
                    eventStr = eventStr + ",event88";
                }*/
                content._experience.analytics.event1to100.event88 = content._experience.analytics.event1to100.event88 || {};
                content._experience.analytics.event1to100.event88.value = 1;
            }
        }

        if (typeof analyticsObject.sc_letter_sent != "undefined" && analyticsObject.sc_letter_sent.toString().toLowerCase() == "true") {
            _satellite.cookie.set("EUID_VERIFY_LETTER_SENT", "true");
            /*if (eventStr == "") {
                eventStr = "event140,event141";
            } else {
                eventStr = eventStr + ",event140,event141";
            }*/
            content._experience.analytics.event101to200.event140 = content._experience.analytics.event101to200.event140 || {};
            content._experience.analytics.event101to200.event140.value = 1;
            content._experience.analytics.eevent101to200.event141 = content._experience.analytics.event101to200.event141 || {};
            content._experience.analytics.event101to200.event141.value = 1;
        }

        if (verification_blocked != "" && verification_blocked == "blocked") {
            /*if (eventStr == "") {
                eventStr = "event147";
            } else {
                eventStr = eventStr + ",event147";
            }*/
            content._experience.analytics.event101to200.event147 = content._experience.analytics.event101to200.event147 || {};
            content._experience.analytics.event101to200.event147.value = 1;
        }

        if (verification_failed != "" && verification_failed == "true") {
            /*if (eventStr == "") {
                eventStr = "event148";
            } else {
                eventStr = eventStr + ",event148";
            }*/
            content._experience.analytics.event101to200.event148 = content._experience.analytics.event101to200.event148 || {};
            content._experience.analytics.event101to200.event148.value = 1;
        }
        if (verification_success != "" && verification_success == "true") {
            if (_satellite.cookie.get("EUID_VERIFY_LETTER_SENT") != "undefined" && _satellite.cookie.get("EUID_VERIFY_LETTER_SENT") == "true") {
                _satellite.cookie.remove("EUID_VERIFY_LETTER_SENT");
                /*if (eventStr == "") {
                    eventStr = "event149";
                } else {
                    eventStr = eventStr + ",event149";
                }*/
                content._experience.analytics.event101to200.event149 = content._experience.analytics.event101to200.event149 || {};
                content._experience.analytics.event101to200.event149.value = 1;
            }
        }

        if (id_verification_success != "" && id_verification_success == "true") {
            /*if (eventStr == "") {
                eventStr = "event146";
            } else {
                eventStr = eventStr + ",event146";
            }*/
            content._experience.analytics.event101to200.event146 = content._experience.analytics.event101to200.event146 || {};
            content._experience.analytics.event101to200.event146.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("forgot-password:securityquestion") != -1) {
            //eventStr = "event86";
            content._experience.analytics.event1to100.event86 = content._experience.analytics.event1to100.event86 || {};
            content._experience.analytics.event1to100.event86.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("fraudprotection") != -1) {
            /*if (eventStr == "") {
                eventStr = "event114,event115";
            } else {
                eventStr = eventStr + ",event114,event115";
            }*/
            content._experience.analytics.event101to200.event114 = content._experience.analytics.event101to200.event114 || {};
            content._experience.analytics.event101to200.event114.value = 1;
            content._experience.analytics.event101to200.event115 = content._experience.analytics.event101to200.event115 || {};
            content._experience.analytics.event101to200.event115.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("progressive-register") != -1) {
            //eventStr = "event237";
            content._experience.analytics.event201to300.event237 = content._experience.analytics.event201to300.event237 || {};
            content._experience.analytics.event201to300.event237.value = 1;
        }

        if (pagenametmp != "" && pagenametmp.indexOf("progressive-register:contact") != -1) {
            //eventStr = "event238";
            content._experience.analytics.event201to300.event238 = content._experience.analytics.event201to300.event238 || {};
            content._experience.analytics.event201to300.event238.value = 1;
        }

        if (typeof analyticsObject.sc_error != "undefined" && analyticsObject.sc_error != "") {
            /*if (eventStr != "") {
                eventStr = eventStr + ",event31";
            } else {
                eventStr = "event31";
            }*/
            content._experience.analytics.event1to100.event31 = content._experience.analytics.event1to100.event31 || {};
            content._experience.analytics.event1to100.event31.value = 1;
        }
    }

    if (_satellite.cookie.get("RESET_PASSWORD_COOKIE") == "true") {
        /*if (eventStr == "") {
            eventStr = "event88";
        } else {
            eventStr = eventStr + ",event88";
        }*/
        content._experience.analytics.event1to100.event88 = content._experience.analytics.event1to100.event88 || {};
        content._experience.analytics.event1to100.event88.value = 1;
    }
    /* --------------- Fill product & create event string end-------------------- */

    //NCA Event
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
            //if (eventStr == "") eventStr = "event282:" + accountid;
            //else eventStr = eventStr + ", event282:" + accountid;
            content._experience.analytics.event201to300.event282 = content._experience.analytics.event201to300.event282 || {};
            content._experience.analytics.event201to300.event282.value = 1;
            content._experience.analytics.event201to300.event282.id = accountid;
        }
    }

    //Page Not Found
    if (window.document.title.match("404")) {
        /*if (eventStr == "") eventStr = "event404";
        else eventStr = eventStr + ",event404";*/
        content._experience.analytics.event401to500.event404 = content._experience.analytics.event401to500.event404 || {};
        content._experience.analytics.event401to500.event404.value = 1;
    }

    /* --------------- Fire events start-------------------- */

    //if (eventStr != "" && pagenametmp != "") {
    //	s.events = s.apl(s.events, eventStr, "", 2);
    //}
    /* --------------- Fire events end-------------------- */

    if (_satellite.getVar("WURegisterSuccessJSObject")) {
        _satellite.cookie.set("register_success_event", "true");
    }

    deleteCookieRegLogin();

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


    //Gpay integration condn added to handle send pageview beacon rule error ~pk~
    if (sessionStorage.getItem("cookiestore")) var partnerName = JSON.parse(sessionStorage.getItem("cookiestore")).partnerName;
    if (_satellite.getVar("WUUrlJSObject").indexOf("googlespot") != -1 || (typeof partnerName != "undefined" && partnerName == "googlespot")) {
        console.log("Inside gPay condn in CommonPageNameRule");
        //s.linkTrackVars ="eVar1,eVar2,eVar3,eVar4,eVar7,eVar9,eVar20,eVar34,eVar45,eVar61,eVar65,eVar68,eVar75,eVar76,prop1,prop2,prop3,prop4,prop13,prop20,events";
        content._experience.analytics.customDimensions.eVars.eVar34 = "gpay-commonpagename-triggered-test";
        //s.t(); //making direct call for gpay
        content._experience.analytics.customDimensions.eVars.eVar34 = "";
    }

    /*Piyush added new events for Peru Currency exchange site 11/11/2024*/


    if (analyticsObject.sc_page_name && analyticsObject.sc_page_name == "pe:es:website-ce:perform-operation:start-subscription") {
        //s.events = s.apl(s.events, "event356");
        //s.linkTrackVars = s.apl(s.linkTrackVars, "event356");
        //s.linkTrackEvents = s.apl(s.linkTrackEvents, "event356");
        content._experience.analytics.event301to400.event356 = content._experience.analytics.event301to400.event356 || {};
        content._experience.analytics.event301to400.event356.value = 1;
    }


    if (analyticsObject.sc_loginsuccess == "true") {
        //s.events = s.apl(s.events, "event2");
        //s.linkTrackVars = s.apl(s.linkTrackVars, "event2");
        //s.linkTrackEvents = s.apl(s.linkTrackEvents, "event2");
        content._experience.analytics.event1to100.event2 = content._experience.analytics.event1to100.event2 || {};
        content._experience.analytics.event1to100.event2.value = 1;
    }


    if (analyticsObject.sc_accountactivation && analyticsObject.sc_accountactivation == "true") {
        //s.events = s.apl(s.events, "event32");
        //s.linkTrackVars = s.apl(s.linkTrackVars, "event32");
        //s.linkTrackEvents = s.apl(s.linkTrackEvents, "event32");
        content._experience.analytics.event1to100.event32 = content._experience.analytics.event1to100.event32 || {};
        content._experience.analytics.event1to100.event32.value = 1;
    }

    if (analyticsObject.sc_fpstep1 && analyticsObject.sc_fpstep1 == "true") {
        //s.events = s.apl(s.events, "event82");
        //s.linkTrackVars = s.apl(s.linkTrackVars, "event82");
        //s.linkTrackEvents = s.apl(s.linkTrackEvents, "event82");
        content._experience.analytics.event1to100.event82 = content._experience.analytics.event1to100.event82 || {};
        content._experience.analytics.event1to100.event82.value = 1;
    }

    if (analyticsObject.sc_fpstep4 && analyticsObject.sc_fpstep4 == "true") {
        //s.events = s.apl(s.events, "event87");
        //s.linkTrackVars = s.apl(s.linkTrackVars, "event87");
        //s.linkTrackEvents = s.apl(s.linkTrackEvents, "event87");
        content._experience.analytics.event1to100.event87 = content._experience.analytics.event1to100.event87 || {};
        content._experience.analytics.event1to100.event87.value = 1;
    }

    if (_satellite.cookie.get("aepPrevPagename") != "undefined" && _satellite.cookie.get("aepPrevPagename") != "%WUPageNameJSObject%" && _satellite.cookie.get("aepPrevPagename") != undefined) 
    {
            content._experience.analytics.customDimensions.props.prop8  = _satellite.cookie.get("aepPrevPagename") ;
    }

    if (_satellite.cookie.get("aepPrevButton") != "undefined" && _satellite.cookie.get("aepPrevButton") != "%WUDataLinkJSObject%" && _satellite.cookie.get("aepPrevButton") != undefined) 
    {
        content._experience.analytics.customDimensions.props.prop9  = _satellite.cookie.get("aepPrevButton") ;
        content._experience.analytics.customDimensions.props.prop10  = _satellite.getVar("AEP-WUPreviousPageName")+"|"+_satellite.cookie.get("aepPrevButton") ;
    }

    // below condition to chcek page load of track transfer
    // Add the page name for track-transfer:moneytransfer-tab:status to track-transfer:sender_tab:status or track-transfer:receiver_tab:status
    if (
        pagenametmp != "" &&
        (pagenametmp.indexOf("track-transfer:moneytransfer-tab:status") != -1 ||
            pagenametmp.indexOf("track-transfer:sender_tab:status") != -1 ||
            pagenametmp.indexOf("track-transfer:receiver_tab:status") != -1 ||
            pagenametmp.indexOf("track-transfer:sender-tab:status") != -1 ||
            pagenametmp.indexOf("track-transfer:receiver-tab:status") != -1 ||
            pagenametmp.indexOf("track-transfer-success") != -1)
    ) {
        content._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar("WUCancelStatusJSObject");
        if (_satellite.getVar("WULinkDisplayJSObject") != "" && _satellite.getVar("WULinkDisplayJSObject") != "null") {
            //s.list1 = _satellite.getVar("WULinkDisplayJSObject");
            //eventStr = "event206";
            content._experience.analytics.event201to300.event206 = content._experience.analytics.event201to300.event206 || {};
            content._experience.analytics.event201to300.event206.value = 1;
        }

        if (_satellite.getVar("WUMsgIdJSObject") != "" && _satellite.getVar("WUMsgIdJSObject") != "null") {
            content._experience.analytics.customDimensions.props.prop13 = "msg:" + _satellite.getVar("WUMsgIdJSObject");
            content._experience.analytics.customDimensions.props.prop14 = _satellite.getVar("WUPageNameJSObject") + "|" + s.prop13;
        }

        content._experience.analytics.event1to100.event29 = content._experience.analytics.event1to100.event29 || {};
        content._experience.analytics.event1to100.event29.value = 1;
    }

 
content._experience.analytics.customDimensions.props.prop22  = _satellite.cookie.get("s_NewRepeateVar") ;
content._experience.analytics.customDimensions.eVars.eVar54  = _satellite.cookie.get("s_NewRepeateVar") ;
_satellite.getVar("AEP-WUPreviousPageName");
        //content._experience.analytics.customDimensions.props.prop9  = "";


    /* 
        Object.assign(analyticsObject, {sc_upwardli_creditbuilderenabled: "true"}); //Line for testing new requirement - Disabling Rokt when Upwardli banner is been shown.
        concole.log('Disabling Rokt Banner');
    */

    //_satellite.track("thirdpartytagcondtncheck");


//}