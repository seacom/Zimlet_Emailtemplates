/*
 * ***** BEGIN LICENSE BLOCK *****
 * Version: ZPL 1.1
 *
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.1 ("License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.zimbra.com/license
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is: Zimbra Collaboration Suite.
 *
 * The Initial Developer of the Original Code is Zimbra, Inc.
 * Portions created by Zimbra are Copyright (C) 2005 Zimbra, Inc.
 * All Rights Reserved.
 *
 * Contributor(s): @autor Nicola Pagni <nicolap@seacom.it>
 *
 * ***** END LICENSE BLOCK *****
 */
 
 
 
/**
 * Constructor.
 * 
 * @author Nicola Pagni
 */
function it_seacom_emailtemplatesHandlerObject() {
}
it_seacom_emailtemplatesHandlerObject.prototype = new ZmZimletBase();
it_seacom_emailtemplatesHandlerObject.prototype.constructor = it_seacom_emailtemplatesHandlerObject;

var emailtemplates = it_seacom_emailtemplatesHandlerObject;

//--------------------------------------------------------------------------------------------------
// INIT AND INITIALIZE TOOLBAR MENU BUTTON
//--------------------------------------------------------------------------------------------------
emailtemplates.prototype.init = function() {	
	this._folderPath = this.getUserProperty("etemplates_sourcefolderPath");
	this._folderId = this.getUserProperty("etemplates_sourcefolderId");
	this._createFolderRequest();
};


/** Called by the Zimbra framework for define the actions of the zimlet panel
*/
emailtemplates.prototype.menuItemSelected = function(itemId) {
	switch (itemId) {
		case "NEW_TEMPLATE": {	
			this._openComposeMsgView();
			break;
		}
        case "SETTINGS": {	
			this._displayPrefDialog();
			break;
		}
		case "ABOUT_SEACOM": {
			this._createAboutPage();
			break;
		}
    }
};

emailtemplates.prototype._createAboutPage = function(){
	var view = new DwtComposite(this.getShell()); 
	view.setSize("350", "230");
	var html = new Array();
	html.push(
		"<div class='center-holder'>",
			"<div class='center'>",
				"<p class='big'>Zimlet EmailTemplate 1.0</p>",
				"<p>powered by Seacom Srl</p>",
			"</div>",
		"</div>",
		"<div class='med center-holder'>",
			"<div class='center' id='zpm_logo'>",
			"</div>",
		"</div>",
		"<div class='med center-holder'>",
			"<p>Copyright 2014 Seacom Srl<br /><a href='http://www.seacom.it'>http://www.seacom.it</a></p>",
		"</div>"
	);
	view.getHtmlElement().innerHTML = html.join("");
	var dialog = new ZmDialog({
		title : this.getMessage("about_poweredByTitle"), 
		view : view, 
		parent : this.getShell(), 
		standardButtons : [DwtDialog.OK_BUTTON]
	});
	dialog.getButton(DwtDialog.OK_BUTTON).setImage("TasksApp");
	dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, function() {dialog.popdown();}));
	dialog.popup(); 
}


emailtemplates.prototype.onMsgView = function(msg, oldMsg) {
	var patternSignature = /\*\*\*\[EMAIL_TEMPLATE\]\*\*\*\ssubject:\s\S*/;	
	var isTemplate = patternSignature.test(msg.subject);	
	if(isTemplate){
		this._showMessage(this.getMessage("EmailTemplatesZimlet_isTemplate"));
	}
};


emailtemplates.prototype._openComposeMsgView =
function() {
	// Tries to open the compose view on its own.
	var composeController = AjxDispatcher.run("GetComposeController");
	if(composeController) {
		var callback = new AjxCallback(this, this._openComposeMsgViewCallback);
		var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:false, 
		toOverride:null, subjOverride:null, extraBodyText:null, callback: callback}
		composeController.doAction(params); // opens asynchronously the window.
	}
};


emailtemplates.prototype._openComposeMsgViewCallback = function(response){
	var emailZimbraAccount = appCtxt.getActiveAccount().name;
	var composeView = response._composeView;
	composeView.setAddress(AjxEmailAddress.TO, emailZimbraAccount);
};


emailtemplates.prototype._getFolderRequest = function(callback){
	var soapDoc = AjxSoapDoc.create("GetFolderRequest", "urn:zimbraMail");
	var errorCallback = new AjxCallback(this, this._getFolderRequestErrCallback);
	
	var folder = soapDoc.set("folder");
	
	//path folder
	folder.setAttribute("path", this._folderPath);

	//Send the soap request to create a template folder
	appCtxt.getAppController().sendRequest({ soapDoc: soapDoc, asyncMode: true, callback: callback, errorCallback: errorCallback });
};


emailtemplates.prototype._getFolderRequestErrCallback = function(response){	
	if(response && response.code == "mail.NO_SUCH_FOLDER"){
		this.setUserProperty("etemplates_sourcefolderPath", "");
		this.setUserProperty("etemplates_sourcefolderId", "");
		var callback = new AjxCallback(this, this._handleSaveProperties, true);
		this.saveUserProperties(callback);
	}
};

