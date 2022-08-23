import {
	Plugin,
	WorkspaceLeaf, setIcon, TFile,
	TFolder
} from 'obsidian';
import { FolderFocusModeSettingTab } from 'settings';
import { ExplorerLeaf } from './@types/obsidian';
import { getRelativePath, isAbsolutePath, getDirname, getRootDirname } from './util';

interface FolderFocusModePluginSettings { 
	autofocusMode: boolean;
	autofocusRoot: boolean;
	focusButton: boolean;
	focusNote: boolean;
}

const DEFAULT_SETTINGS: FolderFocusModePluginSettings = {
	autofocusMode: true,
	autofocusRoot: false,
	focusButton: false,
	focusNote: false
}

export default class FolderFocusModePlugin extends Plugin {
	settings: FolderFocusModePluginSettings;

	focusModeEnabled: boolean;
	focusModePath: string|null;

	/**
	 * This function returns true if current folder is a chosen focus folder, its child or vault's root
	 *
	 * @public
	 * @param {string} newFocusFolder
	 * @param {string} currentFolder
	 */
	shouldBeVisible(newFocusFolder: string, currentFolder: string) {
		const relative = getRelativePath(newFocusFolder, currentFolder);
		console.log(relative);
		const stringSplits = newFocusFolder.split('/');
		const parentsArray = stringSplits.reduce((acc, val, i) => {
			if (i === 0) return [val]
			acc.push(acc[i-1] + '/' + val);
			return acc;
		}, []);
		console.log(parentsArray);

		return (relative && !relative.startsWith('..') && !isAbsolutePath(relative)) || parentsArray.includes(currentFolder) || currentFolder === '/';
	}

	/**
	 * This function hides all the elements except the ones that are children or parents of new focus folder
	 *
	 * @public
	 * @param {string} newFocusFolder
	 */
	hideTreeElements(newFocusFolder: string) {
		this.focusModeEnabled = true;
		this.focusModePath = newFocusFolder;

		const fileExplorers = this.app.workspace.getLeavesOfType('file-explorer');
		fileExplorers.forEach((fileExplorer: ExplorerLeaf) => {

			for (const key in fileExplorer.view.fileItems) {
				if (fileExplorer.view.fileItems.hasOwnProperty(key)) {
					if(this.shouldBeVisible(newFocusFolder, key)) {
						fileExplorer.view.fileItems[key].el.classList.remove('hidden-tree-element');
					} else {
						fileExplorer.view.fileItems[key].el.classList.add('hidden-tree-element');
					}
				}
			}

		});
	}

	/**
	 * This function shows all the elements in a tree (basically resetting it)
	 *
	 * @public
	 */
	showAllTreeElements() {
		this.focusModeEnabled = false;
		this.focusModePath = null;

		const fileExplorers = this.app.workspace.getLeavesOfType('file-explorer');
		fileExplorers.forEach((fileExplorer: ExplorerLeaf) => {

			for (const key in fileExplorer.view.fileItems) {
				if (fileExplorer.view.fileItems.hasOwnProperty(key)) {
					fileExplorer.view.fileItems[key].el.classList.remove('hidden-tree-element');
				}
			}

		});
	}
	
	
	getDirRoot(file: TFile) {
		if (this.settings.focusNote) {
			const linkedFolder = this.app.vault.getAbstractFileByPath(file.path.replace('.md', ''));
			if (linkedFolder && linkedFolder instanceof TFolder) {
				return linkedFolder.path;
			} else {
				return this.settings.autofocusRoot ? getRootDirname(file.path) : getDirname(file.path);
			}
		}
		else {
			return this.settings.autofocusRoot ? getRootDirname(file.path) : getDirname(file.path);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());  
	}

	async saveSettings() {
		await this.saveData(this.settings);  
	}

