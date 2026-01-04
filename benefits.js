
import { math } from './utils.js';

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
                            <div class="absolute inset-x-0 flex items-center justify-between pointer-events-none top-0 opacity-80 text-[9px] uppercase font-black tracking-widest text-slate-500 px-1">
                                <span>Medicaid</span>
                                <span>Healthy MI</span>
                                <span>Silver Plan</span>
                                <span>Full Rate</span>
                            </div>
                            <!-- Background Track with Segments -->
                            <div id="health-slider-track" class="h-4 rounded-full mb-4 relative overflow-hidden flex w-full border border-slate-700/50">
                                <div class="h-full bg-blue-600" style="flex: 0 0 25%" title="Traditional Medicaid"></div>
                                <div class="h-full bg-purple-600" style="flex: 0 0 13%" title="Healthy Michigan Plan"></div>
                                <div class="h-full bg-slate-400" style="flex: 0 0 22%" title="Silver Marketplace (High Subsidies)"></div>
                                <div class="h-full bg-orange-500" style="flex: 0 0 20%" title="Gold/Standard Marketplace"></div>
                                <div class="h-full bg-red-600" style="flex: 0 0 20%" title="Unsubsidized"></div>
                            </div>
                            <!-- Range inputs: one hidden for capture, one visible with dynamic thumb -->
                            <input type="range" data-benefit-id="healthIncome" min="0" max="150000" step="500" value="40000" class="benefit-slider absolute top-10 left-0 w-full opacity-0 hover:opacity-10 focus:opacity-10 transition-opacity" style="height: 16px; background: transparent; z-index: 10;">
                            <input type="range" data-benefit-id="healthIncome-visible" min="0" max="150000" step="500" value="40000" class="benefit-slider absolute top-10 left-0 w-full" style="background: transparent; z-index: 5;">
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

                    <div class="pt-10 text-center space-y-3">
                        <h3 id="health-result-title" class="text-4xl font-black transition-colors duration-300">Calculating...</h3>
                        <p id="health-result-desc" class="text-xl text-slate-500 font-medium">Please adjust the sliders.</p>
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
                // Sync health sliders
                if (input.dataset.benefitId === 'healthIncome' || input.dataset.benefitId === 'healthIncome-visible') {
                    const other = container.querySelector(`[data-benefit-id="${input.dataset.benefitId === 'healthIncome' ? 'healthIncome-visible' : 'healthIncome'}"]`);
                    if (other) other.value = input.value;
                }

                // Sync hhSize across tabs
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

        // Update Labels
        c.querySelectorAll('[data-label="hhSize"]').forEach(el => el.textContent = data.hhSize);
        c.querySelector('[data-label="healthIncome"]').textContent = math.toCurrency(data.healthIncome);
        c.querySelector('[data-label="snapIncome"]').textContent = math.toCurrency(data.snapIncome);
        c.querySelector('[data-label="shelterCosts"]').textContent = math.toCurrency(data.shelterCosts);

        // --- HEALTH COVERAGE LOGIC (ACA/MEDICAID 2026) ---
        // 2026 FPL Estimates: HH1: $16,060, HH2: $21,710, +$5,440 per extra person
        const fpl2026 = 16060 + (data.hhSize - 1) * 5650; // Using slightly indexed 2026 est.
        const income = data.healthIncome;
        const ratio = income / fpl2026;

        const healthTitle = document.getElementById('health-result-title');
        const healthDesc = document.getElementById('health-result-desc');
        const healthBall = c.querySelector('[data-benefit-id="healthIncome-visible"]');

        if (ratio < 1.38) {
            healthTitle.textContent = "Medicaid (Healthy MI)";
            healthTitle.style.color = "#3b82f6"; // Blue
            healthDesc.textContent = "State-sponsored plan. $0 monthly premiums.";
            healthBall.style.setProperty('--thumb-color', '#3b82f6');
        } else if (ratio < 1.60) {
            healthTitle.textContent = "Healthy Michigan Plan Plus";
            healthTitle.style.color = "#a855f7"; // Purple
            healthDesc.textContent = "Comprehensive HMP Coverage with minimal cost-sharing.";
            healthBall.style.setProperty('--thumb-color', '#a855f7');
        } else if (ratio < 2.50) {
            healthTitle.textContent = "Silver Plan (Cost Sharing)";
            healthTitle.style.color = "#94a3b8"; // Silverish Slate
            healthDesc.textContent = "Highest Marketplace subsidies & lowest out-of-pocket costs.";
            healthBall.style.setProperty('--thumb-color', '#94a3b8');
        } else if (ratio < 4.00) {
            healthTitle.textContent = "Gold/Platinum Marketplace";
            healthTitle.style.color = "#fbbf24"; // Gold
            healthDesc.textContent = "Marketplace Plan with partial Advance Tax Credits.";
            healthBall.style.setProperty('--thumb-color', '#fbbf24');
        } else {
            healthTitle.textContent = "Private Insurance (Full Rate)";
            healthTitle.style.color = "#ef4444"; // Red
            healthDesc.textContent = "Unsubsidized private coverage. Market rates apply.";
            healthBall.style.setProperty('--thumb-color', '#ef4444');
        }

        // --- SNAP LOGIC (MI 2026) ---
        const snapFpl = 16060 + (data.hhSize - 1) * 5650;
        const snapGrossLimit = snapFpl * 2.0; // MI BBCE categorical limit
        const monthlyGross = data.snapIncome / 12;
        const snapResultEl = document.getElementById('snap-result-value');

        if (monthlyGross > (snapGrossLimit / 12)) {
            snapResultEl.textContent = "$0 / month";
            snapResultEl.classList.replace('text-emerald-400', 'text-slate-500');
        } else {
            // Standard Deduction 2026 Est.
            const stdDed = data.hhSize <= 3 ? 205 : (data.hhSize === 4 ? 220 : (data.hhSize === 5 ? 255 : 295));
            const adjIncome = Math.max(0, monthlyGross - stdDed);
            
            // Michigan Standard Utility Allowance (SUA) - if user pays heat/cool, add fixed amt
            const suaAmt = data.hasSUA ? 680 : 0; 
            const totalShelter = data.shelterCosts + suaAmt;
            
            // Excess Shelter Deduction Logic:
            // Deduct the part of shelter costs that exceeds 50% of Adjusted Income.
            const shelterThreshold = adjIncome / 2;
            const rawExcessShelter = Math.max(0, totalShelter - shelterThreshold);
            
            // The Deduction itself is capped (estimated $712 for 2026) UNLESS elderly/disabled
            const shelterCap = 712; 
            const finalShelterDeduction = (data.isDisabled) ? rawExcessShelter : Math.min(rawExcessShelter, shelterCap);
            
            const netIncome = Math.max(0, adjIncome - finalShelterDeduction);
            
            // Max Benefit Estimate (FY 2026 projection: ~$291 base + $211/extra person)
            const maxBenefit = 295 + (data.hhSize - 1) * 215;
            const estimatedBenefit = Math.max(0, maxBenefit - (netIncome * 0.3));
            
            snapResultEl.textContent = `${math.toCurrency(estimatedBenefit)} / month`;
            snapResultEl.classList.replace('text-slate-500', 'text-emerald-400');
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
