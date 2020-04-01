var jwt = localStorage.getItem('jwt');
var user = localStorage.getItem('user');
if(jwt == null || user == null) {
    $("#navbar")[0].innerHTML += '<a href="/authenticate">Login</a>';
} else {
    $("#navbar")[0].innerHTML += '<a href="/account">Account</a>';
}
