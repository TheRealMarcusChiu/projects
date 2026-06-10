// Page content for the project gallery.
// Loaded as a plain script before the DCLogic root boots; the inline
// `class Component` (compiled in global scope by the runtime) reads these
// off `window`. Edit project entries and filter categories here.

window.FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'visualization', label: 'Visualization' },
  { key: 'interactive', label: 'Interactive' },
  { key: 'tools', label: 'Tools' },
  { key: 'experiments', label: 'Experiments' },
];

window.PROJECTS = [
    {
        title: 'My Room in 3D',
        caption: 'An explorable 3D model of my room, built in the browser.',
        domain: 'my-room.marcuschiu.com',
        url: 'https://my-room.marcuschiu.com',
        shot: 'my-room',
        img: './images/my-room.png',
        tag: '3D',
        cat: 'interactive'
    },
    {
        title: 'Visualizing Neural Networks',
        caption: 'Watching a network learn, layer by layer.',
        domain: 'visualizing-neural-networks.marcuschiu.com',
        url: 'https://visualizing-neural-networks.marcuschiu.com',
        shot: 'neural-networks',
        img: './images/visualizing-neural-networks.png',
        tag: 'ML',
        cat: 'visualization'
    },
    {
        title: 'Shazam, in a Browser?',
        caption: 'Audio fingerprinting and song matching, client-side.',
        domain: 'shazam.marcuschiu.com',
        url: 'https://shazam.marcuschiu.com',
        shot: 'shazam',
        img: './images/shazam.png',
        tag: 'Audio',
        cat: 'experiments'
    },
    {
        title: 'The Law of First Mention',
        caption: 'A text experiment tracing where ideas first appear.',
        domain: 'first-mention.marcuschiu.com',
        url: 'https://first-mention.marcuschiu.com',
        shot: 'first-mention',
        img: './images/law-of-first-mention.png',
        tag: 'Text',
        cat: 'experiments'
    },
    {
        title: 'Tetris in Canvas/Emojis/ASCII',
        caption: 'Learning ReactJS by rebuilding a classic.',
        domain: 'tetris.marcuschiu.com',
        url: 'https://tetris.marcuschiu.com',
        shot: 'tetris',
        img: './images/tetris-canvas.png',
        tag: 'React',
        cat: 'interactive'
    },
    {
        title: 'Spring Guides Bonanza',
        caption: 'A run through the Spring framework guides.',
        domain: 'spring-guides.marcuschiu.com',
        url: 'https://spring-guides.marcuschiu.com',
        shot: 'spring-guides',
        img: './images/spring-boot-guides.png',
        tag: 'Java',
        cat: 'tools'
    },
    {
        title: 'Data Visualization with D3',
        caption: 'Charts and graphics built on D3.',
        domain: 'd3.marcuschiu.com',
        url: 'https://d3.marcuschiu.com',
        shot: 'd3',
        img: './images/d3.png',
        tag: 'DataViz',
        cat: 'visualization'
    },
    {
        title: 'Visualizing Fisher Information',
        caption: 'An interactive look at a statistics concept.',
        domain: 'fisher-information.marcuschiu.com',
        url: 'https://fisher-information.marcuschiu.com',
        shot: 'fisher-information',
        img: './images/fisher-information.png',
        tag: 'Stats',
        cat: 'visualization'
    },
];

