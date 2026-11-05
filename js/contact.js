$("contactForm").onsubmit = e => {
  e.preventDefault();
  toast("Message sent. We reply within one working day.");
  e.target.reset();
};
