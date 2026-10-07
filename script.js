        let currentSchedule = {};       
        const allPeople = ['黃經洲', '許世勳', '洪柜峰', '周育稔', '林宏儒', '羅應順', '呂明峯'];
		
        let disabledPeople = new Set();
        let unavailableDays = {};
        let preassigned = {};
        let selectedDayForPreassign = null;
        let holidays = [];
        let people = [...allPeople];

const personColors = {
    '黃經洲': '#F96167',   // Coral red
    '洪柜峰': '#990011',   // Dark red
    '林宏儒': '#00246B',   // Navy blue
    '呂明峯': '#8AAAE5',   // Light blue
    '周育稔': '#F9E795',   // Light yellow
    '許世勳': '#8E44AD',   // Purple
    '羅應順': '#27AE60'    // Green
};



        
function init() {
    setupDateSelectors();
    setupPeopleList();
    generateCalendar();
			//shuffleDeck();
}

function updateActivePeople() {
    people = allPeople.filter(p => !disabledPeople.has(p));
}

		// function shuffleDeck() {

        //     for (let i=0; i < people.length; i++) {
        //         let j = Math.floor(Math.random() * people.length);
        //         let temp = people[i];
        //         people[i] = people[j];
        //         people[j] = temp;
        //     }
        //     console.log(people);
        // }
		
// ============================================================================
// Dynamic Holiday & Lunar Generation System (農曆與節氣演算法)
// Calculates accurate 24 Solar Terms (二十四節氣) via Sun's apparent longitude,
// lunar dates (農曆日期與閏月) via 1900-2100 astronomical tables (定朔法),
// traditional festivals, and official public holiday / compensatory rules.
// ============================================================================

function getSunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  let Mrad = M * Math.PI / 180.0;
  let C = (1.914602 - 0.004817 * T - 0.0001537 * T * T) * Math.sin(Mrad)
        + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
        + 0.000289 * Math.sin(3 * Mrad);
  let trueLong = L0 + C;
  let omega = 125.04 - 1934.136 * T;
  let lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180.0);
  lambda = lambda % 360;
  if (lambda < 0) lambda += 360;
  return lambda;
}

function dateToJD(date) {
  return (date.getTime() / 86400000.0) + 2440587.5;
}

const SOLAR_TERMS = [
  { name: '小寒', angle: 285 }, { name: '大寒', angle: 300 },
  { name: '立春', angle: 315 }, { name: '雨水', angle: 330 },
  { name: '驚蟄', angle: 345 }, { name: '春分', angle: 0 },
  { name: '清明', angle: 15 },  { name: '穀雨', angle: 30 },
  { name: '立夏', angle: 45 },  { name: '小滿', angle: 60 },
  { name: '芒種', angle: 75 },  { name: '夏至', angle: 90 },
  { name: '小暑', angle: 105 }, { name: '大暑', angle: 120 },
  { name: '立秋', angle: 135 }, { name: '處暑', angle: 150 },
  { name: '白露', angle: 165 }, { name: '秋分', angle: 180 },
  { name: '寒露', angle: 195 }, { name: '霜降', angle: 210 },
  { name: '立冬', angle: 225 }, { name: '小雪', angle: 240 },
  { name: '大雪', angle: 255 }, { name: '冬至', angle: 270 }
];

function getYearSolarTerms(targetYear) {
  const result = {};
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(targetYear, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      // Midnight to midnight in UTC+8
      const dtStart = new Date(Date.UTC(targetYear, m, d, -8, 0, 0));
      const dtEnd = new Date(Date.UTC(targetYear, m, d, 16, 0, 0));
      const l1 = getSunLongitude(dateToJD(dtStart));
      const l2 = getSunLongitude(dateToJD(dtEnd));
      for (const term of SOLAR_TERMS) {
        const crossed = term.angle === 0
          ? (l1 > 350 && l2 < 10)
          : (l1 <= term.angle && l2 > term.angle);
        if (crossed) {
          result[`${targetYear}-${m + 1}-${d}`] = term.name;
        }
      }
    }
  }
  return result;
}

const LUNAR_DAY_NAMES = [
  '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];

const LUNAR_MONTH_NAMES = [
  '', '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
];

// 1900-2100 權威天文農曆數據表（依據紫金山天文台/中央氣象署精準定朔法編制）
const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520 // 2100
];

function lYearDays(y) {
  let sum = 348;
  const info = lunarInfo[y - 1900];
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (info & i) ? 1 : 0;
  }
  return sum + leapDays(y);
}

function leapMonth(y) {
  return lunarInfo[y - 1900] & 0xf;
}

function leapDays(y) {
  if (leapMonth(y)) {
    return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

function monthDays(y, m) {
  if (m > 12 || m < 1) return -1;
  return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}

/**
 * 公曆轉農曆核心計算（定朔法）
 * @param {number} y - 公曆年
 * @param {number} m - 公曆月 (1-12)
 * @param {number} d - 公曆日 (1-31)
 * @returns {{ lYear: number, lMonth: number, lDay: number, isLeap: boolean, isBig: boolean }}
 */
function solar2lunar(y, m, d) {
  if (y < 1900 || y > 2100) return null;
  let offset = (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000;
  let temp = 0;
  let i;
  for (i = 1900; i < 2101 && offset > 0; i++) {
    temp = lYearDays(i);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    i--;
  }
  const lYear = i;
  const leap = leapMonth(lYear);
  let isLeap = false;

  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === (leap + 1) && !isLeap) {
      --i;
      isLeap = true;
      temp = leapDays(lYear);
    } else {
      temp = monthDays(lYear, i);
    }
    if (isLeap && i === (leap + 1)) isLeap = false;
    offset -= temp;
  }

  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      --i;
    }
  }
  if (offset < 0) {
    offset += temp;
    --i;
  }
  const lMonth = i;
  const lDay = Math.floor(offset + 1);
  const mDays = isLeap ? leapDays(lYear) : monthDays(lYear, lMonth);
  return { lYear, lMonth, lDay, isLeap, isBig: mDays === 30 };
}

const yearHolidayMetaCache = {};

