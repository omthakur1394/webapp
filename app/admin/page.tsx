'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, RefreshCw, AlertTriangle, CheckCircle, LogOut, MapPin, Clock, Plus, 
  AlertOctagon, ArrowLeft, Pause, Play, Edit3, Trash2, Check, X, MessageSquare, Send
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [admin, setAdmin] = useState<{ region: string; token: string } | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Edit / Order Note States
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [orderNoteInputs, setOrderNoteInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('shopease_admin');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAdmin(parsed);
      } catch (e) {
        console.error('Failed to parse admin session:', e);
      }
    }
  }, []);

  const fetchDashboardData = async (region: string) => {
    setRefreshing(true);
    try {
      const ordersRes = await fetch('/api/admin/orders');
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data);
      }

      const notesRes = await fetch(`/api/admin/notes?region=${encodeURIComponent(region)}`);
      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchDashboardData(admin.region);
    }
  }, [admin]);

  const showToastMessage = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAdmin(data);
      localStorage.setItem('shopease_admin', JSON.stringify(data));
      setPassword('');
      showToastMessage(`Logged in successfully as ${data.region} Admin!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAdmin(null);
    localStorage.removeItem('shopease_admin');
    setOrders([]);
    setNotes([]);
    showToastMessage('Logged out successfully.');
  };

  const handleOrderAction = async (orderId: string, action: 'pause' | 'resume' | 'hold', adminNote?: string) => {
    if (!admin) return;
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          region: admin.region,
          action,
          admin_note: adminNote
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      const actionText = action === 'pause' ? 'paused' : action === 'resume' ? 'resumed' : 'put on hold';
      showToastMessage(`Order ${orderId} has been ${actionText} in MongoDB.`);
      
      if (adminNote) {
        setOrderNoteInputs(prev => ({ ...prev, [orderId]: '' }));
      }
      
      fetchDashboardData(admin.region);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin || !newNote.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: admin.region,
          note: newNote
        })
      });
      if (res.ok) {
        setNewNote('');
        showToastMessage('Hub note saved to MongoDB.');
        fetchDashboardData(admin.region);
      }
    } catch (err) {
      console.error('Failed to submit hub note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleSaveEditNote = async (noteId: string) => {
    if (!editingNoteText.trim()) return;
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: noteId,
          note: editingNoteText
        })
      });
      if (res.ok) {
        showToastMessage('Message updated in MongoDB.');
        setEditingNoteId(null);
        setEditingNoteText('');
        if (admin) fetchDashboardData(admin.region);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update message');
      }
    } catch (err: any) {
      alert('Error updating note: ' + err.message);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this message from MongoDB?')) return;
    try {
      const res = await fetch(`/api/admin/messages?id=${encodeURIComponent(noteId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToastMessage('Message deleted from MongoDB.');
        if (admin) fetchDashboardData(admin.region);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete message');
      }
    } catch (err: any) {
      alert('Error deleting note: ' + err.message);
    }
  };

  if (!mounted) return null;

  const getOrderRegion = (order: any) => {
    if (order.hub_region && order.hub_region !== 'General Hub') {
      if (order.hub_region.toLowerCase().includes('mumbai')) return 'Mumbai';
      if (order.hub_region.toLowerCase().includes('nagpur')) return 'Nagpur';
    }
    const addr = (order.shipping_address || '').toLowerCase();
    if (addr.includes('mumbai')) return 'Mumbai';
    if (addr.includes('nagpur')) return 'Nagpur';
    return 'Other';
  };

  const totalOrders = orders.length;
  const regionalOrders = orders.filter(o => getOrderRegion(o) === admin?.region || admin?.region === 'Super');
  const pausedOrders = regionalOrders.filter(o => o.status === 'Paused' || o.status === 'On Hold').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {toast && (
        <div className="fixed bottom-5 right-5 bg-zinc-900 border border-zinc-800 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 text-xs font-bold animate-fadeIn flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <header className="border-b border-zinc-900 bg-zinc-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              📦 ShopEase Admin Control Portal
            </h1>
            <p className="text-[10px] text-zinc-500">Order Pause/Resume & MongoDB System Note Administration</p>
          </div>
        </div>
        {admin && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold px-2.5 py-1 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {admin.region} Hub Admin
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg border border-red-500/10 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {!admin ? (
          <div className="max-w-md mx-auto my-16">
            <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse" />
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-base font-bold text-white">Hub Administrator Login</h2>
                <p className="text-[10px] text-zinc-500 mt-1">Enter password credential (e.g. nagpur123, mumbai123, admin123)</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold mb-1.5 uppercase tracking-wider">Access Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password..."
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4.5 py-3 text-xs outline-none focus:border-indigo-500 transition-all text-center tracking-widest placeholder:tracking-normal"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-indigo-600/15 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Enter Dashboard'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-850 p-4.5 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">System Orders</span>
                  <div className="text-xl font-black mt-1 text-white">{totalOrders}</div>
                </div>
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/15">
                  <Clock className="w-4 h-4 text-indigo-400" />
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-850 p-4.5 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Hub Regional ({admin.region})</span>
                  <div className="text-xl font-black mt-1 text-white">{regionalOrders.length}</div>
                </div>
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/15">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-850 p-4.5 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Paused / Held Orders ({admin.region})</span>
                  <div className="text-xl font-black mt-1 text-amber-500">{pausedOrders}</div>
                </div>
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/15">
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Controls Table (Pause / Resume / Admin Notes) */}
              <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl shadow-lg flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      📋 Order Fulfillment & Pause/Resume Control
                    </h2>
                    <p className="text-[10px] text-zinc-500">Pause orders, resume operations, and record system notes in MongoDB</p>
                  </div>
                  <button
                    onClick={() => fetchDashboardData(admin.region)}
                    className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                    title="Refresh List"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-850 text-zinc-500">
                        <th className="pb-3 font-bold uppercase tracking-wider">Order ID</th>
                        <th className="pb-3 font-bold uppercase tracking-wider">Item Details</th>
                        <th className="pb-3 font-bold uppercase tracking-wider">Status</th>
                        <th className="pb-3 font-bold uppercase tracking-wider text-right">Pause / Resume / Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-zinc-500">No orders found in MongoDB database.</td>
                        </tr>
                      ) : (
                        orders.map((order) => {
                          const orderRegion = getOrderRegion(order);
                          const isRegional = orderRegion === admin.region || admin.region === 'Super';
                          const isPaused = order.status === 'Paused' || order.status === 'On Hold';

                          return (
                            <tr key={order._id} className="hover:bg-zinc-850/[0.15] transition-all">
                              <td className="py-4 font-bold text-white align-top">
                                <div className="font-mono text-indigo-400">{order.order_id}</div>
                                <div className="text-[9px] text-zinc-500 font-normal mt-0.5">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </div>
                                {order.admin_note && (
                                  <div className="mt-1 text-[9.5px] p-1.5 bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 rounded-md max-w-[160px]">
                                    📌 <strong>Note:</strong> {order.admin_note}
                                  </div>
                                )}
                              </td>

                              <td className="py-4 align-top">
                                <div className="font-semibold line-clamp-1 max-w-[180px]">{order.product_name}</div>
                                <div className="text-[10px] text-zinc-400 mt-0.5">₹{Number(order.price).toLocaleString('en-IN')}</div>
                                <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isRegional
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                  {orderRegion} Region
                                </span>
                              </td>

                              <td className="py-4 align-top">
                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                  order.status === 'Delivered'
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    : order.status === 'Placed'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : isPaused
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}>
                                  {isPaused ? <Pause className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
                                  {order.status}
                                </span>
                              </td>

                              <td className="py-4 text-right align-top space-y-2">
                                {isRegional ? (
                                  <div className="flex flex-col items-end gap-1.5">
                                    <div className="flex items-center gap-1.5">
                                      {isPaused ? (
                                        <button
                                          onClick={() => handleOrderAction(order.order_id, 'resume')}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-700/15"
                                          title="Resume order fulfillment"
                                        >
                                          <Play className="w-3 h-3 fill-current" /> Resume Order
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleOrderAction(order.order_id, 'pause')}
                                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-amber-700/15"
                                          title="Pause order fulfillment"
                                        >
                                          <Pause className="w-3 h-3" /> Pause Order
                                        </button>
                                      )}
                                    </div>

                                    {/* Inline Admin Note input for Order */}
                                    <div className="flex items-center gap-1 mt-1">
                                      <input
                                        type="text"
                                        placeholder="Add system note..."
                                        value={orderNoteInputs[order.order_id] || ''}
                                        onChange={(e) => setOrderNoteInputs({ ...orderNoteInputs, [order.order_id]: e.target.value })}
                                        className="bg-zinc-950 border border-zinc-800 text-white text-[10px] rounded-md px-2 py-1 outline-none focus:border-indigo-500 w-[120px]"
                                      />
                                      <button
                                        onClick={() => {
                                          const note = orderNoteInputs[order.order_id];
                                          if (note?.trim()) {
                                            handleOrderAction(order.order_id, isPaused ? 'pause' : 'resume', note);
                                          }
                                        }}
                                        className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[10px] cursor-pointer"
                                        title="Save Note to MongoDB"
                                      >
                                        <Send className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-zinc-600 italic font-semibold">
                                    Restricted to {orderRegion}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* System Notes & Messages (Edit / Delete in MongoDB) */}
              <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl shadow-lg flex flex-col space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    💬 System & Hub Messages
                  </h2>
                  <p className="text-[10px] text-zinc-500">Log, edit, or delete operational system notes directly in MongoDB</p>
                </div>

                <form onSubmit={handleAddNote} className="space-y-3">
                  <textarea
                    required
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter new system note message..."
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white text-xs rounded-xl p-3 outline-none focus:border-indigo-500 transition-all resize-none placeholder-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !newNote.trim()}
                    className="w-full bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs py-2 rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submittingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add System Note to MongoDB
                  </button>
                </form>

                <div className="flex-1 flex flex-col min-h-[220px] space-y-3">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Saved System Notes ({notes.length})</h3>
                  <div className="overflow-y-auto max-h-[320px] space-y-3 pr-1">
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-zinc-500">No system messages logged.</div>
                    ) : (
                      notes.map((log) => {
                        const isEditing = editingNoteId === log._id;

                        return (
                          <div
                            key={log._id}
                            className="p-3 border border-zinc-850 bg-zinc-950/50 rounded-xl space-y-2 transition-all hover:border-zinc-800"
                          >
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingNoteText}
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg p-2 outline-none focus:border-indigo-500 resize-none"
                                  rows={2}
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingNoteId(null)}
                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold flex items-center gap-1"
                                  >
                                    <X className="w-3 h-3" /> Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveEditNote(log._id)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" /> Save to MongoDB
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-xs text-zinc-200 leading-relaxed font-medium">{log.note || log.content}</p>
                                <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-1 border-t border-zinc-900">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-zinc-500" />
                                    <span>{new Date(log.created_at || Date.now()).toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        setEditingNoteId(log._id);
                                        setEditingNoteText(log.note || log.content || '');
                                      }}
                                      className="p-1 hover:bg-zinc-800 text-indigo-400 hover:text-indigo-300 rounded transition-colors"
                                      title="Edit Message in MongoDB"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteNote(log._id)}
                                      className="p-1 hover:bg-zinc-800 text-red-400 hover:text-red-300 rounded transition-colors"
                                      title="Delete Message from MongoDB"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
