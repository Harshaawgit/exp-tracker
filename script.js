/* =============================================
   SMART EXPENSE TRACKER — script.js
   Vanilla JS | Chart.js | localStorage
   ============================================= */

// ---- Init Lucide Icons ----
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  init();
});

// =============================================
// STATE
// =============================================
let expenses = [];
let userBalance = 5000; // Default balance
let activeFilter = 'All';
let searchQuery = '';
let editingId = null;
let currentPage = 'dashboard';

// Chart instances
let barChartInst = null;
let donutChartInst = null;
let miniChartInst = null;

// Category config
const CATEGORIES = {
  Food:     { emoji: '🍔', color: '#6366F1' },
  Travel:   { emoji: '✈️', color: '#22C55E' },
  Shopping: { emoji: '🛍️', color: '#F59E0B' },
  Bills:    { emoji: '💡', color: '#EF4444' },
  Others:   { emoji: '📦', color: '#8B5CF6' },
};

// Month labels
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// =============================================
// INIT
// =============================================
function init() {
  loadFromStorage();
  checkBalanceModal();
  setupEventListeners();
  render();
}

// =============================================
// STORAGE
// =============================================
function loadFromStorage() {
  try {
    const saved = localStorage.getItem('smart_expenses');
    expenses = saved ? JSON.parse(saved) : getSampleData();
    const savedBalance = localStorage.getItem('user_balance');
    userBalance = savedBalance ? parseFloat(savedBalance) : 5000;
  } catch {
    expenses = getSampleData();
    userBalance = 5000;
  }
}

function saveToStorage() {
  localStorage.setItem('smart_expenses', JSON.stringify(expenses));
  localStorage.setItem('user_balance', userBalance.toString());
}

// Check if balance needs to be set on first load
function checkBalanceModal() {
  const balanceSet = localStorage.getItem('balance_set');
  if (!balanceSet) {
    document.getElementById('balanceModal').classList.add('open');
  }
}

// Pre-populate with sample data on first load
function getSampleData() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return [
    { id: uid(), title: 'Lunch', category: 'Food',     amount: 15.00, date: `${y}-${m}-26` },
    { id: uid(), title: 'Groceries', category: 'Food', amount: 85.50, date: `${y}-${m}-25` },
    { id: uid(), title: 'Coffee',    category: 'Food', amount: 6.00,  date: `${y}-${m}-24` },
    { id: uid(), title: 'Uber',      category: 'Travel', amount: 22.00, date: `${y}-${m}-23` },
    { id: uid(), title: 'Netflix',   category: 'Bills',  amount: 15.99, date: `${y}-${m}-20` },
    { id: uid(), title: 'T-shirt',   category: 'Shopping', amount: 45.00, date: `${y}-${m}-18` },
    { id: uid(), title: 'Flight',    category: 'Travel', amount: 320.00, date: `${y}-${m}-10` },
    { id: uid(), title: 'Electricity', category: 'Bills', amount: 120.00, date: `${y}-${m}-05` },
    { id: uid(), title: 'Books',     category: 'Others',  amount: 35.00, date: `${y}-${m}-03` },
  ];
}

