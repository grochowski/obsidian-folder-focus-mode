import FolderFocusModePlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
export class FolderFocusModeSettingTab extends PluginSettingTab {
	plugin: FolderFocusModePlugin;
	constructor(app: App, plugin: FolderFocusModePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display(): void {
		let { containerEl } = this;
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
			)
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
			)
		new Setting(containerEl)
			.setName("Button on explorer")
			.setDesc("Add a button on the top of the file explorer (Need Reloading to work)")
			.addToggle((component)=>
				component
					.setValue(this.plugin.settings.focusButton)
					.onChange(async(value)=>{
						this.plugin.settings.focusButton=value;
						await this.plugin.saveSettings();
				})
			);
	};
}
