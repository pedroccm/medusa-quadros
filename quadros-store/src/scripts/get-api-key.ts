import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function getApiKey({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "type", "token"],
  });
  for (const key of data) {
    console.log(`TYPE=${key.type} TITLE=${key.title} TOKEN=${key.token}`);
  }
}
