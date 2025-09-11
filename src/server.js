import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import router from './routes/health.js';
import authRouter from './routes/auth.js';
import restaurantRouter from './routes/restaurants.js';
import orderRouter from './routes/orders.js';




const PORT = process.env.PORT || 8080;
const app = express();
app.use(cors());
app.use(express.json());
connectDB();

app.use('/api/auth', authRouter);
app.use('/api/health', router);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/orders', orderRouter);

app.listen(PORT, () => {
    console.log(`Listening on PORT: ${PORT}`);
});
