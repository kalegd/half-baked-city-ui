import global from '/library/scripts/core/global.js';

export default class AddImmersion {
    constructor(params) {
        this._apiUrl = "https://oh9m8to7dl.execute-api.us-east-1.amazonaws.com/development";
        //this._apiUrl = "https://ppigk7wzo3.execute-api.us-east-1.amazonaws.com/production";
        let pageId = $('meta[name=id]').attr("content");
        if(pageId) {
            this._addImmersion(pageId);
        }
    }

    _addImmersion(pageId) {
        $.ajax({
            url: this._apiUrl + '/app/' + pageId + "/immersion",
            type: 'POST',
            dataType: 'json',
            success: function(response) {
                //Nothing need be bothered by this
            },
            error: function(xhr, status, error) {
                let response = xhr.responseJSON;
                console.log(response);
            }
        });
        this.update = this._update;
    }

    canUpdate() {
        return false;
    }

    static isDeviceTypeSupported(deviceType) {
        return true;
    }

    static getScriptType() {
        return 'POST_SCRIPT';
    }

    static getFields() {
        return [
        ];
    }
}