emailtemplates.prototype._getFolderRequestCallback = function(response){	
	if(response){
		this._folderId = response.getResponse().GetFolderResponse.folder[0].id;
		this.setUserProperty("etemplates_sourcefolderId", this._folderId);
		var callback = new AjxCallback(this, this._handleSaveProperties, this.needRefresh);
		this.saveUserProperties(callback);
	}
};


emailtemplates.prototype._createFolderRequest = function(){
	if(this._folderPath != ""){
		this._getFolderRequest();
	}else{
		var soapDoc = AjxSoapDoc.create("CreateFolderRequest", "urn:zimbraMail");
		var callback = new AjxCallback(this, this._createFolderRequestCallback);
		var folder = soapDoc.set("folder");
		
		//name folder  
		folder.setAttribute("name", this.getMessage("EmailTemplatesZimlet_name"));
		
		//color folder
		folder.setAttribute("color", "2");
			
		//acl
		var acl = soapDoc.set("mp", null, folder);

		//Send the soap request to create a template folder
		appCtxt.getAppController().sendRequest({ soapDoc: soapDoc, asyncMode: true, callback: callback });
	}
};

emailtemplates.prototype._createFolderRequestCallback = function(response) {
	this._folderPath = response.getResponse().CreateFolderResponse.folder[0].name;
	this._folderId = response.getResponse().CreateFolderResponse.folder[0].id;
	this.setUserProperty("etemplates_sourcefolderPath", this._folderPath);
	this.setUserProperty("etemplates_sourcefolderId", this._folderId);
	var callback = new AjxCallback(this, this._handleSaveProperties, false);
	this.saveUserProperties(callback);
};

emailtemplates.prototype.initializeToolbar = function(app, toolbar, controller, viewId) {
	this._currentViewId = viewId;
	this._toolbar = toolbar;
	if (!this._viewIdAndMenuMap) {
		this._viewIdAndMenuMap = [];
	}
	if (viewId.indexOf("COMPOSE") >= 0) {
		if (toolbar.getOp("EMAIL_TEMPLATES_ZIMLET_TOOLBAR_BUTTON")) {
			return;
		}
		// get the index of View menu so we can display it after that.
		var buttonIndex = 3;

		// create params obj with button details
		var buttonArgs = {
			text	: this.getMessage("EmailTemplatesZimlet_name"),
			tooltip	: this.getMessage("EmailTemplatesZimlet_tooltip"),
			index	: buttonIndex, //position of the button
			image	: "zimbraicon" //icon
		};

		// toolbar.createOp api creates the button with some id and  params containing button details.
		var button = toolbar.createOp("EMAIL_TEMPLATES_ZIMLET_TOOLBAR_BUTTON", buttonArgs);
		var menu = new ZmPopupMenu(button); //create menu
		button.setMenu(menu);//add menu to button
		button.noMenuBar = true;
		this._viewIdAndMenuMap["COMPOSE-1"] = {
			menu:menu, 
			controller:controller, 
			button:button
		};
		button.removeAllListeners();
		button.removeDropDownSelectionListener();
		button.addSelectionListener(new AjxListener(this, this._addMenuItems, [button, menu]));
		button.addDropDownSelectionListener(new AjxListener(this, this._addMenuItems, [button, menu]));
	}
};

emailtemplates.prototype._addMenuItems = function(button, menu) {
if (!menu._loaded) {
		this._getRecentEmails(false);
		menu._loaded = true;
	} else {
		var bounds = button.getBounds();
		menu.popup(0, bounds.x, bounds.y + bounds.height, false);
	}
};


//--------------------------------------------------------------------------------------------------
// TEST TEMPLATE FOR GENERIC WORDS AND THEN INSERT
//--------------------------------------------------------------------------------------------------
emailtemplates.prototype._getRecentEmails = function(removeChildren) {
	if (this._folderPath == "") {
		this._getRecentEmailsHdlr(removeChildren);
		return;
	}
	var getHtml = appCtxt.get(ZmSetting.VIEW_AS_HTML);
	var callbck = new AjxCallback(this, this._getRecentEmailsHdlr, removeChildren);
	var _types = new AjxVector();
	_types.add("MSG");

	appCtxt.getSearchController().search({query: ["in:(\"",this._folderPath,"\")"].join(""), userText: true, limit:25,  searchFor: ZmId.SEARCH_MAIL,
		offset:0, types:_types, noRender:true, getHtml: getHtml, callback:callbck, errorCallback:callbck});
};

