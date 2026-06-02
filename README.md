# ChatBot

A full-stack application that enables users to query a custom knowledge base populated via document uploads.

## Critical Problem Solved

Eliminates the need to manually search through large documents by providing an AI-driven interface that instantly streams accurate answers based on an organization's specific uploaded files.

## Tech Stack

**Frontend**
- React (Vite)
- TypeScript
- Tailwind CSS
- Framer Motion
- React Router

**Backend**
- Node.js
- Express.js
- TypeScript
- MongoDB (Mongoose)
- Google Generative AI (Gemini)
- Cloudinary

## Architecture

- **Client:** React single-page application handling user interactions and real-time response streaming.
- **Server:** Express.js REST API managing authentication, document processing, and AI service orchestration.
- **Data Layer:** MongoDB for structured application data and Q&A history, paired with Cloudinary for secure document storage.
- **AI Engine:** Google Generative AI integration for semantic understanding and answer generation based on parsed document text.

## Data Flow

```text
File Upload
  |
  v
Divide into Chunks
  |
  v
Store Chunks in MongoDB / Store File in Cloudinary
  |
  v
Provide Context
  |
  v
Gemini
```

## Folder Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── frontEnd/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── pages/
│   └── package.json
└── README.md
```