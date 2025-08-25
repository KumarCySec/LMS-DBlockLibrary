// librarian-dashboard.js

function initializeDashboard() {
  // 1. Library Status Handling
  const isOpen = JSON.parse(document.getElementById('dashboard-data').dataset.isOpen);
  const storedDate = localStorage.getItem("next_open_dt");

  // Next opening display
  if (!isOpen && storedDate) {
    try {
      const dt = new Date(storedDate);
      const nextOpenDisplay = document.getElementById("nextOpenDisplay");
      const nextOpenTime = document.getElementById("nextOpenTime");
      
      if (nextOpenDisplay && nextOpenTime && !isNaN(dt)) {
        nextOpenTime.textContent = dt.toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
        nextOpenDisplay.hidden = false;
      }
    } catch (e) {
      console.error("Date parsing error:", e);
      localStorage.removeItem("next_open_dt");
    }
  }

  // 2. Modal Controls
  const closeModalBtn = document.getElementById("closeModalBtn");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", (e) => {
      e.preventDefault();
      new bootstrap.Modal(document.getElementById("closeModal")).show();
    });
  }

  // 3. Form Handling
  document.getElementById("closeForm")?.addEventListener("submit", () => {
    const dateInput = document.getElementById("nextOpenInput");
    if (dateInput?.value) {
      localStorage.setItem("next_open_dt", new Date(dateInput.value).toISOString());
    }
  });

  // 4. Volunteer Assignment
  const daySelector = document.getElementById("daySelector");
  const volunteerSection = document.getElementById("volunteerSelection");
  if (daySelector && volunteerSection) {
    daySelector.addEventListener("change", () => {
      volunteerSection.classList.toggle("d-none", !daySelector.value);
    });
  }

  // 5. Theme Adaptation
  function updateTextColors() {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const color = isDark ? "#ffffff" : "#000000";
    
    document.querySelectorAll("[data-theme-adjust]").forEach(element => {
      element.style.color = color;
    });
  }

  // 6. Search Functionality
  const searchInput = document.getElementById("searchInput");
  const tableRows = document.querySelectorAll("#checkoutTable tbody tr");
  if (searchInput && tableRows) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.trim().toLowerCase();
      tableRows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none";
      });
    });
  }

  // Initial setup
  updateTextColors();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateTextColors);
}

// Initialize when ready
document.addEventListener("DOMContentLoaded", initializeDashboard);