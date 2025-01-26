# Day 3 - More Components - Progress Page

### New Page created - Progress.tsx


--------------------------------
### Summary of Progress

1. **CSS Variables Added**
- I added css variables to the components to make them more customizable. 


2. **Components Added**
- ReadmeViewer.tsx (Readme Viewer)
- FileContainer.tsx (File Container)

3. **Progress.tsx (Progress Page)**
- Added the Progress page with the FileContainer and ReadmeViewer components. The documentation readmes will be displayed here. For now it is empty and     probably needs more work to correctly display the components. The files that will be imported in the FileContainer are going to be from backend API calls so i will have to start implementing the backend functionality.

4. **Edited Components Showcase Page**
- I edited the components showcase page so that the components would be properly displayed in a flex grid horizontally. Also i categorized the components into different sections to prevent clutter and uneccessary user scrolling.

--------------------------------

### Next Steps
- Start implementing the backend functionality
- Add more components
- Complete the Progress page - i want to add a progress bar component too

--------------------------------

### Thoughts
Today was a very frustrating day. I kept having trouble with the containers that display the components, sometimes they would overlap one another or sometimes they would not display at all. I had to spend a lot of time trying to fix this. This is happening because i know nothing about css and i cant tell if the LLM is having hallucinations or not. Im starting to get the hang of it tho - this was a problem i anticipated.


--------------------------------
### AI:
A very often problem i came across is that when there is an error in the code and i send it to the Chatbot to fix it, if the first try isnt successful then the possibility of the Chatbot hallucinating is very high. Many times it would try to change something in the configuration files and then the whole project would break. Sometimes the fix was so simple that i just had to read the file once to locate it.

A promt trick that helped was to specify to the Chatbot to only touch the code that is relevant to the error. For example i would say:

- "(blah blah blah) change nothing else - focus only on the [task i want to be done]"
- "... Dont touch anything else!" (sometimes i find myself screaming at the Chat by using CAPS hahaha)

Or another thing that helped was to be extremely specific and descriptive about the changes i want to be made.

***Patience is key.***

I noticed that when i've spent a lot of time on the same issue my promt quality gets significantly worse. Then the chat tends to hallucinate more and that creates even more problems. **In todays coding sessions i used \`git reset --hard\` three fcking times...** 

One time i even ~~deleted~~ the whole local directory and \`git cloned\`  the repo again because the AI made so many changes in the config files that nothing would work and i couldnt trace back the changes to revert them all!!!

Anyway i must find a way to keep my promts consistent because todays progress was very slow.


