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

// If a custom residual value is entered, override the final car value at term end
function getCustomResidual(inputs: CarInputs): number | null {
  const rv = n(inputs.customResidualValue ?? '');
  return rv > 0 ? rv : null;
}

function carValueAtYear(price: number, year: number, y1Rate: number, paRate: number): number {
  if (year === 0) return price;
  let val = price * (1 - y1Rate);
  for (let i = 1; i < year; i++) val *= (1 - paRate);
  return Math.max(val, 0);
}

// UK APR is an effective annual rate, so the monthly rate is the 12th root,
// not APR/12.
function monthlyRate(apr: number): number {
  return Math.pow(1 + apr / 100, 1 / 12) - 1;
}

// Annual fuel/electricity cost from mileage. Opt-in — returns 0 until an
// economy figure (mpg or mi/kWh) is entered. 1 imperial gallon = 4.546 L.
export function getAnnualFuel(inputs: CarInputs): number {
  const miles = n(inputs.annualMileage);
  if (inputs.fuelType === 'ev') {
    const miPerKwh = n(inputs.miPerKwh);
    if (miPerKwh <= 0) return 0;
    return (miles / miPerKwh) * (n(inputs.pencePerKwh) / 100);
  }
  const mpg = n(inputs.mpg);
  if (mpg <= 0) return 0;
  return (miles / mpg) * 4.546 * (n(inputs.fuelPencePerLitre) / 100);
}

