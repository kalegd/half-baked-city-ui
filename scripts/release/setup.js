var global = {};

global.isChrome = navigator.userAgent.indexOf('Chrome') !== -1;

function getDependencies() {
    let dependencies = [];
    let pageAssets = dataStore.getPageAssets();
    let pageScripts = dataStore.getPageScripts();
    for(let assetId in pageAssets) {
        if(dataStore.assets[assetId].type == "JS") {
            dependencies.push(dataStore.assets[assetId].filename);
        }
    }
    for(let scriptId in pageScripts) {
        dependencies.push(dataStore.scripts[scriptId].filename);
    }
    loadScripts(dependencies, function() {
        release = new Release();
    });
}

function setupDataStore() {
    $.getJSON('/website_info.json', function(response) {
        pageId = $('meta[name=id]').attr("content");
        dataStore = new DataStore(response, pageId);
        getDependencies();
    });
}

if('xr' in navigator) {
    navigator.xr.isSessionSupported( 'immersive-vr' )
        .then(function (supported) {
            if (supported) {
                global.isVR = true;
            } else {
                global.isVR = false;
            }
        }).catch(function() { global.isVR = false }).finally( setupDataStore );
} else {
    global.isVR = false;
    setupDataStore();
}
