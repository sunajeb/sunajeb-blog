
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getBlogPostById, updateBlogPost } from '../services/blogService';
import { useToast } from '@/components/ui/use-toast';

const EditBlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  useEffect(() => {
    if (id) {
      const post = getBlogPostById(id);
      if (post) {
        setTitle(post.title);
        setContent(post.content);
      } else {
        navigate('/');
      }
    }
  }, [id, navigate]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }
    
    if (id) {
      const updatedPost = updateBlogPost(id, title, content);
      if (updatedPost) {
        toast({
          title: "Post updated",
          description: "Your blog post has been updated successfully.",
        });
        navigate(`/post/${updatedPost.id}`);
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Post</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Use a blank line between paragraphs for proper formatting.
            </p>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/post/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditBlogPost;
