import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import mongoose from "mongoose"; // Import mongoose do połączenia z MongoDB
import mysql from "mysql2"; // Import do komunikacji z MySQL
import logger from "../../../../logger";

// Połączenie z MongoDB
const connectToMongoDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// Modele do użytkowników i kanałów
const User =
  mongoose.models.users ||
  mongoose.model("users", new mongoose.Schema({}, { strict: false }));
const Channel =
  mongoose.models.channels ||
  mongoose.model("channels", new mongoose.Schema({}, { strict: false }));

// Połączenie z MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const promisePool = pool.promise();

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    logger.warn("❌ Brak autoryzacji!");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const userId = session.user?.id || session.user?.sub;
  if (!userId) {
    logger.warn("❌ Brak ID użytkownika w sesji!");
    return new Response(JSON.stringify({ error: "Brak ID użytkownika" }), {
      status: 400,
    });
  }

  await connectToMongoDB(); // Połączenie z MongoDB

  try {
    // Pobieranie danych użytkownika z kolekcji EppyBot.users
    const userServers = await User.find({ user_id: userId });

    if (!userServers || userServers.length === 0) {
      return new Response(
        JSON.stringify({
          adminServers: [],
          noPermissionServers: [],
          channels: [],
          setChannels: [],
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

    // Pobieranie kanałów tekstowych z MongoDB
    const channels = await Channel.find({
      guild_id: { $in: adminServers.map((server) => server.guild_id) },
      channel_type: "0",
    });

    // Pobieranie queue_channels z MySQL
    const [queueChannels] = await promisePool.query(
      "SELECT guild_id, queue_channel_id FROM queue_channels WHERE guild_id IN (?)",
      [adminServers.map((server) => server.guild_id)]
    );

    // Formatowanie danych dla setChannels
    const setChannels = queueChannels.map((row) => {
      const channel = channels.find(
        (ch) =>
          ch.guild_id === row.guild_id && ch.channel_id === row.queue_channel_id
      );
      return {
        guild_id: row.guild_id,
        queue_channel_id: row.queue_channel_id,
        queue_channel_name: channel ? channel.channel_name : "Wybierz kanał", // Jeśli kanał nie jest ustawiony, to ustawiamy 'Wybierz kanał'
      };
    });

    // Dodanie pustego wpisu dla serwerów, które nie mają ustawionego kanału
    adminServers.forEach((server) => {
      if (!setChannels.some((sc) => sc.guild_id === server.guild_id)) {
        setChannels.push({
          guild_id: server.guild_id,
          queue_channel_id: "",
          queue_channel_name: "Wybierz kanał", // Kanał do wyboru
        });
      }
    });

    return new Response(
      JSON.stringify({
        adminServers,
        noPermissionServers,
        channels,
        setChannels,
      }),
      { status: 200 }
    );
  } catch (error) {
    logger.error("❌ Błąd pobierania danych użytkownika:", error);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    logger.warn("❌ Brak autoryzacji!");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const userId = session.user?.id || session.user?.sub;
  if (!userId) {
    logger.warn("❌ Brak ID użytkownika w sesji!");
    return new Response(JSON.stringify({ error: "Brak ID użytkownika" }), {
      status: 400,
    });
  }

  const { guild_id, channel_id } = await req.json();

  if (!guild_id || !channel_id) {
    return new Response(JSON.stringify({ error: "Brak danych" }), {
      status: 400,
    });
  }

  try {
    // Zapisz lub nadpisz wybór kanału
    const [result] = await promisePool.query(
      "INSERT INTO queue_channels (guild_id, queue_channel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE queue_channel_id = VALUES(queue_channel_id)",
      [guild_id, channel_id]
    );

    logger.info(`✅ Kanał ${channel_id} zapisany dla gildii ${guild_id}`);

    return new Response(
      JSON.stringify({ message: "Kanał zapisany pomyślnie", channel_id }),
      { status: 200 }
    );
  } catch (error) {
    logger.error("❌ Błąd zapisu kanału w MySQL:", error);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
    });
  }
}
