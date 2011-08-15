/*
 * Copyright (C) 2011 Thomas Dvornik
 * All rights reserved.
 *
 */

var xpathBox = new XPathBox();
document.body.appendChild(xpathBox.element);

document.oncontextmenu = handleContextMenu;
document.onmousedown = handleMouseDown;
document.onmouseup = handleMouseUp;
document.onmousemove = handleMouseMove;

function handleContextMenu(e) {
  // We don't want the context menu when xPath box is open
  // except on the input so the user can copy and paste with
  // right click.
  if (xpathBox.visable && e.target != xpathBox.input) {
    e.preventDefault();
    e.stopPropagation();

    // Only display the path if the context is not on the
    // xPath box. The user shouldn't want the path of a component
    // we added.
    if (!xpathBox.isParent(e.target)) {
      var path;
      if (document.getElementById('cssselectorBox').checked) {
        console.log('\nCSS for selected element:');
        path = getElementCSSPath(e.target);
      } else {
        console.log('\nxPath for selected element:');
        path = getElementXPath(e.target);
      }
      console.log(path);
      xpathBox.clearOutput();
      xpathBox.clearError();
      xpathBox.appendOutput(path);
    }
    return false;
  }
  return true;
}

function handleMouseDown(e) {
  if (xpathBox.visable && xpathBox.isXPathBoxSelected(e.target)) {
    // Don't want to move on right click
    if (e.which == 3) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    } else {
      xpathBox.setOffset(e.clientX, e.clientY);
      xpathBox.movable = true;
      e.preventDefault();
      e.stopPropagation();
    }
  }
}

function handleMouseUp() {
  xpathBox.movable = false;
}

function handleMouseMove(e) {
  if (xpathBox.visable && xpathBox.movable) {
    xpathBox.move(e.clientX, e.clientY);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

function cssSearch(cssstring) {
  xpathBox.clearOutput();
  xpathBox.clearError();
  
  var nodes = document.querySelectorAll(cssstring);
  
  for (var i=0; i<nodes.length; i++) {
     console.log(nodes[i]);
     xpathBox.appendOutput(elementToString(nodes[i]), nodes[i]);
     
     if (i > 9) {
       xpathBox.setError("Only 10 results displayed, but "+count+" were found. Please refine your search");
       break;
     }
  }
  
  if (nodes.length == 0) {
    xpathBox.setError("No results found");
  }
  return nodes.length;
}

// Refactor everything below this mark

function xpathSearch(xpath) {
  try {
    xpathBox.clearOutput();
    xpathBox.clearError();
    
  var nodes = document.evaluate(xpath, document, null,
      XPathResult.ANY_TYPE, null);

      //xpathBox.appendOutput(nodes.resultType);    
      //return 1; 
  
  // Result types defined at https://developer.mozilla.org/en/introduction_to_using_xpath_in_javascript
  // 1 is a number 
  if (nodes.resultType == '1') {
    xpathBox.appendOutput(nodes.numberValue);    
    return 1;
  }
  // 3 is a boolean
  if (nodes.resultType == '3') {
    xpathBox.appendOutput(nodes.booleanValue);    
    return 1;
  }
  
  var node = nodes.iterateNext();
  var count = 0, res = new Array();

  try {
    while (node) {
      var parent = xpathBox.isParent(node);
      if (!parent && count < 10) {
        res.push(node);
      }
      if (!parent) {
        count++;
      }
      node = nodes.iterateNext();
    }
  } catch (e) {
    console.log(e);
    xpathBox.setError(e);
  }

  for (var i = 0; i < res.length; i++) {
    console.log(res[i]);
    xpathBox.appendOutput(elementToString(res[i]), res[i]);
    
    //TODO need to check for other object. For example, a query 
    // with '/text()' will display '[object Text]' in the output panel
  }
  
  if (count > 9) {
    xpathBox.setError("Only 10 results displayed, but "+count+" were found. Please refine your search");
  }
  if (count == 0) {
    xpathBox.setError("No results found");
  }
  return count;
  }
  catch (ex) {
    xpathBox.clearOutput();
    xpathBox.clearError();
    /*var s = '';
    for (var key in ex) {
      s += key + ' ';
    }
    s = 'Name: '+ex.name +'; Message: '+ex.message+ '; Code: '+ex.code +'; Type: '+ex.TYPE_ERR;*/
    if (ex.name == 'INVALID_EXPRESSION_ERR') {
      var errMsg = 'Invalid xPath Expression.';
      xpathBox.setError(errMsg);
      console.log(errMsg);
    } else {
      xpathBox.setError(ex.message);
      console.log(ex.message);
    }
    return 0;
  }
}

function elementToString(element) {
  if (element instanceof Text) {
    var s = '';
    for (var key in element) {
      s += key + ' ';
    }
    return element.textContent;
  }
  if (!(element instanceof HTMLElement))
    return element;

  var string = '&lt;' + element.tagName.toLowerCase();

  var i = 0, attNum = 0;
  var atts = element.attributes;
  for (; i < atts.length; i++) {
    var nname = atts[i].nodeName;
    string += ' ' + atts[i].nodeName + '="' + atts[i].nodeValue + '"';
  }
  
  string += '&gt;';
  return string;
}

/*
 * I want to display the html of the element, but right now the formatting gets all messed up. 
 * Going to put this function on hold until I get the extension done, then revisit this.
*/
function elementDisplayString(element) {
  if (!(element instanceof HTMLElement))
    return element;

  var string = '<' + element.tagName.toLowerCase();

  var attNum = 0;
  var atts = element.attributes;
  var i;
  for (i = 0; i < atts.length; i++) {
    var nname = atts[i].nodeName;
    if (nname != "id" && nname != "style" && nname != "class") {
      string += ' ' + atts[i].nodeName + '="' + atts[i].nodeValue + '"';
    }
  }

  string += '>' + elementToString(element.innerHTML) + '</' + element.tagName + '>';
  //alert(string);
  return string;
}

function getElementXPath(elt) {
  var path = "";
  for (; elt && elt.nodeType == 1; elt = elt.parentNode) {
    idx = getElementIdx(elt);
    xname = elt.tagName.toLowerCase();
    if (idx > 1)
      xname += "[" + idx + "]";
    path = "/" + xname + path;
  }

  return path;
}

function getElementCSSPath(elem) {
  var tagName = elem.tagName.toLowerCase();
  // id is unique, so we can stop here
  if (elem.id) {
    return "#" + elem.id;
  }
  // reached the top level element, so we can return
  if (elem.tagName == "BODY") {
    return '';
  }
  var path = getElementCSSPath(elem.parentNode);
  if (elem.className) {
    // concatenate all the classes together 
    return path + " " + tagName + "." + elem.className.split(' ').join('.');
  }
  return path + " " + tagName;
}

function getElementIdx(elt) {
  var count = 1;
  for ( var sib = elt.previousSibling; sib; sib = sib.previousSibling) {
    if (sib.nodeType == 1 && sib.tagName == elt.tagName)
      count++;
  }

  return count;
}
