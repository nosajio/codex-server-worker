const handleDefaultRoute = req => {
  return new Response(
    'Use /posts/:slug to access individual posts, and /posts to see all posts',
  );
}

export default handleDefaultRoute