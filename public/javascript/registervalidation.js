document.getElementById("studentForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form submission

    let valid = true;

    function validateField(id, errorId) {
        let value = document.getElementById(id).value.trim();
        if (value === "") {
            document.getElementById(errorId).classList.remove("hidden");
            valid = false;
        } else {
            document.getElementById(errorId).classList.add("hidden");
        }
    }

    validateField("name", "nameError");
    validateField("password", "passwordError");
    validateField("department", "departmentError");
    validateField("semester", "semesterError");

    // Phone Number Validation
    let phone = document.getElementById("phone").value.trim();
    let phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        document.getElementById("phoneError").classList.remove("hidden");
        document.getElementById("phoneTick").classList.add("hidden");
        valid = false;
    } else {
        document.getElementById("phoneError").classList.add("hidden");
        document.getElementById("phoneTick").classList.remove("hidden");
    }

    // Email Validation
    let email = document.getElementById("email").value.trim();
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById("emailError").classList.remove("hidden");
        document.getElementById("emailTick").classList.add("hidden");
        valid = false;
    } else {
        document.getElementById("emailError").classList.add("hidden");
        document.getElementById("emailTick").classList.remove("hidden");
    }

    if (valid) {
        let loaderdiv = document.getElementById("loader");

        setTimeout(() => {
            loaderdiv.classList.remove("hidden");
            loaderdiv.classList.add("flex");
        }, 1000);
        

        setTimeout(() => {
            window.location.href = "/";
        }, 5000);
        setTimeout(() => {
            loaderdiv.classList.add("hidden");
            loaderdiv.classList.remove("flex"); 
        }, 7000);
    }
});