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

const STORAGE_KEY = "ps_password";
let currentPassword = null;

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
    const result = await fetchData(API_URL, ui.setApiRequest, ui.setApiResponse, currentPassword);
    if (result.status !== "success") {
      // Si mot de passe invalide, forcer l'écran de connexion
      if (result.status === "unauthorized") {
        localStorage.removeItem(STORAGE_KEY);
        currentPassword = null;
        showLogin("Mot de passe incorrect ou modifié. Veuillez vous reconnecter.");
        return;
      }

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


document.addEventListener("DOMContentLoaded", () => {
  const goToDatesScreen = () => ui.showScreen("screen-dates");

  ui.bindActions({
    onBackToSections: () => ui.showScreen("screen-sections"),
    onBackToDates: goToDatesScreen,
    onSubmit: handleSubmit
  });

  registerServiceWorker();
  // Gestion du mot de passe enregistré
  const saved = localStorage.getItem(STORAGE_KEY);
  const loginScreen = document.getElementById("screen-login");

  function showLogin(message) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (loginScreen) loginScreen.classList.add("active");
    document.getElementById("login-message").innerText = message || "";
  }

  function hideLogin() {
    if (loginScreen) loginScreen.classList.remove("active");
    document.getElementById("login-message").innerText = "";
  }

  // Expose for use in other scopes
  window.showLogin = showLogin;
  window.hideLogin = hideLogin;

  if (saved) {
    currentPassword = saved;
    hideLogin();
    loadData();
  } else {
    showLogin();
  }

  // Login actions
  const btnLogin = document.getElementById("btn-login");
  if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
      const input = document.getElementById("login-password");
      const remember = document.getElementById("login-remember");
      const pwd = input ? input.value : "";
      if (!pwd) {
        showLogin("Veuillez entrer le mot de passe.");
        return;
      }

      currentPassword = pwd;
      // Essayer de charger les données avec le mot de passe saisi
      try {
        const result = await fetchData(API_URL, ui.setApiRequest, ui.setApiResponse, currentPassword);
        if (result.status === "success") {
          if (remember && remember.checked) {
            localStorage.setItem(STORAGE_KEY, currentPassword);
          }
          hideLogin();
          setCatalogData(result.data || {});
          ui.renderSections(getState().sections, handleSectionSelection);
          ui.showScreen("screen-sections");
        } else if (result.status === "unauthorized") {
          showLogin("Mot de passe incorrect.");
        } else {
          showLogin(result.message || "Erreur lors de la connexion.");
        }
      } catch (err) {
        showLogin(err.message || String(err));
      }
    });
  }
});

// Modifie handleSubmit pour inclure le mot de passe dans le payload
async function handleSubmit() {
  const payload = buildPayload();
  payload.password = currentPassword;
  ui.showScreen("screen-loading");

  try {
    const result = await submitData(API_URL, payload, ui.setApiRequest, ui.setApiResponse);
    if (result.status === "success") {
      alert(`Présences enregistrées avec succès (${result.count} animés) !`);
      ui.showScreen("screen-sections");
      return;
    }

    if (result.status === "unauthorized") {
      localStorage.removeItem(STORAGE_KEY);
      currentPassword = null;
      window.showLogin("Mot de passe incorrect. Veuillez vous reconnecter.");
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
