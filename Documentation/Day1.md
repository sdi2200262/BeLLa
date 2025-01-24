# Day 1 - Vite + React + Typescript

## I started by creating a new directory for the project and initializing a new git repository.

## I know nothing about React, nothing about Typescript. I will be learning as I go.

### I will be using the following tools:
** Vite         (Tried create-react-app, but didnt like the setup plus I dont think it even worked...)
** React        (For the first time in my life)
** Typescript   (For the first time in my life)
** ESLint       (VSCode Extension for linting - didnt know existed)
** Prettier     (VSCode Extension for formatting - didnt know existed)
** Cursor       (AI Code Assistant - I dont know how I lived without it - the "i dont know how i lived without it" part was written by Cursor)

** (sometimes) Github Copilot (Cursor is better)


### I will be using the following resources:
** https://www.youtube.com/watch?v=SqcY0GlETPk (React Tutorial for Beginners)
** Reddit (For help with specific problems and ideas)
** Maybe some of the info provided by my College but i think there is better stuff out there :/


### Summary of Progress

1. **Project Setup**
   - Initialized project with Vite + React + TypeScript
   - Set up ESLint and Prettier for code quality
   - Configured TypeScript with separate configs for app and components library

2. **Components Library Structure**
   - Created a dedicated components library structure at `src/components-library/`
   - Implemented base Button component (see lines 1-17 in `src/components-library/Buttons/Button.tsx`)
   - Set up component styling with CSS modules

3. **Basic Application Structure**
   - Created Layout component with navigation (see lines 1-22 in `src/components-library/Layout/Layout.tsx`)
   - Implemented basic routing between Home and Components pages
   - Set up LandingPage (see lines 1-15 in `src/components-library/pages/LandingPage.tsx`)
   - Created ComponentsShowcase page (see lines 1-23 in `src/components-library/pages/ComponentsShowcase.tsx`)

4. **Configuration and Build Setup**
   - Set up separate TypeScript configurations for app and library
   - Configured Vite for development and build
   - Added npm scripts for development, building, and components library

5. **Documentation**
   - Created initial README with project description
   - Started documentation with Day 1 progress
   - Added MIT License


--------------------------------

### Next Steps:
- Fix the design of the components so that the AI can create the rest in the future
- Add proper React Router for better navigation
- Enhance the landing page design

--------------------------------

### AI:

I am currently following a specific promt engineering technique. For whatever request i first use reasoning models like ChatGPT o1 to generate a detailed plan for the implementation. The promts in these reasoning models must be the opposite of the ones in LLM models like ChatGPT 4o, instead of detailed and specific, they must be vague and general so the AI can do the thinking on its own. This way i can get a detailed plan for the implementation and the LLM can generate the code.

Reasoning Models use thinking tokens to measure the amount of thinking the AI does. The more thinking tokens the more thinking the AI does. Actually what is happening is that the AI is fullfilling a task step-by-step. The answer of every step is fed back into the prompt and the AI generates the next step. 

Taking this into account some intresting promt phrases that in my experience work well are:
- **"Please think step by step"**
- **"Take your time thinking about this problem"**
- **"Think about this problem in detail"**
- **"Think about this problem in depth"**
- **"Think about this problem in a detailed way"**
etc

--------------------------------

In this project i will be trying out various promt engineering techniques and will document my progress here. I will also be trying out various models... right now im using Cursor as my AI coding assistant which supports OpenAI models and Claude 3.5 Sonnet. However i think that Github Copilot has a feature where you can use your own models. So i will be importing various models from HuggingFace and trying them out.

Peace out!
