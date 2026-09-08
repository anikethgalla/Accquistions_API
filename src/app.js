import express from 'express';
import logger from '#config/logger.js';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/authRoutes.js';
const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));


app.use('/api/auth',authRoutes);
app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions API');
  res.status(200).send('Hello from acquisitions API');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;
