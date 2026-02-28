// LifeSpan+ Medical Evidence Data
// All data sourced from published research - citations included

const LifeSpanData = (() => {

  // ============================================================
  // ONS NATIONAL LIFE TABLES 2020-2022 (England & Wales)
  // Remaining life expectancy by age and sex
  // Source: ONS National Life Tables, UK, 2020-2022
  // ============================================================

  const onsLifeTables = {
    male: {
      0: 79.1, 1: 78.5, 2: 77.5, 3: 76.5, 4: 75.5,
      5: 74.6, 6: 73.6, 7: 72.6, 8: 71.6, 9: 70.6,
      10: 69.6, 11: 68.6, 12: 67.6, 13: 66.6, 14: 65.7,
      15: 64.7, 16: 63.7, 17: 62.7, 18: 61.7, 19: 60.8,
      20: 59.8, 21: 58.9, 22: 57.9, 23: 57.0, 24: 56.0,
      25: 55.0, 26: 54.1, 27: 53.1, 28: 52.1, 29: 51.2,
      30: 50.2, 31: 49.2, 32: 48.3, 33: 47.3, 34: 46.4,
      35: 45.4, 36: 44.4, 37: 43.5, 38: 42.5, 39: 41.6,
      40: 40.6, 41: 39.7, 42: 38.7, 43: 37.8, 44: 36.8,
      45: 35.9, 46: 35.0, 47: 34.0, 48: 33.1, 49: 32.2,
      50: 31.3, 51: 30.4, 52: 29.5, 53: 28.6, 54: 27.7,
      55: 26.8, 56: 25.9, 57: 25.1, 58: 24.2, 59: 23.4,
      60: 22.5, 61: 21.7, 62: 20.9, 63: 20.1, 64: 19.3,
      65: 18.5, 66: 17.8, 67: 17.0, 68: 16.2, 69: 15.5,
      70: 14.7, 71: 14.0, 72: 13.3, 73: 12.6, 74: 11.9,
      75: 11.2, 76: 10.5, 77: 9.9, 78: 9.3, 79: 8.7,
      80: 8.1, 81: 7.5, 82: 7.0, 83: 6.5, 84: 6.0,
      85: 5.6, 86: 5.2, 87: 4.8, 88: 4.4, 89: 4.1,
      90: 3.7, 91: 3.4, 92: 3.2, 93: 2.9, 94: 2.7,
      95: 2.5, 96: 2.3, 97: 2.1, 98: 2.0, 99: 1.8, 100: 1.7
    },
    female: {
      0: 83.0, 1: 82.4, 2: 81.4, 3: 80.4, 4: 79.4,
      5: 78.4, 6: 77.5, 7: 76.5, 8: 75.5, 9: 74.5,
      10: 73.5, 11: 72.5, 12: 71.5, 13: 70.5, 14: 69.5,
      15: 68.5, 16: 67.6, 17: 66.6, 18: 65.6, 19: 64.6,
      20: 63.6, 21: 62.7, 22: 61.7, 23: 60.7, 24: 59.7,
      25: 58.7, 26: 57.8, 27: 56.8, 28: 55.8, 29: 54.8,
      30: 53.9, 31: 52.9, 32: 51.9, 33: 51.0, 34: 50.0,
      35: 49.0, 36: 48.1, 37: 47.1, 38: 46.1, 39: 45.2,
      40: 44.2, 41: 43.3, 42: 42.3, 43: 41.3, 44: 40.4,
      45: 39.4, 46: 38.5, 47: 37.6, 48: 36.6, 49: 35.7,
      50: 34.8, 51: 33.8, 52: 32.9, 53: 32.0, 54: 31.1,
      55: 30.2, 56: 29.3, 57: 28.4, 58: 27.5, 59: 26.6,
      60: 25.7, 61: 24.8, 62: 24.0, 63: 23.1, 64: 22.3,
      65: 21.4, 66: 20.5, 67: 19.7, 68: 18.9, 69: 18.0,
      70: 17.2, 71: 16.4, 72: 15.6, 73: 14.8, 74: 14.0,
      75: 13.3, 76: 12.5, 77: 11.8, 78: 11.1, 79: 10.4,
      80: 9.7, 81: 9.0, 82: 8.4, 83: 7.8, 84: 7.2,
      85: 6.6, 86: 6.1, 87: 5.6, 88: 5.2, 89: 4.7,
      90: 4.3, 91: 4.0, 92: 3.6, 93: 3.3, 94: 3.1,
      95: 2.8, 96: 2.6, 97: 2.4, 98: 2.2, 99: 2.0, 100: 1.9
    }
  };

  // Healthy life expectancy ratios (HLE / LE at birth)
  // Source: ONS Health State Life Expectancies, UK, 2018-2020
  const hleRatio = {
    male: 0.768,   // 60.7 / 79.1
    female: 0.733  // 60.9 / 83.0
  };

  // ============================================================
  // BMI CATEGORIES AND MORTALITY IMPACT
  // Source: Bhaskaran et al., Lancet Diabetes & Endocrinology, 2018
  // "Body-mass index and all-cause mortality"
  // ============================================================

  const bmiCategories = [
    { min: 0,    max: 18.5, label: 'Underweight', colour: 'amber',  adjustment: -2.0 },
    { min: 18.5, max: 25,   label: 'Healthy weight', colour: 'green', adjustment: 0 },
    { min: 25,   max: 30,   label: 'Overweight', colour: 'amber',   adjustment: -1.0 },
    { min: 30,   max: 35,   label: 'Obese (Class I)', colour: 'red', adjustment: -2.5 },
    { min: 35,   max: 40,   label: 'Obese (Class II)', colour: 'red', adjustment: -5.0 },
    { min: 40,   max: 100,  label: 'Obese (Class III)', colour: 'red', adjustment: -8.0 }
  ];

  // ============================================================
  // TOP CAUSES OF DEATH BY AGE GROUP AND SEX
  // Source: ONS Deaths Registered, England & Wales, 2022
  // ============================================================

  const causesOfDeath = {
    male: {
      '18-34': [
        'Suicide and self-harm',
        'Accidental poisoning (inc. drug misuse)',
        'Road traffic accidents',
        'Heart disease',
        'Cancer (various)'
      ],
      '35-49': [
        'Heart disease',
        'Suicide and self-harm',
        'Accidental poisoning',
        'Liver disease (inc. alcohol-related)',
        'Lung cancer'
      ],
      '50-64': [
        'Heart disease',
        'Lung cancer',
        'Liver disease',
        'Colorectal cancer',
        'Chronic lower respiratory diseases'
      ],
      '65-79': [
        'Heart disease',
        'Lung cancer',
        'Chronic lower respiratory diseases',
        'Prostate cancer',
        'Stroke'
      ],
      '80+': [
        'Heart disease',
        'Dementia and Alzheimer\'s',
        'Chronic lower respiratory diseases',
        'Stroke',
        'Pneumonia'
      ]
    },
    female: {
      '18-34': [
        'Suicide and self-harm',
        'Accidental poisoning',
        'Breast cancer',
        'Road traffic accidents',
        'Heart disease'
      ],
      '35-49': [
        'Breast cancer',
        'Heart disease',
        'Suicide and self-harm',
        'Lung cancer',
        'Liver disease'
      ],
      '50-64': [
        'Lung cancer',
        'Breast cancer',
        'Heart disease',
        'Colorectal cancer',
        'Ovarian cancer'
      ],
      '65-79': [
        'Heart disease',
        'Lung cancer',
        'Dementia and Alzheimer\'s',
        'Breast cancer',
        'Stroke'
      ],
      '80+': [
        'Dementia and Alzheimer\'s',
        'Heart disease',
        'Stroke',
        'Chronic lower respiratory diseases',
        'Pneumonia'
      ]
    }
  };

  function getAgeGroup(age) {
    if (age < 35) return '18-34';
    if (age < 50) return '35-49';
    if (age < 65) return '50-64';
    if (age < 80) return '65-79';
    return '80+';
  }

  // ============================================================
  // GENERIC MODIFIABLE RISK FACTORS (Stage 1 advice)
  // ============================================================

  const genericAdvice = [
    {
      factor: 'Smoking',
      advice: 'If you smoke, quitting is the single biggest thing you can do for your health. Smokers lose an average of 10 years of life expectancy.',
      action: 'NHS Stop Smoking services are free and quadruple your chances of quitting successfully.',
      citation: 'Doll R, Peto R et al. "Mortality in relation to smoking: 50 years\' observations on male British doctors." BMJ. 2004;328(7455):1519.'
    },
    {
      factor: 'Physical activity',
      advice: 'Regular physical activity of 150+ minutes per week is associated with 3-5 additional years of life.',
      action: 'Aim for at least 150 minutes of moderate activity (brisk walking, cycling) per week.',
      citation: 'Arem H et al. "Leisure time physical activity and mortality." JAMA Internal Medicine. 2015;175(6):959-967.'
    },
    {
      factor: 'Healthy weight',
      advice: 'Maintaining a BMI between 18.5 and 25 is associated with the lowest risk of premature death.',
      action: 'The NHS BMI calculator can help you set a target weight and find local support.',
      citation: 'Bhaskaran K et al. "Association of BMI with overall and cause-specific mortality." Lancet Diabetes & Endocrinology. 2018;6(12):944-953.'
    },
    {
      factor: 'Moderate alcohol',
      advice: 'Drinking more than 14 units per week increases your risk of serious illness. Heavy drinking (>35 units/week) can reduce life expectancy by 4-5 years.',
      action: 'The NHS recommends no more than 14 units per week, spread over 3+ days.',
      citation: 'Wood AM et al. "Risk thresholds for alcohol consumption." Lancet. 2018;391(10129):1513-1523.'
    },
    {
      factor: 'Healthy diet',
      advice: 'A Mediterranean-style diet rich in fruits, vegetables, whole grains, and healthy fats is associated with 2-3 extra years of life.',
      action: 'Aim for at least 5 portions of fruit and vegetables per day.',
      citation: 'Sofi F et al. "Accruing evidence on benefits of adherence to the Mediterranean diet on health." BMJ. 2010;341:c6577.'
    },
    {
      factor: 'Social connections',
      advice: 'Strong social relationships are as important for survival as quitting smoking. Social isolation increases mortality risk by 26%.',
      action: 'Regular social contact, community groups, and volunteering all help maintain connections.',
      citation: 'Holt-Lunstad J et al. "Loneliness and social isolation as risk factors for mortality." Perspectives on Psychological Science. 2015;10(2):227-237.'
    }
  ];

  // ============================================================
  // LIFESTYLE RISK FACTOR ADJUSTMENTS (Stage 2)
  // Each factor has adjustment values based on published evidence
  // ============================================================

  const lifestyleFactors = {

    // SMOKING
    // Source: Doll R, Peto R et al., BMJ 2004
    // Quit benefits: Pirie K et al., Lancet 2013 ("Million Women Study")
    smoking: {
      citation: 'Doll R, Peto R et al. "Mortality in relation to smoking: 50 years\' observations on male British doctors." BMJ. 2004;328(7455):1519.',
      quitCitation: 'Pirie K et al. "The 21st century hazards of smoking and benefits of stopping." Lancet. 2013;381(9861):133-141.',
      adjustments: {
        never: 0,
        vaper: -1.0,  // Much less harmful than smoking, but not risk-free
        former: {  // by years since quit
          under5: -4.0,
          '5to10': -2.0,
          '10to15': -1.0,
          over15: 0
        },
        current: {
          light: -7.0,     // 1-9/day
          moderate: -9.0,   // 10-19/day
          heavy: -10.0      // 20+/day
        }
      }
    },

    // ALCOHOL
    // Source: Wood AM et al., Lancet 2018
    alcohol: {
      citation: 'Wood AM et al. "Risk thresholds for alcohol consumption: combined analysis of individual-participant data for 599,912 current drinkers." Lancet. 2018;391(10129):1513-1523.',
      adjustments: {
        none: 0,
        light: 0,           // 1-7 units/week
        moderate: -0.5,     // 8-14 units/week
        heavy: -2.0,        // 15-35 units/week
        veryHeavy: -4.5     // 35+ units/week
      }
    },

    // PHYSICAL ACTIVITY
    // Source: Arem H et al., JAMA Internal Medicine 2015
    activity: {
      citation: 'Arem H et al. "Leisure time physical activity and mortality: a detailed pooled analysis of the dose-response relationship." JAMA Internal Medicine. 2015;175(6):959-967.',
      adjustments: {
        sedentary: -3.5,      // <30 min/week
        low: -1.5,            // 30-74 min/week
        belowGuideline: -0.5, // 75-149 min/week
        meetsGuideline: 0,    // 150-300 min/week
        exceedsGuideline: 1.5 // 300+ min/week (vigorous or long-duration)
      }
    },

    // DIET
    // Source: Sofi F et al., BMJ 2010
    // Additional: Fadnes LT et al., PLOS Medicine 2022
    diet: {
      citation: 'Sofi F et al. "Accruing evidence on benefits of adherence to the Mediterranean diet on health: an updated systematic review and meta-analysis." BMJ. 2010;341:c6577.',
      fruitVegCitation: 'Aune D et al. "Fruit and vegetable intake and the risk of cardiovascular disease, total cancer and all-cause mortality." International Journal of Epidemiology. 2017;46(3):1029-1056.',
      adjustments: {
        fruitVeg: {
          '0-1': -2.0,
          '1-2': -1.5,
          '2-3': -1.0,
          '4-5': 0,
          '5+': 0.5
        },
        ultraProcessed: {
          rarely: 0.5,
          sometimes: 0,
          often: -1.0,
          mostly: -2.0
        }
      }
    },

    // SLEEP
    // Source: Cappuccio FP et al., JAHA 2017; Yin J et al., JAHA 2017
    sleep: {
      citation: 'Yin J et al. "Relationship of sleep duration with all-cause mortality and cardiovascular events: a systematic review and dose-response meta-analysis." Journal of the American Heart Association. 2017;6(9):e005947.',
      adjustments: {
        under5: -2.0,
        '5to6': -1.0,
        '6to7': -0.3,
        '7to8': 0,      // optimal
        '8to9': -0.3,
        over9: -1.0
      },
      qualityAdjustments: {
        good: 0,
        fair: -0.2,
        poor: -0.5,
        diagnosed: -0.5
      }
    },

    // MENTAL HEALTH
    // Source: Walker ER et al., JAMA Psychiatry 2015
    mentalHealth: {
      citation: 'Walker ER et al. "Mortality in mental disorders and global disease burden implications." JAMA Psychiatry. 2015;72(4):334-341.',
      adjustments: {
        depression: {
          none: 0,
          minimal: -0.5,
          mild: -1.5,
          moderate: -3.0,
          severe: -5.0
        },
        loneliness: {
          never: 0,
          occasional: -0.2,
          sometimes: -0.5,
          often: -1.5,
          always: -3.0
        }
      },
      lonelinessCitation: 'Holt-Lunstad J et al. "Loneliness and social isolation as risk factors for mortality: a meta-analytic review." Perspectives on Psychological Science. 2015;10(2):227-237.'
    },

    // SOCIAL CONNECTIONS
    // Source: Holt-Lunstad J et al., PLOS Medicine 2010
    social: {
      citation: 'Holt-Lunstad J, Smith TB, Layton JB. "Social relationships and mortality risk: a meta-analytic review." PLOS Medicine. 2010;7(7):e1000316.',
      adjustments: {
        livingAlone: -0.5,
        socialFrequency: {
          daily: 0.5,
          weekly: 0,
          monthly: -1.0,
          rarely: -2.5
        }
      }
    },

    // EXISTING CONDITIONS
    // Sources: Various - each condition has its own citation
    conditions: {
      diabetes: {
        adjustment: -5.0,
        citation: 'Emerging Risk Factors Collaboration. "Diabetes mellitus, fasting blood glucose concentration, and risk of vascular disease." Lancet. 2010;375(9733):2215-2222.'
      },
      heartDisease: {
        adjustment: -6.0,
        citation: 'Rapsomaniki E et al. "Blood pressure and incidence of twelve cardiovascular diseases." Lancet. 2014;383(9932):1899-1911.'
      },
      cancer: {
        adjustment: -5.0,
        citation: 'Quaresma M et al. "40-year trends in an index of survival for all cancers combined." Lancet. 2015;385(9974):1206-1218.'
      },
      copd: {
        adjustment: -5.0,
        citation: 'Shavelle RM et al. "Life expectancy and years of life lost in chronic obstructive pulmonary disease." International Journal of COPD. 2009;4:137-148.'
      },
      stroke: {
        adjustment: -5.0,
        citation: 'Hankey GJ. "Long-term outcome after ischaemic stroke/transient ischaemic attack." Cerebrovascular Diseases. 2003;16(Suppl 1):14-19.'
      },
      kidneyDisease: {
        adjustment: -4.0,
        citation: 'Tonelli M et al. "Chronic kidney disease and mortality risk: a systematic review." Journal of the American Society of Nephrology. 2006;17(7):2034-2047.'
      }
    },

    // FAMILY HISTORY
    familyHistory: {
      heartDisease: -1.5,
      cancer: -1.0,
      diabetes: -0.5,
      citation: 'Murabito JM et al. "Sibling cardiovascular disease as a risk factor." American Journal of Cardiology. 2005;96(9):1302-1306.'
    },

    // WORK STRESS
    // Source: Kivimaki M et al., Lancet 2015
    stress: {
      citation: 'Kivimaki M et al. "Long working hours and risk of coronary heart disease and stroke: a systematic review and meta-analysis." Lancet. 2015;386(10005):1739-1746.',
      adjustments: {
        low: 0.3,
        moderate: 0,
        high: -1.0,
        veryHigh: -2.5
      }
    }
  };

  // ============================================================
  // HEALTH TEST THRESHOLDS (Stage 3)
  // ============================================================

  const healthTests = {

    // HOME TESTS

    restingHeartRate: {
      label: 'Resting Heart Rate',
      unit: 'bpm',
      description: 'Sit quietly for 5 minutes, then count your pulse for 60 seconds.',
      citation: 'Zhang D et al. "Resting heart rate and all-cause and cardiovascular mortality in the general population: a meta-analysis." CMAJ. 2016;188(3):E53-E63.',
      thresholds: {
        male: [
          { min: 0,  max: 60, label: 'Excellent', colour: 'green', adjustment: 0.5 },
          { min: 60, max: 70, label: 'Good', colour: 'green', adjustment: 0 },
          { min: 70, max: 80, label: 'Average', colour: 'amber', adjustment: -0.5 },
          { min: 80, max: 90, label: 'Below average', colour: 'amber', adjustment: -1.0 },
          { min: 90, max: 250, label: 'Poor', colour: 'red', adjustment: -2.0 }
        ],
        female: [
          { min: 0,  max: 65, label: 'Excellent', colour: 'green', adjustment: 0.5 },
          { min: 65, max: 75, label: 'Good', colour: 'green', adjustment: 0 },
          { min: 75, max: 85, label: 'Average', colour: 'amber', adjustment: -0.5 },
          { min: 85, max: 95, label: 'Below average', colour: 'amber', adjustment: -1.0 },
          { min: 95, max: 250, label: 'Poor', colour: 'red', adjustment: -2.0 }
        ]
      }
    },

    pushUps: {
      label: 'Push-ups (in one go)',
      unit: 'count',
      description: 'Do as many push-ups as you can without stopping. Knee push-ups count (note which).',
      citation: 'Yang J et al. "Association between push-up exercise capacity and future cardiovascular events among active adult men." JAMA Network Open. 2019;2(2):e188341.',
      thresholds: {
        male: [
          { min: 40, max: 999, label: 'Excellent', colour: 'green', adjustment: 1.0 },
          { min: 20, max: 40,  label: 'Good', colour: 'green', adjustment: 0.3 },
          { min: 10, max: 20,  label: 'Average', colour: 'amber', adjustment: 0 },
          { min: 0,  max: 10,  label: 'Below average', colour: 'red', adjustment: -0.5 }
        ],
        female: [
          { min: 30, max: 999, label: 'Excellent', colour: 'green', adjustment: 1.0 },
          { min: 15, max: 30,  label: 'Good', colour: 'green', adjustment: 0.3 },
          { min: 5,  max: 15,  label: 'Average', colour: 'amber', adjustment: 0 },
          { min: 0,  max: 5,   label: 'Below average', colour: 'red', adjustment: -0.5 }
        ]
      }
    },

    sitToStand: {
      label: 'Sit-to-Stand (30 seconds)',
      unit: 'count',
      description: 'From a standard chair, stand up and sit down as many times as you can in 30 seconds.',
      citation: 'Brito LBB et al. "Ability to sit and rise from the floor as a predictor of all-cause mortality." European Journal of Preventive Cardiology. 2014;21(7):892-898.',
      thresholds: {
        male: [
          { min: 17, max: 999, label: 'Excellent', colour: 'green', adjustment: 0.5 },
          { min: 12, max: 17,  label: 'Good', colour: 'green', adjustment: 0 },
          { min: 8,  max: 12,  label: 'Average', colour: 'amber', adjustment: -0.3 },
          { min: 0,  max: 8,   label: 'Below average', colour: 'red', adjustment: -1.0 }
        ],
        female: [
          { min: 15, max: 999, label: 'Excellent', colour: 'green', adjustment: 0.5 },
          { min: 10, max: 15,  label: 'Good', colour: 'green', adjustment: 0 },
          { min: 6,  max: 10,  label: 'Average', colour: 'amber', adjustment: -0.3 },
          { min: 0,  max: 6,   label: 'Below average', colour: 'red', adjustment: -1.0 }
        ]
      }
    },

    singleLegBalance: {
      label: 'Single-Leg Balance',
      unit: 'seconds',
      description: 'Stand on one leg with eyes open. Time how long you can hold it (up to 60 seconds).',
      citation: 'Araujo CG et al. "Successful 10-second one-legged stance performance is associated with reduced risk of mortality in middle-aged and older individuals." British Journal of Sports Medicine. 2022;56(17):975-980.',
      thresholds: {
        // Same for both sexes
        male: [
          { min: 30, max: 999, label: 'Excellent', colour: 'green', adjustment: 0.5 },
          { min: 10, max: 30,  label: 'Good', colour: 'green', adjustment: 0 },
          { min: 5,  max: 10,  label: 'Concerning', colour: 'amber', adjustment: -1.0 },
          { min: 0,  max: 5,   label: 'Poor', colour: 'red', adjustment: -2.0 }
        ],
        female: [
          { min: 30, max: 999, label: 'Excellent', colour: 'green', adjustment: 0.5 },
          { min: 10, max: 30,  label: 'Good', colour: 'green', adjustment: 0 },
          { min: 5,  max: 10,  label: 'Concerning', colour: 'amber', adjustment: -1.0 },
          { min: 0,  max: 5,   label: 'Poor', colour: 'red', adjustment: -2.0 }
        ]
      }
    },

    waistCircumference: {
      label: 'Waist Circumference',
      unit: 'cm',
      description: 'Measure around your waist at belly button level, breathing out naturally.',
      citation: 'Cerhan JR et al. "A pooled analysis of waist circumference and mortality in 650,000 adults." Mayo Clinic Proceedings. 2014;89(3):335-345.',
      thresholds: {
        male: [
          { min: 0,   max: 94,  label: 'Healthy', colour: 'green', adjustment: 0 },
          { min: 94,  max: 102, label: 'Increased risk', colour: 'amber', adjustment: -1.0 },
          { min: 102, max: 250, label: 'High risk', colour: 'red', adjustment: -2.5 }
        ],
        female: [
          { min: 0,  max: 80,  label: 'Healthy', colour: 'green', adjustment: 0 },
          { min: 80, max: 88,  label: 'Increased risk', colour: 'amber', adjustment: -1.0 },
          { min: 88, max: 250, label: 'High risk', colour: 'red', adjustment: -2.5 }
        ]
      }
    },

    gripStrength: {
      label: 'Grip Strength',
      unit: 'kg',
      description: 'If you have a hand dynamometer, squeeze as hard as you can with your dominant hand. Take the best of 3 attempts.',
      citation: 'Leong DP et al. "Prognostic value of grip strength: findings from the Prospective Urban Rural Epidemiology (PURE) study." Lancet. 2015;386(9990):266-273.',
      thresholds: {
        male: [
          { min: 40, max: 200, label: 'Strong', colour: 'green', adjustment: 0.5 },
          { min: 30, max: 40,  label: 'Average', colour: 'green', adjustment: 0 },
          { min: 20, max: 30,  label: 'Below average', colour: 'amber', adjustment: -1.0 },
          { min: 0,  max: 20,  label: 'Weak', colour: 'red', adjustment: -2.0 }
        ],
        female: [
          { min: 25, max: 200, label: 'Strong', colour: 'green', adjustment: 0.5 },
          { min: 18, max: 25,  label: 'Average', colour: 'green', adjustment: 0 },
          { min: 12, max: 18,  label: 'Below average', colour: 'amber', adjustment: -1.0 },
          { min: 0,  max: 12,  label: 'Weak', colour: 'red', adjustment: -2.0 }
        ]
      }
    },

    // GP / MEDICAL TESTS

    bloodPressure: {
      label: 'Blood Pressure',
      unit: 'mmHg',
      description: 'Your systolic (top number) blood pressure reading.',
      citation: 'Franco OH et al. "Blood pressure in adulthood and life expectancy with cardiovascular disease in men and women." Hypertension. 2005;46(2):280-286.',
      thresholds: {
        male: [
          { min: 0,   max: 120, label: 'Optimal', colour: 'green', adjustment: 1.0 },
          { min: 120, max: 130, label: 'Normal', colour: 'green', adjustment: 0 },
          { min: 130, max: 140, label: 'Elevated', colour: 'amber', adjustment: -1.5 },
          { min: 140, max: 160, label: 'High (Stage 1)', colour: 'red', adjustment: -3.0 },
          { min: 160, max: 300, label: 'High (Stage 2)', colour: 'red', adjustment: -5.0 }
        ],
        female: [
          { min: 0,   max: 120, label: 'Optimal', colour: 'green', adjustment: 1.0 },
          { min: 120, max: 130, label: 'Normal', colour: 'green', adjustment: 0 },
          { min: 130, max: 140, label: 'Elevated', colour: 'amber', adjustment: -1.5 },
          { min: 140, max: 160, label: 'High (Stage 1)', colour: 'red', adjustment: -3.0 },
          { min: 160, max: 300, label: 'High (Stage 2)', colour: 'red', adjustment: -5.0 }
        ]
      }
    },

    totalCholesterol: {
      label: 'Total Cholesterol',
      unit: 'mmol/L',
      description: 'Your total cholesterol level from a blood test.',
      citation: 'Lewington S et al. "Blood cholesterol and vascular mortality by age, sex, and blood pressure." Lancet. 2007;370(9602):1829-1839.',
      thresholds: {
        male: [
          { min: 0,   max: 5.0, label: 'Desirable', colour: 'green', adjustment: 0.5 },
          { min: 5.0, max: 6.2, label: 'Borderline', colour: 'amber', adjustment: 0 },
          { min: 6.2, max: 7.5, label: 'High', colour: 'red', adjustment: -1.5 },
          { min: 7.5, max: 20,  label: 'Very high', colour: 'red', adjustment: -3.0 }
        ],
        female: [
          { min: 0,   max: 5.0, label: 'Desirable', colour: 'green', adjustment: 0.5 },
          { min: 5.0, max: 6.2, label: 'Borderline', colour: 'amber', adjustment: 0 },
          { min: 6.2, max: 7.5, label: 'High', colour: 'red', adjustment: -1.5 },
          { min: 7.5, max: 20,  label: 'Very high', colour: 'red', adjustment: -3.0 }
        ]
      }
    },

    hba1c: {
      label: 'HbA1c',
      unit: 'mmol/mol',
      description: 'Your HbA1c (average blood sugar) level from a blood test.',
      citation: 'Zhong GC et al. "HbA1c and all-cause mortality: a systematic review and dose-response meta-analysis." Scientific Reports. 2017;7:45804.',
      thresholds: {
        male: [
          { min: 0,  max: 42, label: 'Normal', colour: 'green', adjustment: 0 },
          { min: 42, max: 48, label: 'Pre-diabetes', colour: 'amber', adjustment: -1.5 },
          { min: 48, max: 58, label: 'Diabetes (controlled)', colour: 'red', adjustment: -3.0 },
          { min: 58, max: 200, label: 'Diabetes (poorly controlled)', colour: 'red', adjustment: -6.0 }
        ],
        female: [
          { min: 0,  max: 42, label: 'Normal', colour: 'green', adjustment: 0 },
          { min: 42, max: 48, label: 'Pre-diabetes', colour: 'amber', adjustment: -1.5 },
          { min: 48, max: 58, label: 'Diabetes (controlled)', colour: 'red', adjustment: -3.0 },
          { min: 58, max: 200, label: 'Diabetes (poorly controlled)', colour: 'red', adjustment: -6.0 }
        ]
      }
    }
  };

  // ============================================================
  // RECOMMENDATIONS DATABASE
  // Advice to show based on risk factors identified
  // ============================================================

  const recommendations = {
    smoking_current: {
      title: 'Stop smoking',
      description: 'Quitting smoking is the single most impactful change you can make. Within 1 year, your heart disease risk drops by half.',
      action: 'Contact the NHS Stop Smoking helpline: 0300 123 1044 or visit your GP.',
      potentialGain: 'Up to +10 years',
      citation: 'Doll R, Peto R et al., BMJ 2004',
      resources: [
        { type: 'book', title: 'Allen Carr\'s Easy Way to Stop Smoking', author: 'Allen Carr', note: 'The most recommended quitting book worldwide' },
        { type: 'link', title: 'NHS Smokefree', url: 'https://www.nhs.uk/better-health/quit-smoking/', note: 'Free tools, app and support from the NHS' },
        { type: 'video', title: 'What Happens When You Quit Smoking: Timeline', url: 'https://www.youtube.com/watch?v=W-cPMnGATiI', note: 'See how quickly your body starts recovering' }
      ]
    },
    vaping: {
      title: 'Consider reducing or stopping vaping',
      description: 'Vaping is significantly less harmful than smoking, but it\'s not risk-free. The long-term effects are still being studied, and nicotine itself affects your heart and blood pressure.',
      action: 'If you\'re vaping to stay off cigarettes, that\'s a positive step. If you\'d like to stop completely, your GP or local stop smoking service can help.',
      potentialGain: 'Up to +1 year',
      citation: 'McNeill A et al. "Vaping in England: evidence update." Office for Health Improvement and Disparities, 2022.',
      resources: [
        { type: 'link', title: 'NHS: Using E-cigarettes to Stop Smoking', url: 'https://www.nhs.uk/live-well/quit-smoking/using-e-cigarettes-to-stop-smoking/', note: 'NHS guidance on vaping as a quitting tool' },
        { type: 'link', title: 'NHS Better Health: Quit Smoking', url: 'https://www.nhs.uk/better-health/quit-smoking/', note: 'Free support if you want to stop vaping too' }
      ]
    },
    smoking_former_recent: {
      title: 'Stay smoke-free',
      description: 'You\'ve already made a huge step. Your risk continues to decrease the longer you stay quit.',
      action: 'If you\'re struggling, the NHS has free ongoing support.',
      potentialGain: 'Continuing to improve',
      citation: 'Pirie K et al., Lancet 2013',
      resources: [
        { type: 'link', title: 'NHS Smokefree: Staying Quit', url: 'https://www.nhs.uk/better-health/quit-smoking/', note: 'Tips for staying on track' },
        { type: 'book', title: 'Allen Carr\'s Easy Way to Stop Smoking', author: 'Allen Carr', note: 'Good reinforcement if you ever feel tempted' }
      ]
    },
    alcohol_heavy: {
      title: 'Reduce alcohol intake',
      description: 'Your alcohol consumption is above recommended levels and is affecting your life expectancy.',
      action: 'The NHS recommends no more than 14 units/week. Try alcohol-free days and track your drinks.',
      potentialGain: 'Up to +4.5 years',
      citation: 'Wood AM et al., Lancet 2018',
      resources: [
        { type: 'book', title: 'The Unexpected Joy of Being Sober', author: 'Catherine Gray', note: 'A warm, honest read about changing your relationship with alcohol' },
        { type: 'link', title: 'Club Soda UK', url: 'https://joinclubsoda.com/', note: 'Community and tools for mindful drinking' },
        { type: 'link', title: 'NHS Alcohol Support', url: 'https://www.nhs.uk/live-well/alcohol-advice/', note: 'Practical tips and unit tracker' }
      ]
    },
    activity_low: {
      title: 'Increase physical activity',
      description: 'Regular activity is one of the most powerful medicines. Even modest increases help.',
      action: 'Start with 10-minute walks and build up to 150 minutes of moderate activity per week.',
      potentialGain: 'Up to +3.5 years',
      citation: 'Arem H et al., JAMA Internal Medicine 2015',
      resources: [
        { type: 'link', title: 'NHS Couch to 5K', url: 'https://www.nhs.uk/live-well/exercise/running-and-aerobic-exercises/get-running-with-couch-to-5k/', note: 'Free 9-week plan from zero to running 5K' },
        { type: 'video', title: 'Joe Wicks: Beginner Workouts', url: 'https://www.youtube.com/c/TheBodyCoachTV', note: 'Free home workouts, no equipment needed' },
        { type: 'link', title: 'parkrun', url: 'https://www.parkrun.org.uk/', note: 'Free, friendly 5K events every Saturday. Walkers welcome' }
      ]
    },
    diet_poor: {
      title: 'Improve your diet',
      description: 'Eating more fruits, vegetables, and whole grains while reducing ultra-processed food can add years to your life.',
      action: 'Aim for 5+ portions of fruit and veg daily. Swap processed snacks for whole foods.',
      potentialGain: 'Up to +2.5 years',
      citation: 'Sofi F et al., BMJ 2010',
      resources: [
        { type: 'link', title: 'NHS Eatwell Guide', url: 'https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/', note: 'Clear, practical guide to balanced eating' },
        { type: 'book', title: 'Food Rules: An Eater\'s Manual', author: 'Michael Pollan', note: 'Simple, memorable rules for eating well. A quick read' },
        { type: 'video', title: 'Jamie Oliver: Quick & Easy Meals', url: 'https://www.youtube.com/c/JamieOliver', note: 'Tasty meals that don\'t take ages' }
      ]
    },
    sleep_poor: {
      title: 'Optimise your sleep',
      description: 'Both too little and too much sleep are associated with increased mortality risk. 7-8 hours is optimal.',
      action: 'Establish a regular sleep schedule. Avoid screens 1 hour before bed.',
      potentialGain: 'Up to +2 years',
      citation: 'Yin J et al., JAHA 2017',
      resources: [
        { type: 'book', title: 'Why We Sleep', author: 'Matthew Walker', note: 'The definitive guide to the science of sleep' },
        { type: 'link', title: 'NHS Sleep Guide', url: 'https://www.nhs.uk/live-well/sleep-and-tiredness/', note: 'Practical tips for better sleep' },
        { type: 'link', title: 'Sleepstation', url: 'https://www.sleepstation.org.uk/', note: 'NHS-approved online sleep improvement programme' }
      ]
    },
    mental_health_mild: {
      title: 'Look after your mental wellbeing',
      description: 'Everyone has off days. Small habits like regular exercise, good sleep, and staying connected with people can make a real difference to how you feel day-to-day.',
      action: 'If low moods or anxious feelings become more frequent, your GP is a good first port of call. But often, lifestyle changes alone can help.',
      potentialGain: 'Up to +1 year',
      citation: 'Walker ER et al., JAMA Psychiatry 2015',
      resources: [
        { type: 'link', title: 'NHS Every Mind Matters', url: 'https://www.nhs.uk/every-mind-matters/', note: 'Free NHS tool to build a personalised mental health action plan' },
        { type: 'link', title: 'Mind.org.uk', url: 'https://www.mind.org.uk/', note: 'Advice, information and support for mental health' },
        { type: 'book', title: 'Reasons to Stay Alive', author: 'Matt Haig', note: 'A warm, honest book about finding your way through difficult patches' }
      ]
    },
    mental_health_concern: {
      title: 'Get support for your mental health',
      description: 'When mental health struggles persist, they can affect physical health too. Getting support early makes a big difference, and there is genuinely effective help available.',
      action: 'Speak to your GP about how you\'re feeling. NHS talking therapies are free and you can self-refer without needing a GP appointment.',
      potentialGain: 'Up to +3 years',
      citation: 'Walker ER et al., JAMA Psychiatry 2015',
      resources: [
        { type: 'link', title: 'Mind.org.uk', url: 'https://www.mind.org.uk/', note: 'Advice, information and support for mental health' },
        { type: 'link', title: 'NHS Talking Therapies', url: 'https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/nhs-talking-therapies/', note: 'Free therapy, you can self-refer without seeing your GP' },
        { type: 'link', title: 'Samaritans', url: 'https://www.samaritans.org/', note: 'Available 24/7, call 116 123, free from any phone' }
      ]
    },
    social_isolation: {
      title: 'Strengthen social connections',
      description: 'Social isolation has a health impact equivalent to smoking 15 cigarettes a day.',
      action: 'Consider joining a local club, volunteering, or reconnecting with old friends.',
      potentialGain: 'Up to +2.5 years',
      citation: 'Holt-Lunstad J et al., 2015',
      resources: [
        { type: 'link', title: 'Age UK: Social Activities', url: 'https://www.ageuk.org.uk/', note: 'Local groups and befriending services' },
        { type: 'link', title: 'Men\'s Sheds Association', url: 'https://menssheds.org.uk/', note: 'Friendly community workshops, great for meeting people' },
        { type: 'link', title: 'Meetup', url: 'https://www.meetup.com/', note: 'Find local groups based on your interests' }
      ]
    },
    bmi_high: {
      title: 'Work towards a healthy weight',
      description: 'Your BMI suggests excess weight, which increases risk of heart disease, diabetes, and some cancers.',
      action: 'Ask your GP about weight management programmes. Even 5% weight loss improves health markers.',
      potentialGain: 'Up to +8 years',
      citation: 'Bhaskaran K et al., Lancet 2018',
      resources: [
        { type: 'link', title: 'NHS Better Health', url: 'https://www.nhs.uk/better-health/lose-weight/', note: 'Free 12-week weight loss plan' },
        { type: 'link', title: 'NHS BMI Calculator', url: 'https://www.nhs.uk/live-well/healthy-weight/bmi-calculator/', note: 'Track your progress' },
        { type: 'book', title: 'Food Rules: An Eater\'s Manual', author: 'Michael Pollan', note: 'Simple principles for sustainable eating' }
      ]
    },
    bp_high: {
      title: 'Manage your blood pressure',
      description: 'High blood pressure is called the "silent killer" because it often has no symptoms but significantly reduces life expectancy.',
      action: 'See your GP for monitoring. Reduce salt, exercise regularly, and manage stress.',
      potentialGain: 'Up to +5 years',
      citation: 'Franco OH et al., Hypertension 2005',
      resources: [
        { type: 'link', title: 'Blood Pressure UK', url: 'https://www.bloodpressureuk.org/', note: 'Clear advice on understanding and managing BP' },
        { type: 'link', title: 'NHS Blood Pressure Guide', url: 'https://www.nhs.uk/conditions/high-blood-pressure-hypertension/', note: 'What the numbers mean and what to do' },
        { type: 'link', title: 'DASH Diet Guide', url: 'https://www.nhlbi.nih.gov/education/dash-eating-plan', note: 'Evidence-based eating plan proven to lower blood pressure' }
      ]
    },
    cholesterol_high: {
      title: 'Lower your cholesterol',
      description: 'High cholesterol increases your risk of heart attack and stroke.',
      action: 'Ask your GP about a heart health check. Dietary changes and statins can reduce levels effectively.',
      potentialGain: 'Up to +3 years',
      citation: 'Lewington S et al., Lancet 2007',
      resources: [
        { type: 'link', title: 'Heart UK', url: 'https://www.heartuk.org.uk/', note: 'The cholesterol charity. Recipes, advice and support' },
        { type: 'link', title: 'NHS Cholesterol Guide', url: 'https://www.nhs.uk/conditions/high-cholesterol/', note: 'What to eat, what to avoid, and when to see your GP' },
        { type: 'link', title: 'British Heart Foundation', url: 'https://www.bhf.org.uk/informationsupport/risk-factors/high-cholesterol', note: 'Understanding cholesterol and heart risk' }
      ]
    },
    hba1c_high: {
      title: 'Manage blood sugar levels',
      description: 'Elevated HbA1c indicates diabetes or pre-diabetes, which significantly affects life expectancy if unmanaged.',
      action: 'See your GP for diabetes management. Diet, exercise, and medication can all help.',
      potentialGain: 'Up to +6 years',
      citation: 'Zhong GC et al., Scientific Reports 2017',
      resources: [
        { type: 'link', title: 'Diabetes UK', url: 'https://www.diabetes.org.uk/', note: 'Information, recipes and support for managing diabetes' },
        { type: 'link', title: 'NHS Diabetes Prevention Programme', url: 'https://www.nhs.uk/conditions/nhs-health-check/nhs-diabetes-prevention-programme/', note: 'Free if your GP refers you' },
        { type: 'book', title: 'The Diabetes Weight-Loss Cookbook', author: 'Diabetes UK', note: 'Practical, tasty recipes for blood sugar control' }
      ]
    },
    stress_high: {
      title: 'Manage stress',
      description: 'Chronic high stress increases your risk of heart disease and stroke.',
      action: 'Consider mindfulness, regular exercise, or speaking to a counsellor. Your GP can help.',
      potentialGain: 'Up to +2.5 years',
      citation: 'Kivimaki M et al., Lancet 2015',
      resources: [
        { type: 'link', title: 'NHS Stress Guide', url: 'https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/stress/', note: 'Practical coping strategies' },
        { type: 'link', title: 'Mind: How to Manage Stress', url: 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/stress/', note: 'Detailed guidance on reducing stress' },
        { type: 'video', title: 'Headspace: Guided Meditation', url: 'https://www.youtube.com/c/Headspace', note: 'Free guided meditations for beginners' }
      ]
    },
    balance_poor: {
      title: 'Improve balance and stability',
      description: 'Poor balance is a strong predictor of mortality in middle-aged and older adults.',
      action: 'Practice standing on one leg daily. Consider tai chi or yoga classes.',
      potentialGain: 'Improved functional fitness',
      citation: 'Araujo CG et al., BJSM 2022',
      resources: [
        { type: 'link', title: 'NHS Exercises for Balance', url: 'https://www.nhs.uk/live-well/exercise/strength-and-flexibility-exercises/balance-exercises/', note: 'Simple exercises you can do at home' },
        { type: 'video', title: 'Balance Exercises for Beginners', url: 'https://www.youtube.com/results?search_query=balance+exercises+beginners+NHS', note: 'Start with these and progress gradually' }
      ]
    },
    fitness_low: {
      title: 'Build upper body strength',
      description: 'Push-up capacity is strongly linked to cardiovascular health.',
      action: 'Start with wall or knee push-ups and gradually progress. Aim for consistency over intensity.',
      potentialGain: 'Improved cardiovascular fitness',
      citation: 'Yang J et al., JAMA Network Open 2019',
      resources: [
        { type: 'link', title: 'NHS Strength Exercises', url: 'https://www.nhs.uk/live-well/exercise/strength-and-flexibility-exercises/', note: 'Beginner-friendly exercises with video guides' },
        { type: 'video', title: 'Push-Up Progression for Beginners', url: 'https://www.youtube.com/results?search_query=push+up+progression+beginners', note: 'From wall push-ups to full push-ups' }
      ]
    },
    grip_weak: {
      title: 'Improve grip strength',
      description: 'Grip strength is one of the strongest predictors of overall health and longevity.',
      action: 'Simple exercises: squeeze a tennis ball, carry shopping bags, try resistance bands.',
      potentialGain: 'Reduced mortality risk',
      citation: 'Leong DP et al., Lancet 2015',
      resources: [
        { type: 'link', title: 'NHS Hand Exercises', url: 'https://www.nhs.uk/live-well/exercise/strength-and-flexibility-exercises/', note: 'Includes grip and hand strength exercises' },
        { type: 'video', title: 'Grip Strength Exercises at Home', url: 'https://www.youtube.com/results?search_query=grip+strength+exercises+at+home', note: 'No equipment needed. A tennis ball or towel is enough' }
      ]
    }
  };

  // ============================================================
  // OVERLAP MAPPING - which factors influence each other
  // Used by the narrative summary generator
  // ============================================================

  const overlapMapping = {
    alcohol: ['bloodPressure', 'sleep', 'weight', 'stress', 'mentalHealth'],
    smoking: ['bloodPressure', 'activity', 'cancer'],
    activity: ['weight', 'bloodPressure', 'sleep', 'mentalHealth', 'stress', 'cholesterol', 'diabetes'],
    diet: ['weight', 'cholesterol', 'bloodPressure', 'diabetes', 'cancer'],
    sleep: ['mentalHealth', 'stress', 'weight', 'bloodPressure'],
    mentalHealth: ['sleep', 'alcohol', 'activity', 'social'],
    stress: ['sleep', 'bloodPressure', 'mentalHealth', 'alcohol'],
    social: ['mentalHealth', 'stress'],
    weight: ['bloodPressure', 'cholesterol', 'diabetes', 'activity']
  };

  // ============================================================
  // COMBINED LIFESTYLE IMPACT REFERENCE
  // Source: Li Y et al., Circulation 2018
  // ============================================================

  const combinedLifestyleRef = {
    citation: 'Li Y et al. "Impact of healthy lifestyle factors on life expectancies in the US population." Circulation. 2018;138(4):345-355.',
    note: 'Adopting all five healthy lifestyle factors (never smoking, healthy BMI, regular physical activity, healthy diet, moderate alcohol) was associated with 12-14 additional years of life expectancy at age 50 compared to adopting none.'
  };

  // Public API
  return {
    onsLifeTables,
    hleRatio,
    bmiCategories,
    causesOfDeath,
    getAgeGroup,
    genericAdvice,
    lifestyleFactors,
    healthTests,
    recommendations,
    overlapMapping,
    combinedLifestyleRef
  };

})();
