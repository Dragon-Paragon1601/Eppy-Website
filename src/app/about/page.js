//* eslint-disable react/no-unescaped-entities */
export default function About() {
  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 text-white">
      <section className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-8 md:p-10">
        <h1 className="text-3xl md:text-4xl font-bold">About Eppy</h1>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          Eppy is a Discord bot built to make community management easier. It
          combines moderation tools, utility commands, and configurable server
          channels in one workflow, so admins can set everything up quickly and
          keep the server organized.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-6">
          <h2 className="text-xl font-semibold">What Eppy focuses on</h2>
          <ul className="mt-3 space-y-2 text-zinc-300 text-sm leading-relaxed list-disc ml-5">
            <li>
              Fast and practical moderation features for daily admin work.
            </li>
            <li>Configurable notification channels for important events.</li>
            <li>
              Simple dashboard controls connected to your existing bot data.
            </li>
            <li>
              Permission-safe changes (ManageGuild required for settings
              updates).
            </li>
          </ul>
        </article>

        <article className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-6">
          <h2 className="text-xl font-semibold">About the Creator</h2>
          <p className="mt-3 text-zinc-300 text-sm leading-relaxed">
            Eppy is created by{" "}
            <span className="font-semibold text-white">Paragon</span>, a solo
            developer passionate about building tools for Discord. The goal is
            to build a reliable bot ecosystem with a clean, modern dashboard
            that is easy to use and easy to expand.
          </p>
          <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
            This project is actively evolving, with new modules planned for
            music management, quality-of-life automation, and better server
            insights.
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-8 md:p-10">
        <h2 className="text-2xl md:text-3xl font-bold">From Creator</h2>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          Hi, Paragon here, the creator of Eppy. I started this project because
          I wanted a bot that could handle all the basic server management tasks
          without needing multiple bots or paid premium features.
        </p>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          Ideas for Eppy come from my own experience managing Discord servers.
          But the thing that contributed the most to Eppy development was
          Discord restricting bot permissions connected to playing music. I was
          really frustrated with that, because I often used music bots to play
          music while gaming with friends. You may ask why I did not just switch
          to YouTube or Spotify, but the issue was that Spotify was constantly
          stopping playback because of Discord voice activity for more than 30
          seconds. That was Spotify way of preventing bots from streaming music
          on a mass scale, but in my case it was also preventing me from singing
          on voice chat. And on YouTube, there were many ads...
        </p>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          Then one of my friends suggested that I create my own music bot. He
          argued that since I liked programming, and if I wanted to listen to
          music, I should create my own instead of looking for new bots because
          eventually every public bot will be taken down eventually. So I
          started making my own...
        </p>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          At first, the road of making this, at that time music-only bot, was
          littered with many stones. I had absolutely no experience with
          JavaScript and especially with Node.js and Discord.js and all the
          other technologies I had to use. After many hours of trying to make
          the bot just to connect to a voice channel and play one song, I gave
          up....
        </p>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          After a few months, I decided to give it another try. I started from
          the exact thing that I left unfinished, making the bot play one track
          in a channel. And I succeeded! I was filled with joy, but I knew that
          it was only the beginning. Then I started trying to download many
          songs and play them in a queue, one after another. IT WAS PAINFUL!
          Nothing worked as intended, and the bot was crashing every 5 minutes.
          In the end, I managed to stabilize it enough to make it play songs,
          and only songs from Spotify playlist links or YouTube links. It also
          had an option to search for tracks by name via a Discord command. The
          initial idea for that function was that the bot would convert a
          Spotify playlist into artist and song names, then pass that
          information to a module that looked for equivalents on YouTube, and
          then download them with yt-dlp and add them to the queue. It was not
          great, but it was working until...
        </p>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          One day, as usual, we came to play something, we ran the command for
          the bot to play, and it did not work. It turned out that YouTube
          changed its video format type, or something like that, which resulted
          in yt-dlp not being able to download any song... I thought this would
          be fixed soon and the bot would work as usual, but I was wrong. I had
          not touched it for over 2 to 3 years, thinking maybe one day it would
          work again on its own..
        </p>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          Then one day we were playing a match of League of Legends and we were
          joking about Corporate Mundo and its legendary PUSH PUSH PUSH edits.
          We thought that it would be really funny to play that track (PUSH!
          PUSH! PUSH!) every time we saw that skin in the game. So I created a
          simple command for Eppy that would play 1-hour-long PUSH PUSH PUSH on
          repeat until using a command to end it. It was a seed that grew into
          the current version of Eppy.
        </p>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          Things that changed from the initial idea and contributed to Eppy
          working on its own were that the main function of playing music was no
          longer downloading and deleting songs after they were played, but
          instead it relied on its own repository with handly downloade
          playlists. I rewrote the whole music logic and made many new features
          like next song command, repeat, previous song (it was not really
          working and I was crashing the bot every time someone used it, but it
          looked nice XD), and many more. Then I got bored and added many
          different features like moderation, or misc commands that helped me
          understand how to integrate many different uses of databases and
          different features.
        </p>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          And here we are today, Eppy is no longer crashing every 5 minutes and
          it has many really useful features. Have I mentioned how the Eppy name
          came to be? I was following one Polish YouTuber and streamer called
          Eleven and he had his own bot (his son) called Sappy (big shoutout to
          him becouse without Sappy Eppy would not be called Eppy). I thought
          that that name was amazing but I did not want to just copy it. Then we
          thought about how Eppy was offline longer than it was working. He was
          sleepy... really sleepy... and at that moment something clicked in my
          head, you know, sleepy, sleppy, Eppy? Like when you yawn and make that
          sound YYYYAAA. And you are Eppying. And that is how Eppy got its name.
          Yeah, I know, really heart-breaking story XD
        </p>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          I really appreciate if you read this whole thing, and I hope you will
          enjoy using Eppy as much as I enjoyed making it. I have many plans for
          the future of Eppy, and I am really excited to share them with you in
          the upcoming months. I am also open to any suggestions and feedback,
          so if you have any ideas or want to share your experience with Eppy,
          feel free to reach out to me on Discord, Twitter or any other
          platform. If you want to you can also leave a tip, I do not mind but I
          would be really pleased for that small support. Thank you for being a
          part of the Eppy community and see you soon!
        </p>
        <p className="text-zinc-300 mt-3 max-w-3xl leading-relaxed">
          Yours sincerely, Paragon, the creator of Eppy.
        </p>
      </section>
    </main>
  );
}
