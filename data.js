
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
        if (!window.currentData.assumptions) {
            window.currentData.assumptions = assumptions.defaults;
        }
    } else {
        window.currentData = getInitialData();
        await autoSave(false);
    }
    
    loadUserDataIntoUI(window.currentData);
    benefits.load(window.currentData.benefits);
    burndown.load(window.currentData.burndown);
}

export function loadUserDataIntoUI(data) {
    clearDynamicContent();
    const populate = (arr, id, type) => {
        if (arr?.length) arr.forEach(item => window.addRow(id, type, item));
        else window.addRow(id, type, {});
    };
    populate(data.investments, 'investment-rows', 'investment');
    populate(data.realEstate, 'real-estate-rows', 'realEstate');
    populate(data.otherAssets, 'other-assets-rows', 'otherAsset');
    populate(data.helocs, 'heloc-rows', 'heloc');
    populate(data.debts, 'debt-rows', 'debt');
    populate(data.income, 'income-rows', 'income');
    populate(data.budget?.savings?.filter(s => s.name !== '401k / 403b'), 'budget-savings-rows', 'budget-savings');
    populate(data.budget?.expenses, 'budget-expenses-rows', 'budget-expense');

    window.createAssumptionControls(data);
    updateSummaries(data);
}

function clearDynamicContent() {
    ['investment-rows', 'real-estate-rows', 'other-assets-rows', 'heloc-rows', 'debt-rows', 'income-rows', 'budget-savings-rows', 'budget-expenses-rows']
    .forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
}

export async function autoSave(scrape = true) {
    if (scrape) window.currentData = scrapeDataFromUI();
    updateSummaries(window.currentData);

    if (document.getElementById('tab-projection')?.classList.contains('hidden') === false) {
        projection.run(window.currentData);
    }
    if (document.getElementById('tab-burndown')?.classList.contains('hidden') === false) {
        burndown.run();
    }

    if (user && db) {
        try { await setDoc(doc(db, "users", user.uid), window.currentData, { merge: true }); }
        catch (e) { console.error("Firestore Save Error:", e); }
    }
}

function scrapeDataFromUI() {
    const data = { 
        assumptions: {}, investments: [], realEstate: [], otherAssets: [],
        helocs: [], debts: [], income: [], budget: { savings: [], expenses: [] },
        benefits: benefits.scrape(), burndown: burndown.scrape()
    };
    document.querySelectorAll('#assumptions-container [data-id]').forEach(i => data.assumptions[i.dataset.id] = parseFloat(i.value));
    document.querySelectorAll('#investment-rows tr').forEach(r => data.investments.push(scrapeRow(r)));
    document.querySelectorAll('#real-estate-rows tr').forEach(r => data.realEstate.push(scrapeRow(r)));
    document.querySelectorAll('#other-assets-rows tr').forEach(r => data.otherAssets.push(scrapeRow(r)));
    document.querySelectorAll('#heloc-rows tr').forEach(r => data.helocs.push(scrapeRow(r)));
    document.querySelectorAll('#debt-rows tr').forEach(r => data.debts.push(scrapeRow(r)));
    document.querySelectorAll('#income-rows tr').forEach(r => data.income.push(scrapeRow(r)));
    document.querySelectorAll('#budget-savings-rows tr').forEach(r => {
        if (r.querySelector('[data-id="name"]')?.value !== '401k / 403b') data.budget.savings.push(scrapeRow(r));
    });
    document.querySelectorAll('#budget-expenses-rows tr').forEach(r => data.budget.expenses.push(scrapeRow(r)));
    return data;
}

function scrapeRow(row) {
    const d = {};
    row.querySelectorAll('[data-id]').forEach(i => {
        const k = i.dataset.id;
        if (i.type === 'checkbox') d[k] = i.checked;
        else if (i.dataset.type === 'currency') d[k] = math.fromCurrency(i.value);
        else d[k] = (i.type === 'number' || i.type === 'range') ? parseFloat(i.value) || 0 : i.value;
    });
    return d;
}

function getInitialData() {
    return { 
        assumptions: assumptions.defaults, investments: [], realEstate: [], otherAssets: [],
        helocs: [], debts: [], income: [], budget: { savings: [], expenses: [{ name: 'Mortgage', annual: 0 }] },
        benefits: {}, burndown: {}
    };
}

export function updateSummaries(data) {
    const s = engine.calculateSummaries(data);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = math.toCurrency(v); };
    set('sidebar-networth', s.netWorth);
    set('sum-assets', s.totalAssets);
    set('sum-liabilities', s.totalLiabilities);
    set('sum-networth', s.netWorth);
    set('sum-income', s.grossIncome);
    set('sum-budget-savings', s.totalAnnualSavings);
    set('sum-budget-annual', s.totalAnnualBudget);
    set('sum-budget-total', s.totalAnnualSavings + s.totalAnnualBudget);
}
