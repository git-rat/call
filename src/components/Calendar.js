import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import initialEvents from "../data/events.json";
import "./Calendar.css";

dayjs.extend(isoWeek);

const CATEGORY_COLORS = {
  Work: "#FF8C00",
  Personal: "#6A5ACD",
  Study: "#20B2AA",
  Urgent: "#DC143C",
  Holiday: "#008000",
  Default: "#999",
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState(() => {
    const stored = localStorage.getItem("calendarEvents");
    return stored ? JSON.parse(stored) : initialEvents;
  });
  const [defaultEvents, setDefaultEvents] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("month");
  const [draggedIndex, setDraggedIndex] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    start: "",
    end: "",
    category: "Default",
  });

  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    fetch("/call/defaultEvents.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch JSON");
        return res.json();
      })
      .then((data) => setDefaultEvents(data))
      .catch((err) => console.error("Failed to load default events", err));
  }, []);

  const today = dayjs().format("YYYY-MM-DD");

  const prev = () =>
    setCurrentDate(
      viewMode === "month"
        ? currentDate.subtract(1, "month")
        : currentDate.subtract(1, "week")
    );

  const next = () =>
    setCurrentDate(
      viewMode === "month"
        ? currentDate.add(1, "month")
        : currentDate.add(1, "week")
    );

  const toggleView = () =>
    setViewMode((prev) => (prev === "month" ? "week" : "month"));

  const getCalendarDays = () => {
    if (viewMode === "month") {
      const startOfMonth = currentDate.startOf("month");
      const startDay = startOfMonth.day();
      const daysInMonth = currentDate.daysInMonth();

      const days = [];
      for (let i = 0; i < startDay; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(dayjs(currentDate).date(i));
      }
      return days;
    } else {
      const startOfWeek = currentDate.startOf("week");
      return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
    }
  };

  const getEventsForDay = (date) => {
    return [...defaultEvents, ...events].filter(
      (e) =>
        e.date === date.format("YYYY-MM-DD") &&
        (e.title.toLowerCase().includes(searchTerm) ||
          e.date.includes(searchTerm))
    );
  };

  const openForm = (event = null, index = null) => {
    if (event) {
      setFormData(event);
      setEditIndex(index);
    } else {
      setFormData({
        title: "",
        date: currentDate.format("YYYY-MM-DD"),
        start: "",
        end: "",
        category: "Default",
      });
      setEditIndex(null);
    }
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.start || !formData.end)
      return alert("Please fill all fields");

    if (editIndex !== null) {
      setEvents((prev) =>
        prev.map((ev, i) => (i === editIndex ? formData : ev))
      );
    } else {
      setEvents((prev) => [...prev, formData]);
    }

    setShowForm(false);
    setEditIndex(null);
  };

  const handleDelete = (index) => {
    if (window.confirm("Delete this event?")) {
      setEvents((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const exportToCSV = () => {
    const headers = ["Title", "Date", "Start", "End", "Category"];
    const rows = events.map((e) => [
      e.title,
      e.date,
      e.start,
      e.end,
      e.category,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((item) => `"${item}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "calendar-events.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={prev}>{"<"}</button>
        <h2>
          {viewMode === "month"
            ? currentDate.format("MMMM YYYY")
            : `Week of ${currentDate.startOf("week").format("MMM D")}`}
        </h2>
        <button onClick={next}>{">"}</button>
        <input
          type="text"
          placeholder="Search events"
          onChange={handleSearchChange}
          style={{
            flex: "1",
            margin: "0 10px",
            padding: "6px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
        <button className="add-button" onClick={() => openForm()}>
          Add Event
        </button>
        <button
          className="add-button"
          style={{ backgroundColor: "#333" }}
          onClick={toggleView}
        >
          {viewMode === "month" ? "Week View" : "Month View"}
        </button>
        <button
          className="add-button"
          style={{ backgroundColor: "#007bff" }}
          onClick={exportToCSV}
        >
          Export CSV
        </button>
      </div>

      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="calendar-day-name">
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (!day) return <div key={index} className="empty-cell"></div>;

          const dayEvents = getEventsForDay(day);
          const isToday = day.format("YYYY-MM-DD") === today;

          return (
            <div
              key={index}
              className={`calendar-day ${isToday ? "today" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedIndex !== null) {
                  const newDate = day.format("YYYY-MM-DD");
                  setEvents((prev) =>
                    prev.map((ev, i) =>
                      i === draggedIndex ? { ...ev, date: newDate } : ev
                    )
                  );
                  setDraggedIndex(null);
                }
              }}
            >
              <div className="date-number">{day.date()}</div>
              {dayEvents.map((event, idx) => {
                const eventIndex = events.findIndex(
                  (e) =>
                    e.title === event.title &&
                    e.date === event.date &&
                    e.start === event.start &&
                    e.end === event.end
                );

                const color =
                  CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Default;

                const isDefault = defaultEvents.some(
                  (d) =>
                    d.title === event.title &&
                    d.date === event.date &&
                    d.start === event.start &&
                    d.end === event.end
                );

                return (
                  <div
                    key={idx}
                    className="event"
                    draggable={!isDefault}
                    onDragStart={() =>
                      !isDefault && setDraggedIndex(eventIndex)
                    }
                    style={{
                      borderLeft: `4px solid ${color}`,
                      cursor: isDefault ? "default" : "grab",
                    }}
                  >
                    <strong>{event.title}</strong>
                    <br />
                    <small>
                      {event.start} - {event.end}
                    </small>
                    <br />
                    <small style={{ color }}>{event.category}</small>
                    <br />
                    {!isDefault && (
                      <>
                        <button
                          style={{
                            fontSize: "10px",
                            marginTop: "4px",
                            marginRight: "6px",
                          }}
                          onClick={() => openForm(event, eventIndex)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ fontSize: "10px", marginTop: "4px" }}
                          onClick={() => handleDelete(eventIndex)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editIndex !== null ? "Edit Event" : "Add Event"}</h3>
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
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Study">Study</option>
                <option value="Urgent">Urgent</option>
                <option value="Holiday">Holiday</option>
              </select>
              <button type="submit">
                {editIndex !== null ? "Update" : "Add"}
              </button>
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
