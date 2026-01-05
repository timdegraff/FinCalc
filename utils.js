
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const assetColors = {
    'Cash': '#f472b6', // Magenta/Pink
    'Taxable': '#10b981', // Emerald
    'Brokerage': '#10b981',
    'Pre-Tax (401k/IRA)': '#3b82f6', // Blue
    'Pre-Tax': '#3b82f6',
    'Post-Tax (Roth)': '#a855f7', // Purple
    'Post-Tax': '#a855f7',
    'Roth Basis': '#a855f7',
    'Roth Gains': '#9333ea',
    'Crypto': '#f59e0b', // Amber/Orange
    'Bitcoin': '#f59e0b',
    'Metals': '#eab308', // Yellow
    'Real Estate': '#6366f1', // Indigo
    'Other': '#94a3b8',
    'HELOC': '#ef4444',
    'Debt': '#dc2626',
    'HSA': '#2dd4bf', // Teal
    '529 Plan': '#fb7185' // Rose
};

export const stateTaxRates = {
    'Michigan': 0.0425,
    'Florida': 0.00,
    'Texas': 0.00,
    'California': 0.093,
    'New York': 0.0685,
    'Washington': 0.00,
    'Nevada': 0.00,
    'Tennessee': 0.00,
    'New Hampshire': 0.00,
    'South Dakota': 0.00,
    'Wyoming': 0.00,
    'Illinois': 0.0495,
    'Ohio': 0.0399,
    'Indiana': 0.0305,
    'Wisconsin': 0.053,
    'North Carolina': 0.045
};

export const math = {
    toCurrency: (value, isCompact = false) => {
        if (isNaN(value) || value === null) return '$0';
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', currency: 'USD',
            notation: isCompact ? 'compact' : 'standard',
            minimumFractionDigits: 0, maximumFractionDigits: isCompact ? 1 : 0
        }).format(value);
    },
    fromCurrency: (value) => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
    }
};

export const assumptions = {
    defaults: { 
        currentAge: 40, 
        retirementAge: 65, 
        ssStartAge: 67, 
        ssMonthly: 3000, 
        stockGrowth: 8, 
        cryptoGrowth: 10, 
        metalsGrowth: 6, 
        realEstateGrowth: 3, 
        inflation: 3, 
        filingStatus: 'Married Filing Jointly', 
        benefitCeiling: 1.38, 
        helocRate: 7,
        state: 'Michigan',
        workYearsAtRetirement: 35
    }
};

