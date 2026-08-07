import { PRESENCE_LABELS, PRESENCE_STATUS } from "./constants.js";

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.innerText = text;
  }
  return element;
}

function formatMeetingDate(dateValue) {
  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsedDate);
}

export function createUI() {
  const elements = {
    selectedSectionBadge: document.getElementById("selected-section-badge"),
    summaryBadge: document.getElementById("summary-badge"),
    sectionsContainer: document.getElementById("sections-container"),
    datesContainer: document.getElementById("dates-container"),
    animesContainer: document.getElementById("animes-container"),
    apiRequest: document.getElementById("api-request"),
    apiResponse: document.getElementById("api-response"),
    backSectionsButton: document.getElementById("btn-back-sections"),
    backDatesButton: document.getElementById("btn-back-dates"),
    submitButton: document.getElementById("btn-submit-presences")
  };

  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
  }

  function setApiRequest(text) {
    elements.apiRequest.innerText = text;
  }

  function setApiResponse(text) {
    elements.apiResponse.innerText = text;
  }

  function setSelectedSection(section) {
    elements.selectedSectionBadge.innerText = `Section : ${section}`;
  }

  function setSummary(section, date) {
    elements.summaryBadge.innerText = `${section} - ${formatMeetingDate(date)}`;
  }

  function renderSections(sections, onSelectSection) {
    elements.sectionsContainer.innerHTML = "";

    sections.forEach((section) => {
      const button = createElement("button", "btn", section);
      button.style.marginBottom = "8px";
      button.addEventListener("click", () => onSelectSection(section));
      elements.sectionsContainer.appendChild(button);
    });
  }

  function renderDates(dates, onSelectDate) {
    elements.datesContainer.innerHTML = "";

    if (dates.length === 0) {
      elements.datesContainer.innerHTML = "<p>Aucune date enregistrée pour cette section.</p>";
      return;
    }

    dates.forEach((dateValue) => {
      const item = createElement("div", "list-item clickable", formatMeetingDate(dateValue));
      item.addEventListener("click", () => onSelectDate(dateValue));
      elements.datesContainer.appendChild(item);
    });
  }

  function renderAnimes(animes, presences, onPresenceChange) {
    elements.animesContainer.innerHTML = "";

    if (animes.length === 0) {
      elements.animesContainer.innerHTML = "<p>Aucun animé trouvé dans cette section.</p>";
      return;
    }

    animes.forEach((anime) => {
      const item = createElement("div", "list-item");
      const nameSpan = createElement("span", "", anime);
      const toggleGroup = createElement("div", "toggle-group");

      const buttonDefinitions = [
        {
          status: PRESENCE_STATUS.PRESENT,
          text: PRESENCE_LABELS[PRESENCE_STATUS.PRESENT],
          className: "present"
        },
        {
          status: PRESENCE_STATUS.JUSTIFIED_ABSENCE,
          text: "Abs. justifiée",
          className: "justified"
        },
        {
          status: PRESENCE_STATUS.UNJUSTIFIED_ABSENCE,
          text: "Abs. non justifiée",
          className: "unjustified"
        }
      ];

      buttonDefinitions.forEach((definition) => {
        const isActive = presences[anime] === definition.status;
        const className = `toggle-btn ${isActive ? definition.className : ""}`.trim();
        const button = createElement("button", className, definition.text);
        button.addEventListener("click", () => onPresenceChange(anime, definition.status));
        toggleGroup.appendChild(button);
      });

      item.appendChild(nameSpan);
      item.appendChild(toggleGroup);
      elements.animesContainer.appendChild(item);
    });
  }

  function bindActions({ onBackToSections, onBackToDates, onSubmit }) {
    elements.backSectionsButton.addEventListener("click", onBackToSections);
    elements.backDatesButton.addEventListener("click", onBackToDates);
    elements.submitButton.addEventListener("click", onSubmit);

    elements.selectedSectionBadge.classList.add("clickable");
    elements.selectedSectionBadge.setAttribute("role", "button");
    elements.selectedSectionBadge.setAttribute("tabindex", "0");
    elements.selectedSectionBadge.setAttribute("aria-label", "Revenir au choix de la section");
    elements.selectedSectionBadge.addEventListener("click", onBackToSections);
    elements.selectedSectionBadge.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onBackToSections();
      }
    });

    elements.summaryBadge.classList.add("clickable");
    elements.summaryBadge.setAttribute("role", "button");
    elements.summaryBadge.setAttribute("tabindex", "0");
    elements.summaryBadge.setAttribute("aria-label", "Revenir au choix de la date");
    elements.summaryBadge.addEventListener("click", onBackToDates);
    elements.summaryBadge.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onBackToDates();
      }
    });
  }

  return {
    showScreen,
    setApiRequest,
    setApiResponse,
    setSelectedSection,
    setSummary,
    renderSections,
    renderDates,
    renderAnimes,
    bindActions
  };
}
