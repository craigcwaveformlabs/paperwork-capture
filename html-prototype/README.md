# Paperwork Capture - HTML Prototype

A lightweight, easy-to-manipulate HTML prototype for hackdays exploration. Built with vanilla JS, no complex dependencies or component systems.

## Quick Start

1. Open `index.html` in your browser
2. Make changes to `app.js` (state/data) or `styles.css` (design)
3. Refresh the browser to see updates

## Project Structure

```
html-prototype/
├── index.html      # Entry point (minimal, just loads CSS/JS)
├── app.js          # All application logic & components
├── styles.css      # Design tokens & component styles
└── README.md       # This file
```

## How to Modify

### Add/Update Data
Edit the `state.data` object in `app.js`:
```javascript
state.data = {
  companies: [...],
  transactions: [...],
  // Add more as needed
}
```

### Add New Views
1. Create a new component function (e.g., `function MyNewView() { ... }`)
2. Add a case to the Layout switch statement
3. Add navigation to trigger it

### Customize Styling
Edit `styles.css`. Key sections:
- **Design Tokens**: CSS variables at the top (colors, spacing, fonts)
- **Components**: Reusable classes (`.card`, `.btn-primary`, etc.)
- **Utilities**: Helper classes (`.flex`, `.gap-md`, etc.)

All components use CSS variables, so changing `--color-primary` updates the entire design.

### Add Interactivity
1. Add `data-action="my-action"` to HTML elements
2. Add handler to `actions` object in `handleAction()` function
3. Call `rerender()` to update the UI

Example:
```javascript
<button data-action="my-action" data-id="123">Click me</button>

// In handleAction:
const actions = {
  'my-action': (data) => {
    console.log('Clicked:', data.id);
    state.currentView = 'new-view';
    rerender();
  },
}
```

## Key Concepts

### State
All app state lives in the `state` object. Modifying state and calling `rerender()` updates the UI.

### Components
Each function returns an HTML string. Components receive no props—they read from global `state`.

Example:
```javascript
function MyComponent() {
  return `<div>${state.currentUser.name}</div>`;
}
```

### Events
Simple event delegation using `data-action` attributes. Attach listeners in `attachEventListeners()`.

## Tips for Hackdays

- **Fast iteration**: Edit files directly, refresh browser
- **No build step**: Vanilla JS + CSS only
- **Easy to share**: Grab the whole `html-prototype` folder, open `index.html`
- **Extend mockups**: Add more transaction types, companies, or views without friction
- **Visual feedback**: CSS variables at the top make rapid design tweaks easy

## Common Tasks

### Change primary color
Edit in `styles.css`:
```css
--color-primary: #new-color;
```

### Add a new tab
Add to `state.selectedTab` options and handle in component:
```javascript
<div class="tab ${state.selectedTab === 'my-tab' ? 'active' : ''}" data-tab="my-tab">
  My Tab
</div>
```

### Show/hide elements
Use template literals in component:
```javascript
${state.showSidebar ? '<div>Sidebar</div>' : ''}
```

## Debugging

Open browser DevTools (F12):
- **Console**: Log state, test functions
- **Elements**: Inspect rendered HTML
- **Sources**: Set breakpoints in `app.js`

Check current state in console:
```javascript
console.log(state);
```
