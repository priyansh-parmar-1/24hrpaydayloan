document.addEventListener('DOMContentLoaded', function () {
  var amountGrid = document.getElementById('amountGrid');
  var stepAmount = document.getElementById('step-amount');
  var stepEmail = document.getElementById('step-email');
  var backLink = document.getElementById('backLink');
  var form = document.getElementById('leadForm');
  var emailInput = document.getElementById('emailInput');
  var emailError = document.getElementById('emailError');
  var selectedAmount = null;

  amountGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.amount-btn');
    if (!btn) return;
    selectedAmount = btn.getAttribute('data-amount');
    stepAmount.style.display = 'none';
    stepEmail.classList.add('active');
    emailInput.focus();
  });

  backLink.addEventListener('click', function () {
    stepEmail.classList.remove('active');
    stepAmount.style.display = 'block';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = emailInput.value.trim();
    var validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!validEmail) {
      emailError.style.display = 'block';
      return;
    }
    emailError.style.display = 'none';

    var params = new URLSearchParams({
      amount: selectedAmount,
      email: email
    });
    window.location.href = 'apply.html?' + params.toString();
  });
});
