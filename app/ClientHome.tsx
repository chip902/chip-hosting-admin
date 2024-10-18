"use client";
import { useDwollaAccounts } from "@/app/hooks/useDwollaAccounts";
import { usePlaidBanks } from "@/app/hooks/usePlaidBanks";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";
import RecentTransactions from "@/components/RecentTransactions";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { Skeleton } from "@radix-ui/themes";

interface ClientHomeProps {
	userId: string;
}

export default function ClientHome({ userId }: ClientHomeProps) {
	const { data: dwollaAccounts, isLoading: isDwollaLoading, error: dwollaError } = useDwollaAccounts(userId);
	const { data: plaidData, isLoading: isPlaidLoading, error: plaidError } = usePlaidBanks(userId);
	const { data: transactions, isLoading: isTransactionsLoading, error: transactionsError } = usePlaidTransactions(userId);
	const { toast } = useToast();

	const accounts = plaidData?.accounts || [];
	const totalBanks = plaidData?.totalBanks || 0;
	const totalCurrentBalance = plaidData?.totalCurrentBalance || 0;

	useEffect(() => {
		if (dwollaError || plaidError || transactionsError) {
			toast({
				variant: "destructive",
				title: "Error",
				description: dwollaError?.message || plaidError?.message || transactionsError?.message || "An error occurred while fetching data.",
			});
		}
	}, [dwollaError, plaidError, transactionsError, toast]);

	if (isDwollaLoading || isPlaidLoading || isTransactionsLoading) {
		return (
			<Skeleton>
				Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ratione nulla tempore repellat laudantium dolorum iusto saepe assumenda fugiat eum
				minus. Vel repellat nulla libero suscipit ipsam aut, id quis corrupti. Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure non, dolore
				quas suscipit nesciunt commodi blanditiis sed facilis voluptate, voluptatem maxime tempore, accusantium quisquam beatae velit possimus omnis
				natus facere! Impedit qui tenetur molestiae minus aliquam maxime eaque voluptas, fugiat repellat similique voluptatem. Quam repellendus ullam
				deleniti non veniam cum incidunt, neque nihil impedit doloremque, veritatis mollitia blanditiis modi numquam! Impedit, modi veritatis corporis
				laudantium expedita enim! Voluptatem laborum ullam minima dignissimos odio dolores ipsam molestias itaque reprehenderit sapiente perspiciatis,
				illo vel possimus, alias totam dolore quis qui ad natus! Itaque nam accusantium dicta sapiente consequuntur id, labore sed natus architecto
				dolorem nisi nihil soluta repellendus temporibus voluptatum saepe. Et harum perferendis, ut esse rerum optio molestiae vitae! Magnam, corporis!
				Expedita dolor officia dolores sequi repellendus eum, earum ullam voluptatem, illo suscipit corrupti. Eius, necessitatibus eligendi? Numquam,
				quasi? Dolores ipsam quasi omnis! Cum dolor perferendis saepe tempore sequi, quod magni. Dignissimos qui similique provident voluptates labore
				quo, pariatur, culpa, voluptas cumque fugit mollitia autem. Eaque illum tenetur maiores quo quasi ad. Sequi deleniti tempore veritatis tenetur
				iusto, et beatae sapiente. Natus, eligendi vitae nihil error numquam similique beatae? Atque nihil veniam voluptate alias ab? Quisquam aperiam
				molestias soluta cupiditate architecto qui inventore, corrupti exercitationem quaerat unde libero atque deserunt quidem! Quibusdam beatae nisi
				rerum ex fuga debitis consectetur a quia distinctio fugiat ut, hic blanditiis libero illo necessitatibus totam quas minima commodi sint
				asperiores, laboriosam repellat, iusto perspiciatis explicabo. Ipsum! Repellat nobis deleniti repellendus rerum inventore, amet cupiditate
				ducimus sunt tempore molestias delectus velit praesentium aperiam accusamus laboriosam placeat aut recusandae, perspiciatis temporibus eveniet
				magnam. Molestiae inventore libero animi omnis. Vero, reprehenderit ullam optio quia unde illum nobis debitis exercitationem quo architecto
				nesciunt dolorum similique repudiandae explicabo id, quasi, ducimus repellendus commodi? Eos exercitationem ab quo tempora explicabo quaerat
				possimus. Laudantium omnis odio neque beatae repellat error, nostrum esse dolor? Doloribus, corporis excepturi? Veritatis a odit minima
				assumenda, dolorem iste suscipit quis voluptate dicta laborum dolorum eveniet, necessitatibus, nobis vel. Quis aut, fuga dolor eos iure autem
				ullam, nobis beatae nostrum laudantium odio harum saepe perspiciatis, officiis voluptatem dignissimos accusamus laboriosam at qui esse amet
				reprehenderit minus magni. Quidem, perferendis? Dignissimos asperiores iste alias ducimus eum dolore nobis error pariatur natus labore
				temporibus ipsa quis fugit tenetur earum eius, esse beatae, illum tempore. Asperiores impedit magnam adipisci eligendi earum. In. Ipsa facilis
				consequatur exercitationem ex illo non nobis voluptates totam deleniti, delectus, dolore, dolorum inventore eos nulla ipsam! Quaerat, maiores.
				Natus suscipit id dolore inventore optio illo recusandae, in culpa! Incidunt enim eligendi iusto tenetur hic amet, laborum dolor similique
				soluta, animi consectetur? Alias perspiciatis fugiat, soluta, necessitatibus nam excepturi dolorum quasi eaque labore totam quis natus dicta,
				illum ab! Deleniti vitae facilis dolor, consectetur similique nisi rem commodi error et unde corporis perspiciatis accusantium consequatur
				maxime nam obcaecati beatae quibusdam officiis eaque animi reprehenderit? Consequatur reiciendis architecto aperiam sint. Minima impedit
				laboriosam at modi harum et ipsam, praesentium adipisci. Quibusdam, magnam inventore. Ipsum, magnam porro aperiam saepe nemo libero at eaque
				voluptates inventore. Eligendi voluptatem nesciunt neque totam eum? Nihil quo odio ipsum facere nesciunt provident vel labore accusantium. Ab
				consequuntur neque quaerat aliquam quo dolorem minima asperiores sunt sapiente vel! Praesentium autem excepturi sequi qui rem, veritatis vero.
				Consequuntur tempore est atque molestias dignissimos alias nostrum voluptas, blanditiis sed dolorum. Dolores inventore, eaque, excepturi
				nesciunt laborum minima in non velit qui hic illo ullam eos impedit, consectetur assumenda. Optio veritatis illo unde nihil porro ipsam dolore
				perspiciatis, pariatur consequuntur iste impedit voluptatem repellat laborum mollitia vel. Delectus ex alias laborum deserunt. Architecto
				dolorem nihil cum molestias fuga necessitatibus! Cupiditate maiores repudiandae itaque. Molestiae illo sapiente mollitia facere exercitationem
				molestias pariatur eius illum, fuga iusto eum sint consequuntur veritatis cum necessitatibus nesciunt officiis distinctio ipsa enim error
				aliquam nobis! Pariatur distinctio repellendus ipsum consequatur, quas illum error omnis aperiam facere cum voluptate aliquid, tempore minima
				officia accusantium nostrum id suscipit minus. Culpa, reiciendis delectus? Cum porro exercitationem voluptatibus? Harum. Quod officiis animi
				architecto molestias amet obcaecati quam quibusdam? Iste, a. Ea placeat officia distinctio perspiciatis quis hic laborum, doloremque repellendus
				aspernatur error laboriosam nulla, iure labore, corporis voluptatibus voluptas? Nam asperiores quam repellat officia a esse officiis. Quisquam
				nesciunt officiis harum sit illum, in autem suscipit cum fuga assumenda totam numquam temporibus ab corrupti eveniet voluptates quibusdam
				deleniti doloribus! Veritatis assumenda deleniti dolorum perferendis dignissimos magnam nemo labore praesentium quas sit at expedita porro,
				aperiam, molestiae nam? Cupiditate sit eius rem accusamus id magni eaque, omnis modi ab amet? Ullam, quae quas repudiandae quasi perferendis
				mollitia, reiciendis dolorum nostrum sunt rerum dolorem consequatur nihil maxime suscipit. Earum debitis non, ratione quasi molestias, modi iste
				incidunt commodi minus officia harum. Delectus dolore velit dolorem nisi minima. Voluptas, eius consectetur nihil cum delectus officiis fugit
				magnam harum aspernatur laudantium recusandae. Possimus rem quibusdam perferendis ab laudantium nisi modi architecto repudiandae voluptate? Vel
				ab in quibusdam id sapiente soluta vitae cumque repellat atque doloremque ducimus nobis aperiam voluptates, neque ea voluptatum. Facere,
				laudantium quia. Hic, laboriosam. Similique omnis numquam dolor at ducimus! Aut neque eaque, eos voluptatum, non iste dolores nostrum placeat
				voluptatibus, itaque unde pariatur totam sit aliquid nisi! Dolorum vel accusamus dignissimos aliquam eligendi amet aliquid dolor, nemo ducimus
				blanditiis. Praesentium porro ex ullam obcaecati quaerat voluptatum eum eveniet facilis? Sapiente nulla sit veniam nobis quibusdam expedita
				earum mollitia odio ducimus non doloribus, optio aperiam vero quo officia autem accusantium. Illo, molestias aperiam nihil ratione ullam
				temporibus commodi aliquam blanditiis, nostrum esse voluptatibus aliquid, quo adipisci deserunt est magnam totam velit ad iure necessitatibus
				unde doloremque porro! Aliquam, fugit exercitationem! Nisi quidem ullam voluptatum distinctio sed quis sint? Sit, sed ipsa pariatur
				necessitatibus doloremque nam delectus quam tempora iusto. Libero quibusdam iure eius obcaecati sunt aut dolore cumque non assumenda.
			</Skeleton>
		);
	}
	return (
		<>
			<TotalBalanceBox accounts={accounts} totalBanks={totalBanks} totalCurrentBalance={totalCurrentBalance} />
			<RecentTransactions accounts={accounts} transactions={transactions || []} />
		</>
	);
}
