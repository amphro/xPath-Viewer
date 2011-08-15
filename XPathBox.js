/*
 * Copyright (C) 2011 Thomas Dvornik
 * All rights reserved.
 *
 */

function XPathBox() {
  this.element = document.createElement('div');
  this.element.setAttribute('id', 'xpathBox');
  this.element.style.left = '100px';
  this.element.style.top = '100px';

  this.titleEle = document.createElement('span');
  this.titleEle.setAttribute('id', 'xpathBoxTitle');
  this.titleEle.innerHTML = 'Enter xPath: ';
  this.element.appendChild(this.titleEle);
  
  function find() {
    var userInput = document.getElementById('xpathInput').value;
    if (userInput) {
      var count = 0;
      if (document.getElementById('cssselectorBox').checked) {
        console.log("CSS Selector: " + userInput);
        count = cssSearch(userInput);
      } else {
        console.log("xPath: " + userInput);
        count = xpathSearch(userInput);
      }
      var disWarn = count > 9 ? ', but only showing 10. Please refine your search.' : '.';
      console.log("Search returned " + count + " results" + disWarn);
    }
  };

  this.input = document.createElement('input');
  this.input.setAttribute('id', 'xpathInput');
  this.input.setAttribute('type', 'text');
  this.input.setAttribute('name', 'inputbox');

  this.input.onkeypress = function(event) {
    if(event.keyCode == 13){
      find();
    }
  };
  this.element.appendChild(this.input);

  this.button = document.createElement('input');
  this.button.setAttribute('type', 'button');
  this.button.setAttribute('name', 'button');
  this.button.setAttribute('value', ' Find ');

  this.button.onclick = find;

  this.element.appendChild(this.button);
  
  this.useCssDiv = document.createElement('span');
  this.useCssDiv.innerHTML = "Use CSS:";

  this.useCssDiv.setAttribute('id', 'useCssDiv');
  
  this.cssCheckbox = document.createElement('input');
  this.cssCheckbox.setAttribute('id', 'cssselectorBox');
  this.cssCheckbox.setAttribute('type', 'checkbox');
  this.cssCheckbox.setAttribute('name', 'cssselector');
  this.cssCheckbox.setAttribute('alt', 'Enable CSS');
  
  var checkbox = this.cssCheckbox;
  var title = this.titleEle;
  
  chrome.extension.sendRequest({att: "get", param: 'useCssSelectors'}, 
    function(response) {
      if (response.val === 'true') {
        checkbox.checked = true;
        title.innerHTML = 'Enter CSS: ';
      }
    });
    
  function changeSearchTitle() {
    var box = document.getElementById('xpathBoxTitle');
    var checked = document.getElementById('cssselectorBox').checked;
    if (checked) {
      box.innerHTML = "Enter CSS: ";
    } else {
      box.innerHTML = "Enter xPath: ";
    }
    chrome.extension.sendRequest({att: "set", param: 'useCssSelectors', val: checked}, 
      //TODO: Add some sort of error handeling?
      function(response) {});
  }
  
  this.cssCheckbox.onclick = changeSearchTitle;

  this.useCssDiv.appendChild(this.cssCheckbox);
  this.element.appendChild(this.useCssDiv);
  
  this.error = document.createElement('div');
  this.error.setAttribute('class', 'xpathError');
  this.error.setAttribute('style', 'display: none');
  this.element.appendChild(this.error);

  this.output = document.createElement('div');
  this.output.setAttribute('width', '500px');
  this.element.appendChild(this.output);

  this.count = 0;

  this.offsetx;
  this.offsety;
  this.nowX;
  this.nowY;
  this.movable = false;
  this.visable = true;
  
  this.foundElements = new Array();
}

XPathBox.prototype.highlightFoundElements = function(clearFoundElements) {
  for (var i = 0; i < this.foundElements.length; i++) {
    this.foundElements[i].highlight();
  }
}

