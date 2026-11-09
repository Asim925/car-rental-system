document.getElementById("contactForm").onsubmit = function (event) {
  event.preventDefault();

  showToast("Message sent. We reply within one working day.");
  event.target.reset();
};