emailtemplates.prototype._getRecentEmailsHdlr = function(removeChildren, result) {
	var menu = this._viewIdAndMenuMap["COMPOSE-1"].menu;
	if (removeChildren) {
		menu.removeChildren();
	}
	if (result) {
		if(result.code == "mail.NO_SUCH_FOLDER"){
			appCtxt.setStatusMsg(this.getMessage("EmailTemplatesZimlet_folderNotExist"), ZmStatusView.LEVEL_WARNING);
			this._addStandardMenuItems(menu);
			
			this.setUserProperty("etemplates_sourcefolderPath", "");
			this.setUserProperty("etemplates_sourcefolderId", "");
			var callback = new AjxCallback(this, this._handleSaveProperties, true);
			this.saveUserProperties(callback);
			return;
		}
		var array = result.getResponse().getResults("MSG").getVector().getArray();
		var mi = menu.createMenuItem("list_template", {image:"Doc", text:this.getMessage("EmailTemplatesZimlet_listTemplates"), style:DwtMenuItem.CASCADE_STYLE});
		// mi.addSelectionListener(new AjxListener(this, this._makeDlgListTemplate, [array]));
		mi.addSelectionListener(new AjxListener(this, this._refreshTemplates));
	}
	
	this._addStandardMenuItems(menu);
	
	var button = this._viewIdAndMenuMap["COMPOSE-1"].button;
	var bounds = button.getBounds();
	menu.popup(0, bounds.x, bounds.y + bounds.height, false);
	
	if (removeChildren) {
		menu.removeChildren();
	}
};


emailtemplates.prototype._refreshTemplates = function() {
	if (this._folderPath != "") {
		var getHtml = appCtxt.get(ZmSetting.VIEW_AS_HTML);
		var _types = new AjxVector();
		_types.add("MSG");

		var callback = new AjxCallback(this, this._refreshTemplatesCallback);
		appCtxt.getSearchController().search({query: ["in:(\"",this._folderPath,"\")"].join(""), userText: true, limit:25,  searchFor: ZmId.SEARCH_MAIL,
			offset:0, types:_types, noRender:true, getHtml: getHtml, callback:callback, errorCallback:callback});
	}else{
		this._showMessage(this.getMessage("EmailTemplatesZimlet_noFolderTemplate"));
	}
};

emailtemplates.prototype._refreshTemplatesCallback = function(response) {
	if (response) {
		if(response.code == "mail.NO_SUCH_FOLDER"){
			appCtxt.setStatusMsg(this.getMessage("EmailTemplatesZimlet_folderNotExist"), ZmStatusView.LEVEL_WARNING);
			this.setUserProperty("etemplates_sourcefolderPath", "");
			this.setUserProperty("etemplates_sourcefolderId", "");
			var callback = new AjxCallback(this, this._handleSaveProperties, true);
			this.saveUserProperties(callback);
			return;
		}
		var arrayTemplates = response.getResponse().getResults("MSG").getVector().getArray();
		this._makeDlgListTemplate(arrayTemplates);
	}
};


emailtemplates.prototype._makeDlgListTemplate = function(listTemplate) {
	if(listTemplate.length == 0){
		this._showMessage(this.getMessage("EmailTemplatesZimlet_noTemplate"));
		return;
	}

	//creo il composite
	var compListTemplate = new DwtComposite(this.getShell());
	compListTemplate.getHtmlElement().innerHTML = this._listTemplateHTML(listTemplate);
	
	this._setEventOnClickToEmails();
	
	//creo l'interfaccia
	var dlgListTemplate = new ZmDialog({title: this.getMessage("EmailTemplatesZimlet_listViewTemplates"), view:compListTemplate, parent:this.getShell(),
										standardButtons:[DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON]});
						 
	//visualizza
	dlgListTemplate.popup();
	
	//A seconda della destinazione scelta in sugarCRM viene eseguita una specifica funzione di menagement
	dlgListTemplate.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, function() { dlgListTemplate.popdown(); dlgListTemplate.dispose(); this._insertMsg(this._templateSelected)}));
	dlgListTemplate.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, function() { dlgListTemplate.popdown(); dlgListTemplate.dispose(); }));
};


emailtemplates.prototype._listTemplateHTML = function(listTemplate) {
	var html = new Array();
	html.push(	
		"<div class=\"scrollit\">",
			"<table width=\"500px\" class=\"emailTemplate-table\">",
				this._additemToListTemplate(listTemplate),
			"</table>",
		"</div>"
	);
	return html.join("");
};


emailtemplates.prototype._additemToListTemplate = function(listTemplate) {
	var array = new Array();
	this._EmailTemplateArrayMsg = new Array();
	for (var i = 0; i < listTemplate.length; i++) {
		var msg = listTemplate[i];
		var patternSignature = /\*\*\*\[EMAIL_TEMPLATE\]\*\*\*\ssubject:\s([\S\s]*)/;
		var subject = msg.subject.match(patternSignature)[1];
		var id = msg.id;
		this._EmailTemplateArrayMsg.push(msg);
		array.push("<tr id=\"email_template_" + id + "\"><td title=\"" + msg.getFragment() + "\">" + subject + "</td></tr>");
	}
	return array.join("");
};


