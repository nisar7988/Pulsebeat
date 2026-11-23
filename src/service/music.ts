import MUSIC_ENDPOINT from "../config/api";

export const getSongBySearch = async (songName: string) => {
    const response = await fetch(MUSIC_ENDPOINT.replace("{songName}", songName), {
        method: "GET",
    })
    const result = await response.json();
    return result;
}
export default getSongBySearch