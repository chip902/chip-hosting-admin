// Modify content as necessary. There is no need to wrap the code in a function or return a value.

// For example if you are updating an XDM Variable Data Element, you can set the page name by writing:

// content.web = content.web || {};
// content.web.webPageDetails = content.web.webPageDetails || {};
// content.web.webPageDetails.name = "Home";

// If you are updating a Data Variable Data Element you can update an Analytics page name by writing:

// content.__adobe = content.__adobe || { };
// content.__adobe.analytics = content.__adobe.analytics || { };
// content.__adobe.analytics.eVar5 = "Test";


//Track link click
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

var linkname = _satellite.getVar('AEPWUDataLinkJSObject');
var pagename = analyticsObject.sc_page_name;
var eventPageName = _satellite.getVar('WUPagenameForEventObject');

if (linkname == "btn-login" && pagename.indexOf('website:login') > -1) {
    content._experience.analytics.event1to100.event1 = content._experience.analytics.event1to100.event1 || {};
    content._experience.analytics.event1to100.event1.value = 1;
    content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
    content._experience.analytics.event101to200.event183.value = 1;
}

if (linkname == "btn-create-profile" && pagename.indexOf('website:register-email') > -1) {
    content._experience.analytics.event1to100.event3 = content._experience.analytics.event1to100.event3 || {};
    content._experience.analytics.event1to100.event3.value = 1;
    content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
    content._experience.analytics.event101to200.event183.value = 1;
}

if (linkname) {
    if (linkname == 'mpname-checkbox') {
        if ((this.checked) == true) {
            _satellite.setVar('WUDataLinkJSObject', linkname);
        }
    } else {
        _satellite.setVar('WUDataLinkJSObject', linkname);
    }
    // code changes done by Rishabh for my-wu tracking SC-5431
    if (linkname) {
        if (linkname == 'button-mywu-signup') {
            _satellite.setVar('WUDataLinkJSObject', linkname);
        } else {
            _satellite.setVar('WUDataLinkJSObject', linkname);
        }
    }
    if (linkname) {
        if (linkname == 'button-mywu-rewards') {
            _satellite.setVar('WUDataLinkJSObject', linkname);
        } else {
            _satellite.setVar('WUDataLinkJSObject', linkname);
        }
    }
    //end
}

