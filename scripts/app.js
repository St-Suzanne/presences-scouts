import { API_URL } from "./constants.js";
import { fetchData, submitData } from "./api.js";
import {
  buildPayload,
  getAnimesForSelectedSection,
  getDatesForSelectedSection,
  getState,
  initializePresencesForSelectedSection,
  selectDate,
  selectSection,
  setCatalogData,
  updatePresence
} from "./state.js";
import { createUI } from "./ui.js";

const ui = createUI();

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.warn("Service worker registration failed:", error);
  }
}

function handleSectionSelection(section) {
  selectSection(section);
  ui.setSelectedSection(section);
  ui.renderDates(getDatesForSelectedSection(), handleDateSelection);
  ui.showScreen("screen-dates");
}

function handleDateSelection(date) {
  selectDate(date);
  const state = getState();
  ui.setSummary(state.selectedSection, state.selectedDate);

  initializePresencesForSelectedSection();
  ui.renderAnimes(getAnimesForSelectedSection(), state.presences, handlePresenceChange);
  ui.showScreen("screen-animes");
}

function handlePresenceChange(anime, status) {
  updatePresence(anime, status);
  ui.renderAnimes(getAnimesForSelectedSection(), getState().presences, handlePresenceChange);
}

async function loadData() {
  ui.showScreen("screen-loading");

  try {
    const result = await fetchData(API_URL, ui.setApiRequest, ui.setApiResponse);
    if (result.status !== "success") {
      alert("Erreur lors de la récupération des données : " + (result.message || "Erreur inconnue"));
      return;
    }

    setCatalogData(result.data || {});
    ui.renderSections(getState().sections, handleSectionSelection);
    ui.showScreen("screen-sections");
  } catch (error) {
    ui.setApiResponse(`Erreur: ${error.message || error}`);
    alert("Impossible de contacter le serveur. Vérifiez l'URL de l'API ou votre connexion.");
  }
}

async function handleSubmit() {
  const payload = buildPayload();
  ui.showScreen("screen-loading");

  try {
    const result = await submitData(API_URL, payload, ui.setApiRequest, ui.setApiResponse);
    if (result.status === "success") {
      alert(`Présences enregistrées avec succès (${result.count} animés) !`);
      ui.showScreen("screen-sections");
      return;
    }

    alert("Erreur lors de l'enregistrement : " + (result.message || "Erreur inconnue"));
    ui.showScreen("screen-animes");
  } catch (error) {
    ui.setApiResponse(`Erreur: ${error.message || error}`);
    alert("Erreur lors de la transmission des données.");
    ui.showScreen("screen-animes");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const goToDatesScreen = () => ui.showScreen("screen-dates");

  ui.bindActions({
    onBackToSections: () => ui.showScreen("screen-sections"),
    onBackToDates: goToDatesScreen,
    onSubmit: handleSubmit
  });

  registerServiceWorker();
  loadData();
});
