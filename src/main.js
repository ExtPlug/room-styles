define(function (require, exports, module) {

  const Plugin = require('extplug/Plugin');
  const request = require('extplug/util/request');
  const Style = require('extplug/util/Style');
  const _ = require('underscore');
  const $ = require('jquery');

  const ranks = [ 'subscriber',
                  'host', 'cohost', 'manager', 'bouncer', 'dj',
                  'admin', 'ambassador' ];

  const RoomStyles = Plugin.extend({
    name: 'Room Styles',
    description: 'Applies custom room-specific styles. ' +
                 'Supports both the plugCubed and Radiant Script formats.',

    init(id, ext) {
      this._super(id, ext);
      this.colors = this.colors.bind(this);
      this.css    = this.css.bind(this);
      this.images = this.images.bind(this);
      this.unload = this.unload.bind(this);
      this.reload = this.reload.bind(this);
    },

    enable() {
      this._super();
      this.all();

      this.ext.roomSettings.on('change', this.reload);
    },

    disable() {
      this._super();
      this.unload();
      this.ext.roomSettings.off('change', this.reload);
    },

    reload() {
      this.unload();
      this.all();
    },

    _normalizeRanks(ranks) {
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

    colors() {
      // plugCubed
      let colors = this.ext.roomSettings.get('colors');
      // Radiant
      let ccc = this.ext.roomSettings.get('ccc');

      let chatColors = colors && colors.chat || ccc;
      if (_.isObject(chatColors)) {
        let colorStyles = this.createStyle();

        chatColors = this._normalizeRanks(chatColors);
        ranks.forEach(level => {
          if (chatColors[level]) {
            let color = chatColors[level];
            if (color[0] !== '#') color = `#${color}`;
            let value = { color: `${color} !important` };
            colorStyles
              .set(`.role-${level} .un`, value)
              .set(`.role-${level} .name`, value)
              .set(`#user-rollover.role-${level} .role span`, value)
              .set(`#app .list.staff .group.${level} span`, value);
          }
        });
      }
    },

    css() {
      let css = this.ext.roomSettings.get('css');
      // plugCubed
      if (_.isObject(css)) {
        if (_.isObject(css.rule)) {
          this.createStyle(css.rule);
        }

        if (_.isArray(css.import)) {
          this._imports = $('<style>').text(
            css.import.map(url => `@import url(${url});`).join('\n')
          ).appendTo('head');
        }
      }
      // Radiant
      else if (_.isString(css)) {
        this._imports = $('<style>').text(`@import url(${css});`).appendTo('head');
      }
    },

    images() {
      let images = this.ext.roomSettings.get('images');
      if (_.isObject(images)) {
        let style = this.createStyle();
        if (images.background) {
          style.set({
            '.room-background': {
              'background-image': 'url(' + images.background + ') !important'
            }
          });
        }
        if (images.playback) {
          let playbackImg = $('#playback .background img');
          this._oldPlayback = playbackImg.attr('src');
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
          this.$booth = $('<div />')
            // plug³ compatibility
            .attr('id', 'p3-dj-booth')
            .addClass('extplug-booth')
            .css({ 'background': 'url(' + images.booth + ') no-repeat center center' })
            .appendTo($('#dj-booth'));
        }

        images = this._normalizeRanks(images);
        ranks.forEach(rank => {
          let url = images[rank] || images.icons && images.icons[rank];
          if (url) {
            let selector = `.icon.icon-chat-${rank}`
            // special-case cohosts, because they also have the "chat-host" icon
            // class sometimes
            if (rank === 'host' || rank === 'cohost') {
              selector += `, .role-${rank} .icon-chat-host`
            }
            style.set(selector, { background: `url(${url})` });
          }
        });
      }
    },

    all() {
      this.colors();
      this.css();
      this.images();
    },

    unload() {
      if (this.$booth) {
        this.$booth.remove();
        this.$booth = null;
      }
      if (this._oldPlayback) {
        $('#playback .background img').attr('src', this._oldPlayback);
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
