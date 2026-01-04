
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { math, engine, assumptions } from './utils.js';
import { benefits } from './benefits.js';
import { burndown } from './burndown.js';
import { projection } from './projection.js';

let db;
let user;

export async function initializeData(authUser) {
    db = getFirestore();
    user = authUser;
    return loadData();
}

async function loadData() {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        window.currentData = docSnap.data();
        if (!window.currentData.assumptions) window.currentData.assumptions = { ...assumptions.defaults };
    } else {
        window.currentData = getInitialData();
        await autoSave(false);
    }
    loadUserDataIntoUI(window.currentData);
    benefits.load(window.currentData.benefits);
    burndown.load(window.currentData.burndown);
    projection.load(window.currentData.projectionSettings);
}

export function loadUserDataIntoUI(data) {
    clearDynamicContent();
    const populate = (arr, id, type) => {
        if (arr?.length) arr.forEach(item => window.addRow(id, type, item));
        else if (!['budget-savings', 'heloc', 'debt'].includes(type)) window.addRow(id, type, {});
    };
    populate(data.investments, 'investment-rows', 'investment');
    populate(data.realEstate, 'real-estate-rows', 'realEstate');
    populate(data.otherAssets, 'other-assets-rows', 'otherAsset');
    populate(data.helocs, 'heloc-rows', 'heloc');
    populate(data.debts, 'debt-rows', 'debt');
    populate(data.income, 'income-cards', 'income');
    const summaries = engine.calculateSummaries(data);
    window.addRow('budget-savings-rows', 'budget-savings', { name: '401k Contributions', annual: summaries.total401kContribution, monthly: summaries.total401kContribution / 12, isLocked: true });
    populate(data.budget?.savings?.filter(s => s.name !== '401k Contributions'), 'budget-savings-rows', 'budget-savings');
    populate(data.budget?.expenses, 'budget-expenses-rows', 'budget-expense');
    
    // Load Projection End Age
    const projEndInput = document.getElementById('input-projection-end');
    const projEndLabel = document.getElementById('label-projection-end');
    if (projEndInput) {
        const val = data.projectionEndAge || 75;
        projEndInput.value = val;
        if (projEndLabel) projEndLabel.textContent = val;
    }

    window.createAssumptionControls(data);
    updateSummaries(data);
}

function clearDynamicContent() {
    ['investment-rows', 'real-estate-rows', 'other-assets-rows', 'heloc-rows', 'debt-rows', 'income-cards', 'budget-savings-rows', 'budget-expenses-rows']
    .forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
}

export async function autoSave(scrape = true) {
    if (scrape) window.currentData = scrapeDataFromUI();
    updateSummaries(window.currentData);
    window.updateSidebarChart(window.currentData);
    if (!document.getElementById('tab-projection').classList.contains('hidden')) projection.run(window.currentData);
    if (!document.getElementById('tab-burndown').classList.contains('hidden')) burndown.run();
    if (user && db) {
        try { await setDoc(doc(db, "users", user.uid), window.currentData, { merge: true }); }
        catch (e) { console.error("Save Error:", e); }
    }
}

function scrapeDataFromUI() {
    const prevData = window.currentData || getInitialData();
    const data = { 
        assumptions: { ...prevData.assumptions }, 
        investments: [], realEstate: [], otherAssets: [], helocs: [], debts: [], income: [], 
        budget: { savings: [], expenses: [] }, 
        benefits: benefits.scrape(), 
        burndown: burndown.scrape(),
        projectionSettings: projection.scrape(),
        projectionEndAge: parseFloat(document.getElementById('input-projection-end')?.value) || 75
    };

    const filingStatusEl = document.querySelector('[data-id="filingStatus"]');
    if (filingStatusEl) data.assumptions.filingStatus = filingStatusEl.value;
    
    const benefitCeilingEl = document.querySelector('[data-id="benefitCeiling"]');
    if (benefitCeilingEl) data.assumptions.benefitCeiling = benefitCeilingEl.value;

    document.querySelectorAll('#assumptions-container [data-id]').forEach(i => {
        if (i.tagName !== 'SELECT') data.assumptions[i.dataset.id] = parseFloat(i.value) || 0;
    });

    document.querySelectorAll('#investment-rows tr').forEach(r => data.investments.push(scrapeRow(r)));
    document.querySelectorAll('#real-estate-rows tr').forEach(r => data.realEstate.push(scrapeRow(r)));
    document.querySelectorAll('#other-assets-rows tr').forEach(r => data.otherAssets.push(scrapeRow(r)));
    document.querySelectorAll('#heloc-rows tr').forEach(r => data.helocs.push(scrapeRow(r)));
    document.querySelectorAll('#debt-rows tr').forEach(r => data.debts.push(scrapeRow(r)));
    document.querySelectorAll('#income-cards > div').forEach(r => {
        const d = scrapeRow(r);
        d.isMonthly = r.querySelector('[data-id="isMonthly"]')?.textContent.trim().toLowerCase() === 'monthly';
        d.writeOffsMonthly = r.querySelector('[data-id="writeOffsMonthly"]')?.textContent.trim().toLowerCase() === 'monthly';
        data.income.push(d);
    });
    document.querySelectorAll('#budget-savings-rows tr').forEach(r => {
        const nameInput = r.querySelector('[data-id="name"]');
        if (nameInput && !nameInput.readOnly) data.budget.savings.push(scrapeRow(r));
    });
    document.querySelectorAll('#budget-expenses-rows tr').forEach(r => data.budget.expenses.push(scrapeRow(r)));
    return data;
}

function scrapeRow(row) {
    const d = {};
    row.querySelectorAll('[data-id]').forEach(i => {
        if (i.tagName === 'BUTTON' || i.dataset.id === 'capWarning') return;
        const k = i.dataset.id;
        if (i.type === 'checkbox') d[k] = i.checked;
        else if (i.dataset.type === 'currency') d[k] = math.fromCurrency(i.value);
        else d[k] = (i.type === 'number') ? parseFloat(i.value) || 0 : i.value;
    });
    return d;
}

function getInitialData() {
    return { assumptions: { ...assumptions.defaults }, investments: [], realEstate: [], otherAssets: [], helocs: [], debts: [], income: [], budget: { savings: [], expenses: [] }, benefits: {}, burndown: {}, projectionSettings: {}, projectionEndAge: 75 };
}

export function updateSummaries(data) {
    const s = engine.calculateSummaries(data);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = math.toCurrency(v); };
    set('sidebar-networth', s.netWorth);
    set('sum-assets', s.totalAssets);
    set('sum-liabilities', s.totalLiabilities);
    set('sum-networth', s.netWorth);
    set('sum-budget-savings', s.totalAnnualSavings);
    set('sum-budget-annual', s.totalAnnualBudget);
    set('sum-budget-total', s.totalAnnualSavings + s.totalAnnualBudget);
    const r401k = Array.from(document.querySelectorAll('#budget-savings-rows tr')).find(r => r.querySelector('[data-id="name"]')?.readOnly);
    if (r401k) {
        const monthly = r401k.querySelector('[data-id="monthly"]');
        const annual = r401k.querySelector('[data-id="annual"]');
        if (monthly) monthly.value = math.toCurrency(s.total401kContribution / 12);
        if (annual) annual.value = math.toCurrency(s.total401kContribution);
    }
}
