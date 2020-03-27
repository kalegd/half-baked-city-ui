class DataStore {
    constructor(data, pageId) {
        this.page = data.website.pages[pageId];
        if(this.page == null) {
            return;
        }
        this.library = data.library;
        this.assets = {};
        this.audios = {};
        this.images = {};
        this.skyboxes = {};
        this.scripts = {};
        this._addFromLibrary(this.assets, this.library.models);
        this._addFromLibrary(this.assets, this.library.lights);
        this._addFromLibrary(this.audios, this.library.audios);
        this._addFromLibrary(this.images, this.library.images);
        this._addFromLibrary(this.skyboxes, this.library.skyboxes);
        this._addFromLibrary(this.scripts, this.library.scripts);
    }

    _addFromLibrary(dict, newElements) {
        for(let i = 0; i < newElements.length; i++) {
            dict[newElements[i].id] = newElements[i];
        }
    }

    getSkybox() {
        return this.page.skybox;
    }

    getPageAssets() {
        return this.page.assets;
    }

    getPageAudios() {
        return this.page.audios;
    }

    getPageScripts() {
        return this.page.scripts;
    }

    getUserSettings() {
        return this.page.user_settings;
    }

}

var dataStore;
