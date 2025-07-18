import express from "express";
import { ApolloServer } from "@apollo/server";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { decodedToken } from "./middleware/auth";

const server = new ApolloServer({
  schema: buildSubgraphSchema([
    {
      typeDefs,
      resolvers,
    },
  ]),
  formatError: (err) => {
    // Log the error to the console
    console.error("GraphQL Error:", err);
    // Return a generic error message to the client
    return new Error("Un error inesperado ha ocurrido. Por favor, inténtalo de nuevo más tarde.");
  },
});

await server.start();

const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      const auth = req.headers.authorization;
      const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : undefined;

      let userId: string | undefined;
      if (token) {
        userId = decodedToken(token)?.id;
      }

      return { req, res, token, id: userId };
    },
  }),
);

app.get("/", (req, res) => {
  res.send("User's subgraph is running");
});

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`User's subgraph is running on port ${PORT}`);
});
