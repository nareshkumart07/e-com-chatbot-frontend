🌿 Royal Spice - Frontend (Customer Interface)

The client-side application for Royal Spice, featuring a luxurious "Emerald & Gold" design, responsive layout, and an integrated AI Concierge widget.

✨ Key Features

🎨 UI/UX Design

Aesthetic: Deep emerald green backgrounds with antique gold accents and glassmorphism effects.

Animations: Powered by GSAP for smooth entrance and scroll interactions.

Responsiveness: Fully adaptive layout for mobile, tablet, and desktop screens.

🤖 AI Chatbot Widget ("Lily")

Floating Widget: Non-intrusive chat interface located at the bottom-right.

Context Aware: Automatically loads menu data and restaurant timings from the API.

Smart Features:

Quick Chips: One-tap buttons for common queries (Book Table, Cancel Booking, Best Sellers).

Auto-Feedback: Triggers a rating screen upon completing a task (booking/ordering).

Markdown Support: Renders bold text and lists beautifully within chat bubbles.

🍽️ Dynamic Menu

Live Rendering: Fetches menu items directly from the backend API.

Smart Imagery: Automatically assigns high-quality images from Unsplash based on dish names.

🛠️ Tech Stack

Core: HTML5, Vanilla JavaScript (ES6+)

Styling: Tailwind CSS (via CDN)

Animations: GSAP (ScrollTrigger & Core)

Icons: FontAwesome 6

Markdown Parsing: Marked.js

🚀 Setup & Configurationaa

1. Configure API Connection

Open index.html and locate the configuration script block near the top of the <body> tag:

<script>
    // REPLACE THIS WITH YOUR DEPLOYED BACKEND URL
    const API_URL = 'http://localhost:3000/api'; 
    let chatHistory = [];
</script>


Local Development: Keep it as http://localhost:3000/api.

Production: Change this to your Railway/Render backend URL (e.g., https://royal-spice.up.railway.app/api).

2. Running Locally

Since this is a static HTML file, you can simply open it in your browser. However, for the best experience (and to avoid CORS issues if testing strictly), use a simple HTTP server:

# Using Python
python3 -m http.server 8080

# OR using VS Code Live Server extension


Then navigate to http://localhost:8080.

📂 File Structure

index.html: The main entry point containing all structure, styles, and client-side logic.

Powered by Nexa AI Solution
