import React, { useState } from 'react';
import ManageAdhkarCategories from './ManageAdhkarCategories';
import ManageAdhkarItems from './ManageAdhkarItems';

interface ManageAdhkarProps {
  token?: string;
  onTokenUpdate?: (newToken: string) => void;
}

const ManageAdhkar: React.FC<ManageAdhkarProps> = ({ token, onTokenUpdate }) => {
  const [activeTab, setActiveTab] = useState<'adhkar' | 'categories'>('adhkar');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCategoryChange = () => {
    // Trigger refresh of adhkar items when categories change
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="text-white">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-xl font-semibold">إدارة الأذكار</h2>
        <div className="flex items-center gap-2">
          <button
            className={`px-4 py-2 ${activeTab === 'adhkar' ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'} transition-all duration-300 rounded-lg`}
            onClick={() => setActiveTab('adhkar')}
          >
            الأذكار
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'categories' ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'} transition-all duration-300 rounded-lg`}
            onClick={() => setActiveTab('categories')}
          >
            التصنيفات
          </button>
        </div>
      </div>

      {activeTab === 'categories' ? (
        <ManageAdhkarCategories 
          token={token} 
          onTokenUpdate={onTokenUpdate} 
          onCategoryChange={handleCategoryChange}
          hideTitle={true}
        />
      ) : (
        <ManageAdhkarItems
          token={token}
          onTokenUpdate={onTokenUpdate}
          refreshTrigger={refreshTrigger}
          hideTitle={true}
        />
      )}
    </div>
  );
};

export default ManageAdhkar; 