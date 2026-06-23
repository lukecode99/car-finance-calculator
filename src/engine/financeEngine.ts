import { CarInputs, FinanceResult, YearlyBreakdown, DEPRECIATION_PRESETS } from '../types';
import { colors } from '../theme';

function n(s: string): number {
  const v = parseFloat((s || '').replace(/,/g, ''));
  return isNaN(v) ? 0 : v;
}

function getDepreciationRates(inputs: CarInputs): { y1: number; pa: number } {
  if (inputs.depreciationPreset === 'custom') {
    return { y1: n(inputs.customDepreciationY1) / 100, pa: n(inputs.customDepreciationPA) / 100 };
  }
  const p = DEPRECIATION_PRESETS[inputs.depreciationPreset];
  return { y1: p.y1 / 100, pa: p.pa / 100 };
}

function carValueAtYear(price: number, year: number, y1Rate: number, paRate: number): number {
  if (year === 0) return price;
  let val = price * (1 - y1Rate);
  for (let i = 1; i < year; i++) val *= (1 - paRate);
  return Math.max(val, 0);
}

function monthlyPayment(principal: number, apr: number, months: number): number {
  if (apr === 0) return principal / months;
  const r = apr / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export function getBikRate(co2: number): number {
  if (co2 === 0) return 3;       // EV (2025/26)
  if (co2 <= 50) return 3;       // PHEV (simplified: ignores electric range)
  if (co2 <= 54) return 15;
  if (co2 <= 59) return 16;
  if (co2 <= 64) return 17;
  if (co2 <= 69) return 18;
  if (co2 <= 74) return 19;
  if (co2 <= 79) return 20;
  if (co2 <= 84) return 21;
  if (co2 <= 89) return 22;
  if (co2 <= 94) return 23;
  if (co2 <= 99) return 24;
  if (co2 <= 104) return 25;
  if (co2 <= 109) return 26;
  if (co2 <= 114) return 27;
  if (co2 <= 119) return 28;
  if (co2 <= 124) return 29;
  if (co2 <= 129) return 30;
  if (co2 <= 134) return 31;
  if (co2 <= 139) return 32;
  if (co2 <= 144) return 33;
  if (co2 <= 149) return 34;
  if (co2 <= 154) return 35;
  if (co2 <= 159) return 36;
  return 37;
}

function calcPCP(inputs: CarInputs, termYears: number): FinanceResult | null {
  const price = n(inputs.carPrice);
  const deposit = n(inputs.pcpDeposit);
  const apr = n(inputs.pcpApr);
  const balloon = n(inputs.balloon);
  const insurance = n(inputs.insurance);
  const roadTax = n(inputs.roadTax);
  const maintenance = n(inputs.maintenance);
  const tyresPerYear = n(inputs.tyresPerYear);
  const sellingCost = n(inputs.sellingCost);
  const mileage = n(inputs.annualMileage);
  const mileageIncluded = n(inputs.pcpMileageIncluded);
  const excessPpm = n(inputs.pcpExcessPpm);

  const financed = price - deposit - balloon;
  if (financed < 0) return null;

  const months = termYears * 12;
  const monthly = monthlyPayment(financed, apr, months);
  const totalFinancePayments = monthly * months + deposit + balloon;
  const totalInterest = totalFinancePayments - price;

  const { y1, pa } = getDepreciationRates(inputs);
  const finalValue = carValueAtYear(price, termYears, y1, pa);
  const totalDepreciation = price - finalValue;

  const annualRunning = insurance + roadTax + maintenance + tyresPerYear;
  const totalRunning = annualRunning * termYears;

  // Excess mileage cost
  const excessMilesPerYear = Math.max(0, mileage - mileageIncluded);
  const excessMileageCost = excessMilesPerYear * termYears * (excessPpm / 100);

  const yearly: YearlyBreakdown[] = [];
  let cumulative = deposit;
  for (let yr = 1; yr <= termYears; yr++) {
    const valStart = carValueAtYear(price, yr - 1, y1, pa);
    const valEnd = carValueAtYear(price, yr, y1, pa);
    const dep = valStart - valEnd;
    const fin = monthly * 12;
    const running = annualRunning;
    const yearTotal = dep + fin + running;
    cumulative += yearTotal;
    yearly.push({ year: yr, carValue: valEnd, depreciation: dep, financePayments: fin, runningCosts: running, totalCost: yearTotal, cumulativeTotal: cumulative });
  }

  const grandTotal = totalInterest + totalDepreciation + totalRunning + sellingCost + excessMileageCost;
  const totalMiles = mileage * termYears;

  return {
    type: 'pcp', label: 'PCP', color: colors.pcp,
    monthlyPayment: monthly, totalFinanceCost: totalInterest,
    totalRunningCosts: totalRunning, totalDepreciation, sellingCost,
    grandTotal, excessMileageCost,
    costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months,
    yearlyBreakdown: yearly,
    provider: inputs.pcpProvider || undefined,
    providerUrl: inputs.pcpProviderUrl || undefined,
  };
}

function calcHP(inputs: CarInputs, termYears: number): FinanceResult | null {
  const price = n(inputs.carPrice);
  const deposit = n(inputs.hpDeposit);
  const apr = n(inputs.hpApr);
  const insurance = n(inputs.insurance);
  const roadTax = n(inputs.roadTax);
  const maintenance = n(inputs.maintenance);
  const tyresPerYear = n(inputs.tyresPerYear);
  const sellingCost = n(inputs.sellingCost);
  const mileage = n(inputs.annualMileage);

  const financed = price - deposit;
  if (financed < 0) return null;

  const months = termYears * 12;
  const monthly = monthlyPayment(financed, apr, months);
  const totalPaid = monthly * months + deposit;
  const totalInterest = totalPaid - price;

  const { y1, pa } = getDepreciationRates(inputs);
  const finalValue = carValueAtYear(price, termYears, y1, pa);
  const totalDepreciation = price - finalValue;

  const annualRunning = insurance + roadTax + maintenance + tyresPerYear;
  const totalRunning = annualRunning * termYears;

  const yearly: YearlyBreakdown[] = [];
  let cumulative = deposit;
  for (let yr = 1; yr <= termYears; yr++) {
    const valStart = carValueAtYear(price, yr - 1, y1, pa);
    const valEnd = carValueAtYear(price, yr, y1, pa);
    const dep = valStart - valEnd;
    const fin = monthly * 12;
    const running = annualRunning;
    cumulative += dep + fin + running;
    yearly.push({ year: yr, carValue: valEnd, depreciation: dep, financePayments: fin, runningCosts: running, totalCost: dep + fin + running, cumulativeTotal: cumulative });
  }

  const grandTotal = totalInterest + totalDepreciation + totalRunning + sellingCost;
  const totalMiles = mileage * termYears;

  return {
    type: 'hp', label: 'HP', color: colors.hp,
    monthlyPayment: monthly, totalFinanceCost: totalInterest,
    totalRunningCosts: totalRunning, totalDepreciation, sellingCost,
    grandTotal, costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months, yearlyBreakdown: yearly,
    provider: inputs.hpProvider || undefined,
    providerUrl: inputs.hpProviderUrl || undefined,
  };
}

function calcPCH(inputs: CarInputs, termYears: number): FinanceResult | null {
  const pchDeposit = n(inputs.pchDeposit);
  const pchMonthly = n(inputs.pchMonthly);
  const insurance = n(inputs.insurance);
  const roadTax = n(inputs.roadTax);
  const maintenance = n(inputs.maintenance);
  const tyresPerYear = n(inputs.tyresPerYear);
  const mileage = n(inputs.annualMileage);
  const mileageIncluded = n(inputs.pchMileageIncluded);
  const excessPpm = n(inputs.pchExcessPpm);

  const months = termYears * 12;
  const totalLease = pchDeposit + pchMonthly * months;

  const annualRunning = insurance + roadTax + maintenance + tyresPerYear;
  const totalRunning = annualRunning * termYears;

  const excessMilesPerYear = Math.max(0, mileage - mileageIncluded);
  const excessMileageCost = excessMilesPerYear * termYears * (excessPpm / 100);

  const yearly: YearlyBreakdown[] = [];
  let cumulative = pchDeposit;
  for (let yr = 1; yr <= termYears; yr++) {
    const fin = pchMonthly * 12;
    const running = annualRunning;
    cumulative += fin + running;
    yearly.push({ year: yr, carValue: 0, depreciation: 0, financePayments: fin, runningCosts: running, totalCost: fin + running, cumulativeTotal: cumulative + (yr === 1 ? pchDeposit : 0) });
  }

  const grandTotal = totalLease + totalRunning + excessMileageCost;
  const totalMiles = mileage * termYears;

  return {
    type: 'pch', label: 'Contract Hire', color: colors.pch,
    monthlyPayment: pchMonthly, totalFinanceCost: totalLease,
    totalRunningCosts: totalRunning, totalDepreciation: 0, sellingCost: 0,
    grandTotal, excessMileageCost,
    costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months, yearlyBreakdown: yearly,
    provider: inputs.pchProvider || undefined,
    providerUrl: inputs.pchProviderUrl || undefined,
  };
}

function calcLoan(inputs: CarInputs, termYears: number): FinanceResult | null {
  const price = n(inputs.carPrice);
  const loanAmount = n(inputs.loanAmount);
  const apr = n(inputs.loanApr);
  const insurance = n(inputs.insurance);
  const roadTax = n(inputs.roadTax);
  const maintenance = n(inputs.maintenance);
  const tyresPerYear = n(inputs.tyresPerYear);
  const sellingCost = n(inputs.sellingCost);
  const mileage = n(inputs.annualMileage);

  if (loanAmount <= 0) return null;

  const months = termYears * 12;
  const monthly = monthlyPayment(loanAmount, apr, months);
  const totalPaid = monthly * months;
  const totalInterest = totalPaid - loanAmount;

  const deposit = Math.max(0, price - loanAmount);

  const { y1, pa } = getDepreciationRates(inputs);
  const finalValue = carValueAtYear(price, termYears, y1, pa);
  const totalDepreciation = price - finalValue;

  const annualRunning = insurance + roadTax + maintenance + tyresPerYear;
  const totalRunning = annualRunning * termYears;

  const yearly: YearlyBreakdown[] = [];
  let cumulative = deposit;
  for (let yr = 1; yr <= termYears; yr++) {
    const valStart = carValueAtYear(price, yr - 1, y1, pa);
    const valEnd = carValueAtYear(price, yr, y1, pa);
    const dep = valStart - valEnd;
    const fin = monthly * 12;
    const running = annualRunning;
    cumulative += dep + fin + running;
    yearly.push({ year: yr, carValue: valEnd, depreciation: dep, financePayments: fin, runningCosts: running, totalCost: dep + fin + running, cumulativeTotal: cumulative });
  }

  const grandTotal = totalInterest + totalDepreciation + totalRunning + sellingCost;
  const totalMiles = mileage * termYears;

  return {
    type: 'loan', label: 'Bank Loan', color: colors.loan,
    monthlyPayment: monthly, totalFinanceCost: totalInterest,
    totalRunningCosts: totalRunning, totalDepreciation, sellingCost,
    grandTotal, costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months, yearlyBreakdown: yearly,
    provider: inputs.loanProvider || undefined,
    providerUrl: inputs.loanProviderUrl || undefined,
  };
}

function calcSalary(inputs: CarInputs, termYears: number): FinanceResult | null {
  const ssP11d = n(inputs.ssP11d);
  const ssCo2 = n(inputs.ssCo2);
  const ssMonthlyGross = n(inputs.ssMonthly);
  const ssDeposit = n(inputs.ssDeposit);
  const taxRate = parseInt(inputs.ssTaxRate) / 100;
  // NI class 1: 8% for basic rate taxpayers, 2% for higher rate (above £50,270)
  const niRate = taxRate <= 0.20 ? 0.08 : 0.02;
  const bikPct = getBikRate(ssCo2);
  const bikRate = bikPct / 100;
  const mileage = n(inputs.annualMileage);

  if (ssMonthlyGross <= 0) return null;

  const months = termYears * 12;

  // Tax + NI saving on monthly salary sacrifice
  const monthlySaving = ssMonthlyGross * (taxRate + niRate);
  const monthlyNetSacrifice = ssMonthlyGross - monthlySaving;

  // BIK tax cost: P11D × BIK% × income tax rate ÷ 12
  const monthlyBikTax = ssP11d * bikRate * taxRate / 12;

  const effectiveMonthly = monthlyNetSacrifice + monthlyBikTax;

  // Running costs — items bundled in scheme are excluded
  const insurance = inputs.ssInsuranceIncluded ? 0 : n(inputs.insurance);
  const maintenance = inputs.ssServiceIncluded ? 0 : n(inputs.maintenance);
  const tyres = inputs.ssTyresIncluded ? 0 : n(inputs.tyresPerYear);
  const annualRunning = insurance + n(inputs.roadTax) + maintenance + tyres;
  const totalRunning = annualRunning * termYears;

  // Upfront deposit net of tax/NI
  const netDeposit = ssDeposit * (1 - taxRate - niRate);

  // Total net cost of sacrifice + BIK tax over term
  const totalNetSacrifice = netDeposit + effectiveMonthly * months;

  const grandTotal = totalNetSacrifice + totalRunning;
  const totalMiles = mileage * termYears;

  const yearly: YearlyBreakdown[] = [];
  let cumulative = netDeposit;
  for (let yr = 1; yr <= termYears; yr++) {
    const fin = effectiveMonthly * 12;
    const running = annualRunning;
    cumulative += fin + running;
    yearly.push({ year: yr, carValue: 0, depreciation: 0, financePayments: fin, runningCosts: running, totalCost: fin + running, cumulativeTotal: cumulative });
  }

  return {
    type: 'salary', label: 'Salary Sacrifice', color: colors.salary,
    monthlyPayment: effectiveMonthly,
    totalFinanceCost: totalNetSacrifice,
    totalRunningCosts: totalRunning, totalDepreciation: 0, sellingCost: 0,
    grandTotal, costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months, yearlyBreakdown: yearly,
    bikRate: bikPct,
    monthlyBikTax, monthlyNetSacrifice,
    provider: inputs.ssProvider || undefined,
    providerUrl: inputs.ssProviderUrl || undefined,
  };
}

export function calcAll(inputs: CarInputs): FinanceResult[] {
  const years = Math.min(5, Math.max(1, Math.round(n(inputs.termYears))));
  const results: FinanceResult[] = [];

  if (inputs.enablePcp) { const r = calcPCP(inputs, years); if (r) results.push(r); }
  if (inputs.enableHp)  { const r = calcHP(inputs, years);  if (r) results.push(r); }
  if (inputs.enablePch) { const r = calcPCH(inputs, years); if (r) results.push(r); }
  if (inputs.enableLoan){ const r = calcLoan(inputs, years);if (r) results.push(r); }
  if (inputs.enableSalary){ const r = calcSalary(inputs, years); if (r) results.push(r); }

  return results;
}
