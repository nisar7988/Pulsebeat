export interface LanguageOption {
  id: string;
  name: string;
  nativeName: string;
}

export interface GenreOption {
  id: string;
  canonical: string;
  name: string;
  icon: string;
  gradient: [string, string];
}

export interface ArtistOption {
  id: string;
  name: string;
  genre?: string;
  role?: string;
  avatar: string;
}

export const LANGUAGES: LanguageOption[] = [
  { id: 'english', name: 'English', nativeName: 'English' },
  { id: 'hindi', name: 'Hindi', nativeName: 'हिन्दी' },
  { id: 'punjabi', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { id: 'spanish', name: 'Spanish', nativeName: 'Español' },
  { id: 'korean', name: 'Korean', nativeName: '한국어' },
  { id: 'japanese', name: 'Japanese', nativeName: '日本語' },
  { id: 'tamil', name: 'Tamil', nativeName: 'தமிழ்' },
  { id: 'telugu', name: 'Telugu', nativeName: 'తెలుగు' },
  { id: 'french', name: 'French', nativeName: 'Français' },
  { id: 'german', name: 'German', nativeName: 'Deutsch' },
  { id: 'arabic', name: 'Arabic', nativeName: 'العربية' },
  { id: 'bengali', name: 'Bengali', nativeName: 'বাংলা' },
];

export const GENRES: GenreOption[] = [
  { id: 'pop', canonical: 'Pop', name: 'Pop Hits', icon: 'music', gradient: ['#EC4899', '#8B5CF6'] },
  { id: 'hiphop', canonical: 'Hip-Hop', name: 'Hip Hop & Rap', icon: 'disc', gradient: ['#F59E0B', '#EF4444'] },
  { id: 'electronic', canonical: 'Electronic', name: 'EDM / Dance', icon: 'zap', gradient: ['#22D3EE', '#6366F1'] },
  { id: 'rock', canonical: 'Rock', name: 'Rock & Alt', icon: 'activity', gradient: ['#EF4444', '#7C3AED'] },
  { id: 'rnb', canonical: 'R&B', name: 'R&B & Soul', icon: 'heart', gradient: ['#A855F7', '#EC4899'] },
  { id: 'lofi', canonical: 'Lo-Fi', name: 'Chill & Lo-Fi', icon: 'headphones', gradient: ['#06B6D4', '#3B82F6'] },
  { id: 'bollywood', canonical: 'Bollywood', name: 'Bollywood Hits', icon: 'star', gradient: ['#F43F5E', '#FB923C'] },
  { id: 'indie', canonical: 'Indie', name: 'Indie & Folk', icon: 'feather', gradient: ['#10B981', '#06B6D4'] },
  { id: 'latin', canonical: 'Latin', name: 'Latin Reggaeton', icon: 'radio', gradient: ['#EA580C', '#E11D48'] },
  { id: 'classical', canonical: 'Classical', name: 'Classical & Piano', icon: 'volume-2', gradient: ['#6366F1', '#A855F7'] },
  { id: 'jazz', canonical: 'Jazz', name: 'Jazz & Blues', icon: 'coffee', gradient: ['#D97706', '#B45309'] },
  { id: 'metal', canonical: 'Metal', name: 'Metal & Heavy', icon: 'shield', gradient: ['#475569', '#1E293B'] },
];

export const ARTISTS: ArtistOption[] = [
  {
    id: 'the-weeknd',
    name: 'The Weeknd',
    genre: 'R&B / Pop',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300',
  },
  {
    id: 'taylor-swift',
    name: 'Taylor Swift',
    genre: 'Pop / Country',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
  },
  {
    id: 'arijit-singh',
    name: 'Arijit Singh',
    genre: 'Bollywood / Soul',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
  },
  {
    id: 'drake',
    name: 'Drake',
    genre: 'Hip Hop / Rap',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
  },
  {
    id: 'dua-lipa',
    name: 'Dua Lipa',
    genre: 'Disco Pop',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
  },
  {
    id: 'diljit-dosanjh',
    name: 'Diljit Dosanjh',
    genre: 'Punjabi Pop',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
  },
  {
    id: 'billie-eilish',
    name: 'Billie Eilish',
    genre: 'Alt Pop',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
  },
  {
    id: 'bts',
    name: 'BTS',
    genre: 'K-Pop',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300',
  },
  {
    id: 'ed-sheeran',
    name: 'Ed Sheeran',
    genre: 'Acoustic / Pop',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300',
  },
  {
    id: 'bad-bunny',
    name: 'Bad Bunny',
    genre: 'Latin Trap',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
  },
  {
    id: 'post-malone',
    name: 'Post Malone',
    genre: 'Pop / Rock',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300',
  },
  {
    id: 'olivia-rodrigo',
    name: 'Olivia Rodrigo',
    genre: 'Pop Rock',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
  },
];
