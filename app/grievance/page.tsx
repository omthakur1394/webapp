'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, RefreshCw, AlertTriangle, CheckCircle, LogOut, 
  User, Send, MessageSquare, AlertOctagon, ArrowLeft, Filter, FileText, Check, ArrowRight, Clock
} from 'lucide-react';
import Link from 'next/link';

interface OfficerUser {
  name: string;
  email: string;
  role: string;
  level: number;
  badgeColor: string;
}

export default function GrievancePortalPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [officer, setOfficer] = useState<OfficerUser | null>(null);

  const [tickets, setTickets] = useState<any[]>([]);
  const [pausedOrders, setPausedOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Response inputs
  const [responseInputs, setResponseInputs] = useState<Record<string, string>>({});
  const [filterLevel, setFilterLevel] = useState<number | 'all'>('all');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('shopease_grievance_officer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOfficer(parsed);
      } catch (e) {
        console.error('Failed to parse officer session:', e);
      }
    }
  }, []);

  const fetchTicketsData = async (lvl?: number) => {
    const targetLevel = lvl ?? officer?.level ?? 1;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/grievance/tickets?level=${targetLevel}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setPausedOrders(data.pausedOrders || []);
      }
    } catch (err) {
      console.error('Failed to load grievance data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (officer) {
      fetchTicketsData(officer.level);
    }
  }, [officer]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/grievance/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setOfficer(data.user);
      localStorage.setItem('shopease_grievance_officer', JSON.stringify(data.user));
      setPassword('');
      showToast(`Welcome ${data.user.name} (${data.user.role})!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setOfficer(null);
    localStorage.removeItem('shopease_grievance_officer');
    setTickets([]);
    setPausedOrders([]);
    showToast('Logged out of Grievance Portal.');
  };

  const handleUpdateTicket = async (
    targetId: string, 
    orderId: string | undefined, 
    newStatus: string, 
    newLevel?: number, 
    officerNote?: string
  ) => {
    if (!officer) return;
    try {
      const res = await fetch('/api/grievance/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: targetId,
          order_id: orderId,
          status: newStatus,
          level: newLevel,
          officer_note: officerNote,
          officer_email: officer.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update ticket');

      showToast(`Grievance ticket updated: Status set to ${newStatus}.`);
      if (officerNote) {
        setResponseInputs(prev => ({ ...prev, [targetId]: '' }));
      }
      fetchTicketsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {toast && (
        <div className="fixed bottom-5 right-5 bg-zinc-900 border border-zinc-800 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 text-xs font-bold animate-fadeIn flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Internal Portal Header */}
      <header className="border-b border-zinc-900 bg-zinc-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              ShopEase Internal Grievance & Escalations Operations Dashboard
            </h1>
            <p className="text-[10px] text-zinc-500">Official Grievance Officer & Team Workflow Portal</p>
          </div>
        </div>

        {officer && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold px-3 py-1 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center gap-1.5">
              <User className="w-3 h-3 text-indigo-400" /> {officer.name} ({officer.role})
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg border border-red-500/10 hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer"
              title="Logout Officer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {!officer ? (
          /* Internal Officer Login Screen */
          <div className="max-w-md mx-auto my-12">
            <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 animate-pulse" />
              
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-base font-bold text-white">Grievance Team & Officer Portal</h2>
                <p className="text-[10px] text-zinc-400 mt-1">Sign in with your assigned department email & access password</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold mb-1.5 uppercase tracking-wider">Officer Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. support@shopease.com or grievance.officer@shopease.in"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold mb-1.5 uppercase tracking-wider">Access Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter access password..."
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
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
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Authenticate & Enter Portal'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Grievance Dashboard Queue & Management */
          <div className="space-y-6">
            {/* Officer Banner */}
            <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-600 text-white inline-block mb-1">
                  Active Session: Level {officer.level}
                </span>
                <h2 className="text-base font-extrabold text-white">{officer.name} — {officer.role}</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Authenticated Email: <code className="text-indigo-400 font-mono">{officer.email}</code></p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchTicketsData()}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh Queue</span>
                </button>
              </div>
            </div>

            {/* Main Grievance Queue */}
            <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-850 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    📋 Level {officer.level} Queue — Assigned to {officer.role}
                  </h3>
                  <p className="text-[10px] text-zinc-500">Live complaints routed strictly to Level {officer.level} ({officer.name})</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-400">
                    Active Queue Count: {tickets.length + pausedOrders.length}
                  </span>
                </div>
              </div>

              {/* Tickets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-850 text-zinc-500">
                      <th className="pb-3 font-bold uppercase tracking-wider">Ticket / Order ID</th>
                      <th className="pb-3 font-bold uppercase tracking-wider">Customer / Issue Description</th>
                      <th className="pb-3 font-bold uppercase tracking-wider">Assigned Level</th>
                      <th className="pb-3 font-bold uppercase tracking-wider">Status</th>
                      <th className="pb-3 font-bold uppercase tracking-wider text-right">Officer Response & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {tickets.length === 0 && pausedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-500">No Level {officer.level} grievances currently pending in your queue.</td>
                      </tr>
                    ) : (
                      /* Combine tickets and paused order grievances */
                      [...tickets, ...pausedOrders.map(o => ({
                        _id: o._id,
                        order_id: o.order_id,
                        customer: o.username || 'Customer',
                        message: o.admin_note ? `Order Grievance: ${o.admin_note}` : `Order ${o.order_id} flagged as ${o.status}`,
                        status: o.status === 'Refunded' ? 'Resolved' : o.status,
                        escalation_level: o.escalation_level || officer.level,
                        product_name: o.product_name,
                        price: o.price,
                        created_at: o.created_at,
                        officer_response: o.admin_note || o.officer_response,
                        last_handled_by: o.last_officer || o.last_handled_by
                      }))]
                      .map((tkt, idx) => {
                        const tktLevel = tkt.escalation_level || officer.level;
                        const isResolved = ['Resolved', 'Refunded', 'Rejected', 'Replacement Order Placed', 'Replacement Placed', 'Replaced'].includes(tkt.status);

                        return (
                          <tr key={tkt._id || idx} className="hover:bg-zinc-850/[0.2] transition-all">
                            {/* Order / Ticket ID */}
                            <td className="py-4 font-bold align-top">
                              <div className="font-mono text-indigo-400">{tkt.order_id || tkt._id?.toString().slice(0, 10)}</div>
                              <div className="text-[9px] text-zinc-500 font-normal mt-0.5">
                                {new Date(tkt.created_at || Date.now()).toLocaleString()}
                              </div>
                              {tkt.product_name && (
                                <div className="text-[10px] text-zinc-300 font-medium mt-1">
                                  {tkt.product_name} (₹{Number(tkt.price || 0).toLocaleString('en-IN')})
                                </div>
                              )}
                            </td>

                            {/* Issue Content */}
                            <td className="py-4 align-top max-w-[260px]">
                              <p className="text-zinc-200 font-medium text-xs leading-relaxed line-clamp-3">
                                {tkt.message || tkt.issue || 'Customer submitted order grievance.'}
                              </p>
                              {!isResolved && tkt.officer_response && (
                                <div className="mt-1.5 p-2 bg-indigo-950/40 border border-indigo-800/40 rounded-lg text-[10px] text-indigo-300">
                                  💬 <strong>Officer Note ({tkt.last_handled_by || 'Officer'}):</strong> {tkt.officer_response}
                                </div>
                              )}
                            </td>

                            {/* Escalation Level Badge */}
                            <td className="py-4 align-top">
                              <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                                tktLevel === 4
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : tktLevel === 3
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : tktLevel === 2
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              }`}>
                                Level {tktLevel} Desk
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 align-top">
                              <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                                isResolved
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {isResolved ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                {tkt.status || 'Pending'}
                              </span>
                            </td>

                            {/* Officer Response & Escalation Controls */}
                            <td className="py-4 align-top text-right space-y-3 min-w-[320px]">
                              {isResolved ? (
                                <div className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-3 text-left space-y-2 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5" /> Resolution Completed ({tkt.status})
                                    </span>
                                    <button
                                      onClick={() => handleUpdateTicket(tkt._id, tkt.order_id, 'Pending', tktLevel, undefined)}
                                      className="text-[9.5px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer transition-colors"
                                      title="Reopen ticket to edit resolution options"
                                    >
                                      Reopen Ticket
                                    </button>
                                  </div>

                                  {(tkt.officer_response || tkt.admin_note) ? (
                                    <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                                      💬 <strong className="text-indigo-300 font-semibold">Resolution Note:</strong> {tkt.officer_response || tkt.admin_note}
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-zinc-500 italic">No notes recorded during resolution.</div>
                                  )}

                                  {tkt.last_handled_by && (
                                    <div className="text-[9.5px] text-zinc-500 font-mono text-right">
                                      Handled by: <span className="text-indigo-400">{tkt.last_handled_by}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {/* Large Textarea Box for Officer Notes */}
                                  <div>
                                    <textarea
                                      rows={3}
                                      placeholder="Type official investigation findings, officer resolution notes, or dispatch details..."
                                      value={responseInputs[tkt._id] || ''}
                                      onChange={(e) => setResponseInputs({ ...responseInputs, [tkt._id]: e.target.value })}
                                      className="w-full bg-zinc-950 border border-zinc-800 text-white text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500 font-sans leading-relaxed resize-y min-h-[70px] placeholder:text-zinc-600"
                                    />
                                  </div>

                                  {/* 4 Resolution Options + Escalation Bar */}
                                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    {/* 1. Full Refund */}
                                    <button
                                      onClick={() => handleUpdateTicket(tkt._id, tkt.order_id, 'Refunded', tktLevel, responseInputs[tkt._id])}
                                      className="px-2.5 py-1 bg-emerald-650 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                      title="Process full refund to customer wallet"
                                    >
                                      <span>💳 Full Refund</span>
                                    </button>

                                    {/* 2. Resolved */}
                                    <button
                                      onClick={() => handleUpdateTicket(tkt._id, tkt.order_id, 'Resolved', tktLevel, responseInputs[tkt._id])}
                                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                      title="Mark ticket as resolved"
                                    >
                                      <Check className="w-3 h-3" /> Resolved
                                    </button>

                                    {/* 3. Rejected */}
                                    <button
                                      onClick={() => handleUpdateTicket(tkt._id, tkt.order_id, 'Rejected', tktLevel, responseInputs[tkt._id])}
                                      className="px-2.5 py-1 bg-rose-650 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                      title="Reject grievance claim"
                                    >
                                      <span>❌ Reject Claim</span>
                                    </button>

                                    {/* 4. Replaced / New Order Placed */}
                                    <button
                                      onClick={() => handleUpdateTicket(tkt._id, tkt.order_id, 'Replacement Order Placed', tktLevel, responseInputs[tkt._id])}
                                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                      title="Dispatch replacement item / new order"
                                    >
                                      <span>📦 Replacement Placed</span>
                                    </button>

                                    {/* Escalation Button */}
                                    {officer.level < 4 && (
                                      <button
                                        onClick={() => handleUpdateTicket(tkt._id, tkt.order_id, `Escalated to Level ${officer.level + 1}`, officer.level + 1, responseInputs[tkt._id])}
                                        className="px-2.5 py-1 bg-purple-650 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                        title={`Escalate to Level ${officer.level + 1}`}
                                      >
                                        <span>Escalate ➔ L{officer.level + 1}</span>
                                        <ArrowRight className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
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
          </div>
        )}
      </main>
    </div>
  );
}
