# Visitor Counter

A simple and elegant visitor counter implementation using Cloudflare Workers and KV storage. This project provides a free solution to track and display visitor statistics with a modern UI.

## Features

- Real-time visitor counting
- Country-wise visitor distribution
- Visitor's region detection
- Timezone information
- Browser/Device detection
- Request type tracking
- Clean, modern UI with responsive design
- Auto-updates every 10 minutes

## Setup

1. Create a Cloudflare Workers account (free tier)
2. Set up a KV namespace called `VISITOR_COUNTER`
3. Deploy the worker code (`counter-worker.js`) to Cloudflare Workers
4. Host the frontend (`index.html`) on your preferred hosting service
5. Update the `COUNTER_API` variable in `index.html` with your Worker URL

## Technologies Used

- Cloudflare Workers
- Cloudflare KV Storage
- HTML/CSS/JavaScript
- Google Fonts (Inter)

## License

MIT License 