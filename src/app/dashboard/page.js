"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

export default function Dashboard() {
  const { data: session } = useSession();
  const [adminServers, setAdminServers] = useState([]);
  const [noPermissionsServers, setNoPermissionsServers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [channelId, setChannelId] = useState({}); // Przechowuje ID wybranego kanału dla każdego serwera
  const [channels, setChannels] = useState({}); // Przechowuje kanały dla każdej gildii

  useEffect(() => {
    if (session) {
      // Pobieramy serwery użytkownika
      fetch("/api/servers")
        .then((res) => res.json())
        .then((data) => {
          const admin = data?.adminServers || [];
          const noPerms = data?.noPermissionServers || [];
          setAdminServers(admin);
          setNoPermissionsServers(noPerms);
          
          // Zorganizuj kanały per server
          const serverChannels = {};
          data?.channels.forEach(channel => {
            if (!serverChannels[channel.guild_id]) {
              serverChannels[channel.guild_id] = [];
            }
            serverChannels[channel.guild_id].push(channel);
          });
          setChannels(serverChannels); // Przechowaj kanały dla każdej gildii
        })
        .catch((err) => {
          console.error("Błąd podczas pobierania serwerów:", err);
        });
    }
  }, [session]);

  const toggleExpand = (guild_id) => {
    setExpanded((prev) => ({ ...prev, [guild_id]: !prev[guild_id] }));
  };

  const handleChannelIdChange = (guild_id, value) => {
    setChannelId((prev) => ({ ...prev, [guild_id]: value }));
  };

  const handleSaveChanges = async (guild_id) => {
    // Zapisz zmiany, wyślij POST z danymi
    try {
      const response = await fetch("/api/servers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guild_id,
          channel_id: channelId[guild_id], // Wybieramy kanał dla tej gildii
        }),
      });
      const data = await response.json();
      console.log("Zapisano kanał:", data);
      
      // Po zapisaniu zmiany, zapisz ID kanału w stanie
      setChannelId((prev) => ({ ...prev, [guild_id]: data.channel_id }));
    } catch (error) {
      console.error("Błąd zapisu kanału:", error);
    }
  };

  if (!session) {
    return <p className="text-center text-white">Musisz być zalogowany, aby zobaczyć serwery.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 mt-16">
      <h1 className="text-2xl font-bold mb-4 text-white">Twoje serwery</h1>

      <h2 className="text-xl font-semibold text-white mb-2">Serwery, na których jesteś administratorem</h2>
      <ul className="space-y-2">
        {adminServers.length > 0 ? (
          adminServers.map((server) => (
            <li key={server.guild_id} className="p-3 bg-gray-800 text-white rounded-md flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {server.guild_icon ? (
                    <Image
                      src={server.guild_icon}
                      alt={server.guild_name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full">
                      {server.guild_name[0]}
                    </div>
                  )}
                  <span className="ml-3">{server.guild_name}</span>
                </div>
                <button onClick={() => toggleExpand(server.guild_id)} className="text-blue-500">
                  {expanded[server.guild_id] ? <FaChevronDown /> : <FaChevronRight />}
                </button>
              </div>

              {expanded[server.guild_id] && (
                <div className="mt-2 p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-xl font-semibold text-white">Panel Konfiguracji: {server.guild_name}</h3>

                  {/* Pole do wyboru kanału */}
                  <div className="mt-4">
                    <label htmlFor={`channelId-${server.guild_id}`} className="text-white">
                      Kanał do wysyłania informacji o kolejce:
                    </label>
                    <select
                      id={`channelId-${server.guild_id}`}
                      value={channelId[server.guild_id] || ""}
                      onChange={(e) => handleChannelIdChange(server.guild_id, e.target.value)}
                      className="mt-1 p-2 w-full bg-gray-800 text-white rounded-md"
                    >
                      <option value="">Wybierz kanał</option>
                      {channels[server.guild_id]?.map((channel) => (
                        <option key={channel.channel_id} value={channel.channel_id}>
                          {channel.channel_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => handleSaveChanges(server.guild_id)}
                      className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                    >
                      Zapisz zmiany
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))
        ) : (
          <p className="text-white">Brak serwerów administratora do wyświetlenia.</p>
        )}
      </ul>
      <h2 className="text-xl font-semibold text-white mb-2">Serwery, na których nie masz uprawnień</h2>
      <ul className="space-y-2">
        {noPermissionsServers.length > 0 ? (
          noPermissionsServers.map((server) => (
            <li key={server.guild_id} className="p-3 bg-gray-800 text-gray-500 rounded-md flex items-center gap-3">
              {server.guild_icon ? (
                <Image
                  src={server.guild_icon}
                  alt={server.guild_name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full">
                  {server.guild_name[0]}
                </div>
              )}
              <span className="ml-3">{server.guild_name}</span>
            </li>
          ))
        ) : (
          <p className="text-white">Brak serwerów do wyświetlenia.</p>
        )}
      </ul>
    </div>
  );
}
