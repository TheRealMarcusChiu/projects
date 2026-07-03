// ─────────────────────────────────────────────────────────────────────────
// Project gallery content manifest — SINGLE SOURCE OF TRUTH
//
// Managed by server.js (the admin UI writes through to this file). The site
// reads everything off this file dynamically: the number of projects, all
// copy, dates, tech, links, accent colours, and the hidden flag.
//
// Loaded as a classic script:  <script src="content/manifest.js"></script>
//   → window.PROJECTS and window.PROJECT_FILTERS
// (Also exposes module.exports for CommonJS tooling / this server.)
// ─────────────────────────────────────────────────────────────────────────

var PROJECTS = [
  {
    "id": "my-room",
    "title": "My Room in 3D",
    "description": "An explorable 3D model of my room, built in the browser.",
    "url": "https://git.marcuschiu.com/my-room-in-3d",
    "displayUrl": "git.marcuschiu.com/my-room-in-3d",
    "cover": "./images/my-room.png",
    "coverW": 3024,
    "coverH": 1888,
    "tag": "3D",
    "category": "interactive",
    "tech": [
      "Three.js",
      "WebGL",
      "JavaScript"
    ],
    "dateCreated": "2025-09-17",
    "accent": "#b9883f",
    "hidden": false
  },
  {
    "id": "visualizing-neural-networks",
    "title": "Visualizing Neural Networks",
    "description": "Watching a network learn, layer by layer.",
    "url": "https://git.marcuschiu.com/visualizing-neural-networks/",
    "displayUrl": "git.marcuschiu.com/visualizing-neural-networks",
    "cover": "./images/visualizing-neural-networks.png",
    "coverW": 1122,
    "coverH": 1156,
    "tag": "ML",
    "category": "visualization",
    "tech": [
      "JavaScript",
      "Canvas",
      "Neural Networks"
    ],
    "dateCreated": "2025-09-01",
    "accent": "#4f9e6b",
    "hidden": false
  },
  {
    "id": "shazam",
    "title": "Shazam, in a Browser?",
    "description": "Audio fingerprinting and song matching, client-side.",
    "url": "https://git.marcuschiu.com/shazaam",
    "displayUrl": "git.marcuschiu.com/shazaam",
    "cover": "./images/shazam.png",
    "coverW": 1198,
    "coverH": 882,
    "tag": "Audio",
    "category": "experiments",
    "tech": [
      "Web Audio API",
      "DSP",
      "JavaScript"
    ],
    "dateCreated": "2025-08-18",
    "accent": "#b7a23f",
    "hidden": false
  },
  {
    "id": "first-mention",
    "title": "The Law of First Mention",
    "description": "A text experiment tracing where ideas first appear.",
    "url": "https://git.marcuschiu.com/the-law-of-first-mention/",
    "displayUrl": "git.marcuschiu.com/the-law-of-first-mention",
    "cover": "./images/law-of-first-mention.png",
    "coverW": 1468,
    "coverH": 856,
    "tag": "Text",
    "category": "experiments",
    "tech": [
      "NLP",
      "JavaScript"
    ],
    "dateCreated": "2025-08-15",
    "accent": "#8a6fc4",
    "hidden": false
  },
  {
    "id": "tetris",
    "title": "Tetris in Canvas/Emojis/ASCII",
    "description": "Learning ReactJS by rebuilding a classic.",
    "url": "https://git.marcuschiu.com/tetris-canvas/",
    "displayUrl": "git.marcuschiu.com/tetris-canvas",
    "cover": "./images/tetris-canvas.png",
    "coverW": 650,
    "coverH": 552,
    "tag": "React",
    "category": "interactive",
    "tech": [
      "React",
      "Canvas",
      "JavaScript"
    ],
    "dateCreated": "2025-08-14",
    "accent": "#4f93a8",
    "hidden": false
  },
  {
    "id": "spring-guides",
    "title": "Spring Guides Bonanza",
    "description": "A run through the Spring framework guides.",
    "url": "https://spring-boot-tutorials.github.io/readthedocs/",
    "displayUrl": "spring-boot-tutorials.github.io/readthedocs",
    "cover": "./images/spring-boot-guides.png",
    "coverW": 2200,
    "coverH": 1668,
    "tag": "Java",
    "category": "tools",
    "tech": [
      "Java",
      "Spring Boot"
    ],
    "dateCreated": "2025-07-30",
    "accent": "#bd7a44",
    "hidden": false
  },
  {
    "id": "d3",
    "title": "Data Visualization with D3",
    "description": "Charts and graphics built on D3.",
    "url": "https://d3.marcuschiu.com",
    "displayUrl": "d3.marcuschiu.com",
    "cover": "./images/d3.png",
    "coverW": 999,
    "coverH": 997,
    "tag": "DataViz",
    "category": "visualization",
    "tech": [
      "D3.js",
      "SVG",
      "JavaScript"
    ],
    "dateCreated": "2022-01-30",
    "accent": "#b15c97",
    "hidden": false
  },
  {
    "id": "fisher-information",
    "title": "Visualizing Fisher Information",
    "description": "An interactive look at a statistics concept.",
    "url": "https://git.marcuschiu.com/fisher-information",
    "displayUrl": "git.marcuschiu.com/fisher-information",
    "cover": "./images/fisher-information.png",
    "coverW": 1658,
    "coverH": 1184,
    "tag": "Stats",
    "category": "visualization",
    "tech": [
      "JavaScript",
      "Statistics",
      "Visualization"
    ],
    "dateCreated": "2021-12-23",
    "accent": "#5f7fc0",
    "hidden": false
  }
];

var FILTERS = [
  {
    "key": "all",
    "label": "All"
  },
  {
    "key": "visualization",
    "label": "Visualization"
  },
  {
    "key": "interactive",
    "label": "Interactive"
  },
  {
    "key": "tools",
    "label": "Tools"
  },
  {
    "key": "experiments",
    "label": "Experiments"
  }
];

// Browser global (classic <script>)
if (typeof window !== 'undefined') {
  window.PROJECTS = PROJECTS;
  window.PROJECT_FILTERS = FILTERS;
}
// CommonJS tooling (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PROJECTS, FILTERS };
}
