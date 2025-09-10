import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import router from './routes/health.js';


const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());
connectDB();


app.use('/api/health', router);

app.listen(PORT, () => {
    console.log(`Listening on PORT: ${PORT}`);
});
