# BeLLa NERT
An open-source full-stack web-app template.


This template offers:
- Organized file structure
- Shadcn UI components
- Frontend-Backend separation

...all with a one command setup with Vite.

## Stack
- **Backend**: Node.js, Express.js, and MongoDB (default – change to Supabase if desired)
- **Frontend**: React (with TypeScript), Shadcn UI, and Tailwind CSS (v3 for Shadcn UI support)

## File Structure
A clean and organized file structure as a base for your next web application.
```
 BeLLa-NERT/
 ├── backend/
 │   ├── config/
 │   │   ├── config.js
 │   │   └── database.js
 │   ├── src/
 │   │   ├── app.js
 │   │   └── index.js
 │   └── package.json
 ├── frontend/
 │   ├── config/
 │   │   ├── vite.config.ts
 │   │   ├── tailwind.config.cjs
 │   │   ├── postcss.config.js
 │   │   └── shadcn.config.js
 │   ├── public/
 │   │   ├── icons/
 │   │   ├── images/
 │   │   └── favicon.ico
 │   ├── src/
 │   │   ├── components/
 │   │   │   └── ui/
 │   │   ├── lib/
 │   │   ├── App.tsx
 │   │   ├── index.css
 │   │   └── main.tsx
 │   ├── index.html
 │   ├── package.json
 │   ├── vite.config.ts
 │   └── tsconfig.json
 │
 ├── package.json
 ├── .gitignore
 └── README.md

```

## Getting Started

0. **Use this Template**
   - Click the green "Use this template" button above
   - Choose "Create a new repository"
   - Fill in your repository details
   - Click "Create repository from template"

1. **Clone the repository:**
   Clone the repository and navigate to the project directory.
   _Use WSL if working on Windows._
   ```
   git clone https://github.com/sdi2200262/your-repo-name.git
   cd your-repo-name
   ```

2. **Install dependencies:**
   Install the dependencies for the frontend and backend.
   ```
   npm install
   ```

3. **Ready to go!**
   Start the development environment with a single command.
   ```
   npm run dev
   ```
   This command concurrently starts:
   - The frontend (on port 3000)
   - The backend (on port 5001)


## Configuration Files
Most configuration files are "hidden" in their respective `config` directories of the frontend and backend. This way we avoid clutter and keep the main directories clean.

- **Frontend Configuration:**  
  - `vite.config.ts` is located at `frontend/config/vite.config.ts`
  - `tailwind.config.cjs` is located at `frontend/config/tailwind.config.cjs`
  - `shadcn.config.js` is located at `frontend/config/shadcn.config.js`
  - `postcss.config.js` is located at `frontend/config/postcss.config.js`

- **Backend Configuration:**  
  - General configuration is in `backend/config/config.js`
  - Database connection settings are in `backend/config/database.js`

_Note: Some configuration files (eg. in frontend/ `vite.config.ts`, `tsconfig.json`) remain in the project root of their respective directories as required by tooling._

_To switch to Supabase, update the connection logic in `backend/config/database.js`._


## Next Steps

- Delete the current frontend and backend implementations in `App.tsx`, `index.css`, `app.js`, `index.js` etc.
- Customize your own routes, React components (eg. use Shadcn UI components), Database Schemas etc.
- If you have any questions, view the documentation or ask ChatGPT!

Enjoy building your full-stack web app! 


## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.
