var uttbk = uttbk || {};

(function(app) {

  'use strict';

  var key = '0Al1OX7SsGsfvdHFfSFAyXzRoUnVISV9XUnUyX1NlOVE',
      url = '//spreadsheets.google.com/feeds/cells/' +
            key +
            '/od6/public/basic?alt=json-in-script&callback=uttbk.handleData',
      calendarUtils,
      dinners = {};

  $(function() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    $(document.body).append(script);
  });

  calendarUtils = (function() {

    var $calendarEl = $('#uttbk-calendar'),
        $popupEl = $('#uttbk-popup'),
        pageHeight = $(document).outerHeight(),
        pageWidth = $(document).outerWidth(),
        $detailsEl = $('#uttbk-details'),
        $seatsEl = $('#uttbk-seats'),
        currMonth,
        currYear,
        popupLock,
        rapidFireEnterBlocker,
        rapidFireExitBlocker;

    return {
      init: function () {
        var self = this,
            currDate;
        $calendarEl.datepicker({
          onChangeMonthYear: function(year, month) {
            currMonth = month;
            currYear = year;
            window.setTimeout(function() {
              self.addClassToAllDinnerDates();
            }, 5);
          },
          onSelect: function()  {
            window.setTimeout(function() {
              self.addClassToAllDinnerDates();
            }, 5);
          }
        });
        currDate = $calendarEl.datepicker('getDate');
        currMonth = currDate.getMonth() + 1;
        currYear = currDate.getFullYear();
        this.addClassToAllDinnerDates(currMonth + '/{day}/' + currYear);

        $calendarEl.on('mouseenter', '.dinner-date', this.showPopup);
        $calendarEl.on('mouseleave', '.dinner-date', this.hidePopup);
        $popupEl.on('mouseenter', undefined, function (e) {
          popupLock = true;
        });
        $popupEl.on('mouseleave', undefined, function (e) {
          popupLock = false;
          $popupEl.hide();
        });
      },

      showPopup: function(e) {
        e.stopPropagation();
        if (rapidFireEnterBlocker) {
          window.clearTimeout(rapidFireEnterBlocker);
        }
        var el = this;
        rapidFireEnterBlocker = window.setTimeout(function() {
          var dinnerInfo = dinners[currMonth + '/' + $(el).find('a').text() + '/' + currYear],
              offset = $(el).offset(),
              mouseX = offset.left,
              mouseY = offset.top + $(el).outerHeight(),
              popupWidth,
              popupHeight;
          $detailsEl.text(dinnerInfo.description);
          $seatsEl.text(dinnerInfo.remaining);
          popupWidth = $popupEl.outerWidth();
          popupHeight = $popupEl.outerHeight();
          if (popupWidth + mouseX > pageWidth) {
            mouseX = pageWidth - popupWidth;
          }
          if (popupHeight + mouseY > pageHeight) {
            mouseY = pageHeight - popupHeight;
          }
          mouseX = mouseX < 0 ? 0 : mouseX;
          mouseY = mouseY < 0 ? 0 : mouseY;
          $popupEl.css({'top': mouseY,'left': mouseX});
          $popupEl.show();
        }, 30);
      },

      hidePopup: function(e) {
        e.stopPropagation();
        if (rapidFireExitBlocker) {
          window.clearTimeout(rapidFireExitBlocker);
        }
        rapidFireExitBlocker = window.setTimeout(function() {
          if (popupLock) {
            return;
          }
          $popupEl.hide();
        }, 30);
      },

      addClassToAllDinnerDates: function () {
        var monthYear = currMonth + '/{day}/' + currYear;
        $('.ui-datepicker-calendar').find('td')
                                    .not('.ui-state-disabled')
                                    .each(function(i, el) {
                                      var $el = $(el),
                                          day = $el.find('a').text(),
                                          date = monthYear.replace('{day}', day);
                                      if (dinners[date]) {
                                        $el.addClass('dinner-date');
                                      }
                                    });
      }
    };
  }());

  app.handleData = function(data) {
    data = data.feed && data.feed.entry;
    if (!data || !data.length) {
      return;
    }

    // Parse response.
    var i,
        len,
        entry,
        row,
        column,
        contents,
        rowsToDates = {},
        parseCellData;

    // Functions to handle the data in the different columns
    parseCellData  = {
      'A': function(data, row) {
        rowsToDates[row] = data;
        dinners[data] = {};
      },
      'B': function(data, row) {
        dinners[rowsToDates[row]].description = data;
      },
      'C': function(data, row) {
        dinners[rowsToDates[row]].remaining = data;
      }
    };


    for (i = 0, len = data.length; i < len; i++) {
      entry = data[i];
      row = parseInt(entry.title.$t.replace(/[a-zA-Z]/g, ''), 10);
      if (row > 1) {
        column = entry.title.$t.replace(/[0-9]/g, '');
        contents  = entry.content.$t;
        parseCellData[column](contents, row);
      }
    }

    calendarUtils.init();

  };

}(uttbk));

