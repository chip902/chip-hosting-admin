//~~tv:19063.am282.20210304
//~~tc: fix to allow mappings for linkTrackVars and linkTrackEvents to work properly
//~~tc: update to allow toggling of timestamp for mobile device tracking

var ##UTVARconfig_sobject##=s_gi("##UTVARconfig_reportsuite##")
##UTVARconfig_sobject##.account="##UTVARconfig_reportsuite##";

/************************** CONFIG SECTION **************************/
##UTVARconfig_sobject##.trackDownloadLinks=##UTVARconfig_tracklinks##;
##UTVARconfig_sobject##.trackExternalLinks=##UTVARconfig_tracklinks##;
##UTVARconfig_sobject##.trackInlineStats=true;
##UTVARconfig_sobject##.linkInternalFilters="##UTVARconfig_internalfilters##";
##UTVARconfig_sobject##.linkLeaveQueryString=false;
##UTVARconfig_sobject##.linkTrackVars="None";
##UTVARconfig_sobject##.linkTrackEvents="None";
##UTVARconfig_sobject##.usePlugins=false;
##UTVARconfig_sobject##.currencyCode="USD"; // override default with E-Commerce Extension
##UTVARconfig_sobject##.visitorNamespace = "##UTVARconfig_namespace##";
##UTVARconfig_sobject##.trackingServer="##UTVARconfig_server##";
##UTVARconfig_sobject##.trackingServerSecure="##UTVARconfig_serversecure##";
##UTVARconfig_sobject##.charSet = "UTF-8";

##UTVARconfig_sobject##.expectSupplementalData=true;
##UTVARconfig_sobject##.debugTracking=utag.cfg.utagdb;

