// LifeSpan+ Application Logic
// Handles UI state, events, rendering

const LifeSpanApp = (() => {

  // ============================================================
  // STATE
  // ============================================================

  const state = {
    units: 'metric',       // 'metric' or 'imperial'
    profile: null,          // Stage 1 data
    stage1Result: null,
    lifestyle: {},          // Stage 2 data
    stage2Result: null,
    tests: {},              // Stage 3 data
    stage3Result: null,
    skipped: new Set(),     // Skipped question sections
    whatIfFactors: [],      // Improvable factor objects for What If panel
    whatIfToggled: new Set() // Currently toggled factor keys
  };

  // ============================================================
  // DOM REFERENCES
  // ============================================================

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ============================================================
  // INITIALISATION
  // ============================================================

  function init() {
    bindLanding();
    bindUnitToggle();
    bindStage1Form();
    bindStage2Form();
    bindStage3Form();
    bindNavigation();
    bindSkipButtons();
    bindConditionals();
    bindSourcesModal();
    bindPrintButtons();
  }

  // ============================================================
  // LANDING PAGE
  // ============================================================

  function bindLanding() {
    const btn = $('#btn-start-assessment');
    if (!btn) return;
    btn.addEventListener('click', () => {
      $('#landing').classList.add('hidden');
      $('#main-app').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================================
  // UNIT TOGGLE
  // ============================================================

  function bindUnitToggle() {
    $$('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const newUnits = btn.dataset.units;
        if (newUnits === state.units) return;

        state.units = newUnits;
        $$('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (newUnits === 'metric') {
          $('#weight-metric').classList.remove('hidden');
          $('#weight-imperial').classList.add('hidden');
          $('#height-metric').classList.remove('hidden');
          $('#height-imperial').classList.add('hidden');
        } else {
          $('#weight-metric').classList.add('hidden');
          $('#weight-imperial').classList.remove('hidden');
          $('#height-metric').classList.add('hidden');
          $('#height-imperial').classList.remove('hidden');
        }
      });
    });
  }

  // ============================================================
  // STAGE 1: BASIC PROFILE
  // ============================================================

  function bindStage1Form() {
    $('#stage1-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const sex = document.querySelector('input[name="sex"]:checked')?.value;
      const age = parseInt($('#age').value, 10);

      if (!sex || !age) {
        alert('Please enter your sex and age to continue.');
        return;
      }

      if (age < 18 || age > 100) {
        alert('Age must be between 18 and 100.');
        return;
      }

      let weightKg, heightCm;

      if (state.units === 'metric') {
        weightKg = parseFloat($('#weight-kg').value);
        heightCm = parseFloat($('#height-cm').value);
      } else {
        const stones = parseFloat($('#weight-stone').value) || 0;
        const pounds = parseFloat($('#weight-pounds').value) || 0;
        weightKg = LifeSpanCalc.stoneToKg(stones, pounds);

        const feet = parseFloat($('#height-feet').value) || 0;
        const inches = parseFloat($('#height-inches').value) || 0;
        heightCm = LifeSpanCalc.feetInchesToCm(feet, inches);
      }

      if (!weightKg || !heightCm) {
        alert('Please enter your weight and height.');
        return;
      }

      state.profile = { age, sex, weightKg, heightCm };
      state.stage1Result = LifeSpanCalc.calculateStage1(state.profile);

      renderStage1Results();
    });
  }

  function renderStage1Results() {
    const r = state.stage1Result;
    if (!r) return;

    // LE range display
    const range = formatLERange(r.adjustedExpectedAge);
    $('#s1-le-age').textContent = range.display;
    $('#s1-le-precise').textContent = `(based on an estimate of ~${r.adjustedExpectedAge.toFixed(0)})`;
    const remaining = r.adjustedExpectedAge - state.profile.age;
    $('#s1-le-remaining').textContent = Math.round(remaining);
    $('#s1-hle-age').textContent = r.healthyLE.toFixed(0);

    // BMI
    $('#s1-bmi-value').textContent = r.bmi;
    const catEl = $('#s1-bmi-category');
    catEl.textContent = r.bmiCategory.label;
    catEl.className = 'bmi-category ' + r.bmiCategory.colour;

    // BMI card border colour
    const bmiCard = $('#s1-bmi-card');
    bmiCard.className = 'card result-card border-' + r.bmiCategory.colour;

    // BMI impact text
    const impactEl = $('#s1-bmi-impact');
    if (r.bmiAdjustment === 0) {
      impactEl.textContent = 'Your BMI is in the healthy range. No adjustment to your estimate.';
    } else {
      impactEl.textContent = `BMI adjustment: ${r.bmiAdjustment > 0 ? '+' : ''}${r.bmiAdjustment} years on your estimate.`;
    }

    // Causes of death
    const causesList = $('#s1-causes-list');
    causesList.innerHTML = r.causesOfDeath.map(c => `<li>${escapeHTML(c)}</li>`).join('');

    // Generic advice
    const adviceList = $('#s1-advice-list');
    adviceList.innerHTML = r.genericAdvice.map(a => `
      <div class="advice-item">
        <h4>${escapeHTML(a.factor)}</h4>
        <p>${escapeHTML(a.advice)}</p>
        <p class="action">${escapeHTML(a.action)}</p>
        <p class="citation">${escapeHTML(a.citation)}</p>
      </div>
    `).join('');

    // Life Journey chart
    renderLifeChart('#s1-life-chart', state.profile.age, r.baseline.expectedAge, r.adjustedExpectedAge);

    // Show results, hide form
    $('#stage1-form').classList.add('hidden');
    $('#stage1-results').classList.remove('hidden');

    // Update progress
    updateProgress(1, 'completed');

    // Scroll to results
    $('#stage1-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ============================================================
  // STAGE 2: LIFESTYLE ASSESSMENT
  // ============================================================

  function bindStage2Form() {
    $('#stage2-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const lifestyle = collectLifestyleData();
      lifestyle.sex = state.profile.sex;
      state.lifestyle = lifestyle;

      state.stage2Result = LifeSpanCalc.calculateStage2(state.stage1Result, lifestyle);
      renderStage2Results();
    });
  }

  function collectLifestyleData() {
    const data = {};

    // Smoking - new conversational radios map to same calculation structure
    if (state.skipped.has('smoking')) {
      data.smoking = { status: 'skip' };
    } else {
      const smokingEver = document.querySelector('input[name="smoking-ever"]:checked')?.value;
      if (smokingEver) {
        // Social smokers map to 'current' with very light consumption
        if (smokingEver === 'social') {
          data.smoking = { status: 'current', perDay: 3 };
        } else if (smokingEver === 'vaper') {
          data.smoking = { status: 'vaper' };
        } else {
          data.smoking = { status: smokingEver };
        }
        if (smokingEver === 'former') {
          const timeframe = document.querySelector('input[name="quit-timeframe"]:checked')?.value;
          // Map radio ranges to approximate yearsSinceQuit values
          const quitMap = { under2: 1, '2to5': 3, '5to10': 7, '10to15': 12, over15: 20 };
          data.smoking.yearsSinceQuit = quitMap[timeframe] || 0;
        }
        if (smokingEver === 'current') {
          const amount = document.querySelector('input[name="smoking-amount"]:checked')?.value;
          // Map descriptive radios to perDay values
          const amountMap = { light: 5, moderate: 15, heavy: 25 };
          data.smoking.perDay = amountMap[amount] || 10;
        }
      } else {
        data.smoking = { status: 'skip' };
      }
    }

    // Alcohol - descriptive pattern maps to unit ranges
    if (state.skipped.has('alcohol')) {
      data.alcohol = { units: 'skip' };
    } else {
      const pattern = document.querySelector('input[name="alcohol-pattern"]:checked')?.value;
      if (pattern) {
        const unitMap = { none: 0, veryLight: 2, light: 5, moderate: 11, heavy: 25, veryHeavy: 40 };
        data.alcohol = { units: unitMap[pattern] };
        data.alcoholPattern = pattern;
        // Store binge/spread for narrative
        const spread = document.querySelector('input[name="alcohol-spread"]:checked')?.value;
        if (spread) data.alcoholSpread = spread;
      } else {
        data.alcohol = { units: 'skip' };
      }
    }

    // Activity - scenario descriptions map to minute ranges
    if (state.skipped.has('activity')) {
      data.activity = { minutes: 'skip' };
    } else {
      const level = document.querySelector('input[name="activity-level"]:checked')?.value;
      if (level) {
        const minuteMap = { sedentary: 15, low: 50, belowGuideline: 120, meetsGuideline: 200, exceedsGuideline: 400 };
        data.activity = { minutes: minuteMap[level] };
      } else {
        data.activity = { minutes: 'skip' };
      }
      // Store sedentary work for narrative
      const sedWork = document.querySelector('input[name="sedentary-work"]:checked')?.value;
      if (sedWork) data.sedentaryWork = sedWork === 'yes';
    }

    // Diet - same name/value attributes, just warmer labels
    if (state.skipped.has('diet')) {
      data.diet = { fruitVeg: 'skip', ultraProcessed: 'skip' };
    } else {
      data.diet = {
        fruitVeg: document.querySelector('input[name="fruit-veg"]:checked')?.value || 'skip',
        ultraProcessed: document.querySelector('input[name="ultra-processed"]:checked')?.value || 'skip'
      };
    }

    // Sleep - same hours input plus new quality radio
    if (state.skipped.has('sleep')) {
      data.sleep = { hours: 'skip' };
    } else {
      const hrs = $('#sleep-hours').value;
      data.sleep = { hours: hrs !== '' ? parseFloat(hrs) : 'skip' };
      const quality = document.querySelector('input[name="sleep-quality"]:checked')?.value;
      if (quality) data.sleep.quality = quality;
    }

    // Mental health - same name/value
    if (state.skipped.has('mentalHealth')) {
      data.mentalHealth = { depression: 'skip', loneliness: 'skip' };
    } else {
      data.mentalHealth = {
        depression: document.querySelector('input[name="depression"]:checked')?.value || 'skip',
        loneliness: document.querySelector('input[name="loneliness"]:checked')?.value || 'skip'
      };
    }

    // Social - same name/value
    if (state.skipped.has('social')) {
      data.social = { livingAlone: 'skip', frequency: 'skip' };
    } else {
      const livingAlone = document.querySelector('input[name="living-alone"]:checked')?.value;
      data.social = {
        livingAlone: livingAlone === 'yes' ? true : livingAlone === 'no' ? false : 'skip',
        frequency: document.querySelector('input[name="social-frequency"]:checked')?.value || 'skip'
      };
    }

    // Conditions - same checkboxes
    if (state.skipped.has('conditions')) {
      data.conditions = 'skip';
    } else {
      const checked = Array.from($$('input[name="conditions"]:checked')).map(el => el.value);
      data.conditions = checked;
    }

    // Family history - filter out 'unsure'
    if (state.skipped.has('familyHistory')) {
      data.familyHistory = 'skip';
    } else {
      const checked = Array.from($$('input[name="family-history"]:checked'))
        .map(el => el.value)
        .filter(v => v !== 'unsure');
      data.familyHistory = checked;
    }

    // Stress - same name/value, plus informational coping
    if (state.skipped.has('stress')) {
      data.stress = { level: 'skip' };
    } else {
      data.stress = {
        level: document.querySelector('input[name="stress-level"]:checked')?.value || 'skip'
      };
      const coping = document.querySelector('input[name="stress-coping"]:checked')?.value;
      if (coping) data.stress.coping = coping;
    }

    return data;
  }

  function renderStage2Results() {
    const r = state.stage2Result;
    if (!r) return;

    // LE range display
    const range2 = formatLERange(r.adjustedExpectedAge);
    $('#s2-le-age').textContent = range2.display;
    $('#s2-le-precise').textContent = `(based on an estimate of ~${r.adjustedExpectedAge.toFixed(0)})`;
    $('#s2-hle-age').textContent = r.healthyLE.toFixed(0);

    // Life Journey chart
    renderLifeChart('#s2-life-chart', state.profile.age, state.stage1Result.baseline.expectedAge, r.adjustedExpectedAge);

    // Comparison to baseline
    const comp = r.comparisonToBaseline;
    const compEl = $('#s2-le-comparison');
    if (comp > 0) {
      compEl.innerHTML = `<span class="positive">+${comp.toFixed(1)} years</span> compared to the UK average for your age and sex`;
    } else if (comp < 0) {
      compEl.innerHTML = `<span class="negative">${comp.toFixed(1)} years</span> compared to the UK average for your age and sex`;
    } else {
      compEl.innerHTML = `<span class="neutral">On par</span> with the UK average for your age and sex`;
    }

    // Factor chart
    renderFactorChart(r.adjustments);

    // Skipped factors note
    if (r.skippedFactors.length > 0) {
      const noteEl = $('#s2-skipped-note');
      noteEl.classList.remove('hidden');
      const skippedNames = r.skippedFactors.map(f => f.label).join(', ');
      noteEl.textContent = `Skipped: ${skippedNames}. No adjustment was made for these factors.`;
    }

    // Narrative summary
    const narrativeHtml = LifeSpanCalc.generateNarrativeSummary(r.recommendations);
    const narrativeEl = $('#s2-narrative-summary');
    if (narrativeHtml) {
      narrativeEl.innerHTML = narrativeHtml;
      narrativeEl.classList.remove('hidden');
    }

    // Recommendations
    renderRecommendations(r.recommendations, '#s2-recommendations');

    // Show overlap footer if multiple recommendations
    if (r.recommendations.length > 1) {
      $('#s2-overlap-footer').classList.remove('hidden');
    }

    // Render What If panel
    renderWhatIfPanel();

    // Show results, hide form
    $('#stage2-form').classList.add('hidden');
    $('#stage2-results').classList.remove('hidden');

    updateProgress(2, 'completed');
    $('#stage2-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderFactorChart(adjustments) {
    const chart = $('#s2-factor-chart');

    // Find max absolute value for scaling
    const maxAbs = Math.max(
      ...adjustments.map(a => Math.abs(a.value)),
      1 // minimum scale
    );

    chart.innerHTML = adjustments.map(adj => {
      let valueClass, valueText;

      if (adj.skipped) {
        valueClass = 'skipped';
        valueText = 'skipped';
      } else if (adj.value > 0) {
        valueClass = 'positive';
        valueText = `+${adj.value.toFixed(1)}`;
      } else if (adj.value < 0) {
        valueClass = 'negative';
        valueText = adj.value.toFixed(1);
      } else {
        valueClass = 'neutral';
        valueText = '0';
      }

      const barWidth = adj.skipped ? 0 : (Math.abs(adj.value) / maxAbs) * 50;
      const barClass = adj.value > 0 ? 'positive' : adj.value < 0 ? 'negative' : 'neutral';

      let barStyle = '';
      if (adj.value > 0) {
        barStyle = `left: 50%; width: ${barWidth}%;`;
      } else if (adj.value < 0) {
        barStyle = `right: 50%; width: ${barWidth}%;`;
      }

      return `
        <div class="factor-bar">
          <span class="factor-label">${escapeHTML(adj.label)}</span>
          <div class="factor-bar-track">
            <div class="factor-bar-fill ${barClass}" style="${barStyle}"></div>
          </div>
          <span class="factor-value ${valueClass}">${valueText}</span>
        </div>
      `;
    }).join('');
  }

  function renderRecommendations(recs, containerSelector) {
    const container = $(containerSelector);

    if (recs.length === 0) {
      container.innerHTML = '<p class="card-note">No specific concerns identified. Keep up the good work!</p>';
      return;
    }

    container.innerHTML = recs.map((rec, i) => `
      <div class="rec-item">
        <div>
          <span class="rec-rank">${i + 1}</span>
          <h4>${escapeHTML(rec.title)}</h4>
          ${rec.potentialGain ? `<span class="rec-gain">${escapeHTML(rec.potentialGain)}</span>` : ''}
        </div>
        <p>${escapeHTML(rec.description)}</p>
        <p class="rec-action">${escapeHTML(rec.action)}</p>
        ${rec.resources ? renderResources(rec.resources) : ''}
        <p class="citation">${escapeHTML(rec.citation)}</p>
      </div>
    `).join('');
  }

  function renderResources(resources) {
    if (!resources || resources.length === 0) return '';

    const typeBadge = (type) => {
      const labels = { video: 'Video', book: 'Book', link: 'Link', article: 'Link' };
      return `<span class="resource-badge resource-badge-${type}">${labels[type] || 'Link'}</span>`;
    };

    return `<div class="rec-resources">${resources.map(r => {
      const url = r.url;
      const titleHtml = url
        ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(r.title)}</a>`
        : `<span>${escapeHTML(r.title)}${r.author ? ' by ' + escapeHTML(r.author) : ''}</span>`;

      return `<div class="resource-item">
        ${typeBadge(r.type)}
        ${titleHtml}
        ${r.note ? `<span class="resource-note">${escapeHTML(r.note)}</span>` : ''}
      </div>`;
    }).join('')}</div>`;
  }

  // ============================================================
  // STAGE 3: HEALTH TESTS
  // ============================================================

  function bindStage3Form() {
    $('#stage3-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const tests = {};
      const testInputs = {
        restingHeartRate: '#test-rhr',
        pushUps: '#test-pushups',
        sitToStand: '#test-sitstand',
        singleLegBalance: '#test-balance',
        waistCircumference: '#test-waist',
        gripStrength: '#test-grip',
        bloodPressure: '#test-bp',
        totalCholesterol: '#test-cholesterol',
        hba1c: '#test-hba1c'
      };

      for (const [key, selector] of Object.entries(testInputs)) {
        const val = $(selector).value;
        tests[key] = val !== '' ? val : null;
      }

      state.tests = tests;

      const conditions = state.lifestyle.conditions === 'skip' ? [] : (state.lifestyle.conditions || []);

      state.stage3Result = LifeSpanCalc.calculateStage3(
        state.stage2Result,
        tests,
        state.profile.sex,
        state.profile.age,
        conditions,
        state.stage1Result.baseline.expectedAge
      );

      renderStage3Results();
    });
  }

  function renderStage3Results() {
    const r = state.stage3Result;
    if (!r) return;

    // LE range display
    const range3 = formatLERange(r.adjustedExpectedAge);
    $('#s3-le-age').textContent = range3.display;
    $('#s3-le-precise').textContent = `(based on an estimate of ~${r.adjustedExpectedAge.toFixed(0)})`;
    const remaining3 = r.adjustedExpectedAge - state.profile.age;
    $('#s3-le-remaining').textContent = Math.round(remaining3);
    $('#s3-hle-age').textContent = r.healthyLE.toFixed(0);

    // Life Journey chart
    renderLifeChart('#s3-life-chart', state.profile.age, state.stage1Result.baseline.expectedAge, r.adjustedExpectedAge);

    // Comparison
    const baselineLE = state.stage1Result.baseline.expectedAge;
    const diff = r.adjustedExpectedAge - baselineLE;
    const compEl = $('#s3-le-comparison');
    if (diff > 0) {
      compEl.innerHTML = `<span class="positive">+${diff.toFixed(1)} years</span> compared to the UK average for your age and sex`;
    } else if (diff < 0) {
      compEl.innerHTML = `<span class="negative">${diff.toFixed(1)} years</span> compared to the UK average for your age and sex`;
    } else {
      compEl.innerHTML = `<span class="neutral">On par</span> with the UK average for your age and sex`;
    }

    // Test results grid
    const testGrid = $('#s3-test-results');
    if (r.testResults.length === 0) {
      testGrid.innerHTML = '<p class="card-note">No health tests were entered.</p>';
    } else {
      testGrid.innerHTML = r.testResults.map(t => `
        <div class="test-result-item ${t.colour}">
          <div class="test-result-label">${escapeHTML(t.label)}</div>
          <div class="test-result-value">${t.value} ${escapeHTML(t.unit)}</div>
          <div class="test-result-rating ${t.colour}">${escapeHTML(t.rating)}</div>
          ${t.deduplicatedNote ? `<div class="citation">${escapeHTML(t.deduplicatedNote)}</div>` : ''}
        </div>
      `).join('');
    }

    // Combined recommendations (Stage 2 + Stage 3)
    const allRecs = [
      ...(state.stage2Result?.recommendations || []),
      ...(r.testRecommendations || [])
    ];

    // Deduplicate by title
    const seen = new Set();
    const uniqueRecs = allRecs.filter(rec => {
      if (seen.has(rec.title)) return false;
      seen.add(rec.title);
      return true;
    });

    // Re-sort by impact
    uniqueRecs.sort((a, b) => b.impact - a.impact);

    // Narrative summary for Stage 3
    const narrativeHtml3 = LifeSpanCalc.generateNarrativeSummary(uniqueRecs);
    const narrativeEl3 = $('#s3-narrative-summary');
    if (narrativeHtml3) {
      narrativeEl3.innerHTML = narrativeHtml3;
      narrativeEl3.classList.remove('hidden');
    }

    renderRecommendations(uniqueRecs, '#s3-all-recommendations');

    // Show overlap footer if multiple recommendations
    if (uniqueRecs.length > 1) {
      $('#s3-overlap-footer').classList.remove('hidden');
    }

    // Show results, hide form
    $('#stage3-form').classList.add('hidden');
    $('#stage3-results').classList.remove('hidden');

    updateProgress(3, 'completed');
    $('#stage3-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ============================================================
  // WHAT-IF SCENARIO PANEL
  // ============================================================

  // Factor keys that are non-toggleable (fixed facts the user can't change)
  const NON_TOGGLEABLE = new Set(['conditions', 'familyHistory']);

  // Map from adjustment label to factor key used in lifestyle data
  const LABEL_TO_KEY = {
    'Smoking': 'smoking',
    'Alcohol': 'alcohol',
    'Physical activity': 'activity',
    'Diet': 'diet',
    'Sleep': 'sleep',
    'Mental wellbeing': 'mentalHealth',
    'Social connections': 'social',
    'Existing conditions': 'conditions',
    'Family history': 'familyHistory',
    'Work stress': 'stress'
  };

  // Friendly descriptions of what "optimal" means for each factor
  const OPTIMAL_DESCRIPTIONS = {
    smoking: 'Never smoked',
    alcohol: 'Non-drinker',
    activity: 'Very active (300+ min/week)',
    diet: '5+ fruit & veg, rarely processed food',
    sleep: '7-8 hours, good quality',
    mentalHealth: 'Good mental health, well connected',
    social: 'Daily social contact, not living alone',
    stress: 'Low stress'
  };

  function getImprovableFactors(stage2Result) {
    const optimals = LifeSpanCalc.whatIfOptimals;
    const factors = [];

    for (const adj of stage2Result.adjustments) {
      const key = LABEL_TO_KEY[adj.label];
      if (!key || NON_TOGGLEABLE.has(key) || adj.skipped) continue;

      const optimal = optimals[key];
      if (!optimal) continue;

      // The gain is the difference between optimal adjustment and current adjustment
      const gain = optimal.adjustment - adj.value;

      // Only show if gain is meaningful (> 0.1 years)
      if (gain > 0.1) {
        factors.push({
          key,
          label: adj.label,
          currentValue: adj.value,
          optimalValue: optimal.adjustment,
          gain: Math.round(gain * 10) / 10,
          detail: adj.detail,
          optimalDescription: OPTIMAL_DESCRIPTIONS[key]
        });
      }
    }

    // Sort by gain descending
    factors.sort((a, b) => b.gain - a.gain);
    return factors;
  }

  function renderWhatIfPanel() {
    const panel = $('#whatif-panel');
    const togglesContainer = $('#whatif-toggles');

    state.whatIfFactors = getImprovableFactors(state.stage2Result);
    state.whatIfToggled.clear();

    // If no improvable factors, keep panel hidden
    if (state.whatIfFactors.length === 0) {
      panel.classList.add('hidden');
      return;
    }

    // Set initial LE display to current Stage 2 result
    const range = formatLERange(state.stage2Result.adjustedExpectedAge);
    $('#whatif-le-age').textContent = range.display;
    $('#whatif-gain').classList.add('hidden');
    $('#whatif-footer').classList.add('hidden');

    // Build toggle cards
    togglesContainer.innerHTML = state.whatIfFactors.map(factor => `
      <div class="whatif-toggle-item" data-factor="${factor.key}">
        <div class="whatif-toggle-info">
          <div class="whatif-toggle-label">${escapeHTML(factor.label)}</div>
          <div class="whatif-toggle-detail">${escapeHTML(factor.optimalDescription)}</div>
        </div>
        <span class="whatif-toggle-gain">+${factor.gain.toFixed(1)} yrs</span>
        <label class="whatif-switch">
          <input type="checkbox" data-whatif-key="${factor.key}">
          <span class="whatif-switch-slider"></span>
        </label>
      </div>
    `).join('');

    // Bind toggle events
    togglesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const key = e.target.dataset.whatifKey;
        const item = e.target.closest('.whatif-toggle-item');

        if (e.target.checked) {
          state.whatIfToggled.add(key);
          item.classList.add('active');
        } else {
          state.whatIfToggled.delete(key);
          item.classList.remove('active');
        }

        updateWhatIfResults();
      });
    });

    // Show the panel
    panel.classList.remove('hidden');
  }

  function updateWhatIfResults() {
    if (state.whatIfToggled.size === 0) {
      // Restore original display
      const range = formatLERange(state.stage2Result.adjustedExpectedAge);
      animateLENumber($('#whatif-le-age'), range.display);
      $('#whatif-gain').classList.add('hidden');
      $('#whatif-footer').classList.add('hidden');

      // Restore original factor chart
      renderFactorChart(state.stage2Result.adjustments);
      return;
    }

    // Calculate what-if result
    const whatIfResult = LifeSpanCalc.calculateWhatIf(
      state.stage1Result,
      state.lifestyle,
      Array.from(state.whatIfToggled)
    );

    // Update what-if display
    const gain = whatIfResult.adjustedExpectedAge - state.stage2Result.adjustedExpectedAge;
    updateWhatIfDisplay(whatIfResult.adjustedExpectedAge, gain);

    // Update factor chart to show what-if adjustments
    renderFactorChart(whatIfResult.adjustments);
  }

  function updateWhatIfDisplay(newLE, gain) {
    const range = formatLERange(newLE);
    animateLENumber($('#whatif-le-age'), range.display);

    // Show gain
    const gainEl = $('#whatif-gain');
    const gainText = $('#whatif-gain-text');
    if (gain > 0) {
      gainText.textContent = `+${gain.toFixed(1)} years potential gain`;
      gainEl.classList.remove('hidden');
    } else {
      gainEl.classList.add('hidden');
    }

    // Show encouragement footer
    $('#whatif-footer').classList.remove('hidden');
  }

  function animateLENumber(element, newText) {
    // Fade out
    element.classList.add('fade-out');
    element.classList.remove('pop-in');

    setTimeout(() => {
      element.textContent = newText;
      element.classList.remove('fade-out');
      element.classList.add('pop-in');

      // Clean up animation class after it completes
      setTimeout(() => {
        element.classList.remove('pop-in');
      }, 300);
    }, 150);
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  function bindNavigation() {
    // Stage 1 -> Stage 2
    $('#btn-to-stage2').addEventListener('click', () => {
      switchStage(2);
    });

    // Stage 2 -> Stage 1
    $('#btn-back-to-s1').addEventListener('click', () => {
      switchStage(1);
    });

    // Stage 2 -> Stage 3
    $('#btn-to-stage3').addEventListener('click', () => {
      switchStage(3);
    });

    // Stage 3 -> Stage 2
    $('#btn-back-to-s2').addEventListener('click', () => {
      switchStage(2);
    });

    // Start over
    $('#btn-start-over').addEventListener('click', () => {
      if (confirm('Start a new assessment? Your current results will be cleared.')) {
        resetAll();
      }
    });
  }

  function switchStage(stageNum) {
    $$('.stage').forEach(s => s.classList.remove('active'));
    const target = $(`#stage${stageNum}`);
    target.classList.remove('hidden');
    target.classList.add('active');
    updateProgress(stageNum, 'active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress(activeStep, status) {
    $$('.progress-step').forEach(step => {
      const stepNum = parseInt(step.dataset.step, 10);
      step.classList.remove('active', 'completed');

      if (stepNum < activeStep) {
        step.classList.add('completed');
      } else if (stepNum === activeStep) {
        step.classList.add(status === 'completed' ? 'completed' : 'active');
      }
    });
  }

  function resetAll() {
    state.profile = null;
    state.stage1Result = null;
    state.lifestyle = {};
    state.stage2Result = null;
    state.tests = {};
    state.stage3Result = null;
    state.skipped.clear();
    state.whatIfFactors = [];
    state.whatIfToggled.clear();

    // Reset forms
    $('#stage1-form').reset();
    $('#stage2-form').reset();
    $('#stage3-form').reset();

    // Show forms, hide results
    $('#stage1-form').classList.remove('hidden');
    $('#stage1-results').classList.add('hidden');
    $('#stage2-form').classList.remove('hidden');
    $('#stage2-results').classList.add('hidden');
    $('#stage3-form').classList.remove('hidden');
    $('#stage3-results').classList.add('hidden');

    // Reset units
    state.units = 'metric';
    $$('.toggle-btn').forEach(b => b.classList.remove('active'));
    $('[data-units="metric"]').classList.add('active');
    $('#weight-metric').classList.remove('hidden');
    $('#weight-imperial').classList.add('hidden');
    $('#height-metric').classList.remove('hidden');
    $('#height-imperial').classList.add('hidden');

    // Reset skip states
    $$('.btn-skip').forEach(btn => {
      btn.classList.remove('skipped');
      btn.textContent = 'Skip';
    });
    $$('.question-body').forEach(body => body.classList.remove('skipped'));

    // Reset conditional visibility
    $$('.conditional').forEach(c => c.classList.add('hidden'));

    // Reset skipped note
    $('#s2-skipped-note').classList.add('hidden');

    // Reset What If panel
    const whatifPanel = $('#whatif-panel');
    if (whatifPanel) whatifPanel.classList.add('hidden');

    // Reset narrative summaries and overlap footers
    ['#s2-narrative-summary', '#s3-narrative-summary'].forEach(sel => {
      const el = $(sel);
      if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
    });
    ['#s2-overlap-footer', '#s3-overlap-footer'].forEach(sel => {
      const el = $(sel);
      if (el) el.classList.add('hidden');
    });

    // Reset life charts
    ['#s1-life-chart', '#s2-life-chart', '#s3-life-chart'].forEach(sel => {
      const el = $(sel);
      if (el) el.innerHTML = '';
    });

    switchStage(1);
  }

  // ============================================================
  // SKIP BUTTONS
  // ============================================================

  function bindSkipButtons() {
    $$('.btn-skip').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.skip;
        const questionBody = $(`#q-${section}`);

        if (state.skipped.has(section)) {
          state.skipped.delete(section);
          btn.classList.remove('skipped');
          btn.textContent = 'Skip';
          questionBody.classList.remove('skipped');
        } else {
          state.skipped.add(section);
          btn.classList.add('skipped');
          btn.textContent = 'Skipped';
          questionBody.classList.add('skipped');
        }
      });
    });
  }

  // ============================================================
  // CONDITIONAL QUESTIONS
  // ============================================================

  function bindConditionals() {
    // Smoking conditionals (new radio name)
    $$('input[name="smoking-ever"]').forEach(radio => {
      radio.addEventListener('change', () => {
        $('#cond-former-smoker').classList.toggle('hidden', radio.value !== 'former');
        $('#cond-current-smoker').classList.toggle('hidden', radio.value !== 'current');
      });
    });

    // Alcohol spread follow-up for moderate/heavy/veryHeavy
    $$('input[name="alcohol-pattern"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const showSpread = ['moderate', 'heavy', 'veryHeavy'].includes(radio.value);
        $('#cond-alcohol-spread').classList.toggle('hidden', !showSpread);
      });
    });
  }

  // ============================================================
  // SOURCES MODAL
  // ============================================================

  function bindSourcesModal() {
    $('#btn-show-sources').addEventListener('click', () => {
      renderSourcesModal();
      $('#sources-modal').classList.remove('hidden');
    });

    $('#btn-close-sources').addEventListener('click', () => {
      $('#sources-modal').classList.add('hidden');
    });

    $('#sources-modal').addEventListener('click', (e) => {
      if (e.target === $('#sources-modal')) {
        $('#sources-modal').classList.add('hidden');
      }
    });
  }

  function renderSourcesModal() {
    const sources = new Set();

    // Collect all citations from data
    LifeSpanData.genericAdvice.forEach(a => sources.add(a.citation));

    const lf = LifeSpanData.lifestyleFactors;
    sources.add(lf.smoking.citation);
    sources.add(lf.smoking.quitCitation);
    sources.add(lf.alcohol.citation);
    sources.add(lf.activity.citation);
    sources.add(lf.diet.citation);
    sources.add(lf.diet.fruitVegCitation);
    sources.add(lf.sleep.citation);
    sources.add(lf.mentalHealth.citation);
    sources.add(lf.mentalHealth.lonelinessCitation);
    sources.add(lf.social.citation);
    sources.add(lf.familyHistory.citation);
    sources.add(lf.stress.citation);

    Object.values(lf.conditions).forEach(c => sources.add(c.citation));
    Object.values(LifeSpanData.healthTests).forEach(t => sources.add(t.citation));

    sources.add(LifeSpanData.combinedLifestyleRef.citation);
    sources.add('Office for National Statistics. National Life Tables, UK, 2020-2022.');
    sources.add('Office for National Statistics. Health State Life Expectancies, UK, 2018-2020.');
    sources.add('Office for National Statistics. Deaths Registered in England and Wales, 2022.');

    const sourcesList = $('#sources-list');
    sourcesList.innerHTML = Array.from(sources).map(s =>
      `<div class="source-item">${escapeHTML(s)}</div>`
    ).join('');
  }

  // ============================================================
  // PRINT
  // ============================================================

  function bindPrintButtons() {
    $('#btn-print-s1').addEventListener('click', () => window.print());
    $('#btn-print-s2').addEventListener('click', () => window.print());
    $('#btn-print-final').addEventListener('click', () => window.print());
  }

  // ============================================================
  // RANGE FORMATTING
  // ============================================================

  function formatLERange(expectedAge) {
    const low = expectedAge - 3;
    const high = expectedAge + 3;

    function describeAge(age) {
      const decade = Math.floor(age / 10) * 10;
      const pos = age - decade;
      const decadeWords = {
        40: '40s', 50: '50s', 60: '60s', 70: '70s', 80: '80s', 90: '90s', 100: '100s'
      };
      const dw = decadeWords[decade] || decade + 's';
      if (pos < 4) return 'early ' + dw;
      if (pos < 7) return 'mid-' + dw;
      return 'late ' + dw;
    }

    const lowDesc = describeAge(low);
    const highDesc = describeAge(high);

    let display;
    if (lowDesc === highDesc) {
      display = lowDesc;
    } else {
      display = lowDesc + ' to ' + highDesc;
    }

    return {
      display,
      low: Math.round(low * 10) / 10,
      mid: Math.round(expectedAge * 10) / 10,
      high: Math.round(high * 10) / 10
    };
  }

  // ============================================================
  // LIFE JOURNEY CHART (inline SVG)
  // ============================================================

  function renderLifeChart(containerId, currentAge, onsBaseline, adjustedLE) {
    const container = $(containerId);
    if (!container) return;

    const width = 720;
    const height = 180;
    const padL = 20;
    const padR = 20;
    const trackW = width - padL - padR;

    // The main path sits at this Y, with a gentle curve
    const pathY = 95;
    const pathH = 18; // track thickness

    function xPos(age) {
      return padL + (Math.min(Math.max(age, 0), 100) / 100) * trackW;
    }

    // Gentle sine curve for the path - subtle, not dramatic
    function yOff(age) {
      return Math.sin((age / 100) * Math.PI) * -12;
    }

    function yAt(age) {
      return pathY + yOff(age);
    }

    // Healthy LE estimate (roughly 77% of remaining years are healthy)
    const sex = state.profile?.sex || 'male';
    const hleRatio = LifeSpanData.hleRatio[sex] || 0.75;
    const healthyLE = currentAge + (adjustedLE - currentAge) * hleRatio;

    // Range bands
    const avgLow = onsBaseline - 3;
    const avgHigh = onsBaseline + 3;
    const userLow = adjustedLE - 3;
    const userHigh = adjustedLE + 3;

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="life-chart-svg" xmlns="http://www.w3.org/2000/svg">`;

    // --- Defs: gradients ---
    svg += `<defs>`;
    // Lived years gradient (green-to-teal)
    svg += `<linearGradient id="grad-lived-${containerId.replace('#','')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#16a34a" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#0f766e" stop-opacity="0.7"/>
    </linearGradient>`;
    // Future years gradient (fades out)
    svg += `<linearGradient id="grad-future-${containerId.replace('#','')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#e5e7eb" stop-opacity="1"/>
      <stop offset="100%" stop-color="#e5e7eb" stop-opacity="0.4"/>
    </linearGradient>`;
    // Pulse animation for the "You" marker
    svg += `<style>
      @keyframes pulse-ring { 0% { r: 10; opacity: 0.4; } 100% { r: 18; opacity: 0; } }
      .pulse-ring { animation: pulse-ring 2s ease-out infinite; }
    </style>`;
    svg += `</defs>`;

    // --- Life stage zones (subtle background) ---
    const stages = [
      { from: 0, to: 18, label: 'Growing up', colour: '#f0fdf4' },
      { from: 18, to: 66, label: 'Working years', colour: '#f8fafc' },
      { from: 66, to: 85, label: 'Retirement', colour: '#fefce8' },
      { from: 85, to: 100, label: 'Later life', colour: '#fef2f2' }
    ];

    for (const s of stages) {
      const x1 = xPos(s.from);
      const x2 = xPos(s.to);
      const topY = pathY - 30 + yOff((s.from + s.to) / 2);
      svg += `<rect x="${x1}" y="${topY - 5}" width="${x2 - x1}" height="${pathH + 40}" rx="4" fill="${s.colour}" opacity="0.8"/>`;
      svg += `<text x="${(x1 + x2) / 2}" y="${pathY + 42 + yOff((s.from + s.to) / 2)}" text-anchor="middle" fill="#9ca3af" font-size="9" font-weight="500">${s.label}</text>`;
    }

    // --- Main track (curved path as a fat rounded line) ---
    // Build the path as a series of points
    let pathPoints = [];
    for (let a = 0; a <= 100; a += 2) {
      pathPoints.push(`${xPos(a)},${yAt(a)}`);
    }

    // Background track (full 0-100)
    svg += `<polyline points="${pathPoints.join(' ')}" fill="none" stroke="#e5e7eb" stroke-width="${pathH}" stroke-linecap="round" stroke-linejoin="round"/>`;

    // --- Lived years (gradient fill from 0 to current age) ---
    let livedPoints = [];
    for (let a = 0; a <= currentAge; a += 2) {
      livedPoints.push(`${xPos(a)},${yAt(a)}`);
    }
    livedPoints.push(`${xPos(currentAge)},${yAt(currentAge)}`);
    svg += `<polyline points="${livedPoints.join(' ')}" fill="none" stroke="url(#grad-lived-${containerId.replace('#','')})" stroke-width="${pathH}" stroke-linecap="round" stroke-linejoin="round"/>`;

    // --- Healthy years band (brighter section from current age to healthy LE) ---
    if (healthyLE > currentAge) {
      let healthyPoints = [];
      const hleEnd = Math.min(healthyLE, 100);
      for (let a = currentAge; a <= hleEnd; a += 2) {
        healthyPoints.push(`${xPos(a)},${yAt(a)}`);
      }
      healthyPoints.push(`${xPos(hleEnd)},${yAt(hleEnd)}`);
      svg += `<polyline points="${healthyPoints.join(' ')}" fill="none" stroke="#16a34a" stroke-width="${pathH}" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>`;
    }

    // --- Declining health years (from healthy LE to total LE, amber) ---
    if (adjustedLE > healthyLE) {
      let decliningPoints = [];
      const start = Math.max(healthyLE, currentAge);
      const end = Math.min(adjustedLE, 100);
      for (let a = start; a <= end; a += 2) {
        decliningPoints.push(`${xPos(a)},${yAt(a)}`);
      }
      decliningPoints.push(`${xPos(end)},${yAt(end)}`);
      svg += `<polyline points="${decliningPoints.join(' ')}" fill="none" stroke="#f59e0b" stroke-width="${pathH}" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>`;
    }

    // --- UK average marker ---
    svg += `<line x1="${xPos(onsBaseline)}" y1="${yAt(onsBaseline) - pathH/2 - 4}" x2="${xPos(onsBaseline)}" y2="${yAt(onsBaseline) + pathH/2 + 4}" stroke="#0f766e" stroke-width="2" stroke-dasharray="3,2"/>`;
    // Average label - position above or below depending on space
    const avgLabelY = yAt(onsBaseline) - pathH/2 - 10;
    svg += `<text x="${xPos(onsBaseline)}" y="${avgLabelY}" text-anchor="middle" fill="#0f766e" font-size="10" font-weight="600">UK average</text>`;

    // --- User's projected LE marker (if different from baseline) ---
    const showUser = containerId !== '#s1-life-chart' || Math.abs(adjustedLE - onsBaseline) > 0.5;
    if (showUser) {
      const userColour = adjustedLE >= onsBaseline ? '#16a34a' : '#dc2626';
      svg += `<line x1="${xPos(adjustedLE)}" y1="${yAt(adjustedLE) - pathH/2 - 4}" x2="${xPos(adjustedLE)}" y2="${yAt(adjustedLE) + pathH/2 + 4}" stroke="${userColour}" stroke-width="2.5"/>`;
      // Label - offset to avoid overlap with average label
      const userLabelY = yAt(adjustedLE) + pathH/2 + 16;
      svg += `<text x="${xPos(adjustedLE)}" y="${userLabelY}" text-anchor="middle" fill="${userColour}" font-size="10" font-weight="700">Your estimate</text>`;
    }

    // --- "You are here" marker (big, prominent, with pulse) ---
    const youX = xPos(currentAge);
    const youY = yAt(currentAge);
    // Pulse ring
    svg += `<circle cx="${youX}" cy="${youY}" r="10" fill="none" stroke="#1f2937" stroke-width="2" class="pulse-ring" opacity="0.3"/>`;
    // Main dot
    svg += `<circle cx="${youX}" cy="${youY}" r="9" fill="#1f2937" stroke="#fff" stroke-width="3"/>`;
    // Inner dot
    svg += `<circle cx="${youX}" cy="${youY}" r="3" fill="#fff"/>`;
    // Label
    svg += `<text x="${youX}" y="${youY - 18}" text-anchor="middle" fill="#1f2937" font-size="11" font-weight="800">You are here</text>`;
    svg += `<text x="${youX}" y="${youY - 7}" text-anchor="middle" fill="#6b7280" font-size="9">age ${currentAge}</text>`;

    // --- Decade tick marks ---
    for (let d = 0; d <= 100; d += 10) {
      if (d === 0) continue; // skip 0
      const x = xPos(d);
      const y = yAt(d);
      svg += `<line x1="${x}" y1="${y + pathH/2 + 2}" x2="${x}" y2="${y + pathH/2 + 6}" stroke="#d1d5db" stroke-width="1"/>`;
      svg += `<text x="${x}" y="${y + pathH/2 + 16}" text-anchor="middle" fill="#c0c4cc" font-size="8">${d}</text>`;
    }

    // --- Legend ---
    const legY = height - 8;
    svg += `<circle cx="${padL + 10}" cy="${legY}" r="4" fill="#16a34a" opacity="0.5"/>`;
    svg += `<text x="${padL + 20}" y="${legY + 3}" fill="#6b7280" font-size="8">Healthy years</text>`;
    svg += `<circle cx="${padL + 100}" cy="${legY}" r="4" fill="#f59e0b" opacity="0.5"/>`;
    svg += `<text x="${padL + 110}" y="${legY + 3}" fill="#6b7280" font-size="8">Later years</text>`;

    svg += '</svg>';
    container.innerHTML = svg;
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============================================================
  // BOOT
  // ============================================================

  document.addEventListener('DOMContentLoaded', init);

  return { state }; // Expose state for debugging

})();
