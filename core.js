
import { GoogleGenAI } from '@google/genai';
import { signInWithGoogle, logoutUser } from './auth.js';
import { templates } from './templates.js';
import { autoSave, updateSummaries } from './data.js';
import { math, engine } from './utils.js';
import { formatter } from './formatter.js';

let assetChart = null;

export function initializeUI() {
    attachGlobalListeners();
    attachNavigationListeners();
    attachDynamicRowListeners();
    attachSortingListeners();
    attachCoPilotListeners();
    showTab('assets-debts');
}

function attachGlobalListeners() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.onclick = signInWithGoogle;
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = logoutUser;

    document.body.addEventListener('input', (e) => {
        if (e.target.closest('.input-base, .input-range')) {
            handleLinkedBudgetValues(e.target);
            if (e.target.dataset.id === 'contribution') checkIrsLimits(e.target.closest('tr'));
            window.debouncedAutoSave();
        }
    });

    document.getElementById('input-projection-end')?.addEventListener('input', (e) => {
        document.getElementById('label-projection-end').textContent = e.target.value;
        window.debouncedAutoSave();
    });
}

function checkIrsLimits(row) {
    const amount = math.fromCurrency(row.querySelector('[data-id="amount"]').value);
    const isMonthly = row.querySelector('[data-id="isMonthly"]').textContent.trim().toLowerCase() === 'monthly';
    const baseAnnual = isMonthly ? amount * 12 : amount;
    const personalPct = parseFloat(row.querySelector('[data-id="contribution"]').value) || 0;
    const matchPct = parseFloat(row.querySelector('[data-id="match"]').value) || 0;
    const total401k = baseAnnual * ((personalPct + matchPct) / 100);
    const limit = 23500; 
    const warning = row.querySelector('[data-id="capWarning"]');
    if (warning) warning.classList.toggle('hidden', total401k <= limit);
}

function attachCoPilotListeners() {
    const pilotBtn = document.getElementById('ai-pilot-btn');
    if (pilotBtn) {
        pilotBtn.onclick = async () => {
            const modal = document.getElementById('ai-modal');
            const container = document.getElementById('ai-response-container');
            modal.classList.remove('hidden');
            container.innerHTML = `<div class="flex flex-col items-center justify-center py-20 gap-4"><div class="animate-spin text-teal-400 text-4xl"><i class="fas fa-circle-notch"></i></div><p class="font-bold text-slate-500">Co-pilot is reviewing your data...</p></div>`;
            
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Review this financial data and provide 3 key strategic tips to optimize drawdown, taxes, and government benefits for 2026 Michigan. Data: ${JSON.stringify(window.currentData)}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt
                });
                container.innerHTML = `<div class="prose prose-invert max-w-none">${response.text.replace(/\n/g, '<br>')}</div>`;
            } catch (e) {
                container.innerHTML = `<p class="text-red-400">Error connecting to AI: ${e.message}</p>`;
            }
        };
    }

    const closeModal = document.getElementById('close-ai-modal');
    if (closeModal) {
        closeModal.onclick = () => document.getElementById('ai-modal').classList.add('hidden');
    }
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
    const val = typeSelect.value;
    const isLocked = (val === 'Pre-Tax (401k/IRA)' || val === 'Cash');
    costBasisInput.style.visibility = isLocked ? 'hidden' : 'visible';
    costBasisInput.disabled = isLocked;
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
        checkIrsLimits(row);
    }
    if (type === 'investment') updateCostBasisVisibility(row);
    row.querySelectorAll('[data-type="currency"]').forEach(formatter.bindCurrencyEventListeners);
};

window.updateSidebarChart = (data) => {
    const ctx = document.getElementById('sidebar-asset-chart')?.getContext('2d');
    if (!ctx) return;
    const totals = {};
    data.investments.forEach(i => totals[i.type] = (totals[i.type] || 0) + math.fromCurrency(i.value));
    data.realEstate.forEach(r => totals['Real Estate'] = (totals['Real Estate'] || 0) + math.fromCurrency(r.value));
    
    if (assetChart) assetChart.destroy();
    assetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(totals),
            datasets: [{
                data: Object.values(totals),
                backgroundColor: ['#3b82f6', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            cutout: '70%',
            responsive: true
        }
    });
};

window.createAssumptionControls = (data) => {
    const container = document.getElementById('assumptions-container');
    if (!container) return;
    container.innerHTML = `
        <div class="space-y-6">
            <h4 class="text-xs uppercase font-bold text-slate-500 mb-2">Personal Settings</h4>
            <div class="space-y-4">
                <label class="block">
                    <span class="text-[10px] text-slate-400 font-bold uppercase">Filing Status</span>
                    <select data-id="filingStatus" class="input-base w-full mt-1">
                        <option>Single</option>
                        <option>Married Filing Jointly</option>
                    </select>
                </label>
                <label class="block">
                    <span class="text-[10px] text-slate-400 font-bold uppercase">Drawdown Ceiling (Benefit Target)</span>
                    <select data-id="benefitCeiling" class="input-base w-full mt-1">
                        <option value="1.38">138% FPL (Medicaid Target)</option>
                        <option value="2.5">250% FPL (Marketplace Target)</option>
                        <option value="999">No Ceiling (Withdraw Everything)</option>
                    </select>
                </label>
            </div>
        </div>
    `;
    const sliders = { currentAge: 'Current Age', retirementAge: 'Retirement Age', stockGrowth: 'Stock Growth (%)', inflation: 'Inflation (%)' };
    Object.entries(sliders).forEach(([key, label]) => {
        const val = data.assumptions?.[key] || 0;
        const div = document.createElement('div');
        div.className = 'space-y-2';
        div.innerHTML = `<label class="flex justify-between font-bold text-[10px] uppercase text-slate-500">${label} <span class="text-blue-400">${val}</span></label>
        <input type="range" data-id="${key}" value="${val}" min="0" max="100" step="0.5" class="input-range">`;
        container.appendChild(div);
    });
    container.querySelectorAll('select').forEach(s => s.value = data.assumptions?.[s.dataset.id] || 'Single');
};

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
window.debouncedAutoSave = debounce(() => autoSave(true), 500);
