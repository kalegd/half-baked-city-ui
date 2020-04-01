$("#submit").click(function() {
    let usernamePattern = /^[A-Za-z0-9_]+$/;
    let request = {
        'jwt': $('#email-address').val(),
        'password': $('#password').val(),
    };
    $("#error-token").removeClass("show");
    $("#error-server").removeClass("show");
    $("#error-password-match").removeClass("show");
    $("#error-password-length").removeClass("show");
    let urlVars = getUrlVars();
    if(!("token" in urlVars)) {
        $("#error-token").addClass("show");
        return;
    } else if(request.password != $('#password2').val()) {
        $("#error-password-match").addClass("show");
        return;
    } else if(request.password.trim().length < 8) {
        $("#error-password-length").addClass("show");
        return;
    }
    $("#processing").addClass("show");
    $.ajax({
        url: API_URL + '/user/password',
        data: JSON.stringify(request),
        type: 'PUT',
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", urlVars['token']);
        },
        success: function(response) {
            $("#processing").removeClass("show");
            if(response.data.user.status == "REGISTERED") {
                $("#error-verify").addClass("show");
            } else {
                console.log(response);
                localStorage.setItem('jwt', response.data.jwt);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                window.location.href = '/';
            }
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
});

function getUrlVars() {
    let vars = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
