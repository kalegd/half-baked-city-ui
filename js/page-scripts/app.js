var jwt = localStorage.getItem('jwt');

///////////////
// Functions //
///////////////

function setComments(comments) {
    if(comments.length == 0) {
        $("#comments-div")[0].innerHTML = "<p>No Comments</p>";
        return;
    }
    comments.sort((a, b) => b.createdAt - a.createdAt);
    let commentsHtml = "";
    for(let i = 0; i < comments.length; i++) {
        commentsHtml += '<p class="comment">' + comments[i].comment + "</p>";
    }
    $("#comments-div")[0].innerHTML = commentsHtml;
}

//////////
// Main //
//////////

appId = $('meta[name=id]').attr("content");
setImmersions(appId, "immersions");

$.ajax({
    url: API_URL + '/resource/' + appId + "/comments",
    type: 'GET',
    contentType: 'application/json',
    dataType: 'json',
    success: function(response) {
        setComments(response.data.comments.comments);
    },
    error: function(xhr, status, error) {
        if(xhr.status == 404) {
            setComments([]);
            return;
        }
        $("#comments-div")[0].innerHTML = "<p>&#129301;</p>"; //Bandaged Head Emoji
    }
});

$("#comment-button").click(function(e) {
    e.preventDefault();
    if($("#comment-button").hasClass("disabled")) {
        return;
    }
    $("#comment-processing").removeClass("show");
    $("#comment-error-authenticate").removeClass("show");
    $("#comment-error").removeClass("show");
    if(jwt == null) {
        $("#comment-error-authenticate").addClass("show");
        return;
    }
    let comment = $("#new-comment").val();
    if(comment.length == 0) {
        return;
    }
    $("#comment-processing").addClass("show");
    $("#comment-button").addClass("disabled");
    let request = {
        'comment': comment,
    };
    $.ajax({
        url: API_URL + '/resource/' + appId + "/comment",
        data: JSON.stringify(request),
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", jwt);
        },
        success: function(response) {
            $("#comment-button").removeClass("disabled");
            $("#comment-processing").removeClass("show");
            let comment = response.data.comment.comment;
            let commentHtml = '<p class="comment">' + comment + "</p>";
            if($("#comments-div")[0].innerText == "No Comments") {
                $("#comments-div")[0].innerHTML = commentHtml;
            } else {
                $("#comments-div")[0].innerHTML = commentHtml + $("#comments-div")[0].innerHTML;
            }
            $("#new-comment").val("");
        },
        error: function(xhr, status, error) {
            $("#comment-button").removeClass("disabled");
            $("#comment-processing").removeClass("show");
            $("#comment-error").addClass("show");
        }
    });
});
