
import { signInWithGoogle, logoutUser } from './auth.js';
import { templates } from './templates.js';
import { autoSave, updateSummaries } from './data.js';
import { math } from './utils.js';
import { formatter } from './formatter.js';

export function initializeUI() {
    attachGlobalListeners();
    attachNavigationListeners();
    attachDynamicRowListeners();
    attachSortingListeners();
    showTab('assets-debts');
}

function attachGlobalListeners() {
    document.getElementById('login-btn')?.addEventListener('click', signInWithGoogle);
    document.getElementById('logout-btn')?.addEventListener('click', logoutUser);

    document.body.addEventListener('input', (e) => {
        if (e.target.closest('.input-base, .input-range')) {
            handleLinkedBudgetValues(e.target);
            window.debouncedAutoSave();
        }
    });
}

function handleLinkedBudgetValues(target) {
    const row = target.closest('tr');
    if (!row) return;
    const isBudgetRow = row.closest('#budget-savings-rows') || row.closest('#budget-expenses-rows');
    if (!isBudgetRow) return;

    const monthlyInput = row.querySelector('[data-id="monthly"]');
    const annualInput = row.querySelector('[data-id="annual"]');
    if (!monthlyInput || !annualInput) return;

    const val = math.fromCurrency(target.value);
    if (target.dataset.id === 'monthly') {
        annualInput.value = math.toCurrency(val * 12);
    } else if (target.dataset.id === 'annual') {
        monthlyInput.value = math.toCurrency(val / 12);
    }
}

function attachNavigationListeners() {
    document.getElementById('main-nav')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (btn && btn.dataset.tab) {
            showTab(btn.dataset.tab);
        }
    });
}

function attachDynamicRowListeners() {
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.dataset.addRow) {
            window.addRow(btn.dataset.addRow, btn.dataset.rowType);
            window.debouncedAutoSave();
        } else if (btn.dataset.action === 'remove') {
            btn.closest('tr')?.remove();
            window.debouncedAutoSave();
        } else if (btn.dataset.action === 'toggle-freq') {
            const isMonthly = btn.textContent.trim().toLowerCase() === 'monthly';
            btn.textContent = isMonthly ? 'Annual' : 'Monthly';
            window.debouncedAutoSave();
        }
    });

    document.body.addEventListener('change', (e) => {
        if (e.target.dataset.id === 'type' && e.target.closest('#investment-rows')) {
            updateCostBasisVisibility(e.target.closest('tr'));
        }
    });
}

function attachSortingListeners() {
    document.querySelectorAll('[data-sort]').forEach(header => {
        header.onclick = () => {
            const type = header.dataset.sort;
            const container = document.getElementById('budget-expenses-rows');
            const rows = Array.from(container.querySelectorAll('tr'));
            const isAsc = header.dataset.order === 'asc';
            
            rows.sort((a, b) => {
                const valA = math.fromCurrency(a.querySelector(`[data-id="${type}"]`)?.value || 0);
                const valB = math.fromCurrency(b.querySelector(`[data-id="${type}"]`)?.value || 0);
                return isAsc ? valA - valB : valB - valA;
            });
            
            header.dataset.order = isAsc ? 'desc' : 'asc';
            container.append(...rows);
        };
    });
}

function updateCostBasisVisibility(row) {
    const typeSelect = row.querySelector('[data-id="type"]');
    const costBasisInput = row.querySelector('[data-id="costBasis"]');
    if (!typeSelect || !costBasisInput) return;
    const isRoth = typeSelect.value === 'Post-Tax (Roth)';
    costBasisInput.style.visibility = isRoth ? 'visible' : 'hidden';
    costBasisInput.disabled = !isRoth;
}

export function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    if (tabId === 'burndown' || tabId === 'projection') window.debouncedAutoSave(); 
}

window.addRow = (containerId, type, data = {}) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const row = document.createElement('tr');
    row.className = 'border-b border-slate-700/50 hover:bg-slate-800/20 transition-colors';
    row.innerHTML = templates[type](data);
    container.appendChild(row);
    
    row.querySelectorAll('[data-id]').forEach(input => {
        const key = input.dataset.id;
        const val = data[key];
        if (val !== undefined) {
            if (input.type === 'checkbox') input.checked = !!val;
            else if (input.dataset.type === 'currency') input.value = math.toCurrency(val);
            else input.value = val;
        }
    });

    if (type === 'income') {
        const amtBtn = row.querySelector('[data-id="isMonthly"]');
        if (amtBtn) amtBtn.textContent = data.isMonthly ? 'Monthly' : 'Annual';
        const offBtn = row.querySelector('[data-id="writeOffsMonthly"]');
        if (offBtn) offBtn.textContent = data.writeOffsMonthly ? 'Monthly' : 'Annual';
    }

    if (type === 'investment') updateCostBasisVisibility(row);
    row.querySelectorAll('[data-type="currency"]').forEach(formatter.bindCurrencyEventListeners);
};

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
window.debouncedAutoSave = debounce(() => autoSave(true), 500);

window.createAssumptionControls = (data) => {
    const container = document.getElementById('assumptions-container');
    if (!container) return;
    container.innerHTML = '';
    const defs = { currentAge: { label: 'Current Age', unit: '' }, stockGrowth: { label: 'Stock Growth', unit: '%' }, inflation: { label: 'Inflation', unit: '%' } };
    Object.entries(defs).forEach(([key, config]) => {
        const val = data.assumptions?.[key] || 0;
        const div = document.createElement('div');
        div.className = 'space-y-2';
        div.innerHTML = `<label class="flex justify-between font-bold text-xs uppercase text-slate-500">${config.label} <span class="text-blue-400">${val}${config.unit}</span></label>
        <input type="range" data-id="${key}" value="${val}" min="0" max="100" step="0.5" class="input-range">`;
        container.appendChild(div);
    });
};
