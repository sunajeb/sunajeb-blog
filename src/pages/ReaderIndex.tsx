
import React from 'react';
import { Link } from 'react-router-dom';
import ReaderLayout from '../components/ReaderLayout';
import { getAllBlogPosts, BlogPost } from '../services/blogService';
import { Separator } from '@/components/ui/separator';

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long'
  }).format(date);
};

const ReaderIndex = () => {
  const blogPosts = getAllBlogPosts();

  return (
    <ReaderLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sunaje Bhushan</h1>
          <p className="text-gray-500">Personal Blog</p>
          <Separator className="mt-4" />
        </div>
        
        {blogPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No blog posts yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {blogPosts.map((post: BlogPost) => (
              <article key={post.id} className="group">
                <div className="flex justify-between items-baseline">
                  <Link to={`/read/post/${post.id}`} className="group-hover:text-gray-600 transition-colors">
                    <h2 className="text-xl font-medium">{post.title}</h2>
                  </Link>
                  <time className="text-sm text-gray-500">
                    {formatDate(post.createdAt)}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </ReaderLayout>
  );
};

export default ReaderIndex;
