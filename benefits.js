
import { math } from './utils.js';

export const benefits = {
    init: () => {
        const container = document.getElementById('benefits-module');
        if (!container) return;
        
        container.innerHTML = `
            <div class="p-8 pb-4">
                <h2 class="text-2xl font-bold text-white mb-6">Benefits Calculator (Michigan 2026)</h2>
                <div class="flex bg-slate-800/80 p-1.5 rounded-xl mb-12">
                    <button data-subtab="health" class="subtab-btn active flex-1 py-3 font-bold rounded-lg transition-all">Health Coverage</button>
                    <button data-subtab="snap" class="subtab-btn flex-1 py-3 font-bold rounded-lg transition-all">SNAP (Food)</button>
                </div>

                <div id="benefit-tab-health" class="benefit-subtab-content space-y-12">
                    <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400">Household Size:</span>
                            <span id="label-hhSize" class="text-xl font-bold text-white">1</span>
                        </div>
                        <input type="range" data-benefit-id="hhSize" min="1" max="10" step="1" value="1" class="benefit-slider">
                    </div>

                    <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400">Annual Income:</span>
                            <span id="label-annualIncome" class="text-xl font-bold text-white">$40,000</span>
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
                            <input type="range" data-benefit-id="annualIncome" min="0" max="150000" step="500" value="40000" class="benefit-slider absolute top-6 left-0">
                        </div>
                    </div>

                    <label class="flex items-center gap-3 cursor-pointer group pt-4">
                        <div class="w-6 h-6 border-2 border-slate-700 rounded flex items-center justify-center group-hover:border-blue-500 transition-all">
                             <input type="checkbox" data-benefit-id="isPregnant" class="hidden peer">
                             <div class="w-3 h-3 bg-blue-500 rounded-sm opacity-0 peer-checked:opacity-100 transition-all"></div>
                        </div>
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
                            <span class="text-lg text-slate-400">Annual Gross Income:</span>
                            <span id="label-annualGross" class="text-xl font-bold text-white">$13,000</span>
                        </div>
                        <input type="range" data-benefit-id="annualIncome" min="0" max="150000" step="500" value="13000" class="benefit-slider">
                        <p class="text-right text-xs text-pink-500 font-bold opacity-70">Max Allowed: $86,300/yr</p>
                    </div>

                    <div class="space-y-4">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-lg text-slate-400">Monthly Shelter & Utility Costs:</span>
                            <span id="label-shelterCosts" class="text-xl font-bold text-white">$700</span>
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
                        <h3 id="snap-result-value" class="text-4xl font-black text-emerald-400">$1215 / month</h3>
                        <p class="text-lg text-slate-500">Estimated SNAP Benefit.</p>
                        <button class="text-blue-400 text-sm font-bold flex items-center gap-1 mx-auto pt-4 opacity-50 hover:opacity-100">
                            <i class="fas fa-caret-right"></i> Show Calculation
                        </button>
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
                container.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                container.querySelectorAll('.benefit-subtab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(`benefit-tab-${btn.dataset.subtab}`).classList.remove('hidden');
            };
        });

        container.querySelectorAll('input').forEach(input => {
            input.oninput = () => {
                benefits.refresh();
                window.debouncedAutoSave();
            };
        });
    },

    refresh: () => {
        const data = benefits.scrape();
        
        // Update Labels
        document.getElementById('label-hhSize').textContent = data.hhSize;
        document.getElementById('label-annualIncome').textContent = math.toCurrency(data.annualIncome);
        document.getElementById('label-annualGross').textContent = math.toCurrency(data.annualIncome);
        document.getElementById('label-shelterCosts').textContent = math.toCurrency(data.shelterCosts);

        // Logic (MI Healthy MI Plan approx for 2026)
        const fpl2026 = 16000 + (data.hhSize - 1) * 5500;
        const income = data.annualIncome;

        if (income < fpl2026 * 1.38) {
            document.getElementById('health-result-title').textContent = "Healthy Michigan Plan (Platinum)";
            document.getElementById('health-result-desc').textContent = "State-sponsored. $0 premiums.";
            document.getElementById('health-result-title').style.color = "#a855f7"; // Purple
        } else if (income < fpl2026 * 2.5) {
            document.getElementById('health-result-title').textContent = "Silver Marketplace Plan";
            document.getElementById('health-result-desc').textContent = "Heavy subsidies. Estimated $50-$120/mo.";
            document.getElementById('health-result-title').style.color = "#3b82f6"; // Blue
        } else {
            document.getElementById('health-result-title').textContent = "Private Insurance";
            document.getElementById('health-result-desc').textContent = "No subsidies. Full market rate premiums.";
            document.getElementById('health-result-title').style.color = "#f97316"; // Orange
        }

        // SNAP Estimate Logic
        const maxSnap = 291 + (data.hhSize - 1) * 211;
        const monthlyIncome = income / 12;
        const netIncome = Math.max(0, monthlyIncome - (data.shelterCosts * 0.5)); // Very rough simplification
        const snapBenefit = Math.max(0, maxSnap - (netIncome * 0.3));
        document.getElementById('snap-result-value').textContent = `${math.toCurrency(snapBenefit)} / month`;
    },

    scrape: () => {
        const c = document.getElementById('benefits-module');
        const get = (id, type) => {
            const el = c.querySelector(`[data-benefit-id="${id}"]`);
            if (!el) return 0;
            if (type === 'bool') return el.checked;
            return parseFloat(el.value) || 0;
        };
        return {
            hhSize: get('hhSize'),
            annualIncome: get('annualIncome'),
            isPregnant: get('isPregnant', 'bool'),
            shelterCosts: get('shelterCosts'),
            isAutoSetMax: get('isAutoSetMax', 'bool'),
            isDisabled: get('isDisabled', 'bool')
        };
    },

    load: (data) => {
        if (!data) return;
        const c = document.getElementById('benefits-module');
        Object.entries(data).forEach(([key, val]) => {
            const el = c.querySelector(`[data-benefit-id="${key}"]`);
            if (!el) return;
            if (el.type === 'checkbox') el.checked = val;
            else el.value = val;
        });
        benefits.refresh();
    }
};