function getYearHolidayMeta(y) {
  if (yearHolidayMetaCache[y]) return yearHolidayMetaCache[y];

  const solarTerms = getYearSolarTerms(y);
  const daysMeta = [];
  const metaMap = {};

  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(y, m - 1, d);
      const dateKey = `${y}-${m}-${d}`;
      const lunar = solar2lunar(y, m, d);
      const dayOfWeek = dt.getDay(); // 0: Sun, 6: Sat

      let name = '';
      let isFixedHoliday = false;
      let isSpringFestival = false;
      let festivalName = '';
      const solarTerm = solarTerms[dateKey] || '';

      // Check Chinese New Year eve: day before 正月初一
      const tomorrow = new Date(y, m - 1, d + 1);
      const lTomorrow = solar2lunar(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate());
      const isEve = (lTomorrow && lTomorrow.lMonth === 1 && lTomorrow.lDay === 1 && !lTomorrow.isLeap);

      if (solarTerm) {
        name = solarTerm;
      }

      if (m === 1 && d === 1) {
        festivalName = '元旦';
        isFixedHoliday = true;
      } else if (isEve) {
        festivalName = '除夕';
        isFixedHoliday = true;
        isSpringFestival = true;
      } else if (lunar && lunar.lMonth === 1 && lunar.lDay === 1 && !lunar.isLeap) {
        festivalName = '春節';
        isFixedHoliday = true;
        isSpringFestival = true;
      } else if (lunar && lunar.lMonth === 1 && !lunar.isLeap && [2, 3, 4].includes(lunar.lDay)) {
        festivalName = `初${['', '', '二', '三', '四'][lunar.lDay]}`;
        isFixedHoliday = true;
        isSpringFestival = true;
      } else if (m === 2 && d === 28) {
        festivalName = '和平紀念';
        isFixedHoliday = true;
      } else if (m === 4 && d === 4) {
        festivalName = '兒童節';
        isFixedHoliday = true;
      } else if (m === 5 && d === 1) {
        festivalName = '勞動節';
        isFixedHoliday = true;
      } else if (lunar && lunar.lMonth === 5 && lunar.lDay === 5 && !lunar.isLeap) {
        festivalName = '端午節';
        isFixedHoliday = true;
      } else if (lunar && lunar.lMonth === 8 && lunar.lDay === 15 && !lunar.isLeap) {
        festivalName = '中秋節';
        isFixedHoliday = true;
      } else if (m === 9 && d === 28) {
        festivalName = '孔子誕辰';
        isFixedHoliday = true;
      } else if (m === 10 && d === 10) {
        festivalName = '國慶日';
        isFixedHoliday = true;
      } else if (m === 10 && d === 25) {
        festivalName = '光復節';
        isFixedHoliday = true;
      } else if (m === 12 && d === 25) {
        festivalName = '行憲紀念';
        isFixedHoliday = true;
      }

      if (solarTerm === '清明') {
        isFixedHoliday = true;
      }

      // 兒童節與清明節同日處理 (台灣紀念日及節日實施辦法)
      if (solarTerms[`${y}-4-4`] === '清明') {
        const dow44 = new Date(y, 3, 4).getDay();
        if (dow44 === 4) {
          if (m === 4 && d === 5) {
            festivalName = '兒童節';
            isFixedHoliday = true;
          }
        } else {
          if (m === 4 && d === 3) {
            festivalName = '兒童節';
            isFixedHoliday = true;
          }
        }
      }

      // Display name priority
      if (!name) {
        if (festivalName) {
          name = festivalName;
        } else if (lunar && lunar.lDay === 1) {
          const monthPrefix = (lunar.isLeap ? '閏' : '') + (LUNAR_MONTH_NAMES[lunar.lMonth] || `${lunar.lMonth}月`);
          name = `${monthPrefix}${lunar.isBig ? '大' : '小'}`;
        } else if (lunar) {
          name = LUNAR_DAY_NAMES[lunar.lDay] || `初${lunar.lDay}`;
        }
      }

      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const item = {
        dateKey,
        y, m, d,
        dayOfWeek,
        name,
        solarTerm,
        festivalName,
        lunar,
        isWeekend,
        isFixedHoliday,
        isSpringFestival,
        isMakeup: false,
        isHoliday: isWeekend || isFixedHoliday
      };
      daysMeta.push(item);
      metaMap[dateKey] = item;
    }
  }

  // 補假規則：
  // 週六逢例假日前一個上班日(週五)補假；週日逢例假日次一個上班日(週一)補假。
  // 春節及除夕逢例假日，均於次一個上班日補假。
  daysMeta.forEach((dm, idx) => {
    if (dm.isFixedHoliday && dm.isWeekend) {
      if (dm.dayOfWeek === 6 && !dm.isSpringFestival) {
        let prevIdx = idx - 1;
        while (prevIdx >= 0 && daysMeta[prevIdx].isHoliday) {
          prevIdx--;
        }
        if (prevIdx >= 0) {
          daysMeta[prevIdx].isHoliday = true;
          daysMeta[prevIdx].isMakeup = true;
        }
      } else {
        let nextIdx = idx + 1;
        while (nextIdx < daysMeta.length && daysMeta[nextIdx].isHoliday) {
          nextIdx++;
        }
        if (nextIdx < daysMeta.length) {
          daysMeta[nextIdx].isHoliday = true;
          daysMeta[nextIdx].isMakeup = true;
        }
      }
    }
  });

  yearHolidayMetaCache[y] = { daysMeta, metaMap };
  return yearHolidayMetaCache[y];
}

/**
 * Generates raw holiday and lunar data for any given year in the exact format:
 * { "YYYY-M-D": "【lunarName】" + (isHoliday ? "【放假日】" : "") }
 */
function generateHolidayData(targetYear = new Date().getFullYear()) {
  const y = parseInt(targetYear, 10);
  if (isNaN(y)) return {};
  const { daysMeta } = getYearHolidayMeta(y);
  const result = {};
  daysMeta.forEach(dm => {
    result[dm.dateKey] = `【${dm.name}】` + (dm.isHoliday ? '【放假日】' : '');
  });
  return result;
}

