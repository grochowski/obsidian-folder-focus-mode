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
	autofocusForced: boolean;
	simplifiedView: boolean;
	focusButton: boolean;
	focusNote: boolean;
}

const DEFAULT_SETTINGS: FolderFocusModePluginSettings = {
	autofocusMode: true,
	autofocusRoot: false,
	autofocusForced: false,
	simplifiedView: true,
	focusButton: true,
	focusNote: false
}

enum VisibilityType {
	hide = 0,
	showAsParent = 1,
	showAsHeader = 2,
	showAsBack = 3,
	alwaysShow = 4
}

export default class FolderFocusModePlugin extends Plugin {
	settings: FolderFocusModePluginSettings;

	focusModeEnabled: boolean;
	focusModePath: string|null;


	/**
	 * This function returns true if current folder is a chosen focus folder, its child or vault's root
	 *
	 * @public
	 * @param {string} focusFolder
	 * @param {string} currentFolder
	 */
	shouldBeVisible(focusFolder: string, currentFolder: string): VisibilityType {
		const relative = getRelativePath(focusFolder, currentFolder);
		const stringSplits = focusFolder.split('/');
		const parentsArray = stringSplits.reduce((acc, val, i) => {
			if (i === 0) return [val]
			acc.push(acc[i-1] + '/' + val);
			return acc;
		}, []);

		const upElement = parentsArray.length >= 2 ? parentsArray[parentsArray.length - 2] : '/';


		if(focusFolder === currentFolder) {
			return VisibilityType.showAsHeader;
		}

		if(upElement === currentFolder) {
			return VisibilityType.showAsBack;
		}

		if(parentsArray.includes(currentFolder)) {
			return VisibilityType.showAsParent;
		}

		if(currentFolder === '/') {
			return VisibilityType.showAsParent;
		}

		if((relative && !relative.startsWith('..') && !isAbsolutePath(relative))) {
			return VisibilityType.alwaysShow;
		}

		return VisibilityType.hide;
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

		this.resetClasses();

		const fileExplorers = this.app.workspace.getLeavesOfType('file-explorer');
		fileExplorers.forEach((fileExplorer: ExplorerLeaf) => {
			let newTree = fileExplorer.view.fileItems;

			for (const key in fileExplorer.view.fileItems) {
				if (fileExplorer.view.fileItems.hasOwnProperty(key)) {

					const shouldBeVisible = this.shouldBeVisible(newFocusFolder, key);

					if(shouldBeVisible) {
						fileExplorer.view.fileItems[key].el.classList.remove('hidden-tree-element');
					} else {
						fileExplorer.view.fileItems[key].el.classList.add('hidden-tree-element');
					}

					if(shouldBeVisible === VisibilityType.showAsParent) {
						fileExplorer.view.fileItems[key].el.classList.add('folderfocus-parent');
					} else {
						fileExplorer.view.fileItems[key].el.classList.remove('folderfocus-parent');
					}

					if(shouldBeVisible === VisibilityType.showAsHeader) {
						fileExplorer.view.fileItems[key].el.classList.add('folderfocus-header');
					} else {
						fileExplorer.view.fileItems[key].el.classList.remove('folderfocus-header');
					}

					if(shouldBeVisible === VisibilityType.showAsBack) {
						fileExplorer.view.fileItems[key].el.classList.add('folderfocus-up-element');
						fileExplorer.view.fileItems[key].el.children[0].classList.add('folderfocus-up-element-link');
					} else {
						fileExplorer.view.fileItems[key].el.classList.remove('folderfocus-up-element');
						fileExplorer.view.fileItems[key].el.children[0].classList.remove('folderfocus-up-element-link');
					}
				}
			}

			const existingButton = FolderFocusModePlugin.getFocusButton(fileExplorer);
			if(existingButton) {
				this.unfocusedButton(existingButton);
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
					fileExplorer.view.fileItems[key].el.classList.remove('folderfocus-parent');
					fileExplorer.view.fileItems[key].el.classList.remove('folderfocus-up-parent');
				}
			}

			fileExplorer.view.containerEl.querySelector('.folderfocus-up-element-link')?.classList?.remove('folderfocus-up-element-link');

			const existingButton = FolderFocusModePlugin.getFocusButton(fileExplorer);
			if(existingButton) {
				this.focusedButton(existingButton);
			}

		});
	}
	
	/**
	 * This function returns root directory for given file
	 * 
	 * @public
	 */
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

	/**
	 * Loads default settings for plugin
	 * 
	 * @public
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());  
	}

	/**
	 * Saves settings for plugin
	 * 
	 * @public
	 */
	async saveSettings() {
		await this.saveData(this.settings);  
	}

	/**
	 * Initialises plugin
	 * 
	 * @public
	 */
	async onload() {

		// load settings and add settings page
		await this.loadSettings();
		this.addSettingTab(new FolderFocusModeSettingTab(this.app, this));

		// initialise focus mode indicator and button
		this.focusModeEnabled = false;
		if (this.settings.focusButton) {

			const initialiseFocusButton = () => {
				const explorers = this.getFileExplorers();
				explorers.forEach((exp) => {
					this.addFocusFolderButton(exp);
				})
			};

			this.app.workspace.onLayoutReady(initialiseFocusButton);
			this.registerEvent(this.app.workspace.on('layout-change', initialiseFocusButton));
		}

		// create context menu for folders
		const initialiseFolderContextMenu = (menu: any, file: any) => {
			if(!file?.extension) {
				const isCurrentlyFocused = this.focusModePath === file.path;
				menu.addItem((item: any) => {
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
		}

		this.registerEvent(
			this.app.workspace.on("file-menu", initialiseFolderContextMenu)
		);

		// make "up" folder available
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			evt.preventDefault();

            // get the folder path
            const elemTarget = (evt.target as HTMLElement);
			const realTarget = elemTarget.closest('.folderfocus-up-element-link') as HTMLElement;

			if(this.settings.simplifiedView && realTarget) {
				const upPath = realTarget.dataset?.path;
				if(upPath) {
					this.hideTreeElements(upPath);

					setTimeout(() => {
						elemTarget.click();

					}, 300);
				}
			}

        });

		// handle autofocus when opening files
		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {

				if(!this.focusModeEnabled) return;

				const shouldHandleForRegularMode = !this.settings.autofocusForced && !this.shouldBeVisible(this.focusModePath, file.path);
				const shouldHandleForForcedMode = this.settings.autofocusForced;
				const shouldHandleAutofocus = this.settings.autofocusMode && (shouldHandleForRegularMode || shouldHandleForForcedMode)

				if(shouldHandleAutofocus) {
					const currentFolderPath = this.getDirRoot(file);
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

		// initialise global command for resetting the focus mode
		this.addCommand({
			id: "folder-focus-mode-unfocus",
			name: "Disable folder focus mode",
			callback: () => {
				this.showAllTreeElements();
			},
		});

		// initialise global command for toggling the autofocus mode
		this.addCommand({
			id: "folder-focus-mode-toggle-autofocus",
			name: "Toggle autofocus mode",
			callback: () => {
				this.settings.autofocusMode = !this.settings.autofocusMode;
			},
		});

		// initialise global command for toggling the simplified view
		this.addCommand({
			id: "folder-focus-mode-toggle-simplified",
			name: "Toggle simplified view",
			callback: () => {
				this.settings.simplifiedView = !this.settings.simplifiedView;
				this.resetClasses();
			},
		});

		// initialise global command for enabling the focus mode for parent folder of current file
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

	/**
	 * Clean up on destroy
	 * 
	 * @public
	 */
	onunload() {
		const explorers = this.getFileExplorers();
		explorers.forEach((exp) => {
			FolderFocusModePlugin.removeFocusFolderButton(exp);
		});
	}

	/**
	 * Reset folder focus classes
	 * 
	 * @public
	 */
	resetClasses() {
		const explorers = this.getFileExplorers();
		explorers.forEach((fileExplorer: WorkspaceLeaf) => {
			if(this.focusModeEnabled) {
				fileExplorer.view.containerEl.classList.add('folder-focus-mode');
			} else {
				fileExplorer.view.containerEl.classList.remove('folder-focus-mode');
			}

			if(this.settings.simplifiedView) {
				fileExplorer.view.containerEl.classList.add('folder-focus-mode-simplified');
			} else {
				fileExplorer.view.containerEl.classList.remove('folder-focus-mode-simplified');
			}
		});
	}

	/**
	 * Helper: Retrieve file explorers
	 * 
	 * @private
	 */
	private getFileExplorers():WorkspaceLeaf[] {
		return this.app.workspace.getLeavesOfType('file-explorer');
	}

	/**
	 * Helper: Get focus button
	 *
	 * @private
	 * @static
	 * @param {WorkspaceLeaf} explorer
	 * @return {*}  {(HTMLDivElement |null)}
	 * @memberof FolderFocusModePlugin
	 */
	private static getFocusButton(explorer: WorkspaceLeaf): HTMLDivElement |null {

		return explorer.view.containerEl.querySelector('.focus-folder-button');
	}

	/**
	 * Sets focused icon for current button
	 *
	 * @private
	 * @param {HTMLDivElement} icon
	 * @memberof FolderFocusModePlugin
	 */
	private focusedButton(icon:HTMLDivElement) {
		setIcon(icon, 'eye');
		icon.classList.remove('focus-close');
		icon.classList.add('focus-open');
		icon.setAttribute('aria-label', 'Focus on this file folder');
	}

	/**
	 * Sets unfocused icon for current button
	 *
	 * @private
	 * @param {HTMLDivElement} icon
	 * @memberof FolderFocusModePlugin
	 */
	private unfocusedButton(icon: HTMLDivElement) {
		setIcon(icon, 'eye-off');
		icon.classList.remove('focus-open');
		icon.classList.add('focus-close');
		icon.setAttribute('aria-label', 'Unfocus folder');
	}

	/**
	 * Add focus folder button to chosen explorer view
	 *
	 * @private
	 * @param {WorkspaceLeaf} explorer
	 * @return {*}  {void}
	 * @memberof FolderFocusModePlugin
	 */
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
		newIcon.classList.add('nav-action-button', 'focus-folder-button', 'focus-open', 'clickable-icon');
		this.registerDomEvent(newIcon, 'click', () => {
			const currentFile = this.app.workspace.getActiveFile();
			if (currentFile) {
				const isCurrentlyFocused = this.focusModePath === currentFile.path;
				if (isCurrentlyFocused) {
					this.showAllTreeElements();
					this.focusedButton(newIcon);
				} else if (newIcon.classList.contains('focus-open')) {
					const currentFolderPath = this.getDirRoot(currentFile);
					this.hideTreeElements(currentFolderPath);
					this.unfocusedButton(newIcon);
				} else if (newIcon.classList.contains('focus-close')) {
					this.showAllTreeElements();
					this.focusedButton(newIcon);
				}
			}
		});
		navContainer.appendChild(newIcon);
	}

	/**
	 * Remove focus folder button from explorer (used for cleanup)
	 *
	 * @private
	 * @static
	 * @param {WorkspaceLeaf} explorer
	 * @memberof FolderFocusModePlugin
	 */
	private static removeFocusFolderButton(explorer: WorkspaceLeaf):void {
		const button = FolderFocusModePlugin.getFocusButton(explorer);
		if (button) {
			button.remove();
		}
	}
}


