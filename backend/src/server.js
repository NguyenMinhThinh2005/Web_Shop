const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");

require("./models");

async function bootstrap() {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

bootstrap();
