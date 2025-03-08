document.getElementById("studentForm").addEventListener("submit", function (event) {
    event.preventDefault();

    let valid = true;

    function validateField(selector, errorSelector) {
        let field = document.querySelector(selector);
        let errorMessage = document.querySelector(errorSelector);

        if (field.value.trim() === "") {
            errorMessage.classList.remove("hidden");
            valid = false;
        } else {
            errorMessage.classList.add("hidden");
        }
    }

    // Validate required fields
    validateField("input[name='name']", "#nameError");
    validateField("input[name='address']", "#addressError");
    validateField("input[name='course']", "#courseError");
    validateField("input[name='semester']", "#semesterError");
    validateField("input[name='rollno']", "#rollnoError");
    validateField("input[name='password']", "#passwordError");

    // Phone Number Validation
    let phone = document.querySelector("input[name='phone']");
    let phoneError = document.querySelector("#phoneError");
    let phoneRegex = /^[6-9]\d{9}$/;

    if (!phone || !phoneRegex.test(phone.value.trim())) {
        phoneError.classList.remove("hidden");
        valid = false;
    } else {
        phoneError.classList.add("hidden");
    }

    // Email Validation
    let email = document.querySelector("input[name='email']");
    let emailError = document.querySelector("#emailError");
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email.value.trim())) {
        emailError.classList.remove("hidden");
        valid = false;
    } else {
        emailError.classList.add("hidden");
    }

    // If form is valid, show loader and submit the form
    if (valid) {
        let loaderdiv = document.getElementById("loader");

        setTimeout(() => {
            loaderdiv.classList.remove("hidden");
            loaderdiv.classList.add("flex");
        }, 1000);

        setTimeout(() => {
            document.getElementById("studentForm").submit();
        }, 5000);

        setTimeout(() => {
            loaderdiv.classList.add("hidden");
            loaderdiv.classList.remove("flex");
        }, 7000);
    }
});
