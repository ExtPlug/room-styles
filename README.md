Room Styles
===========

ExtPlug plugin that allows room owners to create their own custom room styles.
It supports both the [plug³](https://github.com/plugCubed/plugCubed/wiki/Room-Settings)
and [RCS](https://rcs.radiant.dj/ccs) room style formats.

## Installation

You can install this plugin by going to your ExtPlug settings menu, pressing "Install Plugin",
and entering this Plugin URL:

```
https://unpkg.com/extplug-room-styles
```

## Room Settings

**Note: This section is intended for room hosts only.**

You can add a custom room style using the plug³ or RCS formats, or even a
mixture of both. If you have already defined a plug³ or RCS room style, you do
not have to do anything to support ExtPlug users.

See the relevant Room Styles documentation for more information.

  * [RCS Custom Community Settings documentation](https://rcs.radiant.dj/ccs)

    In particular, the `css`, `ccc` and `images` properties.

    Note: The RCS custom chat colour (`ccc`) properties `friend` and `user` are
    **not yet supported** by this plugin.

  * [plug³ Room Settings documentation](https://github.com/plugCubed/plugCubed/wiki/Room-Settings)

    In particular, the `colors`, `css` and `images` properties.

## Building

**Note: this section is intended for developers only.**

First, install dependencies:

```bash
npm install
```

Then, use:

```bash
npm run build
```

The plugin will be built using the [ExtPlug CLI](https://github.com/extplug/extplug-cli).

The built plugin will be stored at `build/room-styles.js`.

## License

[MIT](./LICENSE)

