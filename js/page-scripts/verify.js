function getUrlVars() {
    let vars = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

let urlVars = getUrlVars();
if("token" in urlVars) {
    $.ajax({
        url: API_URL + '/user/verify',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", urlVars['token']);
        },
        success: function(response) {
            localStorage.setItem('jwt', response.data.jwt);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            $("#processing").removeClass("show");
            window.location.href = '/';
        },
        error: function(xhr, status, error) {
            let response = xhr.responseJSON;
            $("#processing").removeClass("show");
            if(response.message.includes("expired")) {
                $("#error-expired").addClass("show");
            } else {
                $("#error-server").addClass("show");
            }
        }
    });
} else {
    $("#processing").removeClass("show");
    $("#error").addClass("show");
}
