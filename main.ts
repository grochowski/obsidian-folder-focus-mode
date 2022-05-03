import { Plugin, App } from 'obsidian';
import { ExplorerLeaf, ExplorerView } from './@types/obsidian';
import * as path from 'path';

interface FolderFocusModePluginSettings { }

const DEFAULT_SETTINGS: FolderFocusModePluginSettings = { }

export default class FolderFocusModePlugin extends Plugin {
	settings: FolderFocusModePluginSettings;


	/**
	 * This function returns true if current folder is a chosen focus folder, its child or vault's root
	 *
	 * @public
	 * @param {string} newFocusFolder
	 * @param {string} currentFolder
	 */
	shouldBeVisible(newFocusFolder: string, currentFolder: string) {
		const relative = path.relative(newFocusFolder, currentFolder);

		const stringSplits = newFocusFolder.split('/');
		const parentsArray = stringSplits.reduce((acc, val, i) => {
			if (i === 0) return [val]
			acc.push( acc[i-1] + '/' + val )
			return acc
		}, []);

		return (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) || parentsArray.includes(currentFolder) || currentFolder === '/';
	}

	/**
	 * This function hides all the elements except the ones that are children or parents of new focus folder
	 *
	 * @public
	 * @param {string} newFocusFolder
	 */
	hideTreeElements(newFocusFolder: string) {
		const fileExplorers = this.app.workspace.getLeavesOfType('file-explorer');
		fileExplorers.forEach((fileExplorer: ExplorerLeaf) => {

			const registeredFileExplorers: Array<ExplorerView> = [];
		
			registeredFileExplorers.push(fileExplorer.view);
		
			registeredFileExplorers.forEach(explorerView => {

				for (var key in explorerView.fileItems) {
					if (explorerView.fileItems.hasOwnProperty(key)) {
						if(this.shouldBeVisible(newFocusFolder, key)) {
							explorerView.fileItems[key].el.classList.remove('hidden-tree-element');
						} else {
							explorerView.fileItems[key].el.classList.add('hidden-tree-element');
						}
					}
				}

			});

		});
	}

	/**
	 * This function shows all the elements in a tree (basically resetting it)
	 *
	 * @public
	 */
	showAllTreeElements() {
		const fileExplorers = this.app.workspace.getLeavesOfType('file-explorer');
		fileExplorers.forEach((fileExplorer: ExplorerLeaf) => {

			const registeredFileExplorers: Array<ExplorerView> = [];
		
			registeredFileExplorers.push(fileExplorer.view);
		
			registeredFileExplorers.forEach(explorerView => {

				for (var key in explorerView.fileItems) {
					if (explorerView.fileItems.hasOwnProperty(key)) {
						explorerView.fileItems[key].el.classList.remove('hidden-tree-element');
					}
				}

			});

		});
	}

	async onload() {

		// context menu for folders
		this.registerEvent(
		  this.app.workspace.on("file-menu", (menu, file) => {
			if(!file?.extension) {
				menu.addItem((item) => {
						item
						.setTitle("Focus on this folder")
						.setIcon("eye")
						.onClick(async () => {
							this.hideTreeElements(file.path);
						});
				});
			}
		  })
		);

		// global command for resetting the focus mode
		this.addCommand({
			id: "folder-focus-mode-unfocus",
			name: "Disable folder focus mode",
			callback: () => {
				this.showAllTreeElements();
			},
		});

	}

	onunload() {

	}
}