// Dynamic holiday & lunar data generated on demand via Lunar Generation System
const holiday = new Proxy({}, {
  get(cache, date) {
    if (typeof date === 'string' && /^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) {
      if (!(date in cache)) {
        const y = parseInt(date.split('-')[0], 10);
        if (!isNaN(y)) Object.assign(cache, generateHolidayData(y));
      }
    }
    return cache[date];
  },
  has(cache, date) {
    if (typeof date === 'string' && /^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) {
      if (!(date in cache)) {
        const y = parseInt(date.split('-')[0], 10);
        if (!isNaN(y)) Object.assign(cache, generateHolidayData(y));
      }
    }
    return date in cache;
  }
});

function ensureHolidayData(targetYear) {
  if (targetYear) holiday[`${targetYear}-1-1`];
}

function isNationalOrCompensatoryHoliday(y, m, d) {
  const dt = new Date(y, m - 1, d);
  const realY = dt.getFullYear();
  const realM = dt.getMonth() + 1;
  const realD = dt.getDate();
  const { metaMap } = getYearHolidayMeta(realY);
  const item = metaMap[`${realY}-${realM}-${realD}`];
  return !!(item && (item.isFixedHoliday || item.isMakeup));
}

function isDayHoliday(y, m, d) {
  const dt = new Date(y, m - 1, d);
  const realY = dt.getFullYear();
  const realM = dt.getMonth() + 1;
  const realD = dt.getDate();
  const { metaMap } = getYearHolidayMeta(realY);
  const item = metaMap[`${realY}-${realM}-${realD}`];
  return !!(item && item.isHoliday);
}

function getDayDetails(y, m, d) {
  const dt = new Date(y, m - 1, d);
  const realY = dt.getFullYear();
  const realM = dt.getMonth() + 1;
  const realD = dt.getDate();
  const { metaMap } = getYearHolidayMeta(realY);
  const dm = metaMap[`${realY}-${realM}-${realD}`];
  if (!dm) return { displayName: '', fullTitle: '', isSolarTerm: false, isFestival: false };

  let displayName = dm.name;
  if (dm.isMakeup && !dm.solarTerm && !dm.festivalName) {
    displayName = '補假';
  }

  const lunarStr = dm.lunar ? `農曆${dm.lunar.isLeap ? '閏' : ''}${LUNAR_MONTH_NAMES[dm.lunar.lMonth]}${LUNAR_DAY_NAMES[dm.lunar.lDay]}` : '';
  const tags = [];
  if (dm.solarTerm) tags.push(dm.solarTerm);
  if (dm.festivalName && dm.festivalName !== dm.solarTerm) tags.push(dm.festivalName);
  if (dm.isMakeup) tags.push('補假');
  if (dm.isHoliday) tags.push('【放假日】');

  return {
    displayName,
    isSolarTerm: !!dm.solarTerm,
    isFestival: !!dm.festivalName,
    isHoliday: dm.isHoliday,
    isNationalOrCompensatory: dm.isFixedHoliday || dm.isMakeup,
    isMakeup: dm.isMakeup,
    fullTitle: `${realY}年${realM}月${realD}日 ${lunarStr} ${tags.join(' ')}`.trim()
  };
}

function updateMonthHolidays() {
  const yearSelect = document.getElementById('yearSelect');
  const monthSelect = document.getElementById('monthSelect');
  if (!yearSelect || !monthSelect) return;
  const year = parseInt(yearSelect.value, 10);
  const month = parseInt(monthSelect.value, 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  holidays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    if (isNationalOrCompensatoryHoliday(year, month, d)) {
      holidays.push(d);
    }
  }
}

function updateHolidays() {
  updateMonthHolidays();
  generateCalendar();
}

if (typeof window !== 'undefined') {
  window.generateHolidayData = generateHolidayData;
  window.generateHoliday = generateHolidayData;
  window.ensureHolidayData = ensureHolidayData;
  window.holiday = holiday;
}

function setupDateSelectors() {
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let defaultMonth = currentMonth + 1;
    let defaultYear = currentYear;
    if (defaultMonth > 12) {
        defaultMonth = 1;
        defaultYear = currentYear + 1;
    }
    
    yearSelect.innerHTML = '';
    for (let year = 1950; year <= 2050; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === defaultYear) option.selected = true;
        yearSelect.appendChild(option);
    }

    monthSelect.innerHTML = '';
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month + '月';
        if (month === defaultMonth) option.selected = true;
        monthSelect.appendChild(option);
    }

    yearSelect.addEventListener('change', generateCalendar);
    monthSelect.addEventListener('change', generateCalendar);
}

        
function setupPeopleList() {
    const peopleList = document.getElementById('peopleList');
    peopleList.innerHTML = '';
    
    // Update active pool first
    updateActivePeople();

    allPeople.forEach((person, index) => {
        if (!unavailableDays[person]) {
            unavailableDays[person] = [];
        }
        
        const isEnabled = !disabledPeople.has(person);
        
        const personCard = document.createElement('div');
        personCard.className = `person-card ${!isEnabled ? 'person-card-disabled' : ''}`;
        if (!isEnabled) {
            personCard.style.opacity = '0.5';
        }
        
        const personHeader = document.createElement('div');
        personHeader.className = 'person-header';
        personHeader.style.display = 'flex';
        personHeader.style.justifyContent = 'space-between';
        personHeader.style.alignItems = 'center';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'person-name';
        nameSpan.textContent = person;
        if (!isEnabled) {
            nameSpan.style.textDecoration = 'line-through';
        }

        // Toggle Button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = isEnabled ? '停用 (Disable)' : '啟用 (Enable)';
        toggleBtn.style.marginLeft = '10px';
        toggleBtn.style.cursor = 'pointer';

        toggleBtn.addEventListener('click', () => {
            if (disabledPeople.has(person)) {
                disabledPeople.delete(person);
            } else {
                disabledPeople.add(person);
            }
            // Rebuild UI and update global state
            setupPeopleList();
            generateCalendar();
        });
        
        personHeader.appendChild(nameSpan);
        personHeader.appendChild(toggleBtn);
        
        const unavailableSection = document.createElement('div');
        unavailableSection.innerHTML = '<p>不可排班日期:</p>';
        
        const daysContainer = document.createElement('div');
        daysContainer.className = 'unavailable-days';
        daysContainer.id = `days-${index}`;

        // Disable date inputs if the person is disabled
        if (!isEnabled) {
            daysContainer.style.pointerEvents = 'none';
        }
        
        unavailableSection.appendChild(daysContainer);
        personCard.appendChild(personHeader);
        personCard.appendChild(unavailableSection);
        peopleList.appendChild(personCard);
    });
    
    updateUnavailableDays();
}

