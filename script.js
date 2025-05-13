// Initialize the balance and transactions from localStorage or set defaults
let balance = parseFloat(localStorage.getItem('balance')) || 0;
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];

// DOM Elements
const balanceElement = document.getElementById('balance');
const totalIncomeElement = document.getElementById('totalIncome');
const totalExpensesElement = document.getElementById('totalExpenses');
const addBtn = document.getElementById('addBtn');
const subtractBtn = document.getElementById('subtractBtn');
const transactionForm = document.getElementById('transactionForm');
const amountInput = document.getElementById('amountInput');
const categoryInput = document.getElementById('categoryInput');
const commentInput = document.getElementById('commentInput');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
const transactionLog = document.getElementById('transactionLog');
const filterCategory = document.getElementById('filterCategory');
const filterType = document.getElementById('filterType');

// Category Modal Elements
const newCategoryBtn = document.getElementById('newCategoryBtn');
const categoryModal = document.getElementById('categoryModal');
const newCategoryInput = document.getElementById('newCategoryInput');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');

// Initialize the display
updateBalanceDisplay();
renderTransactions();
updateChart();
updateCategorySelects();

// Action type tracker
let currentAction = null;

// Event Listeners
addBtn.addEventListener('click', () => showTransactionForm('add'));
subtractBtn.addEventListener('click', () => showTransactionForm('subtract'));
confirmBtn.addEventListener('click', handleTransaction);
cancelBtn.addEventListener('click', hideTransactionForm);
filterCategory.addEventListener('change', renderTransactions);
filterType.addEventListener('change', renderTransactions);

// Category Modal Event Listeners
newCategoryBtn.addEventListener('click', showCategoryModal);
saveCategoryBtn.addEventListener('click', saveNewCategory);
cancelCategoryBtn.addEventListener('click', hideCategoryModal);

function showTransactionForm(action) {
    currentAction = action;
    transactionForm.classList.remove('hidden');
    amountInput.value = '';
    categoryInput.value = '';
    commentInput.value = '';
    amountInput.focus();
}

function hideTransactionForm() {
    transactionForm.classList.add('hidden');
    currentAction = null;
}

function handleTransaction() {
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    if (!category) {
        alert('Please select a category');
        return;
    }

    // Check if there's sufficient balance for expenses
    if (currentAction === 'subtract' && amount > balance) {
        alert(`Insufficient balance! You only have ${balance.toFixed(2)}dt available.`);
        return;
    }

    const transaction = {
        type: currentAction,
        amount: amount,
        category: category,
        comment: commentInput.value.trim(),
        date: new Date().toISOString()
    };

    // Update balance
    if (currentAction === 'add') {
        balance += amount;
    } else {
        balance -= amount;
    }

    // Add transaction to history
    transactions.unshift(transaction);

    // Save to localStorage
    localStorage.setItem('balance', balance.toString());
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Update UI
    updateBalanceDisplay();
    renderTransactions();
    updateChart();
    hideTransactionForm();
}

function updateBalanceDisplay() {
    balanceElement.textContent = `${balance.toFixed(2)}dt`;
    
    // Calculate and display totals
    const totals = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'add') {
            acc.income += transaction.amount;
        } else {
            acc.expenses += transaction.amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });

    totalIncomeElement.textContent = `${totals.income.toFixed(2)}dt`;
    totalExpensesElement.textContent = `${totals.expenses.toFixed(2)}dt`;
}

function renderTransactions() {
    transactionLog.innerHTML = '';
    
    const selectedCategory = filterCategory.value;
    const selectedType = filterType.value;
    
    const filteredTransactions = transactions.filter(transaction => {
        const categoryMatch = selectedCategory === 'all' || transaction.category === selectedCategory;
        const typeMatch = selectedType === 'all' || transaction.type === selectedType;
        return categoryMatch && typeMatch;
    });
    
    filteredTransactions.forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = `transaction-item ${transaction.type === 'add' ? 'increase' : 'decrease'}`;
        
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        transactionElement.innerHTML = `
            <div class="transaction-info">
                <span class="transaction-amount">
                    ${transaction.type === 'add' ? '+' : '-'}${transaction.amount.toFixed(2)}dt
                </span>
                <span class="transaction-category">${transaction.category}</span>
                ${transaction.comment ? `<span class="transaction-comment">${transaction.comment}</span>` : ''}
            </div>
            <span class="transaction-date">${formattedDate}</span>
        `;
        
        transactionLog.appendChild(transactionElement);
    });
}

function updateChart() {
    const ctx = document.getElementById('categoryChart');
    
    // Remove existing chart if it exists
    if (window.myChart) {
        window.myChart.destroy();
    }

    // Prepare data for the chart
    const categoryTotals = {};
    transactions.forEach(transaction => {
        if (!categoryTotals[transaction.category]) {
            categoryTotals[transaction.category] = {
                income: 0,
                expenses: 0
            };
        }
        
        if (transaction.type === 'add') {
            categoryTotals[transaction.category].income += transaction.amount;
        } else {
            categoryTotals[transaction.category].expenses += transaction.amount;
        }
    });

    const categories = Object.keys(categoryTotals);
    const incomeData = categories.map(category => categoryTotals[category].income);
    const expenseData = categories.map(category => categoryTotals[category].expenses);

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: '#2ecc71',
                    borderColor: '#27ae60',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: '#e74c3c',
                    borderColor: '#c0392b',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + 'dt';
                        }
                    }
                }
            }
        }
    });
}

function showCategoryModal() {
    categoryModal.classList.remove('hidden');
    newCategoryInput.value = '';
    newCategoryInput.focus();
}

function hideCategoryModal() {
    categoryModal.classList.add('hidden');
}

function saveNewCategory() {
    const categoryName = newCategoryInput.value.trim();
    
    if (!categoryName) {
        alert('Please enter a category name');
        return;
    }

    // Check if category already exists
    const allCategories = getAllCategories();
    if (allCategories.includes(categoryName.toLowerCase())) {
        alert('This category already exists');
        return;
    }

    // Add new category
    customCategories.push(categoryName);
    localStorage.setItem('customCategories', JSON.stringify(customCategories));

    // Update category selects
    updateCategorySelects();

    // Hide modal
    hideCategoryModal();
}

function getAllCategories() {
    const defaultCategories = ['salary', 'food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'other'];
    return [...defaultCategories, ...customCategories].map(cat => cat.toLowerCase());
}

function updateCategorySelects() {
    // Get all categories
    const allCategories = getAllCategories();
    
    // Update transaction form select
    categoryInput.innerHTML = `
        <option value="">Select Category</option>
        ${allCategories.map(category => `
            <option value="${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</option>
        `).join('')}
    `;

    // Update filter select
    filterCategory.innerHTML = `
        <option value="all">All Categories</option>
        ${allCategories.map(category => `
            <option value="${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</option>
        `).join('')}
    `;
} 