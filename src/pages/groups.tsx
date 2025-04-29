import React, { useState } from 'react';
import { Plus, Users, DollarSign, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGroups, createGroup } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function Groups() {
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const queryClient = useQueryClient();
  const { data: groups, isLoading } = useQuery({ 
    queryKey: ['groups'], 
    queryFn: getGroups 
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      createGroup(data.name, data.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setShowNewGroupForm(false);
      setNewGroupName('');
      setNewGroupDescription('');
      toast.success('Group created successfully');
    },
    onError: () => {
      toast.error('Failed to create group');
    },
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    createGroupMutation.mutate({
      name: newGroupName.trim(),
      description: newGroupDescription.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Your Groups</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your shared expenses with friends and family
          </p>
        </div>
        <button
          onClick={() => setShowNewGroupForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Group
        </button>
      </div>

      {showNewGroupForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Create New Group</h3>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Group Name
              </label>
              <input
                type="text"
                id="name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNewGroupForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createGroupMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : groups?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No groups found. Create your first group to get started!
          </div>
        ) : (
          groups?.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                {group.description && (
                  <p className="mt-2 text-sm text-gray-500">{group.description}</p>
                )}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    {group.group_members?.length || 0} members
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Created {new Date(group.created_at || '').toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}