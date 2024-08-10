import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async (req: NextApiRequest, res: NextApiResponse) => {
	const { id } = req.query;

	if (req.method === "GET") {
		try {
			const booking = await prisma.booking.findUnique({
				where: { id: Number(id) },
			});
			res.status(200).json(booking);
		} catch (error) {
			res.status(500).json({ error: "Failed to fetch booking" });
		}
	} else if (req.method === "DELETE") {
		try {
			await prisma.booking.delete({
				where: { id: Number(id) },
			});
			res.status(204).end();
		} catch (error) {
			res.status(500).json({ error: "Failed to delete booking" });
		}
	} else {
		res.status(405).json({ error: "Method not allowed" });
	}
};
