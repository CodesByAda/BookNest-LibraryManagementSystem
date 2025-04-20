const sendMail = require('../sendMail');
const Book = require("../../models/book");
const User = require("../../models/user");

const sendDueReminders = async () => {
  const users = await User.find({});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const user of users) {
    for (const record of user.borrowedBooks) {
      const due = new Date(record.dueDate);
      due.setHours(0, 0, 0, 0);

      if (due.getTime() === today.getTime()) {
        const book = await Book.findById(record.bookId);
        const dueDateFormatted = due.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        await sendMail(
          user.email,
          '📅 Your Book is Due Today!',
          'due-reminder.mjml',
          {
            username: user.name,
            bookTitle: book?.bookname || 'Your borrowed book',
            dueDate: dueDateFormatted,
            bookId: record.bookId,
          }
        );

        console.log(`Due reminder sent to ${user.email} for book ${book?.bookname}`);
      }
    }
  }
};

module.exports = sendDueReminders;
