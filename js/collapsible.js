let collapsibles = document.getElementsByClassName("collapsible");

for (let i = 0; i < collapsibles.length; i++) {
  collapsibles[i].addEventListener("click", function(e) {
      e.preventDefault();
      let href = this.href;
      let collapsibleElement = document.getElementById(href.substr(href.lastIndexOf("#") + 1));
      //let collapsibleElement = $(href.substr(href.lastIndexOf("#")))[0];
      if (collapsibleElement.style.maxHeight) {
          collapsibleElement.style.maxHeight = null;
          $(this).addClass("collapsed");
      } else {
          collapsibleElement.style.maxHeight = collapsibleElement.scrollHeight + "px";
          $(this).removeClass("collapsed");
      }
  });
}
