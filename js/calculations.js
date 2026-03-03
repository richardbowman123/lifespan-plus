// LifeSpan+ Calculation Engine
// Pure functions - no DOM access

const LifeSpanCalc = (() => {

  // ============================================================
  // UNIT CONVERSIONS
  // ============================================================

  function stoneToKg(stones, pounds = 0) {
    return (stones * 6.35029) + (pounds * 0.453592);
  }

  function feetInchesToCm(feet, inches = 0) {
    return ((feet * 12) + inches) * 2.54;
  }

  function inchesToCm(inches) {
    return inches * 2.54;
  }

  function cmToInches(cm) {
    return cm / 2.54;
  }

  // ============================================================
  // BMI
  // ============================================================

  function calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm || heightCm === 0) return null;
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }

  function getBMICategory(bmi) {
    if (bmi === null) return null;
    for (const cat of LifeSpanData.bmiCategories) {
      if (bmi >= cat.min && bmi < cat.max) return cat;
    }
    return LifeSpanData.bmiCategories[LifeSpanData.bmiCategories.length - 1];
  }

  // ============================================================
  // BASELINE LIFE EXPECTANCY
  // ============================================================

  function getBaselineLE(age, sex) {
    const table = LifeSpanData.onsLifeTables[sex];
    if (!table) return null;

    const clampedAge = Math.min(Math.max(Math.round(age), 0), 100);
    const remainingYears = table[clampedAge];
    if (remainingYears === undefined) return null;

    return {
      remainingYears,
      expectedAge: clampedAge + remainingYears,
      currentAge: clampedAge
    };
  }

  function getHealthyLE(expectedAge, currentAge, sex) {
    const ratio = LifeSpanData.hleRatio[sex] || 0.75;
    const remainingTotal = expectedAge - currentAge;
    const healthyRemaining = remainingTotal * ratio;
    return currentAge + healthyRemaining;
  }

  // ============================================================
  // CAUSES OF DEATH
  // ============================================================

  function getCausesOfDeath(age, sex) {
    const ageGroup = LifeSpanData.getAgeGroup(age);
    return LifeSpanData.causesOfDeath[sex]?.[ageGroup] || [];
  }

  // ============================================================
  // STAGE 1: BASIC CALCULATION
  // ============================================================

  function calculateStage1(profile) {
    const { age, sex, weightKg, heightCm } = profile;

    const bmi = calculateBMI(weightKg, heightCm);
    const bmiCategory = getBMICategory(bmi);
    const baseline = getBaselineLE(age, sex);

    if (!baseline) return null;

    const bmiAdjustment = bmiCategory ? bmiCategory.adjustment : 0;
    const adjustedExpectedAge = baseline.expectedAge + bmiAdjustment;
    const healthyLE = getHealthyLE(adjustedExpectedAge, age, sex);

    return {
      bmi: bmi ? Math.round(bmi * 10) / 10 : null,
      bmiCategory,
      baseline,
      bmiAdjustment,
      adjustedExpectedAge: Math.round(adjustedExpectedAge * 10) / 10,
      healthyLE: Math.round(healthyLE * 10) / 10,
      causesOfDeath: getCausesOfDeath(age, sex),
      genericAdvice: LifeSpanData.genericAdvice
    };
  }

  // ============================================================
  // STAGE 2: LIFESTYLE ADJUSTMENTS
  // ============================================================

  function getSmokingAdjustment(smoking) {
    if (!smoking || smoking.status === 'skip') return { value: 0, skipped: true, label: 'Smoking' };

    const data = LifeSpanData.lifestyleFactors.smoking;
    let value = 0;
    let detail = '';

    if (smoking.status === 'never') {
      value = 0;
      detail = 'Never smoked';
    } else if (smoking.status === 'vaper') {
      value = data.adjustments.vaper;
      detail = 'Vapes (non-smoker)';
    } else if (smoking.status === 'former') {
      const yearsSinceQuit = smoking.yearsSinceQuit || 0;
      if (yearsSinceQuit < 5) { value = data.adjustments.former.under5; detail = 'Quit <5 years ago'; }
      else if (yearsSinceQuit < 10) { value = data.adjustments.former['5to10']; detail = 'Quit 5-10 years ago'; }
      else if (yearsSinceQuit < 15) { value = data.adjustments.former['10to15']; detail = 'Quit 10-15 years ago'; }
      else { value = data.adjustments.former.over15; detail = 'Quit 15+ years ago'; }
    } else if (smoking.status === 'current') {
      const perDay = smoking.perDay || 10;
      if (perDay < 10) { value = data.adjustments.current.light; detail = 'Light smoker (<10/day)'; }
      else if (perDay < 20) { value = data.adjustments.current.moderate; detail = 'Moderate smoker (10-19/day)'; }
      else { value = data.adjustments.current.heavy; detail = 'Heavy smoker (20+/day)'; }
    }

    return {
      value,
      skipped: false,
      label: 'Smoking',
      detail,
      citation: data.citation
    };
  }

  function getAlcoholAdjustment(alcohol) {
    if (!alcohol || alcohol.units === undefined || alcohol.units === 'skip') {
      return { value: 0, skipped: true, label: 'Alcohol' };
    }

    const data = LifeSpanData.lifestyleFactors.alcohol;
    const units = alcohol.units;
    let value = 0;
    let detail = '';

    if (units === 0) { value = data.adjustments.none; detail = 'Non-drinker'; }
    else if (units <= 7) { value = data.adjustments.light; detail = '1-7 units/week'; }
    else if (units <= 14) { value = data.adjustments.moderate; detail = '8-14 units/week'; }
    else if (units <= 35) { value = data.adjustments.heavy; detail = '15-35 units/week'; }
    else { value = data.adjustments.veryHeavy; detail = '35+ units/week'; }

    return {
      value,
      skipped: false,
      label: 'Alcohol',
      detail,
      citation: data.citation
    };
  }

  function getActivityAdjustment(activity) {
    if (!activity || activity.minutes === undefined || activity.minutes === 'skip') {
      return { value: 0, skipped: true, label: 'Physical activity' };
    }

    const data = LifeSpanData.lifestyleFactors.activity;
    const mins = activity.minutes;
    let value = 0;
    let detail = '';

    if (mins < 30) { value = data.adjustments.sedentary; detail = 'Sedentary (<30 min/week)'; }
    else if (mins < 75) { value = data.adjustments.low; detail = 'Low activity (30-74 min/week)'; }
    else if (mins < 150) { value = data.adjustments.belowGuideline; detail = 'Below guideline (75-149 min/week)'; }
    else if (mins <= 300) { value = data.adjustments.meetsGuideline; detail = 'Meets guideline (150-300 min/week)'; }
    else { value = data.adjustments.exceedsGuideline; detail = 'Exceeds guideline (300+ min/week)'; }

    return {
      value,
      skipped: false,
      label: 'Physical activity',
      detail,
      citation: data.citation
    };
  }

  function getDietAdjustment(diet) {
    if (!diet || (diet.fruitVeg === 'skip' && diet.ultraProcessed === 'skip')) {
      return { value: 0, skipped: true, label: 'Diet' };
    }

    const data = LifeSpanData.lifestyleFactors.diet;
    let value = 0;
    let details = [];
    let skippedParts = [];

    if (diet.fruitVeg && diet.fruitVeg !== 'skip') {
      const fvAdj = data.adjustments.fruitVeg[diet.fruitVeg] || 0;
      value += fvAdj;
      details.push(`Fruit & veg: ${diet.fruitVeg} portions/day`);
    } else {
      skippedParts.push('fruit & veg');
    }

    if (diet.ultraProcessed && diet.ultraProcessed !== 'skip') {
      const upAdj = data.adjustments.ultraProcessed[diet.ultraProcessed] || 0;
      value += upAdj;
      details.push(`Ultra-processed food: ${diet.ultraProcessed}`);
    } else {
      skippedParts.push('ultra-processed food');
    }

    return {
      value,
      skipped: details.length === 0,
      label: 'Diet',
      detail: details.join('; '),
      skippedParts,
      citation: data.citation
    };
  }

  function getSleepAdjustment(sleep) {
    if (!sleep || sleep.hours === undefined || sleep.hours === 'skip') {
      return { value: 0, skipped: true, label: 'Sleep' };
    }

    const data = LifeSpanData.lifestyleFactors.sleep;
    const hours = sleep.hours;
    let value = 0;
    let detail = '';

    if (hours < 5) { value = data.adjustments.under5; detail = '<5 hours/night'; }
    else if (hours < 6) { value = data.adjustments['5to6']; detail = '5-6 hours/night'; }
    else if (hours < 7) { value = data.adjustments['6to7']; detail = '6-7 hours/night'; }
    else if (hours <= 8) { value = data.adjustments['7to8']; detail = '7-8 hours/night (optimal)'; }
    else if (hours <= 9) { value = data.adjustments['8to9']; detail = '8-9 hours/night'; }
    else { value = data.adjustments.over9; detail = '9+ hours/night'; }

    // Apply sleep quality adjustment if present
    if (sleep.quality && data.qualityAdjustments && data.qualityAdjustments[sleep.quality] !== undefined) {
      const qualityAdj = data.qualityAdjustments[sleep.quality];
      value += qualityAdj;
      if (sleep.quality !== 'good') {
        detail += `; quality: ${sleep.quality}`;
      }
    }

    return {
      value,
      skipped: false,
      label: 'Sleep',
      detail,
      citation: data.citation
    };
  }

  function getMentalHealthAdjustment(mental) {
    if (!mental || (mental.depression === 'skip' && mental.loneliness === 'skip')) {
      return { value: 0, skipped: true, label: 'Mental wellbeing' };
    }

    const data = LifeSpanData.lifestyleFactors.mentalHealth;
    let value = 0;
    let details = [];

    if (mental.depression && mental.depression !== 'skip') {
      value += data.adjustments.depression[mental.depression] || 0;
      details.push(`Depression/anxiety: ${mental.depression}`);
    }

    if (mental.loneliness && mental.loneliness !== 'skip') {
      value += data.adjustments.loneliness[mental.loneliness] || 0;
      details.push(`Loneliness: ${mental.loneliness}`);
    }

    return {
      value,
      skipped: details.length === 0,
      label: 'Mental wellbeing',
      detail: details.join('; '),
      citation: data.citation
    };
  }

  function getSocialAdjustment(social) {
    if (!social || (social.livingAlone === 'skip' && social.frequency === 'skip')) {
      return { value: 0, skipped: true, label: 'Social connections' };
    }

    const data = LifeSpanData.lifestyleFactors.social;
    let value = 0;
    let details = [];

    if (social.livingAlone === true) {
      value += data.adjustments.livingAlone;
      details.push('Lives alone');
    }

    if (social.frequency && social.frequency !== 'skip') {
      value += data.adjustments.socialFrequency[social.frequency] || 0;
      details.push(`Social contact: ${social.frequency}`);
    }

    return {
      value,
      skipped: details.length === 0,
      label: 'Social connections',
      detail: details.join('; '),
      citation: data.citation
    };
  }

  function getConditionsAdjustment(conditions) {
    if (!conditions || conditions.length === 0) {
      return { value: 0, skipped: false, label: 'Existing conditions', detail: 'None reported', items: [] };
    }

    if (conditions === 'skip') {
      return { value: 0, skipped: true, label: 'Existing conditions' };
    }

    const data = LifeSpanData.lifestyleFactors.conditions;
    let value = 0;
    let items = [];

    for (const cond of conditions) {
      if (data[cond]) {
        value += data[cond].adjustment;
        items.push({ name: cond, adjustment: data[cond].adjustment });
      }
    }

    return {
      value,
      skipped: false,
      label: 'Existing conditions',
      detail: items.map(i => i.name).join(', '),
      items,
      conditionsList: conditions
    };
  }

  function getFamilyHistoryAdjustment(history) {
    if (!history || history.length === 0) {
      return { value: 0, skipped: false, label: 'Family history', detail: 'None reported' };
    }

    if (history === 'skip') {
      return { value: 0, skipped: true, label: 'Family history' };
    }

    const data = LifeSpanData.lifestyleFactors.familyHistory;
    let value = 0;
    let items = [];

    for (const item of history) {
      if (data[item] !== undefined) {
        value += data[item];
        items.push(item);
      }
    }

    return {
      value,
      skipped: false,
      label: 'Family history',
      detail: items.join(', '),
      citation: data.citation
    };
  }

  function getStressAdjustment(stress) {
    if (!stress || stress.level === 'skip' || stress.level === undefined) {
      return { value: 0, skipped: true, label: 'Work stress' };
    }

    const data = LifeSpanData.lifestyleFactors.stress;
    const value = data.adjustments[stress.level] || 0;

    return {
      value,
      skipped: false,
      label: 'Work stress',
      detail: `${stress.level} stress`,
      citation: data.citation
    };
  }

  function calculateStage2(stage1Result, lifestyle) {
    const adjustments = [
      getSmokingAdjustment(lifestyle.smoking),
      getAlcoholAdjustment(lifestyle.alcohol),
      getActivityAdjustment(lifestyle.activity),
      getDietAdjustment(lifestyle.diet),
      getSleepAdjustment(lifestyle.sleep),
      getMentalHealthAdjustment(lifestyle.mentalHealth),
      getSocialAdjustment(lifestyle.social),
      getConditionsAdjustment(lifestyle.conditions),
      getFamilyHistoryAdjustment(lifestyle.familyHistory),
      getStressAdjustment(lifestyle.stress)
    ];

    const totalLifestyleAdjustment = adjustments.reduce((sum, a) => sum + a.value, 0);
    const skippedFactors = adjustments.filter(a => a.skipped);

    // Apply safeguards
    let adjustedExpectedAge = stage1Result.adjustedExpectedAge + totalLifestyleAdjustment;
    const currentAge = stage1Result.baseline.currentAge;

    // Cap: never below current age + 1
    adjustedExpectedAge = Math.max(adjustedExpectedAge, currentAge + 1);

    // Cap: no more than +8 years above ONS baseline
    const maxExpectedAge = stage1Result.baseline.expectedAge + 8;
    adjustedExpectedAge = Math.min(adjustedExpectedAge, maxExpectedAge);

    adjustedExpectedAge = Math.round(adjustedExpectedAge * 10) / 10;

    const sex = lifestyle.sex || 'male';
    const healthyLE = getHealthyLE(adjustedExpectedAge, currentAge, sex);

    // Determine recommendations
    const recs = generateRecommendations(lifestyle, adjustments);

    return {
      adjustments,
      totalLifestyleAdjustment: Math.round(totalLifestyleAdjustment * 10) / 10,
      adjustedExpectedAge,
      healthyLE: Math.round(healthyLE * 10) / 10,
      skippedFactors,
      recommendations: recs,
      comparisonToBaseline: Math.round((adjustedExpectedAge - stage1Result.baseline.expectedAge) * 10) / 10
    };
  }

  function generateRecommendations(lifestyle, adjustments) {
    const recs = [];
    const recsData = LifeSpanData.recommendations;

    // Build lookup by label so we don't rely on array indices
    const adj = {};
    for (const a of adjustments) {
      adj[a.label] = a;
    }

    // Check each factor and add relevant recommendations
    if (lifestyle.smoking?.status === 'current') {
      recs.push({ ...recsData.smoking_current, impact: Math.abs(adj['Smoking']?.value || 0) });
    } else if (lifestyle.smoking?.status === 'vaper') {
      recs.push({ ...recsData.vaping, impact: Math.abs(adj['Smoking']?.value || 0) });
    } else if (lifestyle.smoking?.status === 'former' && (lifestyle.smoking.yearsSinceQuit || 0) < 10) {
      recs.push({ ...recsData.smoking_former_recent, impact: Math.abs(adj['Smoking']?.value || 0) });
    }

    if (lifestyle.alcohol?.units > 14) {
      recs.push({ ...recsData.alcohol_heavy, impact: Math.abs(adj['Alcohol']?.value || 0) });
    }

    if (lifestyle.activity?.minutes !== undefined && lifestyle.activity.minutes < 150) {
      recs.push({ ...recsData.activity_low, impact: Math.abs(adj['Physical activity']?.value || 0) });
    }

    // Diet
    if ((adj['Diet']?.value || 0) < -1) {
      recs.push({ ...recsData.diet_poor, impact: Math.abs(adj['Diet'].value) });
    }

    // Sleep
    if ((adj['Sleep']?.value || 0) < -0.5) {
      recs.push({ ...recsData.sleep_poor, impact: Math.abs(adj['Sleep'].value) });
    }

    // Mental health (two tiers: mild for small dips, concern for significant struggles)
    const mhAdj = adj['Mental wellbeing']?.value || 0;
    if (mhAdj < -2) {
      recs.push({ ...recsData.mental_health_concern, impact: Math.abs(mhAdj) });
    } else if (mhAdj < -0.3) {
      recs.push({ ...recsData.mental_health_mild, impact: Math.abs(mhAdj) });
    }

    // Social
    if ((adj['Social connections']?.value || 0) < -1) {
      recs.push({ ...recsData.social_isolation, impact: Math.abs(adj['Social connections'].value) });
    }

    // Stress
    if (lifestyle.stress?.level === 'high' || lifestyle.stress?.level === 'veryHigh') {
      recs.push({ ...recsData.stress_high, impact: Math.abs(adj['Work stress']?.value || 0) });
    }

    // Sort by impact (biggest gain first)
    recs.sort((a, b) => b.impact - a.impact);

    return recs;
  }

  // ============================================================
  // STAGE 3: HEALTH TESTS
  // ============================================================

  function scoreHealthTest(testId, value, sex) {
    const testData = LifeSpanData.healthTests[testId];
    if (!testData) return null;

    const thresholds = testData.thresholds[sex] || testData.thresholds.male;

    for (const t of thresholds) {
      if (value >= t.min && value < t.max) {
        return {
          testId,
          label: testData.label,
          value,
          unit: testData.unit,
          rating: t.label,
          colour: t.colour,
          adjustment: t.adjustment,
          citation: testData.citation
        };
      }
    }

    // Fallback to last threshold
    const last = thresholds[thresholds.length - 1];
    return {
      testId,
      label: testData.label,
      value,
      unit: testData.unit,
      rating: last.label,
      colour: last.colour,
      adjustment: last.adjustment,
      citation: testData.citation
    };
  }

  function calculateStage3(stage2Result, tests, sex, currentAge, conditions, onsBaselineExpectedAge) {
    const testResults = [];
    let totalTestAdjustment = 0;

    for (const [testId, value] of Object.entries(tests)) {
      if (value === null || value === undefined || value === '') continue;

      const result = scoreHealthTest(testId, parseFloat(value), sex);
      if (result) {
        testResults.push(result);
        totalTestAdjustment += result.adjustment;
      }
    }

    // DEDUPLICATION: If diabetes is in conditions AND HbA1c is entered,
    // the diabetes penalty was already applied in Stage 2. We want the
    // larger (more negative) of the two penalties total, not both.
    const conditionsList = conditions || [];
    const hba1cResult = testResults.find(r => r.testId === 'hba1c');

    if (conditionsList.includes('diabetes') && hba1cResult) {
      const condDiabetesAdj = LifeSpanData.lifestyleFactors.conditions.diabetes.adjustment; // e.g. -5
      const hba1cAdj = hba1cResult.adjustment; // e.g. -6

      // Remove the HbA1c adjustment from Stage 3 total (it was already added above)
      totalTestAdjustment -= hba1cAdj;

      // If HbA1c penalty is worse than the condition penalty, add only the extra difference
      if (hba1cAdj < condDiabetesAdj) {
        totalTestAdjustment += (hba1cAdj - condDiabetesAdj); // adds the extra negative portion
      }
      // If condition penalty was worse or equal, we keep Stage 2's penalty as-is (no extra from Stage 3)

      hba1cResult.deduplicatedNote = 'Adjusted to avoid double-counting with diabetes condition';
    }

    let adjustedExpectedAge = stage2Result.adjustedExpectedAge + totalTestAdjustment;

    // Safeguards
    // Floor: never below current age + 1
    adjustedExpectedAge = Math.max(adjustedExpectedAge, currentAge + 1);

    // Ceiling: cap at +8 years above ONS baseline (same cap as Stage 2)
    if (onsBaselineExpectedAge) {
      adjustedExpectedAge = Math.min(adjustedExpectedAge, onsBaselineExpectedAge + 8);
    }

    adjustedExpectedAge = Math.round(adjustedExpectedAge * 10) / 10;

    const healthyLE = getHealthyLE(adjustedExpectedAge, currentAge, sex);

    // Generate test-specific recommendations
    const testRecs = generateTestRecommendations(testResults);

    return {
      testResults,
      totalTestAdjustment: Math.round(totalTestAdjustment * 10) / 10,
      adjustedExpectedAge,
      healthyLE: Math.round(healthyLE * 10) / 10,
      testRecommendations: testRecs
    };
  }

  function generateTestRecommendations(testResults) {
    const recs = [];
    const recsData = LifeSpanData.recommendations;

    for (const result of testResults) {
      if (result.colour === 'red' || result.colour === 'amber') {
        switch (result.testId) {
          case 'bloodPressure':
            recs.push({ ...recsData.bp_high, impact: Math.abs(result.adjustment) });
            break;
          case 'totalCholesterol':
            recs.push({ ...recsData.cholesterol_high, impact: Math.abs(result.adjustment) });
            break;
          case 'hba1c':
            recs.push({ ...recsData.hba1c_high, impact: Math.abs(result.adjustment) });
            break;
          case 'singleLegBalance':
            recs.push({ ...recsData.balance_poor, impact: Math.abs(result.adjustment) });
            break;
          case 'pushUps':
            recs.push({ ...recsData.fitness_low, impact: Math.abs(result.adjustment) });
            break;
          case 'gripStrength':
            recs.push({ ...recsData.grip_weak, impact: Math.abs(result.adjustment) });
            break;
        }
      }
    }

    recs.sort((a, b) => b.impact - a.impact);
    return recs;
  }

  // ============================================================
  // NARRATIVE SUMMARY - overlapping factors
  // ============================================================

  function generateNarrativeSummary(recommendations) {
    if (!recommendations || recommendations.length === 0) return '';

    const overlap = LifeSpanData.overlapMapping;

    // Build a set of active concern areas from recommendation titles
    const activeAreas = new Set();
    const areaFromTitle = {
      'Stop smoking': 'smoking',
      'Stay smoke-free': 'smoking',
      'Consider reducing or stopping vaping': 'smoking',
      'Reduce alcohol intake': 'alcohol',
      'Increase physical activity': 'activity',
      'Improve your diet': 'diet',
      'Optimise your sleep': 'sleep',
      'Look after your mental wellbeing': 'mentalHealth',
      'Get support for your mental health': 'mentalHealth',
      'Strengthen social connections': 'social',
      'Manage stress': 'stress',
      'Work towards a healthy weight': 'weight',
      'Manage your blood pressure': 'bloodPressure',
      'Lower your cholesterol': 'cholesterol',
      'Manage blood sugar levels': 'diabetes',
      'Improve balance and stability': 'balance',
      'Build upper body strength': 'fitness',
      'Improve grip strength': 'grip'
    };

    const friendlyName = {
      smoking: 'smoking', alcohol: 'alcohol', activity: 'physical activity',
      diet: 'diet', sleep: 'sleep', mentalHealth: 'mental wellbeing',
      social: 'social connections', stress: 'stress', weight: 'weight',
      bloodPressure: 'blood pressure', cholesterol: 'cholesterol',
      diabetes: 'blood sugar', balance: 'balance', fitness: 'fitness', grip: 'grip strength',
      cancer: 'cancer risk'
    };

    for (const rec of recommendations) {
      const area = areaFromTitle[rec.title];
      if (area) activeAreas.add(area);
    }

    if (activeAreas.size === 0) return '';

    // Find overlaps between active areas
    const overlapExamples = [];
    for (const area of activeAreas) {
      if (!overlap[area]) continue;
      for (const target of overlap[area]) {
        if (activeAreas.has(target) && area !== target) {
          overlapExamples.push({ from: area, to: target });
        }
      }
    }

    // Deduplicate (A->B and B->A)
    const seen = new Set();
    const uniqueOverlaps = overlapExamples.filter(o => {
      const key = [o.from, o.to].sort().join('-');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Build paragraphs
    let html = '<div class="card narrative-card">';

    // Opening
    if (recommendations.length === 1) {
      html += '<p>Based on what you\'ve shared, there\'s one area that stands out. The good news is that even small changes here can make a real difference.</p>';
    } else {
      html += '<p>Looking at the full picture, a few things stand out. What\'s important to know is that these factors don\'t exist in isolation. They\'re all connected, and improving one often has knock-on benefits for others.</p>';
    }

    // Overlap examples (pick up to 3)
    if (uniqueOverlaps.length > 0) {
      const examples = uniqueOverlaps.slice(0, 3);
      const exStr = examples.map(o =>
        `improving your <strong>${friendlyName[o.from]}</strong> could also help your <strong>${friendlyName[o.to]}</strong>`
      ).join('; ');
      html += `<p>For example: ${exStr}.</p>`;
    }

    // Biggest bang for your buck
    if (recommendations.length > 1) {
      const top = recommendations[0];
      html += `<p>If you\'re wondering where to start, <strong>${top.title.toLowerCase()}</strong> is where the research suggests you\'d see the biggest impact. But any step in the right direction counts.</p>`;
    }

    html += '</div>';
    return html;
  }

  // ============================================================
  // WHAT-IF SCENARIO CALCULATOR
  // ============================================================

  // Optimal values per lifestyle factor - the best-case for each
  const whatIfOptimals = {
    smoking:      { data: { status: 'never' },                                    adjustment: 0 },
    alcohol:      { data: { units: 0 },                                           adjustment: 0 },
    activity:     { data: { minutes: 400 },                                       adjustment: 1.5 },
    diet:         { data: { fruitVeg: '5+', ultraProcessed: 'rarely' },           adjustment: 1.0 },
    sleep:        { data: { hours: 7.5, quality: 'good' },                        adjustment: 0 },
    mentalHealth: { data: { depression: 'none', loneliness: 'never' },            adjustment: 0 },
    social:       { data: { livingAlone: false, frequency: 'daily' },             adjustment: 0.5 },
    stress:       { data: { level: 'low' },                                       adjustment: 0.3 }
  };

  function calculateWhatIf(stage1Result, lifestyle, toggledKeys) {
    // Deep clone the lifestyle so we don't mutate the original
    const modified = JSON.parse(JSON.stringify(lifestyle));

    // Override each toggled factor with its optimal value
    for (const key of toggledKeys) {
      if (whatIfOptimals[key]) {
        modified[key] = { ...whatIfOptimals[key].data };
      }
    }

    // Run the standard Stage 2 calculation with modified data
    return calculateStage2(stage1Result, modified);
  }

  // Public API
  return {
    stoneToKg,
    feetInchesToCm,
    inchesToCm,
    cmToInches,
    calculateBMI,
    getBMICategory,
    getBaselineLE,
    getHealthyLE,
    getCausesOfDeath,
    calculateStage1,
    calculateStage2,
    scoreHealthTest,
    calculateStage3,
    // Expose individual adjustments for testing
    getSmokingAdjustment,
    getAlcoholAdjustment,
    getActivityAdjustment,
    getDietAdjustment,
    getSleepAdjustment,
    getMentalHealthAdjustment,
    getSocialAdjustment,
    getConditionsAdjustment,
    getFamilyHistoryAdjustment,
    getStressAdjustment,
    generateNarrativeSummary,
    calculateWhatIf,
    whatIfOptimals
  };

})();
