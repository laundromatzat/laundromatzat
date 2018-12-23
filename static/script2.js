// When the user scrolls down 50px from the top of the document, resize the header's font size
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.documentElement.scrollTop > 100) {
    var size = 100 - (document.documentElement.scrollTop - 50);
    document.getElementById("pageTitle").style.fontSize = String(size) + "px";
    document.getElementById("pageTitle").style.opacity = ".5";
  } else {
    document.getElementById("pageTitle").style.fontSize = "50px";
  }
}
