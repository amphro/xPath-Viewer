/*
 * Copyright (C) 2011 Thomas Dvornik
 * All rights reserved.
 *
 */
 
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.browserAction == 'clicked') {
    if (window.xpathBox) {
       window.xpathBox.toggleVisability();
    }
    else {
       sendResponse({error: "load"});
    }
  }
});