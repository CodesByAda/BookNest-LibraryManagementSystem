const sendMail = require('../sendMail');
const Book = require('../../models/book');
const User = require('../../models/user');

const sendPostDueReminders = async () => {
  const users = await User.find({});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const user of users) {
    for (const record of user.borrowedBooks) {
      const due = new Date(record.dueDate);
      due.setHours(0, 0, 0, 0);

      // Calculate days since due
      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 3) {
        const book = await Book.findById(record.bookId);
        const dueDateFormatted = due.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        await sendMail(
          user.email,
          '⏰ Book Return Reminder – 3 Days Overdue',
          'post-due-reminder.mjml',
          {
            username: user.name,
            bookTitle: book?.bookname || 'Your borrowed book',
            dueDate: dueDateFormatted,
            bookId: record.bookId,
          }
        );

        console.log(`Post-due reminder sent to ${user.email} for book ${book?.bookname}`);
      }
    }
  }
};

module.exports = sendPostDueReminders;
