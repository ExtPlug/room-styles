

define('extplug/room-styles/main',['require','exports','module','extplug/Plugin','extplug/util/request','extplug/util/Style','underscore','jquery'],function (require, exports, module) {

  var Plugin = require('extplug/Plugin');
  var request = require('extplug/util/request');
  var Style = require('extplug/util/Style');
  var _ = require('underscore');
  var $ = require('jquery');

  var ranks = ['subscriber', 'host', 'cohost', 'manager', 'bouncer', 'dj', 'admin', 'ambassador'];

  var RoomStyles = Plugin.extend({
    name: 'Room Styles',
    description: 'Applies custom room-specific styles. ' + 'Supports both the plugCubed and Radiant Script formats.',

    init: function init(id, ext) {
      this._super(id, ext);
      this.unload = this.unload.bind(this);
      this.reload = this.reload.bind(this);
    },

    enable: function enable() {
      this._super();
      this.all();

      this.ext.roomSettings.on('change:images', this.images, this);
      this.ext.roomSettings.on('change:ccc change:colors', this.colors, this);
      this.ext.roomSettings.on('change:css', this.css, this);
    },

    disable: function disable() {
      this._super();
      this.unload();

      this.ext.roomSettings.off('change:images', this.images);
      this.ext.roomSettings.off('change:ccc change:colors', this.colors);
      this.ext.roomSettings.off('change:css', this.css);
    },

    reload: function reload() {
      this.unload();
      this.all();
    },

    _normalizeRanks: function _normalizeRanks(ranks) {
      // plug³ and RCS have different names for Resident DJ colours and icons.
      // we simply use the plug.dj icon classname instead.
      if (ranks.rdj && !ranks.dj) ranks.dj = ranks.rdj;
      if (ranks.residentdj && !ranks.dj) ranks.dj = ranks.residentdj;
      // plug³ room styles have an `icons` sub-property on their `images`
      // properties, but RCS doesn't. so we don't particularly care if it's
      // there or not.
      if (ranks.icons) ranks.icons = this._normalizeRanks(ranks.icons);
      return ranks;
    },

    colors: function colors() {
      var _this = this;

      if (this._colorStyles) {
        this._colorStyles.remove();
        this._colorStyles = null;
      }

      // plugCubed
      var colors = this.ext.roomSettings.get('colors');
      // Radiant
      var ccc = this.ext.roomSettings.get('ccc');

      var chatColors = colors && colors.chat || ccc;
      if (_.isObject(chatColors)) {
        this._colorStyles = new Style();

        chatColors = this._normalizeRanks(chatColors);
        ranks.forEach(function (level) {
          if (chatColors[level]) {
            var color = chatColors[level];
            if (color[0] !== '#') color = '#' + color;
            var value = { color: '' + color };
            var selector = [
            // chat
            '#chat .cm.role-' + level + ' .un',
            // user lists
            '.app-right .user.role-' + level + ' .name', '.list .user.role-' + level + ' .name',
            // rank name in user rollover
            '#user-rollover.role-' + level + ' .info .role span',
            // staff list headers
            '#app .list.staff .group.' + level + ' span',
            // other places where the role name is followed by the
            // role icon
            '.icon-chat-' + level + ' + span',
            // user profile
            '.role-' + level + ' .user-content.profile .meta .info .role span',
            // generic thing that other plugin devs can use
            '.role-' + level + ' .extplug-rank'];

            // special-case subscribers, because the subscriber text in
            // user rollovers doesn't have a usable class
            if (level === 'subscriber') {
              selector.push('#user-rollover .meta.subscriber .status span');
            }

            _this._colorStyles.set(selector.join(', '), value);
          }
        });
      }
    },

    css: function css() {
      if (this._cssStyles) {
        this._cssStyles.remove();
        this._cssStyles = null;
      }
      if (this._imports) {
        this._imports.remove();
        this._imports = null;
      }

      var css = this.ext.roomSettings.get('css');
      // plugCubed
      if (_.isObject(css)) {
        if (_.isObject(css.rule)) {
          this._cssStyles = new Style(css.rule);
        }

        if (_.isArray(css['import'])) {
          this._imports = $('<style>').text(css['import'].map(function (url) {
            return '@import url(' + url + ');';
          }).join('\n')).appendTo('head');
        }
      }
      // Radiant
      else if (_.isString(css)) {
          this._imports = $('<style>').text('@import url(' + css + ');').appendTo('head');
        }
    },

    images: function images() {
      var _this2 = this;

      if (this._imageStyles) {
        this._imageStyles.remove();
        this._imageStyles = null;
      }
      if (this.$booth) {
        this.$booth.remove();
        this.$booth = null;
      }
      if (this._oldPlayback) {
        $('#playback .background img').attr('src', this._oldPlayback);
        this._oldPlayback = null;
      }

      var images = this.ext.roomSettings.get('images');
      if (_.isObject(images)) {
        (function () {
          var style = new Style();
          _this2._imageStyles = style;
          if (images.background) {
            style.set({
              '.room-background': {
                'background-image': 'url(' + images.background + ') !important'
              }
            });
          }
          if (images.playback) {
            var playbackImg = $('#playback .background img');
            _this2._oldPlayback = playbackImg.attr('src');
            playbackImg.attr('src', images.playback);
          }
          if (images.booth) {
            style.set({
              '.extplug-booth': {
                'position': 'absolute',
                'width': '300px',
                'height': '100px',
                'left': '15px',
                'top': '135px',
                'z-index': -1
              }
            });
            _this2.$booth = $('<div />')
            // plug³ compatibility
            .attr('id', 'p3-dj-booth').addClass('extplug-booth').css({ 'background': 'url(' + images.booth + ') no-repeat center center' }).appendTo($('#dj-booth'));
          }

          images = _this2._normalizeRanks(images);
          ranks.forEach(function (rank) {
            var url = images[rank] || images.icons && images.icons[rank];
            if (url) {
              var selector = '.icon.icon-chat-' + rank;
              // special-case cohosts, because they also have the "chat-host" icon
              // class sometimes
              if (rank === 'host' || rank === 'cohost') {
                selector += ', .role-' + rank + ' .icon-chat-host';
              }
              // special-case subscribers, because the subscriber text in
              // user rollovers doesn't have an icon class
              if (rank === 'subscriber') {
                selector += ', #user-rollover .meta.subscriber .status i';
              }
              style.set(selector, { background: 'url(' + url + ')' });
            }
          });
        })();
      }
    },

    all: function all() {
      this.colors();
      this.css();
      this.images();
    },

    unload: function unload() {
      if (this._colorStyles) {
        this._colorStyles.remove();
        this._colorStyles = null;
      }
      if (this._cssStyles) {
        this._cssStyles.remove();
        this._cssStyles = null;
      }
      if (this._imageStyles) {
        this._imageStyles.remove();
        this._imageStyles = null;
      }
      if (this.$booth) {
        this.$booth.remove();
        this.$booth = null;
      }
      if (this._oldPlayback) {
        $('#playback .background img').attr('src', this._oldPlayback);
        this._oldPlayback = null;
      }
      if (this._imports) {
        this._imports.remove();
        this._imports = null;
      }
    }

  });

  module.exports = RoomStyles;
});
