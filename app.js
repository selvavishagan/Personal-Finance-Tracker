// Personal Finance Tracker - Frontend JavaScript
class PersonalFinanceTracker {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.transactions = [];
        this.charts = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTransactions();
        this.loadSummary();
        this.setTodayDate();
        this.initCharts();
    }

    bindEvents() {
        // Form submission
        document.getElementById('txForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Filter buttons
        document.getElementById('btnFilter').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('btnClear').addEventListener('click', () => {
            this.clearFilters();
        });

        // Filter on enter key
        document.getElementById('filterCategory').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters();
            }
        });
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    async addTransaction() {
        const form = document.getElementById('txForm');
        const formData = new FormData(form);
        
        const transaction = {
            type: formData.get('type') || document.getElementById('type').value,
            amount: parseFloat(formData.get('amount') || document.getElementById('amount').value),
            category: formData.get('category') || document.getElementById('category').value,
            note: formData.get('note') || document.getElementById('note').value,
            date: formData.get('date') || document.getElementById('date').value
        };

        // Validation
        if (!transaction.amount || transaction.amount <= 0) {
            this.showMessage('Please enter a valid amount', 'error');
            return;
        }

        if (!transaction.category.trim()) {
            this.showMessage('Please enter a category', 'error');
            return;
        }

        try {
            this.showLoading('Adding transaction...');
            
            const response = await fetch(`${this.apiUrl}/transactions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transaction)
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Transaction added successfully!', 'success');
                form.reset();
                this.setTodayDate();
                this.loadTransactions();
                this.loadSummary();
                this.updateCharts();
            } else {
                this.showMessage(data.error || 'Failed to add transaction', 'error');
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            this.showMessage('Network error. Make sure the backend server is running.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadTransactions(filters = {}) {
        try {
            this.showLoading('Loading transactions...');
            
            let url = `${this.apiUrl}/transactions/`;
            const queryParams = new URLSearchParams();
            
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.category) queryParams.append('category', filters.category);
            if (filters.start_date) queryParams.append('start_date', filters.start_date);
            if (filters.end_date) queryParams.append('end_date', filters.end_date);
            
            if (queryParams.toString()) {
                url += '?' + queryParams.toString();
            }

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                this.transactions = data;
                this.renderTransactions();
                this.updateCharts();
            } else {
                this.showMessage(data.error || 'Failed to load transactions', 'error');
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showMessage('Network error. Make sure the backend server is running.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadSummary() {
        try {
            const response = await fetch(`${this.apiUrl}/transactions/summary`);
            const data = await response.json();

            if (response.ok) {
                document.getElementById('balance').textContent = `₹${data.balance.toFixed(2)}`;
                document.getElementById('income').textContent = `₹${data.income.toFixed(2)}`;
                document.getElementById('expenses').textContent = `₹${data.expenses.toFixed(2)}`;
                
                // Update charts after loading summary
                this.updateCharts();
            } else {
                console.error('Failed to load summary:', data.error);
            }
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    }

    initCharts() {
        // Initialize category pie chart
        const categoryCtx = document.getElementById('categoryChart');
        if (categoryCtx) {
            this.charts.categoryChart = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
                        ],
                        borderColor: '#fff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Initialize income vs expense chart
        const incomeExpenseCtx = document.getElementById('incomeExpenseChart');
        if (incomeExpenseCtx) {
            this.charts.incomeExpenseChart = new Chart(incomeExpenseCtx, {
                type: 'bar',
                data: {
                    labels: ['Income', 'Expense'],
                    datasets: [{
                        label: 'Amount',
                        data: [0, 0],
                        backgroundColor: ['#4CAF50', '#FF6384'],
                        borderColor: ['#45a049', '#FF5252'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // Initialize trend chart
        const trendCtx = document.getElementById('trendChart');
        if (trendCtx) {
            this.charts.trendChart = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Income',
                            data: [],
                            borderColor: '#4CAF50',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Expense',
                            data: [],
                            borderColor: '#FF6384',
                            backgroundColor: 'rgba(255, 99, 132, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });
        }
    }

    updateCharts() {
        if (this.transactions.length === 0) {
            return;
        }

        // Update category pie chart
        this.updateCategoryChart();
        
        // Update income vs expense chart
        this.updateIncomeExpenseChart();
        
        // Update trend chart
        this.updateTrendChart();
    }

    updateCategoryChart() {
        const categoryData = {};
        
        // Only include expenses in category chart
        this.transactions
            .filter(tx => tx.type === 'expense')
            .forEach(tx => {
                categoryData[tx.category] = (categoryData[tx.category] || 0) + tx.amount;
            });

        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);

        if (this.charts.categoryChart) {
            this.charts.categoryChart.data.labels = labels;
            this.charts.categoryChart.data.datasets[0].data = data;
            this.charts.categoryChart.update();
        }
    }

    updateIncomeExpenseChart() {
        const income = this.transactions
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + tx.amount, 0);
        
        const expense = this.transactions
            .filter(tx => tx.type === 'expense')
            .reduce((sum, tx) => sum + tx.amount, 0);

        if (this.charts.incomeExpenseChart) {
            this.charts.incomeExpenseChart.data.datasets[0].data = [income, expense];
            this.charts.incomeExpenseChart.update();
        }
    }

    updateTrendChart() {
        const dailyData = {};

        this.transactions.forEach(tx => {
            const date = new Date(tx.date).toLocaleDateString('en-IN');
            
            if (!dailyData[date]) {
                dailyData[date] = { income: 0, expense: 0 };
            }
            
            if (tx.type === 'income') {
                dailyData[date].income += tx.amount;
            } else {
                dailyData[date].expense += tx.amount;
            }
        });

        // Sort dates
        const sortedDates = Object.keys(dailyData).sort((a, b) => {
            return new Date(a) - new Date(b);
        });

        const incomeData = sortedDates.map(date => dailyData[date].income);
        const expenseData = sortedDates.map(date => dailyData[date].expense);

        if (this.charts.trendChart) {
            this.charts.trendChart.data.labels = sortedDates;
            this.charts.trendChart.data.datasets[0].data = incomeData;
            this.charts.trendChart.data.datasets[1].data = expenseData;
            this.charts.trendChart.update();
        }
    }

    renderTransactions() {
        const txList = document.getElementById('txList');
        
        if (this.transactions.length === 0) {
            txList.innerHTML = '<li class="loading">No transactions found</li>';
            return;
        }

        txList.innerHTML = this.transactions.map(tx => {
            const date = new Date(tx.date).toLocaleDateString('en-IN');
            const time = new Date(tx.date).toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            return `
                <li class="transaction-item ${tx.type}">
                    <div class="transaction-details">
                        <div class="transaction-amount ${tx.type}">
                            ${tx.type === 'income' ? '+' : '-'}₹${Math.abs(tx.amount).toFixed(2)}
                        </div>
                        <div class="transaction-meta">
                            <strong>${tx.category}</strong>
                            ${tx.note ? ` - ${tx.note}` : ''}
                            <br>
                            <small>${date} at ${time}</small>
                        </div>
                    </div>
                    <div class="transaction-actions">
                        <button class="btn-edit" onclick="app.editTransaction('${tx._id}')">Edit</button>
                        <button class="btn-delete" onclick="app.deleteTransaction('${tx._id}')">Delete</button>
                    </div>
                </li>
            `;
        }).join('');
    }

    async deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        try {
            this.showLoading('Deleting transaction...');
            
            const response = await fetch(`${this.apiUrl}/transactions/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Transaction deleted successfully!', 'success');
                this.loadTransactions();
                this.updateCharts();
                this.loadSummary();
            } else {
                this.showMessage(data.error || 'Failed to delete transaction', 'error');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.showMessage('Network error. Make sure the backend server is running.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async editTransaction(id) {
        // For simplicity, we'll just prompt for new values
        const transaction = this.transactions.find(tx => tx._id === id);
        if (!transaction) return;

        const newAmount = prompt('Enter new amount:', transaction.amount);
        if (newAmount === null) return;

        const newCategory = prompt('Enter new category:', transaction.category);
        if (newCategory === null) return;

        const newNote = prompt('Enter new note:', transaction.note || '');
        if (newNote === null) return;

        const updatedTransaction = {
            amount: parseFloat(newAmount),
            category: newCategory,
            note: newNote
        };

        if (isNaN(updatedTransaction.amount) || updatedTransaction.amount <= 0) {
            this.showMessage('Please enter a valid amount', 'error');
            return;
        }

        try {
            this.showLoading('Updating transaction...');
            
            const response = await fetch(`${this.apiUrl}/transactions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedTransaction)
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Transaction updated successfully!', 'success');
                this.loadTransactions();
                this.updateCharts();
                this.loadSummary();
            } else {
                this.showMessage(data.error || 'Failed to update transaction', 'error');
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            this.showMessage('Network error. Make sure the backend server is running.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    applyFilters() {
        const type = document.getElementById('filterType').value;
        const category = document.getElementById('filterCategory').value;
        
        const filters = {};
        if (type) filters.type = type;
        if (category.trim()) filters.category = category.trim();
        
        this.loadTransactions(filters);
    }

    clearFilters() {
        document.getElementById('filterType').value = '';
        document.getElementById('filterCategory').value = '';
        this.loadTransactions();
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // Insert at the top of the container
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.children[1]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    showLoading(message) {
        const existingLoading = document.querySelector('.loading-overlay');
        if (existingLoading) existingLoading.remove();

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-size: 1.2em;
            ">
                ${message}
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }

    hideLoading() {
        const loadingDiv = document.querySelector('.loading-overlay');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PersonalFinanceTracker();
});