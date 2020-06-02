var jwt = localStorage.getItem('jwt');
var user = localStorage.getItem('user');
if(jwt == null || user == null) {
    window.location.href = '/authenticate';
}
user = JSON.parse(user);
$("#username").text(user.username);
$("#email-address").text(user.emailAddress);
let avatarURL = user.avatarURL;
if(/\.png$|\.jpg$|\.jpeg$/.test(user.avatarURL)) {
    $("#avatar").html('<image src="' + user.avatarURL + '" width=100>');
} else if(/\.glb$/.test(user.avatarURL)) {
    $("#avatar").html('<babylon model="' + user.avatarURL + '"></babylon>');
}

//For full list of scopes, see here: https://developer.spotify.com/documentation/general/guides/scopes/
if(user.spotify == null) {
    $("#spotify-integration").text("Not Connected");
    $("#spotify-connect-link").attr("href", "https://accounts.spotify.com/authorize?client_id=1e96d7f88e5b47f2afb4b81f0f25d846&response_type=code&redirect_uri=" + window.location.origin + "/account/verify-spotify&scope=user-library-read%20streaming%20playlist-read-private%20playlist-read-collaborative%20user-read-recently-played%20user-top-read%20user-read-private%20user-read-email%20user-read-currently-playing%20user-read-playback-state%20user-modify-playback-state");
    $("#spotify-connect-link").removeClass("display-none");
} else {
    $("#spotify-integration").text("Connected");
}



$("#sign-out").click(function(e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = '/';
});

$("#new-email-address-submit").click(function(e) {
    e.preventDefault();
    let request = {
        'emailAddress': $('#new-email-address-input').val(),
    };
    $("#new-email-address-error").removeClass("show");
    $("#new-email-address-error-in-use").removeClass("show");
    $("#new-email-address-error-invalid").removeClass("show");
    if(!validateEmail(request.emailAddress)) {
        $("#new-email-address-error-invalid").addClass("show");
        return;
    }
    $("#new-email-address-processing").addClass("show");
    $.ajax({
        url: API_URL + '/user/email-address',
        data: JSON.stringify(request),
        type: 'PUT',
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", jwt);
        },
        success: function(response) {
            $("#new-email-address-processing").removeClass("show");
            localStorage.setItem('user', JSON.stringify(response.data.user));
            window.location.reload();
        },
        error: function(xhr, status, error) {
            let response = xhr.responseJSON;
            $("#new-email-address-processing").removeClass("show");
            if(response.message.includes("emailAddress")) {
                $("#new-email-address-error-in-use").addClass("show");
            } else {
                $("#new-email-address-error").addClass("show");
            }
        }
    });
});

$("#new-avatar-url-submit").click(function(e) {
    e.preventDefault();
    let request = {
        'avatarURL': $('#new-avatar-url-input').val(),
    };
    $("#new-avatar-url-error").removeClass("show");
    $("#new-avatar-url-error-invalid").removeClass("show");
    if(!validateAvatarURL(request.avatarURL)) {
        $("#new-avatar-url-error-invalid").addClass("show");
        return;
    }
    $("#new-avatar-url-processing").addClass("show");
    $.ajax({
        url: API_URL + '/user/avatar-url',
        data: JSON.stringify(request),
        type: 'PUT',
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", jwt);
        },
        success: function(response) {
            $("#new-avatar-url-processing").removeClass("show");
            localStorage.setItem('user', JSON.stringify(response.data.user));
            window.location.reload();
        },
        error: function(xhr, status, error) {
            let response = xhr.responseJSON;
            $("#new-avatar-url-processing").removeClass("show");
            $("#new-avatar-url-error").addClass("show");
        }
    });
});

$("#use-default-avatar-submit").click(function(e) {
    $('#new-avatar-url-input').val('/images/potato-logo.png');
    $('#new-avatar-url-submit').click();
});

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function validateAvatarURL(url) {
    return /\.png$|\.jpg$|\.jpeg$|\.glb$/.test(url);
}
