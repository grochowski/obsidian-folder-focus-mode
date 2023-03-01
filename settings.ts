import FolderFocusModePlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
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
			.setName("Auto-Focus when hidden")
			.setDesc("Ensures the plugin focuses automatically on directory of newly opened files, if they are not visible right now")
			.addToggle((component) =>
				component
					.setValue(this.plugin.settings.autofocusMode)
					.onChange(async (value) => {
						this.plugin.settings.autofocusMode = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Auto-Focus on root")
			.setDesc("Focus on the first folder from root if the auto focus setting is enabled")
			.addToggle((component) =>
				component
					.setValue(this.plugin.settings.autofocusRoot)
					.onChange(async (value) => {
						this.plugin.settings.autofocusRoot = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Force auto-focus on parent directory")
			.setDesc("Always auto-focus on the parent directory of current file, even if it is already visible")
			.addToggle((component) =>
				component
					.setValue(this.plugin.settings.autofocusForced)
					.onChange(async (value) => {
						this.plugin.settings.autofocusForced = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Simplified view")
			.setDesc("Hide parent directories when focusing on a folder (saves space when using nested folders)")
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
			.setName("Button on explorer")
			.setDesc("Add a button on the top of the file explorer")
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
			.setName("Show focus option on file context menu")
			.setDesc("Show \"Focus on this file\" option in file context menu")
			.addToggle((component)=>
				component
					.setValue(this.plugin.settings.fileContextMenu)
					.onChange(async(value)=>{
						this.plugin.settings.fileContextMenu=value;
						await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Folder Note: External files')
			.setDesc('Focus on the folder linked with the folder note')
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
