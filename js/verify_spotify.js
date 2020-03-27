var jwt = localStorage.getItem('jwt');
if(jwt == null) {
    window.location.href = '/authenticate';
}

function getUrlVars() {
    let vars = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

let urlVars = getUrlVars();
if("code" in urlVars) {
    let request = { 'code': urlVars['code'], "url": window.location.origin + "/account/verify-spotify" };
    $.ajax({
        url: API_URL + '/user/spotify',
        data: JSON.stringify(request),
        type: 'POST',
        contentType: 'application/json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", jwt);
        },
        success: function(response) {
            console.log(response);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            $("#processing").removeClass("show");
            window.location.href = '/account';
        },
        error: function(xhr, status, error) {
            let response = xhr.responseJSON;
            $("#processing").removeClass("show");
            console.log(response);
            $("#error").addClass("show");
        }
    });
} else {
    $("#processing").removeClass("show");
    $("#error").addClass("show");
}
