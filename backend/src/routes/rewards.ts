import { FastifyInstance } from "fastify";
import { claimPendingMedals } from "../store/referrals";

export default async function rewardsRoutes(fastify: FastifyInstance) {
  fastify.post("/claim-medals", async (request, reply) => {
    const { address } = request.body as { address?: string };
    if (!address) {
      return reply.status(400).send({ error: "address_required" });
    }

    const claimed = claimPendingMedals(address);
    return reply.send({ address, claimed });
  });
}
