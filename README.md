## Obsidian Folder Focus Mode Plugin

Adds an option to folder's context menu, which allows to focus file explorer on chosen folder and its files and subdirectories, while hiding all the other elements.

In order to disable this mode, you have to use a global command 'Disable folder focus mode' or open context menu for previously chosen folder and choose 'Unfocus'. You can also choose to add an icon on the top of the explorer view, to rapidly switch between focus and unfocus.

✒️ Moreover, if you use folder note with [external file strategies](https://github.com/aidenlx/alx-folder-note/wiki/folder-note-pref) you need to activate the option to focus on the linked folder. 

Plugin is a quick draft, as I really needed this function. I strongly recommend joining and developing it with me to make it even more useful 🌚.

Special thanks to:
- [Lisandra-dev](https://github.com/Lisandra-dev)

#### Install the plugin

You can activate this plugin within Obsidian by searching for 'focus mode' among the community plugins.

#### Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/obsidian-folder-focus-mode/`.

#### Development

- Clone this repo.
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode.