// =============================================
// HELPERS
// =============================================
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmt(n) {
  return '₹' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}`;
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// =============================================
// RENDER — Master render function
// =============================================
function render() {
  updateSummaryCards();
  renderCharts();
  renderExpenseList();
  lucide.createIcons(); // re-init for dynamically created icons
}

// =============================================
// SUMMARY CARDS
// =============================================
function updateSummaryCards() {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const monthly = expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0);

  // Calculate remaining balance
  const balance = Math.max(0, userBalance - total);

  document.getElementById('totalBalance').textContent = fmt(balance);
  document.getElementById('totalExpenses').textContent = fmt(total);
  document.getElementById('monthlyAmount').innerHTML = `${fmt(monthly)} <span>this month</span>`;
}

// =============================================
// CHARTS
// =============================================
function renderCharts() {
  renderBarChart();
  renderDonutChart();
  renderMiniChart();
}

/* Bar Chart — Monthly Expenses */
function renderBarChart() {
  const canvas = document.getElementById('barChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Build monthly totals for last 6 months
  const now = new Date();
  const labels = [];
  const data = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    labels.push(MONTHS[d.getMonth()]);
    const total = expenses.filter(e => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
    data.push(total);
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#9090C0' : '#6B7280';

  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, 'rgba(99,102,241,0.9)');
  gradient.addColorStop(1, 'rgba(99,102,241,0.4)');

  if (barChartInst) barChartInst.destroy();

  barChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Expenses',
        data,
        backgroundColor: gradient,
        borderRadius: 7,
        borderSkipped: false,
        maxBarThickness: 36,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ' ' + fmt(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'DM Sans', size: 12 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'DM Sans', size: 12 },
            callback: v => '$' + v
          },
          beginAtZero: true
        }
      }
    }
  });

  updateAnalyticsStats();
}

/* Analytics stat pills */
function updateAnalyticsStats() {
  const catTotals = {};
  const catCounts = {};

  expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    catCounts[e.category] = (catCounts[e.category] || 0) + 1;
  });

  const topCat = Object.entries(catTotals).sort((a,b) => b[1]-a[1])[0];
  const freqCat = Object.entries(catCounts).sort((a,b) => b[1]-a[1])[0];

  if (topCat) {
    document.getElementById('topCategory').textContent = CATEGORIES[topCat[0]].emoji + ' ' + topCat[0];
    document.getElementById('topAmount').textContent = fmt(topCat[1]);
  }
  if (freqCat) {
    document.getElementById('mostFrequent').textContent = CATEGORIES[freqCat[0]].emoji + ' ' + freqCat[0];
  }
}

/* Donut Chart — Category Spending */
function renderDonutChart() {
  const canvas = document.getElementById('donutChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const catData = {};
  expenses.forEach(e => { catData[e.category] = (catData[e.category] || 0) + e.amount; });

  const total = Object.values(catData).reduce((s, v) => s + v, 0);
  const cats = Object.keys(catData);
  const values = cats.map(c => catData[c]);
  const colors = cats.map(c => CATEGORIES[c]?.color || '#ccc');

  if (donutChartInst) donutChartInst.destroy();

  donutChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: cats,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 3,
        borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1A1A2E' : '#fff',
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${fmt(ctx.parsed)}`
          }
        }
      }
    }
  });

  // Build legend
  const legend = document.getElementById('donutLegend');
  legend.innerHTML = '';
  cats.forEach(cat => {
    const pct = total ? ((catData[cat] / total) * 100).toFixed(0) : 0;
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="legend-dot" style="background:${CATEGORIES[cat]?.color || '#ccc'}"></span>
      <span class="legend-name">${CATEGORIES[cat]?.emoji || ''} ${cat}</span>
      <span class="legend-pct">${pct}%</span>
    `;
    legend.appendChild(item);
  });
}

/* Mini sparkline for monthly card */
function renderMiniChart() {
  const canvas = document.getElementById('monthlyMiniChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const now = new Date();
  const labels = [];
  const data = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    labels.push(MONTHS[d.getMonth()]);
    const total = expenses.filter(e => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
    data.push(total);
  }

  if (miniChartInst) miniChartInst.destroy();

  miniChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map((_, i) => i === data.length - 1 ? '#6366F1' : 'rgba(99,102,241,0.35)'),
        borderRadius: 4,
        maxBarThickness: 14,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false, beginAtZero: true } },
      animation: { duration: 400 }
    }
  });
}

// =============================================
// EXPENSE LIST
// =============================================
function renderExpenseList() {
  let filtered = expenses.slice();

  // Filter by category
  if (activeFilter !== 'All') {
    filtered = filtered.filter(e => e.category === activeFilter);
  }

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(e => e.title.toLowerCase().includes(q));
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  renderDesktopTable(filtered);
  renderMobileCards(filtered);
}

function renderDesktopTable(list) {
  const tbody = document.getElementById('expenseTableBody');
  const empty = document.getElementById('emptyState');
  tbody.innerHTML = '';

  if (list.length === 0) {
    empty.classList.add('visible');
    return;
  }
  empty.classList.remove('visible');

  list.forEach(exp => {
    const tr = document.createElement('tr');
    const cat = CATEGORIES[exp.category] || { emoji: '📦', color: '#8B5CF6' };
    tr.innerHTML = `
      <td><strong>${escHtml(exp.title)}</strong></td>
      <td>
        <span class="cat-badge">
          <span>${cat.emoji}</span>
          ${escHtml(exp.category)}
        </span>
      </td>
      <td class="amount-cell">${fmt(exp.amount)}</td>
      <td style="color:var(--text-muted)">${formatDate(exp.date)}</td>
      <td>
        <div class="action-cell">
          <button class="action-btn edit-btn" data-id="${exp.id}" title="Edit">
            <i data-lucide="pencil"></i>
          </button>
          <button class="action-btn delete-btn" data-id="${exp.id}" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderMobileCards(list) {
  const container = document.getElementById('mobileCards');
  const empty = document.getElementById('emptyState');
  container.innerHTML = '';

  if (list.length === 0) {
    empty.classList.add('visible');
    return;
  }

  list.forEach(exp => {
    const cat = CATEGORIES[exp.category] || { emoji: '📦' };
    const div = document.createElement('div');
    div.className = 'mobile-expense-card';
    div.innerHTML = `
      <div class="mob-left">
        <div class="mob-title">${cat.emoji} ${escHtml(exp.title)}</div>
        <div class="mob-meta">${escHtml(exp.category)} · ${formatDate(exp.date)}</div>
      </div>
      <div class="mob-right">
        <div class="mob-amount">${fmt(exp.amount)}</div>
        <div class="mob-actions">
          <button class="action-btn edit-btn" data-id="${exp.id}" title="Edit"><i data-lucide="pencil"></i></button>
          <button class="action-btn delete-btn" data-id="${exp.id}" title="Delete"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// =============================================
// ADD EXPENSE
// =============================================
function addExpense(title, amount, category, date) {
  const exp = { id: uid(), title, amount: parseFloat(amount), category, date };
  expenses.unshift(exp);
  saveToStorage();
  render();
}

// =============================================
// EDIT EXPENSE
// =============================================
function openEditModal(id) {
  const exp = expenses.find(e => e.id === id);
  if (!exp) return;

  editingId = id;
  document.getElementById('editId').value = id;
  document.getElementById('editTitle').value = exp.title;
  document.getElementById('editAmount').value = exp.amount;
  document.getElementById('editCategory').value = exp.category;
  document.getElementById('editDate').value = exp.date;

  document.getElementById('editModal').classList.add('open');
  lucide.createIcons();
}

function saveEdit() {
  const id = document.getElementById('editId').value;
  const idx = expenses.findIndex(e => e.id === id);
  if (idx === -1) return;

  expenses[idx] = {
    id,
    title:    document.getElementById('editTitle').value.trim(),
    amount:   parseFloat(document.getElementById('editAmount').value),
    category: document.getElementById('editCategory').value,
    date:     document.getElementById('editDate').value,
  };
  saveToStorage();
  closeModal();
  render();
}

function closeModal() {
  document.getElementById('editModal').classList.remove('open');
  editingId = null;
}

// =============================================
// DELETE EXPENSE
// =============================================
function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  expenses = expenses.filter(e => e.id !== id);
  saveToStorage();
  render();
}

// =============================================
// PAGE NAVIGATION
// =============================================
function switchPage(page) {
  currentPage = page;

  // Hide all pages
  document.getElementById('dashboardPage').style.display = 'none';
  document.getElementById('analyticsPage').style.display = 'none';
  document.getElementById('categoryPage').style.display = 'none';
  document.getElementById('expensesPage').style.display = 'none';

  // Show selected page
  const pageElement = document.getElementById(page + 'Page');
  if (pageElement) {
    pageElement.style.display = 'block';
  }

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.page === page) {
      btn.classList.add('active');
    }
  });

  // Re-render charts if needed
  if (page === 'analytics' || page === 'category') {
    renderCharts();
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 580) {
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('mainContainer').classList.add('sidebar-hidden');
  }
}

// =============================================
// EVENT LISTENERS
// =============================================
function setupEventListeners() {

  // Set default date to today
  document.getElementById('expDate').value = todayString();

  // ---- Balance Modal ----
  document.getElementById('balanceForm').addEventListener('submit', e => {
    e.preventDefault();
    const balance = parseFloat(document.getElementById('balanceInput').value);
    if (!isNaN(balance) && balance >= 0) {
      userBalance = balance;
      saveToStorage();
      localStorage.setItem('balance_set', 'true');
      document.getElementById('balanceModal').classList.remove('open');
      render();
    }
  });

  if (document.getElementById('closeBalanceModal')) {
    document.getElementById('closeBalanceModal').addEventListener('click', () => {
      document.getElementById('balanceModal').classList.remove('open');
    });
  }

  // Profile button to edit balance
  document.getElementById('profileBtn').addEventListener('click', () => {
    document.getElementById('balanceInput').value = userBalance.toFixed(2);
    document.getElementById('balanceModal').classList.add('open');
  });

  // ---- Sidebar Navigation ----
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      switchPage(page);
    });
  });

  // Sidebar toggle
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const mainContainer = document.getElementById('mainContainer');
    sidebar.classList.toggle('hidden');
    mainContainer.classList.toggle('sidebar-hidden');
  });

  // Sidebar close on mobile
  document.getElementById('sidebarClose').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const mainContainer = document.getElementById('mainContainer');
    sidebar.classList.add('hidden');
    mainContainer.classList.add('sidebar-hidden');
  });

  // Add Expense form
  document.getElementById('expenseForm').addEventListener('submit', e => {
    e.preventDefault();
    const title    = document.getElementById('expTitle').value.trim();
    const amount   = document.getElementById('expAmount').value;
    const category = document.getElementById('expCategory').value;
    const date     = document.getElementById('expDate').value;

    if (!title || !amount || !date) return;

    addExpense(title, amount, category, date);

    // Reset form
    document.getElementById('expTitle').value   = '';
    document.getElementById('expAmount').value  = '';
    document.getElementById('expDate').value    = todayString();
  });

  // Header Add & FAB → scroll to quick add on mobile
  document.getElementById('headerAddBtn').addEventListener('click', () => {
    document.querySelector('.quick-add-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('expTitle').focus(), 300);
  });
  document.getElementById('fabBtn').addEventListener('click', () => {
    document.querySelector('.quick-add-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('expTitle').focus(), 300);
  });

  // Dark mode toggle
  document.getElementById('themeToggle').addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    // Redraw charts for theme
    render();
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderExpenseList();
    });
  });

  // List search
  document.getElementById('listSearch').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderExpenseList();
  });

  // Global search (header) — mirrors list search
  document.getElementById('globalSearch').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    document.getElementById('listSearch').value = searchQuery;
    renderExpenseList();
    if (searchQuery) {
      document.querySelector('.expense-list-card').scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Edit & Delete (event delegation)
  document.addEventListener('click', e => {
    const editBtn   = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');
    if (editBtn)   openEditModal(editBtn.dataset.id);
    if (deleteBtn) deleteExpense(deleteBtn.dataset.id);
  });

  // Edit form submit
  document.getElementById('editForm').addEventListener('submit', e => {
    e.preventDefault();
    saveEdit();
  });

  // Close modal
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelEdit').addEventListener('click', closeModal);
  document.getElementById('editModal').addEventListener('click', e => {
    if (e.target === document.getElementById('editModal')) closeModal();
  });

  // Escape key closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

// =============================================
// SECURITY — escape HTML
// =============================================
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
