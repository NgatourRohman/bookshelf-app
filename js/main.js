const STORAGE_KEY = 'BOOKSHELF_APPS';

let books = [];
let isEditMode = false;
let editingBookId = null;
let originalBookData = null;

function isStorageSupported() {
    return typeof Storage !== 'undefined';
}

function saveToStorage() {
    if (isStorageSupported()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(books));

        console.log('Data berhasil disimpan!');
    }
}

function loadFromStorage() {
    if (isStorageSupported()) {
        const storedData = localStorage.getItem(STORAGE_KEY);

        if (storedData) {
            books = JSON.parse(storedData);

            console.log('Data berhasil dimuat!');
        } else {
            books = [];

            console.log('Storage kosong, memulai dengan daftar kosong');
        }
    }
}

function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

function showNotification(message, type = "success") {
    const container = document.getElementById("notification-container");

    const notification = document.createElement("div");
    notification.classList.add("notification", type);
    notification.textContent = message;

    container.append(notification);

    setTimeout(() => {
        notification.classList.add("show");
    }, 10);

    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function createBookElement(book) {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';

    bookCard.setAttribute('data-testid', 'bookItem');
    bookCard.setAttribute('data-bookid', book.id);

    const bookStatus = document.createElement('div');
    bookStatus.className = 'book-status';

    const badge = document.createElement('span');
    badge.className = book.isComplete ? 'badge-reading-completed' : 'badge-reading-incompleted';
    badge.textContent = book.isComplete ? 'Completed' : 'Reading';

    bookStatus.appendChild(badge);

    const title = document.createElement('h3');
    title.className = 'book-title';
    title.setAttribute('data-testid', 'bookItemTitle');
    title.textContent = book.title;

    const author = document.createElement('p');
    author.className = 'author-container';
    author.setAttribute('data-testid', 'bookItemAuthor');
    author.textContent = `Penulis: ${book.author}`;

    const year = document.createElement('p');
    year.setAttribute('data-testid', 'bookItemYear');
    year.textContent = `Tahun: ${book.year}`;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-outline';
    toggleBtn.setAttribute('data-testid', 'bookItemIsCompleteButton');
    toggleBtn.textContent = book.isComplete ? 'Belum selesai' : 'Selesai';

    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'trash-btn';
    deleteBtn.setAttribute('data-testid', 'bookItemDeleteButton');
    deleteBtn.textContent = 'Hapus';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.setAttribute('data-testid', 'bookItemEditButton');
    editBtn.textContent = 'Edit';

    btnGroup.append(deleteBtn, editBtn);

    bookCard.append(
        bookStatus,
        title,
        author,
        year,
        toggleBtn,
        btnGroup
    );

    return bookCard
}

function renderBooks(booksToRender = books) {
    const incompleteContainer = document.getElementById('incompleteBookList');
    const completeContainer = document.getElementById('completeBookList');

    if (!incompleteContainer || !completeContainer) {
        console.error('Container tidak ditemukan');
        return;
    }

    while (incompleteContainer.firstChild) {
        incompleteContainer.removeChild(incompleteContainer.firstChild);
    }

    while (completeContainer.firstChild) {
        completeContainer.removeChild(completeContainer.firstChild);
    }

    for (let i = 0; i < booksToRender.length; i++) {
        const book = booksToRender[i];

        const bookElement = createBookElement(book);

        if (book.isComplete) {
            completeContainer.appendChild(bookElement);
        } else {
            incompleteContainer.appendChild(bookElement);
        }
    }

    updateStats();

    console.log('Render selesai');
}

function updateStats() {
    const totalBuku = books.length;

    const bukuSelesai = books.filter(function (book) {
        return book.isComplete === true;
    }).length

    const bukuBelumSelesai = totalBuku - bukuSelesai;

    const totalElement = document.querySelector('.stat-number-total');
    const belumElement = document.querySelector('.stat-number-incompleted');
    const selesaiElement = document.querySelector('.stat-number-completed');

    if (totalElement) totalElement.innerText = totalBuku;
    if (belumElement) belumElement.innerText = bukuBelumSelesai;
    if (selesaiElement) selesaiElement.innerText = bukuSelesai;

    const incompleteCountSpan = document.querySelector('.not-completed .book-count');
    const completeCountSpan = document.querySelector('.completed .book-count');

    if (incompleteCountSpan) incompleteCountSpan.innerText = bukuBelumSelesai + ' BUKU';
    if (completeCountSpan) completeCountSpan.innerText = bukuSelesai + ' BUKU';
}

const bookForm = document.getElementById('bookForm');

if (bookForm) {
    bookForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const title = document.getElementById('bookFormTitle').value;
        const author = document.getElementById('bookFormAuthor').value;
        const year = document.getElementById('bookFormYear').value;
        const isComplete = document.getElementById('bookFormIsComplete').checked;

        if (saveBook(title, author, year, isComplete)) {
            bookForm.reset();
        }
    });
}