/*
 ============== DO NOT ALTER ANYTHING BELOW THIS LINE ! ===============

AppMeasurement for JavaScript version: 2.8.2
Copyright 1996-2016 Adobe, Inc. All Rights Reserved
More info available at http://www.adobe.com/marketing-cloud.html
*/
function AppMeasurement(r){var a=this;a.version="2.8.2";var k=window;k.s_c_in||(k.s_c_il=[],k.s_c_in=0);a._il=k.s_c_il;a._in=k.s_c_in;a._il[a._in]=a;k.s_c_in++;a._c="s_c";var p=k.AppMeasurement.Xb;p||(p=null);var n=k,m,s;try{for(m=n.parent,s=n.location;m&&m.location&&s&&""+m.location!=""+s&&n.location&&""+m.location!=""+n.location&&m.location.host==s.host;)n=m,m=n.parent}catch(u){}a.F=function(a){try{console.log(a)}catch(b){}};a.Oa=function(a){return""+parseInt(a)==""+a};a.replace=function(a,b,d){return!a||
0>a.indexOf(b)?a:a.split(b).join(d)};a.escape=function(c){var b,d;if(!c)return c;c=encodeURIComponent(c);for(b=0;7>b;b++)d="+~!*()'".substring(b,b+1),0<=c.indexOf(d)&&(c=a.replace(c,d,"%"+d.charCodeAt(0).toString(16).toUpperCase()));return c};a.unescape=function(c){if(!c)return c;c=0<=c.indexOf("+")?a.replace(c,"+"," "):c;try{return decodeURIComponent(c)}catch(b){}return unescape(c)};a.Fb=function(){var c=k.location.hostname,b=a.fpCookieDomainPeriods,d;b||(b=a.cookieDomainPeriods);if(c&&!a.Ga&&!/^[0-9.]+$/.test(c)&&
(b=b?parseInt(b):2,b=2<b?b:2,d=c.lastIndexOf("."),0<=d)){for(;0<=d&&1<b;)d=c.lastIndexOf(".",d-1),b--;a.Ga=0<d?c.substring(d):c}return a.Ga};a.c_r=a.cookieRead=function(c){c=a.escape(c);var b=" "+a.d.cookie,d=b.indexOf(" "+c+"="),f=0>d?d:b.indexOf(";",d);c=0>d?"":a.unescape(b.substring(d+2+c.length,0>f?b.length:f));return"[[B]]"!=c?c:""};a.c_w=a.cookieWrite=function(c,b,d){var f=a.Fb(),e=a.cookieLifetime,g;b=""+b;e=e?(""+e).toUpperCase():"";d&&"SESSION"!=e&&"NONE"!=e&&((g=""!=b?parseInt(e?e:0):-60)?
(d=new Date,d.setTime(d.getTime()+1E3*g)):1==d&&(d=new Date,g=d.getYear(),d.setYear(g+5+(1900>g?1900:0))));return c&&"NONE"!=e?(a.d.cookie=a.escape(c)+"="+a.escape(""!=b?b:"[[B]]")+"; path=/;"+(d&&"SESSION"!=e?" expires="+d.toUTCString()+";":"")+(f?" domain="+f+";":""),a.cookieRead(c)==b):0};a.Cb=function(){var c=a.Util.getIeVersion();"number"===typeof c&&10>c&&(a.unsupportedBrowser=!0,a.rb(a,function(){}))};a.rb=function(a,b){for(var d in a)a.hasOwnProperty(d)&&"function"===typeof a[d]&&(a[d]=b)};
a.L=[];a.ja=function(c,b,d){if(a.Ha)return 0;a.maxDelay||(a.maxDelay=250);var f=0,e=(new Date).getTime()+a.maxDelay,g=a.d.visibilityState,h=["webkitvisibilitychange","visibilitychange"];g||(g=a.d.webkitVisibilityState);if(g&&"prerender"==g){if(!a.ka)for(a.ka=1,d=0;d<h.length;d++)a.d.addEventListener(h[d],function(){var c=a.d.visibilityState;c||(c=a.d.webkitVisibilityState);"visible"==c&&(a.ka=0,a.delayReady())});f=1;e=0}else d||a.p("_d")&&(f=1);f&&(a.L.push({m:c,a:b,t:e}),a.ka||setTimeout(a.delayReady,
a.maxDelay));return f};a.delayReady=function(){var c=(new Date).getTime(),b=0,d;for(a.p("_d")?b=1:a.za();0<a.L.length;){d=a.L.shift();if(b&&!d.t&&d.t>c){a.L.unshift(d);setTimeout(a.delayReady,parseInt(a.maxDelay/2));break}a.Ha=1;a[d.m].apply(a,d.a);a.Ha=0}};a.setAccount=a.sa=function(c){var b,d;if(!a.ja("setAccount",arguments))if(a.account=c,a.allAccounts)for(b=a.allAccounts.concat(c.split(",")),a.allAccounts=[],b.sort(),d=0;d<b.length;d++)0!=d&&b[d-1]==b[d]||a.allAccounts.push(b[d]);else a.allAccounts=
c.split(",")};a.foreachVar=function(c,b){var d,f,e,g,h="";e=f="";if(a.lightProfileID)d=a.P,(h=a.lightTrackVars)&&(h=","+h+","+a.oa.join(",")+",");else{d=a.g;if(a.pe||a.linkType)h=a.linkTrackVars,f=a.linkTrackEvents,a.pe&&(e=a.pe.substring(0,1).toUpperCase()+a.pe.substring(1),a[e]&&(h=a[e].Vb,f=a[e].Ub));h&&(h=","+h+","+a.H.join(",")+",");f&&h&&(h+=",events,")}b&&(b=","+b+",");for(f=0;f<d.length;f++)e=d[f],(g=a[e])&&(!h||0<=h.indexOf(","+e+","))&&(!b||0<=b.indexOf(","+e+","))&&c(e,g)};a.r=function(c,
b,d,f,e){var g="",h,l,k,q,m=0;"contextData"==c&&(c="c");if(b){for(h in b)if(!(Object.prototype[h]||e&&h.substring(0,e.length)!=e)&&b[h]&&(!d||0<=d.indexOf(","+(f?f+".":"")+h+","))){k=!1;if(m)for(l=0;l<m.length;l++)h.substring(0,m[l].length)==m[l]&&(k=!0);if(!k&&(""==g&&(g+="&"+c+"."),l=b[h],e&&(h=h.substring(e.length)),0<h.length))if(k=h.indexOf("."),0<k)l=h.substring(0,k),k=(e?e:"")+l+".",m||(m=[]),m.push(k),g+=a.r(l,b,d,f,k);else if("boolean"==typeof l&&(l=l?"true":"false"),l){if("retrieveLightData"==
f&&0>e.indexOf(".contextData."))switch(k=h.substring(0,4),q=h.substring(4),h){case "transactionID":h="xact";break;case "channel":h="ch";break;case "campaign":h="v0";break;default:a.Oa(q)&&("prop"==k?h="c"+q:"eVar"==k?h="v"+q:"list"==k?h="l"+q:"hier"==k&&(h="h"+q,l=l.substring(0,255)))}g+="&"+a.escape(h)+"="+a.escape(l)}}""!=g&&(g+="&."+c)}return g};a.usePostbacks=0;a.Ib=function(){var c="",b,d,f,e,g,h,l,k,q="",m="",n=e="";if(a.lightProfileID)b=a.P,(q=a.lightTrackVars)&&(q=","+q+","+a.oa.join(",")+
",");else{b=a.g;if(a.pe||a.linkType)q=a.linkTrackVars,m=a.linkTrackEvents,a.pe&&(e=a.pe.substring(0,1).toUpperCase()+a.pe.substring(1),a[e]&&(q=a[e].Vb,m=a[e].Ub));q&&(q=","+q+","+a.H.join(",")+",");m&&(m=","+m+",",q&&(q+=",events,"));a.events2&&(n+=(""!=n?",":"")+a.events2)}if(a.visitor&&a.visitor.getCustomerIDs){e=p;if(g=a.visitor.getCustomerIDs())for(d in g)Object.prototype[d]||(f=g[d],"object"==typeof f&&(e||(e={}),f.id&&(e[d+".id"]=f.id),f.authState&&(e[d+".as"]=f.authState)));e&&(c+=a.r("cid",
e))}a.AudienceManagement&&a.AudienceManagement.isReady()&&(c+=a.r("d",a.AudienceManagement.getEventCallConfigParams()));for(d=0;d<b.length;d++){e=b[d];g=a[e];f=e.substring(0,4);h=e.substring(4);g||("events"==e&&n?(g=n,n=""):"marketingCloudOrgID"==e&&a.visitor&&(g=a.visitor.marketingCloudOrgID));if(g&&(!q||0<=q.indexOf(","+e+","))){switch(e){case "customerPerspective":e="cp";break;case "marketingCloudOrgID":e="mcorgid";break;case "supplementalDataID":e="sdid";break;case "timestamp":e="ts";break;case "dynamicVariablePrefix":e=
"D";break;case "visitorID":e="vid";break;case "marketingCloudVisitorID":e="mid";break;case "analyticsVisitorID":e="aid";break;case "audienceManagerLocationHint":e="aamlh";break;case "audienceManagerBlob":e="aamb";break;case "authState":e="as";break;case "pageURL":e="g";255<g.length&&(a.pageURLRest=g.substring(255),g=g.substring(0,255));break;case "pageURLRest":e="-g";break;case "referrer":e="r";break;case "vmk":case "visitorMigrationKey":e="vmt";break;case "visitorMigrationServer":e="vmf";a.ssl&&
a.visitorMigrationServerSecure&&(g="");break;case "visitorMigrationServerSecure":e="vmf";!a.ssl&&a.visitorMigrationServer&&(g="");break;case "charSet":e="ce";break;case "visitorNamespace":e="ns";break;case "cookieDomainPeriods":e="cdp";break;case "cookieLifetime":e="cl";break;case "variableProvider":e="vvp";break;case "currencyCode":e="cc";break;case "channel":e="ch";break;case "transactionID":e="xact";break;case "campaign":e="v0";break;case "latitude":e="lat";break;case "longitude":e="lon";break;
case "resolution":e="s";break;case "colorDepth":e="c";break;case "javascriptVersion":e="j";break;case "javaEnabled":e="v";break;case "cookiesEnabled":e="k";break;case "browserWidth":e="bw";break;case "browserHeight":e="bh";break;case "connectionType":e="ct";break;case "homepage":e="hp";break;case "events":n&&(g+=(""!=g?",":"")+n);if(m)for(h=g.split(","),g="",f=0;f<h.length;f++)l=h[f],k=l.indexOf("="),0<=k&&(l=l.substring(0,k)),k=l.indexOf(":"),0<=k&&(l=l.substring(0,k)),0<=m.indexOf(","+l+",")&&(g+=
(g?",":"")+h[f]);break;case "events2":g="";break;case "contextData":c+=a.r("c",a[e],q,e);g="";break;case "lightProfileID":e="mtp";break;case "lightStoreForSeconds":e="mtss";a.lightProfileID||(g="");break;case "lightIncrementBy":e="mti";a.lightProfileID||(g="");break;case "retrieveLightProfiles":e="mtsr";break;case "deleteLightProfiles":e="mtsd";break;case "retrieveLightData":a.retrieveLightProfiles&&(c+=a.r("mts",a[e],q,e));g="";break;default:a.Oa(h)&&("prop"==f?e="c"+h:"eVar"==f?e="v"+h:"list"==
f?e="l"+h:"hier"==f&&(e="h"+h,g=g.substring(0,255)))}g&&(c+="&"+e+"="+("pev"!=e.substring(0,3)?a.escape(g):g))}"pev3"==e&&a.e&&(c+=a.e)}a.na&&(c+="&lrt="+a.na,a.na=null);return c};a.D=function(a){var b=a.tagName;if("undefined"!=""+a.$b||"undefined"!=""+a.Qb&&"HTML"!=(""+a.Qb).toUpperCase())return"";b=b&&b.toUpperCase?b.toUpperCase():"";"SHAPE"==b&&(b="");b&&(("INPUT"==b||"BUTTON"==b)&&a.type&&a.type.toUpperCase?b=a.type.toUpperCase():!b&&a.href&&(b="A"));return b};a.Ka=function(a){var b=k.location,
d=a.href?a.href:"",f,e,g;f=d.indexOf(":");e=d.indexOf("?");g=d.indexOf("/");d&&(0>f||0<=e&&f>e||0<=g&&f>g)&&(e=a.protocol&&1<a.protocol.length?a.protocol:b.protocol?b.protocol:"",f=b.pathname.lastIndexOf("/"),d=(e?e+"//":"")+(a.host?a.host:b.host?b.host:"")+("/"!=d.substring(0,1)?b.pathname.substring(0,0>f?0:f)+"/":"")+d);return d};a.M=function(c){var b=a.D(c),d,f,e="",g=0;return b&&(d=c.protocol,f=c.onclick,!c.href||"A"!=b&&"AREA"!=b||f&&d&&!(0>d.toLowerCase().indexOf("javascript"))?f?(e=a.replace(a.replace(a.replace(a.replace(""+
f,"\r",""),"\n",""),"\t","")," ",""),g=2):"INPUT"==b||"SUBMIT"==b?(c.value?e=c.value:c.innerText?e=c.innerText:c.textContent&&(e=c.textContent),g=3):"IMAGE"==b&&c.src&&(e=c.src):e=a.Ka(c),e)?{id:e.substring(0,100),type:g}:0};a.Yb=function(c){for(var b=a.D(c),d=a.M(c);c&&!d&&"BODY"!=b;)if(c=c.parentElement?c.parentElement:c.parentNode)b=a.D(c),d=a.M(c);d&&"BODY"!=b||(c=0);c&&(b=c.onclick?""+c.onclick:"",0<=b.indexOf(".tl(")||0<=b.indexOf(".trackLink("))&&(c=0);return c};a.Pb=function(){var c,b,d=a.linkObject,
f=a.linkType,e=a.linkURL,g,h;a.pa=1;d||(a.pa=0,d=a.clickObject);if(d){c=a.D(d);for(b=a.M(d);d&&!b&&"BODY"!=c;)if(d=d.parentElement?d.parentElement:d.parentNode)c=a.D(d),b=a.M(d);b&&"BODY"!=c||(d=0);if(d&&!a.linkObject){var l=d.onclick?""+d.onclick:"";if(0<=l.indexOf(".tl(")||0<=l.indexOf(".trackLink("))d=0}}else a.pa=1;!e&&d&&(e=a.Ka(d));e&&!a.linkLeaveQueryString&&(g=e.indexOf("?"),0<=g&&(e=e.substring(0,g)));if(!f&&e){var m=0,q=0,n;if(a.trackDownloadLinks&&a.linkDownloadFileTypes)for(l=e.toLowerCase(),
g=l.indexOf("?"),h=l.indexOf("#"),0<=g?0<=h&&h<g&&(g=h):g=h,0<=g&&(l=l.substring(0,g)),g=a.linkDownloadFileTypes.toLowerCase().split(","),h=0;h<g.length;h++)(n=g[h])&&l.substring(l.length-(n.length+1))=="."+n&&(f="d");if(a.trackExternalLinks&&!f&&(l=e.toLowerCase(),a.Na(l)&&(a.linkInternalFilters||(a.linkInternalFilters=k.location.hostname),g=0,a.linkExternalFilters?(g=a.linkExternalFilters.toLowerCase().split(","),m=1):a.linkInternalFilters&&(g=a.linkInternalFilters.toLowerCase().split(",")),g))){for(h=
0;h<g.length;h++)n=g[h],0<=l.indexOf(n)&&(q=1);q?m&&(f="e"):m||(f="e")}}a.linkObject=d;a.linkURL=e;a.linkType=f;if(a.trackClickMap||a.trackInlineStats)a.e="",d&&(f=a.pageName,e=1,d=d.sourceIndex,f||(f=a.pageURL,e=0),k.s_objectID&&(b.id=k.s_objectID,d=b.type=1),f&&b&&b.id&&c&&(a.e="&pid="+a.escape(f.substring(0,255))+(e?"&pidt="+e:"")+"&oid="+a.escape(b.id.substring(0,100))+(b.type?"&oidt="+b.type:"")+"&ot="+c+(d?"&oi="+d:"")))};a.Jb=function(){var c=a.pa,b=a.linkType,d=a.linkURL,f=a.linkName;b&&(d||
f)&&(b=b.toLowerCase(),"d"!=b&&"e"!=b&&(b="o"),a.pe="lnk_"+b,a.pev1=d?a.escape(d):"",a.pev2=f?a.escape(f):"",c=1);a.abort&&(c=0);if(a.trackClickMap||a.trackInlineStats||a.ActivityMap){var b={},d=0,e=a.cookieRead("s_sq"),g=e?e.split("&"):0,h,l,k,e=0;if(g)for(h=0;h<g.length;h++)l=g[h].split("="),f=a.unescape(l[0]).split(","),l=a.unescape(l[1]),b[l]=f;f=a.account.split(",");h={};for(k in a.contextData)k&&!Object.prototype[k]&&"a.activitymap."==k.substring(0,14)&&(h[k]=a.contextData[k],a.contextData[k]=
"");a.e=a.r("c",h)+(a.e?a.e:"");if(c||a.e){c&&!a.e&&(e=1);for(l in b)if(!Object.prototype[l])for(k=0;k<f.length;k++)for(e&&(g=b[l].join(","),g==a.account&&(a.e+=("&"!=l.charAt(0)?"&":"")+l,b[l]=[],d=1)),h=0;h<b[l].length;h++)g=b[l][h],g==f[k]&&(e&&(a.e+="&u="+a.escape(g)+("&"!=l.charAt(0)?"&":"")+l+"&u=0"),b[l].splice(h,1),d=1);c||(d=1);if(d){e="";h=2;!c&&a.e&&(e=a.escape(f.join(","))+"="+a.escape(a.e),h=1);for(l in b)!Object.prototype[l]&&0<h&&0<b[l].length&&(e+=(e?"&":"")+a.escape(b[l].join(","))+
"="+a.escape(l),h--);a.cookieWrite("s_sq",e)}}}return c};a.Kb=function(){if(!a.Tb){var c=new Date,b=n.location,d,f,e=f=d="",g="",h="",l="1.2",k=a.cookieWrite("s_cc","true",0)?"Y":"N",m="",p="";if(c.setUTCDate&&(l="1.3",(0).toPrecision&&(l="1.5",c=[],c.forEach))){l="1.6";f=0;d={};try{f=new Iterator(d),f.next&&(l="1.7",c.reduce&&(l="1.8",l.trim&&(l="1.8.1",Date.parse&&(l="1.8.2",Object.create&&(l="1.8.5")))))}catch(r){}}d=screen.width+"x"+screen.height;e=navigator.javaEnabled()?"Y":"N";f=screen.pixelDepth?
screen.pixelDepth:screen.colorDepth;g=a.w.innerWidth?a.w.innerWidth:a.d.documentElement.offsetWidth;h=a.w.innerHeight?a.w.innerHeight:a.d.documentElement.offsetHeight;try{a.b.addBehavior("#default#homePage"),m=a.b.Zb(b)?"Y":"N"}catch(s){}try{a.b.addBehavior("#default#clientCaps"),p=a.b.connectionType}catch(t){}a.resolution=d;a.colorDepth=f;a.javascriptVersion=l;a.javaEnabled=e;a.cookiesEnabled=k;a.browserWidth=g;a.browserHeight=h;a.connectionType=p;a.homepage=m;a.Tb=1}};a.Q={};a.loadModule=function(c,
b){var d=a.Q[c];if(!d){d=k["AppMeasurement_Module_"+c]?new k["AppMeasurement_Module_"+c](a):{};a.Q[c]=a[c]=d;d.kb=function(){return d.qb};d.sb=function(b){if(d.qb=b)a[c+"_onLoad"]=b,a.ja(c+"_onLoad",[a,d],1)||b(a,d)};try{Object.defineProperty?Object.defineProperty(d,"onLoad",{get:d.kb,set:d.sb}):d._olc=1}catch(f){d._olc=1}}b&&(a[c+"_onLoad"]=b,a.ja(c+"_onLoad",[a,d],1)||b(a,d))};a.p=function(c){var b,d;for(b in a.Q)if(!Object.prototype[b]&&(d=a.Q[b])&&(d._olc&&d.onLoad&&(d._olc=0,d.onLoad(a,d)),d[c]&&
d[c]()))return 1;return 0};a.Mb=function(){var c=Math.floor(1E13*Math.random()),b=a.visitorSampling,d=a.visitorSamplingGroup,d="s_vsn_"+(a.visitorNamespace?a.visitorNamespace:a.account)+(d?"_"+d:""),f=a.cookieRead(d);if(b){b*=100;f&&(f=parseInt(f));if(!f){if(!a.cookieWrite(d,c))return 0;f=c}if(f%1E4>b)return 0}return 1};a.R=function(c,b){var d,f,e,g,h,l;for(d=0;2>d;d++)for(f=0<d?a.Ca:a.g,e=0;e<f.length;e++)if(g=f[e],(h=c[g])||c["!"+g]){if(!b&&("contextData"==g||"retrieveLightData"==g)&&a[g])for(l in a[g])h[l]||
(h[l]=a[g][l]);a[g]=h}};a.Ya=function(c,b){var d,f,e,g;for(d=0;2>d;d++)for(f=0<d?a.Ca:a.g,e=0;e<f.length;e++)g=f[e],c[g]=a[g],b||c[g]||(c["!"+g]=1)};a.Eb=function(a){var b,d,f,e,g,h=0,l,k="",m="";if(a&&255<a.length&&(b=""+a,d=b.indexOf("?"),0<d&&(l=b.substring(d+1),b=b.substring(0,d),e=b.toLowerCase(),f=0,"http://"==e.substring(0,7)?f+=7:"https://"==e.substring(0,8)&&(f+=8),d=e.indexOf("/",f),0<d&&(e=e.substring(f,d),g=b.substring(d),b=b.substring(0,d),0<=e.indexOf("google")?h=",q,ie,start,search_key,word,kw,cd,":
0<=e.indexOf("yahoo.co")&&(h=",p,ei,"),h&&l)))){if((a=l.split("&"))&&1<a.length){for(f=0;f<a.length;f++)e=a[f],d=e.indexOf("="),0<d&&0<=h.indexOf(","+e.substring(0,d)+",")?k+=(k?"&":"")+e:m+=(m?"&":"")+e;k&&m?l=k+"&"+m:m=""}d=253-(l.length-m.length)-b.length;a=b+(0<d?g.substring(0,d):"")+"?"+l}return a};a.eb=function(c){var b=a.d.visibilityState,d=["webkitvisibilitychange","visibilitychange"];b||(b=a.d.webkitVisibilityState);if(b&&"prerender"==b){if(c)for(b=0;b<d.length;b++)a.d.addEventListener(d[b],
function(){var b=a.d.visibilityState;b||(b=a.d.webkitVisibilityState);"visible"==b&&c()});return!1}return!0};a.fa=!1;a.J=!1;a.ub=function(){a.J=!0;a.j()};a.da=!1;a.V=!1;a.pb=function(c){a.marketingCloudVisitorID=c;a.V=!0;a.j()};a.ga=!1;a.W=!1;a.vb=function(c){a.visitorOptedOut=c;a.W=!0;a.j()};a.aa=!1;a.S=!1;a.$a=function(c){a.analyticsVisitorID=c;a.S=!0;a.j()};a.ca=!1;a.U=!1;a.bb=function(c){a.audienceManagerLocationHint=c;a.U=!0;a.j()};a.ba=!1;a.T=!1;a.ab=function(c){a.audienceManagerBlob=c;a.T=
!0;a.j()};a.cb=function(c){a.maxDelay||(a.maxDelay=250);return a.p("_d")?(c&&setTimeout(function(){c()},a.maxDelay),!1):!0};a.ea=!1;a.I=!1;a.za=function(){a.I=!0;a.j()};a.isReadyToTrack=function(){var c=!0,b=a.visitor,d,f,e;a.fa||a.J||(a.eb(a.ub)?a.J=!0:a.fa=!0);if(a.fa&&!a.J)return!1;b&&b.isAllowed()&&(a.da||a.marketingCloudVisitorID||!b.getMarketingCloudVisitorID||(a.da=!0,a.marketingCloudVisitorID=b.getMarketingCloudVisitorID([a,a.pb]),a.marketingCloudVisitorID&&(a.V=!0)),a.ga||a.visitorOptedOut||
!b.isOptedOut||(a.ga=!0,a.visitorOptedOut=b.isOptedOut([a,a.vb]),a.visitorOptedOut!=p&&(a.W=!0)),a.aa||a.analyticsVisitorID||!b.getAnalyticsVisitorID||(a.aa=!0,a.analyticsVisitorID=b.getAnalyticsVisitorID([a,a.$a]),a.analyticsVisitorID&&(a.S=!0)),a.ca||a.audienceManagerLocationHint||!b.getAudienceManagerLocationHint||(a.ca=!0,a.audienceManagerLocationHint=b.getAudienceManagerLocationHint([a,a.bb]),a.audienceManagerLocationHint&&(a.U=!0)),a.ba||a.audienceManagerBlob||!b.getAudienceManagerBlob||(a.ba=
!0,a.audienceManagerBlob=b.getAudienceManagerBlob([a,a.ab]),a.audienceManagerBlob&&(a.T=!0)),c=a.da&&!a.V&&!a.marketingCloudVisitorID,b=a.aa&&!a.S&&!a.analyticsVisitorID,d=a.ca&&!a.U&&!a.audienceManagerLocationHint,f=a.ba&&!a.T&&!a.audienceManagerBlob,e=a.ga&&!a.W,c=c||b||d||f||e?!1:!0);a.ea||a.I||(a.cb(a.za)?a.I=!0:a.ea=!0);a.ea&&!a.I&&(c=!1);return c};a.o=p;a.u=0;a.callbackWhenReadyToTrack=function(c,b,d){var f;f={};f.zb=c;f.yb=b;f.wb=d;a.o==p&&(a.o=[]);a.o.push(f);0==a.u&&(a.u=setInterval(a.j,
100))};a.j=function(){var c;if(a.isReadyToTrack()&&(a.tb(),a.o!=p))for(;0<a.o.length;)c=a.o.shift(),c.yb.apply(c.zb,c.wb)};a.tb=function(){a.u&&(clearInterval(a.u),a.u=0)};a.mb=function(c){var b,d,f=p,e=p;if(!a.isReadyToTrack()){b=[];if(c!=p)for(d in f={},c)f[d]=c[d];e={};a.Ya(e,!0);b.push(f);b.push(e);a.callbackWhenReadyToTrack(a,a.track,b);return!0}return!1};a.Gb=function(){var c=a.cookieRead("s_fid"),b="",d="",f;f=8;var e=4;if(!c||0>c.indexOf("-")){for(c=0;16>c;c++)f=Math.floor(Math.random()*f),
b+="0123456789ABCDEF".substring(f,f+1),f=Math.floor(Math.random()*e),d+="0123456789ABCDEF".substring(f,f+1),f=e=16;c=b+"-"+d}a.cookieWrite("s_fid",c,1)||(c=0);return c};a.t=a.track=function(c,b){var d,f=new Date,e="s"+Math.floor(f.getTime()/108E5)%10+Math.floor(1E13*Math.random()),g=f.getYear(),g="t="+a.escape(f.getDate()+"/"+f.getMonth()+"/"+(1900>g?g+1900:g)+" "+f.getHours()+":"+f.getMinutes()+":"+f.getSeconds()+" "+f.getDay()+" "+f.getTimezoneOffset());a.visitor&&a.visitor.getAuthState&&(a.authState=
a.visitor.getAuthState());a.p("_s");a.mb(c)||(b&&a.R(b),c&&(d={},a.Ya(d,0),a.R(c)),a.Mb()&&!a.visitorOptedOut&&(a.analyticsVisitorID||a.marketingCloudVisitorID||(a.fid=a.Gb()),a.Pb(),a.usePlugins&&a.doPlugins&&a.doPlugins(a),a.account&&(a.abort||(a.trackOffline&&!a.timestamp&&(a.timestamp=Math.floor(f.getTime()/1E3)),f=k.location,a.pageURL||(a.pageURL=f.href?f.href:f),a.referrer||a.Za||(f=a.Util.getQueryParam("adobe_mc_ref",null,null,!0),a.referrer=f||void 0===f?void 0===f?"":f:n.document.referrer),
a.Za=1,a.referrer=a.Eb(a.referrer),a.p("_g")),a.Jb()&&!a.abort&&(a.visitor&&!a.supplementalDataID&&a.visitor.getSupplementalDataID&&(a.supplementalDataID=a.visitor.getSupplementalDataID("AppMeasurement:"+a._in,a.expectSupplementalData?!1:!0)),a.Kb(),g+=a.Ib(),a.ob(e,g),a.p("_t"),a.referrer=""))),c&&a.R(d,1));a.abort=a.supplementalDataID=a.timestamp=a.pageURLRest=a.linkObject=a.clickObject=a.linkURL=a.linkName=a.linkType=k.s_objectID=a.pe=a.pev1=a.pev2=a.pev3=a.e=a.lightProfileID=0};a.Ba=[];a.registerPreTrackCallback=
function(c){for(var b=[],d=1;d<arguments.length;d++)b.push(arguments[d]);"function"==typeof c?a.Ba.push([c,b]):a.debugTracking&&a.F("DEBUG: Non function type passed to registerPreTrackCallback")};a.hb=function(c){a.xa(a.Ba,c)};a.Aa=[];a.registerPostTrackCallback=function(c){for(var b=[],d=1;d<arguments.length;d++)b.push(arguments[d]);"function"==typeof c?a.Aa.push([c,b]):a.debugTracking&&a.F("DEBUG: Non function type passed to registerPostTrackCallback")};a.gb=function(c){a.xa(a.Aa,c)};a.xa=function(c,
b){if("object"==typeof c)for(var d=0;d<c.length;d++){var f=c[d][0],e=c[d][1];e.unshift(b);if("function"==typeof f)try{f.apply(null,e)}catch(g){a.debugTracking&&a.F(g.message)}}};a.tl=a.trackLink=function(c,b,d,f,e){a.linkObject=c;a.linkType=b;a.linkName=d;e&&(a.l=c,a.A=e);return a.track(f)};a.trackLight=function(c,b,d,f){a.lightProfileID=c;a.lightStoreForSeconds=b;a.lightIncrementBy=d;return a.track(f)};a.clearVars=function(){var c,b;for(c=0;c<a.g.length;c++)if(b=a.g[c],"prop"==b.substring(0,4)||
"eVar"==b.substring(0,4)||"hier"==b.substring(0,4)||"list"==b.substring(0,4)||"channel"==b||"events"==b||"eventList"==b||"products"==b||"productList"==b||"purchaseID"==b||"transactionID"==b||"state"==b||"zip"==b||"campaign"==b)a[b]=void 0};a.tagContainerMarker="";a.ob=function(c,b){var d=a.ib()+"/"+c+"?AQB=1&ndh=1&pf=1&"+(a.ya()?"callback=s_c_il["+a._in+"].doPostbacks&et=1&":"")+b+"&AQE=1";a.hb(d);a.fb(d);a.X()};a.ib=function(){var c=a.jb();return"http"+(a.ssl?"s":"")+"://"+c+"/b/ss/"+a.account+"/"+
(a.mobile?"5.":"")+(a.ya()?"10":"1")+"/JS-"+a.version+(a.Sb?"T":"")+(a.tagContainerMarker?"-"+a.tagContainerMarker:"")};a.ya=function(){return a.AudienceManagement&&a.AudienceManagement.isReady()||0!=a.usePostbacks};a.jb=function(){var c=a.dc,b=a.trackingServer;b?a.trackingServerSecure&&a.ssl&&(b=a.trackingServerSecure):(c=c?(""+c).toLowerCase():"d1","d1"==c?c="112":"d2"==c&&(c="122"),b=a.lb()+"."+c+".2o7.net");return b};a.lb=function(){var c=a.visitorNamespace;c||(c=a.account.split(",")[0],c=c.replace(/[^0-9a-z]/gi,
""));return c};a.Xa=/{(%?)(.*?)(%?)}/;a.Wb=RegExp(a.Xa.source,"g");a.Db=function(c){if("object"==typeof c.dests)for(var b=0;b<c.dests.length;++b){var d=c.dests[b];if("string"==typeof d.c&&"aa."==d.id.substr(0,3))for(var f=d.c.match(a.Wb),e=0;e<f.length;++e){var g=f[e],h=g.match(a.Xa),k="";"%"==h[1]&&"timezone_offset"==h[2]?k=(new Date).getTimezoneOffset():"%"==h[1]&&"timestampz"==h[2]&&(k=a.Hb());d.c=d.c.replace(g,a.escape(k))}}};a.Hb=function(){var c=new Date,b=new Date(6E4*Math.abs(c.getTimezoneOffset()));
return a.k(4,c.getFullYear())+"-"+a.k(2,c.getMonth()+1)+"-"+a.k(2,c.getDate())+"T"+a.k(2,c.getHours())+":"+a.k(2,c.getMinutes())+":"+a.k(2,c.getSeconds())+(0<c.getTimezoneOffset()?"-":"+")+a.k(2,b.getUTCHours())+":"+a.k(2,b.getUTCMinutes())};a.k=function(a,b){return(Array(a+1).join(0)+b).slice(-a)};a.ua={};a.doPostbacks=function(c){if("object"==typeof c)if(a.Db(c),"object"==typeof a.AudienceManagement&&"function"==typeof a.AudienceManagement.isReady&&a.AudienceManagement.isReady()&&"function"==typeof a.AudienceManagement.passData)a.AudienceManagement.passData(c);
else if("object"==typeof c&&"object"==typeof c.dests)for(var b=0;b<c.dests.length;++b){var d=c.dests[b];"object"==typeof d&&"string"==typeof d.c&&"string"==typeof d.id&&"aa."==d.id.substr(0,3)&&(a.ua[d.id]=new Image,a.ua[d.id].alt="",a.ua[d.id].src=d.c)}};a.fb=function(c){a.i||a.Lb();a.i.push(c);a.ma=a.C();a.Va()};a.Lb=function(){a.i=a.Nb();a.i||(a.i=[])};a.Nb=function(){var c,b;if(a.ta()){try{(b=k.localStorage.getItem(a.qa()))&&(c=k.JSON.parse(b))}catch(d){}return c}};a.ta=function(){var c=!0;a.trackOffline&&
a.offlineFilename&&k.localStorage&&k.JSON||(c=!1);return c};a.La=function(){var c=0;a.i&&(c=a.i.length);a.q&&c++;return c};a.X=function(){if(a.q&&(a.B&&a.B.complete&&a.B.G&&a.B.wa(),a.q))return;a.Ma=p;if(a.ra)a.ma>a.O&&a.Ta(a.i),a.va(500);else{var c=a.xb();if(0<c)a.va(c);else if(c=a.Ia())a.q=1,a.Ob(c),a.Rb(c)}};a.va=function(c){a.Ma||(c||(c=0),a.Ma=setTimeout(a.X,c))};a.xb=function(){var c;if(!a.trackOffline||0>=a.offlineThrottleDelay)return 0;c=a.C()-a.Ra;return a.offlineThrottleDelay<c?0:a.offlineThrottleDelay-
c};a.Ia=function(){if(0<a.i.length)return a.i.shift()};a.Ob=function(c){if(a.debugTracking){var b="AppMeasurement Debug: "+c;c=c.split("&");var d;for(d=0;d<c.length;d++)b+="\n\t"+a.unescape(c[d]);a.F(b)}};a.nb=function(){return a.marketingCloudVisitorID||a.analyticsVisitorID};a.Z=!1;var t;try{t=JSON.parse('{"x":"y"}')}catch(w){t=null}t&&"y"==t.x?(a.Z=!0,a.Y=function(a){return JSON.parse(a)}):k.$&&k.$.parseJSON?(a.Y=function(a){return k.$.parseJSON(a)},a.Z=!0):a.Y=function(){return null};a.Rb=function(c){var b,
d,f;a.nb()&&2047<c.length&&("undefined"!=typeof XMLHttpRequest&&(b=new XMLHttpRequest,"withCredentials"in b?d=1:b=0),b||"undefined"==typeof XDomainRequest||(b=new XDomainRequest,d=2),b&&(a.AudienceManagement&&a.AudienceManagement.isReady()||0!=a.usePostbacks)&&(a.Z?b.Da=!0:b=0));!b&&a.Wa&&(c=c.substring(0,2047));!b&&a.d.createElement&&(0!=a.usePostbacks||a.AudienceManagement&&a.AudienceManagement.isReady())&&(b=a.d.createElement("SCRIPT"))&&"async"in b&&((f=(f=a.d.getElementsByTagName("HEAD"))&&f[0]?
f[0]:a.d.body)?(b.type="text/javascript",b.setAttribute("async","async"),d=3):b=0);b||(b=new Image,b.alt="",b.abort||"undefined"===typeof k.InstallTrigger||(b.abort=function(){b.src=p}));b.Sa=Date.now();b.Fa=function(){try{b.G&&(clearTimeout(b.G),b.G=0)}catch(a){}};b.onload=b.wa=function(){b.Sa&&(a.na=Date.now()-b.Sa);a.gb(c);b.Fa();a.Bb();a.ha();a.q=0;a.X();if(b.Da){b.Da=!1;try{a.doPostbacks(a.Y(b.responseText))}catch(d){}}};b.onabort=b.onerror=b.Ja=function(){b.Fa();(a.trackOffline||a.ra)&&a.q&&
a.i.unshift(a.Ab);a.q=0;a.ma>a.O&&a.Ta(a.i);a.ha();a.va(500)};b.onreadystatechange=function(){4==b.readyState&&(200==b.status?b.wa():b.Ja())};a.Ra=a.C();if(1==d||2==d){var e=c.indexOf("?");f=c.substring(0,e);e=c.substring(e+1);e=e.replace(/&callback=[a-zA-Z0-9_.\[\]]+/,"");1==d?(b.open("POST",f,!0),b.send(e)):2==d&&(b.open("POST",f),b.send(e))}else if(b.src=c,3==d){if(a.Pa)try{f.removeChild(a.Pa)}catch(g){}f.firstChild?f.insertBefore(b,f.firstChild):f.appendChild(b);a.Pa=a.B}b.G=setTimeout(function(){b.G&&
(b.complete?b.wa():(a.trackOffline&&b.abort&&b.abort(),b.Ja()))},5E3);a.Ab=c;a.B=k["s_i_"+a.replace(a.account,",","_")]=b;if(a.useForcedLinkTracking&&a.K||a.A)a.forcedLinkTrackingTimeout||(a.forcedLinkTrackingTimeout=250),a.ia=setTimeout(a.ha,a.forcedLinkTrackingTimeout)};a.Bb=function(){if(a.ta()&&!(a.Qa>a.O))try{k.localStorage.removeItem(a.qa()),a.Qa=a.C()}catch(c){}};a.Ta=function(c){if(a.ta()){a.Va();try{k.localStorage.setItem(a.qa(),k.JSON.stringify(c)),a.O=a.C()}catch(b){}}};a.Va=function(){if(a.trackOffline){if(!a.offlineLimit||
0>=a.offlineLimit)a.offlineLimit=10;for(;a.i.length>a.offlineLimit;)a.Ia()}};a.forceOffline=function(){a.ra=!0};a.forceOnline=function(){a.ra=!1};a.qa=function(){return a.offlineFilename+"-"+a.visitorNamespace+a.account};a.C=function(){return(new Date).getTime()};a.Na=function(a){a=a.toLowerCase();return 0!=a.indexOf("#")&&0!=a.indexOf("about:")&&0!=a.indexOf("opera:")&&0!=a.indexOf("javascript:")?!0:!1};a.setTagContainer=function(c){var b,d,f;a.Sb=c;for(b=0;b<a._il.length;b++)if((d=a._il[b])&&"s_l"==
d._c&&d.tagContainerName==c){a.R(d);if(d.lmq)for(b=0;b<d.lmq.length;b++)f=d.lmq[b],a.loadModule(f.n);if(d.ml)for(f in d.ml)if(a[f])for(b in c=a[f],f=d.ml[f],f)!Object.prototype[b]&&("function"!=typeof f[b]||0>(""+f[b]).indexOf("s_c_il"))&&(c[b]=f[b]);if(d.mmq)for(b=0;b<d.mmq.length;b++)f=d.mmq[b],a[f.m]&&(c=a[f.m],c[f.f]&&"function"==typeof c[f.f]&&(f.a?c[f.f].apply(c,f.a):c[f.f].apply(c)));if(d.tq)for(b=0;b<d.tq.length;b++)a.track(d.tq[b]);d.s=a;break}};a.Util={urlEncode:a.escape,urlDecode:a.unescape,
cookieRead:a.cookieRead,cookieWrite:a.cookieWrite,getQueryParam:function(c,b,d,f){var e,g="";b||(b=a.pageURL?a.pageURL:k.location);d=d?d:"&";if(!c||!b)return g;b=""+b;e=b.indexOf("?");if(0>e)return g;b=d+b.substring(e+1)+d;if(!f||!(0<=b.indexOf(d+c+d)||0<=b.indexOf(d+c+"="+d))){e=b.indexOf("#");0<=e&&(b=b.substr(0,e)+d);e=b.indexOf(d+c+"=");if(0>e)return g;b=b.substring(e+d.length+c.length+1);e=b.indexOf(d);0<=e&&(b=b.substring(0,e));0<b.length&&(g=a.unescape(b));return g}},getIeVersion:function(){if(document.documentMode)return document.documentMode;
for(var a=7;4<a;a--){var b=document.createElement("div");b.innerHTML="\x3c!--[if IE "+a+"]><span></span><![endif]--\x3e";if(b.getElementsByTagName("span").length)return a}return null}};a.H="supplementalDataID timestamp dynamicVariablePrefix visitorID marketingCloudVisitorID analyticsVisitorID audienceManagerLocationHint authState fid vmk visitorMigrationKey visitorMigrationServer visitorMigrationServerSecure charSet visitorNamespace cookieDomainPeriods fpCookieDomainPeriods cookieLifetime pageName pageURL customerPerspective referrer contextData currencyCode lightProfileID lightStoreForSeconds lightIncrementBy retrieveLightProfiles deleteLightProfiles retrieveLightData".split(" ");
a.g=a.H.concat("purchaseID variableProvider channel server pageType transactionID campaign state zip events events2 products audienceManagerBlob tnt".split(" "));a.oa="timestamp charSet visitorNamespace cookieDomainPeriods cookieLifetime contextData lightProfileID lightStoreForSeconds lightIncrementBy".split(" ");a.P=a.oa.slice(0);a.Ca="account allAccounts debugTracking visitor visitorOptedOut trackOffline offlineLimit offlineThrottleDelay offlineFilename usePlugins doPlugins configURL visitorSampling visitorSamplingGroup linkObject clickObject linkURL linkName linkType trackDownloadLinks trackExternalLinks trackClickMap trackInlineStats linkLeaveQueryString linkTrackVars linkTrackEvents linkDownloadFileTypes linkExternalFilters linkInternalFilters useForcedLinkTracking forcedLinkTrackingTimeout trackingServer trackingServerSecure ssl abort mobile dc lightTrackVars maxDelay expectSupplementalData usePostbacks registerPreTrackCallback registerPostTrackCallback AudienceManagement".split(" ");
for(m=0;250>=m;m++)76>m&&(a.g.push("prop"+m),a.P.push("prop"+m)),a.g.push("eVar"+m),a.P.push("eVar"+m),6>m&&a.g.push("hier"+m),4>m&&a.g.push("list"+m);m="pe pev1 pev2 pev3 latitude longitude resolution colorDepth javascriptVersion javaEnabled cookiesEnabled browserWidth browserHeight connectionType homepage pageURLRest marketingCloudOrgID".split(" ");a.g=a.g.concat(m);a.H=a.H.concat(m);a.ssl=0<=k.location.protocol.toLowerCase().indexOf("https");a.charSet="UTF-8";a.contextData={};a.offlineThrottleDelay=
0;a.offlineFilename="AppMeasurement.offline";a.Ra=0;a.ma=0;a.O=0;a.Qa=0;a.linkDownloadFileTypes="exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx";a.w=k;a.d=k.document;try{if(a.Wa=!1,navigator){var v=navigator.userAgent;if("Microsoft Internet Explorer"==navigator.appName||0<=v.indexOf("MSIE ")||0<=v.indexOf("Trident/")&&0<=v.indexOf("Windows NT 6"))a.Wa=!0}}catch(x){}a.ha=function(){a.ia&&(k.clearTimeout(a.ia),a.ia=p);a.l&&a.K&&a.l.dispatchEvent(a.K);a.A&&("function"==typeof a.A?a.A():
a.l&&a.l.href&&(a.d.location=a.l.href));a.l=a.K=a.A=0};a.Ua=function(){a.b=a.d.body;a.b?(a.v=function(c){var b,d,f,e,g;if(!(a.d&&a.d.getElementById("cppXYctnr")||c&&c["s_fe_"+a._in])){if(a.Ea)if(a.useForcedLinkTracking)a.b.removeEventListener("click",a.v,!1);else{a.b.removeEventListener("click",a.v,!0);a.Ea=a.useForcedLinkTracking=0;return}else a.useForcedLinkTracking=0;a.clickObject=c.srcElement?c.srcElement:c.target;try{if(!a.clickObject||a.N&&a.N==a.clickObject||!(a.clickObject.tagName||a.clickObject.parentElement||
a.clickObject.parentNode))a.clickObject=0;else{var h=a.N=a.clickObject;a.la&&(clearTimeout(a.la),a.la=0);a.la=setTimeout(function(){a.N==h&&(a.N=0)},1E4);f=a.La();a.track();if(f<a.La()&&a.useForcedLinkTracking&&c.target){for(e=c.target;e&&e!=a.b&&"A"!=e.tagName.toUpperCase()&&"AREA"!=e.tagName.toUpperCase();)e=e.parentNode;if(e&&(g=e.href,a.Na(g)||(g=0),d=e.target,c.target.dispatchEvent&&g&&(!d||"_self"==d||"_top"==d||"_parent"==d||k.name&&d==k.name))){try{b=a.d.createEvent("MouseEvents")}catch(l){b=
new k.MouseEvent}if(b){try{b.initMouseEvent("click",c.bubbles,c.cancelable,c.view,c.detail,c.screenX,c.screenY,c.clientX,c.clientY,c.ctrlKey,c.altKey,c.shiftKey,c.metaKey,c.button,c.relatedTarget)}catch(m){b=0}b&&(b["s_fe_"+a._in]=b.s_fe=1,c.stopPropagation(),c.stopImmediatePropagation&&c.stopImmediatePropagation(),c.preventDefault(),a.l=c.target,a.K=b)}}}}}catch(n){a.clickObject=0}}},a.b&&a.b.attachEvent?a.b.attachEvent("onclick",a.v):a.b&&a.b.addEventListener&&(navigator&&(0<=navigator.userAgent.indexOf("WebKit")&&
a.d.createEvent||0<=navigator.userAgent.indexOf("Firefox/2")&&k.MouseEvent)&&(a.Ea=1,a.useForcedLinkTracking=1,a.b.addEventListener("click",a.v,!0)),a.b.addEventListener("click",a.v,!1))):setTimeout(a.Ua,30)};a.Cb();a.ac||(r?a.setAccount(r):a.F("Error, missing Report Suite ID in AppMeasurement initialization"),a.Ua(),a.loadModule("ActivityMap"))}
function s_gi(r){var a,k=window.s_c_il,p,n,m=r.split(","),s,u,t=0;if(k)for(p=0;!t&&p<k.length;){a=k[p];if("s_c"==a._c&&(a.account||a.oun))if(a.account&&a.account==r)t=1;else for(n=a.account?a.account:a.oun,n=a.allAccounts?a.allAccounts:n.split(","),s=0;s<m.length;s++)for(u=0;u<n.length;u++)m[s]==n[u]&&(t=1);p++}t?a.setAccount&&a.setAccount(r):a=new AppMeasurement(r);return a}AppMeasurement.getInstance=s_gi;window.s_objectID||(window.s_objectID=0);
function s_pgicq(){var r=window,a=r.s_giq,k,p,n;if(a)for(k=0;k<a.length;k++)p=a[k],n=s_gi(p.oun),n.setAccount(p.un),n.setTagContainer(p.tagContainerName);r.s_giq=0}s_pgicq();

