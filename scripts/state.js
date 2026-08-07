import { PRESENCE_STATUS, PRESENCE_LABELS } from "./constants.js";

const appState = {
  sections: [],
  datesBySection: {},
  animesBySection: {},
  history: [],
  selectedSection: null,
  selectedDate: null,
  presences: {}
};

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolvePresenceStatus(statusLabel) {
  const normalizedStatus = normalizeText(statusLabel);

  if (normalizedStatus === normalizeText(PRESENCE_LABELS[PRESENCE_STATUS.PRESENT]) || normalizedStatus === normalizeText(PRESENCE_STATUS.PRESENT)) {
    return PRESENCE_STATUS.PRESENT;
  }

  if (
    normalizedStatus === normalizeText(PRESENCE_LABELS[PRESENCE_STATUS.JUSTIFIED_ABSENCE]) ||
    normalizedStatus === normalizeText(PRESENCE_STATUS.JUSTIFIED_ABSENCE)
  ) {
    return PRESENCE_STATUS.JUSTIFIED_ABSENCE;
  }

  if (
    normalizedStatus === normalizeText(PRESENCE_LABELS[PRESENCE_STATUS.UNJUSTIFIED_ABSENCE]) ||
    normalizedStatus === normalizeText(PRESENCE_STATUS.UNJUSTIFIED_ABSENCE)
  ) {
    return PRESENCE_STATUS.UNJUSTIFIED_ABSENCE;
  }

  return null;
}

export function setCatalogData(data) {
  appState.sections = data.sections || [];
  appState.datesBySection = data.dates || {};
  appState.animesBySection = data.animes || {};
  appState.history = data.history || [];
}

export function getState() {
  return appState;
}

export function selectSection(section) {
  appState.selectedSection = section;
}

export function selectDate(date) {
  appState.selectedDate = date;
}

export function getDatesForSelectedSection() {
  return appState.datesBySection[appState.selectedSection] || [];
}

export function getAnimesForSelectedSection() {
  return appState.animesBySection[appState.selectedSection] || [];
}

export function initializePresencesForSelectedSection() {
  const animes = getAnimesForSelectedSection();
  const presencesByAnime = {};

  animes.forEach((anime) => {
    presencesByAnime[anime] = PRESENCE_STATUS.PRESENT;
  });

  appState.history.forEach((entry) => {
    if (entry.section !== appState.selectedSection || entry.dateReunion !== appState.selectedDate || !entry.nomAnime) {
      return;
    }

    const resolvedStatus = resolvePresenceStatus(entry.statut);

    if (resolvedStatus) {
      presencesByAnime[entry.nomAnime] = resolvedStatus;
    }
  });

  appState.presences = presencesByAnime;
}

export function updatePresence(anime, status) {
  appState.presences[anime] = status;
}

export function buildPayload() {
  return {
    section: appState.selectedSection,
    dateReunion: appState.selectedDate,
    presences: Object.keys(appState.presences).map((nomAnime) => ({
      nomAnime,
      statut: PRESENCE_LABELS[appState.presences[nomAnime]] || PRESENCE_LABELS[PRESENCE_STATUS.PRESENT]
    }))
  };
}