function saveBook(title, author, year, isComplete) {
    if (!title || !author || !year) {
        showNotification('Semua field harus diisi!', 'error');
        return false;
    }

    const yearNum = Number(year);
    const currentYear = new Date().getFullYear();

    if (isNaN(yearNum) || !Number.isInteger(yearNum) || yearNum < 1900 || yearNum > currentYear + 5) {
        showNotification(`Tahun harus angka antara 1900 - ${currentYear + 5}!`, 'error');
        return false;
    }

    if (isEditMode && editingBookId) {
        const bookIndex = books.findIndex(function (book) {
            return book.id === editingBookId;
        });

        if (bookIndex !== -1) {
            books[bookIndex].title = title.trim();
            books[bookIndex].author = author.trim();
            books[bookIndex].year = yearNum;
            books[bookIndex].isComplete = isComplete;

            saveToStorage();
            renderBooks();

            isEditMode = false;
            editingBookId = null;
            originalBookData = null;

            document.getElementById('bookFormSubmit').innerText = 'Masukkan Buku';
            hideCancelButton();

            showNotification('Buku berhasil diupdate!', 'success');
            return true;
        }
    }
    else {
        const newBook = {
            id: generateId(),
            title: title.trim(),
            author: author.trim(),
            year: yearNum,
            isComplete: isComplete
        };

        books.push(newBook);
        saveToStorage();
        renderBooks();

        showNotification('Buku berhasil ditambahkan!', 'success');
        return true;
    }
}

function deleteBook(bookId) {
    if (confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
        books = books.filter(function (book) {
            return book.id !== bookId;
        });

        saveToStorage();
        renderBooks();
        showNotification('Buku berhasil dihapus!');
    }
}

function toggleComplete(bookId) {
    const bookIndex = books.findIndex(function (book) {
        return book.id === bookId;
    });

    if (bookIndex !== -1) {
        books[bookIndex].isComplete = !books[bookIndex].isComplete;

        const status = books[bookIndex].isComplete ? 'selesai' : 'belum selesai';

        saveToStorage();
        renderBooks();
        showNotification(`Buku ditandai ${status}!`);
    }
}

function editBook(bookId) {
    const book = books.find(function (b) {
        return b.id === bookId;
    });

    if (book) {
        isEditMode = true;
        editingBookId = bookId;

        originalBookData = {
            title: book.title,
            author: book.author,
            year: book.year,
            isComplete: book.isComplete
        };

        console.log('Data asli disimpan:', originalBookData);

        document.getElementById('bookFormTitle').value = book.title;
        document.getElementById('bookFormAuthor').value = book.author;
        document.getElementById('bookFormYear').value = book.year;
        document.getElementById('bookFormIsComplete').checked = book.isComplete;

        const submitBtn = document.getElementById('bookFormSubmit');
        submitBtn.innerText = 'Update Buku';

        showCancelButton();

        document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
    }
}

function showCancelButton() {
    let cancelBtn = document.getElementById('cancelEditBtn');

    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.className = 'btn-form cancel-btn';
        cancelBtn.innerText = 'Batal Edit';
        cancelBtn.type = 'button';

        cancelBtn.addEventListener('click', cancelEdit);

        const submitBtn = document.getElementById('bookFormSubmit');

        let buttonContainer = document.querySelector('.form-buttons');
        if (!buttonContainer) {
            buttonContainer = document.createElement('div');
            buttonContainer.className = 'form-buttons';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '10px';
            buttonContainer.style.marginTop = '20px';

            submitBtn.parentNode.insertBefore(buttonContainer, submitBtn);
            buttonContainer.appendChild(submitBtn);
        }

        buttonContainer.appendChild(cancelBtn);
    }
}