function updateUnavailableDays() {
    const year = parseInt(document.getElementById('yearSelect').value);
    const month = parseInt(document.getElementById('monthSelect').value);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    allPeople.forEach((person, personIndex) => {
        const container = document.getElementById(`days-${personIndex}`);
        if (!container) return;
        
        container.innerHTML = '';
        
        // Skip building checkbox elements if person is disabled
        if (disabledPeople.has(person)) return;

        const selectAllBtn = document.createElement('button');
        selectAllBtn.textContent = 'Select All Days';
        selectAllBtn.style.marginBottom = '5px';
        
        selectAllBtn.addEventListener('click', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);

            if (allChecked) {
                unavailableDays[person] = [];
                checkboxes.forEach(cb => { cb.checked = false; });
                selectAllBtn.textContent = 'Select All Days';
            } else {
                unavailableDays[person] = [];
                checkboxes.forEach(cb => {
                    cb.checked = true;
                    unavailableDays[person].push(parseInt(cb.value));
                });
                selectAllBtn.textContent = 'Unselect All Days';
            }
        });

        container.appendChild(selectAllBtn);
        container.appendChild(document.createElement('br')); 
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCheckbox = document.createElement('label');
            dayCheckbox.className = 'day-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = day;
            if (unavailableDays[person]?.includes(day)) {
                checkbox.checked = true;
            }

            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!unavailableDays[person].includes(day)) {
                        unavailableDays[person].push(day);
                    }
                } else {
                    unavailableDays[person] = unavailableDays[person].filter(d => d !== day);
                }
            });
            
            dayCheckbox.appendChild(checkbox);
            dayCheckbox.appendChild(document.createTextNode(day + '日'));
            container.appendChild(dayCheckbox);
        }
    });
}

        function Zellercongruence(day, month, year)
        {
            if (month == 1)
            {
                month = 13;
                year--;
            }
            if (month == 2)
            {
                month = 14;
                year--;
            }
            let q = day;
            let m = month;
            let k = year % 100;
            let j = parseInt(year / 100, 10);
            let h = q + parseInt(13 * (m + 1) / 5, 10) + k + parseInt(k / 4, 10) + parseInt(j / 4, 10) + 5 * j;
            h = h % 7;
            switch (h)
            {
                case 0: 
                return 6;
                break;           
                case 1: 
                    return 0;
                    break;    
                case 2: 
                    return 1;
                    break;    
                case 3: 
                    return 2;
                    break; 
                case 4: 
                    return 3;
                    break;  
                case 5: 
                    return 4;
                    break;
                case 6: 
                    return 5;
                    break;
            }
        }

        // 生成日曆
        function generateCalendar() {
            updateMonthHolidays();
            updateUnavailableDays();
            const year = parseInt(document.getElementById('yearSelect').value);
            const month = parseInt(document.getElementById('monthSelect').value);
            const calendar = document.getElementById('calendar');
            
            calendar.innerHTML = '';
            
            // 日曆標題
            const weekdays = ['一', '二', '三', '四', '五', '六','日'];
            weekdays.forEach(day => {
                const header = document.createElement('div');
                header.className = 'calendar-header';
                header.textContent = day;
                calendar.appendChild(header);
            });
            
            // 計算第一天是星期幾
            const firstDay = (Zellercongruence(1, month, year) + 6) % 7;
            const daysInMonth = new Date(year, month, 0).getDate();
            
            // 添加空白日期
            for (let i = 0; i < firstDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day';
                calendar.appendChild(emptyDay);
            }
            
            // 添加月份日期
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.id = `day-${day}`;
                
                const dayOfWeek = Zellercongruence(day, month, year);
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    dayElement.classList.add('weekend');
                }

                if (holidays.includes(day)) {
                    dayElement.classList.add('holiday');
                }

                const details = getDayDetails(year, month, day);

                const dayTop = document.createElement('div');
                dayTop.className = 'day-top';
                
                const dayNumber = document.createElement('div');
                dayNumber.className = 'day-number';
                dayNumber.textContent = day;

                const lunarName = document.createElement('div');
                lunarName.className = 'lunar-name';
                lunarName.textContent = details.displayName;
                if (details.isSolarTerm) lunarName.classList.add('solar-term');
                if (details.isFestival) lunarName.classList.add('festival');

                dayTop.appendChild(dayNumber);
                dayTop.appendChild(lunarName);
                
                const dayInfo = document.createElement('div');
                dayInfo.className = 'day-info';
                dayInfo.id = `info-${day}`;

                dayElement.title = details.fullTitle;
                
                dayElement.appendChild(dayTop);
                dayElement.appendChild(dayInfo);
                calendar.appendChild(dayElement);

                dayElement.addEventListener('click', () => {
                    selectedDayForPreassign = day;
                    document.getElementById('modalDayText').textContent = `選擇 ${day} 日的預排人員`;
                    populatePersonSelects(preassigned[day] || []);
                    document.getElementById('preassignModal').style.display = 'block';
                });
            }
        }

