
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getAllBlogPosts, BlogPost } from '../services/blogService';

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const Index = () => {
  const blogPosts = getAllBlogPosts();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Recent Posts</h1>
        
        {blogPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No blog posts yet.</p>
            <Link 
              to="/new" 
              className="inline-block px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Create Your First Post
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {blogPosts.map((post: BlogPost) => (
              <article key={post.id} className="border-b border-gray-200 pb-8">
                <Link to={`/post/${post.id}`}>
                  <h2 className="text-2xl font-bold mb-2 hover:text-gray-600 transition-colors">{post.title}</h2>
                </Link>
                <time className="text-sm text-gray-500 mb-4 block">
                  {formatDate(post.createdAt)}
                </time>
                <p className="text-gray-700 line-clamp-3">
                  {post.content.substring(0, 200)}...
                </p>
                <div className="mt-4">
                  <Link 
                    to={`/post/${post.id}`} 
                    className="text-black font-medium hover:underline"
                  >
                    Read more
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
