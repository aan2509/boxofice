"use client";

import { WatchPlayer } from "@/components/movie/watch-player";

type VideoPlayerProps = {
  sourceUrl: string;
  poster?: string | null;
  title: string;
};

export function VideoPlayer({ sourceUrl, poster }: VideoPlayerProps) {
  return <WatchPlayer sourceUrl={sourceUrl} poster={poster} />;
}
