
import { math, engine } from './utils.js';

export const benefits = {
    init: () => {
        const container = document.getElementById('benefits-module');
        if (!container) return;
        
        container.innerHTML = `
            <div class="p-8 pb-4">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white">Benefits Calculator (Michigan 2026)</h2>
                    <div class="text-[10px] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-800">
                        <i class="fas fa-info-circle mr-1"></i> MI 2026: No Asset Test for SNAP/HMP
                    </div>
                </div>
                
                <div class="flex bg-slate-800/80 p-1.5 rounded-xl mb-12 shadow-inner">
                    <button data-subtab="health" class="subtab-btn active flex-1 py-3 font-bold rounded-lg transition-all">Health Coverage</button>
                    <button data-subtab="snap" class="subtab-btn flex-1 py-3 font-bold rounded-lg transition-all">SNAP (Food)</button>
                </div>

                <div id="benefit-tab-health" class="benefit-subtab-content space-y-12">
                    <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400">Household Size:</span>
                            <span data-label="hhSize" class="text-xl font-bold text-white">1</span>
                        </div>
                        <input type="range" data-benefit-id="hhSize" min="1" max="10" step="1" value="1" class="benefit-slider w-full">
                    </div>

                    <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400 font-medium">Annual Income (Health):</span>
                            <span data-label="healthIncome" class="text-2xl font-black text-white">$40,000</span>
                        </div>
                        <div class="relative pt-10">
                            <div id="health-slider-labels" class="absolute inset-x-0 flex items-center justify-between pointer-events-none top-0 opacity-80 text-[8px] uppercase font-black tracking-widest text-slate-500 px-1">
                                <span>Medicaid</span>
                                <span>HMP</span>
                                <span>Silver</span>
                                <span>Gold</span>
                                <span>Full</span>
                            </div>
                            
                            <div id="health-slider-track" class="h-4 rounded-full mb-4 relative overflow-hidden flex w-full border border-slate-700/50">
                                <div id="seg-medicaid" class="h-full bg-blue-600 transition-all duration-300"></div>
                                <div id="seg-hmp" class="h-full bg-purple-600 transition-all duration-300"></div>
                                <div id="seg-silver" class="h-full bg-slate-300 transition-all duration-300"></div>
                                <div id="seg-gold" class="h-full bg-amber-500 transition-all duration-300"></div>
                                <div id="seg-full" class="h-full bg-red-600 transition-all duration-300"></div>
                            </div>

                            <input type="range" data-benefit-id="healthIncome" min="0" max="150000" step="500" value="40000" class="benefit-slider absolute top-10 left-0 w-full opacity-0 hover:opacity-10 focus:opacity-10 transition-opacity" style="height: 16px; background: transparent; z-index: 10;">
                            <input type="range" id="health-visible-slider" data-benefit-id="healthIncome-visible" min="0" max="150000" step="500" value="40000" class="benefit-slider absolute top-10 left-0 w-full" style="background: transparent; z-index: 5;">
                        </div>
                    </div>

                    <div class="flex flex-col gap-4 pt-4">
                        <label class="flex items-center gap-4 cursor-pointer group">
                            <div class="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg border border-slate-700 group-hover:border-blue-500 transition-all">
                                <input type="checkbox" data-benefit-id="isPregnant" class="w-5 h-5 accent-blue-500">
                            </div>
                            <span class="text-slate-400 group-hover:text-white transition-colors text-lg">Household member is pregnant?</span>
                        </label>
                    </div>

                    <div class="pt-6 text-center">
                        <div id="health-result-card" class="inline-block w-full max-w-xl px-10 py-8 rounded-[3rem] border-2 transition-all duration-500 bg-slate-900/40">
                            <h3 id="health-result-title" class="text-4xl font-black mb-2 tracking-tight">Calculating...</h3>
                            <p id="health-result-desc" class="text-xl opacity-80 font-bold mb-6">Please adjust the sliders.</p>
                            
                            <div id="health-details-grid" class="grid grid-cols-2 gap-6 text-left border-t border-white/10 pt-8 mt-4 hidden">
                                <div class="space-y-1">
                                    <p class="text-[10px] uppercase font-black tracking-widest opacity-50">Est. Premium</p>
                                    <p id="detail-premium" class="text-lg font-black text-white">$0 / mo</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-[10px] uppercase font-black tracking-widest opacity-50">Deductible</p>
                                    <p id="detail-deductible" class="text-lg font-black text-white">$0</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-[10px] uppercase font-black tracking-widest opacity-50">Key Benefit</p>
                                    <p id="detail-benefit" class="text-lg font-black text-white">Full Medical</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-[10px] uppercase font-black tracking-widest opacity-50">Special Feature</p>
                                    <p id="detail-feature" class="text-lg font-black text-white">No Co-pays</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="benefit-tab-snap" class="benefit-subtab-content hidden space-y-12">
                     <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400">Household Size:</span>
                            <span data-label="hhSize" class="text-xl font-bold text-white">1</span>
                        </div>
                        <input type="range" data-benefit-id="hhSize" min="1" max="10" step="1" value="1" class="benefit-slider w-full">
                    </div>

                    <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400 font-medium">Annual Gross Income (SNAP):</span>
                            <span data-label="snapIncome" class="text-2xl font-black text-white">$13,000</span>
                        </div>
                        <input type="range" data-benefit-id="snapIncome" min="0" max="150000" step="500" value="13000" class="benefit-slider w-full">
                        <p class="text-right text-[10px] text-emerald-500 font-black tracking-tighter opacity-80">CATEGORICAL ELIGIBILITY LIMIT (200% FPL)</p>
                    </div>

                    <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400 font-medium">Monthly Shelter & Utility Costs:</span>
                            <span data-label="shelterCosts" class="text-2xl font-black text-white">$700</span>
                        </div>
                        <input type="range" data-benefit-id="shelterCosts" min="0" max="5000" step="50" value="700" class="benefit-slider w-full">
                        <div class="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            <span>Rent + Heat + Electric</span>
                            <label class="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" data-benefit-id="hasSUA" checked class="accent-blue-500">
                                <span class="group-hover:text-white transition-colors">Apply MI Standard Utility Allowance</span>
                            </label>
                        </div>
                    </div>

                    <label class="flex items-center gap-4 cursor-pointer group">
                         <div class="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg border border-slate-700 group-hover:border-emerald-500 transition-all">
                            <input type="checkbox" data-benefit-id="isDisabled" class="w-5 h-5 accent-emerald-500">
                        </div>
                        <span class="text-slate-400 group-hover:text-white transition-colors text-lg">Household member is disabled or 60+?</span>
                    </label>

                    <div class="pt-8 text-center space-y-2">
                        <h3 id="snap-result-value" class="text-5xl font-black text-emerald-400 transition-all">$0 / month</h3>
                        <p class="text-xl text-slate-500 font-medium">Estimated Monthly Food Assistance.</p>
                    </div>
                </div>

                <div class="mt-12 p-6 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                    <p class="text-[10px] text-slate-500 italic leading-relaxed text-center">
                        Note: 2026 Michigan standards utilize Broad-Based Categorical Eligibility (BBCE), removing asset tests for most households. Calculations assume updated 2025/2026 Federal Poverty Level (FPL) estimates. Consult MDHHS for final eligibility.
                    </p>
                </div>
            </div>
        `;

        benefits.attachListeners();
        benefits.refresh();
    },

    attachListeners: () => {
        const container = document.getElementById('benefits-module');
        
        container.querySelectorAll('.subtab-btn').forEach(btn => {
            btn.onclick = () => {
                container.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                container.querySelectorAll('.benefit-subtab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(`benefit-tab-${btn.dataset.subtab}`).classList.remove('hidden');
            };
        });

        container.querySelectorAll('input').forEach(input => {
            input.oninput = () => {
                if (input.dataset.benefitId === 'healthIncome' || input.dataset.benefitId === 'healthIncome-visible') {
                    const other = container.querySelector(`[data-benefit-id="${input.dataset.benefitId === 'healthIncome' ? 'healthIncome-visible' : 'healthIncome'}"]`);
                    if (other) other.value = input.value;
                }
                if (input.dataset.benefitId === 'hhSize') {
                    container.querySelectorAll('[data-benefit-id="hhSize"]').forEach(el => el.value = input.value);
                }
                benefits.refresh();
                window.debouncedAutoSave();
            };
        });
    },

    refresh: () => {
        const data = benefits.scrape();
        const c = document.getElementById('benefits-module');
        if (!c) return;

        c.querySelectorAll('[data-label="hhSize"]').forEach(el => el.textContent = data.hhSize);
        c.querySelector('[data-label="healthIncome"]').textContent = math.toCurrency(data.healthIncome);
        c.querySelector('[data-label="snapIncome"]').textContent = math.toCurrency(data.snapIncome);
        c.querySelector('[data-label="shelterCosts"]').textContent = math.toCurrency(data.shelterCosts);

        const fpl2026 = 16060 + (data.hhSize - 1) * 5650;
        const income = data.healthIncome;
        const ratio = income / fpl2026;
        const maxSliderVal = 150000;

        const pct = (val) => Math.min(100, (val / maxSliderVal) * 100);
        
        const medicaidLimit = fpl2026 * 1.38;
        const hmpLimit = fpl2026 * 1.60;
        const silverLimit = fpl2026 * 2.50;
        const goldLimit = fpl2026 * 4.00;

        document.getElementById('seg-medicaid').style.flex = `0 0 ${pct(medicaidLimit)}%`;
        document.getElementById('seg-hmp').style.flex = `0 0 ${pct(hmpLimit) - pct(medicaidLimit)}%`;
        document.getElementById('seg-silver').style.flex = `0 0 ${pct(silverLimit) - pct(hmpLimit)}%`;
        document.getElementById('seg-gold').style.flex = `0 0 ${pct(goldLimit) - pct(silverLimit)}%`;
        document.getElementById('seg-full').style.flex = `0 0 ${100 - pct(goldLimit)}%`;

        const healthTitle = document.getElementById('health-result-title');
        const healthDesc = document.getElementById('health-result-desc');
        const healthCard = document.getElementById('health-result-card');
        const healthBall = document.getElementById('health-visible-slider');
        const detailsGrid = document.getElementById('health-details-grid');

        const setDetail = (prem, ded, ben, feat) => {
            detailsGrid.classList.remove('hidden');
            document.getElementById('detail-premium').textContent = prem;
            document.getElementById('detail-deductible').textContent = ded;
            document.getElementById('detail-benefit').textContent = ben;
            document.getElementById('detail-feature').textContent = feat;
        };

        if (ratio < 1.38) {
            healthTitle.textContent = "Medicaid (Healthy MI)";
            healthDesc.textContent = "Full state-sponsored coverage.";
            healthCard.style.borderColor = "#2563eb";
            healthCard.style.color = "#3b82f6";
            healthBall.style.setProperty('--thumb-color', '#2563eb');
            setDetail("$0 / mo", "$0", "Dental & Vision", "Wide MI Network");
        } else if (ratio < 1.60) {
            healthTitle.textContent = "Healthy MI Plan Plus";
            healthDesc.textContent = "Enhanced state-subsidized tier.";
            healthCard.style.borderColor = "#9333ea";
            healthCard.style.color = "#a855f7";
            healthBall.style.setProperty('--thumb-color', '#9333ea');
            setDetail("$0 - $25 / mo", "Very Low", "Full Wellness", "HMP Incentives");
        } else if (ratio < 2.50) {
            healthTitle.textContent = "Silver Marketplace Plan";
            healthDesc.textContent = "Max cost-sharing reductions tier.";
            healthCard.style.borderColor = "#94a3b8";
            healthCard.style.color = "#cbd5e1";
            healthBall.style.setProperty('--thumb-color', '#94a3b8');
            setDetail("$40 - $120 / mo", "$750 - $1,500", "87-94% AV", "Subsidized Co-pays");
        } else if (ratio < 4.00) {
            healthTitle.textContent = "Gold Marketplace Plan";
            healthDesc.textContent = "Comprehensive high-coverage tier.";
            healthCard.style.borderColor = "#d97706";
            healthCard.style.color = "#f59e0b";
            healthBall.style.setProperty('--thumb-color', '#d97706');
            setDetail("$150 - $350 / mo", "$500 - $1,000", "Low Out-of-Pocket", "Predictable Costs");
        } else {
            healthTitle.textContent = "Standard / Private Rate";
            healthDesc.textContent = "Unsubsidized private marketplace rate.";
            healthCard.style.borderColor = "#dc2626";
            healthCard.style.color = "#ef4444";
            healthBall.style.setProperty('--thumb-color', '#dc2626');
            setDetail("$450 - $850+ / mo", "Variable", "Full Choice", "No Income Limits");
        }

        const estimatedBenefit = engine.calculateSnapBenefit(data.snapIncome, data.hhSize, data.shelterCosts, data.hasSUA, data.isDisabled);
        const snapResultEl = document.getElementById('snap-result-value');

        if (estimatedBenefit <= 0) {
            snapResultEl.textContent = "$0 / month";
            snapResultEl.style.color = "#64748b";
        } else {
            snapResultEl.textContent = `${math.toCurrency(estimatedBenefit)} / month`;
            snapResultEl.style.color = "#34d399";
        }
    },

    scrape: () => {
        const c = document.getElementById('benefits-module');
        if (!c) return {};
        const get = (id, type) => {
            const el = c.querySelector(`[data-benefit-id="${id}"]`);
            if (!el) return 0;
            if (type === 'bool') return el.checked;
            return parseFloat(el.value) || 0;
        };
        return {
            hhSize: get('hhSize'),
            healthIncome: get('healthIncome'),
            snapIncome: get('snapIncome'),
            isPregnant: get('isPregnant', 'bool'),
            shelterCosts: get('shelterCosts'),
            hasSUA: get('hasSUA', 'bool'),
            isDisabled: get('isDisabled', 'bool')
        };
    },

    load: (data) => {
        if (!data) return;
        const c = document.getElementById('benefits-module');
        if (!c) return;
        Object.entries(data).forEach(([key, val]) => {
            const el = c.querySelector(`[data-benefit-id="${key}"]`);
            if (!el) return;
            if (el.type === 'checkbox') el.checked = val;
            else {
                el.value = val;
                if (key === 'healthIncome') {
                    const visible = c.querySelector('[data-benefit-id="healthIncome-visible"]');
                    if (visible) visible.value = val;
                }
            }
        });
        benefits.refresh();
    }
};