emailtemplates.prototype._addAutoCompleteHandler = function() {
	if (appCtxt.get(ZmSetting.CONTACTS_ENABLED) || appCtxt.get(ZmSetting.GAL_ENABLED)) {
		var params = {
			dataClass:		appCtxt.getAutocompleter(),
			matchValue:		ZmAutocomplete.AC_VALUE_EMAIL,
			separator:		"",
			contextId:		this.name
		};
		this._acAddrSelectList = new ZmAutocompleteListView(params);
		this._acAddrSelectList.handle(document.getElementById("autoCompleteField"));
	}
};


emailtemplates.prototype._setEventOnClickToEmails = function() {
	var elem = null;
	for(var i = 0; i < this._EmailTemplateArrayMsg.length; i++){ 
		elem = document.getElementById("email_template_" + this._EmailTemplateArrayMsg[i].id);
		elem.onclick = AjxCallback.simpleClosure(this._setMsgSelected, this, this._EmailTemplateArrayMsg[i], elem);
	}
};

emailtemplates.prototype._setMsgSelected = function(msg, elem) {
	var composeView = appCtxt.getCurrentView();
	if(this._prevElem) {
		this._prevElem.style.backgroundColor = "";
	}
	elem.style.backgroundColor = "Snow";
	this._prevElem = elem;
	this._templateSelected = msg;
};


emailtemplates.prototype._addStandardMenuItems = function(menu) {
	var mi = menu.createMenuItem("saveModelEmail", {image:"NewMessage", text:this.getMessage("EmailTemplatesZimlet_saveModelEmail")});
	mi.addSelectionListener(new AjxListener(this, this._saveModelEmail));
	var mi = menu.createMenuItem("helpModelEmail", {image:"Help", text:this.getMessage("EmailTemplatesZimlet_helpModelEmail")});
	mi.addSelectionListener(new AjxListener(this, this._helpModelEmail));
	var mi = menu.createMenuItem("aboutModelEmail", {image:"seacom-panelIcon", text:this.getMessage("about")});
	mi.addSelectionListener(new AjxListener(this, this._createAboutPage));
};


emailtemplates.prototype._helpModelEmail = function() {
	var html = [];
	html.push(
		"<br/><div class='emailTemplates_yellow'>",this.getMessage("EmailTemplatesZimlet_genericNames"),"</div><div  class='emailTemplates_yellowNormal'>",
		"<br/>",this.getMessage("EmailTemplatesZimlet_helpLine1"),
		"<br/> ",this.getMessage("EmailTemplatesZimlet_helpLine2"),
		"<br/><br/>",this.getMessage("EmailTemplatesZimlet_helpLine3"),
		"<br/>",this.getMessage("EmailTemplatesZimlet_helpLine4"),
		"<br/>", this.getMessage("EmailTemplatesZimlet_helpLine5"),
		"<br/>", this.getMessage("EmailTemplatesZimlet_helpLine6"),
		"<br/><br/><br/><div class='emailTemplates_yellow'>",this.getMessage("EmailTemplatesZimlet_helpLine7"),"</div>",
		"<br/>",this.getMessage("EmailTemplatesZimlet_helpLine8"),
		"<br/>",this.getMessage("EmailTemplatesZimlet_helpLine9"),
		"</div>");
	this._showMessage(html.join(""), 700, 470);
};


//--------------------------------------------------------------------------------------------------
// LOAD SELECTED MESSAGE/TEMPLATE
//--------------------------------------------------------------------------------------------------
emailtemplates.prototype._insertMsg = function(msg) {
	this.msg = msg;
	this.msg.load({callback: new AjxCallback(this, this._handleLoadedMsg)});
};


emailtemplates.prototype._handleLoadedMsg = function() {
	var controller = this._viewIdAndMenuMap["COMPOSE-1"].controller;
	var composeView = appCtxt.getCurrentView();
	var currentBodyContent = currentBodyContent = appCtxt.getCurrentView().getHtmlEditor().getContent();
	this._composeMode = appCtxt.getCurrentView().getHtmlEditor().getMode();
	var saperator = (this._composeMode == DwtHtmlEditor.HTML) ? "</br>" : "\r\n";
	var templateBody = this.getTemplateContent(this.msg, this._composeMode);

	//insert subject before tag replacement
	var patternSignature = /\*\*\*\[EMAIL_TEMPLATE\]\*\*\*\ssubject:\s([\S\s]*)/;
	var subject = this.msg.subject.match(patternSignature)[1];
	composeView._subjectField.value = subject;
	//insert body before tag replacement
	composeView._htmlEditor.setContent([templateBody, saperator, currentBodyContent].join(""));
	
	var params = {controller:controller, templateSubject:this.msg.subject, templateBody: templateBody,  currentBodyContent:currentBodyContent, composeView:composeView};
	this._testTemplateContentForKeys(params);
};

//--------------------------------------------------------------------------------------------------
// TEST TEMPLATE FOR GENERIC WORDS AND THEN INSERT
//--------------------------------------------------------------------------------------------------

