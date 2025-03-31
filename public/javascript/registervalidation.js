document.getElementById("studentForm").addEventListener("submit", function (event) {
    event.preventDefault();

    let valid = true;

    // ✅ Helper function for required field validation
    function validateRequiredField(selector, errorSelector) {
        const field = document.querySelector(selector);
        const errorMessage = document.querySelector(errorSelector);

        // ⚠️ Handle autofill issues with direct value access
        const value = field.value || field.getAttribute('value') || ""; 

        if (value.trim() === "") {
            errorMessage.textContent = "This field is required";
            errorMessage.classList.remove("hidden");
            valid = false;
        } else {
            errorMessage.classList.add("hidden");
        }
    }

    // ✅ Helper function for regex validation
    function validateWithRegex(selector, errorSelector, regex, errorMsg) {
        const field = document.querySelector(selector);
        const errorMessage = document.querySelector(errorSelector);

        if (field.value.trim() !== "" && !regex.test(field.value.trim())) {
            errorMessage.textContent = errorMsg;
            errorMessage.classList.remove("hidden");
            valid = false;
        } else if (field.value.trim() !== "") {
            errorMessage.classList.add("hidden");
        }
    }

    // ✅ Validate Required Fields
    validateRequiredField("input[name='name']", "#nameError");
    validateRequiredField("input[name='address']", "#addressError");
    validateRequiredField("input[name='course']", "#courseError");
    validateRequiredField("input[name='semester']", "#semesterError");
    validateRequiredField("input[name='rollno']", "#rollnoError");

    // ✅ Explicitly validate password separately
    const passwordField = document.getElementById("user-password");  // ✅ Updated ID
    const passwordError = document.getElementById("passwordError");

    const passwordValue = passwordField.value || passwordField.getAttribute('value') || "";

    if (passwordValue.trim() === "") {
        passwordError.textContent = "Password is required";
        passwordError.classList.remove("hidden");
        valid = false;
    } else {
        passwordError.classList.add("hidden");
    }

    // ✅ Validate Phone with Regex (updated ID)
    const phoneRegex = /^[6-9]\d{9}$/;
    validateWithRegex("#user-phone", "#phoneError", phoneRegex, "Enter a valid phone number");

    // ✅ Validate Email with Regex (updated ID)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validateWithRegex("#user-email", "#emailError", emailRegex, "Enter a valid email");

    // ✅ Show loader and submit form if valid
    const loaderdiv = document.getElementById("loader");

    if (valid) {
        loaderdiv.classList.remove("hidden");
        loaderdiv.classList.add("flex");

        // ✅ Submit form immediately
        this.submit();
    } else {
        loaderdiv.classList.add("hidden");
        loaderdiv.classList.remove("flex");
    }
});
