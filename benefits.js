
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
                
                <div class="flex bg-slate-800/80 p-1.5 rounded-xl mb-12">
                    <button data-subtab="health" class="subtab-btn active flex-1 py-3 font-bold rounded-lg transition-all">Health Coverage</button>
                    <button data-subtab="snap" class="subtab-btn flex-1 py-3 font-bold rounded-lg transition-all">SNAP (Food)</button>
                </div>

                <div id="benefit-tab-health" class="benefit-subtab-content space-y-12">
                    <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400">Household Size:</span>
                            <span data-label="hhSize" class="text-xl font-bold text-white">1</span>
                        </div>
                        <input type="range" data-benefit-id="hhSize" min="1" max="10" step="1" value="1" class="benefit-slider">
                    </div>

                    <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400">Annual Income (Health):</span>
                            <span data-label="healthIncome" class="text-xl font-bold text-white">$40,000</span>
                        </div>
                        <div class="relative pt-6">
                            <div class="absolute inset-0 flex items-center justify-between pointer-events-none -top-4 opacity-50 text-[10px] uppercase font-bold tracking-widest text-slate-500 px-1">
                                <span>Medicaid</span>
                                <span>Healthy MI</span>
                                <span>Silver Plan</span>
                            </div>
                            <div id="health-slider-track" class="h-4 rounded-full mb-4 relative overflow-hidden flex">
                                <div class="h-full bg-blue-600" style="flex: 0 0 25%"></div>
                                <div class="h-full bg-purple-600" style="flex: 0 0 15%"></div>
                                <div class="h-full bg-orange-500" style="flex: 0 0 30%"></div>
                                <div class="h-full bg-red-500" style="flex: 1"></div>
                            </div>
                            <input type="range" data-benefit-id="healthIncome" min="0" max="150000" step="500" value="40000" class="benefit-slider absolute top-6 left-0">
                        </div>
                    </div>

                    <label class="flex items-center gap-3 cursor-pointer group pt-4">
                        <input type="checkbox" data-benefit-id="isPregnant" class="w-6 h-6 border-2 accent-blue-500">
                        <span class="text-slate-400 group-hover:text-white transition-colors">Household member is pregnant?</span>
                    </label>

                    <div class="pt-8 text-center space-y-2">
                        <h3 id="health-result-title" class="text-3xl font-black text-purple-400">Healthy Michigan Plan (Platinum)</h3>
                        <p id="health-result-desc" class="text-lg text-slate-500">State-sponsored. $0 premiums.</p>
                    </div>
                </div>

                <div id="benefit-tab-snap" class="benefit-subtab-content hidden space-y-12">
                     <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400">Household Size:</span>
                            <span data-label="hhSize" class="text-xl font-bold text-white">1</span>
                        </div>
                        <input type="range" data-benefit-id="hhSize" min="1" max="10" step="1" value="1" class="benefit-slider">
                    </div>

                    <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400">Annual Gross Income (SNAP):</span>
                            <span data-label="snapIncome" class="text-xl font-bold text-white">$13,000</span>
                        </div>
                        <input type="range" data-benefit-id="snapIncome" min="0" max="150000" step="500" value="13000" class="benefit-slider">
                        <p class="text-right text-xs text-pink-500 font-bold opacity-70">Limit for categorical eligibility: ~200% FPL</p>
                    </div>

                    <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400">Monthly Shelter & Utility Costs:</span>
                            <span data-label="shelterCosts" class="text-xl font-bold text-white">$700</span>
                        </div>
                        <input type="range" data-benefit-id="shelterCosts" min="0" max="5000" step="50" value="700" class="benefit-slider">
                        <div class="flex justify-between text-xs text-slate-500">
                            <span>Rent, mortgage, utilities, etc.</span>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" data-benefit-id="isAutoSetMax" class="accent-blue-500"> Auto-Set Max
                            </label>
                        </div>
                    </div>

                    <label class="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" data-benefit-id="isDisabled" class="w-5 h-5 accent-blue-500">
                        <span class="text-slate-400 group-hover:text-white">Household member is disabled or 60+?</span>
                    </label>

                    <div class="pt-8 text-center space-y-2">
                        <h3 id="snap-result-value" class="text-4xl font-black text-emerald-400">$0 / month</h3>
                        <p class="text-lg text-slate-500">Estimated SNAP Benefit.</p>
                        <button class="text-blue-400 text-sm font-bold flex items-center gap-1 mx-auto pt-4 opacity-50 hover:opacity-100">
                            <i class="fas fa-caret-right"></i> Show Calculation
                        </button>
                    </div>
                </div>

                <div class="mt-12 p-4 bg-slate-800/30 rounded-xl border border-slate-800">
                    <p class="text-[10px] text-slate-500 italic leading-relaxed">
                        Note: As of Jan 1, 2026, Michigan continues to operate under "Broad Based Categorical Eligibility," effectively removing asset tests for SNAP and Healthy Michigan Plan (Medicaid) for the vast majority of households. Calculations reflect 2026 estimated Federal Poverty Levels (FPL).
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

        c.querySelectorAll('[data-label="hhSize"]').forEach(el => el.textContent = data.hhSize);
        c.querySelector('[data-label="healthIncome"]').textContent = math.toCurrency(data.healthIncome);
        c.querySelector('[data-label="snapIncome"]').textContent = math.toCurrency(data.snapIncome);

        if (data.isAutoSetMax) {
            const shelterSlider = c.querySelector('[data-benefit-id="shelterCosts"]');
            const maxShelter = data.isDisabled ? 5000 : 712; 
            if (parseFloat(shelterSlider.value) > maxShelter) {
                shelterSlider.value = maxShelter;
                data.shelterCosts = maxShelter;
            }
            shelterSlider.disabled = true;
            shelterSlider.classList.add('opacity-30');
        } else {
            c.querySelector('[data-benefit-id="shelterCosts"]').disabled = false;
            c.querySelector('[data-benefit-id="shelterCosts"]').classList.remove('opacity-30');
        }
        c.querySelector('[data-label="shelterCosts"]').textContent = math.toCurrency(data.shelterCosts);

        const fpl2026 = 16060 + (data.hhSize - 1) * 5440;
        const income = data.healthIncome;
        const ratio = income / fpl2026;

        const ball = c.querySelector('[data-benefit-id="healthIncome"]');
        if (ratio < 1.38) {
            document.getElementById('health-result-title').textContent = "Medicaid (Healthy MI)";
            document.getElementById('health-result-desc').textContent = "State-sponsored. $0 premiums.";
            document.getElementById('health-result-title').style.color = "#2563eb"; 
            ball.style.setProperty('--thumb-color', '#2563eb');
        } else if (ratio < 2.5) {
            document.getElementById('health-result-title').textContent = "Silver Marketplace Plan";
            document.getElementById('health-result-desc').textContent = "Tax credit subsidized. High CSR.";
            document.getElementById('health-result-title').style.color = "#a855f7"; 
            ball.style.setProperty('--thumb-color', '#a855f7');
        } else if (ratio < 4.0) {
            document.getElementById('health-result-title').textContent = "Marketplace (Bronze/Gold)";
            document.getElementById('health-result-desc').textContent = "Partial tax credits available.";
            document.getElementById('health-result-title').style.color = "#f97316"; 
            ball.style.setProperty('--thumb-color', '#f97316');
        } else {
            document.getElementById('health-result-title').textContent = "Private Insurance";
            document.getElementById('health-result-desc').textContent = "No subsidies. Full market rate.";
            document.getElementById('health-result-title').style.color = "#ef4444"; 
            ball.style.setProperty('--thumb-color', '#ef4444');
        }

        const snapFpl = 16060 + (data.hhSize - 1) * 5440;
        const snapGrossLimit = snapFpl * 2.0;
        const monthlyGross = data.snapIncome / 12;
        
        if (data.snapIncome > snapGrossLimit) {
            document.getElementById('snap-result-value').textContent = "$0 / month";
            document.getElementById('snap-result-value').classList.remove('text-emerald-400');
            document.getElementById('snap-result-value').classList.add('text-slate-500');
        } else {
            const stdDed = data.hhSize <= 3 ? 198 : (data.hhSize === 4 ? 208 : 244);
            const netBeforeShelter = Math.max(0, monthlyGross - stdDed);
            const shelterCost = data.shelterCosts;
            const excessShelter = Math.max(0, shelterCost - (netBeforeShelter / 2));
            const shelterDed = data.isDisabled ? excessShelter : Math.min(excessShelter, 712);
            const netIncome = Math.max(0, netBeforeShelter - shelterDed);
            
            const maxBenefit = 291 + (data.hhSize - 1) * 211;
            const snapBenefit = Math.max(0, maxBenefit - (netIncome * 0.3));
            document.getElementById('snap-result-value').textContent = `${math.toCurrency(snapBenefit)} / month`;
            document.getElementById('snap-result-value').classList.add('text-emerald-400');
            document.getElementById('snap-result-value').classList.remove('text-slate-500');
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
            isAutoSetMax: get('isAutoSetMax', 'bool'),
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
            else el.value = val;
        });
        benefits.refresh();
    }
};
