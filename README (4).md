# Recipe Finder

A recipe search app built with vanilla HTML, CSS and JavaScript, using the free [TheMealDB](https://www.themealdb.com/api.php) API.

**Live demo:** _add your GitHub Pages / Netlify link here_

## Features

- Search recipes by name
- Browse by category
- "Surprise me" random recipe
- Recipe details with ingredients, instructions and a YouTube link
- Save favourites, stored in the browser with `localStorage`
- Loading, empty-result and error states
- Responsive layout that works on phones and desktops

## What I practised

- `fetch` with `async`/`await` and `try`/`catch`
- Checking `response.ok` and handling failed requests
- Ignoring out-of-date responses when searches overlap
- Building the UI from API data with the DOM
- The native `<dialog>` element for the recipe modal

## Run locally

Open `index.html` in a browser. An internet connection is needed for the API.

## Ideas for next versions

- Search by ingredient
- Debounced search-as-you-type
- Shopping list from a recipe's ingredients
