import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import mongoose from "mongoose"; // Import mongoose do połączenia z MongoDB
import logger from "../../../../logger";

// Funkcja do łączenia z MongoDB
const connectToMongoDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// Sprawdzanie czy model już istnieje, jeśli nie, to tworzenie go
const User = mongoose.models.users || mongoose.model('users', new mongoose.Schema({}, { strict: false }));

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

  await connectToMongoDB(); // Połączenie z MongoDB

  try {
    // Pobieranie danych użytkownika z kolekcji EppyBot.users
    const userServers = await User.find({ user_id: userId });

    // Jeśli nie ma serwerów, zwrócimy pustą odpowiedź
    if (!userServers || userServers.length === 0) {
      return new Response(
        JSON.stringify({
          adminServers: [],
          noPermissionServers: [],
        }),
        { status: 200 }
      );
    }

    // Filtrowanie serwerów na podstawie uprawnień
    const adminServers = userServers.filter(
      (server) => server.admin_prem === 8
    );
    const noPermissionServers = userServers.filter(
      (server) => server.admin_prem !== 8
    );

    // Zwrócenie odpowiedzi
    return new Response(
      JSON.stringify({
        adminServers,
        noPermissionServers
      }),
      { status: 200 }
    );
  } catch (error) {
    logger.error("❌ Błąd pobierania danych użytkownika:", error);
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
}
