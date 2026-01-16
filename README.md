
  # Field Data Upload App

  This is a code bundle for Field Data Upload App. The original project is available at fielddatauploadapp.vercel.app

    ## Running the code

    1. Install dependencies:

      ```bash
      npm install
      ```

    2. Start the development server (local):

      ```bash
      npm run dev
      ```

    3. Start dev server with an HTTPS tunnel (ngrok) — this runs the local dev server and an HTTPS ngrok tunnel together. Useful for testing browser features that require secure origins (e.g., Geolocation API).

      ```bash
      npm run dev:tunnel
      ```

      Notes:
      - The script uses `npx` to run `concurrently` and `ngrok` so you don't need to install them globally.
      - When the command runs you'll see an HTTPS forwarding URL from ngrok in the terminal. Open that URL in your browser and grant location permission when prompted.

    4. Manual ngrok (alternative):

      - Run the dev server in one terminal:

       ```bash
       npm run dev
       ```

      - In another terminal, start ngrok pointing at the Vite port (default 5173):

       ```bash
       npx ngrok http 5173
       ```

      - Open the HTTPS ngrok URL and test the app. Grant location permission for that URL when prompted.

    Debugging geolocation issues:

    - Open Developer Tools (F12) → Console and click the Geo screen's "Diagnose (Check Console)" button to see permission and diagnostic output.
    - If the browser reports `Permission denied`, click the location icon in the address bar and allow location for the site.
    - If running on `localhost` and you still see issues, use the ngrok HTTPS URL (step 3) and retry.
