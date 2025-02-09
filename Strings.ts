export default class Strings {
    static app = {
        unfocus: "Unfocus",
        focusOnFolder: "Focus on this folder",
        focusOnFile: "Focus on this file",
        focusOnFileFolder: "Focus on this file folder",
        unfocusFolder: "Unfocus folder"
    };
    static commands = {
        disableFocusMode: "Disable folder focus mode",
        toggleAutoFocus: "Toggle autofocus mode",
        toggleSimplifiedView: "Toggle simplified view",
        enableFocusModeActive: "Enable folder focus mode for active file"
    };
    static settings = {
        autoFocusWhenHidden: {
            name: "Auto-Focus when hidden",
            desc: "Ensures the plugin focuses automatically on directory of newly opened files, if they are not visible right now"
        },
        autoFocusOnRoot: {
            name: "Auto-Focus on root", 
            desc: "Focus on the first folder from root if the auto focus setting is enabled"
        },
        forceAutoFocus: {
            name: "Force auto-focus on parent directory",
            desc: "Always auto-focus on the parent directory of current file, even if it is already visible"
        },
        simplifiedView: {
            name: "Simplified view",
            desc: "Hide parent directories when focusing on a folder (saves space when using nested folders)"
        },
        buttonOnExplorer: {
            name: "Button on explorer",
            desc: "Add a button on the top of the file explorer"
        },
        showFocusOption: {
            name: "Show focus option on file context menu",
            desc: "Show \"Focus on this file\" option in file context menu"
        },
        folderNote: {
            name: "Folder Note: External files",
            desc: "Focus on the folder linked with the folder note"
        }
    };
    static {
        Strings.localize();
    }

    /**
     * Dynamically import strings for the current language.
     */
    private static async localize(): Promise<void> {
        let localizedStrings: any;
        switch (window.localStorage.language) {
            case 'uk': localizedStrings = await import('i18n/uk.json'); break;
            default: return;
        }
        this.localizeDefaultStrings(this, localizedStrings);
    }

    /**
     * Replace default strings with localized strings.
     * Strings and their keys are always type-safe, even if the localized JSON is incomplete or broken.
     */
    private static localizeDefaultStrings(defaultStrings: any, localizedStrings: any): void {
        for (const [key, value] of Object.entries(localizedStrings)) {
            if (typeof defaultStrings[key] === 'object') {
                if (typeof value === 'object') {
                    this.localizeDefaultStrings(defaultStrings[key], value);
                }
            } else if (typeof value === 'string') {
                defaultStrings[key] = value;
            }
        }
    }
}