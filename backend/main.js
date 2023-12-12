const config = require('./config/config.env');
const app = require('./app/index.js');

const port = process.env.APP_PORT;
app.listen(port, ()=> {
  console.log(`Server is running at http://localhost:${port}`);
});