function tryGenerateSchedule(maxHourDiffThreshold, maxRestDiffThreshold) {
    const year = parseInt(document.getElementById('yearSelect').value);
    const month = parseInt(document.getElementById('monthSelect').value);
    const daysInMonth = new Date(year, month, 0).getDate();

    let schedule = {};
    let personRestDays = {};
    let personStats = {};
    
    people.forEach(person => {
        personRestDays[person] = [];
        personStats[person] = { hours: 0, restDays: 0, workDays: 0, hardDays: 0 };
    });

    for (let day = 1; day <= daysInMonth; day++) {
        schedule[day] = [];
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = Zellercongruence(day, month, year);
        const nextDate = new Date(year, month - 1, day + 1);
        const nextY = nextDate.getFullYear();
        const nextM = nextDate.getMonth() + 1;
        const nextD = nextDate.getDate();

        let workHours, isHardDay, isRestDay;

        const isTodayHoliday = holidays.includes(day);
        const isTomorrowHoliday = isNationalOrCompensatoryHoliday(nextY, nextM, nextD);
        const isWeekend = (dayOfWeek === 6 || dayOfWeek === 0);
        const isWeekendTomorrow = (nextDate.getDay() === 6 || nextDate.getDay() === 0);
        
        isHardDay = false;
        isRestDay = false;

        // --- Holiday handling logic ---
        if (isTodayHoliday && isTomorrowHoliday) {
            workHours = 24;
            isHardDay = true;
            isRestDay = false;
        } else if (isWeekend && isTomorrowHoliday) { 
            workHours = 24;
            isHardDay = true;
            isRestDay = false;
        } else if (isTodayHoliday && isWeekendTomorrow) { 
            workHours = 24;
            isHardDay = true;
            isRestDay = false;
        } else if (isTodayHoliday && !(isWeekendTomorrow || isTomorrowHoliday)) {
            workHours = 16;
            isHardDay = false;
            isRestDay = true;
        } else if (!(isTodayHoliday || isWeekend) && isTomorrowHoliday) {
            workHours = 16;
            isHardDay = true;
            isRestDay = false;
        } else {
            // fallback to normal logic
            if (dayOfWeek === 6) {
                workHours = 24;
                isHardDay = true;
                isRestDay = false;
            } else if (dayOfWeek === 5) {
                workHours = 16;
                isHardDay = true;
                isRestDay = false;
            } else if (dayOfWeek === 0) {
                workHours = 16;
                isHardDay = false;
                isRestDay = true;
            } else {
                workHours = 8;
                isHardDay = false;
                isRestDay = true;
            }
        }


        const preListRaw = preassigned[day] ? [...preassigned[day]] : [];
        const preListNames = preListRaw.map(p => typeof p === 'string' ? p : p.name);

        const yesterdaySchedule = schedule[day - 1] || [];
        const tomorrowPreassigned = preassigned[day + 1] ? preassigned[day + 1].map(p => typeof p === 'string' ? p : p.name) : [];

        
        for (const person of preListNames) {

            if (yesterdaySchedule.includes(person)) {
                return null;
            }
            if (tomorrowPreassigned.includes(person)) {
                return null;
            }
        }


        if (preListNames.length > 0) {
            schedule[day] = [...preListNames];
        }


        preListNames.forEach(person => {
            if (!people.includes(person)) return;
            personStats[person].hours += workHours;
            personStats[person].workDays++;

            if (isRestDay) {
                personStats[person].restDays++;
            } else if (isHardDay) {
                personStats[person].hardDays++;
            }
        });
        

        // Check if ONLY person3Select (Role 'R') is selected for this day
        const isOnlyPerson3Selected = preListRaw.length > 0 && preListRaw.every(p => typeof p === 'object' && p.role === 'R');

        // Skip auto-assignment and move directly to the next day
        if (isOnlyPerson3Selected) {
            continue;
        }

        const alreadyAssigned = new Set(schedule[day]);
        const alreadyAssignedYesterday = new Set(schedule[day - 1] || []);
        const alreadyAssignedBeforeYesterday = new Set(schedule[day - 2] || []);
        const preassignedTomorrow = new Set(tomorrowPreassigned);

        const availablePeople = people.filter(person => {
            if (preListNames.includes(person)) return false;
            if (unavailableDays[person].includes(day)) return false;
            if (alreadyAssigned.has(person)) return false;
            if (alreadyAssignedYesterday.has(person)) return false;
            if (preassignedTomorrow.has(person)) return false; 
            if (day > 1 && schedule[day - 1]?.includes(person)) return false;
            return true;
        });

        // if (availablePeople.length === 0) return null;


        if (availablePeople.length === 0) {
            continue;
        }


        availablePeople.sort((a, b) => {

            const allHours = people.map(p => personStats[p].hours);
            if (Math.max(...allHours) - Math.min(...allHours) > 8) {
                return personStats[a].hours - personStats[b].hours;
            }
            const allRestDays = people.map(p => personStats[p].restDays);
            if (Math.max(...allRestDays) - Math.min(...allRestDays) > 0) {
                return personStats[a].restDays - personStats[b].restDays;
            }
            
            return (personStats[a].hours + personStats[a].restDays * 8) -
                   (personStats[b].hours + personStats[b].restDays * 8);
        });

        let candidates;
        if (dayOfWeek === 5 || dayOfWeek === 6 || isTomorrowHoliday) {
            const minHard = personStats[availablePeople[0]].hardDays;
            candidates = availablePeople.filter(p => personStats[p].hardDays === minHard);
        } else {
            const hourGap = Math.max(...people.map(p => personStats[p].hours)) -
                            Math.min(...people.map(p => personStats[p].hours));
            const restGap = Math.max(...people.map(p => personStats[p].restDays)) -
                            Math.min(...people.map(p => personStats[p].restDays));
            if (hourGap > 8) {
                const minHour = Math.min(...availablePeople.map(p => personStats[p].hours));
                candidates = availablePeople.filter(p => personStats[p].hours === minHour);
            } else if (restGap > 1) {
                const minRest = Math.min(...availablePeople.map(p => personStats[p].restDays));
                candidates = availablePeople.filter(p => personStats[p].restDays === minRest);
            } else {
                const minWorkload = Math.min(...availablePeople.map(p =>
                    personStats[p].hours + personStats[p].restDays * 8
                ));
                candidates = availablePeople.filter(p =>
                    personStats[p].hours + personStats[p].restDays * 8 === minWorkload
                );
            }
        }


     
        const runConditionalSection = Math.random() < 0.9;

        if (runConditionalSection && candidates.length > 1) {
            const candidatesNotBeforeYesterday = candidates.filter(person => 
                !alreadyAssignedBeforeYesterday.has(person)
            );
    
            if (candidatesNotBeforeYesterday.length > 0) {
                candidates = candidatesNotBeforeYesterday;
        }
        }


        const selectedPerson = candidates[Math.floor(Math.random() * candidates.length)];
        schedule[day].push(selectedPerson);
        personStats[selectedPerson].hours += workHours;
        personStats[selectedPerson].workDays++;

        if (isRestDay) {
                personStats[selectedPerson].restDays++;
        } else if (isHardDay) {
                personStats[selectedPerson].hardDays++;
        }
    
    }

    const hoursList = people.map(p => personStats[p].hours);
    const restList = people.map(p => personStats[p].restDays);

    const maxHour = Math.max(...hoursList);
    const minHour = Math.min(...hoursList);
    const maxRest = Math.max(...restList);
    const minRest = Math.min(...restList);

    
    if ((maxHour - minHour) > maxHourDiffThreshold || (maxRest - minRest) > maxRestDiffThreshold) {
        return null;
    }




    return { schedule, stats: personStats };
}

