        let currentSchedule = {};       
        const allPeople = ['黃經洲', '洪柜峰', '林宏儒', '呂明峯', '周育稔', '許世勳', '羅應順' ];
		
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
		
        function updateHolidays() {
            const input = document.getElementById('holidayInput').value;
            holidays = input.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
            generateCalendar(); 
        }

        
        function setupDateSelectors() {
            const yearSelect = document.getElementById('yearSelect');
            const monthSelect = document.getElementById('monthSelect');
            
            const currentYear = new Date().getFullYear();
            for (let year = currentYear - 1; year <= currentYear + 2; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === currentYear) option.selected = true;
                yearSelect.appendChild(option);
            }

            for (let month = 1; month <= 12; month++) {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = month + '月';
                if (month === new Date().getMonth() + 2) option.selected = true; // Default is next month.
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
            
            // 計算第一天是星期幾const firstDay = new Date(year, month - 1, 1).getDay();
            const firstDay = (Zellercongruence(1, month, year) + 6)%7;
            

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
                
                const dayNumber = document.createElement('div');
                dayNumber.className = 'day-number';
                dayNumber.textContent = day;
                
                const dayInfo = document.createElement('div');
                dayInfo.className = 'day-info';
                dayInfo.id = `info-${day}`;
                
                dayElement.appendChild(dayNumber);
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
        const nextDayOfWeek = Zellercongruence(day + 1, month, year);

        let workHours, isHardDay, isRestDay;

        const isTodayHoliday = holidays.includes(day);
        const isTomorrowHoliday = holidays.includes(day + 1);
        const isWeekend = (dayOfWeek === 6 || dayOfWeek === 0);
        const isWeekendTomorrow = (nextDayOfWeek === 6 || nextDayOfWeek === 0);
        
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
        const nextDayOfWeek = Zellercongruence(day + 1, month, year);

        let workHours, isHardDay, isRestDay;

        const isTodayHoliday = holidays.includes(day);
        const isTomorrowHoliday = holidays.includes(day + 1);
        const isWeekend = (dayOfWeek === 6 || dayOfWeek === 0);
        const isWeekendTomorrow = (nextDayOfWeek === 6 || nextDayOfWeek === 0);
        
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
                    const nextDayOfWeek = Zellercongruence(day + 1, month, year);

                    const isTodayHoliday = holidays.includes(day);
                    const isTomorrowHoliday = holidays.includes(day + 1);
                    const isWeekend = (dayOfWeek === 6 || dayOfWeek === 0);
                    const isWeekendTomorrow = (nextDayOfWeek === 6 || nextDayOfWeek === 0);

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
           
           holidays = [];
           document.getElementById('holidayInput').value = '';
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