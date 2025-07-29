const fastify = require("fastify");
const cors = require("@fastify/cors");
const helmet = require("@fastify/helmet");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const app = fastify();

app.register(cors);
app.register(helmet);

// Add your routes and logic here

const start = async () => {
  try {
    await prisma.$connect();
    await app.listen({ port: 3000 });
    console.log("Server is running on http://localhost:3000");
  } catch (error) {
    await prisma.$disconnect();
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

app.get("/healthcheck", async (request, reply) => {
  reply.send("OK");
});

app.get("/users", async (request, reply) => {
  try {
    const users = await prisma.user.findMany();
    reply.send(users);
  } catch (error) {
    console.error("Error retrieving users:", error);
    reply.status(500).send("Internal Server Error");
  }
});
start();
