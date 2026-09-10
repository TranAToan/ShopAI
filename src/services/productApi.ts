export type PostItem = {
  id: number;
  title: string;
  body: string;
};

export async function fetchSamplePosts(): Promise<PostItem[]> {
  const response = await fetch(
    'https://jsonplaceholder.typicode.com/posts?_limit=10',
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