XPathBox.prototype.clearHighlights = function(clearFoundElements) {
  clearFoundElements = typeof(clearFoundElements) != 'undefined' ? clearFoundElements : true;
  for (var i = 0; i < this.foundElements.length; i++) {
    this.foundElements[i].clear();
  }
  if (clearFoundElements) {
    this.foundElements = new Array();
  }
};

XPathBox.prototype.setOutput = function() {
  this.output.innerHTML = 'Output:\n';
};

XPathBox.prototype.clearOutput = function() {
  this.output.innerHTML = '';
  this.clearHighlights();
};

XPathBox.prototype.setError = function(errorMsg) {
  this.error.setAttribute('style', 'display: block');
  this.error.innerHTML = errorMsg;
};

XPathBox.prototype.clearError = function() {
  this.error.setAttribute('style', 'display: none');
  this.error.innerHTML = '';
  this.count = 0;
};

/**
 * Append a row to the xPath box output in the following format.
 * <number>. [output]
 */
XPathBox.prototype.appendOutput = function(elementOrText, origElement) {
  this.count++;
  var container = document.createElement('div');
  container.setAttribute('class', 'xpathFoundContainer');

  var number = document.createElement('div');
  number.innerHTML = this.count + '.';
  number.setAttribute('class', 'xpathFoundNumber');

  var text = document.createElement('div');
  text.innerHTML = elementOrText + '&nbsp;';
  text.setAttribute('class', 'xpathFoundStyle');
  
  container.appendChild(number);
  container.appendChild(text);

  this.output.appendChild(container);
  
  if (origElement instanceof HTMLElement) {
    var eleCont = new ElementContainer(origElement);
    eleCont.highlight();
    this.foundElements.push(eleCont);
    container.onmouseover = function() {
      eleCont.select();
    };
    container.onmouseout = function() {
      eleCont.highlight();
    };
  }
};

/**
 * Determines if the given element part of the xPath box
 */
XPathBox.prototype.isXPathBoxSelected = function(element) {
  return element != this.input && element != this.button
      && (element == this.element || element == this.output);
};

/**
 * Sets the offset values so the xPath box will move from the current 
 * possition
 */
XPathBox.prototype.setOffset = function(x, y) {
  this.offsetx = x;
  this.offsety = y;

  var temp = this.element.style.left;
  temp = temp.substring(0, temp.length - 2);
  this.nowX = parseInt(temp);
  temp = this.element.style.top;
  temp = temp.substring(0, temp.length - 2);
  this.nowY = parseInt(temp);
};

/**
 * Move the xPath box. NOTE: Must call setOffset first!!
 */
XPathBox.prototype.move = function(x, y) {
  this.element.style.left = (this.nowX + x - this.offsetx) + 'px';
  this.element.style.top = (this.nowY + y - this.offsety) + 'px';
};

/**
 * Hide the xPath box
 */
XPathBox.prototype.hide = function() {
  this.element.style.visibility = "hidden";
  this.clearHighlights(false);
};

/**
 * Show the xPath box
 */
XPathBox.prototype.show = function() {
  this.element.style.visibility = "visible";
  this.highlightFoundElements();
};

/**
 * Hide/Show the xPath box
 */
XPathBox.prototype.toggleVisability = function() {
  this.visable = !this.visable;
  if (this.visable) {
    this.show();
  } else {
    this.hide();
  }
};

/** 
 * Determine if the xPath box is a parent of the given element by
 * following and checking the element's parent's id.
 */
XPathBox.prototype.isParent = function(ele) {
  if (ele.id == 'xpathBox') {
    return true;
  }
  for (;ele = ele.parentNode;) {
    if (ele.id == 'xpathBox') {
      return true;
    }
  }  
  //while (ele) {
  //  if (ele == this.element)
  //    return true;
  //  ele = ele.parentNode;
  //}
  return false;
};