// New function to calculate schedule statistics
function calculateScheduleStats(schedule) {
    const year = parseInt(document.getElementById('yearSelect').value);
    const month = parseInt(document.getElementById('monthSelect').value);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let personStats = {};
    people.forEach(person => {
        personStats[person] = { hours: 0, restDays: 0, workDays: 0, hardDays: 0 };
    });

    for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = Zellercongruence(day, month, year);
        const nextDate = new Date(year, month - 1, day + 1);
        const nextY = nextDate.getFullYear();
        const nextM = nextDate.getMonth() + 1;
        const nextD = nextDate.getDate();

        let workHours, isHardDay, isRestDay;

        const isTodayHoliday = holidays.includes(day);
        const isTomorrowHoliday = isNationalOrCompensatoryHoliday(nextY, nextM, nextD);
        const isWeekend = (dayOfWeek === 6 || dayOfWeek === 0);
        const isWeekendTomorrow = (nextDate.getDay() === 6 || nextDate.getDay() === 0);
        
        isHardDay = false;
        isRestDay = false;

        // Same holiday handling logic as in tryGenerateSchedule
        if (isTodayHoliday && isTomorrowHoliday) {
            workHours = 24;
            isHardDay = true;
            isRestDay = false;
        } else if (isWeekend && isTomorrowHoliday) { 
            workHours = 24;
            isHardDay = true;
            isRestDay = false;
        } else if (isTodayHoliday && isWeekendTomorrow) { 
            workHours = 24;
            isHardDay = true;
            isRestDay = false;
        } else if (isTodayHoliday && !(isWeekendTomorrow || isTomorrowHoliday)) {
            workHours = 16;
            isHardDay = false;
            isRestDay = true;
        } else if (!(isTodayHoliday || isWeekend) && isTomorrowHoliday) {
            workHours = 16;
            isHardDay = true;
            isRestDay = false;
        } else {
            if (dayOfWeek === 6) {
                workHours = 24;
                isHardDay = true;
                isRestDay = false;
            } else if (dayOfWeek === 5) {
                workHours = 16;
                isHardDay = true;
                isRestDay = false;
            } else if (dayOfWeek === 0) {
                workHours = 16;
                isHardDay = false;
                isRestDay = true;
            } else {
                workHours = 8;
                isHardDay = false;
                isRestDay = true;
            }
        }

        const assignedPeople = schedule[day] || [];
        assignedPeople.forEach(person => {
            if (!people.includes(person)) return;
            personStats[person].hours += workHours;
            personStats[person].workDays++;

            if (isRestDay) {
                personStats[person].restDays++;
            } else if (isHardDay) {
                personStats[person].hardDays++;
            }
        });
    }

    return personStats;
}

// New function to check if a swap is valid
function isValidSwap(schedule, personA, dayA, personB, dayB) {
    const year = parseInt(document.getElementById('yearSelect').value);
    const month = parseInt(document.getElementById('monthSelect').value);
    
    // Check if either person is preassigned on the swap days
    const preassignedA = preassigned[dayA] ? preassigned[dayA].map(p => typeof p === 'string' ? p : p.name) : [];
    const preassignedB = preassigned[dayB] ? preassigned[dayB].map(p => typeof p === 'string' ? p : p.name) : [];
    
    if (preassignedA.includes(personA) || preassignedB.includes(personB)) {
        return false;
    }
    
    // Check unavailability
    if (unavailableDays[personA]?.includes(dayB) || unavailableDays[personB]?.includes(dayA)) {
        return false;
    }
    
    // Check consecutive day constraints
    // PersonA on dayB
    if (dayB > 1 && schedule[dayB - 1]?.includes(personA)) return false;
    if (schedule[dayB + 1]?.includes(personA)) return false;
    
    // PersonB on dayA
    if (dayA > 1 && schedule[dayA - 1]?.includes(personB)) return false;
    if (schedule[dayA + 1]?.includes(personB)) return false;
    
    return true;
}