// Integrate Module

function AppMeasurement_Module_Integrate(l){var c=this;c.s=l;var e=window;e.s_c_in||(e.s_c_il=[],e.s_c_in=0);c._il=e.s_c_il;c._in=e.s_c_in;c._il[c._in]=c;e.s_c_in++;c._c="s_m";c.list=[];c.add=function(d,b){var a;b||(b="s_Integrate_"+d);e[b]||(e[b]={});a=c[d]=e[b];a.a=d;a.e=c;a._c=0;a._d=0;void 0==a.disable&&(a.disable=0);a.get=function(b,d){var f=document,h=f.getElementsByTagName("HEAD"),k;if(!a.disable&&(d||(v="s_"+c._in+"_Integrate_"+a.a+"_get_"+a._c),a._c++,a.VAR=v,a.CALLBACK="s_c_il["+c._in+"]."+
a.a+".callback",a.delay(),h=h&&0<h.length?h[0]:f.body))try{k=f.createElement("SCRIPT"),k.type="text/javascript",k.setAttribute("async","async"),k.src=c.c(a,b),0>b.indexOf("[CALLBACK]")&&(k.onload=k.onreadystatechange=function(){a.callback(e[v])}),h.firstChild?h.insertBefore(k,h.firstChild):h.appendChild(k)}catch(l){}};a.callback=function(b){var c;if(b)for(c in b)Object.prototype[c]||(a[c]=b[c]);a.ready()};a.beacon=function(b){var d="s_i_"+c._in+"_Integrate_"+a.a+"_"+a._c;a.disable||(a._c++,d=e[d]=
new Image,d.src=c.c(a,b))};a.script=function(b){a.get(b,1)};a.delay=function(){a._d++};a.ready=function(){a._d--;a.disable||l.delayReady()};c.list.push(d)};c._g=function(d){var b,a=(d?"use":"set")+"Vars";for(d=0;d<c.list.length;d++)if((b=c[c.list[d]])&&!b.disable&&b[a])try{b[a](l,b)}catch(e){}};c._t=function(){c._g(1)};c._d=function(){var d,b;for(d=0;d<c.list.length;d++)if((b=c[c.list[d]])&&!b.disable&&0<b._d)return 1;return 0};c.c=function(c,b){var a,e,g,f;"http"!=b.toLowerCase().substring(0,4)&&
(b="http://"+b);l.ssl&&(b=l.replace(b,"http:","https:"));c.RAND=Math.floor(1E13*Math.random());for(a=0;0<=a;)a=b.indexOf("[",a),0<=a&&(e=b.indexOf("]",a),e>a&&(g=b.substring(a+1,e),2<g.length&&"s."==g.substring(0,2)?(f=l[g.substring(2)])||(f=""):(f=""+c[g],f!=c[g]&&parseFloat(f)!=c[g]&&(g=0)),g&&(b=b.substring(0,a)+encodeURIComponent(f)+b.substring(e+1)),a=e));return b}}


