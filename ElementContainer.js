/*
 * Copyright (C) 2011 Thomas Dvornik
 * All rights reserved.
 *
 */

function ElementContainer(ele) {
  this.element = ele;
  this.oldBorder = ele.style.border;
  this.oldBgColor = ele.style.background;
  this.offsets = this.getOffset();
  
  this.overlay = document.createElement('div');
  this.overlay.setAttribute('class','xpathElementOverlay');
  this.overlay.style.left = this.offsets.left+'px';
  this.overlay.style.top = this.offsets.top+'px';
  this.overlay.style.width = this.element.offsetWidth+'px';
  this.overlay.style.height = this.element.offsetHeight+'px';
  this.overlay.style.display = 'none';
  document.body.appendChild(this.overlay);
}

ElementContainer.prototype.highlight = function() {
  this.element.style.border = 'solid 1px black';
  //this.element.style.background = 'yellow';
  this.overlay.style.display = 'none';
};

ElementContainer.prototype.select = function() {
  this.element.style.border = 'solid 1px red';
  //this.element.style.background = 'red';
  this.overlay.style.display = '';
};

ElementContainer.prototype.clear = function() {
  this.element.style.border = this.oldBorder;
  //this.element.style.background = this.oldBgColor;
  document.body.removeChild(this.overlay);
};

ElementContainer.prototype.getOffset = function() {
  var el = this.element;
  var _x = 0;
  var _y = 0;
  while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
    _x += el.offsetLeft - el.scrollLeft;
    _y += el.offsetTop - el.scrollTop;
    el = el.offsetParent;
  }
  return { top: _y, left: _x };
}