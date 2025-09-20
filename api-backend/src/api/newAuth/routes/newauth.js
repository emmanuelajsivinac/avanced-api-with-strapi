module.exports = {
  routes: [
    {
      method: "POST",
      path: "/auth/new-register",
      handler: "newauth.register", // archivo.metodo
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/auth/new-local",
      handler: "newauth.local", // archivo.metodo
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/auth/new-local-2FA",
      handler: "newauth.localWith2FA", // archivo.metodo
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/auth/2FA",
      handler: "newauth.googleAuthenticatorQR", // archivo.metodo
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/auth/2FA-verify",
      handler: "newauth.googleAuthenticatorVerify", // archivo.metodo
      config: {
        auth: false,
      },
    },
  ],
};
