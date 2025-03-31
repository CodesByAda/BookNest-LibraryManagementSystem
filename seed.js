const mongoose = require('mongoose');
const Book = require('./models/book');

mongoose.connect('mongodb://localhost:27017/LMS-MGMCET')
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const books = [
    {
        bookname: "The Great Gatsby",
        authorname: "F. Scott Fitzgerald",
        category: "Fiction",
        stock: 10,
        description: "A story about the mysterious Jay Gatsby and his obsession with Daisy Buchanan.",
        availability: "Available",
        rack_location: "A1",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "Sapiens: A Brief History of Humankind",
        authorname: "Yuval Noah Harari",
        category: "Non-Fiction",
        stock: 5,
        description: "A narrative of the history of human beings from the Stone Age to modern times.",
        availability: "Available",
        rack_location: "B2",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "A Brief History of Time",
        authorname: "Stephen Hawking",
        category: "Science",
        stock: 8,
        description: "An exploration of the cosmos and our place within it, addressing cosmology, black holes, and time.",
        availability: "Unavailable",
        rack_location: "C3",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "The Diary of a Young Girl",
        authorname: "Anne Frank",
        category: "History",
        stock: 12,
        description: "The personal diary of Anne Frank, a Jewish girl who hid from the Nazis during World War II.",
        availability: "Available",
        rack_location: "D4",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "The Innovators",
        authorname: "Walter Isaacson",
        category: "Technology",
        stock: 7,
        description: "The story of the pioneers who created the computer and the Internet.",
        availability: "Available",
        rack_location: "E5",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "1984",
        authorname: "George Orwell",
        category: "Fiction",
        stock: 10,
        description: "A dystopian novel about a totalitarian regime that uses surveillance and thought control.",
        availability: "Unavailable",
        rack_location: "F6",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "Educated",
        authorname: "Tara Westover",
        category: "Non-Fiction",
        stock: 6,
        description: "A memoir about a girl who grows up in a strict and isolated family and seeks education beyond their world.",
        availability: "Available",
        rack_location: "G7",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "The Selfish Gene",
        authorname: "Richard Dawkins",
        category: "Science",
        stock: 9,
        description: "An explanation of evolutionary biology from the perspective of genes, and how they shape animal behavior.",
        availability: "Available",
        rack_location: "H8",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "The Gun",
        authorname: "C.J. Chivers",
        category: "History",
        stock: 4,
        description: "A history of the AK-47 rifle and its influence on world conflicts.",
        availability: "Unavailable",
        rack_location: "I9",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "The Code Book",
        authorname: "Simon Singh",
        category: "Technology",
        stock: 6,
        description: "A history of cryptography and its impact on the development of modern technology and security.",
        availability: "Available",
        rack_location: "J10",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "The Catcher in the Rye",
        authorname: "J.D. Salinger",
        category: "Fiction",
        stock: 10,
        description: "A story about Holden Caulfield and his journey through adolescence and disillusionment.",
        availability: "Available",
        rack_location: "K11",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "The Man Who Knew Infinity",
        authorname: "Robert Kanigel",
        category: "Non-Fiction",
        stock: 8,
        description: "A biography of the mathematician Srinivasa Ramanujan and his extraordinary contributions to mathematics.",
        availability: "Available",
        rack_location: "L12",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "Astrophysics for People in a Hurry",
        authorname: "Neil deGrasse Tyson",
        category: "Science",
        stock: 5,
        description: "A quick, engaging guide to the universe and the most important concepts in astrophysics.",
        availability: "Available",
        rack_location: "M13",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "The History of the Ancient World",
        authorname: "Susan Wise Bauer",
        category: "History",
        stock: 7,
        description: "An overview of the rise and fall of ancient civilizations, including Mesopotamia, Egypt, Greece, and Rome.",
        availability: "Unavailable",
        rack_location: "N14",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "The Second Machine Age",
        authorname: "Erik Brynjolfsson",
        category: "Technology",
        stock: 9,
        description: "A look at how technology, automation, and artificial intelligence will change the future of work and society.",
        availability: "Available",
        rack_location: "O15",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "Brave New World",
        authorname: "Aldous Huxley",
        category: "Fiction",
        stock: 6,
        description: "A dystopian novel exploring a world of genetic engineering, social conditioning, and totalitarian control.",
        availability: "Unavailable",
        rack_location: "P16",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "Homo Deus: A Brief History of Tomorrow",
        authorname: "Yuval Noah Harari",
        category: "Non-Fiction",
        stock: 7,
        description: "A look at the future of humanity, exploring artificial intelligence, genetic engineering, and more.",
        availability: "Available",
        rack_location: "Q17",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "The Gene: An Intimate History",
        authorname: "Siddhartha Mukherjee",
        category: "Science",
        stock: 4,
        description: "A history of the gene, from its discovery to its role in shaping human history, health, and behavior.",
        availability: "Available",
        rack_location: "R18",
        coverImage: "/images/book.jpg"
    },
    {
        bookname: "The Rise and Fall of the Third Reich",
        authorname: "William L. Shirer",
        category: "History",
        stock: 5,
        description: "A comprehensive history of Nazi Germany, from its origins to its eventual defeat in World War II.",
        availability: "Available",
        rack_location: "S19",
        coverImage: "/images/book.jpg"
    }
];

// More books would follow in this same format until the total reaches 100.


const seedBooks = async () => {
    try {
        await Book.deleteMany({}); // Clear old data
        await Book.insertMany(books);
        console.log("📚 Books added successfully!");
    } catch (error) {
        console.error("❌ Error inserting books:", error);
    } finally {
        mongoose.connection.close();
    }
};

seedBooks();
