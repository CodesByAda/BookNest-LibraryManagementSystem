document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const suggestions = document.getElementById("suggestions");
    const books = document.querySelectorAll(".book-card");

    if (books.length === 0) {
        console.warn("No books found!");
        return;
    }

    const bookData = Array.from(books)
        .map(book => {
            const titleElement = book.querySelector(".book-title");
            if (!titleElement) {
                console.error("Book title not found in:", book);
                return null; // Skip this book
            }
            return { element: book, title: titleElement.textContent.trim().toLowerCase() };
        })
        .filter(book => book !== null); // Remove null values

    searchInput.addEventListener("input", function () {
        let filter = searchInput.value.toLowerCase().trim();
        let suggestionList = [];

        suggestions.innerHTML = ""; // Clear previous suggestions
        bookData.forEach(book => {
            if (book.title.includes(filter)) {
                book.element.style.display = "block"; // Show book
                if (!suggestionList.includes(book.title)) {
                    suggestionList.push(book.title);
                }
            } else {
                book.element.style.display = "none"; // Hide book
            }
        });

        // Display suggestions
        if (filter.length > 0 && suggestionList.length > 0) {
            suggestions.classList.remove("hidden");
            suggestionList.forEach(title => {
                let suggestionItem = document.createElement("div");
                suggestionItem.textContent = title;
                suggestionItem.className = "p-2 cursor-pointer hover:bg-gray-100";
                suggestionItem.addEventListener("click", function () {
                    searchInput.value = title;
                    suggestions.classList.add("hidden");
                    filterBooks(title);
                });
                suggestions.appendChild(suggestionItem);
            });
        } else {
            suggestions.classList.add("hidden");
        }
    });

    // Function to filter books when selecting a suggestion
    function filterBooks(query) {
        bookData.forEach(book => {
            book.element.style.display = book.title.includes(query.toLowerCase()) ? "block" : "none";
        });
    }

    // Hide suggestions when clicking outside
    document.addEventListener("click", function (e) {
        if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add("hidden");
        }
    });

    console.log("Search Input Loaded:", searchInput);
    console.log("Books Found:", bookData.length);
});