emailtemplates.prototype._testTemplateContentForKeys = function(params) {
	var regex = new RegExp("\\$\\{[-a-zA-Z._0-9]+\\}", "ig");
	var templateBody = params.templateBody;
	var templateSubject = params.templateSubject;
	var bodyArry = templateBody.match(regex);
	var subjectArry;
	if (templateSubject) {
		subjectArry = templateSubject.match(regex);
	}
	if (bodyArry != null || subjectArry != null) {
		params["bodyArry"] = bodyArry;
		params["subjectArry"] = subjectArry;
		this._showReplaceStringsDlg(params);
	} else {
		this._doInsert(params.controller, params.composeView, params.templateSubject, params.templateBody, params.currentBodyContent, params.insertMode);
	}
};

emailtemplates.prototype._showReplaceStringsDlg = function(params) {
	if (this.replaceDlg) {
		this.replaceDlg.params = params;
		this._createReplaceView(params);
		if(this._foundContactTags){
			//Aggiungo l'handler per l'autocompletamento
			this._addAutoCompleteHandler();
			
			this.buttAutoComplete = new DwtButton({ parent: this.replaceDlgView, parentElement: "autoCompleteButtField"});
			this.buttAutoComplete.setText(this.getMessage("EmailTemplatesZimlet_buttComplete"));	
			this.buttAutoComplete.addSelectionListener(new AjxListener(this, this._autoCompleteContactField));   
		}
		this.replaceDlg.popup();
		this._addTabControl();
		return;
	}
	this.replaceDlgView = new DwtComposite(this.getShell());
	this.replaceDlgView.getHtmlElement().style.overflow = "auto";
	this._createReplaceView(params);
	this.replaceDlg = this._createDialog({
		title:this.getMessage("EmailTemplatesZimlet_replaceTemplateData"), 
		view:this.replaceDlgView, 
		standardButtons:[DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON]
	});

	if(this._foundContactTags){
		//Aggiungo l'handler per l'autocompletamento
		this._addAutoCompleteHandler();
		
		this.buttAutoComplete = new DwtButton({ 
			parent: this.replaceDlgView, 
			parentElement: "autoCompleteButtField"
		});
		this.buttAutoComplete.setText(this.getMessage("EmailTemplatesZimlet_buttComplete"));	
		this.buttAutoComplete.addSelectionListener(new AjxListener(this, this._autoCompleteContactField));   
	}
	this.replaceDlg.params = params;
	this.replaceDlg.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._replaceOKBtnListener));
	this.replaceDlg.popup();
	this._addTabControl();
};


emailtemplates.prototype._autoCompleteContactField = function() {
	var emailInserted = document.getElementById("autoCompleteField").value;
	this._contactList = AjxDispatcher.run("GetContacts").getArray();
	var attrsContact = null;
	var found = false;
	var i = 0;
	while(!found && i < this._contactList.length - 1){
		if(typeof(this._contactList[i].toString()) != "undefined" && this._contactList[i].toString() == "ZmContact") {
			attrsContact = (typeof(this._contactList[i].attr) != "undefined") ? this._contactList[i].attr : null;
		}else{
			attrsContact = (typeof(this._contactList[i]._attrs) != "undefined") ? this._contactList[i]._attrs : null;
		}
		if(attrsContact && attrsContact.email == emailInserted){
			found = true;
		}else{
			i++;
		}
	}
	attrsContact = this._convertContactAttrsInTags(attrsContact);
	if(found){
		this._fillContactField(attrsContact);
	}
};


emailtemplates.prototype._convertContactAttrsInTags = function(attrsContact) {
	if(!attrsContact){
		return;
	}
	var contactTags = this.getConfig("default_contact_tag_" + getZimbraLanguage()).split(",");
	var tagsContactArray = new Array();
	var newFieldName = "";
	for(fieldName in attrsContact){
		for(var i = 0; i < contactTags.length; i++){
			if(contactTags[i].split(":")[0] == fieldName){
				tagsContactArray[contactTags[i].split(":")[1]] = attrsContact[fieldName];
			}
		}
	}
	return tagsContactArray;
};


emailtemplates.prototype._fillContactField = function(attrsContact) {
	var id = "";
	var key = "";
	for(var i = 0; i < this._replaceFieldIdsMap.length; i++){
		id = this._replaceFieldIdsMap[i].id;
		key = attrsContact[this._replaceFieldIdsMap[i].key];
		document.getElementById(id).value = (typeof(key) == "undefined") ? "" : key;
	}
};


