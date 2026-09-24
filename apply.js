console.log("apply.js loaded");
document.addEventListener('DOMContentLoaded', function () {

    var form = document.getElementById('applyForm');
    var statusMsg = document.getElementById('statusMsg');
    var submitBtn = document.getElementById('submitBtn');

    var modal = document.getElementById('submitModal');
    var modalTitle = document.getElementById('modalTitle');
    var modalMessage = document.getElementById('modalMessage');
    var modalOkBtn = document.getElementById('modalOkBtn');

    // Prefill from homepage
    var params = new URLSearchParams(window.location.search);

    var amount = params.get('amount');
    var email = params.get('email');

    if (amount) {
        document.getElementById('loanAmount').value = amount;
    }

    if (email) {
        document.getElementById('email').value = email;
    }

    var phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function () {
        phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
    });

    var zipInput = document.getElementById('zip');
    zipInput.addEventListener('input', function () {
        zipInput.value = zipInput.value.replace(/\D/g, '').slice(0, 5);
    });

    function validate(data) {

        var errors = [];

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push(['email', 'Enter a valid email.']);
        }

        if (!/^\d{5}$/.test(data.zip)) {
            errors.push(['zip', 'Enter a 5-digit ZIP.']);
        }

        if (!data.address || !data.address.trim()) {
            errors.push(['address', 'Required.']);
        }

        if (!data.firstName.trim()) {
            errors.push(['firstName', 'Required.']);
        }

        if (!data.lastName.trim()) {
            errors.push(['lastName', 'Required.']);
        }

        if (!/^\d{10}$/.test(data.phone)) {
            errors.push(['phone', 'Enter exactly 10 digits.']);
        }

        return errors;
    }

    function showModal(title, message, redirectToHome) {

        if (!modal || !modalTitle || !modalMessage) {
            return;
        }

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        modal.dataset.redirect = redirectToHome ? 'true' : 'false';

        modal.classList.remove('hidden');
    }

    function hideModal() {

        if (!modal) {
            return;
        }

        modal.classList.add('hidden');
    }

    modalOkBtn.addEventListener('click', function () {

        hideModal();

        if (modal.dataset.redirect === 'true') {
            window.location.href = '/';
        }
    });

    function submitLeadRequest() {

    console.log("Submit button clicked");

    var fd = new FormData(form);
    var data = Object.fromEntries(fd.entries());

    console.log("Form data:", data);

    var errors = validate(data);

    console.log("Validation errors:", errors);

    if (errors.length) {

        console.log("Validation failed");

        errors.forEach(function (err) {

            var field = document.getElementById(err[0]);

            if (field) {

                var errEl =
                    field.parentElement.querySelector('.field-error');

                field.style.borderColor = '#c1443c';

                if (errEl) {
                    errEl.textContent = err[1];
                    errEl.style.display = 'block';
                }
            }
        });

        return;
    }

    console.log("Validation passed");

    delete data.company;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    console.log("About to call API");

    fetch('/api/submit-lead', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(function (res) {

            console.log("API response status:", res.status);

            return res.text().then(function (text) {

                console.log("API response body:", text);

                var json;

                try {
                    json = text ? JSON.parse(text) : {};
                } catch (error) {
                    throw new Error(
                        'Invalid server response: ' + text
                    );
                }

                if (!res.ok) {
                    throw new Error(
                        json && json.error
                            ? json.error
                            : 'Request failed'
                    );
                }

                return json;
            });
        })
        .then(function (response) {

            console.log("SUCCESS:", response);

            showModal(
                'Request submitted',
                'Your details were submitted successfully.',
                true
            );

            submitBtn.textContent = 'Submitted';
        })
        .catch(function (error) {

            console.error("API ERROR:", error);

            showModal(
                'Submission failed',
                'Something went wrong. Please try after some time.',
                false
            );

            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit request';
        });
}

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        submitLeadRequest();
    });

});