function cancelEdit() {
    if (originalBookData && editingBookId) {

        const bookIndex = books.findIndex(function (book) {
            return book.id === editingBookId;
        });

        if (bookIndex !== -1) {
            books[bookIndex].title = originalBookData.title;
            books[bookIndex].author = originalBookData.author;
            books[bookIndex].year = originalBookData.year;
            books[bookIndex].isComplete = originalBookData.isComplete;

            saveToStorage();

            renderBooks();

            console.log('Data dikembalikan ke:', originalBookData);
        }
    }

    isEditMode = false;
    editingBookId = null;
    originalBookData = null;

    document.getElementById('bookForm').reset();

    const submitBtn = document.getElementById('bookFormSubmit');
    submitBtn.innerText = 'Masukkan Buku';

    hideCancelButton();

    showNotification('Edit dibatalkan. Buku kembali ke semula.');
}

function hideCancelButton() {
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.remove();
    }

    const submitBtn = document.getElementById('bookFormSubmit');
    const buttonContainer = document.querySelector('.form-buttons');

    if (buttonContainer && buttonContainer.children.length === 1) {
        buttonContainer.parentNode.insertBefore(submitBtn, buttonContainer);
        buttonContainer.remove();
    }
}

function searchBooks(keyword) {
    if (!keyword.trim()) {
        renderBooks();
        return;
    }

    const searchTerm = keyword.toLowerCase().trim();

    const filteredBooks = books.filter(function (book) {
        const titleMatch = book.title.toLowerCase().includes(searchTerm);
        const authorMatch = book.author.toLowerCase().includes(searchTerm);

        return titleMatch || authorMatch;
    });

    renderBooks(filteredBooks);

    if (filteredBooks.length === 0) {
        showNotification('Buku tidak ditemukan!');
    } else {
        showNotification(`Ditemukan ${filteredBooks.length} buku`);
    }
}

function resetSearch() {
    document.getElementById('searchBookTitle').value = '';
    renderBooks();
    showNotification('Menampilkan semua buku');
}

const searchForm = document.getElementById('searchBook');
if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const keyword = document.getElementById('searchBookTitle').value;
        searchBooks(keyword);
    });
}

function setupEventDelegation() {
    document.addEventListener('click', function (event) {
        const target = event.target;

        const bookCard = target.closest('[data-testid="bookItem"]');
        if (!bookCard) return;

        const bookId = bookCard.getAttribute('data-bookid');

        if (target.matches('[data-testid="bookItemIsCompleteButton"]')) {
            toggleComplete(bookId);
            return;
        }
        if (target.matches('[data-testid="bookItemDeleteButton"]')) {
            deleteBook(bookId);
            return;
        }
        if (target.matches('[data-testid="bookItemEditButton"]')) {
            editBook(bookId);
            return;
        }
    });
}

function init() {
    console.log('Bookshelf App starting...');

    isEditMode = false;
    editingBookId = null;
    originalBookData = null;

    const incompleteContainer = document.getElementById('incompleteBookList');
    const completeContainer = document.getElementById('completeBookList');

    if (incompleteContainer) {
        while (incompleteContainer.firstChild) {
            incompleteContainer.removeChild(incompleteContainer.firstChild);
        }
    }

    if (completeContainer) {
        while (completeContainer.firstChild) {
            completeContainer.removeChild(completeContainer.firstChild);
        }
    }

    loadFromStorage();
    renderBooks();
    setupEventDelegation();

    if (!document.querySelector('.reset-search-btn')) {
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'search-button reset-search-btn';
        resetBtn.innerText = 'Reset';
        resetBtn.addEventListener('click', resetSearch);

        const searchForm = document.getElementById('searchBook');
        const searchButton = searchForm.querySelector('.search-button');
        if (searchButton) {
            searchButton.parentNode.insertBefore(resetBtn, searchButton.nextSibling);
        }
    }
    console.log('Bookshelf App ready!');
}

document.addEventListener('DOMContentLoaded', init);