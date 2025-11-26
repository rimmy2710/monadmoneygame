import { FastifyInstance } from "fastify";
import { getSocials, linkSocial, unlinkSocial, SocialKey } from "../store/socials";
import { registerPlayer } from "../store/players";

interface LinkBody {
  address: string;
  social: SocialKey;
}

export default async function socialRoutes(app: FastifyInstance) {
  app.post("/link", async (request, reply) => {
    const { address, social } = request.body as LinkBody;
    if (!address || !social) {
      return reply.code(400).send({ error: "address_and_social_required" });
    }
    const state = linkSocial(address, social);
    registerPlayer(address);
    return reply.send({ address, socials: state });
  });

  app.post("/unlink", async (request, reply) => {
    const { address, social } = request.body as LinkBody;
    if (!address || !social) {
      return reply.code(400).send({ error: "address_and_social_required" });
    }
    const state = unlinkSocial(address, social);
    registerPlayer(address);
    return reply.send({ address, socials: state });
  });

  app.get("/state", async (request, reply) => {
    const address = (request.query as any).address as string | undefined;
    if (!address) {
      return reply.code(400).send({ error: "address_required" });
    }
    const socials = getSocials(address);
    registerPlayer(address);
    return reply.send({ address, socials });
  });
}