// End Integrate Module

/*
 Start ActivityMap Module

 The following module enables ActivityMap tracking in Adobe Analytics. ActivityMap
 allows you to view data overlays on your links and content to understand how
 users engage with your web site. If you do not intend to use ActivityMap, you
 can remove the following block of code from your AppMeasurement.js file.
 Additional documentation on how to configure ActivityMap is available at:
 https://marketing.adobe.com/resources/help/en_US/analytics/activitymap/getting-started-admins.html
*/
function AppMeasurement_Module_ActivityMap(f){function g(a,d){var b,c,n;if(a&&d&&(b=e.c[d]||(e.c[d]=d.split(","))))for(n=0;n<b.length&&(c=b[n++]);)if(-1<a.indexOf(c))return null;p=1;return a}function q(a,d,b,c,e){var g,h;if(a.dataset&&(h=a.dataset[d]))g=h;else if(a.getAttribute)if(h=a.getAttribute("data-"+b))g=h;else if(h=a.getAttribute(b))g=h;if(!g&&f.useForcedLinkTracking&&e&&(g="",d=a.onclick?""+a.onclick:"")){b=d.indexOf(c);var l,k;if(0<=b){for(b+=10;b<d.length&&0<="= \t\r\n".indexOf(d.charAt(b));)b++;
if(b<d.length){h=b;for(l=k=0;h<d.length&&(";"!=d.charAt(h)||l);)l?d.charAt(h)!=l||k?k="\\"==d.charAt(h)?!k:0:l=0:(l=d.charAt(h),'"'!=l&&"'"!=l&&(l=0)),h++;if(d=d.substring(b,h))a.e=new Function("s","var e;try{s.w."+c+"="+d+"}catch(e){}"),a.e(f)}}}return g||e&&f.w[c]}function r(a,d,b){var c;return(c=e[d](a,b))&&(p?(p=0,c):g(k(c),e[d+"Exclusions"]))}function s(a,d,b){var c;if(a&&!(1===(c=a.nodeType)&&(c=a.nodeName)&&(c=c.toUpperCase())&&t[c])&&(1===a.nodeType&&(c=a.nodeValue)&&(d[d.length]=c),b.a||
b.t||b.s||!a.getAttribute||((c=a.getAttribute("alt"))?b.a=c:(c=a.getAttribute("title"))?b.t=c:"IMG"==(""+a.nodeName).toUpperCase()&&(c=a.getAttribute("src")||a.src)&&(b.s=c)),(c=a.childNodes)&&c.length))for(a=0;a<c.length;a++)s(c[a],d,b)}function k(a){if(null==a||void 0==a)return a;try{return a.replace(RegExp("^[\\s\\n\\f\\r\\t\t-\r \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u205f\u3000\ufeff]+","mg"),"").replace(RegExp("[\\s\\n\\f\\r\\t\t-\r \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u205f\u3000\ufeff]+$",
"mg"),"").replace(RegExp("[\\s\\n\\f\\r\\t\t-\r \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u205f\u3000\ufeff]{1,}","mg")," ").substring(0,254)}catch(d){}}var e=this;e.s=f;var m=window;m.s_c_in||(m.s_c_il=[],m.s_c_in=0);e._il=m.s_c_il;e._in=m.s_c_in;e._il[e._in]=e;m.s_c_in++;e._c="s_m";e.c={};var p=0,t={SCRIPT:1,STYLE:1,LINK:1,CANVAS:1};e._g=function(){var a,d,b,c=f.contextData,e=f.linkObject;(a=f.pageName||f.pageURL)&&(d=r(e,"link",f.linkName))&&(b=r(e,"region"))&&(c["a.activitymap.page"]=a.substring(0,
255),c["a.activitymap.link"]=128<d.length?d.substring(0,128):d,c["a.activitymap.region"]=127<b.length?b.substring(0,127):b,c["a.activitymap.pageIDType"]=f.pageName?1:0)};e.link=function(a,d){var b;if(d)b=g(k(d),e.linkExclusions);else if((b=a)&&!(b=q(a,"sObjectId","s-object-id","s_objectID",1))){var c,f;(f=g(k(a.innerText||a.textContent),e.linkExclusions))||(s(a,c=[],b={a:void 0,t:void 0,s:void 0}),(f=g(k(c.join(""))))||(f=g(k(b.a?b.a:b.t?b.t:b.s?b.s:void 0)))||!(c=(c=a.tagName)&&c.toUpperCase?c.toUpperCase():
"")||("INPUT"==c||"SUBMIT"==c&&a.value?f=g(k(a.value)):"IMAGE"==c&&a.src&&(f=g(k(a.src)))));b=f}return b};e.region=function(a){for(var d,b=e.regionIDAttribute||"id";a&&(a=a.parentNode);){if(d=q(a,b,b,b))return d;if("BODY"==a.nodeName)return"BODY"}}}
/* End ActivityMap Module */


