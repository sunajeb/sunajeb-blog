
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import ReaderLayout from '../components/ReaderLayout';
import { getBlogPostById } from '../services/blogService';

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const ReaderBlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const post = id ? getBlogPostById(id) : undefined;
  
  if (!post) {
    return (
      <ReaderLayout>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <p className="text-gray-500 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/read" 
            className="inline-block px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </ReaderLayout>
    );
  }

  return (
    <ReaderLayout>
      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          <time className="text-sm text-gray-500 block">
            {formatDate(post.createdAt)}
          </time>
        </header>
        
        <div className="prose max-w-none">
          {post.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-800 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        
        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link 
            to="/read" 
            className="text-black font-medium hover:underline"
          >
            ← Back to all posts
          </Link>
        </div>
      </article>
    </ReaderLayout>
  );
};

export default ReaderBlogPost;
