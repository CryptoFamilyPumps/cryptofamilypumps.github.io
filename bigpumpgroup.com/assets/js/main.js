"use strict";
var pagedata = {};
var socket = null;
var callchannel = null;
var sitestate = null;
var currentpage = null;
var userdata = null;
var defs = null;
var maxmessagelength = 512;

window.onpopstate = function () { loadpage(); };
window.addEventListener("load", function () {
	loadparts.window = true;
	docloaded();
});
setInterval(updatestate, 60 * 1000);


(function () {
	(function (d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) { return; }
		js = d.createElement(s); js.id = id;
		js.src = "https://connect.facebook.net/en_US/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));

	window.fbAsyncInit = function () {
		FB.init({ appId: '2017347031845649', cookie: true, version: "v2.12" });
		FB.getLoginStatus(function (response) {
			console.log("facebook login status: ", response);

			if (!window.userdata && response.status == "connected") {
				//auth_facebook();
			}
		});
	};
})();

function auth_facebook() {
	FB.login(function (res) {
		if (res.authResponse) {
			apireq("/account/facebook_auth?id=" + encodeURIComponent(res.authResponse.userID) + "&auth=" + encodeURIComponent(res.authResponse.accessToken), function (obj) {
				if (obj.status == "success") {
					userdata = obj.userdata;
					closeLogin();
					loadpage("/account", true);
				}
				console.log(obj);
			});
		}
	});
}

var loadparts = {
	dom: false,
	userdata: false,
	window: false,
	init: false,
	initsc:false
};

function domloaded() {
	loadparts.dom = true;
	docloaded();
}
function accdatareceived(obj) {
	userdata = obj.userdata;	
	defs = obj.defs;
	sitestate = obj.defs.state;
	loadparts.userdata = true;
	docloaded();
}
apireq("/account/data", function (obj) {
	localStorage.lastaccdata = JSON.stringify(obj);
	accdatareceived(obj);
}, function (e) {
	var d = localStorage.lastaccdata;
	if (d) { accdatareceived(JSON.parse(d)); }
});

function docloaded() {
	if (!loadparts.init && loadparts.dom && loadparts.userdata) {
		init();
	}
	// if (!loadparts.initsc && loadparts.dom && loadparts.userdata && loadparts.window) {
		// initSC();
		// for (var a = 0; a < onSCLoaded.cbs.length; a++) {
			// onSCLoaded.cbs[a]();
		// }
	// }
}

onSCLoaded.cbs = [];
function onSCLoaded(cb) {
	if (loadparts.initsc) { cb(); }
	else { onSCLoaded.cbs.push(cb); }
}

function auth_discord() {
	window.open(defs.loginurl,"","width=400,height=500");
}

function updatestate() {
	if (userdata && !defs.lockdown) {
		apireq("/account/update", function (obj) {
			sitestate = obj;
		});
	}
}

function apireq(url, callback,failcb) {
	apihttpinner(url, null, callback, failcb);
}

function apipost(url,data, callback,failcb) {
	apihttpinner(url, data, callback,failcb);
}

function apihttpinner(url, data, cb, failcb) {
	var req = new XMLHttpRequest();
	req.open((data ? "POST" : "GET"), url);
	req.onload = function () {
		try {
			var obj = JSON.parse(req.responseText);
		} catch (e) {
			failcb && failcb("Invalid server response");
			return;
		}
		if (obj.status == "error") {
			failcb && failcb(obj.message);
			return;
		}

		cb && cb(obj);
	}
	req.onerror = function (e) {
		failcb && failcb("Network error: " + e.message);
	}
	var cookies = document.cookie.split(";");
	var session = "";
	for (var a = 0; a < cookies.length; a++) {
		var m = cookies[a].match(/\s*session=(\w{16,64})/);
		if (m) { session = m[1]; }
	}
	req.setRequestHeader("X-Bps-Session", session);
	if (data) {
		req.setRequestHeader("Content-Type", "application/json");
		req.send(JSON.stringify(data));
	}
	else { req.send(); }
}

function receiveLogin(data) {
	userdata = data;
	loadpage();
}

function logout() {
	apireq("/account/logout", function () {
		userdata = null;
		loadpage();
	});
	FB.logout();
}

function init() {
	elput("aboutcountdown", countdown(defs.nextpump));
	loadpage();
}

function drawSCStatus() {
	var el = elid("signalstatus");
	if (!el) { return; }

	var state = "";
	if (socket) {
		if (socket.state == "connecting") { state = "<div class='statusdot' style='background:gray;'></div>Connecting"; }
		if (socket.state == "open") { state = "<div class='statusdot' style='background:green;'></div>Connected"; }
		if (socket.state == "closed") { state = "<div class='statusdot' style='background:red;'></div>Disconnected"; }
	}
	el.innerHTML = state;
}

// function initSC() {
	// socket = socketCluster.connect({
		// host: defs.socket_endpoint,
		// secure: (document.location.hostname == "localhost" ? false : true)
	// });
	// socket.on('error', function (err) { console.log('Socket error - ', err); drawSCStatus(); });
	// socket.on('connect', function () { console.log('CONNECTED'); drawSCStatus();});
	// socket.on('disconnect', function () { console.log('DISCONNECTED'); 	drawSCStatus(); });

	// drawSCStatus();

	// if (userdata) {
		// socket.authenticate(userdata.jwt, function (err) {
			// console.log("AUTHENTICATED", err);
		// });
	// }

	// sub to call channel
	// if (userdata) {
		// callchannel = socket.subscribe(userdata.signalchannel, { waitForAuth: true });
	// } else {
		// callchannel = socket.subscribe("call/public");
	// }
	// callchannel.watch(function (data) {
		// var defschanged = false;
		// var el = elid("signal");
		// var callhtml = (el ? el.innerHTML : "");
	
		// if (data.type == "call") {
			// callhtml = data.html;
		// }
		// if (data.type == "ping") {
			// callhtml = "Ping test: " + (Date.now() - data.time) + "ms<br>(This might be incorrect if your system time is off)";
		// }
		// if (data.updatedefs) {
			// for (var a in data.updatedefs) {
				// defs[a] = data.updatedefs[a];
			// }
			// defschanged = true;
		// }
		// if (data.calltimeleft) {
			// defs.nextpump = Date.now() + data.calltimeleft;
			// defschanged = true;
		// }

		// if (defschanged) { init(); }
		// var el = elid("signal");
		// if (el) { el.innerHTML = callhtml;}
		// console.log("call signal html: ", data);
	// });
// }

function loadpage(url,pushstate) {
	toggleClass(document.body, "loggedin", !!userdata);
	toggleClass(document.body, "anon", !userdata);
	toggleClass(document.body, "lockdown", !!defs.lockdown);
	toggleClass(document.body, "moderator", userdata && userdata.moderator);
	if (userdata) {
		elid("userstatus").innerText = user_displayname;
	}
	if(defs.status==0 && defs.reasontext){
		$("#reasonstop").html(defs.reasontext);
	}
	if (!url) { url = document.location.pathname; }

	var pagehandled = false;
	var pages = document.getElementsByClassName("subpage");
	var pageobj = {};
	for (var a = 0; a < pages.length; a++) {
		var page = { id: pages[a].id };
		var pageurl = "/" + page.id.match(/page-(\w+)/)[1];
		pageobj[pageurl] = page;
	}
	pageobj["/"] = pageobj["/about"];
	var m = url.match(/^\/\w*$/);
	if (m) {
		var pagename = m[0];
		var pageinfo = pagedata[pagename];
		var page = pageobj[pagename];
		if (page) { pagehandled = true; }
		//if (!page) { page = pageobj["404"]; }
		for (var a in pageobj) {
			toggleClass(pageobj[a].id, "active", pageobj[a] == page);
		}
		if (currentpage) {
			if (currentpage.onunload) { currentpage.onunload(); }
		}
		if (pageinfo) {
			if (pageinfo.onload) { pageinfo.onload(); }
		}
		currentpage = pageinfo;
	}
	if (pushstate) {
		history.pushState(null, "", url);
	}
	return pagehandled;
}

function toggleClass(el, classname, val) {
	if (typeof el == "string") { el = elid(el); }
	if (val == undefined) { val = !el.classList.contains(classname); }
	if (val) { el.classList.add(classname); }
	else { el.classList.remove(classname); }
}

function elid(id) {
	return document.getElementById(id);
}

function closeLogin(e) {
	var el = elid("loginscreen");
	if (!e || e.target == el) {
		toggleClass(el, "visible", false);
	}
}

function loginscreen() {
	toggleClass("loginscreen", "visible", true);
}

function ajaxurl(e) {
	var el = e.target;
	if (!el) { return; }
	var href = el.href;
	if (!href) { return; }
	var origin = document.location.origin;
	if (href.slice(0, origin.length) != origin) { return; }
	var pathname = href.slice(origin.length);

	if (loadpage(pathname,true)) {
		e.preventDefault();
	}
}

function loggedIn() {
	if (window.opener) {
		try {
			window.opener.userdata = userdata;
			window.opener.closeLogin();
			window.opener.loadpage("/account", true);
			window.close();
			return;
		} catch (e) { }
	}
	loadpage("/account", true);
}

function drawAccount() {
	var frag;
	var drawinvites = function () {
		var createinv = function () {
			apireq("/account/create_invite", function (r) {
				if (r.status == "success") {
					userdata.refs.push(r.ref);
					drawAccount();
				} else {
					//TODO add some fail indication
				}
			});
		}

		return eldiv("reftable:table", userdata.refs.map(function (r) {
					// alert(r.ref);
			return eldiv(":tr", [
				eldiv(":td", [copybox(r.code)]),
				//eldiv(":td", [ r.uses+" uses"])
			]);
		}).concat([
			eldiv(":tr", [eldiv("createinvite:td", { colspan: "2", onclick: createinv }, ["Create new invite code"])])
		]));
	}

	if (userdata) {
		var last = 0;
		var advantage = (defs.nextpumpranked ? userdata.signaltime : 0);
		var personalpumptime = defs.nextpump - advantage;
		var titletext = "";
		if (!defs.nextpumpranked) { titletext = " - Same for everyone this pump"; }
		else if (advantage != 0) { titletext = " - " + (advantage/1000) + " seconds advantage"; }
		var isverify = userdata.isverify==0? false: true;
		frag = elfrag(
			eldiv(":h2", ["Pump Signal"]),
			eldiv("twocolumn", [
				eldiv("column", [
					eldiv("databox", [
						eldiv(":h3", ["Personal countdown" + titletext]),
						countdown(personalpumptime),
					])
				]),
				eldiv("column", [
					eldiv("databox", [
						eldiv(":div", {style:"font-weight:bold"}, ["Date"]),
						eldiv(":div", [new Date(defs.nextpump).toUTCString()]),
						eldiv(":div", {style:"font-weight:bold"}, ["Pump Type"]),
						eldiv(":div", ["Free for all"]),
						eldiv(":div", {style:"font-weight:bold"}, ["Exchange"]),
						eldiv(":div", [defs.market]),
					])
				])
			]),
			eldiv("databox", [
				eldiv({ id: "signalstatus" }),
				eldiv({ id: "signal" }, ["The signal will be given here"]),
			]),
			eldiv(":h2", ["Your Account"]),
			eldiv("twocolumn", [
				eldiv("column", [
					eldiv("databox", [
						eldiv(":h5", ["You have " + userdata.invites + " invites"]),
						eldiv("reftable:table", [
							eldiv(":th", ["Rank"]),
							eldiv(":th", ["Advantage"]),
							eldiv(":th", ["Invites"])
						].concat(defs.ranks.map(function (rank) {
							var left = rank.invites - userdata.invites;
							var progress = 100;
							if (rank.invites) {
								progress = (userdata.invites - last) / (rank.invites - last) * 100;
								last = rank.invites;
							}
							return eldiv(":tr", { style: "background: linear-gradient(to right,rgba(0,0,0,0.3) " + progress + "%,rgba(0,0,0,0) " + progress + "%);" }, [
								eldiv(":td", [rank.name]),
								eldiv(":td", [rank.advantage + " seconds"]),
								eldiv(":td", [(rank.invites || 0) + (left > 0 ? " (" + left + " left)" : "")]),
							])
						})))
					]),
					eldiv("databox", [
						eldiv(":h5", ["Your invite links are:"])
					].concat(drawinvites()))]
				),
				eldiv("column", [
					eldiv("databox", [
						eldiv(":h5", ["Account status: "]),
						eldiv(":p", { style: isverify?"font-size:larger; color:green; text-align: center":"font-size:larger; color:red; text-align: center" }, [isverify? "Verified": "Unverified"]),
						isverify? '': eldiv("navitem black clickable:button", { id: "resend_btn", onclick: resendemail }, ["Resend verify email"]),
					]),
					eldiv("databox", [
						eldiv(":h5", ["Account options"]),
							eldiv("form-group", [eldiv(":input", { name: "currentpass", id: "currentpass", placeholder:"Current Password", type:"password" })]),
							eldiv("form-group", [eldiv(":input", { name: "newpass", id: "newpass", placeholder:"New Password", type:"password" }),]),
							eldiv("form-group", [eldiv(":input", { name: "confirmnewpass",id: "confirmnewpass", placeholder:"Confirm Password", type:"password" })]),
							eldiv("navitem black clickable:button", { onclick: changepass}, ["Change password"]),
						
					])
				])
			]),
			/*
			eldiv("databox", [
				eldiv(":h2", ["How to gain ranks"]),
				eldiv(":p", ["You can gain ranks by inviting other people. Inviting is as simple as copying your unique invite link above and sending it to more people to join."])
			])*/
		);
	} else {
		frag = elfrag(
			eldiv(":h2", ["Your Account"]),
			eldiv(":h5", ["Please ", eldiv(":a", { href: "javascript:void(0);", onclick: loginscreen }, ["log in"]), " to see your account."])
		);
	}
	elput("accountdata", frag);
	drawSCStatus();
}

// function timeConverter(UNIX_timestamp){
	// var a = new Date(UNIX_timestamp);
	// a = a.toUTCString();
	// var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	// var year = a.getFullYear();
	// var month = months[a.getMonth()];
	// var date = a.getDate();
	// var hour = a.getHours();
	// var min = a.getMinutes();
	// var sec = a.getSeconds();
	// var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min ;
	// return a;
// }

function resendemail(){
	$("#resend_btn").attr('disabled', 'disabled');
	$.ajax({
		url: base_url + 'account/resend_verify',
		method: 'GET',
		dataType: 'json',
		error: function()
		{
					$("#resend_btn").removeAttr('disabled');
			// alert("An error occoured!");
			showError("Error", "Please try again later!");
		},
		success: function(response)
		{	
			if(response.status == 'success')
				{
					$("#resend_btn").removeAttr('disabled');
					showError("Email sent.", "If you did not receive a verification email, check your Spam or Junk email folders.");
				}
			else{
					$("#resend_btn").removeAttr('disabled');
				showError("Fail", "Please try again later!");
			}
		}
	});
}
function changepass(){
	var curpass = $("#currentpass").val();
	var newpass = $("#newpass").val();
	var confpass = $("#confirmnewpass").val();
	if(curpass && newpass && confpass){
		if(newpass!=confpass){
			showError("Error", "Confirm password incorrect");
		}
		else{
			if(newpass.length>=6){
				$.ajax({
							url: base_url + 'ajax/changepass',
							method: 'POST',
							dataType: 'json',
							data: {
								curpass: curpass,
								newpass: newpass,
								confpass: confpass,
								csrf_hash : csrf_hash 
							},
							error: function()
							{
								//alert("An error occoured!");
								showError("Error", "Fail", base_url + "account");
							},
							success: function(response)
							{	
								if(response.status == 'success')
									{
										showError("Success", "Change password complete", base_url + "account");
									}
								else{
									showError("Fail", response.status, base_url + "account");
								}
							}
					});
			}
			else showError("Error", "Password length min 6");
		}
	}
	else showError("Error", "Please enter password");
}

function copybox(invid) {
	var url = document.location.origin + "/ref/" + invid;
	var clickCopy = function () {
		els.input.select();
		try {
			var successful = document.execCommand('copy');
			var msg = successful ? 'successful' : 'unsuccessful';
			console.log('Copying text command was ' + msg);
		} catch (err) {
			console.log('Oops, unable to copy');
		}
	}
	var els = {};
	els.outer = eldiv("copybox", [
		els.input = eldiv(":input", { value: url }),
		els.button = eldiv("copybutton", { onclick: clickCopy },["Copy"])
	]);
	return els.outer;
}

function elclear(el) {
	if (typeof el == "string") { el = elid(el); }
	while (el.firstChild) { el.removeChild(el.firstChild); }
}

function elput(el, content) {
	if (typeof el == "string") { el = elid(el); }
	elclear(el);
	el.appendChild(content);
}

function eldiv(strClass, objAttr, arrayChildren) {
	var classname, attr, children, tag, tagarg, el, childfrag;
	//reorder arguments
	var argi = 0;
	if (typeof arguments[argi] == "string") {
		var typedata = arguments[argi++].split(":");
		classname = typedata[0];
		var tagdata = typedata[1] ? typedata[1].split("/") : [];
		tag = tagdata[0];
		tagarg = tagdata[1];
	}
	if (typeof arguments[argi] == "object" && !Array.isArray(arguments[argi]) && !(arguments[argi] instanceof DocumentFragment)) { attr = arguments[argi++]; }
	if (typeof arguments[argi] == "object" && Array.isArray(arguments[argi])) { children = arguments[argi++]; }
	else if (typeof arguments[argi] == "object" && arguments[argi] instanceof DocumentFragment) { childfrag = arguments[argi++]; }
	attr = attr || {};
	if (classname) { attr["class"] = classname; }

	//start actual work
	tag = attr && attr.tag || tag || "div";
	if (tag == "input" && tagarg) { attr.type = tagarg; }
	if (tag == "frag") { el = document.createDocumentFragment(); }
	else {
		var el = (attr && attr.namespace ? document.createElementNS(attr.namespace, tag) : document.createElement(tag));
	}
	if (attr) {
		for (var a in attr) {
			if (attr[a] === false || attr[a] == null || a == "tag" || a == "namespace") { continue; }
			if (a.substr(0, 2) == "on") { el[a] = attr[a]; }
			else { el.setAttribute(a, attr[a]); }
		}
	}
	if (children != null) {
		if (!Array.isArray(children)) { children = [children]; }
		for (var a in children) {
			if (children[a] == null) { continue; }
			if (typeof children[a] != "object") { el.appendChild(document.createTextNode(children[a].toString())); }
			else { el.appendChild(children[a]); }
		}
	}
	else if (childfrag != null) {
		el.appendChild(childfrag);
	}
	return el;
}

function elfrag() {
	var el = document.createDocumentFragment();
	for (var a = 0; a < arguments.length; a++) {
		if (arguments[a] == null) { continue; }
		if (typeof arguments[a] != "object") { el.appendChild(document.createTextNode(arguments[a].toString())); }
		else { el.appendChild(arguments[a]); }
	}
	return el;
}

function countdown(targettime) {
	var els = {};
	var el = eldiv("countdown", {style:"padding-bottom:20px"}, [
		eldiv("countdownsub", [els.days = eldiv("countdownnumber"), eldiv("countdowntext", ["Days"])]),
		eldiv("countdownsub", [els.hours = eldiv("countdownnumber"), eldiv("countdowntext", ["Hours"])]),
		eldiv("countdownsub", [els.mins = eldiv("countdownnumber"), eldiv("countdowntext", ["Minutes"])]),
		eldiv("countdownsub", [els.sec = eldiv("countdownnumber"), eldiv("countdowntext", ["Seconds"])]),
	]);
	var interval = 0;
	el.targettime = targettime;
	var tick = function () {
		var t = el.targettime - Date.now();
		var t2 = (el.targettime - Date.now())/1000;
		t = Math.max(0, t);
		var days = Math.floor(t / (24 * 60 * 60 * 1000));
		var hours = Math.floor(t / (60 * 60 * 1000)) % 24;
		var mins = Math.floor(t / (60 * 1000)) % 60;
		var sec = Math.floor(t / 1000) % 60;
		els.days.innerText = days;
		els.hours.innerText = (hours < 10 ? "0" + hours : hours);
		els.mins.innerText = (mins < 10 ? "0" + mins : mins);
		els.sec.innerText = (sec < 10 ? "0" + sec : sec);
		var coin = "The signal will be given here.</br>";
		if(5400 < t2 && t2 <=10800){
			coin += "3 hours till the " + defs.market + " pump!";
		}
		else if(3600 < t2 && t2 <=5400){
			coin += "1.5 hour left till the " + defs.market + " pump!";
		}
		else if(1800 < t2 && t2 <=3600){
			coin += "1 hour left till the " + defs.market + " pump!";
		}
		else if(900 < t2 && t2 <=1800){
			coin += "30 minutes  till the " + defs.market + " pump!";
		}
		else if(300 < t2 && t2 <=900){
			coin += "Dear members,</br>15 minutes left till the pump.</br>The post on the website will be a picture, same as in the Telegram chat. Be sure to be in the Telegram and on the website at the same time.";
		}
		else if(120 < t2 && t2 <=300){
			coin += "5 minutes left!";
		}
		else if(0 < t2 && t2 <=120){
			coin += "Final 2 Minutes..</br>Login to " + defs.market + " </br>Next message will be the coin!";
		}
		else if(t2 <= 0 && Math.abs(t2)<=3000){
			if(sitestate && defs.pumptext)
			{	
				coin = mcrypt.Decrypt(atob(sitestate.key), atob(defs.pumptext), sitestate.iv,  'rijndael-256', 'ecb');
				coin = 'The signal will be given here.</br><p>The coin is: </p> <img src="'+ base_url + 'assets/img/coin/' + coin.replace(/[^a-z0-9 ,.?!]/ig, '') + '.png">';
			}
			// else if(true)
			// {
				// coin = mcrypt.Decrypt(atob(sitestate.key), atob(defs.pumptext), sitestate.iv,  'rijndael-256', 'ecb');
				// coin = '<p>The coin is: </p> <img src="'+ base_url + 'assets/img/coin/' + coin.replace(/[^a-z0-9 ,.?!]/ig, '') + '.png">';
			// }
			
		}
		
		$("#signal").html(coin);
	}
	el.setTime = function () {
		var t = (el.targettime - Date.now() - 20) % 1000;
		setTimeout(function () {
			clearInterval(interval);
			interval = setInterval(tick, 1000);
			tick();
		},t);
		tick();
	}

	el.setTime(targettime);
	return el;
}

function test() {
	window.a = new Chatbox();
	a.loadChannels();
	elput(elid("signal").parentElement, a.root);
}

// drawChat.chatbox = null;
// function drawChat() {
	// drawChat.chatbox = drawChat.chatbox || new Chatbox();
	// drawChat.chatbox.loadChannels();
	// elput("chatcontainer", elfrag(eldiv("navfiller"), drawChat.chatbox.root));
// }


function showError(title, message, redirect_url) {
	showModal(elfrag(
		eldiv(":h3", [title]),
		eldiv(":p", [message])
	),null,redirect_url);
}

function showModal(content, width, redirect_url) {
	var root = eldiv("modal visible", [
		eldiv("pagepadding", { style: (width ? "width: " + width + "px" : "") }, [content])
	]);

	root.onclick = function (e) {
		if (e.target == root) {
			root.remove();
			if(redirect_url){
				window.location.href = redirect_url;
			}
		}
	}

	document.body.appendChild(root);

	return root;
}
