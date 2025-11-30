
import React, { useState, useEffect } from 'react';
import { User, PricingPackage, PromoCode, AdminProfile, Offer } from '../types';
import * as Storage from '../services/storage';
import { 
  Users, Search, Edit, Trash2, Save, X, Settings, 
  Plus, Calendar, Activity, DollarSign, Tag, Key, Megaphone, CheckCircle
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'PACKAGES' | 'PROMOS' | 'OFFERS' | 'SETTINGS'>('USERS');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [originalEditingId, setOriginalEditingId] = useState<string>(''); // Track ID changes
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // New User State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ 
    name: '', phone: '', email: '', password: '', 
    dob: '', gender: 'MALE', height: '', weight: '' 
  });

  // Data State
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(Storage.getAppConfig().admin);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  // Promo Code Form
  const [newPromo, setNewPromo] = useState({ code: '', discount: '', deadline: '' });
  
  // Offer Form
  const [newOffer, setNewOffer] = useState({ title: '', description: '', showLimit: 3 });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(Storage.getUsers());
    setAdminProfile(Storage.getAppConfig().admin);
    setPackages(Storage.getPackages());
    setPromoCodes(Storage.getPromoCodes());
    setOffers(Storage.getOffers());
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
        Storage.createUser({
            name: newUserForm.name,
            phone: newUserForm.phone,
            email: newUserForm.email,
            password: newUserForm.password,
            dob: newUserForm.dob,
            gender: newUserForm.gender as 'MALE' | 'FEMALE',
            height: Number(newUserForm.height),
            currentWeight: Number(newUserForm.weight)
        });
        setNewUserForm({ name: '', phone: '', email: '', password: '', dob: '', gender: 'MALE', height: '', weight: '' });
        setIsAddUserModalOpen(false);
        refreshData();
    } catch (error: any) {
        alert(error.message);
    }
  };

  const openEditModal = (user: User) => {
      setEditingUser({...user});
      setOriginalEditingId(user.id);
      setIsEditModalOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    // Check if ID changed and handle update
    if (editingUser.id !== originalEditingId) {
        Storage.updateUserWithIdChange(originalEditingId, editingUser);
    } else {
        Storage.updateUser(editingUser);
    }
    
    setIsEditModalOpen(false);
    refreshData();
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this user?')) {
      Storage.deleteUser(id);
      refreshData();
    }
  };

  const handleUpdateAdminProfile = () => {
    Storage.updateAdminProfile(adminProfile);
    alert('Admin profile updated!');
  };

  // --- Package Logic ---
  const handlePackageChange = (idx: number, field: keyof PricingPackage, value: any) => {
    const newPkgs = [...packages];
    if (field === 'features') {
        newPkgs[idx].features = value.split(',').map((s: string) => s.trim());
    } else {
        (newPkgs[idx] as any)[field] = value;
    }
    setPackages(newPkgs);
  };

  const applyPackageToUser = (pkgId: string) => {
      if(!editingUser) return;
      const pkg = packages.find(p => p.id === pkgId);
      if(pkg) {
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + pkg.durationMonths);
          
          setEditingUser({
              ...editingUser,
              subscriptionStart: startDate.toISOString().split('T')[0],
              subscriptionEnd: endDate.toISOString().split('T')[0],
              isActive: true,
              notes: editingUser.notes + `\n[System]: Activated ${pkg.name} on ${new Date().toLocaleDateString()}`
          });
      }
  };

  // --- Promo Code Logic ---
  const handleAddPromo = (e: React.FormEvent) => {
      e.preventDefault();
      Storage.savePromoCode({
          id: Date.now().toString(),
          ...newPromo
      });
      setNewPromo({ code: '', discount: '', deadline: '' });
      refreshData();
  };

  const handleDeletePromo = (id: string) => {
      Storage.deletePromoCode(id);
      refreshData();
  };

  // --- Offer Logic ---
  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    Storage.saveOffer({
        id: Date.now().toString(),
        isActive: true,
        ...newOffer
    });
    setNewOffer({ title: '', description: '', showLimit: 3 });
    refreshData();
  };

  const handleDeleteOffer = (id: string) => {
    Storage.deleteOffer(id);
    refreshData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
            { id: 'USERS', icon: Users, label: 'Clients' },
            { id: 'PACKAGES', icon: DollarSign, label: 'Packages' },
            { id: 'PROMOS', icon: Tag, label: 'Promos' },
            { id: 'OFFERS', icon: Megaphone, label: 'Ad Offers' },
            { id: 'SETTINGS', icon: Settings, label: 'Settings' }
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
            >
                <tab.icon className="mr-2 h-4 w-4" /> {tab.label}
            </button>
        ))}
      </div>

      {activeTab === 'USERS' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search Clients..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 text-white placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsAddUserModalOpen(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center font-medium"
            >
              <Plus className="mr-2 h-5 w-5" /> Add Client
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{user.name}</h3>
                    <div className="text-sm text-cyan-400 font-mono tracking-wider">{user.id}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                  <div className={`h-3 w-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} title={user.isActive ? 'Active' : 'Inactive'} />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-6">
                   <div className="flex items-center"><Activity className="h-3 w-3 mr-1" /> {user.currentWeight}kg</div>
                   <div className="flex items-center"><Activity className="h-3 w-3 mr-1" /> {user.height}cm</div>
                   <div className="flex items-center col-span-2"><Calendar className="h-3 w-3 mr-1" /> {user.subscriptionEnd || 'No Sub'}</div>
                   <div className="flex items-center">Age: {calculateAge(user.dob)}</div>
                   <div className="flex items-center">{user.gender || 'N/A'}</div>
                </div>

                <div className="flex space-x-2">
                  <button onClick={() => openEditModal(user)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg flex justify-center items-center text-sm">
                    <Edit className="h-4 w-4 mr-1" /> Manage
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="bg-slate-800 hover:bg-red-900/50 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'PACKAGES' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Pricing Packages</h3>
                <button onClick={() => Storage.savePackages(packages)} className="flex items-center text-green-400 hover:text-green-300">
                    <Save className="h-5 w-5 mr-1" /> Save All
                </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {packages.map((pkg, idx) => (
                <div key={pkg.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-slate-500">ID: {pkg.id}</span>
                    <button onClick={() => {
                        const newPkgs = [...packages]; newPkgs.splice(idx, 1); setPackages(newPkgs);
                    }} className="text-red-400 hover:text-red-300"><X className="h-4 w-4"/></button>
                  </div>
                  <div className="space-y-3">
                    <input 
                      value={pkg.name} 
                      onChange={(e) => handlePackageChange(idx, 'name', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                      placeholder="Package Name"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                        value={pkg.price} 
                        onChange={(e) => handlePackageChange(idx, 'price', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-400 font-bold"
                        placeholder="Price"
                        />
                         <input 
                        type="number"
                        value={pkg.durationMonths} 
                        onChange={(e) => handlePackageChange(idx, 'durationMonths', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                        placeholder="Months"
                        title="Duration in Months"
                        />
                    </div>
                    
                    <textarea 
                      value={pkg.features.join(', ')} 
                      onChange={(e) => handlePackageChange(idx, 'features', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 text-sm h-20"
                      placeholder="Features (comma separated)"
                    />
                  </div>
                </div>
              ))}
              <button onClick={() => setPackages([...packages, { id: Date.now().toString(), name: 'New Plan', price: '0', durationMonths: 1, features: [] }])} className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-lg flex flex-col items-center justify-center p-8 text-slate-500 hover:text-cyan-500 transition-colors">
                 <Plus className="h-8 w-8 mb-2" />
                 <span>Add Package</span>
              </button>
            </div>
          </div>
      )}

      {activeTab === 'PROMOS' && (
          <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
                  <h3 className="text-xl font-bold text-white mb-4">Generate Code</h3>
                  <form onSubmit={handleAddPromo} className="space-y-4">
                      <input 
                        required
                        type="text" 
                        value={newPromo.code}
                        onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                        placeholder="CODE (e.g. SUMMER24)"
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                      />
                      <input 
                        required
                        type="text" 
                        value={newPromo.discount}
                        onChange={e => setNewPromo({...newPromo, discount: e.target.value})}
                        placeholder="Discount (e.g. 10% or 100)"
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                      />
                      <p className="text-xs text-slate-500">
                          Use <span className="text-cyan-400">10%</span> for percentage off.<br/>
                          Use <span className="text-cyan-400">100</span> for fixed amount (EGY) off.
                      </p>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Deadline</label>
                        <input 
                            required
                            type="date" 
                            value={newPromo.deadline}
                            onChange={e => setNewPromo({...newPromo, deadline: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                        />
                      </div>
                      <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded">
                          Create Code
                      </button>
                  </form>
              </div>

              <div className="md:col-span-2 space-y-4">
                  {promoCodes.map(promo => {
                      const isExpired = new Date(promo.deadline) < new Date();
                      return (
                        <div key={promo.id} className={`flex justify-between items-center p-4 rounded-xl border ${isExpired ? 'bg-red-900/10 border-red-900/30' : 'bg-slate-900 border-slate-800'}`}>
                            <div>
                                <div className="font-bold text-white text-lg flex items-center">
                                    {promo.code}
                                    {isExpired && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">EXPIRED</span>}
                                </div>
                                <div className="text-cyan-400">
                                    {promo.discount.includes('%') ? promo.discount : `${promo.discount} EGY`} OFF
                                </div>
                                <div className="text-xs text-slate-500">Expires: {promo.deadline}</div>
                            </div>
                            <button onClick={() => handleDeletePromo(promo.id)} className="text-slate-500 hover:text-red-400">
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                      );
                  })}
                  {promoCodes.length === 0 && <p className="text-slate-500 text-center py-8">No active promo codes.</p>}
              </div>
          </div>
      )}

      {activeTab === 'OFFERS' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
              <h3 className="text-xl font-bold text-white mb-4">Create Advertisement</h3>
              <form onSubmit={handleAddOffer} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Offer Title</label>
                    <input 
                      required
                      type="text" 
                      value={newOffer.title}
                      onChange={e => setNewOffer({...newOffer, title: e.target.value})}
                      placeholder="e.g. FLASH SALE"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Description</label>
                    <textarea 
                      required
                      value={newOffer.description}
                      onChange={e => setNewOffer({...newOffer, description: e.target.value})}
                      placeholder="Details regarding the offer..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Show Limit (Times per user)</label>
                    <input 
                        required
                        type="number" 
                        min="1"
                        value={newOffer.showLimit}
                        onChange={e => setNewOffer({...newOffer, showLimit: parseInt(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded">
                      Publish Offer
                  </button>
              </form>
            </div>

            <div className="md:col-span-2 grid gap-4">
                {offers.map(offer => (
                   <div key={offer.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                         <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white text-lg">{offer.title}</h4>
                            <button onClick={() => handleDeleteOffer(offer.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="h-4 w-4"/></button>
                         </div>
                         <p className="text-slate-400 text-sm mt-2">{offer.description}</p>
                      </div>
                      <div className="mt-4 flex items-center text-xs text-cyan-500 bg-cyan-950/30 w-fit px-2 py-1 rounded">
                          <Megaphone className="h-3 w-3 mr-1" /> Shown {offer.showLimit} times per user
                      </div>
                   </div>
                ))}
                {offers.length === 0 && <p className="text-slate-500 text-center py-8">No active advertisements running.</p>}
            </div>
          </div>
      )}

      {activeTab === 'SETTINGS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Admin Credentials</h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Admin ID</label>
                    <input 
                        value={adminProfile.id}
                        onChange={e => setAdminProfile({...adminProfile, id: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Phone</label>
                    <input 
                        value={adminProfile.phone}
                        onChange={e => setAdminProfile({...adminProfile, phone: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                </div>
              </div>
              <div>
                    <label className="block text-sm text-slate-400 mb-1">Email</label>
                    <input 
                        value={adminProfile.email}
                        onChange={e => setAdminProfile({...adminProfile, email: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                    />
              </div>
              <div>
                    <label className="block text-sm text-slate-400 mb-1">Password</label>
                    <input 
                        type="text"
                        value={adminProfile.password}
                        onChange={e => setAdminProfile({...adminProfile, password: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                    />
              </div>
              <button onClick={handleUpdateAdminProfile} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg mt-2">
                Update Profile
              </button>
            </div>
          </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Register New Client</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Name</label>
                    <input required type="text" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Phone</label>
                    <input required type="tel" value={newUserForm.phone} onChange={e => setNewUserForm({...newUserForm, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                  </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">Email</label>
                <input required type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs text-slate-500">Password</label>
                    <input required type="text" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                 </div>
                 <div>
                    <label className="text-xs text-slate-500">Date of Birth</label>
                    <input required type="date" value={newUserForm.dob} onChange={e => setNewUserForm({...newUserForm, dob: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                 </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                 <div>
                    <label className="text-xs text-slate-500">Gender</label>
                    <select value={newUserForm.gender} onChange={e => setNewUserForm({...newUserForm, gender: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs text-slate-500">Height (cm)</label>
                    <input required type="number" value={newUserForm.height} onChange={e => setNewUserForm({...newUserForm, height: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                 </div>
                 <div>
                    <label className="text-xs text-slate-500">Weight (kg)</label>
                    <input required type="number" value={newUserForm.weight} onChange={e => setNewUserForm({...newUserForm, weight: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                 </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="flex-1 py-2 text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 p-6 border-b border-slate-800 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-white">Edit Client</h2>
              <button onClick={() => setIsEditModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-6">
              
              {/* Identity Section */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><Key className="mr-2 h-4 w-4 text-cyan-500"/> Identity & Access</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs text-slate-500">ID (Login Code)</label>
                          <input type="text" value={editingUser.id} onChange={e => setEditingUser({...editingUser, id: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono" />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500">Password</label>
                          <input type="text" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono" />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500">Full Name</label>
                          <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500">Email</label>
                          <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500">Phone</label>
                          <input type="tel" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-slate-500">DOB</label>
                            <input type="date" value={editingUser.dob} onChange={e => setEditingUser({...editingUser, dob: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Gender</label>
                            <select value={editingUser.gender} onChange={e => setEditingUser({...editingUser, gender: e.target.value as any})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                            </select>
                        </div>
                      </div>
                  </div>
              </div>

               {/* Physical Stats */}
               <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><Activity className="mr-2 h-4 w-4 text-cyan-500"/> Physical Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs text-slate-500">Height (cm)</label>
                          <input type="number" value={editingUser.height} onChange={e => setEditingUser({...editingUser, height: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500">Current Weight (kg)</label>
                          <input type="number" value={editingUser.currentWeight} onChange={e => setEditingUser({...editingUser, currentWeight: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                      </div>
                  </div>
               </div>

               {/* Subscription */}
               <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><Calendar className="mr-2 h-4 w-4 text-cyan-500"/> Subscription</h3>
                  
                  {/* Package Selector */}
                  <div className="mb-4">
                      <label className="text-xs text-slate-500 mb-1 block">Apply Package (Auto-calculate End Date)</label>
                      <div className="flex gap-2">
                          <select 
                            onChange={(e) => applyPackageToUser(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          >
                              <option value="">Select a package...</option>
                              {packages.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.durationMonths} Months)</option>
                              ))}
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs text-slate-500">Start Date</label>
                          <input type="date" value={editingUser.subscriptionStart || ''} onChange={e => setEditingUser({...editingUser, subscriptionStart: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500">End Date</label>
                          <input type="date" value={editingUser.subscriptionEnd || ''} onChange={e => setEditingUser({...editingUser, subscriptionEnd: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                      </div>
                  </div>
                  <div className="mt-4 flex items-center">
                       <label className="flex items-center cursor-pointer">
                           <input 
                              type="checkbox" 
                              checked={editingUser.isActive} 
                              onChange={e => setEditingUser({...editingUser, isActive: e.target.checked})}
                              className="sr-only peer"
                           />
                           <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                           <span className="ml-3 text-sm font-medium text-white">Subscription Active</span>
                       </label>
                  </div>
               </div>

               {/* Plans */}
               <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-lg font-semibold text-white mb-3">Plans & Notes</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Workout Plan</label>
                          <textarea rows={6} value={editingUser.workoutPlan} onChange={e => setEditingUser({...editingUser, workoutPlan: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono text-sm" />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Diet Plan</label>
                          <textarea rows={6} value={editingUser.dietPlan} onChange={e => setEditingUser({...editingUser, dietPlan: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono text-sm" />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Private Notes</label>
                          <textarea rows={3} value={editingUser.notes} onChange={e => setEditingUser({...editingUser, notes: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white" />
                      </div>
                  </div>
               </div>

               <div className="sticky bottom-0 bg-slate-900 pt-4 pb-0 flex gap-4">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center"><Save className="mr-2 h-5 w-5"/> Save Changes</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
