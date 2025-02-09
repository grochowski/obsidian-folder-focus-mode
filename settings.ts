import FolderFocusModePlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import STRINGS from 'Strings';
export class FolderFocusModeSettingTab extends PluginSettingTab {

	plugin: FolderFocusModePlugin;

	constructor(app: App, plugin: FolderFocusModePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl)
			.setName(STRINGS.settings.autoFocusWhenHidden.name)
			.setDesc(STRINGS.settings.autoFocusWhenHidden.desc)
			.addToggle((component) =>
				component
					.setValue(this.plugin.settings.autofocusMode)
					.onChange(async (value) => {
						this.plugin.settings.autofocusMode = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(STRINGS.settings.autoFocusOnRoot.name)
			.setDesc(STRINGS.settings.autoFocusOnRoot.desc)
			.addToggle((component) =>
				component
					.setValue(this.plugin.settings.autofocusRoot)
					.onChange(async (value) => {
						this.plugin.settings.autofocusRoot = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(STRINGS.settings.forceAutoFocus.name)
			.setDesc(STRINGS.settings.forceAutoFocus.desc)
			.addToggle((component) =>
				component
					.setValue(this.plugin.settings.autofocusForced)
					.onChange(async (value) => {
						this.plugin.settings.autofocusForced = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(STRINGS.settings.simplifiedView.name)
			.setDesc(STRINGS.settings.simplifiedView.desc)
			.addToggle((component) =>
				component
					.setValue(this.plugin.settings.simplifiedView)
					.onChange(async (value) => {
						this.plugin.settings.simplifiedView = value;
						this.plugin.resetClasses();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(STRINGS.settings.buttonOnExplorer.name)
			.setDesc(STRINGS.settings.buttonOnExplorer.desc) 
			.addToggle((component)=>
				component
					.setValue(this.plugin.settings.focusButton)
					.onChange(async(value)=>{
						this.plugin.settings.focusButton=value;
						this.plugin.initialiseFocusButton(value);
						await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(STRINGS.settings.showFocusOption.name)
			.setDesc(STRINGS.settings.showFocusOption.desc)
			.addToggle((component)=>
				component
					.setValue(this.plugin.settings.fileContextMenu)
					.onChange(async(value)=>{
						this.plugin.settings.fileContextMenu=value;
						await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(STRINGS.settings.folderNote.name)
			.setDesc(STRINGS.settings.folderNote.desc)
			.addToggle((component)=>
				component
					.setValue(this.plugin.settings.focusNote)
					.onChange(async(value)=>{
						this.plugin.settings.focusNote=value;
						await this.plugin.saveSettings();
				})
			);
	}
}
