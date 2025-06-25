import React, { useState } from 'react';
import dayjs from 'dayjs';
import initialEvents from '../data/events.json';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    start: '',
    end: '',
  });

  const today = dayjs().format('YYYY-MM-DD');
  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const startDay = startOfMonth.day();
  const daysInMonth = currentDate.daysInMonth();

  const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'));

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(dayjs(currentDate).date(i));
  }

  const getEventsForDay = (date) =>
    events.filter((e) => e.date === date.format('YYYY-MM-DD'));

  const openForm = () => {
    setFormData({
      title: '',
      date: currentDate.format('YYYY-MM-DD'),
      start: '',
      end: '',
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.start || !formData.end)
      return alert('Please fill all fields');
    setEvents((prev) => [...prev, formData]);
    setShowForm(false);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={prevMonth}>{'<'}</button>
        <h2>{currentDate.format('MMMM YYYY')}</h2>
        <button onClick={nextMonth}>{'>'}</button>
        <button className="add-button" onClick={openForm}>
          Add Event
        </button>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="calendar-day-name">
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (!day)
            return <div key={index} className="empty-cell"></div>;

          const dayEvents = getEventsForDay(day);
          const isToday = day.format('YYYY-MM-DD') === today;

          return (
            <div
              key={index}
              className={`calendar-day ${isToday ? 'today' : ''}`}
            >
              <div className="date-number">{day.date()}</div>
              {dayEvents.map((event, idx) => (
                <div key={idx} className="event">
                  <strong>{event.title}</strong>
                  <br />
                  <small>
                    {event.start} - {event.end}
                  </small>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Event</h3>
            <form onSubmit={handleAddEvent}>
              <input
                type="text"
                name="title"
                placeholder="Event title"
                onChange={handleChange}
                value={formData.title}
                required
              />
              <input
                type="date"
                name="date"
                onChange={handleChange}
                value={formData.date}
                required
              />
              <input
                type="time"
                name="start"
                onChange={handleChange}
                value={formData.start}
                required
              />
              <input
                type="time"
                name="end"
                onChange={handleChange}
                value={formData.end}
                required
              />
              <button type="submit">Add</button>
              <button type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
