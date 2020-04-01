$.ajax({
    url: API_URL + '/apps',
    type: 'GET',
    contentType: 'application/json',
    dataType: 'json',
    success: function(response) {
        for(let i = 0; i < response.data.apps.length; i++) {
            let app = response.data.apps[i];
            $("#" + app.urlName + "-immersions")[0].innerText = app.immersions;
        }
    },
    error: function(xhr, status, error) {
        spans = $("span[id$='immersions']");
        for(let i = 0; i < spans.length; i++) {
            spans[i].innerHTML = "&#129301;"; //Bandaged Head Emoji
        }
    }
});