// New function to optimize schedule through swapping
async function optimizeScheduleWithSwaps(initialSchedule, initialStats) {
    const year = parseInt(document.getElementById('yearSelect').value);
    const month = parseInt(document.getElementById('monthSelect').value);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let bestSchedule = JSON.parse(JSON.stringify(initialSchedule));
    let bestStats = JSON.parse(JSON.stringify(initialStats));
    
    // Calculate initial score
    let bestScore = calculateScheduleScore(bestStats);
    
    console.log('Start Optimizing, Initial Scores:', bestScore);
    
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    progressContainer.style.display = 'block';
    
    // Get all person-day assignments
    let assignments = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const assignedPeople = initialSchedule[day] || [];
        assignedPeople.forEach(person => {
            if (people.includes(person)) {
                assignments.push({ person, day });
            }
        });
    }
    
    const totalSwaps = assignments.length * (assignments.length - 1) / 2;
    progressBar.max = totalSwaps;
    progressBar.value = 0;
    
    let swapCount = 0;
    let improvementCount = 0;
    
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Try all possible swaps
    for (let i = 0; i < assignments.length; i++) {
        for (let j = i + 1; j < assignments.length; j++) {
            const assignmentA = assignments[i];
            const assignmentB = assignments[j];
            
            // Skip if same person
            if (assignmentA.person === assignmentB.person) {
                swapCount++;
                progressBar.value = swapCount;
                continue;
            }
            
            // Check if swap is valid
            if (!isValidSwap(bestSchedule, assignmentA.person, assignmentA.day, assignmentB.person, assignmentB.day)) {
                swapCount++;
                progressBar.value = swapCount;
                continue;
            }
            
            // Create a copy of the schedule and perform the swap
            let testSchedule = JSON.parse(JSON.stringify(bestSchedule));
            
            // Remove persons from their original days
            testSchedule[assignmentA.day] = testSchedule[assignmentA.day].filter(p => p !== assignmentA.person);
            testSchedule[assignmentB.day] = testSchedule[assignmentB.day].filter(p => p !== assignmentB.person);
            
            // Add persons to their new days
            testSchedule[assignmentA.day].push(assignmentB.person);
            testSchedule[assignmentB.day].push(assignmentA.person);
            
            // Calculate new statistics
            const testStats = calculateScheduleStats(testSchedule);
            const testScore = calculateScheduleScore(testStats);
            
            // If this swap improves the score, keep it
            if (testScore < bestScore) {
                bestSchedule = testSchedule;
                bestStats = testStats;
                bestScore = testScore;
                improvementCount++;
                
                // Update assignments array for future swaps
                assignments[i] = { person: assignmentB.person, day: assignmentA.day };
                assignments[j] = { person: assignmentA.person, day: assignmentB.day };
                
                console.log(`Found ${improvementCount}: Swap ${assignmentA.person}(the${assignmentA.day}th day) 和 ${assignmentB.person}(the${assignmentB.day}th day), Scores: ${testScore}`);
            }
            
            swapCount++;
            progressBar.value = swapCount;
            
            // Allow UI updates every 100 swaps
            if (swapCount % 100 === 0) {
                await delay(0);
            }
        }
    }
    
    progressContainer.style.display = 'none';
    
    console.log(`Success! try ${swapCount} swap, found ${improvementCount} improvements`);
    console.log('Final:', bestScore);
    
    return { schedule: bestSchedule, stats: bestStats };
}

function calculateScheduleScore(stats) {
    const hoursList = people.map(p => stats[p].hours);
    const restList = people.map(p => stats[p].restDays);
    const totalList = people.map(p => stats[p].hours + stats[p].restDays * 8);

    const maxHour = Math.max(...hoursList);
    const minHour = Math.min(...hoursList);
    const maxRest = Math.max(...restList);
    const minRest = Math.min(...restList);

    const diffHours = maxHour - minHour;
    const diffRest = maxRest - minRest;
    const diffTotal = Math.max(...totalList) - Math.min(...totalList);

    // Start with the weighted differences
    let score = diffHours + diffRest * 8 + diffTotal * 0.5;

    // Check each person for unfair balance
    for (const person of people) {
        const { hours, restDays } = stats[person];

        // If a person has max hours and max rest, penalize the score
        if (hours === maxHour && restDays === maxRest) {
            score += 100;  // Arbitrary large penalty
        }

        // Optional: also penalize if someone has min hour and min rest
        if (hours === minHour && restDays === minRest) {
            score += 100;
        }
    }

    return score;
}


async function generateBestSchedule() {
    const candidates = [];
    const TRIES = 50000;
    const BATCH_SIZE = 500;

    const hourThresholds = [8, 16];
    const restThresholds = [1, 2];

    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    progressContainer.style.display = 'block';

    const totalSteps = hourThresholds.length * restThresholds.length * TRIES;
    progressBar.max = totalSteps;
    progressBar.value = 0;

    let step = 0;
    let found = false;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let hourThreshold of hourThresholds) {
        for (let restThreshold of restThresholds) {
            let i = 0;

            async function processBatch() {
                const batchEnd = Math.min(i + BATCH_SIZE, TRIES);
                for (; i < batchEnd; i++) {
                    const result = tryGenerateSchedule(hourThreshold, restThreshold);
                    step++;
                    progressBar.value = step;

                    if (result) {
                        const { stats } = result;
                        const hoursList = people.map(p => stats[p].hours);
                        const restList = people.map(p => stats[p].restDays);
                        const totalList = people.map(p => stats[p].hours + stats[p].restDays * 8);

                        const diffHours = Math.max(...hoursList) - Math.min(...hoursList);
                        const diffRest = Math.max(...restList) - Math.min(...restList);
                        const diffTotal = Math.max(...totalList) - Math.min(...totalList);

                        const score = diffHours * 1000 + diffRest * 100 + diffTotal * 10;
                        candidates.push({ score, result });
                    }
                }

                if (i < TRIES && !found) {
                    await delay(0); // Let browser update UI
                    await processBatch();
                }
            }

            await processBatch();

            if (candidates.length > 0) {
                found = true;
                break;
            }
        }
        if (found) break;
    }

    progressContainer.style.display = 'none';

    if (candidates.length === 0) {
        showMessage('Can not Generate Schedule', 'error');
        return;
    }

    candidates.sort((a, b) => a.score - b.score);
    const best = candidates[0].result;

    console.log('Initial Schedule Generated，Start Optimizing...');
    showMessage('Swapping...', 'info');

    // Optimize the best schedule through swapping
    const optimizedResult = await optimizeScheduleWithSwaps(best.schedule, best.stats);
    const optimizedResult2 = await optimizeScheduleWithSwaps(optimizedResult.schedule, optimizedResult.stats);
    const optimizedResult3 = await optimizeScheduleWithSwaps(optimizedResult2.schedule, optimizedResult2.stats);

    currentSchedule = optimizedResult3.schedule;
    
    updateCalendarDisplay();
    updateStatistics(optimizedResult3.stats);
    
    showMessage('Optimized through Swap', 'success');
}



        // 更新日曆顯示
