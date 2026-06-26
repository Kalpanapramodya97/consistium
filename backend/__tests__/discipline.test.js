const { calculateDisciplineStats } = require('../routes/discipline');

describe('calculateDisciplineStats', () => {

  it('1. 0 perfect days = Beginner', () => {
    const habits = [
      { _id: 'h1', type: 'good', repeatPattern: 'every_day', startDate: new Date('2026-06-20') }
    ];
    const completions = []; // none
    const todayKey = '2026-06-25';

    const stats = calculateDisciplineStats(habits, completions, todayKey);
    expect(stats.currentLevel.name).toBe('Beginner');
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.totalPerfectDays).toBe(0);
  });

  it('2. 3-day current streak = Discipline Guy', () => {
    const habits = [
      { _id: 'h1', type: 'good', repeatPattern: 'every_day', startDate: new Date('2026-06-20') }
    ];
    // completions on 23, 24, 25
    const completions = [
      { habit: { _id: 'h1' }, dateKey: '2026-06-23' },
      { habit: { _id: 'h1' }, dateKey: '2026-06-24' },
      { habit: { _id: 'h1' }, dateKey: '2026-06-25' }
    ];
    const todayKey = '2026-06-25';

    const stats = calculateDisciplineStats(habits, completions, todayKey);
    expect(stats.currentStreak).toBe(3);
    expect(stats.currentLevel.name).toBe('Discipline Guy');
  });

  it('3. 7-day current streak = Consistent Guy', () => {
    const habits = [
      { _id: 'h1', type: 'good', repeatPattern: 'every_day', startDate: new Date('2026-06-19') }
    ];
    const completions = [];
    for(let i=19; i<=25; i++) {
      completions.push({ habit: { _id: 'h1' }, dateKey: `2026-06-${i}` });
    }
    const todayKey = '2026-06-25';

    const stats = calculateDisciplineStats(habits, completions, todayKey);
    expect(stats.currentStreak).toBe(7);
    expect(stats.currentLevel.name).toBe('Consistent Guy');
  });

  it('4. Broken streak resets current streak', () => {
    const habits = [
      { _id: 'h1', type: 'good', repeatPattern: 'every_day', startDate: new Date('2026-06-20') }
    ];
    const completions = [
      { habit: { _id: 'h1' }, dateKey: '2026-06-20' },
      { habit: { _id: 'h1' }, dateKey: '2026-06-21' },
      // missed 22
      { habit: { _id: 'h1' }, dateKey: '2026-06-23' },
      { habit: { _id: 'h1' }, dateKey: '2026-06-24' },
      { habit: { _id: 'h1' }, dateKey: '2026-06-25' }
    ];
    const todayKey = '2026-06-25';

    const stats = calculateDisciplineStats(habits, completions, todayKey);
    expect(stats.currentStreak).toBe(3);
  });

  it('5. Longest streak calculation', () => {
    const habits = [
      { _id: 'h1', type: 'good', repeatPattern: 'every_day', startDate: new Date('2026-06-01') }
    ];
    const completions = [
      // 5 day streak
      { habit: { _id: 'h1' }, dateKey: '2026-06-01' },
      { habit: { _id: 'h1' }, dateKey: '2026-06-02' },
      { habit: { _id: 'h1' }, dateKey: '2026-06-03' },
      { habit: { _id: 'h1' }, dateKey: '2026-06-04' },
      { habit: { _id: 'h1' }, dateKey: '2026-06-05' },
      // missed 06
      // 3 day current streak
      { habit: { _id: 'h1' }, dateKey: '2026-06-07' },
      { habit: { _id: 'h1' }, dateKey: '2026-06-08' },
      { habit: { _id: 'h1' }, dateKey: '2026-06-09' },
    ];
    const todayKey = '2026-06-09';

    const stats = calculateDisciplineStats(habits, completions, todayKey);
    expect(stats.longestStreak).toBe(5);
    expect(stats.currentStreak).toBe(3);
    expect(stats.totalPerfectDays).toBe(8);
  });

  it('6. Progress to next level', () => {
    const habits = [
      { _id: 'h1', type: 'good', repeatPattern: 'every_day', startDate: new Date('2026-06-20') }
    ];
    // 5 day streak. Between Discipline Guy (3) and Consistent Guy (7)
    // Progress should be: 5 - 3 = 2 days into a 4-day span -> 50%
    const completions = [];
    for(let i=21; i<=25; i++) {
      completions.push({ habit: { _id: 'h1' }, dateKey: `2026-06-${i}` });
    }
    const todayKey = '2026-06-25';

    const stats = calculateDisciplineStats(habits, completions, todayKey);
    expect(stats.currentStreak).toBe(5);
    expect(stats.currentLevel.name).toBe('Discipline Guy');
    expect(stats.nextLevel.name).toBe('Consistent Guy');
    expect(stats.daysToNextLevel).toBe(2);
    expect(stats.progressPercent).toBe(50);
  });

  it('7. Max level reached', () => {
    const habits = [
      { _id: 'h1', type: 'good', repeatPattern: 'every_day', startDate: new Date('2025-01-01') }
    ];
    const completions = [];
    for(let i=1; i<=110; i++) {
      let d = new Date(Date.UTC(2025, 0, i));
      const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
      completions.push({ habit: { _id: 'h1' }, dateKey });
    }
    // 110 days from Jan 1 is April 20. But any day >= 100 streak triggers max level.
    const todayKey = '2025-04-20';

    const stats = calculateDisciplineStats(habits, completions, todayKey);
    expect(stats.currentStreak).toBe(110);
    expect(stats.currentLevel.name).toBe('Legend');
    expect(stats.nextLevel).toBeNull();
  });

  it('8. Days with no scheduled habits are ignored', () => {
    const habits = [
      { _id: 'h1', type: 'good', repeatPattern: 'weekdays', startDate: new Date('2026-06-22') } // Monday
    ];
    const completions = [
      { habit: { _id: 'h1' }, dateKey: '2026-06-22' }, // Monday
      { habit: { _id: 'h1' }, dateKey: '2026-06-23' }, // Tuesday
      { habit: { _id: 'h1' }, dateKey: '2026-06-24' }, // Wednesday
      { habit: { _id: 'h1' }, dateKey: '2026-06-25' }, // Thursday
      { habit: { _id: 'h1' }, dateKey: '2026-06-26' }, // Friday
    ];
    const todayKey = '2026-06-28'; // Sunday. Saturday and Sunday should be ignored and not increment streak, but also not break it!

    const stats = calculateDisciplineStats(habits, completions, todayKey);
    // Since Saturday and Sunday are ignored, the streak should be exactly 5 from M-F.
    expect(stats.currentStreak).toBe(5);
  });
});
