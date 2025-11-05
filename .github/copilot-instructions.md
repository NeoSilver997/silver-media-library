From now on in this workspace:
- Always run `npm run dev` in **synchronous foreground** mode (isBackground: false)
- Never kill the process
- Use this exact command: `npm run dev -- --host 0.0.0.0 --port 3000`
- After starting, automatically open http://localhost:3000 in Simple Browser
- If port 3000 is busy, run: `npx kill-port 3000` first