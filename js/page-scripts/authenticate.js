var jwt, emailAddress;
setupButtonClickOnFieldEnter("login-submit", "login-password");
setupButtonClickOnFieldEnter("signup-submit", "signup-email-address");
$("#login-btn").click(function() {
    $("#sign-up-card").addClass("display-none");
    $("#login-card").removeClass("display-none");
});
$("#sign-up-btn").click(function() {
    $("#login-card").addClass("display-none");
    $("#sign-up-card").removeClass("display-none");
});
$("#forgot-password-btn").click(function() {
    $("#login-card").addClass("display-none");
    $("#forgot-password-card").removeClass("display-none");
});
$("#resend-email-btn").click(function(e) {
    e.preventDefault();
    let request = { 'emailAddress': emailAddress };
    $("#login-card").addClass("display-none");
    $("#sign-up-card").addClass("display-none");
    $("#forgot-password-card").addClass("display-none");
    $("#resend-email-card").removeClass("display-none");
    $.ajax({
        url: API_URL + '/user/confirmation-email',
        data: JSON.stringify(request),
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", jwt);
        },
        success: function(response) {
            $("#resend-email-processing").removeClass("show");
            $("#resend-email-success").addClass("show");
        },
        error: function(xhr, status, error) {
            $("#resend-email-processing").removeClass("show");
            $("#resend-email-error").addClass("show");
        }
    });
});
$("#login-submit").click(function() {
    let request = {
        'emailAddress': $('#login-email-address').val(),
        'password': $('#login-password').val(),
    };
    $("#login-error").removeClass("show");
    $("#login-processing").addClass("show");
    $.ajax({
        url: API_URL + '/login',
        data: JSON.stringify(request),
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        success: function(response) {
            $("#login-processing").removeClass("show");
            if(response.data.user.status == "REGISTERED") {
                $("#login-error-verify").addClass("show");
                jwt = response.data.jwt;
                emailAddress = response.data.user.emailAddress;
            } else {
                localStorage.setItem('jwt', response.data.jwt);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                window.location.href = '/';
            }
        },
        error: function(xhr, status, error) {
            $("#login-processing").removeClass("show");
            $("#login-error").addClass("show");
        }
    });
});
$("#signup-submit").click(function() {
    let usernamePattern = /^[A-Za-z0-9_]+$/;
    let request = {
        'emailAddress': $('#signup-email-address').val(),
        'password': $('#signup-password').val(),
        'username': $('#signup-username').val(),
    };
    $("#signup-success").removeClass("show");
    $("#signup-error-server").removeClass("show");
    $("#signup-error-email").removeClass("show");
    $("#signup-error-email-invalid").removeClass("show");
    $("#signup-error-password-length").removeClass("show");
    $("#signup-error-password-match").removeClass("show");
    $("#signup-error-username").removeClass("show");
    $("#signup-error-username-length").removeClass("show");
    $("#signup-error-username-content").removeClass("show");
    if(request.username.trim().length < 2 || request.username.trim().length > 32) {
        $("#signup-error-username-length").addClass("show");
        return;
    } else if(request.username.match(usernamePattern) == null) {
        $("#signup-error-username-content").addClass("show");
        return;
    } else if(request.password != $('#signup-password2').val()) {
        $("#signup-error-password-match").addClass("show");
        return;
    } else if(request.password.trim().length < 8) {
        $("#signup-error-password-length").addClass("show");
        return;
    } else if(!validateEmail(request.emailAddress)) {
        $("#signup-error-email-invalid").addClass("show");
        return;
    }
    $("#signup-processing").addClass("show");
    $.ajax({
        url: API_URL + '/user',
        data: JSON.stringify(request),
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        success: function(response) {
            $("#signup-processing").removeClass("show");
            $("#signup-success").addClass("show");
        },
        error: function(xhr, status, error) {
            let response = xhr.responseJSON;
            $("#signup-processing").removeClass("show");
            if(response.message.includes("already in use")) {
                if(response.message.includes("@")) {
                    $("#signup-error-email").addClass("show");
                } else {
                    $("#signup-error-username").addClass("show");
                }
            } else {
                $("#signup-error-server").addClass("show");
            }
        }
    });
});
$("#forgot-password-submit").click(function() {
    let request = { 'emailAddress': $('#forgot-password-email-address').val() };
    $("#forgot-password-error-server").removeClass("show");
    $("#forgot-password-success").removeClass("show");
    $("#forgot-password-processing").addClass("show");
    $.ajax({
        url: API_URL + '/password-reset',
        data: JSON.stringify(request),
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        success: function(response) {
            $("#forgot-password-processing").removeClass("show");
            $("#forgot-password-success").addClass("show");
        },
        error: function(xhr, status, error) {
            $("#forgot-password-processing").removeClass("show");
            $("#forgot-password-error-server").addClass("show");
        }
    });
});

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
