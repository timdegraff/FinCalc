
import { math, engine } from './utils.js';

export const benefits = {
    init: () => {
        const container = document.getElementById('benefits-module');
        if (!container) return;
        
        container.innerHTML = `
            <div class="flex flex-col gap-8 p-1">
                <!-- IMMERSIVE HEADER SECTION -->
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
                    <div>
                        <h2 class="text-3xl font-black text-white uppercase tracking-tighter mb-1">
                            Benefit Optimization
                        </h2>
                        <p class="text-slate-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                            <i class="fas fa-map-marker-alt text-blue-400"></i> 2026 Michigan Standards & Eligibility Modeler
                        </p>
                    </div>
                    
                    <div class="flex items-center gap-6 bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-md">
                        <div class="flex flex-col gap-2 min-w-[160px]">
                             <label class="label-std text-slate-500 flex justify-between items-center mb-1">
                                Household Size <span data-label="hhSize" class="text-blue-400 font-black text-lg mono-numbers">1</span>
                             </label>
                             <input type="range" data-benefit-id="hhSize" min="1" max="10" step="1" value="1" class="benefit-slider">
                        </div>
                    </div>
                </div>

                <!-- MAIN DASHBOARD GRID -->
                <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    
                    <!-- LEFT COLUMN: ELIGIBILITY & HEALTH -->
                    <div class="xl:col-span-8 space-y-8">
                        
                        <!-- HEALTH ELIGIBILITY STRIP -->
                        <div class="card-container p-8 bg-slate-800/50 rounded-[2.5rem] border border-slate-700 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                            <div class="absolute top-0 right-0 p-6">
                                <i class="fas fa-hand-holding-medical text-5xl text-blue-500 opacity-5"></i>
                            </div>

                            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                                <div class="space-y-1">
                                    <span class="label-std text-blue-400 mb-2 block">Healthcare Stratum</span>
                                    <h3 id="benefit-result-title" class="text-4xl font-black text-white uppercase tracking-tighter leading-none">Healthy MI Plan</h3>
                                </div>
                                <div class="text-right bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 min-w-[180px]">
                                    <span class="label-std text-slate-500 block mb-1">Annual MAGI</span>
                                    <span data-label="healthIncome" class="text-3xl font-black text-teal-400 mono-numbers">$40,000</span>
                                </div>
                            </div>

                            <!-- ADVANCED PROGRESS TRACKER -->
                            <div class="relative pt-6 px-1">
                                <div id="health-slider-labels" class="flex justify-between text-[9px] uppercase font-black tracking-widest text-slate-500 mb-3">
                                    <span class="w-1/5 text-left text-blue-400">Medicaid</span>
                                    <span class="w-1/5 text-center text-purple-400">HMP+</span>
                                    <span class="w-1/5 text-center text-slate-300">Silver</span>
                                    <span class="w-1/5 text-center text-amber-500">Gold</span>
                                    <span class="w-1/5 text-right text-red-500">Standard</span>
                                </div>
                                
                                <div class="h-6 rounded-full bg-slate-950 border border-slate-800 p-1 flex w-full relative shadow-inner">
                                    <div id="seg-medicaid" class="h-full bg-blue-500 rounded-l-full opacity-60 transition-all duration-700"></div>
                                    <div id="seg-hmp" class="h-full bg-purple-500 opacity-60 transition-all duration-700"></div>
                                    <div id="seg-silver" class="h-full bg-slate-400 opacity-60 transition-all duration-700"></div>
                                    <div id="seg-gold" class="h-full bg-amber-500 opacity-60 transition-all duration-700"></div>
                                    <div id="seg-full" class="h-full bg-red-600 rounded-r-full opacity-60 transition-all duration-700"></div>
                                    
                                    <!-- Marker for current spot -->
                                    <div id="health-marker" class="absolute top-1/2 -translate-y-1/2 w-1.5 h-10 bg-white shadow-[0_0_20px_rgba(255,255,255,0.9)] z-20 transition-all duration-500 rounded-full" style="left: 40%"></div>
                                </div>

                                <input type="range" data-benefit-id="healthIncome" min="0" max="150000" step="500" value="40000" class="benefit-slider absolute top-6 left-0 w-full opacity-0 z-30 h-10 cursor-pointer">
                            </div>

                            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14 pt-10 border-t border-slate-700/50">
                                <div class="flex flex-col">
                                    <span class="label-std text-slate-500 mb-2">Premium</span>
                                    <span id="detail-premium" class="text-xl font-black text-white mono-numbers">$0 / mo</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="label-std text-slate-500 mb-2">Deductible</span>
                                    <span id="detail-deductible" class="text-xl font-black text-white mono-numbers">$0</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="label-std text-slate-500 mb-2">Coverage AV</span>
                                    <span id="detail-benefit" class="text-xl font-black text-teal-400 uppercase tracking-tighter">Full 100%</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="label-std text-slate-500 mb-2">Co-Pays</span>
                                    <span id="detail-feature" class="text-xl font-black text-blue-400 uppercase tracking-tighter">None</span>
                                </div>
                            </div>
                        </div>

                        <!-- SNAP ASSISTANCE CARD -->
                        <div class="card-container p-8 bg-slate-800/40 rounded-[2.5rem] border border-slate-700 shadow-2xl relative">
                            <div class="flex flex-col lg:flex-row justify-between gap-12">
                                <div class="flex-grow space-y-8">
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                            <i class="fas fa-utensils text-emerald-400 text-xl"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-2xl font-black text-white uppercase tracking-tighter">Food Assistance (SNAP)</h3>
                                            <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Bridge Card Modeler</p>
                                        </div>
                                    </div>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div class="space-y-3">
                                            <div class="flex justify-between items-center">
                                                <label class="label-std text-slate-500">Gross Monthly Income</label>
                                                <span data-label="snapIncome" class="text-sm font-black text-white mono-numbers">$13,000</span>
                                            </div>
                                            <input type="range" data-benefit-id="snapIncome" min="0" max="100000" step="500" value="13000" class="benefit-slider">
                                        </div>
                                        
                                        <div class="space-y-3">
                                            <div class="flex justify-between items-center">
                                                <label class="label-std text-slate-500">Shelter & Utility</label>
                                                <span data-label="shelterCosts" class="text-sm font-black text-white mono-numbers">$700</span>
                                            </div>
                                            <input type="range" data-benefit-id="shelterCosts" min="0" max="5000" step="50" value="700" class="benefit-slider">
                                        </div>
                                    </div>
                                    
                                    <div class="flex flex-wrap gap-4 pt-4 border-t border-slate-700/50">
                                        <label class="flex items-center gap-3 cursor-pointer bg-slate-900/60 px-5 py-3 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all group">
                                            <input type="checkbox" data-benefit-id="hasSUA" checked class="w-4 h-4 accent-blue-500">
                                            <span class="text-[10px] font-black uppercase text-slate-400 group-hover:text-white transition-colors">Apply MI SUA ($680)</span>
                                        </label>
                                        <label class="flex items-center gap-3 cursor-pointer bg-slate-900/60 px-5 py-3 rounded-2xl border border-slate-700 hover:border-emerald-500 transition-all group">
                                            <input type="checkbox" data-benefit-id="isDisabled" class="w-4 h-4 accent-emerald-500">
                                            <span class="text-[10px] font-black uppercase text-slate-400 group-hover:text-white transition-colors">Disabled / Senior Status</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="w-full lg:w-72 flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-[2rem] border border-slate-800 text-center shadow-inner relative overflow-hidden">
                                    <div class="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
                                    <span class="label-std text-emerald-500 mb-3 tracking-[0.2em]">Monthly Estimate</span>
                                    <span id="snap-result-value" class="text-6xl font-black text-emerald-400 mono-numbers tracking-tighter">$291</span>
                                    <span class="text-[10px] font-bold text-slate-600 uppercase mt-2">Maximum for HH Size</span>
                                    
                                    <div class="mt-8 w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                        <div id="snap-elig-bar" class="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style="width: 80%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: GUIDANCE & SUMMARY -->
                    <div class="xl:col-span-4 space-y-6">
                        <div class="card-container p-8 bg-slate-800 rounded-[2.5rem] border border-slate-700 h-full flex flex-col shadow-2xl">
                            <h4 class="label-std text-slate-500 mb-8 flex items-center gap-3">
                                <i class="fas fa-brain text-blue-400"></i> Strategic Guardrails
                            </h4>
                            
                            <div class="space-y-8 flex-grow">
                                <div class="p-6 bg-slate-900/60 rounded-3xl border-l-4 border-blue-500 shadow-xl transition-all hover:translate-x-1">
                                    <p class="text-xs text-white font-black uppercase tracking-tight mb-2">
                                        Medicaid Boundary (138% FPL)
                                    </p>
                                    <p class="text-[11px] text-slate-400 leading-relaxed font-medium">
                                        In Michigan, staying below <span class="text-blue-400 font-bold">$22,162</span> (Single) secures 100% subsidized care via the Healthy Michigan Plan. No asset test—just MAGI.
                                    </p>
                                </div>

                                <div class="p-6 bg-slate-900/60 rounded-3xl border-l-4 border-emerald-500 shadow-xl transition-all hover:translate-x-1">
                                    <p class="text-xs text-white font-black uppercase tracking-tight mb-2">
                                        SNAP Category Rules
                                    </p>
                                    <p class="text-[11px] text-slate-400 leading-relaxed font-medium">
                                        Michigan utilizes Broad-Based Categorical Eligibility (BBCE). Gross income limit is <span class="text-emerald-400 font-bold">200% FPL</span>. Household assets are NOT restricted.
                                    </p>
                                </div>
                                
                                <div class="p-6 bg-slate-900/60 rounded-3xl border-l-4 border-purple-500 shadow-xl transition-all hover:translate-x-1">
                                    <p class="text-xs text-white font-black uppercase tracking-tight mb-2">
                                        The Roth Ladder Bridge
                                    </p>
                                    <p class="text-[11px] text-slate-400 leading-relaxed font-medium">
                                        The optimal FIRE play: Top-off your MAGI using conversions until you hit exactly <span class="text-purple-400 font-bold">138% FPL</span>. This locks in Medicaid while generating tax-free future wealth.
                                    </p>
                                </div>
                            </div>

                            <div class="mt-12 pt-8 border-t border-slate-700/50 text-center">
                                <p class="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] leading-relaxed">
                                    FPL Model: 2026 Michigan
                                </p>
                                <p class="text-[8px] text-slate-700 mt-2 font-medium">
                                    Estimates for informational planning only. Official eligibility determined by MDHHS.
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

        document.getElementById('seg-medicaid').style.width = `${pct(medicaidLimit)}%`;
        document.getElementById('seg-hmp').style.width = `${pct(hmpLimit) - pct(medicaidLimit)}%`;
        document.getElementById('seg-silver').style.width = `${pct(silverLimit) - pct(hmpLimit)}%`;
        document.getElementById('seg-gold').style.width = `${pct(goldLimit) - pct(silverLimit)}%`;
        document.getElementById('seg-full').style.width = `${100 - pct(goldLimit)}%`;

        document.getElementById('health-marker').style.left = `${pct(income)}%`;

        const healthTitle = document.getElementById('benefit-result-title');
        const setDetail = (prem, ded, ben, feat) => {
            document.getElementById('detail-premium').textContent = prem;
            document.getElementById('detail-deductible').textContent = ded;
            document.getElementById('detail-benefit').textContent = ben;
            document.getElementById('detail-feature').textContent = feat;
        };

        if (ratio <= 1.38) {
            healthTitle.textContent = "Medicaid (Healthy MI)";
            healthTitle.className = "text-4xl font-black text-blue-400 uppercase tracking-tighter leading-none";
            setDetail("$0 / mo", "$0", "100% Medical", "No Co-pays");
        } else if (ratio <= 1.60) {
            healthTitle.textContent = "Healthy MI Plan Plus";
            healthTitle.className = "text-4xl font-black text-purple-400 uppercase tracking-tighter leading-none";
            setDetail("$0 - $25 / mo", "Low", "Full Wellness", "State Incentives");
        } else if (ratio <= 2.50) {
            healthTitle.textContent = "Silver Marketplace";
            healthTitle.className = "text-4xl font-black text-slate-300 uppercase tracking-tighter leading-none";
            setDetail("$40 - $120 / mo", "$750 - $1,500", "CSR Subsidized", "High AV Tier");
        } else if (ratio <= 4.00) {
            healthTitle.textContent = "Gold Marketplace";
            healthTitle.className = "text-4xl font-black text-amber-500 uppercase tracking-tighter leading-none";
            setDetail("$150 - $350 / mo", "$500 - $1,000", "High Coverage", "Predictable Cost");
        } else {
            healthTitle.textContent = "Standard Marketplace";
            healthTitle.className = "text-4xl font-black text-red-500 uppercase tracking-tighter leading-none";
            setDetail("$450+ / mo", "Market Variable", "Full Choice", "No Subsidy");
        }

        const estimatedBenefit = engine.calculateSnapBenefit(data.snapIncome, data.hhSize, data.shelterCosts, data.hasSUA, data.isDisabled);
        const snapResultEl = document.getElementById('snap-result-value');
        const snapBar = document.getElementById('snap-elig-bar');

        if (estimatedBenefit <= 0) {
            snapResultEl.textContent = "$0.00";
            snapResultEl.className = "text-6xl font-black text-slate-700 mono-numbers tracking-tighter";
            snapBar.style.width = "0%";
        } else {
            snapResultEl.textContent = `${math.toCurrency(estimatedBenefit)}`;
            snapResultEl.className = "text-6xl font-black text-emerald-400 mono-numbers tracking-tighter";
            const maxSnap = 295 + (data.hhSize - 1) * 215;
            snapBar.style.width = `${Math.min(100, (estimatedBenefit / maxSnap) * 100)}%`;
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
