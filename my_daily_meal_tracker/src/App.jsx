import React, { useMemo, useState } from 'react';
import {
  Utensils,
  Dumbbell,
  Coffee,
  Sun,
  Moon,
  Calculator,
  ChevronRight,
  Trash2,
  CalendarDays,
  Save,
  Scale,
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import './App.css';

const OATMEAL_CAL_PER_GRAM = 3.89;

export default function App() {
  const [mealData, setMealData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    dayName: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    weight: '',
    breakfast: { ateOatmeal: false, grams: 0 },
    lunch: { foodName: '', grams: 0, calories: 0 },
    eveningSnack: { calories: 0 },
    proteinShake: { calories: 0 },
    dinner: { calories: 0 },
  });

  const [activeTab, setActiveTab] = useState('input');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const breakfastCalories = useMemo(() => {
    return mealData.breakfast.ateOatmeal
      ? Math.round(mealData.breakfast.grams * OATMEAL_CAL_PER_GRAM)
      : 0;
  }, [mealData.breakfast]);

  const totalCalories = useMemo(() => {
    return (
      breakfastCalories +
      Number(mealData.lunch.calories || 0) +
      Number(mealData.eveningSnack.calories || 0) +
      Number(mealData.proteinShake.calories || 0) +
      Number(mealData.dinner.calories || 0)
    );
  }, [mealData, breakfastCalories]);

  const getFeedback = () => {
    if (totalCalories === 0) {
      return 'Start logging your meals!';
    }
    if (totalCalories < 1300) {
      return 'You can eat more calories to meet your daily needs.';
    }
    if (totalCalories <= 1600) {
      return 'You are on track, keep it up!';
    }
    if (totalCalories < 2000) {
      return 'Good intake, watch your evening meals.';
    }
    return "You've reached a high calorie count for the day.";
  };

  const updateField = (meal, field, value) => {
    setMealData((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        [field]: value,
      },
    }));
  };

  const updateTopLevelField = (field, value) => {
    setMealData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (value) => {
    const selectedDate = new Date(value);
    const dayName = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
    });

    setMealData((prev) => ({
      ...prev,
      entryDate: value,
      dayName,
    }));
  };

  const saveEntry = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const payload = {
        entryDate: mealData.entryDate,
        dayName: mealData.dayName,
        weight: mealData.weight ? parseFloat(mealData.weight) : null,
        meals: {
          breakfast: {
            ateOatmeal: mealData.breakfast.ateOatmeal,
            grams: Number(mealData.breakfast.grams || 0),
            calories: breakfastCalories,
          },
          lunch: {
            foodName: mealData.lunch.foodName,
            grams: Number(mealData.lunch.grams || 0),
            calories: Number(mealData.lunch.calories || 0),
          },
          eveningSnack: {
            calories: Number(mealData.eveningSnack.calories || 0),
          },
          proteinShake: {
            calories: Number(mealData.proteinShake.calories || 0),
          },
          dinner: {
            calories: Number(mealData.dinner.calories || 0),
          },
        },
        totalCalories,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'calorie_logs'), payload);
      setSaveMessage('Entry saved successfully.');
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage('Failed to save entry. Make sure Firestore Database is created.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetLog = () => {
    setMealData({
      entryDate: new Date().toISOString().split('T')[0],
      dayName: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      weight: '',
      breakfast: { ateOatmeal: false, grams: 0 },
      lunch: { foodName: '', grams: 0, calories: 0 },
      eveningSnack: { calories: 0 },
      proteinShake: { calories: 0 },
      dinner: { calories: 0 },
    });
    setSaveMessage('');
    setActiveTab('input');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon">
              <Calculator size={22} color="white" />
            </div>
            <h1>CalorieTrack</h1>
          </div>

          <div className="tabs">
            <button
              className={activeTab === 'input' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('input')}
            >
              Log
            </button>
            <button
              className={activeTab === 'summary' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {activeTab === 'input' ? (
          <>
            <section className="card">
              <div className="section-title">
                <CalendarDays size={20} />
                <h2>Daily Tracking</h2>
              </div>

              <div className="grid-3">
                <div className="field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={mealData.entryDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Day</label>
                  <input type="text" value={mealData.dayName} readOnly />
                </div>

                <div className="field">
                  <label>Weight</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={mealData.weight}
                      onChange={(e) => updateTopLevelField('weight', e.target.value)}
                      placeholder="e.g. 72"
                    />
                    <span>kg</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="section-title">
                <Coffee size={20} />
                <h2>Breakfast</h2>
              </div>

              <div className="toggle-row">
                <span>Did you eat oatmeal?</span>
                <button
                  className={mealData.breakfast.ateOatmeal ? 'switch on' : 'switch'}
                  onClick={() =>
                    updateField('breakfast', 'ateOatmeal', !mealData.breakfast.ateOatmeal)
                  }
                >
                  <span></span>
                </button>
              </div>

              {mealData.breakfast.ateOatmeal && (
                <div className="field">
                  <label>Grams of Oatmeal</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={mealData.breakfast.grams || ''}
                      onChange={(e) =>
                        updateField('breakfast', 'grams', parseFloat(e.target.value) || 0)
                      }
                      placeholder="e.g. 50"
                    />
                    <span>g</span>
                  </div>
                  <p className="hint">Estimated: {breakfastCalories} kcal</p>
                </div>
              )}
            </section>

            <section className="card">
              <div className="section-title">
                <Sun size={20} />
                <h2>Lunch</h2>
              </div>

              <div className="field">
                <label>What did you eat?</label>
                <input
                  type="text"
                  value={mealData.lunch.foodName}
                  onChange={(e) => updateField('lunch', 'foodName', e.target.value)}
                  placeholder="e.g. Grilled Chicken Salad"
                />
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>Grams</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={mealData.lunch.grams || ''}
                      onChange={(e) =>
                        updateField('lunch', 'grams', parseFloat(e.target.value) || 0)
                      }
                      placeholder="200"
                    />
                    <span>g</span>
                  </div>
                </div>

                <div className="field">
                  <label>Calories</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={mealData.lunch.calories || ''}
                      onChange={(e) =>
                        updateField('lunch', 'calories', parseFloat(e.target.value) || 0)
                      }
                      placeholder="Enter calories"
                    />
                    <span>kcal</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="section-title">
                <Dumbbell size={20} />
                <h2>Gym & Snacks</h2>
              </div>

              <div className="slider-group">
                <div className="slider-label">
                  <label>Evening Snack (Pre-Gym)</label>
                  <span>{mealData.eveningSnack.calories} kcal</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={mealData.eveningSnack.calories}
                  onChange={(e) =>
                    updateField('eveningSnack', 'calories', parseInt(e.target.value, 10))
                  }
                />
              </div>

              <div className="slider-group">
                <div className="slider-label">
                  <label>Protein Shake (Post-Gym)</label>
                  <span>{mealData.proteinShake.calories} kcal</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={mealData.proteinShake.calories}
                  onChange={(e) =>
                    updateField('proteinShake', 'calories', parseInt(e.target.value, 10))
                  }
                />
              </div>
            </section>

            <section className="card">
              <div className="section-title">
                <Moon size={20} />
                <h2>Dinner</h2>
              </div>

              <div className="field">
                <label>Calories Consumed</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    value={mealData.dinner.calories || ''}
                    onChange={(e) =>
                      updateField('dinner', 'calories', parseFloat(e.target.value) || 0)
                    }
                    placeholder="Enter calories"
                  />
                  <span>kcal</span>
                </div>
              </div>
            </section>

            <section className="card">
              <button className="primary-btn" onClick={saveEntry} disabled={isSaving}>
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Entry'}
              </button>

              {saveMessage && <p className="message">{saveMessage}</p>}
            </section>
          </>
        ) : (
          <>
            <section className="summary-card">
              <p className="summary-label">Total Daily Intake</p>
              <div className="summary-total">
                <span className="big-number">{totalCalories}</span>
                <span className="unit">kcal</span>
              </div>
              <div className="feedback-box">{getFeedback()}</div>

              <div className="summary-grid">
                <div className="mini-card">
                  <p>Date</p>
                  <strong>{mealData.entryDate}</strong>
                </div>
                <div className="mini-card">
                  <p>Day</p>
                  <strong>{mealData.dayName}</strong>
                </div>
                <div className="mini-card">
                  <p>Weight</p>
                  <strong>{mealData.weight ? `${mealData.weight} kg` : 'Not entered'}</strong>
                </div>
              </div>
            </section>

            <section className="summary-list">
              {[
                { label: 'Breakfast', value: breakfastCalories, icon: Coffee },
                { label: 'Lunch', value: mealData.lunch.calories, icon: Sun },
                { label: 'Evening Snack', value: mealData.eveningSnack.calories, icon: Utensils },
                { label: 'Protein Shake', value: mealData.proteinShake.calories, icon: Dumbbell },
                { label: 'Dinner', value: mealData.dinner.calories, icon: Moon },
              ].map((item, i) => (
                <div key={i} className="summary-item">
                  <div className="summary-item-left">
                    <div className="summary-icon">
                      <item.icon size={18} />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  <div className="summary-item-right">{item.value} kcal</div>
                </div>
              ))}
            </section>

            <button className="reset-btn" onClick={resetLog}>
              <Trash2 size={18} />
              Reset Daily Log
            </button>
          </>
        )}
      </main>

      {activeTab === 'input' && (
        <div className="floating-bar">
          <div>
            <p className="floating-label">Current Total</p>
            <h3>{totalCalories} kcal</h3>
          </div>

          <button className="floating-btn" onClick={() => setActiveTab('summary')}>
            View Summary
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}