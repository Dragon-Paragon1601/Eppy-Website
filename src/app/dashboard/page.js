"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();
  const [adminServers, setAdminServers] = useState([]);
  const [noPermissionsServers, setNoPermissionsServers] = useState([]);

  useEffect(() => {
    if (session) {
      fetch("/api/servers")
        .then((res) => res.json())
        .then((data) => {
          // Zapewniamy, że dane są zawsze tablicą
          const admin = data?.adminServers || [];
          const noPerms = data?.noPermissionServers || [];

          setAdminServers(admin);
          setNoPermissionsServers(noPerms);
        })
        .catch((err) => {
          console.error("Błąd podczas pobierania serwerów:", err);
        });
    }
  }, [session]);

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
            <li key={server.guild_id} className="p-3 bg-gray-800 text-white rounded-md flex items-center gap-3">
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
              <span>{server.guild_name}</span>
              <span className="text-blue-500 ml-2">🔧</span>
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
            <li key={server.guild_id} className="p-3 bg-gray-800 text-white rounded-md flex items-center gap-3">
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
              <span>{server.guild_name}</span>
            </li>
          ))
        ) : (
          <p className="text-white">Brak serwerów do wyświetlenia.</p>
        )}
      </ul>
    </div>
  );
}
