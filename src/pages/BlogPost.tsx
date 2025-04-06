
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getBlogPostById, deleteBlogPost } from '../services/blogService';
import { useToast } from '@/components/ui/use-toast';

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const post = id ? getBlogPostById(id) : undefined;
  
  if (!post) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <p className="text-gray-500 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/" 
            className="inline-block px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </Layout>
    );
  }
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      if (id && deleteBlogPost(id)) {
        toast({
          title: "Post deleted",
          description: "The blog post has been successfully deleted.",
        });
        navigate('/');
      }
    }
  };

  return (
    <Layout>
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
        
        <div className="mt-10 pt-6 border-t border-gray-200 flex justify-between">
          <Link 
            to="/" 
            className="text-black font-medium hover:underline"
          >
            ← Back to all posts
          </Link>
          
          <div className="space-x-4">
            <Link 
              to={`/edit/${post.id}`} 
              className="text-black font-medium hover:underline"
            >
              Edit
            </Link>
            <button 
              onClick={handleDelete}
              className="text-red-600 font-medium hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