export const engine = {
    getLifeExpectancy: (age) => {
        const table = {
            30: 55.3, 31: 54.3, 32: 53.3, 33: 52.4, 34: 51.4, 35: 50.5, 36: 49.5, 37: 48.6, 38: 47.6, 39: 46.7,
            40: 45.7, 41: 44.8, 42: 43.8, 43: 42.9, 44: 41.9, 45: 41.0, 46: 40.0, 47: 39.1, 48: 38.1, 49: 37.2,
            50: 36.2, 51: 35.3, 52: 34.3, 53: 33.4, 54: 32.5, 55: 31.5, 56: 30.6, 57: 29.8, 58: 28.9, 59: 28.0,
            60: 27.1
        };
        const roundedAge = Math.floor(age);
        if (roundedAge < 30) return 55.3 + (30 - roundedAge);
        if (roundedAge > 60) return 27.1 - (roundedAge - 60);
        return table[roundedAge];
    },

    // IRS Uniform Lifetime Table (abbreviated for typical RMD ages)
    // Starts at age 72 usually, simplified for 75 start in our logic
    calculateRMD: (balance, age) => {
        if (age < 75 || balance <= 0) return 0;
        const distributionPeriod = {
            75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
            80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8,
            85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9,
            90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5,
            95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4
        };
        const factor = distributionPeriod[age] || 6.4;
        return balance / factor;
    },

    calculateMaxSepp: (balance, age) => {
        if (balance <= 0) return 0;
        const n = engine.getLifeExpectancy(age);
        const r = 0.05; // Reasonable interest rate assumption for 72(t)
        const numerator = r * Math.pow(1 + r, n);
        const denominator = Math.pow(1 + r, n) - 1;
        const annualPayment = balance * (numerator / denominator);
        return Math.floor(annualPayment);
    },

    calculateSocialSecurity: (baseMonthly, workYears, inflationFactor) => {
        const fullBenefit = baseMonthly * 12 * inflationFactor;
        const multiplier = Math.min(1, Math.max(0.1, workYears / 35));
        return fullBenefit * multiplier;
    },

    calculateTaxableSocialSecurity: (ssAmount, otherIncome, status = 'Single') => {
        if (ssAmount <= 0) return 0;
        // Provisional Income = MAGI + 50% of SS
        const provisionalIncome = otherIncome + (ssAmount * 0.5);
        let threshold1, threshold2;

        if (status === 'Single') {
            threshold1 = 25000;
            threshold2 = 34000;
        } else {
            threshold1 = 32000;
            threshold2 = 44000;
        }

        let taxableAmount = 0;

        if (provisionalIncome > threshold2) {
            taxableAmount = (0.5 * (threshold2 - threshold1)) + (0.85 * (provisionalIncome - threshold2));
        } else if (provisionalIncome > threshold1) {
            taxableAmount = 0.5 * (provisionalIncome - threshold1);
        }

        // Taxable portion cannot exceed 85% of total benefit
        return Math.min(taxableAmount, ssAmount * 0.85);
    },

    calculateTax: (taxableIncome, status = 'Single', state = 'Michigan', inflationFactor = 1) => {
        const stdDed = (status === 'Single' ? 15000 : 30000) * inflationFactor;
        let taxable = Math.max(0, taxableIncome - stdDed);
        let tax = 0;
        
        // 2026 Brackets (Base)
        const baseBrackets = status === 'Single' ? 
            [[11600, 0.10], [47150, 0.12], [100525, 0.22], [191950, 0.24]] :
            [[23200, 0.10], [94300, 0.12], [201050, 0.22], [383900, 0.24]];

        let prev = 0;
        for (const [limitBase, rate] of baseBrackets) {
            const limit = limitBase * inflationFactor;
            const range = Math.min(taxable, limit - prev);
            tax += range * rate;
            taxable -= range;
            prev = limit;
            if (taxable <= 0) break;
        }
        if (taxable > 0) tax += taxable * 0.32;

        const stateRate = stateTaxRates[state] || 0;
        tax += (taxableIncome * stateRate);

        return tax;
    },

    calculateSnapBenefit: (income, hhSize, shelterCosts, hasSUA, isDisabled, inflationFactor = 1) => {
        const monthlyGross = income / 12;
        const baseFpl = 16060 + (hhSize - 1) * 5650;
        const snapFpl = baseFpl * inflationFactor;
        const snapGrossLimit = snapFpl * 2.0; 
        if (monthlyGross > (snapGrossLimit / 12)) return 0;
        const stdDed = (hhSize <= 3 ? 205 : (hhSize === 4 ? 220 : (hhSize === 5 ? 255 : 295))) * inflationFactor;
        const adjIncome = Math.max(0, monthlyGross - stdDed);
        const suaAmt = (hasSUA ? 680 : 0) * inflationFactor; 
        const totalShelter = shelterCosts + suaAmt;
        const shelterThreshold = adjIncome / 2;
        const rawExcessShelter = Math.max(0, totalShelter - shelterThreshold);
        const shelterCap = 712 * inflationFactor; 
        const finalShelterDeduction = (isDisabled) ? rawExcessShelter : Math.min(rawExcessShelter, shelterCap);
        const netIncome = Math.max(0, adjIncome - finalShelterDeduction);
        const maxBenefit = (295 + (hhSize - 1) * 215) * inflationFactor;
        const estimatedBenefit = Math.max(0, maxBenefit - (netIncome * 0.3));
        return Math.floor(estimatedBenefit);
    },

    calculateSummaries: (data) => {
        const inv = data.investments || [];
        const re = data.realEstate || [];
        const oa = data.otherAssets || [];
        const helocs = data.helocs || [];
        const debts = data.debts || [];
        const inc = data.income || [];
        const budget = data.budget || { savings: [], expenses: [] };

        const totalAssets = inv.reduce((s, x) => s + math.fromCurrency(x.value), 0) +
                           re.reduce((s, x) => s + math.fromCurrency(x.value), 0) +
                           oa.reduce((s, x) => s + math.fromCurrency(x.value), 0);
                           
        const totalLiabilities = re.reduce((s, x) => s + math.fromCurrency(x.mortgage), 0) +
                                oa.reduce((s, x) => s + math.fromCurrency(x.loan), 0) +
                                helocs.reduce((s, h) => s + math.fromCurrency(h.balance), 0) +
                                debts.reduce((s, x) => s + math.fromCurrency(x.balance), 0);

        let total401kContribution = 0;
        let totalGrossIncome = 0; // This will be gross income after direct expenses, but before pre-tax deferrals
        
        inc.forEach(x => {
            let base = math.fromCurrency(x.amount);
            if (x.isMonthly) base *= 12;
            
            let annualDirectExpenses = math.fromCurrency(x.incomeExpenses);
            if (x.incomeExpensesMonthly) annualDirectExpenses *= 12; // Convert if monthly

            const bonus = base * (parseFloat(x.bonusPct) / 100 || 0);
            const personal401k = base * (parseFloat(x.contribution) / 100 || 0);
            total401kContribution += personal401k;
            
            // Total gross income for summary reflects net of direct expenses for each source
            totalGrossIncome += (base + bonus) - annualDirectExpenses; 
        });

        // Sum additional deductions like manual HSA savings from the budget tab
        const hsaSavings = budget.savings?.filter(s => s.type === 'HSA').reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0;

        const magiBase = totalGrossIncome - total401kContribution - hsaSavings;

        const manualSavingsSum = budget.savings?.filter(x => !x.isLocked).reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0;
        const totalAnnualSavings = manualSavingsSum + total401kContribution + hsaSavings; // Include HSA in total savings
        const totalAnnualBudget = budget.expenses?.reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0;

        return {
            netWorth: totalAssets - totalLiabilities,
            totalAssets, totalLiabilities, totalGrossIncome,
            magiBase,
            total401kContribution, totalAnnualSavings, totalAnnualBudget
        };
    }
};