emailtemplates.prototype._createReplaceView = function(params) {
	var bodyArry = params.bodyArry;
	var subjectArry = params.subjectArry;
	var dataArry = [];
	if (subjectArry != null && subjectArry != undefined) {
		dataArry = subjectArry;
	}
	if (bodyArry != null && bodyArry != undefined) {
		dataArry = dataArry.concat(bodyArry);
	}
	var tmpArry = [];
	for (var j = 0; j < dataArry.length; j++) {
		tmpArry.push(AjxStringUtil.trim(dataArry[j]));
	}
	dataArry = emailtemplates_unique(tmpArry);
	//Here have to do a check if exists a contact tag
	var contactTags = this.getConfig("default_contact_tag_" + getZimbraLanguage()).split(",");
	var contactTagsArray = new Array();
	for(var i = 0; i < contactTags.length; i++){
		contactTagsArray.push(contactTags[i].split(":")[1]);
	}
	
	var found = false;
	this._foundContactTags = false;
	var i = 0;
	while(!found && i < dataArry.length){
		if(inArray(contactTagsArray, dataArry[i]) != -1){
			found = true;
			this._foundContactTags = found;
		}else{
			i++;
		}
	}

	this._replaceFieldIds = [];
	this._replaceFieldIdsMap = [];
	var i = 0;
	var html = new Array();
	if(found){
		html[i++] = "<div class='emailTemplates_yellow'>"+this.getMessage("EmailTemplatesZimlet_replaceContactData")+"</div><BR/>";
		html[i++] = "<TABLE  class='emailTemplates_table' width=100% cellspacing=3 cellpadding=3>";
		html[i++] = ["<TR><TD><DIV style='font-weight:bold;'>Contatto</div></TD><TD><input type=text id='autoCompleteField'></input></TD><TD id='autoCompleteButtField'></TD></TR>"].join("");
		html[i++] = "</TABLE>";
	}
	html[i++] = "<BR/><div class='emailTemplates_yellow'>"+this.getMessage("EmailTemplatesZimlet_replaceGenericData")+"</div><BR/>";
	html[i++] = "<TABLE  class='emailTemplates_table' width=100% cellspacing=3 cellpadding=3>";
	for (var k = 0; k < dataArry.length; k++) {
		var key = dataArry[k];
		var id = Dwt.getNextId();
		this._replaceFieldIds.push(id);
		this._replaceFieldIdsMap.push({key:key, id:id});
		html[i++] = ["<TR><TD><DIV style='font-weight:bold;'>", key, "</div></TD><TD><input type=text id='" + id + "'></input></TD></TR>"].join("");
	}
	html[i++] = "</TABLE>";
	this.replaceDlgView.getHtmlElement().innerHTML = html.join("");
};


/**
 * Adds tab control for Account Preferences' fields
 */
emailtemplates.prototype._addTabControl = function() {
	this.replaceDlg._tabGroup.removeAllMembers();
	for (var i = 0; i < this._replaceFieldIds.length; i++) {
		var obj = document.getElementById(this._replaceFieldIds[i]);
		if (obj) {
			this.replaceDlg._tabGroup.addMember(obj);
		}
	}
	this.replaceDlg._tabGroup.addMember(this.replaceDlg.getButton(DwtDialog.OK_BUTTON));
	this.replaceDlg._tabGroup.addMember(this.replaceDlg.getButton(DwtDialog.CANCEL_BUTTON));

	document.getElementById(this._replaceFieldIds[0]).focus();
};

emailtemplates.prototype._replaceOKBtnListener = function() {
	var params = this.replaceDlg.params;
	var templateBody = params.templateBody;
	var templateSubject = params.templateSubject;
	var currentBodyContent = params.currentBodyContent;
	for (var i = 0; i < this._replaceFieldIdsMap.length; i++) {
		var obj = this._replaceFieldIdsMap[i];
		var key = obj.key;
		key = key.replace(/\$\{/,"\\$\\{").replace(/\}$/, "\\}");
		var regEx = new RegExp(key, "ig");
		var val = document.getElementById(obj.id).value;
		templateSubject = templateSubject.replace(regEx, val);
		templateBody = templateBody.replace(regEx, val);
	}
	this.replaceDlg.popdown();
	this._doInsert(params.controller, params.composeView, templateSubject, templateBody, currentBodyContent);
};

emailtemplates.prototype._doInsert = function(controller, composeView, templateSubject, templateBody, currentBodyContent) {

	//insert subject
	var patternSignature = /\*\*\*\[EMAIL_TEMPLATE\]\*\*\*\ssubject:\s([\S\s]*)/;
	var subject = templateSubject.match(patternSignature)[1];
	composeView._subjectField.value = subject;

	//insert body
	var saperator = "\r\n";
	if ((this._composeMode == DwtHtmlEditor.HTML)) {
		saperator = "</br>";
	}

	//in email, we append templatebody ABOVE currentBodyContent to facilitate Reply/Fwd emails
	composeView._htmlEditor.setContent([templateBody, saperator, currentBodyContent].join(""));
	
	if(this.msg.attachments && this.msg.attachments.length > 0) {
		this._isDrafInitiatedByThisZimlet = true;
		controller.saveDraft(ZmComposeController.DRAFT_TYPE_AUTO);
	}
};