function monthlyPayment(principal: number, apr: number, months: number): number {
  if (apr === 0) return principal / months;
  const r = monthlyRate(apr);
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

// PCP: the balloon (GMFV) is deferred to the end of the term and accrues
// interest for the whole agreement — it must not be subtracted from the
// principal up front. Amortise principal minus the *present value* of the
// balloon.
function monthlyPaymentWithBalloon(principal: number, balloon: number, apr: number, months: number): number {
  if (apr === 0) return (principal - balloon) / months;
  const r = monthlyRate(apr);
  const amortised = principal - balloon / Math.pow(1 + r, months);
  return (amortised * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
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
  const insurance = inputs.pcpInsuranceIncluded ? 0 : n(inputs.insurance);
  const roadTax = inputs.pcpRoadTaxIncluded ? 0 : n(inputs.roadTax);
  const maintenance = inputs.pcpServiceIncluded ? 0 : n(inputs.maintenance);
  const tyresPerYear = inputs.pcpTyresIncluded ? 0 : n(inputs.tyresPerYear);
  const sellingCost = n(inputs.sellingCost);
  const mileage = n(inputs.annualMileage);
  const mileageIncluded = n(inputs.pcpMileageIncluded);
  const excessPpm = n(inputs.pcpExcessPpm);
  const adminFee = n(inputs.adminFee);
  const otpFee = n(inputs.otpFee);
  const contribution = n(inputs.dealerContribution);
  const partExchange = n(inputs.partExchange);

  // Dealer contribution and part-exchange both reduce the amount financed;
  // only the part-exchange is the customer's own money.
  const financed = price - deposit - partExchange - contribution;
  if (financed - balloon < 0) return null;

  const months = termYears * 12;
  const monthly = monthlyPaymentWithBalloon(financed, balloon, apr, months);
  const totalInterest = monthly * months + balloon - financed;

  const { y1, pa } = getDepreciationRates(inputs);
  const customResidual = getCustomResidual(inputs);
  const finalValue = customResidual !== null ? customResidual : carValueAtYear(price, termYears, y1, pa);
  const uniformRate = customResidual !== null && price > 0 ? 1 - Math.pow(customResidual / price, 1 / termYears) : null;

  const fuel = getAnnualFuel(inputs);
  const annualRunning = insurance + roadTax + maintenance + tyresPerYear + fuel;
  const totalRunning = annualRunning * termYears;

  const excessMilesPerYear = Math.max(0, mileage - mileageIncluded);
  const excessMileageCost = excessMilesPerYear * termYears * (excessPpm / 100);

  // End of term: hand back (pay excess mileage, walk away — depreciation
  // borne is capped at price − GMFV) or buy at the balloon and sell at market
  // value (no excess mileage, but selling cost applies). These are mutually
  // exclusive; the grand total uses the cheaper.
  const marketValue = finalValue;
  const equity = marketValue - balloon;
  const upfront = deposit + partExchange + adminFee;
  const handBackTotal = upfront + monthly * months + excessMileageCost + totalRunning;
  const buySellTotal = upfront + monthly * months + balloon + otpFee - marketValue + sellingCost + totalRunning;
  const scenario: 'handback' | 'buysell' = buySellTotal < handBackTotal ? 'buysell' : 'handback';

  const scenarioExcess = scenario === 'handback' ? excessMileageCost : 0;
  const scenarioSelling = scenario === 'buysell' ? sellingCost : 0;
  const totalDepreciation = scenario === 'buysell' ? price - marketValue : price - balloon;

  const yearly: YearlyBreakdown[] = [];
  let cumulative = 0;
  let prevVal = price;
  for (let yr = 1; yr <= termYears; yr++) {
    const valEnd = uniformRate !== null
      ? Math.max(0, price * Math.pow(1 - uniformRate, yr))
      : carValueAtYear(price, yr, y1, pa);
    const dep = prevVal - valEnd;
    prevVal = valEnd;
    const fin = monthly * 12 + (yr === 1 ? deposit + partExchange + adminFee : 0);
    const running = annualRunning;
    const endOfTerm = yr === termYears
      ? (scenario === 'buysell' ? balloon + otpFee - marketValue + sellingCost : excessMileageCost)
      : 0;
    const total = fin + running + endOfTerm;
    cumulative += total;
    yearly.push({ year: yr, carValue: valEnd, depreciation: dep, financePayments: fin, runningCosts: running, endOfTerm, totalCost: total, cumulativeTotal: cumulative });
  }

  const grandTotal = scenario === 'buysell' ? buySellTotal : handBackTotal;
  const totalMiles = mileage * termYears;

  return {
    type: 'pcp', label: 'PCP', color: colors.pcp,
    monthlyPayment: monthly, totalFinanceCost: totalInterest,
    totalRunningCosts: totalRunning, totalDepreciation, sellingCost: scenarioSelling,
    grandTotal, excessMileageCost: scenarioExcess,
    pcpHandBackTotal: handBackTotal, pcpBuySellTotal: buySellTotal,
    pcpEquity: equity, pcpScenario: scenario,
    totalAmountPayable: deposit + partExchange + monthly * months + balloon + adminFee + otpFee,
    annualFuelCost: fuel,
    feesTotal: adminFee + otpFee,
    dealerContribution: contribution,
    costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months,
    yearlyBreakdown: yearly,
    depositRequired: deposit,
    provider: inputs.pcpProvider || undefined,
    providerUrl: inputs.pcpProviderUrl || undefined,
  };
}

function calcHP(inputs: CarInputs, termYears: number): FinanceResult | null {
  const price = n(inputs.carPrice);
  const deposit = n(inputs.hpDeposit);
  const apr = n(inputs.hpApr);
  const insurance = inputs.hpInsuranceIncluded ? 0 : n(inputs.insurance);
  const roadTax = inputs.hpRoadTaxIncluded ? 0 : n(inputs.roadTax);
  const maintenance = inputs.hpServiceIncluded ? 0 : n(inputs.maintenance);
  const tyresPerYear = inputs.hpTyresIncluded ? 0 : n(inputs.tyresPerYear);
  const sellingCost = n(inputs.sellingCost);
  const mileage = n(inputs.annualMileage);
  const adminFee = n(inputs.adminFee);
  const otpFee = n(inputs.otpFee);
  const contribution = n(inputs.dealerContribution);
  const partExchange = n(inputs.partExchange);

  const financed = price - deposit - partExchange - contribution;
  if (financed < 0) return null;

  const months = termYears * 12;
  const monthly = monthlyPayment(financed, apr, months);
  const totalInterest = monthly * months - financed;

  const { y1, pa } = getDepreciationRates(inputs);
  const customResidual = getCustomResidual(inputs);
  const finalValue = customResidual !== null ? customResidual : carValueAtYear(price, termYears, y1, pa);
  const uniformRate = customResidual !== null && price > 0 ? 1 - Math.pow(customResidual / price, 1 / termYears) : null;
  const totalDepreciation = price - finalValue;

  const fuel = getAnnualFuel(inputs);
  const annualRunning = insurance + roadTax + maintenance + tyresPerYear + fuel;
  const totalRunning = annualRunning * termYears;

  // Pure cash-flow table: deposit lands in year 1, the sale of the car
  // (minus selling cost) is credited in the final year, so the cumulative
  // column reconciles with the grand total instead of double-counting
  // capital as both principal payments and depreciation.
  const yearly: YearlyBreakdown[] = [];
  let cumulative = 0;
  let prevValHP = price;
  for (let yr = 1; yr <= termYears; yr++) {
    const valEnd = uniformRate !== null
      ? Math.max(0, price * Math.pow(1 - uniformRate, yr))
      : carValueAtYear(price, yr, y1, pa);
    const dep = prevValHP - valEnd;
    prevValHP = valEnd;
    const fin = monthly * 12 + (yr === 1 ? deposit + partExchange + adminFee : 0);
    const running = annualRunning;
    const endOfTerm = yr === termYears ? sellingCost - finalValue + otpFee : 0;
    const total = fin + running + endOfTerm;
    cumulative += total;
    yearly.push({ year: yr, carValue: valEnd, depreciation: dep, financePayments: fin, runningCosts: running, endOfTerm, totalCost: total, cumulativeTotal: cumulative });
  }

  // Fees add to the customer's cost; the dealer contribution is money the
  // customer never pays (it only shrank the financed amount above).
  const grandTotal = totalInterest + totalDepreciation + totalRunning + sellingCost + adminFee + otpFee - contribution;
  const totalMiles = mileage * termYears;

  return {
    type: 'hp', label: 'HP', color: colors.hp,
    monthlyPayment: monthly, totalFinanceCost: totalInterest,
    totalRunningCosts: totalRunning, totalDepreciation, sellingCost,
    grandTotal, costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months, yearlyBreakdown: yearly,
    totalAmountPayable: deposit + partExchange + monthly * months + adminFee + otpFee,
    annualFuelCost: fuel,
    feesTotal: adminFee + otpFee,
    dealerContribution: contribution,
    depositRequired: deposit,
    provider: inputs.hpProvider || undefined,
    providerUrl: inputs.hpProviderUrl || undefined,
  };
}

function calcPCH(inputs: CarInputs, termYears: number): FinanceResult | null {
  const pchDeposit = n(inputs.pchDeposit);
  const pchMonthly = n(inputs.pchMonthly);
  const insurance = inputs.pchInsuranceIncluded ? 0 : n(inputs.insurance);
  const roadTax = inputs.pchRoadTaxIncluded ? 0 : n(inputs.roadTax);
  const maintenance = inputs.pchServiceIncluded ? 0 : n(inputs.maintenance);
  const tyresPerYear = inputs.pchTyresIncluded ? 0 : n(inputs.tyresPerYear);
  const mileage = n(inputs.annualMileage);
  const mileageIncluded = n(inputs.pchMileageIncluded);
  const excessPpm = n(inputs.pchExcessPpm);

  const months = termYears * 12;
  const totalLease = pchDeposit + pchMonthly * months;

  const fuel = getAnnualFuel(inputs);
  const annualRunning = insurance + roadTax + maintenance + tyresPerYear + fuel;
  const totalRunning = annualRunning * termYears;

  const excessMilesPerYear = Math.max(0, mileage - mileageIncluded);
  const excessMileageCost = excessMilesPerYear * termYears * (excessPpm / 100);

  const yearly: YearlyBreakdown[] = [];
  let cumulative = 0;
  for (let yr = 1; yr <= termYears; yr++) {
    const fin = pchMonthly * 12 + (yr === 1 ? pchDeposit : 0);
    const running = annualRunning;
    const endOfTerm = yr === termYears ? excessMileageCost : 0;
    const total = fin + running + endOfTerm;
    cumulative += total;
    yearly.push({ year: yr, carValue: 0, depreciation: 0, financePayments: fin, runningCosts: running, endOfTerm, totalCost: total, cumulativeTotal: cumulative });
  }

  const grandTotal = totalLease + totalRunning + excessMileageCost;
  const totalMiles = mileage * termYears;

  return {
    type: 'pch', label: 'Lease / Contract Hire', color: colors.pch,
    monthlyPayment: pchMonthly, totalFinanceCost: totalLease,
    totalRunningCosts: totalRunning, totalDepreciation: 0, sellingCost: 0,
    grandTotal, excessMileageCost,
    costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months, yearlyBreakdown: yearly,
    annualFuelCost: fuel,
    depositRequired: pchDeposit,
    provider: inputs.pchProvider || undefined,
    providerUrl: inputs.pchProviderUrl || undefined,
  };
}

function calcLoan(inputs: CarInputs, termYears: number): FinanceResult | null {
  const price = n(inputs.carPrice);
  const apr = n(inputs.loanApr);
  const insurance = n(inputs.insurance);
  const roadTax = n(inputs.roadTax);
  const maintenance = n(inputs.maintenance);
  const tyresPerYear = n(inputs.tyresPerYear);
  const sellingCost = n(inputs.sellingCost);
  const mileage = n(inputs.annualMileage);

  const partExchange = n(inputs.partExchange);
  const deposit = Math.round(price * (inputs.loanDepositPct ?? 10) / 100);
  const loanAmount = price - deposit - partExchange;

  if (loanAmount <= 0) return null;

  const months = termYears * 12;
  const monthly = monthlyPayment(loanAmount, apr, months);
  const totalPaid = monthly * months;
  const totalInterest = totalPaid - loanAmount;

  const { y1, pa } = getDepreciationRates(inputs);
  const customResidual = getCustomResidual(inputs);
  const finalValue = customResidual !== null ? customResidual : carValueAtYear(price, termYears, y1, pa);
  const uniformRate = customResidual !== null && price > 0 ? 1 - Math.pow(customResidual / price, 1 / termYears) : null;
  const totalDepreciation = price - finalValue;

  const fuel = getAnnualFuel(inputs);
  const annualRunning = insurance + roadTax + maintenance + tyresPerYear + fuel;
  const totalRunning = annualRunning * termYears;

  // Same pure cash-flow shape as HP: deposit in year 1, sale credited at end.
  const yearly: YearlyBreakdown[] = [];
  let cumulative = 0;
  let prevValLoan = price;
  for (let yr = 1; yr <= termYears; yr++) {
    const valEnd = uniformRate !== null
      ? Math.max(0, price * Math.pow(1 - uniformRate, yr))
      : carValueAtYear(price, yr, y1, pa);
    const dep = prevValLoan - valEnd;
    prevValLoan = valEnd;
    const fin = monthly * 12 + (yr === 1 ? deposit + partExchange : 0);
    const running = annualRunning;
    const endOfTerm = yr === termYears ? sellingCost - finalValue : 0;
    const total = fin + running + endOfTerm;
    cumulative += total;
    yearly.push({ year: yr, carValue: valEnd, depreciation: dep, financePayments: fin, runningCosts: running, endOfTerm, totalCost: total, cumulativeTotal: cumulative });
  }

  const grandTotal = totalInterest + totalDepreciation + totalRunning + sellingCost;
  const totalMiles = mileage * termYears;
  const loanResidualValue = yearly.length > 0 ? Math.round(yearly[yearly.length - 1].carValue) : undefined;

  return {
    type: 'loan', label: 'Bank Loan', color: colors.loan,
    monthlyPayment: monthly, totalFinanceCost: totalInterest,
    totalRunningCosts: totalRunning, totalDepreciation, sellingCost,
    grandTotal, costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months, yearlyBreakdown: yearly,
    totalAmountPayable: deposit + partExchange + monthly * months,
    annualFuelCost: fuel,
    depositRequired: deposit,
    loanResidualValue,
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
  const roadTax = inputs.ssRoadTaxIncluded ? 0 : n(inputs.roadTax);
  const maintenance = inputs.ssServiceIncluded ? 0 : n(inputs.maintenance);
  const tyres = inputs.ssTyresIncluded ? 0 : n(inputs.tyresPerYear);
  const fuel = getAnnualFuel(inputs);
  const annualRunning = insurance + roadTax + maintenance + tyres + fuel;
  const totalRunning = annualRunning * termYears;

  // Upfront deposit net of tax/NI
  const netDeposit = ssDeposit * (1 - taxRate - niRate);

  // Total net cost of sacrifice + BIK tax over term
  const totalNetSacrifice = netDeposit + effectiveMonthly * months;

  const grandTotal = totalNetSacrifice + totalRunning;
  const totalMiles = mileage * termYears;

  const yearly: YearlyBreakdown[] = [];
  let cumulative = 0;
  for (let yr = 1; yr <= termYears; yr++) {
    const fin = effectiveMonthly * 12 + (yr === 1 ? netDeposit : 0);
    const running = annualRunning;
    const total = fin + running;
    cumulative += total;
    yearly.push({ year: yr, carValue: 0, depreciation: 0, financePayments: fin, runningCosts: running, endOfTerm: 0, totalCost: total, cumulativeTotal: cumulative });
  }

  return {
    type: 'salary', label: 'Salary Sacrifice', color: colors.salary,
    monthlyPayment: effectiveMonthly,
    totalFinanceCost: totalNetSacrifice,
    totalRunningCosts: totalRunning, totalDepreciation: 0, sellingCost: 0,
    grandTotal, costPerMile: totalMiles > 0 ? grandTotal / totalMiles : 0,
    costPerMonth: grandTotal / months, yearlyBreakdown: yearly,
    bikRate: bikPct,
    annualFuelCost: fuel,
    monthlyBikTax, monthlyNetSacrifice,
    depositRequired: ssDeposit,
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
