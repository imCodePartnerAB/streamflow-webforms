/*
 *
 * Copyright 2009-2010 Streamsource AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * Module for handling all outgoing requests
 */
var RequestModule = (function() {
    var inner = {};

    function request(type, url) {
        return {type:type, url:url, async:false, cache:false, error:errorPopup, dataType:'json'};
    }

    function getData( parameters ) {
        var data;
        parameters.success = function(arg) { data = arg; };
        $.ajax(parameters);
        return data;
    }

    function errorPopup() {
        alert( texts.erroroccurred );
        throw "http call failed";
    }

    function invoke( fn, arguments, message ) {
        var failed = false;
        arguments.error = function() {  failed = true; };
        var result = fn( arguments );
        if ( failed ) {
            throw message;
        }
        return result;
    }

    inner.init = function( contextRoot, accesspoint ) {
        UrlModule.init( contextRoot, accesspoint );
        verifyAccessPoint();
        selectEndUser();
        UrlModule.setUserUrl( getUser() );
    }

    function verifyAccessPoint() {
        var parameters = request('GET', UrlModule.verifyAccessPoint() );
        invoke( $.ajax, parameters, texts.invalidaccesspoint );
    }

    function selectEndUser() {
        var parameters = request('POST', UrlModule.selectEndUser() );
        invoke( $.ajax, parameters, texts.loginfailed );
    }

    function getUser() {
        var parameters = request('GET', UrlModule.getUser() );
        return invoke( getData, parameters, texts.loginfailed ).entity;
    }

    inner.getCaseForm = function() {
        var parameters = request('GET', UrlModule.getCaseForm() );
        parameters.error = null;
        return getData( parameters );
    }

    inner.getFormDraft = function() {
        var params = request('GET', UrlModule.getFormDraft() );
        return getData( params );
    }

    inner.createCaseWithForm = function() {
        var parameters = request('POST', UrlModule.createCaseWithForm() );
        return getData( parameters );
    }

    inner.updateField = function( fieldDTO ) {
        var parameters = request('POST', UrlModule.updateField() );
        parameters.data = fieldDTO;     
        return getData( parameters );
    }

    inner.submitAndSend = function() {
        var parameters = request('POST', UrlModule.submitAndSend() );
        $.ajax( parameters );
    }

    inner.discard = function() {
        var parameters = request('POST', UrlModule.discard() );
        $.ajax( parameters );
    }

    inner.getFormSignatures = function() {
        var parameters = request('GET', UrlModule.getFormSignatures() );
        return getData( parameters ).signatures;
    }

    inner.getProviders = function() {
        var parameters = request('GET', UrlModule.getProviders() );
        return getData( parameters );
    }

    inner.getHeader = function() {
        var parameters = request('GET', UrlModule.getHeader() );
        parameters.dataType = null;
        return invoke( getData, parameters, texts.eidServiceUnavailable );
    }
    
    inner.getCaseName = function() {
        var parameters = request('GET', UrlModule.getCaseName() );
        return getData( parameters ).caseId;
    }

    inner.sign = function( signDTO ) {
        var parameters = request('GET', UrlModule.sign() );
        parameters.dataType = null;
        parameters.data = signDTO;        
        return getData( parameters );
    }

    inner.verify = function( verifyDTO ) {
        var parameters = request('POST', UrlModule.verify() );
        parameters.data = verifyDTO;
        invoke( $.ajax, parameters, {error: texts.verifyfailed, redirect:'summary'} );
    }

    inner.attach = function( attachmentDTO ) {
        attachmentDTO.url = UrlModule.attach();
        $.ajaxFileUpload( attachmentDTO );
    }

    inner.refreshField = function( fieldId ) {
        var parameters = request('GET', UrlModule.refreshField() );
        parameters.data = { string: fieldId };
        return getData( parameters ).value;
    }

    return inner;
}());