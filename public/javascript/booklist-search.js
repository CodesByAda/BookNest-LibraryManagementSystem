document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const suggestions = document.getElementById("suggestions");
    const books = document.querySelectorAll(".book-card");

    if (books.length === 0) {
        console.warn("No books found!");
        return;
    }

    // On Enter key, reload page with search query
    searchInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/books?search=${encodeURIComponent(query)}`;
            }
        }
    });

    // Search suggestions based on currently loaded books
    const bookData = Array.from(books)
        .map(book => {
            const titleElement = book.querySelector(".book-title");
            if (!titleElement) {
                console.error("Book title not found in:", book);
                return null;
            }
            return { element: book, title: titleElement.textContent.trim().toLowerCase() };
        })
        .filter(book => book !== null);

    searchInput.addEventListener("input", function () {
        let filter = searchInput.value.toLowerCase().trim();
        let suggestionList = [];

        suggestions.innerHTML = "";
        bookData.forEach(book => {
            if (book.title.includes(filter)) {
                book.element.style.display = "block";
                if (!suggestionList.includes(book.title)) {
                    suggestionList.push(book.title);
                }
            } else {
                book.element.style.display = "none";
            }
        });

        if (filter.length > 0 && suggestionList.length > 0) {
            suggestions.classList.remove("hidden");
            suggestionList.forEach(title => {
                let suggestionItem = document.createElement("div");
                suggestionItem.textContent = title;
                suggestionItem.className = "p-2 cursor-pointer hover:bg-gray-100";
                suggestionItem.addEventListener("click", function () {
                    searchInput.value = title;
                    suggestions.classList.add("hidden");
                    window.location.href = `/books?search=${encodeURIComponent(title)}`;
                });
                suggestions.appendChild(suggestionItem);
            });
        } else {
            suggestions.classList.add("hidden");
        }
    });

    document.addEventListener("click", function (e) {
        if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add("hidden");
        }
    });

    console.log("Search Input Loaded:", searchInput);
    console.log("Books Found:", bookData.length);
});