emailtemplates.prototype.addExtraMsgParts = function(request, isDraft) {
	if(!isDraft || !this._isDrafInitiatedByThisZimlet) {
		return;
	}
	if(request && request.m) {
		if(!request.m.attach) {
			request.m.attach = {};
			request.m.attach.mp = [];
		} else if(!request.m.attach.mp) {
			request.m.attach.mp = [];
		}
		var attmnts = this.msg.attachments;
		if(attmnts) {			
			for(var i = 0; i < attmnts.length; i++) {
				request.m.attach.mp.push({mid:this.msg.id, part:attmnts[i].part});
			}
		}
	}
	this._isDrafInitiatedByThisZimlet = false;
};

emailtemplates.arrayContainsElement = function(array, val) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] == val) {
			return true;
		}
	}
	return false;
}

function emailtemplates_unique(b) {
	var a = [], i, l = b.length;
	for (i = 0; i < l; i++) {
		if (!emailtemplates.arrayContainsElement(a, b[i])) {
			a.push(b[i]);
		}
	}
	return a;
}

emailtemplates.prototype.getTemplateContent = function(note, mode) {
	var body = "";
	var body = note.getBodyContent();
	if (note.isHtmlMail() && mode == ZmMimeTable.TEXT_PLAIN) {
		var div = document.createElement("div");
		div.innerHTML = note.getBodyContent();
		return AjxStringUtil.convertHtml2Text(div);
	} else if (!note.isHtmlMail() && mode == ZmMimeTable.TEXT_HTML) {
		return AjxStringUtil.convertToHtml(note.getBodyContent());
	} else {
		return body;
	}
};

//--------------------------------------------------------------------------------------------------
// SHOW PREFERENCE DIALOG
//--------------------------------------------------------------------------------------------------
emailtemplates.prototype._displayPrefDialog = function() {
	if (this.prefDlg) {
		this.prefDlg.popup();
		return;
	}
	this.pView = new DwtComposite(this.getShell());
	this.pView.getHtmlElement().style.overflow = "auto";
	this.pView.getHtmlElement().innerHTML = this._createPreferenceView();
	this.prefDlg = this._createDialog({title:this.getMessage("EmailTemplatesZimlet_preferences"), view:this.pView, standardButtons:[DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON]});
	this.prefDlg.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._prefOKBtnListener));
	this._initializePrefDialog();
	this.prefDlg.popup();
};


emailtemplates.prototype._createPreferenceView = function() {
	var str = "Templates folder not set";
	if (this._folderPath != "") {
		str = this._folderPath;
	}
	var html = new Array();
	var i = 0;
	html.push("<TABLE cellspacing=3 cellpadding=3>",
		"<TR><TD><DIV style='font-weight:bold;'>",this.getMessage("EmailTemplatesZimlet_templateFolderPath"),
		"</div></TD><TD><DIV style='color:blue;font-weight:bold;' id='emailtemplates_folderInfo'>",str,"</div></TD></TR>",
		"<TR><TD colspan=2><DIV id='emailtemplates_folderLookupDiv'></DIV></TD></TR></TABLE>");
	return html.join("");
};

emailtemplates.prototype._initializePrefDialog = function() {
	var btn = new DwtButton({parent:this.getShell()});
	btn.setText(this.getMessage("EmailTemplatesZimlet_setTemplatesFolder"));
	btn.setImage("Search");
	btn.setToolTipContent(this.getMessage("EmailTemplatesZimlet_selectTemplatesFolder"));
	btn.addSelectionListener(new AjxListener(this, this._setFolderBtnListener));
	document.getElementById("emailtemplates_folderLookupDiv").appendChild(btn.getHtmlElement());
};


emailtemplates.prototype._prefOKBtnListener = function() {
	if (this.needRefresh) {
		this.setUserProperty("etemplates_sourcefolderPath", this._folderPath);
		//Salvo l'Id della nuova folder
		var callback = new AjxCallback(this, this._getFolderRequestCallback);
		this._getFolderRequest(callback);
		var callback = new AjxCallback(this, this._handleSaveProperties, this.needRefresh);
		this.saveUserProperties(callback);
	}
	this.prefDlg.popdown();
};

emailtemplates.prototype._setFolderBtnListener = function() {
	if (!this._chooseFolderDialog) {
		AjxDispatcher.require("Extras");
		this._chooseFolderDialog = new ZmChooseFolderDialog(appCtxt.getShell());
	}
	this._chooseFolderDialog.reset();
	this._chooseFolderDialog.registerCallback(DwtDialog.OK_BUTTON, this._chooseFolderOkBtnListener, this, this._chooseFolderDialog);

	var params = {
		treeIds:		[ZmOrganizer.FOLDER],
		title:			this.getMessage("EmailTemplatesZimlet_selectTemplatesFolder"),
		overviewId:		this.toString(),
		description:	"",
		skipReadOnly:	false,
		hideNewButton:	false,
		appName:		ZmApp.MAIL,
		omit:			[]
	};
	this._chooseFolderDialog.popup(params);
};

