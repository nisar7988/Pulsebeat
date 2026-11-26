declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_MUSIC_API_URL?: string;
    readonly EXPO_PUBLIC_MUSIC_API_FALLBACK_URL?: string;
    readonly EXPO_PUBLIC_MUSIC_API_MIRRORS?: string;
    readonly EXPO_PUBLIC_LYRICS_API_URL?: string;
    readonly EXPO_PUBLIC_SHOUTOUT_URL?: string;
    readonly EXPO_PUBLIC_GITHUB_REPO_API?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
