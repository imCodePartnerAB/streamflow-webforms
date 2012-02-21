/*
 *
 * Copyright 2009-2012 Streamsource AB
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
var PersistModule = (function () {
    var inner = {};
	var store = new Persist.Store('Cases Data Store');
   
	var PAGE_SIZE_CASES = 'SF_MYPAGES_CASES_PAGESIZE';

    inner.setCasesPageSize = function (value) {
    	store.set(PAGE_SIZE_CASES, value);
    };
    
    inner.getCasesPageSize = function (callback) {
    	store.get(PAGE_SIZE_CASES, callback);
    };
    
    return inner;
}());