function updateCalendarDisplay() {
            const year = parseInt(document.getElementById('yearSelect').value);
            const month = parseInt(document.getElementById('monthSelect').value);
            const daysInMonth = new Date(year, month, 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                    const dayElement = document.getElementById(`day-${day}`);
                    const infoElement = document.getElementById(`info-${day}`);

                    const dayOfWeek = Zellercongruence(day, month, year);
                    const nextDate = new Date(year, month - 1, day + 1);
                    const nextY = nextDate.getFullYear();
                    const nextM = nextDate.getMonth() + 1;
                    const nextD = nextDate.getDate();

                    const isTodayHoliday = holidays.includes(day);
                    const isTomorrowHoliday = isNationalOrCompensatoryHoliday(nextY, nextM, nextD);
                    const isWeekend = (dayOfWeek === 6 || dayOfWeek === 0);
                    const isWeekendTomorrow = (nextDate.getDay() === 6 || nextDate.getDay() === 0);

                dayElement.classList.remove('scheduled', 'rest');

                
                let hours;


                if (isTodayHoliday && isTomorrowHoliday) {
                    hours = 24;
                } else if (isWeekend && isTomorrowHoliday) {
                    hours = 24;
                } else if (isTodayHoliday && isWeekendTomorrow) {
                    hours = 24;
                } else if (isTodayHoliday && !(isWeekendTomorrow || isTomorrowHoliday)) {
                    hours = 16;
                } else if (!(isTodayHoliday || isWeekend) && isTomorrowHoliday) {
                    hours = 16;
                } else {
                if (dayOfWeek === 6) {
                        hours = 24;
                } else if (dayOfWeek === 5) {
                        hours = 16;
                } else if (dayOfWeek === 0) {
                        hours = 16;
                } else {
                        hours = 8;
                }
                }

                const assigned = currentSchedule[day] || [];
                const preList = preassigned[day] || [];

                if (assigned.length > 0) {
                    dayElement.classList.add('scheduled');

                    const html = assigned.map(name => {
                    const cls = preList.includes(name) ? 'person-pre' : 'person-auto';
                    const color = personColors[name] || '#ccc';
                    return `<span class="${cls}" style="background-color: ${color}; padding: 2px 6px; border-radius: 6px; color: white; display: inline-block; margin-bottom: 2px;">${name}</span>`;
                    }).join('<br>');


                    infoElement.innerHTML = `${html}<br>${hours}小時`;
                } else if (preList.length > 0) {
                    const html = preList.map(obj => {
                    const name = typeof obj === 'string' ? obj : obj.name;
                    const role = typeof obj === 'string' ? '' : obj.role;
                    const color = personColors[name] || '#ccc';
                    return `<span class="person-pre" style="background-color: ${color}; padding: 2px 6px; border-radius: 6px; color: white; display: inline-block;">${role} ${name}</span>`;
                    }).join('、');



                    infoElement.innerHTML = `預排：${html}`;
                } else {
                    infoElement.innerHTML = '';
                }
            }
        }



        // 更新統計信息
        function updateStatistics(personStats) {
            const statistics = document.getElementById('statistics');
            statistics.innerHTML = '';
            
            people.forEach(person => {
                const stats = personStats[person];
                const total = stats.hours + stats.restDays * 8;
                
                const statCard = document.createElement('div');
                statCard.className = 'stat-card';
                statCard.innerHTML = `
                    <div class="stat-title">${person}</div>
                    <div class="stat-value">${stats.workDays}天</div>
                    <div class="stat-detail">值班時數: ${stats.hours}小時</div>
                    <div class="stat-detail">補休天數: ${stats.restDays}天</div>
                    <div class="stat-detail">Total: ${total}小時</div>
                `;
                statistics.appendChild(statCard);
            });
        }

        // 顯示消息
        function showMessage(message, type) {
            const messageArea = document.getElementById('messageArea');
            messageArea.innerHTML = `<div class="${type}-message">${message}</div>`;
            setTimeout(() => {
                messageArea.innerHTML = '';
            }, 15000);
        }

        // 重置排班
        function resetSchedule() {
            currentSchedule = {};
            preassigned = {};
            generateCalendar();
            document.getElementById('statistics').innerHTML = '';
            showMessage('排班表已重置', 'success');
        }

    function populatePersonSelects(preselected) {
    const person1Select = document.getElementById('person1Select');
    const person2Select = document.getElementById('person2Select');
    const person3Select = document.getElementById('person3Select');

    person1Select.innerHTML = '<option value="">-- 請選擇 --</option>';
    person2Select.innerHTML = '<option value="">-- 請選擇 --</option>';
    person3Select.innerHTML = '<option value="">-- 請選擇 --</option>';


    allPeople.forEach(name => {
        // Option 1 (S)
        const opt1 = document.createElement('option');
        opt1.value = name;
        opt1.textContent = `S: ${name}`;
        if (preselected[0] === name || preselected[0]?.name === name) opt1.selected = true;
        person1Select.appendChild(opt1);

        // Option 2 (M)
        const opt2 = document.createElement('option');
        opt2.value = name;
        opt2.textContent = `M: ${name}`;
        if (preselected[1] === name || preselected[1]?.name === name) opt2.selected = true;
        person2Select.appendChild(opt2);

        // Option 3 (R)
        if (person3Select) {
            const opt3 = document.createElement('option');
            opt3.value = name;
            opt3.textContent = `R: ${name}`;
            if (preselected[2] === name || preselected[2]?.name === name) opt3.selected = true;
            person3Select.appendChild(opt3);
        }
    });
}

function savePreassignment() {
    const val1 = document.getElementById('person1Select').value;
    const val2 = document.getElementById('person2Select').value;
    const val3 = document.getElementById('person3Select')?.value;

    const chosen = [];

    if (val1) chosen.push({ name: val1, role: 'S' });
    if (val2) chosen.push({ name: val2, role: 'M' });
    if (val3) chosen.push({ name: val3, role: 'R' });

    const names = chosen.map(c => c.name);
    if (new Set(names).size !== names.length) {
        alert('不能選擇相同的人兩次');
        return;
    }

    preassigned[selectedDayForPreassign] = chosen;
    closePreassignModal();
    updateCalendarDisplay();
}

function closePreassignModal() {
            document.getElementById('preassignModal').style.display = 'none';
            selectedDayForPreassign = null;
}

        
document.addEventListener('DOMContentLoaded', () => {
        init();
});
