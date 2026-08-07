import { PRESENCE_STATUS, PRESENCE_LABELS } from "./constants.js";

const appState = {
  sections: [],
  datesBySection: {},
  animesBySection: {},
  selectedSection: null,
  selectedDate: null,
  presences: {}
};

export function setCatalogData(data) {
  appState.sections = data.sections || [];
  appState.datesBySection = data.dates || {};
  appState.animesBySection = data.animes || {};
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
  appState.presences = {};
  animes.forEach((anime) => {
    appState.presences[anime] = PRESENCE_STATUS.PRESENT;
  });
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
