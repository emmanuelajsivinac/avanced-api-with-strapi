const { createCoreController } = require("@strapi/strapi").factories;
const { getClient } = require("../../../services/postgis");

module.exports = createCoreController(
  "api::provider.provider",
  ({ strapi }) => ({
    async create(ctx) {
      try {
        const { name, email, phone, address, city, state, country, location } =
          ctx.request.body;

        if (!name || !location || !location.lat || !location.lng) {
          return ctx.badRequest(
            "Faltan datos obligatorios: name, location.lat, location.lng"
          );
        }

        const client = getClient();
        const sql = `
        INSERT INTO providers (name, email, phone, address, city, state, country, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326))
        RETURNING *, ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat;
      `;

        const result = await client.query(sql, [
          name,
          email,
          phone,
          address,
          city,
          state,
          country,
          location.lng, // OJO: primero longitud
          location.lat, // luego latitud
        ]);

        return result.rows[0];
      } catch (err) {
        console.error("Error creando proveedor", err);
        return ctx.internalServerError("Error creando proveedor");
      }
    },
    async findAll(ctx) {
      try {
        const client = getClient();
        const sql = `
        SELECT id, name, email, phone, address, city, state, country,
               ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat,
               created_at, updated_at
        FROM providers;
      `;
        const result = await client.query(sql);

        // devolver location como JSON
        return result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          city: row.city,
          state: row.state,
          country: row.country,
          location: { lat: row.lat, lng: row.lng },
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));
      } catch (err) {
        console.error("Error obteniendo proveedores", err);
        return ctx.internalServerError("Error obteniendo proveedores");
      }
    },
    async findNearby(ctx) {
      try {
        const { lat, lng, limit } = ctx.query;

        if (!lat || !lng) {
          return ctx.badRequest("Faltan coordenadas lat y lng");
        }

        const client = getClient();

        const sql = `
      SELECT id, name, email, phone, address, city, state, country,
             ST_X(location::geometry) AS lng,
             ST_Y(location::geometry) AS lat,
             ST_Distance(
               location,
               ST_SetSRID(ST_MakePoint($1, $2), 4326)
             ) AS distance
      FROM providers
      ORDER BY distance ASC
      LIMIT $3;
    `;

        const result = await client.query(sql, [lng, lat, limit || 10]);

        return result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          city: row.city,
          state: row.state,
          country: row.country,
          location: { lat: row.lat, lng: row.lng },
          distance_meters: row.distance,
        }));
      } catch (err) {
        console.error("Error buscando proveedores cercanos", err);
        return ctx.internalServerError("Error buscando proveedores cercanos");
      }
    },
    async update(ctx) {
      try {
        const { id } = ctx.params;
        const { name, email, phone, address, city, state, country, lat, lng } =
          ctx.request.body;
        const client = getClient();

        const sql = `
        UPDATE providers
        SET
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          address = COALESCE($4, address),
          city = COALESCE($5, city),
          state = COALESCE($6, state),
          country = COALESCE($7, country),
          location = COALESCE(ST_SetSRID(ST_MakePoint($9, $8), 4326), location),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *, ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat;
      `;

        const result = await client.query(sql, [
          name,
          email,
          phone,
          address,
          city,
          state,
          country,
          lat,
          lng,
          id,
        ]);
        if (result.rows.length === 0)
          return ctx.notFound("Proveedor no encontrado");
        return result.rows[0];
      } catch (err) {
        console.error("Error actualizando proveedor", err);
        return ctx.internalServerError("Error actualizando proveedor");
      }
    },

    async delete(ctx) {
      try {
        const { id } = ctx.params;
        const client = getClient();
        const sql = `DELETE FROM providers WHERE id = $1 RETURNING *;`;
        const result = await client.query(sql, [id]);
        if (result.rows.length === 0)
          return ctx.notFound("Proveedor no encontrado");
        return {
          message: "Proveedor eliminado correctamente",
          proveedor: result.rows[0],
        };
      } catch (err) {
        console.error("Error eliminando proveedor", err);
        return ctx.internalServerError("Error eliminando proveedor");
      }
    },
  })
);