if (_satellite.getVar('WUDataLinkJSObject')) {

    content._experience.analytics.customDimensions.eVars.eVar1 = _satellite.getVar('WUCountryJSObject');
    content._experience.analytics.customDimensions.eVars.eVar2 = _satellite.getVar('WULangaugeJSObject');
    content._experience.analytics.customDimensions.eVars.eVar3 = _satellite.getVar('WUPlatformJSObject');
    content._experience.analytics.customDimensions.eVars.eVar4 = _satellite.getVar('WUGeoJSObject');
    content._experience.analytics.customDimensions.eVars.eVar7 = _satellite.getVar('WUSessionIdJSObject');
    content._experience.analytics.customDimensions.eVars.eVar9 = _satellite.getVar('WUAccountJSObject');
    content._experience.analytics.customDimensions.eVars.eVar20 = _satellite.getVar('WUMtcnJSObject');
    content._experience.analytics.customDimensions.eVars.eVar45 = _satellite.getVar('WUPageNameJSObject');
    content._experience.analytics.customDimensions.eVars.eVar61 = _satellite.getVar('WUDataLinkJSObject');

    content._experience.analytics.customDimensions.props.prop1 = _satellite.getVar('WUCountryJSObject');
    content._experience.analytics.customDimensions.props.prop2 = _satellite.getVar('WULangaugeJSObject');
    content._experience.analytics.customDimensions.props.prop3 = _satellite.getVar('WUPlatformJSObject');
    content._experience.analytics.customDimensions.props.prop4 = _satellite.getVar('WUGeoJSObject');
    content._experience.analytics.customDimensions.props.prop13 = _satellite.getVar('WUErrorJSObject');
    content._experience.analytics.customDimensions.props.prop20 = _satellite.getVar('WUPageNameJSObject');



    switch (_satellite.getVar('WUDataLinkJSObject')) {

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

            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;

        case 'link-i-accept':
        case 'link-i-do-not-accept':
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            if (typeof analyticsObject.sc_section != 'undefined' && typeof analyticsObject.sc_sub_section != 'undefined' && analyticsObject.sc_section == 'register-rp' && analyticsObject.sc_sub_section == 'tnc-popup') {
                analyticsObject.sc_sub_section = "";
            }
            break;

        //UDM

        case 'link-showdetails':
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            content._experience.analytics.event1to100.event3 = content._experience.analytics.event1to100.event3 || {};
            content._experience.analytics.event1to100.event3.value = 1;

            break;

        case 'link-hidedetails':
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            content._experience.analytics.event1to100.event3 = content._experience.analytics.event1to100.event3 || {};
            content._experience.analytics.event1to100.event3.value = 1;
            break;

        case 'update-delivery-method':
        case 'menu-update-delivery-method':

            content._experience.analytics.event201to300.event251 = content._experience.analytics.event201to300.event251 || {};
            content._experience.analytics.event201to300.event251.value = 1;
            break;

        case 'btn-udm-sd-start-cont':
            content._experience.analytics.event201to300.event268 = content._experience.analytics.event201to300.event268 || {};
            content._experience.analytics.event201to300.event268.value = 1;
            break;

        case 'btn-udm-sd-review-cont':
            content._experience.analytics.event201to300.event269 = content._experience.analytics.event201to300.event269 || {};
            content._experience.analytics.event201to300.event269.value = 1;
            break;

        case 'btn-sd-review-edit':

            content._experience.analytics.event201to300.event274 = content._experience.analytics.event201to300.event274 || {};
            content._experience.analytics.event201to300.event274.value = 1;
            break;

        case 'btn-udm-ra-cont':
            content._experience.analytics.event201to300.event270 = content._experience.analytics.event201to300.event270 || {};
            content._experience.analytics.event201to300.event270.value = 1;
            break;

        case 'btn-udm-ra-start-cont':

            content._experience.analytics.event201to300.event271 = content._experience.analytics.event201to300.event271 || {};
            content._experience.analytics.event201to300.event271.value = 1;
            break;

        case 'btn-ra-review-confirm':

            content._experience.analytics.event201to300.event272 = content._experience.analytics.event201to300.event272 || {};
            content._experience.analytics.event201to300.event272.value = 1;
            break;

        case 'btn-ra-review-edit':

            content._experience.analytics.event201to300.event273 = content._experience.analytics.event201to300.event273 || {};
            content._experience.analytics.event201to300.event273.value = 1;
            break;

        //UDM END

        case 'btn-pr-register':
            content._experience.analytics.event1to100.event3 = content._experience.analytics.event1to100.event3 || {};
            content._experience.analytics.event1to100.event3.value = 1;
            break;

        case 'button-smo-continue':
            content._experience.analytics.event101to200.event134 = content._experience.analytics.event101to200.event134 || {};
            content._experience.analytics.event101to200.event134.value = 1;
            // TADTECH-370 Hook back into 3rd party Tag rule for onClick of SMO Continue
            _satellite.track('3rd_Party_Tag_Global_FL_Send_Money_Start_Currency_Tool_Events');
            break;

        case 'button-Enroll':
            content._experience.analytics.customDimensions.eVars.eVar61 = "mywuoptedin-button-Enroll";
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            content._experience.analytics.event1to100.event40 = content._experience.analytics.event1to100.event40 || {};
            content._experience.analytics.event1to100.event40.value = 1;
            break;


        case 'cont-add-receiver':

            content._experience.analytics.event201to300.event240 = content._experience.analytics.event201to300.event240 || {};
            content._experience.analytics.event201to300.event240.value = 1;
            break;

        case 'cont-update-receiver':
            content._experience.analytics.event201to300.event241 = content._experience.analytics.event201to300.event241 || {};
            content._experience.analytics.event201to300.event241.value = 1;
            break;

        case 'canceltxn-reason-cancel':
            content._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar('WUCancelStatusJSObject');
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;

        case 'return-to-partner':
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;

        case 'canceltxn-reason-cont':
            var reasoncode = _satellite.getVar('WUReasonCategoryJSObject');
            var hiphenloc = reasoncode.indexOf("-");
            content._experience.analytics.customDimensions.eVars.eVar68 = reasoncode.substring(0, hiphenloc);
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;


        case 'canceltxn-history':
        case 'link-cancel-transfer':
        case 'canceltxn-tt':
            content._experience.analytics.customDimensions.eVars.eVar65 = "canceltxn-initiated";
            content._experience.analytics.event101to200.event196 = content._experience.analytics.event101to200.event196 || {};
            content._experience.analytics.event101to200.event196.value = 1;
            content._experience.analytics.event101to200.event197 = content._experience.analytics.event101to200.event197 || {};
            content._experience.analytics.event101to200.event197.value = 1;
            break;


        case 'canceltxn-reason':
            content._experience.analytics.customDimensions.eVars.eVar68 = _satellite.getVar('WUReasonCategoryJSObject');
            content._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar('WUCancelStatusJSObject');
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            content._experience.analytics.event201to300.event233 = content._experience.analytics.event201to300.event233 || {};
            content._experience.analytics.event201to300.event233.value = 1;

            break;



        case 'canceltxn-submit-cr':
            content._experience.analytics.customDimensions.eVars.eVar65 = _satellite.getVar('WUCancelStatusJSObject');
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;

        case 'retailct-namechange':
            content._experience.analytics.customDimensions.eVars.eVar65 = 'canceltxn-namechange';
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;

        case 'link-edit-receiver-name':
            content._experience.analytics.event201to300.event211 = content._experience.analytics.event201to300.event211 || {};
            content._experience.analytics.event201to300.event211.value = 1;
            break;

        case 'namechange-submit':
            content._experience.analytics.event201to300.event212 = content._experience.analytics.event201to300.event212 || {};
            content._experience.analytics.event201to300.event212.value = 1;
            break;

        case 'namechange-decline-ct':

            content._experience.analytics.customDimensions.eVars.eVar65 = "canceltxn-initiated";
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            content._experience.analytics.event101to200.event197 = content._experience.analytics.event101to200.event197 || {};
            content._experience.analytics.event101to200.event197.value = 1;
            content._experience.analytics.event101to200.event196 = content._experience.analytics.event101to200.event196 || {};
            content._experience.analytics.event101to200.event196.value = 1;

            break;

        case 'canceltxn-cancel':
            content._experience.analytics.customDimensions.eVars.eVar65 = 'canceltxn-cancel';
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;


        case 'button-lookup':
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;

        case 'yes-cancel-lookup':
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;

        case 'button-doc-submit':
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;

        case 'yes-cancel-docupload':
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;


        case 'mywu-tat-cta':
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;

        case 'sendagain_continue':

            content._experience.analytics.event101to200.event181 = content._experience.analytics.event101to200.event181 || {};
            content._experience.analytics.event101to200.event181.value = 1;
            content._experience.analytics.event101to200.event182 = content._experience.analytics.event101to200.event182 || {};
            content._experience.analytics.event101to200.event182.value = 1;
            break;

        case 'download-app':
            content._experience.analytics.event1to100.event68 = content._experience.analytics.event1to100.event68 || {};
            content._experience.analytics.event1to100.event68.value = 1;
            break;

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
            content._experience.analytics.event201to300.event201 = content._experience.analytics.event201to300.event201 || {};
            content._experience.analytics.event201to300.event201.value = 1;
            content._experience.analytics.event201to300.event202 = content._experience.analytics.event201to300.event202 || {};
            content._experience.analytics.event201to300.event202.value = 1;
            break;

        case 'continue_details':
        case 'continue_details_ta':
            content._experience.analytics.event101to200.event144 = content._experience.analytics.event101to200.event144 || {};
            content._experience.analytics.event101to200.event144.value = 1;
            content._experience.analytics.event101to200.event145 = content._experience.analytics.event101to200.event145 || {};
            content._experience.analytics.event101to200.event145.value = 1;
            break;

        case 'payment-continue':
            content._experience.analytics.event201to300.event222 = content._experience.analytics.event201to300.event222 || {};
            content._experience.analytics.event201to300.event222.value = 1;
            content._experience.analytics.event201to300.event223 = content._experience.analytics.event201to300.event223 || {};
            content._experience.analytics.event201to300.event223.value = 1;
            break;

        case 'doddfrankedit':
            content._experience.analytics.event201to300.event204 = content._experience.analytics.event201to300.event204 || {};
            content._experience.analytics.event201to300.event204.value = 1;
            break;

        case 'button-video':
        case 'button-geniii':
        case 'button-start-video':
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            break;
        case 'btn-info-next':
            content._experience.analytics.event201to300.event283 = content._experience.analytics.event201to300.event283 || {};
            content._experience.analytics.event201to300.event283.value = 1;
            // This below code is to get the unique reference number entered by user on the DUT KYC Info page
            var uniRefNum = document.getElementById('postalCode').value;
            content._experience.analytics.customDimensions.eVars.eVar75 = uniRefNum;
            // set UniRefNum cookie for evar75
            _satellite.cookie.set('uniRefNumCookie', uniRefNum);
            break;
        case 'btn-upload-submit':
            content._experience.analytics.event201to300.event284 = content._experience.analytics.event201to300.event284 || {};
            content._experience.analytics.event201to300.event284.value = 1;
            // This below code is to get the Veification document type selected by user on the DUT KYC upload page
            var kycIdSelected = document.getElementById("fieldid0");
            content._experience.analytics.customDimensions.eVars.eVar76 = kycIdSelected.options[kycIdSelected.selectedIndex].text;
            break;

        case 'btn-login':
            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            content._experience.analytics.event1to100.event1 = content._experience.analytics.event1to100.event1 || {};
            content._experience.analytics.event101to100.event1.value = 1;

            break;

        case 'btn-register-user':

            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            content._experience.analytics.event1to100.event3 = content._experience.analytics.event1to100.event3 || {};
            content._experience.analytics.event1to100.event3.value = 1;

            break;

        case 'button-login':
            var regex = /^[0-9]+$/;
            var isValid = regex.test($("#txtEmailAddr").val());
            if (!isValid) {
                content._experience.analytics.customDimensions.eVars.eVar74 = "email";
            }
            else {
                content._experience.analytics.customDimensions.eVars.eVar74 = "phone number";
            }

            content._experience.analytics.event1to100.event1 = content._experience.analytics.event1to100.event1 || {};
            content._experience.analytics.event1to100.event1.value = 1;
            break;

        case 'button-track-transfer':

            content._experience.analytics.event101to200.event183 = content._experience.analytics.event101to200.event183 || {};
            content._experience.analytics.event101to200.event183.value = 1;
            content._experience.analytics.event1to100.event28 = content._experience.analytics.event1to100.event28 || {};
            content._experience.analytics.event1to100.event28.value = 1;

            break;

        case 'button-bpstart-continue':
            if (eventPageName != '' && eventPageName != 'null') {
                if (eventPageName == 'bill-pay:start') {

                    s.linkTrackEvents = "event239";
                    s.events = "event239";
                    content._experience.analytics.event201to300.event239 = content._experience.analytics.event101to200.event239 || {};
                    content._experience.analytics.event201to300.event239.value = 1;
                }
                if (eventPageName == 'send-inmate:start') {

                    content._experience.analytics.event201to300.event242 = content._experience.analytics.event101to200.event242 || {};
                    content._experience.analytics.event201to300.event242.value = 1;
                }
            }

        case 'button-review-continue':
        case 'button-continue':
            if (eventPageName != '' && eventPageName != 'null') {
                if (eventPageName == 'send-money:review') {
                    content._experience.analytics.event1to100.event10 = content._experience.analytics.event1to100.event10 || {};
                    content._experience.analytics.event1to100.event10.value = 1;
                    content._experience.analytics.event1to100.event15 = content._experience.analytics.event1to100.event15 || {};
                    content._experience.analytics.event1to100.event15.value = 1;
                }
                else if (eventPageName == 'bill-pay:review') {
                    content._experience.analytics.event101to200.event125 = content._experience.analytics.event101to200.event125 || {};
                    content._experience.analytics.event101to200.event125.value = 1;
                    content._experience.analytics.event101to200.event130 = content._experience.analytics.event101to200.event130 || {};
                    content._experience.analytics.event101to200.event130.value = 1;
                }
                else if (eventPageName == 'send-inmate:review' || eventPageName == 'send-inmate:inmatereview') {
                    content._experience.analytics.event1to100.event22 = content._experience.analytics.event1to100.event22 || {};
                    content._experience.analytics.event1to100.event22.value = 1;
                    content._experience.analytics.event1to100.event27 = content._experience.analytics.event1to100.event27 || {};
                    content._experience.analytics.event1to100.event27.value = 1;
                }
            }
            break;


    }

}