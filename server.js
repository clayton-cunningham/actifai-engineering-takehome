'use strict';

const express = require('express');
const seeder = require('./seed');

const salesRoutes = require("./routes/sales-routes");
const revenueRoutes = require("./routes/revenue-routes");
const bodyParser = require('body-parser');

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

async function start() {
  // Seed the database
  await seeder.seedDatabase();

  // App
  const app = express();

  // Health check
  app.get('/health', (req, res) => {
    res.send('Hello World');
  });

  app.use(bodyParser.json());

  app.use("/sales", salesRoutes)
  app.use("/revenue", revenueRoutes)

  app.use((req, res, next) => {
      const error = new Error('Route does not exist', 404);
      throw error;
  });

  app.use((error, req, res, next) => {
      if (res.headerSent && error) {
          return next(error);
      }
  
      res.status(error.code || 500);
      res.json({message: error.message || 'An unknown error was thrown.'});
  })

  // Write your endpoints here

  app.listen(PORT, HOST);
  console.log(`Server is running on http://${HOST}:${PORT}`);
}

start();
