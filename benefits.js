
import { math, engine } from './utils.js';

export const benefits = {
    init: () => {
        const container = document.getElementById('benefits-module');
        if (!container) return;
        
        container.innerHTML = `
            <div class="max-w-7xl mx-auto space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                            <i class="fas fa-hand-holding-heart text-amber-400 text-xl"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-white uppercase tracking-tighter">Benefit Optimization</h2>
                            <p class="text-[10px] font-medium text-slate-500 uppercase tracking-widest">2026 Michigan Eligibility Modeler</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 bg-slate-900 p-2 rounded-xl border border-slate-700">
                         <span class="label-std text-slate-500 pl-2">Household Size</span>
                         <div class="flex items-center gap-2">
                             <input type="range" data-benefit-id="hhSize" min="1" max="10" step="1" value="1" class="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer">
                             <span data-label="hhSize" class="text-blue-400 font-black text-lg mono-numbers w-6 text-center">1</span>
                         </div>
                    </div>
                </div>

                <!-- Warning Banner -->
                <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 text-blue-400">
                    <i class="fas fa-info-circle text-lg"></i>
                    <p class="text-[10px] font-bold uppercase tracking-wide">Note: Income sliders below are for scenario modeling only. They do not affect the main Budget or Burndown calculations.</p>
                </div>

                <!-- Unified Income Slider -->
                <div class="card-container bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg p-6">
                    <div class="flex justify-between items-end mb-4">
                        <div class="space-y-1">
                             <label class="label-std text-slate-500">Test Annual MAGI (All Benefits)</label>
                             <div class="text-2xl font-black text-white mono-numbers" data-label="unifiedIncome">$0</div>
                        </div>
                        <input type="range" data-benefit-id="unifiedIncome" min="0" max="150000" step="500" value="40000" class="w-2/3 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500">
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Healthcare Card -->
                    <div class="card-container bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
                        <div class="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
                            <h3 class="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                                <i class="fas fa-hand-holding-medical text-blue-400"></i> <span class="uppercase">Healthcare Stratum</span>
                            </h3>
                            <span id="health-badge" class="px-2 py-1 bg-slate-700 text-white rounded text-[10px] font-bold uppercase">Standard</span>
                        </div>
                        <div class="p-6 space-y-6">
                            <!-- Visual Meter -->
                            <div class="relative h-4 bg-slate-950 rounded-full border border-slate-700 overflow-hidden flex">
                                <div class="w-[30%] bg-blue-500/60 h-full" title="Medicaid"></div>
                                <div class="w-[5%] bg-purple-500/60 h-full" title="HMP+"></div>
                                <div class="w-[20%] bg-slate-400/60 h-full" title="Silver"></div>
                                <div class="w-[30%] bg-amber-500/60 h-full" title="Gold"></div>
                                <div id="health-marker" class="absolute top-0 w-1 h-full bg-white shadow-[0_0_10px_white] transition-all duration-300"></div>
                            </div>

                            <table class="w-full text-xs border-t border-slate-700 pt-4">
                                <tbody class="mono-numbers text-slate-300">
                                    <tr class="border-b border-slate-700/50"><td class="py-2 text-slate-500 font-medium">Premium Estimate</td><td class="py-2 text-right font-bold" id="detail-premium">$0</td></tr>
                                    <tr class="border-b border-slate-700/50"><td class="py-2 text-slate-500 font-medium">Deductible</td><td class="py-2 text-right" id="detail-deductible">$0</td></tr>
                                    <tr class="border-b border-slate-700/50"><td class="py-2 text-slate-500 font-medium">Plan Type</td><td class="py-2 text-right text-teal-400" id="detail-benefit">Full</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- SNAP Card -->
                    <div class="card-container bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
                        <div class="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
                            <h3 class="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                                <i class="fas fa-utensils text-emerald-400"></i> <span class="uppercase">Food Assistance (SNAP)</span>
                            </h3>
                            <span id="snap-result-value" class="px-2 py-1 bg-slate-700 text-white rounded text-[10px] font-bold uppercase">$0 / mo</span>
                        </div>
                        <div class="p-6 space-y-6">
                            <div class="space-y-1">
                                <label class="label-std text-slate-500">Shelter / Utility Cost</label>
                                <div class="text-xl font-bold text-white mono-numbers" data-label="shelterCosts">$0</div>
                                <input type="range" data-benefit-id="shelterCosts" min="0" max="5000" step="50" value="700" class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500">
                            </div>

                            <div class="flex gap-4 border-t border-slate-700 pt-4">
                                <label class="flex items-center gap-2 cursor-pointer p-2 bg-slate-900 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors w-full justify-center">
                                    <input type="checkbox" data-benefit-id="hasSUA" checked class="w-3 h-3 accent-blue-500">
                                    <span class="text-[9px] font-bold uppercase text-slate-400">Max Deductions (SUA)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer p-2 bg-slate-900 rounded-lg border border-slate-700 hover:border-emerald-500 transition-colors w-full justify-center">
                                    <input type="checkbox" data-benefit-id="isDisabled" class="w-3 h-3 accent-emerald-500">
                                    <span class="text-[9px] font-bold uppercase text-slate-400">Disabled / Senior</span>
                                </label>
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
        if (!container) return;
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
        if (!c) return;

        c.querySelectorAll('[data-label="hhSize"]').forEach(el => el.textContent = data.hhSize);
        c.querySelector('[data-label="unifiedIncome"]').textContent = math.toCurrency(data.unifiedIncome);
        c.querySelector('[data-label="shelterCosts"]').textContent = math.toCurrency(data.shelterCosts);

        const fpl2026 = 16060 + (data.hhSize - 1) * 5650;
        const income = data.unifiedIncome;
        const ratio = income / fpl2026;
        const maxSliderVal = 150000;
        const pct = (val) => Math.min(100, (val / maxSliderVal) * 100);

        // Update Health Marker
        const marker = document.getElementById('health-marker');
        if (marker) marker.style.left = `${pct(income)}%`;

        const healthBadge = document.getElementById('health-badge');
        const setDetail = (prem, ded, ben) => {
            document.getElementById('detail-premium').textContent = prem;
            document.getElementById('detail-deductible').textContent = ded;
            document.getElementById('detail-benefit').textContent = ben;
        };

        if (ratio <= 1.38) {
            healthBadge.textContent = "Medicaid";
            healthBadge.className = "px-2 py-1 bg-emerald-500 text-white rounded text-[10px] font-bold uppercase";
            setDetail("$0", "$0", "100% Medical");
        } else if (ratio <= 1.60) {
            healthBadge.textContent = "HMP+";
            healthBadge.className = "px-2 py-1 bg-purple-500 text-white rounded text-[10px] font-bold uppercase";
            setDetail("$20", "Low", "Full Wellness");
        } else if (ratio <= 2.50) {
            healthBadge.textContent = "Silver CSR";
            healthBadge.className = "px-2 py-1 bg-blue-500 text-white rounded text-[10px] font-bold uppercase";
            setDetail("$60", "$800", "Subsidized AV");
        } else if (ratio <= 4.00) {
            healthBadge.textContent = "Gold";
            healthBadge.className = "px-2 py-1 bg-amber-500 text-white rounded text-[10px] font-bold uppercase";
            setDetail("$250", "$1500", "Market");
        } else {
            healthBadge.textContent = "Standard";
            healthBadge.className = "px-2 py-1 bg-slate-600 text-white rounded text-[10px] font-bold uppercase";
            setDetail("$450+", "High", "No Subsidy");
        }

        // SNAP Calc
        const estimatedBenefit = engine.calculateSnapBenefit(data.unifiedIncome, data.hhSize, data.shelterCosts, data.hasSUA, data.isDisabled);
        const snapResultEl = document.getElementById('snap-result-value');
        
        if (estimatedBenefit <= 0) {
            snapResultEl.textContent = "$0 / mo";
            snapResultEl.className = "px-2 py-1 bg-slate-700 text-slate-400 rounded text-[10px] font-bold uppercase";
        } else {
            snapResultEl.textContent = `${math.toCurrency(estimatedBenefit)} / mo`;
            snapResultEl.className = "px-2 py-1 bg-emerald-500 text-white rounded text-[10px] font-bold uppercase";
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
            unifiedIncome: get('unifiedIncome'),
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
            else el.value = val;
        });
        benefits.refresh();
    }
};
