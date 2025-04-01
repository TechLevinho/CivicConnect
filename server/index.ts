import express from "express";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

dotenv.config(); // Load .env file

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log("Starting server with environment:", process.env.NODE_ENV);

const app = express();

// Configure CORS - Allow requests from client app
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", 
           "http://localhost:5176", "http://localhost:5177", "http://localhost:5178"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add cookie-parser middleware
app.use(cookieParser());

// JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add logging middleware for debugging API calls
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    cookies: req.cookies,
    headers: {
      contentType: req.headers['content-type'],
      authorization: req.headers.authorization ? 'Present' : 'None'
    }
  });
  next();
});

// Session settings
app.set("trust proxy", 1);

// Setup authentication
setupAuth(app);

// Register routes
registerRoutes(app);

// Function to find an available port
const findAvailablePort = (startPort: number): Promise<number> => {
  return new Promise((resolve) => {
    const server = http.createServer();
    
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try the next port
        server.close();
        resolve(findAvailablePort(startPort + 1));
      }
    });
    
    server.listen(startPort, () => {
      server.close();
      resolve(startPort);
    });
  });
};

// Start server on an available port (try 3002 first)
const startServer = async () => {
  try {
    const PORT = await findAvailablePort(3002);
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server URL: http://localhost:${PORT}`);
      console.log(`API endpoint: http://localhost:${PORT}/api`);
      
      // Also log the client's Vite configuration needed
      console.log('\nIMPORTANT: Update your client\'s vite.config.ts proxy settings:');
      console.log(`target: 'http://localhost:${PORT}'`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
