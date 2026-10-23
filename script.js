// Recipe data comes from TheMealDB (free, no API key needed)
const API = "https://www.themealdb.com/api/json/v1/1";
const FAV_KEY = "recipe-finder:favourites";

let currentMeals = [];                 // meals shown in the Results tab
let favourites = loadFavourites();     // [{ idMeal, strMeal, strMealThumb }]
let tab = "results";                   // "results" or "favs"
let requestId = 0;                     // used to ignore out-of-date responses

const $ = (id) => document.getElementById(id);

// ---------- Favourites storage ----------
function loadFavourites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch {
    return [];
  }
}

function isFavourite(id) {
  return favourites.some((m) => m.idMeal === id);
}

function toggleFavourite(meal) {
  if (isFavourite(meal.idMeal)) {
    favourites = favourites.filter((m) => m.idMeal !== meal.idMeal);
  } else {
    favourites.push({ idMeal: meal.idMeal, strMeal: meal.strMeal, strMealThumb: meal.strMealThumb });
  }
  localStorage.setItem(FAV_KEY, JSON.stringify(favourites));
  render();
}

// ---------- Network ----------
// One helper for every API call: fetch, check the response, parse JSON.
async function getJSON(path) {
  const response = await fetch(API + path);
  if (!response.ok) throw new Error("Request failed with status " + response.status);
  return response.json();
}

// Runs a search, then shows the meals. Handles loading, empty and error states.
async function runSearch(path, emptyMessage) {
  const myRequest = ++requestId;
  setStatus("Loading...");
  try {
    const data = await getJSON(path);
    if (myRequest !== requestId) return; // a newer search started, ignore this one
    currentMeals = data.meals || [];     // the API returns null when nothing matches
    setTab("results");
    if (!currentMeals.length) setStatus(emptyMessage);
  } catch {
    if (myRequest !== requestId) return;
    setStatus("Could not load recipes. Check your internet connection and try again.");
  }
}

// ---------- Rendering ----------
function setStatus(message) {
  $("status").textContent = message;
}

function setTab(name) {
  tab = name;
  $("tab-results").setAttribute("aria-pressed", String(name === "results"));
  $("tab-favs").setAttribute("aria-pressed", String(name === "favs"));
  setStatus("");
  render();
}

function makeButton(label, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

function saveLabel(id) {
  return isFavourite(id) ? "♥ Saved" : "♡ Save";
}

function makeCard(meal) {
  const card = document.createElement("article");
  card.className = "card";

  const img = document.createElement("img");
  img.src = meal.strMealThumb;
  img.alt = meal.strMeal;
  img.loading = "lazy";
  img.addEventListener("click", () => openRecipe(meal.idMeal));

  const title = document.createElement("h3");
  title.textContent = meal.strMeal;

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(
    makeButton("View recipe", () => openRecipe(meal.idMeal)),
    makeButton(saveLabel(meal.idMeal), () => toggleFavourite(meal))
  );

  card.append(img, title, actions);
  return card;
}

function render() {
  const meals = tab === "results" ? currentMeals : favourites;
  $("fav-count").textContent = favourites.length;
  $("grid").replaceChildren(...meals.map(makeCard));
  if (tab === "favs" && !favourites.length) {
    setStatus("No favourites yet. Press Save on a recipe you like.");
  }
}

// ---------- Recipe details (modal) ----------
function buildRecipe(m) {
  const box = document.createElement("div");

  const img = document.createElement("img");
  img.src = m.strMealThumb;
  img.alt = m.strMeal;

  const title = document.createElement("h2");
  title.textContent = m.strMeal;

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = `${m.strCategory}, ${m.strArea} cuisine`;

  // The API stores ingredients as strIngredient1..20 and strMeasure1..20
  const ingredients = document.createElement("ul");
  for (let i = 1; i <= 20; i++) {
    const name = (m["strIngredient" + i] || "").trim();
    if (!name) continue;
    const li = document.createElement("li");
    li.textContent = `${(m["strMeasure" + i] || "").trim()} ${name}`.trim();
    ingredients.append(li);
  }

  const steps = document.createElement("div");
  (m.strInstructions || "")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .forEach((line) => {
      const p = document.createElement("p");
      p.textContent = line;
      steps.append(p);
    });

  const ingredientsHeading = document.createElement("h3");
  ingredientsHeading.textContent = "Ingredients";
  const stepsHeading = document.createElement("h3");
  stepsHeading.textContent = "Instructions";

  const actions = document.createElement("div");
  actions.className = "actions";
  const saveBtn = makeButton(saveLabel(m.idMeal), () => {
    toggleFavourite(m);
    saveBtn.textContent = saveLabel(m.idMeal);
  });
  actions.append(saveBtn, makeButton("Close", () => $("modal").close()));

  box.append(img, title, meta, ingredientsHeading, ingredients, stepsHeading, steps);

  if (m.strYoutube && m.strYoutube.startsWith("http")) {
    const link = document.createElement("a");
    link.href = m.strYoutube;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Watch on YouTube";
    box.append(link);
  }

  box.append(actions);
  return box;
}

async function openRecipe(id) {
  const modal = $("modal");
  modal.replaceChildren(document.createTextNode("Loading..."));
  modal.showModal();
  try {
    const data = await getJSON("/lookup.php?i=" + id);
    modal.replaceChildren(buildRecipe(data.meals[0]));
  } catch {
    modal.replaceChildren(
      document.createTextNode("Could not load this recipe."),
      makeButton("Close", () => modal.close())
    );
  }
}

// Clicking the dark area outside the dialog closes it
$("modal").addEventListener("click", (e) => {
  if (e.target === $("modal")) $("modal").close();
});

// ---------- Events ----------
$("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const query = $("query").value.trim();
  if (!query) {
    setStatus("Type a recipe name first.");
    return;
  }
  $("category").value = "";
  runSearch("/search.php?s=" + encodeURIComponent(query), `No recipes found for "${query}".`);
});

$("category").addEventListener("change", () => {
  const category = $("category").value;
  if (!category) return;
  $("query").value = "";
  runSearch("/filter.php?c=" + encodeURIComponent(category), "No recipes in this category.");
});

$("random").addEventListener("click", () => runSearch("/random.php", "Could not find a recipe."));
$("tab-results").addEventListener("click", () => setTab("results"));
$("tab-favs").addEventListener("click", () => setTab("favs"));

// ---------- Start ----------
async function loadCategories() {
  try {
    const data = await getJSON("/list.php?c=list");
    data.meals.forEach((c) => $("category").append(new Option(c.strCategory, c.strCategory)));
  } catch {
    // The dropdown just stays empty if this fails; search still works
  }
}

loadCategories();
runSearch("/search.php?s=chicken", "No recipes found.");
render();
