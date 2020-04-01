class AddImmersion {
    constructor(instance) {
        if(AddImmersion.instance == null) {
            this._apiUrl = "https://oh9m8to7dl.execute-api.us-east-1.amazonaws.com/development";
            this._update = this.update;
            this.update = this.preUpdate;
            AddImmersion.instance = this;
        }
        if(instance != null) {
        }
        return AddImmersion.instance;
    }

    preUpdate(timeDelta) {
        $.ajax({
            url: this._apiUrl + '/app/' + dataStore.pageId + "/immersion",
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

    update(timeDelta) {
        return;
    }

    canUpdate() {
        return true;
    }

    static getScriptType() {
        return ScriptType.POST_SCRIPT;
    }

    static getFields() {
        return [
        ];
    }
}

global.addImmersion = new AddImmersion();
