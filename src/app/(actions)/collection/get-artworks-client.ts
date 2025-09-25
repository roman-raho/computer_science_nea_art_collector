export async function fetchArtworksClient() {
  const { getArtworks } = await import(
    "@/app/(actions)/collection/get-artworks"
  );
  const result = await getArtworks();
  if (!result.success) {
    throw new Error(result.error || "Failed to fetch artworks");
  }
  return result.artworks;
}
