"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();
  const [servers, setServers] = useState([]);

  useEffect(() => {
    // Sprawdzenie, czy sesja jest dostępna
    console.log("Sesja użytkownika:", session);
    
    if (session) {
      // Wysyłamy zapytanie do API, które zwróci dane o serwerach
      fetch("/api/servers")
        .then((res) => {
          console.log("Status odpowiedzi z API:", res.status); // Logowanie statusu odpowiedzi
          return res.json();
        })
        .then((data) => {
          console.log("Dane z API:", data); // Logowanie zwróconych danych
          setServers(data);
        })
        .catch((err) => {
          console.error("Błąd podczas pobierania serwerów:", err); // Logowanie błędów
        });
    }
  }, [session]);

  if (!session) {
    return <p className="text-center text-white">Musisz być zalogowany, aby zobaczyć serwery.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 mt-16"> {/* Dodany margines mt-16 (margines górny) */}
      <h1 className="text-2xl font-bold mb-4 text-white">Twoje serwery</h1>
      <ul className="space-y-2">
        {servers.length > 0 ? (
          servers.map((server) => (
            <li key={server.id} className="p-3 bg-gray-800 text-white rounded-md flex items-center gap-3">
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
              {(
                <span className="text-yellow-500 ml-2">👑</span> // Korona dla właściciela
              )}
              {server.isAdmin && (
                <span className="text-blue-500 ml-2">🔧</span> // Ikona dla administratora
              )}
            </li>
          ))
        ) : (
          <p className="text-white">Brak serwerów do wyświetlenia.</p>
        )}
      </ul>
    </div>
  );
}
