import React, { useState } from 'react';
import {
  Car,
  Bike,
  Wallet,
  Star,
  CheckCircle2,
  Power,
  TrendingUp,
  MapPin,
  MessageSquare,
  Phone,
  ArrowRight,
  UserCheck,
  Send,
  X,
  Plus
} from 'lucide-react';
import {
  DriverProfile,
  OrderDetails,
  ChatMessage,
  WalletTransaction
} from '../types';

interface DriverAppProps {
  driver: DriverProfile | null;
  activeOrder: OrderDetails | null;
  chatMessages: ChatMessage[];
  onRegisterDriver: (profile: DriverProfile) => void;
  onUpdateDriver: (updated: DriverProfile) => void;
  onAcceptOrder: (driverId: string) => void;
  onDeclineOrder: () => void;
  onUpdateOrderStatus: (status: OrderDetails['status']) => void;
  onAddChatMessage: (msg: string) => void;
  onAddTransaction: (tx: WalletTransaction) => void;
}

export default function DriverApp({
  driver,
  activeOrder,
  chatMessages,
  onRegisterDriver,
  onUpdateDriver,
  onAcceptOrder,
  onDeclineOrder,
  onUpdateOrderStatus,
  onAddChatMessage,
  onAddTransaction,
}: DriverAppProps) {
  // Registration form states
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVehicleType, setRegVehicleType] = useState<'motor' | 'mobil'>('motor');
  const [regVehicleName, setRegVehicleName] = useState('');
  const [regPlate, setRegPlate] = useState('');

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallet'>('dashboard');

  // Chat window open
  const [showChat, setShowChat] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');

  // Withdrawal modal state
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('100000');

  // Trigger registration submit
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regVehicleName || !regPlate) {
      alert('⚠️ Mohon lengkapi semua data pendaftaran mitra pengemudi JekExpress.');
      return;
    }

    const newDriver: DriverProfile = {
      uid: `drv-${Date.now().toString().slice(-4)}`,
      name: regName,
      phone: regPhone,
      email: `${regName.toLowerCase().replace(/\s+/g, '')}@jekexpress.com`,
      avatar: regVehicleType === 'motor'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80',
      vehicleType: regVehicleType,
      vehiclePlate: regPlate,
      vehicleName: regVehicleName,
      rating: 5.0,
      totalRatings: 0,
      isOnline: true,
      walletBalance: 0,
      status: 'idle',
      currentLocation: { x: 45, y: 45 } as any, // initial grid coords
    };

    onRegisterDriver(newDriver);
  };

  // Withdraw simulation
  const handleWithdraw = () => {
    if (!driver) return;
    const amount = parseInt(withdrawAmount) || 0;
    if (amount <= 0 || amount > driver.walletBalance) {
      alert('⚠️ Saldo Anda tidak mencukupi untuk penarikan ini.');
      return;
    }

    onUpdateDriver({
      ...driver,
      walletBalance: driver.walletBalance - amount,
    });

    onAddTransaction({
      id: `wd-${Date.now().toString().slice(-5)}`,
      type: 'withdrawal',
      amount,
      description: `Penarikan Dana Dompet Mitra Ke Rekening Bank`,
      timestamp: new Date().toLocaleDateString('id-ID'),
    });

    setShowWithdraw(false);
    alert(`✓ Penarikan dana sebesar Rp ${amount.toLocaleString('id-ID')} berhasil diajukan!`);
  };

  // Check if there is an incoming order waiting to be accepted by this online driver
  const isCompatibleIncomingOrder =
    activeOrder &&
    activeOrder.status === 'searching' &&
    driver &&
    driver.isOnline &&
    driver.status === 'idle' &&
    ((driver.vehicleType === 'motor' && (activeOrder.serviceType === 'jekride' || activeOrder.serviceType === 'jekfood' || activeOrder.serviceType === 'jeksend')) ||
     (driver.vehicleType === 'mobil' && (activeOrder.serviceType === 'jekcar' || activeOrder.serviceType === 'jekcargo')));

  return (
    <div id="driver-phone" className="w-full h-[650px] bg-slate-50 rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col font-sans">
      
      {/* Top iOS/Android Status Notch */}
      <div className="w-full bg-slate-100 pt-3 pb-2 px-6 flex justify-between items-center text-[10px] text-slate-500 font-mono select-none z-30 shrink-0 border-b border-slate-200/50">
        <span className="font-bold">09:41</span>
        <div className="w-20 h-3.5 bg-slate-200 rounded-full flex items-center justify-center text-[8px] font-sans text-orange-brand font-extrabold tracking-wider">
          MITRA DRIVER
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold">LTE</span>
          <div className="w-4 h-2 bg-slate-400 rounded-sm"></div>
        </div>
      </div>

      {/* RENDER PATH 1: DRIVER REGISTRATION / LOGIN */}
      {!driver ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-center space-y-1 mt-3">
            <h2 className="text-lg font-extrabold text-slate-800">Gabung Mitra JekExpress</h2>
            <p className="text-[10px] text-slate-400 font-medium">Pendaftaran pengemudi ojek online roda 2 & roda 4 modern</p>
          </div>

          <form onSubmit={handleRegister} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3.5 text-left">
            <div>
              <label className="text-[9px] text-slate-400 uppercase font-bold">Nama Lengkap Sesuai KTP</label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full mt-1 bg-white text-xs text-slate-800 rounded-lg border border-slate-200 p-2.5 focus:border-orange-brand outline-none shadow-sm"
                required
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-400 uppercase font-bold">Nomor WhatsApp Aktif</label>
              <input
                type="tel"
                placeholder="Contoh: 0812-xxxx-xxxx"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full mt-1 bg-white text-xs text-slate-800 rounded-lg border border-slate-200 p-2.5 focus:border-orange-brand outline-none shadow-sm"
                required
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-400 uppercase font-bold">Jenis Kendaraan Operasional</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setRegVehicleType('motor')}
                  className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    regVehicleType === 'motor' ? 'border-orange-brand bg-orange-brand/10 text-orange-brand' : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Bike size={14} /> Roda 2 (Motor)
                </button>
                <button
                  type="button"
                  onClick={() => setRegVehicleType('mobil')}
                  className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    regVehicleType === 'mobil' ? 'border-orange-brand bg-orange-brand/10 text-orange-brand' : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Car size={14} /> Roda 4 (Mobil)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 uppercase font-bold">Merek & Model Kendaraan</label>
              <input
                type="text"
                placeholder="Contoh: Honda Vario 150 / Toyota Avanza"
                value={regVehicleName}
                onChange={(e) => setRegVehicleName(e.target.value)}
                className="w-full mt-1 bg-white text-xs text-slate-800 rounded-lg border border-slate-200 p-2.5 focus:border-orange-brand outline-none shadow-sm"
                required
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-400 uppercase font-bold">Nomor Plat Polisi Kendaraan</label>
              <input
                type="text"
                placeholder="Contoh: B 4321 STO"
                value={regPlate}
                onChange={(e) => setRegPlate(e.target.toUpperCase())}
                className="w-full mt-1 bg-white text-xs text-slate-800 rounded-lg border border-slate-200 p-2.5 focus:border-orange-brand outline-none shadow-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-brand hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all pt-3 shadow-md uppercase tracking-wider"
            >
              <UserCheck size={16} /> Daftar Mitra Driver Sekarang
            </button>
          </form>
        </div>
      ) : (
        /* RENDER PATH 2: ONLINE DRIVER DASHBOARD & ACTIVE JOBS */
        <div className="flex-1 overflow-y-auto pb-16 relative">
          
          {/* Dashboard Header Bar */}
          <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between z-20 shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <img
                src={driver.avatar}
                alt={driver.name}
                className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  {driver.name}
                  <span className="text-[9px] text-amber-500 flex items-center font-bold">
                    ★ {driver.rating}
                  </span>
                </h4>
                <p className="text-[8px] text-slate-400 uppercase font-mono mt-0.5">{driver.vehicleName} • {driver.vehiclePlate}</p>
              </div>
            </div>

            {/* Online state toggle button */}
            <button
              onClick={() => onUpdateDriver({ ...driver, isOnline: !driver.isOnline })}
              className={`p-2 rounded-xl flex items-center justify-center border transition-all ${
                driver.isOnline
                  ? 'border-emerald-500/30 bg-emerald-50 text-emerald-600'
                  : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Power size={14} className={driver.isOnline ? 'animate-pulse' : ''} />
            </button>
          </div>

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="p-4 space-y-4">
              
              {/* Online indicator panel */}
              <div className={`p-3 rounded-2xl border text-xs flex justify-between items-center shadow-sm ${
                driver.isOnline
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}>
                <span className="font-semibold">Status Ketersediaan Driver</span>
                <span className="font-bold uppercase tracking-wider text-[9px] px-2.5 py-1 rounded-full bg-white/80 shadow-sm">
                  {driver.isOnline ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-left">
                  <span className="text-[8px] text-slate-400 uppercase font-bold block">Poin Hari Ini</span>
                  <span className="text-sm font-extrabold text-slate-800 block mt-1">120 Poin</span>
                  <span className="text-[8px] text-slate-500">Target Bonus: 200 Poin</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-left">
                  <span className="text-[8px] text-slate-400 uppercase font-bold block">Pendapatan Bersih</span>
                  <span className="text-sm font-extrabold text-orange-brand block mt-1">
                    Rp {driver.walletBalance.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[8px] text-slate-500">Saldo Dompet Driver</span>
                </div>
              </div>

              {/* ACTIVE ORDER FLOW PANEL */}
              {activeOrder && activeOrder.driverId === driver.uid ? (
                <div className="bg-white rounded-2xl border border-orange-brand/20 p-4 space-y-3.5 text-left relative overflow-hidden shadow-md">
                  
                  {/* Glowing background hint */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-brand/5 rounded-full blur-xl -z-10"></div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-[8px] font-bold text-orange-brand bg-orange-brand/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Tugas Aktif ({activeOrder.serviceType.toUpperCase()})
                      </span>
                      <p className="text-slate-800 text-xs font-bold mt-1">Order ID: {activeOrder.id}</p>
                    </div>
                    <span className="text-[9px] text-orange-brand font-bold capitalize bg-orange-brand/10 px-2 py-0.5 rounded-md">{activeOrder.status}</span>
                  </div>

                  {/* Route points */}
                  <div className="space-y-2 text-[10px]">
                    <div className="flex gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[8px] shrink-0 shadow-sm">A</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] text-slate-400 uppercase font-bold">Jemput Pelanggan / Merchant</p>
                        <p className="text-slate-800 font-bold truncate">{activeOrder.pickupAddress}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-brand flex items-center justify-center font-bold text-[8px] shrink-0 shadow-sm">B</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] text-slate-400 uppercase font-bold">Antar Ke Tujuan</p>
                        <p className="text-slate-800 font-bold truncate">{activeOrder.dropoffAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Service Specific details */}
                  {activeOrder.serviceType === 'jekfood' && activeOrder.foodItems && (
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 shadow-inner">
                      <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">Rincian Belanjaan JekFood:</p>
                      {activeOrder.foodItems.map((f, i) => (
                        <div key={i} className="flex justify-between text-[9px] text-slate-600 font-medium">
                          <span>{f.name} x{f.quantity}</span>
                          <span className="font-mono text-slate-500">Rp {(f.price * f.quantity).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chat with Client trigger */}
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-100 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-medium">Hubungi Pelanggan:</span>
                    <div className="flex gap-1.5">
                      <a href={`tel:08123456`} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm transition-all">
                        <Phone size={12} />
                      </a>
                      <button
                        onClick={() => setShowChat(true)}
                        className="p-1.5 rounded-lg bg-orange-brand text-white font-bold relative hover:bg-orange-600 shadow-sm transition-all"
                      >
                        <MessageSquare size={12} />
                        {chatMessages.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[6px] w-3 h-3 rounded-full flex items-center justify-center border border-white animate-bounce">
                            {chatMessages.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Step Action Trigger state machine buttons */}
                  <div className="pt-2">
                    {activeOrder.status === 'accepted' && (
                      <button
                        onClick={() => onUpdateOrderStatus('arrived')}
                        className="w-full bg-orange-brand hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm uppercase tracking-wide"
                      >
                        Tiba di Lokasi Penjemputan <ArrowRight size={13} />
                      </button>
                    )}
                    {activeOrder.status === 'arrived' && (
                      <button
                        onClick={() => onUpdateOrderStatus('enroute')}
                        className="w-full bg-navy-brand hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm uppercase tracking-wide"
                      >
                        Mulai Perjalanan (Membawa Penumpang) <ArrowRight size={13} />
                      </button>
                    )}
                    {activeOrder.status === 'enroute' && (
                      <button
                        onClick={() => {
                          onUpdateOrderStatus('completed');
                          // Add credit to driver's balance
                          onUpdateDriver({
                            ...driver,
                            walletBalance: driver.walletBalance + activeOrder.price,
                            status: 'idle',
                          });
                          onAddTransaction({
                            id: `earn-${Date.now().toString().slice(-4)}`,
                            type: 'earning',
                            amount: activeOrder.price,
                            description: `Pendapatan Selesai Order ${activeOrder.id}`,
                            timestamp: new Date().toLocaleDateString('id-ID'),
                          });
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm uppercase tracking-wide animate-pulse"
                      >
                        Selesaikan Perjalanan / Pengiriman <CheckCircle2 size={13} />
                      </button>
                    )}
                  </div>

                </div>
              ) : (
                /* Empty work list state */
                <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center space-y-2 shadow-sm">
                  <TrendingUp className="mx-auto text-slate-300 animate-bounce" size={24} />
                  <h4 className="text-xs font-bold text-slate-700">Belum ada tugas perjalanan</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Tetap online untuk menerima order dari pelanggan sekitar Anda.</p>
                </div>
              )}

            </div>
          )}

          {/* TAB: WALLET */}
          {activeTab === 'wallet' && (
            <div className="p-4 space-y-4 text-left">
              <h3 className="text-sm font-bold text-slate-800">Dompet Pendapatan Driver</h3>
              
              {/* Wallet large overview */}
              <div className="bg-gradient-to-r from-navy-brand to-indigo-950 rounded-2xl p-4 border border-navy-brand/20 text-left space-y-3 shadow-md">
                <div>
                  <span className="text-[8px] text-orange-brand bg-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    JekPay Mitra
                  </span>
                  <p className="text-[10px] text-slate-200/80 uppercase tracking-widest mt-2">Saldo Bisa Ditarik</p>
                  <p className="text-2xl font-extrabold font-mono text-white">
                    Rp {driver.walletBalance.toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="w-full bg-orange-brand hover:bg-orange-600 disabled:bg-slate-600 disabled:opacity-55 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm"
                  disabled={driver.walletBalance <= 0}
                >
                  Tarik Dana (Withdraw Ke Rekening)
                </button>
              </div>

              {/* Transactions History */}
              <div className="space-y-2 text-left">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Riwayat Pendapatan</h4>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                  {[
                    { id: 'tx-802', description: 'Order Selesai JekRide ord-9213', amount: 18000, type: 'earning', date: 'Hari ini' },
                    { id: 'tx-790', description: 'Order Selesai JekFood ord-8821', amount: 32000, type: 'earning', date: 'Kemarin' },
                  ].map((tx) => (
                    <div key={tx.id} className="bg-white rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-xs shadow-sm">
                      <div>
                        <p className="font-bold text-slate-800 text-[10px]">{tx.description}</p>
                        <p className="text-[8px] text-slate-400 mt-0.5">{tx.date} • ID: {tx.id}</p>
                      </div>
                      <span className="font-mono font-bold text-[10px] text-emerald-600">
                        + Rp {tx.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= MODAL: WITHDRAWAL FORM ================= */}
          {showWithdraw && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-40">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-[280px] space-y-4 text-left shadow-2xl">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wallet size={14} className="text-orange-brand" /> Tarik Pendapatan
                  </h4>
                  <button onClick={() => setShowWithdraw(false)} className="text-slate-400 hover:text-slate-600 p-0.5">
                    <X size={15} />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Nominal Penarikan</label>
                  <select
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-white text-xs font-mono font-bold text-orange-brand rounded-xl border border-slate-200 p-2 focus:border-orange-brand outline-none shadow-sm"
                  >
                    <option value="50000">Rp 50.000</option>
                    <option value="100000">Rp 100.000</option>
                    <option value="200000">Rp 200.000</option>
                    <option value={driver.walletBalance.toString()}>Seluruhnya (Rp {driver.walletBalance.toLocaleString('id-ID')})</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Rekening Bank Tujuan</label>
                  <select className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2 focus:border-orange-brand outline-none shadow-sm">
                    <option>BCA - 8820129381 (a/n {driver.name})</option>
                    <option>Mandiri - 1310029311 (a/n {driver.name})</option>
                    <option>BRI - 00219283182 (a/n {driver.name})</option>
                  </select>
                </div>

                <button
                  onClick={handleWithdraw}
                  className="w-full bg-orange-brand hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm uppercase tracking-wide"
                >
                  Konfirmasi Withdraw
                </button>
              </div>
            </div>
          )}

          {/* ================= OVERLAY: FLASHING INCOMING ORDER (DISPATCH) ================= */}
          {isCompatibleIncomingOrder && (
            <div className="absolute inset-x-3 top-16 bottom-3 bg-white border-2 border-orange-brand rounded-3xl p-4 flex flex-col justify-between z-50 text-left shadow-2xl animate-[pulse_2s_infinite_ease-in-out]">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-orange-brand/10 border border-orange-brand/20 p-2.5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 text-orange-brand font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-orange-brand animate-ping"></span>
                    <span>🚨 ADA ORDER MASUK!</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-400">JekExpress Dispatch</span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2.5 shadow-inner">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 text-[10px]">
                    <span className="text-slate-500">Layanan: <strong className="text-orange-brand capitalize font-bold font-mono">{activeOrder.serviceType}</strong></span>
                    <span className="text-slate-500">Metode: <span className="uppercase text-slate-700 font-bold">{activeOrder.paymentMethod}</span></span>
                  </div>

                  {/* Route points */}
                  <div className="space-y-2 text-[10px]">
                    <div className="flex gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[8px] shrink-0 shadow-sm">A</span>
                      <p className="text-slate-800 font-bold truncate flex-1">{activeOrder.pickupAddress}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-orange-100 text-orange-brand flex items-center justify-center font-bold text-[8px] shrink-0 shadow-sm">B</span>
                      <p className="text-slate-800 font-bold truncate flex-1">{activeOrder.dropoffAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Cash/Fare values */}
                <div className="bg-orange-brand/5 rounded-xl p-3 border border-orange-brand/10 flex justify-between items-center shadow-sm">
                  <span className="text-[10px] text-slate-500 font-medium">Penghasilan Driver</span>
                  <span className="font-mono font-extrabold text-orange-brand text-sm">
                    Rp {activeOrder.price.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Accept / Decline triggers */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={onDeclineOrder}
                  className="py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-bold text-xs text-center transition-all shadow-sm"
                >
                  Tolak (Decline)
                </button>
                <button
                  onClick={() => onAcceptOrder(driver.uid)}
                  className="py-2.5 rounded-xl bg-orange-brand hover:bg-orange-600 text-white font-bold text-xs text-center transition-all shadow-md uppercase tracking-wider"
                >
                  Terima (Accept)
                </button>
              </div>

            </div>
          )}

          {/* ================= MODAL: REAL-TIME IN-APP CHAT WITH CUSTOMER ================= */}
          {showChat && activeOrder && (
            <div className="absolute inset-0 bg-slate-50 flex flex-col z-40">
              
              {/* Chat Header */}
              <div className="bg-white p-3 border-b border-slate-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowChat(false)}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <X size={13} />
                  </button>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-800 font-sans">Hubungi Pelanggan</h4>
                    <p className="text-[8px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Pelanggan Aktif
                    </p>
                  </div>
                </div>
                <span className="text-[8px] text-slate-400 font-mono">Order ID: {activeOrder.id}</span>
              </div>

              {/* Quick replies */}
              <div className="bg-white p-2 border-b border-slate-100 flex gap-1.5 overflow-x-auto select-none no-scrollbar shadow-sm">
                {[
                  'Saya segera meluncur ke lokasi',
                  'Saya sudah sampai di titik jemput ya',
                  'Siap, sesuai aplikasi ya',
                  'Sama-sama, selamat sampai tujuan!',
                ].map((reply) => (
                  <button
                    key={reply}
                    onClick={() => onAddChatMessage(reply)}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-[8px] font-semibold py-1 px-2.5 rounded-full border border-slate-200 whitespace-nowrap shadow-inner"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Chat logs */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col bg-slate-100/50">
                {chatMessages.length === 0 ? (
                  <div className="my-auto text-center space-y-1">
                    <MessageSquare className="mx-auto text-slate-300" size={22} />
                    <p className="text-[10px] text-slate-400 leading-normal">Kirim pesan pertama ke pelanggan Anda.</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.sender === 'driver';
                    return (
                      <div
                        key={msg.id}
                        className={`max-w-[75%] p-2 rounded-2xl text-[11px] leading-snug shadow-sm ${
                          isMe
                            ? 'bg-orange-brand text-white rounded-br-none self-end font-medium'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none self-start font-medium'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span className={`block text-[7px] opacity-75 mt-0.5 text-right font-mono ${isMe ? 'text-slate-100' : 'text-slate-400'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat input */}
              <div className="bg-white p-2.5 border-t border-slate-100 flex gap-1.5 shadow-md">
                <input
                  type="text"
                  placeholder="Ketik pesan mitra..."
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && typedMessage.trim()) {
                      onAddChatMessage(typedMessage);
                      setTypedMessage('');
                    }
                  }}
                  className="flex-1 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 px-3 py-1.5 focus:border-orange-brand outline-none shadow-inner"
                />
                <button
                  onClick={() => {
                    if (typedMessage.trim()) {
                      onAddChatMessage(typedMessage);
                      setTypedMessage('');
                    }
                  }}
                  className="p-2 bg-orange-brand hover:bg-orange-600 rounded-xl text-white font-bold transition-all shadow-sm"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Bottom navigation bar */}
          <div className="absolute bottom-0 inset-x-0 h-14 bg-white border-t border-slate-100/80 flex items-center justify-around text-slate-400 z-30 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-0.5 w-20 py-1 transition-all ${
                activeTab === 'dashboard' ? 'text-orange-brand font-bold' : 'hover:text-slate-600'
              }`}
            >
              <TrendingUp size={18} />
              <span className="text-[9px] tracking-wide">Pekerjaan</span>
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex flex-col items-center gap-0.5 w-20 py-1 transition-all ${
                activeTab === 'wallet' ? 'text-orange-brand font-bold' : 'hover:text-slate-600'
              }`}
            >
              <Wallet size={18} />
              <span className="text-[9px] tracking-wide">Dompet</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
