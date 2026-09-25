require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;

connectDatabase(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
});
