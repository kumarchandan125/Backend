import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

// Connect to DB for Serverless environment
connectDB();

export default app;