	async onload() {
		console.log('focus folder loaded');
		await this.loadSettings();
		this.addSettingTab(new FolderFocusModeSettingTab(this.app, this));

		this.focusModeEnabled = false;
		if (this.settings.focusButton) {
			this.app.workspace.onLayoutReady(() => {
				const explorers = this.getFileExplorers();
				explorers.forEach((exp) => {
					this.addFocusFolderButton(exp);
				})
			});
		}

		this.registerEvent(this.app.workspace.on('layout-change', () => {
			const explorers = this.getFileExplorers();
			explorers.forEach((exp) => {
				this.addFocusFolderButton(exp);
			});
		}));

		// context menu for folders
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if(!file?.extension) {
					const isCurrentlyFocused = this.focusModePath === file.path;
					menu.addItem((item) => {
							item
							.setTitle(isCurrentlyFocused ? "Unfocus" : "Focus on this folder")
							.setIcon("eye")
							.onClick(async () => {
								if(isCurrentlyFocused) {
									this.showAllTreeElements();
								} else {
									this.hideTreeElements(file.path);
								}
							});
					});
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				console.log('Autofocus ?', this.settings.autofocusMode);
				if(this.focusModeEnabled && this.settings.autofocusMode && !this.shouldBeVisible(this.focusModePath, file.path)) {
					const currentFolderPath = this.getDirRoot(file);
					console.log(currentFolderPath);
					this.hideTreeElements(currentFolderPath);
					const explorers = this.getFileExplorers();
					explorers.forEach((exp) => {
						const container = exp.view.containerEl as HTMLDivElement;
						const navContainer = container.querySelector('div.nav-buttons-container') as HTMLDivElement;
						if (!navContainer) {
							return null;
						}
						const existingButton = FolderFocusModePlugin.getFocusButton(exp);
						existingButton.classList.add('focus-close');
						this.addFocusFolderButton(exp);
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

		// global command for enabling the focus mode for parent folder of current file
		this.addCommand({
			id: "folder-focus-mode-focus-active",
			name: "Enable folder focus mode for active file",
			checkCallback: (checking: boolean) => {
				const currentFile = this.app.workspace.getActiveFile();

				if (currentFile) {
					if (!checking) {
						const currentFolderPath = getDirname(currentFile.path);
						this.hideTreeElements(currentFolderPath);
					}
					return true;
				}
				return false;
			}
		});

	}

	onunload() {
		console.log('focus folder unloaded');
		const explorers = this.getFileExplorers();
		explorers.forEach((exp) => {
			FolderFocusModePlugin.removeFocusFolderButton(exp);
		});
	}

	private getFileExplorers():WorkspaceLeaf[] {
		return this.app.workspace.getLeavesOfType('file-explorer');
	}

	private static getFocusButton(explorer: WorkspaceLeaf): HTMLDivElement |null {
		return explorer.view.containerEl.querySelector('.focus-folder-button');
	}

	private focusedButton(icon:HTMLDivElement) {
		this.showAllTreeElements();
		setIcon(icon, 'eye');
		icon.classList.remove('focus-close');
		icon.classList.add('focus-open');
		icon.setAttribute('aria-label', 'Focus on this file folder');
	}

	private unfocusedButton(icon: HTMLDivElement, filepath: string) {
		this.hideTreeElements(filepath);
		setIcon(icon, 'eye-off');
		icon.classList.remove('focus-open');
		icon.classList.add('focus-close');
		icon.setAttribute('aria-label', 'Unfocus folder');
	}

	private addFocusFolderButton(explorer: WorkspaceLeaf):void {
		const container = explorer.view.containerEl as HTMLDivElement;
		const navContainer = container.querySelector('div.nav-buttons-container') as HTMLDivElement;
		if (!navContainer) {
			return null;
		}
		const existingButton = FolderFocusModePlugin.getFocusButton(explorer);
		if (existingButton){
			return;
		}
		const newIcon = document.createElement('div');
		setIcon(newIcon, 'eye');
		newIcon.setAttribute('aria-label', 'Focus on this file folder');
		newIcon.classList.add('nav-action-button', 'focus-folder-button', 'focus-open');
		this.registerDomEvent(newIcon, 'click', () => {
			const currentFile = this.app.workspace.getActiveFile();
			if (currentFile) {
				const isCurrentlyFocused = this.focusModePath === currentFile.path;
				if (isCurrentlyFocused) {
					this.focusedButton(newIcon);
				} else if (newIcon.classList[2]==='focus-open') {
					const currentFolderPath = this.getDirRoot(currentFile);
					this.unfocusedButton(newIcon, currentFolderPath);
				} else if (newIcon.classList[2] == 'focus-close') {
					this.focusedButton(newIcon);
				}
			}
		});
		navContainer.appendChild(newIcon);
	}
	private static removeFocusFolderButton(explorer: WorkspaceLeaf):void {
		const button = FolderFocusModePlugin.getFocusButton(explorer);
		if (button) {
			button.remove();
		}
	}
}