//tealium universal tag - utag.sender.19063.am161 v4.0.##UTVERSION##, Copyright ##UTYEAR## Tealium.com Inc. All Rights Reserved.
try{
  (function(id,loader){

    /**
     * Tealium VisitorAPIWrapper v1.0
     */
    window.utag.tagsettings = window.utag.tagsettings || {};
    window.utag.tagsettings.adobe = window.utag.tagsettings.adobe || {};
    var vAPI = window.utag.tagsettings.adobe.visitorAPI = window.utag.tagsettings.adobe.visitorAPI || (function() { return {getInstance : function(orgID, callback) {
        if (orgID) {
          utag.DB("["+u.id+"] OrgID used, but no 'Adobe Marketing Cloud ID Service' tag detected");
        }
        return callback();
      }}; }());

    var u = {"id" : id};
    u.queue = [];
    utag.o[loader].sender[id] = u;
    u.ev={'view':1,'link':1,'video':1};
    u.o=##UTVARconfig_sobject##;
    u.varlist={pageName:'pageName',channel:'ch',campaign:'v0',hier1:'h1',hier2:'h2',hier3:'h3',hier4:'h4'};for(var i=1;i<76;i++){u.varlist['prop'+i]='c'+i;u.varlist['eVar'+i]='v'+i;}
    u.combineLinkVar = false;
    u.pushlt=function(l,v){if(typeof l!="undefined")l.push(v)};

    // Start Tealium typeOf 4.35
    if (utag.ut.typeOf === undefined) { u.typeOf = function(e) {return ({}).toString.call(e).match(/\s([a-zA-Z]+)/)[1].toLowerCase();};} else { u.typeOf = utag.ut.typeOf; }
    // End Tealium typeOf
    u.typeCheck = function(linkTrack, type){
      if(u.typeOf(linkTrack) === "string"){
        u[type] = linkTrack.split(",");
      }else if(u.typeOf(linkTrack) === "array"){
        u[type] = linkTrack;
      }else{
        u[type] = [];
      }
    }

##UTGEN##
  u.send=function(a,b,c,d,e,f,g,h,ev){
    if(u.ev[a]||typeof u.ev.all!="undefined"){
      utag.DB("send:##UTID##");

      u.data = {

        "adobe_org_id" : "##UTVARconfig_cloudid##",

        // set cookie domain explicitly (no need for cookieDomainPeriods and domain guessing)
        // http://rossscrivener.co.uk/blog/javascript-get-domain-exclude-subdomain
        "cookieDomain" : (function () {
          return utag.loader.RC ('utag_main').vapi_domain || (function () {
            var i = 0, d = document.domain, p = d.split ('.'), s = '_vapi' + new Date ().getTime ();
            while (i < (p.length -1) && document.cookie.indexOf (s + '=' + s) === -1) {
              d = p.slice (-1 -(++i)).join ('.');
              document.cookie = s + '=' + s + ';domain=' + d + ';';
            }
            document.cookie = s + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=' + d + ';';
            utag.loader.SC ('utag_main', { 'vapi_domain' : d });
            return d;
          } ());
        } ()),

        "a" : {},
        "serial" : {},
        "send_timestamp" : "##UTVARconfig_send_timestamp##",
        "timestamp" : ""
      };

      //Map adobe_org_id - This can't be done inside the following callback because it is used to call the function itself.
      for (d in utag.loader.GV(u.map)) {
        if (b[d] !== undefined && b[d] !== "") {
          e = u.map[d].split(",");
          for (f = 0; f < e.length; f++) {
            if(e[f] === "adobe_org_id" || e[f] === "linkTrackVars" || e[f] === "linkTrackEvents"){
            u.data[e[f]] = b[d];
            } else if(e[f] === "combineLinkVar"){
              u.combineLinkVar = b[d];
            }
          }
        }
      }
      //Send every call to a queue so we can process the events after the visitor API call
      u.queue.push({"a":a,"b":b,"u.data":u.data});
      vAPI.getInstance(u.data.adobe_org_id, function(instance) {
        //Get data object back from the queue so we can process everything in order
        var data = u.queue.shift();
        a = data["a"];
        b = data["b"];
        u.data = data["u.data"];

        u.a=a;
        b.sc_events=b.sc_events||{};

        u.addEvent = function (v, n) {
          var t = [];
          if (v instanceof Array) {
            t = v.slice(0);
          } else if (typeof n !== "undefined") {
            t.push(v + "=" + n);
          } else {
            t.push(v);
          }
          for (var i = 0; i < t.length; i++) {
            b.sc_events[t[i]] = 1;
            u.pushlt(u.lte, t[i].indexOf("=") > -1 ? t[i].split('=')[0] : t[i].split(':')[0]);
          }
          return b.sc_events;
        };

        u.addProduct = function (v) {
          u.data.sc_addProd = "";
          if (v instanceof Array) {
            u.data.sc_addProd = v.join(',');
          } else {
            u.data.sc_addProd = v;
          }
        };

        if (u.a === "link") {
          u.ltflag = true;
          if (typeof u.data.linkTrackVars === "undefined" && typeof b.linkTrackVars === "undefined") { u.ltv = []; }
          if (u.combineLinkVar && typeof u.data.linkTrackVars !== "undefined") {
            u.typeCheck(u.data.linkTrackVars, "ltv");
          } else if (u.combineLinkVar && typeof b.linkTrackVars !== "undefined") {
            u.typeCheck(b.linkTrackVars, "ltv");
          }

          if (typeof u.data.linkTrackEvents === "undefined" && typeof b.linkTrackEvents === "undefined") { u.lte = []; }
          if (u.combineLinkVar && typeof u.data.linkTrackEvents !== "undefined") {
            u.typeCheck(u.data.linkTrackEvents, "lte");
          } else if (u.combineLinkVar && typeof b.linkTrackEvents !== "undefined") {
            u.typeCheck(b.linkTrackEvents, "lte");
          }
        }
        // Dynamically override using extensions
        u.data.tagdevicetype = "##UTVARconfig_tagdevicetype##";
        u.data.detectserial = "##UTVARconfig_detectserial##";

        ##UTEXTEND##

        // Demandbase
        try {
          if (window.sessionStorage) {
            var standardDimensions = sessionStorage.getItem('s_dmdbase') || '';
            var customDimensions1 = sessionStorage.getItem('s_dmdbase_custom1') || '';
            var customDimensions2 = sessionStorage.getItem('s_dmdbase_custom2') || '';
            var customDimensions3 = sessionStorage.getItem('s_dmdbase_custom3') || '';
            var customDimensions4 = sessionStorage.getItem('s_dmdbase_custom4') || '';

            u.o.contextData.s_dmdbase = standardDimensions;
            u.o.contextData.s_dmdbase_custom1 = customDimensions1;
            u.o.contextData.s_dmdbase_custom2 = customDimensions2;
            u.o.contextData.s_dmdbase_custom3 = customDimensions3;
            u.o.contextData.s_dmdbase_custom4 = customDimensions4;
          }
        }
        catch (e) {
          utag.DB('AppMeasurement Demandbase Error: ' + e.message);
        }

        // Mobile lifecycle var
        if (u.data.tagdevicetype === "mobile") {
          u.data.timestamp = u.data.timestamp || b.timestamp || b.timestamp_unix;
          if (isTrue(u.data.send_timestamp) && u.data.timestamp) {
            u.o.timestamp = u.data.timestamp;
          }
          u.data.a = {
            "AppID" : b.app_id || "",
            "CarrierName" : b.carrier || "",
            "DeviceName" : b.device || "",
            "HourOfDay" : b.lifecycle_hourofday_local || "",
            "DayOfWeek" : b.lifecycle_dayofweek_local || "",
            "OSVersion" : b.os_version || b.platform_version || "",
            "Resolution" : b.device_resolution || ""
          };
          if (b.lifecycle_type) {
            u.data.a.disable_wake_track = false;
            u.data.a.disable_sleep_track = false;
            u.data.a.DaysSinceFirstUse = b.lifecycle_dayssincelaunch || "";
            u.data.a.DaysSinceLastUpgrade = b.lifecycle_dayssinceupdate || "";
            u.data.a.DaysSinceLastUse = b.lifecycle_dayssincelastwake || "";
            u.data.a.Launches = b.lifecycle_launchcount || "";
            u.data.a.InstallDate =  b.lifecycle_firstlaunchdate_MMDDYYYY || "";
            u.data.a.UpgradeEvent = b.lifecycle_isfirstlaunchupdate || "";
            u.data.a.PrevSessionLength = b.lifecycle_priorsecondsawake || "";
          }
          if (b.lifecycle_isfirstlaunch) {
            u.data.a.InstallEvent = "InstallEvent";
          }
          if (b.lifecycle_diddetectcrash) {
            u.data.a.CrashEvent = "CrashEvent";
          }
          if (b.lifecycle_type === "launch") {
            u.data.a.LaunchEvent = "LaunchEvent";
          }
          if (b.lifecycle_isfirslaunchupdate) {
            u.data.a.UpgradeEvent = "UpgradeEvent";
          }
        }

        for (e in utag.loader.GV(u.map)) {
          if (u.data.tagdevicetype === "mobile") {
            if (typeof b[e] != "undefined" && typeof u.map[e] == "string" && u.map[e].indexOf("contextData.a.") > -1) {
              f = u.map[e].split(",");
              for (g = 0; g < f.length; g++) {
                if (f[g].indexOf("contextData.a.") === 0){
                  u.data.a[f[g].substring(14)] = b[e];
                }
              }
            }
          } else if (typeof b[e] != "undefined" && typeof u.map[e] == "string" && u.map[e].indexOf("SERIAL_") > -1) {
            f = u.map[e].split(",");
            for (g = 0; g < f.length; g++) {
              if (f[g].indexOf("SERIAL_") === 0){
                u.data.serial[f[g].substring(7)]=b[e];
              }
            }
          } else if (typeof b[e] != "undefined" && typeof u.map[e] == "string" && u.map[e].indexOf("PRODUCTS_") > -1) {
            f = u.map[e].split(",");
            for (g = 0; g < f.length; g++) {
              if(f[g].indexOf("PRODUCTS_id") || f[g].indexOf("PRODUCTS_category") || f[g].indexOf("PRODUCTS_quantity") || f[g].indexOf("PRODUCTS_price")){
                u.data[f[g].substring(9)]=b[e];
              }
            }
          }
        }

        //Check for disabled lifecycles

        if(u.data.a.disable_wake_track === true || u.data.a.disable_wake_track === "true") {
          if (b.lifecycle_type === "wake") {
            return false;
          }
        }
        if(u.data.a.disable_sleep_track === true || u.data.a.disable_sleep_track === "true") {
          if (b.lifecycle_type === "sleep") {
            return false;
          }
        }

        u.data.id = u.data.id || (typeof b._cprod != "undefined" ? b._cprod.slice(0) : []);
        u.data.category = u.data.category || (typeof b._ccat != "undefined" ? b._ccat.slice(0) : []);
        u.data.quantity = u.data.quantity || (typeof b._cquan != "undefined" ? b._cquan.slice(0) : []);
        u.data.price = u.data.price || (typeof b._cprice != "undefined" ? b._cprice.slice(0) : []);
        if(typeof u.data.id!="undefined"&&u.data.id!=""){
          c=[];d={};ev={};for(e in utag.loader.GV(u.map)){if(typeof b[e]!="undefined"&&typeof u.map[e]=="string"&&u.map[e].indexOf("PRODUCTS_")>-1){f=u.map[e].split(",");for( g=0;g<f.length;g++){
            var pv = f[g].substring(9);
            if(f[g].indexOf("PRODUCTS_evar")==0 || f[g].indexOf("PRODUCTS_eVar")==0){
              if (b[e] instanceof Array) {
                b.sc_prodevars = b.sc_prodevars || [];
                for (var i = 0; i < b[e].length; i++) {
                  var prodvars = {};
                  if(typeof b.sc_prodevars[i]!="undefined" && b.sc_prodevars[i]!=""){
                    b.sc_prodevars[i][pv]=b[e][i];
                  }else{
                    prodvars[pv]=b[e][i];
                    b.sc_prodevars.push(prodvars);
                  }
                }
              }else{
                d[pv] = (b[e]+"").split(",");
              }
            }else if(f[g].indexOf("PRODUCTS_event")==0){
              if(b[e] instanceof Array){
                b.sc_prodevents=b.sc_prodevents || [];
                for (var i = 0; i < b[e].length; i++) {
                  var prodevents = {};
                  if(typeof b.sc_prodevents[i]!="undefined" && b.sc_prodevents[i]!=""){
                    b.sc_prodevents[i][pv]=b[e][i];
                  }else{
                    prodevents[pv]=b[e][i];
                    b.sc_prodevents.push(prodevents);
                  }
                }
                u.addEvent(pv);
              }else if (b[e] !== ""){
                ev[pv]=b[e];
                u.addEvent(pv);
              }
            }
          }}}
          e="";for(f in utag.loader.GV(d)){for(g=0;g<d[f].length;g++){if(e!="")e+="|"+f+"="+d[f][g];else e=f+"="+d[f][g];}}
          h="";for(f in utag.loader.GV(ev)){if(h)h+="|"+f+"="+((isNaN(ev[f]))?"1":ev[f]);else h=f+"="+((isNaN(ev[f]))?"1":ev[f]);}
          b.sc_prodevents=b.sc_prodevents||[];
          b.sc_prodevars=b.sc_prodevars || [];
          for(d=0;d<u.data.id.length;d++){
            var h2=h;
            var h3=e;
            if(typeof b.sc_prodevents!="undefined"){
              for (f in b.sc_prodevents[d]) {
                if(typeof b.sc_prodevents[d][f]!="undefined"){
                  var l =b.sc_prodevents[d][f];
                  if(typeof l!="undefined" && l!="" && isNaN(l)==false){
                    if (h2){
                      h2 += "|" + f + '=' + l;
                    }else{
                      h2 = f + '=' + l;
                    }
                  }
                }
              }
            }
            if(typeof b.sc_prodevars!="undefined"){
              for (f in b.sc_prodevars[d]) {
                if(typeof b.sc_prodevars[d][f]!="undefined"){
                  var l =b.sc_prodevars[d][f];
                  if(typeof l!="undefined" && l!=""){
                    if (h3){
                      h3 += "|" + f + '=' + l;
                    }else{
                      h3 = f + '=' + l;
                    }
                  }
                }
              }
            }
            c.push((u.data.category[d]?u.data.category[d]:"")+";"+u.data.id[d]+";"+(u.data.quantity[d]?u.data.quantity[d]:"")+";"+(u.data.price[d]?((u.data.quantity[d]?parseInt(u.data.quantity[d]):1)*parseFloat(u.data.price[d])).toFixed(2):"")+";"+h2+";"+h3);
          }
          if (typeof u.data.sc_addProd !== "undefined" && u.data.sc_addProd) {
            c.push(u.data.sc_addProd);
          }
          u.o.products=c.join(",");
        } else {
          u.o.products = "";
        }

        // Mapping would be b.event_name ==> "prod:event3,click:event4"
        // Data layer variable b.event_name will contain "prod,click" and trigger both event3,event4
        // To serialize, this would be "prod:12345,click"
        var evt=/^event|prodView|scOpen|scAdd|scRemove|scView|scCheckout|purchase$/;
        for(c in utag.loader.GV(b)){
          if(b[c] !== ""){
            f=(""+b[c]).split(",");
            for(g=0;g<f.length;g++){
              h=f[g].split(":");
              d=[];
              if(u.data.detectserial === "no") {
                if(typeof u.map[c+":"+h.join(":")]!="undefined"){ //fix to check against whole string
                  d=u.map[c+":"+h.join(":")].split(",");
                }else if(typeof u.map[c]!="undefined"){
                  d=u.map[c].split(",");
                }
              } else {
                //h.length is determined by how many colons are found
                if(h.length>1){
                  var subTrigger = h[0];
                  //Subtrigger is a concatenation of all but the last index, which is a detected serialization
                  for(var i=1; i<h.length-1;i++) {
                    subTrigger += ":"+h[i];
                  }
                  // Redefine h with subTrigger and detected serialization
                  h[0] = subTrigger;
                  h[1] = h[h.length-1];
                }
                if(typeof u.map[c+":"+h[0]]!="undefined"){
                  d=u.map[c+":"+h[0]].split(",");
                }else if(typeof u.map[c]!="undefined"){
                  d=u.map[c].split(",");
                }
              }
              for(e=0;e<d.length;e++){if(d[e]!="events"&&evt.test(d[e])&&d[e].indexOf("SERIAL_")!==0){
                if(u.data.serial[d[e]] !== undefined && u.data.serial[d[e]] !== "" ) {
                  u.addEvent(d[e]+":"+u.data.serial[d[e]]);
                } else {
                  if(u.data.detectserial === "yes") {
                    u.addEvent(d[e]+(h.length>1?":"+h[1]:""));
                  } else {
                    u.addEvent(d[e]);
                  }
                }
              }}
            }
          }
        }
        //Placing mobile data in contextData
        for (var m in u.data.a) {
          u.o.contextData["a."+m] = u.data.a[m];
          u.pushlt(u.ltv, "contextData.a." + m);
        }

        for(c in utag.loader.GV(b)){if(typeof u.map[c]!="undefined"){d=u.map[c].split(",");for(e=0;e<d.length;e++){
          // map to VALUE_event51 for events = "event51=60"
          if(d[e].indexOf("VALUE_")==0){
            // If an event serialization was mapped for this event
            if(u.data.serial[d[e]] !== undefined && u.data.serial[d[e]] !== ""){
              u.addEvent( d[e].substring(6), b[c]+":"+u.data.serial[d[e]] );
            } else {
              u.addEvent(d[e].substring(6), b[c]);
            }
          }else if(d[e]=="doneAction"){
            b.doneAction=b[c];
            if(b.doneAction!="navigate"){
              b.doneAction=eval(b[c]);
            }
          }else if(d[e].indexOf("c.") == 0 || d[e].indexOf("contextData.") == 0){
            d[e]=d[e].replace("contextData.", "c.");
            if (d[e][2] !== "a" && d[e][3] !== ".") {   // Exclude mobile vars
              u.o.contextData[d[e].substring(2)] = b[c];
              u.pushlt(u.ltv,"contextData."+d[e].substring(2))
            }
          } else {
            if(c=="sc_events" || c=="sc_prodevents" || c=="sc_prodevars"){
              utag.DB("Error:##UTID##: Mapping reserved object name " + c)
            }else{
              u.o[d[e]]=b[c];
            }
            // if linkTrackVars is mapped then turn off auto-generation of linkTrackVars
            if(d[e]=="s_account"){
              u.o.account=b[c];
            }else if(d[e]=="linkTrackVars"){
              u.ltflag=false;
            }else{
              if(u.combineLinkVar){u.ltflag=true;}
              if(d[e] !== "combineLinkVar"){
                u.pushlt(u.ltv,d[e]);
              }
            }
          }
        }}}
        d=[];for(c in utag.loader.GV(b.sc_events)){if(b.sc_events[c])d.push(c);}
        if(d.length>0){
          u.o.events=d.join(",");
          u.pushlt(u.lte,u.o.events);
        } else {
          u.o.events = "";
        }

        if(b._ccurrency){
          u.o.currencyCode=b._ccurrency;
        }

        if(b._corder){
          u.pushlt(u.lte,"purchase");
          u.pushlt(u.ltv,"purchaseID");
          u.o.purchaseID=((u.o.purchaseID)?u.o.purchaseID:b._corder);
          u.o.events=((u.o.events)?u.o.events:"purchase");
          if(u.o.events.indexOf("purchase")<0){u.o.events+=",purchase";}
        }

        //Use case: Visitor API set up in Tealium iQ, we will use this instance of the Visitor API
        if (instance) {
          u.o.visitor = instance;
        }

        //Use case: Visitor API not set up in Tealium iQ -
        //If a previously created instance of the Visitor API object is found on the page, that will be referenced.
        //Otherwise a new Visitor API object is instantiated.
        if (!u.o.visitor) {
          if(typeof visitor !== 'undefined'){
            u.o.visitor = window.visitor;
          }else if (typeof Visitor !== "undefined" && typeof Visitor.getInstance !== "undefined") {
            u.o.visitor = Visitor.getInstance(u.data.adobe_org_id);
          }
        }

        // marketing cloud cookie domain should take precedence if exist
        u.o.cookieDomain = u.o.visitor ? u.o.visitor.cookieDomain || u.data.cookieDomain : u.data.cookieDomain;

        if(u.a=="view"){
          var img = u.o.t();
          /* still track on user agents Adobe cannot detect */
          if(typeof img!="undefined" && img!=""){
            u.img=new Image();u.img.src=img.substring(img.indexOf("src=")+5,img.indexOf("width=")-2);
          }
        }else if(u.a=="link"){
          if(typeof u.ltv!="undefined" && u.ltflag){
            if(u.o.events){u.ltv.push("events");}
            if(u.o.products){u.ltv.push("products");}
            b.linkTrackVars=u.ltv.join(',')
          }
          if(typeof u.lte!="undefined" && u.ltflag)b.linkTrackEvents=u.lte.join(',');
          u.o.linkTrackVars = u.data.linkTrackVars || b.linkTrackVars || "None";
          u.o.linkTrackEvents = u.data.linkTrackEvents || b.linkTrackEvents || "None";

          if(!u.o.linkType)u.o.linkType='o';
          if(b.link_name)b.link_text=b.link_name;
          b.link_text=(b.link_text)?b.link_text:"no link_name";
          if(b.link_type=='exit link'){u.o.linkType='e'}
          else if(b.link_type=='download link')u.o.linkType='d';

          u.o.tl(((b.link_obj)?b.link_obj:true),u.o.linkType,b.link_text,null,(b.doneAction?b.doneAction:null));
        }

        /* clear variables */
        if("##UTVARconfig_runclearvars##"=="yes"){
          u.o.clearVars();
          u.o.contextData = {};
        }

        utag.DB("send:##UTID##:COMPLETE");
      });
    }
  };

  function isTrue (input) {
    if (typeof input === "boolean") {
      return input;
    } else if (typeof input === "string" && (input.toLowerCase() === "yes" || input.toLowerCase() === "true")) {
      return true;
    } else {
      return false;
    }
  }

  try{utag.o[loader].loader.LOAD(id)}catch(e){utag.loader.LOAD(id)}
  })('##UTID##','##UTLOADERID##');
}catch(e){
  utag.DB(e);
}
//end tealium universal tag
