

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
      this.colors = this.colors.bind(this);
      this.css = this.css.bind(this);
      this.images = this.images.bind(this);
      this.unload = this.unload.bind(this);
      this.reload = this.reload.bind(this);
    },

    enable: function enable() {
      this._super();
      this.all();

      this.ext.roomSettings.on('change', this.reload);
    },

    disable: function disable() {
      this._super();
      this.unload();
      this.ext.roomSettings.off('change', this.reload);
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

      // plugCubed
      var colors = this.ext.roomSettings.get('colors');
      // Radiant
      var ccc = this.ext.roomSettings.get('ccc');

      var chatColors = colors && colors.chat || ccc;
      if (_.isObject(chatColors)) {
        (function () {
          var colorStyles = _this.Style();

          chatColors = _this._normalizeRanks(chatColors);
          ranks.forEach(function (level) {
            if (chatColors[level]) {
              var color = chatColors[level];
              if (color[0] !== '#') color = '#' + color;
              var value = { color: '' + color + ' !important' };
              colorStyles.set('#chat-messages .icon-chat-' + level + ' ~ .un', value).set('#user-rollover .icon-chat-' + level + ' + span', value).set('#user-lists    .icon-chat-' + level + ' + span', value).set('#waitlist      .icon-chat-' + level + ' + span', value);
            }
          });
        })();
      }
    },

    css: function css() {
      var css = this.ext.roomSettings.get('css');
      // plugCubed
      if (_.isObject(css)) {
        if (_.isObject(css.rule)) {
          this.Style(css.rule);
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

      var images = this.ext.roomSettings.get('images');
      if (_.isObject(images)) {
        (function () {
          var style = _this2.Style();
          if (images.background) {
            style.set({
              '.room-background': {
                'background-image': 'url(' + images.background + ') !important'
              }
            });
          }
          if (images.playback) {
            var playbackImg = _this2.$('#playback .background img');
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
            .attr('id', 'p3-dj-booth').addClass('extplug-booth').css({ 'background': 'url(' + images.booth + ') no-repeat center center' }).appendTo(_this2.$('#dj-booth'));
          }

          images = _this2._normalizeRanks(images);
          ranks.forEach(function (rank) {
            var url = images[rank] || images.icons && images.icons[rank];
            if (url) {
              style.set('.icon.icon-chat-' + rank, {
                background: 'url(' + url + ')'
              });
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
      if (this.$booth) {
        this.$booth.remove();
        this.$booth = null;
      }
      if (this._oldPlayback) {
        this.$('#playback .background img').attr('src', this._oldPlayback);
        delete this._oldPlayback;
      }
      if (this._imports) {
        this._imports.remove();
        this._imports = null;
      }
      this.removeStyles();
    }

  });

  module.exports = RoomStyles;
});
