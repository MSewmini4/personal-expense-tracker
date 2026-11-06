// ---------- State ----------
const STORAGE_KEY = "personalExpenseTracker.transactions";
let transactions = loadTransactions();

// ---------- DOM references ----------
const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const clearBtn = document.getElementById("clearBtn");
const filterSelect = document.getElementById("filter");
const searchInput = document.getElementById("search");
const tableBody = document.getElementById("transactionBody");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const balanceEl = document.getElementById("currentBalance");

// ---------- Storage ----------
function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (e) {
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    alert("Could not save transactions in this browser.");
  }
}

// ---------- Helpers ----------
function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function formatLKR(value) {
  return "LKR " + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ---------- Totals ----------
function updateSummary() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  totalIncomeEl.textContent = formatLKR(income);
  totalExpensesEl.textContent = formatLKR(expenses);
  balanceEl.textContent = formatLKR(income - expenses);
}

// ---------- Table ----------
function getVisibleTransactions() {
  const filter = filterSelect.value;
  const query = searchInput.value.trim().toLowerCase();

  return transactions.filter(t => {
    const matchesType = filter === "all" || t.type === filter;
    const matchesSearch =
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });
}

function renderTable() {
  const visible = getVisibleTransactions();

  if (visible.length === 0) {
    tableBody.innerHTML =
      '<tr class="empty-row"><td colspan="6">No transactions found.</td></tr>';
    return;
  }

  tableBody.innerHTML = visible.map(t => {
    const isIncome = t.type === "income";
    const sign = isIncome ? "+" : "\u2212";
    return `
      <tr>
        <td>${escapeHTML(t.date)}</td>
        <td>${escapeHTML(t.description)}</td>
        <td><span class="badge-${t.type}">${isIncome ? "Income" : "Expense"}</span></td>
        <td>${escapeHTML(t.category)}</td>
        <td class="text-end amount-${t.type}">${sign} ${formatLKR(t.amount)}</td>
        <td>
          <button type="button" class="btn btn-outline-danger btn-sm py-0 px-2"
                  data-id="${t.id}">Delete</button>
        </td>
      </tr>`;
  }).join("");
}

function refresh() {
  updateSummary();
  renderTable();
}

// ---------- Form ----------
function resetForm() {
  form.reset();
  form.classList.remove("was-validated");
  typeInput.value = "income";
  dateInput.value = todayISO();
}

function isFormValid() {
  const amount = parseFloat(amountInput.value);
  const amountOk = !isNaN(amount) && amount > 0;
  amountInput.setCustomValidity(amountOk ? "" : "Amount must be greater than 0");
  descriptionInput.value = descriptionInput.value.trim();
  return form.checkValidity();
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  form.classList.add("was-validated");

  if (!isFormValid()) return;

  transactions.push({
    id: Date.now(),
    type: typeInput.value,
    description: descriptionInput.value,
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value
  });

  saveTransactions();
  refresh();
  resetForm();
  alert("Transaction added successfully!");
});

clearBtn.addEventListener("click", resetForm);

// ---------- Delete ----------
tableBody.addEventListener("click", function (event) {
  const btn = event.target.closest("button[data-id]");
  if (!btn) return;

  if (!confirm("Delete this transaction?")) return;

  const id = Number(btn.dataset.id);
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  refresh();
});

// ---------- Filter & search ----------
filterSelect.addEventListener("change", renderTable);
searchInput.addEventListener("input", renderTable);

// ---------- Init ----------
dateInput.value = todayISO();
refresh();
