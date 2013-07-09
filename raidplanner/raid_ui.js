/*global $ jQuery console document window */

var RAID_PLANNER = function() {
  var raid_changed_p = false;
  var class_regex =
    /deathknight|druid|hunter|mage|paladin|priest|rogue|shaman|warlock|warrior/;

  // could factor this out into show_message(where, source);
  var context_help = function(source_id) {
    /* TODO: Find a good effect for this -- when it changes, it should
     * pulsate or highlight or something.
     */
    $('#contexthelp').text($('#' + source_id).text());
  };

  /* Source must not be empty -- target may or may not be empty */
  var swap_players = function(source, target) {
    if (target.hasClass('ui-draggable-disabled')) {
      target = target.parent().children(':empty').eq(0);
      target.draggable('enable');
      source.draggable('disable');
    }

    var target_wowclass = target.attr('class').match(class_regex);
    var source_wowclass = source.attr('class').match(class_regex);
    var source_text = source.text();

    source.removeClass(source_wowclass).text(target.text());
    if (target_wowclass) {
      source.addClass(target_wowclass[0]);
      target.removeClass(target_wowclass[0]);
    }
    target.addClass(source_wowclass[0]).text(source_text);
  };

  var compact_group = function(empty_slot) {
    var players =
      empty_slot.nextAll().not(':empty').not('.ui-draggable-dragging');
    if (players.length > 0 ) {
      swap_players(players.eq(players.length - 1), empty_slot);
    }
  };

  var finished_edit = function(event, name) {
    $(event.target)
      .unbind('keypress blur')
      .parent()
        .text(name.replace(/[^a-zA-Z0-9 \(\)\.\-\,]/g, ''))
        .dblclick(RAID_PLANNER.edit_player);
    context_help('arrange');
  };

  var raid_changed = function() {
    if (!raid_changed_p) {
      $('#savearea').html('<input type="button" value="Save" />')
        .children().eq(0)
          .click(RAID_PLANNER.save_raid);
      raid_changed_p = true;
    }
  };

  var raid_saved = function(id) {
    var url_parts = window.location.href.split('/');
    if (/[0-9]|^$/.test(url_parts[url_parts.length - 1])) {
      url_parts.pop();
    }
    url_parts.push(id);
    window.location = url_parts.join('/');
  };

  var save_failed = function() {
    $('#savearea').html($('#save_error').html());
  };

  return {
  /* Public methods */
    player_dropped: function(event, ui) {
      swap_players(ui.draggable, $(this));
      if (ui.draggable.hasClass('ui-draggable-disabled')) {
        compact_group(ui.draggable);
      }
      raid_changed();
    },

    add_player: function(source) {
      var target = $('#raidwindow > div > div:empty()').eq(0);
      target.text(source.text())
        .addClass(source.attr('class'))
        .draggable('enable');
      context_help('arrange');
      raid_changed();
    },

    player_trashed: function(event, ui) {
      var player = ui.draggable;
      var wowclass = player.attr('class').match(class_regex);
      player.removeClass(wowclass).text('').draggable('disable');
      compact_group(player);
      raid_changed();
    },

    init: function() {
      $('#playerwell > div').click(function () {
        RAID_PLANNER.add_player($(this));
      });

      $('#raidwindow > div > div')
        .droppable({
          accept: 'div',
          hoverClass: 'droptarget',
          drop: RAID_PLANNER.player_dropped
        })
        .draggable({
          helper: 'clone',
          appendTo: 'body',   // appendTo: and zIndex: are needed to make
          zIndex: 1000        // IE render correctly during drag
        })
        .dblclick(RAID_PLANNER.edit_player)
        .filter(':empty').draggable('disable');

      $('#trashcan').droppable({
        accept: 'div',
        hoverClass: 'droptarget',
        drop: RAID_PLANNER.player_trashed
      });

      if (jQuery.cookie('saved') == 'true') {
        jQuery.cookie('saved', null);
        $('#savearea').text($('#saved').text());
      }

      if ($('#raidwindow > div > div').not(':empty').length < 25) {
        context_help('add');
      }
      else {
        context_help('arrange');
      }
    },

    edit_player: function() {
      var old_text = $(this).text();
      if (old_text === '') {
        return;
      }

      $(this)
        .unbind('dblclick')
        .html('<input type="text" value="' + old_text + '" maxlength="40" />')
        .children().eq(0).bind('keydown', function(e){
          if (e.keyCode == 9) { //tab
            finished_edit(e, old_text);
          }
          else if (e.keyCode == 27) { //esc
            finished_edit(e, old_text);
          }
          else if (e.keyCode == 13) { //enter
            var new_text = $(e.target).val();
            if (jQuery.trim(new_text) === '') {
              finished_edit(e, old_text);
            }
            else {
              finished_edit(e, new_text);
              raid_changed();
            }
          }
        }).bind('blur', function(e) {
          finished_edit(e, old_text);
        }).get(0).select();
      context_help('edit');
    },

    save_raid: function() {
      var i = 0;
      var post_data = "";
      $('#raidwindow > div > div').each(function(){
        var wowclass = $(this).attr('class').match(class_regex);
        wowclass = wowclass !== null ? wowclass[0] : '';
        if (post_data !== '') {
          post_data += '&';
        }
        post_data += 'player[' + i + '][name]=' + $(this).text() +
                    '&player[' + i + '][class]=' + wowclass;
        i++;
      });

      jQuery.cookie('saved', 'true');
      jQuery.ajax({
        type: 'POST',
        url: 'save',
        data: post_data,
        success: raid_saved,
        error: save_failed
      });

      $('#savearea').html('<img src="saving.gif" alt="saving" height="4px" width="32px"><br />Saving...');
    }

  };
}();

$(document).ready(RAID_PLANNER.init);
