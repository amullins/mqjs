Named media queries access from javascript.  
\* compatible with [zepto.js][1]

```javascript
var app = (function($, exports){

  // setup a named media query "sm"
  // names should not contain a colon
  $.mq({ 'sm' : '(min-width: 768px)' });

  /**
   * one of our nav items is styled as a button on larger displays but needs
   * to be styled like the rest of the items for small screens
   */
  function initResponsiveNav() {
    var clazz = 'nav__button',
        $btns = $('.header__nav .' + clazz);
    
    // note the "is:" prefix... you can use the "not:" prefix to reverse things. defaults to "is"
    $.mq('is:sm', {
      onMatch : function() {
        // style as button and uncheck hidden checkbox
        $btns.addClass(clazz);
        $('#chk-menu').prop('checked', 0);
      },
      onUnmatch : function() {
        // style as normal link
        $btns.removeClass(clazz);
      }
    });
  }
  
  exports.init = function() {
    initResponsiveNav();
    
    // it's often required that mqjs be run onDomReady
    $.mq('call:runOnce');
  };
  
  return exports;
  
})(jQuery, {}); // could also use Zepto, here


$(app.init); // init onDomReady
```

  [1]: http://zeptojs.com/