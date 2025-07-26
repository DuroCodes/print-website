# print website

a simple print website to send print jobs to a discord webhook

made for my friends so they can ask me to print stuff for them

made with astro, astro auth, shadcn/ui and tailwindcss

## setup
1. clone the repo
2. run `bun install`
3. populate the `.env` file with the info based on the `.env.example` file
   - you'll need to create a discord application and set the client id and secret
   - and a webhook in a specific channel to get the webhook url
4. run `bun dev` to start the development server or `bun build` to build the project for production
5. open `http://localhost:4321` in your browser
