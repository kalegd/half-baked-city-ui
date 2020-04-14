const API_URL = "https://oh9m8to7dl.execute-api.us-east-1.amazonaws.com/development"

const setImmersions = (appId, htmlId) => {
    $.ajax({
        url: API_URL + '/app/' + appId,
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        success: function(response) {
            $("#" + htmlId)[0].innerText = response.data.app.immersions;
        },
        error: function(xhr, status, error) {
            $("#" + htmlId)[0].innerText = ":(";
        }
    });
}

const setupButtonClickOnFieldEnter = (buttonId, fieldId) => {
    $("#" + fieldId).keyup(function(event) {
        if (event.originalEvent.code === "Enter") {
            $("#" + buttonId).click();
        }
    });
}
