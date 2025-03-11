"use client";
import Image from 'next/image';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";


export default function Dashboard() {
  const { data: session } = useSession();
  const [servers, setServers] = useState([]);

  useEffect(() => {
    if (session) {
      fetch("/api/servers")
        .then((res) => res.json())
        .then((data) => setServers(data))
        .catch((err) => console.error("Error fetching servers:", err));
    }
  }, [session]);

  if (!session) {
    return <p className="text-center text-gray-500">Musisz być zalogowany, aby zobaczyć serwery.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Twoje serwery</h1>
      <ul className="space-y-2">
        {servers.length > 0 ? (
          servers.map((server) => (
            <li key={server.id} className="p-3 bg-gray-800 text-white rounded-md">
              <div className="flex items-center gap-3">
                {server.icon ? (
                  <Image
                    src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
                    alt={server.name}
                    width={40} 
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full">
                    {server.name[0]}
                  </div>
                )}
                <span>{server.name}</span>
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-500">Brak serwerów do wyświetlenia.</p>
        )}
      </ul>
    </div>
  );
}