import { FastifyInstance } from "fastify";
import {
  getOrCreateReferralCode,
  getReferralStats,
  registerReferral,
} from "../store/referrals";

export default async function referralRoutes(fastify: FastifyInstance) {
  fastify.post("/create", async (request, reply) => {
    const { address } = request.body as { address?: string };
    if (!address) {
      return reply.status(400).send({ error: "address_required" });
    }

    const code = getOrCreateReferralCode(address);
    return reply.send({ address, referralCode: code });
  });

  fastify.post("/use", async (request, reply) => {
    const { referralCode, address } = request.body as {
      referralCode?: string;
      address?: string;
    };

    if (!referralCode || !address) {
      return reply.status(400).send({ error: "invalid_request" });
    }

    const result = registerReferral(referralCode, address);
    return reply.send(result);
  });

  fastify.get("/stats", async (request, reply) => {
    const address = (request.query as any).address as string | undefined;
    if (!address) {
      return reply.status(400).send({ error: "address_required" });
    }

    const stats = getReferralStats(address);
    return reply.send(stats);
  });
}
