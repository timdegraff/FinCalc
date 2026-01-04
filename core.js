
import { signInWithGoogle, logoutUser } from './auth.js';
import { templates } from './templates.js';
import { autoSave, updateSummaries } from './data.js';
import { math } from './utils.js';
import { formatter } from './formatter.js';

export function initializeUI() {
    attachGlobalListeners();
    attachNavigationListeners();
    attachDynamicRowListeners();
    showTab('assets-debts');
}

function attachGlobalListeners() {
    document.getElementById('login-btn')?.addEventListener('click', signInWithGoogle);
    document.getElementById('logout-btn')?.addEventListener('click', logoutUser);

    document.body.addEventListener('input', (e) => {
        if (e.target.closest('.input-base, .input-range')) {
            window.debouncedAutoSave();
        }
    });
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
        const addBtn = e.target.closest('[data-add-row]');
        const removeBtn = e.target.closest('[data-action="remove"]');
        if (addBtn) {
            window.addRow(addBtn.dataset.addRow, addBtn.dataset.rowType);
            window.debouncedAutoSave();
        } else if (removeBtn) {
            removeBtn.closest('tr')?.remove();
            window.debouncedAutoSave();
        }
    });

    // Handle conditional cost basis visibility for investments
    document.body.addEventListener('change', (e) => {
        if (e.target.dataset.id === 'type' && e.target.closest('#investment-rows')) {
            updateCostBasisVisibility(e.target.closest('tr'));
        }
    });
}

function updateCostBasisVisibility(row) {
    const typeSelect = row.querySelector('[data-id="type"]');
    const costBasisInput = row.querySelector('[data-id="costBasis"]');
    if (!typeSelect || !costBasisInput) return;

    if (typeSelect.value === 'Post-Tax (Roth)') {
        costBasisInput.style.visibility = 'visible';
        costBasisInput.disabled = false;
    } else {
        costBasisInput.style.visibility = 'hidden';
        costBasisInput.disabled = true;
        // Optionally clear the value if not Roth, though we'll keep the data for now 
        // to avoid accidental data loss if the user clicks back and forth.
    }
}

export function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');

    // Trigger specific tab logic
    if (tabId === 'burndown' || tabId === 'projection') {
        window.debouncedAutoSave(); 
    }
}

window.addRow = (containerId, type, data = {}) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const row = document.createElement('tr');
    row.className = 'border-b border-slate-700/50 hover:bg-slate-800/20';
    row.innerHTML = templates[type](data);
    container.appendChild(row);
    
    // Fill data
    row.querySelectorAll('[data-id]').forEach(input => {
        const key = input.dataset.id;
        if (data[key] !== undefined) {
            if (input.type === 'checkbox') input.checked = data[key];
            else if (input.dataset.type === 'currency') input.value = math.toCurrency(data[key]);
            else input.value = data[key];
        }
    });

    // Specialized initialization for investment rows
    if (type === 'investment') {
        updateCostBasisVisibility(row);
    }

    row.querySelectorAll('[data-type="currency"]').forEach(formatter.bindCurrencyEventListeners);
};

// Debounce Utility
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
    
    const defs = {
        stockGrowth: { label: 'Stock Growth', unit: '%' },
        inflation: { label: 'Inflation', unit: '%' },
        ssMonthly: { label: 'SS Monthly', unit: '$' }
    };

    Object.entries(defs).forEach(([key, config]) => {
        const val = data.assumptions?.[key] || 0;
        const div = document.createElement('div');
        div.className = 'space-y-2';
        div.innerHTML = `
            <label class="flex justify-between font-bold text-xs uppercase text-slate-500">
                ${config.label} <span class="text-blue-400">${val}${config.unit}</span>
            </label>
            <input type="range" data-id="${key}" value="${val}" min="0" max="15" step="0.5" class="input-range">
        `;
        container.appendChild(div);
    });
};