emailtemplates.prototype._chooseFolderOkBtnListener = function(dlg, folder) {
	dlg.popdown();
	var fp = folder.getPath();
	this.needRefresh = false;
	if (this._folderPath != fp) {
		this.needRefresh = true;
	}
	this._folderPath = fp;
	document.getElementById("emailtemplates_folderInfo").innerHTML = this._folderPath;
};

emailtemplates.prototype._handleSaveProperties = function(needRefresh) {
	appCtxt.setStatusMsg("Preferences Saved", ZmStatusView.LEVEL_INFO);
	if (needRefresh) {
		this.showYesNoDialog();
	}
};

//--------------------------------------------------------------------------------------------------
// SEND EMAIL AND SAVE MODEL EMAIL
//--------------------------------------------------------------------------------------------------

emailtemplates.prototype._saveModelEmail = function() {
	var controller = appCtxt.getCurrentController();
	var signatureEmailTemplate = "***[" + this.getMessage("EmailTemplatesZimlet_signature") + "]***";
	controller._composeView._subjectField.value = signatureEmailTemplate + " subject: " + controller._composeView._subjectField.value;
	var callback = new AjxCallback(this, this._getResponseCallback);
	controller.sendMsg(null, null, callback);
};


emailtemplates.prototype._getResponseCallback = function(response) {
	var emailID = response.getResponse().m[0].id;
	this._moveEmailInTemplateFolder(emailID, this._folderId, "move");
};


emailtemplates.prototype._moveEmailInTemplateFolder =
function(msgId, destFolderId, op){
	var soapDoc = AjxSoapDoc.create("MsgActionRequest", "urn:zimbraMail");
	var callback = new AjxCallback(this, this._getFolderRequestCallback);
	
	var action = soapDoc.set("action");
	
	//msg ID
	action.setAttribute("id", msgId);
	
	//folder ID
	action.setAttribute("l", destFolderId);
	
	//type operation
	action.setAttribute("op", op);

	//Send the soap request to move an email in a template folder
	appCtxt.getAppController().sendRequest({ 
		soapDoc: soapDoc, 
		asyncMode: true, 
		callback: null 
	});
};


//--------------------------------------------------------------------------------------------------
// SHOW YES NO DIALOG TO REFRESH BROWSER
//--------------------------------------------------------------------------------------------------
emailtemplates.prototype.showYesNoDialog = function() {
	var dlg = appCtxt.getYesNoMsgDialog();
	dlg.registerCallback(DwtDialog.YES_BUTTON, this._yesButtonClicked, this, dlg);
	dlg.registerCallback(DwtDialog.NO_BUTTON, this._NoButtonClicked, this, dlg);
	dlg.setMessage(this.getMessage("EmailTemplatesZimlet_refreshBrowser"), DwtMessageDialog.WARNING_STYLE);
	dlg.popup();
};

emailtemplates.prototype._yesButtonClicked = function(dlg) {
	dlg.popdown();
	this._refreshBrowser();
};

emailtemplates.prototype._NoButtonClicked = function(dlg) {
	dlg.popdown();
};

emailtemplates.prototype._refreshBrowser = function() {
	window.onbeforeunload = null;
	var url = AjxUtil.formatUrl({});
	ZmZimbraMail.sendRedirect(url);
};



// This function prints objects in a new tab, usefull for degug
function mostra(inobj){
	var op = window.open();
	op.document.open('text/plain');
	for (var objprop in inobj) {
		op.document.write(objprop + ' => ' + inobj[objprop] + '\n');
	}
	op.document.close();
}

function inArray (arr, element){
	var i = 0;
	for ( var value = arr[0]; i < arr.length && value !== element; value = arr[++i] ){ }
	if(i < arr.length){
		return i;
	}
	return -1;
}	


/**Salva il contenuto di una email
*
*	@param {ZmmailMsg} email : la email
*	
*	@return	{String} Il body della email
*/
function getMailBodyAsText (email) {
	var body = "";
	var bodyTemp = "";
	if (email.body) {
		body = AjxStringUtil.htmlEncode(email.body);
	} else if (email._topPart && email._topPart.getContentForType) {
		body = AjxStringUtil.htmlEncode(email._topPart.getContentForType(ZmMimeTable.TEXT_PLAIN));
	} else {
		body = "";
	}

	if (!body || body == "") {
		if (!email.isHtmlMail()) {
			return email.getBodyContent();
		}
		var div = document.createElement("div");
		div.innerHTML = email.getBodyContent();
		return AjxStringUtil.convertHtml2Text(div);
	} else {
		return  body;
	}	
};

function getZimbraLanguage() {
	return AjxEnv.DEFAULT_LOCALE;
};

emailtemplates.prototype._showMessage = function(expnMsg, heigh, width) { 
	var msg = "";
	if (expnMsg instanceof AjxException) {
		msg = expnMsg.msg;
	} else {
		msg = expnMsg;
	}
	var dlg = new DwtMessageDialog({parent:this.getShell(), buttons:[DwtDialog.OK_BUTTON]});
	dlg.reset();
	dlg.setMessage(msg);
	dlg.setSize(heigh, width);
	dlg.popup();
};