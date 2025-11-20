# 🤖 Turing Test App

**Interactive Turing Test Game - Can you tell which response is from a human and which is from AI?**

A gamified mental health awareness tool that challenges users to distinguish between human and AI-generated responses to mental health prompts.

This app is a playful, thought-provoking mental health awareness tool that gamifies Alan Turing's famous question — *"Can machines think?"* — in the context of lived mental health experiences. Users swipe through narratives in response to mental health prompts and try to guess whether they were written by a person with lived experience or a large language model (LLM).

> This app supports Columbia’s University Mental Health Initiative by raising awareness, provoking reflection, and amplifying marginalized voices through accessible AI.

---

## 🔥 Live Demo

👉 **https://turing-app.vercel.app**

Deployed on Vercel with automatic deployments from the main branch.

---

## 📦 Project Structure

```
Turing_APP/
├── pages/                  # Next.js route pages
│   ├── index.js            # Landing page with intro & start button
│   ├── game.js             # Main swipe-based Turing Test experience
|   ├── _app.js             # App-level wrapper with context provider
│   └── about.js            # App overview, mission, and credits
├── components/             # Reusable UI components
│   ├── Comments.js         # User comment form and thread view
│   └── GameSettings.js     # Toggle dark mode, font size, timer
├── contexts/
│   └── GameContext.js      # Global state: settings, user inputs, comments
├── data/
│   └── turing_data.js      # Prompt + human/AI answers with tags
├── styles/
│   └── globals.css         # Global styles and dark mode
├── package.json            # App dependencies and scripts
└── package-lock.json       # Lock file for consistent builds
```

---

## 🏷️ Topics & Technologies

- **turing-machine** - Interactive implementation of the Turing Test
- **vercel** - Deployed and hosted on Vercel platform
- **Next.js** - React framework for web applications
- **Mental Health** - Awareness and education tool
- **AI/ML** - Human vs AI detection game
- **Interactive Game** - Swipe and click-based gameplay

---

## App Features

### Gameplay
- **Two Game Modes:**
  - **Swipe Mode**: Swipe right for Human, left for AI (with visual indicators 🤖👤)
  - **Click Mode**: Choose between two responses (randomized order)
- 15 randomized prompts per session
- Detailed results table showing question-by-question performance
- Dark mode toggle, font size slider, timer (30–90s/question)
- Human response identification tracking

### Prompt Filters
- Users can filter prompts by mental health condition:
  - Anxiety, Bipolar, Depression, OCD, PTSD, ADHD, Schizophrenia, etc.

### Comments & Feedback
- Users can leave comments per prompt, sharing thoughts and reactions
- Promotes reflection and dialogue around AI vs. human narrative tone

---

## Dataset

The `turing_data.js` file contains ~200+ paired responses sourced from:
- 🧍 Real people with lived mental health experience at Columbia (anonymous)
- 🤖 Popular LLMs like ChatGPT, Claude, Gemini, etc.

Each record includes:
- `prompt`
- `human` response
- `ai` response
- `condition` tag (e.g., Anxiety)
- `type` tag (e.g., Surprising, Helpful, Humanizing)

---

## Research & Context

This project supports Columbia's **Mental Health Initiative (MHI)** and was inspired by:
- Ethical challenges in AI-generated MH content
- The Turing Test reimagined for public education and stigma reduction
- Elevating *people with lived mental health experience* (PWLEMH)

Full Proposal: *“Human or AI? Using the Turing Test to Share and Deepen Perspectives on Mental Health”*

---

## Mobile & Accessibility

- Fully responsive design
- Works on mobile, tablet, and desktop
- Dark mode and font size adjustments
- Keyboard support (← for AI, → for Human)

---

## Credits

- Built by [Zichen Zhao (Jackson)](https://linkedin.com/in/zichenzhao6/)
- Columbia School of Social Work · Data Science Research Assistant

---

## Auth0 Setup (Columbia-only Access)

This project now expects Auth0 credentials to be present at build/runtime. Configure the following environment variables (on Vercel and locally via `.env.local`):

- `AUTH0_SECRET` – random 32+ character string
- `AUTH0_ISSUER_BASE_URL` – e.g. `https://YOUR_TENANT.us.auth0.com`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_BASE_URL` – e.g. `https://your-vercel-domain`
- `ALLOWED_EMAIL_DOMAIN` – `columbia.edu`

Routes such as `/game` and `/api/results/*` are gated by Auth0 via middleware. Users signing in with non-`@columbia.edu` accounts are redirected back to `/` with guidance.

**📖 For detailed setup instructions, see [SETUP.md](./SETUP.md)**

---

## Troubleshooting

### Common Issues

- **Missing dependencies**: Run `npm install` to ensure all packages (including `joi`) are installed
- **Environment variables**: Copy `.env.local.example` to `.env.local` and fill in your credentials
- **Google Sheets errors**: Verify service account has access to your spreadsheet
- **Auth0 login issues**: Check callback URLs match your domain

For detailed troubleshooting, see [SETUP.md](./SETUP.md#troubleshooting)

---

## License & Usage

© 2025 Zichen Zhao. All rights reserved.  
Use of this app is permitted for education, awareness, and research.  
Redistribution or reuse of source code is prohibited without written permission.