// // scripts/updateUsers.ts

// const { PrismaClient } = require("@prisma/client");
// const { v4: uuidv4 } = require("uuid");

// const prismaTemp = new PrismaClient();

// async function updateUsers() {
// 	const usersWithoutUserId = await prismaTemp.user.findMany({
// 		where: { userId: null },
// 	});

// 	for (const user of usersWithoutUserId) {
// 		await prismaTemp.user.update({
// 			where: { id: user.id },
// 			data: { userId: uuidv4() },
// 		});
// 	}

// 	console.log("Updated users with missing userId");
// }

// updateUsers()
// 	.catch((e) => {
// 		console.error(e);
// 		process.exit(1);
// 	})
// 	.finally(async () => {
// 		await prismaTemp.$disconnect();
// 	});
