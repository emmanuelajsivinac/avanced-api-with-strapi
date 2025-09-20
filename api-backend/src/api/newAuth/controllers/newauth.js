const { createCoreController } = require("@strapi/strapi").factories;
const { authenticator } = require("otplib");
const QRCode = require("qrcode");

module.exports = createCoreController(
  "plugin::users-permissions.user",
  ({ strapi }) => ({
    async local(ctx) {
      const { identifier, password } = ctx.request.body;

      // set required fields
      if (!identifier || !password) {
        return ctx.badRequest("Missing required fields");
      }

      // identifier validation using original service
      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { email: identifier },
          populate: { role: true }, // traer toda la info del role
        });

      if (!user) {
        return ctx.unauthorized("Invalid credentials");
      } else {
        console.log(user);
      }

      // password validation using original service
      const validPassword = await strapi
        .plugin("users-permissions")
        .service("user")
        .validatePassword(password, user.password);

      if (!validPassword) return ctx.unauthorized("Invalid credentials");

      // create the jwt
      console.log(user.id);
      const jwt = strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue({ id: user.id });

      // sanitize the output
      const sanitizedUser = await strapi.contentAPI.sanitize.output(
        user,
        strapi.getModel("plugin::users-permissions.user"),
        ctx.state.auth
      );
      console.log(sanitizedUser);
      console.log(sanitizedUser.id);
      // set the confirm data return
      const customReturnUserData = {
        id: sanitizedUser.id,
        documentId: sanitizedUser.documentId,
        firstName: sanitizedUser.firstName,
        lastName: sanitizedUser.lastName,
        email: sanitizedUser.email,
        username: sanitizedUser.username,
        role: sanitizedUser.role.id,
        provider: sanitizedUser.provider,
        confirmed: sanitizedUser.confirmed,
        blocked: sanitizedUser.blocked,
        createAt: sanitizedUser.createdAt,
        updateAt: sanitizedUser.updatedAt,
        publishedAt: sanitizedUser.publishedAt,
      };

      // return confirm data
      return { jwt, user: customReturnUserData };
    },

    async localWith2FA(ctx) {
      const { identifier, password } = ctx.request.body;

      // set required fields
      if (!identifier || !password) {
        return ctx.badRequest("Missing required fields");
      }

      // identifier validation using original service
      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { email: identifier },
          populate: { role: true }, // traer toda la info del role
        });

      if (!user) {
        return ctx.unauthorized("Invalid credentials");
      } else {
        console.log(user);
      }

      // password validation using original service
      const validPassword = await strapi
        .plugin("users-permissions")
        .service("user")
        .validatePassword(password, user.password);

      if (!validPassword) return ctx.unauthorized("Invalid credentials");

      // create the jwt
      console.log(user.id);

      // sanitize the output
      const sanitizedUser = await strapi.contentAPI.sanitize.output(
        user,
        strapi.getModel("plugin::users-permissions.user"),
        ctx.state.auth
      );
      console.log(sanitizedUser);
      console.log(sanitizedUser.id);
      // set the confirm data return
      const customReturnUserData = {
        id: sanitizedUser.id,
        documentId: sanitizedUser.documentId,
        firstName: sanitizedUser.firstName,
        lastName: sanitizedUser.lastName,
        email: sanitizedUser.email,
        username: sanitizedUser.username,
        role: sanitizedUser.role.id,
        provider: sanitizedUser.provider,
        confirmed: sanitizedUser.confirmed,
        blocked: sanitizedUser.blocked,
        createAt: sanitizedUser.createdAt,
        updateAt: sanitizedUser.updatedAt,
        publishedAt: sanitizedUser.publishedAt,
      };

      // return confirm data
      return { user: customReturnUserData };
    },

    async register(ctx) {
      const { username, email, password, firstName, lastName, role, provider } =
        ctx.request.body;

      // set required fields
      if (!username || !email || !password || !role || !provider) {
        return ctx.badRequest("Missing required fields");
      }

      const existingUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { email } });
      if (existingUser) return ctx.badRequest("Email already taken");

      // save the filed
      const newUser = await strapi
        .plugin("users-permissions")
        .service("user")
        .add({
          username,
          email,
          password,
          firstName,
          lastName,
          role,
          provider,
        });

      // create the jwt
      const jwt = strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue({ id: newUser.id });

      newUser.provider = "local";

      // sanitize the output
      const sanitizedUser = await strapi.contentAPI.sanitize.output(
        newUser,
        strapi.getModel("plugin::users-permissions.user"),
        ctx.state.auth
      );

      // set the confirm data return
      const customReturnUserData = {
        id: sanitizedUser.id,
        documentId: sanitizedUser.documentId,
        firstName: sanitizedUser.firstName,
        lastName: sanitizedUser.lastName,
        email: sanitizedUser.email,
        username: sanitizedUser.username,
        role: sanitizedUser.role.id,
        provider: sanitizedUser.provider,
        confirmed: sanitizedUser.confirmed,
        blocked: sanitizedUser.blocked,
        createAt: sanitizedUser.createdAt,
        updateAt: sanitizedUser.updatedAt,
        publishedAt: sanitizedUser.publishedAt,
      };

      // return confirm data
      return { jwt, user: customReturnUserData };
    },

    async googleAuthenticatorQR(ctx) {
      const { email } = ctx.request.body;

      // verify if user exists
      const existingUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { email } });

      if (!existingUser) return ctx.badRequest("User not found");

      let secret = existingUser.twoFASecret;

      if (!secret) {
        // create secret onces
        secret = authenticator.generateSecret();

        // save secret into db
        await strapi.db.query("plugin::users-permissions.user").update({
          where: { id: existingUser.id },
          data: { twoFASecret: secret },
        });
      }

      // generate to QR code
      const otpauth = authenticator.keyuri(email, "Strapi Test Dev", secret);
      const qrBase64 = await QRCode.toDataURL(otpauth);

      return {
        message: "QR code to Google Authenticator created successfully",
        qrBase64,
      };
    },

    async googleAuthenticatorVerify(ctx) {
      const { email, token } = ctx.request.body;

      if (!email || !token) return ctx.badRequest("Missing required fields");

      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { email },
          populate: { role: true },
        });
      if (!user || !user.twoFASecret) return ctx.badRequest("2FA not enabled");

      const tokenString = token.toString().padStart(6, "0");
      console.log("Token recibido:", tokenString);
      console.log("Secret guardado:", `"${user.twoFASecret}"`);

      const generatedToken = authenticator.generate(user.twoFASecret.trim());
      console.log("Token que genera otplib:", generatedToken);
      console.log("Token recibido del frontend:", tokenString);

      // tolerance
      authenticator.options = { window: 2 };

      const isValid = authenticator.check(tokenString, user.twoFASecret.trim());

      if (!isValid) return ctx.unauthorized("Invalid 2FA code");

      // create jwt to sign in
      const jwt = strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue({ id: user.id });

      const customReturnUserData = {
        id: user.id,
        documentId: user.documentId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        role: user.role.id,
        provider: user.provider,
        confirmed: user.confirmed,
        blocked: user.blocked,
        createAt: user.createdAt,
        updateAt: user.updatedAt,
        publishedAt: user.publishedAt,
      };
      return {
        message: "2FA verified successfully",
        jwt,
        user: customReturnUserData,
      };
    },
  })
);
