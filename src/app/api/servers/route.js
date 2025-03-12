import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import mysql from "mysql2/promise";
import logger from "../../../../logger";

export async function GET(req) {

  const session = await getServerSession(authOptions);

  if (!session) {
    logger.warn("❌ Brak autoryzacji!");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const userId = session.user?.id || session.user?.sub;
  if (!userId) {
    logger.warn("❌ Brak ID użytkownika w sesji!");
    return new Response(JSON.stringify({ error: "Brak ID użytkownika" }), { status: 400 });
  }


  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });


    const [servers] = await connection.execute(
      "SELECT CAST(id AS CHAR) as id, name, icon, owner_id FROM servers WHERE owner_id = ?",
      [userId]
    );


    return new Response(JSON.stringify(servers), { status: 200 });
  } catch (error) {
    logger.error("❌ Błąd pobierania serwerów:", error);
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
