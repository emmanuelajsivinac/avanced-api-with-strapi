const { Client } = require("pg");

let client;

function getClient() {
  if (!client) {
    client = new Client({
      host: process.env.POSTGIS_HOST,
      port: process.env.POSTGIS_PORT || 5432,
      user: process.env.POSTGIS_USER,
      password: process.env.POSTGIS_PASSWORD,
      database: process.env.POSTGIS_DB,
    });
    client
      .connect()
      .then(() => console.log("Conectado a PostGIS"))
      .catch((err) => console.error("Error conectando a PostGIS", err));
  }
  return client;
}

module.exports = { getClient };
