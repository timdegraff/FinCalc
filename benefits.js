
import { math, engine } from './utils.js';

export const benefits = {
    init: () => {
        const container = document.getElementById('benefits-module');
        if (!container) return;
        
        container.innerHTML = `
            <div class="flex flex-col gap-6 p-1">
                <!-- Header Card -->
                <div class="card-container p-6 bg-slate-800 rounded-2xl border border-slate-700">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <h3 class="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                                <i class="fas fa-hand-holding-heart text-amber-400"></i> Benefit Optimization
                            </h3>
                            <div class="h-8 w-[1px] bg-slate-700 mx-2"></div>
                            <div class="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700">
                                <button data-subtab="health" class="subtab-btn active px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">Health</button>
                                <button data-subtab="snap" class="subtab-btn px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">SNAP</button>
                            </div>
                        </div>
                        <div class="px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-700">
                             <span class="label-std text-slate-500 block mb-1">Household Size</span>
                             <div class="flex items-center gap-4">
                                <input type="range" data-benefit-id="hhSize" min="1" max="10" step="1" value="1" class="benefit-slider w-24">
                                <span data-label="hhSize" class="text-blue-400 font-black mono-numbers text-lg">1</span>
                             </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- Left Column: Controls -->
                    <div class="lg:col-span-7 space-y-6">
                        
                        <!-- Health Content -->
                        <div id="benefit-tab-health" class="benefit-subtab-content space-y-6">
                            <div class="card-container p-6 bg-slate-800 rounded-2xl border border-slate-700">
                                <label class="flex justify-between items-center mb-4">
                                    <span class="label-std text-slate-400">Projected Annual MAGI</span>
                                    <span data-label="healthIncome" class="text-xl font-black text-white mono-numbers">$40,000</span>
                                </label>
                                
                                <div class="relative pt-6 pb-2">
                                    <div id="health-slider-labels" class="absolute inset-x-0 flex items-center justify-between pointer-events-none top-0 text-[8px] uppercase font-black tracking-widest text-slate-600 px-1">
                                        <span>Medicaid</span>
                                        <span>HMP</span>
                                        <span>Silver</span>
                                        <span>Gold</span>
                                        <span>Full</span>
                                    </div>
                                    
                                    <div id="health-slider-track" class="h-3 rounded-full mb-4 relative overflow-hidden flex w-full border border-slate-900 shadow-inner bg-slate-900">
                                        <div id="seg-medicaid" class="h-full bg-blue-600 transition-all duration-300 opacity-80"></div>
                                        <div id="seg-hmp" class="h-full bg-purple-600 transition-all duration-300 opacity-80"></div>
                                        <div id="seg-silver" class="h-full bg-slate-400 transition-all duration-300 opacity-80"></div>
                                        <div id="seg-gold" class="h-full bg-amber-500 transition-all duration-300 opacity-80"></div>
                                        <div id="seg-full" class="h-full bg-red-600 transition-all duration-300 opacity-80"></div>
                                    </div>

                                    <input type="range" data-benefit-id="healthIncome" min="0" max="150000" step="500" value="40000" class="benefit-slider absolute top-6 left-0 w-full opacity-0 hover:opacity-10 focus:opacity-10 transition-opacity cursor-pointer" style="height: 12px; z-index: 10;">
                                    <input type="range" id="health-visible-slider" data-benefit-id="healthIncome-visible" min="0" max="150000" step="500" value="40000" class="benefit-slider absolute top-6 left-0 w-full" style="background: transparent; z-index: 5;">
                                </div>
                                
                                <div class="mt-6 pt-6 border-t border-slate-700/50">
                                    <label class="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" data-benefit-id="isPregnant" class="w-4 h-4 accent-blue-500 bg-slate-900 border-slate-700 rounded">
                                        <span class="label-std text-slate-500 group-hover:text-blue-400 transition-colors">Household member is pregnant?</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- SNAP Content -->
                        <div id="benefit-tab-snap" class="benefit-subtab-content hidden space-y-6">
                            <div class="card-container p-6 bg-slate-800 rounded-2xl border border-slate-700 space-y-8">
                                <div class="space-y-3">
                                    <label class="flex justify-between items-center">
                                        <span class="label-std text-slate-400">Annual Gross Income</span>
                                        <span data-label="snapIncome" class="text-xl font-black text-white mono-numbers">$13,000</span>
                                    </label>
                                    <input type="range" data-benefit-id="snapIncome" min="0" max="150000" step="500" value="13000" class="benefit-slider w-full">
                                    <p class="text-[8px] text-emerald-500/50 font-black tracking-widest uppercase">BBCE Categorical Limit (200% FPL)</p>
                                </div>

                                <div class="space-y-3">
                                    <label class="flex justify-between items-center">
                                        <span class="label-std text-slate-400">Monthly Shelter & Utility Costs</span>
                                        <span data-label="shelterCosts" class="text-xl font-black text-white mono-numbers">$700</span>
                                    </label>
                                    <input type="range" data-benefit-id="shelterCosts" min="0" max="5000" step="50" value="700" class="benefit-slider w-full">
                                    <div class="flex justify-between items-center pt-2">
                                        <span class="text-[8px] text-slate-600 font-bold uppercase">Rent + Heat + Electric</span>
                                        <label class="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" data-benefit-id="hasSUA" checked class="w-3 h-3 accent-blue-500 bg-slate-900 border-slate-700 rounded">
                                            <span class="text-[9px] font-black uppercase text-slate-500 group-hover:text-blue-400 transition-colors">Apply MI SUA</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="pt-6 border-t border-slate-700/50">
                                    <label class="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" data-benefit-id="isDisabled" class="w-4 h-4 accent-emerald-500 bg-slate-900 border-slate-700 rounded">
                                        <span class="label-std text-slate-500 group-hover:text-emerald-400 transition-colors">Household member is disabled or 60+?</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Right Column: Results -->
                    <div class="lg:col-span-5">
                        <div id="results-container" class="sticky top-0 space-y-6">
                            
                            <!-- Main Eligibility Card -->
                            <div id="benefit-result-card" class="card-container p-8 bg-slate-800 rounded-3xl border border-slate-700 text-center flex flex-col items-center justify-center transition-all duration-300">
                                <div id="benefit-icon-container" class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 bg-slate-900 border border-slate-700">
                                    <i class="fas fa-stethoscope"></i>
                                </div>
                                <h3 id="benefit-result-title" class="text-2xl font-black text-white uppercase tracking-tighter mb-2">Calculating...</h3>
                                <p id="benefit-result-desc" class="text-xs text-slate-400 font-medium mb-6">Please adjust the sliders to see results.</p>
                                
                                <div id="details-grid" class="grid grid-cols-2 gap-3 w-full border-t border-slate-700 pt-6">
                                    <div class="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 text-left">
                                        <span class="label-std text-slate-600 block mb-1">Premium</span>
                                        <span id="detail-premium" class="text-sm font-black text-white mono-numbers">$0 / mo</span>
                                    </div>
                                    <div class="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 text-left">
                                        <span class="label-std text-slate-600 block mb-1">Deductible</span>
                                        <span id="detail-deductible" class="text-sm font-black text-white mono-numbers">$0</span>
                                    </div>
                                    <div class="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 text-left">
                                        <span class="label-std text-slate-600 block mb-1">Coverage</span>
                                        <span id="detail-benefit" class="text-sm font-black text-white uppercase tracking-tighter">Full Medical</span>
                                    </div>
                                    <div class="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 text-left">
                                        <span class="label-std text-slate-600 block mb-1">Network</span>
                                        <span id="detail-feature" class="text-sm font-black text-white uppercase tracking-tighter">No Co-pays</span>
                                    </div>
                                </div>

                                <!-- SNAP Specific Result -->
                                <div id="snap-specific-result" class="hidden w-full space-y-4">
                                    <div class="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20">
                                        <span class="label-std text-emerald-500 block mb-2">Est. Food Assistance</span>
                                        <span id="snap-result-value" class="text-4xl font-black text-emerald-400 mono-numbers">$0.00</span>
                                        <span class="block text-[10px] text-emerald-600 font-bold uppercase mt-2 tracking-widest">Per Month</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Context Footer -->
                            <div class="p-4 bg-slate-900/30 rounded-2xl border border-slate-800">
                                <p class="text-[9px] text-slate-600 italic leading-relaxed text-center font-medium uppercase tracking-wider">
                                    MI 2026 Standards: BBCE Rules Apply (No Asset Test). Based on Projected 2026 Federal Poverty Levels.
                                </p>
                            </div>
                        </div>
                    </div>
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
                container.querySelectorAll('.subtab-btn').forEach(b => {
                    b.classList.remove('active', 'bg-blue-600', 'text-white');
                    b.classList.add('text-slate-500');
                });
                btn.classList.add('active', 'bg-blue-600', 'text-white');
                btn.classList.remove('text-slate-500');
                
                container.querySelectorAll('.benefit-subtab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(`benefit-tab-${btn.dataset.subtab}`).classList.remove('hidden');
                
                // Show/Hide relevant result cards
                const snapSection = document.getElementById('snap-specific-result');
                const detailsSection = document.getElementById('details-grid');
                if (btn.dataset.subtab === 'snap') {
                    snapSection.classList.remove('hidden');
                    detailsSection.classList.add('hidden');
                } else {
                    snapSection.classList.add('hidden');
                    detailsSection.classList.remove('hidden');
                }
                benefits.refresh();
            };
        });

        // Initialize first subtab styling
        const activeSub = container.querySelector('.subtab-btn.active');
        if (activeSub) {
            activeSub.classList.add('bg-blue-600', 'text-white');
            activeSub.classList.remove('text-slate-500');
        }

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

        const healthTitle = document.getElementById('benefit-result-title');
        const healthDesc = document.getElementById('benefit-result-desc');
        const healthCard = document.getElementById('benefit-result-card');
        const healthBall = document.getElementById('health-visible-slider');
        const iconContainer = document.getElementById('benefit-icon-container');
        const icon = iconContainer.querySelector('i');

        const isSnapMode = c.querySelector('.subtab-btn[data-subtab="snap"]').classList.contains('active');

        const setDetail = (prem, ded, ben, feat) => {
            document.getElementById('detail-premium').textContent = prem;
            document.getElementById('detail-deductible').textContent = ded;
            document.getElementById('detail-benefit').textContent = ben;
            document.getElementById('detail-feature').textContent = feat;
        };

        if (isSnapMode) {
             icon.className = "fas fa-utensils";
             iconContainer.style.color = "#34d399";
             iconContainer.style.borderColor = "rgba(52, 211, 153, 0.3)";
             healthTitle.textContent = "Food Assistance";
             healthDesc.textContent = "Michigan SNAP (Bridge Card) Eligibility.";
             healthCard.style.borderColor = "rgba(52, 211, 153, 0.2)";
        } else {
            icon.className = "fas fa-stethoscope";
            if (ratio < 1.38) {
                healthTitle.textContent = "Medicaid (Healthy MI)";
                healthDesc.textContent = "Full state-sponsored coverage.";
                healthCard.style.borderColor = "rgba(37, 99, 235, 0.4)";
                iconContainer.style.color = "#3b82f6";
                iconContainer.style.borderColor = "rgba(59, 130, 246, 0.3)";
                healthBall.style.setProperty('--thumb-color', '#2563eb');
                setDetail("$0 / mo", "$0", "Dental & Vision", "Wide MI Network");
            } else if (ratio < 1.60) {
                healthTitle.textContent = "Healthy MI Plan Plus";
                healthDesc.textContent = "Enhanced state-subsidized tier.";
                healthCard.style.borderColor = "rgba(147, 51, 234, 0.4)";
                iconContainer.style.color = "#a855f7";
                iconContainer.style.borderColor = "rgba(168, 85, 247, 0.3)";
                healthBall.style.setProperty('--thumb-color', '#9333ea');
                setDetail("$0 - $25 / mo", "Very Low", "Full Wellness", "HMP Incentives");
            } else if (ratio < 2.50) {
                healthTitle.textContent = "Silver Marketplace";
                healthDesc.textContent = "Max cost-sharing reductions tier.";
                healthCard.style.borderColor = "rgba(148, 163, 184, 0.4)";
                iconContainer.style.color = "#cbd5e1";
                iconContainer.style.borderColor = "rgba(203, 213, 225, 0.3)";
                healthBall.style.setProperty('--thumb-color', '#94a3b8');
                setDetail("$40 - $120 / mo", "$750 - $1,500", "87-94% AV", "Subsidized Co-pays");
            } else if (ratio < 4.00) {
                healthTitle.textContent = "Gold Marketplace";
                healthDesc.textContent = "Comprehensive high-coverage tier.";
                healthCard.style.borderColor = "rgba(217, 119, 6, 0.4)";
                iconContainer.style.color = "#f59e0b";
                iconContainer.style.borderColor = "rgba(245, 158, 11, 0.3)";
                healthBall.style.setProperty('--thumb-color', '#d97706');
                setDetail("$150 - $350 / mo", "$500 - $1,000", "Low Out-of-Pocket", "Predictable Costs");
            } else {
                healthTitle.textContent = "Standard Rate";
                healthDesc.textContent = "Unsubsidized private marketplace rate.";
                healthCard.style.borderColor = "rgba(220, 38, 38, 0.4)";
                iconContainer.style.color = "#ef4444";
                iconContainer.style.borderColor = "rgba(239, 68, 68, 0.3)";
                healthBall.style.setProperty('--thumb-color', '#dc2626');
                setDetail("$450 - $850+ / mo", "Variable", "Full Choice", "No Income Limits");
            }
        }

        const estimatedBenefit = engine.calculateSnapBenefit(data.snapIncome, data.hhSize, data.shelterCosts, data.hasSUA, data.isDisabled);
        const snapResultEl = document.getElementById('snap-result-value');

        if (estimatedBenefit <= 0) {
            snapResultEl.textContent = "$0.00";
            snapResultEl.className = "text-4xl font-black text-slate-700 mono-numbers";
        } else {
            snapResultEl.textContent = `${math.toCurrency(estimatedBenefit)}`;
            snapResultEl.className = "text-4xl font-black text-emerald-400 mono-numbers";
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
