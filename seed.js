const mongoose = require('mongoose');
const Book = require('./models/book');

mongoose.connect('mongodb://localhost:27017/LMS-MGMCET')
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const books = [
    {
        bookname: "Echoes of the Forgotten",
        authorname: "Lillian Hart",
        category: "Fiction",
        isbn: "9781250789126",
        description: "A gripping tale of a woman who unearths secrets buried in the ruins of an abandoned town, only to find herself entangled in a mystery spanning generations.",
        availability: "Available",
        rack_location: "Rack 1 - Shelf 2"
    },
    {
        bookname: "The Quantum Paradox",
        authorname: "Dr. Neil Patterson",
        category: "Science",
        isbn: "9780521675347",
        description: "A deep dive into the strangest phenomena in quantum mechanics, exploring theories that challenge the very fabric of reality.",
        availability: "Unavailable",
        rack_location: "Rack 3 - Shelf 4"
    },
    {
        bookname: "Code of the Future",
        authorname: "Isabella Brooks",
        category: "Technology",
        isbn: "9781983749215",
        description: "A visionary look at how AI and machine learning will shape the future, covering ethical concerns, breakthroughs, and what lies ahead.",
        availability: "Available",
        rack_location: "Rack 5 - Shelf 1"
    },
    {
        bookname: "The Crimson Hour",
        authorname: "Victor Holloway",
        category: "Fiction",
        isbn: "9780143128546",
        description: "A detective novel set in the streets of 1920s Chicago, following a lone investigator trying to solve a murder before the clock runs out.",
        availability: "Available",
        rack_location: "Rack 2 - Shelf 5"
    },
    {
        bookname: "The Human Brain: A User’s Guide",
        authorname: "Dr. Eleanor Vance",
        category: "Science",
        isbn: "9780451495674",
        description: "An accessible yet profound journey into the workings of the human brain, explaining how thoughts, emotions, and memories shape our reality.",
        availability: "Unavailable",
        rack_location: "Rack 3 - Shelf 3"
    },
    {
        bookname: "The Art of Strategic Thinking",
        authorname: "Daniel Whitmore",
        category: "Non-Fiction",
        isbn: "9780593135664",
        description: "An insightful exploration of how top leaders make crucial decisions under pressure and the strategies they use to navigate uncertainty.",
        availability: "Available",
        rack_location: "Rack 4 - Shelf 2"
    },
    {
        bookname: "A Song for the Broken",
        authorname: "Marina Lively",
        category: "Fiction",
        isbn: "9780316278756",
        description: "A heartbreaking yet inspiring novel about love, loss, and finding the courage to heal after tragedy.",
        availability: "Available",
        rack_location: "Rack 1 - Shelf 6"
    },
    {
        bookname: "AI Revolution: Beyond Human Intelligence",
        authorname: "Dr. Xavier Mitchell",
        category: "Technology",
        isbn: "9780812996746",
        description: "A thought-provoking look at how artificial intelligence is surpassing human cognition and reshaping industries worldwide.",
        availability: "Unavailable",
        rack_location: "Rack 5 - Shelf 3"
    },
    {
        bookname: "The Last Astronaut",
        authorname: "Catherine Phelps",
        category: "Fiction",
        isbn: "9780743478563",
        description: "A sci-fi thriller following the final mission of a stranded astronaut who uncovers a terrifying truth about deep space travel.",
        availability: "Available",
        rack_location: "Rack 2 - Shelf 1"
    },
    {
        bookname: "Understanding the Cosmos",
        authorname: "Dr. Adrian Novak",
        category: "Science",
        isbn: "9780679643784",
        description: "An awe-inspiring journey through the universe, explaining black holes, dark matter, and the mysteries of space in layman's terms.",
        availability: "Unavailable",
        rack_location: "Rack 3 - Shelf 5"
    },
    {
        bookname: "The Masterpiece Within",
        authorname: "Sophia Alden",
        category: "Non-Fiction",
        isbn: "9781250210094",
        description: "A motivational book about unlocking creativity and transforming challenges into opportunities for growth.",
        availability: "Available",
        rack_location: "Rack 4 - Shelf 5"
    },
    {
        bookname: "Ghosts of the Silent Bay",
        authorname: "Henry Caldwell",
        category: "Fiction",
        isbn: "9780316069287",
        description: "A supernatural mystery set in a coastal town where whispers from the past lead a journalist to uncover long-lost secrets.",
        availability: "Available",
        rack_location: "Rack 1 - Shelf 4"
    },
    {
        bookname: "The Cybersecurity Handbook",
        authorname: "Rachel Klein",
        category: "Technology",
        isbn: "9780134757599",
        description: "A guide to staying secure in the digital age, with real-world examples of cyberattacks and how to protect against them.",
        availability: "Unavailable",
        rack_location: "Rack 5 - Shelf 4"
    },
    {
        bookname: "Breaking the Time Barrier",
        authorname: "Dr. Leonard Bishop",
        category: "Science",
        isbn: "9780143115287",
        description: "A groundbreaking book exploring theories of time travel, relativity, and the possibilities of bending time.",
        availability: "Available",
        rack_location: "Rack 3 - Shelf 1"
    },
    {
        bookname: "The Shadow Conspiracy",
        authorname: "Ethan Vance",
        category: "Fiction",
        isbn: "9780345497481",
        description: "A political thriller uncovering a hidden network manipulating world governments from behind the scenes.",
        availability: "Available",
        rack_location: "Rack 2 - Shelf 3"
    },
    {
        bookname: "Hacking the Mind",
        authorname: "Dr. Victoria Lane",
        category: "Science",
        isbn: "9781400032716",
        description: "An eye-opening look into how cognitive biases, social engineering, and propaganda shape human behavior and decision-making.",
        availability: "Unavailable",
        rack_location: "Rack 3 - Shelf 6"
    },
    {
        bookname: "Beneath the Ashes",
        authorname: "Nora Calloway",
        category: "Fiction",
        isbn: "9780751574194",
        description: "A thrilling drama about a woman who returns to her childhood home after a devastating fire, only to uncover dark secrets buried in its ashes.",
        availability: "Available",
        rack_location: "Rack 1 - Shelf 3"
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
