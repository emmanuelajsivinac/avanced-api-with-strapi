module.exports = {
  routes: [
    {
      method: "GET",
      path: "/provider",
      handler: "provider.findAll", // archivo.metodo
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/provider/create",
      handler: "provider.create", // archivo.metodo
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/provider/nearby",
      handler: "provider.findNearby", // archivo.metodo
      config: {
        auth: false,
      },
    },
  ],
};
