import { CarInputs, FinanceResult, FinanceType, YearlyBreakdown, DEPRECIATION_PRESETS } from '../types';
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

function monthlyHP(principal: number, apr: number, months: number): number {
  if (apr === 0) return principal / months;
  const r = apr / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function calcPCP(inputs: CarInputs, termYears: number): FinanceResult | null {
  const price = n(inputs.carPrice);
  const deposit = n(inputs.deposit);
  const apr = n(inputs.apr);
  const balloon = n(inputs.balloon);
  const insurance = n(inputs.insurance);
  const roadTax = n(inputs.roadTax);
  const maintenance = n(inputs.maintenance);
  const tyresPerYear = n(inputs.tyresPerYear);
  const sellingCost = n(inputs.sellingCost);
  const mileage = n(inputs.annualMileage);

  const financed = price - deposit - balloon;
  if (financed < 0) return null;

  const months = termYears * 12;
  const monthly = monthlyHP(financed, apr, months);
  const totalFinancePayments = monthly * months + deposit + balloon;
  const totalInterest = totalFinancePayments - price;

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
    const yearTotal = dep + fin + running;
    cumulative += yearTotal;
    yearly.push({ year: yr, carValue: valEnd, depreciation: dep, financePayments: fin, runningCosts: running, totalCost: yearTotal, cumulativeTotal: cumulative });
  }

  const grandTotal = totalInterest + totalDepreciation + totalRunning + sellingCost;
  const totalMiles = mileage * termYears;

  return {
    type: 'pcp',
    label: 'PCP',
    color: colors.pcp,
    monthlyPayment: monthly,
    totalFinanceCost: totalInterest,
    totalRunningCosts: totalRunning,
    totalDepreciation,
    sellingCost,
    grandTotal,
    costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months,
    yearlyBreakdown: yearly,
  };
}

function calcHP(inputs: CarInputs, termYears: number): FinanceResult | null {
  const price = n(inputs.carPrice);
  const deposit = n(inputs.deposit);
  const apr = n(inputs.apr);
  const insurance = n(inputs.insurance);
  const roadTax = n(inputs.roadTax);
  const maintenance = n(inputs.maintenance);
  const tyresPerYear = n(inputs.tyresPerYear);
  const sellingCost = n(inputs.sellingCost);
  const mileage = n(inputs.annualMileage);

  const financed = price - deposit;
  if (financed < 0) return null;

  const months = termYears * 12;
  const monthly = monthlyHP(financed, apr, months);
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
    type: 'hp',
    label: 'HP',
    color: colors.hp,
    monthlyPayment: monthly,
    totalFinanceCost: totalInterest,
    totalRunningCosts: totalRunning,
    totalDepreciation,
    sellingCost,
    grandTotal,
    costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months,
    yearlyBreakdown: yearly,
  };
}

function calcPCH(inputs: CarInputs, termYears: number): FinanceResult | null {
  const price = n(inputs.carPrice);
  const pchDeposit = n(inputs.pchDeposit);
  const pchMonthly = n(inputs.pchMonthly);
  const insurance = n(inputs.insurance);
  const roadTax = n(inputs.roadTax);
  const maintenance = n(inputs.maintenance);
  const tyresPerYear = n(inputs.tyresPerYear);
  const mileage = n(inputs.annualMileage);

  const months = termYears * 12;
  const totalLease = pchDeposit + pchMonthly * months;

  const annualRunning = insurance + roadTax + maintenance + tyresPerYear;
  const totalRunning = annualRunning * termYears;

  // PCH: no depreciation cost, no selling cost — you return the car
  const yearly: YearlyBreakdown[] = [];
  let cumulative = pchDeposit;
  for (let yr = 1; yr <= termYears; yr++) {
    const fin = pchMonthly * 12;
    const running = annualRunning;
    cumulative += fin + running;
    yearly.push({ year: yr, carValue: 0, depreciation: 0, financePayments: fin, runningCosts: running, totalCost: fin + running, cumulativeTotal: cumulative + (yr === 1 ? pchDeposit : 0) });
  }

  const grandTotal = totalLease + totalRunning;
  const totalMiles = mileage * termYears;

  return {
    type: 'pch',
    label: 'Contract Hire',
    color: colors.pch,
    monthlyPayment: pchMonthly,
    totalFinanceCost: totalLease,
    totalRunningCosts: totalRunning,
    totalDepreciation: 0,
    sellingCost: 0,
    grandTotal,
    costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months,
    yearlyBreakdown: yearly,
  };
}

export function calcAll(inputs: CarInputs): FinanceResult[] {
  const years = Math.min(5, Math.max(1, Math.round(n(inputs.termYears))));
  const results: FinanceResult[] = [];

  const pcp = calcPCP(inputs, years);
  const hp = calcHP(inputs, years);
  const pch = calcPCH(inputs, years);

  if (pcp) results.push(pcp);
  if (hp) results.push(hp);
  if (pch) results.push(pch);

  return results;
}
